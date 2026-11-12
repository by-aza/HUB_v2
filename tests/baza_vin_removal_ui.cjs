/* Retragere Bază VIN: pagini reale în Chrome local, profiluri și transport simulate; fără SQL. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
let count = 0;
const check = (actual, expected, label) => { assert.deepEqual(actual, expected, label); count++; console.log('PASS ' + label); };

/* Toate cererile și actualizările rămân în memoria contextului de test. */
function mockSdk() {
  const admin = { id: '00000000-0000-4000-8000-000000000001', rol_id: 1, porecla: 'admin-test', permissions: {}, auth_roles: { numire_rol: 'Admin' } };
  const user = { id: '00000000-0000-4000-8000-000000000002', rol_id: 3, nume: 'User', prenume: 'Test', porecla: 'user-test', email: 'test@example.invalid', telefon: '0700000000', permissions: { consumabile: true, lista_masini: true, evidenta_piese: true, baza_vin: true, cheie_istorica: true } };
  window.fixture = { admin, user, writes: [], reads: [], alerts: [] };
  window.lucide = { createIcons() {} };
  window.tailwind = {};
  class Query {
    constructor(table) { this.table = table; this.filters = {}; this.excluded = {}; this.payload = null; this.one = false; }
    select(columns) { this.columns = columns; return this; }
    eq(key, value) { this.filters[key] = value; return this; }
    neq(key, value) { this.excluded[key] = value; return this; }
    single() { this.one = true; return this; }
    maybeSingle() { this.one = true; return this; }
    update(payload) { this.payload = payload; return this; }
    insert(payload) { this.payload = payload; return this; }
    async run() {
      const f = window.fixture;
      if (this.payload) {
        f.writes.push({ table: this.table, payload: structuredClone(this.payload), filters: { ...this.filters } });
        if (this.table === 'auth_profiles') Object.assign(f.user, structuredClone(this.payload));
        return { data: null, error: null };
      }
      f.reads.push(this.table);
      let rows = [];
      if (this.table === 'auth_profiles') rows = this.filters.id ? [this.filters.id === f.admin.id ? f.admin : f.user] : [f.user];
      if (this.table === 'auth_profiles' && this.filters.porecla) rows = this.filters.porecla === f.user.porecla ? [f.user] : [];
      if (this.table === 'auth_roles') rows = [{ id: 1, numire_rol: 'Admin' }, { id: 3, numire_rol: 'Operator' }];
      rows = rows.filter(row => Object.entries(this.excluded).every(([key, value]) => row[key] !== value));
      return { data: this.one ? rows[0] || null : rows, error: null, count: 0 };
    }
    then(resolve, reject) { return this.run().then(resolve, reject); }
  }
  const query = table => new Proxy(new Query(table), { get(target, key, receiver) { return key in target ? Reflect.get(target, key, receiver) : () => receiver; } });
  const client = { from: query, auth: {
    getSession: async () => ({ data: { session: { user: { id: admin.id, email: 'admin@example.invalid' } } }, error: null }),
    getUser: async () => ({ data: { user: { id: admin.id } }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
  }, rpc: async () => ({ data: [], error: null }),
  channel: () => ({ on() { return this; }, subscribe() { return this; }, unsubscribe() {} }), removeChannel() {} };
  window.supabase = { createClient: () => client };
}

(async () => {
  check(fs.existsSync(path.join(root, 'modules/flota/baza-vin.html')), false, 'pagina retrasă lipsește');
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(mockSdk);
    await context.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.hostname !== 'hub.test') return route.fulfill({ body: '', contentType: 'application/javascript' });
      const file = path.resolve(root, '.' + decodeURIComponent(u.pathname));
      assert.ok(file.startsWith(root + path.sep));
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({ status: 404, body: '' });
      const ext = path.extname(file);
      let body = fs.readFileSync(file);
      if (ext === '.html') body = body.toString().replace('</head>', '<style>.hidden{display:none!important}</style></head>');
      await route.fulfill({ body, contentType: ext === '.html' ? 'text/html' : ext === '.css' ? 'text/css' : ext === '.json' ? 'application/json' : 'application/javascript' });
    });
    const p = await context.newPage(), errors = [], alerts = [];
    p.setDefaultTimeout(8000);
    p.on('pageerror', e => { errors.push(e.message); console.error('BROWSER JS:', e.message); });
    p.on('console', message => { if (message.type() === 'error') console.error('BROWSER:', message.text()); });
    p.on('dialog', async d => { alerts.push(d.message()); await d.accept(); });
    await p.goto('https://hub.test/index.html');
    await p.waitForFunction(() => document.querySelectorAll('#serviceGrid a').length > 0);
    check(await p.locator('a[href*="baza-vin"], [data-permission="baza_vin"]').count(), 0, 'dashboard și meniuri fără legături/permisiune VIN');
    for (const url of ['modules/flota/lista_masini.html', 'modules/stocuri/consumabile.html', 'modules/stocuri/evidenta_piese.html']) {
      check(await p.locator(`a[href="${url}"]`).count() >= 2, true, 'card și navigare păstrate: ' + url);
    }
    check(await p.evaluate(() => hasPermission('consumabile')), true, 'Admin păstrează accesul Consumabile');
    await p.evaluate(() => { window.USER_DATA.rol_id = 3; window.USER_DATA.permissions = { flota: true, consumabile: true }; isAdmin = false; renderAll(); applyPermissions(); });
    check(await p.locator('#serviceGrid a[href="modules/flota/lista_masini.html"]').count(), 1, 'fallback-ul flota pentru Lista Mașini este păstrat');
    check(await p.locator('#serviceGrid a[href="modules/stocuri/consumabile.html"]').count(), 1, 'operatorul păstrează accesul Consumabile');
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(() => renderAll());
    check(await p.locator('a[href*="baza-vin"]').count(), 0, 'navigarea mobilă nu reintroduce modulul retras');

    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.goto('https://hub.test/modules/admin/admin.html');
    await p.waitForFunction(() => typeof populateUserForm === 'function');
    await p.locator('#tab-useri').click({ force: true });
    await p.waitForFunction(() => document.querySelectorAll('#rol option').length > 0);
    check(await p.locator('#perm_baza_vin').count(), 0, 'Gestionare Useri fără bifa VIN');
    check(await p.evaluate(() => userPermissionFields.some(([, key]) => key === 'baza_vin') || 'baza_vin' in userPermissionLabels), false, 'maparea și eticheta permisiunii eliminate');
    await p.evaluate(() => {
      userPermissionFields.forEach(([, key], index) => { fixture.user.permissions[key] = index % 2 === 0; });
      fixture.user.permissions.consumabile = true;
      fixture.before = structuredClone(fixture.user.permissions);
      populateUserForm(fixture.user);
    });
    check(await p.locator('#perm_consumabile').isChecked(), true, 'bifa Consumabile rămâne disponibilă și bifată');
    check(await p.evaluate(() => userPermissionFields.every(([id, key]) => document.getElementById(id).checked === fixture.before[key])), true, 'toate celelalte bife sunt încărcate corect');
    await p.evaluate(() => document.getElementById('userForm').requestSubmit());
    await p.waitForFunction(() => fixture.writes.some(w => w.table === 'auth_profiles'));
    check(await p.evaluate(() => fixture.writes.find(w => w.table === 'auth_profiles').payload.permissions), await p.evaluate(() => fixture.before), 'salvarea realului handler păstrează toate permisiunile și cheile istorice');
    check(await p.evaluate(() => fixture.writes.some(w => w.table === 'baza_vin') || fixture.reads.includes('baza_vin')), false, 'nicio citire/scriere a tabelei retrase');
    await p.waitForFunction(() => document.querySelector('#submitBtn').textContent.includes('Crează'));
    check(alerts.some(a => a.includes('Actualizare realizată cu succes')), true, 'Admin confirmă salvarea profilului');
    check(errors, [], 'zero erori JavaScript');
    await context.close();
    console.log(`TOTAL ${count} PASS — Chrome local, transport simulat, fără SQL`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
