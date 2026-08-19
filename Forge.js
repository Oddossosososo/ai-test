(() => {
'use strict';

/* ============================================================
   COOKIE FORGE 4.0.0
   24-MODULE HOLOGRAPHIC CONTROL SYSTEM
   ============================================================ */

const previous = window.CookieForge;

try {
    previous?.destroy?.();
} catch {}

[
    '#CF4_ROOT',
    '#CF4_STYLE',
    '#CF4_MINI',
    '#CF4_SPOOF',
    '#CF4_STRIP'
].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.remove());
});

const CF = window.CookieForge = {
    version: '4.0.0',
    running: true,
    cleanup: [],
    state: {},
    game: {},
    features: {},
    team: {},
    audio: {},
    fx: {},
    ui: {}
};

let destroyed = false;
let raf = 0;

const addCleanup = fn => {
    if (typeof fn === 'function') CF.cleanup.push(fn);
    return fn;
};

const cleanAll = () => {
    while (CF.cleanup.length) {
        try {
            CF.cleanup.pop()();
        } catch {}
    }
};

CF.destroy = () => {
    if (destroyed) return;

    destroyed = true;
    CF.running = false;

    try {
        cancelAnimationFrame(raf);
    } catch {}

    cleanAll();

    [
        '#CF4_ROOT',
        '#CF4_STYLE',
        '#CF4_MINI',
        '#CF4_SPOOF',
        '#CF4_STRIP'
    ].forEach(sel => {
        document.querySelectorAll(sel).forEach(
            el => el.remove()
        );
    });

    if (window.CookieForge === CF)
        delete window.CookieForge;
};

/* ============================================================
   GAME
   ============================================================ */

const Game = window.Game;

if (!Game) {
    console.error(
        '[Cookie Forge] Cookie Clicker Game object not found.'
    );
    CF.destroy();
    return;
}

/* ============================================================
   STATE
   ============================================================ */

const DEFAULT_STATE = {
    version: 4,
    theme: 'holo',
    particles: true,
    performance: false,
    audio: true,
    volume: 0.15,
    intensity: 1,
    activeMenu: 'dashboard',
    teamTopic: 'team',
    newsTitle: 'COOKIE FORGE NEWS',
    newsMessage: 'SYSTEM ONLINE • FORGE READY'
};

let state;

try {
    const raw =
        localStorage.getItem('CookieForgeState');

    const parsed =
        raw ? JSON.parse(raw) : {};

    if (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
    ) {
        throw new Error('Corrupt Forge state');
    }

    state = {
        ...DEFAULT_STATE,
        ...parsed
    };
} catch {
    state = {
        ...DEFAULT_STATE
    };

    try {
        localStorage.removeItem(
            'CookieForgeState'
        );
    } catch {}
}

if (
    typeof state.theme !== 'string'
) {
    state.theme = 'holo';
}

if (
    !Number.isFinite(state.volume)
) {
    state.volume = 0.15;
}

if (
    !Number.isFinite(state.intensity)
) {
    state.intensity = 1;
}

if (
    typeof state.particles !== 'boolean'
) {
    state.particles = true;
}

if (
    typeof state.performance !== 'boolean'
) {
    state.performance = false;
}

if (
    typeof state.audio !== 'boolean'
) {
    state.audio = true;
}

const save = () => {
    try {
        localStorage.setItem(
            'CookieForgeState',
            JSON.stringify(state)
        );
    } catch {}
};

CF.state = state;

/* ============================================================
   THEMES
   ============================================================ */

const THEMES = {
    holo: {
        accent: '#00eaff',
        accent2: '#ff00c8',
        glow: 'rgba(0,234,255,.42)'
    },

    blue: {
        accent: '#4d7cff',
        accent2: '#00eaff',
        glow: 'rgba(77,124,255,.42)'
    },

    pink: {
        accent: '#ff4fd8',
        accent2: '#00eaff',
        glow: 'rgba(255,79,216,.42)'
    },

    violet: {
        accent: '#a855ff',
        accent2: '#ff2bd6',
        glow: 'rgba(168,85,255,.42)'
    }
};

/* ============================================================
   ROOT
   ============================================================ */

const root =
    document.createElement('div');

root.id = 'CF4_ROOT';

Object.assign(root.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483000',
    pointerEvents: 'none',

    '--cf-accent': '#00eaff',
    '--cf-accent2': '#ff00c8',
    '--cf-glow': 'rgba(0,234,255,.42)',
    '--cf-text': '#e8fcff',
    '--cf-panel': 'rgba(3,9,19,.84)'
});

document.body.appendChild(root);

addCleanup(() => root.remove());

/* ============================================================
   STYLE
   ============================================================ */

const style =
    document.createElement('style');

style.id = 'CF4_STYLE';

