# Fluxurile principale ale aplicației

## Fluxuri păstrate sub RLS — 21.10.2026

Toate cele 36 tabele publice sunt ACTIVE ÎN PRODUCȚIE și ACTIVE ÎN LAB. Userul confirmă finalizarea și testele funcționale ale ultimelor Devize; verificarea actuală este numai de catalog.

- Loginul existent și identitatea autorului rămân; numai Admin modifică roluri/bife. Nu se activează Turnstile/AUTH avansat.
- Salvarea Devizului Final rămâne în save_deviz_final: antet + DELETE/INSERT linii + recalcularea totalurilor sunt atomice. Dreptul DELETE pe linii este necesar editării prin RPC, nu înseamnă drept de ștergere administrativă a antetului.
- Importul avansului citește fișa/plățile cu blocările existente, păstrează vehicle_id, unicitatea avans_id și totalul achitat real. total_general este restul de plată. Printul folosește instantaneul salvat, fără a reciti plățile la print.
- Constatări păstrează statusurile, intervalele de așteptare, salvarea pe cinci departamente și generarea DF prin RPC. Repartizările relaționale sunt citite; responsabilii editabili sunt text în antetul constatării.
- Sincronizarea unei constatări cu registrul C&N necesită accesul acelui registru deja protejat; nu s-au lărgit politicile C&N pentru a masca această dependență.
- Auditul se inserează cu actor propriu inclusiv pentru utilizatori fără drept general de consultare; istoricul contextual are regula constatari.
- Alertele automate identificate citesc config_alerte prin Edge/backend service_role, apoi apelează Google Apps Script; nu cer sesiune HUB. Sursa Google și livrarea end-to-end nu au fost revalidate aici.
- Contracte are RLS pe date, dar fișierele Storage au încă reguli publice în producție; acestea nu sunt echivalente.

Regulile exacte și restanțele Generator/TODO/GRANT/Storage sunt în [09_MATRICE_ACCES.md](09_MATRICE_ACCES.md) și [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md). Nu s-au executat din nou probele modulelor în această rundă.

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Reguli curente care se aplică fluxurilor — 19.10.2026

Loginul poreclă/email și parolă se păstrează fără CAPTCHA sau verificări suplimentare.
Identitatea sesiunii este utilizată pentru autorul înregistrărilor și permisiuni; nu înlocuiește
protecția RLS a operațiilor. Admin este permis indiferent de bifă; ceilalți conform permisiunilor.
Numai Admin poate modifica rolurile și bifele; protecția minimă se testează separat în LAB.

Contracte are RLS ACTIV și teste S/I/U/D PASS în LAB, confirmate de utilizator; în producție
pachetul este încă NEAPLICAT. Acest PASS nu creează un nou buton DELETE în fluxul UI și
nu confirmă securitatea fotografiilor Storage. Celelalte fluxuri de business rămân păstrate.
AUTH avansat/Turnstile sunt suspendate. LAB rămâne permanent, fără reclonare după test.

