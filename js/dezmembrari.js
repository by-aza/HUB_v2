/* etichetele folosite de lista si filtrele Piese Mari */
const statusLabels = {
  draft: "De completat",
  ready: "Gata de publicare",
  published: "Publicat",
  sold: "Vândut",
  archived: "Arhivat",
};

const typeLabels = {
  car: "Mașină",
  engine: "Motor",
  gearbox: "Cutie viteze",
  part: "Altă piesă",
};

/* campurile afisate pentru fiecare tip de articol */
const fieldsByItemType = {
  car: ["vin", "brand", "model", "year", "fuel", "engineCode", "gearboxType", "price", "location", "link", "notes"],
  engine: ["vin", "brand", "model", "year", "fuel", "engineCode", "price", "location", "link", "notes"],
  gearbox: ["vin", "brand", "model", "year", "gearboxCode", "gearboxType", "price", "location", "link", "notes"],
  part: ["partName", "vin", "brand", "model", "year", "price", "location", "link", "notes"],
};

const mockDezmembrariItems = [
  {
    id: 1,
    internalId: "DZ-00001",
    type: "car",
    title: "BMW Seria 3 E90",
    vin: "WBAPD11020A123456",
    brand: "BMW",
    model: "Seria 3 E90",
    year: "2007",
    fuel: "Diesel",
    engineCode: "N47D20A",
    gearbox: "Manuală",
    price: "2.850",
    location: "Parc exterior - Rând B",
    status: "draft",
    date: "12 Dec 2024",
    addedBy: "Andrei",
    link: "https://www.pieseauto.ro/bmw-seria-3-e90",
    notes: "Mașină completă, stare bună. Motor pornește.",
    thumb: "linear-gradient(135deg, #64748b 0%, #1e293b 40%, #0f172a 100%)",
    photos: [
      "linear-gradient(135deg, #9ca3af 0%, #334155 45%, #111827 100%)",
      "linear-gradient(135deg, #64748b, #0f172a)",
      "linear-gradient(135deg, #475569, #111827)",
      "linear-gradient(135deg, #334155, #020617)",
      "linear-gradient(135deg, #52525b, #1e293b)",
    ],
  },
  {
    id: 2,
    internalId: "DZ-00002",
    type: "engine",
    title: "Audi 2.0 TDI",
    vin: "",
    brand: "Audi",
    model: "2.0 TDI",
    year: "2011",
    fuel: "Diesel",
    engineCode: "CAGA",
    gearbox: "Cu anexe",
    price: "1.200",
    location: "Raft M2",
    status: "ready",
    date: "10 Dec 2024",
    addedBy: "Mihai",
    link: "https://www.pieseauto.ro/audi-2-0-tdi-caga",
    notes: "Motor complet, testat la pornire.",
    thumb: "linear-gradient(135deg, #737373 0%, #27272a 48%, #09090b 100%)",
    photos: [
      "linear-gradient(135deg, #a3a3a3, #27272a)",
      "linear-gradient(135deg, #71717a, #18181b)",
      "linear-gradient(135deg, #52525b, #09090b)",
    ],
  },
  {
    id: 3,
    internalId: "DZ-00003",
    type: "gearbox",
    title: "VW 1.6 TDI",
    vin: "",
    brand: "Volkswagen",
    model: "1.6 TDI",
    year: "2013",
    fuel: "Diesel",
    engineCode: "CAYC",
    gearbox: "Manuală, 6 trepte",
    price: "650",
    location: "Raft C4",
    status: "published",
    date: "08 Dec 2024",
    addedBy: "Ioana",
    link: "https://www.pieseauto.ro/cutie-vw-1-6-tdi",
    notes: "Cutie verificată vizual, fără fisuri.",
    thumb: "linear-gradient(135deg, #78716c 0%, #292524 48%, #0c0a09 100%)",
    photos: [
      "linear-gradient(135deg, #a8a29e, #292524)",
      "linear-gradient(135deg, #57534e, #1c1917)",
    ],
  },
  {
    id: 4,
    internalId: "DZ-00004",
    type: "car",
    title: "Volkswagen Golf 6",
    vin: "WVWZZZ1KZBW123789",
    brand: "Volkswagen",
    model: "Golf 6",
    year: "2011",
    fuel: "Diesel",
    engineCode: "CAYC",
    gearbox: "Manuală",
    price: "1.950",
    location: "Parc exterior - Rând A",
    status: "draft",
    date: "07 Dec 2024",
    addedBy: "Radu",
    link: "https://www.pieseauto.ro/vw-golf-6",
    notes: "Interior complet. Elemente față ușor avariate.",
    thumb: "linear-gradient(135deg, #cbd5e1 0%, #475569 43%, #0f172a 100%)",
    photos: [
      "linear-gradient(135deg, #e2e8f0, #475569)",
      "linear-gradient(135deg, #94a3b8, #1e293b)",
      "linear-gradient(135deg, #64748b, #020617)",
    ],
  },
  {
    id: 5,
    internalId: "DZ-00005",
    type: "engine",
    title: "Mercedes OM651",
    vin: "",
    brand: "Mercedes",
    model: "OM651",
    year: "2014",
    fuel: "Diesel",
    engineCode: "OM651.911",
    gearbox: "Complet, testat",
    price: "1.800",
    location: "Raft M1",
    status: "ready",
    date: "05 Dec 2024",
    addedBy: "Elena",
    link: "https://www.pieseauto.ro/mercedes-om651",
    notes: "Motor complet, fără accesorii lipsă vizibile.",
    thumb: "linear-gradient(135deg, #a1a1aa 0%, #3f3f46 44%, #18181b 100%)",
    photos: [
      "linear-gradient(135deg, #d4d4d8, #3f3f46)",
      "linear-gradient(135deg, #71717a, #09090b)",
    ],
  },
  {
    id: 6,
    internalId: "DZ-00006",
    type: "car",
    title: "Skoda Octavia 2",
    vin: "TMBBG61Z8B2098765",
    brand: "Skoda",
    model: "Octavia 2",
    year: "2010",
    fuel: "Diesel",
    engineCode: "BKC",
    gearbox: "Manuală",
    price: "1.400",
    location: "Parc exterior - Rând C",
    status: "published",
    date: "02 Dec 2024",
    addedBy: "Cătălin",
    link: "https://www.pieseauto.ro/skoda-octavia-2",
    notes: "Mașină pentru elemente caroserie și interior.",
    thumb: "linear-gradient(135deg, #94a3b8 0%, #334155 45%, #111827 100%)",
    photos: [
      "linear-gradient(135deg, #cbd5e1, #334155)",
      "linear-gradient(135deg, #64748b, #111827)",
    ],
  },
  {
    id: 7,
    internalId: "DZ-00007",
    type: "gearbox",
    title: "BMW 6HP19",
    vin: "",
    brand: "BMW",
    model: "6HP19",
    year: "2009",
    fuel: "Diesel",
    engineCode: "M57",
    gearbox: "Automată cu convertizor",
    price: "750",
    location: "Raft C2",
    status: "draft",
    date: "01 Dec 2024",
    addedBy: "Sorin",
    link: "https://www.pieseauto.ro/bmw-6hp19",
    notes: "Cutie automată, necesită verificare nivel ulei.",
    thumb: "linear-gradient(135deg, #78716c 0%, #44403c 42%, #1c1917 100%)",
    photos: [
      "linear-gradient(135deg, #a8a29e, #44403c)",
      "linear-gradient(135deg, #57534e, #1c1917)",
    ],
  },
  {
    id: 8,
    internalId: "DZ-00008",
    type: "car",
    title: "Renault Megane 3",
    vin: "VF1BZ1G0645678901",
    brand: "Renault",
    model: "Megane 3",
    year: "2012",
    fuel: "Diesel",
    engineCode: "K9K",
    gearbox: "Manuală",
    price: "1.600",
    location: "Parc exterior - Rând D",
    status: "ready",
    date: "28 Nov 2024",
    addedBy: "Andrei",
    link: "https://www.pieseauto.ro/renault-megane-3",
    notes: "Mașină completă pentru publicare după completare galerie.",
    thumb: "linear-gradient(135deg, #cbd5e1 0%, #64748b 44%, #1e293b 100%)",
    photos: [
      "linear-gradient(135deg, #e2e8f0, #64748b)",
      "linear-gradient(135deg, #94a3b8, #1e293b)",
    ],
  },
];

/* lista activa este populata exclusiv din Supabase */
let dezmembrariItems = [];

/* limita cererilor private de thumbnail pentru incarcare fluida */
const LIST_THUMBNAIL_CONCURRENCY = 3;
const thumbnailObjectUrlCache = new Map();
const r2SignedUrlCache = new Map();
const thumbnailRequestQueue = [];
const listThumbnailQueue = [];
let activeThumbnailRequests = 0;
let activeListThumbnailLoads = 0;
const R2_OBJECT_KEY_PATTERN = /^DZ-\d{5,}\/\d{2}(?:-thumb)?\.jpg$/;
const R2_SIGNED_URL_REFRESH_MARGIN_MS = 30 * 1000;
const DESKTOP_PHOTO_MAXIMUM = 99;

/* regulile imaginii principale sunt identice cu fluxul mobil */
const DESKTOP_PHOTO_COMPRESSION = {
  maxLongEdge: 1024,
  fallbackLongEdge: 1024,
  targetMinBytes: 150 * 1024,
  targetMaxBytes: 350 * 1024,
  startQuality: 0.78,
  minimumQuality: 0.6,
  qualityStep: 0.04,
};

