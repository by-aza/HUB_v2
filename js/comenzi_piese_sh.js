const statusDisplayByDb = {
    comandata: "Comandată",
    in_tranzit: "În tranzit",
    ajunsa: "Ajunsă",
    montata: "Montată",
    nepotrivita: "Nepotrivită",
    returnata: "Returnată",
    pusa_la_vanzare: "Pusă la vânzare",
    anulata: "Anulată",
};

const statusDbByDisplay = Object.fromEntries(
    Object.entries(statusDisplayByDb).map(([dbStatus, displayStatus]) => [displayStatus, dbStatus])
);

const purchaseDisplayByDb = {
    firma: "Firmă",
    persoana_fizica: "Persoană fizică",
};

const purchaseDbByDisplay = {
    Firmă: "firma",
    "Persoană fizică": "persoana_fizica",
};

let parts = [];
let currentUserId = null;
let currentAuditUserName = "";
let devizFinalPartIds = new Set();
let initialPartIdFromUrl = "";
let lastVehicleModelLookupPlate = "";

/* stare locala pagina */
let selectedPartId = null;
let activeStatusFilter = "Toate";
let searchQuery = "";
let editingPartId = null;
let formMode = "create";
let pendingDialogAction = null;
let currentPage = 1;
const rowsPerPage = 5;
const archivableStatuses = ["Montată", "Anulată"];

/* selectori principali DOM */
const elements = {};

/* scurtaturi de formatare si siguranta */
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
    })[character]);
}

