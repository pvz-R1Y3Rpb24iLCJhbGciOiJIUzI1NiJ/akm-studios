/* =====================================================================
   AKM Studios — сайт-визитка
   Видео без звука. Ниже — настройки ссылок для заказчика.
   ===================================================================== */

/* ---------- НАСТРОЙКИ ДЛЯ ЗАКАЗЧИКА ----------
   Впишите ссылки — пустые кнопки на сайте не кликаются. */
const AKM_CONFIG = {
  telegram: '',   // например 'https://t.me/akmstudios'
  vk: '',         // например 'https://vk.com/akmstudios'
  mail: '',       // например 'mailto:hello@akmstudios.ru'
};

(() => {
  /* ссылки на контакты */
  document.querySelectorAll('[data-contact]').forEach(a => {
    const url = AKM_CONFIG[a.dataset.contact];
    if (url) { a.href = url; if (/^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener'; } }
    else { a.setAttribute('aria-disabled', 'true'); a.addEventListener('click', e => e.preventDefault()); }
  });

  /* фоновое видео: на телефоне лёгкая версия.
     В однофайловой сборке видео лежит внутри страницы (window.AKM_MEDIA) и превращается в blob-ссылку. */
  const media = src => {
    if (!src || !src.startsWith('#m:') || !window.AKM_MEDIA) return src;
    const bin = atob(window.AKM_MEDIA[src.slice(3)]), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([u8], { type: 'video/mp4' }));
  };
  const v = document.querySelector('.bg');
  if (!v) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; // остаётся постер
  v.src = media(innerWidth < 760 ? v.dataset.srcMobile : v.dataset.srcDesktop);
  const p = v.play(); if (p && p.catch) p.catch(() => {});
  document.addEventListener('visibilitychange', () => { if (document.hidden) v.pause(); else v.play().catch(() => {}); });
})();
