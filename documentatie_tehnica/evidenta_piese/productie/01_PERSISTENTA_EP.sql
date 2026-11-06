-- Candidat producție HUB AUTO: 01_PERSISTENTA_EP.sql; PREGĂTIT, NEAPLICAT.
-- Proiect țintă: xyovkxmtbvgcwavuyxxu. Fără seed, date LAB sau migrări cleanup.
-- Proveniență: APLICARE_PERSISTENTA_LAB_20261105.sql; se aplică numai după review, backup și aprobare separată.
BEGIN;
-- Oprim pachetul înainte de orice DDL dacă baza DF nu mai corespunde inspecției read-only.
DO $target$ BEGIN
 IF to_regprocedure('public.save_deviz_final(bigint,jsonb,jsonb)') IS NULL
 OR md5(pg_get_functiondef('public.save_deviz_final(bigint,jsonb,jsonb)'::regprocedure))<>'eca2da13bc75babb0a49d6706c4331dd'
 OR md5(pg_get_functiondef('private.resolve_deviz_final_vehicle(text,text)'::regprocedure))<>'8973b688c51212646e960cb6e8c7727f' THEN
  RAISE EXCEPTION 'Definițiile DF/vehicul diferă de preflight-ul producției; reia review-ul';
 END IF;
END $target$;
DO $preflight$
BEGIN
 IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Owner de migrare neașteptat'; END IF;
 IF to_regnamespace('ep_private') IS NOT NULL THEN RAISE EXCEPTION 'Schema EP există deja'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname LIKE 'ep_%') THEN RAISE EXCEPTION 'Obiecte EP preexistente'; END IF;
 IF has_column_privilege('authenticated','public.audit_logs','id','INSERT') THEN
   RAISE EXCEPTION 'Audit ID poate fi fabricat de client'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.auth_roles WHERE id=1 AND numire_rol='Admin') THEN
   RAISE EXCEPTION 'Rol Admin neașteptat'; END IF;
END $preflight$;
-- Contractul RPC, politica de acces și deciziile sunt în PLAN_EVIDENTA_PIESE.md §0.9.
-- Nu modifică tabele existente. Fără IF NOT EXISTS: o coliziune trebuie investigată.
-- CHECK/FK/UNIQUE nu garantează singure sumele dintre rânduri sau concurența.
-- Etapa curentă: exact șapte tabele. ep_importuri_df aparține unei etape viitoare,
-- fără DDL, FK către DF, indexuri sau politici în acest fișier.


-- Furnizori reutilizabili; fără integrare cu furnizorul text din Comenzi SH.
CREATE TABLE public.ep_furnizori (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  denumire text NOT NULL CHECK (btrim(denumire) <> ''),
  cui text CHECK (cui IS NULL OR cui = upper(regexp_replace(cui,'[[:space:]]','','g'))),
  registru_comert text,
  persoana_contact text,
  oras text,
  adresa text,
  telefon text,
  email text,
  observatii text,
  activ boolean NOT NULL DEFAULT true,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.auth_profiles(id) ON DELETE RESTRICT,
  UNIQUE (cui)
);

-- Conturi multiple: normalizare ca în DEMO; fără validare nouă de checksum neaprobată.
CREATE TABLE public.ep_furnizor_conturi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  furnizor_id uuid NOT NULL REFERENCES public.ep_furnizori(id) ON DELETE RESTRICT,
  iban text NOT NULL CHECK (iban <> '' AND iban = upper(regexp_replace(iban,'[[:space:]]','','g'))),
  banca text,
  UNIQUE (furnizor_id, iban)
);

-- Documentul fizic are status manual. Factura rămâne editabilă după salvare.
CREATE TABLE public.ep_facturi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  furnizor_id uuid NOT NULL REFERENCES public.ep_furnizori(id) ON DELETE RESTRICT,
  numar text NOT NULL CHECK (
    numar <> '' AND numar = upper(btrim(regexp_replace(numar, '[[:space:]]+', ' ', 'g')))
  ),
  data_factura date NOT NULL CHECK (isfinite(data_factura)),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  status_document text NOT NULL DEFAULT 'În firmă' CHECK (status_document IN (
    'În firmă', 'Pregătită pentru contabilitate', 'Trimisă în contabilitate'
  )),
  -- Snapshot al furnizorului pentru versiunea salvată; reviziile se păstrează prin audit.
  furnizor_denumire_originala text NOT NULL CHECK (btrim(furnizor_denumire_originala) <> ''),
  furnizor_cui_original text,
  observatii text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.auth_profiles(id) ON DELETE RESTRICT,
  UNIQUE (furnizor_id, numar)
);

