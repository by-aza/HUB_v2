"use strict";

/* data fixă păstrează scenariile demo reproductibile */
const DEMO_TODAY = "2026-10-04";
/* procent unic pentru textul, indicatorul și lățimea benzii de dezvoltare */
const MODULE_PROGRESS = 70;

/* clienții, vehiculele, reminderele și istoricul sunt date fictive în memorie */
const initialClients = [
  {id:11,name:"Ion Popescu",phone:"0722 111 222",email:"ion.popescu@example.test",channels:["WhatsApp","Email"],consent:true,timing:[30,15,5,0],notes:["Preferă programările dimineața.","Confirmă lucrările suplimentare prin telefon."],notificationHistory:[{date:"03.10.2026 09:10",reason:"ITP · 5 zile",channel:"WhatsApp",status:"Livrat"}],vehicles:[
    {id:1101,make:"Dacia",model:"Duster",year:2020,plate:"CT11AAA",vin:"UU1HSDCJ6L1234101",reminders:[{type:"ITP",date:"2026-10-09"},{type:"RCA",date:"2027-01-20"}],service:[{id:"s1101a",date:"2026-09-28",type:"Constatări v2",description:"Verificare tren față și sistem frânare",status:"Finalizat"},{id:"s1101b",date:"2026-09-25",type:"Deviz",description:"Deviz final DF-184 pentru revizie",status:"Acceptat"},{id:"s1101c",date:"2026-08-11",type:"Vizită service",description:"Revizie periodică 84.200 km",status:"Închis"}]},
    {id:1102,make:"Volkswagen",model:"Golf",year:2018,plate:"CT11BBB",vin:"WVWZZZAUZJW123102",reminders:[{type:"Revizie",date:"2026-11-18"}],service:[{id:"s1102a",date:"2026-07-14",type:"Deviz estimativ",description:"Estimare kit distribuție",status:"Transmis"},{id:"s1102b",date:"2026-07-13",type:"Comenzi Piese SH",description:"Solicitare alternator",status:"Livrat"}]},
    {id:1103,make:"BMW",model:"X3",year:2022,plate:"CT11CCC",vin:"WBA56DP090N123103",reminders:[{type:"Schimb ulei",date:"2026-10-19"},{type:"ITP",date:"2027-06-20"}],service:[{id:"s1103a",date:"2026-10-02",type:"Vizită service",description:"Diagnoză martor motor",status:"Închis"},{id:"s1103b",date:"2026-10-01",type:"Constatări v2",description:"Eroare sondă NOx identificată",status:"Finalizat"},{id:"s1103c",date:"2026-09-30",type:"Deviz estimativ",description:"Estimare înlocuire sondă NOx",status:"În analiză"}]}
  ]},
  {id:2,name:"Miruna Ene",phone:"0733 250 614",email:"miruna.ene@example.test",channels:["Email"],consent:true,timing:[30,15,5,0],notes:["Preferă contactul după ora 10:00."],notificationHistory:[{date:"04.10.2026 07:00",reason:"RCA · ziua termenului",channel:"Email",status:"Programat"}],vehicles:[{id:201,make:"Volkswagen",model:"Golf",year:2021,plate:"CT34XYZ",vin:"WVWZZZAUZMW145632",reminders:[{type:"RCA",date:"2026-10-04"},{type:"Revizie",date:"2026-11-14"}],service:[{id:"s201",date:"2026-09-12",type:"Deviz",description:"Înlocuire plăcuțe frână",status:"Finalizat"}]}]},
  {id:3,name:"Tudor Damian",phone:"0744 361 725",email:"tudor.damian@example.test",channels:["Email"],consent:true,timing:[30,15],notificationProblem:true,notes:[],notificationHistory:[{date:"03.10.2026 08:04",reason:"RCA · 5 zile",channel:"Email",status:"Eșuat"}],vehicles:[{id:301,make:"Toyota",model:"Corolla",year:2020,plate:"CT78GHI",vin:"NMTBZ3BE70R094815",reminders:[{type:"RCA",date:"2026-10-09"}],service:[{id:"s301",date:"2026-08-20",type:"Vizită service",description:"Schimb ulei și filtre",status:"Închis"}]}]},
  {id:4,name:"Ilinca Rusu",phone:"0766 472 836",email:"ilinca.rusu@example.test",channels:["WhatsApp"],consent:true,timing:[30,5,0],notes:[],notificationHistory:[],vehicles:[{id:401,make:"Dacia",model:"Duster",year:2018,plate:"B92KLM",vin:"UU1HSDCJ659321704",reminders:[{type:"ITP",date:"2026-10-02"},{type:"RCA",date:"2026-12-02"}],service:[{id:"s401",date:"2026-06-03",type:"Constatări v2",description:"Verificare suspensie",status:"Finalizat"}]}]},
  {id:5,name:"Rareș Voicu",phone:"0755 583 947",email:"rares.voicu@example.test",channels:["WhatsApp","Email","SMS"],consent:true,timing:[15,5],notes:["Două vehicule în familie."],notificationHistory:[],vehicles:[{id:501,make:"Renault",model:"Megane",year:2017,plate:"B14RVS",vin:"VF1RFB00861247835",reminders:[{type:"Revizie",date:"2026-10-19"}],service:[]},{id:502,make:"Audi",model:"A4",year:2019,plate:"CT90RVV",vin:"WAUZZZF49KA188346",reminders:[{type:"ITP",date:"2027-05-20"}],service:[]}]},
  {id:6,name:"Sabina Petrescu",phone:"0721 694 158",email:"sabina.petrescu@example.test",channels:["SMS"],consent:true,timing:[30,15,5,0],notes:[],notificationHistory:[],vehicles:[{id:601,make:"Ford",model:"Focus",year:2016,plate:"CT56DEF",vin:"WF05XXGCC5GR27491",reminders:[{type:"Revizie",date:"2026-11-03"}],service:[]}]},
  {id:7,name:"Cezar Munteanu",phone:"",email:"",channels:["WhatsApp"],consent:true,timing:[30],notes:[],notificationHistory:[],vehicles:[{id:701,make:"Audi",model:"A4",year:2015,plate:"CT08CMN",vin:"WAUZZZ8K7FA092611",reminders:[{type:"ITP",date:"2026-10-19"}],service:[]}]},
  {id:8,name:"Oana Luca",phone:"0730 716 269",email:"oana.luca@example.test",channels:["Email","SMS"],consent:false,timing:[30,15,5],notes:["Acordul trebuie reconfirmat."],notificationHistory:[],vehicles:[{id:801,make:"Hyundai",model:"Tucson",year:2023,plate:"B123ONA",vin:"TMAJ3813DPJ149002",reminders:[{type:"RCA",date:"2026-10-24"}],service:[]}]}
];

/* avansurile au relații explicite vehicul → fișă → plăți */
const initialAdvances = [
  {id:1,vehicleId:1101,date:"2026-09-25",notes:"Rezervare piese revizie",archived:false,payments:[{id:101,amount:500,method:"Cash",date:"2026-09-25T10:15"}]},
  {id:2,vehicleId:1103,date:"2026-09-30",notes:"Diagnoză și comandă sondă NOx",archived:false,payments:[{id:201,amount:400,method:"Card",date:"2026-09-30T14:20"},{id:202,amount:450,method:"OP",date:"2026-10-02T09:05"}]},
  {id:3,vehicleId:401,date:"2026-05-29",notes:"Avans istoric arhivat",archived:true,payments:[{id:301,amount:250,method:"Cash",date:"2026-05-29T11:00"}]},
  {id:4,vehicleId:201,date:"2026-09-10",notes:"Piese sistem frânare",archived:false,payments:[{id:401,amount:300,method:"Card",date:"2026-09-10T16:40"}]}
];

let clients=structuredClone(initialClients),advances=structuredClone(initialAdvances);
let selectedClientId=11,selectedVehicleId=1101,activeDossierTab="general",activeWindow="all",activityScope="active",currentPage=1,editingClientId=null,managedVehicleId=null,editingAdvanceId=null,editingPayment={advanceId:null,paymentId:null};
let nextAdvanceId=10,nextPaymentId=1000,toastTimer=null,tableResizeTimer=null;
/* statusul de închidere financiară este separat de avansuri și se resetează la refresh */
let vehicleFinancialCompletions={};
/* configurația automatizării este încărcată exclusiv din rândul Supabase cu id 1 */
let automationSettings=null;
/* configurația și șabloanele tabului Notificări sunt cache read-only */
let realNotificationsState="idle",realNotificationsError="",realNotificationConfig=null;
const realNotificationTemplates=new Map();
/* istoricul și starea sincronizării sunt separate pentru fiecare vehicul selectat */
const realNotificationHistoryByVehicle=new Map(),realNotificationHistoryState=new Map();
/* lista principală folosește exclusiv rândurile încărcate din cele trei tabele Supabase */
let clientVehicleRows=[];
/* termenele reale sunt grupate strict după ID-ul vehiculului */
const vehicleDeadlinesByVehicle=new Map();
let clientListState="loading",clientListError="";
let selectedRealVehicleId=null;
/* cache-ul financiar real este indexat exclusiv după ID-ul vehiculului C&N */
const realAdvancesByVehicle=new Map(),realAdvancesLoadState=new Map();
/* vizitele service și starea de expandare rămân separate de fișele de avans */
const realVisitsByVehicle=new Map(),expandedRealVisitKeys=new Set(),expandedRealAdvanceNotes=new Set();
/* istoricul vehiculului păstrează separat fișele, devizele și comenzile de piese */
const realServiceHistoryByVehicle=new Map(),realVehicleEstimatesByVehicle=new Map(),realVehicleFinalEstimatesByVehicle=new Map(),realVehiclePartsByVehicle=new Map(),realServiceHistoryLoadState=new Map(),expandedRealServiceVisits=new Set(),expandedRealVehicleParts=new Set();
/* selectorul intern pornește implicit în vederea cronologică */
let activeVehicleHistoryView="timeline";
/* formularele comune intră în modul real numai când sunt deschise din dosarul Supabase */
let realAdvanceFormContext=null,realPaymentFormContext=null;
/* contextele separă formularele Supabase de datele demo din memorie */
let realClientFormContext=null,realVehicleFormClientId=null;
const optionalSchemaColumns={clienti:new Set(),clienti_vehicule:new Set()};
/* referințele DOM principale păstrează randările compacte */
const dom={search:document.getElementById("globalSearch"),kpis:document.getElementById("kpiGrid"),attention:document.getElementById("attentionGrid"),table:document.getElementById("clientsTableBody"),drawer:document.getElementById("clientDrawer"),typeFilter:document.getElementById("typeFilter"),channelFilter:document.getElementById("channelFilter"),statusFilter:document.getElementById("statusFilter"),clientModal:document.getElementById("clientModal"),vehicleModal:document.getElementById("vehicleModal"),reminderModal:document.getElementById("reminderModal"),advanceModal:document.getElementById("advanceModal"),advanceFormModal:document.getElementById("advanceFormModal"),paymentModal:document.getElementById("paymentModal"),actionModal:document.getElementById("actionModal"),clientForm:document.getElementById("clientForm"),vehicleForm:document.getElementById("vehicleForm"),reminderForm:document.getElementById("reminderForm"),advanceForm:document.getElementById("advanceForm"),paymentForm:document.getElementById("paymentForm"),toast:document.getElementById("toast")};
const automationSettingsButton=document.getElementById("automationSettingsBtn");

/* sincronizează toate reprezentările vizuale din constanta unică de progres */
function renderModuleDevelopmentProgress(){
  const progress=Math.max(0,Math.min(100,Number(MODULE_PROGRESS)||0));
  const banner=document.getElementById("moduleDevelopmentProgress");
  const title=document.getElementById("moduleProgressTitle");
  const value=document.getElementById("moduleProgressValue");
  if(!banner||!title||!value)return;
  banner.style.setProperty("--cn-module-progress",`${progress}%`);
  banner.setAttribute("aria-valuenow",String(progress));
  banner.setAttribute("aria-valuetext",`Modul funcțional ${progress}%`);
  title.textContent=`Modul în dezvoltare activă — funcțional ${progress}%`;
  value.textContent=`${progress}%`;
}

/* afișează setările doar administratorului sau utilizatorului cu permisiunea dedicată */
async function applyAutomationSettingsPermission(){
  if(!automationSettingsButton)return;
  automationSettingsButton.hidden=true;
  automationSettingsButton.style.display="none";
  try{
    const{data:{session}={},error:sessionError}=await supabaseClient.auth.getSession();
    if(sessionError)throw sessionError;
    if(!session)return;
    /* preia rolul și permisiunile utilizatorului din auth_profiles */
    const{data:profile,error:profileError}=await supabaseClient.from("auth_profiles").select("rol_id, permissions").eq("id",session.user.id).maybeSingle();
    if(profileError)throw profileError;
    const canConfigure=Number(profile?.rol_id)===1||profile?.permissions?.clienti_notificari_config===true;
    if(canConfigure){automationSettingsButton.hidden=false;automationSettingsButton.style.removeProperty("display")}
  }catch(error){
    console.error("Nu s-a putut verifica permisiunea pentru setările modulului:",error);
  }
}

/* utilitarele normalizează și formatează datele afișate */
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
const normalizePlate=value=>String(value||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
const formatMoney=value=>new Intl.NumberFormat("ro-RO",{maximumFractionDigits:2}).format(Number(value)||0)+" lei";
const formatDate=value=>value?new Intl.DateTimeFormat("ro-RO").format(new Date(`${String(value).slice(0,10)}T12:00:00`)):"—";
const formatDateTime=value=>value?new Intl.DateTimeFormat("ro-RO",{dateStyle:"short",timeStyle:"short"}).format(new Date(value)):"—";
const toLocalInput=value=>{const date=value?new Date(value):new Date();const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);return local.toISOString().slice(0,16)};
/* normalizează lista obligatorie indiferent dacă Supabase returnează array sau JSON text */
function normalizeTemplateVariables(value){
  if(Array.isArray(value))return value.map(item=>String(item).trim()).filter(Boolean);
  if(typeof value!=="string"||!value.trim())return[];
  try{const parsed=JSON.parse(value);if(Array.isArray(parsed))return parsed.map(item=>String(item).trim()).filter(Boolean)}catch{}
  return value.split(",").map(item=>item.trim()).filter(Boolean);
}
const daysUntil=date=>Math.round((new Date(`${date}T12:00:00`)-new Date(`${DEMO_TODAY}T12:00:00`))/86400000);
const getClient=(id=selectedClientId)=>clients.find(client=>client.id===Number(id));
const getVehicle=(id=selectedVehicleId)=>clients.flatMap(client=>client.vehicles).find(vehicle=>vehicle.id===Number(id));
const getSelectedVehicle=()=>getClient()?.vehicles.find(vehicle=>vehicle.id===selectedVehicleId)||getClient()?.vehicles[0];
/* numele vehiculului provine din câmpul unic marca_model, cu rezervă pentru datele demo vechi */
const vehicleMakeModel=vehicle=>String(vehicle?.marca_model||[vehicle?.make,vehicle?.model].filter(Boolean).join(" ")||"").trim();
const normalizeVin=value=>String(value||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,17);
const nextReminder=vehicle=>[...(vehicle?.reminders||[])].sort((a,b)=>a.date.localeCompare(b.date))[0]||null;
const advanceTotal=advance=>advance.payments.reduce((sum,payment)=>sum+Number(payment.amount),0);
const vehicleAdvances=(vehicleId,archived=false)=>advances.filter(item=>item.vehicleId===Number(vehicleId)&&item.archived===archived);
const vehicleTotal=vehicleId=>vehicleAdvances(vehicleId).reduce((sum,item)=>sum+advanceTotal(item),0);
const paymentCount=vehicleId=>vehicleAdvances(vehicleId).reduce((sum,item)=>sum+item.payments.length,0);
/* starea financiară nu adaugă plăți și nu modifică totalul avansurilor */
function financialStatus(vehicleId){const completion=vehicleFinancialCompletions[vehicleId];if(completion)return{label:"Achitat integral",tone:"paid",date:completion.date};if(vehicleTotal(vehicleId)>0)return{label:"Avans încasat",tone:"advance",date:null};return{label:"Fără avans",tone:"",date:null}}

/* statusul listei este derivat din acord și următorul termen */
function rowStatus(client,reminder){if(!client.consent)return"Fără acord";if(client.notificationProblem)return"Eșuat";if(!reminder)return"Activ";const days=daysUntil(reminder.date);if(days<0)return"Expirat";if(days<=5)return"Urgent";if(days<=30)return"Programat";return"Activ"}
function statusTone(status){return["Expirat","Eșuat","Fără acord"].includes(status)?"danger":status==="Urgent"?"warning":"success"}
function allRows(){return clients.flatMap(client=>client.vehicles.map(vehicle=>{const reminder=nextReminder(vehicle);return{client,vehicle,reminder,status:rowStatus(client,reminder),days:reminder?daysUntil(reminder.date):9999}}))}

/* citește toate paginile returnate de Data API fără a presupune că sunt sub limita implicită */
async function readAllSupabaseRows(table,columns){
  const pageSize=1000,rows=[];
  for(let from=0;;from+=pageSize){
    const{data,error}=await supabaseClient.from(table).select(columns).order("id",{ascending:true}).range(from,from+pageSize-1);
    if(error)throw new Error(`${table}: ${error.message}`);
    rows.push(...(data||[]));
    if((data||[]).length<pageSize)return rows;
  }
}

/* preia fișele, plățile și vizitele numai pentru vehicle_id-ul selectat */
async function loadRealVehicleAdvances(vehicleId){
  const key=String(vehicleId);
  realAdvancesLoadState.set(key,"loading");
  try{
    const[{data:advanceRows,error:advanceError},{data:visitRows,error:visitError}]=await Promise.all([
      supabaseClient
        .from("evidente_avansuri")
        .select("id, vehicle_id, nr_inmatriculare, model_masina, data_crearii, observatii, este_arhivat")
        .eq("vehicle_id",vehicleId)
        .order("data_crearii",{ascending:false}),
      supabaseClient
        .from("constatari")
        .select("id, nr_fisa, client_id, vehicle_id, nr_inmatriculare, model_masina, created_at, data_finalizarii, status")
        .eq("vehicle_id",vehicleId)
        .order("created_at",{ascending:false})
    ]);
    if(advanceError)throw advanceError;
    if(visitError)throw visitError;

    const advanceIds=(advanceRows||[]).map(item=>item.id),paymentRows=[];
    /* nu interoghează plățile când vehiculul nu are nicio fișă legată */
    if(advanceIds.length){
      const{data,error}=await supabaseClient
        .from("evidente_avansuri_plati")
        .select("id, avans_id, suma, metoda_plata, data_platii, created_at")
        .in("avans_id",advanceIds)
        .order("data_platii",{ascending:false});
      if(error)throw error;
      paymentRows.push(...(data||[]));
    }

    const paymentsByAdvance=new Map();
    paymentRows.forEach(payment=>{const paymentKey=String(payment.avans_id),items=paymentsByAdvance.get(paymentKey)||[];items.push(payment);paymentsByAdvance.set(paymentKey,items)});
    realAdvancesByVehicle.set(key,(advanceRows||[]).map(advance=>({...advance,payments:paymentsByAdvance.get(String(advance.id))||[]})));
    realVisitsByVehicle.set(key,visitRows||[]);
    realAdvancesLoadState.set(key,"ready");
  }catch(error){
    realAdvancesByVehicle.set(key,[]);realVisitsByVehicle.set(key,[]);realAdvancesLoadState.set(key,"error");
    console.error("Nu s-au putut încărca avansurile vehiculului selectat:",error);
  }
  if(String(selectedRealVehicleId)===key&&activeDossierTab==="advances"){renderRealDossier();lucide.createIcons()}
}

/* alege contactul principal și folosește primul contact disponibil doar ca rezervă */
function preferredContact(contacts,type){
  const matches=contacts.filter(contact=>String(contact.tip||"").toLowerCase()===type&&String(contact.valoare||"").trim());
  const principal=matches.find(contact=>contact.este_principal===true||contact.este_principal===1||contact.este_principal==="true");
  return String((principal||matches[0])?.valoare||"").trim();
}

/* data cea mai recentă dintre client și vehicul stabilește dacă rândul este nou */
function latestCreatedAt(...values){
  const valid=values.filter(Boolean).map(value=>({value,time:new Date(value).getTime()})).filter(item=>Number.isFinite(item.time)).sort((a,b)=>b.time-a.time);
  return valid[0]?.value||"";
}

/* profilul este complet numai dacă toate cele cinci câmpuri stabilite au valoare */
function profileVisualState(row){
  const incomplete=[row.name,row.phone,row.plate,row.vin,row.makeModel].some(value=>!String(value||"").trim());
  if(incomplete)return"incomplete";
  const createdTime=new Date(row.createdAt).getTime(),ageDays=(Date.now()-createdTime)/86400000;
  return Number.isFinite(createdTime)&&ageDays>=0&&ageDays<=5?"new":"regular";
}

