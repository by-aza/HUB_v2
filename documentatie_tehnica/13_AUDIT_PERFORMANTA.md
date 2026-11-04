# HUB AUTO v2 — audit READ-ONLY de performanță

## 1. Scop, metodă și limite

Auditul a fost realizat la 12 octombrie 2026, fără modificarea codului, datelor, schemei, indecșilor, RLS, Storage, Edge Functions sau configurației Supabase.

Sursele folosite sunt:

- codul din `HUB_v2-LAB/`;
- documentația tehnică existentă `00`–`12`;
- catalogul și statisticile PostgreSQL/Supabase, citite exclusiv prin interogări read-only;
- `pg_stat_user_tables`, `pg_stat_statements`, indecșii existenți și definiția `stoc_view_curent`;
- logurile Supabase din ultimele 24 de ore, agregate fără modificări;
- Advisor-ul de performanță Supabase.

Nu a fost rulat un test sintetic Lighthouse/WebPageTest și nu a fost instrumentat browserul de producție. Timpii din loguri sunt timpi de origine Supabase, nu timpul complet perceput pe dispozitiv. Concluziile despre ordinea request-urilor și volumul lor sunt confirmate din cod; estimările de beneficiu sunt marcate ca atare.

> **Actualizare 2026-10-13:** acest document păstrează intenționat starea și dovezile auditului inițial. Situația curentă a optimizărilor este urmărită în `15_OPTIMIZARI_IMPLEMENTATE.md`. Problemele P01, P02, P06, P10 și P13 sunt `DEPLOYED / VALIDAT ÎN PRODUCȚIE` ca remediate. După deploy au fost testate Dashboardul principal, căutarea globală, Manager Dashboard și Constatări v2. Pollingul Generatorului este `PĂSTRAT INTENȚIONAT`.

## 2. Concluzie executivă

La momentul auditului inițial, principala limitare nu era viteza PostgreSQL, ci numărul mare de request-uri browser → Supabase și felul în care erau lansate. Pentru starea de după implementările din 2026-10-13 trebuie consultat `15_OPTIMIZARI_IMPLEMENTATE.md`.

Cele mai importante constatări sunt:

1. `index.html` lansează aceeași suită de badge-uri de două ori la pornire și mai citește anunțul încă o dată separat.
2. Dashboardul menține aproximativ 17 request-uri REST/minut/tab doar pentru badge-uri și verificarea conexiunii.
3. Manager Dashboard execută 13 SELECT-uri de date/profil la deschidere, iar cinci dintre interogările financiare sunt strict secvențiale, deși nu depind una de alta.
4. Constatări recitește lista și patru seturi asociate la fiecare 15 secunde; aceasta înseamnă aproximativ 20 de SELECT-uri/minut/tab.
5. Generator verifică separat conexiunea la fiecare 5 secunde, adică 12 request-uri/minut/tab. Clarificarea de business confirmă că frecvența este intenționată pentru sincronizarea rapidă între utilizatori și nu trebuie tratată ca trafic redundant.
6. Realtime este configurat în cod, dar publicația `supabase_realtime` nu conține tabele. Abonamentele nu înlocuiesc pollingul actual.
7. Timpii SQL măsurați sunt mici în raport cu timpul HTTP. În ultimele 24 de ore, endpointurile badge-urilor au avut aproximativ 180–205 ms medie și circa 620–659 ms p95, în timp ce instrucțiunile SQL dominante au în general medii sub 5 ms.
8. Mai multe module citesc toate rândurile și agregă în browser. Efectul este încă moderat deoarece tabelele sunt mici, dar va deveni important la creștere.
9. Dezmembrări are un model N+1 pentru thumbnail-uri: o interogare de metadate și apoi un apel Edge/URL semnat pentru fiecare articol vizibil.
10. Revalidarea sesiunii și a profilului este duplicată de pagini și de `session-timeout.js`.

## 3. Dovezi cantitative din Supabase

### 3.1 Volumul curent

Valorile sunt estimările `n_live_tup` din statisticile PostgreSQL, suficiente pentru a distinge impactul actual de riscul la scalare.

| Tabel | Rânduri estimate | Observație relevantă |
|---|---:|---|
| `audit_logs` | 2.862 | cel mai mare tabel operațional; citire Admin limitată la 500, dar fără index pe `created_at` |
| `deviz_final_linii` | 2.175 | linii încărcate după antet; are index util pe legătura cu devizul final prin indexul unic compus |
| `dezmembrari_photos` | 540 | generează multe lookup-uri de thumbnail și apeluri Edge |
| `stoc_miscari` | 259 | scanat/agregat de `stoc_view_curent`; nu are index pe `produs_id` |
| `deviz_final_header` | 182 | încă suficient de mic pentru agregare locală, dar este citit integral de Manager |
| `telefoane_clienti` | 174 | citit integral pe pagina sa |
| `devize` | 85 | mic; scanarea nu este încă scumpă |
| `dezmembrari_items` | 81 | toate articolele sunt randate și puse în coada de thumbnail-uri |
| `stoc_produse` | 81 | mic, dar view-ul de stoc este chemat foarte des |
| `generator_logs` | 72 | mic, însă are frecvență foarte mare de citire |
| `evidenta_awb` | 59 | mic; citirile complete sunt încă ieftine |
| `evidente_avansuri_plati` | 49 | mic; Manager îl citește integral |
| `constatari` | 43 | mic; costul actual este mai ales round-trip-ul și frecvența |
| `contracte` | 43 | mic; filtrul de badge este frecvent |
| `clienti`, `clienti_vehicule` | 42 / 42 | mici, dar modulul C&N este proiectat să le citească integral, paginat |
| `flota_auto` | 23 | indexurile suplimentare nu ar produce acum un câștig vizibil |
| `plati_manager` | 3 | scanarea nu este o problemă în prezent |
| `detailing` | 1 | orice index nou ar fi prematur pentru volumul actual |

