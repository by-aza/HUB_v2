# 24. Modulul Clienți & Notificări (C&N)

Document canonic de analiză și referință tehnică pentru modulul Clienți & Notificări.  
Surse de adevăr analizate: `modules/devize/clienti-notificari.html`, `js/clienti-notificari.js`, `css/clienti-notificari.css`.  
Data analizei: 15.11.2026. Ultima actualizare: 17.11.2026.

---

## 1. Scopul modulului

Modulul **Clienți & Notificări** (C&N) centralizează gestiunea relației cu clienții service-ului, a parcului auto al fiecărui client, a termenelor legale/tehnice ale vehiculelor (ITP, RCA, revizii, schimb ulei, termene personalizate), a avansurilor financiare și a istoricului complet de service (fișe de constatare, devize estimative, devize finale și comenzi de piese). De asemenea, gestionează acordul de comunicare, preferințele de canal/prag și generarea programărilor de notificare pe baza șabloanelor configurabile.

---

## 2. Arhitectura curentă

- **Frontend:**
  - `modules/devize/clienti-notificari.html`: Pagina principală structurată în:
    - *Top bar:* Căutare globală rapidă (`/`), buton „Client nou”, navigare înapoi.
    - *KPI Grid:* 4 indicatori sintetici calculați direct din Supabase (clienți activi, vehicule active, termene ≤ 30 zile, avansuri active).
    - *Banda „Necesită atenție”:* Carduri orizontale cu termene depășite / scadente în ≤ 5 zile și notificări eșuate.
    - *Spațiu de lucru 60/40:*
      - Panou stânga: Tabel paginat adaptiv clienți & vehicule (un rând per vehicul), filtru activitate (Active / Inactive / Toate), căutare text și număr înmatriculare.
      - Panou dreapta (`#clientDrawer`): Dosarul clientului selectat cu 4 file (*General*, *Avansuri*, *Istoric service*, *Notificări*).
    - *Bara de automatizări (footer verde):* Acces la modalul de setări administrative (`#actionModal` în variantă `cn-module-settings-modal`), condiționat de rolul Admin (`rol_id === 1`) sau permisiunea `clienti_notificari_config`.
    - *Modaluri:* `#clientModal` (creare/editare client și vehicul), `#vehicleModal` (vehicul suplimentar), `#advanceModal` / `#advanceFormModal` / `#paymentModal` (avansuri și plăți), `#reminderModal` (rămășiță demo), `#actionModal` (reutilizat pentru preview și setări modul).
  - `css/clienti-notificari.css`: Stiluri dedicate, paletă dark HUB AUTO v2, layout flex/grid, reguli responsive (desktop, tabletă ≤ 1100px, mobil ≤ 720px), variabile CSS locale.
  - `js/clienti-notificari.js`: Script client-side Vanilla JS (1.559 linii) care comunică direct cu Supabase prin `supabaseClient` (`@supabase/supabase-js` v2).
- **Backend & Date:** Supabase REST Data API (PostgREST) securizat prin RLS (Row Level Security), apelat direct din browser cu tokenul de sesiune al utilizatorului autentificat.

---

## 3. Stadiul implementării (Categorizare strictă)

### 3.1 IMPLEMENTED (Funcționalități active și funcționale în cod)

1. **Autentificare și autorizare acces setări:**
   - Verificare sesiune activă și citire `rol_id` + `permissions` din `auth_profiles`.
   - Afișarea butonului „Setări modul” exclusiv pentru administratori (`rol_id === 1`) sau utilizatori cu permisiunea `clienti_notificari_config === true`.
2. **Indicatori sintetici (KPI) și excepții („Necesită atenție”):**
   - Calcul live în paralel (`loadRealSummary`) pentru: număr clienți activi, vehicule active, termene active scadente în ≤ 30 zile, număr fișe avans active nearhivate.
   - Listă derulabilă de excepții pentru termene expirate / scadente în ≤ 5 zile și notificări eșuate. Click-ul pe un card de atenție selectează instant vehiculul și deschide dosarul.
