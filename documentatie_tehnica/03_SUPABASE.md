# Integrarea Supabase

<a id="ep-productie-verificat-20261105"></a>
## EP instalat în producție — 05.11.2026, verificare finală read-only

**Confirmat live:** `HUB_Service_Auto` / `xyovkxmtbvgcwavuyxxu`, ACTIVE_HEALTHY,
PostgreSQL 17.6. Catalog citit la 19:32 UTC; probe SQL/HTTP ulterioare în aceeași
sesiune. Utilizatorul confirmă aplicarea celor trei consolidări. Verificarea nu a
rerulat migrări, nu a modificat date de business, roluri sau permisiuni.

### Contractul RPC instalat

Toate cele opt RPC-uri EP întorc `jsonb`; `authenticated` are EXECUTE, `anon` nu.
Wrapper-ele publice sunt invoker, cu `search_path` gol fixat și verificări server-side.

| RPC | Argumente instalate, identice cu apelurile frontendului transferat |
|---|---|
| `ep_save_supplier` | `p_request uuid, p jsonb` |
| `ep_save_invoice` | `p_request uuid, p jsonb` |
| `ep_save_allocations` | `p_request uuid, p jsonb` |
| `ep_register_movement` | `p_request uuid, p jsonb` |
| `ep_set_default` | `p_request uuid, p jsonb` |
| `ep_get_defaults` | fără argumente, STABLE |
| `ep_load_registry` | fără argumente, STABLE |
| `ep_list_df_parts` | `p_plate text, p_vin text DEFAULT '', p_vehicle bigint DEFAULT NULL, p_df bigint DEFAULT NULL`, STABLE |

Cele **36 de corpuri finale de funcții** din cele trei SQL-uri revizuite corespund
catalogului, după normalizarea comentariilor/whitespace. Cele 9 hash-uri runtime
și 3 hash-uri SQL sunt identice cu [manifestul transferului](evidenta_piese/TRANSFER_FEATURE_RESPONSIVE_20261105.json).
Adaptori: `js/evidenta_piese_api.js` și `js/ep_df_import.js`, cu proiectul destinației
și configurația existentă; fără copiere de configurație LAB. Suita statică: **64 PASS**.

### RLS, ACL și Data API

- Șapte tabele: `ep_furnizori`, `ep_furnizor_conturi`, `ep_facturi`,
  `ep_factura_linii`, `ep_alocari`, `ep_retururi`, `ep_transferuri_magazie`.
  Toate au RLS ON și câte o politică SELECT `ep_read`: Admin/1 sau JSON boolean
  `permissions.evidenta_piese=true`, fără acces implicit Manager/fallback.
- `authenticated` are numai SELECT direct pe aceste tabele; fără INSERT, UPDATE,
  DELETE sau TRUNCATE, inclusiv fără granturi de scriere pe coloane. `anon` nu are
  aceste drepturi. Scrierile EP trec prin RPC-urile controlate, neapelate în acest audit.
- `ep_linii_valori` și `ep_facturi_totaluri`: `security_invoker=true`.
  Cele 37 de politici preexistente comparate sunt neschimbate; total public **127 politici**.
- HTTP GET cu configurația publică existentă: tabel EP, cele trei RPC-uri de citire
  și antet DF refuză anon cu **401 / 42501**. `Accept-Profile: ep_private` pe ruta
  tabelului întoarce **406 / PGRST106**: schema privată nu este expusă prin Data API.
- În tranzacții READ ONLY, cu rol `authenticated` și `auth.uid()` setat pe profiluri
  existente: Admin citește defaults/registry/picker; profilul fără EP primește
  42501 la defaults/registry; profilul cu DF și fără EP primește 42501 la picker.
  Registry întoarce cheile/array-urile așteptate de adaptor. Acestea sunt probe SQL
  de autorizare, **nu autentificare HTTP cu sesiune reală sau teste de browser**.

### Deviz Final și Avansuri

`save_deviz_final(p_deviz_id bigint,p_header jsonb,p_lines jsonb) RETURNS jsonb`
păstrează contractul public; corpul instalat este wrapper-ul EP revizuit, cu traseul
legacy/manual păstrat. Coloanele `ep_alocare_id`, `ep_import_id`, `ep_snapshot`,
indexurile/constraint-urile și triggerele `ep_df_protect`, `ep_df_serialize`,
`ep_df_release` sunt prezente; constraint-urile verificate sunt validate, triggerele
sunt activate. Coloanele de sursă EP nu permit scriere directă authenticated.
Guard-ul `config_alerte.ep_guard_default_key` este activ.

`private.resolve_deviz_final_vehicle(text,text)` și
`list_deviz_final_importable_avansuri(bigint,text,text)` păstrează amprentele
pre-migrare (`8973b688c51212646e960cb6e8c7727f`, respectiv
`f9aa521b4979ce03691cfac688597ca6`). Citirea Avansurilor prin RPC reușește pentru
Admin pe un vehicul existent; SELECT-urile private `avans_id`/`status` sunt păstrate.

Numărări live: **225 antete DF, 2691 linii DF, 59 avansuri, 65 plăți, 8 profiluri**,
identice cu backupul pre-EP. Fără avansuri legate duplicat, fără surse EP incomplete
și fără referințe nenule către antete inexistente. Patru linii au antet NULL,
preexistente și în backup; nu sunt introduse de EP. Registrele EP și importurile
sunt goale. Niciun profil non-Admin nu are încă bifa EP; numai Admin are acces
implicit. Nu au fost acordate permisiuni în această verificare.

### Stare înainte de publicare și limite

**Nu s-a identificat blocaj de schemă, semnătură sau ACL pentru frontendul transferat.**
Istoricul remote are în continuare **8 înregistrări, fără EP**, deși catalogul
confirmă instalarea; nu deducem metoda aplicării și nu reparăm/rerulăm migrarea.
Sursele consolidate sunt dovada comparată, nu o comandă de reaplicare.

