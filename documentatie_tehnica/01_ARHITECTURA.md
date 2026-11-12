# Arhitectura HUB AUTO v2

## Arhitectură locală verificată static — 03.11.2026

Repository-ul principal este `/media/aza/Depozit_Mint/HUB_v2`; verifică branch-ul
activ la fiecare sarcină. Structura rămâne HTML/CSS/JavaScript multipagină, fără
`package.json` în rădăcină. Managerul activ este `modules/manager/manager.html`,
cu CSS/JS proprii; `index.html` încarcă același JS pentru `HubGlobalSearch`.
Ciornele folosesc `js/local-deviz-drafts.js` și `css/local-deviz-drafts.css`,
cu includeri în HUB, login, Manager și Deviz Final. Evidență Piese are HTML/CSS/JS
dedicate și navigare DEMO din HUB; detalii în [02](02_MODULE.md).

Există trei migrări locale versionate în `supabase/migrations/`: cea din 18.09
pentru conversia Constatare și cele două din 14–15.10 pentru Avansuri. Acest fapt
nu dovedește aplicarea lor live. Pachetele RLS istorice enumerate în [10](10_PLAN_RLS.md)
sunt absente. Helper-ele AUTH/Turnstile LAB lipsesc și nu sunt importuri runtime
curente, vezi [06](06_DEPENDENTE_SI_INTEGRARI.md).

Arborele LAB, stările DB și formulările „actual/live” din secțiunile datate de mai
jos sunt istorice. `vercel.json` confirmă doar antetele locale de cache HTML;
browserul, autorizarea efectivă, Supabase live și publicarea rămân **NEEDS_REVIEW**.

## Arhitectura păstrată și stadiu final — 21.10.2026

HUB AUTO rămâne aplicația internă multipagină existentă, fără infrastructură nouă sau autentificare suplimentară. Loginul poreclă/email + parolă este neschimbat; AUTH avansat și Turnstile sunt SUSPENDATE.

36/36 tabele publice au RLS ON în producție și LAB, cu 120 politici publice identice. Controlul se face prin sesiunea existentă, auth_profiles/auth_roles și bife; numai Admin poate modifica privilegiile. Backendul de alerte folosește service_role în fluxul identificat și nu depinde de utilizatori HUB conectați.

VIEW-ul stoc_view_curent folosește security_invoker=true și sursele RLS. Registrul privat de review al avansurilor are ACL limitat și RLS OFF, justificat separat. Nu se activează arbitrar RLS pe obiectele platformei.

Nu se declară hardening complet: GRANT-urile TRUNCATE pe 16 tabele, Generator/TODO permisive și Storage Contracte public în producție sunt restanțe punctuale. Producția are cron/net și Storage neclonate în LAB; nu se deduce aceeași infrastructură din aceeași schemă publică.

Rezumatul autoritativ actual și limitele dovezilor sunt în [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md). Migrațiile active nu se reexecută și nu se folosește AUTH avansat ca prerechizit pentru acest stadiu.

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Context istoric al arhitecturii

## 1. Model arhitectural

HUB AUTO v2 este o aplicație web multipagină (MPA) construită cu HTML, CSS și JavaScript vanilla. Nu există `package.json`, bundler sau pas de compilare pentru aplicația principală. Fiecare pagină își încarcă direct dependențele și, de cele mai multe ori, își instanțiază propriul client Supabase.

```text
Browser
  ├─ pagini HTML independente
  │   ├─ CSS comun / CSS dedicat / stiluri inline
  │   ├─ JavaScript inline / fișiere JS dedicate
  │   └─ biblioteci CDN
  ├─ Supabase JS
  │   ├─ Auth
  │   ├─ PostgREST / RPC
  │   ├─ Storage
  │   └─ Realtime (cod client prezent)
  └─ servicii externe
      ├─ Google Drive / Cloudflare R2 / OCR.Space
      ├─ Google Apps Script / Google Sheets
      ├─ WhatsApp
      └─ pieseauto.ro

Vercel livrează fișierele statice.
Supabase livrează baza de date, autentificarea, Storage, cron și Edge Functions.
```

