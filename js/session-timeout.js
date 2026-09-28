(function () {
    'use strict';

    /* limita de inactivitate pentru utilizatorii care nu sunt Admin */
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
    const LAST_ACTIVITY_KEY = 'hub_last_activity';
    const LAST_ACTIVITY_USER_KEY = 'hub_last_activity_user';
    const CLIENT_RETRY_MS = 250;
    const AUTH_RETRY_MIN_MS = 3000;
    const AUTH_RETRY_MAX_MS = 30000;

    /* starea verificată a utilizatorului curent; rolul nu este salvat în browser */
    let accessState = 'waiting';
    let currentUserId = null;
    let inactivityTimer = null;
    let clientRetryTimer = null;
    let authRetryTimer = null;
    let authRetryDelay = AUTH_RETRY_MIN_MS;
    let authSubscription = null;
    let activeClient = null;
    let resolutionVersion = 0;
    let resolutionInProgress = false;
    let pendingResolutionReason = null;
    let isLoggingOut = false;

    /* găsește clientul Supabase deja creat de pagina curentă */
    function getClient() {
        if (window.supabaseClient) return window.supabaseClient;

        try {
            if (typeof supabaseClient !== 'undefined') return supabaseClient;
        } catch (error) {
            console.warn('Clientul Supabase nu este încă disponibil:', error);
        }

        try {
            if (typeof sb !== 'undefined') return sb;
        } catch (error) {
            console.warn('Clientul Supabase alternativ nu este încă disponibil:', error);
        }

        return null;
    }

    /* oprește temporizatoarele fără să modifice sesiunea Supabase */
    function stopInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }

    function stopAuthRetry() {
        clearTimeout(authRetryTimer);
        authRetryTimer = null;
    }

    /* citește în siguranță ultima activitate comună tuturor taburilor */
    function getLastActivity() {
        const storedValue = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
        return Number.isFinite(storedValue) && storedValue > 0 ? storedValue : 0;
    }

    function isActivityExpired(lastActivity = getLastActivity()) {
        return Boolean(lastActivity) && Date.now() - lastActivity >= SESSION_TIMEOUT_MS;
    }

    /* curăță activitatea numai dacă aparține utilizatorului gestionat */
    function clearUserActivity(userId = currentUserId) {
        const storedUserId = localStorage.getItem(LAST_ACTIVITY_USER_KEY);
        if (!userId || storedUserId === userId) {
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            localStorage.removeItem(LAST_ACTIVITY_USER_KEY);
        }
    }

    /* trece scriptul într-o stare sigură în timp ce autentificarea sau rolul se rezolvă */
    function waitForAccessResolution() {
        accessState = 'waiting';
        stopInactivityTimer();
    }

    /* redirecționează când Supabase confirmă că nu mai există o sesiune validă */
    function handleSignedOut() {
        resolutionVersion += 1;
        stopAuthRetry();
        stopInactivityTimer();
        clearUserActivity();
        currentUserId = null;
        accessState = 'signed-out';

        if (!isLoggingOut && window.location.pathname !== '/modules/admin/login.html') {
            window.location.replace('/modules/admin/login.html');
        }
    }

    /* delogare automată folosită doar după confirmarea unui rol non-Admin */
    async function logoutForInactivity() {
        if (isLoggingOut) return;
        isLoggingOut = true;
        stopInactivityTimer();

        try {
            const client = activeClient || getClient();
            if (client?.auth) {
                await client.auth.signOut();
            }
        } catch (error) {
            console.error('Eroare autodeconectare:', error);
        } finally {
            clearUserActivity();
            window.location.replace('/modules/admin/login.html?reason=inactive');
        }
    }

    /* reprogramează verificarea folosind timestamp-ul comun, nu timpul tabului curent */
    function scheduleInactivityCheck(lastActivity = getLastActivity()) {
        stopInactivityTimer();
        if (accessState !== 'timed' || !lastActivity) return;

        const remainingTime = SESSION_TIMEOUT_MS - (Date.now() - lastActivity);
        if (remainingTime <= 0) {
            requestAccessResolution('expiry');
            return;
        }

        inactivityTimer = setTimeout(checkInactivity, remainingTime);
    }

    /* verifică expirarea înainte de a permite înregistrarea unei activități noi */
    function checkInactivity() {
        if (accessState !== 'timed') return;

        const lastActivity = getLastActivity();
        if (!lastActivity) {
            registerActivity();
            return;
        }

        if (isActivityExpired(lastActivity)) {
            stopInactivityTimer();
            requestAccessResolution('expiry');
            return;
        }

        scheduleInactivityCheck(lastActivity);
    }

    /* înregistrează activitatea numai după ce rolul non-Admin a fost confirmat */
    function registerActivity() {
        if (accessState !== 'timed' || !currentUserId) return;

        const lastActivity = getLastActivity();
        if (isActivityExpired(lastActivity)) {
            stopInactivityTimer();
            requestAccessResolution('expiry');
            return;
        }

        const now = Date.now();
        localStorage.setItem(LAST_ACTIVITY_USER_KEY, currentUserId);
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        scheduleInactivityCheck(now);
    }

    /* pornește timeout-ul după ce identitatea și rolul non-Admin sunt verificate */
    function enableTimedAccess(userId, resolutionReason) {
        const storedUserId = localStorage.getItem(LAST_ACTIVITY_USER_KEY);
        const userChanged = storedUserId !== userId;

        currentUserId = userId;
        accessState = 'timed';

        if (userChanged) {
            const now = Date.now();
            localStorage.setItem(LAST_ACTIVITY_USER_KEY, userId);
            localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
            scheduleInactivityCheck(now);
            return;
        }

        const lastActivity = getLastActivity();
        if (!lastActivity) {
            registerActivity();
            return;
        }

        if (resolutionReason === 'expiry' && isActivityExpired(lastActivity)) {
            logoutForInactivity();
            return;
        }

        checkInactivity();
    }

    /* Admin nu are timer de inactivitate și nu păstrează un timestamp expirabil */
    function enableAdminAccess(userId) {
        currentUserId = userId;
        accessState = 'admin';
        stopInactivityTimer();
        clearUserActivity(userId);
    }

    /* erorile temporare păstrează sesiunea și reîncearcă fără a aplica timeout-ul */
    function retryAccessResolution(reason, error) {
        if (error) {
            console.warn('Rolul pentru timeout nu a putut fi verificat. Se reîncearcă:', error);
        }

        waitForAccessResolution();
        stopAuthRetry();
        authRetryTimer = setTimeout(() => {
            requestAccessResolution(reason === 'expiry' ? 'expiry' : 'retry');
        }, authRetryDelay);
        authRetryDelay = Math.min(authRetryDelay * 2, AUTH_RETRY_MAX_MS);
    }

    /* validează utilizatorul la server și citește rolul direct din auth_profiles */
    async function resolveAccess(reason) {
        if (!activeClient?.auth || isLoggingOut) return;

        const versionAtStart = resolutionVersion;
        waitForAccessResolution();

        try {
            const { data: userData, error: userError } = await activeClient.auth.getUser();
            if (versionAtStart !== resolutionVersion || isLoggingOut) return;

            if (userError) {
                retryAccessResolution(reason, userError);
                return;
            }

            const user = userData?.user;
            if (!user) {
                handleSignedOut();
                return;
            }

            const { data: profile, error: profileError } = await activeClient
                .from('auth_profiles')
                .select('rol_id')
                .eq('id', user.id)
                .single();

            if (versionAtStart !== resolutionVersion || isLoggingOut) return;

            if (profileError || !profile) {
                retryAccessResolution(reason, profileError || new Error('Profilul utilizatorului lipsește.'));
                return;
            }

            stopAuthRetry();
            authRetryDelay = AUTH_RETRY_MIN_MS;

            if (Number(profile.rol_id) === 1) {
                enableAdminAccess(user.id);
                return;
            }

            enableTimedAccess(user.id, reason);
        } catch (error) {
            if (versionAtStart === resolutionVersion && !isLoggingOut) {
                retryAccessResolution(reason, error);
            }
        }
    }

    /* serializează rezolvările pornite de focus, expirare și evenimentele Supabase */
    function requestAccessResolution(reason = 'auth') {
        if (isLoggingOut || accessState === 'signed-out') return;

        if (resolutionInProgress) {
            pendingResolutionReason = reason === 'expiry' ? 'expiry' : (pendingResolutionReason || reason);
            return;
        }

        resolutionInProgress = true;
        resolveAccess(reason).finally(() => {
            resolutionInProgress = false;
            if (pendingResolutionReason) {
                const nextReason = pendingResolutionReason;
                pendingResolutionReason = null;
                requestAccessResolution(nextReason);
            }
        });
    }

    /* reacționează la login, logout, refresh de token și schimbarea utilizatorului */
    function subscribeToAuthChanges() {
        const { data } = activeClient.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                handleSignedOut();
                return;
            }

            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' ||
                event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                resolutionVersion += 1;
                waitForAccessResolution();

                // Apelurile Supabase sunt lansate după callback-ul de auth pentru a evita blocarea clientului.
                setTimeout(() => requestAccessResolution('auth'), 0);
            }
        });

        authSubscription = data?.subscription || null;
    }

    /* așteaptă clientul paginii înainte de orice control al inactivității */
    function initialize() {
        const client = getClient();
        if (!client?.auth || typeof client.from !== 'function') {
            clientRetryTimer = setTimeout(initialize, CLIENT_RETRY_MS);
            return;
        }

        clearTimeout(clientRetryTimer);
        activeClient = client;
        subscribeToAuthChanges();
        requestAccessResolution('initial');
    }

    /* activitate reală în HUB; Admin și stările nerezolvate sunt ignorate */
    ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
        window.addEventListener(eventName, registerActivity, { passive: true });
    });

    /* la revenirea în PWA se verifică expirarea înaintea oricărei activități */
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkInactivity();
    });
    window.addEventListener('focus', checkInactivity);
    window.addEventListener('pageshow', checkInactivity);

    /* sincronizare între taburi fără a rescrie valoarea primită prin storage */
    window.addEventListener('storage', (event) => {
        if (event.key !== LAST_ACTIVITY_KEY || event.newValue === null) return;
        if (accessState === 'timed') checkInactivity();
    });

    initialize();

    /* API public păstrat compatibil pentru integrare și testare */
    window.HubSessionTimeout = {
        reset: registerActivity,
        check: checkInactivity,
        logout: logoutForInactivity,
        getLastActivity,
        getState: () => accessState,
        isAdmin: () => accessState === 'admin'
    };

    /* curăță listenerul Supabase dacă documentul este eliminat definitiv */
    window.addEventListener('pagehide', (event) => {
        if (!event.persisted) authSubscription?.unsubscribe();
    });
})();
