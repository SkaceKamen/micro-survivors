// @ts-check
"use strict";

/*
  TODO:
   - add waves until 10 minutes mark, add final boss there
   - add pickup weapons:
    - saw blades - rotates around player
    - barbed wire - slows & damages enemies around player
    - shuriken - ranged attack in random direction
    - lightning - chain lightning attack?
   - add armor and relevant upgrades?
   - endgame - when player kills final boss, they win
   - more enemies?
    - enemy with ranged attack?
    - enemy with unusual movement pattern?
   - map events?
    - enemy spawn in a shape around player?
   - starting screen?
   - map background?
*/

// #region Utility functions

/**
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

/**
 * @param {string} message
 */
const raise = (message) => {
  throw new Error(message);
};

/**
 * @template A
 * @param {A[]} array
 * @returns {A[]}
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * @template A
 * @param {A[]} a
 * @returns {A}
 */
const pickRandom = (a) => a[Math.round(Math.random() * (a.length - 1))];

// #endregion

// #region Rendering functions
/**
 * @param {CanvasRenderingContext2D} ctx
 * @returns
 */
const createDraw = (ctx) => ({
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {string} color
   */
  rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  },
  /**
   * @param {string} color
   */
  overlay(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  },
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} size
   * @param {string} color
   */
  box(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  },
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} size
   * @param {string} color
   */
  triangle(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x - size / 2, y + size / 2);
    ctx.lineTo(x + size / 2, y + size / 2);
    ctx.fill();
  },
  /**
   * @param {number} x
   * @param {number} y
   * @param {string} text
   * @param {string} color
   * @param {CanvasTextAlign} [hAlign="left"]
   * @param {CanvasTextBaseline} [vAlign="top"]
   */
  text(x, y, text, color, hAlign = "left", vAlign = "top") {
    ctx.fillStyle = color;
    ctx.textAlign = hAlign;
    ctx.textBaseline = vAlign;
    ctx.fillText(text, x, y);
  },
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @param {string} color
   */
  circle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  },
});

/**
 * @param {number} width
 * @param {number} height
 */
const createCanvas = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d") ?? raise("Failed to get 2d context");

  return {
    canvas,
    ctx,
  };
};

// #endregion

const width = 400;
const height = 400;

const { canvas, ctx } = createCanvas(width, height);
const draw = createDraw(ctx);

/** @type {Record<string, keyof typeof justPressedInput>} */
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

const WEAPON_TYPES = {
  /** @type {0} */
  SAW_BLADES: 0,
};

/**
 * @typedef SawBladesWeapon
 * @property {typeof WEAPON_TYPES.SAW_BLADES} type
 * @property {(level: number) => number} damage
 * @property {(level: number) => number} range
 * @property {(level: number) => number} rotationSpeed
 * @property {(level: number) => number} damageRate
 * @property {(level: number) => number} blades
 * @property {(level: number) => number} size
 */

/**
 * @typedef {SawBladesWeapon} WeaponType
 */

/** @type {SawBladesWeapon} */
const sawBlades = {
  type: WEAPON_TYPES.SAW_BLADES,
  damage: (level) => 1 + level,
  range: () => 50,
  rotationSpeed: (level) => Math.PI / 2 + level * 0.1,
  damageRate: () => 0.1,
  blades: (level) => 2 + Math.floor(level * 0.5),
  size: () => 10,
};

/**
 * @param {WeaponType} type
 */
const initializeWeapon = (type) => ({
  type,
  tick: 0,
  damageTick: 0,
  level: 0,
});

/** @typedef {ReturnType<typeof initializeWeapon>} Weapon */

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

/** @typedef {(player: Player) => void} UpgradeApply */
/** @typedef {(player: Player) => boolean} UpgradeCondition */

/**
 * @typedef Upgrade
 * @property {string} name
 * @property {string} description
 * @property {number} weight
 * @property {UpgradeApply} apply
 * @property {number} maxCount
 * @property {UpgradeCondition} [condition]
 */

/** @type {UpgradeCondition} */
const hasMelee = (player) => player.attrs.meleeDamage.value > 0;

