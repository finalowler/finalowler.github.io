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
                u_distortion: 0.85,
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
            reduceMotion ? 0 : 0.35,
            preset.frame,
            1
        );
        el.closest('.hero, .footer')?.classList.add('has-shader');
    } catch (err) {
        console.warn('Mesh gradient unavailable, using CSS fallback', err);
    }
});
