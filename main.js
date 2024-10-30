"use strict";

const width = 400;
const height = 400;

const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;

const ctx = canvas.getContext("2d");

const inputMapping = {
  arrowup: "up",
  arrowdown: "down",
  arrowleft: "left",
  arrowright: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  enter: "enter",
  escape: "pause",
  p: "pause",
};

function shuffleArray(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * @param {KeyboardEvent} event
 * @param {boolean} state
 */
const processKeyEvent = (event, state) => {
  const mapped = inputMapping[event.key.toLowerCase()];
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
    description: "+25% speed",
    weight: 1,
    apply: multiplyAttr("speed", 1.25),
    maxCount: 5,
  },
  {
    name: "Speed base",
    description: "+1 base speed",
    weight: 1,
    apply: baseAttr("speed", 1),
    maxCount: 5,
  },
  {
    name: "Heal",
    description: "+25 health",
    weight: 1,
    condition: (player) => player.health < player.attrs.health.value,
    apply: (player) => (player.health += 25),
    maxCount: 5,
  },
  {
    name: "Max health",
    description: "+25 max health, +5 health",
    weight: 1,
    apply: (player) => {
      player.attrs.health.push("base", (_, value) => value + 25);
      player.health += 5;
    },
    maxCount: 5,
  },
  {
    name: "Melee damage",
    description: "+5 base melee damage",
    weight: 1,
    apply: baseAttr("meleeDamage", 5),
    condition: hasMelee,
    maxCount: 5,
  },
  {
    name: "Melee damage boost",
    description: "+25% melee damage",
    weight: 1,
    apply: multiplyAttr("meleeDamage", 1.25),
    condition: hasMelee,
    maxCount: 5,
  },
  {
    name: "Melee range",
    description: "+10 melee range",
    weight: 1,
    apply: baseAttr("meleeDistance", 10),
    condition: hasMelee,
    maxCount: 5,
  },
  {
    name: "Melee range boost",
    description: "+15% melee range",
    weight: 1,
    apply: multiplyAttr("meleeDistance", 1.15),
    condition: hasMelee,
    maxCount: 5,
  },
  {
    name: "Melee wider cone",
    description: "+10% melee cone width",
    weight: 1,
    apply: multiplyAttr("meleeAngle", 1.1),
    condition: hasMelee,
    maxCount: 5,
  },
  {
    name: "Melee attack speed",
    description: "+25% melee attack speed",
    weight: 1,
    apply: multiplyAttr("meleeTimeout", 0.75),
    condition: hasMelee,
    maxCount: 5,
  },
  {
    name: "Regen",
    description: "+0.05 health regen",
    weight: 1,
    apply: baseAttr("healthRegen", 0.05),
    maxCount: 5,
  },
  {
    name: "Regen boost",
    description: "+5% health regen",
    weight: 1,
    apply: multiplyAttr("healthRegen", 1.05),
    maxCount: 5,
  },
  {
    name: "Pickup range",
    description: "+10 pickup range",
    weight: 1,
    apply: baseAttr("pickupDistance", 10),
    maxCount: 5,
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

const baseValue = (value) => () => value;

const createPlayer = (type = 0) => ({
  // Predefined constants
  type,

  // State values
  x: 0,
  y: 0,
  level: 0,
  experience: 0,
  nextLevelExperience: 5,
  health: 100,
  meleeTick: 0,
  lastDamagedTick: 0,
  lastPickupTick: 0,
  meleeDirection: 0,

  // Attribute values
  attrs: {
    speed: createAttribute("speed", [baseIncreaseWithLevel(0.2)]),
    health: createAttribute("health", [baseIncreaseWithLevel(10)]),
    healthRegen: createAttribute("healthRegen", [baseValue(0.1)]),
    meleeAngle: createAttribute("meleeAngle"),
    meleeDistance: createAttribute("meleeDistance"),
    meleeDamage: createAttribute("meleeDamage", [baseIncreaseWithLevel(0.5)]),
    meleeTimeout: createAttribute("meleeTimeout"),
    pickupDistance: createAttribute("pickupDistance"),
  },

  // Already applied upgrades, index in upgrades array
  upgrades: [],
});

let player = createPlayer();

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  enter: false,
  pause: false,
  targetX: 0,
  targetY: 0,
};

const justPressedInput = {
  up: false,
  down: false,
  left: false,
  right: false,
  enter: false,
  pause: false,
};

const MANAGER_STATES = {
  RUNNING: 0,
  DEAD: 1,
  PICKING_UPGRADE: 2,
  PAUSED: 3,
};

const startingManagerState = {
  lastSpawnRate: -1,
  runtime: 0,
  damageDone: 0,
  kills: 0,
  spawnTimeout: 0,
  upgrades: [],
  selectedUpgradeIndex: 0,
};

const manager = {
  state: MANAGER_STATES.RUNNING,
  ...startingManagerState,
};

const draw = {
  rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  },
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
  text(x, y, text, color, hAlign = "left", vAlign = "top") {
    ctx.fillStyle = color;
    ctx.textAlign = hAlign;
    ctx.textBaseline = vAlign;
    ctx.fillText(text, x, y);
  },
  circle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  },
};

