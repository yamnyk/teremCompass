export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isStandalone =
  matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const ua = navigator.userAgent;
export const isIOS =
  /iPhone|iPad|iPod/.test(ua) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = /Android/.test(ua);
