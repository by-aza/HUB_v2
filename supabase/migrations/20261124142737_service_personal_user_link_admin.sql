-- PREGĂTIT, NEAPLICAT: asocierea explicită a unui cont HUB cu un rând service_personal din Admin → Echipe & Departamente.
-- Nu modifică date sau legături existente; nu acordă DELETE; nu creează UNIQUE pe user_id
-- (același cont poate fi legat de mai multe departamente ale aceleiași persoane).

-- 1) UPDATE pe coloana user_id pentru authenticated (legare/dezlegare explicită din selectorul din Admin).
--    Politica existentă hub_personal_update rămâne neschimbată și permite UPDATE numai pentru rol Admin sau
--    permisiunea admin_echipe (USING și WITH CHECK): utilizatorii cu doar atelier_rapid nu pot lega sau dezlega conturi.
grant update (user_id) on table public.service_personal to authenticated;

-- 2) INSERT: se elimină politica veche, care permitea user_id = auth.uid() (sursa legăturilor greșite către adminul logat),
--    și rămâne ca unică cale de creare o politică ce cere Admin/admin_echipe ȘI user_id NULL.
--    Contul se asociază ulterior, doar prin UPDATE (punctul 1).
drop policy if exists hub_personal_insert on public.service_personal;

drop policy if exists hub_personal_insert_unlinked on public.service_personal;
create policy hub_personal_insert_unlinked on public.service_personal
  for insert to authenticated
  with check (
    user_id is null
    and (select exists (
      select 1 from public.auth_profiles p
      where p.id = (select auth.uid())
        and (p.rol_id = 1 or (p.permissions -> 'admin_echipe') = 'true'::jsonb)
    ))
  );
