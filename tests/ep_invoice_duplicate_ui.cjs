/* Duplicat factură în Chrome local: pagina reală, citiri/salvări simulate, fără Supabase live. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createPage } = require('./ep_df_ux.cjs');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const warning = 'Această factură există deja la furnizorul selectat.';
let count = 0;
const check = (actual, expected, label) => {
  assert.deepEqual(actual, expected, label);
  count++;
  console.log('PASS ' + label);
};

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  try {
    const { page: p, context, errors } = await createPage(browser, 'modules/stocuri/evidenta_piese.html');
    await p.waitForFunction(() => window.HubEpApi && !HubEpApi.stale);
    await p.evaluate(async () => {
      const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
      fixture.snapshot.suppliers.push({ id: id(11), denumire: 'Alt furnizor', revision: 1, activ: true });
      fixture.snapshot.invoices.push({ id: id(20), furnizor_id: id(1), revision: 1, numar: '  MiX   42 ', data_factura: '2026-11-06', status_document: 'În firmă' });
      /* Persistăm exact factura trimisă, păstrând celelalte facturi și linii. */
      const original = supabaseClient.rpc;
      supabaseClient.rpc = async (name, args) => {
        if (name === 'ep_get_defaults') return { data: { tva_proc: 21, coeficient_df: '1.53' }, error: null };
        if (name !== 'ep_save_invoice') return original(name, args);
        fixture.rpcCalls.push({ name, args: structuredClone(args) });
        const op = args.p, s = fixture.snapshot, old = s.invoices.find(i => i.id === op.id);
        const invoice = { ...op, revision: (old?.revision || 0) + 1 };
        delete invoice.lines;
        s.invoices = s.invoices.filter(i => i.id !== op.id).concat(invoice);
        s.lines = s.lines.filter(l => l.factura_id !== op.id).concat(op.lines.map((l, index) => ({ ...l, id: l.id || id(50 + index), factura_id: op.id })));
        return { data: { id: op.id }, error: null };
      };
      await HubEpApi.load();
    });

    const number = p.locator('#invoiceNumber'), supplier = p.locator('#invoiceSupplier');
    const feedback = p.locator('#invoiceNumberDuplicate');
    const state = () => number.evaluate(e => ({ invalid: e.getAttribute('aria-invalid'), styled: e.classList.contains('is-invalid'), customError: e.validity.customError }));
    const writes = () => p.evaluate(() => fixture.rpcCalls.filter(c => c.name === 'ep_save_invoice').length);
    const otherFields = () => p.locator('#invoiceForm input, #invoiceForm select, #invoiceForm textarea').evaluateAll(es =>
      es.filter(e => e.id !== 'invoiceNumber').map(e => [e.id || e.dataset.field, e.value]));
    const valid = { invalid: null, styled: false, customError: false };
    const invalid = { invalid: 'true', styled: true, customError: true };

    await p.locator('#newInvoiceBtn').click();
    check(await feedback.isVisible(), false, 'formularul nou nu afișează avertizare');
    await supplier.selectOption(id(1));
    check(await feedback.isVisible(), false, 'furnizor selectat fără număr: fără duplicat');
    await supplier.selectOption('');
    await number.fill('test-1');
    await number.press('Tab');
    check(await feedback.isVisible(), false, 'număr fără furnizor: fără duplicat');
    await supplier.selectOption(id(1));
    check(await feedback.textContent(), warning, 'mesajul inline exact');
    check(await feedback.isVisible(), true, 'selectarea furnizorului verifică numărul deja introdus');
    check(await state(), invalid, 'duplicatul este invalid vizual, accesibil și nativ');
    check(await p.locator('#invoiceFormError').isVisible(), false, 'fără mesaj de salvare eșuată înainte de submit');
    check(await number.getAttribute('aria-describedby'), 'invoiceNumberDuplicate', 'câmpul este asociat avertizării');

    await number.fill('  TeSt-1  ');
    check(await state(), invalid, 'editarea în aceeași cheie normalizată păstrează starea invalidă');
    await p.locator('#invoiceNotes').fill('Observații de păstrat');
    check(await state(), invalid, 'tastarea în alt câmp nu șterge starea duplicatului');
    await supplier.selectOption(id(11));
    check(await feedback.isVisible(), false, 'același număr la alt furnizor este permis imediat');
    check(await state(), valid, 'schimbarea furnizorului elimină toate marcajele de duplicat');
    await supplier.selectOption(id(1));
    check(await feedback.isVisible(), true, 'revenirea la furnizorul inițial reface avertizarea');
    await supplier.selectOption('');
    check(await feedback.isVisible(), false, 'golirea furnizorului șterge avertizarea');
    await supplier.selectOption(id(1));
    await number.fill('');
    check(await feedback.isVisible(), false, 'golirea numărului șterge imediat avertizarea de duplicat');
    check(await state(), valid, 'golirea numărului șterge customError, fără a înlocui validarea required');

    const line = field => p.locator(`#invoiceLinesBody [data-field="${field}"]`).first();
    await line('name').fill('Piesă de păstrat');
    await line('code').fill('COD-123');
    await line('qty').fill('2');
    await line('price').fill('12.34');
    await line('vat').fill('21');
    await line('markup').fill('1.53');
    const entered = await otherFields();
    const total = await p.locator('#invoiceTotal').textContent();
    const callsBefore = await p.evaluate(() => ({ rpc: fixture.rpcCalls.length, reads: fixture.calls.length }));
    await number.fill('  mix   42  ');
    check(await feedback.isVisible(), false, 'prima verificare la tastare este amânată până la blur');
    await number.press('Tab');
    check(await number.inputValue(), 'MIX 42', 'Tab păstrează normalizarea existentă: trim, spații și majuscule');
    check(await feedback.isVisible(), true, 'Tab detectează și o factură existentă cu număr nenormalizat');
    check(await otherFields(), entered, 'verificarea timpurie păstrează toate celelalte date');
    check(await p.locator('#invoiceTotal').textContent(), total, 'verificarea nu modifică totalurile');
    check(await p.evaluate(() => ({ rpc: fixture.rpcCalls.length, reads: fixture.calls.length })), callsBefore, 'verificarea folosește registrul existent, fără citiri sau scrieri noi');
    check(await p.locator('#invoiceFormError').isVisible(), false, 'blur-ul duplicatului nu afirmă că salvarea a eșuat');

    await number.fill('CORECTAT-1');
    check(await number.evaluate(e => document.activeElement === e), true, 'corectarea este verificată înainte de pierderea focusului');
    check(await feedback.isVisible(), false, 'numărul corectat șterge imediat avertizarea');
    check(await state(), valid, 'numărul corectat este valid');
    await number.fill('test-1');
    await p.locator('#invoiceNotes').click();
    check(await feedback.isVisible(), true, 'click pe alt câmp detectează duplicatul');
    await p.setViewportSize({ width: 390, height: 844 });
    check(await feedback.evaluate(e => { const a = e.getBoundingClientRect(), b = document.querySelector('#invoiceNumber').getBoundingClientRect(); return a.top >= b.bottom && a.right <= innerWidth; }), true, 'mobil: avertizarea este sub număr și încape în formular');
    await p.setViewportSize({ width: 1440, height: 1000 });

    /* Submit fără blur/input: protecția de la salvare rămâne independentă de avertizarea timpurie. */
    await number.fill('CORECTAT-2');
    await p.evaluate(() => { document.querySelector('#invoiceNumber').value = '  mix   42 '; document.querySelector('#invoiceForm').requestSubmit(); });
    check(await writes(), 0, 'validarea de la salvare blochează duplicatul chiar fără blur');
    check(await feedback.isVisible(), true, 'submit afișează și avertizarea inline');
    check(await p.locator('#invoiceFormError').textContent().then(t => t.includes('Factura nu a fost salvată') && t.includes('Factura MIX 42 există deja pentru Furnizor test.')), true, 'după încercarea de salvare se păstrează mesajul existent');
    check(await otherFields(), entered, 'încercarea de salvare blocată păstrează datele');

    await number.fill('test-1');
    await supplier.selectOption(id(11));
    check(await feedback.isVisible(), false, 'corectarea prin furnizor permite salvarea aceluiași număr');
    await p.locator('#invoiceSave').click();
    await p.waitForFunction(() => document.querySelector('#invoiceModal').hidden);
    check(await writes(), 1, 'factura nouă se salvează după corectare');
    check(await p.evaluate(() => { const d = fixture.rpcCalls.find(c => c.name === 'ep_save_invoice').args.p; return [d.furnizor_id, d.numar, d.observatii, d.lines[0].cod_piesa, d.lines[0].cantitate, d.lines[0].pret_achizitie_net]; }),
      [id(11), 'TEST-1', 'Observații de păstrat', 'COD-123', 2, '12.34'], 'payload-ul păstrează datele și permite același număr la furnizori diferiți');

    await p.locator(`[data-select-id="${id(2)}"]`).first().click({ force: true });
    await p.locator('[data-action="edit-invoice"]').click();
    await number.focus(); await number.press('Tab');
    check(await state(), valid, 'editare: factura curentă este exclusă');
    await number.fill('  test-1 '); await number.press('Tab');
    check(await feedback.isVisible(), false, 'editare: normalizarea propriului număr nu creează duplicat');
    const editingFields = await otherFields();
    await number.fill('mix 42'); await number.press('Tab');
    check(await feedback.isVisible(), true, 'editare: altă factură la același furnizor este detectată');
    await p.locator('#invoiceSave').click();
    check(await writes(), 1, 'editare: salvarea unui număr al altei facturi este blocată');
    check(await p.locator('#invoiceModal').isVisible(), true, 'editare: factura rămâne deschisă după refuzul duplicatului');
    await number.fill('TEST-1');
    check(await state(), valid, 'editare: revenirea la propriul număr șterge imediat avertizarea');
    await supplier.selectOption(id(11));
    check(await feedback.isVisible(), true, 'editare: schimbarea furnizorului detectează cealaltă factură TEST-1');
    await supplier.selectOption(id(1));
    check(await state(), valid, 'editare: revenirea la furnizor exclude din nou factura curentă');
    check(await otherFields(), editingFields, 'editarea și schimbările de furnizor păstrează datele');
    await p.locator('#invoiceSave').click();
    await p.waitForFunction(() => document.querySelector('#invoiceModal').hidden);
    check(await writes(), 2, 'factura existentă se salvează fără să se considere duplicat');
    check(await p.evaluate(() => fixture.rpcCalls.filter(c => c.name === 'ep_save_invoice')[1].args.p.id), id(2), 'editarea păstrează ID-ul facturii');

    await p.locator('#newInvoiceBtn').click();
    await supplier.selectOption(id(1)); await number.fill('TEST-1'); await number.press('Tab');
    check(await feedback.isVisible(), true, 'formular nou după editare: ID-ul exclus a fost resetat');
    await p.locator('#invoiceCancel').click();
    await p.locator('#newInvoiceBtn').click();
    check(await feedback.isVisible(), false, 'redeschiderea nu păstrează avertizarea veche');
    check(await state(), valid, 'redeschiderea elimină și validitatea personalizată veche');
    await p.locator('#invoiceSave').click();
    check(await p.locator('#invoiceFormError').textContent().then(t => t.includes('Selectează furnizorul.') && t.includes('Introdu numărul facturii.') && t.includes('denumirea piesei este obligatorie')), true, 'validările obligatorii existente rămân active');
    check(await writes(), 2, 'formularul incomplet nu trimite salvare');
    await supplier.selectOption(id(1));
    await number.fill('TEST-1'); await number.press('Tab');
    check(await feedback.isVisible(), true, 'factură nouă: duplicatul este detectat înainte de corectarea numărului');
    await number.fill('NUMAR-CORECTAT');
    check(await state(), valid, 'factură nouă: numărul unic corectat este valid imediat');
    await line('name').fill('Piesă nouă'); await line('price').fill('25');
    await p.locator('#invoiceSave').click();
    await p.waitForFunction(() => document.querySelector('#invoiceModal').hidden);
    check(await writes(), 3, 'factura nouă se salvează și după corectarea exclusivă a numărului');
    check(await p.evaluate(() => { const d = fixture.rpcCalls.filter(c => c.name === 'ep_save_invoice')[2].args.p; return [d.furnizor_id, d.numar]; }),
      [id(1), 'NUMAR-CORECTAT'], 'salvarea numărului corectat păstrează furnizorul inițial');
    check(errors, [], 'zero erori JavaScript');
    await context.close();
    console.log(`TOTAL ${count} PASS — Chrome local, Supabase simulat`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