/* regulile thumbnail-ului raman identice cu fluxul mobil */
const DESKTOP_THUMBNAIL_COMPRESSION = {
  maxLongEdge: 800,
  targetMinBytes: 80 * 1024,
  targetMaxBytes: 150 * 1024,
  startQuality: 0.88,
  minimumQuality: 0.58,
  qualityStep: 0.05,
};

const emptyPhotoPlaceholder = "linear-gradient(135deg, #334155 0%, #172033 48%, #0b1220 100%)";

/* transforma randurile Supabase in modelul folosit de UI */
function mapDezmembrariItem(row) {
  const creator = Array.isArray(row.creator) ? row.creator[0] : row.creator;
  const updater = Array.isArray(row.updater) ? row.updater[0] : row.updater;
  const titleParts = {
    car: [row.marca, row.model],
    engine: [row.marca, row.cod_motor || row.model],
    gearbox: [row.marca, row.cod_cutie || row.tip_cutie || row.model],
    part: [row.denumire_piesa],
  };
  const createdAt = row.created_at ? new Date(row.created_at) : null;
  const updatedAt = row.updated_at ? new Date(row.updated_at) : null;
  const numericPrice = row.pret === null || row.pret === undefined ? null : Number(row.pret);

  /* formatare data pentru audit (creat/modificat) */
  const formatAuditDate = (dateObj) => {
    if (!dateObj || Number.isNaN(dateObj.getTime())) return null;
    return new Intl.DateTimeFormat("ro-RO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(dateObj);
  };

  /* formatare nume utilizator din profilul auth_profiles */
  const formatProfileName = (profile) => profile?.porecla
    || [profile?.prenume, profile?.nume].filter(Boolean).join(" ").trim()
    || null;

  return {
    id: Number(row.id),
    internalId: row.internal_id || "—",
    type: typeLabels[row.tip] ? row.tip : "part",
    title: (titleParts[row.tip] || []).filter(Boolean).join(" ") || typeLabels[row.tip] || "Altă piesă",
    vin: row.vin || "",
    brand: row.marca || "",
    model: row.model || "",
    year: row.an_fabricatie ? String(row.an_fabricatie) : "",
    fuel: row.combustibil || "",
    engineCode: row.cod_motor || "",
    gearbox: [row.cod_cutie, row.tip_cutie].filter(Boolean).join(" · "),
    gearboxCode: row.cod_cutie || "",
    gearboxType: row.tip_cutie || "",
    partName: row.denumire_piesa || "",
    priceValue: Number.isFinite(numericPrice) ? numericPrice : 0,
    priceRaw: Number.isFinite(numericPrice) ? String(numericPrice) : "",
    price: Number.isFinite(numericPrice)
      ? new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 2 }).format(numericPrice)
      : "",
    location: row.locatie_depozit || "",
    status: statusLabels[row.status] ? row.status : "draft",
    createdAt: createdAt?.getTime() || 0,
    date: createdAt && !Number.isNaN(createdAt.getTime())
      ? new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "short", year: "numeric" }).format(createdAt)
      : "—",
    addedBy: creator?.porecla || [creator?.prenume, creator?.nume].filter(Boolean).join(" ") || "—",
    /* campuri audit minimal */
    auditCreatedBy: formatProfileName(creator),
    auditCreatedAt: formatAuditDate(createdAt),
    auditUpdatedBy: formatProfileName(updater),
    auditUpdatedAt: formatAuditDate(updatedAt),
    link: row.pieseauto_url || "",
    notes: row.observatii || "",
    thumb: emptyPhotoPlaceholder,
    photos: [],
    photosLoaded: false,
    photosLoading: false,
    photoError: "",
    listThumbnailFileId: "",
    listThumbnailObjectUrl: "",
    listThumbnailLoaded: false,
    listThumbnailLoading: false,
    primaryPhotoSaving: false,
    photoManagementBusy: false,
  };
}

/* transforma randurile foto in modelul galeriei desktop */
function mapDezmembrariPhoto(row) {
  return {
    id: Number(row.id),
    thumbnailFileId: row.thumbnail_file_id || "",
    thumbnailUrl: row.thumbnail_url || "",
    driveFileId: row.drive_file_id || "",
    driveFileUrl: row.drive_file_url || "",
    sortOrder: Number(row.sort_order) || 0,
    isPrimary: row.is_primary === true,
  };
}

/* preia fotografiile articolului selectat prin politicile RLS existente */
async function loadItemPhotos(itemId) {
  const item = dezmembrariItems.find((entry) => entry.id === itemId);
  if (!item || item.photosLoaded || item.photosLoading) return;

  item.photosLoading = true;
  item.photoError = "";
  renderDetail();

  const { data, error } = await supabaseClient
    .from("dezmembrari_photos")
    .select("id, thumbnail_file_id, thumbnail_url, drive_file_id, drive_file_url, sort_order, is_primary")
    .eq("item_id", itemId)
    .order("sort_order", { ascending: true });

  if (error) {
    item.photosLoading = false;
    item.photoError = error.message || "Fotografiile nu au putut fi încărcate.";
    throw error;
  }

  const photos = (data || []).map(mapDezmembrariPhoto);
  const thumbnailResults = await Promise.allSettled(
    photos.map((photo) => fetchCachedThumbnail(itemId, photo.thumbnailFileId)),
  );

  thumbnailResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      photos[index].thumbnailObjectUrl = result.value;
      return;
    }
    console.error(`Thumbnail Dezmembrări indisponibil pentru fotografia ${photos[index].id}:`, result.reason);
  });

  item.photos = photos;
  item.photosLoading = false;
  item.photosLoaded = true;
}

