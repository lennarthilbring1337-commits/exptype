 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/js/mouse-effects.js b/js/mouse-effects.js
index 02bb503a424ec72f5265ae8e5554fc0c656c10e5..d459e6caaae240639dbc01de9e104b42e702c6fb 100644
--- a/js/mouse-effects.js
+++ b/js/mouse-effects.js
@@ -1,147 +1,186 @@
 /*
   js/mouse-effects.js
 
   Purpose:
   - Provide per-character mouse/pointer-driven interactions: tracking, tilt,
     subtle rotation, scale and blur per `.char` element.
   - Update GPU-friendly CSS variables (no layout reads/writes that cause reflow).
   - Respect `prefers-reduced-motion` and provide a static fallback.
 
   Connections:
   - Targets `.hero-headline .char` elements generated in `components/hero.html`.
   - CSS consumes variables like --char-tilt, --char-rotate, --char-scale, --char-blur
     declared in `css/typography.css`.
 
   Implementation notes:
   - Uses Pointer Events (pointermove) so it works across mouse and touch.
   - Uses requestAnimationFrame to batch updates and avoid layout thrashing.
   - Keeps per-char math cheap: distance ratios and index-based easing.
 */
 
 (function () {
   // mark JS-enabled for CSS fallbacks
   try { document.documentElement.classList.add('js'); } catch(e){}
 
-  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
-  const hero = document.getElementById('hero');
-  if (!hero) return;
-
-  const chars = Array.from(document.querySelectorAll('.hero-headline .char'));
-  if (!chars.length) return;
-
-  // if user prefers reduced motion, set static state and exit early
-  if (reduced) {
-    chars.forEach(c => {
-      c.style.setProperty('--char-tilt', '0deg');
-      c.style.setProperty('--char-rotate', '0deg');
-      c.style.setProperty('--char-scale', '1');
-      c.style.setProperty('--char-blur', '0px');
-      c.dataset.animated = 'false';
-    });
-    return;
-  }
+  let initialized = false;
 
-  // Precompute centers of characters to avoid repeated layout reads on every move.
-  // We do a cheap cache and refresh it on resize.
-  let charCenters = [];
-  function computeCenters() {
-    charCenters = chars.map((el) => {
-      const r = el.getBoundingClientRect();
-      return { x: r.left + r.width / 2, y: r.top + r.height / 2, el };
-    });
-  }
-  computeCenters();
-  window.addEventListener('resize', () => { computeCenters(); });
-
-  // pointer state
-  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
-  let raf = null;
-
-  function onPointerMove(e) {
-    // normalize pointer coordinates
-    pointer.x = e.clientX;
-    pointer.y = e.clientY;
-    if (!raf) raf = requestAnimationFrame(applyEffects);
-  }
+  function init() {
+    if (initialized) return true;
 
-  // Attach pointermove listener to hero to scope interactions
-  hero.addEventListener('pointermove', onPointerMove, { passive: true });
-  hero.addEventListener('pointerenter', onPointerMove, { passive: true });
-  hero.addEventListener('pointerleave', (e) => {
-    // ease back to neutral when leaving
-    pointer.x = window.innerWidth / 2;
-    pointer.y = window.innerHeight / 2;
-    if (!raf) raf = requestAnimationFrame(applyEffects);
-  }, { passive: true });
-
-  function applyEffects() {
-    raf = null;
-
-    // hero center for global scaling factor
-    const heroRect = hero.getBoundingClientRect();
-    const heroCenterX = heroRect.left + heroRect.width / 2;
-    const heroCenterY = heroRect.top + heroRect.height / 2;
-
-    // pointer vector from hero center, normalized roughly -1..1
-    const vx = (pointer.x - heroCenterX) / (heroRect.width / 2);
-    const vy = (pointer.y - heroCenterY) / (heroRect.height / 2);
-
-    // base intensity clamps
-    const baseIntensity = Math.min(1, Math.hypot(vx, vy));
-
-    // iterate chars and set CSS vars
-    charCenters.forEach((c, i) => {
-      const dx = (pointer.x - c.x);
-      const dy = (pointer.y - c.y);
-      const dist = Math.hypot(dx, dy);
-
-      // relative influence: closer letters move more
-      const influence = Math.max(0, 1 - (dist / (Math.max(window.innerWidth, window.innerHeight) * 0.6)));
-
-      // per-char mini-randomness (stable per index) to avoid mechanical uniformity
-      const jitter = ((i % 7) - 3) * 0.06; // small angle offset
-
-      // compute transforms
-      const tilt = (dx / window.innerWidth) * 25 * influence * baseIntensity + jitter; // rotateX/rotateY-ish feel
-      const rotate = (dy / window.innerHeight) * 12 * influence * baseIntensity; // small 2D rotate
-      const scale = 1 + 0.06 * influence * baseIntensity; // tiny scaling
-      const blur = Math.max(0, 2.5 * (1 - influence) * (1 - baseIntensity));
-
-      // write CSS variables (GPU friendly)
-      const el = c.el;
-      el.style.setProperty('--char-tilt', `${tilt.toFixed(2)}deg`);
-      el.style.setProperty('--char-rotate', `${rotate.toFixed(2)}deg`);
-      el.style.setProperty('--char-scale', `${scale.toFixed(3)}`);
-      el.style.setProperty('--char-blur', `${blur.toFixed(2)}px`);
-      el.dataset.animated = 'true';
-    });
-  }
+    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
+    const hero = document.getElementById('hero');
+    if (!hero) return false;
+
+    const chars = Array.from(document.querySelectorAll('.hero-headline .char'));
+    if (!chars.length) return false;
 
-  // small idle subtle pulsing for life (low-frequency) using requestAnimationFrame loop
-  let lastPulse = performance.now();
-  function pulseLoop(now) {
-    const dt = now - lastPulse;
-    if (dt > 2200) {
-      // apply a micro-pulse across a subset to keep motion cinematic
-      chars.forEach((ch, idx) => {
-        const phase = (idx % 5) / 5;
-        const p = 1 + 0.01 * Math.sin((now / 800) + phase * Math.PI * 2);
-        ch.style.setProperty('--char-scale', p.toFixed(3));
+    initialized = true;
+
+    // if user prefers reduced motion, set static state and exit early
+    if (reduced) {
+      chars.forEach(c => {
+        c.style.setProperty('--char-tilt', '0deg');
+        c.style.setProperty('--char-rotate', '0deg');
+        c.style.setProperty('--char-scale', '1');
+        c.style.setProperty('--char-blur', '0px');
+        c.dataset.animated = 'false';
+      });
+      return true;
+    }
+
+    // Precompute centers of characters to avoid repeated layout reads on every move.
+    // We do a cheap cache and refresh it on resize.
+    let charCenters = [];
+    function computeCenters() {
+      charCenters = chars.map((el) => {
+        const r = el.getBoundingClientRect();
+        return { x: r.left + r.width / 2, y: r.top + r.height / 2, el };
       });
-      lastPulse = now;
+    }
+    computeCenters();
+    window.addEventListener('resize', () => { computeCenters(); });
+
+    // pointer state
+    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
+    let raf = null;
+
+    function applyEffects() {
+      raf = null;
+
+      // hero center for global scaling factor
+      const heroRect = hero.getBoundingClientRect();
+      const heroCenterX = heroRect.left + heroRect.width / 2;
+      const heroCenterY = heroRect.top + heroRect.height / 2;
+
+      // pointer vector from hero center, normalized roughly -1..1
+      const vx = (pointer.x - heroCenterX) / (heroRect.width / 2);
+      const vy = (pointer.y - heroCenterY) / (heroRect.height / 2);
+
+      // base intensity clamps
+      const baseIntensity = Math.min(1, Math.hypot(vx, vy));
+
+      // iterate chars and set CSS vars
+      charCenters.forEach((c, i) => {
+        const dx = (pointer.x - c.x);
+        const dy = (pointer.y - c.y);
+        const dist = Math.hypot(dx, dy);
+
+        // relative influence: closer letters move more
+        const influence = Math.max(0, 1 - (dist / (Math.max(window.innerWidth, window.innerHeight) * 0.6)));
+
+        // per-char mini-randomness (stable per index) to avoid mechanical uniformity
+        const jitter = ((i % 7) - 3) * 0.06; // small angle offset
+
+        // compute transforms
+        const tilt = (dx / window.innerWidth) * 25 * influence * baseIntensity + jitter; // rotateX/rotateY-ish feel
+        const rotate = (dy / window.innerHeight) * 12 * influence * baseIntensity; // small 2D rotate
+        const scale = 1 + 0.06 * influence * baseIntensity; // tiny scaling
+        const blur = Math.max(0, 2.5 * (1 - influence) * (1 - baseIntensity));
+
+        // write CSS variables (GPU friendly)
+        const el = c.el;
+        el.style.setProperty('--char-tilt', `${tilt.toFixed(2)}deg`);
+        el.style.setProperty('--char-rotate', `${rotate.toFixed(2)}deg`);
+        el.style.setProperty('--char-scale', `${scale.toFixed(3)}`);
+        el.style.setProperty('--char-blur', `${blur.toFixed(2)}px`);
+        el.dataset.animated = 'true';
+      });
+    }
+
+    function onPointerMove(e) {
+      // normalize pointer coordinates
+      pointer.x = e.clientX;
+      pointer.y = e.clientY;
+      if (!raf) raf = requestAnimationFrame(applyEffects);
+    }
+
+    // Attach pointermove listener to hero to scope interactions
+    hero.addEventListener('pointermove', onPointerMove, { passive: true });
+    hero.addEventListener('pointerenter', onPointerMove, { passive: true });
+    hero.addEventListener('pointerleave', () => {
+      // ease back to neutral when leaving
+      pointer.x = window.innerWidth / 2;
+      pointer.y = window.innerHeight / 2;
+      if (!raf) raf = requestAnimationFrame(applyEffects);
+    }, { passive: true });
+
+    // small idle subtle pulsing for life (low-frequency) using requestAnimationFrame loop
+    let lastPulse = performance.now();
+    function pulseLoop(now) {
+      const dt = now - lastPulse;
+      if (dt > 2200) {
+        // apply a micro-pulse across a subset to keep motion cinematic
+        chars.forEach((ch, idx) => {
+          const phase = (idx % 5) / 5;
+          const p = 1 + 0.01 * Math.sin((now / 800) + phase * Math.PI * 2);
+          ch.style.setProperty('--char-scale', p.toFixed(3));
+        });
+        lastPulse = now;
+      }
+      requestAnimationFrame(pulseLoop);
     }
     requestAnimationFrame(pulseLoop);
+
+    // optional: gentle cleanup when page is hidden to avoid wasted cycles
+    document.addEventListener('visibilitychange', () => {
+      if (document.hidden) {
+        hero.removeEventListener('pointermove', onPointerMove);
+      } else {
+        hero.addEventListener('pointermove', onPointerMove, { passive: true });
+        computeCenters();
+      }
+    });
+
+    return true;
   }
-  requestAnimationFrame(pulseLoop);
-
-  // optional: gentle cleanup when page is hidden to avoid wasted cycles
-  document.addEventListener('visibilitychange', () => {
-    if (document.hidden) {
-      hero.removeEventListener('pointermove', onPointerMove);
-    } else {
-      hero.addEventListener('pointermove', onPointerMove, { passive: true });
-      computeCenters();
+
+  let waitingForHero = false;
+
+  function attemptInit() {
+    if (init()) return;
+    if (waitingForHero) return;
+    waitingForHero = true;
+
+    const tryInit = () => {
+      if (!initialized) init();
+    };
+
+    const registry = window.__components;
+    if (registry && registry.hero && registry.hero.ready) {
+      registry.hero.ready.then(tryInit).catch(tryInit);
     }
-  });
+
+    document.addEventListener('component:hero-ready', (event) => {
+      if (!event || !event.detail || event.detail.name === 'hero') {
+        tryInit();
+      }
+    }, { once: true });
+  }
+
+  if (document.readyState === 'loading') {
+    document.addEventListener('DOMContentLoaded', attemptInit);
+  } else {
+    attemptInit();
+  }
 
 })();
 
EOF
)
