/* TSW — instruments.js
   Satu sistem audio terkoordinasi (Web Audio API):
   - Piano, gitar akustik/listrik, biola: sampel SoundFont FluidR3_GM (gleitz/midi-js-soundfonts), dimuat saat dibutuhkan.
     Bila sampel gagal dimuat, otomatis memakai suara sintetis (simulasi).
   - Drum: sintetis akustik; otomatis memakai rekaman asli bila ada di assets/audio/drums/{kick,snare,hihat,crash,ride,tom1,tom2,floor}.mp3
   - Mikrofon: pitch detection autocorrelation + MediaRecorder (lokal, tidak diunggah).
   Animasi: GSAP (drum, reveal), Anime.js (getar senar, bow, tab), Lottie (indikator rekam). Semua opsional/guarded. */
(function () {
    'use strict';
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const nm = m => NN[m % 12].replace('#', '♯') + (Math.floor(m / 12) - 1);
    const freq = m => 440 * Math.pow(2, (m - 69) / 12);
    const midiOf = n => { const m = /^([A-G])([#b]?)(-?\d+)$/.exec(n); return m ? ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12 * (+m[3] + 1) : NaN; };
    const say = t => { const e = $('#tsxStatus'); if (e) e.textContent = t; };
    const pop = sel => { if (!RM && window.anime) anime({ targets: sel, scale: [1.25, 1], duration: 260, easing: 'easeOutBack' }); };

    /* ───────── Audio core ───────── */
    let ctx, master, vol = 0.8;
    const active = new Set();
    function ac() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            master = ctx.createGain(); master.gain.value = vol;
            const comp = ctx.createDynamicsCompressor();
            master.connect(comp); comp.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }
    function mk(c, g, ...srcs) {
        const h = { stop(rel = 0.3) {
            if (h.done) return; h.done = 1; active.delete(h);
            const n = c.currentTime;
            g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(0, n + rel);
            srcs.forEach(s => { try { s.stop(n + rel + 0.03); } catch (e) {} });
        } };
        return h;
    }

    /* SoundFont loader (format file gleitz: {"A0":"data:audio/mp3;base64,..."}) */
    const BANK_URL = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/';
    const INST = { piano: 'acoustic_grand_piano', steel: 'acoustic_guitar_steel', clean: 'electric_guitar_clean', violin: 'violin' };
    const LABEL = { piano: 'piano', steel: 'gitar akustik', clean: 'gitar listrik', violin: 'biola' };
    const ready = {}, pending = {};
    function loadBank(inst) {
        const name = INST[inst];
        if (ready[name]) return Promise.resolve();
        if (pending[name]) return pending[name];
        say('Memuat sampel ' + LABEL[inst] + '…');
        return (pending[name] = fetch(BANK_URL + name + '-mp3.js')
            .then(r => { if (!r.ok) throw 0; return r.text(); })
            .then(txt => {
                const re = /"([A-G][b#]?-?\d+)"\s*:\s*"(data:audio[^"]+)"/g; let m; const l = [];
                while ((m = re.exec(txt))) l.push(m);
                if (!l.length) throw 0;
                return Promise.all(l.map(x => fetch(x[2]).then(r => r.arrayBuffer()).then(b => ac().decodeAudioData(b)).then(buf => ({ mi: midiOf(x[1]), buf }))));
            })
            .then(arr => { ready[name] = arr.sort((a, b) => a.mi - b.mi); say('Sampel ' + LABEL[inst] + ' siap (rekaman akustik SoundFont).'); })
            .catch(() => say('Sampel ' + LABEL[inst] + ' gagal dimuat. Memakai suara sintetis (simulasi).'))
            .finally(() => { delete pending[name]; }));
    }
    function sample(b, midi, o) {
        const c = ac(), t = c.currentTime; let s = b[0];
        for (const x of b) if (Math.abs(x.mi - midi) < Math.abs(s.mi - midi)) s = x;
        const src = c.createBufferSource(); src.buffer = s.buf; src.playbackRate.value = Math.pow(2, (midi - s.mi) / 12);
        if (o.loop) { src.loop = true; src.loopStart = s.buf.duration * 0.35; src.loopEnd = s.buf.duration * 0.9; }
        const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.vel, t + (o.loop ? 0.06 : 0.008));
        src.connect(g); g.connect(master); src.start(t);
        const h = mk(c, g, src); if (o.dur) setTimeout(() => h.stop(0.5), o.dur * 1000); return h;
    }
    function synth(inst, midi, o) {
        const c = ac(), t = c.currentTime, f = freq(midi), v = o.vel * 0.4, vi = inst === 'violin';
        const os = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
        os.type = vi ? 'sawtooth' : 'triangle'; os.frequency.value = f;
        lp.type = 'lowpass'; lp.frequency.value = f * (vi ? 4 : 6);
        os.connect(lp); lp.connect(g); g.connect(master);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + (vi ? 0.08 : 0.01));
        if (!o.hold) g.gain.exponentialRampToValueAtTime(0.0001, t + (o.dur || 2)); else if (!vi) g.gain.exponentialRampToValueAtTime(v * 0.3, t + 2.5);
        os.start(t); const h = mk(c, g, os); if (o.dur && o.hold) setTimeout(() => h.stop(0.4), o.dur * 1000); return h;
    }
    function note(inst, midi, o = {}) {
        o = Object.assign({ vel: 0.8 }, o); if (o.loop) o.hold = true; if (!o.hold && !o.dur) o.dur = 4;
        const b = ready[INST[inst]]; if (!b) loadBank(inst);
        const h = b ? sample(b, midi, o) : synth(inst, midi, o); active.add(h); return h;
    }

    /* Drum: sintetis akustik, atau rekaman lokal bila tersedia */
    const dbuf = {}; let dTried = false;
    function tryDrums() {
        if (dTried) return; dTried = true;
        ['kick', 'snare', 'hihat', 'crash', 'ride', 'tom1', 'tom2', 'floor'].forEach(n =>
            fetch('assets/audio/drums/' + n + '.mp3').then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(a => ac().decodeAudioData(a)).then(b => { dbuf[n] = b; }).catch(() => {}));
    }
    function tone(c, t, f0, f1, v, d, type) {
        const o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine';
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d * 0.8);
        g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
    }
    function nz(c, t, type, f, v, d, q) {
        const b = c.createBuffer(1, Math.max(1, c.sampleRate * d), c.sampleRate), a = b.getChannelData(0);
        for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
        const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
        s.buffer = b; fl.type = type; fl.frequency.value = f; if (q) fl.Q.value = q;
        g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        s.connect(fl); fl.connect(g); g.connect(master); s.start(t);
    }
    function drumSound(type) {
        const c = ac(), t = c.currentTime;
        if (dbuf[type]) { const s = c.createBufferSource(); s.buffer = dbuf[type]; s.connect(master); s.start(t); return; }
        switch (type) {
            case 'kick': tone(c, t, 150, 45, 1, 0.55); nz(c, t, 'lowpass', 400, 0.25, 0.04); break;
            case 'snare': tone(c, t, 210, 150, 0.5, 0.18, 'triangle'); nz(c, t, 'highpass', 1800, 0.6, 0.22); break;
            case 'hihat': nz(c, t, 'highpass', 7500, 0.35, 0.07); break;
            case 'crash': nz(c, t, 'highpass', 4500, 0.5, 1.6); break;
            case 'ride': nz(c, t, 'bandpass', 5200, 0.35, 0.9, 3); break;
            case 'tom1': tone(c, t, 270, 170, 0.8, 0.35); nz(c, t, 'bandpass', 900, 0.12, 0.05); break;
            case 'tom2': tone(c, t, 200, 125, 0.8, 0.4); nz(c, t, 'bandpass', 700, 0.12, 0.05); break;
            default: tone(c, t, 125, 80, 0.85, 0.5); nz(c, t, 'bandpass', 500, 0.12, 0.05);
        }
    }

    /* ───────── Tab & kontrol global ───────── */
    let cur = 'piano', mode = 'steel', patTimer = null, bowAnim = null;
    function stopAll() {
        active.forEach(h => h.stop(0.1)); active.clear();
        if (patTimer) { clearInterval(patTimer); patTimer = null; const b = $('#drPattern'); if (b) b.textContent = 'Putar pola rock dasar'; }
        if (bowAnim) { bowAnim.pause(); bowAnim = null; }
        $$('.pk-w.on,.pk-b.on').forEach(k => k.classList.remove('on'));
    }
    function show(t) {
        stopAll(); cur = t; if (t !== 'mic') { micOff(); const au = $('#micPlay'); if (au) au.pause(); }
        $$('.tsx-tab').forEach(b => { const on = b.dataset.tab === t; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
        $$('.tsx-panel').forEach(p => {
            const on = p.id === 'tsx-' + t; p.classList.toggle('active', on);
            if (on && !RM && window.anime) anime({ targets: p, opacity: [0, 1], translateY: [14, 0], duration: 380, easing: 'easeOutQuad' });
        });
        if (t === 'piano') loadBank('piano'); else if (t === 'guitar') loadBank(mode); else if (t === 'violin') loadBank('violin'); else if (t === 'drum') tryDrums();
    }

    /* ───────── PIANO ───────── */
    const held = {};
    const KEYS = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71 };
    function pDown(m) {
        if (held[m]) return; const b = $('#tsxPiano [data-m="' + m + '"]'); if (!b) return;
        b.classList.add('on'); held[m] = note('piano', m, { hold: true, vel: 0.85 });
        $('#pnNote').textContent = nm(m); pop('#pnNote');
    }
    function pUp(m) { const b = $('#tsxPiano [data-m="' + m + '"]'); if (b) b.classList.remove('on'); if (held[m]) { held[m].stop(0.4); delete held[m]; } }
    function lit(ms, ts) { ms.forEach(m => { const b = $('#tsxPiano [data-m="' + m + '"]'); if (b) { b.classList.add('on'); setTimeout(() => b.classList.remove('on'), ts); } }); }
    function buildPiano() {
        const el = $('#tsxPiano'); if (!el) return;
        const w = 100 / 14; let wi = 0, h = '';
        for (let o = 3; o <= 4; o++) NN.forEach((n, i) => {
            const m = 12 * (o + 1) + i;
            if (n.includes('#')) h += '<button type="button" class="pk-b" style="left:' + (wi * w - w * 0.3) + '%;width:' + (w * 0.6) + '%" data-m="' + m + '" aria-label="' + nm(m) + '"></button>';
            else { h += '<button type="button" class="pk-w" data-m="' + m + '" aria-label="' + nm(m) + '"><span>' + (n === 'C' ? nm(m) : '') + '</span></button>'; wi++; }
        });
        el.innerHTML = h;
        $$('button', el).forEach(b => {
            const m = +b.dataset.m;
            b.addEventListener('pointerdown', e => { e.preventDefault(); pDown(m); });
            ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => pUp(m)));
        });
        const CH = { 'C mayor': [60, 64, 67], 'G mayor': [55, 59, 62], 'A minor': [57, 60, 64], 'F mayor': [53, 57, 60] };
        const row = $('#pnChords');
        Object.keys(CH).forEach(k => {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'tsx-btn'; b.textContent = k;
            b.onclick = () => { CH[k].forEach(m => note('piano', m, { dur: 2.5, vel: 0.7 })); lit(CH[k], 1200); $('#pnNote').textContent = k; pop('#pnNote'); };
            row.appendChild(b);
        });
        const sc = document.createElement('button'); sc.type = 'button'; sc.className = 'tsx-btn'; sc.textContent = 'Tangga nada C';
        sc.onclick = () => [60, 62, 64, 65, 67, 69, 71, 72].forEach((m, i) => setTimeout(() => { note('piano', m, { dur: 1.2 }); lit([m], 250); $('#pnNote').textContent = nm(m); }, i * 300));
        row.appendChild(sc);
    }

    /* ───────── GITAR ───────── */
    const OPEN = [40, 45, 50, 55, 59, 64], NUT = 360, FL = 1040;
    const fx = n => NUT + FL * (1 - Math.pow(2, -n / 12)), gy = s => 160 - s * 12;
    const GCH = { C: [-1, 3, 2, 0, 1, 0], G: [3, 2, 0, 0, 0, 3], Am: [-1, 0, 2, 2, 1, 0], Em: [0, 2, 2, 0, 0, 0], D: [-1, -1, 0, 2, 3, 2], F: [1, 3, 3, 2, 1, 1] };
    let chord = null;
    function vib(s) {
        if (RM || !window.anime) return;
        anime({ targets: '#gl' + s, translateY: [{ value: -3, duration: 35 }, { value: 3, duration: 70 }, { value: -2, duration: 70 }, { value: 1, duration: 70 }, { value: 0, duration: 70 }], easing: 'linear' });
    }
    function pluck(s, f, vel) {
        if (f < 0) return; const m = OPEN[s] + f;
        note(mode, m, { dur: mode === 'steel' ? 3.5 : 3, vel: vel || 0.8 }); vib(s);
        $('#gtNote').textContent = nm(m); pop('#gtNote');
    }
    function strum(dir) {
        if (!chord) chord = 'C', markChord();
        const c = GCH[chord], order = [0, 1, 2, 3, 4, 5]; if (dir < 0) order.reverse();
        let i = 0; order.forEach(s => { if (c[s] >= 0) setTimeout(() => pluck(s, c[s], 0.7), i++ * 38); });
    }
    function markChord() {
        $$('#gtChords button').forEach(b => b.classList.toggle('rec', b.dataset.ch === chord));
        const g = $('#gDots'); let h = ''; const c = chord && GCH[chord];
        if (c) c.forEach((f, s) => {
            const y = gy(s);
            if (f > 0) h += '<circle cx="' + ((fx(f - 1) + fx(f)) / 2) + '" cy="' + y + '" r="5.5" fill="#D2B16F" stroke="#1A3055" stroke-width="1.5"/>';
            else if (f === 0) h += '<circle cx="' + (NUT - 14) + '" cy="' + y + '" r="4" fill="none" stroke="#D2B16F" stroke-width="2"/>';
            else h += '<text x="' + (NUT - 18) + '" y="' + (y + 4) + '" fill="#DCCDB8" font-size="12">×</text>';
        });
        g.innerHTML = h;
    }
    function buildGuitar() {
        const el = $('#tsxGuitar'); if (!el) return;
        let h = '<svg class="tsx-svg" id="gSvg" viewBox="0 0 940 260" role="group" aria-label="Gitar virtual"><defs>' +
            '<linearGradient id="gw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9A066"/><stop offset="1" stop-color="#8A5A30"/></linearGradient>' +
            '<linearGradient id="ge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#CFA090"/><stop offset="1" stop-color="#7A4B43"/></linearGradient></defs>' +
            '<g id="gAc"><path d="M18 130C18 38 150 18 205 70C232 94 262 60 300 62C346 64 360 100 360 130C360 160 346 196 300 198C262 200 232 166 205 190C150 242 18 222 18 130Z" fill="url(#gw)" stroke="#5A3A1E" stroke-width="3"/>' +
            '<circle cx="245" cy="130" r="31" fill="none" stroke="#D2B16F" stroke-width="2"/><circle cx="245" cy="130" r="26" fill="#1A1208"/><rect x="104" y="98" width="16" height="64" rx="3" fill="#2A1C12"/></g>' +
            '<g id="gEl" style="display:none"><path d="M30 130C30 60 120 40 190 70C225 40 300 28 345 62L362 100L362 160L345 198C300 232 225 220 190 190C120 220 30 200 30 130Z" fill="url(#ge)" stroke="#4A2B25" stroke-width="3"/>' +
            '<rect x="160" y="98" width="12" height="64" rx="2" fill="#111" stroke="#D2B16F"/><rect x="250" y="98" width="12" height="64" rx="2" fill="#111" stroke="#D2B16F"/><rect x="104" y="98" width="16" height="64" rx="3" fill="#CFCFCF"/>' +
            '<circle cx="150" cy="200" r="9" fill="#111" stroke="#D2B16F"/><circle cx="185" cy="206" r="9" fill="#111" stroke="#D2B16F"/></g>' +
            '<rect x="345" y="96" width="555" height="68" fill="#3B2A20"/><rect x="900" y="92" width="34" height="76" rx="6" fill="#2A1C12"/><rect x="357" y="94" width="5" height="72" fill="#F5F0E6"/>';
        for (let n = 1; n <= 12; n++) h += '<line x1="' + fx(n) + '" x2="' + fx(n) + '" y1="96" y2="164" stroke="#D2B16F" stroke-opacity=".7" stroke-width="2"/>';
        [3, 5, 7, 9].forEach(n => { h += '<circle cx="' + ((fx(n - 1) + fx(n)) / 2) + '" cy="130" r="4" fill="#F5F0E6" opacity=".6"/>'; });
        for (let s = 0; s < 6; s++) h += '<line id="gl' + s + '" x1="112" x2="900" y1="' + gy(s) + '" y2="' + gy(s) + '" stroke="#DCCDB8" stroke-width="' + (3 - s * 0.4) + '"/>';
        h += '<g id="gDots" pointer-events="none"></g>';
        for (let s = 0; s < 6; s++) {
            h += '<rect class="gs" data-s="' + s + '" x="112" y="' + (gy(s) - 6) + '" width="248" height="12" fill="transparent"/>';
            for (let f = 1; f <= 12; f++) h += '<rect class="gf" data-s="' + s + '" data-f="' + f + '" x="' + fx(f - 1) + '" y="' + (gy(s) - 6) + '" width="' + (fx(f) - fx(f - 1)) + '" height="12"/>';
        }
        el.innerHTML = h + '</svg>';
        const svg = $('#gSvg'); let drag = false, last = null;
        const fretFor = s => chord ? GCH[chord][s] : 0;
        function hitAt(e) {
            const t = document.elementFromPoint(e.clientX, e.clientY);
            if (t && t.classList.contains('gs') && t !== last) { last = t; const s = +t.dataset.s; pluck(s, fretFor(s)); }
        }
        svg.addEventListener('pointerdown', e => {
            const t = e.target;
            if (t.classList.contains('gf')) { pluck(+t.dataset.s, +t.dataset.f); return; }
            drag = true; last = null; hitAt(e);
        });
        svg.addEventListener('pointermove', e => { if (drag) hitAt(e); });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => svg.addEventListener(ev, () => { drag = false; last = null; }));
        const row = $('#gtChords');
        Object.keys(GCH).forEach(k => {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'tsx-btn'; b.textContent = k; b.dataset.ch = k;
            b.onclick = () => { chord = chord === k ? null : k; markChord(); if (chord) strum(1); };
            row.appendChild(b);
        });
        $('#gtDown').onclick = () => strum(1); $('#gtUp').onclick = () => strum(-1);
        $$('[data-gmode]').forEach(b => b.onclick = () => {
            mode = b.dataset.gmode; stopAll();
            $$('[data-gmode]').forEach(x => x.classList.toggle('on', x === b));
            $('#gAc').style.display = mode === 'steel' ? '' : 'none'; $('#gEl').style.display = mode === 'steel' ? 'none' : '';
            loadBank(mode);
        });
    }

    /* ───────── BIOLA ───────── */
    const VO = [55, 62, 69, 76], VX = [130, 165, 200, 235];
    function buildViolin() {
        const el = $('#tsxViolin'); if (!el) return;
        let h = '<svg class="tsx-svg" id="vSvg" viewBox="0 0 360 580" role="group" aria-label="Biola virtual">' +
            '<defs><linearGradient id="vw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C98B52"/><stop offset="1" stop-color="#6E3F1D"/></linearGradient></defs>' +
            '<circle cx="180" cy="22" r="15" fill="#6E3F1D"/><rect x="105" y="36" width="150" height="304" rx="6" fill="#1B1410"/>' +
            '<path d="M110 330C80 335 78 385 112 405C95 420 85 450 85 485C85 530 130 548 180 548C230 548 275 530 275 485C275 450 265 420 248 405C282 385 280 335 250 330C220 322 140 322 110 330Z" fill="url(#vw)" stroke="#4A2B12" stroke-width="3"/>' +
            '<path d="M132 380C126 400 128 425 136 440M228 380C234 400 232 425 224 440" stroke="#1A1208" stroke-width="5" fill="none" stroke-linecap="round"/>' +
            '<rect x="120" y="430" width="120" height="7" rx="2" fill="#F5F0E6"/><path d="M160 470H200L196 520H164Z" fill="#1B1410"/>';
        for (let k = 1; k <= 11; k++) h += '<line x1="108" x2="252" y1="' + (60 + (k - 1) * 25) + '" y2="' + (60 + (k - 1) * 25) + '" stroke="#D2B16F" stroke-opacity=".22"/>';
        VX.forEach((x, i) => { h += '<line id="vs' + i + '" x1="' + x + '" x2="' + x + '" y1="36" y2="470" stroke="#DCCDB8" stroke-width="' + (2.6 - i * 0.4) + '"/><text x="' + x + '" y="566" text-anchor="middle" fill="#D2B16F" font-size="13">' + 'GDAE'[i] + '</text>'; });
        h += '<g id="vBow"><rect x="60" y="384" width="240" height="5" rx="2" fill="#8A5A30"/><rect x="60" y="390" width="240" height="3" fill="#F5F0E6" opacity=".9"/><rect x="52" y="381" width="14" height="14" rx="3" fill="#2A1C12"/></g>' +
            '<rect class="vhit" id="vHit" x="100" y="36" width="160" height="304" fill="transparent"/></svg>';
        el.innerHTML = h;
        const svg = $('#vSvg'); let vc = null, vp = null;
        function pos(e) {
            const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 360, y = (e.clientY - r.top) / r.height * 580;
            return { s: Math.min(3, Math.max(0, Math.round((x - 130) / 35))), st: y < 60 ? 0 : Math.min(11, Math.floor((y - 60) / 25) + 1) };
        }
        function bowOn(p) {
            if (vc) vc.stop(0.08);
            vc = note('violin', VO[p.s] + p.st, { loop: true, vel: 0.7 }); vp = p;
            $('#vnNote').textContent = nm(VO[p.s] + p.st);
            $$('#vSvg [id^=vs]').forEach((l, i) => l.setAttribute('stroke', i === p.s ? '#D2B16F' : '#DCCDB8'));
            if (!bowAnim && !RM && window.anime) bowAnim = anime({ targets: '#vBow', translateY: [-12, 12], direction: 'alternate', loop: true, duration: 600, easing: 'easeInOutSine' });
        }
        function bowOff() {
            if (vc) { vc.stop(0.3); vc = null; vp = null; }
            if (bowAnim) { bowAnim.pause(); bowAnim = null; if (window.anime) anime({ targets: '#vBow', translateY: 0, duration: 200, easing: 'easeOutQuad' }); }
            $$('#vSvg [id^=vs]').forEach(l => l.setAttribute('stroke', '#DCCDB8'));
        }
        $('#vHit').addEventListener('pointerdown', e => { e.preventDefault(); $('#vHit').setPointerCapture(e.pointerId); bowOn(pos(e)); });
        $('#vHit').addEventListener('pointermove', e => { if (!vc) return; const p = pos(e); if (p.s !== vp.s || p.st !== vp.st) bowOn(p); });
        ['pointerup', 'pointercancel'].forEach(ev => $('#vHit').addEventListener(ev, bowOff));
    }

    /* ───────── DRUM ───────── */
    function buildDrum() {
        const el = $('#tsxDrum'); if (!el) return;
        const drum = (id, lab, key, cx, cy, rx, ry, hh, shell) =>
            '<g class="dr" data-d="' + id + '" tabindex="0" role="button" aria-label="' + lab + ' (tombol ' + key.toUpperCase() + ')">' +
            '<rect x="' + (cx - rx) + '" y="' + cy + '" width="' + (rx * 2) + '" height="' + hh + '" fill="' + shell + '"/>' +
            '<ellipse cx="' + cx + '" cy="' + (cy + hh) + '" rx="' + rx + '" ry="' + ry + '" fill="' + shell + '"/>' +
            '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#F5F0E6" stroke="#C9C2B4" stroke-width="5"/>' +
            '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" fill="#6E6B66" font-size="14" font-weight="700">' + key.toUpperCase() + '</text></g>';
        const cym = (id, lab, key, cx, cy, rx, ry, rot) =>
            '<g class="dr" data-d="' + id + '" tabindex="0" role="button" aria-label="' + lab + ' (tombol ' + key.toUpperCase() + ')">' +
            '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="url(#dc)" stroke="#9A7B3A" transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"/>' +
            '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" fill="#4A3A15" font-size="13" font-weight="700">' + key.toUpperCase() + '</text></g>';
        el.innerHTML = '<svg class="tsx-svg" viewBox="0 0 900 540" role="group" aria-label="Drum kit virtual"><defs><radialGradient id="dc"><stop offset="0" stop-color="#F6E2A6"/><stop offset="1" stop-color="#B98F3E"/></radialGradient></defs>' +
            '<g stroke="#8FA0B5" stroke-width="4"><path d="M215 134V520M110 276V520M700 165V520M265 410V520M690 440V520M630 440L612 520M750 440L768 520"/></g>' +
            '<g class="dr" data-d="kick" tabindex="0" role="button" aria-label="Kick (tombol A)"><circle cx="450" cy="375" r="118" fill="#1A3055" stroke="#C9C2B4" stroke-width="10"/><circle cx="450" cy="375" r="92" fill="#263F68" stroke="#D2B16F" stroke-width="2"/><text x="450" y="383" text-anchor="middle" fill="#D2B16F" font-size="26" font-family="Georgia,serif" letter-spacing="4">TSW</text><text x="450" y="420" text-anchor="middle" fill="#DCCDB8" font-size="14" font-weight="700">A</text></g>' +
            cym('crash', 'Crash', 'q', 215, 120, 95, 14, -8) + cym('hihat', 'Hi-hat', 'w', 110, 265, 70, 11, 0) + cym('ride', 'Ride', 'e', 700, 150, 105, 15, 6) +
            drum('tom1', 'Tom 1', 'r', 390, 215, 58, 20, 55, '#B98778') + drum('tom2', 'Tom 2', 'd', 520, 215, 58, 20, 55, '#B98778') +
            drum('snare', 'Snare', 's', 265, 340, 70, 24, 60, '#CFCFCF') + drum('floor', 'Floor tom', 'f', 690, 345, 75, 26, 90, '#B98778') + '</svg>';
        const KEYMAP = { q: 'crash', w: 'hihat', e: 'ride', r: 'tom1', a: 'kick', s: 'snare', d: 'tom2', f: 'floor' };
        const NAMES = { kick: 'Kick', snare: 'Snare', hihat: 'Hi-hat', crash: 'Crash', ride: 'Ride', tom1: 'Tom 1', tom2: 'Tom 2', floor: 'Floor tom' };
        function hit(id) {
            const g = $('#tsxDrum [data-d="' + id + '"]'); drumSound(id);
            $('#drNote').textContent = NAMES[id];
            if (!g || RM || !window.gsap) return;
            const cymb = id === 'crash' || id === 'ride' || id === 'hihat';
            gsap.killTweensOf(g);
            if (cymb) gsap.fromTo(g, { rotation: id === 'ride' ? 5 : -5 }, { rotation: 0, duration: 1.1, ease: 'elastic.out(1,.25)' });
            else gsap.fromTo(g, { scale: id === 'kick' ? 0.93 : 0.95 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,.4)' });
        }
        $$('.dr', el).forEach(g => {
            g.addEventListener('pointerdown', e => { e.preventDefault(); hit(g.dataset.d); });
            g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(g.dataset.d); } });
        });
        document.addEventListener('keydown', e => { if (cur !== 'drum' || e.repeat || e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey) return; const d = KEYMAP[e.key.toLowerCase()]; if (d) hit(d); });
        $('#drPattern').onclick = function () {
            if (patTimer) { clearInterval(patTimer); patTimer = null; this.textContent = 'Putar pola rock dasar'; return; }
            let i = 0; this.textContent = 'Hentikan pola';
            patTimer = setInterval(() => { hit('hihat'); if (i % 4 === 0) hit('kick'); if (i % 4 === 2) hit('snare'); i = (i + 1) % 8; }, 300);
        };
    }

    /* ───────── MIKROFON ───────── */
    let stream = null, an = null, raf = 0, rec = null, chunks = [], recUrl = null, lot = null, fr = 0;
    const PULSE = { v: '5.7.0', fr: 30, ip: 0, op: 60, w: 100, h: 100, nm: 'rec', ddd: 0, assets: [], layers: [{ ddd: 0, ind: 1, ty: 4, nm: 'ring', sr: 1, ks: { o: { a: 1, k: [{ t: 0, s: [100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } }, { t: 60, s: [0] }] }, r: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 1, k: [{ t: 0, s: [40, 40, 100], i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] } }, { t: 60, s: [100, 100, 100] }] } }, ao: 0, shapes: [{ ty: 'gr', it: [{ ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [60, 60] } }, { ty: 'st', c: { a: 0, k: [0.85, 0.53, 0.47, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 4 } }, { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }], ip: 0, op: 60, st: 0, bm: 0 }] };
    function detect(buf, sr) {
        let rms = 0; for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
        if (Math.sqrt(rms / buf.length) < 0.01) return -1;
        const min = Math.floor(sr / 1000), max = Math.floor(sr / 70), c = [];
        let mx = 0;
        for (let lag = min; lag <= max; lag++) { let s = 0; for (let i = 0; i < buf.length - lag; i++) s += buf[i] * buf[i + lag]; c.push(s); if (s > mx) mx = s; }
        for (let i = 1; i < c.length - 1; i++) if (c[i] > c[i - 1] && c[i] >= c[i + 1] && c[i] >= 0.85 * mx) return sr / (min + i);
        return -1;
    }
    let pan = null, pSrc = null, playing = false;
    const stage = (cls, on) => { const s = $('#micStage'); if (s) s.classList.toggle(cls, on); };
    function micLoop() {
        const a = an || (playing ? pan : null), cv = $('#micWave'), g = cv.getContext('2d'), st = $('#micStage');
        if (!a) { raf = 0; g.clearRect(0, 0, cv.width, cv.height); st.style.setProperty('--lv', 0); return; }
        const buf = new Float32Array(a.fftSize); a.getFloatTimeDomainData(buf);
        let rms = 0; for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
        st.style.setProperty('--lv', Math.min(1, Math.sqrt(rms / buf.length) * 6).toFixed(2));
        g.clearRect(0, 0, cv.width, cv.height); g.beginPath(); g.strokeStyle = an ? '#D2B16F' : '#CFA090'; g.lineWidth = 2;
        for (let i = 0; i < cv.width; i++) { const y = cv.height / 2 + buf[Math.floor(i / cv.width * buf.length)] * cv.height * 0.45; i ? g.lineTo(i, y) : g.moveTo(i, y); }
        g.stroke();
        if (an && ++fr % 3 === 0) {
            const f = detect(buf, ctx.sampleRate);
            if (f > 0) {
                const mf = 69 + 12 * Math.log2(f / 440), m = Math.round(mf), ct = Math.round((mf - m) * 100);
                $('#micNote').textContent = nm(m); $('#micMeter').style.left = (50 + ct / 2) + '%';
                say(f.toFixed(1) + ' Hz · ' + (ct > 0 ? '+' : '') + ct + ' sen');
            }
        }
        raf = requestAnimationFrame(micLoop);
    }
    function startViz() { if (!raf) micLoop(); }
    function micOff() {
        cancelAnimationFrame(raf); raf = 0;
        if (rec && rec.state === 'recording') rec.stop();
        if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
        an = null; stage('live', false); stage('rec', false);
        if (playing) startViz();
        const on = $('#micOn'); if (on) { on.textContent = 'Aktifkan mikrofon'; $('#micRec').disabled = true; $('#micStop').disabled = true; }
    }
    function buildMic() {
        if (!$('#micOn')) return;
        $('#micOn').onclick = async () => {
            if (stream) { micOff(); return; }
            try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } }); }
            catch (e) { say('Mikrofon tidak bisa diakses. Izinkan akses mikrofon di browser, lalu coba lagi.'); return; }
            const c = ac(); an = c.createAnalyser(); an.fftSize = 2048; c.createMediaStreamSource(stream).connect(an);
            $('#micOn').textContent = 'Matikan mikrofon'; $('#micRec').disabled = false; stage('live', true); startViz();
        };
        $('#micRec').onclick = () => {
            if (!stream || typeof MediaRecorder === 'undefined') { say('Perekaman tidak didukung browser ini.'); return; }
            chunks = []; rec = new MediaRecorder(stream);
            rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
            rec.onstop = () => {
                if (recUrl) URL.revokeObjectURL(recUrl);
                recUrl = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
                const a = $('#micPlay'); a.src = recUrl; a.hidden = false; $('#micClear').disabled = false;
                $('#micRec').classList.remove('rec'); stage('rec', false); $('#micStop').disabled = true; if (lot) lot.pause(); $('#micLot').classList.remove('on');
                say('Rekaman siap. Tekan putar untuk mendengarnya.');
            };
            rec.start(); stage('rec', true); $('#micRec').classList.add('rec'); $('#micStop').disabled = false; say('Merekam…');
            const L = $('#micLot'); L.classList.add('on');
            if (window.lottie && !RM) { try { if (!lot) lot = lottie.loadAnimation({ container: L, renderer: 'svg', loop: true, autoplay: false, animationData: PULSE }); lot.play(); } catch (e) {} }
        };
        const au = $('#micPlay');
        au.addEventListener('play', () => {
            const c = ac();
            if (!pSrc) { pSrc = c.createMediaElementSource(au); pan = c.createAnalyser(); pan.fftSize = 2048; pSrc.connect(pan); pan.connect(master); }
            playing = true; stage('play', true); startViz();
        });
        ['pause', 'ended'].forEach(ev => au.addEventListener(ev, () => { playing = false; stage('play', false); }));
        $('#micStop').onclick = () => { if (rec && rec.state === 'recording') rec.stop(); };
        $('#micClear').onclick = () => {
            if (recUrl) URL.revokeObjectURL(recUrl); recUrl = null;
            const a = $('#micPlay'); a.pause(); a.removeAttribute('src'); a.hidden = true; $('#micClear').disabled = true; say('Rekaman dihapus.');
        };
    }

    /* ───────── Hero piano mini (menggantikan handler lama) ───────── */
    function heroPiano() {
        $$('#heroPiano button').forEach(b => b.addEventListener('pointerdown', e => {
            e.preventDefault(); const m = Math.round(69 + 12 * Math.log2(+b.dataset.freq / 440));
            note('piano', m, { dur: 2 }); b.classList.add('active'); setTimeout(() => b.classList.remove('active'), 300);
            const r = $('#noteReadout'); if (r) r.textContent = b.dataset.note;
        }));
    }

    /* ───────── Init ───────── */
    buildPiano(); buildGuitar(); buildViolin(); buildDrum(); buildMic(); heroPiano();
    $$('.tsx-tab').forEach(b => b.addEventListener('click', () => show(b.dataset.tab)));
    $('#tsxVol').addEventListener('input', e => { vol = +e.target.value; if (master) master.gain.value = vol; });
    $('#tsxStop').addEventListener('click', stopAll);
    document.addEventListener('keydown', e => {
        if (cur !== 'piano' || e.repeat || e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey) return;
        const m = KEYS[e.key.toLowerCase()]; if (m) pDown(m);
    });
    document.addEventListener('keyup', e => { if (cur !== 'piano') return; const m = KEYS[e.key.toLowerCase()]; if (m) pUp(m); });
    const sec = $('#instruments');
    if (sec && 'IntersectionObserver' in window) {
        new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { loadBank('piano'); o.disconnect(); } }, { rootMargin: '200px' }).observe(sec);
    }
    if (window.gsap && window.ScrollTrigger && !RM) {
        gsap.registerPlugin(ScrollTrigger);
        gsap.from('.tsx .tsx-tabs, .tsx .tsx-panel.active', { opacity: 0, y: 30, duration: 0.7, stagger: 0.12, scrollTrigger: { trigger: '#instruments', start: 'top 80%' } });
    }
    window.TSWInstruments = { note, drumSound, ac, stopAll, loadBank };
    /* Gabung ke API audio bersama; jangan menimpa play/playChord/stop dari audio-engine.js. */
    window.TSWAudio = Object.assign(window.TSWAudio || {}, { note, drumSound, ac });
})();
