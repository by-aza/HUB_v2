const cars = [];
let selectedId = 1,
  activeTab = "general",
  activeFilter = "all",
  editing = false,
  creating = false;
let listErrorMessage = "";
let servicePeople = [];
let servicePeopleLoaded = false;
let servicePeopleError = false;
let detailMessage = "";
let constatariV2AccessGranted = false;
let auditActorPromise = null;
let refreshTimer = null;
let localTimeTimer = null;
let hasUnsavedChanges = false;
let activeLoadCarsPromise = null;
let loadCarsGeneration = 0;
let _selectionInFlight = false;
let _detailDirtyListenerAttached = false;
let _beforeunloadHandler = null;
const departmentRows = new Map();
const departmentAssignments = new Map();
const waitingIntervals = new Map();
const auditLogsByCar = new Map();
const deptData = {
  mechanic: { title: "Mecanică", db: "Mecanica", hasElements: false },
  electric: { title: "Electrică", db: "Electrica", hasElements: false },
  paint: { title: "Vopsitorie", db: "Vopsitorie", hasElements: true },
  prep: { title: "Pregătire", db: "Tinichigerie/Pregatire", hasElements: true },
};
const assignmentDepartments = {
  mechanic: ["Mecanica"],
  electric: ["Electrica"],
  paint: ["Vopsitorie"],
  prep: ["Tinichigerie/Pregatire"],
};
function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function statusClass(s) {
  return s === "work"
    ? "work"
    : s === "wait"
      ? "wait"
      : s === "done"
        ? "done"
        : "archived";
}
function formatDateRO(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ro-RO");
}
function formatDateTimeRO(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ro-RO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
function formatCompactDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(Number(ms || 0) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days) return `${days} ${days === 1 ? "zi" : "zile"} ${hours} h`;
  if (hours) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}
