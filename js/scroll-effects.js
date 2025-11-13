/*
  js/scroll-effects.js

  Purpose:
  - Create scroll-driven typographic motion using GSAP + ScrollTrigger.
  - Map scroll progress to headline scale distortion, rotation on X/Y axes,
    parallax displacement of background canvas, and staged fragmentation of chars.
  - Respect prefers-reduced-motion and fall back to a static presentation.

  Connections:
  - Targets elements in `components/hero.html`: #hero, #hero-canvas, .hero-headline, .char
  - Works with per-character CSS variables set by `js/mouse-effects.js` (composable).

  Performance notes:
  - Animations are GPU-accelerated (transform, opacity). Avoid animating layout properties.
  - Uses ScrollTrigger's `scrub` to produce cinematic, frame-synced motion.
*/

(function () {
  // ensure GSAP and ScrollTrigger are available
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not found — scroll effects disabled.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  let initialized = false;

  function init() {
    if (initialized) return true;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hero = document.getElementById('hero');
    if (!hero) return false;

    const canvas = document.getElementById('hero-canvas');
    const headline = hero.querySelector('.hero-headline');
    const chars = Array.from(hero.querySelectorAll('.hero-headline .char'));

    if (!headline || !chars.length) return false;

    initialized = true;

    // Safety: if reduced motion is requested, do a minimal static style and exit.
    if (reduced) {
      document.documentElement.classList.add('reduced-motion');
      // subtle static scaling for presence
      gsap.set(headline, { scale: 1.0 });
      if (canvas) gsap.set(canvas, { opacity: 0.6 });
      return true;
    }

    // Setup transform perspective for 3D feel (CSS fallback in typography.css)
    gsap.set(headline, { transformOrigin: '50% 50%', force3D: true });

    // Parallax for background canvas (slower than scroll)
    let canvasParallax = null;
    if (canvas) {
      canvasParallax = gsap.to(canvas, {
        yPercent: 12,
        ease: 'none',
        paused: true
      });
    }

    // Main scroll timeline
    const endDistance = Math.max(window.innerHeight * 1.6, 1400);
    const tl = gsap.timeline({
      defaults: { ease: 'power1.inOut' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: `+=${endDistance}`,
        scrub: 0.7,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    // 1) Cinematic pan & scale: slight push-in with rotation on X and Y axes
    tl.to(headline, {
      scale: 1.08,
      rotationX: -8,
      rotationY: 6,
      duration: 1
    }, 0);

    // 2) Slowly move the canvas behind the type for depth
    if (canvasParallax) {
      tl.to(canvasParallax, { progress: 1, duration: 1 }, 0);
    }

    // 3) Fragment: stagger characters outward and add minor z translation to imply depth
    // We split this into two phases: subtle separation, then brief jitter/morph.
    tl.to(chars, {
      y: (i) => (i % 2 === 0 ? -18 : 22),
      x: (i) => ((i % 3) - 1) * 8,
      rotation: (i) => ((i % 5) - 2) * 2.5,
      scale: (i) => 1 + (i % 4) * 0.02,
      stagger: { each: 0.02, from: 'center' },
      duration: 0.8,
      force3D: true
    }, 0.2);

    // 4) Morph/blur: characters can blur slightly and change opacity to simulate distortion
    tl.to(chars, {
      filter: 'blur(2px)',
      opacity: 0.94,
      stagger: { each: 0.015, from: 'edges' },
      duration: 0.6
    }, 0.7);

    // 5) Resolve: bring characters back together but with a retained visual tension
    tl.to(chars, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      filter: 'blur(0px)',
      opacity: 1,
      stagger: { each: 0.01, from: 'center' },
      duration: 1.1
    }, 1.2);

    // 6) Drive variable font axes subtly based on scroll progress — increases weight and optical size
    //    This assumes typography.css maps CSS variables to font-variation-settings.
    tl.to(':root', {
      '--vf-wght': 900,
      '--vf-opsz': 120,
      duration: 1.3
    }, 0.1);

    // Optional: small tilt at the end to feel cinematic
    tl.to(headline, { rotation: 0.6, duration: 0.9 }, 2.3);

    // Keep ScrollTrigger refreshed on resize/orientation changes
    ScrollTrigger.addEventListener('refreshInit', () => {
      // reset any heavy transforms if needed
    });

    // Cleanup: when leaving hero (user scrolls past), we keep headline readable
    ScrollTrigger.create({
      trigger: hero,
      start: `top+=${endDistance} top`,
      onEnterBack: () => { /* re-entering top area */ }
    });

    // Performance tip: if too many chars cause frame drops, reduce stagger or animate fewer properties.

    return true;
  }

  let waitingForHero = false;

  function attemptInit() {
    if (init()) return;
    if (waitingForHero) return;
    waitingForHero = true;

    const tryInit = () => {
      if (!initialized) init();
    };

    const registry = window.__components;
    if (registry && registry.hero && registry.hero.ready) {
      registry.hero.ready.then(tryInit).catch(tryInit);
    }

    document.addEventListener('component:hero-ready', (event) => {
      if (!event || !event.detail || event.detail.name === 'hero') {
        tryInit();
      }
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptInit);
  } else {
    attemptInit();
  }

})();
