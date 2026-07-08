async function addAuditLog(entry = {}) {
    if (!supabaseClient || typeof supabaseClient.from !== 'function') {
        throw new Error('Clientul global supabaseClient nu este disponibil.');
    }

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error('addAuditLog() așteaptă un obiect cu datele de audit.');
    }

    const payload = Object.fromEntries(
        Object.entries(entry).filter(([, value]) => value !== undefined)
    );

    if (!Object.keys(payload).length) {
        throw new Error('Nu există date de inserat în audit_logs.');
    }

    const { data, error } = await supabaseClient
        .from('audit_logs')
        .insert([payload])
        .select()
        .maybeSingle();

    if (error) {
        console.error('Eroare la inserarea în audit_logs:', error);
        throw error;
    }

    return data;
}

window.addAuditLog = addAuditLog;
