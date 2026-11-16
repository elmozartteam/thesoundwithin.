/* Level 3 — Basic Harmony. Generator soal tanpa batas (dipakai oleh lab.js). */
window.TSW_LEVEL = function (H) {
  'use strict';
  var SEMI = H.SEMI, rnd = H.rnd, sound = H.sound, midi = H.midi, NAMES = H.NAMES, L = H.L;
  var last = '';
  function shuf(a) { return a.slice().sort(function () { return Math.random() - .5; }); }
  function fresh(make) { var q, i = 0; do { q = make(); } while (q.id === last && i++ < 8); last = q.id; return q; }
  function opts4(ans, pool) { var o = [ans]; shuf(pool).forEach(function (x) { if (o.length < 4 && o.indexOf(x) < 0) o.push(x); }); return shuf(o); }
  function big(t, small, size) { return '<div class="l-big"' + (size ? ' style="font-size:' + size + 'px"' : '') + '>' + t + '<small>' + small + '</small></div>'; }
  function chord(ms, gap) { return function () { ms.forEach(function (m, i) { setTimeout(function () { midi(m); }, i * (gap || 45)); }); }; }

  var CH = { C: ['C','F','G'], G: ['G','C','D'], D: ['D','G','A'], A: ['A','D','E'], E: ['E','A','B'], F: ['F','B♭','C'], 'B♭': ['B♭','E♭','F'], 'E♭': ['E♭','A♭','B♭'] };
  var KEYS = Object.keys(CH), ROM = ['I', 'IV', 'V'];
  var ALLCH = []; KEYS.forEach(function (k) { CH[k].forEach(function (c) { if (ALLCH.indexOf(c) < 0) ALLCH.push(c); }); });
  var TR = { C: ['C','E','G'], F: ['F','A','C'], G: ['G','B','D'], D: ['D','F♯','A'], A: ['A','C♯','E'] };
  var INV = ['Posisi akar', 'Inversi 1', 'Inversi 2'];
  var CAD = [['V – I', 'Perfect'], ['IV – I', 'Plagal'], ['I – V', 'Half'], ['V – vi', 'Interrupted']];
  var PRG = ['I – IV – V – I', 'I – V – IV – I', 'I – IV – I – V', 'I – I – IV – V'];
  var I_ = [60, 64, 67], IV_ = [60, 65, 69], V_ = [59, 62, 67];

  return {
    reading: { total: 10, make: function () { return fresh(function () {
      var t = rnd(0, 4), k = KEYS[rnd(0, KEYS.length - 1)];
      if (t === 0) { var i = rnd(0, 2); return { id: 'a' + k + i, html: big(k, 'Mayor'), opts: opts4(CH[k][i], ALLCH), ans: CH[k][i], prompt: 'Akor ' + ROM[i] + ' dalam tangga nada ini?' }; }
      if (t === 1) return { id: 'f' + k, html: big(k, 'Mayor'), opts: opts4(CH[k].join(' – '), KEYS.map(function (x) { return CH[x].join(' – '); })), ans: CH[k].join(' – '), prompt: 'Family chord (I – IV – V) tangga nada ini?' };
      if (t === 2) { var tk = Object.keys(TR)[rnd(0, 4)], b = rnd(0, 2); return { id: 'v' + tk + b, html: big(b ? tk + ' / ' + TR[tk][b] : tk, 'Akor ' + tk + (b ? ', bass ' + TR[tk][b] : '')), opts: INV, ans: INV[b], prompt: 'Akor ini berada di posisi apa?' }; }
      if (t === 3) { var c = CAD[rnd(0, 3)]; return { id: 'c' + c[1], html: big(c[0], 'Akhir frasa', 44), opts: CAD.map(function (x) { return x[1]; }), ans: c[1], prompt: 'Jenis cadence apa ini?' }; }
      var p = PRG[rnd(0, 3)], ch = p.split(' – ').map(function (r) { return CH[k][ROM.indexOf(r)]; });
      return { id: 'p' + k + p, html: big(ch.join(' – '), 'Kunci ' + k + ' mayor', 32), opts: shuf(PRG), ans: p, prompt: 'Tulis progresi akor ini dalam angka romawi.' };
    }); } },
    listening: { total: 10, make: function () { return fresh(function () {
      if (Math.random() < .5) {
        var r = [60, 62, 64, 65, 67, 69][rnd(0, 5)], maj = Math.random() < .5;
        return { id: 'lt' + r + maj, opts: ['Mayor', 'Minor'], ans: maj ? 'Mayor' : 'Minor', play: chord([r, r + (maj ? 4 : 3), r + 7]), prompt: 'Dengar akor ini. Mayor atau minor?' };
      }
      var c = [['Perfect', [V_, I_]], ['Plagal', [IV_, I_]], ['Half', [I_, V_]]][rnd(0, 2)];
      return { id: 'lc' + c[0], opts: ['Perfect', 'Plagal', 'Half'], ans: c[0], play: function () { chord(c[1][0], 60)(); setTimeout(chord(c[1][1], 60), 1100); }, prompt: 'Dengar dua akor penutup di kunci C. Jenis cadence apa?' };
    }); } },
    speaking: { total: 5, make: function () { return fresh(function () {
      var d = [28, 29, 31, 32, 33][rnd(0, 4)], r = 12 * (Math.floor(d / 7) + 1) + SEMI[d % 7], third = Math.random() < .5, tgt = (SEMI[d % 7] + (third ? 4 : 7)) % 12;
      return { id: 'sp' + d + third, d: d, ds: [d], tgt: tgt, ans: NAMES[tgt], play: chord([r, r + 4, r + 7], 60), prompt: 'Dengar akor ' + L[d % 7] + ' mayor. Humming nada ' + (third ? 'terts (3rd)' : 'kuint (5th)') + '-nya.' };
    }); } }
  };
};
