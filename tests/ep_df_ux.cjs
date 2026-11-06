/* Regresii Chrome locale: date fictive și SDK simulat, fără rețea Supabase. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
let checks = 0;
const check = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; console.log(`PASS ${label}`); };

/* Toate citirile/scrierile de test rămân în memoria acestui browser izolat. */
function mockSdk() {
  const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
  const snapshot = { defaults:{tva_proc:21,coeficient_df:1.53}, accounts:[], returns:[], transfers:[], imports:[],
    suppliers:[{id:id(1),denumire:'Furnizor test',revision:1,activ:true}],
    invoices:[{id:id(2),furnizor_id:id(1),revision:1,numar:'TEST-1',data_factura:'2026-11-06',status_document:'În firmă'}],
    lines:[{id:id(3),factura_id:id(2),denumire:'Piesă test',cantitate:10,pret_achizitie_net:'10',tva_proc:'21',coeficient_df:'1.53'},
      {id:id(4),factura_id:id(2),denumire:'Piesă istorică',cantitate:5,pret_achizitie_net:'10',tva_proc:'21',coeficient_df:'1.53'}],
    allocations:[{id:id(5),linie_id:id(4),nr_inmatriculare_original:'CT44ELD',model_original:'Model EP fallback',cantitate:5}]
  };
  const source = (n,available) => ({allocation_id:id(n),name:`Piesă factură ${n}`,available,purchase_net:'10',vat:'21',multiplier:'1.53',unit_price:18.513,
    supplier:'Furnizor test',invoice_number:'TEST-1',invoice_date:'2026-11-06',code:'TEST',source_revision:1});
  window.fixture = { snapshot, rows:{}, errors:{}, delays:{}, calls:[], rpcCalls:[], sources:[source(5,5),source(6,3)], role:1,
    permissions:{deviz_final:true,evidenta_piese:true,clienti_notificari:true}, saveError:null, savedArgs:null };
  const user = {id:id(99)};
  class Query {
    constructor(table) {this.table=table;this.filters={};this.one=false;}
    select(columns) {this.columns=columns;return this;}
    eq(key,value) {this.filters[key]=value;return this;}
    order() {return this;} limit() {return this;} gt() {return this;} in() {return this;}
    single() {this.one=true;return this;} maybeSingle() {this.one=true;return this;}
    insert() {this.mutation=true;return this;}
    then(resolve,reject) { return this.run().then(resolve,reject); }
    async run() {
      const f=window.fixture, key=`${this.table}:${this.filters.nr_inmatriculare ?? this.filters.id ?? ''}`;
      f.calls.push({table:this.table,columns:this.columns,filters:{...this.filters}});
      const rows=structuredClone(f.rows[key] ?? f.rows[this.table] ?? []), error=f.errors[this.table] || null;
      if(f.delays[key] || f.delays[this.table]) await new Promise(r=>setTimeout(r,f.delays[key] || f.delays[this.table]));
      if(this.table==='auth_profiles')return {data:{id:user.id,rol_id:f.role,permissions:f.permissions},error:null};
      return {data:this.one ? rows[0] || null : rows,error};
    }
  }
  const client = {from:table=>new Query(table),auth:{
    getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:{user}},error:null}),
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
  },rpc:async(name,args)=>{
    const f=window.fixture;f.rpcCalls.push({name,args:structuredClone(args)});
    if(name==='ep_load_registry')return {data:structuredClone(f.snapshot),error:null};
    if(name==='ep_list_df_parts')return {data:structuredClone(f.sources),error:null};
    if(name==='save_deviz_final') {f.savedArgs=structuredClone(args);return {data:f.saveError?null:{id_deviz_final:7,ep_revision:1},error:f.saveError};}
    return {data:{},error:null};
  }};
  window.supabase={createClient:()=>client};
}

