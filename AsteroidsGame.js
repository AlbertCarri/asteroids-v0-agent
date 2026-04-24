const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const SHIP_SIZE = 15;
const ROTATION_SPEED = 0.08;
const THRUST_POWER = 0.18;
const FRICTION = 0.99;
const MAX_SPEED = 8;
const BULLET_SPEED = 10;
const BULLET_LIFE = 60;
const FIRE_RATE = 10;
const ASTEROID_SIZES = { large: 40, medium: 22, small: 12 };
const musicGame = new Audio("./public/PixelHeartbeat.mp3");
musicGame.volume = 0.2;

const state = {
  ship: {
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    vel: { x: 0, y: 0 },
    angle: -Math.PI / 2,
    thrusting: false,
  },
  bullets: [],
  asteroids: [],
  particles: [],
  explosionParticles: [],
  score: 0,
  level: 1,
  lives: 3,
  gameOver: false,
  started: false,
  fireCooldown: 0,
  keys: {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
  },
  invulnerable: 0,
};

const canvas = document.getElementById("gameCanvas");
const overlay = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function playSound(src, volume) {
  const sound = new Audio(src);
  sound.volume = volume;
  sound.play();
}

function startMusic() {
  musicGame.currentTime = 0;
  musicGame.play();
}

function endMusic() {
  musicGame.pause();
}

function playShootSound() {
  playSound("./public/laser.wav", 0.4);
}

function playExplosionSound() {
  playSound("./public/asteroidexplotion.wav", 0.5);
}

function starShipExplosion() {
  playSound("./public/shipexplotion.wav", 0.5);
}

function wrapPosition(pos) {
  if (pos.x < 0) pos.x = CANVAS_WIDTH;
  if (pos.x > CANVAS_WIDTH) pos.x = 0;
  if (pos.y < 0) pos.y = CANVAS_HEIGHT;
  if (pos.y > CANVAS_HEIGHT) pos.y = 0;
}

function generateAsteroidVertices(size) {
  const vertices = [];
  const count = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const radius = size * (0.7 + Math.random() * 0.4);
    vertices.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }
  return vertices;
}

function createAsteroid(x, y, size) {
  const speed = size === "large" ? 1 : size === "medium" ? 1.5 : 2.5;
  const angle = Math.random() * Math.PI * 2;
  return {
    pos: { x, y },
    vel: {
      x: Math.cos(angle) * speed * (0.5 + Math.random()),
      y: Math.sin(angle) * speed * (0.5 + Math.random()),
    },
    size,
    radius: ASTEROID_SIZES[size],
    vertices: generateAsteroidVertices(ASTEROID_SIZES[size]),
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.03,
  };
}

function initLevel(level) {
  state.asteroids = [];
  const count = 3 + level;
  for (let i = 0; i < count; i += 1) {
    let x, y;
    do {
      x = Math.random() * CANVAS_WIDTH;
      y = Math.random() * CANVAS_HEIGHT;
    } while (Math.hypot(x - state.ship.pos.x, y - state.ship.pos.y) < 150);
    state.asteroids.push(createAsteroid(x, y, "large"));
  }
}

function resetShip() {
  state.ship = {
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    vel: { x: 0, y: 0 },
    angle: -Math.PI / 2,
    thrusting: false,
  };
  state.invulnerable = 180;
}

function startGame() {
  state.score = 0;
  state.level = 1;
  state.lives = 3;
  state.gameOver = false;
  state.started = true;
  state.bullets = [];
  state.particles = [];
  state.explosionParticles = [];
  resetShip();
  initLevel(state.level);
  renderOverlay();
  startMusic();
}

function circleCollision(pos1, radius1, pos2, radius2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return dx * dx + dy * dy < (radius1 + radius2) * (radius1 + radius2);
}

function createExplosion(x, y, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    state.explosionParticles.push({
      pos: { x, y },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      life: 30 + Math.random() * 20,
    });
  }
}