/** @typedef {{ health: number; speed: number; damage: number; damageTick: number; experience: number; }} EnemyType */
/** @type {EnemyType[]} */
const enemyTypes = [
  // Base square enemy
  {
    health: 10,
    speed: 20,
    damage: 1,
    damageTick: 1,
    experience: 1,
    render: (x, y, hit) => draw.box(x, y, 10, hit ? "#fff" : "#aaa"),
  },
  // Triangles
  {
    health: 20,
    speed: 21,
    damage: 2,
    damageTick: 1,
    experience: 2,
    render: (x, y, hit) => draw.triangle(x, y, 10, hit ? "#fff" : "#999"),
  },
  // Square boss
  {
    health: 500,
    speed: 20,
    damage: 10,
    damageTick: 1,
    boss: true,
    experience: 20,
    render: (x, y, hit) => draw.box(x, y, 20, hit ? "#fff" : "#faa"),
  },
  // Circle
  {
    health: 25,
    speed: 25,
    damage: 1,
    damageTick: 1,
    experience: 3,
    render: (x, y, hit) => draw.circle(x, y, 5, hit ? "#fff" : "#999"),
  },
];

const spawnRates = [
  { from: 0, types: [0], rate: 1 },
  { from: 30, types: [1, 0], rate: 1 },
  { from: 40, types: [1, 0], rate: 0.5 },
  { from: 60, types: [1], rate: 0.5, boss: 2 },
  { from: 90, types: [1, 3], rate: 0.7 },
  { from: 120, types: [1, 3], rate: 0.5 },
];

/** @typedef {{ x: number; y: number; type: number; health: number; hitTick: number; damageTick: number; boss: boolean; pushBackX: number; pushBackY: number; }} Enemy */
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

    if (type.boss) {
      draw.rect(enemy.x - 20, enemy.y + 15, 40, 3, "#333");
      draw.rect(
        enemy.x - 20,
        enemy.y + 15,
        (enemy.health / type.health) * 40,
        3,
        "#f33"
      );
    }
  }
}

function renderPickups() {
  for (const pickup of pickups) {
    draw.rect(pickup.x - 3, pickup.y - 3, 6, 6, "#05f");
  }
}

function renderPlayerStatsUi(x, y, w) {
  const stats = [
    ["Health", Math.floor(player.attrs.health.value)],
    ["Health Regen", player.attrs.healthRegen.value.toFixed(2) + "/s"],
    ["Speed", player.attrs.speed.value.toFixed(2)],
    ["Melee damage", player.attrs.meleeDamage.value.toFixed(2)],
    ["Melee range", player.attrs.meleeDistance.value.toFixed(2)],
    [
      "Melee angle",
      (player.attrs.meleeAngle.value * (180 / Math.PI)).toFixed(2),
    ],
    ["Melee speed", player.attrs.meleeTimeout.value.toFixed(2)],
  ];

  for (let i = 0; i < stats.length; i++) {
    const [name, value] = stats[i];
    draw.text(x, y + i * 15, `${name}:`, "#aaa");
    draw.text(x + w, y + i * 15, value, "#fff", "right");
  }
}

