# Contracte — stadiu RLS și arhiva Seriei 1

## Stadiu live — 21.10.2026

Contracte este **ACTIV ÎN PRODUCȚIE / ACTIV ÎN LAB**, cu politici S/I/U/D pentru Admin sau contracte. Referința aplicată de protecție minimă este pachetul supabase/contracte-production-package-20261019/, întâi 01_auth_sources.sql, apoi 02_contracte.sql; rollback în ordine inversă. Variantele solitare și vechea serie comună Contracte/TODO sunt istorice, nu de reexecutat.

todo_tasks are și el RLS ON în ambele medii, dar politicile permit CRUD oricărui authenticated. Regula documentată Admin-only nu este implementată în acele politici; este o restanță, împreună cu GRANT-urile largi/TRUNCATE, nu un tabel neactivat.

Nu s-a rulat nicio migrare sau probă de scriere în această actualizare. Inventarul complet și celelalte restanțe sunt în [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md); locațiile SQL/rollback în [10_PLAN_RLS.md](10_PLAN_RLS.md). AUTH avansat rămâne suspendat.

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Arhivă — analize și planuri anterioare, suspendate în forma integrală

Materialul de mai jos este păstrat pentru dependențe, dovezi și comparație. Datele de audit și stările se referă la momentul consemnat; nu sunt instrucțiuni active. Exemplele SQL și secvențele AUTH nu se execută prin simpla lor prezență aici. Pentru decizia actuală prevalează secțiunea de mai sus și [stadiul curent](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

**Status: PREGĂTIT - NEAPLICAT**  
Audit: **18.10.2026**. Proiect live: `HUB_Service_Auto` (`xyovkxmtbvgcwavuyxxu`), PostgreSQL 17.6.1.127.

## Decizia și limita de securitate

> **Context istoric — 18.10.2026:** blocajul „auth_profiles RLS OFF” din paragrafele următoare a fost depășit prin protecția minimă aplicată. Vechea serie comună nu se reexecută; TODO rămâne prea permisiv conform stadiului curent. Nu rezultă o obligație de continuare a AUTH avansat; vezi [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

Selectate: **`public.contracte` și `public.todo_tasks`**, două tabele cu risc operațional MIC pentru schimbarea izolată propusă. Nu completăm artificial până la patru. Această clasificare privește impactul/rollback-ul tabelelor, nu siguranța întregii aplicații.

**Aplicarea este blocată în starea live actuală.** `auth_profiles` are RLS OFF și granturi INSERT/UPDATE atât pentru anon, cât și pentru authenticated. Profilul care decide rolul și permisiunile poate fi modificat prin API. Un atacator poate ocoli viitoarele politici bazate pe acest profil. TODO nu poate fi declarat Admin-only sigur end-to-end cât timp această sursă rămâne editabilă neautorizat.

Migrarea include un preflight care ridică excepție înaintea oricărei schimbări dacă profilurile sunt modificabile fără RLS. Nu eliminați verificarea pentru a forța rollout-ul. Protejarea sursei autorizării necesită o rundă separată, explicit autorizată; aici `auth_profiles` este doar citit. Activarea RLS acolo nu este singură dovada rezolvării: trebuie testate separat politicile și toate căile de schimbare a privilegiilor.

## Metodă și surse

- Supabase: numai SELECT în cataloage, agregări de roluri/permisiuni, număr de rânduri și metadata Storage. Nicio migrare aplicată, nicio scriere, nicio impersonare live.
- Inspectate: `pg_class`/ACL (inclusiv PUBLIC), `pg_policies`, `pg_constraint`, `pg_trigger`, `information_schema.view_table_usage`, corpurile funcțiilor public/private și helperul `private.has_hub_permission(text)`, ACL pe coloane și apartenențele anon/authenticated.
- Cod: `modules/devize/contracte.html` (S 319, I 376, U 416/441; upload 228), `index.html` (hasPermission 105, fallback 1007, badge 1748), `modules/admin/admin.html` (TODO 3760–3990, rol 3049, configurare alerte 6342/6380/6572/6599), `modules/formulare/generator.html`, `modules/formulare/evidenta-awb.html`, `modules/manager/manager.js` (surse KPI și căutare).
- Documentele 09–12 sunt context istoric; această serie concretă înlocuiește pentru aceste două tabele vechile exemple generale, inclusiv exemplul TODO cu DROP POLICY.
- Căutarea în corpurile funcțiilor este textuală; nu dovedește absența SQL-ului dinamic, a consumatorilor externi sau a altor integrări. Acestea rămân UNKNOWN.
- Documentație verificată: [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [CREATE POLICY PostgreSQL](https://www.postgresql.org/docs/17/sql-createpolicy.html). Indexul changelog markdown nu a putut fi preluat în acest mediu; nu presupunem verificare completă a schimbărilor recente.

## Tabele analizate și necesarul CRUD

S/I/U/D = SELECT/INSERT/UPDATE/DELETE; P(x) = permisiune JSON boolean true; A = rol_id 1.

| Tabel | Modul și utilizatori efectivi | S necesar | I necesar | U necesar | D necesar | Dependențe confirmate | Risc operațional / decizie |
|---|---|---|---|---|---|---|---|
| `contracte` | Contracte + badge Dashboard; Admin, Manager, 4 Birou | A + permisiune efectivă Contracte | aceiași | aceiași | NU, inclusiv Admin | fără FK intrare/ieșire, trigger, view sau referințe în funcțiile public/private identificate; fotografii în bucket separat | **MIC**, selectat pentru DB; securitatea Storage rămâne separată |
| `todo_tasks` | Admin TODO; numai Admin conform regulii confirmate | A | A | A | A | fără FK, trigger, view sau funcții identificate; numai pagina Admin | **MIC**, selectat; guard restrictiv peste cele 4 politici originale |
| `generator_logs` | Generator, Dashboard, Manager KPI; A, Manager, Birou, Magazioner, Vopsitor au generator în profilurile curente | A/P(generator), fallback magazie; raportare Manager | operator autorizat | operator start/stop | NU | fără FK/trigger/view/funcție identificate; stare activă globală, polling, Realtime, sumar Manager | **MEDIU**, amânat: necesită separarea citirii KPI de operare și testarea start/stop concurent |
| `config_alerte` | Admin Alerte; A/P(admin_alerte); Edge folosește service_role conform auditului anterior | A/P(admin_alerte), backend | fără flux I confirmat | A/P(admin_alerte) | NU | fără FK/trigger/view/funcție SQL identificate; configurare email și Edge externă | **MARE**, amânat: efecte externe; implementarea Edge nu este prezentă în checkout, starea ei live nu a fost reauditata în această rundă |
| `evidenta_awb` | AWB, Dashboard, căutare și KPI Manager; A, Manager, Birou, Magazioner | operator awb/fallback magazie + raportare autorizată | operator | operator | NU | fără FK/trigger/view/funcție identificate; agregări Manager, Realtime, câmp `pret` | **MEDIU**, exclus din serie: valori financiare și mai mulți consumatori |

Nu sunt propuse schimbări pentru auth_profiles, clienti_*, constatari*, deviz_final_*, evidente_avansuri*, alte tabele financiare sau dependente. Citirea metadata/profilurilor pentru audit nu înseamnă remedierea lor.

## Starea live înainte

| Tabel | RLS / FORCE | Politici existente | Granturi live |
|---|---|---|---|
| `contracte` | OFF / OFF | zero | ALL pentru anon, authenticated, service_role; owner postgres |
| `todo_tasks` | ON / OFF | 4 permisive TO authenticated, expresii true, câte una S/I/U/D | aceleași granturi ALL |
| `generator_logs` | ON / OFF | `Permite_tot_pentru_public`, ALL TO public, USING true / CHECK true | aceleași granturi ALL |
| `config_alerte` | OFF / OFF | zero | aceleași granturi ALL |
| `evidenta_awb` | OFF / OFF | zero | aceleași granturi ALL |

ACL live: `postgres=arwdDxtm/postgres`, `anon=arwdDxtm/postgres`, `authenticated=arwdDxtm/postgres`, `service_role=arwdDxtm/postgres`. Include SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER și **MAINTAIN** (PostgreSQL 17). Nu s-au găsit granturi PUBLIC sau pe coloane la cele două tabele selectate; anon/authenticated fără apartenențe suplimentare identificate.

TODO original: `todo authenticated select` (USING true), `todo authenticated insert` (CHECK true), `todo authenticated update` (USING true, CHECK true), `todo authenticated delete` (USING true). Astăzi orice authenticated are CRUD; anon nu are politici CRUD, dar grantul TRUNCATE este separat de RLS.

Structură suplimentară confirmată: PK text `contracte.id_contract` și `todo_tasks.id`, fiecare cu index unic; TODO are CHECK pentru prioritate low/medium/high și status todo/in_progress/done. Niciunul dintre cele două tabele nu apare în pg_publication_tables la audit. Nu există secvențe necesare inserării lor.

Număr de rânduri observat: Contracte **43**, TODO **9**. Numerele sunt snapshot, nu condiții care blochează activitatea normală. Nu au fost extrase conținuturi de contracte sau taskuri.

## Accesul propus

### Contracte

- Trei politici permisive distincte S/I/U, numai TO authenticated; U conține USING și WITH CHECK.
- Autorizație: profil cu `id = auth.uid()` și fie `rol_id=1`, fie permisiunea efectivă din Dashboard.
- Reproduce exact fallback-ul curent: dacă cheia `contracte` există, este necesar booleanul JSON true; doar dacă lipsește cheia se folosește `devize=true`. `contracte=false/null/"true"` nu este înlocuit prin `devize=true`.
- Toți utilizatorii autorizați lucrează cu toate contractele. Nu introducem ownership per creator care nu există în fluxul actual.
- Grant authenticated numai S/I/U; fără DELETE pentru nimeni prin rolul browserului. anon fără granturi. Fără modificări ale granturilor owner/service_role.
- Profilurile curente: Admin (chiar dacă are contracte=false), Manager și toate cele 4 conturi Birou au acces; Magazioner și Vopsitor nu au. Rolurile Electrician, Tinichigiu, Mecanic au zero profiluri; nu primesc reguli de rol dedicate.

### TODO

- Păstrează cele patru politici originale intacte.
- Adaugă `hub_s1_todo_admin_guard AS RESTRICTIVE FOR ALL TO authenticated`, USING și WITH CHECK: profilul curent are `rol_id=1`.
- Regula efectivă este `(OR politici permisive existente) AND guard Admin`. O nouă politică permisivă nu poate lărgi accesul peste guard.
- Nu există delegare `admin_todo`, `admin_useri`, `panou_control` sau acces implicit Manager/Birou.
- Grant authenticated numai CRUD; anon fără granturi; TRUNCATE/REFERENCES/TRIGGER/MAINTAIN retrase pentru ambele roluri browser.
- Ambele tabele resping suplimentar sesiuni Supabase Auth cu `is_anonymous=true`. Un authenticated fără profil nu are acces.

Nu se introduce helper nou SECURITY DEFINER. Se folosesc subinterogări pe profilul propriu, cu auth.uid()/auth.jwt() în SELECT. Helperul existent are altă semantică de fallback și nu este modificat. Viitorul RLS auth_profiles trebuie să permită SELECT profil propriu, fără auto-editarea rolului/permisiunilor.

## Matrice minimă de teste

P = permis, R = respins (0 rânduri sau 42501, în funcție de operație/grant). Fiecare celulă se testează separat cu identitatea respectivă, prin SQL și apoi Data API/JWT real.

| Identitate / profil | Contracte S | I | U | D | TODO S | I | U | D |
|---|---|---|---|---|---|---|---|---|
| Admin, inclusiv contracte=false | P | P | P | R | P | P | P | P |
| Manager actual, contracte=true | P | P | P | R | R | R | R | R |
| Birou: fiecare dintre cele 4 conturi actuale | P | P | P | R | R | R | R | R |
| Magazioner actual | R | R | R | R | R | R | R | R |
| Vopsitor actual | R | R | R | R | R | R | R | R |
| Autentificat, contracte=false și devize=true | R | R | R | R | R | R | R | R |
| Autentificat, cheia contracte absentă și devize=true | P | P | P | R | R | R | R | R |
| Autentificat, contracte=null sau string "true", devize=true | R | R | R | R | R | R | R | R |
| Autentificat fără permisiuni sau fără profil | R | R | R | R | R | R | R | R |
| anon, fără JWT utilizator | R | R | R | R | R | R | R | R |
| Auth anonymous, chiar cu UUID de profil privilegiat în simulare | R | R | R | R | R | R | R | R |

Condiții obligatorii înainte de aplicare:

1. **Sursa autorizării**: dovada că anon și non-Admin nu pot insera un profil privilegiat sau modifica rol_id/permissions, nici prin apel direct, nici prin RPC/Edge; nu se rulează asemenea mutații în producție în această rundă. Guard-ul migrației trebuie să treacă legitim, fără eliminare.
2. **Reauditare și backup**: rulați auditul read-only și salvați metadata imediat înaintea rollout-ului; opriți dacă au apărut politici, granturi pe coloane/PUBLIC, consumatori noi sau diferențe relevante. Confirmați backup disponibil și revizuiți rollback-ul împreună cu snapshotul proaspăt.
3. **Clonă izolată**: aplicați migrarea, apoi scriptul test ca owner; cazurile cu permisiuni false/absente/null/string necesită identități de test pregătite separat în clonă. Scriptul testează toate profilurile copiei, plus anon, profil absent și sesiune anonymous; nu creează/modifică profiluri.
4. **Data API real**: repetați S/I/U/D cu JWT Admin, Manager, fiecare Birou și cont fără permisiune; verificați numărul rândurilor afectate și recitirea, nu doar absența erorii. UPDATE/DELETE refuzate pot întoarce 0 rânduri.
5. **Contracte în browser**: sesiune existentă și login proaspăt, listare/filtrare, badge incomplet, creare fără/cu fotografii, salvare intermediară, finalizare, persistare la reload și ID nou. Verificați aceeași origine/storage de sesiune: pagina Contracte folosește un client Supabase propriu, plus session-timeout.js, fără gate local complet pe permisiune. Nu permitem anon pentru a masca o sesiune absentă.
6. **TODO în browser**: creare, editare, finalizare, redeschidere, ștergere task finalizat; Manager/Birou/alte roluri respinse inclusiv prin URL/API direct.
7. **Granturi și rollback**: anon fără privilegii, authenticated fără TRUNCATE, D Contracte respins chiar Admin; reaplicare migrare; rollback; comparație exactă flags/ACL/politici și număr/conținut date fixture; revalidare Admin și operatori.

## SQL și verificări locale

- `supabase/migrations/20261018155917_rls_seria_1_contracte_todo.sql` — generată cu `supabase migration new`, apoi completată; tranzacție, timeout, preflight, granturi minimale, trei politici Contracte și un guard TODO. Fără DML/structură de business nouă. Reaplicarea recunoaște politicile proprii după marker; coliziunile fără marker sunt oprite. Schimbări manuale păstrând markerul cer reauditare.
- `supabase/rls_seria_1_rollback.sql` — tranzacție separată; elimină numai cele 4 politici proprii, restabilește Contracte OFF, păstrează TODO ON și politicile originale, reface ALL pentru anon/authenticated. Owner/service_role nu sunt modificate. **Reintroduce deliberat expunerea veche**; nu este întărire de securitate. Valabil pentru baseline capturat, nu pentru o stare viitoare arbitrară.
- `supabase/rls_seria_1_test.sql` — numai clonă/local, după migrare, sesiune owner; fixture-uri în cele două tabele, probe invoker cu SET ROLE/JWT și subtranzacții, apoi ROLLBACK. Nu executați pe producție; notificările externe pot supraviețui unui rollback de date. Cu psql folosiți `-v ON_ERROR_STOP=1` și fiecare fișier într-o sesiune proprie; la eroare opriți și dați ROLLBACK/închideți sesiunea.
- `supabase/rls_seria_1_audit.sql` — numai read-only, pentru captură flags/ACL/policies/dependențe și agregări fără identități personale.

Validare efectuată local: PostgreSQL **17.5 PGlite**, schemă sintetică pentru coloanele folosite, fără conexiune la producție. **96 probe CRUD reușite**, pe 9 profiluri sintetice + profil absent + anon + anonymous Auth; include fallback absent, false, null și string. Verificate suplimentar: preflight respinge auth_profiles editabil; migrarea rulată de două ori; politicile originale TODO păstrate; TRUNCATE retras; rollback rulată de două ori și comparație exactă flag-uri/ACL/politici/număr rânduri cu baseline local. Nu este testul unei clone complete sau al browserului/Data API live.

**NEEXECUTATE**: migrare live, rollback live, probe CRUD live, teste UI și integrare Storage. Nicio modificare de date live, frontend sau commit.

## Riscuri rămase

- **MARE**: auth_profiles editabil fără RLS; blocaj înainte de aplicare, nu remediat aici.
- **MARE**: bucket `documente_contracte` public, patru politici Storage TO public filtrate numai după bucket; URL-urile și upload-ul rămân expuse separat. Securizarea tabelului nu securizează fotografiile.
- **MEDIU**: persistența sesiunii pe pagina Contracte trebuie verificată în mediul real; UI poate raporta succes la U cu zero rânduri. Nu modificăm frontendul în această rundă.
- **MIC operațional** pentru cele două tabele: fără relații DB identificate, număr mic de fluxuri, modificări tranzacționale și rollback limitat. Acesta nu este un calificativ pentru securitatea globală.
- **UNKNOWN**: integrări externe/dynamic SQL, sincronizarea exactă a frontendului de producție cu LAB și testarea clonei complete.
