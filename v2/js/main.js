/* =====================================================================
   AKM Studios — версия 2. Видео без звука. Ниже — настройки ссылок.
   ===================================================================== */

/* ---------- НАСТРОЙКИ ДЛЯ ЗАКАЗЧИКА ----------
   Почта и ВКонтакте пока заглушки: кнопки видны, но не кликаются.
   Остальные кнопки с пустой ссылкой на сайте не показываются. */
const AKM_CONFIG = {
  instagram: 'https://www.instagram.com/akm__studios/',
  telegram: '',   // пока неактивен
  vk: '',         // заглушка
  mail: '',       // заглушка, главная кнопка; например 'mailto:hello@akmstudios.ru'
};

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* контакты */
  $$('[data-contact]').forEach(a => {
    const url = AKM_CONFIG[a.dataset.contact];
    if (url) {
      a.href = url;
      if (/^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener'; }
      const addr = $('[data-mail-addr]', a); if (addr) addr.textContent = url.replace(/^mailto:/, '');
    } else if ('placeholder' in a.dataset) { a.setAttribute('aria-disabled', 'true'); a.addEventListener('click', e => e.preventDefault()); }
    else a.remove();
  });

  /* шоурил: на телефоне лёгкая версия; в однофайловой сборке видео лежит в window.AKM_MEDIA */
  const media = src => {
    if (!src || !src.startsWith('#m:') || !window.AKM_MEDIA) return src;
    const bin = atob(window.AKM_MEDIA[src.slice(3)]), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([u8], { type: 'video/mp4' }));
  };
  const reel = $('.reel-video');
  if (reel && !reduced) {
    reel.src = media(innerWidth < 760 ? reel.dataset.srcMobile : reel.dataset.srcDesktop);
    reel.play().catch(() => {});
    new IntersectionObserver(([e]) => { e.isIntersecting ? reel.play().catch(() => {}) : reel.pause(); }).observe(reel);
    // подпись текущего плана шоурила
    const SHOTS = [[0, 'Закат над тропой'], [2.62, 'Гора-медведь'], [6.28, 'Маковое поле'], [8.82, 'Туман, белый как медведь']];
    const cap = $('[data-reel-shot]'); let cur = 0;
    const tick = () => {
      const t = reel.currentTime || 0; let i = 0;
      SHOTS.forEach(([s], k) => { if (t >= s) i = k; });
      if (i !== cur) { cur = i; cap.style.opacity = 0; setTimeout(() => { cap.textContent = SHOTS[i][1]; cap.style.opacity = 1; }, 300); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* шапка получает линию при прокрутке */
  const top = $('.top');
  addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 10), { passive: true });

  /* появление блоков */
  const targets = [...$$('.sec-head, .frame, .pillars li, .steps li, .services, .contact-title, .contact-row, .foot-logo'), $('.venn')];
  if (!reduced) {
    targets.forEach(el => el && !el.classList.contains('venn') && el.classList.add('reveal'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { threshold: .2 });
    targets.forEach(el => el && io.observe(el));
  } else targets.forEach(el => el && el.classList.add('on'));

  /* плёнку можно тянуть мышью */
  const strip = $('.strip');
  if (strip) {
    let down = false, x0 = 0, s0 = 0;
    strip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; x0 = e.clientX; s0 = strip.scrollLeft; strip.classList.add('drag'); });
    addEventListener('pointerup', () => { down = false; strip.classList.remove('drag'); });
    addEventListener('pointermove', e => { if (down) strip.scrollLeft = s0 - (e.clientX - x0); });
  }
})();
