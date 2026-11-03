# Manager Dashboard — redesign compact

Data: 16.10.2026. Mediu: exclusiv `/home/aza/HUB AUTO/HUB_v2-LAB`.
Versiunea activă în LAB este `/modules/manager/manager.html`, cu `modules/manager/manager.css` și `modules/manager/manager.js`. A înlocuit funcțional vechiul Manager și este deschisă din `index.html`. Implementarea și verificările agentului nu au modificat Supabase; această actualizare modifică numai documentația. Nu s-a făcut commit sau deploy de către agent, iar deploy-ul noului Manager în producție nu este confirmat.

La 16.10.2026, utilizatorul a raportat testarea manuală a noului Manager în LAB, inclusiv pe alți utilizatori, cu rezultat pozitiv („pare funcțional”). Aceasta este confirmarea utilizatorului, nu o nouă testare independentă în această actualizare; nu stabilește rezultatul individual al fiecărui scenariu de eroare și nu confirmă deploy-ul în producție.

## Fișiere și structură

| Fișier | Acțiune în LAB | Rol |
|---|---|---|
| `modules/manager/manager.html` | modificat | Antet compact, selector lunar, refresh, căutare și trei taburi: Financiar & Vânzări, Operațional & Departamente, Plăți. |
| `modules/manager/manager.css` | modificat | Dark HUB, grilă densă pentru QHD, padding 16–20 px, grafic scurt, tabele compacte, adaptare desktop/tabletă/telefon. |
| `modules/manager/manager.js` | modificat | Încărcare paralelă, calcule, avertizări, randare sigură, navigare/căutare, copiere IBAN și marcarea cererii originale ca plătită. |
| `documentatie_tehnica/18_MANAGER_DASHBOARD_REDESIGN.md` | modificat | Deciziile de business, integrarea plăților, validarea și lista de copiere. Nu este dependență web. |

Implementarea integrată a modificat și `index.html`, plus `documentatie_tehnica/19_MANAGER_V2_FISIERE_DEPLOY.md`. Prototipul separat `manager-v2.html/css/js` este obsolete și a fost șters din LAB după verificarea lipsei referințelor runtime. Configurația comună și pagina utilizatorului nu au fost modificate pentru integrare. Documentul 19 conține acum lista actuală pentru Managerul integrat, înlocuind lista vechiului prototip separat.

Primul tab afișează valoare devize, număr, medie, avansuri încasate, plăți de efectuat și fișe active; manoperă/piese și avansuri azi sunt note compacte. Graficul de șase luni, excepțiile și primele patru cereri neplătite sunt vizibile în aceeași vedere. Tabul operațional conține fișe active, intervale de așteptare piese, volume departamentale, Generator, AWB în tranzit și excepții de stoc. Tabul Plăți conține toate cererile neplătite și ultimele 20 plăți finalizate din fereastra citită.

## Logica financiară și calendarul

- Valoare devize = `Number(total_manopera || 0) + Number(total_piese || 0)`. `total_general` nu este citit sau utilizat de noul Manager; rămâne restul după avans în modulul Deviz final.
- Aceeași valoare integrală alimentează KPI-ul, comparația, media/deviz și graficul manoperă/piese. Sumele păstrează precizia existentă; afișarea este la două zecimale.
- Avansuri = plăți din `evidente_avansuri_plati`, după `data_platii`, separat de valoarea devizelor. Nu sunt încasările totale ale service-ului și nu se adună peste valoarea lucrărilor.
- Luna în curs se compară cu primele același număr de zile din luna precedentă, limitate la lungimea acelei luni. Lunile încheiate se compară integral. Caption-ul explică perioada; fără bază precedentă pozitivă nu se afișează procent.
- Calendar explicit `Europe/Bucharest`, intervale cu sfârșit exclusiv, inclusiv schimbarea anului/DST. Sunt citite ultimele șase luni; cinci sunt selectabile, a șasea susține comparația celei mai vechi luni selectabile.
- Ziua devizului provine din `data_deviz` text ISO, format confirmat la auditul anterior din această conversație; nu este timestamp de creare. Un format non-ISO introdus ulterior poate fi exclus de filtrul text și necesită un contract separat de date.
- Fișele active, stocul, cererile neplătite și atenționările sunt situația curentă, independente de luna selectată. Nu există indicator de profit, creanțe reale sau sănătate a capacității atelierului fără date care să le susțină.