## 2. Structura proiectului

Inventarul de mai jos omite conținutul intern `.git`, dar include toate elementele aplicației relevante.

```text
HUB_v2-LAB/
├── .agents/                         # director prezent, fără conținut funcțional identificat
├── .codex/                          # director prezent, fără conținut funcțional identificat
├── .git/                            # metadate Git
├── .gitignore
├── AGENTS.md                        # reguli locale pentru colaboratori/agenți
├── Untitled                         # prompt/artefact istoric; nu este încărcat de aplicație
├── index.html                       # dashboard și rutare principală
├── manifest.json                    # manifest PWA general
├── manifest-dz.json                 # manifest pentru Dezmembrări
├── vercel.json                      # configurare publicare Vercel
├── css/
│   ├── style.css
│   ├── clienti-notificari.css
│   ├── comenzi_piese_sh.css
│   ├── constatari_v2.css
│   ├── dezmembrari.css
│   └── dezmembrari_capture.css
├── js/
│   ├── config.js                    # URL și cheie publică Supabase
│   ├── audit.js                     # helper global pentru audit
│   ├── session-timeout.js           # timeout de inactivitate
│   ├── clienti-notificari.js
│   ├── clienti-notificari.js.orig   # copie neîncărcată
│   ├── comenzi_piese_sh.js
│   ├── constatari_v2.js
│   ├── dezmembrari.js
│   └── dezmembrari_capture.js
├── icons/                           # logo și iconuri PWA
├── clienti_notificari_demo/         # documente și capturi demonstrative
├── modules/
│   ├── admin/
│   │   ├── login.html
│   │   ├── admin.html
│   │   ├── panou_control.html
│   │   └── resetare-parola.html
│   ├── devize/
│   │   ├── deviz.html
│   │   ├── deviz-print.html
│   │   ├── deviz_final.html
│   │   ├── avans.html
│   │   ├── plati.html
│   │   ├── contracte.html
│   │   ├── cautare_devize.html
│   │   ├── comenzi_piese_sh.html
│   │   ├── clienti-notificari.html
│   │   └── clienti-notificari.html.orig
│   ├── flota/
│   │   └── lista_masini.html
│   ├── formulare/
│   │   ├── constatari_v2.html
│   │   ├── constatare-print.html
│   │   ├── detailing.html
│   │   ├── evidenta-awb.html
│   │   ├── generator.html
│   │   └── telefoane-clienti.html
│   ├── manager/
│   │   ├── manager.html
│   │   ├── manager.css
│   │   └── manager.js
│   └── stocuri/
│       ├── consumabile.html
│       ├── piese_stoc.html
│       ├── comenzi_piese.html        # placeholder
│       ├── dezmembrari.html
│       └── dezmembrari_capture.html
├── supabase/
│   ├── config.toml
│   ├── .temp/cli-latest
│   ├── migrations/
│   │   ├── 20260918132916_add_constatare_deviz_final_rpc.sql
│   │   ├── 20261014194825_add_deviz_final_avans_atomic_save.sql   # neversionat în LAB
│   │   └── 20261015000000_list_deviz_final_importable_avansuri.sql # neversionat în LAB
│   └── functions/
│       ├── _shared/google_drive.ts
│       ├── dezmembrari-photo-upload/index.ts
│       └── vin-ocr-test/             # director gol
└── documentatie_tehnica/             # documentația curentă
```

## 3. Responsabilitățile straturilor

### 3.1 Prezentare

HTML-ul definește simultan structura paginii și, în multe module, o parte mare din stil și comportament. Tailwind Play CDN este folosit alături de CSS local și stiluri inline. Acest amestec permite pagini autonome, dar nu oferă un sistem de componente reutilizabil.

### 3.2 Logică de interfață și business

Există două modele:

- module cu JavaScript dedicat: Constatare v2, Dezmembrări, Captură Dezmembrări, Comenzi piese SH, Clienți & Notificări, Manager;
- module cu script mare inclus direct în HTML: Admin, Deviz, Deviz final, Avansuri, Contracte, Flotă, Stoc și altele.

