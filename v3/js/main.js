/* =====================================================================
   AKM Studios — версия 3
   Интро: нейросеть «обучается» и за ~10 секунд собирает логотип из частиц,
   затем ролик внутри букв и пролёт в букву K → визитка → блоки ниже.
   Видео без звука. Ниже — настройки ссылок для заказчика.
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
  const mobile = innerWidth < 760;
  const root = document.documentElement;

  /* ---------- контакты ---------- */
  $$('[data-contact]').forEach(a => {
    const url = AKM_CONFIG[a.dataset.contact];
    if (url) {
      a.href = url;
      if (/^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener'; }
      const addr = $('[data-mail-addr]', a); if (addr) addr.textContent = url.replace(/^mailto:/, '');
    } else if ('placeholder' in a.dataset) { a.setAttribute('aria-disabled', 'true'); a.addEventListener('click', e => e.preventDefault()); }
    else a.remove();
  });

  /* ---------- фоновое видео ---------- */
  const media = src => {
    if (!src || !src.startsWith('#m:') || !window.AKM_MEDIA) return src;
    const bin = atob(window.AKM_MEDIA[src.slice(3)]), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([u8], { type: 'video/mp4' }));
  };
  const card = $('.card'), v = $('.bg'), neuro = $('.neuro');
  const unlock = () => root.classList.remove('lock');
  if (reduced) { card.classList.add('no-intro', 'go'); neuro && neuro.remove(); unlock(); }
  else {
    v.src = media(mobile ? v.dataset.srcMobile : v.dataset.srcDesktop);
    v.play().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (document.hidden) v.pause(); else v.play().catch(() => {}); });
  }

  /* ---------- пролёт в букву K (как в версии 1) ---------- */
  const intro = $('.intro', card), maskImg = $('.intro-mask img', card);
  let flown = false, logoShown = false;
  const fly = () => {
    if (flown || !logoShown) return;
    flown = true;
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => removeEventListener(ev, fly));
    $$('.intro-en, .intro-cue', intro).forEach(el => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }));
    maskImg.animate([{ transform: 'scale(1)' }, { transform: 'scale(70)' }], { duration: 1500, easing: 'cubic-bezier(.7, 0, .84, 0)', fill: 'forwards' });
    $('.intro-mask', intro).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, delay: 1250, fill: 'forwards' });
    setTimeout(() => { card.classList.add('go'); unlock(); }, 1350);
  };
  const showLogo = () => {
    if (logoShown) return;
    logoShown = true;
    card.classList.add('logo-on');
    setTimeout(() => ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, fly, { passive: true })), 400);
    setTimeout(fly, 3200);
  };

  /* ---------- интро: нейросеть собирает логотип ---------- */
  if (!reduced && neuro) {
    const cv = $('.nn', neuro), ctx = cv.getContext('2d');
    const hud = k => $(`[data-nn="${k}"]`, neuro);
    const H = { status: hud('status'), epoch: hud('epoch'), loss: hud('loss'), acc: hud('acc'), params: hud('params'), bar: hud('bar') };
    const T_NET = 3600, T_FLY_END = 8600, T_END = 9800;   // мс: сеть → полёт частиц → логотип
    const T_OFF = +(new URLSearchParams(location.search).get('nnt') || 0); // для проверки: ?nnt=6000 — начать интро с 6-й секунды
    let W = 0, Hh = 0, dpr = 1, nodes = [], edges = [], parts = [], pulses = [], t0 = 0, raf = 0, ended = false;

    const layout = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth; Hh = innerHeight;
      cv.width = W * dpr; cv.height = Hh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // слои сети
      const counts = mobile ? [4, 7, 9, 9, 7, 4] : [5, 9, 13, 15, 13, 9, 5];
      nodes = []; edges = [];
      const x0 = W * .1, x1 = W * .9, top = Hh * .2, bot = Hh * .78;
      counts.forEach((n, li) => {
        const x = x0 + (x1 - x0) * li / (counts.length - 1);
        for (let i = 0; i < n; i++) nodes.push({ x, y: top + (bot - top) * (n === 1 ? .5 : i / (n - 1)) * 1 + (bot - top) * (1 - (n - 1) / (Math.max(...counts) - 1)) / 2 * (n === 1 ? 0 : 1), l: li, born: li * 260 + i * 18 });
      });
      // вертикально центрируем каждый слой
      counts.forEach((n, li) => {
        const ls = nodes.filter(nd => nd.l === li), mid = (top + bot) / 2, span = (bot - top) * (n - 1) / (Math.max(...counts) - 1);
        ls.forEach((nd, i) => { nd.y = mid - span / 2 + (n === 1 ? 0 : span * i / (n - 1)); });
      });
      for (let li = 0; li < counts.length - 1; li++) {
        const a = nodes.filter(nd => nd.l === li), b = nodes.filter(nd => nd.l === li + 1);
        a.forEach(p => b.forEach(q => edges.push([p, q])));
      }
    };

    // точки логотипа: рисуем SVG в том же месте и размере, где потом появится логотип с роликом
    const sampleLogo = () => new Promise(res => {
      const r = maskImg.getBoundingClientRect();
      const w = Math.round(r.width), h = Math.round(r.height);
      const img = new Image();
      img.onload = () => {
        try {
          const oc = document.createElement('canvas'); oc.width = w; oc.height = h;
          const o = oc.getContext('2d'); o.drawImage(img, 0, 0, w, h);
          const data = o.getImageData(0, 0, w, h).data, pts = [], step = 2;
          for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] > 140) pts.push([r.left + x, r.top + y, x < w * .075]); // третий флаг — точка логотипа
          for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
          res(pts.slice(0, mobile ? 1300 : 3000));
        } catch (e) { res([]); }
      };
      img.onerror = () => res([]);
      img.src = maskImg.currentSrc || maskImg.src;
    });

    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const fmt = (n, d) => n.toFixed(d);

    const frame = now => {
      if (!t0) t0 = now;
      const t = now - t0 + T_OFF;
      ctx.clearRect(0, 0, W, Hh);

      // 1) сеть: слои загораются, по связям бегут сигналы; во время сборки сеть гаснет
      const fade = t < T_NET ? 1 : Math.max(0, 1 - (t - T_NET) / 2600);
      if (fade > 0) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(241,238,232,${.07 * fade})`;
        ctx.beginPath();
        edges.forEach(([p, q]) => { const vis = Math.min(1, Math.max(0, (t - q.born) / 500)); if (vis > 0) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + (q.x - p.x) * vis, p.y + (q.y - p.y) * vis); } });
        ctx.stroke();
        // сигналы
        if (t < T_NET + 1500 && Math.random() < .9) for (let k = 0; k < (mobile ? 2 : 4); k++) {
          const e = edges[(Math.random() * edges.length) | 0];
          if (t > e[1].born) pulses.push({ e, s: 0, v: .012 + Math.random() * .02 });
        }
        ctx.globalCompositeOperation = 'lighter';
        pulses = pulses.filter(pu => (pu.s += pu.v) < 1);
        pulses.forEach(pu => {
          const [p, q] = pu.e, x = p.x + (q.x - p.x) * pu.s, y = p.y + (q.y - p.y) * pu.s;
          ctx.fillStyle = `rgba(240,122,74,${.85 * fade})`; ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
        });
        nodes.forEach(nd => {
          const a = Math.min(1, Math.max(0, (t - nd.born) / 400)) * fade;
          if (!a) return;
          ctx.fillStyle = `rgba(241,238,232,${.12 * a})`; ctx.beginPath(); ctx.arc(nd.x, nd.y, 7, 0, 6.283); ctx.fill();
          ctx.fillStyle = `rgba(241,238,232,${.9 * a})`; ctx.beginPath(); ctx.arc(nd.x, nd.y, 2.2, 0, 6.283); ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
      }

      // 2) частицы срываются с нейронов и летят в форму логотипа (слева направо)
      ctx.globalCompositeOperation = 'lighter';
      parts.forEach(p => {
        const k = Math.min(1, Math.max(0, (t - p.ts) / p.dur));
        if (k <= 0) return;
        const e = ease(k), u = 1 - e;
        const x = u * u * p.sx + 2 * u * e * p.cx + e * e * p.tx;
        const y = u * u * p.sy + 2 * u * e * p.cy + e * e * p.ty;
        const glow = k < 1 ? .9 : .75 + .25 * Math.sin(t / 220 + p.ph);
        ctx.fillStyle = p.hot ? `rgba(240,122,74,${glow})` : `rgba(241,238,232,${glow})`;
        const s = k < 1 ? 1.6 : 1.3;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      });
      ctx.globalCompositeOperation = 'source-over';

      // 3) HUD: цифры «обучения»
      const pr = Math.min(1, t / T_END);
      H.epoch.textContent = String(Math.round(120 * pr)).padStart(3, '0');
      H.loss.textContent = fmt(2.3026 * Math.exp(-4.8 * pr) + .0021, 4);
      H.acc.textContent = fmt(99.74 * (1 - Math.exp(-4.2 * pr)), 2).padStart(5, '0') + '%';
      H.params.textContent = fmt(1.3 * Math.min(1, pr * 1.6), 1) + ' B';
      H.bar.style.transform = `scaleX(${pr})`;
      const st = t < T_NET ? 'Обучение нейросети' : t < T_FLY_END ? 'Генерация логотипа' : 'Готово · AKM Studios';
      if (H.status.textContent !== st) H.status.textContent = st;

      if (t >= T_END) return finish();
      raf = requestAnimationFrame(frame);
    };

    const finish = () => {
      if (ended) return;
      ended = true; cancelAnimationFrame(raf);
      showLogo();                         // логотип с роликом внутри — на месте частиц
      neuro.classList.add('done');
      setTimeout(() => neuro.remove(), 1200);
    };

    layout();
    sampleLogo().then(pts => {
      if (!pts.length) { finish(); return; }
      const src = nodes.filter(nd => nd.l >= 2);
      parts = pts.map(([tx, ty, isDot]) => {
        const n = src[(Math.random() * src.length) | 0];
        const sx = n.x + (Math.random() - .5) * 10, sy = n.y + (Math.random() - .5) * 10;
        const mx = (sx + tx) / 2, my = (sy + ty) / 2, off = (Math.random() - .5) * 260;
        return { sx, sy, tx, ty, cx: mx - (ty - sy) * off / 600, cy: my + (tx - sx) * off / 600,
          ts: T_NET + (tx / W) * 2600 + Math.random() * 700, dur: 1700 + Math.random() * 700,
          hot: isDot || Math.random() < .06, ph: Math.random() * 6.283 };
      });
      raf = requestAnimationFrame(frame);
    });
    $('.nn-skip', neuro).addEventListener('click', finish);
    addEventListener('resize', () => { if (!ended) finish(); }, { once: true });
  }

  /* ---------- ИИ-строка (как в версии 1) ---------- */
  const SHOTS = [
    { t: 0, name: 'Закат над тропой', seed: 48213907, iter: 186, takes: 64 },
    { t: 2.62, name: 'Гора-медведь', seed: 73920184, iter: 214, takes: 41 },
    { t: 6.28, name: 'Маковое поле', seed: 15887302, iter: 162, takes: 37 },
    { t: 8.82, name: 'Туман, белый как медведь', seed: 90461178, iter: 248, takes: 52 },
  ];
  const el = k => card.querySelector(`[data-ai="${k}"]`);
  const nEl = el('n'), nameEl = el('name'), seedEl = el('seed'), iterEl = el('iter'), takesEl = el('takes');
  let shot = 0;
  const countUp = (node, to, ms = 900) => {
    const s0 = performance.now();
    const step = now => { const k = Math.min(1, (now - s0) / ms); node.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if (nEl && !reduced) {
    const watch = () => {
      const t = v.currentTime || 0; let i = 0;
      SHOTS.forEach((s, k) => { if (t >= s.t) i = k; });
      if (i !== shot) {
        shot = i; const s = SHOTS[i];
        nEl.textContent = '0' + (i + 1); nameEl.style.opacity = 0;
        setTimeout(() => { nameEl.textContent = s.name; nameEl.style.opacity = 1; }, 250);
        seedEl.textContent = s.seed; countUp(iterEl, s.iter); countUp(takesEl, s.takes, 700);
      }
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  }

  /* ---------- блоки ниже: появление и плёнка ---------- */
  const targets = [...$$('.x-head, .frame, .pillars li, .steps li, .x-contact, .contact-row, .x-foot'), $('.venn')].filter(Boolean);
  if (!reduced) {
    targets.forEach(t => { if (!t.classList.contains('venn')) t.classList.add('reveal'); });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { threshold: .2 });
    targets.forEach(t => io.observe(t));
  } else targets.forEach(t => t.classList.add('on'));
  const strip = $('.strip');
  if (strip) {
    let down = false, x0 = 0, s0 = 0;
    strip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; x0 = e.clientX; s0 = strip.scrollLeft; strip.classList.add('drag'); });
    addEventListener('pointerup', () => { down = false; strip.classList.remove('drag'); });
    addEventListener('pointermove', e => { if (down) strip.scrollLeft = s0 - (e.clientX - x0); });
  }
})();
