(function () {
    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ---------------------------------------------------------------------
    // Always-on behaviour (also the no-GSAP / reduced-motion fallback)
    // ---------------------------------------------------------------------

    var nav = document.querySelector('.nav');
    function onScroll() {
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Email is assembled at runtime so the address never appears in the page source
    // The address stays written as "name [at] domain [dot] com" on the page and is only
    // assembled into a real mailto link at the moment someone clicks it
    document.querySelectorAll('[data-user][data-domain]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = 'mailto:' + a.dataset.user + '\u0040' + a.dataset.domain;
        });
    });

    // Only play videos while they're on screen
    // (the Samaya chapter stage and the Motorex tile manage their own playback)
    var videos = Array.prototype.filter.call(document.querySelectorAll('video'), function (v) { return !v.closest('.stage-frame, .mx-photo') && !v.classList.contains('hover-media'); });
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

    // Hover previews load on first hover (not on page load) and only play while hovered
    document.querySelectorAll('.project-card').forEach(function (card) {
        var hover = card.querySelector('.hover-media[data-src]');
        if (!hover) return;
        card.addEventListener('mouseenter', function () {
            if (!hover.getAttribute('src')) {
                hover.addEventListener('loadeddata', function () { hover.classList.add('loaded'); }, { once: true });
                hover.src = hover.dataset.src;
            }
            var p = hover.play();
            if (p && p.catch) p.catch(function () {});
        });
        card.addEventListener('mouseleave', function () { hover.pause(); });
    });

    function fallbackReveal() {
        var reveals = document.querySelectorAll('.reveal');
        if (!('IntersectionObserver' in window) || reduceMotion) {
            reveals.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        reveals.forEach(function (el) { io.observe(el); });
    }

    if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
        root.classList.remove('js');
        fallbackReveal();
        return;
    }

    // ---------------------------------------------------------------------
    // Motion system
    // ---------------------------------------------------------------------

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    var morphed = root.classList.contains('vt'); // arrived via a cross-page view transition
    var EXPO = 'expo.out';

    // GSAP owns every reveal from here on
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.remove('reveal'); });

    // Smooth scroll, driven by GSAP's ticker so scrubbed timelines stay in lockstep
    var lenis = null;
    if (window.Lenis) {
        lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
        window.siteScroll = lenis;
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
    }

    // In-page anchors glide instead of jumping
    document.querySelectorAll('a[href*="#"]').forEach(function (a) {
        var url = new URL(a.href, location.href);
        if (url.pathname !== location.pathname) return;
        a.addEventListener('click', function (e) {
            var target = url.hash === '#top' ? 0 : document.querySelector(url.hash);
            if (target === null) return;
            e.preventDefault();
            if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: function (x) { return 1 - Math.pow(1 - x, 4); } });
            else window.scrollTo({ top: target === 0 ? 0 : target.offsetTop, behavior: 'smooth' });
        });
    });

    // Split text into words and characters, keeping <em>/<br> structure intact
    function split(el, mode) {
        var out = [];
        (function walk(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (n) {
                if (n.nodeType === 3) {
                    var frag = document.createDocumentFragment();
                    n.textContent.split(/(\s+)/).forEach(function (part) {
                        if (!part) return;
                        if (/^\s+$/.test(part)) {
                            frag.appendChild(document.createTextNode(' '));
                            return;
                        }
                        var word = document.createElement('span');
                        word.className = 'word';
                        if (mode === 'chars') {
                            Array.from(part).forEach(function (c) {
                                var ch = document.createElement('span');
                                ch.className = 'char';
                                ch.textContent = c;
                                word.appendChild(ch);
                                out.push(ch);
                            });
                        } else {
                            word.textContent = part;
                            out.push(word);
                        }
                        frag.appendChild(word);
                    });
                    n.parentNode.replaceChild(frag, n);
                } else if (n.nodeType === 1 && n.tagName !== 'BR') {
                    walk(n);
                }
            });
        })(el);
        return out;
    }

    // Letters rise from behind their baseline the first time a heading enters
    function riseOnEnter(el, opts) {
        if (!el) return;
        opts = opts || {};
        var chars = split(el, 'chars');
        gsap.set(chars, { yPercent: 115, rotate: 4, transformOrigin: '0% 100%' });
        gsap.to(chars, {
            yPercent: 0,
            rotate: 0,
            duration: 1.3,
            ease: EXPO,
            stagger: opts.stagger || 0.022,
            scrollTrigger: { trigger: el, start: opts.start || 'top 85%', once: true },
        });
    }

    // Children drift up and in, staggered
    function liftOnEnter(trigger, targets, opts) {
        if (!targets || !targets.length) return;
        opts = opts || {};
        gsap.from(targets, {
            y: opts.y || 40,
            autoAlpha: 0,
            duration: 1.2,
            ease: EXPO,
            stagger: opts.stagger || 0.08,
            delay: opts.delay || 0,
            scrollTrigger: { trigger: trigger, start: opts.start || 'top 82%', once: true },
        });
    }

    // Media opens from a cropped frame and settles from a zoom, tied to scroll
    function openMedia(frame, mediaEls, opts) {
        opts = opts || {};
        gsap.timeline({
            scrollTrigger: { trigger: frame, start: 'top 98%', end: opts.end || 'top 30%', scrub: 0.9 },
        })
            .fromTo(frame,
                { clipPath: 'inset(14% 9% 14% 9% round 6px)' },
                { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'none' }, 0)
            .fromTo(mediaEls, { '--s': opts.scale || 1.32 }, { '--s': 1, ease: 'none' }, 0);
    }

    // ----- Nav: enters with the intro, tucks away on scroll down, returns on scroll up
    var navItems = nav ? nav.querySelectorAll('.nav-name, .nav-links a') : [];
    ScrollTrigger.create({
        start: 'top -120',
        onUpdate: function (self) {
            gsap.to(nav, { yPercent: self.direction > 0 ? -110 : 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
        },
        onLeaveBack: function () {
            gsap.to(nav, { yPercent: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
        },
    });

    // ---------------------------------------------------------------------
    // Homepage storyline
    // ---------------------------------------------------------------------

    var hero = document.querySelector('.hero');
    if (hero) {
        var h1 = hero.querySelector('h1');
        var lines = h1.querySelectorAll('.line > span');
        var chars = [];
        lines.forEach(function (l) { chars = chars.concat(split(l, 'chars')); });
        var foot = hero.querySelector('.hero-foot');
        var footBits = foot.querySelectorAll('p');
        var meshWrap = hero.querySelector('.hero-mesh-wrap');
        var mesh = hero.querySelector('.hero-mesh');

        // 1 · Intro: gradient blooms, letters rise, the rule draws, copy settles
        gsap.set([nav, h1, foot], { visibility: 'visible' });
        if (!morphed) {
            gsap.timeline({ defaults: { ease: EXPO } })
                .from(meshWrap, { scale: 1.25, autoAlpha: 0, duration: 2.6 }, 0)
                .from(chars, { yPercent: 115, rotate: 5, transformOrigin: '0% 100%', duration: 1.5, stagger: 0.028 }, 0.25)
                .from(footBits, { y: 24, autoAlpha: 0, duration: 1.2, stagger: 0.1 }, 1.0)
                .from(navItems, { y: -16, autoAlpha: 0, duration: 1, stagger: 0.06 }, 1.1);
        }

        // 2 · Exit: lines peel apart at different speeds and blur out; the gradient sinks into the dark
        var exit = gsap.timeline({
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
        });
        h1.querySelectorAll('.line').forEach(function (line, i) {
            exit.to(line, { yPercent: -70 - i * 45, ease: 'none' }, 0);
        });
        exit.to(h1, { autoAlpha: 0, filter: 'blur(10px)', ease: 'power1.in' }, 0)
            .to(foot, { y: -60, autoAlpha: 0, ease: 'power1.in' }, 0)
            .to(mesh, { opacity: 0.12, yPercent: 18, scale: 1.1, ease: 'none' }, 0);
    }

    // 3 · Work: the title rises, then each card opens as it arrives
    riseOnEnter(document.querySelector('.work-title'));

    document.querySelectorAll('.project-card').forEach(function (card) {
        var frame = card.querySelector('.card-media');
        var media = frame.querySelectorAll('img, video');
        openMedia(frame, frame, { scale: card.classList.contains('featured') ? 1.2 : 1.32 });
        liftOnEnter(card.querySelector('.card-info'), card.querySelectorAll('.card-title, .card-cta, .card-desc'), { y: 30, stagger: 0.07, start: 'top 92%' });

        card.addEventListener('mouseenter', function () {
            gsap.to(frame, { '--h': 1.06, duration: 1.4, ease: EXPO });
        });
        card.addEventListener('mouseleave', function () {
            gsap.to(frame, { '--h': 1, duration: 1.2, ease: EXPO });
        });
    });

    // Right-hand column floats at a different speed for depth
    var mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', function () {
        document.querySelectorAll('.work-grid > .project-card:not(.featured)').forEach(function (card, i) {
            if (i % 2 === 0) return;
            gsap.fromTo(card, { y: 90 }, {
                y: -90,
                ease: 'none',
                scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
            });
        });
    });

    // 4 · About: the photo opens, and the lede lights up word by word as you read
    var about = document.querySelector('.about');
    if (about) {
        var photo = about.querySelector('.about-photo');
        gsap.timeline({ scrollTrigger: { trigger: photo, start: 'top 95%', end: 'top 25%', scrub: 0.9 } })
            .fromTo(photo, { clipPath: 'inset(100% 0% 0% 0% round 6px)' }, { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'none' }, 0)
            .fromTo(photo.querySelector('img'), { scale: 1.35 }, { scale: 1, ease: 'none' }, 0);

        var lede = about.querySelector('.about-lede');
        var words = split(lede, 'words');
        gsap.fromTo(words, { opacity: 0.14 }, {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: lede, start: 'top 82%', end: 'bottom 50%', scrub: true },
        });

        liftOnEnter(about, about.querySelectorAll(':scope > .eyebrow'));
        liftOnEnter(about.querySelector('.about-body > p:not(.about-lede)'), about.querySelectorAll('.about-body > p:not(.about-lede):not(.hobbies)'));
        var creds = about.querySelectorAll('.creds li');
        liftOnEnter(about.querySelector('.creds'), creds, { y: 24, stagger: 0.1 });
        liftOnEnter(about.querySelector('.hobbies'), about.querySelectorAll('.hobbies'), { y: 30 });
    }

    // ---------------------------------------------------------------------
    // Case-study storyline
    // ---------------------------------------------------------------------

    var project = document.querySelector('.case .project');
    if (project) {
        gsap.set(project, { visibility: 'visible' });
        var title = project.querySelector('.hero-text');
        var intro = gsap.timeline({ defaults: { ease: EXPO }, delay: morphed ? 0.5 : 0.1 });
        if (!morphed) {
            var tChars = split(title, 'chars');
            intro.from(tChars, { yPercent: 115, rotate: 5, transformOrigin: '0% 100%', duration: 1.4, stagger: 0.03 }, 0)
                .from(navItems, { y: -16, autoAlpha: 0, duration: 1, stagger: 0.06 }, 0.5);
        }
        intro.from(project.querySelectorAll('.project-left > p'), { y: 30, autoAlpha: 0, duration: 1.2 }, 0.35)
            .from(project.querySelectorAll('.project-details-box'), { y: 20, autoAlpha: 0, duration: 1, stagger: 0.08 }, 0.45);

        // The lead image breathes out of its zoom as you scroll past it
        var lead = document.querySelector('.project + .project-image');
        if (lead) {
            gsap.fromTo(lead.querySelectorAll('img, video'), { scale: 1.12 }, {
                scale: 1,
                ease: 'none',
                scrollTrigger: { trigger: lead, start: 'top 85%', end: 'bottom top', scrub: true },
            });
        }

        document.querySelectorAll('.case .project-image').forEach(function (block) {
            if (block === lead) return;
            block.querySelectorAll('img, video').forEach(function (m) {
                var w = document.createElement('div');
                w.className = 'media-frame';
                w.style.cssText = 'overflow:hidden;border-radius:6px;flex:' + (m.classList.contains('vertical') ? '1 1 0;max-width:420px' : '1 1 100%') + ';min-width:0';
                m.parentNode.insertBefore(w, m);
                w.appendChild(m);
                m.style.transform = 'scale(var(--s, 1))';
                openMedia(w, w, { scale: 1.22, end: 'top 40%' });
            });
        });

        document.querySelectorAll('.case .project-text').forEach(function (section) {
            liftOnEnter(section, section.querySelectorAll('.project-text-left h3'), { y: 50 });
            liftOnEnter(section, section.querySelectorAll('.project-text-right > *'), { y: 30, stagger: 0.06, delay: 0.1 });
        });

        var next = document.querySelector('.next-project');
        if (next) {
            liftOnEnter(next, next.querySelectorAll('.eyebrow'));
            riseOnEnter(next.querySelector('.next-title'), { start: 'top 90%' });
        }
    }

    // ---------------------------------------------------------------------
    // 5 · Finale: the gradient returns and the sign-off rises out of it
    // ---------------------------------------------------------------------

    var footer = document.querySelector('.footer');
    if (footer) {
        var fMesh = footer.querySelector('.footer-mesh');
        if (fMesh) {
            gsap.fromTo(fMesh, { opacity: 0, scale: 1.3, yPercent: 20 }, {
                opacity: 1,
                scale: 1,
                yPercent: 0,
                ease: 'none',
                scrollTrigger: { trigger: footer, start: 'top bottom', end: 'bottom bottom', scrub: true },
            });
        }
        riseOnEnter(footer.querySelector('.display'), { start: 'top 80%', stagger: 0.03 });
        liftOnEnter(footer, footer.querySelectorAll('.footer-email, .footer-base'), { start: 'top 70%', stagger: 0.12, delay: 0.2 });

        // Magnetic email link
        var email = footer.querySelector('.footer-email');
        if (email && finePointer) {
            var ex = gsap.quickTo(email, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
            var ey = gsap.quickTo(email, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
            email.addEventListener('mousemove', function (e) {
                var r = email.getBoundingClientRect();
                ex((e.clientX - r.left - r.width / 2) * 0.25);
                ey((e.clientY - r.top - r.height / 2) * 0.4);
            });
            email.addEventListener('mouseleave', function () { ex(0); ey(0); });
        }
    }

    // ---------------------------------------------------------------------
    // Cursor
    // ---------------------------------------------------------------------

    if (finePointer) {
        var cursor = document.createElement('div');
        cursor.className = 'cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.innerHTML = '<span>View</span>';
        document.body.appendChild(cursor);
        root.classList.add('has-cursor');

        var label = cursor.querySelector('span');
        var cx = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3.out' });
        var cy = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3.out' });
        var shown = false;

        window.addEventListener('pointermove', function (e) {
            cx(e.clientX);
            cy(e.clientY);
            if (!shown) {
                shown = true;
                gsap.set(cursor, { x: e.clientX, y: e.clientY });
                gsap.to(cursor, { opacity: 1, duration: 0.4 });
            }
        }, { passive: true });

        root.addEventListener('mouseleave', function () {
            shown = false;
            gsap.to(cursor, { opacity: 0, duration: 0.3 });
        });

        function grow(on) {
            gsap.to(cursor, { scale: on ? 1 : 0.1, duration: 0.7, ease: EXPO, overwrite: 'auto' });
            gsap.to(label, { opacity: on ? 1 : 0, duration: on ? 0.4 : 0.15, delay: on ? 0.1 : 0 });
        }
        function nudge(on) {
            gsap.to(cursor, { scale: on ? 0.3 : 0.1, duration: 0.5, ease: EXPO, overwrite: 'auto' });
        }

        document.querySelectorAll('.project-card, .next-project').forEach(function (el) {
            el.addEventListener('mouseenter', function () { grow(true); });
            el.addEventListener('mouseleave', function () { grow(false); });
        });
        document.querySelectorAll('a:not(.project-card):not(.next-project), button').forEach(function (el) {
            el.addEventListener('mouseenter', function () { nudge(true); });
            el.addEventListener('mouseleave', function () { nudge(false); });
        });
    }

    // Lazy media and web fonts shift layout; re-measure once everything has landed
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
