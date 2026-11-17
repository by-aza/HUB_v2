-- APLICATĂ ÎN PRODUCȚIE: asocieri cantitative DF fără import; versiunea 20261117085755, conform confirmării utilizatorului.
-- Țintă inspectată read-only: HUB xyovkxmtbvgcwavuyxxu, 17.11.2026.
-- Necesită EP, eliberări 06.11 și loaderul de autori 12.11 deja instalate.
-- Fără DML/backfill asupra datelor existente. Nu se reaplică pachetele istorice EP.
BEGIN;
SET LOCAL lock_timeout='10s';
SELECT pg_advisory_xact_lock(19520,7001);
DO $preflight$
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'Owner de migrare neașteptat'; END IF;
 IF md5(pg_get_functiondef('ep_private.begin_request(uuid,text,jsonb)'::regprocedure))<>'069a8e89d2a5e996c4fb6b3d3dbb1b17' THEN RAISE EXCEPTION 'Contract begin_request schimbat; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.capacity(uuid,uuid)'::regprocedure))<>'b021203805d767438f5e890ce2ae47e0' THEN RAISE EXCEPTION 'Contract capacity schimbat; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.load_registry()'::regprocedure))<>'90f359da70eb3581810abdda7e984bd1' THEN RAISE EXCEPTION 'Contract load_registry schimbat; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.save_allocations(uuid,jsonb)'::regprocedure))<>'87ede2baccf8b4c81d5f5fc649440efd' THEN RAISE EXCEPTION 'Contract save_allocations schimbat; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.release_quantity(uuid,jsonb)'::regprocedure))<>'83f3d3a478c579ba7f4117d39bfe2807' THEN RAISE EXCEPTION 'Contract release_quantity schimbat; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.validate_line(uuid)'::regprocedure))<>'56d642295fc281238e4e09b11ccd6f2f' THEN RAISE EXCEPTION 'Contract validate_line schimbat; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.save_df(bigint,jsonb,jsonb)'::regprocedure))<>'e2ad22515cc6354093ca84b044d5d0d2' THEN RAISE EXCEPTION 'Contract save_df schimbat; reia review-ul'; END IF;
 IF md5(pg_get_functiondef('ep_private.list_df_parts(text,text,bigint,bigint)'::regprocedure))<>'3cf81c2ddcb31ac3549c519c40351d9e' THEN RAISE EXCEPTION 'Contract list_df_parts schimbat; reia review-ul'; END IF;
END $preflight$;

-- Asocierea este separată de liniile DF; FK-urile păstrează sursa și documentul.
CREATE TABLE public.ep_asocieri_df (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 alocare_id uuid NOT NULL REFERENCES public.ep_alocari(id) ON DELETE RESTRICT,
 df_id bigint NOT NULL REFERENCES public.deviz_final_header(id_deviz_final) ON DELETE RESTRICT,
 cantitate integer NOT NULL CHECK(cantitate>0),
 nr_inmatriculare_original text NOT NULL,
 created_by uuid NOT NULL REFERENCES public.auth_profiles(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(df_id,alocare_id)
);
CREATE INDEX ep_asocieri_df_allocation_idx ON public.ep_asocieri_df(alocare_id);
CREATE INDEX ep_asocieri_df_actor_idx ON public.ep_asocieri_df(created_by);
ALTER TABLE public.ep_asocieri_df ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ep_asocieri_df FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.ep_asocieri_df TO authenticated;
CREATE POLICY ep_asocieri_df_read ON public.ep_asocieri_df FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.auth_profiles p WHERE p.id=(SELECT auth.uid())
   AND (p.rol_id=1 OR p.permissions->'evidenta_piese'='true'::jsonb)));

-- Identitatea urmează resolverul DF existent, inclusiv vehiculele fără fișă în registru.
CREATE FUNCTION ep_private.association_matches_df(p_allocation uuid,p_df bigint)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $fn$
DECLARE a public.ep_alocari%ROWTYPE; h public.deviz_final_header%ROWTYPE; ctx jsonb;
BEGIN
 SELECT * INTO STRICT a FROM public.ep_alocari WHERE id=p_allocation;
 SELECT * INTO STRICT h FROM public.deviz_final_header WHERE id_deviz_final=p_df;
 BEGIN
  ctx:=ep_private.df_context(h.nr_inmatriculare,h.serie_vin,h.vehicle_id,p_df);
 EXCEPTION WHEN raise_exception OR invalid_parameter_value THEN RETURN false;
 END;
 IF a.vehicle_id IS NOT NULL THEN RETURN a.vehicle_id IS NOT DISTINCT FROM (ctx->>'vehicle_id')::bigint; END IF;
 RETURN a.nr_inmatriculare_original=ctx->>'plate';
END $fn$;

