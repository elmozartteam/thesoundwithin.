/* THE SOUND WITHIN · SOUNDPATH LEVEL 2
   Not bertitik, tangga nada minor, armature kunci, progresi akor I–IV–V. Reading / Listening / Speaking.
   Memakai TSWAudio, TSWInstruments, TSWProgress bila ada; jika tidak, memakai synth dan localStorage bawaan. */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const LEVEL = 2, LET = 'CDEFGAB', PCW = [0, 2, 4, 5, 7, 9, 11];
const NS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

/* ══ AUDIO: pakai TSWAudio/TSWInstruments bila ada, kalau tidak pakai synth bawaan ══ */
let actx = null, handles = [], timers = [];
const AC = window.AudioContext || window.webkitAudioContext;
const ac = () => { if (!actx && AC) actx = new AC(); if (actx && actx.state === 'suspended') actx.resume(); return actx; };
const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
function synth(m, d, v) {
  const a = ac(); if (!a) return; const t = a.currentTime, g = a.createGain(), o = a.createOscillator(), o2 = a.createOscillator();
  o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 2;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3 * v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); o2.connect(g); g.connect(a.destination); o.start(t); o2.start(t); o.stop(t + d + .05); o2.stop(t + d + .05);
}
function tone(m, d, v, inst) {
  d = d || 1; v = v == null ? .8 : v;
  try { if (window.TSWAudio && typeof TSWAudio.note === 'function') { const h = TSWAudio.note(inst || 'piano', m, { dur: d, vel: v }); if (h) { handles.push(h); return; } } } catch (e) {}
  synth(m, d, v);
}
function click(accent) {
  try { if (window.TSWInstruments && TSWInstruments.drumSound) { TSWInstruments.drumSound(accent ? 'snare' : 'hihat'); return; } } catch (e) {}
  const a = ac(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
  o.type = 'square'; o.frequency.value = accent ? 1500 : 1000; g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.0001, t + .06);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .07);
}
function stopAll() {
  timers.forEach(clearTimeout); timers = [];
  handles.forEach(h => { try { h && h.stop && h.stop(.08); } catch (e) {} }); handles = [];
  try { window.TSWInstruments && TSWInstruments.stopAll && TSWInstruments.stopAll(); } catch (e) {}
}
const chord = (ms, d, v) => ms.forEach(m => tone(m, d, v));
const arp = (ms, step, d) => ms.forEach((m, i) => later(() => tone(m, d || 1, .8), i * step));
const pulses = (n, bpm, accEvery) => { const ms = 60000 / bpm; for (let i = 0; i < n; i++) later(() => click(accEvery && i % accEvery === 0), i * ms); };

