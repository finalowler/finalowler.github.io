// Amity case study: the card, the journey, the deck, the network, the receipts, the build.
(function () {
    var root = document.documentElement;
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    var motion = root.classList.contains('js') && gsap && ScrollTrigger;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // -----------------------------------------------------------------
    // Network graph (drawn even without motion, so the page still shows it)
    // -----------------------------------------------------------------

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.querySelector('.am-graph');
    var graph = svg ? buildGraph(svg) : null;

    function rng(seed) {
        return function () {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };
    }

    function el(name, attrs, parent) {
        var n = document.createElementNS(NS, name);
        for (var k in attrs) n.setAttribute(k, attrs[k]);
        parent.appendChild(n);
        return n;
    }

    function buildGraph(svg) {
        var rand = rng(7);
        var W = 1000, H = 620, nodes = [];
        var tries = 0;
        while (nodes.length < 74 && tries < 4000) {
            tries++;
            var p = { x: 40 + rand() * (W - 80), y: 30 + rand() * (H - 60) };
            if (nodes.every(function (q) { return Math.hypot(p.x - q.x, p.y - q.y) > 58; })) nodes.push(p);
        }
        nodes.forEach(function (n, i) {
            n.id = i;
            n.near = nodes
                .map(function (m, j) { return { j: j, d: Math.hypot(n.x - m.x, n.y - m.y) }; })
                .filter(function (o) { return o.j !== i; })
                .sort(function (a, b) { return a.d - b.d; });
        });

        var gEdges = el('g', {}, svg);
        var gHot = el('g', {}, svg);
        var gNodes = el('g', {}, svg);
        var seen = {};
        var edges = [];
        nodes.forEach(function (n) {
            n.near.slice(0, 3).forEach(function (o) {
                var key = Math.min(n.id, o.j) + '-' + Math.max(n.id, o.j);
                if (seen[key]) return;
                seen[key] = true;
                var m = nodes[o.j];
                edges.push(el('line', { class: 'edge', x1: n.x, y1: n.y, x2: m.x, y2: m.y }, gEdges));
            });
        });
        var dots = nodes.map(function (n) {
            return el('circle', { class: 'node', cx: n.x, cy: n.y, r: 3.2 }, gNodes);
        });

        // One card, five people deep: walk rightward through near neighbours
        var start = nodes.reduce(function (best, n) {
            return Math.abs(n.y - H * 0.42) < 90 && n.x < best.x ? n : best;
        }, { x: Infinity });
        var path = [start];
        while (path.length < 6) {
            var cur = path[path.length - 1];
            var next = cur.near.slice(0, 6).map(function (o) { return nodes[o.j]; })
                .filter(function (m) { return path.indexOf(m) < 0 && m.x > cur.x + 40; })
                .sort(function (a, b) { return Math.abs(a.y - H * 0.42) - Math.abs(b.y - H * 0.42); })[0];
            if (!next) break;
            path.push(next);
        }
        var hops = [];
        for (var i = 1; i < path.length; i++) {
            hops.push(el('line', { class: 'hop', x1: path[i - 1].x, y1: path[i - 1].y, x2: path[i].x, y2: path[i].y }, gHot));
        }
        var hopNodes = path.map(function (n) { return el('circle', { class: 'hop-node', cx: n.x, cy: n.y, r: 6 }, gHot); });

        // Tender cards stay close; secret notes reach across campus
        var hub = nodes.reduce(function (best, n) {
            return Math.hypot(n.x - W * 0.3, n.y - H * 0.72) < Math.hypot(best.x - W * 0.3, best.y - H * 0.72) ? n : best;
        });
        var close = hub.near.slice(0, 5).map(function (o) {
            var m = nodes[o.j];
            return el('line', { class: 'close', x1: hub.x, y1: hub.y, x2: m.x, y2: m.y }, gHot);
        });
        var src = nodes.reduce(function (best, n) {
            return Math.hypot(n.x - W * 0.62, n.y - H * 0.6) < Math.hypot(best.x - W * 0.62, best.y - H * 0.6) ? n : best;
        });
        var far = src.near.slice(-40).filter(function (_, k) { return k % 8 === 0; }).map(function (o) {
            var m = nodes[o.j];
            var mx = (src.x + m.x) / 2, my = Math.min(src.y, m.y) - 120;
            return el('path', { class: 'far', fill: 'none', d: 'M' + src.x + ' ' + src.y + ' Q' + mx + ' ' + my + ' ' + m.x + ' ' + m.y }, gHot);
        });
        var traveler = el('circle', { class: 'traveler', cx: start.x, cy: start.y, r: 7 }, gHot);

        return { dots: dots, edges: edges, hops: hops, hopNodes: hopNodes, close: close, far: far, path: path, traveler: traveler };
    }

    if (!motion) return;

    var EXPO = 'expo.out';
    var mm = gsap.matchMedia();

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

    function drawable(line) {
        var len = line.getTotalLength ? line.getTotalLength() : 0;
        gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
        return len;
    }

    // -----------------------------------------------------------------
    // 1 · The mirror card: tilts toward your cursor, flips as you scroll
    // -----------------------------------------------------------------

    var mirror = document.querySelector('.am-mirror-pin');
    if (mirror) {
        var wrap = mirror.querySelector('.am-card-wrap');
        var card = mirror.querySelector('.am-card');
        var faces = mirror.querySelectorAll('.am-face');
        var lineA = mirror.querySelector('.am-line-a');

        if (finePointer) {
            var tx = gsap.quickTo(wrap, 'rotationY', { duration: 0.8, ease: 'power3.out' });
            var ty = gsap.quickTo(wrap, 'rotationX', { duration: 0.8, ease: 'power3.out' });
            window.addEventListener('pointermove', function (e) {
                var r = wrap.getBoundingClientRect();
                if (r.bottom < 0 || r.top > innerHeight) return;
                var nx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
                var ny = (e.clientY - (r.top + r.height / 2)) / innerHeight;
                tx(nx * 22);
                ty(-ny * 18);
                faces.forEach(function (f) {
                    f.style.setProperty('--mx', (50 + nx * 120).toFixed(1) + '%');
                    f.style.setProperty('--my', (40 + ny * 120).toFixed(1) + '%');
                });
            }, { passive: true });
        }

        // Scroll brings the card up out of a tilt and holds it in view
        gsap.timeline({
            scrollTrigger: { trigger: mirror, start: 'top top', end: '+=70%', pin: true, scrub: 0.8 },
        })
            .fromTo(card, { scale: 0.72, rotationX: 38, y: 60 }, { scale: 1, rotationX: 0, y: 0, duration: 1, ease: 'power2.out' })
            .to({}, { duration: 0.4 });

        gsap.from([lineA, mirror.querySelector('.am-flip-hint')], { autoAlpha: 0, y: 24, duration: 1.2, ease: EXPO, stagger: 0.15, delay: 0.6 });

        // Hover (or tap) turns the card over to its QR side
        var flipped = false;
        function flip(on) {
            if (on === flipped) return;
            flipped = on;
            gsap.to(card, { rotationY: on ? 180 : 0, duration: 1.1, ease: 'expo.inOut', overwrite: 'auto' });
            wrap.dispatchEvent(new CustomEvent('amity:flip'));
        }
        if (finePointer) {
            wrap.addEventListener('mouseenter', function () { flip(true); });
            wrap.addEventListener('mouseleave', function () { flip(false); });
        } else {
            wrap.addEventListener('click', function () { flip(!flipped); });
        }
    }

    // -----------------------------------------------------------------
    // 2 · Words that light up as you read them
    // -----------------------------------------------------------------

    document.querySelectorAll('.am-words').forEach(function (p) {
        gsap.fromTo(splitWords(p), { opacity: 0.12 }, {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 50%', scrub: true },
        });
    });
    gsap.from('.am-why .am-kicker, .am-coda .am-kicker', { autoAlpha: 0, y: 20, duration: 1, ease: EXPO, stagger: 0.1, scrollTrigger: { trigger: '.am-why', start: 'top 80%', once: true } });

    // -----------------------------------------------------------------
    // 3 · The journey slides sideways, hand to hand
    // -----------------------------------------------------------------

    var journey = document.querySelector('.am-journey-pin');
    if (journey) {
        var track = journey.querySelector('.am-track');
        var panels = track.querySelectorAll('.am-panel');
        var current = journey.querySelector('.am-journey-current');

        mm.add('(min-width: 861px)', function () {
            var distance = function () { return track.scrollWidth - window.innerWidth; };
            var slide = gsap.to(track, {
                x: function () { return -distance(); },
                ease: 'none',
                scrollTrigger: {
                    trigger: journey,
                    start: 'top top',
                    end: function () { return '+=' + distance(); },
                    pin: true,
                    scrub: 0.8,
                    invalidateOnRefresh: true,
                    onUpdate: function (self) {
                        var i = Math.min(panels.length - 1, Math.round(self.progress * (panels.length - 1)));
                        current.textContent = (i < 9 ? '0' : '') + (i + 1);
                    },
                },
            });

            panels.forEach(function (panel) {
                var media = panel.querySelector('.am-panel-media img, .am-panel-media video');
                if (media) {
                    gsap.fromTo(media, { xPercent: -10, scale: 1.2 }, {
                        xPercent: 10,
                        scale: 1.05,
                        ease: 'none',
                        scrollTrigger: { trigger: panel, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
                    });
                }
                gsap.from(panel.querySelectorAll('.am-panel-copy > *, .am-panel-words > span'), {
                    y: 40,
                    autoAlpha: 0,
                    stagger: 0.08,
                    duration: 1,
                    ease: EXPO,
                    scrollTrigger: { trigger: panel, containerAnimation: slide, start: 'left 70%', toggleActions: 'play none none reverse' },
                });
            });
        });

        mm.add('(max-width: 860px)', function () {
            panels.forEach(function (panel) {
                gsap.from(panel, { y: 50, autoAlpha: 0, duration: 1.2, ease: EXPO, scrollTrigger: { trigger: panel, start: 'top 85%', once: true } });
            });
        });
    }

    // -----------------------------------------------------------------
    // 4 · The deck: each prompt is handed off, revealing the next
    // -----------------------------------------------------------------

    var deckPin = document.querySelector('.am-deck-pin');
    if (deckPin) {
        var cards = gsap.utils.toArray('.am-deck-card');
        cards.forEach(function (c, i) {
            gsap.set(c, { xPercent: -50, yPercent: -50, x: i * 10, y: i * -12, rotation: i * 2.5 });
        });
        var dtl = gsap.timeline({
            scrollTrigger: { trigger: deckPin, start: 'top top', end: '+=' + cards.length * 55 + '%', pin: true, scrub: 0.7 },
        });
        dtl.from(cards, { y: '+=120', autoAlpha: 0, rotation: '-=12', stagger: 0.1, duration: 0.6, ease: 'power3.out' })
            .from(deckPin.querySelectorAll('.am-deck-copy > *'), { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.5 }, 0)
            .to({}, { duration: 0.4 });
        cards.slice(0, -1).forEach(function (c, i) {
            var rest = cards.slice(i + 1);
            dtl.to(c, { x: '+=' + Math.round(window.innerWidth * 0.55), y: '-=140', rotation: 24, autoAlpha: 0, duration: 0.8, ease: 'power2.in' })
                .to(rest, { x: '-=10', y: '+=12', rotation: '-=2.5', duration: 0.6, ease: 'power2.out' }, '-=0.35')
                .to({}, { duration: 0.35 });
        });
    }

    // -----------------------------------------------------------------
    // 5 · The network: a campus maps itself
    // -----------------------------------------------------------------

    var netPin = document.querySelector('.am-network-pin');
    if (netPin && graph) {
        var caps = netPin.querySelectorAll('.am-caption');
        gsap.set(caps, { autoAlpha: 0, y: 24 });
        gsap.set(graph.dots, { scale: 0, transformOrigin: '50% 50%' });
        gsap.set(graph.edges, { opacity: 0 });
        gsap.set(graph.hopNodes, { scale: 0, transformOrigin: '50% 50%' });
        gsap.set(graph.traveler, { opacity: 0 });
        var hopLens = graph.hops.map(drawable);
        graph.close.forEach(drawable);
        graph.far.forEach(drawable);

        var ntl = gsap.timeline({
            scrollTrigger: { trigger: netPin, start: 'top top', end: '+=300%', pin: true, scrub: 0.8 },
        });

        // Everyone appears, loosely linked
        ntl.to(graph.dots, { scale: 1, duration: 0.6, stagger: { each: 0.008, from: 'random' }, ease: 'back.out(3)' })
            .to(graph.edges, { opacity: 1, duration: 0.6, stagger: { each: 0.004, from: 'random' } }, '-=0.4')
            .to(caps[0], { autoAlpha: 1, y: 0, duration: 0.3 }, 0.2)
            .to({}, { duration: 0.4 });

        // One card travels five people deep
        ntl.to(caps[0], { autoAlpha: 0, y: -24, duration: 0.3 })
            .to(caps[1], { autoAlpha: 1, y: 0, duration: 0.3 })
            .to(graph.traveler, { opacity: 1, duration: 0.1 }, '<')
            .to(graph.hopNodes[0], { scale: 1, duration: 0.2 }, '<');
        graph.hops.forEach(function (hop, i) {
            var to = graph.path[i + 1];
            ntl.to(hop, { strokeDashoffset: 0, duration: 0.35, ease: 'none' })
                .to(graph.traveler, { attr: { cx: to.x, cy: to.y }, duration: 0.35, ease: 'none' }, '<')
                .to(graph.hopNodes[i + 1], { scale: 1, duration: 0.2, ease: 'back.out(3)' });
        });
        ntl.to({}, { duration: 0.4 });

        // Tender messages stay close; secret ones reach strangers
        ntl.to(caps[1], { autoAlpha: 0, y: -24, duration: 0.3 })
            .to(graph.hops.concat(graph.hopNodes, [graph.traveler]), { opacity: 0.15, duration: 0.4 }, '<')
            .to(caps[2], { autoAlpha: 1, y: 0, duration: 0.3 })
            .to(graph.close, { strokeDashoffset: 0, duration: 0.5, stagger: 0.06, ease: 'none' })
            .to(graph.far, { strokeDashoffset: 0, duration: 0.7, stagger: 0.08, ease: 'none' })
            .to({}, { duration: 0.5 });

        gsap.from(netPin.querySelector('.am-kicker'), { autoAlpha: 0, y: 20, duration: 1, ease: EXPO, scrollTrigger: { trigger: netPin, start: 'top 70%', once: true } });
    }

    // -----------------------------------------------------------------
    // 6 · Receipts print line by line, like the machine
    // -----------------------------------------------------------------

    document.querySelectorAll('.am-receipt').forEach(function (r, i) {
        var paper = r.querySelector('.am-receipt-paper');
        gsap.timeline({ scrollTrigger: { trigger: r, start: 'top 88%', once: true }, delay: i * 0.18 })
            .fromTo(paper, { clipPath: 'inset(0% 0% 100% 0%)', y: -30 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.8, ease: 'steps(16)' })
            .from(r, { rotation: 0, duration: 1, ease: 'elastic.out(1, 0.5)' }, '-=0.2');
    });
    gsap.from('.am-voices .am-kicker', { autoAlpha: 0, y: 20, duration: 1, ease: EXPO, scrollTrigger: { trigger: '.am-voices', start: 'top 80%', once: true } });

    // -----------------------------------------------------------------
    // 7 · The build: an exploded view settling into place
    // -----------------------------------------------------------------

    var parts = gsap.utils.toArray('.am-part');
    var partsBox = document.querySelector('.am-parts');
    if (parts.length && partsBox) {
        gsap.fromTo(parts, {
            x: function (i, p) {
                var b = partsBox.getBoundingClientRect(), r = p.getBoundingClientRect();
                return (b.left + b.width / 2) - (r.left + r.width / 2);
            },
            y: function (i) { return i * -14; },
            rotation: function (i) { return [-9, 5, -3, 8][i % 4]; },
            scale: 0.86,
        }, {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            ease: 'power2.out',
            stagger: 0.05,
            scrollTrigger: { trigger: partsBox, start: 'top 90%', end: 'top 35%', scrub: 0.9, invalidateOnRefresh: true },
        });

        var title = document.querySelector('.am-build-title');
        var tw = splitWords(title);
        gsap.from(tw, { yPercent: 110, autoAlpha: 0, stagger: 0.06, duration: 1.2, ease: EXPO, scrollTrigger: { trigger: title, start: 'top 85%', once: true } });
        gsap.from('.am-build .am-kicker', { autoAlpha: 0, y: 20, duration: 1, ease: EXPO, scrollTrigger: { trigger: title, start: 'top 85%', once: true } });
    }

    // -----------------------------------------------------------------
    // 8 · Reach
    // -----------------------------------------------------------------

    document.querySelectorAll('.am-num').forEach(function (n) {
        var target = +n.dataset.count, o = { v: 0 };
        n.textContent = '0';
        gsap.to(o, {
            v: target,
            duration: 2,
            ease: 'power3.out',
            onUpdate: function () { n.textContent = Math.round(o.v); },
            scrollTrigger: { trigger: n, start: 'top 85%', once: true },
        });
    });
    gsap.from('.am-reach-line', { y: 50, autoAlpha: 0, duration: 1.4, ease: EXPO, scrollTrigger: { trigger: '.am-reach', start: 'top 80%', once: true } });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