3. **Listă clienți & vehicule (Master Table):**
   - Un rând per vehicul, asociat clientului corespunzător.
   - Paginare adaptivă dinamică calculată pe baza înălțimii viewport-ului (`calculateRowsPerPage`).
   - Căutare combinată în timp real: nume client, telefon, email, VIN, marcă/model, cod client și număr înmatriculare (cu normalizare caractere).
   - Filtru de activitate: *Active* (client activ + vehicul activ), *Inactive / Arhivă* (client inactiv sau vehicul inactiv/vândut/casat), *Toate*.
   - Indicatori vizuali de profil (rol strict vizual, nu influențează ordinea):
     - profil incomplet (`is-incomplete`) — portocaliu;
     - client recent introdus în ultimele 5 zile (`is-new`) — albastru / etichetă NEW;
     - profil normal / client mai vechi (`is-regular`) — alb.
   - Sortare cronologică:
     - Ordonare după `clienti.created_at DESC` (clientul introdus cel mai recent apare primul);
     - La egalitate de dată se aplică sortare secundară după `clientId DESC`;
     - Lista nu mai prioritizează clienții incompleți sau pe cei recenți (NEW).
4. **Dosar client — Antet și Fila General:**
   - Afișare dată introducere client: poziționată în antetul dosarului (sub acțiunea „Editare”), în format `DD.MM.YYYY`, preluată din `clienti.created_at`.
   - Culoare contextuală dată: nuanță teal/verde (`var(--cyan)`) pentru profil normal (`is-regular` / `new`) și portocalie (`var(--amber)`, clasa `is-incomplete`) pentru profil incomplet.
   - Copiere în clipboard prin click direct pe valori:
     - Număr de telefon (secțiunea de contact a clientului);
     - Număr de înmatriculare (vehiculul selectat în antet și cardurile de vehicul din lista clientului);
     - Serie de șasiu (VIN).
     - Clasa `.cn-copy-value` oferă indicator de cursor și efect hover discret;
     - Copierea este confirmată prin componenta toast existentă (`showToast`): „Telefon copiat”, „Număr înmatriculare copiat”, respectiv „VIN copiat”.
   - Tratare valori lipsă: valorile inexistente, goale sau marcate „Nespecificat” / „—” nu primesc clasă de copiere și nu sunt clickabile.
   - Date contact și canale: afișare telefon preferat, email preferat, stare acord comunicare, canale selectate (WhatsApp, Email, SMS) și praguri de notificare (30, 15, 5, 0 zile).
   - Observații text client.
   - Listă compactă a tuturor vehiculelor clientului cu badge-uri de stare și comutare rapidă a vehiculului activ (fără a declanșa re-randarea sau schimbarea selecției la copiere).
   - Listă sumară a termenelor scadente pentru mașina selectată.
   - Buton „Editare” dosar și buton „+ Constatare nouă” (cu redirecționare spre `modules/formulare/constatari_v2.html?action=new-from-cn&client_id=...&vehicle_id=...`).
5. **Dosar client — Fila Avansuri (Gestiune financiară per vehicul):**
   - Încărcare la cerere a fișelor din `evidente_avansuri` și plăților din `evidente_avansuri_plati` legate de `vehicle_id`.
   - Corelare automată a fișei de avans cu vizita de service din `constatari` (prin ID sau dată).
   - Carduri expandabile per fișă: total încasat, număr plăți, status (`Avans încasat`, `Achitat integral`, `Arhivat`), istoric plăți cu dată, metodă și sumă.
   - Formular adăugare fișă nouă de avans (`#advanceFormModal`) cu inserare obligatorie a plății inițiale și **mecanism de rollback compensator** (ștergere fișă dacă salvarea plății eșuează).
   - Formular adăugare plată nouă pe o fișă existentă (`#paymentModal`).
   - Acțiune de marcare „Achitat integral” prin actualizarea observațiilor fișei (`evidente_avansuri.observatii`).