function formatServiceDuration(startValue, endValue) {
  if (!startValue) return "—";
  const start = new Date(startValue);
  const end = endValue ? new Date(endValue) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  return formatCompactDuration(end - start);
}
function formatKm(value) {
  if (value === null || value === undefined || value === "") return "";
  const nr = Number(value);
  return Number.isFinite(nr) ? nr.toLocaleString("ro-RO") : String(value);
}
function formatServiceDays(startValue, endValue) {
  return formatServiceDuration(startValue, endValue);
}
function normalizePlate(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[\s-]+/g, "");
}
function normalizeUpperTrim(value) {
  return String(value || "").trim().toUpperCase();
}
function parseNullableKm(value) {
  const digits = String(value || "").replace(/\D+/g, "");
  return digits ? Number(digits) : null;
}
function getWaitingMs(constatareId) {
  return (waitingIntervals.get(Number(constatareId)) || []).reduce(
    (total, interval) => {
      const start = new Date(interval.inceput);
      const end = interval.sfarsit ? new Date(interval.sfarsit) : new Date();
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
        return total;
      return total + Math.max(0, end - start);
    },
    0,
  );
}
function isTextEntryActive() {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea";
}
function limitAuditText(value, max = 150) {
  const text = String(value || "")
    .replace(/[{}[\]"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
/* config pentru textarea-urile cu linii multiple: placeholder cu \n pentru exemple vizibile */
const MULTILINE_FIELD_CONFIG = {
  complaint: {
    placeholder:
      "Introduceți fiecare defecțiune reclamată pe un rând separat:\n\nMotorul nu mai trage\nSe aude o bătaie pe față\nMartor motor aprins",
  },
  mechanic_constatari: {
    placeholder:
      "Introduceți fiecare defecțiune pe un rând separat:\n\nBucșă braț dreapta cu joc\nDPF colmatat\nPierdere ulei motor",
  },
  mechanic_lucrari: {
    placeholder:
      "Introduceți fiecare lucrare pe un rând separat:\n\nDPF demontat și trimis la curățat\nBucșă braț înlocuită\nRevizie motor efectuată",
  },
  mechanic_piese: {
    placeholder:
      "Introduceți fiecare piesă sau material pe un rând separat:\n\nBucșă braț dreapta\nUlei motor 5W30\nFiltru de ulei",
  },
  electric_constatari: {
    placeholder:
      "Introduceți fiecare defecțiune pe un rând separat:\n\nAlternatorul nu încarcă\nEroare senzor ABS dreapta\nBec poziție stânga nefuncțional",
  },
  electric_lucrari: {
    placeholder:
      "Introduceți fiecare lucrare pe un rând separat:\n\nAlternator verificat\nSenzor ABS înlocuit\nInstalație electrică reparată",
  },
  electric_piese: {
    placeholder:
      "Introduceți fiecare piesă sau material pe un rând separat:\n\nSenzor ABS dreapta\nBec poziție\nCablu electric",
  },
  paint_elemente: {
    placeholder:
      "Introduceți fiecare element sau lucrare pe un rând separat:\n\nAripă dreapta față îndoită\nBară față zgâriată\nPortieră stânga lovită",
  },
  paint_constatari: {
    placeholder:
      "Introduceți fiecare defecțiune pe un rând separat:\n\nAripă dreapta față îndoită\nBară față zgâriată\nPortieră stânga lovită",
  },
  paint_lucrari: {
    placeholder:
      "Introduceți fiecare lucrare pe un rând separat:\n\nAripă dreapta față îndreptată\nBară față vopsită\nPortieră stânga reparată",
  },
  paint_piese: {
    placeholder:
      "Introduceți fiecare piesă sau material pe un rând separat:\n\nChit auto\nGrund\nVopsea și lac",
  },
  prep_elemente: {
    placeholder:
      "Introduceți fiecare problemă pe un rând separat:\n\nSuprafață cu zgârieturi\nStrat vechi de vopsea deteriorat\nElement nepregătit pentru vopsire",
  },
  prep_constatari: {
    placeholder:
      "Introduceți fiecare problemă pe un rând separat:\n\nSuprafață cu zgârieturi\nStrat vechi de vopsea deteriorat\nElement nepregătit pentru vopsire",
  },
  prep_lucrari: {
    placeholder:
      "Introduceți fiecare operațiune pe un rând separat:\n\nSuprafață șlefuită\nGrund aplicat\nElement pregătit pentru vopsire",
  },
  prep_piese: {
    placeholder:
      "Introduceți fiecare material pe un rând separat:\n\nHârtie abrazivă\nGrund\nBandă de mascare",
  },
};

/* normalizează liniile de text: trim, elimină markere listă, spații duplicate, uppercase ro-RO */
function normalizeMultilineItems(value) {
  const lines = String(value || "")
    .split("\n")
    .map((line) => {
      let trimmed = line.trim();
      /* elimină markere de listă de la începutul liniei: •, -, –, — */
      trimmed = trimmed.replace(/^[\s•\-–—]+/, "");
      /* elimină spațiile redundante în interiorul liniei */
      trimmed = trimmed.replace(/\s+/g, " ").trim();
      return trimmed;
    })
    .filter((line) => line.length > 0)
    .map((line) => line.toLocaleUpperCase("ro-RO"));
  return lines.join("\n");
}

/* generează doar containerul de avertisment pentru virgule (fără exemple permanente) */
function buildMultilineHelperHtml(configKey) {
  if (!configKey) return "";
  return `<div class="multiline-comma-warning hidden" data-ml-warning="${configKey}">Dacă sunt poziții diferite, introduceți fiecare poziție pe un rând separat.</div>`;
}

/* verifică dacă există mai multe virgule pe același rând și arată/ascunde avertismentul */
function checkCommaWarning(textareaEl, warningEl) {
  if (!warningEl) return;
  const lines = String(textareaEl.value || "").split("\n");
  const hasMultipleCommas = lines.some(
    (line) => (line.match(/,/g) || []).length >= 2,
  );
  warningEl.classList.toggle("hidden", !hasMultipleCommas);
}

/* atributează blur pentru normalizare și input pentru avertismentul de virgulă la un textarea */
function attachMultilineListeners(textareaEl, configKey) {
  if (!textareaEl) return;
  const warningEl = document.querySelector(
    `[data-ml-warning="${configKey}"]`,
  );

  /* avertisment virgule - la input */
  textareaEl.addEventListener("input", () => {
    checkCommaWarning(textareaEl, warningEl);
  });
  /* verificare inițială în cazul în care se încarcă date salvate cu virgule */
  checkCommaWarning(textareaEl, warningEl);

  /* normalizare la blur - fără a reseta dirty state */
  textareaEl.addEventListener("blur", () => {
    const original = textareaEl.value;
    const normalized = normalizeMultilineItems(original);
    if (original !== normalized) {
      textareaEl.value = normalized;
      checkCommaWarning(textareaEl, warningEl);
    }
  });
}

/* atașează listeneri pentru toate textarea-urile cu linii multiple din panoul de detalii */
function attachAllMultilineListeners() {
  const pane = document.querySelector("#detailPane");
  if (!pane) return;

  /* sesizarea clientului - tab general */
  const complaintTa = pane.querySelector('[data-key="complaint"]');
  if (complaintTa) attachMultilineListeners(complaintTa, "complaint");

  /* departamente - în funcție de tabul activ (incl. piese_materiale acum) */
  const deptKeyMap = {
    mechanic: {
      constatari: "mechanic_constatari",
      lucrari: "mechanic_lucrari",
      piese: "mechanic_piese",
    },
    electric: {
      constatari: "electric_constatari",
      lucrari: "electric_lucrari",
      piese: "electric_piese",
    },
    paint: {
      elemente: "paint_elemente",
      constatari: "paint_constatari",
      lucrari: "paint_lucrari",
      piese: "paint_piese",
    },
    prep: {
      elemente: "prep_elemente",
      constatari: "prep_constatari",
      lucrari: "prep_lucrari",
      piese: "prep_piese",
    },
  };

  if (deptKeyMap[activeTab]) {
    const map = deptKeyMap[activeTab];
    const constatariTa = pane.querySelector('[data-dept-key="constatari"]');
    const lucrariTa = pane.querySelector('[data-dept-key="lucrari_efectuate"]');
    const elementeTa = pane.querySelector(
      '[data-dept-key="elemente_lucrate"]',
    );
    const pieseTa = pane.querySelector('[data-dept-key="piese_materiale"]');

    if (map.constatari && constatariTa)
      attachMultilineListeners(constatariTa, map.constatari);
    if (map.lucrari && lucrariTa)
      attachMultilineListeners(lucrariTa, map.lucrari);
    if (map.elemente && elementeTa)
      attachMultilineListeners(elementeTa, map.elemente);
    if (map.piese && pieseTa)
      attachMultilineListeners(pieseTa, map.piese);
  }
}

const CONFIRM_DIRTY_MESSAGE = "Există modificări nesalvate. Doriți să renunțați la ele?";
function confirmDiscardUnsaved() {
  if (!hasUnsavedChanges) return true;
  return window.confirm(CONFIRM_DIRTY_MESSAGE);
}
function removeBeforeunload() {
  if (_beforeunloadHandler) {
    window.removeEventListener("beforeunload", _beforeunloadHandler);
    _beforeunloadHandler = null;
  }
}
function ensureBeforeunload() {
  if (!_beforeunloadHandler) {
    _beforeunloadHandler = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", _beforeunloadHandler);
  }
}
function updateDirtyUI() {
  const label = document.getElementById("dirtyLabel");
  if (label) {
    label.classList.toggle("hidden", !hasUnsavedChanges);
  }
  if (hasUnsavedChanges) {
    ensureBeforeunload();
  } else {
    removeBeforeunload();
  }
}
function markDirty() {
  if (hasUnsavedChanges) return;
  hasUnsavedChanges = true;
  updateDirtyUI();
}
function clearDirtyState() {
  hasUnsavedChanges = false;
  updateDirtyUI();
}
function attachDirtyListener() {
  if (_detailDirtyListenerAttached) return;
  const pane = document.querySelector("#detailPane");
  if (!pane) return;
  _detailDirtyListenerAttached = true;
  const handler = (event) => {
    const target = event.target;
    if (!target || typeof target.matches !== "function") return;
    if (!target.matches("input, textarea, select")) return;
    if (!event.isTrusted) return;
    if (target.closest(".permission-gated"));
    markDirty();
  };
  pane.addEventListener("input", handler);
  pane.addEventListener("change", handler);
}
async function getAuditActor() {
  if (!auditActorPromise) {
    auditActorPromise = (async () => {
      try {
        const { data: sessionData, error: sessionError } =
          await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        const user = sessionData?.session?.user;
        if (!user?.id) return { user_id: null, user_name: "" };
        const { data: profile, error: profileError } = await supabaseClient
          .from("auth_profiles")
          .select("porecla, email")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        return {
          user_id: user.id,
          user_name: profile?.porecla || profile?.email || user.email || "",
        };
      } catch (error) {
        console.error(error);
        return { user_id: null, user_name: "" };
      }
    })();
  }
  return auditActorPromise;
}
async function logConstatariAudit(constatareId, actiune, descriere) {
  try {
    if (!constatareId) return;
    const actor = await getAuditActor();
    const payload = {
      modul: "Constatari",
      actiune,
      descriere: limitAuditText(descriere, 180),
      entitate: "constatare",
      entitate_id: String(constatareId),
      user_id: actor.user_id,
      user_name: actor.user_name,
    };
    if (typeof window.addAuditLog === "function") {
      await window.addAuditLog(payload);
      return;
    }
    const { error } = await supabaseClient.from("audit_logs").insert(payload);
    if (error) throw error;
  } catch (error) {
    console.error("Audit Constatari:", error);
  }
}
function mapDepartmentStatusToDb(value) {
  const normalized = String(value || "").replace(/[⚪🔵🟠🟢]/g, "").trim();
  if (normalized === "În lucru") return "În lucru";
  if (normalized === "Așteptare piese") return "Așteptare piese";
  if (normalized === "Finalizat") return "Finalizat";
  return "De făcut";
}
function mapDepartmentStatusToUi(value) {
  const normalized = String(value || "").replace(/[⚪🔵🟠🟢]/g, "").trim();
  if (normalized === "În lucru") return "🔵 În lucru";
  if (normalized === "Așteptare piese") return "🟠 Așteptare piese";
  if (normalized === "Finalizat") return "🟢 Finalizat";
  return "⚪ De făcut";
}
function mapStatusToDb(value) {
  const normalized = String(value || "").replace(/[🔵🟠🟢⚫]/g, "").trim();
  if (normalized === "Așteptare piese") return "Asteptare piese";
  if (normalized === "Finalizat") return "Finalizat";
  if (normalized === "Arhivat") return "Arhivat";
  return "In lucru";
}
function getServicePeopleForAssignment(key) {
  const departments = assignmentDepartments[key] || [];
  return servicePeople.filter((person) =>
    departments.includes(String(person.departament || "")),
  );
}
function normalizeDepartmentLabel(value) {
  const normalized = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized === "mecanica") return "mechanic";
  if (normalized === "electrica") return "electric";
  if (normalized === "vopsitorie") return "paint";
  if (
    normalized === "pregatire" ||
    normalized === "tinichigerie/pregatire" ||
    normalized === "tinichigerie/pregătire"
  ) {
    return "prep";
  }
  return "";
}
function getDepartmentKeyFromDb(value) {
  return normalizeDepartmentLabel(value);
}
function getDepartmentRowsForCar(constatareId) {
  return departmentRows.get(Number(constatareId)) || {};
}
function getDepartmentRow(constatareId, key) {
  return getDepartmentRowsForCar(constatareId)[deptData[key]?.db] || null;
}
function getDepartmentAssignmentsForCar(constatareId, key) {
  const all = departmentAssignments.get(Number(constatareId)) || {};
  return all[deptData[key]?.db] || [];
}
function parseFallbackResponsibleNames(value, key) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((names, item) => {
      const [department, ...nameParts] = item.split(":");
      const name = nameParts.join(":").trim();
      if (normalizeDepartmentLabel(department) === key && name) names.push(name);
      return names;
    }, []);
}
function getDepartmentResponsibleNames(c, key) {
  const assignedNames = getDepartmentAssignmentsForCar(c.id, key)
    .map((person) => String(person?.nume || "").trim())
    .filter(Boolean);
  return assignedNames.length
    ? assignedNames
    : parseFallbackResponsibleNames(c.responsabili, key);
}
function parseFallbackAssignedDepartmentKeys(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalizeDepartmentLabel(item.split(":")[0]))
    .filter(Boolean);
}
function getAssignedDepartmentKeys(constatareId, fallbackResponsabili = "") {
  const all = departmentAssignments.get(Number(constatareId)) || {};
  const assignedKeys = Object.values(deptData)
    .filter((dept) => (all[dept.db] || []).length)
    .map((dept) => getDepartmentKeyFromDb(dept.db))
    .filter(Boolean);
  return assignedKeys.length
    ? assignedKeys
    : parseFallbackAssignedDepartmentKeys(fallbackResponsabili);
}
function isReadyForFinalization(constatareId, fallbackResponsabili = "") {
  const assignedKeys = getAssignedDepartmentKeys(
    constatareId,
    fallbackResponsabili,
  );
  if (!assignedKeys.length) return false;
  return assignedKeys.every(
    (key) => getDepartmentRow(constatareId, key)?.status === "Finalizat",
  );
}
function parseResponsabiliAssignments(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const [department, ...nameParts] = item.split(":");
      const name = nameParts.join(":").trim();
      const deptKey = normalizeDepartmentLabel(department);
      if (deptKey && name) acc[deptKey] = name;
      return acc;
    }, {});
}
function buildResponsabiliValue() {
  return Object.keys(deptData)
    .map((key) => {
      const select = document.querySelector(`[data-assignment="${key}"]`);
      const selectedId = String(select?.value || "").trim();
      if (!selectedId) return "";
      const personName =
        servicePeople.find((person) => String(person.id) === selectedId)?.nume || "";
      if (!personName) return "";
      return `${deptData[key].title}: ${personName}`;
    })
    .filter(Boolean)
    .join(" | ");
}
function renderAssignmentOptions(key, selectedName = "") {
  if (servicePeopleError) {
    return `<option value="">Nu s-a putut încărca personalul</option>`;
  }
  if (!servicePeopleLoaded) {
    return `<option value="">Se încarcă personalul...</option>`;
  }
  const people = getServicePeopleForAssignment(key);
  if (!people.length) {
    return `<option value="">— Fără persoane active —</option>`;
  }
  return `<option value="">— Nerepartizat —</option>${people
    .map((person) => {
      const name = String(person.nume || "").trim();
      const selected = name === selectedName ? "selected" : "";
      return `<option value="${person.id}" data-name="${escapeHtml(name)}" ${selected}>${escapeHtml(name)}</option>`;
    })
    .join("")}`;
}
function renderAssignmentSelect(key, selectedAssignments = {}) {
  return `<select class="control" data-assignment="${key}">${renderAssignmentOptions(key, selectedAssignments[key] || "")}</select>`;
}
function getEditableCarPayload(options = {}) {
  const { includeKmOut = true } = options;
  const currentCar = cars.find((car) => car.id === selectedId) || {};
  const getValue = (key, fallback = "") => {
    const element = document.querySelector(`[data-key="${key}"]`);
    return element ? element.value.trim() : fallback;
  };
  const normalizedPlate = normalizePlate(getValue("plate"));
  /* normalizează câmpul complaint la salvare și actualizează textarea-ul vizibil */
  const complaintEl = document.querySelector('[data-key="complaint"]');
  const normalizedComplaint = normalizeMultilineItems(
    complaintEl ? complaintEl.value : getValue("complaint"),
  );
  if (complaintEl && complaintEl.value !== normalizedComplaint) {
    complaintEl.value = normalizedComplaint;
  }
  const payload = {
    nr_inmatriculare: normalizedPlate,
    model_masina: normalizeUpperTrim(getValue("model")),
    serie_vin: normalizeUpperTrim(getValue("vin")),
    kilometraj: parseNullableKm(getValue("kmIn")),
    client: normalizeUpperTrim(getValue("client")),
    telefon: getValue("phone"),
    status: mapStatusToDb(document.querySelector("#statusSelect")?.value || ""),
    este_urgent: !!document.querySelector('.check-line input[type="checkbox"]')
      ?.checked,
    responsabili: buildResponsabiliValue(),
    defectiuni_client: normalizedComplaint || null,
    defectiuni_mecanic: getValue("mechanicDefects", currentCar.mechanicDefects || ""),
    observatii: getValue("observations"),
  };
  if (includeKmOut) {
    payload.km_iesire = parseNullableKm(getValue("kmOut"));
  }
  const plateInput = document.querySelector('[data-key="plate"]');
  if (plateInput) plateInput.value = normalizedPlate;
  const modelInput = document.querySelector('[data-key="model"]');
  if (modelInput) modelInput.value = payload.model_masina;
  const vinInput = document.querySelector('[data-key="vin"]');
  if (vinInput) vinInput.value = payload.serie_vin;
  const clientInput = document.querySelector('[data-key="client"]');
  if (clientInput) clientInput.value = payload.client;
  return payload;
}
async function getNextNrFisa() {
  const { data, error } = await supabaseClient
    .from("constatari")
    .select("nr_fisa")
    .not("nr_fisa", "is", null)
    .order("nr_fisa", { ascending: false })
    .limit(1);
  if (error) throw error;
  const currentMax = parseInt(data?.[0]?.nr_fisa || "0", 10);
  return String((Number.isFinite(currentMax) ? currentMax : 0) + 1).padStart(4, "0");
}
async function getOpenAsteptareInterval(constatareId) {
  const { data, error } = await supabaseClient
    .from("constatari_asteptare_piese")
    .select("id")
    .eq("constatare_id", constatareId)
    .is("sfarsit", null)
    .order("inceput", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}
async function closeOpenAsteptareIntervals(constatareId, nowIso) {
  const { error } = await supabaseClient
    .from("constatari_asteptare_piese")
    .update({ sfarsit: nowIso })
    .eq("constatare_id", constatareId)
    .is("sfarsit", null);
  if (error) throw error;
}
async function applyExistingCarStatusRules(constatareId, nextStatus) {
  const nowIso = new Date().toISOString();
  const { data: currentRow, error: currentError } = await supabaseClient
    .from("constatari")
    .select("id, status, data_finalizarii")
    .eq("id", constatareId)
    .single();
  if (currentError) throw currentError;

  const payload = { status: nextStatus };

  if (nextStatus === "Finalizat") {
    payload.data_finalizarii = currentRow?.data_finalizarii || nowIso;
    await closeOpenAsteptareIntervals(constatareId, nowIso);
    return payload;
  }

  if (nextStatus === "In lucru") {
    payload.data_finalizarii = null;
    await closeOpenAsteptareIntervals(constatareId, nowIso);
    return payload;
  }

  if (nextStatus === "Asteptare piese") {
    payload.data_finalizarii = null;
    const openInterval = await getOpenAsteptareInterval(constatareId);
    if (!openInterval) {
      const { error: insertError } = await supabaseClient
        .from("constatari_asteptare_piese")
        .insert({ constatare_id: constatareId, inceput: nowIso, sfarsit: null });
      if (insertError) throw insertError;
    }
    return payload;
  }

  if (nextStatus === "Arhivat") {
    await closeOpenAsteptareIntervals(constatareId, nowIso);
    return payload;
  }

  return payload;
}
async function applyDepartmentStatusRules(constatareId, nextStatus, nowIso) {
  if (nextStatus === "În lucru") {
    await closeOpenAsteptareIntervals(constatareId, nowIso);
    const { error } = await supabaseClient
      .from("constatari")
      .update({ status: "In lucru", data_finalizarii: null })
      .eq("id", constatareId);
    if (error) throw error;
    return;
  }

  if (nextStatus === "Așteptare piese") {
    const openInterval = await getOpenAsteptareInterval(constatareId);
    if (!openInterval) {
      const { error: insertError } = await supabaseClient
        .from("constatari_asteptare_piese")
        .insert({ constatare_id: constatareId, inceput: nowIso, sfarsit: null });
      if (insertError) throw insertError;
    }
    const { error } = await supabaseClient
      .from("constatari")
      .update({ status: "Asteptare piese", data_finalizarii: null })
      .eq("id", constatareId);
    if (error) throw error;
  }
}
function getEditableDepartmentPayload(constatareId, key) {
  const dept = deptData[key];
  const status = mapDepartmentStatusToDb(
    document.querySelector("#deptStatus")?.value || "",
  );
  /* normalizează și actualizează vizual TOATE câmpurile țintite (incl. piese_materiale) */
  const normalizeAndSync = (field) => {
    const el = document.querySelector(`[data-dept-key="${field}"]`);
    const raw = el ? el.value : "";
    const normalized = normalizeMultilineItems(raw);
    if (el && el.value !== normalized) {
      el.value = normalized;
    }
    return normalized || null;
  };
  const constatariVal = normalizeAndSync("constatari");
  const lucrariVal = normalizeAndSync("lucrari_efectuate");
  const elementeVal = dept.hasElements ? normalizeAndSync("elemente_lucrate") : null;
  const pieseVal = normalizeAndSync("piese_materiale");
  const nowIso = new Date().toISOString();
  return {
    constatare_id: constatareId,
    departament: dept.db,
    constatari: constatariVal,
    lucrari_efectuate: lucrariVal,
    piese_materiale: pieseVal,
    elemente_lucrate: elementeVal,
    status,
    updated_at: nowIso,
    finalizat_la: status === "Finalizat" ? nowIso : null,
  };
}
async function saveDepartment(constatareId, key) {
  const payload = getEditableDepartmentPayload(constatareId, key);
  const dept = deptData[key];
  const { data: existingRow, error: lookupError } = await supabaseClient
    .from("constatari_departamente")
    .select("id, status")
    .eq("constatare_id", constatareId)
    .eq("departament", payload.departament)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existingRow?.id) {
    const { error } = await supabaseClient
      .from("constatari_departamente")
      .update(payload)
      .eq("id", existingRow.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseClient
      .from("constatari_departamente")
      .insert(payload);
    if (error) throw error;
  }

  await applyDepartmentStatusRules(
    constatareId,
    payload.status,
    payload.updated_at,
  );
  await logConstatariAudit(
    constatareId,
    "DEPARTMENT_SAVE",
    `Secțiunea ${dept.title} actualizată`,
  );
  if (existingRow?.status !== payload.status) {
    await logConstatariAudit(
      constatareId,
      "DEPARTMENT_STATUS",
      `Status ${dept.title}: ${payload.status}`,
    );
    if (payload.status === "Finalizat") {
      await logConstatariAudit(
        constatareId,
        "DEPARTMENT_DONE",
        `Secțiunea ${dept.title} finalizată`,
      );
    } else if (existingRow?.status === "Finalizat") {
      await logConstatariAudit(
        constatareId,
        "DEPARTMENT_REOPEN",
        `Secțiunea ${dept.title} redeschisă`,
      );
    }
  }
}
function mapStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();
  if (value === "finalizat") return { status: "done", statusText: "Finalizat" };
  if (value === "asteptare piese" || value === "așteptare piese")
    return { status: "wait", statusText: "Așteptare piese" };
  if (value === "arhivat") return { status: "archived", statusText: "Arhivat" };
  return { status: "work", statusText: "În lucru" };
}
function mapCar(row) {
  const mappedStatus = mapStatus(row.status);
  return {
    id: row.id,
    plate: row.nr_inmatriculare || "—",
    model: row.model_masina || "—",
    client: row.client || "—",
    phone: row.telefon || "",
    vin: row.serie_vin || "",
    kmIn: formatKm(row.kilometraj),
    kmOut: formatKm(row.km_iesire),
    date: formatDateRO(row.created_at),
    days: formatServiceDays(row.created_at, row.data_finalizarii),
    status: mappedStatus.status,
    statusText: mappedStatus.statusText,
    file: row.nr_fisa || "—",
    urgent: !!row.este_urgent,
    teams: row.responsabili || "—",
    complaint: row.defectiuni_client || "",
    mechanicDefects: row.defectiuni_mecanic || "",
    observations: row.observatii || "",
    exit: formatDateRO(row.data_finalizarii),
    created_at: row.created_at || "",
    completed_at: row.data_finalizarii || "",
    responsabili: row.responsabili || "",
    readyForFinalization: isReadyForFinalization(row.id, row.responsabili),
  };
}
function buildConstatarePrintPayload(c) {
  return {
    nrFisa: c.file === "—" ? "" : c.file || "",
    data: c.created_at || c.date || "",
    client: c.client === "—" ? "" : c.client || "",
    telefon: c.phone || "",
    nrAuto: c.plate === "—" ? "" : c.plate || "",
    marcaAuto: c.model === "—" ? "" : c.model || "",
    vin: c.vin || "",
    kmIntrare: c.kmIn || "",
    kmIesire: c.kmOut || "",
    defectiuniClient: c.complaint || "",
  };
}
function updateFilterCounts() {
  const counts = {
    all: cars.length,
    work: cars.filter((c) => c.status === "work").length,
    wait: cars.filter((c) => c.status === "wait").length,
    done: cars.filter((c) => c.status === "done").length,
    archived: cars.filter((c) => c.status === "archived").length,
  };
  document.querySelectorAll(".filter").forEach((btn) => {
    const badge = btn.querySelector("b");
    if (badge) badge.textContent = counts[btn.dataset.filter] ?? 0;
  });
}
function renderList() {
  const q = document.querySelector("#search").value.toLowerCase();
  const shown = cars.filter(
    (c) =>
      (activeFilter === "all" || c.status === activeFilter) &&
      [
        c.plate,
        c.model,
        c.client,
        c.file,
        c.teams,
        c.complaint,
        c.statusText,
        c.date,
        c.exit,
        c.days,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
  );
  if (activeFilter === "all") {
    shown.sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (a.status !== "done" && b.status === "done") return -1;
      return 0;
    });
  }
  const listEl = document.querySelector("#vehicleList");
  if (listErrorMessage) {
    listEl.innerHTML = `<div class="empty"><div><strong>${listErrorMessage}</strong><div>Datele nu au putut fi încărcate.</div></div></div>`;
    document.querySelector("#listFoot").textContent = "";
    return;
  }
  if (!shown.length) {
    listEl.innerHTML = `<div class="empty"><div><strong>${cars.length ? "Nicio mașină găsită" : "Nu există constatări"}</strong><div>${cars.length ? "Modifică filtrul sau căutarea." : "Lista este goală."}</div></div></div>`;
    document.querySelector("#listFoot").textContent =
      `Afișate ${shown.length} din ${cars.length} mașini`;
    return;
  }
  listEl.innerHTML = shown
    .map(
      (c) =>
        `<article class="vehicle-row ${c.id === selectedId && !creating ? "selected" : ""} ${c.urgent ? "urgent" : ""}" data-id="${c.id}"><div><div class="plate">${c.plate} ${c.urgent ? '<small class="urgent-label">URGENT</small>' : ""}</div><div class="model">${c.model}</div><div class="client">${c.client}</div></div><div class="date">${c.status === "done" ? `Ieșire: ${c.exit || "—"}<small>Total: ${c.days}</small>` : `Intrare: ${c.date || "—"}<small>${c.days} în service</small>`}<small>${c.teams}</small></div><div class="row-state"><div class="status-line"><span class="status ${statusClass(c.status)}">${c.statusText}</span>${c.readyForFinalization ? '<span class="ready-badge">Gata de finalizare</span>' : ""}</div><span class="file-no">Fișa ${c.file}</span></div></article>`,
    )
    .join("");
  document.querySelector("#listFoot").textContent =
    `Afișate ${shown.length} din ${cars.length} mașini`;
  document.querySelectorAll(".vehicle-row").forEach(
    (r) =>
      (r.onclick = async () => {
        const nextId = +r.dataset.id;
        if (nextId === selectedId && !creating) return;
        if (_selectionInFlight) return;
        if (!confirmDiscardUnsaved()) return;
        _selectionInFlight = true;
        try {
          clearDirtyState();
          selectedId = nextId;
          creating = false;
          editing = false;
          activeTab = "general";
          try {
            await loadAuditLogsForCar(selectedId);
          } catch (error) {
            console.error(error);
          }
          render();
        } finally {
          _selectionInFlight = false;
        }
      }),
  );
}
function generalContent(c, isNew = false) {
  const disabled = editing || isNew ? "" : "disabled";
  const selectedAssignments = parseResponsabiliAssignments(c.responsabili);
  const val = (label, key, type = "input", extra = "") =>
    `<div class="field ${extra}"><label>${label}</label>${type === "textarea" ? `<textarea class="control" data-key="${key}" ${disabled}>${isNew ? "" : c[key] || ""}</textarea>` : `<input class="control" data-key="${key}" value="${isNew ? "" : c[key] || ""}" ${disabled}>`}</div>`;

  /* textarea special pentru complaint cu placeholder + helper + warning */
  const complaintPlaceholder = MULTILINE_FIELD_CONFIG.complaint.placeholder;
  const complaintFieldHtml = `<div class="field full"><label>Defecțiuni reclamate</label><textarea class="control" data-key="complaint" placeholder="${escapeHtml(complaintPlaceholder)}" ${disabled}>${isNew ? "" : c.complaint || ""}</textarea>${buildMultilineHelperHtml("complaint")}</div>`;

  return `<div class="general-top-grid"><div class="section general-vehicle-card"><div class="section-title">Date vehicul ${!isNew && !editing ? '<button class="btn btn-ghost" id="editBtn">Editează</button>' : ""}</div><div class="grid">${val("Nr. înmatriculare", "plate")}${val("Marcă / Model", "model")}${val("Serie VIN", "vin")}${val("KM intrare", "kmIn")}${val("KM ieșire", "kmOut")}${val("Data intrării", "date")}</div></div><div class="section general-client-card"><div class="section-title">Client și fișă</div><div class="grid client-grid">${val("Nume client", "client")}${val("Telefon", "phone")}<div class="field"><label>Număr fișă</label><div class="value">${isNew ? "Se generează la salvare" : "Fișa " + c.file}</div></div><div class="field"><label>Status general</label><select class="control" id="statusSelect" ${disabled}><option ${c.status === "work" ? "selected" : ""}>🔵 În lucru</option><option ${c.status === "wait" ? "selected" : ""}>🟠 Așteptare piese</option><option ${c.status === "done" ? "selected" : ""}>🟢 Finalizat</option><option ${c.status === "archived" ? "selected" : ""}>⚫ Arhivat</option></select></div><div class="field client-urgent"><label>Regim</label><div class="check-line"><input type="checkbox" ${c.urgent ? "checked" : ""} ${disabled}> Urgent</div></div></div></div></div><div class="section"><div class="section-title">Sesizarea clientului</div><div class="grid two">${complaintFieldHtml}</div></div><div class="section"><div class="section-title">Observații</div><div class="grid two">${val("Observații", "observations", "textarea", "full")}</div></div>${isNew || editing ? `<div class="section"><div class="section-title">Repartizare inițială</div><div class="grid two"><div class="field"><label>Mecanică</label>${renderAssignmentSelect("mechanic", selectedAssignments)}</div><div class="field"><label>Electrică</label>${renderAssignmentSelect("electric", selectedAssignments)}</div><div class="field"><label>Vopsitorie</label>${renderAssignmentSelect("paint", selectedAssignments)}</div><div class="field"><label>Pregătire</label>${renderAssignmentSelect("prep", selectedAssignments)}</div></div></div>` : ""}`;
}
function deptContent(key, c) {
  const d = deptData[key];
  const row = getDepartmentRow(c.id, key) || {};
  const people = getDepartmentResponsibleNames(c, key);
  const statusUi = mapDepartmentStatusToUi(row.status);
  const message =
    detailMessage && detailMessage.constatareId === c.id && detailMessage.tab === key
      ? `<div class="dept-note">${escapeHtml(detailMessage.text)}</div>`
      : "";

  /* mapare câmp → config key pentru MULTILINE_FIELD_CONFIG (incl. piese_materiale acum) */
  const deptFieldConfigMap = {
    mechanic: {
      constatari: "mechanic_constatari",
      lucrari_efectuate: "mechanic_lucrari",
      piese_materiale: "mechanic_piese",
    },
    electric: {
      constatari: "electric_constatari",
      lucrari_efectuate: "electric_lucrari",
      piese_materiale: "electric_piese",
    },
    paint: {
      elemente_lucrate: "paint_elemente",
      constatari: "paint_constatari",
      lucrari_efectuate: "paint_lucrari",
      piese_materiale: "paint_piese",
    },
    prep: {
      elemente_lucrate: "prep_elemente",
      constatari: "prep_constatari",
      lucrari_efectuate: "prep_lucrari",
      piese_materiale: "prep_piese",
    },
  };
  const fieldConfig = deptFieldConfigMap[key] || {};

  /* generează field cu multiline placeholder + helper + warning dacă e țintit */
  const field = (label, dataKey, extra = "") => {
    const cfgKey = fieldConfig[dataKey];
    const cfg = cfgKey ? MULTILINE_FIELD_CONFIG[cfgKey] : null;
    const placeholderAttr = cfg ? ` placeholder="${escapeHtml(cfg.placeholder)}"` : "";
    const helperHtml = cfgKey ? buildMultilineHelperHtml(cfgKey) : "";
    return `<div class="field ${extra}"><label>${label}</label><textarea class="control" data-dept-key="${dataKey}"${placeholderAttr}>${escapeHtml(row[dataKey] || "")}</textarea>${helperHtml}</div>`;
  };

  const fields = d.hasElements
    ? `${field("Elemente lucrate", "elemente_lucrate")}${field("Defecțiuni constatate", "constatari")}${field("Lucrare efectuată", "lucrari_efectuate")}${field("Piese / materiale folosite", "piese_materiale")}`
    : `${field("Defecțiuni constatate", "constatari")}${field("Lucrare efectuată", "lucrari_efectuate")}${field("Piese / materiale folosite", "piese_materiale", "parts-half")}`;
  return `${message}<div class="dept-note">Sesizare client: ${escapeHtml(c.complaint || "—").replaceAll("\n", " · ")}</div><div class="section dept-header-section"><div class="dept-header-row"><div class="dept-header-title">${d.title}</div><div class="dept-responsibles">Responsabili: ${people.length ? escapeHtml(people.join(" | ")) : "Nerepartizat"}</div><div class="section-status"><select class="control dept-status-select" id="deptStatus"><option ${statusUi === "⚪ De făcut" ? "selected" : ""}>⚪ De făcut</option><option ${statusUi === "🔵 În lucru" ? "selected" : ""}>🔵 În lucru</option><option ${statusUi === "🟠 Așteptare piese" ? "selected" : ""}>🟠 Așteptare piese</option><option ${statusUi === "🟢 Finalizat" ? "selected" : ""}>🟢 Finalizat</option></select></div></div></div><div class="section"><div class="section-title">Constatare și lucrare</div><div class="dept-fields ${d.hasElements ? "dept-fields-four" : "dept-fields-three"}">${fields}</div></div><div class="section photos-row"><div class="photos-title">Poze</div><div class="photos-soon">În curând</div><button class="btn btn-ghost" disabled>Adaugă poze</button></div>`;
}
function historyContent(c) {
  const logs = auditLogsByCar.get(Number(c.id)) || [];
  const events = logs.length
    ? `<div class="timeline">${logs
        .map((row) => {
          const title = limitAuditText(row.actiune || "Activitate", 70);
          const description = limitAuditText(row.descriere || "", 180);
          const user = limitAuditText(row.user_name || "Utilizator necunoscut", 80);
          return `<div class="event"><b>${escapeHtml(title)}</b>${description ? `<div>${escapeHtml(description)}</div>` : ""}<small>${formatDateTimeRO(row.created_at)} · ${escapeHtml(user)}</small></div>`;
        })
        .join("")}</div>`
    : `<div class="value">Nu există activitate înregistrată pentru această mașină.</div>`;
  return `<div class="section"><div class="section-title">Rezumat timp</div><div class="history-summary"><div><label>Intrare</label><strong>${formatDateTimeRO(c.created_at)}</strong></div><div><label>Timp în service</label><strong>${formatServiceDuration(c.created_at, c.completed_at)}</strong></div><div><label>Așteptare piese</label><strong>${formatCompactDuration(getWaitingMs(c.id))}</strong></div></div></div><div class="section"><div class="section-title">Istoric activitate</div>${events}</div>`;
}
function departmentTabClass(constatareId, key) {
  const status = getDepartmentRow(constatareId, key)?.status || "";
  if (status === "Finalizat") return "done-tab";
  if (status === "Așteptare piese") return "progress-tab";
  if (status === "În lucru") return "work-tab";
  return "";
}
function renderDetail() {
  const pane = document.querySelector("#detailPane");
  if (creating) {
    pane.innerHTML = `<div class="detail-header"><div class="vehicle-title-line"><div><div class="vehicle-title">Mașină nouă</div><div class="vehicle-summary">Completează datele de recepție și repartizarea inițială</div></div></div></div><div class="content">${generalContent({ status: "work" }, true)}<div class="form-actions"><span id="dirtyLabel" class="dirty-label ${hasUnsavedChanges ? "" : "hidden"}">Modificări nesalvate</span><button class="btn btn-ghost" id="cancelBtn">Anulează</button><button class="btn btn-primary" id="createBtn">Salvează mașina</button></div></div>`;
    document.querySelector("#cancelBtn").onclick = () => {
      if (!confirmDiscardUnsaved()) return;
      clearDirtyState();
      creating = false;
      render();
    };
    const createBtn = document.querySelector("#createBtn");
    createBtn.onclick = async () => {
      const originalText = createBtn.textContent;
      createBtn.disabled = true;
      createBtn.textContent = "Se salvează...";
      try {
        const payload = getEditableCarPayload({ includeKmOut: false });
        payload.nr_fisa = await getNextNrFisa();
        const { data, error } = await supabaseClient
          .from("constatari")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        if (!data?.id) throw new Error("Insert fără ID returnat.");
        await logConstatariAudit(
          data.id,
          "CREATE",
          "Mașină introdusă în service",
        );
        if (payload.responsabili) {
          await logConstatariAudit(
            data.id,
            "ASSIGNMENT_CHANGE",
            `Repartizare: ${payload.responsabili}`,
          );
        }
        clearDirtyState();
        creating = false;
        editing = false;
        activeTab = "general";
        await loadCars(data.id);
      } catch (error) {
        console.error(error);
        alert("Nu s-a putut genera sau salva fișa.");
        createBtn.disabled = false;
        createBtn.textContent = originalText;
      }
    };
    return;
  }
  const c = cars.find((x) => x.id === selectedId);
  if (!c) {
    pane.innerHTML = `<div class="empty"><div><strong>${listErrorMessage ? "Nu s-au putut încărca detaliile" : "Nicio mașină selectată"}</strong><div>${listErrorMessage ? "Verifică consola pentru detalii." : "Selectează o constatare din listă."}</div></div></div>`;
    return;
  }
  const tabNames = [
    ["general", "Date mașină & constatări"],
    ["mechanic", "Mecanică"],
    ["electric", "Electrică"],
    ["paint", "Vopsitorie"],
    ["prep", "Pregătire"],
    ["history", "Istoric"],
  ];
  pane.innerHTML = `<div class="detail-header"><div class="vehicle-title-line"><div><div class="vehicle-title">${c.plate} · ${c.model}</div><div class="vehicle-summary">${c.client} · Intrare: ${c.date} · ${c.days} în service</div></div><span class="status ${statusClass(c.status)}">${c.statusText}</span><span class="file-no">Fișa ${c.file}</span><div class="header-tools"><div class="print-menu-wrap"><button class="btn btn-ghost" id="printMenuBtn">Tipărește fișa</button><div class="print-menu hidden" id="printMenu"><button type="button" data-print="rar">Fișă RAR – intrare</button><button type="button" disabled>Fișă tehnică electronică <small>În curând</small></button></div></div></div></div></div><nav class="tabs">${tabNames.map(([k, n]) => `<button class="tab ${activeTab === k ? "active" : ""} ${deptData[k] ? departmentTabClass(c.id, k) : ""}" data-tab="${k}">${n}</button>`).join("")}</nav><div class="content">${activeTab === "general" ? generalContent(c) : activeTab === "history" ? historyContent(c) : deptContent(activeTab, c)}</div><div class="footer-actions"><span id="dirtyLabel" class="dirty-label ${hasUnsavedChanges ? "" : "hidden"}">Modificări nesalvate</span>${activeTab === "general" ? (editing ? '<button class="btn btn-ghost" id="cancelEdit">Anulează</button><button class="btn btn-primary" id="saveEdit">Salvează modificările</button>' : "") : activeTab !== "history" ? '<button class="btn btn-primary" id="saveDept">Salvează</button>' : ""}</div>`;
  const printBtn = document.querySelector("#printMenuBtn");
  const printMenu = document.querySelector("#printMenu");
  if (printBtn && printMenu) {
    printBtn.onclick = (event) => {
      event.stopPropagation();
      printMenu.classList.toggle("hidden");
    };
    printMenu.onclick = (event) => {
      event.stopPropagation();
      if (event.target.closest('[data-print="rar"]')) {
        const selectedCar = cars.find((car) => car.id === selectedId);
        if (!selectedCar) {
          alert("Nu există mașină selectată pentru printare.");
          return;
        }
        printMenu.classList.add("hidden");
        localStorage.setItem(
          "currentConstatarePrint",
          JSON.stringify(buildConstatarePrintPayload(selectedCar)),
        );
        window.open("constatare-print.html", "_blank");
      }
    };
  }
  document.querySelectorAll(".tab").forEach(
    (t) =>
      (t.onclick = async () => {
        if (t.dataset.tab === activeTab) return;
        if (!confirmDiscardUnsaved()) return;
        clearDirtyState();
        activeTab = t.dataset.tab;
        editing = false;
        if (activeTab === "history") {
          try {
            await loadAuditLogsForCar(selectedId);
          } catch (error) {
            console.error(error);
          }
        }
        renderDetail();
      }),
  );
  const eb = document.querySelector("#editBtn");
  if (eb)
    eb.onclick = () => {
      editing = true;
      renderDetail();
    };
  const ce = document.querySelector("#cancelEdit");
  if (ce)
    ce.onclick = () => {
      if (!confirmDiscardUnsaved()) return;
      clearDirtyState();
      editing = false;
      renderDetail();
    };
  const se = document.querySelector("#saveEdit");
  if (se)
    se.onclick = async () => {
      const currentId = selectedId;
      const previousCar = cars.find((car) => car.id === currentId) || {};
      const previousStatus = previousCar.statusText || "";
      const previousResponsabili = previousCar.responsabili || "";
      const originalText = se.textContent;
      se.disabled = true;
      se.textContent = "Se salvează...";
      try {
        const payload = getEditableCarPayload();
        const statusPayload = await applyExistingCarStatusRules(
          currentId,
          payload.status,
        );
        const { data, error } = await supabaseClient
          .from("constatari")
          .update({ ...payload, ...statusPayload })
          .eq("id", currentId)
          .select("id")
          .single();
        if (error) throw error;
        if (!data?.id) throw new Error("Update fără ID returnat.");
        const nextStatus = mapStatus(payload.status).statusText;
        if (previousStatus && previousStatus !== nextStatus) {
          await logConstatariAudit(
            currentId,
            "STATUS_CHANGE",
            `Status general: ${nextStatus}`,
          );
          if (payload.status === "Finalizat") {
            await logConstatariAudit(
              currentId,
              "CAR_DONE",
              "Mașină confirmată finalizată",
            );
          } else if (payload.status === "Arhivat") {
            await logConstatariAudit(currentId, "ARCHIVE", "Mașină arhivată");
          } else if (previousCar.status === "archived") {
            await logConstatariAudit(
              currentId,
              "REACTIVATE",
              "Mașină reactivată",
            );
          }
        }
        if (previousResponsabili !== payload.responsabili) {
          const repartizare = payload.responsabili || "Nerepartizat";
          await logConstatariAudit(
            currentId,
            "ASSIGNMENT_CHANGE",
            `Repartizare: ${repartizare}`,
          );
        }
        clearDirtyState();
        editing = false;
        await loadCars(currentId);
      } catch (error) {
        console.error(error);
        alert("Nu s-au putut salva modificările.");
        se.disabled = false;
        se.textContent = originalText;
      }
    };
  const sd = document.querySelector("#saveDept");
  if (sd)
    sd.onclick = async () => {
      const currentId = selectedId;
      const currentTab = activeTab;
      const originalText = sd.textContent;
      sd.disabled = true;
      sd.textContent = "Se salvează...";
      try {
        await saveDepartment(currentId, currentTab);
        detailMessage = {
          constatareId: currentId,
          tab: currentTab,
          text: "Salvat.",
        };
        clearDirtyState();
        activeTab = currentTab;
        await loadCars(currentId);
      } catch (error) {
        console.error("Salvare departament:", error);
        alert("Nu s-a putut salva departamentul.");
        sd.disabled = false;
        sd.textContent = originalText;
      }
    };

  /* atașează listeneri pentru normalizare și avertismente virgule */
  attachAllMultilineListeners();
}
function render() {
  updateFilterCounts();
  renderList();
  renderDetail();
}
async function loadDepartmentRows(constatareIds) {
  departmentRows.clear();
  if (!constatareIds.length) return;
  const { data, error } = await supabaseClient
    .from("constatari_departamente")
    .select("id, constatare_id, departament, constatari, lucrari_efectuate, status, updated_at, finalizat_la, piese_materiale, elemente_lucrate")
    .in("constatare_id", constatareIds);
  if (error) throw error;
  (data || []).forEach((row) => {
    const constatareId = Number(row.constatare_id);
    const byDept = departmentRows.get(constatareId) || {};
    if (!byDept[row.departament]) byDept[row.departament] = row;
    departmentRows.set(constatareId, byDept);
  });
}
async function loadDepartmentAssignments(constatareIds) {
  departmentAssignments.clear();
  if (!constatareIds.length) return;
  const { data, error } = await supabaseClient
    .from("constatari_repartizari")
    .select("constatare_id, service_personal:service_personal_id(id, nume, departament)")
    .in("constatare_id", constatareIds)
    .eq("activ", true)
    .is("retras_la", null);
  if (error) throw error;
  (data || []).forEach((row) => {
    const person = Array.isArray(row.service_personal)
      ? row.service_personal[0]
      : row.service_personal;
    const key = getDepartmentKeyFromDb(person?.departament);
    const dept = deptData[key]?.db;
    if (!dept) return;
    const constatareId = Number(row.constatare_id);
    const byDept = departmentAssignments.get(constatareId) || {};
    byDept[dept] = byDept[dept] || [];
    byDept[dept].push(person);
    departmentAssignments.set(constatareId, byDept);
  });
}
async function loadWaitingIntervals(constatareIds) {
  waitingIntervals.clear();
  if (!constatareIds.length) return;
  const { data, error } = await supabaseClient
    .from("constatari_asteptare_piese")
    .select("constatare_id, inceput, sfarsit")
    .in("constatare_id", constatareIds)
    .order("inceput", { ascending: true });
  if (error) throw error;
  (data || []).forEach((row) => {
    const constatareId = Number(row.constatare_id);
    const rows = waitingIntervals.get(constatareId) || [];
    rows.push(row);
    waitingIntervals.set(constatareId, rows);
  });
}
async function loadAuditLogsForCar(constatareId) {
  if (!constatareId) return;
  const { data, error } = await supabaseClient
    .from("audit_logs")
    .select("created_at, actiune, descriere, user_name")
    .eq("modul", "Constatari")
    .eq("entitate", "constatare")
    .eq("entitate_id", String(constatareId))
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw error;
  auditLogsByCar.set(Number(constatareId), data || []);
}
async function loadCars(preferredSelectedId = null, options = {}) {
  const { preserveActiveInput = false } = options;
  const myGeneration = ++loadCarsGeneration;
  if (activeLoadCarsPromise) return activeLoadCarsPromise;
  const run = (async () => {
    listErrorMessage = "";
    try {
      const { data, error } = await supabaseClient
        .from("constatari")
        .select("id, created_at, nr_inmatriculare, model_masina, serie_vin, kilometraj, defectiuni_client, defectiuni_mecanic, observatii, status, este_urgent, client, telefon, km_iesire, nr_fisa, data_finalizarii, responsabili")
        .order("created_at", { ascending: false });
      if (myGeneration !== loadCarsGeneration) return;
      if (error) throw error;
      const rows = data || [];
      const constatareIds = rows.map((row) => row.id);
      await loadDepartmentRows(constatareIds);
      await loadDepartmentAssignments(constatareIds);
      await loadWaitingIntervals(constatareIds);
      cars.length = 0;
      rows.forEach((row) => cars.push(mapCar(row)));

      const anchorId = preferredSelectedId != null ? preferredSelectedId : selectedId;
      const stillExists = cars.find((row) => row.id === anchorId);
      if (hasUnsavedChanges) {
        if (anchorId != null && !stillExists) {
          console.warn(`Constatări loadCars: vehiculul selectat (id=${anchorId}) nu mai există în lista nouă, dar formularul are modificări nesalvate. Păstrăm selecția.`);
        }
      } else {
        selectedId = stillExists?.id || cars[0]?.id || null;
        try {
          await loadAuditLogsForCar(selectedId);
        } catch (e) {
          console.error(e);
        }
      }
      updateFilterCounts();
      if (hasUnsavedChanges) {
        renderList();
        return;
      }
      if (preserveActiveInput && isTextEntryActive()) {
        renderList();
        return;
      }
      if (myGeneration !== loadCarsGeneration) return;
      render();
    } catch (error) {
      console.error(error);
      if (hasUnsavedChanges) {
        listErrorMessage = "Eroare la încărcarea constatărilor";
        updateFilterCounts();
        try { renderList(); } catch (_) {}
        return;
      }
      cars.length = 0;
      selectedId = null;
      listErrorMessage = "Eroare la încărcarea constatărilor";
      updateFilterCounts();
      render();
    }
  })();
  activeLoadCarsPromise = run;
  run.finally(() => {
    if (activeLoadCarsPromise === run) activeLoadCarsPromise = null;
  });
  return run;
}
async function loadServicePeople() {
  try {
    const { data, error } = await supabaseClient
      .from("service_personal")
      .select("id, nume, departament, user_id, ordine")
      .eq("activ", true)
      .order("ordine", { ascending: true })
      .order("nume", { ascending: true });
    if (error) throw error;
    servicePeople = data || [];
    servicePeopleLoaded = true;
    servicePeopleError = false;
  } catch (error) {
    console.error(error);
    servicePeople = [];
    servicePeopleLoaded = true;
    servicePeopleError = true;
  }
  if (hasUnsavedChanges) {
    updateDirtyUI();
    return;
  }
  if (creating || (editing && activeTab === "general")) {
    renderDetail();
  }
}
function refreshLocalTimes() {
  cars.forEach((car) => {
    car.days = formatServiceDuration(car.created_at, car.completed_at);
  });
  renderList();
  if (hasUnsavedChanges) return;
  if (activeTab === "history" && !isTextEntryActive()) renderDetail();
}
function startPeriodicRefresh() {
  if (!refreshTimer) {
    refreshTimer = setInterval(() => {
      if (creating) return;
      if (activeLoadCarsPromise) return;
      loadCars(selectedId, { preserveActiveInput: true });
    }, 15000);
  }
  if (!localTimeTimer) {
    localTimeTimer = setInterval(refreshLocalTimes, 60000);
  }
}
function setupPrintMenuClose() {
  if (window.constatariV2PrintMenuCloseReady) return;
  window.constatariV2PrintMenuCloseReady = true;
  document.addEventListener("click", (event) => {
    if (event.target.closest(".print-menu-wrap")) return;
    document
      .querySelectorAll(".print-menu")
      .forEach((menu) => menu.classList.add("hidden"));
  });
}
function hasConstatariAccess(profile) {
  if (Number(profile?.rol_id) === 1) return true;
  return profile?.permissions?.constatari === true;
}
async function ensureConstatariV2Access() {
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
  if (!hasConstatariAccess(profile)) {
    window.location.href = "../../index.html";
    return false;
  }
  return true;
}
async function bootstrapConstatariV2() {
  try {
    const allowed = await ensureConstatariV2Access();
    if (!allowed) return;
    constatariV2AccessGranted = true;
    attachDirtyListener();
    loadServicePeople();
    setupPrintMenuClose();
    await loadCars();
    updateDirtyUI();
    startPeriodicRefresh();
  } catch (error) {
    console.error(error);
    window.location.href = "../../index.html";
  }
}
document.querySelector("#search").addEventListener("input", renderList);
document.querySelector("#newBtn").onclick = () => {
  if (!constatariV2AccessGranted) return;
  if (!confirmDiscardUnsaved()) return;
  clearDirtyState();
  if (!servicePeopleLoaded) loadServicePeople();
  creating = true;
  editing = false;
  render();
};
document.querySelectorAll(".filter").forEach(
  (f) =>
    (f.onclick = () => {
      activeFilter = f.dataset.filter;
      document
        .querySelectorAll(".filter")
        .forEach((x) => x.classList.toggle("active", x === f));
      renderList();
    }),
);
document.querySelector("#backBtn")?.addEventListener("click", (event) => {
  if (!confirmDiscardUnsaved()) {
    event.preventDefault();
    return;
  }
  clearDirtyState();
  window.location.href = "../../index.html";
});
bootstrapConstatariV2();
