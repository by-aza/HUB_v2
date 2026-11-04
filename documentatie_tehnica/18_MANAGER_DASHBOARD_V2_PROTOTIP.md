# Manager Dashboard V2 — arhivă documentară a prototipului obsolete

Data: 16.10.2026. Rădăcina inspectată: `/home/aza/HUB AUTO/HUB_v2-LAB`.
**Status actual, 16.10.2026: OBSOLETE.** Cele trei fișiere ale prototipului au fost șterse din LAB după verificarea lipsei referințelor runtime. Acest document păstrează exclusiv fotografia istorică a etapei de prototip; cifrele, testele și limitele de mai jos nu sunt starea curentă sau instrucțiuni de deploy. Noul Manager este activ în `modules/manager/manager.html`, cu `modules/manager/manager.css` și `modules/manager/manager.js`, deschis din `index.html`. Starea actuală și lista finală sunt în `18_MANAGER_DASHBOARD_REDESIGN.md` și `19_MANAGER_V2_FISIERE_DEPLOY.md`. Testarea manuală a versiunii integrate a fost raportată pozitiv de utilizator, inclusiv pe alți utilizatori; deploy-ul în producție nu este confirmat.

## 1. Concept și acces

Cockpit executiv cu cinci zone: Sinteză, Azi, Evoluție, Operațional și Necesită atenție. Valoarea lucrărilor este indicatorul principal; plățile de avans au card separat. Un singur grafic arată compoziția manoperă/piese pe șase luni. Tabelul detaliat păstrează valorile exacte și avansurile într-o coloană separată. Tema dark folosește antracit, turcoaz și albastru compatibile cu HUB, fără a reproduce structura vizuală a vechiului Manager.

În etapa istorică, pagina prototipului se deschidea direct la `/modules/manager/manager-v2.html`; această rută nu mai este disponibilă în LAB și nu trebuie folosită. Următoarea descriere a accesului aparține prototipului: Accesul este permis profilurilor Admin (`rol_id=1`), Manager (`rol_id=2`) sau celor cu `permissions.manager_dashboard === true`, conform convenției actuale. Lipsa sesiunii redirecționează spre `/modules/admin/login.html`; profilul lipsă, neautorizat sau imposibil de verificat blochează dashboardul. Profilul este recitit la fiecare actualizare manuală.

Se refolosesc clientul din `js/config.js` și `js/session-timeout.js?v=2`. Scriptul de timeout este încărcat după identificarea clientului; el face propriile verificări de identitate/rol. Nu este modificat. Nu există service-role în prototip și nu sunt create RPC-uri, politici, tabele sau migrări.

## 2. Audit READ-ONLY al surselor reale

Schema, agregările, statusurile, rolurile și politicile au fost inspectate prin SELECT în proiectul `HUB_Service_Auto`, ref `xyovkxmtbvgcwavuyxxu`, la 16.10.2026. Numerele de mai jos sunt probe de audit, nu constante utilizate de dashboard.

| Sursă | Confirmare și decizie |
|---|---|
| `deviz_final_header` | 187 documente; toate datele sunt text ISO `YYYY-MM-DD`; fără componente manoperă/piese NULL și fără diferențe > 0,011 lei între `total_general` și `total_manopera + total_piese - total_avans`. Se folosesc totalurile antetului, nu liniile, evitând multiplicarea documentelor. |
| `evidente_avansuri_plati` | 52 plăți, niciuna NULL/nepozitivă în suma inspectată. `suma` și `data_platii` permit raportarea plăților de avans; nu dovedesc încasările finale. |
| `constatari` | Statusuri observate: `In lucru`, `Asteptare piese`, `Finalizat`, `Arhivat`. Sunt disponibile `created_at`, `data_finalizarii`, `este_urgent`. Se raportează fișe, nu vehicule unice. |
| `detailing` | O fișă în lucru. Codul modulului folosește `Finalizate`, nu `Finalizat`; active sunt `Programari`, `Programat`, `În așteptare`, `In lucru`. `pret_estimat` nu este tratat ca încasare și nu este adunat la devize. |
| `evidenta_awb` | Există `in_tranzit`, `livrat`, `retur`, datele evenimentelor și arhivarea. Sunt raportate coletele nearhivate în tranzit și cele cu dată de livrare azi; `pret` nu devine încasare. |
| `stoc_view_curent` | 76 produse active, dintre care 8 la/sub pragul minim. Regula folosește `stoc_actual <= prag_minim`, inclusiv egalitatea. Nu există cost suficient pentru o valoare financiară a stocului. |
| `comenzi_piese_sh` | Statusurile sunt validate de CHECK; 3 comenzi nearhivate în stările urmărite. `nepotrivita` este o excepție reală; nu se inventează un status generic „problema”. Prețurile de comandă nu sunt profit sau vânzări. |
| `plati_manager` | 2 înregistrări `neplatit`, total 994 lei. Se raportează plăți de efectuat, nu datorii scadente sau restante. |
| Alte module | Flota, Generator, Todo și dezmembrările nu sunt incluse în prima versiune: prioritatea este activitatea service-ului; nu sunt inventate praguri de mentenanță, costuri, marje sau obiective de productivitate. |