-- Preț unitar NET și cantitate originală: nu se reduc la retur/transfer/import.
-- Editarea explicită rămâne permisă cu regulile DEMO și audit, fără înghețare la salvare.
-- NUMERIC exact, fără limită zecimală nouă neaprobată sau conversie automată brut→net.
-- O factură/linie poate exista fără nicio alocare și fără înregistrare de vehicul.
CREATE TABLE public.ep_factura_linii (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid NOT NULL REFERENCES public.ep_facturi(id) ON DELETE RESTRICT,
  nr_crt integer NOT NULL CHECK (nr_crt > 0),
  denumire text NOT NULL CHECK (btrim(denumire) <> ''),
  cod_piesa text,
  cantitate integer NOT NULL CHECK (cantitate > 0),
  pret_achizitie_net numeric NOT NULL CHECK (
    pret_achizitie_net > 0 AND pret_achizitie_net < 'Infinity'::numeric
  ),
  tva_proc numeric NOT NULL DEFAULT 21 CHECK (tva_proc BETWEEN 0 AND 100),
  coeficient_df numeric NOT NULL DEFAULT 1.53 CHECK (
    coeficient_df > 0 AND coeficient_df < 'Infinity'::numeric
  ),
  locatie text,
  observatii text,
  -- Protecție opțională pentru viitoare date istorice ambigue; nu se importă DEMO automat.
  blocaj_istoric text,
  CONSTRAINT ep_linii_ordine UNIQUE (factura_id, nr_crt) DEFERRABLE INITIALLY IMMEDIATE
);

-- Alocarea păstrează sursa istorică; nu este montaj sau consum de stoc.
-- Fără mașină: nu se creează alocare. Cu înmatriculare cunoscută dar fără fișă:
-- vehicle_id poate rămâne NULL; nu se creează automat un vehicul în alt modul.
CREATE TABLE public.ep_alocari (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linie_id uuid NOT NULL REFERENCES public.ep_factura_linii(id) ON DELETE RESTRICT,
  vehicle_id bigint REFERENCES public.clienti_vehicule(id) ON DELETE RESTRICT,
  nr_inmatriculare_original text NOT NULL CHECK (
    nr_inmatriculare_original ~ '^[A-Z0-9]{4,12}$'
    AND nr_inmatriculare_original ~ '[A-Z]' AND nr_inmatriculare_original ~ '[0-9]'
  ),
  model_original text,
  cantitate integer NOT NULL CHECK (cantitate > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.auth_profiles(id) ON DELETE RESTRICT,
  UNIQUE (linie_id, id)
);

-- Retur efectiv înregistrat direct; alocare NULL înseamnă sursă nealocată.
CREATE TABLE public.ep_retururi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linie_id uuid NOT NULL REFERENCES public.ep_factura_linii(id) ON DELETE RESTRICT,
  alocare_id uuid,
  cantitate integer NOT NULL CHECK (cantitate > 0),
  data_retur date NOT NULL CHECK (isfinite(data_retur)),
  referinta text,
  motiv text,
  observatii text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.auth_profiles(id) ON DELETE RESTRICT,
  FOREIGN KEY (linie_id, alocare_id) REFERENCES public.ep_alocari(linie_id, id) ON DELETE RESTRICT
);

-- Trimitere, fără recepție/stoc nou; aceeași regulă de sursă ca la retur.
CREATE TABLE public.ep_transferuri_magazie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linie_id uuid NOT NULL REFERENCES public.ep_factura_linii(id) ON DELETE RESTRICT,
  alocare_id uuid,
  cantitate integer NOT NULL CHECK (cantitate > 0),
  data_trimitere date NOT NULL CHECK (isfinite(data_trimitere)),
  observatii text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.auth_profiles(id) ON DELETE RESTRICT,
  FOREIGN KEY (linie_id, alocare_id) REFERENCES public.ep_alocari(linie_id, id) ON DELETE RESTRICT
);

-- Indexuri pentru surse/FK și căutarea pe mașină, fără indexare excesivă.
-- UNIQUE-urile anterioare acoperă furnizor_id, factura_id și linie_id la alocări.
CREATE INDEX ep_alocari_vehicle_idx ON public.ep_alocari(vehicle_id);
CREATE INDEX ep_retururi_sursa_idx ON public.ep_retururi(linie_id, alocare_id);
CREATE INDEX ep_transferuri_sursa_idx ON public.ep_transferuri_magazie(linie_id, alocare_id);
-- created_by: FK și eventuale verificări contextuale; fără a impune proprietate exclusivă.
CREATE INDEX ep_furnizori_creator_idx ON public.ep_furnizori(created_by);
CREATE INDEX ep_facturi_creator_idx ON public.ep_facturi(created_by);
CREATE INDEX ep_alocari_creator_idx ON public.ep_alocari(created_by);
CREATE INDEX ep_retururi_creator_idx ON public.ep_retururi(created_by);
CREATE INDEX ep_transferuri_creator_idx ON public.ep_transferuri_magazie(created_by);

