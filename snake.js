const gameField = document.getElementById("gameField");
const scoreInfo = document.getElementById("score");
const restartButton = document.getElementById("restart");

const mainMenu = document.getElementById("mainMenu");
const playBtn = document.getElementById("playBtn");
const shopBtn = document.getElementById("shopBtn");

const shopOverlay = document.getElementById("shop");
const backToMenu = document.getElementById("backToMenu");
const coinsElem = document.getElementById("coins");
const skinsList = document.getElementById("skinsList");

const context = gameField.getContext("2d");

const boardColor = "ForestGreen";
const foodColor = "Yellow";

const boardWidth = gameField.width;
const boardHeight = gameField.height;
const cellSize = 30;

const SNAKE_SPEED = 180;
const STEP_TIME = cellSize / SNAKE_SPEED;

let lastTime = 0;
let accumulator = 0;

const initialSnake = [
    { x: cellSize * 2, y: 0 },
    { x: cellSize, y: 0 },
    { x: 0, y: 0 },
];

let snake = JSON.parse(JSON.stringify(initialSnake));
let snakeHead = { x: snake[0].x, y: snake[0].y };

let prevSnake = []; 

const food = { x: 0, y: 0 };
const velocity = { x: cellSize, y: 0 };
let nextVelocity = { x: cellSize, y: 0 };

let score = 0;
let directionChanged = false;
let gameRunning = false;

const SKINS_KEY = "zmeika_skins";
const COINS_KEY = "zmeika_coins";
const EQUIPPED_KEY = "zmeika_equipped";

let skins = [];

fetch("skins.json")
    .then(r => r.json())
    .then(data => skins = data);


let ownedSkins = {};
let coins = 0;
let equippedSkin = "default";

function loadShopState() {
    const savedOwned = localStorage.getItem(SKINS_KEY);
    const savedCoins = localStorage.getItem(COINS_KEY);
    const savedEquipped = localStorage.getItem(EQUIPPED_KEY);

    ownedSkins = savedOwned ? JSON.parse(savedOwned) : { default: true };
    coins = savedCoins ? parseInt(savedCoins) : 0;
    equippedSkin = savedEquipped || "default";

    updateCoinsUI();
}

function saveShopState() {
    localStorage.setItem(SKINS_KEY, JSON.stringify(ownedSkins));
    localStorage.setItem(COINS_KEY, coins);
    localStorage.setItem(EQUIPPED_KEY, equippedSkin);
}

function updateCoinsUI() {
    coinsElem.textContent = coins;
}

function getCurrentSnakeColor() {
    return skins.find(s => s.id === equippedSkin).color;
}

function drawBoard() {
    context.fillStyle = boardColor;
    context.fillRect(0, 0, boardWidth, boardHeight);
}

let snakeTexture = null;

function loadSkinAssets() {
    const skin = skins.find(s => s.id === equippedSkin);

    if (skin.type === "texture" || skin.texture) {
        snakeTexture = new Image();
        snakeTexture.src = skin.texture;
    } else {
        snakeTexture = null;
    }
}

