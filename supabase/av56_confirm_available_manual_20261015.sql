-- Executati manual numai dupa verificarea citita a fixture-ului; acest fisier NU se aplica automat.
-- Un singur rand returnat inseamna AV-56 confirmat; zero randuri cer investigare, nu reluare oarba.
insert into private.deviz_final_avans_review (avans_id, status)
select a.id, 'confirmed_available'
from public.evidente_avansuri a
join public.clienti_vehicule v on v.id = a.vehicle_id
join public.deviz_final_header h on h.id_deviz_final = 201
where a.id = 56
  and a.vehicle_id = 48
  and upper(pg_catalog.regexp_replace(a.nr_inmatriculare, '[^A-Za-z0-9]', '', 'g')) = 'CT11AAA'
  and a.este_arhivat is false
  and v.id = 48 and v.client_id = 47
  and upper(pg_catalog.regexp_replace(v.nr_inmatriculare, '[^A-Za-z0-9]', '', 'g')) = 'CT11AAA'
  and upper(pg_catalog.regexp_replace(h.nr_inmatriculare, '[^A-Za-z0-9]', '', 'g')) = 'CT11AAA'
  and h.client = 'CLIENT TEST' and h.vehicle_id is null and h.constatare_id is null and h.total_avans = 0
  and not exists (select 1 from public.deviz_final_linii l where l.avans_id = a.id)
  and not exists (select 1 from private.deviz_final_avans_review r where r.avans_id = a.id)
  and (select pg_catalog.sum(p.suma) from public.evidente_avansuri_plati p where p.avans_id = a.id) = 500
  and (select pg_catalog.bool_and(p.suma > 0 and p.suma::text not in ('NaN', 'Infinity', '-Infinity'))
       from public.evidente_avansuri_plati p where p.avans_id = a.id) is true
on conflict (avans_id) do nothing
returning avans_id, status;