/* ══ NOTASI: SVG paranada kunci G ══ */
function spell(m, flat) {
  const o = Math.floor(m / 12) - 1, p = m % 12, i = PCW.indexOf(p);
  if (i >= 0) return { l: i, a: 0, o };
  return flat ? { l: PCW.indexOf(p + 1), a: -1, o } : { l: PCW.indexOf(p - 1), a: 1, o };
}
const nm = (m, flat, oct) => { const s = spell(m, flat); return LET[s.l] + (s.a > 0 ? '♯' : s.a < 0 ? '♭' : '') + (oct ? s.o : ''); };
const BW = { w: 64, h: 46, q: 34, e: 26 }, BEATS = { w: 4, h: 2, q: 1, e: .5 };
function staff(items, o) {
  o = o || {}; const yOf = s => 80 - (s - 30) * 5; let x = o.ts ? 100 : 66, body = '';
  items.forEach(it => {
    if (it.bar) { body += '<line x1="' + x + '" y1="40" x2="' + x + '" y2="80" stroke="#14233F" stroke-width="1.5"/>'; x += 16; return; }
    const d = it.d || 'q', w = BW[d], cx = x + w / 2;
    if (it.r) {
      const c = '#14233F';
      if (d === 'w') body += '<rect x="' + (cx - 8) + '" y="50" width="16" height="6" fill="' + c + '"/>';
      else if (d === 'h') body += '<rect x="' + (cx - 8) + '" y="54" width="16" height="6" fill="' + c + '"/>';
      else if (d === 'q') body += '<path d="M' + (cx - 3) + ' 42l8 8-6 8 8 8-5 6" fill="none" stroke="' + c + '" stroke-width="3"/>';
      else body += '<circle cx="' + (cx - 3) + '" cy="52" r="3" fill="' + c + '"/><path d="M' + (cx - 1) + ' 52q6 0 8-6l-6 20" fill="none" stroke="' + c + '" stroke-width="2"/>';
    } else {
      const ms = [].concat(it.m);
      ms.forEach((m, k) => {
        const s = spell(m, it.flat), st = s.o * 7 + s.l, y = yOf(st);
        for (let ls = 28; ls >= st && st <= 28; ls -= 2) body += '<line x1="' + (cx - 12) + '" y1="' + yOf(ls) + '" x2="' + (cx + 12) + '" y2="' + yOf(ls) + '" stroke="#14233F"/>';
        for (let ls = 40; ls <= st && st >= 40; ls += 2) body += '<line x1="' + (cx - 12) + '" y1="' + yOf(ls) + '" x2="' + (cx + 12) + '" y2="' + yOf(ls) + '" stroke="#14233F"/>';
        const open = d === 'w' || d === 'h';
        body += '<ellipse cx="' + cx + '" cy="' + y + '" rx="6.8" ry="5" transform="rotate(-20 ' + cx + ' ' + y + ')" fill="' + (open ? '#fff' : '#14233F') + '" stroke="#14233F" stroke-width="1.8"/>';
        if (it.dot) body += '<circle cx="' + (cx + 13) + '" cy="' + (st % 2 === 0 ? y - 5 : y) + '" r="2.2" fill="#14233F"/>';
        if (s.a) body += '<text x="' + (cx - 21) + '" y="' + (y + 5) + '" font-size="17" fill="#C0524A" font-family="serif">' + (s.a > 0 ? '♯' : '♭') + '</text>';
        if (k === 0 && d !== 'w' && ms.length === 1) {
          const up = st < 34;
          body += up ? '<line x1="' + (cx + 6) + '" y1="' + y + '" x2="' + (cx + 6) + '" y2="' + (y - 32) + '" stroke="#14233F" stroke-width="1.8"/>' + (d === 'e' ? '<path d="M' + (cx + 6) + ' ' + (y - 32) + 'q10 8 6 18" fill="none" stroke="#14233F" stroke-width="2"/>' : '')
            : '<line x1="' + (cx - 6) + '" y1="' + y + '" x2="' + (cx - 6) + '" y2="' + (y + 32) + '" stroke="#14233F" stroke-width="1.8"/>' + (d === 'e' ? '<path d="M' + (cx - 6) + ' ' + (y + 32) + 'q10-6 6-16" fill="none" stroke="#14233F" stroke-width="2"/>' : '');
        }
        if (it.l && k === 0) body += '<text x="' + cx + '" y="124" text-anchor="middle" font-size="13" fill="#5B6780">' + esc(it.l) + '</text>';
      });
    }
    x += w + (it.dot ? 10 : 0);
  });
  const W = x + 14; let lines = '';
  for (let i = 0; i < 5; i++) lines += '<line x1="8" y1="' + (40 + i * 10) + '" x2="' + (W - 6) + '" y2="' + (40 + i * 10) + '" stroke="#14233F"/>';
  const clef = '<path d="M33 30C46 40 38 56 29 66 20 77 24 88 35 85 45 82 42 68 32 66 24 64 22 54 30 48M33 28V97Q33 106 24 103" fill="none" stroke="#14233F" stroke-width="2.4" stroke-linecap="round"/>';
  const ts = o.ts ? '<text x="64" y="59" font-size="25" font-weight="700" font-family="Georgia,serif" fill="#14233F">' + o.ts[0] + '</text><text x="64" y="79" font-size="25" font-weight="700" font-family="Georgia,serif" fill="#14233F">' + o.ts[1] + '</text>' : '';
  return '<svg viewBox="0 0 ' + W + ' 132" class="stf" role="img" aria-label="' + esc(o.label || 'Notasi pada paranada') + '"><g>' + lines + clef + ts + body +
    '<line x1="' + (W - 6) + '" y1="40" x2="' + (W - 6) + '" y2="80" stroke="#14233F" stroke-width="3"/></g></svg>';
}
function kbd(hi, hi2) {
  hi = hi || []; const bl = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 }; let s = '<svg viewBox="0 0 330 140" class="lp-kbd" role="img" aria-label="Keyboard satu octave dengan tuts yang disorot">';
  PCW.forEach((p, i) => { s += '<rect x="' + (i * 40 + 5) + '" y="5" width="38" height="125" rx="4" fill="' + (hi.indexOf(p) >= 0 ? '#D9A93A' : '#fff') + '" stroke="#14233F" stroke-width="1.5"/><text x="' + (i * 40 + 24) + '" y="122" text-anchor="middle" font-size="12" fill="#5B6780">' + LET[i] + '</text>'; });
  s += '<rect x="285" y="5" width="38" height="125" rx="4" fill="' + (hi2 ? '#D9A93A' : '#fff') + '" stroke="#14233F" stroke-width="1.5"/>';
  Object.keys(bl).forEach(i => { s += '<rect x="' + ((+i + 1) * 40 - 5) + '" y="5" width="26" height="78" rx="3" fill="' + (hi.indexOf(bl[i]) >= 0 ? '#C0524A' : '#14233F') + '" stroke="#0B1426" stroke-width="1.5"/>'; });
  return s + '</svg>';
}

/* ══ DATA MUSIK ══ */
const MAJ = [0, 2, 4, 5, 7, 9, 11, 12], MIN = [0, 2, 3, 5, 7, 8, 10, 12];
const KEYS = { C: { r: 60, fl: 0, n: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] }, G: { r: 67, fl: 0, n: ['G', 'A', 'B', 'C', 'D', 'E', 'F♯'] }, F: { r: 65, fl: 1, n: ['F', 'G', 'A', 'B♭', 'C', 'D', 'E'] } };
const MINORS = { A: { r: 69, fl: 0, n: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], rel: 'C' }, E: { r: 64, fl: 0, n: ['E', 'F♯', 'G', 'A', 'B', 'C', 'D'], rel: 'G' }, D: { r: 62, fl: 1, n: ['D', 'E', 'F', 'G', 'A', 'B♭', 'C'], rel: 'F' } };
const REL = [['C major', 'A minor'], ['G major', 'E minor'], ['F major', 'D minor'], ['D major', 'B minor'], ['B♭ major', 'G minor']];
const SIGS = [['C major', '0 sharp / flat'], ['G major', '1 sharp (F♯)'], ['D major', '2 sharp (F♯, C♯)'], ['A major', '3 sharp (F♯, C♯, G♯)'], ['F major', '1 flat (B♭)'], ['B♭ major', '2 flat (B♭, E♭)'], ['E♭ major', '3 flat (B♭, E♭, A♭)']];
const PROG = [['I', 0], ['IV', 5], ['V', 7]];
const triad = (r, mn) => [r, r + (mn ? 3 : 4), r + 7];
const dur = it => BEATS[it.d] * (it.dot ? 1.5 : 1);

