-- Candidat producție HUB AUTO: 03_IMPORT_DF_EP.sql; PREGĂTIT, NEAPLICAT.
-- Proiect țintă: xyovkxmtbvgcwavuyxxu. Fără seed, date LAB sau migrări cleanup.
-- Proveniență: INTEGRARE_DF_LAB_20261105.sql; se aplică numai după review, backup și aprobare separată.
BEGIN;
DO $preflight$ BEGIN
 IF current_user<>'postgres' OR to_regnamespace('ep_private') IS NULL THEN RAISE EXCEPTION 'Preflight EP/owner invalid'; END IF;
 IF md5(pg_get_functiondef('public.save_deviz_final(bigint,jsonb,jsonb)'::regprocedure))<>'eca2da13bc75babb0a49d6706c4331dd' THEN RAISE EXCEPTION 'Definiția DF s-a schimbat; reia inspecția'; END IF;
END $preflight$;
-- Identitatea sursei și prețurile rămân pe linia DF; nu se creează un tabel nou.
ALTER TABLE public.deviz_final_header ADD COLUMN ep_revision bigint NOT NULL DEFAULT 0 CHECK(ep_revision>=0);
ALTER TABLE public.deviz_final_linii
 ADD COLUMN ep_import_id uuid,
 ADD COLUMN ep_alocare_id uuid REFERENCES public.ep_alocari(id) ON DELETE RESTRICT,
 ADD COLUMN ep_snapshot jsonb,
 ADD CONSTRAINT ep_df_source_complete CHECK (
  (ep_import_id IS NULL AND ep_alocare_id IS NULL AND ep_snapshot IS NULL) OR
  (ep_import_id IS NOT NULL AND ep_alocare_id IS NOT NULL AND ep_snapshot IS NOT NULL AND jsonb_typeof(ep_snapshot)='object'
   AND sectiune IS NOT DISTINCT FROM 'piese' AND avans_id IS NULL AND comanda_piesa_sh_id IS NULL
   AND cantitate IS NOT NULL AND cantitate>0 AND cantitate=trunc(cantitate)));
CREATE UNIQUE INDEX ep_df_import_uuid ON public.deviz_final_linii(ep_import_id) WHERE ep_import_id IS NOT NULL;
CREATE UNIQUE INDEX ep_df_allocation_once ON public.deviz_final_linii(id_deviz_final,ep_alocare_id) WHERE ep_alocare_id IS NOT NULL;
CREATE INDEX ep_df_capacity_source ON public.deviz_final_linii(ep_alocare_id) WHERE ep_alocare_id IS NOT NULL;

-- Același lock precedă antetul DF, avansurile și toate operațiile cantitative EP.
CREATE FUNCTION ep_private.df_lock() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $f$
BEGIN PERFORM pg_advisory_xact_lock(19520,7001); RETURN NULL; END $f$;
CREATE TRIGGER ep_df_serialize BEFORE INSERT OR UPDATE OR DELETE ON public.deviz_final_header
 FOR EACH STATEMENT EXECUTE FUNCTION ep_private.df_lock();
CREATE TRIGGER ep_df_serialize BEFORE INSERT OR UPDATE OR DELETE ON public.deviz_final_linii
 FOR EACH STATEMENT EXECUTE FUNCTION ep_private.df_lock();

-- Coloanele/snapshot-ul EP se scriu numai de gateway; DELETE-ul administrativ existent rămâne permis.
CREATE FUNCTION ep_private.df_protect_source() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $f$
BEGIN
 IF current_user<>'postgres' AND (NEW.ep_import_id IS NOT NULL OR (TG_OP='UPDATE' AND OLD.ep_import_id IS NOT NULL)) THEN
  RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Pozițiile din facturi se modifică prin salvarea atomică DF';
 END IF;
 RETURN NEW;
END $f$;
CREATE TRIGGER ep_df_protect BEFORE INSERT OR UPDATE ON public.deviz_final_linii
 FOR EACH ROW EXECUTE FUNCTION ep_private.df_protect_source();
CREATE FUNCTION ep_private.df_protect_header() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $f$
BEGIN
 IF current_user<>'postgres' AND EXISTS(SELECT 1 FROM public.deviz_final_linii WHERE id_deviz_final=OLD.id_deviz_final AND ep_import_id IS NOT NULL)
 AND (NEW.nr_inmatriculare IS DISTINCT FROM OLD.nr_inmatriculare OR NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id) THEN
  RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Mașina unui DF cu importuri se modifică prin RPC';
 END IF; RETURN NEW;
END $f$;
CREATE TRIGGER ep_df_protect BEFORE UPDATE ON public.deviz_final_header
 FOR EACH ROW EXECUTE FUNCTION ep_private.df_protect_header();
-- Ștergerea existentă eliberează sursa, schimbă revizia și păstrează snapshot-ul în audit.
CREATE FUNCTION ep_private.df_deleted_line() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 UPDATE public.deviz_final_header SET ep_revision=ep_revision+1 WHERE id_deviz_final=OLD.id_deviz_final;
 INSERT INTO public.audit_logs(user_id,modul,actiune,entitate,entitate_id,descriere)
 VALUES(auth.uid(),'Evidență Facturi & Piese','df_source_line_removed','deviz_final',OLD.id_deviz_final::text,
  jsonb_build_object('before',to_jsonb(OLD))::text);
 RETURN OLD;
END $f$;
CREATE TRIGGER ep_df_release AFTER DELETE ON public.deviz_final_linii
 FOR EACH ROW WHEN(OLD.ep_import_id IS NOT NULL) EXECUTE FUNCTION ep_private.df_deleted_line();

CREATE FUNCTION ep_private.require_df() RETURNS uuid LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $f$
DECLARE u uuid:=auth.uid(); BEGIN
 IF u IS NULL OR NOT EXISTS(SELECT 1 FROM public.auth_profiles WHERE id=u AND (rol_id=1 OR permissions->'deviz_final'='true'::jsonb)) THEN
  RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Nu aveți permisiunea deviz_final.';
 END IF; RETURN u;
