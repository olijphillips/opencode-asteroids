'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Shooting Star (Estrella Fugaz) ────────────────────────────────────────────
const SHOOTING_STAR_POINTS = 200;
const COMBO_COLORS = ['#ff0040', '#ffcc00', '#00ffcc', '#ff00ff', '#ff6600'];

class ShootingStar {
  constructor() {
    this.radius = 25;
    this.dead = false;
    this.ttl = 6;
    this.life = 6;
    this.rot = rand(0, Math.PI * 2);
    this.rotSpeed = rand(2, 4);

    const edge = randInt(0, 3);
    if (edge === 0)      { this.x = rand(0, W); this.y = -this.radius; }
    else if (edge === 1) { this.x = W + this.radius; this.y = rand(0, H); }
    else if (edge === 2) { this.x = rand(0, W); this.y = H + this.radius; }
    else                 { this.x = -this.radius; this.y = rand(0, H); }

    const targetX = W / 2 + rand(-200, 200);
    const targetY = H / 2 + rand(-150, 150);
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    const speed = rand(160, 200);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;

    if (Math.random() > 0.4) {
      shootingStarParticles.push(new TrailParticle(this.x, this.y));
    }
  }

  draw() {
    const alpha = Math.min(1, this.ttl / (this.life * 0.3));
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.globalAlpha = alpha;

    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      const ox = Math.cos(outerAngle) * this.radius;
      const oy = Math.sin(outerAngle) * this.radius;
      const ix = Math.cos(innerAngle) * this.radius * 0.45;
      const iy = Math.sin(innerAngle) * this.radius * 0.45;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

class TrailParticle {
  constructor(x, y) {
    this.x = x + rand(-4, 4);
    this.y = y + rand(-4, 4);
    this.vx = rand(-15, 15);
    this.vy = rand(-15, 15);
    this.life = rand(0.3, 0.7);
    this.ttl = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(0,255,204,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.04, this.y - this.vy * 0.04);
    ctx.stroke();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.tripleShot    = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.tripleShot    > 0) this.tripleShot    -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.97;
    const MAX_SPEED = 280;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > MAX_SPEED) {
      this.vx = (this.vx / speed) * MAX_SPEED;
      this.vy = (this.vy / speed) * MAX_SPEED;
    }
    const speedMul = this.speedBoost > 0 ? 2 : 1;
    this.x = wrap(this.x + this.vx * dt * speedMul, W);
    this.y = wrap(this.y + this.vy * dt * speedMul, H);

    if (this.speedBoost > 0) {
      for (let i = 0; i < 2; i++) {
        speedParticles.push(new SpeedParticle(
          this.x - this.vx * 0.05,
          this.y - this.vy * 0.05,
          -this.vx * 0.3,
          -this.vy * 0.3
        ));
      }
    }
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      const perp = this.angle + Math.PI / 2;
      const OFFSET = 8;
      const dx = Math.cos(perp) * OFFSET;
      const dy = Math.sin(perp) * OFFSET;
      return [
        new Bullet(ox, oy, this.angle),
        new Bullet(ox + dx, oy + dy, this.angle),
        new Bullet(ox - dx, oy - dy, this.angle),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    if (this.speedBoost > 0) {
      const pulse = 0.25 + 0.15 * Math.sin(performance.now() / 80);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.tripleShot > 0) {
      const pulse = 0.25 + 0.15 * Math.sin(performance.now() / 80);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#00ccff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = this.speedBoost > 0 ? 'rgba(255, 204, 0, 0.85)' : 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Speed Particle (estela amarilla) ─────────────────────────────────────────
class SpeedParticle {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx + rand(-20, 20);
    this.vy = vy + rand(-20, 20);
    this.life = rand(0.2, 0.5);
    this.ttl = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,204,0,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.04, this.y - this.vy * 0.04);
    ctx.stroke();
  }
}

// ── Speed Power-Up ────────────────────────────────────────────────────────────
class SpeedPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.ttl = 12;
    this.dead = false;
  }

