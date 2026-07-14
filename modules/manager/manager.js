// ============================================================
// MANAGER DASHBOARD - logica JS
// Datele marcate FICTIVE mai jos urmeaza sa fie inlocuite treptat
// cu interogari reale catre Supabase (sb.from(...).select...)
// ============================================================

// client Supabase central
const sb = window.supabaseClient;

async function verificaAccesManager(){
  try {
    if (!window.supabaseClient) {
      throw new Error('Clientul Supabase central nu este disponibil.');
    }

    const { data: sesiuneData, error: sesiuneError } = await sb.auth.getSession();
    if (sesiuneError) {
      throw sesiuneError;
    }

    const sesiune = sesiuneData?.session;
    if (!sesiune?.user?.id) {
      window.location.href = '/modules/admin/login.html';
      return null;
    }

    const { data: profil, error: profilError } = await sb
      .from('auth_profiles')
      .select('id, nume, prenume, porecla, rol_id, permissions')
      .eq('id', sesiune.user.id)
      .maybeSingle();

    if (profilError) {
      throw profilError;
    }

    if (!profil) {
      alert('Nu s-a putut încărca profilul utilizatorului.');
      window.location.href = '/index.html';
      return null;
    }

    if (profil.rol_id !== 1 && profil.rol_id !== 2 && profil?.permissions?.manager_dashboard !== true) {
      alert('Nu ai acces la pagina Manager Dashboard.');
      window.location.href = '/index.html';
      return null;
    }

    return profil;
  } catch (error) {
    console.error(error);
    alert(`A apărut o eroare la verificarea accesului: ${error.message || 'eroare necunoscută'}`);
    return null;
  }
}

// ---------- CEAS LIVE (data + ora in header) ----------
function porniceasLive(){
  const el = document.getElementById('liveClock');
  function tick(){
    const acum = new Date();
    el.textContent = acum.toLocaleTimeString('ro-RO', { hour12:false }); // ora HH:MM:SS
  }
  tick();
  setInterval(tick, 1000); // se actualizeaza in fiecare secunda
}

// ---------- COMUTARE TAB-URI ----------
function initTabs(){
  const butoane = document.querySelectorAll('.tab-btn');

  butoane.forEach(btn=>{
    btn.addEventListener('click', ()=> activeazaTab(btn.dataset.tab));
  });
}

// functie reutilizata si de cautarea globala, ca sa sara direct in tabul potrivit
function activeazaTab(numeTab){
  document.querySelectorAll('.tab-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.tab === numeTab);
  });
  document.querySelectorAll('.tab-panel').forEach(p=>{
    p.classList.toggle('active', p.id === 'tab-' + numeTab);
  });
}

function formatLei(valoare){
  return valoare.toLocaleString('ro-RO') + ' Lei'; // format cu spatiu la mii
}

// ============================================================
// TAB 1: FINANCIAR & VANZARI (unificat cu AWB si Detailing)
// ============================================================

// numele lunilor pe scurt, in romana, pentru afisare in grafic
const NUME_LUNI_RO = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Noi','Dec'];

function getUltimele4Luni(){
  const acum = new Date();
  const cheieLuna = (d) => `${d.getFullYear()}-${d.getMonth()}`;
  const luni = [];
  for(let i=3; i>=0; i--){
    const d = new Date(acum.getFullYear(), acum.getMonth()-i, 1);
    luni.push({ cheie: cheieLuna(d), eticheta: NUME_LUNI_RO[d.getMonth()] });
  }
  return luni;
}

// data_deviz vine ca text din Supabase - incearca ISO (yyyy-mm-dd) apoi dd.mm.yyyy
function parseDataFlex(text){
  if(!text) return null;
  let d = new Date(text);
  if(!isNaN(d)) return d;
  const parti = text.split(/[.\/]/);
  if(parti.length === 3){
    const [zi, luna, an] = parti;
    d = new Date(`${an}-${luna.padStart(2,'0')}-${zi.padStart(2,'0')}`);
    if(!isNaN(d)) return d;
  }
  return null;
}

// citeste toate devizele finale si calculeaza: luna curenta, luna trecuta, ultimele 4 luni (pt grafic)
async function fetchDevizeFinale(){
  const { data, error } = await sb.from('deviz_final_header').select('data_deviz, total_general');
  if(error){ console.error('Eroare deviz_final_header:', error); return null; }

  const acum = new Date();
  const cheieLuna = (d) => `${d.getFullYear()}-${d.getMonth()}`;

  // construim ultimele 4 luni (inclusiv curenta) ca etichete + chei
  const ultimele4 = [];
  for(let i=3; i>=0; i--){
    const d = new Date(acum.getFullYear(), acum.getMonth()-i, 1);
    ultimele4.push({ cheie: cheieLuna(d), eticheta: NUME_LUNI_RO[d.getMonth()] });
  }

  // sumam total_general pe fiecare luna din cele 4
  const sumePerLuna = Object.fromEntries(ultimele4.map(l=>[l.cheie, 0]));
  let sumaLunaTrecuta = 0;
  const dLunaTrecuta = new Date(acum.getFullYear(), acum.getMonth()-1, 1);
  const cheieLunaTrecuta = cheieLuna(dLunaTrecuta);
  let countLunaCurenta = 0;

  data.forEach(r=>{
    const d = parseDataFlex(r.data_deviz);
    if(!d) return;
    const cheie = cheieLuna(d);
    const val = Number(r.total_general) || 0;
    if(cheie in sumePerLuna){
      sumePerLuna[cheie] += val;
      if(cheie === cheieLuna(acum)) countLunaCurenta++;
    }
    if(cheie === cheieLunaTrecuta) sumaLunaTrecuta += val;
  });

  return {
    labels: ultimele4.map(l=>l.eticheta),
    valori: ultimele4.map(l=>sumePerLuna[l.cheie]),
    lunaCurenta: sumePerLuna[cheieLuna(acum)],
    lunaTrecuta: sumaLunaTrecuta,
    countLunaCurenta
  };
}

