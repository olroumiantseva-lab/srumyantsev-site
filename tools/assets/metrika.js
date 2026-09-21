(() => {
  'use strict';

  const METRIKA_ID = 111385663;

  if (typeof window.ym !== 'function') {
    window.ym = function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + METRIKA_ID;
    document.head.appendChild(script);
    window.ym(METRIKA_ID, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
    });
  }

  window.dedTrack = (goal, params = {}) => {
    if (!goal || typeof window.ym !== 'function') return;
    window.ym(METRIKA_ID, 'reachGoal', goal, params);
  };
})();