function drawSnake(alpha) {
    const skin = skins.find(s => s.id === equippedSkin);

    for (let i = 0; i < snake.length; i++) {
        const newPos = snake[i];
        const oldPos = prevSnake[i] || newPos;

        let dx = newPos.x - oldPos.x;
        let dy = newPos.y - oldPos.y;

        const teleported = Math.abs(dx) > cellSize || Math.abs(dy) > cellSize;

        let x = teleported ? newPos.x : oldPos.x + dx * alpha;
        let y = teleported ? newPos.y : oldPos.y + dy * alpha;

       if (skin.type === "texture" && snakeTexture) {
    let dirX = 0, dirY = 0;

    if (i === 0) {
        dirX = velocity.x;
        dirY = velocity.y;
    } else {
        dirX = snake[i - 1].x - newPos.x;
        dirY = snake[i - 1].y - newPos.y;
    }

    let angle = 0;
    if (dirX > 0) angle = 0;            
    else if (dirX < 0) angle = Math.PI; 
    else if (dirY > 0) angle = Math.PI / 2; 
    else if (dirY < 0) angle = -Math.PI / 2; 

    context.save();
    context.translate(x + cellSize / 2, y + cellSize / 2);
    context.rotate(angle);

    context.drawImage(
        snakeTexture,
        -cellSize / 2,
        -cellSize / 2,
        cellSize,
        cellSize
    );

    context.restore();
    continue;
}

        if (skin.type === "shape") {
            context.fillStyle = skin.color;

             {

                context.beginPath();
                for (let a = 0; a < 6; a++) {
                    const angle = Math.PI / 3 * a;
                    const px = cx + r * Math.cos(angle);
                    const py = cy + r * Math.sin(angle);
                    if (a === 0) context.moveTo(px, py);
                    else context.lineTo(px, py);
                }
                context.closePath();
                context.fill();
                continue;
            }
        }

     if (skin.type === "animated") {
        
    if (skin.effect === "rgbCycle") {
        const t = performance.now() / 500;

        const r = Math.floor((Math.sin(t) + 1) * 127);
        const g = Math.floor((Math.sin(t + 2) + 1) * 127);
        const b = Math.floor((Math.sin(t + 4) + 1) * 127);

        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
    } else if (skin.effect === "pulse") {
        const t = performance.now() / 200;
        const pulse = Math.sin(t) * 40 + 215;
        context.fillStyle = `rgb(${pulse}, ${pulse}, 255)`;
    } else {
        context.fillStyle = skin.color;
    }
}
 else {
            context.fillStyle = skin.color;
        }

        context.fillRect(x, y, cellSize, cellSize);
    }
}


function drawFood() {
    context.fillStyle = foodColor;
    context.fillRect(food.x, food.y, cellSize, cellSize);
}

function getRandomCoords() {
    return Math.floor(Math.random() * (boardWidth / cellSize)) * cellSize;
}

function placeFood() {
    let x, y, collision;
    do {
        x = getRandomCoords();
        y = getRandomCoords();
        collision = snake.some(p => p.x === x && p.y === y);
    } while (collision);

    food.x = x;
    food.y = y;
}

function updateScore(newScore) {
    score = newScore;
    scoreInfo.textContent = score;
}

function checkIfEat() {
    return snake[0].x === food.x && snake[0].y === food.y;
}

function applyNextDirection() {
    velocity.x = nextVelocity.x;
    velocity.y = nextVelocity.y;
}

function moveOneCell() {
    prevSnake = snake.map(p => ({ x: p.x, y: p.y })); 

    applyNextDirection();

    const newHead = {
        x: snake[0].x + velocity.x,
        y: snake[0].y + velocity.y
    };

    if (newHead.x < 0) newHead.x = boardWidth - cellSize;
    else if (newHead.x >= boardWidth) newHead.x = 0;

    if (newHead.y < 0) newHead.y = boardHeight - cellSize;
    else if (newHead.y >= boardHeight) newHead.y = 0;

    snake.unshift(newHead);

    if (checkIfEat()) {
        updateScore(score + 1);
        placeFood();
    } else {
        snake.pop();
    }

    directionChanged = false;

    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
            finishGame();
            return;
        }
    }
}

function changeDirection(ev) {
    if (directionChanged) return;

    const key = ev.key;

    const isRight = velocity.x > 0;
    const isLeft = velocity.x < 0;
    const isUp = velocity.y < 0;
    const isDown = velocity.y > 0;

    if (key === "ArrowRight" && !isLeft) {
        nextVelocity = { x: cellSize, y: 0 };
        directionChanged = true;
    } else if (key === "ArrowLeft" && !isRight) {
        nextVelocity = { x: -cellSize, y: 0 };
        directionChanged = true;
    } else if (key === "ArrowUp" && !isDown) {
        nextVelocity = { x: 0, y: -cellSize };
        directionChanged = true;
    } else if (key === "ArrowDown" && !isUp) {
        nextVelocity = { x: 0, y: cellSize };
        directionChanged = true;
    }
}