function renderUI() {
  draw.rect(50, 0, width - 50, 20, "#600");
  draw.rect(
    50,
    0,
    (player.health / player.attrs.health.value) * (width - 50),
    20,
    "#f66"
  );

  draw.text(
    50 + 2,
    10,
    `${Math.floor(player.health)} / ${Math.floor(player.attrs.health.value)}`,
    "#fff",
    "left",
    "middle"
  );

  draw.rect(50, 20, width - 50, 12, "#999");
  draw.rect(
    50,
    20,
    (player.experience / player.nextLevelExperience) * (width - 50),
    12,
    "#fff"
  );

  draw.text(
    50 + 2,
    27,
    `${player.experience} / ${player.nextLevelExperience}`,
    "#000",
    "left",
    "middle"
  );

  draw.rect(0, 0, 50, 32, "#000");
  draw.text(25, 2, "level", "#666", "center", "top");
  draw.text(25, 18, `${player.level + 1}`, "#fff", "center", "top");

  if (manager.state === MANAGER_STATES.DEAD) {
    let y = 100;

    draw.rect(0, 0, width, height, "rgba(0, 0, 0, 0.8)");
    draw.text(width / 2, y, "You're dead!", "#f66", "center", "top");

    y += 30;

    const stats = [
      [`Survived for`, `${Math.floor(manager.runtime)}s`],
      [`Level`, `${player.level + 1}`],
      [`Damage done`, `${manager.damageDone}`],
      [`DPS`, `${(manager.damageDone / manager.runtime).toFixed(2)}`],
      [`Kills`, `${manager.kills}`],
    ];

    for (const stat of stats) {
      draw.text(width / 2 - 5, y, stat[0], "#ccc", "right");
      draw.text(width / 2 + 5, y, stat[1], "#fff", "left");
      y += 15;
    }

    y += 30;

    draw.text(width / 2, y, "Press ENTER to restart", "#fff", "center");
  }

  if (manager.state === MANAGER_STATES.PICKING_UPGRADE) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.fillText("LEVEL UP", width / 2, 10);

    for (let i = 0; i < manager.upgrades.length; i++) {
      const upgrade = manager.upgrades[i][1];
      const upgradeIndex = manager.upgrades[i][0];
      // TODO: Cache this somehow?
      const alreadyApplied = player.upgrades.filter(
        (u) => u === upgradeIndex
      ).length;

      const x = 20;
      const y = 50 + i * 50;

      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = i === manager.selectedUpgradeIndex ? "#333" : "#222";
      ctx.fillRect(x, y, width - 40, 40);

      ctx.strokeStyle = i === manager.selectedUpgradeIndex ? "#aa3" : "#444";
      ctx.strokeRect(x, y, width - 40, 40);

      ctx.fillStyle = "#fff";
      ctx.fillText(upgrade.name, x + 5, y + 5);

      ctx.fillStyle = "#ccc";
      ctx.fillText(upgrade.description, x + 5, y + 22);

      draw.text(
        x + width - 50,
        y + 20,
        `${alreadyApplied}/${upgrade.maxCount}`,
        "#ccc",
        "right",
        "middle"
      );
    }

    renderPlayerStatsUi(100, 50 + 3 * 50 + 10, width - 200);
  }

  if (manager.state === MANAGER_STATES.PAUSED) {
    draw.rect(0, 0, width, height, "rgba(0, 0, 0, 0.9)");
    draw.text(width / 2, 100, "PAUSED", "#fff", "center", "middle");
    renderPlayerStatsUi(100, 110, width - 200);
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

  const p = Math.min(1, player.lastPickupTick / 0.1);
  if (p > 0) {
    const pickupOverlayGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      120,
      width / 2,
      height / 2,
      width / 2
    );

    pickupOverlayGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    pickupOverlayGradient.addColorStop(1, `rgba(255, 255, 255, ${p * 0.15})`);

    ctx.fillStyle = pickupOverlayGradient;
    ctx.fillRect(0, 0, width, height);
  }
}

