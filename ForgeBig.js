/*
 * COOKIE FORGE — FORGE BIG ENGINE
 * Arbitrary-magnitude decimal arithmetic for Cookie Forge.
 *
 * This deliberately does NOT use JS Number for the stored value.
 * The representation is: sign * coefficient * 10^exponent.
 * coefficient is a BigInt, so the integer part can grow far beyond 1e+308.
 *
 * Browser reality:
 * - BigInt is native and handles exact integers of arbitrary size.
 * - WebAssembly is exposed as an optional accelerator/interop layer.
 * - Python/Rust adapters can live beside this file for tooling/server-side
 *   calculations, but browsers cannot execute .py/.rs files directly.
 */
(() => {
  'use strict';

  const previous = globalThis.ForgeBig;

  class BigDecimal {
    constructor(value = 0, exponent = null) {
      if (value instanceof BigDecimal) {
        this.s = value.s; this.c = value.c; this.e = value.e; return;
      }
      if (exponent !== null) {
        this.s = value < 0 ? -1 : 1;
        this.c = BigInt(Math.abs(value));
        this.e = Number(exponent) || 0;
        return this._norm();
      }
      return this._parse(value);
    }

    _parse(v) {
      if (typeof v === 'bigint') {
        this.s = v < 0n ? -1 : 1;
        this.c = v < 0n ? -v : v;
        this.e = 0;
        return this._norm();
      }
      if (typeof v === 'number') {
        if (!Number.isFinite(v)) throw new RangeError('ForgeBig: non-finite number');
        v = String(v);
      }
      v = String(v).trim();
      if (!v) throw new TypeError('ForgeBig: empty value');
      const m = v.match(/^([+-])?(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i);
      if (!m) throw new TypeError(`ForgeBig: invalid decimal: ${v}`);
      const sign = m[1] === '-' ? -1 : 1;
      const whole = m[2] || '';
      const frac = m[3] !== undefined ? m[3] : (m[4] || '');
      const exp = Number(m[5] || 0);
      this.s = sign;
      this.c = BigInt((whole + frac || '0').replace(/^0+(?=\d)/, '') || '0');
      this.e = exp - frac.length;
      return this._norm();
    }

    _norm() {
      if (this.c === 0n) { this.s = 1; this.e = 0; return this; }
      while (this.c % 10n === 0n) { this.c /= 10n; this.e++; }
      return this;
    }

    clone() { return new BigDecimal(this); }
    neg() { const x = this.clone(); x.s *= -1; return x; }
    abs() { const x = this.clone(); x.s = 1; return x; }
    isZero() { return this.c === 0n; }

    add(other) {
      other = new BigDecimal(other);
      if (this.isZero()) return other.clone();
      if (other.isZero()) return this.clone();
      const e = Math.min(this.e, other.e);
      const a = BigInt(this.s) * this.c * 10n ** BigInt(this.e - e);
      const b = BigInt(other.s) * other.c * 10n ** BigInt(other.e - e);
      const n = a + b;
      if (n === 0n) return new BigDecimal(0);
      const x = new BigDecimal(0);
      x.s = n < 0n ? -1 : 1; x.c = n < 0n ? -n : n; x.e = e;
      return x._norm();
    }

    sub(other) { return this.add(new BigDecimal(other).neg()); }

    mul(other) {
      other = new BigDecimal(other);
      const x = new BigDecimal(0);
      x.s = this.s * other.s;
      x.c = this.c * other.c;
      x.e = this.e + other.e;
      return x._norm();
    }

    pow(n) {
      n = BigInt(n);
      if (n < 0n) return new BigDecimal(1).div(this.pow(-n));
      let a = this.clone(), r = new BigDecimal(1);
      while (n) { if (n & 1n) r = r.mul(a); n >>= 1n; if (n) a = a.mul(a); }
      return r;
    }

    div(other, precision = 40) {
      other = new BigDecimal(other);
      if (other.isZero()) throw new RangeError('ForgeBig: division by zero');
      const scale = BigInt(Math.max(0, precision));
      const numerator = this.c * 10n ** scale;
      const q = numerator / other.c;
      const x = new BigDecimal(0);
      x.s = this.s * other.s; x.c = q; x.e = this.e - other.e - Number(scale);
      return x._norm();
    }

    cmp(other) {
      other = new BigDecimal(other);
      if (this.s !== other.s) return this.s > other.s ? 1 : -1;
      const sign = this.s;
      if (this.c === 0n && other.c === 0n) return 0;
      const ae = this.e + this.c.toString().length;
      const be = other.e + other.c.toString().length;
      if (ae !== be) return sign * (ae > be ? 1 : -1);
      const e = Math.min(this.e, other.e);
      const a = this.c * 10n ** BigInt(this.e - e);
      const b = other.c * 10n ** BigInt(other.e - e);
      return sign * (a > b ? 1 : a < b ? -1 : 0);
    }

    toString() {
      if (this.c === 0n) return '0';
      const digits = this.c.toString();
      const point = digits.length + this.e;
      let body;
      if (point <= 0) body = '0.' + '0'.repeat(-point) + digits;
      else if (point >= digits.length) body = digits + '0'.repeat(point - digits.length);
      else body = digits.slice(0, point) + '.' + digits.slice(point);
      return this.s < 0 ? '-' + body : body;
    }

    sci(sig = 12) {
      if (this.c === 0n) return '0';
      const d = this.c.toString();
      const exponent = this.e + d.length - 1;
      const take = Math.max(1, Math.min(sig, d.length));
      let mantissa = d.slice(0, take);
      if (take > 1) mantissa = mantissa[0] + '.' + mantissa.slice(1);
      return `${this.s < 0 ? '-' : ''}${mantissa}e${exponent >= 0 ? '+' : ''}${exponent}`;
    }

    valueOf() {
      const n = Number(this.s) * Number(this.c);
      return n * 10 ** this.e;
    }

    toJSON() { return this.sci(18); }
  }

  const ForgeBig = {
    version: '1.0.0',
    engine: 'BigInt-backed Decimal',
    limits: { integerDigits: 'arbitrary', exponent: 'arbitrary JS-safe integer' },
    Decimal: BigDecimal,
    d: v => new BigDecimal(v),
    add: (a,b) => new BigDecimal(a).add(b),
    sub: (a,b) => new BigDecimal(a).sub(b),
    mul: (a,b) => new BigDecimal(a).mul(b),
    div: (a,b,p=40) => new BigDecimal(a).div(b,p),
    pow: (a,n) => new BigDecimal(a).pow(n),
    format: (v, sig=12) => new BigDecimal(v).sci(sig),
    exact: v => new BigDecimal(v).toString(),
    test() {
      const x = new BigDecimal('9.999e1000');
      const y = x.mul('2');
      return { ok: y.sci() === '1.9998e+1001', value: y.sci(), exactPrefix: y.toString().slice(0, 24) };
    },
    wasm: {
      available: typeof WebAssembly !== 'undefined',
      note: 'WASM can be attached as an accelerator; Decimal remains the portable exact engine.'
    }
  };

  globalThis.ForgeBig = ForgeBig;

  const CF = globalThis.CookieForge;
  if (CF) {
    CF.big = ForgeBig;
    CF.features = CF.features || {};
    CF.features.forgeBig = true;
    console.info('[Cookie Forge] Forge Big engine attached:', ForgeBig.version);
  }

  if (previous && previous !== ForgeBig) {
    ForgeBig.previous = previous;
  }
})();
