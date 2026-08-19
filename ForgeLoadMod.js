(() => {
'use strict';

/* ============================================================
   FORGE-GUI — MOD LOAD
   One-paste loader for the complete Forge stack.

   Loads in the required order:
     1. Forge.js
     2. ForgeBig.js
     3. ForgeBigMod.js
     4. ForgeGUI.js

   Run in Cookie Clicker DevTools:
     fetch('https://raw.githubusercontent.com/Oddossosososo/ai-test/main/ForgeLoadMod.js').then(r=>r.text()).then(eval)
   ============================================================ */

const BASE = 'https://raw.githubusercontent.com/Oddossosososo/ai-test/main/';
const files = ['Forge.js', 'ForgeBig.js', 'ForgeBigMod.js', 'ForgeGUI.js'];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function loadScript(name) {
    const url = BASE + name + '?v=' + Date.now();
    console.log('[Forge-GUI] Loading:', name);

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);

    const code = await response.text();
    if (!code.trim()) throw new Error(`${name}: empty response`);

    try {
        new Function(code);
    } catch (e) {
        throw new Error(`${name}: syntax error — ${e.message}`);
    }

    const script = document.createElement('script');
    script.textContent = code + `\n//# sourceURL=${url}`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();

    await sleep(80);
    console.log('[Forge-GUI] Loaded:', name, `(${code.length} chars)`);
}

(async () => {
    try {
        for (const file of files) await loadScript(file);

        if (!window.CookieForge) {
            throw new Error('Forge.js loaded but CookieForge was not created.');
        }

        console.log('%c[Forge-GUI] COMPLETE', 'color:#00eaff;font-weight:900;font-size:14px');
        console.log('[Forge-GUI] Version:', window.CookieForge.version);
        console.log('[Forge-GUI] Big engine:', !!window.ForgeBig);
        console.log('[Forge-GUI] Big mode:', !!window.ForgeBigMode);
        console.log('[Forge-GUI] Minimize: M | Big Mode: F8');

        window.ForgeModLoad = {
            ready: true,
            files: [...files],
            version: window.CookieForge.version,
            big: !!window.ForgeBig,
            gui: !!document.querySelector('#FGUI_MINIMIZE')
        };
    } catch (error) {
        console.error('[Forge-GUI] LOAD FAILED:', error);
        window.ForgeModLoad = { ready: false, error: String(error) };
    }
})();
})();