/* ══ MATERI: 4 unit (tahap awal, mudah dulu) ══ */
const UNITS = [
  { t: 'Not Bertitik & Tie', tag: 'Unit 1', goal: ['Menjelaskan fungsi titik di samping not.', 'Menghitung nilai dotted half dan dotted quarter.', 'Memahami tie sebagai penyambung durasi.'],
    concept: 'Titik di sebelah kanan not menambah setengah dari nilai not itu. Tie adalah garis lengkung yang menyambung dua not bernada sama menjadi satu bunyi panjang.',
    pts: ['Dotted half = 2 + 1 = 3 ketuk.', 'Dotted quarter = 1 + ½ = 1½ ketuk.', 'Dotted quarter + eighth = 2 ketuk, pola "panjang–pendek" yang sering muncul.', 'Tie: half + half = satu bunyi selama 4 ketuk (hanya dibunyikan sekali).'],
    mistake: 'Titik bukan menambah 1 ketuk, tetapi setengah dari nilai not. Tie hanya menyambung nada yang sama, jangan dipukul dua kali.',
    check: 'Berapa ketuk dotted half note? Jawaban: 3 ketuk.',
    demo(h) { const P = { 'Dotted half + quarter': [{ d: 'h', dot: 1 }, { d: 'q' }], 'Dotted quarter + eighth ×2': [{ d: 'q', dot: 1 }, { d: 'e' }, { d: 'q', dot: 1 }, { d: 'e' }], 'Quarter ×4 (pembanding)': [{ d: 'q' }, { d: 'q' }, { d: 'q' }, { d: 'q' }], 'Tie: half + half': [{ d: 'h' }, { d: 'h', tie: 1 }] };
      h.innerHTML = '<p>Pilih pola, lalu dengarkan. Perhatikan titik di samping not.</p><div class="row" id="d1b"></div><div id="d1s"></div><p class="note-out" id="d1o"></p>';
      const show = k => { $('d1s').innerHTML = staff(P[k].map(x => ({ m: 71, d: x.d, dot: x.dot })).concat([{ bar: 1 }]), { ts: [4, 4], label: k }); $('d1o').textContent = k + ' = ' + P[k].reduce((a, x) => a + dur(x), 0) + ' ketuk'; };
      Object.keys(P).forEach(k => { const b = document.createElement('button'); b.textContent = k; b.onclick = () => { stopAll(); show(k); const ms = 600; let t = 0, ons = []; P[k].forEach(x => { if (x.tie) ons[ons.length - 1].d += dur(x); else ons.push({ t, d: dur(x) }); t += dur(x); }); ons.forEach(o => later(() => tone(71, o.d * ms / 1000 * .95, .8), o.t * ms)); }; $('d1b').appendChild(b); });
      show('Dotted half + quarter'); } },
  { t: 'Tangga Nada Minor', tag: 'Unit 2', goal: ['Menyusun tangga nada minor natural.', 'Membedakan suara mayor dan minor.', 'Menyebut relative minor dari sebuah kunci mayor.'],
    concept: 'Tangga nada minor natural memakai pola jarak W–H–W–W–H–W–W dan terdengar lebih sendu daripada mayor. Setiap kunci mayor punya relative minor yang memakai nada-nada sama tetapi dimulai dari nada ke-6.',
    pts: ['A minor: A B C D E F G (tanpa sharp atau flat).', 'E minor: satu sharp (F♯). D minor: satu flat (B♭).', 'Relative minor: C major ↔ A minor, G major ↔ E minor, F major ↔ D minor.', 'Beda utama dengan mayor: nada ke-3, ke-6, ke-7 lebih rendah satu semitone.'],
    mistake: 'Minor bukan berarti lebih pelan atau lebih lambat. Itu soal warna nada, bukan volume atau tempo.',
    check: 'Relative minor dari C major adalah… Jawaban: A minor.',
    demo(h) { h.innerHTML = '<p>Pilih tangga nada minor, bandingkan dengan mayor.</p><div class="row" id="d2b"></div><div class="row"><button id="d2m">▶ Mayor (dasar sama)</button></div><div id="d2s"></div><div id="d2k"></div><p class="note-out" id="d2o"></p>'; let cur = 'A';
      const show = k => { cur = k; const M = MINORS[k]; $('d2s').innerHTML = staff(MIN.map((x, i) => ({ m: M.r + x, d: 'q', flat: M.fl, l: M.n[i % 7] })), { label: k + ' minor' }); $('d2k').innerHTML = kbd(MIN.slice(0, 7).map(x => (M.r + x) % 12)); $('d2o').textContent = k + ' minor: ' + M.n.join(' – ') + ' · W H W W H W W · relative dari ' + M.rel + ' major'; };
      Object.keys(MINORS).forEach(k => { const b = document.createElement('button'); b.textContent = k + ' minor'; b.onclick = () => { stopAll(); show(k); MIN.forEach((x, i) => later(() => tone(MINORS[k].r + x, .65, .8), i * 500)); }; $('d2b').appendChild(b); });
      $('d2m').onclick = () => { stopAll(); MAJ.forEach((x, i) => later(() => tone(MINORS[cur].r + x, .65, .8), i * 500)); }; show('A'); } },
  { t: 'Armature Kunci', tag: 'Unit 3', goal: ['Menjelaskan fungsi key signature.', 'Menyebut jumlah sharp atau flat pada beberapa kunci mayor.'],
    concept: 'Key signature adalah kumpulan sharp atau flat di awal paranada. Tanda ini berlaku untuk seluruh lagu, sehingga kita tidak perlu menulis ♯ atau ♭ berulang kali.',
    pts: ['Tambah sharp, urutannya: F♯ C♯ G♯ D♯ ...', 'Tambah flat, urutannya: B♭ E♭ A♭ D♭ ...', 'C major: 0. G: 1♯. D: 2♯. A: 3♯. F: 1♭. B♭: 2♭. E♭: 3♭.', 'Naik satu kuint (5th) dari C ke G menambah satu sharp.'],
    mistake: 'Key signature bukan hanya hiasan: sharp atau flat tersebut berlaku untuk semua nada dengan huruf yang sama di setiap octave.',
    check: 'Berapa sharp pada D major? Jawaban: 2 (F♯ dan C♯).',
    demo(h) { const K = [['E♭', -3], ['B♭', -2], ['F', -1], ['C', 0], ['G', 1], ['D', 2], ['A', 3]];
      h.innerHTML = '<p>Klik sebuah kunci mayor. Bergerak ke kanan = tambah sharp, ke kiri = tambah flat.</p><div id="d3s"></div><p class="note-out" id="d3o"></p>';
      const draw = sel => { let s = '<svg viewBox="0 0 450 90" style="width:100%;max-width:520px" role="img" aria-label="Rantai kuint: kunci mayor dari E♭ sampai A">'; K.forEach((k, i) => { const x = 35 + i * 63, on = i === sel; s += (i ? '<line x1="' + (x - 63 + 20) + '" y1="40" x2="' + (x - 20) + '" y2="40" stroke="#D9A93A" stroke-width="2"/>' : '') + '<g tabindex="0" role="button" aria-label="' + k[0] + ' major" data-i="' + i + '" style="cursor:pointer"><circle cx="' + x + '" cy="40" r="20" fill="' + (on ? '#D9A93A' : '#fff') + '" stroke="#14233F" stroke-width="2"/><text x="' + x + '" y="46" text-anchor="middle" font-size="16" font-weight="700" fill="#14233F">' + k[0] + '</text></g><text x="' + x + '" y="80" text-anchor="middle" font-size="12" fill="#5B6780">' + (k[1] > 0 ? k[1] + '♯' : k[1] < 0 ? -k[1] + '♭' : '0') + '</text>'; }); $('d3s').innerHTML = s + '</svg>';
        $('d3s').querySelectorAll('g').forEach(g => { const f = () => { stopAll(); const i = +g.dataset.i, r = KEYS[K[i][0]]; draw(i); $('d3o').textContent = K[i][0] + ' major: ' + (K[i][1] > 0 ? K[i][1] + ' sharp' : K[i][1] < 0 ? -K[i][1] + ' flat' : 'tanpa sharp/flat'); const root = { 'E♭': 63, 'B♭': 58, F: 65, C: 60, G: 67, D: 62, A: 69 }[K[i][0]]; MAJ.forEach((x, j) => later(() => tone(root + x, .5, .75), j * 380)); }; g.onclick = f; g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } }; }); };
      draw(3); $('d3o').textContent = 'C major: tanpa sharp/flat'; } },
  { t: 'Progresi Akor I–IV–V', tag: 'Unit 4', goal: ['Menyebut akor I, IV, V pada sebuah kunci.', 'Mendengar perbedaan akhir yang tuntas dan menggantung.'],
    concept: 'Banyak lagu sederhana memakai tiga akor mayor: I (rumah), IV (bergerak), V (tegang). Akor V biasanya ingin kembali ke I, sehingga lagu terasa selesai.',
    pts: ['Di C major: I = C, IV = F, V = G.', 'Di G major: I = G, IV = C, V = D.', 'Di F major: I = F, IV = B♭, V = C.', 'I–IV–V–I terdengar tuntas; berhenti di V terdengar menggantung.'],
    mistake: 'Angka Romawi menunjukkan posisi akor di dalam kunci, bukan nama akor yang tetap. IV di C adalah F, tetapi IV di G adalah C.',
    check: 'Akor V pada kunci G major adalah… Jawaban: D.',
    demo(h) { h.innerHTML = '<p>Pilih kunci, lalu dengarkan progresi.</p><div class="row" id="d4b"></div><div class="row" id="d4c"></div><div id="d4s"></div><p class="note-out" id="d4o"></p>'; let key = 'C';
      const ch = i => triad(KEYS[key].r + PROG[i][1], 0), nameOf = i => nm(KEYS[key].r + PROG[i][1], KEYS[key].fl);
      const show = i => { $('d4s').innerHTML = staff([{ m: i == null ? ch(0) : ch(i), d: 'w', flat: KEYS[key].fl }], { label: 'Akor' }); $('d4o').textContent = key + ' major · ' + PROG.map((p, j) => p[0] + ' = ' + nameOf(j)).join(' · '); };
      Object.keys(KEYS).forEach(k => { const b = document.createElement('button'); b.textContent = k + ' major'; b.onclick = () => { key = k; show(0); }; $('d4b').appendChild(b); });
      PROG.forEach((p, i) => { const b = document.createElement('button'); b.textContent = 'Akor ' + p[0]; b.onclick = () => { stopAll(); show(i); chord(ch(i), 2, .7); }; $('d4c').appendChild(b); });
      const pb = document.createElement('button'); pb.textContent = '▶ I–IV–V–I'; pb.onclick = () => { stopAll(); [0, 1, 2, 0].forEach((i, j) => later(() => chord(ch(i), 1.4, .7), j * 1200)); }; $('d4c').appendChild(pb); show(0); } }
];

