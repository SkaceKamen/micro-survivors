// @ts-check
"use strict";

function microSurvivors(target = document.body) {
  /*
  TODO:
   - add pickup weapons:
    - shuriken - ranged attack in random direction
    - lightning - chain lightning attack?
   - add armor and relevant upgrades?
   - more enemies?
    - enemy with ranged attack?
    - enemy with unusual movement pattern?
   - map events?
    - enemy spawn in a shape around player?
   - starting screen?
   - better enemy graphics for 2+ levels
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

  const raise = () => {
    throw new Error();
  };

  /**
   * Format angle
   *
   * @param {number} a angle in radians
   */
  const fA = (a) => (a * (180 / Math.PI)).toFixed(0);

  /**
   * Format number with fixed decimal places
   *
   * @param {number} n
   * @param {number} [d=0]
   */
  const f = (n, d = 0) => n.toFixed(d);

  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

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

    const ctx = canvas.getContext("2d") ?? raise();

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
    /** @type {1} */
    MELEE: 1,
    /** @type {2} */
    AREA: 2,
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
    levels: [
      {
        damage: 5,
        range: 50,
        rotationSpeed: Math.PI / 2,
        damageRate: 0.1,
        blades: 1,
        size: 10,
      },
      {
        damage: 5,
        range: 50,
        rotationSpeed: Math.PI / 2,
        damageRate: 0.1,
        blades: 2,
        size: 10,
      },
      {
        damage: 10,
        range: 50,
        rotationSpeed: Math.PI / 1.5,
        damageRate: 0.1,
        blades: 2,
        size: 10,
      },
      {
        damage: 10,
        range: 50,
        rotationSpeed: Math.PI / 1.25,
        damageRate: 0.1,
        blades: 2,
        size: 15,
      },
      {
        damage: 10,
        range: 50,
        rotationSpeed: Math.PI / 1.25,
        damageRate: 0.1,
        blades: 3,
        size: 15,
      },
      {
        damage: 15,
        range: 50,
        rotationSpeed: Math.PI / 1.25,
        damageRate: 0.1,
        blades: 3,
        size: 15,
      },
      {
        damage: 15,
        range: 50,
        rotationSpeed: Math.PI / 1.25,
        damageRate: 0.1,
        blades: 4,
        size: 15,
      },
    ],
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
    levels: [
      { damage: 8, angle: Math.PI / 4, range: 80, attackRate: 0.5 },
      { damage: 13, angle: Math.PI / 4, range: 80, attackRate: 0.5 },
      { damage: 13, angle: (Math.PI / 4) * 1.2, range: 90, attackRate: 0.5 },
      { damage: 18, angle: (Math.PI / 4) * 1.2, range: 90, attackRate: 0.5 },
      { damage: 23, angle: (Math.PI / 4) * 1.2, range: 90, attackRate: 0.5 },
      { damage: 28, angle: (Math.PI / 4) * 1.5, range: 90, attackRate: 0.5 },
      { damage: 33, angle: (Math.PI / 4) * 1.7, range: 120, attackRate: 0.5 },
    ],
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
    levels: [
      { range: 40, damage: 2, attackRate: 0.75 },
      { range: 60, damage: 2, attackRate: 0.75 },
      { range: 60, damage: 3, attackRate: 0.75 },
      { range: 70, damage: 3, attackRate: 0.75 },
      { range: 80, damage: 3, attackRate: 0.75 },
      { range: 80, damage: 4, attackRate: 0.75 },
    ],
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
  const baseIncreaseWithLevel = (increasePerLevel) => (player, value) =>
    value + player.level * increasePerLevel;

  /**
   * @param {number} value
   * @returns {AttributeEnhancer}
   */
  const baseValue = (value) => () => value;

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
      health: [baseValue(100), baseIncreaseWithLevel(10)],
      speed: [baseValue(45), baseIncreaseWithLevel(0.2)],
      healthRegen: [baseValue(0.1), baseIncreaseWithLevel(0.01)],
      pickupDistance: [baseValue(50)],
      damage: [baseIncreaseWithLevel(0.3)],
      attackSpeed: [baseValue(1)],
    },
  });

  /** @typedef {(player: Player) => void} UpgradeApply */
  /** @typedef {(player: Player) => boolean} UpgradeCondition */

  /**
   * @typedef Upgrade
   * @property {string} name
   * @property {string | (() => string)} description
   * @property {number} weight
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
    player.attrs[attr].push("base", (_, value) => value + change);

  /**
   * @param {keyof Player['attrs']} attr
   * @param {number} change
   * @returns {UpgradeApply}
   */
  const multiplyAttr = (attr, change) => (player) =>
    player.attrs[attr].push("multiplier", (_, value) => value * change);

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
            const str = key === "angle" ? `${fA(diff)}°` : f(diff);

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
      weight: 1,
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
      condition: (player) => player.health + 25 < player.attrs.health.value,
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
      name: "Damage",
      description: "+2 damage",
      weight: 1,
      apply: baseAttr("damage", 1),
      maxCount: 5,
    },
    {
      name: "Attack speed",
      description: "+5% attack speed",
      weight: 1,
      apply: baseAttr("attackSpeed", -0.05),
      maxCount: 5,
    },
    weaponUpgrade(sawBlades, "Saw Blades"),
    weaponUpgrade(sword, "Sword"),
    weaponUpgrade(barbedWire, "Barbed Wire"),
  ];

  /** @typedef {(player: Player, value: number) => number} AttributeEnhancer */
  /** @typedef {{ base: AttributeEnhancer[]; multiplier: AttributeEnhancer[]; playerLevel: number; value: number; }} AttributeCache */

  /**
   * @param {AttributeEnhancer[]} [base]
   * @param {AttributeEnhancer[]} [multiplier]
   */
  const createAttribute = (base = [], multiplier = []) => ({
    /**
     * Add a new attribute modifier function
     * @param {'base' | 'multiplier'} type
     * @param {(player: Player, value: number) => number} fn
     */
    push(type, fn) {
      this[type] = [...this[type], fn];
    },

    // Base attribute value modifiers
    /** @type {AttributeEnhancer[]} */
    base: [...base],

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
        this.base.reduce((acc, fn) => fn(player, acc), 0) *
        this.multiplier.reduce((acc, fn) => fn(player, acc), 1);

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
      speed: createAttribute(type.attrs.speed),
      health: createAttribute(type.attrs.health),
      healthRegen: createAttribute(type.attrs.healthRegen),
      pickupDistance: createAttribute(type.attrs.pickupDistance),
      damage: createAttribute(type.attrs.damage),
      attackSpeed: createAttribute(type.attrs.attackSpeed),
    },

    // Already applied upgrades
    upgrades: [],

    // Weapons
    weapons: type.weapons.map((w) => initializeWeapon(w)),
  });

  let player = createPlayer(warrior);

  const MANAGER_STATES = {
    RUNNING: 0,
    DEAD: 1,
    PICKING_UPGRADE: 2,
    PAUSED: 3,
    WIN: 4,
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

  /** @typedef {{ health: number; speed: number; damage: number; damageTick: number; experience: number; boss?: boolean; pushBackResistance?: number; size: number; render: (x: number, y: number, hit: boolean) => void}} EnemyType */
  /** @param {EnemyType} type */
  const defineEnemy = (type) => type;

  const boxLevel1 = defineEnemy({
    health: 10,
    speed: 26,
    damage: 1,
    damageTick: 1,
    experience: 1,
    size: 10,
    render: (x, y, hit) => draw.box(x, y, 10, hit ? "#fff" : "#aaa"),
  });

  const boxLevel2 = defineEnemy({
    health: 50,
    speed: 26,
    damage: 1,
    damageTick: 1,
    experience: 2,
    size: 10,
    render: (x, y, hit) => {
      draw.box(x + 1, y + 1, 10, hit ? "#fff" : "#faa");
      draw.box(x - 1, y - 1, 10, hit ? "#fff" : "#4aa");
    },
  });

  const boxLevel3 = defineEnemy({
    health: 100,
    speed: 30,
    damage: 2,
    damageTick: 1,
    experience: 3,
    size: 10,
    render: (x, y, hit) => {
      draw.box(x + 1, y + 1, 10, hit ? "#fff" : "#faa");
      draw.box(x - 1, y - 1, 10, hit ? "#fff" : "#4aa");
      draw.box(x + 1, y - 1, 10, hit ? "#fff" : "#4a4");
    },
  });

  const boxBoss = defineEnemy({
    health: 500,
    speed: 30,
    damage: 10,
    damageTick: 1,
    experience: 20,
    size: 20,
    render: (x, y, hit) => draw.box(x, y, 20, hit ? "#fff" : "#faa"),
    boss: true,
  });

  const triangleLevel1 = defineEnemy({
    health: 20,
    speed: 35,
    damage: 2,
    damageTick: 1,
    experience: 2,
    size: 10,
    render: (x, y, hit) => draw.triangle(x, y, 10, hit ? "#fff" : "#999"),
  });

  const triangleLevel2 = defineEnemy({
    health: 40,
    speed: 35,
    damage: 2,
    damageTick: 1,
    experience: 3,
    size: 10,
    render: (x, y, hit) => draw.triangle(x, y, 10, hit ? "#fff" : "#4aa"),
  });

  const triangleLevel3 = defineEnemy({
    health: 60,
    speed: 35,
    damage: 3,
    damageTick: 1,
    experience: 4,
    size: 10,
    render: (x, y, hit) => draw.triangle(x, y, 10, hit ? "#fff" : "#966"),
  });

  const triangleBoss = defineEnemy({
    health: 1000,
    speed: 35,
    damage: 10,
    damageTick: 1,
    experience: 50,
    boss: true,
    pushBackResistance: 80,
    size: 20,
    render: (x, y, hit) => draw.triangle(x, y, 20, hit ? "#fff" : "#faa"),
  });

  const circleLevel1 = defineEnemy({
    health: 10,
    speed: 40,
    damage: 1,
    damageTick: 1,
    experience: 3,
    size: 10,
    render: (x, y, hit) => draw.circle(x, y, 5, hit ? "#fff" : "#999"),
  });

  const circleLevel2 = defineEnemy({
    health: 20,
    speed: 40,
    damage: 1,
    damageTick: 1,
    experience: 4,
    size: 10,
    render: (x, y, hit) => draw.circle(x, y, 5, hit ? "#fff" : "#4aa"),
  });

  const circleLevel3 = defineEnemy({
    health: 50,
    speed: 40,
    damage: 1,
    damageTick: 1,
    experience: 5,
    size: 10,
    render: (x, y, hit) => draw.circle(x, y, 6, hit ? "#fff" : "#4ca"),
  });

  const circleBoss = defineEnemy({
    health: 1000,
    speed: 40,
    damage: 5,
    damageTick: 1,
    experience: 4,
    boss: true,
    pushBackResistance: 80,
    size: 16,
    render: (x, y, hit) => draw.circle(x, y, 8, hit ? "#fff" : "#faa"),
  });

  const finalBoss = defineEnemy({
    health: 10000,
    speed: 55,
    damage: 5,
    damageTick: 1,
    experience: 0,
    boss: true,
    pushBackResistance: 1000,
    size: 50,
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

  function renderBackground() {
    const startX = Math.floor((player.x - width / 2) / 50) * 50;
    const startY = Math.floor((player.y - height / 2) / 50) * 50;
    const endX = Math.ceil((player.x + width / 2) / 50) * 50;
    const endY = Math.ceil((player.y + height / 2) / 50) * 50;

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
            : "#000"
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

          const anglePerBlade = (Math.PI * 2) / attrs.blades;
          const baseAngle = weapon.tick * attrs.rotationSpeed;

          for (let i = 0; i < attrs.blades; i++) {
            const angle = baseAngle + anglePerBlade * i;
            const bladeX = player.x + Math.cos(angle) * attrs.range;
            const bladeY = player.y + Math.sin(angle) * attrs.range;

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
              player.x + Math.cos(player.meleeDirection - coneA2) * attrs.range,
              player.y + Math.sin(player.meleeDirection - coneA2) * attrs.range
            );

            ctx.arc(
              player.x,
              player.y,
              attrs.range,
              player.meleeDirection - coneA2,
              player.meleeDirection + coneA2
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
          const alpha = 0.15 + Math.cos(delta * 2 * Math.PI) * 0.02;

          draw.circle(
            player.x,
            player.y,
            attrs.range,
            `rgba(255,0,0,${alpha})`
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
      ["Base damage", f(player.attrs.damage.value)],
      ["Attack speed", f(player.attrs.attackSpeed.value, 2)],
      ["Health", Math.floor(player.attrs.health.value)],
      ["Regeneration", f(player.attrs.healthRegen.value, 2) + "/s"],
      ["Speed", f(player.attrs.speed.value, 2)],
    ];

    for (const weapon of player.weapons) {
      const name = weapon.type.name;

      switch (weapon.type.type) {
        case WEAPON_TYPES.MELEE: {
          const attrs = weapon.type.levels[weapon.level];

          stats.push([`${name} level`, weapon.level + 1]);
          stats.push([`${name} damage`, f(attrs.damage)]);
          stats.push([`${name} range`, f(attrs.range)]);
          stats.push([`${name} angle`, `${fA(attrs.angle)}°`]);
          break;
        }

        case WEAPON_TYPES.SAW_BLADES: {
          const attrs = weapon.type.levels[weapon.level];

          stats.push([`${name} level`, weapon.level + 1]);
          stats.push([`${name} damage`, f(attrs.damage)]);
          stats.push([`${name} range`, f(attrs.range)]);
          stats.push([`${name} blades`, f(attrs.blades)]);
          stats.push([`${name} size`, f(attrs.size)]);
          break;
        }

        case WEAPON_TYPES.AREA: {
          const attrs = weapon.type.levels[weapon.level];

          stats.push([`${name} level`, weapon.level + 1]);
          stats.push([`${name} damage`, f(attrs.damage)]);
          stats.push([`${name} range`, f(attrs.range)]);
          break;
        }
      }
    }

    for (let i = 0; i < stats.length; i++) {
      const [name, value] = stats[i];
      draw.text(x, y + i * 15, `${name}:`, "#aaa");
      draw.text(x + w, y + i * 15, `${value}`, "#fff", "right");
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   */
  function renderSurvivalStatsUi(x, y, w) {
    const stats = [
      [`Survived for`, formatTime(manager.runtime)],
      [`Level`, `${player.level + 1}`],
      [`Damage done`, f(manager.damageDone)],
      [`DPS`, `${f(manager.damageDone / manager.runtime, 2)}`],
      [`Kills`, `${manager.kills}`],
    ];

    for (const stat of stats) {
      draw.text(x + w / 2 - 5, y, stat[0], "#ccc", "right");
      draw.text(x + w / 2 + 5, y, stat[1], "#fff", "left");
      y += 15;
    }

    return y;
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

      draw.rect(0, 0, width, height, "rgba(0,0,0,0.8)");
      draw.text(width / 2, y, "YOU'RE DEAD!", "#f88", "center", "top");

      y += 30;
      y = renderSurvivalStatsUi(50, y, width - 100);
      y += 30;

      draw.text(width / 2, y, "Press ENTER to restart", "#fff", "center");
    }

    if (manager.state === MANAGER_STATES.PICKING_UPGRADE) {
      draw.overlay("rgba(0,0,0,0.9)");
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
        ctx.fillText(
          typeof upgrade.description === "function"
            ? upgrade.description()
            : upgrade.description,
          x + 5,
          y + 22
        );

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
      draw.overlay("rgba(0,0,0,0.9)");
      draw.text(width / 2, 100, "PAUSED", "#fff", "center", "middle");
      renderPlayerStatsUi(100, 110, width - 200);
    }

    if (manager.state === MANAGER_STATES.WIN) {
      draw.overlay("rgba(0,0,0,0.9)");
      draw.text(width / 2, 100, "YOU WON", "#fff", "center", "middle");

      let y = 130;
      y = renderSurvivalStatsUi(100, y, width - 200);
      y += 30;

      draw.text(width / 2, y, "Press ENTER to restart", "#fff", "center");
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

      damageOverlayGradient.addColorStop(0, "rgba(255,0,0,0)");
      damageOverlayGradient.addColorStop(1, `rgba(255,0,0,${d})`);

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

      pickupOverlayGradient.addColorStop(0, "#fff");
      pickupOverlayGradient.addColorStop(1, `rgba(255,255,255,${p * 0.15})`);

      ctx.fillStyle = pickupOverlayGradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function render() {
    ctx.reset();
    ctx.font = "14px monospace";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(-player.x + width / 2, -player.y + height / 2);

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

  function startNewGame() {
    player = createPlayer(warrior);

    for (const key in startingManagerState) {
      manager[key] = startingManagerState[key];
    }

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
          break;
        }

        if (player.health <= 0) {
          manager.state = MANAGER_STATES.DEAD;
          break;
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

      case MANAGER_STATES.WIN:
      case MANAGER_STATES.DEAD:
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

    player.health = Math.min(
      player.attrs.health.value,
      player.health + player.attrs.healthRegen.value * deltaTime
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

            const anglePerBlade = (Math.PI * 2) / attrs.blades;
            const baseAngle = weapon.tick * attrs.rotationSpeed;

            for (let i = 0; i < attrs.blades; i++) {
              const angle = baseAngle + anglePerBlade * i;
              const bladeX = player.x + Math.cos(angle) * attrs.range;
              const bladeY = player.y + Math.sin(angle) * attrs.range;

              for (const enemy of enemies) {
                const dis = distance(enemy.x, enemy.y, bladeX, bladeY);

                if (dis < attrs.size / 2 + enemy.type.size + 2) {
                  enemy.health -= damage;
                  enemy.hitTick = 0.1;
                  enemy.pushBackX = Math.cos(angle) * 20;
                  enemy.pushBackY = Math.sin(angle) * 20;

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
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < attrs.range) {
                enemy.health -= damage;
                enemy.hitTick = 0.1;

                // TODO: Should this have push-back?
                // enemy.pushBackX = Math.cos(angle) * 20;
                // enemy.pushBackY = Math.sin(angle) * 20;

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
      const angle = Math.atan2(dy, dx);

      if (angle > coneStart && angle < coneEnd) {
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < attrs.range) {
          enemy.health -= damage;
          enemy.hitTick = 0.1;
          enemy.pushBackX = Math.cos(angle) * 25;
          enemy.pushBackY = Math.sin(angle) * 25;

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

  /** @type {any} */
  const anyWindow = window;
  anyWindow.DEBUG = {
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

  target.appendChild(canvas);
  requestAnimationFrame(animationFrameTick);
}