let dateAwb = [];
let dateAvansuri = [];
let dateConsumabile = [];

async function fetchAvansuriData(){
  try{
    const { data, error } = await sb
      .from('evidente_avansuri_plati')
      .select('id, avans_id, suma, metoda_plata, data_platii')
      .order('data_platii', { ascending:false });

    if(error) throw error;
    return Array.isArray(data) ? data : [];
  } catch(error){
    console.error('Eroare evidente_avansuri_plati:', error);
    alert('A apărut o eroare la încărcarea avansurilor. KPI-ul și graficul pentru avansuri vor afișa 0.');
    return null;
  }
}

async function fetchAwbData(){
  try{
    const { data, error } = await sb
      .from('evidenta_awb')
      .select('id, data_crearii, data_livrare, data_retur, curier, nr_awb, nume_client, piesa, pret, stare, is_archived')
      .or('is_archived.is.null,is_archived.eq.false')
      .order('data_crearii', { ascending:false });

    if(error) throw error;
    return Array.isArray(data) ? data : [];
  } catch(error){
    console.error('Eroare evidenta_awb:', error);
    alert('A apărut o eroare la încărcarea datelor AWB. Valorile AWB rămân 0, iar tabelul va fi gol.');
    return [];
  }
}

async function fetchConsumabileData(){
  try{
    const { data, error } = await sb
      .from('stoc_view_curent')
      .select('denumire, stoc_actual, prag_minim, activ')
      .eq('activ', true)
      .order('denumire', { ascending:true });

    if(error) throw error;
    return Array.isArray(data) ? data : [];
  } catch(error){
    console.error('Eroare stoc_view_curent:', error);
    alert('Nu s-au putut încărca datele despre consumabile.');
    return null;
  }
}

let dateDetailing = [];

async function fetchDetailingData(){
  try{
    const { data, error } = await sb
      .from('detailing')
      .select('id, nr_inmatriculare, autovehicul, pachet, pret_estimat, status, data_programare, data_inceperii, data_finalizarii')
      .order('data_finalizarii', { ascending:false });

    if(error) throw error;
    return Array.isArray(data) ? data : [];
  } catch(error){
    console.error('Eroare detailing:', error);
    alert('A apărut o eroare la încărcarea datelor Detailing. KPI-ul și graficul pentru Detailing vor afișa 0.');
    return null;
  }
}

