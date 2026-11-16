/* Level 1 — Notation & Rhythm. Generator soal tanpa batas (dipakai oleh lab.js). */
window.TSW_LEVEL = function (H) {
  'use strict';
  var L = H.L, SEMI = H.SEMI, rnd = H.rnd, sound = H.sound;
  var INT = ['2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  var KEYS = [{ k: 'C', sig: 'tanpa kres/mol', tri: 'C–E–G' }, { k: 'G', sig: '1 kres (F♯)', tri: 'G–B–D' }, { k: 'F', sig: '1 mol (B♭)', tri: 'F–A–C' }];
  var last = '';
  function shuf(a) { return a.slice().sort(function () { return Math.random() - .5; }); }
  function fresh(make) { var q, i = 0; do { q = make(); } while (q.id === last && i++ < 8); last = q.id; return q; }
  function seq(ds) { return function () { ds.forEach(function (d, i) { setTimeout(function () { sound(d); }, i * 700); }); }; }

  return {
    reading: { total: 10, make: function () { return fresh(function () {
      var t = rnd(0, 3), k = KEYS[rnd(0, 2)];
      if (t === 0) { var d1 = rnd(28, 33), n = rnd(2, 8); return { id: 'i' + d1 + n, ds: [d1, d1 + n - 1], opts: INT, ans: INT[n - 2], prompt: 'Berapa interval antara dua nada ini?' }; }
      if (t === 1) { var b = [2, 3, 4][rnd(0, 2)]; return { id: 'b' + b, html: '<div class="l-big">' + b + '/4<small>Birama</small></div>', opts: ['2', '3', '4'], ans: String(b), prompt: 'Berapa ketukan (not seperempat) dalam satu birama?' }; }
      if (t === 2) return { id: 'k' + k.k, html: '<div class="l-big" style="font-size:34px">' + k.sig + '<small>Tanda kunci</small></div>', opts: ['C', 'G', 'F'], ans: k.k, prompt: 'Tangga nada mayor apa yang memakai tanda kunci ini?' };
      var o = shuf(KEYS.map(function (x) { return x.tri; }).concat(['D–F–A'])); return { id: 't' + k.k, html: '<div class="l-big">' + k.k + '<small>Mayor</small></div>', opts: o, ans: k.tri, prompt: 'Nada penyusun tonic triad tangga nada ini?' };
    }); } },
    listening: { total: 10, make: function () { return fresh(function () {
      if (Math.random() < .5) { var d1 = rnd(28, 33), n = rnd(2, 8), ds = [d1, d1 + n - 1]; return { id: 'li' + d1 + n, opts: INT, ans: INT[n - 2], play: seq(ds), prompt: 'Dengar dua nada berurutan, lalu pilih intervalnya.' }; }
      var r = rnd(28, 33), maj = [28, 31, 32].indexOf(r) >= 0;
      return { id: 'lt' + r, opts: ['Mayor', 'Minor'], ans: maj ? 'Mayor' : 'Minor', play: function () { [r, r + 2, r + 4].forEach(function (d) { sound(d); }); }, prompt: 'Dengar akor ini. Mayor atau minor?' };
    }); } },
    speaking: { total: 5, make: function () { return fresh(function () {
      var d1 = rnd(28, 31), n = rnd(2, 5), d2 = d1 + n - 1;
      return { id: 's' + d1 + n, d: d1, ds: [d1], tgt: SEMI[d2 % 7], ans: L[d2 % 7], play: function () { sound(d1); }, prompt: 'Mulai dari ' + L[d1 % 7] + '. Humming nada interval ' + INT[n - 2] + ' di atasnya.' };
    }); } }
  };
};
