# Stadiu final RLS și direcție definitivă — SIMPLITATE

## Actualizare EP — producție verificată read-only la 05.11.2026

Backend EP instalat: șapte tabele RLS ON, șapte politici SELECT stricte și două
VIEW-uri security_invoker; total public 127 politici. Cele 37 de politici
preexistente comparate sunt neschimbate. Admin citește RPC-urile; profilurile fără
EP și cererile HTTP anonime sunt refuzate. `ep_private` nu este expusă în Data API.
[Dovezi, contracte și limite](03_SUPABASE.md#ep-productie-verificat-20261105). Nu s-au testat scrieri în producție sau sesiuni
reale în browser; celelalte constatări de mai jos rămân datate la auditul lor.

## Producție verificată live — 03.11.2026 (audit istoric)

**Proveniență:** audit read-only furnizat de utilizator, realizat prin integrarea
Supabase conectată asupra `HUB_Service_Auto` / `xyovkxmtbvgcwavuyxxu`,
`ACTIVE_HEALTHY`, PostgreSQL 17. Actualizarea documentară nu a accesat Supabase.
Auditul nu a executat DDL/DML/migrări și nu a schimbat politici, Storage, Edge
Functions sau date.

Catalogul de producție confirmă **36 tabele publice, 36 RLS ON, 0 OFF, 120 politici,
1 VIEW și 0 tabele publice cu FORCE RLS activ**. Rolurile `anon` și
`authenticated` au BYPASSRLS=false; `service_role` are BYPASSRLS=true.
Inventarul detaliat verificat și limitele sunt în [03_SUPABASE.md](03_SUPABASE.md).

`public.stoc_view_curent` are `security_invoker=true`, SELECT pentru
`authenticated`, fără SELECT pentru `anon`; vechea observație Security Definer
este depășită. Registrul privat de Avansuri are RLS OFF și drepturi limitate:
`authenticated` are numai SELECT pe `avans_id`/`status`, fără SELECT de tabel,
INSERT/UPDATE/DELETE/TRUNCATE și fără SELECT pe `reviewed_at`; `anon` nu are SELECT.
Acesta nu este un tabel public omis.

| Restanță confirmată în producție la 03.11 | Stare și limită |
|---|---|
| TRUNCATE | 16 tabele acordă GRANT TRUNCATE lui anon și 16 lui authenticated; operația nu a fost executată în audit |
| Storage Contracte | `documente_contracte` public=true; patru politici `storage.objects` pentru public, SELECT/INSERT/UPDATE/DELETE, condiție numai `bucket_id = 'documente_contracte'`. Element activ de securitate/fiabilitate, nemodificat de audit |

Două Edge Functions sunt active: `trimite-alerte` și `dezmembrari-photo-upload`.
Sunt instalate `pg_cron`/`pg_net`, iar `trimite-alerte-job` este activ cu
`0 8 * * *`. Fusul orar efectiv nu a fost verificat; nu se afirmă ora
08:00 Europe/Bucharest. Publicația `supabase_realtime` nu conține tabele;
tabelele interne din schema realtime și codul client frontend sunt lucruri distincte.
Istoricul remote de producție are 8 migrări; politicile aplicate manual nu se
deduc din numărul fișierelor sau înregistrărilor de migrare.

**LAB separat:** `smrrvkyyywtferhlrjnn` era **INACTIVE** la 03.11 și nu a fost
auditat live. Comparația producție/LAB din 21.10.2026 de mai jos rămâne istorică;
nu dovedește identitatea actuală a mediilor.

**NEEDS_REVIEW:** comportamentul efectiv RLS, autorizarea pe roluri de business,
compatibilitatea frontendului publicat și browserul; funcționarea end-to-end
cron/Edge/email și fusul orar cron. Semantica detaliată a politicilor istorice,
inclusiv Generator/TODO, nu a primit probe funcționale noi prin acest audit.

## Contextul repository-ului principal — reconciliere locală la 03.11.2026

Repository-ul principal este disponibil acum la `/media/aza/Depozit_Mint/HUB_v2`;
branch-ul și mediul țintă se verifică la fiecare sarcină. Managerul, căutarea
comună și ciornele sunt prezente static, conform [02](02_MODULE.md). Condițiile
frontend de administrare diferă de LAB; distincția față de regula de business
și DB este în [04](04_ROLURI_SI_ACCES.md).

Flag-urile AUTH false descriau LAB. Helper-ele/wrapper-ul `js/auth-security.js`,
`js/turnstile-config.js` și `js/turnstile.js` sunt absente aici și nu sunt
dependențe runtime curente, vezi [06](06_DEPENDENTE_SI_INTEGRARI.md). Pachetele
SQL/rollback și rezultatele istorice lipsesc din checkout, conform [10](10_PLAN_RLS.md)
și [12](12_TESTE_ACCES.md). Nu se reexecută sau recreează.

[23](23_INVENTAR_TRANSFER_PRODUCTIE.md) este comparația istorică a 29 diferențe
LAB cu propriul HEAD; un inventar nou este obligatoriu înainte de orice transfer.
Reconcilierea locală anterioară nu accesase Supabase; auditul furnizat acum revalidează numai faptele de producție enumerate mai sus.

---

## Istoric LAB/producție — 21.10.2026

Toate comparațiile între medii, detaliile de politici/ACL, confirmările funcționale,
probele LAB și formulările „actual/live” din secțiunile următoare sunt dovezi din
21.10.2026. Nu se extrapolează la LAB inactiv sau la autorizarea funcțională actuală.
Pentru catalogul actual de producție prevalează auditul furnizat din 03.11.2026.

Actualizare istorică: **21.10.2026**. Acesta este punctul central de preluare pentru alt dezvoltator sau model AI. În această rundă s-au făcut numai citiri de catalog Supabase și modificări în documentația locală. Nicio migrare, modificare de aplicație, probă de scriere, commit, push sau deploy.

## 1. Rezultatul real, nu stadiul vechilor planuri

| Stare la 21.10.2026 | Producție (istoric) | LAB (istoric) |
|---|---|---|
| Tabele publice cu RLS | **36/36 ACTIVE ÎN PRODUCȚIE** | **36/36 ACTIVE ÎN LAB** |
| Tabele publice fără RLS | **0** | **0** |
| Politici publice | **120** | **120** |
| VIEW stoc_view_curent | security_invoker=true; numai SELECT pentru authenticated | identic |
| Tabel privat deviz_final_avans_review | RLS OFF; ACL limitat, vezi excepțiile | identic |
| FORCE RLS | OFF pe cele 36 tabele; comportamentul normal al proprietarului/backendului | identic |

La 21.10.2026, catalogul obiectelor public/private, politicile publice, ACL-urile tabelelor/coloanelor/secvențelor și definiția VIEW-ului erau consemnate ca aliniate între medii. Funcțiile SQL auditate atunci aveau aceleași definiții. O singură diferență de reprezentare ACL apare la private.comenzi_piese_sh_set_update_meta(): implicit în producție, explicit PUBLIC EXECUTE în LAB; dreptul efectiv este același. Aceasta nu reprezintă o diferență de logică sau RLS.

Utilizatorul a confirmat finalizarea activării tuturor tabelelor planificate și testarea cu succes în producție a ultimelor trei tabele Devize. Verificarea actuală a catalogului confirmă activarea. Nu echivalăm această citire cu rerularea în producție a matricelor automate LAB.

**Închiderea activării nu înseamnă că toate ACL-urile și politicile vechi au fost restrânse.** Restanțele reale sunt la secțiunea 4.

## 2. Ce se păstrează

HUB AUTO este aplicația internă simplă a colegilor, construită după necesități. Loginul existent poreclă/email + parolă rămâne neschimbat. Nu se propun infrastructură nouă, autentificare suplimentară sau extinderi.

- Admin are acces indiferent de bifă, în limitele operațiilor implementate în modul; nu se inventează DELETE sau editări inexistente.
- Numai Admin poate modifica rolurile/bifele și catalogul de roluri. auth_profiles/auth_roles au RLS și politici Admin-only pentru scriere în ambele medii.
- Citirea anonimă a auth_profiles/auth_roles a fost păstrată intenționat pentru loginul actual și compatibilitatea citirilor de actori. Nu este lipsă de RLS și nu se confundă cu izolare/confidențialitate completă a profilurilor.
- Rolul Manager/2 are excepțiile de citire/plată deja implementate. Nu presupunem că toate celelalte roluri primesc acces doar prin numele lor.
- AUTH avansat, noua cale hub-login, limiterul custom și Turnstile sunt **SUSPENDATE**. Local: HUB_AUTH_SECURITY_ENABLED=false și HUB_TURNSTILE.enabled=false. Starea istorică a hub-login este publicat/dezactivat în LAB; nu a fost invocat și nu s-au recitit secretele/setările Edge în această rundă.
- LAB este permanent și independent: smrrvkyyywtferhlrjnn, checkout /home/aza/HUB AUTO/HUB_v2-LAB. Producție: xyovkxmtbvgcwavuyxxu. Nu se reclonează după etape și nu se transferă configurația LAB.

## 3. EXCEPȚII justificate și limite de domeniu

1. **public.stoc_view_curent este VIEW**, nu tabel. Nu i se activează RLS propriu. Are security_invoker=true, SELECT pentru authenticated, fără acces anon; citește stoc_produse și stoc_miscari sub politicile apelantului.
2. **private.deviz_final_avans_review este tabel intern**, RLS OFF. postgres deține drepturile tabelului; authenticated are numai USAGE pe schema private și SELECT pe coloanele avans_id/status, fără SELECT de tabel, INSERT/UPDATE/DELETE/TRUNCATE; anon nu are USAGE. Este folosit de RPC-urile SECURITY INVOKER pentru eligibilitatea avansurilor. Nu este un tabel public omis. Schema API expusă nu a fost recitită separat din Dashboard; nu deducem configurația API numai din numele private.
3. Schemele administrate auth, realtime, storage, supabase_migrations, extensiile cron/net/vault/extensions au reguli și obiecte interne proprii. Nu se activează în masă RLS pe toate obiectele lor pentru a obține un procent artificial de 100%. Inventarul separat este în 03_SUPABASE.md.
4. Secvențele și funcțiile nu au RLS propriu; sunt controlate prin GRANT/EXECUTE. postgres și service_role au comportamentul backend/proprietar normal; service_role are BYPASSRLS. Browserul nu primește service_role.
5. Accesul anonim SELECT la sursele loginului, descris mai sus, este o excepție de compatibilitate, nu o restanță care justifică schimbarea loginului în această sarcină.

## 4. RESTANȚE reale, documentate și nemodificate

| Restanță | Confirmare read-only | Consecință și acțiune limitată de discutat separat |
|---|---|---|
| GRANT-uri istorice largi | La auditul din 21.10.2026, anon și authenticated aveau drept efectiv TRUNCATE pe **16 tabele**, în ambele medii | TRUNCATE nu este filtrat de RLS. Este necesară o revizie punctuală a privilegiilor nefolosite; nu s-a executat TRUNCATE și nu se afirmă că REST expune direct această comandă. |
| generator_logs | politica Permite_tot_pentru_public, ALL, rol public, USING/WITH CHECK true | RLS este ON, dar politica permite CRUD și pentru anon cu GRANT-urile existente. Regula bifei generator nu este impusă în DB. Nu este declarată excepție de business aprobată. |
| todo_tasks | patru politici authenticated cu true | Orice autentificat are CRUD prin API, deși regula documentată a modulului este Admin-only. RLS ON nu înseamnă că regula Admin-only este implementată. |
| Storage Contracte în producție | bucket documente_contracte public=true; patru politici storage.objects pentru rol public, S/I/U/D, filtrate numai pe bucket | Protecția tabelului contracte nu protejează automat fișierele. Regula de acces a bucketului necesită reconciliere punctuală; fără modificări aici. LAB nu are bucketuri sau politici Storage, deci nu dovedește comportamentul Storage din producție. |

Inventarul istoric din 21.10.2026 consemna 16 tabele cu TRUNCATE efectiv: `admin_announcements`, `baza_vin`, `clienti`, `clienti_contacte`, `clienti_notificari_config`, `clienti_notificari_istoric`, `clienti_notificari_sabloane`, `clienti_vehicule`, `clienti_vehicule_termene`, `detailing`, `dezmembrari_items`, `dezmembrari_photos`, `flota_auto`, `generator_logs`, `telefoane_clienti`, `todo_tasks`. Nu reprezintă un inventar curent; eliminarea ulterioară a tabelei retrase este consemnată în [03](03_SUPABASE.md#bază-vin--eliminat-la-12112026).

PostgreSQL precizează că TRUNCATE și REFERENCES nu sunt supuse RLS: [documentație oficială](https://www.postgresql.org/docs/17/ddl-rowsecurity.html). În această rundă s-a folosit numai has_table_privilege pentru verificare, fără operații distructive. FK-urile și suprafața API pot limita o cale concretă de execuție; acest lucru nu justifică păstrarea unui GRANT nefolosit.

Advisorii nu mai raportează tabele publice fără RLS, dar aceasta nu verifică semantica tuturor politicilor sau TRUNCATE. Alte avertismente preexistente sunt search_path pentru handle_new_user, funcții SECURITY DEFINER apelabile, extensie în public (producție) și o opțiune Auth. Sunt consemnate ca observații, fără reluarea proiectului AUTH avansat.

## 5. Acces și dependențe importante

Regulile exacte, inclusiv operațiile restrânse și excepțiile vechi, sunt în [09_MATRICE_ACCES.md](09_MATRICE_ACCES.md).

- Constatări: scriere prin constatari; citiri contextuale pentru C&N, Manager, Deviz Final și Comenzi SH. Intervalele de așteptare și statusurile între departamente rămân coerente. Responsabilii editabili sunt text în constatari.responsabili; constatari_repartizari este numai citit de aplicația actuală.
- Personal: admin_echipe pentru administrare, constatari pentru afișare, personalul arhivat rămâne disponibil pentru legăturile existente.
- Deviz Final: deviz_final pentru RPC; cautare_deviz pentru căutare/citire, admin_devize pentru ștergerea administrativă. Liniile se înlocuiesc atomic prin DELETE + INSERT, nu UPDATE direct.
- save_deviz_final păstrează blocările, integritatea avans_id/vehicle_id și recalculează totalurile din plăți. total_general este restul de plată; valoarea brută este total_manopera + total_piese. Nu se modifică cele trei RPC-uri financiare pentru a activa RLS.
- Avansuri: avansuri și fallback-ul vechi devize unde cheia lipsește; C&N poate crea/plăti în fluxul său și modifica numai observațiile, Constatări poate lega vehicle_id în condițiile verificate, iar deviz_final are blocările necesare importului fără drept de editare financiară directă prin acele granturi.
- Audit: inserarea evenimentelor proprii funcționează pentru orice autentificat, chiar fără admin_audit; citirea generală cere admin_audit/Admin, iar istoricul contextual Constatări cere constatari. Nu există UPDATE/DELETE din client.
- Alerte: admin_alerte pentru citirea și modificarea valorii email_general. Fluxul identificat cron → trimite-alerte citește cu clientul backend service_role și trimite către Apps Script, independent de sesiuni HUB. Sursa Apps Script este inaccesibilă pe alt cont; nu se presupune ce face orice alt script necunoscut. Livrarea email end-to-end nu a fost retestată aici.
- Fallback-urile nu sunt uniforme: pachetele noi folosesc adesea boolean JSON true; unele politici vechi folosesc ->> sau cast boolean. Nu se atribuie retroactiv verificare strictă de tip tuturor politicilor.

## 6. Dovezi și proveniență

- **Verificare actuală:** SELECT din cataloage, pg_policies, ACL-uri de tabel/coloană/secvență, has_table_privilege, funcții/view-uri, bucketuri și politici Storage, istoricul migrărilor; fără date personale sau conținut de documente.
- **Teste LAB anterioare:** JWT-uri fictive prin helperul existent, probe permise/refuzate, salvări reale API/RPC, rollback-uri tranzacționale și cleanup. Numerele și limitele sunt în [12_TESTE_ACCES.md](12_TESTE_ACCES.md).
- **Confirmare funcțională producție:** declarația utilizatorului că toate tabelele planificate sunt activate și ultimele trei Devize au fost testate cu succes. Nu avem în această rundă un jurnal automat de probe producție pe utilizatori/operații; nu îl inventăm.
- Eticheta NEAPLICAT din README-urile pachetelor descrie data pregătirii de către agent. Nu mai descrie starea live; acele fișiere SQL/rapoarte nu au fost rescrise în sarcina exclusiv documentară.

## 7. Migrare, rollback și diferențe între medii

Pachetele, ordinea de dependență și rollback-urile sunt în [10_PLAN_RLS.md](10_PLAN_RLS.md) și [11_PLAN_ROLLBACK.md](11_PLAN_ROLLBACK.md). Nu se reexecută peste starea activă și nu se rulează întreg supabase/migrations.

La 21.10.2026 erau consemnate **8** intrări în supabase_migrations.schema_migrations pentru producție și **18** pentru LAB. Auditul de producție din 03.11 reconfirmă cele 8 intrări; LAB nu a fost auditat din nou. Aplicările manuale din SQL Editor nu trebuie presupuse înregistrate ca migrare; numerele diferite nu înseamnă că politicile lipsesc. Catalogul curent are prioritate pentru starea activării.

Diferențe reale în afara catalogului public: producția are cron/net, un obiect realtime intern suplimentar și bucketul/politicile Storage Contracte; LAB nu le are. Datele și conturile sunt separate. Nu se sincronizează automat infrastructura sau datele.

## 8. Frontend și predare

[23_INVENTAR_TRANSFER_PRODUCTIE.md](23_INVENTAR_TRANSFER_PRODUCTIE.md) inventariază cele 29 fișiere runtime locale diferite față de HEAD, cu hash și clasificare. Nu reprezintă o comparație live cu aplicația publicată sau cu proiectul principal, care nu este disponibil în această sarcină.

Activarea RLS finală nu cere copierea configurației LAB și nu introduce un nou login. Modificările funcționale Manager/ciorne/print/optimizări pot fi reconciliate separat cu proiectul principal. Codul AUTH/Turnstile rămâne suspendat. Paginile mixte nu se copiază integral și helper-ele pasive deja apelate nu se elimină orbește.

**Predare:** nu mai există tabel public cu RLS OFF; rămân numai restanțele punctuale de la secțiunea 4 și reconcilierea versiunilor frontend. Nu se deschide implicit un proiect nou de infrastructură sau autentificare.

## 9. Documente existente actualizate în această rundă

- [00_OVERVIEW.md](00_OVERVIEW.md)
- [01_ARHITECTURA.md](01_ARHITECTURA.md)
- [03_SUPABASE.md](03_SUPABASE.md)
- [04_ROLURI_SI_ACCES.md](04_ROLURI_SI_ACCES.md)
- [05_FLUXURI_PRINCIPALE.md](05_FLUXURI_PRINCIPALE.md)
- [06_DEPENDENTE_SI_INTEGRARI.md](06_DEPENDENTE_SI_INTEGRARI.md)
- [07_RISCURI_SI_ZONE_SENSIBILE.md](07_RISCURI_SI_ZONE_SENSIBILE.md)
- [08_RECOMANDARI.md](08_RECOMANDARI.md)
- [09_MATRICE_ACCES.md](09_MATRICE_ACCES.md)
- [10_PLAN_RLS.md](10_PLAN_RLS.md)
- [11_PLAN_ROLLBACK.md](11_PLAN_ROLLBACK.md)
- [12_TESTE_ACCES.md](12_TESTE_ACCES.md)
- [17_MODIFICARI_AVANSURI_2026-10-14_15.md](17_MODIFICARI_AVANSURI_2026-10-14_15.md)
- [19_MANAGER_V2_FISIERE_DEPLOY.md](19_MANAGER_V2_FISIERE_DEPLOY.md)
- [20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md](20_DEVIZ_FINAL_CIORNE_LOCALE_2026-10-17.md)
- [20_RLS_SERIA_1_TABELE_SIMPLE.md](20_RLS_SERIA_1_TABELE_SIMPLE.md)
- [21_RLS_SERIA_0_AUTH_PROFILES.md](21_RLS_SERIA_0_AUTH_PROFILES.md)
- [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md)
- [23_INVENTAR_TRANSFER_PRODUCTIE.md](23_INVENTAR_TRANSFER_PRODUCTIE.md)

Nu au fost create documente noi. Materialele istorice au rămas marcate ca arhivă, iar starea curentă prevalează în secțiunile de la început.
