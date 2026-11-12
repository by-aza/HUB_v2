-- EP: autorul importului DF din auditul existent; versiunea 20261112141250 APLICATĂ ÎN PRODUCȚIE, conform confirmării utilizatorului.
-- Fără DML, tabele noi, backfill, politici, granturi sau modificări ale RPC-urilor de scriere.
-- Preflight read-only: HUB xyovkxmtbvgcwavuyxxu, PostgreSQL 17.6, 12.11.2026.
-- Rollback: restaurează definiția anterioară load_registry din 03_IMPORT_DF_EP.sql;
-- păstrează owner/ACL. Frontendul acceptă lipsa created_by la importuri.
BEGIN;
DO $migration$
DECLARE
 definition text := pg_get_functiondef('ep_private.load_registry()'::regprocedure);
 old_fragment text := $old$'qty',d.cantitate,'snapshot',d.ep_snapshot)$old$;
 new_fragment text := $new$'qty',d.cantitate,'snapshot',d.ep_snapshot,
    -- Numai auditul care introduce UUID-ul importului, niciodată creatorul antetului DF.
    'created_by',(
      SELECT CASE WHEN count(*)=1 THEN (array_agg(log.user_id))[1] END
      FROM public.audit_logs log
      CROSS JOIN LATERAL (SELECT CASE WHEN log.descriere IS JSON OBJECT
        THEN log.descriere::jsonb ELSE '{}'::jsonb END AS doc) audit
      WHERE log.modul='Evidență Facturi & Piese' AND log.actiune='save_df'
        AND log.entitate='deviz_final' AND log.entitate_id=d.id_deviz_final::text
        AND audit.doc->>'format'='1'
        AND jsonb_typeof(audit.doc->'before')='array'
        AND jsonb_typeof(audit.doc->'after')='array'
        AND nullif(d.ep_snapshot->>'imported_at','') IS NOT NULL
        AND audit.doc->'after' @> jsonb_build_array(jsonb_build_object(
          'ep_import_id',d.ep_import_id,'ep_snapshot',jsonb_build_object(
            'imported_at',d.ep_snapshot->>'imported_at')))
        AND NOT (audit.doc->'before' @> jsonb_build_array(jsonb_build_object(
          'ep_import_id',d.ep_import_id)))
    ))$new$;
BEGIN
 -- Garda refuză înlocuirea peste un contract schimbat între timp; ACL/owner rămân intacte.
 IF current_user<>'postgres' OR md5(definition)<>'5196ccef2adcdfeca8451f5e4ddce2b7'
    OR strpos(definition,old_fragment)=0 THEN
   RAISE EXCEPTION 'Contract EP modificat: load_registry; reia review-ul';
 END IF;
 EXECUTE replace(definition,old_fragment,new_fragment);
END $migration$;
NOTIFY pgrst,'reload schema';
COMMIT;