END $f$;

-- Vehiculul poate fi identificat după înmatriculare fără a crea o fișă auto obligatorie.
CREATE FUNCTION ep_private.df_context(p_plate text,p_vin text,p_vehicle bigint,p_df bigint)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $f$
DECLARE pl text:=ep_private.plate(p_plate); vid bigint; oldvid bigint;
BEGIN
 IF pl='' THEN RAISE EXCEPTION 'Selectează mașina în antetul devizului'; END IF;
 vid:=private.resolve_deviz_final_vehicle(pl,ep_private.plate(p_vin));
 IF p_df IS NOT NULL THEN
  SELECT vehicle_id INTO oldvid FROM public.deviz_final_header WHERE id_deviz_final=p_df;
  IF NOT FOUND THEN RAISE EXCEPTION 'Devizul final nu există'; END IF;
 END IF;
 IF p_vehicle IS NOT NULL AND p_vehicle IS DISTINCT FROM vid THEN RAISE EXCEPTION 'Identitatea mașinii nu corespunde antetului'; END IF;
 IF oldvid IS NOT NULL AND oldvid IS DISTINCT FROM vid THEN RAISE EXCEPTION 'Mașina nu corespunde devizului salvat'; END IF;
 RETURN jsonb_build_object('plate',pl,'vehicle_id',vid);
END $f$;

-- Citire contextuală: sunt necesare ambele bife pentru alegerea unei surse noi.
CREATE FUNCTION ep_private.list_df_parts(p_plate text,p_vin text,p_vehicle bigint,p_df bigint)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE ctx jsonb;
BEGIN
 PERFORM ep_private.require_df(); PERFORM ep_private.require_access();
 ctx:=ep_private.df_context(p_plate,p_vin,p_vehicle,p_df);
 RETURN coalesce((SELECT jsonb_agg(row ORDER BY row->>'supplier',row->>'invoice_number',row->>'name') FROM (
  SELECT jsonb_build_object('allocation_id',a.id,'line_id',l.id,'invoice_id',f.id,'source_revision',f.revision,
   'supplier',f.furnizor_denumire_originala,'invoice_number',f.numar,'invoice_date',f.data_factura,
   'name',l.denumire,'code',coalesce(l.cod_piesa,''),'plate',a.nr_inmatriculare_original,
   'purchase_net',l.pret_achizitie_net::text,'vat',l.tva_proc::text,'multiplier',l.coeficient_df::text,
   'unit_price',(l.pret_achizitie_net*l.coeficient_df*(1+l.tva_proc/100))::text,
   'available',ep_private.capacity(l.id,a.id)+coalesce((SELECT sum(d.cantitate) FROM public.deviz_final_linii d WHERE d.ep_alocare_id=a.id AND d.id_deviz_final=p_df),0)) AS row
  FROM public.ep_alocari a JOIN public.ep_factura_linii l ON l.id=a.linie_id JOIN public.ep_facturi f ON f.id=l.factura_id
  WHERE l.blocaj_istoric IS NULL AND
   ((a.vehicle_id IS NOT NULL AND a.vehicle_id=(ctx->>'vehicle_id')::bigint) OR
    (a.vehicle_id IS NULL AND a.nr_inmatriculare_original=ctx->>'plate'))
 ) q WHERE (row->>'available')::numeric>0),'[]'::jsonb);
