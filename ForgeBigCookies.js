(() => {
'use strict';

/* COOKIE FORGE — BIG COOKIE BRIDGE 2.1 */
const CF = window.CookieForge;
const Big = window.ForgeBig;
const Game = window.Game;

if (!CF || !Big || !Game) {
    console.error('[Forge Big Cookies] Forge.js, ForgeBig.js, or Game is missing.');
    return;
}

const KEY = 'CookieForgeBigCookies';
const state = CF.bigCookies = CF.bigCookies || {
    version: '2.1.0', active: true, virtual: null
};

function parse(value) {
    if (value instanceof Big.Decimal) return value.clone();
    const text = String(value ?? '').trim().replace(/,/g, '');
    if (!text) throw new TypeError('Empty cookie amount');
    return Big.d(text);
}

function save(value) {
    try { localStorage.setItem(KEY, value.sci(24)); } catch {}
}

function readSaved() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) state.virtual = Big.d(raw);
    } catch {}
}

/* ONLY this function crosses into Cookie Clicker's Number-based engine. */
function nativeValue(big) {
    const n = Big.native ? Big.native(big) : big.nativeValue();
    if (!Number.isFinite(n)) return Number.MAX_VALUE;
    return n < 0 ? 0 : n;
}

function apply(big, announce = true) {
    state.virtual = big.clone();
    save(state.virtual);

    try {
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

function display() {
    if (!state.virtual) return;
    const text = state.virtual.sci(18);
    const spoof = document.getElementById('CF4_SPOOF');
    if (spoof) spoof.textContent = text;

    const native = document.getElementById('cookies');
    if (native) {
        native.textContent = text;
        native.style.visibility = 'visible';
    }

    const input = document.querySelector('.CF4_INPUT');
    if (input && document.activeElement !== input) input.value = text;
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

    const parent = setButton.parentElement;
    if (parent && !parent.querySelector('[data-forge-big-help]')) {
        const hint = document.createElement('div');
        hint.dataset.forgeBigHelp = '1';
        hint.textContent = 'BIG MODE: 1e309 • 1e1000 • 1e1000000 • beyond.';
        Object.assign(hint.style, {
            gridColumn: '1 / -1', color: '#72ffcb', font: '8px monospace',
            opacity: '.8', padding: '5px 2px'
        });
        parent.appendChild(hint);
    }
}

readSaved();

CF.game = CF.game || {};

CF.game.setCookies = amount => {
    try { return apply(parse(amount)); }
    catch (e) { console.error('[Forge Big Cookies]', e); return false; }
};

/* Big-number-safe addition: never converts the amount through Number. */
CF.game.addCookies = amount => {
    try {
        const value = parse(amount);
        const current = state.virtual?.clone() || Big.d(String(Game.cookies || 0));
        return apply(current.add(value));
    } catch (e) {
        console.error('[Forge Big Cookies]', e);
        return false;
    }
};

CF.game.setBigCookies = CF.game.setCookies;
CF.game.addBigCookies = CF.game.addCookies;
CF.game.getBigCookies = () => state.virtual?.clone() || Big.d(String(Game.cookies || 0));
CF.game.getBigCookiesExact = () => (state.virtual || Big.d(String(Game.cookies || 0))).toString();

window.ForgeBigCookies = {
    version: '2.1.0',
    set: value => { try { return apply(parse(value)); } catch (e) { console.error('[Forge Big Cookies]', e); return false; } },
    add: value => { try { return apply((state.virtual?.clone() || Big.d(String(Game.cookies || 0))).add(parse(value))); } catch (e) { console.error('[Forge Big Cookies]', e); return false; } },
    get: () => state.virtual?.clone() || Big.d(String(Game.cookies || 0)),
    exact: () => (state.virtual || Big.d(String(Game.cookies || 0))).toString(),
    scientific: (sig = 18) => (state.virtual || Big.d(String(Game.cookies || 0))).sci(sig),
    native: () => Game.cookies,
    test: () => Big.test(),
    limit: 'Forge storage is arbitrary-magnitude; Number is used only at the vanilla game boundary.'
};

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
CF.bigCookies.version = '2.1.0';
console.info('[Forge Big Cookies] READY — arbitrary-magnitude Forge storage enabled.');
if (state.virtual) console.info('[Forge Big Cookies] Restored:', state.virtual.sci(18));
})();
