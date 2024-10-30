const width = 400;
const height = 400;

const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;

const ctx = canvas.getContext("2d");

/**
 * @param {KeyboardEvent} event
 * @param {boolean} state
 */
const processKeyEvent = (event, state) => {
  switch (event.key) {
    case "ArrowUp":
      input.up = state;
      break;
    case "ArrowDown":
      input.down = state;
      break;
    case "ArrowLeft":
      input.left = state;
      break;
    case "ArrowRight":
      input.right = state;
      break;
    case "Enter":
      input.enter = state;
      break;
  }
};

document.addEventListener("keydown", (event) => processKeyEvent(event, true));
document.addEventListener("keyup", (event) => processKeyEvent(event, false));

canvas.addEventListener("mousemove", (event) => {
  input.targetX = event.clientX;
  input.targetY = event.clientY;
});

const playerTypes = [
  {
    health: 100,
    speed: 25,
    meleeAngle: Math.PI / 4,
    meleeDistance: 80,
    meleeDamage: 8,
    meleeTimeout: 0.5,
    pickupDistance: 50,
  },
];

/**
 * @param {string} attribute
 * @param {any[]} [base]
 * @param {any[]} [multiplier]
 */
const createAttribute = (attribute, base = [], multiplier = []) => ({
  /**
   * Add a new attribute modifier function
   * @param {'base' | 'multiplier'} type
   * @param {(player, value, attribute) => number} fn
   */
  push: (type, fn) => {
    this[type] = [...this[type], fn];
  },

  // Base attribute value modifiers
  base: [
    // Default attribute value comes from the player type
    (player, value) => value + playerTypes[player.type][attribute],
    ...base,
  ],

  // Multiplier attribute value modifiers
  multiplier: [...multiplier],

  $cached: null,
  get value() {
    if (
      this.$cached?.base === this.base &&
      this.$cached?.multiplier === this.multiplier &&
      this.$cached?.playerLevel === player.level
    ) {
      return this.$cached.value;
    }

    const value =
      this.base.reduce((acc, fn) => fn(player, acc, attribute), 0) *
      this.multiplier.reduce((acc, fn) => fn(player, acc, attribute), 1);

    this.$cached = {
      base: this.base,
      multiplier: this.multiplier,
      playerLevel: player.level,
      value,
    };

    return value;
  },
});

const baseIncreaseWithLevel = (increasePerLevel) => (player, value) =>
  value + player.level * increasePerLevel;

const createPlayer = (type = 0) => ({
  // Predefined constants
  type,

  // State values
  x: 0,
  y: 0,
  level: 0,
  experience: 0,
  nextLevelExperience: 50,
  health: 100,
  meleeTick: 0,
  lastDamagedTick: 0,
  meleeDirection: 0,

  // Attribute values
  attrs: {
    speed: createAttribute("speed", [baseIncreaseWithLevel(0.2)]),
    health: createAttribute("health", [baseIncreaseWithLevel(10)]),
    meleeAngle: createAttribute("meleeAngle"),
    meleeDistance: createAttribute("meleeDistance"),
    meleeDamage: createAttribute("meleeDamage", [baseIncreaseWithLevel(2)]),
    meleeTimeout: createAttribute("meleeTimeout"),
    pickupDistance: createAttribute("pickupDistance"),
  },
});

let player = createPlayer();

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  enter: false,
  targetX: 0,
  targetY: 0,
};

const MANAGER_STATES = {
  RUNNING: 0,
  DEAD: 1,
};

const manager = {
  state: MANAGER_STATES.RUNNING,
  runtime: 0,
  spawnTimeout: 0,
};

/** @typedef {{ health: number; speed: number; damage: number; damageTick: number; }} EnemyType */
/** @type {EnemyType[]} */
const enemyTypes = [
  {
    health: 10,
    speed: 20,
    damage: 1,
    damageTick: 1,
  },
];

/** @typedef {{ x: number; y: number; type: number; health: number; hitTick: number; damageTick: number; }} Enemy */
/** @type {Enemy[]} */
const enemies = [];

const PICKUP_TYPES = {
  HEALTH: 0,
  EXPERIENCE: 1,
};

/** @type {Array<{ x: number; y: number; type: number; health: number; experience: number; }>} */
const pickups = [];

