# Plan de teste pentru securitate și controlul accesului

## Proveniența rezultatelor și artefacte indisponibile — 03.11.2026

Toate numerele PASS, loginurile, cleanup-urile și probele locale/PGlite/DOM din
secțiunile datate sunt **dovezi istorice**, nu teste executate pe checkout-ul curent.
Confirmările de producție rămân separat atribuite utilizatorului. Supabase live,
autorizarea efectivă, browserul și publicarea actuală sunt **NEEDS_REVIEW**.

Cele zece directoare de pachete din [10](10_PLAN_RLS.md), inclusiv README-urile și
fișierele `VERIFICATION_SUMMARY.json` enumerate în tabelul de mai jos, sunt
**absente din acest checkout**. Locațiile sunt păstrate în cod inline, fără
certificarea disponibilității rezultatelor originale. Scripturile istorice
`supabase/rls_seria_0_test.sql` și `supabase/rls_seria_1_test.sql` sunt și ele
indisponibile; migrațiile și celelalte scripturi Seria 0/1 sunt inventariate în
[INDEX](INDEX.md). Nu au fost importate artefacte și nu s-a rerulat nicio suită.

## Dovezi finale și separarea mediilor — 21.10.2026

Această rundă a fost **read-only în Supabase**, fără helper Auth, autentificări noi, fixture-uri sau teste CRUD/RPC repetate. S-au verificat catalogul live, politici, GRANT-uri, funcții/VIEW, Storage și istoricul migrărilor. Există 36/36 tabele publice RLS ON și 120 politici, identic în ambele medii.

### Teste LAB istorice, nu rezultate producție

| Lot | Dovezi LAB consemnate istoric | Cale istorică, relativă la rădăcină; indisponibilă aici |
|---|---|---|
| Surse roluri + Contracte | 84 verificări API; 8 loginuri native poreclă/email; scrieri privilegii refuzate non-Admin; trigger profil probat tranzacțional | `supabase/contracte-production-package-20261019/README.md` — README și rezultate absente aici |
| AWB | 57/57 API; arhivare, refuz DELETE, rollback/cleanup | `supabase/evidenta-awb-rls-20261019/README.md` — absent aici |
| Plăți Manager | 97/97 API; propriile cereri, Manager, manager_dashboard, plată/refuzuri | `supabase/plati-manager-rls-20261019/README.md` — absent aici |
| Stoc | 91/91: mișcări 29, produse 34, VIEW 28 | `supabase/stoc-rls-20261020/VERIFICATION_SUMMARY.json` — absent aici |
| Config alerte | 61/61 API; citire backend service_role fără sesiune HUB; fără trimitere email | `supabase/config-alerte-rls-20261020/README.md` — absent aici |
| Audit | 84/84 API; helper JS original, inserare și istoric contextual | `supabase/audit-logs-rls-20261020/VERIFICATION_SUMMARY.json` — absent aici |
| Personal | 65/65 API; relație cu repartizări și personal arhivat | `supabase/service-personal-rls-20261020/VERIFICATION_SUMMARY.json` — absent aici |
| Avansuri | 97/97 API; RPC DF real, blocări/recalculare/import, rollback | `supabase/avansuri-rls-20261020/VERIFICATION_SUMMARY.json` — absent aici |
| Constatări, 4 tabele | 182 API + 18 verificări suplimentare trecute; funcțiile originale de status și integrarea DF | `supabase/constatari-rls-20261021/VERIFICATION_SUMMARY.json` — absent aici |
| Devize, 3 tabele | **218/218 finale**: 201 API + 9 editare între creatori + 8 script print cu DOM minimal | `supabase/devize-rls-20261021/VERIFICATION_SUMMARY.json` — absent aici |

Rezultatele includ restaurarea permisiunilor fictive și cleanup-ul confirmat la data fiecărui lot. Nu se adună aceste numere într-un „PASS global producție”: probele au scopuri diferite și uneori continuări. Încercările inițiale oprite și corecțiile sunt păstrate transparent în rezultatele pachetelor.

### Confirmare funcțională în producție

