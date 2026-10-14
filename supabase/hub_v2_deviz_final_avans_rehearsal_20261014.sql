-- MANUAL SQL EDITOR REHEARSAL ONLY. DO NOT APPLY AS A MIGRATION.
-- Target: the HUB_Service_Auto project while the 20261014194825 migration is still absent.
-- Run this entire file as one SQL Editor query. It always ends with ROLLBACK.
-- If the editor stops on an error before the final ROLLBACK, execute ROLLBACK manually
-- in the SAME SQL Editor session. Never COMMIT this rehearsal.
-- Dedicated test IDs: 910000000000001..013; shadow DF IDs 910000000001000+;
-- shadow line IDs 910000000002000+; plate TSTAVANS26; one dedicated auth UUID below.
-- The only existing profile used is read, not modified. No customer/fixture rows are touched.
-- Existing production identity sequences are never advanced: all fixture IDs are explicit,
-- and the two RPC-generated document identities are redirected to transaction-local
-- rehearsal sequences after the migration. PostgreSQL nextval is not rolled back.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

DO $preflight$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Run as the project SQL Editor postgres role, not %', current_user;
  END IF;
  IF to_regclass('private.deviz_final_avans_review') IS NOT NULL
     OR EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='deviz_final_header'
                  AND column_name='total_avans') THEN
    RAISE EXCEPTION 'The migration appears applied; stop this rehearsal.';
  END IF;
  IF to_regclass('private.__rehearsal_df_header_seq') IS NOT NULL
     OR to_regclass('private.__rehearsal_df_line_seq') IS NOT NULL THEN
    RAISE EXCEPTION 'A rehearsal sequence name already exists.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.clienti WHERE id BETWEEN 910000000000001 AND 910000000000013
             OR cod_client='SQL_REHEARSAL_AVANS_20261014')
     OR EXISTS (SELECT 1 FROM public.clienti_vehicule WHERE id BETWEEN 910000000000001 AND 910000000000013
                OR nr_inmatriculare='TSTAVANS26')
     OR EXISTS (SELECT 1 FROM public.constatari WHERE id BETWEEN 910000000000001 AND 910000000000013)
     OR EXISTS (SELECT 1 FROM public.comenzi_piese_sh WHERE id BETWEEN 910000000000001 AND 910000000000013)
     OR EXISTS (SELECT 1 FROM public.evidente_avansuri WHERE id BETWEEN 910000000000001 AND 910000000000013)
     OR EXISTS (SELECT 1 FROM public.evidente_avansuri_plati WHERE id BETWEEN 910000000000001 AND 910000000000013)
     OR EXISTS (SELECT 1 FROM public.deviz_final_header WHERE id_deviz_final BETWEEN 910000000001000 AND 910000000001999)
     OR EXISTS (SELECT 1 FROM public.deviz_final_linii WHERE id BETWEEN 910000000002000 AND 910000000002999)
     OR EXISTS (SELECT 1 FROM auth.users WHERE id='00000000-0000-4000-8000-202610140001'::uuid) THEN
    RAISE EXCEPTION 'Dedicated rehearsal ID/plate already exists; choose new IDs before running.';
  END IF;
END
$preflight$;

-- Pre-rollout dedicated advance: inserted before the migration, so it must stay unreviewed.
-- All inserts use explicit IDs and do not call production identity sequences.
INSERT INTO public.clienti (id,cod_client,tip_client,nume)
  OVERRIDING SYSTEM VALUE
  VALUES (910000000000001,'SQL_REHEARSAL_AVANS_20261014','persoana','SQL rehearsal only');
INSERT INTO public.clienti_vehicule (id,client_id,nr_inmatriculare,serie_vin,marca_model)
  OVERRIDING SYSTEM VALUE
  VALUES (910000000000002,910000000000001,'TSTAVANS26','TESTVIN20261014','SQL rehearsal');
INSERT INTO public.constatari
  (id,nr_inmatriculare,model_masina,client_id,vehicle_id)
  VALUES (910000000000003,'TSTAVANS26','SQL rehearsal',910000000000001,910000000000002);
INSERT INTO public.comenzi_piese_sh
  (id,denumire_piesa,nr_inmatriculare,model_masina,departament,furnizor,pret_piesa)
  OVERRIDING SYSTEM VALUE
  VALUES (910000000000004,'SQL rehearsal SH','TSTAVANS26','SQL rehearsal','Mecanica','SQL rehearsal',100);
