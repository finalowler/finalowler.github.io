// Samaya launch film: a looping, code-native piece with a cinematic, unhurried cut.
// A calm, curious film: the ask → drifting through data → it gathers into an answer → always on → title.
// Plays in the homepage tile; pauses offscreen; shows a still lockup under reduced motion.
(function () {
    var film = document.querySelector('.sx-film');
    if (!film) return;
    var stage = film.querySelector('.sx-stage');
    var W = 2100, H = 900;

    // Fit the 21:9 stage inside the tile; any leftover space reads as letterbox
    function fit() {
        var r = film.getBoundingClientRect();
        var s = Math.min(r.width / W, r.height / H);
        stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    }
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(film);
    fit();

    var gsap = window.gsap;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!gsap || reduce) {
        film.classList.add('sx-static');
        return;
    }

    var q = function (sel) { return film.querySelector(sel); };
    var qa = function (sel) { return film.querySelectorAll(sel); };
    var canvas = q('.sx-canvas');
    var ctx = canvas.getContext('2d');
    var rand = (function (seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(9);

    // -----------------------------------------------------------------
    // Canvas renderer: one surface, several modes, driven by the timeline
    // -----------------------------------------------------------------

    var S = { mode: 'none', speed: 1, gather: 0, zoom: 1, formP: 0, solid: 0, fade: 1 };
    var last = performance.now(), clock = 0;

    // Warp: data rushing at the camera
    var stars = [];
    for (var i = 0; i < 900; i++) stars.push({ x: rand() * 2 - 1, y: rand() * 2 - 1, z: rand() });

    // Chart: a live price walk across the full frame
    var noise = (function (seed) { return function () { seed = (seed * 48271) % 2147483647; return seed / 2147483647 - 0.5; }; })(5);
    var series = [], v = 0, rings = [];
    for (i = 0; i < 260; i++) { v += noise() * 7; series.push(v); }

    // Title: particles slam together into the lockup
    var LOCK = { markX: 740, word: 845, y: 450, r: 80 };
    function drawLockup(c, alpha) {
        c.save();
        c.globalAlpha = alpha;
        c.fillStyle = '#3d5afe';
        c.shadowColor = 'rgba(61, 90, 254, 0.9)';
        c.shadowBlur = 80 * alpha;
        c.beginPath(); c.arc(LOCK.markX, LOCK.y, LOCK.r, 0, Math.PI * 2); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = '#fff';
        c.textBaseline = 'middle';
        c.textAlign = 'center';
        c.font = '500 98px Inter, sans-serif';
        c.fillText('S', LOCK.markX, LOCK.y + 5);
        c.textAlign = 'left';
        c.font = '600 160px Inter, sans-serif';
        c.fillText('Samaya', LOCK.word, LOCK.y + 10);
        c.restore();
    }
    var dots = null;
    function buildDots() {
        var off = document.createElement('canvas');
        off.width = W; off.height = H;
        var oc = off.getContext('2d');
        drawLockup(oc, 1);
        var data = oc.getImageData(0, 0, W, H).data;
        dots = [];
        for (var y = 0; y < H; y += 5) {
            for (var x = 0; x < W; x += 5) {
                var k = (y * W + x) * 4;
                if (data[k + 3] > 128) {
                    var ang = rand() * Math.PI * 2, rad = 700 + rand() * 900;
                    dots.push({ tx: x, ty: y, sx: 1050 + Math.cos(ang) * rad, sy: 450 + Math.sin(ang) * rad * 0.6, d: rand() * 0.3, blue: data[k + 2] > 200 && data[k] < 120 });
                }
            }
        }
    }

    function render(now) {
        var dt = Math.min(48, now - last) / 1000;
        last = now;
        clock += dt;
        ctx.clearRect(0, 0, W, H);
        if (S.mode === 'none') return;
        ctx.save();
        ctx.globalAlpha = S.fade;

        if (S.mode === 'warp') {
            ctx.globalCompositeOperation = 'lighter';
            for (var k = 0; k < stars.length; k++) {
                var s = stars[k];
                var z0 = s.z;
                s.z -= dt * 0.5 * S.speed;
                if (s.z <= 0.03) { s.z = 1; s.x = rand() * 2 - 1; s.y = rand() * 2 - 1; continue; }
                var g = 1 - S.gather;
                var x1 = 1050 + (s.x / z0) * 520 * g, y1 = 450 + (s.y / z0) * 300 * g;
                var x2 = 1050 + (s.x / s.z) * 520 * g, y2 = 450 + (s.y / s.z) * 300 * g;
                var a = Math.min(1, (1 - s.z) * 1.4) * (1 - S.gather * 0.5);
                ctx.strokeStyle = 'rgba(' + (k % 5 ? '150,175,255' : '255,255,255') + ',' + a.toFixed(3) + ')';
                ctx.lineWidth = (1 - s.z) * 3.2;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            }
            if (S.gather > 0) {
                var glow = ctx.createRadialGradient(1050, 450, 0, 1050, 450, 260 * S.gather + 1);
                glow.addColorStop(0, 'rgba(255,255,255,' + (0.9 * S.gather).toFixed(3) + ')');
                glow.addColorStop(0.25, 'rgba(140,165,255,' + (0.45 * S.gather).toFixed(3) + ')');
                glow.addColorStop(1, 'rgba(61,90,254,0)');
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, W, H);
            }
        }

        if (S.mode === 'chart') {
            v += noise() * 4.5;
            v += (0 - v) * 0.01;
            series.push(v); series.shift();
            // The line runs edge to edge; its leading point sits inside the frame
            var X0 = -40, X1 = 1760, base = 520, sc = 2.2;
            var hx = X1, hy = base - v * sc;
            ctx.save();
            ctx.translate(hx, hy); ctx.scale(S.zoom, S.zoom); ctx.translate(-hx, -hy);
            function trace() {
                ctx.beginPath();
                for (var j = 0; j < series.length; j++) {
                    var cx = X0 + (j / (series.length - 1)) * (X1 - X0);
                    var cy = base - series[j] * sc;
                    j ? ctx.lineTo(cx, cy) : ctx.moveTo(cx, cy);
                }
            }
            // Area fill, which dissolves horizontally before the head so it never ends in a hard edge
            trace();
            ctx.lineTo(X1, H + 400); ctx.lineTo(X0, H + 400); ctx.closePath();
            var grad = ctx.createLinearGradient(0, 200, 0, 900);
            grad.addColorStop(0, 'rgba(61, 90, 254, 0.42)');
            grad.addColorStop(1, 'rgba(61, 90, 254, 0)');
            ctx.fillStyle = grad; ctx.fill();
            ctx.globalCompositeOperation = 'destination-out';
            var tail = ctx.createLinearGradient(X1 - 420, 0, X1, 0);
            tail.addColorStop(0, 'rgba(0,0,0,0)');
            tail.addColorStop(1, 'rgba(0,0,0,1)');
            ctx.fillStyle = tail;
            ctx.fillRect(X1 - 420, -400, 440, H + 800);
            ctx.globalCompositeOperation = 'source-over';
            trace();
            ctx.strokeStyle = '#9fb0ff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#6f86ff';
            ctx.shadowBlur = 28;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(hx, hy, 9, 0, Math.PI * 2); ctx.fill();
            rings.forEach(function (rg) {
                rg.r += 6; rg.a *= 0.965;
                ctx.strokeStyle = 'rgba(255, 207, 122,' + rg.a.toFixed(3) + ')';
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(hx, hy, rg.r, 0, Math.PI * 2); ctx.stroke();
            });
            rings = rings.filter(function (rg) { return rg.a > 0.03; });
            ctx.restore();
            // Soft fade at both frame edges
            ctx.globalCompositeOperation = 'destination-in';
            var edge = ctx.createLinearGradient(0, 0, W, 0);
            edge.addColorStop(0, 'rgba(0,0,0,0)');
            edge.addColorStop(0.12, 'rgba(0,0,0,1)');
            edge.addColorStop(0.9, 'rgba(0,0,0,1)');
            edge.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = edge;
            ctx.fillRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'source-over';
        }

        if (S.mode === 'title') {
            if (!dots) buildDots();
            ctx.globalCompositeOperation = 'lighter';
            for (k = 0; k < dots.length; k++) {
                var d = dots[k];
                var e = Math.min(1, Math.max(0, (S.formP - d.d) / (1 - d.d)));
                e = 1 - Math.pow(1 - e, 3);
                var dx = d.sx + (d.tx - d.sx) * e, dy = d.sy + (d.ty - d.sy) * e;
                var al = (0.3 + 0.7 * e) * (1 - S.solid * 0.9);
                ctx.fillStyle = d.blue ? 'rgba(110,140,255,' + al.toFixed(3) + ')' : 'rgba(225,232,255,' + al.toFixed(3) + ')';
                ctx.fillRect(dx, dy, 2.4, 2.4);
            }
            ctx.globalCompositeOperation = 'source-over';
            if (S.solid > 0) drawLockup(ctx, S.solid);
        }
        ctx.restore();
    }

    // -----------------------------------------------------------------
    // The cut
    // -----------------------------------------------------------------

    var ask = q('.sx-ask'), num = q('.sx-num');
    var qtext = q('.sx-qtext'), full = qtext.dataset.text;
    var digits = q('.sx-digits');
    var flare = q('.sx-flare');
    var bars = qa('.sx-bar');
    var typed = { n: 0 }, counted = { v: 0 };

    function cut(mode) { return function () { S.mode = mode; }; }

    var tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, defaults: { ease: 'power2.out' }, paused: true });

    tl.call(cut('none'), null, 0)
        .set([ask, num], { autoAlpha: 0 }, 0)
        .set(bars, { height: 0 }, 0);

    // A calm, curious cut: slow camera drifts and soft dissolves between shots
    // The ask: the camera eases back from a soft close-up as the prompt is written
    tl.set(ask, { autoAlpha: 0 }, 0)
        .to(ask, { autoAlpha: 1, duration: 0.8, ease: 'sine.out' }, 0.2)
        .fromTo(ask, { scale: 1.8, filter: 'blur(8px)', transformOrigin: '32% 50%' }, { scale: 1, filter: 'blur(0px)', duration: 2.6, ease: 'power2.out', immediateRender: false }, 0.2)
        .fromTo(typed, { n: 0 }, { n: full.length, duration: 2.6, ease: 'none', immediateRender: false, onUpdate: function () { qtext.textContent = full.slice(0, Math.round(typed.n)); } }, 0.7)
        .fromTo('.sx-chips span', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.9, ease: 'power2.out', immediateRender: false }, 1.5)
        .fromTo('.sx-send', { scale: 1 }, { scale: 1.12, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, 3.6);

    // The send: the box drifts forward and dissolves into the data
    tl.to(ask, { scale: 1.25, autoAlpha: 0, filter: 'blur(6px)', duration: 1.0, ease: 'power2.in' }, 3.9)
        .set(canvas, { opacity: 0 }, 4.3)
        .call(cut('warp'), null, 4.3)
        .to(canvas, { opacity: 1, duration: 1.0, ease: 'sine.inOut' }, 4.3)
        .fromTo(S, { speed: 1.3 }, { speed: 0.3, duration: 2.8, ease: 'power2.out', immediateRender: false }, 4.3)
        .fromTo(canvas, { scale: 1.06 }, { scale: 1, duration: 2.8, ease: 'sine.out', immediateRender: false }, 4.3);

    // Everything it read gathers into one point of light
    tl.fromTo(S, { gather: 0 }, { gather: 1, duration: 1.6, ease: 'power2.inOut', immediateRender: false }, 6.0);

    // The answer, counted unhurried
    tl.to(canvas, { opacity: 0, duration: 0.5, ease: 'sine.inOut' }, 7.00)
        .call(cut('none'), null, 7.50)
        .set(canvas, { opacity: 1 }, 7.50)
        .fromTo(num, { autoAlpha: 0, scale: 0.6, filter: 'blur(14px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 2.0, ease: 'power3.out', immediateRender: false }, 7.25)
        .fromTo(counted, { v: 0 }, { v: 606.4, duration: 1.8, ease: 'power2.out', immediateRender: false, onUpdate: function () { digits.textContent = '$' + counted.v.toFixed(1) + 'B'; } }, 7.50)
        .to(num, { autoAlpha: 0, duration: 0.6, ease: 'sine.inOut' }, 9.60);

    // Always on: the market keeps moving, and the agent keeps watching
    tl.set(canvas, { opacity: 0 }, 10.10)
        .call(cut('chart'), null, 10.10)
        .to(canvas, { opacity: 1, duration: 0.8, ease: 'sine.inOut' }, 10.10)
        .fromTo(S, { zoom: 1.45 }, { zoom: 1.12, duration: 2.6, ease: 'sine.inOut', immediateRender: false }, 10.10)
        .call(function () { rings.push({ r: 0, a: 1 }); }, null, 11.30)
        .to(canvas, { opacity: 0, duration: 0.7, ease: 'sine.inOut' }, 12.30)
        .call(cut('none'), null, 13.00)
        .set(canvas, { opacity: 1 }, 13.00);

    // The title assembles quietly, holds, and fades
    tl.to(bars, { height: 70, duration: 1.2, ease: 'power2.inOut' }, 12.80)
        .call(function () { S.mode = 'title'; S.formP = 0; S.solid = 0; S.fade = 1; }, null, 13.20)
        .fromTo(S, { formP: 0 }, { formP: 1, duration: 2.4, ease: 'none', immediateRender: false }, 13.20)
        .fromTo(flare, { xPercent: 0, opacity: 0 }, { xPercent: 260, opacity: 0.7, duration: 2.4, ease: 'sine.inOut', immediateRender: false }, 14.30)
        .to(flare, { opacity: 0, duration: 0.6 }, 16.30)
        .to(S, { solid: 1, duration: 1.0, ease: 'sine.out' }, 15.20)
        .fromTo(canvas, { scale: 1.04 }, { scale: 1, duration: 4, ease: 'power2.out', immediateRender: false }, 13.20)
        .to(S, { fade: 0, duration: 1.0, ease: 'sine.in' }, 17.70)
        .to(bars, { height: 0, duration: 0.9, ease: 'power2.inOut' }, 18.30)
        .call(cut('none'), null, 18.80);

    // Render only while the tile is visible
    var visible = false;
    gsap.ticker.add(function () { if (visible) render(performance.now()); });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            if (visible) { last = performance.now(); tl.play(); } else { tl.pause(); }
        }, { threshold: 0.15 }).observe(film);
    } else {
        visible = true;
        tl.play();
    }
    film.sxTimeline = tl;
})();
