# Rollback RLS — câte un tabel, cu baseline și aprobare

## Disponibilitate și limite locale — 03.11.2026

Acesta este un plan de referință cu dovezi istorice LAB, fără verificare live nouă.
„Disponibile” și „existente” în nota din 21.10 se referă la artefactele consemnate
atunci. Cele zece directoare SQL/rollback din [10](10_PLAN_RLS.md) sunt absente aici.

Lipsesc și scripturile istorice `supabase/rls_seria_0_audit.sql`,
`supabase/rls_seria_0_test.sql`, `supabase/rls_seria_0_rollback.sql`,
`supabase/rls_seria_1_audit.sql`, `supabase/rls_seria_1_test.sql`,
`supabase/rls_seria_1_rollback.sql`. Aceste căi sunt referințe indisponibile,
nu instrucțiuni executabile în checkout. Migrațiile istorice Seria 0/1 absente
sunt inventariate în [INDEX](INDEX.md).

Nu s-au recreat fișiere și nu se reexecută SQL. Alegerea unui rollback actual,
baseline-ul și compatibilitatea cu mediul țintă sunt **NEEDS_REVIEW**.

## Rollback-uri disponibile, nu de executat — 21.10.2026

RLS este activ în producție și LAB. Nu s-a executat niciun rollback în această rundă documentară. Pachetele și perechile exacte SQL/rollback sunt în [10_PLAN_RLS.md](10_PLAN_RLS.md).

- În fiecare lot, se revine numai asupra obiectelor efectiv aplicate, în ordine inversă: Devize 3→2→1; Constatări 4→3→2→1; Avansuri plăți→antete; Stoc VIEW→produse→mișcări.
- Contracte se revine înaintea surselor de autorizare; nu se slăbește auth_profiles/auth_roles cât timp celelalte politici depind de ele.
- Baseline-ul vechi restaurat de multe rollback-uri include RLS OFF și GRANT-uri largi. Fișierele nu reprezintă configurația dorită acum și nu se rulează preventiv după testarea reușită.
- Rollback-ul de schemă nu anulează operațiile legitime sau datele introduse ulterior de utilizatori. Se verifică preflight-ul și diferențele ulterioare înaintea oricărei reveniri.
- Probele LAB istorice au executat rollback-urile în tranzacții anulate, cu verificări RLS/ACL/coloane/secvențe/date. După probe, starea LAB a rămas activă.
- Nu se resetează LAB, nu se copiază date producție și nu se restaurează profilurile reale din fixture-uri. Se curăță numai datele proprii unui test autorizat.
- AUTH avansat/Turnstile și pachetul auth-security-lab rămân suspendate. Nu se execută nici aplicarea, nici rollback-ul lor ca parte a RLS final.
- Restanțele de GRANT/politici vechi/Storage nu justifică un rollback global al RLS; sunt sarcini punctuale distincte, dacă sunt solicitate.