INSERT INTO public.evidente_avansuri
  (id,data_crearii,model_masina,nr_inmatriculare,vehicle_id,este_arhivat)
  VALUES (910000000000005,'2001-01-01','SQL rehearsal','TSTAVANS26',910000000000002,false);
INSERT INTO public.evidente_avansuri_plati
  (id,avans_id,suma,metoda_plata,data_platii)
  VALUES (910000000000006,910000000000005,75,'Cash','2001-01-01');

-- EXACT CONTENTS OF supabase/migrations/20261014194825_add_deviz_final_avans_atomic_save.sql
-- Pregătire aditivă: piesele negative istorice rămân intacte.
alter table public.deviz_final_header
  add column vehicle_id bigint,
  add column total_avans numeric not null default 0;

alter table public.deviz_final_header
  add constraint deviz_final_header_vehicle_id_fkey
  foreign key (vehicle_id) references public.clienti_vehicule(id) on delete restrict,
  add constraint deviz_final_header_total_avans_chk
  check (total_avans >= 0 and total_avans::text not in ('NaN', 'Infinity', '-Infinity'));

create index deviz_final_header_vehicle_id_idx
  on public.deviz_final_header (vehicle_id);

alter table public.deviz_final_linii add column avans_id bigint;

alter table public.deviz_final_linii
  add constraint deviz_final_linii_avans_id_fkey
  foreign key (avans_id) references public.evidente_avansuri(id) on delete restrict,
  add constraint deviz_final_linii_avans_shape_chk
  check (
    (avans_id is null and sectiune is distinct from 'avans')
    or (avans_id is not null and id_deviz_final is not null
        and sectiune is not null and sectiune = 'avans'
        and total is not null and total > 0
        and total::text not in ('NaN', 'Infinity', '-Infinity'))
  );

create unique index deviz_final_linii_avans_id_uidx
  on public.deviz_final_linii (avans_id) where avans_id is not null;

create index evidente_avansuri_plati_avans_id_idx
  on public.evidente_avansuri_plati (avans_id);

-- Lipsa unui rând înseamnă nerevizuit; numai operatorul DB poate confirma istoricul.
-- Schema private nu este expusă prin Data API.
create table private.deviz_final_avans_review (
  avans_id bigint primary key references public.evidente_avansuri(id) on delete cascade,
  status text not null check (status in ('confirmed_used', 'confirmed_available')),
  reviewed_at timestamptz not null default now()
);
revoke all on table private.deviz_final_avans_review from public, anon, authenticated, service_role;
grant select (avans_id, status) on table private.deviz_final_avans_review to authenticated;
comment on table private.deviz_final_avans_review is
  'Absence means unreviewed. Pre-rollout advances need historical review; new inserted advances are marked available by trigger.';

-- Numai inserările noi primesc disponibilitate; istoricul rămâne fără rând de review.
-- Triggerul rulează în tranzacția inserării și nu suprascrie confirmed_used.
create function private.mark_new_deviz_final_advance_available()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into private.deviz_final_avans_review (avans_id, status)
  values (new.id, 'confirmed_available');
  return new;
end;
$$;
revoke all on function private.mark_new_deviz_final_advance_available()
  from public, anon, authenticated, service_role;

create trigger evidente_avansuri_new_deviz_final_review
  after insert on public.evidente_avansuri
  for each row execute function private.mark_new_deviz_final_advance_available();

-- Lookup restrâns: politica RLS curentă cere clienti_notificari, chiar dacă utilizatorul are deviz_final.
-- Acest helper returnează numai ID-ul vehiculului pentru un număr unic.
create function private.resolve_deviz_final_vehicle(p_plate text, p_vin text)
returns bigint language plpgsql stable security definer set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_count bigint;
  v_id bigint;
  v_vin text;
begin
  if v_user_id is null or not exists (
    select 1 from public.auth_profiles profile
    where profile.id = v_user_id
      and (profile.rol_id = 1 or
           coalesce(profile.permissions::jsonb, '{}'::jsonb) @> '{"deviz_final": true}'::jsonb)
  ) then
    raise exception using errcode = '42501', message = 'Nu aveți permisiunea deviz_final.';
  end if;
  select count(*), min(id), min(serie_vin)
    into v_count, v_id, v_vin
  from public.clienti_vehicule
  where upper(pg_catalog.regexp_replace(nr_inmatriculare, '[^A-Za-z0-9]', '', 'g')) = p_plate;
  if v_count > 1 then
    raise exception using errcode = '22023', message = 'Număr auto ambiguu în registrul vehiculelor.';
  end if;
  if v_count = 1 and nullif(p_vin, '') is not null
     and nullif(upper(pg_catalog.regexp_replace(coalesce(v_vin, ''), '[^A-Za-z0-9]', '', 'g')), '') is not null
     and upper(pg_catalog.regexp_replace(v_vin, '[^A-Za-z0-9]', '', 'g')) <> p_vin then
    raise exception using errcode = '22023', message = 'VIN-ul nu corespunde vehiculului.';
  end if;
  return v_id;
