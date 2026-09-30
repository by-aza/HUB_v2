"use strict";

/* data fixă face scenariile demo reproductibile la fiecare prezentare */
const DEMO_TODAY = "2026-09-30";

/* toate datele sunt fictive și există exclusiv în memoria paginii */
const initialClients = [
  {
    id: 1, name: "Daria Stoian", phone: "0722 140 503", email: "daria.stoian@example.test", channels: ["WhatsApp", "Email"], consent: true, timing: [30, 5],
    vehicles: [{ id: 101, make: "Skoda", model: "Octavia", year: 2019, plate: "CT12ABC", vin: "TMBJG7NE6K0123421", reminders: [{ type: "ITP", date: "2026-10-05" }, { type: "RCA", date: "2027-01-04" }, { type: "Schimb ulei", date: "2027-02-15" }] }],
    history: [{ date: "29.09.2026 09:02", reason: "ITP · 5 zile", channel: "WhatsApp", status: "Livrat" }, { date: "15.09.2026 09:01", reason: "ITP · 15 zile", channel: "Email", status: "Livrat" }], notes: []
  },
  {
    id: 2, name: "Miruna Ene", phone: "0733 250 614", email: "miruna.ene@example.test", channels: ["Email"], consent: true, timing: [30, 15, 5, 0],
    vehicles: [{ id: 201, make: "Volkswagen", model: "Golf", year: 2021, plate: "CT34XYZ", vin: "WVWZZZAUZMW145632", reminders: [{ type: "RCA", date: "2026-09-30" }, { type: "Revizie", date: "2026-11-14" }] }],
    history: [{ date: "30.09.2026 07:00", reason: "RCA · ziua termenului", channel: "Email", status: "Programat" }], notes: ["Preferă contactul după ora 10:00."]
  },
  {
    id: 3, name: "Tudor Damian", phone: "0744 361 725", email: "tudor.damian@example.test", channels: ["Email"], consent: true, timing: [30, 15], notificationProblem: true,
    vehicles: [{ id: 301, make: "Toyota", model: "Corolla", year: 2020, plate: "CT78GHI", vin: "NMTBZ3BE70R094815", reminders: [{ type: "RCA", date: "2026-10-05" }, { type: "ITP", date: "2027-03-10" }] }],
    history: [{ date: "30.09.2026 08:04", reason: "RCA · 5 zile", channel: "Email", status: "Eșuat" }], notes: []
  },
  {
    id: 4, name: "Ilinca Rusu", phone: "0766 472 836", email: "ilinca.rusu@example.test", channels: ["WhatsApp"], consent: true, timing: [30, 5, 0],
    vehicles: [{ id: 401, make: "Dacia", model: "Duster", year: 2018, plate: "B92KLM", vin: "UU1HSDCJ659321704", reminders: [{ type: "ITP", date: "2026-09-28" }, { type: "RCA", date: "2026-12-02" }] }],
    history: [{ date: "23.09.2026 09:00", reason: "ITP · 5 zile", channel: "WhatsApp", status: "Livrat" }], notes: []
  },
  {
    id: 5, name: "Rareș Voicu", phone: "0755 583 947", email: "rares.voicu@example.test", channels: ["WhatsApp", "Email", "SMS"], consent: true, timing: [15, 5],
    vehicles: [{ id: 501, make: "Renault", model: "Megane", year: 2017, plate: "B14RVS", vin: "VF1RFB00861247835", reminders: [{ type: "Revizie", date: "2026-10-15" }] }, { id: 502, make: "BMW", model: "X3", year: 2022, plate: "CT90RVV", vin: "WBA56DP090N188346", reminders: [{ type: "Schimb ulei", date: "2026-10-30" }, { type: "ITP", date: "2027-05-20" }] }],
    history: [{ date: "15.09.2026 09:03", reason: "Revizie · 30 zile", channel: "WhatsApp", status: "Livrat" }], notes: ["Are două vehicule în familie."]
  },
  {
    id: 6, name: "Sabina Petrescu", phone: "0721 694 158", email: "sabina.petrescu@example.test", channels: ["SMS"], consent: true, timing: [30, 15, 5, 0],
    vehicles: [{ id: 601, make: "Ford", model: "Focus", year: 2016, plate: "CT56DEF", vin: "WF05XXGCC5GR27491", reminders: [{ type: "Revizie", date: "2026-10-30" }] }],
    history: [{ date: "30.09.2026 07:05", reason: "Revizie · 30 zile", channel: "SMS", status: "Programat" }], notes: []
  },
  {
    id: 7, name: "Cezar Munteanu", phone: "", email: "", channels: ["WhatsApp"], consent: true, timing: [30],
    vehicles: [{ id: 701, make: "Audi", model: "A4", year: 2015, plate: "CT08CMN", vin: "WAUZZZ8K7FA092611", reminders: [{ type: "ITP", date: "2026-10-15" }] }],
    history: [], notes: []
  },
  {
    id: 8, name: "Oana Luca", phone: "0730 716 269", email: "oana.luca@example.test", channels: ["Email", "SMS"], consent: false, timing: [30, 15, 5],
    vehicles: [{ id: 801, make: "Hyundai", model: "Tucson", year: 2023, plate: "B123ONA", vin: "TMAJ3813DPJ149002", reminders: [{ type: "RCA", date: "2026-10-20" }] }],
    history: [], notes: ["Acordul de notificare trebuie reconfirmat."]
  },
  {
    id: 9, name: "Matei Bratu", phone: "0740 827 370", email: "matei.bratu@example.test", channels: ["WhatsApp"], consent: true, timing: [5, 0],
    vehicles: [{ id: 901, make: "Mercedes-Benz", model: "C 200", year: 2020, plate: "CT22MBR", vin: "WDD2050771R512847", reminders: [{ type: "Schimb ulei", date: "2026-12-18" }] }],
    history: [{ date: "12.08.2026 10:21", reason: "Reminder personalizat", channel: "WhatsApp", status: "Livrat" }], notes: []
  },
  {
    id: 10, name: "Nadia Sava", phone: "0729 938 481", email: "nadia.sava@example.test", channels: ["Email"], consent: true, timing: [30, 15, 5],
    vehicles: [{ id: 1001, make: "Kia", model: "Sportage", year: 2021, plate: "IL05NDS", vin: "U5YPH814GML913460", reminders: [{ type: "Personalizat", date: "2026-10-05", label: "Verificare baterie" }] }],
    history: [{ date: "28.09.2026 08:50", reason: "Verificare baterie", channel: "Email", status: "Livrat" }], notes: []
  }
];