Ferestrele SQL echivalente query-urilor frontend au fost executate ca agregări READ-ONLY: 187 devize (606.520,492 lei valoare integrală), 52 plăți de avans (85.049 lei), 44 constatări în fereastră/sau active, 1 fișă detailing relevantă, 58 AWB nearhivate relevante, 76 produse active, 3 comenzi SH de urmărit, 2 plăți manager neplătite. Intervalul probei: 01.05.2026–16.10.2026 inclusiv, cu excepția situațiilor active care pot fi mai vechi. Sumele nu se adună între surse.

### Permisiuni și limite de verificare

Politicile SELECT reale pentru `detailing` și `comenzi_piese_sh` permit Admin sau permisiunea proprie modulului; rolul Manager singur nu este suficient. Prototipul verifică aceste permisiuni înainte de query și afișează „Fără acces” când lipsesc. Nu interpretează refuzul drept zero. Tabelele financiare principale inspectate au RLS dezactivat; controlul de pagină nu remediază securitatea bazei. Nu s-au schimbat politici sau granturi.

Citirile SQL de audit nu sunt probe cu JWT-ul unui utilizator Manager. Testele de acces în browser au folosit profiluri controlate, fără sesiuni reale. Confirmarea end-to-end a accesului și a datelor cu conturile reale Admin/Manager rămâne necesară înainte de deploy.

## 3. Contractul exact al indicatorilor

| Indicator | Sursă / formulă | Semnificație și excluderi |
|---|---|---|
| Valoare devize finale | `SUM(total_manopera + total_piese)` pentru `data_deviz` în perioada selectată | Valoare integrală a documentelor, înainte de avans; piesele includ discountul existent. Nu este venit contabil, încasare, profit sau dovadă a executării efective a tuturor lucrărilor. |
| Variație față de perioada precedentă | `(valoare_curentă - valoare_precedentă) / valoare_precedentă * 100` | Numai când baza precedentă este pozitivă; altfel se afișează lipsa bazei procentuale. |
| Devize finale | Numărul antetelor din perioada selectată | Documente, nu vehicule unice, facturi sau vizite unice. |
| Valoare medie / deviz | Valoare integrală / număr documente | Dacă nu există documente, media este `—`; nu se împarte la zero. |
| Manoperă / piese | Sumele separate ale `total_manopera` și `total_piese` | Componente ale valorii integrale, nu costuri sau marjă. |
| Avans inclus în devize | `SUM(total_avans)` pentru aceleași antete | Avans dedus în documentele perioadei; nu înseamnă că plata s-a produs în acea perioadă. |
| Rest calculat după avans | `SUM(total_general)` pentru aceleași antete | Restul salvat după deducerea avansurilor. Nu confirmă creanța neachitată de azi: plățile finale ulterioare nu sunt reconciliate. |
| Avansuri încasate | `SUM(evidente_avansuri_plati.suma)` după `data_platii` | Plăți de avans înregistrate în perioada selectată, inclusiv cele pentru care devizul apare în altă lună. Nu sunt toate încasările service-ului. |
| Număr plăți de avans | Numărul rândurilor de plată din perioadă | Plăți, nu numărul avansurilor sau clienților. |
| Plăți manager de efectuat | `SUM(suma)` și număr pentru `status='neplatit'` | Situație curentă, independent de luna selectată. Nu există scadență confirmată pentru a le numi restante. |
| Azi: devize datate | Număr și valoare integrală după `data_deviz=azi` | Data documentului, nu ora creării: antetul nu are `created_at`. |
| Azi: avansuri | Suma și numărul plăților după ziua locală `data_platii` | Avansuri înregistrate azi. |
| Azi: constatări create | Număr după ziua locală `created_at` | Fișe create azi, inclusiv dacă au fost ulterior finalizate/arhivate. |
| Azi: AWB cu livrare | Număr nearhivat după ziua locală `data_livrare` | Evenimentul de livrare înregistrat; nu confirmă decontarea curierului. |
| Evoluție | Sume manoperă/piese pe ultimele 6 luni, plus număr devize și avansuri plătite în tabel | Luna curentă este parțială și marcată explicit. Avansurile sunt coloană separată; nu se stivuiesc și nu se adună peste devize. |
| Constatări active | Număr `status IN ('In lucru','Asteptare piese')` | Fișe active în momentul citirii. |
| Detailing activ | Număr după lista explicită de statusuri active | Fișe programate/în lucru, condiționat de accesul la modul. |
| AWB în tranzit | Număr nearhivat `stare='in_tranzit'` | Colete, fără presupuneri despre zile de întârziere sau încasări. |
| Comenzi SH de urmărit | Număr nearhivat în `comandata`, `in_tranzit`, `ajunsa`, `nepotrivita` | Comenzi cu acțiuni operaționale posibile; nu sunt toate comenzile istorice. |
| Produse la/sub prag | Număr produse active cu `stoc_actual <= prag_minim` | Număr de produse, nu număr de bucăți sau valoare financiară. |

