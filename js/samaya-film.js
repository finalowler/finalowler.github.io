// Samaya launch film: a looping, code-native motion piece rebuilt from the product's own UI.
// Plays in the homepage tile; pauses offscreen; shows its final frame under reduced motion.
(function () {
    var film = document.querySelector('.sx-film');
    if (!film) return;
    var stage = film.querySelector('.sx-stage');

    // Design at 1600×900 and scale to whatever the tile is
    function fit() {
        var r = film.getBoundingClientRect();
        var s = Math.min(r.width / 1600, r.height / 900);
        stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    }
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(film);
    fit();

    var gsap = window.gsap;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var q = function (sel) { return film.querySelector(sel); };
    var qa = function (sel) { return film.querySelectorAll(sel); };

    // Typed text: reveal data-text one character at a time
    function typer(el) {
        var full = el.dataset.text;
        var o = { n: 0 };
        return { o: o, len: full.length, set: function () { el.textContent = full.slice(0, Math.round(o.n)); } };
    }

    if (!gsap || reduce) {
        film.classList.add('sx-static');
        qa('[data-text]').forEach(function (el) { el.textContent = el.dataset.text; });
        return;
    }

    var scenes = qa('.sx-scene');
    gsap.set(scenes, { autoAlpha: 0 });

    var ask = typer(q('.sx-ask-text'));
    var prompt = typer(q('.sx-qtext'));
    var EXPO = 'expo.out';

    var tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4, defaults: { ease: EXPO } });

    // Scene 1 · The question every analyst starts with
    tl.set(scenes[0], { autoAlpha: 1 })
        .fromTo('.sx-grid', { opacity: 0, scale: 1.2 }, { opacity: 1, scale: 1, duration: 2.4 }, 0)
        .to(ask.o, { n: ask.len, duration: 1.4, ease: 'none', onUpdate: ask.set, onStart: function () { ask.o.n = 0; ask.set(); } }, 0.3)
        .fromTo('.sx-s1 .sx-sub', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 1.6)
        // Exposition only: the line fades out before the query box arrives
        .to('.sx-s1 .sx-ask, .sx-s1 .sx-sub', { autoAlpha: 0, y: -24, duration: 0.5, ease: 'power2.in' }, 2.5)
        .set(scenes[0], { autoAlpha: 0 }, 3.0)
        .set('.sx-s1 .sx-ask, .sx-s1 .sx-sub', { autoAlpha: 1, y: 0 }, 3.0);

    // Scene 2 · The query box: a prompt is typed and sent
    tl.set(scenes[1], { autoAlpha: 1 }, 2.9)
        .fromTo('.sx-query', { y: 80, scale: 0.9, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.9 }, 2.9)
        .fromTo('.sx-chips span', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.7 }, 3.2)
        .to(prompt.o, { n: prompt.len, duration: 1.8, ease: 'none', onUpdate: prompt.set, onStart: function () { prompt.o.n = 0; prompt.set(); } }, 3.3)
        .fromTo('.sx-send', { scale: 1 }, { scale: 1.25, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' }, 5.2)
        .fromTo('.sx-beam', { xPercent: -160 }, { xPercent: 480, duration: 1.1, ease: 'power2.inOut' }, 5.3)
        .to('.sx-query', { y: -320, scale: 0.6, autoAlpha: 0, duration: 0.8, ease: 'expo.in' }, 5.4)
        .to('.sx-chips', { autoAlpha: 0, duration: 0.3 }, 5.4)
        .set(scenes[1], { autoAlpha: 0 }, 6.2);

    // Scene 3 · Reasoning, abstracted: scattered light (everything it reads) pulls into four
    // streams (the stages), which braid into one bright core (the answer)
    var canvas = q('.sx-field');
    var ctx = canvas.getContext('2d');
    var rand = (function (seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(11);
    var LANES = [270, 390, 510, 630];
    var CORE = { x: 1300, y: 450 };
    var parts = [];
    for (var i = 0; i < 1400; i++) {
        parts.push({
            sx: rand() * 1600,
            sy: rand() * 900,
            lane: i % 4,
            seed: rand(),
            speed: 0.6 + rand() * 0.9,
            size: rand() < 0.1 ? 3 : 1.8,
        });
    }
    var field = { p: 0 };
    function smooth(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
    function mix(a, b, t) { return a + (b - a) * t; }
    function drawField() {
        var p = field.p, t = tl.time();
        var gather = smooth(0.12, 0.42, p);
        var merge = smooth(0.6, 0.9, p);
        ctx.clearRect(0, 0, 1600, 900);
        ctx.globalCompositeOperation = 'lighter';
        for (var k = 0; k < parts.length; k++) {
            var a = parts[k];
            // Drifting noise
            var cx = a.sx + Math.sin(t * 0.7 + a.seed * 40) * 26;
            var cy = a.sy + Math.cos(t * 0.6 + a.seed * 30) * 26;
            // Streaming along a lane, left to right
            var f = (a.seed * 3.7 + t * 0.22 * a.speed) % 1;
            var lx = 360 + f * 940;
            var ly = LANES[a.lane] + Math.sin(lx * 0.012 + a.seed * 12 + t) * 7;
            // Lanes bend toward the core as they near it
            ly = mix(ly, CORE.y, merge * smooth(500, 1300, lx));
            var x = mix(cx, lx, gather);
            var y = mix(cy, ly, gather);
            // Finally, everything collapses into the core
            var spin = a.seed * 40 + t * 2;
            var r = mix(120, 8, merge) * (0.3 + a.seed);
            var tx = CORE.x + Math.cos(spin) * r, ty = CORE.y + Math.sin(spin) * r * 0.6;
            var pull = smooth(0.82, 1, p);
            x = mix(x, tx, pull);
            y = mix(y, ty, pull);
            var alpha = mix(0.45, 0.95, gather) * (0.55 + a.seed * 0.45);
            var hue = a.lane === 0 ? '120,150,255' : a.lane === 1 ? '170,140,255' : a.lane === 2 ? '110,200,255' : '210,220,255';
            var rgb = gather > 0.5 ? hue : '170,185,255';
            // Streak length follows flow speed: points in chaos, light trails once streaming
            var len = a.size + gather * (1 - pull) * (10 + a.speed * 18);
            // Soft glow pass, then the bright core of each particle
            ctx.fillStyle = 'rgba(' + rgb + ',' + (alpha * 0.14).toFixed(3) + ')';
            ctx.fillRect(x - len - 3, y - 3, len + 6, a.size + 6);
            ctx.fillStyle = 'rgba(' + rgb + ',' + alpha.toFixed(3) + ')';
            ctx.fillRect(x - len, y, len, a.size);
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    var lanes = qa('.sx-lanes li');
    tl.set(scenes[2], { autoAlpha: 1 }, 6.0)
        .fromTo(field, { p: 0 }, { p: 1, duration: 3.8, ease: 'none', onUpdate: drawField }, 6.0)
        .fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'none' }, 6.0)
        .fromTo(lanes, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, stagger: 0.12, duration: 0.6 }, 7.4)
        .to(lanes, { autoAlpha: 0, x: 40, stagger: 0.05, duration: 0.4, ease: 'power2.in' }, 8.4)
        // The core gathers, then blooms into the answer
        .fromTo('.sx-core', { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 0.6, duration: 1.0, ease: 'power2.in' }, 8.7)
        .to('.sx-core', { scale: 6, opacity: 0, duration: 0.7, ease: 'expo.out' }, 9.7)
        .to(canvas, { opacity: 0, duration: 0.3 }, 9.7)
        .set(scenes[2], { autoAlpha: 0 }, 10.3);

    // Scene 4 · The answer, as a data sculpture: glass bars rise with counting values,
    // the missing figure stays an honest ghost, margins draw as rings, and every real
    // number threads back to its source
    var BASE = 640;
    var bars = qa('.vz-bar'), caps = qa('.vz-cap'), vals = qa('.vz-val');
    var threads = qa('.vz-thread');
    threads.forEach(function (t) { var L = t.getTotalLength(); t.style.strokeDasharray = L; t.dataset.len = L; });
    tl.set(scenes[3], { autoAlpha: 1 }, 9.8)
        .fromTo('.sx-s4 .sx-tq', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 9.95)
        .fromTo('.vz-name', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.6 }, 9.9)
        .fromTo(threads, { strokeDashoffset: function (i, t) { return t.dataset.len; } }, { strokeDashoffset: function (i, t) { return t.dataset.len; }, duration: 0.01 }, 9.8)
        .fromTo('.vz-cite', { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' }, { autoAlpha: 0, duration: 0.01 }, 9.8);
    bars.forEach(function (b, i) {
        var h = +b.dataset.h, at = 10.0 + i * 0.18;
        var o = { h: 0 };
        tl.fromTo(o, { h: 0 }, {
            h: h, duration: 1.1, ease: 'expo.out',
            onUpdate: function () {
                b.setAttribute('y', BASE - o.h); b.setAttribute('height', o.h);
                caps[i].setAttribute('y', BASE - o.h);
                vals[i].setAttribute('y', BASE - o.h - 22);
                vals[i].textContent = '$' + (+vals[i].dataset.v * (o.h / h)).toFixed(1) + 'B';
            },
        }, at);
    });
    // The gap flickers like a signal that never resolves, then holds
    tl.fromTo('.vz-ghost', { opacity: 0 }, {
        keyframes: [{ opacity: 0.7, duration: 0.06 }, { opacity: 0.1, duration: 0.08 }, { opacity: 0.9, duration: 0.05 }, { opacity: 0.25, duration: 0.1 }, { opacity: 1, duration: 0.2 }],
    }, 10.2)
        .fromTo('.vz-gap, .vz-gap-sub', { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.12, duration: 0.5 }, 10.6);
    qa('.vz-ring').forEach(function (r, i) {
        var C = parseFloat(r.getAttribute('stroke-dasharray'));
        tl.fromTo(r, { strokeDashoffset: C }, { strokeDashoffset: C * (1 - +r.dataset.m), duration: 0.9, ease: 'power2.out' }, 10.7 + i * 0.12);
    });
    tl.fromTo('.vz-margin, .vz-margin-sub', { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, stagger: 0.05, duration: 0.5 }, 10.8)
        .to(threads, { strokeDashoffset: 0, duration: 0.8, stagger: 0.15, ease: 'power2.inOut' }, 11.4)
        .to('.vz-cite', { autoAlpha: 1, scale: 1, stagger: 0.15, duration: 0.5, ease: 'back.out(2.5)' }, 12.0)
        .to(scenes[3], { autoAlpha: 0, y: -40, duration: 0.5, ease: 'expo.in' }, 13.2)
        .set(scenes[3], { y: 0 }, 13.8);

    // Scene 4b · Always on: a live chart streams; spikes fire the agent's triggers
    var chart = q('.sx-chart');
    var cg = chart.getContext('2d');
    var px = q('.sx-px'), chg = q('.sx-chg');
    var alerts = qa('.sx-alert');
    var noise = (function (seed) { return function () { seed = (seed * 48271) % 2147483647; return seed / 2147483647 - 0.5; }; })(5);
    var series = [], series2 = [], N = 220, v = 0, v2 = 0, live = { t: 0 };
    for (var n = 0; n < N; n++) { v += noise() * 6; v2 += noise() * 4; series.push(v); series2.push(v2); }
    var spikes = [{ at: 0.32, size: -70, fired: false }, { at: 0.68, size: 55, fired: false }];
    var rings = [];
    function step(progress) {
        // advance the walk; scripted moves land at fixed moments
        var push = 0;
        spikes.forEach(function (sp, k) {
            if (!sp.fired && progress >= sp.at) {
                sp.fired = true;
                push = sp.size;
                rings.push({ r: 0, a: 1 });
                gsap.fromTo(alerts[k], { autoAlpha: 0, x: 80, scale: 0.94 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.7, ease: 'expo.out' });
            }
        });
        v += noise() * 7 + push * 0.5;
        v += (0 - v) * 0.015;
        v2 += noise() * 4;
        v2 += (0 - v2) * 0.02;
        series.push(v); series.shift();
        series2.push(v2); series2.shift();
    }
    function drawChart() {
        var W = 1600, X0 = 120, X1 = 1180, Y = 560, scale = 2.4;
        cg.clearRect(0, 0, W, 900);
        // faint guide rules
        cg.strokeStyle = 'rgba(160, 180, 255, 0.07)';
        cg.lineWidth = 1;
        for (var g = 0; g < 5; g++) { cg.beginPath(); cg.moveTo(X0, 330 + g * 110); cg.lineTo(X1, 330 + g * 110); cg.stroke(); }
        function line(data, color, width, glow, fill, yOff, sc) {
            cg.beginPath();
            for (var k = 0; k < data.length; k++) {
                var x = X0 + (k / (data.length - 1)) * (X1 - X0);
                var y = Y + yOff - data[k] * sc;
                k ? cg.lineTo(x, y) : cg.moveTo(x, y);
            }
            if (fill) {
                var grad = cg.createLinearGradient(0, 300, 0, 860);
                grad.addColorStop(0, 'rgba(61, 90, 254, 0.35)');
                grad.addColorStop(1, 'rgba(61, 90, 254, 0)');
                cg.save();
                cg.lineTo(X1, 860); cg.lineTo(X0, 860); cg.closePath();
                cg.fillStyle = grad; cg.fill();
                cg.restore();
                cg.beginPath();
                for (k = 0; k < data.length; k++) {
                    x = X0 + (k / (data.length - 1)) * (X1 - X0);
                    y = Y + yOff - data[k] * sc;
                    k ? cg.lineTo(x, y) : cg.moveTo(x, y);
                }
            }
            cg.strokeStyle = color; cg.lineWidth = width;
            cg.shadowColor = color; cg.shadowBlur = glow;
            cg.stroke();
            cg.shadowBlur = 0;
            return { x: X1, y: Y + yOff - data[data.length - 1] * sc };
        }
        line(series2, 'rgba(160, 130, 255, 0.55)', 2, 8, false, 170, 1.6);
        var head = line(series, '#8ea0ff', 3.5, 24, true, 0, scale);
        // live head with a pulse, and shockwaves when a trigger fires
        cg.fillStyle = '#fff';
        cg.beginPath(); cg.arc(head.x, head.y, 7, 0, Math.PI * 2); cg.fill();
        rings.forEach(function (rg) {
            rg.r += 9; rg.a *= 0.94;
            cg.strokeStyle = 'rgba(255, 207, 122,' + rg.a.toFixed(3) + ')';
            cg.lineWidth = 3;
            cg.beginPath(); cg.arc(head.x, head.y, rg.r, 0, Math.PI * 2); cg.stroke();
        });
        rings = rings.filter(function (rg) { return rg.a > 0.03; });
        var price = 142.18 + v * 0.08;
        px.textContent = price.toFixed(2);
        var pct = (v * 0.08 / 142.18) * 100;
        chg.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
        chg.style.color = pct >= 0 ? '#6ff0b4' : '#ff8a8a';
    }
    tl.set(scenes[4], { autoAlpha: 1 }, 13.4)
        .call(function () { spikes.forEach(function (sp) { sp.fired = false; }); rings = []; gsap.set(alerts, { autoAlpha: 0 }); }, null, 13.4)
        .fromTo(live, { t: 0 }, { t: 1, duration: 3.2, ease: 'none', onUpdate: function () { step(live.t); step(live.t); drawChart(); } }, 13.4)
        .fromTo(chart, { opacity: 0, x: 120 }, { opacity: 1, x: 0, duration: 0.8, ease: 'expo.out' }, 13.4)
        .fromTo('.sx-kick, .sx-ticker', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.7 }, 13.5)
        .to(scenes[4], { autoAlpha: 0, scale: 1.06, duration: 0.45, ease: 'expo.in' }, 16.4)
        .set(scenes[4], { scale: 1 }, 17.0);

    // Scene 5 · The chart dissolves into particles that assemble the Samaya lockup,
    // then solidify; one quiet line types beneath
    var form = q('.sx-form');
    var fg = form.getContext('2d');
    var dots = [], targets = null;
    var LOCK = { markX: 520, y: 430, r: 78, wordX: 640 };
    function drawLockup(c, alpha) {
        c.save();
        c.globalAlpha = alpha;
        c.fillStyle = '#3d5afe';
        c.beginPath(); c.arc(LOCK.markX, LOCK.y, LOCK.r, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff';
        c.textBaseline = 'middle';
        c.textAlign = 'center';
        c.font = '500 96px Inter, sans-serif';
        c.fillText('S', LOCK.markX, LOCK.y + 4);
        c.textAlign = 'left';
        c.font = '600 156px Inter, sans-serif';
        c.fillText('Samaya', LOCK.wordX, LOCK.y + 8);
        c.restore();
    }
    function sampleTargets() {
        var off = document.createElement('canvas');
        off.width = 1600; off.height = 900;
        var oc = off.getContext('2d');
        drawLockup(oc, 1);
        var data = oc.getImageData(0, 0, 1600, 900).data, out = [];
        for (var y = 0; y < 900; y += 5) {
            for (var x = 0; x < 1600; x += 5) {
                if (data[(y * 1600 + x) * 4 + 3] > 128) out.push({ x: x, y: y, blue: data[(y * 1600 + x) * 4 + 2] > 200 && data[(y * 1600 + x) * 4] < 120 });
            }
        }
        return out;
    }
    function seedDots() {
        if (!targets) targets = sampleTargets();
        // start where the chart line left off, so the line itself becomes the logo
        var X0 = 120, X1 = 1180;
        dots = targets.map(function (t, k) {
            var u = Math.random();
            var idx = Math.floor(u * (series.length - 1));
            return {
                sx: X0 + u * (X1 - X0) + (Math.random() - 0.5) * 6,
                sy: 560 - series[idx] * 2.4 + (Math.random() - 0.5) * 6,
                tx: t.x, ty: t.y, blue: t.blue,
                swirl: (Math.random() - 0.5) * 2, delay: Math.random() * 0.35,
            };
        });
    }
    var morph = { p: 0, solid: 0 };
    function drawForm() {
        fg.clearRect(0, 0, 1600, 900);
        var p = morph.p;
        fg.globalCompositeOperation = 'lighter';
        for (var k = 0; k < dots.length; k++) {
            var d = dots[k];
            var e = Math.min(1, Math.max(0, (p - d.delay) / (1 - d.delay)));
            e = e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2;
            var arc = Math.sin(e * Math.PI) * 140 * d.swirl;
            var x = d.sx + (d.tx - d.sx) * e + arc;
            var y = d.sy + (d.ty - d.sy) * e - arc * 0.5;
            var a = (0.35 + 0.5 * e) * (1 - morph.solid * 0.85);
            fg.fillStyle = d.blue ? 'rgba(110,140,255,' + a.toFixed(3) + ')' : 'rgba(220,228,255,' + a.toFixed(3) + ')';
            fg.fillRect(x, y, 2.2, 2.2);
        }
        fg.globalCompositeOperation = 'source-over';
        if (morph.solid > 0) drawLockup(fg, morph.solid);
    }
    tl.set(scenes[5], { autoAlpha: 1 }, 16.4)
        .call(function () { seedDots(); morph.p = 0; morph.solid = 0; drawForm(); }, null, 16.4)
        .to(morph, { p: 1, duration: 2.0, ease: 'none', onUpdate: drawForm }, 16.45)
        .to(morph, { solid: 1, duration: 0.8, ease: 'power2.out', onUpdate: drawForm }, 18.2)
        .fromTo(form, { scale: 1.04 }, { scale: 1, duration: 2.6, ease: 'expo.out' }, 16.45)
        .to(scenes[5], { autoAlpha: 0, duration: 0.7, ease: 'power2.in' }, 21.2)
        .set('.sx-beam', { xPercent: -160 }, 21.9);

    film.sxTimeline = tl;

    // Only run while the tile is on screen
    tl.pause();
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            entries[0].isIntersecting ? tl.play() : tl.pause();
        }, { threshold: 0.15 }).observe(film);
    } else {
        tl.play();
    }
})();
