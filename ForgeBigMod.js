(() => {
'use strict';

/* ============================================================
   FORGE-GUI — BIG MODE MOD 2.1
   Safe arbitrary-magnitude cookie balance bridge.

   Vanilla Cookie Clicker uses Number for Game.cookies. Values
   beyond ~1e308 become Infinity, so Forge keeps the exact balance
   separately using ForgeBig and only sends a finite boundary value
   to the vanilla game.

   API:
     ForgeBigMode.setCookies('1e309')
     ForgeBigMode.addCookies('5e1000')
     ForgeBigMode.subCookies('1e10')
     ForgeBigMode.getCookies()
     ForgeBigMode.getCookiesText()
     ForgeBigMode.getCookiesExact()
     ForgeBigMode.syncNative()
     ForgeBigMode.test()
     ForgeBigMode.unlockThirdParty()

   F8 = toggle Big Mode
   ============================================================ */

const KEY = 'CookieForgeBigMode';
const BALANCE_KEY = 'CookieForgeBigBalance';
const ROOT_ID = 'CF_BIG_MOD_STYLE';

function getBig() {
    if (!window.ForgeBig) {
        throw new Error('ForgeBig.js is not loaded.');
    }
    return window.ForgeBig;
}

function getCF() {
    if (!window.CookieForge) {
        throw new Error('CookieForge is not loaded.');
    }
    return window.CookieForge;
}

function readBalance() {
    const CF = getCF();
    const Big = getBig();

    if (CF.bigCookies) {
        return Big.d(CF.bigCookies);
    }

    try {
        const raw = localStorage.getItem(BALANCE_KEY);
        if (raw) {
            const x = Big.d(raw);
            CF.bigCookies = x.sci(24);
            return x;
        }
    } catch {}

    const native = window.Game?.cookies;
    const initial = Big.d(
        Number.isFinite(native) ? String(native) : '0'
    );

    CF.bigCookies = initial.sci(24);
    return initial;
}

function writeBalance(value) {
    const Big = getBig();
    const CF = getCF();
    const x = Big.d(value);
    const stored = x.sci(24);

    CF.bigCookies = stored;
    CF.features = CF.features || {};
    CF.features.arbitraryCookies = true;
    CF.features.numberSafeStorage = true;

    try {
        localStorage.setItem(BALANCE_KEY, stored);
    } catch {}

    return x;
}

function safeNativeSync() {
    const Game = window.Game;
    if (!Game) return false;

    const x = readBalance();
    const native = x.nativeValue();

    // Never write Infinity or NaN into Cookie Clicker's Number fields.
    Game.cookies = Number.isFinite(native)
        ? native
        : Number.MAX_VALUE;

    if (!Number.isFinite(Game.cookies)) {
        Game.cookies = Number.MAX_VALUE;
    }

    try {
        if (!Number.isFinite(Game.cookiesEarned)) {
            Game.cookiesEarned = 0;
        }
        Game.cookiesEarned = Math.max(
            Game.cookiesEarned,
            Game.cookies
        );
    } catch {}

    try {
        Game.recalculateGains?.();
    } catch {}

    return true;
}

function awardThirdParty() {
    try {
        if (window.Game?.Win) {
            window.Game.Win('Third-party');
            console.log(
                '[Forge-GUI] Third-party achievement unlocked.'
            );
            return true;
        }
    } catch (error) {
        console.warn(
            '[Forge-GUI] Third-party achievement failed:',
            error
        );
    }
    return false;
}

function start() {
    const CF = window.CookieForge;
    const win = document.querySelector('#CF4_WINDOW');
    const header = document.querySelector('#CF4_HEADER');

    if (!CF || !win || !header || !window.ForgeBig) {
        return false;
    }

    if (window.ForgeBigMode?.__ready) {
        return true;
    }

    document.querySelector('#CF4_BIG_BTN')?.remove();
    document.querySelector('#CF_BIG_MOD_STYLE')?.remove();

    const style = document.createElement('style');
    style.id = ROOT_ID;
    style.textContent = `
#CF4_WINDOW.cf-big-mode {
  width:98vw !important;
  height:96vh !important;
  max-width:none !important;
  max-height:none !important;
  border-radius:12px !important;
}
#CF4_WINDOW.cf-big-mode #CF4_WORKSPACE {
  padding:20px !important;
}
#CF4_BIG_BTN {
  width:34px;height:30px;margin-left:7px;
  display:grid;place-items:center;
  padding:0;border:1px solid rgba(0,234,255,.35);
  border-radius:8px;background:rgba(0,234,255,.05);
  color:var(--cf-accent,#00eaff);
  font:900 16px/1 monospace;cursor:pointer;
  transition:.14s;
}
#CF4_BIG_BTN:hover {
  transform:translateY(-1px);
  background:rgba(0,234,255,.13);
  box-shadow:0 0 15px var(--cf-glow,rgba(0,234,255,.4));
}
`;
    document.head.appendChild(style);

    const button = document.createElement('button');
    button.id = 'CF4_BIG_BTN';
    button.type = 'button';
    button.title = 'Big Mode (F8)';
    button.textContent = '□';

    const controls =
        header.querySelector('.FGUI_CONTROLS') ||
        header.querySelector('#CF4_MIN_CONTROLS');

    (controls || header).appendChild(button);

    let enabled = false;

    const apply = value => {
        enabled = Boolean(value);
        win.classList.toggle('cf-big-mode', enabled);
        button.textContent = enabled ? '❐' : '□';
        button.title = enabled
            ? 'Restore Forge size'
            : 'Big Mode (F8)';

        try {
            localStorage.setItem(
                KEY,
                enabled ? '1' : '0'
            );
        } catch {}

        CF.bigMode = enabled;
        CF.features = CF.features || {};
        CF.features.bigMode = enabled;
    };

    const toggle = () => apply(!enabled);

    button.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
    });

    const keydown = e => {
        if (e.key === 'F8') {
            e.preventDefault();
            toggle();
        }
    };

    document.addEventListener('keydown', keydown);

    const api = function(value) {
        if (typeof value === 'boolean') {
            apply(value);
        } else {
            toggle();
        }
        return enabled;
    };

    api.toggle = toggle;
    api.enabled = () => enabled;
    api.__ready = true;
    api.version = '2.1.0';

    // ========================================================
    // ARBITRARY COOKIE API
    // ========================================================

    api.setCookies = value => {
        const x = writeBalance(value);
        safeNativeSync();
        console.log(
            '[Forge-GUI] Big cookies set:',
            x.sci(18)
        );
        return x;
    };

    api.addCookies = value => {
        const x = readBalance().add(value);
        writeBalance(x);
        safeNativeSync();
        return x;
    };

    api.subCookies = value => {
        const x = readBalance().sub(value);
        writeBalance(x);
        safeNativeSync();
        return x;
    };

    api.getCookies = () => readBalance();

    api.getCookiesText = (sig = 18) =>
        readBalance().sci(sig);

    api.getCookiesExact = () =>
        readBalance().toString();

    api.syncNative = () => safeNativeSync();

    api.unlockThirdParty = () =>
        awardThirdParty();

    api.test = () => {
        const Big = getBig();
        const huge = Big.d('1e309');
        const absurd = Big.d('1e1000000');
        const doubled = absurd.mul('2');

        return {
            ok:
                huge.sci() === '1e+309' &&
                doubled.sci() === '2e+1000000',
            huge: huge.sci(),
            absurd: absurd.sci(),
            doubled: doubled.sci(),
            nativeIsFinite:
                Number.isFinite(huge.nativeValue()),
            nativeBoundary:
                huge.nativeValue() === Number.MAX_VALUE
        };
    };

    window.ForgeBigMode = api;

    CF.big = window.ForgeBig;
    CF.bigMode = enabled;
    CF.features = CF.features || {};
    CF.features.forgeBig = true;
    CF.features.arbitraryCookies = true;

    try {
        if (localStorage.getItem(KEY) === '1') {
            apply(true);
        }
    } catch {}

    try {
        readBalance();
    } catch (error) {
        console.warn(
            '[Forge-GUI] Big balance restore failed:',
            error
        );
    }

    // Award the Cookie Clicker third-party/mod achievement on load.
    awardThirdParty();

    const oldDestroy = CF.destroy;

    if (
        typeof oldDestroy === 'function' &&
        !oldDestroy.__bigModeWrapped
    ) {
        const destroy = () => {
            document.removeEventListener(
                'keydown',
                keydown
            );
            button.remove();
            style.remove();
            delete window.ForgeBigMode;

            try {
                oldDestroy();
            } catch {}
        };

        destroy.__bigModeWrapped = true;
        CF.destroy = destroy;
    }

    console.log(
        '[Forge-GUI] Big Mode 2.1 ready — arbitrary cookie balance enabled.'
    );

    return true;
}

if (!start()) {
    let tries = 0;

    const timer = setInterval(() => {
        if (start() || ++tries >= 200) {
            clearInterval(timer);
        }
    }, 50);
}

})();
