# Manager Dashboard integrat — liste istorice LAB pentru livrare

## Folosire în repository-ul principal — 03.11.2026

Managerul integrat, căutarea comună HUB/Manager și ciornele există static în
sursele locale. Inventarul lor este în [02](02_MODULE.md); publicarea și
comportamentul în browser rămân **NEEDS_REVIEW**.

Listele de patru/șase/nouă fișiere și instrucțiunile „COPIAZĂ” de mai jos păstrează
contextul LAB din 16–22.10. Nu sunt manifestul branch-ului curent și nu autorizează
o copiere. [23](23_INVENTAR_TRANSFER_PRODUCTIE.md) este comparație istorică LAB;
înainte de orice transfer se generează un inventar nou și se compară ținta reală.

`js/auth-security.js`, `js/turnstile-config.js` și `js/turnstile.js` sunt absente
aici; consumatorii helper-elor pasive/wrapper-ului descriși în LAB nu sunt
dependențe runtime curente. `modules/manager/manager-v2.html`,
`modules/manager/manager-v2.css` și `modules/manager/manager-v2.js` sunt prototipuri
istorice eliminate, absente și aici. `manager-v1-original-LAB.zip` este arhiva
istorică livrată extern în conversație, fără copie disponibilă în acest checkout.
Niciunul dintre aceste artefacte nu se recreează prin documentare.

## Registru de livrare reconciliat — 21.10.2026

Lista funcțională istorică de mai jos rămâne referință pentru Manager, nu manifest de copiere. Registrul frontend actual este [23_INVENTAR_TRANSFER_PRODUCTIE.md](23_INVENTAR_TRANSFER_PRODUCTIE.md), cu 29 fișiere și hash-uri recitite.

RLS este activ pe toate cele 36 tabele publice în ambele medii. Citirile Manager deja implementate au fost păstrate, inclusiv rol_id=2/manager_dashboard pe sursele relevante; acest fapt nu confirmă versiunea HTML/JS/CSS publicată. Managerul nu primește automat operații de scriere în Devize sau acces la liniile lor.

Se sincronizează numai diferențele funcționale care lipsesc din proiectul principal, după compararea versiunii țintă. Acea copie nu a fost accesată aici. Nu se transferă URL/chei LAB, login nou sau Turnstile; paginile mixte cu ciorne și AUTH suspendat nu sunt gata de copiere integrală.