async function initFinanciar(){
  // --- DATE REALE: devize finale din Supabase ---
  const devize = await fetchDevizeFinale();
  const avansuri = await fetchAvansuriData();
  dateAvansuri = Array.isArray(avansuri) ? avansuri : [];
  dateAwb = await fetchAwbData();
  const detailing = await fetchDetailingData();
  dateDetailing = Array.isArray(detailing) ? detailing : [];
  const consumabile = await fetchConsumabileData();
  dateConsumabile = Array.isArray(consumabile) ? consumabile : [];
  const incasariLunaCurenta = devize ? devize.lunaCurenta : 0;
  const incasariLunaTrecuta = devize ? devize.lunaTrecuta : 0;

  // KPI: devize finale luna curenta + procent fata de luna trecuta
  document.getElementById('kpiIncasariLuna').textContent = formatLei(incasariLunaCurenta);
  if(incasariLunaTrecuta > 0){
    const procent = (((incasariLunaCurenta - incasariLunaTrecuta) / incasariLunaTrecuta) * 100).toFixed(1);
    const semn = procent >= 0 ? '▲' : '▼';
    document.getElementById('kpiIncasariCompare').textContent = `${semn} ${Math.abs(procent)}% vs. luna trecută (${formatLei(incasariLunaTrecuta)})`;
  } else {
    document.getElementById('kpiIncasariCompare').textContent = `luna trecută: ${formatLei(incasariLunaTrecuta)}`;
  }

  // KPI: avansuri azi
  const acum = new Date();
  const esteAceeasiZi = (d1, d2) =>
    d1 && d2 &&
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
  const avansuriAzi = dateAvansuri.filter(x => {
    const dataPlatii = parseDataFlex(x.data_platii);
    return dataPlatii && esteAceeasiZi(dataPlatii, acum);
  });
  const totalAvansuriAzi = avansuriAzi.reduce((sum, x) => sum + (Number(x.suma) || 0), 0);
  document.getElementById('kpiAvansuriAzi').textContent = formatLei(totalAvansuriAzi);
  document.getElementById('kpiAvansuriCount').textContent = `${avansuriAzi.length} plăți încasate azi`;

  // KPI: AWB aflate in tranzit
  const awbInTranzit = dateAwb.filter(x=>x.stare==='in_tranzit');
  const totalAwbInTranzit = awbInTranzit.reduce((s,x)=>s + (Number(x.pret) || 0), 0);
  document.getElementById('kpiAwbNet').textContent = formatLei(totalAwbInTranzit);
  document.getElementById('kpiAwbNetDetail').textContent = `${awbInTranzit.length} colete în tranzit`;

  // KPI: valoare detailing finalizat in luna curenta
  const cheieLunaCurenta = `${acum.getFullYear()}-${acum.getMonth()}`;
  const detailingFinalizatLunaCurenta = dateDetailing.filter(x=>{
    const dataFinalizarii = parseDataFlex(x.data_finalizarii);
    if(!dataFinalizarii) return false;
    return `${dataFinalizarii.getFullYear()}-${dataFinalizarii.getMonth()}` === cheieLunaCurenta;
  });
  const totalDetailing = detailingFinalizatLunaCurenta.reduce((sum, x)=>sum + (Number(x.pret_estimat) || 0), 0);
  document.getElementById('kpiDetailing').textContent = formatLei(totalDetailing);
  document.getElementById('kpiDetailingCount').textContent = `${detailingFinalizatLunaCurenta.length} lucrări finalizate`;

  // grafic: evolutie 4 categorii suprapuse
  const ultimele4Luni = getUltimele4Luni();
  const etichetLuni = devize ? devize.labels : ultimele4Luni.map(l=>l.eticheta);
  const valoriDevize = devize ? devize.valori : [0,0,0,0];
  const avansuriPerLuna = Object.fromEntries(ultimele4Luni.map(l=>[l.cheie, 0]));
  const awbLivratePerLuna = Object.fromEntries(ultimele4Luni.map(l=>[l.cheie, 0]));
  const awbReturPerLuna = Object.fromEntries(ultimele4Luni.map(l=>[l.cheie, 0]));
  const detailingPerLuna = Object.fromEntries(ultimele4Luni.map(l=>[l.cheie, 0]));

  dateAvansuri.forEach(x=>{
    const dataPlatii = parseDataFlex(x.data_platii);
    if(!dataPlatii) return;
    const cheie = `${dataPlatii.getFullYear()}-${dataPlatii.getMonth()}`;
    if(cheie in avansuriPerLuna) avansuriPerLuna[cheie] += (Number(x.suma) || 0);
  });

  dateAwb.forEach(x=>{
    const pret = Number(x.pret) || 0;
    const dataLivrare = parseDataFlex(x.data_livrare);
    const dataRetur = parseDataFlex(x.data_retur);

    if(dataLivrare){
      const cheieLivrare = `${dataLivrare.getFullYear()}-${dataLivrare.getMonth()}`;
      if(cheieLivrare in awbLivratePerLuna) awbLivratePerLuna[cheieLivrare] += pret;
    }

    if(dataRetur){
      const cheieRetur = `${dataRetur.getFullYear()}-${dataRetur.getMonth()}`;
      if(cheieRetur in awbReturPerLuna) awbReturPerLuna[cheieRetur] += pret;
    }
  });

  dateDetailing.forEach(x=>{
    const dataFinalizarii = parseDataFlex(x.data_finalizarii);
    if(!dataFinalizarii) return;
    const cheie = `${dataFinalizarii.getFullYear()}-${dataFinalizarii.getMonth()}`;
    if(cheie in detailingPerLuna) detailingPerLuna[cheie] += (Number(x.pret_estimat) || 0);
  });

  const valoriAvansuri = ultimele4Luni.map(l=>avansuriPerLuna[l.cheie]);
  const valoriAwbNet = ultimele4Luni.map(l=>awbLivratePerLuna[l.cheie] - awbReturPerLuna[l.cheie]);
  const valoriDetailing = ultimele4Luni.map(l=>detailingPerLuna[l.cheie]);

  const ctx = document.getElementById('chartVanzari');
  new Chart(ctx, {
    type:'line',
    data:{
      labels: etichetLuni,
      datasets:[
        { label:'Devize finale', data:valoriDevize,    borderColor:'#22d3c8', backgroundColor:'rgba(34,211,200,0.08)', borderWidth:2.5, tension:0.35, pointRadius:4 },
        { label:'Avansuri',      data:valoriAvansuri,  borderColor:'#58b6ff', backgroundColor:'rgba(88,182,255,0.08)', borderWidth:2.5, tension:0.35, pointRadius:4 },
        { label:'AWB livrate (net)', data:valoriAwbNet, borderColor:'#c58bff', backgroundColor:'rgba(197,139,255,0.08)', borderWidth:2.5, tension:0.35, pointRadius:4 },
        { label:'Detailing',     data:valoriDetailing, borderColor:'#f5a623', backgroundColor:'rgba(245,166,35,0.08)', borderWidth:2.5, tension:0.35, pointRadius:4 },
      ]
    },
    options: optiuniGraficStandard('Lei')
  });

  // tabel AWB: doar cele "in tranzit"
  const tbodyAwb = document.querySelector('#tableAwb tbody');
  const awbTranzit = dateAwb.filter(x=>x.stare==='in_tranzit');
  tbodyAwb.innerHTML = awbTranzit.length ? awbTranzit.map(x=>`
    <tr>
      <td>${x.nr_awb || '—'}</td>
      <td>${x.nume_client || '—'}</td>
      <td title="${String(x.piesa || '—').replace(/"/g, '&quot;')}">${x.piesa || '—'}</td>
      <td>${x.pret == null ? '—' : formatLei(Number(x.pret) || 0)}</td>
    </tr>`).join('') : `<tr><td colspan="4" style="color:#8a8a90;">Niciun colet în tranzit momentan</td></tr>`;

  // tabel Consumabile: fara coloana de cost, doar stoc/prag/status
  const tbodyCons = document.querySelector('#tableConsumabile tbody');
  if(consumabile === null){
    tbodyCons.innerHTML = `<tr><td colspan="4" style="color:#8a8a90;">Nu s-au putut încărca datele despre consumabile.</td></tr>`;
  } else {
    const consumabileSubPrag = dateConsumabile
      .filter(x => {
        const stocCurent = Number(x.stoc_actual) || 0;
        const pragMinim = Number(x.prag_minim) || 0;
        return stocCurent < pragMinim;
      })
      .sort((a, b) => {
        const diffA = (Number(a.stoc_actual) || 0) - (Number(a.prag_minim) || 0);
        const diffB = (Number(b.stoc_actual) || 0) - (Number(b.prag_minim) || 0);
        return diffA - diffB;
      });

    tbodyCons.innerHTML = consumabileSubPrag.length ? consumabileSubPrag.map(x=>`
      <tr class="row-alert">
        <td>${x.denumire}</td>
        <td>${Number(x.stoc_actual) || 0}</td>
        <td>${Number(x.prag_minim) || 0}</td>
        <td><span class="status-pill-sm status-retur">Sub prag</span></td>
      </tr>`).join('') : `<tr><td colspan="4" style="color:#8a8a90;">Toate consumabilele sunt peste pragul minim.</td></tr>`;
  }
}

