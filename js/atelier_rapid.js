/* Atelier Rapid — pagină mobilă cu date reale din Supabase; editare doar pentru departamentul propriu (fără localStorage). */
(function () {
  'use strict';

  /* ---- configurare ---- */
  const LOGIN_URL = '../admin/login.html'; /* pagina de autentificare HUB */
  const PERMISSION_KEY = 'atelier_rapid';   /* cheia din auth_profiles.permissions */

  /* statusurile departamentului: cheie UI ↔ valoare canonică din constatari_departamente.status (constraint în DB) ↔ valoare normalizată */
  const STATUSES = [
    { key: 'todo', label: 'De făcut', value: 'De făcut', db: 'de facut' },
    { key: 'work', label: 'În lucru', value: 'În lucru', db: 'in lucru' },
    { key: 'wait', label: 'Așteaptă piese', value: 'Așteptare piese', db: 'asteptare piese' },
    { key: 'done', label: 'Finalizat', value: 'Finalizat', db: 'finalizat' }
  ];
  /* denumirile afișate ale departamentelor din service_personal.departament */
  const DEPT_LABELS = {
    Mecanica: 'Mecanică',
    Electrica: 'Electrică',
    Vopsitorie: 'Vopsitorie',
    'Tinichigerie/Pregatire': 'Pregătire',
    Detailing: 'Detailing'
  };
  /* mașinile cu aceste statusuri generale nu apar în lista mobilă */
  const HIDDEN_VEHICLE_STATUSES = ['finalizat', 'arhivat'];

  /* ---- stare (doar în memorie) ---- */
  let currentUser = { name: '', department: '' };
  let vehicles = [];       /* mașini unice repartizate: { id, reg, model, sheet, complaint, depts: [{ department, personId, row }], others } */
  let selectedId = null;
  let selectedDept = null; /* departamentul canonic (valoarea din DB) selectat în detaliu */
  let pendingAction = null; /* acțiune amânată de confirmarea modificărilor nesalvate */
  let draft = null;        /* ciorna câmpurilor editate (doar în memorie) */
  let saving = false;      /* previne trimiterea dublă */
  let toastTimer = null;
  let modalKind = null;

  const $ = (id) => document.getElementById(id);
  const norm = (v) => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  const statusByKey = (k) => STATUSES.find((s) => s.key === k) || STATUSES[0];
  const statusOfDb = (v) => STATUSES.find((s) => s.db === norm(v)) || STATUSES[0];
  const deptLabel = (d) => DEPT_LABELS[d] || d || '';

  /* element creat în siguranță: textul intră doar prin textContent */
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ultima actualizare: „azi, HH:MM” sau data completă */
  function formatUpdated(value) {
    if (!value) return 'fără actualizări';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'fără actualizări';
    const hh = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'azi, ' + hh;
    return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + hh;
  }

  /* ---- mesaje de stare în locul listei ---- */
  function showState(title, text, isError) {
    $('arCount').textContent = '';
    const box = $('arCards');
    box.replaceChildren();
    const m = el('div', 'ar-empty' + (isError ? ' err' : ''));
    m.append(el('strong', null, title), el('span', null, text));
    box.append(m);
  }

  /* ---- încărcare date reale (numai SELECT) ---- */
  async function loadData() {
    /* 1. sesiunea existentă */
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;
    const user = sessionData?.session?.user;
    if (!user?.id) return { state: 'unauth' };

    /* 2. permisiunea atelier_rapid din auth_profiles.permissions (același format ca restul HUB: boolean true) */
    const { data: profile, error: profileError } = await supabaseClient
      .from('auth_profiles')
      .select('nume, prenume, porecla, permissions')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.permissions?.[PERMISSION_KEY] !== true) return { state: 'noperm' };

    /* 3. toate rândurile service_personal active legate de utilizator (poate fi mai mult de unul) */
    const { data: people, error: peopleError } = await supabaseClient
      .from('service_personal')
      .select('id, nume, departament, ordine')
      .eq('user_id', user.id)
      .eq('activ', true)
      .order('ordine', { ascending: true })
      .order('id', { ascending: true });
    if (peopleError) throw peopleError;
    if (!people || !people.length) return { state: 'nopersonnel' };
    const userLabel = profile.prenume || profile.porecla || people[0].nume || '';

    /* 4. repartizările active ale acestor persoane */
    const personIds = people.map((p) => p.id);
    const { data: assignments, error: assignError } = await supabaseClient
      .from('constatari_repartizari')
      .select('constatare_id, service_personal_id')
      .in('service_personal_id', personIds)
      .eq('activ', true)
      .is('retras_la', null);
    if (assignError) throw assignError;
    if (!assignments || !assignments.length) return { state: 'noassign', people, userLabel };

    /* 5. constatările legate (fără Finalizat / Arhivat) */
    const constatareIds = [...new Set(assignments.map((a) => a.constatare_id))];
    const { data: constatari, error: constError } = await supabaseClient
      .from('constatari')
      .select('id, nr_inmatriculare, model_masina, nr_fisa, defectiuni_client, status')
      .in('id', constatareIds);
    if (constError) throw constError;
    const open = (constatari || []).filter((c) => !HIDDEN_VEHICLE_STATUSES.includes(norm(c.status)));
    if (!open.length) return { state: 'allclosed', people, userLabel };

    /* 7. rândurile de departament ale mașinilor deschise */
    const { data: deptRows, error: deptError } = await supabaseClient
      .from('constatari_departamente')
      .select('id, constatare_id, departament, constatari, lucrari_efectuate, piese_materiale, status, updated_at')
      .in('constatare_id', open.map((c) => c.id));
    if (deptError) throw deptError;

    /* 8. o singură intrare per mașină; toate departamentele în care ACEST utilizator este repartizat activ (după service_personal_id exact) */
    const personById = new Map(people.map((p) => [p.id, p]));
    const list = open.map((c) => {
      const rows = (deptRows || []).filter((r) => r.constatare_id === c.id);
      const mine = assignments
        .filter((a) => a.constatare_id === c.id)
        .map((a) => personById.get(a.service_personal_id))
        .filter(Boolean)
        .sort((a, b) => people.indexOf(a) - people.indexOf(b));
      const depts = [];
      mine.forEach((person) => {
        if (depts.some((d) => d.department === person.departament)) return; /* un singur intrări per departament */
        depts.push({
          department: person.departament,   /* valoarea canonică din DB (ex. Tinichigerie/Pregatire) */
          personId: person.id,               /* service_personal_id exact al repartizării */
          /* 10. dacă rândul lipsește, rămâne null: câmpuri goale și status implicit, fără inserare */
          row: rows.find((r) => r.departament === person.departament) || null
        });
      });
      const ownedNames = depts.map((d) => d.department);
      return {
        id: c.id,
        reg: c.nr_inmatriculare || '—',
        model: c.model_masina || '—',
        sheet: c.nr_fisa != null && c.nr_fisa !== '' ? 'Fișa ' + c.nr_fisa : '',
        complaint: c.defectiuni_client || '',
        depts,
        /* departamentele care NU aparțin utilizatorului: doar citire */
        others: rows.filter((r) => !ownedNames.includes(r.departament))
      };
    }).filter((v) => v.depts.length);
    /* antet: o singură secție → numele ei; mai multe secții legate → „N secții” */
    const linkedDepartments = [...new Set(people.map((p) => p.departament))];
    const headerDepartment = linkedDepartments.length > 1 ? linkedDepartments.length + ' secții' : deptLabel(linkedDepartments[0]);
    return { state: 'ok', list, userLabel, department: headerDepartment };
  }

  /* ---- ecranul 1: carduri ---- */
  /* cea mai recentă actualizare dintre departamentele proprii ale mașinii */
  function latestUpdate(v) {
    return v.depts.map((d) => d.row?.updated_at).filter(Boolean).sort().pop() || null;
  }
  function renderList() {
    $('arUser').textContent = currentUser.name + (currentUser.department ? ' · ' + currentUser.department : '');
    $('arCount').textContent = vehicles.length + (vehicles.length === 1 ? ' mașină repartizată' : ' mașini repartizate');
    const box = $('arCards');
    box.replaceChildren();
    vehicles.forEach((v) => {
      const first = statusOfDb(v.depts[0].row?.status);
      const card = el('button', 'ar-card st-' + first.key);
      card.type = 'button';
      card.dataset.id = String(v.id);
      const row = el('div', 'ar-card-row');
      row.append(el('span', 'ar-card-reg', v.reg));
      /* o secție: badge-ul de status ca până acum; mai multe: indicația „N secții” */
      row.append(v.depts.length === 1 ? el('span', 'ar-badge', first.label) : el('span', 'ar-multi', v.depts.length + ' secții'));
      card.append(row, el('div', 'ar-card-model', v.model), el('div', 'ar-card-sheet', v.sheet));
      if (v.depts.length > 1) {
        /* etichete compacte: secție · status, cu culoarea statusului */
        const chips = el('div', 'ar-chips');
        v.depts.forEach((d) => {
          const st = statusOfDb(d.row?.status);
          chips.append(el('span', 'ar-chip st-' + st.key, deptLabel(d.department) + ' · ' + st.label));
        });
        card.append(chips);
      }
      card.append(el('div', 'ar-card-upd', 'Actualizat ' + formatUpdated(latestUpdate(v))));
      box.append(card);
    });
  }

  /* ---- ecranul 2: detaliu (doar citire) ---- */
  function currentVehicle() {
    return vehicles.find((x) => x.id === selectedId) || null;
  }
  /* intrarea departamentului selectat (secția proprie, cu service_personal_id exact) */
  function currentEntry() {
    const v = currentVehicle();
    return v ? (v.depts.find((d) => d.department === selectedDept) || null) : null;
  }
  /* încarcă în formular datele departamentului selectat */
  function loadDeptIntoForm() {
    const entry = currentEntry();
    const row = entry?.row;
    draft = { status: statusOfDb(row?.status).key };
    $('fDefects').value = row?.constatari || '';
    $('fParts').value = row?.piese_materiale || '';
    $('fNote').value = row?.lucrari_efectuate || '';
    setNoteOpen(!!(row?.lucrari_efectuate));
    paintStatus(statusByKey(draft.status));
    paintDeptSelector();
  }
  /* selector segmentat: apare numai când mașina are mai multe secții proprii */
  function paintDeptSelector() {
    const v = currentVehicle();
    const seg = $('arDeptSeg');
    seg.replaceChildren();
    const multi = !!v && v.depts.length > 1;
    seg.classList.toggle('ar-hidden', !multi);
    if (!multi) return;
    v.depts.forEach((d) => {
      const b = el('button', 'ar-seg-btn' + (d.department === selectedDept ? ' on' : ''), deptLabel(d.department));
      b.type = 'button';
      b.dataset.dept = d.department;
      b.setAttribute('aria-pressed', String(d.department === selectedDept));
      seg.append(b);
    });
  }
  function openVehicle(id) {
    const v = vehicles.find((x) => String(x.id) === String(id));
    if (!v) return;
    selectedId = v.id;
    selectedDept = v.depts[0].department;
    $('dReg').textContent = v.reg;
    $('dUser').textContent = currentUser.name;
    $('arTop').classList.add('ar-hidden'); /* antetul global nu apare pe detaliu */
    $('dMeta').textContent = [v.model, v.sheet].filter(Boolean).join(' · ');
    loadDeptIntoForm();
    $('arToast').classList.remove('show');
    setSaving(false);
    $('screenList').classList.add('ar-hidden');
    $('screenDetail').classList.remove('ar-hidden');
    $('screenDetail').querySelector('.ar-dbody').scrollTop = 0;
  }
  /* schimbarea secției: cu modificări nesalvate cere confirmarea existentă, nu pierde și nu salvează tăcut */
  function requestDeptSwitch(department) {
    if (!currentVehicle() || department === selectedDept || saving) return;
    if (isDirty()) { pendingAction = { type: 'switch', department }; openModal('confirm'); return; }
    selectedDept = department;
    loadDeptIntoForm();
  }
  /* execută acțiunea amânată (înapoi sau schimbare secție) */
  function runPending() {
    const a = pendingAction;
    pendingAction = null;
    if (!a) return;
    if (a.type === 'switch') { selectedDept = a.department; loadDeptIntoForm(); } else showList();
  }
  function paintStatus(st) {
    const btn = $('arMenuBtn');
    btn.className = 'ar-menu st-' + st.key;
    btn.setAttribute('aria-label', 'Status: ' + st.label);
  }
  function setNoteOpen(open) {
    $('arNoteWrap').classList.toggle('ar-hidden', !open);
    const t = $('arNoteToggle');
    t.setAttribute('aria-expanded', String(open));
    t.textContent = (open ? '− ' : '+ ') + 'Ce am făcut / Observație pentru colegi';
  }
  /* ---- editare și salvare (numai departamentul propriu) ---- */
  const clean = (t) => String(t || '').trim();
  /* valorile curente din formular */
  function formValues() {
    return { constatari: clean($('fDefects').value), piese_materiale: clean($('fParts').value), lucrari_efectuate: clean($('fNote').value) };
  }
  function isDirty() {
    const entry = currentEntry();
    if (!entry || !draft) return false;
    const r = entry.row || {};
    const f = formValues();
    return f.constatari !== clean(r.constatari) || f.piese_materiale !== clean(r.piese_materiale)
      || f.lucrari_efectuate !== clean(r.lucrari_efectuate) || draft.status !== statusOfDb(r.status).key;
  }
  function showList() {
    selectedId = null;
    selectedDept = null;
    pendingAction = null;
    draft = null;
    $('screenDetail').classList.add('ar-hidden');
    $('arTop').classList.remove('ar-hidden');
    $('screenList').classList.remove('ar-hidden');
    renderList();
  }
  function tryBack() {
    if (isDirty()) { pendingAction = { type: 'back' }; openModal('confirm'); } else showList();
  }
  function setSaving(on) {
    saving = on;
    const b = $('arSave');
    b.disabled = on;
    b.textContent = on ? 'Se salvează...' : 'Salvează actualizarea';
  }
  function showToast(msg, isError) {
    const t = $('arToast');
    t.textContent = msg;
    t.classList.toggle('err', !!isError);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), isError ? 6000 : 2500);
  }
  /* eroare cu cod propriu, ca să poată fi diferențiată de o eroare de rețea */
  function saveError(code, message) {
    const e = new Error(message);
    e.arCode = code;
    return e;
  }
  function describeSaveError(error) {
    if (error?.arCode === 'no-permission') return 'Nu mai ai permisiunea Atelier Rapid. Modificările nu au fost salvate.';
    if (error?.arCode === 'closed') return 'Mașina este deja finalizată sau arhivată și nu mai poate fi modificată.';
    if (error?.arCode === 'no-assignment') return 'Mașina nu mai este repartizată ție. Modificările nu au fost salvate.';
    if (error?.arCode === 'denied' || error?.code === '42501' || error?.code === 'PGRST301') return 'Nu ai dreptul să salvezi această actualizare (permisiune sau repartizare modificată). Textul rămâne în câmpuri.';
    const msg = String(error?.message || '');
    if (error instanceof TypeError || /failed to fetch|networkerror|network request|load failed/i.test(msg)) return 'Fără conexiune la server. Verifică internetul și încearcă din nou; textul rămâne în câmpuri.';
    return 'Salvarea a eșuat. Încearcă din nou; textul rămâne în câmpuri.';
  }

  /* citește rândul de departament propriu al mașinii (după constatare + departament) */
  async function fetchDeptRow(constatareId, department) {
    const { data, error } = await supabaseClient
      .from('constatari_departamente')
      .select('id, constatare_id, departament, constatari, lucrari_efectuate, piese_materiale, status, updated_at')
      .eq('constatare_id', constatareId)
      .eq('departament', department)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  /* singura scriere din pagină: UPDATE/INSERT numai pe rândul departamentului propriu */
  async function saveCurrent() {
    const v = currentVehicle();
    const entry = currentEntry();
    if (!v || !entry || !draft || saving) return false;
    const department = entry.department; /* valoarea canonică din DB, nu eticheta afișată */
    setSaving(true);
    try {
      /* 1. sesiunea și permisiunea atelier_rapid, reverificate */
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData?.session?.user;
      if (!user?.id) { window.location.href = LOGIN_URL; return false; }
      const { data: profile, error: profileError } = await supabaseClient
        .from('auth_profiles').select('permissions').eq('id', user.id).maybeSingle();
      if (profileError) throw profileError;
      if (profile?.permissions?.[PERMISSION_KEY] !== true) throw saveError('no-permission');

      /* 2. rândul service_personal EXACT al acestei repartizări: al utilizatorului, activ, cu departamentul selectat */
      const { data: people, error: peopleError } = await supabaseClient
        .from('service_personal').select('id')
        .eq('id', entry.personId).eq('user_id', user.id).eq('activ', true).eq('departament', department);
      if (peopleError) throw peopleError;
      const personIds = (people || []).map((p) => p.id);
      if (!personIds.length) throw saveError('no-assignment');

      /* 3. mașina trebuie să aibă încă o repartizare activă pentru exact acea persoană */
      const { data: assigned, error: assignError } = await supabaseClient
        .from('constatari_repartizari').select('id')
        .eq('constatare_id', v.id).in('service_personal_id', personIds)
        .eq('activ', true).is('retras_la', null).limit(1);
      if (assignError) throw assignError;
      if (!assigned || !assigned.length) throw saveError('no-assignment');

      /* 3b. statusul global al mașinii, recitit chiar înainte de scriere: Finalizat/Arhivat nu se mai modifică */
      const { data: vehicleRow, error: vehicleError } = await supabaseClient
        .from('constatari').select('status').eq('id', v.id).maybeSingle();
      if (vehicleError) throw vehicleError;
      if (!vehicleRow) throw saveError('no-assignment');
      if (HIDDEN_VEHICLE_STATUSES.includes(norm(vehicleRow.status))) throw saveError('closed');

      /* 4–7. doar câmpurile permise; text gol → null (ca în Constatări) */
      const f = formValues();
      const fields = {
        constatari: f.constatari || null,
        piese_materiale: f.piese_materiale || null,
        lucrari_efectuate: f.lucrari_efectuate || null,
        status: statusByKey(draft.status).value,
        updated_at: new Date().toISOString(),
        actualizat_de: user.id
      };
      const existing = await fetchDeptRow(v.id, department);
      const update = async (rowId) => {
        const { data, error } = await supabaseClient
          .from('constatari_departamente')
          .update(fields)
          .eq('id', rowId).eq('constatare_id', v.id).eq('departament', department)
          .select('id');
        if (error) throw error;
        if (!data || !data.length) throw saveError('denied'); /* RLS a blocat modificarea */
      };
      if (existing?.id) {
        await update(existing.id);
      } else {
        const { error } = await supabaseClient
          .from('constatari_departamente')
          .insert({ constatare_id: v.id, departament: department, ...fields });
        if (error) {
          if (error.code !== '23505') throw error;
          /* rând creat între timp de altcineva: se actualizează acela, numai pe departamentul propriu */
          const raced = await fetchDeptRow(v.id, department);
          if (!raced?.id) throw error;
          await update(raced.id);
        }
      }

      /* 9. reîncarcă datele salvate și actualizează cardul */
      entry.row = await fetchDeptRow(v.id, department);
      renderList();
      showToast('Actualizarea a fost salvată');
      return true;
    } catch (error) {
      console.error('Atelier Rapid — salvare:', error);
      showToast(describeSaveError(error), true);
      return false;
    } finally {
      setSaving(false);
    }
  }

  /* ---- modale ---- */
  function roBlock(parent, label, value) {
    parent.append(el('div', 'ar-ro-label', label), el('div', 'ar-modal-text', value || '—'));
  }
  function openModal(kind) {
    const v = currentVehicle();
    if (!v) return;
    const m = $('arModal');
    m.replaceChildren();
    modalKind = kind;
    const close = el('button', 'ar-mbtn', 'Închide');
    close.type = 'button';
    close.dataset.act = 'close';

    if (kind === 'complaint') {
      const t = el('h2', null, 'Sesizarea clientului'); t.id = 'arModalTitle';
      m.append(t, el('div', 'ar-modal-text', v.complaint || '—'));
    } else if (kind === 'depts') {
      const t = el('h2', null, 'Celelalte departamente'); t.id = 'arModalTitle';
      m.append(t);
      /* se afișează doar informațiile nevide */
      const list = v.others.filter((d) => d.constatari || d.piese_materiale || d.lucrari_efectuate || d.status);
      if (!list.length) m.append(el('div', 'ar-modal-text', 'Nu există informații de la alte departamente.'));
      list.forEach((d) => {
        m.append(el('div', 'ar-dept-head', deptLabel(d.departament) + ' · ' + statusOfDb(d.status).label),
          el('div', 'ar-dept-sub', 'Actualizat ' + formatUpdated(d.updated_at)));
        roBlock(m, 'Defecțiuni:', d.constatari);
        roBlock(m, 'Piese necesare:', d.piese_materiale);
        roBlock(m, 'Observație:', d.lucrari_efectuate);
      });
    } else if (kind === 'status') {
      /* alegerea statusului se aplică în formular; se scrie în DB numai la „Salvează” */
      const t = el('h2', null, 'Status departament'); t.id = 'arModalTitle';
      m.append(t);
      STATUSES.forEach((s) => {
        const b = el('button', 'ar-opt st-' + s.key);
        b.type = 'button';
        b.dataset.status = s.key;
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(draft.status === s.key));
        b.append(el('span', 'ar-dot'), el('span', null, s.label));
        m.append(b);
      });
    } else if (kind === 'confirm') {
      const t = el('h2', null, 'Modificări nesalvate'); t.id = 'arModalTitle';
      m.append(t, el('div', 'ar-modal-text', 'Ai modificări nesalvate. Ce vrei să faci?'));
      const act = el('div', 'ar-actions');
      const sv = el('button', 'ar-mbtn primary', pendingAction?.type === 'switch' ? 'Salvează și treci la ' + deptLabel(pendingAction.department) : 'Salvează și înapoi'); sv.dataset.act = 'save-leave';
      const dc = el('button', 'ar-mbtn danger', 'Renunță la modificări'); dc.dataset.act = 'discard';
      const st = el('button', 'ar-mbtn', 'Rămân aici'); st.dataset.act = 'close';
      [sv, dc, st].forEach((x) => { x.type = 'button'; act.append(x); });
      m.append(act);
      $('arBackdrop').classList.remove('ar-hidden');
      m.classList.remove('ar-hidden');
      sv.focus();
      return;
    }
    const a = el('div', 'ar-actions'); a.append(close); m.append(a);
    $('arBackdrop').classList.remove('ar-hidden');
    m.classList.remove('ar-hidden');
    close.focus();
  }
  function closeModal(keepPending) {
    if (!keepPending) pendingAction = null; /* închiderea fără alegere anulează acțiunea amânată */
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
    $('arSave').addEventListener('click', saveCurrent);
    $('arDeptSeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-dept]');
      if (b) requestDeptSwitch(b.dataset.dept);
    });
    $('arNoteToggle').addEventListener('click', () => setNoteOpen($('arNoteWrap').classList.contains('ar-hidden')));
    $('arModal').addEventListener('click', async (e) => {
      const opt = e.target.closest('[data-status]');
      if (opt && draft) { draft.status = opt.dataset.status; paintStatus(statusByKey(draft.status)); closeModal(); return; }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      const a = act.dataset.act;
      if (a === 'close') closeModal();
      else if (a === 'discard') { closeModal(true); runPending(); }
      else if (a === 'save-leave') { closeModal(true); if (await saveCurrent()) runPending(); else pendingAction = null; }
    });
    /* clic pe fundal: nu închide confirmarea (cere o alegere explicită) */
    $('arBackdrop').addEventListener('click', () => { if (modalKind && modalKind !== 'confirm') closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalKind) closeModal();
    });
    /* sesiune invalidată sau revocată (SIGNED_OUT): revenire la autentificare; reîmprospătarea tokenului rămâne automată în supabase-js */
    supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') window.location.replace(LOGIN_URL);
    });
    /* ieșire: închide sesiunea Supabase și revine la autentificare */
    $('arLogout').addEventListener('click', async () => {
      try { await supabaseClient.auth.signOut(); } catch (err) { console.error(err); }
      window.location.href = LOGIN_URL;
    });
  }

  /* ---- pornire ---- */
  async function init() {
    bind();
    showState('Se încarcă...', 'Se caută mașinile repartizate ție.', false);
    try {
      const res = await loadData();
      if (res.state === 'unauth') { window.location.href = LOGIN_URL; return; }
      if (res.state === 'noperm') { $('arUser').textContent = ''; showState('Acces interzis', 'Contul tău nu are permisiunea Atelier Rapid.', true); return; }
      if (res.state === 'nopersonnel') { $('arUser').textContent = ''; showState('Cont neasociat', 'Contul tău nu este asociat unui angajat activ din service. Contactează administratorul.', true); return; }
      currentUser = { name: res.userLabel || '', department: res.department || (res.people ? deptLabel(res.people[0].departament) : '') };
      $('arUser').textContent = currentUser.name + (currentUser.department ? ' · ' + currentUser.department : '');
      if (res.state === 'noassign') { showState('Nicio mașină repartizată', 'Nu ai mașini repartizate în acest moment.', false); return; }
      if (res.state === 'allclosed') { showState('Nicio mașină deschisă', 'Mașinile repartizate ție sunt finalizate sau arhivate.', false); return; }
      vehicles = res.list;
      renderList();
    } catch (error) {
      console.error('Atelier Rapid:', error);
      showState('Datele nu au putut fi încărcate', 'Încearcă din nou. Dacă problema persistă, contactează administratorul. (' + (error?.message || 'eroare necunoscută') + ')', true);
    }
  }
  init();
})();