Statisticile au fost resetate ultima dată la `2026-05-22 15:13:20+00`; numerele de scanări de mai jos acoperă deci mai multe luni, nu o singură zi.

### 3.2 Ce arată statisticile SQL

Exemple reprezentative din `pg_stat_statements`:

| Interogare normalizată | Apeluri observate | Medie SQL | Interpretare |
|---|---:|---:|---|
| `stoc_view_curent`, toate coloanele | 17.275 | 2,371 ms | view-ul agregă stocul, dar SQL-ul nu explică singur latența vizibilă |
| `stoc_view_curent`, variantă similară | 11.029 | 1,476 ms | frecvența este problema dominantă |
| `generator_logs`, listă descrescătoare | 18.376 | 1,211 ms | tabel mic, citit foarte des |
| `generator_logs`, variantă similară | 22.311 | 0,604 ms | confirmă cost DB mic, trafic mare |
| `constatari`, lista extinsă | 18.717 | 0,709 ms | pollingul și request-urile asociate contează mai mult decât execuția SQL |
| `contracte`, count cu status | 18.604 | 0,625 ms | nu este acum un query lent; este un query foarte repetat |
| `devize`, count | 20.572 | 0,486 ms | folosit de badge/health check |
| thumbnail `dezmembrari_photos` per `item_id` | 9.926 | 0,779 ms | N+1 confirmat și în frecvența istorică |

Aceste medii nu includ transferul HTTP, coada browserului, TLS, gateway-ul și randarea.

### 3.3 Ce arată logurile HTTP din ultimele 24 de ore

| Endpoint | Request-uri | Medie origine | p50 | p95 |
|---|---:|---:|---:|---:|
| `/rest/v1/devize` | 2.704 | 187,1 ms | 130 ms | 635,8 ms |
| `/rest/v1/constatari` | 1.702 | 190,4 ms | 129 ms | 645,7 ms |
| `/rest/v1/deviz_final_header` | 890 | 184,4 ms | 127 ms | 619,6 ms |
| `/rest/v1/admin_announcements` | 887 | 193,5 ms | 139 ms | 630,9 ms |
| `/rest/v1/generator_logs` | 844 | 201,6 ms | 144 ms | 653,5 ms |
| `/rest/v1/stoc_view_curent` | 842 | 204,9 ms | 148 ms | 650,8 ms |
| `/rest/v1/evidenta_awb` | 847 | 194,9 ms | 136 ms | 643,2 ms |
| `/rest/v1/contracte` | 847 | 197,7 ms | 137 ms | 655,1 ms |
| `/rest/v1/plati_manager` | 844 | 199,0 ms | 141 ms | 659,3 ms |
| `/rest/v1/detailing` | 844 | 197,1 ms | 134 ms | 651,5 ms |
| `/auth/v1/user` | 845 | 64,6 ms | 43 ms | 219,8 ms |
| `/rest/v1/auth_profiles` | 698 | 60,9 ms | 35 ms | 212,3 ms |

Pentru refererul dashboardului de producție, `generator_logs` a fost cerut de 846 ori între 05:18 și 16:31 în aceeași zi. Acest lucru este compatibil cu un dashboard lăsat deschis și pollingul din cod. `devize` a avut 2.727 cereri pentru același referer, deoarece este folosit atât de badge-uri, cât și de verificarea de conectivitate.

Un eșantion recent arată și costul duplicării profilului: `/auth/v1/user` a avut 381 ms timp de origine, urmat de `auth_profiles?select=rol_id` cu 514 ms. Acesta este un eșantion, nu o medie garantată, dar demonstrează că duplicarea poate fi vizibilă pe un request mai lent.

## 4. Harta de încărcare a `index.html`

### 4.1 Resurse și cod executat înainte de inițializarea aplicației

`index.html` are aproximativ 107 KB și 2.593 linii. În `<head>` sunt încărcate sincron:

- Tailwind Play CDN: `https://cdn.tailwindcss.com`;
- Supabase JS v2 de pe jsDelivr, fără versiune minoră fixată;
- `js/config.js`;
- Google Fonts pentru Inter și JetBrains Mono;
- Lucide de pe `unpkg.com/lucide@latest`.

Efect confirmat din structură: pornirea depinde de mai multe domenii CDN, iar scripturile nu folosesc `defer`. Efectul exact pe CPU/rețea nu a fost măsurat în browser; impactul este deci „probabil”, nu cuantificat. Tailwind Play compilează stilurile în browser și este o sursă plauzibilă de muncă pe firul principal.

### 4.2 Secvența reală de pornire

> **Status actual: `DEPLOYED / VALIDAT ÎN PRODUCȚIE` la 2026-10-13.** Dashboardul principal a fost testat după deploy. Secvența de mai jos descrie baseline-ul auditului. Apelul inițial redundant `loadAllBadges()` și apelul separat `loadAdminAnnouncement()` nu mai există; încărcarea unică pornește după stabilirea profilului și permisiunilor. Pollingul la 60 de secunde, Realtime și `refreshDashboard()` au rămas active. Vezi `15_OPTIMIZARI_IMPLEMENTATE.md`.

