-- PREGĂTIT, NEAPLICAT: corectează service_personal.user_id (legături greșite către conturile admin/birou).
-- Efect: user_id = NULL pentru toate rândurile, apoi leagă numai id 20 (CSN TEST / Mecanica)
-- la test_mecanic@csngarage.ro și id 12 (Brinzeiu Cosmin / Vopsitorie) la cosminjst19@gmail.com.
-- Nu modifică nume, departament, activ, ordine, repartizări, roluri sau permisiuni.
-- Rollback: necesită valorile anterioare din backup (toate erau completate cu conturi greșite).
begin;

do $$
declare
  v_test_id uuid;
  v_cosmin_id uuid;
  v_count int;
begin
  /* user_id trebuie să accepte NULL (verificat; la 24.11.2026 coloana este nullable, fără default) */
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'service_personal'
      and column_name = 'user_id' and is_nullable = 'NO'
  ) then
    raise exception 'service_personal.user_id nu acceptă NULL; migrarea este oprită.';
  end if;

  /* conturile se caută după email exact (insensibil la majuscule); exact unul fiecare, cu profil în auth_profiles */
  select count(*) into v_count from auth.users where lower(email) = 'test_mecanic@csngarage.ro';
  if v_count <> 1 then
    raise exception 'Contul test_mecanic@csngarage.ro lipsește sau este duplicat (găsite: %).', v_count;
  end if;
  select id into v_test_id from auth.users where lower(email) = 'test_mecanic@csngarage.ro';

  select count(*) into v_count from auth.users where lower(email) = 'cosminjst19@gmail.com';
  if v_count <> 1 then
    raise exception 'Contul cosminjst19@gmail.com lipsește sau este duplicat (găsite: %).', v_count;
  end if;
  select id into v_cosmin_id from auth.users where lower(email) = 'cosminjst19@gmail.com';

  if not exists (select 1 from public.auth_profiles where id = v_test_id)
     or not exists (select 1 from public.auth_profiles where id = v_cosmin_id) then
    raise exception 'Unul dintre conturi nu are rând în auth_profiles (FK service_personal_user_id_fkey).';
  end if;

  /* rândurile țintă trebuie să fie exact cele confirmate */
  if not exists (select 1 from public.service_personal where id = 20 and nume = 'CSN TEST' and departament = 'Mecanica') then
    raise exception 'service_personal id 20 nu este „CSN TEST” / Mecanica.';
  end if;
  if not exists (select 1 from public.service_personal where id = 12 and nume = 'Brinzeiu Cosmin' and departament = 'Vopsitorie') then
    raise exception 'service_personal id 12 nu este „Brinzeiu Cosmin” / Vopsitorie.';
  end if;

  /* 1) șterge toate legăturile existente */
  update public.service_personal set user_id = null where user_id is not null;

  /* 2) leagă numai cele două înregistrări confirmate; id 21 și restul rămân NULL */
  update public.service_personal set user_id = v_test_id where id = 20;
  update public.service_personal set user_id = v_cosmin_id where id = 12;

  /* verificare finală */
  select count(*) into v_count from public.service_personal where user_id is not null;
  if v_count <> 2
     or (select user_id from public.service_personal where id = 20) is distinct from v_test_id
     or (select user_id from public.service_personal where id = 12) is distinct from v_cosmin_id then
    raise exception 'Verificarea finală a eșuat; modificările sunt anulate.';
  end if;
end $$;

commit;