let clients = structuredClone(initialClients);
let selectedClientId = clients[0].id;
let selectedVehicleId = clients[0].vehicles[0].id;
let editingClientId = null;
let activeWindow = "all";
let currentPage = 1;
const ROWS_PER_PAGE = 10;
let customReminderIndex = 0;
let toastTimer = null;

/* setările automatizării rămân editabile doar în memoria sesiunii */
let automationSettings = { timing: [30, 15, 5, 0], channels: ["WhatsApp", "Email", "SMS"], checkTime: "07:00" };

/* referințele DOM folosite de randările principale */
const dom = {
  search: document.getElementById("globalSearch"), tableBody: document.getElementById("clientsTableBody"), drawer: document.getElementById("clientDrawer"),
  kpis: document.getElementById("kpiGrid"), attention: document.getElementById("attentionGrid"), attentionCount: document.getElementById("attentionCount"),
  typeFilter: document.getElementById("typeFilter"), channelFilter: document.getElementById("channelFilter"), statusFilter: document.getElementById("statusFilter"),
  visibleCount: document.getElementById("visibleCount"), allRowsCount: document.getElementById("allRowsCount"), clientTotal: document.getElementById("clientTotal"), empty: document.getElementById("emptyState"), pagination: document.getElementById("pagination"),
  clientModal: document.getElementById("clientModal"), clientForm: document.getElementById("clientForm"), vehicleModal: document.getElementById("vehicleModal"), vehicleForm: document.getElementById("vehicleForm"),
  reminderModal: document.getElementById("reminderModal"), reminderForm: document.getElementById("reminderForm"),
  actionModal: document.getElementById("actionModal"), actionTitle: document.getElementById("actionModalTitle"), actionEyebrow: document.getElementById("actionEyebrow"), actionBody: document.getElementById("actionModalBody"), toast: document.getElementById("toast")
};

/* protejează șabloanele HTML generate din valorile introduse în formulare */
function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

/* normalizează numărul auto după regula HUB */
function normalizePlate(value = "") { return value.toUpperCase().replace(/[^A-Z0-9]/g, ""); }

/* funcțiile de dată calculează toate valorile afișate din dataset */
function daysUntil(date) { return Math.round((new Date(`${date}T12:00:00`) - new Date(`${DEMO_TODAY}T12:00:00`)) / 86400000); }
function formatDate(date) { return date ? new Intl.DateTimeFormat("ro-RO").format(new Date(`${date}T12:00:00`)) : "—"; }
function timingText(days) { if (days < 0) return `expirat de ${Math.abs(days)} ${Math.abs(days) === 1 ? "zi" : "zile"}`; if (days === 0) return "astăzi"; return `în ${days} ${days === 1 ? "zi" : "zile"}`; }

/* următorul termen al unui vehicul este cel cu data cea mai apropiată */
function nextReminder(vehicle) {
  return [...(vehicle.reminders || [])].sort((a, b) => a.date.localeCompare(b.date))[0] || { type: "—", date: "", label: "" };
}

