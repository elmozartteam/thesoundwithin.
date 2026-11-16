/* THE SOUND WITHIN — sistem animasi halaman utama.
   Library (semua gratis): GSAP + ScrollTrigger (animasi & scroll), Lenis (smooth scroll, MIT).
   Modular: tiap bagian = satu fungsi, bisa dipakai ulang di halaman level nanti.
   Bila library gagal dimuat atau pengguna memilih reduced-motion, halaman tetap utuh dan bisa dipakai. */
(function () {
    'use strict';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasGsap = typeof window.gsap !== 'undefined';
    var hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
    var lenis = null;

    /* ───────── 1. Piano mini: hover, tekan, dan bunyi ───────── */
    function initPiano() {
        var keys = document.querySelectorAll('.h-key-w, .h-key-b');
        var readout = document.getElementById('noteReadout');
        if (!keys.length) return;

        var ctx = null;
        function audio() {
            if (!ctx) {
                var AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return null;
                ctx = new AC();
            }
            if (ctx.state === 'suspended') ctx.resume();
            return ctx;
        }

        function tone(freq) {
            var a = audio();
            if (!a) return;
            var t = a.currentTime;
            var master = a.createGain();
            master.gain.setValueAtTime(0.0001, t);
            master.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
            master.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
            master.connect(a.destination);
            [[1, 1], [2, 0.22], [3, 0.08]].forEach(function (p) {
                var o = a.createOscillator();
                var g = a.createGain();
                o.type = 'sine';
                o.frequency.value = freq * p[0];
                g.gain.value = p[1];
                o.connect(g); g.connect(master);
                o.start(t); o.stop(t + 1.6);
            });
        }

        function press(key) {
            if (key.classList.contains('is-down')) return;
            key.classList.add('is-down');
            if (hasGsap && !reduce) {
                gsap.to(key, { y: key.classList.contains('h-key-b') ? 4 : 5, scaleY: 0.985, duration: 0.07, ease: 'power2.out', overwrite: 'auto' });
            }
            var freq = parseFloat(key.getAttribute('data-freq'));
            if (!(window.TSWAudio && TSWAudio.play(key.getAttribute('data-note')))) { if (freq) tone(freq); }
            if (readout) readout.textContent = key.getAttribute('data-note') + '  ·  ' + Math.round(freq) + ' Hz';
        }

        function release(key) {
            if (!key.classList.contains('is-down')) return;
            key.classList.remove('is-down');
            if (hasGsap && !reduce) {
                gsap.to(key, { y: 0, scaleY: 1, duration: 0.35, ease: 'elastic.out(1, 0.6)', overwrite: 'auto' });
            }
        }

        keys.forEach(function (key) {
            key.addEventListener('pointerenter', function () { if (window.TSWAudio && TSWAudio.status() === 'idle') TSWAudio.load().catch(function () {}); }, { once: true });
            key.addEventListener('pointerdown', function (e) { e.preventDefault(); press(key); });
            ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(function (ev) {
                key.addEventListener(ev, function () { release(key); });
            });
            key.addEventListener('keydown', function (e) {
                if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); press(key); }
            });
            key.addEventListener('keyup', function (e) {
                if (e.key === 'Enter' || e.key === ' ') release(key);
            });
        });
    }

    /* ───────── 2. Smooth scroll (Lenis) yang disinkronkan dengan ScrollTrigger ───────── */
    function initSmoothScroll() {
        if (reduce || typeof window.Lenis === 'undefined') return;
        lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, anchors: { offset: -70 } });

        if (hasST) {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0);
        } else {
            (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
        }

        /* Saat gate nama terbuka, scroll dikunci supaya tidak bentrok dengan overflow:hidden */
        function syncGate() {
            if (document.body.classList.contains('name-gate-open')) lenis.stop(); else lenis.start();
        }
        new MutationObserver(syncGate).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        syncGate();
    }

    /* ───────── 3. Animasi masuk hero ───────── */
    function introHero() {
        if (!hasGsap || reduce) return;
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.from('.h-orn-line', { strokeDashoffset: 1, duration: 1.8, stagger: 0.12, ease: 'power2.inOut' }, 0)
          .from('.h-eyebrow', { opacity: 0, y: 14, duration: 0.7 }, 0.1)
          .from('.h-title .h-line > span', { yPercent: 115, duration: 1.1, stagger: 0.12 }, 0.2)
          .from(['.h-tagline', '.h-copy', '.h-actions', '.h-kicker'], { opacity: 0, y: 22, duration: 0.8, stagger: 0.1 }, 0.7)
          .from('.h-inst-meta', { opacity: 0, duration: 0.7 }, 0.6)
          .from('.h-key-w', { opacity: 0, y: 36, duration: 0.7, stagger: 0.05, clearProps: 'transform,opacity' }, 0.75)
          .from('.h-key-b', { opacity: 0, y: -18, duration: 0.6, stagger: 0.06, clearProps: 'transform,opacity' }, 1.1)
          .from('.h-inst-foot', { opacity: 0, duration: 0.7 }, 1.3);
    }

    /* ───────── 4. Reveal saat scroll ───────── */
    function initScrollReveals() {
        if (!hasST || reduce) return;
        gsap.registerPlugin(ScrollTrigger);

        /* Garis paranada bergeser pelan mengikuti scroll */
        gsap.to('.h-ornament', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.h-hero', start: 'top top', end: 'bottom top', scrub: true } });

        /* Alur belajar */
        gsap.from('.h-steps li', {
            opacity: 0, y: 34, duration: 0.8, stagger: 0.12, ease: 'power3.out',
            scrollTrigger: { trigger: '.h-steps', start: 'top 82%', once: true }
        });

        /* Judul & deskripsi bagian "pilih ruang" */
        gsap.from('.h-paths-head > *', {
            opacity: 0, y: 30, duration: 0.9, stagger: 0.12, ease: 'power3.out',
            scrollTrigger: { trigger: '.h-paths-head', start: 'top 82%', once: true }
        });

        /* Tiap baris masuk sendiri-sendiri */
        gsap.utils.toArray('.h-path').forEach(function (row) {
            gsap.from(row.children, {
                opacity: 0, y: 40, duration: 0.9, stagger: 0.1, ease: 'power3.out',
                scrollTrigger: { trigger: row, start: 'top 88%', once: true }
            });
        });

        /* Penutup */
        var closing = gsap.timeline({ scrollTrigger: { trigger: '.h-closing', start: 'top 70%', once: true }, defaults: { ease: 'power3.out' } });
        closing.from('.h-closing .eyebrow', { opacity: 0, y: 14, duration: 0.6 })
               .from('.h-closing-title .h-line > span', { yPercent: 115, duration: 1, stagger: 0.12 }, 0.1)
               .from('.h-closing-row', { opacity: 0, y: 24, duration: 0.8 }, 0.5);

        /* Posisi trigger bisa bergeser setelah font selesai dimuat */
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }

    function init() {
        initPiano();
        initSmoothScroll();
        introHero();
        initScrollReveals();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
