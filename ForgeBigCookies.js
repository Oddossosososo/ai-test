(() => {
'use strict';

/* COOKIE FORGE — BIG COOKIE BRIDGE 2.4 */
const CF = window.CookieForge;
const Big = window.ForgeBig;
const Game = window.Game;

if (!CF || !Big || !Game) {
    console.error('[Forge Big Cookies] Forge.js, ForgeBig.js, or Game is missing.');
    return;
}

const KEY = 'CookieForgeBigCookies';
const bigState = CF.__bigCookieState = CF.__bigCookieState || {
    version: '2.4.0', active: true, virtual: null
};

/* Exact scientific-notation -> BigInt conversion.
   Input MUST stay a string so JavaScript never converts 1e309 to Infinity. */
function scientificToBigInt(scientificStr) {
    const text = String(scientificStr)
        .trim()
        .replace(/,/g, '')
        .toLowerCase();

    const match = text.match(/^([+-]?\d*(?:\.\d*)?)e([+-]?\d+)$/);
    if (!match) throw new Error('Invalid scientific notation format');

    const base = match[1];
    let exponent = parseInt(match[2], 10);

    if (exponent < 0) {
        throw new Error('BigInt cannot represent a negative-exponent decimal');
    }

    const negative = base.startsWith('-');
    const unsignedBase = base.replace(/^[+-]/, '');
    let [whole, decimal = ''] = unsignedBase.split('.');
    whole = whole || '0';

    exponent -= decimal.length;
    if (exponent < 0) {
        throw new Error('Result contains a fractional part');
    }

    const digits = (whole + decimal).replace(/^0+(?=\d)/, '') || '0';
    const magnitude = BigInt(digits) * (10n ** BigInt(exponent));
    return negative ? -magnitude : magnitude;
}

function parse(value) {
    if (value instanceof Big.Decimal) return value.clone();

    const text = String(value ?? '').trim().replace(/,/g, '');
    if (!text) throw new TypeError('Empty cookie amount');

    /* Keep huge scientific values as strings. Never Number(text). */
    if (/^[+-]?\d*(?:\.\d*)?e[+-]?\d+$/i.test(text)) {
        try {
            return Big.d(scientificToBigInt(text));
        } catch {}
    }

    return Big.d(text);
}

function save(value) {
    try { localStorage.setItem(KEY, value.sci(24)); } catch {}
}

function readSaved() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) bigState.virtual = Big.d(raw);
    } catch {}
}

function nativeValue(big) {
    const n = Big.native ? Big.native(big) : big.nativeValue();
    if (!Number.isFinite(n)) return Number.MAX_VALUE;
    return n < 0 ? 0 : n;
}

function apply(big, announce = true) {
    bigState.virtual = big.clone();
    save(bigState.virtual);

    try {
        /* Vanilla Cookie Clicker remains Number-based at this boundary.
           Forge's stored/displayed value remains exact and arbitrary-size. */
        Game.cookies = nativeValue(big);
        if (typeof Game.cookiesEarned === 'number') {
            Game.cookiesEarned = Math.max(Game.cookiesEarned, Game.cookies);
        }
        Game.CalculateGains?.();
        Game.UpdateMenu?.();
        Game.Draw?.();
    } catch (e) {
        console.error('[Forge Big Cookies] Native bridge error:', e);
        return false;
    }

    if (announce) CF.showNews?.('BIG COOKIES', `SET ${big.sci(14)}`);
    return true;
}

function hideNativeCookieCounter() {
    const native = document.getElementById('cookies');
    if (native) {
        native.style.visibility = 'hidden';
        native.style.pointerEvents = 'none';
    }
}

function showForgeCookieCounter(text) {
    const spoof = document.getElementById('CF4_SPOOF');
    if (spoof) {
        spoof.textContent = text;
        spoof.style.visibility = 'visible';
    }
}

function suppressCookieOverlay() {
    hideNativeCookieCounter();
    const counter = document.getElementById('cookies');
    if (counter) counter.style.display = 'none';
}

