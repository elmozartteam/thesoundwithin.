/* Level 0 — expanded foundation lessons + Reading, Listening, Speaking practice. */
(function () {
  'use strict';
  var L = ['C','D','E','F','G','A','B'], SEMI = [0,2,4,5,7,9,11];
  var nm = function (d) { return L[d % 7] + Math.floor(d / 7); };
  var hz = function (d) { return 440 * Math.pow(2, (12 * (Math.floor(d / 7) + 1) + SEMI[d % 7] - 69) / 12); };
  var rnd = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  var $ = function (id) { return document.getElementById(id); };

  /* Real recorded acoustic instrument samples (not oscillator/synth tones). */
  var acousticSamplers = { piano: null, guitar: null };
  var acousticReady = { piano: false, guitar: false };
  var acousticPending = { piano: [], guitar: [] };
  var sampleBase = 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/';
  var midiNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  function midiNote(midi) { return midiNames[midi % 12] + (Math.floor(midi / 12) - 1); }
  function sampleMap(kind) {
    if (kind === 'guitar') return {
      'E2':'E2.mp3','F#2':'Fs2.mp3','A2':'A2.mp3','C3':'C3.mp3','D3':'D3.mp3',
      'F3':'F3.mp3','G3':'G3.mp3','A3':'A3.mp3','C4':'C4.mp3','D4':'D4.mp3',
      'F4':'F4.mp3','G4':'G4.mp3','A4':'A4.mp3','C5':'C5.mp3'
    };
    return {
      'C3':'C3.mp3','F#3':'Fs3.mp3','A3':'A3.mp3','C4':'C4.mp3','F#4':'Fs4.mp3',
      'A4':'A4.mp3','C5':'C5.mp3','F#5':'Fs5.mp3','A5':'A5.mp3','C6':'C6.mp3'
    };
  }
  function flushAcoustic(kind) {
    var q = acousticPending[kind].splice(0);
    q.forEach(function (midi) { playAcoustic(kind, midi); });
  }
  function loadAcoustic(kind) {
    if (acousticSamplers[kind] || !window.Tone || !window.Tone.Sampler) return;
    var folder = kind === 'guitar' ? 'guitar-acoustic/' : 'piano/';
    acousticSamplers[kind] = new Tone.Sampler({
      urls: sampleMap(kind),
      baseUrl: sampleBase + folder,
      release: kind === 'guitar' ? 0.35 : 1.1,
      onload: function () { acousticReady[kind] = true; flushAcoustic(kind); },
      onerror: function () {
        var status = $('instrumentAudioStatus');
        if (status) status.textContent = 'Sampel suara belum dapat dimuat. Periksa koneksi internet lalu coba lagi.';
      }
    }).toDestination();
  }
  function playAcoustic(kind, midi) {
    if (!window.Tone || !window.Tone.Sampler) {
      var status = $('instrumentAudioStatus');
      if (status) status.textContent = 'Audio instrumen memerlukan koneksi internet untuk memuat sampel akustik.';
      return;
    }
    loadAcoustic(kind);
    if (!acousticSamplers[kind]) return;
    if (!acousticReady[kind] && !acousticSamplers[kind].loaded) {
      acousticPending[kind].push(midi);
      var status = $('instrumentAudioStatus');
      if (status) status.textContent = 'Memuat sampel suara ' + (kind === 'guitar' ? 'gitar akustik' : 'grand piano') + '…';
      return;
    }
    acousticReady[kind] = true;
    Tone.start().then(function () {
      acousticSamplers[kind].triggerAttackRelease(midiNote(midi), kind === 'guitar' ? 1.4 : 1.8);
      var status = $('instrumentAudioStatus');
      if (status) status.textContent = 'Suara ' + (kind === 'guitar' ? 'gitar akustik' : 'piano akustik') + ' aktif.';
    }).catch(function () {});
  }
  function sound(d) {
    /* Musical exercises use the recorded acoustic grand-piano sample. */
    var midi = 60 + (d - 28); // C4 is the reference point for Level 0
    playAcoustic('piano', midi);
  }
  function playMidi(midi) { playAcoustic('piano', midi); }
  function playGuitarMidi(midi) { playAcoustic('guitar', midi); }
  function sequence(a, b) { sound(a); window.setTimeout(function () { sound(b); }, 850); }

  /* Staff illustration. d is a diatonic index; C4 = 28. */
  function staff(clef, ds, w) {
    var base = clef === 'treble' ? 30 : 18, Y = function (s) { return 110 - s * 5; }, out = '';
    for (var i = 0; i < 5; i++) out += '<line x1="14" x2="' + (w - 14) + '" y1="' + Y(i * 2) + '" y2="' + Y(i * 2) + '" stroke="currentColor" stroke-width="1"/>';
    out += '<text x="22" y="26" font-size="10" letter-spacing="3" fill="currentColor" opacity=".6" font-family="Lora,serif">' + (clef === 'treble' ? 'TREBLE CLEF' : 'BASS CLEF') + '</text>';
    var step = (w - 70) / Math.max(ds.length, 1);
    ds.forEach(function (d, k) {
      var s = d - base, x = ds.length === 1 ? w / 2 : 52 + step * k + step / 2 - 10, e;
      for (e = -2; e >= s; e -= 2) out += '<line x1="' + (x - 14) + '" x2="' + (x + 14) + '" y1="' + Y(e) + '" y2="' + Y(e) + '" stroke="currentColor"/>';
      for (e = 10; e <= s; e += 2) out += '<line x1="' + (x - 14) + '" x2="' + (x + 14) + '" y1="' + Y(e) + '" y2="' + Y(e) + '" stroke="currentColor"/>';
      var up = s < 4;
      out += '<ellipse cx="' + x + '" cy="' + Y(s) + '" rx="7.5" ry="5.2" transform="rotate(-20 ' + x + ' ' + Y(s) + ')" fill="currentColor"/>';
      out += '<line x1="' + (up ? x + 7 : x - 7) + '" x2="' + (up ? x + 7 : x - 7) + '" y1="' + Y(s) + '" y2="' + (up ? Y(s) - 34 : Y(s) + 34) + '" stroke="currentColor" stroke-width="1.5"/>';
    });
    return '<svg viewBox="0 0 ' + w + ' 140" role="img" aria-label="Notasi pada ' + (clef === 'treble' ? 'treble clef' : 'bass clef') + '">' + out + '</svg>';
  }

  /* Interactive natural-note keyboard. */
  var dk = $('demoKeys');
  if (dk) {
    L.forEach(function (n, i) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.setAttribute('aria-label', 'Nada ' + n);
      var dn = function () { b.classList.add('on'); sound(28 + i); }, up = function () { b.classList.remove('on'); };
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); dn(); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, up); });
      b.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); dn(); } });
      b.addEventListener('keyup', up); dk.appendChild(b);
    });
    if (window.TSWAudio) dk.addEventListener('pointerenter', function () { TSWAudio.load().catch(function () {}); }, { once: true });
  }
  if ($('demoTreble')) $('demoTreble').innerHTML = staff('treble', [28,29,30,31,32,33,34], 380);
  if ($('demoBass')) $('demoBass').innerHTML = staff('bass', [21,22,23,24,25,26,27], 380);

  /* Every piano key in the two-octave diagram is playable, including black keys. */
  var piano = $('playableKeyboard');
  if (piano) {
    var whiteCount = 0, whiteNotes = [0,2,4,5,7,9,11];
    for (var midi = 60; midi <= 83; midi++) {
      var pc = midi % 12, isWhite = whiteNotes.indexOf(pc) !== -1, key = document.createElement('button');
      key.type = 'button'; key.className = 'l-piano-key ' + (isWhite ? 'white' : 'black');
      key.setAttribute('aria-label', 'Mainkan ' + ['C','C♯/D♭','D','D♯/E♭','E','F','F♯/G♭','G','G♯/A♭','A','A♯/B♭','B'][pc] + ' octave ' + (Math.floor(midi / 12) - 1));
      key.title = key.getAttribute('aria-label');
      if (isWhite) {
        key.style.left = (whiteCount * 100 / 14) + '%'; key.style.width = (100 / 14) + '%';
        key.textContent = pc === 0 || pc === 5 ? (pc === 0 ? 'C' : 'F') : '';
        whiteCount++;
      } else {
        key.style.left = ((whiteCount * 100 / 14) - (3.1 / 2)) + '%'; key.style.width = '3.1%';
      }
      key.addEventListener('pointerdown', function (e) { e.preventDefault(); this.classList.add('pressed'); playMidi(Number(this.getAttribute('data-midi'))); });
      key.addEventListener('pointerup', function () { this.classList.remove('pressed'); });
      key.addEventListener('pointerleave', function () { this.classList.remove('pressed'); });
      key.addEventListener('pointercancel', function () { this.classList.remove('pressed'); });
      key.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); this.classList.add('pressed'); playMidi(Number(this.getAttribute('data-midi'))); } });
      key.addEventListener('keyup', function () { this.classList.remove('pressed'); });
      key.setAttribute('data-midi', midi); piano.appendChild(key);
    }
  }

  /* Interactive six-string guitar fretboard: standard tuning E-A-D-G-B-E. */
  var guitar = $('guitarBoard');
  if (guitar) {
    var strings = [
      { name: 'E', midi: 40, label: 'E rendah' }, { name: 'A', midi: 45, label: 'A' },
      { name: 'D', midi: 50, label: 'D' }, { name: 'G', midi: 55, label: 'G' },
      { name: 'B', midi: 59, label: 'B' }, { name: 'E', midi: 64, label: 'E tinggi' }
    ];
    var head = document.createElement('div'); head.className = 'l-guitar-head';
    head.innerHTML = '<span>SENAR</span><span>OPEN</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>'; guitar.appendChild(head);
    strings.forEach(function (st, si) {
      var row = document.createElement('div'); row.className = 'l-guitar-row';
      var label = document.createElement('span'); label.className = 'l-string-label'; label.textContent = st.name; label.title = st.label; row.appendChild(label);
      for (var fret = 0; fret <= 5; fret++) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'l-fret';
        b.textContent = fret === 0 ? '○' : '·'; b.setAttribute('data-midi', st.midi + fret);
        b.setAttribute('aria-label', 'Senar ' + st.label + ', fret ' + fret + ', mainkan nada');
        b.addEventListener('pointerdown', function (e) { e.preventDefault(); this.classList.add('pressed'); playGuitarMidi(Number(this.getAttribute('data-midi'))); });
        b.addEventListener('pointerup', function () { this.classList.remove('pressed'); });
        b.addEventListener('pointerleave', function () { this.classList.remove('pressed'); });
        b.addEventListener('pointercancel', function () { this.classList.remove('pressed'); });
        b.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); this.classList.add('pressed'); playGuitarMidi(Number(this.getAttribute('data-midi'))); } });
        b.addEventListener('keyup', function () { this.classList.remove('pressed'); });
        row.appendChild(b);
      }
      guitar.appendChild(row);
    });
  }

  /* Preserve the score keys consumed by Track Progress and the certificate. */
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

  /* Avoid repeating the immediately previous note in a generated session. */
  var last = -1;
  function pick(lo, hi) { var d; do { d = rnd(lo, hi); } while (d === last); last = d; return d; }
  var rhythm = [
    { glyph: '𝅝', label: 'Whole note', value: '4 ketuk' },
    { glyph: '𝅗𝅥', label: 'Half note', value: '2 ketuk' },
    { glyph: '♩', label: 'Quarter note', value: '1 ketuk' },
    { glyph: '♪', label: 'Eighth note', value: '½ ketuk' }
  ];
  var MODES = {
    reading: { total: 10, make: function () {
      if (Math.random() < .22) {
        var r = rhythm[rnd(0, rhythm.length - 1)];
        return { type: 'rhythm', glyph: r.glyph, ans: r.value, options: ['4 ketuk','2 ketuk','1 ketuk','½ ketuk'], prompt: 'Berapa durasi nilai not ini?' };
      }
      var c = Math.random() < .5 ? 'treble' : 'bass', d = c === 'treble' ? pick(28, 35) : pick(21, 28);
      return { type: 'note', d: d, clef: c, ans: L[d % 7], options: L, prompt: 'Baca notasi berikut. Apa nama nadanya?' };
    } },
    listening: { total: 10, make: function () {
      if (Math.random() < .35) {
        var a = pick(28, 34), step = rnd(1, 4) * (Math.random() < .5 ? -1 : 1), b = Math.max(21, Math.min(42, a + step));
        return { type: 'contour', a: a, b: b, ans: b > a ? 'Naik' : 'Turun', options: ['Naik','Turun'], prompt: 'Dengarkan dua nada. Ke arah mana nada kedua bergerak?', sub: 'Fokus pada arah perubahan pitch.' };
      }
      var d = pick(28, 35); return { type: 'pitch', d: d, ans: L[d % 7], options: L, prompt: 'Dengarkan nada, lalu pilih nama nadanya.', sub: 'Kamu boleh memutar ulang audio sebelum menjawab.' };
    } },
    speaking: { total: 5, make: function () { var d = pick(28, 34); return { type: 'hum', d: d, ans: L[d % 7], prompt: 'Tirukan nada yang ditampilkan melalui humming.', sub: 'Dengarkan nada acuan, lalu nyanyikan dengan suara nyaman.' }; } }
  };

  /* Lightweight pitch detection from microphone input. */
  function pitch(buf, sr) {
    var n = buf.length, c0 = 0, i, lag;
    for (i = 0; i < n; i++) c0 += buf[i] * buf[i];
    if (Math.sqrt(c0 / n) < .012) return -1;
    var lo = Math.floor(sr / 1000), hi = Math.min(Math.floor(sr / 70), n >> 1), best = 0, bc = 0, dipped = false;
    for (lag = lo; lag <= hi; lag++) { var c = 0; for (i = 0; i < n - lag; i++) c += buf[i] * buf[i + lag]; if (c < .3 * c0) dipped = true; if (dipped && c > bc) { bc = c; best = lag; } }
    return bc > .45 * c0 && best ? sr / best : -1;
  }
  function listen(ms, done) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { done(-2); return; }
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } }).then(function (st) {
      var AC = window.AudioContext || window.webkitAudioContext, a = new AC(), an = a.createAnalyser(), src = a.createMediaStreamSource(st), buf, cls = [];
      an.fftSize = 4096; src.connect(an); buf = new Float32Array(an.fftSize);
      var iv = setInterval(function () { an.getFloatTimeDomainData(buf); var f = pitch(buf, a.sampleRate); if (f > 0) cls.push(((Math.round(69 + 12 * Math.log(f / 440) / Math.LN2) % 12) + 12) % 12); }, 70);
      setTimeout(function () {
        clearInterval(iv); st.getTracks().forEach(function (t) { t.stop(); }); a.close();
        var cnt = {}, top = -1; cls.forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; if (top < 0 || cnt[x] > cnt[top]) top = x; });
        done(cls.length >= 8 ? top : -1);
      }, ms);
    }).catch(function () { done(-2); });
  }

  /* Practice session UI. */
  var panel = $('lab'), mode = 'reading', S;
  function start() { S = { i: 0, ok: 0, q: null, done: false }; next(); }
  function head() { return '<div class="l-meta"><span>SOAL ' + (S.i + 1) + ' / ' + MODES[mode].total + '</span><span>BENAR ' + S.ok + '</span></div>'; }
  function renderOptions(q) {
    return '<div class="l-ans" id="ans">' + q.options.map(function (v) { return '<button type="button" data-value="' + v + '">' + v + '</button>'; }).join('') + '</div>';
  }
  function next() {
    if (S.i >= MODES[mode].total) return finish();
    var q = S.q = MODES[mode].make(), h = head() + '<p class="l-prompt">' + q.prompt + '</p>';
    if (q.sub) h += '<p class="l-subprompt">' + q.sub + '</p>';
    if (mode === 'reading' && q.type === 'note') h += '<div class="l-stage"><div class="paper">' + staff(q.clef, [q.d], 300) + '</div></div>';
    if (mode === 'reading' && q.type === 'rhythm') h += '<div class="l-stage"><div class="paper l-rhythm-card"><span>' + q.glyph + '</span><small>NOTE VALUE</small></div></div>';
    if (mode === 'listening' && q.type === 'pitch') h += '<p><button class="l-play" id="rep" type="button">▶ Dengarkan nada</button></p>';
    if (mode === 'listening' && q.type === 'contour') h += '<p><button class="l-play" id="rep" type="button">▶ Dengarkan dua nada</button></p>';
    if (mode === 'speaking') h += '<div class="l-stage"><div class="paper">' + staff('treble', [q.d], 300) + '</div></div><p><button class="l-play" id="ref" type="button">▶ Nada acuan</button> <button class="l-play" id="hum" type="button">● Mulai humming (3 dtk)</button></p>';
    if (mode !== 'speaking') h += renderOptions(q);
    panel.innerHTML = h + '<p class="l-fb" id="fb" aria-live="polite"></p><div id="nx"></div>';
    panel.classList.remove('l-fade-in'); void panel.offsetWidth; panel.classList.add('l-fade-in');
    if ($('rep')) $('rep').onclick = function () { q.type === 'contour' ? sequence(q.a, q.b) : sound(q.d); };
    if ($('rep') && q.type === 'pitch') sound(q.d);
    if ($('rep') && q.type === 'contour') sequence(q.a, q.b);
    if ($('ref')) $('ref').onclick = function () { sound(q.d); };
    if ($('ans')) $('ans').onclick = function (e) { var b = e.target.closest('button'); if (b) answer(b.getAttribute('data-value') === q.ans, b); };
    if ($('hum')) $('hum').onclick = hum;
  }
  function answer(ok, btn) {
    if (S.q.locked) return; S.q.locked = true; if (ok) S.ok++;
    if (btn) btn.classList.add(ok ? 'ok' : 'bad');
    var a = $('ans'); if (a) [].forEach.call(a.children, function (b) { b.disabled = true; if (b.getAttribute('data-value') === S.q.ans) b.classList.add('ok'); });
    $('fb').textContent = ok ? 'Tepat. Jawabanmu benar.' : 'Belum tepat. Jawaban yang benar: ' + S.q.ans + '.';
    S.i++; var n = $('nx'); n.innerHTML = '<button class="h-btn l-next" type="button">' + (S.i >= MODES[mode].total ? 'Lihat hasil' : 'Soal berikutnya') + ' <i>↗</i></button>';
    n.firstChild.onclick = next; n.firstChild.focus();
  }
  function hum() {
    var b = $('hum'); b.disabled = true; b.textContent = '● Merekam…'; var want = SEMI[S.q.d % 7];
    listen(3000, function (cls) {
      if (cls === -2) { $('fb').textContent = 'Mikrofon tidak tersedia atau belum diizinkan. Periksa izin mikrofon browser, lalu coba lagi.'; b.disabled = false; b.textContent = '● Coba lagi'; return; }
      if (cls === -1) { $('fb').textContent = 'Nada belum terdeteksi dengan cukup jelas. Coba humming stabil selama beberapa detik.'; b.disabled = false; b.textContent = '● Coba lagi'; return; }
      var got = cls === want, name = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][cls];
      answer(got, null); $('fb').textContent = (got ? 'Tepat. ' : 'Belum tepat. ') + 'Terdeteksi ' + name + ', targetnya ' + S.q.ans + '.';
    });
  }
  function finish() {
    var pct = Math.round(S.ok / MODES[mode].total * 100), pts = S.ok * 10;
    save(mode, pct, pts);
    var msg = pct >= 70 ? 'Bagus. Jalur ini tercatat di Track Progress.' : 'Coba sesi baru untuk meningkatkan hasil dan mencapai 70%.';
    panel.innerHTML = '<div class="l-result"><p class="l-meta"><span>SESSION COMPLETE</span><span>' + pts + ' POINTS</span></p><div class="l-score">' + pct + '%</div><p class="l-fb">' + S.ok + ' dari ' + MODES[mode].total + ' jawaban benar. ' + msg + '</p><button class="h-btn" type="button" id="again">Sesi baru, soal baru <i>↗</i></button></div>';
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
