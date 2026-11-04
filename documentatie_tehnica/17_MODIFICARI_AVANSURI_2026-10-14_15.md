# Modificări Avansuri în Deviz final — 14–15.10.2026

## Actualizare de stadiu RLS — 21.10.2026

Acest document păstrează modificările funcționale Avansuri din 14–15.10.2026. Starea lor de securizare s-a schimbat ulterior: evidente_avansuri/evidente_avansuri_plati, constatari și deviz_final_header/deviz_final_linii au acum RLS ON în producție și LAB.

Cele trei RPC-uri financiare păstrează aceeași logică în medii: identificare vehicle_id, review/eligibilitate, blocări, unicitatea importului, salvare atomică și recalcularea totalurilor din plăți. total_general rămâne restul de plată, nu valoarea brută. Politicile și granturile necesare RPC-urilor sunt active; nu se mai aplică descrierea istorică „financiar fără RLS”.

Utilizatorul a confirmat finalizarea activării și testele ultimelor trei Devize în producție. Testele automate 97 Avansuri și 218 Devize sunt numai LAB; nu au fost reluate în această actualizare. Detalii de stare/teste și SQL/rollback: [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md), [10_PLAN_RLS.md](10_PLAN_RLS.md), [12_TESTE_ACCES.md](12_TESTE_ACCES.md).

Nu s-au schimbat frontendul, RPC-urile, datele sau SQL-ul în această sarcină documentară. Nu se relivrează automat fișierele de print/avansuri deja confirmate istoric; se reconciliază cu proiectul principal conform registrului 23.

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Scop și starea verificată

Avansurile se importă separat de piese, cu sumă pozitivă și legătură la înregistrarea de origine. Checkout-ul principal `/media/aza/Depozit_Mint/HUB_v2` este curat la `fe82649` (`feature-responsive`, urmărește `origin/feature-responsive`); commit + push sunt confirmate de utilizator. Baza Supabase conectată conține schema/RPC-urile noi și conversiile DF-199/200/201. **Deploy confirmat de utilizator:** pagina și printul live includ integrarea Avansurilor.

HEAD-ul `HUB_v2-LAB` rămâne la `92038d5`, dar fișierele de lucru `deviz_final.html` și `deviz-print.html` au acum integrarea completă; cele două migrări și SQL-ul AV-56 sunt încă neversionate în LAB. Deploy-ul în producție este confirmat separat de utilizator, prin verificarea paginii și printului live.

## Reconciliere LAB — 15.10.2026

O verificare anterioară surprinsese încă paginile vechi. La verificarea curentă, toate cele cinci fișiere importante din LAB — cele două pagini, cele două migrări și SQL-ul AV-56 — sunt identice bit cu bit cu checkout-ul principal (SHA-256). `deviz_final.html` conține **Include avans**, **Importă Avans**, RPC-ul de listare și RPC-ul de salvare. `deviz-print.html` conține secțiunea AVANS și, condiționat de `hasAdvance`, afișează **TOTAL DEVIZ**, **AVANS ACHITAT**, **REST DE PLATĂ**; fără avans păstrează **TOTAL DE PLATĂ**. Clasa `marker-avans` folosește `#fce7e7` și `print-color-adjust: exact` (inclusiv prefixul WebKit). Fluxul și stilul sunt confirmate din codul LAB; previzualizarea într-un browser LAB nu a fost rerulată aici. Deploy-ul în producție este confirmat de utilizator; verificarea de cod LAB și captura live sunt dovezi distincte.

## Fișiere și obiecte

