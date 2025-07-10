# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website for Lina Fowler, a product designer. The site is built as a static HTML/CSS/JavaScript website hosted on GitHub Pages.

## Architecture

- **Static Site**: Pure HTML, CSS, and JavaScript - no build process required
- **Frontend**: Vanilla JavaScript with a custom chat interface
- **Backend**: Chat functionality connects to an external API at `joint-sloth-smoothly.ngrok-free.app`
- **Hosting**: GitHub Pages (finalowler.github.io)

## File Structure

```
/
├── index.html              # Main portfolio landing page
├── css/main.css           # All styles for the site
├── js/main.js             # JavaScript for chat functionality and interactions
├── pages/                 # Individual project pages
│   ├── brilliant.html
│   ├── kindness.html
│   ├── motorex.html
│   ├── rottentomatoes.html
│   ├── salesforce.html
│   ├── snowday.html
│   ├── sust.html
│   └── zerolytics.html
├── img/                   # Images and assets
├── mov/                   # Video files
└── fonts/                 # Custom fonts (Liebeheide)
```

## Key Features

1. **LinaGPT Chat Interface**: Custom modal chat system that queries an external API
2. **Portfolio Showcase**: Organized into Digital, Physical, and Experiential sections
3. **Project Pages**: Individual HTML pages for each portfolio project
4. **Responsive Design**: Mobile-first approach with CSS Grid/Flexbox
5. **Google Analytics**: Integrated tracking

## Development

### No Build Process
This is a static site - changes to HTML, CSS, or JavaScript are immediately reflected when files are updated.

### Local Development
Since this is a static site, you can:
- Open `index.html` directly in a browser
- Use a local HTTP server: `python -m http.server 8000` or similar
- Use Live Server extension in VS Code

### Chat Functionality
The LinaGPT feature connects to an external API. The endpoint is currently:
`https://joint-sloth-smoothly.ngrok-free.app/query`

### Testing
No automated tests are configured. Manual testing involves:
- Cross-browser compatibility
- Mobile responsiveness
- Chat functionality
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

The main JavaScript file (`main.js`) handles:
- Chat interface functionality
- API requests to the external chat service
- Modal show/hide behavior
- DOM manipulation for chat responses