/* ordonarea respectă prioritatea de completare, apoi recența pentru rândurile complete */
function sortClientVehicleRows(a,b){
  const rank={incomplete:0,new:1,regular:2},rankDiff=rank[a.profileState]-rank[b.profileState];
  if(rankDiff)return rankDiff;
  if(a.profileState!=="incomplete"){
    const dateDiff=(new Date(b.createdAt).getTime()||0)-(new Date(a.createdAt).getTime()||0);
    if(dateDiff)return dateDiff;
  }
  return a.name.localeCompare(b.name,"ro",{sensitivity:"base"})||a.plate.localeCompare(b.plate,"ro",{numeric:true});
}

/* sumarul este pregătit pentru viitoarele remindere reale, fără a crea date fictive */
function deadlineDisplayName(reminder){
  const type=String(reminder?.tip||reminder?.type||"").trim().toLowerCase();
  if(type==="personalizat")return String(reminder?.denumire||"Termen personalizat").trim();
  return{itp:"ITP",rca:"RCA",revizie:"Revizie",schimb_ulei:"Schimb ulei"}[type]||String(reminder?.denumire||reminder?.tip||reminder?.type||"Termen").trim();
}

/* etichetele statusurilor păstrează valorile DB separate de textul afișat */
function clientActivityLabel(value){return value==="inactiv"?"Inactiv":"Activ"}
function vehicleActivityLabel(value){return{activ:"Activ",vandut:"Vândut",casat:"Casat",inactiv:"Inactiv"}[value]||"Activ"}
function isOperationalRow(row){return row.clientStatus==="activ"&&row.vehicleStatus==="activ"}

/* găsește termenul calendaristic cel mai apropiat și combină egalitățile */
function nearestReminderSummary(reminders=[]){
  const today=new Date();today.setHours(0,0,0,0);
  const active=reminders.filter(reminder=>reminder?.activ!==false&&reminder?.is_active!==false&&reminder?.active!==false).map(reminder=>{
    const rawDate=reminder.data||reminder.date||reminder.data_termen,date=new Date(`${String(rawDate||"").slice(0,10)}T12:00:00`);
    return{date,rawDate:String(rawDate||"").slice(0,10),type:deadlineDisplayName(reminder)};
  }).filter(reminder=>reminder.rawDate&&Number.isFinite(reminder.date.getTime()));
  if(!active.length)return null;
  active.sort((a,b)=>Math.abs(a.date-today)-Math.abs(b.date-today)||a.date-b.date);
  const chosenDate=active[0].rawDate,matching=active.filter(reminder=>reminder.rawDate===chosenDate),days=Math.round((matching[0].date-today)/86400000);
  return{types:[...new Set(matching.map(reminder=>reminder.type).filter(Boolean))].join(" + ")||"Reminder",date:chosenDate,days,expired:days<0};
}

/* detectează coloanele opționale fără a bloca pagina pe o schemă C&N mai veche */
async function detectOptionalSchemaColumns(){
  const candidates={
    clienti:["observatii"],
    clienti_vehicule:["an_fabricatie","an","observatii"]
  };
  await Promise.all(Object.entries(candidates).flatMap(([table,columns])=>columns.map(async column=>{
    const{error}=await supabaseClient.from(table).select(`id, ${column}`).limit(1);
    if(!error)optionalSchemaColumns[table].add(column);
  })));
}

/* întoarce prima coloană instalată pentru o valoare cu denumiri istorice alternative */
function supportedColumn(table,names){return names.find(name=>optionalSchemaColumns[table].has(name))||null}

/* citește paginat numai programările active folosite în listă și la reconciliere */
async function readScheduledNotifications(clientId=null){
  const pageSize=1000,rows=[];
  for(let from=0;;from+=pageSize){
    let query=supabaseClient.from("clienti_notificari_istoric").select("id, client_id, vehicle_id, termen_id, data_termen, prag_zile, canal, status").eq("status","programata");
    if(clientId!==null)query=query.eq("client_id",clientId);
    const{data,error}=await query.order("id",{ascending:true}).range(from,from+pageSize-1);if(error)throw error;rows.push(...(data||[]));if((data||[]).length<pageSize)return rows;
  }
}

/* normalizează configurația globală în aceleași valori folosite de preferințele clientului */
function notificationEligibilityConfig(config){return{thresholds:[config?.prag_30&&30,config?.prag_15&&15,config?.prag_5&&5,config?.prag_0&&0].filter(Number.isInteger),channels:[config?.canal_whatsapp&&"whatsapp",config?.canal_email&&"email",config?.canal_sms&&"sms"].filter(Boolean)}}

/* aceeași regulă decide dacă o programare poate apărea în tab și în lista principală */
function isScheduledNotificationEligible(notification,row,config=realNotificationConfig){
  if(!notification||notification.status!=="programata"||!row||row.clientStatus!=="activ"||row.vehicleStatus!=="activ"||row.consent!==true)return false;
  const thresholds=config?.thresholds||[],channels=(config?.channels||[]).map(value=>String(value).toLowerCase()),channel=String(notification.canal||"").toLowerCase();
  if(!(row.timing||[]).includes(Number(notification.prag_zile))||!thresholds.includes(Number(notification.prag_zile)))return false;
  if(!(row.channels||[]).some(value=>String(value).toLowerCase()===channel)||!channels.includes(channel))return false;
  return channel==="email"?Boolean(row.email):["whatsapp","sms"].includes(channel)&&Boolean(row.phone);
}

/* după salvare anulează exclusiv programările care nu mai respectă preferințele curente */
async function cancelIneligibleClientNotifications(clientId){
  const[{data:client,error:clientError},{data:vehicles,error:vehiclesError},{data:contacts,error:contactsError},{data:config,error:configError},scheduled]=await Promise.all([
    supabaseClient.from("clienti").select("id, status_activitate, acord_notificari, canal_whatsapp, canal_email, canal_sms, prag_30, prag_15, prag_5, prag_0").eq("id",clientId).single(),
    supabaseClient.from("clienti_vehicule").select("id, status_vehicul").eq("client_id",clientId),
    supabaseClient.from("clienti_contacte").select("id, client_id, tip, valoare, este_principal").eq("client_id",clientId),
    supabaseClient.from("clienti_notificari_config").select("prag_30, prag_15, prag_5, prag_0, canal_whatsapp, canal_email, canal_sms").eq("id",1).single(),
    readScheduledNotifications(clientId)
  ]);
  if(clientError)throw clientError;if(vehiclesError)throw vehiclesError;if(contactsError)throw contactsError;if(configError)throw configError;
  const vehicleStatus=new Map((vehicles||[]).map(vehicle=>[String(vehicle.id),String(vehicle.status_vehicul||"activ")])),clientContacts=contacts||[];
  const eligibilityConfig=notificationEligibilityConfig(config),row={clientStatus:String(client.status_activitate||"activ"),consent:client.acord_notificari===true,channels:[client.canal_whatsapp&&"WhatsApp",client.canal_email&&"Email",client.canal_sms&&"SMS"].filter(Boolean),timing:[client.prag_30&&30,client.prag_15&&15,client.prag_5&&5,client.prag_0&&0].filter(Number.isInteger),phone:preferredContact(clientContacts,"telefon"),email:preferredContact(clientContacts,"email")};
  const cancelledIds=(scheduled||[]).filter(notification=>!isScheduledNotificationEligible(notification,{...row,vehicleStatus:vehicleStatus.get(String(notification.vehicle_id))||"inactiv"},eligibilityConfig)).map(notification=>notification.id);
  if(cancelledIds.length){const{error}=await supabaseClient.from("clienti_notificari_istoric").update({status:"anulata"}).in("id",cancelledIds).eq("status","programata");if(error)throw error}
}

/* combină relațiile client → vehicul și client → contacte într-un rând per vehicul */
async function loadClientVehicleRows(){
  clientListState="loading";clientListError="";
  /* o reîncărcare după editarea termenelor forțează recalcularea programărilor */
  realNotificationHistoryState.clear();realNotificationHistoryByVehicle.clear();renderTable();
  try{
    await detectOptionalSchemaColumns();
    const clientOptional=[...optionalSchemaColumns.clienti],vehicleOptional=[...optionalSchemaColumns.clienti_vehicule];
    const[clientRows,vehicleRows,contactRows,deadlineRows,scheduledRows,notificationConfigRow]=await Promise.all([
      readAllSupabaseRows("clienti",["id","cod_client","nume","status_activitate","created_at","acord_notificari","canal_whatsapp","canal_email","canal_sms","prag_30","prag_15","prag_5","prag_0",...clientOptional].join(", ")),
      readAllSupabaseRows("clienti_vehicule",["id","client_id","nr_inmatriculare","marca_model","serie_vin","status_vehicul","created_at",...vehicleOptional].join(", ")),
      readAllSupabaseRows("clienti_contacte","id, client_id, tip, valoare, este_principal"),
      readAllSupabaseRows("clienti_vehicule_termene","id, vehicle_id, tip, denumire, data_termen, activ, updated_at"),
      readScheduledNotifications(),
      supabaseClient.from("clienti_notificari_config").select("prag_30, prag_15, prag_5, prag_0, canal_whatsapp, canal_email, canal_sms").eq("id",1).single().then(({data,error})=>{if(error)throw error;return data})
    ]);
    const clientsById=new Map(clientRows.map(client=>[String(client.id),client]));
    const scheduledByVehicle=new Map();scheduledRows.forEach(notification=>{const key=String(notification.vehicle_id),items=scheduledByVehicle.get(key)||[];items.push(notification);scheduledByVehicle.set(key,items)});
    const listNotificationConfig=notificationEligibilityConfig(notificationConfigRow);
    vehicleDeadlinesByVehicle.clear();
    deadlineRows.forEach(deadline=>{const key=String(deadline.vehicle_id),items=vehicleDeadlinesByVehicle.get(key)||[];items.push(deadline);vehicleDeadlinesByVehicle.set(key,items)});
    const contactsByClient=new Map();
    [...contactRows].sort((a,b)=>String(a.id).localeCompare(String(b.id),"ro",{numeric:true})).forEach(contact=>{
      const key=String(contact.client_id),items=contactsByClient.get(key)||[];
      items.push(contact);contactsByClient.set(key,items);
    });
    clientVehicleRows=vehicleRows.map(vehicle=>{
      const client=clientsById.get(String(vehicle.client_id));
      if(!client)return null;
      const contacts=contactsByClient.get(String(client.id))||[];
      const channels=[
        client.canal_whatsapp&&"WhatsApp",client.canal_email&&"Email",client.canal_sms&&"SMS"
      ].filter(Boolean);
      const timing=[
        client.prag_30&&30,client.prag_15&&15,client.prag_5&&5,client.prag_0&&0
      ].filter(Number.isInteger);
      const yearColumn=supportedColumn("clienti_vehicule",["an_fabricatie","an"]);
      const clientStatus=String(client.status_activitate||"activ"),vehicleStatus=String(vehicle.status_vehicul||"activ");
      const reminders=vehicleStatus==="activ"?(vehicleDeadlinesByVehicle.get(String(vehicle.id))||[]).filter(deadline=>deadline.activ===true&&deadline.data_termen):[];
      const row={clientId:client.id,vehicleId:vehicle.id,clientStatus,vehicleStatus,code:String(client.cod_client||"").trim(),name:String(client.nume||"").trim(),phone:preferredContact(contacts,"telefon"),email:preferredContact(contacts,"email"),notes:String(client.observatii||"").trim(),channels,consent:client.acord_notificari===true,timing,plate:String(vehicle.nr_inmatriculare||"").trim(),makeModel:String(vehicle.marca_model||"").trim(),year:yearColumn?vehicle[yearColumn]||"":"",vin:String(vehicle.serie_vin||"").trim(),vehicleNotes:String(vehicle.observatii||"").trim(),createdAt:latestCreatedAt(client.created_at,vehicle.created_at),reminders};
      row.profileState=profileVisualState(row);row.nextReminder=nearestReminderSummary(row.reminders);row.hasEligibleScheduled=(scheduledByVehicle.get(String(row.vehicleId))||[]).some(notification=>isScheduledNotificationEligible(notification,row,listNotificationConfig));return row;
    }).filter(Boolean).sort(sortClientVehicleRows);
    const scopedRows=clientVehicleRows.filter(row=>activityScope==="all"||(activityScope==="active"?isOperationalRow(row):!isOperationalRow(row)));
    selectedRealVehicleId=scopedRows.some(row=>String(row.vehicleId)===String(selectedRealVehicleId))?selectedRealVehicleId:scopedRows[0]?.vehicleId||null;
    clientListState="ready";
  }catch(error){
    clientVehicleRows=[];selectedRealVehicleId=null;clientListState="error";clientListError="Nu s-au putut încărca datele din Supabase.";
    console.error("Eroare la încărcarea listei de clienți și vehicule:",error);
  }
  currentPage=1;renderTable();if(clientListState==="ready")renderRealDossier();lucide.createIcons();
}

/* căutarea listei reale compară separat numărul auto normalizat */
function filteredRows(){
  const raw=dom.search.value.toLowerCase().trim(),plateTerm=normalizePlate(dom.search.value);
  return clientVehicleRows.filter(row=>{
    const fields=[row.name,row.phone,row.email,row.vin,row.makeModel,row.code].map(value=>String(value||"").toLowerCase());
    const searchOk=!raw||fields.some(value=>value.includes(raw))||(plateTerm&&normalizePlate(row.plate).includes(plateTerm));
    const activityOk=activityScope==="all"||(activityScope==="active"?isOperationalRow(row):!isOperationalRow(row));
    return searchOk&&activityOk;
  });
}

/* KPI-urile includ sumele active, fără fișele arhivate */
function renderKpis(){const rows=allRows(),activeReceived=advances.filter(item=>!item.archived).reduce((sum,item)=>sum+advanceTotal(item),0);const items=[["users", "Clienți",clients.length,"în memoria demo",""],["car-front","Vehicule",rows.length,"rânduri client + vehicul",""],["calendar-clock","Termene ≤ 30 zile",rows.filter(row=>row.days>=0&&row.days<=30).length,"inclusiv astăzi","warning"],["banknote","Avansuri încasate",formatMoney(activeReceived),`${advances.filter(item=>!item.archived).length} fișe active`,"success"]];dom.kpis.innerHTML=items.map(([icon,label,value,note,tone])=>`<article class="cn-kpi ${tone}"><span class="cn-kpi-icon"><i data-lucide="${icon}"></i></span><div class="cn-kpi-copy"><span>${label}</span><strong>${value}</strong><small>${note}</small></div></article>`).join("")}

/* cardurile de atenție selectează direct rândul relevant */
function renderAttention(){const items=[];allRows().forEach(row=>{if(row.days<0)items.push({...row,title:`${row.reminder.type} expirat`});else if(row.days<=5)items.push({...row,title:row.days===0?`${row.reminder.type} expiră astăzi`:`${row.reminder.type} în ${row.days} zile`})});clients.filter(client=>client.notificationProblem||!client.consent).forEach(client=>items.push({client,vehicle:client.vehicles[0],title:client.notificationProblem?"Notificare eșuată":"Acord lipsă"}));const visible=items.slice(0,5);document.getElementById("attentionCount").textContent=items.length;dom.attention.innerHTML=visible.map(item=>`<button class="cn-attention-card" data-select-client="${item.client.id}" data-select-vehicle="${item.vehicle.id}"><i data-lucide="triangle-alert"></i><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.client.name)} · ${escapeHtml(item.vehicle.plate)}</small></span></button>`).join("")||"<span class='cn-preview-message'>Nicio excepție.</span>"}

/* numărul de rânduri folosește înălțimea reală a zonei de tabel */
function calculateRowsPerPage(){const tableWrap=document.querySelector(".cn-table-wrap"),measuredHeight=tableWrap?.clientHeight||Math.max(240,(window.innerHeight||900)-470),measuredRow=dom.table.querySelector("tr")?.getBoundingClientRect().height||49,headerHeight=36;return Math.max(4,Math.min(24,Math.floor((measuredHeight-headerHeight)/measuredRow)))}
/* tabelul păstrează câte un rând pentru fiecare vehicul și paginare adaptivă */
/* starea centrală explică explicit încărcarea, eroarea sau lipsa rezultatelor */
function renderListState(kind){
  const emptyState=document.getElementById("emptyState"),content={
    loading:['<span class="cn-list-spinner" aria-hidden="true"></span>',"Se încarcă datele...","Citirea clienților și vehiculelor din Supabase."],
    error:['<i data-lucide="circle-alert"></i>',"Eroare la încărcare",clientListError||"Datele nu au putut fi citite."],
    empty:['<i data-lucide="search-x"></i>',"Niciun rezultat","Nu există vehicule pentru căutarea curentă."]
  }[kind];
  emptyState.classList.toggle("is-error",kind==="error");emptyState.innerHTML=`${content[0]}<strong>${content[1]}</strong><span>${escapeHtml(content[2])}</span>`;emptyState.hidden=false;
}

/* cele trei celule ale termenului rămân neutre până la conectarea backend-ului de remindere */
function reminderTableCells(row){
  const reminder=row.nextReminder;
  if(!reminder)return'<td><span class="cn-reminder-summary"><strong>—</strong><small>Fără reminder activ</small></span></td><td><span class="cn-date"><strong>—</strong><small>—</small></span></td><td><span class="cn-status-placeholder">—</span></td>';
  const dayLabel=reminder.days===0?"Astăzi":reminder.expired?`${Math.abs(reminder.days)} zile depășit`:`${reminder.days} zile`;
  return`<td><span class="cn-reminder-summary"><strong>${escapeHtml(reminder.types)}</strong><small>Cel mai apropiat termen activ</small></span></td><td><span class="cn-date"><strong>${formatDate(reminder.date)}</strong><small>${dayLabel}</small></span></td><td>${row.hasEligibleScheduled?'<span class="cn-status success">Programat</span>':'<span class="cn-status-placeholder">—</span>'}</td>`;
}

/* tabelul principal redă exclusiv vehiculele încărcate din Supabase */
function renderTable(){
  const emptyState=document.getElementById("emptyState"),pagination=document.getElementById("pagination");
  if(clientListState!=="ready"){
    dom.table.innerHTML="";renderListState(clientListState);document.getElementById("visibleCount").textContent="0";document.getElementById("allRowsCount").textContent="0";document.getElementById("clientTotal").textContent="";pagination.innerHTML="";return;
  }
  const rows=filteredRows(),rowsPerPage=calculateRowsPerPage(),pages=Math.max(1,Math.ceil(rows.length/rowsPerPage));
  currentPage=Math.min(currentPage,pages);const shown=rows.slice((currentPage-1)*rowsPerPage,currentPage*rowsPerPage);
  const stateLabels={incomplete:"Profil de completat",new:"Client sau vehicul nou",regular:"Profil complet"};
  dom.table.innerHTML=shown.map(row=>`<tr tabindex="0" class="cn-real-data-row ${String(row.vehicleId)===String(selectedRealVehicleId)?"is-selected":""}" data-select-real-vehicle="${escapeHtml(row.vehicleId)}"><td><strong class="cn-client-name is-${row.profileState}" title="${stateLabels[row.profileState]}">${escapeHtml(row.name||"—")}</strong></td><td>${escapeHtml(row.phone||"—")}</td><td><strong class="cn-plate">${escapeHtml(row.plate||"—")}</strong></td><td>${escapeHtml(row.makeModel||"—")}</td>${reminderTableCells(row)}</tr>`).join("");
  if(rows.length)emptyState.hidden=true;else renderListState("empty");
  document.getElementById("visibleCount").textContent=shown.length;document.getElementById("allRowsCount").textContent=rows.length;document.getElementById("clientTotal").textContent=`${new Set(clientVehicleRows.map(row=>String(row.clientId))).size} clienți`;pagination.innerHTML=rows.length?Array.from({length:pages},(_,index)=>`<button class="${index+1===currentPage?"is-active":""}" data-page="${index+1}">${index+1}</button>`).join(""):"";
}

/* antetul dosarului real păstrează vehiculul curent și navigarea între file */
function realDossierHeader(row){
  const tabs=[["general","General"],["advances","Avansuri"],["service","Istoric service"],["notifications","Notificări"]];
  const activityBadges=`${row.clientStatus!=="activ"?`<em class="cn-activity-badge is-inactive">Client ${escapeHtml(clientActivityLabel(row.clientStatus))}</em>`:""}${row.vehicleStatus!=="activ"?`<em class="cn-activity-badge is-inactive">Vehicul ${escapeHtml(vehicleActivityLabel(row.vehicleStatus))}</em>`:""}`;
  return`<header class="cn-dossier-header"><div class="cn-dossier-title"><div><span class="cn-eyebrow">DOSAR CLIENT</span><h2 class="cn-client-name is-${row.profileState}">${escapeHtml(row.name||"—")}</h2><p class="cn-client-code">${escapeHtml(row.code||"Cod client indisponibil")}</p><div class="cn-dossier-activity">${activityBadges}</div></div><button type="button" class="cn-dossier-edit-button" data-action="edit-real-client"><i data-lucide="pencil"></i> Editare</button></div><div class="cn-selected-vehicle"><i data-lucide="car-front"></i><span><strong>${escapeHtml(row.makeModel||"Vehicul nespecificat")}</strong><small>${escapeHtml(row.plate||"Fără număr auto")}</small></span><button type="button" class="cn-button cn-button-small cn-new-finding-button" data-action="new-real-constatare">+ Constatare nouă</button></div></header><nav class="cn-dossier-tabs">${tabs.map(([id,label])=>`<button class="${activeDossierTab===id?"is-active":""}" data-tab="${id}">${label}</button>`).join("")}</nav>`;
}

