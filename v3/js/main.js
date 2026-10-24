/* =====================================================================
   AKM Studios — версия 3
   Интро (~5 с): ткань нейронов и потоки данных, частицы собирают логотип, в точках проступает живой кадр,
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

  // «расшифровка» текста: символы проступают из кода слева направо (вложенная разметка сохраняется)
  const GL = '01<>/[]{}=+*#ABCDEF0123456789';
  const decode = (el, ms = 900) => {
    if (reduced || !el) return;
    const parts = [], walk = n => n.nodeType === 3 ? (n.textContent.trim() && parts.push([n, n.textContent])) : n.childNodes.forEach(walk);
    walk(el);
    const total = parts.reduce((a, [, x]) => a + x.length, 0), s0 = performance.now();
    let last = 0;
    const step = now => {
      const k = Math.min(1, (now - s0) / ms);
      if (now - last > 40 || k === 1) {
        last = now;
        let left = Math.floor(k * total);
        parts.forEach(([n, x]) => {
          const keep = Math.max(0, Math.min(x.length, left)); left -= x.length;
          let out = x.slice(0, keep);
          for (let i = keep; i < x.length; i++) out += /\s/.test(x[i]) ? x[i] : GL[Math.random() * GL.length | 0];
          n.textContent = out;
        });
      }
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

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
      const dpr = api.dpr = mobile ? Math.min(2, devicePixelRatio || 1) : 1;   // сцене из точек ретина не нужна, а плавность важнее
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
      gc.filter = 'saturate(1.3) brightness(1.3)';   // фильтр на маленькой сетке, а не на весь экран
      gc.drawImage(src, 0, 0);
      gc.filter = 'none';
    };
    // сцена точками в любой контекст размером W×H (в пикселях устройства)
    api.paint = x => {
      x.imageSmoothingEnabled = false;
      x.drawImage(g, 0, 0, cols * api.cell, rows * api.cell);
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
    if (!/nnhold/.test(location.search)) setTimeout(fly, 1100);   // логотип с подписью успевает прочитаться
  };
  if (reduced) root.classList.add('ready');

  /* ---------- интро (~5 с): ткань нейронов и потоки данных → частицы садятся в точки логотипа → в точках проступает сцена ---------- */
  if (!reduced && neuro) {
    history.scrollRestoration = 'manual'; scrollTo(0, 0);
    const cv = $('.nn', neuro), ctx = cv.getContext('2d'), cap = $('.nn-cap', neuro);
    const T_MIX = 3000, T_END = 3500;   // мс: частицы на местах → в точках проступает кадр → логотип с роликом
    const QS = new URLSearchParams(location.search), T_OFF = +(QS.get('nnt') || 0), HOLD = QS.has('nnhold'); // для проверки: ?nnt=2000 — со 2-й секунды, &nnhold — замереть
    const INK = '241,238,232', GREY = '168,172,176', WEB = '196,200,204', GLYPHS = '01<>/[]{}=+*#ABCDEF0123456789';
    const MONO = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    const rnd = (a, b) => a + Math.random() * (b - a);
    const clamp = x => x < 0 ? 0 : x > 1 ? 1 : x;
    let W = 0, Hh = 0, dpr = 1, segs = [], paths = [], somas = [], parts = [], pulses = [], rain = [], labels = [];
    let t0 = 0, raf = 0, ended = false, dot = 2, drawn = 0, capT = 0, matT = 0, locks = [], mats = [];
    const hud = document.createElement('canvas'), hc = hud.getContext('2d');   // сетка координат — рисуется один раз
    const web = document.createElement('canvas'), wc = web.getContext('2d');   // ткань дорисовывается по мере роста
    const L = document.createElement('canvas'), lc = L.getContext('2d');       // сцена точками, вырезанная по буквам
    let mr = null;

    // ткань: тела клеток, извилистые ветвящиеся дендриты и длинные аксоны с утолщениями — как на снимках коннектома
    const build = () => {
      dpr = Math.min(1.5, devicePixelRatio || 1); W = innerWidth; Hh = innerHeight;
      cv.width = web.width = Math.round(W * dpr); cv.height = web.height = Math.round(Hh * dpr);
      wc.setTransform(dpr, 0, 0, dpr, 0, 0); wc.lineCap = 'round';
      segs = []; paths = []; somas = [];
      const branch = (x, y, a, w, n, t, depth, al) => {
        const pts = [[x, y]];
        for (let i = 0; i < n; i++) {
          a += rnd(-.45, .45);
          const st = rnd(5, 9), nx = x + Math.cos(a) * st, ny = y + Math.sin(a) * st, ww = w * Math.pow(1 - i / n, .7) + .35;
          segs.push({ x, y, nx, ny, w: ww, al: al * (1 - .5 * i / n), t: t + i * 9 });
          x = nx; y = ny; pts.push([x, y]);
          if (depth < 2 && Math.random() < .05) branch(x, y, a + rnd(-.9, .9), ww * .7, (n - i) * .7 | 0, t + i * 9, depth + 1, al);
        }
        if (pts.length > 8) paths.push(pts);
      };
      const N = mobile ? 24 : 54;
      for (let i = 0; i < N; i++) {
        const near = Math.random() < .3;   // ближний план крупнее и ярче, дальний — тонкий и тусклый
        const s = { x: rnd(-.05, 1.05) * W, y: rnd(-.05, 1.05) * Hh, r: near ? rnd(3.5, 6.5) : rnd(1.4, 3), al: near ? rnd(.26, .42) : rnd(.06, .16), t: rnd(0, 650) };
        somas.push(s);
        for (let d = 3 + (Math.random() * 4 | 0); d > 0; d--) branch(s.x, s.y, rnd(0, 6.283), s.r * .55, (mobile ? 22 : 32) + (Math.random() * 28 | 0), s.t, 0, s.al);
      }
      for (let i = 0; i < (mobile ? 3 : 6); i++) {
        let x = Math.random() < .5 ? -20 : W + 20, y = rnd(.1, .9) * Hh, a = x < 0 ? rnd(-.35, .35) : Math.PI + rnd(-.35, .35);
        const al = rnd(.14, .3), w0 = rnd(1.3, 3), t = rnd(100, 550), pts = [[x, y]];
        for (let k = 0; k < 400 && x > -40 && x < W + 40 && y > -40 && y < Hh + 40; k++) {
          a += rnd(-.12, .12);
          const nx = x + Math.cos(a) * 8, ny = y + Math.sin(a) * 8;
          segs.push({ x, y, nx, ny, w: w0 * (1 + .7 * Math.max(0, Math.sin(k * .21))), al, t: t + k * 3 });
          x = nx; y = ny; pts.push([x, y]);
        }
        paths.push(pts);
      }
      segs.sort((p, q) => p.t - q.t); drawn = 0;

      // потоки данных: заранее отрисованные колонки бинарного кода, дальше их только сдвигаем
      const FONT = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', LH = 13, NCH = 80;
      const strips = [...Array(6)].map(() => {
        const c = document.createElement('canvas'); c.width = Math.round(14 * dpr); c.height = Math.round(NCH * LH * dpr);
        const x = c.getContext('2d'); x.scale(dpr, dpr); x.font = FONT; x.textBaseline = 'top';
        for (let i = 0; i < NCH; i++) {
          x.fillStyle = `rgba(${INK},${rnd(.2, 1).toFixed(2)})`;
          x.fillText(Math.random() < .15 ? '0123456789ABCDEF'[Math.random() * 16 | 0] : Math.random() < .5 ? '0' : '1', 2, i * LH);
        }
        return c;
      });
      rain = [];
      for (let x = 8; x < W; x += mobile ? 22 : 26) if (Math.random() < .55)
        rain.push({ x, s: strips[Math.random() * strips.length | 0], h: NCH * LH, v: rnd(20, 70), o: rnd(0, NCH * LH), a: rnd(.05, .16) });

      // подписи данных у тел клеток: проявляются, «расшифровываясь» из символов
      const TXT = ['[512×768×3]', 'tensor<fp16>', '0x7F3A·91C2', 'w = 0.8137', 'Δ loss 0.0021', 'latent 64×64×4', 'seed 48213907',
        'attn · 32 heads', 'kv-cache 8192', '4.2M tokens', '01101011 10010110', 'σ(Wx + b)', 'frames 24/s', 'batch 256'];
      labels = somas.filter(s => s.al > .25 && s.x > 30 && s.x < W - 170 && s.y > 60 && s.y < Hh - 40)
        .slice(0, mobile ? 4 : 11).map((s, i) => ({ s, txt: TXT[i % TXT.length], t: s.t + rnd(250, 700), dx: rnd(20, 40), dy: -rnd(14, 30) }));

      // технические фрагменты: сетка координат с засечками, захваты целей, матрицы весов
      hud.width = cv.width; hud.height = cv.height; hc.setTransform(dpr, 0, 0, dpr, 0, 0);
      const step = mobile ? 90 : 120;
      hc.strokeStyle = `rgba(${GREY},.08)`; hc.lineWidth = 1; hc.setLineDash([1, 5]); hc.beginPath();
      for (let x = step; x < W; x += step) { hc.moveTo(x + .5, 0); hc.lineTo(x + .5, Hh); }
      for (let y = step; y < Hh; y += step) { hc.moveTo(0, y + .5); hc.lineTo(W, y + .5); }
      hc.stroke(); hc.setLineDash([]);
      hc.font = MONO; hc.textBaseline = 'top'; hc.fillStyle = `rgba(${GREY},.4)`;
      for (let x = step; x < W; x += step) { hc.fillRect(x, 0, 1, 5); if (!mobile) hc.fillText(String(x).padStart(4, '0'), x + 4, 6); }
      for (let y = step; y < Hh; y += step) { hc.fillRect(0, y, 5, 1); hc.fillText(String(y).padStart(4, '0'), 8, y + 4); }
      hc.fillStyle = `rgba(${GREY},.3)`;
      for (let x = step; x < W; x += step) for (let y = step; y < Hh; y += step) { hc.fillRect(x - 3, y, 7, 1); hc.fillRect(x, y - 3, 1, 7); }
      locks = somas.filter(s => s.x > 70 && s.x < W - 160 && s.y > 90 && s.y < Hh - 90 && Math.abs(s.y - Hh / 2) > 70)
        .slice(0, mobile ? 3 : 7).map(s => ({ s, t: rnd(350, 1700), id: 'N-' + (Math.random() * 9000 + 1000 | 0), p: rnd(.9, .999).toFixed(3) }));
      mats = (mobile ? [[16, Hh - 150]] : [[W - 200, 96], [24, Hh - 170]]).map(([x, y]) => ({ x, y, v: [] }));
    };

    const scramble = (txt, k) => {
      const n = Math.floor(k * txt.length);
      let out = txt.slice(0, n);
      for (let i = n; i < txt.length; i++) out += txt[i] === ' ' ? ' ' : GLYPHS[Math.random() * GLYPHS.length | 0];
      return out;
    };

    // новые отрезки ткани рисуем в постоянный холст пачками по толщине и яркости
    const growWeb = t => {
      if (drawn < segs.length && segs[drawn].t <= t) {
        const b = new Map();
        while (drawn < segs.length && segs[drawn].t <= t) {
          const s = segs[drawn++], k = (Math.min(15, Math.round(s.w * 3)) << 4) | Math.round(s.al * 10);
          (b.get(k) || b.set(k, []).get(k)).push(s);
        }
        b.forEach((list, k) => {
          wc.lineWidth = Math.max(.5, (k >> 4) / 3); wc.strokeStyle = `rgba(${WEB},${(k & 15) / 10})`;
          wc.beginPath(); list.forEach(s => { wc.moveTo(s.x, s.y); wc.lineTo(s.nx, s.ny); }); wc.stroke();
        });
      }
      somas.forEach(s => {
        if (s.done || s.t > t) return;
        s.done = 1;
        wc.fillStyle = `rgba(${WEB},${s.al * .12})`; wc.beginPath(); wc.arc(s.x, s.y, s.r * 2.6, 0, 6.283); wc.fill();
        wc.fillStyle = `rgba(${WEB},${s.al + .1})`; wc.beginPath(); wc.arc(s.x, s.y, s.r, 0, 6.283); wc.fill();
      });
    };

    // точки логотипа — ровно центры ячеек той же сетки, из которой потом собрана сцена
    const sampleLogo = () => new Promise(res => {
      const r = maskImg.getBoundingClientRect(), { cell } = vox, vd = vox.dpr;   // сетка сцены — в пикселях её холста
      const ox = r.left * vd, oy = r.top * vd, w = Math.round(r.width * vd), h = Math.round(r.height * vd);
      const img = new Image();
      img.onload = () => {
        try {
          const oc = document.createElement('canvas'); oc.width = w; oc.height = h;
          const o = oc.getContext('2d'); o.drawImage(img, 0, 0, w, h);
          const data = o.getImageData(0, 0, w, h).data, pts = [];
          for (let y = Math.floor(oy / cell); (y + .5) * cell < oy + h; y++) for (let x = Math.floor(ox / cell); (x + .5) * cell < ox + w; x++) {
            const cx = (x + .5) * cell, cy = (y + .5) * cell, lx = Math.floor(cx - ox), ly = Math.floor(cy - oy);
            if (lx >= 0 && ly >= 0 && data[(ly * w + lx) * 4 + 3] > 120) pts.push([cx / vd, cy / vd]);
          }
          // холст для сцены в буквах — только по размеру логотипа
          const x0 = Math.floor(ox / cell) * cell, y0 = Math.floor(oy / cell) * cell;
          L.width = Math.ceil((ox + w - x0) / cell) * cell; L.height = Math.ceil((oy + h - y0) / cell) * cell;
          mr = { img, x0, y0, ox: ox - x0, oy: oy - y0, w, h };
          res(pts);
        } catch (e) { res([]); }
      };
      img.onerror = () => res([]);
      img.src = maskImg.currentSrc || maskImg.src;
    });

    const frame = now => {
      if (!t0) t0 = now;
      const t = HOLD ? Math.min(T_OFF, T_END - 1) : now - t0 + T_OFF;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, Hh);

      // 1) потоки бинарного кода
      const fRain = clamp(t / 500) * (1 - clamp((t - 2000) / 1000));
      if (fRain > 0) rain.forEach(c => {
        const y = (c.o + t * c.v / 1000) % c.h - c.h;
        ctx.globalAlpha = c.a * fRain;
        for (let yy = y; yy < Hh; yy += c.h) ctx.drawImage(c.s, c.x, yy, 14, c.h);
      });
      ctx.globalAlpha = 1;

      // 1б) технические фрагменты поверх: сетка, скан-линия, захваты целей, матрицы, графики, служебные строки
      const fTech = clamp(t / 400) * (1 - clamp((t - 2500) / 600));
      if (fTech > 0) {
        ctx.globalAlpha = fTech; ctx.drawImage(hud, 0, 0, W, Hh);
        ctx.font = MONO; ctx.textBaseline = 'top'; ctx.lineWidth = 1;
        const sx = (t % 1800) / 1800 * W;
        ctx.fillStyle = `rgba(${GREY},.16)`; ctx.fillRect(sx, 0, 1, Hh);
        ctx.fillStyle = `rgba(${GREY},.6)`; ctx.fillText('x ' + String(sx | 0).padStart(4, '0'), sx + 5, 22);
        locks.forEach(l => {
          const k = clamp((t - l.t) / 380);
          if (!k) return;
          const r = 30 - 16 * ease(k), { x, y } = l.s;
          ctx.strokeStyle = k < 1 ? `rgba(${GREY},.7)` : 'rgba(240,122,74,.8)'; ctx.beginPath();
          [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([dx, dy]) => { const cx = x + dx * r, cy = y + dy * r; ctx.moveTo(cx, cy - dy * 5); ctx.lineTo(cx, cy); ctx.lineTo(cx - dx * 5, cy); });
          ctx.stroke();
          if (k === 1) { ctx.fillStyle = `rgba(${GREY},.8)`; ctx.fillText(l.id + ' · ' + l.p, x + r + 6, y - r); }
        });
        if (now - matT > 110) {
          matT = now;
          mats.forEach(m => { m.v = [...Array(5)].map(() => [...Array(4)].map(() => { const v = Math.random() * 2 - 1; return (v < 0 ? '-' : ' ') + Math.abs(v).toFixed(2).slice(1); }).join('  ')); });
        }
        ctx.fillStyle = `rgba(${GREY},.55)`;
        mats.forEach((m, i) => {
          ctx.fillText(`W${i + 1} · layer ${12 + i * 7} · 4×5`, m.x, m.y);
          m.v.forEach((row, j) => ctx.fillText(row, m.x + 6, m.y + 16 + j * 12));
          ctx.fillRect(m.x, m.y + 14, 1, 62); ctx.fillRect(m.x, m.y + 14, 4, 1); ctx.fillRect(m.x, m.y + 75, 4, 1);
        });
        const tc = Math.floor(t / 1000 * 24);
        ctx.fillText('AKM · NEURAL RENDER', 24, mobile ? 64 : 30); ctx.fillText(`PASS ${String(1 + (t / 500 | 0)).padStart(2, '0')} / 07 · SAMPLES 4096 · FP16`, 24, mobile ? 78 : 44);
        if (!mobile) {
          ctx.textAlign = 'right';
          ctx.fillText(`TC 00:00:${String(tc / 24 | 0).padStart(2, '0')}:${String(tc % 24).padStart(2, '0')}`, W - 24, 30);
          ctx.fillText('24.000 FPS · 2.39:1', W - 24, 44); ctx.textAlign = 'left';
          // гистограмма активаций
          const hx = W - 270, hb = Hh - 34;
          ctx.fillText('activations', hx, hb - 58);
          for (let i = 0; i < 36; i++) {
            const h = 6 + 38 * Math.abs(Math.sin(t / 260 + i * .7) * Math.sin(i * 1.7 + t / 900));
            ctx.fillRect(hx + i * 7, hb - h, 4, h);
          }
          ctx.fillRect(hx, hb + 3, 250, 1);
          // осциллограмма сигнала
          const wx = 200, wb = Hh - 54;
          ctx.fillText('signal · 48 kHz', wx, wb - 32);
          ctx.strokeStyle = `rgba(${GREY},.55)`; ctx.beginPath();
          for (let i = 0; i <= 160; i++) { const y = wb + Math.sin(i * .19 + t / 110) * 12 * Math.sin(i * .035 + t / 600); i ? ctx.lineTo(wx + i * 1.8, y) : ctx.moveTo(wx, y); }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // 2) ткань нейронов растёт, по ней бегут сигналы; когда частицы срываются — ткань гаснет
      growWeb(t);
      const fWeb = 1 - clamp((t - 1700) / 1200);
      if (fWeb > 0) {
        ctx.globalAlpha = fWeb; ctx.drawImage(web, 0, 0, W, Hh); ctx.globalAlpha = 1;
        if (t > 500 && t < 2400) for (let k = 0; k < (mobile ? 2 : 4); k++) pulses.push({ p: paths[Math.random() * paths.length | 0], t: t, v: rnd(.05, .11) });
        pulses = pulses.filter(pu => (t - pu.t) * pu.v < pu.p.length - 1);
        const glow = new Path2D(), core = new Path2D();
        pulses.forEach(pu => {
          const f = (t - pu.t) * pu.v, i = f | 0, a = pu.p[i], b = pu.p[i + 1], e = f - i;
          const x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e;
          glow.rect(x - 3, y - 3, 6, 6); core.rect(x - 1.1, y - 1.1, 2.2, 2.2);
        });
        ctx.fillStyle = `rgba(${INK},${.12 * fWeb})`; ctx.fill(glow);
        ctx.fillStyle = `rgba(255,255,255,${.95 * fWeb})`; ctx.fill(core);

        // подписи данных с выноской
        const fLab = 1 - clamp((t - 1800) / 600);
        if (fLab > 0) {
          ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'; ctx.textBaseline = 'middle';
          ctx.lineWidth = .6;
          labels.forEach(l => {
            const k = clamp((t - l.t) / 450);
            if (!k) return;
            const x = l.s.x + l.dx, y = l.s.y + l.dy;
            ctx.strokeStyle = `rgba(${INK},${.35 * fLab * k})`;
            ctx.beginPath(); ctx.moveTo(l.s.x, l.s.y); ctx.lineTo(x - 4, y); ctx.lineTo(x + 6 + l.txt.length * 6.1 * k, y); ctx.stroke();
            ctx.fillStyle = `rgba(${INK},${.75 * fLab})`;
            ctx.fillText(scramble(l.txt, k), x + 2, y - 7);
          });
        }
      }

      // 3) частицы срываются с ткани и садятся в точки логотипа (волной слева направо); рисуем пачками
      const mix = clamp((t - T_MIX) / (T_END - T_MIX));
      if (mix < 1) {
        const P = [new Path2D(), new Path2D(), new Path2D(), new Path2D(), new Path2D(), new Path2D()];
        const sF = dot * 1.35, sS = dot;
        parts.forEach(p => {
          const k = clamp((t - p.ts) / p.dur);
          if (!k) return;
          const e = ease(k), u = 1 - e;
          const x = u * u * p.sx + 2 * u * e * p.cx + e * e * p.tx, y = u * u * p.sy + 2 * u * e * p.cy + e * e * p.ty;
          if (k < 1) P[p.g].rect(x - sF / 2, y - sF / 2, sF, sF); else P[3 + p.g].rect(x - sS / 2, y - sS / 2, sS, sS);
        });
        const lv = [.32, .52, .78];
        for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(${INK},${lv[i % 3] * (1 - mix)})`; ctx.fill(P[i]); }
      }

      // 4) в точках проступает живой кадр ролика — ровно то, что дальше покажет логотип
      if (mix > 0 && mr) {
        vox.start();                      // сцена в карточке начинает рисоваться заранее, под оверлеем
        vox.grab();
        lc.setTransform(1, 0, 0, 1, -mr.x0, -mr.y0);
        lc.globalCompositeOperation = 'source-over'; lc.clearRect(mr.x0, mr.y0, L.width, L.height); vox.paint(lc);
        lc.setTransform(1, 0, 0, 1, 0, 0);
        lc.globalCompositeOperation = 'destination-in'; lc.drawImage(mr.img, mr.ox, mr.oy, mr.w, mr.h);
        const k = dpr / vox.dpr;
        ctx.setTransform(k, 0, 0, k, 0, 0); ctx.globalAlpha = mix; ctx.drawImage(L, mr.x0, mr.y0); ctx.globalAlpha = 1;
      }

      // 5) подпись под логотипом расшифровывается из символов
      if (cap && t > 2300 && now - capT > 45) {
        capT = now;
        cap.textContent = scramble(cap.dataset.text, clamp((t - 2300) / 1100));
        cap.style.opacity = clamp((t - 2300) / 300);
      }

      if (t >= T_END) return finish();
      raf = requestAnimationFrame(frame);
    };

    const finish = () => {
      if (ended) return;
      ended = true; cancelAnimationFrame(raf);
      showLogo();                         // под оверлеем уже та же картинка — подмена незаметна
      // картинки под оверлеем и на нём совпадают — убираем его сразу, без перехода (переход давал рывок кадра)
      neuro.style.display = 'none'; cv.width = cv.height = web.width = web.height = L.width = L.height = 0;
      setTimeout(() => neuro.remove(), 2500);
    };
    if (HOLD) window.nnFinish = finish;

    vox.size();
    dot = vox.cell / vox.dpr * .74;
    build();
    if (cap) {   // подпись в оверлее — ровно на месте подписи логотипа
      const en = $('.intro-en', intro), r = en.getBoundingClientRect();
      cap.dataset.text = en.textContent;
      Object.assign(cap.style, { top: r.top + 'px', left: r.left + 'px', width: r.width + 'px' });
    }
    sampleLogo().then(pts => {
      if (!pts.length) { finish(); return; }
      parts = pts.map(([tx, ty]) => {
        const pa = paths[Math.random() * paths.length | 0], q = pa[Math.random() * pa.length | 0];
        const sx = q[0], sy = q[1], mx = (sx + tx) / 2, my = (sy + ty) / 2, o = (Math.random() - .5) * 260;
        return { sx, sy, tx, ty, cx: mx - (ty - sy) * o / 600, cy: my + (tx - sx) * o / 600,
          ts: 1000 + (tx / W) * 850 + Math.random() * 250, dur: 750 + Math.random() * 350, g: Math.random() * 3 | 0 };
      });
      raf = requestAnimationFrame(frame);
    });
    addEventListener('resize', () => { if (!ended) finish(); }, { once: true });
  }

  /* ---------- ИИ-строка (как в версии 1) ---------- */
  const SHOTS = [
    { t: 0, name: 'Орбита', seed: 48213907, iter: 186, takes: 64 },
    { t: 2.8, name: 'Город под зонтами', seed: 73920184, iter: 214, takes: 41 },
    { t: 4.8, name: 'Двор в гирляндах', seed: 15887302, iter: 162, takes: 37 },
    { t: 6.96, name: 'Созвездие', seed: 90461178, iter: 248, takes: 52 },
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
        nEl.textContent = '0' + (i + 1); nameEl.textContent = s.name; decode(nameEl, 700);
        seedEl.textContent = s.seed; countUp(iterEl, s.iter); countUp(takesEl, s.takes, 700);
      }
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  }

  /* ---------- схема «команда ∩ AI-продакшен»: кольца из нейронов, по ним бегут сигналы,
     на пересечении из частиц собирается логотип ---------- */
  const vbox = $('.venn-box');
  if (vbox) {
    const vc = $('.venn-nn', vbox), x = vc.getContext('2d'), logo = $('.venn-logo', vbox);
    const INK = '241,238,232', T_LOGO = 3000;
    let sc = 1, d = 1, VW = 0, VH = 0, rings = [], chords = [], parts = [], pulses = [], t0 = 0, vis = false, raf = 0, ready = false;
    const build = () => new Promise(res => {
      const r = vbox.getBoundingClientRect();
      d = Math.min(2, devicePixelRatio || 1); VW = r.width; VH = r.height; sc = VW / 720;
      vc.width = Math.round(VW * d); vc.height = Math.round(VH * d);
      const N = mobile ? 90 : 130;
      rings = [[260, 210], [460, 210]].map(([cx, cy], k) => { const ph = Math.random() * 6.283; return [...Array(N)].map((_, i) => {
        const a = i / N * 6.283 - 1.571, rr = 190 + Math.sin(a * 6 + ph) * 2.5 + (Math.random() - .5) * 1.6;   // мягкая «живая» волна, без зубцов
        return { x: (cx + Math.cos(a) * rr) * sc, y: (cy + Math.sin(a) * rr) * sc, b: k * 450 + i / N * 1500, big: Math.random() < .1 };
      }); });
      chords = [];
      for (let i = 0; i < 70; i++) {
        const a = rings[0][Math.random() * N | 0], b = rings[1][Math.random() * N | 0];
        if (Math.hypot(a.x - b.x, a.y - b.y) < 230 * sc) chords.push([a, b, Math.max(a.b, b.b) + 300]);
      }
      // точки логотипа с его цветами (оранжевая точка, светлые буквы)
      const lr = logo.getBoundingClientRect(), w = Math.round(lr.width * d), h = Math.round(lr.height * d);
      const ox = lr.left - r.left, oy = lr.top - r.top, img = new Image();
      img.onload = () => {
        try {
          const oc = document.createElement('canvas'); oc.width = w; oc.height = h;
          const o = oc.getContext('2d'); o.drawImage(img, 0, 0, w, h);
          const dt = o.getImageData(0, 0, w, h).data, all = rings[0].concat(rings[1]);
          parts = [];
          for (let y = 0; y < h; y += d) for (let xx = 0; xx < w; xx += d) {
            const i = (y * w + xx) * 4;
            if (dt[i + 3] < 130) continue;
            const s = all[Math.random() * all.length | 0], tx = ox + xx / d, ty = oy + y / d;
            const o2 = (Math.random() - .5) * 120;
            parts.push({ sx: s.x, sy: s.y, tx, ty, cx: (s.x + tx) / 2 - (ty - s.y) * o2 / 300, cy: (s.y + ty) / 2 + (tx - s.x) * o2 / 300,
              ts: 1700 + Math.random() * 700, dur: 700 + Math.random() * 450, hot: dt[i] - dt[i + 2] > 60 });
          }
        } catch (e) { parts = []; }
        res();
      };
      img.onerror = () => res();
      img.src = logo.currentSrc || logo.src;
    });

    const draw = now => {
      if (!t0) t0 = now;
      const t = reduced ? 1e5 : now - t0;
      x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, VW, VH);
      // связи между кольцами — синапсы на пересечении
      x.lineWidth = .6; x.strokeStyle = `rgba(${INK},.07)`; x.beginPath();
      chords.forEach(([a, b, tb]) => { const k = Math.min(1, Math.max(0, (t - tb) / 500)); if (k) { x.moveTo(a.x, a.y); x.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k); } });
      x.stroke();
      // кольца нейронов вырастают по кругу
      x.lineWidth = 1; x.strokeStyle = `rgba(${INK},.5)`;
      const dots = new Path2D(), bigs = new Path2D();
      rings.forEach(ring => {
        x.beginPath();
        ring.forEach((n, i) => {
          if (t < n.b) return;
          const p = ring[(i + ring.length - 1) % ring.length];
          if (t >= p.b) { x.moveTo(p.x, p.y); x.lineTo(n.x, n.y); }
          if (n.big) { bigs.moveTo(n.x + 2.2, n.y); bigs.arc(n.x, n.y, 2.2, 0, 6.283); } else dots.rect(n.x - .8, n.y - .8, 1.6, 1.6);
        });
        x.stroke();
      });
      x.fillStyle = `rgba(${INK},.9)`; x.fill(dots); x.fill(bigs);
      // сигналы бегут по кольцам
      if (t > 1400 && Math.random() < .12) pulses.push({ r: Math.random() * 2 | 0, s: Math.random(), v: (Math.random() < .5 ? 1 : -1) * (.00012 + Math.random() * .00012), t });
      pulses = pulses.filter(p => t - p.t < 2600);
      const glow = new Path2D(), core = new Path2D();
      pulses.forEach(p => {
        const ring = rings[p.r], f = ((p.s + (t - p.t) * p.v) % 1 + 1) % 1 * ring.length, i = f | 0, a = ring[i], b = ring[(i + 1) % ring.length], e = f - i;
        const px = a.x + (b.x - a.x) * e, py = a.y + (b.y - a.y) * e;
        glow.rect(px - 3.5, py - 3.5, 7, 7); core.rect(px - 1.3, py - 1.3, 2.6, 2.6);
      });
      x.fillStyle = `rgba(${INK},.14)`; x.fill(glow); x.fillStyle = '#fff'; x.fill(core);
      // частицы стекают с колец и собирают логотип; на месте — подменяются настоящим логотипом
      const fade = 1 - Math.min(1, Math.max(0, (t - T_LOGO) / 600));
      if (fade > 0 && parts.length) {
        const cold = new Path2D(), hot = new Path2D();
        parts.forEach(p => {
          const k = Math.min(1, Math.max(0, (t - p.ts) / p.dur));
          if (!k) return;
          const e = ease(k), u = 1 - e, px = u * u * p.sx + 2 * u * e * p.cx + e * e * p.tx, py = u * u * p.sy + 2 * u * e * p.cy + e * e * p.ty;
          (p.hot ? hot : cold).rect(px - .9, py - .9, 1.8, 1.8);
        });
        x.globalAlpha = fade; x.fillStyle = `rgb(${INK})`; x.fill(cold); x.fillStyle = '#F07A4A'; x.fill(hot); x.globalAlpha = 1;
      }
      if (t >= T_LOGO) logo.classList.add('on');
      if (vis && !reduced) raf = requestAnimationFrame(draw);
    };
    const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
    new IntersectionObserver(es => es.forEach(e => {
      vis = e.isIntersecting;
      if (!vis) return cancelAnimationFrame(raf);
      if (!ready) { ready = true; build().then(start); } else start();
    }), { threshold: .3 }).observe(vbox);
    addEventListener('resize', () => { if (ready) { const tt = t0; build().then(() => { t0 = tt; start(); }); } });
  }

  /* ---------- блоки ниже: нейро-появление ----------
     крупное (заголовки, ролики, абзацы) проявляется точками-«нейронами» волной слева направо,
     мелкие подписи расшифровываются из символов, по линиям пробегает сигнал */
  const NX = '.x-h2, .scene-v, .scene p, .pillars li, .steps li, .x-contact, .contact-row, .x-foot img';
  const DEC = '.x-kicker, .x-note, .scene-t b, .scene-tag, .pillars b, .steps b, .x-foot p span';
  const nxEls = $$(NX), decEls = $$(DEC), venn = $('.venn');
  if (!reduced) {
    nxEls.forEach(t => t.classList.add('nx'));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target; io.unobserve(el);
      if (el.classList.contains('nx')) { el.classList.add('on'); setTimeout(() => el.classList.add('nx-done'), 2100); }
      else if (el === venn) el.classList.add('on');
      else decode(el, 800 + el.textContent.length * 12);
    }), { threshold: .2 });
    [...nxEls, ...decEls, venn].filter(Boolean).forEach(t => io.observe(t));
    // герой после влёта: маска точек снимается, когда проявление закончилось
    $$('.card .in').forEach(el => el.addEventListener('animationend', () => el.classList.add('nx-done'), { once: true }));
  } else venn && venn.classList.add('on');
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
