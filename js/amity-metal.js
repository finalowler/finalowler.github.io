// Mirrored chrome for the Amity card (Paper Shaders liquidMetal, Apache-2.0).
// It drifts only slightly on its own, like a real mirror; reflections shift more when the card, the cursor, or the page moves.
import {
    ShaderMount,
    liquidMetalFragmentShader,
    LiquidMetalShapes,
    getShaderColorFromString,
    ShaderFitOptions,
    defaultObjectSizing,
    emptyPixel,
} from 'https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.81/dist/index.js';

// Used on the Amity case study card faces and on its homepage tile
const faces = document.querySelectorAll('.am-face, .am-thumb-card');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (faces.length) {
    const blank = new Image();
    blank.src = emptyPixel;
    blank.decode().catch(() => {}).then(() => {
        const mounts = [];
        faces.forEach((face, i) => {
            const host = document.createElement('div');
            host.className = 'am-metal';
            host.setAttribute('aria-hidden', 'true');
            face.prepend(host);
            try {
                mounts.push(new ShaderMount(
                    host,
                    liquidMetalFragmentShader,
                    {
                        u_colorBack: getShaderColorFromString('#00000000'),
                        u_colorTint: getShaderColorFromString('#ffffff'),
                        u_image: blank,
                        u_imageAspectRatio: 1,
                        u_isImage: false,
                        u_shape: LiquidMetalShapes.none,
                        u_repetition: 1.6,
                        u_softness: 0.45,
                        u_shiftRed: 0.18,
                        u_shiftBlue: 0.22,
                        u_distortion: 0.03,
                        u_contour: 0.4,
                        u_angle: 70,
                        u_fit: ShaderFitOptions.cover,
                        u_scale: 1,
                        u_rotation: 0,
                        u_offsetX: 0,
                        u_offsetY: 0,
                        u_originX: defaultObjectSizing.originX,
                        u_originY: defaultObjectSizing.originY,
                        u_worldWidth: 0,
                        u_worldHeight: 0,
                    },
                    undefined,
                    0,
                    6000 + i * 2500
                ));
                face.classList.add('has-metal');
            } catch (err) {
                console.warn('Liquid metal unavailable, keeping the CSS chrome', err);
            }
        });

        // Movement drives the reflection: cursor travel, scrolling, and the flip all
        // advance the shader's clock a little, then it settles back to stillness
        if (reduceMotion || !mounts.length) return;
        const base = mounts.map((m) => m.getCurrentFrame());
        let clock = 0, target = 0, angle = 70, angleTarget = 70;
        let lastX = null, lastY = null, lastScroll = window.scrollY;

        // A slow idle drift (about a tenth of normal speed) keeps the mirror alive;
        // movement adds larger, eased shifts on top
        const IDLE = 0.1;
        let last = performance.now();
        const tick = (now) => {
            const dt = Math.min(64, now - last);
            last = now;
            target += dt * IDLE;
            clock += (target - clock) * 0.08;
            angle += (angleTarget - angle) * 0.08;
            mounts.forEach((m, k) => {
                m.setFrame(base[k] + clock);
                m.setUniforms({ u_angle: angle });
            });
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);

        window.addEventListener('pointermove', (e) => {
            if (lastX !== null) target += (Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY)) * 3;
            lastX = e.clientX;
            lastY = e.clientY;
            angleTarget = 50 + (e.clientX / window.innerWidth) * 40;
        }, { passive: true });

        window.addEventListener('scroll', () => {
            target += Math.abs(window.scrollY - lastScroll) * 2;
            lastScroll = window.scrollY;
        }, { passive: true });

        // A flip sweeps the light across the face
        document.querySelector('.am-card-wrap')?.addEventListener('amity:flip', () => { target += 900; });
    });
}