## Integrarea plăților existente

S-a inspectat `modules/devize/plati.html` înainte de implementare. Utilizatorul creează în `plati_manager` câmpurile `beneficiar`, `iban`, `suma`, `motiv`, `status='neplatit'`, `creat_de`. Pagina citește aceeași înregistrare și afișează statusul; nu are sincronizare realtime pentru acest flux.

Managerul păstrează mecanismul existent: UPDATE al cererii originale cu `status='platit'`, `data_platii` și `platit_de` din identitatea verificată. Condiția include ID-ul și `status='neplatit'`. Nu se inserează o plată nouă, nu se modifică suma/beneficiarul/IBAN-ul/motivul și nu se execută transfer bancar. Eticheta cere confirmarea numai după efectuarea transferului în bancă.

Acțiunea funcționează în rezumat și în tabul dedicat. Se blochează dublul click pentru același ID, refresh-ul nu rulează simultan cu acțiunile de plată, iar profilul este revalidat înainte de UPDATE. Succesul este afișat numai după returnarea rândului cu status `platit`; statusul primit actualizează local toate vederile de plată și atenționările, fără recitirea tuturor surselor sau rerandarea graficului. Un răspuns gol/conflict/eroare/timeout produce mesaj vizibil și nu confirmă plata local. Dacă salvarea nu a fost confirmată, utilizatorul trebuie să actualizeze înainte de a reîncerca.

Pagina utilizatorului va vedea `platit` la următoarea sa citire și nu va mai afișa acțiunea de ștergere conform logicii ei existente. Acea pagină nu a fost modificată. Nu s-a adăugat un al doilea sistem de statusuri.

Click pe IBAN copiază direct prin `navigator.clipboard.writeText`; dacă lipsește/eșuează, se încearcă un textarea temporar și `execCommand('copy')`. Confirmarea discretă apare numai la succes. Fallback-ul poate fi refuzat de browser; atunci se afișează mesaj pentru copiere manuală, fără confirmare falsă.

## Surse, atenționări și performanță

Se refolosește exclusiv clientul `js/config.js` și timeout-ul comun `js/session-timeout.js?v=2`, fără schimbarea lor. Pagina permite Admin, Manager sau permisiunea explicită `manager_dashboard`; Detailing și Comenzi SH respectă în plus permisiunile proprii modulelor, conform politicilor inspectate anterior. Controlul de pagină nu remediază RLS/granturile existente.

După profil, zece surse pornesc paralel: `deviz_final_header`, `evidente_avansuri_plati`, `constatari`, `detailing`, `evidenta_awb`, `stoc_view_curent`, `comenzi_piese_sh`, `plati_manager`, `constatari_asteptare_piese`, `generator_logs`. Se selectează coloane explicite, se filtrează fereastra/înregistrările active și se folosește paginare de 500, maximum 5.000 rânduri/sursă, timeout 15 secunde. Depășirea plafonului sau o citire incompletă invalidează sursa; nu se raportează totaluri parțiale ca exacte. Paginarea unei surse poate necesita requesturi secvențiale, dar sursele independente rămân paralele.

Plățile sunt încărcate o singură dată: toate `neplatit`, indiferent de vechime, plus `platit` cu `data_platii` în fereastra de șase luni. Plățile vechi sau fără data plății nu apar în lista recentă; sursa originală Cereri de plată păstrează istoricul. Nu există polling business; selectorul lunar lucrează în memorie. Căutarea globală HUB citește separat numai sursele permise, la cerere, conform secțiunii de integrare de mai jos. Ceasul actualizează numai text local. Timeout-ul comun face propriile verificări de identitate/rol.

Reguli de atenție: status `Asteptare piese`, marcaj urgent pe fișe active, SH `nepotrivita`, cereri neplătite și stoc. Stocurile NULL, goale, nenumerice, negative și pragurile invalide sunt avertizări explicite; nu sunt convertite în zero. Produsele valide cu stoc ≤ prag sunt raportate separat. Badge-ul numără categorii de atenționări, nu probleme unice. Lipsa surselor produce marcaj parțial.