// ============================================================
// TAB 2: PERFORMANTA DEPARTAMENTE
// ============================================================

async function fetchDateDepartamente(){
  const ultimele4Luni = getUltimele4Luni();
  const zeroDepartamente = {
    luni: ultimele4Luni.map(l=>l.eticheta),
    detailing: [0, 0, 0, 0],
    constatari: [0, 0, 0, 0],
  };

  try{
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(1);
    start.setMonth(start.getMonth() - 3);
    const startDataProgramare = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const startIso = start.toISOString();

    const [{ data: detailing, error: detailingError }, { data: constatari, error: constatariError }] = await Promise.all([
      sb
        .from('detailing')
        .select('id, data_programare')
        .gte('data_programare', startDataProgramare),
      sb
        .from('constatari')
        .select('id, created_at')
        .gte('created_at', startIso),
    ]);

    if(detailingError) throw detailingError;
    if(constatariError) throw constatariError;

    const indexLuni = Object.fromEntries(ultimele4Luni.map((l, index)=>[l.cheie, index]));
    const departamente = {
      luni: ultimele4Luni.map(l=>l.eticheta),
      detailing: [0, 0, 0, 0],
      constatari: [0, 0, 0, 0],
    };

    (Array.isArray(detailing) ? detailing : []).forEach(x=>{
      const dataProgramare = parseDataFlex(x.data_programare);
      if(!dataProgramare) return;
      const cheie = `${dataProgramare.getFullYear()}-${dataProgramare.getMonth()}`;
      if(cheie in indexLuni) departamente.detailing[indexLuni[cheie]] += 1;
    });

    (Array.isArray(constatari) ? constatari : []).forEach(x=>{
      const dataCreare = parseDataFlex(x.created_at);
      if(!dataCreare) return;
      const cheie = `${dataCreare.getFullYear()}-${dataCreare.getMonth()}`;
      if(cheie in indexLuni) departamente.constatari[indexLuni[cheie]] += 1;
    });

    return departamente;
  } catch(error){
    console.error('Eroare date departamente:', error);
    return zeroDepartamente;
  }
}

let dateAsteptarePiese = [];

function formatDurataCompacta(ms){
  const totalMinutes = Math.max(0, Math.floor((Number(ms) || 0) / 60000));
  const zile = Math.floor(totalMinutes / 1440);
  const ore = Math.floor((totalMinutes % 1440) / 60);
  const minute = totalMinutes % 60;
  if(zile > 0) return `${zile} zile ${ore}h`;
  if(ore > 0) return `${ore}h ${minute}m`;
  return `${minute}m`;
}

