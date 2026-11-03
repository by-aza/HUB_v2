# Riscuri și zone sensibile

## Riscuri REALE după activare — 21.10.2026

Nu mai există tabel public cu RLS OFF: 36/36 ON în producție și LAB. Riscul vechi „19 tabele publice fără RLS” nu mai este starea actuală. Politicile publice și ACL-urile sunt aliniate, însă există următoarele restanțe:

| Observație confirmată read-only | Limită / prioritate |
|---|---|
| TRUNCATE efectiv pentru anon și authenticated pe 16 tabele | Restanță esențială de privilegii; RLS nu filtrează TRUNCATE. Nu s-a executat operația și nu se afirmă că este rută REST directă. |
| generator_logs: ALL public true | Acces CRUD public în condițiile GRANT-urilor actuale; bifa generator nu este impusă de politica DB. |
| todo_tasks: CRUD authenticated true | Nu respectă regula documentată Admin-only; fără a confunda activarea RLS cu restrângerea politicilor. |
| Storage documente_contracte în producție: bucket public și politici S/I/U/D public | Contracte RLS nu protejează fișierele; LAB nu are bucket/politici echivalente. |
| auth_profiles/auth_roles: SELECT anonim | Excepție de compatibilitate pentru loginul neschimbat; scrierea este deja Admin-only. Nu se declară confidențialitate completă a profilurilor. |
| Cron/Edge/Apps Script și frontend publicat | Nu au fost rulate teste funcționale noi aici. Sursa Google rămâne inaccesibilă; versiunile frontend țintă nu sunt comparate live. |

Excepțiile VIEW invoker, registru privat cu SELECT pe două coloane și obiecte administrate de platformă nu sunt tratate ca lipsuri ale lotului public. service_role are BYPASSRLS pentru backend; nu este cheie de browser.

Advisorii au și avertismente preexistente (handle_new_user/search_path, funcții SECURITY DEFINER apelabile, extensie în public și setare Auth); nu s-au modificat aceste obiecte și nu se propune reluarea AUTH avansat.