end;
$$;
revoke all on function private.resolve_deviz_final_vehicle(text, text) from public, anon, service_role;
grant execute on function private.resolve_deviz_final_vehicle(text, text) to authenticated;
-- RPC separat: NULL creează, un ID existent actualizează. Excepțiile anulează tot apelul.
create function public.save_deviz_final(
  p_deviz_id bigint,
  p_header jsonb,
  p_lines jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
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
        -- Antetul păstrează suma exactă după discount; linia afișată are doi zecimali.
        v_line_total := pg_catalog.round(v_exact, 2);
        v_total_piese := v_total_piese + v_exact;
        if v_exact < 0 and v_name ilike '%AVANS%' then v_legacy_part := true; end if;
        insert into public.deviz_final_linii (
          id_deviz_final, sectiune, nr_crt, denumire, um, cantitate,
          pret_unitar, discount, total, comanda_piesa_sh_id
        ) values (
          v_deviz_id, 'piese', v_nr, v_name,
          coalesce(nullif(v_line ->> 'um', ''), 'buc'), v_qty,
          v_price, v_apply_discount, v_line_total, v_sh_id
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
$$;
revoke all on function public.save_deviz_final(bigint, jsonb, jsonb) from public, anon, service_role;
grant execute on function public.save_deviz_final(bigint, jsonb, jsonb) to authenticated;

-- Catalog checks execute as postgres; the application tests below execute as authenticated.
DO $catalog$
DECLARE
  v_owner text;
  v_definer boolean;
  v_config text[];
BEGIN
  IF EXISTS (SELECT 1 FROM private.deviz_final_avans_review
             WHERE avans_id=910000000000005) THEN
    RAISE EXCEPTION 'The pre-rollout test advance was auto-marked.';
  END IF;
  IF NOT has_schema_privilege('authenticated','private','USAGE')
     OR NOT has_schema_privilege('authenticated','public','USAGE')
     OR NOT has_schema_privilege('authenticated','auth','USAGE') THEN
    RAISE EXCEPTION 'Required schema USAGE is missing.';
  END IF;
  IF NOT has_table_privilege('authenticated','public.deviz_final_header','SELECT,INSERT,UPDATE,DELETE')
     OR NOT has_table_privilege('authenticated','public.deviz_final_linii','SELECT,INSERT,UPDATE,DELETE')
     OR NOT has_table_privilege('authenticated','public.evidente_avansuri','SELECT,INSERT')
     OR NOT has_table_privilege('authenticated','public.evidente_avansuri_plati','SELECT,INSERT')
     OR NOT has_table_privilege('authenticated','public.constatari','SELECT')
     OR NOT has_table_privilege('authenticated','public.auth_profiles','SELECT') THEN
    RAISE EXCEPTION 'SECURITY INVOKER table DML/SELECT grants are incomplete.';
  END IF;
  IF NOT has_column_privilege('authenticated','private.deviz_final_avans_review','avans_id','SELECT')
     OR NOT has_column_privilege('authenticated','private.deviz_final_avans_review','status','SELECT')
     OR has_table_privilege('authenticated','private.deviz_final_avans_review','INSERT')
     OR has_table_privilege('authenticated','private.deviz_final_avans_review','UPDATE')
     OR has_table_privilege('authenticated','private.deviz_final_avans_review','DELETE') THEN
    RAISE EXCEPTION 'Review table column grants/write restrictions are wrong.';
  END IF;
  IF NOT has_sequence_privilege('authenticated','public.deviz_final_header_id_deviz_final_seq','USAGE')
     OR NOT has_sequence_privilege('authenticated','public.deviz_final_linii_id_seq','USAGE')
     OR NOT has_sequence_privilege('authenticated','public.evidente_avansuri_id_seq','USAGE')
     OR NOT has_sequence_privilege('authenticated','public.evidente_avansuri_plati_id_seq','USAGE') THEN
    RAISE EXCEPTION 'Production identity sequence privileges are incomplete.';
  END IF;
  IF NOT has_function_privilege('authenticated','auth.uid()','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.create_deviz_final_from_constatare(bigint,jsonb,jsonb)','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.save_deviz_final(bigint,jsonb,jsonb)','EXECUTE')
     OR NOT has_function_privilege('authenticated','private.resolve_deviz_final_vehicle(text,text)','EXECUTE')
     OR has_function_privilege('anon','public.save_deviz_final(bigint,jsonb,jsonb)','EXECUTE')
     OR has_function_privilege('anon','private.resolve_deviz_final_vehicle(text,text)','EXECUTE')
     OR has_function_privilege('authenticated','private.mark_new_deviz_final_advance_available()','EXECUTE')
     OR has_function_privilege('anon','private.mark_new_deviz_final_advance_available()','EXECUTE') THEN
    RAISE EXCEPTION 'Function EXECUTE grants are wrong.';
  END IF;
  SELECT pg_get_userbyid(proowner),prosecdef,proconfig
    INTO v_owner,v_definer,v_config
  FROM pg_proc WHERE oid='private.resolve_deviz_final_vehicle(text,text)'::regprocedure;
  IF v_owner IS DISTINCT FROM 'postgres' OR v_definer IS DISTINCT FROM true
     OR NOT ('search_path=""'=ANY(v_config)) THEN
    RAISE EXCEPTION 'Vehicle lookup owner/security/search_path is unsafe.';
  END IF;
  SELECT pg_get_userbyid(proowner),prosecdef,proconfig
    INTO v_owner,v_definer,v_config
  FROM pg_proc WHERE oid='private.mark_new_deviz_final_advance_available()'::regprocedure;
  IF v_owner IS DISTINCT FROM 'postgres' OR v_definer IS DISTINCT FROM true
     OR NOT ('search_path=""'=ANY(v_config)) THEN
    RAISE EXCEPTION 'Insert-trigger helper owner/security/search_path is unsafe.';
  END IF;
  SELECT pg_get_userbyid(proowner),prosecdef,proconfig
    INTO v_owner,v_definer,v_config
  FROM pg_proc WHERE oid='public.save_deviz_final(bigint,jsonb,jsonb)'::regprocedure;
  IF v_owner IS DISTINCT FROM 'postgres' OR v_definer IS DISTINCT FROM false
     OR NOT ('search_path=""'=ANY(v_config)) THEN
    RAISE EXCEPTION 'Save RPC owner/security/search_path is wrong.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.auth_profiles
    WHERE rol_id IS DISTINCT FROM 1
      AND coalesce(permissions,'{}'::jsonb) @> '{"deviz_final": true}'::jsonb
  ) THEN
    RAISE EXCEPTION 'No existing non-admin deviz_final profile for authenticated tests.';
  END IF;
END
$catalog$;

-- These two sequences are new inside this transaction and disappear on ROLLBACK.
-- Redirect only the two RPC-generated document identities. The original
-- production sequences are not called, restarted, or setval-ed.
CREATE SEQUENCE private.__rehearsal_df_header_seq START WITH 910000000001000;
CREATE SEQUENCE private.__rehearsal_df_line_seq START WITH 910000000002000;
GRANT USAGE ON SEQUENCE private.__rehearsal_df_header_seq TO authenticated;
GRANT USAGE ON SEQUENCE private.__rehearsal_df_line_seq TO authenticated;
ALTER TABLE public.deviz_final_header ALTER COLUMN id_deviz_final DROP IDENTITY;
ALTER TABLE public.deviz_final_linii ALTER COLUMN id DROP IDENTITY;
ALTER TABLE public.deviz_final_header
  ALTER COLUMN id_deviz_final SET DEFAULT nextval('private.__rehearsal_df_header_seq'::regclass);
ALTER TABLE public.deviz_final_linii
  ALTER COLUMN id SET DEFAULT nextval('private.__rehearsal_df_line_seq'::regclass);

-- Dedicated simulated auth principal; its auth.users trigger creates its profile.
-- Both rows disappear on ROLLBACK. This is not a real browser login/session.
INSERT INTO auth.users (id,aud,role)
VALUES ('00000000-0000-4000-8000-202610140001'::uuid,'authenticated','authenticated');

-- Existing non-admin profile with the real deviz_final permission.
DO $actor$
DECLARE v_actor uuid;
BEGIN
  SELECT id INTO v_actor FROM public.auth_profiles
  WHERE id <> '00000000-0000-4000-8000-202610140001'::uuid
    AND rol_id IS DISTINCT FROM 1
    AND coalesce(permissions,'{}'::jsonb) @> '{"deviz_final": true}'::jsonb
  ORDER BY id LIMIT 1;
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Existing permitted actor vanished.'; END IF;
  PERFORM pg_catalog.set_config('request.jwt.claim.sub',v_actor::text,true);
END
$actor$;
SET LOCAL ROLE authenticated;

DO $positive$
DECLARE
  v_header jsonb := pg_catalog.jsonb_build_object(
    'data_deviz','2026-10-14','nr_inmatriculare','TSTAVANS26',
    'serie_vin','TESTVIN20261014','client','SQL rehearsal',
    'auto','SQL rehearsal','discount_global_piese',10);
  v_base_lines jsonb := pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object('sectiune','manopera','nr_crt',1,'denumire','Test labor','cantitate',2,'pret_unitar',100),
    pg_catalog.jsonb_build_object('sectiune','piese','nr_crt',1,'denumire','Test part','cantitate',1,'pret_unitar',130.01,'discount',1));
  v_avans_lines jsonb;
  v_sh_lines jsonb;
  v_result jsonb;
  v_plain_id bigint;
  v_advance_id bigint;
  v_constatare_df_id bigint;
  v_null_line_id bigint;
  v_message text;
