(() => {
'use strict';

/* ============================================================
   FORGE-GUI — MOD LOAD
   One-paste loader for the complete Forge stack.

   Loads in order:
   Forge.js -> ForgeBig.js -> ForgeBigMod.js -> ForgeGUI.js
   -> ForgeBigCookies.js
   ============================================================ */

const BASE = 'https://raw.githubusercontent.com/Oddossosososo/ai-test/main/';
const files = [
    'Forge.js',
    'ForgeBig.js',
    'ForgeBigMod.js',
    'ForgeGUI.js',
    'ForgeBigCookies.js'
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function loadScript(name) {
    const url = BASE + name + '?v=' + Date.now();
    console.log('[Forge-GUI] Loading:', name);

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);

    const code = await response.text();
    if (!code.trim()) throw new Error(`${name}: empty response`);

    try {
        new Function(code);
    } catch (error) {
        throw new Error(`${name}: syntax error — ${error.message}`);
    }

    const script = document.createElement('script');
    script.textContent = code + `\n//# sourceURL=${url}`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    await sleep(100);

    console.log('[Forge-GUI] Loaded:', name, `(${code.length} chars)`);
}

(async () => {
    try {
        for (const file of files) await loadScript(file);

        if (!window.CookieForge) {
            throw new Error('CookieForge was not created by Forge.js.');
        }

        window.ForgeModLoad = {
            ready: true,
            files: [...files],
            version: window.CookieForge.version,
            big: !!window.ForgeBig,
            bigMode: !!window.ForgeBigMode,
            bigCookies: !!window.ForgeBigCookies,
            gui: !!document.querySelector('#FGUI_MINIMIZE')
        };

        console.log('%c[Forge-GUI] COMPLETE', 'color:#00eaff;font-weight:900;font-size:14px');
        console.log('[Forge-GUI] Version:', window.CookieForge.version);
        console.log('[Forge-GUI] Big engine:', !!window.ForgeBig);
        console.log('[Forge-GUI] Big mode:', !!window.ForgeBigMode);
        console.log('[Forge-GUI] Big cookies:', !!window.ForgeBigCookies);
        console.log('[Forge-GUI] Minimize: M | Big Mode: F8');
        console.log('[Forge-GUI] Set Cookies now accepts 1e309+ values.');
    } catch (error) {
        console.error('[Forge-GUI] LOAD FAILED:', error);
        window.ForgeModLoad = { ready: false, error: String(error) };
    }
})();
})();