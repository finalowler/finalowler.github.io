// Slack × Salesforce homepage tile: a message is posted from Slack into the Salesforce record.
(function () {
    var tile = document.querySelector('.sf-tile');
    if (!tile) return;
    var stage = tile.querySelector('.sf-stage');

    function fit() {
        var r = tile.getBoundingClientRect();
        var s = Math.min(r.width / 1200, r.height / 900);
        stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    }
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(tile);
    fit();

    var post = tile.querySelector('.sf-post');
    var gsap = window.gsap;
    if (!gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        post.style.opacity = 1;
        return;
    }

    var target = tile.querySelector('.sl-target');
    var menu = tile.querySelector('.sl-menu');
    var pick = menu.querySelector('.on');
    var flyer = tile.querySelector('.sf-flyer');

    var tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true, defaults: { ease: 'power2.out' } });
    tl.set([menu, flyer, post], { autoAlpha: 0 }, 0)
        .set(flyer, { x: 0, y: 0, scale: 1 }, 0)
        .call(function () { target.classList.remove('hl'); }, null, 0)
        // Hover the message, open its menu, choose Post to Salesforce record
        .call(function () { target.classList.add('hl'); }, null, 0.8)
        .fromTo(menu, { autoAlpha: 0, scale: 0.96, y: -6, transformOrigin: '100% 0%' }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.35 }, 1.3)
        .fromTo(pick, { scale: 1 }, { scale: 0.97, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 2.3)
        .to(menu, { autoAlpha: 0, duration: 0.2, ease: 'sine.in' }, 2.6)
        // The message lifts out of Slack and glides into the record
        .fromTo(flyer, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.3 }, 2.6)
        .to(flyer, {
            keyframes: [
                { x: 240, y: -110, duration: 0.6, ease: 'sine.out' },
                { x: 470, y: 44, duration: 0.6, ease: 'sine.inOut' },
            ],
        }, 2.85)
        .fromTo(post, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45 }, 4.0)
        .to(flyer, { autoAlpha: 0, duration: 0.3, ease: 'sine.in' }, 4.0)
        .call(function () { target.classList.remove('hl'); }, null, 4.2)
        .to(post, { autoAlpha: 0, duration: 0.5, ease: 'sine.in' }, 7.6);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            entries[0].isIntersecting ? tl.play() : tl.pause();
        }, { threshold: 0.2 }).observe(tile);
    } else {
        tl.play();
    }
})();
