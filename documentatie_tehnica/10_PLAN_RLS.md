# Plan RLS — activare incrementală, tabel cu tabel

## Disponibilitate în repository-ul principal — 03.11.2026

**Registru istoric LAB/producție; starea live actuală este NEEDS_REVIEW.**
Toate cele zece directoare de pachete și toate cele 38 fișiere SQL/rollback din
tabelul următor sunt **absente din acest checkout**. Căile păstrează numele
istorice sub `supabase/`, fără linkuri locale spre fișiere inexistente.

Nu au fost importate sau recreate artefacte. Confirmările datate de aplicare,
testele LAB și istoricul remote se păstrează ca dovezi istorice, fără validare
în această rundă. Acest registru nu este un manifest pentru branch-ul curent
și nu indică reexecutarea pachetelor sau a vechilor serii.

## Registrul final al activării — 21.10.2026

Activarea planificată este încheiată: **36/36 tabele publice RLS ON în producție și LAB**; VIEW-ul este invoker. Starea a fost recitită live. Fișierele de mai jos sunt pachete deja promovate conform confirmării utilizatorului, nu sarcini de reexecutat. Formulările istorice PREGĂTIT/NEAPLICAT din pachete descriu data pregătirii, nu starea de astăzi.

### Ordinea istorică de dependență și pachetele consemnate

Căile din tabel sunt relative la rădăcina repository-ului; localizarea lor istorică era în mirror-ul HUB_v2-LAB, iar aici sunt indisponibile. Numerele de etapă sunt un registru de preluare; nu inventează timestamp-uri pentru aplicările manuale din producție. Sursele rolurilor se protejează înaintea politicilor dependente; antetele înaintea liniilor/plăților; VIEW-ul după sursele sale.

| Etapă | Obiect | SQL producție | Rollback |
|---|---|---|---|
| 0 | Surse roluri/bife | `supabase/contracte-production-package-20261019/01_auth_sources.sql` — absent aici | `supabase/contracte-production-package-20261019/04_rollback_auth_sources.sql` — absent aici |
| 1 | Contracte | `supabase/contracte-production-package-20261019/02_contracte.sql` — absent aici | `supabase/contracte-production-package-20261019/03_rollback_contracte.sql` — absent aici |
| 2 | AWB | `supabase/evidenta-awb-rls-20261019/02_production.sql` — absent aici | `supabase/evidenta-awb-rls-20261019/03_rollback_production.sql` — absent aici |
| 3 | Plăți Manager | `supabase/plati-manager-rls-20261019/02_production.sql` — absent aici | `supabase/plati-manager-rls-20261019/03_rollback_production.sql` — absent aici |
| 4a | stoc_miscari | `supabase/stoc-rls-20261020/01_stoc_miscari_production.sql` — absent aici | `supabase/stoc-rls-20261020/01_stoc_miscari_rollback.sql` — absent aici |
| 4b | stoc_produse | `supabase/stoc-rls-20261020/02_stoc_produse_production.sql` — absent aici | `supabase/stoc-rls-20261020/02_stoc_produse_rollback.sql` — absent aici |
| 4c | stoc_view_curent (VIEW) | `supabase/stoc-rls-20261020/03_stoc_view_curent_production.sql` — absent aici | `supabase/stoc-rls-20261020/03_stoc_view_curent_rollback.sql` — absent aici |
| 5 | config_alerte | `supabase/config-alerte-rls-20261020/02_production.sql` — absent aici | `supabase/config-alerte-rls-20261020/03_rollback.sql` — absent aici |
| 6 | audit_logs | `supabase/audit-logs-rls-20261020/02_production.sql` — absent aici | `supabase/audit-logs-rls-20261020/03_rollback.sql` — absent aici |
| 7 | service_personal | `supabase/service-personal-rls-20261020/02_production.sql` — absent aici | `supabase/service-personal-rls-20261020/03_rollback.sql` — absent aici |
| 8a | evidente_avansuri | `supabase/avansuri-rls-20261020/01_evidente_avansuri_production.sql` — absent aici | `supabase/avansuri-rls-20261020/01_evidente_avansuri_rollback.sql` — absent aici |
| 8b | evidente_avansuri_plati | `supabase/avansuri-rls-20261020/02_evidente_avansuri_plati_production.sql` — absent aici | `supabase/avansuri-rls-20261020/02_evidente_avansuri_plati_rollback.sql` — absent aici |
| 9a | constatari | `supabase/constatari-rls-20261021/01_constatari_production.sql` — absent aici | `supabase/constatari-rls-20261021/01_constatari_rollback.sql` — absent aici |
| 9b | constatari_asteptare_piese | `supabase/constatari-rls-20261021/02_constatari_asteptare_piese_production.sql` — absent aici | `supabase/constatari-rls-20261021/02_constatari_asteptare_piese_rollback.sql` — absent aici |
| 9c | constatari_departamente | `supabase/constatari-rls-20261021/03_constatari_departamente_production.sql` — absent aici | `supabase/constatari-rls-20261021/03_constatari_departamente_rollback.sql` — absent aici |
| 9d | constatari_repartizari | `supabase/constatari-rls-20261021/04_constatari_repartizari_production.sql` — absent aici | `supabase/constatari-rls-20261021/04_constatari_repartizari_rollback.sql` — absent aici |
| 10a | deviz_final_header | `supabase/devize-rls-20261021/01_deviz_final_header_production.sql` — absent aici | `supabase/devize-rls-20261021/01_deviz_final_header_rollback.sql` — absent aici |
| 10b | deviz_final_linii | `supabase/devize-rls-20261021/02_deviz_final_linii_production.sql` — absent aici | `supabase/devize-rls-20261021/02_deviz_final_linii_rollback.sql` — absent aici |
| 10c | devize | `supabase/devize-rls-20261021/03_devize_production.sql` — absent aici | `supabase/devize-rls-20261021/03_devize_rollback.sql` — absent aici |

