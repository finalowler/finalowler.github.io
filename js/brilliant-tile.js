// Brilliant homepage tile: the phone walks through setup, and the wall control answers.
(function () {
    var tile = document.querySelector('.br-tile');
    if (!tile) return;
    var stage = tile.querySelector('.br-stage');

    function fit() {
        var r = tile.getBoundingClientRect();
        var s = Math.min(r.width / 1200, r.height / 900);
        stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    }
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(tile);
    fit();

    var gsap = window.gsap;
    if (!gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var q = function (sel) { return tile.querySelector(sel); };
    var screens = tile.querySelectorAll('.br-screen');
    var tap = q('.br-tap');
    var panel = q('.br-panel-screen');
    var sleep = q('.br-sleep'), alexa = q('.br-alexa');
    var glow = q('.br-glow');

    // A soft tap on the phone's primary button (positions in phone-screen pixels)
    function tapAt(tl, at, x, y) {
        tl.set(tap, { left: x, top: y }, at)
            .fromTo(tap, { scale: 0.4, opacity: 0.7 }, { scale: 1.4, opacity: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, at);
    }
    function show(tl, at, i) {
        tl.to(screens, { opacity: 0, x: -20, duration: 0.35, ease: 'power2.in' }, at)
            .fromTo(screens[i], { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, at + 0.3);
    }

    var tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, paused: true });
    tl.set(screens, { opacity: 0, x: 0 }, 0)
        .set(screens[0], { opacity: 1 }, 0)
        .set(panel, { opacity: 1 }, 0)
        .set(alexa, { opacity: 0 }, 0)
        .set(sleep, { opacity: 1 }, 0)
        .set(glow, { opacity: 0.2, scale: 0.92 }, 0);

    // Connect the device → Alexa is enabled; the control's screen answers with Alexa's ring
    tapAt(tl, 1.6, 154, 610);
    show(tl, 1.8, 1);
    tl.to(sleep, { opacity: 0, duration: 0.4 }, 2.2)
        .fromTo(alexa, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)', immediateRender: false }, 2.3)
        .to(alexa, { opacity: 0, duration: 0.5 }, 3.9);

    // Assign a scene → setup completes, and the control wakes to its real home screen
    tapAt(tl, 4.0, 154, 610);
    show(tl, 4.2, 2);
    tapAt(tl, 5.8, 154, 560);
    show(tl, 6.2, 3);
    tl.to(panel, { opacity: 0, duration: 0.9, ease: 'sine.inOut' }, 6.3)
        .to(glow, { opacity: 0.9, scale: 1.06, duration: 2, ease: 'sine.inOut' }, 6.3);

    // Hold, then rest back to the start
    tl.to(panel, { opacity: 1, duration: 0.8, ease: 'sine.inOut' }, 11.2)
        .to(glow, { opacity: 0.2, scale: 0.92, duration: 1.2 }, 11.2);
    show(tl, 11.4, 0);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            entries[0].isIntersecting ? tl.play() : tl.pause();
        }, { threshold: 0.2 }).observe(tile);
    } else {
        tl.play();
    }
})();
