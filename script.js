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

/* 

UPGRADES API
============

PROPERTIES
mazeCode int
numberOf int
class string

if mazeCode is present and bought the upgrade will spawn in the maze
numberOf defines the number to be in the maze
class defines the css class the item in the maze will have

METHODS
buy():
global data, level data
no returns
its called when the player buying the item

bought()
global data, level data
no returns

available():
global data, level data
returns bool
its called when the player is attempting to purchase the item

onPlayerDamage():
global data, level data, amount of damage going to be dealt
returns damage to be dealt
its called whenever the player is going to be dealt damage

onRoundStart():
global data, level data
no returns
its called whenever a new round starts

onRoundEnd():
global data, level data
no returns
its called whenever a round has ended

onPlayerCoins():
global data, level data, amount of coins going to be dealt
returns coins to be dealt
its called whenever the player is going to be dealt coins

onPlayerPoints():
global data, level data, amount of points going to be dealt
returns points to be dealt
its called whenever the player is going to be dealt points

onPlayerHit():
global data, level data
returns damage to deal to player, whether the item should be removed from the maze
its called whenever the player hits the item in the maze

onEnemyHit():
global data, level data
returns whether the item should be removed from the maze
its called whenever an enemy hits the item in the maze

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
            lives: -1,
            coins: 0,
            mazeCode: 3,
            startingNumberOf: 1,
            class: "grunt",
        },

        witch: {
            // deals either -1 or +1 lives, deals 0 coins
            movingSpeed: 500, // in ms
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
        },

        robber: {
            // deals 0 lives, deals -1 to -5 coins
            movingSpeed: 500, // in ms
            lives: 0,
            get coins() {
                return -randomInt(1, 5)
            },
            mazeCode: 8,
            startingNumberOf: 0,
            class: "robber",
        },

        crusher: {
            // deals -2 lives, deals 0 coins
            movingSpeed: 1000, // in ms
            lives: -2,
            coins: 0,
            mazeCode: 9,
            startingNumberOf: 0,
            class: "crusher",
        }
    },

    upgrades: {
        shield: {
            name: "Shield",
            description: "A shield that allows you to withstand one collision with an enemy without taking a life. Lasts until used.",
            price: 15, // coins
            buy(global, level) {
                global.upgrades.shield.bought = true
            },
            bought(global, level) {
                return global.upgrades.shield.bought
            },
            available(global, level) {
                return !global.upgrades.shield.bought
            },
            onPlayerDamage(global, level, damage) {
                if (global.upgrades.shield.bought) {
                    global.upgrades.shield.bought = false
                    return 0
                }
                return damage
            },
        },
    
        pointDoubler: {
            name: "Point Doubler",
            description: `Every point you collect is worth double. Used when next level is started.`,
            price: 25, // coins
            buy(global, level) {
                global.upgrades.pointDoubler.bought = true
            },
            bought(global, level) {
                return global.upgrades.pointDoubler.bought
            },
            available(global, level) {
                return !global.upgrades.pointDoubler.bought
            },
            onRoundEnd(global, level) {
                global.upgrades.pointDoubler.bought = false
            },
            onPlayerPoints(global, level, points) {
                console.log(points)
                return points * 2
            },
        },
    
        regeneration: {
            name: "Regeneration",
            description: "Your lives will be reset back to full. Used when next level is started.",
            price: 30,
            buy(global, level) {
                global.upgrades.regeneration.bought = true
            },
            bought(global, level) {
                return global.upgrades.regeneration.bought
            },
            available(global, level) {
                return !global.upgrades.regeneration.bought
            },
            onRoundEnd(global, level) {
                global.upgrades.regeneration.bought = false
            },
            onRoundStart(global, level) {
                global.player.lives = config.player.startingLives
            },
        },
    
        jelly: {
            name: "Jelly",
            description: "Randomly spawns a plate of jelly that causes enemies to get stuck for 5 seconds. If you encounter the jelly you eat it and its remove it from the maze. Used when next level is started.",
            price: 10,
            mazeCode: 5,
            bought: false,
            numberOf: 1,
            class: "jelly",
            buy(global, level) {
                global.upgrades.jelly.bought = true
            },
            bought(global, level) {
                return global.upgrades.jelly.bought
            },
            available(global, level) {
                return !global.upgrades.jelly.bought
            },
            onRoundEnd(global, level) {
                global.upgrades.jelly.bought = false
            },
            onPlayerHit(global, level) {
                // if hit the player cannot move for 2 seconds and no lives added, its not removed afterwards
                level.player.canMove = false
    
                setTimeout(() => {
                    level.player.canMove = true
                }, 2000)
    
                return [0, false]
            },
            onEnemyHit(global, enemy) {
                // if an enemy hits it cannot move for 5 seconds. its not removed afterwards
                enemy.canMove = false 
    
                setTimeout(() => {
                    enemy.canMove = true
                }, 5000)
    
                return false
            }
        },
    
        bomb: {
            // can spawn in the maze, deals -1 lives when hit
            name: "Bomb",
            description: "Randomly spawns a bomb that causes both you and enemies to become damaged when encountered. Once detonated its removed from the maze. Used when next level is started.",
            price: 5,
            mazeCode: 6,
            numberOf: 1,
            class: "bomb",
            buy(global, level) {
                data.upgrades.bomb.bought = true
            },
            bought(global, level) {
                return global.upgrades.bomb.bought
            },
            available(global, level) {
                return !data.upgrades.bomb.bought
            },
            onRoundEnd(global, level) {
                data.upgrades.bomb.bought = false
            },
            onPlayerHit(global, level) {
                // if hit the player cannot move for 2 seconds and -1 lives added, its removed afterwards
                data.player.canMove = false
    
                setTimeout(() => {
                    data.player.canMove = true
                }, 2000)
    
                return [-1, true]
            },
            onEnemyHit(data, enemy) {
                // if an enemy hits it cannot move for 5 seconds. its removed afterwards
                enemy.canMove = false 
    
                setTimeout(() => {
                    enemy.canMove = true
                }, 5000)
    
                return true
            }
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
                // }
            ]
        }
        for (const [id, enemy] of Object.entries(config.enemies)) {
            enemies[id] = {
                canMove: true,
                timeout: null,
            }
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

function handleShopDialogContinue(e) {
    resetState(false)
    startGame()
    elements.shopDialog.close()
}

// function handleShopPurchase(e) {
//     const item = shopItems[e.target.dataset.itemIndex]

//     if (data.player.coins < item.price) {
//         alert("Failed to purchase item because you don't have enough coins.")
//         return
//     }

//     data.player.coins -= item.price
//     data.upgrades[item.id].owned = true

//     alert("Successfully purchased item!")

//     resetState(false)
//     startGame()

//     elements.shopDialog.close()
// }

function handleKeyDown(e) {
    if (!global?.game?.started) {
        return
    }

    const wanted = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"]
    if (!wanted.includes(e.key)) {
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
    if (!global?.game?.started) {
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
    if (!global?.game?.started) {
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

    for (const [upgradeId, upgrade] of Object.entries(config.upgrades)) {
        if (!upgrade.mazeCode) {
            continue
        }

        if (!global.upgrades[upgradeId].bought) {
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

    const enemies = []
    const coins = []
    const points = []
    const upgrades = []
    let player

    for (let row = 0; row < global.maze.size; row++) {
        for (let col = 0; col < global.maze.size; col++) {
            let block

            switch (level.maze.maze[row][col]) {
                case config.walls.mazeCode: {
                    block = constructWall()
                    break
                }
                case config.points.mazeCode: {
                    block = constructPoint()
                    points.push({
                        element: block,
                        position: [row, col],
                        collected: false,
                    })
                    break
                }
                case config.coins.mazeCode: {
                    block = constructCoin()
                    coins.push({
                        element: block,
                        position: [row, col],
                        collected: false,
                    })
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
                            enemies.push({
                                element: block,
                                type: enemyId,
                                lastDirection: [0, 0],
                                position: [row, col],
                                canMove: false,
                            }) 
                            wasEnemy = true
                            break
                        }
                    }

                    if (!wasEnemy) {
                        for (const [upgradeId, upgrade] of Object.entries(config.upgrades)) {
                            if (level.maze.maze[row][col] === upgrade?.mazeCode) {
                                block = constructUpgrade(upgrade)
                                upgrades.push({
                                    element: block,
                                    type: upgradeId,
                                    position: [row, col]
                                })
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

function addCoins(coins) {
    for (const [upgradeId, upgrade] of Object.entries(config.upgrades)) {
        if (upgrade.bought(global, level)) {
            coins = upgrade.onPlayerCoins?.(global, level, coins)
        }
    }

    global.player.coins += coins
    
    elements.coins.innerText = global.player.coins
}

function addPoints(points) {
    for (const [upgradeId, upgrade] of Object.entries(config.upgrades)) {
        if (upgrade.bought(global, level)) {
            points = upgrade.onPlayerPoints?.(global, level, points)
        }
    }

    global.player.totalScore += points
    level.score += points

    elements.score.innerText = global.player.totalScore
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

    // for (const enemy of data.enemies.enemies) {
    //     if (enemy.position[0] === newRow && enemy.position[1] == newCol) {
    //         hitPlayer(enemy.type)
    //         break
    //     }
    // }

    // if (
    //     data.upgrades.bomb.position[0] === newRow && 
    //     data.upgrades.bomb.position[1] === newCol && 
    //     !data.upgrades.bomb.detonated
    // ) {
    //     damagePlayer(settings.upgrades.bomb.damage)
    //     elements.bomb.dataset.detonated = true
    //     data.upgrades.bomb.detonated = true
    // }

    // if (
    //     data.upgrades.jelly.position[0] === newRow && 
    //     data.upgrades.jelly.position[1] === newCol &&
    //     !data.upgrades.jelly.eaten
    // ) {
    //     elements.jelly.dataset.eaten = true
    //     data.upgrades.jelly.eaten = true
    // }

    if (searchDirection[0] !== 0) {
        level.player.element.style.setProperty("--row", newRow)
    }
    
    if (searchDirection[1] !== 0) {
        level.player.element.style.setProperty("--column", newCol)
    }

    level.player.position = [newRow, newCol]

    level.player.canMove = false
    level.player.timeout = setTimeout(() => {
        level.player.canMove = true
    }, config.player.movingSpeed)
}

function gameTick() {
    // tickEnemyMovement()
    tickPlayerMovement()
    
    // collectPoint(level.player.position)
    // collectCoin(level.player.position)

    if (level.score === level.maze.maxPoints) {
        endGame(true)
    }
}

function resetState(fullReset=true) {
    clearTimeout(level?.player?.timeout)

    for (const [enemyId, enemy] of Object.entries(level.enemies ?? {})) {
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
    for (const [upgradeId, upgrade] of Object.entries(config.upgrades)) {
        upgrade.onRoundStart?.(global, level)
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

function loadSnackman() {
    resetState()

    document.addEventListener("keyup", handleKeyUp)
    document.addEventListener("keydown", handleKeyDown)  
    
    elements.touchUpButton.addEventListener("click", handleTouchButtonClick)
    elements.touchDownButton.addEventListener("click", handleTouchButtonClick)
    elements.touchLeftButton.addEventListener("click", handleTouchButtonClick)
    elements.touchRightButton.addEventListener("click", handleTouchButtonClick)
    
    elements.startDialogStartButton.addEventListener("click", handleStartDialogStart)
    elements.restartDialogRestartButton.addEventListener("click", handleRestartDialogRestart)
    // elements.shopDialogContinueButton.addEventListener("click", handleShopDialogContinue)
    
    // constructLeaderboard()
    
    elements.restartDialog.close()
    // elements.shopDialog.close()
    elements.startDialog.show()
}

document.addEventListener("DOMContentLoaded", loadSnackman)


// let data = {}

// function handleStartDialogStart(e) {
//     resetState()
//     startGame()
//     elements.startDialog.close()
// }

// function handleRestartDialogRestart(e) {
//     resetState()
//     startGame()
//     elements.restartDialog.close()
// }

// function handleShopDialogContinue(e) {
//     resetState(false)
//     startGame()
//     elements.shopDialog.close()
// }

// function handleShopPurchase(e) {
//     const item = shopItems[e.target.dataset.itemIndex]

//     if (data.player.coins < item.price) {
//         alert("Failed to purchase item because you don't have enough coins.")
//         return
//     }

//     data.player.coins -= item.price
//     data.upgrades[item.id].owned = true

//     alert("Successfully purchased item!")

//     resetState(false)
//     startGame()

//     elements.shopDialog.close()
// }

// function constructShopDialog() {
//     elements.shopDialogItemsContainer.innerHTML = ""

//     elements.shopDialogLevelDisplay.innerText = data.player.level

//     const nonPurchasedItems = shopItems.filter((item) => !data.upgrades[item.id].owned)
//     const used = []
//     for (let i = 0; i < Math.min(3, nonPurchasedItems.length); i++) {
//         let index = randomInt(0, nonPurchasedItems.length - 1)
//         while (used.includes(index)) {
//             index = randomInt(0, nonPurchasedItems.length - 1)
//         }
//         used.push(index)

//         const container = document.createElement("button")
//         container.dataset.itemIndex = index 
//         container.addEventListener("click", handleShopPurchase)

//         const label = document.createElement("h1")
//         label.classList.add("label")
//         label.innerText = `${nonPurchasedItems[index].name} [${nonPurchasedItems[index].price} Coins]`
//         container.appendChild(label)

//         const description = document.createElement("p")
//         description.classList.add("description")
//         description.innerText = `${nonPurchasedItems[index].description}`
//         container.appendChild(description)

//         elements.shopDialogItemsContainer.appendChild(container)
//     }

//     if (nonPurchasedItems.length === 0) {
//         const p = document.createElement("p")
//         p.innerText = "No items avaliable to purchase."
//         elements.shopDialogItemsContainer.appendChild(p)
//     }
// }

// function resetState(fullReset=true) {
//     if (data?.player?.movingTimeout) {
//         clearTimeout(data.player.movingTimeout)
//     }

//     if (data?.enemies?.movingTimeout) {
//         clearTimeout(data.enemies.grunts.movingTimeout)
//     }

//     if (fullReset) {
//         data = structuredClone(defaultData)
//     } else {
//         data.player.moving = false 
//         data.player.invincible = false
//         data.enemies = structuredClone(defaultData.enemies)
//         data.points = structuredClone(defaultData.points)
//         data.level = structuredClone(defaultData.level)
//         data.coins = structuredClone(defaultData.coins)
//         data.inputs = structuredClone(defaultData.inputs)
//     }
// }



// function finishGame(playerWon) {
//     if (!data.game?.started) {
//         return
//     }

//     elements.player.dataset.animated = false

//     data.game.started = false 
//     clearInterval(data.game.tick)

//     if (playerWon) {
//         data.upgrades.pointDoubler.owned = false
//         data.upgrades.bomb.owned = false 
//         data.upgrades.jelly.owned = false
//         data.upgrades.regeneration.owned = false
        
//         constructShopDialog()

//         data.player.level++
//         elements.level.innerText = data.player.level 

//         incrementDifficulty()

//         elements.shopDialog.show()
//     } else {
//         const name = prompt("Your name for the leaderboard. Leave empty if you don't want to save your score.")

//         if (name !== null && name !== "") {
//             data.leaderboard.push({
//                 name: name.trim(),
//                 score: data.player.totalScore
//             })
//             localStorage.setItem(settings.leaderboard.storageKey, JSON.stringify(data.leaderboard))

//             constructLeaderboard()
//         }

//         elements.restartDialog.show()
//     }
// } 

// function incrementDifficulty() {
//     if ((data.player.level + 1) % 2 === 0) {
//         data.maze.numberOf.grunts++
//         data.maze.size++ 
//     }
// }

// function debugGiveAllPoints() {
//     let pointsLeftToCollect = data.maze.maxPoints - data.level.score
//     data.level.score += pointsLeftToCollect
//     data.player.totalScore += pointsLeftToCollect
//     elements.score.innerText = data.player.totalScore
    
//     for (const point of elements.points) {
//         point.dataset.collected = true 
//     }

//     for (const point of data.points) {
//         point.collected = true
//     }

//     finishGame(true)
// }

// function debugSetPlayerCoins(newCoinsValue) {
//     data.player.coins = newCoinsValue
//     elements.coins.innerText = data.player.coins
// }

// function hitPlayer(enemyType) {
//     let enemySetting
//     switch (enemyType) {
//         case mazeCodes.grunt: {
//             damagePlayer(settings.enemies.grunts.damage)
//             break
//         }
//         case mazeCodes.witch: {
//             break
//         }
//         case mazeCodes.robber: {
//             const toTake = randomInt(
//                 settings.enemies.robbers.coinsToTake.min,
//                 settings.enemies.robbers.coinsToTake.max
//             )
    
//             if (data.player.coins - toTake < 0) {
//                 data.player.coins = 0
//             } else {
//                 data.player.coints -= toTake
//             }
    
//             elements.coins.innerText = data.player.coins

//             break
//         }
//         case mazeCodes.crusher: {
//             damagePlayer(settings.enemies.crushers.damage)
//             break
//         }
//     }
// }

// // takes a life from the player
// // if there are 0 lives left the player is killed and the game ends
// function damagePlayer(damage) {
//     if (data.player.invincible) {
//         return
//     }

//     if (data.upgrades.shield.owned) {
//         data.upgrades.shield.owned = false
//         alert("You used your shield!")
//         return
//     }

//     data.player.lives += damage
//     constructLives()

//     if (data.player.lives > 0) {
//         elements.player.dataset.hit = true
//         data.player.invincible = true 

//         setTimeout(() => {
//             data.player.invincible = false 
//             elements.player.dataset.hit = false
//         }, settings.player.durations.invincible)
//     } else {
//         elements.player.dataset.dead = true
//         data.player.invincible = true 

//         setTimeout(() => {
//             finishGame(false)
//         }, settings.player.durations.invincible)
//     }
// }

// // if there is a point, collect it and increment score otherwise do nothing
// function collectPoint(row, col) {
//     for (const point of data.points) {
//         if (
//             point.position[0] === row && 
//             point.position[1] === col && 
//             !point.collected
//         ) {
//             const pointElement = document.getElementById(point.id)
//             pointElement.dataset.collected = true
//             point.collected = true
    
//             let incrementValue = 1
//             if (data.upgrades.pointDoubler.owned) {
//                 incrementValue *= 2
//             }

//             data.level.score += incrementValue
//             data.player.totalScore += incrementValue
//             elements.score.innerText = data.player.totalScore
//             break
//         }
//     }
// }

// function collectCoin(row, col) {
//     for (const coin of data.coins) {
//         if (
//             coin.position[0] === row && 
//             coin.position[1] === col && 
//             !coin.collected
//         ) {
//             const coinElement = document.getElementById(coin.id)
//             coinElement.dataset.collected = true
//             coin.collected = true
    
//             data.player.coins++
//             elements.coins.innerText = data.player.coins
//             break
//         }
//     }
// }

// function tickEnemyMovement() {
//     let gruntMoved = false
//     let robberMoved = false
//     let witchMoved = false 
//     let crusherMoved = false

//     for (const enemy of data.enemies.enemies) {
//         if (enemy.stuck || enemy.damaged) {
//             continue
//         }

//         if (enemy.type === mazeCodes.grunt  && data.enemies.grunts.moving) {
//             continue
//         } else {
//             gruntMoved = true
//         }

//         if (enemy.type === mazeCodes.robber  && data.enemies.robbers.moving) {
//             continue
//         } else {
//             robberMoved = true
//         }

//         if (enemy.type === mazeCodes.witch  && data.enemies.witches.moving) {
//             continue
//         } else {
//             witchMoved = true
//         }

//         if (enemy.type === mazeCodes.crusher  && data.enemies.crushers.moving) {
//             continue
//         } else {
//             crusherMoved = true
//         }
        
//         // makes the enemy most likely to continue on its current path, makes it very rare it goes back the way it came
//         const probabilityMatrices = {
//             "-1,0": [
//                 [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0], [-1,0],
//                 [+1,0],
//                 [0,-1], [0,-1], [0,-1], [0,-1],
//                 [0,+1], [0,+1], [0,+1], [0,+1],
//             ],
//             "1,0": [
//                 [-1,0],
//                 [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0], [+1,0],
//                 [0,-1], [0,-1], [0,-1], [0,-1],
//                 [0,+1], [0,+1], [0,+1], [0,+1],
//             ], 
//             "0,-1": [
//                 [-1,0], [-1,0], [-1,0], [-1,0],
//                 [+1,0], [+1,0], [+1,0], [+1,0],
//                 [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1], [0,-1],
//                 [0,+1],
//             ],
//             "0,1": [
//                 [-1,0], [-1,0], [-1,0], [-1,0],
//                 [+1,0], [+1,0], [+1,0], [+1,0],
//                 [0,-1],
//                 [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1], [0,+1],
//             ],
//             "0,0": [
//                 [-1,0],
//                 [+1,0],
//                 [0,-1],
//                 [0,+1],
//             ]
//         }

//         if (enemy.lastDirection === undefined) {
//             enemy.lastDirection = [0, 0]
//         }

//         const matrixKey = `${enemy.lastDirection[0]},${enemy.lastDirection[1]}`
//         const probabilityMatrix = probabilityMatrices[matrixKey]

//         let newDirection = null
//         let newRow = null
//         let newCol = null
        
//         const triedDirections = {}

//         while (true) {
//             newDirection = probabilityMatrix[randomInt(0, probabilityMatrix.length - 1)]
//             newRow = enemy.position[0] + newDirection[0]
//             newCol = enemy.position[1] + newDirection[1]

//             if (Object.keys(triedDirections).length === probabilityMatrices.length) {
//                 newRow = enemy.position[0]
//                 newCol = enemy.position[1]
//                 break
//             }

//             const key = `${newRow},${newCol}`
//             if (key in triedDirections) {
//                 continue
//             }
//             triedDirections[key] = true

//             if (data.player.position[0] === newRow && data.player.position[1] === newCol) {
//                 // we hit a player, so damage the player and dont move into the spot
//                 hitPlayer(enemy.type)
//                 break
//             }

//             if (
//                 data.upgrades.bomb.position[0] === newRow && 
//                 data.upgrades.bomb.position[1] === newCol && 
//                 !data.upgrades.bomb.detonated
//             ) {
//                 enemy.damaged = true

//                 switch (enemy.type) {
//                     case mazeCodes.grunt: {
//                         setTimeout(() => {
//                             enemy.damaged = false
//                         }, settings.enemies.grunts.durations.damaged);
//                         break
//                     } 
//                     case mazeCodes.robber: {
//                         setTimeout(() => {
//                             enemy.damaged = false
//                         }, settings.enemies.robbers.durations.damaged);
//                         break
//                     } 
//                     case mazeCodes.witch: {
//                         setTimeout(() => {
//                             enemy.damaged = false
//                         }, settings.enemies.witches.durations.damaged);
//                         break
//                     } 
//                     case mazeCodes.crusher: {
//                         setTimeout(() => {
//                             enemy.damaged = false
//                         }, settings.enemies.crushers.durations.damaged);
//                         break
//                     } 
//                 }

//                 elements.bomb.dataset.detonated = true
//                 data.upgrades.bomb.detonated = true

//                 break
//             }
    
//             if (
//                 data.upgrades.jelly.position[0] === newRow && 
//                 data.upgrades.jelly.position[1] === newCol &&
//                 !data.upgrades.jelly.eaten
//             ) {
//                 enemy.stuck = true

//                 switch (enemy.type) {
//                     case mazeCodes.grunt: {
//                         setTimeout(() => {
//                             enemy.stuck = false
//                         }, settings.enemies.grunts.durations.stuck);
//                         break
//                     } 
//                     case mazeCodes.robber: {
//                         setTimeout(() => {
//                             enemy.stuck = false
//                         }, settings.enemies.robbers.durations.stuck);
//                         break
//                     } 
//                     case mazeCodes.witch: {
//                         setTimeout(() => {
//                             enemy.stuck = false
//                         }, settings.enemies.witches.durations.stuck);
//                         break
//                     } 
//                     case mazeCodes.crusher: {
//                         setTimeout(() => {
//                             enemy.stuck = false
//                         }, settings.enemies.crushers.durations.stuck);
//                         break
//                     } 
//                 }

//                 break
//             }

//             if (data.maze.maze[newRow][newCol] === mazeCodes.wall) {
//                 continue
//             }

//             let bad = false 
//             for (const innerEnemy of data.enemies.enemies) {
//                 if (innerEnemy.position[0] === newRow && innerEnemy.position[1] === newCol) {
//                     bad = true
//                     break
//                 }
//             }

//             if (bad) {
//                 continue
//             }

//             break
//         }

//         enemy.lastDirection = newDirection
//         enemy.position[0] = newRow 
//         enemy.position[1] = newCol

//         const element = document.getElementById(enemy.id)

//         if (newDirection[0] !== 0) {
//             element.style.setProperty("--row", newRow)
//         }

//         if (newDirection[1] !== 0) {
//             element.style.setProperty("--column", newCol)
//         }
//     }

//     if (gruntMoved) {
//         data.enemies.grunts.moving = true
//         data.enemies.grunts.movingTimeout = setTimeout(() => {
//             data.enemies.grunts.moving = false
//         }, settings.enemies.grunts.durations.moving)
//     }

//     if (witchMoved) {
//         data.enemies.witches.moving = true
//         data.enemies.witches.movingTimeout = setTimeout(() => {
//             data.enemies.witches.moving = false
//         }, settings.enemies.witches.durations.moving)
//     }

//     if (robberMoved) {
//         data.enemies.robbers.moving = true
//         data.enemies.robbers.movingTimeout = setTimeout(() => {
//             data.enemies.robbers.moving = false
//         }, settings.enemies.robbers.durations.moving)
//     }

//     if (crusherMoved) {
//         data.enemies.crushers.moving = true
//         data.enemies.crushers.movingTimeout = setTimeout(() => {
//             data.enemies.crushers.moving = false
//         }, settings.enemies.crushers.durations.moving)
//     }
// }



// function loadSnackman() {
//     document.addEventListener("keyup", handleKeyUp)
//     document.addEventListener("keydown", handleKeyDown)  
    
//     elements.touchUpButton.addEventListener("click", handleTouchButtonClick)
//     elements.touchDownButton.addEventListener("click", handleTouchButtonClick)
//     elements.touchLeftButton.addEventListener("click", handleTouchButtonClick)
//     elements.touchRightButton.addEventListener("click", handleTouchButtonClick)
    
//     elements.startDialogStartButton.addEventListener("click", handleStartDialogStart)
//     elements.restartDialogRestartButton.addEventListener("click", handleRestartDialogRestart)
//     elements.shopDialogContinueButton.addEventListener("click", handleShopDialogContinue)
    
//     constructLeaderboard()
    
//     elements.restartDialog.close()
//     elements.shopDialog.close()
//     elements.startDialog.show()
// }

// document.addEventListener("DOMContentLoaded", loadSnackman)

// resetState()