function setShoppingTitle() {
    document.title = 'Cookie Forge — Shopping Mode';
}

function restoreTitle() {
    document.title = 'Cookie Clicker';
}

function patchShopping() {
    for (const el of document.querySelectorAll('.product, .crate, .productBox')) {
        if (el.dataset.forgeShoppingPatched === '1') continue;
        el.dataset.forgeShoppingPatched = '1';
        el.addEventListener('mouseenter', setShoppingTitle, { passive: true });
        el.addEventListener('mouseleave', setShoppingTitle, { passive: true });
    }
}

function grantThirdParty() {
    try {
        if (typeof Game.Win === 'function') {
            Game.Win('Third-party');
            return true;
        }
    } catch (e) {
        console.warn('[Cookie Forge] Could not grant Third-party:', e);
    }
    return false;
}

function patchCookiesMenu() {
    const input = document.querySelector('.CF4_INPUT');
    if (!input) return;

    let setButton = null;
    for (const button of document.querySelectorAll('button')) {
        if (/^SET COOKIES(?: • BIG)?$/.test(button.textContent.trim())) {
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
}

readSaved();
CF.game = CF.game || {};
CF.game.setCookies = amount => {
    try { return apply(parse(amount)); }
    catch (e) { console.error('[Forge Big Cookies]', e); return false; }
};
CF.game.addCookies = amount => {
    try {
        const value = parse(amount);
        const current = bigState.virtual?.clone() || Big.d(String(Game.cookies || 0));
        return apply(current.add(value));
    } catch (e) {
        console.error('[Forge Big Cookies]', e);
        return false;
    }
};
CF.game.setBigCookies = CF.game.setCookies;
CF.game.addBigCookies = CF.game.addCookies;
CF.game.getBigCookies = () => bigState.virtual?.clone() || Big.d(String(Game.cookies || 0));
CF.game.getBigCookiesExact = () => (bigState.virtual || Big.d(String(Game.cookies || 0))).toString();

window.scientificToBigInt = scientificToBigInt;

window.ForgeBigCookies = {
    version: '2.4.0',
    set: value => { try { return apply(parse(value)); } catch (e) { console.error('[Forge Big Cookies]', e); return false; } },
    add: value => { try { return apply((bigState.virtual?.clone() || Big.d(String(Game.cookies || 0))).add(parse(value))); } catch (e) { console.error('[Forge Big Cookies]', e); return false; } },
    get: () => bigState.virtual?.clone() || Big.d(String(Game.cookies || 0)),
    exact: () => (bigState.virtual || Big.d(String(Game.cookies || 0))).toString(),
    scientific: (sig = 18) => (bigState.virtual || Big.d(String(Game.cookies || 0))).sci(sig),
    scientificToBigInt,
    native: () => Game.cookies,
    test: () => Big.test(),
    shopping: () => setShoppingTitle(),
    restoreTitle: () => restoreTitle(),
    hideNativeCounter: () => suppressCookieOverlay(),
    limit: 'Forge storage is arbitrary-magnitude; Number is used only at the vanilla game boundary.'
};

const observer = new MutationObserver(() => {
    patchCookiesMenu();
    patchShopping();
    suppressCookieOverlay();
});
observer.observe(document.body, { childList: true, subtree: true });
CF.cleanup?.push(() => observer.disconnect());

const loop = () => {
    if (!CF.running) return;
    patchCookiesMenu();
    patchShopping();
    suppressCookieOverlay();
    if (bigState.virtual) showForgeCookieCounter(bigState.virtual.sci(18));
    requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

CF.features = CF.features || {};
CF.features.bigCookies = true;
CF.features.exactScientificInput = true;
bigState.version = '2.4.0';
setShoppingTitle();
grantThirdParty();

console.info('[Forge Big Cookies] READY 2.4 — exact scientific input, counter hidden, shopping mode active, Third-party achievement requested.');
if (bigState.virtual) console.info('[Forge Big Cookies] Restored:', bigState.virtual.sci(18));
})();