-- Lista este read-only și limitată la DF-urile compatibile cu toate alocările cerute.
CREATE FUNCTION ep_private.list_association_dfs(p_allocation_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 PERFORM ep_private.require_access(); PERFORM ep_private.require_df();
 IF coalesce(cardinality(p_allocation_ids),0)=0 OR array_position(p_allocation_ids,NULL) IS NOT NULL
    OR (SELECT count(DISTINCT x) FROM unnest(p_allocation_ids) x)<>cardinality(p_allocation_ids)
    OR (SELECT count(*) FROM public.ep_alocari WHERE id=ANY(p_allocation_ids))<>cardinality(p_allocation_ids) THEN
  RAISE EXCEPTION 'Selecție de alocări invalidă';
 END IF;
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(row) ORDER BY row.id_deviz_final DESC) FROM (
  SELECT h.id_deviz_final,h.data_deviz,h.nr_inmatriculare,h.ep_revision
  FROM public.deviz_final_header h
  WHERE NOT EXISTS(SELECT 1 FROM public.ep_alocari a JOIN public.ep_factura_linii l ON l.id=a.linie_id
    WHERE a.id=ANY(p_allocation_ids) AND (l.blocaj_istoric IS NOT NULL OR ep_private.capacity(l.id,a.id)<=0
      OR NOT ep_private.association_matches_df(a.id,h.id_deviz_final)))
 ) row),'[]'::jsonb);
END $fn$;
CREATE FUNCTION public.ep_list_association_dfs(p_allocation_ids uuid[])
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $fn$
 SELECT ep_private.list_association_dfs(p_allocation_ids)
$fn$;

