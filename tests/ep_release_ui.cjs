/* Chrome local: UI reală EP, transport/Auth simulate; SQL-ul este testat separat. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {createPage}=require('./ep_df_ux.cjs');
let count=0;
const check=(a,b,label)=>{assert.deepEqual(a,b,label);count++;console.log('PASS '+label);};
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  try {
    const {page:p,context,errors}=await createPage(browser,'modules/stocuri/evidenta_piese.html');
    await p.waitForFunction(()=>window.HubEpApi&&!HubEpApi.stale);
    /* Înlocuim numai răspunsul operației noi; nu executăm SQL prin browser. */
    await p.evaluate(()=>{
      const original=supabaseClient.rpc;
      supabaseClient.rpc=async(name,args)=>{
        if(name!=='ep_release_quantity')return original(name,args);
        fixture.rpcCalls.push({name,args:structuredClone(args)});
        if(fixture.releaseError)return {data:null,error:fixture.releaseError};
        if(fixture.releaseDelay)await new Promise(r=>setTimeout(r,fixture.releaseDelay));
        const s=fixture.snapshot,op=args.p;
        if(op.kind==='allocation'){
          const a=s.allocations.find(a=>a.id===op.id);
          a.cantitate_eliberata=(a.cantitate_eliberata||0)+a.cantitate;a.cantitate=0;
        } else {
          const t=s.transfers.find(t=>t.id===op.id);t.anulat_at='2026-11-06T12:30:00Z';
          if(t.alocare_id){const a=s.allocations.find(a=>a.id===t.alocare_id);a.cantitate-=t.cantitate;a.cantitate_eliberata=(a.cantitate_eliberata||0)+t.cantitate;}
        }
        s.invoices[0].revision++;
        return {data:{id:op.id,revision:s.invoices[0].revision},error:null};
      };
    });
    const part1='00000000-0000-4000-8000-000000000003',part2='00000000-0000-4000-8000-000000000004';
    const select=async(id)=>p.locator(`[data-select-id="${id}"]`).first().click({force:true});
    await select(part1);await p.locator('[data-action="assign-part"]').click();
    check(await p.locator('#assignmentReset').isVisible(),false,'reset ascuns la atribuire nouă');
    await p.locator('#assignmentCancel').click();await select(part2);
    await p.locator('.ep-quantity-history summary').click();await p.locator('[data-action="reassign-part"]').click();
    check(await p.locator('#assignmentReset').isVisible(),true,'reset disponibil numai în corectarea alocării');
    const positions=await p.locator('#assignmentReset').evaluate(e=>({left:e.getBoundingClientRect().left,right:document.querySelector('#assignmentCancel').getBoundingClientRect().left}));
    check(positions.left<positions.right,true,'reset în stânga, Anulează/Salvează în dreapta');
    await p.screenshot({path:'/tmp/hub-ep-release-desktop.png'});
    const accept=p.listeners('dialog')[0];p.off('dialog',accept);
    p.once('dialog',d=>d.dismiss());await p.locator('#assignmentReset').click();
    check(await p.evaluate(()=>fixture.rpcCalls.filter(c=>c.name==='ep_release_quantity').length),0,'refuzul confirmării nu trimite RPC');
    await p.locator('#assignmentQty').fill('1');
    p.on('dialog',accept);await p.locator('#assignmentReset').click();
    await p.waitForFunction(()=>document.querySelector('#assignmentModal').hidden);
    const call=await p.evaluate(()=>fixture.rpcCalls.find(c=>c.name==='ep_release_quantity'));
    check(call.args.p.kind,'allocation','reset trimite operația atomică');
    check(call.args.p.id,'00000000-0000-4000-8000-000000000005','reset folosește ID-ul alocării salvate');
    check(await p.locator('#detailsBody').textContent().then(s=>s.includes('5 buc. eliberate')),true,'reset folosește cantitatea salvată, păstrează istoricul');
    check(await p.locator('[data-action="assign-part"]').textContent().then(s=>s.includes('5 buc. disponibile')),true,'reset returnează toate bucățile în De atribuit');
    check(await p.locator('[data-select-id]').count()>0,true,'linia facturii rămâne în registru');
    /* Trimitere din alocare: după anulare rămân alte cantități și un DF salvat. */
    await p.evaluate(async()=>{
      const s=fixture.snapshot,a=s.allocations[0];a.cantitate=5;a.cantitate_eliberata=0;
      s.transfers=[{id:'transfer-test',linie_id:a.linie_id,alocare_id:a.id,cantitate:3,data_trimitere:'2026-11-06',created_at:'2026-11-06T10:00:00Z'}];
      s.imports=[{id:'import-test',df_id:8,part_id:a.linie_id,allocation_id:a.id,qty:1,snapshot:{plate:'CT44ELD',unit_price:18.513,imported_at:'2026-11-06T11:00:00Z'}}];
      await HubEpApi.load();
    });
    await p.locator('[data-action="cancel-warehouse"]').click();
    await p.waitForFunction(()=>fixture.snapshot.transfers[0].anulat_at);
    await p.locator('.ep-warehouse-record small').last().waitFor();
    check(await p.locator('#detailsBody').textContent().then(s=>s.includes('Anulată la')),true,'transferul anulat rămâne vizibil în detalii');
    check(await p.locator('[data-action="assign-part"]').textContent().then(s=>s.includes('3 buc. disponibile')),true,'transferul alocat revine în De atribuit');
    check(await p.locator('[data-action="reassign-part"]').isDisabled(),true,'cantitatea DF rămasă protejează alocarea');
    const kpi=await p.locator('.ep-kpi--warehouse').textContent();
    check(kpi.includes('0'),true,'KPI magazie exclude transferurile anulate');
    check(await p.locator('[data-action="cancel-warehouse"]').count(),0,'transferul anulat nu oferă anulare repetată');
    /* Anularea integrală arhivează sursa fără să rupă mapping-ul către istoricul transferului. */
    await p.evaluate(async()=>{
      const s=fixture.snapshot;s.imports=[];s.allocations[0].cantitate=3;s.allocations[0].cantitate_eliberata=0;
      s.transfers[0].anulat_at=null;await HubEpApi.load();
    });
    await p.locator('[data-action="cancel-warehouse"]').click();
    await p.waitForFunction(()=>document.querySelector('#detailsBody').textContent.includes('Alocare arhivată'));
    check(await p.locator('[data-action="assign-part"]').textContent().then(s=>s.includes('5 buc. disponibile')),true,'anularea integrală eliberează corect linia parțial alocată');
    check(await p.locator('#detailsBody').textContent().then(s=>s.includes('CT44ELD')),true,'numărul auto original rămâne în istoric');
    /* Eroare validată: fără mutație optimistă sau succes fals. */
    await p.evaluate(async()=>{const s=fixture.snapshot;s.transfers=[{id:'unallocated-test',linie_id:s.lines[1].id,cantitate:2,data_trimitere:'2026-11-06',created_at:'2026-11-06T10:00:00Z'}];fixture.releaseError={code:'P0001',message:'Factura a fost modificată'};await HubEpApi.load();});
    await p.locator('[data-action="cancel-warehouse"]').click();
    await p.waitForFunction(()=>HubEpApi.stale);
    check(await p.evaluate(()=>Boolean(fixture.snapshot.transfers[0].anulat_at)),false,'refuzul backendului nu eliberează cantități în UI');
    check(await p.locator('#successToast').textContent().then(s=>s.includes('nu a fost anulată')),true,'refuzul este afișat explicit');
    await p.evaluate(async()=>{fixture.releaseError=null;fixture.snapshot.transfers=[];fixture.snapshot.allocations[0].cantitate=2;fixture.snapshot.allocations[0].cantitate_eliberata=1;await HubEpApi.load();});
    await p.locator('.ep-quantity-history summary').first().click();await p.locator('[data-action="reassign-part"]').click();
    check(await p.locator('#assignmentSave').isDisabled(),true,'istoricul eliberării parțiale nu poate fi rescris prin corectare');
    check(await p.locator('#assignmentReset').isEnabled(),true,'restul liber al unei alocări eliberate parțial se poate reseta');
    await p.setViewportSize({width:390,height:844});
    check(await p.locator('#assignmentReset').isVisible(),true,'reset accesibil pe mobil');
    check(await p.evaluate(()=>document.documentElement.scrollWidth<=390),true,'modalul mobil nu produce overflow orizontal');
    await p.screenshot({path:'/tmp/hub-ep-release-mobile.png'});
    check(errors,[],'operațiile noi nu produc erori JavaScript');
    await context.close();console.log(`TOTAL ${count} PASS — Chrome local, SDK simulat`);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
