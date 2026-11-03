# HUB AUTO v2 — audit READ-ONLY de curățenie și organizare

Data auditului: `2026-10-13`

## 1. Rezumat executiv

Auditul a analizat exclusiv copia `HUB_v2-LAB/`. Nu au fost șterse, mutate, redenumite sau modificate fișiere ale aplicației și nu a fost accesat sau modificat Supabase.

Metoda folosită:

- inventar al fișierelor și directoarelor, inclusiv fișiere urmărite/neurmărite de Git;
- căutare de referințe exacte în HTML, JavaScript, CSS, manifeste, configurația Vercel și fișierele Supabase locale;
- rezolvarea statică a tuturor atributelor locale `src`/`href` din HTML;
- comparație între fișierele `.orig` și versiunile active;
- inventar al blocurilor JavaScript/CSS inline;
- verificarea hashurilor SHA-256 pentru duplicate exacte;
- verificarea directoarelor și fișierelor goale.

Rezultate principale:

- au fost inventariate 88 de fișiere în afara `.git`;
- toate referințele locale statice `src`/`href` din paginile HTML active se rezolvă către fișiere existente;
- nu au fost găsite fișiere cu conținut identic byte-for-byte;
- două fișiere `.orig`, `Untitled`, un placeholder HTML și cache-ul Supabase CLI sunt candidați puternici pentru arhivare sau scoatere ulterioară din sursa activă;
- cinci iconuri PWA nu sunt referite de niciun HTML sau manifest local, dar utilizarea lor externă nu poate fi exclusă prin analiză statică;
- `panou_control.html` nu este legat din aplicația curentă și dublează parțial administrarea utilizatorilor din `admin.html`, dar poate fi încă accesat prin URL direct; statusul său este `NECLAR`;
- folderul `clienti_notificari_demo/` este material de referință, nu dependență runtime;
- modulul activ Clienți & Notificări rămâne hibrid demo/live și nu este sigur de simplificat fără o misiune separată;
- toate fișierele CSS existente sunt referite; nu există un fișier CSS complet demonstrat ca nefolosit;
- documentația `00`–`15` este prezentă local, dar întregul director `documentatie_tehnica/` era neurmărit de Git la momentul auditului;
- modificările validate anterior din `index.html`, `js/constatari_v2.js` și `modules/manager/manager.js` apar ca modificări locale Git și nu trebuie confundate cu fișiere abandonate.

`NECLAR` înseamnă că lipsa unei referințe interne nu este suficientă pentru a exclude accesul prin bookmark, URL direct, instalare PWA existentă sau un proces extern.

## 2. Fișiere active importante

### 2.1 Nucleu, deploy și configurare

| Cale | Categorie | Dovadă | Risc dacă este atins | Acțiune recomandată | Confirmare manuală |
|---|---|---|---|---|---|
| `index.html` | ACTIV | punct principal de intrare; conține navigația, badge-urile, căutarea și inițializarea sesiunii | Ridicat | păstrare; modificări numai prin misiuni izolate și testate | Da, pentru orice schimbare |
| `js/config.js` | ACTIV | este încărcat de index și mai multe module; inițializează clientul comun | Ridicat | păstrare | Da |
| `js/session-timeout.js` | ACTIV | încărcat de dashboard și multiple pagini operaționale | Ridicat | păstrare | Da |
| `js/audit.js` | ACTIV | încărcat de login și mai multe module care scriu audit | Ridicat | păstrare | Da |
| `manifest.json` | ACTIV | referit de index și majoritatea paginilor; folosește `192x192.png` și `512x512.png` | Mediu | păstrare | Da |
| `manifest-dz.json` | ACTIV | referit de captura mobilă Dezmembrări; start URL și iconuri distincte | Mediu | păstrare; nu este duplicat al manifestului principal | Da |
| `vercel.json` | ACTIV | definește antetele de cache pentru paginile HTML | Ridicat | păstrare | Da |
| `.gitignore` | ACTIV | exclude medii, build-uri, loguri și directoare IDE | Mediu | păstrare; extinderea lui se poate face numai după aprobarea planului de curățenie | Da |
| `AGENTS.md` | REFERINȚĂ | conține regulile locale obligatorii pentru editarea codului | Ridicat | păstrare în rădăcină | Da |

