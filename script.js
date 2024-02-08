/*

# Snackman Game

## Start
The game only starts when the user presses the start button. It will disappear when the game has
started.


## Player
Players can move every 500ms. Inputs are only accepted when the game has started. The player can 
only move into points, enemies, enemy spawn locations and the player spawn location. If WASD or the 
arrow keys are held, the player will move every 500ms. Individual WASD or arrow key inputs are only 
accepted if the player is able to move (500ms after they last moved). The onscreen arrows stay 
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
mazeSize * Math.floor(playersLevel / 6) + 1. 

The maximum number of walls (not including the outside walls) is: 
mazeSize * 1.5 * Math.floor(this.playerLevel / 3) + 1.

After every level increase, the number of enemies increases by 1 provided the maze has less than 30%
of its blocks being enemy spawners. After every 3 levels, the maze size is increased by 2 and an 
additonal enemy is added (alongside the enemy for level increase).

*/

class SnackmanGame {
    // onscreen arrow states
    upButtonActive = false 
    downButtonActive = false 
    leftButtonActive = false 
    rightButtonActive = false

    // key states
    upKeyActive = false 
    downKeyActive = false 
    leftKeyActive = false 
    rightKeyActive = false

    mazeElement
    playerElement
    upButtonElement
    downButtonElement
    leftButtonElement
    rightButtonElement
    startButtonRootElement
    startButtonElement
    restartButtonRootElement
    restartButtonElement
    nextLevelOrQuitButtonRootElement
    nextLevelButtonElement
    quitButtonElement
    leaderboardElement
    scoreElement
    livesElement
    levelElement

    pointElements = []
    lifeElements = {}
    enemyElements = []
    enemyData = []

    leaderboard = []
    leaderboardStorageKey = "snackman:leaderboard"
    leaderboardDisplayLimit = 5 // how many entries to display, all are stored

    playerStartingPosition = [0, 0] // row, col
    playerPosition = [0, 0] // row, col
    playerMovingDuration = 500 // ms
    playerMoving = false
    playerInvincibleDuration = 1500 // ms
    playerInvincible = false
    playerStartingLives = 3
    playerLives = 0
    playerLevel = 1
    playerScore = 0
    playerTotalScore = 0

    enemiesMovingDuration = 500 // ms
    enemiesMoving = false

    mazeStartingSize = 10 // number of blocks per row and col
    mazeStartingNumberOfEnemies = 1
    mazeSize = 0
    mazeNumberOfEnemies = 0
    mazeMaxPoints
    mazeWallCode = 1
    mazePlayerCode = 2
    mazeEnemyCode = 3
    mazePointCode = 0
    maze 

    gameTickInterval
    gameTickSpeed = 10 // ms

    blockSizeInPixels
    started 

    constructor() {
        this.mazeElement = document.getElementById("maze")
        this.upButtonElement = document.getElementById("upButton")
        this.downButtonElement = document.getElementById("downButton")
        this.leftButtonElement = document.getElementById("leftButton")
        this.rightButtonElement = document.getElementById("rightButton")
        this.startButtonRootElement = document.getElementById("startButtonRoot")
        this.startButtonElement = document.getElementById("startButton")
        this.restartButtonRootElement = document.getElementById("restartButtonRoot")
        this.restartButtonElement = document.getElementById("restartButton")
        this.nextLevelOrQuitButtonRootElement = document.getElementById("nextLevelOrQuitButtonRoot")
        this.nextLevelButtonElement = document.getElementById("nextLevelButton")
        this.quitButtonElement = document.getElementById("quitButton")
        this.leaderboardElement = document.getElementById("leaderboard")
        this.scoreElement = document.getElementById("score")
        this.livesElement = document.getElementById("lives")
        this.levelElement = document.getElementById("level")

        // .bind(this) ensures the context for `this` is correct
        // javascript is weird
        document.addEventListener("keyup", this.eventHandleKeyUp.bind(this))
        document.addEventListener("keydown", this.eventHandleKeyDown.bind(this))
        this.upButtonElement.addEventListener("click", this.eventHandleUpButtonClick.bind(this))
        this.downButtonElement.addEventListener("click", this.eventHandleDownButtonClick.bind(this))
        this.leftButtonElement.addEventListener("click", this.eventHandleLeftButtonClick.bind(this))
        this.rightButtonElement.addEventListener("click", this.eventHandleRightButtonClick.bind(this))
        this.startButtonElement.addEventListener("click", this.eventHandleStartButtonClick.bind(this))
        this.restartButtonElement.addEventListener("click", this.eventHandleRestartButtonClick.bind(this))
        this.nextLevelButtonElement.addEventListener("click", this.eventHandleNextLevelButtonClick.bind(this))
        this.quitButtonElement.addEventListener("click", this.eventHandleQuitButtonClick.bind(this))

        this.playerScore = 0
        this.playerLives = this.playerStartingLives
        this.mazeSize = this.mazeStartingSize
        this.mazeNumberOfEnemies = this.mazeStartingNumberOfEnemies

        this.generateMaze()
        this.buildMazeInHTML()
        this.buildLivesInHTML()
        this.buildLeaderboardInHTML()

        // add debug methods to window so they can be access using devtools to speed up development
        window.debugGiveAllPoints = this.debugGiveAllPoints.bind(this)

        // get the float width of a block
        this.blockSizeInPixels = this.mazeElement.children[0].getBoundingClientRect().width
    }