/**
 * @param {keyof Player['attrs']} attr
 * @param {number} change
 * @returns {UpgradeApply}
 */
const baseAttr = (attr, change) => (player) =>
  player.attrs[attr].push("base", (_, value) => value + change);

/**
 * @param {keyof Player['attrs']} attr
 * @param {number} change
 * @returns {UpgradeApply}
 */
const multiplyAttr = (attr, change) => (player) =>
  player.attrs[attr].push("multiplier", (_, value) => value * change);

/** @type {Upgrade[]} */
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
    description: "+0.1/s health regen",
    weight: 1,
    apply: baseAttr("healthRegen", 0.1),
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
  {
    name: "Saw Blades",
    description: "Spinning disks around player",
    weight: 1,
    apply: (player) => player.weapons.push(initializeWeapon(sawBlades)),
    maxCount: 1,
  },
  {
    name: "Saw Blades +1 level",
    description: "Spinning disks around player",
    weight: 1,
    apply: (player) => {
      const existing = player.weapons.find((w) => w.type === sawBlades);
      if (existing) {
        existing.level++;
      }
    },
    condition: (player) => player.weapons.some((w) => w.type === sawBlades),
    maxCount: 5,
  },
];

/** @typedef {(player: any, value: number, attribute: string) => number} AttributeEnhancer */
/** @typedef {{ base: AttributeEnhancer[]; multiplier: AttributeEnhancer[]; playerLevel: number; value: number; }} AttributeCache */

/**
 * @param {string} attribute
 * @param {any[]} [base]
 * @param {any[]} [multiplier]
 */
const createAttribute = (attribute, base = [], multiplier = []) => ({
  /**
   * Add a new attribute modifier function
   * @param {'base' | 'multiplier'} type
   * @param {(player: Player, value: number, attribute: string) => number} fn
   */
  push(type, fn) {
    this[type] = [...this[type], fn];
  },

  // Base attribute value modifiers
  /** @type {AttributeEnhancer[]} */
  base: [
    // Default attribute value comes from the player type
    (player, value) => value + playerTypes[player.type][attribute],
    ...base,
  ],

  // Multiplier attribute value modifiers
  /** @type {AttributeEnhancer[]} */
  multiplier: [...multiplier],

  /** @type { AttributeCache | null} */
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

/** @typedef {ReturnType<typeof createAttribute>} PlayerAttribute */

/**
 * @param {number} increasePerLevel
 * @returns {AttributeEnhancer}
 */
const baseIncreaseWithLevel = (increasePerLevel) => (player, value) =>
  value + player.level * increasePerLevel;

/**
 * @param {number} value
 * @returns {AttributeEnhancer}
 */
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
  /** @type {Upgrade[]} */
  upgrades: [],

  // Weapons
  /** @type {Weapon[]} */
  weapons: [],
});

/** @typedef {ReturnType<typeof createPlayer>} Player */

let player = createPlayer();

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
  /** @type {Upgrade[]} */
  upgrades: [],
  selectedUpgradeIndex: 0,
};

const manager = {
  state: MANAGER_STATES.RUNNING,
  ...startingManagerState,
};

/** @typedef {{ health: number; speed: number; damage: number; damageTick: number; experience: number; boss?: boolean; pushBackResistance?: number; render: (x: number, y: number, hit: boolean) => void}} EnemyType */
/** @param {EnemyType} type */
const defineEnemy = (type) => type;

const boxLevel1 = defineEnemy({
  health: 10,
  speed: 20,
  damage: 1,
  damageTick: 1,
  experience: 1,
  render: (x, y, hit) => draw.box(x, y, 10, hit ? "#fff" : "#aaa"),
});

const boxLevel2 = defineEnemy({
  health: 50,
  speed: 20,
  damage: 1,
  damageTick: 1,
  experience: 2,
  render: (x, y, hit) => {
    draw.box(x + 1, y + 1, 10, hit ? "#fff" : "#faa");
    draw.box(x - 1, y - 1, 10, hit ? "#fff" : "#4aa");
  },
});

