/* =========================================================================
   HUB AUTO — Evidență Piese (DEMO)
   Date exclusiv fictive, păstrate în memorie. Fără backend și fără persistență.
   ========================================================================= */
(() => {
  "use strict";

  const LEGACY_VAT_RATE = 0.19;
  const DEFAULT_NEW_VAT_RATE = 21;
  const DEMO_TODAY = "2026-10-23";
  const RETURN_STEPS = ["Cerere trimisă", "Așteaptă ridicare", "Ridicat", "Finalizat"];
  const INVOICE_STATUSES = ["În firmă", "Pregătită pentru contabilitate", "Trimisă în contabilitate"];

  /* -----------------------------------------------------------------------
     Datele DEMO: furnizori → facturi → piese → atribuiri → retururi
     ----------------------------------------------------------------------- */
  const DATA = {
    suppliers: [
      {
        id: "sup-1", name: "Auto Parts SRL", cui: "RO12345678", regCom: "J40/1234/2010",
        city: "București", address: "Str. Preciziei 12, Sector 6", phone: "021 300 1100",
        email: "comenzi@autoparts.demo", contact: "Andrei Popescu", iban: "RO49 AAAA 1B31 0075 9384 0000"
      },
      {
        id: "sup-2", name: "Motorparts Distribution", cui: "RO87654321", regCom: "J12/445/2012",
        city: "Cluj-Napoca", address: "Str. Fabricii 8", phone: "0264 410 220",
        email: "office@motorparts.demo", contact: "Mara Pop", iban: "RO12 BTRL 0000 1234 5678 9012"
      },
      {
        id: "sup-3", name: "Piese Auto Expert", cui: "RO23456789", regCom: "J08/998/2015",
        city: "Brașov", address: "Str. Zizinului 88", phone: "0268 320 450",
        email: "vanzari@pieseautoexpert.demo", contact: "Radu Ionescu", iban: "RO23 BRDE 1234 5678 9012 3456"
      },
      {
        id: "sup-4", name: "AP Trade", cui: "RO34567890", regCom: "J35/221/2018",
        city: "Timișoara", address: "Calea Aradului 44", phone: "0256 220 330",
        email: "contact@aptrade.demo", contact: "Diana Marin", iban: "RO56 RNCB 0987 6543 2109 8765"
      }
    ],

    invoices: [
      {
        id: "inv-1", number: "FA-1098", supplierId: "sup-1", date: "2026-10-12", status: "În firmă",
        note: "Recepție urgentă. Bara spate rămâne neatribuită până la confirmarea lucrării."
      },
      {
        id: "inv-2", number: "FA-1101", supplierId: "sup-2", date: "2026-10-14", status: "Pregătită pentru contabilitate",
        note: "Factură verificată. Filtrul de ulei și vasul de expansiune sunt încă neatribuite."
      },
      {
        id: "inv-3", number: "FA-1096", supplierId: "sup-3", date: "2026-10-10", status: "În firmă",
        note: "Include un retur în curs pentru radiatorul de climă."
      },
      {
        id: "inv-4", number: "FA-1095", supplierId: "sup-4", date: "2026-10-09", status: "Trimisă în contabilitate",
        note: "Piese pentru Hyundai i30 și Skoda Octavia; o lampă stop rămâne neatribuită."
      },
      {
        id: "inv-5", number: "FA-1093", supplierId: "sup-1", date: "2026-10-08", status: "Trimisă în contabilitate",
        note: "Recepție verificată, fără diferențe față de comandă."
      },
      {
        id: "inv-6", number: "FA-1087", supplierId: "sup-2", date: "2026-10-06", status: "Pregătită pentru contabilitate",
        note: "Include returul finalizat pentru filtrul de aer."
      }
    ],

    parts: [
      {
        id: "p-01", invoiceId: "inv-1", code: "1495069-S0", name: "Bară spate Tesla", qty: 1, price: 1400,
        plate: null, model: null, status: "Neatribuită", df: null, location: "Raft A2",
        note: "Piesă neatribuită — de confirmat mașina pentru lucrare."
      },
      {
        id: "p-02", invoiceId: "inv-1", code: "5G1941035", name: "Far stânga VW Golf VII", qty: 1, price: 860,
        plate: "CT73CSL", model: "VW Golf VII", status: "Montată", df: "DF-199", location: "Raft B1",
        note: "Montată pe VW Golf VII; prețul rămâne cel de pe factura de achiziție."
      },
      {
        id: "p-03", invoiceId: "inv-1", code: "51138072085", name: "Grilă radiator BMW X3", qty: 1, price: 540,
        plate: "CJ21ABC", model: "BMW X3", status: "Atribuită", df: "DF-188", location: "Raft B3",
        note: "Piesă comandată pentru reparația din 13.10."
      },
      {
        id: "p-04", invoiceId: "inv-1", code: "66209274428", name: "Senzor parcare BMW Seria 5", qty: 1, price: 215,
        plate: "B77XYZ", model: "BMW Seria 5", status: "Montată", df: "DF-176", location: "Sertar S2",
        note: "Montată, inclusă în devizul final DF-176."
      },
      {
        id: "p-05", invoiceId: "inv-2", code: "W712/95", name: "Filtru ulei Mann", qty: 2, price: 32.5,
        plate: null, model: null, status: "Neatribuită", df: null, location: "Raft C4",
        note: "Filtrul de ulei nu are încă o mașină atribuită."
      },
      {
        id: "p-06", invoiceId: "inv-2", code: "0986479B10", name: "Disc frână față BMW 320d", qty: 1, price: 420,
        plate: "B123XYZ", model: "BMW 320d", status: "Atribuită", df: null, location: "Raft D1",
        note: "Disc frână față, cantitate 1."
      },
      {
        id: "p-07", invoiceId: "inv-2", code: "0986424510", name: "Plăcuțe frână față BMW 320d", qty: 1, price: 280,
        plate: "B123XYZ", model: "BMW 320d", status: "Atribuită", df: null, location: "Raft D1",
        note: "Plăcuțe față pentru aceeași lucrare ca discul."
      },
      {
        id: "p-08", invoiceId: "inv-2", code: "8200151627", name: "Vas expansiune Renault Megane", qty: 1, price: 180,
        plate: null, model: null, status: "Retur inițiat", df: null, location: "Zona retur",
        note: "Comandă greșită; retur în curs."
      },
      {
        id: "p-09", invoiceId: "inv-3", code: "33526791513", name: "Amortizor spate Ford Focus", qty: 1, price: 310,
        plate: null, model: null, status: "Retur inițiat", df: null, location: "Zona retur",
        note: "Ambalaj deteriorat la recepție; retur în curs."
      },
      {
        id: "p-10", invoiceId: "inv-3", code: "64539239920", name: "Radiator climă Hyundai i30", qty: 1, price: 690,
        plate: "CT55AAA", model: "Hyundai i30", status: "Retur inițiat", df: null, location: "Zona retur",
        note: "Piesă incompatibilă; retur în curs."
      },
      {
        id: "p-11", invoiceId: "inv-3", code: "5NA857508E", name: "Oglindă dreapta VW Tiguan", qty: 1, price: 710,
        plate: "CT88DAN", model: "VW Tiguan", status: "Montată", df: "DF-187", location: "Raft E2",
        note: "Montată pe VW Tiguan, inclusă în DF-187."
      },
      {
        id: "p-12", invoiceId: "inv-4", code: "6640012A00", name: "Capotă motor Hyundai i30", qty: 1, price: 1860,
        plate: "CT55AAA", model: "Hyundai i30", status: "Atribuită", df: "DF-180", location: "Raft F1",
        note: "Capotă pentru Hyundai i30, inclusă în DF-180."
      },
      {
        id: "p-13", invoiceId: "inv-4", code: "5E9071153", name: "Set bare portbagaj Skoda Octavia", qty: 1, price: 640,
        plate: "IS99TUD", model: "Skoda Octavia", status: "Atribuită", df: "DF-168", location: "Raft F3",
        note: "Set bare portbagaj pentru Skoda Octavia."
      },
      {
        id: "p-14", invoiceId: "inv-4", code: "8M5113405", name: "Lampă stop spate Ford Focus", qty: 1, price: 320,
        plate: null, model: null, status: "Neatribuită", df: null, location: "Raft F4",
        note: "Lampă stop fără mașină atribuită."
      },
      {
        id: "p-15", invoiceId: "inv-5", code: "5E1857507", name: "Oglindă stânga Skoda Octavia", qty: 1, price: 690,
        plate: "IS99TUD", model: "Skoda Octavia", status: "Montată", df: "DF-168", location: "Raft E2",
        note: "Montată pe Skoda Octavia."
      },
      {
        id: "p-16", invoiceId: "inv-5", code: "A863S", name: "Ștergătoare față Bosch Aerotwin", qty: 2, price: 95,
        plate: null, model: null, status: "Neatribuită", df: null, location: "Raft G2",
        note: "Ștergătoare față, cantitate 2."
      },
      {
        id: "p-17", invoiceId: "inv-5", code: "570901076D", name: "Baterie 70Ah Varta", qty: 1, price: 640,
        plate: "CT12CNS", model: "Renault Megane", status: "Atribuită", df: "DF-170", location: "Raft H1",
        note: "Baterie montată pe Renault Megane."
      },
      {
        id: "p-18", invoiceId: "inv-6", code: "623352709", name: "Set ambreiaj Renault Megane", qty: 1, price: 1320,
        plate: "CT12CNS", model: "Renault Megane", status: "Atribuită", df: null, location: "Raft H3",
        note: "Set ambreiaj pentru Renault Megane."
      },
      {
        id: "p-19", invoiceId: "inv-6", code: "1334143", name: "Pompă apă Opel Astra", qty: 1, price: 240,
        plate: null, model: null, status: "Neatribuită", df: null, location: "Raft H4",
        note: "Pompă de apă pentru Opel Astra."
      },
      {
        id: "p-20", invoiceId: "inv-6", code: "C25114", name: "Filtru aer Mann", qty: 1, price: 58,
        plate: null, model: null, status: "Returnată", df: null, location: "Zona retur",
        note: "Retur finalizat; piesa a fost returnată furnizorului."
      },
      {
        id: "p-21", invoiceId: "inv-1", code: "1495070-S0", name: "Bară față Tesla", qty: 1, price: 1240,
        plate: "CT11AAA", model: "Tesla Model 3", status: "Atribuită", df: null, location: "Raft A1",
        note: "Piesă atribuită lucrării Tesla Model 3; fără import în devizul final."
      }
    ],

    dfImports: [],

    /* Trimiteri în magazie: registru DEMO separat, gol la fiecare refresh. */
    warehouseTransfers: [],

    returns: [
      {
        id: "ret-15", code: "RET-015", partId: "p-08", qty: 1, reason: "Comandă greșită",
        status: "Cerere trimisă", requestedAt: "2026-10-16", pickedUpAt: null, completedAt: null,
        note: "Așteptăm confirmarea furnizorului și programarea ridicării."
      },
      {
        id: "ret-14", code: "RET-014", partId: "p-10", qty: 1, reason: "Piesă incompatibilă cu modelul",
        status: "Așteaptă ridicare", requestedAt: "2026-10-15", pickedUpAt: null, completedAt: null,
        note: "Curierul este programat pentru ridicare; piesa este ambalată în zona retur."
      },
      {
        id: "ret-12", code: "RET-012", partId: "p-09", qty: 1, reason: "Piesă deteriorată la transport",
        status: "Ridicat", requestedAt: "2026-10-12", pickedUpAt: "2026-10-14", completedAt: null,
        note: "Ambalajul a fost fotografiat la recepție; așteptăm confirmarea furnizorului."
      },
      {
        id: "ret-11", code: "RET-011", partId: "p-20", qty: 1, reason: "Nu se potrivește modelului",
        status: "Finalizat", requestedAt: "2026-10-07", pickedUpAt: "2026-10-08", completedAt: "2026-10-09",
        note: "Filtrul a fost ridicat de curier și creditat pe factura următoare."
      }
    ]
  };

  /* -----------------------------------------------------------------------
     Iconografie SVG locală, fără biblioteci externe
     ----------------------------------------------------------------------- */
  const svg = (paths, extra = "") =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${paths}</svg>`;

  const ICONS = {
    /* Lucide Warehouse (ISC), SVG local: https://lucide.dev/icons/warehouse.
       Copyright (c) Lucide Contributors. Permission to use, copy, modify,
       and/or distribute this software for any purpose with or without fee is
       hereby granted, provided that the above copyright notice and this
       permission notice appear in all copies. THE SOFTWARE IS PROVIDED "AS IS"
       AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE
       INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO
       EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR
       CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF
       USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
       OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
       PERFORMANCE OF THIS SOFTWARE. */
    warehouse: svg('<path d="M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11"/><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z"/><path d="M6 13h12M6 17h12"/>', 'class="lucide lucide-warehouse"'),
    cube: svg('<path d="M12 3 3.8 7.5v9L12 21l8.2-4.5v-9L12 3Z"/><path d="M3.8 7.5 12 12l8.2-4.5M12 12v9"/>'),
    tag: svg('<path d="M20 13 13 20 4 11V4h7l9 9Z"/><circle cx="7.5" cy="7.5" r="1.2"/>'),
    wallet: svg('<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="M4 8h15M15.5 12.5h3"/>'),
    rotate: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
    car: svg('<path d="m5 16-1-4 2.2-4.5A2 2 0 0 1 8 6h8a2 2 0 0 1 1.8 1.5L20 12l-1 4"/><path d="M4 16h16M7 19h.01M17 19h.01"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>'),
    alert: svg('<path d="m12 3 9 17H3L12 3Z"/><path d="M12 9v5M12 17h.01"/>'),
    file: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
    edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>'),
    box: svg('<path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    check: svg('<path d="m5 12 4 4L19 6"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    trash: svg('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>')
  };

  /* -----------------------------------------------------------------------
     Configurația registrelor și stările de business
     ----------------------------------------------------------------------- */
  const TAB_META = {
    parts: {
      title: "Piese",
      subtitle: "Toate pozițiile intrate din facturile de furnizori.",
      searchPlaceholder: "Caută piesă, cod, număr auto, factură sau furnizor…",
      detailTitle: "Detalii piesă",
      detailEyebrow: "Registru · Piese",
      emptyTitle: "Nicio piesă selectată",
      emptyText: "Alege o piesă din tabel pentru a vedea furnizorul, factura, atribuirea și istoricul.",
      footerHint: "Selectează un rând pentru detalii",
      statusAll: "Toate statusurile",
      countLabel: (n) => (n === 1 ? "poziție" : "poziții")
    },
    unassigned: {
      title: "De atribuit",
      subtitle: "Poziții cu bucăți încă nealocate, inclusiv atribuiri parțiale.",
      searchPlaceholder: "Caută piesă, cod, factură sau furnizor…",
      detailTitle: "Detalii piesă",
      detailEyebrow: "Registru · De atribuit",
      emptyTitle: "Nicio piesă selectată",
      emptyText: "Alege o piesă din lista de atribuit pentru a verifica factura și furnizorul.",
      footerHint: "Selectează poziții pentru a atribui cantitățile rămase",
      statusAll: "Toate statusurile",
      countLabel: (n) => (n === 1 ? "poziție" : "poziții")
    },
    invoices: {
      title: "Facturi",
      subtitle: "Documentele de achiziție și stadiul lor fizic.",
      searchPlaceholder: "Caută număr factură, furnizor sau status…",
      detailTitle: "Detalii factură",
      detailEyebrow: "Registru · Facturi",
      emptyTitle: "Nicio factură selectată",
      emptyText: "Alege o factură pentru a vedea furnizorul, valoarea și piesele aferente.",
      footerHint: "Selectează o factură pentru detalii",
      statusAll: "Toate documentele",
      countLabel: (n) => (n === 1 ? "factură" : "facturi")
    },
    suppliers: {
      title: "Furnizori",
      subtitle: "Partenerii de la care intră piesele și facturile.",
      searchPlaceholder: "Caută furnizor, CUI, oraș sau persoană de contact…",
      detailTitle: "Detalii furnizor",
      detailEyebrow: "Registru · Furnizori",
      emptyTitle: "Niciun furnizor selectat",
      emptyText: "Alege un furnizor pentru a vedea datele de contact și facturile asociate.",
      footerHint: "Selectează un furnizor pentru detalii",
      statusAll: "Toate statusurile",
      countLabel: (n) => (n === 1 ? "furnizor" : "furnizori")
    },
    returns: {
      title: "Retururi",
      subtitle: "Cererile de retur și stadiul ridicării către furnizori.",
      searchPlaceholder: "Caută retur, piesă, factură, furnizor sau motiv…",
      detailTitle: "Detalii retur",
      detailEyebrow: "Registru · Retururi",
      emptyTitle: "Niciun retur selectat",
      emptyText: "Alege un retur pentru a vedea motivul, piesele și pașii până la finalizare.",
      footerHint: "Selectează un retur pentru detalii",
      statusAll: "Toate retururile",
      countLabel: (n) => (n === 1 ? "retur" : "retururi")
    }
  };

  const STATUS_TONES = {
    "Neatribuită": "warning",
    "Atribuită": "info",
    "Montată": "success",
    "Retur inițiat": "danger",
    "Returnată": "muted",
    "În firmă": "info",
    "Pregătită pentru contabilitate": "warning",
    "Trimisă în contabilitate": "success",
    "Cerere trimisă": "info",
    "Așteaptă ridicare": "warning",
    "Ridicat": "accent",
    "Finalizat": "success"
  };

  const STATUS_ORDER = [
    "Neatribuită", "Atribuită", "Montată", "Retur inițiat", "Returnată",
    "În firmă", "Pregătită pentru contabilitate", "Trimisă în contabilitate",
    "Cerere trimisă", "Așteaptă ridicare", "Ridicat", "Finalizat"
  ];

  const state = {
    tab: "parts",
    search: "",
    status: "all",
    supplier: "all",
    assignment: "all",
    selectedId: null,
    checkedPartIds: new Set(),
    lastFocused: null
  };

  const els = {};
  const invoiceUi = {
    lineSeq: 0,
    trigger: null,
    saving: false,
    toastTimer: 0,
    datePicker: null,
    lastDateValue: "",
    entryStartedAt: null,
    entryTimer: 0
  };

  const supplierUi = {
    editingId: null,
    trigger: null,
    saving: false,
    bankSeq: 0
  };

  const assignmentUi = {
    mode: "assign",
    modelPlate: null,
    allocationIndex: null,
    source: "part",
    partIds: [],
    trigger: null,
    saving: false
  };

  const returnUi = { partId: null, editingId: null, expectedStatus: null, trigger: null, saving: false };
  /* Starea formularului de trimitere, fără recepție sau integrare de stoc. */
  const warehouseUi = { partId: null, invoiceId: null, sources: null, trigger: null, saving: false };
  const dfUi = { plate: "", contextPartId: null, rows: new Map(), selection: new Map(), trigger: null, saving: false };

  /* -----------------------------------------------------------------------
     Helperi de formatare, căutare și acces la date
     ----------------------------------------------------------------------- */
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
  const toCents = (value) => Math.round((Number(value) + Number.EPSILON) * 100);

  const formatMoney = (value, decimals = 2) =>
    `${new Intl.NumberFormat("ro-RO", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)} lei`;

  const formatVatPercent = (rate) =>
    new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 2 }).format(rate);

  const formatDate = (iso) => {
    if (!iso) return "—";
    const [year, month, day] = iso.split("-");
    return `${day}.${month}.${year}`;
  };

  const isValidISODate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };

  const parseRomanianDate = (value) => {
    const match = String(value ?? "").trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!match) return null;
    const iso = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    return isValidISODate(iso) ? iso : null;
  };

  const normalizePlate = (value) => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const isValidAssignmentPlate = (value) =>
    /^[A-Z0-9]{4,12}$/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);

  const normalizeInvoiceNumber = (value) => String(value ?? "").trim().replace(/\s+/g, " ").toUpperCase();
  const invoiceNumberKey = (value) => normalizeInvoiceNumber(value);

  const formatPartName = (value) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toLocaleUpperCase("ro-RO") + trimmed.slice(1);
  };

  const partVatPercent = (part) => {
    const stored = Number(part.vatRate);
    return Number.isFinite(stored) && stored >= 0 ? stored : LEGACY_VAT_RATE * 100;
  };
  const partVatRate = (part) => partVatPercent(part) / 100;
  const lineGrossCents = (part) => part.qty * toCents(part.price);
  const vatLabelForRates = (rates) =>
    rates.length === 1 ? `TVA inclus (${formatVatPercent(rates[0])}%)` : "TVA inclus (cote mixte)";

  const nextEntityId = (prefix, records, pad = 0) => {
    const used = new Set(records.map((record) => record.id));
    let index = 1;
    let candidate = "";
    do {
      candidate = `${prefix}${String(index).padStart(pad, "0")}`;
      index += 1;
    } while (used.has(candidate));
    return candidate;
  };

  const normalize = (value) => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const matchesQuery = (fields, query) => {
    const cleanQuery = normalize(query).trim();
    if (!cleanQuery) return true;
    const haystack = normalize(fields.filter(Boolean).join(" "));
    if (haystack.includes(cleanQuery)) return true;
    const compact = (text) => text.replace(/[\s\-./]/g, "");
    return compact(haystack).includes(compact(cleanQuery));
  };

  const addDays = (iso, days) => {
    const date = new Date(`${iso}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };

  const daysSince = (iso) => {
    const start = Date.parse(`${iso}T12:00:00Z`);
    const end = Date.parse(`${DEMO_TODAY}T12:00:00Z`);
    return Math.max(0, Math.round((end - start) / 86400000));
  };

  const supplierById = (id) => DATA.suppliers.find((supplier) => supplier.id === id) || null;

  const supplierBankAccounts = (supplier) => {
    if (Array.isArray(supplier?.bankAccounts)) {
      return supplier.bankAccounts
        .map((account) => ({
          iban: String(account?.iban ?? "").trim(),
          bank: String(account?.bank ?? "").trim()
        }))
        .filter((account) => account.iban || account.bank);
    }
    const iban = String(supplier?.iban ?? "").trim();
    return iban ? [{ iban, bank: "" }] : [];
  };

  const normalizeSupplierCui = (value) => String(value ?? "").replace(/\s+/g, "").toUpperCase();
  const normalizeSupplierRegCom = (value) => String(value ?? "").trim().toUpperCase();
  const normalizeSupplierIban = (value) => String(value ?? "").replace(/\s+/g, "").toUpperCase();

  const SUPPLIER_FIELD_NORMALIZERS = {
    cui: normalizeSupplierCui,
    regcom: normalizeSupplierRegCom,
    iban: normalizeSupplierIban
  };

  const normalizeSupplierField = (input, preserveCaret = true) => {
    const normalizer = SUPPLIER_FIELD_NORMALIZERS[input?.dataset?.normalize];
    if (!normalizer) return false;

    const previous = input.value;
    const next = normalizer(previous);
    if (next === previous) return false;

    const start = input.selectionStart;
    input.value = next;

    if (preserveCaret && document.activeElement === input && start !== null) {
      const caret = Math.min(normalizer(previous.slice(0, start)).length, next.length);
      input.setSelectionRange(caret, caret);
    }
    return true;
  };

  const supplierCuiKey = (value) => normalizeSupplierCui(value);
  const isValidSupplierEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const invoiceById = (id) => DATA.invoices.find((invoice) => invoice.id === id) || null;
  const partById = (id) => DATA.parts.find((part) => part.id === id) || null;
  const returnsForPart = (partId) => DATA.returns.filter((item) => item.partId === partId);
  const partsForInvoice = (invoiceId) => DATA.parts.filter((part) => part.invoiceId === invoiceId);

  // Compatibilitate cu liniile DEMO vechi, care aveau o singură mașină.
  const allocationsForPart = (part) => Array.isArray(part.allocations)
    ? part.allocations
    : part.plate ? [{ plate: normalizePlate(part.plate), model: part.model || null, qty: part.qty }] : [];
  const allocatedQty = (part) => allocationsForPart(part).reduce((sum, allocation) => sum + allocation.qty, 0);
  // Alocările se adaugă sau se corectează pe loc; nu se șterg/reordonează.
  // Cheia compusă identifică stabil sursa atât în registru, cât și în import.
  const allocationId = (part, index) => `${part.id}:allocation:${index}`;
  const importsForPart = (partId) => DATA.dfImports.filter((entry) => entry.partId === partId);
  /* Magazia rezervă sursa originală; alocările nu se reduc și nu se reordonează. */
  const warehouseForPart = (partId) => DATA.warehouseTransfers.filter((entry) => entry.partId === partId);
  const warehouseQty = (part, source = null) => warehouseForPart(part.id)
    .filter((entry) => !source || (entry.source.type === source.type
      && (source.type !== "allocation" || entry.source.allocationIndex === source.allocationIndex)))
    .reduce((sum, entry) => sum + entry.qty, 0);
  const allocationWarehouseQty = (part, index) => warehouseQty(part, { type: "allocation", allocationIndex: index });
  const allocationImportedQty = (part, index) => importsForPart(part.id)
    .filter((entry) => entry.allocationId === allocationId(part, index)).reduce((sum, entry) => sum + entry.qty, 0);
  const demoImportedQty = (part) => importsForPart(part.id).reduce((sum, entry) => sum + entry.qty, 0);
  const dfEligibleQty = (part, index) => part.df ? 0
    : (allocationsForPart(part)[index]?.qty || 0) - allocationReturnQty(part, index) - allocationImportedQty(part, index) - allocationWarehouseQty(part, index);
  const partDfEligibleQty = (part) => allocationsForPart(part).reduce((sum, allocation, index) => sum + dfEligibleQty(part, index), 0);
  // Alocările păstrează asocierea istorică. Retururile consumă disponibilul
  // sursei lor chiar de la cerere, inclusiv după finalizare (fără dublă scădere).
  const returnSource = (item) => item.source || { type: "unallocated" };
  const returnCommittedQty = (part, source = null) => returnsForPart(part.id)
    .filter((item) => !source || (returnSource(item).type === source.type
      && (source.type !== "allocation" || returnSource(item).allocationIndex === source.allocationIndex)))
    .reduce((sum, item) => sum + item.qty, 0);
  const reservedQty = (part) => returnsForPart(part.id).filter((item) => item.status !== "Finalizat").reduce((sum, item) => sum + item.qty, 0);
  const returnedQty = (part) => returnsForPart(part.id).filter((item) => item.status === "Finalizat").reduce((sum, item) => sum + item.qty, 0);
  const allocationReturnQty = (part, index) => returnCommittedQty(part, { type: "allocation", allocationIndex: index });
  const availableAllocatedQty = (part) => allocatedQty(part) - allocationsForPart(part).reduce((sum, allocation, index) => sum + allocationReturnQty(part, index) + allocationWarehouseQty(part, index), 0);
  const remainingQty = (part) => part.qty - allocatedQty(part) - returnCommittedQty(part, { type: "unallocated" }) - warehouseQty(part, { type: "unallocated" });
  const returnCapacity = (part, source) => source.type === "unallocated" ? remainingQty(part)
    : source.type === "allocation" && Number.isInteger(source.allocationIndex)
      ? (allocationsForPart(part)[source.allocationIndex]?.qty || 0) - allocationReturnQty(part, source.allocationIndex) - allocationImportedQty(part, source.allocationIndex) - allocationWarehouseQty(part, source.allocationIndex) : 0;
  const returnableQty = (part) => remainingQty(part) + availableAllocatedQty(part) - demoImportedQty(part);
  const allocationCapacity = (part, mode, index) => remainingQty(part)
    + (mode === "reassign" ? allocationsForPart(part)[index]?.qty || 0 : 0);

  /* Eligibilitatea magaziei exclude DF istoric, montaj, retur și orice rezervare anterioară. */
  const warehouseCapacity = (part, source) => !part || part.df || part.status === "Montată" || !source ? 0 : Math.max(0, returnCapacity(part, source));
  const warehouseSources = (part) => [
    { value: "unallocated", source: { type: "unallocated" } },
    ...allocationsForPart(part).map((allocation, index) => ({ value: `allocation:${index}`, source: { type: "allocation", allocationIndex: index } }))
  ];
  const warehouseEligibleQty = (part) => !part ? 0 : warehouseSources(part).reduce((sum, entry) => sum + warehouseCapacity(part, entry.source), 0);
  /* Exclusiv prezentare: destinații disjuncte, fără schimbarea disponibilului de business.
     Atribuite exclude DF, retur și magazie; DF istoric folosește asocierea păstrată. */
  const partQuantityDisplay = (part) => ({
    assigned: part.df ? 0 : availableAllocatedQty(part) - demoImportedQty(part),
    unassigned: remainingQty(part),
    warehouse: warehouseQty(part),
    returning: reservedQty(part),
    returned: returnedQty(part),
    imported: part.df ? availableAllocatedQty(part) : demoImportedQty(part)
  });
  const quantityDisplayLabels = {
    assigned: "Atribuite", warehouse: "Spre magazie", unassigned: "De atribuit",
    returning: "În retur", returned: "Returnate", imported: "Importate în DF"
  };
  const quantityDisplayEntries = (quantities) => Object.entries(quantityDisplayLabels)
    .filter(([key]) => quantities[key] > 0).map(([key, label]) => ({ key, label, qty: quantities[key] }));
  const quantityDisplayText = (quantities) => quantityDisplayEntries(quantities)
    .map(({ label, qty }) => `${label}: ${qty} buc.`).join(" · ");
  const allocationSummary = (part) => quantityDisplayText(partQuantityDisplay(part));
  /* Totalul de factură agregă doar prezentarea, nu recalculă prețuri sau eligibilitate. */
  const invoiceQuantityDisplay = (parts) => parts.reduce((totals, part) => {
    Object.entries(partQuantityDisplay(part)).forEach(([key, qty]) => { totals[key] = (totals[key] || 0) + qty; });
    return totals;
  }, {});
  const quantityDetailRows = (quantities) => quantityDisplayEntries(quantities)
    .map(({ key, label, qty }) => detailRow(label, `${qty} buc.`, key === "warehouse" ? "ep-warehouse-text" : "")).join("");
  /* Facturi: vocabularul și ordinea pieselor rămân distincte de statusul hârtiei. */
  const invoicePartsRows = (quantities) => [
    ["assigned", "Atribuite la mașini"], ["imported", "Importate în DF"],
    ["warehouse", "Spre magazie"], ["returning", "În retur"],
    ["returned", "Returnate"], ["unassigned", "De atribuit"]
  ].filter(([key]) => quantities[key] > 0)
    .map(([key, label]) => detailRow(label, `${quantities[key]} buc.`, key === "warehouse" ? "ep-warehouse-text" : "")).join("");
  /* Informare fără scriere: alocarea nu confirmă DF-ul, iar fotocopiile nu sunt urmărite în DEMO. */
  const invoiceDocumentNotice = (invoice, quantities) => INVOICE_STATUSES.slice(1).includes(invoice.status)
    && ["assigned", "unassigned", "returning", "warehouse"].some((key) => quantities[key] > 0)
    ? "Există cantități încă de urmărit. Verifică DF-urile și fotocopiile înainte de predare; statusul ales manual nu a fost modificat."
    : "";
  const allocationDisplayText = (part, index) => {
    const allocation = allocationsForPart(part)[index];
    const records = returnsForPart(part.id).filter((entry) => returnSource(entry).type === "allocation" && returnSource(entry).allocationIndex === index);
    const quantities = {
      assigned: part.df ? 0 : dfEligibleQty(part, index),
      warehouse: allocationWarehouseQty(part, index),
      returning: records.filter((entry) => entry.status !== "Finalizat").reduce((sum, entry) => sum + entry.qty, 0),
      returned: records.filter((entry) => entry.status === "Finalizat").reduce((sum, entry) => sum + entry.qty, 0),
      imported: part.df ? allocation.qty - allocationReturnQty(part, index) - allocationWarehouseQty(part, index) : allocationImportedQty(part, index)
    };
    return [allocation.model, quantityDisplayText(quantities)].filter(Boolean).join(" · ");
  };
  const returnSourceLabel = (item) => {
    const source = returnSource(item);
    return source.type === "allocation" ? `Alocare ${source.allocationIndex + 1} · ${source.plate || "Mașină nespecificată"}${source.model ? ` · ${source.model}` : ""}` : "Cantitate nealocată";
  };
  const returnStageDate = (item, status) => item.history?.find((entry) => entry.status === status)?.date
    || ({ "Cerere trimisă": item.requestedAt, "Așteaptă ridicare": item.waitingAt, "Ridicat": item.pickedUpAt, "Finalizat": item.completedAt }[status]) || null;

  // Repere exclusiv de prezentare pentru notele fictive inițiale. Textul notei
  // și istoricul rămân intacte; notele noi/editate nu sunt reclasificate.
  const recordedNoteState = (part) => JSON.stringify({
    allocations: allocationsForPart(part).map((allocation) => [normalizePlate(allocation.plate), allocation.qty, allocation.model || null]),
    returns: returnsForPart(part.id).map((item) => [item.id, item.status, item.qty]),
    imports: importsForPart(part.id).map((entry) => [entry.reference, entry.qty]),
    warehouse: warehouseForPart(part.id).map((entry) => [entry.id, entry.qty])
  });
  const demoPartNoteSnapshots = new Map(DATA.parts.map((part) => [part.id, { note: part.note, state: recordedNoteState(part) }]));
  const invoiceNoteState = (invoice) => JSON.stringify(partsForInvoice(invoice.id).map((part) => [part.id, recordedNoteState(part)]));
  const demoInvoiceNoteSnapshots = new Map(DATA.invoices.map((invoice) => [invoice.id, { note: invoice.note, state: invoiceNoteState(invoice) }]));
  const renderRecordedNote = (note, snapshot, currentState) => {
    if (!note) return "";
    const content = `<p class="ep-detail-note ep-preserved-note">${escapeHTML(note)}</p>`;
    return snapshot?.note === note && snapshot.state !== currentState
      ? `<details class="ep-note-history"><summary>Observație de la înregistrare · istoric</summary>${content}</details>`
      : content;
  };

  const byDateDesc = (a, b) => b.date.localeCompare(a.date);

  /* Prețurile introduse sunt considerate cu TVA inclus, conform regulii DEMO.
     TVA-ul se extrage din gross, grupat pe cotă, folosind calcule în bani (centi).
     Piesele istorice fără vatRate păstrează cota DEMO existentă de 19%. */
  const invoiceTotals = (invoiceId) => {
    const parts = partsForInvoice(invoiceId);
    const grossByRate = new Map();
    let totalCents = 0;

    parts.forEach((part) => {
      const rate = partVatPercent(part);
      const grossCents = lineGrossCents(part);
      totalCents += grossCents;
      grossByRate.set(rate, (grossByRate.get(rate) || 0) + grossCents);
    });

    let subtotalCents = 0;
    let vatCents = 0;
    grossByRate.forEach((grossCents, rate) => {
      const netCents = Math.round(grossCents / (1 + rate / 100));
      subtotalCents += netCents;
      vatCents += grossCents - netCents;
    });

    return {
      count: parts.length,
      assigned: parts.filter((part) => availableAllocatedQty(part) === part.qty).length,
      partial: parts.filter((part) => availableAllocatedQty(part) > 0 && availableAllocatedQty(part) < part.qty).length,
      units: parts.reduce((sum, part) => sum + part.qty, 0),
      allocatedUnits: parts.reduce((sum, part) => sum + availableAllocatedQty(part), 0),
      remainingUnits: parts.reduce((sum, part) => sum + remainingQty(part), 0),
      remainingPositions: parts.filter((part) => remainingQty(part) > 0).length,
      reservedUnits: parts.reduce((sum, part) => sum + reservedQty(part), 0),
      returnedUnits: parts.reduce((sum, part) => sum + returnedQty(part), 0),
      warehouseUnits: parts.reduce((sum, part) => sum + warehouseQty(part), 0),
      demoImportedUnits: parts.reduce((sum, part) => sum + demoImportedQty(part), 0),
      dfEligibleUnits: parts.reduce((sum, part) => sum + partDfEligibleQty(part), 0),
      legacyDfPositions: parts.filter((part) => Boolean(part.df)).length,
      subtotal: subtotalCents / 100,
      vat: vatCents / 100,
      total: totalCents / 100,
      rates: [...grossByRate.keys()].sort((a, b) => a - b)
    };
  };

  const supplierTotals = (supplierId) => {
    const invoices = DATA.invoices.filter((invoice) => invoice.supplierId === supplierId);
    const parts = DATA.parts.filter((part) => invoices.some((invoice) => invoice.id === part.invoiceId));
    const totals = invoices.map((invoice) => invoiceTotals(invoice.id));
    const subtotal = totals.reduce((sum, item) => sum + item.subtotal, 0);
    const total = totals.reduce((sum, item) => sum + item.total, 0);
    return { invoices: invoices.length, parts: parts.length, subtotal: round2(subtotal), total: round2(total) };
  };

  const getCounts = () => ({
    parts: DATA.parts.length,
    unassigned: DATA.parts.filter((part) => remainingQty(part) > 0).length,
    invoices: DATA.invoices.length,
    suppliers: DATA.suppliers.length,
    returns: DATA.returns.length
  });

  const statusBadge = (status) => {
    const tone = STATUS_TONES[status] || "muted";
    return `<span class="ep-badge ep-badge--${tone}">${escapeHTML(status)}</span>`;
  };

  const detailRow = (label, valueHTML, valueClass = "") =>
    `<div class="ep-detail-row"><span>${escapeHTML(label)}</span><strong class="${valueClass}">${valueHTML}</strong></div>`;

  /* Status cantitativ: violet doar pentru magazie, cu defalcare când linia este mixtă. */
  const partStatusMarkup = (part) => !warehouseQty(part) ? statusBadge(part.status)
    : `<span class="ep-badge ep-warehouse-badge">${warehouseQty(part) < part.qty ? "Cantități mixte" : "Trimis în magazie"}</span>`;

  /* Istoricul expedierilor afișează sursa și data reale ale acțiunii DEMO. */
  const warehouseHistory = (records) => records.length ? `<section class="ep-detail-section ep-warehouse-history">
    <h4>Trimis în magazie · ${records.reduce((sum, entry) => sum + entry.qty, 0)} buc.</h4>
    <div class="ep-detail-card">${records.map((entry) => `<div class="ep-warehouse-record">
      <strong>${escapeHTML(entry.reference)} · ${entry.qty} buc.</strong>
      <small>${escapeHTML(partById(entry.partId)?.name || "")} · ${escapeHTML(returnSourceLabel(entry))}</small>
      <time datetime="${escapeHTML(entry.createdAt)}">${escapeHTML(new Date(entry.createdAt).toLocaleString("ro-RO"))}</time>
      ${entry.notes ? `<p>${escapeHTML(entry.notes)}</p>` : ""}
    </div>`).join("")}</div></section>` : "";

  const partHaystack = (part) => {
    const invoice = invoiceById(part.invoiceId);
    const supplier = invoice ? supplierById(invoice.supplierId) : null;
    return [
      part.name, part.code, part.qty, part.price, part.status,
      ...allocationsForPart(part).flatMap((allocation) => [allocation.plate, allocation.model]),
      ...returnsForPart(part.id).flatMap((item) => [item.code, item.reference, item.reason, item.status, returnSourceLabel(item)]),
      ...importsForPart(part.id).flatMap((entry) => [entry.reference, entry.plate, entry.allocationId]),
      ...warehouseForPart(part.id).flatMap((entry) => ["Trimis în magazie", entry.reference, entry.notes, returnSourceLabel(entry)]),
      part.df, part.location, part.note, invoice?.number, invoice?.date && formatDate(invoice.date),
      supplier?.name
    ];
  };

  const invoiceHaystack = (invoice) => {
    const supplier = supplierById(invoice.supplierId);
    return [invoice.number, invoice.date && formatDate(invoice.date), invoice.status, invoice.note, supplier?.name,
      ...DATA.dfImports.filter((entry) => entry.invoiceId === invoice.id).flatMap((entry) => [entry.reference, entry.plate]),
      ...DATA.warehouseTransfers.filter((entry) => entry.invoiceId === invoice.id).flatMap((entry) => ["Trimis în magazie", entry.reference, entry.notes, returnSourceLabel(entry)])];
  };

  const supplierHaystack = (supplier) => {
    const accounts = supplierBankAccounts(supplier);
    return [
      supplier.name, supplier.cui, supplier.regCom, supplier.city, supplier.address,
      supplier.phone, supplier.email, supplier.contact, supplier.iban, supplier.notes,
      ...accounts.flatMap((account) => [account.iban, account.bank])
    ];
  };

  const returnHaystack = (item) => {
    const part = partById(item.partId);
    const invoice = part ? invoiceById(part.invoiceId) : null;
    const supplier = invoice ? supplierById(invoice.supplierId) : null;
    return [
      item.code, item.reference, item.status, item.reason, item.note, item.qty, returnSourceLabel(item), part?.name, part?.code,
      invoice?.number, supplier?.name
    ];
  };

  /* -----------------------------------------------------------------------
     Selectarea rândurilor, filtrele și tabelul activ
     ----------------------------------------------------------------------- */
  const partSort = (a, b) => {
    const invoiceA = invoiceById(a.invoiceId);
    const invoiceB = invoiceById(b.invoiceId);
    return invoiceB.date.localeCompare(invoiceA.date) || a.name.localeCompare(b.name, "ro");
  };

  const getBaseRows = () => {
    switch (state.tab) {
      case "unassigned":
        return DATA.parts.filter((part) => remainingQty(part) > 0).sort(partSort);
      case "invoices":
        return [...DATA.invoices].sort(byDateDesc);
      case "suppliers":
        return [...DATA.suppliers].sort((a, b) => a.name.localeCompare(b.name, "ro"));
      case "returns":
        return [...DATA.returns].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
      case "parts":
      default:
        return [...DATA.parts].sort(partSort);
    }
  };

  const getVisibleRows = () => {
    const rows = getBaseRows();

    if (state.tab === "parts" || state.tab === "unassigned") {
      return rows.filter((part) => {
        const invoice = invoiceById(part.invoiceId);
        if (state.supplier !== "all" && invoice?.supplierId !== state.supplier) return false;
        if (state.tab === "parts") {
          if (state.status !== "all" && part.status !== state.status) return false;
          if (state.assignment === "assigned" && availableAllocatedQty(part) !== part.qty) return false;
          if (state.assignment === "unassigned" && remainingQty(part) === 0) return false;
        }
        return matchesQuery(partHaystack(part), state.search);
      });
    }

    if (state.tab === "invoices") {
      return rows.filter((invoice) => {
        if (state.supplier !== "all" && invoice.supplierId !== state.supplier) return false;
        if (state.status !== "all" && invoice.status !== state.status) return false;
        return matchesQuery(invoiceHaystack(invoice), state.search);
      });
    }

    if (state.tab === "suppliers") {
      return rows.filter((supplier) => matchesQuery(supplierHaystack(supplier), state.search));
    }

    return rows.filter((item) => {
      const part = partById(item.partId);
      const invoice = part ? invoiceById(part.invoiceId) : null;
      if (state.supplier !== "all" && invoice?.supplierId !== state.supplier) return false;
      if (state.status !== "all" && item.status !== state.status) return false;
      return matchesQuery(returnHaystack(item), state.search);
    });
  };

  const TABLE_COLUMNS = {
    parts: ["", "Piesă / cod", "Factură", "Furnizor", "Mașină atribuită", "Preț achiziție", "Status", "Deviz"],
    invoices: ["", "Factură", "Furnizor", "Poziții / bucăți", "Situația pieselor", "Valoare factură", "Document fizic"],
    suppliers: ["", "Furnizor", "CUI", "Contact", "Facturi", "Poziții", "Valoare"],
    returns: ["", "Retur", "Piesă", "Factură", "Furnizor", "Cant.", "Motiv", "Status"]
  };

  const selectButton = (id, label) =>
    `<button type="button" class="ep-row-select" tabindex="-1" data-select-id="${escapeHTML(id)}" aria-label="${escapeHTML(label)}" title="Selectează rândul">${ICONS.check}</button>`;

  const bulkCheckbox = (part) => {
    const invoice = invoiceById(part.invoiceId);
    const checked = state.checkedPartIds.has(part.id);
    return `<input type="checkbox" class="ep-row-check" data-bulk-part="${escapeHTML(part.id)}"
      aria-label="Selectează ${escapeHTML(part.name)} din factura ${escapeHTML(invoice?.number || "—")}: ${remainingQty(part)} buc. rămase"${checked ? " checked" : ""}${part.df ? ' disabled title="Atribuire blocată de referința DF"' : ""}>`;
  };

  const assignmentBlockReason = (part, mode, source, allocationIndex = null) => {
    if (!part) return "Poziția selectată nu mai există în memoria DEMO.";
    if (part.df) return `Asocierea este blocată de referința ${part.df}. Referințele DF nu pot fi modificate sau șterse în acest DEMO.`;
    if (mode === "reassign") {
      if (!Number.isInteger(allocationIndex) || !allocationsForPart(part)[allocationIndex]) return "Selectează alocarea pe care dorești să o corectezi.";
      if (allocationReturnQty(part, allocationIndex) > 0) return "Alocarea are cantități rezervate sau returnate. Asocierea se păstrează pentru trasabilitatea retururilor și nu poate fi corectată.";
      if (allocationImportedQty(part, allocationIndex) > 0) return "Alocarea are importuri DEMO DF. Asocierea și cantitatea sunt protejate pentru trasabilitatea importurilor.";
      if (allocationWarehouseQty(part, allocationIndex) > 0) return "Alocarea are cantități trimise în magazie. Asocierea și cantitatea sunt protejate pentru trasabilitatea transferurilor.";
      return "";
    }
    if (remainingQty(part) <= 0) return `Piesa ${part.name} nu mai are bucăți disponibile pentru atribuire.`;
    return "";
  };

  const plateCell = (part) => {
    const allocations = allocationsForPart(part);
    /* În tabel păstrăm numerele auto; cantitățile apar o singură dată, pe linie. */
    return `<span class="ep-allocation-list">${allocations.map((allocation) =>
      `<span class="ep-plate-cell"><span class="ep-plate">${escapeHTML(allocation.plate)}</span></span>`
    ).join("")}<small class="ep-allocation-summary">${allocationSummary(part)}</small></span>`;
  };

  const priceCell = (part) => {
    const total = lineGrossCents(part) / 100;
    const detail = part.qty > 1
      ? `${part.qty} × ${formatMoney(part.price)} cu TVA`
      : "cu TVA";
    return `<span class="ep-money">${formatMoney(total)}<small>${detail}</small></span>`;
  };

  const dfReferences = (records) => [...new Set(records.map((entry) => entry.reference))].map((reference) =>
    `<button type="button" class="ep-df-link" data-action="view-demo-df" data-id="${escapeHTML(reference)}">${escapeHTML(reference)}</button>`).join("");

  const dfReferenceCell = (part) => `<span class="ep-allocation-list">${part.df ? `<span class="ep-df">${escapeHTML(part.df)} · istoric</span>` : ""}
    ${dfReferences(importsForPart(part.id))}${!part.df && !importsForPart(part.id).length ? '<span class="ep-muted">—</span>' : ""}</span>`;

  const renderPartRow = (part) => {
    const invoice = invoiceById(part.invoiceId);
    const supplier = supplierById(invoice.supplierId);
    const selected = state.selectedId === part.id;
    const checked = state.tab === "unassigned" && state.checkedPartIds.has(part.id);
    const rowClasses = [selected ? "is-selected" : "", checked ? "is-checked" : ""].filter(Boolean).join(" ");
    const firstCell = state.tab === "unassigned"
      ? bulkCheckbox(part)
      : selectButton(part.id, `Selectează ${part.name}`);
    return `<tr data-id="${escapeHTML(part.id)}" tabindex="0" aria-selected="${selected}"${rowClasses ? ` class="${rowClasses}"` : ""}>
      <td class="ep-col-check">${firstCell}</td>
      <td><div class="ep-cell-stack"><strong>${escapeHTML(part.name)}</strong><span class="ep-code">${escapeHTML(part.code || "—")}</span></div></td>
      <td><div class="ep-invoice-cell"><strong>${escapeHTML(invoice.number)}</strong><small>${formatDate(invoice.date)}</small></div></td>
      <td><span class="ep-supplier-cell">${escapeHTML(supplier.name)}</span></td>
      <td>${plateCell(part)}</td>
      <td>${priceCell(part)}</td>
      <td>${partStatusMarkup(part)}</td>
      <td>${dfReferenceCell(part)}</td>
    </tr>`;
  };

  const renderInvoiceRow = (invoice) => {
    const supplier = supplierById(invoice.supplierId);
    const totals = invoiceTotals(invoice.id);
    const quantities = invoiceQuantityDisplay(partsForInvoice(invoice.id));
    const notice = invoiceDocumentNotice(invoice, quantities);
    const selected = state.selectedId === invoice.id;
    return `<tr data-id="${escapeHTML(invoice.id)}" tabindex="0" aria-selected="${selected}"${selected ? ' class="is-selected"' : ""}>
      <td class="ep-col-check">${selectButton(invoice.id, `Selectează factura ${invoice.number}`)}</td>
      <td><div class="ep-invoice-cell"><strong>${escapeHTML(invoice.number)}</strong><small>${formatDate(invoice.date)}</small></div></td>
      <td><span class="ep-supplier-cell">${escapeHTML(supplier.name)}</span></td>
      <td><div class="ep-cell-stack"><strong>${totals.count} ${totals.count === 1 ? "poziție" : "poziții"}</strong><small>${totals.units} buc.</small></div></td>
      <td><div class="ep-quantity-summary">${escapeHTML(quantityDisplayText(quantities))}</div></td>
      <td><span class="ep-money">${formatMoney(totals.total)}<small>cu TVA</small></span></td>
      <td><span class="ep-invoice-document-status">${statusBadge(invoice.status)}${notice ? `<span class="ep-invoice-notice-mark" tabindex="0" role="note" aria-label="${escapeHTML(notice)}" title="${escapeHTML(notice)}">${ICONS.info}</span>` : ""}</span></td>
    </tr>`;
  };

  const renderSupplierRow = (supplier) => {
    const totals = supplierTotals(supplier.id);
    const selected = state.selectedId === supplier.id;
    return `<tr data-id="${escapeHTML(supplier.id)}" tabindex="0" aria-selected="${selected}"${selected ? ' class="is-selected"' : ""}>
      <td class="ep-col-check">${selectButton(supplier.id, `Selectează furnizorul ${supplier.name}`)}</td>
      <td><div class="ep-cell-stack"><strong>${escapeHTML(supplier.name)}</strong><span class="ep-code">${escapeHTML(supplier.city || "—")}</span></div></td>
      <td><span class="ep-code">${escapeHTML(normalizeSupplierCui(supplier.cui) || "—")}</span></td>
      <td><div class="ep-cell-stack"><span class="ep-supplier-cell">${escapeHTML(supplier.phone || "—")}</span><span class="ep-code">${escapeHTML(supplier.email || "—")}</span></div></td>
      <td>${totals.invoices}</td>
      <td>${totals.parts}</td>
      <td><span class="ep-money">${formatMoney(totals.total)}<small>cu TVA</small></span></td>
    </tr>`;
  };

  const renderReturnRow = (item) => {
    const part = partById(item.partId);
    const invoice = part ? invoiceById(part.invoiceId) : null;
    const supplier = invoice ? supplierById(invoice.supplierId) : null;
    const selected = state.selectedId === item.id;
    return `<tr data-id="${escapeHTML(item.id)}" tabindex="0" aria-selected="${selected}"${selected ? ' class="is-selected"' : ""}>
      <td class="ep-col-check">${selectButton(item.id, `Selectează returul ${item.code}`)}</td>
      <td><div class="ep-invoice-cell"><strong>${escapeHTML(item.code)}</strong><small>${formatDate(item.requestedAt)}${item.reference ? ` · ${escapeHTML(item.reference)}` : ""}</small></div></td>
      <td><div class="ep-cell-stack"><strong>${escapeHTML(part?.name || "Piesă indisponibilă")}</strong><span class="ep-code">${escapeHTML(part?.code || "—")}</span></div></td>
      <td><span class="ep-invoice-cell"><strong>${escapeHTML(invoice?.number || "—")}</strong></span></td>
      <td><span class="ep-supplier-cell">${escapeHTML(supplier?.name || "—")}</span></td>
      <td><div class="ep-cell-stack"><strong>${item.qty} buc.</strong><small>${escapeHTML(returnSourceLabel(item))}</small></div></td>
      <td><span class="ep-supplier-cell">${escapeHTML(item.reason)}</span></td>
      <td>${statusBadge(item.status)}</td>
    </tr>`;
  };

  const renderRow = (row) => {
    if (state.tab === "invoices") return renderInvoiceRow(row);
    if (state.tab === "suppliers") return renderSupplierRow(row);
    if (state.tab === "returns") return renderReturnRow(row);
    return renderPartRow(row);
  };

  const emptyTableRow = (colspan) => `<tr class="ep-empty-row"><td colspan="${colspan}">
    <div class="ep-empty-table">
      ${ICONS.search}
      <strong>Nicio potrivire</strong>
      <span>Încearcă alt termen sau resetează filtrele active.</span>
      <button type="button" class="ep-button ep-button-ghost" data-action="reset-filters">Resetează filtrele</button>
    </div>
  </td></tr>`;

  const renderTable = (rows) => {
    const columns = state.tab === "unassigned" ? TABLE_COLUMNS.parts : TABLE_COLUMNS[state.tab];
    els.tableHead.innerHTML = `<tr>${columns.map((column, index) =>
      `<th scope="col"${index === 0 ? ' class="ep-col-check"' : ""}>${index === 0 ? '<span class="ep-sr-only">Selectează</span>' : escapeHTML(column)}</th>`
    ).join("")}</tr>`;
    els.tableBody.innerHTML = rows.length
      ? rows.map(renderRow).join("")
      : emptyTableRow(columns.length);
  };

  /* -----------------------------------------------------------------------
     Randarea antetului, indicatorilor și filtrelor
     ----------------------------------------------------------------------- */
  const renderTabs = () => {
    const counts = getCounts();
    els.tabs.querySelectorAll(".ep-tab").forEach((tab) => {
      const active = tab.dataset.tab === state.tab;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    els.tabs.querySelectorAll(".ep-tab-count").forEach((badge) => {
      const key = badge.dataset.count;
      badge.textContent = String(counts[key] ?? 0);
    });
    els.listPanel.setAttribute("aria-labelledby", `tab-${state.tab}`);
  };

  const kpiCard = (label, value, sub, icon, tone, valueClass = "") =>
    `<article class="ep-kpi ep-kpi--${tone}">
      <span class="ep-kpi-icon" aria-hidden="true">${ICONS[icon]}</span>
      <div class="ep-kpi-copy">
        <span>${escapeHTML(label)}</span>
        <strong class="${valueClass}">${escapeHTML(String(value))}</strong>
        <small>${escapeHTML(sub)}</small>
      </div>
    </article>`;

  const renderKpis = () => {
    const totalValue = DATA.parts.reduce((sum, part) => sum + lineGrossCents(part), 0) / 100;
    const unassigned = DATA.parts.filter((part) => remainingQty(part) > 0).length;
    const units = DATA.parts.reduce((sum, part) => sum + part.qty, 0);
    const remaining = DATA.parts.reduce((sum, part) => sum + remainingQty(part), 0);
    const openReturns = DATA.returns.filter((item) => item.status !== "Finalizat").length;
    els.kpiGrid.innerHTML = [
      kpiCard("Poziții înregistrate", DATA.parts.length, `${units} buc. · ${DATA.invoices.length} facturi · ${DATA.suppliers.length} furnizori`, "cube", "info"),
      kpiCard("Poziții de atribuit", unassigned, `${remaining} buc. rămase de alocat`, "tag", "warning"),
      kpiCard("Valoare achiziții", formatMoney(totalValue, 0), "cu TVA · estimare DEMO", "wallet", "success", "ep-kpi-money"),
      kpiCard("Retururi deschise", openReturns, `din ${DATA.returns.length} cereri înregistrate`, "rotate", "danger"),
      /* Al cincilea KPI numără bucăți trimise, nu poziții sau operații. */
      kpiCard("Piese spre magazie", DATA.warehouseTransfers.reduce((sum, entry) => sum + entry.qty, 0), "buc. trimise · sesiunea DEMO", "warehouse", "warehouse")
    ].join("");
  };

  const setSelectOptions = (select, options, selectedValue) => {
    select.innerHTML = options.map((option) =>
      `<option value="${escapeHTML(option.value)}">${escapeHTML(option.label)}</option>`
    ).join("");
    select.value = selectedValue;
  };

  const renderToolbar = () => {
    const meta = TAB_META[state.tab];
    els.searchInput.placeholder = meta.searchPlaceholder;
    els.searchInput.value = state.search;

    const supportsStatus = ["parts", "invoices", "returns"].includes(state.tab);
    const supportsSupplier = ["parts", "unassigned", "invoices", "returns"].includes(state.tab);
    const supportsAssignment = state.tab === "parts";

    els.statusFilter.hidden = !supportsStatus;
    els.supplierFilter.hidden = !supportsSupplier;
    els.assignmentFilter.hidden = !supportsAssignment;

    if (supportsStatus) {
      const rows = getBaseRows();
      const statuses = STATUS_ORDER.filter((status) => rows.some((row) => row.status === status));
      if (state.status !== "all" && !statuses.includes(state.status)) state.status = "all";
      setSelectOptions(els.statusFilter, [
        { value: "all", label: meta.statusAll },
        ...statuses.map((status) => ({ value: status, label: status }))
      ], state.status);
    } else {
      state.status = "all";
    }

    if (supportsSupplier) {
      if (state.supplier !== "all" && !DATA.suppliers.some((supplier) => supplier.id === state.supplier)) {
        state.supplier = "all";
      }
      setSelectOptions(els.supplierFilter, [
        { value: "all", label: "Toți furnizorii" },
        ...DATA.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))
      ], state.supplier);
    } else {
      state.supplier = "all";
    }

    if (supportsAssignment) {
      els.assignmentFilter.value = state.assignment;
    } else {
      state.assignment = "all";
    }
  };

  const pruneCheckedPartIds = () => {
    if (state.tab !== "unassigned") {
      state.checkedPartIds.clear();
      return;
    }
    const eligible = new Set(
      DATA.parts
        .filter((part) => remainingQty(part) > 0 && !part.df)
        .map((part) => part.id)
    );
    for (const id of [...state.checkedPartIds]) {
      if (!eligible.has(id)) state.checkedPartIds.delete(id);
    }
  };

  const renderBulkBar = () => {
    if (!els.bulkBar) return;
    const count = state.tab === "unassigned" ? state.checkedPartIds.size : 0;
    els.bulkBar.hidden = count === 0;
    const units = [...state.checkedPartIds].reduce((sum, id) => sum + (partById(id) ? remainingQty(partById(id)) : 0), 0);
    els.bulkCount.textContent = `${count} ${count === 1 ? "poziție selectată" : "poziții selectate"} · ${units} buc. de alocat`;
  };

  const syncBulkSelectionUI = () => {
    els.tableBody.querySelectorAll("[data-bulk-part]").forEach((checkbox) => {
      const checked = state.checkedPartIds.has(checkbox.dataset.bulkPart);
      checkbox.checked = checked;
      checkbox.closest("tr")?.classList.toggle("is-checked", checked);
    });
    renderBulkBar();
  };

  const clearBulkSelection = ({ focus = false } = {}) => {
    state.checkedPartIds.clear();
    syncBulkSelectionUI();
    if (focus) {
      const firstCheckbox = els.tableBody.querySelector("[data-bulk-part]");
      (firstCheckbox || els.searchInput).focus({ preventScroll: true });
    }
  };

  const renderList = () => {
    const meta = TAB_META[state.tab];
    pruneCheckedPartIds();
    const rows = getVisibleRows();
    const total = getBaseRows().length;

    els.listTitle.textContent = meta.title;
    els.listSubtitle.textContent = meta.subtitle;
    els.footerHint.textContent = meta.footerHint;
    els.resultCount.textContent = `${rows.length} ${meta.countLabel(rows.length)}`;
    els.tableSummary.textContent = `Afișate ${rows.length} din ${total} ${meta.countLabel(total)}`;
    if (state.tab === "parts" || state.tab === "unassigned") {
      const units = rows.reduce((sum, part) => sum + part.qty, 0);
      const remaining = rows.reduce((sum, part) => sum + remainingQty(part), 0);
      els.tableSummary.textContent += ` · ${units} buc. pe facturi${remaining > 0 ? ` · De atribuit: ${remaining} buc.` : ""}`;
      const imported = rows.reduce((sum, part) => sum + demoImportedQty(part), 0);
      if (imported > 0) els.tableSummary.textContent += ` · ${imported} buc. în DEMO DF`;
    }
    els.addSupplierBtn.hidden = state.tab !== "suppliers";
    els.addSupplierBtn.closest(".ep-list-head")?.classList.toggle("has-supplier-add", state.tab === "suppliers");
    renderTable(rows);
    renderBulkBar();
  };

  /* -----------------------------------------------------------------------
     Panoul de detalii: piesă, factură, furnizor și retur
     ----------------------------------------------------------------------- */
  const buildPartHistory = (part) => {
    const invoice = invoiceById(part.invoiceId);
    const returns = returnsForPart(part.id);
    const events = [
      { date: invoice.date, title: "Piesă înregistrată", by: "Andrei Popescu · recepție factură" }
    ];

    allocationsForPart(part).forEach((allocation) => {
      events.push({ date: addDays(invoice.date, 1), title: `${allocation.qty} buc. atribuite la ${allocation.plate}`, by: "Cristina Neagu · dispecerat" });
    });
    if (part.df) {
      events.push({ date: addDays(invoice.date, 2), title: `Importată în ${part.df}`, by: "Mihai Ionescu · deviz final" });
    }
    importsForPart(part.id).forEach((entry) => {
      events.push({ date: entry.createdAt.slice(0, 10), title: `${entry.reference} · ${entry.qty} buc. · ${entry.plate}`, by: "Import simulat DEMO · preț de achiziție", actualDate: true });
    });
    warehouseForPart(part.id).forEach((entry) => {
      events.push({ date: entry.localDate, title: `Trimis în magazie · ${entry.qty} buc. · ${entry.reference}`, by: returnSourceLabel(entry), actualDate: true });
    });
    if (part.status === "Montată") {
      events.push({ date: addDays(invoice.date, 3), title: "Marcată ca montată", by: "Mihai Ionescu · service" });
    }
    returns.forEach((item) => {
      RETURN_STEPS.slice(0, RETURN_STEPS.indexOf(item.status) + 1).forEach((status) => {
        const date = returnStageDate(item, status);
        if (date) events.push({ date, title: `${item.code} · ${item.qty} buc. · ${status}`, by: returnSourceLabel(item), actualDate: true });
      });
    });
    if (remainingQty(part) > 0) {
      events.push({ date: DEMO_TODAY, title: `${remainingQty(part)} buc. așteaptă atribuirea`, by: "Cantitate rămasă de alocat" });
    }

    const times = ["09:15", "10:05", "11:20", "13:40", "15:10", "16:25"];
    return events
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((event, index) => `<div class="ep-timeline-item">
        <strong>${escapeHTML(event.title)}</strong>
        <time>${formatDate(event.date)}${event.actualDate ? "" : ` · ${times[index % times.length]}`}</time>
        <small>${escapeHTML(event.by)}</small>
      </div>`)
      .join("");
  };

  const buildPartDetail = (part) => {
    const invoice = invoiceById(part.invoiceId);
    const supplier = supplierById(invoice.supplierId);
    const returns = returnsForPart(part.id);
    const vatPercent = partVatPercent(part);
    const lineTotalCents = lineGrossCents(part);
    const lineSubtotalCents = Math.round(lineTotalCents / (1 + partVatRate(part)));
    const lineTotal = lineTotalCents / 100;
    const lineSubtotal = lineSubtotalCents / 100;
    const lineVat = (lineTotalCents - lineSubtotalCents) / 100;
    const returnLocked = Boolean(part.df) || returnableQty(part) <= 0;
    const assignmentLocked = Boolean(part.df);

    return `
      <div class="ep-detail-hero">
        <span class="ep-eyebrow">Piesă · ${escapeHTML(invoice.number)}</span>
        <div class="ep-detail-title-row">
          <div>
            <h3>${escapeHTML(part.name)}</h3>
            <p class="ep-detail-sub">
              <span class="ep-code">${escapeHTML(part.code || "—")}</span>
              <span>·</span>
              <span>${part.qty} ${part.qty === 1 ? "bucată" : "bucăți"}</span>
            </p>
          </div>
          <div class="ep-part-status-actions">
            ${partStatusMarkup(part)}
            <!-- Editare compactă lângă status; păstrează acțiunea existentă. -->
            <button type="button" class="ep-button ep-button-ghost ep-part-edit" data-action="edit-part" data-id="${escapeHTML(part.id)}">${ICONS.edit} Editează</button>
          </div>
        </div>
      </div>

      <div class="ep-detail-stats">
        <div><span>Cumpărate</span><strong>${part.qty} buc.</strong></div>
        <div><span>Preț unitar cu TVA</span><strong>${formatMoney(part.price)}</strong></div>
        <div><span>Total cu TVA</span><strong>${formatMoney(lineTotal)}</strong></div>
      </div>

      <section class="ep-detail-section">
        <h4>Informații generale</h4>
        <div class="ep-detail-card">
          ${detailRow("Furnizor", escapeHTML(supplier.name))}
          ${detailRow("Factură", escapeHTML(invoice.number))}
          ${detailRow("Data intrării", formatDate(invoice.date))}
          ${detailRow("Locație", escapeHTML(part.location))}
          ${detailRow("Preț unitar cu TVA", formatMoney(part.price))}
          ${detailRow("Valoare fără TVA", formatMoney(lineSubtotal))}
          ${detailRow(`TVA inclus (${formatVatPercent(vatPercent)}%)`, formatMoney(lineVat))}
          ${detailRow("Total cu TVA", formatMoney(lineTotal))}
        </div>
      </section>

      <section class="ep-detail-section">
        <h4>Destinația pieselor</h4>
        <div class="ep-detail-card">
          ${quantityDetailRows(partQuantityDisplay(part))}
        </div>
        <!-- Istoricul auto și acțiunile rămân accesibile fără repetarea totalurilor curente. -->
        ${allocationsForPart(part).length ? `<details class="ep-quantity-history">
          <summary>Alocări pe mașini · detalii și istoric</summary>
          ${allocationsForPart(part).map((allocation, index) => `
            <div class="ep-allocation-detail">
              <div class="ep-plate-cell"><span class="ep-plate">${escapeHTML(allocation.plate)}</span><small>Asociere inițială: ${allocation.qty} buc.</small><small>${escapeHTML(allocationDisplayText(part, index))}</small></div>
              <button type="button" class="ep-button ep-button-ghost" data-action="reassign-part" data-id="${escapeHTML(part.id)}" data-allocation-index="${index}"${assignmentLocked || allocationReturnQty(part, index) > 0 || allocationImportedQty(part, index) > 0 || allocationWarehouseQty(part, index) > 0 ? ' disabled aria-disabled="true" title="Asociere protejată de DF, import DEMO, retur sau magazie; se păstrează trasabilitatea"' : ""}>Corectează alocarea</button>
              ${allocationsForPart(part).length > 1 && dfEligibleQty(part, index) > 0 ? `<button type="button" class="ep-button ep-button-ghost" data-action="import-demo-df" data-id="${escapeHTML(part.id)}" data-plate="${escapeHTML(allocation.plate)}">Importă în DF · DEMO</button>` : ""}
            </div>`).join("")}
        </details>` : ""}
        <div class="ep-assignment-cta">
          ${remainingQty(part) > 0 ? `<button type="button" class="ep-button ep-button-primary ep-wide" data-action="assign-part" data-id="${escapeHTML(part.id)}"${assignmentLocked ? ' disabled aria-disabled="true"' : ""}>
            ${ICONS.car} Atribuie mașină · ${remainingQty(part)} buc. disponibile
          </button>` : ""}
        </div>
        ${assignmentLocked ? `<p class="ep-assignment-lock">${ICONS.info}<span>Asocierea este blocată: piesa are deja referința <b>${escapeHTML(part.df)}</b>. Referințele DF nu pot fi modificate sau șterse în acest DEMO.</span></p>` : ""}
      </section>

      ${allocatedQty(part) > 0 || part.df || demoImportedQty(part) > 0 ? `<section class="ep-detail-section">
        <h4>Deviz final</h4>
        <div class="ep-detail-card">
          ${part.df ? detailRow("Referință istorică", `<span class="ep-df">${escapeHTML(part.df)}</span>`) : ""}
          ${demoImportedQty(part) > 0 ? `<div class="ep-allocation-list">${dfReferences(importsForPart(part.id))}</div>` : ""}
          ${!part.df && !demoImportedQty(part) ? '<p class="ep-detail-note">Importul folosește piesele atribuite mașinii.</p>' : ""}
        </div>
        <div class="ep-assignment-cta"><button type="button" class="ep-button ep-button-primary ep-wide" data-action="import-demo-df" data-id="${escapeHTML(part.id)}"${partDfEligibleQty(part) <= 0 ? " disabled" : ""}>Importă în DF · DEMO</button></div>
      </section>` : ""}

      ${returns.length ? `<section class="ep-detail-section">
        <h4>Retururi furnizor · ${returns.length} cereri</h4>
        <div class="ep-compact-list">${returns.map((item) => `<button type="button" class="ep-compact-row" data-action="open-return" data-id="${escapeHTML(item.id)}">
          <span class="ep-compact-row-main"><strong>${escapeHTML(item.code)} · ${item.qty} buc.</strong><small>${escapeHTML(returnSourceLabel(item))}</small></span>${statusBadge(item.status)}
        </button>`).join("")}</div>
      </section>` : ""}

      ${part.note ? `<section class="ep-detail-section">
        <h4>Observații</h4>
        <div class="ep-detail-card">${renderRecordedNote(part.note, demoPartNoteSnapshots.get(part.id), recordedNoteState(part))}</div>
      </section>` : ""}

      <div class="ep-detail-actions">
        <button type="button" class="ep-button ep-button-primary ep-wide" data-action="view-invoice" data-id="${escapeHTML(invoice.id)}">
          ${ICONS.file} Vezi factura
        </button>
        <button type="button" class="ep-button ep-warehouse-button" data-action="warehouse-part" data-id="${escapeHTML(part.id)}"${warehouseEligibleQty(part) <= 0 ? ' disabled title="Nu există cantități eligibile pentru magazie"' : ""}>
          ${ICONS.box} Magazie
        </button>
        <button type="button" class="ep-button ep-button-danger" data-action="return-part" data-id="${escapeHTML(part.id)}"
          ${returnLocked ? 'disabled title="Retur blocat: referință DF sau lipsă de cantitate disponibilă"' : ""}>
          ${ICONS.rotate} Retur
        </button>
      </div>

      ${warehouseHistory(warehouseForPart(part.id))}

      <section class="ep-detail-section">
        <h4>Istoric status</h4>
        <div class="ep-timeline">${buildPartHistory(part)}</div>
      </section>`;
  };

  const compactPartRow = (part) => {
    const invoice = invoiceById(part.invoiceId);
    return `<button type="button" class="ep-compact-row" data-action="open-part" data-id="${escapeHTML(part.id)}">
      <span class="ep-compact-row-main">
        <strong>${escapeHTML(part.name)}</strong>
        <small>${escapeHTML(part.code || "—")} · ${part.qty} buc. · ${escapeHTML(invoice.number)}</small>
        ${plateCell(part)}
      </span>
      <span class="ep-money">${formatMoney(part.qty * part.price)}</span>
      ${partStatusMarkup(part)}
    </button>`;
  };

  const buildInvoiceDetail = (invoice) => {
    const supplier = supplierById(invoice.supplierId);
    const totals = invoiceTotals(invoice.id);
    const parts = partsForInvoice(invoice.id);
    const quantities = invoiceQuantityDisplay(parts);
    const notice = invoiceDocumentNotice(invoice, quantities);

    return `
      <div class="ep-detail-hero">
        <span class="ep-eyebrow">Factură · ${escapeHTML(supplier.name)}</span>
        <div class="ep-detail-title-row">
          <div>
            <h3>${escapeHTML(invoice.number)}</h3>
            <p class="ep-detail-sub"><span>${formatDate(invoice.date)}</span><span>·</span><span>${escapeHTML(supplier.name)}</span></p>
          </div>
        </div>
      </div>

      <div class="ep-detail-stats">
        <div><span>Poziții</span><strong>${totals.count}</strong></div>
        <div><span>Bucăți fizice</span><strong>${totals.units}</strong></div>
        <div><span>Total cu TVA</span><strong class="ep-detail-stat-money">${formatMoney(totals.total, 0)}</strong></div>
      </div>

      <section class="ep-detail-section">
        <h4>Valori factură</h4>
        <div class="ep-detail-card">
          ${detailRow("Valoare fără TVA", formatMoney(totals.subtotal))}
          ${detailRow(vatLabelForRates(totals.rates), formatMoney(totals.vat))}
          ${detailRow("Total cu TVA", formatMoney(totals.total))}
        </div>
        ${renderRecordedNote(invoice.note, demoInvoiceNoteSnapshots.get(invoice.id), invoiceNoteState(invoice))}
      </section>

      <section class="ep-detail-section">
        <h4>SITUAȚIA PIESELOR</h4>
        <div class="ep-detail-card">
          ${invoicePartsRows(quantities)}
          ${totals.remainingPositions > 0 ? `<p class="ep-detail-note">De atribuit în ${totals.remainingPositions} ${totals.remainingPositions === 1 ? "poziție" : "poziții"} de factură.</p>` : ""}
        </div>
      </section>

      <!-- Gestionarea documentului fizic este manuală și independentă de situația pieselor. -->
      <section class="ep-detail-section ep-invoice-document">
        <h4>SITUAȚIA DOCUMENTULUI</h4>
        <div class="ep-detail-card">
          ${detailRow("Status document fizic", statusBadge(invoice.status))}
          <p class="ep-detail-note">Factura fizică rămâne în birou până sunt finalizate DF-urile necesare și fotocopiile pentru toate mașinile relevante. Atribuirea pieselor și importul DEMO în DF nu confirmă pregătirea documentelor.</p>
          <p class="ep-detail-note">Statusul documentului este ales manual, separat de situația pieselor.</p>
          ${notice ? `<p class="ep-invoice-document-notice" role="note">${ICONS.info}<span>${escapeHTML(notice)}</span></p>` : ""}
        </div>
        <div class="ep-assignment-cta">
          <button type="button" class="ep-button ep-wide" data-action="edit-invoice" data-id="${escapeHTML(invoice.id)}">${ICONS.edit} Editează factura</button>
        </div>
      </section>

      ${totals.demoImportedUnits > 0 || totals.legacyDfPositions > 0 ? `<section class="ep-detail-section">
        <h4>Referințe Deviz Final</h4>
        <div class="ep-detail-card">
          ${[...new Set(parts.filter((part) => part.df).map((part) => part.df))].map((reference) => `<span class="ep-df">${escapeHTML(reference)} · istoric</span>`).join(" ")}
          <div class="ep-allocation-list">${dfReferences(DATA.dfImports.filter((entry) => entry.invoiceId === invoice.id))}</div>
        </div>
      </section>` : ""}

      <section class="ep-detail-section">
        <h4>Piese pe factură</h4>
        <div class="ep-compact-list">${parts.map(compactPartRow).join("")}</div>
      </section>

      ${warehouseHistory(DATA.warehouseTransfers.filter((entry) => entry.invoiceId === invoice.id))}

      <div class="ep-detail-actions">
        <button type="button" class="ep-button ep-button-primary ep-wide" data-action="import-invoice-demo-df" data-id="${escapeHTML(invoice.id)}"${totals.dfEligibleUnits <= 0 ? " disabled" : ""}>Importă în DF · DEMO</button>
        <button type="button" class="ep-button ep-button-primary ep-wide" data-action="open-invoice-parts" data-id="${escapeHTML(invoice.id)}">
          ${ICONS.box} Vezi piesele
        </button>
      </div>`;
  };

  const buildSupplierDetail = (supplier) => {
    const totals = supplierTotals(supplier.id);
    const accounts = supplierBankAccounts(supplier);
    const city = String(supplier.city || "").trim();
    const cui = normalizeSupplierCui(supplier.cui);
    const regCom = normalizeSupplierRegCom(supplier.regCom);
    const invoices = DATA.invoices
      .filter((invoice) => invoice.supplierId === supplier.id)
      .sort(byDateDesc);

    return `
      <div class="ep-detail-hero">
        <span class="ep-eyebrow">Furnizor · ${escapeHTML(city || "date fiscale")}</span>
        <div class="ep-detail-title-row">
          <div>
            <h3>${escapeHTML(supplier.name)}</h3>
            <p class="ep-detail-sub"><span>${escapeHTML(cui || "CUI nespecificat")}</span><span>·</span><span>${escapeHTML(city || "Oraș nespecificat")}</span></p>
          </div>
          <span class="ep-badge ep-badge--success">Partener activ</span>
        </div>
      </div>

      <div class="ep-detail-stats">
        <div><span>Facturi</span><strong>${totals.invoices}</strong></div>
        <div><span>Poziții</span><strong>${totals.parts}</strong></div>
        <div><span>Total cu TVA</span><strong class="ep-detail-stat-money">${formatMoney(totals.total, 0)}</strong></div>
      </div>

      <section class="ep-detail-section">
        <h4>Date de contact</h4>
        <div class="ep-detail-card">
          ${detailRow("Persoană contact", escapeHTML(supplier.contact || "—"))}
          ${detailRow("Telefon", escapeHTML(supplier.phone || "—"))}
          ${detailRow("Email", escapeHTML(supplier.email || "—"))}
          ${detailRow("Adresă", escapeHTML(supplier.address || "—"))}
          ${detailRow("CUI", escapeHTML(cui || "—"))}
          ${detailRow("Reg. Com.", escapeHTML(regCom || "—"))}
        </div>
      </section>

      <section class="ep-detail-section">
        <h4>Conturi bancare</h4>
        <div class="ep-detail-card">
          ${accounts.length
            ? accounts.map((account, index) => {
                const iban = normalizeSupplierIban(account.iban);
                return detailRow(
                  accounts.length > 1 ? `IBAN ${index + 1}` : "IBAN",
                  `${escapeHTML(iban || "—")}${account.bank ? `<span class="ep-bank-name">${escapeHTML(account.bank)}</span>` : ""}`
                );
              }).join("")
            : detailRow("IBAN", "—")}
        </div>
      </section>

      ${supplier.notes ? `<section class="ep-detail-section">
        <h4>Observații</h4>
        <p class="ep-detail-note ep-supplier-notes">${escapeHTML(supplier.notes)}</p>
      </section>` : ""}

      <section class="ep-detail-section">
        <h4>Facturi recente</h4>
        <div class="ep-compact-list">
          ${invoices.length ? invoices.map((invoice) => {
            const invoiceData = invoiceTotals(invoice.id);
            return `<button type="button" class="ep-compact-row" data-action="open-invoice" data-id="${escapeHTML(invoice.id)}">
              <span class="ep-compact-row-main">
                <strong>${escapeHTML(invoice.number)}</strong>
                <small>${formatDate(invoice.date)} · ${invoiceData.count} poziții</small>
              </span>
              <span class="ep-money">${formatMoney(invoiceData.total, 0)}</span>
              ${statusBadge(invoice.status)}
            </button>`;
          }).join("") : `<p class="ep-detail-note">Nicio factură asociată încă.</p>`}
        </div>
      </section>

      <div class="ep-detail-actions">
        <button type="button" class="ep-button ep-button-primary ep-wide" data-action="supplier-invoices" data-id="${escapeHTML(supplier.id)}">
          ${ICONS.file} Vezi facturile
        </button>
        <button type="button" class="ep-button ep-wide" data-action="edit-supplier" data-id="${escapeHTML(supplier.id)}">
          ${ICONS.edit} Editează furnizorul
        </button>
      </div>`;
  };

  const buildReturnDetail = (item) => {
    const part = partById(item.partId);
    const invoice = part ? invoiceById(part.invoiceId) : null;
    const supplier = invoice ? supplierById(invoice.supplierId) : null;
    const currentIndex = Math.max(0, RETURN_STEPS.indexOf(item.status));
    const steps = RETURN_STEPS.map((step, index) => {
      const done = index < currentIndex || (item.status === "Finalizat" && index <= currentIndex);
      const current = index === currentIndex && item.status !== "Finalizat";
      const date = returnStageDate(item, step);
      return `<div class="ep-step${done ? " is-done" : ""}${current ? " is-current" : ""}"><b>${index + 1}</b><span>${escapeHTML(step)}</span><small>${date ? formatDate(date) : index <= currentIndex ? "Dată neînregistrată" : "—"}</small></div>`;
    }).join("");

    return `
      <div class="ep-detail-hero">
        <span class="ep-eyebrow">Retur · ${escapeHTML(item.code)}</span>
        <div class="ep-detail-title-row">
          <div>
            <h3>${escapeHTML(part?.name || "Piesă indisponibilă")}</h3>
            <p class="ep-detail-sub">
              <span class="ep-code">${escapeHTML(part?.code || "—")}</span>
              <span>·</span>
              <span>${escapeHTML(invoice?.number || "—")}</span>
            </p>
          </div>
          ${statusBadge(item.status)}
        </div>
      </div>

      <div class="ep-detail-stats">
        <div><span>Cantitate</span><strong>${item.qty} buc.</strong></div>
        <div><span>Durată</span><strong>${daysSince(item.requestedAt)} zile</strong></div>
        <div><span>Ridicare</span><strong>${formatDate(item.pickedUpAt)}</strong></div>
      </div>

      <section class="ep-detail-section">
        <h4>Detalii retur</h4>
        <div class="ep-detail-card">
          ${detailRow("Cod retur", escapeHTML(item.code))}
          ${detailRow("Referință cerere", escapeHTML(item.reference || "—"))}
          ${detailRow("Furnizor", escapeHTML(supplier?.name || "—"))}
          ${detailRow("Factură", escapeHTML(invoice?.number || "—"))}
          ${detailRow("Motiv", escapeHTML(item.reason))}
          ${detailRow("Sursa cantității", escapeHTML(returnSourceLabel(item)))}
          ${detailRow("Data cererii", formatDate(item.requestedAt))}
          ${detailRow("Așteaptă ridicare din", formatDate(item.waitingAt))}
          ${detailRow("Data ridicării", formatDate(item.pickedUpAt))}
          ${detailRow("Data finalizării", formatDate(item.completedAt))}
        </div>
        <p class="ep-detail-note">${escapeHTML(item.note)}</p>
        <p class="ep-detail-note">Cantitățile în retur rămân excluse din disponibil și după finalizare.</p>
      </section>

      <section class="ep-detail-section">
        <h4>Stadiu retur</h4>
        <div class="ep-steps">${steps}</div>
      </section>

      <div class="ep-detail-actions">
        <button type="button" class="ep-button ep-button-primary ep-wide" data-action="open-part" data-id="${escapeHTML(item.partId)}">
          ${ICONS.box} Vezi piesa
        </button>
        <button type="button" class="ep-button ep-wide" data-action="update-return" data-id="${escapeHTML(item.id)}"${item.status === "Finalizat" ? " disabled" : ""}>
          ${ICONS.rotate} ${item.status === "Finalizat" ? "Retur finalizat" : `Avansează: ${escapeHTML(RETURN_STEPS[currentIndex + 1])}`}
        </button>
      </div>`;
  };

  const emptyDetail = (meta) => `<div class="ep-empty-details">
    <span class="ep-empty-icon">${ICONS.box}</span>
    <h3>${escapeHTML(meta.emptyTitle)}</h3>
    <p>${escapeHTML(meta.emptyText)}</p>
  </div>`;

  /* -----------------------------------------------------------------------
     Sincronizarea panoului de detalii și a drawer-ului mobil
     ----------------------------------------------------------------------- */
  const closeDrawer = () => {
    els.detailsPanel.classList.remove("is-open");
    els.detailBackdrop.hidden = true;
    document.body.classList.remove("ep-drawer-open");
  };

  const syncDrawer = (hasSelection) => {
    const isCompact = window.matchMedia("(max-width: 1100px)").matches;
    if (!isCompact) {
      closeDrawer();
      return;
    }
    if (hasSelection) {
      const wasOpen = els.detailsPanel.classList.contains("is-open");
      els.detailsPanel.classList.add("is-open");
      els.detailBackdrop.hidden = false;
      document.body.classList.add("ep-drawer-open");
      if (!wasOpen) {
        /* Drawer-ul devine vizibil abia după tranziția CSS; focusul se mută
           pe butonul de închidere imediat ce panoul poate primi focus. */
        window.setTimeout(() => {
          if (els.detailsPanel.classList.contains("is-open")) {
            if (!document.body.classList.contains("ep-modal-open")) {
              els.closeDetails.focus({ preventScroll: true });
            }
          }
        }, 240);
      }
    } else {
      closeDrawer();
    }
  };

  const renderDetails = () => {
    const meta = TAB_META[state.tab];
    let record = null;
    let content = "";

    els.detailsTitle.textContent = meta.detailTitle;
    els.detailsEyebrow.textContent = meta.detailEyebrow;

    if (state.selectedId) {
      if (state.tab === "parts" || state.tab === "unassigned") {
        record = partById(state.selectedId);
        if (record) {
          content = buildPartDetail(record);
        }
      } else if (state.tab === "invoices") {
        record = invoiceById(state.selectedId);
        if (record) {
          content = buildInvoiceDetail(record);
        }
      } else if (state.tab === "suppliers") {
        record = supplierById(state.selectedId);
        if (record) {
          content = buildSupplierDetail(record);
        }
      } else if (state.tab === "returns") {
        record = DATA.returns.find((item) => item.id === state.selectedId) || null;
        if (record) {
          content = buildReturnDetail(record);
        }
      }
    }

    if (!record) {
      state.selectedId = null;
      els.detailsBody.innerHTML = emptyDetail(meta);
      syncDrawer(false);
      return;
    }

    els.detailsBody.innerHTML = content;
    els.detailsBody.scrollTop = 0;
    syncDrawer(true);
  };

  const updateSelectedRowStyles = () => {
    els.tableBody.querySelectorAll("tr[data-id]").forEach((row) => {
      const selected = row.dataset.id === state.selectedId;
      row.classList.toggle("is-selected", selected);
      row.setAttribute("aria-selected", String(selected));
    });
  };

  const selectRow = (id) => {
    if (!getVisibleRows().some((row) => row.id === id)) return;
    state.selectedId = id;
    updateSelectedRowStyles();
    renderDetails();
  };

  const clearSelection = () => {
    const focusWasInDrawer = els.detailsPanel.contains(document.activeElement);
    state.selectedId = null;
    updateSelectedRowStyles();
    renderDetails();
    if (focusWasInDrawer) {
      document.getElementById(`tab-${state.tab}`)?.focus({ preventScroll: true });
    }
  };

  const renderAll = () => {
    renderTabs();
    renderKpis();
    renderToolbar();
    renderList();
    renderDetails();
  };

  const setTab = (tab, options = {}) => {
    if (!TAB_META[tab]) return;
    state.tab = tab;
    state.search = options.search || "";
    state.status = "all";
    state.supplier = options.supplier || "all";
    state.assignment = "all";
    state.selectedId = options.selectedId || null;
    state.checkedPartIds.clear();
    renderAll();
  };

  const applyFilters = () => {
    renderList();
    if (state.selectedId && !getVisibleRows().some((row) => row.id === state.selectedId)) {
      state.selectedId = null;
      renderDetails();
    }
  };

  const resetFilters = () => {
    state.search = "";
    state.status = "all";
    state.supplier = "all";
    state.assignment = "all";
    renderToolbar();
    renderList();
  };

  /* -----------------------------------------------------------------------
     Dialogul informativ pentru acțiunile din etapa următoare
     ----------------------------------------------------------------------- */
  const MODAL_COPY = {
    newInvoice: {
      title: "Factură nouă — disponibil în etapa 2",
      message: "Formularul de adăugare a unei facturi (furnizor, număr, dată, status document și rânduri de piese) va fi implementat în etapa următoare. Până atunci, poți consulta cele șase facturi fictive din registru."
    },
    editPart: {
      title: "Editarea piesei — etapa 2",
      message: "Editarea generală a piesei nu este disponibilă în acest DEMO."
    },
    editInvoice: {
      title: "Editarea facturii — etapa 2",
      message: "Formularul de editare a facturii, împreună cu gestionarea rândurilor de piese, va fi implementat în etapa următoare."
    },
    fallback: {
      title: "Funcționalitate în pregătire",
      message: "Această acțiune va fi disponibilă într-o etapă următoare a prototipului DEMO."
    }
  };

  const handleModalKeydown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeInfoModal();
      return;
    }
    if (event.key !== "Tab") return;

    const focusables = Array.from(els.infoModal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.offsetParent !== null);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openInfoModal = (key) => {
    const copy = MODAL_COPY[key] || MODAL_COPY.fallback;
    state.lastFocused = document.activeElement;
    els.infoModalEyebrow.textContent = "Etapa 2 · DEMO";
    els.infoModalTitle.textContent = copy.title;
    els.infoModalMessage.textContent = copy.message;
    els.infoModal.hidden = false;
    document.body.classList.add("ep-modal-open");
    document.addEventListener("keydown", handleModalKeydown);
    window.requestAnimationFrame(() => els.infoModalOk.focus());
  };

  const closeInfoModal = () => {
    if (els.infoModal.hidden) return;
    els.infoModal.hidden = true;
    document.body.classList.remove("ep-modal-open");
    document.removeEventListener("keydown", handleModalKeydown);
    if (state.lastFocused && document.contains(state.lastFocused)) {
      state.lastFocused.focus({ preventScroll: true });
    }
  };

  /* -----------------------------------------------------------------------
     Formularul de factură nouă
     ----------------------------------------------------------------------- */
  const lineField = (row, field) => row.querySelector(`[data-field="${field}"]`);
  const invoiceLineRows = () => [...els.invoiceLinesBody.querySelectorAll("tr[data-line-id]")];

  /* Data locală se recalculează la fiecare formular nou, inclusiv după miezul nopții. */
  const localInvoiceToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  /* Cronometru discret, exclusiv în memorie; nu intră în datele facturii. */
  const renderInvoiceEntryTimer = () => {
    const seconds = invoiceUi.entryStartedAt === null ? 0 : Math.floor((performance.now() - invoiceUi.entryStartedAt) / 1000);
    els.invoiceEntryTimer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };
  const startInvoiceEntryTimer = () => {
    if (els.invoiceModal.hidden || invoiceUi.entryStartedAt !== null) return;
    invoiceUi.entryStartedAt = performance.now();
    invoiceUi.entryTimer = window.setInterval(renderInvoiceEntryTimer, 1000);
  };
  const stopInvoiceEntryTimer = () => {
    renderInvoiceEntryTimer();
    window.clearInterval(invoiceUi.entryTimer);
    invoiceUi.entryTimer = 0;
  };
  const resetInvoiceEntryTimer = () => {
    window.clearInterval(invoiceUi.entryTimer);
    invoiceUi.entryTimer = 0;
    invoiceUi.entryStartedAt = null;
    renderInvoiceEntryTimer();
  };

  const readFormNumber = (value) => {
    const clean = String(value ?? "").trim().replace(/\s+/g, "").replace(",", ".");
    return clean ? Number(clean) : Number.NaN;
  };

  const invoiceLineRowHTML = () => {
    invoiceUi.lineSeq += 1;
    return `<tr data-line-id="invoice-line-${invoiceUi.lineSeq}">
      <td class="ep-line-no" data-label="Poziția"><span data-line-index>1</span></td>
      <td data-label="Denumire piesă" data-field-cell="name">
        <input type="text" data-field="name" autocomplete="off" placeholder="ex. Disc frână față" required>
      </td>
      <td data-label="Cod piesă" data-field-cell="code">
        <input type="text" data-field="code" autocomplete="off" placeholder="opțional">
      </td>
      <td data-label="Cant." data-field-cell="qty">
        <input type="number" data-field="qty" value="1" min="1" step="1" inputmode="numeric" required>
      </td>
      <td data-label="Preț unitar cu TVA" data-field-cell="price">
        <input type="number" data-field="price" min="0.01" step="0.01" inputmode="decimal" placeholder="0,00" required>
      </td>
      <td data-label="TVA %" data-field-cell="vat">
        <input type="number" data-field="vat" value="21" min="0" max="100" step="0.01" inputmode="decimal">
      </td>
      <td data-label="Înmatriculare" data-field-cell="plate">
        <input type="text" data-field="plate" autocomplete="off" placeholder="ex. CT11AAA">
      </td>
      <td data-label="Observații" data-field-cell="note">
        <input type="text" data-field="note" autocomplete="off" placeholder="opțional">
      </td>
      <td class="ep-line-total" data-label="Total linie">
        <strong data-line-total>—</strong>
        <small>cu TVA</small>
      </td>
      <td class="ep-line-actions">
        <button type="button" class="ep-line-remove" data-remove-line aria-label="Elimină poziția">${ICONS.trash}</button>
      </td>
    </tr>`;
  };

  const updateInvoiceFormTotals = () => {
    const grossByRate = new Map();
    let totalCents = 0;

    invoiceLineRows().forEach((row) => {
      const qty = readFormNumber(lineField(row, "qty")?.value);
      const priceCents = toCents(readFormNumber(lineField(row, "price")?.value));
      const vatRaw = String(lineField(row, "vat")?.value ?? "").trim();
      const vatRate = vatRaw === "" ? DEFAULT_NEW_VAT_RATE : readFormNumber(vatRaw);
      const valid = Number.isInteger(qty) && qty > 0 && priceCents > 0 && Number.isFinite(vatRate) && vatRate >= 0 && vatRate <= 100;
      const lineTotal = row.querySelector("[data-line-total]");

      if (valid) {
        const grossCents = qty * priceCents;
        totalCents += grossCents;
        grossByRate.set(vatRate, (grossByRate.get(vatRate) || 0) + grossCents);
        if (lineTotal) lineTotal.textContent = formatMoney(grossCents / 100);
      } else if (lineTotal) {
        lineTotal.textContent = "—";
      }
    });

    let subtotalCents = 0;
    let vatCents = 0;
    grossByRate.forEach((grossCents, rate) => {
      const netCents = Math.round(grossCents / (1 + rate / 100));
      subtotalCents += netCents;
      vatCents += grossCents - netCents;
    });

    els.invoiceSubtotal.textContent = formatMoney(subtotalCents / 100);
    els.invoiceVat.textContent = formatMoney(vatCents / 100);
    els.invoiceTotal.textContent = formatMoney(totalCents / 100);
    const rates = [...grossByRate.keys()].sort((a, b) => a - b);
    els.invoiceVatRateSummary.textContent = rates.length
      ? rates.map((rate) => `${formatVatPercent(rate)}%`).join(" + ")
      : `${DEFAULT_NEW_VAT_RATE}%`;
  };

  const renumberInvoiceLines = () => {
    const rows = invoiceLineRows();
    const fieldLabels = {
      name: "Denumire piesă",
      code: "Cod piesă",
      qty: "Cantitate",
      price: "Preț unitar cu TVA",
      vat: "Cotă TVA",
      plate: "Număr înmatriculare",
      note: "Observații"
    };

    rows.forEach((row, index) => {
      const lineNumber = row.querySelector("[data-line-index]");
      if (lineNumber) lineNumber.textContent = String(index + 1);

      row.querySelectorAll("[data-field]").forEach((input) => {
        input.setAttribute("aria-label", `${fieldLabels[input.dataset.field]} — poziția ${index + 1}`);
      });

      const removeButton = row.querySelector("[data-remove-line]");
      if (removeButton) {
        removeButton.disabled = rows.length === 1;
        removeButton.title = rows.length === 1 ? "Factura trebuie să aibă cel puțin o poziție" : "Elimină poziția";
        removeButton.setAttribute("aria-label", `Elimină poziția ${index + 1}`);
      }
    });

    els.invoiceLineCount.textContent = `${rows.length} ${rows.length === 1 ? "poziție" : "poziții"}`;
  };

  const addInvoiceLine = (focus = false) => {
    els.invoiceLinesBody.insertAdjacentHTML("beforeend", invoiceLineRowHTML());
    renumberInvoiceLines();
    updateInvoiceFormTotals();
    const row = invoiceLineRows().at(-1);
    if (focus) lineField(row, "name")?.focus();
    return row;
  };

  const clearInvoiceErrorMessage = () => {
    els.invoiceFormError.hidden = true;
    els.invoiceFormError.innerHTML = "";
  };

  const clearInvoiceError = () => {
    clearInvoiceErrorMessage();
    els.invoiceForm.querySelectorAll(".is-invalid").forEach((field) => {
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
    });
  };

  const setInvoiceDate = (iso) => {
    if (invoiceUi.datePicker) {
      invoiceUi.datePicker.setDate(iso || null, false, "Y-m-d");
      return;
    }
    if (els.invoiceDate) els.invoiceDate.value = iso ? formatDate(iso) : "";
  };

  const readInvoiceDate = () => {
    const altInput = invoiceUi.datePicker?.altInput;
    const raw = String(altInput ? altInput.value : els.invoiceDate?.value ?? "").trim();
    if (!raw) return { empty: true, valid: false, iso: "" };
    const iso = parseRomanianDate(raw) || (!altInput && isValidISODate(raw) ? raw : null);
    return { empty: false, valid: Boolean(iso), iso: iso || "" };
  };

  const showInvoiceErrors = (messages, firstInvalid = null) => {
    clearInvoiceErrorMessage();
    els.invoiceFormError.hidden = false;
    els.invoiceFormError.innerHTML = `<span aria-hidden="true">${ICONS.alert}</span>
      <div><strong>Factura nu a fost salvată</strong><ul>${messages.map((message) => `<li>${escapeHTML(message)}</li>`).join("")}</ul></div>`;
    els.invoiceBody.scrollTop = 0;
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ block: "center", inline: "nearest" });
    }
  };

  const validateInvoiceDraft = () => {
    clearInvoiceError();
    const errors = [];
    const invalidFields = [];
    const addError = (message, field) => {
      errors.push(message);
      if (field && !invalidFields.includes(field)) invalidFields.push(field);
    };

    const supplier = supplierById(els.invoiceSupplier.value);
    if (!supplier) addError("Selectează furnizorul.", els.invoiceSupplier);

    const number = normalizeInvoiceNumber(els.invoiceNumber.value);
    els.invoiceNumber.value = number;
    if (!number) {
      addError("Introdu numărul facturii.", els.invoiceNumber);
    } else if (supplier) {
      const duplicate = DATA.invoices.find((invoice) =>
        invoice.supplierId === supplier.id && invoiceNumberKey(invoice.number) === invoiceNumberKey(number)
      );
      if (duplicate) {
        addError(`Factura ${number} există deja pentru ${supplier.name}.`, els.invoiceNumber);
      }
    }

    const dateState = readInvoiceDate();
    const dateField = invoiceUi.datePicker?.altInput || els.invoiceDate;
    const date = dateState.valid ? dateState.iso : "";
    if (dateState.empty) {
      els.invoiceDate.value = "";
      addError("Selectează data facturii.", dateField);
    } else if (!dateState.valid) {
      els.invoiceDate.value = "";
      addError("Data facturii nu este validă. Folosește formatul ZZ.LL.AAAA.", dateField);
    } else {
      setInvoiceDate(date);
    }

    const status = els.invoiceStatus.value;
    if (!INVOICE_STATUSES.includes(status)) {
      addError("Selectează statusul documentului.", els.invoiceStatus);
    }

    const rows = invoiceLineRows();
    if (!rows.length) addError("Adaugă cel puțin o poziție de piesă.", null);

    const lines = rows.map((row, index) => {
      const position = index + 1;
      const nameInput = lineField(row, "name");
      const codeInput = lineField(row, "code");
      const qtyInput = lineField(row, "qty");
      const priceInput = lineField(row, "price");
      const vatInput = lineField(row, "vat");
      const plateInput = lineField(row, "plate");
      const noteInput = lineField(row, "note");

      const name = formatPartName(nameInput.value);
      nameInput.value = name;
      if (!name) addError(`Poziția ${position}: denumirea piesei este obligatorie.`, nameInput);

      const qty = readFormNumber(qtyInput.value);
      if (!Number.isInteger(qty) || qty <= 0) {
        addError(`Poziția ${position}: cantitatea trebuie să fie un număr întreg pozitiv.`, qtyInput);
      }

      const price = readFormNumber(priceInput.value);
      const priceCents = toCents(price);
      if (!Number.isFinite(price) || price <= 0 || priceCents <= 0) {
        addError(`Poziția ${position}: prețul unitar cu TVA trebuie să fie o sumă pozitivă.`, priceInput);
      }

      const vatRaw = String(vatInput.value ?? "").trim();
      const vatRate = vatRaw === "" ? DEFAULT_NEW_VAT_RATE : readFormNumber(vatRaw);
      if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
        addError(`Poziția ${position}: cota TVA trebuie să fie între 0 și 100.`, vatInput);
      }

      return {
        name,
        code: codeInput.value.trim().toUpperCase(),
        qty,
        price: priceCents / 100,
        vatRate,
        plate: normalizePlate(plateInput.value),
        note: noteInput.value.trim()
      };
    });

    invalidFields.forEach((field) => {
      field.classList.add("is-invalid");
      field.setAttribute("aria-invalid", "true");
    });

    if (errors.length) {
      return { ok: false, errors, firstInvalid: invalidFields[0] || null };
    }

    return {
      ok: true,
      draft: {
        supplier,
        number,
        date,
        status,
        note: els.invoiceNotes.value.trim(),
        lines
      }
    };
  };

  const resetInvoiceForm = () => {
    if (!els.invoiceForm) return;
    resetInvoiceEntryTimer();
    els.invoiceForm.reset();
    setSelectOptions(els.invoiceSupplier, [
      { value: "", label: "Alege furnizorul" },
      ...DATA.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))
    ], "");
    invoiceUi.lastDateValue = localInvoiceToday();
    setInvoiceDate(invoiceUi.lastDateValue);
    els.invoiceStatus.value = "În firmă";
    els.invoiceNumber.value = "";
    els.invoiceNotes.value = "";
    els.invoiceLinesBody.innerHTML = "";
    invoiceUi.lineSeq = 0;
    addInvoiceLine(false);
    clearInvoiceError();
    updateInvoiceFormTotals();
    els.invoiceBody.scrollTop = 0;
  };

  const handleInvoiceModalKeydown = (event) => {
    if (event.key === "Escape") {
      if (invoiceUi.datePicker && (invoiceUi.datePicker.isOpen || event.target.closest?.(".flatpickr-calendar"))) {
        event.preventDefault();
        invoiceUi.datePicker.close();
        return;
      }
      event.preventDefault();
      closeInvoiceModal();
      return;
    }
    if (event.key !== "Tab") return;

    const focusables = Array.from(els.invoiceModal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.offsetParent !== null);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openInvoiceModal = (trigger = document.activeElement) => {
    if (!els.invoiceModal.hidden) return;
    closeDrawer();
    invoiceUi.trigger = trigger && typeof trigger.focus === "function" ? trigger : document.activeElement;
    resetInvoiceForm();
    els.invoiceModal.hidden = false;
    document.body.classList.add("ep-modal-open");
    document.addEventListener("keydown", handleInvoiceModalKeydown);
    window.requestAnimationFrame(() => els.invoiceSupplier.focus());
  };

  const closeInvoiceModal = ({ restoreFocus = true } = {}) => {
    if (els.invoiceModal.hidden) return;
    if (invoiceUi.datePicker) invoiceUi.datePicker.close();
    stopInvoiceEntryTimer();
    els.invoiceModal.hidden = true;
    document.body.classList.remove("ep-modal-open");
    document.removeEventListener("keydown", handleInvoiceModalKeydown);
    invoiceUi.saving = false;
    els.invoiceSave.disabled = false;
    els.invoiceSave.textContent = "Salvează factura";
    if (restoreFocus && invoiceUi.trigger && document.contains(invoiceUi.trigger)) {
      invoiceUi.trigger.focus({ preventScroll: true });
    }
  };

  const buildInvoiceRecords = (draft) => {
    const invoice = {
      id: nextEntityId("inv-", DATA.invoices),
      number: draft.number,
      supplierId: draft.supplier.id,
      date: draft.date,
      status: draft.status,
      note: draft.note
    };

    const reservedParts = [...DATA.parts];
    const parts = draft.lines.map((line) => {
      const part = {
        id: nextEntityId("p-", reservedParts, 2),
        invoiceId: invoice.id,
        code: line.code,
        name: line.name,
        qty: line.qty,
        price: line.price,
        vatRate: line.vatRate,
        plate: line.plate || null,
        model: null,
        status: line.plate ? "Atribuită" : "Neatribuită",
        df: null,
        location: "Recepție",
        note: line.note,
        /* Structura poate fi extinsă ulterior cu alocări parțiale pe mai multe mașini. */
        allocations: line.plate ? [{ plate: line.plate, model: null, qty: line.qty }] : []
      };
      reservedParts.push(part);
      return part;
    });

    return { invoice, parts };
  };

  const saveInvoice = (event) => {
    event.preventDefault();
    if (invoiceUi.saving) return;

    const validation = validateInvoiceDraft();
    if (!validation.ok) {
      showInvoiceErrors(validation.errors, validation.firstInvalid);
      return;
    }

    invoiceUi.saving = true;
    els.invoiceSave.disabled = true;
    els.invoiceSave.textContent = "Se salvează…";

    let invoice = null;
    let parts = [];

    try {
      const records = buildInvoiceRecords(validation.draft);
      invoice = records.invoice;
      parts = records.parts;
      const previousInvoiceCount = DATA.invoices.length;
      const previousPartCount = DATA.parts.length;

      try {
        DATA.invoices.push(invoice);
        DATA.parts.push(...parts);
      } catch (error) {
        DATA.invoices.length = previousInvoiceCount;
        DATA.parts.length = previousPartCount;
        throw error;
      }
    } catch (error) {
      console.error("Eroare la salvarea facturii DEMO:", error);
      invoiceUi.saving = false;
      els.invoiceSave.disabled = false;
      els.invoiceSave.textContent = "Salvează factura";
      showInvoiceErrors(["Nu am putut salva factura. Încearcă din nou."], null);
      return;
    }

    const lineLabel = parts.length === 1 ? "o poziție" : `${parts.length} poziții`;
    closeInvoiceModal({ restoreFocus: false });
    setTab("invoices", { selectedId: invoice.id });
    showToast(
      "Factură salvată",
      `Factura ${invoice.number} a fost adăugată cu ${lineLabel}, în memoria DEMO.`
    );

    window.requestAnimationFrame(() => {
      const row = els.tableBody.querySelector(`tr[data-id="${CSS.escape(invoice.id)}"]`);
      if (row) {
        row.scrollIntoView({ block: "nearest" });
        row.focus({ preventScroll: true });
      }
    });
  };

  const showToast = (title, message) => {
    window.clearTimeout(invoiceUi.toastTimer);
    els.successToastTitle.textContent = title;
    els.successToastMessage.textContent = message;
    els.successToast.hidden = false;
    invoiceUi.toastTimer = window.setTimeout(() => {
      els.successToast.hidden = true;
    }, 5200);
  };

  /* -----------------------------------------------------------------------
     Formularul de adăugare / editare a furnizorului
     ----------------------------------------------------------------------- */
  const supplierBankRows = () => [...els.supplierBankList.querySelectorAll("[data-bank-row]")];

  const supplierBankRowHTML = (account = {}) => {
    supplierUi.bankSeq += 1;
    const seq = supplierUi.bankSeq;
    return `<div class="ep-bank-row" data-bank-row>
      <label class="ep-field" for="supplierBankIban${seq}">
        <span>IBAN</span>
        <input type="text" id="supplierBankIban${seq}" data-bank-field="iban" data-normalize="iban" data-trim autocomplete="off" maxlength="60" placeholder="RO49 AAAA ..." value="${escapeHTML(normalizeSupplierIban(account.iban))}">
      </label>
      <label class="ep-field" for="supplierBankName${seq}">
        <span>Bancă <small>opțional</small></span>
        <input type="text" id="supplierBankName${seq}" data-bank-field="bank" data-trim autocomplete="off" maxlength="120" placeholder="ex. Banca Transilvania" value="${escapeHTML(account.bank || "")}">
      </label>
      <button type="button" class="ep-line-remove ep-bank-remove" data-remove-bank aria-label="Elimină contul bancar" title="Elimină contul bancar">${ICONS.trash}</button>
    </div>`;
  };

  const renumberSupplierBanks = () => {
    const rows = supplierBankRows();
    rows.forEach((row, index) => {
      const iban = row.querySelector('[data-bank-field="iban"]');
      const bank = row.querySelector('[data-bank-field="bank"]');
      const remove = row.querySelector("[data-remove-bank]");
      const label = `contul bancar ${index + 1}`;
      if (iban) iban.setAttribute("aria-label", `IBAN ${label}`);
      if (bank) bank.setAttribute("aria-label", `Bancă ${label}`);
      if (remove) {
        remove.setAttribute("aria-label", `Elimină ${label}`);
        remove.title = `Elimină ${label}`;
      }
    });
    if (els.supplierBankEmpty) els.supplierBankEmpty.hidden = rows.length > 0;
  };

  const addSupplierBankRow = (account = {}, focus = false) => {
    els.supplierBankList.insertAdjacentHTML("beforeend", supplierBankRowHTML(account));
    renumberSupplierBanks();
    const row = supplierBankRows().at(-1);
    if (focus) row?.querySelector('[data-bank-field="iban"]')?.focus();
    return row;
  };

  const clearSupplierErrorMessage = () => {
    els.supplierFormError.hidden = true;
    els.supplierFormError.innerHTML = "";
  };

  const clearSupplierError = () => {
    clearSupplierErrorMessage();
    els.supplierForm.querySelectorAll(".is-invalid").forEach((field) => {
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
    });
  };

  const showSupplierErrors = (messages, firstInvalid = null) => {
    clearSupplierErrorMessage();
    els.supplierFormError.hidden = false;
    els.supplierFormError.innerHTML = `<span aria-hidden="true">${ICONS.alert}</span>
      <div><strong>Furnizorul nu a fost salvat</strong><ul>${messages.map((message) => `<li>${escapeHTML(message)}</li>`).join("")}</ul></div>`;
    els.supplierBody.scrollTop = 0;
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ block: "center", inline: "nearest" });
    }
  };

  const validateSupplierDraft = () => {
    clearSupplierError();
    const errors = [];
    const invalidFields = [];
    const addError = (message, field) => {
      errors.push(message);
      if (field && !invalidFields.includes(field)) invalidFields.push(field);
    };
    const readField = (input, normalizer = null) => {
      const trimmed = String(input?.value ?? "").trim();
      const value = normalizer ? normalizer(trimmed) : trimmed;
      if (input) input.value = value;
      return value;
    };

    const name = readField(els.supplierName);
    if (!name) addError("Denumirea furnizorului este obligatorie.", els.supplierName);

    const cui = readField(els.supplierCui, normalizeSupplierCui);
    if (cui) {
      const duplicate = DATA.suppliers.find((supplier) =>
        supplier.id !== supplierUi.editingId && supplierCuiKey(supplier.cui) === supplierCuiKey(cui)
      );
      if (duplicate) {
        addError(`CUI ${cui} este deja folosit de furnizorul ${duplicate.name}.`, els.supplierCui);
      }
    }

    const email = readField(els.supplierEmail);
    if (email && !isValidSupplierEmail(email)) {
      addError("Introdu o adresă de email validă.", els.supplierEmail);
    }

    const bankAccounts = supplierBankRows().map((row, index) => {
      const ibanInput = row.querySelector('[data-bank-field="iban"]');
      const bankInput = row.querySelector('[data-bank-field="bank"]');
      const iban = readField(ibanInput, normalizeSupplierIban);
      const bank = readField(bankInput);
      if (bank && !iban) {
        addError(`Contul bancar ${index + 1}: completează IBAN-ul.`, ibanInput);
      }
      return { iban, bank };
    }).filter((account) => account.iban || account.bank);

    const draft = {
      name,
      cui,
      regCom: readField(els.supplierRegCom, normalizeSupplierRegCom),
      contact: readField(els.supplierContact),
      city: readField(els.supplierCity),
      phone: readField(els.supplierPhone),
      email,
      address: readField(els.supplierAddress),
      notes: readField(els.supplierNotes),
      bankAccounts,
      iban: bankAccounts[0]?.iban || ""
    };

    invalidFields.forEach((field) => {
      field.classList.add("is-invalid");
      field.setAttribute("aria-invalid", "true");
    });

    if (errors.length) {
      return { ok: false, errors, firstInvalid: invalidFields[0] || null };
    }
    return { ok: true, draft };
  };

  const resetSupplierForm = (supplier = null) => {
    if (!els.supplierForm) return;
    els.supplierForm.reset();
    supplierUi.bankSeq = 0;
    els.supplierName.value = supplier?.name || "";
    els.supplierCui.value = normalizeSupplierCui(supplier?.cui);
    els.supplierRegCom.value = normalizeSupplierRegCom(supplier?.regCom);
    els.supplierContact.value = supplier?.contact || "";
    els.supplierCity.value = supplier?.city || "";
    els.supplierPhone.value = supplier?.phone || "";
    els.supplierEmail.value = supplier?.email || "";
    els.supplierAddress.value = supplier?.address || "";
    els.supplierNotes.value = supplier?.notes || "";
    els.supplierBankList.innerHTML = "";
    const accounts = supplier ? supplierBankAccounts(supplier) : [];
    if (accounts.length) {
      accounts.forEach((account) => addSupplierBankRow(account));
    } else {
      addSupplierBankRow();
    }
    renumberSupplierBanks();
    clearSupplierError();
    els.supplierBody.scrollTop = 0;
  };

  const openSupplierModal = (supplier = null, trigger = document.activeElement) => {
    if (!els.supplierModal.hidden) return;
    supplierUi.trigger = trigger && typeof trigger.focus === "function" ? trigger : document.activeElement;
    supplierUi.editingId = supplier?.id || null;
    const isEdit = Boolean(supplier);
    els.supplierModalEyebrow.textContent = isEdit ? "Editare furnizor · DEMO" : "Furnizor nou · DEMO";
    els.supplierModalTitle.textContent = isEdit ? "Editează furnizorul" : "Adaugă furnizor";
    els.supplierModalNote.textContent = isEdit
      ? `Actualizezi datele pentru ${supplier.name}.`
      : "Completează datele firmei.";
    els.supplierSave.textContent = isEdit ? "Salvează modificările" : "Salvează furnizorul";
    els.supplierSave.disabled = false;
    supplierUi.saving = false;
    resetSupplierForm(supplier);
    els.supplierModal.hidden = false;
    document.body.classList.add("ep-modal-open");
    document.addEventListener("keydown", handleSupplierModalKeydown);
    window.requestAnimationFrame(() => els.supplierName.focus());
  };

  const closeSupplierModal = ({ restoreFocus = true } = {}) => {
    if (els.supplierModal.hidden) return;
    els.supplierModal.hidden = true;
    document.body.classList.remove("ep-modal-open");
    document.removeEventListener("keydown", handleSupplierModalKeydown);
    supplierUi.saving = false;
    supplierUi.editingId = null;
    els.supplierSave.disabled = false;
    els.supplierSave.textContent = "Salvează furnizorul";
    if (restoreFocus && supplierUi.trigger && document.contains(supplierUi.trigger)) {
      supplierUi.trigger.focus({ preventScroll: true });
    }
    supplierUi.trigger = null;
  };

  const handleSupplierModalKeydown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSupplierModal();
      return;
    }
    if (event.key !== "Tab") return;

    const focusables = Array.from(els.supplierModal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.offsetParent !== null);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const saveSupplier = (event) => {
    event.preventDefault();
    if (supplierUi.saving) return;

    const validation = validateSupplierDraft();
    if (!validation.ok) {
      showSupplierErrors(validation.errors, validation.firstInvalid);
      return;
    }

    supplierUi.saving = true;
    els.supplierSave.disabled = true;
    els.supplierSave.textContent = "Se salvează…";

    const isEdit = Boolean(supplierUi.editingId);
    let saved = null;

    try {
      if (isEdit) {
        const index = DATA.suppliers.findIndex((supplier) => supplier.id === supplierUi.editingId);
        if (index < 0) throw new Error("Furnizorul editat nu există.");
        const previous = DATA.suppliers[index];
        saved = { ...previous, ...validation.draft, id: previous.id };
        DATA.suppliers[index] = saved;
      } else {
        saved = { id: nextEntityId("sup-", DATA.suppliers), ...validation.draft };
        const previousCount = DATA.suppliers.length;
        try {
          DATA.suppliers.push(saved);
        } catch (error) {
          DATA.suppliers.length = previousCount;
          throw error;
        }
      }
    } catch (error) {
      console.error("Eroare la salvarea furnizorului DEMO:", error);
      supplierUi.saving = false;
      els.supplierSave.disabled = false;
      els.supplierSave.textContent = isEdit ? "Salvează modificările" : "Salvează furnizorul";
      showSupplierErrors(["Nu am putut salva furnizorul. Încearcă din nou."], null);
      return;
    }

    closeSupplierModal({ restoreFocus: false });
    setTab("suppliers", { selectedId: saved.id });
    showToast(
      isEdit ? "Furnizor actualizat" : "Furnizor adăugat",
      isEdit
        ? `Datele furnizorului ${saved.name} au fost actualizate în memoria DEMO.`
        : `Furnizorul ${saved.name} este disponibil în listă și în „Factură nouă”.`
    );

    window.requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1100px)").matches) return;
      const row = els.tableBody.querySelector(`tr[data-id="${CSS.escape(saved.id)}"]`);
      if (row) {
        row.scrollIntoView({ block: "nearest" });
        row.focus({ preventScroll: true });
      }
    });
  };

  /* -----------------------------------------------------------------------
     Atribuirea pieselor pe mașină
     ----------------------------------------------------------------------- */
  const assignmentPartRow = (part, index) => {
    const invoice = invoiceById(part.invoiceId);
    return `<div class="ep-assignment-row">
      <span class="ep-assignment-row-index">${index + 1}</span>
      <div class="ep-assignment-row-main">
        <strong>${escapeHTML(part.name)}</strong>
        <small>${escapeHTML(part.code || "—")} · ${escapeHTML(invoice?.number || "—")}</small>
      </div>
      <div class="ep-assignment-row-meta">
        <strong>Total: ${part.qty} buc.</strong>
        <small>Alocate: ${allocatedQty(part)} buc. · Rămase: ${remainingQty(part)} buc.</small>
        ${assignmentUi.source === "bulk" ? `<strong>Se atribuie: ${remainingQty(part)} buc.</strong>` : ""}
      </div>
    </div>`;
  };

  const syncAssignmentVehicleModel = () => {
    const plate = normalizePlate(els.assignmentPlate.value);
    els.assignmentPlate.value = plate;
    const models = new Map();
    if (plate) {
      DATA.parts.forEach((part) => {
        allocationsForPart(part).forEach((allocation) => {
          if (normalizePlate(allocation.plate) !== plate) return;
          const model = String(allocation.model || "").trim();
          const key = model.replace(/\s+/g, " ").toLocaleLowerCase("ro-RO");
          if (key && !models.has(key)) models.set(key, model);
        });
      });
    }

    // Repeated blur/change/submit events for the same plate must keep manual edits.
    if (plate !== assignmentUi.modelPlate) {
      els.assignmentModel.value = models.size === 1 ? [...models.values()][0] : "";
      assignmentUi.modelPlate = plate;
    }
    els.assignmentModelWarning.hidden = models.size < 2;
    els.assignmentModelWarning.textContent = models.size > 1
      ? `În memoria DEMO există modele diferite pentru ${plate}: ${[...models.values()].join(" / ")}. Nu se alege automat un model. Verifică modelul înainte de confirmare; câmpul rămâne opțional.`
      : "";
  };

  const updateAssignmentQuantityPreview = () => {
    const parts = assignmentUi.partIds.map(partById).filter(Boolean);
    if (assignmentUi.source === "bulk") {
      els.assignmentQuantityPreview.textContent = `${parts.reduce((sum, part) => sum + remainingQty(part), 0)} buc. rămase vor fi alocate, din ${parts.length} poziții. Alocările existente se păstrează.`;
      return;
    }
    const part = parts[0];
    const qty = Number(els.assignmentQty.value);
    const capacity = part ? allocationCapacity(part, assignmentUi.mode, assignmentUi.allocationIndex) : 0;
    els.assignmentQuantityPreview.textContent = Number.isInteger(qty) && qty > 0 && qty <= capacity
      ? `${qty} buc. în această alocare · ${capacity - qty} buc. vor rămâne nealocate.`
      : `Introdu o cantitate între 1 și ${capacity} buc.`;
  };

  const renderAssignmentModal = () => {
    const parts = assignmentUi.partIds.map(partById).filter(Boolean).sort(partSort);
    const isReassign = assignmentUi.mode === "reassign";
    const countLabel = `${parts.length} ${parts.length === 1 ? "poziție" : "poziții"}`;
    const currentAllocation = isReassign ? allocationsForPart(parts[0])[assignmentUi.allocationIndex] : null;
    const currentPlate = currentAllocation?.plate || "";

    els.assignmentModalEyebrow.textContent = isReassign ? "Corectare atribuire · DEMO" : "Atribuire mașină · DEMO";
    els.assignmentModalTitle.textContent = isReassign ? "Corectează alocarea" : "Atribuie mașină";
    els.assignmentModalNote.textContent = isReassign
      ? "Modifici doar alocarea selectată."
      : "Alege cantitatea și mașina.";
    els.assignmentCount.textContent = countLabel;
    els.assignmentPartsList.innerHTML = parts.map(assignmentPartRow).join("");
    els.assignmentSave.textContent = isReassign ? "Salvează corectarea" : "Confirmă atribuirea";
    els.assignmentPlate.value = currentPlate;
    assignmentUi.modelPlate = null;
    syncAssignmentVehicleModel();
    if (currentAllocation) els.assignmentModel.value = currentAllocation.model || "";
    const isBulk = assignmentUi.source === "bulk";
    els.assignmentQtyField.hidden = isBulk;
    els.assignmentQty.disabled = isBulk;
    els.assignmentQty.max = String(allocationCapacity(parts[0], assignmentUi.mode, assignmentUi.allocationIndex));
    els.assignmentQty.value = String(currentAllocation?.qty ?? (isBulk ? remainingQty(parts[0]) : 1));
    els.assignmentSummaryNote.textContent = isBulk
      ? "Se atribuie cantitatea rămasă din fiecare poziție, indicată mai jos."
      : "Cantitățile sunt exprimate în bucăți; linia facturii nu se împarte.";
    els.assignmentSummaryNote.hidden = !isBulk;
    updateAssignmentQuantityPreview();
    els.assignmentModeNote.classList.toggle("is-warning", isReassign);
    els.assignmentModeNote.hidden = !isReassign && !isBulk;
    els.assignmentModeNote.innerHTML = isReassign
      ? `${ICONS.alert}<span>Corectezi alocarea de <b>${currentAllocation.qty} buc.</b> pentru <b>${escapeHTML(currentPlate)}</b>. Poți folosi și cantitatea încă nealocată; celelalte alocări nu se schimbă.</span>`
      : `${ICONS.info}<span>Alocările existente se păstrează.</span>`;
    els.assignmentBody.scrollTop = 0;
  };

  const openAssignmentModal = ({
    mode = "assign",
    source = "part",
    partIds = [],
    allocationIndex = null,
    trigger = document.activeElement
  } = {}) => {
    if (!els.assignmentModal || !els.assignmentModal.hidden) return;
    const ids = [...new Set(partIds)];
    const parts = ids.map(partById).filter(Boolean);
    if (!parts.length) {
      showToast("Selecție invalidă", "Selectează cel puțin o poziție pentru atribuire.");
      return;
    }
    const editIndex = mode === "reassign" && allocationIndex === null && parts.length === 1 && allocationsForPart(parts[0]).length === 1
      ? 0 : allocationIndex;
    if ((source !== "bulk" || mode === "reassign") && parts.length !== 1) {
      showToast("Selecție invalidă", "Corectează sau atribuie individual o singură poziție.");
      return;
    }
    const blocked = parts.map((part) => assignmentBlockReason(part, mode, source, editIndex)).find(Boolean);
    if (blocked) {
      showToast("Atribuire blocată", blocked);
      return;
    }

    assignmentUi.mode = mode;
    assignmentUi.source = source;
    assignmentUi.allocationIndex = editIndex;
    assignmentUi.partIds = parts.sort(partSort).map((part) => part.id);
    assignmentUi.trigger = trigger && typeof trigger.focus === "function" ? trigger : document.activeElement;
    assignmentUi.saving = false;
    clearAssignmentError();
    renderAssignmentModal();
    els.assignmentModal.hidden = false;
    document.body.classList.add("ep-modal-open");
    document.addEventListener("keydown", handleAssignmentModalKeydown);
    window.requestAnimationFrame(() => {
      els.assignmentPlate.focus({ preventScroll: true });
      if (mode === "reassign") els.assignmentPlate.select();
    });
  };

  const closeAssignmentModal = ({ restoreFocus = true } = {}) => {
    if (!els.assignmentModal || els.assignmentModal.hidden) return;
    els.assignmentModal.hidden = true;
    document.body.classList.remove("ep-modal-open");
    document.removeEventListener("keydown", handleAssignmentModalKeydown);
    assignmentUi.saving = false;
    assignmentUi.partIds = [];
    els.assignmentSave.disabled = false;
    els.assignmentSave.textContent = "Confirmă atribuirea";
    if (restoreFocus && assignmentUi.trigger && document.contains(assignmentUi.trigger) && !assignmentUi.trigger.disabled) {
      assignmentUi.trigger.focus({ preventScroll: true });
    }
    assignmentUi.trigger = null;
  };

  const handleAssignmentModalKeydown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeAssignmentModal();
      return;
    }
    if (event.key !== "Tab") return;

    const focusables = Array.from(els.assignmentModal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.offsetParent !== null);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const clearAssignmentErrorMessage = () => {
    if (!els.assignmentFormError) return;
    els.assignmentFormError.hidden = true;
    els.assignmentFormError.innerHTML = "";
  };

  const clearAssignmentError = () => {
    clearAssignmentErrorMessage();
    els.assignmentForm.querySelectorAll(".is-invalid").forEach((field) => {
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
    });
  };

  const showAssignmentErrors = (messages, firstInvalid = null) => {
    clearAssignmentErrorMessage();
    els.assignmentFormError.hidden = false;
    els.assignmentFormError.innerHTML = `<span aria-hidden="true">${ICONS.alert}</span>
      <div><strong>Atribuirea nu a fost salvată</strong><ul>${messages.map((message) => `<li>${escapeHTML(message)}</li>`).join("")}</ul></div>`;
    els.assignmentBody.scrollTop = 0;
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ block: "center", inline: "nearest" });
    }
  };

  const validateAssignmentDraft = () => {
    clearAssignmentError();
    syncAssignmentVehicleModel();
    const errors = [];
    const invalidFields = [];
    const addError = (message, field) => {
      errors.push(message);
      if (field && !invalidFields.includes(field)) invalidFields.push(field);
    };

    const parts = assignmentUi.partIds.map(partById);
    if (!parts.length) {
      addError("Selectează cel puțin o poziție pentru atribuire.", els.assignmentPlate);
    }
    parts.forEach((part, index) => {
      if (!part) {
        addError(`Poziția selectată ${index + 1} nu mai există în memoria DEMO.`, els.assignmentPlate);
        return;
      }
      const reason = assignmentBlockReason(part, assignmentUi.mode, assignmentUi.source, assignmentUi.allocationIndex);
      if (reason) addError(reason, els.assignmentPlate);
    });

    const plate = normalizePlate(els.assignmentPlate.value);
    els.assignmentPlate.value = plate;
    if (!plate) {
      addError("Introdu numărul de înmatriculare.", els.assignmentPlate);
    } else if (!isValidAssignmentPlate(plate)) {
      addError("Numărul de înmatriculare nu este valid. Folosește 4–12 litere și cifre, de exemplu CT11AAA.", els.assignmentPlate);
    }

    const quantity = assignmentUi.source === "bulk" ? null : Number(els.assignmentQty.value);
    if (assignmentUi.source !== "bulk") {
      const capacity = parts[0] ? allocationCapacity(parts[0], assignmentUi.mode, assignmentUi.allocationIndex) : 0;
      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > capacity) {
        addError(`Cantitatea trebuie să fie un număr întreg între 1 și ${capacity} buc.`, els.assignmentQty);
      }
    }
    const model = els.assignmentModel.value.trim();
    invalidFields.forEach((field) => {
      field.classList.add("is-invalid");
      field.setAttribute("aria-invalid", "true");
    });

    if (errors.length) {
      return { ok: false, errors, firstInvalid: invalidFields[0] || null };
    }
    return {
      ok: true,
      parts: parts.filter(Boolean),
      plate,
      model,
      quantity
    };
  };

  const applyAssignmentUpdates = (parts, plate, model, {
    mode = "assign", source = "part", allocationIndex = null, quantity = null
  } = {}) => {
    // Verifică toate pozițiile înainte de orice modificare, inclusiv în lot.
    const updates = parts.map((part) => {
      const reason = assignmentBlockReason(part, mode, source, allocationIndex);
      if (reason) throw new Error(reason);
      const qty = quantity ?? remainingQty(part);
      if (!Number.isInteger(qty) || qty <= 0 || qty > allocationCapacity(part, mode, allocationIndex)) {
        throw new Error("Cantitatea depășește disponibilul sau nu este un număr întreg pozitiv.");
      }
      const allocations = allocationsForPart(part).map((allocation) => ({ ...allocation }));
      const allocation = { plate, model: model || null, qty };
      if (mode === "reassign") allocations[allocationIndex] = allocation;
      else allocations.push(allocation);
      return { part, allocations };
    });
    const snapshots = parts.map((part) => ({
      part,
      previous: {
        plate: part.plate,
        model: part.model,
        status: part.status,
        allocations: Array.isArray(part.allocations)
          ? part.allocations.map((allocation) => ({ ...allocation }))
          : part.allocations
      }
    }));

    try {
      updates.forEach(({ part, allocations }) => {
        part.allocations = allocations;
        // Câmpurile vechi descriu o singură mașină numai când aceasta este unică.
        part.plate = allocations.length === 1 ? allocations[0].plate : null;
        part.model = allocations.length === 1 ? allocations[0].model : null;
        if (["Neatribuită", "Atribuită"].includes(part.status)) {
          part.status = allocatedQty(part) > 0 ? "Atribuită" : "Neatribuită";
        }
      });
    } catch (error) {
      snapshots.forEach(({ part, previous }) => {
        part.plate = previous.plate;
        part.model = previous.model;
        part.status = previous.status;
        part.allocations = previous.allocations;
      });
      throw error;
    }
  };

  const saveAssignment = (event) => {
    event.preventDefault();
    if (assignmentUi.saving) return;

    const validation = validateAssignmentDraft();
    if (!validation.ok) {
      showAssignmentErrors(validation.errors, validation.firstInvalid);
      return;
    }

    const wasReassign = assignmentUi.mode === "reassign";
    const units = validation.quantity ?? validation.parts.reduce((sum, part) => sum + remainingQty(part), 0);
    const count = validation.parts.length;
    const firstName = validation.parts[0]?.name || "piesa selectată";
    assignmentUi.saving = true;
    els.assignmentSave.disabled = true;
    els.assignmentSave.textContent = "Se salvează…";

    try {
      applyAssignmentUpdates(validation.parts, validation.plate, validation.model, {
        mode: assignmentUi.mode,
        source: assignmentUi.source,
        allocationIndex: assignmentUi.allocationIndex,
        quantity: validation.quantity
      });
    } catch (error) {
      console.error("Eroare la atribuirea DEMO:", error);
      assignmentUi.saving = false;
      els.assignmentSave.disabled = false;
      els.assignmentSave.textContent = wasReassign ? "Salvează corectarea" : "Confirmă atribuirea";
      showAssignmentErrors(["Nu am putut salva atribuirea. Încearcă din nou."], null);
      return;
    }

    const assignedIds = new Set(validation.parts.map((part) => part.id));
    state.checkedPartIds.clear();
    if (state.tab === "unassigned" && state.selectedId && assignedIds.has(state.selectedId) && remainingQty(partById(state.selectedId)) === 0) {
      state.selectedId = null;
    }
    closeAssignmentModal({ restoreFocus: false });
    renderAll();

    const message = wasReassign
      ? `Alocarea pentru ${firstName} a fost corectată: ${units} buc. la ${validation.plate}. Celelalte alocări, factura și retururile au rămas neschimbate.`
      : count === 1
        ? `${units} buc. din ${firstName} au fost atribuite la ${validation.plate}. Linia facturii și retururile au rămas neschimbate.`
        : `${units} buc. din ${count} poziții au fost atribuite la ${validation.plate}. Alocările existente, facturile și retururile au rămas neschimbate.`;
    showToast(wasReassign ? "Atribuire actualizată" : "Atribuire salvată", message);

    window.requestAnimationFrame(() => {
      if (els.detailsPanel.classList.contains("is-open")) {
        els.closeDetails.focus({ preventScroll: true });
        return;
      }
      if (state.tab === "parts") {
        const row = els.tableBody.querySelector(`tr[data-id="${CSS.escape(validation.parts[0].id)}"]`);
        if (row) {
          row.scrollIntoView({ block: "nearest" });
          row.focus({ preventScroll: true });
          return;
        }
      }
      const firstCheckbox = els.tableBody.querySelector("[data-bulk-part]");
      (firstCheckbox || els.searchInput).focus({ preventScroll: true });
    });
  };

  /* -----------------------------------------------------------------------
     Import DF DEMO: registru separat, cu disponibil verificat la confirmare
     ----------------------------------------------------------------------- */
  const dfVehicles = () => [...new Set(DATA.parts
    .filter((part) => !dfUi.contextPartId || part.id === dfUi.contextPartId)
    .flatMap((part) => allocationsForPart(part)
      .filter((allocation, index) => dfEligibleQty(part, index) > 0)
      .map((allocation) => normalizePlate(allocation.plate))).filter(Boolean))].sort();
  const dfRowsForPlate = (plate) => DATA.parts.flatMap((part) => allocationsForPart(part)
    .map((allocation, index) => ({ key: allocationId(part, index), partId: part.id, invoiceId: part.invoiceId, allocationIndex: index, allocation }))
    .filter((row) => normalizePlate(row.allocation.plate) === normalizePlate(plate)));

  const clearDfErrors = () => {
    els.dfFormError.hidden = true;
    els.dfFormError.textContent = "";
    els.dfForm.querySelectorAll(".is-invalid").forEach((field) => {
      field.classList.remove("is-invalid"); field.removeAttribute("aria-invalid");
    });
  };
  const validateDfSelection = () => {
    const errors = [], lines = [];
    const plate = normalizePlate(els.dfPlate.value);
    if (!plate || plate !== dfUi.plate || !dfVehicles().includes(plate)) errors.push({ message: "Selectează o mașină existentă." });
    if (!dfUi.selection.size) errors.push({ message: "Selectează cel puțin o alocare pentru import." });
    for (const [key, qty] of dfUi.selection) {
      const row = dfUi.rows.get(key);
      const part = row && partById(row.partId);
      const allocation = part && allocationsForPart(part)[row.allocationIndex];
      if (!part || !allocation || key !== allocationId(part, row.allocationIndex) || part.invoiceId !== row.invoiceId || normalizePlate(allocation.plate) !== plate) {
        errors.push({ key, message: "Alocarea selectată nu mai corespunde mașinii sau facturii. Redeschide lista." });
        continue;
      }
      if (part.df) {
        errors.push({ key, message: `${part.name}: poziție protejată de referința istorică ${part.df}.` });
        continue;
      }
      const eligible = dfEligibleQty(part, row.allocationIndex);
      if (!Number.isInteger(qty) || qty <= 0 || qty > eligible) {
        errors.push({ key, message: `${part.name}: introdu între 1 și ${eligible} buc. Retururile, magazia și importurile anterioare sunt excluse.` });
        continue;
      }
      if (!Number.isFinite(part.price) || part.price <= 0 || !invoiceById(part.invoiceId)) {
        errors.push({ key, message: `${part.name}: datele facturii sau prețul de achiziție nu sunt valide.` });
        continue;
      }
      lines.push({ partId: part.id, invoiceId: part.invoiceId, allocationId: key, allocationIndex: row.allocationIndex,
        plate, qty, unitPriceWithVat: part.price, vatRate: partVatPercent(part) });
    }
    return { ok: !errors.length, errors, lines };
  };
  const updateDfPreview = () => {
    const validation = validateDfSelection();
    const cents = validation.lines.reduce((sum, entry) => sum + entry.qty * toCents(entry.unitPriceWithVat), 0);
    const units = validation.lines.reduce((sum, entry) => sum + entry.qty, 0);
    const hasEligible = [...dfUi.rows.values()].some((row) => {
      const part = partById(row.partId);
      return part && dfEligibleQty(part, row.allocationIndex) > 0;
    });
    els.dfSelectionCount.textContent = `${dfUi.selection.size} alocări · ${units} buc. valide`;
    els.dfTotal.textContent = dfUi.selection.size && !validation.ok ? "—" : formatMoney(cents / 100);
    els.dfSave.disabled = !validation.ok || dfUi.saving;
    els.dfPreviewNote.textContent = validation.ok ? "Se creează o referință DEMO DF nouă."
      : !dfUi.selection.size ? hasEligible
        ? "Selectează alocările eligibile și verifică numărul de bucăți înainte de confirmare."
        : !dfUi.plate ? els.dfEmpty.textContent : "Mașina nu mai are cantități eligibile. Importurile existente, referințele DF istorice, retururile și magazia sunt excluse."
        : validation.errors.map((error) => error.message).join(" ");
    els.dfRows.querySelectorAll("[data-df-total]").forEach((element) => {
      const entry = validation.lines.find((line) => line.allocationId === element.dataset.dfTotal);
      element.textContent = formatMoney(entry ? entry.qty * toCents(entry.unitPriceWithVat) / 100 : 0);
    });
    els.dfRows.querySelectorAll("[data-df-qty]").forEach((input) => {
      input.disabled = !dfUi.selection.has(input.dataset.dfQty);
    });
  };
  const renderDfPicker = (preferredPlate = dfUi.plate) => {
    clearDfErrors();
    const vehicles = dfVehicles();
    dfUi.plate = vehicles.includes(normalizePlate(preferredPlate)) ? normalizePlate(preferredPlate) : vehicles[0] || "";
    dfUi.selection.clear();
    dfUi.saving = false;
    setSelectOptions(els.dfPlate, vehicles.map((plate) => ({ value: plate, label: plate })), dfUi.plate);
    const rows = dfRowsForPlate(dfUi.plate);
    dfUi.rows = new Map(rows.map((row) => [row.key, row]));
    els.dfRows.innerHTML = rows.map((row) => {
      const part = partById(row.partId), invoice = invoiceById(row.invoiceId), supplier = supplierById(invoice.supplierId);
      const eligible = dfEligibleQty(part, row.allocationIndex), imported = allocationImportedQty(part, row.allocationIndex);
      const key = escapeHTML(row.key);
      return `<tr>
        <td data-label="Selectează" class="ep-df-select-cell"><input type="checkbox" class="ep-row-check" data-df-select="${key}" aria-label="Importă ${escapeHTML(part.name)} · alocarea ${row.allocationIndex + 1}"${eligible <= 0 ? " disabled" : ""}></td>
        <td data-label="Piesă / factură / furnizor" class="ep-df-part"><strong>${escapeHTML(part.name)}</strong><small>${escapeHTML(part.code || "—")} · ${escapeHTML(invoice.number)}</small><small>${escapeHTML(supplier.name)} · alocarea ${row.allocationIndex + 1}</small></td>
        <td data-label="Cantități"><small>Alocate: ${row.allocation.qty} buc.</small><small>Deja DEMO DF: ${imported} buc.</small>${allocationReturnQty(part, row.allocationIndex) > 0 ? `<small>Rezervate / returnate: ${allocationReturnQty(part, row.allocationIndex)} buc.</small>` : ""}${allocationWarehouseQty(part, row.allocationIndex) > 0 ? `<small class="ep-warehouse-text">Trimis în magazie: ${allocationWarehouseQty(part, row.allocationIndex)} buc.</small>` : ""}<strong>Eligibile: ${eligible} buc.</strong>${part.df ? `<small>Protejat: ${escapeHTML(part.df)} (istoric)</small>` : ""}</td>
        <td data-label="Cant. import"><label class="ep-field ep-df-qty"><span class="ep-sr-only">Cantitate pentru ${escapeHTML(part.name)}, alocarea ${row.allocationIndex + 1}</span><input type="number" min="1" max="${eligible}" step="1" inputmode="numeric" value="${Math.max(0, eligible)}" data-df-qty="${key}" disabled></label></td>
        <td data-label="Achiziție / buc. cu TVA">${formatMoney(part.price)}</td>
        <td data-label="Valoare cu TVA"><strong data-df-total="${key}">${formatMoney(0)}</strong></td>
      </tr>`;
    }).join("");
    els.dfEmpty.hidden = rows.length > 0;
    els.dfEmpty.textContent = vehicles.length ? "Mașina nu are alocări în memoria DEMO."
      : dfUi.contextPartId ? "Piesa nu mai are cantități eligibile pentru import." : "Nu există cantități eligibile pentru import.";
    els.dfPicker.hidden = false;
    els.dfSummary.hidden = true;
    els.dfNewImport.hidden = true;
    els.dfSave.hidden = false;
    els.dfCancel.textContent = "Anulează";
    els.dfModalTitle.textContent = "Importă în DF · DEMO";
    updateDfPreview();
    els.dfBody.scrollTop = 0;
  };
  const showDfSummary = (reference) => {
    const records = DATA.dfImports.filter((entry) => entry.reference === reference);
    if (!records.length) return;
    clearDfErrors();
    dfUi.plate = records[0].plate;
    els.dfPicker.hidden = true;
    els.dfSummary.hidden = false;
    els.dfNewImport.hidden = false;
    els.dfSave.hidden = true;
    els.dfCancel.textContent = "Închide";
    els.dfModalTitle.textContent = `Import simulat · ${reference}`;
    const cents = records.reduce((sum, entry) => sum + entry.qty * toCents(entry.unitPriceWithVat), 0);
    const units = records.reduce((sum, entry) => sum + entry.qty, 0);
    els.dfSummaryBody.innerHTML = `<div class="ep-detail-card">${detailRow("Referință fictivă", escapeHTML(reference))}${detailRow("Mașină", escapeHTML(records[0].plate))}${detailRow("Data simulării", formatDate(records[0].createdAt.slice(0, 10)))}${detailRow("Cantitate importată", `${units} buc. din ${records.length} alocări`)}</div>
      <div class="ep-df-table-wrap"><table class="ep-df-table"><thead><tr><th scope="col">Piesă / sursă</th><th scope="col">Cantitate</th><th scope="col">Achiziție / buc. cu TVA</th><th scope="col">Valoare cu TVA</th></tr></thead><tbody>${records.map((entry) => {
        const part = partById(entry.partId), invoice = invoiceById(entry.invoiceId), supplier = invoice && supplierById(invoice.supplierId);
        return `<tr><td data-label="Piesă / sursă" class="ep-df-part"><strong>${escapeHTML(part?.name || "Piesă indisponibilă")}</strong><small>${escapeHTML(part?.code || "—")} · ${escapeHTML(invoice?.number || "Factură indisponibilă")} · ${escapeHTML(supplier?.name || "—")}</small><small>Alocarea ${entry.allocationIndex + 1} · ${escapeHTML(entry.plate)}</small></td><td data-label="Cantitate">${entry.qty} buc.</td><td data-label="Achiziție / buc. cu TVA">${formatMoney(entry.unitPriceWithVat)}</td><td data-label="Valoare cu TVA">${formatMoney(entry.qty * toCents(entry.unitPriceWithVat) / 100)}</td></tr>`;
      }).join("")}</tbody></table></div><div class="ep-df-totals"><span>Achiziție · fără adaos</span><strong>Total cu TVA: ${formatMoney(cents / 100)}</strong></div><p class="ep-detail-note">Datele DEMO se resetează la refresh.</p>`;
    els.dfBody.scrollTop = 0;
  };
  const openDfModal = ({ partId = null, invoiceId = null, plate = "", reference = null, trigger = document.activeElement } = {}) => {
    if (!els.dfModal.hidden) return;
    const saved = reference && DATA.dfImports.find((entry) => entry.reference === reference);
    if (reference && !saved) { showToast("Import indisponibil", "Referința DEMO nu mai există în memorie."); return; }
    const contextParts = partId ? [partById(partId)].filter(Boolean) : invoiceId ? partsForInvoice(invoiceId) : [];
    const preferred = contextParts.flatMap((part) => allocationsForPart(part).filter((allocation, index) => dfEligibleQty(part, index) > 0))[0]?.plate;
    dfUi.contextPartId = reference ? null : partId;
    dfUi.trigger = trigger;
    dfUi.saving = false;
    renderDfPicker(saved?.plate || plate || preferred);
    if (reference) showDfSummary(reference);
    els.dfModal.hidden = false;
    document.body.classList.add("ep-modal-open");
    document.addEventListener("keydown", handleDfModalKeydown);
    window.requestAnimationFrame(() => (reference ? els.dfNewImport : els.dfPlate).focus({ preventScroll: true }));
  };
  const closeDfModal = () => {
    if (els.dfModal.hidden) return;
    els.dfModal.hidden = true;
    document.body.classList.remove("ep-modal-open");
    document.removeEventListener("keydown", handleDfModalKeydown);
    const trigger = dfUi.trigger;
    dfUi.trigger = null; dfUi.contextPartId = null; dfUi.selection.clear(); dfUi.rows.clear(); dfUi.saving = false;
    (trigger && document.contains(trigger) && !trigger.disabled ? trigger
      : els.detailsPanel.classList.contains("is-open") ? els.closeDetails : els.searchInput).focus({ preventScroll: true });
  };
  const handleDfModalKeydown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault(); event.stopImmediatePropagation(); closeDfModal(); return;
    }
    if (event.key !== "Tab") return;
    const focusables = Array.from(els.dfModal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.offsetParent !== null);
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (first && event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  const saveDfImport = (event) => {
    event.preventDefault();
    if (dfUi.saving || els.dfModal.hidden || els.dfPicker.hidden) return;
    clearDfErrors();
    const validation = validateDfSelection();
    if (!validation.ok) {
      els.dfFormError.textContent = validation.errors.map((error) => error.message).join(" ");
      els.dfFormError.hidden = false;
      els.dfBody.scrollTop = 0;
      els.dfFormError.focus({ preventScroll: true });
      return;
    }
    dfUi.saving = true;
    els.dfSave.disabled = true;
    const number = Math.max(0, ...DATA.dfImports.map((entry) => Number(entry.reference.match(/^DEMO-DF-(\d+)$/)?.[1] || 0))) + 1;
    const reference = `DEMO-DF-${String(number).padStart(3, "0")}`;
    const createdAt = new Date().toISOString();
    const records = validation.lines.map((line) => ({ ...line, id: `${reference}:${line.allocationId}`, reference, createdAt }));
    const previousLength = DATA.dfImports.length;
    try { DATA.dfImports.push(...records); }
    catch (error) {
      DATA.dfImports.length = previousLength;
      console.error("Eroare la importul DF DEMO:", error);
      dfUi.saving = false; els.dfSave.disabled = false;
      els.dfFormError.textContent = "Importul simulat nu a fost salvat. Încearcă din nou.";
      els.dfFormError.hidden = false;
      return;
    }
    renderAll();
    showDfSummary(reference);
    showToast("Import DF simulat", `${reference} · ${records.reduce((sum, entry) => sum + entry.qty, 0)} buc. pentru ${dfUi.plate}. Valorile de achiziție și facturile au rămas neschimbate.`);
    window.requestAnimationFrame(() => els.dfNewImport.focus({ preventScroll: true }));
  };

  /* -----------------------------------------------------------------------
     Trimitere în magazie: o sursă per operație, rezervată imediat la confirmare
     ----------------------------------------------------------------------- */
  const clearWarehouseError = () => {
    els.warehouseFormError.hidden = true;
    els.warehouseFormError.textContent = "";
  };
  const selectedWarehouseSource = () => warehouseUi.sources?.get(els.warehouseSource.value) || null;
  const updateWarehouseAvailability = ({ resetQty = false } = {}) => {
    const part = partById(warehouseUi.partId);
    const capacity = warehouseCapacity(part, selectedWarehouseSource());
    els.warehouseQty.max = String(capacity);
    if (resetQty) els.warehouseQty.value = capacity > 0 ? "1" : "";
    els.warehouseSave.disabled = capacity <= 0;
    els.warehouseAvailability.textContent = `${capacity} buc. eligibile din sursa selectată. Confirmarea le rezervă imediat pentru magazie.`;
  };
  const openWarehouseModal = ({ partId, trigger = document.activeElement } = {}) => {
    if (!els.warehouseModal.hidden) return;
    const part = partById(partId);
    if (warehouseEligibleQty(part) <= 0) {
      showToast("Magazie indisponibilă", part?.df ? `Poziție protejată de ${part.df}.` : "Nu există cantități eligibile pentru trimitere.");
      return;
    }
    warehouseUi.partId = part.id;
    warehouseUi.invoiceId = part.invoiceId;
    warehouseUi.trigger = trigger;
    warehouseUi.saving = false;
    /* Copia sursei păstrează mașina istorică și detectează schimbarea ei înainte de salvare. */
    warehouseUi.sources = new Map(warehouseSources(part).map(({ value, source }) => {
      const allocation = source.type === "allocation" ? allocationsForPart(part)[source.allocationIndex] : null;
      return [value, { ...source, ...(allocation ? { allocationId: allocationId(part, source.allocationIndex), plate: allocation.plate, model: allocation.model } : {}) }];
    }));
    els.warehouseForm.reset();
    clearWarehouseError();
    els.warehouseContext.innerHTML = detailRow("Piesă", escapeHTML(part.name))
      + detailRow("Factură", escapeHTML(invoiceById(part.invoiceId).number))
      + detailRow("Cantitate originală", `${part.qty} buc.`);
    els.warehouseSource.innerHTML = [...warehouseUi.sources].map(([value, source]) => {
      const capacity = warehouseCapacity(part, source);
      return `<option value="${value}"${capacity <= 0 ? " disabled" : ""}>${escapeHTML(returnSourceLabel({ source }))} · ${capacity} buc. eligibile</option>`;
    }).join("");
    els.warehouseSource.value = [...warehouseUi.sources].find(([, source]) => warehouseCapacity(part, source) > 0)[0];
    updateWarehouseAvailability({ resetQty: true });
    els.warehouseBody.scrollTop = 0;
    els.warehouseModal.hidden = false;
    document.body.classList.add("ep-modal-open");
    document.addEventListener("keydown", handleWarehouseModalKeydown);
    window.requestAnimationFrame(() => els.warehouseQty.focus({ preventScroll: true }));
  };
  const closeWarehouseModal = ({ restoreFocus = true } = {}) => {
    if (els.warehouseModal.hidden) return;
    els.warehouseModal.hidden = true;
    document.body.classList.remove("ep-modal-open");
    document.removeEventListener("keydown", handleWarehouseModalKeydown);
    if (restoreFocus && warehouseUi.trigger && document.contains(warehouseUi.trigger)) warehouseUi.trigger.focus({ preventScroll: true });
    warehouseUi.partId = null;
    warehouseUi.invoiceId = null;
    warehouseUi.sources = null;
    warehouseUi.trigger = null;
    warehouseUi.saving = false;
  };
  /* Escape închide formularul; Tab și Shift+Tab rămân în dialog. */
  const handleWarehouseModalKeydown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeWarehouseModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusables = [...els.warehouseModal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((element) => element.offsetParent !== null);
    const first = focusables[0], last = focusables.at(-1);
    if (first && event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  const saveWarehouseTransfer = (event) => {
    event.preventDefault();
    if (warehouseUi.saving || els.warehouseModal.hidden) return;
    clearWarehouseError();
    const part = partById(warehouseUi.partId);
    const source = selectedWarehouseSource();
    const qty = Number(els.warehouseQty.value);
    const allocation = source?.type === "allocation" && part ? allocationsForPart(part)[source.allocationIndex] : null;
    const sourceValid = part && part.invoiceId === warehouseUi.invoiceId && source
      && (source.type === "unallocated" || (allocation && source.allocationId === allocationId(part, source.allocationIndex)
        && source.plate === allocation.plate && source.model === allocation.model));
    const capacity = sourceValid ? warehouseCapacity(part, source) : 0;
    if (!sourceValid || !Number.isInteger(qty) || qty <= 0 || qty > capacity) {
      els.warehouseFormError.textContent = !sourceValid ? "Sursa s-a schimbat. Redeschide formularul."
        : `Introdu între 1 și ${capacity} buc. eligibile. Retururile, DF și trimiterile anterioare sunt excluse.`;
      els.warehouseFormError.hidden = false;
      els.warehouseFormError.focus({ preventScroll: true });
      updateWarehouseAvailability();
      return;
    }
    warehouseUi.saving = true;
    els.warehouseSave.disabled = true;
    const previousLength = DATA.warehouseTransfers.length;
    const reference = `DEMO-MAG-${String(previousLength + 1).padStart(3, "0")}`;
    try {
      DATA.warehouseTransfers.push({ id: reference, reference, partId: part.id, invoiceId: part.invoiceId,
        qty, source: { ...source }, notes: els.warehouseNotes.value.trim(),
        createdAt: new Date().toISOString(), localDate: localInvoiceToday() });
    } catch (error) {
      DATA.warehouseTransfers.length = previousLength;
      warehouseUi.saving = false;
      els.warehouseSave.disabled = false;
      els.warehouseFormError.textContent = "Trimiterea nu a fost salvată. Încearcă din nou.";
      els.warehouseFormError.hidden = false;
      return;
    }
    closeWarehouseModal({ restoreFocus: false });
    if (state.selectedId && !getVisibleRows().some((row) => row.id === state.selectedId)) state.selectedId = null;
    renderAll();
    showToast("Trimis în magazie · DEMO", `${reference} · ${qty} buc. rezervate. Factura și asocierile istorice rămân păstrate.`);
    window.requestAnimationFrame(() => (els.detailsPanel.classList.contains("is-open") ? els.closeDetails : els.searchInput).focus({ preventScroll: true }));
  };

  /* -----------------------------------------------------------------------
     Retururi furnizor: rezervare pe sursă și avansare cronologică
     ----------------------------------------------------------------------- */
  const returnToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };
  const latestReturnDate = (item) => RETURN_STEPS.map((status) => returnStageDate(item, status)).filter(Boolean).sort().pop() || item.requestedAt;
  const selectedReturnSource = () => {
    if (els.returnSource.value === "unallocated") return { type: "unallocated" };
    const match = els.returnSource.value.match(/^allocation:(\d+)$/);
    return match ? { type: "allocation", allocationIndex: Number(match[1]) } : null;
  };
  const returnBlockReason = (part) => !part ? "Piesa nu mai există în memoria DEMO."
    : part.df ? `Retur blocat de ${part.df}: modelul DEMO nu identifică separat cantitățile legate de DF.`
      : returnableQty(part) <= 0 ? "Nu mai există cantități disponibile pentru un retur nou." : "";

  const updateReturnAvailability = ({ resetQty = false } = {}) => {
    if (returnUi.editingId) return;
    const part = partById(returnUi.partId);
    const source = selectedReturnSource();
    const available = part && source ? returnCapacity(part, source) : 0;
    els.returnQty.max = String(available);
    if (resetQty) els.returnQty.value = available > 0 ? "1" : "";
    els.returnAvailability.textContent = part
      ? [`${available} buc. disponibile din sursa selectată`, `${part.qty} buc. pe factură`,
        reservedQty(part) > 0 && `${reservedQty(part)} rezervate retur`, returnedQty(part) > 0 && `${returnedQty(part)} returnate`,
        demoImportedQty(part) > 0 && `${demoImportedQty(part)} importate DEMO DF`
      ].filter(Boolean).join(" · ") + ". Cantitatea se rezervă la confirmare." : "Piesă indisponibilă.";
  };
  const clearReturnErrors = () => {
    els.returnFormError.hidden = true;
    els.returnFormError.textContent = "";
    els.returnForm.querySelectorAll(".is-invalid").forEach((field) => {
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
    });
  };
  const showReturnErrors = (errors) => {
    els.returnFormError.textContent = errors.map((error) => error.message).join(" ");
    els.returnFormError.hidden = false;
    errors.forEach(({ field }) => {
      field?.classList.add("is-invalid");
      field?.setAttribute("aria-invalid", "true");
    });
    els.returnBody.scrollTop = 0;
    (errors.find((error) => error.field)?.field || els.returnFormError).focus({ preventScroll: true });
  };

  const openReturnModal = ({ partId = null, returnId = null, trigger = document.activeElement } = {}) => {
    if (!els.returnModal.hidden) return;
    const item = returnId ? DATA.returns.find((entry) => entry.id === returnId) : null;
    const part = partById(item?.partId || partId);
    if (returnId && (!item || item.status === "Finalizat")) {
      showToast("Retur indisponibil", "Returul nu există sau este deja finalizat.");
      return;
    }
    const blocked = item ? !part && "Piesa returului nu mai există." : returnBlockReason(part);
    if (blocked) { showToast("Retur blocat", blocked); return; }
    returnUi.partId = part.id;
    returnUi.editingId = item?.id || null;
    returnUi.expectedStatus = item?.status || null;
    returnUi.trigger = trigger;
    returnUi.saving = false;
    clearReturnErrors();
    const invoice = invoiceById(part.invoiceId);
    const supplier = supplierById(invoice.supplierId);
    els.returnContext.innerHTML = detailRow("Piesă", escapeHTML(part.name))
      + detailRow("Factură originală", escapeHTML(invoice.number))
      + detailRow("Furnizor", escapeHTML(supplier.name))
      + (item ? detailRow("Retur", `${escapeHTML(item.code)} · ${item.qty} buc.`) + detailRow("Sursă", escapeHTML(returnSourceLabel(item))) + detailRow("Motiv", escapeHTML(item.reason)) : "");
    els.returnCreateFields.hidden = Boolean(item);
    els.returnStatusFields.hidden = !item;
    els.returnModalTitle.textContent = item ? `Actualizează ${item.code}` : "Înregistrează retur";
    els.returnDateLabel.textContent = item ? "Data etapei" : "Data cererii";
    els.returnDate.min = item ? latestReturnDate(item) : invoice.date;
    els.returnDate.value = [returnToday(), els.returnDate.min].sort().pop();
    if (item) {
      const next = RETURN_STEPS[RETURN_STEPS.indexOf(item.status) + 1];
      els.returnCurrentStatus.value = item.status;
      els.returnNextStatus.value = next;
      els.returnAvailability.textContent = `Se confirmă trecerea la „${next}”. Rezervarea celor ${item.qty} buc. rămâne activă pentru sursa înregistrată; finalizarea nu readuce cantitatea în disponibil.`;
      els.returnSave.textContent = "Confirmă stadiul";
    } else {
      const sources = [{ value: "unallocated", label: "Cantitate nealocată", source: { type: "unallocated" } },
        ...allocationsForPart(part).map((allocation, index) => ({ value: `allocation:${index}`, label: `Alocare ${index + 1} · ${allocation.plate}${allocation.model ? ` · ${allocation.model}` : ""}`, source: { type: "allocation", allocationIndex: index } }))];
      els.returnSource.innerHTML = sources.map(({ value, label, source }) => {
        const available = returnCapacity(part, source);
        return `<option value="${value}"${available <= 0 ? " disabled" : ""}>${escapeHTML(label)} · ${available} buc. disponibile</option>`;
      }).join("");
      els.returnSource.value = sources.find(({ source }) => returnCapacity(part, source) > 0).value;
      els.returnReason.value = "";
      els.returnReference.value = "";
      els.returnNotes.value = "";
      els.returnSave.textContent = "Înregistrează returul";
      updateReturnAvailability({ resetQty: true });
    }
    els.returnSave.disabled = false;
    els.returnBody.scrollTop = 0;
    els.returnModal.hidden = false;
    document.body.classList.add("ep-modal-open");
    document.addEventListener("keydown", handleReturnModalKeydown);
    window.requestAnimationFrame(() => (item ? els.returnDate : els.returnQty).focus({ preventScroll: true }));
  };
  const closeReturnModal = ({ restoreFocus = true } = {}) => {
    if (els.returnModal.hidden) return;
    els.returnModal.hidden = true;
    document.body.classList.remove("ep-modal-open");
    document.removeEventListener("keydown", handleReturnModalKeydown);
    if (restoreFocus && returnUi.trigger && document.contains(returnUi.trigger)) returnUi.trigger.focus({ preventScroll: true });
    returnUi.partId = null;
    returnUi.editingId = null;
    returnUi.expectedStatus = null;
    returnUi.trigger = null;
    returnUi.saving = false;
  };
  const handleReturnModalKeydown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeReturnModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusables = Array.from(els.returnModal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.offsetParent !== null);
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (first && event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const saveReturn = (event) => {
    event.preventDefault();
    if (returnUi.saving || els.returnModal.hidden) return;
    clearReturnErrors();
    const errors = [];
    const part = partById(returnUi.partId);
    const item = DATA.returns.find((entry) => entry.id === returnUi.editingId);
    const date = els.returnDate.value;
    const minimumDate = item ? latestReturnDate(item) : part && invoiceById(part.invoiceId)?.date;
    if (!isValidISODate(date) || (minimumDate && date < minimumDate)) errors.push({ message: "Introdu o dată validă, cel puțin egală cu data documentului sau a ultimei etape.", field: els.returnDate });
    let source = null, qty = null, nextStatus = null;
    if (returnUi.editingId) {
      const index = item ? RETURN_STEPS.indexOf(item.status) : -1;
      if (!part || !item || item.status !== returnUi.expectedStatus || index < 0 || index >= RETURN_STEPS.length - 1) {
        errors.push({ message: "Stadiul returului s-a schimbat sau nu mai poate fi avansat. Redeschide formularul." });
      } else nextStatus = RETURN_STEPS[index + 1];
    } else {
      const blocked = returnBlockReason(part);
      if (blocked) errors.push({ message: blocked });
      source = selectedReturnSource();
      qty = Number(els.returnQty.value);
      const capacity = part && source ? returnCapacity(part, source) : 0;
      if (!source || capacity <= 0) errors.push({ message: "Sursa nu mai are cantitate disponibilă pentru retur.", field: els.returnSource });
      if (!Number.isInteger(qty) || qty <= 0 || qty > capacity) errors.push({ message: `Cantitatea trebuie să fie un număr întreg între 1 și ${capacity} buc.; rezervările existente nu pot fi suprapuse.`, field: els.returnQty });
      if (!els.returnReason.value.trim()) errors.push({ message: "Completează motivul returului.", field: els.returnReason });
    }
    if (errors.length) { showReturnErrors(errors); return; }
    returnUi.saving = true;
    els.returnSave.disabled = true;
    let saved;
    try {
      if (item) {
        const history = [...(item.history || []), { status: nextStatus, date }];
        const dateField = { "Așteaptă ridicare": "waitingAt", "Ridicat": "pickedUpAt", "Finalizat": "completedAt" }[nextStatus];
        Object.assign(item, { status: nextStatus, [dateField]: date, history });
        saved = item;
      } else {
        const number = Math.max(0, ...DATA.returns.flatMap((entry) => [Number(entry.id.match(/^ret-(\d+)$/i)?.[1] || 0), Number(entry.code.match(/^RET-(\d+)$/i)?.[1] || 0)])) + 1;
        const allocation = source.type === "allocation" ? allocationsForPart(part)[source.allocationIndex] : null;
        saved = {
          id: `ret-${number}`, code: `RET-${String(number).padStart(3, "0")}`, partId: part.id, qty,
          source: { ...source, ...(allocation ? { plate: allocation.plate, model: allocation.model || null } : {}) },
          reason: els.returnReason.value.trim(), reference: els.returnReference.value.trim(),
          requestedAt: date, waitingAt: null, pickedUpAt: null, completedAt: null,
          note: els.returnNotes.value.trim(), status: RETURN_STEPS[0], history: [{ status: RETURN_STEPS[0], date }]
        };
        DATA.returns.push(saved);
      }
    } catch (error) {
      console.error("Eroare la salvarea returului DEMO:", error);
      returnUi.saving = false;
      els.returnSave.disabled = false;
      showReturnErrors([{ message: "Returul nu a putut fi salvat. Încearcă din nou." }]);
      return;
    }
    closeReturnModal({ restoreFocus: false });
    if (state.selectedId && !getVisibleRows().some((row) => row.id === state.selectedId)) state.selectedId = null;
    renderAll();
    showToast(item ? "Stadiu retur actualizat" : "Retur înregistrat", `${saved.code} · ${saved.qty} buc. · ${saved.status}. Factura și asocierile auto au rămas neschimbate.`);
    window.requestAnimationFrame(() => (els.detailsPanel.classList.contains("is-open") ? els.closeDetails : els.searchInput).focus({ preventScroll: true }));
  };

  /* -----------------------------------------------------------------------
     Evenimentele interfeței și inițializarea
     ----------------------------------------------------------------------- */
  const handleAction = (action, id, trigger = null) => {
    switch (action) {
      case "view-invoice":
      case "open-invoice": {
        const invoice = invoiceById(id);
        if (invoice) setTab("invoices", { selectedId: invoice.id });
        break;
      }
      case "open-invoice-parts": {
        const invoice = invoiceById(id);
        if (!invoice) break;
        const firstPart = partsForInvoice(invoice.id)[0];
        setTab("parts", { search: invoice.number, selectedId: firstPart?.id || null });
        break;
      }
      case "open-part": {
        if (partById(id)) setTab("parts", { selectedId: id });
        break;
      }
      case "supplier-invoices": {
        if (supplierById(id)) setTab("invoices", { supplier: id });
        break;
      }
      case "edit-part":
        openInfoModal("editPart");
        break;
      case "import-demo-df":
        openDfModal({ partId: id, plate: trigger?.dataset.plate || "", trigger });
        break;
      case "import-invoice-demo-df":
        openDfModal({ invoiceId: id, trigger });
        break;
      case "view-demo-df":
        openDfModal({ reference: id, trigger });
        break;
      case "assign-part":
      case "reassign-part":
        openAssignmentModal({
          mode: action === "reassign-part" ? "reassign" : "assign",
          partIds: [id],
          allocationIndex: trigger?.dataset.allocationIndex !== undefined ? Number(trigger.dataset.allocationIndex) : null,
          trigger
        });
        break;
      case "edit-invoice":
        openInfoModal("editInvoice");
        break;
      case "edit-supplier": {
        const supplier = supplierById(id);
        if (supplier) openSupplierModal(supplier, trigger);
        break;
      }
      case "return-part":
        openReturnModal({ partId: id, trigger });
        break;
      case "warehouse-part":
        openWarehouseModal({ partId: id, trigger });
        break;
      case "update-return":
        openReturnModal({ returnId: id, trigger });
        break;
      case "open-return":
        if (DATA.returns.some((item) => item.id === id)) setTab("returns", { selectedId: id });
        break;
      case "reset-filters":
        resetFilters();
        break;
      default:
        break;
    }
  };

  const cacheElements = () => {
    els.tabs = document.querySelector(".ep-tabs");
    els.kpiGrid = document.getElementById("kpiGrid");
    els.listPanel = document.getElementById("listPanel");
    els.listTitle = document.getElementById("listTitle");
    els.listSubtitle = document.getElementById("listSubtitle");
    els.resultCount = document.getElementById("resultCount");
    els.searchInput = document.getElementById("searchInput");
    els.statusFilter = document.getElementById("statusFilter");
    els.supplierFilter = document.getElementById("supplierFilter");
    els.assignmentFilter = document.getElementById("assignmentFilter");
    [
      "bulkBar", "bulkCount", "bulkAssignBtn", "bulkClearBtn",
      "assignmentModal", "assignmentForm", "assignmentBody", "assignmentFormError",
      "assignmentModalEyebrow", "assignmentModalTitle", "assignmentModalNote",
      "assignmentCount", "assignmentPartsList", "assignmentPlate", "assignmentModel", "assignmentModelWarning",
      "assignmentQty", "assignmentQtyField", "assignmentQuantityPreview", "assignmentSummaryNote",
      "assignmentModeNote", "assignmentModalClose", "assignmentCancel", "assignmentSave"
    ].forEach((id) => { els[id] = document.getElementById(id); });
    ["returnModal", "returnModalTitle", "returnForm", "returnBody", "returnFormError", "returnContext",
      "returnCreateFields", "returnStatusFields", "returnSource", "returnQty", "returnReference", "returnReason",
      "returnNotes", "returnCurrentStatus", "returnNextStatus", "returnDate", "returnDateLabel", "returnAvailability",
      "returnModalClose", "returnCancel", "returnSave"].forEach((id) => { els[id] = document.getElementById(id); });
    ["warehouseModal", "warehouseForm", "warehouseBody", "warehouseFormError", "warehouseContext", "warehouseSource",
      "warehouseQty", "warehouseNotes", "warehouseAvailability", "warehouseModalClose", "warehouseCancel", "warehouseSave"]
      .forEach((id) => { els[id] = document.getElementById(id); });
    ["dfModal", "dfModalTitle", "dfForm", "dfBody", "dfFormError", "dfPicker", "dfPlate", "dfRows", "dfEmpty",
      "dfSelectionCount", "dfTotal", "dfPreviewNote", "dfSummary", "dfSummaryBody", "dfModalClose", "dfCancel", "dfNewImport", "dfSave"]
      .forEach((id) => { els[id] = document.getElementById(id); });
    els.resetFilters = document.getElementById("resetFilters");
    els.tableHead = document.getElementById("tableHead");
    els.tableBody = document.getElementById("tableBody");
    els.tableSummary = document.getElementById("tableSummary");
    els.footerHint = document.getElementById("footerHint");
    els.detailsPanel = document.getElementById("detailsPanel");
    els.detailsTitle = document.getElementById("detailsTitle");
    els.detailsEyebrow = document.getElementById("detailsEyebrow");
    els.detailsBody = document.getElementById("detailsBody");
    els.closeDetails = document.getElementById("closeDetails");
    els.detailBackdrop = document.getElementById("detailBackdrop");
    els.newInvoiceBtn = document.getElementById("newInvoiceBtn");
    els.infoModal = document.getElementById("infoModal");
    els.infoModalEyebrow = document.getElementById("infoModalEyebrow");
    els.infoModalTitle = document.getElementById("infoModalTitle");
    els.infoModalMessage = document.getElementById("infoModalMessage");
    els.infoModalClose = document.getElementById("infoModalClose");
    els.infoModalOk = document.getElementById("infoModalOk");
    els.invoiceModal = document.getElementById("invoiceModal");
    els.invoiceForm = document.getElementById("invoiceForm");
    els.invoiceBody = document.getElementById("invoiceBody");
    els.invoiceSupplier = document.getElementById("invoiceSupplier");
    els.invoiceNumber = document.getElementById("invoiceNumber");
    els.invoiceDate = document.getElementById("invoiceDate");
    els.invoiceStatus = document.getElementById("invoiceStatus");
    els.invoiceNotes = document.getElementById("invoiceNotes");
    els.invoiceFormError = document.getElementById("invoiceFormError");
    els.addInvoiceLine = document.getElementById("addInvoiceLine");
    els.invoiceLinesBody = document.getElementById("invoiceLinesBody");
    els.invoiceLineCount = document.getElementById("invoiceLineCount");
    els.invoiceSubtotal = document.getElementById("invoiceSubtotal");
    els.invoiceVat = document.getElementById("invoiceVat");
    els.invoiceTotal = document.getElementById("invoiceTotal");
    els.invoiceVatRateSummary = document.getElementById("invoiceVatRateSummary");
    els.invoiceModalClose = document.getElementById("invoiceModalClose");
    els.invoiceCancel = document.getElementById("invoiceCancel");
    els.invoiceSave = document.getElementById("invoiceSave");
    els.invoiceEntryTimer = document.getElementById("invoiceEntryTimer");
    els.addSupplierBtn = document.getElementById("addSupplierBtn");
    els.supplierModal = document.getElementById("supplierModal");
    els.supplierForm = document.getElementById("supplierForm");
    els.supplierBody = document.getElementById("supplierBody");
    els.supplierModalEyebrow = document.getElementById("supplierModalEyebrow");
    els.supplierModalTitle = document.getElementById("supplierModalTitle");
    els.supplierModalNote = document.getElementById("supplierModalNote");
    els.supplierFormError = document.getElementById("supplierFormError");
    els.supplierName = document.getElementById("supplierName");
    els.supplierCui = document.getElementById("supplierCui");
    els.supplierRegCom = document.getElementById("supplierRegCom");
    els.supplierContact = document.getElementById("supplierContact");
    els.supplierCity = document.getElementById("supplierCity");
    els.supplierPhone = document.getElementById("supplierPhone");
    els.supplierEmail = document.getElementById("supplierEmail");
    els.supplierAddress = document.getElementById("supplierAddress");
    els.supplierNotes = document.getElementById("supplierNotes");
    els.supplierBankList = document.getElementById("supplierBankList");
    els.supplierBankEmpty = document.getElementById("supplierBankEmpty");
    els.addSupplierBank = document.getElementById("addSupplierBank");
    els.supplierModalClose = document.getElementById("supplierModalClose");
    els.supplierCancel = document.getElementById("supplierCancel");
    els.supplierSave = document.getElementById("supplierSave");
    els.successToast = document.getElementById("successToast");
    els.successToastTitle = document.getElementById("successToastTitle");
    els.successToastMessage = document.getElementById("successToastMessage");
  };

  const initInvoiceDatePicker = () => {
    if (!window.flatpickr || !els.invoiceDate) return;
    const config = {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d.m.Y",
      ariaDateFormat: "d.m.Y",
      allowInput: true,
      disableMobile: true,
      parseDate: (dateStr, format) => {
        if (format === "d.m.Y") {
          const iso = parseRomanianDate(dateStr);
          return iso ? window.flatpickr.parseDate(iso, "Y-m-d") : undefined;
        }
        return window.flatpickr.parseDate(dateStr, format);
      },
      onReady: (selectedDates, dateStr, instance) => {
        instance.calendarContainer.classList.add("ep-flatpickr");
        const altInput = instance.altInput;
        if (!altInput) return;
        altInput.id = "invoiceDateDisplay";
        altInput.setAttribute("autocomplete", "off");
        altInput.setAttribute("aria-required", "true");
        altInput.setAttribute("placeholder", "zz.ll.aaaa");
        const label = els.invoiceDate.closest(".ep-field");
        if (label) label.htmlFor = altInput.id;
      },
      onChange: (selectedDates, dateStr) => {
        /* Flatpickr emite schimbări sintetice; pornește timpul doar dacă data s-a schimbat. */
        if (dateStr !== invoiceUi.lastDateValue) startInvoiceEntryTimer();
        invoiceUi.lastDateValue = dateStr;
        const altInput = invoiceUi.datePicker?.altInput;
        if (altInput) {
          altInput.classList.remove("is-invalid");
          altInput.removeAttribute("aria-invalid");
        }
        clearInvoiceErrorMessage();
      }
    };
    if (window.flatpickr.l10ns && window.flatpickr.l10ns.ro) {
      config.locale = window.flatpickr.l10ns.ro;
    }
    invoiceUi.datePicker = window.flatpickr(els.invoiceDate, config);
  };

  const bindEvents = () => {
    /* Navigarea prin taburi, cu săgeți pentru tastatură */
    els.tabs.addEventListener("click", (event) => {
      const tab = event.target.closest(".ep-tab");
      if (tab) setTab(tab.dataset.tab);
    });

    els.tabs.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      const tabs = Array.from(els.tabs.querySelectorAll(".ep-tab"));
      const currentIndex = tabs.indexOf(document.activeElement);
      if (currentIndex < 0) return;

      let nextIndex = currentIndex;
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;

      event.preventDefault();
      tabs[nextIndex].focus();
      setTab(tabs[nextIndex].dataset.tab);
    });

    /* Căutarea și filtrele registrului activ */
    els.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value;
      applyFilters();
    });

    [
      [els.statusFilter, "status"],
      [els.supplierFilter, "supplier"],
      [els.assignmentFilter, "assignment"]
    ].forEach(([select, key]) => {
      select.addEventListener("change", () => {
        state[key] = select.value;
        applyFilters();
      });
    });

    els.resetFilters.addEventListener("click", resetFilters);

    /* Selecția rândurilor din tabel */
    els.tableBody.addEventListener("click", (event) => {
      if (event.target.closest("[data-bulk-part]")) return;
      if (event.target.closest("[data-action]")) return;
      const row = event.target.closest("tr[data-id]");
      if (row) selectRow(row.dataset.id);
    });

    els.tableBody.addEventListener("keydown", (event) => {
      if (event.target.closest("[data-bulk-part]")) return;
      if (event.target.closest("[data-action]")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      const row = event.target.closest("tr[data-id]");
      if (!row) return;
      event.preventDefault();
      selectRow(row.dataset.id);
    });

    els.tableBody.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-bulk-part]");
      if (!checkbox || state.tab !== "unassigned") return;
      if (checkbox.checked) state.checkedPartIds.add(checkbox.dataset.bulkPart);
      else state.checkedPartIds.delete(checkbox.dataset.bulkPart);
      pruneCheckedPartIds();
      syncBulkSelectionUI();
    });
    els.bulkAssignBtn.addEventListener("click", (event) => openAssignmentModal({
      source: "bulk",
      partIds: [...state.checkedPartIds],
      trigger: event.currentTarget
    }));
    els.bulkClearBtn.addEventListener("click", () => clearBulkSelection({ focus: true }));

    /* Formularul de atribuire: Enter trimite formularul; Escape și Tab sunt
       gestionate de funcția existentă cât timp dialogul este deschis. */
    els.assignmentForm.addEventListener("submit", saveAssignment);
    els.assignmentModalClose.addEventListener("click", () => closeAssignmentModal());
    els.assignmentCancel.addEventListener("click", () => closeAssignmentModal());
    els.assignmentModal.addEventListener("click", (event) => {
      if (event.target === els.assignmentModal) closeAssignmentModal();
    });
    els.assignmentForm.addEventListener("input", (event) => {
      if (event.target === els.assignmentPlate) syncAssignmentVehicleModel();
      if (event.target === els.assignmentQty) updateAssignmentQuantityPreview();
      clearAssignmentErrorMessage();
      event.target.classList.remove("is-invalid");
      event.target.removeAttribute("aria-invalid");
    });
    els.assignmentPlate.addEventListener("change", syncAssignmentVehicleModel);
    els.assignmentForm.addEventListener("focusout", (event) => {
      if (event.target === els.assignmentPlate) {
        syncAssignmentVehicleModel();
      } else if (event.target === els.assignmentModel) {
        els.assignmentModel.value = els.assignmentModel.value.trim();
      }
    });

    /* Magazie: confirmarea rezervă cantitatea; închiderea nu produce mișcări. */
    els.warehouseForm.addEventListener("submit", saveWarehouseTransfer);
    els.warehouseModalClose.addEventListener("click", () => closeWarehouseModal());
    els.warehouseCancel.addEventListener("click", () => closeWarehouseModal());
    els.warehouseModal.addEventListener("click", (event) => {
      if (event.target === els.warehouseModal) closeWarehouseModal();
    });
    els.warehouseSource.addEventListener("change", () => {
      clearWarehouseError();
      updateWarehouseAvailability({ resetQty: true });
    });
    els.warehouseForm.addEventListener("input", clearWarehouseError);
    els.warehouseForm.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.target.matches("input") && !event.isComposing) event.preventDefault();
    });

    /* Retururi furnizor: rezervare imediată și confirmarea etapei următoare. */
    els.returnForm.addEventListener("submit", saveReturn);
    els.returnModalClose.addEventListener("click", () => closeReturnModal());
    els.returnCancel.addEventListener("click", () => closeReturnModal());
    els.returnModal.addEventListener("click", (event) => {
      if (event.target === els.returnModal) closeReturnModal();
    });
    els.returnSource.addEventListener("change", () => {
      clearReturnErrors();
      updateReturnAvailability({ resetQty: true });
    });
    els.returnForm.addEventListener("input", () => clearReturnErrors());

    /* Import DF DEMO: selecția și cantitățile rămân locale formularului. */
    els.dfModalClose.addEventListener("click", closeDfModal);
    els.dfCancel.addEventListener("click", closeDfModal);
    els.dfModal.addEventListener("click", (event) => {
      if (event.target === els.dfModal) closeDfModal();
    });
    els.dfForm.addEventListener("submit", saveDfImport);
    els.dfPlate.addEventListener("change", () => renderDfPicker(els.dfPlate.value));
    els.dfNewImport.addEventListener("click", () => {
      renderDfPicker();
      window.requestAnimationFrame(() => els.dfPlate.focus({ preventScroll: true }));
    });
    els.dfRows.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-df-select]");
      if (!checkbox) return;
      const key = checkbox.dataset.dfSelect;
      const row = dfUi.rows.get(key);
      const part = row && partById(row.partId);
      const eligible = part ? dfEligibleQty(part, row.allocationIndex) : 0;
      if (checkbox.checked && eligible > 0) dfUi.selection.set(key, eligible);
      else { dfUi.selection.delete(key); checkbox.checked = false; }
      const input = els.dfRows.querySelector(`[data-df-qty="${CSS.escape(key)}"]`);
      if (input) input.value = String(Math.max(0, eligible));
      clearDfErrors(); updateDfPreview();
    });
    els.dfRows.addEventListener("input", (event) => {
      const input = event.target.closest("[data-df-qty]");
      if (!input || !dfUi.selection.has(input.dataset.dfQty)) return;
      dfUi.selection.set(input.dataset.dfQty, Number(input.value));
      clearDfErrors(); updateDfPreview();
    });

    /* Acțiunile contextuale din panoul de detalii și stările goale */
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-action]");
      if (!trigger) return;
      handleAction(trigger.dataset.action, trigger.dataset.id, trigger);
    });

    els.closeDetails.addEventListener("click", clearSelection);
    els.detailBackdrop.addEventListener("click", clearSelection);

    /* Dialogul informativ și formularul de factură nouă */
    els.newInvoiceBtn.addEventListener("click", (event) => openInvoiceModal(event.currentTarget));
    els.infoModalClose.addEventListener("click", closeInfoModal);
    els.infoModalOk.addEventListener("click", closeInfoModal);
    els.infoModal.addEventListener("click", (event) => {
      if (event.target === els.infoModal) closeInfoModal();
    });

    els.invoiceModalClose.addEventListener("click", () => closeInvoiceModal());
    els.invoiceCancel.addEventListener("click", () => closeInvoiceModal());
    els.invoiceForm.addEventListener("submit", saveInvoice);
    els.addInvoiceLine.addEventListener("click", () => addInvoiceLine(true));

    els.invoiceForm.addEventListener("input", (event) => {
      if (event.isTrusted) startInvoiceEntryTimer();
      clearInvoiceErrorMessage();
      if (event.target.matches(".is-invalid")) {
        event.target.classList.remove("is-invalid");
        event.target.removeAttribute("aria-invalid");
      }
      updateInvoiceFormTotals();
    });

    /* Selecturile pornesc timpul la schimbare; simpla focalizare nu îl pornește. */
    els.invoiceForm.addEventListener("change", (event) => {
      if (event.isTrusted) startInvoiceEntryTimer();
    });

    els.invoiceForm.addEventListener("focusout", (event) => {
      /* Majuscule la ieșirea din cod: păstrează caracterele și cursorul în timpul editării. */
      if (event.target.matches('[data-field="code"]')) {
        event.target.value = event.target.value.toUpperCase();
        return;
      }
      if (event.target === els.invoiceNumber) {
        event.target.value = normalizeInvoiceNumber(event.target.value);
        return;
      }
      if (event.target.matches('[data-field="name"]')) {
        event.target.value = formatPartName(event.target.value);
        return;
      }
      if (event.target.matches('[data-field="plate"]')) {
        event.target.value = normalizePlate(event.target.value);
      }
    });

    els.invoiceLinesBody.addEventListener("wheel", (event) => {
      const numericField = event.target.closest('input[data-field="price"], input[data-field="vat"]');
      if (!numericField || document.activeElement !== numericField) return;
      event.preventDefault();
    }, { passive: false });

    els.invoiceForm.addEventListener("keydown", (event) => {
      /* Enter avansează numai prin inputurile liniilor; Tab rămâne nativ. */
      if (event.key !== "Enter" || event.isComposing || event.defaultPrevented || !event.target.matches("input")) return;
      if (event.target === invoiceUi.datePicker?.altInput || event.target.closest(".flatpickr-calendar")) return;
      event.preventDefault();
      if (event.repeat || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      const row = event.target.closest("tr[data-line-id]");
      if (!row) return;
      const fields = [...row.querySelectorAll("input[data-field]:not([disabled])")];
      const nextField = fields[fields.indexOf(event.target) + 1];
      if (nextField) nextField.focus();
      else lineField(row.nextElementSibling || addInvoiceLine(false), "name")?.focus();
    });

    els.invoiceLinesBody.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-remove-line]");
      if (!removeButton) return;
      const rows = invoiceLineRows();
      if (rows.length <= 1) return;
      const row = removeButton.closest("tr");
      const nextRow = row.nextElementSibling || row.previousElementSibling;
      row.remove();
      renumberInvoiceLines();
      updateInvoiceFormTotals();
      lineField(nextRow, "name")?.focus();
    });

    /* Formularul de furnizor */
    els.addSupplierBtn.addEventListener("click", (event) => openSupplierModal(null, event.currentTarget));
    els.supplierModalClose.addEventListener("click", () => closeSupplierModal());
    els.supplierCancel.addEventListener("click", () => closeSupplierModal());
    els.supplierForm.addEventListener("submit", saveSupplier);
    els.addSupplierBank.addEventListener("click", () => {
      clearSupplierErrorMessage();
      addSupplierBankRow({}, true);
    });

    els.supplierForm.addEventListener("input", (event) => {
      normalizeSupplierField(event.target, true);
      clearSupplierErrorMessage();
      if (event.target.matches(".is-invalid")) {
        event.target.classList.remove("is-invalid");
        event.target.removeAttribute("aria-invalid");
      }
    });

    els.supplierForm.addEventListener("focusout", (event) => {
      normalizeSupplierField(event.target, false);
      if (event.target.matches("input[data-trim], textarea[data-trim]")) {
        event.target.value = event.target.value.trim();
      }
    });

    els.supplierForm.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || !event.target.matches("input")) return;
      event.preventDefault();
    });

    els.supplierBankList.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-remove-bank]");
      if (!removeButton) return;
      const row = removeButton.closest("[data-bank-row]");
      const nextRow = row.nextElementSibling || row.previousElementSibling;
      clearSupplierErrorMessage();
      row.remove();
      renumberSupplierBanks();
      if (nextRow && nextRow.isConnected) {
        nextRow.querySelector('[data-bank-field="iban"]')?.focus();
      } else {
        els.addSupplierBank.focus();
      }
    });

    /* Escape închide drawer-ul mobil, dacă nu există un modal deschis */
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !els.infoModal.hidden || !els.invoiceModal.hidden || !els.supplierModal.hidden || !els.assignmentModal.hidden || !els.returnModal.hidden || !els.dfModal.hidden || !els.warehouseModal.hidden) return;
      if (els.detailsPanel.classList.contains("is-open")) clearSelection();
    });
  };

  const init = () => {
    DATA.parts.forEach((part) => {
      part.allocations = allocationsForPart(part).map((allocation) => ({
        ...allocation,
        plate: normalizePlate(allocation.plate),
        model: allocation.model ?? (normalizePlate(part.plate) === normalizePlate(allocation.plate) ? part.model || null : null)
      }));
    });
    DATA.returns.forEach((item) => {
      const part = partById(item.partId);
      // În exemplele vechi, returul auto are o singură alocare integrală;
      // celelalte trei retururi provin din cantități nealocate.
      if (!item.source) {
        const allocations = allocationsForPart(part);
        item.source = allocations.length === 1 && allocatedQty(part) === part.qty
          ? { type: "allocation", allocationIndex: 0, plate: allocations[0].plate, model: allocations[0].model || null }
          : { type: "unallocated" };
      }
      if (!item.history) item.history = RETURN_STEPS.slice(0, RETURN_STEPS.indexOf(item.status) + 1)
        .map((status) => ({ status, date: returnStageDate(item, status) }));
    });
    cacheElements();
    initInvoiceDatePicker();
    bindEvents();
    renderAll();
  };

  init();
})();
