# HUB AUTO v2 — Evidență Facturi & Piese
## Plan de dezvoltare și specificație funcțională DEMO — istoric LAB și stare locală

**Versiune document:** 2.5 — backend producție verificat read-only

**Specificație LAB:** 25.10.2026; **reconciliere statică în repository-ul principal:** 03.11.2026

**Statut:** document de lucru, actualizabil pe măsură ce apar cerințe și feedback  
**Modul:** `Evidență Facturi & Piese` — frontend persistent local; backendul EP este instalat în producție
**Responsabilitatea documentului:** descrie ce există, ce trebuie păstrat, ce este propus și ce necesită validare; **nu** autorizează automat schimbarea codului sau a bazei de date.

> **Regula principală:** la fiecare sarcină se verifică directorul, branch-ul activ, mediul și fișierele autorizate. Repository-ul principal este `/media/aza/Depozit_Mint/HUB_v2`; mirror-ul `/home/aza/HUB AUTO/HUB_v2-LAB` este separat. Folosirea obligatorie a LAB din etapele vechi descrie acele intervenții și nu autorizează transferuri sau modificări în alt mediu.

### Resetare atribuire și anulare magazie — candidat local 06.11.2026

Implementare locală pe `feature-responsive`; necesită
[migrarea nouă și contractul din 03](../03_SUPABASE.md#candidat-local-ep-eliberarea-cantităților--06112026-neaplicat),
**neaplicată în producție**. Nu se reaplică cele trei consolidări istorice EP.

- **Resetează atribuirea** apare în stânga footerului numai la corectarea unei
  alocări existente, opus butoanelor Anulează/Salvează. Confirmarea eliberează
  cantitatea salvată a alocării, independent de editările nesalvate din modal,
  și păstrează linia facturii. DF-ul salvat, returul, transferul activ sau
  blocajul istoric refuză resetarea integrală.
- **Anulează trimiterea** apare în detaliile trimiterii din panoul piesei/facturii.
  După confirmare anulează întreaga înregistrare selectată, inclusiv când ea
  reprezintă numai o parte din cantitatea piesei/alocării. Revine strict acea
  cantitate în **De atribuit**, inclusiv pentru sursa auto; restul alocării,
  alte transferuri, retururi și cantitățile DF rămân păstrate.
- Trimiterile anulate și atribuirile eliberate rămân în istoric până la eliminarea
  explicită a liniei/facturii, apoi sunt păstrate în audit. Anulările nu
  intră în KPI-ul magaziei, disponibilul activ sau calculele de destinație.
  Dacă anularea lasă o alocare parțială cu istoric, sursa nu se rescrie prin
  corectare; restul liber poate fi resetat dacă nu este protejat. Pentru o altă
  mașină se creează o atribuire nouă din cantitatea eliberată.
- Nicio eliberare optimistă în UI: interfața se actualizează după RPC și
  reîncărcarea registrului. Refuzurile se afișează, iar răspunsurile incerte
  folosesc recuperarea existentă cu același UUID/payload.
- **Editează factura → elimină poziția → salvează** funcționează după resetarea
  unei alocări nefolosite sau anularea trimiterii, inclusiv dintr-o alocare auto,
  dacă nu mai există altă dependență activă/protejată. Rămâne regula existentă
  de minimum o poziție în editor; documentul întreg se elimină prin acțiunea dedicată.
- **Șterge factura**, lângă **Editează factura**, explică în română blocajele
  pe fiecare poziție. DF-ul salvat, returul, istoricul financiar protejat,
  atribuirea activă și trimiterea activă refuză operația. Nu se resetează/anulează
  nimic automat. După rezolvarea manuală a operațiilor eligibile, confirmarea
  explicită permite ștergerea atomică a antetului și tuturor pozițiilor;
  facturile și piesele se reîncarcă din backend. Istoricul inactiv eliminat se
  păstrează în audit conform [contractului din 03](../03_SUPABASE.md#candidat-local-ep-eliberarea-cantităților--06112026-neaplicat).

**Probe locale:** [SQL](../../tests/ep_release_db.py) — **79 PASS** pe PostgreSQL
16.2 temporar, cu test de concurență pe două conexiuni; [Chrome](../../tests/ep_release_ui.cjs)
— **23 PASS**, [ștergere și eliminare linii în Chrome](../../tests/ep_invoice_delete_ui.cjs)
— **25 PASS**, SDK/Auth simulate; [regresii EP/DF](../../tests/ep_df_ux.cjs)
— **64 PASS**. Confirmări, cantități parțiale/integrale, transferuri multiple,
consum DF, retur, revizie veche, retry/audit, alocări arhivate, refuz fără mutație
optimistă, confirmarea/refuzul ștergerii, actualizarea ambelor liste, recuperarea
ștergerii după răspuns incert, discount/avans/print și Enter/Tab. Capturile 1440/390 px ale modalului
au fost inspectate: reset în stânga pe desktop, accesibil pe mobil fără overflow.
Sintaxă JS, legături noi și `git diff --check`: PASS.

Reluare locală: `python3 tests/ep_release_db.py` cu `pgserver` și
`psycopg2-binary` disponibile; Node ≥20 + Playwright/Chrome pentru
`node tests/ep_release_ui.cjs`, `node tests/ep_invoice_delete_ui.cjs` și `node tests/ep_df_ux.cjs`.
Testele folosesc `/tmp` și transport simulat, fără credențiale/date de producție.
**NEEDS_REVIEW:** PostgreSQL 17/Supabase, sesiuni reale Admin/operator și recepția
pe dispozitivele țintă. Nu s-au aplicat SQL în producție, commit, push sau deploy.

### Corecții UX locale — 06.11.2026

Implementate pe `feature-responsive`, verificate în Chrome local cu SDK și date
fictive; fără migrare, scrieri DB, commit/push/deploy:

- La change/blur/Tab pe numărul din atribuirea EP, modelul se citește din
  `clienti_vehicule.marca_model`. Alocările EP rămân fallback când fișa lipsește,
  este ambiguă sau nu poate fi citită. Editările manuale și modelul existent la
  corectare sunt păstrate; răspunsurile pentru alt număr/dialog închis sunt ignorate.
- Importul **din facturi în pagina DF** propune întreaga cantitate disponibilă
  pentru fiecare sursă; cantitatea poate fi redusă înainte și după import.
  La depășire, mesajul inline arată cantitatea cerută și cea disponibilă.
  Toate pozițiile selectate sunt validate înaintea adăugării primei piese;
  un lot invalid rămâne integral neimportat, fără trunchiere. UUID-urile,
  snapshot-ul de preț și confirmarea atomică prin salvarea DF se păstrează.
- Validarea atribuirii EP arată de asemenea cantitatea cerută/disponibilă și
  păstrează excluderea retururilor, magaziei și consumului DF din disponibil.

Fallback-ul vehicul/client din antetul DF este descris în
[02 Module](../02_MODULE.md#33-deviz-final).
Catalogul producției a fost recitit **read-only** în această intervenție:
`clienti`/`clienti_vehicule` au RLS ON, grant SELECT pentru `authenticated`,
iar politicile SELECT cer Admin sau `clienti_notificari` prin
`private.has_hub_permission`. Grantul anon nu acordă acces la rânduri în lipsa
unei politici anon. Nu s-au modificat accesul, rolurile sau politicile.
Verificări punctuale de existență, fără exportul numelor/VIN-urilor:
B400CIR are model/VIN în `devize`, iar ambele exemple B400CIR și CT44ELD au
fișă vehicul cu model/VIN și client legat. CT44ELD nu a avut model/VIN împreună
în sursele istorice interogate.

**Probe:** [tests/ep_df_ux.cjs](../../tests/ep_df_ux.cjs) — **64 PASS** în Chrome:
cele patru corecții, ordinea istoricului, Enter/Tab, câmpuri manuale, răspunsuri
întârziate/refuzate, cantități integrale/parțiale/invalide, duplicate,
retur/magazie/alocări protejate, snapshot/rotunjire, discount, linii manuale,
avans/guard print, payload de salvare și randarea paginii print.
Sintaxa JS/scriptului inline DF și `git diff --check`: PASS.
Reluare din rădăcina proiectului cu Node ≥20, Playwright disponibil în
`NODE_PATH` și Chrome (`CHROME_BIN` opțional): `node tests/ep_df_ux.cjs`.

**NEEDS_REVIEW:** acceptanță cu sesiune reală Admin/operator, autorizarea efectivă
pentru profilurile țintă, scrieri/importuri/concurență în backend, dispozitive și
print fizic. Browserul de test interceptează toate cererile; serviciile și
scripturile CDN sunt simulate, deci nu certifică stilurile Tailwind, aspectul
responsive complet sau frontendul publicat. Probele DB sunt numai citiri de
catalog și existență; nu sunt teste live de salvare. Corecțiile nu au fost publicate.

### Stare curentă — verificare finală 05.11.2026

Backendul EP este instalat, confirmat read-only prin catalog, probe SQL cu roluri
și HTTP anonim. [Dovezi, contracte și limite](../03_SUPABASE.md#ep-productie-verificat-20261105).
Frontendul transferat este compatibil static; nu s-a publicat. Browserul cu sesiune
reală, salvările/importurile/concurența și restore-ul real al backupului rămân
NEEDS_REVIEW. Nu se reaplică SQL-urile. Niciun cod sau date de business modificate.

### Istoric: transfer local în feature-responsive — 05.11.2026

Această secțiune înlocuiește descrierea DEMO ca stare a surselor locale. Corpul
vechi și probele LAB de mai jos sunt păstrate ca istoric. Sursa transferului:
LAB v2.3, §0.14 și navigarea finală din handoff-ul LAB, cu hash-uri verificate.

**Stare la transfer, înaintea migrării: candidat local, backend neaplicat, fără deploy.**
Cele nouă runtime sunt transferate punctual; configurația destinației și codul
Admin/autentificare fără legătură cu EP sunt păstrate. Guard-urile din ambii
adaptori acceptă exclusiv proiectul destinației. Modulul este în BIROU după
Căutare Deviz, turcoaz/NEW, în sidebar și carduri.

Candidatul păstrează facturi editabile, alocări fără fișă auto obligatorie,
retururi și rezervare pentru magazie, status fizic manual și coeficient Admin.
Importul real se face din Deviz Final: parțial/multiplu, snapshot istoric,
UUID/revizii, cerere idempotentă și protecție cantitativă comună cu retur/magazie.
Liniile manuale, discountul, avansul și tipărirea își păstrează regulile existente.
Recepția în stoc, montajul și anulările retururilor/transferurilor rămân în afara etapei.

Probe efectuate în această lucrare: **64 verificări statice,
37 regresii SQL, 34 verificări Chrome EP/DF/print,
118 verificări navigație/responsive**. SQL-ul și browserul financiar
folosesc exclusiv PostgreSQL izolat local, Auth/SDK simulate; navigarea folosește
fixture locală. Nicio probă nu scrie în backendul de producție. Capturile au fost
inspectate; rezultatele LAB mai vechi nu sunt atribuite destinației sau producției.

Preflight-ul read-only al producției este în [03](../03_SUPABASE.md#preflight-ep-producție--05112026-read-only).
Ordinea SQL, inventarul/hash-urile, backupul, comenzile de reluare și pașii rămași
sunt în [HANDOFF_CODEX.md](../../HANDOFF_CODEX.md), iar probele exacte în
[manifestul transferului](TRANSFER_FEATURE_RESPONSIVE_20261105.json).
**Restanțe consemnate la transfer (starea curentă este mai sus):** validare PostgreSQL 17/Supabase izolat, tranzacții concurente
independente/HTTP, scheme Data API, backup și aprobare de migrare/publicare,
acceptanță autentificată pe țintă, Firefox/imprimantă/dispozitive și volum.

### Istoric: stare locală inspectată static — 03.11.2026

Sursele conțin meniul/cardul DEMO din HUB, linkul `.ep-back-hub` cu
`href="../../index.html"`, facturi/furnizori, alocări/retururi cantitative,
import DF simulat, trimiterea în magazie prin `DATA.warehouseTransfers`, KPI și
prezentarea distinctă a situației pieselor/documentului. Datele sunt fictive,
în memorie; nu există persistență Supabase sau import în Deviz Final real.

Publicarea DEMO și testele vizuale raportate în etapele vechi rămân confirmări
istorice, fără test nou în acest checkout. Rezultatele DOM/static din 25.10
sunt numai dovezi LAB; browserul, publicarea și orice stare live sunt **NEEDS_REVIEW**.

`CORECTARI_EVIDENTA_PIESE.md` și `README_DEMO_EVIDENTA_PIESE.md` sunt referințe
istorice externe, **indisponibile în acest checkout**; nu constituie lecturi
obligatorii locale și nu se recreează. Prototipul local `referinte/demo2_claude.html`
rămâne referință UX, distinct de modulul activ.

---

## 1. Scopul modulului

Înlocuirea căutării manuale prin facturile furnizorilor cu un circuit digital de evidență:

**Furnizor → Factură → Poziție de piesă → Cantități/alocări pe mașini → Retur sau utilizare → Deviz Final**.

### Problema de rezolvat

În prezent, pe facturile fizice se notează uneori cu creionul numărul mașinii pentru care au fost cumpărate piesele. O factură poate avea piese pentru mai multe mașini, iar unele nu au o mașină cunoscută când sosesc. La întocmirea DF, colegii caută prin teancul de facturi ca să identifice piesele și prețul de achiziție. Pot apărea discuții legate de piesele date retur sau neridicate de agent.

**Obiectiv:** găsirea rapidă a pieselor după mașină, factură, furnizor, cod sau denumire; trasabilitate pe cantitate, fără pierderea facturii originale.

### Ce NU este acest modul

- Nu este program de contabilitate.
- Nu înlocuiește de unul singur gestiunea de magazie.
- În stadiul actual **DEMO**, nu scrie în Supabase și **nu importă efectiv în DF real**.
- Alocarea unei piese la o mașină nu dovedește că piesa a fost montată.

---

## 2. Locație, fișiere și medii

### 2.1. DEMO în sursele locale — publicare raportată istoric

```text
HUB_v2/
├── index.html                                # meniu și card Evidență Piese · DEMO
├── modules/stocuri/evidenta_piese.html
├── css/evidenta_piese.css
└── js/evidenta_piese.js
```

Sursele HUB trimit la această pagină cu marcaj DEMO, iar datele demonstrative sunt fictive. Linkul local de întoarcere la HUB este deja prezent în antet, conform §3.11; afirmația anterioară despre poziționarea veche descria etapa inițială, nu sursa curentă. Navigarea efectivă în browser nu a fost retestată.

### 2.2. Mirror LAB — exemplu istoric de organizare

```text
HUB_v2-LAB/
├── index.html
├── modules/stocuri/evidenta_piese.html
├── css/evidenta_piese.css
├── js/evidenta_piese.js
└── documentatie_tehnica/evidenta_piese/
    ├── PLAN_EVIDENTA_PIESE.md               # ACEST document
    └── CORECTARI_EVIDENTA_PIESE.md          # referință istorică; absentă din checkout-ul principal
```

- Pentru o sarcină nouă, sursele checkout-ului autorizat sunt punctul de plecare; versiunile publicate și copiile LAB nu se presupun identice cu acestea.
- Păstrăm structura existentă a proiectului: HTML, CSS, JavaScript Vanilla, fără framework nou.
- Căile relative din HTML integrat sunt `../../css/evidenta_piese.css` și `../../js/evidenta_piese.js`.
- `CORECTARI_EVIDENTA_PIESE.md` este indisponibil aici; se păstrează ca nume istoric, fără a presupune conținutul sau versiunea sa.
- Folderul originar de prototip `WORKSPACE LOCAL/Evidență Facturi` este referință externă istorică, fără copie în acest checkout; nu devine o a doua sursă activă de modificări.

---

## 3. Stadiul funcțional la 24.10.2026

**Notă despre verificare:** lista de mai jos rezumă implementările raportate de Codex și testele vizuale descrise de utilizator. Nu reprezintă un audit independent, linie cu linie, al ultimului commit publicat. La începerea unui task, Codex inspectează fișierele actuale din checkout-ul și mediul autorizate.

| Etapă | Funcționalitate | Stadiu |
|---|---|---|
| 2.1 | Înregistrare factură cu mai multe poziții | Implementată DEMO |
| 2.2 | Adăugare și editare furnizori | Implementată DEMO |
| 2.3 | Atribuire individuală, multiplă și corectare | Implementată DEMO |
| 2.4 | Atribuire parțială a cantităților către mașini diferite | Implementată DEMO; testată vizual |
| 2.5 | Retururi parțiale și urmărirea etapelor | Implementată DEMO; fluxul complet testat vizual |
| 2.6 | Import **simulat** în Deviz Final | Implementat DEMO; testat vizual |
| UX | Modal compact; cantitate implicită 1; filtrare contextuală a mașinilor; ascundere ID-uri tehnice | Raportate implementate; testate vizual principalele fluxuri |
| HUB | Modul în meniu, badge galben `DEMO`, navigare înapoi | Publicat și raportat funcțional |

### 3.1. Navigare și interfață

- Tema dark HUB, interfață densă și aerisită fără carduri supradimensionate.
- Cinci taburi: **Piese**, **De atribuit**, **Facturi**, **Furnizori**, **Retururi**.
- Layout desktop listă + detalii aproximativ **70/30**; adaptare la mobil.
- Căutare, filtre, indicatori, mesaje de validare și panouri de detaliu.
- Etichetă vizibilă `DEMO` și avertisment că datele se resetează la refresh.

### 3.2. Facturi

- Factură nouă: furnizor, număr, dată, stare document, observații și mai multe poziții de piese.
- Pentru fiecare poziție: denumire, cod (opțional), cantitate, preț unitar de achiziție **cu TVA inclus** și mașină opțională.
- Prețurile de achiziție nu includ adaos comercial; totalurile facturii se păstrează independent de atribuirile ulterioare.
- În datele DEMO există facturi istorice cu TVA 19%, iar pentru facturi noi este folosit implicit 21%. **Acest comportament nu substituie o regulă fiscală validată pentru producție.**
- Număr factură normalizat cu majuscule; calendar în română, afișare dată `ZZ.LL.AAAA`, stocare logică ISO.
- Statusul fizic al facturii este separat de statusurile pieselor: `În firmă`, `Pregătită pentru contabilitate`, `Trimisă în contabilitate`.
- Crearea este confirmată în DEMO; eventualele operații suplimentare de editare/ștergere trebuie re-verificate în cod înainte de a fi promise colegilor.

### 3.3. Furnizori

- Adăugare și editare date: nume, CUI, registrul comerțului, persoană contact, oraș, telefon, e-mail, adresă, conturi/IBAN multiple, observații.
- Validări pentru date și duplicate (inclusiv CUI); normalizare pentru CUI/registru/IBAN.
- Câmpurile au fost păstrate intenționat pentru testele colegilor; reducerea lor rămâne o decizie de UX.

### 3.4. Atribuiri de piese pe mașini

- O poziție de factură poate avea **mai multe alocări cantitative** la numere diferite, fără a fi spartă în poziții financiare duplicate.
- Atribuire individuală / bulk; corectarea unei alocări nu trebuie să o modifice pe cealaltă.
- În modalul individual, **cantitatea implicită este 1 buc.**, cu maximum egal cu disponibilul eligibil.
- Număr auto normalizat: `ct 11-aaa` → `CT11AAA`.
- Modelul mașinii este opțional; completarea automată pe baza altor alocări pentru același număr este o posibilitate de verificat în cod, nu o cerință considerată finalizată.
- Pozițiile parțial neatribuite rămân în **De atribuit** până la distribuirea cantității eligibile.
- Căutarea recunoaște oricare dintre numerele auto cărora le-au fost alocate bucăți.

**Exemplu obligatoriu:** `FA-1101`, Filtru ulei Mann, `2 buc. × 32,50 lei = 65,00 lei`.

```text
Factură: o singură poziție — 2 buc., 65,00 lei
Alocare 1: CT11AAA — 1 buc.
Alocare 2: CT22BBB — 1 buc.
Rest neatribuit: 0 buc.
Total factură: NESCHIMBAT
```

### 3.5. Retururi

- Retur parțial din cantitatea nealocată sau dintr-o alocare identificată.
- Etape: **Cerere trimisă → Așteaptă ridicare → Ridicat → Finalizat**.
- Returul rezervă imediat cantitatea; bucățile rezervate/finalizate nu pot fi realocate și nu reintră automat în disponibil.
- Retururi multiple pe aceeași poziție, fără rezervări suprapuse, cu cod propriu, motiv, referință și date ale etapelor.
- Cererea reală către furnizor se face **în afara HUB**; aplicația urmărește intern situația.
- Cantitatea originală, prețul și totalul facturii nu sunt modificate de retur.
- Pentru trasabilitate, corectarea alocărilor implicate în retur este protejată; nu elimina protecția fără flux clar de anulare/corecție.

### 3.6. Import DF — simulare, NU integrare reală

- Poate fi deschis global sau contextual, din detaliile unei piese.
- În importul contextual sunt afișate **doar mașinile cu alocări eligibile ale piesei respective**; dacă este una singură, este selectată automat.
- Pot fi alese piese/cantități eligibile, cu previzualizarea costului de achiziție cu TVA.
- Sunt create referințe fictive `DEMO-DF-001`, `DEMO-DF-002` etc., disponibile pentru consultare în aceeași sesiune.
- Nu se poate importa de două ori aceeași cantitate; nu se importă bucăți rezervate/returnate ori deja legate de DF istoric.
- Alocările implicate în importul demonstrativ sunt protejate de corecții care ar invalida importul.
- Importul **nu înseamnă montaj**. Costul de achiziție nu este automat preț de vânzare.
- După epuizarea cantității eligibile, acțiunea de import contextual poate deveni indisponibilă: comportament așteptat, nu defect.

### 3.7. Limitări intenționate ale DEMO

- Exclusiv obiecte/array-uri JavaScript în memorie; refresh-ul restaurează datele fictive.
- Fără `localStorage`, `sessionStorage`, IndexedDB, API de scriere sau Supabase pentru datele DEMO.
- Nu există tranzacții reale, modificări ale devizelor finale reale sau sincronizare între utilizatori.
- Testele raportate de Codex au trecut pentru cantități, retururi, import DF și regresii într-un DOM simulat; **validarea vizuală automată pe `file://` nu a fost disponibilă**. Au existat verificări manuale reușite în browser de către utilizator.

### 3.8. Trimitere în magazie — DEMO LAB, 25.10.2026

Implementare exclusiv în Demo 1 din `HUB_v2-LAB`. **Trimiterea nu confirmă recepția în magazie și nu creează stoc în alt modul.**

- Butonul **Magazie** este în detaliile piesei, lângă Retur. **Editează** a fost mutat într-un buton compact lângă status; păstrează acțiunea informativă existentă, fără implementarea unui flux nou de editare.
- Modalul permite alegerea **sursei** (cantitate nealocată sau o alocare auto identificată), a cantității întregi pozitive și a unor observații opționale. Implicit: 1 buc.; maximum: disponibilul eligibil al sursei. O operație folosește o singură sursă; pentru alte surse se repetă trimiterea.
- Confirmarea adaugă în registrul local `DATA.warehouseTransfers` o referință `DEMO-MAG-NNN`, piesa/factura, sursa istorică, cantitatea, notele și momentul trimiterii. Nu modifică obiectul piesei, alocările originale, DF-urile istorice, retururile sau valorile financiare.
- **Rezervarea este imediată.** Cantitatea trimisă din nealocat se scade din disponibilul pentru atribuire și retur. Cantitatea trimisă dintr-o alocare se scade din eligibilul DF și retur al acelei alocări. Retururile rezervate/finalizate și importurile DF existente sunt excluse înainte de transfer. Referința DF istorică blochează întreaga poziție, deoarece DEMO nu identifică separat bucățile istorice; piesele marcate Montată sunt de asemenea excluse.
- Disponibilul se recalculează la confirmare în toate fluxurile. Formularele vechi de atribuire, retur, import DF sau magazie nu pot folosi cantități între timp rezervate. Confirmarea repetată după salvare este ignorată. O eroare la adăugarea transferului restaurează registrul și permite reîncercarea.
- Alocarea din care s-a trimis devine protejată de corectare pentru trasabilitate, după modelul existent pentru retur/DF. Celelalte alocări eligibile rămân corectabile. Nu se șterg, reduc sau reordonează alocări.
- **Trimis în magazie** are stil violet distinct. Pentru trimitere parțială apare **Cantități mixte**, cu cantitatea trimisă și defalcarea restului nealocat, alocat eligibil DF, importat DEMO DF sau în retur. Nu se marchează întreaga linie drept trimisă. Cantitățile și istoricul cu sursă/data/notele apar în detaliile piesei și facturii; piesa apare și în tabel/lista facturii. Căutarea recunoaște referința și textul trimiterii.
- Tab/Shift+Tab sunt limitate la dialog; Escape, Anulează și click pe fundal închid fără trimitere. Enter în cantitate nu confirmă accidental; textarea păstrează liniile noi.
- Nu există recepție, „Am preluat”, anulare de transfer, tab nou, pagină Admin sau integrare Piese Stoc. Registrul este exclusiv în memorie și dispare la refresh, fără backend, Supabase sau persistență. KPI-ul suplimentar, absent la implementarea trimiterii, a fost adăugat ulterior conform §3.9.

**Fișiere modificate în acest batch:** `modules/stocuri/evidenta_piese.html`, `css/evidenta_piese.css`, `js/evidenta_piese.js` și acest plan. HTML actualizează și versiunile cache CSS/JS. Referința Demo 2, producția și celelalte modificări preexistente din checkout nu au fost atinse. Fără commit/push/deploy.

**Validare locală:** `node --check js/evidenta_piese.js` PASS; verificarea whitespace a diferențelor celor patru fișiere față de copiile dinaintea batch-ului nu a raportat erori. **53/53 teste magazie în DOM simulat** și **29/29 regresii Batch 1** trecute (jsdom + Flatpickr 4.6.13, harness/dependențe în `/tmp`, fără dependențe noi în proiect).

| Grupa testată | Rezultat local |
|---|---|
| Deschidere prin buton, focus, sursă, cantitate implicită/maximă, note opționale | PASS DOM |
| Cantitate goală, zero, negativă, fracționară sau peste disponibil | Respinse |
| Transfer parțial/integral din nealocat și din alocări auto; transferuri succesive din trei surse | PASS; cantități conservate |
| Dublă confirmare, sursă epuizată, referințe DF istorice și piese montate | Blocate |
| Protecție de corectare a alocării implicate; altă alocare rămâne corectabilă | PASS |
| DF/retur după magazie, magazie după DF/retur; formulare vechi în ambele sensuri | Revalidare PASS, fără consum suprapus |
| Finalizare retur după transfer din aceeași alocare | Nu redă cantitatea către magazie/DF |
| Asocieri și retururi istorice, total fără TVA/TVA/cu TVA | Păstrate |
| Defalcare mixtă, istoric în piesă/factură, note escapate, căutare | PASS DOM |
| Eroare simulată la salvare, rollback, anulare, Escape, Tab/Shift+Tab | PASS DOM |
| 5 taburi existente, 4 KPI, fără UI de recepție, refresh simulat | PASS DOM |
| Data locală, calendar, Enter pe liniile facturii, coduri și cronometru din Batch 1 | 29/29 PASS DOM |

**Limită:** testele de mai sus rulează pe DOM simulat, cu ceas/evenimente controlate; nu reprezintă browser real sau validare de producție. Politica browserului a blocat anterior fila locală `file://` în această sesiune și nu a fost ocolită. Aspectul desktop/mobil și interacțiunea nativă necesită încă verificare în browser. Nu se marchează checklisturile generale ca validate vizual.

### 3.9. Clarificare cantități și KPI magazie — LAB, 25.10.2026

**Schimbări exclusiv de prezentare în Demo 1.** Calculele existente de disponibil/alocare/retur/magazie/import DF, salvările, prețurile, TVA-ul și statusurile documentelor nu au fost modificate.

- În **Piese**, **De atribuit**, **Facturi** și detaliile lor, descrierile folosesc doar destinațiile nenule: **Atribuite: X buc.**, **Spre magazie: X buc.**, **De atribuit: X buc.**, **În retur: X buc.**, **Importate în DF: X buc.** Returul finalizat apare separat ca **Returnate: X buc.**, fără a rămâne simultan „În retur”.
- Pentru prezentare, **Atribuite** înseamnă cantitatea încă atribuită mașinii, fără bucățile deja importate DF, trimise în magazie sau rezervate/returnate. Calculele de business existente rămân sursa disponibilului. Bucățile asociate DF-urilor istorice apar la **Importate în DF**, cu referințele istorice păstrate, fără a fi însumate din nou la Atribuite.
- În tabel rămân badge-urile înmatriculărilor și un singur rezumat cantitativ pe linie. Nu se mai repetă defalcarea în coloana de status și nu mai apar fracțiile de tip `0/2`, `2/5` sau cantități zero. Culorile statusurilor HUB rămân neschimbate; starea mixtă și magazia păstrează nuanța violet.
- În panoul piesei, **Cumpărate** arată cantitatea originală, iar **Destinația pieselor** oferă defalcarea curentă. **Alocări pe mașini · detalii și istoric** se poate deschide pentru cantitatea inițial asociată, model, destinațiile din acea alocare și acțiunile existente. Referințele DF, retururile și istoricul trimiterilor rămân accesibile.
- Facturile separă **pozițiile de factură** de **bucățile fizice**: de exemplu, 4 poziții / 5 bucăți. Destinațiile sunt agregate fără suprapunere; referințele DF sunt afișate separat. Indicatorul procentual vechi de atribuire, care amesteca cantitățile deja importate cu cele încă atribuite, a fost eliminat din prezentare.
- Exemplu: Filtru ulei Mann, 2 bucăți cumpărate, 1 trimisă în magazie, 1 nealocată → **Spre magazie: 1 buc. · De atribuit: 1 buc.** Linia rămâne în **De atribuit** numai cât `remainingQty` existent este pozitiv; filtrarea nu a fost modificată.
- Al cincilea KPI, **Piese spre magazie**, însumează `qty` din registrul trimiterilor. Numără **bucăți fizice**, nu poziții sau operații; arată zero fără transferuri, se actualizează la confirmare prin randarea existentă și rămâne totalul sesiunii, indiferent de filtre. Refresh-ul îl readuce la zero.
- KPI-ul folosește iconul [Lucide Warehouse](https://lucide.dev/icons/warehouse), ca SVG local cu notificarea ISC în cod, și un accent violet discret. Primele patru carduri rămân păstrate. Gridul are 5 coloane pe desktop; la maximum 900 px are 2 coloane, cu magazia pe ultimul rând întreg. Nu se introduce dependență runtime nouă.
- Nu există recepție, „Am preluat”, tab nou, pagină Admin, Piese Stoc, persistență sau integrare backend/Supabase. Producția și referința Demo 2 rămân neatinse.

**Fișiere modificate:** `js/evidenta_piese.js`, `css/evidenta_piese.css`, `modules/stocuri/evidenta_piese.html` (inclusiv versiuni cache CSS/JS) și acest plan. Fără commit/push/deploy; modificările preexistente sunt păstrate.

**Verificări locale:**

| Verificare | Rezultat |
|---|---|
| `node --check js/evidenta_piese.js` | PASS |
| Comparație AST/sursă cu copia dinaintea taskului | 222 declarații existente păstrate octet cu octet în afara schimbărilor UI permise, inclusiv date, cantități, disponibil, totaluri, validări și salvări |
| Scenarii UI/KPI | 33/33 PASS DOM/static |
| Regresii magazie | 53/53 PASS DOM; așteptările de text și număr de KPI au fost actualizate pentru cerințele noi, fără eliminarea scenariilor de business |
| Regresii Batch 1 | 29/29 PASS DOM |
| 2 bucăți: 1 magazie + 1 nealocată; combinații de atribuiri/retur/DF/magazie | PASS; suma destinațiilor egalează cantitatea cumpărată, fără dublare |
| Factură 4 poziții / 5 bucăți; transfer de 2 bucăți într-o singură operație | PASS; KPI crește cu 2 |
| Filtrare, căutare, înmatriculări, DF istoric, retur finalizat, reset la refresh | PASS DOM |
| CSS responsive și cele 5 carduri în DOM la 1440, 1024, 900, 720, 375 și 320 px | PASS static/structură; fără motor real de layout |

Harness-urile și dependențele sunt în `/tmp`, fără fișiere sau dependențe de test noi în proiect. **Browser real/desktop-mobil: NEVERIFICAT** din cauza restricției `file://` constatate în această sesiune. Testele DOM și regulile CSS nu dovedesc aspectul vizual, interacțiunea nativă sau publicarea în producție.

### 3.10. Facturi — situația pieselor versus documentul fizic, LAB, 25.10.2026

**Regula operațională:** factura fizică rămâne în birou până la finalizarea DF-urilor necesare și a fotocopiilor pentru toate mașinile relevante. Atribuirea la o mașină nu dovedește finalizarea DF-ului; importul DEMO nu confirmă existența documentelor reale sau a fotocopiilor.

- Tabelul **Facturi** păstrează numărul, data, furnizorul, pozițiile, bucățile fizice și totalul cu TVA. Coloanele **Situația pieselor** și **Document fizic** sunt denumite distinct. Rezumatul pieselor folosește helperii existenți, fără fracții, zero-uri sau descrieri repetate.
- Panoul facturii separă **SITUAȚIA PIESELOR** de **SITUAȚIA DOCUMENTULUI**. Prima afișează numai cantitățile relevante: **Atribuite la mașini**, **Importate în DF**, **Spre magazie**, **În retur**, **De atribuit**; **Returnate** rămâne separat pentru retururile finalizate. DF, retururile și magazia nu sunt însumate din nou ca disponibile. Referințele istorice și DEMO DF, notele originale, lista pieselor și istoricul magaziei rămân accesibile.
- Secțiunea documentului arată statusul fizic existent, în culorile HUB păstrate, și regula de păstrare în birou. Badge-ul duplicat din antetul detaliului a fost eliminat. Valorile financiare rămân într-o secțiune separată, fără recalculare nouă.
- Cele trei statusuri rămân **În firmă**, **Pregătită pentru contabilitate**, **Trimisă în contabilitate**. Nicio atribuire, rezervare de retur, trimitere în magazie sau operație DF nu schimbă automat statusul documentului.
- Pentru un document **pregătit/trimis**, dacă există cantități încă atribuite fără DF, neatribuite, rezervate pentru retur sau trimise spre magazie, se afișează o **informare discretă** în secțiunea documentului și un icon cu explicație în tabel, accesibil și la focus. Este doar un semnal de verificare a documentelor, fără blocare sau schimbare de status. Retururile finalizate și cantitățile deja importate nu sunt considerate cantități deschise de această informare.
- **Lipsa informării nu certifică pregătirea pentru contabilitate.** Fotocopiile și finalizarea documentelor reale nu sunt urmărite de DEMO; regula de verificare manuală rămâne vizibilă chiar dacă toate piesele au referințe DF.
- Controlul manual existent este selectorul de status din **Factură nouă**, păstrat integral. Pentru facturile deja salvate, butonul **Editează factura** rămâne acțiunea informativă existentă (editarea nu este încă implementată); a fost mutat în secțiunea documentului, fără a introduce un selector sau un flux nou de modificare a datelor.
- Nu se adaugă checkboxuri pentru fotocopii, taburi sau KPI. Layoutul 70/30, tema dark, calculele de cantități, factură/TVA, validările și salvările sunt păstrate. Exclusiv memorie DEMO; fără Supabase, backend, persistență sau modificări în producție.

**Fișiere modificate:** `js/evidenta_piese.js` (afișare facturi și informare), `css/evidenta_piese.css` (stiluri locale pentru separare/informare), `modules/stocuri/evidenta_piese.html` (versiuni cache CSS/JS) și acest plan. Fără commit/push/deploy; celelalte modificări preexistente sunt păstrate.

**Validare locală:** `node --check js/evidenta_piese.js` PASS; **29/29 teste Facturi UX**, **33/33 regresii UI/KPI**, **53/53 regresii magazie**, **29/29 regresii Batch 1**, în DOM simulat/static. Comparația AST/sursă cu copia dinaintea taskului confirmă **236 declarații existente identice octet cu octet**, exceptând cele trei blocuri de prezentare modificate (`TABLE_COLUMNS`, `renderInvoiceRow`, `buildInvoiceDetail`). Helperii de cantități și toate funcțiile de validare/salvare au rămas identice.

Scenariile includ factura cu 4 poziții/5 bucăți, atribuire parțială, trimitere în magazie, rezervare și finalizare retur, DF istoric și simulat, destinații mixte fără suprapuneri, toate cele trei alegeri manuale la salvarea facturii, informare condițională fără mutații de date, istoricul și acțiunea de editare existente. Harness-urile și fixture-urile fictive sunt în `/tmp`; nu au fost adăugate dependențe de test în proiect.

**Limită:** aspectul și interacțiunea nativă în browser rămân **NEVERIFICATE** din cauza restricției `file://` constatate în sesiune. Testele locale nu reprezintă validare vizuală sau de producție. Editarea statusului unei facturi deja salvate și verificarea efectivă a fotocopiilor nu au fost implementate în acest task.

---

### 3.11. Lizibilitate și Înapoi la HUB — LAB, 25.10.2026

- Adăugat linkul **Înapoi la HUB** ca primul element al antetului, înainte de logo/titlu, cu `href="../../index.html"`. Este navigare normală prin ancoră, fără `history.back()` sau handler JS.
- Referința citită este `modules/devize/avans.html`: săgeată de 20 px, text uppercase de 12 px, bold, spațiere între litere, culoare muted, fără fundal/chenar și deplasare de 4 px a săgeții la hover. Layoutul desktop are trei zone: întoarcere, identitate, acțiunea din dreapta.
- **Factură nouă** rămâne aliniată la dreapta. La maximum 720 px antetul folosește două coloane; la maximum 540 px linkul și acțiunea sunt pe primul rând, iar identitatea pe rândul următor, pentru a păstra textul complet al linkului pe telefoane înguste.
- Numai în tabelele **Piese**, **De atribuit** și **Facturi**, fonturile mici cresc cu 1–2 px: antete/statusuri 10 px, date/descrieri/cantități/DF 11 px, coduri 10,5 px, valori principale 11,5 px și denumiri 12,5 px. Line-height este ajustat la 1,4–1,45; paddingul rândurilor rămâne neschimbat.
- Sunt păstrate culorile, ierarhia fonturilor, proporția 70/30 și stilurile panoului de detalii. Nu s-au schimbat fonturile tabelelor Furnizori/Retururi. Tabelele late păstrează derularea orizontală internă existentă, fără o modificare a lățimii minime.

**Fișiere modificate:** `modules/stocuri/evidenta_piese.html`, `css/evidenta_piese.css` și acest plan. JavaScript-ul modulului este identic octet cu octet cu copia dinaintea taskului; `avans.html` are același SHA-256 înainte/după. Fără modificări de business, date, prețuri, calcule, Supabase sau producție; fără commit/push.

**Verificări:** `node --check` PASS; 18/18 verificări DOM/statice pentru link, ordinea antetului, selectorii de lizibilitate, CSS valid, 70/30, controale și integritatea JS/referinței; 29/29 regresii Facturi și 53/53 regresii magazie PASS. Destinația relativă este corectă și `index.html` există. Harness-urile sunt în `/tmp`.

**Limită:** navigarea efectivă, aspectul și absența suprapunerilor/overflow-ului pe desktop și mobil nu au fost validate într-un browser real, din cauza restricției `file://` constatate în sesiune. Verificarea structurii DOM/CSS la diferite lățimi nu este dovadă de layout vizual; EP-U01 rămâne în așteptarea acestei validări.

---

## 4. Reguli de business care NU trebuie pierdute

1. **O poziție de factură rămâne o poziție de factură** chiar dacă bucățile sunt distribuite către 2–3 mașini.
2. Cantitatea originală, prețul unitar istoric, cota TVA și totalul documentului rămân stabile; alocările/retururile/importurile sunt înregistrări conexe.
3. **Nu se poate consuma aceeași bucată de două ori**: rezervările de retur, importurile DF și transferurile viitoare trebuie să țină cont unele de altele.
4. Distinge între `neatribuită`, `atribuită`, `montată`, `rezervată pentru retur`, `returnată`, `importată în DF` și `transferată în magazie`. Aceste noțiuni descriu dimensiuni diferite; nu reduce totul la un singur status care șterge istoricul.
5. Cantitățile disponibile pentru o **nouă atribuire** sunt diferite de cantitățile eligibile pentru **import DF** (care trebuie deja atribuite mașinii respective).
6. O cantitate aflată în retur dintr-o alocare nu poate fi importată în DF. O cantitate deja importată în DF nu poate fi mutată la altă mașină fără un flux explicit de anulare/corecție.
7. Notele istorice scrise de utilizator nu se șterg automat. Starea curentă se afișează separat, ca să nu apară contradicții de tip „fără mașină” după atribuire.
8. Numerele de înmatriculare se păstrează normalizate (majuscule, fără spații/cratime). În integrarea reală se verifică și identificatorul vehiculului / **vizita sau lucrarea**, nu doar textul numărului: aceeași mașină poate reveni pentru alt DF.
9. Un retur poate necesita dovada predării agentului; nu echivala `Cerere trimisă` cu `Ridicat`.
10. Nu se modifică direct un DF real printr-o simulare; în fluxul real, legătura de import se confirmă **după salvarea reușită, atomică, a DF**, fără dubluri la retry.
11. Piesele păstrate pentru vânzare/recuperare vor urma **transferul către alt modul Stoc Magazie**; nu se amestecă cu disponibilul normal din Evidență Piese. DEMO LAB din §3.8 simulează numai trimiterea și rezervarea; nu implementează acel modul sau recepția lui.

### Exemplu de control cantitativ

```text
5 buc. cumpărate
2 buc. alocate mașinii A
1 buc. rezervată pentru retur din cantitatea nealocată
2 buc. încă neatribuite, disponibile pentru alocare
```

Când returul provine dintr-o alocare, disponibilul pentru DF al acelei alocări scade, chiar dacă alocarea istorică rămâne înregistrată.

---

## 5. Date și relații — model CONCEPTUAL pentru viitor

**Nu reprezintă o schemă SQL aprobată.** Înainte de proiectarea tabelelor se verifică schema reală Supabase și convențiile HUB.

| Entitate conceptuală | Rol |
|---|---|
| Furnizor | Date de identificare și contact; eventual conturi bancare multiple |
| Factură furnizor | Antet, dată, număr, stare document fizic, furnizor, note |
| Poziție factură | Piesă, cod, cantitate originală, preț de achiziție, TVA |
| Alocare piesă | Porțiune cantitativă legată de o mașină și ulterior de o lucrare |
| Retur | Sursa cantității, rezervare, motiv, etape, persoană/document predare |
| Import DF | Referință către alocare/cantitate și către DF real, fără dubluri |
| Mișcare magazie (viitor) | Transfer trasabil către modulul separat Stoc Magazie |
| Jurnal | Cine și când a făcut acțiuni, inclusiv corecții |

### Principii pentru implementarea reală

- Chei stabile și relații explicite, nu numai concatenarea denumirilor sau a numărului auto.
- Control concurență și tranzacții: doi colegi nu trebuie să aloce aceeași bucată în același timp.
- Sume calculate în unități monetare sigure (numeric în DB / bani sau rotunjire controlată în JS), fără erori cumulative float.
- Autentificare, roluri, RLS, audit și validări **la nivelul bazei de date**, nu doar prin ascunderea butoanelor.
- Prețul de achiziție și cel de vânzare rămân separat evidențiate.
- Nu se creează tabele, migrații sau RPC fără verificarea și aprobarea schemei existente.

---

## 6. Cum ar trebui să funcționeze integrarea REALĂ cu Deviz Final

**Direcție agreată:** butonul principal de import va fi în pagina **Deviz Final**, nu obligarea colegului să caute DF-ul din Evidență Piese.

Flux propus:

1. Colegul deschide sau întocmește `DF-XXX`, cu mașina/lucrarea identificată.
2. Apasă **Importă piese din facturi**.
3. HUB afișează doar cantitățile eligibile atribuite mașinii/lucrării respective, cu furnizor, factură, cod, cantitate și preț de achiziție.
4. Colegul alege pozițiile și cantitățile. Sistemul calculează prețurile **conform regulii de vânzare încă neaprobate**.
5. La salvarea reușită a DF se confirmă și legătura cantitativă cu sursa; anularea/reîncercarea trebuie să fie sigură și fără import dublu.
6. Evidență Piese afișează referința reală `DF-XXX` și cantitățile preluate.

**Atenție:** DF-ul actual are reguli existente de salvare atomică (RPC `save_deviz_final`), import de avansuri, reduceri și print. Noua integrare trebuie proiectată în jurul lor, fără a le strica. Această secțiune **nu** este autorizație de editare a `deviz_final.html` sau a Supabase.

---

## 7. Feedback de colectat de la colegi (decizii DESCHISE)

| ID | Subiect | Întrebarea practică / decizia de luat |
|---|---|---|
| EP-F01 | Introducere facturi | Ce câmpuri folosesc efectiv la recepție? Ce este prea mult / lipsește? |
| EP-F02 | Atribuire | Cine face atribuirea și când? Pot fi atribuite piesele înainte să se știe mașina? |
| EP-F03 | Montaj | Avem nevoie de un eveniment separat „Montată”, pe **bucată/alocare**? Cine îl confirmă? |
| EP-F04 | Retur — predare agent | Se notează cine a predat, cine a ridicat, data și eventual un AWB/document? |
| EP-F05 | Retur — documente | Trebuie păstrat număr storno/factură de corecție? În ce moment e considerat închis returul? |
| EP-F06 | Retur întârziat | După câte zile să apară atenționarea că agentul nu a ridicat piesa? |
| EP-F07 | Preț DF | Care este regula exactă de adaos, baza de calcul cu/fără TVA și rotunjirea? Nu se presupune ×1,53 automat. |
| EP-F08 | Factură fizică | Ce statusuri și date de predare către contabilitate sunt utile? |
| EP-F09 | Magazie | Când se decide păstrarea unei piese, cine confirmă transferul și ce informații se transmit? |
| EP-F10 | Căutare | Ce informații trebuie să poată găsi imediat la întocmirea devizului? |

**Deciziile se consemnează după discuție**, nu se implementează prin presupunere.

---

## 8. Restanțe UX și îmbunătățiri posibile

Această secțiune este un rezumat, **nu înlocuiește** `CORECTARI_EVIDENTA_PIESE.md`.

### Implementate și observate în DEMO (de reverificat după copierea în LAB)

- [x] Cantitatea implicită la atribuirea individuală: `1 buc.`.
- [x] Trei câmpuri pe un singur rând pe desktop: cantitate, înmatriculare, model.
- [x] La importul contextual al unei piese se arată numai mașinile care au cantități eligibile din piesa respectivă.
- [x] Identificatorii tehnici ai alocărilor nu mai aglomerează rezumatul DF.
- [x] Notele istorice rămân păstrate, iar starea actuală se prezintă separat.

### Deschise / de validat cu colegii

- [ ] **EP-U01:** poziționarea și stilul butonului „Înapoi” ca în `modules/devize/avans.html` — implementat în LAB conform §3.11; validarea vizuală în browser rămâne deschisă.
- [ ] **EP-U02:** simplificări finale ale textelor, câmpurilor și informațiilor repetate, fără ascunderea datelor relevante.
- [ ] **EP-U03:** verificare specifică pentru afișarea și înregistrarea cantităților „montate” versus „atribuite”.
- [ ] **EP-U04:** comportamentul returului în caz de anulare / nerevenire agent / transfer în magazie.
- [ ] **EP-U05:** testare mobilă pe dispozitivele colegilor, inclusiv formulare cu multe linii și modaluri lungi.

**Regulă checklist:** în fișierul de corecții, o bifă finală înseamnă implementare **și test în browser**. Rezultatul exclusiv dintr-un DOM simulat nu ajunge.

### 8.1. Demo 2 UX — Batch 1, implementat în Demo 1 LAB la 25.10.2026

**Demo 1 rămâne aplicația principală.** Fișierul `referinte/demo2_claude.html` a fost citit doar ca referință și nu a fost modificat sau copiat peste modul. Schimbările sunt exclusiv în `HUB_v2-LAB`; nu sunt publicate în producție.

| Îmbunătățire | Comportament implementat |
|---|---|
| Data facturii | La fiecare deschidere nouă a modalului se recalculează data locală curentă, afișată `DD.MM.YYYY`. Calendarul românesc și editarea manuală rămân disponibile. O dată mai veche aleasă de utilizator rămâne până la închiderea formularului. Fără Flatpickr/CDN, câmpul text păstrează același format. |
| Navigare | Enter avansează prin denumire → cod → cantitate → preț → TVA → înmatriculare → observații. Din ultimul câmp trece la denumirea liniei următoare sau creează o linie cu funcția existentă `addInvoiceLine`. Tab/Shift+Tab și limitarea focusului în modal sunt păstrate; selecturile, calendarul și textarea își păstrează comportamentul. Enter în celelalte inputuri obișnuite nu salvează factura. |
| Cod piesă | Se transformă în majuscule la ieșirea din câmp și la salvare. Numerele, cratimele, slash-urile și celelalte semne nu sunt filtrate. Valoarea nu se rescrie în timpul tastării, astfel încât cursorul/selecția să nu fie mutate. |
| Cronometru | Afișaj discret `Timp 0:00`, fără input obligatoriu. Pornește la prima editare a unui câmp, schimbare de select sau schimbare de dată din calendar; simpla focalizare/deschidere nu îl pornește. Continuă după validare nereușită, se oprește la salvare reușită sau anulare/închidere și revine la zero pentru factura următoare. Exclusiv în memorie, fără câmp în obiectul facturii și fără stocare/backend. |

**Fișiere modificate:** `modules/stocuri/evidenta_piese.html` (cronometru și versiuni cache CSS/JS), `css/evidenta_piese.css` (stilul cronometrului), `js/evidenta_piese.js` (cele patru comportamente) și acest plan. Culorile de status, calculul financiar/TVA, atribuirea, retururile și DF simulat nu au fost modificate. „Adaugă piesă” folosește funcția existentă; în Demo 1 inspectat, mașina rămâne opțională pe fiecare linie, fără a introduce câmpul global de mașină implicită din referință.

**Verificare locală la 25.10.2026:** `node --check` PASS; **29/29 verificări în DOM simulat (jsdom, Flatpickr 4.6.13 real încărcat local)**, fără erori JS în simulare. Ceasul și evenimentele de editare sunt controlate în test; nu sunt evenimente native de browser. Harness-ul și dependențele de test sunt în `/tmp`, fără dependențe sau fișiere de test adăugate în proiect.

- Data locală diferită de UTC, redeschidere după trecerea peste miezul nopții, reset cronometru și păstrarea datei vechi inclusiv la salvare.
- Enter prin toate cele șapte câmpuri, linie următoare existentă/nouă, fără salvare; Tab și Shift+Tab neinterceptate între câmpuri; excluderi select/calendar/textarea, compoziție IME și Enter repetat.
- Cod mixt cu cifre, `-`, `/`, `.`, `_`, `+`; selecție/cursor păstrate în timpul editării și majuscule la blur/salvare.
- Cronometru oprit înainte de prima editare, pornire la schimbare, afișaj minute/secunde, continuare la validare nereușită, oprire la salvare și reset la formular nou.
- Salvare cu două linii și înmatriculări mixte (goală + `CT22BBB`), „Adaugă piesă”, cantitate implicită 1 la atribuire, respingerea depășirii, alocări 1+1 și rest neatribuit, retur parțial până la Finalizat, import DF eligibil și respingerea reimportului. Totalurile financiare rămân aceleași după aceste operații.
- Fallback fără CDN: afișajul datei și blocarea salvării implicite prin Enter.

**Browser real / aspect desktop-mobil: NEVERIFICAT în acest batch.** Politica automatizării a respins accesul la fila locală `file://`; nu a fost ocolită. Ordinea nativă Tab/Shift+Tab, interacțiunea fizică cu calendarul și aspectul cronometrului trebuie verificate manual în browser. Rezultatele DOM nu sunt probe de browser sau producție; checklisturile generale de mai jos nu sunt bifate prin aceste teste. `CORECTARI_EVIDENTA_PIESE.md`, menționat istoric în plan, nu există în directorul LAB inspectat; actualizarea batch-ului este consemnată aici.

---

## 9. Ordinea recomandată de lucru

| Pas | Rezultat dorit | Fără ce NU avansăm |
|---|---|---|
| 1 | Copia DEMO curentă în LAB și documentația pusă lângă ea | Nu modificăm producția direct |
| 2 | Colectăm feedback de la cei care fac facturi, retururi și devize | Nu deducem procedura doar din propriile teste |
| 3 | Corectăm doar problemele confirmate și verificăm UX desktop/mobil | Fără redesign gratuit |
| 4 | Definim fluxurile reale: cantitate, montaj, anulări, retur, predare către agent, magazie | Fără a amesteca statusurile |
| 5 | Proiectăm schema Supabase și accesul conform HUB actual; testare în LAB | Fără migrații speculative în producție |
| 6 | Realizăm salvarea reală a facturilor/alocărilor/retururilor, cu audit și concurență | Fără pierdere de date sau suprapuneri |
| 7 | Integrăm importul real din `Deviz Final`, cu prețuri validate și salvare atomică | Fără importuri duplicate |
| 8 | Testare colegi → validare → sincronizare controlată în HUB v2 → commit/push | Fără publicarea unor modificări netestate |

**Separat:** proiectul `Stoc Magazie` (piese NOI + SH) există conceptual și are deja o pagină/Google Sheet; îl vom analiza ulterior. Evidență Piese poate pregăti un flux de transfer, dar nu construim gestiunea magaziei în acest modul.

---

## 10. Scenarii minime de regresie pentru fiecare modificare importantă

- [ ] Factură nouă cu 2–3 linii: calcul cantitate × preț cu TVA și total.
- [ ] Două bucăți pe **o singură linie**, alocate 1+1 către mașini diferite.
- [ ] Atribuire parțială: restul rămâne în „De atribuit”; peste limită este respins.
- [ ] Căutare după ambele înmatriculări, cod piesă, factură și furnizor.
- [ ] Corectarea unei alocări nu o alterează pe cealaltă.
- [ ] Retur 1 din 5, cu rezervare imediată; nu permite rezervări suprapuse.
- [ ] Etapele returului; finalizarea nu redă cantitatea în disponibil.
- [ ] Import DEMO în DF doar din cantitatea eligibilă; import repetat/depășit blocat.
- [ ] Import contextual filtrează doar mașinile relevante; importul global rămâne utilizabil.
- [ ] Referințe DF istorice păstrate; niciun status „Montată” setat implicit la import.
- [ ] Totalurile facturilor și TVA-ul rămân neschimbate după alocare, retur și import.
- [ ] Desktop + mobil: modale, tabele, butoane și navigare înapoi.
- [ ] Refresh: datele DEMO revin la valorile fictive inițiale.
- [ ] Consola browserului: fără erori noi; în cod `node --check` și teste automate relevante.

---

## 11. Reguli pentru Codex / agenți AI

1. **Citește întâi** acest plan, indexul documentației HUB și fișierele actuale din checkout-ul autorizat. `CORECTARI_EVIDENTA_PIESE.md` este referință istorică indisponibilă aici, nu o condiție locală de lucru. Documentația poate rămâne în urmă față de cod.
2. La fiecare task, confirmă scopul și lista exactă a fișierelor permise. **Nu implementa automat** tot ce apare la „viitor” sau „de discutat”.
3. Respectă layoutul dark, stilul HUB și comportamentele aprobate. Nu propune un redesign dacă se cere o corecție punctuală.
4. Nu modifica aplicația publicată, Deviz Final real, Supabase, date reale, roluri/RLS sau documente de producție fără solicitare explicită. Repository-ul principal local nu dovedește versiunea publicată; respectă lista de fișiere autorizate.
5. Păstrează datele istorice, sumele, cantitățile, trasabilitatea și protecțiile anti-duplicare.
6. Testează; separă clar „testat în DOM simulat” de „testat efectiv în browser”.
7. Modifică documentația **doar pentru deciziile luate și schimbările realizate**, nu transforma automat sugestiile în cerințe aprobate.
8. Fără commit/push/deploy automate dacă nu sunt cerute explicit.
9. La final, raportează concis: fișiere modificate, rezultat, teste, riscuri și ce rămâne deschis.

---

## 12. Registru de modificări ale documentului

| Data | Versiune | Modificare |
|---|---|---|
| 24.10.2026 | 1.0 | Prima sinteză pentru LAB după publicarea DEMO: flux existent, etape 2.1–2.6, reguli de cantități, retur/DF, feedback și ordine de implementare reală. |
| 25.10.2026 | 1.1 | Demo 2 UX Batch 1 aplicat punctual în Demo 1 LAB: dată locală la deschidere, Enter pe linii, coduri majuscule, cronometru în memorie; 29 verificări DOM, validare browser rămasă deschisă. |
| 25.10.2026 | 1.2 | Trimitere în magazie DEMO: surse nealocate/auto, rezervare cantitativă, protecții atribuire/retur/DF, defalcare și istoric; 53 teste magazie și 29 regresii DOM, fără recepție/persistență sau validare vizuală nouă. |
| 25.10.2026 | 1.3 | Simplificare descrieri cantitative fără suprapuneri, poziții versus bucăți și al cincilea KPI „Piese spre magazie”; 33 teste UI/static + 53 regresii magazie + 29 Batch 1, fără modificarea logicii de business. |
| 25.10.2026 | 1.4 | Facturi: separare situație piese/document fizic, regulă DF/fotocopii și informare condițională fără schimbarea statusului; 29 teste Facturi + 115 regresii locale, logică de business păstrată. |
| 25.10.2026 | 1.5 | Înapoi la HUB în stânga după modelul avans.html și fonturi +1–2 px în cele trei tabele; 18 verificări UI/statice și 82 regresii PASS, browser real rămas neverificat. |

### Format recomandat pentru cerințe noi

```text
ID: EP-F11 / EP-U06 / EP-B01
Data: AAAA-LL-ZZ
Sursa: coleg / test / observație
Problema concretă:
Propunerea:
Decizia: neanalizată / aprobată / respinsă / amânată
Implementare: neîncepută / în lucru / implementată / testată
Fișiere implicate:
Scenariu de verificare:
```

**Documente de referință:** `README_DEMO_EVIDENTA_PIESE.md` (specificație inițială din 23.10.2026) și `CORECTARI_EVIDENTA_PIESE.md` (registru punctual) sunt referințe istorice externe indisponibile în checkout. Sunt disponibile [AI_START_HERE.md](../AI_START_HERE.md) și [indexul documentației](../INDEX.md). Diferențele față de istoricul LAB sau versiunea publicată cer verificarea sursei și mediului țintă, fără a inventa conținutul documentelor absente.
