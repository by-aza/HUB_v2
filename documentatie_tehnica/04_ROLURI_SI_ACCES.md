# Roluri și restricții de acces

## Frontend curent, regulă de business și DB — 03.11.2026

**NEEDS_REVIEW pentru autorizarea efectivă.** Citirea surselor locale nu testează
politici RLS, ACL/GRANT sau accesul real al unui cont. Regula de business păstrată
este administrarea utilizatorilor/rolurilor/bifelor exclusiv de către Admin.

| Nivel inspectat static | Condiție în checkout-ul principal |
|---|---|
| Tabul Utilizatori și încărcarea listei din `modules/admin/admin.html` | Mapare `admin_useri`; verificarea listei acceptă Admin sau `permissions.admin_useri === true` |
| Intrarea în `modules/admin/panou_control.html` | Admin sau `permissions.panou_control === true` |
| Creare/ștergere utilizatori în aceste pagini | Placeholder-uri „Funcționalitate viitoare”; editarea profilurilor are cod existent |

Vizibilitatea/verificarea frontend nu demonstrează dreptul de scriere în DB.
Constatările LAB Admin-only din 22.10 și catalogul din 21.10 de mai jos sunt
istorice; nu descriu verificările frontend curente și nu au fost retestate live.

## Acces implementat și limite — 21.10.2026

Catalogul live confirmă RLS ON pe toate cele 36 tabele publice în LAB/producție. Matricea implementată, bifele și citirile între module sunt în [09_MATRICE_ACCES.md](09_MATRICE_ACCES.md).

Admin are acces indiferent de bifă la operațiile implementate; numai Admin poate scrie auth_profiles/auth_roles. Politicile hub_guard_* protejează INSERT/UPDATE/DELETE, iar SELECT anon/authenticated este păstrat pentru loginul poreclă/email și compatibilitate. Nu este nevoie să se refacă loginul pentru a consemna această protecție minimă activă.

Manager/2 are excepțiile existente în raportare/Plăți. Cheia unui meniu nu se presupune automat egală cu cheia politicii: de exemplu DB Flotă folosește flota, iar bifele mai noi și fallback-urile se verifică separat.