6. **Dosar client — Fila Istoric service (4 vizualizări complete):**
   - Încărcare integrată la cerere din 8 surse Supabase: `constatari`, `constatari_departamente`, `devize`, `deviz_final_header`, `comenzi_piese_sh`, `ep_alocari`, `ep_factura_linii`, `ep_facturi`.
   - *Cronologie:* axă unificată a tuturor evenimentelor (fișe, devize estimative, devize finale, comenzi piese) sortate descrescător după dată.
   - *Fișe service:* vizite de service din `constatari` cu detalii expandabile (reclamație client, constatări mecanici, lucrări departamente, kilometraj, status) și buton de deschidere directă a fișei (`constatari_v2.html?constatare_id=...`).
   - *Devize:* listă compactă de devize estimative (`deviz.html?id=...`) și finale (`deviz_final.html?id=...`) cu sume totale și linkuri externe.
   - *Piese (agregare dublă sursă SH + Factură):*
     - **Comenzi Piese SH (`public.comenzi_piese_sh`):** comportamentul existent este păstrat neschimbat (interogare după `nr_inmatriculare` normalizat). În interfață este afișat badge-ul `SH`.
     - **Piese atribuite din facturi (`public.ep_alocari` + `public.ep_factura_linii` + `public.ep_facturi`):**
       - Relații: `ep_alocari.linie_id = ep_factura_linii.id`, `ep_factura_linii.factura_id = ep_facturi.id`.
       - Asocierea cu vehiculul selectat în C&N se face prin cheia directă: `ep_alocari.vehicle_id = vehicleId`.
       - În interfață este afișat badge-ul `FACTURĂ`.
       - Afișează detalii complete: număr și dată factură, furnizor, cantitate alocată / eliberată, cod piesă și denumire.
     - Lista este combinată cronologic, sortată descrescător după data comenzii / facturii.
7. **Istoric piese SH:** IMPLEMENTED (comenzile de piese second-hand sunt afișate complet, cu preț, furnizor, transport și observații).
8. **Istoric piese din facturi pentru alocări cu `vehicle_id`:** IMPLEMENTED (piesele din facturi atribuite vehiculului selectat prin `vehicle_id` apar automat în tabul Piese).
9. **Atribuire automată `vehicle_id` pentru alocări noi:** IMPLEMENTED (în fluxul de alocare piese din facturi, numărul auto este normalizat și căutat în `public.clienti_vehicule`; dacă există exact un vehicul corespondent, `id`-ul său este salvat în `ep_alocari.vehicle_id`, păstrând totodată `nr_inmatriculare_original`; dacă nu există o potrivire unică, `vehicle_id` rămâne `NULL` fără a bloca alocarea).
10. **Dosar client — Fila Notificări (Calcul eligibilitate și programare):**
   - Sincronizare automată la afișare (`syncRealNotificationHistory`):
     - Anulează programările vechi (`status = 'anulata'`) dacă s-a modificat data termenului din `clienti_vehicule_termene`.
     - Verifică acordul clientului, existența canalului (telefon pentru WhatsApp/SMS, email pentru Email), suprapunerea pragurilor clientului cu cele globale din configurare.
     - Calculează data/ora programată (`programata_pentru`) pe baza orei globale de rulare.
     - Generează textul complet al mesajului prin substituirea variabilelor în șablonul corespunzător.
     - Inserează programările noi în `clienti_notificari_istoric` cu `status = 'programata'` (cu protecție anti-duplicate la nivel de interogare și index unic DB).
   - Sumar grafic canale active și praguri active.
   - Gruparea vizuală a programărilor viitoare pe termen și dată.
   - Previzualizare mesaj generat (`#actionModal`) cu textul complet compus.
11. **Administrare configurare notificări (Modalul „Setări modul”):**
   - *Tab Automatizări:* bifare praguri active (30, 15, 5, 0 zile) și selectare oră de rulare zilnică; salvare directă pe rândul `id = 1` din `clienti_notificari_config`.
   - *Tab Canale:* activare/dezactivare canale globale (WhatsApp, Email, SMS); salvare în `clienti_notificari_config`.
   - *Tab Șabloane mesaje:* editare mesaje pentru cele 5 tipuri (`itp`, `rca`, `revizie`, `schimb_ulei`, `personalizat`), butoane pentru inserare variabile la cursor, preview live, validare strictă a variabilelor obligatorii înainte de UPDATE în `clienti_notificari_sabloane`.
   - *Tab Reguli notificări:* panou informativ detaliat cu regulile de anti-duplicate, eligibilitate și protecție.
