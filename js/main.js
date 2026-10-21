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
  const groupVisible = {};
  const watchGroup = (sel, key, onShow) => {
    const box = $(sel); if (!box) return;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) $$('video', box).forEach(loadVideo);
    }, { rootMargin: '100% 0px' }).observe(box);
    new IntersectionObserver(([e]) => {
      groupVisible[key] = e.isIntersecting;
      if (e.isIntersecting) onShow(); else $$('video', box).forEach(v => v.pause());
    }).observe(box);
  };
  if (hero) new IntersectionObserver(([e]) => { e.isIntersecting ? play(hero) : hero.pause(); }).observe(hero.closest('.hero'));

  /* ---------- плавный скролл ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
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
    lenis ? lenis.scrollTo(target, { offset: id === '#top' ? 0 : -40, duration: 1.6 }) : target.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- шапка + полоса прогресса страницы ---------- */
  const header = $('.header'), bar = $('.page-progress i');
  let lastY = 0, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
    if (bar) bar.style.transform = `scaleX(${Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- «расшифровка» моно-текста ---------- */
  const GLYPHS = '01#%&*+=<>/\\ABCDEFGHKMNPRSTXZ';
  function scramble(el, text = el && el.textContent, dur = 700) {
    if (!el || reduced) { if (el) el.textContent = text; return; }
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), n = Math.floor(text.length * k);
      el.textContent = text.slice(0, n) + [...text.slice(n)].map(c => c === ' ' ? ' ' : GLYPHS[rnd(0, GLYPHS.length - 1)]).join('');
      if (k < 1) requestAnimationFrame(step); else el.textContent = text;
    };
    requestAnimationFrame(step);
  }

  /* ---------- HUD: цифры генерации ---------- */
  const rollers = {
    gen: () => '#' + pad(rnd(120, 9890), 4),
    seed: () => String(rnd(10000000, 99999999)),
    steps: () => pad(rnd(30, 48)) + '/48',
    lock: () => (96 + Math.random() * 3.9).toFixed(1) + '%',
    iter: () => pad(rnd(12, 240), 3),
    cfg: () => (5 + Math.random() * 3).toFixed(1),
  };
  const rollAll = box => box && $$('[data-roll]', box).forEach(el => scramble(el, rollers[el.dataset.roll](), 420));
  const heroHud = $('.hero-hud');
  rollAll(heroHud);
  if (heroHud && !reduced) setInterval(() => { if (scrollY < innerHeight * 3 && !document.hidden) rollAll(heroHud); }, 1240);

  /* ---------- таймкод шоурила ---------- */
  const tc = $('[data-timecode]'), heroProg = $('.hero-progress');
  if (hero && tc) {
    const tick = () => {
      if (scrollY < innerHeight * 3) {
        const t = hero.currentTime || 0;
        tc.textContent = `00:${pad(Math.floor(t / 60))}:${pad(Math.floor(t % 60))}:${pad(Math.floor((t % 1) * 24))}`;
        if (hero.duration && heroProg) heroProg.style.transform = `scaleX(${t / hero.duration})`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- разбивка заголовков на буквы ---------- */
  function splitChars(root) {
    $$('.line-mask > span', root).forEach(span => {
      if (span.dataset.chars) return;
      span.dataset.chars = '1';
      const words = span.textContent.split(' ');
      span.textContent = '';
      words.forEach((w, i) => {
        const word = document.createElement('span');
        word.style.cssText = 'display:inline-block;white-space:nowrap';
        [...w].forEach(c => { const ch = document.createElement('span'); ch.className = 'ch'; ch.textContent = c; word.appendChild(ch); });
        span.appendChild(word);
        if (i < words.length - 1) span.appendChild(document.createTextNode(' '));
      });
    });
    return $$('.ch', root);
  }
  // заголовки сцен оборачиваем в line-mask, чтобы буквы вылетали из-под маски
  $$('.scene-text h3').forEach(h => { h.innerHTML = `<span class="line-mask"><span>${h.textContent}</span></span>`; });

  /* ---------- курсор + магнитные кнопки ---------- */
  const cur = $('.cursor');
  if (fine && hasGsap && cur) {
    const xc = gsap.quickTo(cur, 'x', { duration: .18, ease: 'power3' }), yc = gsap.quickTo(cur, 'y', { duration: .18, ease: 'power3' });
    addEventListener('mousemove', e => { xc(e.clientX); yc(e.clientY); }, { passive: true });
    document.addEventListener('mouseover', e => cur.classList.toggle('is-link', !!e.target.closest('a, button, .chip')));
    $$('.magnetic').forEach(m => {
      const mx = gsap.quickTo(m, 'x', { duration: .6, ease: 'elastic.out(1, .4)' }), my = gsap.quickTo(m, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      m.addEventListener('mousemove', e => { const r = m.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .4); });
      m.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

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
      try { await fetch(AKM_CONFIG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }); } catch (err) { /* показываем благодарность в любом случае */ }
    }
    form.classList.add('is-sent');
  });

  /* ---------- сцены ---------- */
  const scenesBox = $('.scenes');
  const sceneVids = $$('.scene-media video'), sceneTexts = $$('.scene-text'), sceneTicks = $$('.scene-ticks i'), sceneDisc = $$('.scene-disc li');
  const wipe = $('.scene-wipe');
  let sceneIdx = -1, zTop = 1;
  function setScene(i, animate = true) {
    if (i === sceneIdx || !sceneVids[i]) return;
    const prev = sceneIdx; sceneIdx = i;
    const v = sceneVids[i], t = sceneTexts[i];
    loadVideo(v); if (groupVisible.scenes !== false) play(v);
    v.style.zIndex = ++zTop;
    if (animate && hasGsap && !reduced) {
      const dir = prev < i ? 1 : -1;
      gsap.fromTo(v, { clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)', scale: 1.16 },
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1.04, duration: 1.1, ease: 'expo.inOut', overwrite: true,
          onComplete: () => sceneVids.forEach((x, k) => { if (k !== sceneIdx) x.pause(); }) });
      if (wipe) gsap.fromTo(wipe, { left: dir > 0 ? '100%' : '0%', opacity: 1 }, { left: dir > 0 ? '0%' : '100%', duration: 1.1, ease: 'expo.inOut', overwrite: true, onComplete: () => gsap.to(wipe, { opacity: 0, duration: .3 }) });
      if (sceneTexts[prev]) gsap.to(sceneTexts[prev], { autoAlpha: 0, y: -24 * dir, duration: .35, ease: 'power2.in', overwrite: true });
      gsap.fromTo(t, { autoAlpha: 0, y: 0 }, { autoAlpha: 1, duration: .01, delay: .3, overwrite: true });
      gsap.fromTo($$('.ch', t), { yPercent: 110, rotateX: -60 }, { yPercent: 0, rotateX: 0, duration: 1, stagger: .014, delay: .32, ease: 'expo.out', overwrite: true });
      gsap.fromTo($$('.scene-kicker, p', t), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .9, stagger: .08, delay: .45, ease: 'expo.out', overwrite: true });
    } else {
      sceneVids.forEach((x, k) => { x.style.clipPath = k === i ? 'inset(0% 0% 0% 0%)' : ''; if (k !== i) x.pause(); });
      sceneTexts.forEach((x, k) => { x.style.opacity = k === i ? 1 : 0; x.style.visibility = k === i ? 'visible' : 'hidden'; });
    }
    sceneTexts.forEach((x, k) => x.classList.toggle('is-active', k === i));
    const disc = (t.dataset.disc || '').split(',');
    sceneDisc.forEach(li => li.classList.toggle('on', disc.includes(li.dataset.d)));
    sceneTicks.forEach((x, k) => x.classList.toggle('on', k <= i));
    scramble($('[data-scene-num]'), pad(i + 1), 360);
    scramble($('[data-scene-id]'), 'S-' + pad(i + 1), 360);
    scramble($('[data-scene-frames]'), t.dataset.frames, 360);
    rollAll($('.scene-hud'));
  }
  if (scenesBox) {
    $$('.scene-text h3').forEach(h => splitChars(h));
    setScene(0, false);
    watchGroup('.scenes-stage', 'scenes', () => play(sceneVids[sceneIdx]));
  }

  /* ---------- услуги: экран ---------- */
  const svcItems = $$('.svc-item'), svcVids = $$('.svc-frame video');
  const svcFrame = $('.svc-frame');
  let svcIdx = -1;
  function setSvc(i) {
    if (i === svcIdx || !svcVids[i]) return;
    svcIdx = i;
    svcItems.forEach((x, k) => x.classList.toggle('is-active', k === i));
    svcVids.forEach((v, k) => {
      v.classList.toggle('is-active', k === i);
      if (k === i) { loadVideo(v); if (groupVisible.svc !== false) play(v); } else setTimeout(() => { if (k !== svcIdx) v.pause(); }, 900);
    });
    scramble($('[data-svc-label]'), `${pad(i + 1)} · ${$('h3', svcItems[i]).textContent}`, 500);
    scramble($('[data-svc-big]'), pad(i + 1), 400);
  }
  if (svcItems.length && !mobile) {
    setSvc(0);
    watchGroup('.svc-screen', 'svc', () => play(svcVids[svcIdx]));
    const stc = $('[data-svc-tc]');
    const tickSvc = () => {
      const v = svcVids[svcIdx];
      if (v && stc && groupVisible.svc) { const t = v.currentTime || 0; stc.textContent = `00:00:${pad(Math.floor(t % 60))}:${pad(Math.floor((t % 1) * 24))}`; }
      requestAnimationFrame(tickSvc);
    };
    requestAnimationFrame(tickSvc);
    svcItems.forEach((it, k) => it.addEventListener('mouseenter', () => setSvc(k)));
    if (fine && hasGsap && svcFrame && !reduced) {
      const rx = gsap.quickTo(svcFrame, 'rotationX', { duration: .8, ease: 'power3' }), ry = gsap.quickTo(svcFrame, 'rotationY', { duration: .8, ease: 'power3' });
      const scr = $('.svc-screen');
      scr.addEventListener('mousemove', e => { const r = scr.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 8); rx(-((e.clientY - r.top) / r.height - .5) * 6); });
      scr.addEventListener('mouseleave', () => { rx(0); ry(0); });
    }
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
      svcItems.forEach((it, k) => { const r = it.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - innerHeight * .6); if (d < bd) { bd = d; best = k; } });
      setSvc(best);
    }, { passive: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* заголовки по буквам: вылет из-под маски с поворотом */
  const charsIn = (chars, delay = 0) => gsap.fromTo(chars, { yPercent: 115, rotateX: -70, opacity: 0 },
    { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: .016, delay });
  $$('[data-split]').forEach(el => {
    const chars = splitChars(el);
    gsap.set(chars, { yPercent: 115, opacity: 0 });
    if (el.dataset.split === 'hero') return; // герой анимируется скроллом
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => charsIn(chars) });
  });
  $$('.reveal').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
  $$('[data-scramble]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => scramble(el) }));

  /* hero: полёт внутрь буквы K логотипа, затем шоурил с заголовком */
  const heroSec = $('.hero');
  if (heroSec && $('.intro-mask')) {
    const chars = $$('.hero-title .ch');
    const ui = $$('.hero-side, .hero-top, .frame-marks, .hero-hud');
    gsap.set(ui, { autoAlpha: 0 });
    gsap.timeline({ scrollTrigger: { trigger: heroSec, start: 'top top', end: '+=170%', pin: true, scrub: 1, anticipatePin: 1 } })
      .to('.intro-caption, .scroll-cue', { autoAlpha: 0, y: 24, duration: .2, ease: 'none' }, 0)
      .to('.intro-mask img', { scale: 90, duration: 1, ease: 'power3.in' }, 0)
      .to('.intro-mask', { autoAlpha: 0, duration: .15, ease: 'none' }, .88)
      .to('.hero-media video', { scale: 1.02, duration: 1.2, ease: 'none' }, 0)
      .to(chars, { yPercent: 0, rotateX: 0, opacity: 1, stagger: .006, duration: .3, ease: 'power3.out' }, 1.0)
      .to(ui, { autoAlpha: 1, duration: .3, ease: 'none' }, 1.12)
      .to({}, { duration: .35 });
  }

  /* бегущая строка: скорость и направление от скролла */
  const track = $('.marquee-track');
  if (track) {
    track.innerHTML += track.innerHTML;
    const tw = gsap.to(track, { xPercent: -50, ease: 'none', duration: 30, repeat: -1 });
    ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onToggle: s => s.isActive ? tw.play() : tw.pause(),
      onUpdate: s => gsap.to(tw, { timeScale: s.direction * (1 + Math.min(Math.abs(s.getVelocity()) / 400, 4)), duration: .3, overwrite: true, onComplete: () => gsap.to(tw, { timeScale: s.direction, duration: 1 }) }) });
  }

  /* манифест: строки выезжают, капсулы раскрываются */
  $$('.mf-row').forEach((row, k) => {
    gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 88%', once: true } })
      .from(row, { x: k % 2 ? 60 : -60, opacity: 0, duration: 1.2, ease: 'expo.out' })
      .fromTo($('.mf-pill', row), { clipPath: 'inset(0% 100% 0% 0% round 999px)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px)', duration: 1.3, ease: 'expo.out', clearProps: 'clipPath' }, .15);
  });

  /* сцены: листаются скроллом, сцена «открывается» из рамки */
  if (scenesBox) {
    ScrollTrigger.create({ trigger: scenesBox, start: 'top top', end: 'bottom bottom',
      onUpdate: st => setScene(Math.min(sceneVids.length - 1, Math.floor(st.progress * sceneVids.length))) });
    gsap.fromTo('.scenes-stage', { clipPath: 'inset(8% 6% 8% 6% round 4px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
      scrollTrigger: { trigger: scenesBox, start: 'top bottom', end: 'top top', scrub: true } });
  }

  /* услуги: активный пункт — тот, что у центра экрана */
  if (svcItems.length && !mobile) svcItems.forEach((it, k) => ScrollTrigger.create({ trigger: it, start: 'top 60%', end: 'bottom 60%', onToggle: s => s.isActive && setSvc(k) }));

  /* полоса «Картинка без границ» */
  if ($('.band-clip')) {
    gsap.fromTo('.band-clip', { clipPath: 'inset(18% 22% 18% 22% round 4px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.band', start: 'top 70%', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.band-text .display', { scale: .8, opacity: 0 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top 40%', end: 'bottom bottom', scrub: true } });
  }

  /* этапы: линия прогресса и номер */
  $$('.step').forEach(s => {
    gsap.fromTo(s, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top 75%', end: 'bottom 55%', scrub: true } });
    ScrollTrigger.create({ trigger: s, start: 'top 80%', once: true, onEnter: () => scramble($('.step-num', s), $('.step-num', s).textContent, 500) });
    gsap.from($$('h3, p', s), { y: 24, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 85%', once: true } });
  });

  /* цифры: счётчик */
  $$('[data-to]').forEach(n => {
    const o = { v: 0 }, to = +n.dataset.to, pd = +(n.dataset.pad || 0);
    n.textContent = pad(0, pd || 1);
    ScrollTrigger.create({ trigger: n, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 2, ease: 'expo.out', onUpdate: () => n.textContent = String(Math.round(o.v)).padStart(pd, '0') }) });
  });

  /* подвал: логотип с видео выезжает */
  if ($('.footer-logo')) gsap.fromTo('.footer-logo', { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 92%', once: true } });

  /* ---------- интро после загрузки ---------- */
  const intro = () => {
    gsap.from('.header', { yPercent: -100, duration: 1.2, ease: 'expo.out', delay: .3 });
    if ($('.intro-mask')) {
      gsap.fromTo('.intro-mask img', { scale: .72, opacity: 0, filter: 'blur(20px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 2.2, ease: 'expo.out', clearProps: 'filter' });
      gsap.fromTo('.intro-caption > *, .scroll-cue', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, stagger: .12, delay: .7, ease: 'expo.out' });
      const en = $('.intro-en'); if (en) setTimeout(() => scramble(en, en.textContent, 1100), 700);
    }
  };

  /* ---------- загрузка: годы истории кино ---------- */
  const loader = $('.loader');
  if (!loader) { killLoader(); intro(); return; }
  const ERAS = [
    [1895, 'Первый киносеанс', 'Братья Люмьер · Париж'],
    [1927, 'Звук', '«Певец джаза»'],
    [1935, 'Цвет', 'Technicolor'],
    [1977, 'Спецэффекты', '«Звёздные войны»'],
    [1995, 'Компьютерная графика', '«История игрушек»'],
    [2026, 'AI Cinema', 'AKM Studios'],
  ];
  const Y0 = 1895, Y1 = 2026;
  const cols = $$('.year-col', loader).reverse(); // [единицы, десятки, сотни, тысячи]
  const fillEl = $('.tl-fill', loader), headEl = $('.tl-head', loader), pctEl = $('[data-pct]', loader);
  const marks = $$('.tl-marks li', loader);
  marks.forEach(m => { m.style.left = ((+m.dataset.y - Y0) / (Y1 - Y0) * 100) + '%'; });
  const eraName = $('[data-era-name]', loader), eraNote = $('[data-era-note]', loader);
  let eraIdx = 0;
  const state = { y: Y0 };
  const render = () => {
    const v = state.y;
    // механический счётчик: старший разряд докручивается, когда младшие проходят 9 → 0
    cols.forEach((col, k) => {
      const p = Math.pow(10, k);
      const carry = Math.max(0, (v % p) - (p - 1));
      const pos = (Math.floor(v / p) % 10) + (k === 0 ? v % 1 : carry);
      col.style.transform = `translateY(${-pos}em)`;
    });
    const t = (v - Y0) / (Y1 - Y0);
    fillEl.style.transform = `scaleX(${t})`;
    headEl.style.left = (t * 100) + '%';
    pctEl.textContent = pad(Math.round(t * 100), 3);
    marks.forEach(m => m.classList.toggle('on', +m.dataset.y <= v + .5));
    let e = 0; ERAS.forEach(([yy], k) => { if (v + .5 >= yy) e = k; });
    if (e !== eraIdx) { eraIdx = e; scramble(eraName, ERAS[e][1], 420); gsap.fromTo(eraNote, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .5 }); eraNote.textContent = ERAS[e][2]; }
  };
  gsap.ticker.add(render);

  let ready = false;
  const markReady = () => { ready = true; };
  if (hero) { if (hero.readyState >= 3) markReady(); hero.addEventListener('canplay', markReady, { once: true }); setTimeout(markReady, 3500); } else markReady();

  const exit = () => gsap.timeline()
    .add(() => loader.classList.add('is-final'))
    .to('.year', { scale: 1.08, duration: .5, ease: 'power2.out' })
    .to('.year, .era', { yPercent: -40, opacity: 0, duration: .7, ease: 'expo.in' }, '+=.25')
    .to('.loader-top, .timeline', { opacity: 0, duration: .5 }, '<')
    .add(() => { document.body.classList.remove('is-loading'); if (lenis) lenis.start(); intro(); }, '-=.2')
    .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut',
      onComplete: () => { gsap.ticker.remove(render); loader.remove(); ScrollTrigger.refresh(); } }, '-=.25');

  // путь по эпохам: короткие паузы на вехах, потом ждём видео и доезжаем до 2026
  gsap.timeline({ onComplete: function wait() { ready ? gsap.to(state, { y: Y1, duration: 1.1, ease: 'expo.out', onComplete: exit }) : setTimeout(wait, 60); } })
    .to(state, { y: 1927, duration: .75, ease: 'power2.inOut' }, '+=.35')
    .to(state, { y: 1935, duration: .35, ease: 'power2.inOut' }, '+=.18')
    .to(state, { y: 1977, duration: .7, ease: 'power2.inOut' }, '+=.18')
    .to(state, { y: 1995, duration: .5, ease: 'power2.inOut' }, '+=.18')
    .timeScale(1.35);
})();