Generatorul păstrează orele/pornirile și alimentările reale; combustibilul este numit „alimentat”, nu consum măsurat. Statusul pornit/oprit este cel al ultimei citiri. Datele Fleet fictive și pragul hardcodat de mentenanță nu sunt reproduse drept alerte reale. Datele incomplete/invalide din Generator produc valori și status indisponibile, nu zero sau „oprit” fictiv; alimentarea fără litri nu este tratată ca zero. Volumele departamentale sunt număr de fișe create/programate, nu vehicule unice. Valorile AWB sunt valori declarate, fără etichetă de încasări.

## Validare și verificare manuală

Au trecut sintaxa JavaScript, 21 probe de logică (calendar, formule, stoc, plăți, Generator, paginare/erori/acces) și 15 scenarii în Chrome cu date/transport controlate: QHD 2560×1440, desktop, tabletă, telefon, date goale, erori, valori invalide, Admin/Manager/permisiune explicită/refuz, clipboard cu fallback/eșec, plată cu dublu click/eroare/conflict. Testele confirmă payload-ul și filtrul UPDATE, sincronizarea vederilor, lipsa requesturilor suplimentare la schimbarea lunii și textul sigur în DOM. Testele/screenshoturile sunt în directorul temporar al conversației, în afara LAB; nu există mock-uri în implementarea finală.

În testele agentului nu s-a rulat UPDATE real în Supabase și nu s-au folosit sesiuni reale în browser. Ulterior, utilizatorul a raportat testare manuală pozitivă în LAB, inclusiv pe alți utilizatori. Lista de mai jos se păstrează pentru regresii și pentru viitorul deploy; nu reprezintă o afirmație că toate cazurile au rămas netestate. Acoperirea individuală a cazurilor speciale nu a fost raportată:

1. Admin/Manager intră; un profil fără acces este refuzat. Modulele fără permisiune proprie arată lipsa accesului.
2. Reconciliază valoarea devizelor, numărul, media, avansurile și perioadele cu datele sursă.
3. Creează o cerere prin pagina utilizatorului; actualizează Managerul și verifică beneficiarul, IBAN-ul, suma, motivul și data.
4. Copiază IBAN-ul din rezumat și din tabul Plăți; verifică textul copiat și feedback-ul, inclusiv în browserul/PWA folosit efectiv.
5. Pe o cerere de test autorizată, marchează plătit; verifică mutarea în lista recentă, scăderea totalului în așteptare și statusul `platit` în pagina utilizatorului după reload. Dublul click nu trebuie să salveze de două ori.
6. Verifică eșecul de rețea și cererea deja schimbată/ștearsă: fără confirmare falsă și cu posibilitate de actualizare.
7. Verifică fișele active, intervalele necunoscute, coletele, stocul invalid/sub prag și Generatorul. Nu interpreta lipsa sursei ca zero.
8. Verifică QHD, tabletă, taburi cu tastatura, căutare și derularea tabelelor. Pagina nu trebuie să aibă overflow orizontal.

## Copiere în producție numai după aprobare

> **Domeniul listei — reconciliere 22.10.2026:** cele patru fișiere de mai jos reprezintă baza Manager + integrarea HUB din 16.10, nu pachetul complet al versiunii LAB cu ciorne. [19](19_MANAGER_V2_FISIERE_DEPLOY.md) arată șase fișiere pentru Manager + intrarea locală; [20 Ciorne](20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md) inventariază opt fișiere modificate pentru funcția completă, presupunând CSS Manager existent. Reuniunea Manager + ciorne are nouă fișiere runtime, cu reconciliere punctuală a loginului. [23](23_INVENTAR_TRANSFER_PRODUCTIE.md) este inventarul comparativ actual de 29 de diferențe față de HEAD-ul LAB, nu o listă de copiere sau dovadă de publicare.

Nu este necesară nicio modificare de schemă Supabase, RPC, RLS sau granturi pentru acest redesign. Pagina utilizatorului și configurația comună rămân cele existente. Verifică totuși accesul real la surse înainte de deploy.

Înlocuiește împreună, preferabil atomic, după păstrarea unei copii pentru rollback:

