# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website for Lina Fowler, a product designer. The site is built as a static HTML/CSS/JavaScript website hosted on GitHub Pages.

## Architecture

- **Static Site**: Pure HTML, CSS, and JavaScript - no build process required
- **Frontend**: Vanilla JavaScript — scroll reveals, in-view video playback, and a mesh-gradient hero (Paper Shaders)
- **Design**: Dark & cinematic — Instrument Serif + Inter (Google Fonts), near-black background, warm accent `#e8c9a0`
- **Hosting**: GitHub Pages (finalowler.github.io)

## File Structure

```
/
├── index.html              # Main portfolio landing page
├── css/main.css           # All styles for the site
├── js/main.js             # Nav, scroll reveals, video play/pause, hover GIFs, parallax
├── js/hero-mesh.js        # Paper Shaders mesh gradients (hero, footer, Amity tile)
├── js/samaya-film.js      # Code-native Samaya launch film in the homepage tile (GSAP timeline)
├── js/salesforce-tile.js  # Slack → Salesforce posting loop in the homepage tile
├── js/snowday-tile.js     # Snowday phone: Ask Snowy chat loop + slow snow (homepage tile)
├── js/motorex-tile.js     # Motorex technical drawing: shelf transfers to slatwall (homepage tile)
├── pages/                 # Individual project pages
│   ├── brilliant.html
│   ├── kindness.html
│   ├── motorex.html
│   ├── samaya.html          # Long-form case study (js/story.js: pinned scenes + chapter stage)
│   ├── kindness.html        # Amity: bespoke format (js/amity.js, js/amity-metal.js liquid-chrome card)
│   ├── salesforce.html
│   ├── snowday.html
│   ├── sust.html
│   └── zerolytics.html
├── img/                   # Images and assets
├── mov/                   # Video files
└── fonts/                 # Custom fonts (Liebeheide)
```

## Key Features

1. **Hero mesh gradient**: Paper Shaders `meshGradient`, masked to fade into the page and dimmed on scroll
2. **Portfolio Showcase**: 2-column `.work-grid` (first card `.featured` spans both); heavy hover GIFs load lazily via `data-src`
3. **Project Pages**: Shared nav/footer, `.reveal` sections, and a "Next project" link (order matches the homepage)
4. **Responsive Design**: Breakpoint at 860px; respects `prefers-reduced-motion`
5. **Google Analytics**: Integrated tracking

## Development

### No Build Process
This is a static site - changes to HTML, CSS, or JavaScript are immediately reflected when files are updated.

### Local Development
Since this is a static site, you can:
- Open `index.html` directly in a browser
- Use a local HTTP server: `python -m http.server 8000` or similar
- Use Live Server extension in VS Code

### Testing
No automated tests are configured. Manual testing involves:
- Cross-browser compatibility
- Mobile responsiveness
- Link navigation between pages

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the main branch. The `CNAME` file configures the custom domain.

## CSS Architecture

- Single CSS file (`main.css`) contains all styles
- Uses CSS Grid and Flexbox for layout
- Custom properties for colors and animations
- Responsive design with media queries
- Custom fonts via `@font-face` and Google Fonts

## JavaScript Architecture

- `main.js`: nav backdrop on scroll, IntersectionObserver reveals, play videos only while visible, lazy hover GIFs, card parallax
- `hero-mesh.js`: mounts Paper's `ShaderMount` (pinned 0.0.81); pauses offscreen; static under reduced motion