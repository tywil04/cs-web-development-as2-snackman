/*

SNACKMAN 

Web Development AS2

Tyler Williams

*/

const config = {
    player: {
        movingSpeed: 500, // in ms
        invincibleDuration: 1500, // in ms
        startingLives: 3,
        mazeCode: 2,
        class: "player",
    },

    enemies: {
        grunt: {
            // deals -1 lives, deals 0 coins
            movingSpeed: 500, // in ms
            damagedDuration: 4000, // in ms
            lives: -1,
            coins: 0,
            mazeCode: 3,
            startingNumberOf: 1,
            class: "grunt",
            incrementEnemyCount() {
                return (global.player.level % 1) === 0
            },
        },

        witch: {
            // deals either -1 or +1 lives, deals 0 coins
            movingSpeed: 500, // in ms
            damagedDuration: 4000,
            get lives() {
                const rand = randomInt(0, 1)
                if (rand === 1) {
                    return 1
                } else {
                    return -1
                }
            },
            coins: 0,
            mazeCode: 7,
            startingNumberOf: 0,
            class: "witch",
            incrementEnemyCount() {
                return (global.player.level % 3) === 0
            },
        },

        robber: {
            // deals 0 lives, deals -1 to -5 coins
            movingSpeed: 500, // in ms
            damagedDuration: 3000,
            lives: 0,
            get coins() {
                return -randomInt(1, 5)
            },
            mazeCode: 8,
            startingNumberOf: 0,
            class: "robber",
            incrementEnemyCount() {
                return (global.player.level % 2) === 0
            },
        },

        crusher: {
            // deals -2 lives, deals 0 coins
            movingSpeed: 1000, // in ms
            damagedDuration: 6250,
            lives: -2,
            coins: 0,
            mazeCode: 9,
            startingNumberOf: 0,
            class: "crusher",
            incrementEnemyCount() {
                return (global.player.level % 4) === 0
            },
        }
    },

    upgrades: {
        shield: {
            name: "Shield",
            description: "A shield that allows you to withstand one collision with an enemy without taking a life. Lasts until used.",
            price: 15, // coins
            buy() {
                global.upgrades.shield.bought = true
            },
            bought() {
                return global.upgrades.shield.bought
            },
            available() {
                return !global.upgrades.shield.bought
            },
            onPlayerDamage(damage) {
                return 0
            },
        },
    
        pointDoubler: {
            name: "Point Doubler",
            description: `Every point you collect is worth double. Used when next level is started.`,
            price: 25, // coins
            buy() {
                global.upgrades.pointDoubler.bought = true
            },
            bought() {
                return global.upgrades.pointDoubler.bought
            },
            available() {
                return !global.upgrades.pointDoubler.bought
            },
            onEnd() {
                global.upgrades.pointDoubler.bought = false
            },
            onPlayerPoints(points) {
                return points * 2
            },
        },

        coinDoubler: {
            name: "Coin Doubler",
            description: `Every coin you collect is worth double. Used when next level is started.`,
            price: 30,
            buy() {
                global.upgrades.coinDoubler.bought = true
            },
            bought() {
                return global.upgrades.coinDoubler.bought
            },
            available() {
                return !global.upgrades.coinDoubler.bought
            },
            onEnd() {
                global.upgrades.coinDoubler.bought = false
            },
            onPlayerCoins(coins) {
                return coins * 2
            },
        },
    
        regeneration: {
            name: "Regeneration",
            description: "Your lives will be reset back to full. Used when next level is started.",
            price: 30,
            buy() {
                global.upgrades.regeneration.bought = true
            },
            bought() {
                return global.upgrades.regeneration.bought
            },
            available() {
                return !global.upgrades.regeneration.bought
            },
            onStart() {
                global.player.lives = config.player.startingLives
                constructLives()

                global.upgrades.regeneration.bought = false
            },
        },
    
        bomb: {
            // can spawn in the maze, deals -1 lives when hit
            name: "Bomb",
            description: "Randomly spawns a bomb that causes both you and enemies to become damaged when encountered. Once detonated its removed from the maze. Used when next level is started.",
            price: 5,
            mazeCode: 6,
            numberOf: 1,
            class: "bomb",
            buy() {
                global.upgrades.bomb.bought = true
                global.upgrades.bomb.detonated = []
            },
            bought() {
                return global.upgrades.bomb.bought
            },
            available() {
                return !global.upgrades.bomb.bought
            },
            onEnd() {
                global.upgrades.bomb.bought = false
            },
            onPlayerHit(element, position) {
                // if hit the player cannot move for 2 seconds and -1 lives added, its removed afterwards
                if (global.upgrades.bomb.detonated.includes(`${position[0]},${position[1]}`)) {
                    return 0
                }
                
                element.dataset.detonated = true
                global.upgrades.bomb.detonated.push(`${position[0]},${position[1]}`)
    
                return -1
            },
            onEnemyHit(element, enemy, position) {
                // if an enemy hits it cannot move for 5 seconds. its removed afterwards
                if (global.upgrades.bomb.detonated.includes(`${position[0]},${position[1]}`)) {
                    return false
                }

                element.dataset.detonated = true
                global.upgrades.bomb.detonated.push(`${position[0]},${position[1]}`)
    
                return true
            },
        }
    },

    game: {
        tickSpeed: 10, // ms between ticks
    },

    leaderboard: {
        storageKey: "snackman:leaderboard",
    },

    maze: {
        startingSize: 9,
    },

    coins: {
        mazeCode: 4,
    },

    walls: {
        mazeCode: 1,
    },

    points: {
        mazeCode: 0,
    }
}

