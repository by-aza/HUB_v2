-- Lookup pentru importul avansurilor; migrarea de salvare deja aplicata ramane intacta.
-- SECURITY INVOKER pastreaza drepturile si RLS ale utilizatorului autentificat.
create function public.list_deviz_final_importable_avansuri(
  p_deviz_id bigint,
  p_plate text,
  p_vin text
)
returns table (
  avans_id bigint,
  data_plati jsonb,
  total_achitat numeric,
  status_legatura text
)
language plpgsql stable security invoker set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_plate text := upper(pg_catalog.regexp_replace(coalesce(p_plate, ''), '[^A-Za-z0-9]', '', 'g'));
  v_vin text := upper(pg_catalog.regexp_replace(coalesce(p_vin, ''), '[^A-Za-z0-9]', '', 'g'));
  v_vehicle_id bigint;
  v_header_vehicle_id bigint;
  v_constatare_vehicle_id bigint;
begin
  if v_user_id is null or not exists (
    select 1 from public.auth_profiles profile
    where profile.id = v_user_id
      and (profile.rol_id = 1 or
           coalesce(profile.permissions::jsonb, '{}'::jsonb) @> '{"deviz_final": true}'::jsonb)
  ) then
    raise exception using errcode = '42501', message = 'Nu aveți permisiunea deviz_final.';
  end if;
  if v_plate = '' then
    raise exception using errcode = '22023', message = 'Numărul auto este obligatoriu.';
  end if;
  if p_deviz_id is not null and p_deviz_id <= 0 then
    raise exception using errcode = '22023', message = 'ID-ul devizului este invalid.';
  end if;

  -- Aceeasi identificare unica a vehiculului ca in RPC-ul de salvare.
  v_vehicle_id := private.resolve_deviz_final_vehicle(v_plate, v_vin);
  if v_vehicle_id is null then
    raise exception using errcode = '22023', message = 'Vehiculul nu este identificat unic în registru.';
  end if;
  if p_deviz_id is not null then
    select h.vehicle_id, c.vehicle_id
      into v_header_vehicle_id, v_constatare_vehicle_id
    from public.deviz_final_header h
    left join public.constatari c on c.id = h.constatare_id
    where h.id_deviz_final = p_deviz_id;
    if not found then
      raise exception using errcode = '22023', message = 'Devizul final nu există sau nu este accesibil.';
    end if;
    if (v_header_vehicle_id is not null and v_header_vehicle_id <> v_vehicle_id)
       or (v_constatare_vehicle_id is not null and v_constatare_vehicle_id <> v_vehicle_id) then
      raise exception using errcode = '22023', message = 'Numărul auto indică un alt vehicul.';
    end if;
  end if;

  -- Avansurile revendicate de alt deviz sunt excluse; platile nu expun observatii.
  return query
  select a.id, pay.data_plati, pay.total_achitat,
         case when owner.id_deviz_final = p_deviz_id then 'linked' else 'available' end
  from public.evidente_avansuri a
  left join public.deviz_final_linii owner on owner.avans_id = a.id
  left join private.deviz_final_avans_review review on review.avans_id = a.id
  cross join lateral (
    select pg_catalog.jsonb_agg(p.data_platii order by p.data_platii, p.id) as data_plati,
           pg_catalog.sum(p.suma) as total_achitat,
           pg_catalog.bool_and(p.suma > 0 and p.suma::text not in ('NaN', 'Infinity', '-Infinity')) as plati_valide
    from public.evidente_avansuri_plati p
    where p.avans_id = a.id
  ) pay
  where (a.vehicle_id = v_vehicle_id
         or (a.vehicle_id is null and upper(pg_catalog.regexp_replace(coalesce(a.nr_inmatriculare, ''), '[^A-Za-z0-9]', '', 'g')) = v_plate))
    and (owner.id_deviz_final is null or owner.id_deviz_final = p_deviz_id)
    and (owner.id_deviz_final = p_deviz_id
         or (review.status = 'confirmed_available' and a.este_arhivat is not true))
    and pay.plati_valide is true
    and pay.total_achitat > 0
    and pay.total_achitat::text not in ('NaN', 'Infinity', '-Infinity')
  order by a.id;
end;
$$;

revoke all on function public.list_deviz_final_importable_avansuri(bigint, text, text)
  from public, anon, service_role;
grant execute on function public.list_deviz_final_importable_avansuri(bigint, text, text)
  to authenticated;
