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
    var sleep = q('.br-sleep'), alexa = q('.br-alexa'), home = q('.br-home'), sceneOn = q('.br-scene-on');
    var sliders = tile.querySelectorAll('.br-slider i');
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
        .set([alexa, home, sceneOn], { opacity: 0 }, 0)
        .set(sleep, { opacity: 1 }, 0)
        .set(sliders, { height: '18%' }, 0)
        .set(glow, { opacity: 0.15, scale: 0.9 }, 0);

    // Connect the device → Alexa is enabled; the panel's Alexa ring pulses
    tapAt(tl, 1.6, 154, 610);
    show(tl, 1.8, 1);
    tl.to(sleep, { opacity: 0, duration: 0.4 }, 2.2)
        .fromTo(alexa, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)', immediateRender: false }, 2.3)
        .to(alexa, { opacity: 0, duration: 0.5 }, 3.8)
        .to(home, { opacity: 1, duration: 0.6 }, 4.1);

    // Assign a double-tap scene → the lights rise and the room warms
    tapAt(tl, 4.0, 154, 610);
    show(tl, 4.2, 2);
    tapAt(tl, 5.8, 154, 560);
    tl.to(sliders, { height: function (i) { return i ? '58%' : '72%'; }, duration: 1.4, ease: 'power2.inOut', stagger: 0.12 }, 6.0)
        .to(glow, { opacity: 1, scale: 1.08, duration: 1.8, ease: 'sine.inOut' }, 6.0)
        .to(sceneOn, { opacity: 1, duration: 0.5 }, 6.4);
    show(tl, 6.2, 3);

    // Hold the finished room, then rest back to the start
    tl.to([home, sceneOn], { opacity: 0, duration: 0.6 }, 10.0)
        .to(sliders, { height: '18%', duration: 1.0, ease: 'power2.inOut' }, 10.0)
        .to(glow, { opacity: 0.15, scale: 0.9, duration: 1.2 }, 10.0)
        .to(sleep, { opacity: 1, duration: 0.6 }, 10.6);
    show(tl, 10.4, 0);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            entries[0].isIntersecting ? tl.play() : tl.pause();
        }, { threshold: 0.2 }).observe(tile);
    } else {
        tl.play();
    }
})();
