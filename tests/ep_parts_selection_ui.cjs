/* Selecție Piese: scenariu B946BIO/DF-250 sintetic, fără acces Supabase real. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {createPage}=require('./ep_df_ux.cjs');
let count=0;
const check=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);count++;console.log('PASS '+label);};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try{
  const {page:p,context,errors}=await createPage(browser,'modules/stocuri/evidenta_piese.html');
  await p.waitForFunction(()=>window.HubEpApi&&!HubEpApi.stale);
  await p.evaluate(async()=>{
   const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
   const s=fixture.snapshot,base=s.lines[0],invoice=base.factura_id;
   const source=(n,name,qty,extra={})=>({...base,id:id(n),denumire:name,cantitate:qty,...extra});
   s.lines=[source(3,'Piesă deja asociată',10),source(4,'KIT ELIGIBIL A',5),source(13,'KIT ELIGIBIL B',4),
    source(14,'Piesă importată',4),source(15,'Piesă returnată integral',2),source(16,'Piesă în magazie',2),
    source(17,'B946BIO fără atribuire',7),source(18,'Piesă istorică',1,{blocaj_istoric:'DF-istoric'}),source(19,'Alt vehicul',3)];
   s.allocations=s.lines.filter(l=>l.id!==id(17)).map(l=>({id:id(Number(l.id.slice(-12))+100),linie_id:l.id,
    nr_inmatriculare_original:l.id===id(19)?'CT999ALT':'B946BIO',cantitate:l.cantitate}));
   s.associations=[{id:id(200),alocare_id:id(103),df_id:250,cantitate:2,nr_inmatriculare_original:'B946BIO',created_at:'2026-11-17T10:00:00Z'}];
   s.imports=[{id:id(201),df_id:251,part_id:id(14),allocation_id:id(114),qty:1,snapshot:{plate:'B946BIO',unit_price:'10',imported_at:'2026-11-17T10:00:00Z'}}];
   s.returns=[{id:id(202),linie_id:id(13),alocare_id:id(113),cantitate:1,data_retur:'2026-11-17'},
    {id:id(203),linie_id:id(15),alocare_id:id(115),cantitate:2,data_retur:'2026-11-17'}];
   s.transfers=[{id:id(204),linie_id:id(13),alocare_id:id(113),cantitate:1,data_trimitere:'2026-11-17'},
    {id:id(205),linie_id:id(16),alocare_id:id(116),cantitate:2,data_trimitere:'2026-11-17'}];
   const original=supabaseClient.rpc;
   supabaseClient.rpc=async(name,args)=>{
    if(!['ep_list_association_dfs','ep_associate_df'].includes(name))return original(name,args);
    fixture.rpcCalls.push({name,args:structuredClone(args)});
    if(name==='ep_list_association_dfs')return {data:[{id_deviz_final:250,data_deviz:'17.11.2026',nr_inmatriculare:'B946BIO',ep_revision:3}],error:null};
    fixture.selectedPayload=structuredClone(args);
    args.p.items.forEach(item=>s.associations.push({id:item.id,alocare_id:item.alocare_id,df_id:args.p.df_id,cantitate:item.cantitate,
     nr_inmatriculare_original:'B946BIO',created_at:'2026-11-17T11:00:00Z'}));
    return {data:{df_id:250},error:null};
   };
   await HubEpApi.load();
  });
  const row=n=>p.locator(`#tableBody tr[data-id="00000000-0000-4000-8000-${String(n).padStart(12,'0')}"]`);
  const header=p.locator('#partsSelectAllCheck');
  const selected=()=>p.locator('#tableBody [data-bulk-part]:checked').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.bulkPart.slice(-12))).sort((a,b)=>a-b));
  const headerState=()=>header.evaluate(e=>({checked:e.checked,partial:e.indeterminate,disabled:e.disabled}));
  await p.locator('#searchInput').fill('B946BIO');
  check(await p.locator('#tableBody tr').count(),8,'filtrul B946BIO păstrează numai cele opt poziții relevante');
  check(await headerState(),{checked:false,partial:false,disabled:false},'checkbox disponibil în prima coloană a antetului Piese');
  check(await row(3).locator('td').last().textContent().then(t=>t.trim()),'DF-250','fixture-ul include piesa deja asociată DF-250');
  await header.check();
  check(await selected(),[4,13],'select all sare peste asociate/importate, retur integral, magazie, istoric și nealocate');
  check(await row(3).locator('[data-bulk-part]').isChecked(),false,'asocierea parțială existentă este omisă fără a opri lotul');
  check(await row(14).locator('[data-bulk-part]').isChecked(),false,'rândul importat parțial nu este selectat global');
  check(await headerState(),{checked:true,partial:false,disabled:false},'antet bifat pentru toate pozițiile eligibile');
  check(await p.locator('#bulkCount').textContent(),'2 poziții selectate · 7 buc. disponibile','numărul pozițiilor și disponibilul exclud returul/magazia');
  check(await p.locator('#searchInput').inputValue(),'B946BIO','selectarea nu schimbă filtrul');
  await header.uncheck();
  check(await selected(),[],'deselect all golește selecția vizibilă');
  check(await p.locator('#bulkBar').isVisible(),false,'bara bulk dispare când selecția este goală');
  await row(4).locator('[data-bulk-part]').check();
  check(await headerState(),{checked:false,partial:true,disabled:false},'selecția individuală produce antet parțial');
  check(await p.locator('#bulkCount').textContent(),'1 poziție selectată · 5 buc. disponibile','contor singular corect');
  await row(13).locator('[data-bulk-part]').check();
  check(await header.isChecked(),true,'bifarea individuală a tuturor eligibilelor bifează antetul');
  await row(4).locator('[data-bulk-part]').uncheck();
  check(await header.evaluate(e=>e.indeterminate),true,'debifarea individuală revine la starea parțială');
  await p.locator('#bulkClearBtn').click();
  check(await headerState(),{checked:false,partial:false,disabled:false},'golirea selecției resetează antetul');
  await p.locator('#searchInput').fill('KIT ELIGIBIL A');await header.check();
  check(await selected(),[4],'select all se limitează la filtrul restrâns');
  await p.locator('#searchInput').fill('B946BIO');
  check(await header.evaluate(e=>e.indeterminate),true,'schimbarea filtrului recalculează starea parțială');
  await header.check();
  await row(3).locator('td').nth(1).click();
  check(await row(3).getAttribute('aria-selected'),'true','click-ul pe rând continuă să deschidă detaliile');
  check(await selected(),[4,13],'detaliile nu modifică selecția multiplă');
  check(await p.locator('#detailsPanel .ep-df-association').textContent(),'Asociat DF-250 · 2 buc.','detaliile păstrează asocierea existentă');
  await row(3).locator('[data-bulk-part]').check();
  check(await header.evaluate(e=>e.indeterminate),true,'restul parțial poate fi selectat explicit');
  await header.check();
  check(await selected(),[4,13],'select all elimină din lot rândul asociat selectat explicit');
  await header.uncheck();await p.locator('#partsSelectAll').click();
  check(await selected(),[4,13],'butonul existent selectează aceeași listă eligibilă');
  const before=await p.evaluate(()=>({imports:structuredClone(fixture.snapshot.imports),returns:structuredClone(fixture.snapshot.returns),transfers:structuredClone(fixture.snapshot.transfers)}));
  await p.locator('#bulkAssociateBtn').click();
  await p.waitForFunction(()=>!document.querySelector('#associationDf').disabled);
  check(await p.locator('#associationRows tr').count(),2,'rândul asociat DF-250 nu întrerupe asocierea celorlalte poziții');
  check(await p.locator('#associationVehicle').inputValue(),'plate:B946BIO','mașina rămâne B946BIO în dialog');
  check(await p.evaluate(()=>fixture.rpcCalls.filter(c=>c.name==='ep_list_association_dfs').at(-1).args.p_allocation_ids.map(v=>Number(v.slice(-12))).sort((a,b)=>a-b)),[104,113],'lista DF primește numai alocările eligibile selectate');
  await p.locator('#associationDf').selectOption('250');await p.locator('#associationSave').click();
  await p.waitForFunction(()=>!document.querySelector('#associationModal').open);
  check(await p.evaluate(()=>fixture.selectedPayload.p.items.map(v=>({source:Number(v.alocare_id.slice(-12)),qty:v.cantitate})).sort((a,b)=>a.source-b.source)),
   [{source:104,qty:5},{source:113,qty:2}],'confirmarea păstrează exact cantitățile eligibile și exclude piesa deja asociată');
  check(await p.evaluate(()=>fixture.snapshot.associations.find(v=>v.id.endsWith('000000000200')).cantitate),2,'asocierea DF-250 inițială rămâne intactă');
  check(await p.evaluate(()=>({imports:fixture.snapshot.imports,returns:fixture.snapshot.returns,transfers:fixture.snapshot.transfers})),before,'importurile, retururile și magazia sunt păstrate');
  check(await headerState(),{checked:false,partial:false,disabled:true},'antet dezactivat când filtrul nu mai are poziții eligibile');
  await p.locator('#searchInput').fill('fără rezultat');
  check(await header.isDisabled(),true,'lista goală nu poate selecta piese ascunse');
  await p.locator('#tab-unassigned').click();
  check(await header.count(),0,'De atribuit nu primește checkbox global');
  await row(17).locator('[data-bulk-part]').check();await p.locator('#bulkAssignBtn').click();
  check(await p.locator('#assignmentModal').isVisible(),true,'atribuirea bulk existentă rămâne funcțională');
  await p.locator('#assignmentCancel').click();
  check(errors,[],'fără erori JavaScript');
  await context.close();console.log(`TOTAL ${count} PASS — B946BIO/DF-250 local, date simulate`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