function buildUnits() {
  const host = $('units'), nav = $('nav');
  UNITS.forEach((u, i) => {
    const a = document.createElement('article'); a.className = 'unit'; a.id = 'u' + (i + 1);
    a.innerHTML = '<span class="tag">' + u.tag + '</span><h3>' + esc(u.t) + '</h3><h4>Tujuan belajar</h4><ul>' + u.goal.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><h4>Konsep</h4><p>' + esc(u.concept) + '</p><h4>Unsur penting</h4><ul>' + u.pts.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><h4>Demonstrasi interaktif</h4><div class="demo"></div><h4>Kesalahan umum</h4><p>' + esc(u.mistake) + '</p><h4>Cek cepat</h4><details class="ans"><summary>Lihat pertanyaan & jawaban</summary><p>' + esc(u.check) + '</p></details>';
    const un = document.createElement('div'); un.className = 'unit-nav'; un.innerHTML = (i ? '<a href="#u' + i + '">← Unit ' + i + '</a>' : '<a href="#top">↑ Kembali ke atas</a>') + (i < UNITS.length - 1 ? '<a href="#u' + (i + 2) + '">Unit ' + (i + 2) + ' →</a>' : '<a href="#practice">Ke latihan →</a>'); a.appendChild(un);
    host.appendChild(a); u.demo(a.querySelector('.demo'));
    const l = document.createElement('a'); l.href = '#u' + (i + 1); l.dataset.u = 'u' + (i + 1); l.title = u.t; l.innerHTML = '<b>' + (i + 1) + '</b><span>' + esc(u.t) + '</span>'; nav.appendChild(l);
  });
  const l = document.createElement('a'); l.href = '#practice'; l.dataset.u = 'practice'; l.innerHTML = '<b>★</b><span>Latihan</span>'; nav.appendChild(l);
  if ('IntersectionObserver' in window) {
    const links = {}; nav.querySelectorAll('a[data-u]').forEach(x => { links[x.dataset.u] = x; });
    const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; Object.keys(links).forEach(k => links[k].classList.remove('on')); const t = links[e.target.id]; if (t) { t.classList.add('on'); nav.scrollLeft = t.offsetLeft - nav.clientWidth / 2 + t.clientWidth / 2; } }), { rootMargin: '-25% 0px -65% 0px' });
    document.querySelectorAll('article.unit, #practice').forEach(s => io.observe(s));
  }
}

