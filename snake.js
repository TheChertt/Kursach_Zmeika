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

const boardColor = "black";
const foodColor = "crimson";

const boardWidth = gameField.width;
const boardHeight = gameField.height;
const cellSize = 30;

const initialSnake = [
    { x: cellSize * 2, y: 0 },
    { x: cellSize, y: 0 },
    { x: 0, y: 0 },
];

let snake = JSON.parse(JSON.stringify(initialSnake));
let snakeHead = { x: snake[0].x, y: snake[0].y };
const food = { x: 0, y: 0 };
const velocity = { x: cellSize, y: 0 };

let score = 0;
let interval = null;

const SKINS_KEY = "zmeika_skins";
const COINS_KEY = "zmeika_coins";
const EQUIPPED_KEY = "zmeika_equipped";

const skins = [
    { id: "default", name: "Бирюзовый", color: "cyan", price: 0 },
    { id: "green", name: "Зелёный", color: "green", price: 50 },
    { id: "purple", name: "Фиолетовый", color: "purple", price: 50 },
    { id: "orange", name: "Оранжевый", color: "orange", price: 50 },
    { id: "blue", name: "Синий", color: "blue", price: 50 },
    { id: "gold", name: "Золотой", color: "gold", price: 150 },
];

let ownedSkins = {}; 
let coins = 0;
let equippedSkin = "default";

function loadShopState() {
    const savedOwned = localStorage.getItem(SKINS_KEY);
    const savedCoins = localStorage.getItem(COINS_KEY);
    const savedEquipped = localStorage.getItem(EQUIPPED_KEY);

    if (savedOwned) {
        try { ownedSkins = JSON.parse(savedOwned); } catch { ownedSkins = {}; }
    } else {
        ownedSkins = { default: true };
    }

    coins = savedCoins ? parseInt(savedCoins, 10) || 0 : 0;
    equippedSkin = savedEquipped || "default";
    updateCoinsUI();
}

function saveShopState() {
    localStorage.setItem(SKINS_KEY, JSON.stringify(ownedSkins));
    localStorage.setItem(COINS_KEY, String(coins));
    localStorage.setItem(EQUIPPED_KEY, equippedSkin);
}

function updateCoinsUI() {
    coinsElem.textContent = coins;
}

function getCurrentSnakeColor() {
    const skin = skins.find(s => s.id === equippedSkin);
    return skin ? skin.color : "cyan";
}

function drawBoard() {
    context.fillStyle = boardColor;
    context.fillRect(0, 0, boardWidth, boardHeight);
}

function drawSnake() {
    const snakeColor = getCurrentSnakeColor();
    for(let index = 0; index < snake.length; index++) {
        const snakePart = snake[index];
        if(
            index !== 0 &&
            snakePart.x === snakeHead.x &&
            snakePart.y === snakeHead.y
        ) {
            return finishGame();
        }
        context.fillStyle = snakeColor;
        context.fillRect(snakePart.x, snakePart.y, cellSize, cellSize);
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
        collision = snake.some(part => part.x === x && part.y === y);
    } while (collision);
    food.x = x;
    food.y = y;
}

function updateScore(newScore) {
    score = newScore;
    scoreInfo.textContent = score;
}

function checkIfEat() {
    if(snakeHead.x === food.x && snakeHead.y === food.y) {
        placeFood();
        updateScore(score + 1);
        return true;
    }
    return false;
}

function move() {
    snakeHead.x += velocity.x;
    snakeHead.y += velocity.y;

    if(snakeHead.x < 0) {
        snakeHead.x = boardWidth - cellSize;
    } else if(snakeHead.x > boardWidth - cellSize) {
        snakeHead.x = 0;
    } else if(snakeHead.y < 0) {
        snakeHead.y = boardHeight - cellSize;
    } else if(snakeHead.y > boardHeight - cellSize) {
        snakeHead.y = 0;
    }
    snake.unshift({
        x: snakeHead.x,
        y: snakeHead.y,
    });
    if(!checkIfEat()) {
        snake.pop();
    }
}

function changeDirection(ev) {
    const isGoingRight = velocity.x > 0;
    const isGoingLeft = velocity.x < 0;
    const isGoingUp = velocity.y < 0;
    const isGoingDown = velocity.y > 0;

    if(ev.key === "ArrowRight" && !isGoingLeft) {
        velocity.x = cellSize;
        velocity.y = 0;
    } else if(ev.key === "ArrowLeft" && !isGoingRight) {
        velocity.x = -cellSize;
        velocity.y = 0;
    } else if(ev.key === "ArrowUp" && !isGoingDown) {
        velocity.x = 0;
        velocity.y = -cellSize;
    } else if(ev.key === "ArrowDown" && !isGoingUp) {
        velocity.x = 0;
        velocity.y = cellSize;
    }
}

function nextTick() {
    drawBoard();
    drawFood();
    drawSnake();
    move();
}

function finishGame() {
    coins += score;
    saveShopState();
    updateCoinsUI();

    context.clearRect(0, 0, boardWidth, boardHeight);
    clearInterval(interval);
    interval = null;
    context.fillStyle = "red";
    context.font = "40px cursive";
    context.fillText("Вы проиграли =(", 160, 260);
    context.font = "20px Arial";
    context.fillStyle = "#fff";
    context.fillText(`Заработано монет: ${score}`, 140, 300);

    setTimeout(() => {
        showMainMenu();
    }, 1200);
}

function startGame() {
    snake = JSON.parse(JSON.stringify(initialSnake));
    snakeHead = { x: snake[0].x, y: snake[0].y };
    velocity.x = cellSize;
    velocity.y = 0;
    updateScore(0);
    placeFood();

    restartButton.style.display = "inline-block";
    restartButton.removeEventListener("click", restartGame);
    restartButton.addEventListener("click", restartGame);

    window.removeEventListener("keydown", changeDirection);
    window.addEventListener("keydown", changeDirection);

    if (interval) clearInterval(interval);
    interval = setInterval(nextTick, 300);
}

function restartGame() {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
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

shopBtn.addEventListener("click", () => {
    showShop();
});

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
        price.textContent = skin.price > 0 ? `${skin.price} очков` : "Бесплатно";

        const btn = document.createElement("button");
        btn.className = "skinBtn";

        const owned = !!ownedSkins[skin.id];
        const isEquipped = equippedSkin === skin.id;

        if (isEquipped) {
            btn.textContent = "Экипировано";
            btn.classList.add("equipped");
            btn.disabled = false;
        } else if (owned) {
            btn.textContent = "Экипировать";
            btn.classList.add("owned");
            btn.disabled = false;
        } else {
            btn.textContent = `Купить (${skin.price})`;
            btn.disabled = false;
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
                    updateCoinsUI();
                    populateShop();
                } else {
                    alert("Недостаточно монет для покупки");
                }
            }
        });

        card.appendChild(preview);
        card.appendChild(name);
        card.appendChild(price);
        card.appendChild(btn);
        skinsList.appendChild(card);
    });
}

window.addEventListener("load", () => {
    loadShopState();
    showMainMenu();
});