/* fila General reală păstrează datele de contact și lista de vehicule existentă */
function realGeneralTab(row,vehicles){
  const channels=row.channels?.length?row.channels:["Niciun canal selectat"];
  const timing=row.timing?.length?row.timing.map(value=>value===0?"În ziua termenului":`${value} zile`):["Nespecificat"];
  const deadlines=[...(row.reminders||[])].sort((a,b)=>String(a.data_termen).localeCompare(String(b.data_termen)));
  const deadlineRows=deadlines.map(deadline=>`<div class="cn-general-deadline"><strong>${escapeHtml(deadlineDisplayName(deadline))}</strong><span>${formatDate(deadline.data_termen)}</span></div>`).join("")||'<span class="cn-preview-message">Fără termene setate</span>';
  return`<div class="cn-tab-stack"><section class="cn-card"><div class="cn-card-header"><h3>Date de contact</h3><span class="cn-consent ${row.consent?"":"cn-no-consent"}">${row.consent?"Acord confirmat":"Fără acord"}</span></div><div class="cn-contact-grid"><div class="cn-info-row"><i data-lucide="phone"></i>${escapeHtml(row.phone||"Nespecificat")}</div><div class="cn-info-row"><i data-lucide="mail"></i>${escapeHtml(row.email||"Nespecificat")}</div></div><!-- canalele și pragurile rămân pe același rând pe desktop --><div class="cn-contact-preferences"><div class="cn-preference-group"><strong>Canale selectate</strong><div class="cn-channel-list">${channels.map(channel=>`<span class="cn-chip">${escapeHtml(channel)}</span>`).join("")}</div></div><div class="cn-preference-group cn-preference-group-right"><strong>Preferințe notificări</strong><div class="cn-timing-list">${timing.map(item=>`<span class="cn-chip">${escapeHtml(item)}</span>`).join("")}</div></div></div>${row.notes?`<p class="cn-note cn-client-observations">${escapeHtml(row.notes)}</p>`:""}</section><section class="cn-card"><div class="cn-card-header"><h3>Vehicule (${vehicles.length})</h3><button type="button" class="cn-button cn-button-small cn-button-primary" data-action="add-real-vehicle"><i data-lucide="plus"></i> Adaugă mașină</button></div><div class="cn-vehicle-list">${vehicles.map(vehicle=>`<button class="cn-vehicle-card ${String(vehicle.vehicleId)===String(row.vehicleId)?"is-selected":""}" data-select-real-vehicle="${escapeHtml(vehicle.vehicleId)}"><span><strong>${escapeHtml(vehicle.makeModel||"Vehicul nespecificat")}</strong><small>${vehicle.year?`${escapeHtml(vehicle.year)} · `:""}VIN ${escapeHtml(vehicle.vin||"nespecificat")}</small></span><span class="cn-vehicle-card-status"><strong class="cn-plate">${escapeHtml(vehicle.plate||"—")}</strong>${vehicle.vehicleStatus!=="activ"?`<em class="cn-activity-badge is-inactive">${escapeHtml(vehicleActivityLabel(vehicle.vehicleStatus))}</em>`:""}</span></button>`).join("")}</div></section><section class="cn-card cn-general-deadlines"><div class="cn-card-header"><h3>Termene · <span class="cn-plate">${escapeHtml(row.plate||"—")}</span></h3></div><div class="cn-general-deadline-list">${deadlineRows}</div></section></div>`;
}

/* totalul unei fișe reale provine exclusiv din plățile asociate în Supabase */
const realAdvanceTotal=advance=>(advance.payments||[]).reduce((sum,payment)=>sum+(Number(payment.suma)||0),0);
const realDateKey=value=>String(value||"").slice(0,10);

/* starea achitată folosește marcajele deja existente, fără un câmp nou în schemă */
function isRealAdvanceSettled(advance){
  const notes=String(advance.observatii||"").toLocaleLowerCase("ro");
  return advance.este_arhivat===true||/achitat\s+(integral|total)/.test(notes);
}

/* asocierea cu o vizită este directă când va exista cheia, iar momentan se face numai pe o dată unică */
function resolveRealAdvanceVisit(advance,visits){
  if(advance.constatare_id){
    const direct=visits.find(visit=>String(visit.id)===String(advance.constatare_id));
    if(direct)return direct;
  }
  const sameDay=visits.filter(visit=>realDateKey(visit.created_at)===realDateKey(advance.data_crearii));
  return sameDay.length===1?sameDay[0]:null;
}

/* păstrează fiecare avans ca intrare financiară independentă și atașează doar contextul vizitei */
function groupRealAdvances(vehicleId,records){
  const visits=realVisitsByVehicle.get(String(vehicleId))||[];
  return records.map(advance=>({
    key:`advance-${advance.id}`,
    visit:resolveRealAdvanceVisit(advance,visits),
    advances:[advance],
    date:advance.data_crearii
  })).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
}

/* rândul compact ascunde plățile până la click și calculează suma numai pentru avansul curent */
function realVisitCard(group,isActive){
  const advance=group.advances[0],payments=[...(advance.payments||[])].sort((a,b)=>new Date(b.data_platii||b.created_at||0)-new Date(a.data_platii||a.created_at||0));
  const total=realAdvanceTotal(advance),allArchived=advance.este_arhivat===true,settled=isRealAdvanceSettled(advance);
  const statusLabel=allArchived?"Arhivat":settled?"Achitat integral":total>0?"Avans încasat":"Fără plăți",statusTone=allArchived?"warning":settled?"paid":total>0?"advance":"";
  const title=group.visit?.nr_fisa?`Fișa ${group.visit.nr_fisa} · AV-${advance.id}`:`Avans AV-${advance.id}`,expanded=expandedRealVisitKeys.has(group.key),noteExpanded=expandedRealAdvanceNotes.has(String(advance.id)),paymentLabel=payments.length===1?"1 plată":`${payments.length} plăți`;
  /* observația principală provine exclusiv din evidente_avansuri.observatii */
  const notes=String(advance.observatii||"").replace(/(^|\n)achitat (integral|total)(?=\n|$)/gi,"\n").trim();
  return`<article class="cn-real-visit ${isActive?"is-active":""} ${allArchived?"is-archived":""}"><button type="button" class="cn-real-visit-summary" data-toggle-real-visit="${escapeHtml(group.key)}" aria-expanded="${expanded}"><span class="cn-real-visit-title"><strong>${escapeHtml(title)} · ${formatDate(group.date)}</strong><small>${formatMoney(total)} · ${paymentLabel} · ${statusLabel}</small></span><span class="cn-financial-status ${statusTone}">${statusLabel}</span><i data-lucide="chevron-down"></i></button><div class="cn-real-visit-details" ${expanded?"":"hidden"}>${notes?`<div class="cn-real-visit-note ${noteExpanded?"is-expanded":""}"><strong>Observații</strong><span class="cn-real-visit-note-text">${escapeHtml(notes)}</span><button type="button" class="cn-real-visit-note-toggle" data-toggle-real-advance-note="${escapeHtml(advance.id)}" aria-expanded="${noteExpanded}" hidden>${noteExpanded?"Vezi mai puțin":"Vezi mai mult"}</button></div>`:""}<div class="cn-payment-table-wrap"><table class="cn-payment-table"><thead><tr><th>Data</th><th>Metodă</th><th>Sumă</th></tr></thead><tbody>${payments.map(payment=>`<tr><td>${formatDateTime(payment.data_platii||payment.created_at)}</td><td>${escapeHtml(payment.metoda_plata||"—")}</td><td class="cn-money">${formatMoney(payment.suma)}</td></tr>`).join("")||'<tr><td colspan="3">Nicio plată.</td></tr>'}</tbody></table></div>${allArchived?"":`<div class="cn-real-visit-actions">${settled?"":`<button type="button" class="cn-button cn-button-small cn-button-settle" data-settle-real-advance="${escapeHtml(advance.id)}"><i data-lucide="circle-check-big"></i> Achită integral</button>`}<button type="button" class="cn-button cn-button-small cn-button-primary" data-add-real-payment="${escapeHtml(advance.id)}"><i data-lucide="plus"></i> Adaugă plată</button></div>`}</div></article>`;
}


/* afișează controlul de extindere numai când observația depășește cele trei rânduri vizibile */
function syncRealAdvanceNoteToggles(){
  document.querySelectorAll(".cn-real-visit-note").forEach(note=>{
    const text=note.querySelector(".cn-real-visit-note-text"),button=note.querySelector(".cn-real-visit-note-toggle");
    if(!text||!button)return;
    button.hidden=!note.classList.contains("is-expanded")&&text.scrollHeight<=text.clientHeight+1;
  });
}
/* fila Avansuri afișează întâi intrările compacte și suma fiecăreia, nu un total cumulat al mașinii */
function realAdvancesTab(row){
  const key=String(row.vehicleId),state=realAdvancesLoadState.get(key)||"loading";
  if(state==="loading")return'<div class="cn-empty-card"><span class="cn-list-spinner" aria-hidden="true"></span><strong>Se încarcă avansurile...</strong></div>';
  if(state==="error")return'<div class="cn-empty-card cn-real-advances-error">Avansurile nu au putut fi încărcate.</div>';
  const records=realAdvancesByVehicle.get(key)||[],groups=groupRealAdvances(row.vehicleId,records),activeGroup=groups.find(group=>!group.advances.every(isRealAdvanceSettled)&&!group.advances.every(advance=>advance.este_arhivat===true));
  return`<div class="cn-tab-stack"><section class="cn-card cn-real-advances-head"><div class="cn-card-header"><div><h3>Avansuri · <span class="cn-plate">${escapeHtml(row.plate||"—")}</span></h3><span class="cn-preview-message">${groups.length} ${groups.length===1?"intrare financiară":"intrări financiare"}</span></div><button type="button" class="cn-button cn-button-primary" data-action="new-real-advance"><i data-lucide="plus"></i> Avans</button></div></section><div class="cn-real-visits">${groups.map(group=>realVisitCard(group,group===activeGroup)).join("")||'<div class="cn-empty-card">Nu există avansuri pentru acest vehicul.</div>'}</div></div>`;
}


/* preia istoricul real al vehiculului din constatări, devize și comenzi de piese */
async function loadRealServiceHistory(vehicleId){
  const key=String(vehicleId);
  realServiceHistoryLoadState.set(key,"loading");
  try{
    const row=clientVehicleRows.find(item=>String(item.vehicleId)===key),normalizedPlate=normalizePlate(row?.plate);
    const[{data:visits,error:visitsError},{data:estimates,error:estimatesError},{data:finalEstimates,error:finalEstimatesError},{data:parts,error:partsError}]=await Promise.all([
      supabaseClient.from("constatari").select("id, nr_fisa, vehicle_id, created_at, data_finalizarii, status, defectiuni_client, defectiuni_mecanic, observatii, kilometraj, km_iesire").eq("vehicle_id",vehicleId).order("created_at",{ascending:false}),
      supabaseClient.from("devize").select("id_deviz, data_deviz, nr_inmatriculare, autovehicul, total_general").eq("nr_inmatriculare",normalizedPlate).order("data_deviz",{ascending:false}),
      supabaseClient.from("deviz_final_header").select("id_deviz_final, data_deviz, nr_inmatriculare, auto, total_general").eq("nr_inmatriculare",normalizedPlate).order("data_deviz",{ascending:false}),
      supabaseClient.from("comenzi_piese_sh").select("id, data_comanda, denumire_piesa, furnizor, status, pret_piesa, pret_transport, observatii, nr_inmatriculare").eq("nr_inmatriculare",normalizedPlate).order("data_comanda",{ascending:false})
    ]);
    if(visitsError)throw visitsError;
    if(estimatesError)throw estimatesError;
    if(finalEstimatesError)throw finalEstimatesError;
    if(partsError)throw partsError;
    const visitIds=(visits||[]).map(visit=>visit.id),departmentsByVisit=new Map();
    if(visitIds.length){
      const{data:departmentRows,error:departmentsError}=await supabaseClient
        .from("constatari_departamente")
        .select("constatare_id, departament, constatari, lucrari_efectuate")
        .in("constatare_id",visitIds)
        .order("constatare_id",{ascending:false});
      if(departmentsError)console.error("Detaliile departamentale nu au putut fi încărcate pentru istoricul service:",departmentsError);
      (departmentRows||[]).forEach(item=>{
        const itemKey=String(item.constatare_id),items=departmentsByVisit.get(itemKey)||[];
        items.push(item);departmentsByVisit.set(itemKey,items);
      });
    }
    realServiceHistoryByVehicle.set(key,(visits||[]).map(visit=>Object.assign({},visit,{departments:departmentsByVisit.get(String(visit.id))||[]})));
    realVehicleEstimatesByVehicle.set(key,estimates||[]);
    realVehicleFinalEstimatesByVehicle.set(key,finalEstimates||[]);
    realVehiclePartsByVehicle.set(key,parts||[]);
    realServiceHistoryLoadState.set(key,"ready");
  }catch(error){
    realServiceHistoryByVehicle.set(key,[]);
    realVehicleEstimatesByVehicle.set(key,[]);
    realVehicleFinalEstimatesByVehicle.set(key,[]);
    realVehiclePartsByVehicle.set(key,[]);
    realServiceHistoryLoadState.set(key,"error");
    console.error("Istoricul service nu a putut fi încărcat:",error);
  }
  if(String(selectedRealVehicleId)===key&&activeDossierTab==="service"){renderRealDossier();lucide.createIcons()}
}

/* normalizează eticheta și culoarea statusului fără a inventa stări noi */
function realServiceStatus(value){
  const raw=String(value||"").trim(),key=raw.toLocaleLowerCase("ro-RO").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  if(key==="in lucru")return{label:"În lucru",tone:"advance"};
  if(key==="asteptare piese")return{label:"Așteptare piese",tone:"warning"};
  if(key==="finalizat")return{label:"Finalizat",tone:"paid"};
  if(key==="arhivat")return{label:"Arhivat",tone:""};
  return{label:raw||"Status nespecificat",tone:""};
}

/* extrage un rezumat scurt din prima informație utilă a vizitei */
function realServiceSummary(visit){
  const source=[visit.defectiuni_client,visit.defectiuni_mecanic,...(visit.departments||[]).map(item=>item.constatari)].find(value=>String(value||"").trim());
  const firstLine=String(source||"").split("\n").map(line=>line.trim()).find(Boolean)||"";
  return firstLine.length>105?firstLine.slice(0,104)+"…":firstLine;
}

/* construiește detaliile vizitei numai din câmpurile disponibile în constatări */
function realServiceDetailBlocks(visit){
  const unique=values=>[...new Set(values.map(value=>String(value||"").trim()).filter(Boolean))];
  const defects=unique([visit.defectiuni_mecanic,...(visit.departments||[]).map(item=>item.constatari)]);
  const works=unique((visit.departments||[]).map(item=>item.lucrari_efectuate));
  const blocks=[
    ["Reclamația clientului",unique([visit.defectiuni_client])],
    ["Constatări / defecte",defects],
    ["Lucrări",works],
    ["Observații",unique([visit.observatii])]
  ].filter(item=>item[1].length);
  return blocks.map(item=>'<div class="cn-service-detail-block"><strong>'+escapeHtml(item[0])+'</strong><span>'+item[1].map(escapeHtml).join("\n")+'</span></div>').join("");
}

/* fiecare vizită rămâne colapsată implicit și poate fi deschisă independent */
function realServiceVisitCard(visit){
  const key=String(visit.id),expanded=expandedRealServiceVisits.has(key),status=realServiceStatus(visit.status),summary=realServiceSummary(visit);
  const fileLabel=visit.nr_fisa?"Fișa "+visit.nr_fisa:"Fișa #"+visit.id;
  const finalDate=visit.data_finalizarii?'<span><small>Finalizare</small><strong>'+formatDate(visit.data_finalizarii)+'</strong></span>':"";
  return '<article class="cn-service-visit"><div class="cn-service-visit-head"><button type="button" class="cn-service-visit-summary" data-toggle-real-service="'+escapeHtml(key)+'" aria-expanded="'+expanded+'"><span><strong>'+escapeHtml(fileLabel)+' · '+formatDate(visit.created_at)+'</strong>'+(summary?'<small>'+escapeHtml(summary)+'</small>':"")+'</span></button><button type="button" class="cn-button cn-button-small cn-button-primary cn-service-open-button" data-open-real-constatare="'+escapeHtml(visit.id)+'"><i data-lucide="external-link"></i> Deschide fișa</button><span class="cn-financial-status '+status.tone+'">'+escapeHtml(status.label)+'</span><button type="button" class="cn-service-chevron" data-toggle-real-service="'+escapeHtml(key)+'" aria-label="'+(expanded?"Restrânge":"Extinde")+' '+escapeHtml(fileLabel)+'" aria-expanded="'+expanded+'"><i data-lucide="chevron-down"></i></button></div><div class="cn-service-visit-details" '+(expanded?"":"hidden")+'><div class="cn-service-meta"><span><small>Intrare</small><strong>'+formatDate(visit.created_at)+'</strong></span>'+finalDate+'<span><small>Status</small><strong>'+escapeHtml(status.label)+'</strong></span></div>'+realServiceDetailBlocks(visit)+'</div></article>';
}

/* datele flexibile din tabele sunt transformate într-o valoare sigură pentru sortare */
function vehicleHistoryTimestamp(value){
  const raw=String(value||"").trim(),romanian=raw.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
  const parsed=romanian?new Date(Number(romanian[3]),Number(romanian[2])-1,Number(romanian[1])).getTime():new Date(raw).getTime();
  return Number.isFinite(parsed)?parsed:0;
}

/* formatarea dedicată acceptă atât date ISO, cât și valorile istorice zi-lună-an */
function formatVehicleHistoryDate(value){
  const timestamp=vehicleHistoryTimestamp(value);
  return timestamp?new Intl.DateTimeFormat("ro-RO").format(new Date(timestamp)):"—";
}

/* statusurile comenzilor sunt afișate lizibil fără să fie modificate în bază */
function vehiclePartStatus(value){
  const raw=String(value||"").trim();
  return raw?raw.replaceAll("_"," ").replace(/^./,letter=>letter.toLocaleUpperCase("ro-RO")):"Status nespecificat";
}

/* identificatorii păstrează prefixele folosite de editoarele existente */
function formatVehicleEstimateId(type,value){
  const raw=String(value??"").trim(),numeric=raw.replace(/\D/g,"");
  if(!numeric)return raw||"—";
  return type==="final"?`DF-${numeric.padStart(3,"0")}`:`D-${numeric}`;
}

/* lista comună combină documentele estimative și finale fără a le lega artificial */
function realVehicleEstimatesView(estimates,finalEstimates){
  const documents=[
    ...estimates.map(item=>({type:"estimate",id:item.id_deviz,date:item.data_deviz,total:item.total_general,auto:item.autovehicul})),
    ...finalEstimates.map(item=>({type:"final",id:item.id_deviz_final,date:item.data_deviz,total:item.total_general,auto:item.auto}))
  ].sort((a,b)=>vehicleHistoryTimestamp(b.date)-vehicleHistoryTimestamp(a.date));
  return'<div class="cn-vehicle-history-list">'+(documents.map(document=>{
    const isFinal=document.type==="final",label=isFinal?"Final":"Estimativ",href=(isFinal?"deviz_final.html?id=":"deviz.html?id=")+encodeURIComponent(String(document.id));
    return'<article class="cn-vehicle-history-row"><span class="cn-history-type '+(isFinal?'is-final':'is-estimate')+'">'+label+'</span><span class="cn-vehicle-history-main"><strong>'+escapeHtml(formatVehicleEstimateId(document.type,document.id))+'</strong><small>'+formatVehicleHistoryDate(document.date)+(document.auto?' · '+escapeHtml(document.auto):"")+'</small></span><strong class="cn-money">'+formatMoney(document.total)+'</strong><a class="cn-button cn-button-small cn-button-ghost cn-estimate-open" href="'+escapeHtml(href)+'" target="_blank" rel="noopener">Deschide</a></article>';
  }).join("")||'<div class="cn-empty-card">Nu există devize pentru acest vehicul.</div>')+'</div>';
}

