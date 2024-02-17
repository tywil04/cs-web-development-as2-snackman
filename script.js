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
of its blocks being enemy spawners. After every 3 levels, the maze size is increased by 2.

*/

class SnackmanGame {
    // the properties are blank because they get set in one place only being the resetState() function
    // onscreen arrow states
    upButtonActive 
    downButtonActive 
    leftButtonActive 
    rightButtonActive

    // key states
    upKeyActive 
    downKeyActive 
    leftKeyActive 
    rightKeyActive

    // elements
    maze
    player 
    startButtonRoot
    restartButtonRoot
    nextLevelOrQuitButtonRoot
    leaderboard
    score
    lifes
    lifesDisplay
    level
    upButton
    downButton 
    leftButton 
    rightButton 
    startButton
    restartButton
    nextLevelButton 
    quitButton
    points
    enemies

    leaderboardData

    playerStartingPosition
    playerPosition
    playerMovingDuration
    playerMoving
    playerInvincibleDuration
    playerInvincible
    playerLifes
    playerLevel
    playerScore
    playerTotalScore

    enemiesData
    enemiesMovingDuration
    enemiesMoving

    mazeStartingSize
    mazeStartingNumberOfEnemies
    mazeSize
    mazeNumberOfEnemies 
    mazeMaxPoints
    mazeWallCode
    mazePlayerCode
    mazeEnemyCode
    mazePointCode
    mazeBoard 

    gameTickInterval
    gameTickSpeed

    blockSizeInPixels
    started 

    constructor() {
        this.resetState()
        this.registerEventListeners()
        this.buildMaze()
        this.buildMazeInHTML()
        this.buildLifesInHTML()
        this.buildLeaderboardInHTML()
    }

    debugGiveAllPoints() {
        let pointsLeftToCollect = this.mazeMaxPoints - this.playerScore
        this.playerScore += pointsLeftToCollect
        this.playerTotalScore += pointsLeftToCollect
        this.score.innerText = this.playerTotalScore
        
        for (let pointsRow of this.points) {
            for (let point of pointsRow) {
                if (point !== undefined) {
                    point.classList.add("obtained")
                }
            }
        }
    }

