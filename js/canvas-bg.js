/*
  js/canvas-bg.js

  Lightweight canvas background animation for the hero section.

  Features:
  - Draws layered drifting gradients and a subtle particle field to create
    an industrial, textured background that plays well with bold typography.
  - Respects prefers-reduced-motion: single static draw and no RAF loop.
  - Optimized for 60fps: uses requestAnimationFrame, devicePixelRatio scaling,
    and minimal per-frame allocations.

  How it connects:
  - Targets <canvas id="hero-canvas"> from `components/hero.html`.
  - `js/scroll-effects.js` can animate the canvas element (parallax) with GSAP.
*/

(function () {
  let initialized = false;

  function init() {
    if (initialized) return true;

    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return false;

    initialized = true;

    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.max(1, window.devicePixelRatio || 1);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // simple particle data
    const particles = [];
    const PARTICLE_COUNT = Math.floor(Math.max(40, (window.innerWidth * 0.02)));

    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      w = canvas.clientWidth || canvas.width;
      h = canvas.clientHeight || canvas.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 2.6,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          alpha: 0.05 + Math.random() * 0.12
        });
      }
    }

    function drawStaticBackground() {
      // dark industrial gradient with neon burn
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#070707');
      g.addColorStop(0.4, '#0b0b0b');
      g.addColorStop(1, 'rgba(255,0,64,0.035)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    function render(time) {
      // clear
      ctx.clearRect(0, 0, w, h);

      // layered background gradient
      drawStaticBackground();

      // slightly moving soft radial spotlight (gives depth)
      const rad = Math.max(w, h) * 0.6;
      const ox = (Math.sin(time / 4000) * 0.12 + 0.5) * w;
      const oy = (Math.cos(time / 5000) * 0.12 + 0.5) * h;
      const spotlight = ctx.createRadialGradient(ox, oy, rad * 0.05, ox, oy, rad);
      spotlight.addColorStop(0, 'rgba(255,255,255,0.02)');
      spotlight.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, w, h);

      // draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + Math.sin((time + i * 1000) / 6000) * 0.06;
        p.y += p.vy + Math.cos((time + i * 1100) / 5600) * 0.04;

        // wrap
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // subtle grain overlay
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(0,0,0,0.02)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    let rafId = null;
    function loop(now) {
      render(now || performance.now());
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      resize();
      initParticles();
      if (reduced) {
        // draw one static frame and stop
        render(performance.now());
      } else {
        if (!rafId) rafId = requestAnimationFrame(loop);
      }
    }

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });

    // Start when DOM is ready / defer already provided by index.html
    start();

    // cleanup on pagehide
    window.addEventListener('pagehide', () => {
      if (rafId) cancelAnimationFrame(rafId);
    });

    return true;
  }

  function attemptInit() {
    if (init()) return;
    document.addEventListener('component:hero-ready', (event) => {
      if (initialized) return;
      if (!event || !event.detail || event.detail.name === 'hero') {
        init();
      }
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptInit);
  } else {
    attemptInit();
  }

})();
