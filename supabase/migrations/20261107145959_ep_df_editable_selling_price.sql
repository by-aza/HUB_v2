-- APLICAT ÎN SUPABASE DE PRODUCȚIE; versiunea confirmată de utilizator. Preț de vânzare DF independent de sursa EP.
-- Fără DML/backfill: DF-244 și toate valorile/snapshot-urile deja salvate rămân intacte.
-- Înlocuiri punctuale cu gardă de contract; păstrează ACL, owner, audit, lock și revizii.
BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(19520,7001);
DO $migration$
DECLARE definition text; previous text; replacement text;
BEGIN
 IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Owner de migrare neașteptat'; END IF;
 definition := pg_get_functiondef('ep_private.save_df(bigint,jsonb,jsonb)'::regprocedure);
 previous := $old$  price:=(snap->>'unit_price')::numeric;
  IF nullif(j->>'pret_unitar','') IS NOT NULL AND (j->>'pret_unitar')::numeric<>price THEN RAISE EXCEPTION 'Prețul importat se păstrează din snapshot; elimină/reimportă pentru o sursă nouă'; END IF;$old$;
 replacement := $new$  -- Preț DF independent; snapshot-ul financiar vine numai din DB, niciodată de la client.
  price:=coalesce(nullif(j->>'pret_unitar','')::numeric,old.pret_unitar,(snap->>'unit_price')::numeric);
  IF price<0 OR price::text IN ('NaN','Infinity','-Infinity') THEN
   RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Prețul de vânzare DF trebuie să fie finit și nenegativ';
  END IF;$new$;
 IF (length(definition)-length(replace(definition,previous,'')))/length(previous) <> 1 THEN
  RAISE EXCEPTION 'Contract save_df modificat; reia review-ul înainte de migrare';
 END IF;
 EXECUTE replace(definition,previous,replacement);
 definition := pg_get_functiondef('ep_private.save_df_base(bigint,jsonb,jsonb)'::regprocedure);
 previous := $old$        if v_line->>'ep_import_id' is not null then$old$;
 replacement := $new$        -- Numai importurile obișnuite nemodificate folosesc EP; prețurile legacy păstrate folosesc DF.
        if v_line->>'ep_import_id' is not null
           and v_price = (v_line->'ep_snapshot'->>'unit_price')::numeric
           and (v_line->'ep_snapshot'->'manual_df_price_preserved') is distinct from 'true'::jsonb then$new$;
 IF (length(definition)-length(replace(definition,previous,'')))/length(previous) <> 1 THEN
  RAISE EXCEPTION 'Contract save_df_base modificat; reia review-ul înainte de migrare';
 END IF;
 EXECUTE replace(definition,previous,replacement);
END $migration$;
COMMIT;