-- Lot atomic, cantități parțiale, revizii per factură și retry cu UUID/payload neschimbate.
CREATE FUNCTION ep_private.associate_df(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE uid uuid:=ep_private.require_access(); r jsonb; j jsonb; recorded jsonb:='[]';
 h public.deviz_final_header%ROWTYPE; a public.ep_alocari%ROWTYPE;
 l public.ep_factura_linii%ROWTYPE; f public.ep_facturi%ROWTYPE;
 aid uuid; sid uuid; q integer; df bigint:=(p->>'df_id')::bigint;
 ids uuid[]:='{}'; sources uuid[]:='{}'; invoices uuid[]:='{}';
BEGIN
 PERFORM ep_private.require_df();
 r:=ep_private.begin_request(p_request,'associate_df',p); IF r IS NOT NULL THEN RETURN r; END IF;
 IF jsonb_typeof(p->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(p->'items')=0 THEN
  RAISE EXCEPTION 'Selectează cel puțin o alocare';
 END IF;
 SELECT * INTO STRICT h FROM public.deviz_final_header WHERE id_deviz_final=df FOR UPDATE;
 IF h.ep_revision IS DISTINCT FROM (p->>'expected_df_revision')::bigint THEN
  RAISE EXCEPTION 'DF modificat între timp. Reîncarcă lista.';
 END IF;
 FOR j IN SELECT value FROM jsonb_array_elements(p->'items') LOOP
  sid:=(j->>'id')::uuid; aid:=(j->>'alocare_id')::uuid; q:=ep_private.qty(j->'cantitate');
  IF sid IS NULL OR aid IS NULL OR sid=ANY(ids) OR aid=ANY(sources) THEN RAISE EXCEPTION 'Asociere duplicată sau invalidă'; END IF;
  ids:=array_append(ids,sid); sources:=array_append(sources,aid);
  SELECT * INTO STRICT a FROM public.ep_alocari WHERE id=aid;
  SELECT * INTO STRICT l FROM public.ep_factura_linii WHERE id=a.linie_id;
  SELECT * INTO STRICT f FROM public.ep_facturi WHERE id=l.factura_id FOR UPDATE;
  IF f.revision IS DISTINCT FROM (j->>'expected_revision')::bigint THEN RAISE EXCEPTION 'Factura a fost modificată. Reîncarcă registrul.'; END IF;
  IF l.blocaj_istoric IS NOT NULL OR NOT ep_private.association_matches_df(aid,df) THEN RAISE EXCEPTION 'Alocarea este protejată sau aparține altei mașini'; END IF;
  IF EXISTS(SELECT 1 FROM public.ep_asocieri_df WHERE alocare_id=aid AND df_id=df) THEN RAISE EXCEPTION 'Alocarea este deja asociată acestui DF'; END IF;
  IF q>ep_private.capacity(l.id,aid) THEN RAISE EXCEPTION 'Cantitatea asociată depășește disponibilul actual'; END IF;
  INSERT INTO public.ep_asocieri_df(id,alocare_id,df_id,cantitate,nr_inmatriculare_original,created_by)
   VALUES(sid,aid,df,q,a.nr_inmatriculare_original,uid);
  PERFORM ep_private.validate_line(l.id);
  SELECT recorded||jsonb_build_array(to_jsonb(s)) INTO recorded FROM public.ep_asocieri_df s WHERE id=sid;
  IF NOT(f.id=ANY(invoices)) THEN invoices:=array_append(invoices,f.id); END IF;
 END LOOP;
 UPDATE public.ep_facturi SET revision=revision+1 WHERE id=ANY(invoices);
 r:=jsonb_build_object('df_id',df,'associations',recorded);
 RETURN ep_private.finish_request(p_request,'associate_df',p,'deviz_final',df::text,'[]',recorded,r);
END $fn$;
CREATE FUNCTION public.ep_associate_df(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $fn$
 SELECT ep_private.associate_df(p_request,p)
$fn$;

-- Asocierea nu poate fi mutată indirect la altă mașină prin editarea antetului DF.
CREATE FUNCTION ep_private.protect_associated_df() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF (ep_private.plate(NEW.nr_inmatriculare) IS DISTINCT FROM ep_private.plate(OLD.nr_inmatriculare)
    OR NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id
    OR ep_private.plate(NEW.serie_vin) IS DISTINCT FROM ep_private.plate(OLD.serie_vin))
   AND EXISTS(SELECT 1 FROM public.ep_asocieri_df WHERE df_id=OLD.id_deviz_final) THEN
  RAISE EXCEPTION 'Mașina DF are asocieri de piese; identitatea trebuie păstrată';
 END IF;
 RETURN NEW;
END $fn$;
CREATE TRIGGER ep_associated_df_identity BEFORE UPDATE ON public.deviz_final_header
 FOR EACH ROW EXECUTE FUNCTION ep_private.protect_associated_df();

REVOKE ALL ON FUNCTION ep_private.association_matches_df(uuid,bigint),ep_private.protect_associated_df(),
 ep_private.list_association_dfs(uuid[]),public.ep_list_association_dfs(uuid[]),
 ep_private.associate_df(uuid,jsonb),public.ep_associate_df(uuid,jsonb)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION ep_private.list_association_dfs(uuid[]),public.ep_list_association_dfs(uuid[]),
 ep_private.associate_df(uuid,jsonb),public.ep_associate_df(uuid,jsonb) TO authenticated;

-- Înlocuiri punctuale: importurile, retururile și magazia citesc același disponibil.
DO $patch_capacity$
DECLARE definition text:=pg_get_functiondef('ep_private.capacity(uuid,uuid)'::regprocedure);
 old text:=$old$   - coalesce((SELECT sum(cantitate) FROM public.deviz_final_linii WHERE ep_alocare_id=p_allocation),0);$old$;
 replacement text:=$new$   - coalesce((SELECT sum(cantitate) FROM public.deviz_final_linii WHERE ep_alocare_id=p_allocation),0)
   - coalesce((SELECT sum(cantitate) FROM public.ep_asocieri_df WHERE alocare_id=p_allocation),0);$new$;
BEGIN
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN
  RAISE EXCEPTION 'Fragment capacity schimbat; reia review-ul';
 END IF;
 EXECUTE replace(definition,old,replacement);
END $patch_capacity$;
DO $patch_save_allocations$
DECLARE definition text:=pg_get_functiondef('ep_private.save_allocations(uuid,jsonb)'::regprocedure);
 old text:=$old$OR EXISTS(SELECT 1 FROM public.deviz_final_linii WHERE ep_alocare_id=aid)$old$;
 replacement text:=$new$OR EXISTS(SELECT 1 FROM public.deviz_final_linii WHERE ep_alocare_id=aid)
        OR EXISTS(SELECT 1 FROM public.ep_asocieri_df WHERE alocare_id=aid)$new$;
BEGIN
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN
  RAISE EXCEPTION 'Fragment save_allocations schimbat; reia review-ul';
 END IF;
 EXECUTE replace(definition,old,replacement);
END $patch_save_allocations$;
DO $patch_release_quantity$
DECLARE definition text:=pg_get_functiondef('ep_private.release_quantity(uuid,jsonb)'::regprocedure);
 old text:=$old$IF EXISTS(SELECT 1 FROM public.deviz_final_linii WHERE ep_alocare_id=target)$old$;
 replacement text:=$new$IF EXISTS(SELECT 1 FROM public.ep_asocieri_df WHERE alocare_id=target)
      OR EXISTS(SELECT 1 FROM public.deviz_final_linii WHERE ep_alocare_id=target)$new$;
BEGIN
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN
  RAISE EXCEPTION 'Fragment release_quantity schimbat; reia review-ul';
 END IF;
 EXECUTE replace(definition,old,replacement);
END $patch_release_quantity$;
DO $patch_load_registry$
DECLARE definition text:=pg_get_functiondef('ep_private.load_registry()'::regprocedure);
 old text:=$old$  'defaults',jsonb_build_object($old$;
 replacement text:=$new$  'associations',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.created_at,s.id) FROM public.ep_asocieri_df s),'[]'::jsonb),
  'defaults',jsonb_build_object($new$;
BEGIN
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN
  RAISE EXCEPTION 'Fragment load_registry schimbat; reia review-ul';
 END IF;
 EXECUTE replace(definition,old,replacement);
END $patch_load_registry$;

COMMIT;
