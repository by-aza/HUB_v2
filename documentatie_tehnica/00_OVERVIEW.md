# HUB AUTO v2 — vedere de ansamblu tehnică

## Repository principal — reconciliere statică la 03.11.2026

Acest set a fost importat din mirror-ul separat `/home/aza/HUB AUTO/HUB_v2-LAB`.
Checkout-ul de lucru este `/media/aza/Depozit_Mint/HUB_v2`; branch-ul și mediul
țintă se verifică la fiecare sarcină. Codul local confirmă numai existența
fișierelor, importurile și implementarea statică. Modulele Manager, căutarea comună,
ciornele și Evidență Piese DEMO sunt prezente; inventarul este în [02](02_MODULE.md).

Secțiunile datate de mai jos păstrează dovezile istorice LAB și confirmările istorice
de producție. Cifrele RLS/ACL/GRANT, testele și deploy-urile nu au fost reverificate
aici; starea live, browserul și publicarea rămân **NEEDS_REVIEW**. Comparația de 29
fișiere privea LAB versus propriul HEAD, vezi limitele din [23](23_INVENTAR_TRANSFER_PRODUCTIE.md).
`Pagini NOI HUB_v2/` și subfolderul `Pagini NOI HUB_v2/CLIENTS & REMINDERS/`
sunt referințe externe istorice, absente din acest checkout.

## Stadiu final — 21.10.2026

**36/36 tabele publice cu RLS activ în producție și LAB; 120 politici publice, aliniate.** Utilizatorul a confirmat încheierea activării planificate și testarea cu succes în producție a ultimelor trei Devize. În această rundă s-a verificat numai read-only configurația reală și s-a actualizat documentația.

Punctul central de preluare: [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md). Inventar și excepții: [03_SUPABASE.md](03_SUPABASE.md); acces: [09_MATRICE_ACCES.md](09_MATRICE_ACCES.md); pachete/rollback: [10_PLAN_RLS.md](10_PLAN_RLS.md), [11_PLAN_ROLLBACK.md](11_PLAN_ROLLBACK.md); dovezi: [12_TESTE_ACCES.md](12_TESTE_ACCES.md); frontend: [23_INVENTAR_TRANSFER_PRODUCTIE.md](23_INVENTAR_TRANSFER_PRODUCTIE.md).

RLS ON nu înseamnă hardening complet: rămân TRUNCATE pentru rolurile API pe 16 tabele, Generator public permisiv, TODO deschis tuturor autentificaților și Storage Contracte public/permisiv în producție. Nu s-a schimbat niciuna dintre acestea. VIEW-ul invoker și registrul privat cu ACL limitat sunt excepții explicate, nu tabele publice omise.

HUB AUTO rămâne aplicația internă simplă existentă. Loginul poreclă/email + parolă este neschimbat. **AUTH avansat și Turnstile sunt SUSPENDATE**; nu se propune infrastructură sau autentificare suplimentară. LAB permanent: smrrvkyyywtferhlrjnn; producție: xyovkxmtbvgcwavuyxxu.

Cele 29 diferențe frontend locale nu sunt un manifest de copiere: 11 LAB-only, 10 funcționale de reconciliat, 6 mixte și 2 Turnstile suspendate. Proiectul principal/frontendul publicat nu au fost comparate aici. Nu s-au modificat aplicația, SQL-ul activ sau configurația Supabase; fără teste de scriere/migrări/commit/push/deploy.

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Context istoric și detalii de implementare

Secțiunile de mai jos păstrează auditul și actualizările datate. Inventarele, numerele și formulările „actual/live” rămase în acest context nu sunt o nouă verificare a LAB sau a producției; stadiul documentat la 21.10.2026 este cel precizat mai sus.

## 1. Scop și limite

Acest set de documente descrie starea confirmată a aplicației din `HUB_v2-LAB/`, pe baza codului local și a unei inspecții read-only a proiectului Supabase conectat. Analiza inițială a fost realizată la 12 octombrie 2026; starea Manager Dashboard este reconciliată cu codul LAB și confirmarea utilizatorului la 16.10.2026.

Folderul `Pagini NOI HUB_v2/` a fost consultat exclusiv ca material de referință. Prototipurile, imaginile și documentele de acolo nu sunt considerate funcționalități integrate decât dacă există o implementare corespunzătoare în `HUB_v2-LAB/` și/sau în Supabase.

Auditul inițial și actualizarea documentară din 16.10.2026 nu modifică aplicația sau Supabase. Implementările LAB ulterioare auditului sunt consemnate separat mai jos și în documentele tematice.

## 2. Rezumat executiv