function getClient(id = selectedClientId) { return clients.find((client) => client.id === Number(id)); }
function getSelectedVehicle(client = getClient()) { return client?.vehicles.find((vehicle) => vehicle.id === Number(selectedVehicleId)) || client?.vehicles[0]; }
function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function statusSlug(status) { return status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"); }

/* statusul rândului este derivat din termen, acord și istoricul demo */
function rowStatus(client, reminder) {
  const days = reminder.date ? daysUntil(reminder.date) : 9999;
  if (client.notificationProblem) return "Eșuat";
  if (!client.consent) return "Fără acord";
  if (days < 0) return "Expirat";
  if (days <= 5) return "Urgent";
  if (days <= 30) return "Programat";
  return "Activ";
}

function channelIcon(channel) { return channel === "Email" ? "mail" : channel === "SMS" ? "smartphone" : "message-circle"; }
function primaryChannel(client) { return client.channels[0] || "Niciun canal"; }

/* aplatizează clienții în rânduri separate pentru fiecare vehicul */
function allRows() {
  return clients.flatMap((client) => client.vehicles.map((vehicle) => {
    const reminder = nextReminder(vehicle);
    return { client, vehicle, reminder, days: reminder.date ? daysUntil(reminder.date) : 9999, status: rowStatus(client, reminder) };
  }));
}

/* filtrarea live acoperă datele clientului și toate datele vehiculului */
function filteredRows() {
  const query = dom.search.value.trim().toLowerCase();
  return allRows().filter((row) => {
    const haystack = [row.client.name, row.client.phone, row.client.email, row.vehicle.plate, row.vehicle.vin, row.vehicle.make, row.vehicle.model].join(" ").toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const matchesWindow = activeWindow === "all" || (activeWindow === "expired" && row.days < 0) || (activeWindow === "problems" && (row.status === "Eșuat" || row.status === "Fără acord")) || (/^\d+$/.test(activeWindow) && row.days === Number(activeWindow));
    const matchesType = dom.typeFilter.value === "all" || row.reminder.type === dom.typeFilter.value;
    const matchesChannel = dom.channelFilter.value === "all" || row.client.channels.includes(dom.channelFilter.value);
    const matchesStatus = dom.statusFilter.value === "all" || row.status === dom.statusFilter.value;
    return matchesSearch && matchesWindow && matchesType && matchesChannel && matchesStatus;
  }).sort((a, b) => (a.reminder.date || "9999").localeCompare(b.reminder.date || "9999"));
}

/* afișează cardurile KPI folosind valori calculate */
function renderKpis() {
  const rows = allRows();
  const upcoming = rows.filter((row) => row.days >= 0 && row.days <= 30).length;
  const scheduled = rows.filter((row) => row.client.consent && row.client.timing.some((timing) => timing >= row.days && row.days >= 0)).length;
  const problems = clients.filter((client) => client.notificationProblem || !client.consent || (!client.phone && !client.email)).length;
  const items = [
    ["users", "Clienți activi", clients.length, "Date fictive în memorie", ""],
    ["car-front", "Vehicule", rows.length, `${clients.filter((client) => client.vehicles.length > 1).length} client cu mai multe vehicule`, ""],
    ["calendar-days", "Expirări apropiate", upcoming, "În următoarele 30 zile", "warning"],
    ["bell", "Notificări programate", scheduled, "Simulare după preferințe", "success"],
    ["circle-alert", "Probleme notificări", problems, "Necesită atenție", "danger"]
  ];
  dom.kpis.innerHTML = items.map(([icon, label, value, note, tone]) => `<article class="cn-kpi ${tone}"><span class="cn-kpi-icon"><i data-lucide="${icon}"></i></span><div class="cn-kpi-copy"><span>${label}</span><strong>${value}</strong><small>${note}</small></div></article>`).join("");
}

/* construiește excepțiile importante din starea curentă */
function getAttentionItems() {
  const items = [];
  allRows().forEach((row) => {
    if (row.days < 0) items.push({ clientId: row.client.id, vehicleId: row.vehicle.id, tone: "danger", icon: "shield-alert", title: `${row.reminder.type} expirat`, detail: `${row.client.name} · ${row.vehicle.plate}` });
    else if (row.days === 0) items.push({ clientId: row.client.id, vehicleId: row.vehicle.id, tone: "warning", icon: "clock-3", title: `${row.reminder.type} expiră astăzi`, detail: `${row.client.name} · ${row.vehicle.plate}` });
    else if (row.days <= 5) items.push({ clientId: row.client.id, vehicleId: row.vehicle.id, tone: "warning", icon: "calendar-clock", title: `${row.reminder.type} în ${row.days} zile`, detail: `${row.client.name} · ${row.vehicle.plate}` });
  });
  clients.forEach((client) => {
    if (client.notificationProblem) items.push({ clientId: client.id, vehicleId: client.vehicles[0]?.id, tone: "danger", icon: "circle-x", title: "Notificare eșuată", detail: `${client.name} · ${primaryChannel(client)}` });
    if (!client.consent) items.push({ clientId: client.id, vehicleId: client.vehicles[0]?.id, tone: "info", icon: "circle-help", title: "Lipsește acordul", detail: `${client.name} · notificări inactive` });
    if (!client.phone && !client.email) items.push({ clientId: client.id, vehicleId: client.vehicles[0]?.id, tone: "info", icon: "contact-round", title: "Contact incomplet", detail: `${client.name} · fără telefon și email` });
  });
  return items;
}

function renderAttention() {
  const items = getAttentionItems();
  dom.attentionCount.textContent = items.length;
  dom.attention.innerHTML = items.slice(0, 8).map((item) => `<button class="cn-alert-card is-${item.tone}" data-select-client="${item.clientId}" data-select-vehicle="${item.vehicleId || ""}" type="button"><span class="cn-alert-icon"><i data-lucide="${item.icon}"></i></span><span class="cn-alert-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></span><i data-lucide="arrow-right"></i></button>`).join("");
}

/* tabelul este redesenat după fiecare căutare, filtru sau modificare */
function renderTable() {
  const rows = filteredRows();
  const pageCount = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  currentPage = Math.min(currentPage, pageCount);
  const pageRows = rows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
  dom.allRowsCount.textContent = rows.length;
  dom.visibleCount.textContent = pageRows.length;
  dom.clientTotal.textContent = `${clients.length} clienți`;
  dom.empty.hidden = rows.length !== 0;
  dom.tableBody.innerHTML = pageRows.map((row) => {
    const selected = row.client.id === selectedClientId && row.vehicle.id === selectedVehicleId;
    const timingClass = row.days < 0 ? "is-danger" : row.days <= 5 ? "is-warning" : "";
    const channels = row.client.channels.map((channel) => `<span class="cn-channel"><i data-lucide="${channelIcon(channel)}"></i>${escapeHtml(channel)}</span>`).join(" ");
    return `<tr class="${selected ? "is-selected" : ""} ${row.days < 0 ? "is-danger" : row.days <= 5 ? "is-warning" : ""}" data-select-client="${row.client.id}" data-select-vehicle="${row.vehicle.id}" tabindex="0">
      <td><div class="cn-client-cell"><span class="cn-avatar">${initials(row.client.name)}</span><span><strong>${escapeHtml(row.client.name)}</strong><small>#${String(row.client.id).padStart(4, "0")}</small></span></div></td>
      <td>${escapeHtml(row.client.phone || "—")}</td><td><span class="cn-vehicle-name">${escapeHtml(`${row.vehicle.make} ${row.vehicle.model}`)}</span></td><td><span class="cn-plate">${escapeHtml(row.vehicle.plate)}</span></td>
      <td><span class="cn-term">${escapeHtml(row.reminder.label || row.reminder.type)}</span></td><td><span class="cn-date"><strong>${formatDate(row.reminder.date)}</strong><small class="${timingClass}">${timingText(row.days)}</small></span></td>
      <td><span class="cn-channel-list">${channels || "—"}</span></td><td><span class="cn-status cn-status-${statusSlug(row.status)}">${escapeHtml(row.status)}</span></td></tr>`;
  }).join("");
  renderPagination(pageCount);
}

/* paginarea afișează maximum 10 rânduri client + vehicul */
function renderPagination(pageCount) {
  const pages = pageCount <= 5 ? Array.from({ length: pageCount }, (_, index) => index + 1) : [1, 2, 3, "…", pageCount];
  dom.pagination.innerHTML = `<button data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Pagina anterioară">‹</button>${pages.map((page) => page === "…" ? "<span>…</span>" : `<button data-page="${page}" class="${page === currentPage ? "is-current" : ""}">${page}</button>`).join("")}<button data-page="${currentPage + 1}" ${currentPage === pageCount ? "disabled" : ""} aria-label="Pagina următoare">›</button>`;
}

/* preferințele individuale sunt afișate separat de filtrele paginii */

function timingChips(client) {
  if (!client.timing.length) return '<span class="cn-timing-chip">Nicio etapă</span>';
  return [...client.timing].sort((a, b) => b - a).map((value) => `<span class="cn-timing-chip">${value === 0 ? "În ziua termenului" : `${value} zile`}</span>`).join("");
}

function reminderRows(vehicle) {
  return [...vehicle.reminders].sort((a, b) => a.date.localeCompare(b.date)).map((reminder) => {
    const days = daysUntil(reminder.date);
    const tone = days < 0 ? "is-danger" : days <= 5 ? "is-warning" : "";
    return `<div class="cn-reminder-row"><span class="cn-reminder-dot ${tone}"></span><span class="cn-reminder-main"><strong>${escapeHtml(reminder.label || reminder.type)}</strong><span>${escapeHtml(reminder.type)} · ${timingText(days)}</span></span><span class="cn-reminder-date"><strong>${formatDate(reminder.date)}</strong><small>${days < 0 ? "Expirat" : "Activ"}</small></span></div>`;
  }).join("") || '<p class="cn-note">Nu există termene pentru acest vehicul.</p>';
}

/* fișa laterală include toate vehiculele, istoricul și acțiunile demo */
function renderDrawer() {
  const client = getClient();
  if (!client) { dom.drawer.innerHTML = ""; return; }
  const selectedVehicle = getSelectedVehicle(client);
  selectedVehicleId = selectedVehicle?.id;
  dom.drawer.classList.remove("is-hidden");
  const channels = client.channels.map((channel) => `<span class="cn-channel-chip"><i data-lucide="${channelIcon(channel)}"></i>${escapeHtml(channel)}</span>`).join("") || '<span class="cn-channel-chip">Niciun canal</span>';
  const history = client.history.map((entry) => `<div class="cn-history-row"><span><strong>${escapeHtml(entry.date)}</strong><span>${escapeHtml(entry.reason)}</span></span><span class="cn-history-status"><span>${escapeHtml(entry.channel)}</span><em class="${entry.status === "Eșuat" ? "is-failed" : ""}">${entry.status === "Eșuat" ? "⚠" : "✓"} ${escapeHtml(entry.status)}</em></span></div>`).join("") || '<p class="cn-note">Nu există notificări în istoricul demo.</p>';
  dom.drawer.innerHTML = `<header class="cn-drawer-header"><div><span class="cn-eyebrow">DETALII CLIENT</span><h2>${escapeHtml(client.name)}</h2><span class="cn-drawer-id">Client #${String(client.id).padStart(4, "0")}</span></div><div class="cn-drawer-actions"><button class="cn-icon-button" data-action="edit-client" type="button" aria-label="Editare client"><i data-lucide="pencil"></i></button><button class="cn-icon-button" data-action="close-drawer" type="button" aria-label="Închide fișa"><i data-lucide="x"></i></button></div></header>
    <div class="cn-drawer-scroll">
      <section class="cn-drawer-section"><div class="cn-contact-line"><i data-lucide="phone"></i><span>${escapeHtml(client.phone || "Telefon nespecificat")}</span></div><div class="cn-contact-line"><i data-lucide="mail"></i><span>${escapeHtml(client.email || "Email nespecificat")}</span></div><div class="cn-channel-list">${channels}</div><div class="cn-preference-line"><span class="cn-consent ${client.consent ? "" : "cn-no-consent"}">${client.consent ? "Acord notificări confirmat" : "Fără acord pentru notificări"}</span></div></section>
      <section class="cn-drawer-section"><div class="cn-section-title-line"><h3>Vehicule <span>${client.vehicles.length}</span></h3><button class="cn-link-button" data-action="add-vehicle" type="button"><i data-lucide="plus"></i> Adaugă vehicul</button></div>${client.vehicles.map((vehicle) => `<button class="cn-vehicle-card" data-select-client="${client.id}" data-select-vehicle="${vehicle.id}" type="button" style="width:100%;text-align:left;${vehicle.id === selectedVehicleId ? "border-color:rgba(45,212,207,.7);background:rgba(45,212,207,.07)" : ""}"><span class="cn-vehicle-top"><span class="cn-vehicle-symbol"><i data-lucide="car-front"></i></span><span><strong>${escapeHtml(`${vehicle.make} ${vehicle.model}`)}</strong><span>${escapeHtml(vehicle.plate)} · ${escapeHtml(vehicle.year || "an nespecificat")}</span></span></span><span class="cn-vin">VIN <b>${escapeHtml(vehicle.vin || "Nespecificat")}</b></span></button>`).join("")}</section>
      <section class="cn-drawer-section"><div class="cn-section-title-line"><h3>Expirări &amp; remindere · ${escapeHtml(selectedVehicle?.plate || "")}</h3><button class="cn-link-button" data-action="add-reminder" type="button"><i data-lucide="plus"></i> Adaugă</button></div>${selectedVehicle ? reminderRows(selectedVehicle) : ""}</section>
      <section class="cn-drawer-section"><div class="cn-form-title-line"><h3>Notifică înainte cu</h3><span class="cn-experimental">DEMO</span></div><div class="cn-timing-display">${timingChips(client)}</div></section>
      <section class="cn-drawer-section"><div class="cn-section-title-line"><h3>Istoric notificări</h3></div>${history}</section>
      <section class="cn-drawer-section cn-notes-section"><div class="cn-section-title-line"><h3>Notițe <span>${client.notes.length}</span></h3></div><div class="cn-notes-list">${client.notes.map((note) => `<p class="cn-note">${escapeHtml(note)}</p>`).join("") || '<p class="cn-note">Nicio notiță adăugată în sesiunea demo.</p>'}</div></section>
    </div>
    <footer class="cn-drawer-footer"><button class="cn-button cn-button-ghost" data-action="edit-client" type="button"><i data-lucide="pencil"></i>Editare client</button><button class="cn-button cn-button-ghost" data-action="add-note" type="button"><i data-lucide="sticky-note"></i>Notiță</button><button class="cn-button cn-button-whatsapp" data-action="whatsapp" type="button"><i data-lucide="message-circle"></i>WhatsApp</button><button class="cn-button cn-button-email" data-action="email" type="button"><i data-lucide="mail"></i>Email</button><button class="cn-button cn-button-primary" data-action="offer" type="button" style="grid-column:1/-1"><i data-lucide="file-plus-2"></i>Creează ofertă</button></footer>`;
}


function refreshAll() { renderKpis(); renderAttention(); renderTable(); renderDrawer(); lucide.createIcons(); }

/* deschide un modal și blochează scroll-ul paginii */
function openModal(element) { element.hidden = false; document.body.style.overflow = "hidden"; lucide.createIcons(); }
function closeModal(element) { element.hidden = true; if ([dom.clientModal, dom.vehicleModal, dom.reminderModal, dom.actionModal].every((modal) => modal.hidden)) document.body.style.overflow = ""; }

function showToast(message) {
  clearTimeout(toastTimer); dom.toast.textContent = message; dom.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => dom.toast.classList.remove("is-visible"), 2600);
}

