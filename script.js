const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const tileSize = 5; // Reduced tile size to fit the 80x80 dungeon
const tilesX = 80;
const tilesY = 80;
canvas.width = tilesX * tileSize;
canvas.height = tilesY * tileSize;

let player = {
  x: 0,
  y: 0,
  hp: 100,
  maxHp: 100,
  xp: 0,
  level: 1,
  potions: 0,
  damageMin: 2,
  damageMax: 12,
  dodge: 0,
};
let currentEnemy = null;
let steps = 0;
let attackMade = false;

const enemyAttributes = {
  MiniGob: { xp: 5, hp: 15, damageMin: 1, damageMax: 6 },
  WizardKid: { xp: 10, hp: 15, damageMin: 2, damageMax: 8 },
  Rat: { xp: 3, hp: 5, damageMin: 1, damageMax: 4 },
  Mongrol: { xp: 15, hp: 12, damageMin: 3, damageMax: 9 },
  Mongol: { xp: 20, hp: 34, damageMin: 4, damageMax: 9 },
  "Lil' Tommy": { xp: 25, hp: 16, damageMin: 5, damageMax: 12 },
};

const enemiesList = Object.keys(enemyAttributes);
let dungeonMap = [];
let entranceX, entranceY;

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
}

function drawWall(x, y) {
  ctx.fillStyle = "black";
  ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
}

function drawPlayer() {
  drawTile(player.x, player.y, "blue");
}

function generateDungeon() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dungeonMap = Array.from({ length: tilesX }, () => Array(tilesY).fill("wall"));
  generateMaze(player.x, player.y);
  placeEntrance();
  drawDungeon();
}

function drawDungeon() {
  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      if (dungeonMap[x][y] === "floor") {
        drawTile(x, y, "grey");
      } else {
        drawWall(x, y);
      }
    }
  }
  drawTile(entranceX, entranceY, "yellow"); // Entrance to the next floor
}

function generateMaze(cx, cy) {
  const directions = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  shuffleArray(directions);

  dungeonMap[cx][cy] = "floor";

  for (const [dx, dy] of directions) {
    const nx = cx + dx * 2;
    const ny = cy + dy * 2;
    if (
      nx >= 0 &&
      nx < tilesX &&
      ny >= 0 &&
      ny < tilesY &&
      dungeonMap[nx][ny] === "wall"
    ) {
      dungeonMap[cx + dx][cy + dy] = "floor";
      dungeonMap[nx][ny] = "floor";
      generateMaze(nx, ny);
    }
  }
}

