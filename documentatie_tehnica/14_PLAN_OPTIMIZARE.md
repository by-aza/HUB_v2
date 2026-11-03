# HUB AUTO v2 — plan de optimizare a performanței

## 1. Principii

> **Reconciliere 22.10.2026:** recomandările sunt istorice, nu sarcini obligatorii. Managerul și căutarea au fost înlocuite ulterior în LAB; [15, §4.1](15_OPTIMIZARI_IMPLEMENTATE.md) descrie sursele paginate/filtrate și anularea căutărilor. Statusurile de producție din 13.10 aparțin versiunii de atunci. Pentru RLS și direcția de simplitate prevalează [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

În forma sa inițială, acest document a fost redactat ca plan, nu ca implementare. La redactarea lui nu au fost modificate aplicația, baza de date, indecșii, RLS, Realtime sau configurația Supabase. Implementările ulterioare sunt marcate explicit mai jos și centralizate în registrul dedicat.

> **Actualizare 2026-10-13:** documentul păstrează recomandările inițiale și ordinea lor istorică. Q1, Q4, Q6 și Q7 sunt `DEPLOYED / VALIDAT ÎN PRODUCȚIE`, după testarea post-deploy a Dashboardului principal, căutării globale, Manager Dashboard și Constatări v2. Q5 este `PĂSTRAT INTENȚIONAT`. Registrul canonic al stării curente este `15_OPTIMIZARI_IMPLEMENTATE.md`. Restul recomandărilor rămân `DESCHIS` dacă nu se precizează altfel.

Ordinea recomandată este:

1. se elimină munca duplicată și pollingul inutil;
2. se paralelizează request-urile independente și se încarcă lazy taburile secundare;
3. se reduc rândurile și coloanele transferate;
4. numai după măsurare se introduc agregări server-side sau indecși;
5. Realtime și pollingul se proiectează ca un singur mecanism coerent, nu se suprapun accidental.

Scală beneficiu probabil:

- latență inițială: reducerea timpului până la date utile;
- request-uri: reducere per deschidere sau per minut;
- trafic DB: reducerea execuțiilor/rândurilor/coloanelor;
- mentenanță: `↓` simplifică, `=` neutru, `↑` adaugă complexitate.

## 2. QUICK WINS — schimbări mici și sigure

### Q1. O singură inițializare a badge-urilor în `index.html`

**Status actual: `DEPLOYED / VALIDAT ÎN PRODUCȚIE` (2026-10-13).** După deploy, Dashboardul principal a fost testat în producție. A fost eliminat al doilea val inițial și apelul separat al anunțului; citirea duplicată `admin_announcements` nu mai apare. Badge-urile pornesc o singură dată după profil și permisiuni; pollingul la 60 de secunde, Realtime și `refreshDashboard()` au rămas active. Testul Network anterior a indicat 52 request-uri în producție față de 40 în copia optimizată, cu comportamentul funcțional corect. Timpii absoluți PWA/producție și Five Server local nu sunt comparați direct, deoarece mediile diferă. Vezi `15_OPTIMIZARI_IMPLEMENTATE.md`.

- Problema: `loadAllBadges()` rulează o dată direct în blocul `INIT` și încă o dată în `loadDashboard()`; anunțul este citit și separat.
- Schimbare propusă: păstrarea unui singur apel după rezolvarea profilului; eliminarea citirii separate a anunțului sau scoaterea ei din lista comună, astfel încât să existe exact un proprietar.
- Beneficiu probabil:
  - latență inițială: Mare; dispar request-uri concurente și randări duplicate;
  - request-uri: aproximativ `-16` la pornire;
  - trafic DB: aproape înjumătățirea traficului de badge la deschidere;
  - mentenanță: `↓`.
- Risc: Mic; trebuie verificat că anunțul și alertele apar după singurul val.
- Test: HAR/request counter la reload, toate badge-urile și anunțul, rol Admin și rol limitat.
- Prioritate: P0.

### Q2. Aplicarea permisiunilor înainte de query-urile badge

- Problema: toate datele sunt cerute înainte de `applyPermissions()`.
- Schimbare propusă: după citirea unică a profilului, construirea listei de loadere numai pentru modulele vizibile/permise; badge-urile comune rămân explicit comune.
- Beneficiu probabil:
  - latență inițială: Medie–Mare pentru rolurile limitate;
  - request-uri: reducere variabilă, posibil mai mult de jumătate pentru Mecanic/Electrician;
  - trafic DB: reducere proporțională;
  - mentenanță: `=` dacă mappingul permisiune → loader este centralizat.
- Risc: Mediu; unele alerte pot fi intenționat globale. Trebuie confirmată lista badge-urilor comune.
- Test: matrice roluri și comparație cu `09_MATRICE_ACCES.md`/`12_TESTE_ACCES.md`.
- Prioritate: P0.

### Q3. Refolosirea profilului deja încărcat pentru timeout/acces

- Problema: pagina citește profilul, iar `session-timeout.js` face din nou `getUser()` și `auth_profiles.rol_id`.
- Schimbare propusă: un contract comun read-only (`window.USER_DATA` sau un provider unic de profil) pe care timeoutul îl poate consuma după ce pagina l-a validat; fallback la validarea actuală doar când profilul nu există.
- Beneficiu probabil:
  - latență inițială: Mică–Medie în medie, Mare pe răspunsuri lente;
  - request-uri: `-1 REST` și, de regulă, `-1 Auth` per pagină;
  - trafic DB: mic per sesiune, mare cumulat;
  - mentenanță: `↓`, dacă există o singură sursă de adevăr.
- Risc: Mediu; nu trebuie slăbită validarea sesiunii sau comportamentul la token refresh.
- Test: login, refresh token, schimbare utilizator, logout, expirare și Admin fără timeout.
- Prioritate: P1.

### Q4. Paralelizarea celor cinci query-uri financiare Manager

**Status actual: `DEPLOYED / VALIDAT ÎN PRODUCȚIE` (2026-10-13).** După deploy, Manager Dashboard a fost testat în producție. Testul manual în Network confirmă că cele cinci citiri rulează acum aproximativ simultan prin `Promise.all`. Datele apar vizibil mai rapid, iar sursele, filtrele, KPI-urile, graficele, comportamentul vizual și tratarea erorilor au fost păstrate. Vezi `15_OPTIMIZARI_IMPLEMENTATE.md`.

- Problema: `fetchDevizeFinale`, `fetchAvansuriData`, `fetchAwbData`, `fetchDetailingData`, `fetchConsumabileData` sunt așteptate unul după altul.
- Schimbare propusă: pornire într-un singur `Promise.allSettled`, cu păstrarea tratării erorilor pe fiecare KPI.
- Beneficiu probabil:
  - latență inițială: Mare; din suma a cinci round-trip-uri în aproximativ maximul lor;
  - request-uri: neschimbat;
  - trafic DB: neschimbat;
  - mentenanță: `=`.
- Risc: Mic–Mediu; mesajele de eroare multiple trebuie controlate pentru a nu afișa cinci alerte simultan.
- Test: fiecare sursă eșuată separat și toate sursele valide; compararea exactă a KPI-urilor.
- Prioritate: P0.

### Q5. Decizie business — pollingul Generatorului la 5 secunde se păstrează

**Status actual: `PĂSTRAT INTENȚIONAT`.** Nu este un quick win restant și nu trebuie inclus în lista problemelor de remediat. Vezi `15_OPTIMIZARI_IMPLEMENTATE.md`.

- Clarificare: frecvența este intenționată deoarece mai mulți utilizatori pot opera modulul simultan, iar starea Start/Stop trebuie sincronizată în câteva secunde.
- Decizie: nu se elimină pollingul, nu se mărește intervalul și traficul aferent nu este tratat drept redundant.
- Alternativă viitoare: Supabase Realtime poate fi evaluat separat numai dacă demonstrează aceeași sincronizare rapidă și fiabilă, inclusiv reconectare și recuperarea evenimentelor ratate.
- Acțiune în planul curent: nicio modificare.

### Q6. Paralelizarea relațiilor Constatări după query-ul principal

**Status actual: `DEPLOYED / VALIDAT ÎN PRODUCȚIE` (2026-10-13).** După deploy, Constatări v2 a fost testat în producție. Testul comparabil anterior prin Five Server a măsurat 19 request-uri și 18,8 kB în ambele variante, cu Finish de aproximativ 922 ms pentru varianta optimizată și 1,02 s pentru producție. Ramurile pentru departamente, repartizări + personal, așteptarea pieselor și audit pornesc aproximativ simultan prin `Promise.allSettled`. Diferența observată a fost de aproximativ 100 ms și avantajul se repetă la refreshurile periodice; pollingul la 15 secunde și protecția modificărilor nesalvate au rămas funcționale. Vezi `15_OPTIMIZARI_IMPLEMENTATE.md`.

- Problema: departamentele, repartizările, intervalele și auditul sunt așteptate secvențial.
- Schimbare propusă: după obținerea ID-urilor, pornirea în paralel a celor trei relații și a auditului pentru selecția curentă; păstrarea protecției `loadCarsGeneration`.
- Beneficiu probabil:
  - latență inițială/refresh: Mare;
  - request-uri: neschimbat;
  - trafic DB: neschimbat;
  - mentenanță: `=`.
- Risc: Mediu; starea selectată și modificările nesalvate trebuie protejate.
- Test: editare activă, schimbare selecție, refresh concurent, rând șters între query-uri.
- Prioritate: P1.

### Q7. Debounce și anulare pentru căutarea globală

**Status actual: `DEPLOYED / VALIDAT ÎN PRODUCȚIE` (2026-10-13).** După deploy, căutarea globală a fost testată în producție. Soluția implementată păstrează căutările de orice lungime, folosește debounce de 350 ms și o generație/token pentru ignorarea sigură a răspunsurilor vechi; request-urile deja trimise nu sunt anulate. Rezultatele existente sunt reutilizate la refocus pe același termen. În testul manual cu `ct57apo`, varianta optimizată a generat numai un request de fundal după golirea Network, fără relansarea batch-ului global, iar producția a relansat toate cele șapte request-uri. Rezultatele au rămas corecte. Vezi `15_OPTIMIZARI_IMPLEMENTATE.md`.

Nota istorică: propunerea inițială de prag minim și `AbortController` de mai jos nu a fost implementată; varianta cu generație a fost aleasă pentru a păstra rezultatele existente și a evita anularea nesigură a request-urilor Supabase.

- Problema: orice text nevid poate lansa până la 7 request-uri; răspunsurile vechi nu se mai randează, dar continuă să consume rețea/DB.
- Schimbare propusă: prag minim 2–3 caractere, `AbortController` pentru batch-ul precedent și evitarea relansării la focus dacă termenul nu s-a schimbat.
- Beneficiu probabil:
  - latență percepută la căutare: Medie;
  - request-uri: reducere mare în timpul tastării;
  - trafic DB: reducere mare pentru căutări scurte;
  - mentenanță: `=`.
- Risc: Mic; trebuie păstrată căutarea după ID-uri scurte confirmate.
- Test: tastare rapidă, ștergere text, focus repetat, rezultate pe fiecare rol.
- Prioritate: P1.

### Q8. Înlocuirea `select('*')` din badge-uri cu coloanele necesare

- Problema: Generator, Stoc și anunț citesc mai multe coloane decât folosesc.
- Schimbare propusă: liste explicite de coloane; count-urile rămân `head:true`.
- Beneficiu probabil:
  - latență inițială: Mică acum;
  - request-uri: neschimbat;
  - trafic DB/rețea: Mic acum, Mediu la volum;
  - mentenanță: `↑` ușor, dar contractul de date devine clar.
- Risc: Mic; test vizual pe fiecare badge.
- Prioritate: P2.

## 3. MEDIUM — schimbări care necesită testare

### M1. Reducerea și suspendarea pollingului dashboardului

- Problema: aproximativ 17 REST/minut/tab, inclusiv în taburi posibil ascunse.
- Schimbare propusă:
  - nu rula polling când `document.visibilityState !== 'visible'`;
  - un singur scheduler, fără suprapunerea unei runde peste alta;
  - 2–5 minute pentru badge-uri necritice;
  - refresh manual și refresh la revenirea în pagină;
  - health-ul să refolosească rezultatul unui query existent.
- Beneficiu probabil:
  - latență inițială: Mică;
  - request-uri: `-60%` până la `-90%` în utilizare reală;
  - trafic DB: reducere foarte mare;
  - mentenanță: `↓` dacă există un scheduler central.
- Risc: Mediu; prospețimea badge-urilor se schimbă.
- Precondiție: stabilirea SLA-ului de prospețime pentru fiecare badge.
- Prioritate: P0.

### M2. Polling adaptiv în Constatări

- Problema: aproximativ 20 SELECT-uri/minut/tab, inclusiv când tabul este ascuns.
- Schimbare propusă:
  - suspendare în background și în timpul editării;
  - interval 45–60 s pentru lista completă;
  - refresh manual/după salvare;
  - eventual un query ușor de versiune/`updated_at` înainte de reîncărcarea completă.
- Beneficiu probabil:
  - latență în editare: Medie;
  - request-uri: `-67%` până la `-80%`;
  - trafic DB: reducere foarte mare;
  - mentenanță: `=`.
- Risc: Ridicat; Constatări este colaborativ și prospețimea are impact operațional.
- Precondiție: confirmarea frecvenței business acceptate.
- Prioritate: P0.

### M3. Încărcare lazy pe taburi în Manager

> **Propunere istorică, nu implementare cerută:** Managerul LAB actual citește sursele comune pentru taburi; oportunitatea lazy cere măsurarea versiunii actuale. Numerele de request-uri de mai jos aparțin vechiului Manager.

- Problema: toate taburile sunt încărcate înainte ca primul să fie complet utilizabil.
- Schimbare propusă: financiar la intrare; Performanță și Plăți la prima activare, apoi cache cu buton Refresh. Pentru căutarea globală, rezultatele din taburile neîncărcate pot fi marcate ca indisponibile până la încărcare sau căutarea poate declanșa explicit încărcarea.
- Beneficiu probabil:
  - latență inițială: Mare;
  - request-uri: de la 12 business SELECT-uri la 5 pentru primul ecran;
  - trafic DB: reducere mare pentru sesiunile care nu deschid toate taburile;
  - mentenanță: `↑` moderat prin stări `idle/loading/ready/error`.
- Risc: Mediu; căutarea globală și prospețimea cache-ului.
- Prioritate: P0.

### M4. Consolidarea query-urilor Manager suprapuse

> **Depășit ca descriere curentă:** în Managerul LAB actual există câte un plan pentru `detailing` și `constatari`, reutilizat la randare. Problema și estimările de mai jos sunt păstrate pentru istoricul versiunii vechi; nu reprezintă o restanță reconfirmată.

- Problema: `detailing` este citit de două ori, `constatari` de trei ori.
- Schimbare propusă: un model comun de date per tabel sau query-uri server-side distincte, strict filtrate. Nu se combină query-uri dacă se schimbă populația KPI-ului, de exemplu constatări arhivate vs nearhivate.
- Beneficiu probabil:
  - latență: Medie;
  - request-uri: `-2` până la `-3` la încărcarea completă;
  - trafic DB: reducere Medie–Mare;
  - mentenanță: `↓`.
- Risc: Mediu–Ridicat; semantică KPI.
- Precondiție: teste snapshot pentru cifrele curente.
- Prioritate: P1.

### M5. Eliminarea probelor de schemă din C&N

- Problema: patru query-uri `.limit(1)` verifică la fiecare deschidere dacă există coloane opționale.
- Schimbare propusă: o versiune de schemă/configurație cunoscută de aplicație sau un singur RPC read-only de capabilități; pe termen scurt, cache de sesiune cu invalidare explicită.
- Beneficiu probabil:
  - latență: Medie;
  - request-uri: `-4` la fiecare deschidere C&N;
  - trafic DB: mic ca volum, mare ca round-trip;
  - mentenanță: `↓` după stabilizarea schemei.
- Risc: Mediu; o implementare veche poate avea încă denumiri alternative.
- Prioritate: P1.

### M6. Paginare și filtre server-side pentru listele mari

- Probleme vizate: C&N, Constatări, AWB, Contracte, Telefoane, Căutare devize, Admin Audit, Comenzi piese SH.
- Schimbare propusă: pagini limitate, sortare stabilă și filtre transmise în query; total separat numai unde este afișat.
- Beneficiu probabil:
  - latență: Mică acum, Mare la volum;
  - request-uri: uneori cresc la navigare, dar payloadul inițial scade;
  - trafic DB/rețea: reducere foarte mare la volum;
  - mentenanță: `↑` moderat.
- Risc: Mediu; filtrele locale și selecția trebuie păstrate.
- Prioritate: P1 pentru Audit/Constatări/C&N, P2 pentru tabelele mici.

### M7. Batch pentru thumbnail-urile Dezmembrări

- Problema: o interogare `dezmembrari_photos` și un apel Edge pentru fiecare articol vizibil.
- Schimbare propusă în două etape:
  1. un singur query care întoarce fotografia principală/primul thumbnail pentru toate ID-urile vizibile;
  2. un endpoint Edge read-only care emite URL-uri semnate în batch sau o strategie controlată de URL public/cache, numai dacă modelul de securitate permite.
- Beneficiu probabil:
  - latență vizuală: Foarte mare;
  - request-uri: de la `O(N)` DB + `O(N)` Edge la 1 DB + unul sau puține batch-uri;
  - trafic DB: reducere foarte mare;
  - mentenanță: `↓` după centralizare.
- Risc: Mediu–Ridicat; URL-urile semnate și autorizarea pe fiecare item nu trebuie slăbite.
- Prioritate: P0 pentru pagina Dezmembrări.

### M8. Cache read-only cu invalidare explicită pentru date rareori schimbate

- Surse: roluri, profil curent, `service_personal`, configurații de notificări și alerte.
- Beneficiu probabil:
  - latență: Medie pe navigări repetate;
  - request-uri: reducere mică–medie;
  - trafic DB: reducere medie;
  - mentenanță: `↑` dacă invalidarea nu este centralizată.
- Risc: Mediu; permisiunile nu trebuie păstrate stale după schimbare/logout.
- Prioritate: P2.

## 4. STRUCTURAL — schimbări arhitecturale pentru viitor

### S1. Un singur RPC read-only pentru dashboardul principal

- Problemă: 15 request-uri pentru badge-uri și alerte.
- Schimbare propusă: RPC stabil care întoarce numai câmpurile agregate necesare utilizatorului curent, cu verificare de acces server-side și un timestamp `generated_at`.
- Beneficiu probabil:
  - latență inițială: Foarte mare;
  - request-uri: `15 → 1` per refresh;
  - trafic DB/rețea: reducere foarte mare;
  - mentenanță: `↓` pentru frontend, `↑` moderat pentru contractul SQL.
- Risc: Ridicat; trebuie reprodusă exact semantica și accesul fiecărui badge.
- Precondiții: matrice de acces aprobată, teste de contract, branch Supabase.
- Prioritate: P0 structural.

### S2. RPC/view-uri de agregare pentru Manager Dashboard

- Problemă: istorii complete transferate pentru câteva KPI-uri.
- Schimbare propusă: sumar financiar lunar, sumar operațional, așteptări active și sumar Generator; listele detaliate rămân paginate separat.
- Beneficiu probabil:
  - latență: Foarte mare la volum;
  - request-uri: `12 → 3–5`, în funcție de design;
  - trafic DB/rețea: reducere foarte mare;
  - mentenanță: `↓` dacă KPI-urile au contract explicit.
- Risc: Ridicat; fus orar, date text și definiții KPI.
- Precondiții: validare business și teste de egalitate cu rezultatul curent.
- Prioritate: P1 structural.

### S3. Strategie unică Realtime vs polling

- Problemă: abonamente declarate, publicație goală și polling separat.
- Variante de decizie:
  - polling rar și controlat, fără canale inactive;
  - Realtime activat numai pe tabelele necesare, cu refresh țintit per tabel;
  - Broadcast/server event pentru un payload agregat, dacă arhitectura viitoare o cere.
- Beneficiu probabil:
  - latență actualizare: Mare;
  - request-uri: reducere mare dacă refreshul este țintit;
  - trafic DB: reducere mare;
  - mentenanță: `↓` după eliminarea mecanismelor paralele.
- Risc: Ridicat; securitate RLS și furtuni de evenimente.
- Prioritate: P1 structural.

### S4. Strat comun de date și autentificare

- Problemă: fiecare pagină creează client, citește sesiune/profil și tratează erorile separat.
- Schimbare propusă: modul comun pentru client, sesiune, profil, permisiuni, request deduplication și telemetry; într-un HUB v3 React, provider/query cache unic.
- Beneficiu probabil:
  - latență: Medie;
  - request-uri: reducere medie;
  - trafic DB: reducere medie;
  - mentenanță: `↓` semnificativ.
- Risc: Mediu–Ridicat; afectează toate paginile.
- Prioritate: P1 pentru v3, P2 dacă este retrofitting în v2.

### S5. Build de asset-uri și eliminarea Tailwind Play din producție

- Problemă: CDN-uri sincronizate, versiuni nefixate, CSS calculat runtime și fișiere HTML mari.
- Schimbare propusă: Tailwind precompilat, versiuni fixate, bundling/minificare și `defer`/module pentru scripturile proprii; self-hosting doar dacă analiza cache/CDN justifică.
- Beneficiu probabil:
  - latență inițială: Medie–Mare pe dispozitive slabe;
  - request-uri: posibil mai puține domenii și handshake-uri;
  - trafic: CSS/JS mai mic și cache stabil;
  - mentenanță: `↓` după introducerea buildului, cu cost inițial.
- Risc: Mediu; regresii vizuale și ordine de execuție.
- Precondiție: baseline Lighthouse/DevTools și teste vizuale.
- Prioritate: P1 structural.

### S6. Observabilitate și bugete de performanță

- Schimbare propusă:
  - contor request-uri și durată per pagină în mediu de test;
  - praguri: request-uri la start, payload, LCP și timp până la badge-uri;
  - query tagging sau convenții pentru a separa versiunile în observabilitate;
  - monitorizarea p95, nu doar media.
- Beneficiu probabil:
  - latență: indirect;
  - request-uri/trafic: previne regresii;
  - mentenanță: `↓` pe termen lung.
- Risc: Mic, dacă nu se loghează date personale.
- Prioritate: P1.

## 5. Plan de validare a indecșilor

Nu se recomandă aplicarea automată a indecșilor din Advisor. Pentru fiecare candidat:

1. se capturează query-ul real și parametrii reprezentativi;
2. se rulează `EXPLAIN (ANALYZE, BUFFERS)` numai într-un branch/non-producție cu date comparabile;
3. se compară p50/p95 și buffers înainte/după;
4. se verifică impactul pe INSERT/UPDATE;
5. se păstrează indexul numai dacă planul și timpul se îmbunătățesc măsurabil.

Ordinea de investigare recomandată:

| Ordine | Candidat | Motiv |
|---:|---|---|
| 1 | `audit_logs(created_at DESC)` | 2.862 rânduri, listă Admin limit 500, scanări secvențiale multe |
| 2 | `audit_logs(modul, entitate, entitate_id, created_at DESC)` | query repetat pentru fișa Constatări selectată |
| 3 | `stoc_miscari(produs_id)` | view foarte frecvent și FK fără index |
| 4 | `constatari(vehicle_id, created_at DESC)` | istoric real C&N și FK fără index |
| 5 | `constatari_asteptare_piese(constatare_id, sfarsit, inceput DESC)` | query real în Manager/Constatări |
| 6 | `evidente_avansuri(vehicle_id, data_crearii DESC)` | query real pentru dosarul vehiculului |
| 7 | `evidente_avansuri_plati(avans_id, data_platii DESC)` | join/grupare reală în Avansuri/C&N |
| 8 | `evidenta_awb(stare, is_archived)` | badge și Manager; numai când volumul crește |

Indecșii pentru `detailing`, `plati_manager`, `flota_auto` și alte tabele cu 1–23 rânduri nu sunt prioritate de performanță actuală.

## 6. Ordinea recomandată de execuție

### Etapa A — măsurare și eliminarea duplicatelor

1. baseline HAR/Lighthouse pe dashboard și Manager;
2. Q1: un singur val de badge-uri — `DEPLOYED / VALIDAT ÎN PRODUCȚIE` la 2026-10-13;
3. Q4: query-urile Manager în paralel — `DEPLOYED / VALIDAT ÎN PRODUCȚIE` la 2026-10-13;
4. măsurare înainte/după.

Țintă propusă: dashboardul să nu depășească 18 request-uri REST la cold start înainte de optimizarea structurală și să nu aibă două query-uri identice simultane.

### Etapa B — reducerea traficului recurent

1. Q2: fetch după permisiuni;
2. M1: polling dashboard suspendat în background;
3. M2: polling Constatări adaptiv;
4. Q7: protecție generație și reutilizare la refocus — `DEPLOYED / VALIDAT ÎN PRODUCȚIE` la 2026-10-13;
5. M3: Manager lazy pe taburi.

Țintă propusă: reducere de cel puțin 70% a request-urilor per oră pentru un tab lăsat deschis, fără pierderea prospețimii acceptate business.

### Etapa C — payload și scalare

1. Q8: coloane minime;
2. M5: eliminarea probelor C&N;
3. M6: paginare;
4. M7: batch thumbnail;
5. testarea candidaților de index.

### Etapa D — arhitectură

1. contract KPI Manager;
2. RPC dashboard;
3. RPC/view-uri Manager;
4. decizie Realtime vs polling;
5. build asset-uri și strat comun de date.

## 7. Top 5 quick wins

1. `DEPLOYED / VALIDAT ÎN PRODUCȚIE` — eliminarea celui de-al doilea val `loadAllBadges()` și a citirii duplicate a anunțului.
2. `DEPLOYED / VALIDAT ÎN PRODUCȚIE` — paralelizarea celor cinci query-uri financiare din Manager Dashboard.
3. `DEPLOYED / VALIDAT ÎN PRODUCȚIE` — paralelizarea query-urilor asociate din `loadCars()` după obținerea ID-urilor; testul comparabil prin Five Server confirmă aproximativ 100 ms avantaj la încărcarea măsurată, fără reducerea numărului de request-uri.
4. `DESCHIS` — filtrarea query-urilor de badge după permisiuni pentru rolurile limitate. Ordinea profil → permisiuni → încărcare a fost rezolvată, dar loaderele nu sunt încă filtrate.
5. `DESCHIS` — refolosirea profilului/sesiunii deja validate, fără `getUser()` + `auth_profiles` duplicate la fiecare pagină.

## 8. Schimbarea cu cea mai mare diferență vizibilă

Pentru utilizatorul dashboardului principal, cea mai mare diferență imediată este **înlocuirea pornirii actuale cu o singură încărcare a badge-urilor după profil și permisiuni**.

Această schimbare este `DEPLOYED / VALIDAT ÎN PRODUCȚIE` din 2026-10-13. Paragraful următor păstrează estimarea formulată înainte de implementare; rezultatul observat este consemnat în `15_OPTIMIZARI_IMPLEMENTATE.md`.

În varianta minimă, aceasta elimină aproximativ 16 request-uri la deschidere și concurența dintre două randări. În varianta structurală, un RPC read-only agregat reduce cele 15 request-uri ale unui val la unul singur. Indecșii nu ar produce acum un efect vizibil comparabil, deoarece timpul SQL observat este de ordinul milisecundelor, iar fiecare round-trip HTTP este de ordinul sutelor de milisecunde.

## 9. Criterii de acceptare pentru o etapă viitoare de implementare

- zero request-uri duplicate simultane la cold start;
- badge-urile vizibile se stabilizează după un singur val;
- rolurile limitate nu cer date pentru module ascunse;
- Manager afișează primul tab fără a aștepta taburile secundare;
- taburile ascunse nu fac polling;
- nicio rundă de polling nu pornește înainte ca precedenta să se termine;
- KPI-urile Manager sunt identice cu baseline-ul pentru aceleași date și același fus orar;
- orice index propus are dovadă `EXPLAIN` înainte/după;
- Realtime, dacă va fi activat, înlocuiește refreshul relevant și nu declanșează toate badge-urile;
- testele de acces din `12_TESTE_ACCES.md` rămân verzi.