### 2.2 Pagini și module active

| Grup/cale | Categorie | Dovadă | Risc dacă este atins | Acțiune recomandată | Confirmare manuală |
|---|---|---|---|---|---|
| paginile enumerate în cardurile/rutele din `index.html` | ACTIV | toate sunt ținte explicite de navigație și/sau căutare | Ridicat | păstrare | Da |
| `modules/devize/deviz-print.html` | ACTIV | este deschis din `deviz_final.html` prin `window.open("deviz-print.html")` | Ridicat | păstrare; pagina nu este orfană | Da |
| `modules/formulare/constatare-print.html` | ACTIV | este deschis din `js/constatari_v2.js` | Ridicat | păstrare; pagina nu este orfană | Da |
| `modules/stocuri/dezmembrari.html` + `js/dezmembrari.js` + `css/dezmembrari.css` | ACTIV | rută desktop din dashboard; apelează funcția Edge de fotografii | Ridicat | păstrare ca unitate | Da |
| `modules/stocuri/dezmembrari_capture.html` + JS/CSS dedicate | ACTIV | rută mobilă și start URL în `manifest-dz.json` | Ridicat | păstrare; nu este duplicat al interfeței desktop | Da |
| `modules/devize/comenzi_piese_sh.html` + JS/CSS dedicate | ACTIV | rută în dashboard, legături din Deviz final și integrare Admin | Ridicat | păstrare | Da |
| `modules/formulare/constatari_v2.html` + JS/CSS dedicate | ACTIV | rută în dashboard; flux operațional și print | Ridicat | păstrare | Da |
| `modules/manager/manager.html`, `manager.js`, `manager.css` | ACTIV | rută Manager din dashboard; date reale și optimizare validată | Ridicat | păstrare | Da |
| `modules/devize/clienti-notificari.html` + JS/CSS dedicate | ACTIV DAR NECESITĂ CLARIFICARE | pagina este legată din dashboard și execută operații live, dar păstrează eticheta/demo data și fluxuri simulate | Ridicat | nu se arhivează; cere separarea viitoare demo/live după confirmarea business | Da |

### 2.3 CSS și JavaScript externe

Toate cele șase fișiere din `css/`, plus `modules/manager/manager.css`, au cel puțin o referință activă. Toate fișierele JavaScript fără sufix `.orig` din `js/` sunt de asemenea referite de pagini active.

`css/style.css` are numai 226 bytes, dar este încărcat de numeroase module și definește comportamentul comun `.hub-card`; dimensiunea mică nu îl face nefolosit.

Nu a fost demonstrat niciun fișier CSS complet nefolosit. Selectorii individuali nu pot fi clasificați sigur doar static deoarece multe clase sunt generate din template-uri JavaScript sau aplicate dinamic. Curățarea la nivel de selector rămâne `NECLAR` până la o analiză cu coverage în browser.

### 2.4 Supabase local și funcții Edge

| Cale | Categorie | Dovadă | Risc dacă este atins | Acțiune recomandată | Confirmare manuală |
|---|---|---|---|---|---|
| `supabase/config.toml` | ACTIV | configurează `dezmembrari-photo-upload` cu verificare JWT | Ridicat | păstrare | Da |
| `supabase/functions/dezmembrari-photo-upload/index.ts` | ACTIV | apelat din desktop, captură mobilă și Admin | Foarte ridicat | păstrare | Da |
| `supabase/functions/_shared/google_drive.ts` | ACTIV | importat direct de funcția Edge Dezmembrări | Foarte ridicat | păstrare | Da |
| `supabase/migrations/20260918132916_add_constatare_deviz_final_rpc.sql` | ISTORIC și ACTIV PENTRU REPRODUCERE | singura migrare locală; documentează RPC-ul Constatare → Deviz final | Foarte ridicat | nu se șterge și nu se arhivează separat de istoria DB | Da |

