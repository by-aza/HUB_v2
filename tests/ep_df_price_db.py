"""RPC-uri EP/DF reale pe PostgreSQL temporar; Auth/registru auto sintetice, fără producție.
Rulează cu pgserver și psycopg2: XDG_RUNTIME_DIR=/tmp/hub-ep-test-runtime python tests/ep_df_price_db.py.
"""
import os
os.environ.setdefault('XDG_RUNTIME_DIR', '/tmp/hub-ep-test-runtime')
from pathlib import Path
import json, re, tempfile, uuid, threading, time
from decimal import Decimal as D
import pgserver, psycopg2
from psycopg2.extras import Json
ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT/'documentatie_tehnica/evidenta_piese/productie'
MIGRATION = ROOT/'supabase/migrations/20261107145959_ep_df_editable_selling_price.sql'
COUNT = 0

def check(actual, expected, label):
    global COUNT
    assert actual == expected, (label, actual, expected)
    COUNT += 1
    print('PASS',label,flush=True)

def prepare_legacy_fixtures(query,supplier,invoice,actor):
    """Vectori financiari citiți read-only din DF-244/245; sursele/mașina/actorul sunt sintetice.
    Restul totalului pieselor este un rând sintetic, nu o copie a celorlalte linii live.
    """
    vectors={
      244:[(12170,'PLACUTE FRANA FATA BREMBO','MP59079',1,'258.18','535','481.50',True)],
      245:[(12186,'INEL ETANSARE, LOCAS DIUZA','',4,'8.51','15.754563000000000000000000','56.72',False),
           (12187,'SENZOR TURATIE ROATA','',1,'61.32','113.521716000000000000000000','102.17',False),
           (12188,'SIMERING, SUPORT DIUZA','',4,'0.94','1.740222000000000000000000','6.26',False),
           (12189,'SENZOR TURATIE ROATA','',1,'60.54','112.077702000000000000000000','100.87',False),
           (12190,'GARNITURA CAPAC SUPAPE','',1,'28.95','53.595135000000000000000000','48.23',False)]}
    position=2
    for df,rows in vectors.items():
        total='1634' if df==244 else '944.253'
        query("INSERT INTO deviz_final_header(id_deviz_final,data_deviz,nr_inmatriculare,discount_global_piese,total_piese,total_manopera,total_avans,total_general,created_by) VALUES(%s,'07.11.2026','CT44ELD',10,%s,0,0,%s,%s)",(df,total,total,actor))
        for nr,(line_id,name,code,qty,purchase,price,saved_total,preserved) in enumerate(rows,1):
            source,allocation,import_id=[str(uuid.uuid4()) for _ in range(3)]
            query('INSERT INTO ep_factura_linii(id,factura_id,nr_crt,denumire,cod_piesa,cantitate,pret_achizitie_net,tva_proc,coeficient_df) VALUES(%s,%s,%s,%s,%s,%s,%s,21,1.53)',(source,invoice,position,name,code,qty,purchase));position+=1
            revision=query('SELECT revision FROM ep_facturi WHERE id=%s',(invoice,))[0][0]
            query('SELECT public.ep_save_allocations(%s,%s)',(str(uuid.uuid4()),Json({'items':[{'id':allocation,'linie_id':source,'cantitate':qty,'nr_inmatriculare':'CT44ELD','expected_revision':revision}]})))
            snap={'line_id':source,'invoice_id':invoice,'supplier':'Furnizor sintetic','invoice_number':'TEST','name':name,'code':code,
                  'plate':'CT44ELD','purchase_net':purchase,'vat':'21','multiplier':'1.53','unit_price':price,'imported_at':'2026-11-07T00:00:00Z'}
            if preserved:snap.update(manual_df_price_preserved=True,source_calculated_unit_price='477.968634000000000000000000')
            query("INSERT INTO deviz_final_linii(id,id_deviz_final,sectiune,nr_crt,denumire,um,cantitate,pret_unitar,discount,total,ep_import_id,ep_alocare_id,ep_snapshot) VALUES(%s,%s,'piese',%s,%s,'buc',%s,%s,1,%s,%s,%s,%s)",(line_id,df,nr,name,qty,price,saved_total,import_id,allocation,Json(snap)))
        # Reproducem totalul pieselor din antet fără a inventa celelalte poziții reale.
        residual='1152.50' if df==244 else '630'
        query("INSERT INTO deviz_final_linii(id,id_deviz_final,sectiune,nr_crt,denumire,um,cantitate,pret_unitar,discount,total) VALUES(%s,%s,'piese',%s,'Rest piese: rezidual sintetic','buc',1,%s,0,%s)",(12171 if df==244 else 12191,df,len(rows)+1,residual,residual))
    check(query("SELECT round((round(258.18*1.53,2)+round(258.18*1.53*21/100,2))*.9,2)")[0][0],D('430.17'),'reproducere ramură greșită: EP ar reduce DF-244 la 430.17')
    return vectors

