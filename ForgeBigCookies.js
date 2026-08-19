(() => {
'use strict';

/* ============================================================
   COOKIE FORGE — BIG COOKIE BRIDGE 1.0.0

   Lets Forge's SET COOKIES accept values above JS Number's
   1e+308 limit without feeding Infinity/NaN into Cookie Clicker.

   The exact huge balance lives in ForgeBig (BigInt-backed).
   Cookie Clicker receives Number.MAX_VALUE as the spendable
   native balance, which keeps its normal Number-based engine
   stable while Forge displays the exact huge balance.
   ============================================================ */

const CF = window.CookieForge;
const Big = window.ForgeBig;
const Game = window.Game;

if (!CF || !Big || !Game) {
    console.error('[Forge Big Cookies] Forge.js, ForgeBig.js, or Game is missing.');
    return;
}

const KEY = 'CookieForgeBigCookies';
const MAX = Number.MAX_VALUE;
const state = CF.bigCookies = CF.bigCookies || {
    version: '1.0.0',
    active: true,
    virtual: null
};

function readSaved() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) state.virtual = Big.d(raw);
    } catch {}
}

function save(value) {
    try {
        localStorage.setItem(KEY, value.sci(24));
    } catch {}
}

function parse(value) {
    if (value instanceof Big.Decimal) return value;
    const text = String(value ?? '').trim().replace(/,/g, '');
    if (!text) throw new TypeError('Empty cookie amount');
    return Big.d(text);
}

function nativeValue(big) {
    const n = big.valueOf();
    if (!Number.isFinite(n) || n > MAX) return MAX;
    if (n < 0) return 0;
    return n;
}

function apply(big, announce = true) {
    state.virtual = big.clone();
    save(state.virtual);

    const n = nativeValue(big);

    try {
        Game.cookies = n;
        if (typeof Game.cookiesEarned === 'number') {
            Game.cookiesEarned = Math.max(Game.cookiesEarned, n);
        }
        Game.CalculateGains?.();
        Game.UpdateMenu?.();
        Game.Draw?.();
    } catch (e) {
        console.error('[Forge Big Cookies] Native bridge error:', e);
        return false;
    }

    if (announce && CF.showNews) {
        CF.showNews('BIG COOKIES', `SET ${big.sci(14)}`);
    }

    return true;
}

function display() {
    if (!state.virtual) return;

    const text = state.virtual.sci(18);
    const spoof = document.getElementById('CF4_SPOOF');

    if (spoof && state.virtual.c !== undefined) {
        spoof.textContent = text;
    }

    const native = document.getElementById('cookies');
    if (native && state.virtual.valueOf() > MAX) {
        native.style.visibility = 'hidden';
    }

    const input = document.querySelector('.CF4_INPUT');
    if (input && document.activeElement !== input) {
        input.value = text;
    }
}

function patchCookiesMenu() {
    const input = document.querySelector('.CF4_INPUT');
    if (!input) return;

    let setButton = null;
    for (const button of document.querySelectorAll('button')) {
        if (button.textContent.trim() === 'SET COOKIES') {
            setButton = button;
            break;
        }
    }

    if (!setButton || setButton.dataset.forgeBigPatched === '1') return;

    setButton.dataset.forgeBigPatched = '1';
    setButton.textContent = 'SET COOKIES • BIG';

    setButton.onclick = () => {
        try {
            const big = parse(input.value);
            apply(big);
            input.value = big.sci(18);
        } catch (e) {
            CF.showNews?.('BIG COOKIES', 'INVALID BIG NUMBER');
            console.error('[Forge Big Cookies]', e);
        }
    };

    const parent = setButton.parentElement;
    if (parent && !parent.querySelector('[data-forge-big-help]')) {
        const hint = document.createElement('div');
        hint.dataset.forgeBigHelp = '1';
        hint.textContent = 'BIG MODE: accepts 1e309, 1e1000, 1e1000000 and beyond.';
        Object.assign(hint.style, {
            gridColumn: '1 / -1',
            color: '#72ffcb',
            font: '8px monospace',
            opacity: '.8',
            padding: '5px 2px'
        });
        parent.appendChild(hint);
    }
}

readSaved();

/* Replace Forge's Number-only adapter with the Big bridge. */
const originalSet = CF.game.setCookies;
CF.game.setCookies = amount => {
    try {
        const big = parse(amount);
        return apply(big);
    } catch {
        return false;
    }
};

CF.game.setBigCookies = CF.game.setCookies;
CF.game.getBigCookies = () => state.virtual?.clone() || Big.d(Game.cookies || 0);
CF.game.getBigCookiesExact = () =>
    (state.virtual || Big.d(Game.cookies || 0)).toString();

/* Also expose a tiny global API for console use. */
window.ForgeBigCookies = {
    version: '1.0.0',
    set: value => apply(parse(value)),
    get: () => state.virtual?.clone() || Big.d(Game.cookies || 0),
    exact: () => (state.virtual || Big.d(Game.cookies || 0)).toString(),
    scientific: (sig = 18) => (state.virtual || Big.d(Game.cookies || 0)).sci(sig),
    native: () => Game.cookies,
    limit: 'Cookie Clicker native Number engine is capped at Number.MAX_VALUE; Forge stores the larger exact balance separately.'
};

/* Patch the UI whenever the Cookies menu is opened. */
const observer = new MutationObserver(() => patchCookiesMenu());
observer.observe(document.body, { childList: true, subtree: true });

CF.cleanup?.push(() => observer.disconnect());

const loop = () => {
    if (!CF.running) return;
    patchCookiesMenu();
    display();
    requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

CF.features = CF.features || {};
CF.features.bigCookies = true;
CF.bigCookies.version = '1.0.0';

console.info('[Forge Big Cookies] READY — Set Cookies now accepts values above 1e+308.');
if (state.virtual) {
    console.info('[Forge Big Cookies] Restored:', state.virtual.sci(18));
}
})();