Utilizatorul a confirmat finalizarea activării tuturor tabelelor planificate și testarea cu succes a ultimelor trei Devize. Catalogul actual confirmă starea RLS, politicile și GRANT-urile. Nu a fost furnizat aici un jurnal automat detaliat de scenarii/identități pentru producție; numerele de mai sus sunt numai LAB.

Afirmațiile istorice ale agentului „SQL producție NEAPLICAT” sunt corecte pentru momentul pregătirii; nu prevalează asupra citirii live actuale și confirmării ulterioare a utilizatorului.

### Limite păstrate

- Printul din ultima suită este verificare a scriptului original cu DOM minimal, nu probă vizuală browser/PDF.
- Nu s-au testat din nou AUTH, loginul, recuperarea parolei sau sesiunile. În lotul minim Auth, livrarea/finalizarea recuperării parolei nu a primit PASS; nu devine cerință pentru reluarea AUTH avansat.
- Nu s-a trimis email și nu s-a invocat cron/Edge/Apps Script. Citirea backend de alerte a fost verificată în lotul său; sursa Google rămâne inaccesibilă.
- Storage nu este echivalent între medii: bucket public + 4 politici în producție, niciun bucket/politică în LAB. PASS contracte de tabel nu este PASS al fișierelor.
- Flag-urile ON nu sunt teste negative pentru Generator/TODO sau GRANT TRUNCATE; acestea au restanțe confirmate prin catalog, vezi [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).
- Rezultatele vechi PGlite/mock/local pentru AUTH avansat nu sunt rezultate RLS live și rămân în arhiva suspendată.

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Arhivă — analize și planuri anterioare, suspendate în forma integrală

