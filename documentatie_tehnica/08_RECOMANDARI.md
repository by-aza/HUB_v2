# Recomandări

## Concluzie și limite — 21.10.2026

Activarea planificată este finalizată: 36/36 tabele publice RLS ON în producție și LAB. Nu există următor tabel public de „pornit” în lotul documentat.

HUB AUTO este aplicația internă simplă a colegilor. Se păstrează loginul poreclă/email + parolă. AUTH avansat/Turnstile sunt SUSPENDATE. Nu se propun infrastructură nouă, autentificare suplimentară sau extinderi.

Rămân numai intervenții punctuale de discutat separat:
1. GRANT-urile TRUNCATE nefolosite pe 16 tabele.
2. Politica publică Generator și diferența TODO authenticated față de regula Admin-only.
3. Accesul public S/I/U/D la fișierele Contracte în producție.
4. Reconcilierea diferențelor frontend funcționale cu proiectul principal, fără configurația LAB și fără cod AUTH suspendat.

Acestea sunt constatări/documentare, nu autorizare sau implementare de remediere. Nu se refac module deja testate și nu se reexecută migrările active. Vezi [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md) și [23_INVENTAR_TRANSFER_PRODUCTIE.md](23_INVENTAR_TRANSFER_PRODUCTIE.md).

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Context istoric și detalii de implementare

Secțiunile de mai jos păstrează auditul și actualizările datate. Inventarele, numerele și formulările „actual/live” rămase în acest context nu sunt o nouă verificare a LAB sau a producției; stadiul documentat la 21.10.2026 este cel precizat mai sus.

## 1. Cum se citesc recomandările

Aceste propuneri nu au fost implementate. Eforturile sunt orientative:

- **S:** până la 1 zi de lucru;
- **M:** 2–5 zile;
- **L:** 1–3 săptămâni;
- **XL:** inițiativă etapizată de peste 3 săptămâni.

Riscul indică riscul schimbării recomandate dacă este executată fără pregătirea menționată, nu doar gravitatea problemei curente.

## 2. Performanță

| Recomandare | Problema observată | Impact așteptat | Riscul schimbării | Efort | Prioritate |
|---|---|---|---|---|---|
| Indexarea FK pe baza interogărilor reale | 22 chei străine fără index dedicat | join-uri, cascade și filtre mai stabile la volum mare | Mediu: indecșii cresc costul scrierilor; trebuie măsurare | M | P1 |
| Optimizarea politicilor RLS | advisorul semnalează apeluri repetate `auth.uid()` | cost mai mic per rând și politici mai scalabile | Mediu: o rescriere greșită poate schimba accesul | M | P1, după testele de acces |
| Inventarierea pollingului și Realtime | abonamente definite, publicație goală; dashboardul face polling la 60 s | trafic mai mic și actualizări predictibile | Mediu: activarea Realtime poate dubla refreshul sau expune evenimente | M | P2 |
| Limitarea interogărilor dashboardului | dashboardul citește multe tabele pentru badge-uri/căutare | pornire mai rapidă și mai puține cereri | Mediu: agregările trebuie să păstreze exact semantica | M–L | P2 |
| Măsurarea indecșilor raportați nefolosiți | 15 indecși marcați nefolosiți | reducerea costului de scriere/spațiu numai unde este justificat | Ridicat dacă se șterg fără perioadă de observare | M | P3 |
| Pinning și livrare controlată a resurselor | dependențe CDN nefixate și Tailwind Play runtime | încărcare reproductibilă și cache mai bun | Scăzut–Mediu: pot apărea diferențe vizuale | M | P2 |

## 3. Curățenie proiect

| Recomandare | Problema observată | Impact așteptat | Riscul schimbării | Efort | Prioritate |
|---|---|---|---|---|---|
| Clasificarea și apoi arhivarea fișierelor `.orig`, `Untitled` și placeholder | surse active și artefacte istorice sunt amestecate | reduce riscul de editare/deploy greșit | Scăzut, dacă se confirmă lipsa referințelor înainte | S | P2 |
| Inventar oficial „activ / istoric / referință” | folderul `Pagini NOI` și documentele vechi descriu stări diferite | sursă de adevăr clară pentru echipă | Scăzut | S | P1 |
| Separarea treptată a scripturilor inline | Admin, Deviz și alte pagini au logică foarte mare în HTML | review, testare și depanare mai ușoare | Mediu: ordinea globalelor și evenimentelor poate fi ruptă | L | P2 |
| Centralizarea configurației Supabase | URL-ul/cheia/clientul sunt duplicate | deploy și rotație coerente | Mediu: toate paginile trebuie migrate și testate | M | P1 |
| Catalog unic de statusuri și permisiuni | stringuri/fallback-uri repetate în cod | mai puține erori de scriere și divergențe | Mediu: compatibilitatea cu date istorice trebuie păstrată | M | P2 |
| Corectarea markupului placeholder | taguri `</script>` fără pereche | HTML valid și mai puțină confuzie | Scăzut | S | P3 |