/* comenzile de piese afișează observațiile numai după expandare */
function realVehiclePartCard(part){
  const key=String(part.id),expanded=expandedRealVehicleParts.has(key),transport=Number(part.pret_transport)||0;
  return'<article class="cn-vehicle-part"><button type="button" class="cn-vehicle-part-summary" data-toggle-real-part="'+escapeHtml(key)+'" aria-expanded="'+expanded+'"><span><strong>'+escapeHtml(part.denumire_piesa||"Piesă fără denumire")+'</strong><small>'+formatVehicleHistoryDate(part.data_comanda)+' · '+escapeHtml(part.furnizor||"Furnizor nespecificat")+'</small></span><span class="cn-financial-status">'+escapeHtml(vehiclePartStatus(part.status))+'</span><span class="cn-vehicle-part-price"><strong>'+formatMoney(part.pret_piesa)+'</strong>'+(transport?'<small>Transport '+formatMoney(transport)+'</small>':"")+'</span><i data-lucide="chevron-down"></i></button>'+(part.observatii?'<div class="cn-vehicle-part-details" '+(expanded?'':'hidden')+'><strong>Observații</strong><span>'+escapeHtml(part.observatii)+'</span></div>':"")+'</article>';
}

/* cronologia combină sursele fără a presupune relații care nu există în bază */
function realVehicleTimeline(visits,estimates,finalEstimates,parts){
  const events=[
    ...visits.map(item=>({date:item.created_at,type:"Fișă service",tone:"is-service",label:item.nr_fisa?"Fișa "+item.nr_fisa:"Fișa #"+item.id})),
    ...estimates.map(item=>({date:item.data_deviz,type:"Deviz estimativ",tone:"is-estimate",label:formatVehicleEstimateId("estimate",item.id_deviz)})),
    ...finalEstimates.map(item=>({date:item.data_deviz,type:"Deviz final",tone:"is-final",label:formatVehicleEstimateId("final",item.id_deviz_final)})),
    ...parts.map(item=>({date:item.data_comanda,type:"Piesă comandată",tone:"is-part",label:item.denumire_piesa||"Piesă fără denumire"}))
  ].sort((a,b)=>vehicleHistoryTimestamp(b.date)-vehicleHistoryTimestamp(a.date));
  return'<div class="cn-vehicle-timeline">'+(events.map(item=>'<article class="cn-timeline-event"><time>'+formatVehicleHistoryDate(item.date)+'</time><span class="cn-history-type '+item.tone+'">'+escapeHtml(item.type)+'</span><strong>'+escapeHtml(item.label)+'</strong></article>').join("")||'<div class="cn-empty-card">Nu există evenimente în istoricul acestui vehicul.</div>')+'</div>';
}

/* selectorul intern organizează istoricul vehiculului în patru vederi compacte */
function realServiceHistoryTab(row){
  const key=String(row.vehicleId),state=realServiceHistoryLoadState.get(key)||"loading";
  if(state==="loading")return'<div class="cn-empty-card"><span class="cn-list-spinner" aria-hidden="true"></span><strong>Se încarcă istoricul service...</strong></div>';
  if(state==="error")return'<div class="cn-empty-card cn-real-advances-error">Istoricul service nu a putut fi încărcat.</div>';
  const visits=realServiceHistoryByVehicle.get(key)||[],estimates=realVehicleEstimatesByVehicle.get(key)||[],finalEstimates=realVehicleFinalEstimatesByVehicle.get(key)||[],parts=realVehiclePartsByVehicle.get(key)||[];
  const orderedParts=[...parts].sort((a,b)=>vehicleHistoryTimestamp(b.data_comanda)-vehicleHistoryTimestamp(a.data_comanda));
  const views={timeline:()=>realVehicleTimeline(visits,estimates,finalEstimates,parts),service:()=>'<div class="cn-service-visits">'+(visits.map(realServiceVisitCard).join("")||'<div class="cn-empty-card">Nu există fișe service pentru acest vehicul.</div>')+'</div>',estimates:()=>realVehicleEstimatesView(estimates,finalEstimates),parts:()=>'<div class="cn-vehicle-parts">'+(orderedParts.map(realVehiclePartCard).join("")||'<div class="cn-empty-card">Nu există comenzi de piese pentru acest vehicul.</div>')+'</div>'};
  const tabs=[["timeline","Cronologie"],["service","Fișe service"],["estimates","Devize"],["parts","Piese"]];
  return'<div class="cn-tab-stack"><section class="cn-card cn-service-history-head"><div class="cn-card-header"><div><h3>Istoric vehicul · <span class="cn-plate">'+escapeHtml(row.plate||"—")+'</span></h3><span class="cn-preview-message">'+(visits.length+estimates.length+finalEstimates.length+parts.length)+' evenimente, de la cele mai noi</span></div></div><nav class="cn-history-tabs" aria-label="Secțiuni istoric vehicul">'+tabs.map(([id,label])=>'<button type="button" class="'+(activeVehicleHistoryView===id?'is-active':'')+'" data-history-view="'+id+'">'+label+'</button>').join("")+'</nav></section>'+views[activeVehicleHistoryView]()+'</div>';
}

/* deschide Constatări v2 și transmite ID-ul fișei pentru compatibilitate cu selecția directă */
function openRealConstatare(constatareId){
  const target=new URL("../formulare/constatari_v2.html",window.location.href);
  target.searchParams.set("constatare_id",String(constatareId));
  window.open(target.toString(),"_blank","noopener");
}

/* citește configurația și șabloanele reale fără a modifica setările modulului */
async function loadRealNotificationsConfig(){
  if(realNotificationsState==="loading")return;
  realNotificationsState="loading";realNotificationsError="";
  if(activeDossierTab==="notifications")renderRealDossier();
  try{
    const supportedTypes=["itp","rca","revizie","schimb_ulei","personalizat"];
    const[{data:config,error:configError},{data:templates,error:templatesError}]=await Promise.all([
      supabaseClient.from("clienti_notificari_config").select("id, prag_30, prag_15, prag_5, prag_0, ora_rulare, canal_whatsapp, canal_email, canal_sms").eq("id",1).maybeSingle(),
      supabaseClient.from("clienti_notificari_sabloane").select("id, tip, denumire, text_mesaj, variabile_obligatorii").in("tip",supportedTypes)
    ]);
    if(configError)throw configError;if(!config)throw new Error("Configurația notificărilor lipsește.");if(templatesError)throw templatesError;
    realNotificationConfig={
      thresholds:[config.prag_30&&30,config.prag_15&&15,config.prag_5&&5,config.prag_0&&0].filter(Number.isInteger),
      channels:[config.canal_whatsapp&&"WhatsApp",config.canal_email&&"Email",config.canal_sms&&"SMS"].filter(Boolean),
      runTime:String(config.ora_rulare||"00:00").slice(0,5)
    };
    realNotificationTemplates.clear();(templates||[]).forEach(template=>realNotificationTemplates.set(String(template.tip),template));
    realNotificationsState="ready";
  }catch(error){
    realNotificationsState="error";realNotificationsError=error?.message||"Datele notificărilor nu au putut fi încărcate.";
    console.error("Configurația pentru tabul Notificări nu a putut fi încărcată:",error);
  }
  if(activeDossierTab==="notifications")renderRealDossier();lucide.createIcons();
}

/* construiește textul final care este salvat neschimbat în istoricul notificării */
function buildRealNotificationMessage(row,deadline,daysRemaining){
  const templateType=deadline.tip==="personalizat"?"personalizat":deadline.tip,template=realNotificationTemplates.get(templateType);
  if(!template)return"";
  return String(template.text_mesaj||"").replaceAll("{client}",row.name||"").replaceAll("{numar}",row.plate||"").replaceAll("{termen}",deadline.tip==="personalizat"?String(deadline.denumire||""):deadlineDisplayName(deadline)).replaceAll("{data_expirare}",formatDate(deadline.data_termen)).replaceAll("{zile_ramase}",daysRemaining===null?"—":String(daysRemaining));
}

/* calculează momentul programării la pragul ales, folosind ora globală de rulare */
function scheduledNotificationDate(deadlineDate,threshold){
  const date=new Date(`${String(deadlineDate).slice(0,10)}T12:00:00`);date.setDate(date.getDate()-Number(threshold));
  const[hours,minutes]=String(realNotificationConfig?.runTime||"00:00").split(":").map(Number);date.setHours(Number.isFinite(hours)?hours:0,Number.isFinite(minutes)?minutes:0,0,0);return date.toISOString();
}
const notificationChannelValue=channel=>String(channel||"").toLowerCase();
const notificationChannelLabel=channel=>({whatsapp:"WhatsApp",email:"Email",sms:"SMS"}[String(channel||"").toLowerCase()]||String(channel||"—"));

/* sincronizează programările eligibile și anulează doar programările cu data veche */
async function syncRealNotificationHistory(row){
  const key=String(row.vehicleId);if(realNotificationHistoryState.get(key)==="loading")return;realNotificationHistoryState.set(key,"loading");
  if(activeDossierTab==="notifications"&&String(selectedRealVehicleId)===key)renderRealDossier();
  try{
    const deadlines=(vehicleDeadlinesByVehicle.get(key)||[]).filter(deadline=>deadline.activ===true&&deadline.data_termen);
    for(const deadline of deadlines){const{error}=await supabaseClient.from("clienti_notificari_istoric").update({status:"anulata"}).eq("termen_id",deadline.id).eq("status","programata").neq("data_termen",String(deadline.data_termen).slice(0,10));if(error)throw error}
    const validChannels=realNotificationChannels(row).filter(channel=>channel.available),thresholds=(realNotificationConfig?.thresholds||[]).filter(value=>(row.timing||[]).includes(value));
    if(row.clientStatus==="activ"&&row.vehicleStatus==="activ"&&row.consent===true&&validChannels.length&&thresholds.length){
      for(const deadline of deadlines){if(!realNotificationTemplates.has(deadline.tip==="personalizat"?"personalizat":deadline.tip))continue;for(const threshold of thresholds){for(const channel of validChannels){
        const dataTermen=String(deadline.data_termen).slice(0,10),canal=notificationChannelValue(channel.name);
        /* verifică explicit combinația înainte de INSERT; indexul unic protejează și concurența */
        const{data:existing,error:existingError}=await supabaseClient.from("clienti_notificari_istoric").select("id").eq("termen_id",deadline.id).eq("data_termen",dataTermen).eq("prag_zile",threshold).eq("canal",canal).in("status",["programata","trimisa","esuata"]).limit(1);if(existingError)throw existingError;if(existing?.length)continue;
        const payload={client_id:row.clientId,vehicle_id:row.vehicleId,termen_id:deadline.id,data_termen:dataTermen,prag_zile:threshold,canal,status:"programata",mesaj:buildRealNotificationMessage(row,deadline,threshold),programata_pentru:scheduledNotificationDate(dataTermen,threshold)};
        const{error:insertError}=await supabaseClient.from("clienti_notificari_istoric").insert(payload);if(insertError&&insertError.code!=="23505")throw insertError;
      }}}
    }
    const{data:history,error:historyError}=await supabaseClient.from("clienti_notificari_istoric").select("*").eq("vehicle_id",row.vehicleId).order("created_at",{ascending:false});if(historyError)throw historyError;
    realNotificationHistoryByVehicle.set(key,history||[]);realNotificationHistoryState.set(key,"ready");
  }catch(error){realNotificationHistoryState.set(key,"error");realNotificationsError=error?.message||"Istoricul notificărilor nu a putut fi sincronizat.";console.error("Istoricul notificărilor nu a putut fi sincronizat:",error)}
  if(activeDossierTab==="notifications"&&String(selectedRealVehicleId)===key){renderRealDossier();lucide.createIcons()}
}

/* validează canalele clientului față de configurarea modulului și datele de contact */
function realNotificationChannels(row){
  const configured=new Set(realNotificationConfig?.channels||[]);
  return(row.channels||[]).filter(channel=>configured.has(channel)).map(channel=>({
    name:channel,
    available:channel==="Email"?Boolean(row.email):Boolean(row.phone),
    reason:channel==="Email"?"Lipsește emailul":"Lipsește telefonul"
  }));
}

/* calculează numărul calendaristic de zile până la termen */
function realNotificationDays(dateValue){
  const target=new Date(`${String(dateValue||"").slice(0,10)}T12:00:00`),today=new Date();today.setHours(12,0,0,0);
  return Number.isFinite(target.getTime())?Math.round((target-today)/86400000):null;
}

/* eligibilitatea păstrează motivele de blocare înaintea ferestrei de prag */
function realNotificationEvaluation(row,deadline,validChannels){
  const days=realNotificationDays(deadline.data_termen);
  if(row.clientStatus!=="activ")return{label:"Client inactiv",tone:"muted",days};
  if(row.vehicleStatus!=="activ")return{label:"Vehicul inactiv",tone:"muted",days};
  if(row.consent!==true)return{label:"Fără acord",tone:"danger",days};
  if(!validChannels.length)return{label:"Fără canal",tone:"danger",days};
  if(days===null)return{label:"Dată invalidă",tone:"danger",days};
  if(days<0)return{label:"Expirat",tone:"danger",days};
  const thresholds=(realNotificationConfig?.thresholds||[]).filter(threshold=>(row.timing||[]).includes(threshold)),withinWindow=thresholds.some(threshold=>threshold>0&&days<=threshold);
  if(days===0)return thresholds.includes(0)?{label:"Expiră azi",tone:"warning",days}:{label:"În afara pragurilor",tone:"muted",days};
  return{label:withinWindow?"Programabil":"În afara pragurilor",tone:withinWindow?"success":"muted",days};
}

/* tabul real afișează exclusiv evaluarea termenelor, fără acțiuni de trimitere */
function realNotificationsTab(row){
  if(realNotificationsState==="idle"){loadRealNotificationsConfig();return'<div class="cn-empty-card"><span class="cn-list-spinner"></span><strong>Se încarcă notificările...</strong></div>'}
  if(realNotificationsState==="loading")return'<div class="cn-empty-card"><span class="cn-list-spinner"></span><strong>Se încarcă notificările...</strong></div>';
  if(realNotificationsState==="error")return`<div class="cn-empty-card cn-real-advances-error">${escapeHtml(realNotificationsError)}</div>`;
  const historyKey=String(row.vehicleId),historyState=realNotificationHistoryState.get(historyKey);
  if(!historyState){syncRealNotificationHistory(row);return'<div class="cn-empty-card"><span class="cn-list-spinner"></span><strong>Se generează programările...</strong></div>'}
  if(historyState==="loading")return'<div class="cn-empty-card"><span class="cn-list-spinner"></span><strong>Se sincronizează programările...</strong></div>';
  if(historyState==="error")return`<div class="cn-empty-card cn-real-advances-error">${escapeHtml(realNotificationsError)}</div>`;
  const channels=realNotificationChannels(row),thresholds=(realNotificationConfig.thresholds||[]).filter(value=>(row.timing||[]).includes(value));
  const allSelected=(row.channels||[]).map(name=>channels.find(channel=>channel.name===name)||{name,available:false});
  const channelChips=allSelected.map(channel=>`<span class="cn-notification-channel ${channel.available?"is-available":"is-unavailable"}">${escapeHtml(channel.name)}${channel.available?"":" · indisponibil"}</span>`).join("")||'<span class="cn-preview-message">Niciun canal selectat</span>';
  const thresholdChips=thresholds.map(value=>`<span class="cn-chip">${value===0?"În ziua termenului":value+" zile"}</span>`).join("")||'<span class="cn-preview-message">Niciun prag activ</span>';
  const history=realNotificationHistoryByVehicle.get(historyKey)||[],deadlinesById=new Map((vehicleDeadlinesByVehicle.get(historyKey)||[]).map(deadline=>[String(deadline.id),deadline]));
  const scheduled=history.filter(item=>isScheduledNotificationEligible(item,row)).sort((a,b)=>new Date(a.programata_pentru)-new Date(b.programata_pentru));
  /* grupează vizual toate canalele după termen și dată, fără să modifice rândurile Supabase */
  const scheduledGroups=new Map();scheduled.forEach(item=>{const groupKey=[item.termen_id,String(item.data_termen).slice(0,10)].join("|");const items=scheduledGroups.get(groupKey)||[];items.push(item);scheduledGroups.set(groupKey,items)});
  const scheduledCards=[...scheduledGroups.values()].map(items=>{
    items.sort((a,b)=>new Date(a.programata_pentru)-new Date(b.programata_pentru));
    const next=items[0],deadline=deadlinesById.get(String(next.termen_id));
    const thresholdLabels=[...new Set(items.map(item=>Number(item.prag_zile)))].sort((a,b)=>b-a).map(value=>`${escapeHtml(value)} zile`).join(" • ");
    const channelLabels=[...new Set(items.map(item=>notificationChannelLabel(item.canal)))].join(" • ");
    return`<article class="cn-notification-scheduled"><h4>${escapeHtml(deadline?deadlineDisplayName(deadline):"Termen")} <span>· ${formatDate(next.data_termen)}</span></h4><div class="cn-notification-scheduled-meta"><span><strong>Praguri:</strong> ${thresholdLabels}</span><span><strong>Canale:</strong> ${escapeHtml(channelLabels)}</span><span><strong>Următoarea:</strong> ${formatDateTime(next.programata_pentru)}</span><button type="button" class="cn-notification-preview-button" data-preview-real-notification="${escapeHtml(next.termen_id)}" data-preview-threshold="${escapeHtml(next.prag_zile)}">Previzualizează mesaj</button></div></article>`;
  }).join("")||'<div class="cn-empty-card">Nu există notificări programate pentru acest vehicul.</div>';
  return`<div class="cn-tab-stack"><section class="cn-card cn-notification-summary"><div class="cn-card-header"><h3>Notificări · <span class="cn-plate">${escapeHtml(row.plate||"—")}</span></h3><span class="cn-consent ${row.consent?"":"cn-no-consent"}">Acord: ${row.consent?"Da":"Nu"}</span></div><div class="cn-notification-summary-grid"><div><strong>Vehicul</strong><span>${escapeHtml(row.makeModel||"—")}</span></div><div><strong>Canale active</strong><span class="cn-notification-chips">${channelChips}</span></div><div><strong>Praguri active</strong><span class="cn-notification-chips">${thresholdChips}</span></div></div></section><section class="cn-notification-zone"><div class="cn-notification-zone-heading"><h3>Următoare / Programabile</h3><span>${scheduledGroups.size} termene</span></div><div class="cn-notification-scheduled-list">${scheduledCards}</div></section></div>`;
}

/* preview-ul substituie numai variabilele acceptate de șabloanele existente */
function previewRealNotification(deadlineId,scheduledThreshold=null){
  const row=clientVehicleRows.find(item=>String(item.vehicleId)===String(selectedRealVehicleId));
  const deadline=(vehicleDeadlinesByVehicle.get(String(selectedRealVehicleId))||[]).find(item=>String(item.id)===String(deadlineId));
  if(!row||!deadline)return;
  const templateType=deadline.tip==="personalizat"?"personalizat":deadline.tip,template=realNotificationTemplates.get(templateType);
  if(!template){showToast("Nu există șablon pentru acest tip de termen.");return}
  const days=scheduledThreshold===null?realNotificationDays(deadline.data_termen):Number(scheduledThreshold),message=buildRealNotificationMessage(row,deadline,days);
  showActionModal(`Previzualizare · ${deadlineDisplayName(deadline)}`,"PREVIEW — NU SE TRIMITE",`<div class="cn-preview-box"><div class="cn-preview-meta"><span>Client</span><strong>${escapeHtml(row.name||"—")}</strong><span>Vehicul</span><strong>${escapeHtml(row.plate||"—")}</strong><span>Șablon</span><strong>${escapeHtml(template.denumire||templateType)}</strong></div><p class="cn-preview-message">${escapeHtml(message)}</p></div><div class="cn-simulation-note"><i data-lucide="eye"></i><span>Previzualizare locală. Nu se trimite niciun mesaj.</span></div>`);
}

/* filele neconectate rămân neutre și nu amestecă datele demo cu dosarul real */
function realUnavailableTab(label){return`<div class="cn-empty-card">${label} nu este conectat încă pentru datele reale.</div>`}

/* dosarul real păstrează fila activă și pornește citirea avansurilor numai la nevoie */
function renderRealDossier(){
  const row=clientVehicleRows.find(item=>String(item.vehicleId)===String(selectedRealVehicleId));
  if(!row){dom.drawer.innerHTML='<div class="cn-empty-card">Selectează un client.</div>';return}
  const vehicles=clientVehicleRows.filter(item=>String(item.clientId)===String(row.clientId)),key=String(row.vehicleId);
  if(activeDossierTab==="advances"&&!realAdvancesLoadState.has(key))loadRealVehicleAdvances(row.vehicleId);
  if(activeDossierTab==="service"&&!realServiceHistoryLoadState.has(key))loadRealServiceHistory(row.vehicleId);
  const content={general:()=>realGeneralTab(row,vehicles),advances:()=>realAdvancesTab(row),service:()=>realServiceHistoryTab(row),notifications:()=>realNotificationsTab(row)}[activeDossierTab]?.()||realGeneralTab(row,vehicles);
  dom.drawer.innerHTML=realDossierHeader(row)+`<div class="cn-dossier-content">${content}</div>`;
  if(activeDossierTab==="advances")requestAnimationFrame(syncRealAdvanceNoteToggles);
}

