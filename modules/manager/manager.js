/* Căutare HUB comună: sursele și regulile din index sunt folosite și de Manager. */
const HubGlobalSearch = (() => {
  const fallbacks = {
    deviz_estimativ: 'devize',
    deviz_final: 'devize',
    avansuri: 'devize',
    lista_masini: 'flota',
    awb: 'magazie',
    consumabile: 'magazie',
    detailing: 'constatari'
  };
  function hasPermission(profile, key) {
    const role = Number(profile?.rol_id),
      permissions = profile?.permissions || {};
    if (role === 1 || role === 2 && ['manager_dashboard', 'plati'].includes(key)) return true;
    if (Object.prototype.hasOwnProperty.call(permissions, key)) return permissions[key] === true;
    return Boolean(fallbacks[key] && permissions[fallbacks[key]] === true);
  }
  const quote = value => '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  const compactRegistration = value => String(value ?? '').toUpperCase().replace(/[\s-]/g, '');
  function buildOrClause(fields, pattern, compactPattern, compactFields = []) {
    const parts = fields.map(field => `${field}.ilike.${quote(pattern)}`);
    if (compactPattern && compactPattern !== pattern) compactFields.forEach(field => parts.push(`${field}.ilike.${quote(compactPattern)}`));
    return parts.join(',');
  }
  function parseDevizFinalQuery(value) {
    const digits = String(value || '').replace(/\D/g, '');
    const n = Number(digits);
    return digits && Number.isSafeInteger(n) && n > 0 ? n : null;
  }
  function formatDevizFinalId(value) {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? 'DF-' + String(n).padStart(3, '0') : null;
  }
  const unique = values => [...new Set(values.filter(v => v !== null && v !== undefined && String(v).trim()).map(String))];
  const ids = rows => unique(rows.map(r => r.id)).filter(v => /^\d+$/.test(v));
  const details = values => unique(values).join(' · ') || '—';
  const item = (label, detail, url) => ({
    label,
    detail,
    url
  });
  function linked(clause, field, values) {
    return values.length ? clause + `,${field}.in.(${unique(values).map(quote).join(',')})` : clause;
  }
  function create({
    client,
    hasPermission: can
  }) {
    let active = null,
      cached = null,
      version = 0;
    function reset() {
      version++;
      active?.controller.abort();
      active = null;
      cached = null;
    }
    async function search(query) {
      const q = String(query || '').trim(),
        safe = q.replace(/[%_*,]/g, '').trim();
      if (!safe) {
        reset();
        return [];
      }
      const keys = ['clienti_notificari', 'constatari', 'detailing', 'deviz_estimativ', 'deviz_final', 'avansuri', 'lista_masini', 'consumabile', 'awb', 'comenzi_piese_sh', 'plati'];
      const permissions = Object.fromEntries(keys.map(key => [key, can(key)]));
      const key = q + '|' + keys.map(k => Number(permissions[k])).join('');
      if (active?.key === key) return active.promise;
      if (cached?.key === key) {
        if (active) cancelPending();
        return cached.groups;
      }
      active?.controller.abort();
      const controller = new AbortController(),
        token = ++version;
      const timeout = setTimeout(() => controller.abort(), 10000),
        pattern = `%${safe}%`,
        compact = `%${compactRegistration(safe)}%`;
      const or = (fields, compactFields = []) => buildOrClause(fields, pattern, compact, compactFields);
      const read = async (table, columns, clause) => {
        if (controller.signal.aborted) return {
          rows: [],
          error: true
        };
        try {
          const {
            data,
            error
          } = await client.from(table).select(columns).or(clause).limit(8).abortSignal(controller.signal);
          if (error || !Array.isArray(data)) return {
            rows: [],
            error: true
          };
          return {
            rows: data,
            error: false
          };
        } catch (error) {
          return {
            rows: [],
            error: true
          };
        }
      };
      const icons = {
        'Clienți & Notificări': 'users',
        'Vehicule clienți': 'car',
        'Constatări': 'clipboard-list',
        'Detailing': 'sparkles',
        'Devize estimative': 'file-text',
        'Devize finale': 'receipt-text',
        'Avansuri': 'banknote',
        'Flotă Auto': 'car',
        'Stoc Consumabile': 'boxes',
        'AWB': 'truck',
        'Comenzi piese SH': 'shopping-cart',
        'Cereri de plată': 'credit-card'
      };
      const group = (title, result, map) => ({
        title,
        icon: icons[title],
        items: result.rows.map(row => ({
          ...map(row),
          icon: icons[title]
        })),
        error: result.error
      });
      const clientTask = permissions.clienti_notificari ? read('clienti', 'id,cod_client,nume', or(['nume', 'cod_client'])) : Promise.resolve({
        rows: [],
        error: false
      });
      /* Relațiile client → vehicul sunt citite o singură dată pentru toate categoriile. */
      const vehicleTask = permissions.clienti_notificari ? clientTask.then(clients => read('clienti_vehicule', 'id,client_id,nr_inmatriculare,marca_model,serie_vin', linked(or(['nr_inmatriculare', 'marca_model', 'serie_vin'], ['nr_inmatriculare', 'serie_vin']), 'client_id', ids(clients.rows)))) : Promise.resolve({
        rows: [],
        error: false
      });
      const links = Promise.all([clientTask, vehicleTask]).then(([clients, vehicles]) => ({
        clientIds: ids(clients.rows),
        vehicleIds: ids(vehicles.rows),
        plates: unique(vehicles.rows.map(r => r.nr_inmatriculare)),
        names: unique(clients.rows.map(r => r.nume))
      }));
      const tasks = [];
      if (permissions.clienti_notificari) {
        tasks.push(clientTask.then(r => group('Clienți & Notificări', r, c => item(c.nume || c.cod_client || 'Client', details([c.cod_client, 'Clienți & Notificări']), '/modules/devize/clienti-notificari.html'))));
        tasks.push(vehicleTask.then(r => group('Vehicule clienți', r, v => item(v.nr_inmatriculare || v.marca_model || 'Vehicul', details([v.marca_model, v.serie_vin, 'Clienți & Notificări']), '/modules/devize/clienti-notificari.html'))));
      }
      if (permissions.constatari) tasks.push(links.then(async l => group('Constatări', await read('constatari', 'id,nr_inmatriculare,model_masina,status,client', linked(linked(or(['nr_inmatriculare', 'model_masina', 'client'], ['nr_inmatriculare']), 'client_id', l.clientIds), 'vehicle_id', l.vehicleIds)), r => item(r.nr_inmatriculare || r.model_masina || 'Constatare', details([r.client, r.model_masina, r.status]), '/modules/formulare/constatari_v2.html?constatare_id=' + encodeURIComponent(r.id)))));
      if (permissions.detailing) tasks.push(links.then(async l => group('Detailing', await read('detailing', 'id,nr_inmatriculare,autovehicul,pachet,status,telefon', linked(or(['nr_inmatriculare', 'autovehicul', 'pachet', 'telefon'], ['nr_inmatriculare']), 'nr_inmatriculare', l.plates)), r => item(r.nr_inmatriculare || r.autovehicul || 'Fișă detailing', details([r.autovehicul, r.pachet, r.status]), '/modules/formulare/detailing.html'))));
      if (permissions.deviz_estimativ) tasks.push(links.then(async l => group('Devize estimative', await read('devize', 'id_deviz,autovehicul,nr_inmatriculare', linked(or(['id_deviz', 'autovehicul', 'nr_inmatriculare'], ['nr_inmatriculare']), 'nr_inmatriculare', l.plates)), r => item(r.nr_inmatriculare || r.id_deviz || 'Deviz estimativ', details([r.id_deviz, r.autovehicul]), '/modules/devize/deviz.html?id=' + encodeURIComponent(r.id_deviz || '')))));
      if (permissions.deviz_final) tasks.push(links.then(async l => {
        let clause = linked(or(['nr_inmatriculare', 'auto', 'client', 'serie_vin'], ['nr_inmatriculare', 'serie_vin']), 'vehicle_id', l.vehicleIds);
        const id = parseDevizFinalQuery(safe);
        if (id !== null) clause += `,id_deviz_final.eq.${id}`;
        return group('Devize finale', await read('deviz_final_header', 'id_deviz_final,data_deviz,client,auto,nr_inmatriculare,serie_vin,total_manopera,total_piese', clause), r => {
          const value = Number(r.total_manopera || 0) + Number(r.total_piese || 0);
          return item(r.nr_inmatriculare || formatDevizFinalId(r.id_deviz_final) || 'Deviz final', details([formatDevizFinalId(r.id_deviz_final), r.auto, r.client, r.data_deviz, Number.isFinite(value) ? 'Valoare deviz: ' + value.toLocaleString('ro-RO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }) + ' lei' : 'Valoare indisponibilă']), '/modules/devize/deviz_final.html?id=' + encodeURIComponent(r.id_deviz_final));
        });
      }));
      if (permissions.avansuri) tasks.push(links.then(async l => group('Avansuri', await read('evidente_avansuri', 'id,model_masina,nr_inmatriculare,detalii_avans', linked(or(['model_masina', 'nr_inmatriculare', 'detalii_avans'], ['nr_inmatriculare']), 'vehicle_id', l.vehicleIds)), r => item(r.nr_inmatriculare || r.model_masina || 'Avans', details([r.model_masina, r.detalii_avans]), '/modules/devize/avans.html'))));
      if (permissions.lista_masini) tasks.push(read('flota_auto', 'id,nr_inmatriculare,vin,marca', or(['nr_inmatriculare', 'vin', 'marca'], ['nr_inmatriculare', 'vin'])).then(r => group('Flotă Auto', r, v => item(v.nr_inmatriculare || v.marca || 'Mașină', details([v.marca, v.vin]), '/modules/flota/lista_masini.html'))));
      if (permissions.consumabile) tasks.push(read('stoc_view_curent', 'id,cod_articol,denumire', or(['denumire', 'cod_articol'])).then(r => group('Stoc Consumabile', r, v => item(v.denumire || v.cod_articol || 'Produs', details([v.cod_articol, 'Consumabile']), '/modules/stocuri/consumabile.html'))));
      if (permissions.awb) tasks.push(links.then(async l => group('AWB', await read('evidenta_awb', 'id,nr_awb,nume_client,piesa,curier,stare', linked(or(['nr_awb', 'nume_client', 'piesa', 'curier']), 'nume_client', l.names)), r => item(r.nr_awb || r.nume_client || 'AWB', details([r.nume_client, r.piesa, r.curier, r.stare]), '/modules/formulare/evidenta-awb.html'))));
      if (permissions.comenzi_piese_sh) tasks.push(links.then(async l => group('Comenzi piese SH', await read('comenzi_piese_sh', 'id,denumire_piesa,cod_piesa,nr_inmatriculare,status', linked(or(['denumire_piesa', 'cod_piesa', 'nr_inmatriculare'], ['nr_inmatriculare']), 'nr_inmatriculare', l.plates)), r => item(r.denumire_piesa || r.cod_piesa || 'Comandă SH', details([r.cod_piesa, r.nr_inmatriculare, r.status]), '/modules/devize/comenzi_piese_sh.html'))));
      if (permissions.plati) tasks.push(read('plati_manager', 'id,beneficiar,iban,motiv,status', or(['beneficiar', 'iban', 'motiv'])).then(r => group('Cereri de plată', r, v => item(v.beneficiar || 'Cerere de plată', details([v.motiv, v.status]), '/modules/devize/plati.html'))));
      const promise = Promise.all(tasks).then(groups => {
        if (token !== version) return [];
        if (!controller.signal.aborted && !groups.some(g => g.error)) cached = {
          key,
          groups
        };
        return groups;
      }).finally(() => {
        clearTimeout(timeout);
        if (active?.token === token) active = null;
      });
      active = {
        key,
        term: q,
        promise,
        controller,
        token
      };
      return promise;
    }
    function cancelPending() {
      version++;
      active?.controller.abort();
      active = null;
    }
    function cancelDifferent(q) {
      if (active && active.term !== String(q).trim()) cancelPending();
    }
    return {
      search,
      reset,
      cancelPending,
      cancelDifferent
    };
  }
  return {
    create,
    hasPermission,
    buildOrClause,
    compactRegistration,
    parseDevizFinalQuery,
    formatDevizFinalId
  };
})();
if (typeof window !== 'undefined') window.HubGlobalSearch = HubGlobalSearch;

/* Manager: încărcare, calcule calendaristice și randare compactă. */
(function () {
  'use strict';

  if (typeof document !== 'undefined' && document.currentScript?.hasAttribute('data-hub-search-only')) return;
  const ZONE = 'Europe/Bucharest';
  const PAGE_SIZE = 500;
  const MAX_ROWS = 5000;
  const OPEN_SERVICE = ['In lucru', 'Asteptare piese'];
  const OPEN_DETAILING = ['Programari', 'Programat', 'În așteptare', 'In lucru'];
  const OPEN_ORDERS = ['comandata', 'in_tranzit', 'ajunsa', 'nepotrivita'];
  const TITLES = {
    devize: 'Devize finale',
    advances: 'Avansuri',
    service: 'Constatări',
    detailing: 'Detailing',
    awb: 'AWB',
    stock: 'Stoc',
    orders: 'Comenzi SH',
    payments: 'Plăți manager',
    waiting: 'Intervale așteptare piese',
    generator: 'Generator'
  };
  const PATHS = {
    service: '/modules/formulare/constatari_v2.html',
    detailing: '/modules/formulare/detailing.html',
    awb: '/modules/formulare/evidenta-awb.html',
    stock: '/modules/stocuri/consumabile.html',
    orders: '/modules/devize/comenzi_piese_sh.html',
    payments: '/modules/devize/plati.html'
  };
  const dayFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const moneyFormatter = new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  /* Calendarul este explicit românesc, independent de fusul dispozitivului. */
  function dayKey(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (!value || !Number.isFinite(date.getTime())) return null;
    const parts = Object.fromEntries(dayFormatter.formatToParts(date).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function validDay(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
  }
  function shiftMonth(month, delta) {
    const [year, m] = month.split('-').map(Number);
    return new Date(Date.UTC(year, m - 1 + delta, 1)).toISOString().slice(0, 7);
  }
  function addDay(key, amount) {
    const date = new Date(`${key}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }
  function daysInMonth(month) {
    return Number(addDay(`${shiftMonth(month, 1)}-01`, -1).slice(-2));
  }
  function monthName(month) {
    return new Intl.DateTimeFormat('ro-RO', {
      month: 'long',
      year: 'numeric',
      timeZone: ZONE
    }).format(new Date(`${month}-15T12:00:00Z`));
  }
  /* Miezul nopții local se convertește corect inclusiv la schimbarea orei. */
  function midnightIso(key) {
    const target = Date.parse(`${key}T00:00:00Z`);
    let instant = target;
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    });
    for (let i = 0; i < 3; i++) {
      const p = Object.fromEntries(fmt.formatToParts(new Date(instant)).map(x => [x.type, x.value]));
      const wall = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
      instant += target - wall;
    }
    return new Date(instant).toISOString();
  }
  function calendar(now = new Date()) {
    const today = dayKey(now),
      current = today.slice(0, 7);
    return {
      today,
      current,
      end: addDay(today, 1),
      start: `${shiftMonth(current, -5)}-01`,
      months: Array.from({
        length: 6
      }, (_, i) => shiftMonth(current, i - 5))
    };
  }
  function period(month, cal) {
    const current = month === cal.current;
    const previous = shiftMonth(month, -1);
    const end = current ? cal.end : `${shiftMonth(month, 1)}-01`;
    const comparedDays = current ? Math.min(Number(cal.today.slice(-2)), daysInMonth(previous)) : daysInMonth(previous);
    const previousEnd = addDay(`${previous}-01`, comparedDays);
    return {
      start: `${month}-01`,
      end,
      previousStart: `${previous}-01`,
      previousEnd,
      current,
      comparedDays
    };
  }
  function inside(key, start, end) {
    return Boolean(key && key >= start && key < end);
  }
  function numeric(value) {
    if (value === null || value === undefined || value === '' || !['number', 'string'].includes(typeof value) || !Number.isFinite(Number(value))) throw new Error('Valoare numerică lipsă sau nevalidă.');
    return Number(value);
  }
  function sum(rows, field) {
    return rows.reduce((total, r) => total + numeric(r[field]), 0);
  }
  function delta(current, previous) {
    return previous > 0 ? (current - previous) / previous * 100 : null;
  }
  function allowed(profile) {
    return Boolean(profile && ([1, 2].includes(Number(profile.rol_id)) || profile.permissions?.manager_dashboard === true));
  }
  function moduleAllowed(profile, key) {
    return Number(profile.rol_id) === 1 || profile.permissions?.[key] === true;
  }
  function normalize(source, rows) {
    return rows.map(row => {
      const r = {
        ...row
      };
      if (source === 'devize') {
        if (!validDay(r.data_deviz)) throw new Error('Data devizului nu este ISO validă.');
        r.gross = Number(r.total_manopera || 0) + Number(r.total_piese || 0);
        r.total_manopera = Number(r.total_manopera || 0);
        r.total_piese = Number(r.total_piese || 0);
        if (!Number.isFinite(r.gross)) throw new Error('Valoarea devizului este nevalidă.');
      }
      if (source === 'advances') {
        numeric(r.suma);
        if (!dayKey(r.data_platii)) throw new Error('Data plății lipsește sau este nevalidă.');
      }
      if (source === 'payments') numeric(r.suma);
      if (source === 'stock') r.stockIssue = stockIssue(r);
      if (source === 'service' && !dayKey(r.created_at)) throw new Error('Data constatării este nevalidă.');
      return r;
    });
  }

  /* Planul folosește doar SELECT; sursele sunt filtrate și coloanele restrânse. */
  function plans(cal) {
    const start = midnightIso(cal.start),
      end = midnightIso(cal.end);
    const notArchived = q => q.or('is_archived.is.null,is_archived.eq.false');
    return {
      devize: {
        table: 'deviz_final_header',
        columns: 'id_deviz_final,data_deviz,total_manopera,total_piese',
        order: 'id_deviz_final',
        filter: q => q.gte('data_deviz', cal.start).lt('data_deviz', cal.end)
      },
      advances: {
        table: 'evidente_avansuri_plati',
        columns: 'id,avans_id,suma,metoda_plata,data_platii',
        order: 'id',
        filter: q => q.gte('data_platii', start).lt('data_platii', end)
      },
      service: {
        table: 'constatari',
        columns: 'id,nr_inmatriculare,created_at,data_finalizarii,status,este_urgent',
        order: 'id',
        filter: q => q.or(`and(created_at.gte.${start},created_at.lt.${end}),and(data_finalizarii.gte.${start},data_finalizarii.lt.${end}),status.in.("In lucru","Asteptare piese")`)
      },
      detailing: {
        table: 'detailing',
        columns: 'id,nr_inmatriculare,autovehicul,pachet,pret_estimat,status,data_programare,data_finalizarii',
        order: 'id',
        permission: 'detailing',
        filter: q => q.or(`and(data_finalizarii.gte.${start},data_finalizarii.lt.${end}),and(data_programare.gte.${start},data_programare.lt.${end}),status.in.("Programari","Programat","În așteptare","In lucru")`)
      },
      awb: {
        table: 'evidenta_awb',
        columns: 'id,nr_awb,nume_client,piesa,curier,pret,stare,data_crearii,data_livrare,data_retur',
        order: 'id',
        filter: q => notArchived(q).or(`and(data_crearii.gte.${start},data_crearii.lt.${end}),and(data_livrare.gte.${start},data_livrare.lt.${end}),and(data_retur.gte.${start},data_retur.lt.${end}),stare.eq.in_tranzit`)
      },
      stock: {
        table: 'stoc_view_curent',
        columns: 'id,denumire,stoc_actual,prag_minim',
        order: 'id',
        filter: q => q.eq('activ', true)
      },
      orders: {
        table: 'comenzi_piese_sh',
        columns: 'id,status',
        order: 'id',
        permission: 'comenzi_piese_sh',
        filter: q => notArchived(q).in('status', OPEN_ORDERS)
      },
      payments: {
        table: 'plati_manager',
        columns: 'id,beneficiar,iban,suma,motiv,status,data_crearii,data_platii,platit_de',
        order: 'id',
        filter: q => q.or(`status.eq.neplatit,and(status.eq.platit,data_platii.gte.${start},data_platii.lt.${end})`)
      },
      waiting: {
        table: 'constatari_asteptare_piese',
        columns: 'id,constatare_id,inceput,sfarsit',
        order: 'id',
        filter: q => q.is('sfarsit', null)
      },
      generator: {
        table: 'generator_logs',
        columns: 'id,ora_start,ora_stop,litri_motorina,observatii',
        order: 'id',
        filter: q => q.or(`ora_start.gte.${midnightIso(cal.current + '-01')},ora_stop.is.null`)
      }
    };
  }
  /* Sumar complet Dezmembrări: două COUNT-uri HEAD, fără descărcarea articolelor. */
  async function fetchDismantlingSummary(client, profile) {
    if (!moduleAllowed(profile, 'dezmembrari_manage')) return {ok:false, reason:'Fără acces la gestiunea completă Dezmembrări.'};
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const results = await Promise.all(['draft', 'ready'].map(status => client
        .from('dezmembrari_items').select('id', {count:'exact', head:true})
        .eq('status', status).abortSignal(controller.signal)));
      if (results.some(result => result.error || !Number.isSafeInteger(result.count) || result.count < 0)) throw new Error('Sumarul Dezmembrări nu este disponibil.');
      return {ok:true, draft:results[0].count, ready:results[1].count};
    } catch (error) {
      return {ok:false, reason:controller.signal.aborted ? 'Încărcarea Dezmembrărilor a expirat.' : 'Sumarul Dezmembrări nu este disponibil.'};
    } finally {clearTimeout(timer);}
  }
  /* Paginarea previne trunchierea silențioasă; depășirea limitei invalidează sursa. */
  async function readSource(client, key, plan, profile) {
    if (plan.permission && !moduleAllowed(profile, plan.permission)) return {
      ok: false,
      reason: 'Fără acces: permisiunea modulului lipsește.',
      rows: []
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      let rows = [],
        total = null;
      for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
        const options = offset === 0 ? {
          count: 'exact'
        } : {};
        let query = client.from(plan.table).select(plan.columns, options);
        query = plan.filter(query).order(plan.order, {
          ascending: true
        }).range(offset, offset + PAGE_SIZE - 1).abortSignal(controller.signal);
        const result = await query;
        if (result.error) throw new Error(controller.signal.aborted ? 'Timpul de încărcare a expirat.' : 'Citirea a eșuat; verifică accesul sau conexiunea.');
        if (!Array.isArray(result.data)) throw new Error('Răspuns de date nevalid.');
        if (offset === 0) {
          total = result.count;
          if (!Number.isInteger(total) || total < 0) throw new Error('Numărul total de rânduri nu a putut fi verificat.');
          if (total > MAX_ROWS) throw new Error(`Volum peste ${MAX_ROWS} rânduri; sumarul nu este calculat parțial.`);
        }
        rows.push(...result.data);
        if (rows.length >= total) break;
        if (result.data.length < PAGE_SIZE) throw new Error('Set incomplet sau modificat în timpul citirii.');
      }
      if (rows.length !== total || new Set(rows.map(r => String(r[plan.order]))).size !== total) throw new Error('Datele s-au schimbat în timpul paginării; actualizează.');
      return {
        ok: true,
        rows: normalize(key, rows),
        reason: null
      };
    } catch (error) {
      return {
        ok: false,
        rows: [],
        reason: controller.signal.aborted ? 'Timpul de încărcare a expirat.' : error.message
      };
    } finally {
      clearTimeout(timer);
    }
  }
  function summarize(rows, p, dateField) {
    return rows.filter(r => inside(dateField === 'data_deviz' ? r.data_deviz : dayKey(r[dateField]), p.start, p.end));
  }
  /* Modelul separă lucrările, avansurile încasate, avansurile incluse și restul calculat. */
  function model(sources, month, cal) {
    const p = period(month, cal),
      d = sources.devize,
      a = sources.advances;
    const selected = d.ok ? summarize(d.rows, p, 'data_deviz') : null;
    const previous = d.ok ? summarize(d.rows, {
      start: p.previousStart,
      end: p.previousEnd
    }, 'data_deviz') : null;
    const paid = a.ok ? summarize(a.rows, p, 'data_platii') : null;
    const gross = selected ? sum(selected, 'gross') : null;
    return {
      p,
      selected,
      previous,
      paid,
      gross,
      previousGross: previous ? sum(previous, 'gross') : null,
      count: selected?.length ?? null,
      average: selected?.length ? gross / selected.length : null,
      labor: selected ? sum(selected, 'total_manopera') : null,
      parts: selected ? sum(selected, 'total_piese') : null,
      paidValue: paid ? sum(paid, 'suma') : null,
      trend: cal.months.map(m => {
        const bounds = {
          start: `${m}-01`,
          end: m === cal.current ? cal.end : `${shiftMonth(m, 1)}-01`
        };
        const ds = d.ok ? summarize(d.rows, bounds, 'data_deviz') : null;
        const as = a.ok ? summarize(a.rows, bounds, 'data_platii') : null;
        return {
          month: m,
          gross: ds ? sum(ds, 'gross') : null,
          labor: ds ? sum(ds, 'total_manopera') : null,
          parts: ds ? sum(ds, 'total_piese') : null,
          count: ds?.length ?? null,
          paid: as ? sum(as, 'suma') : null
        };
      })
    };
  }

  /* Stocul invalid rămâne vizibil; nu este convertit în zero. */
  function stockIssue(row) {
    const invalid = v => v === null || v === undefined || typeof v === 'string' && !v.trim() || !['string', 'number'].includes(typeof v) || !Number.isFinite(Number(v));
    if (invalid(row.stoc_actual) || invalid(row.prag_minim)) return 'Date numerice invalide';
    if (Number(row.stoc_actual) < 0) return 'Stoc negativ';
    if (Number(row.prag_minim) < 0) return 'Prag invalid';
    return Number(row.stoc_actual) <= Number(row.prag_minim) ? 'La/sub prag' : null;
  }
  function paymentGroups(rows, p) {
    const pending = rows.filter(r => r.status === 'neplatit').sort((a, b) => new Date(a.data_crearii) - new Date(b.data_crearii));
    const completed = rows.filter(r => r.status === 'platit').sort((a, b) => new Date(b.data_platii) - new Date(a.data_platii));
    return {
      pending,
      completed,
      monthPaid: completed.filter(r => inside(dayKey(r.data_platii), p.start, p.end))
    };
  }
  function generatorModel(rows, cal, now = new Date()) {
    const start = Date.parse(midnightIso(cal.current + '-01')),
      end = now.getTime();
    let hours = 0,
      fuel = 0,
      starts = 0,
      active = false,
      invalid = 0;
    const parse = value => !value ? NaN : Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(String(value)) ? value : String(value) + 'Z');
    rows.forEach(r => {
      const from = parse(r.ora_start),
        to = r.ora_stop ? parse(r.ora_stop) : end;
      if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) {
        invalid++;
        return;
      }
      if (String(r.observatii || '').includes('Alimentare')) {
        if (from >= start && from <= end) {
          try {
            fuel += numeric(r.litri_motorina);
          } catch (error) {
            invalid++;
          }
        }
        return;
      }
      if (from <= end && !r.ora_stop) active = true;
      if (from >= start && from <= end) starts++;
      hours += Math.max(0, Math.min(to, end) - Math.max(from, start)) / 3600000;
    });
    return {
      hours: invalid ? null : hours,
      fuel: invalid ? null : fuel,
      starts: invalid ? null : starts,
      active: invalid ? null : active,
      invalid
    };
  }

  /* Randare: datele bazei sunt introduse numai ca text. */
  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function set(id, text) {
    document.getElementById(id).textContent = text;
  }
  function money(value) {
    return value === null ? 'Indisponibil' : moneyFormatter.format(value) + ' lei';
  }
  function count(value) {
    return value === null ? '—' : String(value);
  }
  function dateLabel(value) {
    const key = dayKey(value);
    return key ? key.split('-').reverse().join('.') : '—';
  }
  function empty(tbody, text, columns) {
    const tr = element('tr');
    const td = element('td', 'empty-cell', text);
    td.colSpan = columns;
    tr.append(td);
    tbody.replaceChildren(tr);
  }
  function statusBadge(status) {
    return element('span', `payment-badge ${status === 'platit' ? 'platit' : 'neplatit'}`, status === 'platit' ? 'Plătit' : 'De efectuat');
  }
  let client,
    profile,
    sources,
    cal,
    loadedAt,
    busy = false,
    authSubscription,
    clockTimer,
    toastTimer;
  const paying = new Set();
  function notify(message, error = false) {
    const toast = document.getElementById('toast');
    clearTimeout(toastTimer);
    toast.className = 'toast' + (error ? ' error' : '');
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, error ? 7000 : 2800);
  }
  function changeTab(name, focus = false) {
    const tabs = ['financiar', 'performanta', 'plati'];
    if (!tabs.includes(name)) return;
    tabs.forEach(tab => {
      const selected = tab === name;
      document.getElementById('tab-' + tab).hidden = !selected;
      const btn = document.getElementById('tabButton-' + tab);
      btn.classList.toggle('active', selected);
      btn.setAttribute('aria-selected', String(selected));
      btn.tabIndex = selected ? 0 : -1;
    });
    if (focus) document.getElementById('tabButton-' + name).focus();
  }
  function comparison(current, previous) {
    if (current === null || previous === null) return 'Comparație indisponibilă';
    const pct = delta(current, previous);
    return pct === null ? `Fără bază procentuală · anterior ${money(previous)}` : `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toLocaleString('ro-RO', {
      maximumFractionDigits: 1
    })}% · anterior ${money(previous)}`;
  }
  function renderTrend(m, month) {
    const chart = document.getElementById('trendChart'),
      table = document.getElementById('trendTable');
    chart.replaceChildren();
    table.replaceChildren();
    if (!sources.devize.ok) chart.append(element('p', 'empty-state', 'Grafic indisponibil: verifică sursa devizelor.'));else if (m.trend.some(r => r.labor < 0 || r.parts < 0)) chart.append(element('p', 'empty-state', 'Componente negative: consultă valorile exacte din tabel.'));else {
      const max = Math.max(...m.trend.map(r => r.gross), 1);
      m.trend.forEach(r => {
        const column = element('div', `chart-column${r.month === month ? ' selected' : ''}`);
        column.title = `${monthName(r.month)} · ${money(r.gross)} · ${r.count} documente`;
        const stack = element('div', 'chart-stack'),
          parts = element('div', 'chart-parts'),
          labor = element('div', 'chart-labor');
        parts.style.height = `${r.parts / max * 108}px`;
        labor.style.height = `${r.labor / max * 108}px`;
        stack.append(parts, labor);
        const label = element('span', 'chart-label', monthName(r.month));
        label.append(element('small', '', r.month === cal.current ? 'până azi' : ''));
        column.append(element('span', 'chart-value', new Intl.NumberFormat('ro-RO', {
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(r.gross) + ' lei'), stack, label);
        chart.append(column);
      });
    }
    m.trend.forEach(r => {
      const tr = element('tr');
      [monthName(r.month), count(r.count), money(r.gross), money(r.paid)].forEach(v => tr.append(element('td', '', v)));
      table.append(tr);
    });
  }
  /* Blocajul de completare și coada de publicare sunt situații curente, nu lunare. */
  function renderDismantling() {
    const summary=sources.dismantling, card=document.getElementById('dismantlingCard');
    set('dismantlingDraft', summary.ok ? String(summary.draft) : '—');
    set('dismantlingReady', summary.ok ? `Gata de publicare: ${summary.ready}` : summary.reason);
    card.classList.toggle('has-backlog', summary.ok && summary.draft > 0);
    card.classList.toggle('is-unavailable', !summary.ok);
    if (summary.ok) {card.href='/modules/stocuri/dezmembrari.html';card.removeAttribute('aria-disabled');}
    else {card.removeAttribute('href');card.setAttribute('aria-disabled','true');}
    document.getElementById('dismantlingLinkHint').hidden=!summary.ok;
  }
  function renderOperations() {
    const box = document.getElementById('operationsList');
    box.replaceChildren();
    const configs = [['service', 'Constatări active', rows => rows.filter(r => OPEN_SERVICE.includes(r.status)).length, 'În lucru + așteptare piese'], ['detailing', 'Detailing activ', rows => rows.filter(r => OPEN_DETAILING.includes(r.status)).length, 'Programări + în lucru'], ['awb', 'AWB în tranzit', rows => rows.filter(r => r.stare === 'in_tranzit').length, 'Colete nearhivate'], ['orders', 'Comenzi SH de urmărit', rows => rows.length, 'Comandate / tranzit / ajunse / nepotrivite'], ['stock', 'Excepții de stoc', rows => rows.filter(r => r.stockIssue).length, 'Prag, stoc negativ sau date invalide']];
    configs.forEach(([key, label, fn, note]) => {
      const s = sources[key],
        a = element('a', 'operation-row');
      a.href = PATHS[key];
      const text = element('div');
      text.append(element('strong', '', label), element('small', '', s.ok ? note : s.reason));
      a.append(text, element('span', 'operation-value', s.ok ? String(fn(s.rows)) : '—'));
      box.append(a);
    });
  }
  function renderAttention() {
    const items = [];
    const add = (key, title, detail) => items.push({
      key,
      title,
      detail
    });
    if (sources.service.ok) {
      const active = sources.service.rows.filter(r => OPEN_SERVICE.includes(r.status));
      const waiting = active.filter(r => r.status === 'Asteptare piese').length,
        urgent = active.filter(r => r.este_urgent === true).length;
      if (waiting) add('service', `Așteptare piese: ${waiting}`, 'Fișe blocate după statusul curent.');
      if (urgent) add('service', `Fișe active urgente: ${urgent}`, 'Marcaj explicit în Constatări.');
    }
    if (sources.stock.ok) {
      const invalid = sources.stock.rows.filter(r => r.stockIssue && r.stockIssue !== 'La/sub prag'),
        low = sources.stock.rows.filter(r => r.stockIssue === 'La/sub prag');
      if (invalid.length) add('stock', `Stoc de verificat: ${invalid.length}`, 'Date numerice invalide, prag invalid sau stoc negativ.');
      if (low.length) add('stock', `Produse la/sub prag: ${low.length}`, 'Comparate cu pragul minim configurat.');
    }
    if (sources.orders.ok) {
      const n = sources.orders.rows.filter(r => r.status === 'nepotrivita').length;
      if (n) add('orders', `Piese SH nepotrivite: ${n}`, 'Verifică înlocuirea sau returul.');
    }
    if (sources.payments.ok) {
      const pending = paymentGroups(sources.payments.rows, period(document.getElementById('monthSelect').value, cal)).pending;
      if (pending.length) add('payments', `Plăți de efectuat: ${pending.length}`, money(sum(pending, 'suma')) + ' · cereri în așteptare.');
    }
    if (!sources.stock.ok) add('stock', 'Stoc indisponibil', sources.stock.reason);
    const box = document.getElementById('attentionList');
    box.replaceChildren();
    items.forEach(item => {
      const row = element('div', 'attention-item'),
        text = element('div'),
        link = element('button', 'text-button');
      link.append(element('strong', '', item.title));
      link.type = 'button';
      link.addEventListener('click', () => {
        if (item.key === 'payments') changeTab('plati', true);else window.location.href = PATHS[item.key];
      });
      text.append(link, element('p', '', item.detail));
      row.append(element('span', '', '!'), text);
      box.append(row);
    });
    const incomplete = ['service', 'stock', 'orders', 'payments'].some(key => !sources[key].ok);
    set('attentionCount', String(items.length) + (incomplete ? ' · parțial' : ''));
    if (!items.length) box.append(element('p', 'empty-state', incomplete ? 'Verificare incompletă: unele surse lipsesc.' : 'Nicio excepție după regulile verificate.'));else if (incomplete) box.append(element('p', 'footnote', 'Lista este parțială: verifică sursele indisponibile.'));
  }
  function renderOperationalDetails() {
    const service = document.getElementById('serviceBody');
    service.replaceChildren();
    const active = sources.service.ok ? sources.service.rows.filter(r => OPEN_SERVICE.includes(r.status)) : null;
    if (!active?.length) empty(service, active ? 'Nu există fișe active.' : 'Constatările nu sunt disponibile.', 4);else active.sort((a, b) => Number(b.este_urgent) - Number(a.este_urgent) || new Date(a.created_at) - new Date(b.created_at)).forEach(r => {
      const tr = element('tr'),
        cell = element('td'),
        a = element('a', 'text-button', r.nr_inmatriculare || '—');
      a.href = PATHS.service + '?nr=' + encodeURIComponent(r.nr_inmatriculare || '');
      cell.append(a);
      tr.append(cell);
      [dateLabel(r.created_at), r.status, r.este_urgent ? 'Urgent' : '—'].forEach(v => tr.append(element('td', '', v)));
      service.append(tr);
    });
    const waits = document.getElementById('waitingList');
    waits.replaceChildren();
    if (!active || !sources.waiting.ok) waits.append(element('p', 'empty-state', 'Intervalele de așteptare nu sunt disponibile.'));else {
      const rows = active.filter(r => r.status === 'Asteptare piese');
      if (!rows.length) waits.append(element('p', 'empty-state', 'Nicio fișă în așteptare piese.'));
      rows.forEach(r => {
        const intervals = sources.waiting.rows.filter(x => String(x.constatare_id) === String(r.id)).sort((a, b) => new Date(b.inceput) - new Date(a.inceput));
        const start = Date.parse(intervals[0]?.inceput);
        const hours = Math.floor((Date.now() - start) / 3600000);
        const duration = Number.isFinite(hours) && hours >= 0 ? `${Math.floor(hours / 24)}z ${hours % 24}h` : 'Interval necunoscut';
        const row = element('div', 'waiting-row');
        row.append(element('strong', '', r.nr_inmatriculare || '—'), element('span', '', duration));
        waits.append(row);
      });
    }
    const departments = document.getElementById('departmentBody');
    departments.replaceChildren();
    cal.months.forEach(month => {
      const tr = element('tr'),
        created = sources.service.ok ? sources.service.rows.filter(r => dayKey(r.created_at)?.slice(0, 7) === month).length : null,
        scheduled = sources.detailing.ok ? sources.detailing.rows.filter(r => dayKey(r.data_programare)?.slice(0, 7) === month).length : null;
      [monthName(month), count(created), count(scheduled)].forEach(v => tr.append(element('td', '', v)));
      departments.append(tr);
    });
    const awb = document.getElementById('awbBody');
    awb.replaceChildren();
    const transit = sources.awb.ok ? sources.awb.rows.filter(r => r.stare === 'in_tranzit') : null;
    if (!transit?.length) empty(awb, transit ? 'Nu există colete în tranzit.' : 'AWB indisponibil.', 4);else transit.forEach(r => {
      const tr = element('tr');
      [r.nr_awb || '—', r.nume_client || '—', r.piesa || '—', r.pret === null || !Number.isFinite(Number(r.pret)) ? '—' : money(Number(r.pret))].forEach(v => tr.append(element('td', '', v)));
      awb.append(tr);
    });
    const stock = document.getElementById('stockBody');
    stock.replaceChildren();
    const issues = sources.stock.ok ? sources.stock.rows.filter(r => r.stockIssue) : null;
    if (!issues?.length) empty(stock, issues ? 'Nu sunt excepții de stoc.' : 'Stoc indisponibil.', 4);else issues.forEach(r => {
      const tr = element('tr', 'invalid-stock');
      [r.denumire || '—', r.stoc_actual ?? 'Lipsește', r.prag_minim ?? 'Lipsește', r.stockIssue].forEach(v => tr.append(element('td', '', String(v))));
      stock.append(tr);
    });
    const gen = document.getElementById('generatorStats');
    gen.replaceChildren();
    if (!sources.generator.ok) {
      gen.append(element('p', 'empty-state', 'Generator indisponibil.'));
      set('generatorState', sources.generator.reason);
    } else {
      const stats = generatorModel(sources.generator.rows, cal);
      [[stats.hours === null ? '—' : stats.hours.toLocaleString('ro-RO', {
        maximumFractionDigits: 1
      }), 'ore funcționare'], [stats.fuel === null ? '—' : stats.fuel.toLocaleString('ro-RO', {
        maximumFractionDigits: 1
      }) + ' L', 'motorină alimentată'], [stats.starts === null ? '—' : String(stats.starts), 'porniri']].forEach(([value, label]) => {
        const div = element('div');
        div.append(element('strong', '', value), element('span', '', label));
        gen.append(div);
      });
      set('generatorState', (stats.active === null ? 'Status Generator indisponibil' : stats.active ? 'Generator pornit' : 'Generator oprit') + (stats.invalid ? ` · Înregistrări invalide de verificat: ${stats.invalid}` : '') + ' · situația ultimei citiri');
    }
  }
  /* Cererile din rezumat și tabul Plăți folosesc aceeași stare în memorie. */
  function paymentRows(target, rows, {
    preview = false,
    completed = false,
    unavailable = false
  } = {}) {
    const body = document.getElementById(target);
    body.replaceChildren();
    if (unavailable || !rows.length) {
      empty(body, unavailable ? 'Cererile de plată nu sunt disponibile.' : completed ? 'Nu există plăți efectuate în fereastra recentă.' : 'Nu există cereri de plată în așteptare.', 7);
      return;
    }
    rows.forEach(r => {
      const tr = element('tr'),
        ibanCell = element('td');
      if (r.iban) {
        const button = element('button', 'iban-button', r.iban);
        button.type = 'button';
        button.title = 'Copiază IBAN';
        button.setAttribute('aria-label', `Copiază IBAN pentru ${r.beneficiar || 'beneficiar'}`);
        button.addEventListener('click', () => copyIban(r.iban, button));
        ibanCell.append(button);
      } else ibanCell.textContent = 'IBAN lipsă';
      tr.append(element('td', '', r.beneficiar || '—'), ibanCell, element('td', '', money(Number(r.suma))), element('td', '', r.motiv || '—'), element('td', '', dateLabel(completed ? r.data_platii : r.data_crearii)));
      const status = element('td'),
        action = element('td');
      status.append(statusBadge(r.status));
      if (!completed && r.status === 'neplatit') {
        const button = element('button', 'pay-button', paying.has(String(r.id)) ? 'Se salvează…' : 'Marchează plătit');
        button.type = 'button';
        button.dataset.paymentId = String(r.id);
        button.disabled = busy || paying.has(String(r.id));
        button.addEventListener('click', () => markPaid(String(r.id)));
        action.append(button);
      } else action.textContent = '—';
      tr.append(status, action);
      body.append(tr);
    });
  }
  function renderPayments() {
    const available = sources.payments.ok,
      p = period(document.getElementById('monthSelect').value, cal),
      groups = paymentGroups(available ? sources.payments.rows : [], p);
    const total = available ? sum(groups.pending, 'suma') : null;
    set('pendingPayments', money(total));
    set('pendingCount', available ? `Cereri: ${groups.pending.length} · vezi →` : 'Sursă indisponibilă');
    set('paymentBadge', available ? String(groups.pending.length) : '—');
    set('summaryPaymentCount', available ? String(groups.pending.length) : '—');
    set('paymentTotal', money(total));
    set('paymentTotalCount', available ? `Cereri neplătite: ${groups.pending.length}` : 'Sursă indisponibilă');
    set('paymentMonthTotal', available ? money(sum(groups.monthPaid, 'suma')) : 'Indisponibil');
    set('paymentMonthCount', available ? `Plăți: ${groups.monthPaid.length} · după data plății` : 'Sursă indisponibilă');
    paymentRows('paymentPreview', groups.pending.slice(0, 4), {
      preview: true,
      unavailable: !available
    });
    paymentRows('pendingBody', groups.pending, {
      unavailable: !available
    });
    paymentRows('completedBody', groups.completed.slice(0, 20), {
      completed: true,
      unavailable: !available
    });
    set('paymentPreviewNote', !available ? sources.payments.reason : groups.pending.length > 4 ? `Primele 4 din ${groups.pending.length} cereri. Lista completă este în tabul Plăți.` : 'Aceleași cereri ca în pagina utilizatorului; statusul este comun.');
    set('completedCaption', `Ultimele ${Math.min(groups.completed.length, 20)} din ${groups.completed.length} plăți încărcate · ${cal.start}–${cal.today}`);
  }
  async function copyIban(value, button) {
    const text = String(value || '').trim();
    if (!text) {
      notify('IBAN-ul lipsește.', true);
      return;
    }
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (error) {
      copied = false;
    }
    if (!copied) {
      const field = document.createElement('textarea'),
        focused = document.activeElement;
      field.value = text;
      field.readOnly = true;
      field.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.append(field);
      try {
        field.select();
        field.setSelectionRange(0, text.length);
        copied = document.execCommand('copy');
      } catch (error) {
        copied = false;
      } finally {
        field.remove();
        focused?.focus?.({
          preventScroll: true
        });
      }
    }
    if (!copied) {
      notify('Copierea nu este disponibilă. Selectează și copiază IBAN-ul manual.', true);
      return;
    }
    if (button) {
      const original = button.dataset.originalText || button.textContent;
      button.dataset.originalText = original;
      clearTimeout(button.copyTimer);
      button.textContent = 'Copiat ✓';
      button.classList.add('copied');
      button.copyTimer = setTimeout(() => {
        if (button.isConnected) {
          button.textContent = original;
          button.classList.remove('copied');
        }
      }, 1300);
    }
    notify('IBAN copiat.');
  }
  function actionState(id, disabled) {
    document.querySelectorAll('[data-payment-id]').forEach(button => {
      if (button.dataset.paymentId === String(id)) {
        button.disabled = disabled;
        button.textContent = disabled ? 'Se salvează…' : 'Marchează plătit';
      }
    });
    document.getElementById('refreshButton').disabled = busy || paying.size > 0;
  }
  /* Se actualizează exclusiv cererea originală și câmpurile existente de plată. */
  async function markPaid(id) {
    if (busy || paying.has(id) || !/^\d+$/.test(id) || !sources?.payments.ok) return;
    const row = sources.payments.rows.find(r => String(r.id) === id);
    if (!row || row.status !== 'neplatit') return;
    paying.add(id);
    actionState(id, true);
    try {
      const freshProfile = await authorize();
      if (!freshProfile) return;
      if (!freshProfile.id) throw new Error('Identitatea utilizatorului nu a putut fi verificată.');
      profile = freshProfile;
      resetSearch();
      const payload = {
        status: 'platit',
        data_platii: new Date().toISOString(),
        platit_de: profile.id
      };
      const {
        data,
        error
      } = await client.from('plati_manager').update(payload).eq('id', id).eq('status', 'neplatit').select('id,status,data_platii,platit_de').maybeSingle().abortSignal(AbortSignal.timeout(15000));
      if (error) throw new Error('Salvarea nu a fost confirmată. Actualizează înainte de a reîncerca.');
      if (!data || String(data.id) !== id || data.status !== 'platit') throw new Error('Cererea a fost schimbată sau nu mai este disponibilă. Actualizează lista.');
      sources.payments.rows = sources.payments.rows.map(r => String(r.id) === id ? {
        ...r,
        ...data
      } : r);
      renderPayments();
      renderAttention();
      notify('Cererea a fost marcată plătită.');
    } catch (error) {
      notify(error.message || 'Nu s-a putut confirma plata.', true);
    } finally {
      paying.delete(id);
      actionState(id, false);
    }
  }
  function render() {
    const month = document.getElementById('monthSelect').value,
      m = model(sources, month, cal);
    set('periodCaption', m.p.current ? `1–${cal.today.slice(-2)} ${monthName(month)} · comparație cu primele ${m.p.comparedDays} zile din luna trecută` : `${monthName(month)} · lună completă față de luna precedentă`);
    set('grossValue', money(m.gross));
    set('grossCompare', comparison(m.gross, m.previousGross));
    document.getElementById('grossCompare').className = 'comparison ' + (m.previousGross > 0 ? m.gross >= m.previousGross ? 'up' : 'down' : '');
    set('estimateCount', count(m.count));
    set('countCompare', m.previous ? `Anterior: ${m.previous.length} documente` : 'Comparație indisponibilă');
    set('estimateAverage', m.count === 0 ? '—' : money(m.average));
    set('paidAdvances', money(m.paidValue));
    set('advanceCount', m.paid ? `Plăți: ${m.paid.length} · după data plății` : 'Sursă indisponibilă');
    const active = sources.service.ok ? sources.service.rows.filter(r => OPEN_SERVICE.includes(r.status)).length : null;
    set('activeService', count(active));
    const notes = document.getElementById('quickNotes');
    notes.replaceChildren();
    const today = sources.advances.ok ? sources.advances.rows.filter(r => dayKey(r.data_platii) === cal.today) : null;
    [['Manoperă', money(m.labor)], ['Piese după discount', money(m.parts)], ['Avansuri azi', today ? money(sum(today, 'suma')) : 'Indisponibil']].forEach(([label, value]) => {
      const span = element('span', '', label + ': ');
      if (label === 'Avansuri azi') span.id = 'todayAdvancesNote';
      span.append(element('strong', '', value));
      notes.append(span);
    });
    const warnings = Object.entries(sources).filter(([key, s]) => !['stock', 'dismantling'].includes(key) && !s.ok).map(([key, s]) => `${TITLES[key]}: ${s.reason}`);
    const warning = document.getElementById('sourceWarnings');
    warning.hidden = !warnings.length;
    warning.textContent = warnings.join('\n');
    renderTrend(m, month);
    renderPayments();
    renderDismantling();
    renderOperations();
    renderAttention();
    renderOperationalDetails();
    set('freshness', `${warnings.length ? 'Date parțiale' : 'Actualizat'} · ${loadedAt.toLocaleString('ro-RO', {
      timeZone: ZONE,
      dateStyle: 'short',
      timeStyle: 'short'
    })}`);
  }
  /* Încărcare paralelă fără polling business și fără rezultate fictive la eroare. */
  let localDraftLanding = null;
  async function load() {
    if (busy || paying.size) return false;
    busy = true;
    document.getElementById('refreshButton').disabled = true;
    document.getElementById('monthSelect').disabled = true;
    document.getElementById('main').setAttribute('aria-busy', 'true');
    set('freshness', 'Se actualizează…');
    document.querySelectorAll('[data-payment-id]').forEach(button => {
      button.disabled = true;
    });
    try {
      profile = await authorize();
      if (!profile) return false;
      /* Profilul deja verificat permite intrarea în ciorne, fără alt query de autentificare. */
      if (window.HubLocalDrafts) {
        const canRecover = window.HubLocalDrafts.canUse(profile);
        if (!localDraftLanding || localDraftLanding.userId !== profile.id || localDraftLanding.allowed !== canRecover) {
          localDraftLanding?.menu?.dispose();
          localDraftLanding = {userId:profile.id,allowed:canRecover,menu:null};
          localDraftLanding.menu = await window.HubLocalDrafts.mount({project:new URL(SUPABASE_URL).hostname,
            userId:profile.id,allowed:canRecover,client});
        }
      }
      resetSearch();
      cal = calendar();
      const select = document.getElementById('monthSelect'),
        selected = select.value;
      select.replaceChildren(...cal.months.slice(1).reverse().map(month => {
        const option = element('option', '', monthName(month) + (month === cal.current ? ' · până azi' : ''));
        option.value = month;
        return option;
      }));
      if (cal.months.slice(1).includes(selected)) select.value = selected;
      const tasks = Object.entries(plans(cal)).map(async ([key, plan]) => [key, await readSource(client, key, plan, profile)]);
      tasks.push(fetchDismantlingSummary(client, profile).then(summary => ['dismantling', summary]));
      sources = Object.fromEntries(await Promise.all(tasks));
      loadedAt = new Date();
      render();
      return true;
    } catch (error) {
      deny(error.message || 'Dashboardul nu poate fi încărcat.');
      return false;
    } finally {
      busy = false;
      document.getElementById('refreshButton').disabled = paying.size > 0;
      document.getElementById('monthSelect').disabled = false;
      document.getElementById('main').setAttribute('aria-busy', 'false');
      document.querySelectorAll('[data-payment-id]').forEach(button => {
        button.disabled = paying.has(button.dataset.paymentId);
      });
    }
  }
  function deny(message) {
    resetSearch();
    document.getElementById('dashboard').hidden = true;
    const el = document.getElementById('accessMessage');
    el.hidden = false;
    el.textContent = message;
  }
  async function authorize() {
    const {
      data,
      error
    } = await client.auth.getSession();
    if (error) throw new Error('Sesiunea nu poate fi verificată. Reîncarcă pagina.');
    if (!data?.session?.user?.id) {
      deny('Autentificarea este necesară.');
      window.location.replace('/modules/admin/login.html');
      return null;
    }
    const result = await client.from('auth_profiles').select('id,rol_id,permissions').eq('id', data.session.user.id).maybeSingle().abortSignal(AbortSignal.timeout(15000));
    if (result.error) throw new Error('Profilul și permisiunile nu pot fi verificate. Reîncarcă pagina.');
    if (!allowed(result.data)) {
      deny('Acces restricționat. Este necesar rol Admin/Manager sau permisiunea Manager Dashboard.');
      return null;
    }
    return result.data;
  }
  let hubSearchEngine = null,
    searchTimer = null,
    searchGeneration = 0,
    renderedSearchTerm = '';
  function getSearchEngine() {
    return hubSearchEngine || (hubSearchEngine = HubGlobalSearch.create({
      client,
      hasPermission: key => HubGlobalSearch.hasPermission(profile, key)
    }));
  }
  function dismissSearch() {
    clearTimeout(searchTimer);
    searchTimer = null;
    searchGeneration++;
    hubSearchEngine?.cancelPending();
    document.getElementById('searchResults').hidden = true;
  }
  function resetSearch() {
    hubSearchEngine?.reset();
    dismissSearch();
    renderedSearchTerm = '';
    document.getElementById('searchResults').replaceChildren();
  }
  function renderSearchGroups(groups) {
    const box = document.getElementById('searchResults');
    box.replaceChildren();
    groups.filter(group => group.items.length || group.error).forEach(group => {
      const section = element('section', 'search-group');
      section.append(element('h3', '', group.title));
      group.items.forEach(item => {
        const link = element('a', 'search-result-link');
        link.href = item.url;
        link.append(element('strong', '', item.label), element('small', '', item.detail));
        section.append(link);
      });
      if (group.error) section.append(element('p', 'search-error', 'Sursă indisponibilă. Rezultatele acestei categorii nu pot fi verificate.'));
      box.append(section);
    });
    if (!box.children.length) box.append(element('p', '', 'Niciun rezultat în HUB pentru termenul căutat.'));
    box.hidden = false;
  }
  async function runSearch(q, generation) {
    if (generation !== searchGeneration) return;
    const box = document.getElementById('searchResults');
    box.replaceChildren(element('p', '', 'Se caută în HUB…'));
    box.hidden = false;
    try {
      const groups = await getSearchEngine().search(q);
      if (generation !== searchGeneration || document.getElementById('globalSearch').value.trim() !== q) return;
      renderedSearchTerm = q;
      renderSearchGroups(groups);
    } catch (error) {
      if (generation === searchGeneration) {
        box.replaceChildren(element('p', 'search-error', 'Căutarea nu este disponibilă. Reîncearcă.'));
        box.hidden = false;
      }
    }
  }
  function search() {
    const q = document.getElementById('globalSearch').value.trim(),
      box = document.getElementById('searchResults');
    clearTimeout(searchTimer);
    const generation = ++searchGeneration;
    renderedSearchTerm = '';
    box.replaceChildren();
    box.hidden = true;
    if (!q || !q.replace(/[%_*,]/g, '').trim()) {
      hubSearchEngine?.reset();
      return;
    }
    hubSearchEngine?.cancelDifferent(q);
    searchTimer = setTimeout(() => {
      searchTimer = null;
      runSearch(q, generation);
    }, 350);
  }
  function focusSearch() {
    const q = document.getElementById('globalSearch').value.trim(),
      box = document.getElementById('searchResults');
    if (!q) return;
    if (renderedSearchTerm === q && box.children.length) {
      box.hidden = false;
      return;
    }
    if (searchTimer) return;
    runSearch(q, searchGeneration);
  }
  function bind() {
    const tabs = [...document.querySelectorAll('[data-tab]')];
    tabs.forEach((button, index) => {
      button.addEventListener('click', () => changeTab(button.dataset.tab));
      button.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;else if (event.key === 'Home') next = 0;else if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          changeTab(tabs[next].dataset.tab, true);
        }
      });
    });
    document.querySelectorAll('[data-open-tab]').forEach(button => button.addEventListener('click', () => changeTab(button.dataset.openTab, true)));
    document.getElementById('monthSelect').addEventListener('change', render);
    document.getElementById('refreshButton').addEventListener('click', load);
    document.getElementById('globalSearch').addEventListener('input', search);
    document.getElementById('globalSearch').addEventListener('focus', focusSearch);
    document.addEventListener('click', event => {
      if (!event.target.closest('.search-wrap')) dismissSearch();
    });
    document.getElementById('globalSearch').addEventListener('keydown', event => {
      if (event.key === 'Escape') dismissSearch();
    });
  }
  async function start() {
    try {
      client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
      if (!client?.auth) throw new Error('Clientul comun HUB nu este disponibil. Reîncarcă pagina.');
      window.supabaseClient = client;
      const timeout = document.createElement('script');
      timeout.src = '/js/session-timeout.js?v=2';
      document.head.append(timeout);
      if (!(await load())) return;
      document.getElementById('accessMessage').hidden = true;
      document.getElementById('dashboard').hidden = false;
      bind();
      const tick = () => {
        set('liveClock', new Date().toLocaleTimeString('ro-RO', {
          timeZone: ZONE,
          hour12: false
        }));
        if (cal && dayKey(new Date()) !== cal.today) {
          set('freshness', 'Ziua s-a schimbat. Actualizează datele.');
          const note = document.getElementById('todayAdvancesNote');
          if (note) note.textContent = 'Avansuri azi: actualizare necesară';
          const option = document.querySelector(`#monthSelect option[value="${cal.current}"]`);
          if (option) option.textContent = monthName(cal.current) + ' · ultima citire';
        }
      };
      tick();
      clockTimer = setInterval(tick, 1000);
      authSubscription = client.auth.onAuthStateChange(event => {
        if (event === 'SIGNED_OUT') {
          deny('Sesiunea a fost închisă.');
          window.location.replace('/modules/admin/login.html');
        }
      }).data?.subscription;
      window.addEventListener('pagehide', event => {
        if (!event.persisted) {
          hubSearchEngine?.reset();
          clearInterval(clockTimer);
          clearTimeout(toastTimer);
          authSubscription?.unsubscribe();
        }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && dayKey(new Date()) !== cal.today) set('freshness', 'Ziua s-a schimbat. Actualizează datele.');
      });
    } catch (error) {
      deny(error.message || 'Accesul nu poate fi verificat.');
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {
    dayKey,
    validDay,
    shiftMonth,
    addDay,
    midnightIso,
    calendar,
    period,
    numeric,
    delta,
    allowed,
    moduleAllowed,
    normalize,
    plans,
    readSource,
    model,
    stockIssue,
    paymentGroups,
    generatorModel,
    fetchDismantlingSummary,
    hubSearch: HubGlobalSearch
  };else document.addEventListener('DOMContentLoaded', start);
})();