## 3. Fișiere istorice / copii / backup

| Cale | Categorie | Dovadă | Risc | Acțiune recomandată | Confirmare manuală |
|---|---|---|---|---|---|
| `Untitled` | ISTORIC / CANDIDAT PENTRU ARHIVARE | conține un prompt în limbaj natural pentru integrarea vechiului dashboard; nu este referit de aplicație; este urmărit de Git | Scăzut | arhivare în afara sursei publicabile sau eliminare viitoare din branch după confirmare; istoricul rămâne în Git | Da |
| `js/clienti-notificari.js.orig` | COPIE / BACKUP / CANDIDAT PENTRU ARHIVARE | nu este încărcat de HTML; diferă de versiunea activă cu 118 inserări și 28 ștergeri | Scăzut | arhivare/eliminare viitoare; Git păstrează istoricul | Da |
| `modules/devize/clienti-notificari.html.orig` | COPIE / BACKUP / CANDIDAT PENTRU ARHIVARE | nu este referit; versiunea activă are 7 inserări și 5 ștergeri față de copie | Scăzut | arhivare/eliminare viitoare | Da |
| `clienti_notificari_demo/` | REFERINȚĂ | documentul intern referă `dashboard.jpeg` și `modal.jpeg`; aplicația runtime nu referă folderul | Scăzut–Mediu | păstrare ca referință sau mutare viitoare într-o arhivă/documentație separată | Da |

Fișierele `.orig` nu sunt copii exacte ale versiunilor active, dar sunt snapshot-uri mai vechi. Lipsa referințelor și existența istoricului Git fac probabilă arhivarea sigură; totuși, nicio acțiune nu trebuie făcută fără confirmare.

## 4. Placeholder-e

| Cale | Categorie | Dovadă | Risc | Acțiune recomandată | Confirmare manuală |
|---|---|---|---|---|---|
| `modules/stocuri/comenzi_piese.html` | PLACEHOLDER / CANDIDAT PENTRU ARHIVARE | nu este referit de aplicație; afișează „Conținutul ... va fi implementat aici”; conține un `</script>` fără pereche; modulul funcțional este `modules/devize/comenzi_piese_sh.html` | Scăzut dacă nu există bookmark extern; altfel Mediu | confirmarea lipsei utilizării directe, apoi arhivare în afara sursei active | Da |
| `supabase/functions/vin-ocr-test/` | PLACEHOLDER / NECLAR | director complet gol, fără referințe și neurmărit de Git; un clone Git nu îl reproduce | Scăzut | confirmați dacă este rezervat pentru lucru viitor; altfel poate fi eliminat local într-o misiune separată | Da |

Textele `placeholder` din formulare și din `js/constatari_v2.js` sunt exemple UI active, nu fișiere-placeholder și nu sunt candidați de curățenie.

## 5. Posibile fișiere nefolosite

