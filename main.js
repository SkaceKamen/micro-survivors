const width = 400;
const height = 400;

const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;

const ctx = canvas.getContext("2d");

const inputMapping = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Enter: "enter",
};

/**
 * @param {KeyboardEvent} event
 * @param {boolean} state
 */
const processKeyEvent = (event, state) => {
  const mapped = inputMapping[event.key];
  if (mapped) {
    input[mapped] = state;
    justPressedInput[mapped] = state;
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

const hasMelee = (player) => player.attrs.meleeDamage.value > 0;
const baseAttr = (attr, change) => (player) =>
  player.attrs[attr].push("base", (_, value) => value + change);
const multiplyAttr = (attr, change) => (player) =>
  player.attrs[attr].push("multiplier", (_, value) => value * change);

const upgrades = [
  {
    name: "Speed boost",
    description: "+5% speed",
    weight: 1,
    apply: multiplyAttr("speed", 1.05),
  },
  {
    name: "Speed base",
    description: "+0.5 base speed",
    weight: 1,
    apply: baseAttr("speed", 0.5),
  },
  {
    name: "Heal",
    description: "+25 health",
    weight: 1,
    condition: (player) => player.health < player.attrs.health.value,
    apply: (player) => (player.health += 25),
  },
  {
    name: "Max health",
    description: "+25 max health, +5 health",
    weight: 1,
    apply: (player) => {
      player.attrs.health.push("base", (_, value) => value + 25);
      player.health += 5;
    },
  },
  {
    name: "Melee damage",
    description: "+5 base melee damage",
    weight: 1,
    apply: baseAttr("meleeDamage", 5),
    condition: hasMelee,
  },
  {
    name: "Melee damage boost",
    description: "+25% melee damage",
    weight: 1,
    apply: multiplyAttr("meleeDamage", 1.25),
    condition: hasMelee,
  },
  {
    name: "Melee range",
    description: "+10 melee range",
    weight: 1,
    apply: baseAttr("meleeDistance", 10),
    condition: hasMelee,
  },
  {
    name: "Melee range boost",
    description: "+15% melee range",
    weight: 1,
    apply: multiplyAttr("meleeDistance", 1.15),
    condition: hasMelee,
  },
  {
    name: "Melee wider cone",
    description: "+10% melee cone width",
    weight: 1,
    apply: multiplyAttr("meleeAngle", 1.1),
    condition: hasMelee,
  },
  {
    name: "Melee attack speed",
    description: "+25% melee attack speed",
    weight: 1,
    apply: multiplyAttr("meleeTimeout", 0.75),
    condition: hasMelee,
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
  push(type, fn) {
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
    meleeDamage: createAttribute("meleeDamage", [baseIncreaseWithLevel(0.5)]),
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

const justPressedInput = {
  up: false,
  down: false,
  left: false,
  right: false,
  enter: false,
};

const MANAGER_STATES = {
  RUNNING: 0,
  DEAD: 1,
  PICKING_UPGRADE: 2,
};

const manager = {
  state: MANAGER_STATES.RUNNING,
  lastSpawnRate: 0,
  runtime: 0,
  spawnTimeout: 0,
  upgrades: [],
  selectedUpgradeIndex: 0,
};

const draw = {
  box(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  },
  triangle(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x - size / 2, y + size / 2);
    ctx.lineTo(x + size / 2, y + size / 2);
    ctx.fill();
  },
};

/** @typedef {{ health: number; speed: number; damage: number; damageTick: number; }} EnemyType */
/** @type {EnemyType[]} */
const enemyTypes = [
  // Base square enemy
  {
    health: 10,
    speed: 20,
    damage: 1,
    damageTick: 1,
    render: (x, y, hit) => draw.box(x, y, 10, hit ? "#fff" : "#aaa"),
  },
  // Triangles
  {
    health: 20,
    speed: 21,
    damage: 2,
    damageTick: 1,
    render: (x, y, hit) => draw.triangle(x, y, 10, hit ? "#fff" : "#999"),
  },
  // Square boss
  {
    health: 500,
    speed: 20,
    damage: 10,
    damageTick: 1,
    render: (x, y) => draw.box(x, y, 20, hit ? "#fff" : "#faa"),
  },
];

const spawnRates = [
  { from: 0, type: 0, rate: 1 },
  { from: 5, type: 1, rate: 1 },
  { from: 40, type: 0, rate: 0.5 },
  { from: 60, type: 1, rate: 0.5, boss: 2 },
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
    const type = enemyTypes[enemy.type];
    type.render(enemy.x, enemy.y, enemy.hitTick > 0);
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

  if (manager.state === MANAGER_STATES.PICKING_UPGRADE) {
    ctx.fillStyle = "rgba(0, 0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.fillText("LEVEL UP", width / 2, 10);

    ctx.textAlign = "left";
    for (let i = 0; i < manager.upgrades.length; i++) {
      const upgrade = manager.upgrades[i];
      const x = 20;
      const y = 50 + i * 50;

      ctx.fillStyle = i === manager.selectedUpgradeIndex ? "#333" : "#222";
      ctx.fillRect(x, y, width - 40, 40);

      ctx.strokeStyle = i === manager.selectedUpgradeIndex ? "#aa3" : "#444";
      ctx.strokeRect(x, y, width - 40, 40);

      ctx.fillStyle = "#fff";
      ctx.fillText(upgrade.name, x + 5, y + 5);

      ctx.fillStyle = "#ccc";
      ctx.fillText(upgrade.description, x + 5, y + 22);
    }
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
    case MANAGER_STATES.PICKING_UPGRADE:
      managerTick(deltaTime);
      break;
  }

  inputTick();
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

function spawnEnemy(type) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.max(width, height) / 2 + Math.random() * 100;

  enemies.push({
    x: player.x + Math.cos(angle) * distance,
    y: player.y + Math.sin(angle) * distance,
    type: type,
    health: enemyTypes[type].health,
    damageTick: 0,
  });
}

function managerTick(deltaTime) {
  switch (manager.state) {
    case MANAGER_STATES.RUNNING: {
      manager.runtime += deltaTime;

      if (player.health <= 0) {
        manager.state = MANAGER_STATES.DEAD;
        break;
      }

      const spawnRateIndex =
        spawnRates.findIndex((rate) => rate.from > manager.runtime) - 1;
      const spawnRate = spawnRates[spawnRateIndex];

      if (spawnRateIndex !== manager.lastSpawnRate) {
        manager.lastSpawnRate = spawnRateIndex;

        if (spawnRate.boss) {
          spawnEnemy(spawnRate.boss);
        }
      }

      if (manager.spawnTimeout > spawnRate.rate) {
        spawnEnemy(spawnRate.type);
        manager.spawnTimeout = 0;
      } else {
        manager.spawnTimeout += deltaTime;
      }

      break;
    }

    case MANAGER_STATES.DEAD:
      if (input.enter) {
        player = createPlayer();

        manager.runtime = 0;
        manager.spawnTimeouts = 0;
        manager.state = MANAGER_STATES.RUNNING;

        enemies.length = 0;
        pickups.length = 0;
      }

      break;

    case MANAGER_STATES.PICKING_UPGRADE:
      if (justPressedInput.up && manager.selectedUpgradeIndex > 0) {
        manager.selectedUpgradeIndex--;
      }

      if (
        justPressedInput.down &&
        manager.selectedUpgradeIndex < manager.upgrades.length - 1
      ) {
        manager.selectedUpgradeIndex++;
      }

      if (justPressedInput.enter) {
        const upgrade = manager.upgrades[manager.selectedUpgradeIndex];
        upgrade.apply(player);
        manager.state = MANAGER_STATES.RUNNING;
      }

      break;
  }
}

function inputTick() {
  for (const key in justPressedInput) {
    justPressedInput[key] = false;
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
    applyPlayerMeleeAttack(deltaTime);
    player.meleeTick = player.attrs.meleeTimeout.value;
  }

  if (player.experience >= player.nextLevelExperience) {
    player.level += 1;
    player.experience -= player.nextLevelExperience;
    player.nextLevelExperience += 50;

    manager.state = MANAGER_STATES.PICKING_UPGRADE;
    // TODO: Weights
    manager.upgrades = upgrades
      .slice()
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

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

function applyPlayerMeleeAttack(deltaTime) {
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