function gameLoop(timestamp) {
    if (!gameRunning) return;

    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    accumulator += delta;

    while (accumulator >= STEP_TIME) {
        moveOneCell();
        accumulator -= STEP_TIME;
    }

    const alpha = accumulator / STEP_TIME;

    drawBoard();
    drawFood();
    drawSnake(alpha);

    requestAnimationFrame(gameLoop);
}

function finishGame() {
    gameRunning = false;

    coins += score;
    saveShopState();
    updateCoinsUI();

    context.fillStyle = "red";
    context.font = "40px cursive";
    context.fillText("Game Over!", 200, 260);

    setTimeout(showMainMenu, 1200);
}

function startGame() {
    snake = JSON.parse(JSON.stringify(initialSnake));
    loadSkinAssets();
    snakeHead = { x: snake[0].x, y: snake[0].y };

    prevSnake = snake.map(p => ({ x: p.x, y: p.y }));

    velocity.x = cellSize;
    velocity.y = 0;
    nextVelocity = { ...velocity };

    updateScore(0);
    placeFood();

    directionChanged = false;
    accumulator = 0;
    lastTime = performance.now();

    gameRunning = true;

    window.addEventListener("keydown", changeDirection);

    requestAnimationFrame(gameLoop);
}

function restartGame() {
    gameRunning = false;
    startGame();
}

function showMainMenu() {
    mainMenu.classList.remove("hidden");
    shopOverlay.classList.add("hidden");
    restartButton.style.display = "none";
}

function hideMainMenu() {
    mainMenu.classList.add("hidden");
}

function showShop() {
    populateShop();
    shopOverlay.classList.remove("hidden");
    mainMenu.classList.add("hidden");
}

function hideShop() {
    shopOverlay.classList.add("hidden");
}

playBtn.addEventListener("click", () => {
    hideMainMenu();
    startGame();
});

shopBtn.addEventListener("click", showShop);
backToMenu.addEventListener("click", () => {
    hideShop();
    showMainMenu();
});

function populateShop() {
    skinsList.innerHTML = "";
    updateCoinsUI();

    skins.forEach(skin => {
        const card = document.createElement("div");
        card.className = "skinCard";

        const preview = document.createElement("div");
        preview.className = "skinPreview";
        preview.style.background = skin.color;

        const name = document.createElement("div");
        name.className = "skinName";
        name.textContent = skin.name;

        const price = document.createElement("div");
        price.className = "skinPrice";
        price.textContent = skin.price ? `${skin.price} очков` : "Бесплатно";

        const btn = document.createElement("button");
        btn.className = "skinBtn";

        const owned = ownedSkins[skin.id];
        const equipped = equippedSkin === skin.id;

        if (equipped) {
            btn.textContent = "Экипировано";
            btn.classList.add("equipped");
        } else if (owned) {
            btn.textContent = "Экипировать";
            btn.classList.add("owned");
        } else {
            btn.textContent = `Купить (${skin.price})`;
        }

        btn.addEventListener("click", () => {
            if (owned) {
                equippedSkin = skin.id;
                saveShopState();
                loadSkinAssets();
                populateShop();
            } else {
                if (coins >= skin.price) {
                    coins -= skin.price;
                    ownedSkins[skin.id] = true;
                    equippedSkin = skin.id;
                    saveShopState();
                    populateShop();
                } else {
                    alert("Недостаточно монет");
                }
            }
        });

        card.append(preview, name, price, btn);
        skinsList.appendChild(card);
    });
}

window.addEventListener("load", () => {
    loadShopState();
    showMainMenu();
});