const defaultGlobal = {
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
        lives: config.player.startingLives,
        totalScore: 0,
        level: 1,
        coins: 0,
    },
    
    maze: {
        size: config.maze.startingSize, // number of blocks per row and col
    },

    game: {
        tick: null,
        started: false,
        paused: false,
        canPause: true,
    },

    get enemies() {
        const enemies = {}
        for (const [id, enemy] of Object.entries(config.enemies)) {
            enemies[id] = {
                numberOf: enemy.startingNumberOf,
            }
        }
        return enemies
    },

    get upgrades() {
        const upgrades = {}
        for (const [id, upgrade] of Object.entries(config.upgrades)) {
            upgrades[id] = {
                bought: false,
            }
        }
        return upgrades
    },

    get leaderboard() {
        const json = localStorage.getItem(config.leaderboard.storageKey)
        const data = JSON.parse(json) ?? [
            // example data
            // {
            //     name: "Player 1",
            //     score: 100,
            // }
        ]
        return data
    },
}

const defaultLevel = {
    score: 0,

    points: {
        spawned: [
            // {
            //     element: ,
            //     position: [row, col],
            //     collected: false, // store in memory even though its also reflected in the dom, for speed
            // }
        ]
    },

    coins: {
        spawned: [
            // {
            //     element: ,
            //     position: [row, col],
            //     collected: false, // store in memory even though its also reflected in the dom, for speed
            // }
        ]
    },

    get enemies() {
        const enemies = {
            spawned: [
                // every enemy in the maze will have an entry
                // enemy types are dynamic and formed from config
                // {
                //     element: ,
                //     type: ,
                //     lastDirection: [row, col],
                //     position: [row, col],
                //     canMove: false,
                //     timeout: null,
                // }
            ],
        }
        return enemies
    },

    upgrades: {
        spawned: [
            // {
            //     element: ,
            //     position: [row, col],
            //     type: ,
            // },
        ]
    },

    player: {
        canMove: true,
        canBeDamaged: true,
        timeout: null,
        position: [0, 0],
        element: null,
    },

    maze: {
        maze: [],
        maxPoints: 0,
    }
}

