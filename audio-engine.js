/* TSW — audio engine (terpisah dari UI). API: TSWAudio.load/ready/play/playChord/playSequence/stop/setSource.
   Sumber default: soundfont "acoustic_grand_piano" (FluidR3_GM, format MIDI.js, gratis) dimuat lazy.
   Ganti sumber: TSWAudio.setSource({ url, instrument }) atau tulis adapter baru, tanpa menyentuh UI. */
(function () {
  'use strict';
  var src = { url: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/', instrument: 'acoustic_grand_piano' };
  var ctx = null, buffers = {}, state = 'idle', pending = null, live = [];
  var FLAT = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function ac() { if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; }
  function key(n) { var m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) return null; var k = m[1] + m[2]; return (FLAT[k] || k) + m[3]; }
  function midi(n) { var m = /^([A-G])([#b]?)(\d)$/.exec(n); return m ? 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null; }

  function load() {
    if (pending) return pending;
    var a = ac(); if (!a) return Promise.reject(new Error('WebAudio tidak didukung'));
    state = 'loading';
    pending = new Promise(function (res, rej) {
      window.MIDI = window.MIDI || {}; MIDI.Soundfont = MIDI.Soundfont || {};
      var s = document.createElement('script');
      s.src = src.url + src.instrument + '-mp3.js'; s.async = true;
      s.onerror = function () { state = 'error'; pending = null; rej(new Error('Soundfont gagal dimuat')); };
      s.onload = function () {
        var bank = MIDI.Soundfont[src.instrument], names = Object.keys(bank || {});
        Promise.all(names.map(function (n) {
          var b64 = bank[n].split(',')[1], bin = atob(b64), u = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          return new Promise(function (ok) { a.decodeAudioData(u.buffer, function (buf) { buffers[n] = buf; ok(); }, ok); });
        })).then(function () { state = 'ready'; res(); });
      };
      document.head.appendChild(s);
    });
    return pending;
  }

  /* Mengembalikan true bila dibunyikan dengan piano akustik; false bila belum siap (UI boleh pakai fallback). */
  function play(note, o) {
    o = o || {};
    if (state === 'idle') load().catch(function () {});
    if (state !== 'ready') return false;
    var a = ac(), buf = buffers[key(note)]; if (!buf) return false;
    var t = (o.when || 0) + a.currentTime, dur = o.dur || 2.2, vel = o.vel == null ? .8 : o.vel;
    var node = a.createBufferSource(), g = a.createGain();
    node.buffer = buf; g.gain.setValueAtTime(vel, t);
    g.gain.setTargetAtTime(0.0001, t + dur * .6, dur * .18);
    node.connect(g); g.connect(a.destination); node.start(t); node.stop(t + dur + .6);
    live.push({ n: node, g: g }); node.onended = function () { live = live.filter(function (x) { return x.n !== node; }); };
    return true;
  }
  function playChord(notes, o) { return notes.map(function (n) { return play(n, o); }).every(Boolean); }
  /* seq: [{ notes:['C4','E4'] | 'C4', at: detik, dur: detik }] */
  function playSequence(seq) {
    seq.forEach(function (s) { [].concat(s.notes).forEach(function (n) { play(n, { when: s.at || 0, dur: s.dur }); }); });
  }
  function stop() {
    if (!ctx) return; live.forEach(function (x) { try { x.g.gain.cancelScheduledValues(0); x.g.gain.setTargetAtTime(0.0001, ctx.currentTime, .05); x.n.stop(ctx.currentTime + .3); } catch (e) {} }); live = [];
  }
  function setSource(s) { src = Object.assign({}, src, s); buffers = {}; pending = null; state = 'idle'; }

  window.TSWAudio = { load: load, ready: function () { return state === 'ready'; }, status: function () { return state; }, play: play, playChord: playChord, playSequence: playSequence, stop: stop, setSource: setSource, midi: midi };
})();
