# HUB AUTO v2 — registrul optimizărilor de performanță implementate

## 1. Scop și regulă de interpretare

**Reconciliere statică LAB — 22.10.2026.** Validările de producție din 13.10.2026 descriu numai implementările de atunci. Managerul și motorul comun de căutare au evoluat ulterior în LAB; existența lor în cod nu confirmă publicarea sau validarea acestei versiuni în producție. Pentru starea RLS și direcția proiectului prevalează [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

Acest document este registrul stării curente pentru optimizările de performanță aplicate în copia de lucru `HUB_v2-LAB/`. Auditul din `13_AUDIT_PERFORMANTA.md` și planul din `14_PLAN_OPTIMIZARE.md` păstrează analiza și recomandările istorice; când o constatare din acele documente este marcată aici ca remediată sau reinterpretată, statusul din acest registru are prioritate pentru lucrările viitoare.

Statusurile folosite sunt:

- `IMPLEMENTAT` — modificarea există în cod, dar nu are încă o validare completă consemnată;
- `IMPLEMENTAT - DE VALIDAT` — modificarea există, iar testarea manuală solicitată este încă restantă;
- `VALIDAT` — implementarea și rezultatul relevant au fost verificate;
- `DEPLOYED / VALIDAT ÎN PRODUCȚIE` — implementarea a fost publicată și verificată după deploy în mediul de producție;
- `PĂSTRAT INTENȚIONAT` — comportamentul este o cerință cunoscută și nu trebuie eliminat ca presupusă problemă;
- `DESCHIS` — problema sau recomandarea nu a fost implementată.

## 2. Sinteză

| Componentă | Schimbare | Status | Data |
|---|---|---|---|
| Dashboard principal / `index.html` | eliminarea inițializării duplicate a badge-urilor și a citirii separate a anunțului | `DEPLOYED / VALIDAT ÎN PRODUCȚIE` | 2026-10-13 |
| Manager Dashboard — versiune istorică | paralelizarea celor cinci query-uri financiare independente | `DEPLOYED / VALIDAT ÎN PRODUCȚIE` pentru versiunea de atunci | 2026-10-13 |
| Manager integrat LAB și căutare comună HUB/Manager | surse filtrate/paginate, încărcare paralelă, timeout și anularea căutărilor; detalii §4.1 | `IMPLEMENTAT` — cod recitit; producție neconfirmată | reconciliere 2026-10-22 |
| Constatări v2 | paralelizarea citirilor relațiilor după query-ul principal | `DEPLOYED / VALIDAT ÎN PRODUCȚIE` | 2026-10-13 |
| Căutare globală — versiune istorică / `index.html` | debounce, protecție prin generație și reutilizarea rezultatelor la refocus | `DEPLOYED / VALIDAT ÎN PRODUCȚIE` | 2026-10-13 |
| Generator | polling la 5 secunde menținut ca cerință de sincronizare multi-utilizator | `PĂSTRAT INTENȚIONAT` | decizie documentată la 2026-10-13 |

La `2026-10-13`, după deploy, au fost testate în producție Dashboardul principal, căutarea globală, Manager Dashboard și Constatări v2. Această validare post-deploy completează testele și măsurătorile istorice consemnate în secțiunile de mai jos; valorile istorice nu sunt reinterpretate.

## 3. Dashboard principal / `index.html`

### Problema inițială

La pornirea dashboardului existau două valuri de request-uri pentru badge-uri. Anunțul administratorului era citit separat, deși făcea parte și din încărcarea comună a badge-urilor.

### Cauza

`loadAllBadges()` era apelat atât în inițializarea imediată, cât și ulterior în `loadDashboard()`. În plus, `loadDashboard()` apela separat `loadAdminAnnouncement()` înaintea celui de-al doilea val.

### Modificarea implementată

- a fost eliminat apelul inițial redundant `loadAllBadges()`;
- a fost eliminat apelul separat `loadAdminAnnouncement()`;
- badge-urile sunt încărcate o singură dată, după stabilirea profilului și permisiunilor utilizatorului;
- nu au fost eliminate mecanismele de actualizare ulterioară.

### Fișiere modificate

- `index.html`

### Ce a fost păstrat

- pollingul badge-urilor la 60 de secunde;
- mecanismul Realtime existent;
- `refreshDashboard()`;
- rezultatul vizual și comportamentul funcțional al dashboardului.

### Rezultat observat

- aproximativ 16 request-uri REST inițiale au fost eliminate din traseul de pornire;
- în testul Network efectuat, producția a generat 52 de request-uri, iar copia optimizată 40 de request-uri;
- citirea duplicată `admin_announcements` nu mai apare;
- al doilea val redundant de badge-uri a fost eliminat;
- comportamentul funcțional a fost păstrat.

Diferența dintre estimarea de aproximativ 16 request-uri REST eliminate și diferența de 12 request-uri din captura Network nu este reinterpretată aici: prima valoare descrie apelurile eliminate din fluxul analizat, iar a doua este rezultatul total al testului efectuat în browser.

Timpii absoluți ai variantei PWA/producție și ai copiei locale deschise prin Five Server nu au fost considerați benchmark direct, deoarece mediile de execuție sunt diferite.

### Testare efectuată / de efectuat

- efectuat: comparație Network între producție și copia optimizată;
- efectuat: verificarea dispariției citirii duplicate `admin_announcements` și a celui de-al doilea val de badge-uri;
- efectuat: verificarea păstrării comportamentului funcțional;
- de repetat la modificări viitoare: smoke test pentru badge-uri, anunț, refresh manual, polling și evenimente Realtime.

### Status

`DEPLOYED / VALIDAT ÎN PRODUCȚIE`

### Data implementării

`2026-10-13`

## 4. Manager Dashboard

Această secțiune păstrează optimizarea din **13.10.2026**. Numărul de cinci citiri, KPI-urile, testele și statusul de producție de mai jos aparțin acelei versiuni; implementarea LAB actuală este descrisă separat în §4.1.

### Problema inițială

Cinci query-uri financiare independente erau așteptate secvențial, astfel încât latențele lor se cumulau înainte de afișarea datelor financiare.

### Cauza

Funcțiile de citire erau apelate cu `await` una după alta, deși niciuna nu avea nevoie de rezultatul alteia.

### Modificarea implementată

Următoarele cinci citiri sunt pornite simultan prin `Promise.all`:

- `deviz_final_header`;
- `evidente_avansuri_plati`;
- `evidenta_awb`;
- `detailing`;
- `stoc_view_curent`.

### Fișiere modificate

- `modules/manager/manager.js`

### Ce a fost păstrat

- aceleași tabele și aceleași surse de date;
- aceleași filtre;
- aceleași calcule și valori KPI;
- aceleași grafice și același comportament vizual;
- tratarea existentă a erorilor, fără transformarea unei erori într-o valoare `0`.

### Rezultat observat

- cele cinci request-uri pornesc aproximativ simultan;
- datele din Manager Dashboard apar vizibil mai rapid în testul manual;
- KPI-urile și comportamentul vizual au rămas corecte;
- numărul de request-uri și volumul datelor transferate nu au fost reduse prin această schimbare.

### Testare efectuată / de efectuat

- efectuat în Network: verificarea pornirii aproximativ simultane a request-urilor `deviz_final_header`, `evidente_avansuri_plati`, `evidenta_awb`, `detailing` și `stoc_view_curent`;
- efectuat: test manual al vitezei percepute în Manager Dashboard și verificarea KPI-urilor/comportamentului vizual;
- de repetat la modificări viitoare: comparație KPI și scenarii de eroare pentru fiecare sursă.

### Status

`DEPLOYED / VALIDAT ÎN PRODUCȚIE`

### Data implementării

`2026-10-13`

### 4.1 Implementarea actuală din LAB — cod recitit la 22.10.2026

- Surse: `modules/manager/manager.html`, `manager.css`, `manager.js`; ruta activă este Manager, nu fostul prototip `manager-v2.*`.
- `load()` pornește în paralel cele zece planuri de surse și sumarul Dezmembrări. `busy` previne suprapunerea încărcărilor; Managerul nu are polling business automat. Autorizarea și cererile auxiliare sunt distincte de acest număr de planuri, care nu este un număr fix de request-uri HTTP.
- `plans()` selectează coloane explicite și filtrează după intervalul calendaristic de șase luni sau starea operațională relevantă. Nu toate sursele au același filtru: stocul activ, operațiile deschise și așteptările neînchise rămân necesare indiferent de vechime.
- `readSource()` citește în pagini de 500, cu limită de 5.000 rânduri per sursă și timeout de 15 secunde. Numărul total și completitudinea sunt verificate; depășirea limitei ori o eroare invalidează sursa, fără sumar parțial prezentat drept complet sau zero fictiv.
- Dezmembrări folosește două cereri HEAD COUNT exacte (`draft`/`ready`), numai pentru Admin sau gestiune completă, fără descărcarea articolelor/fotografiilor.
- Aceleași seturi citite alimentează KPI-urile și taburile; `constatari` și `detailing` au câte un plan, spre deosebire de citirile suprapuse ale versiunii vechi. Taburile nu sunt încărcate lazy: o eventuală schimbare cere o nevoie măsurată, nu continuarea automată a planului vechi.
- Valoarea devizelor este `total_manopera + total_piese`; avansurile sunt plăți separate. `total_general` este restul după avans. Graficul este DOM/CSS prin `renderTrend()`, fără Chart.js.
- `HubGlobalSearch`, definit în Manager JS și reutilizat de HUB prin `data-hub-search-only`, respectă permisiunile categoriilor, limitează citirile la opt rezultate per query, reutilizează termenul identic și folosește `AbortController`/`abortSignal` pentru anularea cererilor depășite, cu timeout de 10 secunde. UI aplică debounce de 350 ms și protecție prin generație. Numărul vechi de șapte surse nu mai descrie motorul actual.

**Dovezi și limite:** verificare statică a funcțiilor `plans`, `readSource`, `load`, `fetchDismantlingSummary`, `renderTrend` și `HubGlobalSearch`; nu s-au rulat măsurători Network sau teste funcționale noi. Testarea manuală LAB raportată de utilizator la 16.10 rămâne consemnată în [18 redesign](18_MANAGER_DASHBOARD_REDESIGN.md); nu dovedește un deploy în producție. Statusul versiunii actuale: **IMPLEMENTAT ÎN LAB; publicarea în producție neconfirmată**. Dependențele și limitele transferului sunt în [19](19_MANAGER_V2_FISIERE_DEPLOY.md), [20 ciorne](20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md) și [23](23_INVENTAR_TRANSFER_PRODUCTIE.md).

## 5. Constatări v2

### Problema inițială

După terminarea query-ului principal pentru `constatari`, citirile relațiilor erau așteptate secvențial, ceea ce cumula latența la încărcare și la fiecare refresh.

### Cauza

Încărcările pentru departamente, repartizări, așteptarea pieselor și audit erau executate una după alta, deși după obținerea listei principale nu depindeau reciproc.

### Modificarea implementată

După query-ul principal `constatari`, următoarele ramuri independente rulează în paralel prin `Promise.allSettled`:

- `constatari_departamente`;
- `constatari_repartizari` împreună cu datele necesare din `service_personal`;
- `constatari_asteptare_piese`;
- `audit_logs` pentru constatarea selectată.

Randarea este făcută o singură dată după încheierea batch-ului.

### Fișiere modificate

- `js/constatari_v2.js`

### Ce a fost păstrat

- pollingul la 15 secunde;
- protecția `hasUnsavedChanges`;
- opțiunea `preserveActiveInput`;
- reutilizarea promise-ului activ pentru refreshuri suprapuse;
- verificarea `loadCarsGeneration`, care împiedică aplicarea unui rezultat depășit;
- statusurile, repartizările și toate datele afișate;
- aceleași tabele, filtre și coloane.

### Rezultat observat

Testul a fost efectuat în condiții comparabile, ambele versiuni fiind deschise prin Five Server.

| Variantă | Request-uri | Transfer | Finish |
|---|---:|---:|---:|
| optimizată | 19 | 18,8 kB | aproximativ 922 ms |
| producție | 19 | 18,8 kB | aproximativ 1,02 s |

Numărul de request-uri și volumul transferat au rămas intenționat neschimbate. Optimizarea constă în faptul că, după query-ul principal `constatari`, citirile `constatari_departamente`, `constatari_repartizari`, `constatari_asteptare_piese` și `audit_logs` pornesc aproximativ simultan.

Diferența observată la încărcarea testată a fost de aproximativ 100 ms în favoarea variantei optimizate. Același avantaj de paralelizare se repetă la refreshurile periodice. Pollingul la 15 secunde și protecția pentru modificările nesalvate au rămas funcționale.

### Testare efectuată / de efectuat

- efectuat: validarea sintaxei JavaScript;
- efectuat prin Five Server: comparație Network în condiții similare pentru versiunea optimizată și versiunea de producție;
- efectuat: verificarea pornirii aproximativ simultane a celor patru ramuri după query-ul principal;
- efectuat: verificarea pollingului la 15 secunde;
- efectuat: verificarea protecției pentru modificările nesalvate.

### Status

`DEPLOYED / VALIDAT ÎN PRODUCȚIE`

### Data implementării

`2026-10-13`

## 6. Căutare globală / `index.html`

**Istoric — 13.10.2026.** Cele șapte surse și lipsa anulării request-urilor descrise mai jos aparțin implementării de atunci. În LAB, HUB folosește acum motorul comun cu anulare descris în §4.1; validarea istorică în producție nu se extinde la acesta.

### Problema inițială

O căutare putea lansa până la șapte request-uri Supabase pentru fiecare termen executat. Request-urile deja pornite continuau după schimbarea termenului, iar refocalizarea câmpului cu același termen relansa întregul batch de căutare.

### Cauza

Debounce-ul existent nu invalida generația imediat la fiecare editare, iar evenimentul `focus` apela din nou căutarea chiar dacă termenul și rezultatele nu se schimbaseră.

### Modificarea implementată

- debounce-ul a fost stabilit la 350 ms;
- generația/tokenul de căutare este invalidat imediat la fiecare editare;
- răspunsurile unei generații vechi nu mai pot suprascrie rezultatele termenului curent;
- request-urile deja trimise nu sunt anulate, ci răspunsurile lor sunt ignorate în siguranță;
- la refocus pe același termen sunt reutilizate rezultatele existente, fără relansarea batch-ului global.

### Fișiere modificate

- `index.html`

### Ce a fost păstrat

- aceleași șapte surse potențiale de căutare;
- aceleași verificări de permisiuni;
- aceleași rezultate și același UI;
- comportamentul pentru ștergerea termenului, căutări consecutive, lipsa rezultatelor și erori;
- logica badge-urilor validată anterior.

### Rezultat observat

În testul manual cu termenul `ct57apo`, după finalizarea căutării și golirea panoului Network:

- refocusul pe același termen în varianta optimizată a generat numai un request de fundal, fără relansarea batch-ului global de căutare;
- refocusul în versiunea de producție a relansat cele șapte request-uri ale căutării globale;
- rezultatele afișate în varianta optimizată au rămas corecte;
- reutilizarea rezultatelor existente la refocus funcționează conform intenției.

Request-ul de fundal observat nu este atribuit aici căutării globale și nu este reinterpretat fără o identificare suplimentară.

### Testare efectuată / de efectuat

- efectuat: căutare completă pentru `ct57apo`;
- efectuat: golirea Network după finalizarea căutării;
- efectuat: refocus pe același termen în varianta optimizată și în producție;
- efectuat: verificarea păstrării rezultatelor corecte;
- de repetat la modificări viitoare: tastare rapidă, schimbarea termenului în timpul unui răspuns, ștergere, lipsă rezultate, eroare de sursă și roluri cu permisiuni diferite.

### Status

`DEPLOYED / VALIDAT ÎN PRODUCȚIE`

### Data implementării

`2026-10-13`

## 7. Generator

### Problema inițială

Auditul tehnic a identificat pollingul la 5 secunde ca trafic frecvent. Clarificarea ulterioară de business a stabilit că acesta nu este trafic redundant și nu trebuie tratat ca o problemă de performanță în forma actuală.

### Cauza

Mai mulți utilizatori pot accesa simultan modulul. O schimbare Start/Stop trebuie să devină vizibilă în câteva secunde pentru ceilalți utilizatori, astfel încât să fie evitate acțiunile duplicate sau contradictorii asupra Generatorului.

### Modificarea implementată

Nu s-a făcut nicio modificare de cod. Pollingul la 5 secunde a fost reclasificat drept comportament operațional intenționat.

### Fișiere modificate

- niciun fișier al aplicației;
- numai documentația de performanță consemnează decizia.

### Ce a fost păstrat

- pollingul la 5 secunde;
- sincronizarea rapidă a stării pornit/oprit între utilizatori;
- comportamentul funcțional existent al modulului.

### Rezultat observat

Nu se raportează un câștig de performanță, deoarece nu a fost făcută o optimizare. Costul pollingului este acceptat în mod intenționat pentru cerința de sincronizare.

### Testare efectuată / de efectuat

- nu a fost necesară o testare de regresie pentru această documentare, deoarece codul nu a fost modificat;
- o eventuală înlocuire cu Realtime trebuie testată separat pentru latență, reconectare și recuperarea stării după evenimente ratate înainte de eliminarea pollingului.

### Status

`PĂSTRAT INTENȚIONAT`

### Data implementării

Nu se aplică; decizia a fost documentată la `2026-10-13`.

## 8. Probleme care rămân deschise

Lista de mai jos păstrează recomandări ale auditului inițial pentru modulele încă nereevaluate, cu excepțiile Manager reconciliate la 22.10.2026. Sunt candidați de verificat la o nevoie concretă, nu un backlog obligatoriu sau probleme toate reconfirmate în codul actual:

- filtrarea loaderelor de badge după permisiuni, astfel încât modulele ascunse să nu genereze query-uri inutile;
- citirile duplicate de sesiune/profil între pagini și `session-timeout.js`;
- traficul periodic al dashboardului și coordonarea rundelor de polling cu vizibilitatea paginii;
- Manager: încărcarea comună a taburilor rămâne; optimizarea lazy este opțională și cere măsurare. Citirile suprapuse ale versiunii vechi și afirmația generală despre istoricul complet nu mai descriu implementarea din §4.1; rămân limitele documentate de volum și testarea pe date reale;
- volumul recurent al Constatărilor: pollingul de 15 secunde păstrat continuă să execute lista și relațiile, chiar dacă relațiile pornesc acum în paralel;
- probele de schemă și citirile complete din Clienți & Notificări;
- modelul N+1 pentru thumbnail-urile Dezmembrări;
- folosirea extinsă a `select('*')`, lipsa paginării și încărcarea listelor complete;
- costul asset-urilor CDN și Tailwind runtime, încă nemăsurat în browser;
- optimizările structurale propuse prin RPC/view-uri, strategie Realtime și strat comun de date;
- candidații de index rămân propuneri, fără aplicare dedusă din acest registru. Constatările RLS inițiale sunt istorice: activarea este finalizată conform [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md), iar riscurile ACL/Generator/TODO/Storage documentate acolo rămân distincte și nu sunt minimalizate.

Pollingul Generatorului la 5 secunde nu face parte din această listă: este `PĂSTRAT INTENȚIONAT`.