async function createPage(browser, url) {
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(mockSdk);
  await context.route('**/*', async route => {
    const u=new URL(route.request().url());
    if(u.hostname!=='hub.test')return route.fulfill({body:'',contentType:'application/javascript'});
    const file=path.resolve(root,`.${decodeURIComponent(u.pathname)}`);
    assert.ok(file.startsWith(root+path.sep));
    if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
    const ext=path.extname(file);
    let body=fs.readFileSync(file);
    if(ext==='.html')body=body.toString().replace('</head>','<style>.hidden{display:none!important}</style></head>');
    await route.fulfill({body,contentType:ext==='.html'?'text/html':ext==='.css'?'text/css':'application/javascript'});
  });
  const page=await context.newPage(), errors=[];
  page.setDefaultTimeout(8000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(`https://hub.test/${url}`);
  return {page,context,errors};
}

async function testDf(browser) {
  const {page:p,context,errors}=await createPage(browser,'modules/devize/deviz_final.html');
  await p.waitForFunction(()=>window.devizData && !document.querySelector('main').inert);
  const field=k=>p.locator(`#input-${k}-deviz-final`), plate=field('nr-inmatriculare');
  const fillPlate=async(value,key='Tab')=>{await plate.fill(value);await plate.press(key);};
  await p.evaluate(()=>{
    fixture.rows['devize:B400CIR']=[{autovehicul:'Model istoric',vin:'VIN-ISTORIC'}];
    fixture.rows['clienti_vehicule:B400CIR']=[{client_id:11,marca_model:'Model registru',serie_vin:'VIN-REGISTRU'}];
    fixture.rows['clienti:11']=[{nume:'Client test B'}];
    fixture.rows['clienti_vehicule:CT44ELD']=[{client_id:12,marca_model:'Model CT',serie_vin:'VIN-CT'}];
    fixture.rows['clienti:12']=[{nume:'Client test CT'}];
  });
  await fillPlate('b 400 cir','Enter');
  await p.waitForFunction(()=>document.querySelector('#input-client-deviz-final').value==='CLIENT TEST B');
  check(await field('tip-auto').inputValue(),'MODEL ISTORIC','DF păstrează modelul istoric B400CIR');
  check(await field('serie-vin').inputValue(),'VIN-ISTORIC','DF păstrează VIN istoric');
  check(await field('serie-vin').evaluate(e=>e===document.activeElement),true,'Enter mută focusul la VIN');
  await p.locator('#btn-deviz-nou').click();
  await fillPlate('ct 44 eld');
  await p.waitForFunction(()=>document.querySelector('#input-client-deviz-final').value==='CLIENT TEST CT');
  check(await field('tip-auto').inputValue(),'MODEL CT','DF completează CT44ELD fără istoric');
  check(await field('serie-vin').inputValue(),'VIN-CT','DF completează VIN din registru');
  check(await p.evaluate(()=>devizData.vehicleId),null,'lookup nu modifică legăturile avans/vehicle_id');
  await field('client').fill('CLIENT MANUAL'); await field('tip-auto').fill('MODEL MANUAL');
  await field('serie-vin').fill('VIN-MANUAL');await field('serie-motor').fill('MOTOR-MANUAL');
  await fillPlate('B400CIR');
  await p.waitForFunction(()=>fixture.calls.filter(c=>c.table==='clienti_vehicule').length>=3);
  check(await field('client').inputValue(),'CLIENT MANUAL','DF păstrează clientul manual');
  check(await field('tip-auto').inputValue(),'MODEL MANUAL','DF păstrează modelul manual');
  check(await field('serie-vin').inputValue(),'VIN-MANUAL','DF păstrează VIN manual');
  check(await field('serie-motor').inputValue(),'MOTOR-MANUAL','DF păstrează motorul manual');
  await p.locator('#btn-deviz-nou').click();
  await p.evaluate(()=>{fixture.errors.clienti_vehicule={code:'42501',message:'denied'};});
  await fillPlate('CT44ELD','Enter');
  check(await field('tip-auto').inputValue(),'','refuzul registrului lasă câmpurile editabile');
  await field('tip-auto').fill('MANUAL DUPĂ REFUZ');
  await p.evaluate(()=>{fixture.errors={};fixture.delays.clienti_vehicule=150;});
  await fillPlate('CT44ELD');await field('serie-vin').fill('VIN ÎN TIMPUL CERERII');
  await p.waitForFunction(()=>document.querySelector('#input-client-deviz-final').value==='CLIENT TEST CT');
  check(await field('serie-vin').inputValue(),'VIN ÎN TIMPUL CERERII','răspunsul întârziat păstrează editarea');
  await p.locator('#btn-deviz-nou').click();
  await p.evaluate(()=>{
    fixture.rows['deviz_final_header:B123HIS']=[{client:'Client DF',auto:'Model DF',serie_vin:'VIN-DF',serie_motor:'MOTOR-DF'}];
    fixture.calls=[];
  });
  await fillPlate('B123HIS','Enter');
  check(await field('tip-auto').inputValue(),'MODEL DF','istoricul DF are prioritate');
  check(await p.evaluate(()=>fixture.calls.some(c=>c.table==='clienti_vehicule')),false,'istoricul complet evită citirea suplimentară');
  await p.locator('#btn-deviz-nou').click();
  await p.evaluate(()=>{fixture.rows['constatari:B124HIS']=[{client:'Client constatare',model_masina:'Model constatare',serie_vin:'VIN-CONSTATARE'}];});
  await fillPlate('B124HIS','Enter');
  check(await field('tip-auto').inputValue(),'MODEL CONSTATARE','fallback-ul istoric Constatări rămâne activ');
  await p.locator('#btn-deviz-nou').click();
  await p.evaluate(()=>{fixture.rows['clienti_vehicule:B125DUP']=[{client_id:11,marca_model:'A'},{client_id:12,marca_model:'B'}];});
  await fillPlate('B125DUP','Enter');
  check(await field('tip-auto').inputValue(),'','fișele ambigue nu sunt alese arbitrar');
  await p.locator('#btn-deviz-nou').click();
  await fillPlate('CT44ELD'); await plate.fill('B999ZZZ');
  await p.waitForTimeout(200);
  check(await field('client').inputValue(),'','răspunsul pentru alt număr este ignorat');
  await p.evaluate(()=>{fixture.delays={};});
  await fillPlate('CT44ELD','Enter');
  await p.evaluate(()=>switchTab('tab-piese-materiale'));
  const open=async()=>{await p.locator('#btn-importa-facturi').click();await p.locator('.ep-df-qty').first().waitFor();};
  await open();
  check(await p.locator('.ep-df-qty').evaluateAll(es=>es.map(e=>e.value)),['5','3'],'DF cantitate implicită integrală per sursă');
  await p.locator('.ep-df-select').nth(0).check();await p.locator('.ep-df-select').nth(1).check();
  await p.locator('.ep-df-qty').nth(1).fill('4');
  check(await p.locator('.ep-df-error').nth(1).textContent(),'Cantitate cerută: 4 buc.; disponibilă: 3 buc. Cantitatea cerută depășește disponibilul.','mesaj inline cerut/disponibil');
  await p.locator('#ep-df-confirm').click();
  check(await p.locator('#piese-rows-body tr').count(),1,'lot invalid: nicio piesă adăugată');
  check(await p.locator('#ep-df-message').textContent().then(s=>s.includes('Nicio piesă')),true,'blocarea lotului este explicită');
  for(const value of ['0','-1','1.5','']) {
    await p.locator('.ep-df-qty').nth(1).fill(value);await p.locator('#ep-df-confirm').click();
    check(await p.locator('#piese-rows-body tr').count(),1,`cantitate invalidă ${value || 'goală'}: fără import parțial`);
  }
  await p.locator('.ep-df-qty').nth(1).fill('2');await p.locator('#ep-df-confirm').click();
  check(await p.locator('#piese-rows-body .piesa-cantitate').evaluateAll(es=>es.map(e=>e.value)),['5','2'],'import integral și parțial în același lot');
  check(await p.locator('#piese-rows-body .piesa-pret').evaluateAll(es=>es.every(e=>e.readOnly&&e.value==='18.51')),true,'prețul snapshot rămâne blocat');
  check(await p.evaluate(()=>devizData.totalPiese.final),129.6,'totalul EP folosește regula de cent');
  await open();check(await p.locator('.ep-df-select:disabled').count(),2,'sursele deja adăugate nu se dublează');
  await p.locator('#ep-df-close').click();
  await p.locator('#piese-rows-body .piesa-cantitate').nth(0).fill('4');
  check(await p.evaluate(()=>devizData.totalPiese.final),111.08,'cantitatea rămâne editabilă după import');
  await p.locator('#piese-rows-body .piesa-apply-discount').nth(0).check();
  await p.locator('[data-field="discountGlobalPiese"]').fill('10');
  check(await p.evaluate(()=>Number(devizData.totalPiese.final.toFixed(3))),103.675,'discountul selectiv rămâne funcțional');
  await p.evaluate(()=>addPiesaRow({denumire:'Manual test',um:'buc',cantitate:2,pretUnitar:10,aplicaDiscount:false}));
  check(await p.locator('#piese-rows-body .piesa-pret').last().evaluate(e=>e.readOnly),false,'piesa manuală păstrează preț editabil');
  await p.evaluate(()=>{devizData.includeAvans=true;devizData.avansuri=[{avansId:42,total:20,paymentDates:[],linkStatus:'selected'}];document.querySelector('#piese-rows-body .piesa-cantitate').dispatchEvent(new Event('input',{bubbles:true}));});
  check(await p.evaluate(()=>Number((devizData.totalDeviz-devizData.totalDePlata).toFixed(2))),20,'avansul se scade separat de piese/discount');
  await p.locator('#btn-printeaza-deviz').click();
  check(await p.locator('#save-status').textContent().then(s=>s.includes('avansului')),true,'print protejat pentru avans nesalvat');
  await p.evaluate(()=>{devizData.avansuri=[];devizData.includeAvans=false;window.open=()=>null;});
  await p.locator('#btn-printeaza-deviz').click();
  const printed=await p.evaluate(()=>JSON.parse(localStorage.getItem('currentDevizPrint')));
  check(printed.piese.length,3,'print primește EP și liniile manuale');
  check(printed.piese[0].epImport.snapshot.purchase_net,'10','print păstrează snapshot-ul importat');
  await p.locator('#btn-salveaza-deviz').click();
  await p.waitForFunction(()=>fixture.savedArgs!==null);
  const args=await p.evaluate(()=>fixture.savedArgs);
  check(args.p_lines.filter(l=>l.sectiune==='piese').map(l=>l.cantitate),[4,2,2],'salvarea primește cantitățile editate');
  check(args.p_lines.filter(l=>l.ep_import_id).length,2,'salvarea păstrează identificatorii EP');
  check(Boolean(args.p_header.ep_request_id),true,'salvarea păstrează UUID idempotent');
  const printPage=await context.newPage();
  await printPage.goto('https://hub.test/modules/devize/deviz-print.html');
  check(await printPage.locator('body').textContent().then(s=>s.includes('Piesă factură 5')),true,'pagina print randează piesa EP');
  check(errors,[],'DF fără erori JavaScript');
  await context.close();
}

async function testEp(browser) {
  const {page:p,context,errors}=await createPage(browser,'modules/stocuri/evidenta_piese.html');
  await p.waitForFunction(()=>window.HubEpApi && !HubEpApi.stale);
  await p.evaluate(()=>{fixture.rows['clienti_vehicule:CT44ELD']=[{marca_model:'Model registru CT'}];});
  const plate=p.locator('#assignmentPlate'), model=p.locator('#assignmentModel');
  /* Deschide prin selectorul paginii, fără expunerea funcțiilor interne în produs. */
  await p.locator('[data-select-id="00000000-0000-4000-8000-000000000003"]').first().click({force:true});
  await p.locator('[data-action="assign-part"]').click();
  await plate.fill('ct 44 eld');
  check(await model.inputValue(),'Model EP fallback','EP păstrează fallback-ul din alocări înainte de blur');
  check(await p.evaluate(()=>fixture.calls.filter(c=>c.table==='clienti_vehicule').length),0,'EP fără query la fiecare tastă');
  await plate.press('Tab');
  await p.waitForFunction(()=>document.querySelector('#assignmentModel').value==='Model registru CT');
  check(await model.evaluate(e=>e===document.activeElement),true,'Tab păstrează focusul în câmpul model');
  check(await model.inputValue(),'Model registru CT','EP completează modelul din registru pe Tab');
  await model.fill('Model manual');await plate.focus();await plate.press('Tab');
  check(await model.inputValue(),'Model manual','EP păstrează model manual pe blur repetat');
  await plate.fill('B999ZZZ');await plate.press('Tab');
  check(await model.inputValue(),'Model manual','EP păstrează model manual la schimbarea numărului');
  await p.locator('#assignmentCancel').click();
  const open=async()=>p.locator('[data-action="assign-part"]').click();
  await open();await p.evaluate(()=>{fixture.rows['clienti_vehicule:CT44ELD']=[];});
  await plate.fill('CT44ELD');await plate.press('Tab');await p.waitForTimeout(30);
  check(await model.inputValue(),'Model EP fallback','EP fără fișă accesibilă păstrează fallback');
  await p.locator('#assignmentCancel').click();await open();
  await p.evaluate(()=>{fixture.errors.clienti_vehicule={code:'42501',message:'denied'};});
  await plate.fill('CT44ELD');await plate.press('Tab');
  await p.locator('#assignmentModelWarning').waitFor();
  check(await model.inputValue(),'Model EP fallback','EP refuzul accesului păstrează fallback');
  check(await p.locator('#assignmentModelWarning').textContent().then(s=>s.includes('nu a putut fi citit')),true,'EP arată eroarea de citire');
  await p.locator('#assignmentQty').fill('11');await p.locator('#assignmentSave').click();
  check(await p.locator('#assignmentFormError').textContent().then(s=>s.includes('11 buc.; disponibilă: 10')),true,'EP depășire: cerut/disponibil inline');
  check(await p.evaluate(()=>fixture.rpcCalls.filter(c=>c.name==='ep_save_allocations').length),0,'EP nu salvează cantitate peste capacitate');
  await p.locator('#assignmentCancel').click();await open();
  await p.evaluate(()=>{fixture.errors={};fixture.rows['clienti_vehicule:CT44ELD']=[{marca_model:'Model întârziat'}];fixture.delays.clienti_vehicule=200;});
  await plate.fill('CT44ELD');await plate.press('Tab');await model.fill('Manual în timpul cererii');
  await p.waitForTimeout(240);
  check(await model.inputValue(),'Manual în timpul cererii','EP răspuns întârziat nu înlocuiește editarea');
  await p.locator('#assignmentCancel').click();await open();
  await plate.fill('CT44ELD');await plate.press('Tab');await plate.fill('B999ZZZ');await plate.press('Tab');
  await p.waitForTimeout(240);
  check(await model.inputValue(),'','EP ignoră răspunsul pentru alt număr');
  await p.locator('#assignmentCancel').click();await open();
  await plate.fill('CT44ELD');await plate.press('Tab');await p.locator('#assignmentCancel').click();await open();
  await p.waitForTimeout(240);
  check(await model.inputValue(),'','EP ignoră răspunsul din dialogul închis');
  await p.evaluate(()=>{fixture.delays={};});
  await plate.fill('CT44ELD');await plate.press('Tab');
  await p.waitForFunction(()=>document.querySelector('#assignmentModel').value==='Model întârziat');
  await p.locator('#assignmentQty').fill('2');await model.press('Enter');
  await p.waitForFunction(()=>fixture.rpcCalls.some(c=>c.name==='ep_save_allocations'));
  check(await p.evaluate(()=>fixture.rpcCalls.find(c=>c.name==='ep_save_allocations').args.p.items[0].model),'Model întârziat','Enter păstrează submit-ul și modelul completat');
  check(await p.evaluate(()=>fixture.rpcCalls.find(c=>c.name==='ep_save_allocations').args.p.items[0].cantitate),2,'EP păstrează alocarea parțială');
  await p.waitForFunction(()=>document.querySelector('#assignmentModal').hidden);
  await p.evaluate(async()=>{
    const s=fixture.snapshot;
    s.returns=[{id:'ret-test',linie_id:s.lines[0].id,cantitate:2,data_retur:'2026-11-06'}];
    s.transfers=[{id:'mag-test',linie_id:s.lines[0].id,cantitate:3,data_trimitere:'2026-11-06'}];
    await HubEpApi.load();
  });
  await open();
  check(await p.locator('#assignmentQty').getAttribute('max'),'5','EP exclude returul și magazia din capacitate');
  await plate.fill('CT44ELD');await p.locator('#assignmentQty').fill('6');await p.locator('#assignmentSave').click();
  check(await p.locator('#assignmentFormError').textContent().then(s=>s.includes('6 buc.; disponibilă: 5')),true,'EP reverifică disponibilul după retur/magazie');
  check(await p.evaluate(()=>fixture.rpcCalls.filter(c=>c.name==='ep_save_allocations').length),1,'EP nu dublează salvarea la depășirea disponibilului');
  await p.locator('#assignmentCancel').click();
  await p.locator('[data-select-id="00000000-0000-4000-8000-000000000004"]').first().click({force:true});
  await p.locator('.ep-quantity-history summary').click();
  await p.locator('[data-action="reassign-part"]').click();
  await plate.focus();await plate.press('Tab');
  check(await model.inputValue(),'Model EP fallback','corectarea păstrează modelul alocării existente');
  await p.locator('#assignmentCancel').click();
  await p.evaluate(async()=>{
    const s=fixture.snapshot;
    s.allocations[0].model_original='';s.allocations[0].cantitate=2;
    s.allocations.push({...s.allocations[0],id:'00000000-0000-4000-8000-000000000006',model_original:'Alt model EP',cantitate:3});
    await HubEpApi.load();
  });
  await p.locator('.ep-quantity-history summary').click();
  await p.locator('[data-action="reassign-part"]').first().click();
  await plate.focus();await plate.press('Tab');
  await p.waitForFunction(()=>document.querySelector('#assignmentModel').value==='Model întârziat');
  check(await model.inputValue(),'Model întârziat','corectarea unei alocări fără model poate prelua registrul');
  await p.locator('#assignmentCancel').click();
  await p.evaluate(async()=>{
    const s=fixture.snapshot;
    s.imports=[{id:'import-test',df_id:7,part_id:s.lines[1].id,allocation_id:s.allocations[0].id,qty:1,snapshot:{plate:'CT44ELD',unit_price:18.513,imported_at:'2026-11-06T10:00:00Z'}}];
    await HubEpApi.load();
  });
  check(await p.locator('[data-action="reassign-part"]').first().isDisabled(),true,'alocarea consumată de DF rămâne protejată');
  check(errors,[],'EP fără erori JavaScript');
  await context.close();
}

module.exports = { createPage };
if (require.main === module) (async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN || '/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  try { await testDf(browser);await testEp(browser);console.log(`TOTAL ${checks} PASS — browser local, Supabase simulat`); }
  finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
