(() => {
'use strict';

/* ============================================================
   COOKIE FORGE — MINIMIZE MOD
   Adds a header minimize button + floating restore button.
   Works with Cookie Forge 4.x without modifying core modules.
   ============================================================ */

const boot = () => {
    const win = document.querySelector('#CF4_WINDOW');
    const header = document.querySelector('#CF4_HEADER');
    if (!win || !header) return false;

    if (document.querySelector('#CF4_MINIMIZE_BTN')) return true;

    const restore = document.createElement('button');
    restore.id = 'CF4_MINI';
    restore.type = 'button';
    restore.textContent = 'COOKIE FORGE';
    Object.assign(restore.style, {
        position: 'fixed',
        right: '18px',
        bottom: '18px',
        zIndex: '2147483647',
        display: 'none',
        padding: '10px 14px',
        border: '1px solid #00eaff',
        borderRadius: '10px',
        background: 'rgba(3,9,19,.94)',
        color: '#00eaff',
        font: '900 10px monospace',
        letterSpacing: '2px',
        cursor: 'pointer',
        boxShadow: '0 0 20px rgba(0,234,255,.42)',
        backdropFilter: 'blur(12px)'
    });

    const minimize = document.createElement('button');
    minimize.id = 'CF4_MINIMIZE_BTN';
    minimize.type = 'button';
    minimize.title = 'Minimize Cookie Forge';
    minimize.textContent = '−';
    Object.assign(minimize.style, {
        marginLeft: '10px',
        width: '34px',
        height: '30px',
        border: '1px solid rgba(0,234,255,.5)',
        borderRadius: '7px',
        background: 'rgba(0,234,255,.07)',
        color: '#00eaff',
        font: '900 20px monospace',
        lineHeight: '24px',
        cursor: 'pointer',
        boxShadow: '0 0 12px rgba(0,234,255,.2)'
    });

    const controls = document.createElement('div');
    controls.id = 'CF4_MIN_CONTROLS';
    Object.assign(controls.style, {
        display: 'flex',
        alignItems: 'center',
        marginLeft: '12px'
    });
    controls.appendChild(minimize);

    header.appendChild(controls);
    document.body.appendChild(restore);

    let minimized = false;

    const setMinimized = value => {
        minimized = !!value;
        win.style.transition = 'opacity .2s, transform .2s';

        if (minimized) {
            win.style.opacity = '0';
            win.style.transform = 'translate(-50%,-50%) scale(.96)';
            win.style.pointerEvents = 'none';
            restore.style.display = 'block';
            minimize.textContent = '+';
            minimize.title = 'Restore Cookie Forge';
        } else {
            win.style.opacity = '1';
            win.style.transform = 'translate(-50%,-50%) scale(1)';
            win.style.pointerEvents = 'auto';
            restore.style.display = 'none';
            minimize.textContent = '−';
            minimize.title = 'Minimize Cookie Forge';
        }

        try {
            localStorage.setItem('CookieForgeMinimized', minimized ? '1' : '0');
        } catch {}
    };

    minimize.addEventListener('click', e => {
        e.stopPropagation();
        setMinimized(!minimized);
    });

    restore.addEventListener('click', () => setMinimized(false));

    const keyHandler = e => {
        if (e.key === 'Escape' && minimized) setMinimized(false);
    };
    document.addEventListener('keydown', keyHandler);

    try {
        if (localStorage.getItem('CookieForgeMinimized') === '1') {
            setMinimized(true);
        }
    } catch {}

    const oldDestroy = window.CookieForge?.destroy;
    if (window.CookieForge && !window.CookieForge.__minimizeMod) {
        window.CookieForge.__minimizeMod = true;
        window.CookieForge.destroy = () => {
            document.removeEventListener('keydown', keyHandler);
            restore.remove();
            controls.remove();
            try { oldDestroy?.(); } catch {}
        };
    }

    console.log('[Cookie Forge] Minimize mod loaded.');
    return true;
};

if (!boot()) {
    const observer = new MutationObserver(() => {
        if (boot()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => observer.disconnect(), 15000);
}
})();
