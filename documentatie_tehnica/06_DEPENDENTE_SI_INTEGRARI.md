# Dependențe și integrări

## Dependențe locale — reconciliere statică la 03.11.2026

Managerul și căutarea comună sunt încărcate din sursele `modules/manager/`, inclusiv
de `index.html`. Ciornele au helperul `js/local-deviz-drafts.js` și CSS-ul comun,
cu integrare în HUB/login/Manager/Deviz Final. Evidență Piese încarcă propriile
resurse și operează numai date DEMO în memorie; inventar în [02](02_MODULE.md).

**Artefacte LAB absente aici:** `js/auth-security.js`, `js/turnstile-config.js`,
`js/turnstile.js`, `supabase/auth-security-lab/` și `supabase/functions/hub-login/`.
Helper-ele `hubMergePermissionFlags`, `hubProfileLabels`, `hubAttachActorLabels`
și wrapper-ul `HubTurnstile` sunt dependențe consemnate pentru LAB în 21–22.10,
fără consumatori în sursele runtime curente inspectate. Nu se importă sau recreează
prin această reconciliere. `Pagini NOI HUB_v2/` este material extern istoric absent,
inclusiv subfolderul `Pagini NOI HUB_v2/CLIENTS & REMINDERS/`.

Catalogul RLS, Storage, cron/Edge și disponibilitatea serviciilor din secțiunile
datate următoare sunt dovezi istorice; starea live, autorizarea DB, browserul și
publicarea sunt **NEEDS_REVIEW**. Configurația Vercel locală arată doar antete cache HTML.

## Dependențe confirmate la închiderea activării — 21.10.2026