- `modules/manager/manager.css`
- `modules/manager/manager.js`
- `modules/manager/manager.html`
- `index.html` — integrarea și motorul comun, numai după Manager JS

Dacă livrarea nu este atomică, efectueaz-o într-o fereastră controlată: vechiul HTML și noul JS au structuri diferite și nu trebuie servite ca versiuni amestecate. Documentația se păstrează intern, nu este fișier necesar în rădăcina web. Indexul intră explicit în livrarea actuală; nu copia prototipul V2, alte modificări LAB sau SQL-uri preexistente. Modificările preexistente ale indexului se revizuiesc separat înainte de livrare.


## Integrare și finisare — 16.10.2026

### HUB, buton Înapoi și stoc

Cele trei intrări Manager din `index.html` — redirecționarea rolului Manager, navigarea și cardul — folosesc aceeași constantă `MANAGER_DASHBOARD_URL`, cu ruta `modules/manager/manager.html`. Această rută găzduiește deja redesignul; nu se creează o pagină nouă și nu se redirecționează spre vechiul prototip separat.

Butonul Înapoi este primul element al antetului, în stânga. Au fost preluate din `avans.html` valorile de stil: text uppercase 12px/700, tracking .05em, gap 8px, culorile #98a0ad/#f1f2f4 și săgeata Lucide arrow-left 20px. Nu s-a introdus Tailwind în Manager. Ruta relativă este `../../index.html?hub=1`: `hub=1` păstrează revenirea în HUB fără bucla de redirecționare a rolului Manager.

Avertizarea globală de stoc a fost eliminată, inclusiv pentru citirea indisponibilă a stocului. Informația apare în „Necesită atenție”, cu număr/descriere și link discret spre Consumabile. Tabelul operațional de excepții rămâne disponibil. Celelalte erori de surse își păstrează tratamentul existent.

Managerul v1 original din HEAD-ul LAB a fost conservat într-o arhivă separată `manager-v1-original-LAB.zip`, livrată în outputs conversației. Arhiva este istorică, include codul original și nu se publică web sau în producție. Cele trei fișiere `manager-v2.*` au fost ulterior șterse din LAB ca prototipuri obsolete, fără referințe runtime. Arhiva v1 este distinctă de prototipuri și de versiunea activă.

### Un singur motor de căutare globală

Logica funcțională din index a fost extrasă în `HubGlobalSearch`, definit în fișierul autorizat `modules/manager/manager.js`, fără alt fișier runtime. Managerul și indexul folosesc aceeași implementare. Indexul îl încarcă prin `data-hub-search-only`; acest mod nu inițializează interfața sau query-urile dashboardului Manager.

| Grup | Tabel/view | Permisiune | Căutare / asociere și destinație |
|---|---|---|---|
| Clienți & Notificări | `clienti` | `clienti_notificari` | Nume/cod parțial → `modules/devize/clienti-notificari.html` |
| Vehicule clienți | `clienti_vehicule` | `clienti_notificari` | Număr, marcă/model, VIN sau `client_id` găsit → aceeași pagină C&N |
| Constatări | `constatari` | `constatari` | Număr/model/client sau ID client/vehicul → fișa prin `constatare_id` |
| Detailing | `detailing` | `detailing`, fallback existent `constatari` | Număr/auto/pachet/telefon sau număr asociat → pagina Detailing |
| Devize estimative | `devize` | `deviz_estimativ`, fallback `devize` | ID/auto/număr sau număr asociat → document prin `id` |
| Devize finale | `deviz_final_header` | `deviz_final`, fallback `devize` | Auto/client/VIN/număr/DF-ID sau `vehicle_id` → document prin `id` |
| Avansuri | `evidente_avansuri` | `avansuri`, fallback `devize` | Model/număr/detalii sau `vehicle_id` → Evidență Avansuri |
| Flotă Auto | `flota_auto` | `lista_masini`, fallback `flota` | Număr/VIN/marcă → Lista mașini |
| Stoc Consumabile | `stoc_view_curent` | `consumabile`, fallback `magazie` | Denumire/cod articol → Consumabile |
| AWB | `evidenta_awb` | `awb`, fallback `magazie` | AWB/client/piesă/curier; numele clientului găsit este indiciu textual → Evidență AWB |
| Comenzi SH | `comenzi_piese_sh` | `comenzi_piese_sh` | Piesă/cod/număr sau număr asociat → Comenzi Piese SH |
| Cereri de plată | `plati_manager` | `plati`, inclusiv rol Manager conform HUB | Beneficiar/IBAN/motiv → pagina Cereri de plată |

