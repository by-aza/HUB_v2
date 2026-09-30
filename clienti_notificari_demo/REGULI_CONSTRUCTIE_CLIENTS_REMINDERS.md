# 👥 CLIENȚI & NOTIFICĂRI — Reguli și plan de construcție

> **Document de lucru / prezentare internă**  
> Scop: să avem într-un singur loc ce vrem să facă pagina, ce există deja în demo și ce urmează să implementăm după feedback.  
> Documentul se actualizează pe măsură ce apar idei și decizii noi.

---

## 1. 🎯 Scopul paginii

Pagina **Clienți & Notificări** trebuie să devină zona centrală din HUB pentru:

- evidența clienților;
- evidența vehiculelor fiecărui client;
- urmărirea termenelor importante;
- notificări pentru ITP, RCA, revizii, schimb ulei și alte operațiuni;
- contactarea rapidă a clientului;
- istoric clar al notificărilor și acțiunilor.

**Principiu:** pagina trebuie să ajute biroul, nu să-i mai dea încă un Excel de completat. 🙂

---

## 2. 🧪 Strategie de implementare — Faza 1 = DEMO

Decizie de proiect: înainte de orice integrare reală construim și testăm un **demo funcțional în browser**.

Demo-ul trebuie să fie suficient de apropiat vizual și funcțional de versiunea finală încât colegii și conducerea să îl poată testa realist.

În această fază:

- nu folosim Supabase;
- nu folosim Google Apps Script;
- nu trimitem emailuri reale;
- nu trimitem mesaje WhatsApp reale;
- nu folosim LocalStorage / IndexedDB;
- datele sunt mock și stau doar în memorie;
- la refresh, demo-ul revine la starea inițială.

Scopul este să strângem feedback înainte de a construi backend-ul și automatizările reale.

---

## 3. 🧭 Structura generală a paginii

Interfața conține:

- buton **Înapoi** în stilul paginii `avans.html`;
- iconiță + titlul **Clienți & Notificări**;
- badge vizibil **DEMO**;
- mesaj că datele se resetează la reîncărcare;
- căutare globală;
- buton **Client nou**;
- carduri KPI;
- zonă **Necesită atenție**;
- filtre;
- tabel principal cu client + vehicul;
- panou lateral cu detaliile clientului;
- modaluri pentru client, vehicul, reminder, setări demo etc.;
- bandă verde fixă jos pentru starea automatizării demo.

În meniul HUB, modulul este plasat direct sub **Comenzi Piese SH** și are badge galben/amber `DEMO`.

---

## 4. 🔎 Căutare și filtrare

Căutarea trebuie să poată găsi rapid după:

- nume client;
- telefon;
- email;
- număr de înmatriculare;
- VIN;
- marcă/model vehicul.

### Filtrare operațională

Filtre utile:

- Toți;
- 30 zile;
- 15 zile;
- 5 zile;
- Astăzi / 0 zile;
- Expirate;
- Probleme notificări;
- Tip termen;
- Canal;
- Status.

### Preferințe client pentru momentele de notificare — ÎN DISCUȚIE

Propunere testată în demo:

- [ ] 30 zile înainte;
- [ ] 15 zile înainte;
- [ ] 5 zile înainte;
- [ ] în ziua termenului (`0 zile`).

Un client poate alege doar anumite momente, de exemplu **30 + 5 zile**, iar altul toate cele patru.

Această funcție trebuie validată cu conducerea înainte de implementarea în producție.

---

## 5. 👤 Fișa clientului

Pentru fiecare client păstrăm conceptual:

- nume complet;
- telefon;
- email;
- canale de notificare;
- acord pentru notificări;
- unul sau mai multe vehicule;
- notițe;
- istoric notificări;
- preferințe 30 / 15 / 5 / 0 zile.

Un client nu trebuie duplicat ca entitate doar pentru că are mai multe mașini.

### ID client

Valori de tip `#0001` reprezintă **ID-ul clientului**, nu numărul rândului din tabel.

Dacă același client are mai multe vehicule, același ID client apare pe toate rândurile lui.

---

## 6. 🚗 Vehiculele clientului

Un client poate avea unul sau mai multe vehicule.

Date utile:

- număr de înmatriculare;
- VIN;
- marcă;
- model;
- an fabricație;
- termene/remindere asociate.

În tabel, fiecare combinație **client + vehicul** poate apărea pe un rând separat.

Exemplu valid:

- Daria Stoian | Skoda Octavia
- Daria Stoian | Lastun Vyper

În panoul din dreapta, clientul apare o singură dată, iar vehiculul selectat trebuie evidențiat și trebuie să afișeze reminder-ele lui.

**Regulă HUB:** numărul de înmatriculare se normalizează înainte de salvare în format compact, cu litere mari și fără spații/cratime, de exemplu `CT12ABC`.

---

## 7. 📅 Expirări și notificări

Tipurile inițiale:

- ITP;
- RCA;
- Revizie;
- Schimb ulei;
- Personalizat.

Reminder-ul personalizat trebuie să aibă obligatoriu:

- denumire;
- data termenului.

Exemple:

- `Verificare baterie — 05.10.2026`
- `Verificare distribuție — 15.02.2027`

Reminder-ele trebuie să poată fi adăugate direct pe vehiculul existent, fără a obliga utilizatorul să adauge un vehicul nou.

În panoul lateral există:

**Expirări & remindere → + Adaugă**

---

## 8. 🔔 Zona „Necesită atenție”

Aici scoatem în față situațiile care cer intervenție:

- ITP expirat;
- RCA care expiră;
- revizie apropiată;
- notificare eșuată;
- client fără acord;
- date de contact incomplete;
- reminder personalizat apropiat.

Scopul este ca omul de la birou să vadă imediat ce are de rezolvat.

---

## 9. 📊 Indicatori rapizi

Demo-ul include KPI precum:

- Clienți activi;
- Vehicule;
- Expirări apropiate;
- Notificări programate;
- Probleme notificări.

În producție, valorile trebuie calculate din date reale.

---

## 10. 🕘 Istoric notificări

În fișa clientului trebuie să existe istoric cu:

- data și ora;
- motivul notificării;
- canalul;
- statusul.

Exemple de status:

- Livrat;
- Eșuat;
- Programat.

În demo, istoricul este simulat.

---

## 11. 📝 Notițe client

În demo putem adăuga și afișa notițe în memorie.

Pentru a evita ca panoul din dreapta să devină foarte înalt:

- secțiunea de notițe trebuie să fie compactă;
- se afișează 1–2 notițe vizibile;
- dacă sunt mai multe, folosim scroll intern mic sau `Vezi toate (n)`.

### Pentru producție

De implementat ulterior:

- editare notiță;
- ștergere notiță cu confirmare;
- reguli de acces;
- eventual audit / istoric modificări.

Ștergerea notițelor nu este necesară în demo.

---

## 12. ➕ Adăugare / editare client

Modalul **Client nou** permite:

- date client;
- acord pentru notificări;
- canale de notificare;
- praguri 30 / 15 / 5 / 0 zile;
- primul vehicul;
- termene standard;
- notificări personalizate.

### Canale de notificare

Nu folosim radio button cu o singură alegere.

Clientul poate avea mai multe canale simultan:

- WhatsApp;
- Email;
- SMS.

Exemple valide:

- WhatsApp + Email;
- Email + SMS;
- toate trei.

Acordul pentru notificări rămâne o bifă separată.

În editarea clientului păstrăm formularul compact; reminder-ele noi se adaugă în principal din panoul vehiculului.

---

## 13. 🤖 Automatizare — concept și DEMO

Banda verde fixă jos este păstrată din conceptul v0.

În demo afișează clar:

**Automatizare DEMO**  
`Simulare notificări — nu se efectuează trimiteri reale.`

În dreapta pot apărea informații simulate:

- ultima verificare;
- următoarea verificare;
- Setări automatizare.

### Acces la „Setări automatizare” în demo

Orice utilizator care apasă **Setări automatizare** vede mai întâi modalul:

**Acces restricționat**

Mesaj:

> Nu aveți permisiunea de a modifica setările automatizărilor. Contactați administratorul HUB pentru acordarea accesului.

Avertizarea trebuie să fie foarte vizibilă, cu fundal/bordură roșie și text suficient de mare.

