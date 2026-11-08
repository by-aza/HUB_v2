/* EP/DF în Chrome local: salvare/citire simulate, fără trafic spre Supabase. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const {createPage}=require('./ep_df_ux.cjs');
let count=0;
const check=(a,b,label)=>{assert.deepEqual(a,b,label);count++;console.log('PASS '+label);};
async function invoice(browser){
  const {page:p,context,errors}=await createPage(browser,'modules/stocuri/evidenta_piese.html');
  await p.waitForFunction(()=>window.HubEpApi&&!HubEpApi.stale);
  if(process.env.HUB_TEST_INTER_CSS){
    await p.addStyleTag({content:fs.readFileSync(process.env.HUB_TEST_INTER_CSS,'utf8')});
    check(await p.evaluate(async()=>{await document.fonts.ready;return (await document.fonts.load('700 12px Inter')).length>0;}),true,'fontul Inter real este încărcat local');
  }
  /* Fixture de persistență: stochează exact payload-ul pentru redeschiderea formularului. */
  await p.evaluate(()=>{
    const original=supabaseClient.rpc;
    supabaseClient.rpc=async(name,args)=>{
      if(name==='ep_get_defaults')return {data:{tva_proc:21,coeficient_df:'1.53'},error:null};
      if(name!=='ep_save_invoice')return original(name,args);
      fixture.rpcCalls.push({name,args:structuredClone(args)});const op=args.p,s=fixture.snapshot;
      const old=s.invoices.find(f=>f.id===op.id);
      const invoice={...op,revision:(old?.revision||0)+1};delete invoice.lines;
      s.invoices=s.invoices.filter(f=>f.id!==op.id).concat(invoice);
      s.lines=s.lines.filter(l=>l.factura_id!==op.id).concat(op.lines.map((l,i)=>({...l,factura_id:op.id,nr_crt:i+1})));
      s.allocations=s.allocations.filter(a=>!op.lines.some(l=>l.id===a.linie_id));
      op.lines.filter(l=>l.nr_inmatriculare).forEach(l=>s.allocations.push({id:l.id+'-a',linie_id:l.id,nr_inmatriculare_original:l.nr_inmatriculare,cantitate:l.cantitate}));
      return {data:{id:op.id},error:null};
    };
  });
  await p.locator('#newInvoiceBtn').click();
  const def=p.locator('#invoiceDefaultPlate'),plates=p.locator('#invoiceLinesBody [data-field="plate"]');
  await def.pressSequentially('ct 44-eld');
  check(await plates.first().inputValue(),'','tastarea reală nu propagă un număr parțial');
  await def.press('Tab');
  check(await def.inputValue(),'CT44ELD','implicitul se normalizează la majuscule fără separatori');
  for(let i=1;i<16;i++)await p.locator('#addInvoiceLine').click();
  check(await plates.evaluateAll(es=>es.map(e=>e.value)),Array(16).fill('CT44ELD'),'16 linii, inclusiv cele nou adăugate, preiau implicitul');
  await plates.nth(3).fill('b 400-cir');await plates.nth(3).press('Tab');
  await plates.nth(7).fill('');
  await def.fill('b 123-abc');await def.press('Tab');
  const expected=Array(16).fill('CT44ELD');expected[3]='B400CIR';expected[7]='';
  check(await plates.evaluateAll(es=>es.map(e=>e.value)),expected,'schimbarea implicitului păstrează toate valorile și golirea manuală');
  /* Schimbare înainte de completare: numai câmpurile goale neatinse pot prelua noul implicit. */
  await p.evaluate(()=>document.querySelectorAll('#invoiceLinesBody [data-field="plate"]')[8].value='');
  await def.fill('ct-99 xyz');await def.press('Tab');expected[8]='CT99XYZ';
  check(await plates.evaluateAll(es=>es.map(e=>e.value)),expected,'doar câmpul gol neatins preia noul implicit');
  await p.locator('#invoiceSupplier').selectOption('00000000-0000-4000-8000-000000000001');
  await p.locator('#invoiceNumber').fill('DEFAULT-16');
  await p.locator('#invoiceLinesBody [data-field="name"]').evaluateAll(es=>es.forEach((e,i)=>{e.value=`Piesă ${i+1}`;e.dispatchEvent(new Event('input',{bubbles:true}));}));
  await p.locator('#invoiceLinesBody [data-field="price"]').evaluateAll(es=>es.forEach(e=>{e.value='10';e.dispatchEvent(new Event('input',{bubbles:true}));}));
  check(await p.locator('#invoiceDfTotal').textContent().then(s=>s.replace(/\s/g,'')),'296,16lei','totalul celor 16 poziții păstrează regula EP');
  const geometry=await p.locator('#invoiceStatus').evaluate(e=>{const a=e.getBoundingClientRect(),b=document.querySelector('#invoiceDefaultPlate').getBoundingClientRect();return {same:Math.abs(a.top-b.top)<1,after:b.left>a.left};});
  check(geometry,{same:true,after:true},'înmatricularea este pe primul rând imediat după Status document');
  const type=await p.locator('#invoiceDfTotal').evaluate(e=>{const s=getComputedStyle(e);return {font:s.fontFamily,features:s.fontFeatureSettings,size:s.fontSize};});
  check(type.font.startsWith('Inter'),true,'afișajul numeric EP folosește Inter');
  check(type.features.includes('"tnum"')&&type.features.includes('"zero" 0'),true,'cifre tabulare și zero fără bară');
  check(type.size,'12px','tipografia numerică rămâne compactă');
  await p.locator('#invoiceBody').evaluate(e=>e.scrollTop=0);
  await p.screenshot({path:'/tmp/hub-ep-default-desktop.png'});
  await p.locator('#invoiceSave').click();await p.waitForFunction(()=>document.querySelector('#invoiceModal').hidden);
  const saved=await p.evaluate(()=>fixture.rpcCalls.find(c=>c.name==='ep_save_invoice').args.p);
  check(saved.lines.map(l=>l.nr_inmatriculare),expected,'salvarea trimite înmatriculările individuale pentru cele 16 linii');
  check(Object.hasOwn(saved,'invoiceDefaultPlate'),false,'implicitul nu intră în antetul persistat');
  await p.locator('[data-action="edit-invoice"]').click();
  check(await def.inputValue(),'','editarea pornește cu implicit local gol');
  check(await plates.evaluateAll(es=>es.map(e=>e.value)),expected,'redeschiderea păstrează înmatriculările salvate');
  await def.fill('B999ZZZ');await def.press('Tab');expected[7]='B999ZZZ';
  check(await plates.evaluateAll(es=>es.map(e=>e.value)),expected,'editare: numai linia goală liberă primește implicitul');
  check(await plates.nth(0).evaluate(e=>e.readOnly),true,'alocările existente rămân read-only');
  await p.locator('#addInvoiceLine').click();check(await plates.last().inputValue(),'B999ZZZ','linie nouă în editare preia implicitul');
  await p.locator('#invoiceLinesBody [data-remove-line]').last().click();
  await p.locator('#invoiceSave').click();await p.waitForFunction(()=>document.querySelector('#invoiceModal').hidden);
  check(await p.evaluate(()=>fixture.rpcCalls.filter(c=>c.name==='ep_save_invoice').at(-1).args.p.lines.map(l=>l.nr_inmatriculare)),expected,'editarea facturii păstrează salvarea și alocările individuale');
  await p.locator('#newInvoiceBtn').click();check(await def.inputValue(),'','factura nouă nu moștenește implicitul dialogului anterior');
  await p.setViewportSize({width:390,height:844});
  for(let i=1;i<16;i++)await p.locator('#addInvoiceLine').click();
  await def.fill('ct 01 mob');await def.press('Tab');
  check(await plates.evaluateAll(es=>es.every(e=>e.value==='CT01MOB')),true,'mobil: implicitul funcționează cu 16 linii');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobil: fără overflow orizontal al paginii EP');
  await p.locator('#successToast').waitFor({state:'hidden',timeout:6000});
  await p.locator('#invoiceBody').evaluate(e=>e.scrollTop=0);
  await p.screenshot({path:'/tmp/hub-ep-default-mobile.png'});
  await p.locator('#invoiceCancel').click();
  /* Alocare divizată: înmatricularea liniei este goală, dar nu poate primi implicitul. */
  await p.evaluate(async()=>{const s=fixture.snapshot,a=s.allocations[0];s.allocations.push({...a,id:'split-test',nr_inmatriculare_original:'B500XYZ',cantitate:1});await HubEpApi.load();});
  await p.setViewportSize({width:1440,height:1000});
  await p.locator('#tab-invoices').click();await p.locator(`[data-select-id="${saved.id}"]`).click({force:true});await p.locator('[data-action="edit-invoice"]').click();
  const before=await plates.first().inputValue();await def.fill('CT77DEF');await def.press('Tab');
  check(await plates.first().inputValue(),before,'implicitul nu schimbă o linie protejată cu alocări divizate');
  check(errors,[],'EP fără erori JavaScript în scenariile noi');await context.close();
}
/* Transport de test: păstrează prețul primit și snapshot-ul separat, apoi permite un reload real. */
function installPriceStorage(){
  const original=supabaseClient.rpc;
  supabaseClient.rpc=async(name,args)=>{
    if(name!=='save_deviz_final')return original(name,args);
    fixture.savedArgs=structuredClone(args);
    const id=args.p_deviz_id||7,revision=(args.p_header.ep_revision||0)+1,previous=fixture.rows.deviz_final_linii||[];
    const rows=args.p_lines.map((l,i)=>({...l,id:previous.find(p=>p.ep_import_id&&p.ep_import_id===l.ep_import_id)?.id||i+1,id_deviz_final:id,
      ep_snapshot:l.ep_import_id?structuredClone(devizData.piese.find(p=>p.epImport?.id===l.ep_import_id).epImport.snapshot):null}));
    const totals={total_piese:devizData.totalPiese.final,total_manopera:devizData.totalManopera,total_avans:devizData.totalAvans,total_general:devizData.totalDeviz};
    fixture.rows.deviz_final_header=[{...args.p_header,...totals,id_deviz_final:id,ep_revision:revision}];
    fixture.rows.deviz_final_linii=rows;
    return {data:{...totals,id_deviz_final:id,ep_revision:revision,ep_imports:rows.filter(l=>l.ep_import_id)},error:null};
  };
}

