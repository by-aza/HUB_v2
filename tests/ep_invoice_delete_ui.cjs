/* Interfața EP în Chrome local; transport sintetic. Protecțiile SQL au suită separată. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {createPage}=require('./ep_df_ux.cjs');
let count=0;
const check=(a,b,label)=>{assert.deepEqual(a,b,label);count++;console.log('PASS '+label);};
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  try{
    const {page:p,context,errors}=await createPage(browser,'modules/stocuri/evidenta_piese.html');
    await p.waitForFunction(()=>window.HubEpApi&&!HubEpApi.stale);
    await p.evaluate(()=>{
      fixture.originalSnapshot=structuredClone(fixture.snapshot);fixture.receipts={};
      const original=supabaseClient.rpc;
      supabaseClient.rpc=async(name,args)=>{
        if(!['ep_release_quantity','ep_save_invoice','ep_delete_invoice'].includes(name))return original(name,args);
        fixture.rpcCalls.push({name,args:structuredClone(args)});
        const s=fixture.snapshot,op=args.p;
        if(name==='ep_release_quantity'){
          if(op.kind==='allocation'){const a=s.allocations.find(a=>a.id===op.id);a.cantitate_eliberata=a.cantitate;a.cantitate=0;}
          else{const t=s.transfers.find(t=>t.id===op.id);t.anulat_at='2026-11-06T12:30:00Z';if(t.alocare_id){const a=s.allocations.find(a=>a.id===t.alocare_id);a.cantitate-=t.cantitate;a.cantitate_eliberata=t.cantitate;}}
          s.invoices[0].revision++;return {data:{id:op.id},error:null};
        }
        if(name==='ep_save_invoice'){
          const keep=new Set(op.lines.map(l=>l.id)),removed=new Set(s.lines.filter(l=>!keep.has(l.id)).map(l=>l.id));
          s.lines=s.lines.filter(l=>keep.has(l.id));s.allocations=s.allocations.filter(a=>!removed.has(a.linie_id));s.transfers=s.transfers.filter(t=>!removed.has(t.linie_id));
          s.invoices[0].revision++;return {data:{id:op.id},error:null};
        }
        if(fixture.deleteError)return {data:null,error:fixture.deleteError};
        if(fixture.receipts[args.p_request])return {data:fixture.receipts[args.p_request],error:null};
        const result={id:op.id,deleted:true,deleted_lines:s.lines.length};
        fixture.receipts[args.p_request]=result;s.invoices=[];s.lines=[];s.allocations=[];s.transfers=[];
        if(fixture.loseDeleteResponse){fixture.loseDeleteResponse=false;throw new Error('Network lost');}
        return {data:result,error:null};
      };
    });
    const invoice='00000000-0000-4000-8000-000000000002',part='00000000-0000-4000-8000-000000000004';
    const invoiceDetails=async()=>{await p.locator('#tab-invoices').click();await p.locator(`[data-select-id="${invoice}"]`).click({force:true});};
    await p.locator(`[data-select-id="${part}"]`).first().click({force:true});
    await p.locator('.ep-quantity-history summary').click();await p.locator('[data-action="reassign-part"]').click();
    await p.locator('#assignmentReset').click();await p.waitForFunction(()=>document.querySelector('#assignmentModal').hidden);
    await invoiceDetails();await p.locator('[data-action="edit-invoice"]').click();
    check(await p.locator('#invoiceLinesBody [data-remove-line]').last().isEnabled(),true,'reset → Editează factura permite eliminarea liniei');
    await p.locator('#invoiceLinesBody [data-remove-line]').last().click();await p.locator('#invoiceSave').click();
    await p.waitForFunction(()=>document.querySelector('#invoiceModal').hidden);
    check(await p.evaluate(()=>fixture.snapshot.lines.length),1,'eliminarea liniei după reset se salvează');
    await p.evaluate(async()=>{
      fixture.snapshot=structuredClone(fixture.originalSnapshot);fixture.snapshot.allocations[0].cantitate=2;
      fixture.snapshot.transfers=[{id:'transfer-test',linie_id:fixture.snapshot.lines[1].id,alocare_id:fixture.snapshot.allocations[0].id,cantitate:2,data_trimitere:'2026-11-06',created_at:'2026-11-06T10:00:00Z'}];
      await HubEpApi.load();
    });
    await p.locator('[data-action="cancel-warehouse"]').click();
    await p.waitForFunction(()=>fixture.snapshot.transfers[0].anulat_at);
    await p.locator('[data-action="edit-invoice"]').click();
    check(await p.locator('#invoiceLinesBody [data-remove-line]').last().isEnabled(),true,'anulare magazie → Editează factura permite eliminarea liniei');
    await p.locator('#invoiceLinesBody [data-remove-line]').last().click();await p.locator('#invoiceSave').click();
    await p.waitForFunction(()=>document.querySelector('#invoiceModal').hidden);
    check(await p.evaluate(()=>fixture.snapshot.lines.length),1,'eliminarea liniei după anulare se salvează');
    for(const [kind,word] of [['allocation','atribuire auto activă'],['warehouse','trimitere activă'],['df','DF salvat'],['return','retur înregistrat'],['legacy','istoric financiar protejat']]){
      await p.evaluate(async kind=>{
        fixture.snapshot=structuredClone(fixture.originalSnapshot);const s=fixture.snapshot;
        if(kind!=='allocation')s.allocations=[];
        if(kind==='warehouse')s.transfers=[{id:'transfer-test',linie_id:s.lines[1].id,cantitate:2,data_trimitere:'2026-11-06',created_at:'2026-11-06T10:00:00Z'}];
        if(kind==='df'){s.allocations=structuredClone(fixture.originalSnapshot.allocations);s.imports=[{id:'import-test',df_id:8,part_id:s.lines[1].id,allocation_id:s.allocations[0].id,qty:1,snapshot:{plate:'CT44ELD',unit_price:18.513,imported_at:'2026-11-06T10:00:00Z'}}];}
        if(kind==='return')s.returns=[{id:'return-test',linie_id:s.lines[1].id,cantitate:1,data_retur:'2026-11-06'}];
        if(kind==='legacy')s.lines[1].blocaj_istoric='DF-istoric';
        await HubEpApi.load();
      },kind);
      await invoiceDetails();const before=await p.evaluate(()=>fixture.rpcCalls.length);
      await p.locator('[data-action="delete-invoice"]').click();
      check(await p.locator('#invoiceDeleteError').textContent().then(s=>s.includes(word)),true,`ștergere blocată ${kind}: explicație în română`);
      check(await p.evaluate(()=>fixture.rpcCalls.length),before,`blocaj ${kind}: fără reset/anulare/RPC automat`);
    }
    await p.evaluate(async()=>{fixture.snapshot=structuredClone(fixture.originalSnapshot);fixture.snapshot.allocations=[];await HubEpApi.load();});
    await invoiceDetails();
    check(await p.locator('[data-action="delete-invoice"]').isVisible(),true,'Șterge factura este lângă Editează factura');
    const accept=p.listeners('dialog')[0];p.off('dialog',accept);p.once('dialog',d=>d.dismiss());
    let before=await p.evaluate(()=>fixture.rpcCalls.length);await p.locator('[data-action="delete-invoice"]').click();
    check(await p.evaluate(()=>fixture.rpcCalls.length),before,'refuzul confirmării nu șterge factura');p.on('dialog',accept);
    await p.evaluate(()=>{fixture.deleteError={code:'P0001',message:'Factura a fost modificată. Actualizează registrul înainte de ștergere.'};});
    await p.locator('[data-action="delete-invoice"]').click();await p.waitForFunction(()=>HubEpApi.stale);
    check(await p.locator('#invoiceDeleteError').textContent().then(s=>s.includes('Factura a fost modificată')),true,'refuzul backendului se afișează inline');
    check(await p.evaluate(()=>fixture.snapshot.invoices.length),1,'refuzul backendului păstrează factura');
    await p.evaluate(async()=>{fixture.deleteError=null;await HubEpApi.load();});await invoiceDetails();
    await p.locator('[data-action="delete-invoice"]').click();await p.waitForFunction(()=>!fixture.snapshot.invoices.length);
    check(await p.locator('#tableBody tr[data-id]').count(),0,'lista facturilor se actualizează după ștergere');
    await p.locator('#tab-parts').click();check(await p.locator('#tableBody tr[data-id]').count(),0,'lista pieselor se actualizează după ștergere');
    await p.evaluate(async()=>{fixture.snapshot=structuredClone(fixture.originalSnapshot);fixture.snapshot.allocations=[];fixture.loseDeleteResponse=true;await HubEpApi.load();});await invoiceDetails();
    await p.locator('[data-action="delete-invoice"]').click();await p.waitForFunction(()=>HubEpApi.pending);
    check(await p.locator('#tableBody tr[data-id]').count(),1,'răspuns incert: fără ștergere optimistă în UI');
    await p.locator('#epRecover').click();await p.waitForFunction(()=>!HubEpApi.pending&&!HubEpApi.busy);
    const calls=await p.evaluate(()=>fixture.rpcCalls.filter(c=>c.name==='ep_delete_invoice').slice(-2));
    check(calls[0].args.p_request,calls[1].args.p_request,'recuperarea ștergerii repetă exact UUID-ul');
    check(calls[0].args.p,calls[1].args.p,'recuperarea ștergerii repetă exact payload-ul');
    check(await p.locator('#tableBody tr[data-id]').count(),0,'după recuperare lista confirmă ștergerea');
    check(errors,[],'ștergerea nu produce erori JavaScript');
    await context.close();console.log(`TOTAL ${count} PASS — Chrome local, SDK simulat`);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