HUB AUTO v2 este o aplicație web multipagină, fără proces de build pentru interfața principală. Este compusă din pagini HTML independente, stiluri CSS, JavaScript vanilla și biblioteci încărcate din CDN. Persistența, autentificarea și o parte dintre automatizări sunt furnizate de Supabase. Publicarea este configurată pentru Vercel.

Aplicația acoperă activități de birou, service, magazie, flotă, detailing, dezmembrări, administrare și raportare managerială. Modulele partajează date prin Supabase, dar nu au un strat comun de servicii sau un model de domeniu centralizat în codul frontend. O parte importantă a logicii este inclusă direct în fișiere HTML mari, iar unele module au fișiere JavaScript dedicate.

Sistemul de acces are trei niveluri care nu sunt uniform aplicate:

1. redirecționare după autentificare și rol;
2. afișare/ascundere în interfață pe baza câmpului JSON `auth_profiles.permissions`;
3. politici RLS și funcții de verificare în baza de date.

Această combinație funcționează pentru modulele protejate complet, dar există și 19 tabele publice cu RLS dezactivat. Pentru acele tabele, restricția din interfață nu reprezintă o barieră de securitate la nivel de date. Acesta este cel mai important risc confirmat.

Integrarea Supabase cuprinde 36 de tabele publice, un view, patru funcții publice, două funcții private, 59 de politici publice și două funcții Edge active. Schema reflectă mai multe generații ale aplicației: module mature, funcții atomice noi, tabele istorice fără RLS și un modul Clienți & Notificări aflat încă într-o tranziție vizibilă între prototip/demo și date live.

## 3. Ce este confirmat ca integrat

- autentificare Supabase și profil extins în `auth_profiles`;
- roluri și permisiuni granulare salvate în profil;
- dashboard principal cu alerte, căutare, badge-uri și navigare filtrată;
- deviz estimativ, avansuri, plăți, contracte și deviz final;
- constatări service și transformare atomică în deviz final;
- comenzi de piese second-hand;
- stoc consumabile și mișcări de stoc;
- flotă, AWB, telefoane clienți, detailing și generator;
- dezmembrări desktop și captură mobilă, cu fotografii private și OCR;
- administrare utilizatori, echipe, alerte, anunțuri, audit și alte configurații;
- Manager Dashboard nou integrat în LAB la `modules/manager/manager.html`, deschis din `index.html`, cu date reale, fără mock/demo data în versiunea finală;
- alerte automate pentru expirări flotă prin cron și funcție Edge.

## 4. Ce nu trebuie confundat cu aplicația principală

- proiectul React din `Pagini NOI HUB_v2/CLIENTS & REMINDERS/` este un prototip separat;
- documentele DOCX din folderul de referință descriu stări/piloți istorici; unele puncte au fost între timp implementate, iar altele au rămas doar propuneri;
- imaginile de design nu sunt dovada unei integrări;
- fișierele `.orig` sunt copii de lucru și nu sunt încărcate de paginile curente;
- `modules/stocuri/comenzi_piese.html` este un placeholder și nu este echivalent cu modulul activ `comenzi_piese_sh`;
- `Untitled` este un prompt/artefact vechi de lucru, nu o componentă executată.

## 5. Hartă a documentației

| Document | Conținut |
|---|---|
| `01_ARHITECTURA.md` | Structură, straturi, legături HTML/CSS/JS, încărcare și publicare |
| `02_MODULE.md` | Inventarul modulelor, starea și datele citite/scrise |
| `03_SUPABASE.md` | Schema, relații, funcții, view, RLS, Storage, Edge și cron |
| `04_ROLURI_SI_ACCES.md` | Roluri, permisiuni, redirecționări și limitele controlului de acces |
| `05_FLUXURI_PRINCIPALE.md` | Fluxurile de business confirmate din cod |
| `06_DEPENDENTE_SI_INTEGRARI.md` | Dependențe interne și servicii externe |
| `07_RISCURI_SI_ZONE_SENSIBILE.md` | Riscuri confirmate, cu dovezi și impact |
| `08_RECOMANDARI.md` | Recomandări și starea rezolvărilor confirmate |
| `18_MANAGER_DASHBOARD_REDESIGN.md` | Manager activ în LAB: surse, formule, căutare, plăți, Dezmembrări și validare |
| `19_MANAGER_V2_FISIERE_DEPLOY.md` | Lista finală a celor patru fișiere runtime pentru viitorul deploy |

## 6. Grad de înțelegere

### Complet sau aproape complet înțeles

