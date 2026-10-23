/* ===== Simple Life Games site: music and sound effects =====
   Everything is synthesized in the browser (nothing to download).
   - Click sounds are on by default and very quiet; music is off until the visitor turns it on (browsers require that anyway).
   - The choice is remembered. Each page has its own track: a cheerful studio theme, and a moonlit koto theme for Ninja Rooftops. */
(() => {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const page = document.body.classList.contains('dark-page') ? 'ninja' : 'home';
  const store = { get(k, d) { try { const v = localStorage.getItem('slg_' + k); return v === null ? d : v === '1'; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('slg_' + k, v ? '1' : '0'); } catch (e) {} } };
  let musicOn = store.get('music', false), sfxOn = store.get('sfx', true);
  let ac = null, master, musG, sfxG, noiseBuf, timer = 0, step = 0, nextT = 0;

  function boot() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
    try {
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
      musG = ac.createGain(); musG.gain.value = 0; musG.connect(master);
      sfxG = ac.createGain(); sfxG.gain.value = 0.55; sfxG.connect(master);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) { ac = null; return false; }
  }
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);
  // ---- small synth kit (every gain starts at 0 so nothing clicks) ----
  function env(g, n, a, peak, dur) { g.gain.value = 0; g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(peak, n + a); g.gain.exponentialRampToValueAtTime(0.0001, n + dur); }
  function osc(type, f, n, end, dest, det) { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, n); if (det) o.detune.value = det; o.connect(dest); o.start(n); o.stop(end); return o; }
  function tone(f1, f2, dur, type, vol, n, dest) { const g = ac.createGain(); env(g, n, 0.01, vol, dur); g.connect(dest || sfxG); const o = osc(type, f1, n, n + dur + 0.05, g); if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), n + dur); }
  function noise(dur, vol, type, f1, f2, n, dest) { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(f1, n); if (f2 !== f1) f.frequency.exponentialRampToValueAtTime(f2, n + dur);
    g.gain.value = 0; g.gain.setValueAtTime(vol, n); g.gain.exponentialRampToValueAtTime(0.0001, n + dur); s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(n, Math.random() * 0.5); s.stop(n + dur + 0.05); }
  const V = {
    koto(f, n, v, d, out) { const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(4200, n); lp.frequency.exponentialRampToValueAtTime(900, n + 0.45);
      env(g, n, 0.004, v, 0.95); lp.connect(g); g.connect(out); const o = osc('triangle', f * 1.014, n, n + 1, lp); o.frequency.exponentialRampToValueAtTime(f, n + 0.05); const g2 = ac.createGain(); g2.gain.value = 0.35; g2.connect(lp); osc('sine', f * 2.01, n, n + 1, g2); },
    flute(f, n, v, d, out) { const g = ac.createGain(); g.gain.value = 0; g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(v * 0.8, n + 0.08); g.gain.setValueAtTime(v * 0.8, n + Math.max(0.09, d - 0.08)); g.gain.exponentialRampToValueAtTime(0.0001, n + d + 0.15);
      g.connect(out); const o = osc('sine', f, n, n + d + 0.2, g); const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5; lg.gain.value = 0; lg.gain.setValueAtTime(0, n); lg.gain.linearRampToValueAtTime(f * 0.012, n + 0.3); l.connect(lg); lg.connect(o.frequency); l.start(n); l.stop(n + d + 0.2);
      noise(Math.min(0.2, d), v * 0.1, 'bandpass', f * 2, f * 2, n, out); },
    uke(f, n, v, d, out) { const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, n); lp.frequency.exponentialRampToValueAtTime(700, n + 0.35);
      env(g, n, 0.003, v, 0.6); lp.connect(g); g.connect(out); osc('triangle', f, n, n + 0.65, lp); osc('sawtooth', f, n, n + 0.65, lp, 7); },
    marimba(f, n, v, d, out) { const g = ac.createGain(), g2 = ac.createGain(); env(g, n, 0.002, v, 0.45); env(g2, n, 0.002, v * 0.3, 0.1); g.connect(out); g2.connect(out); osc('sine', f, n, n + 0.5, g); osc('sine', f * 4, n, n + 0.12, g2); },
    glock(f, n, v, d, out) { const g = ac.createGain(), g2 = ac.createGain(); env(g, n, 0.002, v * 0.6, 1.1); env(g2, n, 0.002, v * 0.2, 0.3); g.connect(out); g2.connect(out); osc('sine', f, n, n + 1.2, g); osc('sine', f * 2.76, n, n + 0.35, g2); },
    bass(f, n, v, d, out) { const g = ac.createGain(); env(g, n, 0.01, v, Math.max(0.35, d)); g.connect(out); osc('triangle', f, n, n + d + 0.4, g); },
    pad(f, n, v, d, out) { const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800; g.gain.value = 0; g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(v, n + 0.6); g.gain.setValueAtTime(v, n + d - 0.4); g.gain.exponentialRampToValueAtTime(0.0001, n + d + 0.4);
      lp.connect(g); g.connect(out); osc('sawtooth', f, n, n + d + 0.45, lp, -7); osc('sawtooth', f, n, n + d + 0.45, lp, 7); },
    taiko(f, n, v, d, out) { const g = ac.createGain(); env(g, n, 0.002, v, 0.4); g.connect(out); const o = osc('sine', 140, n, n + 0.45, g); o.frequency.exponentialRampToValueAtTime(48, n + 0.25); noise(0.05, v * 0.4, 'bandpass', 1000, 450, n, out); },
    shaker(f, n, v, d, out) { noise(0.06, v, 'highpass', 6000, 6000, n, out); },
    clack(f, n, v, d, out) { noise(0.03, v, 'bandpass', 2200, 2200, n, out); },
    kick(f, n, v, d, out) { const g = ac.createGain(); env(g, n, 0.002, v, 0.25); g.connect(out); const o = osc('sine', 130, n, n + 0.3, g); o.frequency.exponentialRampToValueAtTime(45, n + 0.15); },
    snap(f, n, v, d, out) { for (let i = 0; i < 2; i++) noise(0.05, v, 'bandpass', 1800, 1400, n + i * 0.01, out); }
  };

  // extra instruments for the high-energy tracks
  Object.assign(V, {
    sawBass(f, n, v, d, out) { const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6; lp.frequency.setValueAtTime(1400, n); lp.frequency.exponentialRampToValueAtTime(180, n + Math.min(0.22, d + 0.05));
      env(g, n, 0.004, v, Math.max(0.12, d)); lp.connect(g); g.connect(out); osc('sawtooth', f, n, n + d + 0.1, lp); osc('square', f / 2, n, n + d + 0.1, lp, 4); },
    pluck(f, n, v, d, out) { const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(5200, n); lp.frequency.exponentialRampToValueAtTime(600, n + 0.18);
      env(g, n, 0.002, v, 0.24); lp.connect(g); g.connect(out); osc('sawtooth', f, n, n + 0.26, lp, -9); osc('sawtooth', f, n, n + 0.26, lp, 9); },
    brass(f, n, v, d, out) { const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(600, n); lp.frequency.exponentialRampToValueAtTime(3200, n + 0.05); lp.frequency.exponentialRampToValueAtTime(1200, n + d);
      env(g, n, 0.015, v, d + 0.1); lp.connect(g); g.connect(out); osc('sawtooth', f, n, n + d + 0.15, lp, -6); osc('sawtooth', f, n, n + d + 0.15, lp, 6); },
    lead(f, n, v, d, out) { const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800;
      g.gain.value = 0; g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(v, n + 0.01); g.gain.setValueAtTime(v, n + Math.max(0.02, d - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, n + d + 0.08);
      lp.connect(g); g.connect(out); osc('square', f, n, n + d + 0.1, lp, -5); osc('sawtooth', f * 2, n, n + d + 0.1, lp, 5); },
    erhu(f, n, v, d, out) { const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      g.gain.value = 0; g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(v, n + 0.05); g.gain.setValueAtTime(v, n + Math.max(0.06, d - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, n + d + 0.12);
      lp.connect(g); g.connect(out); const o = osc('sawtooth', f * 0.985, n, n + d + 0.15, lp); o.frequency.exponentialRampToValueAtTime(f, n + 0.06);
      const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 6.2; lg.gain.value = 0; lg.gain.setValueAtTime(0, n); lg.gain.linearRampToValueAtTime(f * 0.02, n + 0.18); l.connect(lg); lg.connect(o.frequency); l.start(n); l.stop(n + d + 0.15); },
    dist(f, n, v, d, out) { const g = ac.createGain(), ws = ac.createWaveShaper(), lp = ac.createBiquadFilter(); ws.curve = DIST; lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, n); lp.frequency.exponentialRampToValueAtTime(900, n + 0.15);
      env(g, n, 0.003, v, 0.16); ws.connect(lp); lp.connect(g); g.connect(out); osc('sawtooth', f, n, n + 0.2, ws); osc('square', f * 1.004, n, n + 0.2, ws); },
    snare(f, n, v, d, out) { noise(0.16, v * 0.8, 'bandpass', 2000, 1500, n, out); const g = ac.createGain(); env(g, n, 0.002, v * 0.5, 0.1); g.connect(out); const o = osc('triangle', 200, n, n + 0.12, g); o.frequency.exponentialRampToValueAtTime(120, n + 0.1); },
    clap(f, n, v, d, out) { for (let i = 0; i < 3; i++) noise(0.06, v * 0.8, 'bandpass', 1500, 1100, n + i * 0.011, out); },
    hat(f, n, v, d, out) { noise(0.035, v * 0.6, 'highpass', 8000, 8000, n, out); },
    ohat(f, n, v, d, out) { noise(0.18, v * 0.5, 'highpass', 7000, 7000, n, out); },
    rim(f, n, v, d, out) { noise(0.02, v, 'bandpass', 3500, 3500, n, out); },
    tom(f, n, v, d, out) { const g = ac.createGain(); env(g, n, 0.002, v, 0.3); g.connect(out); const o = osc('sine', 190, n, n + 0.32, g); o.frequency.exponentialRampToValueAtTime(80, n + 0.25); },
    bigTaiko(f, n, v, d, out) { V.taiko(0, n, v, d, out); const g = ac.createGain(); env(g, n, 0.002, v * 0.6, 0.6); g.connect(out); const o = osc('sine', 90, n, n + 0.62, g); o.frequency.exponentialRampToValueAtTime(38, n + 0.4); },
    gong(f, n, v, d, out) { const g = ac.createGain(); env(g, n, 0.01, v * 0.35, 2.6); g.connect(out); for (const q of [92, 94.6, 141, 187]) osc('sine', q, n, n + 2.7, g); noise(0.5, v * 0.15, 'bandpass', 700, 300, n, out); },
    riser(f, n, v, d, out) { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; s.loop = true; fl.type = 'bandpass'; fl.Q.value = 2;
      fl.frequency.setValueAtTime(300, n); fl.frequency.exponentialRampToValueAtTime(7000, n + d); g.gain.value = 0; g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(v, n + d); g.gain.exponentialRampToValueAtTime(0.0001, n + d + 0.05);
      s.connect(fl); fl.connect(g); g.connect(out); s.start(n); s.stop(n + d + 0.1); }
  });
  const DIST = (() => { const c = new Float32Array(512); for (let i = 0; i < 512; i++) { const x = i / 255.5 - 1; c[i] = Math.tanh(x * 3.5); } return c; })();

  /* ---- the two tracks. Grid: 16th notes, 16 steps a bar, 8 bars a loop.
     Melodic patterns: '.' rest, '-' hold, 0-9 a-e = scale degree. Chord-relative layers count from that bar's chord.
     Drums: x = hit, o = soft hit. A layer's pattern can be one string (every bar) or 8 strings (one per bar). ---- */
  const SONGS = {
    // STUDIO THEME, 126 bpm: an upbeat, sunny pop groove. Four-on-the-floor kick, claps, bouncing octave bass,
    // sparkling plucked arpeggios, brass stabs and a glockenspiel hook you can hum. Bar 8 is a snare build back to the top.
    home: { bpm: 126, root: 60, sc: [0, 2, 4, 5, 7, 9, 11], chords: [0, 4, 5, 3, 0, 4, 5, 3],
      layers: [
        { i: 'kick', p: ['x...x...x...x...', 'x...x...x...x...', 'x...x...x...x...', 'x...x...x...x...', 'x...x...x...x...', 'x...x...x...x...', 'x...x...x...x...', 'x...x...x.x.x.x.'], v: 0.55 },
        { i: 'clap', p: '....x.......x...', v: 0.32 },
        { i: 'hat', p: 'o.x.o.x.o.x.o.x.', v: 0.22 },
        { i: 'ohat', p: '..x...x...x...x.', v: 0.14 },
        { i: 'snare', p: ['................', '................', '................', '...............o', '................', '................', '................', 'o.o.o.o.oooooooo'], v: 0.22 },
        { i: 'sawBass', rel: 1, oct: -24, p: '0.07.0.70.07.0.7', v: 0.26, len: 1 },
        { i: 'pluck', rel: 1, oct: -12, p: '0247424702474247', v: 0.055, len: 1 },
        { i: 'brass', rel: 1, chord: 1, oct: -12, p: ['x.....x.....x...', '................', 'x.....x.....x...', '..........x.x...', 'x.....x.....x...', '................', 'x.....x.....x...', 'x...x...x.x.x...'], v: 0.045, len: 2 },
        { i: 'glock', oct: 0, p: ['9.9.b.9.7...4.5.', '7.......5.4.2...', '9.9.b.9.c...b.9.', 'b.......9.7.9...', '9.9.b.9.7...4.5.', '7.......5.4.2...', '7.9.b.c.e.c.b.9.', 'c---b---9---7---'], v: 0.15 },
        { i: 'uke', oct: -12, p: ['9.9.b.9.7...4.5.', '7.......5.4.2...', '9.9.b.9.c...b.9.', 'b.......9.7.9...', '9.9.b.9.7...4.5.', '7.......5.4.2...', '7.9.b.c.e.c.b.9.', 'c---b---9---7---'], v: 0.07 },
        { i: 'riser', bars: [7], v: 0.06, at: 0, len: 16 }
      ] },
    // NINJA ROOFTOPS, 156 bpm: a chase. Pounding taiko over a drum-and-bass beat, a growling distorted shamisen riff,
    // a driving saw bass, an erhu hook that soars, a gong at the top of every loop and a taiko roll into the next.
    ninja: { bpm: 156, root: 50, sc: [0, 1, 3, 5, 7, 8, 10], chords: [0, 5, 6, 0, 0, 5, 6, 1],
      layers: [
        { i: 'gong', bars: [0], v: 0.6, at: 0 },
        { i: 'bigTaiko', p: ['x..x..x.x..x..x.', 'x..x..x.x..x..x.', 'x..x..x.x..x..x.', 'x..x..x.x.xx.xx.', 'x..x..x.x..x..x.', 'x..x..x.x..x..x.', 'x..x..x.x..x..x.', 'x.x.x.x.xxxxxxxx'], v: 0.5 },
        { i: 'kick', p: 'x.....x...x.....', v: 0.42 },
        { i: 'snare', p: ['....x.......x...', '....x.......x...', '....x.......x...', '....x.......x.oo', '....x.......x...', '....x.......x...', '....x.......x...', '....x...x.x.xxxx'], v: 0.34 },
        { i: 'hat', p: 'xoxoxoxoxoxoxoxo', v: 0.2 },
        { i: 'taiko', p: '..o.o..o..o.o.oo', v: 0.16 },
        { i: 'sawBass', rel: 1, oct: -12, p: '00.0.70.00.0.7.0', v: 0.24, len: 1 },
        { i: 'dist', rel: 1, oct: 0, p: ['0.1.0.4.0.1.3.1.', '0.1.0.4.0.1.3.1.', '0.1.0.4.0.1.3.1.', '0.1.0.4.0.3.4.5.', '0.1.0.4.0.1.3.1.', '0.1.0.4.0.1.3.1.', '0.1.0.4.0.1.3.1.', '0.0.1.1.3.3.4.4.'], v: 0.07, len: 1 },
        { i: 'erhu', oct: 12, p: ['7---8-7-4---5-4-', '3---4-3-1---0---', '7---8-7-b---a-8-', '7-------8-7-5-4-', 'b-a-8-7-8---7---', 'a-8-7-5-4---3---', '7-8-a-b-c---b-a-', 'b-------e-------'], v: 0.12 },
        { i: 'brass', rel: 1, chord: 1, oct: 0, p: ['x...............', '................', '................', '........x.x.x...', 'x...............', '................', '................', 'x...x...x...x...'], v: 0.05, len: 3 },
        { i: 'pad', rel: 1, chord: 1, oct: 0, p: 'x...............', v: 0.022, len: 16 },
        { i: 'riser', bars: [7], v: 0.07, at: 0, len: 16 }
      ] }
  };
  const S = SONGS[page];
  const deg = (d, oct) => { const L = S.sc.length, o = Math.floor(d / L), k = ((d % L) + L) % L; return midi(S.root + (oct || 0) + o * 12 + S.sc[k]); };
  const STEP = () => 15 / S.bpm, LOOP = 128;
  function playStep(st, n) {
    const ph = st % 16, bar = Math.floor(st / 16) % 8, sp = STEP(), chord = S.chords[bar];
    for (const L of S.layers) {
      if (L.bars) { if (L.bars.includes(bar) && ph === (L.at || 0)) V[L.i](0, n, L.v, (L.len || 1) * sp, musG); continue; }
      const pat = Array.isArray(L.p) ? L.p[bar] : L.p, c = pat[ph];
      if (!c || c === '.' || c === '-') continue;
      if (c === 'x' || c === 'o') {
        if (L.chord) { for (const k of [0, 2, 4]) V[L.i](deg(chord + k, L.oct || 0), n, L.v, (L.len || 1) * sp, musG); }
        else V[L.i](0, n, c === 'x' ? L.v : L.v * 0.5, sp, musG);
        continue;
      }
      let hold = 1; while (pat[ph + hold] === '-') hold++;
      const d = parseInt(c, 16) + (L.rel ? chord : 0);
      V[L.i](deg(d, L.oct || 0), n, L.v, (L.len || hold) * sp, musG);
    }
  }
  function startMusic() {
    if (!boot()) return;
    musG.gain.cancelScheduledValues(ac.currentTime); musG.gain.setTargetAtTime(0.22, ac.currentTime, 0.8);
    if (timer) return;
    nextT = ac.currentTime + 0.1; step = 0;
    timer = setInterval(() => {
      if (!ac || ac.state !== 'running') return;
      if (nextT < ac.currentTime - 0.3) nextT = ac.currentTime + 0.05;
      while (nextT < ac.currentTime + 0.3) { try { playStep(step % LOOP, nextT); } catch (e) {} nextT += STEP(); step++; }
    }, 80);
  }
  function stopMusic() { if (!ac) return; musG.gain.cancelScheduledValues(ac.currentTime); musG.gain.setTargetAtTime(0, ac.currentTime, 0.25); setTimeout(() => { if (!musicOn && timer) { clearInterval(timer); timer = 0; } }, 1500); }

  /* ---- sound effects for what you click ---- */
  const FX = {
    pop(n) { tone(420, 1100, 0.08, 'sine', 0.14, n); tone(1568, 1568, 0.18, 'triangle', 0.05, n + 0.05); },                          // primary buttons: Pip's bubbly pop
    tick(n) { tone(900, 620, 0.04, 'triangle', 0.07, n); noise(0.02, 0.03, 'bandpass', 2600, 2600, n); },                            // nav links
    card(n) { tone(520, 780, 0.07, 'triangle', 0.08, n); tone(1046, 1046, 0.2, 'sine', 0.05, n + 0.06); tone(1568, 1568, 0.25, 'sine', 0.03, n + 0.1); },
    copy(n) { tone(1318, 1318, 0.12, 'triangle', 0.07, n); tone(1760, 1760, 0.18, 'triangle', 0.06, n + 0.07); },
    menuOpen(n) { noise(0.16, 0.05, 'bandpass', 500, 2500, n); tone(600, 900, 0.1, 'sine', 0.05, n); },
    menuClose(n) { noise(0.14, 0.05, 'bandpass', 2500, 500, n); tone(900, 600, 0.1, 'sine', 0.05, n); },
    pip(n) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(500, n); o.frequency.exponentialRampToValueAtTime(1200, n + 0.1); o.frequency.exponentialRampToValueAtTime(700, n + 0.22); o.frequency.exponentialRampToValueAtTime(1400, n + 0.34);
      env(g, n, 0.01, 0.13, 0.42); o.connect(g); g.connect(sfxG); o.start(n); o.stop(n + 0.45); [1568, 2093, 2637].forEach((f, i) => tone(f, f, 0.2, 'sine', 0.04, n + 0.3 + i * 0.05)); },
    // Ninja Rooftops page
    shing(n) { noise(0.12, 0.08, 'bandpass', 900, 3000, n); noise(0.05, 0.06, 'highpass', 5000, 5000, n + 0.08); tone(3136, 3136, 0.5, 'sine', 0.04, n + 0.08); tone(4699, 4699, 0.4, 'sine', 0.025, n + 0.09); },
    koto(n) { V.koto(midi(74), n, 0.12, 0, sfxG); V.koto(midi(81), n + 0.08, 0.1, 0, sfxG); },
    leap(n) { tone(360, 900, 0.16, 'triangle', 0.1, n); noise(0.18, 0.06, 'bandpass', 600, 2800, n); tone(1500, 2400, 0.1, 'sine', 0.04, n + 0.12); },
    taiko(n) { V.taiko(0, n, 0.5, 0, sfxG); V.koto(midi(74), n + 0.1, 0.1, 0, sfxG); }
  };
  function fx(name) { if (!sfxOn || !boot() || !FX[name]) return; try { FX[name](ac.currentTime + 0.005); } catch (e) {} }
  window.SLG_FX = fx;                                        // site.js asks for a sound when the ninjas leap

  // which sound a clicked thing makes
  function kindOf(el) {
    if (el.closest('.sound-ctl')) return null;
    if (el.closest('.pip')) return 'pip';
    if (el.closest('.copy-btn')) return 'copy';
    if (el.closest('.menu-btn')) return document.querySelector('.site-header').classList.contains('menu-open') ? 'menuClose' : 'menuOpen';
    if (el.closest('.nr-hero canvas')) return null;           // the scene plays its own leap sound
    if (el.closest('.ninja-card')) return 'shing';
    if (el.closest('.btn')) return page === 'ninja' ? 'taiko' : 'pop';
    if (el.closest('.game-feature, .soon, .feat, .value, .step, .shot, .video')) return page === 'ninja' ? 'koto' : 'card';
    if (el.closest('a, button')) return page === 'ninja' ? 'koto' : 'tick';
    return null;
  }
  document.addEventListener('pointerdown', e => {
    const k = kindOf(e.target); if (k) fx(k);
    if (musicOn && (!ac || ac.state !== 'running')) { startMusic(); updateCtl(); }   // the music preference resumes on the first tap of a new page
  }, { capture: true });
  // let the click sound finish before going to another page on this site
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a || !sfxOn || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href'); if (!href || href.startsWith('#') || /^(https?:|mailto:)/.test(href)) return;
    e.preventDefault(); setTimeout(() => { location.href = a.href; }, 140);
  });
  // Pip reacts when tapped
  document.querySelectorAll('.pip').forEach(p => { p.style.cursor = 'pointer'; p.addEventListener('click', () => { p.classList.remove('boing'); void p.getBoundingClientRect(); p.classList.add('boing'); }); });

  /* ---- the sound control (bottom right) ---- */
  const ctl = document.createElement('div'); ctl.className = 'sound-ctl';
  ctl.innerHTML = `<button type="button" class="sc-music" aria-pressed="false"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 18.5a3 3 0 1 1-2-2.83V5.2l12-2.7v12a3 3 0 1 1-2-2.83V7.1L9 8.9z"/></svg><span></span></button>`
    + `<button type="button" class="sc-sfx" aria-pressed="true" aria-label="Click sounds"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="w1" d="M16.5 9a4 4 0 0 1 0 6"/><path class="w2" d="M19 6.5a7.5 7.5 0 0 1 0 11"/><path class="x" d="M17 9l5 6M22 9l-5 6"/></svg></button>`;
  document.body.appendChild(ctl);
  const mb = ctl.querySelector('.sc-music'), sb = ctl.querySelector('.sc-sfx');
  function updateCtl() {
    const playing = musicOn && ac && ac.state === 'running';
    mb.setAttribute('aria-pressed', musicOn); mb.classList.toggle('on', musicOn); mb.classList.toggle('wait', musicOn && !playing);
    mb.querySelector('span').textContent = !musicOn ? 'Play music' : playing ? 'Music on' : 'Tap to resume';
    mb.setAttribute('aria-label', musicOn ? 'Turn music off' : 'Turn music on');
    sb.setAttribute('aria-pressed', sfxOn); sb.classList.toggle('off', !sfxOn); sb.setAttribute('aria-label', sfxOn ? 'Turn click sounds off' : 'Turn click sounds on');
  }
  mb.addEventListener('click', () => { musicOn = !musicOn; store.set('music', musicOn); if (musicOn) startMusic(); else stopMusic(); setTimeout(updateCtl, 60); updateCtl(); });
  sb.addEventListener('click', () => { sfxOn = !sfxOn; store.set('sfx', sfxOn); if (sfxOn) fx('copy'); updateCtl(); });
  // hide the label after a while so it doesn't sit on top of content
  setTimeout(() => ctl.classList.add('compact'), 6000);
  ctl.addEventListener('mouseenter', () => ctl.classList.remove('compact'));
  ctl.addEventListener('mouseleave', () => setTimeout(() => ctl.classList.add('compact'), 1500));
  document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else if (musicOn || sfxOn) ac.resume(); });
  updateCtl();
  // test hook (only with ?audiotest in the address): renders the page's track and the click sounds offline
  if (/[?&]audiotest/.test(location.search)) window.__slgRender = async (secs, what) => {
    const sr = 32000, real = [ac, master, musG, sfxG]; ac = new OfflineAudioContext(1, Math.ceil(sr * secs), sr);
    master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination); musG = ac.createGain(); musG.gain.value = 0.22; musG.connect(master); sfxG = ac.createGain(); sfxG.gain.value = 0.55; sfxG.connect(master);
    noiseBuf = ac.createBuffer(1, sr, sr); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (what === 'music') { let n = 0.05; for (let st = 0; st < LOOP; st++) { playStep(st, n); n += STEP(); } }
    else { let n = 0.05; for (const k of Object.keys(FX)) { FX[k](n); n += 0.8; } }
    const buf = await ac.startRendering(); [ac, master, musG, sfxG] = real;
    const L = buf.getChannelData(0), i16 = new Int16Array(L.length); let pk = 0; for (let i = 0; i < L.length; i++) { pk = Math.max(pk, Math.abs(L[i])); i16[i] = Math.max(-32767, Math.min(32767, L[i] * 32767)); }
    let bin = ''; const u8 = new Uint8Array(i16.buffer); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return { pk, pcm: btoa(bin), sr };
  };
})();