function normalizeRegistration(value) {
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizePhone(value) {
    return String(value || "").trim().replace(/[\s()-]/g, "");
}

function isValidSupplierPhone(value) {
    return !value || /^\+?\d{7,15}$/.test(value);
}

function normalizeUpperText(value) {
    return String(value || "").trim().toLocaleUpperCase("ro-RO");
}

function hasText(value) {
    return String(value || "").trim() !== "";
}

function nullableText(value) {
    const normalized = String(value || "").trim();
    return normalized || null;
}

function calculateTotal(partOrPrice, maybeTransport) {
    if (typeof partOrPrice === "object") {
        return (Number(partOrPrice.pretPiesa) || 0) + (Number(partOrPrice.pretTransport) || 0);
    }
    return (Number(partOrPrice) || 0) + (Number(maybeTransport) || 0);
}

function formatCurrency(value) {
    return `${new Intl.NumberFormat("ro-RO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0)} RON`;
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("ro-RO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatShortDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function getSelectedPart() {
    return parts.find((part) => part.id === selectedPartId) || null;
}

async function writePartsAuditLog(action, order, description) {
    try {
        if (typeof window.addAuditLog !== "function" || !order?.id) return;

        await window.addAuditLog({
            modul: "Comenzi Piese SH",
            actiune: action,
            entitate: "comenzi_piese_sh",
            entitate_id: String(order.id),
            descriere: description,
            user_id: currentUserId || undefined,
            user_name: currentAuditUserName || undefined,
        });
    } catch (auditError) {
        console.error("Eroare la auditarea Comenzi Piese SH:", auditError);
    }
}

function mapDbPart(row) {
    return {
        id: String(row.id),
        denumirePiesa: row.denumire_piesa || "",
        codPiesa: row.cod_piesa || "",
        nrInmatriculare: row.nr_inmatriculare || "",
        modelMasina: row.model_masina || "",
        departament: row.departament || "",
        solicitatDe: "— Doar departamentul —",
        furnizor: row.furnizor || "",
        telefonFurnizor: row.telefon_furnizor || "",
        tipAchizitie: purchaseDisplayByDb[row.tip_achizitie] || "Firmă",
        pretPiesa: Number(row.pret_piesa) || 0,
        pretTransport: Number(row.pret_transport) || 0,
        observatii: row.observatii || "",
        status: statusDisplayByDb[row.status] || "Comandată",
        dataComanda: row.data_comanda || "",
        dataExpediere: row.data_expediere || "",
        curier: row.curier || "",
        awb: row.awb || "",
        dataSosire: row.data_sosire || "",
        dataMontare: row.data_montare || "",
        motivProblema: row.motiv_problema || "",
        dataRetur: row.data_retur || "",
        isArchived: row.is_archived === true,
        archivedAt: row.archived_at || "",
        archivedBy: row.archived_by || "",
    };
}

function mapPartToDbPayload(payload) {
    return {
        denumire_piesa: payload.denumirePiesa,
        cod_piesa: nullableText(payload.codPiesa),
        nr_inmatriculare: payload.nrInmatriculare,
        model_masina: payload.modelMasina,
        departament: payload.departament,
        furnizor: payload.furnizor,
        telefon_furnizor: nullableText(payload.telefonFurnizor),
        tip_achizitie: purchaseDbByDisplay[payload.tipAchizitie] || "firma",
        pret_piesa: payload.pretPiesa,
        pret_transport: payload.pretTransport,
        observatii: nullableText(payload.observatii),
    };
}

function hasComenziPieseShAccess(profile) {
    if (Number(profile?.rol_id) === 1) return true;
    return profile?.permissions?.comenzi_piese_sh === true;
}

async function ensureComenziPieseShAccess() {
    const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;

    const user = sessionData?.session?.user;
    if (!user?.id) {
        window.location.href = "../admin/login.html";
        return false;
    }

    const { data: profile, error } = await supabaseClient
        .from("auth_profiles")
        .select("rol_id, permissions")
        .eq("id", user.id)
        .single();

    if (error) throw error;

    if (!hasComenziPieseShAccess(profile)) {
        window.location.href = "../../index.html";
        return false;
    }

    currentUserId = user.id;
    currentAuditUserName = user.email || "";
    return true;
}

/* mapare status catre clase vizuale */
function getStatusClass(status) {
    const classes = {
        Comandată: "status-ordered",
        "În tranzit": "status-transit",
        Ajunsă: "status-arrived",
        Montată: "status-mounted",
        Nepotrivită: "status-problem",
        Returnată: "status-returned",
        "Pusă la vânzare": "status-resale",
        Anulată: "status-cancelled",
    };
    return classes[status] || "status-returned";
}

/* filtrare locala cautare plus status */
function getFilteredParts() {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const showArchived = activeStatusFilter === "Arhivate";

    return parts.filter((part) => {
        if (showArchived !== part.isArchived) return false;

        const matchesSearch = !normalizedQuery || [
            part.denumirePiesa,
            part.codPiesa,
            part.nrInmatriculare,
            part.modelMasina,
            part.furnizor,
            part.telefonFurnizor,
            part.awb,
        ].some((value) => String(value || "").toLowerCase().includes(normalizedQuery));

        const matchesFilter =
            showArchived ||
            activeStatusFilter === "Toate" ||
            (activeStatusFilter === "Comandate" && part.status === "Comandată") ||
            (activeStatusFilter === "În tranzit" && part.status === "În tranzit") ||
            (activeStatusFilter === "Ajunse" && part.status === "Ajunsă") ||
            (activeStatusFilter === "Montate" && part.status === "Montată") ||
            (activeStatusFilter === "Probleme" && ["Nepotrivită", "Returnată", "Pusă la vânzare", "Anulată"].includes(part.status));

        return matchesSearch && matchesFilter;
    });
}

/* randuri auxiliare pentru detalii */
function detailItem(label, value, extraClass = "") {
    const displayValue = value || "—";
    return `
        <div class="parts-detail-item">
            <span>${escapeHtml(label)}</span>
            <strong class="${extraClass}">${escapeHtml(displayValue)}</strong>
        </div>
    `;
}

function detailLine(label, value, extraClass = "") {
    const displayValue = value || "—";
    return `
        <div class="parts-detail-line">
            <span>${escapeHtml(label)}:</span>
            <strong class="${extraClass}">${escapeHtml(displayValue)}</strong>
        </div>
    `;
}

/* rand optional pentru motiv problema */
function optionalDetailItem(label, value, extraClass = "") {
    return value ? detailItem(label, value, extraClass) : "";
}

/* randuri auxiliare pentru formular dialog */
function dialogField(label, id, type = "text", value = "") {
    return `
        <label for="${id}">
            ${escapeHtml(label)}
            <input type="${type}" id="${id}" value="${escapeHtml(value)}">
        </label>
    `;
}

function dialogTextarea(label, id) {
    return `
        <label for="${id}">
            ${escapeHtml(label)}
            <textarea id="${id}" rows="3"></textarea>
        </label>
    `;
}

/* randare KPI calculate din date */
function renderKpis() {
    const activeParts = parts.filter((part) => !part.isArchived);
    elements.kpiOrdered.textContent = activeParts.filter((part) => part.status === "Comandată").length;
    elements.kpiTransit.textContent = activeParts.filter((part) => part.status === "În tranzit").length;
    elements.kpiArrived.textContent = activeParts.filter((part) => part.status === "Ajunsă").length;
    elements.kpiProblems.textContent = activeParts.filter((part) => ["Nepotrivită", "Returnată", "Pusă la vânzare", "Anulată"].includes(part.status)).length;
}

async function loadPartsFromSupabase() {
    try {
        elements.partsStatusMessage.textContent = "Se încarcă piesele...";
        const { data, error } = await supabaseClient
            .from("comenzi_piese_sh")
            .select("*")
            .order("data_comanda", { ascending: false });

        if (error) throw error;

        parts = (data || []).map(mapDbPart);
        await loadDevizFinalPartLinks();
        selectedPartId = parts.some((part) => part.id === selectedPartId) ? selectedPartId : null;
        applyInitialPartSelectionFromUrl();
        refreshUi();
    } catch (error) {
        console.error("Eroare la încărcarea comenzilor din Supabase:", error);
        parts = [];
        refreshUi();
        showToast("Nu s-au putut încărca piesele din Supabase.", "error");
        elements.partsStatusMessage.textContent = "Eroare la încărcarea datelor.";
    }
}

async function loadDevizFinalPartLinks() {
    try {
        const { data, error } = await supabaseClient
            .from("deviz_final_linii")
            .select("comanda_piesa_sh_id")
            .not("comanda_piesa_sh_id", "is", null);

        if (error) throw error;

        devizFinalPartIds = new Set(
            (data || [])
                .map((row) => String(row.comanda_piesa_sh_id || "").trim())
                .filter(Boolean)
        );
    } catch (error) {
        console.error("Eroare la verificarea pieselor salvate în Deviz Final:", error);
        devizFinalPartIds = new Set();
        showToast("Nu s-au putut verifica piesele din Deviz Final.", "error");
    }
}

function applyInitialSearchFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = normalizeRegistration(params.get("search"));
    initialPartIdFromUrl = String(params.get("part") || "").trim();
    if (!initialSearch) return;

    searchQuery = initialSearch;
    currentPage = 1;
    if (elements.partsSearchInput) {
        elements.partsSearchInput.value = initialSearch;
    }
}

function syncActiveStatusFilterButton() {
    elements.statusFilterGroup.querySelectorAll(".parts-filter-btn").forEach((item) => {
        item.classList.toggle("is-active", item.dataset.filter === activeStatusFilter);
    });
}

function applyInitialPartSelectionFromUrl() {
    if (!initialPartIdFromUrl) return;

    const requestedPart = parts.find((part) => part.id === initialPartIdFromUrl);
    if (!requestedPart) return;

    if (requestedPart.isArchived && activeStatusFilter !== "Arhivate") {
        activeStatusFilter = "Arhivate";
        syncActiveStatusFilterButton();
    }

    const filteredParts = getFilteredParts();
    const partIndex = filteredParts.findIndex((part) => part.id === initialPartIdFromUrl);
    if (partIndex === -1) return;

    selectedPartId = initialPartIdFromUrl;
    currentPage = Math.floor(partIndex / rowsPerPage) + 1;
    initialPartIdFromUrl = "";
}

function getVehicleLookupSources() {
    return [
        {
            table: "deviz_final_header",
            select: "id_deviz_final, nr_inmatriculare, auto",
            modelField: "auto",
            orderField: "id_deviz_final",
        },
        {
            table: "constatari",
            select: "id, nr_inmatriculare, model_masina",
            modelField: "model_masina",
            orderField: "id",
        },
        {
            table: "devize",
            select: "id_deviz, nr_inmatriculare, autovehicul",
            modelField: "autovehicul",
            orderField: "id_deviz",
        },
        {
            table: "detailing",
            select: "id, nr_inmatriculare, autovehicul",
            modelField: "autovehicul",
            orderField: "id",
        },
        {
            table: "evidente_avansuri",
            select: "id, nr_inmatriculare, model_masina",
            modelField: "model_masina",
            orderField: "id",
        },
    ];
}

function findModelInRows(rows, modelField, plate) {
    return (rows || []).find((row) =>
        normalizeRegistration(row.nr_inmatriculare) === plate && hasText(row[modelField])
    )?.[modelField] || "";
}

function sortRowsByHighestId(rows, orderField) {
    return [...(rows || [])].sort((a, b) => {
        const aValue = Number(String(a?.[orderField] ?? "").match(/\d+/)?.[0] || 0);
        const bValue = Number(String(b?.[orderField] ?? "").match(/\d+/)?.[0] || 0);
        return bValue - aValue;
    });
}

async function findKnownVehicleModel(plate) {
    for (const source of getVehicleLookupSources()) {
        try {
            const exactResult = await supabaseClient
                .from(source.table)
                .select(source.select)
                .eq("nr_inmatriculare", plate)
                .order(source.orderField, { ascending: false })
                .limit(25);

            if (exactResult.error) throw exactResult.error;

            const exactModel = findModelInRows(sortRowsByHighestId(exactResult.data, source.orderField), source.modelField, plate);
            if (hasText(exactModel)) return normalizeUpperText(exactModel);

            const tolerantResult = await supabaseClient
                .from(source.table)
                .select(source.select)
                .order(source.orderField, { ascending: false })
                .limit(250);

            if (tolerantResult.error) throw tolerantResult.error;

            const tolerantModel = findModelInRows(sortRowsByHighestId(tolerantResult.data, source.orderField), source.modelField, plate);
            if (hasText(tolerantModel)) return normalizeUpperText(tolerantModel);
        } catch (error) {
            console.error(`Eroare la căutarea modelului în ${source.table}:`, error);
        }
    }

    return "";
}

async function autoFillVehicleModelFromRegistration() {
    const plate = normalizeRegistration(elements.registrationInput.value);
    elements.registrationInput.value = plate;

    if (!plate || hasText(elements.vehicleModelInput.value) || plate === lastVehicleModelLookupPlate) return;
    lastVehicleModelLookupPlate = plate;

    try {
        const model = await findKnownVehicleModel(plate);
        if (model && !hasText(elements.vehicleModelInput.value)) {
            elements.vehicleModelInput.value = model;
        }
    } catch (error) {
        console.error("Eroare la căutarea modelului pentru nr. înmatriculare:", error);
    }
}

/* randare tabel principal */
function renderTable() {
    const filteredParts = getFilteredParts();
    if (selectedPartId && !filteredParts.some((part) => part.id === selectedPartId)) {
        selectedPartId = null;
    }

    const pageCount = Math.max(1, Math.ceil(filteredParts.length / rowsPerPage));
    currentPage = Math.min(Math.max(currentPage, 1), pageCount);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const visibleParts = filteredParts.slice(startIndex, startIndex + rowsPerPage);

    elements.partsCount.textContent = filteredParts.length;
    renderPagination(filteredParts.length, pageCount, startIndex, visibleParts.length);

    if (!filteredParts.length) {
        elements.partsTableBody.innerHTML = '<tr class="parts-empty-row"><td colspan="8">Nicio comandă găsită.</td></tr>';
        return;
    }

    elements.partsTableBody.innerHTML = visibleParts.map((part, index) => {
        const isAddedToDevizFinal = devizFinalPartIds.has(String(part.id));
        return `
        <tr class="parts-table-row ${part.id === selectedPartId ? "is-selected" : ""}" data-id="${escapeHtml(part.id)}">
            <td class="parts-row-number">${startIndex + index + 1}</td>
            <td>
                <div class="parts-cell-main ${isAddedToDevizFinal ? "parts-table-total" : ""}" ${isAddedToDevizFinal ? 'title="Adăugată în Deviz Final"' : ""}>${isAddedToDevizFinal ? "✓ " : ""}${escapeHtml(part.denumirePiesa)}</div>
                <div class="parts-cell-muted parts-mono">${escapeHtml(part.codPiesa || "—")}</div>
            </td>
            <td>
                <div class="parts-cell-main parts-mono">${escapeHtml(part.nrInmatriculare)}</div>
                <div class="parts-cell-muted">${escapeHtml(part.modelMasina)}</div>
            </td>
            <td>${escapeHtml(formatShortDate(part.dataComanda))}</td>
            <td class="parts-money-cell parts-mono">${escapeHtml(formatCurrency(part.pretPiesa))}</td>
            <td class="parts-money-cell parts-mono">${escapeHtml(formatCurrency(part.pretTransport))}</td>
            <td class="parts-money-cell parts-mono parts-table-total">${escapeHtml(formatCurrency(calculateTotal(part)))}</td>
            <td>
                <span class="parts-status-wrap">
                    <span class="parts-status-pill ${getStatusClass(part.status)}">${escapeHtml(part.status)}</span>
                    ${renderQuickArchiveAction(part)}
                </span>
            </td>
        </tr>
    `;
    }).join("");

    lucide.createIcons();
}

function renderQuickArchiveAction(part) {
    if (part.isArchived) {
        return `
            <button type="button" class="parts-quick-action" data-action="restore" aria-label="Restaurează">
                <i data-lucide="archive-restore" class="w-4 h-4"></i>
            </button>
        `;
    }

    if (!archivableStatuses.includes(part.status)) return "";

    return `
        <button type="button" class="parts-quick-action" data-action="archive" aria-label="Arhivează">
            <i data-lucide="archive" class="w-4 h-4"></i>
        </button>
    `;
}

function renderPagination(totalItems, pageCount, startIndex, visibleCount) {
    if (!totalItems) {
        elements.partsStatusMessage.textContent = "Afișează 0 rezultate";
        elements.partsPagination.innerHTML = "";
        return;
    }

    const endIndex = startIndex + visibleCount;
    elements.partsStatusMessage.textContent = `Afișează ${startIndex + 1}-${endIndex} din ${totalItems} rezultate`;

    const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
    elements.partsPagination.innerHTML = [
        `<button type="button" class="parts-page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Pagina anterioară"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>`,
        ...pages.map((page) => `<button type="button" class="parts-page-btn ${page === currentPage ? "is-active" : ""}" data-page="${page}">${page}</button>`),
        `<button type="button" class="parts-page-btn" data-page="${currentPage + 1}" ${currentPage === pageCount ? "disabled" : ""} aria-label="Pagina următoare"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>`,
    ].join("");
}

/* selectie rand si detalii */
function selectPart(id, shouldScroll = false) {
    selectedPartId = id;
    renderTable();
    renderSelectedPart();

    if (shouldScroll && elements.selectedPartPanel && !isElementMostlyVisible(elements.selectedPartPanel)) {
        elements.selectedPartPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

function isElementMostlyVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
}

/* randare panou detalii selectate */
function renderSelectedPart() {
    const part = getSelectedPart();

    if (!part) {
        elements.selectedPartPanel.classList.add("hidden");
        elements.selectedPartPanel.innerHTML = "";
        return;
    }

    elements.selectedPartPanel.classList.remove("hidden");
    elements.selectedPartPanel.innerHTML = `
        <div class="parts-details-header">
            <div>
                <h2>Detalii comandă</h2>
                <p>${escapeHtml(part.denumirePiesa)} · ${escapeHtml(part.nrInmatriculare)} · ${escapeHtml(part.modelMasina)}</p>
            </div>
            <div class="parts-details-actions">
                ${renderPrimaryDetailsActions(part)}
                ${renderStatusActions(part)}
            </div>
        </div>
        <div class="parts-details-grid">
            <div class="parts-detail-column">
                ${detailLine("Denumire piesă", part.denumirePiesa)}
                ${detailLine("Mașină", `${part.modelMasina} (${part.nrInmatriculare})`)}
                ${detailLine("Data comandă", formatShortDate(part.dataComanda))}
                ${detailLine("Furnizor", part.furnizor)}
                ${detailLine("Telefon furnizor", part.telefonFurnizor, "parts-phone-highlight")}
                ${detailLine("Observații", part.observatii, "parts-clamped-value")}
            </div>
            <div class="parts-detail-column">
                ${detailLine("Preț piesă", formatCurrency(part.pretPiesa), "parts-mono")}
                ${detailLine("Transport", formatCurrency(part.pretTransport), "parts-mono")}
                ${detailLine("Total comandă", formatCurrency(calculateTotal(part)), "parts-mono parts-total-highlight")}
                ${detailLine("Tip achiziție", part.tipAchizitie)}
                ${detailLine("Departament", part.departament)}
            </div>
            <div class="parts-detail-column">
                ${detailLine("Status", part.status)}
                ${detailLine("Curier", part.curier)}
                ${detailLine("AWB", part.awb, "parts-mono")}
                ${detailLine("Data expediere", formatShortDate(part.dataExpediere))}
                ${detailLine("Data sosire", formatShortDate(part.dataSosire))}
                ${detailLine("Data montare", formatShortDate(part.dataMontare))}
            </div>
        </div>
    `;

    lucide.createIcons();
}

function renderPrimaryDetailsActions(part) {
    if (part.isArchived) {
        return '<button type="button" class="parts-btn parts-btn-primary" data-action="restore">Restaurează</button>';
    }

    const editLockedStatuses = ["Anulată", "Returnată", "Pusă la vânzare"];
    const actions = [];

    if (!editLockedStatuses.includes(part.status)) {
        actions.push('<button type="button" class="parts-btn parts-btn-secondary" data-action="edit">Editează</button>');
    }

    actions.push(
        '<button type="button" class="parts-btn parts-btn-secondary" data-action="orderAgain">Comandă din nou</button>',
        '<button type="button" class="parts-btn parts-btn-secondary" data-action="archive">Arhivează</button>'
    );

    return actions.join("");
}

/* actiuni valide pe status */
function renderStatusActions(part) {
    if (part.isArchived) return "";

    const actionTemplates = {
        Comandată: [
            '<button type="button" class="parts-btn parts-btn-primary" data-action="markTransit">Marchează în tranzit</button>',
            '<button type="button" class="parts-btn parts-btn-danger" data-action="cancel">Anulează</button>',
        ],
        "În tranzit": [
            '<button type="button" class="parts-btn parts-btn-primary" data-action="markArrived">Marchează ajunsă</button>',
        ],
        Ajunsă: [
            '<button type="button" class="parts-btn parts-btn-primary" data-action="markMounted">Marchează montată</button>',
            '<button type="button" class="parts-btn parts-btn-danger" data-action="markProblem">Nu se potrivește</button>',
        ],
        Nepotrivită: [
            '<button type="button" class="parts-btn parts-btn-secondary" data-action="markReturned">Returnată</button>',
            '<button type="button" class="parts-btn parts-btn-primary" data-action="markResale">Pusă la vânzare</button>',
        ],
    };

    return (actionTemplates[part.status] || []).join("");
}

/* deschidere modal adaugare/editare */
function openAddModal() {
    editingPartId = null;
    formMode = "create";
    lastVehicleModelLookupPlate = "";
    elements.partModalTitle.textContent = "Adaugă piesă SH comandată";
    elements.partForm.reset();
    elements.transportPriceInput.value = "0";
    clearFormState();
    updateRequestedByOptions();
    updateLiveTotal();
    showModal(elements.partModal);
}

function openEditModal() {
    const part = getSelectedPart();
    if (!part) return;

    editingPartId = part.id;
    formMode = "edit";
    lastVehicleModelLookupPlate = "";
    elements.partModalTitle.textContent = "Editează piesă SH comandată";
    populatePartForm(part);
    showModal(elements.partModal);
}

function openOrderAgainModal() {
    const part = getSelectedPart();
    if (!part) return;

    editingPartId = null;
    formMode = "orderAgain";
    lastVehicleModelLookupPlate = "";
    elements.partModalTitle.textContent = "Comandă piesa din nou";
    populatePartForm(part);
    showModal(elements.partModal);
}

function populatePartForm(part) {
    clearFormState();
    elements.partNameInput.value = part.denumirePiesa;
    elements.partCodeInput.value = part.codPiesa || "";
    elements.partNotesInput.value = part.observatii || "";
    elements.registrationInput.value = part.nrInmatriculare;
    elements.vehicleModelInput.value = part.modelMasina;
    elements.departmentInput.value = part.departament;
    updateRequestedByOptions(part.solicitatDe);
    elements.supplierInput.value = part.furnizor;
    elements.supplierPhoneInput.value = part.telefonFurnizor || "";
    elements.purchaseTypeInput.value = part.tipAchizitie || "Firmă";
    elements.partPriceInput.value = part.pretPiesa;
    elements.transportPriceInput.value = part.pretTransport || 0;
    updateLiveTotal();
}

function closeAddModal() {
    hideModal(elements.partModal);
    editingPartId = null;
    formMode = "create";
}

/* optiuni persoane filtrate dupa departament */
function updateRequestedByOptions(selectedValue = "") {
    if (!elements.requestedByInput) return;

    const department = elements.departmentInput.value;
    const people = mockPeopleByDepartment[department] || [];
    const currentValue = selectedValue || elements.requestedByInput.value || "— Doar departamentul —";

    elements.requestedByInput.innerHTML = [
        '<option value="— Doar departamentul —">— Doar departamentul —</option>',
        ...people.map((person) => `<option value="${escapeHtml(person)}">${escapeHtml(person)}</option>`),
    ].join("");

    elements.requestedByInput.value = people.includes(currentValue) ? currentValue : "— Doar departamentul —";
}

/* total live in formular financiar */
function updateLiveTotal() {
    const total = calculateTotal(elements.partPriceInput.value, elements.transportPriceInput.value);
    elements.liveTotalValue.textContent = formatCurrency(total);
}

/* validare formular local */
function validatePartForm() {
    const requiredFields = [
        elements.partNameInput,
        elements.registrationInput,
        elements.vehicleModelInput,
        elements.departmentInput,
        elements.supplierInput,
        elements.partPriceInput,
    ];
    let isValid = true;

    requiredFields.forEach((field) => {
        const invalid = !String(field.value || "").trim();
        field.classList.toggle("is-invalid", invalid);
        if (invalid) isValid = false;
    });

    if (Number(elements.partPriceInput.value) < 0 || Number(elements.transportPriceInput.value) < 0) {
        isValid = false;
        if (Number(elements.partPriceInput.value) < 0) elements.partPriceInput.classList.add("is-invalid");
        if (Number(elements.transportPriceInput.value) < 0) elements.transportPriceInput.classList.add("is-invalid");
    }

    const normalizedPhone = normalizePhone(elements.supplierPhoneInput.value);
    elements.supplierPhoneInput.value = normalizedPhone;
    if (!isValidSupplierPhone(normalizedPhone)) {
        elements.supplierPhoneInput.classList.add("is-invalid");
        elements.partFormMessage.textContent = "Numărul de telefon nu este valid.";
        elements.partFormMessage.classList.add("is-error");
        return false;
    }

    if (!isValid) {
        elements.partFormMessage.textContent = "Completează câmpurile obligatorii marcate.";
        elements.partFormMessage.classList.add("is-error");
    }

    return isValid;
}

function clearFormState() {
    elements.partFormMessage.textContent = "";
    elements.partFormMessage.classList.remove("is-error");
    elements.partForm.querySelectorAll(".is-invalid").forEach((field) => field.classList.remove("is-invalid"));
}

/* salvare locala piesa noua sau editata */
async function saveLocalPart(event) {
    event.preventDefault();

    try {
        clearFormState();
        if (!validatePartForm()) return;

        const saveMode = formMode;

        const normalizedRegistration = normalizeRegistration(elements.registrationInput.value);
        if (!normalizedRegistration) {
            elements.registrationInput.classList.add("is-invalid");
            elements.partFormMessage.textContent = "Nr. înmatriculare nu este valid.";
            elements.partFormMessage.classList.add("is-error");
            return;
        }

        const basePayload = {
            denumirePiesa: normalizeUpperText(elements.partNameInput.value),
            codPiesa: normalizeUpperText(elements.partCodeInput.value),
            nrInmatriculare: normalizedRegistration,
            modelMasina: normalizeUpperText(elements.vehicleModelInput.value),
            departament: elements.departmentInput.value,
            solicitatDe: editingPartId
                ? (parts.find((part) => part.id === editingPartId)?.solicitatDe || "— Doar departamentul —")
                : "— Doar departamentul —",
            furnizor: normalizeUpperText(elements.supplierInput.value),
            telefonFurnizor: normalizePhone(elements.supplierPhoneInput.value),
            tipAchizitie: elements.purchaseTypeInput.value || "Firmă",
            pretPiesa: Number(elements.partPriceInput.value) || 0,
            pretTransport: Number(elements.transportPriceInput.value) || 0,
            observatii: elements.partNotesInput.value.trim(),
        };

        if (formMode === "edit" && editingPartId) {
            const { data, error } = await supabaseClient
                .from("comenzi_piese_sh")
                .update({
                    ...mapPartToDbPayload(basePayload),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", editingPartId)
                .select()
                .single();

            if (error) throw error;

            const updatedPart = mapDbPart(data);
            parts = parts.map((part) => part.id === editingPartId ? updatedPart : part);
            closeAddModal();
            refreshUi();
            selectPart(editingPartId);
            showToast("Piesa a fost actualizată în Supabase.");
            await writePartsAuditLog(
                "UPDATE",
                updatedPart,
                `A modificat comanda pentru piesa ${updatedPart.denumirePiesa} / ${updatedPart.nrInmatriculare}`
            );
            return;
        }

        const { data, error } = await supabaseClient
            .from("comenzi_piese_sh")
            .insert({
                ...mapPartToDbPayload(basePayload),
                status: "comandata",
                is_archived: false,
                archived_at: null,
                archived_by: null,
                data_comanda: new Date().toISOString(),
                data_expediere: null,
                data_sosire: null,
                data_montare: null,
                data_retur: null,
                curier: null,
                awb: null,
                motiv_problema: null,
            })
            .select()
            .single();

        if (error) throw error;

        const newPart = mapDbPart(data);
        parts = [newPart, ...parts];
        closeAddModal();
        refreshUi();
        selectPart(newPart.id, true);
        showToast("Piesa a fost salvată în Supabase.");
        await writePartsAuditLog(
            saveMode === "orderAgain" ? "REORDER" : "CREATE",
            newPart,
            saveMode === "orderAgain"
                ? `A creat o comandă nouă pentru piesa ${newPart.denumirePiesa} / ${newPart.nrInmatriculare}`
                : `A adăugat piesa ${newPart.denumirePiesa} pentru ${newPart.nrInmatriculare}`
        );
    } catch (error) {
        console.error("Eroare la salvarea comenzii în Supabase:", error);
        showToast("A apărut o eroare la salvarea în Supabase.", "error");
        elements.partFormMessage.textContent = "Salvarea în Supabase a eșuat.";
        elements.partFormMessage.classList.add("is-error");
    }
}

function mapStatusExtrasToDb(extras) {
    const dbExtras = {};
    const fields = {
        dataExpediere: "data_expediere",
        dataSosire: "data_sosire",
        dataMontare: "data_montare",
        dataRetur: "data_retur",
        motivProblema: "motiv_problema",
        curier: "curier",
        awb: "awb",
    };

    Object.entries(fields).forEach(([localField, dbField]) => {
        if (Object.prototype.hasOwnProperty.call(extras, localField)) {
            dbExtras[dbField] = ["curier", "awb"].includes(localField)
                ? nullableText(normalizeUpperText(extras[localField]))
                : nullableText(extras[localField]);
        }
    });

    return dbExtras;
}

/* tranzitii status Supabase */
async function transitionStatus(status, extras = {}) {
    const part = getSelectedPart();
    if (!part) return;

    try {
        const oldStatus = part.status;
        const dbStatus = statusDbByDisplay[status];
        if (!dbStatus) throw new Error(`Status necunoscut: ${status}`);

        const { data, error } = await supabaseClient
            .from("comenzi_piese_sh")
            .update({
                status: dbStatus,
                updated_at: new Date().toISOString(),
                ...mapStatusExtrasToDb(extras),
            })
            .eq("id", part.id)
            .select()
            .single();

        if (error) throw error;

        const updatedPart = mapDbPart(data);
        parts = parts.map((item) => item.id === part.id ? updatedPart : item);
        refreshUi();
        selectPart(part.id);
        showToast("Statusul a fost actualizat în Supabase.");
        await writePartsAuditLog(
            "STATUS",
            updatedPart,
            `A schimbat statusul piesei ${updatedPart.denumirePiesa} din ${oldStatus} în ${updatedPart.status}`
        );
    } catch (error) {
        console.error("Eroare la schimbarea statusului în Supabase:", error);
        showToast("A apărut o eroare la schimbarea statusului în Supabase.", "error");
    }
}

async function setArchiveState(shouldArchive) {
    const part = getSelectedPart();
    if (!part) return;

    try {
        const { data, error } = await supabaseClient
            .from("comenzi_piese_sh")
            .update({
                is_archived: shouldArchive,
                archived_at: shouldArchive ? new Date().toISOString() : null,
                archived_by: shouldArchive ? currentUserId : null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", part.id)
            .select()
            .single();

        if (error) throw error;

        const updatedPart = mapDbPart(data);
        parts = parts.map((item) => item.id === part.id ? updatedPart : item);
        selectedPartId = part.id;

        if ((shouldArchive && activeStatusFilter !== "Arhivate") || (!shouldArchive && activeStatusFilter === "Arhivate")) {
            selectedPartId = null;
        }

        refreshUi();
        showToast(shouldArchive ? "Comanda a fost arhivată." : "Comanda a fost restaurată.");
        await writePartsAuditLog(
            shouldArchive ? "ARCHIVE" : "RESTORE",
            updatedPart,
            shouldArchive
                ? `A arhivat piesa ${updatedPart.denumirePiesa} / ${updatedPart.nrInmatriculare}`
                : `A restaurat piesa ${updatedPart.denumirePiesa} / ${updatedPart.nrInmatriculare}`
        );
    } catch (error) {
        console.error("Eroare la arhivarea/restaurarea comenzii:", error);
        showToast("A apărut o eroare la arhivare/restaurare.", "error");
    }
}

/* deschidere dialoguri workflow */
function openWorkflowDialog(config) {
    pendingDialogAction = config.onConfirm;
    elements.workflowDialogTitle.textContent = config.title;
    elements.workflowDialogBody.innerHTML = config.body;
    elements.confirmWorkflowDialogButton.textContent = config.confirmText;
    elements.confirmWorkflowDialogButton.className = `parts-btn ${config.danger ? "parts-btn-danger" : "parts-btn-primary"}`;
    elements.workflowDialogMessage.textContent = "";
    elements.workflowDialogMessage.classList.remove("is-error");
    showModal(elements.workflowDialog);
}

function closeWorkflowDialog() {
    pendingDialogAction = null;
    hideModal(elements.workflowDialog);
}

function handleStatusAction(action) {
    const now = () => new Date().toISOString();

    if (action === "edit") {
        openEditModal();
        return;
    }

    if (action === "orderAgain") {
        openOrderAgainModal();
        return;
    }

    if (action === "archive") {
        setArchiveState(true);
        return;
    }

    if (action === "restore") {
        setArchiveState(false);
        return;
    }

    const dialogs = {
        markTransit: {
            title: "Confirmă expedierea",
            body: `${dialogField("Curier", "workflowCourierInput")}${dialogField("AWB", "workflowAwbInput")}`,
            confirmText: "Confirmă expedierea",
            onConfirm: () => transitionStatus("În tranzit", {
                dataExpediere: now(),
                curier: document.getElementById("workflowCourierInput").value.trim(),
                awb: document.getElementById("workflowAwbInput").value.trim(),
            }),
        },
        markArrived: {
            title: "Marchează ajunsă",
            body: "<p>Confirmi că piesa a ajuns în service?</p>",
            confirmText: "Confirmă",
            onConfirm: () => transitionStatus("Ajunsă", { dataSosire: now() }),
        },
        markMounted: {
            title: "Marchează montată",
            body: "<p>Confirmi că piesa a fost montată?</p>",
            confirmText: "Confirmă",
            onConfirm: () => transitionStatus("Montată", { dataMontare: now() }),
        },
        markProblem: {
            title: "Nu se potrivește",
            body: dialogTextarea("Motiv / observație", "workflowProblemInput"),
            confirmText: "Confirmă",
            danger: true,
            onConfirm: () => transitionStatus("Nepotrivită", {
                motivProblema: document.getElementById("workflowProblemInput").value.trim(),
            }),
        },
        markReturned: {
            title: "Returnată",
            body: "<p>Confirmi marcarea piesei ca returnată?</p>",
            confirmText: "Confirmă",
            onConfirm: () => transitionStatus("Returnată", { dataRetur: now() }),
        },
        markResale: {
            title: "Pusă la vânzare",
            body: "<p>Confirmi marcarea piesei pentru revânzare?</p>",
            confirmText: "Confirmă",
            onConfirm: () => transitionStatus("Pusă la vânzare"),
        },
        cancel: {
            title: "Anulează comanda",
            body: "<p>Confirmi anularea comenzii?</p>",
            confirmText: "Anulează",
            danger: true,
            onConfirm: () => transitionStatus("Anulată"),
        },
    };

    if (dialogs[action]) openWorkflowDialog(dialogs[action]);
}

/* afisare si ascundere modale */
function showModal(modal) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    lucide.createIcons();
}

function hideModal(modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
}

/* notificari compacte */
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `parts-toast ${type === "error" ? "is-error" : ""}`;
    toast.textContent = message;
    elements.toastRegion.appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 3200);
}

/* reincarcare zone dinamice */
function refreshUi() {
    renderKpis();
    renderTable();
    renderSelectedPart();
}

/* initializare evenimente pagina */
function bindEvents() {
    elements.backButton.addEventListener("click", () => history.back());
    elements.openAddModalButton.addEventListener("click", openAddModal);
    elements.closePartModalButton.addEventListener("click", closeAddModal);
    elements.cancelPartModalButton.addEventListener("click", closeAddModal);
    elements.partForm.addEventListener("submit", saveLocalPart);
    elements.departmentInput.addEventListener("change", () => updateRequestedByOptions());
    elements.partPriceInput.addEventListener("input", updateLiveTotal);
    elements.transportPriceInput.addEventListener("input", updateLiveTotal);
    elements.registrationInput.addEventListener("blur", autoFillVehicleModelFromRegistration);
    elements.registrationInput.addEventListener("change", autoFillVehicleModelFromRegistration);
    elements.supplierPhoneInput.addEventListener("blur", () => {
        elements.supplierPhoneInput.value = normalizePhone(elements.supplierPhoneInput.value);
    });

    elements.partsSearchInput.addEventListener("input", (event) => {
        searchQuery = event.target.value;
        currentPage = 1;
        renderTable();
        renderSelectedPart();
    });

    elements.statusFilterGroup.addEventListener("click", (event) => {
        const button = event.target.closest("[data-filter]");
        if (!button) return;
        activeStatusFilter = button.dataset.filter;
        currentPage = 1;
        syncActiveStatusFilterButton();
        renderTable();
        renderSelectedPart();
    });

    elements.partsTableBody.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-action]");
        const row = event.target.closest("[data-id]");
        if (actionButton && row) {
            selectedPartId = row.dataset.id;
            handleStatusAction(actionButton.dataset.action);
            return;
        }

        if (row) selectPart(row.dataset.id);
    });

    elements.partsPagination.addEventListener("click", (event) => {
        const button = event.target.closest("[data-page]");
        if (!button || button.disabled) return;
        currentPage = Number(button.dataset.page) || 1;
        renderTable();
    });

    elements.selectedPartPanel.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (button) handleStatusAction(button.dataset.action);
    });

    elements.closeWorkflowDialogButton.addEventListener("click", closeWorkflowDialog);
    elements.cancelWorkflowDialogButton.addEventListener("click", closeWorkflowDialog);
    elements.confirmWorkflowDialogButton.addEventListener("click", () => {
        if (typeof pendingDialogAction === "function") pendingDialogAction();
        closeWorkflowDialog();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        closeAddModal();
        closeWorkflowDialog();
    });
}