Ordinea confirmată din cod este:

1. se parsează HTML-ul și se execută scripturile CDN/inline;
2. scriptul mare inline creează încă un client Supabase `sb`, separat de `supabaseClient` din `config.js`;
3. înainte de `DOMContentLoaded`, blocul `INIT` apelează imediat:
   - `renderAll()`;
   - `loadAllBadges()` fără `await`;
   - `updateConnectionStatus()`;
   - creează timer-ele și canalul Realtime;
4. la `DOMContentLoaded`, `loadDashboard()`:
   - citește sesiunea cu `auth.getSession()`;
   - citește `auth_profiles` și relația `auth_roles` într-un SELECT;
   - construiește `window.USER_DATA`;
   - redirecționează Managerul dacă este cazul;
   - rulează din nou `renderAll()`;
   - așteaptă `loadAdminAnnouncement()`;
   - așteaptă încă o dată `loadAllBadges()`;
   - aplică permisiunile abia după toate badge-urile;
5. `session-timeout.js` pornește separat, validează cu `auth.getUser()` și citește încă o dată `auth_profiles.rol_id`; evenimentele Auth pot declanșa rezolvări suplimentare.

### 4.3 Request-urile badge-urilor

Un singur `loadAllBadges()` produce 15 request-uri REST:

| # | Funcție | Tabel/view | Ce citește |
|---:|---|---|---|
| 1 | `loadAdminAnnouncement` | `admin_announcements` | `select *`, activ, limit 1 |
| 2 | `loadGeneratorBadge` | `generator_logs` | toate coloanele și toate rândurile, ordonate descrescător |
| 3 | `loadConsumabileBadge` | `stoc_view_curent` | toate coloanele și toate produsele |
| 4 | `loadAvansBadge` | `evidente_avansuri_plati` | suma și data, filtrate pentru azi |
| 5 | `loadCereriPlataBadge` | `plati_manager` | count exact pentru `neplatit` |
| 6 | `loadAwbBadge` | `evidenta_awb` | preț/status/arhivare pentru tranzit |
| 7 | `loadUltimulDeviz` | `devize` | ultimul `id_deviz` |
| 8 | `loadContracteBadge` | `contracte` | count exact cu `ILIKE '%incomplet%'` |
| 9 | `loadDezmembrariBadge` | `dezmembrari_items` | count exact pentru `draft` |
| 10 | `loadTotalDevize` | `devize` | count exact total |
| 11 | `loadMasiniBadge` | `flota_auto` | count exact total |
| 12 | `loadDetailingBadge` | `detailing` | toate programările și statusurile; întârzierea este calculată în browser |
| 13 | `loadUltimulDevizFinal` | `deviz_final_header` | ultimul ID |
| 14–15 | `loadConstatariBadges` | `constatari` | două count-uri separate, în paralel, pentru două statusuri |

Funcțiile sunt puse într-un `Promise.all`, deci rulează în paralel în interiorul unui val. Problema nu este că badge-urile sunt secvențiale, ci că întregul val este duplicat la pornire și se repetă integral periodic.

### 4.4 Numărul de request-uri la pornire

> **Status actual: `DEPLOYED / VALIDAT ÎN PRODUCȚIE` la 2026-10-13 pentru duplicarea inițială.** Dashboardul principal a fost testat după deploy. Numărătoarea următoare este baseline-ul anterior modificării. Implementarea a eliminat citirea duplicată `admin_announcements` și al doilea val redundant de badge-uri. Testul Network consemnat anterior a măsurat 52 de request-uri în producție față de 40 în copia optimizată, cu comportamentul funcțional păstrat. Timpii absoluți PWA/producție versus Five Server local nu au fost folosiți ca benchmark direct, deoarece mediile diferă. Vezi `15_OPTIMIZARI_IMPLEMENTATE.md`.

În scenariul normal, cu toate apelurile executate și o singură rezolvare inițială din `session-timeout.js`, codul poate lansa:

- 15 request-uri din primul `loadAllBadges()`;
- 1 request `devize` din verificarea inițială a conexiunii;
- 1 request profil din `loadDashboard()`;
- 1 request separat pentru anunț;
- 15 request-uri din al doilea `loadAllBadges()`;
- 1 request `auth_profiles.rol_id` din timeout;
- 1 request Auth `/auth/v1/user` din timeout.

Rezultatul este aproximativ 34 request-uri REST plus un request Auth la prima deschidere. `getSession()` este de regulă rezolvat local de client și nu trebuie considerat automat request de rețea.

Acesta este un număr derivat din cod, nu o captură HAR. Evenimentele Auth pot modifica numărul exact.

### 4.5 De ce badge-urile apar cu întârziere

Cauzele confirmate, în ordinea importanței:

1. UI-ul este randat imediat cu valori placeholder, iar badge-urile sunt completate asincron ulterior.
2. Același val de 15 request-uri pornește de două ori și poate produce răspunsuri/randări concurente.
3. După profil, `loadDashboard()` așteaptă încă un request separat pentru anunț înainte de al doilea val de badge-uri, deși anunțul se află și în `loadAllBadges()`.
4. Fiecare val așteaptă cel mai lent dintre cele 15 request-uri înainte de `rebuildAlerts()` și `renderAll()` final. Logurile arată p95 de aproximativ 620–659 ms pentru endpointurile principale.
5. `applyPermissions()` rulează abia după badge-uri. Astfel, aplicația cere date și pentru module care vor fi ascunse ulterior.
6. resursele CDN sincronizate și Tailwind runtime pot amâna momentul în care pornește/termină inițializarea; impactul exact necesită profilare în browser.
7. `renderAll()` și `lucide.createIcons()` sunt repetate; costul DOM nu a fost măsurat, dar este muncă redundantă confirmată.