/* formularul clientului este reutilizat pentru creare și editare */
function openClientModal(client = null) {
  editingClientId = client?.id || null;
  dom.clientForm.reset();
  document.getElementById("customReminders").innerHTML = "";
  customReminderIndex = 0;
  document.getElementById("clientModalTitle").textContent = client ? "Editează client" : "Adaugă client";
  document.getElementById("vehicleFormSection").hidden = Boolean(client);
  document.getElementById("reminderFormSection").hidden = Boolean(client);
  if (client) {
    dom.clientForm.elements.name.value = client.name;
    dom.clientForm.elements.phone.value = client.phone;
    dom.clientForm.elements.email.value = client.email;
    dom.clientForm.querySelectorAll('input[name="channels"]').forEach((input) => { input.checked = client.channels.includes(input.value); });
    dom.clientForm.elements.consent.checked = client.consent;
    dom.clientForm.querySelectorAll('input[name="timing"]').forEach((input) => { input.checked = client.timing.includes(Number(input.value)); });
  }
  openModal(dom.clientModal);
  setTimeout(() => dom.clientForm.elements.name.focus(), 0);
}

/* extrage separat canalele și pragurile individuale selectate */
function selectedTimings(form) { return [...form.querySelectorAll('input[name="timing"]:checked')].map((input) => Number(input.value)); }
function selectedChannels(form) { return [...form.querySelectorAll('input[name="channels"]:checked')].map((input) => input.value); }

