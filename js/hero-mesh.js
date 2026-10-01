// Mesh gradients (Paper Shaders, Apache-2.0) for the hero and the closing contact section.
import {
    ShaderMount,
    meshGradientFragmentShader,
    getShaderColorFromString,
    ShaderFitOptions,
    defaultObjectSizing,
} from 'https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.81/dist/index.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const presets = {
    hero: { colors: ['#0a0a0b', '#ff5a1f', '#5b2a86', '#141a3a', '#2a0f2e'], swirl: 0.35, rotation: 0, frame: 20000 },
    amity: { colors: ['#1a1030', '#6b4dff', '#ff8fd1', '#9fd3ff', '#2b1a5e'], swirl: 0.6, rotation: 40, frame: 42000 },
    salesforce: { colors: ['#04122e', '#0b5cab', '#4a154b', '#032d60', '#1b96ff'], swirl: 0.15, distortion: 0.4, speed: 0.15, rotation: 210, frame: 12000 },
    snowday: { colors: ['#0d1b33', '#2f5d9e', '#9cc3f0', '#1a3361', '#5d8fd0'], swirl: 0.2, distortion: 0.35, speed: 0.12, rotation: 120, frame: 30000 },
    motorex: { colors: ['#031c1c', '#0b4f4b', '#0f6f69', '#052a33', '#083e45'], swirl: 0.12, distortion: 0.3, speed: 0.1, rotation: 300, frame: 52000 },
    brilliant: { colors: ['#120b07', '#4a2210', '#9c4a1c', '#24130a', '#6b3415'], swirl: 0.12, distortion: 0.3, speed: 0.1, rotation: 60, frame: 18000 },
    footer: { colors: ['#0a0a0b', '#5b2a86', '#ff5a1f', '#141a3a', '#e8c9a0'], swirl: 0.5, rotation: 180, frame: 64000 },
};

document.querySelectorAll('[data-mesh]').forEach((el) => {
    const preset = presets[el.dataset.mesh] || presets.hero;
    try {
        new ShaderMount(
            el,
            meshGradientFragmentShader,
            {
                u_colors: preset.colors.map(getShaderColorFromString),
                u_colorsCount: preset.colors.length,
                u_distortion: preset.distortion ?? 0.85,
                u_swirl: preset.swirl,
                u_grainMixer: 0,
                u_grainOverlay: 0.08,
                u_fit: ShaderFitOptions.cover,
                u_scale: 1,
                u_rotation: preset.rotation,
                u_offsetX: 0,
                u_offsetY: 0,
                u_originX: defaultObjectSizing.originX,
                u_originY: defaultObjectSizing.originY,
                u_worldWidth: 0,
                u_worldHeight: 0,
            },
            undefined,
            reduceMotion ? 0 : (preset.speed ?? 0.35),
            preset.frame,
            1
        );
        el.closest('.hero, .footer')?.classList.add('has-shader');
    } catch (err) {
        console.warn('Mesh gradient unavailable, using CSS fallback', err);
    }
});