style.textContent = `

#CF4_ROOT,
#CF4_ROOT * {
    box-sizing:border-box;
}

#CF4_ROOT {
    font-family:
        Inter,
        "Segoe UI",
        Arial,
        sans-serif;
}

#CF4_BG {
    position:fixed;
    inset:0;
    overflow:hidden;
    pointer-events:none;

    background:
        radial-gradient(
            circle at 50% 10%,
            color-mix(
                in srgb,
                var(--cf-accent) 11%,
                transparent
            ),
            transparent 43%
        ),
        radial-gradient(
            circle at 85% 85%,
            color-mix(
                in srgb,
                var(--cf-accent2) 8%,
                transparent
            ),
            transparent 40%
        ),
        linear-gradient(
            rgba(0,0,0,.18),
            rgba(0,0,0,.73)
        );
}

#CF4_CANVAS {
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
}

#CF4_GRID {
    position:absolute;
    inset:-50%;

    opacity:.15;

    background-image:
        linear-gradient(
            color-mix(
                in srgb,
                var(--cf-accent) 17%,
                transparent
            ) 1px,
            transparent 1px
        ),
        linear-gradient(
            90deg,
            color-mix(
                in srgb,
                var(--cf-accent2) 12%,
                transparent
            ) 1px,
            transparent 1px
        );

    background-size:44px 44px;

    transform:
        perspective(560px)
        rotateX(64deg);

    transform-origin:
        center bottom;

    animation:
        CF4_GRID 8s linear infinite;
}

@keyframes CF4_GRID {
    from {
        background-position:
            0 0,
            0 0;
    }

    to {
        background-position:
            0 44px,
            44px 0;
    }
}

#CF4_SCAN {
    position:fixed;
    inset:0;
    pointer-events:none;
    opacity:.045;

    background:
        repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent 3px,
            #fff 4px
        );
}

#CF4_WINDOW {
    position:absolute;

    left:50%;
    top:50%;

    width:min(1160px,96vw);
    height:min(750px,92vh);

    transform:
        translate(-50%,-50%);

    pointer-events:auto;

    overflow:hidden;

    border:
        1px solid
        color-mix(
            in srgb,
            var(--cf-accent) 62%,
            transparent
        );

    border-radius:20px;

    background:
        linear-gradient(
            135deg,
            color-mix(
                in srgb,
                var(--cf-accent) 8%,
                transparent
            ),
            color-mix(
                in srgb,
                var(--cf-accent2) 5%,
                transparent
            )
        ),
        var(--cf-panel);

    box-shadow:
        0 30px 120px rgba(0,0,0,.82),
        0 0 42px var(--cf-glow),

        inset 0 0 50px
            color-mix(
                in srgb,
                var(--cf-accent) 4%,
                transparent
            );

    backdrop-filter:
        blur(17px);

    transition:
        opacity .22s,
        transform .22s;
}

#CF4_HEADER {
    height:82px;

    display:flex;
    align-items:center;
    justify-content:space-between;

    padding:0 20px;

    border-bottom:
        1px solid
        rgba(0,234,255,.18);

    background:
        linear-gradient(
            90deg,
            color-mix(
                in srgb,
                var(--cf-accent) 8%,
                transparent
            ),
            transparent,
            color-mix(
                in srgb,
                var(--cf-accent2) 7%,
                transparent
            )
        );

    cursor:grab;
}

#CF4_HEADER:active {
    cursor:grabbing;
}

.CF4_BRAND {
    display:flex;
    align-items:center;
    gap:12px;
}

.CF4_ORB {
    width:44px;
    height:44px;

    display:grid;
    place-items:center;

    border:
        1px solid
        var(--cf-accent);

    border-radius:50%;

    box-shadow:
        0 0 17px var(--cf-glow),
        inset 0 0 16px
        color-mix(
            in srgb,
            var(--cf-accent) 21%,
            transparent
        );

    animation:
        CF4_ORB 2.8s ease-in-out infinite;
}

@keyframes CF4_ORB {
    50% {
        box-shadow:
            0 0 28px var(--cf-glow),
            inset 0 0 22px
            color-mix(
                in srgb,
                var(--cf-accent2) 21%,
                transparent
            );
    }
}

.CF4_TITLE {
    color:#fff;

    font:
        950 19px monospace;

    letter-spacing:4px;

    text-shadow:
        0 0 10px var(--cf-accent),
        0 0 25px var(--cf-accent);
}

.CF4_SUB {
    margin-top:4px;

    color:#708691;

    font:
        8px monospace;

    letter-spacing:3px;
}

.CF4_STATUS {
    color:#72ffcb;

    font:
        9px monospace;
}

.CF4_STATUS i {
    display:inline-block;

    width:7px;
    height:7px;

    margin-right:6px;

    border-radius:50%;

    background:#72ffcb;

    box-shadow:
        0 0 12px #72ffcb;

    animation:
        CF4_STATUS 1.5s infinite;
}

@keyframes CF4_STATUS {
    50% {
        opacity:.3;
        transform:scale(.7);
    }
}

#CF4_BODY {
    display:flex;
    height:calc(100% - 82px);
}

#CF4_NAV {
    width:200px;

    padding:12px;

    overflow:auto;

    border-right:
        1px solid
        rgba(0,234,255,.18);

    background:
        rgba(0,0,0,.3);
}

.CF4_NAV_HEADER {
    padding:
        8px 5px 13px;

    color:
        var(--cf-accent);

    font:
        900 9px monospace;

    letter-spacing:2px;
}

.CF4_TAB {
    width:100%;

    min-height:39px;

    margin:3px 0;

    padding:0 10px;

    text-align:left;

    border:
        1px solid transparent;

    border-radius:8px;

    background:
        rgba(255,255,255,.018);

    color:#71838d;

    font:
        800 8px monospace;

    letter-spacing:.7px;

    cursor:pointer;

    transition:.13s;
}

.CF4_TAB:hover,
.CF4_TAB.active {
    color:
        var(--cf-accent);

    border-color:
        color-mix(
            in srgb,
            var(--cf-accent) 50%,
            transparent
        );

    background:
        color-mix(
            in srgb,
            var(--cf-accent) 8%,
            transparent
        );

    box-shadow:
        inset 3px 0
        var(--cf-accent);
}

#CF4_WORKSPACE {
    flex:1;
    min-width:0;

    padding:18px;

    overflow:auto;

    scrollbar-width:thin;

    scrollbar-color:
        var(--cf-accent)
        transparent;
}

#CF4_WORKSPACE::-webkit-scrollbar {
    width:5px;
}

#CF4_WORKSPACE::-webkit-scrollbar-thumb {
    background:
        var(--cf-accent);

    border-radius:8px;
}

.CF4_HEADING {
    color:#fff;

    font:
        900 16px monospace;

    letter-spacing:3px;

    text-shadow:
        0 0 12px
        var(--cf-accent);
}

.CF4_LINE {
    height:1px;

    margin:
        10px 0 15px;

    background:
        linear-gradient(
            90deg,
            var(--cf-accent),
            var(--cf-accent2),
            transparent
        );
}

.CF4_GRID {
    display:grid;

    grid-template-columns:
        repeat(
            auto-fit,
            minmax(165px,1fr)
        );

    gap:9px;
}

.CF4_CARD {
    padding:14px;

    border:
        1px solid
        rgba(255,255,255,.08);

    border-radius:11px;

    background:
        rgba(255,255,255,.025);

    transition:.14s;
}

.CF4_CARD:hover {
    transform:
        translateY(-1px);

    border-color:
        color-mix(
            in srgb,
            var(--cf-accent) 32%,
            transparent
        );
}

.CF4_LABEL {
    margin-bottom:7px;

    color:
        var(--cf-accent);

    font:
        800 8px monospace;

    letter-spacing:2px;
}

.CF4_VALUE {
    color:
        var(--cf-text);

    font:
        900 20px monospace;

    overflow-wrap:anywhere;
}

.CF4_MUTED {
    color:#637984;

    font:
        8px monospace;

    line-height:1.55;
}

.CF4_BUTTON {
    min-height:39px;

    padding:
        9px 12px;

    border:
        1px solid
        color-mix(
            in srgb,
            var(--cf-accent) 44%,
            transparent
        );

    border-radius:8px;

    background:
        color-mix(
            in srgb,
            var(--cf-accent) 6%,
            rgba(0,20,35,.72)
        );

    color:
        var(--cf-text);

    font:
        800 8px monospace;

    letter-spacing:.8px;

    cursor:pointer;

    transition:.13s;
}

.CF4_BUTTON:hover {
    border-color:
        var(--cf-accent);

    box-shadow:
        0 0 16px var(--cf-glow);

    transform:
        translateY(-1px);
}

.CF4_BUTTON:active {
    transform:
        translateY(1px)
        scale(.96);
}

.CF4_WIN {
    color:#fff;

    border-color:
        #ff00c8;

    background:
        linear-gradient(
            135deg,
            rgba(0,234,255,.13),
            rgba(255,0,200,.16)
        );
}

.CF4_INPUT,
.CF4_TEXTAREA,
.CF4_SELECT {
    width:100%;

    padding:9px;

    border:
        1px solid
        color-mix(
            in srgb,
            var(--cf-accent) 32%,
            transparent
        );

    border-radius:8px;

    background:
        rgba(0,0,0,.44);

    color:
        var(--cf-text);

    outline:none;

    font:
        9px monospace;
}

.CF4_INPUT:focus,
.CF4_TEXTAREA:focus,
.CF4_SELECT:focus {
    border-color:
        var(--cf-accent);

    box-shadow:
        0 0 12px var(--cf-glow);
}

#CF4_LOG {
    margin-top:12px;

    height:90px;

    padding:8px;

    overflow:auto;

    border:
        1px solid
        rgba(255,255,255,.05);

    border-radius:8px;

    background:
        rgba(0,0,0,.36);

    color:#617985;

    font:
        8px monospace;
}

.CF4_LOG_ROW {
    padding:3px 0;

    border-bottom:
        1px solid
        rgba(255,255,255,.025);
}

/* ============================================================
   TEAM FORGE
   ============================================================ */

#CF4_TEAM {
    position:fixed;

    left:50%;
    top:50%;

    width:min(940px,94vw);
    height:min(610px,89vh);

    transform:
        translate(-50%,-50%);

    display:none;

    z-index:2147483003;

    pointer-events:auto;

    overflow:hidden;

    border:
        1px solid
        var(--cf-accent);

    border-radius:18px;

    background:
        linear-gradient(
            135deg,
            rgba(2,12,23,.98),
            rgba(25,3,30,.98)
        );

    box-shadow:
        0 0 45px
        var(--cf-glow);
}

#CF4_TEAM_SIDE {
    position:absolute;

    inset:0 auto 0 0;

    width:170px;

    padding:13px;

    border-right:
        1px solid
        rgba(0,234,255,.19);

    background:
        rgba(0,0,0,.30);
}

.CF4_TEAM_BRAND {
    padding:
        8px 5px 15px;

    color:
        var(--cf-accent);

    font:
        900 11px monospace;

    letter-spacing:2px;
}

.CF4_TOPIC {
    display:block;

    width:100%;

    margin:5px 0;

    padding:10px;

    text-align:left;

    border:
        1px solid transparent;

    border-radius:8px;

    background:
        rgba(255,255,255,.025);

    color:#71818d;

    font:
        800 8px monospace;

    cursor:pointer;

    transition:.14s;
}

.CF4_TOPIC:hover,
.CF4_TOPIC.active {
    color:
        var(--cf-accent);

    border-color:
        color-mix(
            in srgb,
            var(--cf-accent) 50%,
            transparent
        );

    background:
        color-mix(
            in srgb,
            var(--cf-accent) 8%,
            transparent
        );

    box-shadow:
        inset 3px 0
        var(--cf-accent);
}

#CF4_TEAM_MAIN {
    position:absolute;

    inset:
        0 0 0 170px;

    padding:20px;

    overflow:auto;
}

.CF4_TEAM_TITLE {
    color:#fff;

    font:
        900 18px monospace;

    letter-spacing:3px;

    text-shadow:
        0 0 12px
        var(--cf-accent);
}

.CF4_PLAYER {
    display:flex;

    align-items:center;

    justify-content:space-between;

    gap:8px;

    padding:
        9px 10px;

    margin-bottom:6px;

    border:
        1px solid
        rgba(0,234,255,.13);

    border-radius:8px;

    background:
        rgba(0,0,0,.19);

    font:
        9px monospace;
}

.CF4_RAINBOW {
    font:
        950 44px monospace;

    letter-spacing:3px;

    background:
        linear-gradient(
            90deg,
            #ff003c,
            #ff8a00,
            #ffe600,
            #00ff85,
            #00eaff,
            #5967ff,
            #d52dff,
            #ff00c8,
            #ff003c
        );

    background-size:
        400% 100%;

    -webkit-background-clip:
        text;

    background-clip:
        text;

    color:transparent;

    animation:
        CF4_RAINBOW 3s linear infinite;
}

@keyframes CF4_RAINBOW {
    from {
        background-position:0% 50%;
    }

    to {
        background-position:400% 50%;
    }
}

.CF4_HEART {
    display:inline-block;

    margin-top:14px;

    font-size:36px;

    animation:
        CF4_HEART 1.1s
        ease-in-out infinite;
}

@keyframes CF4_HEART {
    0%,100% {
        transform:scale(1);
    }

    50% {
        transform:scale(1.18);
    }
}

/* ============================================================
   NEWS
   ============================================================ */

#CF4_NEWS {
    position:fixed;

    left:50%;
    bottom:25px;

    width:min(550px,90vw);

    z-index:2147483647;

    padding:15px;

    transform:
        translate(-50%,20px);

    opacity:0;

    pointer-events:none;

    border:
        1px solid
        var(--cf-accent);

    border-radius:11px;

    background:
        rgba(2,12,22,.95);

    box-shadow:
        0 0 30px
        var(--cf-glow);

    transition:
        opacity .2s,
        transform .2s;
}

#CF4_NEWS.show {
    opacity:1;

    transform:
        translate(-50%,0);
}

#CF4_NEWS_TITLE {
    color:
        var(--cf-accent);

    font:
        900 9px monospace;

    letter-spacing:2px;
}

#CF4_NEWS_MESSAGE {
    margin-top:7px;

    color:
        var(--cf-text);

    font:
        10px monospace;

    line-height:1.5;
}

#CF4_MINI {
    position:fixed;

    right:20px;
    bottom:20px;

    z-index:2147483647;

    display:none;

    padding:11px 16px;

    border:
        1px solid
        var(--cf-accent);

    border-radius:999px;

    background:
        rgba(3,12,24,.95);

    color:
        var(--cf-text);

    font:
        900 9px monospace;

    letter-spacing:2px;

    cursor:pointer;

    box-shadow:
        0 0 22px
        var(--cf-glow);
}

#CF4_TOUR {
    display:none;

    position:fixed;
    inset:0;

    z-index:2147483007;

    align-items:center;
    justify-content:center;

    pointer-events:auto;

    background:
        rgba(0,0,0,.72);
}

#CF4_TOUR_BOX {
    width:min(610px,90vw);

    padding:25px;

    border:
        1px solid
        var(--cf-accent);

    border-radius:18px;

    background:
        rgba(3,10,20,.97);

    box-shadow:
        0 0 40px
        var(--cf-glow);
}

#CF4_TOUR_TITLE {
    color:
        var(--cf-accent);

    font:
        900 19px monospace;

    letter-spacing:2px;
}

#CF4_TOUR_TEXT {
    margin:15px 0;

    color:
        var(--cf-text);

    font:
        10px monospace;

    line-height:1.6;
}

#CF4_BOOT {
    position:fixed;
    inset:0;

    z-index:2147483010;

    display:flex;

    align-items:center;
    justify-content:center;

    flex-direction:column;

    background:#000;

    color:
        var(--cf-accent);

    pointer-events:auto;
}

#CF4_BOOT_TEXT {
    font-size:
        clamp(14px,3vw,28px);

    letter-spacing:4px;

    text-align:center;

    text-shadow:
        0 0 20px
        var(--cf-accent);
}

#CF4_BOOT_BAR {
    width:min(430px,72vw);

    height:3px;

    margin-top:20px;

    background:
        color-mix(
            in srgb,
            var(--cf-accent) 15%,
            transparent
        );
}

#CF4_BOOT_FILL {
    width:0;
    height:100%;

    background:
        var(--cf-accent);

    box-shadow:
        0 0 15px
        var(--cf-accent);
}

@media(max-width:700px) {

    #CF4_WINDOW {
        width:98vw;
        height:94vh;
    }

    #CF4_NAV {
        width:140px;
    }

    #CF4_TEAM_SIDE {
        width:130px;
    }

    #CF4_TEAM_MAIN {
        inset:
            0 0 0 130px;
    }
}
`;