**NEEDS_REVIEW înainte de lansare:** browser cu autentificare reală pe candidatul
transferat, Admin/operator autorizat/refuz acces, reload și expirare sesiune,
creare/editare factură, alocări/retur/magazie, import/editare/resalvare DF,
linii manuale, avans/discount/totaluri, print și desktop/mobil. Scrierile,
concurența independentă și fluxul HTTP autentificat nu au fost testate în producție.
Orice test cu date reale necesită autorizare separată; auditul prezent nu o implică.

Backupul pre-EP existent este verificat ca arhivă, dar **restaurarea reală rămâne
NEDEMONSTRATĂ**, conform `RESTORE_VALIDATION_20261105.json` din directorul extern
`BACKUP_HUB_SUPABASE/xyovkxmtbvgcwavuyxxu/20261105T184644Z`; mediul PostgreSQL 17 /
Supabase izolat nu a fost disponibil. Această limită de recuperare rămâne deschisă.
Nu s-au executat commit, push, deploy sau modificări de cod în această verificare.

## Preflight EP producție — 05.11.2026, read-only

**ISTORIC, înainte de aplicarea EP. Starea instalată de mai sus are prioritate.**

Inspecție nouă prin integrarea Supabase: `HUB_Service_Auto` / `xyovkxmtbvgcwavuyxxu`,
`ACTIVE_HEALTHY`, PostgreSQL 17.6. Numai SELECT-uri de catalog, ACL și precondiții;
nu s-au modificat schema, politicile, istoricul migrărilor sau datele.

- Nu există obiecte `ep_*` în `public` ori obiecte în `ep_private`; backendul EP lipsește.
- `save_deviz_final(bigint,jsonb,jsonb)` are MD5 al `pg_get_functiondef`
  `eca2da13bc75babb0a49d6706c4331dd`, exact baseline-ul cerut de sursa SQL DF LAB.
  Resolverul `private.resolve_deviz_final_vehicle(text,text)` are MD5
  `8973b688c51212646e960cb6e8c7727f`; ambele verificări sunt în candidatul SQL.
- Admin/1 există; `authenticated` nu poate insera `audit_logs.id`. Sunt păstrate
  ACL/RLS/trigger-ele existente și granturile de coloană ale Avansurilor.
- Cheia `evidenta_piese.coeficient_df_default` lipsește: fallback 1,53 după migrare,
  fără copierea setării sau datelor LAB. Istoricul citit are 8 migrări, niciuna EP.
- Cele trei surse din [handoff](../HANDOFF_CODEX.md) sunt **PREGĂTITE, NEAPLICATE**:
  șapte tabele EP, două VIEW-uri invoker, RPC/guard/audit/revizii și extensiile DF.
  Nu sunt obiecte deja prezente în producție.

Replay local al pachetului și 37 regresii SQL: PASS în PGlite/PostgreSQL 18.6,
cu catalogul de producție reconstruit și Auth sintetic. Nu înlocuiește validarea
în PostgreSQL 17/Supabase izolat ori probele HTTP/concurență independentă.
Schemele Data API expuse nu sunt confirmate de setarea SQL (`pgrst.db_schemas`
este NULL); verifică explicit că `ep_private` rămâne neexpusă înainte de aplicare.
[Rezultate exacte](evidenta_piese/TRANSFER_FEATURE_RESPONSIVE_20261105.json).

## Producție verificată live — 03.11.2026

**Proveniență:** auditul de producție furnizat de utilizator, realizat read-only prin
integrarea Supabase conectată la 03.11.2026. Proiect: `HUB_Service_Auto`,
ref `xyovkxmtbvgcwavuyxxu`, stare `ACTIVE_HEALTHY`, PostgreSQL **17**.
Actualizarea documentară folosește această dovadă; nu a accesat Supabase.

Auditul nu a executat DDL, DML, migrări, schimbări de politici, Storage, Edge
Functions sau date. LAB `smrrvkyyywtferhlrjnn` era **INACTIVE** și nu a fost
auditat live; rezultatele și comparațiile LAB din **21.10.2026** rămân istorice.
Nu se afirmă identitate actuală între producție și LAB.

### Catalogul public și rolurile DB — producție, 03.11.2026

| Element verificat | Rezultat |
|---|---|
| Tabele publice | 36 |
| Tabele publice cu RLS activ | 36 |
| Tabele publice cu RLS dezactivat | 0 |
| Politici publice | 120 |
| VIEW-uri publice | 1 |
| Tabele publice cu FORCE RLS activ | 0 |
| Tabele cu GRANT TRUNCATE pentru anon | 16 |
| Tabele cu GRANT TRUNCATE pentru authenticated | 16 |

| Rol DB | BYPASSRLS |
|---|---|
| `anon` | false |
| `authenticated` | false |
| `service_role` | true |

Acestea sunt verificări de catalog și privilegii, fără executarea operației
TRUNCATE sau probe de acces funcțional cu utilizatori HUB. RLS ON și FORCE OFF
nu certifică autorizarea pe roluri de business.

### VIEW și registrul privat de Avansuri — producție, 03.11.2026

- `public.stoc_view_curent`: `security_invoker=true`; `authenticated` are SELECT,
  `anon` nu are SELECT. Constatarea veche de tip Security Definer este depășită.
- `private.deviz_final_avans_review`: RLS dezactivat; `anon` nu are SELECT.
  `authenticated` nu are SELECT de tabel, INSERT, UPDATE, DELETE sau TRUNCATE.
  Are **numai SELECT de coloană pe `avans_id` și `status`**; nu poate selecta
  `reviewed_at`. Excepția privată nu este un tabel public fără RLS.

### Storage Contracte — restanță activă, producție, 03.11.2026

Bucketul `documente_contracte` are `public=true`. Pe `storage.objects` există
patru politici pentru rolul `public`: SELECT, INSERT, UPDATE și DELETE, cu
condiția limitată la `bucket_id = 'documente_contracte'`. Aceste politici au
rămas neschimbate. Expunerea și drepturile largi ale fișierelor sunt un element
activ de securitate/fiabilitate; protecția tabelului Contracte nu certifică
protecția obiectelor Storage sau compatibilitatea funcțională a frontendului.

