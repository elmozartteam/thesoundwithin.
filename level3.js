/* THE SOUND WITHIN · SOUNDPATH LEVEL 3
   Birama 6/8, harmonic/melodic minor, kualitas interval, akor septim. Reading / Listening / Speaking.
   Memakai TSWAudio, TSWInstruments, TSWProgress bila ada; jika tidak, memakai synth dan localStorage bawaan. */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const LEVEL = 3, LET = 'CDEFGAB', PCW = [0, 2, 4, 5, 7, 9, 11];
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
const MAJ = [0, 2, 4, 5, 7, 9, 11, 12], MIN = [0, 2, 3, 5, 7, 8, 10, 12], HARM = [0, 2, 3, 5, 7, 8, 11, 12], MELU = [0, 2, 3, 5, 7, 9, 11, 12];
const MROOT = { A: 69, E: 64 }, MNAMES = { A: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], E: ['E', 'F♯', 'G', 'A', 'B', 'C', 'D'] };
const HM = { A: { n7: 'G', h7: 'G♯', m6: 'F♯' }, E: { n7: 'D', h7: 'D♯', m6: 'C♯' } };
const INTQ = [['Minor 2nd', 1], ['Major 2nd', 2], ['Minor 3rd', 3], ['Major 3rd', 4], ['Perfect 4th', 5], ['Tritone', 6], ['Perfect 5th', 7], ['Minor 6th', 8], ['Major 6th', 9], ['Minor 7th', 10], ['Major 7th', 11], ['Octave', 12]];
const FLATIV = [1, 3, 8, 10];
const SEV = { 'Major 7th': [0, 4, 7, 11], 'Dominant 7th': [0, 4, 7, 10], 'Minor 7th': [0, 3, 7, 10] };
const SROOT = { C: 60, G: 67, F: 65 };
const dur = it => BEATS[it.d] * (it.dot ? 1.5 : 1);
const sevNames = (r, t) => SEV[t].map(x => nm(r + x, t !== 'Major 7th')).join(' ');

