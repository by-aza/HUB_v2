/* setarile rapide pentru limita de fotografii */
const PHOTO_MINIMUM = 3;
const PHOTO_MAXIMUM = 9;

/* setarile rapide pentru compresia locala a fotografiilor */
const PHOTO_COMPRESSION = {
  maxLongEdge: 1024,
  fallbackLongEdge: 1024,
  targetMinBytes: 150 * 1024,
  targetMaxBytes: 350 * 1024,
  startQuality: 0.78,
  minimumQuality: 0.6,
  qualityStep: 0.04,
};

/* setarile rapide pentru thumbnail-ul folosit ulterior pe desktop */
const THUMBNAIL_COMPRESSION = {
  maxLongEdge: 800,
  targetMinBytes: 80 * 1024,
  targetMaxBytes: 150 * 1024,
  startQuality: 0.88,
  minimumQuality: 0.58,
  qualityStep: 0.05,
};

/* maparea tipurilor din interfata catre valorile acceptate de tabel */
const ITEM_TYPE_MAP = {
  car: "car",
  engine: "engine",
  gearbox: "gearbox",
  part: "part",
};

/* setarile locale pentru draftul persistent al capturii */
const CAPTURE_DRAFT_DB_NAME = "hub-dezmembrari-capture";
const CAPTURE_DRAFT_DB_VERSION = 1;
const CAPTURE_DRAFT_STORE = "drafts";
const CAPTURE_DRAFT_KEY_PREFIX = "active-capture:";
let captureDraftDatabasePromise = null;
let captureDraftOperation = Promise.resolve();
let captureDraftInputTimer = null;

/* starea locala pentru captura mobila */
const captureState = {
  type: "car",
  photos: [],
  isProcessingPhotos: false,
  isSubmitting: false,
  isCancelling: false,
  hasAccess: false,
  userId: null,
  pendingItem: null,
  storageUploadMayExist: null,
  draftRestored: false,
  accessCheckRunning: false,
  retryAfterCurrentAttempt: false,
  cameraStream: null,
  cameraOpen: false,
  cameraCapturing: false,
  cameraRequestId: 0,
};

/* selectorii principali ai paginii mobile */
const elements = {
  form: document.querySelector("#captureForm"),
  typeButtons: document.querySelectorAll(".capture-type"),
  photoInput: document.querySelector("#photoInput"),
  photoGrid: document.querySelector("#photoGrid"),
  openCameraBtn: document.querySelector("#openCameraBtn"),
  cameraPanel: document.querySelector("#cameraPanel"),
  cameraVideo: document.querySelector("#cameraVideo"),
  cameraCounter: document.querySelector("#cameraCounter"),
  cameraStatus: document.querySelector("#cameraStatus"),
  closeCameraBtn: document.querySelector("#closeCameraBtn"),
  capturePhotoBtn: document.querySelector("#capturePhotoBtn"),
  internalIdInput: document.querySelector("#internalIdInput"),
  vinInput: document.querySelector("#vinInput"),
  partNameInput: document.querySelector("#partNameInput"),
  notesInput: document.querySelector("#notesInput"),
  backBtn: document.querySelector("#backBtn"),
  cancelCaptureBtn: document.querySelector("#cancelCaptureBtn"),
  submitBtn: document.querySelector("#submitBtn"),
};

/* deschide baza IndexedDB folosita numai pentru draftul utilizatorului curent */
function openCaptureDraftDatabase() {
  if (captureDraftDatabasePromise) return captureDraftDatabasePromise;

  const databasePromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Browserul nu oferă IndexedDB pentru recuperarea capturii."));
      return;
    }

    const request = window.indexedDB.open(CAPTURE_DRAFT_DB_NAME, CAPTURE_DRAFT_DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(CAPTURE_DRAFT_STORE)) {
        request.result.createObjectStore(CAPTURE_DRAFT_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB nu a putut fi deschis."));
    request.onblocked = () => reject(new Error("Actualizarea bazei locale este blocată de altă filă."));
  });
  captureDraftDatabasePromise = databasePromise;
  databasePromise.catch(() => {
    if (captureDraftDatabasePromise === databasePromise) captureDraftDatabasePromise = null;
  });

  return captureDraftDatabasePromise;
}

/* serializeaza operatiile IndexedDB pentru a evita suprascrierea unui draft mai nou */
function queueCaptureDraftOperation(operation) {
  captureDraftOperation = captureDraftOperation.catch(() => {}).then(operation);
  return captureDraftOperation;
}

/* cheia draftului separa capturile intre utilizatorii autentificati pe acelasi dispozitiv */
function currentCaptureDraftKey() {
  return captureState.userId ? `${CAPTURE_DRAFT_KEY_PREFIX}${captureState.userId}` : "";
}

/* executa o tranzactie simpla in magazia locala de drafturi */
async function runCaptureDraftTransaction(mode, operation) {
  const database = await openCaptureDraftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CAPTURE_DRAFT_STORE, mode);
    const store = transaction.objectStore(CAPTURE_DRAFT_STORE);
    let result;

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || new Error("Tranzacția IndexedDB a eșuat."));
    transaction.onabort = () => reject(transaction.error || new Error("Tranzacția IndexedDB a fost anulată."));

    try {
      const request = operation(store);
      if (request) {
        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => reject(request.error || new Error("Operația IndexedDB a eșuat."));
      }
    } catch (error) {
      transaction.abort();
      reject(error);
    }
  });
}

