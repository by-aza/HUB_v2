-- PREGĂTIT, NEAPLICAT: permite aplicației (authenticated cu permisiunea constatari) să scrie în constatari_repartizari.
-- Adaugă numai privilegii pe coloane și politici noi INSERT/UPDATE; nu modifică politicile sau grant-urile existente.
-- Fără DELETE: repartizările se retrag prin activ = false și retras_la. Indexul unic parțial
-- constatari_repartizari_active_unique (constatare_id, service_personal_id) WHERE activ există deja.

grant insert (constatare_id, service_personal_id, activ, repartizat_la, repartizat_de),
      update (activ, retras_la, repartizat_la, repartizat_de)
on table public.constatari_repartizari
to authenticated;

drop policy if exists hub_const_4_insert on public.constatari_repartizari;
create policy hub_const_4_insert on public.constatari_repartizari
  for insert to authenticated
  with check ((select exists (
    select 1 from public.auth_profiles p
    where p.id = (select auth.uid())
      and (p.rol_id = 1 or (p.permissions -> 'constatari') = 'true'::jsonb)
  )));

drop policy if exists hub_const_4_update on public.constatari_repartizari;
create policy hub_const_4_update on public.constatari_repartizari
  for update to authenticated
  using ((select exists (
    select 1 from public.auth_profiles p
    where p.id = (select auth.uid())
      and (p.rol_id = 1 or (p.permissions -> 'constatari') = 'true'::jsonb)
  )))
  with check ((select exists (
    select 1 from public.auth_profiles p
    where p.id = (select auth.uid())
      and (p.rol_id = 1 or (p.permissions -> 'constatari') = 'true'::jsonb)
  )));