/* blocurile personalizate cer obligatoriu denumire și dată */
function addCustomReminderRow() {
  const index = customReminderIndex++;
  document.getElementById("customReminders").insertAdjacentHTML("beforeend", `<div class="cn-custom-reminder-row" data-custom-reminder><label class="cn-field"><span>Denumire *</span><input name="customName${index}" required placeholder="ex. Verificare distribuție" /></label><label class="cn-field"><span>Data *</span><input name="customDate${index}" type="date" required /></label><button class="cn-icon-button" data-remove-custom type="button" aria-label="Elimină"><i data-lucide="trash-2"></i></button></div>`);
  lucide.createIcons();
}

function remindersFromForm(form) {
  const definitions = [["itp", "ITP"], ["rca", "RCA"], ["revision", "Revizie"], ["oil", "Schimb ulei"]];
  const standard = definitions.filter(([name]) => form.elements[name].value).map(([name, type]) => ({ type, date: form.elements[name].value }));
  const custom = [...form.querySelectorAll("[data-custom-reminder]")].map((row) => ({ type: "Personalizat", label: row.querySelector('input[name^="customName"]').value.trim(), date: row.querySelector('input[name^="customDate"]').value }));
  return [...standard, ...custom];
}

/* salvarea modifică numai array-ul JavaScript curent */
dom.clientForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const channels = selectedChannels(form);
  if (!channels.length) { showToast("Selectează cel puțin un canal de notificare."); return; }
  if (editingClientId) {
    const client = getClient(editingClientId);
    Object.assign(client, { name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(), email: form.elements.email.value.trim(), channels, consent: form.elements.consent.checked, timing: selectedTimings(form) });
    showToast("Client actualizat în memoria sesiunii.");
  } else {
    const id = Math.max(0, ...clients.map((client) => client.id)) + 1;
    const vehicleId = Date.now();
    const plate = normalizePlate(form.elements.plate.value);
    clients.push({ id, name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(), email: form.elements.email.value.trim(), channels, consent: form.elements.consent.checked, timing: selectedTimings(form), vehicles: [{ id: vehicleId, make: form.elements.make.value.trim() || "Marcă", model: form.elements.model.value.trim() || "nespecificată", year: Number(form.elements.year.value) || "", plate: plate || "FĂRĂNUMĂR", vin: form.elements.vin.value.trim().toUpperCase(), reminders: remindersFromForm(form) }], history: [], notes: [] });
    selectedClientId = id; selectedVehicleId = vehicleId;
    showToast(`Client adăugat. Numărul auto a fost normalizat: ${plate || "nespecificat"}.`);
  }
  currentPage = 1;
  closeModal(dom.clientModal); refreshAll();
});