-- Acces inițial ÎNCHIS. Nu copiem granturile istorice largi sau excepțiile anon.
-- RLS fără politici refuză accesul normal; proprietarul/service_role au regimul PostgreSQL normal.
-- Nu se schimbă auth_profiles, auth_roles, granturile sau politicile tabelelor existente.
ALTER TABLE public.ep_furnizori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ep_furnizor_conturi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ep_facturi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ep_factura_linii ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ep_alocari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ep_retururi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ep_transferuri_magazie ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ep_furnizori, public.ep_furnizor_conturi,
  public.ep_facturi, public.ep_factura_linii, public.ep_alocari,
  public.ep_retururi, public.ep_transferuri_magazie
  FROM PUBLIC, anon, authenticated, service_role;

-- Model RLS aprobat, implementat în fișierul RPC separat:
-- TO authenticated, USING/WITH CHECK:
-- EXISTS (SELECT 1 FROM public.auth_profiles p WHERE p.id = (SELECT auth.uid())
--   AND (p.rol_id = 1 OR p.permissions->'evidenta_piese' = 'true'::jsonb))
-- Cheia aprobată este evidenta_piese; fără fallback implicit.
-- Manager/DF nu primesc acces automat fără Admin sau evidenta_piese=true.

-- OBLIGATORIU înainte de orice GRANT de scriere: RPC/guards server-side descrise în §0.9.
-- Fără acestea, acest DDL nu garantează integritatea cantitativă dintre tabele.
-- Editarea facturii păstrează ID-urile și regulile DEMO: antet/net/TVA/coeficient editabile,
-- cantitate cel puțin egală cu partea folosită, eliminare doar pentru linii complet libere,
-- minimum o linie, data facturii cel mult data oricărei operații legate.
-- Mașina unei linii folosite se corectează numai prin acțiunile de atribuire eligibile.
-- Returul/transferul nu modifică valorile facturii; o editare explicită se auditează înainte/după.
-- Finalizarea unui RPC trebuie să includă audit în public.audit_logs, în aceeași tranzacție.
-- UUID-urile pentru operații sunt generate/reținute de client pentru retry idempotent;
-- un retry cu același ID și payload diferit se respinge, nu se aplică ON CONFLICT DO NOTHING.

-- NECESITĂ preflight live ACL/RLS/owner/audit înainte de aprobare/aplicare.
-- API public SECURITY INVOKER → implementări SECURITY DEFINER în schema neexpusă.
-- DML direct refuzat; implementările verifică auth.uid + profil la fiecare apel.
-- Definer-ul este o poartă de scriere controlată, nu un remediu generic pentru RLS.
-- Owner-ul trebuie să fie un rol de migrare de încredere, nu authenticated/anon.
CREATE SCHEMA ep_private;
REVOKE ALL ON SCHEMA ep_private FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA ep_private TO authenticated;

-- Helpers fără EXECUTE din client; rulează numai în implementările autorizate.
CREATE FUNCTION ep_private.require_access(p_admin boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $fn$
DECLARE u uuid := auth.uid();
BEGIN
  IF u IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.auth_profiles p WHERE p.id=u
    AND (p.rol_id=1 OR (NOT p_admin AND p.permissions->'evidenta_piese'='true'::jsonb))
  ) THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Acces EP refuzat'; END IF;
  RETURN u;
END $fn$;

-- Implicit inițial. Adaptorul global opțional îl înlocuiește numai după aprobare separată.
CREATE FUNCTION ep_private.default_markup()
RETURNS numeric LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $fn$ SELECT 1.53::numeric $fn$;

CREATE FUNCTION ep_private.plate(p text)
RETURNS text LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = ''
AS $fn$ SELECT upper(regexp_replace(coalesce(p,''),'[^A-Za-z0-9]','','g')) $fn$;