12. **Formulare de creare și editare:**
   - Adăugare client nou cu generare automată de cod client secvențial (`CL-XXXXX`) cu reîncercare la coliziune concurentă.
   - Validare în browser a unicității numărului de înmatriculare și a seriei VIN înainte de salvare.
   - Salvare/actualizare contacte principale în `clienti_contacte` (telefon și email).
   - Gestiune termene vehicul în formularul de editare: editare date ITP, RCA, Revizie, Schimb ulei, adăugare/eliminare termene personalizate, buton de resetare/dezactivare rapidă a termenelor standard.
   - Anularea automată a programărilor devenite neeligibile (`cancelIneligibleClientNotifications`) dacă la editarea clientului s-au dezactivat canale, praguri sau acordul de comunicare.
   - Adăugare vehicul suplimentar pentru un client existent (`#vehicleModal`).

---

### 3.2 PARTIALLY IMPLEMENTED (Implementare parțială sau hibridă)

1. **Vizibilitate piese istorice din facturi (Historical invoice part visibility):**
   - Rândurile `ep_alocari` create istoric anterior actualizării fluxului de alocare pot avea `vehicle_id = NULL`.
   - Aceste alocări istorice nu apar în prezent în *Clienți & Notificări → Istoric service → Piese* (care interoghează exclusiv după `vehicle_id`).
   - Nu a fost rulat un backfill automat în baza de date; decizia este intenționată deoarece cazurile istorice impun reconciliere manuală între alocările din facturi, piesele din devize estimative și cele din devize finale.
   - Reconcilierea alocărilor istorice nu este implementată.
2. **Corelarea devizelor estimative, finale și a pieselor SH:**
   - Fișele din `constatari` și alocările noi de facturi (`ep_alocari`) se corelează direct prin cheia externă `vehicle_id`.
   - Devizele estimative (`devize`), devizele finale (`deviz_final_header`) și comenzile SH (`comenzi_piese_sh`) sunt interogate exclusiv după numărul de înmatriculare normalizat (`nr_inmatriculare`), deoarece tabelele legacy nu dețin o cheie străină sigură `vehicle_id`. Dacă mașina își schimbă numărul, istoricul vechi nu este asociat automat.
3. **Închiderea financiară a avansului („Achitat integral”):**
   - Nu există o coloană dedicată în schema `evidente_avansuri` (de ex. `status_plata` sau `este_achitat`).
   - Închiderea se realizează prin convenție text: adăugarea textului `\nAchitat integral` în câmpul `observatii` și filtrare prin expresie regulată `/achitat\s+(integral|total)/`.
4. **Gestiunea termenelor din dosar:**
   - Adăugarea și modificarea termenelor vehiculului se pot face doar prin intrarea în formularul complet de editare al clientului/vehiculului (`#clientModal`). Nu există un dialog dedicat și rapid de adăugare/editare termen direct din fila General sau Notificări.
5. **Detectarea schemelor flexibile:**
   - Modulul detectează la runtime dacă există coloanele opționale `clienti.observatii`, `clienti_vehicule.an_fabricatie`/`an` și `clienti_vehicule.observatii`. Deși oferă robustețe față de discrepanțele istorice LAB vs. producție, crește complexitatea inițializării.

---

### 3.3 NOT IMPLEMENTED (Funcționalități neimplementate / lipsă)

1. **Trimiterea efectivă a notificărilor (Dispatching engine):**
   - **Nu există niciun motor de expediere:** nici webhook, nici cron job automat în frontend, nici rută backend / Edge Function declanșată din pagină.
   - Butoanele de acțiune rapidă WhatsApp / Email din vechiul tab de notificări generează doar un dialog informativ („Nu se deschide WhatsApp și nu se trimite nimic”).
   - Înregistrările din `clienti_notificari_istoric` rămân cu `status = 'programata'`. Niciun proces din frontend nu le trece în `trimisa` sau `esuata`.
2. **Ștergerea fizică a clienților sau vehiculelor:**
   - Nu există opțiune de ștergere în UI (conform regulilor HUB AUTO și restricțiilor RLS). Dezactivarea se face prin schimbarea statusului în `inactiv`, `vandut` sau `casat`.
3. **Gestiunea șabloanelor suplimentare:**
   - Nu se pot crea tipuri noi de șabloane din UI; sunt suportate strict cele 5 tipuri predefinite (`itp`, `rca`, `revizie`, `schimb_ulei`, `personalizat`).