function render() {
  ctx.reset();
  ctx.font = "14px monospace";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(-player.x + width / 2, -player.y + height / 2);

  renderPickups();
  renderPlayer();
  renderEnemies();

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
    case MANAGER_STATES.PICKING_UPGRADE:
    case MANAGER_STATES.PAUSED:
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
        experience: type.experience,
      });

      manager.kills += 1;

      enemiesToRemove.push(index);
      index++;
      continue;
    }

    if (enemy.hitTick > 0) {
      enemy.hitTick -= deltaTime;
    }

    let velocityX = enemy.pushBackX * deltaTime;
    let velocityY = enemy.pushBackY * deltaTime;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Remove enemies that are too far from player
    if (!enemy.boss && distance > width * 3) {
      enemiesToRemove.push(index);
      index++;
      continue;
    }

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
      velocityX += (dx / distance) * speed;
      velocityY += (dy / distance) * speed;
    } else {
      // Reset attack tick
      enemy.damageTick -= deltaTime;
    }

    // Move enemy
    enemy.x += velocityX;
    enemy.y += velocityY;

    if (Math.abs(enemy.pushBackX) > 0.1) {
      enemy.pushBackX += (enemy.pushBackX > 0 ? -1 : 1) * deltaTime * 20;
    } else {
      enemy.pushBackX = 0;
    }

    if (Math.abs(enemy.pushBackY) > 0.1) {
      enemy.pushBackY += (enemy.pushBackY > 0 ? -1 : 1) * deltaTime * 20;
    } else {
      enemy.pushBackY = 0;
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
    pushBackX: 0,
    pushBackY: 0,
  });
}

const pickRandom = (a) => a[Math.round(Math.random() * (a.length - 1))];

function managerTick(deltaTime) {
  switch (manager.state) {
    case MANAGER_STATES.RUNNING: {
      manager.runtime += deltaTime;

      if (justPressedInput.pause) {
        manager.state = MANAGER_STATES.PAUSED;
        break;
      }

      if (player.health <= 0) {
        manager.state = MANAGER_STATES.DEAD;
        break;
      }

      const spawnRateIndex =
        spawnRates.findIndex((rate) => rate.from > manager.runtime) - 1;
      const spawnRate =
        spawnRates[spawnRateIndex < 0 ? spawnRates.length - 1 : spawnRateIndex];

      if (spawnRate) {
        if (spawnRateIndex !== manager.lastSpawnRate) {
          manager.lastSpawnRate = spawnRateIndex;

          if (spawnRate.boss) {
            spawnEnemy(spawnRate.boss);
          }
        }

        if (manager.spawnTimeout > spawnRate.rate) {
          const type = pickRandom(spawnRate.types);
          spawnEnemy(type);
          manager.spawnTimeout = 0;
        } else {
          manager.spawnTimeout += deltaTime;
        }
      }

      break;
    }

    case MANAGER_STATES.DEAD:
      if (input.enter) {
        player = createPlayer();

        // Reset game state
        for (const key in startingManagerState) {
          manager[key] = startingManagerState[key];
        }

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
        upgrade[1].apply(player);
        player.upgrades.push(upgrade[0]);
        manager.state = MANAGER_STATES.RUNNING;
      }

      break;

    case MANAGER_STATES.PAUSED:
      if (justPressedInput.pause || justPressedInput.enter) {
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
    player.nextLevelExperience += 10;

    manager.state = MANAGER_STATES.PICKING_UPGRADE;

    const availableUpgrades = upgrades
      .map((upgrade, index) => [index, upgrade])
      .filter(([upgradeIndex, upgrade]) => {
        if (upgrade.condition && !upgrade.condition(player)) {
          return false;
        }

        if (
          upgrade.maxCount &&
          player.upgrades.filter((u) => u === upgradeIndex).length >=
            upgrade.maxCount
        ) {
          return false;
        }

        return true;
      });

    // TODO: Weights
    manager.upgrades = shuffleArray(Array.from(availableUpgrades)).slice(0, 3);

    player.health += 5;
  }

  if (player.lastDamagedTick > 0) {
    player.lastDamagedTick -= deltaTime;
  }

  if (player.lastPickupTick > 0) {
    player.lastPickupTick -= deltaTime;
  }

  player.health = Math.min(
    player.attrs.health.value,
    player.health + player.attrs.healthRegen.value * deltaTime
  );
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

      player.lastPickupTick = 0.1;

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
        enemy.pushBackX = Math.cos(angle) * 25;
        enemy.pushBackY = Math.sin(angle) * 25;

        manager.damageDone += player.attrs.meleeDamage.value;
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

const DEBUG = {
  setPlayer: (set) => {
    for (const [key, value] of Object.entries(set)) {
      player[key] = value;
    }
  },
};
