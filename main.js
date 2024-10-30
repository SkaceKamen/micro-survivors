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

const createPlayer = () => ({
  x: 0,
  y: 0,
  level: 0,
  experience: 0,
  nextLevelExperience: 50,
  health: 100,
  maxHealth: 100,
  speed: 25,
  coneAngle: Math.PI / 4,
  coneDistance: 80,
  coneDirection: 0,
  coneDamage: 8,
  coneTick: 0,
  coneTimeout: 0.5,
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
  const coneD = 0.2 + (player.coneTick - player.coneTimeout);
  if (coneD > 0) {
    const coneA2 = player.coneAngle / 2;

    ctx.fillStyle = `rgba(255, 255, 255, ${coneD})`;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
      player.x + Math.cos(player.coneDirection - coneA2) * player.coneDistance,
      player.y + Math.sin(player.coneDirection - coneA2) * player.coneDistance
    );

    ctx.arc(
      player.x,
      player.y,
      player.coneDistance,
      player.coneDirection - coneA2,
      player.coneDirection + coneA2
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
  ctx.fillStyle = "#600";
  ctx.fillRect(0, 0, width, 20);
  ctx.fillStyle = "#f66";
  ctx.fillRect(0, 0, (player.health / player.maxHealth) * width, 20);
  ctx.fillStyle = "#fff";
  ctx.fillText(`${player.health} / ${player.maxHealth}`, 2, 10);

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

function render() {
  ctx.reset();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(-player.x + width / 2, -player.y + height / 2);

  renderPlayer();
  renderEnemies();
  renderPickups();

  ctx.resetTransform();
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

      if (manager.spawnTimeout > 2) {
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

  const speed = player.speed * deltaTime;
  const moveD = Math.sqrt(moveX * moveX + moveY * moveY);

  if (moveD > 0) {
    player.x += (moveX / moveD) * speed;
    player.y += (moveY / moveD) * speed;
  }

  const playerAbsoluteX = width / 2;
  const playerAbsoluteY = height / 2;

  player.coneDirection = Math.atan2(
    input.targetY - playerAbsoluteY,
    input.targetX - playerAbsoluteX
  );

  if (player.coneTick > 0) {
    player.coneTick -= deltaTime;
  } else {
    applyPlayerConeAttack(deltaTime);
    player.coneTick = player.coneTimeout;
  }

  if (player.experience > player.nextLevelExperience) {
    player.level += 1;
    player.experience -= player.nextLevelExperience;
    player.nextLevelExperience += 50;
    player.maxHealth += 10;
    player.health += 5;
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
    } else if (distance < 50) {
      const speed = (60 - distance) * deltaTime;
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
  const coneStart = player.coneDirection - player.coneAngle / 2;
  const coneEnd = player.coneDirection + player.coneAngle / 2;

  for (const enemy of enemies) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;

    if (
      Math.abs(dx) > player.coneDistance ||
      Math.abs(dy) > player.coneDistance
    ) {
      continue;
    }

    const angle = Math.atan2(dy, dx);

    if (angle > coneStart && angle < coneEnd) {
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < player.coneDistance) {
        enemy.health -= player.coneDamage;
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