/* pregateste fisierele si campurile formularului pentru salvare in IndexedDB */
function buildCaptureDraftRecord() {
  const key = currentCaptureDraftKey();
  if (!key) throw new Error("Utilizatorul draftului local nu este disponibil.");

  return {
    key,
    version: 1,
    updatedAt: Date.now(),
    item: captureState.pendingItem
      ? { id: Number(captureState.pendingItem.id), internal_id: captureState.pendingItem.internal_id }
      : null,
    storageUploadMayExist: captureState.storageUploadMayExist,
    type: captureState.type,
    vin: elements.vinInput.value,
    notes: elements.notesInput.value,
    partName: elements.partNameInput.value,
    photos: captureState.photos.map((photo, sortOrder) => ({
      sortOrder,
      file: photo.file,
      fileName: photo.file.name,
      fileType: photo.file.type,
      fileLastModified: photo.file.lastModified,
      thumbnailFile: photo.thumbnailFile,
      thumbnailFileName: photo.thumbnailFile.name,
      thumbnailFileType: photo.thumbnailFile.type,
      thumbnailFileLastModified: photo.thumbnailFile.lastModified,
      originalSize: photo.originalSize,
      originalWidth: photo.originalWidth,
      originalHeight: photo.originalHeight,
      width: photo.width,
      height: photo.height,
      thumbnailWidth: photo.thumbnailWidth,
      thumbnailHeight: photo.thumbnailHeight,
    })),
  };
}

/* salveaza imediat starea activa, inclusiv imaginile comprimate si thumbnail-urile */
function persistCaptureDraft() {
  return queueCaptureDraftOperation(async () => {
    const record = buildCaptureDraftRecord();
    await runCaptureDraftTransaction("readwrite", (store) => store.put(record));
  });
}

/* citeste draftul utilizatorului curent fara a-l elimina */
function readCaptureDraft() {
  return queueCaptureDraftOperation(async () => {
    const key = currentCaptureDraftKey();
    if (!key) return null;
    return runCaptureDraftTransaction("readonly", (store) => store.get(key));
  });
}

/* sterge draftul numai dupa ce toate fotografiile au fost confirmate */
function clearCaptureDraft() {
  return queueCaptureDraftOperation(async () => {
    const key = currentCaptureDraftKey();
    if (!key) return;
    await runCaptureDraftTransaction("readwrite", (store) => store.delete(key));
  });
}

/* reconstruieste un File utilizabil la upload din Blob-ul clonat de IndexedDB */
function restoreCaptureFile(blob, name, type, lastModified) {
  if (!(blob instanceof Blob)) throw new Error("Draftul conține o imagine locală invalidă.");
  return new File([blob], name || "fotografie.jpg", {
    type: type || blob.type || "image/jpeg",
    lastModified: Number(lastModified) || Date.now(),
  });
}

/* eliberarea previzualizarilor locale din memorie */
function revokePhotoUrls() {
  captureState.photos.forEach((photo) => {
    if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
  });
}

/* randarea butoanelor de tip captura */
function renderTypeButtons() {
  elements.typeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.type === captureState.type);
    button.setAttribute("aria-pressed", String(button.dataset.type === captureState.type));
  });
}

/* afiseaza denumirea numai pentru tipul Alta piesa */
function renderDynamicFields() {
  const partNameField = elements.partNameInput.closest("[data-field]");
  const isPart = captureState.type === "part";
  partNameField.hidden = !isPart;
  partNameField.style.display = isPart ? "" : "none";
  elements.partNameInput.required = isPart;
}

/* crearea unui slot gol pentru adaugare foto */
function createAddPhotoSlot(index) {
  const button = document.createElement("button");
  button.className = "capture-photo-slot capture-photo-add";
  button.type = "button";
  button.setAttribute("aria-label", "Adaugă foto");
  button.disabled = Boolean(captureState.pendingItem) || captureState.isSubmitting;
  button.innerHTML = `
    <i data-lucide="camera" aria-hidden="true"></i>
    <span>Adaugă foto</span>
  `;
  button.addEventListener("click", () => {
    elements.photoInput.dataset.targetIndex = String(index);
    elements.photoInput.click();
  });
  return button;
}

/* crearea unui thumbnail cu buton de stergere */
function createPhotoThumb(photo, index) {
  const slot = document.createElement("div");
  slot.className = "capture-photo-slot";
  slot.innerHTML = `
    <img src="${photo.previewUrl}" alt="Fotografie încărcată">
    <button class="capture-photo-remove" type="button" aria-label="Șterge fotografia">×</button>
  `;

  slot.querySelector(".capture-photo-remove").addEventListener("click", () => {
    if (captureState.pendingItem || captureState.isSubmitting) return;
    URL.revokeObjectURL(photo.previewUrl);
    captureState.photos.splice(index, 1);
    renderPhotos();
    persistCaptureDraft().catch((error) => {
      console.error("Draftul nu a putut fi actualizat după ștergerea fotografiei:", error);
      showToast("Draftul local nu a putut fi actualizat.", 5000);
    });
  });
  slot.querySelector(".capture-photo-remove").disabled = Boolean(captureState.pendingItem) || captureState.isSubmitting;

  return slot;
}

/* randarea grilei foto de maximum 9 pozitii */
function renderPhotos() {
  elements.photoGrid.innerHTML = "";

  for (let index = 0; index < PHOTO_MAXIMUM; index += 1) {
    const photo = captureState.photos[index];
    elements.photoGrid.appendChild(photo ? createPhotoThumb(photo, index) : createAddPhotoSlot(index));
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }

  syncCaptureDraftLock();
}