CREATE FUNCTION ep_private.qty(p jsonb)
RETURNS integer LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = '' AS $fn$
DECLARE n numeric := (p #>> '{}')::numeric;
BEGIN
  IF n IS NULL OR NOT (n > 0 AND n <= 2147483647 AND n=trunc(n)) THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Cantitate întreagă pozitivă obligatorie';
  END IF;
  RETURN n::integer;
END $fn$;

-- O singură blocare pentru scrierile EP: simplu, corect pentru volumul intern estimat.
-- Nu serializează alte module. Direct DML este interzis clientului.
CREATE FUNCTION ep_private.begin_request(p_id uuid, p_action text, p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $fn$
DECLARE u uuid := ep_private.require_access(); a public.audit_logs%ROWTYPE; d jsonb;
BEGIN
  IF p_id IS NULL OR p_payload IS NULL THEN RAISE EXCEPTION 'UUID/payload obligatorii'; END IF;
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'RPC EP necesită READ COMMITTED';
  END IF;
  PERFORM pg_advisory_xact_lock(19520,7001);
  SELECT * INTO a FROM public.audit_logs WHERE id=p_id;
  IF FOUND THEN
    IF a.modul IS DISTINCT FROM 'Evidență Facturi & Piese'
       OR a.actiune IS DISTINCT FROM p_action OR a.user_id IS DISTINCT FROM u THEN
      RAISE EXCEPTION USING ERRCODE='23505', MESSAGE='UUID de operație deja folosit';
    END IF;
    d := a.descriere::jsonb;
    IF d->'request' IS DISTINCT FROM p_payload THEN
      RAISE EXCEPTION USING ERRCODE='23505', MESSAGE='Retry cu payload diferit';
    END IF;
    RETURN d->'result';
  END IF;
  RETURN NULL;
END $fn$;

CREATE FUNCTION ep_private.finish_request(
  p_id uuid, p_action text, p_payload jsonb, p_entity text, p_entity_id text,
  p_before jsonb, p_after jsonb, p_result jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $fn$
DECLARE u uuid := ep_private.require_access();
BEGIN
  INSERT INTO public.audit_logs(id,user_id,user_name,modul,actiune,entitate,entitate_id,descriere)
  SELECT p_id,u,concat_ws(' ',p.nume,p.prenume),'Evidență Facturi & Piese',
    p_action,p_entity,p_entity_id,
    jsonb_build_object('format',1,'request',p_payload,'before',p_before,
                       'after',p_after,'result',p_result)::text
  FROM public.auth_profiles p WHERE p.id=u;
  IF NOT FOUND THEN RAISE EXCEPTION 'Actorul nu mai există'; END IF;
  RETURN p_result;
END $fn$;

CREATE FUNCTION ep_private.invoice_snapshot(p_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $fn$
 SELECT jsonb_build_object('invoice',to_jsonb(f),
   'lines',coalesce((SELECT jsonb_agg(to_jsonb(l) ORDER BY l.nr_crt)
                    FROM public.ep_factura_linii l WHERE l.factura_id=f.id),'[]'::jsonb),
   'allocations',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.id)
      FROM public.ep_alocari a JOIN public.ep_factura_linii l ON l.id=a.linie_id
      WHERE l.factura_id=f.id),'[]'::jsonb))
 FROM public.ep_facturi f WHERE f.id=p_id
$fn$;

CREATE FUNCTION ep_private.capacity(p_line uuid,p_allocation uuid DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $fn$
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
               WHERE linie_id=p_line AND alocare_id IS NOT DISTINCT FROM p_allocation),0);
END $fn$;

CREATE FUNCTION ep_private.validate_line(p_line uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $fn$
DECLARE a record;
BEGIN
 IF ep_private.capacity(p_line,NULL)<0 THEN RAISE EXCEPTION 'Cantitate nealocată negativă'; END IF;
 FOR a IN SELECT id FROM public.ep_alocari WHERE linie_id=p_line LOOP
   IF ep_private.capacity(p_line,a.id)<0 THEN RAISE EXCEPTION 'Alocare consumată peste limită'; END IF;
 END LOOP;
END $fn$;

-- Legarea opțională la fișa auto nu creează vehicule și nu schimbă registrul existent.
CREATE FUNCTION ep_private.check_vehicle(p_vehicle bigint,p_plate text)
RETURNS void LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $fn$
BEGIN
 IF p_vehicle IS NOT NULL AND NOT EXISTS (
   SELECT 1 FROM public.clienti_vehicule v
   WHERE v.id=p_vehicle AND ep_private.plate(v.nr_inmatriculare)=p_plate
 ) THEN RAISE EXCEPTION 'Fișa auto nu corespunde înmatriculării'; END IF;
END $fn$;

-- Furnizor + toate conturile: o singură tranzacție, revizie optimistă, audit complet.
-- p: {id,expected_revision:0|n,denumire,cui,...,conturi:[{id?,iban,banca}]}
CREATE FUNCTION ep_private.save_supplier(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE r jsonb; b jsonb; a jsonb; c jsonb; f public.ep_furnizori%ROWTYPE;
  uid uuid := ep_private.require_access(); fid uuid := (p->>'id')::uuid;
BEGIN
 r:=ep_private.begin_request(p_request,'save_supplier',p); IF r IS NOT NULL THEN RETURN r; END IF;
 IF fid IS NULL OR jsonb_typeof(p->'conturi') IS DISTINCT FROM 'array' THEN
   RAISE EXCEPTION 'ID și lista de conturi sunt obligatorii';
 END IF;
 IF nullif(btrim(p->>'email'),'') IS NOT NULL
    AND btrim(p->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
   RAISE EXCEPTION 'Adresă email invalidă';
 END IF;
 SELECT * INTO f FROM public.ep_furnizori WHERE id=fid FOR UPDATE;
 IF FOUND THEN
   IF f.revision IS DISTINCT FROM (p->>'expected_revision')::bigint THEN RAISE EXCEPTION 'Furnizor modificat între timp'; END IF;
   SELECT jsonb_build_object('supplier',to_jsonb(f),'accounts',
     coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id) FILTER (WHERE x.id IS NOT NULL),'[]'::jsonb))
     INTO b FROM public.ep_furnizor_conturi x WHERE x.furnizor_id=fid;
 ELSE
   IF (p->>'expected_revision')::bigint IS DISTINCT FROM 0::bigint THEN RAISE EXCEPTION 'Furnizor inexistent'; END IF;
   INSERT INTO public.ep_furnizori(id,denumire,created_by)
   VALUES(fid,btrim(p->>'denumire'),uid);
 END IF;
 UPDATE public.ep_furnizori SET
   denumire=btrim(p->>'denumire'),cui=nullif(upper(regexp_replace(p->>'cui','[[:space:]]','','g')),''),
   registru_comert=upper(btrim(p->>'registru_comert')),persoana_contact=btrim(p->>'persoana_contact'),
   oras=btrim(p->>'oras'),adresa=btrim(p->>'adresa'),telefon=btrim(p->>'telefon'),email=btrim(p->>'email'),
   observatii=p->>'observatii',activ=coalesce((p->>'activ')::boolean,true),
   revision=CASE WHEN b IS NULL THEN revision ELSE revision+1 END
 WHERE id=fid RETURNING * INTO f;
 -- Conturile nu au consumatori FK în această etapă; ID-urile trimise sunt păstrate.
 DELETE FROM public.ep_furnizor_conturi WHERE furnizor_id=fid;
 FOR c IN SELECT value FROM jsonb_array_elements(p->'conturi') LOOP
   IF nullif(btrim(c->>'iban'),'') IS NULL THEN
     IF nullif(btrim(c->>'banca'),'') IS NOT NULL THEN RAISE EXCEPTION 'Bancă fără IBAN'; END IF;
     CONTINUE;
   END IF;
   INSERT INTO public.ep_furnizor_conturi(id,furnizor_id,iban,banca)
   VALUES(coalesce((c->>'id')::uuid,gen_random_uuid()),fid,
     upper(regexp_replace(c->>'iban','[[:space:]]','','g')),c->>'banca');
 END LOOP;
 SELECT jsonb_build_object('supplier',to_jsonb(f),'accounts',
   coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id) FILTER (WHERE x.id IS NOT NULL),'[]'::jsonb))
   INTO a FROM public.ep_furnizor_conturi x WHERE x.furnizor_id=fid;
 r:=jsonb_build_object('id',fid,'revision',f.revision);
 RETURN ep_private.finish_request(p_request,'save_supplier',p,'ep_furnizori',fid::text,b,a,r);
