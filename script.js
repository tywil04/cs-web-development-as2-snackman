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
    multipurposeButtonElement
    multipurposeButtonTextElement
    scoreElement
    livesElement

    currentMaze = []
    currentMazeMaxPoints = 0

    playerDiscreteStartingPosition = [0, 0] // row, col
    playerDiscretePosition = [0, 0] // row, col

    playerMovingDuration = 400 // ms
    playerMoving = false
    
    playerImmobileDuration = 1500 // ms
    playerImmobile = false 

    playerStartingScore = 0
    playerScore = 0

    playerStartingLives = 3
    playerLives = 0

    playerWasHitAndHasNotMovedSince = false

    blockSizeInPixels

    multipurposeButtonState = "start"

    // holds the interval for tick
    animationTickInterval
    animationTickSpeed = 400 // ms
    gameTickInterval
    gameTickSpeed = 1 // ms

    constructor(elements) {
        this.mazeElement = document.getElementById("maze")
        this.upButtonElement = document.getElementById("upButton")
        this.downButtonElement = document.getElementById("downButton")
        this.leftButtonElement = document.getElementById("leftButton")
        this.rightButtonElement = document.getElementById("rightButton")
        this.multipurposeButtonElement = document.getElementById("multipurposeButton")
        this.multipurposeButtonTextElement = document.getElementById("multipurposeButtonText")
        this.scoreElement = document.getElementById("score")
        this.livesElement = document.getElementById("lives")

        // .bind(this) ensures the context for `this` is correct
        // javascript is weird
        document.addEventListener("keyup", this.eventHandleKeyUp.bind(this))
        document.addEventListener("keydown", this.eventHandleKeyDown.bind(this))

        this.upButtonElement.addEventListener("click", this.eventHandleUpButtonClick.bind(this))
        this.downButtonElement.addEventListener("click", this.eventHandleDownButtonClick.bind(this))
        this.leftButtonElement.addEventListener("click", this.eventHandleLeftButtonClick.bind(this))
        this.rightButtonElement.addEventListener("click", this.eventHandleRightButtonClick.bind(this))
        this.multipurposeButtonElement.addEventListener("click", this.eventHandleMultipurposeButtonClick.bind(this))

        this.generateMaze()
        this.buildMazeInHTML()

        this.playerScore = this.playerStartingScore
        this.playerLives = this.playerStartingLives

        for (let i = this.playerLives; i > 0; i--) {
            const li = document.createElement("li")
            li.id = `life:${i}`
            this.livesElement.appendChild(li)
        }

        // get the float width of a block
        this.blockSizeInPixels = this.mazeElement.children[0].getBoundingClientRect().width
    }

    eventHandleMultipurposeButtonClick() {
        switch (this.multipurposeButtonState) {
            case "start": {
                this.startGame()
                this.multipurposeButtonElement.classList.add("hidden")
                break
            }
            case "restart": {
                this.resetGame()
                this.startGame()
                this.multipurposeButtonElement.classList.add("hidden")
                break
            }
        }
    }

    eventHandleKeyDown(event) {
        switch (event.key) {
            case "ArrowUp": 
            case "w":
                this.upKeyActive = true
                this.downKeyActive = false 
                this.leftKeyActive = false 
                this.rightKeyActive = false
                break
            case "ArrowDown":
            case "s":
                this.downKeyActive = true
                this.upKeyActive = false 
                this.leftKeyActive = false 
                this.rightKeyActive = false
                break
            case "ArrowLeft": 
            case "a":
                this.leftKeyActive = true
                this.upKeyActive = false 
                this.downKeyActive = false 
                this.rightKeyActive = false 
                break
            case "ArrowRight":
            case "d":
                this.rightKeyActive = true
                this.upKeyActive = false 
                this.downKeyActive = false 
                this.leftKeyActive = false
                break
        }
    }

    eventHandleKeyUp(event) {
        switch (event.key) {
            case "ArrowUp": 
            case "w":
                this.upKeyActive = false
                break
            case "ArrowDown":
            case "s":
                this.downKeyActive = false
                break
            case "ArrowLeft": 
            case "a":
                this.leftKeyActive = false
                break
            case "ArrowRight":
            case "d":
                this.rightKeyActive = false
                break
        }
    }

    eventHandleUpButtonClick(event) {
        this.upButtonActive = !this.upButtonActive
        this.downButtonActive = false 
        this.leftButtonActive = false 
        this.rightButtonActive = false
    }

    eventHandleDownButtonClick(event) {
        this.downButtonActive = !this.downButtonActive
        this.upButtonActive = false 
        this.leftButtonActive = false 
        this.rightButtonActive = false
    }

    eventHandleLeftButtonClick(event) {
        this.leftButtonActive = !this.leftButtonActive
        this.upButtonActive = false 
        this.downButtonActive = false 
        this.rightButtonActive = false
    }

    eventHandleRightButtonClick(event) {
        this.rightButtonActive = !this.rightButtonActive
        this.upButtonActive = false 
        this.downButtonActive = false 
        this.leftButtonActive = false
    }

    // includes max
    randomInt(min, max) {
        return Math.floor(Math.random() * (max + 1 - min)) + min;
    }

    // wall = 0, point = 1, enemy = 2, player = 3
    generateMaze(size=10, numberOfEnemies=2) {
        this.currentMaze = []
        this.currentMazeMaxPoints = 0

        let numberOfWalls = this.randomInt(size / 2, size * 1.5) // between 0 and size walls
        let maze = []

        for (let row = 0; row < size; row++) {
            let rowBlocks = []

            switch (row) {
                case 0:
                case size - 1: {
                    // first and last row should be all walls
                    for (let i = 0; i < size; i++) {
                        rowBlocks.push(0)
                    }
                    break
                }
                default: {
                    for (let col = 0; col < size; col++) {
                        switch (col) {
                            case 0:
                            case size - 1: {
                                // first and last column should be all walls
                                rowBlocks.push(0)
                                break
                            }
                            default: {
                                rowBlocks.push(1)
                            }
                        }
                    }
                    break
                }
            }

            maze[row] = rowBlocks
        }

        for (let i = 0; i < numberOfWalls; i++) {
            let randRow = this.randomInt(1, size - 2)
            let randCol = this.randomInt(1, size - 2)

            // only points can be overridden
            if (maze[randRow][randCol] === 1) {
                maze[randRow][randCol] = 0
            } else {
                // a enemy cannot be placed so add one so it wont get missed
                i--
            }
        }

        for (let i = 0; i < numberOfEnemies; i++) {
            let randRow = this.randomInt(1, size - 2)
            let randCol = this.randomInt(1, size - 2)

            // only points can be overridden
            if (maze[randRow][randCol] === 1) {
                maze[randRow][randCol] = 2
            } else {
                // a enemy cannot be placed so add one so it wont get missed
                i--
            }
        }

        while (true) {
            let randRow = this.randomInt(1, size - 2)
            let randCol = this.randomInt(1, size - 2)

            if (maze[randRow][randCol] === 1) {
                maze[randRow][randCol] = 3
                this.playerDiscreteStartingPosition = [randRow, randCol]
                this.playerDiscretePosition = [randRow, randCol]
                break
            } else {
                // the player cannot be placewd so continue
                continue
            }
        }

        let totalPoints = 0
        let reachablePoints = 0
        let mazeCopy = structuredClone(maze)
        let startedSearch = false
        for (let row = 0; row < maze.length; row++) {
            for (let col = 0; col < maze.length; col++) {
                if (maze[row][col] === 1) {
                    if (startedSearch === false) {
                        startedSearch = true

                        // implementation of a 4 direction flood fill algorithm to find reachable points
                        let stack = [[row, col]]

                        while (stack.length > 0) {
                            let [row, col] = stack.pop()

                            if (mazeCopy[row][col] === 0) {
                                continue
                            }

                            if (mazeCopy[row][col] === 1) {
                                reachablePoints++
                            }

                            mazeCopy[row][col] = 0

                            if (row + 1 < mazeCopy.length) {
                                stack.push([row + 1, col])
                            }
                
                            if (row - 1 > 0) {
                                stack.push([row - 1, col])
                            }
                
                            if (col + 1 < mazeCopy.length) {
                                stack.push([row, col + 1])
                            }
                
                            if (col - 1 > 0) {
                                stack.push([row, col - 1])
                            }
                        }
                    }

                    totalPoints++
                }
            }
        }

        if (reachablePoints !== totalPoints) {
            // generate a new maze in the hope all points are reachable
            this.generateMaze(size, numberOfEnemies)
        } else {
            this.currentMaze = maze 
            this.currentMazeMaxPoints = totalPoints
        }
    }

    buildMazeInHTML() {
        this.mazeElement.innerHTML = ""

        for (let row = 0; row < this.currentMaze.length; row++) {
            for (let col = 0; col < this.currentMaze.length; col++) {
                switch (this.currentMaze[row][col]) {
                    case 0: {
                        let block = document.createElement("div")
                        block.classList.add("block", "wall")
                        this.mazeElement.appendChild(block)
                        break;
                    }
                    case 1: {
                        let block = document.createElement("div")
                        block.classList.add("block", "point")
                        block.id = `${row}:${col}`
                        this.mazeElement.appendChild(block)
                        break
                    }
                    case 2: {
                        let block = document.createElement("img")
                        block.classList.add("block", "enemy")
                        block.src = "images/enemy.png"
                        this.mazeElement.appendChild(block)
                        break;
                    }
                    case 3: {
                        this.playerElement = document.createElement("img")
                        this.playerElement.classList.add("block", "player")
                        this.playerElement.src = "images/mouthOpen.png"
                        this.playerElement.dataset.mouthOpen = "true"
                        this.mazeElement.appendChild(this.playerElement)
                        break;
                    }
                }
            }
        }
    }

    resetGame() {
        this.generateMaze()
        this.buildMazeInHTML()

        this.playerScore = this.playerStartingScore
        this.playerLives = this.playerStartingLives

        this.scoreElement.innerText = this.playerScore

        for (let i = this.playerLives; i > 0; i--) {
            const li = document.getElementById(`life:${i}`)
            li.classList.remove("obtained")
        }

        // get the float width of a block
        this.blockSizeInPixels = this.mazeElement.children[0].getBoundingClientRect().width

        this.upButtonActive = false 
        this.ownButtonActive = false 
        this.leftButtonActive = false 
        this.rightButtonActive = false
    
        this.upKeyActive = false 
        this.downKeyActive = false 
        this.leftKeyActive = false 
        this.rightKeyActive = false

        this.playerMoving = false
        this.playerImmobile = false 
        this.playerWasHitAndHasNotMovedSince = false
    }

    startGame() {
        // .bind(this) ensures the context for `this` is correct
        // javascript is weird
        this.gameTickInterval = setInterval(this.gameTick.bind(this), this.gameTickSpeed)
        this.animationTickInterval = setInterval(this.animationTick.bind(this), this.animationTickSpeed)
    }

    finishGame(win) {
        clearInterval(this.animationTickInterval)
        clearInterval(this.gameTickInterval)

        if (win) {
        } else {
            this.multipurposeButtonState = "restart"
            this.multipurposeButtonTextElement.innerText = "Restart?"
            this.multipurposeButtonElement.classList.remove("hidden")
        }
    }

    animationTick() {
        if (this.playerElement.dataset.mouthOpen === "true") {
            this.playerElement.src = "images/mouthClosed.png"
            this.playerElement.dataset.mouthOpen = "false"
        } else {
            this.playerElement.src = "images/mouthOpen.png"
            this.playerElement.dataset.mouthOpen = "true"
        }
    }

    gameTick() {
        if (!this.playerMoving && !this.playerImmobile) {
            if (this.upKeyActive || this.upButtonActive) {
                if (this.currentMaze[this.playerDiscretePosition[0] - 1][this.playerDiscretePosition[1]] !== 0) {
                    // above is not a wall
                    this.playerDiscretePosition[0]--
                
                    // calculate absolute new column cord from relative starting position
                    const position = (this.playerDiscretePosition[0] - this.playerDiscreteStartingPosition[0]) * this.blockSizeInPixels
                    this.playerElement.style.top = `${position}px`
                    this.playerElement.classList.add("faceUp")
                    this.playerElement.classList.remove("faceDown", "faceLeft", "faceRight")
    
                    // no input will be accepted for however long `this.playerMovingDuration` is
                    this.playerMoving = true 
                    setTimeout(() => {
                        this.playerMoving = false
                    }, this.playerMovingDuration)
                }
            } else if (this.downKeyActive || this.downButtonActive) {
                if (this.currentMaze[this.playerDiscretePosition[0] + 1][this.playerDiscretePosition[1]] !== 0) {
                    this.playerDiscretePosition[0]++
                    
                    // calculate absolute new column cord from relative starting position
                    const position = (this.playerDiscretePosition[0] - this.playerDiscreteStartingPosition[0]) * this.blockSizeInPixels
                    this.playerElement.style.top = `${position}px`
                    this.playerElement.classList.add("faceDown")
                    this.playerElement.classList.remove("faceUp", "faceLeft", "faceRight")

                    // no input will be accepted for however long `this.playerMovingDuration` is
                    this.playerMoving = true 
                    setTimeout(() => {
                        this.playerMoving = false
                    }, this.playerMovingDuration)
                }
            } else if (this.leftKeyActive || this.leftButtonActive) {
                if (this.currentMaze[this.playerDiscretePosition[0]][this.playerDiscretePosition[1] - 1] !== 0) {
                    this.playerDiscretePosition[1]--
                    
                    // calculate absolute new column cord from relative starting position
                    const position = (this.playerDiscretePosition[1] - this.playerDiscreteStartingPosition[1]) * this.blockSizeInPixels
                    this.playerElement.style.left = `${position}px`
                    this.playerElement.classList.add("faceLeft")
                    this.playerElement.classList.remove("faceUp", "faceDown", "faceRight")

                    // no input will be accepted for however long `this.playerMovingDuration` is
                    this.playerMoving = true 
                    setTimeout(() => {
                        this.playerMoving = false
                    }, this.playerMovingDuration)
                }
            } else if (this.rightKeyActive || this.rightButtonActive) {
                if (this.currentMaze[this.playerDiscretePosition[0]][this.playerDiscretePosition[1] + 1] !== 0) {
                    this.playerDiscretePosition[1]++

                    // calculate absolute new column cord from relative starting position
                    const position = (this.playerDiscretePosition[1] - this.playerDiscreteStartingPosition[1]) * this.blockSizeInPixels
                    this.playerElement.style.left = `${position}px`
                    this.playerElement.classList.add("faceRight")
                    this.playerElement.classList.remove("faceUp", "faceDown", "faceLeft")

                    // no input will be accepted for however long `this.playerMovingDuration` is
                    this.playerMoving = true 
                    setTimeout(() => {
                        this.playerMoving = false
                    }, this.playerMovingDuration)
                }
            }
            
            if (this.playerMoving) {
                this.playerWasHitAndHasNotMovedSince = false
            }

            switch (this.currentMaze[this.playerDiscretePosition[0]][this.playerDiscretePosition[1]]) {
                case 1: {
                    // its a point
                    const point = document.getElementById(`${this.playerDiscretePosition[0]}:${this.playerDiscretePosition[1]}`)
                    if (point !== null && !point.classList.contains("obtained")) {
                        point.classList.add("obtained")
                        
                        this.playerScore++
                        this.scoreElement.innerText = this.playerScore
        
                        if (this.playerScore === this.currentMazeMaxPoints) {
                            console.log("win")
                        }
                    } 
                    break
                }
                case 2: {
                    // its an enemy
                    if (this.playerWasHitAndHasNotMovedSince === false) {
                        document.getElementById(`life:${this.playerLives}`).classList.add("expended")

                        this.playerLives--

                        if (this.playerLives === 0) {
                            this.playerElement.classList.add("dead")

                            this.playerImmobile = true 
                            setTimeout(() => {
                                this.playerImmobile = false

                                this.finishGame(false)
                            }, this.playerImmobileDuration)
                        } else {
                            this.playerElement.classList.add("hit")

                            this.playerImmobile = true 
                            setTimeout(() => {
                                this.playerImmobile = false

                                this.playerElement.classList.remove("hit")
                            }, this.playerImmobileDuration)
                        }

                        this.playerWasHitAndHasNotMovedSince = true
                        break
                    }
                }
            }
        }
    }
}

new SnackmanGame()