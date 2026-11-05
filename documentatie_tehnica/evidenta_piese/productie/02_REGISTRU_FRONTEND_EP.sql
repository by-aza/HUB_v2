-- Candidat producție HUB AUTO: 02_REGISTRU_FRONTEND_EP.sql; PREGĂTIT, NEAPLICAT.
-- Proiect țintă: xyovkxmtbvgcwavuyxxu. Fără seed, date LAB sau migrări cleanup.
-- Proveniență: INTEGRARE_FRONTEND_LAB_20261105.sql; se aplică numai după review, backup și aprobare separată.
BEGIN;
-- Loader-ul se pregătește numai peste backendul EP consolidat, cu proprietarul așteptat.
DO $target$ BEGIN
 IF current_user<>'postgres' OR to_regnamespace('ep_private') IS NULL OR
 (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND c.relname IN
  ('ep_furnizori','ep_furnizor_conturi','ep_facturi','ep_factura_linii','ep_alocari','ep_retururi','ep_transferuri_magazie'))<>7 THEN
  RAISE EXCEPTION 'Aplică întâi backendul EP consolidat revizuit';
 END IF;
END $target$;
CREATE OR REPLACE FUNCTION ep_private.load_registry()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $fn$
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
  'defaults',jsonb_build_object('tva_proc',21,'coeficient_df',ep_private.default_markup()::text));
END $fn$;
CREATE OR REPLACE FUNCTION public.ep_load_registry()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=''
AS $fn$ SELECT ep_private.load_registry() $fn$;
REVOKE ALL ON FUNCTION ep_private.load_registry(),public.ep_load_registry() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION ep_private.load_registry(),public.ep_load_registry() TO authenticated;
-- Coeficientul se livrează ca text zecimal, inclusiv pentru liniile create după o modificare Admin.
CREATE OR REPLACE FUNCTION ep_private.get_defaults()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 PERFORM ep_private.require_access();
 RETURN jsonb_build_object('tva_proc',21,'coeficient_df',ep_private.default_markup()::text);
END $fn$;
REVOKE ALL ON FUNCTION ep_private.get_defaults() FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION ep_private.get_defaults() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