/* adaugă un vehicul clientului selectat fără a amesteca reminderul */
dom.vehicleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget; const client = getClient(); const id = Date.now(); const plate = normalizePlate(form.elements.plate.value);
  client.vehicles.push({ id, make: form.elements.make.value.trim(), model: form.elements.model.value.trim(), year: Number(form.elements.year.value) || "", plate, vin: form.elements.vin.value.trim().toUpperCase(), reminders: [] });
  selectedVehicleId = id; form.reset(); closeModal(dom.vehicleModal); refreshAll(); showToast(`Vehiculul ${plate} a fost adăugat în sesiunea demo.`);
});

/* adaugă termenul direct vehiculului selectat */
dom.reminderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget; const vehicle = getSelectedVehicle(); const type = form.elements.type.value; const label = form.elements.label.value.trim();
  if (type === "Personalizat" && !label) { form.elements.label.focus(); return; }
  vehicle.reminders.push({ type, date: form.elements.date.value, label: type === "Personalizat" ? label : "", notes: form.elements.notes.value.trim() });
  closeModal(dom.reminderModal); form.reset(); refreshAll(); showToast("Reminder adăugat vehiculului selectat.");
});

/* fereastra generală prezintă acțiuni fără integrare externă */

function showActionModal(title, eyebrow, body) { dom.actionTitle.textContent = title; dom.actionEyebrow.textContent = eyebrow; dom.actionBody.innerHTML = body; openModal(dom.actionModal); }

