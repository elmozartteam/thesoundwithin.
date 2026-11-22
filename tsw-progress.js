/* TSW — tsw-progress.js
   Penyimpanan hasil latihan bersama untuk semua level (Reading / Listening / Speaking).
   Dipakai oleh: halaman latihan (level0.js), halaman Track Progress, dan Sertifikat.

   API publik (window.TSWProgress):
     record(level, module, topic, correct)  → simpan satu jawaban
     moduleStats(level, module)             → statistik satu jalur
     levelReport(level)                     → laporan lengkap satu level (skor, kriteria, topik)
     getReport()                            → data untuk SERTIFIKAT (level tertinggi + skor total + skor per modul)
     renderTracker(element, level)          → gambar panel progres lengkap ke dalam element
     renderCertificateSummary(element)      → ringkasan skor untuk sertifikat
     reset(level)                           → hapus catatan satu level
   Semua data tersimpan lokal di localStorage (kunci: tsw_progress_v2). Tidak ada data yang dikirim ke server. */
(function () {
  'use strict';
  var KEY = 'tsw_progress_v2';

  /* ── Kriteria per level. Level lain tinggal ditambah di sini. ── */
  var CFG = {
    0: {
      name: 'Musical Foundation',
      pass: 70,          // skor minimal (%) per jalur
      minAnswers: 10,    // jumlah jawaban minimal agar skor dianggap valid
      window: 20,        // skor dihitung dari N jawaban terakhir
      topicWin: 10, topicMin: 3,
      modules: {
        reading: { label: 'Reading', topics: {
          alphabet: 'Nama nada & alfabet musik', keyboard: 'Keyboard & oktaf', pitch: 'Pitch, frekuensi & semitone',
          elements: 'Unsur musik & tekstur', families: 'Keluarga instrumen', production: 'Cara instrumen menghasilkan bunyi', guitar: 'Gitar: senar & fret' } },
        listening: { label: 'Listening', topics: {
          contour: 'Tinggi-rendah pitch', interval: 'Jarak nada dekat/jauh', melodyshape: 'Arah melodi', notename: 'Mengenali nama nada',
          octave: 'Hubungan oktaf', timbre: 'Warna suara (timbre)', texture: 'Melody vs harmony', dynamics: 'Keras-lembut', tempo: 'Cepat-lambat', percussion: 'Suara perkusi' } },
        speaking: { label: 'Speaking', topics: { match: 'Menyamakan pitch dengan suara', interval: 'Menyanyikan jarak nada' } }
      }
    }
  };
  var ORDER = ['reading', 'listening', 'speaking'];

  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.v === 2) return d; } catch (e) {} return { v: 2, levels: {} }; }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function slot(d, level, mod) {
    var L = d.levels[level] = d.levels[level] || {};
    return L[mod] = L[mod] || { attempts: 0, correct: 0, recent: [], topics: {}, best: 0, passedAt: null, updated: null };
  }
  function pct(arr) { if (!arr.length) return 0; var s = 0; arr.forEach(function (x) { s += x; }); return Math.round(s / arr.length * 100); }

  function stats(d, level, mod) {
    var c = CFG[level], m = (d.levels[level] || {})[mod] || { attempts: 0, correct: 0, recent: [], topics: {}, best: 0, passedAt: null };
    var recentPct = pct(m.recent), enough = m.recent.length >= c.minAnswers;
    var topics = {};
    Object.keys(c.modules[mod].topics).forEach(function (t) {
      var tt = m.topics[t] || { a: 0, c: 0, recent: [] }, p = pct(tt.recent), st;
      if (!tt.a) st = 'new'; else if (tt.recent.length >= c.topicMin && p >= c.pass) st = 'mastered'; else if (tt.recent.length >= c.topicMin) st = 'practice'; else st = 'trying';
      topics[t] = { label: c.modules[mod].topics[t], attempts: tt.a, correct: tt.c, percent: p, status: st };
    });
    var passedNow = enough && recentPct >= c.pass;
    return { module: mod, label: c.modules[mod].label, attempts: m.attempts, correct: m.correct, recentN: m.recent.length, recentPct: recentPct,
      best: m.best || 0, passed: !!m.passedAt || passedNow, passedNow: passedNow, passedAt: m.passedAt, topics: topics, updated: m.updated };
  }

  function syncCompat(level, mod, s) {
    if (level !== 0) return;
    try {
      var p = Math.max(s.best, s.recentPct), pts = s.correct * 10;
      var rec = mod === 'reading' ? { percent: p, score: pts } : mod === 'listening' ? { accuracy: p, score: pts }
        : { accuracy: p + '%', score: pts + ' points', band: (p / 100 * 9).toFixed(1) + ' / 9' };
      localStorage.setItem('tsw_score_' + mod, JSON.stringify(rec));
      localStorage.setItem('tsw_level0_' + mod, JSON.stringify({ percent: p, points: pts, completedAt: new Date().toISOString() }));
    } catch (e) {}
    if (s.passed && window.trackSoundProgress) { try { window.trackSoundProgress(mod); } catch (e) {} }
  }

  function record(level, mod, topic, correct) {
    var c = CFG[level]; if (!c || !c.modules[mod]) return null;
    var d = load(), m = slot(d, level, mod), v = correct ? 1 : 0;
    m.attempts++; m.correct += v; m.recent.push(v); if (m.recent.length > c.window) m.recent.shift();
    var t = m.topics[topic] = m.topics[topic] || { a: 0, c: 0, recent: [] };
    t.a++; t.c += v; t.recent.push(v); if (t.recent.length > c.topicWin) t.recent.shift();
    m.updated = new Date().toISOString();
    var rp = pct(m.recent);
    if (m.recent.length >= c.minAnswers) {
      if (rp > m.best) m.best = rp;
      if (rp >= c.pass && !m.passedAt) m.passedAt = m.updated;
    }
    save(d);
    var s = stats(d, level, mod); syncCompat(level, mod, s);
    try { window.dispatchEvent(new CustomEvent('tsw:progress', { detail: { level: level, module: mod } })); } catch (e) {}
    return s;
  }

  function gradeOf(p) { return p >= 90 ? 'Distinction' : p >= 80 ? 'Merit' : 'Pass'; }

  function levelReport(level) {
    var c = CFG[level], d = load(); if (!c) return null;
    var mods = {}, sum = 0, all = true, tot = 0, ok = 0, criteria = [];
    ORDER.forEach(function (mod) {
      var s = stats(d, level, mod); mods[mod] = s;
      var shown = s.passed ? Math.max(s.recentPct, s.best) : s.recentPct; s.percent = shown;
      sum += shown; if (!s.passed) all = false; tot += s.attempts; ok += s.correct;
      criteria.push({ module: mod, met: s.passed,
        text: s.label + ': skor minimal ' + c.pass + '% dari ' + c.minAnswers + '+ jawaban terakhir',
        detail: s.recentN + ' jawaban terakhir · ' + s.recentPct + '% sekarang · terbaik ' + s.best + '%' });
    });
    var overall = Math.round(sum / ORDER.length);
    return { level: level, name: c.name, pass: c.pass, modules: mods, criteria: criteria, overall: overall, passed: all,
      grade: all ? gradeOf(overall) : null, totalAnswers: tot, totalCorrect: ok, accuracy: tot ? Math.round(ok / tot * 100) : 0 };
  }

  function getReport() {
    var levels = {}, highest = -1, keys = Object.keys(CFG).map(Number).sort(function (a, b) { return a - b; });
    keys.forEach(function (l) { levels[l] = levelReport(l); });
    for (var i = 0; i < keys.length; i++) { if (levels[keys[i]].passed) highest = keys[i]; else break; }
    var cert = highest >= 0 ? levels[highest] : null;
    return { generatedAt: new Date().toISOString(), highestLevelCompleted: highest, levels: levels,
      certificate: cert ? { level: cert.level, levelName: cert.name, grade: cert.grade, overall: cert.overall,
        reading: cert.modules.reading.percent, listening: cert.modules.listening.percent, speaking: cert.modules.speaking.percent,
        totalAnswers: cert.totalAnswers } : null };
  }

  function reset(level) { var d = load(); delete d.levels[level]; save(d); try { window.dispatchEvent(new CustomEvent('tsw:progress', { detail: { level: level } })); } catch (e) {} }

  /* ── tampilan ── */
  var CSS = '.tp{--tp-navy:#14233F;--tp-navy2:#27406B;--tp-ivory:#FBF7EE;--tp-gold:#B8923F;font-family:Lora,Georgia,serif;color:var(--tp-navy)}' +
    '.tp *{box-sizing:border-box}' +
    '.tp-head{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;padding:22px 26px;border-radius:16px 16px 0 0;background:linear-gradient(135deg,#14233F 0%,#27406B 100%);color:#FBF7EE}' +
    '.tp-eyebrow{margin:0 0 6px;font:700 11px Lora,serif;letter-spacing:.2em;color:#E6CB8C}' +
    '.tp .tp-title{margin:0;font:600 28px "Cormorant Garamond",Georgia,serif;color:#FBF7EE !important}' +
    '.tp-badge{display:inline-block;margin-top:8px;padding:5px 14px;border-radius:999px;font:700 12px Lora,serif;background:#FBF7EE;color:#14233F}' +
    '.tp-badge.ok{background:#CFEBDB;color:#124B2F}' +
    '.tp-big{text-align:right}.tp-big b{display:block;font:600 54px/1 "Cormorant Garamond",Georgia,serif;color:#F1DDA7}.tp-big span{font-size:12px;letter-spacing:.14em;color:#DCE4F2}' +
    '.tp-body{padding:20px 22px 22px;border:1px solid rgba(20,35,63,.18);border-top:0;border-radius:0 0 16px 16px;background:linear-gradient(180deg,#FBF7EE 0%,#F1EADA 100%)}' +
    '.tp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}' +
    '.tp-card{padding:18px;border:1px solid rgba(20,35,63,.2);border-radius:14px;background:#fff;box-shadow:0 2px 10px rgba(20,35,63,.07)}' +
    '.tp .tp-card h4{color:#14233F !important;display:flex;justify-content:space-between;align-items:baseline;margin:0 0 4px;font:700 13px Lora,serif;letter-spacing:.14em;color:#14233F}' +
    '.tp-card h4 em{font:600 28px "Cormorant Garamond",Georgia,serif;font-style:normal;color:#27406B}' +
    '.tp-pill{display:inline-block;margin:2px 0 10px;padding:3px 11px;border-radius:999px;font:700 11px Lora,serif;background:#F3E4C0;color:#5E4308}' +
    '.tp-pill.ok{background:#CFEBDB;color:#124B2F}' +
    '.tp-bar{position:relative;height:10px;border-radius:6px;background:#DDE3EE;overflow:visible}.tp-bar i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#27406B,#B8923F)}' +
    '.tp-bar u{position:absolute;top:-4px;width:2px;height:18px;background:#A8574A;text-decoration:none}' +
    '.tp-sub{margin:8px 0 12px;font-size:12.5px;line-height:1.5;color:#33466A}' +
    '.tp-topics{margin:0;padding:0;list-style:none;display:grid;gap:7px}.tp-topics li{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:12.5px;color:#14233F}' +
    '.tp-topics li small{grid-column:1/-1;display:block;height:5px;border-radius:3px;background:#E4E8F0;overflow:hidden}.tp-topics li small i{display:block;height:100%;background:#27406B}' +
    '.tp-st{font-weight:700;font-size:11.5px}.tp-st.mastered{color:#14683F}.tp-st.practice{color:#9A3A2E}.tp-st.trying{color:#7A5A16}.tp-st.new{color:#5B6B88}' +
    '.tp-crit{margin:18px 0 0;padding:16px 18px;border-radius:14px;background:#14233F;color:#FBF7EE}.tp-crit h4{margin:0 0 10px;font:700 12px Lora,serif;letter-spacing:.16em;color:#E6CB8C}' +
    '.tp-crit ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}.tp-crit li{display:grid;grid-template-columns:22px 1fr;gap:8px;font-size:13px;line-height:1.45;color:#FBF7EE}.tp-crit li small{display:block;color:#C9D4E8}' +
    '.tp-crit .m{font-weight:700;color:#8FD3A9}.tp-crit .n{font-weight:700;color:#F0B7A8}' +
    '.tp-cert{margin:14px 0 0;font-size:13px;line-height:1.6;color:#14233F}.tp-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;margin-top:12px;font-size:12px;color:#33466A}' +
    '.tp-reset{border:1px solid #A8574A;border-radius:8px;background:transparent;color:#8A3E33;font:600 12px Lora,serif;padding:6px 12px;cursor:pointer}.tp-reset:hover{background:#A8574A;color:#fff}' +
    '.tp-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.tp-sum div{padding:14px;border:1px solid rgba(20,35,63,.2);border-radius:12px;background:#fff;text-align:center}.tp-sum b{display:block;font:600 34px "Cormorant Garamond",Georgia,serif;color:#27406B}.tp-sum span{font:700 11px Lora,serif;letter-spacing:.14em;color:#14233F}';
  function css() { if (document.getElementById('tsw-progress-css')) return; var s = document.createElement('style'); s.id = 'tsw-progress-css'; s.textContent = CSS; document.head.appendChild(s); }
  var ST = { mastered: 'Menguasai', practice: 'Perlu latihan', trying: 'Mulai dicoba', new: 'Belum dicoba' };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function renderTracker(el, level) {
    if (!el) return; level = level == null ? 0 : level; css();
    var r = levelReport(level); if (!r) { el.innerHTML = ''; return; }
    var h = '<div class="tp"><div class="tp-head"><div><p class="tp-eyebrow">LEVEL ' + level + ' · PROGRESS TRACKER</p><h3 class="tp-title">' + esc(r.name) + '</h3>' +
      '<span class="tp-badge' + (r.passed ? ' ok' : '') + '">' + (r.passed ? 'Level ' + level + ' selesai · ' + r.grade : 'Level ' + level + ' dalam proses') + '</span></div>' +
      '<div class="tp-big"><b>' + r.overall + '%</b><span>SKOR KESELURUHAN</span></div></div><div class="tp-body"><div class="tp-grid">';
    ORDER.forEach(function (mod) {
      var s = r.modules[mod];
      h += '<div class="tp-card"><h4>' + s.label.toUpperCase() + '<em>' + s.percent + '%</em></h4>' +
        '<span class="tp-pill' + (s.passed ? ' ok' : '') + '">' + (s.passed ? 'Kriteria terpenuhi' : s.recentN < 10 ? 'Butuh ' + Math.max(0, 10 - s.recentN) + ' jawaban lagi' : 'Belum mencapai ' + r.pass + '%') + '</span>' +
        '<div class="tp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + s.percent + '"><i style="width:' + s.percent + '%"></i><u style="left:' + r.pass + '%" title="Target ' + r.pass + '%"></u></div>' +
        '<p class="tp-sub">' + s.recentN + ' jawaban terakhir dihitung · ' + s.attempts + ' jawaban total · target ' + r.pass + '%</p><ul class="tp-topics">';
      Object.keys(s.topics).forEach(function (t) {
        var x = s.topics[t];
        h += '<li><span>' + esc(x.label) + '</span><span class="tp-st ' + x.status + '">' + ST[x.status] + (x.attempts ? ' · ' + x.percent + '%' : '') + '</span><small><i style="width:' + x.percent + '%"></i></small></li>';
      });
      h += '</ul></div>';
    });
    h += '</div><div class="tp-crit"><h4>KRITERIA KELULUSAN LEVEL ' + level + '</h4><ul>';
    r.criteria.forEach(function (c) { h += '<li><span class="' + (c.met ? 'm' : 'n') + '">' + (c.met ? '✓' : '○') + '</span><span>' + esc(c.text) + '<small>' + esc(c.detail) + '</small></span></li>'; });
    h += '<li><span class="' + (r.passed ? 'm' : 'n') + '">' + (r.passed ? '✓' : '○') + '</span><span>Ketiga jalur memenuhi kriteria → sertifikat Level ' + level + ' dapat diterbitkan</span></li></ul></div>' +
      '<p class="tp-cert">' + (r.passed ? 'Sertifikat memuat: Level ' + level + ' · ' + esc(r.name) + ', predikat ' + r.grade + ', skor keseluruhan ' + r.overall + '%, serta skor Reading ' + r.modules.reading.percent + '%, Listening ' + r.modules.listening.percent + '%, Speaking ' + r.modules.speaking.percent + '%.' : 'Lanjutkan latihan di tiga jalur sampai semua kriteria di atas terpenuhi. Soal selalu baru dan tidak ada batas jumlah latihan.') + '</p>' +
      '<div class="tp-foot"><span>Catatan tersimpan lokal di browser ini. ' + r.totalAnswers + ' jawaban tercatat · akurasi seumur hidup ' + r.accuracy + '%.</span><button type="button" class="tp-reset" data-tp-reset="' + level + '">Reset catatan Level ' + level + '</button></div></div></div>';
    el.innerHTML = h;
    var b = el.querySelector('[data-tp-reset]');
    if (b) b.addEventListener('click', function () { if (confirm('Hapus semua catatan latihan Level ' + level + ' di browser ini?')) { reset(level); renderTracker(el, level); } });
  }

  function renderCertificateSummary(el) {
    if (!el) return; css();
    var g = getReport(), c = g.certificate;
    if (!c) { el.innerHTML = '<div class="tp"><p class="tp-cert">Belum ada level yang memenuhi kriteria. Selesaikan Reading, Listening, dan Speaking minimal ' + CFG[0].pass + '% untuk membuka sertifikat.</p></div>'; return; }
    el.innerHTML = '<div class="tp"><p class="tp-eyebrow" style="color:#7A5A16">LEVEL TERTINGGI TERSELESAIKAN</p><h3 class="tp-title" style="color:#14233F">Level ' + c.level + ' · ' + esc(c.levelName) + ' — ' + c.grade + '</h3>' +
      '<div class="tp-sum"><div><b>' + c.overall + '%</b><span>KESELURUHAN</span></div><div><b>' + c.reading + '%</b><span>READING</span></div><div><b>' + c.listening + '%</b><span>LISTENING</span></div><div><b>' + c.speaking + '%</b><span>SPEAKING</span></div></div></div>';
  }

  window.TSWProgress = { record: record, moduleStats: function (l, m) { return stats(load(), l, m); }, levelReport: levelReport, getReport: getReport,
    renderTracker: renderTracker, renderCertificateSummary: renderCertificateSummary, reset: reset, config: CFG };
})();
