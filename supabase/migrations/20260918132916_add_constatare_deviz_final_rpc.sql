-- Legătura opțională păstrează devizele vechi și documentele financiare după ștergerea unei constatări.
alter table public.deviz_final_header
  add column if not exists constatare_id bigint;

alter table public.deviz_final_header
  drop constraint if exists deviz_final_header_constatare_id_fkey;

alter table public.deviz_final_header
  add constraint deviz_final_header_constatare_id_fkey
  foreign key (constatare_id)
  references public.constatari (id)
  on update no action
  on delete set null;

-- Un singur deviz final poate fi asociat unei vizite, fără a afecta rândurile istorice cu NULL.
create unique index if not exists deviz_final_header_constatare_id_uidx
  on public.deviz_final_header (constatare_id)
  where constatare_id is not null;

-- Salvează antetul și toate liniile în aceeași tranzacție, cu drepturile și RLS-ul apelantului.
create or replace function public.create_deviz_final_from_constatare(
  p_constatare_id bigint,
  p_header jsonb,
  p_lines jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_deviz_id bigint;
  v_line jsonb;
  v_section text;
  v_name text;
  v_details text;
  v_um text;
  v_nr_crt integer;
  v_expected_lucrari integer := 0;
  v_expected_constatari integer := 0;
  v_expected_manopera integer := 0;
  v_expected_piese integer := 0;
begin
  -- Validările opresc din start apelurile anonime și payload-urile incomplete.
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Autentificarea este obligatorie.';
  end if;

  if p_constatare_id is null or p_constatare_id <= 0 then
    raise exception using errcode = '22023', message = 'constatare_id lipsește sau este invalid.';
  end if;

  if jsonb_typeof(p_header) is distinct from 'object'
     or jsonb_typeof(p_lines) is distinct from 'array'
     or jsonb_array_length(p_lines) = 0 then
    raise exception using errcode = '22023', message = 'Payload-ul antet/linii lipsește, este invalid sau este gol.';
  end if;

  if nullif(btrim(p_header ->> 'data_deviz'), '') is null
     or nullif(btrim(p_header ->> 'nr_inmatriculare'), '') is null then
    raise exception using errcode = '22023', message = 'Data devizului și numărul de înmatriculare sunt obligatorii.';
  end if;

  -- Permisiunea este citită din profilul protejat al utilizatorului, nu din user_metadata.
  if not exists (
    select 1
    from public.auth_profiles as profile
    where profile.id = v_user_id
      and (
        profile.rol_id = 1
        or coalesce(profile.permissions::jsonb, '{}'::jsonb) @> '{"deviz_final": true}'::jsonb
      )
  ) then
    raise exception using errcode = '42501', message = 'Nu aveți permisiunea deviz_final.';
  end if;

  -- Verificarea existenței respectă politica RLS aplicată tabelului constatari.
  if not exists (
    select 1
    from public.constatari
    where id = p_constatare_id
  ) then
    raise exception using errcode = '22023', message = 'Constatarea nu există sau nu este accesibilă.';
  end if;

  if exists (
    select 1
    from public.deviz_final_header
    where constatare_id = p_constatare_id
  ) then
    raise exception using errcode = '23505', message = 'Există deja un deviz final pentru această constatare.';
  end if;

  -- Antetul folosește exclusiv câmpurile permise; creatorul este întotdeauna utilizatorul autentificat.
  insert into public.deviz_final_header (
    constatare_id,
    id_deviz_estimativ,
    data_deviz,
    client,
    auto,
    nr_inmatriculare,
    serie_vin,
    serie_motor,
    km,
    termen_executie,
    discount_global_piese,
    total_manopera,
    total_piese,
    total_general,
    created_by
  ) values (
    p_constatare_id,
    null,
    btrim(p_header ->> 'data_deviz'),
    coalesce(btrim(p_header ->> 'client'), ''),
    coalesce(btrim(p_header ->> 'auto'), ''),
    btrim(p_header ->> 'nr_inmatriculare'),
    coalesce(btrim(p_header ->> 'serie_vin'), ''),
    coalesce(btrim(p_header ->> 'serie_motor'), ''),
    coalesce(btrim(p_header ->> 'km'), ''),
    coalesce(btrim(p_header ->> 'termen_executie'), ''),
    0,
    0,
    0,
    0,
    v_user_id
  )
  returning id_deviz_final into v_deviz_id;

  -- Liniile acceptă numai cele patru secțiuni existente și ordine consecutivă în fiecare secțiune.
  for v_line in
    select value from jsonb_array_elements(p_lines)
  loop
    if jsonb_typeof(v_line) is distinct from 'object' then
      raise exception using errcode = '22023', message = 'O linie din payload este invalidă.';
    end if;

    v_section := lower(btrim(v_line ->> 'sectiune'));
    v_name := btrim(v_line ->> 'denumire');
    v_details := nullif(btrim(v_line ->> 'detalii'), '');

    begin
      v_nr_crt := (v_line ->> 'nr_crt')::integer;
    exception when others then
      raise exception using errcode = '22023', message = 'nr_crt trebuie să fie un număr întreg.';
    end;

    if v_name is null or v_name = '' then
      raise exception using errcode = '22023', message = 'Liniile goale nu pot fi salvate.';
    end if;

    case v_section
      when 'lucrari' then
        v_expected_lucrari := v_expected_lucrari + 1;
        if v_nr_crt <> v_expected_lucrari then
          raise exception using errcode = '22023', message = 'Ordinea liniilor lucrari nu este consecutivă.';
        end if;
        insert into public.deviz_final_linii (
          id_deviz_final, sectiune, nr_crt, denumire, detalii,
          um, cantitate, pret_unitar, discount, total
        ) values (
          v_deviz_id, 'lucrari', v_nr_crt, v_name, null,
          null, null, null, null, null
        );

      when 'constatari' then
        v_expected_constatari := v_expected_constatari + 1;
        if v_nr_crt <> v_expected_constatari then
          raise exception using errcode = '22023', message = 'Ordinea liniilor constatari nu este consecutivă.';
        end if;
        insert into public.deviz_final_linii (
          id_deviz_final, sectiune, nr_crt, denumire, detalii,
          um, cantitate, pret_unitar, discount, total
        ) values (
          v_deviz_id, 'constatari', v_nr_crt, v_name, v_details,
          null, null, null, 0, null
        );

      when 'manopera' then
        v_expected_manopera := v_expected_manopera + 1;
        if v_nr_crt <> v_expected_manopera then
          raise exception using errcode = '22023', message = 'Ordinea liniilor manopera nu este consecutivă.';
        end if;
        insert into public.deviz_final_linii (
          id_deviz_final, sectiune, nr_crt, denumire, detalii,
          um, cantitate, pret_unitar, discount, total
        ) values (
          v_deviz_id, 'manopera', v_nr_crt, v_name, v_details,
          null, 0, 0, null, 0
        );

      when 'piese' then
        v_expected_piese := v_expected_piese + 1;
        if v_nr_crt <> v_expected_piese then
          raise exception using errcode = '22023', message = 'Ordinea liniilor piese nu este consecutivă.';
        end if;
        v_um := coalesce(nullif(btrim(v_line ->> 'um'), ''), 'buc');
        insert into public.deviz_final_linii (
          id_deviz_final, sectiune, nr_crt, denumire, detalii,
          um, cantitate, pret_unitar, discount, total
        ) values (
          v_deviz_id, 'piese', v_nr_crt, v_name, v_details,
          v_um, 0, 0, 0, 0
        );

      else
        raise exception using errcode = '22023', message = 'Secțiune de deviz invalidă.';
    end case;
  end loop;

  return v_deviz_id;
end;
$$;

-- RPC-ul nu este disponibil utilizatorilor anonimi; RLS rămâne activ prin SECURITY INVOKER.
revoke all on function public.create_deviz_final_from_constatare(bigint, jsonb, jsonb) from public;
revoke all on function public.create_deviz_final_from_constatare(bigint, jsonb, jsonb) from anon;
grant execute on function public.create_deviz_final_from_constatare(bigint, jsonb, jsonb) to authenticated;
