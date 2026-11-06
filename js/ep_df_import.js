/* Import facturi → Deviz Final: selecție contextuală HUB, snapshot financiar și retry idempotent. */
(() => {
  'use strict';
  const PROJECT = 'xyovkxmtbvgcwavuyxxu';
  let options, pending = null, busy = false, userId = null, generation = 0, ready = Promise.resolve();
  const el = id => document.getElementById(id);
  const uuid = () => {
    const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = b[6] & 15 | 64; b[8] = b[8] & 63 | 128;
    const h = [...b].map(n => n.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => Number(value || 0).toLocaleString('ro-RO', {minimumFractionDigits:2, maximumFractionDigits:2});
  /* Componente monetare la cent, folosind zecimalele text salvate, fără implicitul global curent. */
  const amount = (snapshot, quantity) => {
    const dec = value => {
      const m = String(value).match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
      if (!m || (!m[2] && !m[3])) throw new Error('Valoare financiară invalidă');
      const scale = (m[3] || '').length - Number(m[4] || 0);
      let n = BigInt((m[1] === '-' ? '-' : '') + ((m[2] || '0') + (m[3] || '')));
      if (scale < 0) n *= 10n ** BigInt(-scale);
      return {n,d:10n ** BigInt(Math.max(0,scale))};
    };
    const mul = (a,b) => ({n:a.n*b.n,d:a.d*b.d});
    const cent = a => { const sign = a.n < 0n ? -1n : 1n, n = a.n * sign * 100n; return sign * (n/a.d + (n%a.d*2n >= a.d ? 1n : 0n)); };
    const raw = mul(mul(dec(snapshot.purchase_net),dec(snapshot.multiplier)),dec(quantity));
    const net = cent(raw), vat = cent(mul(raw,mul(dec(snapshot.vat),{n:1n,d:100n})));
    return Number(net+vat)/100;
  };
  const fromDb = row => row.ep_import_id ? {id:row.ep_import_id,allocationId:row.ep_alocare_id,snapshot:clone(row.ep_snapshot)} : null;
  const storageKey = () => `hub-ep-df-intent:${PROJECT}:${userId}`;
  const remember = () => {
    try { if (pending) sessionStorage.setItem(storageKey(),JSON.stringify(pending)); else sessionStorage.removeItem(storageKey()); }
    catch (_) { /* Intenția rămâne în memoria filei dacă stocarea locală nu este disponibilă. */ }
  };
  const stateChanged = () => {
    const uncertain = Boolean(pending) && !busy;
    if (!options) return;
    options.onPending?.(uncertain);
    el('btn-salveaza-deviz').textContent = uncertain ? 'Reverifică salvarea' : 'Salvează';
  };
  const restorePending = async () => {
    const {data:{user}={},error} = await options.client.auth.getUser();
    if (error || !user) throw new Error('Autentificarea HUB este necesară.');
    if (userId !== user.id) { userId = user.id; pending = null; }
    if (!pending) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(storageKey()) || 'null');
        if (cached?.args?.p_header?.ep_request_id && Array.isArray(cached.args.p_lines)) pending = cached;
      } catch (_) { /* Un manifest deteriorat nu este executat. */ }
    }
    stateChanged();
  };
  const send = async () => {
    busy = true; stateChanged(); let response;
    try { response = await options.client.rpc('save_deviz_final', pending.args); }
    catch (error) { busy = false; stateChanged(); throw new Error('Răspuns incert. Folosește Reverifică salvarea; nu crea un alt deviz.'); }
    busy = false;
    if (response.error) {
      if (/^[0-9A-Z]{5}$/.test(response.error.code || '') || /^PGRST\d+$/.test(response.error.code || '')) { pending = null; remember(); }
      stateChanged();
      if (pending) response.error = {...response.error,message:'Răspuns incert. Folosește Reverifică salvarea; operația poate fi deja salvată.'};
      return response;
    }
    pending = null; remember(); stateChanged(); return response;
  };
  const save = async args => {
    await restorePending();
    if (pending) throw new Error('Reverifică mai întâi cererea anterioară.');
    pending = {args:clone({...args,p_header:{...args.p_header,ep_request_id:uuid()}})};
    remember(); return send();
  };
  const recover = async () => { await restorePending(); if (!pending) return null; return send(); };
  const decorate = (row,item) => {
    row.epImport = item.epImport ? clone(item.epImport) : null;
    if (!row.epImport) return;
    const input = row.querySelector('.piesa-pret'); input.readOnly = true;
    input.value = Number(row.epImport.snapshot.unit_price).toFixed(2);
    input.title = 'Preț din factura sursă, păstrat la salvarea în DF';
    row.querySelector('.piesa-cantitate').step = '1'; row.querySelector('.piesa-cantitate').min = '1';
    const note = document.createElement('small'); note.className = 'mt-1 block text-xs text-violet-300';
    note.textContent = `${row.epImport.snapshot.supplier} · ${row.epImport.snapshot.invoice_number}`;
    row.querySelector('.piesa-denumire').after(note);
  };
  const applySaved = (result,state) => {
    state.epRevision = Number(result.ep_revision || 0);
    const rows = new Map((result.ep_imports || []).map(r => [r.ep_import_id,r]));
    (state.piese || []).forEach(item => {
      const saved = rows.get(item.epImport?.id);
      if (saved) { item.epImport = fromDb(saved); item.pretUnitar = saved.ep_snapshot.unit_price; }
    });
    document.querySelectorAll('#piese-rows-body tr').forEach(row => {
      const saved = rows.get(row.epImport?.id);
      if (saved) row.epImport = fromDb(saved);
    });
  };
  const close = () => { generation++; el('ep-df-modal').classList.add('hidden'); el('btn-importa-facturi')?.focus(); };
  const open = async () => {
    if (busy || pending) return;
    const initial = options.context(), key = JSON.stringify(initial), version = ++generation;
    el('ep-df-modal').classList.remove('hidden'); el('ep-df-message').textContent = 'Se încarcă piesele eligibile…';
    el('ep-df-list').innerHTML = ''; el('ep-df-confirm').disabled = true;
    const response = await options.client.rpc('ep_list_df_parts', {
      p_plate:initial.plate,p_vin:initial.vin || '',p_vehicle:initial.vehicleId || null,p_df:initial.dfId || null
    });
    if (version !== generation) return;
    if (key !== JSON.stringify(options.context())) { el('ep-df-message').textContent = 'Antetul s-a schimbat. Închide și redeschide lista.'; return; }
    if (response.error) { el('ep-df-message').textContent = response.error.message; return; }
    const rows = response.data || [], already = new Set(options.parts().map(p => p.epImport?.allocationId).filter(Boolean));
    el('ep-df-message').textContent = rows.length ? 'Alege pozițiile și cantitățile. Importul se confirmă numai la salvarea devizului.' : 'Nu există piese alocate eligibile pentru această mașină.';
    /* Cardurile păstrează furnizorul/factura și cantități independente, inclusiv pe mobil. */
    rows.forEach(source => {
      const card = document.createElement('div'); card.className = 'ep-df-source rounded-xl border border-slate-700 bg-slate-900 p-3';
      const used = already.has(source.allocation_id);
      card.innerHTML = `<label class="flex items-start gap-3"><input type="checkbox" class="ep-df-select mt-1 h-4 w-4 accent-violet-500" ${used?'disabled':''}>
       <span class="min-w-0 flex-1"><strong class="block break-words text-slate-100">${esc(source.name)}</strong><small class="block break-words text-slate-400">${esc(source.supplier)} · ${esc(source.invoice_number)} · ${esc(source.invoice_date)} · ${esc(source.code)}</small></span></label>
       <div class="mt-3 flex flex-wrap items-end gap-3 text-sm"><label>Cantitate <input class="ep-df-qty ml-2 w-20 rounded border border-slate-600 bg-slate-800 p-1" type="number" min="1" step="1" max="${source.available}" value="${source.available}" ${used?'disabled':''}></label>
       <span class="text-slate-400">Disponibile: ${source.available} buc.${used?' · deja adăugată în formular':''}</span></div>
       <p class="mt-2 text-xs text-slate-400">Achiziție netă: ${money(source.purchase_net)} lei · TVA ${esc(source.vat)}% · Coeficient ${esc(source.multiplier)} · Vânzare unitară cu TVA: ${money(source.unit_price)} lei</p>
       <p class="ep-df-preview mt-1 text-sm font-bold text-violet-200"></p>
       <p class="ep-df-error mt-1 text-sm font-bold text-red-300" role="alert" hidden></p>`;
      const qty = card.querySelector('.ep-df-qty'), preview = card.querySelector('.ep-df-preview');
      const error = card.querySelector('.ep-df-error');
      qty.setAttribute('aria-describedby', error.id = `ep-df-error-${uuid()}`);
      /* Cantitatea integrală este implicită; orice depășire se explică lângă câmp. */
      const refresh = () => {
        const n = Number(qty.value), valid = Number.isInteger(n) && n>0 && n<=Number(source.available);
        preview.textContent = valid ? `Total cu TVA: ${money(amount(source,n))} lei` : '';
        error.hidden = valid;
        error.textContent = valid ? '' : `Cantitate cerută: ${qty.value || 'necompletată'} buc.; disponibilă: ${source.available} buc. ${n>Number(source.available) ? 'Cantitatea cerută depășește disponibilul.' : 'Introdu un număr întreg pozitiv în limita disponibilului.'}`;
        qty.setAttribute('aria-invalid', String(!valid));
        return valid;
      };
      qty.addEventListener('input',refresh); refresh(); card.validateQuantity = refresh; card.source = source; el('ep-df-list').append(card);
    });
    el('ep-df-confirm').disabled = !rows.some(r => !already.has(r.allocation_id));
    el('ep-df-confirm').onclick = () => {
      if (key !== JSON.stringify(options.context())) { el('ep-df-message').textContent = 'Antetul s-a schimbat. Reîncarcă lista.'; return; }
      const selected = [...el('ep-df-list').children].filter(card => card.querySelector('.ep-df-select').checked);
      if (!selected.length) { el('ep-df-message').textContent = 'Selectează cel puțin o piesă.'; return; }
      /* Verifică întregul lot înainte de primul append: fără import parțial sau trunchiere. */
      const invalid = selected.filter(card => !card.validateQuantity());
      if (invalid.length) {
        el('ep-df-message').textContent = `Import oprit. ${invalid.map(card => `${card.source.name}: ${card.querySelector('.ep-df-error').textContent}`).join(' ')} Nicio piesă nu a fost adăugată.`;
        invalid[0].querySelector('.ep-df-qty').focus(); return;
      }
      selected.forEach(card => {
        const s=card.source, snapshot={...s}, qty=Number(card.querySelector('.ep-df-qty').value);
        options.append({denumire:s.name,um:'buc',cantitate:qty,pretUnitar:s.unit_price,aplicaDiscount:false,
          epImport:{id:uuid(),allocationId:s.allocation_id,sourceRevision:s.source_revision,snapshot}});
      });
      options.changed(); close(); options.status('Piesele au fost adăugate. Salvează devizul pentru confirmarea cantităților.','info');
    };
  };
  const configure = config => {
    options = config;
    if (new URL(config.url).hostname !== `${PROJECT}.supabase.co`) throw new Error('Importul facturilor este configurat exclusiv pentru HUB.');
    el('btn-importa-facturi').addEventListener('click',open);
    el('ep-df-close').addEventListener('click',close);
    el('ep-df-modal').addEventListener('click',event => {if(event.target===el('ep-df-modal'))close();});
    document.addEventListener('keydown',event => {if(event.key==='Escape'&&!el('ep-df-modal').classList.contains('hidden'))close();});
    ready = restorePending().then(async () => {
      const {data,error}=await config.client.from('auth_profiles').select('rol_id,permissions').eq('id',userId).single();
      el('btn-importa-facturi').hidden=Boolean(error)||!(Number(data?.rol_id)===1||(data?.permissions?.deviz_final===true&&data?.permissions?.evidenta_piese===true));
      if(pending)config.status('Există o salvare incertă. Folosește Reverifică salvarea înainte de a continua.','error');
    }).catch(()=>{el('btn-importa-facturi').hidden=true;});
  };
  window.HubEpDf={amount,fromDb,decorate,applySaved,configure,close,save,recover,
    get pending(){return Boolean(pending);},get busy(){return busy;},get ready(){return ready;}};
})();