Prioritatea limitată este reconcilierea privilegiilor/politicilor/bucketului menționate dacă este cerută separat. Nu este nevoie de infrastructură nouă sau autentificare suplimentară. Lista celor 16 tabele și proveniența sunt în [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Context istoric și detalii de implementare

Secțiunile de mai jos păstrează auditul și actualizările datate. Inventarele, numerele și formulările „actual/live” rămase în acest context nu sunt o nouă verificare a LAB sau a producției; stadiul documentat la 21.10.2026 este cel precizat mai sus.

## 1. Scala folosită

- **Critic:** poate permite acces neautorizat, pierdere/alterare largă de date sau compromiterea unui serviciu privilegiat.
- **Ridicat:** afectează date importante, mai multe module sau disponibilitatea operațională.
- **Mediu:** crește probabilitatea defectelor, a inconsistenței sau a costului de mentenanță.
- **Scăzut:** problemă locală sau de curățenie, fără impact imediat major.

Acest document inventariază riscuri; nu schimbă producția și nu prescrie activarea directă a RLS fără analiză și testare.

## 2. Registru de riscuri

> **Registru istoric, nu inventar live nou.** R01 și componentele „fără RLS” din R04/R07/R09/R10 sunt depășite de activarea celor 36 de tabele; R05 descrie vechiul VIEW, acum `security_invoker=true`. R08 este inventarul migrărilor de la data auditului, nu numărătoare actuală. Riscurile de citire a profilurilor, integritatea/acoperirea auditului, politicile permisive Generator/TODO, TRUNCATE și Storage nu sunt declarate rezolvate de aceste corecturi. Pentru starea documentată și diferențele LAB/producție prevalează [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

| ID | Severitate | Zonă | Dovadă confirmată | Impact posibil |
|---|---|---|---|---|
| R01 | Critic | RLS | 19 tabele publice au RLS dezactivat și granturi API largi | citire/scriere în afara permisiunilor UI; expunere financiară, personală și operațională |
| R02 | Critic | Storage Contracte | bucket public cu politici publice S/I/U/D, fără limite MIME/mărime | acces, înlocuire sau ștergere de documente; upload necontrolat |
| R03 | Critic | Edge Alerte | `trimite-alerte` are `verify_jwt=false` și folosește service role | invocare abuzivă, spam, consum de resurse și acces privilegiat indirect |
| R04 | Ridicat | Profiluri | `auth_profiles` fără RLS; loginul caută porecla înainte de autentificare | enumerare de profiluri/email și ocolirea modelului de permisiuni la acces direct |
| R05 | Ridicat | View stoc | advisor: `stoc_view_curent` este Security Definer | view-ul poate expune date cu drepturile creatorului |
| R06 | Ridicat | Funcții SQL | funcții Security Definer executabile de roluri largi; `handle_new_user` cu search_path mutabil | suprafață de escaladare sau comportament neașteptat dacă funcțiile evoluează |
| R07 | Ridicat | Audit | `audit_logs` fără RLS; inserare directă din browser; acoperire neuniformă | jurnal alterabil/incomplet, nepotrivit ca dovadă de conformitate |
| R08 | Ridicat | Migrații | LAB are doar migrarea veche versionată și două fișiere noi neversionate; schema live a evoluat | reproducere/recuperare dificilă și drift între copii |
| R09 | Ridicat | Config alerte | `config_alerte` și `flota_auto` sunt consumate de o funcție cu service role; primul nu are RLS | alerte incorecte, destinatari greșiți, expunere de date flotă |
| R10 | Ridicat | Control acces | matricea UI nu este egală cu RLS; unele tabele nu au RLS | buton ascuns fără protecție server-side |
| R11 | Mediu | Clienți & Notificări | card DEMO, logică live și logică in-memory în același modul | utilizatorii pot confunda datele persistente cu starea locală |
| R12 | REZOLVATĂ în LAB, 16.10.2026 | Manager | versiunea finală folosește date reale, fără mock/demo data; definițiile KPI sunt documentate | nu mai există constatarea veche despre valori demonstrative; limitele semantice și accesul la date rămân explicite |
| R13 | Mediu | Realtime | cod de abonare prezent, dar publicația nu conține tabele | interfețe care par live pot rămâne stale; comportament diferit între pagini |
| R14 | Mediu | Sesiune | timeoutul nu este inclus uniform; Admin este exceptat | sesiuni lungi pe pagini neacoperite și politică inconsistentă |
| R15 | Mediu | Config frontend | URL/cheie Supabase duplicate în mai multe pagini | configurare divergentă, rotație/deploy incomplet |
| R16 | Mediu | CDN | Tailwind/Lucide/Flatpickr și alte resurse nefixate | schimbări upstream sau indisponibilitate pot rupe UI fără schimbare locală |
| R17 | Mediu | Cod monolitic | fișiere HTML/JS foarte mari, logică și DOM amestecate | regresii laterale și cost mare de review/testare |
| R18 | Mediu | Validare date | statusuri și contracte de coloane repetate ca stringuri | divergență între pagini și schema DB |
| R19 | Mediu | Date personale | telefoane, clienți, VIN, IBAN și documente sunt accesate direct din browser | impact sporit al oricărei politici greșite sau sesiuni compromise |
| R20 | Mediu | Funcția utilizator nou | rol implicit 3, comentat ca Mecanic, dar 3 este Birou | alocare greșită de rol dacă operatorii se bazează pe comentariu |
| R21 | Mediu | Generator | RLS activ, dar politică publică `ALL true` | orice rol expus de grant poate opera datele, indiferent de permisiunea UI |
| R22 | Ridicat | TODO | businessul confirmă că `todo_tasks` este personal Admin-only, dar toți utilizatorii autentificați au CRUD | sarcini personale ale administratorului sunt vizibile și modificabile neautorizat |
| R23 | Mediu | Piese stoc | CSV public Google Sheets și cache local | sursă externă poate fi indisponibilă sau modificată; date pot rămâne vechi |
| R24 | Mediu | Edge/obiecte | trei sisteme pentru metadate și obiecte foto: DB, R2, Drive | obiecte orfane sau metadate nealiniate la eșec parțial |
| R25 | Mediu | Parole | protecția împotriva parolelor compromise este dezactivată | conturi mai vulnerabile la reutilizarea parolelor cunoscute |
| R26 | Mediu | Performanță DB | 22 FK fără index și politici RLS cu apeluri neoptimizate | degradare pe măsura creșterii datelor |
| R27 | Scăzut | Indecși | 15 indecși raportați nefolosiți | cost de scriere/spațiu; semnalul trebuie măsurat înainte de ștergere |
| R28 | Scăzut | Fișiere istorice | `.orig`, `Untitled`, placeholder și documentație veche | confuzie asupra sursei active și risc de editare a fișierului greșit |
| R29 | Scăzut | HTML | placeholder-ele Stoc includ marcaj `</script>` fără pereche | erori de parsare sau dificultate de mentenanță locală |
| R30 | Scăzut | PWA | manifeste fără service worker identificat | așteptări greșite privind funcționarea offline |

## 3. Zone de date cu impact ridicat

### 3.1 Date cu caracter personal

`clienti`, contacte, telefoane, vehicule/VIN, contracte și profiluri conțin date personale. Accesul direct browser → Supabase amplifică importanța RLS. Documentația nu confirmă o politică de retenție, anonimizare sau export al datelor.

### 3.2 Date financiare

Devize, avansuri, plăți, IBAN-uri, prețuri, reduceri și stoc sunt distribuite în tabele cu modele de protecție diferite. În special `plati_manager`, `evidente_avansuri*`, `deviz_final_*`, `devize` și stocurile nu au RLS.

### 3.3 Documente și fotografii

Contractele folosesc obiecte publice, în timp ce Dezmembrările folosesc obiecte private și URL-uri semnate. Cele două modele de securitate sunt foarte diferite și nu trebuie confundate.

## 4. Zone de integritate

- `constatari` păstrează snapshoturi textuale și FK spre client/vehicul; sincronizarea ulterioară nu este uniform definită;
- devizul estimativ păstrează piese în JSONB, devizul final normalizează liniile;
- `piese_stoc` și inventarul Supabase sunt surse separate;
- statusurile textuale pot fi modificate din mai multe pagini;
- ștergerile administrative pot rupe istoricul operațional dacă relațiile au `SET NULL` sau lipsesc;
- `localStorage` pentru print poate conține temporar date sensibile și nu este curățat/expirat printr-un mecanism central confirmat.

## 5. Zone de disponibilitate

- aplicația depinde de CDN-uri la fiecare încărcare;
- modulul Dezmembrări depinde de Supabase, R2/Drive și OCR.Space;
- alertele depind de cron, Edge și Google Apps Script;
- Piese stoc depinde de un Google Sheet public;
- nu există un build local care să includă dependențele critice;
- nu a fost găsită o suită automată de teste sau un monitor de sănătate end-to-end.

## 6. Zone de mentenanță

- logica mare inline în HTML este greu de testat izolat;
- inițializarea Supabase, auth și permisiunile sunt duplicate;
- folderul de referință conține stări istorice care pot contrazice codul actual;
- schema remote nu este complet reprezentată de migrările locale;
- două interfețe admin gestionează utilizatori;
- fallback-urile de permisiune păstrează compatibilitate, dar fac modelul dificil de explicat și auditat.

## 7. Ce nu trebuie făcut direct în producție

- activarea simultană a RLS pe toate cele 19 tabele fără inventarierea operațiilor pe rol;
- gruparea mai multor tabele într-o migrare RLS masivă; rolloutul aprobat este incremental, tabel cu tabel, fiecare cu teste și rollback propriu;
- eliminarea granturilor înainte de politici și teste;
- convertirea bucket-ului Contracte la privat fără adaptarea URL-urilor și a fluxului de afișare;
- ștergerea indecșilor doar pentru că advisorul îi numește nefolosiți;
- schimbarea ID-urilor rolurilor;
- mutarea statusurilor sau redenumirea coloanelor fără o hartă completă a consumatorilor;
- înlocuirea funcției Edge active fără versionare și test de rollback.

## 8. Necunoscute care cer validare ulterioară

- lista reală a utilizatorilor care au nevoie de fiecare permisiune;
- politica de retenție pentru audit, documente și notificări;
- proprietarul operațional al Google Sheet și Apps Script;
- dacă endpointul `trimite-alerte` este protejat extern;
- frecvența și volumul real al interogărilor;
- orice indicator Manager suplimentar față de contractul documentat în `18_MANAGER_DASHBOARD_REDESIGN.md`;
- obiectele orfane existente în R2/Drive/Storage;
- datele demo rămase în tabelele de producție.

Nu mai sunt necunoscute: administrarea utilizatorilor/rolurilor/permisiunilor și `todo_tasks` sunt exclusiv Admin; Mecanic, Electrician și Tinichigiu nu folosesc momentan HUB-ul și nu necesită politici dedicate în etapa curentă; RLS se implementează incremental, tabel cu tabel.

## 9. Riscuri suplimentare după integrarea avansurilor — 15.10.2026

- **R31 — Ridicat, securitate:** RPC-urile au controale, dar RLS OFF și granturile largi ale tabelelor `deviz_final_*`/`evidente_avansuri*` permit în continuare acces direct. Constrângerea unică apără doar dublarea unui `avans_id`, nu toate mutațiile neautorizate.
- **R32 — REZOLVATĂ în LAB, 16.10.2026:** Manager agregă acum `total_manopera + total_piese` pentru valoarea integrală a devizelor, comparația lunară și seria din grafic; `total_general` rămâne restul după avans în Deviz final. Validarea locală a trecut; utilizatorul a raportat testare manuală pozitivă în LAB, inclusiv pe alți utilizatori. Deploy-ul noului Manager în producție nu este confirmat. Avansurile rămân raportate separat după data plății și nu se adună la valoarea integrală a devizelor. Vezi `17_MODIFICARI_AVANSURI_2026-10-14_15.md`.
- **R33 — Mediu, istoric:** avansurile anterioare triggerului sunt nerevizuite până la reconciliere; liniile negative vechi nu se migrează automat. Pentru DF-199/200 conversia este verificată live; auditul celorlalte rămâne deschis.
- **R34 — Mediu, versiuni/livrare:** baza, checkout-ul principal și fișierele de lucru LAB au fluxul nou; în LAB paginile sunt încă modificări necomise față de HEAD-ul vechi. Deploy-ul în producție al paginilor noi a fost confirmat de utilizator prin pagina și printul live; riscul rămas aici este trasabilitatea versiunii locale LAB față de HEAD.
- **R35 — Mediu, consistență financiară:** o plată ulterioară nu actualizează devizul fără salvare explicită; un eșec/deadlock în RPC trebuie tratat ca eroare cu rollback complet, iar scenariile concurente reale cer testare.

Datele AV-55 păstrează în DB data 14.10.2026, diferită de data plății reale 26.09.2026 comunicată de utilizator; corecția datelor este restantă și nu se face prin această documentație.

## Actualizare 16.10.2026 — limitele Managerului integrat

La 16.10.2026, utilizatorul a raportat testarea manuală a noului Manager în LAB, inclusiv pe alți utilizatori, cu rezultat pozitiv („pare funcțional”). Aceasta este confirmarea utilizatorului, nu o nouă testare independentă în această actualizare; nu stabilește rezultatul individual al fiecărui scenariu de eroare și nu confirmă deploy-ul în producție.

- Valoarea devizelor nu dovedește încasări, venit contabil sau profit; restul salvat după avans nu este o creanță reconciliată cu plățile finale. Avansurile nu se adună peste valoarea devizelor.
- Marcarea `plati_manager` ca `platit` este o confirmare manuală, nu un transfer bancar; pagina utilizatorului afișează același status la următoarea citire, fără sincronizare realtime proprie acestui flux.
- Count-urile Dezmembrări necesită Admin/`dezmembrari_manage`; accesul doar la captură nu permite prezentarea unui total global. Lipsa accesului/sursei nu înseamnă zero.
- Livrarea trebuie să păstreze compatibile cele trei fișiere Manager și `index.html`, care încarcă motorul comun de căutare. Nu este confirmată încă livrarea acestui Manager în producție.
- RLS/granturile și celelalte riscuri istorice nu sunt remediate implicit de redesign sau de testarea manuală pozitivă.
