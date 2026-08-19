/*
 * COOKIE FORGE — FORGE BIG ENGINE 3.1
 * Arbitrary-magnitude decimal arithmetic for Forge.
 * Exact BigInt coefficient + BigInt exponent storage.
 */
(() => {
  'use strict';

  class BigDecimal {
    constructor(value = 0, exponent = null) {
      if (value instanceof BigDecimal) {
        this.s = value.s; this.c = value.c; this.e = value.e; return this;
      }
      if (exponent !== null) {
        const raw = String(value).trim();
        this.s = raw.startsWith('-') ? -1 : 1;
        this.c = BigInt(raw.replace(/^[+-]/, '').replace(/\D/g, '') || '0');
        this.e = BigInt(exponent);
        return this._norm();
      }
      return this._parse(value);
    }

    _parse(v) {
      if (typeof v === 'bigint') {
        this.s = v < 0n ? -1 : 1; this.c = v < 0n ? -v : v; this.e = 0n;
        return this._norm();
      }
      if (v instanceof BigDecimal) {
        this.s = v.s; this.c = v.c; this.e = v.e; return this;
      }
      if (typeof v === 'number') {
        if (!Number.isFinite(v)) throw new RangeError('ForgeBig: use a string for non-finite magnitude.');
        v = String(v);
      }
      v = String(v).trim().replace(/,/g, '');
      if (!v) throw new TypeError('ForgeBig: empty value');
      const m = v.match(/^([+-])?(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i);
      if (!m) throw new TypeError(`ForgeBig: invalid decimal: ${v}`);
      const whole = m[2] || '';
      const frac = m[3] !== undefined ? m[3] : (m[4] || '');
      const digits = (whole + frac).replace(/^0+(?=\d)/, '') || '0';
      this.s = m[1] === '-' ? -1 : 1;
      this.c = BigInt(digits);
      this.e = BigInt(m[5] || '0') - BigInt(frac.length);
      return this._norm();
    }

    _norm() {
      if (this.c === 0n) { this.s = 1; this.e = 0n; return this; }
      while (this.c % 10n === 0n) { this.c /= 10n; this.e++; }
      return this;
    }
    clone() { return new BigDecimal(this); }
    neg() { const x = this.clone(); x.s *= -1; return x; }
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
      x.s = n < 0n ? -1 : 1; x.c = n < 0n ? -n : n; x.e = e;
      return x._norm();
    }
    sub(other) { return this.add(new BigDecimal(other).neg()); }
    mul(other) {
      other = new BigDecimal(other);
      const x = new BigDecimal(0);
      x.s = this.s * other.s; x.c = this.c * other.c; x.e = this.e + other.e;
      return x._norm();
    }
    div(other, precision = 40) {
      other = new BigDecimal(other);
      if (other.isZero()) throw new RangeError('ForgeBig: division by zero');
      const scale = BigInt(precision);
      const x = new BigDecimal(0);
      x.s = this.s * other.s;
      x.c = (this.c * 10n ** scale) / other.c;
      x.e = this.e - other.e - scale;
      return x._norm();
    }
    cmp(other) {
      other = new BigDecimal(other);
      if (this.s !== other.s) return this.s > other.s ? 1 : -1;
      if (this.c === 0n && other.c === 0n) return 0;
      const sign = this.s;
      const ae = this.e + BigInt(this.c.toString().length - 1);
      const be = other.e + BigInt(other.c.toString().length - 1);
      if (ae !== be) return sign * (ae > be ? 1 : -1);
      const e = this.e < other.e ? this.e : other.e;
      const a = this.c * 10n ** (this.e - e);
      const b = other.c * 10n ** (other.e - e);
      return sign * (a > b ? 1 : a < b ? -1 : 0);
    }
    sci(sig = 12) {
      if (this.c === 0n) return '0e+0';
      const d = this.c.toString();
      const exponent = this.e + BigInt(d.length - 1);
      const take = Math.max(1, Math.min(Number(sig), d.length));
      let m = d.slice(0, take);
      if (take > 1) m = m[0] + '.' + m.slice(1);
      return `${this.s < 0 ? '-' : ''}${m}e${exponent >= 0n ? '+' : ''}${exponent}`;
    }
    toString() {
      if (this.c === 0n) return '0';
      const d = this.c.toString();
      const point = BigInt(d.length) + this.e;
      let body;
      if (point <= 0n) {
        const n = Number(-point);
        body = n > 1000000 ? `0.${d}e${point}` : '0.' + '0'.repeat(n) + d;
      } else if (point >= BigInt(d.length)) {
        const n = point - BigInt(d.length);
        body = n > 1000000 ? `${d}e+${n + BigInt(d.length - 1)}` : d + '0'.repeat(Number(n));
      } else {
        const p = Number(point); body = d.slice(0, p) + '.' + d.slice(p);
      }
      return this.s < 0 ? '-' + body : body;
    }
    nativeValue() {
      const exponent = this.e + BigInt(this.c.toString().length - 1);
      if (exponent > 308n) return this.s < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
      const n = Number(this.s) * Number(this.c) * 10 ** Number(this.e);
      return Number.isFinite(n) ? n : (this.s < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE);
    }
    fitsNative() {
      const exponent = this.e + BigInt(this.c.toString().length - 1);
      return exponent <= 308n && Number.isFinite(this.nativeValue());
    }
    valueOf() { return this.nativeValue(); }
    toJSON() { return this.sci(18); }
  }

  const ForgeBig = {
    version: '3.1.0',
    engine: 'BigInt coefficient + BigInt exponent',
    limits: { coefficient: 'arbitrary', exponent: 'arbitrary BigInt' },
    Decimal: BigDecimal,

    d: v => new BigDecimal(v),
    parse: v => new BigDecimal(v),
    add: (a,b) => new BigDecimal(a).add(b),
    sub: (a,b) => new BigDecimal(a).sub(b),
    mul: (a,b) => new BigDecimal(a).mul(b),
    div: (a,b,p=40) => new BigDecimal(a).div(b,p),
    format: (v,sig=12) => new BigDecimal(v).sci(sig),
    scientific: (v,sig=18) => new BigDecimal(v).sci(sig),
    toScientific: (v,sig=18) => new BigDecimal(v).sci(sig),
    exact: v => new BigDecimal(v).toString(),
    native: v => new BigDecimal(v).nativeValue(),
    fitsNative: v => new BigDecimal(v).fitsNative(),
    compare: (a,b) => new BigDecimal(a).cmp(b),

    balance: new BigDecimal(0),
    setBalance(v) { this.balance = new BigDecimal(v); return this.balance.clone(); },
    addBalance(v) { this.balance = this.balance.add(v); return this.balance.clone(); },
    subBalance(v) { this.balance = this.balance.sub(v); return this.balance.clone(); },
    getBalance() { return this.balance.clone(); },

    syncToGame() {
      const game = globalThis.Game;
      if (!game) throw new Error('ForgeBig: Cookie Clicker Game object not found.');
      if (!this.balance.fitsNative()) return { ok:false, reason:'vanilla-number-limit', exact:this.balance.sci(18), nativeLimit:Number.MAX_VALUE };
      game.cookies = this.balance.nativeValue();
      if ('cookiesEarned' in game) game.cookiesEarned = Math.max(game.cookiesEarned || 0, game.cookies);
      game.recalculateGains?.();
      return { ok:true, value:game.cookies };
    },

    test() {
      const a = new BigDecimal('1e309'), b = new BigDecimal('1e1000000'), c = b.mul('2');
      return { ok:a.sci()==='1e+309' && c.sci()==='2e+1000000', a:a.sci(), b:b.sci(), c:c.sci(), nativeBoundary:a.nativeValue()===Number.MAX_VALUE };
    }
  };

  globalThis.ForgeBig = ForgeBig;
  const CF = globalThis.CookieForge;
  if (CF) {
    CF.big = ForgeBig;
    CF.features = CF.features || {};
    CF.features.forgeBig = true;
    CF.features.arbitraryMagnitude = true;
  }
  console.info('[Cookie Forge] ForgeBig 3.1.0 ready');
})();