function renderPlayer() {
  const coneD = 0.2 + (player.meleeTick - player.attrs.meleeTimeout.value);
  if (coneD > 0) {
    const coneA2 = player.attrs.meleeAngle.value / 2;

    ctx.fillStyle = `rgba(255, 255, 255, ${coneD})`;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
      player.x +
        Math.cos(player.meleeDirection - coneA2) *
          player.attrs.meleeDistance.value,
      player.y +
        Math.sin(player.meleeDirection - coneA2) *
          player.attrs.meleeDistance.value
    );

    ctx.arc(
      player.x,
      player.y,
      player.attrs.meleeDistance.value,
      player.meleeDirection - coneA2,
      player.meleeDirection + coneA2
    );

    ctx.lineTo(player.x, player.y);
    ctx.fill();
  }

  ctx.fillStyle = "#fff";
  ctx.fillRect(player.x - 5, player.y - 5, 10, 10);
}

function renderEnemies() {
  for (const enemy of enemies) {
    ctx.fillStyle = enemy.hitTick > 0 ? "#fff" : "#aaa";
    ctx.fillRect(enemy.x - 5, enemy.y - 5, 10, 10);
  }
}

function renderPickups() {
  for (const pickup of pickups) {
    ctx.fillStyle = "#05f";
    ctx.fillRect(pickup.x - 3, pickup.y - 3, 6, 6);
  }
}

function renderUI() {
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#600";
  ctx.fillRect(0, 0, width, 20);
  ctx.fillStyle = "#f66";
  ctx.fillRect(0, 0, (player.health / player.attrs.health.value) * width, 20);
  ctx.fillStyle = "#fff";
  ctx.fillText(`${player.health} / ${player.attrs.health.value}`, 2, 10);

  ctx.fillStyle = "#999";
  ctx.fillRect(0, 20, width, 15);
  ctx.fillStyle = "#fff";
  ctx.fillRect(
    0,
    20,
    (player.experience / player.nextLevelExperience) * width,
    15
  );
  ctx.fillStyle = "#000";
  ctx.fillText(`Level ${player.level + 1}`, 2, 30);

  if (manager.state === MANAGER_STATES.DEAD) {
    ctx.fillStyle = "rgba(255, 0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#f66";
    ctx.fillText("You're dead!", width / 2 - 20, height / 2);
  }
}

function renderOverlays() {
  const d = Math.min(1, player.lastDamagedTick / 0.5);

  if (d > 0) {
    const damageOverlayGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      80,
      width / 2,
      height / 2,
      width / 2
    );

    damageOverlayGradient.addColorStop(0, "rgba(255, 0, 0, 0)");
    damageOverlayGradient.addColorStop(1, `rgba(255, 0, 0, ${d})`);

    ctx.fillStyle = damageOverlayGradient;
    ctx.fillRect(0, 0, width, height);
  }
}

function render() {
  ctx.reset();
  ctx.font = "14px monospace";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(-player.x + width / 2, -player.y + height / 2);

  renderPlayer();
  renderEnemies();
  renderPickups();

  ctx.resetTransform();
  renderOverlays();
  renderUI();
}

function gameLogicTick(deltaTime) {
  switch (manager.state) {
    case MANAGER_STATES.RUNNING:
      managerTick(deltaTime);
      enemiesTick(deltaTime);
      pickupsTick(deltaTime);
      playerTick(deltaTime);
      break;
    case MANAGER_STATES.DEAD:
      managerTick(deltaTime);
      break;
  }
}

function enemiesTick(deltaTime) {
  let index = 0;
  let enemiesToRemove = [];

  for (const enemy of enemies) {
    const type = enemyTypes[enemy.type];

    if (enemy.health <= 0) {
      pickups.push({
        x: enemy.x,
        y: enemy.y,
        type: PICKUP_TYPES.EXPERIENCE,
        experience: 5,
      });

      enemiesToRemove.push(index);
      index++;
      continue;
    }

    if (enemy.hitTick > 0) {
      enemy.hitTick -= deltaTime;
    }

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // When ready to attack
    if (enemy.damageTick <= 0) {
      // Damage player when close
      if (distance < 10) {
        player.health -= type.health;
        player.lastDamagedTick = 0.5;
        enemy.damageTick = type.damageTick;
      }

      // Move towards player
      const speed = type.speed * deltaTime;
      enemy.x += (dx / distance) * speed;
      enemy.y += (dy / distance) * speed;
    } else {
      // Reset attack tick
      enemy.damageTick -= deltaTime;
    }

    index++;
  }

  let offset = 0;
  for (const index of enemiesToRemove) {
    enemies.splice(index - offset, 1);
    offset += 1;
  }
}