def verify_legacy_fixtures(query,save,invoice,vectors):
    def imported(df):
        return query('SELECT id,cantitate,pret_unitar,discount,total,ep_snapshot FROM deviz_final_linii WHERE id_deviz_final=%s AND ep_import_id IS NOT NULL ORDER BY nr_crt',(df,))
    def reopened(df):
        # Citire separată, ca la deschiderea documentului; snapshot-ul clientului nu este trimis.
        return query("SELECT jsonb_agg(jsonb_build_object('sectiune',sectiune,'nr_crt',nr_crt,'denumire',denumire,'um',um,'cantitate',cantitate::text,'pret_unitar',pret_unitar::text,'discount',discount,'ep_import_id',ep_import_id,'ep_alocare_id',ep_alocare_id) ORDER BY nr_crt) FROM deviz_final_linii WHERE id_deviz_final=%s",(df,))[0][0]
    invoice_revision=query('SELECT revision FROM ep_facturi WHERE id=%s',(invoice,))[0][0]
    for df in vectors:
        before=imported(df);header_total=query('SELECT total_piese FROM deviz_final_header WHERE id_deviz_final=%s',(df,))[0][0]
        check([(r[0],r[2],r[4]) for r in before],[(r[0],D(r[5]),D(r[6])) for r in vectors[df]],f'DF-{df}: valori inițiale egale cu vectorii live read-only')
        for attempt in range(2):
            rev=query('SELECT ep_revision FROM deviz_final_header WHERE id_deviz_final=%s',(df,))[0][0]
            result=save(reopened(df),df,rev)
            check(imported(df),before,f'DF-{df}: redeschidere/resalvare {attempt+1} păstrează ID, preț, discount, total și snapshot')
            check(query('SELECT total_piese FROM deviz_final_header WHERE id_deviz_final=%s',(df,))[0][0],header_total,f'DF-{df}: totalul pieselor din antet rămâne identic ({attempt+1})')
        if df==244:
            lines=reopened(df);lines[0]['pret_unitar']='500'
            result=save(lines,df,result['ep_revision'])
            check(imported(df)[0][2:5],(D('500'),D('1'),D('450.00')),'DF-244 legacy: editarea ulterioară folosește prețul DF')
            lines=reopened(df);lines[0]['pret_unitar']='535'
            result=save(lines,df,result['ep_revision'])
            check(imported(df),before,'DF-244 legacy: revenirea la 535 păstrează 481.50 și snapshot-ul original')
    check(query('SELECT revision FROM ep_facturi WHERE id=%s',(invoice,))[0][0],invoice_revision,'DF-244/245: resalvarea/prețul nu schimbă consumul sau revizia facturii')

