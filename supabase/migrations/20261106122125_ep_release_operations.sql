-- EP: reset atribuire / anulare trimitere / ștergere facturi și linii nefolosite.
-- CANDIDAT LOCAL, NEAPLICAT ÎN PRODUCȚIE.
-- Ștergerea explicită a facturilor/liniilor nefolosite păstrează istoricul în audit.
-- Fără resetări/anulări automate; RLS, FK și drepturi DML directe neschimbate.
BEGIN;
SET LOCAL lock_timeout = '10s';
-- Aceeași serializare ca toate scrierile EP și DF.
SELECT pg_advisory_xact_lock(19520,7001);
DO $preflight$ BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'Owner neașteptat'; END IF;
 IF md5(pg_get_functiondef('ep_private.begin_request(uuid,text,jsonb)'::regprocedure))<>'069a8e89d2a5e996c4fb6b3d3dbb1b17' THEN RAISE EXCEPTION 'Contract EP modificat: begin_request; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.capacity(uuid,uuid)'::regprocedure))<>'3249df5e87e50f036b937e25658c6fc5' THEN RAISE EXCEPTION 'Contract EP modificat: capacity; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.save_allocations(uuid,jsonb)'::regprocedure))<>'087d531344f2cda70968a1aa10b64f30' THEN RAISE EXCEPTION 'Contract EP modificat: save_allocations; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.save_invoice(uuid,jsonb)'::regprocedure))<>'ce0b221bb354695c7253584ab5d855d6' THEN RAISE EXCEPTION 'Contract EP modificat: save_invoice; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.register_movement(uuid,jsonb)'::regprocedure))<>'1741911d7326b8366b149f9e939766a0' THEN RAISE EXCEPTION 'Contract EP modificat: register_movement; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.load_registry()'::regprocedure))<>'5196ccef2adcdfeca8451f5e4ddce2b7' THEN RAISE EXCEPTION 'Contract EP modificat: load_registry; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.validate_line(uuid)'::regprocedure))<>'56d642295fc281238e4e09b11ccd6f2f' THEN RAISE EXCEPTION 'Contract EP modificat: validate_line; reia review-ul'; END IF;
END $preflight$;

-- Cantitatea zero păstrează alocarea arhivată; scrierile normale cer în continuare qty > 0.
ALTER TABLE public.ep_alocari DROP CONSTRAINT ep_alocari_cantitate_check,
 ADD CONSTRAINT ep_alocari_cantitate_check CHECK(cantitate>=0),
 ADD COLUMN cantitate_eliberata integer NOT NULL DEFAULT 0 CHECK(cantitate_eliberata>=0),
 ADD CONSTRAINT ep_alocare_zero_istoric CHECK(cantitate>0 OR cantitate_eliberata>0);
ALTER TABLE public.ep_transferuri_magazie
 ADD COLUMN anulat_at timestamptz,
 ADD COLUMN anulat_de uuid REFERENCES public.auth_profiles(id) ON DELETE RESTRICT,
 ADD CONSTRAINT ep_transfer_anulare_completa CHECK((anulat_at IS NULL)=(anulat_de IS NULL));

-- Disponibilul ignoră numai transferurile anulate, nu retururile sau consumul DF.
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
               WHERE linie_id=p_line AND anulat_at IS NULL AND alocare_id IS NOT DISTINCT FROM p_allocation),0)
   - coalesce((SELECT sum(cantitate) FROM public.deviz_final_linii WHERE ep_alocare_id=p_allocation),0);