Cea mai mare diferență vizibilă ar veni dintr-o singură inițializare, filtrată după permisiuni, cu un singur payload agregat pentru badge-uri sau cel puțin un singur val de request-uri.

### 4.6 Polling, Realtime și căutare

> **Status actual pentru căutarea globală: `DEPLOYED / VALIDAT ÎN PRODUCȚIE` la 2026-10-13.** Căutarea globală a fost testată după deploy. Lista de mai jos păstrează baseline-ul auditului. Implementarea folosește debounce de 350 ms, invalidează imediat generațiile vechi și reutilizează rezultatele la refocus pe același termen. În testul cu `ct57apo`, varianta optimizată nu a relansat batch-ul global la refocus, în timp ce producția a lansat din nou cele șapte request-uri; rezultatele au rămas corecte. Vezi `15_OPTIMIZARI_IMPLEMENTATE.md`.

- badge-urile: 15 request-uri la fiecare 60 secunde;
- verificarea conexiunii: 1 request `devize` la fiecare 30 secunde;
- total stabil: aproximativ 17 request-uri REST/minut/tab, înainte de căutări;
- Realtime: un canal cu 13 surse declarate; orice eveniment ar chema din nou toate cele 15 request-uri;
- publicația `supabase_realtime`: zero tabele la momentul auditului, deci callback-urile `postgres_changes` nu oferă actualizarea intenționată;
- căutarea globală: după debounce de 280 ms, poate lansa până la 7 query-uri în paralel; nu există prag minim de caractere și request-urile vechi nu sunt anulate, doar rezultatul lor nu mai este randat;
- căutările folosesc frecvent `ILIKE '%text%'`, pentru care indecșii B-tree obișnuiți nu rezolvă căutarea la volum mare.

## 5. Manager Dashboard