/* cache elemente DOM folosite frecvent */
function collectElements() {
    [
        "backButton",
        "openAddModalButton",
        "kpiOrdered",
        "kpiTransit",
        "kpiArrived",
        "kpiProblems",
        "partsSearchInput",
        "statusFilterGroup",
        "partsTableBody",
        "partsCount",
        "partsStatusMessage",
        "partsPagination",
        "selectedPartPanel",
        "partModal",
        "partModalTitle",
        "closePartModalButton",
        "cancelPartModalButton",
        "partForm",
        "partFormMessage",
        "partNameInput",
        "partCodeInput",
        "partNotesInput",
        "registrationInput",
        "vehicleModelInput",
        "departmentInput",
        "requestedByInput",
        "supplierInput",
        "supplierPhoneInput",
        "purchaseTypeInput",
        "partPriceInput",
        "transportPriceInput",
        "liveTotalValue",
        "workflowDialog",
        "workflowDialogTitle",
        "workflowDialogBody",
        "workflowDialogMessage",
        "closeWorkflowDialogButton",
        "cancelWorkflowDialogButton",
        "confirmWorkflowDialogButton",
        "toastRegion",
    ].forEach((id) => {
        elements[id] = document.getElementById(id);
    });
}

/* pornire pagina */
document.addEventListener("DOMContentLoaded", async () => {
    try {
        collectElements();
        bindEvents();
        applyInitialSearchFromUrl();
        updateRequestedByOptions();
        const allowed = await ensureComenziPieseShAccess();
        if (!allowed) return;
        await loadPartsFromSupabase();
        lucide.createIcons();
    } catch (error) {
        console.error("Eroare la inițializarea modulului Comenzi Piese SH:", error);
        window.location.href = "../../index.html";
    }
});