END $function$
;
-- Eliberare atomică, idempotentă, cu revizie și audit before/after în același commit.
CREATE FUNCTION ep_private.release_quantity(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE r jsonb; b jsonb; after_state jsonb; uid uuid:=ep_private.require_access();
 target uuid:=(p->>'id')::uuid; kind text:=p->>'kind'; lid uuid; q integer;
 a public.ep_alocari%ROWTYPE; t public.ep_transferuri_magazie%ROWTYPE;
 l public.ep_factura_linii%ROWTYPE; f public.ep_facturi%ROWTYPE;
BEGIN
 r:=ep_private.begin_request(p_request,'release_quantity',p);
 IF r IS NOT NULL THEN RETURN r; END IF;
 IF target IS NULL OR kind IS NULL OR kind NOT IN ('allocation','warehouse') THEN
   RAISE EXCEPTION 'Operație de eliberare invalidă';
 END IF;
 IF kind='allocation' THEN
   SELECT * INTO STRICT a FROM public.ep_alocari WHERE id=target;
   lid:=a.linie_id; q:=a.cantitate;
 ELSE
   SELECT * INTO STRICT t FROM public.ep_transferuri_magazie WHERE id=target;
   IF t.anulat_at IS NOT NULL THEN RAISE EXCEPTION 'Trimiterea este deja anulată'; END IF;
   lid:=t.linie_id; q:=t.cantitate;
 END IF;
 SELECT * INTO STRICT l FROM public.ep_factura_linii WHERE id=lid;
 SELECT * INTO STRICT f FROM public.ep_facturi WHERE id=l.factura_id FOR UPDATE;
 IF f.revision IS DISTINCT FROM (p->>'expected_revision')::bigint THEN
   RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Factura a fost modificată. Actualizează registrul și redeschide operația.';
 END IF;
 IF l.blocaj_istoric IS NOT NULL THEN RAISE EXCEPTION 'Poziție cu istoric protejat'; END IF;
 PERFORM ep_private.validate_line(lid);
 b:=jsonb_build_object('allocation',to_jsonb(a),'transfer',to_jsonb(t));
 IF kind='allocation' THEN
   IF q<=0 THEN RAISE EXCEPTION 'Atribuirea este deja resetată'; END IF;
   IF EXISTS(SELECT 1 FROM public.deviz_final_linii WHERE ep_alocare_id=target)
      OR EXISTS(SELECT 1 FROM public.ep_retururi WHERE alocare_id=target)
      OR EXISTS(SELECT 1 FROM public.ep_transferuri_magazie WHERE alocare_id=target AND anulat_at IS NULL) THEN
     RAISE EXCEPTION 'Atribuirea are DF, retur sau trimitere activă; resetarea este blocată';
   END IF;
   UPDATE public.ep_alocari SET cantitate=0,cantitate_eliberata=cantitate_eliberata+q
     WHERE id=target RETURNING * INTO a;
 ELSE
   -- Cantitatea trimiterii este rezervată separat de DF. Micșorăm exact rezervarea anulată.
   IF t.alocare_id IS NOT NULL THEN
     SELECT * INTO STRICT a FROM public.ep_alocari WHERE id=t.alocare_id AND linie_id=lid;
     b:=jsonb_build_object('allocation',to_jsonb(a),'transfer',to_jsonb(t));
     IF a.cantitate<q THEN RAISE EXCEPTION 'Cantitatea alocării nu mai acoperă trimiterea'; END IF;
     UPDATE public.ep_alocari SET cantitate=cantitate-q,cantitate_eliberata=cantitate_eliberata+q
       WHERE id=a.id RETURNING * INTO a;
   END IF;
   UPDATE public.ep_transferuri_magazie SET anulat_at=clock_timestamp(),anulat_de=uid
     WHERE id=target RETURNING * INTO t;
 END IF;
 -- Dacă DF/retur/alt transfer ar rămâne fără acoperire, întreaga tranzacție se anulează.
 PERFORM ep_private.validate_line(lid);
 UPDATE public.ep_facturi SET revision=revision+1 WHERE id=f.id RETURNING * INTO f;
 after_state:=jsonb_build_object('allocation',to_jsonb(a),'transfer',to_jsonb(t));
 r:=jsonb_build_object('id',target,'invoice_id',f.id,'revision',f.revision,'released_qty',q);
 RETURN ep_private.finish_request(p_request,'release_quantity',p,
   CASE WHEN kind='allocation' THEN 'ep_alocari' ELSE 'ep_transferuri_magazie' END,
   target::text,b,after_state,r);
END $fn$;
CREATE FUNCTION public.ep_release_quantity(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
 SELECT ep_private.release_quantity(p_request,p)
$fn$;
REVOKE ALL ON FUNCTION ep_private.release_quantity(uuid,jsonb),public.ep_release_quantity(uuid,jsonb)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION ep_private.release_quantity(uuid,jsonb),public.ep_release_quantity(uuid,jsonb)
 TO authenticated;
-- Alocările eliberate nu se reactivează prin corectare; se creează o atribuire nouă.
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
     IF old.cantitate=0 OR old.cantitate_eliberata>0 OR old.linie_id<>lid OR EXISTS(SELECT 1 FROM public.ep_retururi WHERE alocare_id=aid)
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
-- Aceleași blocaje pentru eliminarea unei linii și pentru ștergerea întregii facturi.
CREATE FUNCTION ep_private.line_delete_blockers(p_line uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $fn$
DECLARE l public.ep_factura_linii%ROWTYPE; reasons text[]:=ARRAY[]::text[];
BEGIN
 SELECT * INTO l FROM public.ep_factura_linii WHERE id=p_line;
 IF NOT FOUND THEN RETURN 'Poziția nu mai există'; END IF;
 IF l.blocaj_istoric IS NOT NULL THEN reasons:=array_append(reasons,'istoric financiar protejat'); END IF;
 IF EXISTS(SELECT 1 FROM public.deviz_final_linii d JOIN public.ep_alocari a ON a.id=d.ep_alocare_id WHERE a.linie_id=p_line) THEN
   reasons:=array_append(reasons,'piese consumate într-un DF salvat');
 END IF;
 IF EXISTS(SELECT 1 FROM public.ep_retururi WHERE linie_id=p_line) THEN reasons:=array_append(reasons,'retur înregistrat'); END IF;
 IF EXISTS(SELECT 1 FROM public.ep_transferuri_magazie WHERE linie_id=p_line AND anulat_at IS NULL) THEN
   reasons:=array_append(reasons,'trimitere activă în magazie');
 END IF;
 IF EXISTS(SELECT 1 FROM public.ep_alocari WHERE linie_id=p_line AND cantitate>0) THEN
   reasons:=array_append(reasons,'atribuire auto activă');
 END IF;
 RETURN array_to_string(reasons,', ');
END $fn$;

-- Arhivăm strict linia și istoricul inactiv în auditul apelantului, fără FK nullable/cascade.
CREATE FUNCTION ep_private.remove_unused_line(p_line uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE reason text; archived jsonb;
BEGIN
 reason:=ep_private.line_delete_blockers(p_line);
 IF reason<>'' THEN RAISE EXCEPTION 'Poziția nu poate fi eliminată: %',reason; END IF;
 PERFORM ep_private.validate_line(p_line);
 SELECT jsonb_build_object('line',to_jsonb(l),
   'allocations',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.id) FROM public.ep_alocari a WHERE a.linie_id=p_line),'[]'::jsonb),
   'transfers',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM public.ep_transferuri_magazie t WHERE t.linie_id=p_line),'[]'::jsonb))
 INTO STRICT archived FROM public.ep_factura_linii l WHERE l.id=p_line;
 DELETE FROM public.ep_transferuri_magazie WHERE linie_id=p_line AND anulat_at IS NOT NULL;
 DELETE FROM public.ep_alocari WHERE linie_id=p_line AND cantitate=0;
 DELETE FROM public.ep_factura_linii WHERE id=p_line;
 RETURN archived;
