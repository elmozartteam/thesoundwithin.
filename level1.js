/* THE SOUND WITHIN · SOUNDPATH LEVEL 1
   Notasi, ritme, tangga nada, interval, triad. Reading / Listening / Speaking.
   Memakai TSWAudio, TSWInstruments, TSWProgress bila ada; jika tidak, memakai synth dan localStorage bawaan. */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const LEVEL = 1, LET = 'CDEFGAB', PCW = [0, 2, 4, 5, 7, 9, 11];
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
        if (s.a) body += '<text x="' + (cx - 21) + '" y="' + (y + 5) + '" font-size="17" fill="#C0524A" font-family="serif">' + (s.a > 0 ? '♯' : '♭') + '</text>';
        if (k === 0 && d !== 'w' && ms.length === 1) {
          const up = st < 34;
          body += up ? '<line x1="' + (cx + 6) + '" y1="' + y + '" x2="' + (cx + 6) + '" y2="' + (y - 32) + '" stroke="#14233F" stroke-width="1.8"/>' + (d === 'e' ? '<path d="M' + (cx + 6) + ' ' + (y - 32) + 'q10 8 6 18" fill="none" stroke="#14233F" stroke-width="2"/>' : '')
            : '<line x1="' + (cx - 6) + '" y1="' + y + '" x2="' + (cx - 6) + '" y2="' + (y + 32) + '" stroke="#14233F" stroke-width="1.8"/>' + (d === 'e' ? '<path d="M' + (cx - 6) + ' ' + (y + 32) + 'q10-6 6-16" fill="none" stroke="#14233F" stroke-width="2"/>' : '');
        }
        if (it.l && k === 0) body += '<text x="' + cx + '" y="124" text-anchor="middle" font-size="13" fill="#5B6780">' + esc(it.l) + '</text>';
      });
    }
    x += w;
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
const MAJ = { C: [0, 2, 4, 5, 7, 9, 11, 12], G: [0, 2, 4, 5, 7, 9, 11, 12], D: [0, 2, 4, 5, 7, 9, 11, 12], F: [0, 2, 4, 5, 7, 9, 11, 12] };
const ROOT = { C: 60, G: 67, D: 62, F: 65 }, FLATKEY = { F: 1 };
const MAJNAMES = { C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], G: ['G', 'A', 'B', 'C', 'D', 'E', 'F♯'], D: ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯'], F: ['F', 'G', 'A', 'B♭', 'C', 'D', 'E'] };
const INTV = [['2nd', 2, 'Major 2nd'], ['3rd', 4, 'Major 3rd'], ['4th', 5, 'Perfect 4th'], ['5th', 7, 'Perfect 5th'], ['6th', 9, 'Major 6th'], ['7th', 11, 'Major 7th'], ['Octave', 12, 'Perfect octave']];
const NATM = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83];
const DEG = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];

