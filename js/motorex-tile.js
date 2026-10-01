// Shimano × Motorex homepage tile: the display draws itself, becomes real,
// and its shelf transfers from the floorstanding unit onto standard slatwall.
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
    if (!gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // the finished drawing is the still

    var q = function (sel) { return tile.querySelectorAll(sel); };
    var inks = [].slice.call(q('.mx-ink'));
    var fills = q('.mx-fill');
    var move = tile.querySelector('.mx-move');
    var path = tile.querySelector('.mx-path');
    var noteA = tile.querySelector('.mx-note-a'), noteB = tile.querySelector('.mx-note-b');
    var title = tile.querySelector('.mx-title');
    var pathLen = path.getTotalLength();

    inks.forEach(function (el) {
        var L = el.getTotalLength ? el.getTotalLength() : 600;
        el.style.strokeDasharray = L;
        el.dataset.len = L;
    });

    var tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, paused: true, defaults: { ease: 'power2.out' } });

    // Draw in, line by line
    tl.set(fills, { opacity: 0 }, 0)
        .set(inks, { strokeDashoffset: function (i, el) { return el.dataset.len; }, opacity: 1 }, 0)
        .set(move, { x: 0, y: 0, rotation: 0, svgOrigin: '315 343' }, 0)
        .set([noteA, noteB], { opacity: 0 }, 0)
        .set(path, { opacity: 0, strokeDashoffset: pathLen, strokeDasharray: '6 8' }, 0)
        .fromTo(title, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.2)
        .to(inks, { strokeDashoffset: 0, duration: 1.6, stagger: { each: 0.012, from: 'start' }, ease: 'power1.inOut' }, 0.1)
        // Becomes the real thing: Motorex teal fills in, linework recedes
        .to(fills, { opacity: function (i, el) { return el.classList.contains('mx-wall-fill') ? 0.1 : (el.getAttribute('opacity') || 1); }, duration: 0.9, stagger: 0.01 }, 2.0)
        .to(inks, { opacity: function (i, el) { return el.closest('.mx-wall') || el.classList.contains('mx-hatch') ? 1 : 0.35; }, duration: 0.9 }, 2.2);

    // The transfer: lift, glide along the path, hook onto the slatwall
    tl.to(move, { y: -22, duration: 0.6, ease: 'power2.out' }, 3.4)
        .to(noteA, { opacity: 1, duration: 0.5 }, 3.5)
        .to(path, { opacity: 1, duration: 0.3 }, 3.9)
        .fromTo(path, { strokeDasharray: pathLen + ' ' + pathLen, strokeDashoffset: pathLen }, { strokeDashoffset: 0, duration: 1.0, ease: 'power1.inOut', immediateRender: false }, 3.9)
        .to(move, { x: 545, y: 18, rotation: 3, duration: 1.7, ease: 'power2.inOut' }, 4.1)
        .to(noteA, { opacity: 0, duration: 0.4 }, 4.6)
        .to(move, { y: 42, rotation: 0, duration: 0.5, ease: 'back.out(2.2)' }, 5.8)
        .to(path, { opacity: 0, duration: 0.6 }, 6.0)
        .to(noteB, { opacity: 1, duration: 0.5 }, 6.1)
        // Hold, then the shelf goes home
        .to(noteB, { opacity: 0, duration: 0.4 }, 8.6)
        .to(move, { y: 20, duration: 0.4, ease: 'power2.in' }, 8.8)
        .to(move, { x: 0, y: -22, rotation: -2, duration: 1.6, ease: 'power2.inOut' }, 9.2)
        .to(move, { y: 0, rotation: 0, duration: 0.5, ease: 'back.out(2)' }, 10.8)
        .to([fills, inks, title], { opacity: 0, duration: 0.7, ease: 'sine.in' }, 12.4);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            entries[0].isIntersecting ? tl.play() : tl.pause();
        }, { threshold: 0.2 }).observe(tile);
    } else {
        tl.play();
    }
})();
