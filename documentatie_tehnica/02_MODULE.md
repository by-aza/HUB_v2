# Modulele HUB AUTO v2

## Domeniu și verificare locală — 03.11.2026

Inventarul a fost reconciliat cu sursele repository-ului principal. El descrie
implementarea statică și operațiile apelate de frontend; nu certifică autorizarea
efectivă, salvarea live sau comportamentul în browser. Acestea rămân **NEEDS_REVIEW**.
Confirmările de test LAB/producție datate din corp sunt dovezi istorice distincte.

## 1. Convenții

În acest document:

- **S** = citire (`SELECT`);
- **I** = creare (`INSERT`);
- **U** = actualizare (`UPDATE`/`UPSERT`);
- **D** = ștergere (`DELETE`);
- accesul menționat pentru checkout-ul curent este logica frontend inspectată static; catalogul DB istoric și limitele actuale sunt în `03_SUPABASE.md` și `04_ROLURI_SI_ACCES.md`.

## 2. Nucleu și autentificare

| Modul | Fișier principal | Rol | Date confirmate |
|---|---|---|---|
| Login | `modules/admin/login.html` | autentificare prin email sau poreclă; redirecționare pe rol | `auth_profiles` S; Supabase Auth sign-in; `audit_logs` I prin helper |
| Resetare parolă | `modules/admin/resetare-parola.html` | finalizează sesiunea de recovery Supabase | Supabase Auth U parolă |
| Dashboard HUB | `index.html` | navigare, alerte, căutare globală, badge-uri | S din profile, anunțuri, devize, plăți, AWB, stoc, flotă, contracte, constatări, detailing, dezmembrări, avansuri și generator |
| Timeout sesiune | `js/session-timeout.js` | logout după 30 minute pentru non-Admin | `auth_profiles` S; Supabase Auth sign-out |
| Audit comun | `js/audit.js` | expune `addAuditLog` | `audit_logs` I |

Dashboardul nu este un backend intermediar: el interoghează direct Supabase. Căutarea și badge-urile depind de disponibilitatea și permisiunile tabelelor respective.

## 3. Birou și devize