/* incarca imaginea cu orientarea EXIF aplicata de browser */
async function decodePhoto(file) {
  if ("createImageBitmap" in window) {
    try {
      return await window.createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (error) {
      console.warn("Decodarea ImageBitmap a eșuat; se folosește alternativa Image.", error);
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

/* redimensioneaza proportional imaginea fara marirea fotografiilor mici */
function drawPhotoToCanvas(image, maximumLongEdge) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.min(1, maximumLongEdge / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  canvas.getContext("2d", { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/* exporta un canvas si reduce treptat calitatea pana sub limita dorita */
async function compressCanvas(canvas, settings, mimeType) {
  let quality = settings.startQuality;
  let blob = null;

  while (quality >= settings.minimumQuality - 0.001) {
    blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
    if (!blob) throw new Error("Browserul nu a putut comprima fotografia.");
    if (blob.size <= settings.targetMaxBytes) break;
    quality = Number((quality - settings.qualityStep).toFixed(2));
  }

  return blob;
}

/* creeaza fotografia optimizata si thumbnail-ul, exclusiv in memoria browserului */
async function processPhoto(file) {
  const image = await decodePhoto(file);
  /* R2 foloseste chei .jpg deterministe, deci toate capturile sunt exportate JPEG */
  const mimeType = "image/jpeg";
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;

  try {
    let photoCanvas = drawPhotoToCanvas(image, PHOTO_COMPRESSION.maxLongEdge);
    let compressedBlob = await compressCanvas(photoCanvas, PHOTO_COMPRESSION, mimeType);

    if (compressedBlob.size > PHOTO_COMPRESSION.targetMaxBytes
      && Math.max(photoCanvas.width, photoCanvas.height) > PHOTO_COMPRESSION.fallbackLongEdge) {
      photoCanvas.width = 1;
      photoCanvas.height = 1;
      photoCanvas = drawPhotoToCanvas(image, PHOTO_COMPRESSION.fallbackLongEdge);
      compressedBlob = await compressCanvas(photoCanvas, PHOTO_COMPRESSION, mimeType);
    }

    const thumbnailCanvas = drawPhotoToCanvas(image, THUMBNAIL_COMPRESSION.maxLongEdge);
    const thumbnailBlob = await compressCanvas(thumbnailCanvas, THUMBNAIL_COMPRESSION, mimeType);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "fotografie";
    const extension = mimeType === "image/webp" ? "webp" : "jpg";
    const fileOptions = { type: mimeType, lastModified: Date.now() };
    const width = photoCanvas.width;
    const height = photoCanvas.height;
    const thumbnailWidth = thumbnailCanvas.width;
    const thumbnailHeight = thumbnailCanvas.height;

    photoCanvas.width = 1;
    photoCanvas.height = 1;
    thumbnailCanvas.width = 1;
    thumbnailCanvas.height = 1;

    return {
      file: new File([compressedBlob], `${baseName}.${extension}`, fileOptions),
      thumbnailFile: new File([thumbnailBlob], `${baseName}-thumb.${extension}`, fileOptions),
      originalSize: file.size,
      originalWidth,
      originalHeight,
      width,
      height,
      thumbnailWidth,
      thumbnailHeight,
    };
  } finally {
    if (typeof image.close === "function") image.close();
  }
}

/* afiseaza dimensiunile rezultate pentru verificarea compresiei */
function logPhotoSizes(photo) {
  const toKilobytes = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
  console.info("Compresie foto Dezmembrări:", {
    nume: photo.file.name,
    original: {
      dimensiuni: `${photo.originalWidth} × ${photo.originalHeight} px`,
      marime: toKilobytes(photo.originalSize),
    },
    comprimat: {
      dimensiuni: `${photo.width} × ${photo.height} px`,
      marime: toKilobytes(photo.file.size),
    },
    thumbnail: {
      dimensiuni: `${photo.thumbnailWidth} × ${photo.thumbnailHeight} px`,
      marime: toKilobytes(photo.thumbnailFile.size),
    },
  });
}

/* proceseaza si adauga pozele selectate local */
async function addSelectedPhotos(files) {
  const availableSlots = PHOTO_MAXIMUM - captureState.photos.length;
  const selectedFiles = Array.isArray(files) ? files : Array.from(files);
  const selectedCount = selectedFiles.length;
  selectedFiles.length = Math.min(selectedFiles.length, availableSlots);

  if (selectedCount > availableSlots) {
    showToast(`Maximum ${PHOTO_MAXIMUM} fotografii pentru o captură.`);
  }

  captureState.isProcessingPhotos = true;
  elements.photoInput.disabled = true;

  try {
    while (selectedFiles.length > 0) {
      const originalFile = selectedFiles.shift();
      try {
        const photo = await processPhoto(originalFile);
        photo.previewUrl = URL.createObjectURL(photo.file);
        captureState.photos.push(photo);
        await persistCaptureDraft();
        logPhotoSizes(photo);
        renderPhotos();
      } catch (error) {
        console.error("Procesare sau salvare locală foto Dezmembrări:", error);
        showToast(`Fotografia ${originalFile.name} nu a putut fi procesată sau salvată local.`, 5000);
      }
    }
  } finally {
    captureState.isProcessingPhotos = false;
    syncCaptureDraftLock();
  }

  renderPhotos();
}

/* camera integrata este disponibila numai intr-un context HTTPS securizat */
function supportsInPageCamera() {
  return window.isSecureContext === true && Boolean(navigator.mediaDevices?.getUserMedia);
}

/* actualizeaza contorul si blocheaza declansatorul la limita de 9 fotografii */
function syncCameraControls() {
  const editingLocked = !captureState.hasAccess
    || Boolean(captureState.pendingItem)
    || captureState.isSubmitting
    || captureState.isProcessingPhotos
    || captureState.isCancelling;
  const maximumReached = captureState.photos.length >= PHOTO_MAXIMUM;
  const cameraSupported = supportsInPageCamera();

  elements.cameraCounter.textContent = `${captureState.photos.length} / ${PHOTO_MAXIMUM} fotografii`;
  elements.openCameraBtn.disabled = editingLocked || maximumReached || !cameraSupported;
  elements.openCameraBtn.title = !window.isSecureContext
    ? ""
    : cameraSupported
    ? (maximumReached ? `Ai atins limita de ${PHOTO_MAXIMUM} fotografii.` : "")
    : "Camera integrată nu este disponibilă; folosește grila foto.";
  elements.capturePhotoBtn.disabled = !captureState.cameraOpen
    || !captureState.cameraStream
    || captureState.cameraCapturing
    || captureState.isProcessingPhotos
    || maximumReached;

  if (captureState.cameraOpen && maximumReached) {
    elements.cameraStatus.textContent = `Ai atins limita de ${PHOTO_MAXIMUM} fotografii. Poți închide camera.`;
  }
}

/* opreste complet fluxul video fara sa modifice fotografiile deja salvate local */
function stopCameraStream() {
  if (captureState.cameraStream) {
    captureState.cameraStream.getTracks().forEach((track) => track.stop());
  }
  captureState.cameraStream = null;
  elements.cameraVideo.srcObject = null;
}

/* inchide panoul si reda focusul butonului care l-a deschis */
function closeInPageCamera({ restoreFocus = true } = {}) {
  captureState.cameraRequestId += 1;
  stopCameraStream();
  captureState.cameraOpen = false;
  captureState.cameraCapturing = false;

  if (restoreFocus) {
    const focusTarget = elements.openCameraBtn.disabled ? elements.backBtn : elements.openCameraBtn;
    focusTarget.focus();
  }
  elements.cameraPanel.hidden = true;
  elements.cameraPanel.setAttribute("aria-hidden", "true");
  elements.cameraPanel.setAttribute("inert", "");
  document.body.classList.remove("capture-camera-opened");
  elements.cameraStatus.textContent = "";
  syncCameraControls();
}

/* traduce erorile comune ale camerei intr-un mesaj util pentru utilizator */
function cameraErrorMessage(error) {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return "Accesul la cameră a fost refuzat. Permite camera sau folosește grila foto.";
  }
  if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
    return "Nu a fost găsită o cameră disponibilă. Folosește grila foto.";
  }
  if (error?.name === "NotReadableError" || error?.name === "AbortError") {
    return "Camera este ocupată de altă aplicație. Închide aplicația sau folosește grila foto.";
  }
  return "Camera nu a putut fi pornită. Folosește grila foto.";
}

/* elimina zoomul implicit al camerei folosind minimul raportat de dispozitiv */
async function applyMinimumCameraZoom(stream) {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack
    || typeof videoTrack.getCapabilities !== "function"
    || typeof videoTrack.applyConstraints !== "function") return;

  try {
    const capabilities = videoTrack.getCapabilities();
    const minimumZoom = capabilities?.zoom?.min;
    if (!Number.isFinite(minimumZoom)) return;

    await videoTrack.applyConstraints({ advanced: [{ zoom: minimumZoom }] });
  } catch (error) {
    /* unele browsere raporteaza zoomul, dar refuza schimbarea lui in fluxul activ */
    console.warn("Zoom minim cameră Dezmembrări indisponibil:", error);
  }
}

/* deschide camera din spate cand exista si pastreaza fluxul pentru capturi multiple */
async function openInPageCamera() {
  if (elements.openCameraBtn.disabled || captureState.cameraOpen) return;
  if (!supportsInPageCamera()) return;

  const requestId = captureState.cameraRequestId + 1;
  captureState.cameraRequestId = requestId;
  captureState.cameraOpen = true;
  elements.cameraPanel.hidden = false;
  elements.cameraPanel.removeAttribute("inert");
  elements.cameraPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("capture-camera-opened");
  elements.cameraStatus.textContent = "Se pornește camera...";
  elements.closeCameraBtn.focus();
  syncCameraControls();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" } },
    });

    if (!captureState.cameraOpen || requestId !== captureState.cameraRequestId) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    captureState.cameraStream = stream;
    await applyMinimumCameraZoom(stream);

    /* inchiderea panoului in timpul configurarii zoomului opreste fluxul nou */
    if (!captureState.cameraOpen || requestId !== captureState.cameraRequestId) {
      stream.getTracks().forEach((track) => track.stop());
      if (captureState.cameraStream === stream) captureState.cameraStream = null;
      return;
    }

    elements.cameraVideo.srcObject = stream;
    await elements.cameraVideo.play();
    elements.cameraStatus.textContent = "";
    syncCameraControls();
  } catch (error) {
    if (!captureState.cameraOpen || requestId !== captureState.cameraRequestId) return;
    console.error("Pornire cameră Dezmembrări:", error);
    const message = cameraErrorMessage(error);
    closeInPageCamera();
    showToast(message, 6000);
  }
}

/* transforma cadrul video intr-un File si il trimite procesarii foto existente */
async function captureCurrentCameraFrame() {
  if (elements.capturePhotoBtn.disabled || !captureState.cameraStream) return;
  if (captureState.photos.length >= PHOTO_MAXIMUM) {
    syncCameraControls();
    return;
  }

  const video = elements.cameraVideo;
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
    showToast("Camera nu este încă pregătită. Încearcă din nou într-o clipă.");
    return;
  }

  captureState.cameraCapturing = true;
  elements.cameraStatus.textContent = "Se adaugă fotografia...";
  syncCameraControls();

  try {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d", { alpha: false }).drawImage(video, 0, 0, canvas.width, canvas.height);
    const sourceBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
    canvas.width = 1;
    canvas.height = 1;
    if (!sourceBlob) throw new Error("Browserul nu a putut prelua cadrul camerei.");

    const cameraFile = new File([sourceBlob], `camera-dz-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    await addSelectedPhotos([cameraFile]);
  } catch (error) {
    console.error("Captură foto Dezmembrări:", error);
    showToast(error?.message || "Fotografia nu a putut fi adăugată.", 5000);
  } finally {
    captureState.cameraCapturing = false;
    if (captureState.cameraOpen && captureState.photos.length < PHOTO_MAXIMUM) {
      elements.cameraStatus.textContent = "";
    }
    syncCameraControls();
  }
}

/* mesaj scurt pentru validare si rezultatul trimiterii */
function showToast(message, duration = 2400) {
  const oldToast = document.querySelector(".capture-toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = "capture-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  if (duration > 0) window.setTimeout(() => toast.remove(), duration);
}

/* activeaza formularul numai dupa verificarea accesului HUB */
function setCaptureControlsEnabled(isEnabled) {
  elements.form.querySelectorAll("input:not(#internalIdInput), textarea, button").forEach((control) => {
    control.disabled = !isEnabled;
  });
  syncCaptureDraftLock();
}

/* blocheaza editarea pozitiei fotografiilor dupa ce articolul DZ a fost creat */
function syncCaptureDraftLock() {
  const editingLocked = !captureState.hasAccess
    || Boolean(captureState.pendingItem)
    || captureState.isSubmitting
    || captureState.isProcessingPhotos
    || captureState.isCancelling;

  elements.typeButtons.forEach((button) => {
    button.disabled = editingLocked;
  });
  elements.photoInput.disabled = editingLocked || captureState.photos.length >= PHOTO_MAXIMUM;
  elements.vinInput.disabled = editingLocked;
  elements.partNameInput.disabled = editingLocked;
  elements.notesInput.disabled = editingLocked;
  elements.photoGrid.querySelectorAll("button").forEach((button) => {
    button.disabled = editingLocked;
  });
  elements.submitBtn.disabled = !captureState.hasAccess
    || captureState.isSubmitting
    || captureState.isProcessingPhotos
    || captureState.isCancelling;
  elements.cancelCaptureBtn.disabled = !captureState.hasAccess
    || captureState.isSubmitting
    || captureState.isProcessingPhotos
    || captureState.isCancelling;
  syncCameraControls();
}

/* verifica sesiunea si permisiunile din profilul HUB */
async function ensureCaptureAccess() {
  if (typeof supabaseClient === "undefined") {
    throw new Error("Clientul Supabase nu este disponibil.");
  }

  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) throw sessionError;

  const session = sessionData?.session;
  if (!session?.user?.id) {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(`/modules/admin/login.html?returnTo=${encodeURIComponent(returnTo)}`);
    return null;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("auth_profiles")
    .select("rol_id, permissions")
    .eq("id", session.user.id)
    .single();

  if (profileError) throw profileError;

  const permissions = profile?.permissions || {};
  return {
    userId: session.user.id,
    hasAccess: Number(profile?.rol_id) === 1
      || permissions.dezmembrari_capture === true
      || permissions.dezmembrari_manage === true,
  };
}

/* blocarea butonului cat timp Supabase proceseaza cererea */
function setSubmitting(isSubmitting) {
  captureState.isSubmitting = isSubmitting;
  elements.submitBtn.disabled = isSubmitting;
  elements.submitBtn.querySelector("span").textContent = isSubmitting ? "Se trimite..." : "Trimite în HUB";
  syncCaptureDraftLock();
}

/* blocheaza actiunile cat timp anularea verifica si curata datele capturii */
function setCancelling(isCancelling) {
  captureState.isCancelling = isCancelling;
  elements.cancelCaptureBtn.textContent = isCancelling ? "Se anulează..." : "Anulează";
  syncCaptureDraftLock();
}

/* transforma valorile optionale goale in null pentru baza de date */
function nullableText(value) {
  const normalizedValue = value.trim();
  return normalizedValue || null;
}

/* construieste payload-ul minimal pentru captura mobila */
function buildCapturePayload(userId) {
  const partName = captureState.type === "part" ? nullableText(elements.partNameInput.value) : null;

  if (captureState.type === "part" && !partName) {
    throw new Error("Denumirea piesei este obligatorie pentru tipul Altă piesă.");
  }

  return {
    tip: ITEM_TYPE_MAP[captureState.type],
    status: "draft",
    vin: nullableText(elements.vinInput.value),
    denumire_piesa: partName,
    observatii: nullableText(elements.notesInput.value),
    created_by: userId,
  };
}

/* insereaza captura si returneaza identificatorii necesari fotografiilor */
async function insertCapture() {
  if (typeof supabaseClient === "undefined") {
    throw new Error("Clientul Supabase nu este disponibil.");
  }

  const { data: userData, error: userError } = await supabaseClient.auth.getUser();
  if (userError) throw userError;

  const user = userData?.user;
  if (!user?.id) {
    const authError = new Error("Sesiunea de autentificare lipsește.");
    authError.code = "AUTH_REQUIRED";
    throw authError;
  }

  const itemType = ITEM_TYPE_MAP[captureState.type];
  if (!itemType) {
    throw new Error("Tipul selectat nu este valid.");
  }

  /* fotografiile sunt trimise separat dupa crearea articolului */
  const payload = buildCapturePayload(user.id);

  const { data, error } = await supabaseClient
    .from("dezmembrari_items")
    .insert(payload)
    .select("id, internal_id");

  if (error) {
    console.error("Eroare Supabase la inserarea capturii:", error);
    throw error;
  }

  const insertedRow = data?.[0];
  if (!insertedRow?.id || !insertedRow?.internal_id) {
    throw new Error("Supabase nu a returnat identificatorii articolului.");
  }

  return insertedRow;
}

/* extrage mesajul util returnat de functia Edge */
async function getFunctionErrorMessage(error) {
  const response = error?.context instanceof Response ? error.context : null;
  if (!response) return error?.message || "Funcția de upload nu a putut fi apelată.";

  try {
    const body = await response.clone().json();
    return body?.message || body?.error || error?.message;
  } catch {
    return error?.message || `Funcția de upload a răspuns cu status ${response.status}.`;
  }
}

/* trimite o fotografie procesata si thumbnail-ul catre backend-ul configurat in Edge */
async function uploadPhotoToStorage(item, photo, sortOrder) {
  const formData = new FormData();
  formData.append("item_id", String(item.id));
  formData.append("internal_id", item.internal_id);
  formData.append("compressed_image", photo.file, photo.file.name);
  formData.append("thumbnail", photo.thumbnailFile, photo.thumbnailFile.name);
  formData.append("sort_order", String(sortOrder));
  formData.append("is_primary", String(sortOrder === 0));

  const { data, error } = await supabaseClient.functions.invoke("dezmembrari-photo-upload", {
    body: formData,
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  const isR2Upload = data?.storage_provider === "r2";
  const hasMainIdentifier = isR2Upload ? data?.main?.key : data?.main?.id;
  const hasThumbnailIdentifier = isR2Upload ? data?.thumbnail?.key : data?.thumbnail?.id;
  if (!hasMainIdentifier || !hasThumbnailIdentifier) {
    throw new Error("Backend-ul foto nu a returnat identificatorii ambelor imagini.");
  }

  return data;
}

/* salveaza imediat metadatele unei fotografii si actualizeaza pozitia la retry */
async function upsertCapturePhoto(item, photo, uploaded, sortOrder) {
  const isR2Upload = uploaded.storage_provider === "r2";

  /* coloanele media existente pastreaza cheia/URL-ul R2 fara a modifica datele Drive vechi */
  const photoRow = {
    item_id: item.id,
    drive_file_id: isR2Upload ? uploaded.main.key : uploaded.main.id,
    drive_file_url: uploaded.main.url,
    thumbnail_file_id: isR2Upload ? uploaded.thumbnail.key : uploaded.thumbnail.id,
    thumbnail_url: uploaded.thumbnail.url,
    mime_type: uploaded.main.mime_type || photo.file.type,
    file_size_bytes: uploaded.main.size_bytes || photo.file.size,
    width: photo.width,
    height: photo.height,
    sort_order: sortOrder,
    is_primary: sortOrder === 0,
  };

  const { error } = await supabaseClient
    .from("dezmembrari_photos")
    .upsert(photoRow, {
      onConflict: "item_id,sort_order",
      ignoreDuplicates: false,
    });

  if (error) {
    console.error("Eroare Supabase la salvarea fotografiei:", error);
    throw new Error("Imaginea a ajuns în storage, dar metadatele nu au putut fi salvate în HUB.");
  }
}

/* preia pozitiile deja confirmate pentru reluarea unei capturi intrerupte */
async function loadSavedPhotoPositions(item) {
  const { data, error } = await supabaseClient
    .from("dezmembrari_photos")
    .select("sort_order")
    .eq("item_id", item.id)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Eroare Supabase la verificarea fotografiilor salvate:", error);
    throw new Error("Fotografiile deja salvate nu au putut fi verificate. Reîncearcă după reconectare.");
  }

  return new Set(
    (data || [])
      .map((row) => Number(row.sort_order))
      .filter((sortOrder) => Number.isInteger(sortOrder) && sortOrder >= 0),
  );
}

/* restaureaza formularul si fisierele comprimate din draftul IndexedDB */
async function restoreCaptureDraft() {
  if (captureState.draftRestored) return null;

  const draft = await readCaptureDraft();
  captureState.draftRestored = true;
  if (!draft) return null;

  const storedPhotos = Array.isArray(draft.photos)
    ? [...draft.photos].sort((first, second) => Number(first.sortOrder) - Number(second.sortOrder))
    : [];

  if (storedPhotos.length > PHOTO_MAXIMUM
    || storedPhotos.some((photo, index) => Number(photo.sortOrder) !== index)) {
    throw new Error("Ordinea fotografiilor din draftul local nu este validă.");
  }

  revokePhotoUrls();
  captureState.type = ITEM_TYPE_MAP[draft.type] ? draft.type : "car";
  captureState.pendingItem = null;
  captureState.storageUploadMayExist = null;
  if (draft.item) {
    const itemId = Number(draft.item.id);
    const internalId = String(draft.item.internal_id || "").trim().toUpperCase();
    if (!Number.isInteger(itemId) || itemId <= 0 || !/^DZ-\d{5,}$/.test(internalId)) {
      throw new Error("Articolul DZ din draftul local nu este valid.");
    }
    captureState.pendingItem = { id: itemId, internal_id: internalId };
  }
  const uncertainSortOrder = Number(draft.storageUploadMayExist?.sortOrder);
  if (Number.isInteger(uncertainSortOrder) && uncertainSortOrder >= 0) {
    captureState.storageUploadMayExist = { sortOrder: uncertainSortOrder };
  }
  captureState.photos = storedPhotos.map((storedPhoto) => {
    const file = restoreCaptureFile(
      storedPhoto.file,
      storedPhoto.fileName,
      storedPhoto.fileType,
      storedPhoto.fileLastModified,
    );
    const thumbnailFile = restoreCaptureFile(
      storedPhoto.thumbnailFile,
      storedPhoto.thumbnailFileName,
      storedPhoto.thumbnailFileType,
      storedPhoto.thumbnailFileLastModified,
    );

    return {
      file,
      thumbnailFile,
      previewUrl: URL.createObjectURL(file),
      originalSize: Number(storedPhoto.originalSize) || file.size,
      originalWidth: Number(storedPhoto.originalWidth) || 0,
      originalHeight: Number(storedPhoto.originalHeight) || 0,
      width: Number(storedPhoto.width) || 0,
      height: Number(storedPhoto.height) || 0,
      thumbnailWidth: Number(storedPhoto.thumbnailWidth) || 0,
      thumbnailHeight: Number(storedPhoto.thumbnailHeight) || 0,
    };
  });

  elements.vinInput.value = typeof draft.vin === "string" ? draft.vin : "";
  elements.notesInput.value = typeof draft.notes === "string" ? draft.notes : "";
  elements.partNameInput.value = typeof draft.partName === "string" ? draft.partName : "";
  renderTypeButtons();
  renderDynamicFields();
  renderPhotos();

  if (!captureState.pendingItem) {
    elements.internalIdInput.value = "Draft local restaurat";
    showToast("Draftul local a fost restaurat.", 4000);
    return { savedPositions: null };
  }

  elements.internalIdInput.value = `${captureState.pendingItem.internal_id} — Se verifică pozele...`;
  const savedPositions = await loadSavedPhotoPositions(captureState.pendingItem);
  const missingCount = captureState.photos.filter((photo, index) => !savedPositions.has(index)).length;
  elements.internalIdInput.value = `${captureState.pendingItem.internal_id} — ${missingCount} poze rămase`;
  showToast(`${captureState.pendingItem.internal_id} a fost restaurat. Se reia uploadul.`, 4000);
  return { savedPositions };
}

/* incarca secvential numai pozitiile lipsa si pastreaza fiecare rezultat reusit */
async function uploadCapturePhotos(item, restoredSavedPositions = null) {
  const savedPositions = restoredSavedPositions || await loadSavedPhotoPositions(item);
  if (savedPositions.has(captureState.storageUploadMayExist?.sortOrder)) {
    captureState.storageUploadMayExist = null;
    await persistCaptureDraft();
  }
  const missingPositions = captureState.photos
    .map((photo, index) => ({ photo, index }))
    .filter(({ index }) => !savedPositions.has(index));

  for (const { photo, index } of missingPositions) {
    try {
      /* marcheaza pozitia inainte de request: la o intrerupere nu presupunem ca R2 a ramas gol */
      captureState.storageUploadMayExist = { sortOrder: index };
      await persistCaptureDraft();
      const uploaded = await uploadPhotoToStorage(item, photo, index);
      await upsertCapturePhoto(item, photo, uploaded, index);
      captureState.storageUploadMayExist = null;
      await persistCaptureDraft();
      savedPositions.add(index);
    } catch (error) {
      throw new Error(`Fotografia ${index + 1} din ${captureState.photos.length} nu a putut fi finalizată: ${error.message}`);
    }
  }
}

/* resetarea capturii dupa inserarea reusita */
function resetAfterSubmit() {
  closeInPageCamera({ restoreFocus: false });
  if (captureDraftInputTimer) window.clearTimeout(captureDraftInputTimer);
  captureDraftInputTimer = null;
  elements.form.reset();
  revokePhotoUrls();
  captureState.type = "car";
  captureState.photos = [];
  captureState.pendingItem = null;
  captureState.storageUploadMayExist = null;
  renderTypeButtons();
  renderDynamicFields();
  renderPhotos();
  syncCaptureDraftLock();
}

/* validarea minima pentru poze */
function canSubmitCapture() {
  if (captureState.photos.length < PHOTO_MINIMUM) {
    showToast(`Adaugă minim ${PHOTO_MINIMUM} fotografii înainte de trimitere.`);
    return false;
  }

  return true;
}

/* salveaza campurile text dupa o pauza scurta de tastare */
function scheduleCaptureDraftSave() {
  if (!captureState.hasAccess || captureState.pendingItem) return;
  if (captureDraftInputTimer) window.clearTimeout(captureDraftInputTimer);
  captureDraftInputTimer = window.setTimeout(() => {
    captureDraftInputTimer = null;
    if (!captureState.hasAccess || captureState.pendingItem || captureState.isSubmitting) return;
    persistCaptureDraft().catch((error) => {
      console.error("Draftul formularului nu a putut fi salvat:", error);
      showToast("Draftul local nu a putut fi salvat.", 5000);
    });
  }, 250);
}

/* trimite captura curenta sau reia articolul DZ deja salvat in draft */
async function submitCapture(restoredSavedPositions = null) {
  if (!captureState.hasAccess
    || captureState.isSubmitting
    || captureState.isProcessingPhotos
    || captureState.isCancelling
    || !canSubmitCapture()) return;

  if (captureDraftInputTimer) window.clearTimeout(captureDraftInputTimer);
  captureDraftInputTimer = null;
  setSubmitting(true);
  elements.internalIdInput.value = captureState.pendingItem?.internal_id || "Se generează...";

  try {
    await persistCaptureDraft();

    if (!captureState.pendingItem) {
      captureState.pendingItem = await insertCapture();
      syncCaptureDraftLock();
      /* ID-ul DZ este salvat local inainte de primul upload pentru recuperare dupa refresh */
      await persistCaptureDraft();
    }

    const activeItem = captureState.pendingItem;
    elements.internalIdInput.value = `${activeItem.internal_id} — Se încarcă pozele...`;
    await uploadCapturePhotos(activeItem, restoredSavedPositions);
    await clearCaptureDraft();
    resetAfterSubmit();
    elements.internalIdInput.value = activeItem.internal_id;
    showToast(`${activeItem.internal_id} a fost trimis în HUB.`, 4000);
  } catch (error) {
    console.error("Trimitere captură Dezmembrări:", error);
    elements.internalIdInput.value = captureState.pendingItem?.internal_id || "Draft local";
    showToast(error?.message || "Captura nu a putut fi trimisă.", 6000);
  } finally {
    const shouldRetryAfterReconnect = captureState.retryAfterCurrentAttempt
      && Boolean(captureState.pendingItem)
      && navigator.onLine;
    captureState.retryAfterCurrentAttempt = false;
    setSubmitting(false);
    if (shouldRetryAfterReconnect) window.setTimeout(() => submitCapture(), 0);
  }
}

/* verifica daca articolul DZ are cel putin o fotografie confirmata in HUB */
async function pendingItemHasSavedPhotos(item) {
  const { data, error } = await supabaseClient
    .from("dezmembrari_photos")
    .select("id")
    .eq("item_id", item.id)
    .limit(1);

  if (error) {
    console.error("Eroare Supabase la verificarea fotografiilor pentru anulare:", error);
    throw new Error("Fotografiile existente nu au putut fi verificate. Draftul a fost păstrat.");
  }

  return Array.isArray(data) && data.length > 0;
}

/* sterge numai articolul draft al utilizatorului curent, dupa verificarea fotografiilor */
async function deleteEmptyPendingItem(item) {
  const { data, error } = await supabaseClient
    .from("dezmembrari_items")
    .delete()
    .eq("id", item.id)
    .eq("internal_id", item.internal_id)
    .eq("created_by", captureState.userId)
    .select("id");

  if (error) {
    console.error("Eroare Supabase la ștergerea capturii goale:", error);
    throw new Error(`${item.internal_id} nu a putut fi șters. Draftul local a fost păstrat.`);
  }
  if (!Array.isArray(data) || data.length !== 1) {
    throw new Error(`${item.internal_id} nu a fost confirmat ca șters. Draftul local a fost păstrat.`);
  }
}

/* raporteaza fotografiile existente si pastreaza draftul pentru curatare controlata */
function reportRequiredPhotoCleanup(item) {
  const message = `${item.internal_id} are fotografii încărcate sau un upload cu rezultat incert. `
    + "Draftul și articolul au fost păstrate; este necesară curățarea fotografiilor înainte de anulare.";
  window.alert(message);
  showToast(message, 7000);
}

/* anuleaza captura numai cand nu poate lasa fotografii orfane in storage */
async function cancelCapture() {
  if (!captureState.hasAccess
    || captureState.isSubmitting
    || captureState.isProcessingPhotos
    || captureState.isCancelling) return;

  const pendingItem = captureState.pendingItem;
  const captureLabel = pendingItem?.internal_id || "captura curentă";
  const confirmationMessage = `Anulezi ${captureLabel}? `
    + "Datele locale și fotografiile selectate vor fi șterse numai dacă nu există poze încărcate.";
  if (!window.confirm(confirmationMessage)) return;

  if (captureDraftInputTimer) window.clearTimeout(captureDraftInputTimer);
  captureDraftInputTimer = null;
  setCancelling(true);

  try {
    if (pendingItem) {
      if (captureState.storageUploadMayExist) {
        reportRequiredPhotoCleanup(pendingItem);
        return;
      }

      const hasSavedPhotos = await pendingItemHasSavedPhotos(pendingItem);
      if (hasSavedPhotos) {
        reportRequiredPhotoCleanup(pendingItem);
        return;
      }

      await deleteEmptyPendingItem(pendingItem);
    }

    await clearCaptureDraft();
    resetAfterSubmit();
    elements.internalIdInput.value = "Generat automat";
    showToast("Captura a fost anulată.", 4000);
  } catch (error) {
    console.error("Anulare captură Dezmembrări:", error);
    showToast(error?.message || "Anularea nu a putut fi finalizată. Draftul a fost păstrat.", 7000);
  } finally {
    setCancelling(false);
  }
}

/* legarea evenimentelor principale */
function bindCaptureEvents() {
  elements.backBtn.addEventListener("click", () => {
    window.location.href = "/modules/stocuri/dezmembrari.html";
  });

  elements.typeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (captureState.pendingItem) return;
      captureState.type = button.dataset.type;
      renderTypeButtons();
      renderDynamicFields();
      scheduleCaptureDraftSave();
    });
  });

  elements.photoInput.addEventListener("change", async () => {
    const processingPhotos = addSelectedPhotos(Array.from(elements.photoInput.files || []));
    elements.photoInput.value = "";
    await processingPhotos;
  });

  /* camera ramane activa intre cadre si se inchide numai la cererea utilizatorului */
  elements.openCameraBtn.addEventListener("click", openInPageCamera);
  elements.closeCameraBtn.addEventListener("click", () => closeInPageCamera());
  elements.capturePhotoBtn.addEventListener("click", captureCurrentCameraFrame);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && captureState.cameraOpen) closeInPageCamera();
  });
  window.addEventListener("pagehide", () => closeInPageCamera({ restoreFocus: false }));

  [elements.vinInput, elements.partNameInput, elements.notesInput].forEach((control) => {
    control.addEventListener("input", scheduleCaptureDraftSave);
    control.addEventListener("change", () => {
      if (!captureState.hasAccess || captureState.pendingItem) return;
      persistCaptureDraft().catch((error) => {
        console.error("Draftul formularului nu a putut fi salvat:", error);
        showToast("Draftul local nu a putut fi salvat.", 5000);
      });
    });
  });

  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitCapture();
  });

  /* butonul de anulare cere confirmare si pastreaza orice captura cu poze existente */
  elements.cancelCaptureBtn.addEventListener("click", cancelCapture);

  /* reconectarea reia automat numai drafturile care au deja un articol DZ */
  window.addEventListener("online", () => {
    if (!captureState.hasAccess) {
      activateCaptureAccess();
      return;
    }
    if (!captureState.pendingItem || captureState.isCancelling) return;
    if (captureState.isSubmitting) {
      captureState.retryAfterCurrentAttempt = true;
      return;
    }
    submitCapture();
  });
}

/* verifica accesul, restaureaza draftul si reia automat uploadul disponibil */
async function activateCaptureAccess() {
  if (captureState.accessCheckRunning || captureState.hasAccess) return;
  captureState.accessCheckRunning = true;
  try {
    const access = await ensureCaptureAccess();
    if (access === null) return;
    captureState.userId = access.userId;

    if (!access.hasAccess) {
      elements.internalIdInput.value = "Acces interzis";
      showToast("Acces interzis: contul nu are permisiune pentru captură Dezmembrări.", 0);
      return;
    }

    captureState.hasAccess = true;
    elements.internalIdInput.value = "Generat automat";
    setCaptureControlsEnabled(true);

    let restoredDraft = null;
    try {
      restoredDraft = await restoreCaptureDraft();
    } catch (draftError) {
      console.error("Restaurare draft Dezmembrări:", draftError);
      elements.internalIdInput.value = captureState.pendingItem?.internal_id || "Draft indisponibil";
      showToast(draftError?.message || "Draftul local nu a putut fi restaurat.", 6000);
    }

    syncCaptureDraftLock();
    if (captureState.pendingItem && navigator.onLine && restoredDraft) {
      await submitCapture(restoredDraft.savedPositions);
    }
  } catch (error) {
    console.error("Verificare acces captură Dezmembrări:", error);
    elements.internalIdInput.value = "Acces indisponibil";
    showToast(error?.message || "Accesul nu a putut fi verificat.", 0);
  } finally {
    captureState.accessCheckRunning = false;
  }
}

/* pornirea paginii si pregatirea recuperarii locale */
async function bootstrapCapture() {
  elements.internalIdInput.value = "Se verifică accesul...";
  setCaptureControlsEnabled(false);
  bindCaptureEvents();
  renderTypeButtons();
  renderDynamicFields();
  renderPhotos();

  if (window.lucide) window.lucide.createIcons();
  await activateCaptureAccess();
}

bootstrapCapture();
