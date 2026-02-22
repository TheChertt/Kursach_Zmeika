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
const foodColor = "OrangeRed";

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

const skins = [
    { id: "default", name: "Бирюзовый", color: "cyan", price: 0 },
    { id: "green", name: "Зелёный", color: "green", price: 25 },
    { id: "SpringGreen", name: "Мятно-зелёный", color: "SpringGreen", price: 50 },
    { id: "purple", name: "Фиолетовый", color: "purple", price: 25 },
    { id: "Indigo", name: "Индиго", color: "Indigo", price: 50 },
    { id: "blue", name: "Синий", color: "blue", price: 25 },
    { id: "Navy", name: "Морской", color: "Navy", price: 50 },
    { id: "White", name: "Белый", color: "White", price: 75 },
    { id: "Black", name: "Черный", color: "Black", price: 75 },
    { id: "Magenta", name: "Магента", color: "Magenta", price: 100 },
    { id: "gold", name: "Золотой", color: "gold", price: 150 },
];

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

function drawSnake(alpha) {
    const color = getCurrentSnakeColor();

    for (let i = 0; i < snake.length; i++) {
        const newPos = snake[i];
        const oldPos = prevSnake[i] || newPos;

        let dx = newPos.x - oldPos.x;
        let dy = newPos.y - oldPos.y;

        const teleported =
            Math.abs(dx) > cellSize || Math.abs(dy) > cellSize;

        let x, y;

        if (teleported) {
            x = newPos.x;
            y = newPos.y;
        } else {
            x = oldPos.x + dx * alpha;
            y = oldPos.y + dy * alpha;
        }

        context.fillStyle = color;
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