function whatsappPreview(client, vehicle, reminder) {
  const message = `Bună ziua, ${client.name}! Vă contactăm din partea CSN Garage în legătură cu vehiculul ${vehicle.plate}. Termenul pentru ${reminder.label || reminder.type} este ${formatDate(reminder.date)}. Doriți să programăm o verificare?`;
  showActionModal("Previzualizare WhatsApp", "SIMULARE — NU SE TRIMITE", `<div class="cn-preview-box"><div class="cn-preview-meta"><span>Destinatar</span><strong>${escapeHtml(client.phone || "Telefon indisponibil")}</strong><span>Vehicul</span><strong>${escapeHtml(vehicle.plate)}</strong></div><p class="cn-preview-message">${escapeHtml(message)}</p></div><div class="cn-simulation-note"><i data-lucide="flask-conical"></i><span>Acest demo nu deschide WhatsApp și nu trimite mesaje.</span></div>`);
}

function emailPreview(client, vehicle, reminder) {
  const subject = `Reminder ${reminder.label || reminder.type} — ${vehicle.plate}`;
  const message = `Bună ziua, ${client.name},\n\nVă reamintim că termenul pentru ${reminder.label || reminder.type}, asociat vehiculului ${vehicle.make} ${vehicle.model} (${vehicle.plate}), este ${formatDate(reminder.date)}.\n\nCu respect,\nEchipa CSN Garage`;
  showActionModal("Previzualizare email", "SIMULARE — NU SE TRIMITE", `<div class="cn-preview-box"><div class="cn-preview-meta"><span>Către</span><strong>${escapeHtml(client.email || "Email indisponibil")}</strong><span>Subiect</span><strong>${escapeHtml(subject)}</strong><span>Atașament viitor</span><strong>Ofertă service (opțional)</strong></div><p class="cn-preview-message">${escapeHtml(message)}</p></div><div class="cn-simulation-note"><i data-lucide="flask-conical"></i><span>Nu se trimite niciun email și nu se folosește Google Apps Script.</span></div>`);
}

function offerPreview(client, vehicle, reminder) {
  showActionModal("Creează ofertă", "FLUX DEMO", `<div class="cn-offer-route"><div class="cn-offer-step"><strong>Clienți &amp; Notificări</strong><span>${escapeHtml(client.name)} · ${escapeHtml(vehicle.plate)} · ${escapeHtml(reminder.label || reminder.type)}</span></div><i data-lucide="arrow-right"></i><div class="cn-offer-step"><strong>Deviz Estimativ</strong><span>Ar primi clientul, vehiculul și contextul preselectate.</span></div></div><div class="cn-simulation-note"><i data-lucide="info"></i><span>Transferul între module și logica de preț nu sunt implementate în acest demo.</span></div>`);
}

function openNoteForm(client) {
  showActionModal("Adaugă notiță", "NOTIȚĂ ÎN MEMORIE", `<form id="noteForm" class="cn-action-form"><label class="cn-field"><span>Notiță pentru ${escapeHtml(client.name)}</span><textarea name="note" required placeholder="Scrie o observație utilă..."></textarea></label><div class="cn-modal-footer" style="margin:14px -20px -14px"><button class="cn-button cn-button-primary" type="submit"><i data-lucide="plus"></i>Adaugă notița</button></div></form>`);
  document.getElementById("noteForm").addEventListener("submit", (event) => { event.preventDefault(); const note = event.currentTarget.elements.note.value.trim(); if (!note) return; client.notes.push(note); closeModal(dom.actionModal); renderDrawer(); lucide.createIcons(); showToast("Notița a fost adăugată în memoria sesiunii."); });
}

/* reminderul nou este legat explicit de vehiculul selectat */
function openReminderModal() {
  const vehicle = getSelectedVehicle();
  dom.reminderForm.reset();
  document.getElementById("customReminderNameField").hidden = true;
  dom.reminderForm.elements.label.required = false;
  document.getElementById("reminderVehicleLabel").textContent = `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`;
  openModal(dom.reminderModal);
}

/* primul pas simulează restricția de permisiuni pentru orice utilizator */
function showRestrictedAutomation() {
  showActionModal("Acces restricționat", "PERMISIUNI HUB", `<div class="cn-simulation-note cn-restricted-warning"><i data-lucide="lock-keyhole"></i><span>Nu aveți permisiunea de a modifica setările automatizărilor. Contactați administratorul HUB pentru acordarea accesului.</span></div><button class="cn-demo-access-button" data-action="view-automation-settings" type="button">Vizualizează setări</button><p class="cn-preview-message">Buton temporar, disponibil exclusiv pentru evaluarea acestui demo.</p>`);
}

