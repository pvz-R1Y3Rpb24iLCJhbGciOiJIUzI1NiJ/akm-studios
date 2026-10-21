/* =====================================================================
   AKM Studios — интерактив сайта
   Звук на сайте отключён полностью: у всех видео нет аудиодорожек, все muted.
   ===================================================================== */

/* ---------- НАСТРОЙКИ ДЛЯ ЗАКАЗЧИКА ----------
   Впишите ссылки — пустые ссылки на сайте не кликаются.
   formEndpoint — адрес, куда отправлять заявку (POST, JSON). Пусто — форма только благодарит. */
const AKM_CONFIG = {
  telegram: '',      // например 'https://t.me/akmstudios'
  vk: '',            // например 'https://vk.com/akmstudios'
  mail: '',          // например 'mailto:hello@akmstudios.ru'
  youtube: '',       // например 'https://youtube.com/@akmstudios'
  formEndpoint: '',  // например 'https://formspree.io/f/xxxxxx'
};

(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobile = innerWidth < 860;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const hasGsap = !!window.gsap && !!window.ScrollTrigger;
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const play = v => { const p = v && v.play(); if (p && p.catch) p.catch(() => {}); };
  if (reduced || !hasGsap) document.documentElement.classList.add('reduced', 'no-intro');

  /* ---------- контакты из настроек ---------- */
  $$('[data-contact]').forEach(a => {
    const url = AKM_CONFIG[a.dataset.contact];
    if (url) { a.href = url; if (/^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener'; } }
    else { a.setAttribute('aria-disabled', 'true'); a.addEventListener('click', e => e.preventDefault()); }
  });

  /* ---------- видео: ленивая загрузка, пауза вне экрана ---------- */
  // в однофайловой версии видео лежат внутри страницы (window.AKM_MEDIA) и превращаются в blob-ссылки по запросу
  const blobs = {};
  const media = src => {
    if (!src || !src.startsWith('#m:') || !window.AKM_MEDIA) return src;
    const key = src.slice(3);
    if (!blobs[key]) { const bin = atob(window.AKM_MEDIA[key]), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); blobs[key] = URL.createObjectURL(new Blob([u8], { type: 'video/mp4' })); }
    return blobs[key];
  };
  const hero = $('.hero-video');
  if (hero) hero.src = media(mobile ? hero.dataset.srcMobile : hero.dataset.srcDesktop);
  const loadVideo = v => { if (v && !v.getAttribute('src') && v.dataset.src) { v.src = media(v.dataset.src); v.load(); } };
  const managed = v => v.closest('.scene-media, .svc-frame');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { loadVideo(e.target); play(e.target); } else e.target.pause();
  }), { rootMargin: '200px 0px' });
  $$('video[data-src]').forEach(v => { if (!managed(v)) io.observe(v); });
  // группы с ручным управлением: подгружаем заранее, играет только активное и только на экране
  const visible = {};
  const watchGroup = (sel, key, onShow) => {
    const box = $(sel); if (!box) return;
    new IntersectionObserver(([e]) => { if (e.isIntersecting) $$('video', box).forEach(loadVideo); }, { rootMargin: '100% 0px' }).observe(box);
    new IntersectionObserver(([e]) => {
      visible[key] = e.isIntersecting;
      if (e.isIntersecting) onShow(); else $$('video', box).forEach(v => v.pause());
    }).observe(box);
  };
  if (hero) new IntersectionObserver(([e]) => { e.isIntersecting ? play(hero) : hero.pause(); }).observe(hero.closest('.hero'));

  /* ---------- плавный скролл ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.3, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    lenis.stop();
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return e.preventDefault();
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: id === '#top' ? 0 : -40, duration: 1.8 }) : target.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- шапка ---------- */
  const header = $('.header');
  let lastY = 0, ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      header.classList.toggle('is-hidden', y > lastY && y > 500);
      lastY = y; ticking = false;
    });
  }, { passive: true });

  /* ---------- тихая строка ИИ-параметров под шоурилом ---------- */
  const rollers = { gen: () => 'GEN ' + pad(rnd(120, 9890), 4), seed: () => 'SEED ' + rnd(10000000, 99999999) };
  const meta = $$('.hero-meta [data-roll]');
  const roll = () => meta.forEach(el => { el.textContent = rollers[el.dataset.roll](); });
  roll();
  if (meta.length && !reduced) setInterval(() => {
    if (document.hidden || scrollY > innerHeight * 3) return;
    meta.forEach(el => { el.style.opacity = 0; });
    setTimeout(() => { roll(); meta.forEach(el => { el.style.opacity = 1; }); }, 600);
  }, 2600);

  /* ---------- форма ---------- */
  const form = $('.form');
  form && form.addEventListener('submit', async e => {
    e.preventDefault();
    const bad = $$('[required]', form).filter(i => !i.value.trim());
    bad.forEach(i => { i.classList.add('is-invalid'); i.addEventListener('input', () => i.classList.remove('is-invalid'), { once: true }); });
    if (bad.length) return bad[0].focus();
    if (AKM_CONFIG.formEndpoint) {
      const data = Object.fromEntries(new FormData(form));
      data.format = $$('[name="format"]:checked', form).map(i => i.value).join(', ');
      try { await fetch(AKM_CONFIG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }); } catch (err) { /* благодарим в любом случае */ }
    }
    form.classList.add('is-sent');
  });

  /* ---------- сцены: мягкий наплыв ---------- */
  const scenesBox = $('.scenes');
  const sceneVids = $$('.scene-media video'), sceneTexts = $$('.scene-text'), dots = $$('.scene-dots i');
  const tagsEl = $('[data-scene-tags]');
  let sceneIdx = -1;
  function setScene(i, animate = true) {
    if (i === sceneIdx || !sceneVids[i]) return;
    const prev = sceneIdx; sceneIdx = i;
    const v = sceneVids[i], t = sceneTexts[i];
    loadVideo(v); if (visible.scenes !== false) play(v);
    if (animate && hasGsap && !reduced) {
      gsap.to(sceneVids, { opacity: (k, el) => el === v ? 1 : 0, duration: 1.2, ease: 'power2.inOut', overwrite: true,
        onComplete: () => sceneVids.forEach((x, k) => { if (k !== sceneIdx) x.pause(); }) });
      gsap.fromTo(v, { scale: 1.06 }, { scale: 1, duration: 2.4, ease: 'power2.out', overwrite: 'auto' });
      if (sceneTexts[prev]) gsap.to(sceneTexts[prev], { autoAlpha: 0, y: -12, duration: .5, ease: 'power2.in', overwrite: true });
      gsap.fromTo(t, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1, delay: .35, ease: 'power3.out', overwrite: true });
      if (tagsEl) gsap.fromTo(tagsEl, { opacity: 0 }, { opacity: 1, duration: .8, delay: .5 });
    } else {
      sceneVids.forEach((x, k) => { x.style.opacity = k === i ? 1 : 0; if (k !== i) x.pause(); });
      sceneTexts.forEach((x, k) => { x.style.opacity = k === i ? 1 : 0; x.style.visibility = k === i ? 'visible' : 'hidden'; });
    }
    sceneTexts.forEach((x, k) => x.classList.toggle('is-active', k === i));
    dots.forEach((x, k) => x.classList.toggle('on', k === i));
    if (tagsEl) tagsEl.textContent = t.dataset.tags || '';
  }
  if (scenesBox) { setScene(0, false); watchGroup('.scenes-stage', 'scenes', () => play(sceneVids[sceneIdx])); }

  /* ---------- услуги: экран справа ---------- */
  const svcItems = $$('.svc-item'), svcVids = $$('.svc-frame video');
  let svcIdx = -1;
  function setSvc(i) {
    if (i === svcIdx || !svcVids[i]) return;
    svcIdx = i;
    svcItems.forEach((x, k) => x.classList.toggle('is-active', k === i));
    svcVids.forEach((v, k) => {
      v.classList.toggle('is-active', k === i);
      if (k === i) { loadVideo(v); if (visible.svc !== false) play(v); } else setTimeout(() => { if (k !== svcIdx) v.pause(); }, 1000);
    });
  }
  if (svcItems.length && !mobile) {
    setSvc(0);
    watchGroup('.svc-screen', 'svc', () => play(svcVids[svcIdx]));
    if (fine) svcItems.forEach((it, k) => it.addEventListener('mouseenter', () => setSvc(k)));
  }

  /* ---------- без анимаций (reduced motion или нет GSAP) ---------- */
  const killLoader = () => { document.body.classList.remove('is-loading'); const l = $('.loader'); if (l) l.remove(); if (lenis) lenis.start(); };
  if (reduced || !hasGsap) {
    killLoader();
    if (scenesBox) addEventListener('scroll', () => {
      const r = scenesBox.getBoundingClientRect(), p = Math.min(.999, Math.max(0, -r.top / (r.height - innerHeight)));
      setScene(Math.floor(p * sceneVids.length), false);
    }, { passive: true });
    if (svcItems.length && !mobile) addEventListener('scroll', () => {
      let best = 0, bd = Infinity;
      svcItems.forEach((it, k) => { const r = it.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - innerHeight * .55); if (d < bd) { bd = d; best = k; } });
      setSvc(best);
    }, { passive: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* заголовки: строки мягко поднимаются из-под маски */
  const linesIn = (el, delay = 0) => gsap.to($$('.line > span', el), { yPercent: 0, duration: 1.4, ease: 'power4.out', stagger: .12, delay });
  $$('[data-reveal]').forEach(el => {
    gsap.set($$('.line > span', el), { yPercent: 105 });
    if (el.dataset.reveal === 'hero') return; // герой раскрывается скроллом
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => linesIn(el) });
  });
  $$('.fade').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));

  /* hero: полёт внутрь буквы K логотипа, затем шоурил с заголовком */
  const heroSec = $('.hero');
  if (heroSec && $('.intro-mask')) {
    const ui = $$('.hero-side, .hero-meta');
    gsap.set(ui, { autoAlpha: 0, y: 16 });
    gsap.timeline({ scrollTrigger: { trigger: heroSec, start: 'top top', end: '+=160%', pin: true, scrub: 1.2, anticipatePin: 1 } })
      .to('.intro-en, .scroll-cue', { autoAlpha: 0, duration: .15, ease: 'none' }, 0)
      .to('.intro-mask img', { scale: 80, duration: 1, ease: 'power3.in' }, 0)
      .to('.intro-mask', { autoAlpha: 0, duration: .15, ease: 'none' }, .88)
      .to('.hero-media video', { scale: 1, duration: 1.2, ease: 'none' }, 0)
      .to('.hero-title .line > span', { yPercent: 0, stagger: .08, duration: .35, ease: 'power3.out' }, 1.0)
      .to(ui, { autoAlpha: 1, y: 0, duration: .3, ease: 'power2.out' }, 1.15)
      .to({}, { duration: .3 });
  }

  /* манифест: строки проявляются, капсулы раскрываются */
  $$('.mf-row').forEach(row => {
    gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 88%', once: true } })
      .from(row, { opacity: 0, y: 30, duration: 1.3, ease: 'power3.out' })
      .fromTo($('.mf-pill', row), { clipPath: 'inset(0% 50% 0% 50% round 999px)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px)', duration: 1.4, ease: 'power3.out', clearProps: 'clipPath' }, .2);
  });

  /* сцены листаются скроллом; сцена плавно раскрывается из скруглённой рамки */
  if (scenesBox) {
    ScrollTrigger.create({ trigger: scenesBox, start: 'top top', end: 'bottom bottom',
      onUpdate: st => setScene(Math.min(sceneVids.length - 1, Math.floor(st.progress * sceneVids.length))) });
    gsap.fromTo('.scenes-stage', { clipPath: 'inset(6% 5% 6% 5% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
      scrollTrigger: { trigger: scenesBox, start: 'top bottom', end: 'top top', scrub: true } });
  }

  /* услуги: активный пункт у центра экрана */
  if (svcItems.length && !mobile) svcItems.forEach((it, k) => ScrollTrigger.create({ trigger: it, start: 'top 58%', end: 'bottom 58%', onToggle: s => s.isActive && setSvc(k) }));

  /* полоса «Картинка без границ» */
  if ($('.band-clip')) {
    gsap.fromTo('.band-clip', { clipPath: 'inset(16% 20% 16% 20% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.band', start: 'top 70%', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.band-text .display', { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top 35%', end: 'bottom bottom', scrub: true } });
  }

  /* этапы и услуги проявляются по очереди */
  $$('.step, .svc-item, .num, .contact-link').forEach(el => gsap.from(el, { opacity: 0, y: 24, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }));

  /* цифры: спокойный счётчик */
  $$('[data-to]').forEach(n => {
    const o = { v: 0 }, to = +n.dataset.to, pd = +(n.dataset.pad || 0);
    n.textContent = pad(0, pd || 1);
    ScrollTrigger.create({ trigger: n, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 2.4, ease: 'power3.out', onUpdate: () => n.textContent = String(Math.round(o.v)).padStart(pd, '0') }) });
  });

  /* подвал */
  if ($('.footer-logo')) gsap.from('.footer-logo', { opacity: 0, y: 40, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: '.footer', start: 'top 92%', once: true } });

  /* ---------- интро после загрузки ---------- */
  const intro = () => {
    gsap.from('.header', { opacity: 0, y: -10, duration: 1.4, ease: 'power3.out', delay: .4 });
    if ($('.intro-mask')) {
      gsap.fromTo('.intro-mask img', { scale: .9, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.2, ease: 'power3.out' });
      gsap.fromTo('.intro-en, .scroll-cue', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.4, stagger: .2, delay: .7, ease: 'power3.out' });
    }
  };

  /* ---------- загрузка: год перетекает 1895 → 2026 ---------- */
  const loader = $('.loader');
  if (!loader) { killLoader(); intro(); return; }
  const Y0 = 1895, Y1 = 2026;
  const cols = $$('.year-col', loader).reverse(); // [единицы, десятки, сотни, тысячи]
  const lineEl = $('.loader-line i', loader), eraEl = $('[data-era]', loader);
  let eraIdx = 0;
  const state = { y: Y0 };
  const render = () => {
    const v = state.y;
    // механический счётчик: старший разряд докручивается, когда младшие проходят 9 → 0
    cols.forEach((col, k) => {
      const p = Math.pow(10, k), carry = Math.max(0, (v % p) - (p - 1));
      col.style.transform = `translateY(${-((Math.floor(v / p) % 10) + (k === 0 ? v % 1 : carry))}em)`;
    });
    lineEl.style.transform = `scaleX(${(v - Y0) / (Y1 - Y0)})`;
    if (v >= Y1 - .5 && !eraIdx) { eraIdx = 1; eraEl.style.opacity = 0; setTimeout(() => { eraEl.textContent = 'AI Cinema'; eraEl.style.opacity = 1; }, 150); }
  };
  gsap.ticker.add(render);

  let ready = false;
  if (hero) { if (hero.readyState >= 3) ready = true; hero.addEventListener('canplay', () => { ready = true; }, { once: true }); setTimeout(() => { ready = true; }, 1200); } else ready = true;

  const exit = () => gsap.timeline()
    .to('.loader-center, .loader-line', { opacity: 0, y: -12, duration: .45, ease: 'power2.in', delay: .5 })
    .add(() => { document.body.classList.remove('is-loading'); if (lenis) lenis.start(); intro(); })
    .to(loader, { opacity: 0, duration: .6, ease: 'power2.out',
      onComplete: () => { gsap.ticker.remove(render); loader.remove(); ScrollTrigger.refresh(); } }, '-=.1');

  // весь путь 1895 → 2026 занимает около 1,3 с; если видео ещё не готово, ждём не дольше 1,2 с с начала
  gsap.timeline({ onComplete: function wait() { ready ? gsap.to(state, { y: Y1, duration: .45, ease: 'power3.out', onComplete: exit }) : setTimeout(wait, 50); } })
    .to(state, { y: 2012, duration: .9, ease: 'power2.in', delay: .1 });
})();