const boxLevel3 = defineEnemy({
  health: 100,
  speed: 21,
  damage: 2,
  damageTick: 1,
  experience: 3,
  render: (x, y, hit) => {
    draw.box(x + 1, y + 1, 10, hit ? "#fff" : "#faa");
    draw.box(x - 1, y - 1, 10, hit ? "#fff" : "#4aa");
    draw.box(x + 1, y - 1, 10, hit ? "#fff" : "#4a4");
  },
});

const boxBoss = defineEnemy({
  health: 500,
  speed: 20,
  damage: 10,
  damageTick: 1,
  experience: 20,
  render: (x, y, hit) => draw.box(x, y, 20, hit ? "#fff" : "#faa"),
  boss: true,
});

const triangleLevel1 = defineEnemy({
  health: 20,
  speed: 21,
  damage: 2,
  damageTick: 1,
  experience: 2,
  render: (x, y, hit) => draw.triangle(x, y, 10, hit ? "#fff" : "#999"),
});

const triangleLevel2 = defineEnemy({
  health: 40,
  speed: 25,
  damage: 2,
  damageTick: 1,
  experience: 3,
  render: (x, y, hit) => draw.triangle(x, y, 10, hit ? "#fff" : "#4aa"),
});

const triangleLevel3 = defineEnemy({
  health: 60,
  speed: 25,
  damage: 3,
  damageTick: 1,
  experience: 4,
  render: (x, y, hit) => draw.triangle(x, y, 10, hit ? "#fff" : "#966"),
});

const triangleBoss = defineEnemy({
  health: 1000,
  speed: 25,
  damage: 10,
  damageTick: 1,
  experience: 50,
  boss: true,
  pushBackResistance: 80,
  render: (x, y, hit) => draw.triangle(x, y, 20, hit ? "#fff" : "#faa"),
});

const circleLevel1 = defineEnemy({
  health: 10,
  speed: 30,
  damage: 1,
  damageTick: 1,
  experience: 3,
  render: (x, y, hit) => draw.circle(x, y, 5, hit ? "#fff" : "#999"),
});

const circleLevel2 = defineEnemy({
  health: 20,
  speed: 35,
  damage: 1,
  damageTick: 1,
  experience: 4,
  render: (x, y, hit) => draw.circle(x, y, 5, hit ? "#fff" : "#4aa"),
});

const circleLevel3 = defineEnemy({
  health: 50,
  speed: 35,
  damage: 1,
  damageTick: 1,
  experience: 5,
  render: (x, y, hit) => draw.circle(x, y, 6, hit ? "#fff" : "#4ca"),
});

const circleBoss = defineEnemy({
  health: 1000,
  speed: 35,
  damage: 5,
  damageTick: 1,
  experience: 4,
  boss: true,
  pushBackResistance: 80,
  render: (x, y, hit) => draw.circle(x, y, 5, hit ? "#fff" : "#faa"),
});

const finalBoss = defineEnemy({
  health: 10000,
  speed: 35,
  damage: 5,
  damageTick: 1,
  experience: 0,
  boss: true,
  pushBackResistance: 1000,
  render: (x, y, hit) => {
    draw.circle(x, y, 25, hit ? "#fff" : "#faa");
    draw.box(x, y, 25, hit ? "#fff" : "#4aa");
    draw.triangle(x, y, 23, hit ? "#fff" : "#faa");
  },
});

/**
 * @typedef SpawnRate
 * @property {number} from
 * @property {EnemyType[]} types
 * @property {number} rate
 * @property {EnemyType} [boss]
 */

