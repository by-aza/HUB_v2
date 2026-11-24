-- Permite INSERT pe constatari.constatare_finala la crearea unei constatări noi (authenticated).
grant insert (constatare_finala)
on table public.constatari
to authenticated;
