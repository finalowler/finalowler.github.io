// Long-form case studies (Samaya, Amity): pinned scenes and a chapter stage that swaps media as the story scrolls.
(function () {
    var root = document.documentElement;
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    var motion = root.classList.contains('js') && gsap && ScrollTrigger;

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function splitWords(el) {
        var words = el.textContent.trim().split(/\s+/);
        el.textContent = '';
        return words.map(function (w, i) {
            var s = document.createElement('span');
            s.className = 'word';
            s.textContent = w;
            el.appendChild(s);
            if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
            return s;
        });
    }

    function splitChars(el) {
        var chars = [];
        splitWords(el).forEach(function (w) {
            var text = w.textContent;
            w.textContent = '';
            Array.from(text).forEach(function (c) {
                var s = document.createElement('span');
                s.className = 'char';
                s.textContent = c;
                w.appendChild(s);
                chars.push(s);
            });
        });
        return chars;
    }

    // -----------------------------------------------------------------
    // Chapter stage (works with or without GSAP)
    // -----------------------------------------------------------------

    var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
    var items = Array.prototype.slice.call(document.querySelectorAll('.stage-item'));
    var counter = document.querySelector('.stage-current');
    var active = -1;

    if (motion) {
        gsap.set(items, { autoAlpha: 0 });
        items.forEach(function (it) { it.classList.add('active'); });
    }

    function show(i) {
        if (i === active || !items[i]) return;
        var prev = active;
        active = i;

        chapters.forEach(function (c, k) { c.classList.toggle('active', k === i); });
        if (counter) counter.textContent = pad(i + 1);

        items.forEach(function (it, k) {
            var v = it.querySelector('video');
            if (!v) return;
            if (k === i) {
                try { v.currentTime = 0; } catch (e) {}
                var p = v.play();
                if (p && p.catch) p.catch(function () {});
            } else {
                v.pause();
            }
        });

        if (!motion) {
            items.forEach(function (it, k) { it.classList.toggle('active', k === i); });
            return;
        }

        var inn = items[i];
        var dir = prev < 0 || i > prev ? 1 : -1;
        gsap.killTweensOf(items);
        items.forEach(function (it, k) {
            if (k !== i && k !== prev) gsap.set(it, { autoAlpha: 0, zIndex: 0 });
        });

        gsap.set(inn, { autoAlpha: 1, zIndex: 2, scale: 1 });
        gsap.fromTo(inn,
            { clipPath: dir > 0 ? 'inset(100% 0% 0% 0% round 12px)' : 'inset(0% 0% 100% 0% round 12px)' },
            { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.1, ease: 'expo.inOut' });
        gsap.fromTo(inn.querySelector('video, img'),
            { scale: 1.14, yPercent: 6 * dir },
            { scale: 1, yPercent: 0, duration: 1.5, ease: 'expo.out' });

        if (prev >= 0) {
            var out = items[prev];
            gsap.set(out, { zIndex: 1 });
            gsap.to(out, { scale: 0.92, autoAlpha: 0, duration: 1, ease: 'expo.inOut' });
        }
    }

    if (chapters.length && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) show(chapters.indexOf(e.target));
            });
        }, { rootMargin: '-45% 0px -45% 0px' });
        chapters.forEach(function (c) { io.observe(c); });
    }
    show(0);

    if (!motion) return;

    var EXPO = 'expo.out';
    var mm = gsap.matchMedia();

    // The stage itself arrives by opening out of a narrow frame
    var frame = document.querySelector('.stage-frame');
    if (frame) {
        gsap.fromTo(frame, { clipPath: 'inset(10% 12% 10% 12% round 12px)', scale: 0.96 }, {
            clipPath: 'inset(0% 0% 0% 0% round 12px)',
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: '.sm-story', start: 'top 90%', end: 'top 20%', scrub: 0.9 },
        });
    }

    // -----------------------------------------------------------------
    // Opening statement lights up word by word
    // -----------------------------------------------------------------

    document.querySelectorAll('.sm-statement').forEach(function (statement) {
        gsap.fromTo(splitWords(statement), { opacity: 0.12 }, {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true },
        });
    });

    // Voices: each testimony surfaces out of a soft blur, alternating sides
    document.querySelectorAll('.voice').forEach(function (v, i) {
        gsap.from(v, {
            autoAlpha: 0,
            y: 80,
            x: (i % 2 ? 1 : -1) * 40,
            filter: 'blur(14px)',
            duration: 1.6,
            ease: EXPO,
            scrollTrigger: { trigger: v, start: 'top 88%', once: true },
        });
    });

    // -----------------------------------------------------------------
    // The question: pinned while the context behind it gathers around
    // -----------------------------------------------------------------

    var qPin = document.querySelector('.q-pin');
    if (qPin) {
        var qText = qPin.querySelector('.q-text');
        var tags = qPin.querySelectorAll('.q-tag');
        var caption = qPin.querySelector('.q-caption');
        var kicker = qPin.querySelector('.sm-kicker');

        mm.add('(min-width: 861px)', function () {
            var tl = gsap.timeline({
                scrollTrigger: { trigger: qPin, start: 'top top', end: '+=170%', pin: true, scrub: 0.8 },
            });
            tl.from(kicker, { autoAlpha: 0, y: 20, duration: 0.3 })
                .from(qText, { scale: 1.18, autoAlpha: 0, filter: 'blur(12px)', duration: 0.8, ease: 'power2.out' }, 0)
                .from(tags, {
                    autoAlpha: 0,
                    scale: 0.8,
                    y: 40,
                    filter: 'blur(8px)',
                    duration: 0.6,
                    stagger: 0.32,
                    ease: 'power3.out',
                }, 0.6)
                .to(qText, { scale: 0.92, duration: 1.6, ease: 'none' }, 0.6)
                .from(caption, { autoAlpha: 0, y: 24, duration: 0.5 }, '-=0.3')
                .to({}, { duration: 0.4 });

            tags.forEach(function (t, i) {
                gsap.to(t, {
                    x: (i % 2 ? 1 : -1) * 18,
                    y: (i < 2 ? -1 : i > 3 ? 1 : 0) * 14,
                    duration: 3 + i * 0.4,
                    ease: 'sine.inOut',
                    repeat: -1,
                    yoyo: true,
                });
            });
        });

        mm.add('(max-width: 860px)', function () {
            gsap.from([kicker, qText], { autoAlpha: 0, y: 30, duration: 1.2, ease: EXPO, stagger: 0.1, scrollTrigger: { trigger: qPin, start: 'top 80%', once: true } });
            gsap.from(tags, { autoAlpha: 0, y: 20, duration: 1, ease: EXPO, stagger: 0.08, scrollTrigger: { trigger: qPin.querySelector('.q-tags'), start: 'top 85%', once: true } });
            gsap.from(caption, { autoAlpha: 0, y: 20, duration: 1, ease: EXPO, scrollTrigger: { trigger: caption, start: 'top 90%', once: true } });
        });
    }

    // -----------------------------------------------------------------
    // Principles: pinned, each one rises in letter by letter and lifts away
    // -----------------------------------------------------------------

    var prPin = document.querySelector('.pr-pin');
    if (prPin) {
        var principles = prPin.querySelectorAll('.principle');
        var sets = [];
        principles.forEach(function (p) {
            var word = p.querySelector('.principle-word');
            word.classList.add('split-mask');
            sets.push({ num: p.querySelector('.principle-num'), chars: splitChars(word) });
        });

        sets.forEach(function (s, i) {
            if (i === 0) return;
            gsap.set(s.chars, { yPercent: 115 });
            gsap.set(s.num, { autoAlpha: 0 });
        });

        var ptl = gsap.timeline({
            scrollTrigger: { trigger: prPin, start: 'top top', end: '+=' + principles.length * 70 + '%', pin: true, scrub: 0.6 },
        });
        ptl.to({}, { duration: 0.5 });
        sets.forEach(function (s, i) {
            if (i === 0) return;
            var prev = sets[i - 1];
            // Outgoing word fully clears before the next one rises, so they never overlap
            ptl.to(prev.chars, { yPercent: -115, autoAlpha: 0, stagger: 0.012, duration: 0.4, ease: 'power2.in' })
                .to(prev.num, { autoAlpha: 0, y: -10, duration: 0.3 }, '<')
                .fromTo(s.chars, { yPercent: 115, autoAlpha: 1 }, { yPercent: 0, stagger: 0.02, duration: 0.6, ease: 'power3.out' })
                .fromTo(s.num, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.3 }, '<')
                .to({}, { duration: 0.5 });
        });

        gsap.from(prPin.querySelector('.sm-kicker'), { autoAlpha: 0, y: 20, duration: 1, ease: EXPO, scrollTrigger: { trigger: prPin, start: 'top 75%', once: true } });
        gsap.from(sets[0].chars, { yPercent: 115, stagger: 0.03, duration: 1.3, ease: EXPO, scrollTrigger: { trigger: prPin, start: 'top 65%', once: true } });
    }

    // -----------------------------------------------------------------
    // Brand motion and impact
    // -----------------------------------------------------------------

    var heading = document.querySelector('.sm-heading');
    if (heading) {
        gsap.from(splitChars(heading), { yPercent: 115, stagger: 0.02, duration: 1.3, ease: EXPO, scrollTrigger: { trigger: heading, start: 'top 85%', once: true } });
        gsap.from('.sm-motion .sm-kicker, .sm-sub', { autoAlpha: 0, y: 24, duration: 1.2, ease: EXPO, stagger: 0.1, scrollTrigger: { trigger: heading, start: 'top 85%', once: true } });
    }

    document.querySelectorAll('.sm-clip').forEach(function (clip, i) {
        gsap.timeline({ scrollTrigger: { trigger: clip, start: 'top 95%', end: 'top 45%', scrub: 0.9 } })
            .fromTo(clip, { clipPath: 'inset(16% 10% 16% 10% round 8px)', y: 60 + i * 50 }, { clipPath: 'inset(0% 0% 0% 0% round 8px)', y: 0, ease: 'none' });
    });

    document.querySelectorAll('.stat').forEach(function (stat, i) {
        var num = stat.querySelector('.stat-num');
        var target = +num.dataset.count;
        var prefix = num.dataset.prefix || '';
        var suffix = num.dataset.suffix || '';
        var o = { v: 0 };
        num.textContent = prefix + '0' + suffix;
        gsap.to(o, {
            v: target,
            duration: 2.2,
            delay: i * 0.15,
            ease: 'power3.out',
            onUpdate: function () { num.textContent = prefix + Math.round(o.v).toLocaleString('en-US') + suffix; },
            scrollTrigger: { trigger: stat, start: 'top 85%', once: true },
        });
        gsap.from(stat.querySelector('p'), { autoAlpha: 0, y: 24, duration: 1.2, delay: 0.3 + i * 0.15, ease: EXPO, scrollTrigger: { trigger: stat, start: 'top 85%', once: true } });
    });
    gsap.from('.sm-impact .sm-kicker, .stat-note', { autoAlpha: 0, y: 20, duration: 1, ease: EXPO, scrollTrigger: { trigger: '.sm-impact', start: 'top 80%', once: true } });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
