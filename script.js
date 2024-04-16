/*

# Snackman Game

## Start
The game only starts when the user presses the start button. It will disappear when the game has
started.


## Player
Players can move every 500ms. Inputs are only accepted when the game has started. The player can 
only move into points, enemies, enemy spawn locations and the player spawn location. If WASD or the 
arrow keys are held, the player will move every 500ms. Individual WASD or arrow key inputs are only 
accepted if the player is able to move (500ms after they last moved). The touch arrows stay 
depressed until the player manually releases them or if a WASD or arrow key is pressed.

If after all enemies have finished moving and the player have finished moving they share the 
same position, the player will get hurt and will become invincible for 1500ms. While invincible 
the player cannot move. Enemies will continue to move even when the player cant.

The player has 3 lives by default. Every level the lives are reset back to 3. Every time a player 
is hurt a life is taken. Once 0 lives has been reached the player dies and is asked if they want to 
restart, if the player had more than 0 points they are asked for their name so the score can be 
saved on the leaderboard. If the player wins they are asked if they want to continue on to the next 
level or if they want to quit. If they continue, a new more difficult maze is generated and their 
level increases by 1. If they quit they are prompted for their name so their score can be saved on 
the leaderboard, then the maze is difficulty is reset and the start button is shown.

Every point collected increments the score by 1.


## Enemies
Enemies next move is calculated every 500ms. If they have a direction, they will continue for a 
random number of blocks defined when the direction was defined. If the enemy encounters a wall it 
will change direction and will define a new number of blocks to move. There is a 1/8  chance the 
enemy will be allowed to go back the way it came if there are multiple valid  directions otherwise 
it will not be allowed to go back the way it came. Enemies cannot share the same space as other 
enemies.


## Maze
There are infinite levels because levels are randomly generated and every block is reachable. 
Enemy spawn locations and the player spawn location is randomly generated with every maze. Mazes can 
be any size, but the default is 10.

Enemy and player spawn locations do not contain points, and once the enemy/player has moved they 
are empty and do nothing.

The minimum number of walls (not including the outside walls) is: 
data.maze.size * Math.floor(playersLevel / 6) + 1. 

The maximum number of walls (not including the outside walls) is: 
data.maze.size * 1.5 * Math.floor(data.player.level / 3) + 1.

After every level increase, the number of enemies increases by 1 provided the maze has less than 30%
of its blocks being enemy spawners. After every 3 levels, the maze size is increased by 2.


## Known Bugs
Sometimes enemies share the same space, shouldn't happen but there is an issue with the logic I
have yet to find.

When pressing WASD or the physical arrow keys, if you try and move while snackman is moving your input 
will be ignored. It technically isnt a bug but an intended feature, snackman should only move every 
500ms but it feels broken.

After using the touch arrows for continuous movement, sometimes when you exit using WASD or physical
arrow keys your input is ignored, is again because snackman only moves every 500ms. If your 
press when snackmen is moving your press gets ignored. It technically isnt a bug but an intended 
feature. 

When moving to a different tab in your browser and then returing back to snackman, the enemies
animations appear broken, is because of the css animation used to make their movement
smooth. css animations stop rendering when you move onto a different tab but the enemies continue 
moving. What means is that when you return, the css animation has to play catch up so it 
makes the enemy "move" to its new location extremely fast (and sometimes it looks like its moved 
diagonally).


*/

const settings = {
    player: {
        durations: {
            // in ms
            moving: 500,
            swiftness: 330,
            invincible: 1500,
        },
        starting: {
            lives: 3,
        }
    },
    enemies: {
        durations: {
            // in ms
            moving: 500,
            stuck: 5000,
            damaged: 1500,
        }
    },
    game: {
        tickSpeed: 10, // ms between ticks
    },
    leaderboard: {
        storageKey: "snackman:leaderboard",
    },
    maze: {
        starting: {
            size: 10,
            numberOfEnemies: 1,
        }
    }
}

const mazeCodes = {
    wall: 1,
    player: 2,
    enemy: 3,
    point: 0,
    coin: 4,
    jelly: 5,
    bomb: 6,
}