function managerTick(deltaTime) {
  switch (manager.state) {
    case MANAGER_STATES.RUNNING: {
      manager.runtime += deltaTime;
      manager.spawnTimeout += deltaTime;

      if (player.health <= 0) {
        manager.state = MANAGER_STATES.DEAD;
        break;
      }

      // Gradually increase spawn rate
      const spawnRate = Math.max(0.01, 2 - manager.runtime / 60);

      if (manager.spawnTimeout > spawnRate) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(width, height) / 2 + Math.random() * 100;

        enemies.push({
          x: player.x + Math.cos(angle) * distance,
          y: player.y + Math.sin(angle) * distance,
          type: 0,
          health: 10,
          damageTick: 0,
        });

        manager.spawnTimeout = 0;
      }

      break;
    }
    case MANAGER_STATES.DEAD:
      if (input.enter) {
        player = createPlayer();

        manager.runtime = 0;
        manager.spawnTimeout = 0;
        manager.state = MANAGER_STATES.RUNNING;

        enemies.length = 0;
        pickups.length = 0;
      }

      break;
  }
}

function playerTick(deltaTime) {
  let moveX = 0;
  let moveY = 0;

  if (input.up) {
    moveY -= 1;
  }
  if (input.down) {
    moveY += 1;
  }
  if (input.left) {
    moveX -= 1;
  }
  if (input.right) {
    moveX += 1;
  }

  const speed = player.attrs.speed.value * deltaTime;
  const moveD = Math.sqrt(moveX * moveX + moveY * moveY);

  if (moveD > 0) {
    player.x += (moveX / moveD) * speed;
    player.y += (moveY / moveD) * speed;
  }

  const playerAbsoluteX = width / 2;
  const playerAbsoluteY = height / 2;

  player.meleeDirection = Math.atan2(
    input.targetY - playerAbsoluteY,
    input.targetX - playerAbsoluteX
  );

  if (player.meleeTick > 0) {
    player.meleeTick -= deltaTime;
  } else {
    applyPlayerConeAttack(deltaTime);
    player.meleeTick = player.attrs.meleeTimeout.value;
  }

  if (player.experience > player.nextLevelExperience) {
    player.level += 1;
    player.experience -= player.nextLevelExperience;
    player.nextLevelExperience += 50;

    player.health += 5;
  }

  if (player.lastDamagedTick > 0) {
    player.lastDamagedTick -= deltaTime;
  }
}

function pickupsTick(deltaTime) {
  let index = 0;
  let pickupsToRemove = [];

  for (const pickup of pickups) {
    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) {
      switch (pickup.type) {
        case PICKUP_TYPES.HEALTH:
          player.health += pickup.health;
          break;
        case PICKUP_TYPES.EXPERIENCE:
          player.experience += pickup.experience;
          break;
      }

      pickupsToRemove.push(index);
    } else if (distance < player.attrs.pickupDistance.value) {
      const speed =
        (player.attrs.pickupDistance.value + 10 - distance) * deltaTime * 2;
      pickup.x += (dx / distance) * speed;
      pickup.y += (dy / distance) * speed;
    }

    index++;
  }

  let offset = 0;
  for (const index of pickupsToRemove) {
    pickups.splice(index - offset, 1);
    offset += 1;
  }
}

function applyPlayerConeAttack(deltaTime) {
  const coneA2 = player.attrs.meleeAngle.value / 2;
  const coneStart = player.meleeDirection - coneA2;
  const coneEnd = player.meleeDirection + coneA2;

  for (const enemy of enemies) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;

    if (
      Math.abs(dx) > player.attrs.meleeDistance.value ||
      Math.abs(dy) > player.attrs.meleeDistance.value
    ) {
      continue;
    }

    const angle = Math.atan2(dy, dx);

    if (angle > coneStart && angle < coneEnd) {
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < player.attrs.meleeDistance.value) {
        enemy.health -= player.attrs.meleeDamage.value;
        enemy.hitTick = 0.1;
      }
    }
  }
}

let lastTime = 0;

/**
 * @param {DOMHighResTimeStamp?} time
 */
function animationFrameTick(nextTime) {
  requestAnimationFrame(animationFrameTick);

  const delta = (nextTime - lastTime) / 1000;
  lastTime = nextTime;

  render();
  gameLogicTick(delta);
}

window.addEventListener("load", () => {
  document.body.appendChild(canvas);
  requestAnimationFrame(animationFrameTick);
});

DEBUG = {
  setPlayer: (set) => {
    for (const [key, value] of Object.entries(set)) {
      player[key] = value;
    }
  },
};