document.head.appendChild(style);
addCleanup(() => style.remove());

/* ============================================================
   THEME ENGINE
   ============================================================ */

function applyTheme(name) {
    const theme =
        THEMES[name] ||
        THEMES.holo;

    root.style.setProperty(
        '--cf-accent',
        theme.accent
    );

    root.style.setProperty(
        '--cf-accent2',
        theme.accent2
    );

    root.style.setProperty(
        '--cf-glow',
        theme.glow
    );

    state.theme =
        THEMES[name]
            ? name
            : 'holo';

    save();
}

applyTheme(state.theme);

/* ============================================================
   BACKGROUND
   ============================================================ */

const bg =
    document.createElement('div');

bg.id = 'CF4_BG';

const canvas =
    document.createElement('canvas');

canvas.id =
    'CF4_CANVAS';

const grid =
    document.createElement('div');

grid.id =
    'CF4_GRID';

bg.append(
    canvas,
    grid
);

root.appendChild(bg);

/* ============================================================
   PARTICLES
   ============================================================ */

const ctx =
    canvas.getContext('2d');

let W = innerWidth;
let H = innerHeight;

let particles = [];

function resizeParticles() {

    const dpr =
        Math.min(
            devicePixelRatio || 1,
            2
        );

    W = innerWidth;
    H = innerHeight;

    canvas.width =
        W * dpr;

    canvas.height =
        H * dpr;

    canvas.style.width =
        W + 'px';

    canvas.style.height =
        H + 'px';

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    const count =
        state.performance
            ? 25
            : state.particles
                ? 85
                : 0;

    particles =
        Array.from(
            { length: count },
            () => ({
                x:
                    Math.random() * W,

                y:
                    Math.random() * H,

                vx:
                    (Math.random() - .5) * .28,

                vy:
                    (Math.random() - .5) * .28,

                r:
                    .4 +
                    Math.random() * 1.5,

                a:
                    .15 +
                    Math.random() * .45
            })
        );
}

resizeParticles();

const resizeHandler =
    () => resizeParticles();

window.addEventListener(
    'resize',
    resizeHandler
);

addCleanup(() =>
    window.removeEventListener(
        'resize',
        resizeHandler
    )
);

/* ============================================================
   POINTER
   ============================================================ */

const pointer = {
    x: W / 2,
    y: H / 2,
    tx: W / 2,
    ty: H / 2
};

const pointerHandler =
    e => {
        pointer.tx =
            e.clientX;

        pointer.ty =
            e.clientY;
    };

window.addEventListener(
    'pointermove',
    pointerHandler
);

addCleanup(() =>
    window.removeEventListener(
        'pointermove',
        pointerHandler
    )
);

/* ============================================================
   AUDIO
   ============================================================ */

let audioCtx = null;

function ensureAudio() {

    if (!state.audio)
        return;

    try {

        if (!audioCtx) {

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContext)
                return;

            audioCtx =
                new AudioContext();
        }

        if (
            audioCtx.state ===
            'suspended'
        ) {
            audioCtx.resume();
        }

    } catch {}
}

function beep(
    frequency = 500,
    duration = .06,
    type = 'triangle'
) {

    if (!state.audio)
        return;

    try {

        ensureAudio();

        if (!audioCtx)
            return;

        const osc =
            audioCtx.createOscillator();

        const gain =
            audioCtx.createGain();

        osc.type =
            type;

        osc.frequency.value =
            frequency;

        gain.gain.setValueAtTime(
            .0001,
            audioCtx.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            Math.max(
                .0001,
                state.volume
            ),
            audioCtx.currentTime + .008
        );

        gain.gain.exponentialRampToValueAtTime(
            .0001,
            audioCtx.currentTime + duration
        );

        osc.connect(gain);
        gain.connect(
            audioCtx.destination
        );

        osc.start();

        osc.stop(
            audioCtx.currentTime +
            duration +
            .02
        );

    } catch {}
}

CF.audio = {
    enable() {
        state.audio = true;
        ensureAudio();
        save();
    },

    disable() {
        state.audio = false;
        save();
    },

    beep
};

/* ============================================================
   NEWS
   ============================================================ */

const news =
    document.createElement('div');

news.id =
    'CF4_NEWS';

news.innerHTML = `
    <div id="CF4_NEWS_TITLE"></div>
    <div id="CF4_NEWS_MESSAGE"></div>
`;

root.appendChild(news);

const newsTitleEl =
    news.querySelector(
        '#CF4_NEWS_TITLE'
    );

const newsMessageEl =
    news.querySelector(
        '#CF4_NEWS_MESSAGE'
    );

let newsTimer = 0;

function showNews(
    title,
    message,
    duration = 3200
) {

    state.newsTitle =
        String(title);

    state.newsMessage =
        String(message);

    save();

    newsTitleEl.textContent =
        state.newsTitle;

    newsMessageEl.textContent =
        state.newsMessage;

    clearTimeout(
        newsTimer
    );

    news.classList.add(
        'show'
    );

    newsTimer =
        setTimeout(
            () =>
                news.classList.remove(
                    'show'
                ),
            duration
        );
}

CF.features.news = {
    show: showNews
};

/* ============================================================
   GAME ADAPTER
   ============================================================ */

const GAME = CF.game;

function refreshGame() {

    try {
        Game.CalculateGains?.();
    } catch {}

    try {
        Game.RefreshStore?.();
    } catch {}

    try {
        Game.UpdateMenu?.();
    } catch {}

    try {
        Game.storeDisplayAmount?.();
    } catch {}
}

function findBuilding(name) {

    const wanted =
        String(name).toLowerCase();

    return Game.ObjectsById?.find(
        b =>
            String(
                b.name
            ).toLowerCase() ===
            wanted
    ) || null;
}

GAME.refresh =
    refreshGame;

GAME.getBuilding =
    findBuilding;

GAME.setCookies =
    amount => {

        const value =
            Number(amount);

        if (
            !Number.isFinite(value)
        ) {
            return false;
        }

        try {

            Game.cookies =
                value;

            if (
                typeof Game.cookiesEarned ===
                'number'
            ) {

                Game.cookiesEarned =
                    Math.max(
                        Game.cookiesEarned,
                        value
                    );
            }

            refreshGame();

            return true;

        } catch {
            return false;
        }
    };

GAME.addCookies =
    amount => {

        const value =
            Number(amount);

        if (!Number.isFinite(value))
            return false;

        return GAME.setCookies(
            (Number(Game.cookies) || 0) +
            value
        );
    };

GAME.setBuilding =
    (name, amount) => {

        const building =
            findBuilding(name);

        const value =
            Math.floor(
                Number(amount)
            );

        if (
            !building ||
            !Number.isFinite(value) ||
            value < 0
        ) {
            return false;
        }

        try {

            building.amount =
                value;

            building.refresh?.();

            refreshGame();

            return true;

        } catch {
            return false;
        }
    };

GAME.setYou =
    amount =>
        GAME.setBuilding(
            'You',
            amount
        );

GAME.buy =
    (name, count = 1) => {

        const building =
            findBuilding(name);

        if (!building)
            return false;

        const total =
            Math.max(
                0,
                Math.floor(
                    Number(count)
                )
            );

        let bought = 0;

        for (
            let i = 0;
            i < total;
            i++
        ) {

            try {

                if (
                    typeof building.buy !==
                    'function'
                ) {
                    break;
                }

                building.buy();
                bought++;

            } catch {
                break;
            }
        }

        refreshGame();

        return bought;
    };