const shopItems = [
    {
        name: "Swiftness",
        id: "swiftness",
        description: "Increases your overall movement speed. Lasts forever.",
        price: 50, // coins
    },
    {
        name: "Shield",
        id: "shield",
        description: "A shield that allows you to withstand one collision with an enemy without taking a life. Lasts until used.",
        price: 15, // coins
    },
    {
        name: "Point Doubler",
        id: "pointDoubler",
        description: `Every point you collect is worth double. Used when next level is started.`,
        price: 25, // coins
    },
    {
        name: "No Clip",
        id: "noClip",
        description: "You can move through walls freely (except the outer walls). Lasts Forever.",
        price: 200, // coins
    },
    {
        name: "Regeneration",
        id: "regeneration",
        description: "Your lives will be reset back to full. Used when next level is started.",
        price: 30,
    },
    {
        name: "Jelly",
        id: "jelly",
        description: "Randomly spawns a plate of jelly that causes enemies to get stuck for 5 seconds. If you encounter the jelly you eat it and its remove it from the maze. Used when next level is started.",
        price: 10,
    },
    {
        name: "Bomb",
        id: "bomb",
        description: "Randomly spawns a bomb that causes both you and enemies to become damaged when encountered. Once detonated its removed from the maze. Used when next level is started.",
        price: 5,
    }
]

const defaultData = {
    inputs: {
        touch: {
            up: false,
            down: false,
            left: false,
            right: false,
        },
        keys: {
            up: false,
            down: false,
            left: false,
            right: false,
        }
    },
    player: {
        position: [0, 0], // row, col
        moving: false,
        movingTimeout: null,
        invincible: false, 
        lives: settings.player.starting.lives,
        totalScore: 0,
        level: 1,
        coins: 0,
    },
    enemies: {
        moving: false,
        movingTimeout: null,
        enemies: [
            // example data
            // {
            //     id: "enemy:[row][col]",
            //     lastDirection: [0, 0], // row, col
            //     position: [0, 0], // row, col
            //     damaged: false,
            //     stuck: false,
            // }
        ],
    },
    points: [
        // example data
        // {
        //     position: [row, col],
        //     id: "point:[row][col]",
        //     collected: false, // store in memory even though its also reflected in the dom, for speed
        // }
    ],
    coins: [
        // example data
        // {
        //     position: [row, col],
        //     id: "coin:[row][col]",
        //     collected: false, // store in memory even though its also reflected in the dom, for speed
        // }
    ],
    level: {
        score: 0,
    },
    get leaderboard() {
        const json = localStorage.getItem(settings.leaderboard.storageKey)
        const data = JSON.parse(json) ?? [
            // example data
            // {
            //     name: "Player 1",
            //     score: 100,
            // }
        ]
        return data
    },
    maze: {
        size: settings.maze.starting.size, // number of blocks per row and col
        numberOfEnemies: settings.maze.starting.numberOfEnemies,
        maxPoints: 0, // gets set later
        maze: [], // gets set later
    },
    game: {
        tick: null,
        started: false,
    },
    upgrades: {
        swiftness: {
            owned: false,
        },
        shield: {
            owned: false,
        },
        pointDoubler: {
            owned: false,
        },
        noClip: {
            owned: false,
        },
        regeneration: {
            owned: false,
        },
        jelly: {
            owned: false,
            position: [0, 0], // row, col
            id: "",
            eaten: false,
        },
        bomb: {
            owned: false,
            position: [0, 0], // row, col
            id: "",
            detonated: false,
        },
    }
}

const elements = {
    get maze() {                      
        return document.getElementById("maze")
    },
    get player() {                   
        return document.querySelector(".player")
    },
    get startDialog() {                 
        return document.getElementById("start-dialog")
    },
    get startDialogStartButton() {       
        return document.getElementById("start-dialog:start")
    },
    get restartDialog() {                
        return document.getElementById("restart-dialog")
    },
    get restartDialogRestartButton() {   
        return document.getElementById("restart-dialog:restart")
    },
    get shopDialog() {                   
        return document.getElementById("shop-dialog")
    },
    get shopDialogContinueButton() {     
        return document.getElementById("shop-dialog:continue")
    },
    get shopDialogItemsContainer() {     
        return document.getElementById("shop-items")
    },
    get shopDialogLevelDisplay() {       
        return document.getElementById("shop-level-display")
    },
    get touchUpButton() {                
        return document.getElementById("up-button")
    },
    get touchDownButton() {              
        return document.getElementById("down-button")
    },
    get touchLeftButton() {              
        return document.getElementById("left-button")
    },
    get touchRightButton() {             
        return document.getElementById("right-button")
    },
    get leaderboard() {                  
        return document.getElementById("leaderboard")
    },
    get score() {                        
        return document.getElementById("score")
    },
    get lives() {                        
        return document.getElementById("lives")
    },
    get level() {                        
        return document.getElementById("level")
    },
    get coins() {                        
        return document.getElementById("coins")
    },
    get enemies() {                      
        return document.querySelectorAll(".enemy")
    },
    get points() {                       
        return document.querySelectorAll(".point")
    },
    get bomb() {                         
        return document.querySelector(".bomb")
    },
    get jelly() {                        
        return document.querySelector(".jelly")
    },
}

