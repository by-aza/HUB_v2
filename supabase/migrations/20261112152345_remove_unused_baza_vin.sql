-- PREGĂTIT, NEAPLICAT: elimină exclusiv public.baza_vin, datele și obiectele sale interne.
-- Înainte de aplicare: backup DB verificat/restaurabil și review complet al dependențelor.
-- Metadatele public din 12.11.2026 nu raportează FK; view-uri/funcții/alte scheme: NEEDS_REVIEW.
-- Fără CASCADE; după COMMIT, rollback-ul necesită restaurarea backupului DB.
BEGIN;
DROP TABLE public.baza_vin RESTRICT;
COMMIT;