- `modules/devize/deviz_final.html` (LAB și checkout principal): **Include avans**, **Importă Avans**, stare separată, mesaje distincte, încărcare și salvare RPC.
- `modules/devize/deviz-print.html` (LAB și checkout principal): secțiune mov AVANS, rând roz pal `#fce7e7` pentru AVANS ACHITAT, print cu/fără avans; suma rămâne pozitivă.
- `supabase/migrations/20261014194825_add_deviz_final_avans_atomic_save.sql`: coloane, FK/CHECK/index, review privat, trigger, helper vehicul și `save_deviz_final`.
- `supabase/migrations/20261015000000_list_deviz_final_importable_avansuri.sql`: RPC-ul de listare.
- `supabase/av56_confirm_available_manual_20261015.sql`: gardă manuală dedicată AV-56; nu este migrare generală.
- `modules/manager/manager.js` și `manager.html`: corecția valorii devizelor este **REZOLVATĂ în LAB la 16.10.2026**, cu validare locală; se agregă `total_manopera + total_piese`, înainte de avans. În Clienți & Notificări nu există încă `✓ Inclus în DF-XXX`.
- Modalul distinge vehiculul neînregistrat, lipsa avansurilor importabile, numărul ambiguu, VIN-ul diferit, permisiunile și erorile tehnice. Mesajul pentru piesa negativă veche încă folosește „Reconciliază-l explicit”.

## Schema și reguli Supabase

`deviz_final_header.vehicle_id bigint NULL` referă `clienti_vehicule(id)` cu `ON DELETE RESTRICT`; index `deviz_final_header_vehicle_id_idx`. `total_avans numeric NOT NULL DEFAULT 0` are CHECK nenegativ/finit. `deviz_final_linii.avans_id bigint NULL` referă `evidente_avansuri(id)` cu `ON DELETE RESTRICT`; `deviz_final_linii_avans_id_uidx` este unic parțial, deci un avans poate aparține cel mult unui deviz. `deviz_final_linii_avans_shape_chk` cere antet, `sectiune = 'avans'` explicit nenulă și total pozitiv/finit pentru `avans_id` nenul; liniile istorice cu secțiune NULL fără avans rămân permise. Plățile au index pe `avans_id`.

`private.deviz_final_avans_review` are PK/FK pe `avans_id` (`ON DELETE CASCADE`), status `confirmed_used` sau `confirmed_available` și `reviewed_at`. Lipsa rândului înseamnă nerevizuit. Triggerul AFTER INSERT `evidente_avansuri_new_deviz_final_review` marchează doar avansurile create după activare drept disponibile; datele introduse manual nu sunt dovadă de noutate. Cele istorice cer reconciliere individuală, fără reactivarea celor `confirmed_used`.

`public.save_deviz_final(bigint,jsonb,jsonb)` este invoker, verifică autentificarea și permisiunea `deviz_final`, validează identitatea/eligibilitatea, recitește plățile, blochează rândurile și salvează antetul + liniile atomic. La actualizare păstrează `created_by` și `constatare_id`, iar eșecul anulează întregul apel. `public.list_deviz_final_importable_avansuri(bigint,text,text)` este invoker și returnează doar ID, datele plăților, totalul și starea legăturii; exclude revendicările altui deviz. `private.resolve_deviz_final_vehicle(text,text)` este definer cu `search_path` gol, rezultat minim ID, și permite profilului `deviz_final` să identifice vehiculul fără `clienti_notificari`. Căutarea folosește întâi `vehicle_id`, apoi numărul normalizat doar pentru avansuri legacy fără ID. `create_deviz_final_from_constatare` rămâne prezent și compatibil.

## Flux financiar și print

În codul actual din LAB și checkout-ul principal: client/vehicul → avans/plăți → Include avans → Importă Avans → alegere explicită → salvare. Rândurile vechi negative nu se convertesc automat. Piesele după discount stau în `total_piese`; avansul pozitiv în `total_avans`. `Total deviz = total_manopera + total_piese`; `Rest de plată = total_general = Total deviz - total_avans`. Rotunjirea existentă se păstrează: antetul poate avea fracțiuni de ban, iar linia/afișarea două zecimale (130,01 cu discount 10% → 117,009 în antet, 117,01 afișat).

Printul cu avans arată numai **Avans achitat** în secțiunea AVANS, fără observații interne, apoi **TOTAL DEVIZ / AVANS ACHITAT / REST DE PLATĂ**. Fără avans rămâne **TOTAL DE PLATĂ**. Plățile adăugate ulterior cer actualizare și salvare explicită; pentru o vizită nouă se creează un avans nou.

## Confirmare în producție

