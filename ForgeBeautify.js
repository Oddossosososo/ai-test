(() => {
  'use strict';

  /* ============================================================
     COOKIE FORGE — BEAUTIFY LAYER
     Human-readable formatting for ForgeBig values.
     Native Number values are beautified with Cookie Clicker's
     own Beautify() when possible; arbitrary magnitudes use the
     ForgeBig decimal engine without ever becoming Infinity.
     ============================================================ */

  const ForgeBig = window.ForgeBig;

  if (!ForgeBig) {
    console.warn('[ForgeBeautify] ForgeBig is not loaded yet.');
    return;
  }

  function beautify(value, sig = 6) {
    const big = value instanceof ForgeBig.Decimal
      ? value
      : new ForgeBig.Decimal(value);

    if (big.isZero()) return '0';

    // Stay native for values Cookie Clicker can safely format.
    if (big.fitsNative() && typeof window.Beautify === 'function') {
      try {
        return window.Beautify(big.nativeValue());
      } catch {}
    }

    // ForgeBig handles 1e309, 1e1000000, etc. without Infinity.
    return big.sci(sig);
  }

  function installIntoForge() {
    const CF = window.CookieForge;
    if (!CF) return false;

    CF.big = CF.big || ForgeBig;
    CF.big.beautify = beautify;
    CF.features = CF.features || {};
    CF.features.beautify = true;

    // Replace Forge's display formatter when available.
    // The original formatter remains the fallback for anything
    // that is not a numeric ForgeBig value.
    const original = window.CookieForgeFormatHuge;
    if (!original) window.CookieForgeFormatHuge = beautify;

    return true;
  }

  window.ForgeBeautify = {
    version: '1.0.0',
    format: beautify,
    install: installIntoForge,
    test() {
      const tests = [
        ['1e308', 'native boundary'],
        ['1e309', 'past Number.MAX_VALUE'],
        ['1e1000', 'very large'],
        ['1e1000000', 'million-digit exponent']
      ];

      return tests.map(([input, label]) => ({
        label,
        input,
        output: beautify(input)
      }));
    }
  };

  installIntoForge();

  console.info('[Cookie Forge] Beautify layer online');
})();
