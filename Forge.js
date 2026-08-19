(() => {
  'use strict';

  /* Cookie Forge hosted build
     Loaded through Cookie Clicker's Game.LoadMod(). */

  const CF = window.CookieForge = window.CookieForge || {};

  // Wait briefly if Cookie Clicker's Game object has not initialized yet.
  if (!window.Game) {
    console.warn('[Cookie Forge] Game object not ready; retrying...');
    let tries = 0;
    const timer = setInterval(() => {
      if (window.Game) {
        clearInterval(timer);
        CF.boot?.();
      } else if (++tries >= 100) {
        clearInterval(timer);
        console.error('[Cookie Forge] Cookie Clicker Game object not found.');
      }
    }, 100);
    return;
  }

  CF.boot?.();
})();