/* ══ MATERI: 8 unit ══ */
const UNITS = [
  { t: 'Paranada & Kunci G', tag: 'Unit 1', goal: ['Membaca lima garis dan empat spasi.', 'Menyebut nama nada pada kunci G (treble clef), termasuk C4 dengan garis bantu.'],
    concept: 'Paranada (staff) terdiri dari 5 garis dan 4 spasi. Kunci G melingkari garis kedua dari bawah, yaitu nada G4. Makin tinggi posisi nada pada paranada, makin tinggi pitch-nya.',
    pts: ['Garis dari bawah ke atas: E–G–B–D–F ("Every Good Boy Does Fine").', 'Spasi dari bawah ke atas: F–A–C–E ("FACE").', 'Middle C (C4) berada di bawah paranada dan memakai garis bantu (ledger line).'],
    mistake: 'Jangan menghitung dari garis atas. Selalu mulai dari garis paling bawah (E4). Jangan lupa: satu garis dan satu spasi sama-sama satu langkah nama huruf.',
    check: 'Nada pada spasi paling atas paranada adalah… Jawaban: E (F–A–C–E, spasi keempat).',
    demo(h) { h.innerHTML = '<p>Klik sebuah nada untuk melihat posisinya dan mendengarnya.</p><div class="row" id="d1b"></div><div id="d1s">' + staff([{ m: 60, d: 'w', l: 'C4' }], { label: 'C4' }) + '</div>';
      [60, 62, 64, 65, 67, 69, 71, 72].forEach(m => { const b = document.createElement('button'); b.textContent = nm(m, 0, 1); b.onclick = () => { stopAll(); $('d1s').innerHTML = staff([{ m, d: 'w', l: nm(m, 0, 1) }], { label: nm(m, 0, 1) }); tone(m, 1.6); }; $('d1b').appendChild(b); }); } },
  { t: 'Nilai Nada & Tanda Diam', tag: 'Unit 2', goal: ['Menyebut durasi whole, half, quarter, eighth.', 'Mengenali tanda diam (rest) yang setara.'],
    concept: 'Bentuk not menunjukkan berapa lama nada ditahan, bukan seberapa tinggi atau keras. Tanda diam (rest) menunjukkan keheningan dengan durasi yang sama.',
    pts: ['Whole note = 4 ketuk (bulat kosong, tanpa tangkai).', 'Half note = 2 ketuk (bulat kosong + tangkai).', 'Quarter note = 1 ketuk (bulat penuh + tangkai).', 'Eighth note = ½ ketuk (bulat penuh + tangkai + bendera).'],
    mistake: 'Jangan mengira note yang lebih "kecil" selalu lebih pelan. Nilai note hanya soal lama bunyi. Rest tetap dihitung sebagai ketukan.',
    check: 'Berapa quarter note yang sama dengan satu half note? Jawaban: 2.',
    demo(h) { const P = { 'Whole (4)': ['w'], 'Half ×2': ['h', 'h'], 'Quarter ×4': ['q', 'q', 'q', 'q'], 'Eighth ×8': ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'], 'Campuran + rest': ['q', 'e', 'e', 'rq', 'h'] };
      h.innerHTML = '<div class="row" id="d2b"></div><div class="row"><label>Tempo <input id="d2t" type="range" min="50" max="140" value="80"> <b id="d2v">80</b> BPM</label></div><div id="d2s"></div>';
      $('d2t').oninput = () => $('d2v').textContent = $('d2t').value;
      const draw = k => P[k].map(x => x[0] === 'r' ? { r: 1, d: x[1] } : { m: 71, d: x }); const show = k => { $('d2s').innerHTML = staff(draw(k).concat([{ bar: 1 }]), { ts: [4, 4], label: 'Pola ' + k }); };
      Object.keys(P).forEach(k => { const b = document.createElement('button'); b.textContent = k; b.onclick = () => { stopAll(); show(k); const bpm = +$('d2t').value, ms = 60000 / bpm; let t = 0; draw(k).forEach(it => { if (!it.r) later(() => tone(71, BEATS[it.d] * ms / 1000 * .95, .8), t); t += BEATS[it.d] * ms; }); }; $('d2b').appendChild(b); });
      show('Quarter ×4'); } },
  { t: 'Ketukan, Bar & Tanda Birama', tag: 'Unit 3', goal: ['Menjelaskan beat, bar, dan time signature.', 'Membedakan rasa 2, 3, dan 4 ketukan.'],
    concept: 'Beat adalah denyut dasar musik. Beat dikelompokkan dalam bar (birama) yang dipisah garis birama. Angka atas time signature = jumlah ketuk per bar; angka bawah = jenis note yang bernilai satu ketuk.',
    pts: ['4/4: empat quarter note per bar, ketukan 1 paling kuat.', '3/4: tiga ketuk, terasa seperti waltz.', '2/4: dua ketuk, terasa seperti berbaris.', '6/8: enam eighth note, biasanya terasa dua kelompok tiga.', 'Tempo diukur dalam BPM (beats per minute).'],
    mistake: 'Angka bawah bukan pecahan matematika. 3/4 artinya "3 ketuk, tiap ketuk = quarter note".',
    check: 'Pada 3/4, berapa quarter note dalam satu bar? Jawaban: 3.',
    demo(h) { const T = { '2/4': [2, 2, 'q'], '3/4': [3, 3, 'q'], '4/4': [4, 4, 'q'], '6/8': [6, 3, 'e'] };
      h.innerHTML = '<p>Pilih birama. Bunyi tajam = ketukan kuat.</p><div class="row" id="d3b"></div><div id="d3s"></div>';
      const show = k => { const [n, , d] = T[k]; const its = []; for (let i = 0; i < n; i++) its.push({ m: 71, d }); $('d3s').innerHTML = staff(its.concat([{ bar: 1 }]), { ts: k.split('/'), label: 'Birama ' + k }); };
      Object.keys(T).forEach(k => { const b = document.createElement('button'); b.textContent = k; b.onclick = () => { stopAll(); show(k); const [n, g] = T[k]; const bpm = k === '6/8' ? 180 : 92, ms = 60000 / bpm; for (let i = 0; i < n * 2; i++) later(() => click(i % n === 0), i * ms); }; $('d3b').appendChild(b); });
      show('4/4'); } },
  { t: 'Sharp, Flat & Tangga Setengah', tag: 'Unit 4', goal: ['Menjelaskan ♯, ♭, dan ♮.', 'Membedakan whole step dan half step.', 'Menyebut nama enharmonic.'],
    concept: 'Sharp (♯) menaikkan nada satu semitone, flat (♭) menurunkan satu semitone, natural (♮) membatalkan keduanya. Half step = 1 semitone (tuts bersebelahan), whole step = 2 semitone.',
    pts: ['Half step alami hanya terjadi di E–F dan B–C.', 'Tuts hitam punya dua nama: C♯ = D♭, D♯ = E♭, F♯ = G♭, G♯ = A♭, A♯ = B♭.', 'Dua nama untuk satu bunyi disebut enharmonic.'],
    mistake: 'Jangan mengira E♯ atau B♯ itu aneh: secara bunyi E♯ sama dengan F. Jangan pula mengira tuts hitam selalu berada di antara semua tuts putih.',
    check: 'Berapa semitone dari E ke F? Jawaban: 1 (half step).',
    demo(h) { h.innerHTML = '<p>Klik tuts hitam atau putih untuk mendengar dan melihat namanya.</p><div class="row" id="d4b"></div><div id="d4k">' + kbd([0]) + '</div><p class="note-out" id="d4o"></p>';
      for (let p = 0; p < 12; p++) { const b = document.createElement('button'); b.textContent = [1, 3, 6, 8, 10].indexOf(p) >= 0 ? NS[p] + ' / ' + nm(60 + p, 1) : NS[p]; b.onclick = () => { stopAll(); $('d4k').innerHTML = kbd([p]); tone(60 + p, 1.4); $('d4o').textContent = [1, 3, 6, 8, 10].indexOf(p) >= 0 ? NS[p] + ' = ' + nm(60 + p, 1) + ' (enharmonic)' : NS[p] + ' (natural)'; }; $('d4b').appendChild(b); } } },
  { t: 'Tangga Nada Mayor', tag: 'Unit 5', goal: ['Menyusun tangga nada mayor dengan pola W–W–H–W–W–W–H.', 'Menyebut nada ke-1 sampai ke-8 (Do–Re–Mi).'],
    concept: 'Tangga nada mayor adalah delapan nada berurutan dengan pola jarak tetap. Pola ini sama untuk semua nada dasar; yang berubah hanya sharp atau flat yang dibutuhkan.',
    pts: ['Pola: Whole – Whole – Half – Whole – Whole – Whole – Half.', 'C major tidak memiliki sharp atau flat.', 'G major: F♯. D major: F♯ dan C♯. F major: B♭.', 'Solfege: Do Re Mi Fa Sol La Ti Do.'],
    mistake: 'Jangan mengubah pola jarak saat pindah nada dasar. Jika terdengar "salah", periksa apakah sharp atau flat-nya sudah dipakai.',
    check: 'Nada ke-7 pada G major adalah… Jawaban: F♯.',
    demo(h) { h.innerHTML = '<p>Pilih nada dasar, lalu dengarkan tangga nadanya.</p><div class="row" id="d5b"></div><div id="d5s"></div><div id="d5k"></div><p class="note-out" id="d5o"></p>';
      const show = k => { const r = ROOT[k], fl = FLATKEY[k], ms = MAJ[k].map(x => r + x); $('d5s').innerHTML = staff(ms.map((m, i) => ({ m, d: 'q', flat: fl, l: i < 7 ? MAJNAMES[k][i] : MAJNAMES[k][0] })), { label: k + ' major' }); $('d5k').innerHTML = kbd(MAJ[k].slice(0, 7).map(x => (r + x) % 12)); $('d5o').textContent = k + ' major: ' + MAJNAMES[k].join(' – ') + ' – ' + MAJNAMES[k][0] + ' · W W H W W W H'; };
      Object.keys(MAJ).forEach(k => { const b = document.createElement('button'); b.textContent = k + ' major'; b.onclick = () => { stopAll(); show(k); MAJ[k].forEach((x, i) => later(() => tone(ROOT[k] + x, .7, .8), i * 520)); }; $('d5b').appendChild(b); }); show('C'); } },
  { t: 'Interval', tag: 'Unit 6', goal: ['Menghitung interval berdasarkan nama huruf.', 'Mengenali bunyi interval 2nd, 3rd, 5th, dan octave.'],
    concept: 'Interval adalah jarak antara dua nada. Hitung dari nada bawah sebagai 1: C ke E adalah 3rd, C ke G adalah 5th, C ke C berikutnya adalah octave. Melodic = berurutan, harmonic = bersamaan.',
    pts: ['Hitung nama huruf, termasuk nada awal.', 'Contoh dari C: D=2nd, E=3rd, F=4th, G=5th, A=6th, B=7th, C=octave.', 'Perfect 5th terasa kuat dan terbuka; 3rd terasa hangat.'],
    mistake: 'Jangan memulai hitungan dari 0. C–D adalah 2nd, bukan 1st. Interval berbeda dari jumlah semitone, walau saling berkaitan.',
    check: 'D ke A adalah interval apa? Jawaban: 5th (D–E–F–G–A).',
    demo(h) { h.innerHTML = '<p>Pilih interval dari C4.</p><div class="row" id="d6b"></div><div id="d6s"></div><div class="row"><button id="d6m">▶ Melodic</button><button id="d6h">▶ Harmonic</button></div><p class="note-out" id="d6o"></p>'; let cur = INTV[3];
      const show = iv => { cur = iv; $('d6s').innerHTML = staff([{ m: 60, d: 'q' }, { m: 60 + iv[1], d: 'q' }], { label: 'C4 ke ' + iv[0] }); $('d6o').textContent = 'C4 → ' + nm(60 + iv[1], 0, 1) + ' = ' + iv[2] + ' (' + iv[1] + ' semitone)'; };
      INTV.forEach(iv => { const b = document.createElement('button'); b.textContent = iv[0]; b.onclick = () => { stopAll(); show(iv); arp([60, 60 + iv[1]], 800, 1); }; $('d6b').appendChild(b); });
      $('d6m').onclick = () => { stopAll(); arp([60, 60 + cur[1]], 800, 1); }; $('d6h').onclick = () => { stopAll(); chord([60, 60 + cur[1]], 2, .75); }; show(cur); } },
  { t: 'Triad Mayor & Minor', tag: 'Unit 7', goal: ['Menyusun triad dari nada dasar, 3rd, dan 5th.', 'Membedakan triad mayor dan minor dengan telinga.'],
    concept: 'Triad adalah tiga nada yang disusun bertumpuk setiap satu nada lompatan: nada dasar, 3rd, dan 5th. Triad mayor terdengar cerah; triad minor terdengar lebih sendu.',
    pts: ['Major triad: dasar + 4 semitone + 3 semitone (C–E–G).', 'Minor triad: dasar + 3 semitone + 4 semitone (C–E♭–G).', 'Satu-satunya beda: 3rd diturunkan satu semitone pada minor.'],
    mistake: 'Jangan menyamakan mayor-minor dengan keras-lembut. Keduanya soal warna nada, bukan volume.',
    check: 'Apa perbedaan C major dan C minor? Jawaban: nada E menjadi E♭.',
    demo(h) { h.innerHTML = '<div class="row" id="d7r"></div><div class="row" id="d7q"></div><div id="d7s"></div><div id="d7k"></div><div class="row"><button id="d7a">▶ Bersamaan</button><button id="d7b">▶ Arpeggio</button></div><p class="note-out" id="d7o"></p>';
      let r = 60, mn = 0; const ms = () => [r, r + (mn ? 3 : 4), r + 7];
      const show = () => { const m = ms(); $('d7s').innerHTML = staff([{ m, d: 'w', flat: mn }], { label: 'Triad ' + nm(r, 0) + (mn ? ' minor' : ' major') }); $('d7k').innerHTML = kbd(m.map(x => x % 12)); $('d7o').textContent = m.map(x => nm(x, mn)).join(' – ') + ' · ' + nm(r, 0) + (mn ? ' minor' : ' major'); };
      [['C', 60], ['F', 65], ['G', 67]].forEach(a => { const b = document.createElement('button'); b.textContent = a[0]; b.onclick = () => { r = a[1]; show(); }; $('d7r').appendChild(b); });
      [['Major', 0], ['Minor', 1]].forEach(a => { const b = document.createElement('button'); b.textContent = a[0]; b.onclick = () => { mn = a[1]; show(); }; $('d7q').appendChild(b); });
      $('d7a').onclick = () => { stopAll(); chord(ms(), 2.4, .7); }; $('d7b').onclick = () => { stopAll(); arp(ms(), 600, 1.6); }; show(); } },
  { t: 'Dinamika & Istilah Tempo', tag: 'Unit 8', goal: ['Mengenali simbol dinamika pp sampai ff.', 'Menghubungkan istilah tempo Italia dengan BPM.'],
    concept: 'Dynamics menunjukkan keras-lembutnya musik, sedangkan istilah tempo menunjukkan kecepatan. Keduanya membuat notasi yang sama bisa diperdengarkan dengan karakter berbeda.',
    pts: ['pp (sangat lembut), p (lembut), mp, mf (sedang), f (keras), ff (sangat keras).', 'Crescendo = makin keras, diminuendo = makin lembut.', 'Largo ≈ 50 BPM, Andante ≈ 80, Moderato ≈ 105, Allegro ≈ 130, Presto ≈ 170.'],
    mistake: 'Dinamika tidak mengubah pitch. Tempo tidak mengubah volume. Dua hal ini terpisah.',
    check: 'Mana yang lebih cepat: Andante atau Allegro? Jawaban: Allegro.',
    demo(h) { h.innerHTML = '<h4>Dinamika (nada sama, volume berbeda)</h4><div class="row" id="d8d"></div><h4>Tempo</h4><div class="row" id="d8t"></div><p class="note-out" id="d8o"></p>';
      [['pp', .12], ['p', .28], ['mp', .45], ['mf', .62], ['f', .82], ['ff', 1]].forEach(a => { const b = document.createElement('button'); b.textContent = a[0]; b.onclick = () => { stopAll(); tone(64, 1.4, a[1]); $('d8o').textContent = a[0] + ' · volume ' + Math.round(a[1] * 100) + '%'; }; $('d8d').appendChild(b); });
      [['Largo', 50], ['Andante', 80], ['Moderato', 105], ['Allegro', 130], ['Presto', 170]].forEach(a => { const b = document.createElement('button'); b.textContent = a[0] + ' ' + a[1]; b.onclick = () => { stopAll(); pulses(8, a[1], 4); $('d8o').textContent = a[0] + ' ≈ ' + a[1] + ' BPM'; }; $('d8t').appendChild(b); }); } }
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
const LS = 'tsw_level1_v1', MODES = ['reading', 'listening', 'speaking'];
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
const BEAT_TXT = { w: '4 ketuk', h: '2 ketuk', q: '1 ketuk', e: '½ ketuk' };
const READING = [
  () => { const m = pick([60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81]); return mk('staff', 'Nada apa yang tertulis pada paranada kunci G ini?', nm(m, 0), LET.split(''), 'Garis: E–G–B–D–F, spasi: F–A–C–E. Hitung langkah dari garis terbawah.', { visual: staff([{ m, d: 'w' }]), after: () => tone(m, 1.4) }); },
  () => { const d = pick(['w', 'h', 'q', 'e']); return mk('values', 'Dalam birama 4/4, berapa ketuk nilai note ini?', BEAT_TXT[d], Object.values(BEAT_TXT), 'Whole 4, half 2, quarter 1, eighth ½ ketuk.', { visual: staff([{ m: 71, d }]) }); },
  () => { const x = pick(['h', 'q']), y = x === 'h' ? 'q' : pick(['h', 'q']), left = 4 - BEATS[x] - BEATS[y], ans = left === 2 ? 'Half note' : 'Quarter note';
    return mk('values', 'Pada 4/4 ini baru terisi ' + (BEATS[x] + BEATS[y]) + ' ketuk. Note apa yang melengkapi bar?', ans, ['Half note', 'Quarter note', 'Whole note', 'Eighth note'], '4 − ' + (BEATS[x] + BEATS[y]) + ' = ' + left + ' ketuk.', { visual: staff([{ m: 71, d: x }, { m: 71, d: y }], { ts: [4, 4] }) }); },
  () => { const r = pick(['w', 'h', 'q', 'e']), n = { w: 'Whole rest', h: 'Half rest', q: 'Quarter rest', e: 'Eighth rest' }; return mk('values', 'Tanda diam (rest) ini bernama…', n[r], Object.values(n), 'Rest menandai keheningan dengan durasi yang sama seperti note-nya.', { visual: staff([{ r: 1, d: r }]) }); },
  () => { const T = [['Pada 4/4, angka 4 di atas berarti…', '4 ketuk per bar', ['4 ketuk per bar', '4 bar per lagu', 'Tempo 4 BPM', 'Nada ke-4']], ['Pada 3/4, angka 4 di bawah berarti…', 'Satu ketuk = quarter note', ['Satu ketuk = quarter note', 'Satu ketuk = half note', '4 bar', 'Tempo cepat']], ['Birama 3/4 sering terasa seperti…', 'Waltz (1-2-3)', ['Waltz (1-2-3)', 'Berbaris (1-2)', 'Empat ketuk rata', 'Tanpa ketukan']], ['Birama 2/4 memiliki berapa ketuk per bar?', '2', ['2', '3', '4', '6']]]; const t = pick(T); return mk('meter', t[0], t[1], t[2], 'Angka atas = jumlah ketuk per bar; angka bawah = jenis note per ketuk.'); },
  () => { const T = [['♯', 'Menaikkan satu semitone'], ['♭', 'Menurunkan satu semitone'], ['♮', 'Membatalkan sharp atau flat']], t = pick(T); return mk('accidentals', 'Tanda ' + t[0] + ' berfungsi…', t[1], T.map(x => x[1]).concat(['Memperpanjang nada']), 'Sharp naik, flat turun, natural mengembalikan.'); },
  () => { const s = pick([1, 3, 6, 8, 10]), E = { 1: 'D♭', 3: 'E♭', 6: 'G♭', 8: 'A♭', 10: 'B♭' }; return mk('accidentals', NS[s] + ' memiliki nama enharmonic…', E[s], Object.values(E), 'Satu tuts hitam punya dua nama: ' + NS[s] + ' = ' + E[s] + '.', { visual: kbd([s]), after: () => tone(60 + s, 1.3) }); },
  () => { const i = rnd(0, 6), a = LET[i], b = LET[(i + 1) % 7], half = a === 'E' || a === 'B'; return mk('steps', 'Jarak dari ' + a + ' ke ' + b + ' (nada natural bersebelahan) adalah…', half ? 'Half step (1 semitone)' : 'Whole step (2 semitone)', ['Half step (1 semitone)', 'Whole step (2 semitone)'], 'Hanya E–F dan B–C yang berjarak half step; sisanya whole step.', { n: 2 }, 2); },
  () => { const k = pick(Object.keys(MAJNAMES)), d = rnd(2, 7); return mk('scale', 'Nada ke-' + d + ' pada tangga nada ' + k + ' major adalah…', MAJNAMES[k][d - 1], ['C', 'D', 'E', 'F', 'F♯', 'G', 'A', 'B♭', 'B', 'C♯'], 'Pola W–W–H–W–W–W–H. ' + k + ' major: ' + MAJNAMES[k].join(' – ') + '.', { after: () => MAJ[k].forEach((x, i) => later(() => tone(ROOT[k] + x, .5, .7), i * 330)) }); },
  () => { const T = [['C major', '0 sharp / flat'], ['G major', '1 sharp (F♯)'], ['D major', '2 sharp (F♯, C♯)'], ['F major', '1 flat (B♭)']], t = pick(T); return mk('scale', t[0] + ' memiliki…', t[1], T.map(x => x[1]), 'Pola mayor sama di semua nada dasar; sharp atau flat menjaga polanya tetap W–W–H–W–W–W–H.'); },
  () => { const i = rnd(0, 6), k = rnd(1, 7), a = NATM[i], b = NATM[i + k], names = ['', '2nd', '3rd', '4th', '5th', '6th', '7th', 'Octave']; return mk('interval', 'Interval antara kedua nada ini adalah…', names[k], names.slice(1), 'Hitung nama huruf dari nada bawah sebagai 1: ' + LET[spell(a).l] + ' ke ' + LET[spell(b).l] + ' = ' + names[k] + '.', { visual: staff([{ m: a, d: 'q' }, { m: b, d: 'q' }]), after: () => arp([a, b], 700, 1) }); },
  () => { const r = pick([60, 65, 67]), mn = Math.random() < .5, m = [r, r + (mn ? 3 : 4), r + 7]; return mk('triad', 'Triad ' + m.map(x => nm(x, mn)).join('–') + ' termasuk kualitas…', mn ? 'Minor' : 'Major', ['Major', 'Minor'], 'Dari nada dasar ke 3rd: 4 semitone = major, 3 semitone = minor.', { visual: staff([{ m, d: 'w', flat: mn }]), after: () => chord(m, 2, .7) }, 2); },
  () => { const T = [['p (piano)', 'Lembut'], ['f (forte)', 'Keras'], ['pp', 'Sangat lembut'], ['ff', 'Sangat keras'], ['crescendo', 'Makin keras'], ['diminuendo', 'Makin lembut'], ['Allegro', 'Cepat'], ['Andante', 'Berjalan sedang'], ['Largo', 'Sangat lambat'], ['ritardando', 'Makin melambat']], t = pick(T); return mk('terms', 'Istilah "' + t[0] + '" berarti…', t[1], T.map(x => x[1]), 'Dinamika mengatur keras-lembut; istilah tempo mengatur kecepatan.'); }
];
const LISTENING = [
  () => { const n = rnd(2, 6), bpm = 100; return mk('rhythm', 'Dengarkan rangkaian ketukan. Berapa kali berbunyi?', String(n), ['2', '3', '4', '5', '6'], 'Hitung setiap bunyi; putar ulang bila perlu.', { play: () => { for (let i = 0; i < n; i++) later(() => click(0), i * 60000 / bpm); } }); },
  () => { const n = pick([2, 3, 4]), ans = n + ' ketuk per bar'; return mk('meter', 'Dengarkan: bunyi tajam menandai awal bar. Birama ini berapa ketukan?', ans, ['2 ketuk per bar', '3 ketuk per bar', '4 ketuk per bar'], 'Hitung ketukan dari satu bunyi tajam ke bunyi tajam berikutnya.', { play: () => pulses(n * 3, 100, n) }, 3); },
  () => { const mn = Math.random() < .5, r = pick([55, 60, 62, 65]); return mk('triad', 'Dengarkan chord ini. Terdengar…', mn ? 'Minor (lebih sendu)' : 'Major (lebih cerah)', ['Major (lebih cerah)', 'Minor (lebih sendu)'], 'Hanya 3rd yang berbeda: minor 1 semitone lebih rendah.', { play: () => chord([r, r + (mn ? 3 : 4), r + 7], 2.2, .7) }, 2); },
  () => { const iv = pick([INTV[0], INTV[1], INTV[3], INTV[6]]), a = rnd(55, 66); return mk('interval', 'Dengarkan dua nada. Intervalnya…', iv[0], ['2nd', '3rd', '5th', 'Octave'], '2nd sangat dekat, 3rd hangat, 5th kuat dan terbuka, octave terdengar "nama sama".', { play: () => arp([a, a + iv[1]], 900, 1.2) }); },
  () => { const v = Math.random() < .5, s = [.15, .5, .95]; return mk('dynamics', 'Dengarkan tiga nada berurutan. Dinamikanya…', v ? 'Crescendo (makin keras)' : 'Diminuendo (makin lembut)', ['Crescendo (makin keras)', 'Diminuendo (makin lembut)', 'Tetap sama'], 'Perhatikan apakah nada ketiga lebih keras atau lebih lembut dari yang pertama.', { play: () => (v ? s : s.slice().reverse()).forEach((x, i) => later(() => tone(64, 1, x), i * 800)) }, 3); },
  () => { const fast = Math.random() < .5, A = fast ? 70 : 150, B = fast ? 150 : 70; return mk('tempo', 'Dengarkan dua rangkaian ketukan. Rangkaian kedua…', fast ? 'Lebih cepat' : 'Lebih lambat', ['Lebih cepat', 'Lebih lambat', 'Sama cepat'], 'Jarak antar-ketukan lebih pendek berarti tempo lebih cepat.', { play: () => { for (let i = 0; i < 4; i++) later(() => click(0), i * 60000 / A); for (let i = 0; i < 4; i++) later(() => click(0), 4 * 60000 / A + 500 + i * 60000 / B); } }, 3); },
  () => { const P = { 'ta ta ta ta': [0, 1, 2, 3], 'ta ti-ti ta ta': [0, 1, 1.5, 2, 3], 'ta ta ti-ti ta': [0, 1, 2, 2.5, 3], 'ta-aa ta ta': [0, 2, 3] }, k = pick(Object.keys(P)); return mk('rhythm', 'Dengarkan pola ritme. Mana notasi suku katanya? (ta = quarter, ti-ti = dua eighth, ta-aa = half)', k, Object.keys(P), 'Hitung ketukan: ti-ti berarti dua bunyi pendek dalam satu ketuk.', { play: () => P[k].forEach(b => later(() => tone(71, .35, .8), b * 560)) }); },
  () => { const k = pick(['C', 'G', 'F']), full = Math.random() < .6, ms = MAJ[k].map(x => ROOT[k] + x), seq = full ? ms : ms.slice(0, 6).concat([ms[6] - 1, ms[7]]);
    return mk('scale', 'Dengarkan tangga nada ini. Apakah polanya mayor yang benar?', full ? 'Ya, tangga nada mayor' : 'Tidak, ada nada yang salah', ['Ya, tangga nada mayor', 'Tidak, ada nada yang salah'], full ? 'Pola W–W–H–W–W–W–H terpenuhi.' : 'Nada ke-7 diturunkan satu semitone sehingga pola mayor rusak.', { play: () => seq.forEach((m, i) => later(() => tone(m, .6, .75), i * 450)) }, 2); }
];
const SPEAKING = [
  () => { const m = pick([60, 62, 64, 65, 67, 69, 71]); return { kind: 'sing', topic: 'match', steps: [m], prompt: 'Dengarkan nada acuan, lalu humming nada yang sama.', play: () => tone(m, 2.2), explanation: 'Pitch matching: octave mana pun diterima agar sesuai rentang suaramu.' }; },
  () => { const r = pick([60, 65, 67]), d = pick([[2, 'Re'], [4, 'Mi'], [7, 'Sol']]); return { kind: 'sing', topic: 'solfege', steps: [r + d[0]], labels: [d[1]], prompt: 'Dengarkan Do (' + nm(r, 0) + '). Lalu nyanyikan ' + d[1] + ' (' + nm(r + d[0], 0) + ').', play: () => tone(r, 2.2), playTarget: () => tone(r + d[0], 2.2), explanation: d[1] + ' adalah nada ke-' + (d[0] === 2 ? 2 : d[0] === 4 ? 3 : 5) + ' tangga nada mayor.' }; },
  () => { const r = pick([60, 62, 65]), iv = pick(INTV.filter(x => [4, 5, 7].indexOf(x[1]) >= 0)); return { kind: 'sing', topic: 'interval', steps: [r + iv[1]], prompt: 'Dengarkan ' + nm(r, 0) + '. Nyanyikan ' + iv[2] + ' di atasnya (' + nm(r + iv[1], 0) + ').', play: () => tone(r, 2.2), playTarget: () => tone(r + iv[1], 2.2), explanation: iv[2] + ' = ' + iv[1] + ' semitone di atas nada awal.' }; },
  () => { const r = pick([60, 62, 65]), tri = Math.random() < .5, off = tri ? [0, 4, 7] : [0, 2, 4], lab = tri ? ['Do', 'Mi', 'Sol'] : ['Do', 'Re', 'Mi']; return { kind: 'sing', topic: 'sequence', steps: off.map(x => r + x), labels: lab, prompt: 'Nyanyikan ' + lab.join('–') + ' berurutan (' + off.map(x => nm(r + x, 0)).join('–') + '). Tiap nada diberi waktu sendiri.', play: () => arp(off.map(x => r + x), 800, 1), explanation: 'Urutan ' + lab.join('–') + ' berasal dari tangga nada mayor.' }; }
];
const GENS = { reading: READING, listening: LISTENING, speaking: SPEAKING };
const TOPICS = { staff: 'Paranada', values: 'Nilai nada', meter: 'Birama', accidentals: 'Sharp/Flat', steps: 'Whole/Half', scale: 'Tangga nada', interval: 'Interval', triad: 'Triad', terms: 'Istilah', rhythm: 'Ritme', dynamics: 'Dinamika', tempo: 'Tempo', match: 'Pitch matching', solfege: 'Solfege', sequence: 'Urutan nada' };
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
