// @ts-check

function microSurvivors(target = document.body, width = 400, height = 400) {
  // #region Constants
  const font = "monospace";
  const help = () => [
    "WASD to move",
    player.weapons[0].typ === sword ? "Mouse to aim" : undefined,
    "Survive",
    "Kill end boss",
  ];
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
    sign,
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
  const { entries, assign } = Object;
  let scale = 0;
  const setScale = (s) => (scale = s);
  let usesTouch = false;
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
   * @param {Array<A>} array
   * @param {number} count
   * @param {(item: A) => number} weight
   * @returns {A[]}
   */
  const weightedPickItems = (array, count, weight) => {
    const result = [];
    while (array.length && count--) {
      const index = weightedIndexChoice(array, weight);
      result.push(array[index]);
      array.splice(index, 1);
    }
    return result;
  };

  /**
   * @template T
   * @param {Array<T>} arr
   * @param {(item: T) => number} weight
   * @returns
   */
  const weightedIndexChoice = (arr, weight) => {
    const totalWeight = arr.map(weight).reduce((x, y) => x + y);
    const val = random() * totalWeight;
    for (let i = 0, cur = 0; ; i++) {
      cur += weight(arr[i]);
      if (val <= cur) return i;
    }
  };

  // #endregion

  // #region Rendering functions
  /**
   * @param {string | CanvasGradient} style
   */
  const fillStyle = (style) => (ctx.fillStyle = style);

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {string | CanvasGradient} color
   * @param {boolean} [stroke=false]
   */
  const drawRect = (x, y, w, h, color, stroke) => {
    ctx[stroke ? "strokeStyle" : "fillStyle"] = color;
    ctx[stroke ? "strokeRect" : "fillRect"](x, y, w, h);
  };

  /**
   * @param {string | CanvasGradient} style
   */
  const drawOverlay = (style = "#000d") => {
    drawRect(0, 0, width, height, style);
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} size
   * @param {string | CanvasGradient} color
   */
  const drawBox = (x, y, size, color) => {
    fillStyle(color);
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} size
   * @param {string | CanvasGradient} color
   */
  const drawTriangle = (x, y, size, color) => {
    fillStyle(color);
    ctx.beginPath();
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x - size / 2, y + size / 2);
    ctx.lineTo(x + size / 2, y + size / 2);
    ctx.fill();
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {string} text
   * @param {string} color
   * @param {CanvasTextAlign} [hAlign="left"]
   * @param {CanvasTextBaseline} [vAlign="top"]
   */
  const drawText = (
    x,
    y,
    text,
    color,
    hAlign = left,
    vAlign = top,
    size = 14,
  ) => {
    ctx.font = `${size}px ${font}`;
    fillStyle(color);
    ctx.textAlign = hAlign;
    ctx.textBaseline = vAlign;
    ctx.fillText(text, x, y);
  };

  /**
   * @param {number} y
   * @param {string} text
   */
  const drawTitleText = (y, text) => {
    drawText(w2, y, text, white, center, top);
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @param {string} color
   */
  const drawCircle = (x, y, radius, color) => {
    fillStyle(color);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, PI2);
    ctx.fill();
  };

  /**
   * @param {number} value
   */
  const setGlobalAlpha = (value) => (ctx.globalAlpha = value);

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
        drawText(x, y, `${name}:`, gray);
        drawText(x + rowWidth - 5, y, `${value}`, white, right);
      }

      y += rowHeight;

      if (y > tableY + h) {
        y = tableY;
        x += rowWidth;
      }
    }

    return y;
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

  // #region Input handling

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
    69: "e",
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
    aimAtX: 0,
    aimAtY: 0,
    touching: false,
    touchStartX: 0,
    touchStartY: 0,
    touchX: 0,
    touchY: 0,
  };

  const touchInputRadius = 60;

  /** @type {Partial<Record<keyof input, boolean>>} */
  let justPressedInput = {};

  /**
   * @param {boolean} state
   * @returns {(event: KeyboardEvent) => void}
   */
  const processKeyEvent = (state) => (event) => {
    const mapped = inputMapping[event.which];
    if (mapped) {
      event.preventDefault();
      // @ts-expect-error mapped is a valid key
      input[mapped] = state;
      justPressedInput[mapped] = state;
    }
  };

  const canvasRelative = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (1 / scale),
      y: (event.clientY - rect.top) * (1 / scale),
    };
  };

  onkeydown = processKeyEvent(true);
  onkeyup = processKeyEvent(false);
  onmousemove = (event) => {
    const relative = canvasRelative(event);
    input.aimAtX = relative.x;
    input.aimAtY = relative.y;
  };
  onblur = () => {
    if (manager.gameState === MANAGER_STATES.IN_PROGRESS) {
      manager.gameState = MANAGER_STATES.PAUSED;
    }
  };
  ontouchstart = (evt) => {
    const relative = canvasRelative(evt.touches[0]);
    input.touching = true;
    justPressedInput.touching = true;
    input.touchX = input.touchStartX = relative.x;
    input.touchY = input.touchStartY = relative.y;
    usesTouch = true;
  };
  ontouchmove = (evt) => {
    const relative = canvasRelative(evt.touches[0]);
    input.touchX = relative.x;
    input.touchY = relative.y;
  };
  ontouchend = (evt) => {
    input.touching = false;
  };

  // #endregion

  // #region Weapons definition

  const weaponStatToLabel = {
    damage: "damage",
    area: "area",
    rotationSpeed: "speed",
    orbs: "orbs",
    radius: "radius",
    angleRad: "angle",
  };

  const weaponStatToFormatter = {
    /**
     * @param {number} v
     */
    rotationSpeed: (v) => fAngle(v) + "/s",
    angleRad: fAngle,
  };

  /**
   * @template {{}} LevelType
   * @param {[LevelType, ...Partial<LevelType>[]]} levels
   * @returns {LevelType[]}
   */
  const fillLevels = (levels) => {
    let previous = levels[0];
    return levels.map((level, i) => {
      if (i === 0) return previous;
      const desc = entries(level)
        .map(
          ([key, value]) =>
            `+${(weaponStatToFormatter[key] ?? fNumber)(value - previous[key])} ${weaponStatToLabel[key]}`,
        )
        .join(", ");
      previous = { ...previous, ...level };
      return { ...previous, desc };
    });
  };

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
      enemy.pushBack = [cos(angle) * pushBack, sin(angle) * pushBack];
    }

    if (enemyHitSounds++ < 4) {
      zzfx(...audio.enemyHit);
    }

    manager.damageDone += damage;
  };

  /**
   * @param {number} distance
   * @param {(enemy: Enemy, angle: number, distance: number) => void} fn
   * @param {number} [x=player.x]
   * @param {number} [y=player.y]
   */
  const eachEnemy = (distance, fn, x, y) => {
    for (const enemy of enemies) {
      const dx = enemy.x - (x ?? player.x);
      const dy = enemy.y - (y ?? player.y);
      const dis = hypot(dx, dy);
      const angle = atan2(dy, dx);

      if (dis < distance + (enemy.typ.radius ?? 5)) {
        fn(enemy, angle, dis);
      }
    }
  };

  /**
   * @template TLevel
   * @typedef WeaponTypeBase
   * @property {string} nam
   * @property {TLevel[]} levels
   * @property {(weapon: Weapon, level: TLevel) => void} render
   * @property {(weapon: Weapon, level: TLevel) => void} tick
   */

  /**
   * @typedef MagicOrbsWeaponLevel
   * @property {number} damage
   * @property {number} area
   * @property {number} rotationSpeed
   * @property {number} damageRate
   * @property {number} orbs
   * @property {number} radius
   * @property {string} [desc]
   */

  /**
   * @typedef {WeaponTypeBase<MagicOrbsWeaponLevel>} MagicOrbsWeapon
   */

  /**
   * @param {MagicOrbsWeaponLevel} attrs
   * @param {number} tick
   * @param {(orbX: number, orbY: number, angle: number) => void} fn
   */
  const eachOrb = (attrs, tick, fn) => {
    const area = attrs.area;
    const baseAngle =
      tick * (attrs.rotationSpeed * (2 - player.attrs.attackSpeed.val));
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
    levels: fillLevels([
      {
        damage: 10,
        area: 50,
        rotationSpeed: PI / 1.5,
        damageRate: 0.1,
        orbs: 1,
        radius: 10,
        desc: "Orbiting orbs",
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

      eachOrb(attrs, weapon.tick, (orbX, orbY, angle) =>
        eachEnemy(
          radius / 2,
          (enemy) => hitEnemy(enemy, damage, angle),
          orbX,
          orbY,
        ),
      );
    },
    render(weapon, attrs) {
      const radius = attrs.radius * player.attrs.area.val;

      eachOrb(attrs, weapon.tick, (orbX, orbY) =>
        drawCircle(orbX, orbY, radius / 2, white),
      );
    },
  };

  /**
   * @typedef MeleeWeaponLevel
   * @property {number} damage
   * @property {number} angleRad
   * @property {number} area
   * @property {number} damageRate
   * @property {string} [desc]
   */

  /**
   * @typedef {WeaponTypeBase<MeleeWeaponLevel>} MeleeWeapon
   */

  /** @type {MeleeWeapon} */
  const sword = {
    nam: "Sword",
    levels: fillLevels([
      {
        damage: 8,
        angleRad: PI / 4,
        area: 80,
        damageRate: 0.5,
        desc: "Melee weapon",
      },
      { damage: 13 },
      { angleRad: (PI / 4) * 1.2, area: 90 },
      { damage: 18 },
      { damage: 23 },
      { damage: 28, angleRad: (PI / 4) * 1.5 },
      { damage: 33, angleRad: (PI / 4) * 1.7, area: 120 },
    ]),
    tick(_, attrs) {
      const damage = attrs.damage + player.attrs.damage.val;
      const coneA2 = (attrs.angleRad / 2) * player.attrs.area.val;

      eachEnemy(attrs.area, (enemy, angle, dis) => {
        const offset = atan2((enemy.typ.radius ?? 5) / 2, dis);
        const angleDiff = abs(
          ((angle - player.meleeDirection + PI) % PI2) - PI,
        );

        if (angleDiff < coneA2 + offset) {
          hitEnemy(enemy, damage, angle);
        }
      });
    },
    render(weapon, attrs) {
      const rate = attrs.damageRate * player.attrs.attackSpeed.val;
      const area = attrs.area;
      const delta = weapon.damageTick / rate;
      const alpha = delta * 0.2;

      if (alpha > 0) {
        const coneA2 = (attrs.angleRad / 2) * player.attrs.area.val;

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
  };

  /**
   * @typedef AreaWeaponLevel
   * @property {number} damage
   * @property {number} area
   * @property {number} damageRate
   * @property {string} [desc]
   */

  /**
   * @typedef {WeaponTypeBase<AreaWeaponLevel>} AreaWeapon
   */

  /** @type {AreaWeapon} */
  const barbedWire = {
    nam: "Barbed Wire",
    levels: fillLevels([
      { area: 40, damage: 2, damageRate: 0.75, desc: "Area damage" },
      { area: 60 },
      { damage: 3 },
      { area: 70 },
      { area: 80 },
      { damage: 4 },
    ]),
    tick(_, attrs) {
      const damage = attrs.damage + player.attrs.damage.val;
      const area = attrs.area * player.attrs.area.val;

      eachEnemy(area, (enemy, angle) => hitEnemy(enemy, damage, angle, 0));
    },
    render(weapon, attrs) {
      const rate = attrs.damageRate * player.attrs.attackSpeed.val;
      const area = attrs.area * player.attrs.area.val;

      const delta = weapon.damageTick / rate;
      const alpha = 0.15 + cos(delta * 2 * PI) * 0.04;

      drawCircle(player.x, player.y, area, `rgba(255,0,0,${alpha})`);
    },
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

  // #endregion

  // #region Player classes definition

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
        health: 75,
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
      render: (x, y) => drawBox(x, y, 10, white),
    },
    {
      nam: "Monk",
      weapon: barbedWire,
      attrs: {
        health: 75,
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
      render: (x, y) => drawTriangle(x, y, 10, white),
    },
    {
      nam: "Magic Man",
      weapon: magicOrbs,
      attrs: {
        health: 75,
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
      render: (x, y) => drawCircle(x, y, 5, white),
    },
  ];

  // #endregion

  // #region Upgrades

  /** @typedef {() => void} UpgradeApply */

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
    return {
      nam: weapon.nam,
      desc: () => {
        const existing = player.weapons.find((w) => w.typ === weapon);
        return weapon.levels[(existing?.lvl ?? -1) + 1].desc ?? "";
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
        player.weapons.some((w) => w.typ === weapon) ? baseWeight : 15,
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

  // #endregion

  // #region Player definition
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
   * @property {number} levelUpTick
   * @property {number} levelUpCount
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
    levelUpTick: 0,
    levelUpCount: 0,

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

  // #endregion

  // #region Manager definition
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

  // #endregion

  /**
   * @param {PlayerType} type
   * @returns
   */
  const assignPlayer = (type) => assign(player, createPlayer(type));

  // #region Enemies definition
  /** @typedef {{ health: number; spd: number; damage: number; experience: number; boss?: boolean; pushBackResistance?: number; radius?: number; render: (x: number, y: number, hit: string | undefined) => void}} EnemyType */

  /**
   * @param {string[]} colors
   * @param {number} size
   * @returns {(x: number, y: number, hit: string | undefined) => void}
   */
  const boxSprite = (colors, size) => (x, y, hit) =>
    colors.map((color, i) => drawBox(x + i * 2, y + i * 2, size, hit ?? color));

  /**
   * @param {string[]} colors
   * @param {number} size
   * @returns {(x: number, y: number, hit: string | undefined) => void}
   */
  const triangleSprite = (colors, size) => (x, y, hit) =>
    colors.map((color, i) =>
      drawTriangle(x + i * 2, y + i * 2, size, hit ?? color),
    );

  /**
   * @param {string[]} colors
   * @param {number} radius
   * @returns {(x: number, y: number, hit: string | undefined) => void}
   */
  const circleSprite = (colors, radius) => (x, y, hit) =>
    colors.map((color, i) =>
      drawCircle(x + i * 2, y + i * 2, radius, hit ?? color),
    );

  /** @type {EnemyType} */
  const boxLevel1 = {
    health: 10,
    spd: 26,
    damage: 8,
    experience: 1,
    render: boxSprite([gray], 10),
  };

  /** @type {EnemyType} */
  const boxLevel2 = {
    health: 50,
    spd: 26,
    damage: 12,
    experience: 2,
    render: boxSprite([gray, enemyStage2Color], 10),
  };

  /** @type {EnemyType} */
  const boxLevel3 = {
    health: 100,
    spd: 30,
    damage: 15,
    experience: 3,
    render: boxSprite([gray, enemyStage2Color, "#4a4"], 10),
  };

  /** @type {EnemyType} */
  const boxBoss = {
    health: 1000,
    spd: 30,
    damage: 15,
    experience: 100,
    radius: 20,
    render: boxSprite([enemyStage2Color], 20),
    boss: true,
  };

  /** @type {EnemyType} */
  const boxTank = {
    health: 100,
    spd: 16,
    damage: 6,
    experience: 1,
    render: boxSprite([darkGray], 10),
  };

  /** @type {EnemyType} */
  const triangleLevel1 = {
    health: 20,
    spd: 35,
    damage: 8,
    experience: 2,
    render: triangleSprite([darkGray], 10),
  };

  /** @type {EnemyType} */
  const triangleLevel2 = {
    health: 40,
    spd: 35,
    damage: 10,
    experience: 3,
    render: triangleSprite([darkGray, enemyStage3Color], 10),
  };

  /** @type {EnemyType} */
  const triangleLevel3 = {
    health: 60,
    spd: 35,
    damage: 12,
    experience: 4,
    render: triangleSprite([darkGray, enemyStage3Color, "#966"], 10),
  };

  /** @type {EnemyType} */
  const triangleTank = {
    health: 220,
    spd: 20,
    damage: 10,
    experience: 4,
    render: triangleSprite([darkGray, darkGray, darkGray], 10),
  };

  /** @type {EnemyType} */
  const triangleBoss = {
    health: 3000,
    spd: 35,
    damage: 20,
    experience: 200,
    boss: true,
    pushBackResistance: 80,
    radius: 10,
    render: triangleSprite([enemyStage2Color], 20),
  };

  /** @type {EnemyType} */
  const circleLevel1 = {
    health: 10,
    spd: 40,
    damage: 8,
    experience: 3,
    render: circleSprite([darkGray], 5),
  };

  /** @type {EnemyType} */
  const circleLevel2 = {
    health: 20,
    spd: 40,
    damage: 10,
    experience: 4,
    render: circleSprite([darkGray, enemyStage3Color], 5),
  };

  /** @type {EnemyType} */
  const circleLevel3 = {
    health: 50,
    spd: 40,
    damage: 12,
    experience: 5,
    render: circleSprite([darkGray, enemyStage3Color, "#4ca"], 5),
  };

  /** @type {EnemyType} */
  const circleTank = {
    health: 200,
    spd: 25,
    damage: 12,
    experience: 4,
    radius: 8,
    render: circleSprite([enemyStage3Color], 8),
  };

  /** @type {EnemyType} */
  const circleBoss = {
    health: 5000,
    spd: 50,
    damage: 25,
    experience: 300,
    boss: true,
    pushBackResistance: 80,
    radius: 15,
    render: circleSprite([enemyStage2Color], 15),
  };

  /** @type {EnemyType} */
  const finalBoss = {
    health: 8000,
    spd: 65,
    damage: 55,
    experience: 0,
    boss: true,
    pushBackResistance: 1000,
    radius: 25,
    render(x, y, hit) {
      drawCircle(x, y, 25, hit ?? enemyStage2Color);
      drawBox(x, y, 25, hit ?? enemyStage3Color);
      drawTriangle(x, y, 23, hit ?? enemyStage2Color);
    },
  };

  // #endregion

  // #region Waves definition

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
    const radius = (enemy.radius ?? 5) * 2;

    const xRange = range(player.x - w2, player.x + w2, radius + 4);
    const yRange = range(player.y - h2, player.y + h2, radius + 4);

    xRange.map((x) => pushEnemy(x, player.y - h2, enemy));
    xRange.map((x) => pushEnemy(x, player.y + h2, enemy));
    yRange.map((y) => pushEnemy(player.x - w2, y, enemy));
    yRange.map((y) => pushEnemy(player.x + w2, y, enemy));
  };

  /** @param {EnemyType} enemy */
  const circleWave = (enemy) => () => {
    const angleStep = PI2 / 40;
    range(0, PI2, angleStep).map((i) =>
      pushEnemy(player.x + cos(i) * w2, player.y + sin(i) * h2, enemy),
    );
  };

  /** @param {EnemyType} enemy */
  const bossWave = (enemy) => () => pushEnemy(player.x, player.y, enemy);

  /**
   * @typedef SpawnWave
   * @property {EnemyType[]} enemies
   * @property {number} [spawnRate]
   * @property {EnemyType} [boss]
   * @property {() => void} [wave]
   */

  /** @type {SpawnWave[]} */
  const spawnWaves = [
    { enemies: [boxLevel1] },
    { enemies: [boxLevel1, triangleLevel1] },
    { enemies: [triangleLevel1, circleLevel1], boss: boxBoss },
    { enemies: [triangleLevel1, circleLevel1] },
    { enemies: [boxLevel2], wave: rectangleWave(boxTank) },
    { enemies: [boxLevel2, triangleLevel2, circleLevel1] },
    {
      enemies: [triangleLevel2, circleLevel1],
      boss: triangleBoss,
    },
    { enemies: [boxLevel2, triangleLevel2, circleLevel2] },
    {
      enemies: [circleLevel2, boxLevel3],
      wave: circleWave(circleTank),
    },
    { enemies: [boxLevel3, triangleLevel3] },
    { enemies: [boxLevel3, triangleLevel3] },
    { enemies: [boxLevel3, triangleLevel3, circleLevel3] },
    { enemies: [boxLevel3, triangleLevel3], boss: circleBoss },
    {
      enemies: [boxLevel3, triangleLevel3, circleLevel3],
      spawnRate: 0.1,
      wave: rectangleWave(triangleTank),
    },
    { enemies: [], boss: finalBoss },
  ];

  const finalBossAt = 600;
  const waveTime = finalBossAt / (spawnWaves.length - 1);

  // #endregion

  /**
   * @param {number} x
   * @param {number} y
   * @param {EnemyType} typ
   */
  const initializeEnemy = (x, y, typ) => ({
    x,
    y,
    typ,
    health: typ.health,
    damageTick: 0,
    pushBack: [0, 0],
    hitTick: 0,
    boss: !!typ.boss,
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

  // #region Rendering logic

  const bgBoxSize = 50;
  const bgBoxSize2 = bgBoxSize * 2;

  const renderBackground = () => {
    const startX = floor((player.x - w2) / bgBoxSize) * bgBoxSize;
    const startY = floor((player.y - h2) / bgBoxSize) * bgBoxSize;
    const endX = ceil((player.x + w2) / bgBoxSize) * bgBoxSize;
    const endY = ceil((player.y + h2) / bgBoxSize) * bgBoxSize;

    for (let x = startX; x < endX; x += bgBoxSize) {
      for (let y = startY; y < endY; y += bgBoxSize) {
        drawRect(
          x,
          y,
          bgBoxSize,
          bgBoxSize,
          (x % bgBoxSize2 === 0) === (y % bgBoxSize2 === 0) ? "#000" : "#111",
        );
      }
    }
  };

  const leveUpTimeout = 0.75;

  const renderPlayer = () => {
    if (player.levelUpTick > 0) {
      const d =
        player.levelUpTick > leveUpTimeout - 0.1
          ? (leveUpTimeout - player.levelUpTick) / 0.1
          : player.levelUpTick / (leveUpTimeout - 0.1);

      setGlobalAlpha(d * 0.5);
      const gradient = ctx.createRadialGradient(
        player.x,
        player.y,
        0,
        player.x,
        player.y,
        50,
      );
      gradient.addColorStop(0, "#ffff");
      gradient.addColorStop(1, "#fff0");
      drawBox(player.x, player.y, 100, gradient);
      setGlobalAlpha(1);
    }

    for (const weapon of player.weapons) {
      /** @ts-expect-error can't be bothered to fight the level type here */
      weapon.typ.render(weapon, weapon.typ.levels[weapon.lvl]);
    }

    player.typ.render(player.x, player.y);
  };

  const renderEnemies = () => {
    for (const enemy of enemies) {
      const type = enemy.typ;
      type.render(enemy.x, enemy.y, enemy.hitTick > 0 ? white : undefined);

      if (type.boss) {
        drawBar(
          enemy.x - 20,
          enemy.y + 15,
          40,
          3,
          "#333",
          enemy.health,
          type.health,
          "#f33",
        );
      }
    }
  };

  const renderPickups = () => {
    for (const pickup of pickups) {
      drawBox(
        pickup.x,
        pickup.y,
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
   * @param {Player} player
   * @param {boolean} [includePerLevel]
   */
  const getPlayerStats = (player, includePerLevel) => {
    const stats = entries(player.attrs).map(([key, value]) => [
      statLabel[key],
      (statFormat[key] ?? fNumber)(value.val),
    ]);

    const add = stats.push.bind(stats);

    if (includePerLevel) {
      add([]);

      add(
        ...entries(player.typ.attrsWithLevel).map(([key, value]) => [
          statLabel[key],
          fNumber(abs(value), 2) + "/level",
        ]),
      );

      add([]);
    }

    for (const weapon of player.weapons) {
      const name = weapon.typ.nam;

      add(
        [`${name} level`, weapon.lvl + 1],
        ...entries(weapon.typ.levels[weapon.lvl])
          .filter(([l]) => !!weaponStatToLabel[l])
          .map(([l, v]) => [
            `${name} ${weaponStatToLabel[l]}`,
            (weaponStatToFormatter[l] ?? fNumber)(v),
          ]),
      );
    }

    return stats;
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   */
  const renderPlayerStatsUi = (x, y, w) =>
    renderStatsTable(x, y, w, height - y - 40, getPlayerStats(player));

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   */
  const renderSurvivalStatsUi = (x, y, w) =>
    renderStatsTable(x, y, w, height - y - 40, [
      [`Survived`, formatTime(manager.gameRuntime)],
      [`Level`, player.lvl + 1],
      [`Damage`, fNumber(manager.damageDone)],
      [`DPS`, fNumber(manager.damageDone / manager.gameRuntime, 2)],
      [`Kills`, manager.kills],
    ]);

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {string} bgColor
   * @param {number} value
   * @param {number} maxValue
   * @param {string} fgColor
   * @param {boolean} [text]
   * @param {string} [textColor="#fff"]
   */
  const drawBar = (
    x,
    y,
    width,
    height,
    bgColor,
    value,
    maxValue,
    fgColor,
    text,
    textColor = white,
  ) => {
    drawRect(x, y, width, height, bgColor);
    drawRect(x, y, (value / maxValue) * width, height, fgColor);
    text &&
      drawText(
        x + 2,
        y + height / 2,
        floor(value) + "/" + floor(maxValue),
        textColor,
        left,
        middle,
      );
  };

  const renderIngameUI = () => {
    drawBar(
      50,
      0,
      width - 50,
      20,
      "#600",
      player.health,
      player.attrs.health.val,
      "#f66",
      true,
    );

    drawBar(
      50,
      20,
      width - 50,
      12,
      darkGray,
      player.experience,
      player.nextLevelExperience,
      white,
      true,
      "#000",
    );

    drawRect(0, 0, 50, 32, "#000");
    drawText(25, 2, "level", "#666", center, top);
    drawText(25, 18, `${player.lvl + 1}`, white, center, top);

    drawText(w2, 35, formatTime(manager.gameRuntime), white, center);

    if (manager.gameRuntime < 20) {
      help().map(
        (text, i) =>
          text &&
          drawText(
            10,
            height - 30 - (help().length - i) * 15,
            text,
            white,
            left,
            top,
          ),
      );
    }

    if (input.touching) {
      drawCircle(
        input.touchStartX,
        input.touchStartY,
        touchInputRadius,
        "#3335",
      );

      const touchDx = input.touchX - input.touchStartX;
      const touchDy = input.touchY - input.touchStartY;
      const touchD = hypot(touchDx, touchDy);
      const adjustedTouchD = min(touchInputRadius, touchD);

      drawCircle(
        input.touchStartX + (touchDx / touchD) * adjustedTouchD,
        input.touchStartY + (touchDy / touchD) * adjustedTouchD,
        10,
        "#666",
      );
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
   */
  const renderSelectable = (x, y, itemWidth, itemHeight, renderItem, items) => {
    items.map((item, i) => {
      drawRect(
        x,
        y,
        itemWidth,
        itemHeight,
        i === manager.selIndex ? "#333" : "#222",
      );

      drawRect(
        x,
        y,
        itemWidth,
        itemHeight,
        i === manager.selIndex ? "#aa3" : "#444",
        true,
      );

      renderItem(x, y, item);

      y += itemHeight + 5;
    });

    return y;
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} itemWidth
   * @param {number} itemHeight
   */
  const processTouchSelectable = (x, y, itemWidth, itemHeight) => {
    if (
      justPressedInput.touching &&
      input.touchX >= x &&
      input.touchX <= x + itemWidth
    ) {
      const index = floor((input.touchStartY - y) / (itemHeight + 5));
      if (index >= 0 && index <= manager.selLength) {
        manager.selIndex = index;
      }
    }
  };

  /**
   * @param {Upgrade} upgrade
   */
  const upgradeCount = (upgrade) =>
    player.upgrades.filter((u) => u === upgrade).length;

  const uiScreens = {
    [MANAGER_STATES.DEAD]() {
      drawText(w2, 100, "YOU'RE DEAD!", "#f88", center, top, 24);

      const y = renderSurvivalStatsUi(50, 145, width - 100);
      drawText(w2, y + 75, pressEnterToRestart, white, center);
    },
    [MANAGER_STATES.PAUSED]() {
      drawTitleText(40, "PAUSED");
      renderPlayerStatsUi(20, 80, width - 40);
    },
    [MANAGER_STATES.PICKING_PLAYER]() {
      drawTitleText(10, "PICK CLASS");

      renderSelectable(
        20,
        50,
        100,
        20,
        (x, y, type) => {
          type.render(x + 10, y + 10);
          drawText(x + 20, y + 10, type.nam, white, left, middle);
        },
        playerTypes,
      );

      renderStatsTable(
        140,
        30,
        width - 140 - 20,
        height - 60,
        getPlayerStats(player, true),
        false,
      );

      if (usesTouch) {
        drawRect(20, height - 80, 100, 30, "#333");
        drawText(70, height - 65, "START", white, center, middle);
      }
    },
    [MANAGER_STATES.PICKING_UPGRADE]() {
      drawTitleText(10, "LEVEL UP");

      renderSelectable(
        20,
        50,
        width - 40,
        40,
        (x, y, upgrade) => {
          drawText(x + 5, y + 5, upgrade.nam, white);
          drawText(
            x + 5,
            y + 22,
            typeof upgrade.desc === "string" ? upgrade.desc : upgrade.desc(),
            lightGray,
          );

          drawText(
            x + width - 50,
            y + 20,
            upgradeCount(upgrade) + "/" + (upgrade.maxCount ?? 5),
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
      drawText(w2, h2 - 40, "MICRO", white, center, "bottom", 68);
      drawText(w2, h2 - 40, "SURVIVORS", white, center, top, 38);
      drawText(
        w2,
        height - 5,
        "by SkaceKamen",
        lightGray,
        center,
        "bottom",
        10,
      );

      setGlobalAlpha(0.75 + cos((Date.now() / 1000) * 5) * 0.25);
      drawText(w2, h2 + 50, pressEnterToStart, white, center);
      setGlobalAlpha(1);
    },
    [MANAGER_STATES.WON]() {
      drawText(w2, 100, "YOU WON", white, center, middle);

      drawText(
        w2,
        renderSurvivalStatsUi(70, 130, width - 140) + 30,
        pressEnterToRestart,
        white,
        center,
      );
    },
  };

  const renderUI = () => {
    if (
      manager.gameState !== MANAGER_STATES.START &&
      manager.gameState !== MANAGER_STATES.PICKING_PLAYER
    ) {
      renderIngameUI();
    }

    const screen = uiScreens[manager.gameState];

    if (screen) {
      drawOverlay();
      screen();
    }
  };

  const renderOverlays = () => {
    const d = min(1, player.lastDamagedTick / 0.5);

    if (d > 0) {
      const damageOverlayGradient = screenGradient(
        80,
        "#f000",
        `rgba(255,0,0,${d})`,
      );

      drawOverlay(damageOverlayGradient);
    }

    const p = min(1, player.lastPickupTick / 0.1);
    if (p > 0) {
      const pickupOverlayGradient = screenGradient(
        130,
        "#fff0",
        `rgba(255,255,255,${p * 0.15})`,
      );

      drawOverlay(pickupOverlayGradient);
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

  // #endregion

  // #region Game logic

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
   *
   * @param {number} x
   * @param {number} y
   * @param {number} [health]
   * @param {number} [experience]
   * @returns
   */
  const addPickup = (x, y, health, experience) =>
    pickups.push({
      x,
      y,
      experience,
      health,
    });

  /**
   * @param {number} deltaTime
   */
  const enemiesTick = (deltaTime) => {
    let index = 0;
    let enemiesToRemove = [];

    for (const enemy of enemies) {
      const type = enemy.typ;

      if (enemy.health <= 0) {
        addPickup(enemy.x, enemy.y, 0, type.experience);

        if (random() < player.attrs.healthDrop.val) {
          addPickup(enemy.x, enemy.y, 5);
        }

        manager.kills += 1;

        enemiesToRemove.push(index);
        index++;
        continue;
      }

      enemy.hitTick -= deltaTime;

      let velocityX = enemy.pushBack[0] * deltaTime;
      let velocityY = enemy.pushBack[1] * deltaTime;

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
        if (distance < 5 + (enemy.typ.radius ?? 5) - 1) {
          player.health -= max(0, type.damage - player.attrs.armor.val);
          player.lastDamagedTick = 0.5;
          enemy.damageTick = 1;
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
      enemy.pushBack = enemy.pushBack.map((value) => {
        let diff = -sign(value) * deltaTime * (type.pushBackResistance ?? 20);
        return abs(diff) > abs(value) ? 0 : value + diff;
      });

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
    assign(manager, startingManagerState);

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

  let spawnTick = 0;

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
        const spawnRate = spawnWaves[spawnRateIndex];

        if (manager.gameRuntime > finalBossAt && enemies.length === 0) {
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

          const rate = spawnRate.spawnRate ?? 0.205;
          if (spawnRate.enemies.length > 0 && manager.spawnTimeout > rate) {
            spawnEnemy(
              spawnRate.enemies[spawnTick++ % spawnRate.enemies.length],
            );

            manager.spawnTimeout -= rate;
          }

          manager.spawnTimeout += deltaTime;
        }

        break;
      }

      case MANAGER_STATES.WON:
      case MANAGER_STATES.DEAD:
      case MANAGER_STATES.START:
        if (input.e || justPressedInput.touching) {
          manager.selIndex = 0;
          manager.selLength = playerTypes.length - 1;
          assignPlayer(playerTypes[0]);
          manager.gameState = MANAGER_STATES.PICKING_PLAYER;

          zzfx(...audio.interactionClick);
        }

        break;

      case MANAGER_STATES.PICKING_PLAYER:
        processTouchSelectable(20, 50, 100, 20);
        managerSelectionTick();
        const type = playerTypes[manager.selIndex];

        if (player.typ !== type) {
          assignPlayer(type);
        }

        if (justPressedInput.e) {
          startNewGame(playerTypes[manager.selIndex]);
          zzfx(...audio.interactionClick);
        }

        if (justPressedInput.touching) {
          if (
            input.touchStartX >= 20 &&
            input.touchStartX <= 120 &&
            input.touchStartY > height - 80 &&
            input.touchStartY < height - 50
          ) {
            startNewGame(playerTypes[manager.selIndex]);
          }
        }

        break;

      case MANAGER_STATES.PICKING_UPGRADE:
        processTouchSelectable(20, 50, width - 40, 40);
        managerSelectionTick();

        if (justPressedInput.e || justPressedInput.touching) {
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

    let speed = player.attrs.spd.val * deltaTime;

    if (input.touching) {
      const touchDx = input.touchX - input.touchStartX;
      const touchDy = input.touchY - input.touchStartY;
      const touchD = hypot(touchDx, touchDy);
      moveX = touchDx;
      moveY = touchDy;
      speed = (min(touchInputRadius, touchD) / touchInputRadius) * speed;
    }

    const moveD = hypot(moveX, moveY);

    if (moveD > 0) {
      player.x += (moveX / moveD) * speed;
      player.y += (moveY / moveD) * speed;
    }

    if (usesTouch) {
      const closestEnemy = enemies.reduce(
        /**
         * @param {{distance: number, enemy: Enemy | null}} closest
         * @param {Enemy} enemy
         */
        (closest, enemy) => {
          const distance = hypot(player.x - enemy.x, player.y - enemy.y);
          return distance < closest.distance ? { distance, enemy } : closest;
        },
        { distance: Infinity, enemy: null },
      );

      if (closestEnemy.enemy) {
        player.meleeDirection = atan2(
          closestEnemy.enemy.y - player.y,
          closestEnemy.enemy.x - player.x,
        );
      }
    } else {
      player.meleeDirection = atan2(input.aimAtY - w2, input.aimAtX - h2);
    }

    if (player.experience >= player.nextLevelExperience) {
      player.lvl += 1;
      player.experience -= player.nextLevelExperience;
      player.nextLevelExperience += 10;
      player.levelUpTick = leveUpTimeout;
      player.levelUpCount++;

      eachEnemy(75, (enemy, angle) => hitEnemy(enemy, 0, angle, 40));

      zzfx(...audio.levelUp);

      player.health += 5;
    }

    if (player.levelUpTick > 0) {
      player.levelUpTick -= deltaTime;

      if (player.levelUpTick <= 0) {
        const availableUpgrades = upgrades.filter(
          (upgrade) => upgradeCount(upgrade) < (upgrade.maxCount ?? 5),
        );

        manager.upgrades = weightedPickItems(
          availableUpgrades,
          3,
          (u) => u.wght?.() ?? baseWeight,
        );

        if (manager.upgrades.length > 0) {
          manager.gameState = MANAGER_STATES.PICKING_UPGRADE;
          manager.selIndex = 0;
          manager.selLength = manager.upgrades.length - 1;
        }

        player.levelUpCount--;

        if (player.levelUpCount > 0) {
          player.levelUpTick = leveUpTimeout * 0.5;
        }
      }
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

  // #endregion

  // #region Game loop handler

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

  // #endregion

  target.appendChild(canvas);
  requestAnimationFrame(animationFrameTick);

  return [canvas, player, manager, setScale];
}