    debugGiveAllPoints() {
        let pointsLeftToCollect = this.mazeMaxPoints - this.playerScore
        this.playerScore += pointsLeftToCollect
        this.playerTotalScore += pointsLeftToCollect
        this.scoreElement.innerText = this.playerTotalScore
        
        for (let pointsRow of this.pointElements) {
            for (let point of pointsRow) {
                if (point !== undefined) {
                    point.classList.add("obtained")
                }
            }
        }
    }

    eventHandleKeyDown(event) {
        if (this.started) {
            // only accept inputs when game has started
            this.upKeyActive = event.key === "ArrowUp" || event.key === "w"
            this.downKeyActive = event.key === "ArrowDown" || event.key === "s"
            this.leftKeyActive = event.key === "ArrowLeft" || event.key === "a"
            this.rightKeyActive = event.key === "ArrowRight" || event.key === "d"

            if (this.upKeyActive || this.downKeyActive || this.leftKeyActive || this.rightKeyActive) {
                // the key pressed was from WASD keys or Arrow Keys so cancel onscreen buttons
                this.upButtonActive = false 
                this.downButtonActive = false
                this.leftButtonActive = false 
                this.rightButtonActive = false
                this.upButtonElement.dataset.pressed = "false"
                this.downButtonElement.dataset.pressed = "false"
                this.leftButtonElement.dataset.pressed = "false"
                this.rightButtonElement.dataset.pressed = "false"
            }
        }
    }

    eventHandleKeyUp(event) {
        if (this.started) {
            // if the key then set value to false, otherwise set it to itself to preserve its value
            this.upKeyActive = (event.key === "ArrowUp" || event.key === "w") ? false: this.upKeyActive
            this.downKeyActive = (event.key === "ArrowDown" || event.key === "s") ? false: this.downKeyActive
            this.leftKeyActive = (event.key === "ArrowLeft" || event.key === "a") ? false: this.leftKeyActive
            this.rightKeyActive = (event.key === "ArrowRight" || event.key === "d") ? false: this.rightKeyActive 
        }
    }

    eventHandleUpButtonClick() {
        if (this.started) {
            // only accept inputs when game has started
            this.upButtonActive = !this.upButtonActive
            this.downButtonActive = false 
            this.leftButtonActive = false 
            this.rightButtonActive = false
            this.upButtonElement.dataset.pressed = this.upButtonActive
            this.downButtonElement.dataset.pressed = "false"
            this.leftButtonElement.dataset.pressed = "false"
            this.rightButtonElement.dataset.pressed = "false"
        }
    }

    eventHandleDownButtonClick() {
        if (this.started) {
            // only accept inputs when game has started
            this.downButtonActive = !this.downButtonActive
            this.upButtonActive = false 
            this.leftButtonActive = false 
            this.rightButtonActive = false
            this.downButtonElement.dataset.pressed = this.downButtonActive
            this.upButtonElement.dataset.pressed = "false"
            this.leftButtonElement.dataset.pressed = "false"
            this.rightButtonElement.dataset.pressed = "false"
        }
    }

