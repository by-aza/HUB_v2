# Roluri și bife — protecție minimă; Seria 0 integrală suspendată

## Context local și artefacte istorice absente — 03.11.2026

Stările RLS/ACL și probele din 18–21.10 de mai jos sunt dovezi istorice
LAB/producție; starea live actuală rămâne **NEEDS_REVIEW**. Regula de business
Admin-only se distinge de condițiile frontend curente `admin_useri` /
`panou_control`, documentate în [04](04_ROLURI_SI_ACCES.md). Nicio autorizare
efectivă DB nu a fost verificată în reconciliere.

Sunt absente aici `supabase/contracte-production-package-20261019/01_auth_sources.sql`,
`supabase/migrations/20261018162136_rls_seria_0_auth_profiles.sql`,
`supabase/rls_seria_0_audit.sql`, `supabase/rls_seria_0_test.sql` și
`supabase/rls_seria_0_rollback.sql`. „Pregătit”, preflight-urile și comenzile
din arhivă descriu artefactele de atunci, fără disponibilitate sau drept de
reexecuție în checkout-ul actual.

Flag-urile false și codul AUTH/Turnstile descrise aparțin istoricului LAB.
`js/auth-security.js`, `js/turnstile-config.js`, `js/turnstile.js`,
`supabase/auth-security-lab/` și `supabase/functions/hub-login/` sunt absente
aici. Nu sunt dependențe runtime locale și nu se importă/recreează.

## Protecția minimă ACTIVĂ; AUTH avansat SUSPENDAT — 21.10.2026

auth_profiles și auth_roles au RLS ON în producție și LAB. Politicile hub_guard_insert/update/delete folosesc hub_contracte_guard.is_admin(), iar citirea anon/authenticated true este păstrată pentru loginul actual și actorii aplicației. Rolurile API nu mai au TRUNCATE pe aceste două surse.

Aceasta este implementarea minimă consemnată în `supabase/contracte-production-package-20261019/01_auth_sources.sql` (artefact istoric absent aici), nu activarea vechii Serii 0 integrale. Controalele Admin-only au probe LAB istorice; în această rundă s-a recitit numai catalogul.

Loginul poreclă/email + parolă rămâne neschimbat. hub-login/AUTH avansat, Turnstile, limiterul și fluxurile de forwarding rămân **SUSPENDATE**. Local flag-urile sunt false; nu s-a invocat Edge și nu s-au schimbat setări sau secrete.

Nu mai există blocajul istoric „auth_profiles fără RLS/editabil de oricine”. Rămâne deliberat SELECT anonim pentru compatibilitate, fără a-l prezenta drept confidențialitate completă a profilului. Nu se propune schimbarea loginului în această sarcină. Vezi [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md) și [09_MATRICE_ACCES.md](09_MATRICE_ACCES.md).

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Arhivă — analize și planuri anterioare, suspendate în forma integrală