- structura locală și legăturile dintre paginile principale;
- mecanismul de autentificare, profil, rol și permisiuni din frontend;
- fluxurile Constatare → Deviz final și Comenzi piese SH;
- fluxul Dezmembrări, inclusiv funcția Edge și stocarea fotografiilor;
- schema publică Supabase, relațiile, RLS, funcțiile și trigger-ele existente;
- modulele de flotă, inventar, avansuri, AWB, telefoane și detailing;
- sursele principale de date ale dashboardului și ale dashboardului Manager.

### Parțial înțeles sau neconfirmat

- comportamentul funcției Edge `trimite-alerte` este cunoscut din versiunea desfășurată, dar sursa ei nu există în copia locală;
- ora efectivă locală a jobului cron nu poate fi afirmată fără confirmarea fusului orar al bazei/cronului;
- analiza statică inițială nu constituie test end-to-end; pentru Managerul nou există ulterior testare manuală în LAB raportată pozitiv de utilizator, inclusiv pe alți utilizatori;
- observațiile istorice despre elemente demonstrative din Clienți & Notificări nu descriu noul Manager; versiunea finală Manager folosește date reale și stări neutre când sursele nu sunt disponibile;
- publicarea Realtime nu conținea tabele la momentul verificării; paginile au totuși fallback prin reîncărcare periodică unde este implementat;
- intenția exactă pentru paginile placeholder și fișierele `.orig` nu este documentată;
- nu a fost verificată configurația efectivă a secretelor externe, doar utilizarea lor din cod.

## 7. Concluzie

Aplicația este funcțional bogată și are fluxuri operaționale reale, dar arhitectura și modelul de securitate sunt eterogene. Prioritatea logică nu este adăugarea imediată de module, ci alinierea accesului la date, inventarierea migrărilor lipsă și stabilirea unei surse unice de adevăr pentru configurare, roluri și contractele de date. Recomandările detaliate se află în `08_RECOMANDARI.md`.

## Actualizare 15.10.2026 — integrarea avansurilor

Jurnalul 14–15 octombrie și checkout-ul principal `/media/aza/Depozit_Mint/HUB_v2` confirmă integrarea avansurilor în Deviz final și commitul `fe82649` pe ramura urmărită `origin/feature-responsive`; utilizatorul a confirmat commit + push. În baza Supabase conectată există coloanele și RPC-urile noi, iar DF-199, DF-200 și DF-201 au avansuri legate separat. **Deploy confirmat de utilizator:** fluxul nou este vizibil și verificat în pagina și printul live; captura indică TOTAL DEVIZ 3.633,31 Lei, AVANS ACHITAT 500,00 Lei și REST DE PLATĂ 3.133,31 Lei.

**Reconciliere LAB:** HEAD rămâne la `92038d5`, dar fișierele de lucru `deviz_final.html` și `deviz-print.html` au acum implementarea finală, identică cu checkout-ul principal; migrațiile noi sunt încă neversionate în LAB. Documentul [17_MODIFICARI_AVANSURI_2026-10-14_15.md](17_MODIFICARI_AVANSURI_2026-10-14_15.md) descrie verificarea directă. Inventarele numerice de mai sus sunt fotografia din 12.10.2026, nu un inventar refăcut după această integrare.

## Actualizare 16.10.2026 — Manager Dashboard activ în LAB

Noul Manager a înlocuit funcțional vechiul Manager în LAB. Versiunea activă este `modules/manager/manager.html`, cu `modules/manager/manager.css` și `modules/manager/manager.js`; toate intrările Manager din `index.html` deschid această pagină. Prototipurile separate au fost eliminate și nu sunt dependențe runtime.

Valoarea devizelor este `total_manopera + total_piese`, înainte de avans; `total_general` reprezintă restul după avans în Deviz final și nu alimentează KPI-ul Manager. Avansurile rămân indicator separat. Plățile folosesc cererile comune `plati_manager`, cu copiere IBAN și marcarea plății ca efectuată. Căutarea este globală, comună cu HUB. Caseta Dezmembrări evidențiază De completat (`draft`), iar Necesită atenție include avertizări din date reale.

La 16.10.2026, utilizatorul a raportat testarea manuală a noului Manager în LAB, inclusiv pe alți utilizatori, cu rezultat pozitiv („pare funcțional”). Aceasta este confirmarea utilizatorului, nu o nouă testare independentă în această actualizare; nu stabilește rezultatul individual al fiecărui scenariu de eroare și nu confirmă deploy-ul în producție.

## Actualizare 12.11.2026 — eliminare Bază VIN

Pagina și intrările Bază VIN din Index/Admin au fost eliminate; utilizatorul a
confirmat ștergerea `public.baza_vin` și a datelor sale din producție la 12.11.2026.
Proveniența stării DB și referința migrării sunt în [03](03_SUPABASE.md#bază-vin--eliminat-la-12112026).