EXCEPTION WHEN foreign_key_violation THEN
 RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='Poziția nu poate fi eliminată: există alte dependențe protejate.';
END $fn$;
REVOKE ALL ON FUNCTION ep_private.line_delete_blockers(uuid),ep_private.remove_unused_line(uuid)
 FROM PUBLIC,anon,authenticated,service_role;

-- La editarea facturii, istoricul liniilor eliminate este păstrat în auditul salvării.
CREATE OR REPLACE FUNCTION ep_private.save_invoice(p_request uuid, p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r jsonb; b jsonb; j jsonb; removed jsonb:='[]'::jsonb; f public.ep_facturi%ROWTYPE; l public.ep_factura_linii%ROWTYPE;
  sup public.ep_furnizori%ROWTYPE; old_a public.ep_alocari%ROWTYPE;
  uid uuid := ep_private.require_access(); fid uuid := (p->>'id')::uuid;
  sid uuid := (p->>'furnizor_id')::uuid; lid uuid; ids uuid[]:=ARRAY[]::uuid[];
  q integer; n integer:=0; net numeric; vat numeric; coef numeric; def numeric;
  plate text; old_plate text; acount bigint; used bigint; vid bigint; dt date:=(p->>'data_factura')::date;
BEGIN
 r:=ep_private.begin_request(p_request,'save_invoice',p); IF r IS NOT NULL THEN RETURN r; END IF;
 IF fid IS NULL OR jsonb_typeof(p->'lines') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p->'lines')=0 THEN RAISE EXCEPTION 'Factură fără ID/linii'; END IF;
 IF (p->>'data_factura') IS NULL OR (p->>'data_factura') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
   RAISE EXCEPTION 'Data facturii trebuie să fie ISO validă';
 END IF;
 SELECT * INTO STRICT sup FROM public.ep_furnizori WHERE id=sid;
 SELECT * INTO f FROM public.ep_facturi WHERE id=fid FOR UPDATE;
 IF FOUND THEN
   IF f.revision IS DISTINCT FROM (p->>'expected_revision')::bigint THEN RAISE EXCEPTION 'Factura a fost modificată între timp'; END IF;
   b:=ep_private.invoice_snapshot(fid);
 ELSE
   IF (p->>'expected_revision')::bigint IS DISTINCT FROM 0::bigint THEN RAISE EXCEPTION 'Factura nu există'; END IF;
   INSERT INTO public.ep_facturi(id,furnizor_id,numar,data_factura,status_document,
     furnizor_denumire_originala,furnizor_cui_original,observatii,created_by)
   VALUES(fid,sid,upper(btrim(regexp_replace(p->>'numar','[[:space:]]+',' ','g'))),dt,
     coalesce(p->>'status_document','În firmă'),sup.denumire,sup.cui,p->>'observatii',uid);
 END IF;
 -- O singură citire a implicitului pentru toate liniile noi care nu trimit un coeficient propriu.
 def:=ep_private.default_markup();
 SET CONSTRAINTS public.ep_linii_ordine DEFERRED;
 FOR j IN SELECT value FROM jsonb_array_elements(p->'lines') LOOP
   lid:=(j->>'id')::uuid;
   IF lid IS NULL OR lid=ANY(ids) THEN RAISE EXCEPTION 'ID de linie lipsă/duplicat'; END IF;
   ids:=array_append(ids,lid); n:=n+1; q:=ep_private.qty(j->'cantitate');
   net:=(j->>'pret_achizitie_net')::numeric;
   plate:=ep_private.plate(j->>'nr_inmatriculare'); vid:=(j->>'vehicle_id')::bigint;
   SELECT * INTO l FROM public.ep_factura_linii WHERE id=lid;
   IF FOUND THEN
     IF l.factura_id<>fid THEN RAISE EXCEPTION 'Linia aparține altei facturi'; END IF;
     used:=l.cantitate-ep_private.capacity(lid,NULL);
     IF q<used THEN RAISE EXCEPTION 'Cantitatea este deja folosită'; END IF;
     SELECT count(*),CASE WHEN count(*)=1 THEN min(nr_inmatriculare_original) ELSE '' END
       INTO acount,old_plate FROM public.ep_alocari WHERE linie_id=lid AND cantitate>0;
     IF used>0 AND plate IS DISTINCT FROM coalesce(old_plate,'') THEN
       RAISE EXCEPTION 'Schimbă mașina prin atribuiri, nu prin factura folosită';
     END IF;
     vat:=CASE WHEN j ? 'tva_proc' THEN (j->>'tva_proc')::numeric ELSE l.tva_proc END;
     coef:=CASE WHEN j ? 'coeficient_df' THEN (j->>'coeficient_df')::numeric ELSE l.coeficient_df END;
     UPDATE public.ep_factura_linii SET nr_crt=n,denumire=btrim(j->>'denumire'),
       cod_piesa=upper(btrim(j->>'cod_piesa')),cantitate=q,pret_achizitie_net=net,
       tva_proc=vat,coeficient_df=coef,locatie=j->>'locatie',
       observatii=CASE WHEN j ? 'observatii' THEN j->>'observatii' ELSE l.observatii END
       WHERE id=lid;
   ELSE
     used:=0;
     vat:=CASE WHEN j ? 'tva_proc' THEN (j->>'tva_proc')::numeric ELSE 21 END;
     coef:=CASE WHEN j ? 'coeficient_df' THEN (j->>'coeficient_df')::numeric ELSE def END;
     INSERT INTO public.ep_factura_linii(id,factura_id,nr_crt,denumire,cod_piesa,cantitate,
       pret_achizitie_net,tva_proc,coeficient_df,locatie,observatii)
     VALUES(lid,fid,n,btrim(j->>'denumire'),upper(btrim(j->>'cod_piesa')),q,net,vat,coef,
       coalesce(j->>'locatie','Recepție'),j->>'observatii');
   END IF;
   IF used=0 AND plate<>'' THEN
     IF l.blocaj_istoric IS NOT NULL THEN RAISE EXCEPTION 'Poziție cu istoric protejat'; END IF;
     PERFORM ep_private.check_vehicle(vid,plate);
     INSERT INTO public.ep_alocari(linie_id,vehicle_id,nr_inmatriculare_original,model_original,cantitate,created_by)
     VALUES(lid,vid,plate,j->>'model',q,uid);
   ELSIF plate='' AND vid IS NOT NULL THEN
     RAISE EXCEPTION 'Fișa auto nu se trimite fără înmatriculare';
   END IF;
   PERFORM ep_private.validate_line(lid);
 END LOOP;
 FOR l IN SELECT * FROM public.ep_factura_linii WHERE factura_id=fid AND NOT(id=ANY(ids)) LOOP
   removed:=removed||jsonb_build_array(ep_private.remove_unused_line(l.id));
 END LOOP;
 IF jsonb_array_length(removed)>0 THEN b:=b||jsonb_build_object('removed_lines',removed); END IF;
 IF EXISTS(SELECT 1 FROM public.ep_retururi x JOIN public.ep_factura_linii y ON y.id=x.linie_id
           WHERE y.factura_id=fid AND x.data_retur<dt)
 OR EXISTS(SELECT 1 FROM public.ep_transferuri_magazie x JOIN public.ep_factura_linii y ON y.id=x.linie_id
           WHERE y.factura_id=fid AND x.data_trimitere<dt) THEN
   RAISE EXCEPTION 'Data facturii depășește data operațiilor legate';
 END IF;
 UPDATE public.ep_facturi SET furnizor_id=sid,
   numar=upper(btrim(regexp_replace(p->>'numar','[[:space:]]+',' ','g'))),data_factura=dt,
   status_document=coalesce(p->>'status_document','În firmă'),observatii=p->>'observatii',
   furnizor_denumire_originala=sup.denumire,furnizor_cui_original=sup.cui,
   revision=CASE WHEN b IS NULL THEN revision ELSE revision+1 END
   WHERE id=fid RETURNING * INTO f;
 SET CONSTRAINTS public.ep_linii_ordine IMMEDIATE;
 r:=jsonb_build_object('id',fid,'revision',f.revision);
 RETURN ep_private.finish_request(p_request,'save_invoice',p,'ep_facturi',fid::text,
   b,ep_private.invoice_snapshot(fid),r);
