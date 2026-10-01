(function () {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Nav gets a backdrop once you leave the top of the page
    var nav = document.querySelector('.nav');
    function onScroll() {
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Fade/rise elements in as they enter the viewport
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        reveals.forEach(function (el) { revealObserver.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('in'); });
    }

    // Only play videos while they're on screen
    var videos = document.querySelectorAll('video');
    videos.forEach(function (v) {
        v.muted = true;
        v.setAttribute('playsinline', '');
    });
    if ('IntersectionObserver' in window) {
        var videoObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var v = entry.target;
                if (entry.isIntersecting) {
                    var p = v.play();
                    if (p && p.catch) p.catch(function () {});
                } else {
                    v.pause();
                }
            });
        }, { threshold: 0.2 });
        videos.forEach(function (v) { videoObserver.observe(v); });
    }

    // Heavy hover GIFs load on first hover, not on page load
    document.querySelectorAll('.project-card').forEach(function (card) {
        var hover = card.querySelector('.hover-media[data-src]');
        if (!hover) return;
        card.addEventListener('mouseenter', function () {
            if (hover.src) return;
            hover.onload = function () { hover.classList.add('loaded'); };
            hover.src = hover.dataset.src;
        });
    });

    // Gentle parallax on homepage media
    var media = document.querySelectorAll('.card-media');
    if (media.length && !reduceMotion) {
        var ticking = false;
        function updateParallax() {
            var vh = window.innerHeight;
            media.forEach(function (m) {
                var r = m.getBoundingClientRect();
                if (r.bottom < 0 || r.top > vh) return;
                var progress = (r.top + r.height / 2 - vh / 2) / vh; // -1 .. 1
                m.style.setProperty('--parallax', (progress * -28).toFixed(1) + 'px');
            });
            ticking = false;
        }
        window.addEventListener('scroll', function () {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateParallax);
            }
        }, { passive: true });
        updateParallax();
    }
})();
