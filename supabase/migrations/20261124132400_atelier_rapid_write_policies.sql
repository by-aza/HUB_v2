-- PREGĂTIT, NEAPLICAT: scriere controlată în constatari_departamente pentru utilizatorii cu permisiunea atelier_rapid.
-- Nu există DELETE, SECURITY DEFINER, politici înlocuite sau schimbări de schemă:
-- unicitatea (constatare_id, departament) există deja (constraint constatari_departamente_unique) și nu există duplicate.
-- Politicile existente (hub_const_3_*, hub_atelier_read) rămân neschimbate și se combină permisiv cu cele noi.

-- 1) Privilegii pe coloane. authenticated are deja INSERT/UPDATE pe aceste coloane (printre altele, folosite de Constatări);
--    instrucțiunea este idempotentă și documentează setul exact folosit de Atelier Rapid. Nu se revocă nimic (ar afecta Constatări).
grant insert (constatare_id, departament, constatari, piese_materiale, lucrari_efectuate, status, updated_at, actualizat_de)
on table public.constatari_departamente to authenticated;
grant update (constatari, piese_materiale, lucrari_efectuate, status, updated_at, actualizat_de)
on table public.constatari_departamente to authenticated;

-- 2) INSERT: rândul nou trebuie să fie al departamentului propriu, pentru o mașină repartizată activ exact acelei persoane
--    și neînchisă (constatari.status diferit de Finalizat/Arhivat). Lanțul de citire constatari -> repartizari -> service_personal
--    nu face referire înapoi la constatari_departamente, deci politicile nu sunt recursive.
drop policy if exists hub_atelier_insert on public.constatari_departamente;
create policy hub_atelier_insert on public.constatari_departamente
  for insert to authenticated
  with check (
    (select exists (
      select 1 from public.auth_profiles p
      where p.id = (select auth.uid())
        and (p.permissions -> 'atelier_rapid') = 'true'::jsonb
    ))
    and exists (
      select 1
      from public.service_personal sp
      join public.constatari_repartizari r on r.service_personal_id = sp.id
      where sp.user_id = (select auth.uid())
        and sp.activ = true
        and sp.departament = constatari_departamente.departament
        and r.constatare_id = constatari_departamente.constatare_id
        and r.activ = true
        and r.retras_la is null
    )
    /* mașina nu este închisă: statusul global al constatării nu este Finalizat sau Arhivat */
    and exists (
      select 1 from public.constatari c
      where c.id = constatari_departamente.constatare_id
        and c.status not in ('Finalizat', 'Arhivat')
    )
  );

-- 3) UPDATE: rândul existent și rândul rezultat trebuie să respecte aceeași condiție (departament propriu + repartizare activă)
drop policy if exists hub_atelier_update on public.constatari_departamente;
create policy hub_atelier_update on public.constatari_departamente
  for update to authenticated
  using (
    (select exists (
      select 1 from public.auth_profiles p
      where p.id = (select auth.uid())
        and (p.permissions -> 'atelier_rapid') = 'true'::jsonb
    ))
    and exists (
      select 1
      from public.service_personal sp
      join public.constatari_repartizari r on r.service_personal_id = sp.id
      where sp.user_id = (select auth.uid())
        and sp.activ = true
        and sp.departament = constatari_departamente.departament
        and r.constatare_id = constatari_departamente.constatare_id
        and r.activ = true
        and r.retras_la is null
    )
    /* mașina nu este închisă: statusul global al constatării nu este Finalizat sau Arhivat */
    and exists (
      select 1 from public.constatari c
      where c.id = constatari_departamente.constatare_id
        and c.status not in ('Finalizat', 'Arhivat')
    )
  )
  with check (
    (select exists (
      select 1 from public.auth_profiles p
      where p.id = (select auth.uid())
        and (p.permissions -> 'atelier_rapid') = 'true'::jsonb
    ))
    and exists (
      select 1
      from public.service_personal sp
      join public.constatari_repartizari r on r.service_personal_id = sp.id
      where sp.user_id = (select auth.uid())
        and sp.activ = true
        and sp.departament = constatari_departamente.departament
        and r.constatare_id = constatari_departamente.constatare_id
        and r.activ = true
        and r.retras_la is null
    )
    /* mașina nu este închisă: statusul global al constatării nu este Finalizat sau Arhivat */
    and exists (
      select 1 from public.constatari c
      where c.id = constatari_departamente.constatare_id
        and c.status not in ('Finalizat', 'Arhivat')
    )
  );

-- 4) Gardă pe coloane + timpul de finalizare al departamentului (politicile RLS nu pot compara valoarea veche cu cea nouă).
--    Pentru scriitorii care NU au drept de birou/admin (rol Admin sau permisiunea constatari): se interzice schimbarea
--    constatare_id, departament, elemente_lucrate; actualizat_de trebuie să fie utilizatorul curent; finalizat_la este
--    gestionat exclusiv aici (valoarea trimisă de client este ignorată):
--      - status devine Finalizat           -> finalizat_la = now() al bazei de date
--      - rândul era deja Finalizat         -> se păstrează finalizat_la original (doar textul s-a schimbat)
--      - status se schimbă din Finalizat   -> finalizat_la = NULL
--      - INSERT cu status Finalizat        -> finalizat_la = now()
--    Funcție SECURITY INVOKER; auth.uid() NULL (service_role) și utilizatorii de birou/admin trec neschimbat.
create or replace function public.atelier_dept_write_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return new;
  end if;
  if exists (
    select 1 from public.auth_profiles p
    where p.id = v_uid
      and (p.rol_id = 1 or (p.permissions -> 'constatari') = 'true'::jsonb)
  ) then
    return new;
  end if;

  if new.actualizat_de is distinct from v_uid then
    raise exception 'Atelier Rapid: actualizat_de trebuie să fie utilizatorul curent' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if new.elemente_lucrate is not null then
      raise exception 'Atelier Rapid nu poate seta elemente_lucrate' using errcode = '42501';
    end if;
    new.finalizat_la := case when new.status = 'Finalizat' then now() else null end;
  else
    if new.constatare_id is distinct from old.constatare_id
       or new.departament is distinct from old.departament
       or new.elemente_lucrate is distinct from old.elemente_lucrate then
      raise exception 'Atelier Rapid poate modifica doar constatari, piese_materiale, lucrari_efectuate, status, updated_at și actualizat_de' using errcode = '42501';
    end if;
    if new.status = 'Finalizat' then
      new.finalizat_la := case when old.status = 'Finalizat' then coalesce(old.finalizat_la, now()) else now() end;
    else
      new.finalizat_la := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_atelier_dept_write_guard on public.constatari_departamente;
create trigger trg_atelier_dept_write_guard
  before insert or update on public.constatari_departamente
  for each row execute function public.atelier_dept_write_guard();