    handleKeyDown(event) {
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
                this.upButton.dataset.pressed = "false"
                this.downButton.dataset.pressed = "false"
                this.leftButton.dataset.pressed = "false"
                this.rightButton.dataset.pressed = "false"
            }
        }
    }

    handleKeyUp(event) {
        if (this.started) {
            // if the key then set value to false, otherwise set it to itself to preserve its value
            this.upKeyActive = (event.key === "ArrowUp" || event.key === "w") ? false: this.upKeyActive
            this.downKeyActive = (event.key === "ArrowDown" || event.key === "s") ? false: this.downKeyActive
            this.leftKeyActive = (event.key === "ArrowLeft" || event.key === "a") ? false: this.leftKeyActive
            this.rightKeyActive = (event.key === "ArrowRight" || event.key === "d") ? false: this.rightKeyActive 
        }
    }

    handleUpButtonClick() {
        if (this.started) {
            // only accept inputs when game has started
            this.upButtonActive = !this.upButtonActive
            this.downButtonActive = false 
            this.leftButtonActive = false 
            this.rightButtonActive = false
            this.upButton.dataset.pressed = this.upButtonActive
            this.downButton.dataset.pressed = "false"
            this.leftButton.dataset.pressed = "false"
            this.rightButton.dataset.pressed = "false"
        }
    }

    handleDownButtonClick() {
        if (this.started) {
            // only accept inputs when game has started
            this.downButtonActive = !this.downButtonActive
            this.upButtonActive = false 
            this.leftButtonActive = false 
            this.rightButtonActive = false
            this.downButton.dataset.pressed = this.downButtonActive
            this.upButton.dataset.pressed = "false"
            this.leftButton.dataset.pressed = "false"
            this.rightButton.dataset.pressed = "false"
        }
    }

    handleLeftButtonClick() {
        if (this.started) {
            // only accept inputs when game has started
            this.leftButtonActive = !this.leftButtonActive
            this.upButtonActive = false 
            this.downButtonActive = false 
            this.rightButtonActive = false
            this.leftButton.dataset.pressed = this.leftButtonActive
            this.upButton.dataset.pressed = "false"
            this.downButton.dataset.pressed = "false"
            this.rightButton.dataset.pressed = "false"
        }
    }

    handleRightButtonClick() {
        if (this.started) {
            // only accept inputs when game has started
            this.rightButtonActive = !this.rightButtonActive
            this.upButtonActive = false 
            this.downButtonActive = false 
            this.leftButtonActive = false
            this.rightButton.dataset.pressed = this.rightButtonActive
            this.upButton.dataset.pressed = "false"
            this.downButton.dataset.pressed = "false"
            this.leftButton.dataset.pressed = "false"
        }
    }

    handleStartButtonClick() {
        this.startGame()
        this.hideStart()
    }

    handleRestartButtonClick() {
        this.resetState()
        this.buildMaze()
        this.buildMazeInHTML()
        this.buildLifesInHTML()
        this.buildLeaderboardInHTML()
        this.startGame()
        this.hideRestart()
    }

    handleNextLevelButtonClick() {
        this.setPlayerLevel(this.playerLevel + 1, false)
        this.increaseDifficulty()
        this.resetState(this.mazeSize, this.mazeNumberOfEnemies, this.playerLevel, this.playerTotalScore)
        this.buildMaze()
        this.buildMazeInHTML()
        this.buildLifesInHTML()
        this.buildLeaderboardInHTML()
        this.startGame()
        this.hideNextLevelOrQuit()
    }

    handleQuitButtonClick() {
        this.saveScore()
        this.resetState()
        this.buildMaze()
        this.buildMazeInHTML()
        this.buildLifesInHTML()
        this.buildLeaderboardInHTML()
        this.hideNextLevelOrQuit()
        this.showStart()
    }

    resetState(mazeSize=10, mazeNumberOfEnemies=1, playerLevel=1, playerTotalScore=0) {
        // resets everything including event listeners, you could argue its overkill
        // but I have done it just to ensure things shouldnt break

        // stop animating
        if (this.player != undefined) this.stopAnimation()

        // stop ticks
        if (this.gameTickInterval != undefined) clearInterval(this.gameTickInterval)

        // onscreen arrow states
        this.upButtonActive = false 
        this.downButtonActive = false 
        this.leftButtonActive = false 
        this.rightButtonActive = false

        // key states
        this.upKeyActive = false 
        this.downKeyActive = false 
        this.leftKeyActive = false 
        this.rightKeyActive = false

        // elements
        this.maze = document.getElementById("maze")
        this.player = null // gets added later
        this.startButtonRoot = document.getElementById("startButtonRoot")
        this.restartButtonRoot = document.getElementById("restartButtonRoot")
        this.nextLevelOrQuitButtonRoot = document.getElementById("nextLevelOrQuitButtonRoot")
        this.leaderboard = document.getElementById("leaderboard")
        this.score = document.getElementById("score")
        this.lifes = document.getElementById("lives")
        this.lifesDisplay = {} // gets added later
        this.level = document.getElementById("level")
        this.upButton = document.getElementById("upButton") 
        this.downButton = document.getElementById("downButton")
        this.leftButton = document.getElementById("leftButton")
        this.rightButton = document.getElementById("rightButton")
        this.startButton = document.getElementById("startButton")
        this.restartButton = document.getElementById("restartButton")
        this.nextLevelButton = document.getElementById("nextLevelButton")
        this.quitButton = document.getElementById("quitButton")
        this.points = [] // gets added later
        this.enemies = [] // gets added later

        // event listener abort controllers
        this.upButtonAbort = new AbortController()
        this.downButtonAbort = new AbortController()
        this.leftButtonAbort = new AbortController()
        this.rightButtonAbort = new AbortController()
        this.startButtonAbort = new AbortController()
        this.restartButtonAbort = new AbortController()
        this.nextLevelButtonAbort = new AbortController()
        this.quitButtonAbort = new AbortController()
        this.keyupAbort = new AbortController()
        this.keydownAbort = new AbortController()

        this.leaderboardData = [] // gets set later

        this.playerStartingPosition = [0, 0] // row, col // gets set later
        this.playerPosition = [0, 0] // row, col // gets set later
        this.playerMovingDuration = 500 // ms 
        this.playerMoving = false
        this.playerInvincibleDuration = 1500 // ms
        this.playerInvincible = false
        this.playerLifes = 3
        this.playerLevel = playerLevel
        this.playerScore = 0
        this.playerTotalScore = playerTotalScore

        this.setPlayerLevelInHTML(playerLevel)
        this.setPlayerScoreInHTML(playerTotalScore)

        this.enemiesData = [] // gets set later
        this.enemiesMovingDuration = 500 // ms
        this.enemiesMoving = false

        this.mazeSize = mazeSize // number of blocks per row and col
        this.mazeNumberOfEnemies = mazeNumberOfEnemies
        this.mazeMaxPoints = 0 // gets set later
        this.mazeWallCode = 1
        this.mazePlayerCode = 2
        this.mazeEnemyCode = 3
        this.mazePointCode = 0
        this.mazeBoard = [] // gets set later

        this.gameTickInterval
        this.gameTickSpeed = 10 // ms

        this.blockSizeInPixels // gets set later
        this.started = false

        // register debug methods to window for easy access from devtools
        window.debugGiveAllPoints = this.debugGiveAllPoints.bind(this)
    }
    
    registerEventListeners() {
        // .bind(this) ensures the context for `this` is correct
        // javascript is weird
        document.addEventListener("keyup", this.handleKeyUp.bind(this))
        document.addEventListener("keydown", this.handleKeyDown.bind(this))     

        this.upButton.addEventListener("click", this.handleUpButtonClick.bind(this))
        this.downButton.addEventListener("click", this.handleDownButtonClick.bind(this))
        this.leftButton.addEventListener("click", this.handleLeftButtonClick.bind(this))
        this.rightButton.addEventListener("click", this.handleRightButtonClick.bind(this))
        this.startButton.addEventListener("click", this.handleStartButtonClick.bind(this))
        this.restartButton.addEventListener("click", this.handleRestartButtonClick.bind(this))
        this.nextLevelButton.addEventListener("click", this.handleNextLevelButtonClick.bind(this))
        this.quitButton.addEventListener("click", this.handleQuitButtonClick.bind(this))
    }

    randomInt(min, max) {
        // includes min and max
        return Math.floor(Math.random() * (max + 1 - min)) + min;
    }

    calculateBlockWidthInPixels() {
        return this.maze.children[0].getBoundingClientRect().width
    }

    readLeaderboard() {
        let data = localStorage.getItem("snackman:leaderboard")
        if (data !== null) {
            this.leaderboardData = JSON.parse(data)
        } else {
            this.leaderboardData = []
        }
    }

    writeLeaderboard() {
        this.leaderboardData = localStorage.setItem("snackman:leaderboard", JSON.stringify(this.leaderboardData))
    }

    saveScore() {
        let name = prompt("Enter your name for the leaderboard.").trim()
        if (name !== "") {
            this.leaderboardData.push({
                name,
                score: this.playerTotalScore,
            })
            this.writeLeaderboard()
            this.buildLeaderboardInHTML()
        }
    }

    increaseDifficulty() {
        let moreEnemeies = (this.mazeBoard.length * this.mazeBoard.length) * 0.3 > this.mazeNumberOfEnemies

        if ((this.playerLevel % 3) === 0) {
            // is a multiple of 3
            this.mazeSize += 2
        }

        if (moreEnemeies) {
            this.mazeNumberOfEnemies++
        }
    }

    buildMaze() {
        const numberOfWalls = this.randomInt(
            this.mazeSize * Math.floor((this.playerLevel / 6) + 1), 
            this.mazeSize * 1.5 * (Math.floor(this.playerLevel / 3) + 1),
        )
        const maze = []

        let playerStartingPosition = []

        for (let row = 0; row < this.mazeSize; row++) {
            const rowBlocks = []
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
            const randRow = this.randomInt(1, this.mazeSize - 2)
            const randCol = this.randomInt(1, this.mazeSize - 2)
            if (maze[randRow][randCol] === this.mazePointCode) {
                // override point
                maze[randRow][randCol] = this.mazeWallCode
            } else {
                // a enemy cannot be placed so subtract one so it wont get missed
                i--
            }
        }

        for (let i = 0; i < this.mazeNumberOfEnemies; i++) {
            const randRow = this.randomInt(1, this.mazeSize - 2)
            const randCol = this.randomInt(1, this.mazeSize - 2)
            if (maze[randRow][randCol] === this.mazePointCode) {
                // override point
                maze[randRow][randCol] = this.mazeEnemyCode
            } else {
                // a enemy cannot be placed so subtract one so it wont get missed
                i--
            }
        }

        while (true) {
            const randRow = this.randomInt(1, this.mazeSize - 2)
            const randCol = this.randomInt(1, this.mazeSize - 2)
            if (maze[randRow][randCol] === this.mazePointCode) {
                maze[randRow][randCol] = this.mazePlayerCode
                playerStartingPosition = [randRow, randCol]
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
            this.buildMaze()
        } else {
            this.mazeBoard = maze 
            this.mazeMaxPoints = totalPoints
            this.playerStartingPosition = playerStartingPosition
            this.playerPosition = [playerStartingPosition[0], playerStartingPosition[1]] 
        }
    }

    buildLeaderboardInHTML() {
        this.leaderboard.innerHTML = ""
        this.readLeaderboard()

        let sorted = this.leaderboardData.sort((a, b) => b.score - a.score)

        if (sorted.length > 0) {
            let count = 0
            for (let entry of sorted) {
                if (count >= 5) {
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
                this.leaderboard.appendChild(li)
    
                count++
            }
        } else {
            const li = document.createElement("li")
            li.innerText = "No entries."
            this.leaderboard.appendChild(li)
        }
    }

    buildLifesInHTML() {
        this.lifes.innerHTML = ""
        this.lifesDisplay = []

        for (let i = this.playerLifes; i > 0; i--) {
            const li = document.createElement("li")
            this.lifesDisplay[i] = li
            this.lifes.appendChild(li)
        }
    }

    buildMazeInHTML() {
        this.maze.innerHTML = ""
        this.maze.style.setProperty("--maze-size", this.mazeBoard.length)
        this.enemies = []
        this.enemiesData = []
        this.points = []
        this.blockSizeInPixels = 0

        for (let row = 0; row < this.mazeBoard.length; row++) {
            this.points[row] = []
            for (let col = 0; col < this.mazeBoard.length; col++) {
                let block = document.createElement("div") 
                switch (this.mazeBoard[row][col]) {
                    case this.mazeWallCode: {
                        block.classList.add("block", "wall")
                        break
                    }
                    case this.mazePointCode: {
                        block.classList.add("block", "point")
                        this.points[row][col] = block
                        break
                    }
                    case this.mazeEnemyCode: {
                        block.classList.add("block", "enemy")
                        this.enemiesData.push({
                            elementIndex: this.enemies.length,
                            startingPosition: [row, col],
                            position: [row, col],
                            direction: [0, 0],
                            spacesLeft: 0,
                            hasMoved: false,
                        })
                        this.enemies.push(block)
                        break
                    }
                    case this.mazePlayerCode: {
                        block.classList.add("block", "player")
                        this.player = block
                        break
                    }
                }
                this.maze.appendChild(block)
            }
        }

        this.blockSizeInPixels = this.calculateBlockWidthInPixels()
    }

    setPlayerScore(score, totalScore, inHtml=true) {
        this.playerScore = score
        this.playerTotalScore = totalScore
        
        if (inHtml) {
            this.setPlayerScoreInHTML(totalScore)
        }
    }

    setPlayerScoreInHTML(score) {
        this.score.innerText = score
    }

    setPlayerLevel(level, inHtml=true) {
        this.playerLevel = level
        
        if (inHtml) {
            this.setPlayerLevelInHTML(level)
        }
    }

    setPlayerLevelInHTML(level) {
        this.level.innerText = level
    }

    setPlayerLifes(lifes, inHtml=true) {
        this.playerLifes = lifes

        if (inHtml) {
            this.setPlayerLifesInHTML(lifes + 1)
        }
    }

    setPlayerLifesInHTML(lifes) {
        this.lifesDisplay[lifes].classList.add("expended")
    }

    showStart() {
        this.startButtonRoot.classList.remove("hidden")
    }

    hideStart() {
        this.startButtonRoot.classList.add("hidden")
    }

    showRestart() {
        this.restartButtonRoot.classList.remove("hidden")
    }

    hideRestart() {
        this.restartButtonRoot.classList.add("hidden")
    }

    showNextLevelOrQuit() {
        this.nextLevelOrQuitButtonRoot.classList.remove("hidden")
    }

    hideNextLevelOrQuit() {
        this.nextLevelOrQuitButtonRoot.classList.add("hidden")
    }

    startAnimation() {
        this.player.classList.add("mouth")
    }

    stopAnimation() {
        this.player.classList.remove("mouth")
    }

    setPointObtained(x, y) {
        const point = this.points[x][y]
        if (point !== undefined && !point.classList.contains("obtained")) {
            point.classList.add("obtained")
            this.setPlayerScore(this.playerScore + 1, this.playerTotalScore + 1)
        }
    }

    playerHit() {
        this.player.classList.add("hit")
            
        this.playerInvincible = true
        setTimeout(() => {
            this.playerInvincible = false
            this.player.classList.remove("hit")
        }, this.playerInvincibleDuration)
    }

    playerDead() {
        this.player.classList.add("dead")
            
        this.playerInvincible = true 
        setTimeout(() => {
            this.playerInvincible = false
            this.finishGame(false)
            this.saveScore()
        }, this.playerInvincibleDuration)
    }

    startGame() {
        this.startAnimation()

        // .bind(this) ensures the context for `this` is correct
        this.gameTickInterval = setInterval(this.gameTick.bind(this), this.gameTickSpeed)        
        this.started = true
    }

    finishGame(win) {
        if (this.started) {
            // stop animating
            this.stopAnimation()

            // stop ticks
            clearInterval(this.gameTickInterval)

            if (win) {
                this.showNextLevelOrQuit()
            } else {
                this.showRestart()
            }
        }
    }

    gameTick() {
        // player movement (cannot move when invincible)
        if (!this.playerMoving && !this.playerInvincible) {
            // this is here so if the player wins, the notification finishes for the player to finish moving
            if (this.playerScore === this.mazeMaxPoints) {
                this.showNextLevelOrQuit()
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
                let block = this.mazeBoard[this.playerPosition[0] + searchDirection[0]][this.playerPosition[1] + searchDirection[1]]
                if (block !== this.mazeWallCode) {
                    this.playerPosition[0] += searchDirection[0]
                    this.playerPosition[1] += searchDirection[1]

                    if (searchDirection[0] !== 0) {
                        this.player.style.top = `${(this.playerPosition[0] - this.playerStartingPosition[0]) * this.blockSizeInPixels}px`
                    } else if (searchDirection[1] !== 0) {
                        this.player.style.left = `${(this.playerPosition[1] - this.playerStartingPosition[1]) * this.blockSizeInPixels}px`
                    }

                    playerMoving = true 
                }
    
                // even if we dont move the player, they should face the correct direction
                this.player.style.setProperty("--rotation", `${playerRotation}deg`)

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
            for (let enemy of this.enemiesData) {
                enemy.hasMoved = false

                if (enemy.direction == undefined) {
                    enemy.direction = [0, 0]
                }

                if (enemy.spacesLeft === 0 || this.mazeBoard[enemy.position[0] + enemy.direction[0]][enemy.position[1] + enemy.direction[1]] === this.mazeWallCode) {
                    // enemy either has spacesLeft to go or no direction or will hit a wall or hit a player
                    let allDirections = [
                        [-1, 0],
                        [+1, 0],
                        [0, -1],
                        [0, +1],
                    ]
                    let directions = []
                    for (let direction of allDirections) {
                        if (enemy.position[0] + direction[0] > 0 && enemy.position[1] + direction[1] < this.mazeBoard.length) {
                            let block = this.mazeBoard[enemy.position[0] + direction[0]][enemy.position[1] + direction[1]]

                            // prevent enemies from sharing the same space
                            let enemyInPosition
                            for (let otherEnemy of this.enemies) {
                                if (otherEnemy !== enemy) {
                                    if (otherEnemy.hasMoved === true && otherEnemy.position[0] === enemy.position[0] + direction[0] && otherEnemy.position[1] === enemy.position[1] + direction[1]) {
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

                    enemy.spacesLeft = this.randomInt(2, Math.ceil(this.mazeBoard.length / 4)) 
                    enemy.direction = chosenDirection
                }

                enemy.position[0] += enemy.direction[0]
                enemy.position[1] += enemy.direction[1]
                enemy.hasMoved = true

                if (enemy.direction[0] !== 0) {
                    this.enemies[enemy.elementIndex].style.top = `${(enemy.position[0] - enemy.startingPosition[0]) * this.blockSizeInPixels}px`
                } else if (enemy.direction[1] !== 0) {
                    this.enemies[enemy.elementIndex].style.left = `${(enemy.position[1] - enemy.startingPosition[1]) * this.blockSizeInPixels}px`
                }

                enemy.spacesLeft--
            }

            this.enemiesMoving = true 
            setTimeout(() => {
                this.enemiesMoving = false
            }, this.enemiesMovingDuration)
        }

        // point detection
        const pointWasObtained = this.setPointObtained(this.playerPosition[0], this.playerPosition[1])
        if (pointWasObtained) {
            this.playerScore++
            this.playerTotalScore++
            this.score.innerText = this.playerTotalScore
        }

        // enemy hit processing
        if (!this.playerInvincible) {
            for (let enemy of this.enemiesData) {
                if (enemy.position[0] === this.playerPosition[0] && enemy.position[1] === this.playerPosition[1]) {
                    this.setPlayerLifes(this.playerLifes - 1)

                    if (this.playerLifes === 0) {
                        this.playerDead()
                    } else {
                        this.playerHit()
                    }

                    break
                }
            }
        }
    }
}

new SnackmanGame()