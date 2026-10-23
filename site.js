/* ===== Simple Life Games site =====
   EDIT HERE: your contact details and links. Every page reads them from this one place. */
const SITE = {
  email: 'you@example.com',                                                            // <- put your contact email here
  discord: 'https://discord.gg/74Zpkr4ST',
  youtube: 'https://www.youtube.com/@simplelifegames',
  testerGroup: 'https://groups.google.com/g/ninja-rooftops-testers',
  playTesting: 'https://play.google.com/apps/testing/com.simplelifegames.ninjarooftops',   // closed-beta opt-in page
  playStore: 'https://play.google.com/store/apps/details?id=com.simplelifegames.ninjarooftops'
};

(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- links, contact, year ----------
  document.querySelectorAll('[data-link]').forEach(a => { const v = SITE[a.dataset.link]; if (v) { a.href = v; a.target = '_blank'; a.rel = 'noopener'; } });
  document.querySelectorAll('[data-email]').forEach(el => { el.textContent = SITE.email; if (el.tagName === 'A') el.href = 'mailto:' + SITE.email; });
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll('.copy-btn').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(SITE.email); b.textContent = 'Copied'; }
    catch (e) { const r = document.createRange(), t = document.querySelector('[data-email]'); if (t) { r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } b.textContent = 'Selected'; }
    setTimeout(() => { b.textContent = 'Copy'; }, 1600);
  }));

  // ---------- header: solid once you scroll, mobile menu ----------
  const header = document.querySelector('.site-header'), btn = document.querySelector('.menu-btn');
  const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (btn) {
    btn.addEventListener('click', () => { const open = header.classList.toggle('menu-open'); btn.setAttribute('aria-expanded', open); });
    header.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => { header.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); }));
  }

  // ---------- entrance animations, only for things that start below the first screen ----------
  const rev = [...document.querySelectorAll('.reveal')];
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); e.target.classList.remove('pre'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
    rev.forEach((el, i) => { if (el.getBoundingClientRect().top > innerHeight * 0.92) { el.style.setProperty('--d', (el.dataset.d || 0) + 's'); el.classList.add('pre'); io.observe(el); } });
  }

  // ---------- gentle parallax on the home hero ----------
  const par = [...document.querySelectorAll('[data-par]')];
  if (par.length && !reduce) {
    let ticking = false;
    addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { const y = scrollY; par.forEach(el => { el.style.translate = `0 ${y * +el.dataset.par}px`; }); ticking = false; }); }, { passive: true });
  }

  // ---------- YouTube slots: paste an ID or link into data-yt="" ----------
  document.querySelectorAll('.video').forEach(v => {
    const raw = (v.dataset.yt || '').trim(), m = raw.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/), id = m ? m[1] : (/^[\w-]{11}$/.test(raw) ? raw : '');
    const f = v.querySelector('.frame');
    if (id) f.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${v.querySelector('figcaption').firstChild.textContent.trim()}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    else f.innerHTML = `<a class="ph" data-link="youtube" href="${SITE.youtube}" target="_blank" rel="noopener"><span class="play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span><span>Coming soon on YouTube</span></a>`;
  });

  /* ---------- the rooftop scene: real Ninja Rooftops ninjas running and leaping across a dusk skyline ----------
     Sprite sheets come straight from the game: 10 cells of 192x192 (8 run frames, 2 air frames), ninja centre at (124, 100). */
  const SHEETS = {}; const sheet = n => SHEETS[n] || (SHEETS[n] = Object.assign(new Image(), { src: `ninja${n}.png` }));
  function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function scene(cv) {
    const g = cv.getContext('2d'), ids = (cv.dataset.ninjas || '0,1,3').split(',').map(Number), dense = cv.dataset.size === 'big';
    let W = 0, H = 0, dpr = 1, k = 1, cam = 0, roofs = [], ninjas = [], puffs = [], stars = [], R = rng(7), last = 0, run = true, visible = true;
    const GRAV = () => 4200 * k, SPEED = () => 230 * k;
    function size() {
      const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; k = Math.max(0.55, Math.min(1.25, H / 620));
      stars = Array.from({ length: Math.round(W * H / 5000) }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.6, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6 }));
      if (!roofs.length) reset();
    }
    function addRoof() {
      const prev = roofs[roofs.length - 1], base = H * (dense ? 0.74 : 0.72);
      const x = prev ? prev.x + prev.w + (40 + R() * 52) * k : -40, w = (160 + R() * 200) * k;
      const top = Math.max(H * 0.56, Math.min(H * 0.84, (prev ? prev.top : base) + (R() - 0.5) * 70 * k));
      roofs.push({ x, w, top, win: Array.from({ length: 40 }, () => R() < 0.42), hue: R() });
    }
    function reset() {
      roofs = []; cam = 0; while (!roofs.length || roofs[roofs.length - 1].x < W + 800) addRoof();
      ninjas = ids.map((id, i) => ({ id, sx: W * (dense ? [0.52, 0.68, 0.84][i % 3] : [0.28, 0.5, 0.72][i % 3]), y: 0, vy: 0, air: false, spin: 0, spinV: 0, ph: i * 2.1, landed: 0 }));
      ninjas.forEach(n => { const r = roofAt(cam + n.sx); n.y = r ? r.top : H * 0.7; });
    }
    const roofAt = wx => roofs.find(r => wx >= r.x && wx <= r.x + r.w);
    const nextRoof = wx => roofs.find(r => r.x > wx);
    function step(dt) {
      cam += SPEED() * dt;
      while (roofs[0] && roofs[0].x + roofs[0].w < cam - 300) roofs.shift();
      while (roofs[roofs.length - 1].x < cam + W + 800) addRoof();
      for (const n of ninjas) {
        const wx = cam + n.sx; n.ph += dt * 13;
        if (!n.air) {
          const r = roofAt(wx);
          if (!r) { n.air = true; n.vy = 0; continue; }
          n.y = r.top;
          const edge = r.x + r.w - wx, nx = nextRoof(wx);
          if (nx && (edge < 26 * k || (edge > 120 * k && R() < dt * 0.25))) {      // leap to the next roof (and now and then a little hop for style)
            const hop = edge >= 26 * k, target = hop ? wx + 80 * k : nx.x + Math.min(34 * k, nx.w * 0.25), ty = hop ? r.top : nx.top;
            const T = Math.max(0.32, (target - wx) / SPEED()), vy = (ty - n.y - 0.5 * GRAV() * T * T) / T;
            n.air = true; n.vy = vy; n.spin = 0; n.spinV = !hop && T > 0.5 && R() < 0.55 ? (Math.PI * 2) / T * (R() < 0.3 ? 2 : 1) : 0;
          }
        } else {
          n.vy += GRAV() * dt; const ny = n.y + n.vy * dt, r = roofAt(wx);
          if (r && n.vy > 0 && n.y <= r.top + 2 && ny >= r.top) { n.y = r.top; n.air = false; n.spin = 0; n.spinV = 0; n.landed = 1; puffs.push({ x: wx, y: r.top, t: 0 }); }
          else n.y = ny;
          n.spin += n.spinV * dt;
          if (n.y > H + 120) { const rr = roofAt(wx) || nextRoof(wx); n.y = rr ? rr.top - 300 : 0; n.vy = 0; }
        }
        n.landed = Math.max(0, n.landed - dt * 4);
      }
      puffs.forEach(p => p.t += dt); puffs = puffs.filter(p => p.t < 0.5);
    }
    function skyline(par, base, hgt, col, seed, win) {
      const r = rng(seed), off = (cam * par) % 2400;
      g.fillStyle = col;
      for (let x = -off - 200, i = 0; x < W + 200; i++) {
        const w = (60 + r() * 90) * k, h = (hgt * (0.5 + r() * 0.6)) * k;
        g.fillRect(x, base - h, w, H - base + h);
        if (r() < 0.45) { g.beginPath(); g.moveTo(x - 8 * k, base - h); g.quadraticCurveTo(x + w / 2, base - h - 26 * k, x + w + 8 * k, base - h); g.fill(); }
        if (win) { g.fillStyle = 'rgba(255,207,107,.55)'; for (let wy = base - h + 16 * k; wy < base - 8; wy += 22 * k) for (let wx2 = x + 10 * k; wx2 < x + w - 12 * k; wx2 += 18 * k) if (r() < 0.22) g.fillRect(wx2, wy, 6 * k, 9 * k); g.fillStyle = col; }
        x += w + (6 + r() * 30) * k;
      }
    }
    function drawRoof(r, x) {
      const w = r.w, top = r.top, wall = '#1a1030';
      g.fillStyle = wall; g.fillRect(x + 8 * k, top, w - 16 * k, H - top + 4);
      g.fillStyle = 'rgba(52,38,106,.9)'; g.fillRect(x + 8 * k, top, 6 * k, H - top);
      let i = 0;
      for (let wy = top + 28 * k; wy < H; wy += 34 * k) for (let wx2 = x + 26 * k; wx2 < x + w - 34 * k; wx2 += 30 * k) { const on = r.win[i++ % 40]; g.fillStyle = on ? '#ffcf6b' : '#251a4a'; g.fillRect(wx2, wy, 12 * k, 16 * k); if (on) { g.fillStyle = 'rgba(255,207,107,.18)'; g.fillRect(wx2 - 4 * k, wy - 4 * k, 20 * k, 24 * k); } }
      // tiled roof cap with curled eaves, same palette as the game's first world
      g.fillStyle = '#9c2f36'; g.beginPath(); g.moveTo(x - 6 * k, top + 6 * k); g.lineTo(x + w + 6 * k, top + 6 * k); g.lineTo(x + w - 6 * k, top + 16 * k); g.lineTo(x + 6 * k, top + 16 * k); g.fill();
      g.fillStyle = '#c2453d'; g.beginPath(); g.moveTo(x - 14 * k, top - 4 * k); g.quadraticCurveTo(x - 4 * k, top + 6 * k, x + 6 * k, top + 8 * k); g.lineTo(x + w - 6 * k, top + 8 * k); g.quadraticCurveTo(x + w + 4 * k, top + 6 * k, x + w + 14 * k, top - 4 * k); g.lineTo(x + w, top); g.lineTo(x, top); g.closePath(); g.fill();
      g.fillStyle = '#e8715f'; g.fillRect(x, top - 1, w, 3 * k);
      g.strokeStyle = 'rgba(90,20,30,.35)'; g.lineWidth = 1.2; for (let tx = x + 8 * k; tx < x + w; tx += 12 * k) { g.beginPath(); g.moveTo(tx, top + 1); g.lineTo(tx - 2 * k, top + 8 * k); g.stroke(); }
    }
    function draw(t) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#150b38'); sky.addColorStop(0.55, '#5a2a7a'); sky.addColorStop(1, '#ff8a5c'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      for (const s of stars) { g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + s.p)); g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); }
      g.globalAlpha = 1;
      const mx = W * (dense ? 0.78 : 0.82), my = H * 0.2, mr = 46 * k;
      const mg = g.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3.2); mg.addColorStop(0, 'rgba(255,246,216,.45)'); mg.addColorStop(1, 'rgba(255,246,216,0)'); g.fillStyle = mg; g.fillRect(0, 0, W, H);
      g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(mx, my, mr, 0, 7); g.fill(); g.fillStyle = 'rgba(210,196,170,.6)'; [[-.3, -.2, .22], [.25, .15, .16], [-.05, .38, .12]].forEach(([a, b, c]) => { g.beginPath(); g.arc(mx + a * mr, my + b * mr, c * mr, 0, 7); g.fill(); });
      skyline(0.15, H * 0.62, 150, '#4a2766', 11, false);
      skyline(0.4, H * 0.7, 120, '#2a1450', 23, true);
      for (const r of roofs) { const x = r.x - cam; if (x < W + 40 && x + r.w > -40) drawRoof(r, x); }
      for (const p of puffs) { const a = 1 - p.t / 0.5; g.fillStyle = `rgba(255,236,210,${0.6 * a})`; for (const d of [-1, 1]) { g.beginPath(); g.arc(p.x - cam + d * (8 + p.t * 60) * k, p.y - 4 * k - p.t * 10 * k, (4 + p.t * 10) * k, 0, 7); g.fill(); } }
      const sc = 0.62 * k * (dense ? 1.2 : 1);
      for (const n of ninjas) {
        const img = sheet(n.id); if (!img.complete || !img.naturalWidth) continue;
        const f = n.air ? (n.vy < 0 ? 8 : 9) : Math.floor(n.ph) % 8, squash = n.landed;
        g.save(); g.translate(n.sx, n.y - 33 * sc); g.rotate(n.spin); g.scale(1 + squash * 0.18, 1 - squash * 0.15);
        g.drawImage(img, f * 192, 0, 192, 192, -124 * sc, -100 * sc, 192 * sc, 192 * sc); g.restore();
      }
    }
    function loop(ts) {
      if (!run) return;
      const t = ts / 1000, dt = Math.min(0.05, last ? t - last : 0.016); last = t;
      if (visible) { step(dt); draw(t); }
      requestAnimationFrame(loop);
    }
    if (dense) {                                              // tap the night scene: every ninja on a roof leaps with a flip
      cv.style.cursor = 'pointer';
      cv.addEventListener('pointerdown', () => {
        let any = false;
        for (const n of ninjas) { if (n.air) continue; const wx = cam + n.sx, r = roofAt(wx), nx = nextRoof(wx); if (!r) continue;
          const edge = r.x + r.w - wx, target = edge > 140 * k ? wx + 120 * k : nx ? nx.x + Math.min(34 * k, nx.w * 0.25) : wx + 60 * k, ty = edge > 140 * k ? r.top : nx ? nx.top : r.top;
          const T = Math.max(0.45, (target - wx) / SPEED()), vy = (ty - n.y - 0.5 * GRAV() * T * T) / T;
          n.air = true; n.vy = vy; n.spinV = Math.PI * 2 / T; n.spin = 0; any = true; }
        if (any && window.SLG_FX) window.SLG_FX('leap');
      });
    }
    size(); addEventListener('resize', () => { const oldW = W; size(); if (Math.abs(W - oldW) > 40) reset(); });
    ids.forEach(sheet);
    if (reduce) { Promise.all(ids.map(i => new Promise(r => { const im = sheet(i); im.complete ? r() : (im.onload = r); }))).then(() => { step(0.016); draw(1); }); return; }
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) last = 0; }).observe(cv);
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = 0; });
    requestAnimationFrame(loop);
  }
  document.querySelectorAll('canvas.rooftops').forEach(scene);

  // ---------- privacy page: highlight the section you're reading ----------
  const toc = document.querySelectorAll('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    const map = new Map([...toc].map(a => [a.getAttribute('href').slice(1), a]));
    const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { toc.forEach(a => a.classList.remove('on')); const a = map.get(e.target.id); if (a) a.classList.add('on'); } }), { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((a, id) => { const el = document.getElementById(id); if (el) io2.observe(el); });
  }

  // ---------- roster cards: each ninja runs on the spot ----------
  document.querySelectorAll('canvas.runner').forEach(cv => {
    const g = cv.getContext('2d'), img = sheet(+cv.dataset.n), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = 160 * dpr; cv.height = 110 * dpr;
    let vis = true; new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(cv);
    const off = Math.random() * 8;
    const frame = ts => {
      if (vis && img.complete && img.naturalWidth) {
        const f = reduce ? 0 : Math.floor(ts / 70 + off) % 8;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, 160, 110);
        g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(96, 94, 30, 6, 0, 0, 7); g.fill();
        g.drawImage(img, f * 192, 0, 192, 192, 96 - 124 * 0.9, 60 - 100 * 0.9, 192 * 0.9, 192 * 0.9);
      }
      if (!reduce) requestAnimationFrame(frame);
    };
    img.complete ? requestAnimationFrame(frame) : img.addEventListener('load', () => requestAnimationFrame(frame));
  });
})();