END $f$;
CREATE FUNCTION public.ep_list_df_parts(p_plate text,p_vin text DEFAULT '',p_vehicle bigint DEFAULT NULL,p_df bigint DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $f$
 SELECT ep_private.list_df_parts(p_plate,p_vin,p_vehicle,p_df) $f$;


CREATE OR REPLACE FUNCTION ep_private.save_df_base(p_deviz_id bigint, p_header jsonb, p_lines jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := (select auth.uid());
  v_existing public.deviz_final_header%rowtype;
  v_deviz_id bigint;
  v_plate text;
  v_vin text;
  v_lookup_vehicle_id bigint;
  v_constatare_vehicle_id bigint;
  v_vehicle_id bigint;
  v_requested_vehicle_id bigint;
  v_estimativ_id bigint;
  v_discount numeric;
  v_qty numeric;
  v_price numeric;
  v_apply_discount numeric;
  v_exact numeric;
  v_line_total numeric;
  v_total_manopera numeric := 0;
  v_total_piese numeric := 0;
  v_total_avans numeric := 0;
  v_total_general numeric;
  v_line jsonb;
  v_section text;
  v_name text;
  v_nr integer;
  v_expected_lucrari integer := 0;
  v_expected_constatari integer := 0;
  v_expected_manopera integer := 0;
  v_expected_piese integer := 0;
  v_expected_avans integer := 0;
  v_avans_id bigint;
  v_sh_id bigint;
  v_ids bigint[] := '{}'::bigint[];
  v_avans_amounts jsonb := '{}'::jsonb;
  v_advance public.evidente_avansuri%rowtype;
  v_payment record;
  v_owner bigint;
  v_review_status text;
  v_paid numeric;
  v_locked_count integer := 0;
  v_legacy_part boolean := false;
begin
  if v_user_id is null or not exists (
    select 1 from public.auth_profiles profile
    where profile.id = v_user_id
      and (profile.rol_id = 1 or
           coalesce(profile.permissions::jsonb, '{}'::jsonb) @> '{"deviz_final": true}'::jsonb)
  ) then
    raise exception using errcode = '42501', message = 'Nu aveți permisiunea deviz_final.';
  end if;
  if p_deviz_id is not null and p_deviz_id <= 0 then
    raise exception using errcode = '22023', message = 'ID-ul devizului este invalid.';
  end if;
  if pg_catalog.jsonb_typeof(p_header) is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_lines) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Antetul sau liniile au structură invalidă.';
  end if;
  if nullif(pg_catalog.btrim(p_header ->> 'data_deviz'), '') is null then
    raise exception using errcode = '22023', message = 'Data devizului este obligatorie.';
  end if;
  v_plate := upper(pg_catalog.regexp_replace(coalesce(p_header ->> 'nr_inmatriculare', ''), '[^A-Za-z0-9]', '', 'g'));
  v_vin := upper(pg_catalog.regexp_replace(coalesce(p_header ->> 'serie_vin', ''), '[^A-Za-z0-9]', '', 'g'));
  if v_plate = '' then
    raise exception using errcode = '22023', message = 'Numărul auto este obligatoriu.';
  end if;

  -- Blocarea antetului precedă blocarea avansurilor. Legăturile existente sunt păstrate.
  if p_deviz_id is not null then
    select * into v_existing
    from public.deviz_final_header
    where id_deviz_final = p_deviz_id
    for update;
    if not found then
      raise exception using errcode = '22023', message = 'Devizul final nu există.';
    end if;
  end if;
  if nullif(p_header ->> 'id_deviz_estimativ', '') is not null then
    if (p_header ->> 'id_deviz_estimativ') !~ '^[0-9]+$' then
      raise exception using errcode = '22023', message = 'id_deviz_estimativ invalid.';
    end if;
    v_estimativ_id := (p_header ->> 'id_deviz_estimativ')::bigint;
    if v_estimativ_id <= 0 then
      raise exception using errcode = '22023', message = 'id_deviz_estimativ invalid.';
    end if;
  else
    v_estimativ_id := v_existing.id_deviz_estimativ;
  end if;

  v_discount := coalesce(nullif(p_header ->> 'discount_global_piese', '')::numeric, 0);
  if v_discount < 0 or v_discount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception using errcode = '22023', message = 'Discountul global este invalid.';
  end if;

  -- Prima trecere verifică secțiunile, ordinea și ID-urile înainte de orice scriere.
  for v_line in select value from pg_catalog.jsonb_array_elements(p_lines) loop
    if pg_catalog.jsonb_typeof(v_line) is distinct from 'object' then
      raise exception using errcode = '22023', message = 'O linie nu este obiect JSON.';
    end if;
    v_section := lower(pg_catalog.btrim(coalesce(v_line ->> 'sectiune', '')));
    if v_section not in ('lucrari', 'constatari', 'manopera', 'piese', 'avans') then
      raise exception using errcode = '22023', message = 'Secțiune de deviz invalidă.';
    end if;
    if coalesce(v_line ->> 'nr_crt', '') !~ '^[0-9]+$' then
      raise exception using errcode = '22023', message = 'nr_crt trebuie să fie întreg pozitiv.';
    end if;
    v_nr := (v_line ->> 'nr_crt')::integer;
    if v_nr <= 0 then
      raise exception using errcode = '22023', message = 'nr_crt trebuie să fie întreg pozitiv.';
    end if;
    case v_section
      when 'lucrari' then
        v_expected_lucrari := v_expected_lucrari + 1;
        if v_nr <> v_expected_lucrari then raise exception using errcode = '22023', message = 'Ordine lucrari invalidă.'; end if;
      when 'constatari' then
        v_expected_constatari := v_expected_constatari + 1;
        if v_nr <> v_expected_constatari then raise exception using errcode = '22023', message = 'Ordine constatari invalidă.'; end if;
      when 'manopera' then
        v_expected_manopera := v_expected_manopera + 1;
        if v_nr <> v_expected_manopera then raise exception using errcode = '22023', message = 'Ordine manopera invalidă.'; end if;
      when 'piese' then
        v_expected_piese := v_expected_piese + 1;
        if v_nr <> v_expected_piese then raise exception using errcode = '22023', message = 'Ordine piese invalidă.'; end if;
      when 'avans' then
        v_expected_avans := v_expected_avans + 1;
        if v_nr <> v_expected_avans then raise exception using errcode = '22023', message = 'Ordine avans invalidă.'; end if;
    end case;
    if v_section = 'constatari' and nullif(v_line ->> 'discount', '') is not null
       and (v_line ->> 'discount') not in ('0', '1') then
      raise exception using errcode = '22023', message = 'Indicatorul de acceptare este invalid.';
    end if;
    if v_section = 'avans' then
      if coalesce(v_line ->> 'avans_id', '') !~ '^[0-9]+$' then
        raise exception using errcode = '22023', message = 'avans_id invalid.';
      end if;
      v_avans_id := (v_line ->> 'avans_id')::bigint;
      if v_avans_id <= 0 or v_avans_id = any(v_ids) then
        raise exception using errcode = '22023', message = 'avans_id duplicat sau invalid.';
      end if;
      v_ids := pg_catalog.array_append(v_ids, v_avans_id);
    elsif v_line ->> 'avans_id' is not null then
      raise exception using errcode = '22023', message = 'Numai secțiunea avans poate avea avans_id.';
    end if;
    if v_section <> 'piese' and v_line ->> 'comanda_piesa_sh_id' is not null then
      raise exception using errcode = '22023', message = 'Legătura SH este permisă numai pentru piese.';
    end if;
  end loop;

  -- Vehiculul se rezolvă strict la import sau când apelantul cere explicit legătura.
  if pg_catalog.cardinality(v_ids) > 0
     or nullif(p_header ->> 'vehicle_id', '') is not null then
    v_lookup_vehicle_id := private.resolve_deviz_final_vehicle(v_plate, v_vin);
  end if;
  if v_existing.constatare_id is not null then
    select c.vehicle_id into v_constatare_vehicle_id
    from public.constatari c where c.id = v_existing.constatare_id;
  end if;
  if v_existing.vehicle_id is not null and v_constatare_vehicle_id is not null
     and v_existing.vehicle_id <> v_constatare_vehicle_id then
    raise exception using errcode = '22023', message = 'Identitatea vehiculului este contradictorie.';
  end if;
  v_vehicle_id := coalesce(v_existing.vehicle_id, v_constatare_vehicle_id, v_lookup_vehicle_id);
  if v_vehicle_id is not null and v_lookup_vehicle_id is not null
     and v_vehicle_id <> v_lookup_vehicle_id then
    raise exception using errcode = '22023', message = 'Numărul auto indică un alt vehicul.';
  end if;
  -- La import, numărul transmis trebuie să existe acum în registru și să indice
  -- exact vehiculul păstrat în deviz (sau în constatare); un număr vechi nu ajunge.
  if pg_catalog.cardinality(v_ids) > 0
     and (v_lookup_vehicle_id is null or v_vehicle_id is distinct from v_lookup_vehicle_id) then
    raise exception using errcode = '22023', message = 'Numărul auto nu confirmă vehiculul devizului în registru.';
  end if;
  if nullif(p_header ->> 'vehicle_id', '') is not null then
    if (p_header ->> 'vehicle_id') !~ '^[0-9]+$' then
      raise exception using errcode = '22023', message = 'vehicle_id invalid.';
    end if;
    v_requested_vehicle_id := (p_header ->> 'vehicle_id')::bigint;
    if v_requested_vehicle_id <= 0 or v_vehicle_id is distinct from v_requested_vehicle_id then
      raise exception using errcode = '22023', message = 'vehicle_id nu corespunde identității verificate.';
    end if;
  end if;

  -- Lock în ordine de ID: fișa oprește inserări FK/KEY SHARE, rândurile plății opresc UPDATE/DELETE.
  for v_advance in
    select a.* from public.evidente_avansuri a
    where a.id = any(v_ids)
    order by a.id for update
  loop
    v_locked_count := v_locked_count + 1;
    select l.id_deviz_final into v_owner
    from public.deviz_final_linii l where l.avans_id = v_advance.id;
    if v_owner is not null and v_owner is distinct from p_deviz_id then
      raise exception using errcode = '23505', message = 'Avansul aparține altui deviz final.';
    end if;
    if v_owner is null then
      select r.status into v_review_status
      from private.deviz_final_avans_review r where r.avans_id = v_advance.id;
      if v_review_status is distinct from 'confirmed_available' then
        raise exception using errcode = '22023', message = 'Istoricul avansului nu este confirmat ca disponibil.';
      end if;
      if v_advance.este_arhivat is true then
        raise exception using errcode = '22023', message = 'Un avans arhivat nu poate fi revendicat prima dată.';
      end if;
    end if;
    if v_vehicle_id is null then
      raise exception using errcode = '22023', message = 'Vehiculul trebuie identificat unic înainte de import.';
    end if;
    if v_advance.vehicle_id is not null then
      if v_advance.vehicle_id <> v_vehicle_id then
        raise exception using errcode = '22023', message = 'Avansul aparține altui vehicul.';
      end if;
    elsif upper(pg_catalog.regexp_replace(coalesce(v_advance.nr_inmatriculare, ''), '[^A-Za-z0-9]', '', 'g')) <> v_plate then
      raise exception using errcode = '22023', message = 'Numărul auto al avansului vechi nu corespunde.';
    end if;
    v_paid := 0;
    for v_payment in
      select p.id, p.suma from public.evidente_avansuri_plati p
      where p.avans_id = v_advance.id order by p.id for update
    loop
      if v_payment.suma <= 0 or v_payment.suma::text in ('NaN', 'Infinity', '-Infinity') then
        raise exception using errcode = '22023', message = 'Plata avansului are sumă invalidă.';
      end if;
      v_paid := v_paid + v_payment.suma;
    end loop;
    if v_paid <= 0 or v_paid::text in ('NaN', 'Infinity', '-Infinity') then
      raise exception using errcode = '22023', message = 'Avansul nu are plăți pozitive.';
    end if;
    v_avans_amounts := v_avans_amounts || pg_catalog.jsonb_build_object(v_advance.id::text, v_paid);
    v_total_avans := v_total_avans + v_paid;
  end loop;
  if v_locked_count <> pg_catalog.cardinality(v_ids) then
    raise exception using errcode = '22023', message = 'Cel puțin un avans nu există.';
  end if;

  -- Antet, legături și linii se scriu în aceeași tranzacție RPC.
  if p_deviz_id is null then
    insert into public.deviz_final_header (
      id_deviz_estimativ, data_deviz, client, auto, nr_inmatriculare,
      serie_vin, serie_motor, km, termen_executie, discount_global_piese,
      vehicle_id, total_manopera, total_piese, total_avans, total_general, created_by
    ) values (
      v_estimativ_id, pg_catalog.btrim(p_header ->> 'data_deviz'),
      coalesce(p_header ->> 'client', ''), coalesce(p_header ->> 'auto', ''), v_plate,
      coalesce(p_header ->> 'serie_vin', ''), coalesce(p_header ->> 'serie_motor', ''),
      coalesce(p_header ->> 'km', ''), coalesce(p_header ->> 'termen_executie', ''),
      v_discount, v_vehicle_id, 0, 0, 0, 0, v_user_id
    ) returning id_deviz_final into v_deviz_id;
  else
    v_deviz_id := p_deviz_id;
    update public.deviz_final_header set
      id_deviz_estimativ = v_estimativ_id,
      data_deviz = pg_catalog.btrim(p_header ->> 'data_deviz'),
      client = coalesce(p_header ->> 'client', ''),
      auto = coalesce(p_header ->> 'auto', ''),
      nr_inmatriculare = v_plate,
      serie_vin = coalesce(p_header ->> 'serie_vin', ''),
      serie_motor = coalesce(p_header ->> 'serie_motor', ''),
      km = coalesce(p_header ->> 'km', ''),
      termen_executie = coalesce(p_header ->> 'termen_executie', ''),
      discount_global_piese = v_discount,
      vehicle_id = v_vehicle_id
    where id_deviz_final = v_deviz_id;
    delete from public.deviz_final_linii where id_deviz_final = v_deviz_id;
  end if;

  for v_line in select value from pg_catalog.jsonb_array_elements(p_lines) loop
    v_section := lower(pg_catalog.btrim(v_line ->> 'sectiune'));
    v_nr := (v_line ->> 'nr_crt')::integer;
    v_name := coalesce(v_line ->> 'denumire', '');
    if v_section in ('lucrari', 'constatari') then
      insert into public.deviz_final_linii (
        id_deviz_final, sectiune, nr_crt, denumire, detalii, discount
      ) values (
        v_deviz_id, v_section, v_nr, v_name,
        case when v_section = 'lucrari' then coalesce(v_line ->> 'detalii', '') else null end,
        case when v_section = 'constatari' then coalesce(nullif(v_line ->> 'discount', '')::numeric, 0) else null end
      );
    elsif v_section in ('manopera', 'piese') then
      v_qty := coalesce(nullif(v_line ->> 'cantitate', '')::numeric, 0);
      v_price := coalesce(nullif(v_line ->> 'pret_unitar', '')::numeric, 0);
      if v_qty::text in ('NaN', 'Infinity', '-Infinity')
         or v_price::text in ('NaN', 'Infinity', '-Infinity') then
        raise exception using errcode = '22023', message = 'Cantitatea sau prețul nu este finit.';
      end if;
      if v_section = 'manopera' then
        v_line_total := pg_catalog.round(v_qty * v_price, 2);
        v_total_manopera := v_total_manopera + v_line_total;
        insert into public.deviz_final_linii (
          id_deviz_final, sectiune, nr_crt, denumire, cantitate, pret_unitar, total
        ) values (v_deviz_id, 'manopera', v_nr, v_name, v_qty, v_price, v_line_total);
      else
        v_apply_discount := coalesce(nullif(v_line ->> 'discount', '')::numeric, 0);
        if v_apply_discount not in (0, 1) then
          raise exception using errcode = '22023', message = 'Indicatorul de discount al piesei este invalid.';
        end if;
        if nullif(v_line ->> 'comanda_piesa_sh_id', '') is not null then
          if (v_line ->> 'comanda_piesa_sh_id') !~ '^[0-9]+$' then
            raise exception using errcode = '22023', message = 'comanda_piesa_sh_id invalid.';
          end if;
          v_sh_id := (v_line ->> 'comanda_piesa_sh_id')::bigint;
          if v_sh_id <= 0 then
            raise exception using errcode = '22023', message = 'comanda_piesa_sh_id invalid.';
          end if;
        else
          v_sh_id := null;
        end if;
        v_exact := v_qty * v_price * (1 - case when v_apply_discount = 1 then v_discount / 100 else 0 end);
        if v_exact::text in ('NaN', 'Infinity', '-Infinity') then
          raise exception using errcode = '22023', message = 'Valoarea piesei nu este finită.';
        end if;
        -- Numai importurile EP folosesc netul/TVA/coeficientul înghețate și componente la cent.
        if v_line->>'ep_import_id' is not null then
          v_exact := (pg_catalog.round(v_qty*(v_line->'ep_snapshot'->>'purchase_net')::numeric*(v_line->'ep_snapshot'->>'multiplier')::numeric,2)
           +pg_catalog.round(v_qty*(v_line->'ep_snapshot'->>'purchase_net')::numeric*(v_line->'ep_snapshot'->>'multiplier')::numeric*(v_line->'ep_snapshot'->>'vat')::numeric/100,2))
           *(1-case when v_apply_discount=1 then v_discount/100 else 0 end);
        end if;
        -- Antetul păstrează suma exactă după discount; linia afișată are doi zecimali.
        v_line_total := pg_catalog.round(v_exact, 2);
        v_total_piese := v_total_piese + v_exact;
        if v_exact < 0 and v_name ilike '%AVANS%' then v_legacy_part := true; end if;
        insert into public.deviz_final_linii (
          id, id_deviz_final, sectiune, nr_crt, denumire, um, cantitate,
          pret_unitar, discount, total, comanda_piesa_sh_id,ep_import_id,ep_alocare_id,ep_snapshot
        ) values (
          coalesce((v_line->>'ep_saved_line_id')::bigint,nextval(pg_get_serial_sequence('public.deviz_final_linii','id'))),
          v_deviz_id, 'piese', v_nr, v_name,
          coalesce(nullif(v_line ->> 'um', ''), 'buc'), v_qty,
          v_price, v_apply_discount, v_line_total, v_sh_id,(v_line->>'ep_import_id')::uuid,(v_line->>'ep_alocare_id')::uuid,v_line->'ep_snapshot'
        );
      end if;
    else
      v_avans_id := (v_line ->> 'avans_id')::bigint;
      insert into public.deviz_final_linii (
        id_deviz_final, sectiune, nr_crt, denumire, total, avans_id
      ) values (
        v_deviz_id, 'avans', v_nr, 'Avans achitat',
        (v_avans_amounts ->> v_avans_id::text)::numeric, v_avans_id
      );
    end if;
  end loop;

  if pg_catalog.cardinality(v_ids) > 0 and v_legacy_part then
    raise exception using errcode = '22023', message = 'Eliminați explicit linia veche de avans negativ înainte de import.';
  end if;
  v_total_general := v_total_manopera + v_total_piese - v_total_avans;
  if v_total_manopera::text in ('NaN', 'Infinity', '-Infinity')
     or v_total_piese::text in ('NaN', 'Infinity', '-Infinity')
     or v_total_general::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception using errcode = '22023', message = 'Totalurile trebuie să fie finite.';
  end if;
  update public.deviz_final_header set
    total_manopera = v_total_manopera,
    total_piese = v_total_piese,
    total_avans = v_total_avans,
    total_general = v_total_general
  where id_deviz_final = v_deviz_id;

  return pg_catalog.jsonb_build_object(
    'id_deviz_final', v_deviz_id,
    'vehicle_id', v_vehicle_id,
    'total_manopera', v_total_manopera,
    'total_piese', v_total_piese,
    'total_avans', v_total_avans,
    'total_general', v_total_general,
    'avansuri', v_avans_amounts
  );
end;
$function$
;
CREATE OR REPLACE FUNCTION ep_private.capacity(p_line uuid, p_allocation uuid DEFAULT NULL::uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
DECLARE q bigint;
BEGIN
 IF p_allocation IS NULL THEN
   SELECT cantitate INTO STRICT q FROM public.ep_factura_linii WHERE id=p_line;
   q := q - coalesce((SELECT sum(cantitate) FROM public.ep_alocari WHERE linie_id=p_line),0);
 ELSE
   SELECT cantitate INTO STRICT q FROM public.ep_alocari WHERE id=p_allocation AND linie_id=p_line;
 END IF;
 RETURN q
   - coalesce((SELECT sum(cantitate) FROM public.ep_retururi
               WHERE linie_id=p_line AND alocare_id IS NOT DISTINCT FROM p_allocation),0)
   - coalesce((SELECT sum(cantitate) FROM public.ep_transferuri_magazie
               WHERE linie_id=p_line AND alocare_id IS NOT DISTINCT FROM p_allocation),0)
   - coalesce((SELECT sum(cantitate) FROM public.deviz_final_linii WHERE ep_alocare_id=p_allocation),0);
END $function$
;
CREATE OR REPLACE FUNCTION ep_private.save_allocations(p_request uuid, p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r jsonb; b jsonb:='[]'; a jsonb:='[]'; j jsonb;
  l public.ep_factura_linii%ROWTYPE; f public.ep_facturi%ROWTYPE; old public.ep_alocari%ROWTYPE;
  aid uuid; lid uuid; q integer; available bigint; pl text; vid bigint;
  uid uuid:=ep_private.require_access(); invoices uuid[]:=ARRAY[]::uuid[]; ids uuid[]:=ARRAY[]::uuid[];
BEGIN
 r:=ep_private.begin_request(p_request,'save_allocations',p); IF r IS NOT NULL THEN RETURN r; END IF;
 IF jsonb_typeof(p->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(p->'items')=0 THEN
   RAISE EXCEPTION 'Lista de atribuiri este goală';
 END IF;
 FOR j IN SELECT value FROM jsonb_array_elements(p->'items') LOOP
   aid:=(j->>'id')::uuid; lid:=(j->>'linie_id')::uuid; q:=ep_private.qty(j->'cantitate');
   IF aid IS NULL OR aid=ANY(ids) THEN RAISE EXCEPTION 'ID alocare lipsă/duplicat'; END IF;
   ids:=array_append(ids,aid); pl:=ep_private.plate(j->>'nr_inmatriculare');
   vid:=(j->>'vehicle_id')::bigint;
   SELECT * INTO STRICT l FROM public.ep_factura_linii WHERE id=lid;
   SELECT * INTO STRICT f FROM public.ep_facturi WHERE id=l.factura_id FOR UPDATE;
   IF f.revision IS DISTINCT FROM (j->>'expected_revision')::bigint THEN RAISE EXCEPTION 'Factura a fost modificată'; END IF;
   IF l.blocaj_istoric IS NOT NULL THEN RAISE EXCEPTION 'Poziție cu istoric protejat'; END IF;
   PERFORM ep_private.check_vehicle(vid,pl);
   SELECT * INTO old FROM public.ep_alocari WHERE id=aid;
   available:=ep_private.capacity(lid,NULL);
   IF old.id IS NOT NULL THEN
     IF old.linie_id<>lid OR EXISTS(SELECT 1 FROM public.ep_retururi WHERE alocare_id=aid)
        OR EXISTS(SELECT 1 FROM public.ep_transferuri_magazie WHERE alocare_id=aid)
        OR EXISTS(SELECT 1 FROM public.deviz_final_linii WHERE ep_alocare_id=aid) THEN
       RAISE EXCEPTION 'Alocare folosită/protejată sau sursă diferită';
     END IF;
     available:=available+old.cantitate;
     b:=b||jsonb_build_array(to_jsonb(old));
   END IF;
   IF q>available THEN RAISE EXCEPTION 'Cantitatea depășește disponibilul'; END IF;
   IF old.id IS NOT NULL THEN
     UPDATE public.ep_alocari SET vehicle_id=vid,nr_inmatriculare_original=pl,
       model_original=j->>'model',cantitate=q WHERE id=aid;
   ELSE
     INSERT INTO public.ep_alocari(id,linie_id,vehicle_id,nr_inmatriculare_original,
       model_original,cantitate,created_by)
       VALUES(aid,lid,vid,pl,j->>'model',q,uid);
   END IF;
   PERFORM ep_private.validate_line(lid);
   SELECT a||jsonb_build_array(to_jsonb(x)) INTO a FROM public.ep_alocari x WHERE x.id=aid;
   IF NOT(f.id=ANY(invoices)) THEN invoices:=array_append(invoices,f.id); END IF;
 END LOOP;
 UPDATE public.ep_facturi SET revision=revision+1 WHERE id=ANY(invoices);
 SELECT jsonb_build_object('allocations',a,'invoices',
   coalesce(jsonb_agg(jsonb_build_object('id',id,'revision',revision) ORDER BY id),'[]'::jsonb))
   INTO r FROM public.ep_facturi WHERE id=ANY(invoices);
 RETURN ep_private.finish_request(p_request,'save_allocations',p,'ep_alocari',
   NULL,b,a,r);
END $function$
;
CREATE OR REPLACE FUNCTION ep_private.load_registry()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 PERFORM ep_private.require_access();
 RETURN jsonb_build_object(
  'suppliers',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.denumire,s.id) FROM public.ep_furnizori s),'[]'::jsonb),
  'accounts',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.id) FROM public.ep_furnizor_conturi a),'[]'::jsonb),
  'invoices',coalesce((SELECT jsonb_agg(to_jsonb(f) ORDER BY f.data_factura DESC,f.id) FROM public.ep_facturi f),'[]'::jsonb),
  'lines',coalesce((SELECT jsonb_agg(to_jsonb(l)||jsonb_build_object(
    'pret_achizitie_net',l.pret_achizitie_net::text,'tva_proc',l.tva_proc::text,
    'coeficient_df',l.coeficient_df::text) ORDER BY l.factura_id,l.nr_crt) FROM public.ep_linii_valori l),'[]'::jsonb),
  'allocations',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at,a.id) FROM public.ep_alocari a),'[]'::jsonb),
  'returns',coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at,r.id) FROM public.ep_retururi r),'[]'::jsonb),
  'transfers',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at,t.id) FROM public.ep_transferuri_magazie t),'[]'::jsonb),
  'imports',coalesce((SELECT jsonb_agg(jsonb_build_object(
    'id',d.ep_import_id,'allocation_id',d.ep_alocare_id,'part_id',a.linie_id,'df_id',d.id_deviz_final,
    'qty',d.cantitate,'snapshot',d.ep_snapshot) ORDER BY d.id_deviz_final,d.nr_crt)
    FROM public.deviz_final_linii d JOIN public.ep_alocari a ON a.id=d.ep_alocare_id WHERE d.ep_import_id IS NOT NULL),'[]'::jsonb),
  'defaults',jsonb_build_object('tva_proc',21,'coeficient_df',ep_private.default_markup()::text));
