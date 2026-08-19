/*
 * COOKIE FORGE — FORGE BIG ENGINE 2.0
 * Arbitrary-magnitude decimal arithmetic.
 *
 * IMPORTANT: the stored coefficient AND exponent are BigInt.
 * No Number conversion is used for the Forge balance itself.
 * Number is only used by the optional nativeValue() bridge when
 * vanilla Cookie Clicker needs a native JS Number.
 */
(() => {
  'use strict';

  class BigDecimal {
    constructor(value = 0, exponent = null) {
      if (value instanceof BigDecimal) {
        this.s = value.s;
        this.c = value.c;
        this.e = value.e;
        return this;
      }
      if (exponent !== null) {
        this.s = value < 0 ? -1 : 1;
        this.c = BigInt(Math.abs(value));
        this.e = BigInt(exponent);
        return this._norm();
      }
      return this._parse(value);
    }

    _parse(v) {
      if (typeof v === 'bigint') {
        this.s = v < 0n ? -1 : 1;
        this.c = v < 0n ? -v : v;
        this.e = 0n;
        return this._norm();
      }
      if (typeof v === 'number') {
        if (!Number.isFinite(v)) throw new RangeError('ForgeBig: non-finite Number rejected');
        v = String(v);
      }
      v = String(v).trim().replace(/,/g, '');
      if (!v) throw new TypeError('ForgeBig: empty value');

      const m = v.match(/^([+-])?(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i);
      if (!m) throw new TypeError(`ForgeBig: invalid decimal: ${v}`);

      const sign = m[1] === '-' ? -1 : 1;
      const whole = m[2] || '';
      const frac = m[3] !== undefined ? m[3] : (m[4] || '');
      const exp = BigInt(m[5] || '0');

      this.s = sign;
      this.c = BigInt((whole + frac || '0').replace(/^0+(?=\d)/, '') || '0');
      this.e = exp - BigInt(frac.length);
      return this._norm();
    }

    _norm() {
      if (this.c === 0n) {
        this.s = 1;
        this.e = 0n;
        return this;
      }
      while (this.c % 10n === 0n) {
        this.c /= 10n;
        this.e += 1n;
      }
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

      const e = this.e < other.e ? this.e : other.e;
      const a = BigInt(this.s) * this.c * 10n ** (this.e - e);
      const b = BigInt(other.s) * other.c * 10n ** (other.e - e);
      const n = a + b;
      if (n === 0n) return new BigDecimal(0);

      const x = new BigDecimal(0);
      x.s = n < 0n ? -1 : 1;
      x.c = n < 0n ? -n : n;
      x.e = e;
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
      let a = this.clone();
      let r = new BigDecimal(1);
      while (n > 0n) {
        if (n & 1n) r = r.mul(a);
        n >>= 1n;
        if (n) a = a.mul(a);
      }
      return r;
    }

    div(other, precision = 40) {
      other = new BigDecimal(other);
      if (other.isZero()) throw new RangeError('ForgeBig: division by zero');
      const scale = BigInt(precision);
      const q = (this.c * 10n ** scale) / other.c;
      const x = new BigDecimal(0);
      x.s = this.s * other.s;
      x.c = q;
      x.e = this.e - other.e - scale;
      return x._norm();
    }

    cmp(other) {
      other = new BigDecimal(other);
      if (this.s !== other.s) return this.s > other.s ? 1 : -1;
      if (this.c === 0n && other.c === 0n) return 0;

      const sign = this.s;
      const ae = this.e + BigInt(this.c.toString().length);
      const be = other.e + BigInt(other.c.toString().length);
      if (ae !== be) return sign * (ae > be ? 1 : -1);

      const e = this.e < other.e ? this.e : other.e;
      const a = this.c * 10n ** (this.e - e);
      const b = other.c * 10n ** (other.e - e);
      return sign * (a > b ? 1 : a < b ? -1 : 0);
    }

    toString() {
      if (this.c === 0n) return '0';
      const digits = this.c.toString();
      const point = BigInt(digits.length) + this.e;

      let body;
      if (point <= 0n) {
        body = '0.' + '0'.repeat(Number(-point)) + digits;
      } else if (point >= BigInt(digits.length)) {
        body = digits + '0'.repeat(Number(point - BigInt(digits.length)));
      } else {
        const p = Number(point);
        body = digits.slice(0, p) + '.' + digits.slice(p);
      }
      return this.s < 0 ? '-' + body : body;
    }

    sci(sig = 12) {
      if (this.c === 0n) return '0';
      const d = this.c.toString();
      const exponent = this.e + BigInt(d.length - 1);
      const take = Math.max(1, Math.min(Number(sig), d.length));
      let mantissa = d.slice(0, take);
      if (take > 1) mantissa = mantissa[0] + '.' + mantissa.slice(1);
      return `${this.s < 0 ? '-' : ''}${mantissa}e${exponent >= 0n ? '+' : ''}${exponent}`;
    }

    /* Explicitly named boundary conversion. Never use for Forge storage. */
    nativeValue() {
      const exponent = this.e + BigInt(this.c.toString().length - 1);
      if (exponent > 308n) return this.s < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
      const n = Number(this.s) * Number(this.c) * 10 ** Number(this.e);
      return Number.isFinite(n) ? n : (this.s < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE);
    }

    valueOf() {
      return this.nativeValue();
    }

    toJSON() { return this.sci(18); }
  }

  const ForgeBig = {
    version: '2.0.0',
    engine: 'BigInt coefficient + BigInt exponent',
    limits: { coefficient: 'arbitrary', exponent: 'arbitrary BigInt' },
    Decimal: BigDecimal,
    d: v => new BigDecimal(v),
    add: (a,b) => new BigDecimal(a).add(b),
    sub: (a,b) => new BigDecimal(a).sub(b),
    mul: (a,b) => new BigDecimal(a).mul(b),
    div: (a,b,p=40) => new BigDecimal(a).div(b,p),
    pow: (a,n) => new BigDecimal(a).pow(n),
    format: (v, sig=12) => new BigDecimal(v).sci(sig),
    exact: v => new BigDecimal(v).toString(),
    native: v => new BigDecimal(v).nativeValue(),
    test() {
      const a = new BigDecimal('1e309');
      const b = new BigDecimal('1e1000000');
      const c = b.mul('2');
      return {
        ok: a.sci() === '1e+309' && c.sci() === '2e+1000000',
        a: a.sci(),
        b: b.sci(),
        c: c.sci(),
        nativeBoundary: a.nativeValue() === Number.MAX_VALUE
      };
    },
    wasm: {
      available: typeof WebAssembly !== 'undefined',
      note: 'Optional accelerator; BigInt Decimal remains the portable exact engine.'
    }
  };

  globalThis.ForgeBig = ForgeBig;

  const CF = globalThis.CookieForge;
  if (CF) {
    CF.big = ForgeBig;
    CF.features = CF.features || {};
    CF.features.forgeBig = true;
    console.info('[Cookie Forge] Forge Big 2.0 attached — Number is no longer the Forge storage type.');
  }
})();