Pachetele conțin separat fișierele LAB și probele/cleanup-urile. Nu se execută un director întreg. La Stoc există și preflight-uri suplimentare; se păstrează instrucțiunile README-ului aferent.

Pachetul Contracte + surse de autorizare de mai sus este referința validată de protecție minimă, cu loginul existent. Fișierele solitare mai vechi contracte_rls_production_final_20261019.sql / rollback rămân arhivă; nu se amestecă perechi de versiuni. Vechea Seria 0 integrală și seria comună Contracte/TODO nu sunt manifestul stării live.

Tabelele cu politici preexistente, inclusiv C&N, Flotă, Detailing, Dezmembrări, anunțuri, TODO și Generator, apar în inventarul live din 03. Nu se atribuie fiecăruia un nou pachet sau PASS automat doar pentru că RLS este ON. Comenzi SH are politicile live și triggerele sale; nu a fost identificat aici un pachet nou separat de rollout local de transferat.

### Istoricul remote nu este inventarul complet al SQL-ului manual

Producție: 8 intrări, LAB: 18. Producția are următoarele înregistrări:

| Versiune | Nume |
|---|---|
| 20260918132916 | add_constatare_deviz_final_rpc |
| 20261005193001 | clienti_notificari_rls_permissions |
| 20261005193028 | move_hub_permission_helper_private |
| 20261006163523 | clienti_notificari_config_and_templates |
| 20261008050959 | clienti_vehicule_termene |
| 20261008061058 | clienti_vehicle_activity_status |
| 20261008065730 | clienti_notification_preferences |
| 20261008161826 | clienti_notificari_istoric |

Activările RLS manuale ulterioare nu sunt presupuse înregistrate în această tabelă; dovada actuală este catalogul cu 120 politici și cele 36 flag-uri ON. Nu se remediază această diferență prin db push sau reaplicarea fișierelor vechi.

### Ce rămâne

Niciun tabel public de activat. Restanțele punctuale sunt GRANT-urile TRUNCATE pe 16 tabele, politicile permisive Generator/TODO și Storage Contracte. Sunt documentate, nu remediate în această sarcină. Orice schimbare viitoare rămâne separată și limitată; nu se reia AUTH avansat.