## 4. Calendar și comportament

Toate zilele timestamp sunt interpretate explicit în `Europe/Bucharest`, indiferent de fusul dispozitivului. `data_deviz` este zi ISO fără fus orar. Intervalele sunt `[început, sfârșit)`. Miezul nopții este convertit în UTC cu offsetul local corect iarna/vara.

Pentru luna curentă se includ zilele 1–azi și se compară cu primele același număr de zile din luna precedentă. Dacă luna precedentă este mai scurtă, comparația se oprește la sfârșitul ei, iar numărul de zile comparate este afișat. Pentru o lună încheiată se compară lunile complete. Sunt selectabile ultimele cinci luni; a șasea este păstrată pentru comparația celei mai vechi luni selectabile. Graficul prezintă toate cele șase luni. Datele viitoare ale devizelor/plăților sunt excluse.

Azi, Operațional și Necesită atenție sunt independente de luna selectată. Nu există polling de date business; se încarcă la deschidere și la „Actualizează”. Schimbarea lunii reutilizează doar setul citit în memorie. Timestampul ultimei citiri este vizibil; revenirea după schimbarea zilei cere explicit actualizarea. Timeout-ul comun de sesiune își păstrează mecanismul existent.

## 5. Query-uri și performanță

După sesiune și SELECT pe profil, pornesc în paralel cel mult opt surse independente:

| Tabel/view | Coloane selectate | Filtru |
|---|---|---|
| `deviz_final_header` | `id_deviz_final,data_deviz,total_manopera,total_piese,total_avans,total_general` | `data_deviz >= prima_zi_acum_5_luni` și `< mâine` |
| `evidente_avansuri_plati` | `id,suma,data_platii` | aceeași fereastră, cu miezul nopții românesc convertit UTC |
| `constatari` | `id,created_at,data_finalizarii,status,este_urgent` | creare/finalizare în fereastră SAU status activ |
| `detailing` | `id,status,data_programare,data_finalizarii` | programare/finalizare în fereastră SAU status activ; numai cu acces |
| `evidenta_awb` | `id,stare,data_crearii,data_livrare,data_retur` | nearhivat ȘI (creare/livrare/retur în fereastră SAU în tranzit) |
| `stoc_view_curent` | `id,denumire,stoc_actual,prag_minim` | `activ=true` |
| `comenzi_piese_sh` | `id,status` | nearhivat ȘI status în lista urmărită; numai cu acces |
| `plati_manager` | `id,suma,status` | `status='neplatit'` |

Fiecare sursă este ordonată după cheia unică și citită în pagini de 500, cu `count:'exact'` pe prima pagină. La volumele auditate este suficientă o pagină/sursă. Maximum 5.000 rânduri/sursă; peste limită sursa devine indisponibilă, fără sumar parțial. Continuările unei surse sunt secvențiale doar dacă numărul real necesită paginare. Sunt verificate totalul și ID-urile duplicate. Un timeout de 15 secunde/sursă anulează requesturile; nu există retry automat de date business.

Nu există N+1, joins de linii, descărcare de câmpuri personale pentru grafice, Chart.js sau bibliotecă nouă de grafice. Controalele și graficele native folosesc CSS/DOM. Profilul principal este citit o dată per refresh; timeout-ul comun citește independent identitatea/rolul, deci acestea nu trebuie interpretate ca requesturi duplicate de business.

La eșec/timeout/refuz/date invalide, sursa afișează indisponibilitate, fără a reutiliza sume vechi sau a converti eroarea în zero. O sursă validă goală produce zero pentru sumă/număr și `—` pentru medie. Componentele financiare lipsă/nefinite, data de deviz nevalidă sau diferențele de reconciliere > 0,011 lei invalidează sursa devizelor. Componentele negative sunt păstrate în tabel, dar graficul stivuit este înlocuit cu o explicație, evitând o reprezentare falsă.

## 6. Reguli de atenție