    eventHandleLeftButtonClick() {
        if (this.started) {
            // only accept inputs when game has started
            this.leftButtonActive = !this.leftButtonActive
            this.upButtonActive = false 
            this.downButtonActive = false 
            this.rightButtonActive = false
            this.leftButtonElement.dataset.pressed = this.leftButtonActive
            this.upButtonElement.dataset.pressed = "false"
            this.downButtonElement.dataset.pressed = "false"
            this.rightButtonElement.dataset.pressed = "false"
        }
    }

    eventHandleRightButtonClick() {
        if (this.started) {
            // only accept inputs when game has started
            this.rightButtonActive = !this.rightButtonActive
            this.upButtonActive = false 
            this.downButtonActive = false 
            this.leftButtonActive = false
            this.rightButtonElement.dataset.pressed = this.rightButtonActive
            this.upButtonElement.dataset.pressed = "false"
            this.downButtonElement.dataset.pressed = "false"
            this.leftButtonElement.dataset.pressed = "false"
        }
    }

    eventHandleStartButtonClick() {
        this.startGame()
        this.startButtonRootElement.classList.add("hidden")
    }

    eventHandleRestartButtonClick() {
        this.resetGame()
        this.startGame()
        this.restartButtonRootElement.classList.add("hidden")
    }

    eventHandleNextLevelButtonClick() {
        this.playerLevel++
        this.levelElement.innerText = this.playerLevel
        this.increaseDifficulty()
        this.resetGame(false)
        this.startGame()
        this.nextLevelOrQuitButtonRootElement.classList.add("hidden")
    }

    eventHandleQuitButtonClick() {
        this.saveScore()
        this.resetGame()
        this.nextLevelOrQuitButtonRootElement.classList.add("hidden")
        this.startButtonRootElement.classList.remove("hidden")
    }

    // includes max
    randomInt(min, max) {
        return Math.floor(Math.random() * (max + 1 - min)) + min;
    }

    readLeaderboard() {
        this.leaderboard = JSON.parse(localStorage.getItem(this.leaderboardStorageKey)) || []
    }

    writeLeaderboard() {
        this.leaderboard = localStorage.setItem(this.leaderboardStorageKey, JSON.stringify(this.leaderboard))
    }

    saveScore() {
        this.leaderboard.push({
            name: prompt("Enter your name for the leaderboard."),
            score: this.playerTotalScore,
        })
        this.writeLeaderboard()
        this.buildLeaderboardInHTML()
    }

    increaseDifficulty() {
        let moreEnemeies = (this.maze.length * this.maze.length) * 0.3 > this.mazeNumberOfEnemies

        if ((this.playerLevel % 3) === 0) {
            // is a multiple of 3
            this.mazeSize += 2
            this.mazeNumberOfEnemies++
        }

        if (moreEnemeies) {
            this.mazeNumberOfEnemies++
        }
    }