Politicile publice și ACL-urile auditate sunt aliniate între LAB/producție; 36 tabele au RLS activ. Graful istoric de mai jos rămâne util, dar stările „fără RLS” nu mai sunt actuale. Inventarul autoritativ este [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

1. Sursa bife/roluri este auth_profiles/auth_roles, cu scriere Admin-only; SELECT anonim rămâne compatibil cu loginul existent. Nu se reactivează AUTH avansat.
2. stoc_view_curent este VIEW invoker peste stoc_produse și stoc_miscari, fără RLS propriu.
3. Constatări → departamente / intervale / repartizări → service_personal și audit; C&N furnizează client_id/vehicle_id. Personalul arhivat poate fi necesar istoricului. Responsabilii editabili nu sunt operații de scriere în constatari_repartizari.
4. Deviz Final → evidente_avansuri → evidente_avansuri_plati; avans_id unic, FK RESTRICT, antetul/liniile și totalurile se scriu atomic. private.deviz_final_avans_review permite citirea numai a avans_id/status pentru RPC; resolverul și funcțiile existente nu au fost modificate.
5. Căutarea devizelor, C&N, Manager și Comenzi SH au citiri contextuale, fără a primi implicit scrierea financiară; vezi matricea 09.
6. cron producție → trimite-alerte → Google Apps Script: clientul Supabase backend identificat folosește service_role și nu preia sesiune HUB. RLS al config_alerte nu întrerupe această citire backend. Sursa Apps Script de pe alt cont rămâne inaccesibilă; nu s-a trimis email.
7. Storage Contracte este independent de tabel: bucket public/politici publice numai în producție, absent în LAB. Nu se presupune echivalență sau PASS funcțional Storage din PASS-ul tabelului.
8. Frontendul LAB mixt apelează helper-e pasive de bife/etichete chiar cu flag-ul AUTH avansat false. La sincronizare se reconciliază dependențele, fără ștergere arbitrară a helperului și fără activarea AUTH/Turnstile; inventar 23.

Nu se propune sau instalează nicio integrare nouă. Nu s-au schimbat Edge, cron, Apps Script, Storage, frontend sau configurații în această sarcină.

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## 1. Dependențe interne

### 1.1 Graful de date principal

```text
Supabase Auth
  → auth_profiles → auth_roles
  → permissions JSON
       ├─ navigare Dashboard
       ├─ pagini/module
       ├─ politici RLS
       └─ Edge Function Dezmembrări

clienti
  → clienti_vehicule
      ├─ clienti_contacte
      ├─ clienti_vehicule_termene → clienti_notificari_istoric
      ├─ evidente_avansuri → evidente_avansuri_plati
      └─ constatari
          ├─ constatari_departamente
          ├─ constatari_repartizari → service_personal
          ├─ constatari_asteptare_piese
          └─ deviz_final_header → deviz_final_linii
                                  └─ comenzi_piese_sh (opțional)

stoc_produse → stoc_miscari → stoc_view_curent

dezmembrari_items → dezmembrari_photos → Edge → R2 / Google Drive / OCR
```

Modulele sunt relativ independente la nivel de HTML, dar schema creează dependențe puternice la nivel de date. O modificare de coloană/status în Supabase poate afecta mai multe pagini fără ca relația să fie vizibilă într-un import JavaScript.

### 1.2 Fișiere comune

| Fișier | Consumatori | Rol |
|---|---|---|
| `js/config.js` | o parte dintre pagini | URL și cheie publică Supabase, inițializare comună |
| `js/audit.js` | Admin și mai multe module operaționale | funcție globală de inserare audit |
| `js/session-timeout.js` | majoritatea paginilor vechi | timeout inactivitate și sincronizare între taburi |
| `css/style.css` | multe pagini | stil comun minimal, în special hover pentru carduri |
| `icons/*` | manifeste/pagini | branding și PWA |

Dependența de `config.js` nu este universală. Unele pagini repetă URL-ul și cheia și creează direct clientul, ceea ce poate produce configurații divergente.

## 2. Dependențe între module

| Modul sursă | Modul consumator | Tip de dependență | Sensibilitate |
|---|---|---|---|
| Profiluri/roluri | toate modulele | autentificare, nume, permisiuni | critică |
| Clienți/vehicule | Constatare, Avansuri, Notificări | ID-uri și date master | ridicată |
| Constatare | Deviz final, Manager, Dashboard | FK, status, RPC | ridicată |
| Service personal | Constatare, Admin | repartizare și echipe | medie |
| Comenzi SH | Deviz final, Dashboard, Admin | piesă folosită și status | ridicată |
| Avansuri/plăți | Clienți & Notificări, Manager, Dashboard | agregări financiare | ridicată |
| Produse/mișcări | Consumabile, Admin, Dashboard, Manager | view de stoc | ridicată |
| Flotă | Dashboard, Admin, Edge alerte | termene și destinatari | ridicată |
| Dezmembrări | Dashboard, Admin, Edge foto | item, fotografii, status | ridicată |
| Plăți manager | Plăți, Manager, Dashboard | status și agregări | ridicată |
| Audit | Admin | trasabilitate | medie; acoperire incompletă |

## 3. Biblioteci frontend externe

| Dependență | Utilizare | Pinning observat | Observație |
|---|---|---|---|
| Supabase JavaScript v2 | Auth, DB, RPC, Storage, Realtime | majoritar doar ramura v2 | încărcat din CDN |
| Tailwind Play CDN | stilizare majoritatea paginilor | nefixat | destinat prototipării; runtime în browser |
| Lucide | iconuri | nefixat în mai multe pagini | dependență de CDN |
| Grafice DOM/CSS | Manager Dashboard activ în LAB | `renderTrend()` în `manager.js` + `manager.css` | fără Chart.js; mențiunea anterioară 4.4.4 descria versiunea istorică |
| jsPDF | raport Consumabile | 2.5.1 | versiune fixată |
| jsPDF AutoTable | tabel PDF | 3.5.31 | versiune fixată |
| PapaParse | CSV Piese stoc | 5.3.2 | versiune fixată |
| Flatpickr | programări Detailing | nefixat | include localizare română |
| Google Fonts | fonturi | URL extern | disponibilitatea afectează doar prezentarea |

Nu există lockfile sau pipeline local care să reproducă exact toate resursele nefixate.

## 4. Supabase

### 4.1 API direct din browser

Frontendul folosește:

- Auth pentru sesiune, login, recovery și logout;
- PostgREST pentru CRUD;
- RPC pentru generarea atomică a devizului final;
- Storage pentru documentele contractelor;
- Realtime în codul unor pagini;
- Functions pentru Dezmembrări.

Cheia `anon` este publică prin design. Securitatea trebuie să provină din RLS, granturi și funcții, nu din ascunderea configurației.

### 4.2 Schema ca interfață comună

Nu există DTO-uri sau tipuri generate. Numele coloanelor și valorile statusurilor sunt repetate în SQL, JavaScript și HTML. Aceasta este principala dependență implicită a proiectului.

## 5. Integrarea Dezmembrări

```text
Browser
  → Supabase Auth JWT
  → Edge: dezmembrari-photo-upload
      ├─ auth_profiles / RLS
      ├─ Cloudflare R2 privat (AWS SDK S3)
      ├─ Google Drive privat/fallback
      ├─ OCR.Space
      └─ dezmembrari_photos
```

Dependențe confirmate:

- AWS SDK S3 versiunea `3.1098.0` în Edge;
- secrete pentru R2, Google Drive și OCR în mediul funcției;
- URL-uri semnate pentru obiecte private;
- allowlist CORS pentru producție și medii locale;
- `pieseauto.ro` ca destinație/link extern pentru publicare sau referință.

Eșecul oricărui serviciu extern poate lăsa itemul fără fotografie sau metadatele într-o stare intermediară; codul include unele mecanisme de cleanup, dar nu a fost executat un test de recuperare.

## 6. Alerte flotă

```text
Supabase Cron
  → trimite-alerte (fără JWT)
      → config_alerte
      → flota_auto
      → Google Apps Script
          → email
```

Integrarea depinde de endpointul Apps Script hard-coded în funcția distribuită și de accesul service role. Sursa funcției nu este prezentă local, deci repo-ul nu este suficient pentru reproducerea ei.

## 7. Contracte și Storage

Browserul încarcă direct în bucket-ul `documente_contracte`, care este public și are politici publice CRUD. URL-urile sunt persistate în `contracte.poze`/câmpul JSONB echivalent. Nu există o funcție backend intermediară care să valideze tipul sau proprietarul obiectului.

## 8. Google Sheets și WhatsApp

`piese_stoc.html`:

1. descarcă un CSV public din Google Sheets;
2. îl parsează cu PapaParse;
3. păstrează un cache în `localStorage`;
4. oferă linkuri `wa.me` pentru contact.

Acest modul nu este sincronizat cu `stoc_produse`/`stoc_miscari`; cele două surse reprezintă inventare diferite.

## 9. Publicare Vercel

`vercel.json` și căile relative arată că aplicația este livrată ca site static pe `hub-v2-phi.vercel.app`. Funcțiile backend nu sunt Vercel Functions locale, ci Supabase Edge Functions. Schimbarea structurii directoarelor poate rupe linkurile relative dintre pagini.

## 10. PWA

Există `manifest.json`, `manifest-dz.json` și iconuri. Nu a fost găsit un service worker în structura curentă. Rezultă:

- aplicația poate furniza metadate pentru instalare;
- nu este confirmat caching offline sau interceptarea cererilor;
- Dezmembrări are manifest separat, dar funcționarea offline pentru fotografii nu este implementată/dovedită.

## 11. Folderul de referință `Pagini NOI HUB_v2/`

### 11.1 Clienți & Notificări

Conține documentație, imagini și un prototip React/Next separat. Prototipul folosește date mock/in-memory și nu este importat în HUB v2. Baza curentă și modulul vanilla au implementat o parte importantă din modelul planificat, dar eticheta DEMO și câteva acțiuni locale arată că tranziția nu este închisă.

### 11.2 Comenzi Piese SH

Documentația de referință descrie pilotul, statusurile și controlul RLS. Implementarea curentă corespunde în mare, dar a evoluat: există audit și operații administrative de ștergere. Documentul este util pentru intenție, nu pentru starea exactă.

### 11.3 Piese Mari / Dezmembrări

Materialul DOCX și imaginile descriu o etapă mai veche. Codul curent include deja R2, OCR, manifest și integrare în dashboard, deși documentul le poate prezenta ca viitoare. Codul și Supabase au fost tratate ca surse autoritative.

## 12. Dependențe neconfirmate sau fragile

- versiunea exactă rezolvată pentru CDN-urile nefixate;
- disponibilitatea și rate limits pentru OCR.Space, Drive, R2 și Apps Script;
- contractul de coloane al foii Google publice;
- fusul orar al cronului;
- tabelele intenționate pentru publicația Realtime;
- rotația secretelor și procedura de recuperare;
- concordanța tuturor statusurilor textuale între pagini și DB.

## Actualizare 15.10.2026 — dependența avansurilor

În checkout-ul principal, Deviz final consumă `evidente_avansuri` + agregatul plăților prin `list_deviz_final_importable_avansuri`; `save_deviz_final` recitește sumele plătite și scrie antetul + toate liniile într-o tranzacție. `private.resolve_deviz_final_vehicle` leagă numărul normalizat/VIN de registrul vehiculelor. Indexul unic pe `deviz_final_linii.avans_id` impune un singur deviz per avans. Noile dependențe sunt prezente în Supabase, iar frontendul LAB le apelează acum.
