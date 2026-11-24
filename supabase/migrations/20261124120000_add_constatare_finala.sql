-- Constatare finală redactată de birou pentru fișa tehnică (nu modifică alte coloane, RLS sau date).
alter table public.constatari
add column if not exists constatare_finala text;

-- Privilegii pe coloană, necesare la testarea live (GRANT este idempotent: poate rula repetat).
grant select (constatare_finala),
      update (constatare_finala)
on table public.constatari
to authenticated;