async function fetchDateAsteptarePiese(){
  try{
    const { data: constatari, error: constatariError } = await sb
      .from('constatari')
      .select('id, nr_inmatriculare, status')
      .eq('status', 'Asteptare piese');

    if(constatariError) throw constatariError;

    const rows = Array.isArray(constatari) ? constatari : [];
    const ids = rows.map(row=>row.id).filter(Boolean);
    if(!ids.length) return [];

    const { data: intervale, error: intervaleError } = await sb
      .from('constatari_asteptare_piese')
      .select('id, constatare_id, inceput, sfarsit')
      .in('constatare_id', ids)
      .is('sfarsit', null)
      .order('inceput', { ascending:false });

    if(intervaleError) throw intervaleError;

    const ultimIntervalDeschis = {};
    (Array.isArray(intervale) ? intervale : []).forEach(interval=>{
      if(!ultimIntervalDeschis[interval.constatare_id]){
        ultimIntervalDeschis[interval.constatare_id] = interval;
      }
    });

    const acum = Date.now();
    return rows
      .map(row=>{
        const interval = ultimIntervalDeschis[row.id];
        const inceput = parseDataFlex(interval?.inceput);
        const durataMs = inceput ? Math.max(0, acum - inceput.getTime()) : 0;
        return {
          nrInmatriculare: row.nr_inmatriculare || '—',
          durataMs,
          durataText: formatDurataCompacta(durataMs),
        };
      })
      .sort((a,b)=>b.durataMs - a.durataMs);
  } catch(error){
    console.error('Eroare asteptare piese:', error);
    return [];
  }
}

let dateMasiniLucru = [];

function formatDataTabelMasini(value){
  const d = parseDataFlex(value);
  if(!d) return '—';
  return d.toLocaleDateString('ro-RO', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '.');
}

async function fetchDateMasiniLucru(){
  try{
    const { data, error } = await sb
      .from('constatari')
      .select('id, nr_inmatriculare, created_at, data_finalizarii, status')
      .neq('status', 'Arhivat')
      .order('created_at', { ascending:false });

    if(error) throw error;

    return (Array.isArray(data) ? data : [])
      .sort((a, b)=>{
        const aFinalizat = a.status === 'Finalizat' ? 1 : 0;
        const bFinalizat = b.status === 'Finalizat' ? 1 : 0;
        if(aFinalizat !== bFinalizat) return aFinalizat - bFinalizat;
        return (parseDataFlex(b.created_at)?.getTime() || 0) - (parseDataFlex(a.created_at)?.getTime() || 0);
      })
      .map(row=>({
        id: row.id,
        nr: row.nr_inmatriculare || '—',
        dataIntrare: formatDataTabelMasini(row.created_at),
        dataFinalizare: formatDataTabelMasini(row.data_finalizarii),
        status: row.status || '—',
        mecanic: '—'
      }));
  } catch(error){
    console.error('Eroare masini in lucru din constatari:', error);
    return [];
  }
}

// -- date fictive: inlocuieste cu SELECT din tabelul masini firma --
const dateFleet = [
  { masina:'Dacia Duster - CJ 12 ABC', tip:'ITP', zileRamase:-3 },
  { masina:'VW Transporter - CJ 45 XYZ', tip:'RCA', zileRamase:5 },
  { masina:'Ford Transit - CJ 88 DEF', tip:'Rovinieta', zileRamase:12 },
];

