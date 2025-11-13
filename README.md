# Experimental — Brutalist Kinetic Typography

This folder contains an experimental kinetic typography landing page for a brutalist portfolio. The page is intentionally experimental — typography is the primary design and interaction layer.

Structure
- `index.html` — app shell and component loader
- `components/hero.html` — hero typographic module (injected into `index.html`)
- `css/typography.css` — variable-font rules and per-character styles
- `css/layout.css` — brutalist editorial layout
- `js/canvas-bg.js` — animated canvas background (noise/particles)
- `js/mouse-effects.js` — per-character pointer-driven interactions
- `js/scroll-effects.js` — GSAP + ScrollTrigger scroll-driven timeline
- `assets/fonts/` — place your variable-font `.woff2` files here

How to use
1. Add a variable font (recommended: Recursive Variable or Obviously Variable) into `assets/fonts/`.
2. Update `css/typography.css` `@font-face` `src` path if necessary.
3. Open `index.html` in a browser (best experienced in a recent Chrome/Firefox/Safari).

Accessibility & Performance
- The project respects `prefers-reduced-motion` and will render a static fallback when enabled.
- Animations use transform/opacity/filter to keep GPU-friendly rendering.
- If you experience low framerate, try disabling per-char stagger or reduce particle count in `js/canvas-bg.js`.

Customization
- Change headline text in `components/hero.html` (each character is wrapped in `.char` spans).
- Tweak animation curves and timings inside `js/scroll-effects.js` and `js/mouse-effects.js`.

Notes
- This is an experimental project. If you want richer WebGL displacement maps, integrate a small GLSL sketch in place of `js/canvas-bg.js`.