/* antetul dosarului rămâne vizibil indiferent de fila aleasă */
function dossierHeader(client,vehicle){const tabs=[["general","General"],["advances","Avansuri"],["service","Istoric service"],["notifications","Notificări"]];return`<header class="cn-dossier-header"><div class="cn-dossier-title"><div><span class="cn-eyebrow">DOSAR CLIENT</span><h2>${escapeHtml(client.name)}</h2><p>Client #${String(client.id).padStart(4,"0")}</p></div><button class="cn-icon-button" data-action="edit-client" title="Editare client"><i data-lucide="pencil"></i></button></div><div class="cn-selected-vehicle"><i data-lucide="car-front"></i><span><strong>${escapeHtml(vehicleMakeModel(vehicle)||"—")}</strong><small>${escapeHtml(vehicle?.plate||"Fără vehicul")}</small></span></div></header><nav class="cn-dossier-tabs">${tabs.map(([id,label])=>`<button class="${activeDossierTab===id?"is-active":""}" data-tab="${id}">${label}</button>`).join("")}</nav>`}

/* fila General include contact, vehicule și notițe compacte */
function generalTab(client,vehicle){return`<div class="cn-tab-stack"><section class="cn-card"><div class="cn-card-header"><h3>Date de contact</h3><span class="cn-consent ${client.consent?"":"cn-no-consent"}">${client.consent?"Acord confirmat":"Fără acord"}</span></div><div class="cn-contact-grid"><div class="cn-info-row"><i data-lucide="phone"></i>${escapeHtml(client.phone||"Nespecificat")}</div><div class="cn-info-row"><i data-lucide="mail"></i>${escapeHtml(client.email||"Nespecificat")}</div></div><div class="cn-channel-list" style="margin-top:9px">${client.channels.map(channel=>`<span class="cn-chip">${escapeHtml(channel)}</span>`).join("")}</div></section><section class="cn-card"><div class="cn-card-header"><h3>Vehicule (${client.vehicles.length})</h3><button class="cn-link-button" data-action="add-vehicle"><i data-lucide="plus"></i> Adaugă vehicul</button></div><div class="cn-vehicle-list">${client.vehicles.map(item=>`<button class="cn-vehicle-card ${item.id===vehicle.id?"is-selected":""}" data-select-client="${client.id}" data-select-vehicle="${item.id}"><span><strong>${escapeHtml(vehicleMakeModel(item))}</strong><small>${item.year||"An nespecificat"} · VIN ${escapeHtml(item.vin||"—")}</small></span><strong class="cn-plate">${escapeHtml(item.plate)}</strong></button>`).join("")}</div></section><section class="cn-card"><div class="cn-card-header"><h3>Notițe (${client.notes.length})</h3><button class="cn-link-button" data-action="add-note"><i data-lucide="plus"></i> Adaugă</button></div><div class="cn-notes-list">${client.notes.map(note=>`<p class="cn-note">${escapeHtml(note)}</p>`).join("")||'<p class="cn-note">Nicio notiță în sesiunea demo.</p>'}</div></section><div class="cn-compact-actions"><button class="cn-button cn-button-ghost" data-action="edit-client"><i data-lucide="pencil"></i>Editare client</button><button class="cn-button cn-button-ghost" data-action="add-vehicle"><i data-lucide="plus"></i>Adaugă vehicul</button></div></div>`}

/* fila Avansuri rezumă toate vehiculele clientului, independent de selecția globală */
function advancesTab(client){const total=client.vehicles.reduce((sum,vehicle)=>sum+vehicleTotal(vehicle.id),0);return`<div class="cn-tab-stack"><section class="cn-card"><div class="cn-card-header"><div><h3>Avansuri pe toate vehiculele</h3><span class="cn-preview-message">Sumele provin exclusiv din plățile active. Achitarea integrală este un status separat.</span></div></div><div class="cn-vehicle-list">${client.vehicles.map(vehicle=>{const records=vehicleAdvances(vehicle.id),payments=paymentCount(vehicle.id),status=financialStatus(vehicle.id);return`<article class="cn-advance-vehicle"><button class="cn-advance-vehicle-main" data-open-advances="${vehicle.id}"><span><strong><span class="cn-plate">${escapeHtml(vehicle.plate)}</span> — ${escapeHtml(vehicleMakeModel(vehicle))}</strong><small>${records.length} fișe · ${payments} plăți</small></span><strong class="cn-money">${formatMoney(vehicleTotal(vehicle.id))}</strong></button><div class="cn-financial-actions"><span class="cn-financial-status ${status.tone}">${status.label}</span>${status.date?`<span class="cn-financial-date">${formatDate(status.date)}</span>`:""}<button class="cn-button cn-button-small ${status.tone==="paid"?"cn-button-ghost":"cn-button-primary"}" data-toggle-financial="${vehicle.id}">${status.tone==="paid"?"Anulează achitarea":"Marchează ca achitat integral"}</button></div></article>`}).join("")}</div></section><div class="cn-total-row"><span>Total încasat client</span><strong class="cn-money">${formatMoney(total)}</strong></div></div>`}

/* fila Istoric service afișează doar cronologia vehiculului selectat */
function serviceTab(vehicle){const events=[...(vehicle.service||[])].sort((a,b)=>b.date.localeCompare(a.date));return`<div class="cn-tab-stack"><section class="cn-card"><div class="cn-card-header"><div><h3>Istoric service · <span class="cn-plate">${escapeHtml(vehicle.plate)}</span></h3><span class="cn-preview-message">Date fictive, sortate de la nou la vechi.</span></div></div>${events.map(item=>`<div class="cn-service-row"><span class="cn-service-date">${formatDate(item.date)}</span><span class="cn-service-main"><strong>${escapeHtml(item.type)}</strong><span>${escapeHtml(item.description)}</span><em class="cn-status success">${escapeHtml(item.status)}</em></span><button class="cn-button cn-button-small cn-button-ghost" data-service-id="${item.id}">Detalii</button></div>`).join("")||'<div class="cn-empty-card">Nu există evenimente service pentru acest vehicul.</div>'}</section></div>`}

/* fila Notificări păstrează reminderele, preferințele și simulările */
function notificationsTab(client,vehicle){const reminders=[...vehicle.reminders].sort((a,b)=>a.date.localeCompare(b.date));return`<div class="cn-tab-stack"><section class="cn-card"><div class="cn-card-header"><h3>Remindere · <span class="cn-plate">${escapeHtml(vehicle.plate)}</span></h3><button class="cn-link-button" data-action="add-reminder"><i data-lucide="plus"></i> Adaugă</button></div>${reminders.map(reminder=>{const days=daysUntil(reminder.date);return`<div class="cn-reminder-row"><span class="cn-status ${days<0?"danger":days<=5?"warning":"success"}">${escapeHtml(reminder.type)}</span><span class="cn-reminder-main"><strong>${escapeHtml(reminder.label||reminder.type)}</strong><span>${escapeHtml(reminder.notes||"Reminder automat")}</span></span><span class="cn-reminder-date"><strong>${formatDate(reminder.date)}</strong><small>${days<0?"Expirat":days+" zile"}</small></span></div>`}).join("")||'<p class="cn-note">Nu există remindere.</p>'}</section><section class="cn-card"><div class="cn-card-header"><h3>Preferințe notificare</h3><span class="cn-consent ${client.consent?"":"cn-no-consent"}">${client.consent?"Acord activ":"Fără acord"}</span></div><div class="cn-timing-list">${[30,15,5,0].map(value=>`<span class="cn-chip">${client.timing.includes(value)?"✓ ":""}${value===0?"În ziua termenului":value+" zile"}</span>`).join("")}</div><div class="cn-channel-list" style="margin-top:7px">${client.channels.map(channel=>`<span class="cn-chip">${escapeHtml(channel)}</span>`).join("")}</div></section><section class="cn-card"><div class="cn-card-header"><h3>Istoric notificări</h3></div>${client.notificationHistory.map(entry=>`<div class="cn-history-row"><span class="cn-service-date">${escapeHtml(entry.date)}</span><span><strong>${escapeHtml(entry.reason)}</strong><small>${escapeHtml(entry.channel)}</small></span><span class="cn-status ${entry.status==="Eșuat"?"danger":"success"}">${escapeHtml(entry.status)}</span></div>`).join("")||'<p class="cn-note">Nu există notificări în istoric.</p>'}</section><div class="cn-compact-actions"><button class="cn-button cn-button-ghost" data-action="whatsapp"><i data-lucide="message-circle"></i>WhatsApp</button><button class="cn-button cn-button-ghost" data-action="email"><i data-lucide="mail"></i>Email</button><button class="cn-button cn-button-primary" data-action="offer"><i data-lucide="file-plus-2"></i>Creează ofertă</button></div></div>`}

/* randarea dosarului păstrează fila activă când se schimbă clientul */
function renderDossier(){const client=getClient(),vehicle=getSelectedVehicle();if(!client||!vehicle){dom.drawer.innerHTML='<div class="cn-empty-card">Selectează un client.</div>';return}const content={general:()=>generalTab(client,vehicle),advances:()=>advancesTab(client),service:()=>serviceTab(vehicle),notifications:()=>notificationsTab(client,vehicle)}[activeDossierTab]();dom.drawer.innerHTML=dossierHeader(client,vehicle)+`<div class="cn-dossier-content">${content}</div>`}
function refreshAll(){renderKpis();renderAttention();renderTable();renderDossier();lucide.createIcons()}

/* modalurile blochează scroll-ul paginii cât timp sunt deschise */
function openModal(modal){modal.hidden=false;document.body.style.overflow="hidden";lucide.createIcons()}
function closeModal(modal){modal.hidden=true;if(Object.values(dom).filter(item=>item?.classList?.contains("cn-modal-overlay")).every(item=>item.hidden))document.body.style.overflow=""}
function showToast(message){clearTimeout(toastTimer);dom.toast.textContent=message;dom.toast.classList.add("is-visible");toastTimer=setTimeout(()=>dom.toast.classList.remove("is-visible"),2600)}
function showActionModal(title,eyebrow,body,variant=""){
  const actionDialog=dom.actionModal.querySelector(".cn-action-modal");
  const settingsSaveButton=document.getElementById("moduleSettingsSaveBtn");
  const settingsStatus=document.getElementById("moduleSettingsStatus");
  actionDialog?.classList.toggle("cn-module-settings-modal",variant==="module-settings");
  document.getElementById("actionModalTitle").textContent=title;
  document.getElementById("actionEyebrow").textContent=eyebrow;
  document.getElementById("actionModalBody").innerHTML=body;
  /* resetează acțiunile specifice setărilor când dialogul este reutilizat */
  if(settingsSaveButton){settingsSaveButton.hidden=true;settingsSaveButton.disabled=false;settingsSaveButton.innerHTML='<i data-lucide="save"></i> Salvează setările'}
  if(settingsStatus){settingsStatus.hidden=true;settingsStatus.textContent="";settingsStatus.className="cn-module-settings-status"}
  openModal(dom.actionModal);
}

/* completează aceleași controale pentru creare și editare, inclusiv preferințele */
function fillClientPreferenceFields(form,{channels=["WhatsApp"],consent=true,timing=[30,5]}={}){
  form.querySelectorAll('[name="channels"]').forEach(input=>{input.checked=channels.includes(input.value)});
  form.elements.consent.checked=consent;
  form.querySelectorAll('[name="timing"]').forEach(input=>{input.checked=timing.includes(Number(input.value))});
}

/* construiește un rând independent pentru fiecare termen personalizat */
function addCustomDeadlineRow(deadline={}){
  const list=document.getElementById("customDeadlinesList"),row=document.createElement("div");
  row.className="cn-custom-deadline";row.dataset.deadlineId=deadline.id||"";
  row.innerHTML=`<label class="cn-field"><span>Denumire</span><input type="text" data-custom-deadline-name value="${escapeHtml(deadline.denumire||"")}" placeholder="ex. Garanție baterie"></label><label class="cn-field"><span>Dată termen</span><input type="date" data-custom-deadline-date value="${escapeHtml(String(deadline.data_termen||"").slice(0,10))}"></label><button type="button" class="cn-icon-button cn-custom-deadline-remove" data-remove-custom-deadline title="Elimină termenul"><i data-lucide="trash-2"></i></button>`;
  list.appendChild(row);lucide.createIcons();
}

/* preia exclusiv termenele vehiculului selectat și precompletează formularul */
async function loadVehicleDeadlinesForEdit(vehicleId){
  const section=document.getElementById("vehicleDeadlinesSection"),status=document.getElementById("vehicleDeadlinesStatus"),list=document.getElementById("customDeadlinesList");
  section.hidden=false;status.textContent="Se încarcă termenele...";list.innerHTML="";
  section.querySelectorAll("input,button").forEach(control=>{control.disabled=true});
  try{
    const{data,error}=await supabaseClient.from("clienti_vehicule_termene").select("id, vehicle_id, tip, denumire, data_termen, activ, updated_at").eq("vehicle_id",vehicleId).order("data_termen",{ascending:true});
    if(error)throw error;
    if(String(realClientFormContext?.vehicleId)!==String(vehicleId))return;
    const rows=data||[];realClientFormContext.deadlines=rows;realClientFormContext.deadlinesLoaded=true;
    ["itp","rca","revizie","schimb_ulei"].forEach(type=>{
      const deadline=rows.find(item=>item.tip===type&&item.activ===true&&item.data_termen);
      dom.clientForm.elements[`deadline_${type}`].value=deadline?String(deadline.data_termen).slice(0,10):"";
    });
    rows.filter(item=>item.tip==="personalizat"&&item.activ===true&&item.data_termen).forEach(addCustomDeadlineRow);
    status.textContent=rows.some(item=>item.activ===true&&item.data_termen)?"Termenele vehiculului selectat":"Fără termene setate";
    section.querySelectorAll("input,button").forEach(control=>{control.disabled=false});
  }catch(error){
    realClientFormContext.deadlinesLoaded=false;status.textContent="Termenele nu au putut fi încărcate.";
    console.error("Termenele vehiculului nu au putut fi încărcate:",error);
  }
}

/* resetarea standard dezactivează imediat rândul existent, fără ștergere */
async function clearStandardVehicleDeadline(type,button){
  const input=dom.clientForm.elements[`deadline_${type}`],context=realClientFormContext;
  if(!input||context?.mode!=="edit"||context.deadlinesLoaded!==true)return;
  const previousValue=input.value,existing=(context.deadlines||[]).find(item=>item.tip===type);
  input.value="";if(!existing)return;
  button.disabled=true;
  try{
    const now=new Date().toISOString(),{error}=await supabaseClient.from("clienti_vehicule_termene").update({activ:false,updated_at:now}).eq("id",existing.id).eq("vehicle_id",context.vehicleId);
    if(error)throw error;existing.activ=false;existing.updated_at=now;
    const row=clientVehicleRows.find(item=>String(item.vehicleId)===String(context.vehicleId));
    if(row){row.reminders=row.reminders.filter(item=>String(item.id)!==String(existing.id));row.nextReminder=nearestReminderSummary(row.reminders);renderTable();if(activeDossierTab==="general")renderRealDossier();lucide.createIcons()}
    document.getElementById("vehicleDeadlinesStatus").textContent="Termen dezactivat";
  }catch(error){
    input.value=previousValue;console.error("Termenul standard nu a putut fi resetat:",error);showToast("Termenul nu a putut fi resetat.");
  }finally{button.disabled=false}
}

/* salvează tipurile standard prin UPDATE/INSERT și dezactivează valorile golite */
async function saveRealVehicleDeadlines(vehicleId,form,existingRows){
  const now=new Date().toISOString(),standardTypes=["itp","rca","revizie","schimb_ulei"];
  for(const type of standardTypes){
    const date=form.elements[`deadline_${type}`].value,existing=existingRows.find(item=>item.tip===type);
    if(existing){
      const payload={activ:Boolean(date),updated_at:now};if(date)payload.data_termen=date;
      const{error}=await supabaseClient.from("clienti_vehicule_termene").update(payload).eq("id",existing.id).eq("vehicle_id",vehicleId);if(error)throw error;
    }else if(date){
      const{error}=await supabaseClient.from("clienti_vehicule_termene").insert({vehicle_id:vehicleId,tip:type,denumire:null,data_termen:date,activ:true});if(error)throw error;
    }
  }

  const customRows=[...document.querySelectorAll("#customDeadlinesList .cn-custom-deadline")],presentIds=new Set();
  for(const row of customRows){
    const id=row.dataset.deadlineId,name=row.querySelector("[data-custom-deadline-name]").value.trim(),date=row.querySelector("[data-custom-deadline-date]").value;
    if(!name&&!date)continue;if(!name||!date)throw new Error("Completează denumirea și data fiecărui termen personalizat.");
    if(id){
      presentIds.add(String(id));
      const{error}=await supabaseClient.from("clienti_vehicule_termene").update({denumire:name,data_termen:date,activ:true,updated_at:now}).eq("id",id).eq("vehicle_id",vehicleId).eq("tip","personalizat");if(error)throw error;
    }else{
      const{error}=await supabaseClient.from("clienti_vehicule_termene").insert({vehicle_id:vehicleId,tip:"personalizat",denumire:name,data_termen:date,activ:true});if(error)throw error;
    }
  }
  const removed=existingRows.filter(item=>item.tip==="personalizat"&&item.activ===true&&!presentIds.has(String(item.id))).map(item=>item.id);
  if(removed.length){const{error}=await supabaseClient.from("clienti_vehicule_termene").update({activ:false,updated_at:now}).eq("vehicle_id",vehicleId).in("id",removed);if(error)throw error}
}

/* pregătește modalul real pentru client nou sau pentru clientul și vehiculul selectate */
function openRealClientModal(row=null){
  realClientFormContext=row?{mode:"edit",clientId:row.clientId,vehicleId:row.vehicleId}:{mode:"create"};
  editingClientId=null;dom.clientForm.reset();
  const editing=Boolean(row),vehicleSection=document.getElementById("vehicleFormSection");
  const deadlinesSection=document.getElementById("vehicleDeadlinesSection");
  vehicleSection.hidden=false;
  deadlinesSection.hidden=!editing;document.getElementById("customDeadlinesList").innerHTML="";
  vehicleSection.querySelector("h3").textContent=editing?"Vehicul selectat":"Primul vehicul";
  document.getElementById("clientModalTitle").textContent=editing?"Editează client":"Adaugă client";
  document.getElementById("clientModalSubtitle").textContent=editing?"Actualizează datele clientului și ale vehiculului selectat.":"Completează datele clientului și primul vehicul.";
  dom.clientForm.querySelector('button[type="submit"]').textContent=editing?"Salvează modificările":"Salvează clientul";
  if(row){
    dom.clientForm.elements.name.value=row.name||"";
    dom.clientForm.elements.phone.value=row.phone||"";
    dom.clientForm.elements.email.value=row.email||"";
    dom.clientForm.elements.notes.value=row.notes||"";
    dom.clientForm.elements.marca_model.value=row.makeModel||"";
    dom.clientForm.elements.year.value=row.year||"";
    dom.clientForm.elements.plate.value=row.plate||"";
    dom.clientForm.elements.vin.value=row.vin||"";
    fillClientPreferenceFields(dom.clientForm,row);
    dom.clientForm.elements.client_status.value=row.clientStatus||"activ";
    dom.clientForm.elements.vehicle_status.value=row.vehicleStatus||"activ";
  }else fillClientPreferenceFields(dom.clientForm);
  openModal(dom.clientModal);
  if(editing)loadVehicleDeadlinesForEdit(row.vehicleId);
}

/* formularul demo păstrează aceeași structură cu marca_model unic */
function openClientModal(client=null){
  realClientFormContext=null;editingClientId=client?.id||null;dom.clientForm.reset();
  const vehicle=getSelectedVehicle(),editing=Boolean(client);
  document.getElementById("clientModalTitle").textContent=editing?"Editează client":"Adaugă client";
  document.getElementById("clientModalSubtitle").textContent="Datele demo există numai în sesiunea curentă.";
  document.getElementById("vehicleFormSection").hidden=editing;
  document.getElementById("vehicleDeadlinesSection").hidden=true;
  dom.clientForm.querySelector('button[type="submit"]').textContent=editing?"Salvează modificările":"Salvează clientul";
  if(client){
    dom.clientForm.elements.name.value=client.name;dom.clientForm.elements.phone.value=client.phone;dom.clientForm.elements.email.value=client.email;
    dom.clientForm.elements.notes.value=(client.notes||[]).join("\n");fillClientPreferenceFields(dom.clientForm,client);
  }else if(vehicle){dom.clientForm.elements.marca_model.value=vehicleMakeModel(vehicle)}
  openModal(dom.clientModal);
}

