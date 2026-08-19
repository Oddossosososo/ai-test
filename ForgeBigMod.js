(() => {
'use strict';

/* ============================================================
   COOKIE FORGE — BIG MOD
   Expands Cookie Forge to a large/full-workspace layout.

   API:
     window.ForgeBig()       -> enable big mode
     window.ForgeBig(false)  -> normal mode
     window.ForgeBig.toggle()-> toggle
     window.forgebig()       -> toggle
   ============================================================ */

const MOD = 'CookieForgeBigMod';

const boot = () => {
    const win = document.querySelector('#CF4_WINDOW');
    const header = document.querySelector('#CF4_HEADER');

    if (!win || !header) return false;
    if (win.dataset.cfBigReady === '1') return true;

    win.dataset.cfBigReady = '1';

    const normal = {
        width: win.style.width,
        height: win.style.height,
        borderRadius: win.style.borderRadius
    };

    const big = {
        width: '98vw',
        height: '96vh',
        borderRadius: '12px'
    };

    const button = document.createElement('button');
    button.id = 'CF4_BIG_BTN';
    button.type = 'button';
    button.title = 'Toggle Forge Big Mode';
    button.textContent = '□';

    Object.assign(button.style, {
        marginLeft: '6px',
        width: '34px',
        height: '30px',
        border: '1px solid rgba(0,234,255,.5)',
        borderRadius: '7px',
        background: 'rgba(0,234,255,.07)',
        color: '#00eaff',
        font: '900 17px monospace',
        lineHeight: '24px',
        cursor: 'pointer',
        boxShadow: '0 0 12px rgba(0,234,255,.2)'
    });

    const controls = header.querySelector('#CF4_MIN_CONTROLS');
    if (controls) controls.appendChild(button);
    else header.appendChild(button);

    let enabled = false;

    const apply = value => {
        enabled = !!value;

        win.style.transition = 'width .22s ease, height .22s ease, border-radius .22s ease';
        win.style.width = enabled ? big.width : normal.width;
        win.style.height = enabled ? big.height : normal.height;
        win.style.borderRadius = enabled ? big.borderRadius : normal.borderRadius;

        button.textContent = enabled ? '❐' : '□';
        button.title = enabled ? 'Restore Forge Size' : 'Toggle Forge Big Mode';

        try {
            localStorage.setItem('CookieForgeBig', enabled ? '1' : '0');
        } catch {}

        window.CookieForge && (window.CookieForge.big = enabled);
    };

    const toggle = () => apply(!enabled);

    button.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
    });

    header.addEventListener('dblclick', toggle);

    const keyHandler = e => {
        if (e.key === 'F8') {
            e.preventDefault();
            toggle();
        }
    };
    document.addEventListener('keydown', keyHandler);

    window.ForgeBig = value => {
        if (typeof value === 'boolean') apply(value);
        else toggle();
        return enabled;
    };

    window.ForgeBig.toggle = toggle;
    window.ForgeBig.enabled = () => enabled;
    window.forgebig = () => toggle();

    try {
        if (localStorage.getItem('CookieForgeBig') === '1') apply(true);
    } catch {}

    const oldDestroy = window.CookieForge?.destroy;
    if (window.CookieForge && !window.CookieForge.__bigMod) {
        window.CookieForge.__bigMod = true;
        window.CookieForge.destroy = () => {
            document.removeEventListener('keydown', keyHandler);
            button.remove();
            delete window.ForgeBig;
            delete window.forgebig;
            try { oldDestroy?.(); } catch {}
        };
    }

    console.log('[Cookie Forge] Big mod loaded. Press F8 or click □.');
    return true;
};

if (!boot()) {
    const observer = new MutationObserver(() => {
        if (boot()) observer.disconnect();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    setTimeout(() => observer.disconnect(), 15000);
}
})();
