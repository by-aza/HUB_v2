# HUB AUTO — începe aici

Punct comun de pornire pentru ChatGPT, Codex, Claude, Gemini și alte modele AI.
Redactare inițială la **21.10.2026** pentru mirror-ul separat `/home/aza/HUB AUTO/HUB_v2-LAB`;
**reconciliere la 03.11.2026 pentru repository-ul principal `/media/aza/Depozit_Mint/HUB_v2`**.
Fișierele curente sunt sursa locală pentru existență, căi/importuri și implementare statică.
Verifică branch-ul și mediul țintă la fiecare sarcină; branch-ul nu este permanent.
Supabase live, autorizarea efectivă, browserul și versiunea publicată rămân **NEEDS_REVIEW**.

**Istoric LAB — memoria colectivă HUB AUTO v1, reconciliere documentară la 22.10.2026.** Codul LAB a fost recitit; starea live consemnată la 21.10 rămâne cea din documentul 22, fără un nou audit Supabase sau validare în producție.
Verificarea acestei redactări a fost locală: documentație, cod și hash-uri; fără acces nou la Supabase live.

## 1. Principiul proiectului

HUB AUTO este o aplicație internă, simplă, dezvoltată după nevoile colegilor.
Acoperă birou, service, devize, avansuri, plăți, magazie, flotă, detailing și administrare.
O sarcină rezolvă nevoia concretă cerută, păstrând fluxurile și aspectul deja folosite.
Nu extinde implicit sarcina cu redesign, framework nou, infrastructură sau autentificare suplimentară.
Context: [vedere de ansamblu](00_OVERVIEW.md) și [direcția de simplitate](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

## 2. Înainte de orice intervenție

1. Citește cererea curentă și [AGENTS.md](../AGENTS.md); identifică fișierele și mediul autorizate.
2. Citește [INDEX.md](INDEX.md) și nota locală din [00_OVERVIEW.md](00_OVERVIEW.md); pentru RLS, citește dovada istorică și limitele din [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).
3. Alege documentele tematice folosind indexul canonic și harta de la secțiunea 7.
4. Verifică directorul, branch-ul activ, mediul țintă și `git status --short`; păstrează modificările preexistente și fișierele neversionate.
5. Deschide pagina reală, scripturile și stilurile încărcate, apoi urmărește handlerul existent.
6. Verifică dependențele și probele disponibile înainte să alegi modificarea minimă.

Instrucțiunile explicite ale utilizatorului stabilesc limita sarcinii; documentația nu acordă drept de deploy.
O cerere „doar documentație” permite numai modificările documentare indicate.
Nu crea fișiere, foldere, componente sau fluxuri suplimentare fără necesitate în scopul cerut.

### Cum interpretezi dovezile

- Pentru implementarea locală, verifică sursa executată, nu o captură, un comentariu sau un prototip.
- Pentru starea bazei, folosește catalogul mediului verificat; SQL-ul local nu dovedește aplicarea.
- Pentru stadiul documentat, citește actualizarea datată de la început înaintea arhivei de dedesubt.
- Pentru producție, cere dovezi ale versiunii și comportamentului țintă; LAB nu dovedește publicarea.
- Dacă sursele se contrazic, raportează fișierul/secțiunea, observația și limita; nu corecta automat codul.
- Marchează **UNKNOWN / NEVERIFICAT** ceea ce nu poți confirma; nu transforma propunerile în funcții existente.

## 3. Tehnologii și structură verificate

Aplicația principală este multipagină: **HTML, CSS și JavaScript vanilla**, fără `package.json` sau build local.
Folosește Supabase JS v2 din CDN pentru Auth, date, RPC, Storage și unele abonamente Realtime.
Tailwind Play CDN și Lucide apar în numeroase pagini; includerea lor nu este uniformă.
jsPDF/AutoTable, PapaParse și Flatpickr sunt dependențe ale unor module, nu ale tuturor paginilor.
[vercel.json](../vercel.json) definește local antete de cache HTML; nu confirmă procedura de deploy sau versiunea publicată.
Detalii: [arhitectură](01_ARHITECTURA.md), [module](02_MODULE.md), [integrări](06_DEPENDENTE_SI_INTEGRARI.md).

| Loc verificat | Responsabilitate |
|---|---|
| [index.html](../index.html) | Dashboard, navigare, badge-uri și integrarea căutării comune |
| [modules/](../modules/) | Pagini pe domenii: `admin`, `devize`, `flota`, `formulare`, `manager`, `stocuri` |
| [css/](../css/) | Stiluri comune minimale și fișiere dedicate modulelor |
| [js/](../js/) | Configurare, audit, sesiune, ciorne și logica unor module |
| [icons/](../icons/) | Branding și iconuri; manifestele sunt în rădăcină |
| [supabase/](../supabase/) | Trei migrări locale, SQL-uri auxiliare și surse Edge; pachetele RLS/audit/test LAB descrise în istoric lipsesc aici |
| [documentatie_tehnica/](./) | Documentație internă, fără rol runtime |

Multe pagini au CSS și JS inline; un fișier JS cu nume asemănător nu este automat implementarea activă.
[js/config.js](../js/config.js) nu este singura inițializare Supabase: există și clienți inline.
Manifestele [general](../manifest.json) și [Dezmembrări](../manifest-dz.json) nu dovedesc funcționare offline.

[`test_ai/registru-lucrari.html`](test_ai/registru-lucrari.html), din documentație, este o demonstrație independentă cu opt lucrări fictive locale și interacțiuni în memorie: fără Supabase, fără persistență și fără integrare în HUB. Nu este modul activ; vezi [02, §11](02_MODULE.md).

## 4. LAB și producție

| Mediu | Identitate documentată | Regulă |
|---|---|---|
| Repository principal | Checkout local `/media/aza/Depozit_Mint/HUB_v2`; inițializările frontend inspectate folosesc ref `xyovkxmtbvgcwavuyxxu` | Sursă pentru fișiere și logică statică; nu dovedește versiunea publicată sau starea live |
| Mirror LAB separat | `/home/aza/HUB AUTO/HUB_v2-LAB`; Supabase documentat `HUB_AUTO_LAB`, ref `smrrvkyyywtferhlrjnn` | Dovezi istorice/de testare în mediul autorizat, fără certificarea checkout-ului curent |
| Producție live | Supabase documentat `HUB_Service_Auto`, ref `xyovkxmtbvgcwavuyxxu` | Stare live și deploy NEEDS_REVIEW; modificare/publicare numai cu autorizare explicită |

- Verifică directorul, URL-ul și ref-ul efectiv înainte de operații; numele folderului nu este suficient.
- Inventariază toate inițializările active, nu doar configurația comună; nu afișa chei sau sesiuni în rapoarte.
- Nu transfera URL-uri, chei, conturi, date sau configurații LAB în producție.
- LAB rămâne independent; nu îl reclona sau reseta automat după etape.
- Alinierea catalogului și diferențele cron/net/Storage sunt consemnări din 21.10; starea live actuală rămâne NEEDS_REVIEW.
- Înaintea unui transfer cerut, compară versiunea țintă și [inventarul 23](23_INVENTAR_TRANSFER_PRODUCTIE.md).
- Documentul 23 păstrează comparația istorică LAB cu propriul HEAD și rezumatul auditului local 8/18/3; un inventar nou este obligatoriu înainte de transfer.
- Fișierele mixte cer reconciliere punctuală; nu copia întreg working tree-ul și nu înlocui global ref-uri.
- Nu face commit, push sau deploy când nu sunt cerute; documentarea unei livrări nu autorizează execuția.

## 5. Păstrează designul și funcționalitățile

- Păstrează structura vizuală, densitatea, spațierile, culorile, fonturile și comportamentul responsive al paginii.
- Reutilizează componentele aprobate și modelele deja existente înainte de a introduce o variantă nouă.
- Păstrează ID-urile, selectorii, handler-ele, navigarea, parametrii URL și contractele de date folosite.
- Nu rescrie logica existentă pentru o modificare punctuală; urmărește întâi fluxul real de citire/salvare.
- Nu elimina fallback-uri, polling sau helper-e pentru că par redundante fără verificarea consumatorilor.
- La editări HTML/CSS/JS, adaugă comentarii scurte în română la blocurile/clasele importante, conform AGENTS.md.
- Comentariile explică setările rapide și scopul; nu comenta fiecare linie și nu schimba funcționalitatea.

## 6. Identificarea stilurilor și reutilizarea componentelor

Consultă și [catalogul vizual](referinte_vizuale/INDEX.md): capturile LAB/DEMONSTRATIV ilustrează componentele și precizează proveniența datelor. O captură nu dovedește persistența, autorizarea sau publicarea în producție.

1. Citește `<head>`, toate `<link>`/`<style>`, clasele elementului și eventualele stiluri inline/dinamice.
2. Caută selectorul real în pagina țintă și fișierele încărcate; verifică ordinea și specificitatea regulilor.
3. Caută `:root`, variabilele CSS, `font`/`font-family`, importurile Google Fonts și clasele Tailwind.
4. Verifică în browser stilurile calculate, hover/focus/disabled și breakpoint-urile relevante când ai acces.
5. Refolosește exemplul apropiat funcțional și vizual; nu deduce un sistem global dintr-o singură pagină.

Repere confirmate din cod, **nu o paletă universală de aplicat peste tot**:

| Sursă | Ce găsești efectiv |
|---|---|
| [avans.html](../modules/devize/avans.html), `<style>` | Importuri Inter și JetBrains Mono; `--bg: #14161c`, `--accent: #2dd4cf`; `.panel-card`, `.page-header` |
| [manager.css](../modules/manager/manager.css), `:root` | Inter și fallback-uri; `--bg: #101217`, `--teal: #48d8c8` |
| [clienti-notificari.css](../css/clienti-notificari.css) | Variabile locale; `.cn-button`, `.cn-panel`; fonturi monospațiate pentru numere/sume |
| [constatari_v2.css](../css/constatari_v2.css) | Paletă și layout proprii; `--bg: #070c14`, `--cyan: #22d3ee` |
| [style.css](../css/style.css) | Numai comportamentul `.hub-card` și hover-ul său; nu un design system complet |

Un font importat nu dovedește fontul efectiv: verifică inclusiv utilitarele Tailwind și moștenirea.
În checkout nu au fost găsite `AI_CONTEXT.md`, `PROJECT_STRUCTURE.md`, `DESIGN_SYSTEM.md` sau `DESIGN_RULES.md`.
Nu inventa conținutul lor și nu le crea implicit; folosește sursele reale și harta de mai jos.

### Referință aprobată: butonul Înapoi

Folosește drept model [butonul din avans.html](../modules/devize/avans.html), în `.page-header .header-top`.
Este un link cu clasele `back-link justify-self-start inline-flex items-center gap-2 transition-all group`.
Are iconul Lucide `arrow-left` cu `w-5 h-5 group-hover:-translate-x-1 transition-transform`.
Textul „Înapoi” folosește `font-bold uppercase tracking-wider text-xs`.
Culorile vin din `.page-header .back-link` și `:hover`, prin `--muted` și `--text`.
La reutilizare păstrează aspectul, hover-ul și poziția; verifică și regula mobilă a antetului.
Include dependențele necesare sau echivalentul deja aprobat în pagina țintă, fără importarea întregului modul.
Adaptează numai calea validă de întoarcere la context; exemplul Avansuri folosește `../../index.html`.
Manager are deja varianta sa și `../../index.html?hub=1`, necesar pentru evitarea redirecționării în buclă.
Nu înlocui navigarea existentă cu `history.back()` și nu uniformiza automat toate butoanele din HUB.

## 7. Harta documentației după sarcină

La fiecare sarcină se aplică lectura de bază din secțiunea 2; apoi citește rândurile relevante:

| Sarcină | Documente de citit |
|---|---|
| Orientare, structură, găsirea paginii active | [01_ARHITECTURA.md](01_ARHITECTURA.md), [02_MODULE.md](02_MODULE.md) |
| UI, CSS, fonturi, componente, responsive | [01_ARHITECTURA.md](01_ARHITECTURA.md), [02_MODULE.md](02_MODULE.md), [DESIGN_SYSTEM_HUB.md](DESIGN_SYSTEM_HUB.md), sursele din secțiunea 6 și pagina țintă |
| Flux de business sau bug între module | [02_MODULE.md](02_MODULE.md), [05_FLUXURI_PRINCIPALE.md](05_FLUXURI_PRINCIPALE.md), [06_DEPENDENTE_SI_INTEGRARI.md](06_DEPENDENTE_SI_INTEGRARI.md) |
| Tabele, coloane, relații, RPC, Storage, Edge | [03_SUPABASE.md](03_SUPABASE.md), [06_DEPENDENTE_SI_INTEGRARI.md](06_DEPENDENTE_SI_INTEGRARI.md), [09_MATRICE_ACCES.md](09_MATRICE_ACCES.md) |
| Roluri, bife, login sau acces refuzat | [04_ROLURI_SI_ACCES.md](04_ROLURI_SI_ACCES.md), [09_MATRICE_ACCES.md](09_MATRICE_ACCES.md), [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md) |
| RLS, privilegii, testare sau rollback autorizat | [10_PLAN_RLS.md](10_PLAN_RLS.md), [11_PLAN_ROLLBACK.md](11_PLAN_ROLLBACK.md), [12_TESTE_ACCES.md](12_TESTE_ACCES.md), plus 03/09/22 |
| Înțelegerea vechilor Serii 0/1 | [21_RLS_SERIA_0_AUTH_PROFILES.md](21_RLS_SERIA_0_AUTH_PROFILES.md), [20_RLS_SERIA_1_TABELE_SIMPLE.md](20_RLS_SERIA_1_TABELE_SIMPLE.md); citește mai întâi stadiul 22 |
| Deviz final, avansuri, sume și print | [17_MODIFICARI_AVANSURI_2026-10-14_15.md](17_MODIFICARI_AVANSURI_2026-10-14_15.md), [05_FLUXURI_PRINCIPALE.md](05_FLUXURI_PRINCIPALE.md), plus 03/09 |
| Ciorne locale și recuperare Deviz final | [20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md](20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md), [23_INVENTAR_TRANSFER_PRODUCTIE.md](23_INVENTAR_TRANSFER_PRODUCTIE.md) |
| Manager, KPI, căutare comună, plăți | [18_MANAGER_DASHBOARD_REDESIGN.md](18_MANAGER_DASHBOARD_REDESIGN.md), [19_MANAGER_V2_FISIERE_DEPLOY.md](19_MANAGER_V2_FISIERE_DEPLOY.md), plus 05/09/23 |
| Prototip Manager istoric | [18_MANAGER_DASHBOARD_V2_PROTOTIP.md](18_MANAGER_DASHBOARD_V2_PROTOTIP.md), exclusiv ca arhivă OBSOLETE |
| Performanță sau polling | [15_OPTIMIZARI_IMPLEMENTATE.md](15_OPTIMIZARI_IMPLEMENTATE.md) înainte de [13_AUDIT_PERFORMANTA.md](13_AUDIT_PERFORMANTA.md) și [14_PLAN_OPTIMIZARE.md](14_PLAN_OPTIMIZARE.md) |
| Curățenie, presupuse fișiere nefolosite | [16_CURATENIE_PROIECT.md](16_CURATENIE_PROIECT.md), [06_DEPENDENTE_SI_INTEGRARI.md](06_DEPENDENTE_SI_INTEGRARI.md), plus căutarea referințelor actuale |
| Riscuri sau propuneri de îmbunătățire | [07_RISCURI_SI_ZONE_SENSIBILE.md](07_RISCURI_SI_ZONE_SENSIBILE.md), [08_RECOMANDARI.md](08_RECOMANDARI.md), plus stadiul 22 |
| Transfer în producție cerut explicit; context LAB istoric | [23_INVENTAR_TRANSFER_PRODUCTIE.md](23_INVENTAR_TRANSFER_PRODUCTIE.md), [19_MANAGER_V2_FISIERE_DEPLOY.md](19_MANAGER_V2_FISIERE_DEPLOY.md), documentul funcției transferate |

## 8. Verificări înainte de modificarea datelor sau accesului

1. Confirmă proiectul și operațiile autorizate; începe cu citiri de metadata, fără date personale inutile.
2. Din pagina/handlerul real, inventariază `.from(...)`, `.rpc(...)`, apelurile Edge și Storage.
3. Caută fiecare tabel/coloană/RPC în toate modulele, inclusiv Admin, Manager, căutare, badge-uri și print.
4. Compară cu 03/09/22; pentru o modificare DB, verifică live coloane, tipuri, FK, CHECK, indecși și triggere.
5. Citește politicile RLS și GRANT-urile pe tabel, coloane, secvențe și funcții; un singur nivel nu ajunge.
6. Verifică rolul, bifa exactă, fallback-ul și operația S/I/U/D; permisiunea meniului poate diferi de politica DB.
7. Distinge citirea contextuală de scriere; verifică efectele RPC invoker/definer și ale backendului privilegiat.
8. Pentru o schimbare autorizată, stabilește preflight, test LAB și rollback potrivit versiunii reale.
9. Dacă lipsesc accesul sau dovezile live, consemnează limita; nu aplica SQL presupunând schema din fișiere.

Admin are acces la operațiile implementate indiferent de bifă; nu inventa operații noi pe această bază.
Regula de business rezervă modificarea rolurilor/bifelor Adminului. Manager/2 are excepțiile existente, nu acces universal implicit.

În sursele locale, administrarea utilizatorilor acceptă Admin sau `admin_useri`, iar Panoul Control acceptă Admin sau `panou_control`. Constatarea LAB din 22.10 descria verificări frontend Admin-only în acel mirror. Regula de business, verificarea frontend și politicile DB sunt niveluri distincte; autorizarea efectivă actuală este NEEDS_REVIEW. Detalii în [04](04_ROLURI_SI_ACCES.md). Editarea profilurilor existente este implementată static; butoanele de creare/ștergere rămân placeholder-uri.
Ascunderea UI nu este autorizare la nivel de date; cheia publică nu se înlocuiește cu `service_role` în browser.
Storage se verifică separat de tabelul care păstrează URL-urile; verifică și sursele unui VIEW.
Nu executa întreg `supabase/migrations/`, pachete istorice sau rollback-uri doar fiindcă există local.

Dependențe sensibile de păstrat: Constatare → Deviz final, avans → plăți → import DF și stoc → VIEW → consumatori.
Devizul final salvează prin `save_deviz_final`; conversia din Constatare are RPC-ul separat existent.
`deviz_final_header.total_general` este restul după avans; valoarea devizului final este `total_manopera + total_piese`.
Ciornele locale nu sunt salvări Supabase, iar payloadul de print nu este o ciornă; vezi documentele 17 și 20.

## 9. Stadiu de preluare și limite

Stările RLS/acces/riscuri din tabel sunt **dovezi istorice din 21.10.2026**, fără reverificare live în reconcilierea din 03.11. Datele locale sunt indicate separat. Niciun rezultat de test istoric nu devine PASS al acestui checkout.

| Domeniu | Stare și sursa de continuare |
|---|---|
| Activare RLS planificată | Finalizată: 36/36 tabele publice în ambele medii, 120 politici; [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md), dovezi în [12](12_TESTE_ACCES.md) |
| Login și roluri | Login poreclă/email + parolă păstrat; scriere profiluri/roluri Admin-only; SELECT anonim păstrat pentru compatibilitate; [04](04_ROLURI_SI_ACCES.md), [09](09_MATRICE_ACCES.md) |
| AUTH avansat | Decizie istorică: `hub-login`, limiter custom și Turnstile SUSPENDATE; flag-urile false descriau LAB, iar fișierele helper/wrapper lipsesc aici; [21](21_RLS_SERIA_0_AUTH_PROFILES.md), [23](23_INVENTAR_TRANSFER_PRODUCTIE.md) |
| Manager integrat și ciorne | Prezente static în checkout-ul principal; testele istorice LAB și limitele sunt în [18 redesign](18_MANAGER_DASHBOARD_REDESIGN.md) și [20 ciorne](20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md); producția nu se deduce din LAB |
| Avansuri și print | Integrare cu confirmare istorică a utilizatorului în producție; nu este un test nou; [17](17_MODIFICARI_AVANSURI_2026-10-14_15.md) |
| Optimizări | Registrul [15](15_OPTIMIZARI_IMPLEMENTATE.md) separă implementat/deployed/deschis; pollingul Generator la 5 secunde este păstrat intenționat |
| Restanțe punctuale | TRUNCATE pe 16 tabele, Generator public permisiv, TODO prea larg și Storage Contracte public în producție; [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md) |
| Frontend de reconciliat | [23](23_INVENTAR_TRANSFER_PRODUCTIE.md): istoric LAB cu 29 diferențe; audit local 8 hash-uri identice / 18 diferite / 3 fișiere absente; inventar nou înainte de transfer |

RLS ON nu înseamnă hardening complet sau testarea exhaustivă a fiecărei funcții în producție.
În LAB, documentația din 21–22.10 consemna consumatori ai helperului `js/auth-security.js`. Acest fișier, `js/turnstile-config.js` și `js/turnstile.js` sunt **absente din checkout-ul curent** și nu sunt dependențe runtime ale surselor locale inspectate; nu le importa implicit. Dependențele LAB rămân istoric în [06](06_DEPENDENTE_SI_INTEGRARI.md) și [23](23_INVENTAR_TRANSFER_PRODUCTIE.md).
Clienți & Notificări are citiri/scrieri reale și elemente DEMO; nu presupune nici mock integral, nici automatizare completă.

## 10. Istoric LAB — reconciliere documentară și limite din 22.10.2026

- Referințele din [01](01_ARHITECTURA.md) și [06](06_DEPENDENTE_SI_INTEGRARI.md) au fost aliniate: Managerul LAB folosește grafice DOM/CSS prin `renderTrend`, fără Chart.js.
- Formulările „19 tabele RLS OFF”, „NEAPLICAT” și blocajele Seria 0/1 rămân în arhive; nu sunt stadiul din 21.10.2026.
  Trimiterile contradictorii de datare au fost corectate; pentru starea documentată și direcția de simplitate prevalează [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).
- Titlul „V2” din [19](19_MANAGER_V2_FISIERE_DEPLOY.md) nu indică o rută `manager-v2.*` activă: fișierele nu mai există; ruta este `modules/manager/manager.html`.
- Confirmarea Manager din [15](15_OPTIMIZARI_IMPLEMENTATE.md), datată 13.10, privește optimizarea de atunci; nu dovedește publicarea redesignului LAB din 16.10.

Cele 29 de hash-uri din registrul 23 coincid cu sursele LAB la această redactare; versiunea frontend publicată rămâne neverificată aici.
Reconcilierea din 22.10.2026 a modificat numai documentația; implementarea, catalogul vizual și imaginile au rămas intacte. Verificările sunt statice, fără un nou test funcțional în browser sau acces live Supabase.

## 11. Validare și raport către utilizator

- Raportează în română, concis: problema, schimbarea efectuată, motivul și fișierele exacte.
- Separă modificările tale de cele preexistente și precizează mediul efectiv verificat.
- Enumeră verificările executate și rezultatele; separă verificările statice, mock/local, LAB real și producție.
- Pentru UI, verifică pagina/handlerul real, navigarea și ecranele relevante; sintaxa singură nu dovedește aspectul.
- Pentru acces, probele unui catalog sau ale unui client privilegiat nu dovedesc comportamentul utilizatorilor obișnuiți.
- Pentru teste cu scrieri autorizate, confirmă cleanup-ul datelor proprii și restaurarea permisiunilor temporare.
- Menționează contradicțiile, erorile, riscurile confirmate și ce rămâne UNKNOWN, fără a inventa rezultate.
- Indică explicit dacă nu ai rulat browserul/testele live și dacă nu ai făcut commit, push sau deploy.
- Pentru sarcini documentare, verifică linkurile relative și limita fișierelor atinse; nu modifica aplicația pentru a valida textul.