[Stadiu și proveniența dovezilor](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

## Fluxuri inspectate și actualizări istorice

## 1. Autentificare și rutare

```text
Login (email sau poreclă)
  → Supabase Auth
  → auth_profiles + auth_roles
  → audit login
  → redirecționare pe rol
      Mecanic → Constatare v2
      Vopsitor → Detailing
      Manager → Dashboard HUB → Manager Dashboard
      ceilalți → Dashboard HUB
  → navigare filtrată după permissions
```

Un `returnTo` este păstrat numai pentru aceeași origine. Dacă sesiunea lipsește, paginile care verifică explicit autentificarea redirecționează spre login. Aplicarea nu este uniform centralizată.

## 2. Dashboard operațional

1. se citește sesiunea și profilul;
2. se construiește `window.USER_DATA`;
3. meniul și cardurile se filtrează după rol și permisiuni;
4. se citesc tabelele necesare pentru badge-uri, alerte și căutare;
5. utilizatorul poate căuta transversal clienți/mașini/documente operaționale;
6. actualizarea este încercată prin Realtime și completată prin polling la 60 de secunde.

Dashboardul nu scrie în majoritatea modulelor, ci agregă starea lor pentru navigare și alertare.

## 3. Client și vehicul → Constatare

```text
Număr de înmatriculare
  → căutare clienti_vehicule
  ├─ vehicul existent → încărcare client/contact/date auto
  └─ vehicul nou → creare client + vehicul + contact
  → completare constatare
  → salvare constatari
  → salvare/actualizare constatari_departamente
  → repartizare personal / așteptare piese
  → audit
```

Modulul păstrează și câmpuri snapshot în `constatari` (număr, model, date client), în paralel cu `client_id` și `vehicle_id`. Pentru avansuri vechi găsite după număr, codul poate lega rândul la vehiculul central.

## 4. Constatare → Deviz final

1. utilizatorul deschide o constatare eligibilă;
2. pagina construiește previzualizarea antetului și liniilor;
3. se verifică dacă există deja un deviz final asociat;
4. browserul apelează `create_deviz_final_from_constatare`;
5. funcția SQL verifică autentificarea, permisiunea, payloadul și unicitatea;
6. antetul și liniile sunt inserate în aceeași tranzacție;
7. ID-ul devizului creat este returnat către interfață.

Acesta este unul dintre cele mai bine delimitate fluxuri, deoarece integritatea operației principale este mutată din browser în RPC.

## 5. Deviz estimativ → Deviz final → Tipărire

- Devizul estimativ se salvează în `devize`, cu piesele în JSONB.
- Căutarea poate consulta atât `devize`, cât și `deviz_final_header`.
- Devizul final poate importa informații dintr-un deviz estimativ sau dintr-o constatare.
- Antetul și liniile finale sunt normalizate în două tabele.
- Liniile pot referi o comandă de piesă SH folosită.
- Pentru tipărire, datele sunt transferate local către pagina dedicată și apoi se declanșează printul browserului.

Persistența documentelor salvate este în Supabase; salvarea obișnuită a Devizului Final folosește RPC-ul atomic `save_deviz_final`. Istoric, `localStorage` era descris aici doar drept canal temporar pentru tipărire. Din 17.10.2026 există și ciorne locale DF separate, fără salvare automată în Supabase; vezi [20 Ciorne locale](20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md).

## 6. Comandă piesă SH

```text
Creare comandă
  → comenzi_piese_sh (creator și timestamp)
  → comandată
  → în tranzit (curier/AWB)
  → sosită
  ├─ montată → poate fi asociată unei linii de deviz final
  └─ incompatibilă → returnată sau listată
  → arhivare/restaurare/reordonare după caz
```

Triggerul SQL păstrează metadatele de creare și actualizează actorul/timpul, inclusiv câmpurile de arhivare. Utilizatorii obișnuiți nu au flux de ștergere; Adminul poate șterge din panoul administrativ.

## 7. Clienți & Notificări

Fluxul confirmat în cod este:

1. încărcarea registrului central de clienți, vehicule și contacte;
2. asocierea termenelor cu vehiculul;
3. calcularea stării/pragului unui termen;
4. citirea configurației și a șabloanelor;
5. pregătirea/înregistrarea istoricului notificării;
6. corelarea profilului clientului cu constatări, devize, comenzi și avansuri.

Modulul este hibrid: o parte semnificativă folosește date live, dar eticheta DEMO și anumite structuri în memorie arată că nu toate acțiunile UI sunt dovedite ca fluxuri operaționale definitive. Nu este confirmată o funcție backend separată care să expedieze automat notificările din acest modul.

## 8. Avansuri și plăți

1. se selectează sau se identifică vehiculul;
2. se creează `evidente_avansuri`;
3. una sau mai multe plăți sunt adăugate în `evidente_avansuri_plati`;
4. avansul poate fi actualizat, arhivat sau șters din modul;
5. plățile sunt consumate de Dashboard și Manager pentru agregări.

`plati_manager` este un flux separat pentru plăți către beneficiari. Manager Dashboard poate marca plata ca achitată și completa metadatele aferente.

## 9. Consumabile și stoc

```text
stoc_produse
  + stoc_miscari (in / out / adjustment)
  → stoc_view_curent
  → Modul Consumabile
  → Dashboard / Manager / Admin
```

Utilizatorul creează produsul și mișcările. View-ul calculează cantitățile agregate și stocul curent. Modulul poate genera raport PDF în browser. Adminul are operații suplimentare pentru corecții și ștergerea mișcărilor.

`piese_stoc.html` este un flux distinct: descarcă un CSV public din Google Sheets, îl parsează și îl memorează local. Nu actualizează tabelele de stoc Supabase.

## 10. Contract cu documente

1. utilizatorul introduce datele contractului;
2. imaginile sunt comprimate în browser;
3. obiectele sunt încărcate în bucket-ul `documente_contracte`;
4. se obțin URL-uri publice;
5. URL-urile sunt salvate în câmpul JSONB al contractului;
6. contractul poate fi actualizat ulterior.

Fluxul este funcțional, dar bucket-ul și politicile sunt publice, deci controlul de acces al paginii nu protejează obiectele.

## 11. Flotă și alerte automate

```text
Lista mașini → flota_auto + termene
                     ↓
Cron zilnic trimite-alerte-job
                     ↓
Edge Function trimite-alerte
  → config_alerte + flota_auto
  → praguri 30/10/3/0 zile
  → Google Apps Script
  → email general / șofer
```

Expresia cron este `0 8 * * *`; fusul orar exact rămâne neconfirmat. Funcția distribuită rulează fără verificare JWT și are acces service role.

## 12. Dezmembrări și fotografii

### Captură

1. utilizatorul autentificat deschide fluxul mobil;
2. pagina validează permisiunea de captură/management;
3. se creează itemul de bază;
4. fotografiile sunt trimise prin funcția Edge;
5. Edge validează JWT și profilul;
6. obiectele sunt încărcate privat în Cloudflare R2 și/sau Google Drive, în funcție de operație/configurație;
7. metadatele sunt salvate în `dezmembrari_photos`;
8. OCR.Space poate extrage text;
9. dacă fluxul e abandonat, codul are cleanup condiționat pentru itemul incomplet.

### Management desktop

Managerul completează datele tehnice, ordinea fotografiilor, fotografia principală, starea, prețul, locația și eventual URL-ul pieseauto.ro. URL-urile semnate sunt obținute prin Edge pentru acces temporar la obiecte private. Ștergerea permanentă este rezervată operațiilor privilegiate.

## 13. Manager Dashboard

1. autentificarea acceptă Admin, Manager sau permisiunea dedicată;
2. `index.html` deschide `modules/manager/manager.html`, cu stilurile și logica din `modules/manager/manager.css` și `modules/manager/manager.js`; noul Manager a înlocuit funcțional vechea interfață în LAB;
3. se citesc devize finale, plăți de avans, AWB, stoc, detailing, constatări, așteptări de piese, Generator, comenzi SH, plăți manager și count-uri Dezmembrări, conform permisiunilor;
4. KPI-ul, media, comparația și graficul folosesc valoarea integrală `total_manopera + total_piese`; `total_general` nu este utilizat. Graficul este randat prin DOM/CSS, fără Chart.js;
5. avansurile sunt agregate separat din `evidente_avansuri_plati.suma`, după `data_platii`; nu se adună peste devize;
6. căutarea globală reutilizează motorul și sursele HUB, grupează rezultatele și navighează către modulele relevante, cu deduplicare și protecție contra răspunsurilor stale;
7. în rezumat/tabul Plăți se poate copia IBAN-ul și marca cererea originală `plati_manager` ca `platit`, cu data și autorul marcării. Nu se execută transfer bancar; pagina utilizatorului citește același status la reload;
8. caseta Dezmembrări evidențiază De completat (`draft`), cu Gata de publicare (`ready`) secundar și link spre modul; Necesită atenție afișează avertizări reale compacte.

Versiunea finală nu conține mock/demo data; datele indisponibile nu sunt înlocuite cu valori inventate. La 16.10.2026, utilizatorul a raportat testarea manuală a noului Manager în LAB, inclusiv pe alți utilizatori, cu rezultat pozitiv („pare funcțional”). Aceasta este confirmarea utilizatorului, nu o nouă testare independentă în această actualizare; nu stabilește rezultatul individual al fiecărui scenariu de eroare și nu confirmă deploy-ul în producție.

## 14. Formulare operaționale simple

- **AWB:** creare/actualizare expediție, stare, livrare/retur și arhivare;
- **Telefoane:** CRUD pe un registru simplu de contacte;
- **Detailing:** programare → în lucru → final, cu pachet și estimare;
- **Generator:** start sesiune → stop → combustibil și total;
- **Bază VIN:** mapare identificator → VIN;
- **Flotă:** creare/actualizare vehicul și termene.

Cod Realtime există în mai multe dintre aceste pagini, dar publicația nu avea tabele la verificare; nu se presupune sincronizare live garantată.

## 15. Audit

> **Context istoric:** afirmația „Tabelul nu are RLS” de mai jos descrie auditul inițial. `audit_logs` are acum RLS ON conform [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md); activarea nu dovedește singură imuabilitatea jurnalului sau acoperirea tuturor acțiunilor.

Modulele care includ `audit.js` pot insera evenimente în `audit_logs`. Alte module au logică proprie sau nu înregistrează toate acțiunile. Tabelul nu are RLS și nu există dovadă că jurnalul este imuabil. Prin urmare, auditul actual este util operațional, dar nu trebuie tratat drept jurnal de conformitate rezistent la alterare.

## Actualizare 15.10.2026 — fluxul nou de import avans

În checkout-ul principal: client + vehicul în registru → avans + plăți → **Include avans** → **Importă Avans** → RPC de listare → alegere explicită → `save_deviz_final` salvează antetul, piesele și linia `avans` atomic. Identitatea este căutată întâi prin `vehicle_id`; pentru avansuri istorice fără acest ID se folosește numărul normalizat, numai dacă vehiculul este identificat unic. Avansul revendicat de alt deviz sau istoric nerevizuit nu este importabil.

`Total deviz = total_manopera + total_piese`; `Rest de plată = Total deviz - total_avans = total_general`. Avansul nu intră în discountul pieselor. O plată adăugată ulterior nu modifică documentul până la reîmprospătare și salvare explicită. Rândurile vechi de avans negativ nu sunt convertite automat; se înlocuiesc împreună cu importul nou în aceeași editare. Paginile din LAB conțin acum fluxul descris, identic cu checkout-ul principal; schema live a fost verificată separat.