**Navigare BIROU — actualizare locală 05.11.2026.** În meniul din
[index.html](../index.html), ordinea este: Deviz Estimativ → Evidență Avansuri →
Cereri de plată → Registru Telefoane → Deviz Final → Căutare Deviz → Evidență Facturi & Piese → Contracte →
Comenzi Piese SH → Clienți & Notificări. Vizibilitatea păstrează regulile de acces existente.
Culorile iconițelor și tooltip-ul sidebar-ului sunt descrise în
[regulile vizuale de navigare](DESIGN_SYSTEM_HUB.md#sidebar-hub--actualizare-locală-04112026).
Ordinea este confirmată în sursa locală; versiunea publicată rămâne **NEEDS_REVIEW**.

### 3.1 Deviz estimativ

- fișier: `modules/devize/deviz.html`;
- permisiune UI: `deviz_estimativ`, cu fallback istoric `devize`;
- funcții: creare/editare deviz estimativ, piese în JSON, totaluri și tipărire;
- date: `auth_profiles` S; `devize` S/I/U;
- dependențe: audit, pagina `deviz-print.html`, `localStorage` pentru print.

### 3.2 Căutare devize

- fișier: `modules/devize/cautare_devize.html`;
- permisiune UI: `cautare_deviz`, fallback `devize`;
- date: `devize` S și `deviz_final_header` S;
- rol: căutare transversală în cele două generații de deviz.

### 3.3 Deviz final

- fișier: `modules/devize/deviz_final.html`;
- permisiune UI: `deviz_final`, fallback `devize`;
- citiri: `deviz_final_header`, `deviz_final_linii`, `constatari`, `devize`, `comenzi_piese_sh` și `auth_profiles`;
- salvare obișnuită: RPC-ul atomic `save_deviz_final` validează și scrie antetul împreună cu toate liniile într-o singură tranzacție; pagina nu salvează documentul prin inserări/actualizări/ștergeri independente în aceste două tabele;
- funcții: creare manuală/import, linii ordonate pe secțiuni, reduceri, totaluri, legare la constatare și la o comandă de piesă folosită;
- dependențe: fluxul Constatare și modulul Comenzi piese SH.

Conversia directă din Constatare se face prin RPC-ul atomic `create_deviz_final_from_constatare`, nu prin inserări independente din browser.

**Ciorne locale — prezente static în checkout-ul principal la 03.11.2026; origine LAB la 17.10.2026:** `modules/devize/deviz_final.html` folosește `js/local-deviz-drafts.js` și `css/local-deviz-drafts.css` pentru recuperare automată pe același dispozitiv/origin/profil de browser. Copiile JSON sunt separate pe proiect, utilizator autentificat și identitate de document, cu revizii/copie de tab distincte. Se păstrează inputurile, rândurile incomplete/ordonate, reducerile, legăturile SH și avansurile. Persistența locală nu reprezintă salvare în Supabase și nu elimină avertizarea pentru modificări nesalvate.

HUB, login pentru rolurile cu altă landing și pagina Manager oferă dialogul unic de recuperare plus intrarea temporară „Ciorne locale”, după profil și permisiunea Deviz final. Logout-ul de inactivitate cere flush înainte de sign-out; limita de 30 minute și regulile de autentificare/acces rămân cele existente. Recuperarea nu apelează RPC-uri de salvare și nu schimbă listele de devize salvate sau printul. Pentru documente salvate se verifică baza; conflictele cer inspecție și confirmare manuală, iar documentele șterse/inaccesibile păstrează ciorna fără recreare automată. Detalii, chei, lista fișierelor, testele și limitele sunt în `20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md`.

### 3.4 Avansuri

- fișier: `modules/devize/avans.html`;
- permisiune UI: `avansuri`, fallback `devize`;
- date: `clienti_vehicule` S, `auth_profiles` S, `evidente_avansuri` S/I/U/D, `evidente_avansuri_plati` S/I/U/D;
- funcții: evidență avans per mașină, plăți multiple și arhivare/observații.

### 3.5 Plăți Manager

- fișier: `modules/devize/plati.html`;
- permisiune UI: `plati`; Managerul primește acces implicit în dashboard;
- date: `auth_profiles` S; `plati_manager` S/I/D;
- Managerul permite copierea IBAN-ului și actualizează cererea originală la `status='platit'`, cu `data_platii` și `platit_de`; nu execută transfer bancar. Statusul este comun cu pagina utilizatorului, vizibil acolo la următoarea citire/reîncărcare.

### 3.6 Contracte

- fișier: `modules/devize/contracte.html`;
- permisiune UI: `contracte`, fallback `devize`;
- date: `contracte` S/I/U;
- fișiere: încarcă fotografii/documente în bucket-ul public `documente_contracte`, apoi salvează URL-urile în JSON;
- particularitate: compresia imaginii are loc în browser înainte de upload.

### 3.7 Comenzi piese SH

- fișiere: `modules/devize/comenzi_piese_sh.html`, `js/comenzi_piese_sh.js`, `css/comenzi_piese_sh.css`;
- permisiune UI: `comenzi_piese_sh`;
- date: `auth_profiles` S, `comenzi_piese_sh` S/I/U, `deviz_final_linii` S;
- funcții: comandă, tranziții de status, curier/AWB, arhivare/restaurare și reordonare;
- statusuri confirmate: comandată, în tranzit, sosită, montată, incompatibilă, returnată, listată, anulată;
- ștergerea nu este oferită utilizatorului obișnuit; Admin o poate executa din modulul administrativ.

### 3.8 Clienți & Notificări

- fișiere: `modules/devize/clienti-notificari.html`, `js/clienti-notificari.js`, `css/clienti-notificari.css`;
- stare: implementare hibridă; pagina este etichetată încă „DEMO” în navigație, dar execută citiri și scrieri live;
- date principale:
  - `clienti` S/I/U;
  - `clienti_vehicule` S/I/U;
  - `clienti_contacte` S/I/U;
  - `clienti_vehicule_termene` S/I/U;
  - `clienti_notificari_istoric` S/I/U;
  - `clienti_notificari_config` S/U;
  - `clienti_notificari_sabloane` S/U;
  - `evidente_avansuri` S/I/U/D și `evidente_avansuri_plati` S/I;
  - `constatari`, `devize`, `deviz_final_header`, `comenzi_piese_sh`, `constatari_departamente` S;
- permisiuni de date: `clienti_notificari` și `clienti_notificari_config` în RLS;
- neclaritate: anumite note/acțiuni rămân în memorie și nu toate componentele vizuale sunt dovedite ca persistente.

## 4. Service și formulare

### 4.1 Constatare v2

- fișiere: `modules/formulare/constatari_v2.html`, `js/constatari_v2.js`, `css/constatari_v2.css`;
- permisiune UI: `constatari`;
- date:
  - `auth_profiles` S;
  - `audit_logs` S/I;
  - `clienti`, `clienti_contacte`, `clienti_vehicule` S/I;
  - `evidente_avansuri` S/U;
  - `constatari` S/I/U;
  - `constatari_departamente` S/I/U;
  - `constatari_asteptare_piese` S/I/U;
  - `constatari_repartizari` S;
  - `service_personal` S;
  - `deviz_final_header` S;
- RPC: `create_deviz_final_from_constatare`;
- funcții: căutare/creare client și vehicul, constatare pe departamente, repartizare, stare, așteptare piese, previzualizare și generare deviz final;
- print: `constatare-print.html` prin `localStorage`.

### 4.2 Detailing

- fișier: `modules/formulare/detailing.html`;
- permisiune UI: `detailing`, cu fallback istoric `constatari`;
- date: `auth_profiles` S; `detailing` S/I/U/D/UPSERT;
- funcții: programare, pachet, estimare, stare, start/final și observații.

### 4.3 Evidență AWB

- fișier: `modules/formulare/evidenta-awb.html`;
- permisiune UI: `awb`, fallback `magazie`;
- date: `auth_profiles` S; `evidenta_awb` S/I/U;
- funcții: colet, curier, client, piesă, preț, status, retur, arhivare;
- include cod pentru actualizare Realtime.

### 4.4 Telefoane clienți

- fișier: `modules/formulare/telefoane-clienti.html`;
- permisiune UI: `telefoane`, fallback `devize`;
- date: `telefoane_clienti` S/I/U/D;
- funcție: registru simplu de nume, telefon și notițe;
- include cod pentru Realtime.

### 4.5 Generator

- fișier: `modules/formulare/generator.html`;
- permisiune UI: `generator`, fallback `magazie`;
- date: `generator_logs` S/I/U;
- funcții: pornire/oprire sesiune, combustibil, durată și observații;
- include cod pentru Realtime.

## 5. Flotă

### 5.1 Lista mașini

- fișier: `modules/flota/lista_masini.html`;
- permisiune UI: `lista_masini`, fallback `flota`;
- date: `auth_profiles` S; `flota_auto` S/I/U;
- funcții: număr, VIN, marcă, șofer și termene RCA/ITP/rovinietă;
- dependență: funcția Edge de alerte citește aceleași date.

### 5.2 Bază VIN

- fișier: `modules/flota/baza-vin.html`;
- permisiune UI: `baza_vin`, fallback `flota`;
- date: `baza_vin` S/I/U;
- funcție: mapare identificator intern → VIN;
- include cod pentru Realtime.

## 6. Stocuri și magazie

### 6.1 Consumabile

- fișier: `modules/stocuri/consumabile.html`;
- permisiune UI: `consumabile`, fallback `magazie`;
- date: `auth_profiles` S; `stoc_produse` S/I; `stoc_miscari` S/I; `stoc_view_curent` S;
- funcții: produse, intrări/ieșiri/ajustări, prag minim, export PDF;
- modificările destructive/corrections suplimentare există în Admin.

### 6.2 Piese în stoc din Google Sheets

- fișier: `modules/stocuri/piese_stoc.html`;
- permisiune UI: `piese_stoc`, fallback `magazie`;
- sursă: CSV public Google Sheets, parsare PapaParse și cache în `localStorage`;
- nu folosește Supabase;
- funcții: căutare/listare și inițiere conversație WhatsApp.

### 6.3 Evidență Facturi & Piese — frontend transferat, backend instalat

- Sursele LAB v2.3 au fost integrate local pe `feature-responsive` la 05.11.2026;
  **backendul EP este instalat și verificat read-only; frontendul nu este publicat**.
- Runtime: pagina/CSS/JS EP, `js/evidenta_piese_api.js`, `js/ep_df_import.js` și
  deltele punctuale HUB/Admin/DF/print; destinația folosește configurația sa existentă.
- În sidebar și carduri: **BIROU, imediat după Căutare Deviz**, accent turcoaz și NEW,
  fără intrare în SERVICE sau duplicare; linkul `.ep-back-hub` este păstrat.
- Admin are acces automat; ceilalți necesită JSON boolean `evidenta_piese: true`.
  Bifa este adăugată prin mecanismul existent Admin; autentificarea nu este schimbată.
- Candidatul include registre persistente, alocări parțiale, retururi/trimitere în
  magazie, implicit Admin și import real în DF cu snapshot istoric/idempotency;
  contractele instalate corespund adaptorilor, conform [verificării DB](03_SUPABASE.md#ep-productie-verificat-20261105).
- Probe locale statice/Chrome cu transport simulat și PostgreSQL izolat, distincte
  de verificarea read-only a producției la 05.11; acceptanța
  live rămâne **NEEDS_REVIEW**. [Stadiu și limite](evidenta_piese/PLAN_EVIDENTA_PIESE.md),
  [manifestul exact de transfer](../HANDOFF_CODEX.md).

### 6.4 Comenzi piese — placeholder

`modules/stocuri/comenzi_piese.html` conține doar o interfață incompletă și marcaj HTML problematic. Nu a fost identificat un flux de date activ. Modulul funcțional pentru comenzi este `comenzi_piese_sh`.

## 7. Dezmembrări

### 7.1 Interfață desktop

- fișiere: `modules/stocuri/dezmembrari.html`, `js/dezmembrari.js`, `css/dezmembrari.css`;
- permisiune UI: `dezmembrari_manage`;
- date: `dezmembrari_items` S/I/U; `dezmembrari_photos` S/I/U/D; `auth_profiles` S;
- funcții: vehicule, motoare, cutii, piese, preț, locație, fotografii, stări, publicare și operații de management;
- pe ecran mic pagina redirecționează către captura mobilă.

### 7.2 Captură mobilă

- fișiere: `modules/stocuri/dezmembrari_capture.html`, `js/dezmembrari_capture.js`, `css/dezmembrari_capture.css`;
- permisiune de date: `dezmembrari_capture` sau `dezmembrari_manage`/Admin;
- date: `auth_profiles` S, `dezmembrari_items` I și cleanup D condiționat, `dezmembrari_photos` S/UPSERT;
- Edge: upload, URL semnat, OCR și operații asupra fotografiilor.

Fotografiile sunt proiectate ca private în Google Drive/Cloudflare R2 și sunt referite prin metadate în Supabase.

## 8. Administrare

### 8.1 Panou Admin principal

`modules/admin/admin.html` este o pagină foarte mare cu taburi pentru:

- megafon/anunțuri (`admin_megafon`);
- alerte și flotă (`admin_alerte`);
- devize (`admin_devize`);
- consumabile (`admin_consumabile`);
- echipe/service (`admin_echipe`);
- dezmembrări (`dezmembrari_manage`);
- audit (`admin_audit`);
- utilizatori și permisiuni (`admin_useri`);
- TODO; în maparea observată, acest tab nu are o permisiune separată explicită.

Date accesate: `service_personal` S/I/U, `auth_profiles` S/U, `devize` S/U/D, `deviz_final_header` și `deviz_final_linii` S/D, `dezmembrari_items` S, `todo_tasks` CRUD, `audit_logs` S, `stoc_produse` S/U, `stoc_miscari` S/D, `admin_announcements` CRUD, `comenzi_piese_sh` S/U/D, `config_alerte` S/U și `flota_auto` S/U.

### 8.2 Panou control alternativ

`modules/admin/panou_control.html` este o interfață separată/mai veche pentru administrarea utilizatorilor. În checkout-ul curent, verificarea frontend acceptă `rol_id = 1` **sau** `permissions.panou_control === true`. În `admin.html`, verificarea pentru lista utilizatorilor acceptă Admin **sau** `permissions.admin_useri === true`, iar tabul este mapat la `admin_useri`. Regula de business rămâne Admin-only; autorizarea DB nu este dovedită de aceste condiții. Constatarea Admin-only în codul LAB din 22.10 rămâne istoric distinct, vezi [04](04_ROLURI_SI_ACCES.md).

Admin poate edita profilurile existente, rolurile și permisiunile prin operațiile implementate. În ambele interfețe, butoanele de **creare și ștergere utilizatori sunt placeholder-uri**, cu mesaj „Funcționalitate viitoare”; nu creează și nu șterg conturi. Procedura de creare a conturilor nu este documentată aici și nu se deduce din aceste butoane. Coexistența interfețelor cere păstrarea regulilor coerente.

## 9. Manager Dashboard

- fișiere active: `modules/manager/manager.html`, `modules/manager/manager.css`, `modules/manager/manager.js`; integrarea din `index.html` deschide această pagină;
- acces: rol Admin, rol Manager sau permisiunea `manager_dashboard`;
- date citite: `deviz_final_header`, `evidente_avansuri_plati`, `evidenta_awb`, `stoc_view_curent`, `detailing`, `constatari`, `constatari_asteptare_piese`, `generator_logs`, `plati_manager`, `comenzi_piese_sh`, `dezmembrari_items`;
- date scrise: statusul și metadatele plăților din `plati_manager`;
- funcții: indicatori și grafic pe șase luni, tab operațional, cereri de plată integrate, copiere IBAN și marcarea plătit pe cererea originală;
- valoare devize: `SUM(Number(total_manopera || 0) + Number(total_piese || 0))` din `deviz_final_header`, după `data_deviz`; nu folosește `total_general` și nu reprezintă încasări, venit contabil sau profit;
- avansuri: `SUM(suma)` din `evidente_avansuri_plati`, după `data_platii`, indicator separat, fără adunare peste devize;
- căutare: motorul comun `HubGlobalSearch` din Manager JS, reutilizat de HUB în modul `data-hub-search-only`, cu surse și permisiuni pe categorii;
- Dezmembrări: count exact pentru De completat (`draft`), evidențiat, și Gata de publicare (`ready`); numai Admin/gestiune completă, cu navigare la modul;
- Necesită atenție: fișe în așteptare/urgente, stoc invalid sau la/sub prag, piese SH nepotrivite, plăți neefectuate; lipsa surselor este marcată, fără valori fictive;
- stare locală: Managerul integrat și motorul comun de căutare sunt prezente în sursele curente; graficele folosesc DOM/CSS prin `renderTrend`, fără Chart.js, iar lipsa datelor are stări explicite. Browserul și publicarea rămân NEEDS_REVIEW;
- istoric LAB: înlocuirea vechiului Manager și testarea manuală pe mai mulți utilizatori raportată pozitiv la 16.10.2026 rămân dovezi ale acelui mediu. Detalii în documentele 18 și 19.

## 10. Dependențe funcționale între module

| Sursă | Consumator | Legătură confirmată |
|---|---|---|
| Clienți/vehicule | Constatare, Avansuri, Notificări | ID client/vehicul și număr de înmatriculare |
| Constatare | Deviz final | FK și RPC atomic |
| Comenzi piese SH | Deviz final | linie de deviz poate referi comanda folosită |
| Avansuri | Clienți & Notificări, Manager | vehicul și plăți |
| Produse + mișcări | Consumabile, Dashboard, Manager | view-ul `stoc_view_curent` |
| Flotă | Dashboard, Edge alerte | date expirare și șofer |
| Fotografii dezmembrări | Edge Function | metadate DB + obiecte private externe |
| Toate modulele majore | Dashboard/Admin audit | badge-uri/căutare și jurnalizare, unde helperul este inclus |

Nu există o dependență de cod între proiectul React de referință și aplicația principală.

## Actualizare 15.10.2026 — Deviz final și Avansuri

În checkout-ul principal, Deviz final are bifa **Include avans** și butonul **Importă Avans**. Avansul ales este păstrat ca linie `sectiune = 'avans'`, cu `avans_id` și sumă pozitivă; piesele rămân separate. Căutarea este prin RPC, iar salvarea obișnuită folosește RPC-ul atomic `save_deviz_final`. Printul afișează secțiunea AVANS și cele trei totaluri numai când există avans. Conversia din Constatare folosește în continuare RPC-ul ei.

Înregistrările din `evidente_avansuri` pot avea mai multe plăți. Un avans nou primește eligibilitate la INSERT prin trigger; un avans istoric cere reconciliere, iar plățile noi nu rescriu singure devizul salvat. Marcajul `✓ Inclus în DF-XXX` în Clienți & Notificări nu există în codul verificat. Paginile Deviz final/print din LAB conțin fluxul nou. Descrierea istorică prin acces direct S/I/U/D a fost reconciliată în §3.3: salvarea obișnuită folosește RPC-ul atomic, iar conversia din Constatare are RPC-ul separat.

## 11. Demonstrație independentă — fără integrare în HUB

[Registru lucrări demonstrativ](test_ai/registru-lucrari.html) se află în `documentatie_tehnica/test_ai/`, nu în `modules/`. Este o pagină independentă cu opt lucrări fictive locale, filtre, KPI și detalii în memorie. Nu folosește Supabase, nu persistă modificări și nu este integrată în navigația HUB. Nu reprezintă un modul activ, o funcție livrată sau un model de autorizare; nu se confundă cu pagina Clienți & Notificări, care are operații reale.
