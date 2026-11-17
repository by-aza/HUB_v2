/* Asociere EP/DF în Chrome: date sintetice, transport interceptat, fără Supabase live. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createPage } = require('./ep_df_ux.cjs');
let checks=0;
const check=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;console.log('PASS '+label);};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try {
  const {page:p,context,errors}=await createPage(browser,'modules/stocuri/evidenta_piese.html');
  await p.waitForFunction(()=>window.HubEpApi&&!HubEpApi.stale);
  await p.evaluate(async()=>{
   const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
   fixture.id=id; const s=fixture.snapshot;
   s.associations=[];
   s.invoices.push({...s.invoices[0],id:id(12),numar:'ALTA-FACTURA'});
   s.lines.push({...s.lines[0],id:id(13),factura_id:id(12),denumire:'Altă piesă'});
   s.allocations=[{id:id(5),linie_id:id(3),nr_inmatriculare_original:'CT44ELD',cantitate:10},
    {id:id(6),linie_id:id(4),nr_inmatriculare_original:'CT44ELD',cantitate:5},
    {id:id(15),linie_id:id(13),nr_inmatriculare_original:'CT44ELD',cantitate:10}];
   fixture.dfs=[{id_deviz_final:701,data_deviz:'17.11.2026',nr_inmatriculare:'CT44ELD',ep_revision:4}];
   const rpc=supabaseClient.rpc;
   supabaseClient.rpc=async(name,args)=>{
    if(!['ep_list_association_dfs','ep_associate_df'].includes(name))return rpc(name,args);
    fixture.rpcCalls.push({name,args:structuredClone(args)});
    if(name==='ep_list_association_dfs'){
     if(fixture.delayList)await new Promise(resolve=>setTimeout(resolve,fixture.delayList));
     return {data:structuredClone(fixture.dfs),error:fixture.listError||null};
    }
    if(fixture.uncertain){fixture.uncertain=false;throw new Error('Răspuns pierdut');}
    if(fixture.refused)return {error:{code:'P0001',message:'Cantitatea nu mai este disponibilă'}};
    fixture.associationArgs=structuredClone(args);
    for(const row of args.p.items){
     const a=s.allocations.find(a=>a.id===row.alocare_id);
     s.associations.push({id:row.id,alocare_id:a.id,df_id:args.p.df_id,cantitate:row.cantitate,
      nr_inmatriculare_original:a.nr_inmatriculare_original,created_at:'2026-11-17T10:00:00Z',created_by:id(81)});
    }
    return {data:{df_id:args.p.df_id},error:null};
   };
   const from=supabaseClient.from;
   supabaseClient.from=table=>({select:columns=>table==='auth_profiles'&&columns==='id,porecla'
     ?{in:async()=>({data:[{id:id(81),porecla:'autor-asociere'}],error:null})}:from(table).select(columns)});
   await HubEpApi.load();
  });
  const rows=p.locator('#tableBody tr');
  const partRow=p.locator('#tableBody tr[data-id="00000000-0000-4000-8000-000000000003"]');
  const otherRow=p.locator('#tableBody tr[data-id="00000000-0000-4000-8000-000000000004"]');
  check(await p.locator('#tableBody [data-bulk-part]').count(),3,'Piese are checkbox-uri reale pentru fiecare poziție');
  await partRow.locator('[data-bulk-part]').check();
  await otherRow.locator('td').nth(1).click();
  check(await otherRow.getAttribute('aria-selected'),'true','click-ul obișnuit păstrează deschiderea detaliilor');
  check(await partRow.locator('[data-bulk-part]').isChecked(),true,'deschiderea detaliilor păstrează selecția multiplă');
  await p.locator('#searchInput').fill('Altă piesă');
  await p.locator('#partsSelectAll').click();
  check(await p.locator('#bulkCount').textContent().then(t=>t.startsWith('2 poziții')),true,'selectează toate vizibile adaugă numai rezultatele filtrate');
  await p.locator('#searchInput').fill('');
  await p.locator('#bulkAssociateBtn').click();
  await p.waitForFunction(()=>!document.querySelector('#associationDf').disabled);
  check(await p.locator('#associationDf option').allTextContents(),['Selectează un DF','DF-701 · 17.11.2026 · CT44ELD'],'dialogul folosește lista DF din backend pentru aceeași mașină');
  check(await p.locator('#associationRows tr').count(),2,'un lot cu două facturi păstrează fiecare alocare');
  await p.locator('#associationDf').selectOption('701');
  await p.locator('[data-association-qty]').first().fill('11');
  await p.locator('#associationSave').click();
  check(await p.locator('#associationError').textContent().then(t=>t.includes('între 0 și 10')),true,'depășirea disponibilului este refuzată înainte de RPC');
  await p.locator('[data-association-qty]').first().fill('2');
  await p.locator('[data-association-qty]').nth(1).fill('3');
  const before=await p.evaluate(()=>structuredClone(fixture.snapshot.lines));
  await p.locator('#associationSave').click();
  await p.waitForFunction(()=>!document.querySelector('#associationModal').open);
  check(await p.evaluate(()=>fixture.associationArgs.p.items.map(r=>r.cantitate)),[2,3],'cantitățile parțiale se trimit într-un singur RPC');
  check(await p.evaluate(()=>fixture.associationArgs.p.expected_df_revision),4,'revizia DF este inclusă pentru verificarea backend');
  check(await p.evaluate(()=>fixture.snapshot.lines),before,'asocierea nu schimbă liniile și prețurile sursei');
  check(await p.evaluate(()=>fixture.rpcCalls.some(c=>c.name==='save_deviz_final')),false,'asocierea nu apelează salvarea financiară DF');
  check(await partRow.locator('td').last().textContent().then(t=>t.trim()),'DF-701','DEVIZ afișează numai referința, fără etichetă și cantitate');
  check(await partRow.locator('td').last().locator('a').evaluate(e=>({href:e.getAttribute('href'),style:e.className})),
    {href:'../devize/deviz_final.html?id=701',style:'ep-df-link'},'asocierea păstrează linkul DF și stilul referințelor importate');
  await partRow.locator('td').nth(1).click();
  check(await p.locator('#detailsPanel .ep-df-association').textContent(),'Asociat DF-701 · 2 buc.','detaliile păstrează eticheta asocierii și cantitatea');
  check(await p.locator('.ep-timeline-item').allTextContents().then(events=>events.some(t=>t.includes('Asociat DF-701')&&t.includes('autor-asociere'))),true,'istoricul arată actorul salvat, nu utilizatorul conectat');
  check(await p.locator('[data-action="reassign-part"]').first().isDisabled(),true,'o alocare asociată nu se reatribuie');
  await partRow.locator('[data-bulk-part]').check();
  await p.locator('#bulkAssociateBtn').click();
  await p.waitForFunction(()=>!document.querySelector('#associationDf').disabled);
  check(await p.locator('#associationRows td').nth(1).textContent(),'8 buc.','asocierea anterioară este scăzută din disponibil');
  await p.locator('#associationDf').selectOption('701');
  await p.locator('#associationSave').click();
  check(await p.locator('#associationError').textContent().then(t=>t.includes('deja asociată')),true,'asocierea duplicată este refuzată înainte de RPC');
  await p.locator('#associationCancel').click();
  await p.evaluate(()=>{fixture.dfs=[{...fixture.dfs[0],id_deviz_final:702}];});
  await p.locator('#bulkAssociateBtn').click();
  await p.waitForFunction(()=>!document.querySelector('#associationDf').disabled);
  await p.locator('#associationDf').selectOption('702');
  await p.evaluate(()=>{fixture.refused=true;});
  await p.locator('#associationSave').click();
  await p.waitForFunction(()=>document.querySelector('#associationError').textContent.includes('nu mai este disponibilă'));
  check(await p.locator('#associationModal').evaluate(e=>e.open),true,'refuzul backend păstrează dialogul și cantitățile');
  await p.locator('#associationCancel').click();
  await p.evaluate(async()=>{fixture.refused=false;await HubEpApi.load();fixture.uncertain=true;});
  await p.locator('#bulkAssociateBtn').click();
  await p.waitForFunction(()=>!document.querySelector('#associationDf').disabled);
  await p.locator('#associationDf').selectOption('702');
  await p.locator('#associationSave').click();
  await p.waitForFunction(()=>HubEpApi.pending&&!HubEpApi.busy);
  const intent=await p.evaluate(()=>fixture.rpcCalls.filter(c=>c.name==='ep_associate_df').at(-1).args);
  await p.locator('#associationForm .ep-recover-inline').click();
  await p.waitForFunction(()=>!HubEpApi.pending&&!document.querySelector('#associationModal').open);
  check(await p.evaluate(()=>fixture.rpcCalls.filter(c=>c.name==='ep_associate_df').at(-1).args),intent,'recuperarea păstrează UUID-ul și payload-ul cererii incerte');
  await p.locator('[data-tab="unassigned"]').click();
  check(await p.locator('#partsSelectAll').isVisible(),false,'selectarea tuturor nu se adaugă la De atribuit');
  check(await p.locator('#bulkAssociateBtn').isVisible(),false,'asocierea nu înlocuiește atribuirea bulk existentă');
  await p.evaluate(async()=>{fixture.snapshot.associations=[];fixture.snapshot.allocations=[];await HubEpApi.load();});
  await p.locator('#tableBody [data-bulk-part]').first().check();
  await p.locator('#bulkAssignBtn').click();
  check(await p.locator('#assignmentModal').isVisible(),true,'atribuirea bulk din De atribuit continuă să deschidă formularul existent');
  await p.locator('#assignmentCancel').click();
  await p.locator('[data-tab="parts"]').click();
  await p.evaluate(async()=>{
   const s=fixture.snapshot,id=fixture.id;
   s.allocations=[{id:id(5),linie_id:id(3),nr_inmatriculare_original:'CT44ELD',cantitate:10},
    {id:id(6),linie_id:id(4),nr_inmatriculare_original:'B999ALT',cantitate:5}];
   await HubEpApi.load();
  });
  await p.locator('#partsSelectAll').click();await p.locator('#bulkAssociateBtn').click();
  check(await p.locator('#associationStatus').textContent().then(t=>t.includes('nu au o mașină comună')),true,'lotul cu mașini diferite este oprit înainte de asociere');
  await p.locator('#associationCancel').click();await p.locator('#bulkClearBtn').click();
  await partRow.locator('[data-bulk-part]').check();
  for(const width of [1440,390]){
   await p.setViewportSize({width,height:900});
   await p.locator('#bulkAssociateBtn').click();
   await p.waitForFunction(()=>!document.querySelector('#associationDf').disabled);
   await p.waitForTimeout(200);
   await p.screenshot({path:`/tmp/hub-ep-association-${width}.png`});
   const b=await p.locator('#associationModal').boundingBox();
   check(b.x>=0&&b.x+b.width<=width,true,`dialogul rămâne în viewport la ${width}px`);
   await p.keyboard.press('Escape');
   check(await p.locator('#associationModal').evaluate(e=>e.open),false,'Escape închide dialogul fără salvare');
  }
  await p.evaluate(async()=>{delete fixture.snapshot.associations;await HubEpApi.load();});
  check(await p.locator('#bulkAssociateBtn').isDisabled(),true,'backendul fără migrare nu permite o asociere aparent salvată');
  check(errors,[],'fără erori JavaScript');
  await context.close();console.log(`TOTAL ${checks} PASS — Chrome local, Supabase simulat`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