/* verifică în browser unicitatea numărului și VIN-ului înainte de INSERT sau UPDATE */
async function validateRealVehicleIdentity(plate,vin,excludedVehicleId=null){
  const rows=await readAllSupabaseRows("clienti_vehicule","id, nr_inmatriculare, serie_vin");
  const others=rows.filter(row=>String(row.id)!==String(excludedVehicleId));
  if(plate&&others.some(row=>normalizePlate(row.nr_inmatriculare)===plate))throw new Error(`Numărul ${plate} este deja asociat altui vehicul.`);
  if(vin&&others.some(row=>normalizeVin(row.serie_vin)===vin))throw new Error(`VIN-ul ${vin} este deja asociat altui vehicul.`);
}

/* mapează preferințele clientului direct pe coloanele persistente din Supabase */
function realClientOptionalPayload({notes,channels,consent,timing}){
  const payload={
    acord_notificari:consent,
    canal_whatsapp:channels.includes("WhatsApp"),
    canal_email:channels.includes("Email"),
    canal_sms:channels.includes("SMS"),
    prag_30:timing.includes(30),
    prag_15:timing.includes(15),
    prag_5:timing.includes(5),
    prag_0:timing.includes(0)
  },notesColumn=supportedColumn("clienti",["observatii"]);
  if(notesColumn)payload[notesColumn]=notes||null;
  return payload;
}

/* mapează anul și observația vehiculului fără a presupune coloane inexistente */
function realVehiclePayload(form,clientId=null){
  const payload={nr_inmatriculare:normalizePlate(form.elements.plate.value),marca_model:form.elements.marca_model.value.trim(),serie_vin:normalizeVin(form.elements.vin.value)||null,status_vehicul:form.elements.vehicle_status?.value||"activ"};
  if(clientId!==null)payload.client_id=clientId;
  const yearColumn=supportedColumn("clienti_vehicule",["an_fabricatie","an"]),notesColumn=supportedColumn("clienti_vehicule",["observatii"]);
  if(yearColumn)payload[yearColumn]=form.elements.year.value?Number(form.elements.year.value):null;
  if(notesColumn&&form.elements.notes)payload[notesColumn]=form.elements.notes.value.trim()||null;
  return payload;
}

/* actualizează sau creează contactul principal fără duplicate pentru același tip */
async function saveRealPrimaryContact(clientId,type,value){
  const{data:contacts,error:readError}=await supabaseClient.from("clienti_contacte").select("id, valoare, este_principal, eticheta").eq("client_id",clientId).eq("tip",type).order("id",{ascending:true});
  if(readError)throw readError;
  const target=(contacts||[]).find(contact=>contact.este_principal===true)||(contacts||[])[0]||null;
  if(target){
    const{data,error}=await supabaseClient.from("clienti_contacte").update({valoare:value,este_principal:true,eticheta:target.eticheta||"Principal",updated_at:new Date().toISOString()}).eq("id",target.id).select("id").single();
    if(error)throw error;if(!data?.id)throw new Error(`Contactul ${type} nu a fost actualizat.`);return;
  }
  if(!value)return;
  const{data,error}=await supabaseClient.from("clienti_contacte").insert({client_id:clientId,tip:type,valoare:value,este_principal:true,eticheta:"Principal"}).select("id").single();
  if(error)throw error;if(!data?.id)throw new Error(`Contactul ${type} nu a fost creat.`);
}

/* generează codul următor și reîncearcă exclusiv o coliziune concurentă */
async function createRealClientMaster(payload){
  for(let attempt=0;attempt<3;attempt+=1){
    const rows=await readAllSupabaseRows("clienti","id, cod_client");
    const maxCode=rows.reduce((max,row)=>{const match=String(row.cod_client||"").match(/^CL-(\d{5})$/i);return match?Math.max(max,Number(match[1])):max},0);
    const{data,error}=await supabaseClient.from("clienti").insert({...payload,cod_client:`CL-${String(maxCode+1).padStart(5,"0")}`,tip_client:"persoana",sursa_creare:"clienti_notificari"}).select("id, cod_client").single();
    if(!error)return data;if(error.code!=="23505")throw error;
  }
  throw new Error("Nu s-a putut genera un cod client unic.");
}

/* salvează în Supabase clientul și vehiculul selectat, apoi recitește lista */
async function saveRealClientForm(form,button){
  const channels=[...form.querySelectorAll('[name="channels"]:checked')].map(input=>input.value),timing=[...form.querySelectorAll('[name="timing"]:checked')].map(input=>Number(input.value));
  const preferences={notes:form.elements.notes.value.trim(),channels,consent:form.elements.consent.checked,timing};
  const vehiclePayload=realVehiclePayload(form),context=realClientFormContext;
  if(context.mode==="edit"&&context.deadlinesLoaded!==true)throw new Error("Așteaptă încărcarea termenelor vehiculului înainte de salvare.");
  await validateRealVehicleIdentity(vehiclePayload.nr_inmatriculare,vehiclePayload.serie_vin,context.mode==="edit"?context.vehicleId:null);
  button.disabled=true;button.textContent="Se salvează...";
  if(context.mode==="edit"){
    const complete=[form.elements.name.value,form.elements.phone.value,vehiclePayload.nr_inmatriculare,vehiclePayload.serie_vin,vehiclePayload.marca_model].every(value=>String(value||"").trim());
    const clientPayload={nume:form.elements.name.value.trim(),status_activitate:form.elements.client_status.value,status_profil:complete?"complet":"de_completat",updated_at:new Date().toISOString(),...realClientOptionalPayload(preferences)};
    const{data:updatedClient,error:clientError}=await supabaseClient.from("clienti").update(clientPayload).eq("id",context.clientId).select("id").single();
    if(clientError)throw clientError;if(!updatedClient?.id)throw new Error("Clientul nu a fost actualizat.");
    const{data:updatedVehicle,error:vehicleError}=await supabaseClient.from("clienti_vehicule").update({...vehiclePayload,updated_at:new Date().toISOString()}).eq("id",context.vehicleId).eq("client_id",context.clientId).select("id").single();
    if(vehicleError)throw vehicleError;if(!updatedVehicle?.id)throw new Error("Vehiculul nu a fost actualizat.");
    await Promise.all([saveRealPrimaryContact(context.clientId,"telefon",form.elements.phone.value.trim()),saveRealPrimaryContact(context.clientId,"email",form.elements.email.value.trim())]);
    await saveRealVehicleDeadlines(context.vehicleId,form,context.deadlines||[]);
    /* preferințele salvate se aplică tuturor programărilor active ale clientului */
    await cancelIneligibleClientNotifications(context.clientId);
  }else{
    const complete=[form.elements.name.value,form.elements.phone.value,vehiclePayload.nr_inmatriculare,vehiclePayload.serie_vin,vehiclePayload.marca_model].every(value=>String(value||"").trim());
    const createdClient=await createRealClientMaster({nume:form.elements.name.value.trim(),status_activitate:form.elements.client_status.value||"activ",status_profil:complete?"complet":"de_completat",...realClientOptionalPayload(preferences)});
    await Promise.all([saveRealPrimaryContact(createdClient.id,"telefon",form.elements.phone.value.trim()),saveRealPrimaryContact(createdClient.id,"email",form.elements.email.value.trim())]);
    const{data:createdVehicle,error:vehicleError}=await supabaseClient.from("clienti_vehicule").insert({...vehiclePayload,client_id:createdClient.id}).select("id").single();
    if(vehicleError)throw vehicleError;if(!createdVehicle?.id)throw new Error("Vehiculul nu a fost creat.");
    selectedRealVehicleId=createdVehicle.id;
  }
  closeModal(dom.clientModal);realClientFormContext=null;await loadClientVehicleRows();showToast(context.mode==="edit"?"Datele clientului au fost actualizate.":"Clientul și primul vehicul au fost adăugate.");
}

dom.clientForm.addEventListener("submit",async event=>{
  event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]');
  if(realClientFormContext){try{await saveRealClientForm(form,button)}catch(error){console.error("Datele clientului nu au putut fi salvate:",error);showToast(error.message||"Datele clientului nu au putut fi salvate.")}finally{button.disabled=false;button.textContent=realClientFormContext?.mode==="edit"?"Salvează modificările":"Salvează clientul"}return}
  const channels=[...form.querySelectorAll('[name="channels"]:checked')].map(input=>input.value),timing=[...form.querySelectorAll('[name="timing"]:checked')].map(input=>Number(input.value));
  if(!channels.length){showToast("Selectează cel puțin un canal.");return}
  if(editingClientId){Object.assign(getClient(editingClientId),{name:form.elements.name.value.trim(),phone:form.elements.phone.value.trim(),email:form.elements.email.value.trim(),channels,consent:form.elements.consent.checked,timing,notes:form.elements.notes.value.trim()?[form.elements.notes.value.trim()]:[]})}
  else{const id=Math.max(...clients.map(item=>item.id))+1,vehicleId=Date.now(),plate=normalizePlate(form.elements.plate.value)||"FARANUMAR";clients.push({id,name:form.elements.name.value.trim(),phone:form.elements.phone.value.trim(),email:form.elements.email.value.trim(),channels,consent:form.elements.consent.checked,timing,notes:form.elements.notes.value.trim()?[form.elements.notes.value.trim()]:[],notificationHistory:[],vehicles:[{id:vehicleId,marca_model:form.elements.marca_model.value.trim()||"Vehicul nespecificat",year:Number(form.elements.year.value)||"",plate,vin:normalizeVin(form.elements.vin.value),reminders:[],service:[]}]});selectedClientId=id;selectedVehicleId=vehicleId}
  closeModal(dom.clientModal);refreshAll();showToast(editingClientId?"Client actualizat în memorie.":"Client adăugat în memorie.");
});

/* deschide formularul de mașină pentru clientul real selectat */
function openRealVehicleModal(){
  const row=clientVehicleRows.find(item=>String(item.vehicleId)===String(selectedRealVehicleId));if(!row)return;
  realVehicleFormClientId=row.clientId;dom.vehicleForm.reset();document.getElementById("vehicleModalClient").textContent=row.name||row.code||"Client selectat";openModal(dom.vehicleModal);
}

/* vehiculul nou este validat și legat exclusiv de clientul curent */
dom.vehicleForm.addEventListener("submit",async event=>{
  event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]');
  if(realVehicleFormClientId!==null){
    const payload=realVehiclePayload(form,realVehicleFormClientId);
    try{await validateRealVehicleIdentity(payload.nr_inmatriculare,payload.serie_vin);button.disabled=true;button.textContent="Se salvează...";const{data,error}=await supabaseClient.from("clienti_vehicule").insert(payload).select("id").single();if(error)throw error;if(!data?.id)throw new Error("Vehiculul nu a fost creat.");selectedRealVehicleId=data.id;closeModal(dom.vehicleModal);realVehicleFormClientId=null;await loadClientVehicleRows();showToast(`Mașina ${payload.nr_inmatriculare} a fost adăugată.`)}catch(error){console.error("Vehiculul nu a putut fi adăugat:",error);showToast(error.message||"Vehiculul nu a putut fi adăugat.")}finally{button.disabled=false;button.textContent="Adaugă mașina"}return;
  }
  const id=Date.now(),plate=normalizePlate(form.elements.plate.value);getClient().vehicles.push({id,marca_model:form.elements.marca_model.value.trim(),year:Number(form.elements.year.value)||"",plate,vin:normalizeVin(form.elements.vin.value),notes:form.elements.notes?.value.trim()||"",reminders:[],service:[]});selectedVehicleId=id;form.reset();closeModal(dom.vehicleModal);refreshAll();showToast(`Vehiculul ${plate} a fost adăugat.`);
});

/* reminderul nou este legat strict de vehiculul selectat */
function openReminderModal(){const vehicle=getSelectedVehicle();dom.reminderForm.reset();document.getElementById("customReminderNameField").hidden=true;dom.reminderForm.elements.label.required=false;document.getElementById("reminderVehicleLabel").textContent=`${vehicleMakeModel(vehicle)} · ${vehicle.plate}`;openModal(dom.reminderModal)}
dom.reminderForm.addEventListener("submit",event=>{event.preventDefault();const form=event.currentTarget,type=form.elements.type.value,label=form.elements.label.value.trim();if(type==="Personalizat"&&!label)return form.elements.label.focus();getSelectedVehicle().reminders.push({type,date:form.elements.date.value,label:type==="Personalizat"?label:"",notes:form.elements.notes.value.trim()});closeModal(dom.reminderModal);refreshAll();showToast("Reminder adăugat vehiculului selectat.")});

/* notițele rămân într-o listă compactă fără opțiune de ștergere */
function openNoteForm(client){showActionModal("Adaugă notiță","NOTIȚĂ ÎN MEMORIE",`<form id="noteForm"><label class="cn-field"><span>Notiță pentru ${escapeHtml(client.name)}</span><textarea name="note" required></textarea></label><button class="cn-button cn-button-primary" style="margin-top:10px">Adaugă notița</button></form>`);document.getElementById("noteForm").addEventListener("submit",event=>{event.preventDefault();const note=event.currentTarget.elements.note.value.trim();if(!note)return;client.notes.push(note);closeModal(dom.actionModal);renderDossier();lucide.createIcons();showToast("Notiță adăugată în memorie.")})}

/* formularul real primește vehiculul selectat și nu oferă câmp manual pentru numărul auto */
function openRealAdvanceForm(){
  const row=clientVehicleRows.find(item=>String(item.vehicleId)===String(selectedRealVehicleId));
  if(!row)return;
  realAdvanceFormContext={vehicleId:row.vehicleId};editingAdvanceId=null;dom.advanceForm.reset();
  document.querySelector("#advanceFormModal .cn-eyebrow").textContent="AVANS CLIENT";
  document.getElementById("advanceFormTitle").textContent="Adaugă avans";
  document.getElementById("advanceFormVehicle").textContent=`${row.plate||"Fără număr auto"} · ${row.makeModel||"Vehicul nespecificat"}`;
  document.getElementById("initialPaymentFields").hidden=false;
  dom.advanceForm.elements.amount.required=true;
  dom.advanceForm.elements.date.value=new Date().toISOString().slice(0,10);
  openModal(dom.advanceFormModal);
}

/* reîncarcă un vehicul și poate redeschide intrarea atinsă de ultima operație */
async function refreshRealVehicleAdvances(vehicleId,advanceId=null){
  const key=String(vehicleId);realAdvancesLoadState.delete(key);await loadRealVehicleAdvances(vehicleId);
  if(advanceId){
    const group=groupRealAdvances(vehicleId,realAdvancesByVehicle.get(key)||[]).find(item=>item.advances.some(advance=>String(advance.id)===String(advanceId)));
    if(group)expandedRealVisitKeys.add(group.key);
  }
  if(String(selectedRealVehicleId)===key){renderRealDossier();lucide.createIcons()}
}

/* salvează fișa și plata inițială în tabelele existente, cu rollback compensator la eroarea plății */
async function saveRealAdvance(event){
  const form=event.currentTarget,row=clientVehicleRows.find(item=>String(item.vehicleId)===String(realAdvanceFormContext?.vehicleId)),button=form.querySelector('button[type="submit"]');
  if(!row)return;
  const amount=Number(form.elements.amount.value);
  if(!Number.isFinite(amount)||amount<.01){showToast("Plata inițială trebuie să fie mai mare decât 0.");return}
  button.disabled=true;button.textContent="Se salvează...";
  let createdId=null;
  try{
    /* vehicle_id și numărul auto provin exclusiv din vehiculul selectat */
    const{data:created,error:createError}=await supabaseClient.from("evidente_avansuri").insert([{
      vehicle_id:row.vehicleId,
      nr_inmatriculare:row.plate||null,
      model_masina:row.makeModel||null,
      data_crearii:form.elements.date.value,
      observatii:form.elements.notes.value.trim()||null,
      este_arhivat:false
    }]).select("id").single();
    if(createError)throw createError;
    createdId=created.id;
    const{error:paymentError}=await supabaseClient.from("evidente_avansuri_plati").insert([{
      avans_id:createdId,
      suma:amount,
      metoda_plata:form.elements.method.value,
      observatii:null,
      data_platii:new Date().toISOString()
    }]);
    if(paymentError){
      const{error:rollbackError}=await supabaseClient.from("evidente_avansuri").delete().eq("id",createdId);
      if(rollbackError)console.error("Rollback-ul fișei fără plată a eșuat:",rollbackError);
      throw paymentError;
    }
    closeModal(dom.advanceFormModal);realAdvanceFormContext=null;
    await refreshRealVehicleAdvances(row.vehicleId,createdId);
    showToast("Avansul și plata au fost salvate.");
  }catch(error){
    console.error("Avansul nu a putut fi salvat:",error);showToast("Avansul nu a putut fi salvat.");
  }finally{button.disabled=false;button.textContent="Salvează"}
}

/* modalul de plată reală păstrează fișa țintă și permite observații */
function openRealPaymentForm(advanceId){
  const key=String(selectedRealVehicleId),advance=(realAdvancesByVehicle.get(key)||[]).find(item=>String(item.id)===String(advanceId)),row=clientVehicleRows.find(item=>String(item.vehicleId)===key);
  if(!advance||!row)return;
  realPaymentFormContext={vehicleId:row.vehicleId,advanceId:advance.id};editingPayment={advanceId:null,paymentId:null};dom.paymentForm.reset();
  document.querySelector("#paymentModal .cn-eyebrow").textContent="PLATĂ AVANS";
  document.getElementById("paymentModalTitle").textContent="Adaugă plată";
  document.getElementById("paymentVehicleLabel").textContent=`${row.plate||"—"} · AV-${advance.id}`;
  document.getElementById("paymentDateField").hidden=false;dom.paymentForm.elements.date.required=true;dom.paymentForm.elements.date.value=toLocalInput(new Date());
  openModal(dom.paymentModal);
}

/* plata nouă rămâne legată numai de avansul ales și nu recreează fișa */
async function saveRealPayment(event){
  const form=event.currentTarget,context=realPaymentFormContext,button=form.querySelector('button[type="submit"]'),amount=Number(form.elements.amount.value);
  if(!context||!Number.isFinite(amount)||amount<.01){showToast("Suma trebuie să fie mai mare decât 0.");return}
  button.disabled=true;button.textContent="Se salvează...";
  try{
    const{error}=await supabaseClient.from("evidente_avansuri_plati").insert([{
      avans_id:context.advanceId,
      suma:amount,
      metoda_plata:form.elements.method.value,
      data_platii:new Date(form.elements.date.value).toISOString()
    }]);
    if(error)throw error;
    closeModal(dom.paymentModal);realPaymentFormContext=null;
    await refreshRealVehicleAdvances(context.vehicleId,context.advanceId);
    showToast("Plata a fost adăugată.");
  }catch(error){
    console.error("Plata nu a putut fi salvată:",error);showToast("Plata nu a putut fi salvată.");
  }finally{button.disabled=false;button.textContent="Salvează plata"}
}

/* marchează exclusiv avansul ales, păstrând observațiile și celelalte intrări intacte */
async function settleRealAdvanceEntry(advanceId,button){
  const vehicleId=selectedRealVehicleId,key=String(vehicleId),advance=(realAdvancesByVehicle.get(key)||[]).find(item=>String(item.id)===String(advanceId));
  if(!advance||isRealAdvanceSettled(advance)||advance.este_arhivat===true)return;
  if(!confirm("Marchezi această intrare ca achitată integral? Celelalte intrări ale vehiculului nu vor fi modificate."))return;
  const originalText=button?.textContent||"Achită integral";
  if(button){button.disabled=true;button.textContent="Se salvează..."}
  try{
    /* UPDATE-ul filtrat după id și vehicle_id nu poate închide altă intrare a mașinii */
    const currentNotes=String(advance.observatii||"").trim();
    const observations=currentNotes?`${currentNotes}
Achitat integral`:"Achitat integral";
    const{data,error}=await supabaseClient.from("evidente_avansuri").update({observatii:observations}).eq("id",advance.id).eq("vehicle_id",vehicleId).eq("este_arhivat",false).select("id").single();
    if(error)throw error;
    if(!data?.id)throw new Error(`Avansul ${advance.id} nu a fost actualizat.`);
    expandedRealVisitKeys.delete(`advance-${advance.id}`);
    await refreshRealVehicleAdvances(vehicleId);
    showToast("Intrarea a fost achitată integral.");
  }catch(error){
    console.error("Statusul intrării nu a putut fi actualizat:",error);
    await refreshRealVehicleAdvances(vehicleId);
    showToast("Statusul nu a putut fi actualizat.");
  }finally{if(button){button.disabled=false;button.textContent=originalText}}
}

/* deschide Constatări v2 cu o cerere unică pentru vehiculul selectat */
function openNewConstatareFromCn(){
  const row=clientVehicleRows.find(item=>String(item.vehicleId)===String(selectedRealVehicleId));
  if(!row)return;
  const target=new URL("../formulare/constatari_v2.html",window.location.href);
  target.searchParams.set("action","new-from-cn");
  target.searchParams.set("client_id",String(row.clientId));
  target.searchParams.set("vehicle_id",String(row.vehicleId));
  window.location.assign(target.href);
}

