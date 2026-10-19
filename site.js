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

  // links and contact details from SITE
  document.querySelectorAll('[data-link]').forEach(a => { const v = SITE[a.dataset.link]; if (v) { a.href = v; a.target = '_blank'; a.rel = 'noopener'; } });
  document.querySelectorAll('[data-email]').forEach(el => { el.textContent = SITE.email; if (el.tagName === 'A') el.href = 'mailto:' + SITE.email; });
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll('.copy-btn').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(SITE.email); b.textContent = 'Copied'; }
    catch (e) { const r = document.createRange(), t = document.querySelector('[data-email]'); if (t) { r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } b.textContent = 'Selected'; }
    setTimeout(() => { b.textContent = 'Copy'; }, 1600);
  }));

  // mobile menu
  const header = document.querySelector('.site-header'), btn = document.querySelector('.menu-btn');
  if (btn) {
    btn.addEventListener('click', () => { const open = header.classList.toggle('menu-open'); btn.setAttribute('aria-expanded', open); });
    header.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => { header.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); }));
  }

  // entrance animations: only for things that start below the first screen, so the page is complete at rest
  const rev = [...document.querySelectorAll('.reveal')];
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(el => { if (el.getBoundingClientRect().top > innerHeight * 0.9) { el.classList.add('pre'); io.observe(el); } });
  }

  // twinkling star field with slow parallax
  document.querySelectorAll('canvas.stars').forEach(cv => {
    const g = cv.getContext('2d'); let stars = [], w = 0, h = 0, dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => {
      w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(w * h / 5200);
      stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.6, z: Math.random() }));
    };
    const draw = t => {
      g.clearRect(0, 0, w, h);
      const sy = scrollY * 0.15;
      for (const s of stars) {
        const a = reduce ? 0.7 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 1000 * s.s + s.p));
        const y = ((s.y - sy * s.z) % h + h) % h;
        g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(s.x, y, s.r, 0, 6.283); g.fill();
        if (s.r > 1.45) { g.fillStyle = `rgba(255,220,140,${a * 0.25})`; g.beginPath(); g.arc(s.x, y, s.r * 3, 0, 6.283); g.fill(); }
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    size(); addEventListener('resize', size); requestAnimationFrame(draw);
  });

  // gentle 3D tilt on game cards (mouse only)
  if (!reduce && matchMedia('(hover: hover)').matches) document.querySelectorAll('.game-card').forEach(c => {
    c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; c.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`; });
    c.addEventListener('mouseleave', () => { c.style.transform = ''; });
  });

  // phone mockup: crossfade through screenshots
  document.querySelectorAll('.phone .screen').forEach(sc => {
    const imgs = sc.querySelectorAll('img'); let i = 0;
    if (imgs.length < 2 || reduce) return;
    setInterval(() => { imgs[i].classList.remove('on'); i = (i + 1) % imgs.length; imgs[i].classList.add('on'); }, 3200);
  });

  // YouTube slots: put a video ID or any YouTube / Shorts link in data-yt
  const ytId = v => { if (!v) return ''; const m = v.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : (/^[\w-]{11}$/.test(v.trim()) ? v.trim() : ''); };
  const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  document.querySelectorAll('.video').forEach(v => {
    const frame = v.querySelector('.frame'), id = ytId(v.dataset.yt);
    if (!id) { frame.innerHTML = `<div class="empty"><div class="ic">${playIcon}</div><b>${v.classList.contains('short') ? 'Short' : 'Video'} coming soon</b><small>New videos land on our YouTube channel first.</small></div>`; return; }
    frame.innerHTML = `<img class="thumb" alt="" loading="lazy" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg"><button class="play" aria-label="Play video"><span>${playIcon}</span></button>`;
    frame.querySelector('.play').addEventListener('click', () => {
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    });
  });

  // policy page: highlight the section you are reading
  const toc = document.querySelectorAll('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    const map = new Map([...toc].map(a => [a.getAttribute('href').slice(1), a]));
    const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { toc.forEach(a => a.classList.remove('on')); const a = map.get(e.target.id); if (a) a.classList.add('on'); } }), { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((a, id) => { const el = document.getElementById(id); if (el) io2.observe(el); });
  }
})();