/* ══ MATERI: 4 unit ══ */
const UNITS = [
  { t: 'Birama Majemuk 6/8', tag: 'Unit 1', goal: ['Menjelaskan perbedaan 6/8 dan 3/4.', 'Mengelompokkan eighth note menjadi 3 + 3.'],
    concept: 'Pada birama majemuk seperti 6/8, ada enam eighth note per bar yang dikelompokkan menjadi dua kelompok tiga. Denyut besarnya adalah dotted quarter, sehingga terasa bergoyang: 1-2-3, 4-5-6.',
    pts: ['6/8 = enam eighth note per bar.', 'Dua denyut besar: ketuk 1 dan ketuk 4.', 'Satu denyut besar = dotted quarter note (3 eighth).', '3/4 dikelompokkan 2+2+2, sedangkan 6/8 dikelompokkan 3+3.'],
    mistake: '6/8 bukan 3/4 yang dicepatkan. Bedanya ada pada pengelompokan denyut, bukan hanya kecepatan.',
    check: 'Berapa eighth note dalam satu bar 6/8? Jawaban: 6.',
    demo(h) { const P = { 'Enam eighth': [{ d: 'e' }, { d: 'e' }, { d: 'e' }, { d: 'e' }, { d: 'e' }, { d: 'e' }], 'Dotted quarter ×2': [{ d: 'q', dot: 1 }, { d: 'q', dot: 1 }], 'Dotted quarter + 3 eighth': [{ d: 'q', dot: 1 }, { d: 'e' }, { d: 'e' }, { d: 'e' }], 'Quarter + eighth ×2': [{ d: 'q' }, { d: 'e' }, { d: 'q' }, { d: 'e' }] };
      h.innerHTML = '<p>Pilih pola. Bunyi tajam menandai dua denyut besar tiap bar.</p><div class="row" id="d1b"></div><div id="d1s"></div><p class="note-out" id="d1o"></p>';
      const show = k => { $('d1s').innerHTML = staff(P[k].map(x => ({ m: 71, d: x.d, dot: x.dot })).concat([{ bar: 1 }]), { ts: [6, 8], label: k + ' dalam 6/8' }); $('d1o').textContent = k + ' = ' + P[k].reduce((a, x) => a + dur(x) * 2, 0) + ' eighth (satu bar 6/8)'; };
      Object.keys(P).forEach(k => { const b = document.createElement('button'); b.textContent = k; b.onclick = () => { stopAll(); show(k); const U = 380; for (let bar = 0; bar < 2; bar++) { const o = bar * 3 * U; later(() => click(1), o); later(() => click(0), o + 1.5 * U); let t = 0; P[k].forEach(x => { later(() => tone(71, dur(x) * U / 1000 * .9, .8), o + t * U); t += dur(x); }); } }; $('d1b').appendChild(b); });
      show('Enam eighth'); } },
  { t: 'Harmonic & Melodic Minor', tag: 'Unit 2', goal: ['Membedakan tiga bentuk tangga nada minor.', 'Menyebut nada yang dinaikkan pada tiap bentuk.'],
    concept: 'Natural minor tidak punya nada penuntun yang kuat ke nada dasar. Harmonic minor menaikkan nada ke-7 satu semitone. Melodic minor (naik) menaikkan nada ke-6 dan ke-7.',
    pts: ['A natural minor: A B C D E F G.', 'A harmonic minor: A B C D E F G♯.', 'A melodic minor naik: A B C D E F♯ G♯.', 'Pada harmonic minor, F ke G♯ berjarak tiga semitone, sehingga terdengar khas.'],
    mistake: 'Ketiga bentuk tetap minor karena nada ke-3 tetap rendah. Yang berubah hanya nada ke-6 atau ke-7.',
    check: 'Nada ke-7 pada A harmonic minor adalah… Jawaban: G♯.',
    demo(h) { h.innerHTML = '<div class="row" id="d2r"></div><div class="row" id="d2b"></div><div id="d2s"></div><div id="d2k"></div><p class="note-out" id="d2o"></p>'; let key = 'A', form = 'Natural';
      const F = { Natural: MIN, Harmonic: HARM, 'Melodic (naik)': MELU };
      const show = () => { const r = MROOT[key], sc = F[form].map(x => r + x); $('d2s').innerHTML = staff(sc.map(m => ({ m, d: 'q' })), { label: key + ' ' + form + ' minor' }); $('d2k').innerHTML = kbd(sc.slice(0, 7).map(m => m % 12)); $('d2o').textContent = key + ' minor (' + form + '): ' + sc.map(m => nm(m, 0)).join(' – '); };
      Object.keys(MROOT).forEach(k => { const b = document.createElement('button'); b.textContent = k + ' minor'; b.onclick = () => { key = k; show(); }; $('d2r').appendChild(b); });
      Object.keys(F).forEach(f => { const b = document.createElement('button'); b.textContent = '▶ ' + f; b.onclick = () => { stopAll(); form = f; show(); F[f].forEach((x, i) => later(() => tone(MROOT[key] + x, .6, .8), i * 480)); }; $('d2b').appendChild(b); }); show(); } },
  { t: 'Kualitas Interval', tag: 'Unit 3', goal: ['Menyebut interval lengkap dengan kualitasnya.', 'Menghubungkan nama interval dengan jumlah semitone.'],
    concept: 'Selain nomor, interval punya kualitas: major, minor, atau perfect. Kualitas ditentukan oleh jumlah semitone antara dua nada.',
    pts: ['Minor 2nd = 1, Major 2nd = 2, Minor 3rd = 3, Major 3rd = 4 semitone.', 'Perfect 4th = 5, Tritone = 6, Perfect 5th = 7 semitone.', 'Minor 6th = 8, Major 6th = 9, Minor 7th = 10, Major 7th = 11 semitone.', 'Octave = 12 semitone. 4th, 5th, dan octave bersifat perfect.'],
    mistake: 'C–E dan C–E♭ sama-sama 3rd, tetapi E adalah major 3rd (4 semitone) dan E♭ minor 3rd (3 semitone).',
    check: 'Berapa semitone dalam minor 3rd? Jawaban: 3.',
    demo(h) { h.innerHTML = '<p>Pilih interval dari C4.</p><div class="row" id="d3b"></div><div id="d3s"></div><div class="row"><button id="d3m">▶ Melodic</button><button id="d3h">▶ Harmonic</button></div><p class="note-out" id="d3o"></p>'; let cur = INTQ[6];
      const show = iv => { cur = iv; const fl = FLATIV.indexOf(iv[1]) >= 0; $('d3s').innerHTML = staff([{ m: 60, d: 'q' }, { m: 60 + iv[1], d: 'q', flat: fl }], { label: 'C4 ke ' + iv[0] }); $('d3o').textContent = 'C4 → ' + nm(60 + iv[1], fl, 1) + ' = ' + iv[0] + ' (' + iv[1] + ' semitone)'; };
      INTQ.forEach(iv => { const b = document.createElement('button'); b.textContent = iv[0]; b.onclick = () => { stopAll(); show(iv); arp([60, 60 + iv[1]], 800, 1); }; $('d3b').appendChild(b); });
      $('d3m').onclick = () => { stopAll(); arp([60, 60 + cur[1]], 800, 1); }; $('d3h').onclick = () => { stopAll(); chord([60, 60 + cur[1]], 2, .75); }; show(cur); } },
  { t: 'Akor Septim (7th)', tag: 'Unit 4', goal: ['Menyusun akor major 7th, dominant 7th, dan minor 7th.', 'Membedakan warna ketiganya dengan telinga.'],
    concept: 'Akor septim menambahkan nada ke-4 (interval 7th dari nada dasar) di atas triad. Jenis triad dan jarak 7th menentukan warna akornya.',
    pts: ['Major 7th: triad mayor + 7th mayor (11 semitone), contoh Cmaj7 = C E G B.', 'Dominant 7th: triad mayor + 7th minor (10 semitone), contoh G7 = G B D F.', 'Minor 7th: triad minor + 7th minor, contoh Cm7 = C E♭ G B♭.', 'Dominant 7th terdengar tegang dan ingin kembali ke akor I.'],
    mistake: 'Angka 7 bukan jumlah nada akor. Itu nama interval dari nada dasar ke nada tambahan.',
    check: 'G7 terdiri dari nada apa? Jawaban: G B D F.',
    demo(h) { h.innerHTML = '<div class="row" id="d4r"></div><div class="row" id="d4q"></div><div id="d4s"></div><div id="d4k"></div><div class="row"><button id="d4a">▶ Bersamaan</button><button id="d4b">▶ Arpeggio</button></div><p class="note-out" id="d4o"></p>'; let r = 60, rn = 'C', t = 'Dominant 7th';
      const ms = () => SEV[t].map(x => r + x);
      const show = () => { $('d4s').innerHTML = staff([{ m: ms(), d: 'w', flat: t !== 'Major 7th' }], { label: rn + ' ' + t }); $('d4k').innerHTML = kbd(ms().map(x => x % 12)); $('d4o').textContent = rn + ' ' + t + ': ' + sevNames(r, t); };
      Object.keys(SROOT).forEach(k => { const b = document.createElement('button'); b.textContent = k; b.onclick = () => { rn = k; r = SROOT[k]; show(); }; $('d4r').appendChild(b); });
      Object.keys(SEV).forEach(k => { const b = document.createElement('button'); b.textContent = k; b.onclick = () => { t = k; show(); }; $('d4q').appendChild(b); });
      $('d4a').onclick = () => { stopAll(); chord(ms(), 2.6, .65); }; $('d4b').onclick = () => { stopAll(); arp(ms(), 550, 1.6); }; show(); } }
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
const LS = 'tsw_level3_v1', MODES = ['reading', 'listening', 'speaking'];
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
const READING = [
  () => mk('compound', 'Berapa eighth note dalam satu bar 6/8?', '6', ['3', '4', '6', '8'], '6/8 berarti enam ketukan eighth per bar.', { visual: staff([{ m: 71, d: 'e' }, { m: 71, d: 'e' }, { m: 71, d: 'e' }, { m: 71, d: 'e' }, { m: 71, d: 'e' }, { m: 71, d: 'e' }, { bar: 1 }], { ts: [6, 8] }) }),
  () => mk('compound', 'Pada 6/8, satu denyut besar (ada dua per bar) setara dengan…', 'Dotted quarter note', ['Dotted quarter note', 'Quarter note', 'Half note', 'Eighth note'], 'Dotted quarter = 3 eighth = satu kelompok tiga.'),
  () => mk('compound', 'Satu bar 6/8 berisi satu dotted quarter. Not apa yang melengkapi bar?', 'Dotted quarter note', ['Dotted quarter note', 'Quarter note', 'Half note', 'Whole note'], '6 − 3 = 3 eighth = dotted quarter.', { visual: staff([{ m: 71, d: 'q', dot: 1 }], { ts: [6, 8] }) }),
  () => { const T = [['6/8 biasanya dikelompokkan menjadi…', '2 kelompok tiga', ['2 kelompok tiga', '3 kelompok dua', '6 kelompok satu', '1 kelompok enam']], ['Perbedaan utama 6/8 dan 3/4 adalah…', 'Pengelompokan 3+3 dibanding 2+2+2', ['Pengelompokan 3+3 dibanding 2+2+2', 'Nada lebih tinggi', 'Selalu lebih cepat', 'Tidak ada perbedaan']]], t = pick(T); return mk('compound', t[0], t[1], t[2], '6/8 terasa bergoyang 1-2-3, 4-5-6; 3/4 terasa 1-2-3 dengan tiga denyut.'); },
  () => { const k = pick(['A', 'E']), H = HM[k]; return mk('minor', 'Nada ke-7 pada ' + k + ' harmonic minor adalah…', H.h7, [H.n7, H.h7, H.m6, 'C', 'B'], 'Harmonic minor menaikkan nada ke-7 dari ' + H.n7 + ' menjadi ' + H.h7 + '.', { after: () => HARM.forEach((x, i) => later(() => tone(MROOT[k] + x, .5, .7), i * 330)) }); },
  () => mk('minor', 'Apa beda harmonic minor dengan natural minor?', 'Nada ke-7 dinaikkan satu semitone', ['Nada ke-7 dinaikkan satu semitone', 'Nada ke-3 dinaikkan', 'Nada ke-5 diturunkan', 'Tidak ada perbedaan'], 'Hanya nada ke-7 yang berubah.'),
  () => mk('minor', 'Melodic minor (naik) menaikkan nada ke…', 'Ke-6 dan ke-7', ['Ke-6 dan ke-7', 'Ke-3 saja', 'Ke-2 dan ke-5', 'Ke-4 saja'], 'Nada ke-6 dan ke-7 dinaikkan satu semitone saat naik.'),
  () => mk('minor', 'Pada harmonic minor, jarak antara nada ke-6 dan ke-7 adalah…', '3 semitone', ['1 semitone', '2 semitone', '3 semitone', '4 semitone'], 'Contoh A harmonic: F ke G♯ = 3 semitone, jarak khas yang terdengar "melengkung".'),
  () => { const iv = pick(INTQ), fl = FLATIV.indexOf(iv[1]) >= 0; return mk('intervalq', 'Interval dari nada bawah ke nada atas ini adalah…', iv[0], INTQ.map(x => x[0]), iv[0] + ' = ' + iv[1] + ' semitone.', { visual: staff([{ m: 60, d: 'q' }, { m: 60 + iv[1], d: 'q', flat: fl }]), after: () => arp([60, 60 + iv[1]], 700, 1) }); },
  () => { const iv = pick(INTQ); return mk('intervalq', 'Berapa semitone pada ' + iv[0] + '?', String(iv[1]), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], iv[0] + ' = ' + iv[1] + ' semitone.'); },
  () => mk('intervalq', 'Interval mana yang termasuk "perfect"?', pick(['Perfect 5th']), ['Perfect 5th', 'Major 3rd', 'Minor 6th', 'Major 7th'], 'Yang bersifat perfect: 4th, 5th, dan octave.'),
  () => { const rn = pick(Object.keys(SROOT)), t = pick(Object.keys(SEV)), r = SROOT[rn]; return mk('sevenths', rn + ' ' + t + ' terdiri dari nada…', sevNames(r, t), Object.keys(SEV).map(x => sevNames(r, x)).concat([sevNames(r + 2, 'Minor 7th')]), 'Rumus ' + t + ': ' + SEV[t].join('–') + ' semitone dari nada dasar.', { visual: staff([{ m: SEV[t].map(x => r + x), d: 'w', flat: t !== 'Major 7th' }]), after: () => chord(SEV[t].map(x => r + x), 2.4, .65) }); },
  () => { const t = pick(Object.keys(SEV)), r = SROOT[pick(Object.keys(SROOT))]; return mk('sevenths', 'Akor pada paranada ini jenisnya…', t, Object.keys(SEV), 'Lihat triad (mayor atau minor) dan jarak 7th: major 7th = 11, lainnya = 10 semitone.', { visual: staff([{ m: SEV[t].map(x => r + x), d: 'w', flat: t !== 'Major 7th' }]), after: () => chord(SEV[t].map(x => r + x), 2.4, .65) }, 3); },
  () => mk('sevenths', 'Dominant 7th = triad mayor ditambah…', '7th minor (10 semitone)', ['7th minor (10 semitone)', '7th mayor (11 semitone)', '6th mayor (9 semitone)', '5th (7 semitone)'], 'Contoh G7 = G B D F; F adalah 10 semitone di atas G.')
];
const LISTENING = [
  () => { const six = Math.random() < .5, g = six ? 3 : 4; return mk('compound', 'Dengarkan: bunyi tajam menandai awal kelompok. Terasa seperti…', six ? '6/8 (kelompok tiga)' : '4/4 (kelompok empat)', ['6/8 (kelompok tiga)', '4/4 (kelompok empat)'], 'Hitung ada berapa bunyi sampai bunyi tajam berikutnya: tiga berarti 6/8, empat berarti 4/4.', { play: () => { for (let i = 0; i < 24; i++) later(() => click(i % g === 0), i * 300); } }, 2); },
  () => { const harm = Math.random() < .5, r = pick([69, 64]); return mk('minor', 'Dengarkan tangga nada minor ini. Bentuknya…', harm ? 'Harmonic minor' : 'Natural minor', ['Natural minor', 'Harmonic minor'], harm ? 'Nada ke-7 dinaikkan sehingga loncatan ke-6 ke ke-7 terdengar khas.' : 'Nada ke-7 normal; tidak ada loncatan khas.', { play: () => (harm ? HARM : MIN).forEach((x, i) => later(() => tone(r + x, .55, .75), i * 430)) }, 2); },
  () => { const P = pick([[3, 4], [8, 9], [10, 11], [1, 2]]), a = pick(P), nameOf = s => INTQ.filter(x => x[1] === s)[0][0], r = rnd(55, 64); return mk('intervalq', 'Dengarkan dua nada. Intervalnya…', nameOf(a), P.map(nameOf), 'Selisih satu semitone membedakan minor dan major.', { play: () => arp([r, r + a], 900, 1.3) }, 2); },
  () => { const t = pick(Object.keys(SEV)), r = pick([55, 60, 65]); return mk('sevenths', 'Dengarkan akor ini. Jenisnya…', t, Object.keys(SEV), 'Major 7th terdengar lembut, dominant 7th tegang, minor 7th sendu dan hangat.', { play: () => chord(SEV[t].map(x => r + x), 2.6, .65) }, 3); }
];
const SPEAKING = [
  () => { const m = pick([57, 59, 60, 62, 64, 65, 67]); return { kind: 'sing', topic: 'match', steps: [m], prompt: 'Dengarkan nada acuan, lalu humming nada yang sama.', play: () => tone(m, 2.2), explanation: 'Pitch matching: octave mana pun diterima.' }; },
  () => { const k = pick(['A', 'E']), r = MROOT[k], t = r + 11; return { kind: 'sing', topic: 'minor', steps: [t], labels: [nm(t, 0)], prompt: 'Dengarkan nada dasar ' + k + ' minor. Nyanyikan nada ke-7 harmonic minor (' + nm(t, 0) + ').', play: () => tone(r, 2.2), playTarget: () => tone(t, 2.2), explanation: 'Nada ke-7 harmonic minor berjarak 11 semitone dari nada dasar.' }; },
  () => { const r = pick([60, 62, 65]), iv = pick(INTQ.filter(x => [3, 4, 8, 9].indexOf(x[1]) >= 0)), t = r + iv[1]; return { kind: 'sing', topic: 'intervalq', steps: [t], labels: [nm(t, FLATIV.indexOf(iv[1]) >= 0)], prompt: 'Dengarkan ' + nm(r, 0) + '. Nyanyikan ' + iv[0] + ' di atasnya (' + nm(t, FLATIV.indexOf(iv[1]) >= 0) + ').', play: () => tone(r, 2.2), playTarget: () => tone(t, 2.2), explanation: iv[0] + ' = ' + iv[1] + ' semitone di atas nada awal.' }; },
  () => { const rn = pick(Object.keys(SROOT)), r = SROOT[rn], t = pick(Object.keys(SEV)), st = SEV[t].map(x => r + x), lab = st.map(x => nm(x, t !== 'Major 7th')); return { kind: 'sing', topic: 'sevenths', steps: st, labels: lab, prompt: 'Nyanyikan arpeggio ' + rn + ' ' + t + ' satu per satu: ' + lab.join('–') + '.', play: () => arp(st, 800, 1), explanation: 'Arpeggio ' + t + ': ' + SEV[t].join('–') + ' semitone dari nada dasar.' }; }
];
const GENS = { reading: READING, listening: LISTENING, speaking: SPEAKING };
const TOPICS = { compound: 'Birama 6/8', minor: 'Harmonic/Melodic', intervalq: 'Kualitas interval', sevenths: 'Akor septim', match: 'Pitch matching' };
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