let data 

function handleStartDialogStart(e) {
    resetState()
    startGame()
    elements.startDialog.close()
}

function handleRestartDialogRestart(e) {
    resetState()
    startGame()
    elements.restartDialog.close()
}

function handleShopDialogContinue(e) {
    resetState(false)
    startGame()
    elements.shopDialog.close()
}

function handleShopPurchase(e) {
    const item = shopItems[e.target.dataset.itemIndex]

    if (data.player.coins < item.price) {
        alert("Failed to purchase item because you don't have enough coins.")
        return
    }

    data.player.coins -= item.price
    data.upgrades[item.id].owned = true

    alert("Successfully purchased item!")

    resetState(false)
    startGame()

    elements.shopDialog.close()
}

function handleKeyDown(e) {
    if (!data.game?.started) {
        return
    }

    const wanted = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"]
    if (!wanted.includes(e.key)) {
        return
    }

    data.inputs.keys.up = false
    data.inputs.keys.down = false
    data.inputs.keys.left = false
    data.inputs.keys.right = false
    data.inputs.touch.up = false 
    data.inputs.touch.down = false 
    data.inputs.touch.left = false
    data.inputs.touch.right = false 
    elements.touchUpButton.dataset.active = false
    elements.touchDownButton.dataset.active = false
    elements.touchLeftButton.dataset.active = false 
    elements.touchRightButton.dataset.active = false

    if (e.key === "ArrowUp" || e.key === "w") {
        data.inputs.keys.up = true
    } else if (e.key === "ArrowDown" || e.key === "s") {
        data.inputs.keys.down = true
    } else if (e.key === "ArrowLeft" || e.key === "a") {
        data.inputs.keys.left = true
    } else if (e.key === "ArrowRight" || e.key === "d") {
        data.inputs.keys.right = true
    }
}

function handleKeyUp(e) {
    if (!data.game?.started) {
        return
    }

    if (e.key === "ArrowUp" || e.key === "w") {
        data.inputs.keys.up = false
    }

    if (e.key === "ArrowDown" || e.key === "s") {
        data.inputs.keys.down = false
    }

    if (e.key === "ArrowLeft" || e.key === "a") {
        data.inputs.keys.left = false
    }

    if (e.key === "ArrowRight" || e.key === "d") {
        data.inputs.keys.right = false
    }
}

function handleTouchButtonClick(e) {
    if (!data.game?.started) {
        return
    }

    // not pretty but simple
    if (e.target === elements.touchUpButton) {
        data.inputs.touch.up = !data.inputs.touch.up
        elements.touchUpButton.dataset.active = data.inputs.touch.up
        data.inputs.touch.down = false
        data.inputs.touch.left = false
        data.inputs.touch.right = false
        elements.touchDownButton.dataset.active = false
        elements.touchLeftButton.dataset.active = false
        elements.touchRightButton.dataset.active = false
    } else if (e.target === elements.touchDownButton) {
        data.inputs.touch.down = !data.inputs.touch.down
        elements.touchDownButton.dataset.active = data.inputs.touch.down
        data.inputs.touch.up = false
        data.inputs.touch.left = false
        data.inputs.touch.right = false
        elements.touchUpButton.dataset.active = false
        elements.touchLeftButton.dataset.active = false
        elements.touchRightButton.dataset.active = false
    } else if (e.target === elements.touchLeftButton) {
        data.inputs.touch.left = !data.inputs.touch.left
        elements.touchLeftButton.dataset.active = data.inputs.touch.left
        data.inputs.touch.up = false
        data.inputs.touch.down = false
        data.inputs.touch.right = false
        elements.touchUpButton.dataset.active = false
        elements.touchDownButton.dataset.active = false
        elements.touchRightButton.dataset.active = false
    } else if (e.target === elements.touchRightButton) {
        data.inputs.touch.right = !data.inputs.touch.right
        elements.touchRightButton.dataset.active = data.inputs.touch.right
        data.inputs.touch.up = false
        data.inputs.touch.down = false
        data.inputs.touch.left = false
        elements.touchUpButton.dataset.active = false
        elements.touchDownButton.dataset.active = false
        elements.touchLeftButton.dataset.active = false
    }
}