BEGIN
  IF current_user <> 'authenticated' OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Positive tests did not enter authenticated with a profile.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.auth_profiles p WHERE p.id=auth.uid()
                 AND p.rol_id IS DISTINCT FROM 1
                 AND coalesce(p.permissions,'{}'::jsonb) @> '{"deviz_final": true}'::jsonb) THEN
    RAISE EXCEPTION 'Positive test actor lacks the existing deviz_final grant.';
  END IF;

  -- A true pre-rollout advance has no review row and cannot be claimed.
  BEGIN
    PERFORM public.save_deviz_final(
      NULL,v_header || '{"client":"SQL_REHEARSAL_UNREVIEWED"}'::jsonb,
      pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('sectiune','avans','nr_crt',1,'avans_id',910000000000005)));
    RAISE EXCEPTION 'Unreviewed advance was accepted.';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    GET STACKED DIAGNOSTICS v_message=MESSAGE_TEXT;
    IF v_message <> 'Istoricul avansului nu este confirmat ca disponibil.' THEN
      RAISE EXCEPTION 'Unreviewed rejection came from the wrong condition: %',v_message;
    END IF;
  END;

  -- Ordinary create, unchanged discount semantics, no advance.
  v_result := public.save_deviz_final(
    NULL,v_header || '{"client":"SQL_REHEARSAL_ORDINARY"}'::jsonb,v_base_lines);
  v_plain_id := (v_result->>'id_deviz_final')::bigint;
  IF (v_result->>'total_piese')::numeric <> 117.009
     OR (v_result->>'total_avans')::numeric <> 0
     OR (v_result->>'total_general')::numeric <> 317.009
     OR NOT EXISTS (SELECT 1 FROM public.deviz_final_linii
                    WHERE id_deviz_final=v_plain_id AND sectiune='piese' AND total=117.01) THEN
    RAISE EXCEPTION 'Ordinary save or existing discount rounding failed: %',v_result;
  END IF;

  -- Genuine post-rollout inserts auto-receive review availability, even with old
  -- user-supplied creation/payment dates. No date proves eligibility.
  INSERT INTO public.evidente_avansuri
    (id,data_crearii,model_masina,nr_inmatriculare,vehicle_id,este_arhivat)
    VALUES (910000000000007,'2001-01-01','SQL rehearsal','TSTAVANS26',910000000000002,false);
  INSERT INTO public.evidente_avansuri_plati
    (id,avans_id,suma,metoda_plata,data_platii)
    VALUES (910000000000008,910000000000007,500,'Cash','2001-01-01');
  INSERT INTO public.evidente_avansuri
    (id,data_crearii,model_masina,nr_inmatriculare,vehicle_id,este_arhivat)
    VALUES (910000000000012,'2001-01-01','SQL rehearsal','TSTAVANS26',910000000000002,false);
  INSERT INTO public.evidente_avansuri_plati
    (id,avans_id,suma,metoda_plata,data_platii)
    VALUES (910000000000013,910000000000012,500,'Cash','2001-01-01');
  IF (SELECT status FROM private.deviz_final_avans_review
      WHERE avans_id=910000000000007) IS DISTINCT FROM 'confirmed_available'
     OR (SELECT status FROM private.deviz_final_avans_review
         WHERE avans_id=910000000000012) IS DISTINCT FROM 'confirmed_available' THEN
    RAISE EXCEPTION 'New advance trigger did not grant availability.';
  END IF;

  -- The CHECK rejects NULL section with a linked advance and retains ordinary
  -- historical NULL sections without avans_id.
  BEGIN
    INSERT INTO public.deviz_final_linii
      (id_deviz_final,sectiune,avans_id,total)
      VALUES (v_plain_id,NULL,910000000000007,500);
    RAISE EXCEPTION 'NULL sectiune with avans_id passed the CHECK.';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  INSERT INTO public.deviz_final_linii
    (id_deviz_final,sectiune,denumire)
    VALUES (v_plain_id,NULL,'SQL historical NULL section')
    RETURNING id INTO v_null_line_id;
  DELETE FROM public.deviz_final_linii WHERE id=v_null_line_id;

  -- First 500 lei claim.
  v_avans_lines := pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object('sectiune','manopera','nr_crt',1,'denumire','Test labor','cantitate',1,'pret_unitar',600),
    pg_catalog.jsonb_build_object('sectiune','piese','nr_crt',1,'denumire','Test part','cantitate',1,'pret_unitar',130.01,'discount',1),
    pg_catalog.jsonb_build_object('sectiune','avans','nr_crt',1,'avans_id',910000000000007));
  v_result := public.save_deviz_final(
    NULL,v_header || '{"client":"SQL_REHEARSAL_500"}'::jsonb,v_avans_lines);
  v_advance_id := (v_result->>'id_deviz_final')::bigint;
  IF (v_result->>'total_piese')::numeric <> 117.009
     OR (v_result->>'total_avans')::numeric <> 500
     OR (v_result->>'total_general')::numeric <> 217.009
     OR NOT EXISTS (SELECT 1 FROM public.deviz_final_linii
                    WHERE id_deviz_final=v_advance_id AND sectiune='avans'
                      AND avans_id=910000000000007 AND denumire='Avans achitat'
                      AND total=500) THEN
    RAISE EXCEPTION '500 lei advance save failed: %',v_result;
  END IF;

  -- One advance cannot be claimed by a second estimate.
  BEGIN
    PERFORM public.save_deviz_final(
      NULL,v_header || '{"client":"SQL_REHEARSAL_DUPLICATE"}'::jsonb,v_avans_lines);
    RAISE EXCEPTION 'Duplicate advance claim succeeded.';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_message=MESSAGE_TEXT;
    IF v_message <> 'Avansul aparține altui deviz final.' THEN
      RAISE EXCEPTION 'Duplicate claim failed for a different reason: %',v_message;
    END IF;
  END;
  IF EXISTS (SELECT 1 FROM public.deviz_final_header WHERE client='SQL_REHEARSAL_DUPLICATE') THEN
    RAISE EXCEPTION 'Failed duplicate claim left a header.';
  END IF;

  -- A later payment on the same record refreshes the linked estimate.
  INSERT INTO public.evidente_avansuri_plati
    (id,avans_id,suma,metoda_plata,data_platii)
    VALUES (910000000000009,910000000000007,25,'Card','2001-01-01');
  v_result := public.save_deviz_final(
    v_advance_id,v_header || '{"client":"SQL_REHEARSAL_500"}'::jsonb,v_avans_lines);
  IF (v_result->>'total_avans')::numeric <> 525
     OR (v_result->>'total_general')::numeric <> 192.009
     OR (SELECT total FROM public.deviz_final_linii
         WHERE id_deviz_final=v_advance_id AND avans_id=910000000000007) <> 525 THEN
    RAISE EXCEPTION 'Refresh after another payment failed: %',v_result;
  END IF;

  -- This call passes prechecks, writes a header and lines, then detects the
  -- mixed legacy negative AVANS part. The caught error must roll them all back.
  BEGIN
    PERFORM public.save_deviz_final(
      NULL,v_header || '{"client":"SQL_REHEARSAL_ROLLBACK"}'::jsonb,
      pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('sectiune','piese','nr_crt',1,'denumire','AVANS ISTORIC','cantitate',1,'pret_unitar',-100,'discount',0),
        pg_catalog.jsonb_build_object('sectiune','avans','nr_crt',1,'avans_id',910000000000012)));
    RAISE EXCEPTION 'Late failure did not occur.';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    GET STACKED DIAGNOSTICS v_message=MESSAGE_TEXT;
    IF v_message <> 'Eliminați explicit linia veche de avans negativ înainte de import.' THEN
      RAISE EXCEPTION 'Late rollback test failed too early: %',v_message;
    END IF;
  END;
  IF EXISTS (SELECT 1 FROM public.deviz_final_header WHERE client='SQL_REHEARSAL_ROLLBACK')
     OR EXISTS (SELECT 1 FROM public.deviz_final_linii WHERE avans_id=910000000000012) THEN
    RAISE EXCEPTION 'Failed RPC left a header or line.';
  END IF;

  -- Existing Constatări RPC still creates the link. Repeated new-RPC updates
  -- keep constatare_id and the SH part association.
  v_constatare_df_id := public.create_deviz_final_from_constatare(
    910000000000003,v_header,
    pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('sectiune','lucrari','nr_crt',1,'denumire','Test inspection')));
  v_sh_lines := pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object('sectiune','piese','nr_crt',1,'denumire','SQL rehearsal SH','cantitate',1,'pret_unitar',100,'discount',0,
                                  'comanda_piesa_sh_id',910000000000004));
  PERFORM public.save_deviz_final(v_constatare_df_id,v_header,v_sh_lines);
  PERFORM public.save_deviz_final(v_constatare_df_id,v_header,v_sh_lines);
  IF NOT EXISTS (SELECT 1 FROM public.deviz_final_header h
                 JOIN public.deviz_final_linii l ON l.id_deviz_final=h.id_deviz_final
                 WHERE h.id_deviz_final=v_constatare_df_id
                   AND h.constatare_id=910000000000003
                   AND h.vehicle_id=910000000000002
                   AND l.comanda_piesa_sh_id=910000000000004
                   AND l.sectiune='piese') THEN
    RAISE EXCEPTION 'Constatare or SH link did not survive updates.';
  END IF;

  RAISE NOTICE 'PASS: ordinary, old RPC, 500 lei advance, unreviewed, duplicate, trigger, refresh, CHECK, atomic rollback, links';