    generateMaze() {
        this.maze = []
        this.mazeMaxPoints = 0

        let numberOfWalls = this.randomInt(
            this.mazeSize * Math.floor((this.playerLevel / 6) + 1), 
            this.mazeSize * 1.5 * (Math.floor(this.playerLevel / 3) + 1),
        )
        let maze = []

        for (let row = 0; row < this.mazeSize; row++) {
            let rowBlocks = []
            if (row === 0 || row === this.mazeSize - 1) {
                // first and last row should be all walls
                for (let col = 0; col < this.mazeSize; col++) {
                    rowBlocks[col] = this.mazeWallCode
                }
            } else {
                for (let col = 0; col < this.mazeSize; col++) {
                    if (col === 0 || col === this.mazeSize - 1) {
                        // first and last column should be all walls
                        rowBlocks[col] = this.mazeWallCode
                    } else {
                        rowBlocks[col] = this.mazePointCode
                    }
                }
            }
            maze[row] = rowBlocks
        }

        for (let i = 0; i < numberOfWalls; i++) {
            let randRow = this.randomInt(1, this.mazeSize - 2)
            let randCol = this.randomInt(1, this.mazeSize - 2)
            if (maze[randRow][randCol] === this.mazePointCode) {
                // override point
                maze[randRow][randCol] = this.mazeWallCode
            } else {
                // a enemy cannot be placed so subtract one so it wont get missed
                i--
            }
        }

        for (let i = 0; i < this.mazeNumberOfEnemies; i++) {
            let randRow = this.randomInt(1, this.mazeSize - 2)
            let randCol = this.randomInt(1, this.mazeSize - 2)
            if (maze[randRow][randCol] === this.mazePointCode) {
                // override point
                maze[randRow][randCol] = this.mazeEnemyCode
            } else {
                // a enemy cannot be placed so subtract one so it wont get missed
                i--
            }
        }

        while (true) {
            let randRow = this.randomInt(1, this.mazeSize - 2)
            let randCol = this.randomInt(1, this.mazeSize - 2)
            if (maze[randRow][randCol] === this.mazePointCode) {
                maze[randRow][randCol] = this.mazePlayerCode
                this.playerStartingPosition = [randRow, randCol]
                this.playerPosition = [randRow, randCol]
                break
            } else {
                // the player cannot be placed so continue
                continue
            }
        }

        let totalPoints = 0
        let totalBlocks = 0
        let reachableBlocks = 0
        let mazeCopy = structuredClone(maze)
        let startedSearch = false
        for (let row = 0; row < maze.length; row++) {
            for (let col = 0; col < maze.length; col++) {
                if (maze[row][col] !== this.mazeWallCode) {
                    totalBlocks++
                }

                if (maze[row][col] === this.mazePointCode) {
                    if (startedSearch === false) {
                        startedSearch = true

                        // implementation of a 4 direction flood fill algorithm to find reachable blocks (any block that isnt a wall)
                        let stack = [[row, col]]
                        while (stack.length > 0) {
                            let [ffRow, ffCol] = stack.pop()

                            if (mazeCopy[ffRow][ffCol] === this.mazeWallCode) {
                                continue
                            }

                            reachableBlocks++
                            mazeCopy[ffRow][ffCol] = this.mazeWallCode

                            if (ffRow + 1 < mazeCopy.length) {
                                stack.push([ffRow + 1, ffCol])
                            }
                
                            if (ffRow - 1 > 0) {
                                stack.push([ffRow - 1, ffCol])
                            }
                
                            if (ffCol + 1 < mazeCopy.length) {
                                stack.push([ffRow, ffCol + 1])
                            }
                
                            if (ffCol - 1 > 0) {
                                stack.push([ffRow, ffCol - 1])
                            }
                        }
                    }

                    totalPoints++
                }
            }
        }

        if (reachableBlocks !== totalBlocks) {
            // not everywhere is reachable, so generate a new maze in the hope all points are reachable
            this.generateMaze()
        } else {
            this.maze = maze 
            this.mazeMaxPoints = totalPoints
        }
    }

    buildLeaderboardInHTML() {
        this.leaderboardElement.innerHTML = ""
        this.readLeaderboard()

        let sorted = this.leaderboard.sort((a, b) => b.score - a.score)

        if (sorted.length > 0) {
            let count = 0
            for (let entry of sorted) {
                if (count >= this.leaderboardDisplayLimit) {
                    break
                }
    
                const li = document.createElement("li")
                
                const leftSpan = document.createElement("span")
                leftSpan.innerText = entry.name 
                leftSpan.title = entry.name // for native tooltip
    
                const rightSpan = document.createElement("span")
                rightSpan.innerText = entry.score 
    
                li.appendChild(leftSpan)
                li.appendChild(rightSpan)
                this.leaderboardElement.appendChild(li)
    
                count++
            }
        } else {
            const li = document.createElement("li")
            li.innerText = "No entries."
            this.leaderboardElement.appendChild(li)
        }
    }

    buildLivesInHTML() {
        this.livesElement.innerHTML = ""
        this.lifeElements = []

        for (let i = this.playerLives; i > 0; i--) {
            const li = document.createElement("li")
            this.lifeElements[i] = li
            this.livesElement.appendChild(li)
        }
    }

    buildMazeInHTML() {
        this.mazeElement.innerHTML = ""
        this.mazeElement.style.setProperty("--maze-size", this.maze.length)
        this.enemyElements = []
        this.enemyData = []
        this.pointElements = []

        for (let row = 0; row < this.maze.length; row++) {
            this.pointElements[row] = []
            for (let col = 0; col < this.maze.length; col++) {
                let block = document.createElement("div") 
                switch (this.maze[row][col]) {
                    case this.mazeWallCode: {
                        block.classList.add("block", "wall")
                        break
                    }
                    case this.mazePointCode: {
                        block.classList.add("block", "point")
                        this.pointElements[row][col] = block
                        break
                    }
                    case this.mazeEnemyCode: {
                        block.classList.add("block", "enemy")
                        this.enemyData.push({
                            elementIndex: this.enemyElements.length,
                            startingPosition: [row, col],
                            position: [row, col],
                            direction: [0, 0],
                            spacesLeft: 0,
                            hasMoved: false,
                        })
                        this.enemyElements.push(block)
                        break
                    }
                    case this.mazePlayerCode: {
                        block.classList.add("block", "player")
                        this.playerElement = block
                        break
                    }
                }
                this.mazeElement.appendChild(block)
            }
        }
    }