| Cale | Categorie | Dovadă | Risc | Acțiune recomandată | Confirmare manuală |
|---|---|---|---|---|---|
| `icons/72x72.png` | POSIBIL NEFOLOSIT / NECLAR | nicio referință în HTML, CSS, JS sau manifeste | Scăzut | arhivare după verificarea instalărilor PWA existente și a eventualelor consumatoare externe | Da |
| `icons/96x96.png` | POSIBIL NEFOLOSIT / NECLAR | nicio referință locală | Scăzut | aceeași verificare ca mai sus | Da |
| `icons/144x144.png` | POSIBIL NEFOLOSIT / NECLAR | nicio referință locală | Scăzut | aceeași verificare ca mai sus | Da |
| `icons/152x152.png` | POSIBIL NEFOLOSIT / NECLAR | nicio referință locală | Scăzut | aceeași verificare ca mai sus | Da |
| `icons/384x384.png` | POSIBIL NEFOLOSIT / NECLAR | nicio referință locală; manifestul principal declară doar 192 și 512 | Scăzut | aceeași verificare ca mai sus | Da |
| `modules/admin/panou_control.html` | POSIBIL NEFOLOSIT / POSIBIL DUPLICAT / NECLAR | nu există link runtime către fișier; dublează managementul utilizatorilor din `admin.html`; poate fi accesat prin URL direct | Ridicat | nu se arhivează înainte de confirmarea utilizatorilor/bookmarkurilor și a operațiilor unice | Da, obligatoriu |

Nu au fost găsite alte fișiere HTML/JS/CSS fără referințe relevante la nivel de fișier. Paginile de print sunt consumate indirect și trebuie păstrate.

## 6. Posibile duplicate

| Cale/element | Categorie | Dovadă | Risc | Acțiune recomandată | Confirmare manuală |
|---|---|---|---|---|---|
| `panou_control.html` vs tabul Utilizatori din `admin.html` | POSIBIL DUPLICAT / ACTIV DAR NECESITĂ CLARIFICARE | ambele gestionează utilizatori/roluri/permisiuni; panoul vechi permite Admin sau cheia istorică `panou_control`; regula business rezervă operația Adminului | Ridicat | comparație funcțională și decizie privind o singură interfață canonică înainte de arhivare | Da |
| `comenzi_piese.html` vs `comenzi_piese_sh.html` | POSIBIL DUPLICAT doar prin denumire | primul este placeholder nelegat; al doilea este modul activ complet | Scăzut | arhivarea placeholderului după confirmare; nu se combină fișierele | Da |
| `manifest.json` vs `manifest-dz.json` | ACTIV, NU ESTE DUPLICAT | au scope, start URL și branding diferite | Ridicat dacă sunt consolidate greșit | păstrarea ambelor | Da |
| Dezmembrări desktop vs captură mobilă | ACTIV, NU ESTE DUPLICAT | interfețe și fluxuri diferite, legate prin rutare responsive | Ridicat | păstrarea ambelor | Da |
| fișierele `.orig` vs active | COPIE / BACKUP | snapshot-uri diferite, fără încărcare runtime | Scăzut | arhivare după confirmare | Da |

Hashurile tuturor fișierelor au fost comparate; nu există duplicate exacte byte-for-byte.

## 7. Resurse media nefolosite

### 7.1 Media activă care trebuie păstrată

- `icons/128x128.png`: dashboard, pagini Stoc și notificări browser;
- `icons/192x192.png`: favicon și manifest principal;
- `icons/512x512.png`: manifest principal;
- `icons/logo.png`: watermark pentru paginile de deviz și constatare print;
- `icons/dz-hub-180.png`: Apple touch icon pentru captura Dezmembrări;
- `icons/dz-hub-192.png` și `dz-hub-512.png`: manifestul PWA Dezmembrări.

### 7.2 Media fără referință runtime confirmată

- `icons/72x72.png`, `96x96.png`, `144x144.png`, `152x152.png`, `384x384.png`: posibil set PWA istoric; `NECLAR` până la confirmarea utilizărilor externe;
- `clienti_notificari_demo/dashboard.jpeg` și `modal.jpeg`: referite numai de documentul demo, deci sunt `REFERINȚĂ`, nu media runtime.

Nu se recomandă ștergerea individuală a imaginilor demo cât timp documentul de referință rămâne în proiect; folderul trebuie păstrat sau arhivat ca unitate.

## 8. Directoare goale