END $fn$;

-- Factură editabilă: payload complet, minimum o linie. Fără confirmare/înghețare.
-- p: {id,expected_revision:0|n,furnizor_id,numar,data_factura,status_document,observatii,
--     lines:[{id,denumire,cod_piesa,cantitate,pret_achizitie_net,tva_proc?,
--       coeficient_df?,nr_inmatriculare?,model?,vehicle_id?,locatie?,observatii?}]}
-- Coeficient absent pe linie existentă păstrează valoarea; NULL explicit este invalid.
CREATE FUNCTION ep_private.save_invoice(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE r jsonb; b jsonb; j jsonb; f public.ep_facturi%ROWTYPE; l public.ep_factura_linii%ROWTYPE;
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
       INTO acount,old_plate FROM public.ep_alocari WHERE linie_id=lid;
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
   IF l.cantitate<>ep_private.capacity(l.id,NULL) OR l.blocaj_istoric IS NOT NULL THEN
     RAISE EXCEPTION 'Nu se poate elimina o poziție folosită/protejată';
   END IF;
   DELETE FROM public.ep_factura_linii WHERE id=l.id;
 END LOOP;
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
END $fn$;

-- Atribuire individuală/bulk sau corecție: toate elementele reușesc sau niciunul.
-- p: {items:[{id,linie_id,expected_revision,cantitate,nr_inmatriculare,model?,vehicle_id?}]}
-- Pentru bulk, clientul trimite cantitatea dorită pentru fiecare linie; serverul o revalidează.
CREATE FUNCTION ep_private.save_allocations(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
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
        OR EXISTS(SELECT 1 FROM public.ep_transferuri_magazie WHERE alocare_id=aid) THEN
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
END $fn$;

-- Retur simplificat / trimitere: INSERT unic, fără stadii sau anulări inventate.
-- p: {kind:"retur"|"magazie",id,linie_id,alocare_id?,expected_revision,
--     cantitate,data,referinta?,motiv?,observatii?}
CREATE FUNCTION ep_private.register_movement(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE r jsonb; saved jsonb; l public.ep_factura_linii%ROWTYPE; f public.ep_facturi%ROWTYPE;
  uid uuid:=ep_private.require_access(); mid uuid:=(p->>'id')::uuid;
  lid uuid:=(p->>'linie_id')::uuid; aid uuid:=(p->>'alocare_id')::uuid;
  q integer; dt date:=(p->>'data')::date; kind text:=p->>'kind';
BEGIN
 r:=ep_private.begin_request(p_request,'register_movement',p); IF r IS NOT NULL THEN RETURN r; END IF;
 IF mid IS NULL OR kind IS NULL OR kind NOT IN ('retur','magazie') THEN RAISE EXCEPTION 'Operație invalidă'; END IF;
 SELECT * INTO STRICT l FROM public.ep_factura_linii WHERE id=lid;
 SELECT * INTO STRICT f FROM public.ep_facturi WHERE id=l.factura_id FOR UPDATE;
 IF f.revision IS DISTINCT FROM (p->>'expected_revision')::bigint THEN RAISE EXCEPTION 'Factura a fost modificată'; END IF;
 IF l.blocaj_istoric IS NOT NULL THEN RAISE EXCEPTION 'Poziție cu istoric protejat'; END IF;
 IF dt IS NULL OR (p->>'data') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR dt<f.data_factura THEN RAISE EXCEPTION 'Data operației precede factura'; END IF;
 q:=ep_private.qty(p->'cantitate');
 IF q>ep_private.capacity(lid,aid) THEN RAISE EXCEPTION 'Sursa nu mai are cantitatea solicitată'; END IF;
 IF kind='retur' THEN
   INSERT INTO public.ep_retururi(id,linie_id,alocare_id,cantitate,data_retur,referinta,motiv,observatii,created_by)
     VALUES(mid,lid,aid,q,dt,p->>'referinta',p->>'motiv',p->>'observatii',uid)
     RETURNING to_jsonb(ep_retururi.*) INTO saved;
 ELSE
   INSERT INTO public.ep_transferuri_magazie(id,linie_id,alocare_id,cantitate,data_trimitere,observatii,created_by)
     VALUES(mid,lid,aid,q,dt,p->>'observatii',uid)
     RETURNING to_jsonb(ep_transferuri_magazie.*) INTO saved;
 END IF;
 PERFORM ep_private.validate_line(lid);
 UPDATE public.ep_facturi SET revision=revision+1 WHERE id=f.id RETURNING * INTO f;
 r:=jsonb_build_object('id',mid,'invoice_id',f.id,'revision',f.revision);
 RETURN ep_private.finish_request(p_request,'register_movement',p,
   CASE WHEN kind='retur' THEN 'ep_retururi' ELSE 'ep_transferuri_magazie' END,
   mid::text,NULL,saved,r);
END $fn$;

CREATE FUNCTION ep_private.get_defaults()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
 PERFORM ep_private.require_access();
 RETURN jsonb_build_object('tva_proc',21,'coeficient_df',ep_private.default_markup());
END $fn$;

-- API expus: doar delegare cu argumente tipizate, fără SQL dinamic.
CREATE FUNCTION public.ep_save_supplier(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $fn$ SELECT ep_private.save_supplier(p_request,p) $fn$;
CREATE FUNCTION public.ep_save_invoice(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $fn$ SELECT ep_private.save_invoice(p_request,p) $fn$;
CREATE FUNCTION public.ep_save_allocations(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $fn$ SELECT ep_private.save_allocations(p_request,p) $fn$;
CREATE FUNCTION public.ep_register_movement(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $fn$ SELECT ep_private.register_movement(p_request,p) $fn$;
CREATE FUNCTION public.ep_get_defaults()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $fn$ SELECT ep_private.get_defaults() $fn$;

-- Toate funcțiile private sunt nou create în schema EP exclusivă.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ep_private FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION ep_private.save_supplier(uuid,jsonb),
  ep_private.save_invoice(uuid,jsonb),ep_private.save_allocations(uuid,jsonb),
  ep_private.register_movement(uuid,jsonb),ep_private.get_defaults() TO authenticated;
REVOKE ALL ON FUNCTION public.ep_save_supplier(uuid,jsonb),public.ep_save_invoice(uuid,jsonb),
  public.ep_save_allocations(uuid,jsonb),public.ep_register_movement(uuid,jsonb),
  public.ep_get_defaults() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.ep_save_supplier(uuid,jsonb),public.ep_save_invoice(uuid,jsonb),
  public.ep_save_allocations(uuid,jsonb),public.ep_register_movement(uuid,jsonb),
  public.ep_get_defaults() TO authenticated;

-- RLS: Admin/1 sau JSON boolean true; niciun fallback sau acces implicit Manager.
-- Clientul citește colaborativ, nu doar rândurile create de el.
CREATE POLICY ep_read ON public.ep_furnizori FOR SELECT TO authenticated USING (
 (SELECT EXISTS(SELECT 1 FROM public.auth_profiles p WHERE p.id=(SELECT auth.uid())
   AND (p.rol_id=1 OR p.permissions->'evidenta_piese'='true'::jsonb))));
CREATE POLICY ep_read ON public.ep_furnizor_conturi FOR SELECT TO authenticated USING (
 (SELECT EXISTS(SELECT 1 FROM public.auth_profiles p WHERE p.id=(SELECT auth.uid())
   AND (p.rol_id=1 OR p.permissions->'evidenta_piese'='true'::jsonb))));
CREATE POLICY ep_read ON public.ep_facturi FOR SELECT TO authenticated USING (
 (SELECT EXISTS(SELECT 1 FROM public.auth_profiles p WHERE p.id=(SELECT auth.uid())
   AND (p.rol_id=1 OR p.permissions->'evidenta_piese'='true'::jsonb))));
CREATE POLICY ep_read ON public.ep_factura_linii FOR SELECT TO authenticated USING (
 (SELECT EXISTS(SELECT 1 FROM public.auth_profiles p WHERE p.id=(SELECT auth.uid())
   AND (p.rol_id=1 OR p.permissions->'evidenta_piese'='true'::jsonb))));
CREATE POLICY ep_read ON public.ep_alocari FOR SELECT TO authenticated USING (
 (SELECT EXISTS(SELECT 1 FROM public.auth_profiles p WHERE p.id=(SELECT auth.uid())
   AND (p.rol_id=1 OR p.permissions->'evidenta_piese'='true'::jsonb))));
CREATE POLICY ep_read ON public.ep_retururi FOR SELECT TO authenticated USING (
 (SELECT EXISTS(SELECT 1 FROM public.auth_profiles p WHERE p.id=(SELECT auth.uid())
   AND (p.rol_id=1 OR p.permissions->'evidenta_piese'='true'::jsonb))));
CREATE POLICY ep_read ON public.ep_transferuri_magazie FOR SELECT TO authenticated USING (
 (SELECT EXISTS(SELECT 1 FROM public.auth_profiles p WHERE p.id=(SELECT auth.uid())
   AND (p.rol_id=1 OR p.permissions->'evidenta_piese'='true'::jsonb))));
GRANT SELECT ON TABLE public.ep_furnizori,public.ep_furnizor_conturi,public.ep_facturi,
  public.ep_factura_linii,public.ep_alocari,public.ep_retururi,public.ep_transferuri_magazie
  TO authenticated;

-- Propunere de rotunjire: componente pe linie la cent; brut=net rotunjit + TVA rotunjit.
-- Unitățile și coeficienții se păstrează la precizia introdusă. Nu există UPDATE către DF.
CREATE VIEW public.ep_linii_valori WITH (security_invoker=true) AS
 SELECT l.*,
   round(l.pret_achizitie_net*l.cantitate,2) AS achizitie_net,
   round(l.pret_achizitie_net*l.cantitate*l.tva_proc/100,2) AS achizitie_tva,
   round(l.pret_achizitie_net*l.cantitate,2)
     +round(l.pret_achizitie_net*l.cantitate*l.tva_proc/100,2) AS achizitie_brut,
   round(l.pret_achizitie_net*l.cantitate*l.coeficient_df,2) AS df_net_calculat,
   round(l.pret_achizitie_net*l.cantitate*l.coeficient_df*l.tva_proc/100,2) AS df_tva_calculat,
   round(l.pret_achizitie_net*l.cantitate*l.coeficient_df,2)
     +round(l.pret_achizitie_net*l.cantitate*l.coeficient_df*l.tva_proc/100,2) AS df_brut_calculat
 FROM public.ep_factura_linii l;
CREATE VIEW public.ep_facturi_totaluri WITH (security_invoker=true) AS
 SELECT f.id,coalesce(sum(v.achizitie_net),0) AS achizitie_net,
   coalesce(sum(v.achizitie_tva),0) AS achizitie_tva,
   coalesce(sum(v.achizitie_brut),0) AS achizitie_brut,
   coalesce(sum(v.df_net_calculat),0) AS df_net_calculat,
   coalesce(sum(v.df_tva_calculat),0) AS df_tva_calculat,
   coalesce(sum(v.df_brut_calculat),0) AS df_brut_calculat
 FROM public.ep_facturi f LEFT JOIN public.ep_linii_valori v ON v.factura_id=f.id GROUP BY f.id;
REVOKE ALL ON public.ep_linii_valori,public.ep_facturi_totaluri FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.ep_linii_valori,public.ep_facturi_totaluri TO authenticated;
-- Fără tabel nou, fără modificarea politicilor/granturilor/coloanelor existente.
-- După cele două drafturi EP de bază. Schema ep_private trebuie să rămână neexpusă.
-- Respingem date preexistente ambigue, nu alegem arbitrar primul rând.
DO $pre$
BEGIN
 IF (SELECT count(*) FROM public.config_alerte WHERE cheie='evidenta_piese.coeficient_df_default')>1 THEN
   RAISE EXCEPTION 'Cheie EP duplicată: necesită analiză, fără corecție automată';
 END IF;
 IF EXISTS(SELECT 1 FROM public.config_alerte WHERE cheie='evidenta_piese.coeficient_df_default'
   AND (valoare IS NULL OR NOT(valoare::numeric>0 AND valoare::numeric<'Infinity'::numeric))) THEN
   RAISE EXCEPTION 'Coeficient global preexistent invalid';
 END IF;
END $pre$;

CREATE UNIQUE INDEX ep_default_key_unique ON public.config_alerte(cheie)
 WHERE cheie='evidenta_piese.coeficient_df_default';

-- O politică permisivă suplimentară nu ar restrânge politicile permisive existente.
-- Triggerul se aplică exclusiv cheii EP, inclusiv schimbării numelui ei.
CREATE FUNCTION ep_private.guard_default_key()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $fn$
DECLARE target boolean:=false; v numeric; previous jsonb;
BEGIN
 IF TG_OP<>'INSERT' THEN target:=coalesce(OLD.cheie='evidenta_piese.coeficient_df_default',false); END IF;
 IF TG_OP<>'DELETE' THEN target:=target OR coalesce(NEW.cheie='evidenta_piese.coeficient_df_default',false); END IF;
 IF NOT target THEN
   IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;
 IF auth.uid() IS NULL OR NOT EXISTS (
   SELECT 1 FROM public.auth_profiles WHERE id=auth.uid() AND rol_id=1
 ) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Numai Admin poate modifica implicitul EP'; END IF;
 IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'Setarea EP necesită READ COMMITTED'; END IF;
 PERFORM pg_advisory_xact_lock(19520,7001);
 IF TG_OP='DELETE' OR (TG_OP='UPDATE' AND NEW.cheie IS DISTINCT FROM OLD.cheie) THEN
   RAISE EXCEPTION 'Cheia EP nu se șterge sau redenumește; folosește RPC-ul Admin';
 END IF;
 v:=NEW.valoare::numeric;
 IF v IS NULL OR NOT(v>0 AND v<'Infinity'::numeric) THEN RAISE EXCEPTION 'Coeficient invalid'; END IF;
 IF TG_OP='UPDATE' THEN previous:=jsonb_build_object('coeficient_df',OLD.valoare); END IF;
 INSERT INTO public.audit_logs(user_id,modul,actiune,entitate,entitate_id,descriere)
 VALUES(auth.uid(),'Evidență Facturi & Piese','default_key_change','config_alerte',
   'evidenta_piese.coeficient_df_default',
   jsonb_build_object('before',previous,'after',jsonb_build_object('coeficient_df',v))::text);
 RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION ep_private.guard_default_key() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER ep_guard_default_key BEFORE INSERT OR UPDATE OR DELETE ON public.config_alerte
 FOR EACH ROW EXECUTE FUNCTION ep_private.guard_default_key();

-- Lipsa unei setări păstrează 1.53. Niciun UPDATE pe liniile deja salvate sau pe DF.
CREATE OR REPLACE FUNCTION ep_private.default_markup()
RETURNS numeric LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $fn$
 SELECT coalesce((SELECT valoare::numeric FROM public.config_alerte
   WHERE cheie='evidenta_piese.coeficient_df_default'),1.53::numeric)
$fn$;
REVOKE ALL ON FUNCTION ep_private.default_markup() FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION ep_private.set_default(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE r jsonb; old_value numeric; v numeric:=(p->>'coeficient_df')::numeric;
BEGIN
 PERFORM ep_private.require_access(true);
 r:=ep_private.begin_request(p_request,'set_default',p); IF r IS NOT NULL THEN RETURN r; END IF;
 old_value:=ep_private.default_markup();
 IF old_value IS DISTINCT FROM (p->>'expected_coeficient_df')::numeric THEN
   RAISE EXCEPTION 'Implicitul global a fost modificat între timp';
 END IF;
 IF v IS NULL OR NOT(v>0 AND v<'Infinity'::numeric) THEN RAISE EXCEPTION 'Coeficient invalid'; END IF;
 INSERT INTO public.config_alerte(cheie,valoare)
 VALUES('evidenta_piese.coeficient_df_default',v::text)
 ON CONFLICT(cheie) WHERE cheie='evidenta_piese.coeficient_df_default'
 DO UPDATE SET valoare=excluded.valoare;
 r:=jsonb_build_object('coeficient_df',v);
 RETURN ep_private.finish_request(p_request,'set_default',p,'config_alerte',
   'evidenta_piese.coeficient_df_default',jsonb_build_object('coeficient_df',old_value),r,r);
END $fn$;
CREATE FUNCTION public.ep_set_default(p_request uuid,p jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $fn$ SELECT ep_private.set_default(p_request,p) $fn$;
REVOKE ALL ON FUNCTION ep_private.set_default(uuid,jsonb),public.ep_set_default(uuid,jsonb)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION ep_private.set_default(uuid,jsonb),public.ep_set_default(uuid,jsonb) TO authenticated;
COMMIT;