## 4. Securitate / acces

> **Plan istoric SUSPENDAT în forma avansată.** Pasajele de mai jos se păstrează ca raționament tehnic, nu ca instrucțiuni de continuare a `hub-login`, Turnstile/CAPTCHA sau limiterului custom. Loginul existent, rolurile și protecțiile RLS active se păstrează; riscurile rămân documentate. Decizia actuală este în [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

| Recomandare | Problema observată | Impact așteptat | Riscul schimbării | Efort | Prioritate |
|---|---|---|---|---|---|
| Plan RLS incremental, tabel cu tabel | date sensibile expuse în schema publică fără RLS | control server-side real, cu test și rollback independent pentru fiecare tabel | Ridicat: poate opri module; este interzisă o migrare masivă | L–XL | P0 |
| Restrângerea bucket-ului Contracte | bucket și politici publice CRUD, fără limite | protecția documentelor și reducerea uploadului abuziv | Ridicat: URL-urile publice curente trebuie înlocuite cu URL-uri semnate | L | P0 |
| Protejarea `trimite-alerte` | endpoint fără JWT, intern cu service role | previne invocarea neautorizată și spamul | Mediu: cronul trebuie adaptat cu secret verificabil | M | P0 |
| RLS/minimizare pentru `auth_profiles` | profilurile pot fi citite înainte de login | reduce enumerarea și expunerea PII | Ridicat: loginul prin poreclă are nevoie de RPC sigur dedicat | M–L | P0 |
| Revizuirea funcțiilor Security Definer | EXECUTE larg și search_path mutabil | suprafață privilegiată mai mică | Mediu: revocările trebuie corelate cu apelurile reale | M | P1 |
| Convertirea view-ului de stoc la invoker | advisorul semnalează Security Definer view | permisiuni evaluate ca utilizatorul curent | Mediu–Ridicat: poate schimba rezultatele după RLS | M | P1 |
| Politici specifice pentru Generator și TODO | Generator are `ALL true`; TODO personal Admin-only este CRUD pentru orice autentificat | Generator aliniat permisiunilor și TODO accesibil exclusiv Adminului | Mediu | M | P1 |
| Rezervarea managementului identității pentru Admin | `admin_useri`/`panou_control` pot delega în cod gestionarea profilurilor și permisiunilor | regula de business este impusă server-side; non-Admin nu poate administra identități | Ridicat: loginul și afișarea actorilor trebuie păstrate | M–L | P0 |
| Audit protejat și append-only | auditul poate fi incomplet/alterabil | trasabilitate operațională credibilă | Mediu: modulele trebuie să poată insera fără a citi/modifica larg | M–L | P1 |
| Activarea protecției pentru parole compromise | opțiunea Auth este dezactivată | risc mai mic de credential stuffing | Scăzut–Mediu: unii utilizatori pot trebui să schimbe parola | S | P1 |
| Politică unică de sesiune | timeoutul este inclus neuniform și Admin este exceptat | comportament previzibil pe toate paginile | Mediu: impact operațional pentru sesiuni lungi | M | P2 |

Ordinea aprobată pentru RLS este: selectarea unui singur tabel → captură baseline → politică în mediu de test → teste pozitive și negative → rollback verificat → rollout controlat → monitorizare; numai apoi se trece la tabelul următor. Mecanic, Electrician și Tinichigiu nu intră în proiectarea politicilor acestei etape, deoarece nu folosesc momentan HUB AUTO.

## 5. Mentenanță

| Recomandare | Problema observată | Impact așteptat | Riscul schimbării | Efort | Prioritate |
|---|---|---|---|---|---|
| Aducerea tuturor migrărilor remote în repo | schema live a evoluat; LAB are două fișiere Avansuri neversionate, peste migrarea veche | reproducere, review și recuperare corectă | Mediu: baseline-ul trebuie generat fără a reaplica obiectele | M | P0 |
| Tipuri generate din Supabase | coloanele sunt consumate fără contract static | detectarea timpurie a driftului | Scăzut | M | P1 |
| Teste smoke per rol și modul | nu există suită automată identificată | regresii detectate înainte de producție | Scăzut | L | P1 |
| Teste pentru fluxurile critice | Constatare→Deviz, SH, Contracte și Dezmembrări sunt multi-pas | protejează integritatea operațională | Mediu: necesită mediu/date de test | L | P1 |
| Monitorizare Edge și integrări externe | R2/Drive/OCR/Apps Script pot eșua independent | detectare rapidă și recuperare | Scăzut–Mediu | M | P1 |
| Runbook pentru secrete și servicii | procedura de rotație/ownership nu este în repo | continuitate și răspuns la incidente | Scăzut | S–M | P1 |
| Definirea retenției și backupului | audit, documente și notificări nu au reguli documentate | cost controlat și conformitate | Mediu: ștergerea trebuie aprobată business/juridic | M | P2 |
| Clarificarea celor două panouri Admin | administrarea utilizatorilor există în două interfețe | reduce divergența și erorile | Mediu: întâi se compară funcțiile utilizate | M | P2 |
| Versionarea sursei `trimite-alerte` | funcția activă nu are sursă locală | deploy reproductibil și review | Scăzut, dacă se exportă exact versiunea curentă | S–M | P0 |
| Documentarea contractelor externe | CSV, Apps Script, OCR, Drive/R2 au contracte implicite | depanare și schimbare furnizor mai sigure | Scăzut | M | P2 |

## 6. Oportunități pentru Manager Dashboard

Noul Manager este integrat în LAB și a înlocuit funcțional vechiul Manager. Utilizatorul a raportat testare manuală pozitivă, inclusiv pe alți utilizatori, la 16.10.2026. Propunerile rămase vizează consolidarea ulterioară; documentul 18 descrie contractul actual, iar documentul 19 lista finală de deploy.

| Recomandare | Problema observată | Impact așteptat | Riscul schimbării | Efort | Prioritate |
|---|---|---|---|---|---|
| Dicționar KPI aprobat de business | contractul KPI este documentat în documentul 18; orice extindere necesită definiții explicite | aceeași definiție pentru management și echipă | Scăzut | M | P1 |
| Etichetarea prospețimii și sursei | Realtime neconfirmat, date din mai multe tabele | utilizatorul știe când și de unde provin cifrele | Scăzut | S–M | P1 |
| Fără mock/demo în Manager — REZOLVATĂ în LAB | versiunea finală folosește surse reale și stări indisponibile explicite | păstrarea regulii la extinderi | Scăzut | — | Închis în LAB |
| Filtre temporale și operaționale coerente | modulele au date/statusuri diferite | analiză comparabilă pe perioadă, departament și responsabil | Mediu: semantica datelor istorice trebuie validată | M–L | P2 |
| Drill-down controlat | agregatele nu oferă mereu traseu către rândurile sursă | verificare rapidă a excepțiilor | Mediu: trebuie respectate permisiunile de detaliu | M | P2 |
| View-uri/RPC read-only pentru agregări | dashboardul citește multe tabele direct | performanță și contract de date stabil | Mediu–Ridicat: securitatea view-urilor trebuie proiectată corect | L | P2 |
| Indicatori de calitate a datelor | statusuri nealiniate/rânduri incomplete pot distorsiona KPI | managementul vede și încrederea în date | Scăzut | M | P2 |
| Export managerial auditat | nu există un flux oficial de raport | raportare repetabilă și trasabilă | Mediu: conține date sensibile | M | P3 |

## 7. Oportunități pentru un posibil HUB AUTO v3 în React

> **Opțiuni istorice, fără proiect de implementare aprobat.** Nu implică migrarea la React, build sau infrastructură nouă. Direcția actuală de simplitate este în [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

| Recomandare | Problema observată | Impact așteptat | Riscul schimbării | Efort | Prioritate |
|---|---|---|---|---|---|
| Definirea întâi a contractului de domeniu | v2 amestecă UI, statusuri și schema | fundație stabilă pentru orice React | Scăzut | M | P1 pentru faza de proiectare |
| Migrare incrementală, nu rescriere totală | v2 are multe fluxuri reale și excepții ascunse | păstrează continuitatea operațională | Mediu; necesită coexistare temporară | XL | P1 |
| Pachet comun de Auth/permisiuni | verificările sunt duplicate pe pagini | garduri de rută și comportament unitar | Mediu | L | P1 |
| Client Supabase tipizat și strat de servicii | accesul direct este dispersat | testare, observabilitate și schimbări controlate | Mediu | L | P1 |
| Design system/component library | CSS/Tailwind/inline sunt amestecate | consistență și viteză de dezvoltare | Mediu: evitarea schimbărilor vizuale accidentale | L | P2 |
| Route/module boundaries după domeniu | MPA curentă nu impune limite de cod | ownership și lazy loading clare | Mediu | L | P2 |
| Strategie de migrare a printului | printul curent depinde de `localStorage` | documente reproductibile și testabile | Mediu | M–L | P2 |
| Mediu staging cu date sintetice | testarea live este riscantă | validare reală a RLS și fluxurilor fără producție | Mediu | L | P0 înainte de migrare |
| Observabilitate și error boundaries | erorile CDN/API sunt tratate local | diagnostic central și experiență robustă | Scăzut–Mediu | M | P2 |
| Folosirea prototipului React doar ca referință UX | prototipul Clienți & Notificări are date mock și nu reflectă schema completă | evită copierea unei arhitecturi demonstrative | Scăzut | S | P1 |

## 8. Secvență logică recomandată

> **Secvență istorică depășită ca „următoarea misiune”.** Activarea RLS este finalizată; recomandarea de mai jos nu pornește un nou proiect de securizare. Lucrările viitoare răspund unei nevoi concrete și autorizării utilizatorului, conform [22](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

1. înghețarea și versionarea completă a stării Supabase, inclusiv sursa Edge lipsă;
2. matrice rol–modul–operație și teste de acces pe conturi reprezentative;
3. remedierea P0: RLS etapizat, Contracte Storage, endpointul de alerte și profilurile;
4. alinierea configurării, statusurilor, migrărilor și auditului;
5. păstrarea contractului KPI Manager validat local și livrarea controlată a celor patru fișiere runtime, după aprobare;
6. abia apoi, evaluarea unei migrări incrementale către React.

Următoarea misiune logică este un **audit de securitate și acces read-only transformat într-un plan de migrare testabil**, cu matrice completă pentru fiecare tabel și rol, SQL propus dar neaplicat, scenarii de test și ordine de rollout/rollback.

## Actualizare 15.10.2026 — priorități rămase pentru Avansuri

1. Păstrați trasabilitatea fișierelor finale copiate în `HUB_v2-LAB`: paginile sunt modificări locale față de HEAD, iar migrațiile sunt încă neversionate aici. Deploy-ul paginilor noi în producție este confirmat de utilizator; păstrați dovada versiunii livrate și trasabilitatea copiei LAB.
2. **REZOLVATĂ în LAB — 16.10.2026:** KPI-ul și seria „Valoare devize finale” folosesc `total_manopera + total_piese`, înainte de avans; comparația lunară folosește aceeași bază. Validarea locală a trecut; utilizatorul a raportat testare manuală pozitivă a Managerului în LAB, inclusiv pe alți utilizatori. Deploy-ul noului Manager în producție rămâne neconfirmat; avansurile nu se adună la valoarea integrală. Vezi `17_MODIFICARI_AVANSURI_2026-10-14_15.md`.
3. Auditați avansurile istorice și reconciliați numai cazurile verificate; corectați `data_platii` pentru AV-55 prin proces controlat, păstrând `created_at`.
4. Testați sesiuni reale cu `deviz_final` fără `clienti_notificari`, concurența, erorile de rețea și rollbackul la actualizare. Adăugați, dacă se aprobă, marcajul `✓ Inclus în DF-XXX` și un mesaj mai simplu pentru rândul negativ vechi.
5. Tratați RLS și granturile largi prin planul separat, incremental, din documentele 09–12. Nu considerați această integrare drept remediere de acces.

## Manager — verificări viitoare

Testarea manuală generală în LAB este raportată pozitiv de utilizator; nu se mai consemnează ca integral neefectuată. Nu există un defect nou identificat prin această actualizare documentară. După viitorul deploy, se repetă verificările din documentul 19 în mediul țintă: acces/permisiuni, HUB/Înapoi, căutare și navigare, formule, plăți/status comun, copiere IBAN, Dezmembrări și alerte. Cazurile de eroare/rețea/concurență se verifică separat dacă nu au făcut parte din testarea utilizatorului; acoperirea lor individuală nu a fost raportată.
