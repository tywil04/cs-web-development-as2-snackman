class SnackmanGame {
    // on screen arrow states
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
    continueOrFinishButtonRootElement
    continuePlayingButtonElement
    finishAndSaveButtonElement
    scoreElement
    livesElement
    levelElement

    pointElements = []
    lifeElements = {}
    enemyElements = []

    playerDiscreteStartingPosition = [0, 0] // row, col
    playerDiscretePosition = [0, 0] // row, col
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

    mazeStartingSize = 10
    mazeStartingNumberOfEnemies = 1
    mazeSize = 0
    mazeNumberOfEnemies = 0
    mazeMaxPoints
    maze 

    // holds the interval for tick
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
        this.continueOrFinishButtonRootElement = document.getElementById("continueOrFinishButtonRoot")
        this.continuePlayingButtonElement = document.getElementById("continuePlayingButton")
        this.finishAndSaveButtonElement = document.getElementById("finishAndSaveButton")
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
        this.continuePlayingButtonElement.addEventListener("click", this.eventHandleContinuePlayingButtonClick.bind(this))
        this.finishAndSaveButtonElement.addEventListener("click", this.eventHandleFinishAndSaveButtonClick.bind(this))

        this.playerScore = 0
        this.playerLives = this.playerStartingLives
        this.mazeSize = this.mazeStartingSize
        this.mazeNumberOfEnemies = this.mazeStartingNumberOfEnemies

        this.generateMaze()
        this.buildMazeInHTML()
        this.buildLivesInHTML()

        // get the float width of a block
        this.blockSizeInPixels = this.mazeElement.children[0].getBoundingClientRect().width
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

    eventHandleContinuePlayingButtonClick() {
        this.playerLevel++
        this.levelElement.innerText = this.playerLevel

        let moreEnemeies = (this.maze.length * this.maze.length) * 0.3 > this.mazeNumberOfEnemies

        if ((this.playerLevel % 3) === 0) {
            // is a multiple of 3
            this.mazeSize += 2
            this.mazeNumberOfEnemies = Math.floor(this.mazeNumberOfEnemies * 1.5)
        }

        if (moreEnemeies) {
            this.mazeNumberOfEnemies++
        }

        this.resetGame(false)
        this.startGame()
        this.continueOrFinishButtonRootElement.classList.add("hidden")
    }

    eventHandleFinishAndSaveButtonClick() {
        console.log(this.playerScore)
        console.log(this.playerLevel)
        this.resetGame()
        this.continueOrFinishButtonRootElement.classList.add("hidden")
        this.startButtonRootElement.classList.remove("hidden")
    }

    // includes max
    randomInt(min, max) {
        return Math.floor(Math.random() * (max + 1 - min)) + min;
    }

    // wall = 0, point = 1, enemy = 2, player = 3
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
                for (let i = 0; i < this.mazeSize; i++) {
                    rowBlocks.push(0)
                }
            } else {
                for (let col = 0; col < this.mazeSize; col++) {
                    if (col === 0 || col === this.mazeSize - 1) {
                        // first and last column should be all walls
                        rowBlocks.push(0)
                    } else {
                        rowBlocks.push(1)
                    }
                }
            }
            maze[row] = rowBlocks
        }

        for (let i = 0; i < numberOfWalls; i++) {
            let randRow = this.randomInt(1, this.mazeSize - 2)
            let randCol = this.randomInt(1, this.mazeSize - 2)
            if (maze[randRow][randCol] === 1) {
                // override point
                maze[randRow][randCol] = 0
            } else {
                // a enemy cannot be placed so subtract one so it wont get missed
                i--
            }
        }

        for (let i = 0; i < this.mazeNumberOfEnemies; i++) {
            let randRow = this.randomInt(1, this.mazeSize - 2)
            let randCol = this.randomInt(1, this.mazeSize - 2)
            if (maze[randRow][randCol] === 1) {
                // override point
                maze[randRow][randCol] = 2
            } else {
                // a enemy cannot be placed so subtract one so it wont get missed
                i--
            }
        }

        while (true) {
            let randRow = this.randomInt(1, this.mazeSize - 2)
            let randCol = this.randomInt(1, this.mazeSize - 2)
            if (maze[randRow][randCol] === 1) {
                maze[randRow][randCol] = 3
                this.playerDiscreteStartingPosition = [randRow, randCol]
                this.playerDiscretePosition = [randRow, randCol]
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
                if (maze[row][col] !== 0) {
                    totalBlocks++
                }

                if (maze[row][col] === 1) {
                    if (startedSearch === false) {
                        startedSearch = true

                        // implementation of a 4 direction flood fill algorithm to find reachable blocks (any block that isnt a wall)
                        let stack = [[row, col]]
                        while (stack.length > 0) {
                            let [ffRow, ffCol] = stack.pop()

                            if (mazeCopy[ffRow][ffCol] === 0) {
                                continue
                            }

                            reachableBlocks++
                            mazeCopy[ffRow][ffCol] = 0

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
        this.pointElements = []

        for (let row = 0; row < this.maze.length; row++) {
            this.pointElements[row] = []
            for (let col = 0; col < this.maze.length; col++) {
                let block = document.createElement("div") 
                switch (this.maze[row][col]) {
                    case 0: {
                        block.classList.add("block", "wall")
                        break
                    }
                    case 1: {
                        block.classList.add("block", "point")
                        this.pointElements[row][col] = block
                        break
                    }
                    case 2: {
                        block.classList.add("block", "enemy")
                        this.enemyElements.push({
                            enemy: block,
                            startingPosition: [row, col],
                            position: [row, col],
                            direction: [0, 0],
                            spacesLeft: 0,
                            hasMoved: false,
                        })
                        break
                    }
                    case 3: {
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
                this.continueOrFinishButtonRootElement.classList.remove("hidden")
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
                let block = this.maze[this.playerDiscretePosition[0] + searchDirection[0]][this.playerDiscretePosition[1] + searchDirection[1]]
                if (block !== 0) {
                    this.playerDiscretePosition[0] += searchDirection[0]
                    this.playerDiscretePosition[1] += searchDirection[1]

                    if (searchDirection[0] !== 0) {
                        this.playerElement.style.top = `${(this.playerDiscretePosition[0] - this.playerDiscreteStartingPosition[0]) * this.blockSizeInPixels}px`
                    } else if (searchDirection[1] !== 0) {
                        this.playerElement.style.left = `${(this.playerDiscretePosition[1] - this.playerDiscreteStartingPosition[1]) * this.blockSizeInPixels}px`
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
            // reset this so the player can be hurt again
            this.playerHasBeenHit = false 

            for (let enemy of this.enemyElements) {
                enemy.hasMoved = false

                if (enemy.direction == undefined) {
                    enemy.direction = [0, 0]
                }

                if (enemy.spacesLeft === 0 || this.maze[enemy.position[0] + enemy.direction[0]][enemy.position[1] + enemy.direction[1]] === 0) {
                    // enemy either has spacesLeft to go or no direction or will hit a wall or hit a player
                    let directions = []

                    if (enemy.position[0] - 1 > 0) {
                        let block = this.maze[enemy.position[0] - 1][enemy.position[1]]

                        // prevent enemies from sharing the same space
                        let enemyInPosition
                        for (let otherEnemy of this.enemyElements) {
                            if (otherEnemy !== enemy) {
                                if (otherEnemy.hasMoved && otherEnemy.position[0] === enemy.position[0] - 1 && otherEnemy.position[1] === enemy.position[1]) {
                                    enemyInPosition = true 
                                    break
                                }
                            }
                        }

                        if (block === 1 && !enemyInPosition) {
                            // point or player
                            directions.push([-1, 0])
                        }
                    }

                    if (enemy.position[0] + 1 < this.maze.length) {
                        let block = this.maze[enemy.position[0] + 1][enemy.position[1]]

                        // prevent enemies from sharing the same space
                        let enemyInPosition
                        for (let otherEnemy of this.enemyElements) {
                            if (otherEnemy !== enemy) {
                                if (otherEnemy.hasMoved && otherEnemy.position[0] === enemy.position[0] + 1 && otherEnemy.position[1] === enemy.position[1]) {
                                    enemyInPosition = true 
                                    break
                                }
                            }
                        }

                        if (block === 1 && !enemyInPosition) {
                            // point or player
                            directions.push([+1, 0])
                        }
                    }

                    if (enemy.position[1] - 1 > 0) {
                        let block = this.maze[enemy.position[0]][enemy.position[1] - 1]

                        // prevent enemies from sharing the same space
                        let enemyInPosition
                        for (let otherEnemy of this.enemyElements) {
                            if (otherEnemy !== enemy) {
                                if (otherEnemy.hasMoved && otherEnemy.position[0] === enemy.position[0] && otherEnemy.position[1] === enemy.position[1] - 1) {
                                    enemyInPosition = true 
                                    break
                                }
                            }
                        }

                        if (block === 1 && !enemyInPosition) {
                            // point or player
                            directions.push([0, -1])
                        }
                    }

                    if (enemy.position[1] + 1 < this.maze.length) {
                        let block = this.maze[enemy.position[0]][enemy.position[1] + 1]

                        // prevent enemies from sharing the same space
                        let enemyInPosition
                        for (let otherEnemy of this.enemyElements) {
                            if (otherEnemy !== enemy) {
                                if (otherEnemy.hasMoved && otherEnemy.position[0] === enemy.position[0] && otherEnemy.position[1] === enemy.position[1] + 1) {
                                    enemyInPosition = true 
                                    break
                                }
                            }
                        }

                        if (block === 1 && !enemyInPosition) {
                            // point or player
                            directions.push([0, +1])
                        }
                    }

                    let chosenDirection = directions[this.randomInt(0, directions.length - 1)] 
                    // if we have set a direction and we have multiple directions to choose from   
                    if (enemy.direction !== null && directions.length > 1) {
                        // avoid going back the way we came
                        while (enemy.direction[0] * -1 === chosenDirection[0] && enemy.direction[1] * -1 === chosenDirection[1]) {
                            chosenDirection = directions[this.randomInt(0, directions.length - 1)]  
                        }
                    }  

                    enemy.spacesLeft = this.randomInt(0, Math.floor(this.maze.length / 4))
                    enemy.direction = chosenDirection
                }

                enemy.position[0] += enemy.direction[0]
                enemy.position[1] += enemy.direction[1]

                if (enemy.direction[0] !== 0) {
                    enemy.enemy.style.top = `${(enemy.position[0] - enemy.startingPosition[0]) * this.blockSizeInPixels}px`
                } else if (enemy.direction[1] !== 0) {
                    enemy.enemy.style.left = `${(enemy.position[1] - enemy.startingPosition[1]) * this.blockSizeInPixels}px`
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
        const point = this.pointElements[this.playerDiscretePosition[0]][this.playerDiscretePosition[1]]
        if (point !== undefined && !point.classList.contains("obtained")) {
            point.classList.add("obtained")
            
            this.playerScore++
            this.playerTotalScore++
            this.scoreElement.innerText = this.playerTotalScore
        } 

        // enemy hit processing
        if (!this.playerInvincible) {
            for (let enemy of this.enemyElements) {
                if (enemy.position[0] === this.playerDiscretePosition[0] && enemy.position[1] === this.playerDiscretePosition[1]) {
                    this.lifeElements[this.playerLives].classList.add("expended")
    
                    this.playerLives--
    
                    if (this.playerLives === 0) {
                        this.playerElement.classList.add("dead")
    
                        this.playerInvincible = true 
                        setTimeout(() => {
                            this.playerInvincible = false
                            this.finishGame(false)
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