Se păstrează Admin, refuzul explicit al unei permisiuni și fallback-urile originale HUB. Nu se citesc C&N sau relațiile sale fără permisiune. Fallback-ul de navigare nu extinde politicile RLS reale; o categorie refuzată de bază este raportată indisponibilă.

Debounce: 350 ms. Maximum 8 rânduri/categorie, fără limitarea la cele șase luni ale KPI-urilor. C&N folosește cel mult un SELECT de clienți și unul de vehicule; toate celelalte categorii refolosesc rezultatele acestor relații, fără N+1. Sursele independente rulează paralel. Se păstrează pattern-urile `ilike`, înmatricularea compactă și ID-urile DF; ID-urile numerice nu sunt filtrate cu `ilike`.

Un termen identic reutilizează cererea în curs sau ultimul rezultat reușit. Nu se păstrează cache pe disc. Schimbarea termenului anulează cererile vechi; generația și termenul sunt reverificate înainte de randare. ESC, golirea câmpului și închiderea listei invalidează răspunsurile în curs. Erorile sunt izolate pe categorie, cu timeout de 10 secunde. Sursele cu erori nu sunt memorate ca rezultat valid. Refresh-ul Managerului invalidează și căutarea. Focalizarea unui rezultat deja afișat îl reutilizează; pentru date noi se reeditează termenul sau se actualizează pagina.

Rezultatele sunt grupate, cu sursă/context și linkuri native. C&N, Detailing, AWB, stoc, flotă, avansuri și SH se deschid în pagina lor existentă; acele module nu oferă toate selecție directă prin URL și nu au fost modificate. Devizele și Constatările folosesc parametrii real suportați. Asocierea prin număr/nume este textuală, nu o cheie străină garantată; doar `client_id`/`vehicle_id` reprezintă relații structurale.

### Audit semantic al tuturor valorilor financiare afișate

| Valoare | Sursă / formulă | Reprezintă | Nu reprezintă |
|---|---|---|---|
| Valoare devize, comparație, grafic și rezultat global DF | `deviz_final_header`, `SUM(Number(total_manopera || 0) + Number(total_piese || 0))`; în căutare un singur document | Valoarea integrală înainte de avans, pe data documentului | Încasări, venit contabil, profit, creanță reală |
| Număr și medie/deviz | Număr antete; valoare integrală / număr | Documente și media lor; fără documente media este `—` | Vehicule unice sau productivitate/capacitate |
| Manoperă / piese | Suma componentelor din antet; piesele după discount | Componente ale valorii devizelor | Costuri, marjă, profit |
| Avansuri încasate în perioadă / azi / tabel lunar | `evidente_avansuri_plati.suma`, după `data_platii` în ziua românească | Plăți de avans înregistrate | Toate încasările, valoare suplimentară peste deviz |
| Plăți de efectuat în KPI, rezumat și tab | `SUM(plati_manager.suma)` unde `status='neplatit'` | Cereri de ieșire încă nemarcate plătit | Datorii scadente, transfer executat automat |
| Plăți marcate în luna analizată și recente | Aceeași sumă, `status='platit'`, după `data_platii` | Cereri marcate manual plătite; data salvării marcării | Dovadă de decontare bancară sau data verificată a transferului |
| Valoare AWB în tabel | `evidenta_awb.pret`, per colet | Valoare declarată în modul | Ramburs decontat, încasare sau profit |

Nu se adună avansurile la devize. Schema nu stabilește aici un contract fiscal TVA/net/brut; nu se inventează unul. La schimbarea zilei, „Avansuri azi” devine „actualizare necesară”, fără request automat și fără prezentarea sumei zilei precedente drept sumă pentru azi.