| Cale | Categorie | Dovadă | Risc | Acțiune recomandată | Confirmare manuală |
|---|---|---|---|---|---|
| `supabase/functions/vin-ocr-test/` | PLACEHOLDER / NECLAR | zero fișiere; nicio referință; nu este urmărit de Git | Scăzut | confirmați intenția, apoi eliminați local sau adăugați un README dacă trebuie rezervat | Da |

Directoarele `.git/branches` și directoarele interne `.git` sunt administrate de Git și nu fac parte din curățenia aplicației.

Directoarele speciale `.agents`, `.aws`, `.codex` și aparițiile lor sub `documentatie_tehnica/` au fost tratate ca suprafețe ale mediului de lucru/sandbox, nu ca sursă HUB AUTO. Ele nu apar în inventarul Git și nu trebuie incluse într-o operație de curățenie a proiectului fără verificarea mediului care le montează.

## 9. Documentație veche / contradictorie

| Cale | Categorie | Dovadă | Risc | Acțiune recomandată | Confirmare manuală |
|---|---|---|---|---|---|
| `documentatie_tehnica/00_OVERVIEW.md` | ACTIV DAR NECESITĂ CLARIFICARE | este snapshot din 12 octombrie și harta sa enumeră doar documentele `01`–`08`, deși există acum `09`–`16` | Mediu | actualizarea viitoare a hărții documentației, fără ștergerea istoricului | Da |
| `documentatie_tehnica/01`–`12` | ACTIV / ISTORIC CONTROLAT | documentează arhitectura și auditul de acces la data inițială; unele stări pot evolua după modificările ulterioare | Mediu | păstrare; orice concluzie operațională trebuie verificată cu codul curent | Nu pentru păstrare; Da pentru rescriere |
| `13_AUDIT_PERFORMANTA.md` | ISTORIC CONTROLAT | păstrează intenționat baseline-ul, dar conține marcaje explicite pentru problemele validate ulterior | Scăzut | păstrare împreună cu registrul `15` | Nu |
| `14_PLAN_OPTIMIZARE.md` | REFERINȚĂ / PLAN | include atât propuneri istorice, cât și statusuri actuale | Mediu dacă este citit fără status | păstrare; statusul curent se citește împreună cu `15` | Nu |
| `15_OPTIMIZARI_IMPLEMENTATE.md` | ACTIV | registrul canonic pentru optimizările implementate și validate | Ridicat | păstrare și actualizare după validări | Da |
| `clienti_notificari_demo/REGULI_CONSTRUCTIE_CLIENTS_REMINDERS.md` | REFERINȚĂ / ISTORIC | descrie explicit comportamente demo și butoane temporare; codul activ este între timp hibrid live/demo | Mediu | mutare viitoare într-o zonă clar etichetată „referință istorică” | Da |

La momentul auditului, întregul director `documentatie_tehnica/` apărea neurmărit de Git (`?? documentatie_tehnica/`). Documentele nu trebuie arhivate sau șterse; după revizuire, ele ar trebui adăugate într-un commit separat, dacă acesta este fluxul de versionare dorit.

## 10. Candidați pentru arhivare

Tabelul este ordonat aproximativ de la cel mai sigur la cel mai incert. „Arhivare” înseamnă păstrarea recuperabilă în afara sursei runtime, nu ștergere imediată.