4. **Filtre avansate în lista principală:**
   - Filtrele secundare de tip reminder, canal și status sunt ascunse în HTML (`.cn-filters[hidden]`) și nu sunt conectate la logica de filtrare.

---

## 4. Rămășițe demo și cod nefolosit (Obsolete / Demo Remnants)

Deși modulul folosește date reale Supabase pentru toate operațiunile principale, scriptul `js/clienti-notificari.js` păstrează un bloc extins de cod demonstrativ rămas din prototipul inițial:

1. **Constante și date fictive în memorie:**
   - `DEMO_TODAY = "2026-10-04"` (linia 4).
   - `initialClients` (linii 7–20): 8 clienți fictivi cu vehicule, remindere și vizite mock.
   - `initialAdvances` (linii 23–28): 4 fișe mock de avans cu plăți simulate.
   - Variabilele de stare: `clients`, `advances`, `nextAdvanceId`, `nextPaymentId`.
2. **Funcții demo paralele (Dead/Fallback Code):**
   - `allRows()`, `financialStatus()`, `rowStatus()`, `statusTone()`, `advanceTotal()`, `vehicleAdvances()`, `vehicleTotal()`, `paymentCount()`.
   - `dossierHeader()`, `generalTab()`, `advancesTab()`, `serviceTab()`, `notificationsTab()`, `renderDossier()`.
   - `openClientModal()` (versiunea demo apelată dacă `clientListState !== 'ready'`).
   - `openAdvanceManager()`, `renderAdvanceManager()`, `advanceCard()`, `archiveAdvance()`, `toggleFinancialCompletion()`.
   - `openNoteForm(client)`: adaugă notițe doar în array-ul local din memorie `client.notes`.
   - `openReminderModal()`: asociat formularului `#reminderModal`, adaugă remindere strict în `getSelectedVehicle().reminders` din memorie, fără persistență în Supabase.
   - `previewAction("whatsapp" | "email" | "offer")`: dialoguri statice de simulare.
   - `showRestrictedAutomation()`: ecran mock de acces restricționat.
3. **Elemente HTML inactive:**
   - `div.cn-filters[hidden]` (linia 23): conține `#deadlineTabs`, `#typeFilter`, `#channelFilter`, `#statusFilter`. Sunt ascunse permanent și ignorate de funcția `filteredRows()`.
   - `#reminderModal` (linia 45): modal rămas exclusiv pentru fluxul demo.

---

## 5. Neconcordanțe între HTML, JS și CSS

1. **Filtre moarte în DOM:**  
   HTML definește controalele `#deadlineTabs`, `#typeFilter`, `#channelFilter`, `#statusFilter` în interiorul unui wrapper `<div class="cn-filters" hidden>`. În JS există referințe DOM (`dom.typeFilter`, etc.) și handlere de evenimente la linia 1548, însă funcția de filtrare `filteredRows()` citește doar `dom.search` și `activityScope`. Controalele sunt complet inactive.
2. **Dublă ascultare pe evenimentul global de click:**  
   În `js/clienti-notificari.js` există două apeluri distincte `document.addEventListener("click", ...)` (linia 1503 și linia 1535). Anumite selectoare (ex. `[data-select-client]`) sunt verificate în ambele handlere.
3. **Modalul `#reminderModal` deconectat de backend:**  
   HTML include formularul `#reminderModal` (linia 45) cu selectoare pentru tip termen, dată și observații. În JS, submit-ul acestui formular salvează doar în memoria locală demo, în timp ce salvarea reală în `clienti_vehicule_termene` este implementată separat în `#clientModal`.
4. **Stil inline redundant:**  
   În HTML linia 29: `<button id="automationSettingsBtn" ... hidden style="display:none">`. În JS linia 68 se setează ambele proprietăți, iar la autorizare se elimină ambele.

---

## 6. Tabele și câmpuri Supabase utilizate

Modulul interacționează cu un total de **18 tabele Supabase**:

| Tabel Supabase | Operații | Câmpuri utilizate | Scop în modul |
|---|---|---|---|
| `auth_profiles` | SELECT | `rol_id`, `permissions` | Verificare drept de configurare setări modul (`rol_id === 1` sau permisiunea `clienti_notificari_config`). |
| `clienti` | SELECT, INSERT, UPDATE | `id`, `cod_client`, `nume`, `status_activitate`, `status_profil`, `tip_client`, `sursa_creare`, `created_at`, `updated_at`, `acord_notificari`, `canal_whatsapp`, `canal_email`, `canal_sms`, `prag_30`, `prag_15`, `prag_5`, `prag_0`, `observatii` (opțional) | Datele principale de identificare ale clientului, data introducerii (afișată în dosar și folosită la sortarea descrescătoare a listei), starea profilului și preferințele globale de comunicare. |
| `clienti_vehicule` | SELECT, INSERT, UPDATE | `id`, `client_id`, `nr_inmatriculare`, `marca_model`, `serie_vin`, `status_vehicul`, `created_at`, `updated_at`, `an_fabricatie` / `an` (opțional), `observatii` (opțional) | Vehiculele asociate fiecărui client, status operațional/arhivă și date tehnice de identificare. |
| `clienti_contacte` | SELECT, INSERT, UPDATE | `id`, `client_id`, `tip` (`telefon`, `email`), `valoare`, `este_principal`, `eticheta`, `updated_at` | Contactele de comunicare ale clienților. Se salvează și se actualizează contactul marcat principal. |
| `clienti_vehicule_termene` | SELECT, INSERT, UPDATE | `id`, `vehicle_id`, `tip` (`itp`, `rca`, `revizie`, `schimb_ulei`, `personalizat`), `denumire`, `data_termen`, `activ`, `updated_at` | Termenele scadente ale fiecărui vehicul. Ștergerea se realizează logic prin `activ = false`. |
| `clienti_notificari_config` | SELECT, UPDATE | `id`, `prag_30`, `prag_15`, `prag_5`, `prag_0`, `ora_rulare`, `canal_whatsapp`, `canal_email`, `canal_sms`, `updated_at`, `updated_by` | Configurația globală a automatizărilor (rând unic cu `id = 1`). |
| `clienti_notificari_sabloane` | SELECT, UPDATE | `id`, `tip`, `denumire`, `text_mesaj`, `variabile_obligatorii`, `updated_at`, `updated_by` | Șabloanele de text pentru cele 5 tipuri de termene și validarea variabilelor permise. |
| `clienti_notificari_istoric` | SELECT, INSERT, UPDATE | `id`, `client_id`, `vehicle_id`, `termen_id`, `data_termen`, `prag_zile`, `canal`, `status` (`programata`, `anulata`, `trimisa`, `esuata`), `mesaj`, `programata_pentru`, `created_at` | Coada de programări și istoricul notificărilor per client/vehicul/termen. |
| `evidente_avansuri` | SELECT, INSERT, UPDATE, DELETE (compensator) | `id`, `vehicle_id`, `nr_inmatriculare`, `model_masina`, `data_crearii`, `observatii`, `este_arhivat` | Fișele de avans asociate vehiculului. DELETE este folosit strict la eșecul inserării plății inițiale. |
| `evidente_avansuri_plati` | SELECT, INSERT | `id`, `avans_id`, `suma`, `metoda_plata`, `observatii`, `data_platii`, `created_at` | Plățile individuale încasate în contul unei fișe de avans. |
| `constatari` | SELECT | `id`, `nr_fisa`, `client_id`, `vehicle_id`, `nr_inmatriculare`, `model_masina`, `created_at`, `data_finalizarii`, `status`, `defectiuni_client`, `defectiuni_mecanic`, `observatii`, `kilometraj`, `km_iesire` | Vizitele de service ale vehiculului și legătura contextuală cu avansurile. |
| `constatari_departamente` | SELECT | `constatare_id`, `departament`, `constatari`, `lucrari_efectuate` | Detalii de diagnostic și manoperă pe departamente pentru fiecare fișă de constatare. |
| `devize` | SELECT | `id_deviz`, `data_deviz`, `nr_inmatriculare`, `autovehicul`, `total_general` | Devize estimative filtrate după numărul de înmatriculare normalizat. |
| `deviz_final_header` | SELECT | `id_deviz_final`, `data_deviz`, `nr_inmatriculare`, `auto`, `total_general` | Devize finale de facturare filtrate după numărul de înmatriculare normalizat. |
| `comenzi_piese_sh` | SELECT | `id`, `data_comanda`, `denumire_piesa`, `furnizor`, `status`, `pret_piesa`, `pret_transport`, `observatii`, `nr_inmatriculare` | Comenzi de piese din dezmembrări asociate vehiculului prin numărul auto. |
| `ep_alocari` | SELECT | `id`, `vehicle_id`, `linie_id`, `cantitate`, `cantitate_eliberata`, `created_at` | Alocările de piese din facturi către vehicul (`vehicle_id`), corelate cu linia de factură (`linie_id`). |
| `ep_factura_linii` | SELECT | `id`, `factura_id`, `denumire`, `cod_piesa`, `cantitate`, `pret_achizitie_net` | Liniile facturilor de piese asociate prin cheia externă din alocare. |
| `ep_facturi` | SELECT | `id`, `numar`, `data_factura`, `furnizor_denumire_originala` | Antetul facturii de achiziție piese asociat liniei de factură. |