/* preia lista reala din public.dezmembrari_items */
async function loadDezmembrariItems(preferredItemId = null) {
  if (typeof supabaseClient === "undefined") {
    throw new Error("Clientul Supabase nu este disponibil.");
  }

  const { data, error } = await supabaseClient
    .from("dezmembrari_items")
    .select(`
      id, internal_id, tip, status, vin, marca, model, an_fabricatie,
      combustibil, cod_motor, cod_cutie, tip_cutie, denumire_piesa,
      pret, locatie_depozit, observatii, pieseauto_url, created_at, updated_at,
      creator:auth_profiles!dezmembrari_items_created_by_fkey(porecla, prenume, nume),
      updater:auth_profiles!dezmembrari_items_updated_by_fkey(porecla, prenume, nume)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  closePhotoLightbox();
  dezmembrariItems.forEach(revokeItemPhotoUrls);
  dezmembrariItems = (data || []).map(mapDezmembrariItem);
  const preferredItem = dezmembrariItems.find((item) => item.id === preferredItemId);
  dezState.selectedId = preferredItem?.id ?? dezmembrariItems[0]?.id ?? null;
}

/* starea locala pentru filtre si selectie */
const dezState = {
  selectedId: null,
  detailOpen: false,
  statusFilter: "all",
  typeFilter: "all",
  sortBy: "date",
  listSearch: "",
  isAdmin: false,
  permanentDeleteBusyId: null,
};

/* citeste rolul curent numai pentru afisarea actiunii Admin; Edge Function reverifica accesul */
async function loadCurrentAdminState() {
  dezState.isAdmin = false;
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData?.session?.user?.id;
  if (!userId) return;

  const { data: profile, error: profileError } = await supabaseClient
    .from("auth_profiles")
    .select("rol_id")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) {
    console.warn("Rolul Admin nu a putut fi verificat pentru acțiunea de ștergere definitivă.", profileError);
    return;
  }
  dezState.isAdmin = Number(profile?.rol_id) === 1;
}

/* starea lightbox-ului foto peste interfata HUB */
const photoLightboxState = {
  itemId: null,
  photoIds: [],
  index: 0,
  isNavigating: false,
  requestId: 0,
  returnFocus: null,
};

/* utilitare pentru afisare */
function statusClass(status) {
  return `dez-status-${status}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* incarca fotografia locala aplicand orientarea transmisa de browser */
async function decodeDesktopPhoto(file) {
  if ("createImageBitmap" in window) {
    try {
      return await window.createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (error) {
      console.warn("Decodarea ImageBitmap desktop a eșuat; se folosește alternativa Image.", error);
    }
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = sourceUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

/* redimensioneaza proportional fara a mari imaginile mai mici */
function drawDesktopPhotoToCanvas(image, maximumLongEdge) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.min(1, maximumLongEdge / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  canvas.getContext("2d", { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/* comprima JPEG-ul treptat pana la limita folosita si pe mobil */
async function compressDesktopCanvas(canvas, settings) {
  let quality = settings.startQuality;
  let blob = null;

  while (quality >= settings.minimumQuality - 0.001) {
    blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Browserul nu a putut comprima fotografia.");
    if (blob.size <= settings.targetMaxBytes) break;
    quality = Number((quality - settings.qualityStep).toFixed(2));
  }

  return blob;
}

/* pregateste imaginea principala si thumbnail-ul cu aceleasi reguli ca pe mobil */
async function processDesktopPhoto(file) {
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    throw new Error("Fișierul selectat nu este o imagine validă.");
  }

  const image = await decodeDesktopPhoto(file);
  try {
    let photoCanvas = drawDesktopPhotoToCanvas(image, DESKTOP_PHOTO_COMPRESSION.maxLongEdge);
    let compressedBlob = await compressDesktopCanvas(photoCanvas, DESKTOP_PHOTO_COMPRESSION);

    if (compressedBlob.size > DESKTOP_PHOTO_COMPRESSION.targetMaxBytes
      && Math.max(photoCanvas.width, photoCanvas.height) > DESKTOP_PHOTO_COMPRESSION.fallbackLongEdge) {
      photoCanvas.width = 1;
      photoCanvas.height = 1;
      photoCanvas = drawDesktopPhotoToCanvas(image, DESKTOP_PHOTO_COMPRESSION.fallbackLongEdge);
      compressedBlob = await compressDesktopCanvas(photoCanvas, DESKTOP_PHOTO_COMPRESSION);
    }

    const thumbnailCanvas = drawDesktopPhotoToCanvas(image, DESKTOP_THUMBNAIL_COMPRESSION.maxLongEdge);
    const thumbnailBlob = await compressDesktopCanvas(thumbnailCanvas, DESKTOP_THUMBNAIL_COMPRESSION);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "fotografie";
    const fileOptions = { type: "image/jpeg", lastModified: Date.now() };
    const result = {
      file: new File([compressedBlob], `${baseName}.jpg`, fileOptions),
      thumbnailFile: new File([thumbnailBlob], `${baseName}-thumb.jpg`, fileOptions),
      width: photoCanvas.width,
      height: photoCanvas.height,
    };

    photoCanvas.width = 1;
    photoCanvas.height = 1;
    thumbnailCanvas.width = 1;
    thumbnailCanvas.height = 1;
    return result;
  } finally {
    if (typeof image.close === "function") image.close();
  }
}

/* identifica obiectele R2 noi; identificatorii vechi continua prin Google Drive */
function isR2ObjectKey(fileId) {
  return R2_OBJECT_KEY_PATTERN.test(fileId);
}

/* apeleaza actiunile foto Edge numai cu sesiunea HUB activa */
async function callAuthenticatedPhotoAction(requestBody) {
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) throw sessionError;
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error("Sesiunea HUB nu mai este activă.");

  return fetch(`${SUPABASE_URL}/functions/v1/dezmembrari-photo-upload`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

/* extrage mesajul sigur returnat de actiunile foto Edge */
async function photoActionError(response) {
  let message = `Operația Edge nu a putut fi finalizată (${response.status}).`;
  try {
    const body = await response.json();
    message = body?.message || body?.error || message;
  } catch {
    // raspunsul fara JSON pastreaza mesajul generic sigur
  }
  return new Error(message);
}

/* trimite fisierele comprimate catre uploadul R2 autentificat */
async function uploadDesktopPhotoToR2(item, photo, sortOrder, isPrimary) {
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) throw sessionError;
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error("Sesiunea HUB nu mai este activă.");

  const formData = new FormData();
  formData.append("item_id", String(item.id));
  formData.append("internal_id", item.internalId);
  formData.append("compressed_image", photo.file, photo.file.name);
  formData.append("thumbnail", photo.thumbnailFile, photo.thumbnailFile.name);
  formData.append("sort_order", String(sortOrder));
  formData.append("is_primary", String(isPrimary));
  formData.append("require_r2", "true");

  const response = await fetch(`${SUPABASE_URL}/functions/v1/dezmembrari-photo-upload`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: formData,
  });
  if (!response.ok) throw await photoActionError(response);

  const uploaded = await response.json();
  if (uploaded?.storage_provider !== "r2" || !uploaded?.main?.key || !uploaded?.thumbnail?.key) {
    throw new Error("Funcția Edge nu a confirmat încărcarea ambelor obiecte în R2.");
  }
  return uploaded;
}

/* salveaza randul foto nou fara a inlocui pozitiile deja existente */
async function insertDesktopPhotoMetadata(item, photo, uploaded, sortOrder, isPrimary) {
  const photoRow = {
    item_id: item.id,
    drive_file_id: uploaded.main.key,
    drive_file_url: uploaded.main.url,
    thumbnail_file_id: uploaded.thumbnail.key,
    thumbnail_url: uploaded.thumbnail.url,
    mime_type: uploaded.main.mime_type || photo.file.type,
    file_size_bytes: uploaded.main.size_bytes || photo.file.size,
    width: photo.width,
    height: photo.height,
    sort_order: sortOrder,
    is_primary: isPrimary,
  };

  const { data, error } = await supabaseClient
    .from("dezmembrari_photos")
    .insert(photoRow)
    .select("id, thumbnail_file_id, thumbnail_url, drive_file_id, drive_file_url, sort_order, is_primary")
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) throw new Error("Metadatele fotografiei nu au fost confirmate în HUB.");
  return mapDezmembrariPhoto(data);
}

/* citeste ultima pozitie salvata pentru a evita reutilizarea unei chei existente */
async function loadNextDesktopPhotoSortOrder(item) {
  const { data, error } = await supabaseClient
    .from("dezmembrari_photos")
    .select("sort_order")
    .eq("item_id", item.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data === null) return 0;
  const lastSortOrder = Number(data.sort_order);
  if (!Number.isInteger(lastSortOrder) || lastSortOrder < 0) {
    throw new Error("Ultima poziție foto din HUB nu este validă.");
  }
  return lastSortOrder + 1;
}

/* adauga secvential fotografiile selectate la finalul galeriei curente */
async function addDesktopPhotos(item, selectedFiles) {
  if (item.photoManagementBusy || !selectedFiles.length) return;

  item.photoManagementBusy = true;
  renderDetail();
  let nextAvailableSortOrder;
  try {
    nextAvailableSortOrder = await loadNextDesktopPhotoSortOrder(item);
  } catch (error) {
    console.error("Poziția următoarei fotografii nu a putut fi citită:", error);
    window.alert(`Fotografiile nu pot fi adăugate: ${error?.message || "poziția următoare este indisponibilă."}`);
    item.photoManagementBusy = false;
    render();
    return;
  }
  const availableSlots = Math.max(0, DESKTOP_PHOTO_MAXIMUM - nextAvailableSortOrder);
  const files = selectedFiles.slice(0, Math.max(0, availableSlots));
  if (!files.length) {
    window.alert(`Galeria poate conține maximum ${DESKTOP_PHOTO_MAXIMUM} fotografii.`);
    item.photoManagementBusy = false;
    render();
    return;
  }
  if (selectedFiles.length > files.length) {
    window.alert(`Vor fi adăugate numai ${files.length} fotografii, până la limita de ${DESKTOP_PHOTO_MAXIMUM}.`);
  }

  let nextSortOrder = nextAvailableSortOrder;
  let uploadedCount = 0;

  try {
    for (const sourceFile of files) {
      const processedPhoto = await processDesktopPhoto(sourceFile);
      const isPrimary = item.photos.length === 0;
      const uploaded = await uploadDesktopPhotoToR2(item, processedPhoto, nextSortOrder, isPrimary);
      const savedPhoto = await insertDesktopPhotoMetadata(
        item,
        processedPhoto,
        uploaded,
        nextSortOrder,
        isPrimary,
      );
      try {
        savedPhoto.thumbnailObjectUrl = await fetchCachedThumbnail(item.id, savedPhoto.thumbnailFileId);
      } catch (thumbnailError) {
        console.error(`Thumbnail indisponibil după upload pentru fotografia ${savedPhoto.id}:`, thumbnailError);
      }
      item.photos.push(savedPhoto);
      item.photos.sort((first, second) => first.sortOrder - second.sortOrder);
      if (isPrimary) {
        item.listThumbnailFileId = savedPhoto.thumbnailFileId;
        item.listThumbnailObjectUrl = savedPhoto.thumbnailObjectUrl;
        item.listThumbnailLoaded = true;
      }
      uploadedCount += 1;
      nextSortOrder += 1;
      render();
    }
  } catch (error) {
    console.error("Adăugare fotografii desktop Dezmembrări:", error);
    window.alert(`${uploadedCount} din ${files.length} fotografii au fost adăugate. ${
      error?.message || "Încărcarea nu a putut continua."
    }`);
  } finally {
    item.photoManagementBusy = false;
    render();
  }
}

/* solicita URL-ul GET semnat numai dupa autorizarea cheii R2 in Edge */
async function requestR2SignedUrl(itemId, objectKey) {
  const response = await callAuthenticatedPhotoAction({
    action: "get_r2_signed_url",
    item_id: itemId,
    object_key: objectKey,
  });

  if (!response.ok) throw await photoActionError(response);
  const body = await response.json();
  const expiresAt = Date.parse(body?.expires_at || "");
  if (typeof body?.url !== "string" || !body.url.startsWith("https://") || !Number.isFinite(expiresAt)) {
    throw new Error("Funcția Edge nu a returnat un URL R2 semnat valid.");
  }

  return { url: body.url, expiresAt };
}

/* refoloseste URL-ul R2 semnat pana cu 30 de secunde inainte de expirare */
function fetchCachedR2SignedUrl(itemId, objectKey) {
  const cacheKey = `${itemId}:${objectKey}`;
  const cached = r2SignedUrlCache.get(cacheKey);
  if (cached?.url && cached.expiresAt - R2_SIGNED_URL_REFRESH_MARGIN_MS > Date.now()) {
    return Promise.resolve(cached.url);
  }
  if (cached?.request) return cached.request;

  const request = requestR2SignedUrl(itemId, objectKey)
    .then(({ url, expiresAt }) => {
      r2SignedUrlCache.set(cacheKey, { url, expiresAt });
      return url;
    })
    .catch((error) => {
      r2SignedUrlCache.delete(cacheKey);
      throw error;
    });
  r2SignedUrlCache.set(cacheKey, { request });
  return request;
}

/* foloseste URL semnat pentru R2 si proxy blob numai pentru Drive vechi */
async function fetchPrivatePhotoImage(itemId, fileId) {
  if (!fileId) throw new Error("Identificatorul imaginii lipsește.");
  if (isR2ObjectKey(fileId)) return fetchCachedR2SignedUrl(itemId, fileId);

  const response = await callAuthenticatedPhotoAction({ action: "view_file", item_id: itemId, file_id: fileId });
  if (!response.ok) {
    throw await photoActionError(response);
  }

  const imageBlob = await response.blob();
  if (!imageBlob.type.startsWith("image/")) {
    throw new Error("Funcția Edge nu a returnat o imagine validă.");
  }

  return URL.createObjectURL(imageBlob);
}

/* porneste pe rand maximum trei cereri private pentru thumbnail-uri */
function pumpThumbnailRequests() {
  while (activeThumbnailRequests < LIST_THUMBNAIL_CONCURRENCY && thumbnailRequestQueue.length > 0) {
    const request = thumbnailRequestQueue.shift();
    activeThumbnailRequests += 1;
    Promise.resolve()
      .then(request.task)
      .then(request.resolve, request.reject)
      .finally(() => {
        activeThumbnailRequests -= 1;
        pumpThumbnailRequests();
      });
  }
}

/* adauga o cerere Edge Function in coada limitata */
function runLimitedThumbnailRequest(task) {
  return new Promise((resolve, reject) => {
    thumbnailRequestQueue.push({ task, resolve, reject });
    pumpThumbnailRequests();
  });
}

/* refoloseste acelasi URL Blob pentru acelasi fisier thumbnail privat */
function fetchCachedThumbnail(itemId, fileId) {
  if (!fileId) return Promise.reject(new Error("Identificatorul thumbnail-ului lipsește."));
  if (isR2ObjectKey(fileId)) {
    return runLimitedThumbnailRequest(() => fetchPrivatePhotoImage(itemId, fileId));
  }

  const cacheKey = `${itemId}:${fileId}`;
  const cachedRequest = thumbnailObjectUrlCache.get(cacheKey);
  if (cachedRequest) return cachedRequest;

  const thumbnailRequest = runLimitedThumbnailRequest(() => fetchPrivatePhotoImage(itemId, fileId))
    .catch((error) => {
      thumbnailObjectUrlCache.delete(cacheKey);
      throw error;
    });
  thumbnailObjectUrlCache.set(cacheKey, thumbnailRequest);
  return thumbnailRequest;
}

/* elibereaza numai imaginile complete; thumbnail-urile sunt gestionate de cache */
function revokeItemPhotoUrls(item) {
  item?.photos?.forEach((photo) => {
    if (photo.fullObjectUrl?.startsWith("blob:")) URL.revokeObjectURL(photo.fullObjectUrl);
  });
}

/* returneaza thumbnail-ul privat temporar incarcat prin functia Edge */
function privateThumbnailSource(photo) {
  return photo?.thumbnailObjectUrl || "";
}

function selectedItem() {
  return dezmembrariItems.find((item) => item.id === dezState.selectedId) || dezmembrariItems[0] || null;
}

/* alege fotografia principala sau prima fotografie disponibila */
function primaryPhoto(item) {
  return item.photos?.find((photo) => photo.isPrimary) || item.photos?.[0] || null;
}

/* salveaza in Supabase o singura fotografie principala pentru articol */
async function persistPrimaryPhoto(item, photoId) {
  if (item.primaryPhotoSaving) return;

  const selectedPhoto = item.photos.find((photo) => photo.id === photoId);
  const previousPrimary = item.photos.find((photo) => photo.isPrimary) || null;
  if (!selectedPhoto || previousPrimary?.id === photoId) return;

  item.primaryPhotoSaving = true;
  renderDetail();

  try {
    const { data: clearedPhotos, error: clearError } = await supabaseClient
      .from("dezmembrari_photos")
      .update({ is_primary: false })
      .eq("item_id", item.id)
      .neq("id", photoId)
      .select("id");

    if (clearError) throw clearError;
    if ((clearedPhotos || []).length !== item.photos.length - 1) {
      throw new Error("Nu au putut fi actualizate toate fotografiile articolului.");
    }

    const { data: persistedPhoto, error: selectError } = await supabaseClient
      .from("dezmembrari_photos")
      .update({ is_primary: true })
      .eq("item_id", item.id)
      .eq("id", photoId)
      .select("id, is_primary")
      .maybeSingle();

    if (selectError) throw selectError;
    if (!persistedPhoto?.is_primary || Number(persistedPhoto.id) !== photoId) {
      throw new Error("Fotografia selectată nu a putut fi confirmată în baza de date.");
    }

    const { data: primaryRows, error: verifyError } = await supabaseClient
      .from("dezmembrari_photos")
      .select("id")
      .eq("item_id", item.id)
      .eq("is_primary", true);

    if (verifyError) throw verifyError;
    if (primaryRows?.length !== 1 || Number(primaryRows[0].id) !== photoId) {
      throw new Error("Baza de date nu confirmă o singură fotografie principală.");
    }

    item.photos.forEach((photo) => {
      photo.isPrimary = photo.id === photoId;
    });
    item.listThumbnailFileId = selectedPhoto.thumbnailFileId;
    item.listThumbnailObjectUrl = privateThumbnailSource(selectedPhoto);
    item.listThumbnailLoaded = Boolean(item.listThumbnailObjectUrl);

  } catch (error) {
    /* normalizeaza si restaureaza selectia anterioara daca schimbarea ramane incompleta */
    const { error: rollbackClearError } = await supabaseClient
      .from("dezmembrari_photos")
      .update({ is_primary: false })
      .eq("item_id", item.id);

    if (!rollbackClearError && previousPrimary) {
      const { error: restoreError } = await supabaseClient
        .from("dezmembrari_photos")
        .update({ is_primary: true })
        .eq("item_id", item.id)
        .eq("id", previousPrimary.id);
      if (restoreError) console.error("Restaurarea fotografiei principale a eșuat:", restoreError);
    } else if (rollbackClearError) {
      console.error("Normalizarea fotografiilor principale a eșuat:", rollbackClearError);
    }
    throw error;
  } finally {
    item.primaryPhotoSaving = false;
  }
}

/* elimina URL-urile semnate ale unei fotografii sterse din cache-ul local */
function clearDeletedPhotoCaches(item, photo) {
  [photo.driveFileId, photo.thumbnailFileId].forEach((objectKey) => {
    if (objectKey) r2SignedUrlCache.delete(`${item.id}:${objectKey}`);
  });
  if (photo.fullObjectUrl?.startsWith("blob:")) URL.revokeObjectURL(photo.fullObjectUrl);
}

/* sterge ambele obiecte R2 numai prin actiunea Edge autorizata */
async function deleteDesktopPhotoObjects(item, photo) {
  const response = await callAuthenticatedPhotoAction({
    action: "delete_r2_photo",
    item_id: item.id,
    photo_id: photo.id,
  });
  if (!response.ok) throw await photoActionError(response);

  const result = await response.json();
  if (result?.deleted !== true) throw new Error("Funcția Edge nu a confirmat ștergerea obiectelor R2.");
}

/* sterge randul foto numai dupa confirmarea stergerii obiectelor din R2 */
async function deleteDesktopPhotoRow(item, photo) {
  const { data, error } = await supabaseClient
    .from("dezmembrari_photos")
    .delete()
    .eq("item_id", item.id)
    .eq("id", photo.id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (Number(data?.id) !== photo.id) {
    throw new Error("Rândul fotografiei nu a fost confirmat ca șters din HUB.");
  }
}

/* gestioneaza stergerea completa si mutarea selectiei principale */
async function deleteDesktopPhoto(item, photo) {
  if (item.photoManagementBusy || item.primaryPhotoSaving) return;
  if (!isR2ObjectKey(photo.driveFileId) || !isR2ObjectKey(photo.thumbnailFileId)) {
    window.alert("Aceasta este o fotografie Google Drive veche. Ștergerea ei necesită curățare separată și nu a fost efectuată.");
    return;
  }
  if (!window.confirm("Ștergi fotografia? Imaginea principală și thumbnail-ul vor fi eliminate definitiv din R2.")) return;

  item.photoManagementBusy = true;
  renderDetail();
  try {
    const remainingPhotos = item.photos
      .filter((entry) => entry.id !== photo.id)
      .sort((first, second) => first.sortOrder - second.sortOrder);

    /* fotografia urmatoare devine principala inaintea stergerii celei curente */
    if (photo.isPrimary && remainingPhotos.length > 0) {
      await persistPrimaryPhoto(item, remainingPhotos[0].id);
    }

    await deleteDesktopPhotoObjects(item, photo);
    await deleteDesktopPhotoRow(item, photo);
    if (photoLightboxState.itemId === item.id) closePhotoLightbox();
    clearDeletedPhotoCaches(item, photo);
    item.photos = remainingPhotos;

    if (!item.photos.length) {
      item.listThumbnailFileId = "";
      item.listThumbnailObjectUrl = "";
      item.listThumbnailLoaded = true;
    }
  } catch (error) {
    console.error("Ștergere fotografie desktop Dezmembrări:", error);
    window.alert(`Fotografia nu a putut fi ștearsă complet: ${error?.message || "Eroare necunoscută."}`);
  } finally {
    item.photoManagementBusy = false;
    render();
  }
}

/* alege thumbnail-ul incarcat pentru rand fara a cere imaginea completa */
function listThumbnailSource(item) {
  return privateThumbnailSource(primaryPhoto(item)) || item.listThumbnailObjectUrl || "";
}

/* genereaza imaginea mica pastrand designul actual al listei */
function listThumbnailMarkup(item) {
  const thumbnailUrl = listThumbnailSource(item);
  return thumbnailUrl
    ? `<img src="${escapeHtml(thumbnailUrl)}" alt="Fotografia principală ${escapeHtml(item.internalId)}" loading="lazy">`
    : "";
}

/* incarca numai metadatele fotografiei principale sau primei fotografii */
async function loadListThumbnail(item) {
  const loadedPhoto = primaryPhoto(item);
  const loadedSource = privateThumbnailSource(loadedPhoto);
  if (loadedSource) {
    item.listThumbnailFileId = loadedPhoto.thumbnailFileId;
    item.listThumbnailObjectUrl = loadedSource;
    return;
  }

  const { data, error } = await supabaseClient
    .from("dezmembrari_photos")
    .select("thumbnail_file_id, is_primary, sort_order")
    .eq("item_id", item.id)
    .order("is_primary", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.thumbnail_file_id) return;

  item.listThumbnailFileId = data.thumbnail_file_id;
  item.listThumbnailObjectUrl = await fetchCachedThumbnail(item.id, data.thumbnail_file_id);
}

/* actualizeaza numai celula thumbnail dupa terminarea cererii */
function updateListThumbnailElement(item) {
  const thumbnail = document.querySelector(`.dez-item-row[data-id="${item.id}"] .dez-thumb`);
  if (thumbnail) thumbnail.innerHTML = listThumbnailMarkup(item);
}

/* ruleaza coada de randuri vizibile fara a supraincarca reteaua */
function pumpListThumbnailQueue() {
  while (activeListThumbnailLoads < LIST_THUMBNAIL_CONCURRENCY && listThumbnailQueue.length > 0) {
    const item = listThumbnailQueue.shift();
    activeListThumbnailLoads += 1;
    loadListThumbnail(item)
      .then(() => updateListThumbnailElement(item))
      .catch((error) => {
        console.error(`Thumbnail listă indisponibil pentru ${item.internalId}:`, error);
      })
      .finally(() => {
        item.listThumbnailLoading = false;
        item.listThumbnailLoaded = true;
        activeListThumbnailLoads -= 1;
        pumpListThumbnailQueue();
      });
  }
}

/* adauga automat in coada articolele afisate care nu au thumbnail */
function queueVisibleListThumbnails(items) {
  items.forEach((item) => {
    if (item.listThumbnailLoaded || item.listThumbnailLoading || listThumbnailSource(item)) return;
    item.listThumbnailLoading = true;
    listThumbnailQueue.push(item);
  });
  pumpListThumbnailQueue();
}

/* returneaza elementele principale ale lightbox-ului */
function photoLightboxElements() {
  const overlay = document.querySelector("#dezPhotoLightbox");
  return {
    overlay,
    link: overlay?.querySelector("#dezLightboxLink"),
    image: overlay?.querySelector("#dezLightboxImage"),
    counter: overlay?.querySelector("#dezLightboxCounter"),
    previous: overlay?.querySelector("#dezLightboxPrevious"),
    next: overlay?.querySelector("#dezLightboxNext"),
    close: overlay?.querySelector("#dezLightboxClose"),
  };
}

/* obtine o singura data URL-ul autentificat al imaginii complete */
async function ensureFullPhotoUrl(item, photo) {
  if (!photo.fullObjectUrl || isR2ObjectKey(photo.driveFileId)) {
    photo.fullObjectUrl = await fetchPrivatePhotoImage(item.id, photo.driveFileId);
  }
  return photo.fullObjectUrl;
}

/* afiseaza direct imaginea completa in zona fixa a lightbox-ului */
function renderPhotoLightbox() {
  const elements = photoLightboxElements();
  const item = dezmembrariItems.find((entry) => entry.id === photoLightboxState.itemId);
  const photoId = photoLightboxState.photoIds[photoLightboxState.index];
  const photo = item?.photos.find((entry) => entry.id === photoId);
  if (!elements.overlay?.classList.contains("is-open") || !item || !photo?.fullObjectUrl) return;

  elements.link.href = photo.fullObjectUrl;
  elements.image.src = photo.fullObjectUrl;
  elements.image.alt = `Fotografia ${photoLightboxState.index + 1} pentru ${item.internalId}`;
  elements.counter.textContent = `${photoLightboxState.index + 1} / ${photoLightboxState.photoIds.length}`;
  elements.previous.disabled = photoLightboxState.photoIds.length < 2 || photoLightboxState.isNavigating;
  elements.next.disabled = photoLightboxState.photoIds.length < 2 || photoLightboxState.isNavigating;
}

/* deschide lightbox-ul numai dupa ce imaginea completa este disponibila */
async function openPhotoLightbox(item, photoId, trigger) {
  const mainPhoto = primaryPhoto(item);
  const orderedPhotos = [mainPhoto, ...item.photos.filter((photo) => photo.id !== mainPhoto.id)];
  const selectedIndex = orderedPhotos.findIndex((photo) => photo.id === photoId);
  const selectedPhoto = orderedPhotos[selectedIndex];
  const elements = photoLightboxElements();
  if (!elements.overlay || selectedIndex < 0 || !selectedPhoto) return;

  try {
    await ensureFullPhotoUrl(item, selectedPhoto);
  } catch (error) {
    console.error("Eroare la încărcarea fotografiei complete:", error);
    window.alert(error?.message || "Fotografia completă nu a putut fi deschisă.");
    return;
  }

  photoLightboxState.itemId = item.id;
  photoLightboxState.photoIds = orderedPhotos.map((photo) => photo.id);
  photoLightboxState.index = selectedIndex;
  photoLightboxState.isNavigating = false;
  photoLightboxState.requestId += 1;
  photoLightboxState.returnFocus = trigger || document.activeElement;
  elements.overlay.inert = false;
  elements.overlay.classList.add("is-open");
  elements.overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("dez-lightbox-open");
  elements.close.focus();
  renderPhotoLightbox();
}

/* inchide lightbox-ul si revine la controlul initial */
function closePhotoLightbox() {
  const elements = photoLightboxElements();
  if (!elements.overlay?.classList.contains("is-open")) return;

  photoLightboxState.requestId += 1;
  photoLightboxState.isNavigating = false;

  /* muta focusul in afara dialogului inainte de aplicarea aria-hidden */
  const returnFocus = photoLightboxState.returnFocus;
  if (returnFocus?.isConnected && typeof returnFocus.focus === "function") {
    returnFocus.focus({ preventScroll: true });
  }
  if (elements.overlay.contains(document.activeElement)) {
    const fallbackFocus = document.querySelector("#backBtn");
    fallbackFocus?.focus({ preventScroll: true });
  }
  if (elements.overlay.contains(document.activeElement)) document.activeElement.blur();

  elements.overlay.classList.remove("is-open");
  elements.overlay.inert = true;
  elements.overlay.setAttribute("aria-hidden", "true");
  elements.link.removeAttribute("href");
  elements.image.removeAttribute("src");
  document.body.classList.remove("dez-lightbox-open");
  photoLightboxState.itemId = null;
  photoLightboxState.photoIds = [];
  photoLightboxState.returnFocus = null;
}

/* incarca urmatoarea imagine inainte de schimbarea cadrului */
async function navigatePhotoLightbox(direction) {
  const total = photoLightboxState.photoIds.length;
  if (!total || photoLightboxState.isNavigating) return;

  const targetIndex = (photoLightboxState.index + direction + total) % total;
  const item = dezmembrariItems.find((entry) => entry.id === photoLightboxState.itemId);
  const photo = item?.photos.find((entry) => entry.id === photoLightboxState.photoIds[targetIndex]);
  if (!item || !photo) return;

  const requestId = ++photoLightboxState.requestId;
  photoLightboxState.isNavigating = true;
  renderPhotoLightbox();
  try {
    await ensureFullPhotoUrl(item, photo);
    if (requestId !== photoLightboxState.requestId
      || photoLightboxState.itemId !== item.id
      || !photoLightboxElements().overlay?.classList.contains("is-open")) return;
    photoLightboxState.index = targetIndex;
  } catch (error) {
    console.error("Eroare la schimbarea fotografiei complete:", error);
    window.alert(error?.message || "Fotografia următoare nu a putut fi încărcată.");
  } finally {
    if (requestId === photoLightboxState.requestId) {
      photoLightboxState.isNavigating = false;
      renderPhotoLightbox();
    }
  }
}

function itemIdentityMeta(item) {
  if (item.vin) return `${item.type === "car" ? "VIN" : "VIN sursă"}: ${item.vin}`;
  if (item.type === "engine" && item.engineCode) return `Cod motor: ${item.engineCode}`;
  if (item.type === "gearbox" && item.gearboxCode) return `Cod cutie: ${item.gearboxCode}`;
  return item.type === "car" ? "VIN necompletat" : "VIN sursă necompletat";
}

function itemTechnicalMeta(item) {
  const detailsByType = {
    car: [item.fuel, item.year],
    engine: [item.fuel, item.year],
    gearbox: [item.gearboxType, item.year],
    part: [item.brand, item.model, item.year],
  };
  return (detailsByType[item.type] || []).filter(Boolean).join(" · ") || "—";
}

function searchableText(item) {
  return [
    item.internalId,
    item.addedBy,
    item.title,
    item.vin,
    item.brand,
    item.model,
    item.year,
    item.fuel,
    item.engineCode,
    item.gearbox,
    item.location,
    item.notes,
    item.link,
    typeLabels[item.type],
    statusLabels[item.status],
  ].join(" ").toLowerCase();
}

function visibleItems() {
  const query = dezState.listSearch.trim().toLowerCase();
  const items = dezmembrariItems.filter((item) => {
    const statusOk = dezState.statusFilter === "all" || item.status === dezState.statusFilter;
    const typeOk = dezState.typeFilter === "all" || item.type === dezState.typeFilter;
    const searchOk = !query || searchableText(item).includes(query);
    return statusOk && typeOk && searchOk;
  });

  return items.sort((a, b) => {
    if (dezState.sortBy === "price") return b.priceValue - a.priceValue;
    if (dezState.sortBy === "name") return a.title.localeCompare(b.title, "ro");
    return b.createdAt - a.createdAt;
  });
}

/* randarea filtrelor de status */
function renderFilterCounts() {
  const counts = dezmembrariItems.reduce((acc, item) => {
    acc.all += 1;
    acc[item.status] += 1;
    return acc;
  }, { all: 0, draft: 0, ready: 0, published: 0, sold: 0, archived: 0 });

  document.querySelectorAll(".dez-filter").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === dezState.statusFilter);
    const badge = button.querySelector("b");
    if (badge) badge.textContent = counts[button.dataset.filter] || 0;
  });

  const statusSelect = document.querySelector("#statusFilterSelect");
  if (statusSelect) statusSelect.value = dezState.statusFilter;
}

/* randarea listei dense din stanga */
function renderList() {
  const list = document.querySelector("#itemList");
  const items = visibleItems();

  if (!items.length) {
    list.innerHTML = '<div class="dez-empty"><div><strong>Nicio piesă găsită</strong><span>Schimbă filtrul sau caută alt termen.</span></div></div>';
    document.querySelector("#listFoot").textContent = `Afișezi 0 din ${dezmembrariItems.length} rezultate`;
    return;
  }

  list.innerHTML = items.map((item) => `
    <article class="dez-item-row ${item.id === dezState.selectedId ? "selected" : ""}" data-id="${item.id}">
      <div class="dez-thumb">
        ${listThumbnailMarkup(item)}
      </div>
      <div>
        <div class="dez-info-main">
          <span class="dez-type">${typeLabels[item.type]}</span>
          <span class="dez-internal-id">${escapeHtml(item.internalId)}</span>
          <strong title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</strong>
        </div>
        <span class="dez-meta" title="${escapeHtml(itemIdentityMeta(item))}">${escapeHtml(itemIdentityMeta(item))}</span>
        <span class="dez-meta" title="${escapeHtml(itemTechnicalMeta(item))}">${escapeHtml(itemTechnicalMeta(item))}</span>
      </div>
      <div class="dez-price">${item.price ? `${item.price} €` : "—"}</div>
      <div><span class="dez-status ${statusClass(item.status)}">${statusLabels[item.status]}</span></div>
      <div class="dez-date-cell">
        <span class="dez-date">${item.date}</span>
        <span class="dez-added-by" title="adăugat de ${escapeHtml(item.addedBy)}">adăugat de ${escapeHtml(item.addedBy)}</span>
      </div>
      <button class="dez-more" type="button" aria-label="Mai multe">...</button>
    </article>
  `).join("");

  document.querySelector("#listFoot").textContent = `Afișezi 1 - ${items.length} din ${dezmembrariItems.length} rezultate`;
  queueVisibleListThumbnails(items);
  document.querySelectorAll(".dez-item-row").forEach((row) => {
    row.addEventListener("click", async () => {
      dezState.selectedId = Number(row.dataset.id);
      if (detailDrawerMedia.matches) dezState.detailOpen = true;
      render();

      try {
        await loadItemPhotos(dezState.selectedId);
      } catch (error) {
        console.error("Eroare la încărcarea fotografiilor Dezmembrări:", error);
      }
      render();
    });
  });
}

/* campuri compacte pentru panoul de detalii */
function field(label, value, options = {}) {
  const {
    full = false,
    type = "input",
    id = "",
    isVin = false,
    selectOptions = statusLabels,
    inputMode = "",
    fieldName = "",
  } = options;
  const classes = `dez-field ${full ? "dez-field-full" : ""}`;
  const safeValue = escapeHtml(value);
  const fieldAttribute = fieldName ? `data-field="${fieldName}"` : "";
  if (type === "textarea") {
    return `
      <label class="${classes}" ${fieldAttribute}>
        <span>${label}</span>
        <textarea class="dez-control" id="${id}">${safeValue}</textarea>
        <div class="dez-counter">${String(value).length}/1000</div>
      </label>
    `;
  }

  if (type === "select") {
    return `
      <label class="${classes}" ${fieldAttribute}>
        <span>${label}</span>
        <select class="dez-control" id="${id}">
          ${Object.entries(selectOptions).map(([key, text]) => `<option value="${key}" ${key === value ? "selected" : ""}>${text}</option>`).join("")}
        </select>
      </label>
    `;
  }

  const control = `<input class="dez-control" id="${id}" value="${safeValue}" ${inputMode ? `inputmode="${inputMode}"` : ""}>`;
  return `
    <label class="${classes}" ${fieldAttribute}>
      <span>${label}</span>
      ${isVin ? `<div class="dez-control-wrap">${control}<button class="dez-copy-btn" id="copyVinBtn" type="button">Copiază VIN</button></div>` : control}
    </label>
  `;
}

/* afiseaza numai campurile relevante tipului selectat */
function updateDesktopDynamicFields(form, itemType) {
  const visibleFields = new Set(fieldsByItemType[itemType] || fieldsByItemType.part);
  form.querySelectorAll("[data-field]").forEach((fieldElement) => {
    fieldElement.hidden = !visibleFields.has(fieldElement.dataset.field);
  });

  const vinLabel = form.querySelector('[data-field="vin"] > span');
  if (vinLabel) vinLabel.textContent = itemType === "car" ? "VIN / Serie caroserie" : "VIN vehicul sursă";

  const partNameInput = form.querySelector("#partNameInput");
  if (partNameInput) partNameInput.required = itemType === "part";
}

/* pregateste valorile editabile pentru actualizarea randului selectat */
function buildUpdatePayload(form) {
  const valueOrNull = (selector) => form.querySelector(selector).value.trim() || null;
  const itemType = form.querySelector("#typeSelect").value;
  const visibleFields = new Set(fieldsByItemType[itemType] || fieldsByItemType.part);
  const fieldValue = (fieldName, selector) => visibleFields.has(fieldName) ? valueOrNull(selector) : null;
  const yearValue = valueOrNull("#yearInput");
  const priceValue = valueOrNull("#priceInput");
  const normalizedPrice = priceValue?.replace(",", ".") ?? null;

  if (itemType === "part" && !valueOrNull("#partNameInput")) {
    throw new Error("Denumirea piesei este obligatorie pentru tipul Altă piesă.");
  }

  if (yearValue !== null && !/^\d{4}$/.test(yearValue)) {
    throw new Error("Anul fabricației trebuie să conțină 4 cifre.");
  }
  if (normalizedPrice !== null && (!Number.isFinite(Number(normalizedPrice)) || Number(normalizedPrice) < 0)) {
    throw new Error("Prețul trebuie să fie un număr valid, mai mare sau egal cu zero.");
  }

  return {
    tip: itemType,
    status: form.querySelector("#statusSelect").value,
    vin: fieldValue("vin", "#vinInput"),
    marca: fieldValue("brand", "#brandInput"),
    model: fieldValue("model", "#modelInput"),
    an_fabricatie: visibleFields.has("year") && yearValue !== null ? Number(yearValue) : null,
    combustibil: fieldValue("fuel", "#fuelInput"),
    cod_motor: fieldValue("engineCode", "#engineCodeInput"),
    cod_cutie: fieldValue("gearboxCode", "#gearboxCodeInput"),
    tip_cutie: fieldValue("gearboxType", "#gearboxTypeInput"),
    denumire_piesa: fieldValue("partName", "#partNameInput"),
    pret: visibleFields.has("price") && normalizedPrice !== null ? Number(normalizedPrice) : null,
    locatie_depozit: fieldValue("location", "#locationInput"),
    observatii: fieldValue("notes", "#notesInput"),
    pieseauto_url: fieldValue("link", "#pieseautoUrlInput"),
  };
}

/* salveaza modificarile si reincarca acelasi articol din Supabase */
async function saveSelectedItem() {
  const item = selectedItem();
  const pane = document.querySelector("#detailPane");
  const form = pane.querySelector("#detailForm");
  const saveButton = pane.querySelector("#saveItemBtn");
  if (!item || !form || !saveButton) return;

  saveButton.disabled = true;
  saveButton.textContent = "Se salvează...";

  try {
    /* preia userul curent pentru audit (updated_by) */
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;
    const currentUserId = sessionData?.session?.user?.id || null;

    const payload = buildUpdatePayload(form);
    /* adauga campuri de audit minimal: ultima modificare */
    payload.updated_at = new Date().toISOString();
    if (currentUserId) payload.updated_by = currentUserId;

    const { data, error } = await supabaseClient
      .from("dezmembrari_items")
      .update(payload)
      .eq("id", item.id)
      .eq("internal_id", item.internalId)
      .select("id, internal_id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Articolul nu a fost actualizat. Verifică permisiunile contului.");

    await loadDezmembrariItems(item.id);
    try {
      await loadItemPhotos(item.id);
    } catch (photoError) {
      console.error("Eroare la reîncărcarea fotografiilor Dezmembrări:", photoError);
    }
    render();
    const refreshedButton = document.querySelector("#saveItemBtn");
    if (refreshedButton) refreshedButton.textContent = "Salvat cu succes";
    window.setTimeout(() => {
      const currentButton = document.querySelector("#saveItemBtn");
      if (currentButton) currentButton.textContent = "Salvează";
    }, 2500);
  } catch (error) {
    console.error("Eroare completă la salvarea dezmembrării:", error);
    saveButton.disabled = false;
    saveButton.textContent = "Salvare eșuată";
    window.alert(`Salvarea nu a reușit: ${error?.message || "Eroare necunoscută."}`);
    window.setTimeout(() => {
      if (saveButton.isConnected) saveButton.textContent = "Salvează";
    }, 2500);
  }
}

/* elimina cache-urile locale ale articolului dupa stergerea definitiva */
function clearPermanentlyDeletedItemCaches(item) {
  revokeItemPhotoUrls(item);
  const cachePrefix = `${item.id}:`;
  [...r2SignedUrlCache.keys()].forEach((key) => {
    if (key.startsWith(cachePrefix)) r2SignedUrlCache.delete(key);
  });
  [...thumbnailObjectUrlCache.entries()].forEach(([key, request]) => {
    if (!key.startsWith(cachePrefix)) return;
    request.then((url) => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    }).catch(() => {});
    thumbnailObjectUrlCache.delete(key);
  });
}

/* sterge definitiv numai un articol arhivat, dupa confirmare dubla cu ID-ul DZ */
async function permanentlyDeleteArchivedItem(item) {
  if (!dezState.isAdmin || item.status !== "archived" || dezState.permanentDeleteBusyId !== null) return;

  const warning = `Ștergi DEFINITIV ${item.internalId}?\n\n`
    + "Toate fotografiile R2 și articolul vor fi eliminate permanent. Operația nu poate fi anulată.";
  if (!window.confirm(warning)) return;

  const typedInternalId = window.prompt(`Pentru confirmare, scrie exact ${item.internalId}:`, "");
  if (typedInternalId === null) return;
  if (typedInternalId.trim().toUpperCase() !== item.internalId) {
    window.alert("ID-ul introdus nu corespunde. Articolul nu a fost șters.");
    return;
  }

  dezState.permanentDeleteBusyId = item.id;
  renderDetail();
  let deletionConfirmed = false;

  try {
    const response = await callAuthenticatedPhotoAction({
      action: "permanently_delete_archived_item",
      item_id: item.id,
      internal_id: item.internalId,
      confirm_internal_id: typedInternalId,
    });
    if (!response.ok) throw await photoActionError(response);

    const result = await response.json();
    if (result?.deleted !== true || result?.internal_id !== item.internalId) {
      throw new Error("Funcția Edge nu a confirmat ștergerea completă a articolului.");
    }
    deletionConfirmed = true;

    if (photoLightboxState.itemId === item.id) closePhotoLightbox();
    clearPermanentlyDeletedItemCaches(item);
    dezState.permanentDeleteBusyId = null;
    await loadDezmembrariItems();
    if (dezState.selectedId !== null) await loadItemPhotos(dezState.selectedId);
    render();
    window.alert(`${item.internalId} a fost șters definitiv. Au fost eliminate ${result.deleted_r2_objects || 0} obiecte R2.`);
  } catch (error) {
    console.error("Ștergere definitivă Dezmembrări:", error);
    if (deletionConfirmed) {
      dezmembrariItems = dezmembrariItems.filter((entry) => entry.id !== item.id);
      dezState.selectedId = dezmembrariItems[0]?.id ?? null;
      render();
      window.alert(`${item.internalId} a fost șters definitiv, dar lista nu a putut fi reîncărcată. Reîmprospătează pagina.`);
    } else {
      window.alert(`Articolul nu a fost șters definitiv: ${error?.message || "Eroare necunoscută."}`);
    }
  } finally {
    if (dezState.permanentDeleteBusyId === item.id) {
      dezState.permanentDeleteBusyId = null;
      renderDetail();
    }
  }
}

/* galerie foto compacta, cu toate imaginile afisate la aceeasi dimensiune */
function renderGallery(item) {
  let galleryContent = "";
  if (item.photosLoading) {
    galleryContent = '<div class="dez-gallery-state"><strong>Se încarcă fotografiile...</strong></div>';
  } else if (item.photoError) {
    galleryContent = `<div class="dez-gallery-state dez-gallery-error"><strong>Fotografiile nu sunt disponibile</strong><span>${escapeHtml(item.photoError)}</span></div>`;
  } else if (!item.photos.length) {
    galleryContent = '<div class="dez-gallery-state"><strong>Nicio fotografie</strong><span>Acest articol nu are încă fotografii salvate.</span></div>';
  } else {
    const mainPhoto = primaryPhoto(item);
    const photos = [mainPhoto, ...item.photos.filter((photo) => photo.id !== mainPhoto.id)];
    const photoCard = (photo, index) => {
      const isPrimary = photo.id === mainPhoto.id;
      const thumbnailUrl = privateThumbnailSource(photo);
      const image = thumbnailUrl
        ? `<img src="${escapeHtml(thumbnailUrl)}" alt="Fotografia ${index + 1} pentru ${escapeHtml(item.internalId)}" loading="${index === 0 ? "eager" : "lazy"}">`
        : '<span class="dez-photo-unavailable">Imagine indisponibilă</span>';
      const preview = photo.driveFileId
        ? `<button class="dez-photo-link" type="button" data-full-photo-id="${photo.id}" aria-label="Deschide fotografia completă">${image}</button>`
        : `<div class="dez-photo-link">${image}</div>`;

      return `
        <div class="dez-photo">
          ${preview}
          <button class="dez-photo-delete" type="button" data-delete-photo-id="${photo.id}"
            ${item.photoManagementBusy ? "disabled" : ""}
            aria-label="Șterge fotografia" title="Șterge fotografia">×</button>
          <button class="dez-photo-primary ${isPrimary ? "active" : ""}" type="button"
            ${isPrimary ? "" : `data-photo-id="${photo.id}"`}
            ${item.primaryPhotoSaving || item.photoManagementBusy ? "disabled" : ""}
            aria-label="${isPrimary ? "Poză principală" : "Setează ca principală"}"
            title="${isPrimary ? "Poză principală" : "Setează ca principală"}">${isPrimary ? "★" : "☆"}</button>
        </div>
      `;
    };
    galleryContent = `<div class="dez-gallery">${photos.map(photoCard).join("")}</div>`;
  }

  return `
    <div class="dez-gallery-wrap">
      ${galleryContent}
      <div class="dez-gallery-actions">
        <input class="dez-photo-input" type="file" accept="image/*" multiple hidden>
        <button class="dez-photo-add" type="button"
          ${item.photoManagementBusy || item.photosLoading || Boolean(item.photoError) ? "disabled" : ""}>
          ${item.photoManagementBusy ? "Se procesează..." : "+ Adaugă foto"}
        </button>
      </div>
    </div>
  `;
}

/* randarea panoului de detalii */
function renderDetail() {
  const pane = document.querySelector("#detailPane");
  const item = selectedItem();
  const tabs = ["Detalii", "Piese asociate", "Notițe", "Istoric"];

  if (!item) {
    pane.innerHTML = '<div class="dez-empty"><div><strong>Nicio piesă disponibilă</strong><span>Elementele adăugate în HUB vor apărea aici.</span></div></div>';
    pane.classList.toggle("is-open", !detailDrawerMedia.matches || dezState.detailOpen);
    document.querySelector("#drawerBackdrop").classList.remove("is-open");
    return;
  }

  pane.innerHTML = `
    <div class="dez-detail-head">
      <h2>${escapeHtml(item.title)}</h2>
      <span class="dez-status ${statusClass(item.status)}">${statusLabels[item.status]}</span>
      <button class="dez-detail-close" type="button" aria-label="Închide">×</button>
    </div>
    <nav class="dez-tabs">
      ${tabs.map((tab, index) => `<button class="dez-tab ${index === 0 ? "active" : ""}" type="button">${tab}</button>`).join("")}
      <span class="dez-detail-id">${escapeHtml(item.internalId)}</span>
    </nav>
    ${renderGallery(item)}
    <form class="dez-form-grid" id="detailForm">
      ${field("Tip articol", item.type, { type: "select", id: "typeSelect", selectOptions: typeLabels })}
      ${field("Status", item.status, { type: "select", id: "statusSelect" })}
      ${field("VIN / Serie caroserie", item.vin, { full: true, isVin: true, id: "vinInput", fieldName: "vin" })}
      ${field("Marcă", item.brand, { id: "brandInput", fieldName: "brand" })}
      ${field("Model", item.model, { id: "modelInput", fieldName: "model" })}
      ${field("An fabricație", item.year, { id: "yearInput", inputMode: "numeric", fieldName: "year" })}
      ${field("Combustibil", item.fuel, { id: "fuelInput", fieldName: "fuel" })}
      ${field("Cod motor", item.engineCode, { id: "engineCodeInput", fieldName: "engineCode" })}
      ${field("Cod cutie", item.gearboxCode, { id: "gearboxCodeInput", fieldName: "gearboxCode" })}
      ${field("Tip cutie", item.gearboxType, { id: "gearboxTypeInput", fieldName: "gearboxType" })}
      ${field("Denumire piesă", item.partName, { id: "partNameInput", fieldName: "partName" })}
      ${field("Preț (EUR)", item.priceRaw, { id: "priceInput", inputMode: "decimal", fieldName: "price" })}
      ${field("Locație depozit", item.location, { id: "locationInput", fieldName: "location" })}
      ${field("Link PieseAuto.ro", item.link, { id: "pieseautoUrlInput", fieldName: "link" })}
      ${field("Observații", item.notes, { type: "textarea", full: true, id: "notesInput", fieldName: "notes" })}
    </form>
    <div class="dez-audit">
      <div class="dez-audit-row">
        <span class="dez-audit-label">Creat de</span>
        <span class="dez-audit-value">${escapeHtml(item.auditCreatedBy || "—")}</span>
        <span class="dez-audit-sep">·</span>
        <span class="dez-audit-date">${escapeHtml(item.auditCreatedAt || "—")}</span>
      </div>
      ${item.auditUpdatedAt && item.auditUpdatedBy ? `
        <div class="dez-audit-row">
          <span class="dez-audit-label">Modificat de</span>
          <span class="dez-audit-value">${escapeHtml(item.auditUpdatedBy)}</span>
          <span class="dez-audit-sep">·</span>
          <span class="dez-audit-date">${escapeHtml(item.auditUpdatedAt)}</span>
        </div>
      ` : ""}
    </div>
    <div class="dez-detail-actions">
      ${dezState.isAdmin && item.status === "archived" ? `
        <button class="dez-btn dez-btn-danger" id="permanentDeleteItemBtn" type="button"
          ${dezState.permanentDeleteBusyId === item.id ? "disabled" : ""}>
          ${dezState.permanentDeleteBusyId === item.id ? "Se șterge definitiv..." : "Șterge definitiv"}
        </button>
      ` : "<span></span>"}
      <div>
        <button class="dez-btn dez-btn-ghost" type="button">Anulează</button>
        <button class="dez-btn dez-btn-primary" id="saveItemBtn" type="button">Salvează</button>
      </div>
    </div>
  `;

  /* sincronizeaza vizibilitatea panoului la desktop ingust */
  pane.classList.toggle("is-open", !detailDrawerMedia.matches || dezState.detailOpen);
  document.querySelector("#drawerBackdrop").classList.toggle("is-open", detailDrawerMedia.matches && dezState.detailOpen);
  updateDesktopDynamicFields(pane.querySelector("#detailForm"), item.type);

  pane.querySelector(".dez-detail-close").addEventListener("click", () => {
    if (!detailDrawerMedia.matches) return;
    dezState.detailOpen = false;
    renderDetail();
  });

  pane.querySelector("#saveItemBtn").addEventListener("click", saveSelectedItem);
  /* butonul distructiv exista numai pentru Admin si articole arhivate */
  pane.querySelector("#permanentDeleteItemBtn")?.addEventListener("click", () => {
    permanentlyDeleteArchivedItem(item);
  });
  pane.querySelector("#typeSelect").addEventListener("change", (event) => {
    updateDesktopDynamicFields(pane.querySelector("#detailForm"), event.target.value);
  });

  /* selectorul desktop accepta una sau mai multe imagini locale */
  const addPhotoButton = pane.querySelector(".dez-photo-add");
  const photoInput = pane.querySelector(".dez-photo-input");
  addPhotoButton?.addEventListener("click", () => photoInput?.click());
  photoInput?.addEventListener("change", async () => {
    const files = Array.from(photoInput.files || []);
    photoInput.value = "";
    await addDesktopPhotos(item, files);
  });

  /* fiecare X sterge perechea R2 si apoi randul foto aferent */
  pane.querySelectorAll("[data-delete-photo-id]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const photoId = Number(button.dataset.deletePhotoId);
      const photo = item.photos.find((entry) => entry.id === photoId);
      if (photo) await deleteDesktopPhoto(item, photo);
    });
  });

  pane.querySelectorAll("[data-photo-id]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const photoId = Number(button.dataset.photoId);
      if (!Number.isInteger(photoId)) return;

      try {
        await persistPrimaryPhoto(item, photoId);
      } catch (error) {
        console.error("Fotografia principală nu a putut fi salvată:", error);
        window.alert(`Fotografia principală nu a putut fi salvată: ${error?.message || "Eroare necunoscută."}`);
      }
      render();
    });
  });

  pane.querySelectorAll("[data-full-photo-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const photoId = Number(button.dataset.fullPhotoId);
      const photo = item.photos.find((entry) => entry.id === photoId);
      if (!photo) return;
      openPhotoLightbox(item, photo.id, button);
    });
  });

  pane.querySelector("#copyVinBtn").addEventListener("click", async () => {
    const vin = pane.querySelector("#vinInput").value;
    if (!vin) return;
    try {
      await navigator.clipboard.writeText(vin);
    } catch (error) {
      console.warn("Copiere VIN indisponibilă.", error);
    }
  });
}