END $function$
;
-- Gateway-ul păstrează contractul save_deviz_final și delegă baza originală, cu aceleași verificări DF.
CREATE FUNCTION ep_private.save_df(p_deviz_id bigint,p_header jsonb,p_lines jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE uid uuid:=ep_private.require_df(); req uuid; payload jsonb; receipt public.audit_logs%ROWTYPE;
 before_rows jsonb; after_rows jsonb; prepared jsonb:='[]'; j jsonb; snap jsonb;
 old public.deviz_final_linii%ROWTYPE; a public.ep_alocari%ROWTYPE; l public.ep_factura_linii%ROWTYPE; f public.ep_facturi%ROWTYPE;
 v_df_revision bigint:=0; oldcount integer; q integer; aid uuid; iid uuid; ctx jsonb; price numeric; result jsonb;
 ids uuid[]:='{}'; sources uuid[]:='{}'; changed_invoices uuid[]; has_imports boolean; oldqty numeric; cap numeric;
BEGIN
 IF jsonb_typeof(p_header) IS DISTINCT FROM 'object' OR jsonb_typeof(p_lines) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Payload DF invalid'; END IF;
 PERFORM pg_advisory_xact_lock(19520,7001);
 IF p_deviz_id IS NOT NULL THEN
  SELECT ep_revision INTO v_df_revision FROM public.deviz_final_header WHERE id_deviz_final=p_deviz_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Devizul final nu există'; END IF;
 END IF;
 req:=nullif(p_header->>'ep_request_id','')::uuid;
 payload:=jsonb_build_object('df',p_deviz_id,'header',p_header,'lines',p_lines);
 IF req IS NOT NULL THEN
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'Salvarea DF necesită READ COMMITTED'; END IF;
  SELECT * INTO receipt FROM public.audit_logs WHERE id=req;
  IF FOUND THEN
   IF receipt.user_id IS DISTINCT FROM uid OR receipt.modul IS DISTINCT FROM 'Evidență Facturi & Piese' OR receipt.actiune IS DISTINCT FROM 'save_df'
   OR receipt.descriere::jsonb->'request' IS DISTINCT FROM payload THEN
    RAISE EXCEPTION USING ERRCODE='23505',MESSAGE='UUID DF refolosit cu alt payload/actor';
   END IF;
   -- Replay-ul verifică accesul DF și întoarce rezultatul fără un consum nou.
   RETURN receipt.descriere::jsonb->'result';
  END IF;
 END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY nr_crt),'[]') INTO before_rows
 FROM public.deviz_final_linii x WHERE id_deviz_final=p_deviz_id AND ep_import_id IS NOT NULL;
 oldcount:=jsonb_array_length(before_rows);
 has_imports:=EXISTS(SELECT 1 FROM jsonb_array_elements(p_lines) x WHERE nullif(x->>'ep_import_id','') IS NOT NULL);
 IF has_imports OR oldcount>0 THEN
  IF req IS NULL THEN RAISE EXCEPTION 'Actualizează aplicația: UUID-ul salvării DF este obligatoriu'; END IF;
  IF p_deviz_id IS NOT NULL AND v_df_revision IS DISTINCT FROM (p_header->>'ep_revision')::bigint THEN
   RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Devizul a fost modificat între timp. Reîncarcă înainte de salvare.';
  END IF;
 END IF;
 IF has_imports THEN ctx:=ep_private.df_context(p_header->>'nr_inmatriculare',p_header->>'serie_vin',nullif(p_header->>'vehicle_id','')::bigint,p_deviz_id); END IF;
 FOR j IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
  IF nullif(j->>'ep_import_id','') IS NULL THEN
   IF nullif(j->>'ep_alocare_id','') IS NOT NULL OR j->'ep_snapshot' IS NOT NULL AND j->'ep_snapshot'<>'null'::jsonb THEN RAISE EXCEPTION 'Legătură EP incompletă'; END IF;
   prepared:=prepared||jsonb_build_array(j-'ep_saved_line_id'-'ep_snapshot'-'ep_import_id'-'ep_alocare_id'); CONTINUE;
  END IF;
  IF j->>'sectiune'<>'piese' OR nullif(j->>'comanda_piesa_sh_id','') IS NOT NULL OR nullif(j->>'avans_id','') IS NOT NULL THEN RAISE EXCEPTION 'Surse incompatibile pe aceeași linie'; END IF;
  iid:=(j->>'ep_import_id')::uuid; aid:=(j->>'ep_alocare_id')::uuid; q:=ep_private.qty(j->'cantitate');
  IF aid IS NULL OR iid=ANY(ids) OR aid=ANY(sources) THEN RAISE EXCEPTION USING ERRCODE='23505',MESSAGE='Sursă de factură duplicată în deviz'; END IF;
  ids:=array_append(ids,iid); sources:=array_append(sources,aid);
  SELECT * INTO old FROM public.deviz_final_linii WHERE ep_import_id=iid;
  IF old.id IS NOT NULL AND (old.id_deviz_final IS DISTINCT FROM p_deviz_id OR old.ep_alocare_id<>aid) THEN RAISE EXCEPTION 'Importul aparține altei surse sau altui DF'; END IF;
  SELECT * INTO STRICT a FROM public.ep_alocari WHERE id=aid;
  SELECT * INTO STRICT l FROM public.ep_factura_linii WHERE id=a.linie_id;
  SELECT * INTO STRICT f FROM public.ep_facturi WHERE id=l.factura_id;
  IF (a.vehicle_id IS NOT NULL AND a.vehicle_id IS DISTINCT FROM (ctx->>'vehicle_id')::bigint)
   OR (a.vehicle_id IS NULL AND a.nr_inmatriculare_original<>ctx->>'plate') THEN RAISE EXCEPTION 'Piesa aparține altei mașini'; END IF;
  oldqty:=coalesce((SELECT sum(cantitate) FROM public.deviz_final_linii WHERE id_deviz_final=p_deviz_id AND ep_alocare_id=aid),0);
  cap:=ep_private.capacity(l.id,aid)+oldqty;
  IF q>cap THEN RAISE EXCEPTION 'Cantitatea importată depășește disponibilul actual'; END IF;
  IF old.id IS NULL THEN
   PERFORM ep_private.require_access();
   IF l.blocaj_istoric IS NOT NULL THEN RAISE EXCEPTION 'Poziție cu istoric protejat'; END IF;
   IF f.revision IS DISTINCT FROM (j->>'ep_source_revision')::bigint THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Factura sursă a fost modificată. Reîncarcă lista de import.'; END IF;
   snap:=jsonb_build_object('line_id',l.id,'invoice_id',f.id,'supplier',f.furnizor_denumire_originala,'invoice_number',f.numar,
    'invoice_date',f.data_factura,'name',l.denumire,'code',l.cod_piesa,'plate',a.nr_inmatriculare_original,
    'purchase_net',l.pret_achizitie_net::text,'vat',l.tva_proc::text,'multiplier',l.coeficient_df::text,
    'unit_price',(l.pret_achizitie_net*l.coeficient_df*(1+l.tva_proc/100))::text,'imported_at',now());
  ELSE
   IF q>old.cantitate THEN PERFORM ep_private.require_access(); END IF;
   snap:=old.ep_snapshot;
  END IF;
  price:=(snap->>'unit_price')::numeric;
  IF nullif(j->>'pret_unitar','') IS NOT NULL AND (j->>'pret_unitar')::numeric<>price THEN RAISE EXCEPTION 'Prețul importat se păstrează din snapshot; elimină/reimportă pentru o sursă nouă'; END IF;
  prepared:=prepared||jsonb_build_array((j-'ep_saved_line_id'-'ep_snapshot')||jsonb_build_object(
   'ep_import_id',iid,'ep_alocare_id',aid,'ep_snapshot',snap,'ep_saved_line_id',old.id,'pret_unitar',price::text));
 END LOOP;
 -- Baza păstrează avansurile, reducerile, antetul, ID-ul DF și regulile manuale existente.
 result:=ep_private.save_df_base(p_deviz_id,p_header,prepared);
 SELECT coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('pret_unitar',x.pret_unitar::text) ORDER BY nr_crt),'[]') INTO after_rows
 FROM public.deviz_final_linii x WHERE id_deviz_final=(result->>'id_deviz_final')::bigint AND ep_import_id IS NOT NULL;
 -- Revizia facturii se schimbă numai când consumul real al unei alocări s-a schimbat.
 WITH oldq AS (SELECT (x->>'ep_alocare_id')::uuid id,(x->>'cantitate')::numeric q FROM jsonb_array_elements(before_rows)x),
 newq AS (SELECT (x->>'ep_alocare_id')::uuid id,(x->>'cantitate')::numeric q FROM jsonb_array_elements(after_rows)x)
 SELECT array_agg(DISTINCT src_line.factura_id) INTO changed_invoices FROM oldq FULL JOIN newq USING(id)
 JOIN public.ep_alocari src_alloc ON src_alloc.id=coalesce(oldq.id,newq.id) JOIN public.ep_factura_linii src_line ON src_line.id=src_alloc.linie_id
 WHERE oldq.q IS DISTINCT FROM newq.q;
 FOR aid IN SELECT DISTINCT (x->>'ep_alocare_id')::uuid FROM jsonb_array_elements(before_rows||after_rows)x LOOP
  SELECT * INTO STRICT a FROM public.ep_alocari WHERE id=aid;
  PERFORM ep_private.validate_line(a.linie_id);
 END LOOP;
 UPDATE public.ep_facturi AS invoice_row SET revision=invoice_row.revision+1 WHERE invoice_row.id=ANY(changed_invoices);
 UPDATE public.deviz_final_header SET ep_revision=v_df_revision+1 WHERE id_deviz_final=(result->>'id_deviz_final')::bigint;
 result:=result||jsonb_build_object('ep_revision',v_df_revision+1,'ep_imports',after_rows);
 IF req IS NOT NULL THEN
  INSERT INTO public.audit_logs(id,user_id,modul,actiune,entitate,entitate_id,descriere)
  VALUES(req,uid,'Evidență Facturi & Piese','save_df','deviz_final',result->>'id_deviz_final',
   jsonb_build_object('format',1,'request',payload,'before',before_rows,'after',after_rows,'result',result)::text);
 END IF;
 RETURN result;
END $f$;

CREATE OR REPLACE FUNCTION public.save_deviz_final(p_deviz_id bigint,p_header jsonb,p_lines jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $f$
 SELECT ep_private.save_df(p_deviz_id,p_header,p_lines) $f$;
REVOKE ALL ON FUNCTION ep_private.df_lock(),ep_private.df_protect_source(),ep_private.df_protect_header(),ep_private.df_deleted_line(),ep_private.require_df(),ep_private.df_context(text,text,bigint,bigint),ep_private.save_df_base(bigint,jsonb,jsonb),ep_private.save_df(bigint,jsonb,jsonb),ep_private.list_df_parts(text,text,bigint,bigint),public.ep_list_df_parts(text,text,bigint,bigint) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION ep_private.save_df(bigint,jsonb,jsonb),ep_private.list_df_parts(text,text,bigint,bigint),public.ep_list_df_parts(text,text,bigint,bigint) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