async function precisionPrices(browser){
  const {page:p,context,errors}=await createPage(browser,'modules/devize/deviz_final.html');
  await p.waitForFunction(()=>window.devizData&&!document.querySelector('main').inert);
  await p.evaluate(installPriceStorage);
  await p.locator('#input-nr-inmatriculare-deviz-final').fill('CT44ELD');
  await p.locator('#input-nr-inmatriculare-deviz-final').press('Tab');
  await p.evaluate(()=>switchTab('tab-piese-materiale'));
  await p.locator('#btn-importa-facturi').click();await p.locator('.ep-df-select').first().check();await p.locator('#ep-df-confirm').click();
  const price=p.locator('#piese-rows-body .piesa-pret').first();
  const snapshot=await p.evaluate(()=>structuredClone(devizData.piese[0].epImport.snapshot));
  check(await price.inputValue(),'18.51','import nou: input cu doi zecimali');
  check(await p.evaluate(()=>devizData.piese[0].pretUnitar),'18.513','import nou: prețul financiar rămâne precis');
  await price.focus();await price.press('Tab');
  await p.locator('#piese-rows-body .piesa-cantitate').fill('4');
  check(await p.evaluate(()=>devizData.totalPiese.final),74.05,'focus/blur și cantitate păstrează formula EP, fără preț personalizat tacit');
  check(await p.evaluate(()=>devizData.piese[0].pretUnitar),'18.513','editarea cantității nu pierde zecimalele sursei');
  await p.locator('#piese-rows-body .piesa-cantitate').fill('5');
  await p.locator('#piese-rows-body .piesa-apply-discount').check();await p.locator('[data-field="discountGlobalPiese"]').fill('10');
  const save=async()=>{await p.evaluate(()=>fixture.savedArgs=null);await p.locator('#btn-salveaza-deviz').click();await p.waitForFunction(()=>fixture.savedArgs&&!document.querySelector('#btn-salveaza-deviz').disabled);};
  const reopen=async()=>{
    const rows=await p.evaluate(()=>structuredClone(fixture.rows));
    await p.reload();await p.waitForFunction(()=>window.devizData&&!document.querySelector('main').inert);
    await p.evaluate(rows=>Object.assign(fixture.rows,rows),rows);await p.evaluate(installPriceStorage);
    await p.evaluate(()=>loadDevizFinalByNr('DF-007'));await p.evaluate(()=>switchTab('tab-piese-materiale'));
  };
  await save();
  check(await p.evaluate(()=>fixture.savedArgs.p_lines.find(l=>l.ep_import_id).pret_unitar),'18.513','import neatins: payload-ul păstrează prețul precis');
  check(await p.evaluate(()=>Number(devizData.totalPiese.final.toFixed(3))),83.313,'import neatins: discountul păstrează calculul EP');
  await reopen();
  check(await price.inputValue(),'18.51','reload import neatins: doar afișarea este rotunjită');
  check(await p.evaluate(()=>devizData.piese[0].pretUnitar),'18.513','reload import neatins: starea păstrează prețul salvat precis');
  await save();
  check(await p.evaluate(()=>fixture.savedArgs.p_lines.find(l=>l.ep_import_id).pret_unitar),'18.513','a doua salvare neatinsă nu transformă importul în preț personalizat');
  /* Retastarea explicită a valorii afișate este o editare, spre deosebire de formatare. */
  await price.fill('');await price.pressSequentially('18.51');await price.press('Tab');
  check(await p.evaluate(()=>devizData.piese[0].pretUnitar),'18.51','editarea explicită poate alege chiar prețul afișat rotunjit');
  check(await p.evaluate(()=>Number(devizData.totalPiese.final.toFixed(3))),83.295,'prețul editat explicit folosește calculul DF');
  await save();check(await p.evaluate(()=>fixture.savedArgs.p_lines.find(l=>l.ep_import_id).pret_unitar),'18.51','prețul editat explicit se salvează');
  await price.fill('19.8765');await price.press('Tab');
  check(await price.inputValue(),'19.88','preț editat: blur afișează exact doi zecimali');
  await p.locator('#piese-rows-body .piesa-cantitate').fill('5');
  check(await p.evaluate(()=>devizData.piese[0].pretUnitar),'19.8765','formatarea la blur păstrează precizia editării explicite');
  await save();check(await p.evaluate(()=>fixture.savedArgs.p_lines.find(l=>l.ep_import_id).pret_unitar),'19.8765','payload-ul păstrează întreaga valoare editată');
  await reopen();
  check(await price.inputValue(),'19.88','reload preț personalizat: afișare cu doi zecimali');
  check(await p.evaluate(()=>devizData.piese[0].pretUnitar),'19.8765','reload preț personalizat: valoarea salvată rămâne precisă');
  check(await p.evaluate(()=>devizData.piese[0].epImport.snapshot),snapshot,'nici formatarea, nici editarea nu modifică snapshot-ul EP');
  check(errors,[],'formatare/precizie/salvare/reload fără erori JavaScript');
  await context.close();
}
async function prices(browser){
  const {page:p,context,errors}=await createPage(browser,'modules/devize/deviz_final.html');
  await p.waitForFunction(()=>window.devizData&&!document.querySelector('main').inert);
  /* Opțional, aceeași resursă Tailwind ca pagina reală, descărcată separat în /tmp. */
  if(process.env.HUB_TEST_TAILWIND)await p.addScriptTag({content:fs.readFileSync(process.env.HUB_TEST_TAILWIND,'utf8')});
  await p.locator('#input-nr-inmatriculare-deviz-final').fill('CT44ELD');
  await p.locator('#input-nr-inmatriculare-deviz-final').press('Tab');
  await p.evaluate(()=>switchTab('tab-piese-materiale'));
  await p.locator('#btn-importa-facturi').click();await p.locator('.ep-df-select').first().check();await p.locator('#ep-df-confirm').click();
  const price=p.locator('#piese-rows-body .piesa-pret').first();
  const frozen=await p.evaluate(()=>structuredClone(devizData.piese[0].epImport));
  check(await price.inputValue(),'18.51','DF afișează prețul importat cu exact doi zecimali');
  check(await p.evaluate(()=>devizData.piese[0].pretUnitar),'18.513','starea DF păstrează prețul precis al sursei');
  await price.fill('25.75');
  check(await p.evaluate(()=>devizData.piese[0].pretUnitar),'25.75','prețul editat ajunge în starea DF');
  await p.locator('#piese-rows-body .piesa-apply-discount').first().check();await p.locator('[data-field="discountGlobalPiese"]').fill('10');
  check(await p.evaluate(()=>devizData.totalPiese.final),115.875,'preț personalizat și discount selectiv în totaluri');
  check(await p.evaluate(()=>devizData.piese[0].epImport),frozen,'editarea nu schimbă snapshot-ul EP');
  /* Persistență/citire simulate: verifică serializarea și hidratarea UI, nu validarea SQL. */
  const persistence=()=>{
    const original=supabaseClient.rpc;
    supabaseClient.rpc=async(name,args)=>{
      if(name!=='save_deviz_final')return original(name,args);
      fixture.rpcCalls.push({name,args:structuredClone(args)});fixture.savedArgs=structuredClone(args);
      const id=args.p_deviz_id||7,rev=(args.p_header.ep_revision||0)+1;
      const rows=args.p_lines.map((l,i)=>({...l,id:i+1,id_deviz_final:id,ep_snapshot:l.ep_import_id?structuredClone(devizData.piese.find(p=>p.epImport?.id===l.ep_import_id).epImport.snapshot):null}));
      fixture.rows.deviz_final_header=[{...args.p_header,id_deviz_final:id,ep_revision:rev}];fixture.rows.deviz_final_linii=rows;
      return {data:{id_deviz_final:id,ep_revision:rev,ep_imports:rows.filter(l=>l.ep_import_id)},error:null};
    };
  };
  await p.evaluate(persistence);
  for(const invalid of ['', '-1']) {
    await price.fill(invalid);await p.locator('#btn-salveaza-deviz').click();
    await p.waitForFunction(()=>!document.querySelector('#btn-salveaza-deviz').disabled);
    check(await p.evaluate(()=>fixture.savedArgs),null,`preț EP invalid ${invalid || 'gol'}: fără salvare RPC`);
  }
  await price.fill('25.75');
  await p.locator('#btn-salveaza-deviz').click();await p.waitForFunction(()=>fixture.savedArgs!==null&&document.querySelector('#btn-salveaza-deviz').disabled===false);
  check(await p.evaluate(()=>fixture.savedArgs.p_lines.find(l=>l.ep_import_id).pret_unitar),'25.75','RPC primește prețul DF personalizat');
  check(await p.evaluate(()=>devizData.piese[0].pretUnitar),'25.75','applySaved păstrează prețul final, separat de prețul sursă');
  const stored=await p.evaluate(()=>structuredClone(fixture.rows));
  await p.reload();await p.waitForFunction(()=>window.devizData&&!document.querySelector('main').inert);
  if(process.env.HUB_TEST_TAILWIND)await p.addScriptTag({content:fs.readFileSync(process.env.HUB_TEST_TAILWIND,'utf8')});
  await p.evaluate(rows=>Object.assign(fixture.rows,rows),stored);
  await p.evaluate(persistence);
  await p.evaluate(()=>loadDevizFinalByNr('DF-007'));
  await p.evaluate(()=>switchTab('tab-piese-materiale'));
  check(await price.inputValue(),'25.75','reload real și redeschidere DF păstrează prețul personalizat');
  check(await p.evaluate(()=>devizData.piese[0].epImport.snapshot),frozen.snapshot,'reload păstrează snapshot-ul sursă');
  await price.fill('31.125');
  check(await p.evaluate(()=>Number(devizData.totalPiese.final.toFixed(4))),140.0625,'editarea ulterioară recalculează cu prețul DF');
  await p.screenshot({path:'/tmp/hub-df-price-desktop.png'});
  await p.setViewportSize({width:390,height:844});
  await price.fill('30');
  check(await p.evaluate(()=>devizData.totalPiese.final),135,'mobil: prețul personalizat și discountul funcționează');
  await price.scrollIntoViewIfNeeded();
  check(await price.isEditable(),true,'mobil: prețul importat rămâne accesibil și editabil');
  await p.screenshot({path:'/tmp/hub-df-price-mobile.png'});
  await p.locator('#btn-salveaza-deviz').click();await p.waitForFunction(()=>fixture.savedArgs?.p_deviz_id===7&&!document.querySelector('#btn-salveaza-deviz').disabled);
  check(await p.evaluate(()=>fixture.savedArgs.p_lines.find(l=>l.ep_import_id).pret_unitar),'30','editarea ulterioară se salvează pe același DF');
  await p.evaluate(()=>loadDevizFinalByNr('DF-007'));
  check(await price.inputValue(),'30.00','redeschiderea după a doua salvare păstrează prețul DF');
  check(errors,[],'DF fără erori JavaScript după reload/editare desktop și mobil');
  await context.close();
}
/* Replica financiară DF-244/245 din citirea live; transportul acestui browser este integral simulat. */
async function legacyPrices(browser){
  const {page:p,context,errors}=await createPage(browser,'modules/devize/deviz_final.html');
  await p.waitForFunction(()=>window.devizData&&!document.querySelector('main').inert);
  await p.evaluate(()=>{
    const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
    const snap={purchase_net:'258.18',vat:'21',multiplier:'1.53',unit_price:'535',manual_df_price_preserved:true,
      source_calculated_unit_price:'477.968634000000000000000000',code:'MP59079',supplier:'Furnizor sintetic',invoice_number:'TEST'};
    fixture.rows.deviz_final_header=[{id_deviz_final:244,data_deviz:'07.11.2026',nr_inmatriculare:'CT44ELD',discount_global_piese:10,ep_revision:0,total_piese:481.5}];
    fixture.rows.deviz_final_linii=[{id:12170,id_deviz_final:244,sectiune:'piese',nr_crt:1,denumire:'PLACUTE FRANA FATA BREMBO',um:'buc',cantitate:1,pret_unitar:'535',discount:1,total:'481.50',ep_import_id:id(71),ep_alocare_id:id(72),ep_snapshot:snap}];
  });
  await p.evaluate(installPriceStorage);
  await p.evaluate(()=>loadDevizFinalByNr('DF-244'));
  check(await p.locator('#piese-rows-body .piesa-pret').inputValue(),'535.00','DF-244 reload restaurează pret_unitar salvat 535');
  check(await p.evaluate(()=>devizData.totalPiese.final),481.5,'DF-244 legacy păstrează totalul 481.50 la deschidere');
  check(await p.locator('#piese-rows-body .piesa-valoare').inputValue(),'481.50','DF-244: calculul frontend al liniei păstrează 481.50');
  await p.locator('#btn-salveaza-deviz').click();await p.waitForFunction(()=>fixture.savedArgs!==null&&!document.querySelector('#btn-salveaza-deviz').disabled);
  check(await p.evaluate(()=>fixture.savedArgs.p_lines.find(l=>l.ep_import_id).pret_unitar),'535','DF-244 resalvarea transmite 535, fără înlocuire din sursă');
  check(await p.evaluate(()=>devizData.piese[0].epImport.snapshot.manual_df_price_preserved),true,'DF-244 applySaved păstrează marcajul legacy');
  await p.evaluate(()=>loadDevizFinalByNr('DF-244'));
  check(await p.evaluate(()=>devizData.totalPiese.final),481.5,'DF-244 redeschiderea după resalvare rămâne 481.50');
  const saved244=await p.evaluate(()=>structuredClone(fixture.rows));
  const snapshot244=saved244.deviz_final_linii.find(l=>l.ep_import_id).ep_snapshot;
  await p.reload();await p.waitForFunction(()=>window.devizData&&!document.querySelector('main').inert);
  await p.evaluate(rows=>Object.assign(fixture.rows,rows),saved244);await p.evaluate(installPriceStorage);
  await p.evaluate(()=>loadDevizFinalByNr('DF-244'));
  check(await p.locator('#piese-rows-body .piesa-pret').inputValue(),'535.00','DF-244: reload real păstrează afișarea 535.00');
  await p.locator('#btn-salveaza-deviz').click();await p.waitForFunction(()=>fixture.savedArgs?.p_deviz_id===244&&!document.querySelector('#btn-salveaza-deviz').disabled);
  check(await p.evaluate(()=>fixture.savedArgs.p_lines.filter(l=>l.ep_import_id).map(l=>[l.pret_unitar,l.total])),[['535',481.5]],'DF-244: a doua resalvare păstrează 535 și 481.50');
  check(await p.evaluate(()=>devizData.piese[0].epImport.snapshot),snapshot244,'DF-244: formatarea și două salvări păstrează snapshot-ul legacy');
  /* Prețul salvat are prioritate și când diferă de snapshot.unit_price. */
  await p.evaluate(()=>{fixture.rows.deviz_final_linii.find(l=>l.ep_import_id).pret_unitar='500';fixture.rows.deviz_final_header[0].ep_revision=2;fixture.rows.deviz_final_header[0].total_piese=450;});
  await p.evaluate(()=>loadDevizFinalByNr('DF-244'));
  check(await p.locator('#piese-rows-body .piesa-pret').inputValue(),'500.00','reload acordă prioritate pret_unitar 500, nu snapshot.unit_price 535');
  check(await p.evaluate(()=>devizData.totalPiese.final),450,'prețul DF 500 produce totalul 450 cu discount');
  await p.evaluate(()=>{
    fixture.rows.deviz_final_header=[{id_deviz_final:245,data_deviz:'07.11.2026',nr_inmatriculare:'CT44ELD',discount_global_piese:10,ep_revision:0,total_piese:314.253}];
    const vectors=[[12186,4,'8.51','15.754563000000000000000000'],[12187,1,'61.32','113.521716000000000000000000'],
      [12188,4,'0.94','1.740222000000000000000000'],[12189,1,'60.54','112.077702000000000000000000'],[12190,1,'28.95','53.595135000000000000000000']];
    fixture.rows.deviz_final_linii=vectors.map(([id,qty,purchase,price],i)=>({id,id_deviz_final:245,sectiune:'piese',nr_crt:i+1,denumire:`Import DF-245 ${id}`,um:'buc',cantitate:qty,pret_unitar:price,discount:1,
      ep_import_id:`00000000-0000-4000-8000-${String(id).padStart(12,'0')}`,ep_alocare_id:`00000000-0000-4000-9000-${String(id).padStart(12,'0')}`,
      ep_snapshot:{purchase_net:purchase,vat:'21',multiplier:'1.53',unit_price:price,supplier:'Furnizor sintetic',invoice_number:'TEST'}}));
  });
  await p.evaluate(()=>loadDevizFinalByNr('DF-245'));
  check(await p.locator('#piese-rows-body .piesa-valoare').evaluateAll(es=>es.map(e=>e.value)),['56.72','102.17','6.26','100.87','48.23'],'DF-245: cele cinci importuri păstrează totalurile live');
  check(await p.evaluate(()=>Number(devizData.totalPiese.final.toFixed(3))),314.253,'DF-245: suma importurilor păstrează cent-rotunjirea EP');
  const precise=await p.evaluate(()=>fixture.rows.deviz_final_linii.map(l=>l.pret_unitar));
  const snapshots=await p.evaluate(()=>fixture.rows.deviz_final_linii.map(l=>l.ep_snapshot));
  check(await p.locator('#piese-rows-body .piesa-pret').evaluateAll(es=>es.map(e=>e.value)),['15.75','113.52','1.74','112.08','53.60'],'DF-245: toate prețurile sunt afișate cu exact doi zecimali');
  await p.locator('#piese-rows-body .piesa-pret').last().focus();await p.locator('#piese-rows-body .piesa-pret').last().press('Tab');
  await p.locator('#btn-salveaza-deviz').click();await p.waitForFunction(()=>fixture.savedArgs?.p_deviz_id===245&&!document.querySelector('#btn-salveaza-deviz').disabled);
  check(await p.evaluate(()=>fixture.savedArgs.p_lines.filter(l=>l.ep_import_id).map(l=>l.pret_unitar)),precise,'DF-245: prima resalvare păstrează toate cele cinci prețuri precise');
  const rows=await p.evaluate(()=>structuredClone(fixture.rows));
  await p.reload();await p.waitForFunction(()=>window.devizData&&!document.querySelector('main').inert);
  await p.evaluate(rows=>Object.assign(fixture.rows,rows),rows);await p.evaluate(installPriceStorage);
  await p.evaluate(()=>loadDevizFinalByNr('DF-245'));
  check(await p.locator('#piese-rows-body .piesa-pret').evaluateAll(es=>es.map(e=>e.value)),['15.75','113.52','1.74','112.08','53.60'],'DF-245: reload real păstrează afișarea cu doi zecimali');
  await p.locator('#btn-salveaza-deviz').click();await p.waitForFunction(()=>fixture.savedArgs?.p_deviz_id===245&&!document.querySelector('#btn-salveaza-deviz').disabled);
  check(await p.evaluate(()=>fixture.savedArgs.p_lines.filter(l=>l.ep_import_id).map(l=>l.pret_unitar)),precise,'DF-245: a doua resalvare păstrează toate prețurile precise');
  check(await p.locator('#piese-rows-body .piesa-valoare').evaluateAll(es=>es.map(e=>e.value)),['56.72','102.17','6.26','100.87','48.23'],'DF-245: formatarea/reload/resalvarea păstrează toate totalurile liniilor');
  check(await p.evaluate(()=>devizData.piese.map(l=>l.epImport.snapshot)),snapshots,'DF-245: snapshot-urile rămân identice după două salvări');
  check(errors,[],'reload DF-244/245 fără erori JavaScript');
  await context.close();
}
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});try{await invoice(b);await prices(b);await precisionPrices(b);await legacyPrices(b);console.log(`TOTAL ${count} PASS — Chrome local, Supabase simulat`);}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
