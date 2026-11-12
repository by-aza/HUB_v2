"""Verifică exclusiv SELECT-ul autorului DF pe PostgreSQL temporar, cu date sintetice.
Migrarea NU este executată de acest test. Necesită pgserver și psycopg2.
"""
import os
import json
from pathlib import Path
import re
import tempfile
import uuid

os.environ.setdefault('XDG_RUNTIME_DIR', '/tmp/hub-ep-history-runtime')
import pgserver
import psycopg2
from psycopg2.extras import Json

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'supabase/migrations/20261112141250_ep_history_import_author.sql'
COUNT = 0


def check(actual, expected, label):
    global COUNT
    assert actual == expected, (label, actual, expected)
    COUNT += 1
    print('PASS', label, flush=True)


def run():
    # Extragem numai proiecția SELECT; nu instalăm funcții și nu aplicăm migrarea.
    sql = MIGRATION.read_text()
    fragment = re.search(r'new_fragment text := \$new\$(.*?)\$new\$;', sql, re.S).group(1)
    lookup = re.search(r"'created_by',\((.*)\)\)$", fragment, re.S).group(1)
    pg = pgserver.get_server(Path(tempfile.mkdtemp(prefix='hub-ep-history-')), cleanup_mode='stop')
    db = psycopg2.connect(pg.get_uri())
    db.autocommit = True

    def query(statement, params=None):
        with db.cursor() as cursor:
            cursor.execute(statement, params)
            return cursor.fetchall() if cursor.description else []

    try:
        query('CREATE TABLE public.audit_logs(user_id uuid,modul text,actiune text,entitate text,entitate_id text,descriere text)')
        actor, later_actor, import_id = [str(uuid.uuid4()) for _ in range(3)]
        imported_at = '2026-11-06T10:11:12+00:00'
        snapshot = {'imported_at': imported_at}
        row = {'ep_import_id': import_id, 'ep_snapshot': snapshot}

        def record(user=actor, before=None, after=None, entity='7', raw=None, **overrides):
            values = {'modul': 'Evidență Facturi & Piese', 'actiune': 'save_df', 'entitate': 'deviz_final', **overrides}
            doc = {'format': 1, 'before': before if before is not None else [], 'after': after if after is not None else [row]}
            query('INSERT INTO audit_logs VALUES(%s,%s,%s,%s,%s,%s)',
                  (user, values['modul'], values['actiune'], values['entitate'], entity, raw if raw is not None else json.dumps(doc)))

        def author(snap=snapshot):
            return query('WITH d(ep_import_id,id_deviz_final,ep_snapshot) AS (VALUES (%s::uuid,7,%s::jsonb)) SELECT (' + lookup + ') FROM d',
                         (import_id, Json(snap)))[0][0]

        check(author(), None, 'fără audit de creare: autor necunoscut')
        record()
        check(author(), actor, 'autorul provine din auditul introducerii importului')
        record(user=later_actor, before=[row])
        check(author(), actor, 'resalvarea altui operator nu schimbă autorul inițial')
        record(user=later_actor, entity='8')
        record(user=later_actor, modul='Alt modul')
        record(user=later_actor, actiune='legacy_df_link')
        record(user=later_actor, entitate='altceva')
        record(user=later_actor, after=[{**row, 'ep_snapshot': {'imported_at': '2026-11-07T10:11:12+00:00'}}])
        check(author(), actor, 'DF-ul, modulul, acțiunea, entitatea și snapshot-ul limitează asocierea')
        for raw in ('text vechi fără JSON', '[]', '{"format":1}', '{"format":1,"before":null,"after":[]}'):
            record(user=later_actor, raw=raw)
        check(author(), actor, 'auditul vechi sau invalid nu blochează citirea')
        check(author({}), None, 'lipsa datei importului nu permite asocierea arbitrară')
        record(user=later_actor)
        check(author(), None, 'mai multe audituri de creare: fallback în loc de alegerea unui autor')
        query('TRUNCATE audit_logs')
        record(user=None)
        check(author(), None, 'auditul fără UUID nu este atribuit unui alt utilizator')
        query('TRUNCATE audit_logs')
        record()
        record()
        check(author(), None, 'nici auditul duplicat nu este tratat ca dovadă unică')
        print(f'TOTAL {COUNT} PASS — SELECT local; testul nu execută migrarea', flush=True)
    finally:
        db.close()
        pg._cleanup()


if __name__ == '__main__':
    run()
