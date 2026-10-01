// Snowday AI homepage tile: tap "Ask Snowy", the chat sheet rises, and the real
// conversation from the product plays out, ending on Snowy's recommendations.
(function () {
    var tile = document.querySelector('.sd-tile');
    if (!tile) return;
    var stage = tile.querySelector('.sd-stage');

    function fit() {
        var r = tile.getBoundingClientRect();
        var s = Math.min(r.width / 1200, r.height / 900);
        stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    }
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(tile);
    fit();

    var gsap = window.gsap;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!gsap || reduce) return; // the home screen is a complete still on its own

    var sheet = tile.querySelector('.sd-sheet');
    var inner = tile.querySelector('.sd-chat-inner');
    var view = tile.querySelector('.sd-chat');
    var input = tile.querySelector('.sd-input');
    var result = tile.querySelector('.sd-result');
    // Everything in the chat, in order: messages, typing indicators, and the result card
    var items = [].slice.call(inner.children);

    // Keep the newest message resting just above the input, like a real chat
    function settle(el) {
        var bottom = el.offsetTop + el.offsetHeight + 10;
        return Math.min(0, view.clientHeight - bottom);
    }

    var tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, paused: true, defaults: { ease: 'power2.out' } });
    tl.set(sheet, { yPercent: 102, autoAlpha: 1 }, 0)
        .set(inner, { y: 0 }, 0)
        .set(items, { display: 'none', autoAlpha: 0 }, 0)
        // Tap the input; the sheet rises
        .to(input, { boxShadow: 'inset 0 0 0 2px #76a9e6, 0 0 0 6px rgba(118,169,230,0.25)', duration: 0.3, yoyo: true, repeat: 1 }, 1.6)
        .to(sheet, { yPercent: 0, duration: 0.9, ease: 'expo.out' }, 2.1);

    var at = 2.8;
    items.forEach(function (el) {
        var isTyping = el.classList.contains('sd-typing');
        var isMe = el.classList.contains('me');
        tl.set(el, { display: el === result ? 'block' : 'flex' }, at)
            .fromTo(el, { autoAlpha: 0, y: 12, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, immediateRender: false }, at)
            .to(inner, { y: function () { return settle(el); }, duration: 0.6, ease: 'power2.inOut' }, at);
        var hold = isTyping ? 1.0 : isMe ? 1.1 : 1.6;
        if (isTyping) tl.set(el, { display: 'none' }, at + hold);
        at += hold;
    });

    tl.to(sheet, { yPercent: 102, duration: 0.8, ease: 'power2.in' }, at + 2.4);

    // Sparse, slow snow behind the phone
    var canvas = tile.querySelector('.sd-snow');
    var ctx = canvas.getContext('2d');
    var flakes = [];
    for (var i = 0; i < 46; i++) {
        flakes.push({ x: Math.random() * 1200, y: Math.random() * 900, r: 1 + Math.random() * 2.4, v: 6 + Math.random() * 14, d: Math.random() * Math.PI * 2 });
    }
    var visible = false, last = performance.now();
    function snow(now) {
        var dt = Math.min(64, now - last) / 1000;
        last = now;
        ctx.clearRect(0, 0, 1200, 900);
        flakes.forEach(function (f) {
            f.y += f.v * dt;
            f.d += dt * 0.6;
            var x = f.x + Math.sin(f.d) * 12;
            if (f.y > 910) { f.y = -10; f.x = Math.random() * 1200; }
            ctx.fillStyle = 'rgba(235, 243, 255,' + (0.25 + f.r * 0.12).toFixed(2) + ')';
            ctx.beginPath(); ctx.arc(x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
        });
    }
    gsap.ticker.add(function () { if (visible) snow(performance.now()); });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            if (visible) { last = performance.now(); tl.play(); } else { tl.pause(); }
        }, { threshold: 0.2 }).observe(tile);
    } else {
        visible = true;
        tl.play();
    }
})();
