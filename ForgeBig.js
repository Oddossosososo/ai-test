/* ============================================================
   COOKIE FORGE BIG 6.0
   Immediate + Game.LoadMod-compatible arbitrary magnitude engine.
   ============================================================ */

(() => {
    'use strict';

    const MOD_ID = 'Cookie Forge Big';

    class BigDecimal {
        constructor(value = 0, exponent = null) {
            if (value instanceof BigDecimal) {
                this.s = value.s;
                this.c = value.c;
                this.e = value.e;
                return this;
            }

            if (exponent !== null) {
                const raw = String(value).trim();
                this.s = raw.startsWith('-') ? -1 : 1;
                this.c = BigInt(
                    raw.replace(/^[+-]/, '').replace(/\D/g, '') || '0'
                );
                this.e = BigInt(exponent);
                return this.normalize();
            }

            return this.parse(value);
        }

        parse(value) {
            if (typeof value === 'bigint') {
                this.s = value < 0n ? -1 : 1;
                this.c = value < 0n ? -value : value;
                this.e = 0n;
                return this.normalize();
            }

            if (typeof value === 'number') {
                if (!Number.isFinite(value)) {
                    throw new RangeError(
                        'ForgeBig: use a string for values beyond Number range.'
                    );
                }
                value = String(value);
            }

            value = String(value).trim().replace(/,/g, '');

            const match = value.match(
                /^([+-])?(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i
            );

            if (!match) {
                throw new TypeError(`ForgeBig: invalid number: ${value}`);
            }

            const whole = match[2] || '';
            const fraction =
                match[3] !== undefined ? match[3] : match[4] || '';

            const digits =
                (whole + fraction).replace(/^0+(?=\d)/, '') || '0';

            this.s = match[1] === '-' ? -1 : 1;
            this.c = BigInt(digits);
            this.e = BigInt(match[5] || '0') - BigInt(fraction.length);

            return this.normalize();
        }

        normalize() {
            if (this.c === 0n) {
                this.s = 1;
                this.e = 0n;
                return this;
            }

            while (this.c % 10n === 0n) {
                this.c /= 10n;
                this.e++;
            }

            return this;
        }

        clone() {
            return new BigDecimal(this);
        }

        neg() {
            const result = this.clone();
            result.s *= -1;
            return result;
        }

        isZero() {
            return this.c === 0n;
        }

        add(other) {
            other = new BigDecimal(other);

            if (this.isZero()) return other.clone();
            if (other.isZero()) return this.clone();

            const exponent = this.e < other.e ? this.e : other.e;
            const a = BigInt(this.s) * this.c * 10n ** (this.e - exponent);
            const b = BigInt(other.s) * other.c * 10n ** (other.e - exponent);
            const value = a + b;

            if (value === 0n) return new BigDecimal(0);

            const result = new BigDecimal(0);
            result.s = value < 0n ? -1 : 1;
            result.c = value < 0n ? -value : value;
            result.e = exponent;
            return result.normalize();
        }

        sub(other) {
            return this.add(new BigDecimal(other).neg());
        }

        mul(other) {
            other = new BigDecimal(other);
            const result = new BigDecimal(0);
            result.s = this.s * other.s;
            result.c = this.c * other.c;
            result.e = this.e + other.e;
            return result.normalize();
        }

        div(other, precision = 40) {
            other = new BigDecimal(other);

            if (other.isZero()) {
                throw new RangeError('ForgeBig: division by zero.');
            }

            const scale = BigInt(precision);
            const result = new BigDecimal(0);
            result.s = this.s * other.s;
            result.c = (this.c * 10n ** scale) / other.c;
            result.e = this.e - other.e - scale;
            return result.normalize();
        }

        scientific(significant = 12) {
            if (this.c === 0n) return '0e+0';

            const digits = this.c.toString();
            const exponent = this.e + BigInt(digits.length - 1);
            const count = Math.max(1, Math.min(significant, digits.length));

            let mantissa = digits.slice(0, count);
            if (count > 1) {
                mantissa = mantissa[0] + '.' + mantissa.slice(1);
            }

            return (
                (this.s < 0 ? '-' : '') +
                mantissa +
                'e' +
                (exponent >= 0n ? '+' : '') +
                exponent
            );
        }

        nativeValue() {
            const exponent = this.e + BigInt(this.c.toString().length - 1);

            if (exponent > 308n) {
                return this.s < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
            }

            const value =
                Number(this.s) * Number(this.c) * 10 ** Number(this.e);

            return Number.isFinite(value)
                ? value
                : this.s < 0
                    ? -Number.MAX_VALUE
                    : Number.MAX_VALUE;
        }

        fitsNative() {
            const exponent = this.e + BigInt(this.c.toString().length - 1);
            return exponent <= 308n;
        }

        toString() {
            return this.scientific(18);
        }

        toJSON() {
            return this.toString();
        }
    }

    function beautify(value, places = 12) {
        if (value instanceof BigDecimal) {
            if (value.fitsNative() && typeof window.Beautify === 'function') {
                try {
                    return window.Beautify(value.nativeValue());
                } catch {}
            }
            return value.scientific(places);
        }

        if (value === Infinity) return '∞';
        if (value === -Infinity) return '-∞';

        try {
            return beautify(new BigDecimal(value), places);
        } catch {
            return String(value);
        }
    }

    const ForgeBig = {
        version: '6.0.0',
        engine: 'BigInt coefficient + BigInt exponent',
        Decimal: BigDecimal,
        booted: false,

        d: value => new BigDecimal(value),
        parse: value => new BigDecimal(value),
        add: (a, b) => new BigDecimal(a).add(b),
        sub: (a, b) => new BigDecimal(a).sub(b),
        mul: (a, b) => new BigDecimal(a).mul(b),
        div: (a, b, precision = 40) => new BigDecimal(a).div(b, precision),
        format: beautify,
        beautify,
        scientific: (value, places = 18) => new BigDecimal(value).scientific(places),
        exact: value => new BigDecimal(value).toString(),
        native: value => new BigDecimal(value).nativeValue(),
        fitsNative: value => new BigDecimal(value).fitsNative(),

        compare(a, b) {
            const x = new BigDecimal(a);
            const y = new BigDecimal(b);

            if (x.s !== y.s) return x.s > y.s ? 1 : -1;

            const ax = x.e + BigInt(x.c.toString().length - 1);
            const ay = y.e + BigInt(y.c.toString().length - 1);

            if (ax !== ay) return x.s * (ax > ay ? 1 : -1);

            const exponent = x.e < y.e ? x.e : y.e;
            const av = x.c * 10n ** (x.e - exponent);
            const bv = y.c * 10n ** (y.e - exponent);

            return x.s * (av > bv ? 1 : av < bv ? -1 : 0);
        },

        test() {
            const a = new BigDecimal('1e309');
            const b = new BigDecimal('1e1000000');
            const c = b.mul('2');

            return {
                ok:
                    a.scientific() === '1e+309' &&
                    c.scientific() === '2e+1000000',
                oneE309: a.scientific(),
                oneEMillion: b.scientific(),
                doubled: c.scientific(),
                nativeLimit: Number.MAX_VALUE
            };
        },

        destroy() {
            this.booted = false;
        }
    };

    /* ------------------------------------------------------------
       CRITICAL: expose + boot IMMEDIATELY.
       Do not wait for Game.LoadMod's mod callback.
       ------------------------------------------------------------ */

    window.ForgeBig = ForgeBig;

    function boot() {
        if (ForgeBig.booted) return;
        ForgeBig.booted = true;

        if (window.CookieForge) {
            window.CookieForge.big = ForgeBig;
            window.CookieForge.features = window.CookieForge.features || {};
            window.CookieForge.features.forgeBig = true;
            window.CookieForge.features.arbitraryMagnitude = true;
        }

        console.log(
            '%c[Cookie Forge Big] ONLINE',
            'color:#ff69b4;font-weight:bold;font-size:14px',
            ForgeBig.test()
        );

        if (typeof Game !== 'undefined' && typeof Game.Notify === 'function') {
            try {
                Game.Notify(
                    'COOKIE FORGE BIG',
                    'Arbitrary-magnitude number engine online.',
                    [16, 5]
                );
            } catch {}
        }
    }

    /* Boot now. */
    boot();

    /* Also register with Cookie Clicker for proper mod awareness. */
    if (
        typeof Game !== 'undefined' &&
        typeof Game.registerMod === 'function'
    ) {
        try {
            Game.registerMod(MOD_ID, {
                init: boot
            });
        } catch (error) {
            console.warn('[Cookie Forge Big] registerMod failed:', error);
        }
    }
})();