/* modalul mare afișează separat fișele active și arhivate ale vehiculului */
function openAdvanceManager(vehicleId){managedVehicleId=Number(vehicleId);renderAdvanceManager();openModal(dom.advanceModal)}
function renderAdvanceManager(){const vehicle=getVehicle(managedVehicleId),client=clients.find(item=>item.vehicles.some(car=>car.id===managedVehicleId));if(!vehicle)return;document.getElementById("advanceModalTitle").textContent=`Evidență Avansuri — ${vehicle.plate}`;document.getElementById("advanceModalSubtitle").textContent=`${client.name} · ${vehicleMakeModel(vehicle)}`;const active=vehicleAdvances(vehicle.id),archived=vehicleAdvances(vehicle.id,true),status=financialStatus(vehicle.id);document.getElementById("advanceModalBody").innerHTML=`<div class="cn-advance-toolbar"><div class="cn-advance-summary"><span>Vehicul<strong class="cn-plate">${escapeHtml(vehicle.plate)}</strong></span><span>Total avansuri active<strong class="cn-money">${formatMoney(vehicleTotal(vehicle.id))}</strong></span><span>Plăți avans<strong>${paymentCount(vehicle.id)}</strong></span></div><div class="cn-advance-toolbar-actions"><span class="cn-financial-status ${status.tone}">${status.label}</span>${status.date?`<span class="cn-financial-date">din ${formatDate(status.date)}</span>`:""}<button class="cn-button cn-button-small ${status.tone==="paid"?"cn-button-ghost":"cn-button-primary"}" data-toggle-financial="${vehicle.id}">${status.tone==="paid"?"Anulează achitarea":"Marchează ca achitat integral"}</button><button class="cn-button cn-button-primary" data-action="new-advance"><i data-lucide="plus"></i>Adaugă avans</button></div></div><div class="cn-advance-records">${active.map(advanceCard).join("")||'<div class="cn-empty-card">Nu există avansuri active pentru acest vehicul.</div>'}</div><h3 class="cn-archived-title">Arhivă demo (${archived.length})</h3><div class="cn-advance-records">${archived.map(advanceCard).join("")||'<div class="cn-empty-card">Nu există fișe arhivate.</div>'}</div>`;lucide.createIcons()}
function advanceCard(advance){const total=advanceTotal(advance);return`<article class="cn-advance-record ${advance.archived?"is-archived":""}"><div class="cn-advance-record-head"><div><h3>Fișa AV-${String(advance.id).padStart(3,"0")} · ${formatDate(advance.date)}</h3><p>${escapeHtml(advance.notes||"Fără observații")} · <strong class="cn-money">${formatMoney(total)}</strong> · ${advance.payments.length} plăți</p></div><div class="cn-record-actions">${advance.archived?'<span class="cn-status warning">Arhivat</span>':`<button class="cn-button cn-button-small cn-button-primary" data-add-payment="${advance.id}">Adaugă plată</button><button class="cn-button cn-button-small cn-button-ghost" data-edit-advance="${advance.id}">Editare fișă</button><button class="cn-button cn-button-small cn-button-danger" data-archive-advance="${advance.id}">Arhivează</button>`}</div></div><div class="cn-payment-table-wrap"><table class="cn-payment-table"><thead><tr><th>Data și ora</th><th>Referință</th><th>Metodă</th><th>Sumă</th><th>Acțiune</th></tr></thead><tbody>${advance.payments.map(payment=>`<tr><td>${formatDateTime(payment.date)}</td><td>AV-${String(advance.id).padStart(3,"0")}</td><td>${escapeHtml(payment.method)}</td><td class="cn-money">${formatMoney(payment.amount)}</td><td>${advance.archived?"—":`<button class="cn-button cn-button-small cn-button-ghost" data-edit-payment="${payment.id}" data-advance-id="${advance.id}">Editare</button>`}</td></tr>`).join("")||'<tr><td colspan="5">Nicio plată.</td></tr>'}</tbody></table></div></article>`}

/* fișa nouă creează obligatoriu și plata inițială, ca în modulul original */
function openAdvanceForm(advance=null){realAdvanceFormContext=null;document.querySelector("#advanceFormModal .cn-eyebrow").textContent="AVANS DEMO";editingAdvanceId=advance?.id||null;dom.advanceForm.reset();const vehicle=getVehicle(managedVehicleId);document.getElementById("advanceFormTitle").textContent=advance?"Editează fișa":"Adaugă avans";document.getElementById("advanceFormVehicle").textContent=`${vehicle.plate} · ${vehicleMakeModel(vehicle)}`;document.getElementById("initialPaymentFields").hidden=Boolean(advance);dom.advanceForm.elements.amount.required=!advance;dom.advanceForm.elements.date.value=advance?.date||DEMO_TODAY;dom.advanceForm.elements.notes.value=advance?.notes||"";openModal(dom.advanceFormModal)}
dom.advanceForm.addEventListener("submit",async event=>{
  event.preventDefault();
  if(realAdvanceFormContext){await saveRealAdvance(event);return}
  const form=event.currentTarget;
  if(editingAdvanceId){const advance=advances.find(item=>item.id===editingAdvanceId);advance.date=form.elements.date.value;advance.notes=form.elements.notes.value.trim()}else{const amount=Number(form.elements.amount.value);if(!Number.isFinite(amount)||amount<.01){showToast("Plata inițială trebuie să fie mai mare decât 0.");return}advances.push({id:nextAdvanceId++,vehicleId:managedVehicleId,date:form.elements.date.value,notes:form.elements.notes.value.trim(),archived:false,payments:[{id:nextPaymentId++,amount,method:form.elements.method.value,date:new Date().toISOString()}]})}
  closeModal(dom.advanceFormModal);renderAdvanceManager();renderDossier();renderKpis();showToast(editingAdvanceId?"Fișă actualizată.":"Avans și plată inițială adăugate.");
});

/* plățile sunt editate individual și recalculează imediat toate totalurile */
function openPaymentForm(advanceId,paymentId=null){realPaymentFormContext=null;document.querySelector("#paymentModal .cn-eyebrow").textContent="PLATĂ DEMO";const advance=advances.find(item=>item.id===Number(advanceId)),payment=advance?.payments.find(item=>item.id===Number(paymentId));editingPayment={advanceId:Number(advanceId),paymentId:payment?.id||null};dom.paymentForm.reset();const vehicle=getVehicle(advance.vehicleId);document.getElementById("paymentModalTitle").textContent=payment?"Editează plată":"Adaugă plată";document.getElementById("paymentVehicleLabel").textContent=`${vehicle.plate} · Fișa AV-${String(advance.id).padStart(3,"0")}`;document.getElementById("paymentDateField").hidden=!payment;dom.paymentForm.elements.date.required=Boolean(payment);dom.paymentForm.elements.amount.value=payment?.amount||"";dom.paymentForm.elements.method.value=payment?.method||"Cash";dom.paymentForm.elements.date.value=toLocalInput(payment?.date);openModal(dom.paymentModal)}
dom.paymentForm.addEventListener("submit",async event=>{
  event.preventDefault();
  if(realPaymentFormContext){await saveRealPayment(event);return}
  const form=event.currentTarget,advance=advances.find(item=>item.id===editingPayment.advanceId),amount=Number(form.elements.amount.value);
  if(!advance||amount<.01)return;
  if(editingPayment.paymentId){const payment=advance.payments.find(item=>item.id===editingPayment.paymentId);Object.assign(payment,{amount,method:form.elements.method.value,date:new Date(form.elements.date.value).toISOString()})}else advance.payments.push({id:nextPaymentId++,amount,method:form.elements.method.value,date:new Date().toISOString()});
  closeModal(dom.paymentModal);renderAdvanceManager();renderDossier();renderKpis();showToast(editingPayment.paymentId?"Plată actualizată.":"Plată adăugată.");
});

/* arhivarea cere confirmare și exclude fișa din totalurile active */
function archiveAdvance(id){const advance=advances.find(item=>item.id===Number(id));if(!advance||!confirm(`Arhivezi fișa AV-${String(advance.id).padStart(3,"0")}? Înregistrarea va rămâne vizibilă în arhiva demo.`))return;advance.archived=true;renderAdvanceManager();renderDossier();renderKpis();showToast("Fișa a fost mutată în arhiva demo.")}

/* marchează sau inversează închiderea financiară fără a crea o plată */
function toggleFinancialCompletion(vehicleId){const id=Number(vehicleId);if(vehicleFinancialCompletions[id]){delete vehicleFinancialCompletions[id];showToast("Statusul Achitat integral a fost anulat.")}else{vehicleFinancialCompletions[id]={date:new Date().toISOString().slice(0,10)};showToast("Vehicul marcat ca achitat integral.")}renderDossier();if(!dom.advanceModal.hidden&&managedVehicleId===id)renderAdvanceManager();lucide.createIcons()}

/* acțiunile de comunicare sunt numai previzualizări locale */
function previewAction(kind){const client=getClient(),vehicle=getSelectedVehicle(),reminder=nextReminder(vehicle)||{type:"service",date:DEMO_TODAY};if(kind==="whatsapp")showActionModal("Previzualizare WhatsApp","SIMULARE — NU SE TRIMITE",`<div class="cn-preview-box"><div class="cn-preview-meta"><span>Destinatar</span><strong>${escapeHtml(client.phone||"Telefon indisponibil")}</strong><span>Vehicul</span><strong>${escapeHtml(vehicle.plate)}</strong></div><p class="cn-preview-message">Bună ziua, ${escapeHtml(client.name)}! Termenul pentru ${escapeHtml(reminder.label||reminder.type)} este ${formatDate(reminder.date)}.</p></div><div class="cn-simulation-note"><i data-lucide="flask-conical"></i>Nu se deschide WhatsApp și nu se trimite nimic.</div>`);if(kind==="email")showActionModal("Previzualizare email","SIMULARE — NU SE TRIMITE",`<div class="cn-preview-box"><div class="cn-preview-meta"><span>Către</span><strong>${escapeHtml(client.email||"Email indisponibil")}</strong><span>Subiect</span><strong>Reminder ${escapeHtml(reminder.type)} — ${escapeHtml(vehicle.plate)}</strong></div><p class="cn-preview-message">Mesaj demo pentru ${escapeHtml(client.name)} privind vehiculul ${escapeHtml(vehicleMakeModel(vehicle))}.</p></div>`);if(kind==="offer")showActionModal("Creează ofertă","FLUX DEMO",`<div class="cn-preview-box"><strong>Clienți &amp; Notificări → Deviz estimativ</strong><p class="cn-preview-message">Ar transfera ${escapeHtml(client.name)}, ${escapeHtml(vehicle.plate)} și contextul reminderului. Nu se creează o ofertă reală.</p></div>`)}

/* fluxul de permisiuni păstrează avertizarea și accesul temporar verde */
function showRestrictedAutomation(){showActionModal("Acces restricționat","PERMISIUNI HUB",`<div class="cn-simulation-note cn-restricted-warning"><i data-lucide="lock-keyhole"></i><span>Nu aveți permisiunea de a modifica setările automatizărilor. Contactați administratorul HUB pentru acordarea accesului.</span></div><button class="cn-demo-access-button" data-action="view-automation-settings">Vizualizează setări</button><p class="cn-preview-message">Buton temporar disponibil exclusiv în demo.</p>`)}
async function showAutomationSettings(){
  /* preia configurația reală înainte de construirea controalelor */
  showActionModal("Setări modul","CONFIGURARE MODUL",`<div class="cn-settings-loading" role="status"><span class="cn-settings-spinner"></span><strong>Se încarcă setările...</strong><small>Citire din Supabase</small></div>`,"module-settings");
  try{
    const{data:config,error}=await supabaseClient.from("clienti_notificari_config").select("id, prag_30, prag_15, prag_5, prag_0, ora_rulare, canal_whatsapp, canal_email, canal_sms").eq("id",1).single();
    if(error)throw error;
    automationSettings={
      timing:[config.prag_30&&30,config.prag_15&&15,config.prag_5&&5,config.prag_0&&0].filter(Number.isInteger),
      channels:[config.canal_whatsapp&&"WhatsApp",config.canal_email&&"Email",config.canal_sms&&"SMS"].filter(Boolean),
      checkTime:String(config.ora_rulare||"").slice(0,5)
    };
  }catch(error){
    console.error("Nu s-au putut încărca setările notificărilor:",error);
    document.getElementById("actionModalBody").innerHTML=`<div class="cn-settings-load-error"><i data-lucide="triangle-alert"></i><div><strong>Setările nu au putut fi încărcate.</strong><p>Verifică accesul la Supabase și încearcă din nou.</p></div></div>`;
    lucide.createIcons();
    return;
  }

  /* preia cele cinci șabloane și regulile lor de validare direct din Supabase */
  const supportedTemplateTypes=["itp","rca","revizie","schimb_ulei","personalizat"];
  let messageTemplates=[];
  try{
    const{data:templateRows,error:templatesError}=await supabaseClient.from("clienti_notificari_sabloane").select("id, tip, denumire, text_mesaj, variabile_obligatorii").in("tip",supportedTemplateTypes);
    if(templatesError)throw templatesError;
    const templatesByType=new Map((templateRows||[]).map(row=>[row.tip,row]));
    const missingTypes=supportedTemplateTypes.filter(type=>!templatesByType.has(type));
    if(missingTypes.length)throw new Error(`Lipsesc șabloanele: ${missingTypes.join(", ")}.`);
    messageTemplates=supportedTemplateTypes.map(type=>{const row=templatesByType.get(type),requiredVariables=normalizeTemplateVariables(row.variabile_obligatorii),personalVariables=["{client}","{numar}","{termen}","{data_expirare}","{zile_ramase}"],availableVariables=[...new Set(type==="personalizat"?[...personalVariables,...requiredVariables]:requiredVariables)];return{id:row.id,type:row.tip,title:row.denumire||row.tip,message:row.text_mesaj||"",requiredVariables,availableVariables}});
  }catch(error){
    console.error("Nu s-au putut încărca șabloanele notificărilor:",error);
    document.getElementById("actionModalBody").innerHTML=`<div class="cn-settings-load-error"><i data-lucide="triangle-alert"></i><div><strong>Șabloanele nu au putut fi încărcate.</strong><p>Verifică accesul la Supabase și încearcă din nou.</p></div></div>`;
    lucide.createIcons();
    return;
  }

  /* Automatizările reflectă pragurile și ora citite din Supabase */
  const automationPanel=`<div class="cn-settings-panel-heading"><div><span class="cn-eyebrow">CONFIGURARE</span><h3>Automatizări</h3><p>Pragurile și ora sunt sincronizate cu Supabase.</p></div></div><div class="cn-settings-grid"><section class="cn-settings-group"><h3>Praguri</h3>${[30,15,5,0].map(value=>`<label><input type="checkbox" name="timing" value="${value}" ${automationSettings.timing.includes(value)?"checked":""}> ${value===0?"În ziua termenului":value+" zile"}</label>`).join("")}</section><section class="cn-settings-group"><h3>Ora rulării</h3><label class="cn-field"><span>Ora rulării</span><input name="time" type="time" value="${escapeHtml(automationSettings.checkTime)}" required></label></section></div>`;
  /* Canalele reflectă valorile reale din același rând de configurare */
  const channelsPanel=`<div class="cn-settings-panel-heading"><div><span class="cn-eyebrow">CONFIGURARE</span><h3>Canale</h3><p>Canalele disponibile pentru notificări.</p></div></div><section class="cn-settings-group">${["WhatsApp","Email","SMS"].map(value=>`<label><input type="checkbox" name="channel" value="${value}" ${automationSettings.channels.includes(value)?"checked":""}> ${value}</label>`).join("")}</section>`;
  /* preview-ul folosește date fictive, dar textul provine din tabela de șabloane */
  const renderTemplatePreview=message=>message.replaceAll("{client}","Ion Popescu").replaceAll("{numar}","CT11AAA").replaceAll("{termen}","Garanție baterie").replaceAll("{data_expirare}","10.11.2026").replaceAll("{zile_ramase}","15");
  const templatesPanel=`<div class="cn-settings-panel-heading"><div><span class="cn-eyebrow">CONȚINUT</span><h3>Șabloane mesaje</h3><p>Textele și validările sunt sincronizate cu Supabase.</p></div></div><div class="cn-message-template-grid">${messageTemplates.map(template=>`<article class="cn-message-template" data-message-template="${escapeHtml(template.type)}" data-template-title="${escapeHtml(template.title)}"><h4>${escapeHtml(template.title)}</h4><label class="cn-field"><span>Text mesaj</span><textarea rows="3" data-template-input aria-label="Text șablon ${escapeHtml(template.title)}">${escapeHtml(template.message)}</textarea></label><div class="cn-template-variables"><span>Variabile</span>${template.availableVariables.map(variable=>`<button type="button" class="cn-template-variable" data-template-variable="${escapeHtml(variable)}" aria-label="Inserează ${escapeHtml(variable)} în șablonul ${escapeHtml(template.title)}">${escapeHtml(variable)}</button>`).join("")}</div><div class="cn-template-preview"><span>Preview</span><p data-template-preview>${escapeHtml(renderTemplatePreview(template.message))}</p></div></article>`).join("")}</div><div class="cn-template-actions"><button id="saveMessageTemplatesBtn" type="button" class="cn-button cn-button-primary">Salvează șabloane</button><div id="templateValidationMessage" class="cn-template-validation" role="status" hidden></div></div>`;
  /* Regulile sunt informative și protejate: nu modifică date și nu pot fi dezactivate */
  const rulesPanel=`<div class="cn-settings-panel-heading"><div><span class="cn-eyebrow">POLITICI AUTOMATIZARE</span><h3>Reguli notificări</h3><p>Condiții aplicate automat înainte de fiecare notificare.</p></div><span class="cn-rules-protected-badge"><i data-lucide="shield-check"></i> Reguli protejate</span></div><div class="cn-rules-sections">
    <section class="cn-rules-section" aria-labelledby="cn-rules-scheduling-title"><div class="cn-rules-section-heading"><span class="cn-rules-section-icon"><i data-lucide="calendar-clock"></i></span><div><h4 id="cn-rules-scheduling-title">Programare și unicitate</h4><p>Controlează când se creează o notificare.</p></div></div><div class="cn-rules-list">
      <article class="cn-rule-card cn-rule-card-highlight"><div class="cn-rule-icon"><i data-lucide="copy-check"></i></div><div class="cn-rule-copy"><div class="cn-rule-title"><h5>Anti-duplicate</h5><span class="cn-rule-status is-protected"><i data-lucide="lock-keyhole"></i> Activ permanent</span></div><p>Aceeași notificare nu poate fi trimisă de două ori pentru același reminder și același prag.</p><span class="cn-rule-example">Exemplu: ITP la 15 zile = o singură trimitere.</span></div></article>
      <article class="cn-rule-card"><div class="cn-rule-icon"><i data-lucide="list-filter"></i></div><div class="cn-rule-copy"><div class="cn-rule-title"><h5>Respectă pragurile active</h5><span class="cn-rule-status">Activ</span></div><p>Notificările se generează doar pentru pragurile active din tabul „Automatizări”: 30 / 15 / 5 / 0 zile.</p></div></article>
      <article class="cn-rule-card"><div class="cn-rule-icon"><i data-lucide="calendar-sync"></i></div><div class="cn-rule-copy"><div class="cn-rule-title"><h5>Modificare termen</h5><span class="cn-rule-status">Activ</span></div><p>Dacă data termenului se schimbă, programarea veche este considerată anulată și se recalculează.</p></div></article>
    </div></section>
    <section class="cn-rules-section" aria-labelledby="cn-rules-eligibility-title"><div class="cn-rules-section-heading"><span class="cn-rules-section-icon"><i data-lucide="badge-check"></i></span><div><h4 id="cn-rules-eligibility-title">Eligibilitate</h4><p>Verificări obligatorii înainte de generare.</p></div></div><div class="cn-rules-list">
      <article class="cn-rule-card"><div class="cn-rule-icon"><i data-lucide="database-zap"></i></div><div class="cn-rule-copy"><div class="cn-rule-title"><h5>Trimite doar dacă există date suficiente</h5><span class="cn-rule-status">Activ</span></div><p>Sunt necesare un termen valid, un client valid și cel puțin un canal disponibil.</p></div></article>
      <article class="cn-rule-card"><div class="cn-rule-icon"><i data-lucide="archive-x"></i></div><div class="cn-rule-copy"><div class="cn-rule-title"><h5>Client sau vehicul inactiv / arhivat</h5><span class="cn-rule-status">Activ</span></div><p>Nu se generează notificări automate pentru clienți sau vehicule inactive ori arhivate.</p></div></article>
    </div></section>
    <section class="cn-rules-section" aria-labelledby="cn-rules-delivery-title"><div class="cn-rules-section-heading"><span class="cn-rules-section-icon"><i data-lucide="send"></i></span><div><h4 id="cn-rules-delivery-title">Rezultat și trimitere manuală</h4><p>Comportamentul după încercarea de trimitere.</p></div></div><div class="cn-rules-list">
      <article class="cn-rule-card"><div class="cn-rule-icon is-danger"><i data-lucide="circle-x"></i></div><div class="cn-rule-copy"><div class="cn-rule-title"><h5>Trimitere eșuată</h5><span class="cn-rule-status">Activ</span></div><p>Notificarea este marcată „Eșuat”. Nu se folosește fallback automat pe alt canal.</p></div></article>
      <article class="cn-rule-card"><div class="cn-rule-icon is-manual"><i data-lucide="mouse-pointer-click"></i></div><div class="cn-rule-copy"><div class="cn-rule-title"><h5>Trimitere manuală</h5><span class="cn-rule-status is-permitted">Permisă</span></div><p>Trimiterea manuală rămâne disponibilă și va intra ulterior în istoric.</p></div></article>
    </div></section>
  </div><div class="cn-rules-demo-note"><i data-lucide="flask-conical"></i><span><strong>Doar demonstrație UI.</strong> Regulile nu salvează date și nu declanșează trimiteri reale.</span></div>`;

  showActionModal("Setări modul","CONFIGURARE MODUL",`<form id="automationForm" class="cn-module-settings-layout"><nav id="moduleSettingsTabs" class="cn-module-settings-tabs" role="tablist" aria-label="Secțiuni configurare"><button id="module-settings-tab-automation" class="is-active" type="button" role="tab" aria-selected="true" aria-controls="module-settings-panel-automation" data-settings-tab="automation"><i data-lucide="workflow"></i><span>Automatizări</span></button><button id="module-settings-tab-channels" type="button" role="tab" aria-selected="false" aria-controls="module-settings-panel-channels" data-settings-tab="channels"><i data-lucide="radio"></i><span>Canale</span></button><button id="module-settings-tab-templates" type="button" role="tab" aria-selected="false" aria-controls="module-settings-panel-templates" data-settings-tab="templates"><i data-lucide="message-square-text"></i><span>Șabloane mesaje</span></button><button id="module-settings-tab-rules" type="button" role="tab" aria-selected="false" aria-controls="module-settings-panel-rules" data-settings-tab="rules"><i data-lucide="list-checks"></i><span>Reguli notificări</span></button></nav><div class="cn-module-settings-content"><section id="module-settings-panel-automation" role="tabpanel" aria-labelledby="module-settings-tab-automation" data-settings-panel="automation">${automationPanel}</section><section id="module-settings-panel-channels" role="tabpanel" aria-labelledby="module-settings-tab-channels" data-settings-panel="channels" hidden>${channelsPanel}</section><section id="module-settings-panel-templates" role="tabpanel" aria-labelledby="module-settings-tab-templates" data-settings-panel="templates" hidden>${templatesPanel}</section><section id="module-settings-panel-rules" role="tabpanel" aria-labelledby="module-settings-tab-rules" data-settings-panel="rules" hidden>${rulesPanel}</section></div></form>`,"module-settings");
  const settingsSaveButton=document.getElementById("moduleSettingsSaveBtn");
  const settingsStatus=document.getElementById("moduleSettingsStatus");
  /* previne trimiterea implicită a formularului la apăsarea tastei Enter */
  document.getElementById("automationForm").addEventListener("submit",event=>event.preventDefault());
  /* tabul inițial Automatizări permite salvarea din footer */
  settingsSaveButton.hidden=false;
  lucide.createIcons();

  /* Schimbă local tabul activ fără a salva date sau a interoga Supabase */
  document.getElementById("moduleSettingsTabs")?.addEventListener("click",event=>{
    const selectedTab=event.target.closest("[data-settings-tab]");
    if(!selectedTab)return;
    const selectedId=selectedTab.dataset.settingsTab;
    document.querySelectorAll("[data-settings-tab]").forEach(tab=>{
      const isActive=tab===selectedTab;
      tab.classList.toggle("is-active",isActive);
      tab.setAttribute("aria-selected",String(isActive));
    });
    document.querySelectorAll("[data-settings-panel]").forEach(panel=>{panel.hidden=panel.dataset.settingsPanel!==selectedId});
    /* salvarea este disponibilă numai pentru Automatizări și Canale */
    settingsSaveButton.hidden=!["automation","channels"].includes(selectedId);
    settingsStatus.hidden=true;
  });

  /* Actualizează numai preview-ul local al șablonului editat */
  document.getElementById("module-settings-panel-templates")?.addEventListener("input",event=>{
    const input=event.target.closest("[data-template-input]");
    if(!input)return;
    const preview=input.closest("[data-message-template]")?.querySelector("[data-template-preview]");
    if(preview)preview.textContent=renderTemplatePreview(input.value);
  });

  /* Badge-urile inserează variabila exact la poziția cursorului */
  document.getElementById("module-settings-panel-templates")?.addEventListener("click",event=>{
    const variableButton=event.target.closest("[data-template-variable]");
    if(!variableButton)return;
    const input=variableButton.closest("[data-message-template]")?.querySelector("[data-template-input]");
    if(!input)return;
    const start=input.selectionStart??input.value.length;
    const end=input.selectionEnd??start;
    input.setRangeText(variableButton.dataset.templateVariable,start,end,"end");
    input.focus();
    input.dispatchEvent(new Event("input",{bubbles:true}));
  });

  /* validează toate șabloanele înainte de prima operație UPDATE */
  const templateSaveButton=document.getElementById("saveMessageTemplatesBtn");
  templateSaveButton?.addEventListener("click",async()=>{
    const panel=document.getElementById("module-settings-panel-templates");
    const validationMessage=document.getElementById("templateValidationMessage");
    const cards=[...panel.querySelectorAll("[data-message-template]")];
    cards.forEach(card=>card.classList.remove("is-invalid"));
    validationMessage.hidden=true;
    let validationError=null;
    for(const card of cards){
      const template=messageTemplates.find(item=>item.type===card.dataset.messageTemplate);
      const input=card.querySelector("[data-template-input]");
      const missingVariable=template.requiredVariables.find(variable=>!input.value.includes(variable));
      if(missingVariable){validationError={card,templateTitle:card.dataset.templateTitle,missingVariable};break}
    }
    if(validationError){
      validationError.card.classList.add("is-invalid");
      validationMessage.textContent=`Șablonul ${validationError.templateTitle} nu conține variabila ${validationError.missingVariable}.`;
      validationMessage.classList.remove("is-success");
      validationMessage.classList.add("is-error");
      validationMessage.hidden=false;
      return;
    }
    templateSaveButton.disabled=true;
    templateSaveButton.innerHTML='<span class="cn-settings-spinner cn-settings-spinner-small"></span> Se salvează...';
    try{
      /* utilizatorul autentificat completează updated_by când este disponibil */
      const{data:authData,error:authError}=await supabaseClient.auth.getUser();
      if(authError)console.warn("ID-ul utilizatorului nu a putut fi citit pentru șabloane:",authError);
      const updatedAt=new Date().toISOString();
      const updates=cards.map(async card=>{
        const template=messageTemplates.find(item=>item.type===card.dataset.messageTemplate);
        const payload={
          text_mesaj:card.querySelector("[data-template-input]").value,
          updated_at:updatedAt
        };
        if(authData?.user?.id)payload.updated_by=authData.user.id;
        /* confirmă prin rândul returnat că UPDATE-ul permis de RLS a reușit */
        const{data:updatedRow,error:updateError}=await supabaseClient.from("clienti_notificari_sabloane").update(payload).eq("id",template.id).select("id").single();
        if(updateError)throw updateError;
        if(updatedRow?.id!==template.id)throw new Error(`Șablonul ${template.title} nu a fost actualizat.`);
      });
      await Promise.all(updates);
      validationMessage.textContent="Șabloanele au fost salvate.";
      validationMessage.classList.remove("is-error");
      validationMessage.classList.add("is-success");
      validationMessage.hidden=false;
      showToast("Șabloanele au fost salvate.");
    }catch(error){
      console.error("Nu s-au putut salva șabloanele notificărilor:",error);
      validationMessage.textContent="Șabloanele nu au putut fi salvate. Încearcă din nou.";
      validationMessage.classList.remove("is-success");
      validationMessage.classList.add("is-error");
      validationMessage.hidden=false;
      showToast("Eroare la salvarea șabloanelor.");
    }finally{
      templateSaveButton.disabled=false;
      templateSaveButton.innerHTML='<i data-lucide="save"></i> Salvează șabloane';
      lucide.createIcons();
    }
  });

  /* salvează împreună toate pragurile, ora și canalele exclusiv pe rândul id 1 */
  settingsSaveButton.addEventListener("click",async()=>{
    const form=document.getElementById("automationForm");
    if(!form.reportValidity())return;
    const timing=[...form.querySelectorAll('[name="timing"]:checked')].map(input=>Number(input.value));
    const channels=[...form.querySelectorAll('[name="channel"]:checked')].map(input=>input.value);
    settingsSaveButton.disabled=true;
    settingsSaveButton.innerHTML='<span class="cn-settings-spinner cn-settings-spinner-small"></span> Se salvează...';
    settingsStatus.hidden=true;
    try{
      /* utilizatorul autentificat este verificat înainte de completarea updated_by */
      const{data:authData,error:authError}=await supabaseClient.auth.getUser();
      if(authError)console.warn("ID-ul utilizatorului nu a putut fi citit pentru updated_by:",authError);
      const payload={
        prag_30:timing.includes(30),
        prag_15:timing.includes(15),
        prag_5:timing.includes(5),
        prag_0:timing.includes(0),
        ora_rulare:form.elements.time.value,
        canal_whatsapp:channels.includes("WhatsApp"),
        canal_email:channels.includes("Email"),
        canal_sms:channels.includes("SMS"),
        updated_at:new Date().toISOString()
      };
      if(authData?.user?.id)payload.updated_by=authData.user.id;
      /* select confirmă faptul că UPDATE-ul permis de RLS a afectat rândul cerut */
      const{data:updatedRow,error:updateError}=await supabaseClient.from("clienti_notificari_config").update(payload).eq("id",1).select("id").single();
      if(updateError)throw updateError;
      if(updatedRow?.id!==1)throw new Error("Rândul de configurare nu a fost actualizat.");
      automationSettings={timing,channels,checkTime:form.elements.time.value};
      settingsStatus.textContent="Setările au fost salvate.";
      settingsStatus.className="cn-module-settings-status is-success";
      settingsStatus.hidden=false;
      showToast("Setările au fost salvate.");
    }catch(error){
      console.error("Nu s-au putut salva setările notificărilor:",error);
      settingsStatus.textContent="Setările nu au putut fi salvate. Încearcă din nou.";
      settingsStatus.className="cn-module-settings-status is-error";
      settingsStatus.hidden=false;
      showToast("Eroare la salvarea setărilor.");
    }finally{
      settingsSaveButton.disabled=false;
      settingsSaveButton.innerHTML='<i data-lucide="save"></i> Salvează setările';
      lucide.createIcons();
    }
  });
}

