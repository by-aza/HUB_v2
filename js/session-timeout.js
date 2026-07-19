(function () {
    'use strict';

    // Delogare după 30 de minute fără activitate
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
    const LAST_ACTIVITY_KEY = 'hub_last_activity';

    let inactivityTimer = null;
    let isLoggingOut = false;

    // Găsește clientul Supabase existent
    function getClient() {
        if (window.supabaseClient) return window.supabaseClient;

        if (typeof supabaseClient !== 'undefined') {
            return supabaseClient;
        }

        if (typeof sb !== 'undefined') {
            return sb;
        }

        return null;
    }

    // Deconectează utilizatorul
    async function logoutForInactivity() {
        if (isLoggingOut) return;
        isLoggingOut = true;

        try {
            const client = getClient();

            if (client?.auth) {
                await client.auth.signOut();
            }
        } catch (error) {
            console.error('Eroare autodeconectare:', error);
        } finally {
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            window.location.replace('/modules/admin/login.html?reason=inactive');
        }
    }

    // Verifică timpul real trecut
    function checkInactivity() {
        const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));

        if (!lastActivity) {
            registerActivity();
            return;
        }

        const elapsedTime = Date.now() - lastActivity;
        const remainingTime = SESSION_TIMEOUT_MS - elapsedTime;

        clearTimeout(inactivityTimer);

        if (remainingTime <= 0) {
            logoutForInactivity();
            return;
        }

        inactivityTimer = setTimeout(
            logoutForInactivity,
            remainingTime
        );
    }

    // Înregistrează activitatea utilizatorului
    function registerActivity() {
        localStorage.setItem(
            LAST_ACTIVITY_KEY,
            String(Date.now())
        );

        clearTimeout(inactivityTimer);

        inactivityTimer = setTimeout(
            logoutForInactivity,
            SESSION_TIMEOUT_MS
        );
    }

    // Activitate reală în HUB
    ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
        window.addEventListener(eventName, registerActivity, {
            passive: true
        });
    });

    // Verifică atunci când PWA revine în prim-plan
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkInactivity();
        }
    });

    window.addEventListener('focus', checkInactivity);
    window.addEventListener('pageshow', checkInactivity);

    // Sincronizare între taburi
    window.addEventListener('storage', (event) => {
        if (event.key === LAST_ACTIVITY_KEY) {
            checkInactivity();
        }
    });

    // Verificare la încărcarea paginii
    checkInactivity();

    // Funcții disponibile pentru test
    window.HubSessionTimeout = {
        reset: registerActivity,
        check: checkInactivity,
        logout: logoutForInactivity,
        getLastActivity: () =>
            Number(localStorage.getItem(LAST_ACTIVITY_KEY))
    };
})();