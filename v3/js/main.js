/* =====================================================================
   AKM Studios — версия 3
   Интро (~5 с): нейроны собирают логотип из частиц, в точках проступает живой кадр,
   пролёт в букву K — сцена из точек перетекает в видео → визитка → блоки ниже.
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

  /* ---------- сцена из «вокселей»: живой кадр ролика, собранный из светящихся точек ----------
     Внутри букв логотипа и после влёта в K ролик сначала виден как сетка точек,
     затем волна от центра растворяет точки в настоящее видео. */
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const vox = (() => {
    const cv = $('.vox', card);
    const off = { size() {}, start() {}, dissolve() {}, paint() {}, grab() {}, kill() {}, cell: 4, dpr: 1, W: 0, H: 0 };
    if (!cv || reduced) { cv && cv.remove(); return off; }
    const c = cv.getContext('2d'), g = document.createElement('canvas'), gc = g.getContext('2d');
    const poster = new Image(); poster.src = v.poster;
    const api = { cell: 4, dpr: 1, W: 0, H: 0 };
    let cols = 0, rows = 0, pat = null, run = false, d0 = 0;
    api.size = () => {
      const r = card.getBoundingClientRect();
      const dpr = api.dpr = Math.min(2, devicePixelRatio || 1);
      const W = api.W = Math.round(r.width * dpr), H = api.H = Math.round(r.height * dpr);
      cv.width = W; cv.height = H;
      const cell = api.cell = Math.max(3, Math.round((mobile ? 2.6 : 3.4) * dpr));
      cols = g.width = Math.ceil(W / cell); rows = g.height = Math.ceil(H / cell);
      const pc = document.createElement('canvas'); pc.width = pc.height = cell;
      const p = pc.getContext('2d');
      p.fillStyle = '#000'; p.fillRect(0, 0, cell, cell);
      p.globalCompositeOperation = 'destination-out'; p.beginPath(); p.arc(cell / 2, cell / 2, cell * .37, 0, 6.283); p.fill();
      pat = c.createPattern(pc, 'repeat');
    };
    // кадр ролика (как object-fit: cover) в сетку: один пиксель сетки — одна точка
    api.grab = () => {
      const src = v.readyState >= 2 ? v : poster, sw = src.videoWidth || src.naturalWidth, sh = src.videoHeight || src.naturalHeight;
      if (!sw) return;
      const k = Math.max(api.W / sw, api.H / sh) / api.cell;
      gc.setTransform(k, 0, 0, k, (api.W / api.cell - sw * k) / 2, (api.H / api.cell - sh * k) / 2);
      gc.drawImage(src, 0, 0);
    };
    // сцена точками в любой контекст размером W×H (в пикселях устройства)
    api.paint = x => {
      x.imageSmoothingEnabled = false;
      x.filter = 'saturate(1.3) brightness(1.3)';
      x.drawImage(g, 0, 0, cols * api.cell, rows * api.cell);
      x.filter = 'none';
      x.fillStyle = pat; x.fillRect(0, 0, api.W, api.H);
    };
    const tick = now => {
      if (!run) return;
      api.grab();
      c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, api.W, api.H); api.paint(c);
      if (d0 && now > d0) {
        const k = Math.min(1, (now - d0) / 1300), R = Math.hypot(api.W, api.H) * .62 * ease(k), edge = 180 * api.dpr;
        const gr = c.createRadialGradient(api.W / 2, api.H / 2, Math.max(0, R - edge), api.W / 2, api.H / 2, R + 1);
        gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalCompositeOperation = 'destination-out'; c.fillStyle = gr; c.fillRect(0, 0, api.W, api.H);
        if (k >= 1) return api.kill();
      }
      requestAnimationFrame(tick);
    };
    api.start = () => { if (run) return; run = true; api.grab(); api.paint(c); requestAnimationFrame(tick); };
    api.dissolve = delay => { d0 = performance.now() + delay; };
    api.kill = () => { run = false; cv.remove(); };
    addEventListener('resize', () => { if (run) api.size(); });
    return api;
  })();

  /* ---------- пролёт в букву K ---------- */
  const intro = $('.intro', card), maskImg = $('.intro-mask img', card);
  const EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  let flown = false, logoShown = false;
  const ready = () => { card.classList.add('go'); root.classList.add('ready'); unlock(); };
  const fly = () => {
    if (flown || !logoShown) return;
    flown = true;
    EVENTS.forEach(ev => removeEventListener(ev, fly));
    $$('.intro-en, .intro-cue', intro).forEach(el => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' }));
    maskImg.animate([{ transform: 'scale(1)' }, { transform: 'scale(70)' }], { duration: 1100, easing: 'cubic-bezier(.7, 0, .84, 0)', fill: 'forwards' });
    $('.intro-mask', intro).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 850, fill: 'forwards' });
    vox.dissolve(1050);                    // сцена из точек перетекает в видео
    setTimeout(ready, 950);
  };
  const showLogo = () => {
    if (logoShown) return;
    logoShown = true;
    vox.start();
    card.classList.add('logo-on');
    setTimeout(() => EVENTS.forEach(ev => addEventListener(ev, fly, { passive: true })), 150);
    if (!/nnhold/.test(location.search)) setTimeout(fly, 350);
  };
  if (reduced) root.classList.add('ready');

  /* ---------- интро (~5 с): нейроны → частицы садятся в точки логотипа → в точках проступает сцена ---------- */
  if (!reduced && neuro) {
    history.scrollRestoration = 'manual'; scrollTo(0, 0);
    const cv = $('.nn', neuro), ctx = cv.getContext('2d');
    const T_MIX = 2500, T_END = 3100;   // мс: частицы на местах → в точках проступает кадр → логотип с роликом
    const QS = new URLSearchParams(location.search), T_OFF = +(QS.get('nnt') || 0), HOLD = QS.has('nnhold'); // для проверки: ?nnt=2000 — со 2-й секунды, &nnhold — замереть
    let W = 0, Hh = 0, nodes = [], edges = [], parts = [], pulses = [], t0 = 0, raf = 0, ended = false, dot = 2;
    const L = document.createElement('canvas'), lc = L.getContext('2d');   // сцена точками, вырезанная по буквам
    let mr = null;

    const layout = () => {
      const dpr = vox.dpr;
      W = innerWidth; Hh = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
      const counts = mobile ? [4, 7, 9, 9, 7, 4] : [5, 9, 13, 15, 13, 9, 5];
      const x0 = W * .1, x1 = W * .9, top = Hh * .2, bot = Hh * .78, max = Math.max(...counts);
      nodes = []; edges = [];
      counts.forEach((n, li) => {
        const x = x0 + (x1 - x0) * li / (counts.length - 1), span = (bot - top) * (n - 1) / (max - 1), mid = (top + bot) / 2;
        for (let i = 0; i < n; i++) nodes.push({ x, y: mid - span / 2 + (n === 1 ? 0 : span * i / (n - 1)), l: li, born: li * 110 + i * 8 });
      });
      for (let li = 0; li < counts.length - 1; li++) {
        const a = nodes.filter(nd => nd.l === li), b = nodes.filter(nd => nd.l === li + 1);
        a.forEach(p => b.forEach(q => edges.push([p, q])));
      }
    };

    // точки логотипа — ровно центры ячеек той же сетки, из которой потом собрана сцена
    const sampleLogo = () => new Promise(res => {
      const r = maskImg.getBoundingClientRect(), { dpr, cell } = vox;
      const ox = r.left * dpr, oy = r.top * dpr, w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      const img = new Image();
      img.onload = () => {
        try {
          const oc = document.createElement('canvas'); oc.width = w; oc.height = h;
          const o = oc.getContext('2d'); o.drawImage(img, 0, 0, w, h);
          const data = o.getImageData(0, 0, w, h).data, pts = [];
          for (let y = Math.floor(oy / cell); (y + .5) * cell < oy + h; y++) for (let x = Math.floor(ox / cell); (x + .5) * cell < ox + w; x++) {
            const cx = (x + .5) * cell, cy = (y + .5) * cell, lx = Math.floor(cx - ox), ly = Math.floor(cy - oy);
            if (lx >= 0 && ly >= 0 && data[(ly * w + lx) * 4 + 3] > 120) pts.push([cx / dpr, cy / dpr, lx < w * .075]); // третий флаг — точка логотипа
          }
          mr = { img, ox, oy, w, h };
          res(pts);
        } catch (e) { res([]); }
      };
      img.onerror = () => res([]);
      img.src = maskImg.currentSrc || maskImg.src;
    });

    const frame = now => {
      if (!t0) t0 = now;
      const t = HOLD ? Math.min(T_OFF, T_END - 1) : now - t0 + T_OFF, dpr = vox.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, Hh);

      // 1) сеть: слои вспыхивают, по связям бегут сигналы; пока частицы летят — сеть гаснет
      const fade = t < 1300 ? 1 : Math.max(0, 1 - (t - 1300) / 1100);
      if (fade > 0) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(241,238,232,${.07 * fade})`;
        ctx.beginPath();
        edges.forEach(([p, q]) => { const vis = Math.min(1, Math.max(0, (t - q.born) / 350)); if (vis > 0) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + (q.x - p.x) * vis, p.y + (q.y - p.y) * vis); } });
        ctx.stroke();
        if (t < 1900) for (let k = 0; k < (mobile ? 3 : 6); k++) {
          const e = edges[(Math.random() * edges.length) | 0];
          if (t > e[1].born) pulses.push({ e, s: 0, v: .02 + Math.random() * .03 });
        }
        ctx.globalCompositeOperation = 'lighter';
        pulses = pulses.filter(pu => (pu.s += pu.v) < 1);
        pulses.forEach(pu => {
          const [p, q] = pu.e, x = p.x + (q.x - p.x) * pu.s, y = p.y + (q.y - p.y) * pu.s;
          ctx.fillStyle = `rgba(240,122,74,${.85 * fade})`; ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
        });
        nodes.forEach(nd => {
          const a = Math.min(1, Math.max(0, (t - nd.born) / 300)) * fade;
          if (!a) return;
          ctx.fillStyle = `rgba(241,238,232,${.12 * a})`; ctx.beginPath(); ctx.arc(nd.x, nd.y, 7, 0, 6.283); ctx.fill();
          ctx.fillStyle = `rgba(241,238,232,${.9 * a})`; ctx.beginPath(); ctx.arc(nd.x, nd.y, 2.2, 0, 6.283); ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
      }

      // 2) частицы срываются с нейронов и садятся в точки логотипа (волной слева направо)
      const mix = Math.min(1, Math.max(0, (t - T_MIX) / (T_END - T_MIX)));
      if (mix < 1) {
        ctx.globalCompositeOperation = 'lighter';
        parts.forEach(p => {
          const k = Math.min(1, Math.max(0, (t - p.ts) / p.dur));
          if (k <= 0) return;
          const e = ease(k), u = 1 - e;
          const x = u * u * p.sx + 2 * u * e * p.cx + e * e * p.tx;
          const y = u * u * p.sy + 2 * u * e * p.cy + e * e * p.ty;
          const a = (k < 1 ? .95 : .8 + .2 * Math.sin(t / 160 + p.ph)) * (1 - mix);
          ctx.fillStyle = p.hot ? `rgba(240,122,74,${a})` : `rgba(241,238,232,${a})`;
          const s = k < 1 ? dot * 1.3 : dot;
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
        });
        ctx.globalCompositeOperation = 'source-over';
      }

      // 3) в точках проступает живой кадр ролика — ровно то, что дальше покажет логотип
      if (mix > 0 && mr) {
        vox.grab();
        lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, L.width, L.height); vox.paint(lc);
        lc.globalCompositeOperation = 'destination-in'; lc.drawImage(mr.img, mr.ox, mr.oy, mr.w, mr.h);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = mix; ctx.drawImage(L, 0, 0); ctx.globalAlpha = 1;
      }

      if (t >= T_END) return finish();
      raf = requestAnimationFrame(frame);
    };

    const finish = () => {
      if (ended) return;
      ended = true; cancelAnimationFrame(raf);
      showLogo();                         // под оверлеем уже та же картинка — подмена незаметна
      neuro.classList.add('done');
      setTimeout(() => neuro.remove(), 700);
    };

    vox.size();
    L.width = vox.W; L.height = vox.H;
    dot = vox.cell / vox.dpr * .74;
    layout();
    sampleLogo().then(pts => {
      if (!pts.length) { finish(); return; }
      const src = nodes.filter(nd => nd.l >= 2);
      parts = pts.map(([tx, ty, isDot]) => {
        const n = src[(Math.random() * src.length) | 0];
        const sx = n.x + (Math.random() - .5) * 10, sy = n.y + (Math.random() - .5) * 10;
        const mx = (sx + tx) / 2, my = (sy + ty) / 2, o = (Math.random() - .5) * 260;
        return { sx, sy, tx, ty, cx: mx - (ty - sy) * o / 600, cy: my + (tx - sx) * o / 600,
          ts: 350 + (tx / W) * 900 + Math.random() * 280, dur: 800 + Math.random() * 380,
          hot: isDot || Math.random() < .05, ph: Math.random() * 6.283 };
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
  const targets = [...$$('.x-head, .scene, .pillars li, .steps li, .x-contact, .contact-row, .x-foot'), $('.venn')].filter(Boolean);
  if (!reduced) {
    targets.forEach(t => { if (!t.classList.contains('venn')) t.classList.add('reveal'); });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { threshold: .2 });
    targets.forEach(t => io.observe(t));
  } else targets.forEach(t => t.classList.add('on'));
  // сцены: замедленные ролики играют, только пока видны
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const vd = e.target;
    if (e.isIntersecting) { if (!vd.src) vd.src = media(vd.dataset.src); vd.play().catch(() => {}); } else vd.pause();
  }), { threshold: .25 });
  $$('.scene video').forEach(vd => reduced ? (vd.src = media(vd.dataset.src)) : vio.observe(vd));

  // шапка всегда сверху: на прокрутке получает подложку
  const top = $('.top');
  const solid = () => top.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', solid, { passive: true }); solid();
})();
