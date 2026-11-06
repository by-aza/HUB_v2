/* Conexiunea HUB a modulului: autentificare HUB, snapshot coerent și RPC-uri idempotente. */
(() => {
  "use strict";
  const PROJECT = "xyovkxmtbvgcwavuyxxu";
  const allowed = new Set(["ep_save_supplier", "ep_save_invoice", "ep_save_allocations", "ep_register_movement", "ep_set_default"]);
  let client, profile = null, defaults = { tva_proc: 21, coeficient_df: 1.53 };
  let pending = null, busy = false, stale = true, callbacks = {}, authSubscription;
  const uuid = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const h = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return [h.slice(0,8), h.slice(8,12), h.slice(12,16), h.slice(16,20), h.slice(20)].join("-");
  };
  const storageKey = () => `hub-ep-intent:${PROJECT}:${profile?.id}`;
  const remember = () => {
    try {
      if (pending) sessionStorage.setItem(storageKey(), JSON.stringify(pending));
      else sessionStorage.removeItem(storageKey());
    } catch (_) { /* Fără storage, intenția rămâne în memoria filei curente. */ }
  };
  const notify = (message = "") => callbacks.onState?.({
    profile, busy, stale, pending: Boolean(pending), message, defaults: { ...defaults }
  });
  const accessLost = (message) => {
    profile = null; stale = true;
    callbacks.onData?.({ suppliers: [], invoices: [], parts: [], returns: [], warehouseTransfers: [], dfImports: [] });
    notify(message);
  };
  const authorize = async () => {
    const { data: { user } = {}, error } = await client.auth.getUser();
    if (error || !user) {
      accessLost("Sesiunea a expirat. Autentifică-te în HUB.");
      throw new Error("Autentificarea în HUB este necesară.");
    }
    const response = await client.from("auth_profiles").select("id,rol_id,permissions").eq("id", user.id).single();
    if (response.error) throw new Error("Profilul HUB nu a putut fi verificat.");
    const p = response.data;
    if (Number(p.rol_id) !== 1 && p.permissions?.evidenta_piese !== true) {
      accessLost("Nu ai acces la Evidență Facturi & Piese.");
      throw new Error("Acces refuzat: este necesară permisiunea evidenta_piese.");
    }
    if (profile && profile.id !== p.id) { pending = null; stale = true; }
    profile = p;
    return p;
  };

  /* Adaptarea denumirilor DB la modelul UI existent păstrează UUID-urile și sursele istorice. */
  const mapSnapshot = (s) => {
    const groups = (rows, key) => {
      const map = new Map();
      rows.forEach((r) => { if (!map.has(r[key])) map.set(r[key], []); map.get(r[key]).push(r); });
      return map;
    };
    const accounts = groups(s.accounts, "furnizor_id"), allocations = groups(s.allocations, "linie_id");
    const parts = s.lines.map((l) => {
      const al = (allocations.get(l.id) || []).map((a) => ({
        id: a.id, plate: a.nr_inmatriculare_original, model: a.model_original,
        vehicleId: a.vehicle_id, qty: a.cantitate
      }));
      return {
        id: l.id, invoiceId: l.factura_id, name: l.denumire, code: l.cod_piesa || "",
        qty: l.cantitate, price: l.pret_achizitie_net, vatRate: l.tva_proc, markup: l.coeficient_df,
        priceBasis: "net", plate: al.length === 1 ? al[0].plate : null,
        model: al.length === 1 ? al[0].model : null, allocations: al,
        df: l.blocaj_istoric || null, status: al.length ? "Atribuită" : "Neatribuită",
        location: l.locatie || "", note: l.observatii || ""
      };
    });
    const partMap = new Map(parts.map((p) => [p.id, p]));
    const source = (r) => {
      if (!r.alocare_id) return { type: "unallocated" };
      const part = partMap.get(r.linie_id), index = part?.allocations.findIndex((a) => a.id === r.alocare_id);
      if (index == null || index < 0) throw new Error("Legătura unei mișcări nu a putut fi încărcată.");
      const a = part.allocations[index];
      return { type: "allocation", allocationIndex: index, allocationId: a.id, plate: a.plate, model: a.model };
    };
    return {
      suppliers: s.suppliers.map((f) => ({
        id: f.id, revision: f.revision, name: f.denumire, cui: f.cui || "", regCom: f.registru_comert || "",
        contact: f.persoana_contact || "", city: f.oras || "", address: f.adresa || "",
        phone: f.telefon || "", email: f.email || "", notes: f.observatii || "", active: f.activ,
        bankAccounts: (accounts.get(f.id) || []).map((a) => ({ id: a.id, iban: a.iban, bank: a.banca || "" })),
        iban: (accounts.get(f.id) || [])[0]?.iban || ""
      })),
      invoices: s.invoices.map((f) => ({
        id: f.id, revision: f.revision, number: f.numar, supplierId: f.furnizor_id,
        date: f.data_factura, status: f.status_document, note: f.observatii || ""
      })),
      parts, dfImports: (s.imports || []).map(r => ({
        id:r.id,dfId:r.df_id,reference:`DF-${String(r.df_id).padStart(3,"0")}`,
        partId:r.part_id,invoiceId:partMap.get(r.part_id)?.invoiceId,allocationId:r.allocation_id,
        qty:Number(r.qty),plate:r.snapshot.plate,unitPriceWithVat:r.snapshot.unit_price,
        createdAt:r.snapshot.imported_at
      })),
      returns: s.returns.map((r) => ({
        id: r.id, code: `RET-${r.id.slice(0,8).toUpperCase()}`, partId: r.linie_id,
        qty: r.cantitate, source: source(r), requestedAt: r.data_retur,
        reference: r.referinta || "", reason: r.motiv || "", note: r.observatii || "",
        history: [{ date: r.data_retur }]
      })),
      warehouseTransfers: s.transfers.map((t) => ({
        id: t.id, reference: `MAG-${t.id.slice(0,8).toUpperCase()}`, partId: t.linie_id,
        invoiceId: partMap.get(t.linie_id)?.invoiceId, qty: t.cantitate, source: source(t),
        notes: t.observatii || "", createdAt: t.created_at, localDate: t.data_trimitere
      }))
    };
  };
  const load = async ({ duringWrite = false } = {}) => {
    if (busy && !duringWrite) throw new Error("Așteaptă finalizarea salvării.");
    await authorize();
    const { data, error } = await client.rpc("ep_load_registry");
    if (error) { stale = true; notify("Registrul nu a putut fi încărcat. Reîncearcă."); throw new Error(error.message); }
    const mapped = mapSnapshot(data);
    defaults = { ...data.defaults };
    callbacks.onData?.(mapped);
    stale = false; notify(pending ? "O salvare anterioară trebuie reverificată." : "Date încărcate din HUB.");
    return mapped;
  };

  /* Un rezultat incert păstrează aceeași cerere; nu se generează automat o operație nouă. */
  const write = async (rpc, payload, { recover = false } = {}) => {
    if (busy) throw new Error("Există deja o salvare în curs.");
    if (!allowed.has(rpc)) throw new Error("Operație nepermisă.");
    await authorize();
    if (stale && !recover) throw new Error("Actualizează registrul și redeschide formularul înainte de salvare.");
    if (pending && (pending.rpc !== rpc || JSON.stringify(pending.p) !== JSON.stringify(payload))) {
      throw new Error("Reverifică mai întâi salvarea anterioară folosind butonul din antet.");
    }
    pending ||= { rpc, p: payload, id: uuid() };
    remember(); busy = true; notify("Se salvează în HUB…");
    const operation = pending;
    let response;
    try { response = await client.rpc(rpc, { p_request: operation.id, p: operation.p }); }
    catch (_) { busy = false; notify("Răspunsul salvării este incert. Reverifică aceeași cerere."); throw new Error("Conexiunea s-a întrerupt. Reverifică salvarea, fără a crea o operație nouă."); }
    if (response.error) {
      busy = false;
      const definite = /^[0-9A-Z]{5}$/.test(response.error.code || "") || /^PGRST\d+$/.test(response.error.code || "");
      if (definite) { pending = null; remember(); stale = true; }
      notify(definite ? "Salvarea a fost refuzată. Actualizează registrul și redeschide formularul." : "Răspuns incert. Reverifică salvarea.");
      throw new Error(definite ? (response.error.message || "Salvarea a fost refuzată.") : "Răspunsul este incert. Reverifică salvarea anterioară; operația poate fi deja înregistrată.");
    }
    pending = null; remember();
    const result = response.data;
    try {
      await load({ duringWrite: true }); busy = false; notify("Date încărcate din HUB.");
      return { ...result, refreshed: true };
    }
    catch (_) {
      busy = false; stale = true; notify("Salvarea este confirmată în HUB. Actualizează registrul pentru a vedea rezultatul.");
      return { ...result, refreshed: false };
    }
  };
  const getDefaults = async () => {
    const { data, error } = await client.rpc("ep_get_defaults");
    if (error) throw new Error("Coeficientul implicit nu a putut fi încărcat.");
    defaults = { ...data };
    return { ...defaults };
  };
  const recover = async () => {
    if (!pending) return;
    const result = await write(pending.rpc, pending.p, { recover: true });
    window.dispatchEvent(new CustomEvent("ep:recovered", { detail: result }));
    return result;
  };
  const init = async (options) => {
    callbacks = options;
    if (typeof SUPABASE_URL === "undefined" || new URL(SUPABASE_URL).hostname !== `${PROJECT}.supabase.co`) {
      throw new Error("Configurația acestei pagini trebuie să indice Supabase HUB.");
    }
    client = supabaseClient;
    await authorize();
    try {
      const cached = JSON.parse(sessionStorage.getItem(storageKey()) || "null");
      if (cached && allowed.has(cached.rpc) && typeof cached.id === "string" && cached.p && typeof cached.p === "object") pending = cached;
    } catch (_) { /* Intenția invalidă nu este executată. */ }
    authSubscription = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") { pending = null; accessLost("Sesiunea s-a închis. Autentifică-te în HUB."); }
      else if (profile && session?.user?.id && session.user.id !== profile.id) {
        pending = null; accessLost("Contul HUB s-a schimbat. Actualizează registrul.");
      }
    }).data.subscription;
    window.addEventListener("focus", () => {
      if (!busy) authorize().then(() => notify(pending ? "Reverifică salvarea anterioară." : "Date HUB.")).catch(() => {});
    });
    await load();
  };
  window.HubEpApi = { init, load, write, recover, getDefaults, uuid,
    get profile() { return profile; }, get defaults() { return { ...defaults }; },
    get busy() { return busy; }, get stale() { return stale; }, get pending() { return Boolean(pending); } };
})();
