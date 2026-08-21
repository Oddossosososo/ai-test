(() => {
'use strict';

/* ============================================================
   FORGE-GUI — UI ENHANCEMENT LAYER
   Adds title branding, minimize/restore, cookie-counter positioning
   and hotkeys. Safe to load after Forge.js.
   ============================================================ */

const START = () => {
    const root = document.querySelector('#CF4_ROOT');
    const win = document.querySelector('#CF4_WINDOW');
    const header = document.querySelector('#CF4_HEADER');

    if (!root || !win || !header) return false;
    if (document.querySelector('#FGUI_MINIMIZE')) return true;

    /* ---------- CSS ---------- */
    const style = document.createElement('style');
    style.id = 'FORGE_GUI_STYLE';
    style.textContent = `
#CF4_WINDOW.fgui-minimized {
    width:260px !important;
    height:auto !important;
    min-height:0 !important;
    border-radius:16px !important;
    transform:translate(-50%,-50%) scale(.98) !important;
}
#CF4_WINDOW.fgui-minimized #CF4_BODY {
    display:none !important;
}
#CF4_WINDOW.fgui-minimized #CF4_HEADER {
    border-bottom:0 !important;
}
#CF4_HEADER {
    user-select:none;
}
.FGUI_CONTROLS {
    display:flex;
    align-items:center;
    gap:7px;
    margin-left:auto;
}
.FGUI_BTN {
    width:34px;
    height:30px;
    display:grid;
    place-items:center;
    padding:0;
    border:1px solid rgba(0,234,255,.28);
    border-radius:8px;
    background:rgba(0,234,255,.045);
    color:var(--cf-accent,#00eaff);
    font:900 14px/1 monospace;
    cursor:pointer;
    transition:transform .14s,background .14s,border-color .14s,box-shadow .14s;
}
.FGUI_BTN:hover {
    transform:translateY(-1px);
    background:rgba(0,234,255,.12);
    border-color:var(--cf-accent,#00eaff);
    box-shadow:0 0 14px var(--cf-glow,rgba(0,234,255,.42));
}
.FGUI_BTN:active { transform:scale(.94); }
.FGUI_MINI_ICON {
    width:12px;
    height:2px;
    display:block;
    border-radius:2px;
    background:currentColor;
}

/* ---------- FORGE COOKIE COUNTER ---------- */
#CF4_SPOOF {
    position:fixed !important;
    top:18px !important;
    left:50% !important;
    right:auto !important;
    bottom:auto !important;
    transform:translateX(-50%) !important;
    z-index:2147483645 !important;
    pointer-events:none !important;
    margin:0 !important;
}

#FORGE_GUI_RESTORE {
    position:fixed;
    right:18px;
    bottom:18px;
    z-index:2147483646;
    display:none;
    align-items:center;
    gap:9px;
    padding:11px 14px;
    border:1px solid var(--cf-accent,#00eaff);
    border-radius:12px;
    background:rgba(3,9,19,.9);
    color:var(--cf-text,#e8fcff);
    box-shadow:0 0 24px var(--cf-glow,rgba(0,234,255,.42));
    backdrop-filter:blur(12px);
    font:900 10px monospace;
    letter-spacing:1.5px;
    cursor:pointer;
}
#FORGE_GUI_RESTORE.show { display:flex; animation:FGUI_IN .18s ease-out; }
@keyframes FGUI_IN {
    from { opacity:0; transform:translateY(8px) scale(.96); }
    to { opacity:1; transform:none; }
}
#FORGE_GUI_RESTORE b { color:var(--cf-accent,#00eaff); }
@media (max-width:600px) {
    #CF4_WINDOW { width:96vw !important; height:90vh !important; }
    #CF4_NAV { width:155px !important; }
    .CF4_TITLE { font-size:15px !important; letter-spacing:2px !important; }
    #CF4_SPOOF { top:10px !important; font-size:12px !important; max-width:94vw; text-align:center; }
}
`;
    root.appendChild(style);

    /* ---------- TITLE ---------- */
    const title = header.querySelector('.CF4_TITLE');
    if (title) title.textContent = 'FORGE-GUI';

    const sub = header.querySelector('.CF4_SUB');
    if (sub) sub.textContent = 'HOLOGRAPHIC CONTROL SYSTEM';

    /* Remove any older archived-version badge from previous ForgeGUI builds. */
    document.querySelectorAll('#FGUI_LATEST_ARCHIVED').forEach(el => el.remove());

    /* ---------- CONTROLS ---------- */
    const controls = document.createElement('div');
    controls.className = 'FGUI_CONTROLS';

    const minimize = document.createElement('button');
    minimize.id = 'FGUI_MINIMIZE';
    minimize.className = 'FGUI_BTN';
    minimize.type = 'button';
    minimize.title = 'Minimize Forge-GUI (M)';
    minimize.setAttribute('aria-label', 'Minimize Forge-GUI');
    minimize.innerHTML = '<span class="FGUI_MINI_ICON"></span>';

    controls.appendChild(minimize);
    header.appendChild(controls);

    /* ---------- RESTORE CHIP ---------- */
    const restore = document.createElement('button');
    restore.id = 'FORGE_GUI_RESTORE';
    restore.type = 'button';
    restore.innerHTML = '<b>◆</b> FORGE-GUI <span>RESTORE</span>';
    root.appendChild(restore);

    const setMinimized = value => {
        win.classList.toggle('fgui-minimized', value);
        restore.classList.toggle('show', value);
        minimize.title = value ? 'Restore Forge-GUI' : 'Minimize Forge-GUI (M)';
        minimize.setAttribute('aria-label', value ? 'Restore Forge-GUI' : 'Minimize Forge-GUI');
        try { localStorage.setItem('ForgeGUI_Minimized', value ? '1' : '0'); } catch {}
    };

    const toggle = () => setMinimized(!win.classList.contains('fgui-minimized'));
    minimize.addEventListener('click', toggle);
    restore.addEventListener('click', () => setMinimized(false));

    const keydown = e => {
        if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const tag = document.activeElement?.tagName;
            if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') toggle();
        }
    };
    document.addEventListener('keydown', keydown);

    /* ---------- CLEANUP ---------- */
    const oldDestroy = window.CookieForge?.destroy;
    if (typeof oldDestroy === 'function' && !oldDestroy.__forgeGuiWrapped) {
        const wrapped = () => {
            document.querySelector('#FORGE_GUI_STYLE')?.remove();
            document.querySelector('#FORGE_GUI_RESTORE')?.remove();
            document.querySelector('#FGUI_LATEST_ARCHIVED')?.remove();
            document.removeEventListener('keydown', keydown);
            oldDestroy();
        };
        wrapped.__forgeGuiWrapped = true;
        window.CookieForge.destroy = wrapped;
    }

    /* ---------- SAVED STATE ---------- */
    try {
        if (localStorage.getItem('ForgeGUI_Minimized') === '1') setMinimized(true);
    } catch {}

    console.log('[Forge-GUI] UI enhancement loaded. Cookie counter repositioned. Press M to minimize/restore.');
    return true;
};

if (!START()) {
    let tries = 0;
    const timer = setInterval(() => {
        if (START() || ++tries > 100) clearInterval(timer);
    }, 50);
}
})();
