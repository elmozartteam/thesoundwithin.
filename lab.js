/* Mesin latihan bersama (Level 0, 1, …) — materi interaktif + generator soal tanpa batas (Reading, Listening, Speaking).
   Audio lewat TSWAudio (audio-engine.js). Skor disimpan ke kunci yang sudah dipakai sertifikat. */
(function () {
  'use strict';
  var L = ['C','D','E','F','G','A','B'], SEMI = [0,2,4,5,7,9,11];
  var nm = function (d) { return L[d % 7] + Math.floor(d / 7); };
  var hz = function (d) { return 440 * Math.pow(2, (12 * (Math.floor(d / 7) + 1) + SEMI[d % 7] - 69) / 12); };
  var rnd = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  var $ = function (id) { return document.getElementById(id); };

  /* ── suara: piano akustik bila siap, sine sebagai cadangan ── */
  var actx = null;
  function beep(f) {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    actx = actx || new AC(); if (actx.state === 'suspended') actx.resume();
    var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.25, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 1.4);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 1.5);
  }
  function sound(d) { if (!(window.TSWAudio && TSWAudio.play(nm(d)))) beep(hz(d)); }
  /* nada berdasarkan nomor MIDI (60 = C4), termasuk tuts hitam */
  var NN = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  function midi(m) { if (!(window.TSWAudio && TSWAudio.play(NN[m % 12] + (Math.floor(m / 12) - 1)))) beep(440 * Math.pow(2, (m - 69) / 12)); }

  /* ── paranada SVG. d = indeks diatonik (C4 = 28). Nada ditaruh dengan warna currentColor ── */
  function staff(clef, ds, w) {
    var base = clef === 'treble' ? 30 : 18, Y = function (s) { return 110 - s * 5; }, out = '';
    for (var i = 0; i < 5; i++) out += '<line x1="14" x2="' + (w - 14) + '" y1="' + Y(i * 2) + '" y2="' + Y(i * 2) + '" stroke="currentColor" stroke-width="1"/>';
    out += '<line x1="14" x2="14" y1="' + Y(0) + '" y2="' + Y(8) + '" stroke="currentColor" stroke-width="1.6"/>';
    if (clef === 'treble') out += '<path d="M29 129C28 134 37 135 37 128L40 64C41 52 45 46 47 50C49 55 44 64 36 72C24 84 26 102 38 104C50 106 54 90 44 86C36 83 30 92 34 98" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>';
    else out += '<path d="M31 80C31 70 49 70 49 81C49 93 38 103 26 109" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="31" cy="80" r="3.6" fill="currentColor"/><circle cx="56" cy="75" r="2.3" fill="currentColor"/><circle cx="56" cy="85" r="2.3" fill="currentColor"/>';
    out += '<text x="22" y="26" font-size="10" letter-spacing="3" fill="currentColor" opacity=".6" font-family="Lora,serif">' + (clef === 'treble' ? 'TREBLE · KUNCI G' : 'BASS · KUNCI F') + '</text>';
    var step = (w - 110) / Math.max(ds.length, 1);
    ds.forEach(function (d, k) {
      var s = d - base, x = ds.length === 1 ? w / 2 : 92 + step * k + step / 2 - 10, e;
      for (e = -2; e >= s; e -= 2) out += '<line x1="' + (x - 14) + '" x2="' + (x + 14) + '" y1="' + Y(e) + '" y2="' + Y(e) + '" stroke="currentColor"/>';
      for (e = 10; e <= s; e += 2) out += '<line x1="' + (x - 14) + '" x2="' + (x + 14) + '" y1="' + Y(e) + '" y2="' + Y(e) + '" stroke="currentColor"/>';
      var up = s < 4;
      out += '<ellipse cx="' + x + '" cy="' + Y(s) + '" rx="7.5" ry="5.2" transform="rotate(-20 ' + x + ' ' + Y(s) + ')" fill="currentColor"/>';
      out += '<line x1="' + (up ? x + 7 : x - 7) + '" x2="' + (up ? x + 7 : x - 7) + '" y1="' + Y(s) + '" y2="' + (up ? Y(s) - 34 : Y(s) + 34) + '" stroke="currentColor" stroke-width="1.5"/>';
    });
    return '<svg viewBox="0 0 ' + w + ' 140" role="img" aria-label="Paranada kunci ' + (clef === 'treble' ? 'G' : 'F') + '">' + out + '</svg>';
  }

  /* ── materi ── */
  var dk = $('demoKeys');
  document.querySelectorAll('[data-staff]').forEach(function (el) { var p = el.getAttribute('data-staff').split(':'); el.innerHTML = staff(p[0], p[1].split(',').map(Number), 380); });
  if (dk) {
  L.forEach(function (n, i) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.setAttribute('aria-label', 'Nada ' + n);
    var dn = function () { b.classList.add('on'); sound(28 + i); }, up = function () { b.classList.remove('on'); };
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); dn(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, up); });
    b.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); dn(); } });
    b.addEventListener('keyup', up);
    dk.appendChild(b);
  });
  $('demoTreble').innerHTML = staff('treble', [28,29,30,31,32,33,34], 380);
  $('demoBass').innerHTML = staff('bass', [21,22,23,24,25,26,27], 380);
  if (window.TSWAudio) dk.addEventListener('pointerenter', function () { TSWAudio.load().catch(function () {}); }, { once: true });
  }

  /* ── skor (kunci sama dengan yang dibaca sertifikat) ── */
  function save(mode, pct, pts) {
    var key = 'tsw_score_' + mode, old = null;
    try { old = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    var oldPct = old ? Number(old.percent != null ? old.percent : parseFloat(old.accuracy)) || 0 : -1;
    if (pct < oldPct) return;
    var rec = mode === 'reading' ? { percent: pct, score: pts }
      : mode === 'listening' ? { accuracy: pct, score: pts }
      : { accuracy: pct + '%', score: pts + ' points', band: (pct / 100 * 9).toFixed(1) + ' / 9' };
    try { localStorage.setItem(key, JSON.stringify(rec)); } catch (e) {}
    if (pct >= 70 && window.trackSoundProgress) window.trackSoundProgress(mode);
  }

  /* ── generator soal: tiap pemanggilan membuat soal baru, tidak mengulang nada sebelumnya ── */
  var last = -1;
  function pick(lo, hi) { var d; do { d = rnd(lo, hi); } while (d === last); last = d; return d; }
  var H = { L: L, SEMI: SEMI, rnd: rnd, pick: pick, sound: sound, nm: nm, midi: midi, NAMES: ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'] };
  var MODES = (window.TSW_LEVEL && window.TSW_LEVEL(H)) || {
    reading: { total: 10, make: function () {
      var c = Math.random() < .5 ? 'treble' : 'bass', d = c === 'treble' ? pick(28, 35) : pick(21, 28);
      return { d: d, clef: c, ans: L[d % 7], prompt: 'Nada apa ini?' }; } },
    listening: { total: 10, make: function () { var d = pick(28, 35); return { d: d, ans: L[d % 7], prompt: 'Dengarkan, lalu pilih nama nadanya.' }; } },
    speaking: { total: 5, make: function () { var d = pick(28, 34); return { d: d, ans: L[d % 7], prompt: 'Humming nada ' + L[d % 7] + '.' }; } }
  };

  /* ── pitch dari mikrofon (autokorelasi) ── */
  function pitch(buf, sr) {
    var n = buf.length, c0 = 0, i, lag;
    for (i = 0; i < n; i++) c0 += buf[i] * buf[i];
    if (Math.sqrt(c0 / n) < .012) return -1;
    var lo = Math.floor(sr / 1000), hi = Math.min(Math.floor(sr / 70), n >> 1), best = 0, bc = 0, dipped = false;
    for (lag = lo; lag <= hi; lag++) {
      var c = 0; for (i = 0; i < n - lag; i++) c += buf[i] * buf[i + lag];
      if (c < .3 * c0) dipped = true;
      if (dipped && c > bc) { bc = c; best = lag; }
    }
    return bc > .45 * c0 ? sr / best : -1;
  }
  function listen(ms, done) {
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } }).then(function (st) {
      var AC = window.AudioContext || window.webkitAudioContext, a = new AC(), an = a.createAnalyser(), src = a.createMediaStreamSource(st), buf, cls = [];
      an.fftSize = 4096; src.connect(an); buf = new Float32Array(an.fftSize);
      var iv = setInterval(function () {
        an.getFloatTimeDomainData(buf); var f = pitch(buf, a.sampleRate);
        if (f > 0) cls.push(((Math.round(69 + 12 * Math.log(f / 440) / Math.LN2) % 12) + 12) % 12);
      }, 70);
      setTimeout(function () {
        clearInterval(iv); st.getTracks().forEach(function (t) { t.stop(); }); a.close();
        var cnt = {}, top = -1; cls.forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; if (top < 0 || cnt[x] > cnt[top]) top = x; });
        done(cls.length >= 8 ? top : -1);
      }, ms);
    }).catch(function () { done(-2); });
  }

  /* ── sesi ── */
  var panel = $('lab'), mode = 'reading', S;
  function start() { S = { i: 0, ok: 0, q: null, done: false }; next(); }
  function head() { var T = MODES[mode].total; return '<div class="l-meta"><span>Soal ' + (S.i + 1) + ' / ' + T + '</span><button class="l-swap" id="swap" type="button">↻ Ganti soal</button><span>Benar ' + S.ok + '</span></div><div class="l-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + T + '" aria-valuenow="' + S.i + '"><i style="width:' + (S.i / T * 100) + '%"></i></div>'; }
  function next() {
    if (S.i >= MODES[mode].total) return finish();
    var q = S.q = MODES[mode].make(), opts = q.opts || L;
    q.play = q.play || function () { sound(q.d); };
    var h = head() + '<p class="l-prompt">' + q.prompt + '</p>';
    if (mode === 'reading') h += '<div class="l-stage"><div class="paper">' + (q.html || staff(q.clef || 'treble', q.ds || [q.d], 300)) + '</div></div>';
    if (mode === 'listening') h += '<div class="l-stage"><button class="l-play l-big-play" id="rep" type="button"><span class="l-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span> Dengar nada</button></div><p class="l-hint">Tekan tombol untuk mendengar. Boleh diulang.</p>';
    if (mode === 'speaking') h += '<div class="l-stage"><div class="paper">' + staff('treble', q.ds || [q.d], 300) + '</div></div><p><button class="l-play" id="ref" type="button"><span class="l-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span> Dengar nada awal</button> <button class="l-play" id="hum" type="button">● Mulai humming (3 dtk)</button></p>';
    if (mode !== 'speaking') h += '<div class="l-ans' + (opts.some(function (o) { return o.length > 2; }) ? ' txt' : '') + '" id="ans" style="--n:' + opts.length + '">' + opts.map(function (n) { return '<button type="button" data-n="' + n + '">' + n + '</button>'; }).join('') + '</div>';
    panel.innerHTML = h + '<p class="l-fb" id="fb"></p><div id="nx"></div>'; panel.classList.remove('l-fade-in'); void panel.offsetWidth; panel.classList.add('l-fade-in');
    $('swap').onclick = next;
    function fx(b) { b.onclick = function () { b.classList.add('playing'); clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove('playing'); }, 1600); q.play(); }; }
    if ($('rep')) fx($('rep'));
    if ($('ref')) fx($('ref'));
    if ($('ans')) $('ans').onclick = function (e) { var b = e.target.closest('button'); if (b) answer(b.getAttribute('data-n') === q.ans, b); };
    if ($('hum')) $('hum').onclick = hum;
  }
  function answer(ok, btn) {
    if (S.q.locked) return; S.q.locked = true; var sw = $('swap'); if (sw) sw.hidden = true; if (ok) S.ok++;
    if (btn) { btn.classList.add(ok ? 'ok' : 'bad'); }
    var a = $('ans'); if (a) [].forEach.call(a.children, function (b) { b.disabled = true; if (b.getAttribute('data-n') === S.q.ans) b.classList.add('ok'); });
    $('fb').textContent = ok ? 'Tepat. Itu nada ' + S.q.ans + '.' : 'Belum. Jawabannya ' + S.q.ans + '.';
    S.i++; var n = $('nx'); n.innerHTML = '<button class="h-btn l-next" type="button">' + (S.i >= MODES[mode].total ? 'Lihat hasil' : 'Generate soal berikutnya') + ' <i>↗</i></button>';
    n.firstChild.onclick = next; n.firstChild.focus();
  }
  function hum() {
    var b = $('hum'); b.disabled = true; b.textContent = '● Merekam…'; var want = S.q.tgt != null ? S.q.tgt : SEMI[S.q.d % 7];
    listen(3000, function (cls) {
      if (cls === -2) { $('fb').textContent = 'Mikrofon tidak bisa diakses. Izinkan mikrofon di browser, lalu coba lagi.'; b.disabled = false; b.textContent = '● Coba lagi'; return; }
      if (cls === -1) { $('fb').textContent = 'Suaramu belum terdeteksi. Humming lebih jelas dan dekatkan mikrofon.'; b.disabled = false; b.textContent = '● Coba lagi'; return; }
      var got = cls === want, name = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][cls];
      answer(got, null); $('fb').textContent = (got ? 'Tepat. ' : 'Belum. ') + 'Terdeteksi nada ' + name + ', targetnya ' + S.q.ans + '.';
    });
  }
  function finish() {
    var pct = Math.round(S.ok / MODES[mode].total * 100), pts = S.ok * 10;
    save(mode, pct, pts);
    var msg = pct >= 70 ? 'Bagus. Jalur ini tercatat selesai di Track Progress.' : 'Ulangi sesi baru untuk mencapai 70% dan menandai jalur ini selesai.';
    panel.innerHTML = '<div class="l-result"><p class="l-meta"><span>Hasil sesi</span><span>' + pts + ' points</span></p><div class="l-score">' + pct + '%</div><p class="l-fb">' + S.ok + ' dari ' + MODES[mode].total + ' benar. ' + msg + '</p><button class="h-btn" type="button" id="again">Sesi baru, soal baru <i>↗</i></button></div>';
    $('again').onclick = start;
  }
  document.querySelectorAll('.l-tabs [role=tab]').forEach(function (t) {
    t.addEventListener('click', function () {
      mode = t.getAttribute('data-mode'); last = -1;
      document.querySelectorAll('.l-tabs [role=tab]').forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
      start();
    });
  });
  start();
})();
