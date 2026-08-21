(() => {
'use strict';

/* ============================================================
   COOKIE FORGE — SPOOF POSITION MOD
   Keep the Forge cookie spoofer aligned to Game.cookieDisplay.
   ============================================================ */

const positionSpoof = () => {
    const spoof = document.getElementById('CF4_SPOOF');
    const strip = document.getElementById('CF4_STRIP');
    const game = window.Game;

    if (!spoof || !game) return;

    const display =
        game.cookieDisplay &&
        typeof game.cookieDisplay.getBoundingClientRect === 'function'
            ? game.cookieDisplay
            : document.getElementById('cookies');

    if (!display) return;

    const rect = display.getBoundingClientRect();

    spoof.style.position = 'fixed';
    spoof.style.left = `${rect.left}px`;
    spoof.style.top = `${rect.top}px`;
    spoof.style.width = `${rect.width}px`;
    spoof.style.height = `${rect.height}px`;
    spoof.style.transform = 'none';
    spoof.style.textAlign = 'center';

    if (strip) {
        strip.style.position = 'fixed';
        strip.style.left = `${rect.left}px`;
        strip.style.top = `${rect.top}px`;
        strip.style.width = `${rect.width}px`;
        strip.style.height = `${rect.height}px`;
    }
};

let raf = 0;
const tick = () => {
    positionSpoof();
    raf = requestAnimationFrame(tick);
};

tick();

window.CookieForgeSpoofPosition = {
    position: positionSpoof,
    stop() {
        cancelAnimationFrame(raf);
    }
};

console.log('[Cookie Forge] Spoofer aligned to Game.cookieDisplay.');
})();