def run():
    pg=pgserver.get_server(Path(tempfile.mkdtemp(prefix='hub-ep-price-')),cleanup_mode='stop')
    db=psycopg2.connect(pg.get_uri());db.autocommit=True
    def query(sql,params=None,conn=db):
        with conn.cursor() as c:
            c.execute(sql,params)
            return c.fetchall() if c.description else []
    def all_data():
        return query("SELECT jsonb_build_object('headers',(SELECT jsonb_agg(to_jsonb(h) ORDER BY id_deviz_final) FROM deviz_final_header h),'lines',(SELECT jsonb_agg(to_jsonb(l) ORDER BY id) FROM deviz_final_linii l),'audit',(SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM audit_logs a))")[0][0]
    try:
        query("""
        CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
        CREATE SCHEMA auth; CREATE SCHEMA private;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
        CREATE TABLE auth_profiles(id uuid PRIMARY KEY,nume text,prenume text,rol_id int,permissions jsonb);
        CREATE TABLE auth_roles(id int PRIMARY KEY,numire_rol text);
        INSERT INTO auth_roles VALUES(1,'Admin');
        CREATE TABLE clienti_vehicule(id bigint PRIMARY KEY,nr_inmatriculare text,serie_vin text);
        CREATE FUNCTION private.resolve_deviz_final_vehicle(text,text) RETURNS bigint LANGUAGE sql AS $$ SELECT id FROM public.clienti_vehicule WHERE nr_inmatriculare=$1 $$;
        CREATE TABLE audit_logs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,user_name text,modul text,actiune text,entitate text,entitate_id text,descriere text);
        CREATE TABLE config_alerte(id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,cheie text,valoare text);
        CREATE TABLE constatari(id bigint PRIMARY KEY,vehicle_id bigint);
        CREATE TABLE evidente_avansuri(id bigint PRIMARY KEY,vehicle_id bigint,nr_inmatriculare text,este_arhivat boolean);
        CREATE TABLE evidente_avansuri_plati(id bigint PRIMARY KEY,avans_id bigint,suma numeric);
        CREATE TABLE private.deviz_final_avans_review(avans_id bigint,status text);
        CREATE TABLE deviz_final_header(id_deviz_final bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,id_deviz_estimativ bigint,
          data_deviz text,client text,auto text,nr_inmatriculare text,serie_vin text,serie_motor text,km text,termen_executie text,
          discount_global_piese numeric,vehicle_id bigint,constatare_id bigint,total_manopera numeric,total_piese numeric,total_avans numeric,total_general numeric,created_by uuid);
        CREATE TABLE deviz_final_linii(id bigserial PRIMARY KEY,id_deviz_final bigint REFERENCES deviz_final_header(id_deviz_final),
          sectiune text,nr_crt int,denumire text,detalii text,um text,cantitate numeric,pret_unitar numeric,discount numeric,total numeric,avans_id bigint,comanda_piesa_sh_id bigint);
        GRANT USAGE ON SCHEMA auth TO authenticated,anon;
        GRANT SELECT ON auth_profiles TO authenticated;
        """)
        for file in ['01_PERSISTENTA_EP.sql','03_IMPORT_DF_EP.sql']:
            text=(SQL/file).read_text()
            # Doar preflight-ul istoric de instalare este omis în baza goală; funcțiile/trigger-ele sunt integrale.
            text=re.sub(r'DO \$(target|preflight)\$.*?END \$\1\$;','',text,flags=re.S)
            query(text)
        query((ROOT/'supabase/migrations/20261106122125_ep_release_operations.sql').read_text())
        # ACL-ul wrapperului preexistent este păstrat de CREATE OR REPLACE în instalarea reală.
        query('REVOKE ALL ON FUNCTION public.save_deviz_final(bigint,jsonb,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.save_deviz_final(bigint,jsonb,jsonb) TO authenticated')
        admin,df_only,denied=[str(uuid.uuid4()) for _ in range(3)]
        for actor,role,permissions in [(admin,1,{}),(df_only,3,{'deviz_final':True}),(denied,3,{})]:
            query('INSERT INTO auth_profiles VALUES(%s,\'Test\',\'Local\',%s,%s)',(actor,role,Json(permissions)))
        query("SELECT set_config('request.jwt.claim.sub',%s,false)",(admin,))
        sid,fid,lid,aid=[str(uuid.uuid4()) for _ in range(4)]
        query("INSERT INTO ep_furnizori(id,denumire,created_by) VALUES(%s,'Furnizor test',%s)",(sid,admin))
        query("INSERT INTO ep_facturi(id,furnizor_id,numar,data_factura,furnizor_denumire_originala,created_by) VALUES(%s,%s,'TEST','2026-11-07','Furnizor test',%s)",(fid,sid,admin))
        query("INSERT INTO ep_factura_linii(id,factura_id,nr_crt,denumire,cantitate,pret_achizitie_net,tva_proc,coeficient_df) VALUES(%s,%s,1,'Piesă',30,10,21,1.53)",(lid,fid))
        query("SELECT public.ep_save_allocations(%s,%s)",(str(uuid.uuid4()),Json({'items':[{'id':aid,'linie_id':lid,'cantitate':30,'nr_inmatriculare':'CT44ELD','expected_revision':1}]})))
        revision=lambda:query('SELECT revision FROM ep_facturi WHERE id=%s',(fid,))[0][0]
        iid=str(uuid.uuid4())
        header={'data_deviz':'07.11.2026','nr_inmatriculare':'CT44ELD','discount_global_piese':10}
        line={'sectiune':'piese','nr_crt':1,'denumire':'Piesă','cantitate':5,'pret_unitar':'18.513','discount':1,'ep_import_id':iid,'ep_alocare_id':aid,'ep_source_revision':revision()}
        def save(lines,df=None,rev=0,actor=admin,request=None,conn=db):
            query("SELECT set_config('request.jwt.claim.sub',%s,false)",(actor,),conn)
            return query('SELECT public.save_deviz_final(%s,%s,%s)',(df,Json({**header,'ep_revision':rev,'ep_request_id':request or str(uuid.uuid4())}),Json(lines)),conn)[0][0]
        # Fixture EP obișnuit prin gateway-ul istoric; DF-244/245 exacte sunt pregătite separat.
        query("SELECT setval(pg_get_serial_sequence('public.deviz_final_header','id_deviz_final'),240,false)")
        result=save([line]);df=result['id_deviz_final'];check(df,240,'fixture EP obișnuit salvat cu gateway-ul istoric')
        historical=query('SELECT pret_unitar,total,ep_snapshot FROM deviz_final_linii WHERE ep_import_id=%s',(iid,))[0]
        check(historical[:2],(D('18.513'),D('83.31')),'prețul precis și totalul istoric EP cu discount')
        save([{'sectiune':'manopera','nr_crt':1,'denumire':'Istoric manoperă','cantitate':'1.125','pret_unitar':'18.333'},
              {'sectiune':'piese','nr_crt':1,'denumire':'Istoric manual','cantitate':2,'pret_unitar':'8.335','discount':1}])
        legacy_fixtures=prepare_legacy_fixtures(query,sid,fid,admin)
        before=all_data()
        acl=query("SELECT oid,proacl,proowner,prosecdef,proconfig FROM pg_proc WHERE oid IN ('ep_private.save_df(bigint,jsonb,jsonb)'::regprocedure,'ep_private.save_df_base(bigint,jsonb,jsonb)'::regprocedure) ORDER BY oid")
        query(MIGRATION.read_text())
        check(all_data(),before,'migrarea nu schimbă DF-244, alte valori salvate sau audit')
        check(query("SELECT oid,proacl,proowner,prosecdef,proconfig FROM pg_proc WHERE oid IN ('ep_private.save_df(bigint,jsonb,jsonb)'::regprocedure,'ep_private.save_df_base(bigint,jsonb,jsonb)'::regprocedure) ORDER BY oid"),acl,'OID, ACL, owner și search_path păstrate')
        verify_legacy_fixtures(query,save,fid,legacy_fixtures)
        result=save([line],df,result['ep_revision'])
        check(query('SELECT pret_unitar,total,ep_snapshot FROM deviz_final_linii WHERE ep_import_id=%s',(iid,))[0],historical,'resalvarea fără modificări păstrează toate valorile EP istorice')
        frozen=historical[2]
        source_before=query('SELECT pret_achizitie_net,tva_proc,coeficient_df FROM ep_factura_linii WHERE id=%s',(lid,))[0]
        inv_revision=revision(); req=str(uuid.uuid4()); oldrev=result['ep_revision']
        custom={**line,'pret_unitar':'25.75','ep_snapshot':{'unit_price':'1','purchase_net':'1'}}
        result=save([custom],df,oldrev,request=req)
        check(query('SELECT pret_unitar,total,ep_snapshot FROM deviz_final_linii WHERE ep_import_id=%s',(iid,))[0],(D('25.75'),D('115.88'),frozen),'preț DF personalizat, discount și snapshot autentic din DB')
        check(result['total_piese'],115.875,'antetul păstrează precizia după discount')
        check(result['ep_imports'][0]['pret_unitar'],'25.75','răspunsul RPC întoarce prețul final ca text')
        check(revision(),inv_revision,'doar prețul DF nu schimbă revizia/consumul facturii')
        check(query('SELECT pret_achizitie_net,tva_proc,coeficient_df FROM ep_factura_linii WHERE id=%s',(lid,))[0],source_before,'achiziție, TVA și adaos originale păstrate')
        audit=query('SELECT descriere::jsonb FROM audit_logs WHERE id=%s',(req,))[0][0]
        check((audit['before'][0]['pret_unitar'],audit['after'][0]['pret_unitar']),(18.513,'25.75'),'audit before/after cu prețul DF și trasabilitate')
        check(save([custom],df,oldrev,request=req),result,'retry identic după salvare nu schimbă prețul sau consumul')
        missing_price={k:v for k,v in custom.items() if k!='pret_unitar'}
        result=save([missing_price],df,result['ep_revision'])
        check(query('SELECT pret_unitar FROM deviz_final_linii WHERE ep_import_id=%s',(iid,))[0][0],D('25.75'),'payload vechi fără preț nu resetează personalizarea salvată')
        custom['pret_unitar']='31.125'
        result=save([custom],df,result['ep_revision'])
        check(query('SELECT pret_unitar,total,ep_snapshot FROM deviz_final_linii WHERE ep_import_id=%s',(iid,))[0],(D('31.125'),D('140.06'),frozen),'prețul personalizat supraviețuiește citirii și editării ulterioare')
        # Dreptul DF permite editarea prețului unei surse deja salvate, fără un import nou.
        result=save([{**custom,'pret_unitar':'26'}],df,result['ep_revision'],actor=df_only)
        check(query('SELECT pret_unitar FROM deviz_final_linii WHERE ep_import_id=%s',(iid,))[0][0],D('26'),'operator DF poate edita prețul importului existent')
        def blocked(call,label):
            initial=all_data()
            try:call()
            except psycopg2.Error:query('ROLLBACK')
            else:raise AssertionError('Acceptat: '+label)
            check(all_data(),initial,label+' — rollback integral')
        for bad in ['-1','NaN','Infinity','-Infinity','abc']:
            blocked(lambda bad=bad:save([{**line,'pret_unitar':bad}],df,result['ep_revision']),'preț invalid '+bad)
        blocked(lambda:save([custom],df,0),'revizie DF veche')
        blocked(lambda:save([custom],df,result['ep_revision'],actor=denied),'operator fără DF')
        blocked(lambda:save([{**line,'cantitate':31}],df,result['ep_revision']),'cantitate peste disponibil')
        blocked(lambda:save([line,{**line,'nr_crt':2}],df,result['ep_revision']),'sursă duplicată')
        wrong={**header,'nr_inmatriculare':'B999ZZZ'};original_header=header;header=wrong
        blocked(lambda:save([line],df,result['ep_revision']),'import pentru altă mașină');header=original_header
        blocked(lambda:save([{**line,'ep_import_id':str(uuid.uuid4()),'ep_source_revision':0}],None),'revizie factură veche')
        query('UPDATE ep_factura_linii SET blocaj_istoric=\'istoric protejat\' WHERE id=%s',(lid,))
        blocked(lambda:save([{**line,'ep_import_id':str(uuid.uuid4()),'ep_source_revision':revision()}]),'import nou din sursă protejată')
        result=save([{**line,'pret_unitar':'27'}],df,result['ep_revision'])
        check(query('SELECT ep_snapshot FROM deviz_final_linii WHERE ep_import_id=%s',(iid,))[0][0],frozen,'editarea importului existent protejat păstrează snapshot-ul')
        query('UPDATE ep_factura_linii SET blocaj_istoric=NULL WHERE id=%s',(lid,))
        second={**line,'ep_import_id':str(uuid.uuid4()),'ep_source_revision':revision(),'pret_unitar':'40.01','cantitate':2,'discount':0}
        new=save([second]);check(query('SELECT pret_unitar,total FROM deviz_final_linii WHERE ep_import_id=%s',(second['ep_import_id'],))[0],(D('40.01'),D('80.02')),'import nou cu preț personalizat înainte de prima salvare')
        manual={'sectiune':'piese','nr_crt':2,'denumire':'Manual','cantitate':2,'pret_unitar':'8.335','discount':0}
        result=save([{**line,'pret_unitar':'0'},manual],df,result['ep_revision'])
        check(query('SELECT pret_unitar,total FROM deviz_final_linii WHERE id_deviz_final=%s ORDER BY nr_crt',(df,)),[(D('0'),D('0')),(D('8.335'),D('16.67'))],'zero explicit și piesele manuale rămân independente')
        result=save([line],df,result['ep_revision'])
        check(query('SELECT pret_unitar,total,ep_snapshot FROM deviz_final_linii WHERE ep_import_id=%s',(iid,))[0],historical,'revenirea la prețul sursă reface exact regula istorică')
        # Două editări pe aceeași revizie: a doua așteaptă lock-ul și apoi este refuzată.
        c1=psycopg2.connect(pg.get_uri()); c2=psycopg2.connect(pg.get_uri());c2.autocommit=True
        rev=result['ep_revision']; winner=save([{**line,'pret_unitar':'30'}],df,rev,conn=c1);out=[]
        def contender():
            try:save([{**line,'pret_unitar':'99'}],df,rev,conn=c2);out.append('accepted')
            except psycopg2.Error:out.append('blocked')
        t=threading.Thread(target=contender);t.start();time.sleep(.2)
        check(t.is_alive(),True,'editarea concurentă așteaptă lock-ul comun EP/DF')
        c1.commit();t.join(5);check(out,['blocked'],'editarea concurentă recitește revizia și refuză suprascrierea')
        check(query('SELECT pret_unitar FROM deviz_final_linii WHERE ep_import_id=%s',(iid,))[0][0],D('30'),'prețul câștigătorului concurent este păstrat');c1.close();c2.close()
        check(query("SELECT has_function_privilege('anon','public.save_deviz_final(bigint,jsonb,jsonb)','EXECUTE')")[0][0],False,'anon nu poate salva DF')
        check(query("SELECT has_function_privilege('authenticated','ep_private.save_df_base(bigint,jsonb,jsonb)','EXECUTE')")[0][0],False,'baza DF nu poate ocoli gateway-ul')
        # Gardă de contract: aplicarea repetată oprește întreaga tranzacție fără modificări.
        blocked(lambda:query(MIGRATION.read_text()),'contract deja schimbat');query('ROLLBACK')
        print(f'TOTAL {COUNT} PASS — PostgreSQL local '+query('SHOW server_version')[0][0],flush=True)
    finally:db.close();pg.cleanup()
if __name__=='__main__':run()