### Edge Functions, cron și Realtime — producție, 03.11.2026

- Două Edge Functions active: `trimite-alerte` și `dezmembrari-photo-upload`.
  Auditul furnizat nu certifică funcționarea lor end-to-end sau versiunea codului publicat.
- Extensii instalate confirmate: `pg_cron` și `pg_net`.
- Un job cron activ: `trimite-alerte-job`, schedule `0 8 * * *`, `active=true`.
  Fusul orar efectiv nu a fost verificat; expresia nu certifică ora 08:00 Europe/Bucharest.
- Publicația `supabase_realtime` nu conține tabele. Această constatare privește
  apartenența la publicație, nu numărul tabelelor interne din schema `realtime`
  sau existența codului client Realtime în frontend.

### Migrări și limite ale verificării

Istoricul remote de producție conține **8 înregistrări de migrare**. Absența unui
fișier local sau a unei înregistrări pentru o politică aplicată manual nu dovedește
absența politicii din catalog. Pachetele istorice/rollback rămân referințe în
[10_PLAN_RLS.md](10_PLAN_RLS.md), fără reexecutare.

**NEEDS_REVIEW:** comportamentul efectiv RLS, autorizarea pe roluri de business,
operațiile reale ale utilizatorilor, browserul și compatibilitatea frontendului
publicat; livrarea cron/Edge/email; fusul orar al cronului. Auditul nu a verificat
funcțional aceste aspecte. Politicile detaliate, ACL-urile și definițiile care
apar numai în istoricul de mai jos nu primesc implicit o validare nouă la 03.11.
Starea live LAB nu a fost auditată; comparația din 21.10 nu o înlocuiește.
Sinteza de preluare și limitele sunt în [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

---

## Istoric LAB/producție — inventarul din 21.10.2026

Toate tabelele detaliate, comparațiile între medii și formulările „actual/live”
din această secțiune consemnează **21.10.2026**, fără reverificare integrală a
ACL-urilor, politicilor individuale sau funcțiilor în auditul furnizat la 03.11.
Pentru catalogul actual de producție prevalează secțiunea verificată de mai sus.

**La 21.10.2026: 36 tabele publice, 36 RLS ON, 0 OFF, un VIEW și 120 politici**, consemnate atunci ca identice în LAB și producție. Starea a fost citită read-only, după confirmarea utilizatorului că activarea planificată este finalizată. Nu s-au executat DDL/DML/migrări sau teste de scriere în această rundă.

Producție: HUB_Service_Auto / xyovkxmtbvgcwavuyxxu. LAB: HUB_AUTO_LAB / smrrvkyyywtferhlrjnn. Rolurile anon/authenticated nu au BYPASSRLS; service_role are BYPASSRLS. FORCE este OFF pe toate cele 36 tabele, ceea ce nu este lipsă de activare.

### Inventarul public complet

Stările de mai jos înseamnă **ACTIVE ÎN PRODUCȚIE / ACTIVE ÎN LAB**, fără extrapolare la validare funcțională exhaustivă. ACL-ul de tabel este doar o parte din privilegii: r=SELECT, a=INSERT, w=UPDATE, d=DELETE, D=TRUNCATE, x=REFERENCES, t=TRIGGER, m=MAINTAIN. Granturile de coloană se adaugă separat.

| Tabel public | Producție RLS (21.10) | LAB RLS (21.10) | Politici (21.10) | ACL authenticated de tabel (21.10) |
|---|---|---|---|---|
| `admin_announcements` | ACTIV | ACTIV | 4 | `arwdDxtm` |
| `audit_logs` | ACTIV | ACTIV | 2 | `r` |
| `auth_profiles` | ACTIV | ACTIV | 4 | `arwd` |
| `auth_roles` | ACTIV | ACTIV | 4 | `arwd` |
| `baza_vin` | ACTIV | ACTIV | 4 | `arwdDxtm` |
| `clienti` | ACTIV | ACTIV | 3 | `arwdDxtm` |
| `clienti_contacte` | ACTIV | ACTIV | 3 | `arwdDxtm` |
| `clienti_notificari_config` | ACTIV | ACTIV | 3 | `arwdDxtm` |
| `clienti_notificari_istoric` | ACTIV | ACTIV | 3 | `arwdDxtm` |
| `clienti_notificari_sabloane` | ACTIV | ACTIV | 3 | `arwdDxtm` |
| `clienti_vehicule` | ACTIV | ACTIV | 3 | `arwdDxtm` |
| `clienti_vehicule_termene` | ACTIV | ACTIV | 3 | `arwdDxtm` |
| `comenzi_piese_sh` | ACTIV | ACTIV | 4 | `arwd` |
| `config_alerte` | ACTIV | ACTIV | 2 | `r` |
| `constatari` | ACTIV | ACTIV | 3 | `r` |
| `constatari_asteptare_piese` | ACTIV | ACTIV | 3 | `r` |
| `constatari_departamente` | ACTIV | ACTIV | 3 | `r` |
| `constatari_repartizari` | ACTIV | ACTIV | 1 | `r` |
| `contracte` | ACTIV | ACTIV | 4 | `arwd` |
| `detailing` | ACTIV | ACTIV | 4 | `arwdDxtm` |
| `deviz_final_header` | ACTIV | ACTIV | 4 | `rd` |
| `deviz_final_linii` | ACTIV | ACTIV | 3 | `rd` |
| `devize` | ACTIV | ACTIV | 4 | `rd` |
| `dezmembrari_items` | ACTIV | ACTIV | 4 | `arwdDxtm` |
| `dezmembrari_photos` | ACTIV | ACTIV | 5 | `arwdDxtm` |
| `evidenta_awb` | ACTIV | ACTIV | 3 | `arw` |
| `evidente_avansuri` | ACTIV | ACTIV | 4 | `rd` |
| `evidente_avansuri_plati` | ACTIV | ACTIV | 4 | `rd` |
| `flota_auto` | ACTIV | ACTIV | 4 | `arwdDxtm` |
| `generator_logs` | ACTIV | ACTIV | 1 | `arwdDxtm` |
| `plati_manager` | ACTIV | ACTIV | 4 | `ard` |
| `service_personal` | ACTIV | ACTIV | 3 | `r` |
| `stoc_miscari` | ACTIV | ACTIV | 3 | `ard` |
| `stoc_produse` | ACTIV | ACTIV | 3 | `ar` |
| `telefoane_clienti` | ACTIV | ACTIV | 4 | `arwdDxtm` |
| `todo_tasks` | ACTIV | ACTIV | 4 | `arwdDxtm` |

### GRANT-urile de coloană pentru authenticated

Absența INSERT/UPDATE din ACL-ul de tabel nu înseamnă că operația este interzisă: poate fi acordată pe coloanele necesare. Nu se confundă GRANT-ul cu trecerea politicii RLS sau a triggerului.

| Obiect | INSERT pe coloane | UPDATE pe coloane | SELECT pe coloane |
|---|---|---|---|
| `private.deviz_final_avans_review` | — | — | avans_id, status |
| `public.audit_logs` | user_id, user_name, modul, actiune, entitate, entitate_id, descriere | — | — |
| `public.config_alerte` | — | valoare | — |
| `public.constatari` | nr_inmatriculare, model_masina, serie_vin, kilometraj, defectiuni_client, defectiuni_mecanic, observatii, status, este_urgent, client, telefon, km_iesire, nr_fisa, responsabili, client_id, vehicle_id | nr_inmatriculare, model_masina, serie_vin, kilometraj, defectiuni_client, defectiuni_mecanic, observatii, status, este_urgent, client, telefon, km_iesire, data_finalizarii, responsabili, client_id, vehicle_id | — |
| `public.constatari_asteptare_piese` | constatare_id, inceput, sfarsit | sfarsit | — |
| `public.constatari_departamente` | constatare_id, departament, constatari, lucrari_efectuate, status, updated_at, finalizat_la, actualizat_de, piese_materiale, elemente_lucrate | constatare_id, departament, constatari, lucrari_efectuate, status, updated_at, finalizat_la, actualizat_de, piese_materiale, elemente_lucrate | — |
| `public.deviz_final_header` | id_deviz_estimativ, data_deviz, client, auto, nr_inmatriculare, serie_vin, serie_motor, km, termen_executie, discount_global_piese, total_manopera, total_piese, total_general, created_by, constatare_id, vehicle_id, total_avans | id_deviz_estimativ, data_deviz, client, auto, nr_inmatriculare, serie_vin, serie_motor, km, termen_executie, discount_global_piese, total_manopera, total_piese, total_general, vehicle_id, total_avans | — |
| `public.deviz_final_linii` | id_deviz_final, sectiune, nr_crt, denumire, detalii, um, cantitate, pret_unitar, discount, total, comanda_piesa_sh_id, avans_id | — | — |
| `public.devize` | id_deviz, data_deviz, autovehicul, vin, nr_inmatriculare, piese, discount_global, total_general, created_by | id_deviz, data_deviz, autovehicul, vin, nr_inmatriculare, piese, discount_global, total_general, created_by | — |
| `public.evidente_avansuri` | data_crearii, model_masina, nr_inmatriculare, detalii_avans, este_arhivat, observatii, vehicle_id | data_crearii, model_masina, nr_inmatriculare, este_arhivat, observatii, vehicle_id | — |
| `public.evidente_avansuri_plati` | avans_id, suma, metoda_plata, observatii, data_platii | suma, metoda_plata, data_platii | — |
| `public.plati_manager` | — | status, data_platii, platit_de | — |
| `public.service_personal` | nume, departament, activ, ordine, user_id | nume, activ, ordine, updated_at | — |
| `public.stoc_produse` | — | denumire, prag_minim, activ | — |

### VIEW și excepția privată

- public.stoc_view_curent: VIEW cu security_invoker=true, SELECT pentru authenticated; fără acces anon. Agregă stoc_produse + stoc_miscari, iar RLS-ul surselor se aplică apelantului. RLS propriu nu se activează pe VIEW.
- private.deviz_final_avans_review: tabel RLS OFF, drepturi de tabel numai postgres. authenticated are USAGE private și SELECT(avans_id,status), fără scriere/TRUNCATE sau SELECT de tabel; anon nu are USAGE private. Este registrul intern de eligibilitate folosit de RPC, nu o omisiune din cele 36 publice.
- La 21.10.2026, cele două scheme aveau aceleași ACL-uri, tabele, politici, coloane și secvențe în ambele medii. Definițiile SQL ale funcțiilor sunt identice; o reprezentare ACL implicită/explicită la triggerul Comenzi SH nu schimbă EXECUTE efectiv.

### Inventarul schemelor din afara aplicației publice

Valorile sunt tabele / RLS ON / RLS OFF / VIEW-uri. Nu se includ obiectele pg_catalog/information_schema. Schemele gestionate de platformă și extensii nu sunt loturi de tabele HUB de „activat toate”.

| Schemă | Producție (21.10.2026) | LAB (21.10.2026) |
|---|---|---|
| auth | 27 / 16 / 11 / 0 | 27 / 16 / 11 / 0 |
| cron | 2 / 2 / 0 / 0 | absent |
| extensions | 0 / 0 / 0 / 2 | 0 / 0 / 0 / 2 |
| net | 2 / 0 / 2 / 0 | absent |
| private | 1 / 0 / 1 / 0 | 1 / 0 / 1 / 0 |
| public | 36 / 36 / 0 / 1 | 36 / 36 / 0 / 1 |
| realtime | 10 / 1 / 9 / 0 | 9 / 1 / 8 / 0 |
| storage | 8 / 8 / 0 / 0 | 8 / 8 / 0 / 0 |
| supabase_migrations | 1 / 0 / 1 / 0 | 1 / 0 / 1 / 0 |
| vault | 1 / 0 / 1 / 1 | 1 / 0 / 1 / 1 |

### Storage și diferențe importante

Producție: bucket documente_contracte, public=true; patru politici pe storage.objects cu rol public, SELECT/INSERT/UPDATE/DELETE, condiție doar bucket_id. LAB: niciun bucket și nicio politică Storage. RLS ON pe storage.objects nu restrânge singur aceste politici permisive; aceasta este **RESTANȚĂ separată**, fără modificări aici.

Producția are cron/net și un obiect realtime intern suplimentar; aceste componente lipsesc sau diferă în LAB. Nu se presupune echivalență de automatizări/Storage din echivalența RLS publică.

### Restanțe de acces, deși RLS este activ

16 tabele au TRUNCATE efectiv pentru anon și authenticated, identic între medii; generator_logs are politica ALL true pentru public; todo_tasks are CRUD true pentru authenticated. Detaliile și lista sunt în [stadiul central](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md). Niciuna nu se prezintă ca tabel public cu RLS OFF sau ca excepție de business aprobată.

### Migrații și proveniență

Istoric remote: producție 8 înregistrări de migrare, LAB 18. Politicile aplicate manual nu sunt deduse din istoric; catalogul confirmă starea reală. Nu se folosește db push pentru a uniformiza numărul. Locațiile SQL/rollback sunt în [10_PLAN_RLS.md](10_PLAN_RLS.md).

Învechite ca stare curentă: cifrele 17 tabele ON / 19 OFF și 59 politici, citirile „financiar RLS OFF” și „Contracte NEAPLICAT” de mai jos sunt fotografii istorice datate. Nu se mai folosesc pentru decizia actuală.

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea producției verificată la 03.11.2026. Secțiunea de producție din 03.11 și documentul 22 au prioritate; comparația LAB din 21.10 rămâne istorică. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Context istoric și detalii de implementare

Secțiunile de mai jos păstrează auditul și actualizările datate. Inventarele, numerele și formulările „actual/live” rămase în acest context nu sunt o nouă verificare a LAB sau a producției; producția verificată la 03.11.2026 este descrisă la început, iar comparația LAB din 21.10 este numai istorică.

## 1. Identificarea proiectului și metoda de verificare

| Element | Valoare confirmată |
|---|---|
| Project ref | `xyovkxmtbvgcwavuyxxu` |
| Nume | `HUB_Service_Auto` |
| Regiune | `eu-central-1` |
| Stare la verificare | `ACTIVE_HEALTHY` |
| PostgreSQL | 17.6.1 |
| Schema folosită de frontend | în principal `public` |

Inspecția a fost strict read-only. Nu au fost rulate migrări, comenzi DDL/DML, modificări RLS, schimbări de Storage sau redistribuiri Edge.

Inventar istoric din 12 octombrie 2026, depășit pentru totalurile RLS/politici și starea VIEW-ului; nu este catalogul actual:

- 36 tabele în schema `public`;
- 1 view public;
- 4 funcții publice și 2 funcții în schema `private`;
- 59 politici RLS publice;
- 39 chei străine;
- 17 tabele cu RLS activ;
- 19 tabele cu RLS dezactivat;
- 2 funcții Edge active;
- 1 bucket Storage relevant.

## 2. Catalogul istoric al tabelelor publice — auditul inițial din 12.10.2026

### 2.1 Identitate, acces și audit

| Tabel | Rol și coloane relevante | RLS |
|---|---|---|
| `auth_roles` | catalog roluri: `id`, `numire_rol` unic | dezactivat |
| `auth_profiles` | extensie `auth.users`: nume, prenume, telefon, `rol_id`, poreclă, email, `permissions` JSONB | dezactivat |
| `audit_logs` | utilizator, modul, acțiune, entitate, descriere, IP, user agent, timestamp | dezactivat |

### 2.2 Registru clienți și notificări

| Tabel | Rol și coloane relevante | RLS |
|---|---|---|
| `clienti` | cod client, tip, nume, status profil/activitate, sursă, observații, consimțăminte și preferințe de canal | activ |
| `clienti_vehicule` | client, număr, VIN, marcă/model, an, combustibil, km, status | activ |
| `clienti_contacte` | client, vehicul opțional, tip, valoare, etichetă, contact principal | activ |
| `clienti_vehicule_termene` | vehicul, tip termen, denumire, dată, activ | activ |
| `clienti_notificari_istoric` | client/vehicul/termen, prag, canal, status, programare/trimitere, mesaj/eroare | activ |
| `clienti_notificari_config` | configurare globală: praguri, oră de rulare, canale | activ |
| `clienti_notificari_sabloane` | tip, nume, text, variabile obligatorii | activ |

Tipurile confirmate pentru termene includ `ITP`, `RCA`, revizie, ulei și termen personalizat. Pragurile folosite de modul includ 30, 15, 5 și 0 zile.

### 2.3 Service, constatări și personal

| Tabel | Rol și coloane relevante | RLS |
|---|---|---|
| `constatari` | client/vehicul, număr/VIN/km, defecte, piese, observații, stare, urgență, responsabili, ora finală | dezactivat |
| `constatari_departamente` | constatare, departament, constatări, lucrări, materiale, elemente, status, utilizator/timestamps | dezactivat |
| `constatari_asteptare_piese` | intervale start/final pentru o constatare | dezactivat |
| `constatari_repartizari` | constatare, membru service, activ, alocat/retras și actor | dezactivat |
| `service_personal` | nume, departament, activ, ordine, utilizator asociat | dezactivat |

Statusurile departamentale confirmate sunt `De făcut`, `În lucru`, `Așteptare piese` și `Finalizat`. Departamentele întâlnite în schema Comenzi piese SH sunt Mecanica, Electrica, Vopsitorie, Detailing și Tinichigerie-Pregătire.

### 2.4 Devize, contracte, avansuri și plăți

| Tabel | Rol și coloane relevante | RLS |
|---|---|---|
| `devize` | ID text, dată, mașină, VIN, număr, piese JSONB, discount, total, creator | dezactivat |
| `deviz_final_header` | client/mașină/VIN/km, constatare, deviz estimativ, reduceri, totaluri, creator | dezactivat |
| `deviz_final_linii` | antet, secțiune, ordine, denumire, detalii, UM, cantitate, preț, discount, total, comandă SH folosită | dezactivat |
| `evidente_avansuri` | vehicul, date auto, detalii, arhivare și observații | dezactivat |
| `evidente_avansuri_plati` | avans, sumă, metodă, observații, dată plată | dezactivat |
| `contracte` | client, VIN, mașină, număr, dosar, dată, status, fotografii JSONB și note | dezactivat |
| `plati_manager` | beneficiar, IBAN, sumă, motiv, status, date/actori creare și plată | dezactivat |

### 2.5 Piese, stoc și logistică

| Tabel/view | Rol și coloane relevante | RLS |
|---|---|---|
| `comenzi_piese_sh` | piesă, cod, mașină, departament, furnizor, achiziție/prețuri, status, curier/AWB, arhivare și actori | activ |
| `stoc_produse` | cod, denumire, UM, stoc minim, activ | dezactivat |
| `stoc_miscari` | produs, tip, cantitate, dată, destinație, număr auto, observații | dezactivat |
| `stoc_view_curent` | agregă intrări/ieșiri și stocul curent per produs | view; vezi secțiunea 5 |
| `evidenta_awb` | curier, AWB, client, localitate, piesă, preț, telefon, status, retur, arhivare | dezactivat |

Tipurile de mișcare confirmate sunt `in`, `out` și `adjustment`. Statusurile comenzilor SH sunt documentate în `02_MODULE.md`.

### 2.6 Dezmembrări

| Tabel | Rol și coloane relevante | RLS |
|---|---|---|
| `dezmembrari_items` | tip, status, VIN, marcă/model/an, motor/cutie, piesă, preț, locație, note, URL pieseauto, sursă și actori | activ |
| `dezmembrari_photos` | item, identificatori/URL Drive și R2, MIME, dimensiune, rezoluție, ordine, fotografie principală, actor | activ |

Tipurile confirmate sunt `car`, `engine`, `gearbox`, `part`; statusurile sunt `draft`, `ready`, `published`, `sold`, `archived`.

### 2.7 Operațional

| Tabel | Rol și coloane relevante | RLS |
|---|---|---|
| `flota_auto` | număr, VIN, marcă, termene RCA/ITP/rovinietă, documente, note, email șofer | activ |
| `baza_vin` | identificator și VIN | activ |
| `detailing` | client/mașină, pachet, estimare, programare, status, note și interval execuție | activ |
| `telefoane_clienti` | client, telefon, notițe | activ |
| `generator_logs` | dată, pornire/oprire, combustibil, total sesiune, observații | activ, dar politica este publică |
| `todo_tasks` | titlu, categorie, descriere, prioritate, status, completare, note | activ |
| `admin_announcements` | mesaj și activ | activ |
| `config_alerte` | cheie și valoare | dezactivat |

## 3. Relații relevante

### 3.1 Identitate

- `auth_profiles.id` → `auth.users.id`;
- `auth_profiles.rol_id` → `auth_roles.id`;
- mai multe coloane de tip actor/creator din module → `auth_profiles.id`;
- `audit_logs.user_id` → `auth.users.id`.

### 3.2 Clienți și service

- `clienti_vehicule.client_id` → `clienti.id`;
- `clienti_contacte.client_id` → `clienti.id`;
- contactele pot fi legate și de un vehicul; există o relație compusă pentru coerența client/vehicul;
- `clienti_vehicule_termene.vehicle_id` → `clienti_vehicule.id`;
- istoricul notificărilor referă clientul, vehiculul și termenul;
- `constatari.client_id` și `vehicle_id` → registrul central;
- departamentele, repartizările și intervalele de așteptare → `constatari.id`;
- repartizările → `service_personal.id`.

### 3.3 Financiar și devize

- `evidente_avansuri.vehicle_id` → `clienti_vehicule.id`;
- `evidente_avansuri_plati.avans_id` → `evidente_avansuri.id`;
- `deviz_final_header.constatare_id` → `constatari.id`, cu setare `NULL` la ștergerea sursei;
- liniile devizului → antet, cu ștergere în cascadă;
- o linie poate referi `comenzi_piese_sh.id`, cu setare `NULL` dacă acea comandă este ștearsă.

### 3.4 Stoc și dezmembrări

- `stoc_miscari.produs_id` → `stoc_produse.id`, cu ștergere în cascadă;
- `dezmembrari_photos.item_id` → `dezmembrari_items.id`, cu ștergere în cascadă;
- `dezmembrari_items.source_item_id` este o autorelație;
- actorii din Dezmembrări și Comenzi piese SH referă profiluri.

## 4. RLS și politici

### 4.1 Tabele cu RLS activ și reguli observate

| Domeniu | Reguli principale confirmate |
|---|---|
| `admin_announcements` | CRUD doar pentru rolul Admin |
| `baza_vin` | Admin sau permisiunea `baza_vin`, pentru CRUD |
| `clienti`, `clienti_contacte`, `clienti_vehicule` | S/I/U prin `private.has_hub_permission('clienti_notificari')`; fără politică D |
| config/sabloane notificări | control prin `clienti_notificari_config`; fără ștergere |
| istoric/termene notificări | control prin `clienti_notificari`; fără ștergere |
| `comenzi_piese_sh` | S/I/U pentru Admin sau permisiune; creatorul la insert trebuie să fie utilizatorul curent; D numai Admin |
| `detailing` | Admin sau permisiunea `detailing`, CRUD |
| `flota_auto` | Admin sau permisiunea aferentă, CRUD |
| `telefoane_clienti` | Admin sau permisiunea aferentă, CRUD |
| `dezmembrari_items/photos` | captură: creare/citire proprie; management: acces mai larg; reguli separate pentru fotografii |
| `generator_logs` | politică `ALL` cu expresie adevărată pentru public; RLS nu restrânge efectiv accesul |
| `todo_tasks` | starea tehnică actuală: toți utilizatorii autentificați au CRUD; regula de business confirmată: modul personal, exclusiv Admin |

Pe `dezmembrari_photos` există mai multe politici permisive pentru `INSERT`. Acestea se combină prin OR, ceea ce trebuie avut în vedere la auditarea intenției.

### 4.2 Istoric depășit — tabelele cu RLS dezactivat la auditul inițial

> **Istoric — auditul inițial, depășit la 21.10.2026.** Lista de mai jos nu mai este inventar curent: la 03.11.2026 producția are 36/36 tabele publice cu RLS ON; paritatea cu LAB era consemnată numai la 21.10.2026. Starea documentată și riscurile rămase sunt în [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md); nu se reia activarea pornind de la această listă.

Lista confirmată este:

`audit_logs`, `auth_profiles`, `auth_roles`, `config_alerte`, `constatari`, `constatari_asteptare_piese`, `constatari_departamente`, `constatari_repartizari`, `contracte`, `deviz_final_header`, `deviz_final_linii`, `devize`, `evidenta_awb`, `evidente_avansuri`, `evidente_avansuri_plati`, `plati_manager`, `service_personal`, `stoc_miscari`, `stoc_produse`.

Granturile standard pentru rolurile API `anon` și/sau `authenticated` există pe multe dintre aceste tabele. În acest context, ascunderea butoanelor sau verificarea permisiunii în JavaScript nu protejează direct rândurile. Accesul efectiv trebuie reevaluat tabel cu tabel înainte de activarea RLS, pentru a evita întreruperea aplicației.

## 5. View, funcții și trigger-e

### 5.1 View

**Observație istorică depășită, auditul inițial din 12.10.2026:** `stoc_view_curent` era descris ca agregând produse și mișcări prin `LEFT JOIN`, iar advisorul îl semnalase ca `security_definer_view`. Acest avertisment vechi nu descrie starea prezentă. **Producție verificată live la 03.11.2026:** `security_invoker=true`, SELECT pentru `authenticated`, fără SELECT pentru `anon`. Auditul furnizat nu a modificat definiția.

### 5.2 Funcții publice

| Funcție | Securitate | Scop |
|---|---|---|
| `can_capture_dezmembrari()` | `SECURITY DEFINER` | Admin sau permisiune `dezmembrari_manage`/`dezmembrari_capture` |
| `can_manage_dezmembrari()` | `SECURITY DEFINER` | Admin sau permisiune `dezmembrari_manage` |
| `create_deviz_final_from_constatare(bigint,jsonb,jsonb)` | invoker | validează autentificarea, permisiunea, payload-ul și unicitatea; inserează atomic antetul și liniile |
| `handle_new_user()` | `SECURITY DEFINER` | trigger de creare profil după un utilizator nou Auth |

`handle_new_user()` inserează `rol_id = 3`. Comentariul din cod indică „Mecanic”, dar catalogul curent spune că rolul 3 este `Birou`; această discrepanță este explicită și nu trebuie interpretată automat.

### 5.3 Funcții private

| Funcție | Scop |
|---|---|
| `private.has_hub_permission(text)` | verifică `auth.uid()`, Admin sau cheia JSON de permisiune |
| `private.comenzi_piese_sh_set_update_meta()` | păstrează metadatele de creare și completează update/arhivare |

### 5.4 Trigger-e

- `auth.users` după inserare → `handle_new_user()`;
- `comenzi_piese_sh` înainte de update → funcția de metadate private.

Advisorul indică un `search_path` mutabil pentru `handle_new_user()`. Drepturile `EXECUTE` pentru unele funcții `SECURITY DEFINER` sunt acordate prea larg (inclusiv `anon`/`authenticated`), ceea ce necesită revizuire.

## 6. Storage

Bucket-ul `documente_contracte` este public. Politicile de pe `storage.objects` permit `SELECT`, `INSERT`, `UPDATE` și `DELETE` rolului `public` pentru acest bucket. Nu sunt configurate limite de dimensiune sau tip MIME la nivelul bucket-ului.

Consecință: URL-urile publice folosite de Contracte sunt compatibile cu implementarea actuală, dar nivelul de expunere și drepturile de scriere/ștergere sunt mai largi decât controlul UI al modulului.

Fotografiile Dezmembrări nu folosesc acest bucket; ele sunt gestionate ca obiecte private în servicii externe, prin Edge Function.

## 7. Edge Functions și cron

### 7.1 `dezmembrari-photo-upload`

- stare: activă, versiunea observată 20;
- `verify_jwt = true`;
- există sursă locală;
- validează utilizatorul și permisiunile din profil;
- are allowlist CORS pentru producție și medii locale;
- generează upload/URL-uri semnate, citește/șterge obiecte și poate face ștergere permanentă pentru Admin;
- suportă Cloudflare R2 privat și fallback/compatibilitate Google Drive;
- folosește OCR.Space pentru recunoaștere;
- metadatele sunt sincronizate în `dezmembrari_photos`.

Secretele sunt folosite din mediul Edge; valorile lor nu au fost citite și nu sunt documentate aici.

### 7.2 `trimite-alerte`

- stare: activă, versiunea observată 23;
- `verify_jwt = false`;
- sursa locală nu există în `HUB_v2-LAB`;
- folosește service role pentru `config_alerte` și `flota_auto`;
- verifică pragurile 30, 10, 3 și 0 zile;
- trimite către un endpoint Google Apps Script și poate include adresa generală și emailul șoferului.

Jobul cron `trimite-alerte-job` este activ cu expresia `0 8 * * *`. Fusul orar efectiv al execuției nu a fost confirmat, deci nu se afirmă că ora este 08:00 Europe/Bucharest.

Lipsa verificării JWT și folosirea service role în interiorul funcției fac endpointul o zonă sensibilă. Din codul distribuit nu a fost observată o verificare alternativă a unui secret de apel.

## 8. Realtime

Cod client Realtime există în dashboard, AWB, Generator, Telefoane, Flotă și Bază VIN. La verificare, interogarea publicației `supabase_realtime` nu a întors tabele. Prin urmare:

- abonamentele pot fi inactive în starea curentă;
- pollingul la 60 de secunde din dashboard asigură totuși reîmprospătare periodică;
- paginile fără fallback nu trebuie presupuse ca actualizate live.

## 9. Migrații și diferența local–remote

La inventarul din 12.10.2026, repo-ul avea o singură migrare locală: `20260918132916_add_constatare_deviz_final_rpc.sql`, iar istoricul remote avea opt. La 15.10.2026, LAB conține în plus două fișiere de migrare pentru Avansuri, încă neversionate în această copie; schema live are obiectele noi. Diferența dintre schema administrată remote și sursa LAB versionată rămâne confirmată.

Această documentație descrie schema remote curentă, nu doar migrarea prezentă în repo.

## 10. Rezultatele advisorilor Supabase

### Securitate

- **istoric depășit (12.10.2026):** avertismentul Security Definer pentru `stoc_view_curent`; producția verificată la 03.11.2026 are `security_invoker=true`;
- `handle_new_user` cu `search_path` mutabil;
- **istoric depășit (12.10.2026):** 19 tabele publice fără RLS; la 03.11.2026 producția are 0 tabele publice cu RLS dezactivat;
- extensia `pg_net` instalată în schema `public`;
- funcții `SECURITY DEFINER` executabile de roluri largi;
- protecția Auth împotriva parolelor compromise este dezactivată.

### Performanță

- 22 chei străine fără index dedicat;
- politici RLS care apelează repetat `auth.uid()` fără forma optimizată `SELECT auth.uid()`;
- 15 indecși raportați ca nefolosiți — acest semnal nu justifică ștergerea fără măsurare;
- politici permisive multiple pe `dezmembrari_photos`.

Acestea sunt observații, nu modificări aplicate. Ordinea recomandată de tratare este în `08_RECOMANDARI.md`.

Clarificările de business pentru viitoarea securizare sunt: managementul utilizatorilor, rolurilor și permisiunilor este exclusiv Admin; `todo_tasks` este exclusiv Admin; Mecanic, Electrician și Tinichigiu nu folosesc momentan HUB AUTO și nu necesită politici dedicate; RLS se implementează incremental, tabel cu tabel, cu test și rollback independent.

## 11. Necunoscute explicite

- nu este confirmat dacă toate granturile largi au fost deliberate sau sunt moștenire istorică;
- nu este confirmat fusul orar al cronului;
- nu este confirmată utilizarea efectivă/volumul fiecărui index;
- nu sunt confirmate rotația și starea secretelor externe;
- nu este disponibilă local sursa funcției `trimite-alerte`;
- nu au fost testate mutații reale sau accesul cu conturi de rol diferit, deoarece etapa a fost read-only.

## 12. Actualizare READ-ONLY 15.10.2026 — avansuri în Deviz final

În proiectul conectat au fost verificate `deviz_final_header.vehicle_id bigint NULL`, `total_avans numeric NOT NULL DEFAULT 0`, `deviz_final_linii.avans_id bigint NULL`, tabelul `private.deviz_final_avans_review` și funcțiile `public.save_deviz_final`, `public.list_deviz_final_importable_avansuri`, `private.resolve_deviz_final_vehicle`, `private.mark_new_deviz_final_advance_available`. `create_deviz_final_from_constatare` există în continuare. Fișierele noi sunt `20261014194825_add_deviz_final_avans_atomic_save.sql` și `20261015000000_list_deviz_final_importable_avansuri.sql`; în LAB sunt neversionate, iar secțiunea 9 descrie situația anterioară.

- `vehicle_id` are FK spre `clienti_vehicule(id)` cu `ON DELETE RESTRICT` și index `deviz_final_header_vehicle_id_idx`.
- `total_avans` are CHECK nenegativ/finit. `avans_id` are FK spre `evidente_avansuri(id)` cu `ON DELETE RESTRICT`, index unic parțial `deviz_final_linii_avans_id_uidx` și CHECK `deviz_final_linii_avans_shape_chk`: legătura necesită antet, secțiune nenulă `avans` și total pozitiv/finit; liniile obișnuite pot păstra secțiune istorică NULL fără `avans_id`.
- `evidente_avansuri_plati(avans_id)` are index. Tabelul privat are PK/FK `avans_id` cu `ON DELETE CASCADE`, status limitat la `confirmed_used`/`confirmed_available`, `reviewed_at DEFAULT now()`; lipsa rândului înseamnă nerevizuit. Triggerul `evidente_avansuri_new_deviz_final_review` marchează doar INSERT-urile noi drept disponibile.
- RPC-urile publice noi sunt `SECURITY INVOKER` și verifică autentificarea + permisiunea `deviz_final`; helperul de vehicul este `SECURITY DEFINER`, cu `search_path` gol și rezultat minim (ID). Funcția trigger este tot `SECURITY DEFINER`, fără EXECUTE direct acordat utilizatorilor aplicației.
- **Istoric 15.10.2026, depășit:** RLS era OFF pe `deviz_final_header`, `deviz_final_linii`, `evidente_avansuri`, `evidente_avansuri_plati` și `constatari`, ON pe `clienti_vehicule`. Producția verificată la 03.11 are RLS ON pe toate cele 36 tabele publice. Granturile istorice largi NU au fost remediate de migrare; apelurile directe pot ocoli controlul din RPC.

Verificarea live a DF-199/200/201 a găsit avansurile 43/55/56 legate, câte o linie `avans`, fără piese negative în aceste trei devize. AV-55 are încă `data_platii` în 14.10.2026. Inventarul global al acelei etape era datat 12.10.2026 și nu fusese recalculat integral atunci; catalogul actual de producție este cel verificat la 03.11.2026, de la începutul documentului.