Verificarea live READ-ONLY a confirmat 187 devize, fără componente lipsă sau date non-ISO, 52 plăți de avans fără sumă/dată lipsă și 3 cereri manager fără sumă lipsă. Pentru `circu`: un client C&N, un vehicul asociat și trei devize finale relevante. Nu s-au exportat local rânduri reale și nu s-au modificat date. În Managerul activ nu au fost găsite mock-uri/Fleet demo; riscul de zero artificial în Generator a fost corectat.

Probele de integrare folosesc transport controlat, inclusiv indexul real, rezultate pe mai multe tipuri, `circu`, link DF, revenirea HUB, reutilizarea focusului, răspunsuri întârziate/ESC și permisiuni. Acestea completează SELECT-urile reale; ulterior, utilizatorul a raportat testarea manuală generală pozitivă inclusiv pe alți utilizatori. Nu se atribuie acestui raport o matrice exhaustivă pe roluri sau erori. Nu s-a făcut commit sau deploy de către agent.

Validarea finală de integrare: 16 scenarii în browser trecute (inclusiv indexul real și navigarea efectivă spre DF într-un tab nou), 21 probe de logică și probele motorului comun pentru 12 surse, asocieri, permisiuni, cache/deduplicare, abort/stale și erori. Resursele Manager au aceeași versiune URL `v=20261016-hub` în pagină și în index, pentru a evita reutilizarea scriptului anterior la integrare.


## Casetă Dezmembrări — 16.10.2026

În vederea principală, lângă „Necesită atenție”, caseta Dezmembrări evidențiază numărul înregistrărilor **De completat**. Eticheta este `draft` în `public.dezmembrari_items`, conform `statusLabels` din `js/dezmembrari.js` și filtrelor reale ale modulului. Informația secundară este **Gata de publicare** (`ready`), utilă pentru următoarea acțiune în flux. Nu se adaugă valoare financiară, total vândut sau alte contoare fără rol în decizie.

Celelalte etichete confirmate sunt `published` → Publicat, `sold` → Vândut și `archived` → Arhivat; nu sunt incluse în valoarea De completat. Numără articole de orice tip, nu vehicule unice. Situația este curentă și independentă de luna selectată. SELECT-ul READ-ONLY de audit a confirmat la verificare 37 `draft`, 13 `ready` și 52 `published`; aceste numere sunt dovezi ale auditului, nu constante în aplicație.

Încărcarea folosește două COUNT-uri exacte fără rânduri (`select('id', {count:'exact', head:true}).eq('status', ...)`), unul pentru `draft` și unul pentru `ready`, în paralel între ele și cu celelalte surse Manager. Nu se descarcă fotografii, descrieri sau lista articolelor, nu există N+1, polling sau cereri repetate la schimbarea lunii. Timeout comun 15 secunde. Zero este afișat numai pentru un count valid; eroarea, count-ul lipsă și refuzul accesului afișează `—` și explicație în casetă, fără fallback demo sau reutilizare de valori vechi.

Politica SELECT reală permite gestiune completă prin `can_manage_dezmembrari()` (Admin sau `permissions.dezmembrari_manage=true`); captura simplă permite numai articolele proprii. Caseta cere acces la gestiunea completă. Rolul Manager singur, permisiunea istorică `dezmembrari` sau doar `dezmembrari_capture` nu sunt suficiente: se afișează lipsa accesului, fără query și fără total parțial prezentat drept total global. Politicile au fost doar citite; nu s-a modificat Supabase.

Pentru acces autorizat, caseta deschide `modules/stocuri/dezmembrari.html`. Nu este adăugat un parametru de filtrare inexistent; filtrul De completat poate fi ales în modul. La backlog pozitiv, cifra și bordura au accent amber; la zero nu apare bordura de avertizare. Caseta este compactă și responsive, fără grafic decorativ.

Verificări: statusuri reale și politici prin SELECT, probe locale pentru cele două HEAD COUNT, Admin/gestiune/captură simplă, zero valid, eroare și count lipsă; browser pe layouturile existente și regresiile de navigare/căutare/plată. Sesiunile browser ale agentului sunt controlate; ulterior, testarea manuală generală a fost raportată pozitiv de utilizator, inclusiv pe alți utilizatori. Nu a fost furnizată o listă separată a scenariilor Dezmembrări executate. Nu s-a făcut commit sau deploy de către agent.