/* ══ PROGRESS (TSWProgress bila ada + cadangan localStorage) ══ */
const LS = 'tsw_level2_v1', MODES = ['reading', 'listening', 'speaking'];
const loadP = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } };
function record(mode, topic, ok) {
  try { window.TSWProgress && TSWProgress.record(LEVEL, mode, topic, ok); } catch (e) {}
  const p = loadP(); (p[mode] = p[mode] || []).push(ok ? 1 : 0); if (p[mode].length > 30) p[mode].shift();
  try { localStorage.setItem(LS, JSON.stringify(p)); } catch (e) {}
}
function stats(mode) { const a = loadP()[mode] || [], r = a.slice(-10); return { n: r.length, pct: r.length ? Math.round(r.reduce((x, y) => x + y, 0) * 100 / r.length) : 0 }; }
function renderProg() {
  $('prog').innerHTML = MODES.map(m => { const s = stats(m), done = s.n >= 10 && s.pct >= 70; return '<div><b>' + m.toUpperCase() + '</b><br>' + s.pct + '% dari ' + s.n + ' jawaban terakhir' + (done ? ' · ✅ lulus' : ' · target ≥70% (min. 10)') + '</div>'; }).join('');
}

/* ══ PRACTICE: generator soal ══ */
function mk(topic, prompt, ans, pool, exp, extra, n) {
  const wrong = shuffle(pool.filter(x => String(x) !== String(ans))).slice(0, (n || 4) - 1), opts = shuffle([ans].concat(wrong)).map(String);
  return Object.assign({ kind: 'choice', topic, prompt, options: opts, correct: opts.indexOf(String(ans)), explanation: exp }, extra || {});
}
const DOT_TXT = { h: '3 ketuk', q: '1½ ketuk' };
const READING = [
  () => { const d = pick(['h', 'q']); return mk('dotted', 'Dalam 4/4, berapa ketuk nilai not bertitik ini?', DOT_TXT[d], ['3 ketuk', '1½ ketuk', '2 ketuk', '1 ketuk'], 'Titik menambah setengah nilai not: half 2 + 1 = 3, quarter 1 + ½ = 1½.', { visual: staff([{ m: 71, d, dot: 1 }]) }); },
  () => mk('dotted', 'Satu bar 4/4 berisi dotted half note. Not apa yang melengkapi bar?', 'Quarter note', ['Quarter note', 'Half note', 'Eighth note', 'Whole note'], '4 − 3 = 1 ketuk, yaitu quarter note.', { visual: staff([{ m: 71, d: 'h', dot: 1 }], { ts: [4, 4] }) }),
  () => { const T = [['Titik di samping not menambah…', 'Setengah dari nilai not itu', ['Setengah dari nilai not itu', 'Satu ketuk penuh', 'Dua kali nilai not', 'Tinggi nada']], ['Garis lengkung yang menyambung dua not sama disebut…', 'Tie', ['Tie', 'Beam', 'Clef', 'Barline']], ['Dua half note yang di-tie berbunyi selama…', '4 ketuk', ['4 ketuk', '2 ketuk', '3 ketuk', '1 ketuk']]], t = pick(T); return mk('dotted', t[0], t[1], t[2], 'Titik menambah ½ nilai; tie menyatukan durasi nada yang sama.'); },
  () => { const t = pick(REL), rev = Math.random() < .5; return mk('minor', 'Relative minor dari ' + (rev ? t[0] : t[1] + ' → relative major-nya') + '?', rev ? t[1] : t[0], REL.map(x => rev ? x[1] : x[0]), 'Relative minor berada pada nada ke-6 tangga nada mayor; keduanya memakai nada yang sama.'); },
  () => { const k = pick(Object.keys(MINORS)), d = rnd(2, 7), M = MINORS[k]; return mk('minor', 'Nada ke-' + d + ' pada ' + k + ' minor (natural) adalah…', M.n[d - 1], ['A', 'B', 'C', 'D', 'E', 'F', 'F♯', 'G', 'B♭'], k + ' minor: ' + M.n.join(' – ') + '.', { after: () => MIN.forEach((x, i) => later(() => tone(M.r + x, .5, .7), i * 330)) }); },
  () => mk('minor', 'Pola jarak tangga nada minor natural adalah…', 'W–H–W–W–H–W–W', ['W–H–W–W–H–W–W', 'W–W–H–W–W–W–H', 'H–W–W–H–W–W–W', 'W–W–W–H–W–W–H'], 'Mayor: W–W–H–W–W–W–H. Minor natural: W–H–W–W–H–W–W.'),
  () => { const t = pick(SIGS); return mk('keysig', t[0] + ' memiliki…', t[1], SIGS.map(x => x[1]), 'Naik satu kuint menambah satu sharp; turun satu kuint menambah satu flat.'); },
  () => { const k = pick(Object.keys(KEYS)), p = pick(PROG), K = KEYS[k], r = K.r + p[1], pool = ['C', 'D', 'E', 'F', 'G', 'A', 'B♭', 'B']; return mk('chords', 'Pada kunci ' + k + ' major, akor ' + p[0] + ' adalah akor…', nm(r, K.fl), pool, 'I = nada ke-1, IV = nada ke-4, V = nada ke-5 tangga nada mayor.', { visual: staff([{ m: triad(r, 0), d: 'w', flat: K.fl }]), after: () => chord(triad(r, 0), 2, .7) }); },
  () => mk('chords', 'Progresi mana yang terasa paling "tuntas" di akhir?', 'I–IV–V–I', ['I–IV–V–I', 'I–IV–V', 'I–V–IV', 'IV–V–IV'], 'Akor V ingin kembali ke I, sehingga berakhir di I terdengar selesai.')
];
const LISTENING = [
  () => { const mn = Math.random() < .5, r = pick([57, 60, 62, 65]); return mk('minor', 'Dengarkan tangga nada ini. Terdengar…', mn ? 'Minor (sendu)' : 'Mayor (cerah)', ['Mayor (cerah)', 'Minor (sendu)'], 'Minor natural memiliki nada ke-3, ke-6, dan ke-7 yang lebih rendah.', { play: () => (mn ? MIN : MAJ).forEach((x, i) => later(() => tone(r + x, .6, .75), i * 450)) }, 2); },
  () => { const full = Math.random() < .5, C = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]]; return mk('chords', 'Dengarkan progresi akor. Akhirnya terdengar…', full ? 'Tuntas (kembali ke I)' : 'Menggantung (berhenti di V)', ['Tuntas (kembali ke I)', 'Menggantung (berhenti di V)'], full ? 'Akor V kembali ke I sehingga terasa selesai.' : 'Berhenti di V menimbulkan rasa ingin lanjut.', { play: () => C.slice(0, full ? 4 : 3).forEach((c, i) => later(() => chord(c, 1.4, .7), i * 1100)) }, 2); },
  () => { const P = { 'Rata: ta ta ta ta': [0, 1, 2, 3], 'Bertitik: ta-a ti ta-a ti': [0, 1.5, 2, 3.5], 'Panjang: ta-aa ta ta': [0, 2, 3] }, k = pick(Object.keys(P)); return mk('dotted', 'Dengarkan polanya. Mana yang sesuai?', k, Object.keys(P), 'Not bertitik memberi kesan panjang–pendek yang berayun.', { play: () => P[k].forEach(b => later(() => tone(71, .4, .8), b * 560)) }, 3); },
  () => { const mn = Math.random() < .5, r = pick([55, 60, 62, 65]); return mk('chords', 'Dengarkan akor ini. Terdengar…', mn ? 'Minor (lebih sendu)' : 'Major (lebih cerah)', ['Major (lebih cerah)', 'Minor (lebih sendu)'], 'Hanya 3rd yang berbeda: minor satu semitone lebih rendah.', { play: () => chord(triad(r, mn), 2.2, .7) }, 2); }
];
const SPEAKING = [
  () => { const m = pick([57, 59, 60, 62, 64, 65, 67]); return { kind: 'sing', topic: 'match', steps: [m], prompt: 'Dengarkan nada acuan, lalu humming nada yang sama.', play: () => tone(m, 2.2), explanation: 'Pitch matching: octave mana pun diterima.' }; },
  () => { const k = pick(Object.keys(MINORS)), M = MINORS[k], t = M.r + 3; return { kind: 'sing', topic: 'minor', steps: [t], labels: [nm(t, M.fl)], prompt: 'Dengarkan nada dasar ' + k + ' minor. Nyanyikan nada ke-3 (' + nm(t, M.fl) + ').', play: () => tone(M.r, 2.2), playTarget: () => tone(t, 2.2), explanation: 'Nada ke-3 minor berjarak 3 semitone dari nada dasar.' }; },
  () => { const k = pick(Object.keys(MINORS)), M = MINORS[k], st = [M.r, M.r + 3, M.r + 7], lab = st.map(x => nm(x, M.fl)); return { kind: 'sing', topic: 'sequence', steps: st, labels: lab, prompt: 'Nyanyikan akor ' + k + ' minor satu per satu: ' + lab.join('–') + '.', play: () => arp(st, 800, 1), explanation: 'Arpeggio minor: nada dasar, +3, +7 semitone.' }; },
  () => { const k = pick(Object.keys(KEYS)), K = KEYS[k], st = [K.r, K.r + 5, K.r + 7], lab = st.map(x => nm(x, K.fl)); return { kind: 'sing', topic: 'chords', steps: st, labels: lab, prompt: 'Nyanyikan nada dasar akor I–IV–V di ' + k + ' major: ' + lab.join('–') + '.', play: () => arp(st, 800, 1), explanation: 'Akor I, IV, V berakar pada nada ke-1, ke-4, dan ke-5.' }; }
];
const GENS = { reading: READING, listening: LISTENING, speaking: SPEAKING };
const TOPICS = { dotted: 'Not bertitik', minor: 'Tangga nada minor', keysig: 'Armature kunci', chords: 'Akor I–IV–V', match: 'Pitch matching', sequence: 'Urutan nada' };
let mode = 'reading', q = null, answered = false, busy = false, lastGen = -1, hist = [], sess = { n: 0, ok: 0, streak: 0 };