/* creeaza o singura data structura lightbox-ului peste pagina */
function initializePhotoLightbox() {
  if (document.querySelector("#dezPhotoLightbox")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div class="dez-lightbox" id="dezPhotoLightbox" aria-hidden="true">
      <button class="dez-lightbox-backdrop" type="button" aria-label="Închide galeria"></button>
      <div class="dez-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Galerie fotografii Dezmembrări">
        <button class="dez-lightbox-close" id="dezLightboxClose" type="button" aria-label="Închide">×</button>
        <button class="dez-lightbox-arrow dez-lightbox-previous" id="dezLightboxPrevious" type="button" aria-label="Fotografia precedentă">‹</button>
        <div class="dez-lightbox-image-wrap">
          <a class="dez-lightbox-image-link" id="dezLightboxLink" target="_blank" rel="noopener noreferrer">
            <img id="dezLightboxImage" alt="">
          </a>
        </div>
        <button class="dez-lightbox-arrow dez-lightbox-next" id="dezLightboxNext" type="button" aria-label="Fotografia următoare">›</button>
        <span class="dez-lightbox-counter" id="dezLightboxCounter"></span>
      </div>
    </div>
  `);

  const elements = photoLightboxElements();
  /* dialogul inchis nu poate primi focus pana la urmatoarea deschidere */
  elements.overlay.inert = true;
  elements.overlay.querySelector(".dez-lightbox-backdrop").addEventListener("click", closePhotoLightbox);
  elements.close.addEventListener("click", closePhotoLightbox);
  elements.previous.addEventListener("click", () => navigatePhotoLightbox(-1));
  elements.next.addEventListener("click", () => navigatePhotoLightbox(1));
  elements.link.addEventListener("click", (event) => event.preventDefault());

  document.addEventListener("keydown", (event) => {
    if (!elements.overlay.classList.contains("is-open")) return;
    if (event.key === "Escape") closePhotoLightbox();
    if (event.key === "ArrowLeft") navigatePhotoLightbox(-1);
    if (event.key === "ArrowRight") navigatePhotoLightbox(1);
    if (["Escape", "ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
  });
}

/* legarea evenimentelor principale */
function bindEvents() {
  document.querySelector("#listSearchInput").addEventListener("input", (event) => {
    dezState.listSearch = event.target.value;
    renderList();
  });

  document.querySelector("#typeFilter").addEventListener("change", (event) => {
    dezState.typeFilter = event.target.value;
    renderList();
  });

  document.querySelector("#statusFilterSelect").addEventListener("change", (event) => {
    dezState.statusFilter = event.target.value;
    render();
  });

  document.querySelector("#sortSelect").addEventListener("change", (event) => {
    dezState.sortBy = event.target.value;
    renderList();
  });

  document.querySelectorAll(".dez-filter").forEach((button) => {
    button.addEventListener("click", () => {
      dezState.statusFilter = button.dataset.filter;
      render();
    });
  });

  document.querySelector("#newItemBtn").addEventListener("click", async () => {
    if (!dezmembrariItems.length) return;
    dezState.selectedId = dezmembrariItems[0].id;
    dezState.statusFilter = "draft";
    if (detailDrawerMedia.matches) dezState.detailOpen = true;
    render();

    try {
      await loadItemPhotos(dezState.selectedId);
    } catch (error) {
      console.error("Eroare la încărcarea fotografiilor Dezmembrări:", error);
    }
    render();
  });

  document.querySelector("#drawerBackdrop").addEventListener("click", () => {
    dezState.detailOpen = false;
    renderDetail();
  });

  document.querySelector("#backBtn").addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "/";
  });
}

/* breakpoint-ul desktop ingust comuta intre coloana fixa si drawer */
const detailDrawerMedia = window.matchMedia("(min-width: 768px) and (max-width: 1180px)");
detailDrawerMedia.addEventListener("change", (event) => {
  dezState.detailOpen = !event.matches;
  renderDetail();
});

/* randarea completa a paginii desktop */
function render() {
  renderFilterCounts();
  renderList();
  renderDetail();
}

/* porneste pagina si afiseaza erorile de incarcare in UI */
async function initializeDezmembrari() {
  initializePhotoLightbox();
  bindEvents();
  document.querySelector("#itemList").innerHTML = '<div class="dez-empty"><div><strong>Se încarcă...</strong></div></div>';
  document.querySelector("#detailPane").innerHTML = '<div class="dez-empty"><div><strong>Se încarcă detaliile...</strong></div></div>';

  try {
    await loadCurrentAdminState();
    await loadDezmembrariItems();
    if (dezState.selectedId !== null) {
      try {
        await loadItemPhotos(dezState.selectedId);
      } catch (photoError) {
        console.error("Eroare la încărcarea fotografiilor Dezmembrări:", photoError);
      }
    }
    render();
  } catch (error) {
    console.error("Eroare la încărcarea dezmembrărilor din Supabase:", error);
    const message = error?.message || "Datele nu au putut fi încărcate.";
    document.querySelector("#itemList").innerHTML = `<div class="dez-empty"><div><strong>Încărcare eșuată</strong><span>${escapeHtml(message)}</span></div></div>`;
    document.querySelector("#detailPane").innerHTML = '<div class="dez-empty"><div><strong>Detaliile nu sunt disponibile</strong></div></div>';
    document.querySelector("#listFoot").textContent = "";
  }

  if (window.lucide) window.lucide.createIcons();
}

/* curata URL-urile temporare cand pagina desktop se inchide */
window.addEventListener("beforeunload", () => {
  dezmembrariItems.forEach(revokeItemPhotoUrls);
  thumbnailObjectUrlCache.forEach((thumbnailRequest) => {
    thumbnailRequest.then((objectUrl) => URL.revokeObjectURL(objectUrl)).catch(() => {});
  });
  thumbnailObjectUrlCache.clear();
  r2SignedUrlCache.clear();
});

initializeDezmembrari();