END
$positive$;

RESET ROLE;

-- Dedicated rollback-only user initially has no deviz_final permission.
DO $actor$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.auth_profiles
                 WHERE id='00000000-0000-4000-8000-202610140001'::uuid) THEN
    RAISE EXCEPTION 'Auth trigger did not create the dedicated profile.';
  END IF;
  PERFORM pg_catalog.set_config(
    'request.jwt.claim.sub','00000000-0000-4000-8000-202610140001',true);
END
$actor$;
SET LOCAL ROLE authenticated;

DO $denied$
DECLARE v_message text;
BEGIN
  IF current_user <> 'authenticated'
     OR auth.uid() IS DISTINCT FROM '00000000-0000-4000-8000-202610140001'::uuid THEN
    RAISE EXCEPTION 'Denied test did not enter the simulated authenticated role.';
  END IF;
  BEGIN
    PERFORM private.resolve_deviz_final_vehicle('TSTAVANS26','TESTVIN20261014');
    RAISE EXCEPTION 'Unauthorized lookup succeeded.';
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_message=MESSAGE_TEXT;
    IF v_message <> 'Nu aveți permisiunea deviz_final.' THEN
      RAISE EXCEPTION 'Unauthorized lookup gave wrong error: %',v_message;
    END IF;
  END;
  BEGIN
    PERFORM public.save_deviz_final(
      NULL,pg_catalog.jsonb_build_object(
        'data_deviz','2026-10-14','nr_inmatriculare','TSTAVANS26',
        'client','SQL_REHEARSAL_DENIED'),
      '[]'::jsonb);
    RAISE EXCEPTION 'Unauthorized save succeeded.';
  EXCEPTION WHEN insufficient_privilege THEN
    GET STACKED DIAGNOSTICS v_message=MESSAGE_TEXT;
    IF v_message <> 'Nu aveți permisiunea deviz_final.' THEN
      RAISE EXCEPTION 'Unauthorized save gave wrong error: %',v_message;
    END IF;
  END;
  RAISE NOTICE 'PASS: insufficient deviz_final permission rejected by helper and RPC';