GAME.maxBuilding =
    name => {

        const building =
            findBuilding(name);

        if (!building)
            return 0;

        let bought = 0;
        let safety = 10000;

        while (safety-- > 0) {

            let price;

            try {

                price =
                    typeof building.getPrice ===
                    'function'
                        ? building.getPrice()
                        : building.price;

            } catch {
                break;
            }

            if (
                !Number.isFinite(price) ||
                price > Game.cookies
            ) {
                break;
            }

            if (
                typeof building.buy !==
                'function'
            ) {
                break;
            }

            try {

                building.buy();
                bought++;

            } catch {
                break;
            }
        }

        refreshGame();

        return bought;
    };

GAME.unlockUpgrades =
    () => {

        let count = 0;

        for (
            const upgrade
            of Game.UpgradesById || []
        ) {

            if (!upgrade)
                continue;

            try {

                upgrade.unlocked = 1;
                upgrade.unlock?.();
                count++;

            } catch {}
        }

        refreshGame();

        return count;
    };

GAME.buyUpgrades =
    () => {

        let count = 0;

        for (
            const upgrade
            of Game.UpgradesById || []
        ) {

            if (!upgrade)
                continue;

            try {

                upgrade.unlocked = 1;

                if (
                    !upgrade.bought
                ) {
                    upgrade.earn?.();
                    upgrade.buy?.();
                }

                count++;

            } catch {}
        }

        refreshGame();

        return count;
    };

GAME.unlockAchievements =
    () => {

        let count = 0;

        for (
            const achievement
            of Game.AchievementsById || []
        ) {

            if (!achievement)
                continue;

            try {

                if (
                    typeof Game.Win ===
                    'function'
                ) {
                    Game.Win(
                        achievement.name
                    );
                }

                achievement.won = 1;

                count++;

            } catch {}
        }

        refreshGame();

        return count;
    };

GAME.spawnGoldenCookie =
    () => {

        try {

            if (
                Game.goldenCookie &&
                typeof
                Game.goldenCookie.spawn ===
                'function'
            ) {
                Game.goldenCookie.spawn();

                return true;
            }
        } catch {}

        return false;
    };

GAME.setLumps =
    amount => {

        const value =
            Math.floor(
                Number(amount)
            );

        if (
            !Number.isFinite(value)
        ) {
            return false;
        }

        try {

            if (
                typeof Game.lumps ===
                'number'
            ) {
                Game.lumps =
                    value;
            }

            if (
                typeof Game.lumpsTotal ===
                'number'
            ) {
                Game.lumpsTotal =
                    Math.max(
                        Game.lumpsTotal,
                        value
                    );
            }

            refreshGame();

            return true;

        } catch {
            return false;
        }
    };

GAME.clearWrinklers =
    () => {

        let count = 0;

        try {

            for (
                const wrinkler
                of Game.wrinklers || []
            ) {

                if (!wrinkler)
                    continue;

                try {
                    wrinkler.hp = 0;
                } catch {}

                try {
                    wrinkler.die?.();
                } catch {}

                count++;
            }

        } catch {}

        return count;
    };

GAME.win =
    () => {

        GAME.setCookies(
            Number.MAX_VALUE
        );

        GAME.setBuilding(
            'You',
            10000
        );

        GAME.unlockUpgrades();
        GAME.buyUpgrades();
        GAME.unlockAchievements();

        refreshGame();

        return true;
    };

GAME.status =
    () => ({
        cookies:
            Game.cookies,

        cps:
            Game.cookiesPs,

        buildings:
            Game.ObjectsById?.length || 0,

        upgrades:
            Game.UpgradesById?.length || 0,

        achievements:
            Game.AchievementsById?.length || 0,

        lumps:
            Game.lumps
    });

/* ============================================================
   SPOOF
   ============================================================ */

const nativeCookies =
    document.getElementById(
        'cookies'
    );

let spoof = null;
let strip = null;

if (nativeCookies) {

    spoof =
        document.createElement('div');

    spoof.id =
        'CF4_SPOOF';

    Object.assign(
        spoof.style,
        {
            position:'fixed',
            zIndex:'2147483638',
            pointerEvents:'none',
            whiteSpace:'nowrap',
            transform:'translateX(-50%)',
            color:'#fff',
            textAlign:'center'
        }
    );

    strip =
        document.createElement('div');

    strip.id =
        'CF4_STRIP';

    Object.assign(
        strip.style,
        {
            position:'fixed',
            zIndex:'2147483637',
            pointerEvents:'none',
            background:
                'rgba(0,0,0,.4)'
        }
    );

    document.body.append(
        strip,
        spoof
    );

    nativeCookies.style.setProperty(
        'visibility',
        'hidden',
        'important'
    );

    addCleanup(() => {

        nativeCookies.style
            .removeProperty(
                'visibility'
            );

        spoof.remove();
        strip.remove();
    });
}

function formatHuge(value) {

    if (
        !Number.isFinite(value)
    ) {
        return '∞';
    }

    if (
        Math.abs(value) < 1e6
    ) {
        return Math.floor(
            value
        ).toLocaleString();
    }

    return value.toExponential(4);
}

function syncSpoof() {

    if (
        !nativeCookies ||
        !spoof ||
        !strip
    ) {
        return;
    }

    const node =
        [...nativeCookies.childNodes]
            .find(
                n =>
                    n.nodeType ===
                    Node.TEXT_NODE &&
                    n.textContent.trim()
            );

    if (!node)
        return;

    const range =
        document.createRange();

    range.selectNodeContents(
        node
    );

    const text =
        range.getBoundingClientRect();

    const box =
        nativeCookies
            .getBoundingClientRect();

    const cs =
        getComputedStyle(
            nativeCookies
        );

    spoof.textContent =
        formatHuge(
            Game.cookies
        );

    spoof.style.left =
        `${
            text.left +
            text.width / 2
        }px`;

    spoof.style.top =
        `${text.top}px`;

    spoof.style.fontFamily =
        cs.fontFamily;

    spoof.style.fontSize =
        cs.fontSize;

    spoof.style.fontWeight =
        cs.fontWeight;

    spoof.style.lineHeight =
        cs.lineHeight;

    strip.style.left =
        `${box.left}px`;

    strip.style.top =
        `${box.top}px`;

    strip.style.width =
        `${box.width}px`;

    strip.style.height =
        `${box.height}px`;
}

/* ============================================================
   WINDOW
   ============================================================ */

const windowEl =
    document.createElement('div');

windowEl.id =
    'CF4_WINDOW';

windowEl.innerHTML = `

<header id="CF4_HEADER">

    <div class="CF4_BRAND">

        <div class="CF4_ORB">
            🍪
        </div>

        <div>

            <div class="CF4_TITLE">
                COOKIE FORGE
            </div>

            <div class="CF4_SUB">
                ULTIMATE HOLOGRAPHIC CONTROL SYSTEM
            </div>

        </div>

    </div>

    <div class="CF4_STATUS">
        <i></i>
        SYSTEM ONLINE • FORGE READY
    </div>

</header>

<div id="CF4_BODY">

    <nav id="CF4_NAV">

        <div class="CF4_NAV_HEADER">
            MAIN SYSTEMS
        </div>

    </nav>

    <main id="CF4_WORKSPACE"></main>

</div>
`;

root.appendChild(
    windowEl
);

const nav =
    windowEl.querySelector(
        '#CF4_NAV'
    );

const workspace =
    windowEl.querySelector(
        '#CF4_WORKSPACE'
    );

/* ============================================================
   MINI
   ============================================================ */

const mini =
    document.createElement('button');

mini.id =
    'CF4_MINI';

mini.textContent =
    '🍪 FORGE';

document.body.appendChild(
    mini
);

function minimize() {

    windowEl.style.display =
        'none';

    mini.style.display =
        'block';
}

function restore() {

    windowEl.style.display =
        '';

    mini.style.display =
        'none';
}

mini.onclick =
    restore;

CF.ui.minimize =
    minimize;

CF.ui.restore =
    restore;

addCleanup(() =>
    mini.remove()
);

/* ============================================================
   LOG
   ============================================================ */

const logBox =
    document.createElement('div');

logBox.id =
    'CF4_LOG';

function log(message) {

    const row =
        document.createElement('div');

    row.className =
        'CF4_LOG_ROW';

    row.textContent =
        `[${new Date().toLocaleTimeString()}] ${message}`;

    logBox.prepend(row);

    while (
        logBox.children.length > 20
    ) {
        logBox.lastChild.remove();
    }
}

function button(
    label,
    action,
    extra = ''
) {

    const b =
        document.createElement('button');

    b.className =
        `CF4_BUTTON ${extra}`;

    b.textContent =
        label;

    b.onclick =
        () => {

            ensureAudio();
            beep(650,.05);

            try {
                action();
            } catch (err) {

                console.error(
                    '[Cookie Forge]',
                    err
                );

                log(
                    'ACTION ERROR'
                );
            }
        };

    return b;
}

function card(
    title,
    value,
    note = ''
) {

    const el =
        document.createElement('div');

    el.className =
        'CF4_CARD';

    el.innerHTML = `

        <div class="CF4_LABEL">
            ${escapeHTML(title)}
        </div>

        <div class="CF4_VALUE">
            ${escapeHTML(value)}
        </div>

        ${
            note
                ? `
                    <div
                        class="CF4_MUTED"
                        style="margin-top:6px"
                    >
                        ${escapeHTML(note)}
                    </div>
                  `
                : ''
        }

    `;

    return el;
}