END $function$
;

-- Ștergere explicită și indivizibilă: întâi verificăm toate pozițiile, apoi eliminăm.
CREATE FUNCTION ep_private.delete_invoice(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE r jsonb; f public.ep_facturi%ROWTYPE; l public.ep_factura_linii%ROWTYPE;
 fid uuid:=(p->>'id')::uuid; reasons text[]:=ARRAY[]::text[]; reason text;
 removed jsonb:='[]'::jsonb;
BEGIN
 PERFORM ep_private.require_access();
 r:=ep_private.begin_request(p_request,'delete_invoice',p);
 IF r IS NOT NULL THEN RETURN r; END IF;
 SELECT * INTO f FROM public.ep_facturi WHERE id=fid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Factura nu mai există. Actualizează registrul.'; END IF;
 IF f.revision IS DISTINCT FROM (p->>'expected_revision')::bigint THEN
   RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Factura a fost modificată. Actualizează registrul înainte de ștergere.';
 END IF;
 FOR l IN SELECT * FROM public.ep_factura_linii WHERE factura_id=fid ORDER BY nr_crt LOOP
   reason:=ep_private.line_delete_blockers(l.id);
   IF reason<>'' THEN reasons:=array_append(reasons,l.denumire||': '||reason); END IF;
 END LOOP;
 IF cardinality(reasons)>0 THEN
   RAISE EXCEPTION 'Factura nu poate fi ștearsă. %',array_to_string(reasons,'; ');
 END IF;
 FOR l IN SELECT * FROM public.ep_factura_linii WHERE factura_id=fid ORDER BY nr_crt LOOP
   removed:=removed||jsonb_build_array(ep_private.remove_unused_line(l.id));
 END LOOP;
 DELETE FROM public.ep_facturi WHERE id=fid;
 r:=jsonb_build_object('id',fid,'deleted',true,'deleted_lines',jsonb_array_length(removed));
 RETURN ep_private.finish_request(p_request,'delete_invoice',p,'ep_facturi',fid::text,
   jsonb_build_object('invoice',to_jsonb(f),'removed_lines',removed),NULL,r);
EXCEPTION WHEN foreign_key_violation THEN
 RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='Factura nu poate fi ștearsă: există alte dependențe protejate.';
END $fn$;
CREATE FUNCTION public.ep_delete_invoice(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
 SELECT ep_private.delete_invoice(p_request,p)
$fn$;
REVOKE ALL ON FUNCTION ep_private.delete_invoice(uuid,jsonb),public.ep_delete_invoice(uuid,jsonb)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION ep_private.delete_invoice(uuid,jsonb),public.ep_delete_invoice(uuid,jsonb)
 TO authenticated;

COMMIT;
