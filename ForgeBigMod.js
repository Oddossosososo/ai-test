(() => {
'use strict';

/* ============================================================
   FORGE-GUI — BIG MODE MOD 2.0
   Reliable add-on for Forge.js

   API:
     ForgeBigMode(true/false)
     ForgeBigMode.toggle()
     ForgeBigMode.enabled()

   Hotkeys:
     F8 = toggle Big Mode
   ============================================================ */

const KEY = 'CookieForgeBigMode';
const ROOT_ID = 'CF_BIG_MOD_STYLE';

function start() {
    const CF = window.CookieForge;
    const win = document.querySelector('#CF4_WINDOW');
    const header = document.querySelector('#CF4_HEADER');

    if (!CF || !win || !header) return false;
    if (window.ForgeBigMode?.__ready) return true;

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
#CF4_WINDOW.cf-big-mode #CF4_WORKSPACE { padding:20px !important; }
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

    const controls = header.querySelector('.FGUI_CONTROLS') || header.querySelector('#CF4_MIN_CONTROLS');
    (controls || header).appendChild(button);

    let enabled = false;

    const apply = value => {
        enabled = Boolean(value);
        win.classList.toggle('cf-big-mode', enabled);
        button.textContent = enabled ? '❐' : '□';
        button.title = enabled ? 'Restore Forge size' : 'Big Mode (F8)';
        try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch {}
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
        if (typeof value === 'boolean') apply(value);
        else toggle();
        return enabled;
    };
    api.toggle = toggle;
    api.enabled = () => enabled;
    api.__ready = true;
    window.ForgeBigMode = api;

    if (window.ForgeBig && CF.big !== window.ForgeBig) {
        CF.big = window.ForgeBig;
    }

    try {
        if (localStorage.getItem(KEY) === '1') apply(true);
    } catch {}

    const oldDestroy = CF.destroy;
    if (typeof oldDestroy === 'function' && !oldDestroy.__bigModeWrapped) {
        const destroy = () => {
            document.removeEventListener('keydown', keydown);
            button.remove();
            style.remove();
            delete window.ForgeBigMode;
            try { oldDestroy(); } catch {}
        };
        destroy.__bigModeWrapped = true;
        CF.destroy = destroy;
    }

    console.log('[Forge-GUI] Big Mode ready — F8 or □ toggles it.');
    return true;
}

if (!start()) {
    let tries = 0;
    const timer = setInterval(() => {
        if (start() || ++tries >= 200) clearInterval(timer);
    }, 50);
}
})();