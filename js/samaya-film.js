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
        qa('.sx-cell').forEach(function (c) { c.textContent = c.dataset.v; c.classList.add('filled'); });
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
        .to('.sx-s1 .sx-ask', { scale: 0.42, y: -300, duration: 1, ease: 'expo.inOut' }, 2.6)
        .to('.sx-s1 .sx-sub', { autoAlpha: 0, duration: 0.3 }, 2.6);

    // Scene 2 · The query box: a prompt is typed and sent
    tl.set(scenes[1], { autoAlpha: 1 }, 2.9)
        .fromTo('.sx-query', { y: 80, scale: 0.9, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.9 }, 2.9)
        .fromTo('.sx-chips span', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.7 }, 3.2)
        .to(prompt.o, { n: prompt.len, duration: 1.8, ease: 'none', onUpdate: prompt.set, onStart: function () { prompt.o.n = 0; prompt.set(); } }, 3.3)
        .fromTo('.sx-send', { scale: 1 }, { scale: 1.25, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' }, 5.2)
        .fromTo('.sx-beam', { xPercent: -160 }, { xPercent: 480, duration: 1.1, ease: 'power2.inOut' }, 5.3)
        .to(scenes[0], { autoAlpha: 0, duration: 0.3 }, 5.4)
        .to('.sx-query', { y: -320, scale: 0.6, autoAlpha: 0, duration: 0.8, ease: 'expo.in' }, 5.4)
        .to('.sx-chips', { autoAlpha: 0, duration: 0.3 }, 5.4)
        .set(scenes[1], { autoAlpha: 0 }, 6.2);

    // Scene 3 · The agent plans, and the sources gather
    tl.set(scenes[2], { autoAlpha: 1 }, 6.0)
        .fromTo('.sx-agent', { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.9, ease: 'back.out(2)' }, 6.0)
        .fromTo('.sx-steps li', { x: 120, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.08, duration: 0.8 }, 6.2)
        .fromTo('.sx-source', {
            x: function (i) { return Math.cos(i * 1.1) * 900; },
            y: function (i) { return Math.sin(i * 1.1) * 600; },
            autoAlpha: 0, scale: 0.4,
        }, { x: 0, y: 0, autoAlpha: 1, scale: 1, stagger: 0.07, duration: 1.1 }, 6.4);
    qa('.sx-steps li').forEach(function (li, i) {
        var at = 7.1 + i * 0.55;
        tl.to(li, { backgroundColor: 'rgba(80, 110, 255, 0.16)', duration: 0.2, ease: 'none' }, at)
            .fromTo(li.querySelector('.bar'), { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power1.inOut' }, at)
            .to(li.querySelector('.ok'), { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, at + 0.45)
            .to('.sx-agent', { boxShadow: '0 0 0 ' + (14 + i * 6) + 'px rgba(80,110,255,0.18)', duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' }, at);
    });
    tl.to(scenes[2], { autoAlpha: 0, scale: 0.94, duration: 0.5, ease: 'expo.in' }, 9.5)
        .set(scenes[2], { scale: 1 }, 10.1);

    // Scene 4 · The evidence table fills, citations and honest gaps included
    tl.set(scenes[3], { autoAlpha: 1 }, 9.9)
        .fromTo('.sx-tq', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 9.9)
        .fromTo('.sx-table', { y: 60, autoAlpha: 0, rotationX: 18 }, { y: 0, autoAlpha: 1, rotationX: 0, duration: 0.9 }, 10.0);
    qa('.sx-cell').forEach(function (c, i) {
        tl.call(function () { c.textContent = ''; c.classList.remove('filled'); }, null, 9.9)
            .call(function () { c.textContent = c.dataset.v; c.classList.add('filled'); }, null, 10.5 + i * 0.12)
            .fromTo(c, { autoAlpha: 0.3 }, { autoAlpha: 1, duration: 0.25 }, 10.5 + i * 0.12);
    });
    tl.fromTo('.sx-cite', { scale: 0 }, { scale: 1, stagger: 0.08, duration: 0.4, ease: 'back.out(3)' }, 11.8)
        .to(scenes[3], { autoAlpha: 0, y: -40, duration: 0.5, ease: 'expo.in' }, 13.2)
        .set(scenes[3], { y: 0 }, 13.8);

    // Scene 5 · Kinetic type
    tl.set(scenes[4], { autoAlpha: 1 }, 13.6);
    qa('.sx-slam span').forEach(function (w, i) {
        var at = 13.6 + i * 0.55;
        tl.fromTo(w, { autoAlpha: 0, scale: 1.6, filter: 'blur(18px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'expo.out' }, at)
            .to(w, { autoAlpha: 0, scale: 0.9, duration: 0.25, ease: 'power2.in' }, at + 0.5);
    });
    tl.set(scenes[4], { autoAlpha: 0 }, 15.4);

    // Scene 6 · Lockup
    tl.set(scenes[5], { autoAlpha: 1 }, 15.3)
        .fromTo('.sx-mark', { scale: 0, rotation: 180 }, { scale: 1, rotation: 0, duration: 1, ease: 'expo.out' }, 15.3)
        .fromTo('.sx-word', { autoAlpha: 0, x: -40, letterSpacing: '0.3em' }, { autoAlpha: 1, x: 0, letterSpacing: '-0.02em', duration: 1.1 }, 15.5)
        .fromTo('.sx-s6 p', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 15.9)
        .fromTo('.sx-grid', { opacity: 1 }, { opacity: 0.4, duration: 1 }, 15.3)
        .to(scenes[5], { autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, 18.2)
        .set('.sx-beam', { xPercent: -160 }, 18.7);

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