END
$denied$;

RESET ROLE;

-- Modify ONLY the newly created dedicated profile, never an existing profile.
UPDATE public.auth_profiles
SET permissions='{"deviz_final":true,"clienti_notificari":false}'::jsonb
WHERE id='00000000-0000-4000-8000-202610140001'::uuid;
DO $actor$
BEGIN
  PERFORM pg_catalog.set_config(
    'request.jwt.claim.sub','00000000-0000-4000-8000-202610140001',true);
END
$actor$;
SET LOCAL ROLE authenticated;

DO $deviz_only$
DECLARE
  v_result jsonb;
BEGIN
  IF current_user <> 'authenticated'
     OR auth.uid() IS DISTINCT FROM '00000000-0000-4000-8000-202610140001'::uuid
     OR private.has_hub_permission('clienti_notificari') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Dedicated actor is not deviz_final-only.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.clienti_vehicule WHERE id=910000000000002) THEN
    RAISE EXCEPTION 'Direct vehicle SELECT unexpectedly bypassed clienti_notificari RLS.';
  END IF;
  IF private.resolve_deviz_final_vehicle('TSTAVANS26','TESTVIN20261014')
     IS DISTINCT FROM 910000000000002 THEN
    RAISE EXCEPTION 'Authorized private lookup did not resolve the vehicle.';
  END IF;
  INSERT INTO public.evidente_avansuri
    (id,data_crearii,model_masina,nr_inmatriculare,vehicle_id,este_arhivat)
    VALUES (910000000000010,'2001-01-01','SQL rehearsal','TSTAVANS26',910000000000002,false);
  INSERT INTO public.evidente_avansuri_plati
    (id,avans_id,suma,metoda_plata,data_platii)
    VALUES (910000000000011,910000000000010,500,'Cash','2001-01-01');
  v_result := public.save_deviz_final(
    NULL,
    pg_catalog.jsonb_build_object('data_deviz','2026-10-14','nr_inmatriculare','TSTAVANS26',
      'serie_vin','TESTVIN20261014','client','SQL_REHEARSAL_DEVIZ_ONLY'),
    pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('sectiune','manopera','nr_crt',1,'denumire','Test labor','cantitate',1,'pret_unitar',600),
      pg_catalog.jsonb_build_object('sectiune','avans','nr_crt',1,'avans_id',910000000000010)));
  IF (v_result->>'vehicle_id')::bigint <> 910000000000002
     OR (v_result->>'total_avans')::numeric <> 500
     OR (v_result->>'total_general')::numeric <> 100 THEN
    RAISE EXCEPTION 'deviz_final-only lookup/save failed: %',v_result;
  END IF;
  RAISE NOTICE 'PASS: deviz_final-only authenticated actor saved through private lookup despite direct vehicle RLS';