function placeEntrance() {
  let placed = false;
  while (!placed) {
    entranceX = Math.floor(Math.random() * tilesX);
    entranceY = Math.floor(Math.random() * tilesY);
    if (dungeonMap[entranceX][entranceY] === "floor") {
      placed = true;
    }
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function updateGameInfo() {
  document.getElementById("current-hp").innerText = player.hp;
  document.getElementById("max-hp").innerText = player.maxHp;
  document.getElementById("current-xp").innerText = player.xp;
  document.getElementById("needed-xp").innerText = player.level * 50;
  document.getElementById("current-level").innerText = player.level;
  document.getElementById("current-potions").innerText = player.potions;
  document.getElementById(
    "attack-range"
  ).innerText = `${player.damageMin}-${player.damageMax}`;
  document.getElementById("dodge-chance").innerText = `${player.dodge}%`;

  // Update HP bar
  const hpBar = document.getElementById("hp-bar");
  const hpPercent = (player.hp / player.maxHp) * 100;
  hpBar.style.width = `${hpPercent}%`;
}

function updateEnemyInfo() {
  if (currentEnemy) {
    document.getElementById("enemy-name").innerText = currentEnemy.name;
    document.getElementById("enemy-hp").innerText = currentEnemy.hp;
  } else {
    document.getElementById("enemy-name").innerText = "None";
    document.getElementById("enemy-hp").innerText = "N/A";
  }
}

function addCombatLog(message) {
  const log = document.getElementById("log");
  const entry = document.createElement("li");
  entry.textContent = message;

  if (attackMade) {
    entry.classList.add("new-attack-entry");
  } else {
    entry.classList.add("new-entry");
  }
  log.insertBefore(entry, log.firstChild); // Insert new entry at the top

  // Remove 'new-entry' and 'new-attack-entry' class from previous entries
  const entries = Array.from(log.children);
  for (let i = 1; i < entries.length; i++) {
    entries[i].classList.remove("new-entry");
    entries[i].classList.remove("new-attack-entry");
  }

  attackMade = false;
}

function movePlayer(dx, dy) {
  if (currentEnemy) return;
  let newX = player.x + dx;
  let newY = player.y + dy;
  if (
    newX >= 0 &&
    newX < tilesX &&
    newY >= 0 &&
    newY < tilesY &&
    dungeonMap[newX][newY] === "floor"
  ) {
    player.x = newX;
    player.y = newY;
    steps++;
    if (newX === entranceX && newY === entranceY) {
      alert("You found the entrance to the next floor!");
      // Handle moving to the next floor
      // For simplicity, just reset the player's position and generate a new dungeon
      player.x = 0;
      player.y = 0;
      generateDungeon();
      drawPlayer();
      return;
    }
    checkEncounter();
    drawDungeon();
    drawPlayer();
    updateGameInfo();
  }
}

function checkEncounter() {
  if (steps >= 7 && steps <= 12) {
    let encounterChance = Math.random();
    if (encounterChance < 0.5) {
      encounterEnemy();
    } else {
      findPotion();
    }
    steps = 0;
  }
}

function encounterEnemy() {
  const enemyType = enemiesList[Math.floor(Math.random() * enemiesList.length)];
  const attributes = enemyAttributes[enemyType];
  currentEnemy = {
    name: enemyType,
    hp: attributes.hp,
    damageMin: attributes.damageMin,
    damageMax: attributes.damageMax,
    xp: attributes.xp,
  };
  updateEnemyInfo();
  addCombatLog(
    `Encountered a ${currentEnemy.name} with ${currentEnemy.hp} HP!`
  );
}

function findPotion() {
  player.potions++;
  addCombatLog("You found a potion!");
  updateGameInfo();
}

function usePotion() {
  if (player.potions > 0) {
    player.hp = Math.min(player.maxHp, player.hp + 20);
    player.potions--;
    updateGameInfo();
    addCombatLog("Used a potion and restored 20 HP.");
  } else {
    alert("No potions left!");
  }
}

function attackEnemy() {
  if (!currentEnemy) return;
  let playerDamage =
    Math.floor(Math.random() * (player.damageMax - player.damageMin + 1)) +
    player.damageMin;
  currentEnemy.hp -= playerDamage;
  addCombatLog(`You dealt ${playerDamage} damage to the ${currentEnemy.name}.`);
  attackMade = true;

  if (currentEnemy.hp <= 0) {
    player.xp += currentEnemy.xp;
    addCombatLog(
      `You defeated the ${currentEnemy.name} and gained ${currentEnemy.xp} XP.`
    );
    if (Math.random() < 0.1) {
      if (Math.random() < 0.5) {
        player.potions++;
        addCombatLog("The enemy dropped a potion!");
      } else {
        player.xp += 10;
        addCombatLog(
          "The enemy dropped an experience potion and you gained 10 XP."
        );
      }
    }
    levelUpCheck();
    currentEnemy = null;
    updateEnemyInfo();
    return;
  }

  // Calculate enemy damage and check for dodge
  let enemyDamage =
    Math.floor(
      Math.random() * (currentEnemy.damageMax - currentEnemy.damageMin + 1)
    ) + currentEnemy.damageMin;
  let dodgeChance = Math.random() * 100;
  if (dodgeChance < player.dodge) {
    addCombatLog(`You dodged the ${currentEnemy.name}'s attack!`);
  } else {
    player.hp -= enemyDamage;
    addCombatLog(`The ${currentEnemy.name} dealt ${enemyDamage} damage to you.`);
  }

  if (player.hp <= 0) {
    alert("Game Over!");
    resetGame();
  }

  updateGameInfo();
  updateEnemyInfo();
}

function levelUpCheck() {
  const requiredXp = player.level * 50;
  if (player.xp >= requiredXp) {
    player.level++;
    player.xp -= requiredXp; // Remove the XP required for the level up
    let points = 2;
    while (points > 0) {
      let choice = prompt(
        `You leveled up! You have ${points} points to spend. Choose to increase HP, DMG, or DOG.`
      );
      if (choice.toLowerCase() === "hp") {
        player.maxHp += 5;
        player.hp += 5; // Increase current HP as well
        points--;
      } else if (choice.toLowerCase() === "dmg") {
        player.damageMin++;
        player.damageMax++;
        points--;
      } else if (choice.toLowerCase() === "dog") {
        player.dodge += 5;
        points--;
      } else {
        alert("Invalid choice");
      }
    }
    updateGameInfo();
    levelUpCheck(); // Check again in case the player has enough XP to level up again
  }
}

function resetGame() {
  player = {
    x: 0,
    y: 0,
    hp: 100,
    maxHp: 100,
    xp: 0,
    level: 1,
    potions: 0,
    damageMin: 2,
    damageMax: 12,
    dodge: 0,
  };
  currentEnemy = null;
  steps = 0;
  generateDungeon();
  drawPlayer();
  updateGameInfo();
  updateEnemyInfo();
  document.getElementById("log").innerHTML = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "w") movePlayer(0, -1);
  if (e.key === "s") movePlayer(0, 1);
  if (e.key === "a") movePlayer(-1, 0);
  if (e.key === "d") movePlayer(1, 0);
  if (e.key === "p") usePotion();
  if (e.key === " ") attackEnemy();
});

generateDungeon();
drawPlayer();
updateGameInfo();
updateEnemyInfo();
