/* Istoric EP în Chrome local: pagina reală, profiluri/transport simulate, fără Supabase live. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createPage } = require('./ep_df_ux.cjs');
let count = 0;
const check = (actual, expected, label) => { assert.deepEqual(actual, expected, label); count++; console.log('PASS ' + label); };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  try {
    const { page: p, context, errors } = await createPage(browser, 'modules/stocuri/evidenta_piese.html');
    await p.waitForFunction(() => window.HubEpApi && !HubEpApi.stale);
    await p.evaluate(async () => {
      const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
      const original = supabaseClient.from;
      fixture.authorCalls = [];
      /* Profilul conectat (99) este diferit de fiecare autor al activităților istorice. */
      fixture.profiles = [{ id: id(81), nume: 'Autor', prenume: 'Factură', porecla: 'aza' },
        { id: id(82), nume: 'Autor', prenume: 'Alocare', porecla: ' alex ' },
        { id: id(83), nume: 'Autor', prenume: 'Retur', porecla: 'roxy' },
        { id: id(84), nume: 'Autor', prenume: 'Magazie', porecla: 'magazie' },
        { id: id(85), nume: 'Autor', prenume: 'Anulare', porecla: 'anulare' },
        { id: id(86), nume: 'Autor', prenume: 'DF', porecla: 'df' },
        { id: id(99), nume: 'Utilizator', prenume: 'Curent', porecla: 'curent' }];
      supabaseClient.from = table => ({ select: columns => {
        if (table !== 'auth_profiles' || columns !== 'id,porecla') return original(table).select(columns);
        return { in: async (column, ids) => {
          fixture.authorCalls.push({ columns, column, ids });
          if (fixture.profileFailure === 'throw') throw new Error('offline');
          return { data: fixture.profileFailure ? null : fixture.profiles.filter(p => ids.includes(p.id)),
            error: fixture.profileFailure ? { code: '42501' } : null };
        } };
      } });
      const s = fixture.snapshot, line = s.lines[0].id;
      Object.assign(s.invoices[0], { created_by: id(81), created_at: '2026-11-07T00:10:01+02:00' });
      s.allocations = [{ id: id(5), linie_id: line, nr_inmatriculare_original: 'CT44ELD', cantitate: 4,
        created_by: id(82), created_at: '2026-11-06T22:20:02Z' },
      { id: id(6), linie_id: line, nr_inmatriculare_original: 'B400CIR', cantitate: 0, cantitate_eliberata: 1 }];
      s.returns = [{ id: id(7), linie_id: line, cantitate: 1, data_retur: '2026-11-06',
        created_by: id(83), created_at: '2026-11-06T23:10:03Z' }];
      s.transfers = [{ id: id(8), linie_id: line, cantitate: 1, data_trimitere: '2026-11-06',
        created_by: id(84), created_at: '2026-11-06T22:30:04Z',
        anulat_de: id(85), anulat_at: '2026-11-06T22:40:05Z' }];
      s.imports = [{ id: id(9), df_id: 7, part_id: line, allocation_id: id(5), qty: 1,
        created_by: id(86), snapshot: { plate: 'CT44ELD', unit_price: '18.513', imported_at: '2026-11-06T22:50:06Z' } }];
      await HubEpApi.load();
    });
    const part = '00000000-0000-4000-8000-000000000003';
    await p.locator(`[data-select-id="${part}"]`).first().click({ force: true });
    const timeline = () => p.locator('.ep-timeline-item').evaluateAll(items => items.map(e => ({
      title: e.querySelector('strong').textContent, date: e.querySelector('time').getAttribute('datetime'),
      time: e.querySelector('time').textContent, author: e.querySelector('small').textContent
    })));
    let events = await timeline();
    check(events.map(e => e.date), ['2026-11-06T23:10:03Z', '2026-11-06T22:50:06Z', '2026-11-06T22:40:05Z',
      '2026-11-06T22:30:04Z', '2026-11-06T22:20:02Z', '2026-11-07T00:10:01+02:00', null],
    'ordinea folosește timestamp-ul real, inclusiv fusul orar și secundele');
    check(events.map(e => e.author), ['roxy', 'df', 'anulare', 'magazie', 'alex', 'aza', 'Autor necunoscut'],
      'fiecare acțiune folosește porecla propriului autor, inclusiv anularea; spațiile sunt eliminate');
    check(events[5].title, 'Factură înregistrată · TEST-1', 'metadatele facturii nu pretind crearea unei linii');
    check(events.filter(e => e.title === 'Alocare înregistrată').length, 2, 'alocarea arhivată la zero rămâne în istoric');
    check(events[6].time, 'Data necunoscută', 'datele vechi fără timestamp folosesc fallback neutru');
    check(events[0].time, await p.evaluate(() => new Date('2026-11-06T23:10:03Z').toLocaleString('ro-RO')), 'ora afișată este cea înregistrată');
    check(events.some(e => /Autor (Factură|Alocare|Retur|Magazie|Anulare|DF)/.test(e.author)), false, 'numele și prenumele nu sunt folosite în locul poreclei');
    check(await p.locator('.ep-warehouse-record').textContent().then(t => t.includes('magazie') && t.includes('anulare')), true, 'dosarul magaziei păstrează poreclele ambilor autori');
    check(await p.evaluate(() => fixture.authorCalls.every(c => c.columns === 'id,porecla' && c.column === 'id' && !c.ids.includes(HubEpApi.profile.id))), true, 'citirea cere numai id/porecla pentru UUID-urile înregistrate');
    check(await p.evaluate(() => fixture.rpcCalls.every(c => c.name === 'ep_load_registry')), true, 'afișarea istoricului nu apelează RPC-uri de scriere');
    check(events.some(e => e.author === 'curent' || e.author === 'Utilizator Curent'), false, 'nicio acțiune veche nu este atribuită sesiunii curente');
    check(/Andrei Popescu|Cristina Neagu|Mihai Ionescu|așteaptă atribuirea/.test(JSON.stringify(events)), false, 'fără autori DEMO sau eveniment datat artificial pentru disponibil');
    await p.evaluate(async () => { fixture.role = 3; await HubEpApi.load(); });
    check((await timeline()).map(e => e.author), events.map(e => e.author), 'operatorul cu permisiune EP vede aceiași autori prin accesul existent');

    /* Porecla lipsă nu este înlocuită cu numele complet sau porecla utilizatorului conectat. */
    await p.evaluate(async () => {
      fixture.savedProfiles = structuredClone(fixture.profiles);
      const missing = [undefined, null, '', '   ', null, ''];
      fixture.profiles.slice(0, 6).forEach((profile, index) => { profile.porecla = missing[index]; });
      await HubEpApi.load();
    });
    check((await timeline()).every(e => e.author === 'Autor necunoscut'), true, 'porecla absentă, nulă, goală sau cu spații folosește fallback neutru, chiar dacă există numele complet');
    check((await timeline()).map(e => ({ title: e.title, date: e.date, time: e.time })),
      events.map(e => ({ title: e.title, date: e.date, time: e.time })), 'schimbarea poreclelor păstrează evenimentele și timestamp-urile');
    await p.evaluate(async () => {
      fixture.profiles = structuredClone(fixture.savedProfiles);
      fixture.profiles[1].porecla = 'alex <script>alert(1)</script>';
      await HubEpApi.load();
    });
    check((await timeline())[4].author, 'alex <script>alert(1)</script>', 'porecla este afișată ca text literal');
    check(await p.locator('.ep-timeline-item small script').count(), 0, 'porecla este escapată HTML');

    /* Loader vechi, profil șters/refuzat, timestamp invalid: păstrăm restul registrului. */
    await p.evaluate(async () => {
      const s = fixture.snapshot;
      delete s.imports[0].created_by;
      s.imports[0].snapshot.imported_at = null;
      s.invoices[0].created_at = '2026-02-30T09:15:00Z';
      s.transfers[0].created_at = '2026-11-06';
      s.lines[0].blocaj_istoric = 'DF-LEGACY';
      fixture.profiles = [];
      await HubEpApi.load();
    });
    events = await timeline();
    check(events.every(e => e.author === 'Autor necunoscut'), true, 'profilurile indisponibile nu folosesc sesiunea curentă');
    check(events.find(e => e.title.startsWith('DF-007')).time, 'Data necunoscută', 'importul fără timestamp nu inventează o oră');
    check(events.find(e => e.title.startsWith('Referință istorică')).date, null, 'referința legacy rămâne vizibilă fără data facturii ca substitut');
    check(events.find(e => e.title.startsWith('Factură înregistrată')).time, 'Data necunoscută', 'timestamp-ul cu zi invalidă este refuzat');
    check(events.find(e => e.title.startsWith('Trimis în magazie')).time, 'Data necunoscută', 'o dată simplă nu devine miezul nopții');
    for (const failure of ['denied', 'throw']) {
      await p.evaluate(async mode => { fixture.profileFailure = mode; await HubEpApi.load(); }, failure);
      check(await p.evaluate(() => HubEpApi.stale), false, `registrul rămâne disponibil la ${failure} pentru profiluri`);
    }
    await p.locator('[data-tab="returns"]').click();
    await p.locator('[data-select-id="00000000-0000-4000-8000-000000000007"]').first().click({ force: true });
    check(await p.locator('#detailsBody time[datetime="2026-11-06T23:10:03Z"]').count(), 2, 'detaliul returului folosește ora înregistrării, independent de data returului');
    check(await p.locator('#detailsBody').textContent().then(t => t.includes('06.11.2026') && t.includes('Autor necunoscut')), true, 'data comercială și fallback-ul autorului rămân în dosarul returului');
    const refused = await p.evaluate(async () => {
      const lookups = fixture.authorCalls.length;
      fixture.permissions.evidenta_piese = false;
      let denied = false;
      try { await HubEpApi.load(); } catch (error) { denied = error.message.includes('Acces refuzat'); }
      return { denied, profile: HubEpApi.profile, extraLookups: fixture.authorCalls.length - lookups };
    });
    check(refused, { denied: true, profile: null, extraLookups: 0 }, 'fără permisiune EP: acces refuzat înainte de citirea autorilor');
    check(errors, [], 'istoricul nu produce erori JavaScript');
    await context.close();
    console.log(`TOTAL ${count} PASS — Chrome local, Supabase simulat`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
