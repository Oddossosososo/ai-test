# Forge Big

Forge Big is the numerical layer for Cookie Forge when normal JavaScript `Number` values are too small.

## Browser engine

`ForgeBig.js` stores values as `sign × BigInt coefficient × 10^exponent`.
That means values such as `1e1000`, `1e1000000`, and much larger magnitudes do not become JavaScript `Infinity` merely because they exceed `Number.MAX_VALUE`.

Load after Forge:

```js
fetch('https://raw.githubusercontent.com/Oddossosososo/ai-test/main/ForgeBig.js').then(r=>r.text()).then(new Function('return arguments[0]') /* loader placeholder */)
```

Recommended direct console loader:

```js
fetch('https://raw.githubusercontent.com/Oddossosososo/ai-test/main/ForgeBig.js').then(r=>r.text()).then(code=>new Function(code)())
```

Then:

```js
ForgeBig.d('1e1000').mul('2').sci()
ForgeBig.d('1e1000000').sci()
CookieForge.big.test()
```

## Other languages

- `forge_big.py` — Python Decimal reference/testing engine.
- `forge_big.rs` — Rust reference intended for a future WebAssembly build.

Python and Rust do not execute directly inside a normal browser page. They are included as separate numerical/tooling layers; WebAssembly is the practical browser bridge for compiled code.