| Prioritate | Cale | Categorie | Dovadă | Risc | Acțiune recomandată | Confirmare manuală |
|---:|---|---|---|---|---|---|
| 1 | `Untitled` | CANDIDAT PENTRU ARHIVARE | prompt istoric, fără referințe runtime, urmărit de Git | Scăzut | arhivare/eliminare din sursa publicabilă într-o misiune ulterioară | Da |
| 2 | `js/clienti-notificari.js.orig` | CANDIDAT PENTRU ARHIVARE | backup neîncărcat; istoricul există în Git | Scăzut | arhivare/eliminare ulterioară | Da |
| 3 | `modules/devize/clienti-notificari.html.orig` | CANDIDAT PENTRU ARHIVARE | backup neîncărcat | Scăzut | arhivare/eliminare ulterioară | Da |
| 4 | `supabase/.temp/cli-latest` | CANDIDAT PENTRU ARHIVARE / ARTEFACT GENERAT | conține numai `v2.117.0`, este cache CLI și nu are referințe | Scăzut | scoatere viitoare din Git și ignorarea `supabase/.temp/`, după confirmare | Da |
| 5 | `modules/stocuri/comenzi_piese.html` | CANDIDAT PENTRU ARHIVARE | placeholder nelegat și markup problematic | Scăzut–Mediu | verificare URL-uri directe, apoi arhivare | Da |
| 6 | `clienti_notificari_demo/` | CANDIDAT PENTRU ARHIVARE CA UNITATE | numai material de referință, fără dependență runtime | Scăzut–Mediu | mutare în arhivă/referințe, păstrând documentul și imaginile împreună | Da |
| 7 | setul de iconuri 72/96/144/152/384 | CANDIDAT PENTRU ARHIVARE / NECLAR | fără referințe locale | Scăzut | verificare PWA externă, apoi arhivare ca set | Da |
| 8 | `supabase/functions/vin-ocr-test/` | CANDIDAT PENTRU ELIMINARE LOCALĂ / NECLAR | director gol și neurmărit | Scăzut | confirmați dacă mai este rezervat | Da |
| 9 | `modules/admin/panou_control.html` | CANDIDAT PENTRU ARHIVARE / NECLAR | nelegat și parțial duplicat, dar funcțional și accesibil direct | Ridicat | audit funcțional și confirmarea utilizatorilor înainte de orice acțiune | Da, obligatoriu |

Nu există un al zecelea candidat distinct cu suficientă dovadă pentru a fi recomandat responsabil. Fișierele de print, manifestul Dezmembrări, CSS-ul comun și migrarea Supabase au fost explicit excluse din listă deoarece sunt active.

## 11. Elemente care NU trebuie atinse

1. `.git/`, referințele și istoricul Git;
2. `index.html`, inclusiv optimizările validate pentru badge-uri și căutarea globală;
3. `js/constatari_v2.js` și `modules/manager/manager.js`, care conțin optimizări validate dar încă apar modificate local;
4. `js/config.js`, `js/session-timeout.js` și `js/audit.js`;
5. toate paginile legate din navigația `index.html`;
6. `deviz-print.html` și `constatare-print.html`, deși nu sunt carduri în dashboard;
7. perechile/tripletele HTML–JS–CSS pentru C&N, Comenzi piese SH, Constatări, Manager și Dezmembrări;
8. `manifest.json`, `manifest-dz.json` și iconurile confirmate ca referite;
9. `vercel.json`, `supabase/config.toml`, funcția Edge Dezmembrări și helperul său Google Drive;
10. migrarea SQL locală și documentația tehnică `00`–`16`.

Codul inline mare din `index.html`, `admin.html`, `deviz_final.html` și paginile legacy este datorie de mentenanță, nu dovadă de cod mort. Nu a fost identificată o duplicare sigură între blocurile inline și fișierele JS externe care să permită eliminarea read-only a unui bloc.

## 12. Pași recomandați de curățenie

### Etapa A — confirmare fără modificări

1. confirmați dacă `panou_control.html` mai este accesat prin URL/bookmark;
2. confirmați dacă `modules/stocuri/comenzi_piese.html` mai este folosit direct;
3. confirmați dacă iconurile PWA neenumerate sunt consumate extern;
4. decideți dacă folderul demo C&N trebuie păstrat în repo sau într-o arhivă separată;
5. confirmați intenția directorului gol `vin-ocr-test/`;
6. decideți dacă documentația tehnică trebuie versionată în Git.

### Etapa B — arhivare recuperabilă