> **Context istoric, reconciliat la 22.10.2026:** harta de mai jos descrie Managerul auditat în 12.10, nu Managerul integrat ulterior în LAB. Citirile suprapuse și încărcarea istoricului complet nu se transferă automat în lista actuală de probleme; vezi [15, §4.1](15_OPTIMIZARI_IMPLEMENTATE.md). Validările din 13.10 nu confirmă publicarea versiunii LAB actuale. Starea RLS are reperul separat în [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

### 5.1 Harta request-urilor la deschidere

> **Status actual: `DEPLOYED / VALIDAT ÎN PRODUCȚIE` la 2026-10-13 pentru paralelizarea financiară.** Manager Dashboard a fost testat după deploy. Tabelul de mai jos păstrează baseline-ul auditului. Testul manual în Network confirmă că cele cinci query-uri financiare pornesc aproximativ simultan prin `Promise.all`; datele apar vizibil mai rapid, iar KPI-urile și comportamentul vizual au rămas corecte. Sursele, filtrele, graficele și tratarea erorilor au rămas neschimbate. Celelalte probleme Manager descrise în această secțiune rămân deschise. Vezi `15_OPTIMIZARI_IMPLEMENTATE.md`.

După `getSession()`, pagina face următoarele SELECT-uri:

| Etapă | Query-uri | Paralelism |
|---|---:|---|
| verificare acces | `auth_profiles` | 1 query după sesiune |
| `initFinanciar()` | `deviz_final_header`, `evidente_avansuri_plati`, `evidenta_awb`, `detailing`, `stoc_view_curent` | 5 query-uri strict secvențiale |
| `initPerformanta()` | două query-uri în `fetchDateDepartamente`, unul `generator_logs`, unul `constatari` pentru mașini, două pentru așteptare piese | 6 query-uri; patru ramuri pornesc în paralel, dar unele ramuri au dependențe interne |
| `initPlati()` | încă un `getSession()`, apoi `plati_manager` | după terminarea completă a etapelor anterioare |

Totalul este 13 SELECT-uri, incluzând profilul, plus două apeluri `getSession()`. Cele 12 SELECT-uri de business sunt încărcate pentru toate cele trei taburi, chiar dacă utilizatorul vede inițial doar primul tab.

### 5.2 Agregări efectuate în browser

Manager descarcă rânduri și calculează local:

- totalul devizelor finale pentru luna curentă, luna trecută și ultimele patru luni;
- numărul devizelor lunii curente;
- avansurile de azi și sumele pe ultimele patru luni;
- valoarea AWB livrate/retur și lista celor în tranzit;
- valoarea Detailing finalizat și seria lunară;
- numărul de intrări pe departamente;
- durata așteptării pentru piese;
- mașinile în lucru și ordinea lor;
- orele, pornirile și motorina Generator;
- ordonarea plăților.

Aceste calcule sunt ieftine la volumul actual. Problema actuală este secvențializarea celor cinci request-uri financiare; problema de scalare este transferul întregului istoric.

### 5.3 Citiri duplicate sau suprapuse

- `detailing` este citit integral cu 9 coloane în financiar și din nou cu `id, data_programare` pentru graficul departamente;
- `constatari` este citit de trei ori: intrări recente, așteptare piese și toate elementele nearhivate;
- `constatari_asteptare_piese` este cerut într-un al doilea pas după lista de constatări în așteptare;
- sesiunea este citită la verificarea accesului și din nou în `initPlati()`;
- toate datele sunt ținute în memorie pentru căutarea locală, motiv pentru care o simplă eliminare a citirilor trebuie verificată față de funcția de căutare.

### 5.4 Transfer inutil și impact la scalare

| Sursă | Situația curentă | Impact actual | Impact la volum |
|---|---|---|---|
| `deviz_final_header` | toate devizele, fără filtru de dată | mic–mediu la 182 rânduri | mare; KPI-ul are nevoie în principal de ultimele 4 luni |
| `evidente_avansuri_plati` | toate plățile | mic la 49 rânduri | mare |
| `evidenta_awb` | toate AWB nearhivate și multe coloane | mic la 59 rânduri | mediu–mare |
| `detailing` | toate fișele și 9 coloane | mic la 1 rând | mare |
| `generator_logs` | toate logurile | mic la 72 rânduri | mediu–mare |
| `constatari` | trei seturi suprapuse | mediu ca număr de request-uri | mare ca trafic și CPU client |
| `plati_manager` | toate plățile și sortare repetată în browser | mic la 3 rânduri | mediu |

### 5.5 View-uri/RPC read-only posibile

Fără a modifica rezultatul KPI, arhitectura poate evolua spre:

- un RPC read-only `manager_financial_summary` care întoarce sumele și numerele pe ultimele patru luni;
- un RPC/view read-only pentru număr intrări pe departamente;
- un query/RPC pentru așteptări active care face join între `constatari` și intervalul deschis;
- un sumar Generator pe luna curentă plus sesiunea activă;
- liste separate, paginate, pentru detaliile vizibile din tabele.

Acestea sunt recomandări structurale, nu obiecte confirmate ca existente și nu au fost create. Semantica datelor text/date și regulile KPI trebuie înghețate prin teste înainte de mutarea agregărilor în SQL.

## 6. Pagini și module importante

> **Actualizare pentru Constatări — status `DEPLOYED / VALIDAT ÎN PRODUCȚIE` la 2026-10-13:** Constatări v2 a fost testat după deploy. Testul comparabil anterior prin Five Server a măsurat 19 request-uri și 18,8 kB în ambele variante, cu Finish de aproximativ 922 ms pentru varianta optimizată și 1,02 s pentru producție. După query-ul principal, cele patru citiri pornesc aproximativ simultan prin `Promise.allSettled`; diferența observată a fost de aproximativ 100 ms și avantajul se repetă la refreshurile periodice. Pollingul la 15 secunde și protecția modificărilor nesalvate au rămas funcționale. Rândul Constatări din tabel descrie baseline-ul auditului. Vezi `15_OPTIMIZARI_IMPLEMENTATE.md`.

| Modul | Request-uri la intrare | Secvențial/paralel | Probleme confirmate | Impact acum / la scalare |
|---|---|---|---|---|
| Login | lookup poreclă opțional, sign-in, audit INSERT, profil rol | secvențial | auditul este așteptat înaintea profilului/rutării; loginul cu poreclă adaugă un round-trip | mediu / mediu |
| Dashboard `index.html` | aprox. 34 REST + 1 Auth în scenariul normal descris | două valuri mari paralele, dar duplicate | duplicate, permisiuni aplicate târziu, polling agresiv | mare / mare |
| Manager Dashboard | 13 SELECT-uri + sesiuni | financiar secvențial; taburi secvențiale | încărcare eager, agregări client, seturi suprapuse | mare / mare |
| Constatări v2 | profil acces, `service_personal`, `constatari`, departamente, repartizări, așteptări, audit selectat | query-ul principal urmat de 4 query-uri secvențiale; personalul pornește separat | recitire la 15 s a întregului set și a relațiilor; multe coloane | mare / foarte mare |
| Clienți & Notificări | profil acces; 4 probe de schemă; apoi 6 citiri complete/paralele | două valuri | probe de coloană la fiecare intrare; toate tabelele citite integral; paginare de 1.000 | mediu / foarte mare |
| Dezmembrări desktop | profil, articole, poze articol selectat, apoi thumbnail-uri | inițial secvențial; coadă concurență 3 | N+1: până la o citire metadate + un apel Edge pentru fiecare dintre cele 81 articole vizibile | mare / foarte mare |
| Comenzi piese SH | profil acces, toate comenzile, apoi toate legăturile non-null din linii deviz | secvențial | două liste complete; `select *` pe comenzi | mediu / mare |
| Consumabile | `stoc_view_curent` și `stoc_produse` | paralele | informația de produs se suprapune; view `select *`; cache local poate afișa temporar date vechi | mediu / mare |
| Avansuri | avansuri active și toate plățile | două query-uri paralele | `select *` pe avansuri; toate plățile sunt descărcate | mic–mediu / mare |
| Evidență AWB | toate AWB | un query | filtrare/căutare doar în browser; Realtime inactiv | mic / mare |
| Detailing | toate fișele | un query | fără paginare; multe biblioteci CDN la start | mic / mare |
| Generator | health check, apoi toate logurile | secvențial | pollingul la 5 s este cerință business pentru sincronizare multi-utilizator; Realtime este momentan inactiv | cost acceptat și de monitorizat / mare la scalare |
| Flotă | toate mașinile | un query | `select *`; Realtime inactiv | mic / mediu |
| Bază VIN | toate rândurile, 3 coloane | un query | Realtime inactiv; volum curent mic | mic / mediu |
| Telefoane clienți | toate rândurile și coloanele | un query | `select *`; Realtime inactiv | mic / mediu–mare |
| Căutare devize | lista completă a tabului activ | un query per tab | filtrarea se face în browser; fără paginare | mic / mare |
| Deviz estimativ | ultimul ID; dacă URL are ID, și devizul cerut | în paralel implicit la intrare cu ID | două citiri la deschidere cu ID; timeoutul recitește rolul | mic / mediu |
| Deviz final | următorul ID sau antet+linii pentru ID | în general dependent | fișier HTML ~130 KB; timeoutul recitește rolul | mediu / mediu |
| Contracte | toate contractele și datele/URL-urile lor | un query | fără paginare; imaginile sunt lazy doar după deschiderea galeriei | mic / mare |
| Admin | profil și doar prima secțiune permisă; alte secțiuni la click | predominant lazy | fișier HTML ~332 KB; unele secțiuni lansează 2–3 query-uri; căutarea stoc recitește 3 liste | mediu / mare |

## 7. Polling și Realtime

| Pagină | Polling | Cost estimat din cod | Realtime | Stare confirmată |
|---|---|---|---|---|
| Dashboard | badge-uri 60 s; health 30 s | ~17 REST/minut/tab | 13 tabele/view declarate într-un canal | publicația nu conține tabele |
| Constatări | refresh 15 s; ceas local 60 s | ~5 SELECT-uri/tick, ~20/minut/tab | nu este folosit pentru lista principală | pollingul este singurul refresh automat |
| Generator | health 5 s; verificare schimbare zi 30 s | 12 health SELECT/minut, cost acceptat pentru sincronizare rapidă | canal pe `generator_logs` | pollingul rămâne obligatoriu cât timp Realtime nu oferă aceeași sincronizare rapidă și fiabilă |
| AWB | nu | 0 după încărcare | canal pe `evidenta_awb` | inactiv din cauza publicației |
| Telefoane | nu | 0 după încărcare | canal pe `telefoane_clienti` | inactiv din cauza publicației |
| Flotă | nu | 0 după încărcare | canal pe `flota_auto` | inactiv din cauza publicației |
| Bază VIN | nu | 0 după încărcare | canal pe `baza_vin` | inactiv din cauza publicației |
| Manager | doar ceas și actualizare text Generator, fără fetch | 0 refresh DB automat | nu | datele devin stale până la reload |

Activarea Realtime fără eliminarea/coordonarea pollingului ar dubla unele reîncărcări. Mai grav, pe dashboard fiecare eveniment cheamă întregul `loadAllBadges()`, nu doar badge-ul afectat.

## 8. Query-uri duplicate și citiri excesive

### 8.1 Duplicate cu impact real acum

- cele două apeluri `loadAllBadges()` la pornirea dashboardului;
- trei citiri inițiale ale anunțului: unul în primul val, unul separat, unul în al doilea val;
- profilul/rolul citit de pagina curentă și din nou de `session-timeout.js`;
- Manager: `detailing` de două ori și `constatari` de trei ori;
- Consumabile: datele de produs apar atât în view, cât și în `stoc_produse`;
- Admin/alte pagini: secțiunea își validează profilul, iar timeoutul îl validează din nou.

### 8.2 Citiri mai mari decât este necesar

- `select('*')` în badge-urile Generator, Stoc și anunț;
- `select('*', {count:'exact', head:true})` folosit pentru count; corpul nu este returnat datorită `head`, dar `*` nu comunică intenția minimă;
- liste complete în Manager, C&N, Constatări, AWB, Flotă, Contracte și Telefoane;
- audit Admin: 500 rânduri și `select('*')`, apoi filtrele sunt aplicate în browser;
- căutarea globală pornește până la 7 interogări pentru orice text nevid;
- Dezmembrări cere separat thumbnail-ul fiecărui articol.

## 9. Indecși: ce este justificat și ce nu

### 9.1 Verdict pentru volumul actual

Nu există dovadă că adăugarea în masă a celor 22 de indecși de FK sugerați de Advisor ar reduce vizibil timpul de pornire. Tabelele dominante pentru badge-uri au zeci/sute de rânduri, iar SQL-ul este în general sub 5 ms. Costul observat este în round-trip și frecvență.

Prin urmare, indecșii de mai jos sunt candidați de validat, nu recomandări de aplicat automat.

### 9.2 Candidați corelați cu query-uri reale

| Candidat | Query real care îl justifică | Situație actuală | Verdict |
|---|---|---|---|
| `audit_logs(created_at DESC)` | Admin: order desc, limit 500 | 2.862 rânduri; 23.442 seq scans și 27,45 mil. tuple citite secvențial | cel mai plauzibil candidat cu efect actual; cere `EXPLAIN`/test pe branch |
| `audit_logs(modul, entitate, entitate_id, created_at DESC)` | Constatări: audit pentru fișa selectată, order desc, limit 80 | acea citire se repetă la polling | candidat puternic dacă auditul pe fișă rămâne în refresh |
| `stoc_miscari(produs_id)` | join-ul din `stoc_view_curent` | lipsește; view-ul este unul dintre cele mai frecvente query-uri | justificat pentru scalare; efect mic acum la 259 rânduri |
| `constatari(status)` sau variantă parțială | două count-uri dashboard + Manager așteptare piese | doar PK; 43 rânduri | numai pentru creștere; nu quick win actual |
| `constatari(created_at DESC)` | listă Constatări și Manager | doar PK | pentru scalare/paginare |
| `constatari(vehicle_id, created_at DESC)` | C&N încarcă istoricul vehiculului | `vehicle_id` fără index | justificat de query real și FK |
| `constatari_asteptare_piese(constatare_id, sfarsit, inceput DESC)` | Manager și Constatări filtrează după constatare/interval deschis | doar PK | justificat la volum |
| `evidente_avansuri(vehicle_id, data_crearii DESC)` | C&N încarcă avansurile vehiculului | FK fără index | justificat la volum |
| `evidente_avansuri_plati(avans_id, data_platii DESC)` | C&N și pagina Avansuri grupează plățile | FK fără index | justificat la volum |
| `evidenta_awb(stare, is_archived)` | badge și Manager filtrează în tranzit/ne-arhivat | doar PK | efect mic acum; validare la volum |
| `plati_manager(status, data_crearii DESC)` | badge count și liste ordonate | doar PK, 3 rânduri | ipoteză de scalare, nu prioritate |
| `detailing(status, data_programare)` | badge întârziat și liste/Manager | doar PK, 1 rând | prematur acum |

`deviz_final_linii.id_deviz_final` este deja acoperit ca primă coloană de indexul unic `(id_deviz_final, comanda_piesa_sh_id)` pentru rândurile cu piesă SH, dar rândurile cu `comanda_piesa_sh_id IS NULL` nu sunt acoperite de acel index parțial. Necesitatea unui index separat trebuie validată pe distribuția reală și pe planurile de execuție, nu dedusă doar din FK.

### 9.3 Advisor Supabase

Advisor-ul raportează:

- 22 chei străine fără index dedicat;
- 25 politici cu `auth.*` reevaluat pe fiecare rând (`auth_rls_initplan`);
- 15 indecși nefolosiți;
- o situație cu politici permisive multiple pe `dezmembrari_photos` INSERT.

Acestea sunt semnale pentru testare. Politicile RLS cu funcții neîncapsulate pot deveni costisitoare pe tabele mari, dar nu explică badge-urile lente de azi: tabelele sunt mici, iar timpul SQL observat este redus. Orice schimbare RLS aparține planului separat de acces și trebuie testată fără a altera permisiunile.

## 10. Registrul problemelor

Scală: impact perceput = efect asupra utilizatorului acum; impact la scalare = efect probabil când volumele/utilizatorii cresc; complexitate = efortul remedierii; risc = probabilitatea de regresie funcțională.

| ID | Problemă | Impact perceput | Impact la scalare | Complexitate | Risc | Dovadă din cod/date |
|---|---|---|---|---|---|---|
| P01 | două valuri de badge-uri la pornire | Mare | Mare | Mică | Mic | `index.html:81-82`, `index.html:2403-2404`; 15 request-uri/val |
| P02 | anunțul este citit de trei ori la start | Mediu | Mediu | Mică | Mic | `loadAdminAnnouncement()` separat și inclus în ambele valuri |
| P03 | polling dashboard ~17 REST/minut/tab | Mare | Mare | Mică–Medie | Mediu | intervale 60 s și 30 s; 846 cereri Generator într-o fereastră de ~11 h |
| P04 | permisiunile se aplică după fetch | Mediu | Mare | Mică–Medie | Mediu | `applyPermissions()` după `await loadAllBadges()` |
| P05 | profil/sesiune duplicate prin timeout | Mediu | Mare | Medie | Mediu | paginile citesc profilul; `session-timeout.js` face `getUser()` + `auth_profiles` |
| P06 | Manager: 5 query-uri financiare secvențiale | Mare | Mare | Mică | Mic–Mediu | `manager.js:240-246` |
| P07 | Manager încarcă toate taburile înainte de a activa căutarea | Mare | Mare | Medie | Mediu | `manager.js:1015-1018` |
| P08 | Manager agregă istoricul complet în browser | Mediu | Foarte mare | Mare | Mediu–Ridicat | SELECT-uri fără interval pe antet, plăți, AWB, Detailing, Generator |
| P09 | Constatări face 5 citiri la fiecare 15 s | Mare | Foarte mare | Medie | Ridicat | `loadCars()` + 3 relații + audit; timer `15000` |
| P10 | relațiile Constatări sunt încărcate secvențial | Mediu | Mare | Mică–Medie | Mediu | `loadDepartmentRows`, apoi repartizări, apoi așteptări, apoi audit |
| P12 | Realtime declarat, publicație goală | Mic ca latență, mediu ca predictibilitate | Mare | Medie | Ridicat | zero tabele în `pg_publication_tables` pentru `supabase_realtime` |
| P13 | căutarea globală pornește până la 7 query-uri, fără anulare | Mediu la tastare | Mare | Mică–Medie | Mic | debounce 280 ms + `Promise.allSettled`; doar request-id pentru randare |
| P14 | C&N face 4 probe de schemă și 6 citiri complete | Mediu | Foarte mare | Medie–Mare | Mediu | `detectOptionalSchemaColumns()` urmat de `Promise.all` cu 6 surse |
| P15 | Dezmembrări are N+1 thumbnail | Mare | Foarte mare | Medie–Mare | Mediu | toate cele 81 articole vizibile intră în coadă; lookup + Edge per articol |
| P16 | `select *` și liste fără paginare | Mic–Mediu | Foarte mare | Medie | Mediu | multiple module; tabelul Admin are 332 KB HTML și audit până la 500 rânduri |
| P17 | CDN-uri sincronizate și Tailwind runtime | Mediu, probabil | Mediu | Medie | Mediu | scripturi în `<head>`, versiuni nefixate; necesită măsurare browser |
| P18 | stocul este agregat repetat prin view | Mediu | Mare | Medie | Mediu | view join+GROUP BY; 17k+ apeluri în pg_stat_statements; fără index `produs_id` |
| P19 | RLS init-plan neoptimizat | Mic acum | Mare | Medie | Ridicat | 25 findings Advisor; trebuie coordonat cu auditul de acces |
| P20 | lipsa unui contract comun de date/profile cache | Mediu | Mare | Mare | Mediu | clienți Supabase și verificări profil duplicate între pagini |

### 10.1 Starea curentă a elementelor remediate sau reinterpretate

| ID / comportament | Status actual | Observație |
|---|---|---|
| P01 | `DEPLOYED / VALIDAT ÎN PRODUCȚIE` | al doilea val inițial `loadAllBadges()` a fost eliminat |
| P02 | `DEPLOYED / VALIDAT ÎN PRODUCȚIE` | citirea separată `loadAdminAnnouncement()` a fost eliminată; anunțul rămâne în încărcarea comună |
| P04 | `DESCHIS` parțial | profilul și permisiunile sunt stabilite înaintea încărcării unice, dar filtrarea loaderelor după permisiuni nu a fost implementată |
| P06 | `DEPLOYED / VALIDAT ÎN PRODUCȚIE` | cele cinci query-uri financiare independente rulează prin `Promise.all` |
| P10 | `DEPLOYED / VALIDAT ÎN PRODUCȚIE` | testul comparabil prin Five Server confirmă pornirea aproximativ simultană a celor patru citiri și păstrarea pollingului/protecțiilor |
| P13 | `DEPLOYED / VALIDAT ÎN PRODUCȚIE` | testul cu `ct57apo` confirmă reutilizarea rezultatelor la refocus, fără relansarea celor șapte request-uri globale |
| polling Generator la 5 secunde | `PĂSTRAT INTENȚIONAT` | cerință business de sincronizare rapidă multi-utilizator; nu este o problemă deschisă |

Detaliile modificărilor și ale testării sunt centralizate în `15_OPTIMIZARI_IMPLEMENTATE.md`. Toate celelalte poziții din registru rămân `DESCHIS` dacă nu sunt marcate explicit altfel.

## 11. Top 10 probleme identificate la auditul inițial

Lista de mai jos este păstrată ca istoric. Punctele 1, 4 și 9 au fost remediate și validate la 2026-10-13; secvențializarea relațiilor Constatări a fost de asemenea remediată și validată, fără reducerea numărului de request-uri. Pollingul Constatări și celelalte costuri enumerate rămân deschise. Vezi `15_OPTIMIZARI_IMPLEMENTATE.md` pentru statusul curent.

1. Inițializarea duplicată a celor 15 request-uri de badge în `index.html`.
2. Pollingul dashboardului: aproximativ 17 request-uri REST/minut/tab.
3. Pollingul Constatări la 15 secunde, cu aproximativ 5 SELECT-uri per rundă.
4. Cele cinci query-uri financiare strict secvențiale din Manager Dashboard.
5. Încărcarea eager a tuturor taburilor Manager înainte ca pagina să fie complet utilizabilă.
6. N+1-ul pentru thumbnail-urile Dezmembrări.
7. Revalidarea duplicată `getUser()` + `auth_profiles` prin `session-timeout.js`.
8. Citirea completă și agregarea în browser în Manager/C&N/Constatări.
9. Căutarea globală cu până la 7 request-uri pentru fiecare termen debounced și fără anularea cererilor vechi.
10. Clienți & Notificări execută patru probe de schemă înaintea celor șase citiri complete.

Pollingul Generatorului la 5 secunde nu mai este clasificat drept problemă de performanță. El este o cerință operațională pentru ca schimbările Start/Stop făcute de un utilizator să devină vizibile rapid celorlalți. O înlocuire viitoare cu Supabase Realtime este acceptabilă numai dacă păstrează aceeași sincronizare rapidă și fiabilă.

## 12. Necunoscute și ipoteze

- Nu există măsurători de First Contentful Paint, Largest Contentful Paint, main-thread blocking sau dimensiunea transferată efectiv de CDN-uri.
- Nu este cunoscut numărul maxim de utilizatori/taburi simultane; costul pollingului crește liniar cu acestea.
- KPI-urile Manager nu au un contract business formal; mutarea în SQL trebuie să reproducă exact interpretarea curentă a datelor text și a fusului orar.
- Nu este confirmat dacă toate cele 81 articole Dezmembrări apar simultan pentru fiecare rol sau dacă utilizatorii filtrează imediat lista.
- `pg_stat_statements` agregă variante de query din mai multe versiuni ale aplicației începând din mai 2026; frecvențele istorice nu descriu exclusiv versiunea curentă.
- Logurile HTTP analizate acoperă ultimele 24 de ore și pot include mai multe taburi/sesiuni; ele confirmă frecvența, nu identifică un singur utilizator.
- Candidații de index nu au fost testați cu `EXPLAIN (ANALYZE, BUFFERS)` într-un branch non-producție. Ei rămân propuneri condiționate.

## 13. Referințe tehnice Supabase

- Documentația oficială confirmă că un tabel trebuie adăugat în publicația `supabase_realtime` pentru ca `postgres_changes` să emită evenimente: <https://supabase.com/docs/guides/realtime/postgres-changes>.
- Recomandările oficiale RLS cer indexarea coloanelor relevante și folosirea `(select auth.uid())`/funcțiilor echivalente numai după măsurare și fără schimbarea semanticii: <https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv>.