Nu există un strat unic de API. Validarea, transformările, interogările și actualizarea DOM sunt adesea în aceeași unitate de cod.

### 3.3 Date și autentificare

Supabase este accesat direct din browser cu cheia publică `anon`. `js/config.js` furnizează configurația comună, dar mai multe pagini repetă valorile și construiesc local clientul. Protecția datelor trebuie, prin urmare, să fie asigurată de RLS/RPC, nu de secretizarea cheii sau de ascunderea elementelor UI.

### 3.4 Backend specializat

- funcția RPC `create_deviz_final_from_constatare` realizează tranzacțional conversia Constatare → Deviz final;
- funcția Edge `dezmembrari-photo-upload` gestionează autorizarea, fotografiile private, OCR și operațiile privilegiate;
- funcția Edge `trimite-alerte` este executată periodic pentru expirările flotei.

## 4. Legături HTML, CSS și JavaScript

| Pagină/modul | CSS | JavaScript și biblioteci relevante |
|---|---|---|
| `index.html` | stiluri inline, Tailwind | Supabase v2, `config.js`, Lucide, `session-timeout.js`, script inline |
| `admin/login.html` | inline | Supabase, `config.js`, `audit.js`, script inline |
| `admin/admin.html` | `style.css`, Tailwind, inline | Supabase, `audit.js`, `session-timeout.js`, script inline foarte mare |
| `admin/panou_control.html` | inline | Supabase, `config.js`, script inline |
| `admin/resetare-parola.html` | Tailwind, inline | Supabase, `config.js`, script inline |
| `devize/deviz.html` | `style.css`, Tailwind, inline | Supabase, `audit.js`, `session-timeout.js`, script inline |
| `devize/deviz-print.html` | inline pentru tipărire | script inline; schimb de date prin `localStorage` |
| `devize/deviz_final.html` | `style.css`, Tailwind, inline | Supabase, Lucide, `audit.js`, `session-timeout.js`, script inline |
| `devize/avans.html` | `style.css`, Tailwind | Supabase, `config.js`, Lucide, `audit.js`, `session-timeout.js`, inline |
| `devize/cautare_devize.html` | `style.css`, Tailwind | Supabase, `session-timeout.js`, client și logică inline |
| `devize/contracte.html` | `style.css`, Tailwind | Supabase, `session-timeout.js`, inline |
| `devize/plati.html` | inline | Supabase, `config.js`, inline |
| `devize/comenzi_piese_sh.html` | `style.css`, `comenzi_piese_sh.css`, Tailwind | Supabase, `config.js`, Lucide, `audit.js`, `comenzi_piese_sh.js` |
| `devize/clienti-notificari.html` | `clienti-notificari.css` | Lucide, Supabase, `config.js`, `clienti-notificari.js` |
| `flota/lista_masini.html` | `style.css`, Tailwind | Supabase, `audit.js`, `session-timeout.js`, inline |
| `formulare/constatari_v2.html` | `constatari_v2.css` | Lucide, Supabase, `config.js`, `constatari_v2.js` |
| `formulare/constatare-print.html` | inline pentru tipărire | script inline; date prin `localStorage` |
| `formulare/detailing.html` | `style.css`, Flatpickr CSS/temă, Tailwind | Supabase, `audit.js`, Flatpickr + localizare RO, `session-timeout.js`, inline |
| `formulare/evidenta-awb.html` | `style.css`, Tailwind | Supabase, `audit.js`, `session-timeout.js`, inline |
| `formulare/generator.html` | `style.css`, Tailwind | Supabase, `session-timeout.js`, inline |
| `formulare/telefoane-clienti.html` | `style.css`, Tailwind | Supabase, Lucide, `session-timeout.js`, inline |
| `manager/manager.html` | `manager.css` | grafice DOM/CSS prin `renderTrend()`, Supabase, `config.js`, `manager.js` |
| `stocuri/consumabile.html` | `style.css`, Tailwind | Supabase, Lucide, `audit.js`, jsPDF, AutoTable, `session-timeout.js`, inline |
| `stocuri/piese_stoc.html` | `style.css`, Tailwind | Lucide, PapaParse 5.3.2, `session-timeout.js`, Google Sheets CSV |
| `stocuri/dezmembrari.html` | `dezmembrari.css` | Supabase, `config.js`, Lucide, `dezmembrari.js` |
| `stocuri/dezmembrari_capture.html` | `dezmembrari_capture.css` | Supabase, `config.js`, Lucide, `dezmembrari_capture.js` |
| `stocuri/comenzi_piese.html` | `style.css`, Tailwind | Lucide; placeholder, fără flux activ confirmat |