function parseGeneratorDate(value){
  if(!value) return null;
  const d = new Date(String(value).includes('Z') || String(value).includes('+') ? value : `${value}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatGeneratorNumber(value){
  const rounded = Math.round((Number(value) || 0) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatGeneratorElapsed(start){
  const startDate = parseGeneratorDate(start);
  if(!startDate) return '0h 0m';
  const totalMinute = Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 60000));
  const ore = Math.floor(totalMinute / 60);
  const minute = totalMinute % 60;
  return `${ore}h ${minute}m`;
}

let generatorLiveTimer = null;

function updateGeneratorLiveStatus(activeStart){
  const card = document.getElementById('genOre')?.closest('.card');
  const subtitle = card?.querySelector('.card-sub');
  if(!subtitle) return;

  if(generatorLiveTimer){
    clearInterval(generatorLiveTimer);
    generatorLiveTimer = null;
  }

  if(activeStart){
    card?.classList.add('generator-running');
    const renderLive = () => {
      subtitle.textContent = `Luna curentă • Generator pornit • ${formatGeneratorElapsed(activeStart)}`;
    };
    renderLive();
    generatorLiveTimer = setInterval(renderLive, 60000);
  } else {
    card?.classList.remove('generator-running');
    subtitle.textContent = 'Luna curentă • Generator oprit';
  }
}

async function fetchDateGenerator(){
  const zeroGenerator = { oreFunctionare:0, motorinaLitri:0, porniri:0, oreMaintenance:0, pragMaintenance:100, activeStart:null };

  try{
    const acum = new Date();
    const startLuna = new Date(acum.getFullYear(), acum.getMonth(), 1);

    const { data, error } = await sb
      .from('generator_logs')
      .select('id, ora_start, ora_stop, litri_motorina, observatii')
      .order('id', { ascending:false });

    if(error) throw error;

    let totalMs = 0;
    let totalMotorina = 0;
    let porniri = 0;
    let totalMinsMaintenance = 0;
    const logs = Array.isArray(data) ? data : [];
    const sesiuneActiva = logs.find(log=>log.ora_start && !log.ora_stop && !String(log.observatii || '').includes('Alimentare'));

    logs.forEach(log=>{
      const esteAlimentare = String(log.observatii || '').includes('Alimentare');
      const start = parseGeneratorDate(log.ora_start);
      const stop = parseGeneratorDate(log.ora_stop) || acum;
      const esteInLunaCurenta = start && start >= startLuna && start <= acum;

      if(log.ora_start && log.ora_stop && !String(log.observatii || '').includes('Alimentare')){
        totalMinsMaintenance += Math.floor((parseGeneratorDate(log.ora_stop) - parseGeneratorDate(log.ora_start)) / 60000);
      }

      if(esteAlimentare){
        if(esteInLunaCurenta) totalMotorina += Number(log.litri_motorina) || 0;
        return;
      }

      if(start){
        if(esteInLunaCurenta) porniri += 1;
        const intervalStart = start < startLuna ? startLuna : start;
        totalMs += Math.max(0, stop - intervalStart);
      }
    });

    return {
      oreFunctionare: Number((totalMs / 3600000).toFixed(1)),
      motorinaLitri: Number(totalMotorina.toFixed(2)),
      porniri,
      oreMaintenance: Number((totalMinsMaintenance / 60).toFixed(1)),
      pragMaintenance:100,
      activeStart: sesiuneActiva?.ora_start || null
    };
  } catch(error){
    console.error('Eroare generator_logs:', error);
    return zeroGenerator;
  }
}

async function initPerformanta(){
  const [dateDepartamente, dateGenerator, masiniLucru, asteptarePiese] = await Promise.all([
    fetchDateDepartamente(),
    fetchDateGenerator(),
    fetchDateMasiniLucru(),
    fetchDateAsteptarePiese(),
  ]);
  dateMasiniLucru = masiniLucru;
  dateAsteptarePiese = asteptarePiese;

  // grafic bare: nr masini intrate pe departamente
  const ctx = document.getElementById('chartDepartamente');
  new Chart(ctx, {
    type:'bar',
    data:{
      labels: dateDepartamente.luni,
      datasets:[
        { label:'Detailing (mașini)', data:dateDepartamente.detailing,   backgroundColor:'#22d3c8', borderRadius:6 },
        { label:'Constatări (mașini)', data:dateDepartamente.constatari, backgroundColor:'#58b6ff', borderRadius:6 },
      ]
    },
    options: optiuniGraficStandard('Mașini')
  });

  // tabel masini in lucru + buton spre constatari
  const tbodyLucru = document.querySelector('#tableMasiniLucru tbody');
  tbodyLucru.innerHTML = dateMasiniLucru.map(x=>{
    const clasaStatus = x.status==='Finalizat' ? 'status-livrat' : x.status==='Asteptare piese' ? 'status-retur' : 'status-lucru';
    return `<tr>
      <td>${x.nr}</td>
      <td>${x.dataIntrare}</td>
      <td>${x.dataFinalizare}</td>
      <td><span class="status-pill-sm ${clasaStatus}">${x.status}</span></td>
      <td>${x.mecanic}</td>
      <td><a class="btn-link" href="/modules/formulare/constatari.html?nr=${encodeURIComponent(x.nr)}">→ Constatări</a></td>
    </tr>`;
  }).join('');

  // lista masini in asteptare piese
  const listaAsteptarePiese = document.getElementById('listAsteptarePiese');
  listaAsteptarePiese.innerHTML = dateAsteptarePiese.length ? dateAsteptarePiese
    .map(x=>`
      <li class="alert-item">
        <div class="alert-car">${x.nrInmatriculare}</div>
        <div class="alert-count">${x.durataText}</div>
      </li>`).join('') : `<li class="alert-item alert-empty">Nicio mașină în așteptare.</li>`;

  // lista alerte fleet: ITP/RCA/Rovinieta
  const listaFleet = document.getElementById('listFleetAlerts');
  listaFleet.innerHTML = dateFleet.map(x=>{
    const urgent = x.zileRamase < 0;
    const warning = !urgent && x.zileRamase <= 10;
    const clasa = urgent ? 'urgent' : warning ? 'warning' : '';
    const textZile = urgent ? `Expirat de ${Math.abs(x.zileRamase)} zile` : `${x.zileRamase} zile rămase`;
    return `<li class="alert-item ${clasa}">
      <div>
        <div class="alert-car">${x.masina}</div>
        <div class="alert-detail">${x.tip}</div>
      </div>
      <div class="alert-days">${textZile}</div>
    </li>`;
  }).join('');

  // widget generator: valori simple in DOM
  document.getElementById('genOre').textContent = formatGeneratorNumber(dateGenerator.oreFunctionare);
  document.getElementById('genMotorina').textContent = formatGeneratorNumber(dateGenerator.motorinaLitri) + ' L';
  document.getElementById('genPorniri').textContent = dateGenerator.porniri;
  updateGeneratorLiveStatus(dateGenerator.activeStart);

  // bara de progres maintenance la 100h
  const procentMentenanta = Math.min(100, (dateGenerator.oreMaintenance / dateGenerator.pragMaintenance) * 100);
  const fillEl = document.getElementById('maintenanceFill');
  fillEl.style.width = procentMentenanta + '%';
  fillEl.classList.remove('warning','danger');
  document.getElementById('maintenanceText').textContent = `${Math.max(0, dateGenerator.pragMaintenance - dateGenerator.oreMaintenance).toFixed(1)}h`;
}

// ============================================================
// TAB 3: PLATI (retururi de facut catre clienti/furnizori)
// ============================================================

let datePlati = [];
let managerUserId = null;

function escapeHtml(value){
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDataPlati(value){
  const d = parseDataFlex(value);
  if(!d) return '—';
  return d.toLocaleDateString('ro-RO', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '.');
}

async function fetchDatePlati(){
  try{
    const { data, error } = await sb
      .from('plati_manager')
      .select('id, beneficiar, iban, suma, motiv, status, data_crearii, data_platii, platit_de')
      .order('data_crearii', { ascending:false });

    if(error) throw error;

    return (Array.isArray(data) ? data : [])
      .sort((a,b)=>{
        const aPlatit = a.status === 'platit' ? 1 : 0;
        const bPlatit = b.status === 'platit' ? 1 : 0;
        if(aPlatit !== bPlatit) return aPlatit - bPlatit;
        return (parseDataFlex(b.data_crearii)?.getTime() || 0) - (parseDataFlex(a.data_crearii)?.getTime() || 0);
      });
  } catch(error){
    console.error('Eroare plati_manager:', error);
    alert('Nu s-au putut încărca cererile de plată.');
    return [];
  }
}

async function initPlati(){
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();
  if(sessionError){
    console.error('Eroare sesiune Plăți:', sessionError);
    alert('Nu s-a putut identifica utilizatorul autentificat.');
    return;
  }
  managerUserId = sessionData?.session?.user?.id || null;
  datePlati = await fetchDatePlati();
  randeazaTabelPlati();
}

function badgeStatusPlata(status){
  const normalized = String(status || 'neplatit').toLowerCase();
  const cls = normalized === 'platit' ? 'platit' : 'neplatit';
  return `<span class="pay-status-badge ${cls}">${escapeHtml(normalized)}</span>`;
}

async function copiazaTextPlata(value, element){
  try{
    await navigator.clipboard.writeText(String(value || ''));
    const original = element.textContent;
    element.textContent = 'Copiat';
    setTimeout(()=>{ element.textContent = original; }, 900);
  } catch(error){
    console.error('Eroare copiere în clipboard:', error);
    alert('Nu s-a putut copia în clipboard.');
  }
}

function randeazaTabelPlati(){
  const tbody = document.querySelector('#tablePlati tbody');
  tbody.innerHTML = datePlati.length ? datePlati.map((x)=>{
    const status = String(x.status || 'neplatit').toLowerCase();
    const markPaidBtn = status === 'neplatit'
      ? `<button class="table-action-btn pay" data-action="mark-paid" data-id="${x.id}">Marchează plătit</button>`
      : '';
    return `<tr>
      <td><button class="copy-cell-btn" data-copy="${escapeHtml(x.beneficiar)}">${escapeHtml(x.beneficiar)}</button></td>
      <td class="iban-text"><button class="copy-cell-btn iban-text" data-copy="${escapeHtml(x.iban)}">${escapeHtml(x.iban)}</button></td>
      <td>${formatLei(Number(x.suma) || 0)}</td>
      <td>${escapeHtml(x.motiv)}</td>
      <td>${badgeStatusPlata(status)}</td>
      <td>${formatDataPlati(x.data_crearii)}</td>
      <td>
        <div class="table-actions">
          ${markPaidBtn}
        </div>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="empty-cell">Nu există cereri de plată.</td></tr>`;

  tbody.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if(action === 'mark-paid') await marcheazaPlataPlatita(id);
    });
  });

  tbody.querySelectorAll('[data-copy]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      await copiazaTextPlata(btn.dataset.copy, btn);
    });
  });
}

async function reincarcaPlatiDupaSucces(){
  datePlati = await fetchDatePlati();
  randeazaTabelPlati();
}

async function marcheazaPlataPlatita(id){
  if(!managerUserId){
    alert('Nu s-a putut identifica utilizatorul autentificat.');
    return;
  }

  try{
    const { error } = await sb
      .from('plati_manager')
      .update({
        status: 'platit',
        data_platii: new Date().toISOString(),
        platit_de: managerUserId
      })
      .eq('id', id);

    if(error) throw error;
    await reincarcaPlatiDupaSucces();
  } catch(error){
    console.error('Eroare marcare plată ca plătită:', error);
    alert('Nu s-a putut marca plata ca plătită.');
  }
}

// ============================================================
// CAUTARE GLOBALA — cauta live in toate seturile de date
// ============================================================
function initCautareGlobala(){
  const input = document.getElementById('globalSearch');
  const rezultateBox = document.getElementById('searchResults');

  input.addEventListener('input', ()=>{
    const q = input.value.trim().toLowerCase();
    if(q.length < 2){
      rezultateBox.classList.remove('show');
      rezultateBox.innerHTML = '';
      return;
    }
    const rezultate = cautaPesteTot(q);
    afiseazaRezultate(rezultate, rezultateBox);
  });

  // inchide dropdown-ul cand se da click in afara lui
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.search-wrap')) rezultateBox.classList.remove('show');
  });
}

// construieste un index simplu peste toate sursele de date si filtreaza dupa "q"
function cautaPesteTot(q){
  const rezultate = [];

  dateAwb.forEach(x=>{
    const nrAwb = String(x.nr_awb || '').toLowerCase();
    const curier = String(x.curier || '').toLowerCase();
    const numeClient = String(x.nume_client || '').toLowerCase();
    const piesa = String(x.piesa || '').toLowerCase();
    if(nrAwb.includes(q) || curier.includes(q) || numeClient.includes(q) || piesa.includes(q))
      rezultate.push({ tag:'AWB', text:`${x.nr_awb} — ${x.curier} (${formatLei(Number(x.pret) || 0)})`, tab:'financiar' });
  });

  dateConsumabile.forEach(x=>{
    const denumire = String(x.denumire || '').toLowerCase();
    if(denumire.includes(q))
      rezultate.push({ tag:'Consumabil', text:`${x.denumire} — stoc ${Number(x.stoc_actual) || 0}`, tab:'financiar' });
  });

  dateAvansuri.forEach(x=>{
    const avansId = String(x.avans_id || '').toLowerCase();
    const metodaPlata = String(x.metoda_plata || '').toLowerCase();
    const suma = String(x.suma ?? '').toLowerCase();
    if(avansId.includes(q) || metodaPlata.includes(q) || suma.includes(q))
      rezultate.push({ tag:'Plată', text:`Avans #${x.avans_id || '—'} — ${x.metoda_plata || '—'} (${formatLei(Number(x.suma) || 0)})`, tab:'financiar' });
  });

  dateDetailing.forEach(x=>{
    const nr = String(x.nr_inmatriculare || '').toLowerCase();
    const auto = String(x.autovehicul || '').toLowerCase();
    const pachet = String(x.pachet || '').toLowerCase();
    if(nr.includes(q) || auto.includes(q) || pachet.includes(q))
      rezultate.push({ tag:'Detailing', text:`${x.nr_inmatriculare || '—'} — ${x.autovehicul || x.pachet || '—'} (${formatLei(Number(x.pret_estimat) || 0)})`, tab:'financiar' });
  });

  dateMasiniLucru.forEach(x=>{
    if(x.nr.toLowerCase().includes(q) || x.mecanic.toLowerCase().includes(q))
      rezultate.push({ tag:'Mașină', text:`${x.nr} — ${x.status} (${x.mecanic})`, tab:'performanta' });
  });

  dateFleet.forEach(x=>{
    if(x.masina.toLowerCase().includes(q))
      rezultate.push({ tag:'Fleet', text:`${x.masina} — ${x.tip}`, tab:'performanta' });
  });

  datePlati.forEach(x=>{
    const beneficiar = String(x.beneficiar || '').toLowerCase();
    const motiv = String(x.motiv || '').toLowerCase();
    if(beneficiar.includes(q) || motiv.includes(q))
      rezultate.push({ tag:'Plată', text:`${x.beneficiar || '—'} — ${formatLei(Number(x.suma) || 0)}`, tab:'plati' });
  });

  return rezultate.slice(0, 8); // limitam la 8 rezultate afisate
}

