/* Ciorne locale DF: JSON versionat, fără tokenuri sau scrieri în Supabase. */
(function (global) {
    'use strict';
    const VERSION = 1;
    const UUID = /^[a-f0-9-]{36}$/i;
    const uuid = () => global.crypto.randomUUID ? global.crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, digit => (digit ^ global.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> digit / 4).toString(16));
    const canonical = value => JSON.stringify(value, function (key, item) {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
            return Object.keys(item).sort().reduce((result, name) => {
                Object.defineProperty(result, name, { value: item[name], enumerable: true });
                return result;
            }, {});
        }
        return item;
    });
    const clone = value => JSON.parse(JSON.stringify(value));
    const canUse = profile => Number(profile?.rol_id) === 1 ||
        (Object.hasOwn(profile?.permissions || {}, 'deviz_final')
            ? profile.permissions.deviz_final === true : profile?.permissions?.devize === true);

    /* Fiecare revizie are cheie proprie. Alt tab scrie o copie, niciodată peste cheia sursă. */
    function store(project, userId, warn = () => {}) {
        const prefix = `hub:df-local:v${VERSION}:${encodeURIComponent(project)}:${encodeURIComponent(userId)}:`;
        const discardPrefix = prefix.replace('hub:df-local:', 'hub:df-discard:');
        const owner = uuid();
        let sequence = 0;
        const warning = () => warn('Ciorna locală nu este disponibilă sau este deteriorată. Salvează manual devizul; protecția locală nu este garantată.');
        function list() {
            const found = [];
            try {
                for (let i = 0; i < global.localStorage.length; i++) {
                    const key = global.localStorage.key(i);
                    if (!key?.startsWith(prefix)) continue;
                    try {
                        const record = JSON.parse(global.localStorage.getItem(key));
                        if (record?.version !== VERSION || record.userId !== userId || record.project !== project ||
                            !UUID.test(record.id) || !UUID.test(record.revision) || !record.payload?.data ||
                            !Number.isFinite(Date.parse(record.writtenAt)) || key !== prefix + record.id + ':' + record.revision) throw Error('invalid');
                        if (!wasDiscarded(record)) found.push({ ...record, key });
                    } catch (_) { warning(); }
                }
            } catch (_) { warning(); }
            const sorted = found.sort((a,b) => a.id === b.id && a.owner === b.owner ? (b.sequence || 0) - (a.sequence || 0) : b.writtenAt.localeCompare(a.writtenAt));
            return sorted.filter((row,index) => sorted.findIndex(candidate => candidate.id === row.id) === index);
        }
        function write(id, payload, documentId, previous) {
            try {
                if (previous && wasDiscarded(previous)) return null;
                const record = { version: VERSION, project, userId, id, owner, revision: uuid(),
                    documentId: documentId || null, sequence: ++sequence, writtenAt: new Date().toISOString(), payload: clone(payload) };
                const key = prefix + id + ':' + record.revision;
                const json = JSON.stringify(record);
                global.localStorage.setItem(key, json);
                if (global.localStorage.getItem(key) !== json) throw Error('write not confirmed');
                if (previous && wasDiscarded(previous)) { global.localStorage.removeItem(key); return null; }
                /* Curățăm numai cheia exactă înlocuită de această copie confirmată. */
                if (previous) remove(previous);
                global.dispatchEvent(new Event('hub:df-drafts-changed'));
                return { ...record, key };
            } catch (_) { warning(); return null; }
        }
        function remove(record) {
            try {
                if (!record?.key?.startsWith(prefix)) return false;
                const current = global.localStorage.getItem(record.key);
                if (current === null) return true;
                const parsed = JSON.parse(current);
                if (parsed.revision !== record.revision || parsed.id !== record.id || parsed.userId !== userId) return false;
                global.localStorage.removeItem(record.key);
                /* O întrerupere între două scrieri poate lăsa o revizie anterioară. */
                for (let i = global.localStorage.length - 1; i >= 0; i--) {
                    const key = global.localStorage.key(i);
                    if (!key?.startsWith(prefix + record.id + ':')) continue;
                    try {
                        const older = JSON.parse(global.localStorage.getItem(key));
                        if (older.owner === parsed.owner && Number(older.sequence || 0) <= Number(parsed.sequence || 0)) global.localStorage.removeItem(key);
                    } catch (_) { /* Corupția rămâne inspectabilă, nu ștergem arbitrar. */ }
                }
                global.dispatchEvent(new Event('hub:df-drafts-changed'));
                return global.localStorage.getItem(record.key) === null;
            } catch (_) { warning(); return false; }
        }
        /* Ștergerea explicită este distinctă de înlocuirea unei revizii la scriere/salvare. */
        function wasDiscarded(record) {
            if (!record) return false;
            try {
                const notice = JSON.parse(global.localStorage.getItem(discardPrefix + record.id) || 'null');
                return Boolean(notice && notice.owner === record.owner && Number(notice.sequence) >= Number(record.sequence || 0));
            } catch (_) { warning(); return false; }
        }
        function discard(record) {
            try {
                if (!record?.key?.startsWith(prefix)) return false;
                const current = JSON.parse(global.localStorage.getItem(record.key) || 'null');
                if (!current || current.revision !== record.revision || current.userId !== userId) return false;
                const noticeKey = discardPrefix + record.id;
                const previous = JSON.parse(global.localStorage.getItem(noticeKey) || 'null');
                const sequence = previous?.owner === current.owner ? Math.max(Number(previous.sequence),Number(current.sequence || 0)) : Number(current.sequence || 0);
                const notice = JSON.stringify({owner:current.owner,sequence});
                global.localStorage.setItem(noticeKey,notice);
                if (global.localStorage.getItem(noticeKey) !== notice) throw Error('discard not confirmed');
                const removed = remove(record);
                global.dispatchEvent(new Event('hub:df-draft-discarded'));
                return removed;
            } catch (_) { warning(); return false; }
        }
        return { list, write, remove, discard, wasDiscarded, discardPrefix, owner, prefix };
    }

    /* Inspecție lizibilă pentru utilizator: antet și rânduri, fără JSON/chei interne. */
    function preview(versions) {
        const box = document.createElement('div'); box.className = 'df-local-preview';
        Object.entries(versions).forEach(([name,snapshot]) => {
            if (!snapshot || typeof snapshot !== 'object') return;
            const section = document.createElement('section'), title = document.createElement('h3');
            title.textContent = name === 'salvat' ? 'Devizul salvat' : 'Ciorna locală'; section.append(title);
            const data = snapshot.header || snapshot;
            const value = (...keys) => keys.map(key => data[key]).find(item => item !== undefined && item !== null && item !== '') ?? '—';
            const fields = [
                ['Client',value('client')],['Număr auto',value('nrInmatriculare','nr_inmatriculare')],
                ['Auto',value('tipAuto','auto')],['VIN',value('serieVin','serie_vin')],
                ['Serie motor',value('serieMotor','serie_motor')],['Km',value('km')],
                ['Data devizului',value('data','data_deviz')],['Deviz estimativ',value('idDevizEstimativ','id_deviz_estimativ')],
                ['Termen execuție',value('termenExecutie','termen_executie')],['Discount piese (%)',value('discountGlobalPiese','discount_global_piese')]
            ];
            const list = document.createElement('dl');
            fields.forEach(([label,text]) => { const dt = document.createElement('dt'),dd = document.createElement('dd'); dt.textContent = label; dd.textContent = String(text); list.append(dt,dd); });
            section.append(list);
            const groups = Array.isArray(snapshot.lines) ? [
                ['Linii salvate',snapshot.lines.filter(row => row && typeof row === 'object').map(row => ({text:[row.sectiune,row.denumire || '(rând gol)',row.detalii,
                    row.cantitate != null ? 'Cant.: '+row.cantitate : '',row.pret_unitar != null ? 'Preț: '+row.pret_unitar : '',
                    row.total != null ? 'Total: '+row.total : '',row.avans_id ? 'AV-'+row.avans_id : '',
                    row.comanda_piesa_sh_id ? 'SH-'+row.comanda_piesa_sh_id : '',Number(row.discount)===1 ? (row.sectiune === 'constatari' ? 'Acceptat' : 'Discount bifat') : ''].filter(Boolean).join(' · ')}))]
            ] : [
                ['Lucrări solicitate',(Array.isArray(data.lucrariSolicitate) ? data.lucrariSolicitate : []).map(row => ({text:[row?.denumire,row?.pieseClient].filter(Boolean).join(' · ')}))],
                ['Constatări',(Array.isArray(data.constatari) ? data.constatari : []).map(row => ({text:(row?.defect || '(rând gol)')+(row?.acceptatClient ? ' · Acceptat' : '')}))],
                ['Manoperă',(Array.isArray(data.manopera?.rows) ? data.manopera.rows : []).map(row => ({text:[row?.denumire || '(rând gol)','Ore: '+(row?.timpOre ?? ''),'Tarif: '+(row?.tarifOra ?? ''),'Total: '+(row?.valoareLei ?? '')].join(' · ')}))],
                ['Piese',(Array.isArray(data.piese) ? data.piese : []).map(row => ({text:[row?.denumire || '(rând gol)',row?.um,'Cant.: '+(row?.cantitate ?? ''),'Preț: '+(row?.pretUnitar ?? ''),row?.aplicaDiscount ? 'Discount bifat' : '',row?.comandaPiesaShId ? 'SH-'+row.comandaPiesaShId : ''].filter(Boolean).join(' · ')}))],
                ['Avansuri',(Array.isArray(data.avansuri) ? data.avansuri : []).map(row => ({text:'AV-'+row?.avansId+' · '+row?.total+' Lei'}))]
            ];
            groups.forEach(([label,rows]) => {
                const heading = document.createElement('strong'),ol = document.createElement('ol'); heading.textContent = label;
                rows.forEach(row => { const li = document.createElement('li'); li.textContent = row.text || '(rând gol)'; ol.append(li); });
                section.append(heading,ol);
            });
            box.append(section);
        });
        return box;
    }

    /* Un singur dialog centrat, focus capturat și revenire la elementul inițial. */
    let activeDialog = null;
    function dialog({ title, message = '', details = null, actions = [], content = null }) {
        if (activeDialog) return Promise.resolve(null);
        return new Promise(resolve => {
            const previous = document.activeElement;
            const overlay = document.createElement('div');
            overlay.className = 'df-local-overlay';
            const panel = document.createElement('section');
            panel.className = 'df-local-dialog';
            panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
            const heading = document.createElement('h2'); heading.id = 'df-local-title'; heading.textContent = title;
            panel.setAttribute('aria-labelledby', heading.id);
            const close = document.createElement('button'); close.type = 'button'; close.className = 'df-local-close';
            close.textContent = '×'; close.setAttribute('aria-label', 'Închide');
            const text = document.createElement('p'); text.textContent = message;
            panel.append(close, heading, text);
            if (content) panel.append(content);
            if (details) {
                const section = document.createElement('details'), summary = document.createElement('summary');
                summary.textContent = 'Inspectează versiunile (fără salvare)';
                section.append(summary, preview(details)); panel.append(section);
            }
            const footer = document.createElement('div'); footer.className = 'df-local-actions';
            const finish = value => {
                document.removeEventListener('keydown', keydown, true);
                overlay.remove(); activeDialog = null;
                if (previous?.isConnected) previous.focus();
                resolve(value);
            };
            const keydown = event => {
                if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); finish(null); }
                if (event.key !== 'Tab') return;
                const focusable = Array.from(panel.querySelectorAll('button,select,summary,[tabindex="0"]')).filter(el => !el.disabled);
                const first = focusable[0], last = focusable.at(-1);
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            };
            actions.forEach(action => {
                const button = document.createElement('button'); button.type = 'button'; button.textContent = action.label;
                button.className = action.primary ? 'df-local-primary' : '';
                button.addEventListener('click', () => finish(action.value)); footer.append(button);
            });
            close.addEventListener('click', () => finish(null));
            panel.append(footer); overlay.append(panel); document.body.append(overlay);
            activeDialog = finish; document.addEventListener('keydown', keydown, true); close.focus();
        });
    }
    function label(record) {
        const plate = String(record.payload.data.nrInmatriculare || '').trim() || 'Fără număr';
        const name = record.documentId ? `DF-${String(record.documentId).padStart(3, '0')}` : 'Deviz nou';
        return `${plate} · ${name} · ${new Date(record.writtenAt).toLocaleString('ro-RO')}`;
    }

    /* Vizita e marcată doar în sessionStorage, fără date personale; logout-ul o resetează. */
    function visitKey(project, userId) { return `hub:df-visit:${project}:${userId}`; }
    function markVisit(project,userId) {
        try { global.sessionStorage.setItem(visitKey(project,userId),'1'); } catch (_) { /* Recuperarea rămâne disponibilă fără marcaj. */ }
    }
    async function mount({ project, userId, allowed, target, onChoose, filter = () => true, automatic = true, warn, client }) {
        if (!allowed) return null;
        const storage = store(project, userId, warn);
        const button = document.createElement('button'); button.type = 'button'; button.className = 'df-local-entry';
        button.textContent = 'Ciorne locale'; button.hidden = true;
        (target || document.body).append(button);
        let disposed = false, subscription = null;
        const records = () => storage.list().filter(filter);
        const refresh = () => { if (!disposed) button.hidden = records().length === 0; };
        async function offer() {
            while (!disposed) {
                const rows = records(); refresh(); if (!rows.length) return;
                const select = document.createElement('select'); select.className = 'df-local-select'; select.setAttribute('aria-label', 'Ciornă locală');
                rows.forEach(row => { const option = document.createElement('option'); option.value = row.id + ':' + row.revision; option.textContent = label(row); select.append(option); });
                const content = document.createElement('div'), summary = document.createElement('p');
                summary.className = 'df-local-summary';
                const updateSummary = () => { const selected = rows.find(row => row.id + ':' + row.revision === select.value); summary.textContent = selected ? label(selected) : ''; };
                select.addEventListener('change', updateSummary); updateSummary();
                if (rows.length > 1) content.append(select);
                content.append(summary);
                const action = await dialog({ title: 'Ai un deviz cu modificări nesalvate',
                    message: 'Modificările au fost păstrate pe acest dispozitiv.', content,
                    actions: [{label:'Continuă lucrul',value:'continue',primary:true},{label:'Șterge ciorna',value:'delete'}] });
                if (disposed || !action) return;
                const chosen = rows.find(row => row.id + ':' + row.revision === select.value);
                if (!chosen) return;
                if (!storage.list().some(row => row.key === chosen.key)) continue;
                if (action === 'continue') {
                    if (onChoose) await onChoose(chosen);
                    else global.location.href = '/modules/devize/deviz_final.html?localDraft=' + encodeURIComponent(chosen.id);
                    return;
                }
                const yes = await dialog({title:'Ștergi ciorna locală?',message:label(chosen) + '. Documentul salvat în baza de date nu va fi modificat.',
                    actions:[{label:'Păstrează',value:false},{label:'Șterge ciorna',value:true}]});
                if (yes === true && !disposed) storage.discard(chosen);
                refresh(); if (!yes) return;
            }
        }
        const change = () => refresh();
        button.addEventListener('click', offer); global.addEventListener('storage', change); global.addEventListener('hub:df-drafts-changed', change);
        if (client?.auth) {
            subscription = client.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_OUT' || (session?.user && session.user.id !== userId)) {
                    disposed = true; button.remove(); global.removeEventListener('storage', change); global.removeEventListener('hub:df-drafts-changed', change); activeDialog?.(null); clearVisits();
                    subscription?.unsubscribe();
                }
            }).data?.subscription;
        }
        refresh();
        const key = visitKey(project, userId);
        let prompted = false;
        try { prompted = global.sessionStorage.getItem(key) === '1'; } catch (_) { /* Blocarea sessionStorage nu blochează recuperarea. */ }
        if (automatic && !prompted && records().length) {
            try { global.sessionStorage.setItem(key, '1'); } catch (_) { /* Fallback în memoria paginii. */ }
            await offer();
        }
        return { offer, refresh, dispose() { subscription?.unsubscribe(); disposed = true; button.remove(); global.removeEventListener('storage', change); global.removeEventListener('hub:df-drafts-changed', change); activeDialog?.(null); } };
    }

    /* Editorul citește inputurile la fiecare copie; debounce 2s și plafon 10s. */
    function editor({ storage, capture, comparable = canonical, documentId, status, isCurrent = () => true }) {
        let id = uuid(), record = null, baseline = comparable(capture()), last = canonical(capture());
        let restored = false, stopped = false, discarded = false, discardedSignature = null, idle = null, max = null;
        function cancel() { clearTimeout(idle); clearTimeout(max); idle = max = null; }
        function dirty() {
            try { return !stopped && (restored || comparable(capture()) !== baseline); }
            catch (_) { status('Ciorna locală nu a putut fi păstrată. Salvează manual devizul.', true); return !stopped; }
        }
        /* Un temporizator vechi nu recreează copia ștearsă în acest tab sau în altul. */
        function checkDiscard() {
            if (!record || !storage.wasDiscarded(record)) return;
            cancel(); discarded = true;
            try { discardedSignature = comparable(capture()); } catch (_) { discardedSignature = null; }
            record = null;
            status('Ciorna locală a fost ștearsă. Modificările din formular nu sunt salvate.');
        }
        function onDiscard(event) {
            if (!event.key || event.key.startsWith(storage.discardPrefix)) checkDiscard();
        }
        global.addEventListener('storage',onDiscard);
        global.addEventListener('hub:df-draft-discarded',onDiscard);
        function flush() {
            cancel(); if (stopped || !isCurrent()) return null;
            checkDiscard(); if (discarded) return null;
            try {
                const payload = capture(), signature = comparable(payload);
                if (!restored && signature === baseline) {
                    if (record) storage.remove(record);
                    record = null; last = signature; status(''); return null;
                }
                if (canonical(payload) === last && record) {
                    status('Ciornă păstrată pe acest dispozitiv · ' + new Date(record.writtenAt).toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'}));
                    return record;
                }
                const saved = storage.write(id, payload, documentId(), record);
                if (saved) { record = saved; last = canonical(payload); status('Ciornă păstrată pe acest dispozitiv · ' + new Date(saved.writtenAt).toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})); }
                return saved;
            } catch (_) { status('Ciorna locală nu a putut fi păstrată. Salvează manual devizul.', true); return null; }
        }
        function changed() {
            if (stopped || !isCurrent()) return;
            try {
                const payload = capture();
                checkDiscard();
                if (discarded) {
                    if (comparable(payload) === discardedSignature) return;
                    discarded = false; discardedSignature = null; id = uuid(); last = '';
                }
                if (!restored && comparable(payload) === baseline) { cancel(); if (record) flush(); return; }
                if (record && canonical(payload) === last) return;
            } catch (_) { status('Ciorna locală nu a putut fi păstrată. Salvează manual devizul.', true); return; }
            status('Modificări nesalvate · păstrare locală în curs…');
            clearTimeout(idle); idle = setTimeout(flush, 2000);
            if (!max) max = setTimeout(flush, 10000);
        }
        function reset() { cancel(); id = uuid(); record = null; restored = false; discarded = false; discardedSignature = null; baseline = comparable(capture()); last = canonical(capture()); status(''); }
        return { changed, flush, dirty, reset,
            restore(source) {
                if (storage.wasDiscarded(source)) return false;
                cancel(); id = uuid(); record = source; restored = true; discarded = false; discardedSignature = null;
                last = canonical(capture()); status('Ciornă recuperată · modificări nesalvate'); return true;
            },
            beforeSave() {
                try { const copy = flush(); return {record:copy || record,signature:comparable(capture()),payload:clone(capture())}; }
                catch (_) { status('Ciorna locală nu a putut fi păstrată. Salvarea manuală continuă.',true); return null; }
            },
            saved(ticket) {
                cancel();
                let newer;
                try { newer = comparable(capture()) !== ticket.signature; }
                catch (_) { status('Salvarea manuală a reușit; ciorna locală nu a putut fi verificată și este păstrată.',true); return; }
                if (ticket.record) storage.remove(ticket.record);
                if (!newer && record && comparable(record.payload) === ticket.signature) storage.remove(record);
                record = !newer || record?.key === ticket.record?.key ? null : record;
                baseline = ticket.signature; restored = newer; discarded = false; discardedSignature = null;
                if (newer) { last = ''; flush(); } else { baseline = comparable(capture()); last = canonical(capture()); status(''); }
            },
            stop() { cancel(); stopped = true; global.removeEventListener('storage',onDiscard); global.removeEventListener('hub:df-draft-discarded',onDiscard); },
            getRecord: () => record };
    }
    function clearVisits() {
        try {
            for (let i = global.sessionStorage.length - 1; i >= 0; i--) {
                const key = global.sessionStorage.key(i);
                if (key?.startsWith('hub:df-visit:')) global.sessionStorage.removeItem(key);
            }
        } catch (_) { /* Fără date de draft în sessionStorage. */ }
    }
    global.addEventListener('hub:before-signout', clearVisits);
    global.HubLocalDrafts = { store, editor, mount, dialog, canUse, canonical, clone, clearVisits, markVisit, dismiss: () => activeDialog?.(null) };
})(window);