function escapeHTML(value) {

    return String(value)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'","&#039;");
}

/* ============================================================
   24 MODULES
   ============================================================ */

const MENUS = [
    ['dashboard',      '◈ DASHBOARD'],
    ['cookies',        '🍪 COOKIES'],
    ['buildings',      '🏭 BUILDINGS'],
    ['upgrades',       '⬆ UPGRADES'],
    ['achievements',   '🏆 ACHIEVEMENTS'],
    ['golden',         '✨ GOLDEN COOKIES'],
    ['wrinklers',      '🪱 WRINKLERS'],
    ['lumps',          '🍬 SUGAR LUMPS'],
    ['garden',         '🌱 GARDEN'],
    ['stocks',         '📈 STOCK MARKET'],
    ['grimoire',       '📖 GRIMOIRE'],
    ['dragon',         '🐉 DRAGON'],
    ['pantheon',       '⚡ PANTHEON'],
    ['seasons',        '🎭 SEASONS'],
    ['stats',          '📊 STATS'],
    ['telemetry',      '📡 TELEMETRY'],
    ['team',           '⚒ TEAM FORGE'],
    ['news',           '📰 NEWS'],
    ['tools',          '🧰 TOOLS'],
    ['settings',       '⚙ SETTINGS'],
    ['tutorial',       '▶ TUTORIAL'],
    ['audio',          '🔊 AUDIO'],
    ['themes',         '🎨 THEMES'],
    ['debug',          '🧪 DEBUG']
];

const tabs = {};

for (
    const [id,label]
    of MENUS
) {

    const tab =
        document.createElement('button');

    tab.className =
        'CF4_TAB';

    tab.dataset.menu =
        id;

    tab.textContent =
        label;

    nav.appendChild(
        tab
    );

    tabs[id] =
        tab;
}

/* ============================================================
   WORKSPACE HELPERS
   ============================================================ */