/* setările demo se modifică numai până la reîncărcarea paginii */
function showAutomationSettings() {
  const timingOptions = [[30, "30 zile"], [15, "15 zile"], [5, "5 zile"], [0, "În ziua termenului"]];
  const channelOptions = ["WhatsApp", "Email", "SMS"];
  showActionModal("Setări automatizare", "ACCES DEMO", `<div style="padding-top:14px"><span class="cn-access-demo-badge">ACCES DEMO</span><p class="cn-preview-message" style="margin-top:9px">Acces temporar disponibil doar în versiunea demo.</p></div><form id="automationForm" class="cn-action-form"><div class="cn-settings-grid"><section class="cn-settings-group"><h3>Praguri implicite</h3>${timingOptions.map(([value, label]) => `<label><input type="checkbox" name="automationTiming" value="${value}" ${automationSettings.timing.includes(value) ? "checked" : ""} />${label}</label>`).join("")}</section><section class="cn-settings-group"><h3>Canale disponibile</h3>${channelOptions.map((channel) => `<label><input type="checkbox" name="automationChannel" value="${channel}" ${automationSettings.channels.includes(channel) ? "checked" : ""} />${channel}</label>`).join("")}</section><section class="cn-settings-group"><h3>Verificare automată</h3><label class="cn-field"><span>Ora demo</span><input name="checkTime" type="time" value="${automationSettings.checkTime}" /></label></section><section class="cn-settings-group"><h3>Stare demo</h3><p class="cn-preview-message">Nimic nu este trimis sau salvat extern.</p></section></div><button class="cn-button cn-button-primary" type="submit"><i data-lucide="check"></i>Salvează în sesiunea demo</button></form>`);
  document.getElementById("automationForm").addEventListener("submit", (event) => {
    event.preventDefault(); const form = event.currentTarget;
    automationSettings = { timing: [...form.querySelectorAll('[name="automationTiming"]:checked')].map((input) => Number(input.value)), channels: [...form.querySelectorAll('[name="automationChannel"]:checked')].map((input) => input.value), checkTime: form.elements.checkTime.value || "07:00" };
    closeModal(dom.actionModal); showToast("Setările demo au fost actualizate doar în memorie.");
  });
}

/* delegarea click-urilor păstrează randările dinamice simple */
document.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close-modal]");
  if (closeButton) { closeModal(document.getElementById(closeButton.dataset.closeModal)); return; }
  const pageButton = event.target.closest("[data-page]");
  if (pageButton && !pageButton.disabled) { currentPage = Number(pageButton.dataset.page); renderTable(); lucide.createIcons(); return; }
  const removeCustom = event.target.closest("[data-remove-custom]");
  if (removeCustom) { removeCustom.closest("[data-custom-reminder]").remove(); return; }
  const selectTarget = event.target.closest("[data-select-client]");
  if (selectTarget) { selectedClientId = Number(selectTarget.dataset.selectClient); selectedVehicleId = Number(selectTarget.dataset.selectVehicle) || getClient()?.vehicles[0]?.id; renderTable(); renderDrawer(); lucide.createIcons(); return; }
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const client = getClient(); const vehicle = getSelectedVehicle(client); const reminder = nextReminder(vehicle);
  if (actionButton.dataset.action === "close-drawer") dom.drawer.classList.add("is-hidden");
  if (actionButton.dataset.action === "edit-client") openClientModal(client);
  if (actionButton.dataset.action === "add-vehicle") { dom.vehicleForm.reset(); openModal(dom.vehicleModal); }
  if (actionButton.dataset.action === "add-reminder") openReminderModal();
  if (actionButton.dataset.action === "add-note") openNoteForm(client);
  if (actionButton.dataset.action === "whatsapp") whatsappPreview(client, vehicle, reminder);
  if (actionButton.dataset.action === "email") emailPreview(client, vehicle, reminder);
  if (actionButton.dataset.action === "offer") offerPreview(client, vehicle, reminder);
  if (actionButton.dataset.action === "view-automation-settings") showAutomationSettings();
  lucide.createIcons();
});

/* click-ul pe fundal închide numai modalul vizat */
[dom.clientModal, dom.vehicleModal, dom.reminderModal, dom.actionModal].forEach((modal) => modal.addEventListener("mousedown", (event) => { if (event.target === modal) closeModal(modal); }));

/* interacțiunile de căutare și filtre revin la prima pagină */
dom.search.addEventListener("input", () => { currentPage = 1; renderTable(); lucide.createIcons(); });
[dom.typeFilter, dom.channelFilter, dom.statusFilter].forEach((select) => select.addEventListener("change", () => { currentPage = 1; renderTable(); lucide.createIcons(); }));
document.getElementById("deadlineTabs").addEventListener("click", (event) => { const button = event.target.closest("[data-window]"); if (!button) return; activeWindow = button.dataset.window; currentPage = 1; document.querySelectorAll("[data-window]").forEach((item) => item.classList.toggle("is-active", item === button)); renderTable(); lucide.createIcons(); });
document.getElementById("resetFiltersBtn").addEventListener("click", () => { activeWindow = "all"; currentPage = 1; dom.search.value = ""; dom.typeFilter.value = "all"; dom.channelFilter.value = "all"; dom.statusFilter.value = "all"; document.querySelectorAll("[data-window]").forEach((item) => item.classList.toggle("is-active", item.dataset.window === "all")); renderTable(); lucide.createIcons(); });
document.getElementById("newClientBtn").addEventListener("click", () => openClientModal());
document.getElementById("addCustomReminderBtn").addEventListener("click", addCustomReminderRow);
document.getElementById("automationSettingsBtn").addEventListener("click", showRestrictedAutomation);
document.getElementById("reminderType").addEventListener("change", (event) => { const custom = event.target.value === "Personalizat"; document.getElementById("customReminderNameField").hidden = !custom; dom.reminderForm.elements.label.required = custom; });

/* taste rapide pentru căutare și închiderea dialogurilor */
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { event.preventDefault(); dom.search.focus(); }
  if (event.key === "Escape") { [dom.clientModal, dom.vehicleModal, dom.reminderModal, dom.actionModal].filter((modal) => !modal.hidden).forEach(closeModal); }
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("tr[data-select-client]")) event.target.click();
});

/* prima randare pornește mereu din starea mock originală */
refreshAll();

