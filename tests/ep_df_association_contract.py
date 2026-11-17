"""Contract și expresii SELECT pe PostgreSQL temporar; testul NU execută migrarea.
Rulare: uv run --offline --with pgserver --with psycopg2-binary python tests/ep_df_association_contract.py
Nu instalează funcții și nu apelează backendul de producție.
"""
import os
os.environ.setdefault('XDG_RUNTIME_DIR', '/tmp/hub-ep-association-test-runtime')
from pathlib import Path
import re
import tempfile
import uuid
import pgserver
import psycopg2

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT/'supabase/migrations/20261117085755_ep_associate_df_without_import.sql'
COUNT = 0


def check(actual, expected, label):
    global COUNT
    assert actual == expected, (label, actual, expected)
    COUNT += 1
    print('PASS', label, flush=True)


def run():
    candidate = MIGRATION.read_text()
    # Garda și fragmentele sunt inspectate ca text; fișierul de migrare nu este executat.
    check(candidate.startswith('-- APLICATĂ ÎN PRODUCȚIE:') and MIGRATION.stem.split('_')[0] in candidate.splitlines()[0], True, 'versiunea migrării este marcată aplicată în producție')
    check(bool(re.search(r'\b(?:INSERT INTO|UPDATE|DELETE FROM) public\.deviz_final_(?:header|linii)\b', candidate, re.I)), False,
          'asocierea nu scrie antete, linii sau totaluri DF')
    check('UNIQUE(df_id,alocare_id)' in candidate, True, 'unicitate per DF și alocare')
    check('REFERENCES public.deviz_final_header(id_deviz_final) ON DELETE RESTRICT' in candidate, True,
          'documentul asociat nu poate dispărea prin ștergere')
    check('ENABLE ROW LEVEL SECURITY' in candidate and 'GRANT SELECT ON public.ep_asocieri_df TO authenticated' in candidate, True,
          'citirea refolosește rolul autentificat și RLS EP')
    check(bool(re.search(r'GRANT\s+(?:ALL|INSERT|UPDATE|DELETE)\b', candidate)), False, 'fără DML direct nou din browser')
    funcs = dict((m.group(1), m.group(2)) for m in re.finditer(
        r'CREATE FUNCTION ([\w.]+)\([^;]*?AS \$fn\$(.*?)\$fn\$;', candidate, re.S))
    for name in ['list_association_dfs', 'associate_df']:
        body = funcs['ep_private.'+name]
        check('require_access()' in body and 'require_df()' in body, True, name+' cere ambele permisiuni existente')
    write = funcs['ep_private.associate_df']
    for fragment, label in [
        ("begin_request(p_request,'associate_df',p)", 'idempotent pe UUID și payload'),
        ('h.ep_revision IS DISTINCT FROM', 'verifică revizia DF'),
        ('f.revision IS DISTINCT FROM', 'verifică revizia fiecărei facturi'),
        ("ep_private.qty(j->'cantitate')", 'refuză cantități nule, negative și fracționare'),
        ('aid=ANY(sources)', 'refuză aceeași alocare de două ori în lot'),
        ('ep_private.association_matches_df(aid,df)', 'reverifică mașina pe backend'),
        ('q>ep_private.capacity(l.id,aid)', 'disponibilul este verificat înainte de asociere'),
        ('PERFORM ep_private.validate_line(l.id)', 'revalidează cantitățile după inserare'),
        ('a.nr_inmatriculare_original,uid)', 'actorul este derivat din HUB, nu din payload'),
        ("finish_request(p_request,'associate_df'", 'auditul este în aceeași tranzacție')]:
        check(fragment in write, True, label)
    check('DEFAULT clock_timestamp()' in candidate and 'created_by uuid NOT NULL REFERENCES public.auth_profiles' in candidate,
          True, 'timestamp server și utilizator HUB obligatorii')
    check('pg_advisory_xact_lock(19520,7001)' in candidate, True, 'migrarea folosește blocarea comună EP/DF')
    check('NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id' in funcs['ep_private.protect_associated_df'], True,
          'identitatea DF asociat este protejată inclusiv la salvări din gateway')
    for name in ['capacity', 'save_allocations', 'release_quantity', 'load_registry']:
        patch = re.search(r'DO \$patch_'+name+r'\$(.*?)END \$patch_'+name+r'\$;', candidate, re.S).group(1)
        check('ep_asocieri_df' in patch and 'EXECUTE replace(definition,old,replacement)' in patch, True,
              name+' este extins punctual, păstrând restul contractului')
    base = (ROOT/'supabase/migrations/20261106122125_ep_release_operations.sql').read_text()
    capacity = re.search(r'CREATE OR REPLACE FUNCTION ep_private\.capacity\(.*?AS \$function\$(.*?)\$function\$\s*;', base, re.S).group(1)
    patch = re.search(r'DO \$patch_capacity\$(.*?)END \$patch_capacity\$;', candidate, re.S).group(1)
    old = re.search(r'old text:=\$old\$(.*?)\$old\$;', patch, re.S).group(1)
    new = re.search(r'replacement text:=\$new\$(.*?)\$new\$;', patch, re.S).group(1)
    check(capacity.count(old), 1, 'fragmentul de disponibil corespunde implementării de bază')
    expression = re.search(r'RETURN (.*?);', capacity.replace(old,new), re.S).group(1)
    df = (ROOT/'documentatie_tehnica/evidenta_piese/productie/03_IMPORT_DF_EP.sql').read_text()
    check('cap:=ep_private.capacity(l.id,aid)+oldqty;' in df, True,
          'salvarea DF verifică disponibilul, păstrând propriul import existent')
    check("'available',ep_private.capacity(l.id,a.id)+coalesce" in df, True,
          'lista de import DF folosește aceeași funcție de disponibil')
    # Executăm numai expresia SELECT extrasă, pe tabele sintetice dintr-un server nou.
    pg = pgserver.get_server(Path(tempfile.mkdtemp(prefix='hub-ep-association-contract-')), cleanup_mode='stop')
    db = psycopg2.connect(pg.get_uri()); db.autocommit=True
    def query(sql, params=None):
        with db.cursor() as cursor:
            cursor.execute(sql,params)
            return cursor.fetchall() if cursor.description else []
    try:
        query('''CREATE TABLE ep_retururi(linie_id uuid,alocare_id uuid,cantitate integer);
          CREATE TABLE ep_transferuri_magazie(linie_id uuid,alocare_id uuid,cantitate integer,anulat_at timestamptz);
          CREATE TABLE deviz_final_linii(ep_alocare_id uuid,cantitate numeric);
          CREATE TABLE ep_asocieri_df(alocare_id uuid,cantitate integer);''')
        line, allocation, other = [str(uuid.uuid4()) for _ in range(3)]
        def available(a=allocation,quantity=10):
            return query('WITH params(q,p_line,p_allocation) AS (VALUES(%s::bigint,%s::uuid,%s::uuid)) SELECT '+expression+' FROM params',
                         (quantity,line,a))[0][0]
        check(available(),10,'alocare fără operații: întreaga cantitate disponibilă')
        query('INSERT INTO ep_asocieri_df VALUES(%s,2)',(allocation,))
        check(available(),8,'asociere parțială: importabilul se reduce exact cu 2')
        query('INSERT INTO ep_asocieri_df VALUES(%s,1)',(allocation,))
        check(available(),7,'asocieri la mai multe DF-uri cumulează cantitățile')
        query('INSERT INTO deviz_final_linii VALUES(%s,2)',(allocation,))
        check(available(),5,'importurile reale sunt scăzute separat de asocieri')
        query('INSERT INTO ep_retururi VALUES(%s,%s,1)',(line,allocation))
        query('INSERT INTO ep_transferuri_magazie VALUES(%s,%s,1,NULL)',(line,allocation))
        check(available(),3,'returul și transferul activ nu pot fi asociate sau importate')
        query("INSERT INTO ep_transferuri_magazie VALUES(%s,%s,3,now())",(line,allocation))
        check(available(),3,'transferurile anulate nu scad din nou disponibilul')
        query('INSERT INTO ep_asocieri_df VALUES(%s,100)',(other,))
        check(available(),3,'altă sursă nu modifică disponibilul alocării selectate')
        check(available(None,5),5,'cantitățile nealocate nu scad a doua oară asocierile')
        query('INSERT INTO ep_asocieri_df VALUES(%s,3)',(allocation,))
        check(available(),0,'cantitatea asociată integral nu mai este importabilă')
        query('INSERT INTO ep_asocieri_df VALUES(%s,1)',(allocation,))
        check(available(),-1,'supraconsumul produce disponibil negativ pentru validate_line')
        # Testăm doar expresiile de identitate extrase, fără a instala funcția candidat.
        matcher = funcs['ep_private.association_matches_df']
        known = re.search(r'THEN RETURN (.*?); END IF;', matcher).group(1)
        fallback = re.search(r"RETURN (a.nr_inmatriculare_original=.*?);", matcher).group(1)
        def matches(vehicle,plate,ctx_vehicle,ctx_plate):
            from psycopg2.extras import Json
            return query('WITH a(vehicle_id,nr_inmatriculare_original) AS (VALUES(%s::bigint,%s::text)), '
                         'params(ctx) AS (VALUES(%s::jsonb)) SELECT CASE WHEN a.vehicle_id IS NOT NULL THEN '
                         +known+' ELSE '+fallback+' END FROM a,params',
                         (vehicle,plate,Json({'vehicle_id':ctx_vehicle,'plate':ctx_plate})))[0][0]
        check(matches(11,'CT44ELD',11,'CT44ELD'),True,'aceeași fișă auto permite asocierea')
        check(matches(11,'CT44ELD',12,'CT44ELD'),False,'același număr cu altă fișă auto nu este acceptat')
        check(matches(11,'CT44ELD',None,'CT44ELD'),False,'ID-ul auto cunoscut nu este înlocuit cu o potrivire nesigură')
        check(matches(None,'B123NOU',None,'B123NOU'),True,'vehiculele viitoare fără fișă se potrivesc prin număr')
        check(matches(None,'B123NOU',19,'B123NOU'),True,'alocarea veche fără ID poate folosi un DF cu vehicul verificat')
        check(matches(None,'B123NOU',None,'B456ALT'),False,'alocarea fără ID nu poate fi asociată altei mașini')
        print(f'TOTAL {COUNT} PASS — contract static și SELECT PostgreSQL local; migrarea NU este executată de test', flush=True)
    finally:
        db.close();pg.cleanup()

if __name__=='__main__': run()