Materialul de mai jos este păstrat pentru dependențe, dovezi și comparație. Datele de audit și stările se referă la momentul consemnat; nu sunt instrucțiuni active. Exemplele SQL și secvențele AUTH nu se execută prin simpla lor prezență aici. Pentru decizia actuală prevalează secțiunea de mai sus și [stadiul curent](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

**Status: PREGĂTIT - NEAPLICAT**  
Audit live read-only: **18.10.2026**, `HUB_Service_Auto` / `xyovkxmtbvgcwavuyxxu`, PostgreSQL 17.6.1.127.

## 1. Decizia și blocajele înainte de aplicare

Se pregătește exclusiv securizarea `public.auth_profiles`. **Nicio aplicare în Supabase, nicio modificare de date live sau frontend, niciun commit. Seria 1 nu este continuată sau modificată.**

Model propus: anon fără acces; authenticated citește propriul profil; Admin (`rol_id=1`) citește toate profilurile și actualizează numai câmpurile folosite legitim de User Management. Utilizatorii obișnuiți nu pot modifica niciun profil. Inserarea rămâne la triggerul Auth. Nu există I/D din browser nici pentru Admin, fiind fluxuri neimplementate în frontendul actual.

**Migrarea nu trebuie aplicată pe frontendul actual.** Loginul prin User/poreclă depinde de SELECT anonim, iar anumite afișări de actori citesc profiluri străine. Soluția sigură necesită adaptarea acestor consumatori înaintea activării. Nu introducem o politică anon permisivă sau citire integrală a tuturor profilurilor doar pentru compatibilitate.

Migrarea are două bariere: comparație cu baseline-ul SQL auditat și o confirmare explicită de compatibilitate în aceeași sesiune. Nici fișierul și nici această rundă nu setează confirmarea. Un marker SQL nu poate demonstra singur că frontendul a fost adaptat: trebuie dovezi de teste în clonă și revizie separată a codului publicat.

## 2. Vulnerabilitatea actuală și schema exactă

`auth_profiles` este sursa HUB pentru `rol_id` și `permissions`. RLS **OFF**, FORCE **OFF**, owner `postgres`, zero politici și zero trigger-e pe tabel. anon/authenticated/service_role au **ALL**: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN (PG17); fără granturi pe coloane sau PUBLIC la tabel. Un client anonim poate citi date personale și poate modifica rolurile/permisiunile existente; INSERT este limitat doar de PK/FK/defaults, nu de autorizare. Fără protecția sursei, un permission gate UI sau RLS pe alte tabele poate fi ocolit prin schimbarea profilului.

Aceasta este o concluzie din cataloage și cod; **nu am încercat exploatarea sau scrierea live**. Nu există în această rundă dovadă că profilurile au fost deja compromise sau dovadă forensică a integrității lor istorice. Înaintea rollout-ului, Admin trebuie să reconcilieze privilegiile curente cu utilizatorii autorizați.

| Coloană | Tip | NULL | Default |
|---|---|---|---|
| id | uuid | NU | — |
| nume | varchar(100) | DA | — |
| prenume | varchar(100) | DA | — |
| telefon | varchar(20) | DA | — |
| rol_id | integer | DA | 3 |
| created_at | timestamptz | NU | timezone('utc', now()) |
| porecla | text | DA | — |
| email | text | DA | — |
| permissions | jsonb | DA | {"constatari":false,"panou_control":false} |

PK/index unic: `id`. FK spre `auth.users(id)` și `auth_roles(id)`, ambele fără ON DELETE CASCADE. Există 13 FK de intrare, din 9 tabele: comenzi_piese_sh, service_personal, dezmembrari_items, dezmembrari_photos, constatari_repartizari, constatari_departamente, devize, deviz_final_header, plati_manager. Nu modificăm aceste relații/tabele. Ștergerea profilului ar putea bloca sau nulifica relații; nu este introdusă ca flux nou.

Nu s-au identificat view-uri dependente, rules, publicații pentru auth_profiles sau alte trigger-e care îl modifică. Căutarea textuală în funcțiile altor scheme nu a găsit referințe suplimentare. Căutarea textuală nu exclude integrări externe sau SQL dinamic construit fără numele literal.

Snapshot agregat: **8 profiluri**, 1 Admin, 1 Manager, 4 Birou, 1 Magazioner, 1 Vopsitor. Zero roluri/permissions NULL; zero profiluri lipsă față de auth.users; zero emailuri/porecle lipsă; zero grupuri de porecle normalizate duplicate; zero diferențe email profil/Auth. Zero conturi cu admin_useri=true; panou_control=true numai la Admin. Nu am extras numele, emailurile sau UUID-urile individuale în documentație.

## 3. Autentificare, sesiune și creare profil

### Login și bootstrap existent

1. `modules/admin/login.html:109–130`: dacă inputul nu conține @, înainte de signInWithPassword se face SELECT email WHERE porecla=... din auth_profiles. Este singura dependență directă anon identificată în frontend.
2. Loginul cu email apelează direct Supabase Auth, fără lookup de profil înainte de autentificare.
3. După login: SELECT rol_id,permissions pe UUID propriu; `returnTo` și redirecționarea de rol se bazează pe acel profil.
4. `index.html:49`: profil propriu și join auth_roles pentru dashboard; `js/session-timeout.js:241`: getUser și SELECT rol propriu. Aceste citiri rămân permise prin politica proprie.
5. Celelalte module citesc propriul rol/permissions sau propria poreclă/email pentru actorul de audit. Nu au nevoie de UPDATE pe profil.
6. Resetarea parolei (`resetare-parola.html`) folosește `auth.updateUser({password})`, nu UPDATE auth_profiles. Emailul de resetare din User Management nu reprezintă administrarea profilului în DB și nu a fost trimis în această rundă.

### Crearea utilizatorilor

Trigger live: `on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`, enabled O. Funcția este SECURITY DEFINER, owner postgres, fără search_path fixat și EXECUTE pentru PUBLIC/anon/authenticated/service_role. Inserează numai id, nume='', prenume='', telefon='', rol_id=3; permissions vine din default. Nu citește raw_user_meta_data și nu are rol/permissions furnizate de client.

**Rolul 3 este Birou**, nu Mecanic, în pofida comentariului învechit din corpul funcției. Propunerea păstrează comportamentul actual și fixează numai search_path și EXECUTE; nu schimbă rolul implicit sau datele existente. O funcție trigger nu este în sine un RPC obișnuit apelabil cu succes fără context trigger, dar EXECUTE public este inutil.

User Management din ambele pagini Admin are CREATE/DELETE ca placeholder „funcționalitate viitoare”; nu există signUp/createUser/inviteUser activ în frontendul inspectat. Calea confirmată de creare profil este triggerul Auth; modalitatea operațională prin care au fost create manual cele 8 conturi nu poate fi dedusă doar din cod. Nu adăugăm un RPC nou de creare utilizatori și nu acordăm INSERT pentru a masca un profil lipsă.

Limită existentă la onboarding: triggerul NU completează porecla sau emailul profilului. La cele 8 profiluri actuale acestea sunt complete, dar nu rezultă că triggerul le-a completat. Bootstrap prin UUID și login prin email pot funcționa pentru un user nou; loginul prin poreclă cere un alias și un mecanism sigur care identifică emailul Auth. Sincronizarea viitoare email Auth/profil necesită un flux server separat; nu este inventată sau implementată aici.

## 4. Inventarul consumatorilor frontend

Sursele active cu referințe directe sunt 19 fișiere frontend și un fișier Edge local; `.orig` este copie de referință, nu sursă activă. Nu s-au găsit INSERT/UPSERT/DELETE auth_profiles în frontend. Singurele UPDATE sunt în cele două pagini Admin.

| Fișier / pagină | Citire auth_profiles | Scriere | Impact al modelului propus |
|---|---|---|---|
| index.html:49 | profil propriu + auth_roles | — | păstrat |
| modules/admin/login.html:111,167 | anonim email după poreclă; apoi profil propriu | — | lookupul pre-login trebuie înlocuit; bootstrap propriu păstrat |
| modules/admin/admin.html:3116,4150 | rol/permissions proprii; audit actor propriu 2746/3024/5856 | — | păstrat |
| modules/admin/admin.html:4072,4162 | verificare alias duplicat + lista completă utilizatori | U 4246: nume,prenume,porecla,telefon,rol_id,permissions | funcțional pentru Admin; admin_useri nu va delega administrarea |
| modules/admin/panou_control.html:314,336 | profil propriu + lista utilizatorilor | U 457: aceleași 6 câmpuri | funcțional pentru Admin; panou_control nu va delega administrarea |
| modules/admin/admin.html:2657,2868,2889,3456,5191 | nume creatori, join-uri devize/Dezmembrări, filtru actori audit | — | Admin vede toate; utilizatorii cu taburi delegate au nevoie de proiecții limitate |
| js/dezmembrari.js:413,414,447 | creator/updater din alte profiluri; rol propriu pentru ștergere | — | rol propriu păstrat; numele altor actori necesită adaptare |
| js/constatari_v2.js:416,3077 | audit actor propriu + rol/permissions proprii | — | păstrat |
| js/clienti-notificari.js:91 | rol/permissions proprii | — | păstrat |
| js/comenzi_piese_sh.js:206 | rol/permissions proprii | — | păstrat |
| js/dezmembrari_capture.js:536 | rol/permissions proprii | — | păstrat |
| js/session-timeout.js:241 | rol propriu după getUser | — | păstrat; orice refuz accidental afectează gestionarea sesiunii |
| modules/manager/manager.js:1140 | id,rol_id,permissions proprii | — | păstrat; nu primește catalogul profilurilor |
| modules/devize/plati.html:243 | rol/permissions proprii | — | păstrat |
| modules/devize/deviz_final.html:2084,2814 | audit actor propriu + rol/permissions | — | păstrat |
| modules/devize/deviz.html:1027 | audit actor propriu | — | păstrat |
| modules/devize/avans.html:866 | audit actor propriu | — | păstrat |
| modules/flota/lista_masini.html:144 | audit actor propriu | — | păstrat |
| modules/formulare/detailing.html:218 | audit actor propriu | — | păstrat |
| modules/formulare/evidenta-awb.html:292 | audit actor propriu | — | păstrat |
| modules/stocuri/consumabile.html:381 | audit actor propriu | — | păstrat |

Pagini suplimentare care citesc profilul indirect prin scripturi partajate: `modules/devize/cautare_devize.html`, `modules/devize/contracte.html`, `modules/flota/baza-vin.html`, `modules/formulare/generator.html`, `modules/formulare/telefoane-clienti.html`, `modules/stocuri/piese_stoc.html` (session-timeout); `modules/devize/clienti-notificari.html`, `modules/devize/comenzi_piese_sh.html`, `modules/formulare/constatari_v2.html`, `modules/stocuri/dezmembrari.html`, `modules/stocuri/dezmembrari_capture.html`, `modules/manager/manager.html` (scripturile respective din tabel). Celelalte pagini care includ session-timeout sunt deja listate mai sus. Inventarul privește checkout-ul LAB; identitatea cu frontendul publicat este UNKNOWN.

### Există self-update legitim?

**Nu a fost identificat în codul inspectat.** Nu există pagină de editare a profilului propriu pentru utilizatori obișnuiți. Nume, telefon și poreclă sunt editate din User Management Admin, împreună cu rolul/permisiunile. Nu introducem o politică self-update doar pentru că unele câmpuri sunt neprivilegiate. Dacă apare ulterior o nevoie reală, trebuie un flux separat limitat la câmpuri, fără rol_id/permissions.

## 5. Funcții/RPC, Edge și politici dependente

| Funcție SQL | Comportament față de profil |
|---|---|
| public.handle_new_user() | singura funcție identificată care inserează profiluri; trigger Auth |
| public.can_manage_dezmembrari() | SECURITY DEFINER; citește numai rol/permissions ale auth.uid() |
| public.can_capture_dezmembrari() | SECURITY DEFINER; aceeași bază de autorizare |
| private.has_hub_permission(text) | SECURITY DEFINER; rol/permisiunea profilului propriu |
| private.resolve_deviz_final_vehicle(text,text) | SECURITY DEFINER; verifică profil propriu înaintea operațiilor sale |
| public.create_deviz_final_from_constatare(bigint,jsonb,jsonb) | invoker; citește profil propriu, scrie alte tabele, nu profilul |
| public.save_deviz_final(bigint,jsonb,jsonb) | invoker; citește profil propriu, nu modifică profilul |
| public.list_deviz_final_importable_avansuri(bigint,text,text) | invoker; citește profil propriu |

Inventariate toate cele 10 funcții SQL/PLpgSQL din public/private, inclusiv cele două fără acces la profil. Nu au fost găsite alte funcții în alte scheme cu referință textuală auth_profiles. Nu le modificăm pe cele financiare sau helperii existenți.

Există **24 politici** care citesc direct auth_profiles, în șase tabele: admin_announcements, baza_vin, telefoane_clienti, flota_auto, detailing, comenzi_piese_sh. Citirea profilului propriu rămâne necesară pentru ele. Testarea locală a folosit definițiile reale ale acestor politici, pe tabele sintetice; nu s-au constatat recursie sau erori de SELECT. Aceasta nu acoperă complet CRUD-ul fiecărui modul.

Cod Edge live citit, fără deploy/invocare: `dezmembrari-photo-upload` v20, verify_jwt=true, citește propriul profil cu JWT utilizator pentru capture/manage și rolul Admin prin service_role pentru anumite acțiuni; nu scrie profiluri. `trimite-alerte` v23, verify_jwt=false, nu referă auth_profiles. Codul celei de-a doua funcții a fost doar inspectat, nu executat. Configurația exactă a schemelor expuse PostgREST nu a fost returnată de current_setting; este UNKNOWN din acest canal, deci nu presupunem verificarea setării proiectului.

## 6. Granturi și politici propuse

| Identitate | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| anon | NU | NU | NU | NU |
| authenticated obișnuit, Manager, Birou, fără permisiuni | numai propriul profil, toate cele 9 coloane | NU | NU | NU |
| Admin rol_id=1 | toate profilurile | NU prin browser | numai nume,prenume,telefon,porecla,rol_id,permissions | NU prin browser |
| authenticated cu admin_useri/panou_control, dar rol_id diferit de 1 | numai propriul profil | NU | NU | NU |
| Auth anonymous, inclusiv UUID privilegiat în simulare | NU | NU | NU | NU |
| utilizator autentificat fără profil | zero rânduri | NU | NU | NU |
| trigger Auth existent | nu este un actor browser | creează profil fix rol 3/defaults | — | — |

SQL: retragem ALL de la PUBLIC/anon/authenticated; acordăm authenticated SELECT de tabel și UPDATE doar pe cele șase coloane. RLS limitează UPDATE la Admin. Nu acordăm INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER sau MAINTAIN. id, created_at și email nu sunt actualizabile prin clientul browser, nici de Admin, deoarece formularul nu le scrie. Owner/service_role rămân privilegii backend de încredere; nu trebuie distribuite în frontend.

Două politici: `hub_s0_profiles_select` (propriu OR Admin, excluzând Auth anonymous) și `hub_s0_profiles_update_admin` (USING + WITH CHECK Admin). Nu există politici INSERT/DELETE și nu se adaugă FORCE RLS.

Unicul helper nou, **necesar pentru evitarea recursiei**: `private.hub_s0_is_admin()`, fără parametri, SQL STABLE SECURITY DEFINER, owner postgres/BYPASSRLS, search_path gol, verifică numai auth.uid(), rol_id=1 și absența is_anonymous=true. EXECUTE numai owner și authenticated; schema private are deja USAGE authenticated. Helperul nu citește user_metadata și nu poate fi folosit pentru a testa arbitrar alt UUID. Dacă verificarea Adminului ar folosi direct același tabel din propria politică, ar putea produce recursie. Nu introducem un RPC Admin paralel: UPDATE-ul existent din User Management poate rămâne, protejat de aceste politici.

`handle_new_user()` păstrează corpul original, fixează search_path='' și pierde EXECUTE PUBLIC/anon/authenticated/service_role. Testul local confirmă că triggerul continuă să ruleze la inserarea făcută cu supabase_auth_admin. Nu dăm drept de inserare în auth_profiles acelui rol doar pentru a compensa o configurație incorectă.

## 7. Adaptări frontend necesare, neimplementate aici

> **Plan istoric SUSPENDAT în forma avansată.** Pasajele de mai jos se păstrează ca raționament tehnic, nu ca instrucțiuni de continuare a `hub-login`, Turnstile/CAPTCHA sau limiterului custom. Loginul existent, rolurile și protecțiile RLS active se păstrează; riscurile rămân documentate. Decizia actuală este în [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

Lista descrie condițiile vechii Serii 0 integrale, nu restanțe obligatorii ale protecției minime active. Gate-urile Admin-only și confirmarea UPDATE există acum în codul LAB; recomandările despre înlocuirea loginului nu sunt direcția curentă.

1. **Login prin User/poreclă**: înlocuiți SELECT-ul anonim cu un mecanism server de autentificare care primește alias + parolă și verifică prin Supabase Auth, cu limitare de încercări și răspunsuri generice. Nu expuneți emailul printr-un RPC anonim de lookup; ar păstra enumerarea. Contractul endpointului/sesiunii și protecțiile trebuie proiectate și testate într-o rundă autorizată. Varianta email-only ar schimba fluxul existent și necesită decizie de produs; nu este presupusă aici.
2. **Nume actori străini**: adaptați join-urile Dezmembrări și citirile taburilor delegate la proiecții limitate, autorizate după înregistrarea/modulul accesibil; numai id + display_name, fără email, telefon, rol_id, permissions. Nu se publică un catalog complet de profiluri pentru a rezolva doar etichetele. Nu implementăm acum un RPC/view cu domeniu de business insuficient stabilit.
3. **User Management**: aliniați mesajele/gate-urile UI la Admin-only în ambele pagini; `admin_useri`/`panou_control` nu mai pot autoriza administrarea. Conturile curente nu au delegări relevante. UPDATE-ul Admin existent poate fi păstrat; verificarea rândului returnat trebuie să prevină „succes” fals la zero rânduri.

Loginul cu email și bootstrap-ul propriu au politici compatibile, dar **păstrarea completă a fluxurilor legitime nu este încă demonstrată în browser**. Migrarea refuză aplicarea fără validarea adaptărilor, nu pretinde că este sigură operațional pe frontendul nemodificat.

## 8. Preflight, fișiere și aplicare viitoare

Fișiere pregătite:

- `supabase/migrations/20261018162136_rls_seria_0_auth_profiles.sql` — fișier creat prin CLI migration new; fără DML sau modificări de structură a tabelului.
- `supabase/rls_seria_0_audit.sql` — BEGIN READ ONLY, metadata completă, definițiile funcțiilor relevante și agregări de integritate.
- `supabase/rls_seria_0_test.sql` — exclusiv clonă/local; fixture-uri noi și probe SET ROLE/JWT, apoi ROLLBACK; fără modificarea profilurilor existente.
- `supabase/rls_seria_0_rollback.sql` — restaurarea baseline-ului de securitate și a funcției trigger, fără date.

Preflight-ul compară coloane/defaults/ACL, RLS/FORCE/owner, PK/FK/index, trigger-e și starea lor, rules/view-uri/publicații, definițiile/hashurile/ownerii/granturile funcțiilor, politicile dependente, granturile schemelor, rolurile DB/apartenențele relevante, catalogul auth_roles și numărul/hashul UUID+rol+permissions al profilurilor. Nu expune valorile individuale. O schimbare legitimă de utilizatori/permisiuni între audit și aplicare cere reauditare și regenerarea baseline-ului; **nu se elimină comparația**. Migrarea este intenționat one-shot, nu idempotentă prin ignorarea drift-ului.

Se ia scurt ACCESS EXCLUSIVE pe auth_profiles și SHARE pe auth_roles înainte de verificare, pentru a evita schimbarea sursei între snapshot și revocare. Nu sunt modificări de date/granturi în auth_roles. lock_timeout=5s, statement_timeout=30s; orice eroare cere ROLLBACK/închiderea sesiunii și oprire. Citirile/loginul/signup pot aștepta pe lock, deci rollout-ul viitor se face controlat.

După teste reale în clonă și revizie de frontend, markerul cerut este `hub.rls_s0.compatibility_review = 'login_and_actor_reads_validated'`, setat în aceeași sesiune înaintea fișierului. Markerul nu remediază codul și nu trebuie folosit acum pentru a forța aplicarea. Modificările frontend și versiunile Edge nu pot fi verificate automat de SQL; revizia lor rămâne externă.

**Nu rulați db push / toate migrările.** Fișierul Seriei 1 are timestamp **20261018155917**, anterior Seriei 0 **20261018162136**; aplicarea întregului director ar încerca Seria 1 întâi. Nu am redenumit și nu am modificat acea migrare. Orice rollout viitor trebuie să aleagă explicit doar Seria 0 și să reconcilieze istoricul printr-un plan separat, fără a continua automat cu Seria 1.

## 9. Matricea și planul de teste

P = permis, R = respins, propriu = exact rândul UUID-ului JWT. Pentru UPDATE/DELETE, absența erorii nu dovedește succes: verificați rândul afectat și recitirea.

| Actor | SELECT propriu | SELECT străin | INSERT | UPDATE rol/permissions propriu | UPDATE alt profil | DELETE |
|---|---|---|---|---|---|---|
| anon | R | R | R | R | R | R |
| authenticated normal | P | R | R | R | R | R |
| Manager | P | R | R | R | R | R |
| Birou | P | R | R | R | R | R |
| fără permisiuni speciale | P | R | R | R | R | R |
| non-Admin cu admin_useri/panou_control=true | P | R | R | R | R | R |
| Admin | P | P | R | P pe cele 6 coloane | P pe cele 6 coloane | R |
| fără profil | zero rânduri | R | R | R | R | R |
| Supabase Auth anonymous | R | R | R | R | R | R |

Teste obligatorii înaintea rollout-ului:

- Creare prin serviciul Auth, profil automat rol 3/defaults, fără absorbirea rolului/permissions din raw_user_meta_data; profilul nu se creează prin INSERT browser.
- Login email și login prin User în implementarea adaptată; lookup anonim direct refuzat; user existent citește propriul rol/permissions; index și session-timeout funcționează cu JWT real și după refresh.
- Admin listează toate profilurile și modifică rolul/permissions altui user; Manager/Birou/fără permisiuni încearcă aceleași operații și rămân fără schimbări.
- User încearcă auto-promovare la rol 1, modificare permissions, înlocuire id/email/created_at, inserarea unui profil privilegiat sau ștergere/recreare; toate sunt respinse. user_metadata/JWT metadata nu acordă roluri.
- Admin nu poate actualiza id/email/created_at prin browser; nu presupuneți că orice câmp existent în tabel trebuie acordat.
- Afișarea creator/updater în Dezmembrări și taburile delegate, audit actori, filtre utilizatori; nu trebuie să dispară nume legitime sau să apară date personale suplimentare.
- Citirile de profil prin funcțiile/RPC existente și cele șase tabele cu politici dependente; Edge Dezmembrări cu JWT user și service_role în backend.
- Ultimul Admin: preveniți operațional auto-demotarea singurului Admin până există un plan de recuperare; migrarea nu introduce o regulă nouă/trigger de business pentru această situație.
- Preflight: schemă, grant, politică, funcție sau rol schimbat => STOP; lipsă marker => STOP; reaplicare => STOP. Rollback separat și comparație metadata/privilegii/date înainte/după.

### Data API HTTP — numai clonă, cu JWT real

Rulați fiecare operație separat cu cheia publică și tokenul actorului, fără service_role în browser:

| Cerere către /rest/v1/auth_profiles | Așteptare |
|---|---|
| GET ?select=* fără JWT user | 42501/refuz; nici email/porecla nu mai pot fi enumerate |
| GET ?select=*&id=eq.UUID_PROPRIU | exact propriul profil pentru user normal; inclusiv rol_id/permissions |
| GET ?select=*&id=eq.UUID_ALT_USER | [] pentru non-Admin; rând pentru Admin |
| POST profil cu UUID Auth valid | refuz pentru toate identitățile browser, inclusiv Admin |
| PATCH UUID_PROPRIU, rol_id=1 / permissions privilegiate | non-Admin: refuz sau zero rânduri; recitirea trebuie să confirme neschimbat |
| PATCH UUID_ALT_USER, cele 6 câmpuri permise | rând modificat numai pentru Admin |
| PATCH id/email/created_at | refuz inclusiv Admin |
| DELETE UUID | refuz inclusiv Admin |

Pentru PATCH folosiți `Prefer: return=representation`; nu tratați 200/204 fără rânduri ca succes. Tokenul de Admin trebuie să fie al contului Admin real, nu un JWT creat manual cu roluri/metadata. RLS nu înlocuiește verificarea JWT de către Supabase.

### Verificări efectuate în această rundă

**135 probe** de acces în PostgreSQL **17.5 PGlite**, cu profiluri sintetice și auth.users minimal: S propriu/străin/fără filtru, I/U/D, auto-promovare, permissions, date proprii, Admin modifică alt rol, restricții pe id/email/created_at, helper Admin și Auth anonymous. **7 creări de profil** prin SET ROLE supabase_auth_admin și trigger, cu metadata malițioasă ignorată. Definițiile reale ale celor 24 politici dependente au trecut SELECT pe șase tabele sintetice, fără recursie.

Au fost verificate și: preflight refuză baseline diferit și lipsa markerului; drift de schemă refuzat; reaplicare refuzată; audit SQL executabil în READ ONLY; rollback de două ori restaurează definiția/configurația/granturile triggerului, flag-urile RLS, politicile, helperul, datele existente și privilegiile efective de tabel/coloane. Ordinea fizică a intrărilor ACL poate diferi fără diferență de drepturi.

În mediul sintetic s-a înlocuit **numai în memoria runnerului local** baseline-ul așteptat cu cel al fixture-ului; fișierul livrat păstrează baseline-ul live, reverificat read-only cu rezultat egal. Nu am testat o clonă completă a producției sau serverul Supabase Auth. **NEEXECUTATE:** Data API HTTP/JWT real, login browser, Edge invocation, signup Auth API, migrare/rollback live. Nu sunt raportate ca validate.

## 10. Rollback și riscuri

Rollback-ul elimină numai cele două politici și helperul propriu, dezactivează RLS pe auth_profiles, retrage granturile pe coloane noi, reface ALL anon/authenticated și reface definiția originală a handle_new_user(), search_path și ACL EXECUTE. Nu schimbă owner/service_role la tabel și nu atinge datele, auth_roles, FK-urile sau Seria 1. Se oprește la politici/helper fără marker, FORCE diferit sau corp de trigger modificat; helperul se șterge fără CASCADE.

**Rollback-ul reintroduce vulnerabilitatea critică**, nu este o stare sigură de exploatare. Se folosește numai pentru incident controlat, după compararea auditului actual cu baseline-ul. Nu poate recupera date alterate înainte/după un incident; backupul de date și auditul separat rămân necesare. Dacă frontendul a fost adaptat între timp, reversarea lui cere propriul plan; scriptul SQL nu inversează deployment-uri.

Riscuri de aplicare greșită: pierderea loginului prin User; sesiuni care nu pot citi profilul; dispariția numelor actorilor străini; User Management blocat sau fals succes la UPDATE zero rânduri; signup blocat dacă triggerul/ownerul/rolul implicit sunt greșite; auto-demotarea ultimului Admin; granturi backend confundate cu acces browser; timeouts/lock-uri.

**Risc rămas separat: auth_roles este RLS OFF și ALL anon/authenticated.** Permite administrarea neautorizată a catalogului de roluri, iar 20 dintre politicile dependente folosesc numele Admin prin join, nu exclusiv rol_id numeric. Nu îl modificăm în Seria 0. Este necesară o rundă separată înainte de a declara securitatea globală a administrării rolurilor rezolvată. Helperul nou și Seria 1 folosesc rol_id=1, astfel că schimbarea simplă a numelui rolului nu le acordă Admin.

## 11. Relația cu Seria 1

Seria 0 ar elimina **blocajul sursei rol_id/permissions** pentru politicile numerice din Seria 1 după aplicare și validare efectivă. Profilul propriu rămâne citibil, deci subinterogările Contracte/TODO au baza necesară. Până atunci, Seria 1 rămâne **PREGĂTIT - NEAPLICAT**, cu blocajul actual și propriile condiții de test.

**Nu există încă undă verde pentru Seria 1.** Sunt necesare: adaptările frontend validate, reconcilierea privilegiilor existente, audit nou al sursei după Seria 0, probe Data API de non-escaladare și CRUD, verificarea sesiunii Contracte/TODO și aprobarea separată a aplicării. Riscul auth_roles și expunerea Storage Contracte rămân distincte. Nu a fost aplicată, testată live, redenumită sau modificată nicio parte din Seria 1 în această rundă.

Surse oficiale consultate: [Supabase User Management](https://supabase.com/docs/guides/auth/managing-user-data), [PostgreSQL CREATE POLICY](https://www.postgresql.org/docs/17/sql-createpolicy.html). Indexul changelog markdown nu a putut fi preluat de canalul web; nu pretindem verificarea completă a changelogului. Concluziile HUB provin din codul LAB și din metadata live descrisă mai sus.