---

## 7. Limite tehnice și arhitecturale curente

1. **Lipsa motorului de trimitere (Dispatch):**  
   Modulul generează doar înregistrări planificate (`status = 'programata'`) în `clienti_notificari_istoric`. Expedierea automată prin gateway-uri externe (Twilio, WhatsApp Cloud API, SMTP/Resend etc.) nu este implementată în aplicație.
2. **Limitarea datelor istorice pentru alocările din facturi (Legacy `ep_alocari`):**  
   Alocările de piese din facturi create anterior introducerii atribuirii automate de `vehicle_id` pot avea `vehicle_id = NULL`. Acestea rămân invizibile în tabul Piese al dosarului până la reconcilierea manuală (neexistând un script automat de backfill, pentru a nu introduce asocieri eronate fără verificarea devizelor estimative și finale).
3. **Corelare prin număr de înmatriculare pentru devize și comenzi SH:**  
   Tabelele `devize`, `deviz_final_header` și `comenzi_piese_sh` sunt asociate prin `nr_inmatriculare` (string normalizat). Schimbarea numărului de înmatriculare rupe continuitatea istoricului pentru documentele create pe vechiul număr.
4. **Dependența de formatul observațiilor pentru „Achitat integral”:**  
   Starea de achitare integrală a unei fișe de avans nu este reprezentată ca un câmp boolean dedicat în baza de date, ci este dedusă din textul câmpului `observatii`.
5. **Interogări multiple la inițializare:**  
   La deschiderea modulului se citesc toți clienții, toate vehiculele, toate contactele, toate termenele active și programările pentru a construi tabela combinată în memorie (folosind paginare de 1.000 rânduri per cerere). La volume mari de date (peste 10.000 de înregistrări), această abordare va necesita trecerea la paginare direct pe server (SQL RPC sau VIEW).

---

## 8. Restanțe și pași următori (Remaining TODO)

- [ ] **Reconciliere date istorice alocări facturi:** Reconcilierea manuală a rândurilor `ep_alocari` cu `vehicle_id = NULL` (între facturile de intrare, devizele estimative și devizele finale) pentru a le asocia vehiculului corespunzător.
- [ ] **Curățarea codului demo:** Eliminarea structurilor mock (`initialClients`, `initialAdvances`), a funcțiilor moarte aferente și unificarea definitivă pe fluxul real.
- [ ] **Eliminarea elementelor DOM inactive:** Ștergerea sau reactivarea filtrelor ascunse din `.cn-filters` și eliminarea modalului `#reminderModal` redundant.
- [ ] **Optimizare event listeners:** Unificarea celor două handlere globale de `click` într-un singur dispatcher coerent.
- [ ] **Implementare backend de trimitere notificări:** Crearea unei funcții Edge / Cron job Supabase care să citească la `ora_rulare` notificările cu `status = 'programata'` din ziua respectivă și să execute expedierea efectivă.
- [ ] **Coloană dedicată pentru status avans:** Introducerea unei coloane structurate (ex. `status_plata enum('deschis', 'avans_incasat', 'achitat_integral')` sau `este_achitat boolean`) în `evidente_avansuri` pentru a elimina dependența de parsarea string-ului din `observatii`.
- [ ] **Modal dedicat de gestiune termene:** Permiterea adăugării sau editării rapide a termenelor direct din fișa vehiculului, fără deschiderea formularului mare de client.