/** @type {SpawnRate[]} */
const spawnRates = [
  { from: 0, types: [boxLevel1], rate: 0.6 },
  { from: 30, types: [boxLevel1, triangleLevel1], rate: 0.6 },
  { from: 80, types: [boxLevel1, triangleLevel1], rate: 0.2 },
  { from: 120, types: [triangleLevel1], rate: 0.3, boss: boxBoss },
  { from: 150, types: [triangleLevel1, circleLevel1], rate: 0.4 },
  { from: 200, types: [triangleLevel1, circleLevel1], rate: 0.2 },
  { from: 250, types: [boxLevel2], rate: 0.3 },
  { from: 300, types: [boxLevel2, triangleLevel2, circleLevel1], rate: 0.25 },
  {
    from: 330,
    types: [triangleLevel2, circleLevel1],
    boss: triangleBoss,
    rate: 0.25,
  },
  {
    from: 380,
    types: [triangleLevel2, circleLevel2, boxLevel2],
    rate: 0.2,
  },
  {
    from: 450,
    types: [circleLevel2, boxLevel3],
    rate: 0.2,
  },
  {
    from: 500,
    types: [boxLevel3, triangleLevel3],
    rate: 0.15,
  },
  {
    from: 550,
    types: [boxLevel3, triangleLevel3],
    rate: 0.1,
  },
  {
    from: 600,
    types: [boxLevel3, triangleLevel3, circleLevel3],
    rate: 0.15,
  },
  {
    from: 650,
    types: [boxLevel3, triangleLevel3],
    boss: circleBoss,
    rate: 0.15,
  },
  {
    from: 700,
    types: [boxLevel3, triangleLevel3, circleLevel3],
    rate: 0.1,
  },
  {
    from: 720,
    types: [],
    rate: 0,
    boss: finalBoss,
  },
];

/**
 * @param {number} x
 * @param {number} y
 * @param {EnemyType} type
 */
const initializeEnemy = (x, y, type) => ({
  x,
  y,
  type,
  health: type.health,
  damageTick: 0,
  pushBackX: 0,
  pushBackY: 0,
  hitTick: 0,
  boss: !!type.boss,
});

/** @typedef {ReturnType<typeof initializeEnemy>} Enemy */
/** @type {Enemy[]} */
const enemies = [];

const PICKUP_TYPES = {
  HEALTH: 0,
  EXPERIENCE: 1,
};

/** @type {Array<{ x: number; y: number; type: number; health?: number; experience?: number; }>} */
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

  for (const weapon of player.weapons) {
    switch (weapon.type.type) {
      case WEAPON_TYPES.SAW_BLADES: {
        const data = weapon.type;

        const anglePerBlade = (Math.PI * 2) / data.blades(weapon.level);
        const baseAngle = weapon.tick * data.rotationSpeed(weapon.level);

        for (let i = 0; i < data.blades(weapon.level); i++) {
          const angle = baseAngle + anglePerBlade * i;
          const bladeX = player.x + Math.cos(angle) * data.range(weapon.level);
          const bladeY = player.y + Math.sin(angle) * data.range(weapon.level);

          draw.circle(bladeX, bladeY, data.size(weapon.level) / 2, "#fff");
        }
      }
    }
  }

  draw.rect(player.x - 5, player.y - 5, 10, 10, "#fff");
}