    resetGame(resetLevelAndScore=true) {
        if (this.started) {
            this.playerLives = this.playerStartingLives
            this.playerScore = 0
            this.upButtonActive = false 
            this.ownButtonActive = false 
            this.leftButtonActive = false 
            this.rightButtonActive = false
            this.upKeyActive = false 
            this.downKeyActive = false 
            this.leftKeyActive = false 
            this.rightKeyActive = false
            this.playerMoving = false
            this.playerInvincible = false 
            this.enemiesMoving = false 

            if (resetLevelAndScore) {
                this.scoreElement.innerText = "0"
                this.levelElement.innerText = "0"
                this.playerTotalScore = 0
                this.playerLevel = 1
                this.mazeSize = this.mazeStartingSize
                this.mazeNumberOfEnemies = this.mazeStartingNumberOfEnemies
            }

            this.generateMaze()
            this.buildMazeInHTML()
            this.buildLivesInHTML()
            this.buildLeaderboardInHTML()
     
            // get the float width of a block in pixels
            this.blockSizeInPixels = this.mazeElement.children[0].getBoundingClientRect().width
        }
    }

    startGame() {
        this.playerElement.classList.add("mouth")

        // .bind(this) ensures the context for `this` is correct
        this.gameTickInterval = setInterval(this.gameTick.bind(this), this.gameTickSpeed)        
        this.started = true
    }

    finishGame(win) {
        if (this.started) {
            // stop animating
            this.playerElement.classList.remove("mouth")

            // stop ticks
            clearInterval(this.gameTickInterval)

            if (win) {
                this.nextLevelOrQuitButtonRootElement.classList.remove("hidden")
            } else {
                this.restartButtonRootElement.classList.remove("hidden")
            }
        }
    }