function newQ() {
  const g = GENS[mode]; let c = null;
  for (let t = 0; t < 30; t++) { let gi = rnd(0, g.length - 1); if (gi === lastGen && g.length > 1 && t < 20) continue; c = g[gi](); lastGen = gi; const sig = mode + c.prompt + (c.options ? c.options[c.correct] : c.steps); if (hist.indexOf(sig) < 0 || t === 29) { hist.push(sig); if (hist.length > 12) hist.shift(); return c; } }
  return c;
}
function scoreBar() { const s = stats(mode); return '<div class="lp-score">Skor terkini <b>' + s.pct + '%</b> · ' + s.n + ' jawaban terakhir · target ≥70% dari minimal 10 jawaban<div class="lp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + s.pct + '"><i style="width:' + s.pct + '%"></i><u></u></div></div>'; }

function render() {
  stopAll(); busy = false; q = newQ(); answered = false;
  let h = '<div class="lp-card lp-in"><div class="lp-top"><span class="lp-chip">' + mode.toUpperCase() + ' · ' + esc(TOPICS[q.topic] || q.topic) + '</span><span class="lp-count">Soal ke-' + (sess.n + 1) + ' · benar ' + sess.ok + (sess.streak > 1 ? ' · 🔥 ' + sess.streak : '') + '</span></div><div class="lp-body">' + scoreBar() + '<p class="lp-prompt">' + esc(q.prompt) + '</p>';
  if (q.visual) h += q.visual;
  if (q.kind === 'choice' && mode === 'listening') h += '<div class="lp-audiorow"><button type="button" class="lp-play" id="lpPlay">▶ Dengarkan</button></div><p class="lp-hint">Boleh diputar ulang sebanyak yang kamu mau.</p>';
  if (q.kind === 'sing') {
    h += '<div class="lp-target"><span>' + (q.steps.length > 1 ? q.labels.join(' · ') : (q.labels ? q.labels[0] : nm(q.steps[0], 0))) + '</span><small>NADA TARGET</small></div><div class="lp-audiorow"><button type="button" class="lp-play" id="lpPlay">▶ Nada acuan</button>' + (q.playTarget ? '<button type="button" class="lp-play lp-alt" id="lpTarget">♪ Dengar target</button>' : '') + '<button type="button" class="lp-play lp-rec" id="lpMic">● Mulai humming</button></div><p class="lp-hint">Humming "mmm" atau "aaa" panjang dan stabil di tempat tenang. Mikrofon hanya aktif setelah kamu menekan tombol.</p>';
  }
  if (q.kind === 'choice') h += '<div class="lp-options" id="answers">' + q.options.map((o, i) => '<button type="button" data-i="' + i + '"><kbd>' + (i + 1) + '</kbd>' + esc(o) + '</button>').join('') + '</div>';
  h += '<p class="lp-fb" id="fb" role="status" aria-live="polite"></p><div class="lp-actions"><button type="button" class="lp-skip" id="lpSkip">Lewati soal (tidak dihitung)</button><button type="button" class="lp-next" id="lpNext" hidden>Soal berikutnya →</button></div></div></div>';
  $('lab').innerHTML = h;
  if ($('lpPlay')) $('lpPlay').onclick = () => { stopAll(); q.play(); };
  if ($('lpTarget')) $('lpTarget').onclick = () => { stopAll(); q.playTarget(); };
  if ($('lpMic')) $('lpMic').onclick = () => runSing(q);
  if ($('answers')) $('answers').onclick = e => { const b = e.target.closest('button[data-i]'); if (b && !b.disabled) finish(+b.dataset.i === q.correct, q.explanation, b); };
  $('lpSkip').onclick = render; $('lpNext').onclick = render;
  if (q.kind === 'choice' && mode === 'listening') later(() => { }, 0);
}
function finish(ok, text, btn, prefix) {
  if (answered) return; answered = true; sess.n++; if (ok) { sess.ok++; sess.streak++; } else sess.streak = 0;
  record(mode, q.topic, ok);
  document.querySelectorAll('#answers button').forEach((b, i) => { b.disabled = true; if (i === q.correct) b.classList.add('ok'); });
  if (btn) btn.classList.add(ok ? 'ok' : 'bad');
  const fb = $('fb'); fb.className = 'lp-fb ' + (ok ? 'ok' : 'err'); fb.textContent = (ok ? 'Tepat. ' : 'Belum tepat. ') + (prefix ? prefix + ' ' : '') + text;
  $('lpSkip').hidden = true; $('lpNext').hidden = false; $('lpNext').focus();
  if (q.after) later(q.after, 350);
  const sc = document.querySelector('.lp-score'); if (sc) sc.outerHTML = scoreBar();
  renderProg();
}
document.addEventListener('keydown', e => {
  if (!q || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (!answered && q.kind === 'choice' && /^[1-9]$/.test(e.key)) { const b = document.querySelector('#answers button[data-i="' + (+e.key - 1) + '"]'); if (b) b.click(); }
  else if (answered && (e.key === 'ArrowRight' || e.key === 'n')) render();
});

/* ══ MIKROFON: pitch YIN (peka untuk humming) ══ */
function yin(buf, sr) {
  const N = buf.length; let rms = 0; for (let i = 0; i < N; i++) rms += buf[i] * buf[i];
  if (Math.sqrt(rms / N) < .004) return null;
  const minL = Math.max(2, Math.floor(sr / 850)), maxL = Math.min(Math.floor(sr / 75), N >> 1), df = new Float32Array(maxL + 1);
  for (let l = 1; l <= maxL; l++) { let s = 0; for (let i = 0; i < N - l; i++) { const d = buf[i] - buf[i + l]; s += d * d; } df[l] = s; }
  const cm = new Float32Array(maxL + 1); cm[0] = 1; let run = 0;
  for (let l = 1; l <= maxL; l++) { run += df[l]; cm[l] = run ? df[l] * l / run : 1; }
  let ch = -1;
  for (let l = minL; l <= maxL; l++) if (cm[l] < .22) { while (l + 1 <= maxL && cm[l + 1] < cm[l]) l++; ch = l; break; }
  if (ch < 0) { let b = 1; for (let l = minL; l <= maxL; l++) if (cm[l] < b) { b = cm[l]; ch = l; } if (b > .42) return null; }
  const L = cm[ch - 1] || cm[ch], C = cm[ch], R = cm[ch + 1] || cm[ch], den = L - 2 * C + R, sh = den ? .5 * (L - R) / den : 0;
  return sr / (ch + Math.max(-.5, Math.min(.5, sh)));
}
const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
function capture(an, buf, ms, tick) {
  const rd = [], t0 = performance.now();
  return new Promise(res => { const f = () => { if (performance.now() - t0 >= ms) return res(rd); an.getFloatTimeDomainData(buf); const h = yin(buf, actx.sampleRate); if (h) { const m = 69 + 12 * Math.log2(h / 440); rd.push(m); tick && tick(m); } setTimeout(f, 50); }; f(); });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function runSing(Q) {
  if (busy || answered) return; busy = true; const btn = $('lpMic'), fb = $('fb'); btn.disabled = true; btn.textContent = '● Meminta izin mikrofon…';
  const fail = msg => { busy = false; if ($('lpMic')) { $('lpMic').disabled = false; $('lpMic').textContent = '● Coba lagi'; } fb.className = 'lp-fb err'; fb.textContent = msg; };
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return fail('Browser ini tidak menyediakan akses mikrofon. Gunakan HTTPS atau localhost, atau tekan "Lewati soal".');
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
    ac(); const an = actx.createAnalyser(); an.fftSize = 4096; an.smoothingTimeConstant = 0;
    const src = actx.createMediaStreamSource(stream), buf = new Float32Array(an.fftSize); src.connect(an);
    const res = [];
    for (let i = 0; i < Q.steps.length; i++) {
      const lab = Q.labels ? Q.labels[i] : nm(Q.steps[i], 0);
      btn.textContent = '● Nyanyikan ' + lab + (Q.steps.length > 1 ? ' (' + (i + 1) + '/' + Q.steps.length + ')' : '');
      fb.className = 'lp-fb'; fb.textContent = 'Siap… nyanyikan ' + lab + ' sekarang dan tahan.';
      await sleep(500);
      const rd = await capture(an, buf, 3200, m => { fb.textContent = 'Terdengar: ' + nm(Math.round(m), 0, 1) + ' · tahan nadanya…'; });
      const med = median(rd); let diff = null;
      if (med != null && rd.length >= 4) { diff = ((med - Q.steps[i]) % 12 + 12) % 12; if (diff > 6) diff -= 12; }
      res.push({ lab, med, diff, ok: diff != null && Math.abs(diff) <= .7 });
      if (i < Q.steps.length - 1) await sleep(500);
    }
    stream.getTracks().forEach(t => t.stop()); src.disconnect(); an.disconnect();
    if (res.every(r => r.med == null)) return fail('Nada belum terdeteksi. Coba lagi di tempat tenang, dekatkan mikrofon, dan humming "mmm" yang panjang. Percobaan ini tidak dihitung.');
    const ok = res.every(r => r.ok), det = res.map(r => r.med == null ? r.lab + ': tidak terdeteksi' : r.lab + ': ' + nm(Math.round(r.med), 0, 1) + (r.ok ? ' ✓' : r.diff > 0 ? ' (agak tinggi)' : ' (agak rendah)')).join(' · ');
    busy = false; btn.textContent = 'Humming selesai'; finish(ok, ok ? Q.explanation : 'Coba lagi dan perhatikan arah koreksinya.', null, det + '.');
  } catch (e) {
    if (stream) stream.getTracks().forEach(t => t.stop());
    fail(e && e.name === 'NotAllowedError' ? 'Izin mikrofon ditolak. Kamu tetap bisa belajar tanpa mikrofon; tekan "Lewati soal".' : 'Mikrofon tidak dapat digunakan. Periksa izin browser lalu coba lagi.');
  }
}

document.querySelectorAll('.l-tabs [role="tab"]').forEach(t => t.addEventListener('click', () => {
  mode = t.dataset.mode; sess = { n: 0, ok: 0, streak: 0 }; hist = []; lastGen = -1;
  document.querySelectorAll('.l-tabs [role="tab"]').forEach(i => { const on = i === t; i.setAttribute('aria-selected', String(on)); i.classList.toggle('active', on); });
  render();
}));
document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
buildUnits(); renderProg(); render();
})();