function afiseazaRezultate(rezultate, box){
  box.classList.add('show');
  if(!rezultate.length){
    box.innerHTML = `<div class="search-result-empty">Niciun rezultat găsit</div>`;
    return;
  }
  box.innerHTML = rezultate.map(r=>`
    <div class="search-result-item" data-tab="${r.tab}">
      <span>${r.text}</span>
      <span class="search-result-tag">${r.tag}</span>
    </div>`).join('');

  // click pe un rezultat = sare direct in tabul unde apare acel element
  box.querySelectorAll('.search-result-item').forEach(item=>{
    item.addEventListener('click', ()=>{
      activeazaTab(item.dataset.tab);
      box.classList.remove('show');
      document.getElementById('globalSearch').value = '';
    });
  });
}

// ============================================================
// OPTIUNI COMUNE PENTRU GRAFICE (tema dark, consistenta)
// ============================================================
function optiuniGraficStandard(unitate){
  return {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{
      legend:{
        labels:{ color:'#c9c9cd', font:{ family:'Inter', size:12 } } // text legenda alb-gri
      }
    },
    scales:{
      x:{
        ticks:{ color:'#8a8a90' },
        grid:{ color:'#232326' }             // linii grid discrete
      },
      y:{
        ticks:{
          color:'#8a8a90',
          callback:(val)=> unitate==='Lei' ? val.toLocaleString('ro-RO') : val
        },
        grid:{ color:'#232326' }
      }
    }
  };
}

// ============================================================
// PORNIRE GENERALA
// ============================================================
document.addEventListener('DOMContentLoaded', async ()=>{
  const profil = await verificaAccesManager();
  if (!profil) return;

  try {
    porniceasLive();
    initTabs();
    await initFinanciar();      // acum face fetch real din Supabase, asteptam sa termine
    await initPerformanta();
    await initPlati();
    initCautareGlobala();
  } catch (error) {
    console.error(error);
    alert(`A apărut o eroare la inițializarea Manager Dashboard: ${error.message || 'eroare necunoscută'}`);
  }
});