Materialul de mai jos este păstrat pentru dependențe, dovezi și comparație. Datele de audit și stările se referă la momentul consemnat; nu sunt instrucțiuni active. Exemplele SQL și secvențele AUTH nu se execută prin simpla lor prezență aici. Pentru decizia actuală prevalează secțiunea de mai sus și [stadiul curent](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

> **18.10.2026 — RLS Seria 0 AUTH_PROFILES: PREGĂTIT - NEAPLICAT.** Propunerea concretă pentru securizarea sursei rolurilor este în [21_RLS_SERIA_0_AUTH_PROFILES.md](21_RLS_SERIA_0_AUTH_PROFILES.md). Aplicarea cere adaptarea/validarea loginului prin User și a proiecțiilor de actori; nu se continuă cu Seria 1.


> **Actualizare 18.10.2026 — seria 1: PREGĂTIT - NEAPLICAT.** Pentru `contracte` și `todo_tasks`, propunerea concretă și prioritară este [20_RLS_SERIA_1_TABELE_SIMPLE.md](20_RLS_SERIA_1_TABELE_SIMPLE.md). Exemplele generale de mai jos rămân istoric și nu se execută pentru această serie. Starea live nu a fost modificată. Aplicarea este blocată de sursa autorizării (`auth_profiles` editabil fără RLS).


## 1. Scop

Scenariile de mai jos sunt definite pentru o implementare viitoare a planului RLS. Ele nu au fost executate în producție și nu au produs mutații în proiectul curent.

Testele trebuie să demonstreze simultan:

- că fluxurile legitime continuă să funcționeze;
- că accesul negativ este refuzat la nivel de DB/Storage/Edge, nu doar ascuns în UI;
- că un utilizator nu își poate acorda singur permisiuni;
- că Manager și modulele agregatoare primesc numai citire acolo unde nu au flux de scriere;
- că operațiile de ownership nu pot accesa rândurile altui utilizator.

Reguli de business confirmate pentru această suită: numai Admin gestionează utilizatori, roluri și permisiuni; numai Admin folosește `todo_tasks`; Mecanic, Electrician și Tinichigiu nu folosesc momentan HUB AUTO și nu primesc scenarii pozitive sau politici dedicate; fiecare tabel RLS este testat și lansat separat, cu rollback propriu.

## 2. Mediu și date de test

### 2.1 Reguli

- toate testele cu scrieri se execută într-un branch/staging Supabase;
- se folosesc date sintetice, fără nume, telefoane, VIN-uri, IBAN-uri sau documente reale;
- fiecare rând are un marker unic de test, unde schema permite;
- cheile `service_role` sunt folosite numai pentru setup/cleanup și niciodată în browser;
- testele de acces folosesc cheia publică plus JWT-ul contului testat;
- după fiecare suită se verifică numărul de rânduri și obiectele Storage orfane;
- înainte și după suită se rulează advisorii Supabase.

### 2.2 Conturi minime

| Cont | Rol | Permisiuni propuse pentru test |
|---|---|---|
| `t_admin` | Admin | rol 1; test de bypass și administrare |
| `t_manager` | Manager | `manager_dashboard`, `plati`; restul separat, nu implicit |
| `t_birou_devize` | Birou | `deviz_estimativ`, `cautare_deviz`, `deviz_final`, `avansuri`, `contracte`, `plati` |
| `t_birou_clienti` | Birou | `clienti_notificari`, `clienti_notificari_config`, `constatari` |
| `t_magazioner` | Magazioner | `magazie`, `awb`, `consumabile`, `generator`, plus ce aprobă proprietarul pentru flotă/VIN/telefoane |
| `t_vopsitor` | Vopsitor | configurația curentă observată: `constatari`, `detailing`, `consumabile`, `generator` |
| `t_electrician` | Electrician | cont negativ opțional; fără acces operațional dedicat |
| `t_tinichigiu` | Tinichigiu | cont negativ opțional; fără acces operațional dedicat |
| `t_mecanic` | Mecanic | cont negativ opțional; fără acces operațional dedicat |
| `t_dez_capture_1` | rol neprivilegiat | `dezmembrari_capture` |
| `t_dez_capture_2` | rol neprivilegiat | `dezmembrari_capture`, pentru test cross-owner |
| `t_dez_manage` | rol autorizat | `dezmembrari_manage` |
| `t_no_access` | Birou | toate permisiunile false/lipsă |

Pentru Electrician, Tinichigiu și Mecanic nu există profiluri active și businessul confirmă că nu folosesc momentan HUB AUTO. Nu se proiectează teste pozitive sau politici dedicate. Opțional, câte un test negativ confirmă că simpla existență a rolului nu acordă acces operațional.

## 3. Metoda de testare

Fiecare control are trei niveluri:

1. **UI:** card/tab vizibil sau ascuns și redirecționare corectă;
2. **Data API:** cerere directă cu JWT, independent de UI;
3. **integritate:** operația nu poate modifica ownership, rol, permisiuni sau coloane privilegiate.

Rezultatul așteptat pentru acces negativ este:

- SELECT: zero rânduri sau `42501`, conform grantului;
- INSERT/UPDATE/DELETE: `42501` ori zero rânduri, fără mutație;
- RPC/Edge: `401`/`403` și nicio modificare;
- Storage: upload/download refuzat și niciun obiect creat.

Un buton ascuns nu reprezintă rezultat suficient.

## 4. Teste comune tuturor rolurilor

| ID | Scenariu | Pași | Rezultat așteptat |
|---|---|---|---|
| AUTH-01 | Fără sesiune | deschide Dashboard și fiecare modul critic | redirecționare login; Data API public nu expune tabele |
| AUTH-02 | Credentiale greșite | login email și poreclă | mesaj generic; fără diferență care confirmă existența contului |
| AUTH-03 | Sesiune validă | login, refresh, tab nou | sesiunea rămâne validă și profilul propriu este citibil |
| AUTH-04 | Profil străin | SELECT/UPDATE direct pe UUID-ul altui utilizator | refuz, exceptând Admin pentru operația administrativă aprobată |
| AUTH-05 | Auto-escaladare | utilizator încearcă să seteze `rol_id=1` sau `permissions.admin_useri=true` | refuz și audit de securitate |
| AUTH-06 | Logout/expirare | logout și reutilizare token/request | cererea nu mai obține date conform politicii de sesiune adoptate |
| AUTH-07 | Timeout | 30 minute inactivitate pe pagini reprezentative | comportament uniform; excepția Admin trebuie confirmată separat |
| AUTH-08 — ISTORIC / SUSPENDAT | Poreclă | scenariu al vechiului proiect AUTH avansat, nu criteriu pentru loginul actual | prevedea mecanism nou fără SELECT anonim; în starea actuală se păstrează lookup-ul compatibil și loginul existent, conform [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md) |
| AUTH-09 | Cheie anon | cereri directe S/I/U/D pe toate tabelele publice | refuz pentru toate datele operaționale |

## 5. Scenarii pe rol

### 5.1 Admin

**Trebuie să poată:**

- deschide toate modulele și taburile Admin;
- gestiona profiluri și permisiuni;
- citi auditul;
- administra anunțuri, alerte, echipe, devize, stoc și Dezmembrări;
- șterge Comenzi SH conform fluxului Admin;
- vedea Manager Dashboard și marca plăți.

**Nu trebuie să poată prin clientul browserului:**

- modifica/șterge auditul dacă se adoptă modelul append-only;
- apela arbitrar funcții trigger;
- utiliza `TRUNCATE`, `TRIGGER` sau `REFERENCES` prin rolurile API;
- ocoli validările RPC pentru a crea date inconsistente, dacă operația este mutată într-un RPC dedicat.

| ID | Test | Așteptat |
|---|---|---|
| ADM-01 | CRUD profil test, fără schimbarea UUID-ului | permis exclusiv prin rolul Admin |
| ADM-02 | SELECT audit | permis |
| ADM-03 | UPDATE/DELETE audit direct | refuz |
| ADM-04 | CRUD anunț | permis; utilizatorii autentificați văd numai anunțul activ |
| ADM-05 | DELETE comandă SH | permis și FK-ul liniei de deviz devine `NULL` conform definiției |
| ADM-06 | acces Storage Contracte | permis numai prin fluxul aprobat |

### 5.2 Manager

Accesul confirmat prin cod este Manager Dashboard și Plăți; celelalte module depind de permisiuni explicite.

**Trebuie să poată:**

- vedea agregatele Manager pentru sursele aprobate;
- vedea toate cererile de plată;
- marca o cerere neplătită ca plătită;
- reveni la HUB prin `?hub=1`;
- accesa alte module numai dacă are cheia dedicată.

**Nu trebuie să poată implicit:**

- deschide Admin Utilizatori/Audit/Config;
- edita devize, stoc, constatări sau flotă doar datorită rolului 2;
- modifica sursele KPI prin Manager Dashboard, exceptând operația explicită de plată;
- modifica rolul sau permisiunile proprii.

| ID | Test | Așteptat |
|---|---|---|
| MGR-01 | login Manager | redirecționare la Manager Dashboard |
| MGR-02 | SELECT surse KPI | permis read-only pentru tabelele aprobate |
| MGR-03 | UPDATE aleator pe `constatari`/`stoc_miscari` | refuz fără permisiunea modulului |
| MGR-04 | marchează plată | numai `neplatit→platit`, `platit_de=auth.uid()` |
| MGR-05 | schimbă IBAN/sumă prin UPDATE direct | refuz; necesită RPC/column privileges dacă se dorește garanție strictă |
| MGR-06 | Admin utilizatori | refuz |

### 5.3 Birou

Rolul Birou nu trebuie să acorde singur toate funcțiile. Se testează cel puțin două profiluri cu seturi diferite.

**Cu permisiunile de devize:**

- creare/editare Deviz estimativ;
- căutare;
- creare/editare Deviz final;
- Avansuri, Contracte și propriile cereri de plată;
- fără acces automat la Admin, Stoc sau Dezmembrări.

**Cu permisiunile clienți/service:**

- registru client/vehicul/contact;
- Constatare și tabele dependente;
- configurarea notificărilor numai cu cheia separată;
- fără acces la profilurile altor utilizatori.

| ID | Test | Așteptat |
|---|---|---|
| BIR-01 | permisiune prezentă | UI vizibil și API permis pentru operațiile modulului |
| BIR-02 | permisiune eliminată | card ascuns și API refuzat după refreshul sesiunii/profilului |
| BIR-03 | numai `constatari`, fără `clienti_notificari` | fluxul client/vehicul al Constatare funcționează dacă planul matricei este aprobat |
| BIR-04 | numai `clienti_notificari`, fără config | poate opera clienți/termene, nu poate schimba config/șabloane |
| BIR-05 | cereri plată | vede și șterge numai propriile cereri neplătite |

### 5.4 Magazioner

Configurația observată include `magazie`, `awb`, `consumabile`, `generator`, `piese_stoc`, plus Flotă/VIN/Telefoane. Ultimele trebuie confirmate ca intenție.

**Trebuie să poată, dacă permisiunile rămân aprobate:**

- AWB S/I/U;
- produse și mișcări de stoc conform separării operator/admin;
- Generator S/I/U;
- Piese stoc Google Sheets (în afara Supabase);
- fără ștergerea istoriei de stoc.

| ID | Test | Așteptat |
|---|---|---|
| MAG-01 | intrare/ieșire/ajustare stoc | insert permis; view recalculat |
| MAG-02 | UPDATE/DELETE mișcare veche | refuz fără `admin_consumabile` |
| MAG-03 | AWB | S/I/U permis, D refuzat |
| MAG-04 | Generator | S/I/U permis, D refuzat |
| MAG-05 | Devize/Contracte/Admin | refuz fără permisiuni explicite |

### 5.5 Vopsitor

Profilul observat are `constatari`, `detailing`, `consumabile`, `generator`.

| ID | Test | Așteptat |
|---|---|---|
| VOP-01 | login | redirecționare la Detailing |
| VOP-02 | Detailing CRUD | permis conform permisiunii dedicate |
| VOP-03 | Constatare | permis numai pentru operațiile aprobate; accesul la clienți trebuie să funcționeze |
| VOP-04 | Consumabile/Generator | permis conform cheilor |
| VOP-05 | Devize finale/Contracte/Admin | refuz fără chei explicite |

### 5.6 Mecanic

Nu există profil curent, iar rolul nu folosește momentan HUB AUTO. Redirecționarea existentă către Constatare este o observație de cod, nu o regulă de acces care trebuie proiectată acum.

| ID | Configurație | Așteptat |
|---|---|---|
| MEC-01 | rol Mecanic fără permisiuni | acces operațional DB refuzat |
| MEC-02 | URL direct Constatare/Deviz | refuz; rolul singur nu acordă acces |

Orice activare viitoare a rolului Mecanic va necesita o misiune separată de business, matrice, politici și teste.

### 5.7 Electrician și Tinichigiu

Rolurile nu folosesc momentan HUB AUTO. Nu se proiectează politici dedicate; se pot păstra doar teste negative de neacordare implicită.

| ID | Test | Așteptat înainte de decizie |
|---|---|---|
| ELE-01 / TIN-01 | login fără permisiuni | datele operaționale sunt refuzate |
| ELE-02 / TIN-02 | acces direct Constatare | refuz fără `constatari` |

### 5.8 Utilizator cu captură Dezmembrări

| ID | Test | Așteptat |
|---|---|---|
| DZC-01 | creare item propriu | permis; `created_by=auth.uid()` |
| DZC-02 | citire item propriu | permis |
| DZC-03 | citire item al altui capturator | refuz |
| DZC-04 | upload foto pe item propriu | permis prin Edge și RLS |
| DZC-05 | upload foto pe item străin | refuz |
| DZC-06 | update/delete item | refuz fără manage |
| DZC-07 | URL semnat pentru foto străină | refuz |

### 5.9 Utilizator cu management Dezmembrări

Trebuie să poată citi/actualiza/șterge itemuri și fotografii, inclusiv create de capturatori. Ștergerea permanentă prin Edge rămâne rezervată Adminului dacă această regulă se păstrează.

## 6. Fluxuri critice

### 6.1 Autentificare

1. login email pentru fiecare rol;
2. login poreclă, fără expunere de profil;
3. redirecționări Mecanic/Vopsitor/Manager;
4. `returnTo` same-origin;
5. profil propriu și rol;
6. acces negativ direct la alt profil;
7. resetare parolă și sesiune recovery;
8. logout și token expirat.

### 6.2 Devize

| ID | Actor | Acțiune | Așteptat |
|---|---|---|---|
| DEV-01 | P(`deviz_estimativ`) | creare cu `created_by` propriu | permis |
| DEV-02 | fără permisiune | INSERT direct | refuz |
| DEV-03 | P(`cautare_deviz`) | SELECT estimativ/final | permis read-only |
| DEV-04 | P(`deviz_final`) | import/edit antet și linii | permis |
| DEV-05 | P(`deviz_final`) | RPC din Constatare | tranzacție completă, un singur antet |
| DEV-06 | fără `deviz_final` | RPC | `42501`, zero rânduri noi |
| DEV-07 | P(`admin_devize`) | ștergere administrativă | permis conform ordinii FK |
| DEV-08 | utilizator obișnuit | DELETE direct | refuz |

### 6.3 Constatare

1. căutare vehicul existent;
2. creare client, vehicul și contact nou;
3. creare fișă și număr;
4. actualizare snapshot/client/vehicul;
5. creare/actualizare departamente;
6. intrare/ieșire din „Așteptare piese”;
7. citire personal și repartizări;
8. audit propriu;
9. preview și RPC Deviz final;
10. utilizator fără permisiune încearcă fiecare endpoint direct.

Pentru fiecare pas se verifică atât succesul, cât și absența rândurilor parțiale după eroare.

### 6.4 Comenzi piese SH

| ID | Scenariu | Așteptat |
|---|---|---|
| SH-01 | creator cu permisiune inserează | permis; `created_by` propriu |
| SH-02 | falsifică `created_by` | refuz |
| SH-03 | update status/arhivare | permis; triggerul rescrie `updated_by` și metadatele |
| SH-04 | non-Admin DELETE | refuz |
| SH-05 | Admin DELETE | permis |
| SH-06 | modul dependent fără `comenzi_piese_sh` | rezultatul dorit este **?**; decideți read-only separat |

### 6.5 Contracte și Storage

1. P(`contracte`) listează și creează contract;
2. upload JPEG valid sub limita stabilită;
3. upload MIME nepermis sau prea mare — refuz;
4. utilizator fără permisiune nu poate lista contractele, citi obiectul sau încărca;
5. URL semnat expiră;
6. path-ul altui contract nu oferă acces fără permisiune;
7. finalizare contract;
8. DELETE obiect/contract — refuz până la aprobarea fluxului;
9. obiect vechi și obiect migrat sunt ambele accesibile utilizatorului autorizat.

### 6.6 Stoc

1. operatorul creează produs dacă regula rămâne aprobată;
2. adaugă intrare, ieșire și ajustare;
3. view-ul calculează stocul corect;
4. Manager vede view-ul, nu poate insera/șterge;
5. Magazioner nu poate rescrie/șterge istoria;
6. `admin_consumabile` poate corecta operația aprobată;
7. anon/fără permisiune nu vede produse sau view;
8. exportul PDF continuă să funcționeze.

### 6.7 Flotă și alerte

| ID | Actor | Așteptat |
|---|---|---|
| FLT-01 | P(`flota`) | S/I/U conform modulului |
| FLT-02 | numai P(`lista_masini`) | rezultat conform deciziei asupra fallback-ului |
| FLT-03 | P(`admin_alerte`) | poate citi/actualiza configurația și flota dacă este aprobat |
| FLT-04 | fără permisiune | acces direct refuzat |
| FLT-05 | cron autenticat | citește cu service role și trimite numai pragurile așteptate |
| FLT-06 | apel extern fără secret/JWT | refuz; zero emailuri |
| FLT-07 | apel duplicat în aceeași zi | comportament idempotent sau duplicarea este semnalată — regula trebuie implementată/confirmată |

### 6.8 Manager Dashboard

Pentru fiecare sursă (`deviz_final_header`, plăți avans, AWB, view stoc, Detailing, Constatare, așteptări, Generator, Plăți Manager):

- Manager/Admin primesc SELECT;
- contul fără `manager_dashboard` nu primește date prin apel direct;
- Manager nu primește I/U/D, exceptând operația aprobată pe plată;
- valorile KPI corespund agregatelor SQL de control;
- o politică blocată nu este mascată drept zero legitim; UI trebuie să distingă eroarea de lipsa datelor.

### 6.9 Administrare utilizatori

| ID | Scenariu | Așteptat |
|---|---|---|
| USR-01 | Admin listează profiluri | permis |
| USR-02 | utilizator fără permisiune deschide URL direct | UI și DB refuză |
| USR-03 | non-Admin cu `admin_useri` sau `panou_control` modifică rol/permisiuni | refuz; cheile istorice nu delegă managementul identității |
| USR-04 | utilizator își modifică singur JSON-ul | refuz |
| USR-05 | modifică UUID/email Auth prin tabel | refuz; `auth.users` nu este accesat direct |
| USR-06 | panou_control vs admin.html | aceleași rezultate pentru operațiile comune |
| USR-07 | rol nou implicit | profilul primește rolul decis, nu comentariul eronat „Mecanic” |

## 7. Teste pentru politici existente

### 7.1 Anunțuri

- autentificat obișnuit vede numai anunțul activ;
- `admin_megafon` poate CRUD;
- utilizator obișnuit nu poate crea/dezactiva/șterge;
- anon nu poate citi.

### 7.2 Generator

- anon nu poate S/I/U/D;
- P(`generator`) poate S/I/U;
- Manager are numai SELECT prin `manager_dashboard`;
- DELETE este refuzat.

### 7.3 TODO

- Admin are CRUD complet;
- orice utilizator non-Admin este refuzat, inclusiv dacă are o permisiune `admin_*`;
- nu se introduce și nu se testează o delegare `admin_todo`.

### 7.4 Fallback-uri

Se rulează câte un cont care are numai cheia fallback, nu și cheia nouă:

- `flota` fără `lista_masini`;
- `constatari` fără `detailing`;
- `devize` fără `telefoane`;
- `flota` fără `baza_vin`.

Rezultatul nu se declară „pass” până când proprietarul nu spune care fallback rămâne intenționat.

## 8. Teste directe de securitate

| ID | Atac simulat | Rezultat așteptat |
|---|---|---|
| SEC-01 | cheia `anon` listează fiecare tabel | toate refuzate/zero |
| SEC-02 | utilizator schimbă `permissions`/`rol_id` propriu | refuz |
| SEC-03 | utilizator falsifică `created_by`, `updated_by`, `platit_de` | refuz sau suprascriere server-side |
| SEC-04 | IDOR: citește/updatează ID cunoscut din alt ownership | refuz |
| SEC-05 | apelează funcții `SECURITY DEFINER` ca anon | refuz pentru funcțiile care nu trebuie publice |
| SEC-06 | apelează `handle_new_user()` direct | fără privilegiu EXECUTE |
| SEC-07 | citește view stoc fără permisiune | refuz; view respectă RLS invoker |
| SEC-08 | upload/delete Storage fără permisiune | refuz |
| SEC-09 | invocă `trimite-alerte` fără secret | refuz și zero mesaje |
| SEC-10 | UPDATE mută un rând în afara scope-ului | `WITH CHECK` refuză |
| SEC-11 | operație cu token expirat | refuz |
| SEC-12 | încearcă `TRUNCATE`/funcții administrative prin rol API | privilegiu absent |

## 9. Teste de regresie și integritate

- fiecare FK rămâne valid după operații;
- triggerul Comenzi SH păstrează creatorul și setează updaterul;
- RPC Deviz este atomic la payload invalid;
- un eșec de upload Contracte nu creează contract cu URL invalid și are cleanup definit;
- un eșec R2/Drive nu lasă metadate foto care indică obiect inexistent;
- dashboardul diferențiază „fără date” de „acces refuzat”;
- indexurile și timpii de răspuns nu se degradează material după RLS;
- politicile nu se dublează permisiv după migrare;
- `service_role` continuă să funcționeze numai în Edge/backend;
- Realtime, dacă va fi activat, livrează numai rândurile vizibile prin RLS.

## 10. Criterii de acceptare pe etapă

O etapă poate fi promovată numai dacă:

1. toate testele pozitive ale modulelor afectate trec;
2. toate testele negative directe trec;
3. nu există `42501` neexplicat în loguri;
4. nu există diferențe neaprobate de număr de rânduri;
5. advisorii nu introduc probleme noi de securitate;
6. SQL-ul de rollback a fost testat pe branch;
7. proprietarul a aprobat necunoscutele de business pentru etapa respectivă;
8. rezultatele sunt salvate lângă migrare.

O etapă conține un singur tabel pentru activarea sau rescrierea RLS. Tabelul următor intră în lucru numai după promovarea sau rollbackul complet al celui curent.

## 11. Necunoscute care trebuie transformate în teste aprobate

- accesul rolului Birou implicit versus exclusiv permisiuni individuale;
- dreptul Managerului de a șterge cereri neplătite;
- vizibilitatea anunțurilor; TODO este confirmat exclusiv Admin;
- fallback-urile istorice;
- ștergerile pentru Flotă, VIN, Constatare, Contracte și personal;
- acces read-only la Comenzi SH din Deviz final și Clienți;
- scope-ul profilurilor altor utilizatori afișate ca actori;
- dacă `manager_dashboard` poate fi delegat oricărui rol sau numai Managerului;
- comportamentul dorit pentru datele DEMO din Clienți & Notificări.

## 12. Scenarii adăugate pentru Avansuri și Deviz final — 15.10.2026

În mediu izolat sau cu înregistrări dedicate aprobate, testați: utilizator `authenticated` cu `deviz_final` dar fără `clienti_notificari` (lookup + salvare); utilizator fără `deviz_final` (refuz); înmatriculare ambiguă, vehicul lipsă și VIN diferit (mesaje distincte); avans istoric nerevizuit/`confirmed_used` (refuz); avans nou cu review creat de trigger (acceptare); revendicare de alt deviz (refuz inclusiv concurent); plăți multiple și reîmprospătarea explicită a sumei; rollback la eroare târzie/deadlock; păstrarea `constatare_id` și a linkurilor SH la actualizare; print cu/fără avans.

Proba SQL Editor din jurnal a avut opt postverificări `true` conform capturii utilizatorului, dar testele concurente în sesiuni separate, erorile de rețea și un test browser cu profil limitat sunt **NECONFIRMATE**. Proba SQL nu substituie sesiunea reală și nu trebuie rerulată pe datele DF-199/200/201 sau AV-43/55/56.


## Actualizare 18.10.2026 — seria 1, PREGĂTIT - NEAPLICAT

### Teste concrete seria 1

Matricea completă S/I/U/D și lista de verificări obligatorii sunt în documentul 20. Contracte: Admin, Manager și fiecare cont Birou actual S/I/U permis, D respins; Magazioner/Vopsitor/fără permisiune/anon respinși. Fallback devize numai când lipsește cheia contracte. TODO: numai Admin CRUD; toate celelalte identități respinse. Verificați separat false, null, string true, profil absent și Auth anonymous.

`supabase/rls_seria_1_test.sql` se rulează numai pe clonă/local după migrare, cu owner pentru setup și SET ROLE pentru probe; testează toate profilurile prezente, nu le modifică. Fixture-urile candidate și funcțiile temporare sunt anulate. Nu se rulează pe producție. În mediul local sintetic PostgreSQL 17.5 au trecut 96 probe CRUD, reaplicarea și restaurarea baseline-ului. Testele UI, JWT/Data API real, Storage și ale clonei complete sunt NEEXECUTATE.

Blocaj înainte de rollout: confirmați că profilul/rolul/permisiunile nu pot fi falsificate prin API/RPC. Preflight-ul migrației refuză starea live actuală. Succesul unui UPDATE fără eroare nu dovedește acces: verificați rândurile afectate și recitirea. În browser testați sesiunea Contracte, badge, creare, poze, salvare/finalizare și TODO completare/redeschidere/ștergere.


## Actualizare 18.10.2026 — RLS Seria 0 AUTH_PROFILES, PREGĂTIT - NEAPLICAT

Matricea completă pentru Seria 0 și planul Data API/browser sunt în documentul 21; SQL izolat: `supabase/rls_seria_0_test.sql`. Local au trecut 135 probe S/I/U/D/coloane/helper și 7 bootstrap-uri prin trigger cu metadata malițioasă ignorată, pe PostgreSQL 17.5 PGlite. S-au verificat lipsa recursiei prin 24 politici existente, preflight-ul și rollback-ul repetat. Baseline-ul fixture-ului a fost adaptat numai în memoria runnerului; fișierul livrat păstrează baseline live. Login email/User, signup Auth API, JWT/Data API real și UI nu au fost testate și rămân condiții obligatorii. Nicio scriere sau impersonare în Supabase. Seria 1 nu a fost continuată.