Utilizatorul a confirmat că pagina live Deviz final afișează **Include avans**, **Importă Avans**, **TOTAL DEVIZ**, **AVANS ACHITAT** și **REST DE PLATĂ**. Printul live afișează secțiunea **AVANS**, rândul roz **AVANS ACHITAT** și **REST DE PLATĂ**. În captura live: **TOTAL DEVIZ 3.633,31 Lei**, **AVANS ACHITAT 500,00 Lei**, **REST DE PLATĂ 3.133,31 Lei**. Aceasta este o confirmare furnizată de utilizator, nu un nou test de browser efectuat în această actualizare.

## Verificări și date istorice

Jurnalul consemnează proba SQL Editor cu BEGIN/ROLLBACK și opt postverificări `true`, plus confirmări în interfață/print pentru CL-00045, vehicul 48, AV-56 (500 lei), DF-201. Citirea live din 15.10.2026 confirmă DF-201: `total_avans = 500`, `total_general = 3133.309`, o linie `avans`, fără piesă negativă. DF-199 are AV-43/4.000 lei, rest `503.209`; DF-200 are AV-55/10.000 lei, rest `8140.00`; ambele au o linie `avans` și zero piese negative. Statusul review pentru AV-43/55/56 este `confirmed_available`; revendicarea reală este în liniile de deviz.

AV-55 are încă în baza conectată `data_platii` la 14.10.2026, deși utilizatorul a indicat data reală 26.09.2026. Nu s-au schimbat date în această documentare. Sursa este jurnalul, codul actual din LAB/checkout-ul principal și interogările SELECT din 15.10.2026; testele vechi sunt raportate ca rezultate din jurnal, nu rerulate acum.

## Riscuri și TODO

> **Istoric — 14–15.10.2026.** Afirmațiile de mai jos despre lipsa RLS financiar nu mai descriu starea din 21.10.2026. Se păstrează dovezile și riscurile funcționale, fără a deduce că RLS rezolvă toate granturile, Storage sau integritatea datelor; vezi [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

- **RLS/granturi:** cele cinci tabele financiare/service inspectate au încă RLS OFF; granturile istorice largi nu au fost remediate. RPC-urile nu împiedică toate scrierile directe. Planul RLS separat rămâne neaplicat.
- **REZOLVATĂ în LAB — 16.10.2026:** agregarea Manager bazată pe `total_general` a fost înlocuită cu `Number(total_manopera || 0) + Number(total_piese || 0)`. KPI-ul „Valoare devize finale”, comparația lunară și seria din grafic folosesc valoarea integrală. Intervalele de dată și indicatorii de avansuri rămân neschimbați.
- **De validat:** auditul celorlalte avansuri istorice; corectarea controlată a datei AV-55; teste concurente/deadlock, erori de rețea, rollback la update și profil real limitat; verificarea fluxului automat pentru avansuri noi din ambele pagini.
- **UX rămas:** marcajul `✓ Inclus în DF-XXX` și simplificarea mesajului pentru piesa negativă veche. Banda roz este confirmată și în codul LAB. Decizia vizuală de a afișa sau nu minusul este încă deschisă; suma salvată și afișată acum este pozitivă.
- **Operațional:** păstrarea trasabilității deploy-ului confirmat și a fișierelor copiate în LAB; verificarea eventualei eliminări a datelor dedicate CL-00045/vehicul 48/AV-56/DF-201 numai după controlul referințelor.

## Validare locală Manager — 16.10.2026

Sintaxa JavaScript (`node --check`) și `git diff --check` au trecut. Un test izolat cu sursa reală și date simulate a confirmat valoarea integrală, conversia valorilor numerice text/NULL, luna curentă, luna trecută și ultimele patru luni inclusiv trecerea dintre ani. `total_general` nu mai apare în `manager.js`. Interogarea avansurilor, calculul zilnic, agregarea lunară și seria „Avansuri” au fost comparate cu copia de dinaintea intervenției și sunt identice. Au fost inspectate `git diff` și diferențele față de copia inițială, păstrând modificările locale preexistente.

Nu s-a accesat sau modificat Supabase și nu s-a făcut commit. Validarea este locală; nu confirmă un test în browser cu date reale sau deploy-ul acestei corecții în producție. Seriile „Valoare devize finale” și „Avansuri” au semnificații distincte și nu se însumează ca vânzări, deoarece avansul este deja inclus în valoarea integrală a devizului.