/* delegarea evenimentelor controlează elementele randate dinamic */
document.addEventListener("click",event=>{
  const notificationPreview=event.target.closest("[data-preview-real-notification]");
  if(notificationPreview){previewRealNotification(notificationPreview.dataset.previewRealNotification,notificationPreview.dataset.previewThreshold??null);return}
  const clearDeadline=event.target.closest("[data-clear-standard-deadline]");
  if(clearDeadline){clearStandardVehicleDeadline(clearDeadline.dataset.clearStandardDeadline,clearDeadline);return}
  const removeDeadline=event.target.closest("[data-remove-custom-deadline]");
  if(removeDeadline){removeDeadline.closest(".cn-custom-deadline")?.remove();return}
  const realSelection=event.target.closest("[data-select-real-vehicle]");
  if(realSelection){selectedRealVehicleId=realSelection.dataset.selectRealVehicle;activeVehicleHistoryView="timeline";renderTable();renderRealDossier();lucide.createIcons();return}
  const historyView=event.target.closest("[data-history-view]");
  if(historyView){activeVehicleHistoryView=historyView.dataset.historyView;renderRealDossier();lucide.createIcons();return}
  const realVisit=event.target.closest("[data-toggle-real-visit]");
  if(realVisit){const key=realVisit.dataset.toggleRealVisit;if(expandedRealVisitKeys.has(key))expandedRealVisitKeys.delete(key);else expandedRealVisitKeys.add(key);renderRealDossier();lucide.createIcons();return}
  const realService=event.target.closest("[data-toggle-real-service]");
  if(realService){const key=realService.dataset.toggleRealService;if(expandedRealServiceVisits.has(key))expandedRealServiceVisits.delete(key);else expandedRealServiceVisits.add(key);renderRealDossier();lucide.createIcons();return}
  const realPart=event.target.closest("[data-toggle-real-part]");
  if(realPart){const key=realPart.dataset.toggleRealPart;if(expandedRealVehicleParts.has(key))expandedRealVehicleParts.delete(key);else expandedRealVehicleParts.add(key);renderRealDossier();lucide.createIcons();return}
  const openConstatare=event.target.closest("[data-open-real-constatare]");
  if(openConstatare){openRealConstatare(openConstatare.dataset.openRealConstatare);return}
  const realAdvanceNote=event.target.closest("[data-toggle-real-advance-note]");
  if(realAdvanceNote){const key=realAdvanceNote.dataset.toggleRealAdvanceNote;if(expandedRealAdvanceNotes.has(key))expandedRealAdvanceNotes.delete(key);else expandedRealAdvanceNotes.add(key);renderRealDossier();lucide.createIcons();return}
  const realPayment=event.target.closest("[data-add-real-payment]");
  if(realPayment){openRealPaymentForm(realPayment.dataset.addRealPayment);return}
  const settleEntry=event.target.closest("[data-settle-real-advance]");
  if(settleEntry){settleRealAdvanceEntry(settleEntry.dataset.settleRealAdvance,settleEntry);return}
  if(event.target.closest("[data-select-client]"))selectedRealVehicleId=null;
});
/* selecția din tastatură rămâne disponibilă și pentru rândurile conectate */
document.addEventListener("keydown",event=>{
  if((event.key==="Enter"||event.key===" ")&&event.target.matches("tr[data-select-real-vehicle]")){event.preventDefault();event.target.click()}
});

document.addEventListener("click",event=>{const close=event.target.closest("[data-close-modal]");if(close){closeModal(document.getElementById(close.dataset.closeModal));return}const page=event.target.closest("[data-page]");if(page){currentPage=Number(page.dataset.page);renderTable();lucide.createIcons();return}const select=event.target.closest("[data-select-client]");if(select){selectedClientId=Number(select.dataset.selectClient);selectedVehicleId=Number(select.dataset.selectVehicle)||getClient()?.vehicles[0]?.id;renderTable();renderDossier();lucide.createIcons();return}const tab=event.target.closest("[data-tab]");if(tab){activeDossierTab=tab.dataset.tab;if(selectedRealVehicleId!==null&&clientListState==="ready")renderRealDossier();else renderDossier();lucide.createIcons();return}const financial=event.target.closest("[data-toggle-financial]");if(financial){toggleFinancialCompletion(financial.dataset.toggleFinancial);return}const openAdvances=event.target.closest("[data-open-advances]");if(openAdvances){openAdvanceManager(openAdvances.dataset.openAdvances);return}const service=event.target.closest("[data-service-id]");if(service){const item=getSelectedVehicle().service.find(entry=>entry.id===service.dataset.serviceId);showActionModal(item.type,"DETALIU SERVICE DEMO",`<div class="cn-preview-box"><div class="cn-preview-meta"><span>Data</span><strong>${formatDate(item.date)}</strong><span>Vehicul</span><strong>${escapeHtml(getSelectedVehicle().plate)}</strong><span>Status</span><strong>${escapeHtml(item.status)}</strong></div><p class="cn-preview-message">${escapeHtml(item.description)}</p></div>`);return}const addPayment=event.target.closest("[data-add-payment]");if(addPayment){openPaymentForm(addPayment.dataset.addPayment);return}const editPayment=event.target.closest("[data-edit-payment]");if(editPayment){openPaymentForm(editPayment.dataset.advanceId,editPayment.dataset.editPayment);return}const editAdvance=event.target.closest("[data-edit-advance]");if(editAdvance){openAdvanceForm(advances.find(item=>item.id===Number(editAdvance.dataset.editAdvance)));return}const archive=event.target.closest("[data-archive-advance]");if(archive){archiveAdvance(archive.dataset.archiveAdvance);return}const action=event.target.closest("[data-action]");if(!action)return;const client=getClient();if(action.dataset.action==="edit-real-client"){const row=clientVehicleRows.find(item=>String(item.vehicleId)===String(selectedRealVehicleId));if(row)openRealClientModal(row)}if(action.dataset.action==="add-real-vehicle")openRealVehicleModal();if(action.dataset.action==="edit-client")openClientModal(client);if(action.dataset.action==="add-vehicle"){realVehicleFormClientId=null;dom.vehicleForm.reset();document.getElementById("vehicleModalClient").textContent=client?.name||"Client demo";openModal(dom.vehicleModal)}if(action.dataset.action==="add-note")openNoteForm(client);if(action.dataset.action==="add-reminder")openReminderModal();if(action.dataset.action==="new-advance")openAdvanceForm();if(action.dataset.action==="new-real-advance")openRealAdvanceForm();if(action.dataset.action==="new-real-constatare")openNewConstatareFromCn();if(["whatsapp","email","offer"].includes(action.dataset.action))previewAction(action.dataset.action);if(action.dataset.action==="view-automation-settings")showAutomationSettings()});

/* controalele statice pentru filtre, creare și automatizare */
document.getElementById("addCustomDeadlineBtn").addEventListener("click",()=>addCustomDeadlineRow());
document.getElementById("activityScopeFilter").addEventListener("click",event=>{
  const button=event.target.closest("[data-activity-scope]");if(!button)return;
  activityScope=button.dataset.activityScope;currentPage=1;
  document.querySelectorAll("[data-activity-scope]").forEach(item=>item.classList.toggle("is-active",item===button));
  const visible=filteredRows();
  if(!visible.some(row=>String(row.vehicleId)===String(selectedRealVehicleId)))selectedRealVehicleId=visible[0]?.vehicleId||null;
  renderTable();renderRealDossier();lucide.createIcons();
});

dom.search.addEventListener("input",()=>{currentPage=1;renderTable();lucide.createIcons()});[dom.typeFilter,dom.channelFilter,dom.statusFilter].forEach(select=>select.addEventListener("change",()=>{currentPage=1;renderTable();lucide.createIcons()}));document.getElementById("deadlineTabs").addEventListener("click",event=>{const button=event.target.closest("[data-window]");if(!button)return;activeWindow=button.dataset.window;currentPage=1;document.querySelectorAll("[data-window]").forEach(item=>item.classList.toggle("is-active",item===button));renderTable();lucide.createIcons()});document.getElementById("resetFiltersBtn").addEventListener("click",()=>{activeWindow="all";activityScope="active";currentPage=1;dom.search.value="";dom.typeFilter.value=dom.channelFilter.value=dom.statusFilter.value="all";document.querySelectorAll("[data-window]").forEach(item=>item.classList.toggle("is-active",item.dataset.window==="all"));document.querySelectorAll("[data-activity-scope]").forEach(item=>item.classList.toggle("is-active",item.dataset.activityScope==="active"));const visible=filteredRows();selectedRealVehicleId=visible[0]?.vehicleId||null;renderTable();renderRealDossier();lucide.createIcons()});document.getElementById("newClientBtn").addEventListener("click",()=>clientListState==="ready"?openRealClientModal():openClientModal());automationSettingsButton?.addEventListener("click",showAutomationSettings);document.getElementById("reminderType").addEventListener("change",event=>{const custom=event.target.value==="Personalizat";document.getElementById("customReminderNameField").hidden=!custom;dom.reminderForm.elements.label.required=custom});

/* click-ul pe fundal și tastele rapide închid sigur dialogurile */
[dom.clientModal,dom.vehicleModal,dom.reminderModal,dom.advanceModal,dom.advanceFormModal,dom.paymentModal,dom.actionModal].forEach(modal=>modal.addEventListener("mousedown",event=>{if(event.target===modal)closeModal(modal)}));document.addEventListener("keydown",event=>{if(event.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){event.preventDefault();dom.search.focus()}if(event.key==="Escape")[dom.paymentModal,dom.advanceFormModal,dom.advanceModal,dom.actionModal,dom.reminderModal,dom.vehicleModal,dom.clientModal].find(modal=>!modal.hidden)&&closeModal([dom.paymentModal,dom.advanceFormModal,dom.advanceModal,dom.actionModal,dom.reminderModal,dom.vehicleModal,dom.clientModal].find(modal=>!modal.hidden));if((event.key==="Enter"||event.key===" ")&&event.target.matches("tr[data-select-client]"))event.target.click()});

/* recalcularea temporizată adaptează paginarea după redimensionarea monitorului */
window.addEventListener("resize",()=>{clearTimeout(tableResizeTimer);tableResizeTimer=setTimeout(()=>{currentPage=1;renderTable();lucide.createIcons()},120)});window.addEventListener("load",()=>{renderTable();lucide.createIcons()});

/* funcțiile demo pornesc separat, iar lista principală este recitită din Supabase */
renderModuleDevelopmentProgress();
applyAutomationSettingsPermission();
refreshAll();
loadClientVehicleRows();