function randomInt(min, max) {
    // includes min and max
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

function generateMaze() {
    const numberOfWalls = randomInt(
        data.maze.size * Math.floor((data.player.level / 6) + 1), 
        data.maze.size * 1.5 * (Math.floor(data.player.level / 3) + 1),
    )

    let playerStartingPosition = []
    const maze = []
    for (let row = 0; row < data.maze.size; row++) {
        const rowBlocks = []
        if (row === 0 || row === data.maze.size - 1) {
            // first and last row should be all walls
            for (let col = 0; col < data.maze.size; col++) {
                rowBlocks[col] = mazeCodes.wall
            }
        } else {
            for (let col = 0; col < data.maze.size; col++) {
                if (col === 0 || col === data.maze.size - 1) {
                    // first and last column should be all walls
                    rowBlocks[col] = mazeCodes.wall
                } else {
                    rowBlocks[col] = mazeCodes.point
                }
            }
        }
        maze[row] = rowBlocks
    }

    for (let i = 0; i < numberOfWalls; i++) {
        // we dont allow walls directly next to the outer walls, there is a gap inbetween
        const randRow = randomInt(2, data.maze.size - 3)
        const randCol = randomInt(2, data.maze.size - 3)
        if (maze[randRow][randCol] === mazeCodes.point) {
            // override point
            maze[randRow][randCol] = mazeCodes.wall
        } else {
            // a enemy cannot be placed so subtract one so it wont get missed
            i--
        }
    }

    for (let i = 0; i < data.maze.numberOfEnemies; i++) {
        const randRow = randomInt(1, data.maze.size - 2)
        const randCol = randomInt(1, data.maze.size - 2)
        if (maze[randRow][randCol] === mazeCodes.point) {
            // override point
            maze[randRow][randCol] = mazeCodes.enemy
        } else {
            // a enemy cannot be placed so subtract one so it wont get missed
            i--
        }
    }

    let numberOfCoins = randomInt(1, Math.floor(data.maze.size / 3))
    for (let i = 0; i < numberOfCoins; i++) {
        const randRow = randomInt(1, data.maze.size - 2)
        const randCol = randomInt(1, data.maze.size - 2)
        if (maze[randRow][randCol] === mazeCodes.point) {
            // override point
            maze[randRow][randCol] = mazeCodes.coin
        } else {
            // a coin cannot be placed so subtract one so it wont get missed
            i--
        }
    }

    if (data.upgrades.jelly.owned) {
        while (true) {
            const randRow = randomInt(1, data.maze.size - 2)
            const randCol = randomInt(1, data.maze.size - 2)

            if (maze[randRow][randCol] === mazeCodes.point) {
                maze[randRow][randCol] = mazeCodes.jelly
                break
            }
        }
    }

    if (data.upgrades.bomb.owned) {
        while (true) {
            const randRow = randomInt(1, data.maze.size - 2)
            const randCol = randomInt(1, data.maze.size - 2)

            if (maze[randRow][randCol] === mazeCodes.point) {
                maze[randRow][randCol] = mazeCodes.bomb
                break
            }
        }
    }

    while (true) {
        const randRow = randomInt(1, data.maze.size - 2)
        const randCol = randomInt(1, data.maze.size - 2)

        if (maze[randRow][randCol] === mazeCodes.point) {
            maze[randRow][randCol] = mazeCodes.player
            playerStartingPosition = [randRow, randCol]
            break
        }
    }

    const mazeCopy = structuredClone(maze)
    const stack = []

    let pointsReached = 0
    let nonWallBlocksReached = 0
    let totalNonWallBlocks = 0

    for (let row = 0; row < data.maze.size; row++) {
        for (let col = 0; col < data.maze.size; col++) {
            if (mazeCopy[row][col] !== mazeCodes.wall) {
                totalNonWallBlocks++

                if (stack.length === 0) {
                    stack.push([row, col])
                }
            }
        }
    }

    // flood fill algorithm to ensure all blocks are reachable
    while (stack.length > 0) {
        const [row, col] = stack.pop()

        if (
            mazeCopy[row][col] === -1 ||
            mazeCopy[row][col] === mazeCodes.wall
        ) {
            continue
        }

        nonWallBlocksReached++

        if (mazeCopy[row][col] === mazeCodes.point) {
            pointsReached++
        }

        mazeCopy[row][col] = -1

        if (row + 1 < data.maze.size) {
            stack.push([row + 1, col])
        }

        if (row - 1 > 0) {
            stack.push([row - 1, col])
        }

        if (col + 1 < data.maze.size) {
            stack.push([row, col + 1])
        }

        if (col - 1 > 0) {
            stack.push([row, col - 1])
        }
    }

    if (nonWallBlocksReached !== totalNonWallBlocks) {
        // not everywhere is reachable, so generate a new maze in the hope all points are reachable
        return generateMaze()
    }

    data.maze.maze = maze 
    data.maze.maxPoints = pointsReached
    data.player.position = playerStartingPosition
}

function constructMaze() {
    elements.maze.innerHTML = ""
    elements.maze.style.setProperty("--maze-size",  data.maze.size)

    const enemies = []
    const points = []
    const coins = []
    for (let row = 0; row < data.maze.size; row++) {
        for (let col = 0; col < data.maze.size; col++) {
            let block = document.createElement("div") 
            switch (data.maze.maze[row][col]) {
                case mazeCodes.wall: {
                    block.classList.add("block", "wall")
                    block.id = `block:[${row}][${col}]`
                    break
                }
                case mazeCodes.point: {
                    block.classList.add("block", "point")
                    block.id = `point:[${row}][${col}]`
                    points.push({
                        position: [row, col],
                        id: `point:[${row}][${col}]`,
                        collected: false,
                    })
                    break
                }
                case mazeCodes.coin: {
                    block.classList.add("block", "coin")
                    block.id = `coin:[${row}][${col}]`
                    coins.push({
                        position: [row, col],
                        id: `coin:[${row}][${col}]`,
                        collected: false,
                    })
                    break
                }
                case mazeCodes.enemy: {
                    block.classList.add("block", "enemy")
                    block.id = `enemy:[${row}][${col}]`
                    block.style.setProperty("--starting-row", row)
                    block.style.setProperty("--starting-column", col)
                    block.style.setProperty("--row", row)
                    block.style.setProperty("--column", col)
                    enemies.push({
                        position: [row, col],
                        lastDirection: [0, 0],
                        id: `enemy:[${row}][${col}]`,
                        damaged: false,
                        stuck: false,
                    })
                    break
                }
                case mazeCodes.player: {
                    block.classList.add("block", "player")
                    block.id = `player:[${row}][${col}]`
                    block.style.setProperty("--starting-row", row)
                    block.style.setProperty("--starting-column", col)
                    block.style.setProperty("--row", row)
                    block.style.setProperty("--column", col)
                    break
                }
                case mazeCodes.bomb: {
                    block.classList.add("block", "bomb")
                    block.id = `bomb:[${row}][${col}]`
                    data.upgrades.bomb.position = [row, col]
                    data.upgrades.bomb.id = `bomb:[${row}][${col}]`
                    break
                }
                case mazeCodes.jelly: {
                    block.classList.add("block", "jelly")
                    block.id = `jelly:[${row}][${col}]`
                    data.upgrades.jelly.position = [row, col]
                    data.upgrades.jelly.id = `jelly:[${row}][${col}]`
                    break
                }
            }
            elements.maze.appendChild(block)
        }
    }

    data.enemies.enemies = enemies
    data.points = points
    data.coins = coins
}

function constructLeaderboard() {
    elements.leaderboard.innerHTML = ""

    let sorted = data.leaderboard.sort((a, b) => b.score - a.score)

    if (sorted.length === 0) {
        const entry = document.createElement("li")
        entry.innerText = "No entries."

        elements.leaderboard.appendChild(entry)

        return
    }

    for (let i = 0; i < Math.min(5, sorted.length); i++) {
        const entry = document.createElement("li")
        
        const nameSpan = document.createElement("span")
        nameSpan.innerText = sorted[i].name 
        nameSpan.title = sorted[i].name // for native tooltip so it can show full name
        entry.appendChild(nameSpan)

        const scoreSpan = document.createElement("span")
        scoreSpan.innerText = sorted[i].score
        entry.appendChild(scoreSpan)

        elements.leaderboard.appendChild(entry)
    }
}

function constructLives() {
    elements.lives.innerHTML = ""

    for (let i = 0; i < data.player.lives; i++) {
        const life = document.createElement("li")
        life.dataset.used = false
        elements.lives.appendChild(life)
    }

    for (let i = 0; i < defaultData.player.lives - data.player.lives; i++) {
        const life = document.createElement("li")
        life.dataset.used = true
        elements.lives.appendChild(life)
    }
}

function constructShopDialog() {
    elements.shopDialogItemsContainer.innerHTML = ""

    elements.shopDialogLevelDisplay.innerText = data.player.level

    const nonPurchasedItems = shopItems.filter((item) => !data.upgrades[item.id].owned)
    const used = []
    for (let i = 0; i < Math.min(3, nonPurchasedItems.length); i++) {
        let index = randomInt(0, nonPurchasedItems.length - 1)
        while (used.includes(index)) {
            index = randomInt(0, nonPurchasedItems.length - 1)
        }
        used.push(index)

        const container = document.createElement("button")
        container.dataset.itemIndex = index 
        container.addEventListener("click", handleShopPurchase)

        const label = document.createElement("h1")
        label.classList.add("label")
        label.innerText = `${nonPurchasedItems[index].name} [${nonPurchasedItems[index].price} Coins]`
        container.appendChild(label)

        const description = document.createElement("p")
        description.classList.add("description")
        description.innerText = `${nonPurchasedItems[index].description}`
        container.appendChild(description)

        elements.shopDialogItemsContainer.appendChild(container)
    }

    if (nonPurchasedItems.length === 0) {
        const p = document.createElement("p")
        p.innerText = "No items avaliable to purchase."
        elements.shopDialogItemsContainer.appendChild(p)
    }
}

function resetState(fullReset=true) {
    if (data?.player?.movingTimeout) {
        clearTimeout(data.player.movingTimeout)
    }

    if (data?.enemies?.movingTimeout) {
        clearTimeout(data.enemies.movingTimeout)
    }

    if (fullReset) {
        data = {}
        data.inputs = defaultData.inputs
        data.player = defaultData.player
        data.enemies = defaultData.enemies
        data.points = defaultData.points
        data.leaderboard = defaultData.leaderboard
        data.level = defaultData.level
        data.maze = defaultData.maze
        data.game = defaultData.game
        data.coins = defaultData.coins
        data.upgrades = defaultData.upgrades
    } else {
        data.player.moving = false 
        data.player.invincible = false
        data.enemies = defaultData.enemies
        data.points = defaultData.points
        data.level = defaultData.level
        data.coins = defaultData.coins
    }
}

function startGame() {
    if (data.upgrades.regeneration.owned) {
        data.player.lives = defaultData.player.lives
    }

    generateMaze()
    constructMaze()
    constructLeaderboard()
    constructLives()

    elements.player.dataset.animated = true

    elements.score.innerText = data.player.totalScore
    elements.level.innerText = data.player.level
    elements.coins.innerText = data.player.coins

    // .bind( ensures the context for ` is correct
    data.game.tick = setInterval(gameTick, settings.game.tickSpeed)      
    data.game.started = true
}

function finishGame(playerWon) {
    if (!data.game?.started) {
        return
    }

    elements.player.dataset.animated = false

    data.game.started = false 
    clearInterval(data.game.tick)

    if (playerWon) {
        data.upgrades.pointDoubler.owned = false
        data.upgrades.bomb.owned = false 
        data.upgrades.jelly.owned = false
        data.upgrades.regeneration.owned = false
        
        constructShopDialog()

        data.player.level++
        elements.level.innerText = data.player.level 

        // increase difficulty 
        if ((data.player.level % 2) === 0) {
            data.maze.numberOfEnemies++
        }

        if ((data.player.level % 3) === 0) {
            data.maze.size++
        }

        elements.shopDialog.show()
    } else {
        const name = prompt("Your name for the leaderboard. Leave empty if you don't want to save your score.")

        if (name !== null && name !== "") {
            data.leaderboard.push({
                name: name.trim(),
                score: data.player.totalScore
            })
            localStorage.setItem(settings.leaderboard.storageKey, JSON.stringify(data.leaderboard))

            constructLeaderboard()
        }

        elements.restartDialog.show()
    }
} 

function debugGiveAllPoints() {
    let pointsLeftToCollect = data.maze.maxPoints - data.level.score
    data.level.score += pointsLeftToCollect
    data.player.totalScore += pointsLeftToCollect
    elements.score.innerText = data.player.totalScore
    
    for (const point of elements.points) {
        point.dataset.collected = true 
    }

    for (const point of data.points) {
        point.collected = true
    }

    finishGame(true)
}

function debugSetPlayerCoins(newCoinsValue) {
    data.player.coins = newCoinsValue
    elements.coins.innerText = data.player.coins
}

// takes a life from the player
// if there are 0 lives left the player is killed and the game ends
function damagePlayer() {
    if (data.player.invincible) {
        return
    }

    if (data.upgrades.shield.owned) {
        data.upgrades.shield.owned = false
        alert("You used your shield!")
        return
    }

    data.player.lives-- 
    constructLives()

    if (data.player.lives > 0) {
        elements.player.dataset.hit = true
        data.player.invincible = true 

        setTimeout(() => {
            data.player.invincible = false 
            elements.player.dataset.hit = false
        }, settings.player.durations.invincible)
    } else {
        elements.player.dataset.dead = true
        data.player.invincible = true 

        setTimeout(() => {
            finishGame(false)
        }, settings.player.durations.invincible)
    }
}

// if there is a point, collect it and increment score otherwise do nothing
function collectPoint(row, col) {
    for (const point of data.points) {
        if (
            point.position[0] === row && 
            point.position[1] === col && 
            !point.collected
        ) {
            const pointElement = document.getElementById(point.id)
            pointElement.dataset.collected = true
            point.collected = true
    
            let incrementValue = 1
            if (data.upgrades.pointDoubler.owned) {
                incrementValue *= 2
            }

            data.level.score += incrementValue
            data.player.totalScore += incrementValue
            elements.score.innerText = data.player.totalScore
            break
        }
    }
}

function collectCoin(row, col) {
    for (const coin of data.coins) {
        if (
            coin.position[0] === row && 
            coin.position[1] === col && 
            !coin.collected
        ) {
            const coinElement = document.getElementById(coin.id)
            coinElement.dataset.collected = true
            coin.collected = true
    
            data.player.coins++
            elements.coins.innerText = data.player.coins
            break
        }
    }
}

function tickPlayerMovement() {
    if (data.player.moving || data.player.invincible) {
        return 
    }

    let searchDirection = null
    let playerRotation = null
    if (data.inputs.keys.up || data.inputs.touch.up) {
        searchDirection = [-1, 0]
        playerRotation = 270
    } else if (data.inputs.keys.down || data.inputs.touch.down) {
        searchDirection = [+1, 0]
        playerRotation = 90
    } else if (data.inputs.keys.left || data.inputs.touch.left) {
        searchDirection = [0, -1]
        playerRotation = 180
    } else if (data.inputs.keys.right || data.inputs.touch.right) {
        searchDirection = [0, +1]
        playerRotation = 0
    }

    if (searchDirection === null) {
        return
    }
    
    elements.player.style.setProperty("--rotation", `${playerRotation}deg`)

    const newRow = data.player.position[0] + searchDirection[0]
    const newCol = data.player.position[1] + searchDirection[1]
    const block = data.maze.maze[newRow][newCol]

    if (block === mazeCodes.wall) {
        return
    }

    for (const enemy of data.enemies.enemies) {
        if (enemy.position[0] === newRow && enemy.position[1] == newCol) {
            damagePlayer()
            break
        }
    }

    if (
        data.upgrades.bomb.position[0] === newRow && 
        data.upgrades.bomb.position[1] === newCol && 
        !data.upgrades.bomb.detonated
    ) {
        damagePlayer()
        elements.bomb.dataset.detonated = true
        data.upgrades.bomb.detonated = true
    }

    if (
        data.upgrades.jelly.position[0] === newRow && 
        data.upgrades.jelly.position[1] === newCol &&
        !data.upgrades.jelly.eaten
    ) {
        elements.jelly.dataset.eaten = true
        data.upgrades.jelly.eaten = true
    }

    data.player.position[0] = newRow
    data.player.position[1] = newCol

    if (searchDirection[0] !== 0) {
        elements.player.style.setProperty("--row", newRow)
    }
    
    if (searchDirection[1] !== 0) {
        elements.player.style.setProperty("--column", newCol)
    }

    if (data.upgrades.swiftness.owned) {
        data.player.moving = true 
        data.player.movingTimeout = setTimeout(() => {
            data.player.moving = false
        }, settings.player.durations.swiftness)
    } else {
        data.player.moving = true 
        data.player.movingTimeout = setTimeout(() => {
            data.player.moving = false
        }, settings.player.durations.moving)
    }
}

function tickEnemyMovement() {
    if (data.enemies.moving) {
        return
    }

    for (const enemy of data.enemies.enemies) {
        if (enemy.stuck || enemy.damaged) {
            continue
        }
        
        // makes the enemy most likely to continue on its current path, makes it very rare it goes back the way it came
        const probabilityMatrices = {
            "-1,0": [
                [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0],
                [+1,0],
                [0,-1], [0,-1], [0,-1], [0,-1],
                [0,+1], [0,+1], [0,+1], [0,+1],
            ],
            "1,0": [
                [-1,0],
                [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0],
                [0,-1], [0,-1], [0,-1], [0,-1],
                [0,+1], [0,+1], [0,+1], [0,+1],
            ], 
            "0,-1": [
                [-1,0], [-1,0], [-1,0], [-1,0],
                [+1,0], [+1,0], [+1,0], [+1,0],
                [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1],
                [0,+1],
            ],
            "0,1": [
                [-1,0], [-1,0], [-1,0], [-1,0],
                [+1,0], [+1,0], [+1,0], [+1,0],
                [0,-1],
                [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1],
            ],
            "0,0": [
                [-1,0],
                [+1,0],
                [0,-1],
                [0,+1],
            ]
        }

        if (enemy.lastDirection === undefined) {
            enemy.lastDirection = [0, 0]
        }

        const matrixKey = `${enemy.lastDirection[0]},${enemy.lastDirection[1]}`
        const probabilityMatrix = probabilityMatrices[matrixKey]

        let newDirection = null
        let newRow = null
        let newCol = null
        
        const triedDirections = {}

        while (true) {
            newDirection = probabilityMatrix[randomInt(0, probabilityMatrix.length - 1)]
            newRow = enemy.position[0] + newDirection[0]
            newCol = enemy.position[1] + newDirection[1]

            if (Object.keys(triedDirections).length === probabilityMatrices.length) {
                newRow = enemy.position[0]
                newCol = enemy.position[1]
                break
            }

            const key = `${newRow},${newCol}`
            if (key in triedDirections) {
                continue
            }
            triedDirections[key] = true

            if (data.player.position[0] === newRow && data.player.position[1] === newCol) {
                // we hit a player, so damage the player and dont move into the spot
                damagePlayer()
                break
            }

            if (
                data.upgrades.bomb.position[0] === newRow && 
                data.upgrades.bomb.position[1] === newCol && 
                !data.upgrades.bomb.detonated
            ) {
                enemy.damaged = true
                setTimeout(() => {
                    enemy.damaged = false
                }, settings.enemies.durations.damaged);

                elements.bomb.dataset.detonated = true
                data.upgrades.bomb.detonated = true

                break
            }
    
            if (
                data.upgrades.jelly.position[0] === newRow && 
                data.upgrades.jelly.position[1] === newCol &&
                !data.upgrades.jelly.eaten
            ) {
                enemy.stuck = true
                setTimeout(() => {
                    enemy.stuck = false
                }, settings.enemies.durations.stuck);

                break
            }

            if (data.maze.maze[newRow][newCol] === mazeCodes.wall) {
                continue
            }

            let bad = false 
            for (const innerEnemy of data.enemies.enemies) {
                if (innerEnemy.position[0] === newRow && innerEnemy.position[1] === newCol) {
                    bad = true
                    break
                }
            }

            if (bad) {
                continue
            }

            break
        }

        enemy.lastDirection = newDirection
        enemy.position[0] = newRow 
        enemy.position[1] = newCol

        const element = document.getElementById(enemy.id)

        if (newDirection[0] !== 0) {
            element.style.setProperty("--row", newRow)
        }

        if (newDirection[1] !== 0) {
            element.style.setProperty("--column", newCol)
        }
    }

    data.enemies.moving = true
    data.enemies.movingTimeout = setTimeout(() => {
        data.enemies.moving = false
    }, settings.enemies.durations.moving)
}

function gameTick() {
    tickEnemyMovement()

    tickPlayerMovement()
    
    collectPoint(...data.player.position)

    collectCoin(...data.player.position)

    if (data.level.score === data.maze.maxPoints) {
        finishGame(true)
    }
}

function loadSnackman() {
    document.addEventListener("keyup", handleKeyUp)
    document.addEventListener("keydown", handleKeyDown)  
    
    console.log(elements)
    elements.touchUpButton.addEventListener("click", handleTouchButtonClick)
    elements.touchDownButton.addEventListener("click", handleTouchButtonClick)
    elements.touchLeftButton.addEventListener("click", handleTouchButtonClick)
    elements.touchRightButton.addEventListener("click", handleTouchButtonClick)
    
    elements.startDialogStartButton.addEventListener("click", handleStartDialogStart)
    elements.restartDialogRestartButton.addEventListener("click", handleRestartDialogRestart)
    elements.shopDialogContinueButton.addEventListener("click", handleShopDialogContinue)
    
    resetState()
    
    constructLeaderboard()
    
    elements.restartDialog.close()
    elements.shopDialog.close()
    elements.startDialog.show()
    
    window.debugGiveAllPoints = debugGiveAllPoints
    window.debugSetPlayerCoins = debugSetPlayerCoins
}

document.addEventListener("DOMContentLoaded", loadSnackman)