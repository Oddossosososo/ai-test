/* Cookie Forge mod loader */
(() => {
    'use strict';

    const src = document.currentScript?.src;
    const forge = src ? new URL('./Forge.js', src).href : './Forge.js';

    if (window.CookieForge?.destroy) {
        try { window.CookieForge.destroy(); } catch {}
    }

    if (typeof Game?.LoadMod === 'function') {
        Game.LoadMod(forge);
    } else {
        const script = document.createElement('script');
        script.src = forge;
        script.onload = () => console.log('[Cookie Forge] Loaded.');
        script.onerror = e => console.error('[Cookie Forge] Failed to load Forge.js', e);
        document.head.appendChild(script);
    }
})();
