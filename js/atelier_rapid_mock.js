/* Atelier Rapid — prototip MOCK. Fără Supabase, fără rețea. localStorage doar pentru starea demo. */
(function () {
  'use strict';

  /* ---- date mock (viitor: service_personal, constatari_repartizari, constatari_departamente) ---- */
  /* utilizatorul curent: viitor service_personal.user_id / .departament */
  const currentUser = { id: 'mock-user-andrei', name: 'Andrei', department: 'Mecanică' };

  /* mașinile repartizate: viitor constatari_repartizari */
  const assignedVehicles = [
    { id: 'v1', reg: 'CT22GNP', model: 'VW SCIROCCO', sheet: 'Fișa 59', complaint: 'Zgomot la pornire și pierdere lichid de răcire.' },
    { id: 'v2', reg: 'CT87GIS', model: 'MERCEDES', sheet: 'Fișa 61', complaint: 'Zgomot la pornire și pierdere lichid de răcire.' }
  ];

  /* datele departamentului curent: viitor constatari_departamente (editabil numai pentru departamentul propriu) */
  const defaultDepartmentData = {
    v1: { status: 'work', defects: 'Pompa de apă prezintă scurgeri.', parts: 'Pompă de apă\nKit garnituri', note: '', updated: 'azi, 14:20' },
    v2: { status: 'wait', defects: '', parts: '', note: '', updated: 'azi, 12:45' }
  };

  /* departamentele altor colegi — doar citire */
  const otherDepartments = {
    v1: [{ name: 'Electrică', status: 'În lucru', by: 'Nicu', when: 'azi, 13:40', defects: 'Mufa senzorului necesită verificare.', parts: '', note: 'Alternatorul încarcă normal.' }],
    v2: []
  };

  const STATUSES = [
    { key: 'todo', label: 'De făcut' },
    { key: 'work', label: 'În lucru' },
    { key: 'wait', label: 'Așteaptă piese' },
    { key: 'done', label: 'Finalizat la mecanică' }
  ];
  const STORE_KEY = 'atelier_rapid_mock_v1';

  /* ---- stare ---- */
  let departmentData = loadState();
  let selectedId = null;   /* mașina selectată */
  let draft = null;        /* ciorna câmpurilor editate */
  let toastTimer = null;
  let modalKind = null;

  const $ = (id) => document.getElementById(id);
  const statusOf = (k) => STATUSES.find((s) => s.key === k) || STATUSES[0];

  function loadState() {
    const base = JSON.parse(JSON.stringify(defaultDepartmentData));
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        Object.keys(base).forEach((id) => {
          const s = saved[id];
          if (s && typeof s === 'object' && STATUSES.some((x) => x.key === s.status)) {
            base[id] = {
              status: s.status,
              defects: String(s.defects || ''),
              parts: String(s.parts || ''),
              note: String(s.note || ''),
              updated: String(s.updated || base[id].updated)
            };
          }
        });
      }
    } catch (e) { /* localStorage indisponibil: rămân datele implicite */ }
    return base;
  }
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(departmentData)); } catch (e) { /* ignorat */ }
  }

  /* element creat în siguranță: textul intră doar prin textContent */
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---- ecranul 1: carduri ---- */
  function renderList() {
    $('arUser').textContent = currentUser.name + ' · ' + currentUser.department;
    $('arCount').textContent = assignedVehicles.length + ' mașini repartizate';
    const box = $('arCards');
    box.replaceChildren();
    assignedVehicles.forEach((v) => {
      const d = departmentData[v.id];
      const st = statusOf(d.status);
      const card = el('button', 'ar-card st-' + d.status);
      card.type = 'button';
      card.dataset.id = v.id;
      const row = el('div', 'ar-card-row');
      row.append(el('span', 'ar-card-reg', v.reg), el('span', 'ar-badge', st.label));
      card.append(row, el('div', 'ar-card-model', v.model), el('div', 'ar-card-sheet', v.sheet),
        el('div', 'ar-card-upd', 'Actualizat ' + d.updated));
      box.append(card);
    });
  }

  /* ---- ecranul 2: detaliu ---- */
  function openVehicle(id) {
    const v = assignedVehicles.find((x) => x.id === id);
    if (!v) return;
    selectedId = id;
    draft = Object.assign({}, departmentData[id]);
    $('dReg').textContent = v.reg;
    $('dUser').textContent = currentUser.name;
    $('arTop').classList.add('ar-hidden'); /* antetul global nu apare pe detaliu */
    $('dMeta').textContent = v.model + ' · ' + v.sheet;
    $('fDefects').value = draft.defects;
    $('fParts').value = draft.parts;
    $('fNote').value = draft.note;
    setNoteOpen(false);
    paintStatus();
    $('arToast').classList.remove('show');
    $('screenList').classList.add('ar-hidden');
    $('screenDetail').classList.remove('ar-hidden');
    $('screenDetail').querySelector('.ar-dbody').scrollTop = 0;
  }
  function paintStatus() {
    const btn = $('arMenuBtn');
    btn.className = 'ar-menu st-' + draft.status;
    btn.setAttribute('aria-label', 'Status: ' + statusOf(draft.status).label + '. Schimbă statusul');
  }
  function setNoteOpen(open) {
    $('arNoteWrap').classList.toggle('ar-hidden', !open);
    const t = $('arNoteToggle');
    t.setAttribute('aria-expanded', String(open));
    t.textContent = (open ? '− ' : '+ ') + 'Ce am făcut / Observație pentru colegi';
  }
  function isDirty() {
    if (!selectedId || !draft) return false;
    const s = departmentData[selectedId];
    return draft.status !== s.status || draft.defects !== s.defects || draft.parts !== s.parts || draft.note !== s.note;
  }
  function showList() {
    selectedId = null;
    draft = null;
    $('screenDetail').classList.add('ar-hidden');
    $('arTop').classList.remove('ar-hidden');
    $('screenList').classList.remove('ar-hidden');
    renderList();
  }
  function tryBack() {
    if (isDirty()) openModal('confirm'); else showList();
  }

  /* ---- salvare (doar mock, local) ---- */
  function save() {
    if (!selectedId || !draft || !assignedVehicles.some((v) => v.id === selectedId)) { showToast('Selectează mai întâi o mașină', true); return false; }
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    departmentData[selectedId] = Object.assign({}, draft, { updated: 'azi, ' + hh });
    persist();
    renderList();
    showToast('Actualizarea a fost salvată');
    return true;
  }
  function showToast(msg, isError) {
    const t = $('arToast');
    t.textContent = msg;
    t.style.background = isError ? '#881337' : '';
    t.style.borderColor = isError ? '#9f1239' : '';
    t.style.color = isError ? '#fff' : '';
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  /* ---- modale ---- */
  function roBlock(parent, label, value) {
    parent.append(el('div', 'ar-ro-label', label), el('div', 'ar-modal-text', value || '—'));
  }
  function openModal(kind) {
    const v = assignedVehicles.find((x) => x.id === selectedId);
    if (!v) return;
    const m = $('arModal');
    m.replaceChildren();
    modalKind = kind;
    const close = el('button', 'ar-mbtn', 'Închide');
    close.type = 'button';
    close.dataset.act = 'close';

    if (kind === 'complaint') {
      const t = el('h2', null, 'Sesizarea clientului'); t.id = 'arModalTitle';
      m.append(t, el('div', 'ar-modal-text', v.complaint));
      const a = el('div', 'ar-actions'); a.append(close); m.append(a);
    } else if (kind === 'depts') {
      const t = el('h2', null, 'Celelalte departamente'); t.id = 'arModalTitle';
      m.append(t);
      /* se afișează doar informațiile nevide */
      const list = otherDepartments[v.id].filter((d) => d.defects || d.parts || d.note || d.status);
      if (!list.length) m.append(el('div', 'ar-modal-text', 'Nu există informații de la alte departamente.'));
      list.forEach((d) => {
        m.append(el('div', 'ar-dept-head', d.name + ' · ' + d.status), el('div', 'ar-dept-sub', 'Actualizat de ' + d.by + ' · ' + d.when));
        roBlock(m, 'Defecțiuni:', d.defects);
        roBlock(m, 'Piese necesare:', d.parts);
        roBlock(m, 'Observație:', d.note);
      });
      const a = el('div', 'ar-actions'); a.append(close); m.append(a);
    } else if (kind === 'status') {
      const t = el('h2', null, 'Status departament'); t.id = 'arModalTitle';
      m.append(t);
      STATUSES.forEach((s) => {
        const b = el('button', 'ar-opt st-' + s.key);
        b.type = 'button'; b.dataset.status = s.key;
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(draft.status === s.key));
        const dot = el('span', 'ar-dot'); b.append(dot, el('span', null, s.label));
        m.append(b);
      });
    } else if (kind === 'confirm') {
      const t = el('h2', null, 'Modificări nesalvate'); t.id = 'arModalTitle';
      m.append(t, el('div', 'ar-modal-text', 'Ai modificări nesalvate. Ce vrei să faci?'));
      const a = el('div', 'ar-actions');
      const s = el('button', 'ar-mbtn primary', 'Salvează și înapoi'); s.dataset.act = 'save-leave';
      const d = el('button', 'ar-mbtn danger', 'Renunță la modificări'); d.dataset.act = 'discard';
      const c = el('button', 'ar-mbtn', 'Rămân aici'); c.dataset.act = 'close';
      [s, d, c].forEach((b) => { b.type = 'button'; a.append(b); });
      m.append(a);
    }
    $('arBackdrop').classList.remove('ar-hidden');
    m.classList.remove('ar-hidden');
    const first = m.querySelector('button');
    if (first) first.focus();
  }
  function closeModal() {
    modalKind = null;
    $('arModal').classList.add('ar-hidden');
    $('arBackdrop').classList.add('ar-hidden');
    $('arModal').replaceChildren();
  }

  /* ---- evenimente (atașate o singură dată) ---- */
  function bind() {
    $('arCards').addEventListener('click', (e) => {
      const c = e.target.closest('.ar-card');
      if (c) openVehicle(c.dataset.id);
    });
    $('arBack').addEventListener('click', tryBack);
    $('arMenuBtn').addEventListener('click', () => openModal('status'));
    $('btnComplaint').addEventListener('click', () => openModal('complaint'));
    $('btnDepts').addEventListener('click', () => openModal('depts'));
    $('fDefects').addEventListener('input', (e) => { draft.defects = e.target.value; });
    $('fParts').addEventListener('input', (e) => { draft.parts = e.target.value; });
    $('fNote').addEventListener('input', (e) => { draft.note = e.target.value; });
    $('arNoteToggle').addEventListener('click', () => setNoteOpen($('arNoteWrap').classList.contains('ar-hidden')));
    $('arSave').addEventListener('click', save);

    $('arModal').addEventListener('click', (e) => {
      const opt = e.target.closest('[data-status]');
      if (opt && draft) { draft.status = opt.dataset.status; paintStatus(); closeModal(); return; }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      const a = act.dataset.act;
      if (a === 'close') closeModal();
      else if (a === 'discard') { closeModal(); showList(); }
      else if (a === 'save-leave') { if (save()) { closeModal(); showList(); } else closeModal(); }
    });
    /* clic pe fundal: închide doar modalele fără editări; confirmarea cere o alegere explicită */
    $('arBackdrop').addEventListener('click', () => { if (modalKind && modalKind !== 'confirm') closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalKind) closeModal();
    });
  }

  renderList();
  bind();
})();