În demo există intenționat un buton temporar, foarte vizibil:

**Vizualizează setări**

Acesta permite accesul doar pentru test și trebuie eliminat când trecem în producție.

### Modal setări automatizare — DEMO

Poate conține:

- praguri 30 / 15 / 5 / 0 zile;
- canale WhatsApp / Email / SMS;
- oră simulată de verificare, de exemplu `07:00`;
- badge `ACCES DEMO`.

În producție, accesul va fi legat de permisiuni reale administrate din HUB.

---

## 14. 💬 Contact rapid cu clientul — WhatsApp

Direcția propusă pentru producție:

1. utilizatorul apasă WhatsApp;
2. HUB folosește numărul salvat;
3. se deschide conversația clientului;
4. mesajul este precompletat;
5. utilizatorul verifică și trimite manual.

În demo, acțiunea rămâne simulată / preview.

### De stabilit ulterior

- textele standard;
- mesaje diferite pentru ITP / RCA / revizie / service;
- format telefon;
- dacă folosirea butonului intră în istoric.

---

## 15. 💰 Oferte pentru revizie / schimb ulei

Pentru operațiuni care presupun revenirea clientului în service, vrem să putem trimite și o ofertă de preț.

Direcția propusă:

**Clienți & Notificări** decide **CÂND** trebuie contactat clientul.  
**Deviz estimativ** construiește **CE** ofertă îi trimitem.

Flux posibil:

1. din fișa clientului → **Creează ofertă**;
2. se deschide Deviz estimativ cu clientul și vehiculul preselectate;
3. se transmite contextul: `Revizie`, `Schimb ulei` etc.;
4. se completează piese/manoperă/prețuri;
5. se generează PDF;
6. PDF-ul poate fi trimis prin Email sau WhatsApp.

### Email

Poate fi automatizat ulterior, inclusiv cu PDF atașat.

### WhatsApp

Pentru prima versiune de producție, direcția preferată este:

- deschidere chat;
- mesaj precompletat;
- atașarea PDF-ului manual.

În demo, **Creează ofertă** rămâne doar simulare de flux.

---

## 16. 🎨 Design și UX

Referințele principale sunt:

- `dashboard.jpeg`;
- `modal.jpeg`;
- prototipul React v0;
- regulile vizuale HUB existente.

Decizii actuale:

- temă dark compatibilă HUB;
- badge amber/galben `DEMO`;
- buton Înapoi ca în `avans.html`;
- fonturile trebuie să fie lizibile și ușor mai mari decât în prima versiune demo;
- panoul din dreapta poate fi mai lat, aproximativ 360–400 px pe desktop;
- lista stângă și panoul dreapta trebuie să fie aliniate vizual ca înălțime;
- evităm spații mari goale între tabel și banda verde;
- tabelul folosește paginare, nu listă infinită.

### Paginare

Direcție aprobată:

`‹ 1 2 3 ... 25 ›`

Pentru demo: aproximativ **10–12 rânduri/pagină**.

---

## 17. 🧱 Tehnologia finală HUB

Implementarea finală:

- HTML;
- Tailwind CSS / CSS propriu;
- Vanilla JavaScript;
- Supabase.

React/TSX este doar referință de design și comportament.

---

## 18. 🗄️ Date și Supabase — de proiectat după feedback

Schema finală trebuie să acopere cel puțin:

- clienți;
- vehicule;
- tipuri de termene/remindere;
- reminder-e/expirări;
- canale/preferințe contact;
- acorduri;
- praguri notificare;
- istoric notificări;
- notițe client.

Relații importante:

- un client → mai multe vehicule;
- un vehicul → mai multe reminder-e;
- istoricul nu trebuie pierdut la modificarea unui termen;
- evităm duplicarea inutilă a datelor.

RLS și permisiunile se proiectează numai după ce fluxul UX este validat.

---

## 19. ✅ Ce avem deja în demo

La data de **01.10.2026**, demo-ul are deja:

- integrare vizuală în HUB;
- titlu **Clienți & Notificări** + badge DEMO;
- căutare;
- KPI;
- zonă Necesită atenție;
- filtre;
- paginare;
- listă client + vehicul;
- același client pe mai multe rânduri pentru vehicule diferite;
- ID client păstrat comun;
- panou lateral client;
- selectare vehicul;
- reminder-e per vehicul;
- adăugare vehicul;
- adăugare reminder standard/personalizat;
- adăugare client;
- editare client;
- canale multiple de notificare;
- praguri 30 / 15 / 5 / 0;
- notițe demo;
- istoric notificări demo;
- WhatsApp demo;
- Email demo;
- Creează ofertă demo;
- bandă verde Automatizare DEMO;
- modal Acces restricționat;
- acces temporar la setări pentru test;
- reset complet la refresh.

---

## 20. ⏳ Ce NU este încă implementat în producție

Nu considerăm implementate real:

- Supabase;
- schema finală de tabele;
- CRUD persistent;
- automatizări reale;
- Google Apps Script;
- trimitere Email reală;
- trimitere WhatsApp reală;
- SMS real;
- generare/trimitere ofertă reală;
- istoric real;
- permisiuni reale;
- RLS;
- audit complet;
- ștergere/editare notițe în producție;
- testare cu date reale.

---

## 21. 🛠️ Ordine recomandată de lucru

### Etapa A — DEMO și feedback — ÎN CURS

- test cu colegii;
- test cu conducerea;
- notăm ce lipsește;
- eliminăm ce nu este folosit;
- stabilim denumirile finale;
- stabilim tipurile reale de notificări;
- validăm pragurile 30 / 15 / 5 / 0;
- validăm canalele reale.

### Etapa B — Stabilizare UX

- corecții după feedback;
- înghețarea fluxului de lucru;
- decizie asupra funcțiilor care intră în producție.

### Etapa C — Arhitectură

- schema Supabase;
- relații/FK;
- RLS;
- permisiuni;
- istoric/audit.

### Etapa D — Integrare reală

- CRUD persistent;
- Email;
- WhatsApp;
- Google Apps Script;
- Deviz estimativ / PDF;
- automatizări.

### Etapa E — Testare finală

- date reale controlate;
- colegi;
- corecții;
- activare în fluxul zilnic.

---

## 22. 📌 Reguli de proiect

1. Nu implementăm funcții doar pentru că există în prototip.
2. Fluxul real al colegilor are prioritate.
3. Faza demo nu trebuie să depindă de backend.
4. La refresh, demo-ul se resetează intenționat.
5. Numerele de înmatriculare se normalizează (`CT12ABC`).
6. Un client poate avea mai multe vehicule.
7. Reminder-ele aparțin vehiculului selectat.
8. Canalele de notificare pot fi multiple.
9. Funcțiile automate reale trebuie să lase urme clare în istoric.
10. Nu trimitem automat mesaje fără reguli și acorduri clar stabilite.
11. Accesul real la setările de automatizare va fi controlat prin permisiuni HUB.
12. Butonul fosforescent `Vizualizează setări` există doar în DEMO și se elimină în producție.
13. Păstrăm pagina simplă, rapidă și lizibilă.
14. Documentul se actualizează pe măsură ce apar decizii noi.

---

## 23. 📝 Idei / decizii încă deschise

- [ ] Validare cu bossul: praguri individuale `30 / 15 / 5 / 0 zile`
- [ ] Texte standard WhatsApp
- [ ] Texte standard Email
- [ ] Reguli exacte ITP
- [ ] Reguli exacte RCA
- [ ] Reguli revizie / schimb ulei
- [ ] Ce alte tipuri de notificări sunt necesare
- [ ] Canale finale de notificare
- [ ] Flux ofertă → Deviz estimativ → PDF
- [ ] Trimitere PDF pe Email
- [ ] Flux WhatsApp cu mesaj precompletat + atașare manuală PDF
- [ ] Structură Supabase
- [ ] Drepturi utilizatori
- [ ] RLS
- [ ] Audit
- [ ] Editare / ștergere notițe
- [ ] Integrare cu alte module HUB
- [ ] Feedback colegi
- [ ] Feedback conducere

---

> **Status general:** 🟡 DEMO funcțional / colectare feedback  
> **Următorul pas real:** prezentare colegilor și conducerii, colectare feedback și stabilizarea fluxului înainte de backend.