    gameTick() {
        // player movement (cannot move when invincible)
        if (!this.playerMoving && !this.playerInvincible) {
            // this is here so if the player wins, the notification finishes for the player to finish moving
            if (this.playerScore === this.mazeMaxPoints) {
                this.nextLevelOrQuitButtonRootElement.classList.remove("hidden")
                this.finishGame(true)
            }

            let playerMoving = false
            let searchDirection = null
            let playerRotation = null
            if (this.upKeyActive || this.upButtonActive) {
                searchDirection = [-1, 0]
                playerRotation = 270
            } else if (this.downKeyActive || this.downButtonActive) {
                searchDirection = [+1, 0]
                playerRotation = 90
            } else if (this.leftKeyActive || this.leftButtonActive) {
                searchDirection = [0, -1]
                playerRotation = 180
            } else if (this.rightKeyActive || this.rightButtonActive) {
                searchDirection = [0, +1]
                playerRotation = 0
            }

            if (searchDirection !== null) {
                let block = this.maze[this.playerPosition[0] + searchDirection[0]][this.playerPosition[1] + searchDirection[1]]
                if (block !== this.mazeWallCode) {
                    this.playerPosition[0] += searchDirection[0]
                    this.playerPosition[1] += searchDirection[1]

                    if (searchDirection[0] !== 0) {
                        this.playerElement.style.top = `${(this.playerPosition[0] - this.playerStartingPosition[0]) * this.blockSizeInPixels}px`
                    } else if (searchDirection[1] !== 0) {
                        this.playerElement.style.left = `${(this.playerPosition[1] - this.playerStartingPosition[1]) * this.blockSizeInPixels}px`
                    }

                    playerMoving = true 
                }
    
                // even if we dont move the player, they should face the correct direction
                this.playerElement.style.setProperty("--rotation", `${playerRotation}deg`)

                if (playerMoving) {
                    // no input will be accepted for however long `this.playerMovingDuration` is
                    this.playerMoving = true 
                    setTimeout(() => {
                        this.playerMoving = false
                    }, this.playerMovingDuration)
                }
            }
        }
        
        // enemy movement
        if (this.enemiesMoving === false) {
            for (let enemy of this.enemyData) {
                enemy.hasMoved = false

                if (enemy.direction == undefined) {
                    enemy.direction = [0, 0]
                }

                if (enemy.spacesLeft === 0 || this.maze[enemy.position[0] + enemy.direction[0]][enemy.position[1] + enemy.direction[1]] === this.mazeWallCode) {
                    // enemy either has spacesLeft to go or no direction or will hit a wall or hit a player
                    let allDirections = [
                        [-1, 0],
                        [+1, 0],
                        [0, -1],
                        [0, +1],
                    ]
                    let directions = []
                    for (let direction of allDirections) {
                        if (enemy.position[0] + direction[0] > 0 && enemy.position[1] + direction[1] < this.maze.length) {
                            let block = this.maze[enemy.position[0] + direction[0]][enemy.position[1] + direction[1]]

                            // prevent enemies from sharing the same space
                            let enemyInPosition
                            for (let otherEnemy of this.enemyElements) {
                                if (otherEnemy !== enemy) {
                                    if (otherEnemy.hasMoved && otherEnemy.position[0] === enemy.position[0] + direction[0] && otherEnemy.position[1] === enemy.position[1] + direction[1]) {
                                        enemyInPosition = true 
                                        break
                                    }
                                }
                            }
        
                            if (block !== this.mazeWallCode && !enemyInPosition) {
                                // not a wall, and enemy not in position
                                directions.push(direction)
                            }
                        }
                    }

                    let chosenDirection = directions[this.randomInt(0, directions.length - 1)] 
                    // if we have more than one direction to move then 7/8 times we dont go the way we came 
                    if (this.randomInt(1, 8) !== 1 && directions.length > 1) {
                        // avoid going back the way we came
                        while (enemy.direction[0] * -1 === chosenDirection[0] && enemy.direction[1] * -1 === chosenDirection[1]) {
                            chosenDirection = directions[this.randomInt(0, directions.length - 1)]  
                        }
                    }  

                    enemy.spacesLeft = this.randomInt(2, Math.ceil(this.maze.length / 4)) 
                    enemy.direction = chosenDirection
                }

                enemy.position[0] += enemy.direction[0]
                enemy.position[1] += enemy.direction[1]

                if (enemy.direction[0] !== 0) {
                    this.enemyElements[enemy.elementIndex].style.top = `${(enemy.position[0] - enemy.startingPosition[0]) * this.blockSizeInPixels}px`
                } else if (enemy.direction[1] !== 0) {
                    this.enemyElements[enemy.elementIndex].style.left = `${(enemy.position[1] - enemy.startingPosition[1]) * this.blockSizeInPixels}px`
                }

                enemy.hasMoved = true
                enemy.spacesLeft--
            }

            this.enemiesMoving = true 
            setTimeout(() => {
                this.enemiesMoving = false
            }, this.enemiesMovingDuration)
        }

        // points detection
        const point = this.pointElements[this.playerPosition[0]][this.playerPosition[1]]
        if (point !== undefined && !point.classList.contains("obtained")) {
            point.classList.add("obtained")
            
            this.playerScore++
            this.playerTotalScore++
            this.scoreElement.innerText = this.playerTotalScore
        } 

        // enemy hit processing
        if (!this.playerInvincible) {
            for (let enemy of this.enemyData) {
                if (enemy.position[0] === this.playerPosition[0] && enemy.position[1] === this.playerPosition[1]) {
                    this.lifeElements[this.playerLives].classList.add("expended")
                    this.playerLives--

                    if (this.playerLives === 0) {
                        this.playerElement.classList.add("dead")
            
                        this.playerInvincible = true 
                        setTimeout(() => {
                            this.playerInvincible = false
                            this.finishGame(false)
                            this.saveScore()
                        }, this.playerInvincibleDuration)
                    } else {
                        this.playerElement.classList.add("hit")
            
                        this.playerInvincible = true
                        setTimeout(() => {
                            this.playerInvincible = false
                            this.playerElement.classList.remove("hit")
                        }, this.playerInvincibleDuration)
                    }

                    break
                }
            }
        }
    }
}

new SnackmanGame()