END
$deviz_only$;

RESET ROLE;

DO $final_assert$
BEGIN
  IF EXISTS (SELECT 1 FROM private.deviz_final_avans_review
             WHERE avans_id=910000000000005)
     OR NOT EXISTS (SELECT 1 FROM public.evidente_avansuri
                    WHERE id=910000000000005) THEN
    RAISE EXCEPTION 'Pre-rollout fixture changed eligibility or disappeared.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.deviz_final_header
             WHERE client IN ('SQL_REHEARSAL_UNREVIEWED',
                              'SQL_REHEARSAL_DUPLICATE',
                              'SQL_REHEARSAL_ROLLBACK',
                              'SQL_REHEARSAL_DENIED')) THEN
    RAISE EXCEPTION 'A rejected save left a header.';
  END IF;
  RAISE NOTICE 'ALL REHEARSAL ASSERTIONS PASSED; ROLLBACK FOLLOWS';
END
$final_assert$;

ROLLBACK;

-- Read-only postcheck: every item below must be true.
SELECT
  to_regclass('private.deviz_final_avans_review') IS NULL AS rehearsal_schema_removed,
  NOT EXISTS (SELECT 1 FROM public.clienti WHERE id=910000000000001) AS test_client_removed,
  NOT EXISTS (SELECT 1 FROM public.clienti_vehicule WHERE id=910000000000002) AS test_vehicle_removed,
  NOT EXISTS (SELECT 1 FROM public.evidente_avansuri WHERE id IN
    (910000000000005,910000000000007,910000000000010,910000000000012)) AS test_advances_removed,
  NOT EXISTS (SELECT 1 FROM public.deviz_final_header WHERE id_deviz_final BETWEEN
    910000000001000 AND 910000000001999) AS test_estimates_removed,
  NOT EXISTS (SELECT 1 FROM auth.users WHERE id='00000000-0000-4000-8000-202610140001'::uuid)
    AS test_auth_user_removed,
  pg_get_serial_sequence('public.deviz_final_header','id_deviz_final')
    = 'public.deviz_final_header_id_deviz_final_seq' AS header_identity_restored,
  pg_get_serial_sequence('public.deviz_final_linii','id')
    = 'public.deviz_final_linii_id_seq' AS line_identity_restored;
