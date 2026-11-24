-- PREGĂTIT, NEAPLICAT: acces SELECT restrâns pentru utilizatorii cu permisiunea atelier_rapid.
-- Permisiunea are același format ca restul HUB: auth_profiles.permissions -> 'atelier_rapid' = true (jsonb).
-- Politici NOI, doar SELECT; nu modifică politicile existente (se combină permisiv cu ele) și nu adaugă INSERT/UPDATE/DELETE.
-- Fără SECURITY DEFINER și fără grant-uri noi: authenticated are deja SELECT pe cele patru tabele (verificat în catalog).
-- Lanț de acces: service_personal (rând propriu) -> constatari_repartizari (repartizare activă proprie)
--                -> constatari / constatari_departamente (mașini repartizate activ).
-- După aplicare: redenumește fișierul local cu versiunea generată de Supabase.

-- 1) rândurile proprii, active, din service_personal
drop policy if exists hub_atelier_read on public.service_personal;
create policy hub_atelier_read on public.service_personal
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and activ = true
    and (select exists (
      select 1 from public.auth_profiles p
      where p.id = (select auth.uid())
        and (p.permissions -> 'atelier_rapid') = 'true'::jsonb
    ))
  );

-- 2) repartizările active ale propriilor rânduri service_personal
drop policy if exists hub_atelier_read on public.constatari_repartizari;
create policy hub_atelier_read on public.constatari_repartizari
  for select to authenticated
  using (
    activ = true
    and retras_la is null
    and (select exists (
      select 1 from public.auth_profiles p
      where p.id = (select auth.uid())
        and (p.permissions -> 'atelier_rapid') = 'true'::jsonb
    ))
    and exists (
      select 1 from public.service_personal sp
      where sp.id = constatari_repartizari.service_personal_id
        and sp.user_id = (select auth.uid())
        and sp.activ = true
    )
  );

-- 3) constatările legate printr-o repartizare activă proprie
drop policy if exists hub_atelier_read on public.constatari;
create policy hub_atelier_read on public.constatari
  for select to authenticated
  using (
    (select exists (
      select 1 from public.auth_profiles p
      where p.id = (select auth.uid())
        and (p.permissions -> 'atelier_rapid') = 'true'::jsonb
    ))
    and exists (
      select 1
      from public.constatari_repartizari r
      join public.service_personal sp on sp.id = r.service_personal_id
      where r.constatare_id = constatari.id
        and r.activ = true
        and r.retras_la is null
        and sp.user_id = (select auth.uid())
        and sp.activ = true
    )
  );

-- 4) rândurile de departament ale constatărilor repartizate activ
drop policy if exists hub_atelier_read on public.constatari_departamente;
create policy hub_atelier_read on public.constatari_departamente
  for select to authenticated
  using (
    (select exists (
      select 1 from public.auth_profiles p
      where p.id = (select auth.uid())
        and (p.permissions -> 'atelier_rapid') = 'true'::jsonb
    ))
    and exists (
      select 1
      from public.constatari_repartizari r
      join public.service_personal sp on sp.id = r.service_personal_id
      where r.constatare_id = constatari_departamente.constatare_id
        and r.activ = true
        and r.retras_la is null
        and sp.user_id = (select auth.uid())
        and sp.activ = true
    )
  );
