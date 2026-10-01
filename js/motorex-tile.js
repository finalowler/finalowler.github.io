// Shimano × Motorex homepage tile: the display is sketched by hand, traced to the exact
// geometry of the real unit, then the real thing fades up beneath the ink and plays on.
(function () {
    var tile = document.querySelector('.mx-tile');
    if (!tile) return;
    var stage = tile.querySelector('.mx-stage');

    function fit() {
        var r = tile.getBoundingClientRect();
        var s = Math.min(r.width / 1200, r.height / 900);
        stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    }
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(tile);
    fit();

    var gsap = window.gsap;
    var svg = tile.querySelector('.mx-sketch');
    var photo = tile.querySelector('.mx-photo');
    var still = photo.querySelector('img');
    var video = photo.querySelector('video');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!gsap || !window.rough || reduce) {
        photo.style.opacity = 1; // the real display is the still
        return;
    }
    if (!('IntersectionObserver' in window)) video.src = video.dataset.src;

    var NS = 'http://www.w3.org/2000/svg';
    var rc = window.rough.svg(svg);
    var INK = '#1d1d1f';
    var pen = { stroke: INK, strokeWidth: 1.7, roughness: 1.3, bowing: 1.1 };
    function opts(extra) { var o = {}; for (var k in pen) o[k] = pen[k]; for (k in extra) o[k] = extra[k]; return o; }

    var groups = []; // drawing order: each entry is a set of strokes laid down together
    function add(nodes) {
        var g = document.createElementNS(NS, 'g');
        nodes.forEach(function (n) { g.appendChild(n); });
        svg.appendChild(g);
        groups.push(g);
        return g;
    }
    function text(x, y, str, size, rot) {
        var t = document.createElementNS(NS, 'text');
        t.setAttribute('x', x);
        t.setAttribute('y', y);
        t.setAttribute('class', 'mx-hand');
        t.setAttribute('font-size', size);
        if (rot) t.setAttribute('transform', 'rotate(' + rot + ' ' + x + ' ' + y + ')');
        t.textContent = str;
        return t;
    }

    // Traced to the first frame of the product film (600×600 photo space)
    add([rc.rectangle(168, 150, 28, 470, pen), rc.rectangle(412, 150, 28, 470, pen)]);
    add([rc.rectangle(168, 28, 272, 122, pen), rc.rectangle(176, 84, 256, 60, opts({ strokeWidth: 1.2 }))]);
    add([text(184, 66, 'MOTOREX', 26), text(296, 62, 'BIKE CARE CENTER', 19), text(186, 80, 'oil of switzerland', 12)]);
    var slots = [];
    for (var y = 168; y < 600; y += 30) {
        slots.push(rc.line(180, y, 180, y + 12, opts({ strokeWidth: 1.2, roughness: 0.8 })));
        slots.push(rc.line(426, y, 426, y + 12, opts({ strokeWidth: 1.2, roughness: 0.8 })));
    }
    add(slots);
    add([rc.polygon([[196, 255], [412, 255], [455, 285], [150, 285]], pen), rc.rectangle(150, 285, 305, 26, pen), text(160, 304, 'STEP 1  CLEAN', 16)]);
    add([rc.polygon([[196, 428], [412, 428], [455, 455], [150, 455]], pen), rc.rectangle(150, 455, 305, 28, pen), text(160, 475, 'STEP 2  CARE', 16)]);
    // Products: two spray bottles and two cans on step 1, four cans on step 2
    add([
        rc.rectangle(194, 205, 58, 80, pen), rc.path('M206 205 v-22 h30 l14 12 h-12 v10', pen),
        rc.rectangle(264, 205, 58, 80, pen), rc.path('M276 205 v-22 h30 l14 12 h-12 v10', pen),
    ]);
    add([
        rc.rectangle(337, 172, 40, 112, pen), rc.ellipse(357, 172, 40, 12, pen),
        rc.rectangle(392, 178, 36, 106, pen), rc.ellipse(410, 178, 36, 11, pen),
    ]);
    add([
        rc.rectangle(218, 342, 32, 86, pen), rc.rectangle(268, 346, 34, 82, pen),
        rc.rectangle(322, 350, 34, 78, pen), rc.rectangle(372, 366, 30, 62, pen),
    ]);
    // Side hook arrays with hanging tools
    add([
        rc.rectangle(128, 180, 30, 118, pen), rc.line(143, 200, 143, 300, pen), rc.ellipse(143, 300, 18, 30, pen),
        rc.rectangle(128, 362, 30, 86, pen),
        rc.path('M440 196 h70 v20 M440 214 h60', pen), rc.path('M440 368 h70 v20 M440 386 h60', pen), rc.path('M440 528 h70 v20 M440 546 h60', pen),
    ]);
    // Back panel, hatched like a quick value study
    add([rc.rectangle(196, 150, 216, 470, { stroke: 'none', fill: INK, fillStyle: 'hachure', hachureGap: 13, hachureAngle: 60, fillWeight: 0.7, roughness: 1.4 })]);
    // Dimensions and margin notes, in the hand of the concept sheet
    add([rc.line(110, 28, 110, 620, pen), rc.line(102, 28, 118, 28, pen), rc.line(102, 620, 118, 620, pen), text(92, 340, '6 ft', 22, -90)]);
    add([rc.line(168, 6, 440, 6, pen), rc.line(168, -2, 168, 14, pen), rc.line(440, -2, 440, 14, pen), text(286, -4, '2 ft', 22)]);
    add([text(472, 262, 'shelves lift off', 24), rc.path('M470 270 q-14 10 -18 22', pen)]);
    add([text(472, 448, 'height adjustable', 24), rc.path('M470 456 q-20 0 -40 -20', pen)]);

    var strokes = [].slice.call(svg.querySelectorAll('path'));
    strokes.forEach(function (p) {
        var L = p.getTotalLength();
        p.style.strokeDasharray = L;
        p.dataset.len = L;
    });
    var texts = svg.querySelectorAll('text');

    var tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true });
    tl.set(strokes, { strokeDashoffset: function (i, el) { return el.dataset.len; } }, 0)
        .set(texts, { opacity: 0 }, 0)
        .set(groups, { opacity: 1 }, 0)
        .set(photo, { opacity: 0 }, 0)
        .set(still, { opacity: 1 }, 0)
        .call(function () { video.pause(); try { video.currentTime = 0; } catch (e) {} }, null, 0);

    // Sketch it, group by group, the way a hand would
    var at = 0.2;
    groups.forEach(function (g) {
        var paths = g.querySelectorAll('path');
        var words = g.querySelectorAll('text');
        var dur = Math.min(0.7, 0.18 + paths.length * 0.03);
        if (paths.length) tl.to(paths, { strokeDashoffset: 0, duration: dur, ease: 'power1.inOut', stagger: Math.min(0.05, 0.5 / paths.length) }, at);
        if (words.length) tl.to(words, { opacity: 1, duration: 0.35, stagger: 0.12, ease: 'power1.out' }, at + 0.1);
        at += dur * 0.62;
    });

    // The real display fades up beneath the ink, in register; the ink melts away
    var real = at + 0.4;
    tl.to(photo, { opacity: 1, duration: 1.1, ease: 'sine.inOut' }, real)
        .to(groups, { opacity: 0, duration: 0.9, ease: 'sine.inOut' }, real + 0.7)
        // Then the product film plays on
        .call(function () {
            var p = video.play();
            if (p && p.catch) p.catch(function () {});
        }, null, real + 1.4)
        .to(still, { opacity: 0, duration: 0.2 }, real + 1.5);

    tl.to(photo, { opacity: 0, duration: 0.7, ease: 'sine.in' }, real + 8.0);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) { tl.play(); } else { tl.pause(); video.pause(); }
        }, { threshold: 0.2 }).observe(tile);
        // Fetch the film only as the tile approaches the viewport
        new IntersectionObserver(function (entries, io) {
            if (!entries[0].isIntersecting) return;
            video.src = video.dataset.src;
            video.preload = 'auto';
            io.disconnect();
        }, { rootMargin: '600px 0px' }).observe(tile);
    } else {
        tl.play();
    }
})();
