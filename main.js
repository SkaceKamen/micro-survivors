// @ts-check
function microSurvivors(target = document.body, width = 400, height = 400) {
  /*
  TODO:
   - touch controls support?
*/

  // #region Constants
  const font = "monospace";
  const help = ["WASD to move", "Mouse to aim", "Survive", "Kill end boss"];
  const w2 = width / 2;
  const h2 = height / 2;
  const {
    floor,
    ceil,
    random,
    round,
    cos,
    sin,
    min,
    hypot,
    abs,
    atan2,
    PI,
    max,
    tan,
  } = Math;
  const PI2 = PI * 2;
  const pressEnter = "Press ENTER to ";
  const pressEnterToStart = pressEnter + "start";
  const pressEnterToRestart = pressEnter + "restart";
  const center = "center";
  const top = "top";
  const left = "left";
  const right = "right";
  const middle = "middle";
  const white = "#fff";
  const gray = "#aaa";
  const lightGray = "#ccc";
  const enemyStage2Color = "#faa";
  const enemyStage3Color = "#0ac";
  const darkGray = "#999";
  // #endregion

  // #region Compressed libraries
  // prettier-ignore
  let // ZzFXMicro - Zuper Zmall Zound Zynth - v1.3.1 by Frank Force ~ 1000 bytes
  zzfxV=.3,               // volume
  zzfxX=new AudioContext, // audio context
  zzfx=                   // play sound
  (p=1,k=.05,b=220,e=0,r=0,t=.1,q=0,D=1,u=0,y=0,v=0,z=0,l=0,E=0,A=0,F=0,c=0,w=1,m=0,B=0
  // @ts-expect-error
  ,N=0)=>{let d=2*PI,R=44100,G=u*=500*d/R/R,C=b*=(1-k+2*k*random(k=[]))*d/R,
  g=0,H=0,a=0,n=1,I=0,J=0,f=0,h=N<0?-1:1,x=d*h*N*2/R,L=cos(x),Z=sin,K=Z(x)/4,O=1+K,
  X=-2*L/O,Y=(1-K)/O,P=(1+h*L)/2/O,Q=-(h+L)/O,S=P,T=0,U=0,V=0,W=0;e=R*e+9;m*=R;r*=R;t*=
  R;c*=R;y*=500*d/R**3;A*=d/R;v*=d/R;z*=R;l=R*l|0;p*=zzfxV;for(h=e+m+r+t+c|0;a<h;k[a++]
  =f*p)++J%(100*F|0)||(f=q?1<q?2<q?3<q?Z(g**3):max(min(tan(g),1),-1):1-(2*g/d%2+2
  )%2:1-4*abs(round(g/d)-g/d):Z(g),f=(l?1-B+B*Z(d*a/l):1)*(f<0?-1:1)*abs(f)**D*(a
  <e?a/e:a<e+m?1-(a-e)/m*(1-w):a<e+m+r?w:a<h-c?(h-a-c)/t*w:0),f=c?f/2+(c>a?0:(a<h-c?1:(
  h-a)/c)*k[a-c|0]/2/p):f,N?f=W=S*T+Q*(T=U)+P*(U=f)-Y*V-X*(V=W):0),x=(b+=u+=y)*cos(A*
  // @ts-expect-error
  H++),g+=x+x*E*Z(a**5),n&&++n>z&&(b+=v,C+=v,n=0),!l||++I%l||(b=C,u=G,n=n||1);p=zzfxX.
  // @ts-expect-error
  createBuffer(1,h,R);p.getChannelData(0).set(k);b=zzfxX.createBufferSource();
  // @ts-expect-error
  b.buffer=p;b.connect(zzfxX.destination);b.start()}
  // #endregion

  // #region Audio
  // prettier-ignore
  const audio = {
    interactionClick: [3,,42,.01,.01,.02,3,2,,2,,,,,193,.6,,.53,.02],
    pickup: [.2,,577,,.05,.09,,3.6,,,,,,,,,,.64,.03,,-1499],
    levelUp: [.6,,599,.06,.11,.17,,1.2,-1,-5,254,.06,.1,.1,12,,,.86,.25,,-972],
    enemyHit: [.3,,142,,.23,.5,1,,-2.6,-24,,,.09,,,,,.1,.06],
    playerHit: [0.7,,480,.02,.04,.18,3,2.3,,,,,,.6,,.4,,.85,.01,,99],
  }
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
  const formatTime = (seconds) =>
    pad(floor(seconds / 60)) + ":" + pad(floor(seconds % 60));

  /**
   * Format angle
   *
   * @param {number} a angle in radians
   */
  const fAngle = (a) => fNumber(a * (180 / PI)) + "°";

  /**
   * Format number with fixed decimal places
   *
   * @param {number | undefined} n
   * @param {number} [d=0]
   */
  const fNumber = (n, d = 0) => n?.toFixed(d) ?? "";

  /**
   * @param {number} n
   */
  const fNumber2 = (n) => fNumber(n, 2);

  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  const distance = (x1, y1, x2, y2) => hypot(x2 - x1, y2 - y1);

  /**
   * @template A
   * @param {Array<{val: A; weight: number}>} array
   * @param {number} count
   * @returns {A[]}
   */
  const weightedPickItems = (array, count) => {
    const result = [];
    while (array.length && count--) {
      const index = weightedIndexChoice(array);
      result.push(array[index].val);
      array.splice(index, 1);
    }
    return result;
  };

  /**
   * @template T
   * @param {Array<{ weight: number; val: T }>} arr
   * @returns
   */
  const weightedIndexChoice = (arr) => {
    const totalWeight = arr.map((v) => v.weight).reduce((x, y) => x + y);
    const val = random() * totalWeight;
    for (let i = 0, cur = 0; ; i++) {
      cur += arr[i].weight;
      if (val <= cur) return i;
    }
  };

  /**
   * @template A
   * @param {A[]} a
   * @returns {A}
   */
  const pickRandom = (a) => a[round(random() * (a.length - 1))];

  // #endregion

  // #region Rendering functions
  /**
   * @param {string | CanvasGradient} style
   */
  const fillStyle = (style) => (ctx.fillStyle = style);

  const draw = {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {string | CanvasGradient} color
     * @param {boolean} [stroke=false]
     */
    rect(x, y, w, h, color, stroke) {
      ctx[stroke ? "strokeStyle" : "fillStyle"] = color;
      ctx[stroke ? "strokeRect" : "fillRect"](x, y, w, h);
    },
    /**
     * @param {string | CanvasGradient} style
     */
    overlay(style = "#000d") {
      draw.rect(0, 0, width, height, style);
    },
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} size
     * @param {string | CanvasGradient} color
     */
    box(x, y, size, color) {
      fillStyle(color);
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    },
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} size
     * @param {string | CanvasGradient} color
     */
    triangle(x, y, size, color) {
      fillStyle(color);
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
    text(x, y, text, color, hAlign = left, vAlign = top, size = 14) {
      ctx.font = `${size}px ${font}`;
      fillStyle(color);
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
      fillStyle(color);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, PI2);
      ctx.fill();
    },
    /**
     * @param {number} value
     */
    setGlobalAlpha(value) {
      ctx.globalAlpha = value;
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
  const renderStatsTable = (x, y, w, h, table, split = true) => {
    const rowHeight = 15;
    const tableY = y;
    let rowWidth = split ? w / 2 : w;

    if (split && (table.length - 1) * rowHeight <= h) {
      x += w / 4;
    }

    for (const [name, value] of table) {
      if (name || value) {
        draw.text(x, y, `${name}:`, gray);
        draw.text(x + rowWidth - 5, y, `${value}`, white, right);
      }

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

  /** @type {CanvasRenderingContext2D} */
  // @ts-expect-error null check doesn't provide much value here, lets just skip it
  const ctx = canvas.getContext`2d`;

  /** @type {Record<string, keyof typeof input>} */
  const inputMapping = {
    38: "u",
    40: "d",
    37: "l",
    39: "r",
    87: "u",
    83: "d",
    65: "l",
    68: "r",
    13: "e",
    27: "p",
    80: "p",
  };

  const input = {
    "u": false,
    "d": false,
    "l": false,
    "r": false,
    "e": false,
    "p": false,
    targetX: 0,
    targetY: 0,
  };

  /** @type {Partial<Record<keyof input, boolean>>} */
  let justPressedInput = {};

  /**
   * @param {boolean} state
   * @returns {(event: KeyboardEvent) => void}
   */
  const processKeyEvent = (state) => (event) => {
    const mapped = inputMapping[event.which];
    if (mapped) {
      // @ts-expect-error mapped is a valid key
      input[mapped] = state;
      justPressedInput[mapped] = state;
    }
  };

  onkeydown = processKeyEvent(true);
  onkeyup = processKeyEvent(false);
  onmousemove = (event) => {
    const rect = canvas.getBoundingClientRect();
    input.targetX = event.clientX - rect.left;
    input.targetY = event.clientY - rect.top;
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
    levels.forEach((level, i) => {
      previous = {
        ...previous,
        ...level,
      };

      result[i] = previous;
    });
    return result;
  };

  /**
   * @template TLevel
   * @typedef WeaponTypeBase
   * @property {string} nam
   * @property {string} desc
   * @property {TLevel[]} levels
   * @property {(weapon: Weapon, level: TLevel) => void} render
   * @property {(weapon: Weapon, level: TLevel) => void} tick
   * @property {(level: TLevel, nextLevel?: TLevel) => [string, number, ((input: number) => string)?][]} stats
   */

  /**
   * @typedef MagicOrbsWeaponLevel
   * @property {number} damage
   * @property {number} area
   * @property {number} rotationSpeed
   * @property {number} damageRate
   * @property {number} orbs
   * @property {number} radius
   */

  /**
   * @typedef {WeaponTypeBase<MagicOrbsWeaponLevel>} MagicOrbsWeapon
   */

  let enemyHitSounds = 0;

  /**
   * @param {Enemy} enemy
   * @param {number} damage
   * @param {number} angle
   */
  const hitEnemy = (enemy, damage, angle, pushBack = 20) => {
    enemy.health -= damage;
    enemy.hitTick = 0.1;
    if (pushBack) {
      enemy.pushBackX = cos(angle) * pushBack;
      enemy.pushBackY = sin(angle) * pushBack;
    }

    if (enemyHitSounds++ < 4) {
      zzfx(...audio.enemyHit);
    }

    manager.damageDone += damage;
  };

  /**
   * @param {MagicOrbsWeaponLevel} attrs
   * @param {number} tick
   * @param {(orbX: number, orbY: number, angle: number) => void} fn
   */
  const eachOrb = (attrs, tick, fn) => {
    const area = attrs.area;
    const baseAngle =
      tick * (attrs.rotationSpeed * player.attrs.attackSpeed.val);
    const anglePerOrb = PI2 / attrs.orbs;

    for (let i = 0; i < attrs.orbs; i++) {
      const angle = baseAngle + anglePerOrb * i;
      const orbX = player.x + cos(angle) * area;
      const orbY = player.y + sin(angle) * area;
      fn(orbX, orbY, angle);
    }
  };

  /** @type {MagicOrbsWeapon} */
  const magicOrbs = {
    nam: "Orbs",
    desc: "Orbiting orbs",
    levels: fillLevels([
      {
        damage: 10,
        area: 50,
        rotationSpeed: PI / 1.5,
        damageRate: 0.1,
        orbs: 1,
        radius: 10,
      },
      { orbs: 2 },
      { damage: 15, rotationSpeed: PI / 1.25 },
      { rotationSpeed: PI / 1, radius: 15 },
      { orbs: 3 },
      { damage: 20 },
      { orbs: 4 },
    ]),
    tick(weapon, attrs) {
      const damage = attrs.damage + player.attrs.damage.val;
      const radius = attrs.radius * player.attrs.area.val;

      eachOrb(attrs, weapon.tick, (orbX, orbY, angle) => {
        for (const enemy of enemies) {
          const dis = distance(enemy.x, enemy.y, orbX, orbY);

          if (dis < radius / 2 + enemy.type.radius + 2) {
            hitEnemy(enemy, damage, angle);
          }
        }
      });
    },
    render(weapon, attrs) {
      const radius = attrs.radius * player.attrs.area.val;

      eachOrb(attrs, weapon.tick, (orbX, orbY) => {
        draw.circle(orbX, orbY, radius / 2, white);
      });
    },
    stats: (attrs, attrs1) => [
      [`damage`, optionalStatsDiff(attrs.damage, attrs1?.damage)],
      [`range`, optionalStatsDiff(attrs.area, attrs1?.area)],
      [
        `speed`,
        optionalStatsDiff(attrs.rotationSpeed, attrs1?.rotationSpeed),
        (s) => fAngle(s) + "/s",
      ],
      [`count`, optionalStatsDiff(attrs.orbs, attrs1?.orbs)],
      [`size`, optionalStatsDiff(attrs.radius, attrs1?.radius)],
    ],
  };

  /**
   * @typedef MeleeWeaponLevel
   * @property {number} damage
   * @property {number} angle
   * @property {number} area
   * @property {number} damageRate
   */

  /**
   * @typedef {WeaponTypeBase<MeleeWeaponLevel>} MeleeWeapon
   */

  /**
   * @param {number} a
   * @param {number} [b]
   * @returns {number}
   */
  const optionalStatsDiff = (a, b) => (b ? b - a : a);

  /** @type {MeleeWeapon} */
  const sword = {
    nam: "Sword",
    desc: "melee weapon",
    levels: fillLevels([
      { damage: 8, angle: PI / 4, area: 80, damageRate: 0.5 },
      { damage: 13 },
      { angle: (PI / 4) * 1.2, area: 90 },
      { damage: 18 },
      { damage: 23 },
      { damage: 28, angle: (PI / 4) * 1.5 },
      { damage: 33, angle: (PI / 4) * 1.7, area: 120 },
    ]),
    tick(_, attrs) {
      const damage = attrs.damage + player.attrs.damage.val;
      const area = attrs.area * player.attrs.area.val;

      const coneA2 = attrs.angle / 2;
      const coneStart = player.meleeDirection - coneA2;
      const coneEnd = player.meleeDirection + coneA2;

      for (const enemy of enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const angle = atan2(dy, dx);
        const distance = hypot(dx, dy);
        const offset = atan2(enemy.type.radius / 2, distance);

        if (angle + offset > coneStart && angle - offset < coneEnd) {
          if (distance - enemy.type.radius / 2 < area) {
            hitEnemy(enemy, damage, angle);
          }
        }
      }
    },
    render(weapon, attrs) {
      const rate = attrs.damageRate * player.attrs.attackSpeed.val;
      const area = attrs.area * player.attrs.area.val;
      const delta = weapon.damageTick / rate;
      const alpha = delta * 0.2;

      if (alpha > 0) {
        const coneA2 = attrs.angle / 2;

        fillStyle(`rgba(255,255,255,${alpha})`);
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(
          player.x + cos(player.meleeDirection - coneA2) * area,
          player.y + sin(player.meleeDirection - coneA2) * area,
        );

        ctx.arc(
          player.x,
          player.y,
          area,
          player.meleeDirection - coneA2,
          player.meleeDirection + coneA2,
        );

        ctx.lineTo(player.x, player.y);
        ctx.fill();
      }
    },
    stats: (attrs, attrs1) => [
      [`damage`, optionalStatsDiff(attrs.damage, attrs1?.damage)],
      [`range`, optionalStatsDiff(attrs.area, attrs1?.area)],
      [`angle`, optionalStatsDiff(attrs.angle, attrs1?.angle), fAngle],
    ],
  };

  /**
   * @typedef AreaWeaponLevel
   * @property {number} damage
   * @property {number} area
   * @property {number} damageRate
   */

  /**
   * @typedef {WeaponTypeBase<AreaWeaponLevel>} AreaWeapon
   */

  /** @type {AreaWeapon} */
  const barbedWire = {
    nam: "Barbed Wire",
    desc: "area damage",
    levels: fillLevels([
      { area: 40, damage: 2, damageRate: 0.75 },
      { area: 60 },
      { damage: 3 },
      { area: 70 },
      { area: 80 },
      { damage: 4 },
    ]),
    tick(_, attrs) {
      const damage = attrs.damage + player.attrs.damage.val;
      const area = attrs.area * player.attrs.area.val;

      for (const enemy of enemies) {
        const dis = distance(player.x, player.y, enemy.x, enemy.y);

        if (dis < area) {
          // TODO: Should this have push-back?
          hitEnemy(enemy, damage, 0, 0);
        }
      }
    },
    render(weapon, attrs) {
      const rate = attrs.damageRate * player.attrs.attackSpeed.val;
      const area = attrs.area * player.attrs.area.val;

      const delta = weapon.damageTick / rate;
      const alpha = 0.15 + cos(delta * 2 * PI) * 0.04;

      draw.circle(player.x, player.y, area, `rgba(255,0,0,${alpha})`);
    },
    stats: (attrs, attrs1) => [
      [`damage`, optionalStatsDiff(attrs.damage, attrs1?.damage)],
      [`range`, optionalStatsDiff(attrs.area, attrs1?.area)],
    ],
  };

  /**
   * @typedef {MagicOrbsWeapon | MeleeWeapon | AreaWeapon} WeaponType
   */

  /**
   * @param {WeaponType} typ
   */
  const initializeWeapon = (typ) => ({
    typ,
    tick: 0,
    damageTick: 0,
    lvl: 0,
  });

  /** @typedef {ReturnType<typeof initializeWeapon>} Weapon */

  /**
   * @typedef PlayerType
   * @property {string} nam
   * @property {WeaponType} weapon
   * @property {Record<keyof Player['attrs'], number>} attrs
   * @property {Partial<Record<keyof Player['attrs'], number>>} attrsWithLevel
   * @property {(x: number, y: number) => void} render
   */

  /** @type {PlayerType[]} */
  const playerTypes = [
    {
      nam: "Warrior",
      weapon: sword,
      attrs: {
        health: 50,
        spd: 45,
        healthRegen: 0.05,
        pickupDistance: 50,
        damage: 0,
        attackSpeed: 1,
        healthDrop: 0.01,
        armor: 1,
        area: 1,
      },
      attrsWithLevel: {
        spd: 0.2,
        healthRegen: 0.025,
        damage: 0.3,
      },
      render: (x, y) => draw.box(x, y, 10, white),
    },
    {
      nam: "Monk",
      weapon: barbedWire,
      attrs: {
        health: 50,
        spd: 60,
        healthRegen: 0.05,
        pickupDistance: 50,
        damage: 0,
        attackSpeed: 1,
        healthDrop: 0.01,
        armor: 0,
        area: 1,
      },
      attrsWithLevel: {
        healthRegen: 0.03,
        pickupDistance: 1,
        area: 0.025,
      },
      render: (x, y) => draw.triangle(x, y, 10, white),
    },
    {
      nam: "Magic Man",
      weapon: magicOrbs,
      attrs: {
        health: 50,
        spd: 45,
        healthRegen: 0.05,
        pickupDistance: 50,
        damage: 0,
        attackSpeed: 1,
        healthDrop: 0.01,
        armor: 0,
        area: 1,
      },
      attrsWithLevel: {
        spd: 0.2,
        attackSpeed: -0.026,
        healthRegen: 0.03,
        armor: 0.25,
        area: 0.02,
      },
      render: (x, y) => draw.circle(x, y, 5, white),
    },
  ];

  /** @typedef {() => void} UpgradeApply */
  /** @typedef {() => boolean} UpgradeCondition */

  /**
   * @typedef Upgrade
   * @property {string} nam
   * @property {string | (() => string)} desc
   * @property {UpgradeApply} use
   * @property {number} [maxCount=5]
   * @property {() => number} [wght]
   */

  const baseWeight = 100;

  /**
   * @param {WeaponType} weapon
   * @returns {Upgrade}
   */
  const weaponUpgrade = (weapon) => {
    /** @type {undefined | { lvl: number; existing: Weapon; desc: string; }} */
    let cache;

    return {
      nam: weapon.nam,
      desc() {
        const existing =
          cache?.existing ?? player.weapons.find((w) => w.typ === weapon);

        if (!existing) {
          return weapon.desc;
        }

        if (cache?.lvl === existing.lvl) {
          return cache.desc;
        }

        const currentLevel = existing.typ.levels[existing.lvl];
        const nextLevel = existing.typ.levels[existing.lvl + 1];

        // @ts-expect-error level typing is broken
        const stats = existing.typ.stats(currentLevel, nextLevel);
        const desc = stats
          .filter((s) => !!s[1])
          .map(([l, v, f = fNumber]) => `+${f(v)} ${l}`)
          .join(", ");

        cache = {
          lvl: existing.lvl,
          existing,
          desc,
        };

        return desc;
      },
      use() {
        const existing = player.weapons.find((w) => w.typ === weapon);
        if (existing) {
          existing.lvl++;
        } else {
          player.weapons.push(initializeWeapon(weapon));
        }
      },
      // New weapons have smaller probability than weapon level ups
      wght: () =>
        player.weapons.some((w) => w.typ === weapon) ? baseWeight : 25,
      maxCount: weapon.levels.length - 1,
    };
  };

  /** @type {Upgrade[]} */
  const upgrades = [
    {
      nam: "Speed boost",
      desc: "+5% speed",
      use() {
        player.attrs.spd.multiplier += 0.05;
      },
    },
    {
      nam: "Speed base",
      desc: "+1 base speed",
      use() {
        player.attrs.spd.base += 1;
      },
    },
    {
      nam: "Max health",
      desc: "+25 max health, +5 health",
      use() {
        player.attrs.health.base += 25;
        player.health += 5;
      },
    },
    {
      nam: "Health drop",
      desc: "+1% health drop chance",
      use: () => (player.attrs.healthDrop.base += 0.01),
    },
    {
      nam: "Regen",
      desc: "+0.05/s health regen",
      use: () => (player.attrs.healthRegen.base += 0.05),
    },
    {
      nam: "Regen boost",
      desc: "+10% health regen",
      use: () => (player.attrs.healthRegen.multiplier += 0.1),
    },
    {
      nam: "Pickup range",
      desc: "+10 pickup range",
      use: () => (player.attrs.pickupDistance.base += 10),
    },
    {
      nam: "Damage",
      desc: "+1 damage",
      use: () => (player.attrs.damage.base += 1),
    },
    {
      nam: "Attack speed",
      desc: "+5% attack speed",
      use: () => (player.attrs.attackSpeed.base -= 0.05),
    },
    {
      nam: "Armor",
      desc: "+1 armor",
      use: () => (player.attrs.armor.base += 1),
    },
    {
      nam: "Area",
      desc: "+10% area",
      use: () => (player.attrs.area.base += 0.1),
    },
    weaponUpgrade(magicOrbs),
    weaponUpgrade(sword),
    weaponUpgrade(barbedWire),
  ];

  /**
   * @template T
   * @param {(() => T) | T} v
   * @returns {T}
   */
  // @ts-expect-error v() is for some reason throwing error, fix later
  const fnOrV = (v) => (typeof v == "function" ? v() : v);

  /**
   * @param {number} [base=0]
   * @param {number} [basePerLevel=0]
   * @param {number} [multiplier=1]
   */
  const createAttribute = (base = 0, basePerLevel = 0, multiplier = 1) => ({
    base,
    multiplier,
    get val() {
      return (this.base + player.lvl * basePerLevel) * this.multiplier;
    },
  });

  /** @typedef {ReturnType<typeof createAttribute>} PlayerAttribute */

  /**
   * @typedef Player
   * @property {PlayerType} typ
   * @property {number} x
   * @property {number} y
   * @property {number} lvl
   * @property {number} experience
   * @property {number} nextLevelExperience
   * @property {number} health
   * @property {number} meleeTick
   * @property {number} lastDamagedTick
   * @property {number} lastPickupTick
   * @property {number} meleeDirection
   * @property {Object} attrs
   * @property {PlayerAttribute} attrs.spd
   * @property {PlayerAttribute} attrs.health
   * @property {PlayerAttribute} attrs.healthRegen
   * @property {PlayerAttribute} attrs.pickupDistance
   * @property {PlayerAttribute} attrs.damage
   * @property {PlayerAttribute} attrs.attackSpeed
   * @property {PlayerAttribute} attrs.healthDrop
   * @property {PlayerAttribute} attrs.armor
   * @property {PlayerAttribute} attrs.area
   * @property {Upgrade[]} upgrades
   * @property {Weapon[]} weapons
   */

  /**
   * @param {PlayerType} typ
   * @returns {Player}
   */
  const createPlayer = (typ) => ({
    // Predefined constants
    typ,

    // State values
    x: 0,
    y: 0,
    lvl: 0,
    experience: 0,
    nextLevelExperience: 5,
    health: typ.attrs.health,
    meleeTick: 0,
    lastDamagedTick: 0,
    lastPickupTick: 0,
    meleeDirection: 0,

    // Attribute values
    attrs: {
      health: createAttribute(typ.attrs.health, typ.attrsWithLevel.health),
      healthRegen: createAttribute(
        typ.attrs.healthRegen,
        typ.attrsWithLevel.healthRegen,
      ),
      armor: createAttribute(typ.attrs.armor, typ.attrsWithLevel.armor),
      damage: createAttribute(typ.attrs.damage, typ.attrsWithLevel.damage),
      attackSpeed: createAttribute(
        typ.attrs.attackSpeed,
        typ.attrsWithLevel.attackSpeed,
      ),
      area: createAttribute(typ.attrs.area, typ.attrsWithLevel.area),
      spd: createAttribute(typ.attrs.spd, typ.attrsWithLevel.spd),
      pickupDistance: createAttribute(
        typ.attrs.pickupDistance,
        typ.attrsWithLevel.pickupDistance,
      ),
      healthDrop: createAttribute(
        typ.attrs.healthDrop,
        typ.attrsWithLevel.healthDrop,
      ),
    },

    // Already applied upgrades
    upgrades: [],

    // Weapons
    weapons: [initializeWeapon(typ.weapon)],
  });

  const player = createPlayer(playerTypes[0]);

  const MANAGER_STATES = {
    IN_PROGRESS: 0,
    DEAD: 1,
    PICKING_UPGRADE: 2,
    PAUSED: 3,
    WON: 4,
    START: 5,
    PICKING_PLAYER: 6,
  };

  const startingManagerState = {
    lastSpawnRate: -1,
    gameRuntime: 0,
    damageDone: 0,
    kills: 0,
    spawnTimeout: 0,
    /** @type {Upgrade[]} */
    upgrades: [],
    selIndex: 0,
    selLength: 0,
  };

  const manager = {
    gameState: MANAGER_STATES.START,
    ...startingManagerState,
  };

  /**
   * @param {PlayerType} type
   * @returns
   */
  const assignPlayer = (type) => Object.assign(player, createPlayer(type));

  /**
   * @template T
   * @template {keyof T} K
   * @typedef {Partial<Pick<T, K>> & Omit<T, K>} WithOptional<T, K>
   */

  /** @typedef {{ health: number; spd: number; damage: number; damageTick: number; experience: number; boss?: boolean; pushBackResistance?: number; radius: number; render: (x: number, y: number, hit: string | undefined) => void}} EnemyType */
  /**
   * @param {WithOptional<EnemyType, 'damageTick' | 'radius'>} type
   * @returns {EnemyType}
   */
  const defineEnemy = (type) => ({ ...type, damageTick: 1, radius: 10 });

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
    spd: 26,
    damage: 10,
    experience: 1,
    render: boxSprite([gray], 10),
  });

  const boxLevel2 = defineEnemy({
    health: 50,
    spd: 26,
    damage: 20,
    experience: 2,
    render: boxSprite([gray, enemyStage2Color], 10),
  });

  const boxLevel3 = defineEnemy({
    health: 100,
    spd: 30,
    damage: 30,
    experience: 3,
    render: boxSprite([gray, enemyStage2Color, "#4a4"], 10),
  });

  const boxBoss = defineEnemy({
    health: 1000,
    spd: 30,
    damage: 30,
    experience: 100,
    radius: 20,
    render: boxSprite([enemyStage2Color], 20),
    boss: true,
  });

  const triangleLevel1 = defineEnemy({
    health: 20,
    spd: 35,
    damage: 10,
    experience: 2,
    render: triangleSprite([darkGray], 10),
  });

  const triangleLevel2 = defineEnemy({
    health: 40,
    spd: 35,
    damage: 20,
    experience: 3,
    render: triangleSprite([darkGray, enemyStage3Color], 10),
  });

  const triangleLevel3 = defineEnemy({
    health: 60,
    spd: 35,
    damage: 40,
    experience: 4,
    render: triangleSprite([darkGray, enemyStage3Color, "#966"], 10),
  });

  const triangleBoss = defineEnemy({
    health: 3000,
    spd: 35,
    damage: 40,
    experience: 200,
    boss: true,
    pushBackResistance: 80,
    radius: 20,
    render: triangleSprite([enemyStage2Color], 20),
  });

  const circleLevel1 = defineEnemy({
    health: 10,
    spd: 40,
    damage: 10,
    experience: 3,
    render: circleSprite([darkGray], 5),
  });

  const circleLevel2 = defineEnemy({
    health: 20,
    spd: 40,
    damage: 20,
    experience: 4,
    render: circleSprite([darkGray, enemyStage3Color], 5),
  });

  const circleLevel3 = defineEnemy({
    health: 50,
    spd: 40,
    damage: 40,
    experience: 5,
    render: circleSprite([darkGray, enemyStage3Color, "#4ca"], 5),
  });

  const circleBoss = defineEnemy({
    health: 5000,
    spd: 40,
    damage: 50,
    experience: 300,
    boss: true,
    pushBackResistance: 80,
    radius: 16,
    render: circleSprite([enemyStage2Color], 8),
  });

  const finalBoss = defineEnemy({
    health: 8000,
    spd: 60,
    damage: 100,
    experience: 0,
    boss: true,
    pushBackResistance: 1000,
    radius: 50,
    render(x, y, hit) {
      draw.circle(x, y, 25, hit ?? enemyStage2Color);
      draw.box(x, y, 25, hit ?? enemyStage3Color);
      draw.triangle(x, y, 23, hit ?? enemyStage2Color);
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
    const xRange = range(player.x - w2, player.x + w2, enemy.radius * 2);
    const yRange = range(player.y - h2, player.y + h2, enemy.radius * 2);

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
   * @property {EnemyType[]} enemies
   * @property {number} spawnRate
   * @property {EnemyType} [boss]
   * @property {() => void} [wave]
   */

  /** @type {SpawnRate[]} */
  const spawnRates = [
    { enemies: [boxLevel1], spawnRate: 0.2 },
    { enemies: [boxLevel1, triangleLevel1], spawnRate: 0.2 },
    { enemies: [boxLevel1, triangleLevel1], spawnRate: 0.2 },
    { enemies: [triangleLevel1], spawnRate: 0.2, boss: boxBoss },
    { enemies: [triangleLevel1, circleLevel1], spawnRate: 0.2 },
    { enemies: [triangleLevel1, circleLevel1], spawnRate: 0.2 },
    { enemies: [boxLevel2], spawnRate: 0.2, wave: rectangleWave(boxLevel2) },
    { enemies: [boxLevel2, triangleLevel2, circleLevel1], spawnRate: 0.2 },
    {
      enemies: [triangleLevel2, circleLevel1],
      boss: triangleBoss,
      spawnRate: 0.2,
    },
    { enemies: [triangleLevel2, circleLevel2, boxLevel2], spawnRate: 0.2 },
    {
      enemies: [circleLevel2, boxLevel3],
      spawnRate: 0.2,
      wave: circleWave(circleLevel2),
    },
    { enemies: [boxLevel3, triangleLevel3], spawnRate: 0.2 },
    { enemies: [boxLevel3, triangleLevel3], spawnRate: 0.2 },
    { enemies: [boxLevel3, triangleLevel3, circleLevel3], spawnRate: 0.2 },
    { enemies: [boxLevel3, triangleLevel3], boss: circleBoss, spawnRate: 0.2 },
    {
      enemies: [boxLevel3, triangleLevel3, circleLevel3],
      spawnRate: 0.1,
      wave: rectangleWave(triangleLevel3),
    },
    { enemies: [], spawnRate: 0, boss: finalBoss },
  ];

  const bossAt = 600;
  const waveTime = bossAt / (spawnRates.length - 1);

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

  const bgBoxSize = 50;
  const bgBoxSize2 = bgBoxSize * 2;

  const renderBackground = () => {
    const startX = floor((player.x - w2) / bgBoxSize) * bgBoxSize;
    const startY = floor((player.y - h2) / bgBoxSize) * bgBoxSize;
    const endX = ceil((player.x + w2) / bgBoxSize) * bgBoxSize;
    const endY = ceil((player.y + h2) / bgBoxSize) * bgBoxSize;

    for (let x = startX; x < endX; x += bgBoxSize) {
      for (let y = startY; y < endY; y += bgBoxSize) {
        draw.rect(
          x,
          y,
          bgBoxSize,
          bgBoxSize,
          x % bgBoxSize2 === 0
            ? y % bgBoxSize2 === 0
              ? "#000"
              : "#111"
            : y % bgBoxSize2 === 0
              ? "#111"
              : "#000",
        );
      }
    }
  };

  const renderPlayer = () => {
    for (const weapon of player.weapons) {
      /** @ts-expect-error can't be bothered to fight the level type here */
      weapon.typ.render(weapon, weapon.typ.levels[weapon.lvl]);
    }

    player.typ.render(player.x, player.y);
  };

  const renderEnemies = () => {
    for (const enemy of enemies) {
      const type = enemy.type;
      type.render(enemy.x, enemy.y, enemy.hitTick > 0 ? white : undefined);

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
  };

  const renderPickups = () => {
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
  };

  const statLabel = {
    damage: "Base damage",
    attackSpeed: "Attack speed",
    area: "Area",
    health: "Health",
    healthRegen: "Regen",
    armor: "Armor",
    spd: "Speed",
    healthDrop: "Health Drop",
    pickupDistance: "Pickup Distance",
  };

  /** @type {Partial<Record<keyof typeof statLabel, ((v: number) => string | number)>>} */
  const statFormat = {
    attackSpeed: (v) => fNumber2(2 - v),
    health: floor,
    area: fNumber2,
    spd: fNumber2,
    healthRegen: (v) => fNumber2(v) + "/s",
    healthDrop: (v) => fNumber(v * 100) + "%",
  };

  /**
   * @param {string} value
   */
  const perLevel = (value) => `${value}/level`;

  /**
   * @param {Player} player
   * @param {boolean} [includePerLevel]
   */
  const getPlayerStats = (player, includePerLevel) => {
    const stats = Object.entries(player.attrs).map(([key, value]) => [
      statLabel[key],
      (statFormat[key] ?? fNumber)(value.val),
    ]);

    const add = stats.push.bind(stats);

    if (includePerLevel) {
      add([]);

      add(
        ...Object.entries(player.typ.attrsWithLevel).map(([key, value]) => [
          statLabel[key],
          perLevel(fNumber(abs(value), 2)),
        ]),
      );

      add([]);
    }

    for (const weapon of player.weapons) {
      const name = weapon.typ.nam;

      add(
        [`${name} level`, weapon.lvl + 1],
        ...weapon.typ
          // @ts-expect-error can't be bothered to fight the level type here
          .stats(weapon.typ.levels[weapon.lvl])
          .map(([l, v, f = fNumber]) => [`${name} ${l}`, f(v)]),
      );
    }

    return stats;
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   */
  const renderPlayerStatsUi = (x, y, w) => {
    const stats = getPlayerStats(player);
    renderStatsTable(x, y, w, height - y - 40, stats);
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   */
  const renderSurvivalStatsUi = (x, y, w) => {
    const stats = [
      [`Survived`, formatTime(manager.gameRuntime)],
      [`Level`, `${player.lvl + 1}`],
      [`Damage`, fNumber(manager.damageDone)],
      [`DPS`, `${fNumber(manager.damageDone / manager.gameRuntime, 2)}`],
      [`Kills`, `${manager.kills}`],
    ];

    for (const stat of stats) {
      draw.text(x + w / 2 - 5, y, stat[0], lightGray, right);
      draw.text(x + w / 2 + 5, y, stat[1], white, left);
      y += 15;
    }

    return y;
  };

  const renderIngameUI = () => {
    draw.rect(50, 0, width - 50, 20, "#600");
    draw.rect(
      50,
      0,
      (player.health / player.attrs.health.val) * (width - 50),
      20,
      "#f66",
    );

    draw.text(
      50 + 2,
      10,
      floor(player.health) + "/" + floor(player.attrs.health.val),
      white,
      left,
      middle,
    );

    draw.rect(50, 20, width - 50, 12, darkGray);
    draw.rect(
      50,
      20,
      (player.experience / player.nextLevelExperience) * (width - 50),
      12,
      white,
    );

    draw.text(
      50 + 2,
      27,
      player.experience + "/" + player.nextLevelExperience,
      "#000",
      left,
      middle,
    );

    draw.rect(0, 0, 50, 32, "#000");
    draw.text(25, 2, "level", "#666", center, top);
    draw.text(25, 18, `${player.lvl + 1}`, white, center, top);

    draw.text(w2, 35, formatTime(manager.gameRuntime), white, center);

    if (manager.gameRuntime < 20) {
      let y = height - 30 - help.length * 15;
      for (const text of help) {
        draw.text(10, y, text, white, left, top);
        y += 15;
      }
    }
  };

  /**
   * @template T
   * @param {number} x
   * @param {number} y
   * @param {number} itemWidth
   * @param {number} itemHeight
   * @param {(x: number, y: number, item: T) => void} renderItem
   * @param {T[]} items
   * @returns
   */
  const renderSelectable = (x, y, itemWidth, itemHeight, renderItem, items) => {
    for (let i = 0; i < items.length; i++) {
      draw.rect(
        x,
        y,
        itemWidth,
        itemHeight,
        i === manager.selIndex ? "#333" : "#222",
      );

      draw.rect(
        x,
        y,
        itemWidth,
        itemHeight,
        i === manager.selIndex ? "#aa3" : "#444",
        true,
      );

      renderItem(x, y, items[i]);

      y += itemHeight + 5;
    }

    return y;
  };

  const uiScreens = {
    [MANAGER_STATES.DEAD]() {
      let y = 100;

      draw.overlay();
      draw.text(w2, y, "YOU'RE DEAD!", "#f88", center, top, 24);

      y += 45;
      y = renderSurvivalStatsUi(50, y, width - 100);
      y += 30;

      draw.text(w2, y, pressEnterToRestart, white, center);
    },
    [MANAGER_STATES.PAUSED]() {
      draw.overlay();
      draw.text(w2, 40, "PAUSED", white, center, middle);
      renderPlayerStatsUi(20, 80, width - 40);
    },
    [MANAGER_STATES.PICKING_PLAYER]() {
      draw.overlay();
      draw.text(w2, 10, "PICK CLASS", white, center, top);

      renderSelectable(
        20,
        50,
        100,
        20,
        (x, y, type) => {
          type.render(x + 10, y + 10);
          draw.text(x + 20, y + 10, type.nam, white, left, middle);
        },
        playerTypes,
      );

      const stats = getPlayerStats(player, true);
      renderStatsTable(140, 30, width - 140 - 20, height - 60, stats, false);
    },
    [MANAGER_STATES.PICKING_UPGRADE]() {
      draw.overlay();
      draw.text(w2, 10, "LEVEL UP", white, center, top);

      renderSelectable(
        20,
        50,
        width - 40,
        40,
        (x, y, upgrade) => {
          const alreadyApplied = player.upgrades.filter(
            (u) => u === upgrade,
          ).length;

          draw.text(x + 5, y + 5, upgrade.nam, white);
          draw.text(x + 5, y + 22, fnOrV(upgrade.desc), lightGray);

          draw.text(
            x + width - 50,
            y + 20,
            alreadyApplied + "/" + (upgrade.maxCount ?? 5),
            lightGray,
            right,
            middle,
          );
        },
        manager.upgrades,
      );

      renderPlayerStatsUi(20, 50 + 3 * 50 + 10, width - 40);
    },
    [MANAGER_STATES.START]() {
      draw.overlay();
      draw.text(w2, h2 - 40, "MICRO", white, center, "bottom", 68);
      draw.text(w2, h2 - 40, "SURVIVORS", white, center, top, 38);
      draw.text(w2, height - 5, "by Kamen", lightGray, center, "bottom", 10);

      draw.setGlobalAlpha(0.75 + cos((performance.now() / 1000) * 5) * 0.25);
      draw.text(w2, h2 + 50, pressEnterToStart, white, center);
      draw.setGlobalAlpha(1);
    },
    [MANAGER_STATES.WON]() {
      draw.overlay();
      draw.text(w2, 100, "YOU WON", white, center, middle);

      let y = 130;
      y = renderSurvivalStatsUi(100, y, width - 200);
      y += 30;

      draw.text(w2, y, pressEnterToRestart, white, center);
    },
  };

  const renderUI = () => {
    if (
      manager.gameState !== MANAGER_STATES.START &&
      manager.gameState !== MANAGER_STATES.PICKING_PLAYER
    ) {
      renderIngameUI();
    }

    uiScreens[manager.gameState]?.();
  };

  const renderOverlays = () => {
    const d = min(1, player.lastDamagedTick / 0.5);

    if (d > 0) {
      const damageOverlayGradient = screenGradient(
        80,
        "#f000",
        `rgba(255,0,0,${d})`,
      );

      draw.overlay(damageOverlayGradient);
    }

    const p = min(1, player.lastPickupTick / 0.1);
    if (p > 0) {
      const pickupOverlayGradient = screenGradient(
        130,
        "#fff0",
        `rgba(255,255,255,${p * 0.15})`,
      );

      draw.overlay(pickupOverlayGradient);
    }
  };

  const render = () => {
    ctx.reset();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(-player.x + w2, -player.y + h2);

    renderBackground();
    renderPickups();
    renderPlayer();
    renderEnemies();

    ctx.resetTransform();
    renderOverlays();
    renderUI();
  };

  /**
   * @param {number} deltaTime
   */
  const gameLogicTick = (deltaTime) => {
    managerTick(deltaTime);

    if (manager.gameState === MANAGER_STATES.IN_PROGRESS) {
      enemiesTick(deltaTime);
      pickupsTick(deltaTime);
      playerTick(deltaTime);
    }

    justPressedInput = {};
  };

  /**
   * @param {number} deltaTime
   */
  const enemiesTick = (deltaTime) => {
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

        if (random() < player.attrs.healthDrop.val) {
          pickups.push({
            x: enemy.x - 5 + random() * 10,
            y: enemy.y - 5 + random() * 10,
            health: 2,
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
        if (distance < enemy.type.radius - 2) {
          player.health -= max(0, type.damage - player.attrs.armor.val);
          player.lastDamagedTick = 0.5;
          enemy.damageTick = type.damageTick;
          zzfx(...audio.playerHit);
        }

        // Move towards player
        const speed = type.spd * deltaTime;
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
      let diff =
        (enemy.pushBackX > 0 ? -1 : 1) *
        deltaTime *
        (type.pushBackResistance ?? 20);

      if (abs(diff) > abs(enemy.pushBackX)) {
        enemy.pushBackX = 0;
      } else {
        enemy.pushBackX += diff;
      }

      diff =
        (enemy.pushBackY > 0 ? -1 : 1) *
        deltaTime *
        (type.pushBackResistance ?? 20);

      if (abs(diff) > abs(enemy.pushBackY)) {
        enemy.pushBackY = 0;
      } else {
        enemy.pushBackY += diff;
      }

      index++;
    }

    let offset = 0;
    for (const index of enemiesToRemove) {
      enemies.splice(index - offset, 1);
      offset += 1;
    }
  };

  /**
   * @param {EnemyType} type
   */
  const spawnEnemy = (type) => {
    const angle = random() * PI2;
    const side = max(width, height) / 2;
    const minDistance = hypot(side, side);
    const distance = minDistance + random() * 15;

    pushEnemy(
      player.x + cos(angle) * distance,
      player.y + sin(angle) * distance,
      type,
    );
  };

  /**
   * @param {PlayerType} playerType
   */
  const startNewGame = (playerType) => {
    assignPlayer(playerType);
    Object.assign(manager, startingManagerState);

    manager.gameState = MANAGER_STATES.IN_PROGRESS;
    enemies.length = 0;
    pickups.length = 0;
  };

  const managerSelectionTick = () => {
    if (justPressedInput.u && manager.selIndex > 0) {
      manager.selIndex--;
      zzfx(...audio.interactionClick);
    }

    if (justPressedInput.d && manager.selIndex < manager.selLength) {
      manager.selIndex++;
      zzfx(...audio.interactionClick);
    }
  };

  /**
   * @param {number} deltaTime
   */
  const managerTick = (deltaTime) => {
    switch (manager.gameState) {
      case MANAGER_STATES.IN_PROGRESS: {
        manager.gameRuntime += deltaTime;

        if (justPressedInput.p) {
          manager.gameState = MANAGER_STATES.PAUSED;
        }

        if (player.health <= 0) {
          manager.gameState = MANAGER_STATES.DEAD;
        }

        const spawnRateIndex = floor(manager.gameRuntime / waveTime);
        const spawnRate = spawnRates[spawnRateIndex];

        if (manager.gameRuntime > bossAt && enemies.length === 0) {
          manager.gameState = MANAGER_STATES.WON;
        }

        if (spawnRate) {
          if (spawnRateIndex !== manager.lastSpawnRate) {
            manager.lastSpawnRate = spawnRateIndex;

            if (spawnRate.boss) {
              spawnEnemy(spawnRate.boss);
            }

            spawnRate.wave?.();
          }

          while (
            spawnRate.spawnRate &&
            manager.spawnTimeout > spawnRate.spawnRate
          ) {
            if (spawnRate.enemies.length > 0) {
              spawnEnemy(pickRandom(spawnRate.enemies));
            }
            manager.spawnTimeout -= spawnRate.spawnRate;
          }

          manager.spawnTimeout += deltaTime;
        }

        break;
      }

      case MANAGER_STATES.WON:
      case MANAGER_STATES.DEAD:
      case MANAGER_STATES.START:
        if (input.e) {
          manager.selIndex = 0;
          manager.selLength = playerTypes.length - 1;
          assignPlayer(playerTypes[0]);
          manager.gameState = MANAGER_STATES.PICKING_PLAYER;

          zzfx(...audio.interactionClick);
        }

        break;

      case MANAGER_STATES.PICKING_PLAYER:
        managerSelectionTick();
        const type = playerTypes[manager.selIndex];

        if (player.typ !== type) {
          assignPlayer(type);
        }

        if (justPressedInput.e) {
          startNewGame(playerTypes[manager.selIndex]);
          zzfx(...audio.interactionClick);
        }

        break;

      case MANAGER_STATES.PICKING_UPGRADE:
        managerSelectionTick();

        if (justPressedInput.e) {
          const upgrade = manager.upgrades[manager.selIndex];
          upgrade.use();
          player.upgrades.push(upgrade);
          manager.gameState = MANAGER_STATES.IN_PROGRESS;
          // TODO: Specific sound?
          zzfx(...audio.interactionClick);
        }

        break;

      case MANAGER_STATES.PAUSED:
        if (justPressedInput.p || justPressedInput.e) {
          manager.gameState = MANAGER_STATES.IN_PROGRESS;
        }

        break;
    }
  };

  /**
   * @param {number} deltaTime
   */
  const playerTick = (deltaTime) => {
    enemyHitSounds = 0;

    let moveX = 0;
    let moveY = 0;

    input.u && (moveY -= 1);
    input.d && (moveY += 1);
    input.l && (moveX -= 1);
    input.r && (moveX += 1);

    const speed = player.attrs.spd.val * deltaTime;
    const moveD = hypot(moveX, moveY);

    if (moveD > 0) {
      player.x += (moveX / moveD) * speed;
      player.y += (moveY / moveD) * speed;
    }

    player.meleeDirection = atan2(input.targetY - w2, input.targetX - h2);

    if (player.experience >= player.nextLevelExperience) {
      player.lvl += 1;
      player.experience -= player.nextLevelExperience;
      player.nextLevelExperience += 10;

      const availableUpgrades = upgrades
        .filter((upgrade) => {
          if (
            player.upgrades.filter((u) => u === upgrade).length >=
            (upgrade.maxCount ?? 5)
          ) {
            return false;
          }

          return true;
        })
        .map((u) => ({
          val: u,
          weight: u.wght?.() ?? baseWeight,
        }));

      manager.upgrades = weightedPickItems(availableUpgrades, 3);

      if (manager.upgrades.length > 0) {
        manager.gameState = MANAGER_STATES.PICKING_UPGRADE;
        manager.selIndex = 0;
        manager.selLength = manager.upgrades.length - 1;
      }

      zzfx(...audio.levelUp);

      player.health += 5;
    }

    if (player.lastDamagedTick > 0) {
      player.lastDamagedTick -= deltaTime;
    }

    if (player.lastPickupTick > 0) {
      player.lastPickupTick -= deltaTime;
    }

    player.health = min(
      player.attrs.health.val,
      player.health + player.attrs.healthRegen.val * deltaTime,
    );

    for (const weapon of player.weapons) {
      weapon.tick += deltaTime;

      if (weapon.damageTick <= 0) {
        /** @type {{ damageRate: number }} */
        const attrs = weapon.typ.levels[weapon.lvl];
        // @ts-expect-error can't be bothered to fight the level type here
        weapon.typ.tick(weapon, attrs);
        weapon.damageTick = attrs.damageRate * player.attrs.attackSpeed.val;
      } else {
        weapon.damageTick -= deltaTime;
      }
    }
  };

  /**
   * @param {number} deltaTime
   */
  const pickupsTick = (deltaTime) => {
    let index = 0;
    let pickupsToRemove = [];

    for (const pickup of pickups) {
      const dx = player.x - pickup.x;
      const dy = player.y - pickup.y;
      const dis = hypot(dx, dy);

      if (dis < 10) {
        player.health = min(
          player.attrs.health.val,
          player.health + (pickup.health ?? 0),
        );

        player.experience += pickup.experience ?? 0;
        player.lastPickupTick = 0.1;

        zzfx(...audio.pickup);

        pickupsToRemove.push(index);
      } else if (dis < player.attrs.pickupDistance.val) {
        const speed =
          (player.attrs.pickupDistance.val + 10 - dis) * deltaTime * 2;
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
  };

  let lastTime = 0;

  /**
   * @param {DOMHighResTimeStamp} nextTime
   */
  const animationFrameTick = (nextTime) => {
    requestAnimationFrame(animationFrameTick);

    const delta = (nextTime - lastTime) / 1000;
    lastTime = nextTime;

    render();
    gameLogicTick(delta);
  };

  target.appendChild(canvas);
  requestAnimationFrame(animationFrameTick);

  return [player, manager];
}

typeof module === "object" && (module.exports = microSurvivors);