function splitAsteroid(asteroid) {
  const next = asteroid.size === "large" ? "medium" : "small";
  if (asteroid.size === "small") return [];
  return [
    createAsteroid(asteroid.pos.x, asteroid.pos.y, next),
    createAsteroid(asteroid.pos.x, asteroid.pos.y, next),
  ];
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Thrust particles
  state.particles.forEach((particle) => {
    ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, ${particle.life / 20})`;
    ctx.beginPath();
    ctx.arc(particle.pos.x, particle.pos.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Explosion
  state.explosionParticles.forEach((particle) => {
    ctx.fillStyle = `rgba(255,255,255, ${particle.life / 50})`;
    ctx.beginPath();
    ctx.arc(particle.pos.x, particle.pos.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  if (!state.gameOver) {
    ctx.save();
    ctx.translate(state.ship.pos.x, state.ship.pos.y);
    ctx.rotate(state.ship.angle);
    if (
      state.invulnerable === 0 ||
      Math.floor(state.invulnerable / 5) % 2 === 0
    ) {
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(SHIP_SIZE, 0);
      ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_SIZE * 0.6);
      ctx.lineTo(-SHIP_SIZE * 0.4, 0);
      ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE * 0.6);
      ctx.closePath();
      ctx.stroke();
      if (state.ship.thrusting) {
        ctx.strokeStyle = "#ff6600";
        ctx.beginPath();
        ctx.moveTo(-SHIP_SIZE * 0.5, -SHIP_SIZE * 0.3);
        ctx.lineTo(-SHIP_SIZE * (0.8 + Math.random() * 0.5), 0);
        ctx.lineTo(-SHIP_SIZE * 0.5, SHIP_SIZE * 0.3);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  ctx.fillStyle = "#fff";
  state.bullets.forEach((bullet) => {
    ctx.beginPath();
    ctx.arc(bullet.pos.x, bullet.pos.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  state.asteroids.forEach((asteroid) => {
    ctx.save();
    ctx.translate(asteroid.pos.x, asteroid.pos.y);
    ctx.rotate(asteroid.rotation);
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
    asteroid.vertices
      .slice(1)
      .forEach((vertex) => ctx.lineTo(vertex.x, vertex.y));
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  });

  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`Puntaje: ${state.score}`, 20, 30);
  ctx.textAlign = "center";
  ctx.fillText(`Nivel ${state.level}`, CANVAS_WIDTH / 2, 30);
  ctx.textAlign = "right";
  ctx.fillText(`Vidas: ${state.lives}`, CANVAS_WIDTH - 20, 30);
}

function renderOverlay() {
  if (!state.started) {
    overlay.innerHTML = `
      <div>
        <p class="message-title">ASTEROIDS</p>
        <p class="message-subtitle">Presiona SPACE para comenzar</p>
        <p class="message-small">← → Rotar | ↑ Impulso | ↓ Frenar | SPACE Disparar</p>
      </div>`;
    return;
  }

  if (state.gameOver) {
    overlay.innerHTML = `
      <div>
        <p class="message-title">GAME OVER</p>
        <p class="message-subtitle">Puntaje final: ${state.score}</p>
        <p class="message-small">Presiona SPACE para jugar otra vez</p>
      </div>`;
    return;
  }

  overlay.innerHTML = "";
}

function update() {
  if (!state.started) {
    renderOverlay();
    draw();
    requestAnimationFrame(update);
    return;
  }

  if (state.gameOver) {
    renderOverlay();
    draw();
    requestAnimationFrame(update);
    return;
  }

  if (state.keys.left) state.ship.angle -= ROTATION_SPEED;
  if (state.keys.right) state.ship.angle += ROTATION_SPEED;
  state.ship.thrusting = state.keys.up;

  if (state.keys.up) {
    state.ship.vel.x += Math.cos(state.ship.angle) * THRUST_POWER;
    state.ship.vel.y += Math.sin(state.ship.angle) * THRUST_POWER;
    const speed = Math.hypot(state.ship.vel.x, state.ship.vel.y);
    playSound("./public/shipPropulsion.wav", 0.2);
    if (speed > MAX_SPEED) {
      state.ship.vel.x = (state.ship.vel.x / speed) * MAX_SPEED;
      state.ship.vel.y = (state.ship.vel.y / speed) * MAX_SPEED;
    }
    if (Math.random() > 0.5) {
      const angle = state.ship.angle + Math.PI + (Math.random() - 0.5) * 0.5;
      state.particles.push({
        pos: {
          x: state.ship.pos.x - Math.cos(state.ship.angle) * SHIP_SIZE,
          y: state.ship.pos.y - Math.sin(state.ship.angle) * SHIP_SIZE,
        },
        vel: {
          x: Math.cos(angle) * 3 + state.ship.vel.x * 0.5,
          y: Math.sin(angle) * 3 + state.ship.vel.y * 0.5,
        },
        life: 10 + Math.random() * 10,
      });
    }
  }

  if (state.keys.down) {
    state.ship.vel.x *= 0.95;
    state.ship.vel.y *= 0.95;
  }

  if (state.keys.space && state.fireCooldown <= 0) {
    state.bullets.push({
      pos: {
        x: state.ship.pos.x + Math.cos(state.ship.angle) * SHIP_SIZE,
        y: state.ship.pos.y + Math.sin(state.ship.angle) * SHIP_SIZE,
      },
      vel: {
        x: Math.cos(state.ship.angle) * BULLET_SPEED + state.ship.vel.x * 0.5,
        y: Math.sin(state.ship.angle) * BULLET_SPEED + state.ship.vel.y * 0.5,
      },
      life: BULLET_LIFE,
    });
    state.fireCooldown = FIRE_RATE;
    playShootSound();
  }

  if (state.fireCooldown > 0) state.fireCooldown -= 1;

  state.ship.vel.x *= FRICTION;
  state.ship.vel.y *= FRICTION;
  state.ship.pos.x += state.ship.vel.x;
  state.ship.pos.y += state.ship.vel.y;
  wrapPosition(state.ship.pos);

  state.bullets = state.bullets.filter((bullet) => {
    bullet.pos.x += bullet.vel.x;
    bullet.pos.y += bullet.vel.y;
    wrapPosition(bullet.pos);
    bullet.life -= 1;
    return bullet.life > 0;
  });

  state.asteroids.forEach((asteroid) => {
    asteroid.pos.x += asteroid.vel.x;
    asteroid.pos.y += asteroid.vel.y;
    asteroid.rotation += asteroid.rotationSpeed;
    wrapPosition(asteroid.pos);
  });

  state.particles = state.particles.filter((particle) => {
    particle.pos.x += particle.vel.x;
    particle.pos.y += particle.vel.y;
    particle.life -= 1;
    return particle.life > 0;
  });

  state.explosionParticles = state.explosionParticles.filter((particle) => {
    particle.pos.x += particle.vel.x;
    particle.pos.y += particle.vel.y;
    particle.vel.x *= 0.98;
    particle.vel.y *= 0.98;
    particle.life -= 1;
    return particle.life > 0;
  });

  let newAsteroids = [];
  state.asteroids = state.asteroids.filter((asteroid) => {
    const hit = state.bullets.some((bullet, index) => {
      if (circleCollision(bullet.pos, 2, asteroid.pos, asteroid.radius)) {
        state.bullets.splice(index, 1);
        state.score += 100;
        createExplosion(asteroid.pos.x, asteroid.pos.y, 12);
        newAsteroids = newAsteroids.concat(splitAsteroid(asteroid));
        playExplosionSound();
        return true;
      }
      return false;
    });
    return !hit;
  });
  state.asteroids.push(...newAsteroids);

  if (state.invulnerable > 0) state.invulnerable -= 1;
  if (state.invulnerable === 0) {
    for (const asteroid of state.asteroids) {
      if (
        circleCollision(
          state.ship.pos,
          SHIP_SIZE * 0.8,
          asteroid.pos,
          asteroid.radius * 0.8,
        )
      ) {
        createExplosion(state.ship.pos.x, state.ship.pos.y, 30);
        state.lives -= 1;
        state.invulnerable = 180;
        starShipExplosion();
        if (state.lives <= 0) {
          endMusic();
          state.gameOver = true;
          state.started = false;
        } else {
          resetShip();
        }
        break;
      }
    }
  }

  if (state.asteroids.length === 0 && !state.gameOver) {
    state.level += 1;
    resetShip();
    initLevel(state.level);
  }

  draw();
  renderOverlay();
  requestAnimationFrame(update);
}

function handleKeyDown(event) {
  switch (event.code) {
    case "Space":
      event.preventDefault();
      if (!state.started) {
        state.started = true;
        startGame();
      }
      state.keys.space = true;
      break;
    case "ArrowLeft":
      event.preventDefault();
      state.keys.left = true;
      break;
    case "ArrowRight":
      event.preventDefault();
      state.keys.right = true;
      break;
    case "ArrowUp":
      event.preventDefault();
      state.keys.up = true;
      break;
    case "ArrowDown":
      event.preventDefault();
      state.keys.down = true;
      break;
  }
}

function handleKeyUp(event) {
  switch (event.code) {
    case "Space":
      state.keys.space = false;
      break;
    case "ArrowLeft":
      state.keys.left = false;
      break;
    case "ArrowRight":
      state.keys.right = false;
      break;
    case "ArrowUp":
      state.keys.up = false;
      break;
    case "ArrowDown":
      state.keys.down = false;
      break;
  }
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

renderOverlay();
requestAnimationFrame(update);
