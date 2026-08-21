(() => {
'use strict';

/* ============================================================
   COOKIE FORGE — BIG COOKIE BRIDGE
   Patches the existing Forge game adapter after ForgeBigMode loads.
   Keeps normal Number-compatible values working while allowing
   arbitrary-magnitude scientific notation such as 1e309+.
   ============================================================ */

function install() {
    const CF = window.CookieForge;
    const Game = window.Game;
    const Big = window.ForgeBig;
    const BigMode = window.ForgeBigMode;

    if (!CF || !CF.game || !Game || !Big || !BigMode?.setCookies) {
        return false;
    }

    if (CF.game.__forgeBigBridgeInstalled) return true;

    const refresh = () => {
        try { Game.CalculateGains?.(); } catch {}
        try { Game.RefreshStore?.(); } catch {}
        try { Game.UpdateMenu?.(); } catch {}
        try { Game.storeDisplayAmount?.(); } catch {}
    };

    CF.game.setCookies = amount => {
        try {
            const value = Big.d(String(amount).trim());
            const result = BigMode.setCookies(value.sci(24));
            refresh();
            return !!result;
        } catch (error) {
            console.error('[Cookie Forge] Set Cookies failed:', error);
            return false;
        }
    };

    CF.game.addCookies = amount => {
        try {
            const result = BigMode.addCookies(String(amount).trim());
            refresh();
            return !!result;
        } catch (error) {
            console.error('[Cookie Forge] Add Cookies failed:', error);
            return false;
        }
    };

    CF.game.testBigCookieInputs = () => {
        const inputs = ['1e308', '1e309', '1e1000', '1e1000000'];
        const results = inputs.map(input => {
            try {
                const value = Big.d(input);
                return {
                    input,
                    accepted: true,
                    normalized: value.sci(18),
                    fitsNative: value.fitsNative()
                };
            } catch (error) {
                return {
                    input,
                    accepted: false,
                    error: String(error)
                };
            }
        });

        return {
            ok: results.every(result => result.accepted),
            results
        };
    };

    CF.game.__forgeBigBridgeInstalled = true;
    CF.features = CF.features || {};
    CF.features.arbitraryMagnitudeCookies = true;

    console.info('[Cookie Forge] Set Cookies bridge installed — ForgeBigMode active.');
    console.info('[Cookie Forge] Dry-run tests:', CF.game.testBigCookieInputs());
    return true;
}

if (!install()) {
    let tries = 0;
    const timer = setInterval(() => {
        if (install() || ++tries >= 200) clearInterval(timer);
    }, 50);
}
})();