const elements = {
    get maze() {                      
        return document.getElementById("maze")
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
    get upgradeDialog() {                   
        return document.getElementById("upgrade-dialog")
    },
    get upgradeDialogContinueButton() {     
        return document.getElementById("upgrade-dialog:continue")
    },
    get upgradeDialogItemsContainer() {     
        return document.getElementById("upgrade-items")
    },
    get upgradeDialogLevelDisplay() {       
        return document.getElementById("upgrade-level-display")
    },
    get unpauseDialog() {
        return document.getElementById("unpause-dialog")
    },
    get unpauseDialogUnpauseButton() {
        return document.getElementById("unpause-dialog:unpause")
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
    }
}

let global = {}
let level = {}

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

function handleUpgradeDialogContinue(e) {
    resetState(false)
    startGame()
    elements.upgradeDialog.close()
}

function handleUpgradePurchase(e) {
    const upgrade = config.upgrades[e.target.dataset.upgradeId]

    if (global.player.coins < upgrade.price) {
        alert("Failed to purchase item because you don't have enough coins.")
        return
    }

    global.player.coins -= upgrade.price
    upgrade.buy()

    alert("Successfully purchased item!")

    resetState(false)
    startGame()

    elements.upgradeDialog.close()
}

function handleKeyDown(e) {
    if (!global.game.started) {
        return
    }

    if (global.game.paused) {
        return
    }

    global.inputs.keys.up = false
    global.inputs.keys.down = false
    global.inputs.keys.left = false
    global.inputs.keys.right = false
    global.inputs.touch.up = false 
    global.inputs.touch.down = false 
    global.inputs.touch.left = false
    global.inputs.touch.right = false 
    elements.touchUpButton.dataset.active = false
    elements.touchDownButton.dataset.active = false
    elements.touchLeftButton.dataset.active = false 
    elements.touchRightButton.dataset.active = false

    if (e.key === "ArrowUp" || e.key === "w") {
        global.inputs.keys.up = true
    } else if (e.key === "ArrowDown" || e.key === "s") {
        global.inputs.keys.down = true
    } else if (e.key === "ArrowLeft" || e.key === "a") {
        global.inputs.keys.left = true
    } else if (e.key === "ArrowRight" || e.key === "d") {
        global.inputs.keys.right = true
    }
}

function handleKeyUp(e) {
    if (!global.game.started || global.game.paused) {
        return
    }

    if (e.key === "ArrowUp" || e.key === "w") {
        global.inputs.keys.up = false
    }

    if (e.key === "ArrowDown" || e.key === "s") {
        global.inputs.keys.down = false
    }

    if (e.key === "ArrowLeft" || e.key === "a") {
        global.inputs.keys.left = false
    }

    if (e.key === "ArrowRight" || e.key === "d") {
        global.inputs.keys.right = false
    }
}

function handleTouchButtonClick(e) {
    if (!global.game.started || global.game.paused) {
        return
    }

    // not pretty but simple
    if (e.target === elements.touchUpButton) {
        global.inputs.touch.up = !global.inputs.touch.up
        elements.touchUpButton.dataset.active = global.inputs.touch.up
        global.inputs.touch.down = false
        global.inputs.touch.left = false
        global.inputs.touch.right = false
        elements.touchDownButton.dataset.active = false
        elements.touchLeftButton.dataset.active = false
        elements.touchRightButton.dataset.active = false
    } else if (e.target === elements.touchDownButton) {
        global.inputs.touch.down = !global.inputs.touch.down
        elements.touchDownButton.dataset.active = global.inputs.touch.down
        global.inputs.touch.up = false
        global.inputs.touch.left = false
        global.inputs.touch.right = false
        elements.touchUpButton.dataset.active = false
        elements.touchLeftButton.dataset.active = false
        elements.touchRightButton.dataset.active = false
    } else if (e.target === elements.touchLeftButton) {
        global.inputs.touch.left = !global.inputs.touch.left
        elements.touchLeftButton.dataset.active = global.inputs.touch.left
        global.inputs.touch.up = false
        global.inputs.touch.down = false
        global.inputs.touch.right = false
        elements.touchUpButton.dataset.active = false
        elements.touchDownButton.dataset.active = false
        elements.touchRightButton.dataset.active = false
    } else if (e.target === elements.touchRightButton) {
        global.inputs.touch.right = !global.inputs.touch.right
        elements.touchRightButton.dataset.active = global.inputs.touch.right
        global.inputs.touch.up = false
        global.inputs.touch.down = false
        global.inputs.touch.left = false
        elements.touchUpButton.dataset.active = false
        elements.touchDownButton.dataset.active = false
        elements.touchLeftButton.dataset.active = false
    }
}

function handleUnpauseDialogUnpause(e) {
    unpauseGame()
}

function handleVisibilityChange(e) {
    if (document.visibilityState !== "hidden") {
        return
    }
    pauseGame()
}

function handleWindowBlur() {
    pauseGame()
}

function randomInt(min, max) {
    // includes min and max
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

function generateMaze() {
    const maze = []

    const pointLocations = []

    for (let i = 0; i < global.maze.size; i++) {
        maze.push([
            config.walls.mazeCode,
            ...Array(global.maze.size - 2).fill(config.points.mazeCode),
            config.walls.mazeCode,
        ])
    }
    maze[0].fill(config.walls.mazeCode)
    maze[maze.length - 1].fill(config.walls.mazeCode)

    for (let r = 1; r < global.maze.size - 1; r++) {
        for (let c = 1; c < global.maze.size - 1; c++) {
            pointLocations.push([r, c])
        }
    }

    const numberOfWalls = randomInt(
        global.maze.size * Math.floor((global.player.level / 6) + 1), 
        global.maze.size * 1.5 * (Math.floor(global.player.level / 3) + 1),
    )
    let counter = 0
    while (counter < numberOfWalls) {
        const index = randomInt(0, pointLocations.length - 1)
        const location = pointLocations[index]

        if (
            location[0] === 1 || location[0] === global.maze.size - 2 ||
            location[1] === 1 || location[1] === global.maze.size - 2
        ) {
            continue
        }

        pointLocations.splice(index, 1)
        maze[location[0]][location[1]] = config.walls.mazeCode
        counter++
    }

    for (const [enemyId, enemy] of Object.entries(config.enemies)) {
        for (let i = 0; i < global.enemies[enemyId].numberOf; i++) {
            const index = randomInt(0, pointLocations.length - 1)
            const location = pointLocations[index]
            pointLocations.splice(index, 1)
            maze[location[0]][location[1]] = enemy.mazeCode
        }
    }

    const numberOfCoins = randomInt(1, Math.floor(global.maze.size / 3))
    for (let i = 0; i < numberOfCoins; i++) {
        const index = randomInt(0, pointLocations.length - 1)
        const location = pointLocations[index]
        pointLocations.splice(index, 1)
        maze[location[0]][location[1]] = config.coins.mazeCode
    }

    for (const upgrade of Object.values(config.upgrades)) {
        if (!upgrade.mazeCode) {
            continue
        }

        if (!upgrade.bought()) {
            continue
        }

        for (let i = 0; i < upgrade.numberOf ?? 1; i++) {
            const index = randomInt(0, pointLocations.length - 1)
            const location = pointLocations[index]
            pointLocations.splice(index, 1)
            maze[location[0]][location[1]] = upgrade.mazeCode
        }
    }

    const index = randomInt(0, pointLocations.length - 1)
    const playerPosition = pointLocations[index]
    pointLocations.splice(index, 1)
    maze[playerPosition[0]][playerPosition[1]] = config.player.mazeCode

    const mazeCopy = structuredClone(maze)
    const stack = []
    let pointsReached = 0
    let nonWallBlocksReached = 0
    let totalNonWallBlocks = 0

    for (let row = 0; row < global.maze.size; row++) {
        for (let col = 0; col < global.maze.size; col++) {
            if (mazeCopy[row][col] !== config.walls.mazeCode) {
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
            mazeCopy[row][col] === config.walls.mazeCode
        ) {
            continue
        }

        nonWallBlocksReached++

        if (mazeCopy[row][col] === config.points.mazeCode) {
            pointsReached++
        }

        mazeCopy[row][col] = -1

        if (row + 1 < global.maze.size) {
            stack.push([row + 1, col])
        }

        if (row - 1 > 0) {
            stack.push([row - 1, col])
        }

        if (col + 1 < global.maze.size) {
            stack.push([row, col + 1])
        }

        if (col - 1 > 0) {
            stack.push([row, col - 1])
        }
    }

    if (nonWallBlocksReached !== totalNonWallBlocks) {
        // not everywhere is reachable, so generate a new maze
        return generateMaze()
    }

    level.maze.maze = maze 
    level.maze.maxPoints = pointsReached
    level.player.position = playerPosition
}

function constructEnemy(position, enemyId, enemy) {
    const block = document.createElement("div") 

    block.classList.add("block", enemy.class)
    block.style.setProperty("--starting-row", position[0])
    block.style.setProperty("--starting-column", position[1])
    block.style.setProperty("--row", position[0])
    block.style.setProperty("--column", position[1])
    block.style.setProperty("--move-speed", `${config.enemies[enemyId].movingSpeed}ms`)

    return block
}

function constructUpgrade(upgrade) {
    const block = document.createElement("div") 
    block.classList.add("block", upgrade?.class)
    return block
}

function constructPoint() {
    const block = document.createElement("div") 
    block.classList.add("block", "point")
    return block
}

function constructCoin() {
    const block = document.createElement("div") 
    block.classList.add("block", "coin")
    return block
}

function constructWall() {
    const block = document.createElement("div") 
    block.classList.add("block", "wall")
    return block
}

function constructPlayer(position) {
    const block = document.createElement("div") 

    block.classList.add("block", "player")
    block.style.setProperty("--starting-row", position[0])
    block.style.setProperty("--starting-column", position[1])
    block.style.setProperty("--row", position[0])
    block.style.setProperty("--column", position[1])
    block.style.setProperty("--move-speed", `${config.player.movingSpeed}ms`)

    return block
}

function constructMaze() {
    elements.maze.innerHTML = ""
    elements.maze.style.setProperty("--maze-size",  global.maze.size)

    const enemies = {}
    const coins = {}
    const points = {}
    const upgrades = {}
    let player

    for (let row = 0; row < global.maze.size; row++) {
        forCol:
        for (let col = 0; col < global.maze.size; col++) {
            let block

            switch (level.maze.maze[row][col]) {
                case config.walls.mazeCode: {
                    block = constructWall()
                    break
                }
                case config.points.mazeCode: {
                    block = constructPoint()
                    points[`${row},${col}`] = {
                        element: block,
                        position: [row, col],
                        collected: false,
                    }
                    break
                }
                case config.coins.mazeCode: {
                    block = constructCoin()
                    coins[`${row},${col}`] = {
                        element: block,
                        position: [row, col],
                        collected: false,
                    }
                    break
                }
                case config.player.mazeCode: {
                    block = constructPlayer([row, col])
                    player = block
                    break
                }
                default: {
                    let wasEnemy = false
                    for (const [enemyId, enemy] of Object.entries(config.enemies)) {
                        if (level.maze.maze[row][col] === enemy.mazeCode) {
                            block = constructEnemy([row, col], enemyId, enemy)
                            enemies[`${row},${col}`] = {
                                element: block,
                                type: enemyId,
                                lastDirection: [0, 0],
                                position: [row, col],
                                canMove: true,
                                timeout: null,
                            }
                            wasEnemy = true
                            break
                        }
                    }

                    if (!wasEnemy) {
                        for (const [upgradeId, upgrade] of Object.entries(config.upgrades)) {
                            if (level.maze.maze[row][col] === upgrade?.mazeCode && upgrade.bought()) {
                                block = constructUpgrade(upgrade)
                                upgrades[`${row},${col}`] = {
                                    element: block,
                                    type: upgradeId,
                                    position: [row, col]
                                }
                                break
                            }
                        }
                    }
                }
            }

            elements.maze.appendChild(block)
        }
    }

    level.enemies.spawned = enemies
    level.points.spawned = points
    level.coins.spawned = coins
    level.upgrades.spawned = upgrades
    level.player.element = player
}

function constructLeaderboard() {
    elements.leaderboard.innerHTML = ""

    let sorted = global.leaderboard.sort((a, b) => b.score - a.score)

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

    for (let i = 0; i < global.player.lives; i++) {
        const life = document.createElement("li")
        life.dataset.used = false
        elements.lives.appendChild(life)
    }

    for (let i = 0; i < defaultGlobal.player.lives - global.player.lives; i++) {
        const life = document.createElement("li")
        life.dataset.used = true
        elements.lives.appendChild(life)
    }
}

function constructUpgradeDialog() {
    elements.upgradeDialogItemsContainer.innerHTML = ""

    elements.upgradeDialogLevelDisplay.innerText = global.player.level

    const nonPurchased = []
    for (const [upgradeId, upgrade] of Object.entries(config.upgrades)) {
        if (upgrade.available()) {
            nonPurchased.push({
                ...upgrade,
                id: upgradeId,
            })
        }
    }

    const used = []
    for (let i = 0; i < Math.min(3, nonPurchased.length); i++) {
        let index = randomInt(0, nonPurchased.length - 1)
        while (used.includes(index)) {
            index = randomInt(0, nonPurchased.length - 1)
        }
        used.push(index)

        const container = document.createElement("button")
        container.dataset.upgradeId = nonPurchased[index].id 
        container.addEventListener("click", handleUpgradePurchase)

        const label = document.createElement("h1")
        label.classList.add("label")
        label.innerText = `${nonPurchased[index].name} [${nonPurchased[index].price} Coins]`
        container.appendChild(label)

        const description = document.createElement("p")
        description.classList.add("description")
        description.innerText = `${nonPurchased[index].description}`
        container.appendChild(description)

        elements.upgradeDialogItemsContainer.appendChild(container)
    }

    if (nonPurchased.length === 0) {
        const p = document.createElement("p")
        p.innerText = "No items avaliable to purchase."
        elements.upgradeDialogItemsContainer.appendChild(p)
    }
}

function incrementDifficulty() {
    global.maze.size++ 

    for (const [enemyId, enemy] of Object.entries(config.enemies)) {
        if (enemy.incrementEnemyCount?.()) {
            global.enemies[enemyId].numberOf++
        }
    }
}

function addCoins(coins) {
    for (const upgrade of Object.values(config.upgrades)) {
        if (upgrade.bought() && upgrade.onPlayerCoins) {
            coins = upgrade.onPlayerCoins(coins)
        }
    }

    global.player.coins += coins
    if (global.player.coins < 0) {
        global.player.coins = 0
    }
    
    elements.coins.innerText = global.player.coins
}

function addPoints(points) {
    let totalPoints = points
    for (const upgrade of Object.values(config.upgrades)) {
        if (upgrade.bought() && upgrade.onPlayerPoints) {
            totalPoints = upgrade.onPlayerPoints(totalPoints)
        }
    }

    global.player.totalScore += totalPoints
    level.score += points

    elements.score.innerText = global.player.totalScore
}

function addLives(lives) {
    if (!level.player.canBeDamaged) {
        return
    }

    let totalDamage = lives
    for (const upgrade of Object.values(config.upgrades)) {
        if (upgrade.bought() && upgrade.onPlayerDamage) {
            totalDamage = upgrade.onPlayerDamage(totalDamage)
        }
    }

    global.player.lives += totalDamage
    if (global.player.lives < 0) {
        global.player.lives = 0
    }

    constructLives()
}

function addLeaderboardEntry(name, score) {
    if (name !== null && name !== "") {
        global.leaderboard.push({
            name: name,
            score: score,
        })
        localStorage.setItem(config.leaderboard.storageKey, JSON.stringify(global.leaderboard))

        constructLeaderboard()
    }
}

function hitPlayer(lives, coins) {
    if (!level.player.canBeDamaged) {
        return
    }

    addLives(lives)
    addCoins(coins)

    if (global.player.lives > 0) {
        level.player.element.dataset.hit = true
        level.player.canBeDamaged = false 
        level.player.canMove = false
        clearTimeout(level.player.timeout)

        setTimeout(() => {
            level.player.canBeDamaged = true
            level.player.element.dataset.hit = false
            level.player.canMove = true
        }, config.player.invincibleDuration)
    } else {
        level.player.element.dataset.dead = true
        level.player.canBeDamaged = false 
        level.player.canMove = false
        clearTimeout(level.player.timeout)

        setTimeout(() => {
            endGame(false)
        }, config.player.invincibleDuration)
    }  
}

function hitEnemy(enemy) {
    enemy.canMove = false 
    enemy.element.dataset.hit = true
    clearTimeout(enemy.timeout)

    setTimeout(() => {
        enemy.canMove = true
        enemy.element.dataset.hit = false
    }, config.enemies[enemy.type].damagedDuration)
}

function attemptCollectCoin(position) {
    const coin = level.coins.spawned[`${position[0]},${position[1]}`]

    if (!coin) {
        return
    }

    if (coin.collected) {
        return
    }

    coin.element.dataset.collected = true 
    coin.collected = true
    addCoins(1)
}

function attemptCollectPoint(position) {
    const point = level.points.spawned[`${position[0]},${position[1]}`]

    if (!point) {
        return
    }

    if (point.collected) {
        return
    }

    point.element.dataset.collected = true
    point.collected = true 
    addPoints(1)
}

function tickPlayerMovement() {
    if (!level.player.canMove) {
        return
    }

    let searchDirection = null
    let playerRotation = null
    if (global.inputs.keys.up || global.inputs.touch.up) {
        searchDirection = [-1, 0]
        playerRotation = 270
    } else if (global.inputs.keys.down || global.inputs.touch.down) {
        searchDirection = [+1, 0]
        playerRotation = 90
    } else if (global.inputs.keys.left || global.inputs.touch.left) {
        searchDirection = [0, -1]
        playerRotation = 180
    } else if (global.inputs.keys.right || global.inputs.touch.right) {
        searchDirection = [0, +1]
        playerRotation = 0
    }

    if (searchDirection === null) {
        return
    }
    
    level.player.element.style.setProperty("--rotation", `${playerRotation}deg`)

    const newRow = level.player.position[0] + searchDirection[0]
    const newCol = level.player.position[1] + searchDirection[1]
    const block = level.maze.maze[newRow][newCol]

    if (block === config.walls.mazeCode) {
        return
    }

    for (const upgrade of Object.values(config.upgrades)) {
        if (!upgrade.mazeCode || block !== upgrade.mazeCode) {
            continue
        }

        if (!upgrade.bought()) {
            continue
        }

        const lupgrade = level.upgrades.spawned[`${newRow},${newCol}`]
        const damage = upgrade.onPlayerHit?.(lupgrade.element, [newRow, newCol])
        hitPlayer(damage, 0)

        break
    }

    for (const enemy of Object.values(level.enemies.spawned)) {
        if (enemy.position[0] === newRow && enemy.position[1] === newCol) {
            hitPlayer(config.enemies[enemy.type].lives, config.enemies[enemy.type].coins)
            break
        }
    }

    if (searchDirection[0] !== 0) {
        level.player.element.style.setProperty("--row", newRow)
    }
    
    if (searchDirection[1] !== 0) {
        level.player.element.style.setProperty("--column", newCol)
    }

    level.player.position = [newRow, newCol]

    if (level.player.canMove) {
        level.player.canMove = false
        level.player.timeout = setTimeout(() => {
            level.player.canMove = true
        }, config.player.movingSpeed)
    }
}

function tickEnemyMovement() {
    for (const enemy of Object.values(level.enemies.spawned)) {
        if (!enemy.canMove) {
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

        let triedCounter = -1
        while (triedCounter < 10) {
            triedCounter++

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

            if (level.player.position[0] === newRow && level.player.position[1] === newCol) {
                hitPlayer(config.enemies[enemy.type].lives, config.enemies[enemy.type].coins)
                break
            }

            for (const upgrade of Object.values(config.upgrades)) {
                if (!upgrade.mazeCode || level.maze.maze[newRow][newCol] !== upgrade.mazeCode) {
                    continue
                }
        
                if (!upgrade.bought()) {
                    continue
                }
        
                const lupgrade = level.upgrades.spawned[`${newRow},${newCol}`]
                const damage = upgrade.onEnemyHit?.(lupgrade.element, enemy, [newRow, newCol])
                if (damage) {
                    hitEnemy(enemy)
                }
        
                break
            }

            if (level.maze.maze[newRow][newCol] === config.walls.mazeCode) {
                continue
            }

            let bad = false 
            for (const innerEnemy of Object.values(level.enemies.spawned)) {
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

        if (triedCounter == 10) {
            continue
        }

        enemy.lastDirection = newDirection
        enemy.position[0] = newRow 
        enemy.position[1] = newCol

        if (newDirection[0] !== 0) {
            enemy.element.style.setProperty("--row", newRow)
        }

        if (newDirection[1] !== 0) {
            enemy.element.style.setProperty("--column", newCol)
        }

        if (enemy.canMove) {
            enemy.canMove = false 
            
            enemy.timeout = setTimeout(() => {
                enemy.canMove = true
            }, config.enemies[enemy.type].movingSpeed)
        } 
    }
}

function gameTick() {
    tickPlayerMovement()
    tickEnemyMovement()

    attemptCollectPoint(level.player.position)
    attemptCollectCoin(level.player.position)

    if (level.score === level.maze.maxPoints) {
        endGame(true)
    }
}

function resetState(fullReset=true) {
    clearTimeout(level?.player?.timeout)

    for (const enemy of Object.values(level.enemies ?? {})) {
        clearTimeout(enemy?.timeout)
    }
    
    if (fullReset) {
        global = structuredClone(defaultGlobal)
        level = structuredClone(defaultLevel)
    } else {
        level = structuredClone(defaultLevel)
        global.inputs = structuredClone(defaultGlobal.inputs)
    }
}

function startGame() {
    for (const upgrade of Object.values(config.upgrades)) {
        if (upgrade.bought()) {
            upgrade.onStart?.()
        }
    }

    generateMaze()
    constructMaze()
    constructLeaderboard()
    constructLives()

    level.player.element.dataset.animated = true

    elements.score.innerText = global.player.totalScore
    elements.level.innerText = global.player.level
    elements.coins.innerText = global.player.coins

    global.game.tick = setInterval(gameTick, config.game.tickSpeed)      
    global.game.started = true
}

function endGame(playerWon) {
    if (!global.game.started || global.game.paused) {
        return
    }

    global.game.started = false 
    clearInterval(global.game.tick)

    level.player.element.dataset.animated = false
    level.player.canMove = false
    clearInterval(level.player.timeout)

    for (const enemy of Object.values(level.enemies.spawned)) {
        enemy.canMove = false 
        clearTimeout(enemy.timeout)
    }

    for (const upgrade of Object.values(config.upgrades)) {
        if (upgrade.bought()) {
            upgrade.onEnd?.()
        }
    }

    if (playerWon) {
        constructUpgradeDialog()

        global.player.level++
        elements.level.innerText = global.player.level 

        incrementDifficulty()

        elements.upgradeDialog.show()
    } else {
        if (global.player.totalScore !== 0) {
            const name = prompt("Your name for the leaderboard. Leave empty if you don't want to save your score.")
            if (name != undefined) {
                const trimmed = name.trim()
                if (trimmed !== "") {
                    addLeaderboardEntry(trimmed, global.player.totalScore)
                }   
            }
        }

        elements.restartDialog.show()
    }
}


function pauseGame() {
    if (!global.game.canPause) {
        return 
    }

    if (!global.game.started || global.game.paused) {
        return
    }

    global.game.started = false 
    global.game.paused = true
    clearInterval(global.game.tick)
    
    level.player.element.dataset.animated = false
    level.player.canMove = false
    clearInterval(level.player.timeout)

    for (const enemy of Object.values(level.enemies.spawned)) {
        enemy.canMove = false 
        clearTimeout(enemy.timeout)
    }

    for (const upgrade of Object.values(config.upgrades)) {
        if (upgrade.bought()) {
            upgrade.onPause?.()
        }
    }

    elements.unpauseDialog.show()
}

function unpauseGame() {
    if (global.game.started || !global.game.paused) {
        return
    }

    global.game.paused = false
    global.game.started = true
    global.game.tick = setInterval(gameTick, config.game.tickSpeed)     

    level.player.element.dataset.animated = true
    level.player.canMove = true 

    for (const enemy of Object.values(level.enemies.spawned)) {
        enemy.canMove = true
    }

    for (const upgrade of Object.values(config.upgrades)) {
        if (upgrade.bought()) {
            upgrade.onUnpause?.()
        }
    }
    
    elements.unpauseDialog.close()
}

function loadSnackman() {
    resetState()

    document.addEventListener("keyup", handleKeyUp)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("visibilitychange", handleVisibilityChange)  

    window.addEventListener("blur", handleWindowBlur)
    
    elements.touchUpButton.addEventListener("click", handleTouchButtonClick)
    elements.touchDownButton.addEventListener("click", handleTouchButtonClick)
    elements.touchLeftButton.addEventListener("click", handleTouchButtonClick)
    elements.touchRightButton.addEventListener("click", handleTouchButtonClick)
    
    elements.startDialogStartButton.addEventListener("click", handleStartDialogStart)
    elements.restartDialogRestartButton.addEventListener("click", handleRestartDialogRestart)
    elements.upgradeDialogContinueButton.addEventListener("click", handleUpgradeDialogContinue)
    elements.unpauseDialogUnpauseButton.addEventListener("click", handleUnpauseDialogUnpause)
    
    constructLeaderboard()
    
    elements.restartDialog.close()
    elements.upgradeDialog.close()
    elements.unpauseDialog.close()
    elements.startDialog.show()
}

document.addEventListener("DOMContentLoaded", loadSnackman)

/*

Testing Specific Methods

*/
function testCollectAllPoints() {
    addPoints(level.maze.maxPoints - level.score)
}

function testKillPlayer() {
    hitPlayer(-global.player.lives, 0)
}

function testSpawnEnemyNextRound(enemyId, numberOf) {
    global.enemies[enemyId].numberOf = numberOf
}

function testWinGame() {
    endGame(true)
}

function testFailGame() {
    endGame(false)
}

function testBuyUpgrade(upgradeId) {
    if (config.upgrades[upgradeId].available()) {
        config.upgrades[upgradeId].buy()
        return true 
    }
    return false
}

function testGiveCoins(amount=1000) {
    addCoins(+amount)
}

function testDamagePlayer(amount=1) {
    hitPlayer(-amount, 0)
}

function testRobPlayer(amount=1) {
    hitPlayer(0, -amount)
}

function testDisableEnemyMovement() {
    for (const enemy of Object.values(level.enemies.spawned)) {
        enemy.canMove = false
        clearTimeout(enemy.timeout)
    }
}

function testEnableEnemyMovement() {
    for (const enemy of Object.values(level.enemies.spawned)) {
        enemy.canMove = true
    }
}

function testDisablePausing() {
    global.game.canPause = false
}

function testEnablePausing() {
    global.game.canPause = true
}

function testAddLeaderboardEntry(name, score) {
    addLeaderboardEntry(name, score)
}