1. creați o locație de arhivă în afara rădăcinii publicabile;
2. mutați doar candidații aprobați, într-un commit dedicat;
3. nu combinați arhivarea cu refactor, optimizări sau schimbări Supabase;
4. păstrați un manifest al fișierelor arhivate și commitul-sursă;
5. rulați după fiecare lot un smoke test al rutelor și o verificare a linkurilor locale.

### Etapa C — igienă Git și documentație

1. adăugați `supabase/.temp/` în `.gitignore` numai după aprobarea eliminării cache-ului urmărit;
2. adăugați documentația într-un commit separat după revizuire;
3. salvați separat modificările funcționale validate din cele trei fișiere de cod;
4. actualizați harta din `00_OVERVIEW.md` pentru documentele `09`–`16`;
5. etichetați clar materialele demo/istorice pentru a nu fi confundate cu sursa activă.

### Etapa D — audituri viitoare separate

- coverage CSS în browser înainte de eliminarea selectorilor;
- inventar al rutelor accesate efectiv din logurile de hosting înainte de arhivarea paginilor nelegate;
- separarea datelor demo din Clienți & Notificări numai după înghețarea fluxului business;
- extragerea codului inline numai ca refactor dedicat, cu teste de regresie;
- reconcilierea migrărilor locale cu istoricul remote într-o misiune Supabase separată și aprobată.

## 13. Sinteză operațională

### 13.1 Top 10 candidați cei mai siguri pentru arhivare

Aceasta este o ordine relativă; fiecare acțiune necesită confirmare manuală.

1. `Untitled`;
2. `js/clienti-notificari.js.orig`;
3. `modules/devize/clienti-notificari.html.orig`;
4. `supabase/.temp/cli-latest`;
5. `modules/stocuri/comenzi_piese.html`;
6. `icons/72x72.png`;
7. `icons/96x96.png`;
8. `icons/144x144.png`;
9. `icons/152x152.png`;
10. `icons/384x384.png`.

Primele patru au cea mai bună dovadă statică. Placeholderul și iconurile rămân `NECLAR` față de accesul extern/direct.

### 13.2 Top 10 elemente care trebuie păstrate

1. `.git/` și `.gitignore`;
2. `index.html`;
3. `js/config.js`, `js/session-timeout.js`, `js/audit.js`;
4. paginile operaționale legate din dashboard;
5. `deviz-print.html` și `constatare-print.html`;
6. fișierele HTML–JS–CSS dedicate modulelor active;
7. `manifest.json`, `manifest-dz.json` și iconurile referite;
8. `vercel.json` și `AGENTS.md`;
9. `supabase/config.toml`, funcția Edge, helperul comun și migrarea SQL;
10. `documentatie_tehnica/00`–`16`.

### 13.3 Elemente care necesită confirmarea proprietarului

- folosirea directă a `modules/admin/panou_control.html`;
- folosirea directă a placeholderului `modules/stocuri/comenzi_piese.html`;
- păstrarea sau arhivarea fișierelor `.orig` și `Untitled`;
- folosirea externă a iconurilor 72/96/144/152/384;
- destinația folderului `clienti_notificari_demo/`;
- intenția pentru directorul gol `supabase/functions/vin-ocr-test/`;
- momentul în care Clienți & Notificări încetează să mai fie hibrid demo/live;
- dacă `documentatie_tehnica/` trebuie adăugat în Git;
- cum trebuie împărțite în commituri modificările locale deja validate;
- orice curățare de selectori CSS sau extragere a codului inline, care necesită testare runtime.

## 14. Verdict

Proiectul nu conține o cantitate mare de gunoi tehnic la nivel de fișiere. Curățenia cu risc mic este concentrată în câteva backupuri, un prompt istoric, un cache CLI, un placeholder și iconuri posibil istorice. Celelalte elemente aparent redundante au fie roluri runtime indirecte, fie un risc suficient de mare încât trebuie păstrate până la confirmarea utilizării reale.