TODO este Admin-only ca regulă de business, însă politicile live dau CRUD tuturor autentificaților; Generator are ALL public true. Acestea sunt RESTANȚE, nu comportamente Admin-only deja demonstrate. Mai există GRANT-urile TRUNCATE pe 16 tabele și Storage separat; vezi [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

Loginul actual este păstrat. AUTH avansat/Turnstile sunt suspendate. Nu s-au retestat Auth sau conturile reale în actualizarea documentară; probele LAB anterioare nu sunt probe producție.

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Context istoric și detalii de implementare

Secțiunile de mai jos păstrează auditul și actualizările datate. Inventarele, numerele și formulările „actual/live” rămase în acest context nu sunt o nouă verificare a LAB sau a producției; stadiul documentat la 21.10.2026 este cel precizat mai sus.

## 1. Modelul de identitate

Autentificarea este furnizată de Supabase Auth. Pentru fiecare utilizator, aplicația așteaptă un rând în `public.auth_profiles`, legat prin același UUID. Profilul adaugă:

- nume, prenume, poreclă, telefon și email;
- `rol_id`, legat de `auth_roles`;
- obiectul JSONB `permissions`, cu permisiuni granulare.

Un trigger pe `auth.users` execută `handle_new_user()` și creează profilul cu `rol_id = 3`. În schema curentă, rolul 3 este `Birou`, deși comentariul funcției spune „Mecanic”. Schema efectivă are prioritate asupra comentariului, dar discrepanța trebuie corectată înainte de noi automatizări de onboarding.

## 2. Roluri confirmate

| ID | Rol |
|---:|---|
| 1 | Admin |
| 2 | Manager |
| 3 | Birou |
| 4 | Magazioner |
| 5 | Electrician |
| 6 | Vopsitor |
| 7 | Tinichigiu |
| 8 | Mecanic |

Rolul este o categorie principală. Accesul detaliat este controlat predominant de cheile din `permissions`.

Clarificare de business confirmată: rolurile Mecanic, Electrician și Tinichigiu există în catalog, dar nu folosesc momentan HUB AUTO. Nu se proiectează acum politici dedicate acestor trei roluri; până la o decizie viitoare, ele nu primesc acces operațional implicit.

## 3. Fluxul de autentificare

1. utilizatorul introduce email sau poreclă și parolă;
2. pentru poreclă, pagina caută mai întâi profilul pentru a obține emailul;
3. se apelează `signInWithPassword`;
4. loginul este înregistrat în `audit_logs` unde helperul funcționează;
5. un `returnTo` este acceptat numai dacă are aceeași origine;
6. Mecanic (`rol_id = 8`) este direcționat la Constatare v2;
7. Vopsitor (`rol_id = 6`) este direcționat la Detailing;
8. celelalte roluri ajung la dashboard;
9. din dashboard, Managerul este direcționat la Manager Dashboard, exceptând accesul explicit cu `?hub=1`.

**Istoric:** la auditul inițial, lookup-ul anonim era posibil cu `auth_profiles` fără RLS. **Starea documentată la 21.10.2026:** RLS este ON; SELECT anonim este păstrat explicit pentru loginul existent. Expunerea profilurilor nu este eliminată prin simpla activare RLS; detalii și direcție în [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

## 4. Chei de permisiune observate

Cheile distincte găsite în profiluri și/sau interfață sunt:

```text
admin_alerte
admin_audit
admin_consumabile
admin_devize
admin_echipe
admin_megafon
admin_useri
avansuri
awb
baza_vin
cautare_deviz
clienti_notificari
clienti_notificari_config
comenzi_piese_sh
constatari
consumabile
contracte
detailing
deviz_estimativ
deviz_final
devize
dezmembrari_capture
dezmembrari_manage
flota
generator
lista_masini
magazie
manager_dashboard
panou_admin
panou_control
piese_stoc
plati
telefoane
```

Nu există un catalog SQL separat al permisiunilor. Numele sunt implicit definite prin cod și prin obiectele JSON ale profilurilor, ceea ce permite divergențe de scriere sau chei istorice.

## 5. Matrice de acces în dashboard

| Destinație | Permisiune principală | Fallback/observație |
|---|---|---|
| Deviz estimativ | `deviz_estimativ` | `devize` |
| Avansuri | `avansuri` | `devize` |
| Plăți | `plati` | acces implicit Manager în dashboard |
| Telefoane clienți | `telefoane` | `devize` |
| Contracte | `contracte` | `devize` |
| Căutare devize | `cautare_deviz` | `devize` |
| Deviz final | `deviz_final` | `devize` |
| Comenzi piese SH | `comenzi_piese_sh` | fără fallback observat |
| Clienți & Notificări | fără filtru explicit în cardul DEMO | RLS folosește permisiuni dedicate |
| Dezmembrări desktop | `dezmembrari_manage` | `dezmembrari` istoric |
| Captură Dezmembrări | control în pagină/RLS | `dezmembrari_capture` sau manage/Admin |
| Lista mașini | `lista_masini` | `flota` |
| Bază VIN | `baza_vin` | `flota` |
| AWB | `awb` | `magazie` |
| Piese stoc | `piese_stoc` | `magazie` |
| Consumabile | `consumabile` | `magazie` |
| Generator | `generator` | `magazie` |
| Detailing | `detailing` | `constatari` |
| Constatare | `constatari` | — |
| Admin | oricare permisiune `admin_*` sau Admin | `panou_admin`/`panou_control` sunt istorice |
| Manager Dashboard | `manager_dashboard` | Admin și Manager acceptați direct |

Adminul are bypass în logica dashboardului. Acest bypass UI nu înlocuiește cerința ca politicile bazei să permită operația.

## 6. Acces în Admin

**Dovadă istorică LAB, 22.10.2026:** gestionarea utilizatorilor, rolurilor și permisiunilor era destinată exclusiv Adminului și restricționată astfel în codul acelui mirror; `admin_useri` și `panou_control` nu delegau administrarea acolo. Pentru sursele repository-ului principal se aplică tabelul local de la început, iar pentru DB este necesară verificare separată.

`admin.html` filtrează taburile astfel:

| Tab | Cheie |
|---|---|
| Megafon | `admin_megafon` |
| Alerte/flotă | `admin_alerte` |
| Devize | `admin_devize` |
| Consumabile | `admin_consumabile` |
| Echipe | `admin_echipe` |
| Dezmembrări | `dezmembrari_manage` |
| Audit | `admin_audit` |
| Utilizatori | Checkout principal: mapare `admin_useri`; verificarea listei acceptă Admin sau bifa. Istoric LAB: Admin-only |

Tabul TODO nu apare cu o cheie distinctă în maparea observată. Clarificarea de business stabilește că `todo_tasks` este modulul personal al administratorului și trebuie să fie accesibil numai Adminului. La nivel SQL, starea actuală este nealiniată: tabelul permite CRUD tuturor utilizatorilor autentificați.

`panou_control.html` este un al doilea punct de administrare. În sursa curentă acceptă Admin sau `permissions.panou_control === true`; observația Admin-only descrie numai codul LAB recitit la 22.10. În ambele pagini există cod pentru editarea profilurilor/rolurilor/bifelor, iar creare și ștergere sunt placeholder-uri „Funcționalitate viitoare”, conform [02, §8](02_MODULE.md#8-administrare). Nicio autorizare DB nu este confirmată prin această reconciliere.

## 7. Controlul accesului pe trei niveluri

### 7.1 Nivel UI

Cardurile, taburile și butoanele sunt ascunse sau afișate pe baza rolului/permisunilor. Acesta este un control de experiență, nu un control suficient de securitate: cererile pot fi construite în afara paginii.

### 7.2 Nivel de pagină

Multe pagini verifică sesiunea și profilul la pornire. Implementarea nu este centralizată, iar paginile nu aplică identic verificarea, redirecționarea și timeoutul.

### 7.3 Nivel de date

> **Istoric — distribuția 17/19 de mai jos este depășită.** La 21.10.2026 sunt documentate 36/36 tabele publice cu RLS ON și 120 de politici aliniate; vezi [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md). RLS, granturile și semantica politicilor rămân niveluri distincte.

Pe cele 17 tabele cu RLS, politicile și funcția `private.has_hub_permission` oferă control server-side. Pe cele 19 tabele fără RLS, accesul se bazează pe granturile API și pe disciplina clientului. Pentru acestea, restricțiile UI nu sunt suficiente.

## 8. Permisiuni speciale server-side

- `private.has_hub_permission(key)` acceptă Admin sau cheia JSON adevărată pentru utilizatorul curent;
- `can_capture_dezmembrari()` acceptă Admin, manage sau capture;
- `can_manage_dezmembrari()` acceptă Admin sau manage;
- RPC-ul de creare a devizului final validează autentificarea și permisiunea înainte de operația atomică;
- funcția Edge Dezmembrări validează JWT și apoi profilul;
- funcția Edge de alerte nu validează JWT și rulează intern cu service role.

## 9. Timeout și logout

`session-timeout.js` impune 30 de minute de inactivitate utilizatorilor non-Admin. Adminul este exceptat. Evenimentele de activitate sunt partajate între taburi prin `localStorage`. Fișierul are mecanisme de retry pentru schimbări de sesiune.

Limită: nu toate paginile includ acest script. Clienți & Notificări, Constatare v2, Manager și Dezmembrări folosesc alte inițializări și nu au aceeași includere explicită. Prin urmare, politica nu este globală.

## 10. Probleme de coerență confirmate

- rolul implicit din trigger este 3/Birou, dar comentariul îl numește Mecanic;
- există permisiuni noi și fallback-uri istorice în paralel;
- cheia `clienti_notificari` este folosită în RLS, dar cardul dashboard este încă tratat ca DEMO și nu are filtrare echivalentă clară;
- Admin/Manager pot primi acces prin rol, pe când alte module se bazează pe JSON;
- `generator_logs` are o politică publică `ALL`, deci permisiunea UI nu limitează datele;
- tabelele fără RLS permit ocolirea matricei de permisiuni;
- drepturile `EXECUTE` pentru funcții `SECURITY DEFINER` sunt mai largi decât necesarul evident;
- profilurile pot fi citite înainte de login pentru rezolvarea poreclei.
- gestionarea utilizatorilor/rolurilor/permisiunilor este delegabilă în cod prin `admin_useri`/`panou_control`, deși businessul o rezervă exclusiv Adminului;
- `todo_tasks` permite tuturor utilizatorilor autentificați CRUD, deși este modul personal Admin-only;
- Mecanic, Electrician și Tinichigiu nu sunt utilizatori actuali ai HUB-ului; redirecționările sau rolurile existente în cod nu constituie o cerință actuală de acces.

## 11. Ce nu a fost testat

Nu au fost executate operații de scriere cu conturi de test pentru fiecare rol. Matricea rezultă din cod, rolurile și politicile inspectate. Comportamentul complet al fiecărui cont existent, inclusiv combinațiile particulare de JSON `permissions`, nu este afirmat dincolo de valorile distincte identificate.

## Actualizare 15.10.2026 — permisiunea Deviz final

`save_deviz_final`, `list_deviz_final_importable_avansuri` și helperul de rezolvare a vehiculului verifică utilizator autentificat și rol Admin sau `auth_profiles.permissions.deviz_final = true`. Helperul permite identificarea vehiculului chiar dacă utilizatorul nu are `clienti_notificari`; lookup-ul întoarce ID și sume/date de plată, fără observații interne. În LAB, paginile actuale folosesc acum acest traseu prin RPC.

Aceste verificări protejează apelurile RPC, însă tabelele financiare rămân fără RLS și cu granturi largi. Matricea din secțiunea 7 nu trebuie interpretată ca protecție completă a datelor. Testarea cu o sesiune reală `deviz_final` fără `clienti_notificari` rămâne de făcut.