Nu a fost făcut deploy sau test browser/producție în actualizarea documentară. Stadiul și restanțele reale: [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Context istoric și detalii de implementare

Secțiunile de mai jos păstrează auditul și actualizările datate. Inventarele, numerele și formulările „actual/live” rămase în acest context nu sunt o nouă verificare a LAB sau a producției; stadiul documentat la 21.10.2026 este cel precizat mai sus.

Data: 16.10.2026. Rădăcină LAB: `/home/aza/HUB AUTO/HUB_v2-LAB`.
Lista de mai jos este lista finală pentru Managerul integrat în LAB și înlocuiește lista prototipului separat obsolete, deja șters. Livrarea actuală folosește ruta Manager existentă `modules/manager/manager.html`. Toate căile proiectului sunt complete, relative la rădăcină.

**Testare manuală LAB raportată pozitiv de utilizator, inclusiv pe alți utilizatori, la 16.10.2026. Deploy-ul noului Manager în producție nu este confirmat; agentul nu a făcut deploy sau commit.** COPIAZĂ înseamnă exclusiv după aprobarea versiunii finale și revizuirea diferențelor față de mediul țintă.

## 1. Fișiere Manager

| Fișier | Tip | Acțiune producție | Înlocuiește / nou | Rol și necesitate |
|---|---|---|---|---|
| `modules/manager/manager.html` | modificat | COPIAZĂ după aprobare | Înlocuiește pagina Manager existentă | Dashboard compact, casetă Dezmembrări, cele trei taburi, plăți integrate, căutare globală și Înapoi în stânga |
| `modules/manager/manager.css` | modificat | COPIAZĂ după aprobare | Înlocuiește stilul Manager existent | Layout QHD/tabletă/telefon, casetă Dezmembrări cu accent pentru De completat, rezultate grupate și Înapoi |
| `modules/manager/manager.js` | modificat | COPIAZĂ după aprobare | Înlocuiește logica Manager existentă | Date și KPI reale, două HEAD COUNT Dezmembrări cu control de gestiune, workflow plăți, avertizări și motorul comun `HubGlobalSearch` |

## 2. Integrare HUB

| Fișier | Tip | Acțiune producție | Înlocuiește / nou | Rol și necesitate |
|---|---|---|---|---|
| `index.html` | modificat | COPIAZĂ numai împreună cu Manager JS compatibil, după aprobare | Înlocuiește indexul țintei, după reconcilierea modificărilor preexistente | Cele trei intrări Manager folosesc `MANAGER_DASHBOARD_URL`; căutarea HUB folosește același motor ca Manager și include C&N/AWB/relații |

Ruta era deja aceeași după rescrierea Managerului în etapa anterioară. Integrarea nu introduce o redirecționare artificială spre prototip: auto-redirectul Manager, linkul din meniu și cardul indică toate pagina redesenată canonică. `?hub=1` la revenire permite vizualizarea HUB pentru rolul Manager.

**Atenție la modificările LAB preexistente:** indexul și alte fișiere aveau deja diferențe la început. Lista de deploy nu aprobă implicit toate aceste diferențe sau întregul checkout. Înainte de copiere, revizuiește indexul consolidat față de producție; nu presupune că tot conținutul său preexistent este aprobat prin această intervenție. Producția nu a fost inspectată sau modificată acum.

## 3. Documentație — NU COPIA în rădăcina web de producție

| Fișier | Tip în această intervenție | Acțiune | Rol |
|---|---|---|---|
| `documentatie_tehnica/00_OVERVIEW.md` | modificat | NU COPIA web; păstrează intern | Starea activă LAB și confirmarea utilizatorului |
| `documentatie_tehnica/02_MODULE.md` | modificat | NU COPIA web; păstrează intern | Inventar actual al surselor și funcțiilor Manager |
| `documentatie_tehnica/05_FLUXURI_PRINCIPALE.md` | modificat | NU COPIA web; păstrează intern | Fluxuri Manager și status comun al plăților |
| `documentatie_tehnica/07_RISCURI_SI_ZONE_SENSIBILE.md` | modificat | NU COPIA web; păstrează intern | Riscuri rezolvate și limite rămase |
| `documentatie_tehnica/08_RECOMANDARI.md` | modificat | NU COPIA web; păstrează intern | Rezolvări confirmate și verificări viitoare |
| `documentatie_tehnica/18_MANAGER_DASHBOARD_V2_PROTOTIP.md` | modificat | NU COPIA web; păstrează intern | Arhivă documentară obsolete; fără rol runtime |
| `documentatie_tehnica/18_MANAGER_DASHBOARD_REDESIGN.md` | modificat | NU COPIA web; păstrează intern | Contract KPI, surse/formule, căutare comună, flux plăți, limite și validare |
| `documentatie_tehnica/19_MANAGER_V2_FISIERE_DEPLOY.md` | modificat | NU COPIA web; păstrează intern | Lista exactă de livrare, dependențe, ordine și verificări |

Lista de bază din 16.10.2026 conținea cele trei fișiere Manager și `index.html`. Actualizarea din 17.10.2026 adaugă dependențele comune pentru intrarea „Ciorne locale”, descrise mai jos; lista de patru fișiere nu mai trebuie livrată izolat. Documentația tehnică, inclusiv documentele 00, 02, 05, 07, 08, 18 și 19 și documentul istoric de prototip, se păstrează intern și nu este fișier funcțional de deploy. Actualizarea de stare din 16.10.2026 modifică numai aceste opt documente, fără aplicație sau Supabase.

## 4. Ce NU se copiază

- `modules/manager/manager-v2.html`, `modules/manager/manager-v2.css`, `modules/manager/manager-v2.js`: prototipuri obsolete, deja șterse din LAB după verificarea lipsei referințelor runtime; nu se recreează și nu se copiază în producție.
- Restul `documentatie_tehnica/`: documentație internă, fără rol runtime.
- `js/config.js`, `js/session-timeout.js`, `modules/devize/avans.html`, `modules/devize/plati.html`, `js/clienti-notificari.js` și alte module: dependențe existente, nemodificate; nu se suprascriu implicit.
- SQL-uri/migrări, `js/constatari_v2.js`, paginile Deviz final și alte diferențe LAB preexistente: în afara acestei livrări.
- Testele, fixture-urile sintetice, capturile și inventarele din directorul conversației Codex: în afara LAB și în afara livrării.
- `manager-v1-original-LAB.zip`: arhivă istorică livrată separat în outputs conversației, cu HTML/CSS/JS din HEAD-ul LAB. Păstrează versiunea v1 în fișiere pentru recuperare; conținutul istoric nu este dashboardul actual și nu se publică web. Arhiva nu este dependență runtime; prototipurile separate au fost ulterior eliminate din LAB.

## 5. Dependențe între fișiere

- `manager.html` → `manager.css`, `manager.js`, SDK Supabase v2 existent, `js/config.js`, fontul Inter și faviconul existente ca infrastructură.
- `manager.js` → clientul comun primit de pagină, `js/session-timeout.js`, tabelele/view-urile existente; UPDATE numai pe cererea originală `plati_manager`, la acțiunea utilizatorului.
- `index.html` → `modules/manager/manager.js` încărcat cu `data-hub-search-only`. Acest mod definește motorul comun fără a inițializa dashboardul Manager. Indexul și pagina folosesc aceeași versiune URL `v=20261017-drafts` a scriptului; CSS-ul Manager este de asemenea versionat. Nu există un fișier JS comun suplimentar și nu există două implementări de căutare.
- Caseta Dezmembrări depinde de `public.dezmembrari_items`, statusurile `draft`/`ready`, accesul Admin sau `dezmembrari_manage`, și ruta existentă `modules/stocuri/dezmembrari.html`. Nu necesită modificarea modulului Dezmembrări sau a Supabase. Captura simplă nu este folosită pentru totalul global.
- Motorul comun reutilizează clientul paginii apelante și permisiunile HUB. C&N și vehiculele sale necesită `clienti_notificari`; celelalte categorii păstrează permisiunile/fallback-urile. RLS real poate refuza o sursă, caz în care se afișează indisponibilitate.
- Linkurile spre C&N, Constatări, devize, Detailing, AWB, Consumabile, Avansuri, Flotă, SH și Plăți depind de modulele deja existente. Selecția directă este folosită numai unde există parametru suportat (`id`, `constatare_id`).

**Nu este necesară nicio modificare Supabase de schemă, RPC, RLS sau granturi pentru această livrare.** Nu se execută migrări SQL.

## 6. Ordine recomandată

> **Ordine istorică pentru baza de patru fișiere din 16.10.2026.** Nu este suficientă pentru LAB actual cu ciorne: secțiunea finală enumeră șase fișiere Manager + intrare locală, iar [20 Ciorne](20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md) acoperă integrarea completă. Pentru orice transfer autorizat se pornește de la [23](23_INVENTAR_TRANSFER_PRODUCTIE.md), cu versiunea țintă verificată și dependențele reconciliate; nu se execută această secvență izolată.

1. Revizuiește cele patru fișiere runtime consolidate față de țintă, inclusiv modificările indexului preexistente acestei etape. Păstrează copii ale versiunilor efective de producție pentru rollback; arhiva v1 din LAB nu înlocuiește backupul producției.
2. Preferă livrare atomică a celor patru fișiere din aceeași versiune.
3. Dacă nu este atomică, folosește o fereastră controlată și copiază `modules/manager/manager.css`, `modules/manager/manager.js`, `modules/manager/manager.html`, apoi **`index.html` ultimul**. Noul index necesită motorul comun din noul Manager JS; versiunile vechi/nouă nu trebuie servite amestecat.
4. Verifică direct Managerul și apoi accesul din HUB. Nu copia prototipul separat sau documentația web.
5. Rollback: restaurează împreună copiile celor patru fișiere țintă, fără SQL. Nu folosi arbitrar HEAD-ul LAB ca versiune de producție.

## 7. Verificări după copiere

- HTML/CSS/JS și scriptul comun răspund 200, fără erori de sintaxă/CSP/CDN. Indexul încarcă motorul în modul search-only și nu pornește query-urile Manager.
- Auto-redirectul rolului Manager, meniul și cardul deschid același dashboard; butonul Înapoi este în stânga și deschide HUB cu `?hub=1`, fără buclă.
- Caută `circu` cu un profil autorizat: clientul C&N și vehiculul/devizele asociate trebuie să apară grupat. Verifică separat DF-ID, număr auto, AWB, produs și beneficiar.
- Deschide efectiv un deviz/Constatare din rezultate. Pentru modulele fără deep-link suportat, se deschide pagina existentă, fără a promite selectarea unei fișe.
- Verifică profiluri cu permisiuni restrânse și refuz explicit; sursele interzise nu primesc cereri. Nu modifica RLS ca remediere implicită.
- În Network: debounce 350 ms, maximum 8 rânduri/categorie, o citire/sursă per termen; focus repetat nu dublează. Schimbă rapid termenul, golește câmpul și apasă ESC: răspunsul vechi nu trebuie să redeschidă lista.
- Avertizarea de stoc apare numai compact în Necesită atenție; linkul duce la Consumabile. Datele invalide nu devin zero.
- Reconciliază valoarea devizelor = manoperă + piese, comparația și media. Avansurile sunt plăți separate după data lor; nu se adună peste devize. Plățile recente sunt marcări manuale, nu dovadă de decontare bancară.
- Verifică Generatorul cu înregistrări incomplete: stare neutră/indisponibilă. La schimbarea zilei nu se afișează suma veche ca avansuri pentru azi.
- Verifică fluxul original de plăți cu o cerere de test autorizată, IBAN copy/fallback, actualizarea statusului și pagina utilizatorului după reload; agentul nu a marcat plăți reale în testele sale. Utilizatorul a raportat testare manuală generală pozitivă; rezultatul individual al acestui scenariu nu a fost enumerat.
- Verifică De completat (`draft`) și Gata de publicare (`ready`) cu statusurile din Dezmembrări; două cereri HEAD COUNT fără listă/fotografii. Admin/gestiune vede totalurile; Manager fără gestiune sau doar captură vede lipsa accesului, fără total parțial. Verifică zero, erori și linkul către modul.
- Verifică QHD, tabletă, telefon și navigarea cu tastatura. Testarea manuală în LAB, inclusiv pe alți utilizatori, este raportată pozitiv de utilizator. Verificările de mai sus se repetă după deploy în mediul țintă; acoperirea individuală a erorilor/concurenței nu a fost raportată.

## FIȘIERE PENTRU PRODUCȚIE

> **Șase fișiere pentru un scop limitat:** Manager + HUB + resursele intrării locale, nu funcția completă de ciorne. Baza de patru din §6 este istorică; cele opt din documentul 20 descriu schimbările funcției de ciorne. Reuniunea are nouă fișiere runtime, incluzând CSS Manager; loginul este MIXT/HOLD și cere numai integrarea aprobată, conform [23](23_INVENTAR_TRANSFER_PRODUCTIE.md). Niciuna dintre liste nu dovedește un deploy.

Exclusiv după aprobarea versiunii consolidate:

1. `modules/manager/manager.css`
2. `modules/manager/manager.js`
3. `modules/manager/manager.html`
4. `index.html`
5. `js/local-deviz-drafts.js` — nou, dependență comună adăugată la 17.10.2026
6. `css/local-deviz-drafts.css` — nou, stilul dialogului și intrării locale

Lista Manager cu intrarea de recuperare locală conține aceste șase fișiere funcționale. Pentru funcția completă de ciorne DF se livrează și integrarea Deviz final/login/timeout conform documentului 20; nu se livrează doar intrarea de recuperare fără editorul compatibil. Documentația este exclusă integral din deploy-ul funcțional. Nu se copiază prototipuri, arhive, SQL-uri sau alte diferențe LAB.

## Actualizare 17.10.2026 — dependențe pentru Ciorne locale DF

Noul Manager păstrează KPI-urile, căutarea și mecanismul de plăți existente. În HTML sunt încărcate helperul și stilul local, iar JS adaugă o singură intrare „Ciorne locale” folosind profilul deja verificat. Astfel, ciorna rămâne descoperibilă după închiderea dialogului în HUB și redirectul automat al rolului Manager. Scriptul comun Manager din index și HTML este versionat `v=20261017-drafts`; CSS-ul Manager rămâne neschimbat.

| Fișier | Tip | Acțiune producție | Rol |
|---|---|---|---|
| `js/local-deviz-drafts.js` | nou | COPIAZĂ după aprobare, înaintea HTML/JS apelant | Stocare JSON locală, revizii pe tab/utilizator, dialog de recuperare și intrare temporară |
| `css/local-deviz-drafts.css` | nou | COPIAZĂ după aprobare, înaintea paginilor | Dialog centrat, focus și stil compact responsive |
| `documentatie_tehnica/20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md` | nou | NU COPIA ca fișier funcțional | Lista completă a noii funcții, lifecycle, teste și acceptanță |

Nu se sincronizează cheile localStorage sau ciornele utilizatorilor. Nu sunt necesare migrări Supabase. Pentru ordinea și lista completă a fișierelor modificate la 17.10.2026 se folosește documentul 20; documentația rămâne internă. Verifică după livrare închiderea dialogului HUB, redirectul Manager și redeschiderea prin „Ciorne locale”, fără interogări duplicate la fiecare refresh Manager.
