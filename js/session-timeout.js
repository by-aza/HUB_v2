
(function () {
    'use strict';

    // Durata de test: 30 minute
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

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
            localStorage.removeItem('hub_last_activity');
            window.location.replace('/modules/admin/login.html?reason=inactive');
        }
    }

    // Pornește din nou timpul de inactivitate
    function resetInactivityTimer() {
        localStorage.setItem('hub_last_activity', String(Date.now()));

        clearTimeout(inactivityTimer);

        inactivityTimer = setTimeout(() => {
            logoutForInactivity();
        }, SESSION_TIMEOUT_MS);
    }

    // Activitate reală a utilizatorului
    ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
        window.addEventListener(eventName, resetInactivityTimer, {
            passive: true
        });
    });

    // Sincronizare între taburi
    window.addEventListener('storage', (event) => {
        if (event.key === 'hub_last_activity' && event.newValue) {
            resetInactivityTimer();
        }
    });

    // Pornește sistemul imediat
    resetInactivityTimer();

    // Funcții disponibile pentru verificare
    window.HubSessionTimeout = {
        reset: resetInactivityTimer,
        logout: logoutForInactivity
    };
})();