Nu se creează și nu se modifică SQL în această actualizare. Documentația consemnează locația fișierelor existente și verificările anterioare; nu acordă permisiune de execuție. Vezi [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Arhivă — analize și planuri anterioare, suspendate în forma integrală

Materialul de mai jos este păstrat pentru dependențe, dovezi și comparație. Datele de audit și stările se referă la momentul consemnat; nu sunt instrucțiuni active. Exemplele SQL și secvențele AUTH nu se execută prin simpla lor prezență aici. Pentru decizia actuală prevalează secțiunea de mai sus și [stadiul curent](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

> **18.10.2026 — RLS Seria 0 AUTH_PROFILES: PREGĂTIT - NEAPLICAT.** Propunerea concretă pentru securizarea sursei rolurilor este în [21_RLS_SERIA_0_AUTH_PROFILES.md](21_RLS_SERIA_0_AUTH_PROFILES.md). Aplicarea cere adaptarea/validarea loginului prin User și a proiecțiilor de actori; nu se continuă cu Seria 1.


> **Actualizare 18.10.2026 — seria 1: PREGĂTIT - NEAPLICAT.** Pentru `contracte` și `todo_tasks`, propunerea concretă și prioritară este [20_RLS_SERIA_1_TABELE_SIMPLE.md](20_RLS_SERIA_1_TABELE_SIMPLE.md). Exemplele generale de mai jos rămân istoric și nu se execută pentru această serie. Starea live nu a fost modificată. Aplicarea este blocată de sursa autorizării (`auth_profiles` editabil fără RLS).


## 1. Scop

Acest plan descrie revenirea pentru etapele propuse în `10_PLAN_RLS.md`. Nicio comandă din document nu a fost executată.

Decizia de rollout este incrementală: un singur tabel per schimbare RLS, cu testele și rollbackul acelui tabel validate înainte de a continua. O migrare masivă pentru toate tabelele este exclusă.

Rollbackul care dezactivează RLS restaurează o stare cunoscută ca vulnerabilă. El este acceptabil numai ca măsură temporară de continuitate, cu incident deschis, proprietar nominal și termen de remediere. Prima opțiune trebuie să fie un **forward fix**: adăugarea sau corectarea politicii lipsă, nu eliminarea tuturor controalelor.

## 2. Ce trebuie salvat înainte de orice etapă

### 2.1 Snapshot SQL obligatoriu

```sql
-- READ-ONLY: rulați și salvați rezultatul într-un artefact versionat
select now() as captured_at,
       current_database() as database_name,
       version() as postgres_version;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public','storage')
order by schemaname, tablename, policyname;

select n.nspname as schema_name, c.relname, c.relrowsecurity, c.relforcerowsecurity,
       c.reloptions, pg_get_userbyid(c.relowner) as owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public','storage') and c.relkind in ('r','v')
order by n.nspname, c.relname;

select table_schema, table_name, grantee, privilege_type
from information_schema.table_privileges
where table_schema in ('public','storage')
order by table_schema, table_name, grantee, privilege_type;

select routine_schema, routine_name, specific_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema in ('public','private')
order by routine_schema, routine_name, grantee;

select n.nspname, p.oid::regprocedure as signature,
       p.prosecdef, p.proconfig, p.proacl, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public','private')
order by n.nspname, p.proname;

select c.oid::regclass as view_name, c.reloptions, pg_get_viewdef(c.oid, true)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v';

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
```

### 2.2 Artefacte non-SQL

- versiunea și hash-ul fiecărei funcții Edge;
- sursa exactă a versiunii distribuite;
- configurația `verify_jwt`;
- joburile cron și expresiile lor;
- numărul de rânduri per tabel și câteva agregate fără date personale;
- commitul frontend distribuit;
- lista conturilor sintetice și permisiunilor folosite la test;
- rezultatele testelor de acces înainte de schimbare.

Snapshotul curent cunoscut include:

- `trimite-alerte`: versiunea 23, `verify_jwt=false`, hash `a9ab0126...21df8d`;
- `dezmembrari-photo-upload`: versiunea 20, `verify_jwt=true`, hash `7526b196...171ce6`;
- 36 tabele publice, dintre care 19 fără RLS;
- 59 politici publice;
- bucket `documente_contracte` public.

## 3. Mecanism operațional de rollout/rollback

Pentru fiecare etapă:

1. se deschide o fereastră de schimbare;
2. se notează commitul/migrarea și persoana care poate decide rollbackul;
3. migrarea se execută într-o singură tranzacție unde este posibil;
4. se rulează testele smoke pentru rolurile afectate;
5. se urmăresc erorile PostgREST `401`, `403`, `42501` și update-urile cu zero rânduri;
6. dacă un flux critic este blocat, se încearcă mai întâi politica corectivă;
7. dacă nu poate fi corectat în fereastra stabilită, se execută rollbackul **doar pentru etapa/tabelul afectat**;
8. se verifică revenirea și se păstrează incidentul deschis.

Nu se recomandă un script unic care dezactivează RLS pe toate tabelele.

## 4. Detectarea rapidă a unui modul blocat accidental

| Simptom | Cauză probabilă | Verificare rapidă read-only |
|---|---|---|
| `401` | sesiune/JWT lipsă sau expirat | `auth.getSession()`, apoi reautentificare cu contul de test |
| `403` / `42501` | grant lipsă sau `WITH CHECK` respins | verificați grantul obiectului și politica operației |
| SELECT întoarce `[]`, fără eroare | politica `USING` nu acceptă rândul | comparați permisiunea profilului și expresia politicii |
| UPDATE/DELETE afectează 0 rânduri | lipsește SELECT/USING sau ownership-ul nu corespunde | SELECT asupra aceluiași ID cu același JWT |
| INSERT eșuează la secvență | `USAGE` lipsă pe secvență | granturile secvenței asociate |
| join/embed PostgREST eșuează | tabelul referit nu este vizibil prin RLS | testați separat ambele tabele și FK-ul |
| Edge Dezmembrări răspunde 403 | profilul nu mai este citibil sau politica item/foto refuză | test Auth user, profil propriu, item propriu și policy helper |
| Dashboard are `—`/0 la KPI | politica read-only Manager/dashboard lipsește | interogați sursa KPI cu JWT Manager |

Verificarea trebuie făcută cu cheia publică și JWT-ul utilizatorului, nu cu `service_role`, deoarece service role ocolește RLS și poate produce un fals rezultat pozitiv.

## 5. Rollback etapa 0 — helperul `private.hub_can`

Helperul poate fi șters numai după ce toate politicile dependente au fost eliminate sau înlocuite.

```sql
-- ROLLBACK PROPUS
revoke execute on function private.hub_can(text[], integer[])
from authenticated, service_role;

drop function if exists private.hub_can(text[], integer[]);
```

Dacă doar o permisiune din helper este greșită, este preferabilă restaurarea definiției capturate cu `CREATE OR REPLACE FUNCTION`, fără a elimina politicile.

## 6. Rollback etapa 1

### 6.1 Profiluri și roluri

Rollbackul trebuie coordonat cu versiunea frontend. Dacă noul login folosește un RPC, revenirea doar a DB poate rupe loginul.

```sql
-- ROLLBACK DE URGENȚĂ la starea actuală vulnerabilă
drop policy if exists auth_profiles_select_own on public.auth_profiles;
drop policy if exists auth_profiles_select_admin on public.auth_profiles;
drop policy if exists auth_profiles_update_admin on public.auth_profiles;
alter table public.auth_profiles disable row level security;

drop policy if exists auth_roles_select_authenticated on public.auth_roles;
alter table public.auth_roles disable row level security;

grant select, insert, update, delete, truncate, references, trigger
on public.auth_profiles, public.auth_roles to anon, authenticated;
```

Verificare după rollback: login cu email, login cu poreclă, Dashboard profil/rol, Admin listă utilizatori și Edge Dezmembrări.

### 6.2 Audit

```sql
drop policy if exists audit_logs_insert_own on public.audit_logs;
drop policy if exists audit_logs_select_auditors on public.audit_logs;
alter table public.audit_logs disable row level security;

grant select, insert, update, delete, truncate, references, trigger
on public.audit_logs to anon, authenticated;
```

Verificare: login și o acțiune auditabilă trebuie să creeze rând; tabul Audit trebuie să se încarce. După incident, se verifică dacă perioada fără RLS a permis alterarea jurnalului.

### 6.3 Plăți Manager

```sql
drop policy if exists plati_manager_select on public.plati_manager;
drop policy if exists plati_manager_insert_own on public.plati_manager;
drop policy if exists plati_manager_mark_paid on public.plati_manager;
drop policy if exists plati_manager_delete_unpaid on public.plati_manager;
alter table public.plati_manager disable row level security;

grant select, insert, update, delete, truncate, references, trigger
on public.plati_manager to anon, authenticated;
```

Verificare: Birou/P(`plati`) vede propriile cereri, Manager vede toate și poate marca plătit. Filtrarea revine doar în browser și nu mai este o barieră de securitate.

### 6.4 Contracte DB

```sql
drop policy if exists contracte_select on public.contracte;
drop policy if exists contracte_insert on public.contracte;
drop policy if exists contracte_update on public.contracte;
alter table public.contracte disable row level security;

grant select, insert, update, delete, truncate, references, trigger
on public.contracte to anon, authenticated;
```

Verificare: listare, creare contract și finalizare. Storage este tratat separat.

## 7. Rollback etapa 2 — devize și avansuri

```sql
-- Eliminați toate politicile cu prefixele create în etapa 2,
-- folosind numele exacte din migrare/snapshot.
drop policy if exists devize_select on public.devize;
drop policy if exists devize_insert on public.devize;
drop policy if exists devize_update on public.devize;
drop policy if exists devize_delete_admin on public.devize;

drop policy if exists deviz_final_header_select on public.deviz_final_header;
drop policy if exists deviz_final_header_insert on public.deviz_final_header;
drop policy if exists deviz_final_header_update on public.deviz_final_header;
drop policy if exists deviz_final_header_delete_admin on public.deviz_final_header;
drop policy if exists deviz_final_linii_select on public.deviz_final_linii;
drop policy if exists deviz_final_linii_insert on public.deviz_final_linii;
drop policy if exists deviz_final_linii_delete on public.deviz_final_linii;

drop policy if exists avansuri_select on public.evidente_avansuri;
drop policy if exists avansuri_insert on public.evidente_avansuri;
drop policy if exists avansuri_update on public.evidente_avansuri;
drop policy if exists avansuri_delete on public.evidente_avansuri;
drop policy if exists avansuri_plati_select on public.evidente_avansuri_plati;
drop policy if exists avansuri_plati_insert on public.evidente_avansuri_plati;
drop policy if exists avansuri_plati_update on public.evidente_avansuri_plati;
drop policy if exists avansuri_plati_delete on public.evidente_avansuri_plati;

alter table public.devize disable row level security;
alter table public.deviz_final_header disable row level security;
alter table public.deviz_final_linii disable row level security;
alter table public.evidente_avansuri disable row level security;
alter table public.evidente_avansuri_plati disable row level security;

grant select, insert, update, delete, truncate, references, trigger
on public.devize, public.deviz_final_header, public.deviz_final_linii,
   public.evidente_avansuri, public.evidente_avansuri_plati
to anon, authenticated;
```

Verificare rapidă în această ordine:

1. deschidere și salvare Deviz estimativ;
2. căutare Deviz;
3. deschidere/editare Deviz final;
4. Constatare → RPC Deviz final;
5. creare Avans și Plată;
6. citirea KPI Manager.

## 8. Rollback etapa 3 — Clienți și Constatare

### 8.1 Restaurarea politicilor vechi pentru registrul clienți

Politicile noi se șterg și se recreează definițiile din snapshot. Modelul vechi confirmat este:

```sql
-- EXEMPLU pentru clienti; folosiți numele originale din snapshot
drop policy if exists clienti_select_module on public.clienti;
drop policy if exists clienti_insert_module on public.clienti;
drop policy if exists clienti_update_module on public.clienti;

create policy clienti_select_hub_permission
on public.clienti for select to authenticated
using ((select private.has_hub_permission('clienti_notificari')));

create policy clienti_insert_hub_permission
on public.clienti for insert to authenticated
with check ((select private.has_hub_permission('clienti_notificari')));

create policy clienti_update_hub_permission
on public.clienti for update to authenticated
using ((select private.has_hub_permission('clienti_notificari')))
with check ((select private.has_hub_permission('clienti_notificari')));
```

Aceeași revenire, cu numele și expresiile capturate, se aplică la `clienti_vehicule` și `clienti_contacte`. Tabelele aveau deja RLS, deci **nu se dezactivează RLS** la rollback.

### 8.2 Tabele Constatare

```sql
drop policy if exists constatari_select on public.constatari;
drop policy if exists constatari_insert on public.constatari;
drop policy if exists constatari_update on public.constatari;
drop policy if exists constatari_departamente_select on public.constatari_departamente;
drop policy if exists constatari_departamente_insert on public.constatari_departamente;
drop policy if exists constatari_departamente_update on public.constatari_departamente;
drop policy if exists asteptare_select on public.constatari_asteptare_piese;
drop policy if exists asteptare_insert on public.constatari_asteptare_piese;
drop policy if exists asteptare_update on public.constatari_asteptare_piese;
drop policy if exists repartizari_select on public.constatari_repartizari;

alter table public.constatari disable row level security;
alter table public.constatari_departamente disable row level security;
alter table public.constatari_asteptare_piese disable row level security;
alter table public.constatari_repartizari disable row level security;

grant select, insert, update, delete, truncate, references, trigger
on public.constatari, public.constatari_departamente,
   public.constatari_asteptare_piese, public.constatari_repartizari
to anon, authenticated;
```

### 8.3 Personal service

```sql
drop policy if exists service_personal_select on public.service_personal;
drop policy if exists service_personal_insert on public.service_personal;
drop policy if exists service_personal_update on public.service_personal;
alter table public.service_personal disable row level security;

grant select, insert, update, delete, truncate, references, trigger
on public.service_personal to anon, authenticated;
```

Verificare: listă constatări, client/vehicul, salvare fișă, status, departament, interval așteptare, repartizare afișată, personal disponibil și generare Deviz final.

## 9. Rollback etapa 4 — AWB, stoc și alerte

### 9.1 AWB

```sql
drop policy if exists awb_select on public.evidenta_awb;
drop policy if exists awb_insert on public.evidenta_awb;
drop policy if exists awb_update on public.evidenta_awb;
alter table public.evidenta_awb disable row level security;
grant select, insert, update, delete, truncate, references, trigger
on public.evidenta_awb to anon, authenticated;
```

### 9.2 Stoc și view

```sql
drop policy if exists stoc_produse_select on public.stoc_produse;
drop policy if exists stoc_produse_insert on public.stoc_produse;
drop policy if exists stoc_produse_update on public.stoc_produse;
drop policy if exists stoc_miscari_select on public.stoc_miscari;
drop policy if exists stoc_miscari_insert on public.stoc_miscari;
drop policy if exists stoc_miscari_delete_admin on public.stoc_miscari;

alter table public.stoc_produse disable row level security;
alter table public.stoc_miscari disable row level security;

-- Restabiliți definiția exactă salvată, fără security_invoker.
create or replace view public.stoc_view_curent as
select p.id,
       p.cod_articol,
       p.denumire,
       p.prag_minim,
       coalesce(sum(case when m.tip_miscare = 'intrare' then m.cantitate else 0 end), 0) as total_intrat,
       coalesce(sum(case when m.tip_miscare = 'iesire' then m.cantitate else 0 end), 0) as total_iesit,
       coalesce(sum(case when m.tip_miscare = 'intrare' then m.cantitate else 0 end), 0)
       - coalesce(sum(case when m.tip_miscare = 'iesire' then m.cantitate else 0 end), 0) as stoc_actual,
       p.activ
from public.stoc_produse p
left join public.stoc_miscari m on p.id = m.produs_id
group by p.id, p.cod_articol, p.denumire, p.prag_minim, p.activ;

grant select, insert, update, delete, truncate, references, trigger
on public.stoc_produse, public.stoc_miscari, public.stoc_view_curent
to anon, authenticated;
```

Restaurarea view-ului Security Definer este un rollback de disponibilitate, nu o stare sigură. Advisorul trebuie să redevină roșu pentru această problemă, confirmând revenirea la baseline.

### 9.3 Config alerte

```sql
drop policy if exists config_alerte_select on public.config_alerte;
drop policy if exists config_alerte_update on public.config_alerte;
alter table public.config_alerte disable row level security;
grant select, insert, update, delete, truncate, references, trigger
on public.config_alerte to anon, authenticated;
```

Verificare: AWB S/I/U, produs și mișcare stoc, view/raport PDF, KPI Manager, Admin Config Alerte și o execuție controlată a jobului în staging.

## 10. Rollback etapa 5 — politici existente

### 10.1 Generator

```sql
drop policy if exists generator_select on public.generator_logs;
drop policy if exists generator_insert on public.generator_logs;
drop policy if exists generator_update on public.generator_logs;

create policy "Permite_tot_pentru_public"
on public.generator_logs
as permissive for all
to public
using (true)
with check (true);
```

Acest rollback redeschide accesul anonim total și trebuie folosit doar pentru diagnostic scurt.

### 10.2 TODO

Ținta de business este Admin-only. SQL-ul de mai jos restaurează doar starea tehnică veche, prea largă, și poate fi folosit exclusiv ca rollback temporar de urgență dacă politica Admin-only blochează chiar Adminul. Nu reprezintă starea acceptată finală.

```sql
drop policy if exists todo_select on public.todo_tasks;
drop policy if exists todo_insert on public.todo_tasks;
drop policy if exists todo_update on public.todo_tasks;
drop policy if exists todo_delete on public.todo_tasks;

create policy "todo authenticated select" on public.todo_tasks
for select to authenticated using (true);
create policy "todo authenticated insert" on public.todo_tasks
for insert to authenticated with check (true);
create policy "todo authenticated update" on public.todo_tasks
for update to authenticated using (true) with check (true);
create policy "todo authenticated delete" on public.todo_tasks
for delete to authenticated using (true);
```

### 10.3 Anunțuri

Politicile vechi Admin-only trebuie restaurate exact din snapshot. Expresia confirmată pentru fiecare operație este existența profilului curent cu rolul `Admin` prin join `auth_profiles` → `auth_roles`. Nu se recomandă reconstruirea manuală din memorie; se folosește SQL-ul exportat înainte de rollout.

Verificare: Admin CRUD; utilizator non-Admin revine la comportamentul vechi în care dashboardul nu primește anunțul.

### 10.4 Flotă/Detailing/Telefoane/Bază VIN

Pentru aceste tabele, rollbackul înseamnă:

1. ștergerea politicilor `*_v2`;
2. recrearea exactă a celor patru politici capturate pentru fiecare tabel;
3. verificarea cheii vechi: `flota`, `detailing`, `telefoane`, respectiv `baza_vin`.

RLS rămâne activ; nu trebuie dezactivat.

### 10.5 Granturile funcțiilor Dezmembrări

```sql
-- ROLLBACK la granturile observate
grant execute on function public.can_capture_dezmembrari()
to public, anon, authenticated, service_role;
grant execute on function public.can_manage_dezmembrari()
to public, anon, authenticated, service_role;
grant execute on function public.handle_new_user()
to public, anon, authenticated, service_role;
```

Dacă `handle_new_user` a fost recreată, se restaurează definiția capturată. Rollbackul reintroduce `search_path` mutabil și trebuie marcat temporar.

## 11. Rollback etapa 6 — Storage Contracte

Înainte de etapă trebuie păstrate lista obiectelor, metadata, URL-urile și un backup al bucket-ului. Rollbackul propus:

```sql
-- ROLLBACK PROPUS la starea actuală
drop policy if exists contract_docs_select on storage.objects;
drop policy if exists contract_docs_insert on storage.objects;
drop policy if exists contract_docs_update on storage.objects;
drop policy if exists contract_docs_delete on storage.objects;

update storage.buckets
set public = true,
    file_size_limit = null,
    allowed_mime_types = null
where id = 'documente_contracte';

create policy "Full Customization zqhz5q_0"
on storage.objects for select to public
using (bucket_id = 'documente_contracte');
create policy "Full Customization zqhz5q_1"
on storage.objects for insert to public
with check (bucket_id = 'documente_contracte');
create policy "Full Customization zqhz5q_2"
on storage.objects for update to public
using (bucket_id = 'documente_contracte');
create policy "Full Customization zqhz5q_3"
on storage.objects for delete to public
using (bucket_id = 'documente_contracte');
```

Frontendul trebuie revenit simultan de la URL-uri semnate la versiunea care folosește URL-uri publice. Se testează afișarea atât a unui obiect vechi, cât și a unuia creat după migrare.

## 12. Rollback Edge `trimite-alerte`

Nu este SQL. Înainte de modificare se salvează bundle-ul versiunii 23 și configurația cron. Dacă autentificarea nouă blochează jobul:

1. se oprește temporar jobul, pentru a evita retry/spam;
2. se verifică manual secretul/JWT-ul jobului;
3. se face forward fix dacă este posibil;
4. numai dacă este necesar, se redistribuie exact versiunea 23 cu `verify_jwt=false`;
5. se rulează o invocare controlată pe date staging;
6. se confirmă numărul de emailuri și destinatarii înainte de reactivarea cronului.

Rollbackul la versiunea 23 redeschide endpointul public și trebuie urmat imediat de un plan corectiv.

## 13. Rollbackul granturilor minimale

Granturile trebuie restaurate din snapshot, nu cu `GRANT ALL` global. Dacă un singur modul este blocat, se acordă temporar doar privilegiul necesar tabelului respectiv.

Exemplu de forward fix preferat:

```sql
-- Dacă AWB are politica corectă, dar lipsește grantul UPDATE:
grant update on public.evidenta_awb to authenticated;
```

Rollback larg, numai în incident sever:

```sql
-- NERECOMANDAT ca stare permanentă
grant select, insert, update, delete, truncate, references, trigger
on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
```

Nu se restaurează `anon` global dacă loginul prin poreclă a fost deja adaptat; se acordă doar `EXECUTE` pe mecanismul restrâns de login.

## 14. Criterii de succes după rollback

- modulul afectat revine la rezultatul testului baseline;
- nu există erori noi `42501` pentru fluxul respectiv;
- numărul de rânduri nu s-a schimbat accidental;
- trigger-ele și FK-urile sunt intacte;
- nu s-au lăsat politici duplicate;
- advisorii sunt rulați și diferența față de snapshot este explicată;
- starea vulnerabilă reintrodusă este înregistrată ca incident, cu termen pentru forward fix.

## 15. Actualizare 15.10.2026 — dependențe la rollback

Acest document este planul **NEEXECUTAT** de rollback RLS; nu este un script de anulare a integrării avansurilor. Înainte de orice revenire la politicile vechi se verifică `save_deviz_final`, `list_deviz_final_importable_avansuri`, `private.resolve_deviz_final_vehicle`, accesul la `private.deviz_final_avans_review`, legăturile `avans_id`, `vehicle_id` și funcția `create_deviz_final_from_constatare`.

Nu se elimină automat `avans_id`, indexul unic sau `total_avans`: DF-199, DF-200 și DF-201 folosesc deja aceste date în baza conectată. Un rollback al aplicației la frontendul vechi poate lăsa devize cu avansuri noi pe care acesta nu le afișează corect. Orice revenire trebuie proiectată cu backup, verificarea documentelor existente și test de acces separat; nu se reintroduc piesele negative ca operație automată.


## Actualizare 18.10.2026 — seria 1, PREGĂTIT - NEAPLICAT

### Rollback concret seria 1

Folosiți numai `supabase/rls_seria_1_rollback.sql` împreună cu snapshotul proaspăt din `supabase/rls_seria_1_audit.sql`, după un rollout viitor aprobat. Rollback-ul nou elimină exclusiv cele 4 politici proprii; Contracte revine la OFF, TODO rămâne ON cu cele 4 politici originale; ALL anon/authenticated revine inclusiv cu MAINTAIN PG17. Acest lucru reintroduce riscurile anterioare și nu rezolvă auth_profiles/Storage. Nu rulați exemplele istorice ale etapei TODO peste guard-ul acestei serii.

Validare izolată: aplicare de două ori și rollback de două ori, comparație exactă flags/ACL/politici și număr de rânduri, reușită în PostgreSQL 17.5 PGlite cu fixture-uri sintetice. Rollback live NEEXECUTAT. Scriptul presupune baseline 18.10.2026; dacă metadata s-a schimbat, opriți și regenerați/restudiați restaurarea înainte de execuție.


## Actualizare 18.10.2026 — RLS Seria 0 AUTH_PROFILES, PREGĂTIT - NEAPLICAT

Rollback-ul concret pentru auth_profiles este `supabase/rls_seria_0_rollback.sql`, nu exemplele istorice generale. Elimină numai politicile/helperul propriu, revine la RLS OFF și ACL baseline, retrage granturile noi pe coloane și restaurează definiția/search_path/EXECUTE originale ale triggerului. Reintroduce expunerea critică anon și nu restaurează date/frontend. Comparați auditul proaspăt înainte de folosire; scriptul oprește politicile/helperii străini, FORCE diferit sau triggerul modificat. Dacă Seria 1 va fi aplicată ulterior, rollback-ul acelei serii trebuie planificat înaintea redeschiderii sursei. În această rundă nu se execută niciun rollback live.
