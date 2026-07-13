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
      .select('id, nume, prenume, porecla, rol_id')
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

    if (profil.rol_id !== 1 && profil.rol_id !== 2) {
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

// -- date fictive: numar masini intrate pe departament / luna --
const dateDepartamente = {
  luni: ['Apr','Mai','Iun','Iul'],
  detailing:  [8, 11, 9, 14],
  constatari: [15, 18, 16, 21],
};

// -- date fictive: inlocuieste cu SELECT + GROUP BY nr_inmatriculare din istoricul de vizite --
const dateRecurente = [
  { nrInmatriculare:'CT24ABC', vizite:6 },
  { nrInmatriculare:'CJ12ABC', vizite:5 },
  { nrInmatriculare:'CJ33XYZ', vizite:3 },
  { nrInmatriculare:'CT11DEF', vizite:2 },
];

// -- date fictive: inlocuieste cu SELECT din tabelul masini_in_lucru / constatari --
const dateMasiniLucru = [
  { nr:'CT11ABC', dataIntrare:'11.07.2026', status:'În lucru',      mecanic:'Andrei P.' },
  { nr:'CJ45XYZ', dataIntrare:'12.07.2026', status:'Așteaptă piese', mecanic:'Mihai T.'  },
  { nr:'CT24ABC', dataIntrare:'09.07.2026', status:'Finalizat',      mecanic:'Andrei P.' },
  { nr:'CJ88DEF', dataIntrare:'13.07.2026', status:'Diagnoză',       mecanic:'Vlad R.'   },
];

// -- date fictive: inlocuieste cu SELECT din tabelul masini firma --
const dateFleet = [
  { masina:'Dacia Duster - CJ 12 ABC', tip:'ITP', zileRamase:-3 },
  { masina:'VW Transporter - CJ 45 XYZ', tip:'RCA', zileRamase:5 },
  { masina:'Ford Transit - CJ 88 DEF', tip:'Rovinieta', zileRamase:12 },
];

// -- date fictive: inlocuieste cu SELECT din tabelul generator --
const dateGenerator = { oreFunctionare:26, motorinaLitri:18, porniri:6, pragMaintenance:100 };

function initPerformanta(){
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
    const clasaStatus = x.status==='Finalizat' ? 'status-livrat' : x.status==='Așteaptă piese' ? 'status-retur' : 'status-lucru';
    return `<tr>
      <td>${x.nr}</td>
      <td>${x.dataIntrare}</td>
      <td><span class="status-pill-sm ${clasaStatus}">${x.status}</span></td>
      <td>${x.mecanic}</td>
      <td><a class="btn-link" href="constatari.html?nr=${x.nr}">→ Constatări</a></td>
    </tr>`;
  }).join('');

  // lista top masini recurente
  const listaRecurente = document.getElementById('listRecurente');
  listaRecurente.innerHTML = dateRecurente
    .sort((a,b)=>b.vizite - a.vizite)
    .map(x=>`
      <li class="alert-item">
        <div class="alert-car">${x.nrInmatriculare}</div>
        <div class="alert-count">${x.vizite}×</div>
      </li>`).join('');

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
  document.getElementById('genOre').textContent = dateGenerator.oreFunctionare;
  document.getElementById('genMotorina').textContent = dateGenerator.motorinaLitri + ' L';
  document.getElementById('genPorniri').textContent = dateGenerator.porniri;

  // bara de progres maintenance la 100h
  const procentMentenanta = Math.min(100, (dateGenerator.oreFunctionare / dateGenerator.pragMaintenance) * 100);
  const fillEl = document.getElementById('maintenanceFill');
  fillEl.style.width = procentMentenanta + '%';
  fillEl.classList.remove('warning','danger');
  if(procentMentenanta >= 90) fillEl.classList.add('danger');        // aproape/depasit pragul
  else if(procentMentenanta >= 70) fillEl.classList.add('warning');  // se apropie de prag
  document.getElementById('maintenanceText').textContent = `${dateGenerator.oreFunctionare} / ${dateGenerator.pragMaintenance}h`;
}

// ============================================================
// TAB 3: PLATI (retururi de facut catre clienti/furnizori)
// ============================================================

// -- date fictive: inlocuieste cu SELECT din tabelul plati_retur --
let datePlati = [
  { nume:'Ionescu Andrei', iban:'RO49AAAA1B31007593840000', suma:610,  motiv:'Retur AWB-1039 - piesă greșită', platit:false },
  { nume:'PieseExpress SRL', iban:'RO12BBBB1B31009999990001', suma:250, motiv:'Diferență cost consumabile facturate în plus', platit:true },
  { nume:'Popescu Mihai',  iban:'RO77CCCC1B31005551230002', suma:1200, motiv:'Anulare comandă detailing', platit:false },
];

function initPlati(){
  randeazaTabelPlati();
}

function randeazaTabelPlati(){
  const tbody = document.querySelector('#tablePlati tbody');
  tbody.innerHTML = datePlati.map((x,i)=>{
    const clasaBtn = x.platit ? 'platit' : 'neplatit';
    const textBtn  = x.platit ? '✓ Plătit' : 'Neplătit';
    return `<tr>
      <td>${x.nume}</td>
      <td class="iban-text">${x.iban}</td>
      <td>${formatLei(x.suma)}</td>
      <td>${x.motiv}</td>
      <td><button class="pay-status-btn ${clasaBtn}" data-index="${i}">${textBtn}</button></td>
    </tr>`;
  }).join('');

  // click pe buton = toggle status platit/neplatit (local, pana se leaga la Supabase)
  tbody.querySelectorAll('.pay-status-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = Number(btn.dataset.index);
      datePlati[idx].platit = !datePlati[idx].platit;
      randeazaTabelPlati(); // re-randeaza tabelul cu noul status
    });
  });
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
    if(x.nume.toLowerCase().includes(q) || x.motiv.toLowerCase().includes(q))
      rezultate.push({ tag:'Plată', text:`${x.nume} — ${formatLei(x.suma)}`, tab:'plati' });
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
    initPerformanta();
    initPlati();
    initCautareGlobala();
  } catch (error) {
    console.error(error);
    alert(`A apărut o eroare la inițializarea Manager Dashboard: ${error.message || 'eroare necunoscută'}`);
  }
});
