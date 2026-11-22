/* TSW — tsw-certificate.js
   Sertifikat per level, dibuat dari catatan TSWProgress (tsw-progress.js).
     • GRATIS  : Level 0–3  → Certificate of Completion (nama, tanggal, level, skor keseluruhan, skor Reading/Listening/Speaking, predikat, ID)
     • PREMIUM : Level 4–5  → Certificate of Achievement (semua isi di atas + band score 0–9, akurasi & jumlah jawaban,
                              penguasaan topik, kekuatan & area fokus, segel premium)
   Pakai: TSWCertificate.mount(document.getElementById('certMount'), { upgradeHref: 'eksklusif.html' })
   Status premium dibaca dari: window.TSW_PREMIUM === true, fungsi window.tswIsPremium(), atau localStorage 'tsw_premium' = '1'/'true'.
   CATATAN: pemeriksaan premium di browser hanya mengatur tampilan; ia bukan perlindungan keamanan. Penguncian sungguhan harus dari server. */
(function () {
  'use strict';
  var NAMEKEY = 'tsw_cert_name';
  var MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function isPremium() {
    try {
      if (window.TSW_PREMIUM === true) return true;
      if (typeof window.tswIsPremium === 'function') return !!window.tswIsPremium();
      var v = localStorage.getItem('tsw_premium'); return v === '1' || v === 'true';
    } catch (e) { return false; }
  }
  function guessName() {
    try {
      var own = localStorage.getItem(NAMEKEY); if (own) return own;
      var keys = ['tsw_user_name', 'tsw_name', 'tsw_username', 'tsw_user', 'tsw_profile'];
      for (var i = 0; i < keys.length; i++) {
        var v = localStorage.getItem(keys[i]); if (!v) continue;
        try { var o = JSON.parse(v); if (o && (o.name || o.nama || o.displayName)) return o.name || o.nama || o.displayName; if (typeof o === 'string') return o; } catch (e) { return v; }
      }
    } catch (e) {}
    return '';
  }
  function fmtDate(iso) { var d = iso ? new Date(iso) : new Date(); if (isNaN(d)) d = new Date(); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function ymd(iso) { var d = iso ? new Date(iso) : new Date(); if (isNaN(d)) d = new Date(); return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2); }
  function hash(str) { var h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; return ('00000000' + h.toString(16).toUpperCase()).slice(-8); }
  function passDate(r) { var best = null; ['reading', 'listening', 'speaking'].forEach(function (m) { var t = r.modules[m].passedAt || r.modules[m].updated; if (t && (!best || t > best)) best = t; }); return best; }
  function trunc(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  /* ── isi sertifikat (data) ── */
  function build(level, name) {
    var r = window.TSWProgress.levelReport(level); if (!r) return null;
    var date = passDate(r) || new Date().toISOString(), prem = r.premium;
    var d = { level: level, name: name, levelName: r.name, eq: r.eq, premium: prem, grade: r.grade, overall: r.overall, date: date,
      reading: r.modules.reading.percent, listening: r.modules.listening.percent, speaking: r.modules.speaking.percent,
      answers: r.totalAnswers, accuracy: r.accuracy, band: (r.overall / 100 * 9).toFixed(1) };
    d.id = 'TSW-L' + level + '-' + ymd(date) + '-' + hash([name, level, d.overall, d.reading, d.listening, d.speaking, ymd(date)].join('|')).slice(0, 6);
    var all = [];
    ['reading', 'listening', 'speaking'].forEach(function (m) { var t = r.modules[m].topics; Object.keys(t).forEach(function (k) { if (t[k].attempts >= 3) all.push({ label: t[k].label, p: t[k].percent, st: t[k].status }); }); });
    all.sort(function (a, b) { return b.p - a.p; });
    d.mastered = all.filter(function (x) { return x.st === 'mastered'; }).length; d.topicCount = all.length;
    d.strengths = all.slice(0, 3).map(function (x) { return x.label + ' (' + x.p + '%)'; });
    var weak = all.filter(function (x) { return x.p < 70; }).slice(-2).reverse();
    d.focus = weak.map(function (x) { return x.label + ' (' + x.p + '%)'; });
    return d;
  }

  /* ── gambar sertifikat (SVG 1200×850, tanpa sumber luar) ── */
  function svg(d) {
    var P = d.premium, G = P ? '#B8862B' : '#B8923F', N = '#14233F', N2 = '#27406B', W = 1200, H = 850, s = '';
    s += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" font-family="Georgia, \'Times New Roman\', serif">';
    s += '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFDF8"/><stop offset=".55" stop-color="#F6EEDC"/><stop offset="1" stop-color="#E9DFC6"/></linearGradient>' +
      '<linearGradient id="hd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + N + '"/><stop offset="1" stop-color="' + N2 + '"/></linearGradient>' +
      '<linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F1DDA7"/><stop offset=".5" stop-color="#C99A3A"/><stop offset="1" stop-color="#8A6417"/></linearGradient></defs>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#bg)"/>';
    s += '<rect x="22" y="22" width="' + (W - 44) + '" height="' + (H - 44) + '" fill="none" stroke="' + N + '" stroke-width="5"/>';
    s += '<rect x="36" y="36" width="' + (W - 72) + '" height="' + (H - 72) + '" fill="none" stroke="' + (P ? 'url(#gd)' : G) + '" stroke-width="' + (P ? 4 : 2) + '"/>';
    [[52, 52, 1, 1], [W - 52, 52, -1, 1], [52, H - 52, 1, -1], [W - 52, H - 52, -1, -1]].forEach(function (c) {
      s += '<path d="M' + c[0] + ' ' + (c[1] + c[3] * 46) + ' V' + c[1] + ' H' + (c[0] + c[2] * 46) + '" fill="none" stroke="' + G + '" stroke-width="3"/>';
    });
    s += '<rect x="36" y="36" width="' + (W - 72) + '" height="92" fill="url(#hd)"/>';
    s += '<text x="' + W / 2 + '" y="82" text-anchor="middle" font-size="30" font-weight="700" letter-spacing="7" fill="#FBF7EE">THE SOUND WITHIN</text>';
    s += '<text x="' + W / 2 + '" y="108" text-anchor="middle" font-size="12" letter-spacing="5" fill="#E6CB8C">EVERY EXPERT ONCE HEARD A FIRST NOTE</text>';
    s += '<text x="' + W / 2 + '" y="184" text-anchor="middle" font-size="19" letter-spacing="6" fill="' + (P ? '#7A5A16' : N2) + '" font-weight="700">' + (P ? 'PREMIUM · CERTIFICATE OF ACHIEVEMENT' : 'FREE · CERTIFICATE OF COMPLETION') + '</text>';
    s += '<text x="' + W / 2 + '" y="236" text-anchor="middle" font-size="22" font-style="italic" fill="' + N + '">Dengan bangga diberikan kepada</text>';
    var nm = d.name || 'Nama Peserta', fs = nm.length > 30 ? 40 : nm.length > 20 ? 52 : 64;
    s += '<text x="' + W / 2 + '" y="' + (312) + '" text-anchor="middle" font-size="' + fs + '" font-style="italic" fill="' + N + '">' + esc(trunc(nm, 44)) + '</text>';
    s += '<line x1="300" x2="900" y1="332" y2="332" stroke="' + G + '" stroke-width="2"/>';
    s += '<text x="' + W / 2 + '" y="372" text-anchor="middle" font-size="20" fill="' + N + '">atas keberhasilan menyelesaikan</text>';
    s += '<text x="' + W / 2 + '" y="420" text-anchor="middle" font-size="38" font-weight="700" fill="' + N2 + '">Level ' + d.level + ' · ' + esc(d.levelName) + '</text>';
    s += '<text x="' + W / 2 + '" y="450" text-anchor="middle" font-size="16" letter-spacing="2" fill="' + N + '">' + esc(d.eq.toUpperCase()) + ' · PREDIKAT ' + esc(String(d.grade || '').toUpperCase()) + '</text>';
    /* panel skor */
    var y0 = 482, bx = 110, bw = 980;
    s += '<rect x="' + bx + '" y="' + y0 + '" width="' + bw + '" height="' + (P ? 196 : 150) + '" rx="14" fill="#FFFFFF" stroke="' + N + '" stroke-opacity=".35" stroke-width="1.5"/>';
    s += '<text x="' + (bx + 40) + '" y="' + (y0 + 62) + '" font-size="64" font-weight="700" fill="' + N2 + '">' + d.overall + '%</text>';
    s += '<text x="' + (bx + 40) + '" y="' + (y0 + 92) + '" font-size="13" letter-spacing="3" font-weight="700" fill="' + N + '">SKOR KESELURUHAN</text>';
    if (P) s += '<text x="' + (bx + 40) + '" y="' + (y0 + 126) + '" font-size="20" fill="#7A5A16" font-weight="700">Band ' + d.band + ' / 9</text>';
    [['READING', d.reading], ['LISTENING', d.listening], ['SPEAKING', d.speaking]].forEach(function (m, i) {
      var y = y0 + 40 + i * 38, x = bx + 330;
      s += '<text x="' + x + '" y="' + (y + 5) + '" font-size="14" font-weight="700" letter-spacing="2" fill="' + N + '">' + m[0] + '</text>';
      s += '<rect x="' + (x + 130) + '" y="' + (y - 8) + '" width="400" height="14" rx="7" fill="#D5DCE9"/><rect x="' + (x + 130) + '" y="' + (y - 8) + '" width="' + (4 * m[1]) + '" height="14" rx="7" fill="' + (P ? 'url(#gd)' : N2) + '"/>';
      s += '<text x="' + (x + 550) + '" y="' + (y + 5) + '" font-size="18" font-weight="700" fill="' + N2 + '">' + m[1] + '%</text>';
    });
    if (P) {
      s += '<line x1="' + (bx + 30) + '" x2="' + (bx + bw - 30) + '" y1="' + (y0 + 150) + '" y2="' + (y0 + 150) + '" stroke="' + N + '" stroke-opacity=".2"/>';
      s += '<text x="' + (bx + 40) + '" y="' + (y0 + 176) + '" font-size="14" fill="' + N + '">' + d.answers + ' jawaban tercatat · akurasi ' + d.accuracy + '% · ' + d.mastered + ' dari ' + d.topicCount + ' topik dikuasai</text>';
      var st = d.strengths.length ? 'Kekuatan: ' + trunc(d.strengths.join(' · '), 86) : '';
      var fc = d.focus.length ? 'Area fokus: ' + trunc(d.focus.join(' · '), 80) : 'Area fokus: tidak ada, semua topik utama di atas 70%';
      s += '<text x="' + (bx + 40) + '" y="' + (y0 + 214) + '" font-size="13" fill="' + N2 + '">' + esc(st) + '</text>';
      s += '<text x="' + (bx + 40) + '" y="' + (y0 + 234) + '" font-size="13" fill="#8A3E33">' + esc(fc) + '</text>';
    }
    /* footer */
    var fy = H - 86;
    s += '<text x="150" y="' + fy + '" font-size="15" fill="' + N + '">Diterbitkan: ' + fmtDate(d.date) + '</text>';
    s += '<text x="150" y="' + (fy + 24) + '" font-size="13" fill="' + N2 + '" letter-spacing="1">ID: ' + d.id + '</text>';
    s += '<line x1="800" x2="1050" y1="' + (fy + 2) + '" y2="' + (fy + 2) + '" stroke="' + N + '"/><text x="925" y="' + (fy + 24) + '" text-anchor="middle" font-size="13" letter-spacing="2" fill="' + N + '">THE SOUND WITHIN</text>';
    if (P) {
      s += '<g transform="translate(600 ' + (fy - 6) + ')"><circle r="44" fill="url(#gd)" stroke="#8A6417" stroke-width="3"/><circle r="34" fill="none" stroke="#FFFDF8" stroke-width="1.5" stroke-dasharray="3 4"/>' +
        '<text y="-4" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="2" fill="#4A3408">PREMIUM</text><text y="16" text-anchor="middle" font-size="22" font-weight="700" fill="#4A3408">L' + d.level + '</text></g>';
    } else {
      s += '<g transform="translate(600 ' + (fy - 6) + ')"><circle r="40" fill="none" stroke="' + G + '" stroke-width="3"/><circle r="31" fill="none" stroke="' + G + '" stroke-width="1" stroke-dasharray="3 4"/>' +
        '<text y="-2" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="2" fill="' + N2 + '">LEVEL</text><text y="22" text-anchor="middle" font-size="26" font-weight="700" fill="' + N2 + '">' + d.level + '</text></g>';
    }
    return s + '</svg>';
  }

  /* ── unduh / cetak ── */
  function filename(d) { return 'TSW-Certificate-Level-' + d.level + '-' + (d.name || 'peserta').replace(/[^\w\-]+/g, '_').slice(0, 30) + '.png'; }
  function downloadPng(d) {
    var data = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(d)), img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = 2400; c.height = 1700; var x = c.getContext('2d'); x.drawImage(img, 0, 0, 2400, 1700);
      c.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = filename(d); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }, 'image/png');
    };
    img.src = data;
  }
  function printCert(d) {
    var w = window.open('', '_blank'); if (!w) { alert('Pop-up diblokir. Izinkan pop-up untuk mencetak, atau gunakan Unduh PNG.'); return; }
    w.document.write('<!doctype html><title>' + esc(filename(d).replace('.png', '')) + '</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0;height:100%}svg{width:100vw;height:100vh;display:block}</style>' + svg(d));
    w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 350);
  }

  /* ── antarmuka ── */
  var CSS = '.tc{font-family:Lora,Georgia,serif;color:#14233F}.tc *{box-sizing:border-box}' +
    '.tc-top{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:0 0 16px}' +
    '.tc-lv{padding:14px;border:1.5px solid rgba(20,35,63,.35);border-radius:14px;background:linear-gradient(160deg,#FFFDF8,#F1E9D6);color:#14233F;text-align:left;cursor:pointer;font:600 13px Lora,Georgia,serif;transition:.15s}' +
    '.tc-lv:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(0,0,0,.2)}.tc-lv[aria-pressed=true]{border-color:#B8923F;box-shadow:0 0 0 3px rgba(184,146,63,.55)}' +
    '.tc-lv b{display:block;font:600 26px "Cormorant Garamond",Georgia,serif;color:#27406B}.tc-lv small{display:block;margin-top:2px;font-size:11.5px;color:#33466A;font-weight:500}' +
    '.tc-tag{display:inline-block;margin-top:6px;padding:2px 10px;border-radius:999px;font:700 10px Lora,serif;letter-spacing:.1em;background:#CFEBDB;color:#124B2F}.tc-tag.p{background:#F3E4C0;color:#5E4308}.tc-tag.l{background:#E3E8F1;color:#33466A}' +
    '.tc-box{padding:20px;border-radius:16px;background:linear-gradient(170deg,#FFFDF8,#F1E9D6);border:1px solid rgba(210,177,111,.6);box-shadow:0 10px 26px rgba(0,0,0,.22);color:#14233F}' +
    '.tc-row{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin:0 0 16px}.tc-row label{display:block;font:700 11px Lora,serif;letter-spacing:.14em;margin-bottom:6px;color:#14233F}' +
    '.tc-row input{min-width:260px;padding:11px 14px;border:1.5px solid #14233F;border-radius:10px;background:#fff;color:#14233F;font:500 16px Lora,Georgia,serif}.tc-row input:focus-visible{outline:3px solid #B8923F}' +
    '.tc-btn{padding:12px 20px;border:1.5px solid #14233F;border-radius:11px;background:#14233F;color:#FBF7EE;font:700 13px Lora,serif;cursor:pointer;text-decoration:none;display:inline-block}.tc-btn:hover{background:#27406B}.tc-btn.alt{background:#FBF7EE;color:#14233F}.tc-btn.gold{background:linear-gradient(135deg,#B8923F,#D9B45E);border-color:#8A6417;color:#14233F}' +
    '.tc-prev{border:1px solid rgba(20,35,63,.3);border-radius:10px;overflow:hidden;background:#fff}.tc-prev svg{display:block;width:100%;height:auto}' +
    '.tc-msg{margin:0 0 14px;padding:14px 16px;border-radius:12px;font-size:14px;line-height:1.6}.tc-msg.warn{background:#FCEFD2;color:#5E4308;border-left:5px solid #B8923F}.tc-msg.lock{background:#EAEFF8;color:#14233F;border-left:5px solid #27406B}' +
    '.tc-note{margin:12px 0 0;font-size:12px;line-height:1.55;color:#33466A}';
  function css() { if (document.getElementById('tsw-cert-css')) return; var s = document.createElement('style'); s.id = 'tsw-cert-css'; s.textContent = CSS; document.head.appendChild(s); }

  function mount(el, opts) {
    if (!el) return; css(); opts = opts || {}; var upgrade = opts.upgradeHref || 'eksklusif.html', P = window.TSWProgress;
    if (!P) { el.innerHTML = '<p class="tc-msg warn">tsw-progress.js belum termuat.</p>'; return; }
    var sel = opts.level != null ? opts.level : -1, name = guessName();

    function draw() {
      var prem = isPremium(), reps = [0, 1, 2, 3, 4, 5].map(function (n) { return P.levelReport(n); }), best = -1;
      reps.forEach(function (r, i) { if (r && r.passed && (!r.premium || prem)) best = i; });
      if (sel < 0) sel = best >= 0 ? best : 0;
      var h = '<div class="tc"><div class="tc-top" role="group" aria-label="Pilih level sertifikat">';
      reps.forEach(function (r, i) {
        var tag = r.premium ? '<span class="tc-tag p">PREMIUM</span>' : '<span class="tc-tag">GRATIS</span>';
        var st = r.passed ? 'Lulus · ' + r.grade : r.totalAnswers ? 'Dalam proses · ' + r.overall + '%' : 'Belum dimulai';
        h += '<button type="button" class="tc-lv" data-lv="' + i + '" aria-pressed="' + (i === sel) + '"><b>Level ' + i + '</b>' + esc(r.name) + '<small>' + st + '</small>' + tag + '</button>';
      });
      h += '</div><div class="tc-box">';
      var r = reps[sel];
      if (r.premium && !prem) {
        h += '<p class="tc-msg lock"><b>Sertifikat Level ' + sel + ' adalah fitur Premium.</b> Sertifikat premium memuat band score 0–9, akurasi, jumlah jawaban, penguasaan topik, kekuatan, area fokus, dan segel premium. Level 0–3 tetap gratis.</p><a class="tc-btn gold" href="' + esc(upgrade) + '">Lihat paket Premium ↗</a>';
      } else if (!r.passed) {
        var need = []; ['reading', 'listening', 'speaking'].forEach(function (m) { if (!r.modules[m].passed) need.push(r.modules[m].label); });
        h += '<p class="tc-msg warn"><b>Sertifikat Level ' + sel + ' belum bisa diterbitkan.</b> Jalur yang belum memenuhi kriteria (skor ≥' + r.pass + '% dari minimal 10 jawaban): ' + need.join(', ') + '. Lanjutkan latihan, lalu kembali ke sini.</p>';
      } else {
        var d = build(sel, name);
        h += '<div class="tc-row"><div><label for="tcName">NAMA DI SERTIFIKAT</label><input id="tcName" type="text" maxlength="60" autocomplete="name" placeholder="Tulis nama lengkapmu" value="' + esc(name) + '"></div>' +
          '<button type="button" class="tc-btn" id="tcPng">Unduh PNG</button><button type="button" class="tc-btn alt" id="tcPrint">Cetak / Simpan PDF</button></div>' +
          '<div class="tc-prev" id="tcPrev">' + svg(d) + '</div><p class="tc-note">' + (r.premium ? 'Sertifikat Premium Level ' + sel : 'Sertifikat Gratis Level ' + sel) + ' · ID ' + d.id + '. ID dibuat dari nama, level, tanggal, dan skor. Nama bisa diubah sebelum diunduh. Catatan skor tersimpan di browser ini.</p>';
      }
      h += '</div></div>'; el.innerHTML = h;
      el.querySelectorAll('[data-lv]').forEach(function (b) { b.addEventListener('click', function () { sel = +b.getAttribute('data-lv'); draw(); }); });
      var inp = el.querySelector('#tcName');
      if (inp) {
        inp.addEventListener('input', function () { name = inp.value.trim(); try { localStorage.setItem(NAMEKEY, name); } catch (e) {} el.querySelector('#tcPrev').innerHTML = svg(build(sel, name)); });
        el.querySelector('#tcPng').addEventListener('click', function () { if (!name) { inp.focus(); return; } downloadPng(build(sel, name)); });
        el.querySelector('#tcPrint').addEventListener('click', function () { if (!name) { inp.focus(); return; } printCert(build(sel, name)); });
      }
    }
    draw();
    window.addEventListener('tsw:progress', function () { if (!el.querySelector('#tcName') || document.activeElement !== el.querySelector('#tcName')) draw(); });
  }

  window.TSWCertificate = { mount: mount, build: build, svg: svg, isPremium: isPremium };
})();
