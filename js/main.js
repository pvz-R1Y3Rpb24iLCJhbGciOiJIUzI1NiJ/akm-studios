/* =====================================================================
   AKM Studios — сайт-визитка
   Видео без звука. Ниже — настройки ссылок для заказчика.
   ===================================================================== */

/* ---------- НАСТРОЙКИ ДЛЯ ЗАКАЗЧИКА ----------
   Впишите ссылки — кнопки с пустой ссылкой на сайте не показываются. */
const AKM_CONFIG = {
  instagram: 'https://www.instagram.com/akm__studios/',
  telegram: '',   // пока неактивен; например 'https://t.me/akmstudios'
  vk: '',         // пока неактивен; например 'https://vk.com/akmstudios'
  mail: '',       // например 'mailto:hello@akmstudios.ru'
};

(() => {
  /* ссылки на контакты */
  document.querySelectorAll('[data-contact]').forEach(a => {
    const url = AKM_CONFIG[a.dataset.contact];
    if (url) { a.href = url; if (/^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener'; } }
    else a.remove(); // ссылки нет — кнопку не показываем
  });

  /* фоновое видео: на телефоне лёгкая версия.
     В однофайловой сборке видео лежит внутри страницы (window.AKM_MEDIA) и превращается в blob-ссылку. */
  const media = src => {
    if (!src || !src.startsWith('#m:') || !window.AKM_MEDIA) return src;
    const bin = atob(window.AKM_MEDIA[src.slice(3)]), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([u8], { type: 'video/mp4' }));
  };
  const card = document.querySelector('.card');
  const v = document.querySelector('.bg');
  if (!v || !card) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { card.classList.add('no-intro', 'go'); return; } // остаётся постер
  v.src = media(innerWidth < 760 ? v.dataset.srcMobile : v.dataset.srcDesktop);
  const p = v.play(); if (p && p.catch) p.catch(() => {});
  document.addEventListener('visibilitychange', () => { if (document.hidden) v.pause(); else v.play().catch(() => {}); });

  /* ---------- интро: пролёт камеры внутрь буквы K ----------
     Запускается от первого колёсика/касания/клавиши/клика, а без них — сам через 3 секунды. */
  const intro = card.querySelector('.intro');
  const img = intro && intro.querySelector('.intro-mask img');
  let flown = false;
  const fly = () => {
    if (flown || !img) return;
    flown = true;
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => removeEventListener(ev, fly));
    intro.querySelectorAll('.intro-en, .intro-cue').forEach(el => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }));
    img.animate([{ transform: 'scale(1)' }, { transform: 'scale(70)' }], { duration: 1500, easing: 'cubic-bezier(.7, 0, .84, 0)', fill: 'forwards' });
    intro.querySelector('.intro-mask').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, delay: 1250, fill: 'forwards' });
    setTimeout(() => card.classList.add('go'), 1350);
  };
  if (intro) {
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, fly, { passive: true }));
    setTimeout(fly, 3000);
  } else card.classList.add('go');

  /* ---------- ИИ-строка: параметры меняются вместе с планами ролика ----------
     Луп card.mp4 = 4 плана; смены (середины наплывов) на 2.8, 5.0 и 7.2 с. */
  const SHOTS = [
    { t: 0, name: 'Павильон «Северный полюс»', seed: 48213907, iter: 186, takes: 64 },
    { t: 2.8, name: 'Машина земной оси', seed: 73920184, iter: 214, takes: 41 },
    { t: 5.0, name: 'Кит подо льдом', seed: 15887302, iter: 162, takes: 37 },
    { t: 7.2, name: 'Туман, белый как медведь', seed: 90461178, iter: 248, takes: 52 },
  ];
  const el = k => card.querySelector(`[data-ai="${k}"]`);
  const nEl = el('n'), nameEl = el('name'), seedEl = el('seed'), iterEl = el('iter'), takesEl = el('takes');
  let shot = 0;
  const countUp = (node, to, ms = 900) => {
    const t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3); node.textContent = String(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const show = i => {
    const s = SHOTS[i];
    nEl.textContent = '0' + (i + 1);
    nameEl.style.opacity = 0;
    setTimeout(() => { nameEl.textContent = s.name; nameEl.style.opacity = 1; }, 250);
    seedEl.textContent = s.seed;
    countUp(iterEl, s.iter); countUp(takesEl, s.takes, 700);
  };
  if (nEl) {
    const watch = () => {
      const t = v.currentTime || 0;
      let i = 0; SHOTS.forEach((s, k) => { if (t >= s.t) i = k; });
      if (i !== shot) { shot = i; show(i); }
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  }
})();