Stadiu central: [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

---

## Arhivă documentară — stări și planuri anterioare

Textul de mai jos este păstrat pentru istoricul tehnic. Formulările RLS OFF, NEAPLICAT, blocaj AUTH sau 17/19 tabele descriu data documentului vechi, nu starea din 21.10.2026. Secțiunea curentă de mai sus și documentul 22 au prioritate. SQL-ul istoric nu se execută prin prezența lui în documentație.

## Arhivă — analize și planuri anterioare, suspendate în forma integrală

Materialul de mai jos este păstrat pentru dependențe, dovezi și comparație. Datele de audit și stările se referă la momentul consemnat; nu sunt instrucțiuni active. Exemplele SQL și secvențele AUTH nu se execută prin simpla lor prezență aici. Pentru decizia actuală prevalează secțiunea de mai sus și [stadiul curent](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

> **18.10.2026 — RLS Seria 0 AUTH_PROFILES: PREGĂTIT - NEAPLICAT.** Propunerea concretă pentru securizarea sursei rolurilor este în [21_RLS_SERIA_0_AUTH_PROFILES.md](21_RLS_SERIA_0_AUTH_PROFILES.md). Aplicarea cere adaptarea/validarea loginului prin User și a proiecțiilor de actori; nu se continuă cu Seria 1.


> **Actualizare 18.10.2026 — seria 1: PREGĂTIT - NEAPLICAT.** Pentru `contracte` și `todo_tasks`, propunerea concretă și prioritară este [20_RLS_SERIA_1_TABELE_SIMPLE.md](20_RLS_SERIA_1_TABELE_SIMPLE.md). Exemplele generale de mai jos rămân istoric și nu se execută pentru această serie. Starea live nu a fost modificată. Aplicarea este blocată de sursa autorizării (`auth_profiles` editabil fără RLS).


> **Atenție:** tot SQL-ul din acest document este o propunere pentru review și testare într-un mediu separat. Nu a fost executat. Nu trebuie copiat direct în producție înainte de rezolvarea precondițiilor și aprobarea necunoscutelor din `09_MATRICE_ACCES.md`.

## 1. Principii

1. politici înainte de activarea RLS, în aceeași tranzacție/migrare;
2. nicio activare în masă a celor 19 tabele;
3. întâi se elimină accesul anonim, apoi se restrânge accesul autentificat;
4. accesul se bazează pe `auth.uid()` și date server-side din `auth_profiles`, nu pe `user_metadata`;
5. `UPDATE` primește atât `USING`, cât și `WITH CHECK`;
6. operațiile inexistente în UI nu primesc politici „pentru orice eventualitate”;
7. view-urile trebuie să fie `security_invoker` sau scoase din API;
8. granturile și RLS sunt tratate împreună;
9. fiecare etapă are test și rollback independent;
10. `service_role` rămâne exclusiv server-side și nu este introdus în browser.
11. rolloutul se face strict tabel cu tabel; nu se grupează tabele într-o migrare RLS masivă;
12. gestionarea utilizatorilor, rolurilor și permisiunilor și accesul la `todo_tasks` sunt exclusiv Admin;
13. nu se proiectează în această etapă politici dedicate pentru Mecanic, Electrician sau Tinichigiu, deoarece nu folosesc momentan HUB AUTO.

Titlurile „Etapa 1–5” exprimă numai ordinea programului. Ele nu autorizează o migrare comună: fiecare tabel dintr-o etapă are migrare, testare, monitorizare și rollback separat înainte de continuarea cu următorul tabel.

Referințe oficiale folosite pentru propunere:

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Securizarea Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Optimizarea funcțiilor din politici](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)

## 2. Etapa 0 — baseline, mediu de test și decizii

### 2.1 Precondiții obligatorii

- export versionat al definițiilor, politicilor, granturilor, view-urilor, funcțiilor și trigger-elor;
- sursa curentă a funcției Edge `trimite-alerte` adusă în controlul versiunilor;
- mediu staging/branch Supabase cu schema curentă și date sintetice;
- conturi de test pentru rolurile active și permisiunile folosite; rolurile inactive Mecanic/Electrician/Tinichigiu necesită doar verificarea că nu primesc acces accidental;
- inventar al tuturor cererilor Data API produse de pagini;
- decizie asupra necunoscutelor din secțiunea 7 a matricei;
- logare a erorilor PostgREST `42501` și a cererilor blocate în timpul rolloutului;
- backup/PITR verificat.

### 2.2 Interogări de captură — numai pentru pregătirea viitoare

```sql
-- READ-ONLY: politicile curente
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- READ-ONLY: RLS și owner
select n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity,
       pg_get_userbyid(c.relowner) as owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','v')
order by c.relname;

-- READ-ONLY: granturi
select table_schema, table_name, grantee, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
order by table_name, grantee, privilege_type;
```

### 2.3 Helper propus

Helperul existent acceptă o singură permisiune. Pentru politici cu mai mulți consumatori se propune o funcție privată unică. Ea trebuie testată separat și nu trebuie acordată rolului `anon`.

```sql
-- PROPUNERE, NU EXECUTA
create or replace function private.hub_can(
  permission_keys text[] default '{}'::text[],
  role_ids integer[] default array[1]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.auth_profiles p
    where p.id = (select auth.uid())
      and (
        p.rol_id = any(role_ids)
        or exists (
          select 1
          from unnest(permission_keys) k
          where coalesce((p.permissions ->> k)::boolean, false)
        )
      )
  );
$$;

revoke all on function private.hub_can(text[], integer[]) from public, anon;
grant execute on function private.hub_can(text[], integer[]) to authenticated, service_role;
```

Riscul helperului este ridicat: orice eroare se propagă în toate politicile. Testele trebuie să acopere `auth.uid() = null`, Admin, Manager, permisiune adevărată/falsă/lipsă și JSON invalid.

## 3. Etapa 1 — identitate, audit și date financiare sensibile

### 3.1 `auth_profiles`: etapă blocată de loginul prin poreclă

> **Plan istoric SUSPENDAT în forma avansată.** Pasajele de mai jos se păstrează ca raționament tehnic, nu ca instrucțiuni de continuare a `hub-login`, Turnstile/CAPTCHA sau limiterului custom. Loginul existent, rolurile și protecțiile RLS active se păstrează; riscurile rămân documentate. Decizia actuală este în [22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md](22_STADIU_RLS_SI_DIRECTIE_SIMPLITATE.md).

Blocajul descris aici este istoric: protecția minimă a surselor de autorizare este activă, iar lookup-ul anonim compatibil a fost păstrat. Nu aplica acest exemplu peste politicile curente.

Nu se recomandă activarea RLS până când loginul prin poreclă nu este mutat într-un mecanism restrâns. O politică `anon USING (true)` ar expune toate coloanele și nu ar rezolva problema.

După înlocuirea lookupului anonim și a join-urilor care afișează actorii, baza politicilor poate fi:

```sql
-- PROPUNERE, DUPĂ ADAPTAREA LOGINULUI ȘI A PROIECȚIILOR DE ACTOR
alter table public.auth_profiles enable row level security;

create policy auth_profiles_select_own
on public.auth_profiles for select to authenticated
using (id = (select auth.uid()));

create policy auth_profiles_select_admin
on public.auth_profiles for select to authenticated
using (private.hub_can('{}'::text[], array[1]));

create policy auth_profiles_update_admin
on public.auth_profiles for update to authenticated
using (private.hub_can('{}'::text[], array[1]))
with check (private.hub_can('{}'::text[], array[1]));
```

Nu se propun politici `INSERT`/`DELETE`; inserarea rămâne responsabilitatea triggerului Auth. Pentru numele actorilor se recomandă un RPC/view cu proiecție minimă (`id`, nume afișat), nu acces la email, telefon și `permissions`.

### 3.2 `auth_roles`

```sql
-- PROPUNERE
alter table public.auth_roles enable row level security;

create policy auth_roles_select_authenticated
on public.auth_roles for select to authenticated
using (true);

-- Orice viitor I/U/D va fi rezervat exclusiv rolului Admin.
-- Fără I/U/D până la confirmarea unui flux de administrare a catalogului.
```

### 3.3 `audit_logs`

```sql
-- PROPUNERE
alter table public.audit_logs enable row level security;

create policy audit_logs_insert_own
on public.audit_logs for insert to authenticated
with check (user_id = (select auth.uid()));

create policy audit_logs_select_auditors
on public.audit_logs for select to authenticated
using (private.hub_can(array['admin_audit'], array[1]));

-- Fără UPDATE și DELETE.
```

Precondiție: toate apelurile `addAuditLog` trebuie să furnizeze UUID-ul sesiunii; inserările cu `user_id = null` vor fi respinse.

### 3.4 `plati_manager`

```sql
-- PROPUNERE
alter table public.plati_manager enable row level security;

create policy plati_manager_select
on public.plati_manager for select to authenticated
using (
  private.hub_can(array['manager_dashboard'], array[1,2])
  or (
    private.hub_can(array['plati'], array[1])
    and creat_de = (select auth.uid())
  )
);

create policy plati_manager_insert_own
on public.plati_manager for insert to authenticated
with check (
  private.hub_can(array['plati'], array[1,2])
  and creat_de = (select auth.uid())
  and coalesce(status, 'neplatit') = 'neplatit'
);

create policy plati_manager_mark_paid
on public.plati_manager for update to authenticated
using (private.hub_can(array['manager_dashboard'], array[1,2]))
with check (
  private.hub_can(array['manager_dashboard'], array[1,2])
  and status in ('neplatit','platit')
);

create policy plati_manager_delete_unpaid
on public.plati_manager for delete to authenticated
using (
  status = 'neplatit'
  and (
    private.hub_can(array['manager_dashboard'], array[1,2])
    or (
      private.hub_can(array['plati'], array[1])
      and creat_de = (select auth.uid())
    )
  )
);
```

Limită: o politică de update la nivel de rând nu limitează coloanele actualizabile. Pentru garantarea faptului că Managerul schimbă numai `status`, `data_platii` și `platit_de`, este preferabil un RPC dedicat și revocarea `UPDATE` direct.

### 3.5 `contracte`

```sql
-- PROPUNERE
alter table public.contracte enable row level security;

create policy contracte_select
on public.contracte for select to authenticated
using (private.hub_can(array['contracte'], array[1]));

create policy contracte_insert
on public.contracte for insert to authenticated
with check (private.hub_can(array['contracte'], array[1]));

create policy contracte_update
on public.contracte for update to authenticated
using (private.hub_can(array['contracte'], array[1]))
with check (private.hub_can(array['contracte'], array[1]));

-- Fără DELETE până la confirmare.
```

Storage nu poate fi securizat în aceeași etapă fără schimbare frontend; vezi secțiunea 8.

### 3.6 Evaluarea etapei 1

| Schimbare | Risc | Impact | Precondiții | Teste necesare | Rollback |
|---|---|---|---|---|---|
| Profiluri/roluri | foarte ridicat | login, toate paginile și Edge Dezmembrări | login prin poreclă înlocuit; proiecție actori; conturi test | login email/poreclă, profil propriu, Admin user management, Edge | `11_PLAN_ROLLBACK.md`, etapa 1A |
| Audit append-only | mediu | logarea poate eșua dacă actorul lipsește | toate call-site-urile verificate | insert propriu, falsificare user_id, read auditor, U/D respinse | etapa 1B |
| Plăți | ridicat | Plăți și Manager Dashboard | regula de ștergere aprobată | owner/non-owner, manager mark paid, update arbitrar | etapa 1C |
| Contracte | mediu | pagina Contracte și dashboard | permisiuni pe conturi test | S/I/U permis; D și anon respinse | etapa 1D |

## 4. Etapa 2 — devize și avansuri

### 4.1 `devize`

```sql
-- PROPUNERE
alter table public.devize enable row level security;

create policy devize_select
on public.devize for select to authenticated
using (private.hub_can(
  array['devize','deviz_estimativ','cautare_deviz','deviz_final',
        'clienti_notificari','admin_devize','manager_dashboard'],
  array[1]
));

create policy devize_insert
on public.devize for insert to authenticated
with check (
  private.hub_can(array['devize','deviz_estimativ'], array[1])
  and created_by = (select auth.uid())
);

create policy devize_update
on public.devize for update to authenticated
using (private.hub_can(array['devize','deviz_estimativ','admin_devize'], array[1]))
with check (private.hub_can(array['devize','deviz_estimativ','admin_devize'], array[1]));

create policy devize_delete_admin
on public.devize for delete to authenticated
using (private.hub_can(array['admin_devize'], array[1]));
```

Precondiție: confirmați că toate inserările setează `created_by`. Pentru rândurile istorice cu `NULL`, politica de SELECT nu este afectată.

### 4.2 `deviz_final_header` și `deviz_final_linii`

```sql
-- PROPUNERE
alter table public.deviz_final_header enable row level security;
alter table public.deviz_final_linii enable row level security;

create policy deviz_final_header_select
on public.deviz_final_header for select to authenticated
using (private.hub_can(
  array['deviz_final','cautare_deviz','clienti_notificari',
        'manager_dashboard','admin_devize'],
  array[1]
));

create policy deviz_final_header_insert
on public.deviz_final_header for insert to authenticated
with check (
  private.hub_can(array['deviz_final'], array[1])
  and created_by = (select auth.uid())
);

create policy deviz_final_header_update
on public.deviz_final_header for update to authenticated
using (private.hub_can(array['deviz_final'], array[1]))
with check (private.hub_can(array['deviz_final'], array[1]));

create policy deviz_final_header_delete_admin
on public.deviz_final_header for delete to authenticated
using (private.hub_can(array['admin_devize'], array[1]));

create policy deviz_final_linii_select
on public.deviz_final_linii for select to authenticated
using (private.hub_can(
  array['deviz_final','cautare_deviz','clienti_notificari',
        'manager_dashboard','admin_devize'],
  array[1]
));

create policy deviz_final_linii_insert
on public.deviz_final_linii for insert to authenticated
with check (private.hub_can(array['deviz_final'], array[1]));

create policy deviz_final_linii_delete
on public.deviz_final_linii for delete to authenticated
using (private.hub_can(array['deviz_final','admin_devize'], array[1]));
```

Nu este propus `UPDATE` pentru linii deoarece codul confirmat le recreează; dacă există un call-site de update, acesta trebuie inventariat înainte.

RPC-ul `create_deviz_final_from_constatare` este `SECURITY INVOKER`; după activarea RLS va avea nevoie ca apelantul să treacă politicile de Constatare, antet și linii.

### 4.3 Avansuri

```sql
-- PROPUNERE
alter table public.evidente_avansuri enable row level security;
alter table public.evidente_avansuri_plati enable row level security;

create policy avansuri_select
on public.evidente_avansuri for select to authenticated
using (private.hub_can(array['avansuri','clienti_notificari','manager_dashboard'], array[1]));
create policy avansuri_insert
on public.evidente_avansuri for insert to authenticated
with check (private.hub_can(array['avansuri','clienti_notificari'], array[1]));
create policy avansuri_update
on public.evidente_avansuri for update to authenticated
using (private.hub_can(array['avansuri','clienti_notificari'], array[1]))
with check (private.hub_can(array['avansuri','clienti_notificari'], array[1]));
create policy avansuri_delete
on public.evidente_avansuri for delete to authenticated
using (private.hub_can(array['avansuri','clienti_notificari'], array[1]));

create policy avansuri_plati_select
on public.evidente_avansuri_plati for select to authenticated
using (private.hub_can(array['avansuri','clienti_notificari','manager_dashboard'], array[1]));
create policy avansuri_plati_insert
on public.evidente_avansuri_plati for insert to authenticated
with check (private.hub_can(array['avansuri','clienti_notificari'], array[1]));
create policy avansuri_plati_update
on public.evidente_avansuri_plati for update to authenticated
using (private.hub_can(array['avansuri'], array[1]))
with check (private.hub_can(array['avansuri'], array[1]));
create policy avansuri_plati_delete
on public.evidente_avansuri_plati for delete to authenticated
using (private.hub_can(array['avansuri'], array[1]));
```

| Schimbare | Risc | Impact | Precondiții | Teste | Rollback |
|---|---|---|---|---|---|
| Devize estimative | ridicat | Deviz, Căutare, Admin, Clienți, Dashboard | `created_by` la insert; permisiunile consumatorilor | creare/editare/print/căutare/admin delete | etapa 2A |
| Deviz final | foarte ridicat | Constatare→RPC, import, editare, Manager KPI | Constatare RLS testată împreună; call-site U linii verificat | RPC atomic, import, edit, delete admin, FK comandă SH | etapa 2B |
| Avansuri | ridicat | Avansuri, C&N, Manager, dashboard | ștergerea confirmată; permisiunile C&N | CRUD avans/plată și read-only Manager | etapa 2C |

## 5. Etapa 3 — Constatare și registrul central

### 5.1 Extinderea politicilor existente pentru registrul clienți

Politicile actuale trebuie înlocuite, nu dublate, pentru a evita OR-uri greu de urmărit. Modelul de mai jos se aplică la `clienti`, `clienti_vehicule` și `clienti_contacte`.

```sql
-- PROPUNERE EXEMPLU pentru public.clienti;
-- repetați cu nume distincte pentru cele trei tabele.
drop policy if exists clienti_select_hub_permission on public.clienti;
drop policy if exists clienti_insert_hub_permission on public.clienti;
drop policy if exists clienti_update_hub_permission on public.clienti;

create policy clienti_select_module
on public.clienti for select to authenticated
using (private.hub_can(array['clienti_notificari','constatari'], array[1]));

create policy clienti_insert_module
on public.clienti for insert to authenticated
with check (private.hub_can(array['clienti_notificari','constatari'], array[1]));

create policy clienti_update_module
on public.clienti for update to authenticated
using (private.hub_can(array['clienti_notificari','constatari'], array[1]))
with check (private.hub_can(array['clienti_notificari','constatari'], array[1]));
```

Pentru `clienti_vehicule`, SELECT trebuie să includă și `avansuri`; această permisiune nu trebuie să primească automat I/U.

### 5.2 Tabele Constatare

```sql
-- PROPUNERE
alter table public.constatari enable row level security;
alter table public.constatari_departamente enable row level security;
alter table public.constatari_asteptare_piese enable row level security;
alter table public.constatari_repartizari enable row level security;

create policy constatari_select
on public.constatari for select to authenticated
using (private.hub_can(
  array['constatari','clienti_notificari','deviz_final','manager_dashboard'],
  array[1]
));
create policy constatari_insert
on public.constatari for insert to authenticated
with check (private.hub_can(array['constatari'], array[1]));
create policy constatari_update
on public.constatari for update to authenticated
using (private.hub_can(array['constatari'], array[1]))
with check (private.hub_can(array['constatari'], array[1]));

create policy constatari_departamente_select
on public.constatari_departamente for select to authenticated
using (private.hub_can(array['constatari','clienti_notificari','manager_dashboard'], array[1]));
create policy constatari_departamente_insert
on public.constatari_departamente for insert to authenticated
with check (private.hub_can(array['constatari'], array[1]));
create policy constatari_departamente_update
on public.constatari_departamente for update to authenticated
using (private.hub_can(array['constatari'], array[1]))
with check (private.hub_can(array['constatari'], array[1]));

create policy asteptare_select
on public.constatari_asteptare_piese for select to authenticated
using (private.hub_can(array['constatari','manager_dashboard'], array[1]));
create policy asteptare_insert
on public.constatari_asteptare_piese for insert to authenticated
with check (private.hub_can(array['constatari'], array[1]));
create policy asteptare_update
on public.constatari_asteptare_piese for update to authenticated
using (private.hub_can(array['constatari'], array[1]))
with check (private.hub_can(array['constatari'], array[1]));

create policy repartizari_select
on public.constatari_repartizari for select to authenticated
using (private.hub_can(array['constatari','admin_echipe'], array[1]));
-- Fără I/U/D până la confirmarea fluxului de repartizare.
```

### 5.3 Personal service

```sql
-- PROPUNERE
alter table public.service_personal enable row level security;

create policy service_personal_select
on public.service_personal for select to authenticated
using (private.hub_can(array['constatari','admin_echipe'], array[1]));
create policy service_personal_insert
on public.service_personal for insert to authenticated
with check (private.hub_can(array['admin_echipe'], array[1]));
create policy service_personal_update
on public.service_personal for update to authenticated
using (private.hub_can(array['admin_echipe'], array[1]))
with check (private.hub_can(array['admin_echipe'], array[1]));
```

| Schimbare | Risc | Impact | Precondiții | Teste | Rollback |
|---|---|---|---|---|---|
| Registru central | foarte ridicat | C&N, Constatare, Avansuri | decideți accesul Constatare/Avansuri; testați FK | client existent/nou, vehicul/contact și rolurile active consumatoare | etapa 3A |
| Constatare | foarte ridicat | service, RPC Deviz, Manager, C&N | permisiunile rolurilor active aprobate; fără politici dedicate rolurilor inactive | creare/salvare/status/departamente/așteptare/print/RPC | etapa 3B |
| Echipe | mediu | Constatare și Admin Echipe | cine administrează personalul | listare în Constatare, I/U delegat, acces negativ | etapa 3C |

## 6. Etapa 4 — logistică, stoc și configurări

### 6.1 AWB

```sql
-- PROPUNERE
alter table public.evidenta_awb enable row level security;
create policy awb_select on public.evidenta_awb for select to authenticated
using (private.hub_can(array['awb','magazie','manager_dashboard'], array[1]));
create policy awb_insert on public.evidenta_awb for insert to authenticated
with check (private.hub_can(array['awb','magazie'], array[1]));
create policy awb_update on public.evidenta_awb for update to authenticated
using (private.hub_can(array['awb','magazie'], array[1]))
with check (private.hub_can(array['awb','magazie'], array[1]));
```

### 6.2 Stoc

```sql
-- PROPUNERE
alter table public.stoc_produse enable row level security;
alter table public.stoc_miscari enable row level security;

create policy stoc_produse_select on public.stoc_produse for select to authenticated
using (private.hub_can(array['consumabile','magazie','admin_consumabile','manager_dashboard'], array[1]));
create policy stoc_produse_insert on public.stoc_produse for insert to authenticated
with check (private.hub_can(array['consumabile','admin_consumabile'], array[1]));
create policy stoc_produse_update on public.stoc_produse for update to authenticated
using (private.hub_can(array['admin_consumabile'], array[1]))
with check (private.hub_can(array['admin_consumabile'], array[1]));

create policy stoc_miscari_select on public.stoc_miscari for select to authenticated
using (private.hub_can(array['consumabile','magazie','admin_consumabile','manager_dashboard'], array[1]));
create policy stoc_miscari_insert on public.stoc_miscari for insert to authenticated
with check (private.hub_can(array['consumabile','admin_consumabile'], array[1]));
create policy stoc_miscari_delete_admin on public.stoc_miscari for delete to authenticated
using (private.hub_can(array['admin_consumabile'], array[1]));
```

View-ul trebuie recreat cu aceeași definiție și opțiunea invoker:

```sql
-- PROPUNERE; păstrați definiția exactă din snapshot
create or replace view public.stoc_view_curent
with (security_invoker = true)
as
select /* definiția curentă verificată și versionată */ ...;

revoke all on public.stoc_view_curent from anon, authenticated;
grant select on public.stoc_view_curent to authenticated, service_role;
```

### 6.3 Configurarea alertelor

```sql
-- PROPUNERE
alter table public.config_alerte enable row level security;
create policy config_alerte_select on public.config_alerte for select to authenticated
using (private.hub_can(array['admin_alerte'], array[1]));
create policy config_alerte_update on public.config_alerte for update to authenticated
using (private.hub_can(array['admin_alerte'], array[1]))
with check (private.hub_can(array['admin_alerte'], array[1]));
```

Funcția Edge folosește `service_role` și va ocoli RLS. Acest comportament trebuie menținut numai după securizarea endpointului.

| Schimbare | Risc | Impact | Precondiții | Teste | Rollback |
|---|---|---|---|---|---|
| AWB | mediu | AWB, Dashboard, Manager | acces Manager read-only confirmat | I/U operator, S manager, D respins | etapa 4A |
| Stoc + view | foarte ridicat | Consumabile, Admin, dashboard, manager | definiție view salvată; drept U produs decis | creare produs/mișcare, PDF, corecție Admin, KPI | etapa 4B |
| Config alerte | ridicat | Admin și Edge cron | endpoint Edge securizat/testat | Admin S/U, anon respins, execuție cron | etapa 4C |

## 7. Etapa 5 — corectarea politicilor existente prea largi sau nealiniate

### 7.1 Generator

```sql
-- PROPUNERE
drop policy if exists "Permite_tot_pentru_public" on public.generator_logs;
create policy generator_select on public.generator_logs for select to authenticated
using (private.hub_can(array['generator','magazie','manager_dashboard'], array[1]));
create policy generator_insert on public.generator_logs for insert to authenticated
with check (private.hub_can(array['generator','magazie'], array[1]));
create policy generator_update on public.generator_logs for update to authenticated
using (private.hub_can(array['generator','magazie'], array[1]))
with check (private.hub_can(array['generator','magazie'], array[1]));
```

### 7.2 TODO

Regula de business este confirmată: `todo_tasks` este modul personal și exclusiv al Adminului. Nu se introduce `admin_todo` și nu se deleagă accesul prin alte permisiuni.

```sql
-- PROPUNERE ADMIN-ONLY
drop policy if exists "todo authenticated select" on public.todo_tasks;
drop policy if exists "todo authenticated insert" on public.todo_tasks;
drop policy if exists "todo authenticated update" on public.todo_tasks;
drop policy if exists "todo authenticated delete" on public.todo_tasks;

create policy todo_select on public.todo_tasks for select to authenticated
using (private.hub_can('{}'::text[], array[1]));
create policy todo_insert on public.todo_tasks for insert to authenticated
with check (private.hub_can('{}'::text[], array[1]));
create policy todo_update on public.todo_tasks for update to authenticated
using (private.hub_can('{}'::text[], array[1]))
with check (private.hub_can('{}'::text[], array[1]));
create policy todo_delete on public.todo_tasks for delete to authenticated
using (private.hub_can('{}'::text[], array[1]));
```

### 7.3 Anunțuri

```sql
-- PROPUNERE: înlocuiește cele patru politici Admin-only
create policy announcements_read_authenticated
on public.admin_announcements for select to authenticated
using (activ = true or private.hub_can(array['admin_megafon'], array[1]));

create policy announcements_write
on public.admin_announcements for insert to authenticated
with check (private.hub_can(array['admin_megafon'], array[1]));

create policy announcements_update
on public.admin_announcements for update to authenticated
using (private.hub_can(array['admin_megafon'], array[1]))
with check (private.hub_can(array['admin_megafon'], array[1]));

create policy announcements_delete
on public.admin_announcements for delete to authenticated
using (private.hub_can(array['admin_megafon'], array[1]));
```

Politicile vechi trebuie șterse în aceeași migrare; altfel se vor combina permisiv cu cele noi.

### 7.4 Flotă, Detailing, Telefoane și Bază VIN

Înainte de schimbare trebuie decis dacă fallback-urile UI sunt intenționate. Varianta compatibilă cu UI ar extinde:

- Flotă: `flota`, `lista_masini`, `admin_alerte`;
- Detailing: `detailing`, iar `manager_dashboard` numai pentru SELECT; `constatari` numai dacă fallback-ul este aprobat;
- Telefoane: `telefoane`; `devize` numai dacă fallback-ul este aprobat;
- Bază VIN: `baza_vin`; `flota` numai dacă fallback-ul este aprobat.

Model SQL pentru fiecare operație:

```sql
-- EXEMPLU, NU EXECUTA înainte de decizia asupra fallback-urilor
create policy flota_select_v2 on public.flota_auto for select to authenticated
using (private.hub_can(array['flota','lista_masini','admin_alerte'], array[1]));
```

### 7.5 Funcțiile Dezmembrări

```sql
-- PROPUNERE
revoke execute on function public.can_capture_dezmembrari() from public, anon;
revoke execute on function public.can_manage_dezmembrari() from public, anon;
grant execute on function public.can_capture_dezmembrari() to authenticated, service_role;
grant execute on function public.can_manage_dezmembrari() to authenticated, service_role;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- Triggerul poate continua să invoce funcția ca owner; validați în staging.
```

`handle_new_user` trebuie recreată cu `SET search_path = public, pg_temp` și comentariul/rolul implicit trebuie aliniate după decizia de business.

## 8. Etapa 6 — Storage Contracte și Edge

Aceasta nu este o schimbare RLS izolată și cere modificări coordonate de cod. Nu se aplică înainte de o misiune separată aprobată.

### 8.1 Model Storage propus

1. bucket privat;
2. codul folosește URL-uri semnate, nu `getPublicUrl`;
3. obiectele existente sunt mapate de la URL la path;
4. upload numai pentru A/P(`contracte`), JPEG și limită de mărime;
5. SELECT numai pentru A/P(`contracte`);
6. UPDATE/DELETE numai dacă este definit un flux de înlocuire/cleanup.

```sql
-- PROPUNERE CONCEPTUALĂ; necesită testarea apelului helper din schema storage
create policy contract_docs_select
on storage.objects for select to authenticated
using (
  bucket_id = 'documente_contracte'
  and private.hub_can(array['contracte'], array[1])
);

create policy contract_docs_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'documente_contracte'
  and private.hub_can(array['contracte'], array[1])
);
```

Schimbarea `public=false`, limitele bucket-ului și migrarea URL-urilor trebuie să fie într-un plan separat cu backup al obiectelor.

### 8.2 Edge `trimite-alerte`

Înainte de orice schimbare RLS pe `config_alerte`/`flota_auto`:

- activați autentificarea funcției sau validați un secret de cron în corp;
- păstrați exact versiunea 23 pentru rollback;
- verificați că jobul cron poate furniza autentificarea aleasă;
- limitați răspunsul și adăugați idempotency pentru prag/data curentă;
- nu expuneți service role în client.

## 9. Întărirea granturilor

După ce toate politicile și funcțiile sunt testate:

```sql
-- PROPUNERE
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon;

-- Pentru authenticated, eliminați privilege-urile care nu sunt necesare.
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Apoi acordați explicit doar operațiile cerute de fiecare tabel.
-- Exemplu:
grant select, insert, update on public.contracte to authenticated;
grant select, insert, update, delete on public.plati_manager to authenticated;
grant select on public.auth_roles to authenticated;
grant select, insert on public.audit_logs to authenticated;
```

Nu se recomandă `REVOKE ALL ... authenticated` urmat de remediere manuală în producție; o omisiune ar bloca imediat modulele. Granturile exacte trebuie generate din matrice și aplicate în aceeași tranzacție cu testul de smoke.

Pentru secvențe, `authenticated` primește `USAGE` numai pe secvențele tabelelor în care are `INSERT`; `anon` nu are nevoie de nicio secvență după adaptarea loginului.

## 10. Ordinea de rollout recomandată

1. staging + helper + teste automate;
2. eliminarea accesului anonim unde nu există dependențe;
3. Audit și Contracte DB;
4. Plăți Manager;
5. Devize și Avansuri;
6. Registru clienți + Constatare + personal;
7. AWB și Stoc + view invoker;
8. Config alerte, numai după securizarea Edge;
9. Generator, TODO, Anunțuri și alinierea politicilor existente;
10. granturi minimale;
11. Storage Contracte într-o misiune separată.

Fiecare pas se distribuie separat și se observă înainte de continuare. Niciuna dintre etape nu trebuie combinată cu refactorizarea aplicației sau cu dezvoltarea Manager Dashboard.

## 11. Actualizare 15.10.2026 — precondiții pentru Avansuri

Acest plan rămâne **NEAPLICAT**. Înainte de etapa 2 trebuie incluse în baseline `vehicle_id`, `total_avans`, `avans_id`, FK-urile restrictive, CHECK-urile, indexul unic și `private.deviz_final_avans_review`. Politicile viitoare pentru `deviz_final_header`, `deviz_final_linii`, `evidente_avansuri` și plăți trebuie să permită operațiile invoker ale `save_deviz_final` și `list_deviz_final_importable_avansuri`, inclusiv citirea statusului de review și blocarea rândurilor sursă. Se testează atât permisiunea `deviz_final` fără `clienti_notificari`, cât și refuzul rolurilor fără permisiune.

Nu se revocă EXECUTE/USAGE necesar helperului de vehicul fără verificarea întregului traseu. `create_deviz_final_from_constatare` și linkurile SH trebuie să rămână funcționale. Restrângerea accesului direct este scopul planului RLS, nu o proprietate a migrației Avansuri.


## Actualizare 18.10.2026 — seria 1, PREGĂTIT - NEAPLICAT

### Ordinea concretă a seriei 1

Selectate numai contracte și todo_tasks, risc operațional MIC. Generator MEDIU (stare globală/KPI), config_alerte MARE (Edge/email), AWB MEDIU (valori și raportare) sunt amânate. Nu aplicăm vechile exemple de DROP POLICY TODO sau helperul general hub_can pentru această serie.

Migrarea nouă păstrează cele 4 politici TODO și adaugă un guard RESTRICTIVE Admin-only; Contracte primește S/I/U, fără D, cu fallback exact ca Dashboard. anon pierde toate granturile; authenticated păstrează S/I/U Contracte și CRUD TODO. Nu sunt introduse funcții SECURITY DEFINER. Preflight-ul oprește aplicarea în starea actuală deoarece auth_profiles este editabil fără RLS. Rezolvarea acelei surse de autorizare rămâne o etapă separată, fără modificări în această rundă.


## Actualizare 18.10.2026 — RLS Seria 0 AUTH_PROFILES, PREGĂTIT - NEAPLICAT

Pentru auth_profiles, propunerea concretă este migrarea `20261018162136_rls_seria_0_auth_profiles.sql`, care are prioritate asupra exemplului general din §3.1. Două politici (SELECT propriu/Admin și UPDATE Admin), helper privat strict pentru evitarea recursiei, granturi pe coloanele editate legitim și hardening de search_path/EXECUTE pentru triggerul existent. Nu se introduce self-update sau RPC Admin paralel. Preflight oprește orice drift față de baseline și lipsa validării loginului/actorilor. Frontendul actual nu este compatibil integral; nu aplicați acum. Timestampul Seriei 1 este anterior: nu rulați întreg directorul de migrări și nu continuați cu Seria 1. auth_roles rămâne în afara schimbării și cere remediere separată.
