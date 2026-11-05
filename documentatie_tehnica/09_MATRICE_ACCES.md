# Matricea de acces — HUB AUTO v2

## EP — acces verificat în producție la 05.11.2026

Admin/1 sau JSON boolean `evidenta_piese=true`: SELECT pe cele șapte tabele EP și
RPC-urile modulului; fără scriere directă. Setarea implicitului rămâne numai Admin.
Importul în DF cere și `deviz_final=true`
pentru non-Admin. Manager nu primește acces implicit. Niciun profil non-Admin nu
are încă bifa EP. Probe SQL read-only: Admin permis, fără EP refuzat, inclusiv
profil cu DF; HTTP anonim refuzat. Nu s-au schimbat bife. Autentificarea reală și
scrierile în browser rămân NEEDS_REVIEW. [Catalog, ACL și probe](03_SUPABASE.md#ep-productie-verificat-20261105).

## Matrice IMPLEMENTATĂ — 21.10.2026 (istoric)

Această matrice este extrasă din politicile live, identice în LAB și producție. **36 tabele RLS ON / 120 politici.** S=SELECT, I=INSERT, U=UPDATE, D=DELETE. Nu se confundă politica de rând cu GRANT-urile sau cu verificările UI.

Admin este permis indiferent de bifă pentru operațiile implementate, fără a inventa UPDATE/DELETE acolo unde fluxul nu le folosește. Numai Admin poate scrie sursele rolurilor/bifelor. Unele politici vechi verifică numele rolului Admin; cele noi folosesc rol_id=1.

| Tabel | Acces efectiv prin politicile de rând |
|---|---|
| `admin_announcements` | Admin, S/I/U/D; politici bazate pe numele rolului Admin. |
| `audit_logs` | INSERT eveniment propriu pentru orice autentificat; SELECT Admin/admin_audit sau contextual constatari; fără UPDATE/DELETE. |
| `auth_profiles` | SELECT anon/authenticated pentru compatibilitatea loginului; INSERT/UPDATE/DELETE numai Admin. |
| `auth_roles` | SELECT anon/authenticated; scriere numai Admin prin hub_contracte_guard.is_admin(). |
| `baza_vin` | Admin sau baza_vin, S/I/U/D (politici vechi ->>). |
| `clienti` | Admin sau clienti_notificari, SELECT/INSERT/UPDATE; fără DELETE. |
| `clienti_contacte` | Admin sau clienti_notificari, SELECT/INSERT/UPDATE; fără DELETE. |
| `clienti_notificari_config` | Admin sau clienti_notificari_config, SELECT/INSERT/UPDATE. |
| `clienti_notificari_istoric` | Admin sau clienti_notificari, SELECT/INSERT/UPDATE. |
| `clienti_notificari_sabloane` | Admin sau clienti_notificari_config, SELECT/INSERT/UPDATE. |
| `clienti_vehicule` | Admin sau clienti_notificari, SELECT/INSERT/UPDATE. |
| `clienti_vehicule_termene` | Admin sau clienti_notificari, SELECT/INSERT/UPDATE; dezactivare prin activ=false, fără DELETE. |
| `comenzi_piese_sh` | SELECT/INSERT/UPDATE Admin sau comenzi_piese_sh; INSERT creator propriu; DELETE numai Admin; metadate protejate de triggere. |
| `config_alerte` | Admin/admin_alerte: SELECT și UPDATE numai valoare; fără INSERT/DELETE/secvență. |
| `constatari` | S/I/U Admin/constatari; citire și pentru clienti_notificari, deviz_final, comenzi_piese_sh, Manager/2 sau manager_dashboard; fără DELETE. |
| `constatari_asteptare_piese` | S/I/U Admin/constatari, UPDATE numai sfarsit; citire și Manager/2 sau manager_dashboard. |
| `constatari_departamente` | S/I/U Admin/constatari, citire și clienti_notificari; fără DELETE. |
| `constatari_repartizari` | Numai SELECT Admin/constatari; responsabilitățile editabile sunt în constatari.responsabili. |
| `contracte` | Admin sau contracte, S/I/U/D; fără fallback devize în politica DB; text ->> true în implementarea existentă. |
| `detailing` | Admin sau detailing, S/I/U/D; politica veche nu deduce fallback din constatari. |
| `deviz_final_header` | S/I/U Admin sau deviz_final explicit; DELETE Admin/admin_devize; cititori suplimentari la secțiunea următoare. |
| `deviz_final_linii` | SELECT contextual; INSERT Admin/deviz_final; DELETE Admin/deviz_final/admin_devize; fără UPDATE direct. |
| `devize` | S/I/U Admin/deviz_estimativ, fallback devize când cheia lipsește; admin_devize corectează numai nr_inmatriculare și poate șterge. |
| `dezmembrari_items` | Admin/dezmembrari_manage gestionează toate; dezmembrari_capture inserează/citește numai propriile itemuri. |
| `dezmembrari_photos` | Manage/Admin gestionează; capture inserează/citește numai fotografii și itemuri proprii. |
| `evidenta_awb` | Admin sau awb, SELECT/INSERT/UPDATE; arhivare prin UPDATE, fără DELETE. |
| `evidente_avansuri` | Avansuri/fallback legacy; citire contextuală C&N/DF/Constatări/SH. Scrieri contextuale limitate de guard, nu CRUD general. |
| `evidente_avansuri_plati` | Avansuri/fallback: operațiile de pagină; C&N creează plată, DF are citire/blocări, Manager/2/manager_dashboard numai citire; guard-ul împiedică editarea prin grantul pentru lock. |
| `flota_auto` | Admin sau flota, S/I/U/D; nu se presupune că bifa UI lista_masini înlocuiește cheia DB. |
| `generator_logs` | EXCEPȚIE PERMISIVĂ NEREZOLVATĂ: ALL public true; anon poate CRUD cu GRANT-urile existente. Nu impune bifa generator. |
| `plati_manager` | Admin/Manager acces global; plati vede/creează propriile cereri; manager_dashboard citește și marchează neplatit→platit; DELETE numai neplatit pentru Admin/Manager sau creator cu plati. |
| `service_personal` | SELECT Admin/admin_echipe/constatari; INSERT/UPDATE administrativ Admin/admin_echipe; arhivare activ=false, fără DELETE. |
| `stoc_miscari` | SELECT consumabile (fallback magazie), admin_consumabile, Manager/2/manager_dashboard și Admin; INSERT consumabile/Admin; DELETE admin_consumabile/Admin; fără UPDATE. |
| `stoc_produse` | SELECT ca la mișcări; INSERT consumabile/Admin; UPDATE admin_consumabile/Admin; fără DELETE. |
| `telefoane_clienti` | Admin sau telefoane, S/I/U/D. |
| `todo_tasks` | RESTANȚĂ: CRUD pentru orice authenticated; regula de business Admin-only NU este impusă de politicile actuale. |

### Citirile Devize între module

- Antet final: Admin, deviz_final/fallback, cautare_deviz/fallback, admin_devize, clienti_notificari, comenzi_piese_sh, constatari și Manager/2 sau manager_dashboard.
- Linii finale: Admin, deviz_final/fallback, cautare_deviz/fallback, admin_devize, comenzi_piese_sh. C&N și Manager nu primesc automat liniile.
- Estimative: Admin, deviz_estimativ/fallback, deviz_final/fallback pentru import, cautare_deviz/fallback, admin_devize, clienti_notificari, comenzi_piese_sh.
- Calea RPC de salvare/generare cere deviz_final explicit/Admin, ca înainte. Fallback-ul vechi din meniu sau SELECT nu este extins în RPC.
- Guard-ul nou din devize permite UPSERT-ul fără created_by la editare, păstrează creatorul/ID-ul și limitează admin_devize la numărul auto; și alt utilizator cu deviz_estimativ poate edita păstrând creatorul.

### Limite care nu trebuie mascate

RLS ON nu validează regula Admin-only pentru todo_tasks sau bifa generator: politicile rămase sunt permisive. TRUNCATE pe 16 tabele și Storage public sunt restanțe distincte; vezi [stadiul central](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md). Pentru anon, excepțiile reale includ SELECT auth_profiles/auth_roles și politica publică generator_logs; nu se scrie „anon refuzat peste tot”.

Fallback-urile sunt explicit implementate doar în anumite politici. În pachetele noi, false prevalează peste cheia legacy și string true este refuzat; regulile vechi ->>/cast boolean nu sunt declarate toate strict JSON boolean. Storage are propriile politici, separat de contracte.

Starea activă este confirmată prin catalog; funcționalitatea producției este confirmată de utilizator pentru rollout-ul planificat, iar numerele automate sunt numai LAB: [12_TESTE_ACCES.md](12_TESTE_ACCES.md).

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Arhivă — analize și planuri anterioare, suspendate în forma integrală

Materialul de mai jos este păstrat pentru dependențe, dovezi și comparație. Datele de audit și stările se referă la momentul consemnat; nu sunt instrucțiuni active. Exemplele SQL și secvențele AUTH nu se execută prin simpla lor prezență aici. Pentru decizia actuală prevalează secțiunea de mai sus și [stadiul curent](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

> **18.10.2026 — RLS Seria 0 AUTH_PROFILES: PREGĂTIT - NEAPLICAT.** Propunerea concretă pentru securizarea sursei rolurilor este în [21_RLS_SERIA_0_AUTH_PROFILES.md](21_RLS_SERIA_0_AUTH_PROFILES.md). Aplicarea cere adaptarea/validarea loginului prin User și a proiecțiilor de actori; nu se continuă cu Seria 1.


> **Actualizare 18.10.2026 — seria 1: PREGĂTIT - NEAPLICAT.** Pentru `contracte` și `todo_tasks`, propunerea concretă și prioritară este [20_RLS_SERIA_1_TABELE_SIMPLE.md](20_RLS_SERIA_1_TABELE_SIMPLE.md). Exemplele generale de mai jos rămân istoric și nu se execută pentru această serie. Starea live nu a fost modificată. Aplicarea este blocată de sursa autorizării (`auth_profiles` editabil fără RLS).


## 1. Scop și metodă

Documentul reprezintă un audit read-only al stării observate la 12 octombrie 2026. Sursele folosite sunt:

- codul din `HUB_v2-LAB/`;
- documentele `02_MODULE.md`, `03_SUPABASE.md`, `04_ROLURI_SI_ACCES.md`, `05_FLUXURI_PRINCIPALE.md` și `07_RISCURI_SI_ZONE_SENSIBILE.md`;
- catalogul live Supabase: tabele, granturi, politici, funcții, view, Storage și Edge Functions;
- advisorii Supabase de securitate și performanță.

Nu au fost executate operații de scriere sau teste cu identități impersonate. Coloanele „acces recomandat” descriu minimul necesar pentru fluxurile confirmate din cod, nu o decizie finală de business.

Decizii de business confirmate ulterior auditului: gestionarea utilizatorilor, rolurilor și permisiunilor este exclusiv Admin; `todo_tasks` este modul personal exclusiv Admin; Mecanic, Electrician și Tinichigiu nu folosesc momentan HUB AUTO și nu primesc politici dedicate în etapa curentă; RLS va fi introdus incremental, tabel cu tabel, cu test și rollback independent.

## 2. O limită importantă: rolurile nu stabilesc singure accesul

Rolurile confirmate sunt Admin, Manager, Birou, Magazioner, Electrician, Vopsitor, Tinichigiu și Mecanic. În implementarea actuală:

- Admin (`rol_id = 1`) primește bypass în multe verificări;
- Manager (`rol_id = 2`) primește acces explicit la Manager Dashboard și Plăți;
- Mecanic este redirecționat după login către Constatare în codul actual, dar rolul nu folosește momentan HUB AUTO;
- Vopsitor este redirecționat către Detailing;
- pentru restul funcțiilor, accesul este determinat de `auth_profiles.permissions`, nu automat de numele rolului.

Situația profilurilor la verificare, fără date de identificare:

| Rol | Număr profiluri | Observație |
|---|---:|---|
| Admin | 1 | rol privilegiat |
| Manager | 1 | are și `manager_dashboard`, plus permisiuni operaționale explicite |
| Birou | 4 | seturi de permisiuni neuniforme |
| Magazioner | 1 | are permisiuni de magazie/flotă/telefoane |
| Electrician | 0 | nu folosește momentan HUB AUTO; fără politică dedicată în etapa curentă |
| Vopsitor | 1 | are Constatare, Consumabile, Detailing și Generator |
| Tinichigiu | 0 | nu folosește momentan HUB AUTO; fără politică dedicată în etapa curentă |
| Mecanic | 0 | nu folosește momentan HUB AUTO; redirecționarea existentă nu definește accesul viitor |

Prin urmare, matricea folosește următoarea notație:

- **A** — Admin;
- **M** — Manager;
- **P(x)** — orice rol care are permisiunea JSON `x = true`;
- **propriu** — numai rândul creat/deținut de utilizator;
- **autentificat** — orice sesiune validă, fără autorizare de business suplimentară;
- **?** — decizia de business nu este confirmată;
- **—** — operația nu este folosită în codul inspectat și nu trebuie permisă implicit.

## 3. Expunerea API actuală

Toate tabelele publice, cu excepția `comenzi_piese_sh`, au granturi complete pentru `anon` și `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` și `TRIGGER`. `comenzi_piese_sh` acordă utilizatorilor autentificați operațiile CRUD obișnuite și se bazează pe RLS.

Consecințe:

- când RLS este activ, politicile limitează rândurile/operațiile;
- când RLS este inactiv, cheia publică `anon` este suficientă pentru acces direct la date și mutații;
- ascunderea unui card, buton sau tab nu reduce granturile API;
- granturile `TRUNCATE`, `TRIGGER` și `REFERENCES` sunt nejustificat de largi pentru clienții browserului, chiar dacă unele nu sunt expuse în mod obișnuit prin PostgREST.

## 4. Matrice completă pentru schema `public`

### 4.1 Identitate, roluri și audit

| Tabel | Module care îl folosesc | SELECT recomandat | INSERT recomandat | UPDATE recomandat | DELETE recomandat | Protecție actuală | Diferență UI / acces real |
|---|---|---|---|---|---|---|---|
| `auth_profiles` | Login, Dashboard, toate verificările de acces, Admin, Manager, Constatare, Dezmembrări, audit actor | utilizator: profil propriu; A: toate; proiecții limitate de nume pentru modulele care afișează actori — scopul exact este **?** | numai trigger/backend controlat | A exclusiv pentru roluri și permisiuni; auto-editarea privilegiilor este interzisă | — | RLS **OFF**; grant complet `anon`/`authenticated` | loginul după poreclă citește emailul înainte de autentificare; API-ul actual permite ocolirea regulii business Admin-only |
| `auth_roles` | Dashboard join, Admin/panou utilizatori | utilizatori autentificați pentru catalogul necesar UI; eventual `anon` numai dacă rămâne necesar loginului — neconfirmat | A exclusiv, dacă se introduce flux | A exclusiv | A exclusiv, numai cu verificări FK; flux neobservat | RLS **OFF**; grant complet | managementul rolurilor este Admin-only, dar API permite astăzi toate operațiile |
| `audit_logs` | `audit.js`, Constatare, Admin Audit | A/P(`admin_audit`) | utilizator autentificat, doar cu `user_id = auth.uid()` și câmpuri controlate | — | — | RLS **OFF**; grant complet | UI este în principal append/read-admin; API permite citire, rescriere, ștergere și `TRUNCATE`, inclusiv anonim |

### 4.2 Clienți și notificări

| Tabel | Module | SELECT recomandat | INSERT recomandat | UPDATE recomandat | DELETE recomandat | Protecție actuală | Diferență UI / acces real |
|---|---|---|---|---|---|---|---|
| `clienti` | Clienți & Notificări, Constatare | A/P(`clienti_notificari`) și A/P(`constatari`) | aceleași | aceleași | — | RLS **ON**; numai A/P(`clienti_notificari`) S/I/U | Constatarea are nevoie de tabel, dar un utilizator cu doar `constatari` este blocat; cardul Clienți este afișat fără permission gate |
| `clienti_vehicule` | Clienți & Notificări, Constatare, Avansuri | A/P(`clienti_notificari`), A/P(`constatari`), P(`avansuri`) pentru selecție | A/P(`clienti_notificari`,`constatari`) | A/P(`clienti_notificari`,`constatari`) | — | RLS **ON**; numai A/P(`clienti_notificari`) S/I/U | Constatarea și Avansurile pot fi vizibile în UI fără permisiunea cerută de RLS |
| `clienti_contacte` | Clienți & Notificări, Constatare | A/P(`clienti_notificari`,`constatari`) | aceleași | aceleași | — | RLS **ON**; numai A/P(`clienti_notificari`) S/I/U | aceeași nepotrivire cu fluxul Constatare |
| `clienti_vehicule_termene` | Clienți & Notificări | A/P(`clienti_notificari`) | aceleași | aceleași | — | RLS **ON**; A/P(`clienti_notificari`) S/I/U | aliniat cu modulul; granturile API sunt largi, dar RLS blochează operațiile fără politici |
| `clienti_notificari_istoric` | Clienți & Notificări | A/P(`clienti_notificari`) | aceleași | aceleași | — | RLS **ON**; A/P(`clienti_notificari`) S/I/U | aliniat; nu există politică D |
| `clienti_notificari_config` | Clienți & Notificări setări | A/P(`clienti_notificari_config`) | numai configurare controlată; necesitatea inserării după rândul inițial este **?** | A/P(`clienti_notificari_config`) | — | RLS **ON**; A/P(config) S/I/U | butonul este ascuns corect după profil; existența permisiunii nu este garantată de rol |
| `clienti_notificari_sabloane` | Clienți & Notificări setări | A/P(`clienti_notificari_config`) | A/P(config), dacă se adaugă tipuri | A/P(config) | — | RLS **ON**; A/P(config) S/I/U | în linii mari aliniat |

### 4.3 Devize, contracte, avansuri și plăți

| Tabel | Module | SELECT recomandat | INSERT recomandat | UPDATE recomandat | DELETE recomandat | Protecție actuală | Diferență UI / acces real |
|---|---|---|---|---|---|---|---|
| `devize` | Deviz estimativ, Căutare, Deviz final, Clienți, Dashboard, Admin | A/P(`devize`,`deviz_estimativ`,`cautare_deviz`,`deviz_final`,`clienti_notificari`,`admin_devize`); P(`manager_dashboard`) doar dacă KPI necesită | A/P(`devize`,`deviz_estimativ`) | A/P(`devize`,`deviz_estimativ`,`admin_devize`) | A/P(`admin_devize`) | RLS **OFF**; grant complet | UI filtrează modulele, dar orice client anonim poate CRUD/TRUNCATE toate devizele |
| `deviz_final_header` | Deviz final, Căutare, Constatare, Clienți, Dashboard, Manager, Admin | A/P(`deviz_final`,`cautare_deviz`,`clienti_notificari`,`manager_dashboard`,`admin_devize`) | A/P(`deviz_final`), inclusiv RPC | A/P(`deviz_final`) | A/P(`admin_devize`) | RLS **OFF**; grant complet | funcția RPC verifică permisiunea, dar inserarea directă în tabel nu este protejată |
| `deviz_final_linii` | Deviz final, Admin | A/P(`deviz_final`,`cautare_deviz`,`clienti_notificari`,`manager_dashboard`,`admin_devize`) prin antet | A/P(`deviz_final`) | necesitatea U direct este **?** | A/P(`deviz_final`) pentru refacerea liniilor; A/P(`admin_devize`) pentru ștergere administrativă | RLS **OFF**; grant complet | relația cu antetul nu produce automat autorizare; API permite orice mutație |
| `contracte` | Contracte, Dashboard | A/P(`contracte`) | aceleași | aceleași | — | RLS **OFF**; grant complet | UI nu oferă ștergere, API permite inclusiv D/TRUNCATE; fotografiile au o expunere Storage separată |
| `evidente_avansuri` | Avansuri, Clienți & Notificări, Dashboard | A/P(`avansuri`,`clienti_notificari`); P(`manager_dashboard`) pentru raportare | A/P(`avansuri`,`clienti_notificari`) | aceleași | aceleași, conform UI actual | RLS **OFF**; grant complet | filtrele UI nu se aplică API-ului |
| `evidente_avansuri_plati` | Avansuri, Clienți & Notificări, Dashboard, Manager | A/P(`avansuri`,`clienti_notificari`,`manager_dashboard`) | A/P(`avansuri`,`clienti_notificari`) | A/P(`avansuri`) | A/P(`avansuri`) | RLS **OFF**; grant complet | Manager ar trebui să citească pentru KPI, nu să modifice implicit |
| `plati_manager` | Cereri de plată, Dashboard, Manager | A/M/P(`manager_dashboard`): toate; P(`plati`): numai proprii | P(`plati`), `creat_de = auth.uid()`; A/M dacă fluxul o cere | A/M/P(`manager_dashboard`) pentru marcare plătit | A/M/P(`manager_dashboard`) și creatorul propriu numai cât statusul este `neplatit`; regula finală este **?** | RLS **OFF**; grant complet | UI filtrează non-managerii după `creat_de`, dar API nu; Managerul vede și poate șterge orice cerere neplătită în UI — intenția trebuie confirmată |

### 4.4 Service și personal

| Tabel | Module | SELECT recomandat | INSERT recomandat | UPDATE recomandat | DELETE recomandat | Protecție actuală | Diferență UI / acces real |
|---|---|---|---|---|---|---|---|
| `constatari` | Constatare, Deviz final, Clienți, Dashboard, Manager | A/P(`constatari`,`clienti_notificari`,`deviz_final`,`manager_dashboard`) | A/P(`constatari`) | A/P(`constatari`) | — până la confirmarea unei reguli de ștergere | RLS **OFF**; grant complet | UI ascunde modulul, dar orice client anonim poate citi/modifica/șterge fișe |
| `constatari_departamente` | Constatare, Clienți & Notificări | A/P(`constatari`,`clienti_notificari`); P(`manager_dashboard`) dacă KPI îl folosește ulterior | A/P(`constatari`) | A/P(`constatari`) | — | RLS **OFF**; grant complet | API nu reflectă permisiunea de modul |
| `constatari_asteptare_piese` | Constatare, Manager | A/P(`constatari`,`manager_dashboard`) | A/P(`constatari`) | A/P(`constatari`) | — | RLS **OFF**; grant complet | Manager are nevoie de citire pentru KPI, nu de mutații |
| `constatari_repartizari` | Constatare | A/P(`constatari`) pentru citire | **?** — codul actual inspectat nu creează repartizări | **?** | **?** | RLS **OFF**; grant complet | DB permite tot; UI curent doar citește repartizările active |
| `service_personal` | Constatare, Admin Echipe | A/P(`constatari`,`admin_echipe`) | A/P(`admin_echipe`) | A/P(`admin_echipe`) | —; ștergerea nu este flux confirmat | RLS **OFF**; grant complet | orice client anonim poate modifica personalul și ordinea, deși UI limitează tabul |

### 4.5 Piese, stoc și logistică

| Tabel/view | Module | SELECT recomandat | INSERT recomandat | UPDATE recomandat | DELETE recomandat | Protecție actuală | Diferență UI / acces real |
|---|---|---|---|---|---|---|---|
| `comenzi_piese_sh` | Comenzi SH, Deviz final, Clienți, Dashboard, Admin | A/P(`comenzi_piese_sh`); modulele dependente au nevoie de aceeași cheie sau de o politică read-only confirmată | A/P(`comenzi_piese_sh`), creator propriu | A/P(`comenzi_piese_sh`) | A | RLS **ON**; politici S/I/U pe permisiune, D numai Admin; `anon` nu are grant | este modelul cel mai apropiat de UI; Clienți/Deviz final pot fi blocate dacă au permisiunea lor, dar nu și `comenzi_piese_sh` |
| `stoc_produse` | Consumabile, Dashboard, Manager, Admin | A/P(`consumabile`,`magazie`,`admin_consumabile`,`manager_dashboard`) | A/P(`consumabile`,`admin_consumabile`) | A/P(`admin_consumabile`); dreptul utilizatorului Consumabile este **?** | — | RLS **OFF**; grant complet | UI separă operarea de administrare, API nu |
| `stoc_miscari` | Consumabile, Admin; sursă pentru dashboard/manager | A/P(`consumabile`,`magazie`,`admin_consumabile`,`manager_dashboard`) | A/P(`consumabile`,`admin_consumabile`) | **?** — fluxul normal adaugă mișcări, nu le rescrie | A/P(`admin_consumabile`) | RLS **OFF**; grant complet | API permite rescriere/ștergere anonimă a istoricului de stoc |
| `stoc_view_curent` | Consumabile, Dashboard, Manager | A/P(`consumabile`,`magazie`,`admin_consumabile`,`manager_dashboard`) | — | — | — | view fără `security_invoker`; owner `postgres`; grant complet inclusiv `anon` | view-ul poate ocoli viitorul RLS al tabelelor; granturile de scriere sunt inutile pentru agregare |
| `evidenta_awb` | AWB, Dashboard, Manager | A/P(`awb`,`magazie`,`manager_dashboard`) | A/P(`awb`,`magazie`) | aceleași | — | RLS **OFF**; grant complet | UI nu oferă D, API permite D/TRUNCATE și acces anonim |

### 4.6 Flotă și operațional

| Tabel | Module | SELECT recomandat | INSERT recomandat | UPDATE recomandat | DELETE recomandat | Protecție actuală | Diferență UI / acces real |
|---|---|---|---|---|---|---|---|
| `flota_auto` | Lista mașini, Dashboard, Admin Alerte, Edge alerte | A/P(`flota`,`lista_masini`,`admin_alerte`); service role Edge | A/P(`flota`,`lista_masini`,`admin_alerte`) | aceleași | **?** — politica permite, UI normal nu confirmă ștergerea | RLS **ON**; A/P(`flota`) CRUD | UI acceptă `lista_masini`, Admin acceptă `admin_alerte`, dar RLS recunoaște doar `flota`; posibile refuzuri legitime |
| `baza_vin` | Bază VIN | A/P(`baza_vin`) | aceleași | aceleași | **?** — politica permite, UI nu are flux D confirmat | RLS **ON**; A/P(`baza_vin`) CRUD | în general aliniat, exceptând D și fallback-ul UI `flota` |
| `detailing` | Detailing, Dashboard, Manager | A/P(`detailing`); P(`manager_dashboard`) pentru citire KPI | A/P(`detailing`) | aceleași | aceleași | RLS **ON**; A/P(`detailing`) CRUD | UI poate afișa modulul prin fallback `constatari`, dar RLS îl refuză; Manager Dashboard are nevoie de citire și depinde în prezent de permisiunea sa explicită `detailing` |
| `telefoane_clienti` | Registru Telefoane | A/P(`telefoane`) | aceleași | aceleași | aceleași | RLS **ON**; A/P(`telefoane`) CRUD | UI acceptă fallback `devize`; RLS nu îl acceptă |
| `generator_logs` | Generator, Dashboard, Manager | A/P(`generator`,`magazie`,`manager_dashboard`) | A/P(`generator`,`magazie`) | aceleași | — | RLS **ON**, dar politică `ALL TO public USING true WITH CHECK true` | acces anonim total; permission gate-ul UI nu are efect asupra datelor |
| `todo_tasks` | Admin TODO | A exclusiv | A exclusiv | A exclusiv | A exclusiv | RLS **ON**; orice utilizator autentificat are CRUD | regula de business este confirmată Admin-only; protecția actuală este prea largă |
| `admin_announcements` | Dashboard, Admin Megafon | toți utilizatorii autentificați pentru anunț activ; A/P(`admin_megafon`) pentru administrare | A/P(`admin_megafon`) | aceleași | aceleași | RLS **ON**; toate operațiile numai rol Admin | dashboardul tuturor încearcă să citească anunțul, dar non-Admin primește zero rânduri; delegarea `admin_megafon` este blocată de DB |
| `config_alerte` | Admin Alerte, Edge `trimite-alerte` | A/P(`admin_alerte`); service role Edge | **?** — configurația este singleton-ish | A/P(`admin_alerte`) | — | RLS **OFF**; grant complet | cheia `anon` poate citi/schimba emailurile de alertă; Edge folosește service role și nu depinde de RLS |

### 4.7 Dezmembrări

| Tabel | Module | SELECT recomandat | INSERT recomandat | UPDATE recomandat | DELETE recomandat | Protecție actuală | Diferență UI / acces real |
|---|---|---|---|---|---|---|---|
| `dezmembrari_items` | Captură mobilă, Desktop, Admin, Edge | A/P(`dezmembrari_manage`): toate; P(`dezmembrari_capture`): proprii | capture/manage, cu `created_by = auth.uid()` | manage | manage | RLS **ON**; exact această separare | aliniere bună; funcțiile de verificare sunt însă `SECURITY DEFINER` executabile prea larg |
| `dezmembrari_photos` | Captură, Desktop, Edge | manage toate; capture doar fotografii ale itemurilor proprii | capture proprii sau manage | manage | manage | RLS **ON**; două politici permisive INSERT și politici pe ownership/manage | logic aliniat; două politici INSERT se combină prin OR și sunt semnalate de advisor pentru performanță |

## 5. Storage și funcții — în afara celor 36 de tabele

### 5.1 Bucket `documente_contracte`

- bucket public;
- fără limită de mărime sau allowlist MIME;
- politici `SELECT`, `INSERT`, `UPDATE`, `DELETE` pentru rolul `public`, filtrate doar după numele bucket-ului;
- modulul folosește `getPublicUrl`, deci schimbarea la privat necesită adaptarea codului și a URL-urilor existente;
- accesul recomandat este A/P(`contracte`) pentru citire/upload, fără update/delete până la confirmarea fluxului.

### 5.2 Funcții SQL

- `private.has_hub_permission(text)` este `SECURITY DEFINER`, cu `EXECUTE` numai pentru `authenticated` și `search_path` fixat;
- `can_capture_dezmembrari()` și `can_manage_dezmembrari()` sunt `SECURITY DEFINER` și executabile de `PUBLIC`, `anon`, `authenticated`, `service_role`; corpul verifică `auth.uid()`, dar granturile sunt mai largi decât necesar;
- `handle_new_user()` este `SECURITY DEFINER`, are `search_path` nefixat și poate fi executată de roluri publice, deși este funcție trigger;
- `create_deviz_final_from_constatare()` este invoker, accesibilă `authenticated`/`service_role`, verifică `deviz_final` și creatorul; tabelele destinație fără RLS permit însă ocolirea RPC-ului.

### 5.3 Edge Functions

- `dezmembrari-photo-upload`: `verify_jwt=true`, revalidează utilizatorul și permisiunile; depinde de citirea profilului prin Data API;
- `trimite-alerte`: `verify_jwt=false`, nu are verificare alternativă în corp, folosește service role și poate declanșa emailuri prin Google Apps Script.

## 6. Cele mai importante diferențe UI–DB

1. cele 19 tabele fără RLS sunt accesibile direct, indiferent de UI;
2. `generator_logs` este public chiar dacă modulul are permission gate;
3. Constatarea necesită clienți/vehicule/contacte, dar politicile lor cer `clienti_notificari`;
4. anunțurile sunt citite de dashboard pentru toți, însă RLS le oferă numai Adminului;
5. fallback-urile UI `lista_masini→flota`, `detailing→constatari`, `telefoane→devize` și `baza_vin→flota` nu sunt toate reflectate în RLS;
6. Manager Dashboard este permis prin rol, dar tabelele nu au politici read-only dedicate;
7. cererile de plată sunt filtrate în browser pentru non-manageri, nu în DB;
8. Clienți & Notificări apare fără permission gate, deși datele cer `clienti_notificari`;
9. TODO este CRUD pentru orice autentificat, deși regula confirmată îl rezervă exclusiv Adminului;
10. `auth_profiles` permite modificarea directă a propriului obiect de permisiuni de către orice client care folosește cheia publică, deoarece RLS este oprit.

## 7. Necunoscute care blochează o matrice definitivă

- dacă Birou trebuie să aibă în mod implicit acces larg sau doar pe permisiuni individuale;
- dacă Manager poate șterge orice cerere de plată neplătită sau numai să o marcheze plătită;
- cine trebuie să poată vedea anunțurile; sarcinile TODO sunt confirmate exclusiv Admin;
- dacă fallback-urile istorice din UI sunt reguli intenționate sau doar compatibilitate temporară;
- cine poate șterge Flotă, Bază VIN, Constatare, Contracte, produse și personal;
- ce proiecție din profilurile altor utilizatori este necesară pentru afișarea numelor actorilor;
- dacă datele Manager Dashboard trebuie accesibile tuturor celor cu `manager_dashboard` sau numai rolului Manager/Admin;
- dacă modulul Clienți & Notificări trebuie scos din starea DEMO înainte de extinderea accesului.

Electrician, Tinichigiu și Mecanic sunt în afara scope-ului actual de politici pozitive. Dacă vor începe să folosească HUB-ul, accesul lor va necesita o decizie de business și o etapă separată, fără a fi anticipat acum.

## Actualizare 15.10.2026 — RPC-uri pentru Deviz final

| Obiect | Acces intenționat | Stare verificată / limită |
|---|---|---|
| `public.save_deviz_final` | `authenticated` cu Admin sau `deviz_final` | RPC invoker, salvare atomică; grantul pe tabel și RLS OFF permit încă mutații directe în afara lui |
| `public.list_deviz_final_importable_avansuri` | același profil | RPC invoker; listă filtrată după vehicul, review și revendicare; nu întoarce observații |
| `private.resolve_deviz_final_vehicle` | apel din RPC pentru același profil | definer cu rezultat ID; rezolvă lipsa permisiunii `clienti_notificari`, fără a lărgi politicile tabelului |
| `private.deviz_final_avans_review` | `authenticated` doar SELECT pe `avans_id`, `status` | scrierea rămâne pentru operațiuni DB/trigger; schema privată nu este Data API |

Rândurile vechi ale matricei pentru `deviz_final_*` descriu încă granturile largi și sunt valabile ca avertisment. Scenariul unui utilizator real cu numai `deviz_final` necesită test în browser. Frontendul LAB a fost actualizat și apelează acum RPC-urile; testul de acces cu profil real limitat rămâne necesar.


## Actualizare 18.10.2026 — seria 1, PREGĂTIT - NEAPLICAT

### Accesul seriei 1 (propunere, starea live rămâne neschimbată)

| Tabel | SELECT | INSERT | UPDATE | DELETE | Live 18.10.2026 |
|---|---|---|---|---|---|
| contracte | Admin / permisiune efectivă contracte | aceiași | aceiași | nimeni prin authenticated | OFF, zero politici, ALL anon/authenticated |
| todo_tasks | numai Admin | numai Admin | numai Admin | numai Admin | ON, patru politici permisive authenticated=true, ALL anon/authenticated |

Permisiunea efectivă Contracte reproduce UI: cheia contracte existentă trebuie să fie boolean true; fallback devize=true numai dacă cheia contracte lipsește. Manager și 4 Birou au contracte=true; Magazioner/Vopsitor contracte=false. TODO nu este delegabil. Aceasta este ținta pregătită, nu o afirmație despre accesul live securizat.


## Actualizare 18.10.2026 — RLS Seria 0 AUTH_PROFILES, PREGĂTIT - NEAPLICAT

Actualizare țintită: `auth_profiles` rămâne live RLS OFF, zero politici, ALL anon/authenticated. Ținta Seriei 0 este anon fără acces, user autentificat SELECT numai propriu, Admin SELECT toate și UPDATE numai nume/prenume/telefon/porecla/rol_id/permissions; fără I/D browser inclusiv Admin. Nu s-a identificat self-update legitim. `admin_useri` și `panou_control` nu deleagă administrarea. INSERT rămâne la triggerul Auth rol 3 (Birou). Loginul prin poreclă și citirea actorilor străini necesită adaptări înainte de aplicare. Detalii și matrice completă în documentul 21. `auth_roles` rămâne o vulnerabilitate separată, necorectată aici.
