// @ts-check
"use strict";

function microSurvivors(target = document.body, width = 400, height = 400) {
  /*
  TODO:
   - add pickup weapons:
    - shuriken - ranged attack in random direction
    - lightning - chain lightning attack?
   - add armor and relevant upgrades?
   - more enemies?
    - enemy with ranged attack?
    - enemy with unusual movement pattern?
*/

  // #region Constants
  const font = "monospace";
  const help = [
    "WASD/Arrows to move",
    "Mouse to aim",
    "Survive",
    "Kill end boss",
  ];
  const w2 = width / 2;
  const h2 = height / 2;
  const { floor, ceil, random, round, cos, sin, min, hypot, abs, atan2, PI } =
    Math;
  const PI2 = PI * 2;
  const pressEnter = "Press ENTER to ";
  const pressEnterToStart = pressEnter + "start";
  const pressEnterToRestart = pressEnter + "restart";
  // #endregion

  // #region Utility functions

  /**
   * @param {string | number} n
   * @param {number} [width=2]
   * @param {string} [z="0"]
   */
  const pad = (n, width = 2, z = "0") => n.toString().padStart(width, z);

  /**
   * @param {number} seconds
   * @returns {string}
   */
  function formatTime(seconds) {
    const minutes = floor(seconds / 60);
    const remainingSeconds = floor(seconds % 60);
    return pad(minutes) + ":" + pad(remainingSeconds);
  }

  const raise = () => {
    throw new Error();
  };

  /**
   * Format angle
   *
   * @param {number} a angle in radians
   */
  const formatAngle = (a) => formatNumber(a * (180 / PI));

  /**
   * Format number with fixed decimal places
   *
   * @param {number} n
   * @param {number} [d=0]
   */
  const formatNumber = (n, d = 0) => n.toFixed(d);

  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  const distance = (x1, y1, x2, y2) => hypot(x2 - x1, y2 - y1);

  /**
   * @template A
   * @param {A[]} array
   * @returns {A[]}
   */
  function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
      const j = floor(random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * @template A
   * @param {A[]} a
   * @returns {A}
   */
  const pickRandom = (a) => a[round(random() * (a.length - 1))];

  // #endregion

  // #region Rendering functions
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @returns
   */
  const draw = {
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
     * @param {string | CanvasGradient} style
     */
    overlay(style = "#000000e5") {
      ctx.fillStyle = style;
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
    text(x, y, text, color, hAlign = "left", vAlign = "top", size = 14) {
      ctx.font = `${size}px ${font}`;
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
      ctx.arc(x, y, radius, 0, PI2);
      ctx.fill();
    },
  };

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {(string | number)[][]} table
   */
  const renderStatsTable = (x, y, w, h, table) => {
    const rowHeight = 15;
    const tableY = y;
    let rowWidth = w / 2;

    if (table.length * rowHeight < h) {
      x += w / 4;
    }

    for (const [name, value] of table) {
      draw.text(x, y, `${name}:`, "#aaa");
      draw.text(x + rowWidth - 5, y, `${value}`, "#fff", "right");

      y += rowHeight;

      if (y > tableY + h) {
        y = tableY;
        x += rowWidth;
      }
    }
  };

  /**
   * @param {number} r0
   * @param {string} c1
   * @param {string} c2
   */
  const screenGradient = (r0, c1, c2) => {
    const gradient = ctx.createRadialGradient(w2, h2, r0, w2, h2, w2);

    gradient.addColorStop(0, c1);
    gradient.addColorStop(1, c2);

    return gradient;
  };

  // #endregion

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d") ?? raise();

  /** @type {Record<string, keyof typeof justPressedInput>} */
  const inputMapping = {
    "arrowup": "up",
    "arrowdown": "down",
    "arrowleft": "left",
    "arrowright": "right",
    "w": "up",
    "s": "down",
    "a": "left",
    "d": "right",
    "enter": "enter",
    "escape": "pause",
    "p": "pause",
  };

  const input = {
    "up": false,
    "down": false,
    "left": false,
    "right": false,
    "enter": false,
    "pause": false,
    "targetX": 0,
    "targetY": 0,
  };

  const justPressedInput = {
    "up": false,
    "down": false,
    "left": false,
    "right": false,
    "enter": false,
    "pause": false,
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

  const listen = "addEventListener";

  document[listen]("keydown", (event) => processKeyEvent(event, true));
  document[listen]("keyup", (event) => processKeyEvent(event, false));

  canvas[listen]("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    input.targetX = event.clientX - rect.left;
    input.targetY = event.clientY - rect.top;
  });

  const WEAPON_TYPES = {
    /** @type {0} */
    SAW_BLADES: 0,
    /** @type {1} */
    MELEE: 1,
    /** @type {2} */
    AREA: 2,
  };

  /**
   * @template LevelType
   * @param {[LevelType, ...Partial<LevelType>[]]} levels
   * @returns {LevelType[]}
   */
  const fillLevels = (levels) => {
    let previous = levels[0];
    /** @type {LevelType[]} */
    let result = [levels[0]];
    for (let i = 1; i < levels.length; i++) {
      previous = {
        ...previous,
        ...levels[i],
      };

      result[i] = previous;
    }
    return result;
  };

  /**
   * @typedef SawBladesWeaponLevel
   * @property {number} damage
   * @property {number} range
   * @property {number} rotationSpeed
   * @property {number} damageRate
   * @property {number} blades
   * @property {number} size
   */

  /**
   * @typedef SawBladesWeapon
   * @property {string} name
   * @property {typeof WEAPON_TYPES.SAW_BLADES} type
   * @property {SawBladesWeaponLevel[]} levels
   */

  /** @type {SawBladesWeapon} */
  const sawBlades = {
    name: "Saw Blades",
    type: WEAPON_TYPES.SAW_BLADES,
    levels: fillLevels([
      {
        "damage": 5,
        "range": 50,
        "rotationSpeed": PI / 2,
        damageRate: 0.1,
        "blades": 1,
        "size": 10,
      },
      { blades: 2 },
      { damage: 10, rotationSpeed: PI / 1.5 },
      { rotationSpeed: PI / 1.25, size: 15 },
      { blades: 3 },
      { damage: 15 },
      { blades: 4 },
    ]),
  };

  /**
   * @typedef MeleeWeaponLevel
   * @property {number} damage
   * @property {number} angle
   * @property {number} range
   * @property {number} attackRate
   */

  /**
   * @typedef MeleeWeapon
   * @property {string} name
   * @property {typeof WEAPON_TYPES.MELEE} type
   * @property {MeleeWeaponLevel[]} levels
   */

  /** @type {MeleeWeapon} */
  const sword = {
    name: "Sword",
    type: WEAPON_TYPES.MELEE,
    levels: fillLevels([
      { "damage": 8, "angle": PI / 4, "range": 80, attackRate: 0.5 },
      { damage: 13 },
      { angle: (PI / 4) * 1.2, range: 90 },
      { damage: 18 },
      { damage: 23 },
      { damage: 28, angle: (PI / 4) * 1.5 },
      { damage: 33, angle: (PI / 4) * 1.7, range: 120 },
    ]),
  };

  /**
   * @typedef AreaWeaponLevel
   * @property {number} damage
   * @property {number} range
   * @property {number} attackRate
   */

  /**
   * @typedef AreaWeapon
   * @property {string} name
   * @property {typeof WEAPON_TYPES.AREA} type
   * @property {AreaWeaponLevel[]} levels
   */

  /** @type {AreaWeapon} */
  const barbedWire = {
    name: "Barbed Wire",
    type: WEAPON_TYPES.AREA,
    levels: fillLevels([
      { "range": 40, "damage": 2, attackRate: 0.75 },
      { range: 60 },
      { damage: 3 },
      { range: 70 },
      { range: 80 },
      { damage: 4 },
    ]),
  };

  /**
   * @typedef {SawBladesWeapon | MeleeWeapon | AreaWeapon} WeaponType
   */

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

  /**
   * @param {number} increasePerLevel
   * @returns {AttributeEnhancer}
   */
  const baseIncreaseWithLevel = (increasePerLevel) => () =>
    player.level * increasePerLevel;

  /**
   * @param {number} value
   * @returns {AttributeEnhancer}
   */
  const baseValue = (value) => value;

  /**
   * @typedef PlayerType
   * @property {WeaponType[]} weapons
   * @property {Record<keyof Player['attrs'], AttributeEnhancer[]>} attrs
   */

  /** @param {PlayerType} t */
  const playerType = (t) => t;

  const warrior = playerType({
    weapons: [sword],

    attrs: {
      "health": [baseValue(100), baseIncreaseWithLevel(10)],
      "speed": [baseValue(45), baseIncreaseWithLevel(0.2)],
      "healthRegen": [baseValue(0.1), baseIncreaseWithLevel(0.025)],
      "pickupDistance": [baseValue(50)],
      "damage": [baseIncreaseWithLevel(0.3)],
      "attackSpeed": [baseValue(1)],
      "healthDrop": [baseValue(0.01)],
    },
  });

  /** @typedef {(player: Player) => void} UpgradeApply */
  /** @typedef {(player: Player) => boolean} UpgradeCondition */

  /**
   * @typedef Upgrade
   * @property {string} name
   * @property {string | (() => string)} description
   * @property {UpgradeApply} apply
   * @property {number} maxCount
   * @property {UpgradeCondition} [condition]
   */

  /**
   * @param {keyof Player['attrs']} attr
   * @param {number} change
   * @returns {UpgradeApply}
   */
  const baseAttr = (attr, change) => (player) =>
    player.attrs[attr].base.push(change);

  /**
   * @param {keyof Player['attrs']} attr
   * @param {number} change
   * @returns {UpgradeApply}
   */
  const multiplyAttr = (attr, change) => (player) =>
    player.attrs[attr].base.push(change);

  /**
   * @param {WeaponType} weapon
   * @param {string} name
   * @returns {Upgrade}
   */
  const weaponUpgrade = (weapon, name) => {
    /** @type {undefined | { level: number; existing: Weapon; desc: string; }} */
    let cache;

    return {
      name,
      description: () => {
        const existing =
          cache?.existing ?? player.weapons.find((w) => w.type === weapon);

        if (!existing) {
          return "New weapon";
        }

        if (cache?.level === existing.level) {
          return cache.desc;
        }

        const currentLevel = existing.type.levels[existing.level];
        const nextLevel = existing.type.levels[existing.level + 1];
        const result = [];

        for (const key in nextLevel) {
          if (nextLevel[key] !== currentLevel[key]) {
            const diff = nextLevel[key] - currentLevel[key];
            const str =
              key === "angle" ? `${formatAngle(diff)}°` : formatNumber(diff);

            result.push(`+${str} ${key}`);
          }
        }

        const desc = result.join(", ");

        cache = {
          level: existing.level,
          existing,
          desc,
        };

        return desc;
      },
      apply: (player) => {
        const existing = player.weapons.find((w) => w.type === weapon);
        if (existing) {
          existing.level++;
        } else {
          player.weapons.push(initializeWeapon(weapon));
        }
      },
      maxCount: weapon.levels.length,
    };
  };

  /** @type {Upgrade[]} */
  const upgrades = [
    {
      name: "Speed boost",
      description: "+25% speed",
      apply: multiplyAttr("speed", 1.25),
      maxCount: 5,
    },
    {
      name: "Speed base",
      description: "+1 base speed",
      apply: baseAttr("speed", 1),
      maxCount: 5,
    },
    {
      name: "Heal",
      description: "+25 health",
      condition: (player) => player.health + 25 < player.attrs.health.value,
      apply: (player) => (player.health += 25),
      maxCount: 5,
    },
    {
      name: "Max health",
      description: "+25 max health, +5 health",
      apply: (player) => {
        player.attrs.health.base.push(25);
        player.health += 5;
      },
      maxCount: 5,
    },
    {
      name: "Health drop",
      description: "+1% health drop chance",
      apply: baseAttr("healthDrop", 0.01),
      maxCount: 5,
    },
    {
      name: "Regen",
      description: "+0.1/s health regen",
      apply: baseAttr("healthRegen", 0.1),
      maxCount: 5,
    },
    {
      name: "Regen boost",
      description: "+10% health regen",
      apply: multiplyAttr("healthRegen", 1.1),
      maxCount: 5,
    },
    {
      name: "Pickup range",
      description: "+10 pickup range",
      apply: baseAttr("pickupDistance", 10),
      maxCount: 5,
    },
    {
      name: "Damage",
      description: "+1 damage",
      apply: baseAttr("damage", 1),
      maxCount: 5,
    },
    {
      name: "Attack speed",
      description: "+5% attack speed",
      apply: baseAttr("attackSpeed", -0.05),
      maxCount: 5,
    },
    weaponUpgrade(sawBlades, "Saw Blades"),
    weaponUpgrade(sword, "Sword"),
    weaponUpgrade(barbedWire, "Barbed Wire"),
  ];

  /** @typedef {number | (() => number)} AttributeEnhancer */
  /** @typedef {{ base: AttributeEnhancer[]; multiplier: AttributeEnhancer[]; playerLevel: number; value: number; }} AttributeCache */

  /**
   * @param {number | (() => number)} v
   * @returns {number}
   */
  const fnOrV = (v) => (typeof v === "function" ? v() : v);

  /**
   * @param {AttributeEnhancer[]} [base]
   * @param {AttributeEnhancer[]} [multiplier]
   */
  const createAttribute = (base = [], multiplier = []) => ({
    // Base attribute value modifiers
    /** @type {AttributeEnhancer[]} */
    "base": [...base],

    // Multiplier attribute value modifiers
    /** @type {AttributeEnhancer[]} */
    "multiplier": [...multiplier],

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

      /**
       * @param {number} acc
       * @param {AttributeEnhancer} v
       * @returns {number}
       */
      const sum = (acc, v) => acc + fnOrV(v);

      const value = this.base.reduce(sum, 0) * this.multiplier.reduce(sum, 1);

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
   * @typedef Player
   * @property {PlayerType} type
   * @property {number} x
   * @property {number} y
   * @property {number} level
   * @property {number} experience
   * @property {number} nextLevelExperience
   * @property {number} health
   * @property {number} meleeTick
   * @property {number} lastDamagedTick
   * @property {number} lastPickupTick
   * @property {number} meleeDirection
   * @property {Object} attrs
   * @property {PlayerAttribute} attrs.speed
   * @property {PlayerAttribute} attrs.health
   * @property {PlayerAttribute} attrs.healthRegen
   * @property {PlayerAttribute} attrs.pickupDistance
   * @property {PlayerAttribute} attrs.damage
   * @property {PlayerAttribute} attrs.attackSpeed
   * @property {PlayerAttribute} attrs.healthDrop
   * @property {Upgrade[]} upgrades
   * @property {Weapon[]} weapons
   */

  /**
   * @param {PlayerType} type
   * @returns {Player}
   */
  const createPlayer = (type) => ({
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
      "speed": createAttribute(type.attrs.speed),
      "health": createAttribute(type.attrs.health),
      "healthRegen": createAttribute(type.attrs.healthRegen),
      "pickupDistance": createAttribute(type.attrs.pickupDistance),
      "damage": createAttribute(type.attrs.damage),
      "attackSpeed": createAttribute(type.attrs.attackSpeed),
      "healthDrop": createAttribute(type.attrs.healthDrop),
    },

    // Already applied upgrades
    upgrades: [],

    // Weapons
    weapons: type.weapons.map((w) => initializeWeapon(w)),
  });

  const player = createPlayer(warrior);

  const MANAGER_STATES = {
    RUNNING: 0,
    DEAD: 1,
    PICKING_UPGRADE: 2,
    PAUSED: 3,
    WIN: 4,
    START: 5,
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
    state: MANAGER_STATES.START,
    ...startingManagerState,
  };

  /**
   * @template T
   * @template {keyof T} K
   * @typedef {Partial<Pick<T, K>> & Omit<T, K>} WithOptional<T, K>
   */

  /** @typedef {{ health: number; speed: number; damage: number; damageTick: number; experience: number; boss?: boolean; pushBackResistance?: number; size: number; render: (x: number, y: number, hit: string | undefined) => void}} EnemyType */
  /**
   * @param {WithOptional<EnemyType, 'damageTick' |'size'>} type
   * @returns {EnemyType}
   */
  const defineEnemy = (type) => ({ ...type, damageTick: 1, size: 10 });

  /**
   * @param {string[]} colors
   * @param {number} size
   * @returns {(x: number, y: number, hit: string | undefined) => void}
   */
  const boxSprite = (colors, size) => (x, y, hit) =>
    colors.map((color, i) => draw.box(x + i, y + i, size, hit ?? color));

  /**
   * @param {string[]} colors
   * @param {number} size
   * @returns {(x: number, y: number, hit: string | undefined) => void}
   */
  const triangleSprite = (colors, size) => (x, y, hit) =>
    colors.map((color, i) => draw.triangle(x + i, y + i, size, hit ?? color));

  /**
   * @param {string[]} colors
   * @param {number} size
   * @returns {(x: number, y: number, hit: string | undefined) => void}
   */
  const circleSprite = (colors, size) => (x, y, hit) =>
    colors.map((color, i) => draw.circle(x + i, y + i, size, hit ?? color));

  const boxLevel1 = defineEnemy({
    health: 10,
    speed: 26,
    damage: 1,
    experience: 1,
    render: boxSprite(["#aaa"], 10),
  });

  const boxLevel2 = defineEnemy({
    health: 50,
    speed: 26,
    damage: 1,
    experience: 2,
    render: boxSprite(["#aaa", "#faa"], 10),
  });

  const boxLevel3 = defineEnemy({
    health: 100,
    speed: 30,
    damage: 2,
    experience: 3,
    render: boxSprite(["#aaa", "#faa", "#4a4"], 10),
  });

  const boxBoss = defineEnemy({
    health: 500,
    speed: 30,
    damage: 10,
    experience: 20,
    size: 20,
    render: boxSprite(["#faa"], 20),
    boss: true,
  });

  const triangleLevel1 = defineEnemy({
    health: 20,
    speed: 35,
    damage: 2,
    experience: 2,
    render: triangleSprite(["#999"], 10),
  });

  const triangleLevel2 = defineEnemy({
    health: 40,
    speed: 35,
    damage: 2,
    experience: 3,
    render: triangleSprite(["#999", "#0ac"], 10),
  });

  const triangleLevel3 = defineEnemy({
    health: 60,
    speed: 35,
    damage: 3,
    experience: 4,
    render: triangleSprite(["#999", "#0ac", "#966"], 10),
  });

  const triangleBoss = defineEnemy({
    health: 1000,
    speed: 35,
    damage: 10,
    experience: 50,
    boss: true,
    pushBackResistance: 80,
    size: 20,
    render: triangleSprite(["#faa"], 20),
  });

  const circleLevel1 = defineEnemy({
    health: 10,
    speed: 40,
    damage: 1,
    experience: 3,
    render: circleSprite(["#999"], 5),
  });

  const circleLevel2 = defineEnemy({
    health: 20,
    speed: 40,
    damage: 1,
    experience: 4,
    render: circleSprite(["#999", "#0ac"], 5),
  });

  const circleLevel3 = defineEnemy({
    health: 50,
    speed: 40,
    damage: 1,
    experience: 5,
    render: circleSprite(["#999", "#0ac", "#4ca"], 5),
  });

  const circleBoss = defineEnemy({
    health: 1000,
    speed: 40,
    damage: 5,
    experience: 4,
    boss: true,
    pushBackResistance: 80,
    size: 16,
    render: circleSprite(["#faa"], 8),
  });

  const finalBoss = defineEnemy({
    health: 10000,
    speed: 55,
    damage: 5,
    experience: 0,
    boss: true,
    pushBackResistance: 1000,
    size: 50,
    render(x, y, hit) {
      draw.circle(x, y, 25, hit ?? "#faa");
      draw.box(x, y, 25, hit ?? "#0ac");
      draw.triangle(x, y, 23, hit ?? "#faa");
    },
  });

  /**
   * @param {number} from
   * @param {number} to
   * @param {number} step
   */
  const range = (from, to, step = 1) =>
    Array.from({ length: floor((to - from) / step) }).map(
      (_, i) => i * step + from,
    );

  /** @param {EnemyType} enemy */
  const rectangleWave = (enemy) => () => {
    const xRange = range(player.x - w2, player.x + w2, enemy.size * 2);
    const yRange = range(player.y - h2, player.y + h2, enemy.size * 2);

    xRange.map((x) => pushEnemy(x, player.y - h2, enemy));
    xRange.map((x) => pushEnemy(x, player.y + h2, enemy));
    yRange.map((y) => pushEnemy(player.x - w2, y, enemy));
    yRange.map((y) => pushEnemy(player.x + w2, y, enemy));
  };

  /** @param {EnemyType} enemy */
  const circleWave = (enemy) => () => {
    const angleStep = PI2 / 40;
    range(0, PI2, angleStep).map((i) => {
      const x = player.x + cos(i) * w2;
      const y = player.y + sin(i) * h2;
      pushEnemy(x, y, enemy);
    });
  };

  /**
   * @typedef SpawnRate
   * @property {number} from
   * @property {EnemyType[]} types
   * @property {number} rate
   * @property {EnemyType} [boss]
   * @property {() => void} [wave]
   */

  /** @type {SpawnRate[]} */
  const spawnRates = [
    { from: 0, types: [boxLevel1], rate: 0.4 },
    { from: 30, types: [boxLevel1, triangleLevel1], rate: 0.5 },
    { from: 80, types: [boxLevel1, triangleLevel1], rate: 0.4 },
    { from: 120, types: [triangleLevel1], rate: 0.3, boss: boxBoss },
    { from: 150, types: [triangleLevel1, circleLevel1], rate: 0.4 },
    { from: 200, types: [triangleLevel1, circleLevel1], rate: 0.3 },
    {
      from: 250,
      types: [boxLevel2],
      rate: 0.3,
      wave: rectangleWave(boxLevel2),
    },
    { from: 300, types: [boxLevel2, triangleLevel2, circleLevel1], rate: 0.3 },
    {
      from: 330,
      types: [triangleLevel2, circleLevel1],
      boss: triangleBoss,
      rate: 0.3,
    },
    {
      from: 380,
      types: [triangleLevel2, circleLevel2, boxLevel2],
      rate: 0.3,
    },
    {
      from: 450,
      types: [circleLevel2, boxLevel3],
      rate: 0.4,
      wave: circleWave(circleLevel2),
    },
    {
      from: 500,
      types: [boxLevel3, triangleLevel3],
      rate: 0.3,
    },
    {
      from: 550,
      types: [boxLevel3, triangleLevel3],
      rate: 0.25,
    },
    {
      from: 600,
      types: [boxLevel3, triangleLevel3, circleLevel3],
      rate: 0.25,
    },
    {
      from: 650,
      types: [boxLevel3, triangleLevel3],
      boss: circleBoss,
      rate: 0.4,
    },
    {
      from: 700,
      types: [boxLevel3, triangleLevel3, circleLevel3],
      rate: 0.25,
      wave: rectangleWave(triangleLevel3),
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

  /**
   * @param {number} x
   * @param {number} y
   * @param {EnemyType} type
   */
  const pushEnemy = (x, y, type) => enemies.push(initializeEnemy(x, y, type));

  /** @typedef {ReturnType<typeof initializeEnemy>} Enemy */
  /** @type {Enemy[]} */
  const enemies = [];

  /** @type {Array<{ x: number; y: number; health?: number; experience?: number; }>} */
  const pickups = [];

  function renderBackground() {
    const startX = floor((player.x - w2) / 50) * 50;
    const startY = floor((player.y - h2) / 50) * 50;
    const endX = ceil((player.x + w2) / 50) * 50;
    const endY = ceil((player.y + h2) / 50) * 50;

    for (let x = startX; x < endX; x += 50) {
      for (let y = startY; y < endY; y += 50) {
        draw.rect(
          x,
          y,
          50,
          50,
          x % 100 === 0
            ? y % 100 === 0
              ? "#000"
              : "#111"
            : y % 100 === 0
              ? "#111"
              : "#000",
        );
      }
    }
  }

  function renderPlayer() {
    for (const weapon of player.weapons) {
      switch (weapon.type.type) {
        case WEAPON_TYPES.SAW_BLADES: {
          const data = weapon.type;
          const attrs = data.levels[weapon.level];

          const anglePerBlade = PI2 / attrs.blades;
          const baseAngle = weapon.tick * attrs.rotationSpeed;

          for (let i = 0; i < attrs.blades; i++) {
            const angle = baseAngle + anglePerBlade * i;
            const bladeX = player.x + cos(angle) * attrs.range;
            const bladeY = player.y + sin(angle) * attrs.range;

            draw.circle(bladeX, bladeY, attrs.size / 2, "#fff");
          }

          break;
        }

        case WEAPON_TYPES.MELEE: {
          const attrs = weapon.type.levels[weapon.level];
          const rate = attrs.attackRate * player.attrs.attackSpeed.value;
          const delta = weapon.damageTick / rate;
          const alpha = delta * 0.2;

          if (alpha > 0) {
            const coneA2 = attrs.angle / 2;

            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(
              player.x + cos(player.meleeDirection - coneA2) * attrs.range,
              player.y + sin(player.meleeDirection - coneA2) * attrs.range,
            );

            ctx.arc(
              player.x,
              player.y,
              attrs.range,
              player.meleeDirection - coneA2,
              player.meleeDirection + coneA2,
            );

            ctx.lineTo(player.x, player.y);
            ctx.fill();
          }

          break;
        }

        case WEAPON_TYPES.AREA: {
          const attrs = weapon.type.levels[weapon.level];
          const rate = attrs.attackRate * player.attrs.attackSpeed.value;
          const delta = weapon.damageTick / rate;
          const alpha = 0.15 + cos(delta * 2 * PI) * 0.02;

          draw.circle(
            player.x,
            player.y,
            attrs.range,
            `rgba(255,0,0,${alpha})`,
          );

          break;
        }
      }
    }

    draw.rect(player.x - 5, player.y - 5, 10, 10, "#fff");
  }

  function renderEnemies() {
    for (const enemy of enemies) {
      const type = enemy.type;
      type.render(enemy.x, enemy.y, enemy.hitTick > 0 ? "#fff" : undefined);

      if (type.boss) {
        draw.rect(enemy.x - 20, enemy.y + 15, 40, 3, "#333");
        draw.rect(
          enemy.x - 20,
          enemy.y + 15,
          (enemy.health / type.health) * 40,
          3,
          "#f33",
        );
      }
    }
  }

  function renderPickups() {
    for (const pickup of pickups) {
      draw.box(
        pickup.x - 3,
        pickup.y - 3,
        (pickup.experience ?? 0) >= 10 ? 8 : 6,
        (pickup.health ?? 0) > 0
          ? "#0c0"
          : (pickup.experience ?? 0) < 10
            ? "#05f"
            : "#ff0",
      );
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   */
  function renderPlayerStatsUi(x, y, w) {
    const stats = [
      ["Base damage", formatNumber(player.attrs.damage.value)],
      ["Attack speed", formatNumber(player.attrs.attackSpeed.value, 2)],
      ["Health", floor(player.attrs.health.value)],
      ["Regeneration", formatNumber(player.attrs.healthRegen.value, 2) + "/s"],
      ["Speed", formatNumber(player.attrs.speed.value, 2)],
      ["Health Drop", formatNumber(player.attrs.healthDrop.value * 100) + "%"],
    ];

    for (const weapon of player.weapons) {
      const name = weapon.type.name;

      switch (weapon.type.type) {
        case WEAPON_TYPES.MELEE: {
          const attrs = weapon.type.levels[weapon.level];

          stats.push([`${name} level`, weapon.level + 1]);
          stats.push([`${name} damage`, formatNumber(attrs.damage)]);
          stats.push([`${name} range`, formatNumber(attrs.range)]);
          stats.push([`${name} angle`, `${formatAngle(attrs.angle)}°`]);
          break;
        }

        case WEAPON_TYPES.SAW_BLADES: {
          const attrs = weapon.type.levels[weapon.level];

          stats.push([`${name} level`, weapon.level + 1]);
          stats.push([`${name} damage`, formatNumber(attrs.damage)]);
          stats.push([`${name} range`, formatNumber(attrs.range)]);
          stats.push([`${name} blades`, formatNumber(attrs.blades)]);
          stats.push([`${name} size`, formatNumber(attrs.size)]);
          break;
        }

        case WEAPON_TYPES.AREA: {
          const attrs = weapon.type.levels[weapon.level];

          stats.push([`${name} level`, weapon.level + 1]);
          stats.push([`${name} damage`, formatNumber(attrs.damage)]);
          stats.push([`${name} range`, formatNumber(attrs.range)]);
          break;
        }
      }
    }

    renderStatsTable(x, y, w, height - y - 20, stats);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   */
  function renderSurvivalStatsUi(x, y, w) {
    const stats = [
      [`Survived`, formatTime(manager.runtime)],
      [`Level`, `${player.level + 1}`],
      [`Damage`, formatNumber(manager.damageDone)],
      [`DPS`, `${formatNumber(manager.damageDone / manager.runtime, 2)}`],
      [`Kills`, `${manager.kills}`],
    ];

    for (const stat of stats) {
      draw.text(x + w / 2 - 5, y, stat[0], "#ccc", "right");
      draw.text(x + w / 2 + 5, y, stat[1], "#fff", "left");
      y += 15;
    }

    return y;
  }

  function renderIngameUI() {
    draw.rect(50, 0, width - 50, 20, "#600");
    draw.rect(
      50,
      0,
      (player.health / player.attrs.health.value) * (width - 50),
      20,
      "#f66",
    );

    draw.text(
      50 + 2,
      10,
      `${floor(player.health)} / ${floor(player.attrs.health.value)}`,
      "#fff",
      "left",
      "middle",
    );

    draw.rect(50, 20, width - 50, 12, "#999");
    draw.rect(
      50,
      20,
      (player.experience / player.nextLevelExperience) * (width - 50),
      12,
      "#fff",
    );

    draw.text(
      50 + 2,
      27,
      `${player.experience} / ${player.nextLevelExperience}`,
      "#000",
      "left",
      "middle",
    );

    draw.rect(0, 0, 50, 32, "#000");
    draw.text(25, 2, "level", "#666", "center", "top");
    draw.text(25, 18, `${player.level + 1}`, "#fff", "center", "top");

    draw.text(w2, 35, formatTime(manager.runtime), "#fff", "center");

    if (manager.runtime < 20) {
      let y = height - 30 - help.length * 15;
      for (const text of help) {
        draw.text(10, y, text, "#fff", "left", "top");
        y += 15;
      }
    }
  }

  function renderUI() {
    if (manager.state !== MANAGER_STATES.START) {
      renderIngameUI();
    }

    switch (manager.state) {
      case MANAGER_STATES.DEAD: {
        let y = 100;

        draw.overlay();
        draw.text(w2, y, "YOU'RE DEAD!", "#f88", "center", "top", 24);

        y += 45;
        y = renderSurvivalStatsUi(50, y, width - 100);
        y += 30;

        draw.text(w2, y, pressEnterToRestart, "#fff", "center");
        break;
      }

      case MANAGER_STATES.PICKING_UPGRADE: {
        draw.overlay();
        draw.text(w2, 10, "LEVEL UP", "#fff", "center", "top");

        for (let i = 0; i < manager.upgrades.length; i++) {
          const upgrade = manager.upgrades[i];
          // TODO: Cache this somehow?
          const alreadyApplied = player.upgrades.filter(
            (u) => u === upgrade,
          ).length;

          const x = 20;
          const y = 50 + i * 50;

          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillStyle = i === manager.selectedUpgradeIndex ? "#333" : "#222";
          ctx.fillRect(x, y, width - 40, 40);

          ctx.strokeStyle =
            i === manager.selectedUpgradeIndex ? "#aa3" : "#444";
          ctx.strokeRect(x, y, width - 40, 40);

          ctx.fillStyle = "#fff";
          ctx.fillText(upgrade.name, x + 5, y + 5);

          ctx.fillStyle = "#ccc";
          ctx.fillText(
            typeof upgrade.description === "function"
              ? upgrade.description()
              : upgrade.description,
            x + 5,
            y + 22,
          );

          draw.text(
            x + width - 50,
            y + 20,
            `${alreadyApplied}/${upgrade.maxCount}`,
            "#ccc",
            "right",
            "middle",
          );
        }

        renderPlayerStatsUi(20, 50 + 3 * 50 + 10, width - 40);
        break;
      }

      case MANAGER_STATES.PAUSED: {
        draw.overlay();
        draw.text(w2, 100, "PAUSED", "#fff", "center", "middle");
        renderPlayerStatsUi(20, 110, width - 40);
        break;
      }

      case MANAGER_STATES.WIN: {
        draw.overlay();
        draw.text(w2, 100, "YOU WON", "#fff", "center", "middle");

        let y = 130;
        y = renderSurvivalStatsUi(100, y, width - 200);
        y += 30;

        draw.text(w2, y, pressEnterToRestart, "#fff", "center");
        break;
      }

      case MANAGER_STATES.START: {
        draw.overlay();
        draw.text(w2, h2 - 40, "MICRO", "#fff", "center", "bottom", 68);
        draw.text(w2, h2 - 40, "SURVIVORS", "#fff", "center", "top", 38);
        draw.text(w2, height - 5, "by Kamen", "#ccc", "center", "bottom", 10);

        ctx.globalAlpha =
          0.5 + (cos((performance.now() / 1000) * 5) * 0.5 + 0.5) * 0.5;

        draw.text(w2, h2 + 50, pressEnterToStart, "#fff", "center");

        ctx.globalAlpha = 1;

        break;
      }
    }
  }

  function renderOverlays() {
    const d = min(1, player.lastDamagedTick / 0.5);

    if (d > 0) {
      const damageOverlayGradient = screenGradient(
        80,
        "#ff000000",
        `rgba(255,0,0,${d})`,
      );

      draw.overlay(damageOverlayGradient);
    }

    const p = min(1, player.lastPickupTick / 0.1);
    if (p > 0) {
      const pickupOverlayGradient = screenGradient(
        130,
        "#ffffff00",
        `rgba(255,255,255,${p * 0.15})`,
      );

      draw.overlay(pickupOverlayGradient);
    }
  }

  function render() {
    ctx.reset();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(-player.x + w2, -player.y + h2);

    renderBackground();
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
    managerTick(deltaTime);

    switch (manager.state) {
      case MANAGER_STATES.RUNNING:
        enemiesTick(deltaTime);
        pickupsTick(deltaTime);
        playerTick(deltaTime);
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
          experience: type.experience,
        });

        if (random() < player.attrs.healthDrop.value) {
          pickups.push({
            x: enemy.x - 5 + random() * 10,
            y: enemy.y - 5 + random() * 10,
            health: 10,
          });
        }

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
      const distance = hypot(dx, dy);

      // Remove enemies that are too far from player
      if (!enemy.boss && distance > width * 3) {
        enemiesToRemove.push(index);
        index++;
        continue;
      }

      // When ready to attack
      if (enemy.damageTick <= 0) {
        // Damage player when close
        if (distance < enemy.type.size - 2) {
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
      if (abs(enemy.pushBackX) > 0.1) {
        const diff =
          (enemy.pushBackX > 0 ? -1 : 1) *
          deltaTime *
          (type.pushBackResistance ?? 20);

        if (abs(diff) > abs(enemy.pushBackX)) {
          enemy.pushBackX = 0;
        } else {
          enemy.pushBackX += diff;
        }
      } else {
        enemy.pushBackX = 0;
      }

      if (abs(enemy.pushBackY) > 0.1) {
        const diff =
          (enemy.pushBackY > 0 ? -1 : 1) *
          deltaTime *
          (type.pushBackResistance ?? 20);

        if (abs(diff) > abs(enemy.pushBackY)) {
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
    const angle = random() * PI2;
    const side = Math.max(width, height) / 2;
    const minDistance = hypot(side, side);
    const distance = minDistance + random() * 15;

    enemies.push(
      initializeEnemy(
        player.x + cos(angle) * distance,
        player.y + sin(angle) * distance,
        type,
      ),
    );
  }

  function startNewGame() {
    Object.assign(player, createPlayer(warrior));
    Object.assign(manager, startingManagerState);

    manager.state = MANAGER_STATES.RUNNING;
    enemies.length = 0;
    pickups.length = 0;
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
        }

        if (player.health <= 0) {
          manager.state = MANAGER_STATES.DEAD;
        }

        const spawnRateIndex =
          spawnRates.findIndex((rate) => rate.from > manager.runtime) - 1;
        const spawnRate =
          spawnRates[
            spawnRateIndex < 0 ? spawnRates.length - 1 : spawnRateIndex
          ];

        if (spawnRateIndex === -2 && enemies.length === 0) {
          manager.state = MANAGER_STATES.WIN;
        }

        if (spawnRate) {
          if (spawnRateIndex !== manager.lastSpawnRate) {
            manager.lastSpawnRate = spawnRateIndex;

            if (spawnRate.boss) {
              spawnEnemy(spawnRate.boss);
            }

            spawnRate.wave?.();
          }

          if (manager.spawnTimeout > spawnRate.rate) {
            if (spawnRate.types.length > 0) {
              spawnEnemy(pickRandom(spawnRate.types));
            }
            manager.spawnTimeout = 0;
          } else {
            manager.spawnTimeout += deltaTime;
          }
        }

        break;
      }

      case MANAGER_STATES.WIN:
      case MANAGER_STATES.DEAD:
      case MANAGER_STATES.START:
        if (input.enter) {
          startNewGame();
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

    input.up && (moveY -= 1);
    input.down && (moveY += 1);
    input.left && (moveX -= 1);
    input.right && (moveX += 1);

    const speed = player.attrs.speed.value * deltaTime;
    const moveD = hypot(moveX, moveY);

    if (moveD > 0) {
      player.x += (moveX / moveD) * speed;
      player.y += (moveY / moveD) * speed;
    }

    const playerAbsoluteX = w2;
    const playerAbsoluteY = h2;

    player.meleeDirection = atan2(
      input.targetY - playerAbsoluteY,
      input.targetX - playerAbsoluteX,
    );

    if (player.experience >= player.nextLevelExperience) {
      player.level += 1;
      player.experience -= player.nextLevelExperience;
      player.nextLevelExperience += 10;

      const availableUpgrades = upgrades.filter((upgrade) => {
        if (upgrade.condition && !upgrade.condition(player)) {
          return false;
        }

        if (
          upgrade.maxCount &&
          player.upgrades.filter((u) => u === upgrade).length >=
            upgrade.maxCount
        ) {
          return false;
        }

        return true;
      });

      // TODO: Weights
      manager.upgrades = shuffleArray(availableUpgrades).slice(0, 3);

      if (manager.upgrades.length > 0) {
        manager.state = MANAGER_STATES.PICKING_UPGRADE;
      }

      player.health += 5;
    }

    if (player.lastDamagedTick > 0) {
      player.lastDamagedTick -= deltaTime;
    }

    if (player.lastPickupTick > 0) {
      player.lastPickupTick -= deltaTime;
    }

    player.health = min(
      player.attrs.health.value,
      player.health + player.attrs.healthRegen.value * deltaTime,
    );

    for (const weapon of player.weapons) {
      weapon.tick += deltaTime;

      switch (weapon.type.type) {
        case WEAPON_TYPES.SAW_BLADES: {
          const data = weapon.type;
          const attrs = data.levels[weapon.level];
          const damage = attrs.damage + player.attrs.damage.value;

          if (weapon.damageTick <= 0) {
            weapon.damageTick =
              attrs.damageRate * player.attrs.attackSpeed.value;

            const anglePerBlade = PI2 / attrs.blades;
            const baseAngle = weapon.tick * attrs.rotationSpeed;

            for (let i = 0; i < attrs.blades; i++) {
              const angle = baseAngle + anglePerBlade * i;
              const bladeX = player.x + cos(angle) * attrs.range;
              const bladeY = player.y + sin(angle) * attrs.range;

              for (const enemy of enemies) {
                const dis = distance(enemy.x, enemy.y, bladeX, bladeY);

                if (dis < attrs.size / 2 + enemy.type.size + 2) {
                  enemy.health -= damage;
                  enemy.hitTick = 0.1;
                  enemy.pushBackX = cos(angle) * 20;
                  enemy.pushBackY = sin(angle) * 20;

                  manager.damageDone += damage;
                }
              }
            }
          } else {
            weapon.damageTick -= deltaTime;
          }

          break;
        }

        case WEAPON_TYPES.MELEE: {
          if (weapon.damageTick > 0) {
            weapon.damageTick -= deltaTime;
          } else {
            applyPlayerMeleeAttack(weapon, weapon.type);

            weapon.damageTick =
              weapon.type.levels[weapon.level].attackRate *
              player.attrs.attackSpeed.value;
          }
          break;
        }

        case WEAPON_TYPES.AREA: {
          if (weapon.damageTick > 0) {
            weapon.damageTick -= deltaTime;
          } else {
            const attrs = weapon.type.levels[weapon.level];
            const damage = attrs.damage + player.attrs.damage.value;

            for (const enemy of enemies) {
              const dx = enemy.x - player.x;
              const dy = enemy.y - player.y;
              const distance = hypot(dx, dy);

              if (distance < attrs.range) {
                enemy.health -= damage;
                enemy.hitTick = 0.1;

                // TODO: Should this have push-back?
                // enemy.pushBackX = cos(angle) * 20;
                // enemy.pushBackY = sin(angle) * 20;

                manager.damageDone += damage;
              }
            }

            weapon.damageTick =
              weapon.type.levels[weapon.level].attackRate *
              player.attrs.attackSpeed.value;
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
      const dis = hypot(dx, dy);

      if (dis < 10) {
        player.health = min(
          player.attrs.health.value,
          player.health + (pickup.health ?? 0),
        );

        player.experience += pickup.experience ?? 0;
        player.lastPickupTick = 0.1;

        pickupsToRemove.push(index);
      } else if (dis < player.attrs.pickupDistance.value) {
        const speed =
          (player.attrs.pickupDistance.value + 10 - dis) * deltaTime * 2;
        pickup.x += (dx / dis) * speed;
        pickup.y += (dy / dis) * speed;
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
   * @param {Weapon} weapon
   * @param {MeleeWeapon} type
   */
  function applyPlayerMeleeAttack(weapon, type) {
    const attrs = type.levels[weapon.level];
    const damage = attrs.damage + player.attrs.damage.value;

    const coneA2 = attrs.angle / 2;
    const coneStart = player.meleeDirection - coneA2;
    const coneEnd = player.meleeDirection + coneA2;

    for (const enemy of enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const angle = atan2(dy, dx);
      const distance = hypot(dx, dy);
      const offset = atan2(enemy.type.size / 2, distance);

      if (angle + offset > coneStart && angle - offset < coneEnd) {
        if (distance - enemy.type.size / 2 < attrs.range) {
          enemy.health -= damage;
          enemy.hitTick = 0.1;
          enemy.pushBackX = cos(angle) * 25;
          enemy.pushBackY = sin(angle) * 25;

          manager.damageDone += damage;
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

  target.appendChild(canvas);
  requestAnimationFrame(animationFrameTick);

  return [player, manager];
}