  update(dt) {
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(Date.now() * 0.005));
    ctx.strokeStyle = `rgba(255, 204, 0, ${pulse.toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2.5;
    const s = 1.5;
    ctx.beginPath();
    ctx.moveTo( 3*s, -10*s);
    ctx.lineTo(-4*s,  -1*s);
    ctx.lineTo( 3*s,  -1*s);
    ctx.lineTo(-3*s,  10*s);
    ctx.lineTo( 4*s,   1*s);
    ctx.lineTo(-3*s,   1*s);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Triple Shot Power-Up ──────────────────────────────────────────────────────
class TripleShotPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.ttl = 12;
    this.dead = false;
  }

  update(dt) {
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(Date.now() * 0.005));
    ctx.strokeStyle = `rgba(0, 204, 255, ${pulse.toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#00ccff';
    ctx.lineWidth = 2.5;
    const s = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4 * s, -6 * s);
    ctx.lineTo(-4 * s, 6 * s);
    ctx.moveTo(0, -6 * s);
    ctx.lineTo(0, 6 * s);
    ctx.moveTo(4 * s, -6 * s);
    ctx.lineTo(4 * s, 6 * s);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, speedPowerUps, speedParticles;
let shootingStars, shootingStarParticles;
let shootingStarTimer;
let comboFlash = 0;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let screenFlash = 0;
let powerUpText = 0;
let powerUpType = '';
let tripleShotPowerUps;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets       = [];
  asteroids     = [];
  particles     = [];
  speedPowerUps = [];
  speedParticles = [];
  shootingStars = [];
  shootingStarParticles = [];
  tripleShotPowerUps = [];
  shootingStarTimer = rand(12, 15);
  comboFlash = 0;
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets       = [];
  particles     = [];
  speedPowerUps = [];
  speedParticles = [];
  shootingStars = [];
  shootingStarParticles = [];
  tripleShotPowerUps = [];
  shootingStarTimer = rand(12, 15);
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  speedParticles.forEach(p => p.update(dt));
  shootingStars.forEach(s => s.update(dt));
  shootingStarParticles.forEach(p => p.update(dt));
  tripleShotPowerUps.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  speedParticles = speedParticles.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);
  shootingStarParticles = shootingStarParticles.filter(p => !p.dead);
  tripleShotPowerUps = tripleShotPowerUps.filter(p => !p.dead);

  if (screenFlash > 0) screenFlash -= dt;
  if (powerUpText > 0) powerUpText -= dt;
  if (comboFlash > 0) comboFlash -= dt;

  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0 && shootingStars.length === 0) {
    shootingStars.push(new ShootingStar());
    shootingStarTimer = rand(12, 15);
  }

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (Math.random() < 0.35) speedPowerUps.push(new SpeedPowerUp(a.x, a.y));
        if (Math.random() < 0.2) tripleShotPowerUps.push(new TripleShotPowerUp(a.x, a.y));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += SHOOTING_STAR_POINTS;
        explode(s.x, s.y, 18);
        comboFlash = 0.8;
      }
    }
  }
  shootingStars = shootingStars.filter(s => !s.dead);
  bullets       = bullets.filter(b => !b.dead);

  speedPowerUps.forEach(p => p.update(dt));
  speedPowerUps = speedPowerUps.filter(p => !p.dead);

  for (const p of speedPowerUps) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      ship.speedBoost = 5;
      screenFlash = 0.3;
      powerUpText = 1.5;
      powerUpType = 'speed';
    }
  }
  speedPowerUps = speedPowerUps.filter(p => !p.dead);

  for (const p of tripleShotPowerUps) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      ship.tripleShot = 5;
      screenFlash = 0.3;
      powerUpText = 1.5;
      powerUpType = 'triple';
    }
  }
  tripleShotPowerUps = tripleShotPowerUps.filter(p => !p.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nave vs estrella fugaz
  if (ship.invincible <= 0) {
    for (const s of shootingStars) {
      if (dist(ship, s) < ship.radius + s.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  if (ship.speedBoost > 0) {
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'left';
    ctx.fillText(`VELOCIDAD x2  ${ship.speedBoost.toFixed(1)}s`, 14, 48);
    ctx.fillStyle = 'rgba(255,204,0,0.3)';
    ctx.fillRect(14, 54, 120, 5);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(14, 54, 120 * (ship.speedBoost / 5), 5);
  }

  if (ship.tripleShot > 0) {
    const yOff = ship.speedBoost > 0 ? 22 : 0;
    ctx.fillStyle = '#00ccff';
    ctx.textAlign = 'left';
    ctx.fillText(`TRIPLE SHOT  ${ship.tripleShot.toFixed(1)}s`, 14, 48 + yOff);
    ctx.fillStyle = 'rgba(0,204,255,0.3)';
    ctx.fillRect(14, 54 + yOff, 120, 5);
    ctx.fillStyle = '#00ccff';
    ctx.fillRect(14, 54 + yOff, 120 * (ship.tripleShot / 5), 5);
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  speedParticles.forEach(p => p.draw());
  shootingStarParticles.forEach(p => p.draw());
  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  shootingStars.forEach(s => s.draw());
  speedPowerUps.forEach(p => p.draw());
  tripleShotPowerUps.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  if (screenFlash > 0) {
    ctx.save();
    ctx.globalAlpha = screenFlash * 0.6;
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (powerUpText > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, powerUpText);
    ctx.fillStyle = powerUpType === 'triple' ? '#00ccff' : '#ffcc00';
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(powerUpType === 'triple' ? 'TRIPLE SHOT!' : 'VELOCIDAD x2!', W / 2, H / 2 - 60);
    ctx.restore();
  }

  if (comboFlash > 0) {
    const colorIndex = Math.floor(comboFlash * 12) % COMBO_COLORS.length;
    const color = COMBO_COLORS[colorIndex];
    ctx.save();
    ctx.globalAlpha = Math.min(1, comboFlash * 1.5);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.strokeRect(3, 3, W - 6, H - 6);
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = Math.min(1, comboFlash * 2);
    ctx.fillStyle = color;
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('COMBO!', W / 2, H / 2 - 80);
    ctx.restore();
  }

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
