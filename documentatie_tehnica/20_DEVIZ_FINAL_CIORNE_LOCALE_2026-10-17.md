# Deviz final — recuperare automată a ciornelor locale

## Stadiu curent și sincronizare — 21.10.2026

RLS este activ în producție și LAB pe deviz_final_header/deviz_final_linii/devize și pe toate cele 36 tabele publice. Utilizatorul a confirmat testele reușite ale ultimelor trei Devize în producție; numerele automate din pachetul devize-rls-20261021 sunt numai LAB.

Ciornele rămân funcția locală documentată mai jos. Activarea RLS nu a modificat frontendul sau autentificarea și nu cere un nou sistem de ciorne. Citirile antet/linii, conflictul de versiune și salvarea prin RPC rămân fluxurile existente.

Registrul transferului este [23_INVENTAR_TRANSFER_PRODUCTIE.md](23_INVENTAR_TRANSFER_PRODUCTIE.md). Loginul LAB are modificări mixte ciorne + AUTH/Turnstile SUSPENDATE; se păstrează numai integrarea funcțională solicitată, fără refacerea loginului. Nu se copiază integral versiunea LAB sau configurația ei.

Nu s-au rerulat probele browser/PWA, timeoutul sau scenariile locale de ciorne în această rundă. Dovezile istorice își păstrează scopul, fără a deveni PASS producție pentru întreaga funcție. Stadiu general: [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Context istoric și detalii de implementare

Secțiunile de mai jos păstrează auditul și actualizările datate. Inventarele, numerele și formulările „actual/live” rămase în acest context nu sunt o nouă verificare a LAB sau a producției; stadiul documentat la 21.10.2026 este cel precizat mai sus.

Data: 17.10.2026. Mediu: `/home/aza/HUB AUTO/HUB_v2-LAB`.
Stare: implementare LAB, validare cu transport/date izolate. Fără commit, push, deploy, instalări de pachete, sincronizare cu producția sau mutații în baza reală. Utilizatorul a testat manual recuperarea și a raportat că izolarea pe cont și ștergerea confirmată funcționează. A cerut eliminarea confirmării redundante după „Continuă lucrul”. Aceste rezultate nu reprezintă acceptanța tuturor scenariilor funcției sau deploy în producție.

## 1. Integrare și contract păstrat

Pagina actuală `modules/devize/deviz_final.html` rămâne editorul. Salvarea manuală folosește în continuare `save_deviz_final`, fără schimbarea parametrilor RPC; crearea din Constatări și încărcarea URL `?id=...` rămân existente. Se păstrează secțiunile, ordinea rândurilor, discountul pieselor, acceptarea constatărilor, legăturile SH și avansurile importate separat. Recuperarea nu salvează în Supabase, nu revendică avansuri și nu actualizează comenzi SH. Nu se adaugă status de finalizare, cloud drafts sau ciorne în lista devizelor salvate. `deviz-print.html` și funcția de print rămân nemodificate.

La inspecție nu exista infrastructură IndexedDB pentru acest formular sau protecție generală `beforeunload` în DF. `currentDevizPrint` este un transport separat pentru print, nu este refolosit drept ciornă. Logout-ul existent elimină doar cheile de activitate, nu întregul localStorage. Noua avertizare de ieșire continuă să trateze ciorna drept lucru nesalvat în Supabase.

## 2. Snapshot și chei

Stocare: localStorage, JSON structurat, versiunea `1`. Prefix:

```text
hub:df-local:v1:<encodeURIComponent(project)>:<encodeURIComponent(userId)>:<draft UUID>:<revision UUID>
```

`project` este hostname-ul proiectului Supabase folosit de pagină; browserul aplică suplimentar izolarea pe origin. Nu se identifică documentele exclusiv prin înmatriculare. Un document nou primește UUID stabil pentru sesiunea de editare; un document salvat are și `documentId`. Documentele diferite păstrează ciorne distincte. Recuperarea într-un alt tab/sesiune de pagină folosește un UUID nou la prima editare efectivă și păstrează copia sursă până când există o copie nouă confirmată sau o salvare manuală reușită.

Înregistrarea conține `version`, `project`, `userId`, `id`, `owner` (UUID per instanță de stocare/tab), `revision`, `sequence`, `documentId`, `writtenAt` și `payload`. Cheile reviziilor sunt imuabile; actualizarea scrie o cheie nouă și curăță doar revizia exactă înlocuită. Dacă întreruperea lasă două revizii, lista alege ultima secvență a ciornei; ștergerea nu elimină o revizie mai nouă apărută între timp.

`payload` include:

- `data`: câmpurile antetului, tabul activ, lucrări/constatări/manoperă/piese în ordinea DOM, inclusiv rânduri goale/incomplete, valori și bife de acceptare/discount;
- `includeAvans`, lista avansurilor cu ID, sumă salvată/importată, datele disponibile și linkStatus, `vehicleId`, identificatorul devizului estimativ și `comandaPiesaShId` pe rând;
- `base`: proiecția de bază a antetului și semnăturilor de linii salvate, comparată canonic la recuperare;
- `savedAdvanceSignature`, pentru păstrarea regulii existente de print, `uncertainCreate`, pentru reconcilierea manuală existentă după un rezultat incert al creării, și `conflict`.

Snapshot-ul se citește din inputuri la momentul capturii, nu doar din `devizData`. Nu se salvează tokenuri, credențiale sau alte fișe de client. Comparația editabilă exclude totalurile derivate, numărul provizoriu DF, tabul activ singur și metadatele interne; încărcarea/recalcularea/restaurarea nu creează automat ciorne noi. Starea controalelor este totuși inclusă în copia unei modificări semnificative.

## 3. Scriere și feedback

- Debounce: 2 secunde după ultima editare; maximum 10 secunde de la prima modificare neprotejată în timpul tastării continue.
- Input/change, completarea programatică a antetului și observarea rândurilor/listelor acoperă adăugare, eliminare, reordonare, import SH/estimativ și selecție/eliminare avans. Tranzițiile anulează timerele și invalidează rezultatele vechi de import/lookup.
- Nu se repetă scrierea când payload-ul este identic. Revenirea completă la baza curată elimină copia devenită inutilă a aceleiași sesiuni.
- Flush best-effort la `visibilitychange` ascuns, `pagehide` și evenimentul sincron `hub:before-signout`, înainte de signOut/redirectul de inactivitate. Nu se bazează exclusiv pe unload.
- Mesajul „Ciornă păstrată pe acest dispozitiv · HH:mm” apare numai pentru o copie confirmată în storage. Quota, accesul blocat, serializarea și corupția produc avertizare discretă; salvarea manuală rămâne disponibilă.
- Nu există polling pentru copii și nu se apelează `HubSessionTimeout.reset`. Scrierile și evenimentele interne nu resetează activitatea utilizatorului. Durata de 30 minute pentru non-Admin și excepția Admin rămân neschimbate.

## 4. Recuperare după autentificare

Identitatea și permisiunea Deviz final sunt verificate înainte de listarea ciornelor. Admin este permis; pentru ceilalți se respectă `deviz_final` explicit, cu fallback `devize` numai dacă cheia nouă lipsește. Ciornele nu extind accesul la modul.

`index.html` oferă dialogul după sesiune/profil, înaintea redirectului Manager. Login păstrează `returnTo` și rutele rolurilor 6/8; pentru acestea oferă recuperare după autentificare/profil înainte de ruta existentă. Deviz final oferă direct recuperarea relevantă. Managerul reutilizează profilul deja verificat pentru intrarea locală, astfel încât ciornele să rămână descoperibile după redirectul automat din HUB.

Un singur dialog centrat: „Ai un deviz cu modificări nesalvate”. Identitatea afișată conține înmatricularea, DF formatat numai pentru un document salvat sau „Deviz nou”, plus ora ultimei copii. Mai multe ciorne folosesc o singură listă selectabilă. Textul complet este afișat separat, cu împachetare pe telefon. Focusul este capturat, Escape/X închid fără ștergere și focusul revine la elementul inițial.

- „Continuă lucrul”: selecția explicită autorizează recuperarea. Navigare cu `?localDraft=<UUID>` opac, fără conținutul documentului în URL; după autentificare și inițializare, ciorna nouă sau a unui deviz salvat cu baza neschimbată se deschide direct, fără al doilea dialog. Accesul direct la pagina DF fără selecție poate oferi un singur prompt cu aceeași acțiune. Textul normal este „Modificările au fost păstrate pe acest dispozitiv.”
- „Șterge ciorna”: confirmare separată, numai ciorna locală selectată/reviziile sale vechi, niciodată documentul din bază.
- „Ciorne locale”: intrare discretă temporară cât timp există ciorne relevante; fără tab permanent.

Suprimarea promptului automat folosește doar marcajul `hub:df-visit:<project>:<userId>` în sessionStorage, fără conținut personal. Login-ul reușit și logout-ul resetează marcajele vizitei, nu ciornele sau tokenurile. Revenirea în aceeași vizită nu lansează repetat popup; intrarea manuală rămâne disponibilă.

Un `?id=...` explicit nu este înlocuit cu o ciornă a altui document. Aceasta poate fi deschisă separat, cu acțiune explicită. Dacă formularul are deja modificări, un dialog permite păstrarea lucrului curent sau deschiderea ciornei într-un tab separat, fără a înlocui formularul. După deschiderea versiunii alese sau închiderea deciziei, selecția `localDraft` este consumată prin history.replaceState; un DF existent păstrează `?id=...`. Reload nu reaplică implicit o ciornă refuzată, iar marcajul vizitei împiedică repetarea promptului în aceeași vizită. Ciorna rămâne descoperibilă prin intrarea locală.

## 5. Conflicte, salvare și ciclul documentului

Pentru un DF existent se citește întâi antetul și liniile actuale. Se compară datele salvate curente cu `payload.base` original, nu cu `payload.data` editat. Diferențele firești ale ciornei nu sunt conflicte. Dacă baza este neschimbată, selecția se restaurează direct. Dacă documentul salvat chiar s-a schimbat, dialogul are:

- titlu: „Devizul a fost modificat între timp”;
- mesaj: „Versiunea salvată s-a schimbat după crearea ciornei tale. Alege ce dorești să deschizi.”;
- acțiuni: „Deschide ciorna mea” și „Deschide devizul salvat”.

Înaintea alegerii, formularul conține numai versiunea salvată citită. Versiunea locală este randată exclusiv la alegerea ei. Deschiderea versiunii salvate sau X/Escape păstrează ciorna recuperabilă și lasă formularul pe datele salvate. Nicio acțiune de deschidere nu salvează în bază și nu șterge ciorna. Un baseline absent/incompatibil primește un mesaj distinct de verificare, fără afirmația nejustificată că serverul s-a schimbat. Baza rămâne nemodificată până la salvarea manuală; nu există merge automat.

Flagul de conflict rămâne după restaurare. Înaintea salvării manuale a unei ciorne recuperate se reverifică documentul; un conflict cere confirmare explicită cu versiunile vizibile. Acesta este control frontend, nu lock tranzacțional în Supabase: o schimbare concurentă în intervalul dintre verificare și RPC rămâne posibilă, deoarece RPC-ul existent nu primește versiune de bază. Nu s-au schimbat contractul sau schema pentru optimistic locking.

Documentul negăsit, refuzul explicit de acces, eșecul conexiunii și alte erori de citire au mesaje distincte. Un SELECT reușit fără antet nu dovedește singur dacă documentul a fost șters sau ascuns prin acces; mesajul nu inventează această cauză. Toate păstrează ciorna și permit inspecția locală, fără recreare automată. Salvarea este blocată în această situație; o reluare ulterioară poate reverifica sursa. Butonul Deviz nou este o decizie distinctă a utilizatorului, nu o conversie automată a ciornei indisponibile.

La Deviz nou/încărcarea altui document, copia curentă este păstrată înainte de schimbarea identității și timerele sunt anulate. Dacă scrierea locală eșuează, tranziția cere confirmarea renunțării. În timpul salvării nu se schimbă documentul; tastarea poate continua, iar răspunsul RPC nu suprascrie noile inputuri.

Salvarea manuală reușită șterge numai revizia reprezentată de cererea trimisă. Editările noi făcute în timpul cererii sunt păstrate, primesc identitatea DF returnată și rămân nesalvate local. Erorile/rezultatele de rețea incerte păstrează copia și metadatele necesare reconcilerii existente. Nu se șterg ciornele altor documente/utilizatori/taburi.

## 6. Izolare și limite

- Conturile folosesc prefixe distincte; la schimbarea contului, controllerul vechi este oprit, dialogul este închis și formularul vechi este golit/blocat până la redeschidere. O schimbare în timpul inițializării invalidează rezultatul autentificării pentru ciorne.
- Fiecare tab/sesiune de pagină scrie o identitate proprie. Nu există două instanțe care rescriu aceeași cheie. `storage` și evenimentul local de schimbare actualizează intrările disponibile; tabul vechi nu poate șterge cheia unei revizii noi sau copia independentă a altui tab.
- Izolarea pe utilizator este logică în aplicație, nu criptare sau protecție împotriva accesului la profilul/discul browserului ori a scripturilor same-origin. Ciornele conțin date personale ale devizului și persistă după logout intenționat pentru recuperare. Pe dispozitive partajate, utilizați profiluri de browser separate și ștergeți ciornele explicit când nu mai sunt necesare.
- Origin = schemă + host + port; alt origin/profil/browser/calculator nu vede copia. Ștergerea storage-ului, modul privat, quota, politicile browserului, defectarea discului sau pierderea dispozitivului pot elimina protecția.
- O oprire brutală poate pierde tastele de după ultima scriere reușită; flush-ul este best-effort. Nu se promite recuperare după întreruperea alimentării înainte de efectuarea unei copii sau după defectarea mediului de stocare.
- Nu există expirare automată a ciornelor și nu se sincronizează conținutul lor cu producția/cloud.

## 7. Fișierele acestei intervenții

> **Domeniu — opt fișiere runtime modificate pentru ciorne, la 17.10.2026**, plus documentele interne din tabel. Nu este pachetul complet al noului Manager: CSS-ul său este prerechizit, iar reuniunea Manager + ciorne are nouă fișiere runtime. Listele de patru/șase din [18](18_MANAGER_DASHBOARD_REDESIGN.md)/[19](19_MANAGER_V2_FISIERE_DEPLOY.md) au scopuri mai restrânse. Clasificarea actuală, izolarea LAB și loginul MIXT/HOLD sunt în [23](23_INVENTAR_TRANSFER_PRODUCTIE.md); lista istorică nu aprobă copierea integrală a loginului sau a configurației LAB.

Căi complete relative la rădăcina LAB; numai acestea sunt create/modificate pentru funcție. Diferențele preexistente din alte fișiere sunt păstrate.

| Fișier | Tip | Rol | Copiere viitoare după aprobare |
|---|---|---|---|
| `js/local-deviz-drafts.js` | nou | Storage versionat, revizii/taburi, editor și dialog comun | DA, nou |
| `css/local-deviz-drafts.css` | nou | Stil dialog, focus și intrare compactă | DA, nou |
| `modules/devize/deviz_final.html` | modificat | Snapshot inputuri, lifecycle, restaurare/conflicte și salvare sigură | DA, înlocuiește |
| `js/session-timeout.js` | modificat | Eveniment sincron înainte de signOut/redirect, fără schimbarea timeout-ului | DA, înlocuiește |
| `index.html` | modificat | Recuperare după profil și înainte de redirect Manager; flush la logout explicit | DA, înlocuiește |
| `modules/admin/login.html` | modificat | Vizită nouă; recuperare pe traseele rolurilor 6/8, rute existente păstrate | DA, înlocuiește |
| `modules/manager/manager.html` | modificat | Include helperul/stilul comun pe landing Manager | DA, înlocuiește |
| `modules/manager/manager.js` | modificat | Intrare locală pe profilul deja verificat, fără modificarea KPI/plăților/search | DA, înlocuiește |
| `documentatie_tehnica/02_MODULE.md` | modificat | Inventarul funcției și legătura la acest jurnal | NU, document intern |
| `documentatie_tehnica/19_MANAGER_V2_FISIERE_DEPLOY.md` | modificat | Dependențele noi ale intrării de recuperare din Manager | NU, document intern |
| `documentatie_tehnica/20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md` | nou | Jurnal, schema locală, lifecycle, teste și acceptanță | NU, document intern |

Nu se modifică `modules/devize/deviz-print.html`, `modules/manager/manager.css`, configurația Supabase, SQL-uri/migrații, listele de devize salvate sau checkout-ul de producție.

Cele opt fișiere funcționale ale funcției se livrează împreună, preferabil atomic. Dacă se aprobă ulterior o copiere etapizată: întâi cele două resurse noi JS/CSS, apoi timeout-ul comun, apoi paginile/editorul/login/Manager și indexul compatibil, într-o fereastră controlată. Manager JS este comun și cu căutarea HUB; indexul și Manager HTML folosesc aceeași versiune `v=20261017-drafts`. CSS-ul Manager existent este prerechizit nemodificat. Dacă producția nu are încă Managerul nou, include și `modules/manager/manager.css` din livrarea documentului 19; acesta nu a fost modificat în această intervenție. Pentru rollback se restaurează împreună fișierele funcționale anterioare, păstrând ciornele locale; nu se execută SQL și nu se transferă cheile storage între medii.

## 8. Verificări efectuate și limite ale testării

Instrumente deja disponibile, fără instalări. Testele/snapshot-urile sunt în directorul conversației, în afara LAB. Chrome headless folosește contexte/profiluri temporare noi; toate cererile sunt interceptate, răspunsurile și RPC-urile sunt simulate. Nu sunt folosite sau șterse ciorne reale și nu se execută mutații în Supabase. CDN-urile sunt neutralizate: verificarea vizuală se limitează la dialogul nou cu CSS propriu, nu constituie validare a întregii pagini Tailwind live.

- 25 scenarii browser: inițializare fără ciornă, tastare fără blur/debounce, redeschidere, DF existent/conflict, documente multiple, rânduri incomplete/ordonate + ID-uri SH/avans și date, tastare continuă cu plafon 10s, salvare reușită, editări în timpul cererii, eșec/rezultat incert, quota/corupție, document șters, două taburi și salvare veche, schimbare cont, Escape/ștergere confirmată, flush de inactivitate/login/HUB, redirect Manager și intrarea redeschisă, ruta rolului 8, URL explicit, schimbare server după restaurare, suprimare pe vizită, permisiune refuzată, deduplicare, restaurare fără scriere și conflict persistent, dialog telefon/focus tastatură și snapshot structurat deteriorat fără înlocuirea formularului.
- 7 probe storage: namespace utilizator/proiect, revizie nouă protejată de ștergere veche, resturi după întreruperea între revizii, serializare eșuată, intrări corupte, versiune necunoscută păstrată și curățare exclusivă a marcajelor vizitei.
- Sintaxa JS extern/inline și `git diff --check`; comparație de inventar și hash pentru verificarea limitelor intervenției și a printului nemodificat.

Autodeconectarea este testată prin apelul acțiunii existente de logout, fără a aștepta 30 minute reale; intervalul și regulile sunt inspectate static. Redeschiderea este simulată prin navigarea/reîncărcarea paginii fără salvare DB. Nu s-a oprit calculatorul, nu s-au închis sesiuni ale utilizatorului și nu s-a simulat defectarea discului.

## 9. Acceptanță manuală rămasă

1. În LAB, cu un cont autorizat, completează un DF nou, inclusiv un rând incomplet; tastează fără blur și așteaptă mesajul local. Închide/redeschide numai tabul de test și continuă ciorna fără salvare DB.
2. Repetă pe un deviz salvat cu discount, SH și avans; verifică rândurile, ordinea, ID-urile și totalurile/restul recalculat. Verifică printul existent separat, fără schimbarea comportamentului.
3. Verifică logout/relogin și, pe non-Admin, inactivitatea reală de 30 minute; copia trebuie să fie oferită după login și descoperibilă după X/Escape, inclusiv în landing Manager. Verifică și ruta rolului 6/`returnTo` în configurația reală.
4. Folosește două conturi și două taburi de test: conturile nu văd ciornele celuilalt; taburile păstrează copii separate. Șterge doar ciorna de test selectată, după confirmare.
5. Cu mutații de test autorizate de utilizator, verifică salvare manuală, status local curat și păstrarea tastelor noi în timpul unei cereri lente. Verifică document schimbat/indisponibil și refuzul rețelei fără pierdere locală. Nu folosi documente reale importante pentru testele destructive.
6. Verifică în browserul/PWA și originul folosit efectiv, cu CDN-urile reale: desktop/telefon, focus, mesaje, quota și disponibilitatea storage-ului. Repetă verificările relevante după orice viitor deploy.

## 10. Simplificare UX și protecție la ștergere — 17.10.2026

Cererea utilizatorului: reluare din HUB într-un singur click pentru cazurile normale, păstrând izolarea și salvarea atomică manuală. Raportul manual confirmă funcționarea izolării pe cont și a ștergerii confirmate; nu constituie dovadă pentru toate cazurile de eroare/concurență.

**Investigația butoanelor vechi:** înainte de editare, două probe Chrome cu valori distincte (deviz nou și existent) au verificat că „Păstrează versiunea curentă” nu apela restaurarea: câmpurile rămâneau pe formularul nou/server, inclusiv după așteptarea temporizatorului. „Încarcă versiunea locală” încărca datele locale distincte. Nu s-a reprodus raportul că ambele ar deschide aceeași ciornă; cauza exactă a observației manuale rămâne neconfirmată. Confirmarea redundantă exista totuși pentru ambele tipuri de document și a fost eliminată. Testele noi verifică separat că un conflict real nu aplică ciorna înaintea deciziei.

**Defect separat confirmat în cod:** ștergerea din dialog elimina storage-ul, dar editorul activ păstra recordul și temporizatoarele. Un flush ulterior putea recrea ciorna. Ștergerea explicită folosește acum un marcaj local separat de curățarea obișnuită a reviziilor:

```text
hub:df-discard:v1:<encodeURIComponent(project)>:<encodeURIComponent(userId)>:<draft UUID>
```

Valoare JSON: `{owner, sequence}`; fără date de client, conținut de deviz sau tokenuri. Marchează numai reviziile acelui proprietar până la secvența confirmată pentru ștergere, nu revizii mai noi. Marcajul este confirmat înainte de eliminarea copiei; dacă storage-ul eșuează, nu se pretinde ștergere sigură. Nu expiră automat, pentru a împiedica regenerarea de către taburi vechi. Schema snapshot-ului rămâne versiunea 1.

Evenimentul local `hub:df-draft-discarded`, evenimentele storage din alte taburi și reverificarea sincronă la flush anulează timerele copiei șterse. Visibility/pagehide, debounce și manual flush nu o recreează. Formularul rămâne nesalvat și avertizarea de ieșire rămâne activă; o nouă editare semnificativă a utilizatorului poate începe intenționat o copie cu UUID nou. Curățarea unei revizii la scriere sau salvare manuală nu este confundată cu ștergerea explicită. Înainte de restaurare și după deciziile asincrone se verifică existența exactă a selecției; o copie ștearsă în timpul dialogului nu este aplicată. Dacă ștergerea ajunge chiar între randare și atașarea copiei, se reface formularul anterior și nu se generează o ciornă nouă din datele șterse.

Fișiere modificate exclusiv în această ajustare (față de implementarea deja existentă):

| Fișier | Rolul ajustării | Deploy viitor |
|---|---|---|
| `js/local-deviz-drafts.js` | Text normal simplificat; ștergere explicită și protecție contra temporizatoarelor/taburilor vechi; marcaj vizită | Funcțional, înlocuiește |
| `modules/devize/deviz_final.html` | Reluare directă; decizie doar pentru risc real; mesaje distincte; consumarea selecției URL | Funcțional, înlocuiește |
| `index.html` | Numai versiunea URL a helperului comun | Funcțional, înlocuiește |
| `modules/admin/login.html` | Numai versiunea URL a helperului comun | Funcțional, înlocuiește |
| `modules/manager/manager.html` | Numai versiunea URL a helperului comun | Funcțional, înlocuiește |
| `documentatie_tehnica/20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md` | Starea UX, investigația, marcajul de ștergere și testele efective | Intern, fără deploy funcțional |

Cele patru intrări folosesc helperul `v=20261017-ux`; stilul și schema ciornei rămân cele existente. Lista completă a funcției din secțiunea 7 rămâne valabilă pentru livrarea inițială. Nu se modifică auth, permisiunile, timeout-ul, KPI/search/plățile Manager, printul, RPC-ul manual, schema Supabase sau fișierele SQL. Reîncarcă taburile existente pentru a primi noua logică înainte de a testa ștergerea între taburi.

Validare automată pentru această ajustare: 20 scenarii Chrome izolate și 10 probe storage, cu cereri și mutații simulate, fără sesiuni/ciorne reale. Scenariile acoperă HUB → Continuă pentru deviz nou/existent neschimbat, ambele alegeri la conflict real, lipsa aplicării locale înainte de decizie, Escape, păstrarea ciornei după deschiderea versiunii salvate/reload, acces direct cu un singur prompt, cont diferit, ștergere confirmată + temporizator/pagehide/reload, anularea ștergerii, ștergere din alt tab și reîncepere numai după editare nouă, lucru nesalvat diferit, erori distincte negăsit/rețea/acces, ștergere în timpul conflictului, ordinea rândurilor și ID-uri SH/avans, salvare atomică manuală cu editări în curs, succes/eșec și reluarea ciornei deja deschise fără pierderea tastelor noi și ștergerea la limita finală a restaurării, cu rollback local. Probele storage verifică suplimentar marcajele de ștergere, revizia mai nouă păstrată și diferența față de curățarea reviziilor.

Testele rămân în directorul conversației, în afara LAB; nu sunt fișiere de deploy. Verificările de sintaxă, git diff --check și inventarul de hash-uri confirmă limitele modificării. Rămâne de repetat manual în browserul/PWA real: un click din HUB pentru deviz nou/existent, ambele alegeri la conflict autentic și ștergere + reload cu două taburi reîncărcate. Testele istorice din secțiunea 8 nu sunt prezentate ca o nouă rulare integrală în această ajustare.