function setWorkspace(title) {

    workspace.innerHTML = '';

    const heading =
        document.createElement('div');

    heading.className =
        'CF4_HEADING';

    heading.textContent =
        title;

    const line =
        document.createElement('div');

    line.className =
        'CF4_LINE';

    workspace.append(
        heading,
        line
    );

    return workspace;
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function menuDashboard() {

    const area =
        setWorkspace(
            'DASHBOARD'
        );

    const grid =
        document.createElement('div');

    grid.className =
        'CF4_GRID';

    grid.append(
        card(
            'COOKIES',
            formatHuge(
                Game.cookies
            )
        ),

        card(
            'COOKIES / SECOND',
            formatHuge(
                Game.cookiesPs
            )
        ),

        card(
            'BUILDINGS',
            String(
                Game.ObjectsById?.length || 0
            )
        ),

        card(
            'UPGRADES',
            String(
                Game.UpgradesById?.length || 0
            )
        ),

        card(
            'ACHIEVEMENTS',
            String(
                Game.AchievementsById?.length || 0
            )
        ),

        card(
            'SUGAR LUMPS',
            String(
                Game.lumps ?? 0
            )
        )
    );

    area.appendChild(
        grid
    );

    const actions =
        document.createElement('div');

    actions.className =
        'CF4_GRID';

    actions.style.marginTop =
        '12px';

    actions.append(
        button(
            '⚡ WIN',
            () => {

                GAME.win();

                showNews(
                    'FORGE',
                    'WIN SEQUENCE COMPLETE'
                );
            },
            'CF4_WIN'
        ),

        button(
            '💾 SAVE FORGE STATE',
            () => {

                save();

                showNews(
                    'FORGE',
                    'STATE SAVED'
                );
            }
        ),

        button(
            '▶ START SYSTEM TOUR',
            startTour
        )
    );

    area.appendChild(
        actions
    );

    area.appendChild(
        logBox
    );
}

/* ============================================================
   COOKIES
   ============================================================ */

function menuCookies() {

    const area =
        setWorkspace(
            'COOKIES'
        );

    const input =
        document.createElement('input');

    input.className =
        'CF4_INPUT';

    input.value =
        String(
            Game.cookies || 0
        );

    input.placeholder =
        'Cookie amount';

    area.appendChild(
        input
    );

    const grid =
        document.createElement('div');

    grid.className =
        'CF4_GRID';

    grid.style.marginTop =
        '8px';

    grid.append(

        button(
            'SET COOKIES',
            () => {

                const value =
                    Number(
                        input.value
                    );

                if (
                    !Number.isFinite(
                        value
                    )
                ) {
                    showNews(
                        'COOKIES',
                        'INVALID NUMBER'
                    );
                    return;
                }

                GAME.setCookies(
                    value
                );

                showNews(
                    'COOKIES',
                    'COOKIE BALANCE UPDATED'
                );
            }
        ),

        button(
            '+1,000,000 COOKIES',
            () => {

                GAME.addCookies(
                    1000000
                );

                showNews(
                    'COOKIES',
                    '+1,000,000'
                );
            }
        ),

        button(
            '+1e100 COOKIES',
            () => {

                GAME.addCookies(
                    1e100
                );

                showNews(
                    'COOKIES',
                    '+1e100'
                );
            }
        ),

        button(
            '∞ SET INFINITY',
            () => {

                Game.cookies =
                    Infinity;

                Game.cookiesEarned =
                    Infinity;

                refreshGame();

                showNews(
                    'COOKIES',
                    'INFINITY ENABLED'
                );
            },
            'CF4_WIN'
        )
    );

    area.appendChild(
        grid
    );

    area.appendChild(
        card(
            'VISIBLE SPOOF',
            nativeCookies
                ? 'ACTIVE'
                : 'UNAVAILABLE',
            'The Forge layer follows the native cookie-counter geometry.'
        )
    );
}

/* ============================================================
   BUILDINGS
   ============================================================ */

function menuBuildings() {

    const area =
        setWorkspace(
            'BUILDINGS'
        );

    const grid =
        document.createElement('div');

    grid.className =
        'CF4_GRID';

    for (
        const building
        of Game.ObjectsById || []
    ) {

        grid.appendChild(
            card(
                building.name,
                formatHuge(
                    building.amount
                )
            )
        );
    }

    area.appendChild(
        grid
    );

    const controls =
        document.createElement('div');

    controls.className =
        'CF4_GRID';

    controls.style.marginTop =
        '12px';

    controls.append(

        button(
            '+100 ALL',
            () => {

                for (
                    const b
                    of Game.ObjectsById || []
                ) {

                    try {
                        b.amount += 100;
                        b.bought += 100;
                    } catch {}
                }

                refreshGame();
            }
        ),

        button(
            'SET ALL → 1001',
            () => {

                for (
                    const b
                    of Game.ObjectsById || []
                ) {

                    try {
                        b.amount =
                            Math.max(
                                b.amount || 0,
                                1001
                            );
                    } catch {}
                }

                refreshGame();
            }
        ),

        button(
            'SET YOU → 10000',
            () =>
                GAME.setYou(
                    10000
                )
        ),

        button(
            'MAX YOU',
            () => {

                const count =
                    GAME.maxBuilding(
                        'You'
                    );

                showNews(
                    'YOU',
                    `PURCHASED ${count} YOU`
                );
            }
        )
    );

    area.appendChild(
        controls
    );
}

/* ============================================================
   UPGRADES
   ============================================================ */

function menuUpgrades() {

    const area =
        setWorkspace(
            'UPGRADES'
        );

    area.appendChild(
        card(
            'TOTAL UPGRADES',
            String(
                Game.UpgradesById?.length || 0
            )
        )
    );

    const grid =
        document.createElement('div');

    grid.className =
        'CF4_GRID';

    for (
        const upgrade
        of Game.UpgradesById || []
    ) {

        grid.appendChild(
            card(
                upgrade.name,
                upgrade.bought
                    ? 'BOUGHT'
                    : upgrade.unlocked
                        ? 'UNLOCKED'
                        : 'LOCKED'
            )
        );
    }

    area.appendChild(
        grid
    );

    const actions =
        document.createElement('div');

    actions.className =
        'CF4_GRID';

    actions.style.marginTop =
        '12px';

    actions.append(
        button(
            'UNLOCK ALL',
            () => {

                const n =
                    GAME.unlockUpgrades();

                showNews(
                    'UPGRADES',
                    `${n} processed`
                );
            }
        ),

        button(
            'BUY ALL',
            () => {

                const n =
                    GAME.buyUpgrades();

                showNews(
                    'UPGRADES',
                    `${n} processed`
                );
            }
        )
    );

    area.appendChild(
        actions
    );
}

/* ============================================================
   ACHIEVEMENTS
   ============================================================ */

function menuAchievements() {

    const area =
        setWorkspace(
            'ACHIEVEMENTS'
        );

    area.appendChild(
        button(
            'UNLOCK ALL ACHIEVEMENTS',
            () => {

                const n =
                    GAME.unlockAchievements();

                showNews(
                    'ACHIEVEMENTS',
                    `${n} processed`
                );
            },
            'CF4_WIN'
        )
    );

    const grid =
        document.createElement('div');

    grid.className =
        'CF4_GRID';

    for (
        const achievement
        of Game.AchievementsById || []
    ) {

        grid.appendChild(
            card(
                achievement.name,
                achievement.won
                    ? 'WON'
                    : 'LOCKED'
            )
        );
    }

    area.appendChild(
        grid
    );
}

/* ============================================================
   GOLDEN
   ============================================================ */

function menuGolden() {

    const area =
        setWorkspace(
            'GOLDEN COOKIES'
        );

    area.appendChild(
        card(
            'CURRENT SHIMMERS',
            String(
                Game.shimmers?.length || 0
            )
        )
    );

    const grid =
        document.createElement('div');

    grid.className =
        'CF4_GRID';

    grid.append(
        button(
            'SPAWN GOLDEN COOKIE',
            () => {

                const ok =
                    GAME.spawnGoldenCookie();

                showNews(
                    'GOLDEN COOKIE',
                    ok
                        ? 'SPAWN REQUEST SENT'
                        : 'API UNAVAILABLE'
                );
            }
        ),

        button(
            'CLEAR SHIMMERS',
            () => {

                for (
                    const shimmer
                    of Game.shimmers || []
                ) {

                    try {
                        shimmer.pop?.();
                    } catch {}
                }
            }
        )
    );

    area.appendChild(
        grid
    );
}

/* ============================================================
   WRINKLERS
   ============================================================ */

function menuWrinklers() {

    const area =
        setWorkspace(
            'WRINKLERS'
        );

    area.appendChild(
        card(
            'WRINKLER SLOTS',
            String(
                Game.wrinklers?.length || 0
            )
        )
    );

    area.appendChild(
        button(
            'CLEAR WRINKLERS',
            () => {

                const n =
                    GAME.clearWrinklers();

                showNews(
                    'WRINKLERS',
                    `${n} processed`
                );
            }
        )
    );
}

/* ============================================================
   LUMPS
   ============================================================ */

function menuLumps() {

    const area =
        setWorkspace(
            'SUGAR LUMPS'
        );

    area.appendChild(
        card(
            'CURRENT LUMPS',
            String(
                Game.lumps ?? 0
            )
        )
    );

    const input =
        document.createElement('input');

    input.className =
        'CF4_INPUT';

    input.value =
        String(
            Game.lumps ?? 0
        );

    area.appendChild(
        input
    );

    area.appendChild(
        button(
            'SET LUMPS',
            () => {

                GAME.setLumps(
                    input.value
                );

                showNews(
                    'LUMPS',
                    'BALANCE UPDATED'
                );
            }
        )
    );
}

/* ============================================================
   GENERIC MODULES
   ============================================================ */

function genericModule(
    title,
    description
) {

    const area =
        setWorkspace(
            title
        );

    area.appendChild(
        card(
            'MODULE',
            'ONLINE',
            description
        )
    );

    area.appendChild(
        button(
            'RUN MODULE CHECK',
            () =>
                showNews(
                    title,
                    'MODULE CHECK COMPLETE'
                )
        )
    );
}

function menuGarden() {
    genericModule(
        'GARDEN',
        'Garden diagnostics and controls.'
    );
}

function menuStocks() {
    genericModule(
        'STOCK MARKET',
        'Stock-market diagnostics and telemetry.'
    );
}

function menuGrimoire() {
    genericModule(
        'GRIMOIRE',
        'Spell and magic-meter diagnostics.'
    );
}

function menuDragon() {
    genericModule(
        'DRAGON',
        'Dragon progress diagnostics.'
    );
}

function menuPantheon() {
    genericModule(
        'PANTHEON',
        'Pantheon diagnostics.'
    );
}

function menuSeasons() {
    genericModule(
        'SEASONS',
        'Season and event telemetry.'
    );
}

/* ============================================================
   STATS
   ============================================================ */

function menuStats() {

    const area =
        setWorkspace(
            'STATS'
        );

    const grid =
        document.createElement('div');

    grid.className =
        'CF4_GRID';

    [
        ['Cookies', Game.cookies],
        ['CPS', Game.cookiesPs],
        [
            'Buildings',
            Game.ObjectsById?.length || 0
        ],
        [
            'Upgrades',
            Game.UpgradesById?.length || 0
        ],
        [
            'Achievements',
            Game.AchievementsById?.length || 0
        ],
        [
            'Lumps',
            Game.lumps ?? 0
        ]
    ].forEach(
        ([name,value]) =>
            grid.appendChild(
                card(
                    name,
                    formatHuge(
                        Number(value)
                    )
                )
            )
    );

    area.appendChild(
        grid
    );
}

/* ============================================================
   TELEMETRY
   ============================================================ */

function menuTelemetry() {

    const area =
        setWorkspace(
            'TELEMETRY'
        );

    const grid =
        document.createElement('div');

    grid.className =
        'CF4_GRID';

    grid.append(
        card(
            'GAME VERSION',
            String(
                Game.version ||
                'UNKNOWN'
            )
        ),

        card(
            'FORGE',
            CF.running
                ? 'ONLINE'
                : 'OFFLINE'
        ),

        card(
            'PARTICLES',
            state.particles
                ? 'ACTIVE'
                : 'OFF'
        ),

        card(
            'AUDIO',
            state.audio
                ? 'ONLINE'
                : 'MUTED'
        )
    );

    area.appendChild(
        grid
    );
}

/* ============================================================
   NEWS MENU
   ============================================================ */

function menuNews() {

    const area =
        setWorkspace(
            'NEWS'
        );

    const titleInput =
        document.createElement(
            'input'
        );

    titleInput.className =
        'CF4_INPUT';

    titleInput.value =
        state.newsTitle;

    const messageInput =
        document.createElement(
            'textarea'
        );

    messageInput.className =
        'CF4_TEXTAREA';

    messageInput.rows =
        4;

    messageInput.value =
        state.newsMessage;

    area.append(
        titleInput,
        messageInput
    );

    area.appendChild(
        button(
            'PUBLISH NEWS',
            () => {

                state.newsTitle =
                    titleInput.value ||
                    'FORGE NEWS';

                state.newsMessage =
                    messageInput.value ||
                    '';

                save();

                showNews(
                    state.newsTitle,
                    state.newsMessage
                );
            }
        )
    );
}

/* ============================================================
   TOOLS
   ============================================================ */

function menuTools() {

    const area =
        setWorkspace(
            'TOOLS'
        );

    const grid =
        document.createElement(
            'div'
        );

    grid.className =
        'CF4_GRID';

    grid.append(

        button(
            '⚡ WIN',
            () => {

                GAME.win();

                showNews(
                    'FORGE',
                    'WIN SEQUENCE COMPLETE'
                );
            },
            'CF4_WIN'
        ),

        button(
            'SET YOU → 10000',
            () =>
                GAME.setYou(10000)
        ),

        button(
            'UNLOCK UPGRADES',
            () =>
                GAME.unlockUpgrades()
        ),

        button(
            'UNLOCK ACHIEVEMENTS',
            () =>
                GAME.unlockAchievements()
        ),

        button(
            'CLEAR WRINKLERS',
            () =>
                GAME.clearWrinklers()
        ),

        button(
            'SPAWN GOLDEN COOKIE',
            () =>
                GAME.spawnGoldenCookie()
        )
    );

    area.appendChild(
        grid
    );
}

/* ============================================================
   SETTINGS
   ============================================================ */

function menuSettings() {

    const area =
        setWorkspace(
            'SETTINGS'
        );

    const grid =
        document.createElement(
            'div'
        );

    grid.className =
        'CF4_GRID';

    grid.append(

        button(
            'FULLSCREEN',
            async () => {

                try {

                    if (
                        !document.fullscreenElement
                    ) {
                        await root
                            .requestFullscreen?.();
                    } else {
                        await document
                            .exitFullscreen?.();
                    }

                } catch {}
            }
        ),

        button(
            'MINIMIZE',
            minimize
        ),

        button(
            'PERFORMANCE MODE',
            () => {

                state.performance =
                    !state.performance;

                state.particles =
                    !state.performance;

                resizeParticles();
                save();

                openMenu(
                    'settings'
                );
            }
        ),

        button(
            'MUTE / UNMUTE',
            () => {

                state.audio =
                    !state.audio;

                save();

                openMenu(
                    'settings'
                );
            }
        ),

        button(
            'RESET STATE',
            () => {

                state =
                    {
                        ...DEFAULT_STATE
                    };

                CF.state =
                    state;

                save();

                applyTheme(
                    state.theme
                );

                openMenu(
                    'settings'
                );
            }
        ),

        button(
            'CLOSE FORGE',
            () =>
                CF.destroy()
        )
    );

    area.appendChild(
        grid
    );
}

/* ============================================================
   TUTORIAL
   ============================================================ */

const tutorial =
    document.createElement(
        'div'
    );

tutorial.id =
    'CF4_TOUR';

tutorial.innerHTML = `

    <div id="CF4_TOUR_BOX">

        <div
            id="CF4_TOUR_TITLE"
        ></div>

        <div
            id="CF4_TOUR_TEXT"
        ></div>

        <div
            style="
                color:var(--cf-accent);
                font:8px monospace;
                letter-spacing:2px;
                margin-bottom:12px;
            "
            id="CF4_TOUR_PROGRESS"
        ></div>

        <div
            style="
                display:flex;
                justify-content:flex-end;
                gap:7px;
                flex-wrap:wrap;
            "
        >

            <button
                class="CF4_BUTTON"
                id="CF4_TOUR_BACK"
            >
                BACK
            </button>

            <button
                class="CF4_BUTTON"
                id="CF4_TOUR_PAUSE"
            >
                PAUSE
            </button>

            <button
                class="CF4_BUTTON"
                id="CF4_TOUR_NEXT"
            >
                NEXT
            </button>

            <button
                class="CF4_BUTTON"
                id="CF4_TOUR_SKIP"
            >
                SKIP
            </button>

        </div>

    </div>
`;

root.appendChild(
    tutorial
);

const TOUR_STEPS = [
    [
        'DASHBOARD',
        'Live Cookie Clicker telemetry and Forge system status.'
    ],
    [
        'COOKIES',
        'Cookie balance and visual counter controls.'
    ],
    [
        'BUILDINGS',
        'Building inspection and bulk controls.'
    ],
    [
        'UPGRADES',
        'Upgrade inspection and processing.'
    ],
    [
        'ACHIEVEMENTS',
        'Achievement inspection and processing.'
    ],
    [
        'GAME SYSTEMS',
        'Golden Cookies, Wrinklers, Lumps, Garden, Stocks, Grimoire, Dragon, Pantheon and Seasons.'
    ],
    [
        'TEAM FORGE',
        'Team player, OVR, training, news and credits workspace.'
    ],
    [
        'SETTINGS',
        'Theme, performance, audio, fullscreen, minimize and reset controls.'
    ]
];

let tourIndex = 0;
let tourPaused = false;

function renderTour() {

    const step =
        TOUR_STEPS[
            tourIndex
        ];

    if (!step) {
        endTour();
        return;
    }

    tutorial.querySelector(
        '#CF4_TOUR_TITLE'
    ).textContent =
        step[0];

    tutorial.querySelector(
        '#CF4_TOUR_TEXT'
    ).textContent =
        step[1];

    tutorial.querySelector(
        '#CF4_TOUR_PROGRESS'
    ).textContent =
        `SYSTEM TOUR ${
            tourIndex + 1
        } / ${
            TOUR_STEPS.length
        }`;
}

function startTour() {

    tourIndex = 0;
    tourPaused = false;

    tutorial.style.display =
        'flex';

    renderTour();

    beep(
        650,
        .08
    );
}

function endTour() {

    tutorial.style.display =
        'none';

    tourPaused = false;

    state.tutorialStep =
        tourIndex;

    save();
}

tutorial.querySelector(
    '#CF4_TOUR_NEXT'
).onclick = () => {

    if (tourPaused)
        return;

    tourIndex++;

    renderTour();

    beep(
        700,
        .05
    );
};

tutorial.querySelector(
    '#CF4_TOUR_BACK'
).onclick = () => {

    tourIndex =
        Math.max(
            0,
            tourIndex - 1
        );

    renderTour();

    beep(
        500,
        .05
    );
};

tutorial.querySelector(
    '#CF4_TOUR_PAUSE'
).onclick = () => {

    tourPaused =
        !tourPaused;

    tutorial.querySelector(
        '#CF4_TOUR_PAUSE'
    ).textContent =
        tourPaused
            ? 'RESUME'
            : 'PAUSE';
};

tutorial.querySelector(
    '#CF4_TOUR_SKIP'
).onclick =
    endTour;

/* ============================================================
   AUDIO MENU
   ============================================================ */

function menuAudio() {

    const area =
        setWorkspace(
            'AUDIO'
        );

    const slider =
        document.createElement(
            'input'
        );

    slider.type =
        'range';

    slider.min =
        '0';

    slider.max =
        '1';

    slider.step =
        '.01';

    slider.value =
        String(
            state.volume
        );

    slider.style.width =
        '100%';

    slider.oninput =
        () => {

            state.volume =
                Number(
                    slider.value
                );

            save();
        };

    area.appendChild(
        card(
            'AUDIO STATUS',
            state.audio
                ? 'ONLINE'
                : 'MUTED'
        )
    );

    area.appendChild(
        slider
    );

    const grid =
        document.createElement(
            'div'
        );

    grid.className =
        'CF4_GRID';

    grid.append(

        button(
            'TEST UI SOUND',
            () =>
                beep(
                    900,
                    .04
                )
        ),

        button(
            'TEST SUCCESS',
            () => {

                beep(
                    600,
                    .08
                );

                setTimeout(
                    () =>
                        beep(
                            1000,
                            .12
                        ),
                    80
                );
            }
        ),

        button(
            'MUTE / UNMUTE',
            () => {

                state.audio =
                    !state.audio;

                save();

                openMenu(
                    'audio'
                );
            }
        )
    );

    area.appendChild(
        grid
    );
}

/* ============================================================
   THEMES
   ============================================================ */

function menuThemes() {

    const area =
        setWorkspace(
            'THEMES'
        );

    const grid =
        document.createElement(
            'div'
        );

    grid.className =
        'CF4_GRID';

    Object.keys(
        THEMES
    ).forEach(
        name => {

            grid.appendChild(
                button(
                    name.toUpperCase(),
                    () => {

                        applyTheme(
                            name
                        );

                        openMenu(
                            'themes'
                        );
                    }
                )
            );
        }
    );

    area.appendChild(
        grid
    );
}

/* ============================================================
   DEBUG
   ============================================================ */

function menuDebug() {

    const area =
        setWorkspace(
            'DEBUG'
        );

    area.appendChild(
        card(
            'FORGE VERSION',
            CF.version
        )
    );

    area.appendChild(
        card(
            'GAME COOKIES',
            formatHuge(
                Game.cookies
            )
        )
    );

    area.appendChild(
        card(
            'GAME CPS',
            formatHuge(
                Game.cookiesPs
            )
        )
    );

    const box =
        document.createElement(
            'pre'
        );

    box.style.cssText = `
        margin-top:10px;
        padding:10px;
        max-height:260px;
        overflow:auto;
        border:1px solid rgba(0,234,255,.15);
        border-radius:8px;
        background:rgba(0,0,0,.35);
        color:#6f8a94;
        font:8px monospace;
        white-space:pre-wrap;
    `;

    box.textContent =
        JSON.stringify(
            {
                version:
                    CF.version,

                state:
                    CF.state,

                game:
                    GAME.status(),

                cleanup:
                    CF.cleanup.length
            },
            null,
            2
        );

    area.appendChild(
        box
    );
}

/* ============================================================
   TEAM FORGE
   ============================================================ */

const team =
    document.createElement('div');

team.id =
    'CF4_TEAM';

team.innerHTML = `

    <aside id="CF4_TEAM_SIDE">

        <div class="CF4_TEAM_BRAND">
            TEAM FORGE
        </div>

    </aside>

    <main id="CF4_TEAM_MAIN"></main>
`;

root.appendChild(
    team
);

const teamSide =
    team.querySelector(
        '#CF4_TEAM_SIDE'
    );

const teamMain =
    team.querySelector(
        '#CF4_TEAM_MAIN'
    );

const teamTopics = [
    ['team','⚒ TEAM'],
    ['players','👥 PLAYERS'],
    ['ovr','📊 OVR'],
    ['training','⚡ TRAINING'],
    ['news','📰 NEWS'],
    ['credits','💖 CREDITS']
];

const topicButtons = {};

for (
    const [id,label]
    of teamTopics
) {

    const b =
        document.createElement(
            'button'
        );

    b.className =
        'CF4_TOPIC';

    b.textContent =
        label;

    b.onclick =
        () => {

            state.teamTopic =
                id;

            save();

            renderTeamTopic(
                id
            );
        };

    teamSide.appendChild(
        b
    );

    topicButtons[id] =
        b;
}

function openTeamForge() {

    team.style.display =
        'block';

    renderTeamTopic(
        state.teamTopic ||
        'team'
    );
}

function closeTeamForge() {

    team.style.display =
        'none';
}

function renderTeamTopic(
    topic
) {

    Object.entries(
        topicButtons
    ).forEach(
        ([id,b]) =>
            b.classList.toggle(
                'active',
                id === topic
            )
    );

    teamMain.innerHTML = '';

    if (topic === 'team')
        renderTeamHome();

    if (topic === 'players')
        renderTeamPlayers();

    if (topic === 'ovr')
        renderTeamOVR();

    if (topic === 'training')
        renderTeamTraining();

    if (topic === 'news')
        renderTeamNews();

    if (topic === 'credits')
        renderTeamCredits();
}

function teamTitle(text) {

    const title =
        document.createElement(
            'div'
        );

    title.className =
        'CF4_TEAM_TITLE';

    title.textContent =
        text;

    teamMain.appendChild(
        title
    );

    const line =
        document.createElement(
            'div'
        );

    line.className =
        'CF4_LINE';

    teamMain.appendChild(
        line
    );
}

function renderTeamHome() {

    teamTitle(
        'TEAM FORGE'
    );

    const grid =
        document.createElement(
            'div'
        );

    grid.className =
        'CF4_GRID';

    grid.append(
        card(
            'TEAM',
            'FORGE XI'
        ),

        card(
            'PLAYERS',
            '1'
        ),

        card(
            'CAPTAIN',
            'Notacoder'
        ),

        card(
            'STATUS',
            'ONLINE'
        )
    );

    teamMain.appendChild(
        grid
    );
}

function renderTeamPlayers() {

    teamTitle(
        'PLAYERS'
    );

    const player =
        document.createElement(
            'div'
        );

    player.className =
        'CF4_PLAYER';

    player.innerHTML = `

        <span>
            01 • Notacoder
        </span>

        <strong
            style="
                color:var(--cf-accent);
            "
        >
            ACTIVE
        </strong>
    `;

    teamMain.appendChild(
        player
    );
}

function renderTeamOVR() {

    teamTitle(
        'OVR CONTROL'
    );

    teamMain.append(
        card(
            'PLAYER OVR',
            '999'
        ),

        card(
            'TEAM OVR',
            '999'
        )
    );

    teamMain.appendChild(
        button(
            'MAX OVR',
            () =>
                showNews(
                    'TEAM FORGE',
                    'NOTACODER OVR → 999'
                )
        )
    );
}

function renderTeamTraining() {

    teamTitle(
        'TRAINING'
    );

    const grid =
        document.createElement(
            'div'
        );

    grid.className =
        'CF4_GRID';

    [
        'FINISHING',
        'SPEED',
        'PASSING',
        'DEFENDING',
        'PHYSICAL',
        'CHEMISTRY'
    ].forEach(
        skill =>
            grid.appendChild(
                button(
                    `MAX ${skill}`,
                    () =>
                        showNews(
                            'TEAM FORGE',
                            `${skill} TRAINING MAXED`
                        )
                )
            )
    );

    teamMain.appendChild(
        grid
    );
}

function renderTeamNews() {

    teamTitle(
        'TEAM NEWS'
    );

    const titleInput =
        document.createElement(
            'input'
        );

    titleInput.className =
        'CF4_INPUT';

    titleInput.value =
        state.newsTitle;

    const messageInput =
        document.createElement(
            'textarea'
        );

    messageInput.className =
        'CF4_TEXTAREA';

    messageInput.rows =
        5;

    messageInput.value =
        state.newsMessage;

    teamMain.append(
        titleInput,
        messageInput
    );

    teamMain.appendChild(
        button(
            'PUBLISH NEWS',
            () => {

                showNews(
                    titleInput.value ||
                    'TEAM FORGE',
                    messageInput.value ||
                    ''
                );
            }
        )
    );
}

function renderTeamCredits() {

    teamTitle(
        'CREDITS'
    );

    const box =
        document.createElement(
            'div'
        );

    box.style.cssText = `
        min-height:330px;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        text-align:center;
    `;

    box.innerHTML = `

        <div class="CF4_RAINBOW">
            Notacoder
        </div>

        <div
            style="
                margin-top:13px;
                color:#708690;
                font:8px monospace;
                letter-spacing:3px;
            "
        >
            TEAM FORGE CREATOR
        </div>

        <div class="CF4_HEART">
            💖
        </div>
    `;

    teamMain.appendChild(
        box
    );
}

CF.team.open =
    openTeamForge;

CF.team.close =
    closeTeamForge;

CF.team.render =
    renderTeamTopic;

/* ============================================================
   RENDERER
   ============================================================ */

const renderer = {
    dashboard: menuDashboard,
    cookies: menuCookies,
    buildings: menuBuildings,
    upgrades: menuUpgrades,
    achievements: menuAchievements,
    golden: menuGolden,
    wrinklers: menuWrinklers,
    lumps: menuLumps,
    garden: menuGarden,
    stocks: menuStocks,
    grimoire: menuGrimoire,
    dragon: menuDragon,
    pantheon: menuPantheon,
    seasons: menuSeasons,
    stats: menuStats,
    telemetry: menuTelemetry,

    team: () => {
        workspace.style.display =
            'none';

        openTeamForge();
    },

    news: menuNews,
    tools: menuTools,
    settings: menuSettings,

    tutorial: () => {
        workspace.style.display =
            '';

        setWorkspace(
            'TUTORIAL'
        );

        startTour();
    },

    audio: menuAudio,
    themes: menuThemes,
    debug: menuDebug
};

function openMenu(id) {

    state.activeMenu =
        id;

    save();

    Object.entries(
        tabs
    ).forEach(
        ([key,el]) =>
            el.classList.toggle(
                'active',
                key === id
            )
    );

    if (
        id === 'team'
    ) {

        workspace.style.display =
            'none';

        openTeamForge();

        return;
    }

    closeTeamForge();

    workspace.style.display =
        '';

    try {
        renderer[id]();
    } catch (err) {

        console.error(
            '[Cookie Forge menu error]',
            id,
            err
        );

        const area =
            setWorkspace(
                'MODULE ERROR'
            );

        area.appendChild(
            card(
                'MODULE',
                id.toUpperCase(),
                'The module failed safely.'
            )
        );
    }
}

Object.entries(
    tabs
).forEach(
    ([id,tab]) => {

        tab.onclick =
            () =>
                openMenu(id);
    }
);

/* ============================================================
   BOOT SCREEN
   ============================================================ */

const boot =
    document.createElement(
        'div'
    );

boot.id =
    'CF4_BOOT';

boot.innerHTML = `

    <div id="CF4_BOOT_TEXT">
        INITIALIZING COOKIE FORGE...
    </div>

    <div id="CF4_BOOT_BAR">
        <div id="CF4_BOOT_FILL"></div>
    </div>
`;

root.appendChild(
    boot
);

const bootText =
    boot.querySelector(
        '#CF4_BOOT_TEXT'
    );

const bootFill =
    boot.querySelector(
        '#CF4_BOOT_FILL'
    );

const bootMessages = [
    'INITIALIZING COOKIE FORGE...',
    'LOADING GAME ADAPTER...',
    'MATERIALIZING HOLOGRAPHIC CORE...',
    'STARTING PARTICLES...',
    'STARTING AUDIO...',
    'LOADING 24 MODULES...',
    'TEAM FORGE ONLINE...',
    'SYSTEM ONLINE • FORGE READY'
];

let bootIndex = 0;

const bootTimer =
    setInterval(
        () => {

            if (destroyed) {

                clearInterval(
                    bootTimer
                );

                return;
            }

            const progress =
                Math.min(
                    100,
                    (
                        bootIndex + 1
                    ) /
                    bootMessages.length *
                    100
                );

            bootFill.style.width =
                `${progress}%`;

            bootText.textContent =
                bootMessages[
                    bootIndex
                ];

            beep(
                280 +
                bootIndex * 85,
                .035
            );

            bootIndex++;

            if (
                bootIndex >=
                bootMessages.length
            ) {

                clearInterval(
                    bootTimer
                );

                setTimeout(
                    () => {

                        if (destroyed)
                            return;

                        boot.style.transition =
                            'opacity .5s';

                        boot.style.opacity =
                            '0';

                        setTimeout(
                            () =>
                                boot.remove(),
                            520
                        );

                    },
                    180
                );
            }

        },
        145
    );

addCleanup(() =>
    clearInterval(
        bootTimer
    )
);

/* ============================================================
   MASTER RAF
   ============================================================ */

function frame() {

    if (
        !CF.running ||
        destroyed
    ) {
        return;
    }

    raf =
        requestAnimationFrame(
            frame
        );

    pointer.x +=
        (
            pointer.tx -
            pointer.x
        ) * .12;

    pointer.y +=
        (
            pointer.ty -
            pointer.y
        ) * .12;

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    if (
        state.particles
    ) {

        for (
            const p
            of particles
        ) {

            p.x +=
                p.vx *
                state.intensity;

            p.y +=
                p.vy *
                state.intensity;

            if (p.x < -5)
                p.x = W + 5;

            if (p.x > W + 5)
                p.x = -5;

            if (p.y < -5)
                p.y = H + 5;

            if (p.y > H + 5)
                p.y = -5;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.r,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(
                    80,
                    235,
                    255,
                    ${p.a}
                )`;

            ctx.fill();
        }
    }

    syncSpoof();
}

raf =
    requestAnimationFrame(
        frame
    );

/* ============================================================
   DRAGGING
   ============================================================ */

let dragging = false;
let dx = 0;
let dy = 0;

const header =
    document.getElementById(
        'CF4_HEADER'
    );

const down =
    e => {

        if (
            e.target.closest(
                'button'
            )
        ) {
            return;
        }

        dragging = true;

        const rect =
            windowEl
                .getBoundingClientRect();

        dx =
            e.clientX -
            rect.left;

        dy =
            e.clientY -
            rect.top;

        windowEl.style.left =
            `${rect.left}px`;

        windowEl.style.top =
            `${rect.top}px`;

        windowEl.style.transform =
            'none';

        header.setPointerCapture?.(
            e.pointerId
        );
    };

const move =
    e => {

        if (!dragging)
            return;

        windowEl.style.left =
            `${e.clientX - dx}px`;

        windowEl.style.top =
            `${e.clientY - dy}px`;
    };

const up =
    () => {
        dragging = false;
    };

header.addEventListener(
    'pointerdown',
    down
);

header.addEventListener(
    'pointermove',
    move
);

header.addEventListener(
    'pointerup',
    up
);

addCleanup(() => {

    header.removeEventListener(
        'pointerdown',
        down
    );

    header.removeEventListener(
        'pointermove',
        move
    );

    header.removeEventListener(
        'pointerup',
        up
    );
});

/* ============================================================
   ESC
   ============================================================ */

const keyHandler =
    e => {

        if (
            e.key !== 'Escape'
        ) {
            return;
        }

        if (
            tutorial.style.display ===
            'flex'
        ) {

            endTour();
            return;
        }

        if (
            team.style.display ===
            'block'
        ) {

            closeTeamForge();
            workspace.style.display =
                '';

            openMenu(
                state.activeMenu ===
                'team'
                    ? 'dashboard'
                    : state.activeMenu
            );

            return;
        }

        if (
            mini.style.display ===
            'block'
        ) {
            restore();
        } else {
            minimize();
        }
    };

document.addEventListener(
    'keydown',
    keyHandler
);

addCleanup(() =>
    document.removeEventListener(
        'keydown',
        keyHandler
    )
);

/* ============================================================
   PUBLIC API
   ============================================================ */

CF.openMenu =
    openMenu;

CF.showNews =
    showNews;

CF.startTour =
    startTour;

CF.minimize =
    minimize;

CF.restore =
    restore;

/* ============================================================
   START
   ============================================================ */

openMenu(
    tabs[state.activeMenu]
        ? state.activeMenu
        : 'dashboard'
);

showNews(
    'COOKIE FORGE',
    'SYSTEM ONLINE • 24 MODULES READY',
    2800
);

console.clear();

console.log(
    '%c🍪 COOKIE FORGE 4.0.0',
    `
        font-size:22px;
        font-weight:950;
        color:#00eaff;
        text-shadow:
            0 0 18px #00eaff;
    `
);

console.log(
    '%c24 MODULES ONLINE • TEAM FORGE ONLINE',
    `
        color:#ff00c8;
        font-weight:900;
    `
);

console.log(
    CF
);

})();