Fișierele `.orig` nu sunt referite de paginile curente.

## 5. Inițializarea aplicației

Fluxul tipic al unei pagini este:

1. browserul încarcă HTML-ul și bibliotecile CDN;
2. se creează clientul Supabase;
3. se verifică sesiunea curentă;
4. se citește `auth_profiles`, uneori împreună cu `auth_roles`;
5. pagina decide dacă utilizatorul poate continua;
6. se încarcă datele modulului;
7. evenimentele UI trimit interogări directe, RPC sau apeluri Edge.

`index.html` este punctul de intrare principal. El construiește `window.USER_DATA`, filtrează navigarea după permisiuni și redirecționează rolul Manager către pagina dedicată, cu excepția parametrului `?hub=1`.

## 6. Sesiune și sincronizare

`session-timeout.js` implementează 30 de minute de inactivitate pentru utilizatorii care nu sunt Admin. Activitatea este sincronizată între taburi prin `localStorage`, iar schimbările de autentificare sunt urmărite. Deoarece fișierul nu este inclus de toate paginile, comportamentul nu este uniform în întregul HUB.

Unele module folosesc canale Supabase Realtime, iar dashboardul combină abonamentele cu polling la 60 de secunde. La verificarea curentă, publicația `supabase_realtime` nu conținea tabele, astfel încât eficiența abonamentelor nu este confirmată.

## 7. Tipărire și transfer local de date

Paginile de tipărire pentru constatări și devize nu reîncarcă direct datele din Supabase. Pagina sursă salvează o structură în `localStorage`, apoi deschide pagina de print care citește cheia corespunzătoare (`currentConstatarePrint` sau `currentDevizPrint`). Acest mecanism este local browserului și nu constituie o arhivă persistentă.

## 8. Publicare și PWA

`vercel.json` configurează livrarea aplicației statice. `manifest.json` și `manifest-dz.json`, împreună cu iconurile, oferă metadate PWA. Nu a fost identificat un service worker local în inventarul curent; prin urmare, existența manifestelor nu dovedește un mod offline complet.

## 9. Caracteristici arhitecturale importante

- paginile sunt slab cuplate la nivel de fișiere, dar puternic cuplate prin schema Supabase;
- nu există contracte TypeScript sau generare de tipuri pentru schema bazei de date;
- configurația Supabase este parțial centralizată și parțial duplicată;
- logica de securitate este împărțită între UI, RLS și funcții SQL/Edge;
- unele operații sensibile au fost mutate corect în backend, dar multe tabele vechi sunt accesate direct;
- dimensiunea mare a mai multor fișiere HTML/JS crește costul de înțelegere și riscul modificărilor laterale.

## Actualizare 15.10.2026 — traseul Avans → Deviz final

În checkout-ul principal, `deviz_final.html` apelează `public.list_deviz_final_importable_avansuri(bigint,text,text)` pentru selecție și `public.save_deviz_final(bigint,jsonb,jsonb)` pentru salvarea atomică a antetului și liniilor. `private.resolve_deviz_final_vehicle(text,text)` rezolvă vehiculul pentru utilizatorul cu `deviz_final` fără a cere `clienti_notificari`. Triggerul pe inserarea avansului creează statutul de eligibilitate pentru înregistrări noi. Printul primește avansurile separat prin payloadul temporar din `localStorage`.

`create_deviz_final_from_constatare` rămâne calea de conversie existentă. Schema și RPC-urile noi sunt verificate în Supabase; paginile din LAB conțin acum acest cod, copiat în working tree. Arborii de fișiere și numărul de migrări din secțiunea 2 descriu snapshotul inițial și trebuie citiți împreună cu această actualizare.