function renderEnemies() {
  for (const enemy of enemies) {
    const type = enemy.type;
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

/**
 * @param {number} x
 * @param {number} y
 * @param {number} w
 */
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
    draw.text(x + w, y + i * 15, `${value}`, "#fff", "right");
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

  draw.text(width / 2, 35, formatTime(manager.runtime), "#fff", "center");

  if (manager.state === MANAGER_STATES.DEAD) {
    let y = 100;

    draw.rect(0, 0, width, height, "rgba(0, 0, 0, 0.8)");
    draw.text(width / 2, y, "You're dead!", "#f66", "center", "top");

    y += 30;

    const stats = [
      [`Survived for`, formatTime(manager.runtime)],
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
    draw.overlay("rgba(0, 0, 0, 0.9)");
    draw.text(width / 2, 10, "LEVEL UP", "#fff", "center", "top");

    for (let i = 0; i < manager.upgrades.length; i++) {
      const upgrade = manager.upgrades[i];
      // TODO: Cache this somehow?
      const alreadyApplied = player.upgrades.filter(
        (u) => u === upgrade
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
      130,
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

/**
 * @param {number} deltaTime
 */
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

/**
 * @param {number} deltaTime
 */
function enemiesTick(deltaTime) {
  let index = 0;
  let enemiesToRemove = [];

  for (const enemy of enemies) {
    const type = enemy.type;

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

    // Process push-back
    if (Math.abs(enemy.pushBackX) > 0.1) {
      const diff =
        (enemy.pushBackX > 0 ? -1 : 1) *
        deltaTime *
        (type.pushBackResistance ?? 20);

      if (Math.abs(diff) > Math.abs(enemy.pushBackX)) {
        enemy.pushBackX = 0;
      } else {
        enemy.pushBackX += diff;
      }
    } else {
      enemy.pushBackX = 0;
    }

    if (Math.abs(enemy.pushBackY) > 0.1) {
      const diff =
        (enemy.pushBackY > 0 ? -1 : 1) *
        deltaTime *
        (type.pushBackResistance ?? 20);

      if (Math.abs(diff) > Math.abs(enemy.pushBackY)) {
        enemy.pushBackY = 0;
      } else {
        enemy.pushBackY += diff;
      }
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

/**
 * @param {EnemyType} type
 */
function spawnEnemy(type) {
  const angle = Math.random() * Math.PI * 2;
  const side = Math.max(width, height) / 2;
  const minDistance = Math.sqrt(side * side * 2);
  const distance = minDistance + Math.random() * 15;

  enemies.push(
    initializeEnemy(
      player.x + Math.cos(angle) * distance,
      player.y + Math.sin(angle) * distance,
      type
    )
  );
}

/**
 * @param {number} deltaTime
 */
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
          if (spawnRate.types.length > 0) {
            const type = pickRandom(spawnRate.types);
            spawnEnemy(type);
          }
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
        upgrade.apply(player);
        player.upgrades.push(upgrade);
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

/**
 * @param {number} deltaTime
 */
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

    const availableUpgrades = upgrades.filter((upgrade) => {
      if (upgrade.condition && !upgrade.condition(player)) {
        return false;
      }

      if (
        upgrade.maxCount &&
        player.upgrades.filter((u) => u === upgrade).length >= upgrade.maxCount
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

  for (const weapon of player.weapons) {
    weapon.tick += deltaTime;

    switch (weapon.type.type) {
      case WEAPON_TYPES.SAW_BLADES: {
        const data = weapon.type;

        if (weapon.damageTick <= 0) {
          weapon.damageTick = data.damageRate(weapon.level);

          const anglePerBlade = (Math.PI * 2) / data.blades(weapon.level);
          const baseAngle = weapon.tick * data.rotationSpeed(weapon.level);

          for (let i = 0; i < data.blades(weapon.level); i++) {
            const angle = baseAngle + anglePerBlade * i;
            const bladeX =
              player.x + Math.cos(angle) * data.range(weapon.level);
            const bladeY =
              player.y + Math.sin(angle) * data.range(weapon.level);

            for (const enemy of enemies) {
              const dx = enemy.x - bladeX;
              const dy = enemy.y - bladeY;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < data.size(weapon.level) / 2 + 5) {
                enemy.health -= data.damage(weapon.level);
                enemy.hitTick = 0.1;
                enemy.pushBackX = Math.cos(angle) * 20;
                enemy.pushBackY = Math.sin(angle) * 20;

                manager.damageDone += data.damage(weapon.level);
              }
            }
          }
        } else {
          weapon.damageTick -= deltaTime;
        }

        break;
      }
    }
  }
}

/**
 * @param {number} deltaTime
 */
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
          player.health += pickup.health ?? 0;
          break;
        case PICKUP_TYPES.EXPERIENCE:
          player.experience += pickup.experience ?? 0;
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

/**
 * @param {number} deltaTime
 */
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
 * @param {DOMHighResTimeStamp} nextTime
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
  /**
   * @param {Partial<Player>} set
   */
  setPlayer: (set) => {
    for (const [key, value] of Object.entries(set)) {
      player[key] = value;
    }
  },
  setManager: (set) => {
    for (const [key, value] of Object.entries(set)) {
      manager[key] = value;
    }
  },
};
