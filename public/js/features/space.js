/**
 * @file features/space.js
 * Interactive space scene for the "Space scene" block
 * (engine/blocks/space/space.js renders the markup).
 *
 * Layers, back to front:
 *   1. Three parallax star layers drifting left (streak into lines at warp).
 *   2. A large planet with a glowing atmosphere (pre-rendered once per resize).
 *   3. The occasional shooting star.
 *   4. Engine exhaust particles (additive blending).
 *   5. The ship — eases toward the pointer, tilts with its vertical speed.
 *
 * Press and hold anywhere on the scene to engage warp. The animation pauses
 * while off-screen or in a background tab, and renders a single still frame
 * for visitors who prefer reduced motion.
 */

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** "#rrggbb" → [r, g, b] (falls back to a warm orange). */
function hexToRgb(hex) {
  const m = String(hex).trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return [240, 138, 60];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

class SpaceScene {
  /** @param {HTMLElement} el */
  constructor(el) {
    this.el = el;
    this.canvas = el.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.showShip = el.dataset.ship !== 'false';
    this.canWarp = el.dataset.warp !== 'false';
    this.centered = el.classList.contains('space-scene--center');
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.stars = [];
    this.particles = [];
    this.meteors = [];
    this.pointer = { x: 0, y: 0, active: false };
    this.parallax = { x: 0, y: 0 };
    this.ship = null;
    this.warp = 0;
    this.warpTarget = 0;
    this.time = 0;
    this.last = 0;
    this.visible = false;
    this.running = false;
    this.nextMeteor = rand(2, 5);
    this.readAccent();

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    new ResizeObserver(this.resize).observe(el);
    this.resize();
    this.bindPointer();

    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.toggleLoop();
    }).observe(el);
    document.addEventListener('visibilitychange', () => this.toggleLoop());
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => this.readAccent());
    document.addEventListener('themechange', () => this.readAccent());
  }

  /** The accent color follows the site theme (and light/dark mode). */
  readAccent() {
    this.accent = hexToRgb(getComputedStyle(this.el).getPropertyValue('--accent'));
    if (this.w) this.renderPlanet();
  }

  rgba(alpha, rgb = this.accent) {
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
  }

  /* ── Setup ──────────────────────────────────────── */

  resize() {
    const rect = this.el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.w = rect.width;
    this.h = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.scale = clamp(this.w / 1100, 0.6, 1.35);

    const narrow = this.w < 640;
    this.home = this.centered
      ? { x: this.w * 0.5, y: this.h * (narrow ? 0.86 : 0.82) }
      : { x: this.w * (narrow ? 0.66 : 0.74), y: this.h * (narrow ? 0.84 : 0.42) };
    if (!this.ship) this.ship = { x: this.home.x, y: this.home.y, vx: 0, vy: 0, angle: 0 };

    this.makeStars();
    this.renderPlanet();
    if (this.reduced) this.draw(0);
  }

  makeStars() {
    const area = this.w * this.h;
    const layers = [
      { density: 5200, r: [0.3, 0.8], speed: 5, alpha: [0.3, 0.75], depth: 0.25 },
      { density: 15000, r: [0.7, 1.3], speed: 16, alpha: [0.5, 0.9], depth: 0.6 },
      { density: 48000, r: [1.1, 1.9], speed: 42, alpha: [0.7, 1], depth: 1 },
    ];
    this.stars = [];
    for (const layer of layers) {
      const count = Math.round(area / layer.density);
      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: rand(0, this.w),
          y: rand(0, this.h),
          r: rand(...layer.r),
          a: rand(...layer.alpha),
          speed: layer.speed * rand(0.8, 1.2),
          depth: layer.depth,
          phase: rand(0, TAU),
          twinkle: rand(0.6, 2.2),
          tint: Math.random() < 0.12 ? [190, 210, 255] : Math.random() < 0.06 ? [255, 220, 190] : [255, 255, 255],
        });
      }
    }
  }

  /** Pre-render the planet to an offscreen canvas (it only moves by parallax). */
  renderPlanet() {
    const pad = 60;
    const c = document.createElement('canvas');
    c.width = Math.round((this.w + pad * 2) * this.dpr);
    c.height = Math.round((this.h + pad * 2) * this.dpr);
    const g = c.getContext('2d');
    g.scale(this.dpr, this.dpr);
    g.translate(pad, pad);

    const R = Math.max(this.h * 0.55, this.w * 0.3);
    const cx = this.centered ? this.w * 0.08 : this.w * 0.92;
    const cy = this.h + R * 0.48;

    // Atmospheric haze
    const haze = g.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.22);
    haze.addColorStop(0, this.rgba(0.28));
    haze.addColorStop(1, this.rgba(0));
    g.fillStyle = haze;
    g.beginPath();
    g.arc(cx, cy, R * 1.22, 0, TAU);
    g.fill();

    // Body, lit from the upper left
    const body = g.createRadialGradient(cx - R * 0.45, cy - R * 0.75, R * 0.05, cx, cy, R * 1.05);
    body.addColorStop(0, '#3a3566');
    body.addColorStop(0.35, '#1b1a3a');
    body.addColorStop(0.75, '#0a0a1c');
    body.addColorStop(1, '#05050d');
    g.fillStyle = body;
    g.beginPath();
    g.arc(cx, cy, R, 0, TAU);
    g.fill();

    // Faint cloud bands, clipped to the sphere
    g.save();
    g.beginPath();
    g.arc(cx, cy, R, 0, TAU);
    g.clip();
    for (let i = 0; i < 7; i++) {
      g.fillStyle = `rgba(160,170,255,${0.025 + Math.random() * 0.03})`;
      g.beginPath();
      g.ellipse(cx, cy - R * (0.55 - i * 0.12), R * 1.1, R * 0.035, -0.12, 0, TAU);
      g.fill();
    }
    g.restore();

    // Thin glowing rim on the lit side
    g.save();
    g.shadowColor = this.rgba(0.9);
    g.shadowBlur = 24;
    g.strokeStyle = this.rgba(0.75);
    g.lineWidth = 1.6;
    g.beginPath();
    g.arc(cx, cy, R, Math.PI * 1.05, Math.PI * 1.85);
    g.stroke();
    g.restore();

    this.planet = { canvas: c, pad };
  }

  bindPointer() {
    const toLocal = (e) => {
      const rect = this.el.getBoundingClientRect();
      this.pointer.x = e.clientX - rect.left;
      this.pointer.y = e.clientY - rect.top;
    };
    this.canvas.addEventListener('pointermove', (e) => {
      toLocal(e);
      this.pointer.active = true;
    });
    this.canvas.addEventListener('pointerleave', () => {
      this.pointer.active = false;
      this.warpTarget = 0;
    });
    this.canvas.addEventListener('pointerdown', (e) => {
      toLocal(e);
      this.pointer.active = true;
      if (this.canWarp && !this.reduced) {
        this.warpTarget = 1;
        this.el.classList.add('is-warping');
      }
    });
    const release = () => {
      this.warpTarget = 0;
      this.el.classList.remove('is-warping');
    };
    window.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
  }

  toggleLoop() {
    const shouldRun = this.visible && !document.hidden && !this.reduced;
    if (shouldRun && !this.running) {
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this.frame);
    } else if (!shouldRun) {
      this.running = false;
    }
  }

  /* ── Animation ──────────────────────────────────── */

  frame(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.update(dt);
    this.draw(dt);
    requestAnimationFrame(this.frame);
  }

  update(dt) {
    // Ease warp in quickly, out a little slower.
    const rate = this.warpTarget > this.warp ? 3.2 : 2.2;
    this.warp += (this.warpTarget - this.warp) * (1 - Math.exp(-dt * rate));

    // Smooth parallax from the pointer position.
    const px = this.pointer.active ? this.pointer.x / this.w - 0.5 : 0;
    const py = this.pointer.active ? this.pointer.y / this.h - 0.5 : 0;
    this.parallax.x += (px - this.parallax.x) * (1 - Math.exp(-dt * 3));
    this.parallax.y += (py - this.parallax.y) * (1 - Math.exp(-dt * 3));

    // Stars drift left; faster (and streaky) during warp.
    const boost = 1 + this.warp * 34;
    for (const s of this.stars) {
      s.x -= s.speed * boost * dt;
      if (s.x < -40) {
        s.x = this.w + rand(0, 40);
        s.y = rand(0, this.h);
      }
    }

    // Shooting stars
    this.nextMeteor -= dt;
    if (this.nextMeteor <= 0 && this.warp < 0.2) {
      this.meteors.push({ x: rand(this.w * 0.2, this.w * 1.1), y: rand(-20, this.h * 0.4), vx: -rand(500, 800), vy: rand(160, 300), life: 0, max: rand(0.6, 1.1) });
      this.nextMeteor = rand(4, 9);
    }
    this.meteors = this.meteors.filter((m) => {
      m.life += dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      return m.life < m.max;
    });

    if (this.showShip) this.updateShip(dt);
  }

  updateShip(dt) {
    const ship = this.ship;
    const t = this.time;
    const target = this.pointer.active
      ? { x: clamp(this.pointer.x, this.w * 0.1, this.w * 0.92), y: clamp(this.pointer.y, this.h * 0.14, this.h * 0.9) }
      : { x: this.home.x + Math.sin(t * 0.45) * this.w * 0.025, y: this.home.y + Math.sin(t * 0.8) * this.h * 0.035 };

    // Critically-damped spring toward the target.
    const k = 7;
    const d = 2 * Math.sqrt(k) * 0.9;
    ship.vx += ((target.x - ship.x) * k - ship.vx * d) * dt;
    ship.vy += ((target.y - ship.y) * k - ship.vy * d) * dt;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    const tilt = clamp(ship.vy * 0.0016, -0.42, 0.42) + Math.sin(t * 1.3) * 0.02;
    ship.angle += (tilt - ship.angle) * (1 - Math.exp(-dt * 6));

    // Exhaust particles from the nozzle.
    const s = this.scale;
    const cos = Math.cos(ship.angle);
    const sin = Math.sin(ship.angle);
    const nx = ship.x + -62 * s * cos;
    const ny = ship.y + -62 * s * sin;
    const emit = (70 + this.warp * 260) * dt;
    for (let i = 0; i < emit && this.particles.length < 500; i++) {
      const speed = rand(140, 240) * (1 + this.warp * 2.5) * s;
      this.particles.push({
        x: nx,
        y: ny + rand(-3, 3) * s,
        vx: -speed * cos + rand(-20, 20),
        vy: -speed * sin + rand(-22, 22),
        life: 0,
        max: rand(0.3, 0.7),
        size: rand(1.6, 3.6) * s,
      });
    }
    this.particles = this.particles.filter((p) => {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return p.life < p.max;
    });
  }

  draw() {
    const g = this.ctx;
    const { w, h } = this;
    g.clearRect(0, 0, w, h);

    // Stars
    const ox = -this.parallax.x * 24;
    const oy = -this.parallax.y * 16;
    for (const s of this.stars) {
      const tw = 0.7 + 0.3 * Math.sin(this.time * s.twinkle + s.phase);
      const x = s.x + ox * s.depth;
      const y = s.y + oy * s.depth;
      g.fillStyle = `rgba(${s.tint[0]},${s.tint[1]},${s.tint[2]},${s.a * tw})`;
      if (this.warp > 0.04) {
        const len = s.speed * this.warp * 0.9 * (0.4 + s.depth);
        g.fillRect(x, y - s.r / 2, len + s.r, s.r);
      } else if (s.r < 1) {
        g.fillRect(x, y, s.r * 1.6, s.r * 1.6);
      } else {
        g.beginPath();
        g.arc(x, y, s.r, 0, TAU);
        g.fill();
      }
    }

    // Planet (parallax, nudged slightly by warp)
    if (this.planet) {
      const { canvas, pad } = this.planet;
      g.drawImage(canvas, -pad - this.parallax.x * 30 - this.warp * 10, -pad - this.parallax.y * 18, w + pad * 2, h + pad * 2);
    }

    // Shooting stars
    for (const m of this.meteors) {
      const fade = 1 - m.life / m.max;
      const grad = g.createLinearGradient(m.x, m.y, m.x - m.vx * 0.12, m.y - m.vy * 0.12);
      grad.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = grad;
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(m.x, m.y);
      g.lineTo(m.x - m.vx * 0.12, m.y - m.vy * 0.12);
      g.stroke();
    }

    if (this.showShip && this.ship) {
      this.drawExhaust(g);
      this.drawShip(g);
    }
  }

  drawExhaust(g) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      const k = p.life / p.max;
      const alpha = (1 - k) * 0.55;
      // White-hot near the nozzle, cooling into the accent color.
      const r = Math.round(255 + (this.accent[0] - 255) * Math.min(1, k * 2));
      const gg = Math.round(255 + (this.accent[1] - 255) * Math.min(1, k * 2));
      const b = Math.round(255 + (this.accent[2] - 255) * Math.min(1, k * 2));
      g.fillStyle = `rgba(${r},${gg},${b},${alpha})`;
      g.beginPath();
      g.arc(p.x, p.y, p.size * (1 - k * 0.6), 0, TAU);
      g.fill();
    }
    g.restore();
  }

  /** A sleek spaceplane in profile, nose pointing right. Units ≈ px at scale 1. */
  drawShip(g) {
    const { ship, scale: s, warp } = this;
    const t = this.time;
    const jitter = warp > 0.05 ? Math.sin(t * 70) * warp * 1.3 : 0;

    g.save();
    g.translate(ship.x, ship.y + jitter);
    g.rotate(ship.angle);
    g.scale(s, s);

    // Engine glow behind the nozzle
    g.save();
    g.globalCompositeOperation = 'lighter';
    const glowR = 34 * (1 + warp * 1.4);
    const glow = g.createRadialGradient(-62, 0, 0, -62, 0, glowR);
    glow.addColorStop(0, this.rgba(0.55));
    glow.addColorStop(1, this.rgba(0));
    g.fillStyle = glow;
    g.beginPath();
    g.arc(-62, 0, glowR, 0, TAU);
    g.fill();

    // Flame
    const flicker = 0.85 + Math.sin(t * 38) * 0.08 + Math.sin(t * 23) * 0.07;
    const F = (30 + warp * 70) * flicker;
    const flame = g.createLinearGradient(-60, 0, -60 - F, 0);
    flame.addColorStop(0, 'rgba(255,255,255,0.95)');
    flame.addColorStop(0.25, this.rgba(0.85));
    flame.addColorStop(1, this.rgba(0));
    g.fillStyle = flame;
    g.beginPath();
    g.moveTo(-60, -6);
    g.quadraticCurveTo(-60 - F * 0.55, -4.5, -60 - F, 0);
    g.quadraticCurveTo(-60 - F * 0.55, 4.5, -60, 6);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(220,235,255,0.9)';
    g.beginPath();
    g.moveTo(-60, -2.6);
    g.quadraticCurveTo(-60 - F * 0.3, -1.6, -60 - F * 0.45, 0);
    g.quadraticCurveTo(-60 - F * 0.3, 1.6, -60, 2.6);
    g.closePath();
    g.fill();
    g.restore();

    // Far wing (darker, behind the fuselage)
    g.fillStyle = '#3d4459';
    g.beginPath();
    g.moveTo(6, 7);
    g.lineTo(-30, 27);
    g.lineTo(-47, 27);
    g.lineTo(-38, 8);
    g.closePath();
    g.fill();

    // Tail fin
    const fin = g.createLinearGradient(0, -32, 0, -10);
    fin.addColorStop(0, '#8a93ab');
    fin.addColorStop(1, '#5d6680');
    g.fillStyle = fin;
    g.beginPath();
    g.moveTo(-18, -10);
    g.lineTo(-40, -30);
    g.lineTo(-50, -30);
    g.lineTo(-46, -10);
    g.closePath();
    g.fill();

    // Engine bell
    g.fillStyle = '#262b3a';
    g.beginPath();
    g.moveTo(-50, -7.5);
    g.lineTo(-61, -9.5);
    g.lineTo(-61, 9.5);
    g.lineTo(-50, 7.5);
    g.closePath();
    g.fill();

    // Fuselage
    const hull = g.createLinearGradient(0, -12, 0, 12);
    hull.addColorStop(0, '#f2f4fa');
    hull.addColorStop(0.45, '#c3c9d8');
    hull.addColorStop(1, '#5f677d');
    g.fillStyle = hull;
    g.beginPath();
    g.moveTo(64, 0);
    g.bezierCurveTo(50, -8.5, 32, -11.5, 10, -11.5);
    g.lineTo(-42, -11.5);
    g.lineTo(-52, -7.5);
    g.lineTo(-52, 7.5);
    g.lineTo(-42, 11.5);
    g.lineTo(10, 11.5);
    g.bezierCurveTo(32, 11.5, 50, 8.5, 64, 0);
    g.closePath();
    g.fill();

    // Accent stripe (picks up the site's theme color)
    g.fillStyle = this.rgba(1);
    g.fillRect(-44, 1.2, 50, 2.4);

    // Near wing
    const wing = g.createLinearGradient(0, 4, 0, 34);
    wing.addColorStop(0, '#aab2c6');
    wing.addColorStop(1, '#6b7389');
    g.fillStyle = wing;
    g.beginPath();
    g.moveTo(14, 5);
    g.lineTo(-24, 33);
    g.lineTo(-42, 33);
    g.lineTo(-30, 6);
    g.closePath();
    g.fill();
    g.fillStyle = this.rgba(0.9);
    g.fillRect(-42, 31, 18, 2);

    // Cockpit glass
    const glass = g.createLinearGradient(20, -9, 40, -2);
    glass.addColorStop(0, '#a5e4ff');
    glass.addColorStop(1, '#1b3a74');
    g.fillStyle = glass;
    g.beginPath();
    g.moveTo(46, -4);
    g.bezierCurveTo(40, -9.5, 28, -10, 18, -9);
    g.lineTo(18, -4.5);
    g.closePath();
    g.fill();

    // Top highlight
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(14, -11);
    g.lineTo(-40, -11);
    g.stroke();

    // Blinking navigation light on the fin tip
    if (Math.sin(t * 4.2) > 0.55) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(255,90,90,0.95)';
      g.shadowColor = 'rgba(255,80,80,1)';
      g.shadowBlur = 10;
      g.beginPath();
      g.arc(-47, -30, 1.8, 0, TAU);
      g.fill();
      g.restore();
    }

    g.restore();
  }
}

export default {
  name: 'space',
  init(root = document) {
    root.querySelectorAll('[data-feature="space"]').forEach((el) => {
      if (!el.querySelector('canvas')?.getContext) return;
      new SpaceScene(el);
    });
  },
};
