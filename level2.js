/* Level 2 — Scales, Keys & Intervals. Generator soal tanpa batas (dipakai oleh lab.js). */
window.TSW_LEVEL = function (H) {
  'use strict';
  var L = H.L, SEMI = H.SEMI, rnd = H.rnd, sound = H.sound, midi = H.midi, NAMES = H.NAMES;
  var last = '';
  function shuf(a) { return a.slice().sort(function () { return Math.random() - .5; }); }
  function fresh(make) { var q, i = 0; do { q = make(); } while (q.id === last && i++ < 8); last = q.id; return q; }
  function semi(d) { return 12 * Math.floor(d / 7) + SEMI[d % 7]; }
  function opts4(ans, pool) { var o = [ans]; shuf(pool).forEach(function (x) { if (o.length < 4 && o.indexOf(x) < 0) o.push(x); }); return shuf(o); }
  function big(t, small, size) { return '<div class="l-big"' + (size ? ' style="font-size:' + size + 'px"' : '') + '>' + t + '<small>' + small + '</small></div>'; }

  var MAJ = { C: ['C','D','E','F','G','A','B'], G: ['G','A','B','C','D','E','F♯'], D: ['D','E','F♯','G','A','B','C♯'], A: ['A','B','C♯','D','E','F♯','G♯'], F: ['F','G','A','B♭','C','D','E'], 'B♭': ['B♭','C','D','E♭','F','G','A'] };
  var SIG = { C: 'tanpa kres/mol', G: '1 kres', D: '2 kres', A: '3 kres', F: '1 mol', 'B♭': '2 mol' };
  var Q = { 2: { 1: 'Minor', 2: 'Mayor' }, 3: { 3: 'Minor', 4: 'Mayor' }, 6: { 8: 'Minor', 9: 'Mayor' }, 7: { 10: 'Minor', 11: 'Mayor' } };
  var TR = [['C','mayor 3','E'],['D','perfect 5','A'],['G','perfect 4','C'],['E','minor 3','G'],['F','mayor 2','G'],['A','minor 3','C'],['C','perfect 5','G'],['D','mayor 3','F♯'],['G','mayor 3','B'],['F','perfect 5','C']];
  var NOTES = ['C','D','E','F','G','A','B','F♯','B♭','E♭'];
  var IV = [[3, 'minor 3rd'], [4, 'major 3rd'], [5, 'perfect 4th'], [7, 'perfect 5th']];

  return {
    reading: { total: 10, make: function () { return fresh(function () {
      var t = rnd(0, 5), keys = Object.keys(MAJ), k = keys[rnd(0, keys.length - 1)];
      if (t === 0) { var b = [6, 9, 12][rnd(0, 2)]; return { id: 'c' + b, html: big(b + '/8', 'Compound time'), opts: ['2', '3', '4'], ans: String(b / 3), prompt: 'Berapa ketukan besar (not seperempat bertitik) dalam satu birama?' }; }
      if (t === 1) { var n = rnd(2, 7); return { id: 'd' + k + n, html: big(k, 'Tangga nada mayor'), opts: opts4(MAJ[k][n - 1], MAJ[k].concat(NOTES)), ans: MAJ[k][n - 1], prompt: 'Nada ke-' + n + ' dalam tangga nada ini?' }; }
      if (t === 2) return { id: 'k' + k, html: big(SIG[k], 'Tanda kunci', 34), opts: opts4(k, keys), ans: k, prompt: 'Tangga nada mayor apa yang memakai tanda kunci ini?' };
      if (t === 3) { var m = [2, 3, 6, 7][rnd(0, 3)], d1 = rnd(28, 31), d2 = d1 + m - 1; return { id: 'q' + d1 + m, ds: [d1, d2], opts: ['Mayor', 'Minor'], ans: Q[m][semi(d2) - semi(d1)], prompt: 'Interval ke-' + m + ' ini mayor atau minor?' }; }
      if (t === 4) { var x = TR[rnd(0, TR.length - 1)]; return { id: 't' + x[0] + x[1], html: big(x[0] + ' → ?', 'Naik ' + x[1], 44), opts: opts4(x[2], NOTES), ans: x[2], prompt: 'Transposisi nada ini naik sejauh ' + x[1] + '. Hasilnya?' }; }
      var a = rnd(28, 33), c = a + rnd(1, 4), s = semi(c) - semi(a);
      return { id: 's' + a + c, html: big(L[a % 7] + ' → ' + L[c % 7], 'Chromatic scale', 44), opts: opts4(String(s), ['1','2','3','4','5','6','7']).sort(function (p, q) { return p - q; }), ans: String(s), prompt: 'Berapa semitone dari nada pertama ke nada kedua (naik)?' };
    }); } },
    listening: { total: 10, make: function () { return fresh(function () {
      var r = rnd(60, 67);
      if (Math.random() < .5) {
        var minor = Math.random() < .5, st = minor ? [0,2,3,5,7,8,10,12] : [0,2,4,5,7,9,11,12];
        return { id: 'ls' + r + minor, opts: ['Mayor', 'Minor'], ans: minor ? 'Minor' : 'Mayor', play: function () { st.forEach(function (x, i) { setTimeout(function () { midi(r + x); }, i * 380); }); }, prompt: 'Dengar tangga nada ini. Mayor atau minor?' };
      }
      var iv = IV[rnd(0, 3)];
      return { id: 'li' + r + iv[0], opts: IV.map(function (x) { return x[1][0].toUpperCase() + x[1].slice(1); }), ans: iv[1][0].toUpperCase() + iv[1].slice(1), play: function () { midi(r); setTimeout(function () { midi(r + iv[0]); }, 700); }, prompt: 'Dengar dua nada berurutan. Interval apa ini?' };
    }); } },
    speaking: { total: 5, make: function () { return fresh(function () {
      var d1 = [28, 29, 30, 31, 32][rnd(0, 4)], iv = IV[rnd(0, 3)], tgt = (SEMI[d1 % 7] + iv[0]) % 12;
      return { id: 'sp' + d1 + iv[0], d: d1, ds: [d1], tgt: tgt, ans: NAMES[tgt], play: function () { sound(d1); }, prompt: 'Mulai dari ' + L[d1 % 7] + '. Humming nada satu ' + iv[1] + ' di atasnya.' };
    }); } }
  };
};