- Fișe active cu status `Asteptare piese`.
- Fișe active cu `este_urgent=true`.
- Produse active cu stoc la/sub pragul configurat în bază; sunt afișate cel mult trei denumiri ca orientare, cu legătură la modulul complet.
- Comenzi SH nearhivate cu status `nepotrivita`.
- Plăți manager `neplatit`, cu număr și sumă.

Badge-ul numără categoriile de atenționare, nu vehiculele, problemele distincte sau totalul rândurilor. O fișă poate fi urgentă și în așteptare simultan. Dacă sursele necesare lipsesc, lista este marcată parțială, inclusiv când nu conține atenționări. Nu se afișează „totul în regulă” pe baza unor citiri eșuate.

## 7. Validare realizată și limite

- Sintaxă JavaScript verificată.
- 18 probe locale pentru calendar (an nou, DST, an bisect, lună mai scurtă), formule, valori numerice, limite exclusive, documente inexistente, surse indisponibile, roluri/permisiuni, paginare 501 rânduri, plafon depășit, erori și ID-uri duplicate.
- 10 scenarii în Chrome cu transport/date de test izolate: desktop 1512 px, telefon 390 px, tabletă 820 px, surse goale, eroare de citire, totaluri incoerente, Manager fără acces Detailing/SH, permisiune explicită, profil refuzat și sesiune absentă. Refresh-ul cu eroare elimină valoarea anterioară; schimbarea lunii nu produce query-uri; textul din date nu este interpretat ca HTML.
- Inspecție vizuală desktop și telefon; moneda și dimensiunea valorilor au fost ajustate pe telefon. Scripturile de test, datele sintetice și capturile sunt în spațiul temporar al conversației, în afara LAB; nu fac parte din prototip și nu se copiază în producție.
- Coloanele/filtrele au fost confruntate cu schema reală și SELECT-urile agregate. Aceste probe nu înlocuiesc testarea REST/RLS cu sesiuni reale. Politicile au fost inspectate, fără modificări.
- Evidența fișierelor este verificată prin hash față de inventarul anterior intervenției; diff-ul fișierelor noi și verificarea whitespace sunt inspectate separat, deoarece fișierele sunt neversionate.

O încercare de export local extins de rânduri Supabase a fost respinsă de revizuirea automată și nu a fost efectuată; auditul a continuat numai cu agregări. Previziualizarea întregului LAB a fost de asemenea respinsă; proba în browser a servit exclusiv cele trei fișiere noi dintr-un folder temporar izolat. Nu există dump al datelor reale sau sesiuni reale salvate de aceste teste.

Limitări de date: nu există dovadă completă a plăților finale, profitului, costurilor integrale, creanțelor reale ori a utilizării capacității atelierului. Nu se afirmă valori nete/brute fiscal sau TVA dacă schema nu stabilește contractul. Datele de document pot fi introduse/actualizate retroactiv. Formatele viitoare non-ISO din coloana text `data_deviz` pot fi excluse de filtrul lexicografic; auditul a confirmat format ISO pentru toate rândurile actuale. Arhivarea AWB schimbă populația raportată. Rândurile mutate în timpul paginării pot necesita refresh; nu există snapshot tranzacțional comun între cele opt surse. Limita de 5.000 și `count exact` sunt compromisuri de prototip, nu o soluție de agregare la volum nelimitat.

## 8. Recomandări ulterioare — neaplicate

1. Evidență verificabilă a plăților finale și alocarea lor la devize, pentru încasări complete și creanțe reale.
2. Coloană `date` sau contract ISO validat pentru `data_deviz`; indici pe coloanele de perioadă/status, după măsurarea planurilor reale.
3. RPC invoker READ-ONLY cu agregări și permisiuni explicite, dacă volumele justifică eliminarea transferului de rânduri; contractele financiare/calendaristice trebuie păstrate.
4. Contract de acces Manager pentru Detailing/SH și consolidarea RLS într-o intervenție separată, fără extinderea implicită a accesului.
5. Costuri reale și reguli contabile pentru marjă/profit; nu se deduc din prețuri estimate.
6. După aprobarea prototipului: test cu sesiuni reale, revizuirea accesului la surse și copierea exclusivă a fișierelor din documentul 19. Integrarea în meniul HUB este o schimbare ulterioară distinctă.

## 9. Fișiere

Create în etapa istorică de prototip (fișierele runtime au fost ulterior șterse): `modules/manager/manager-v2.html`, `modules/manager/manager-v2.css`, `modules/manager/manager-v2.js`, acest document și `documentatie_tehnica/19_MANAGER_V2_FISIERE_DEPLOY.md`. Niciun fișier existent din LAB nu este modificat de prototip. Lista de mai sus este istorică și nu este lista de livrare. Vezi documentul 19 pentru cele patru fișiere funcționale actuale și ordinea de deploy.
