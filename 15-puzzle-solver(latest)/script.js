document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const puzzleEl = document.getElementById('puzzle');
    const shuffleBtn = document.getElementById('shuffle');
    const solveBtn = document.getElementById('solve');
    const resetBtn = document.getElementById('reset');
    const movesEl = document.getElementById('moves');
    const movesCountEl = movesEl.querySelector('span');
    const timerEl = document.getElementById('timer');
    const statusEl = document.getElementById('status');
    const solutionStatusEl = document.getElementById('solution-status');
    const solutionStepsEl = document.getElementById('solution-steps');
    const solutionStatsEl = document.getElementById('solution-stats');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const gameStatsEl = document.getElementById('game-stats');
    const bestTimeEl = document.getElementById('best-time');
    const bestMovesEl = document.getElementById('best-moves');
    const gamesPlayedEl = document.getElementById('games-played');
    const gamesSolvedEl = document.getElementById('games-solved');
    
    // Fun Facts and Challenge elements
    const funFactEls = document.querySelectorAll('.fun-fact');
    const prevFactBtn = document.querySelector('.prev-fact');
    const nextFactBtn = document.querySelector('.next-fact');
    const challengeMovesEl = document.getElementById('challenge-moves');
    const challengeTargetEl = document.getElementById('challenge-target');
    const progressFillEl = document.getElementById('progress-fill');

    // Game state
    const SIZE = 4;
    let board = [];
    let emptyPos = { row: SIZE - 1, col: SIZE - 1 };
    let moves = 0;
    let solving = false;
    let solutionPath = [];
    let currentSolutionStep = 0;
    let gameActive = false;
    let timerInterval = null;
    let startTime = 0;
    let currentTime = 0;
    let difficulty = 'easy';
    let stats = loadStats();
    
    // Fun Facts and Challenge state
    let currentFactIndex = 0;
    let challengeTarget = 25; // Default target moves

    // Initialize the game
    initGame();
    displayStats();
    initFunFacts();
    initChallenge();
    createBackgroundElements();

    // Event listeners
    shuffleBtn.addEventListener('click', shufflePuzzle);
    solveBtn.addEventListener('click', solvePuzzle);
    resetBtn.addEventListener('click', resetPuzzle);
    
    // Fun Facts navigation
    prevFactBtn.addEventListener('click', showPrevFact);
    nextFactBtn.addEventListener('click', showNextFact);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (!gameActive || solving) return;
        
        switch(e.key.toLowerCase()) {
            case 'r':
                resetPuzzle();
                break;
            case 's':
                shufflePuzzle();
                break;
            case 'a':
                solvePuzzle();
                break;
        }
    });
    
    // Difficulty buttons
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (gameActive && !solving) {
                if (confirm('Changing difficulty will reset the current game. Continue?')) {
                    difficultyBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    difficulty = btn.dataset.difficulty;
                    resetPuzzle();
                }
            } else {
                difficultyBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                difficulty = btn.dataset.difficulty;
            }
        });
    });

    // Initialize the game board
    function initGame() {
        // Initialize with a solved board first
        board = Array.from({ length: SIZE }, (_, row) => 
            Array.from({ length: SIZE }, (_, col) => {
                const value = row * SIZE + col + 1;
                return value === SIZE * SIZE ? 0 : value;
            })
        );
        
        // Set initial empty position
        emptyPos = { row: SIZE - 1, col: SIZE - 1 };
        
        // Then shuffle it immediately with a moderate number of moves
        performShuffling(30);
        
        // Reset game state
        moves = 0;
        solving = false;
        solutionPath = [];
        currentSolutionStep = 0;
        gameActive = true;
        updateMoves();
        updateStatus('Game started! Try to solve the puzzle.');
        renderBoard();
        hideSolutionInfo();
        startTimer();
        gameStatsEl.classList.remove('hidden');
    }
    
    // Get number of shuffle moves based on difficulty
    function getShuffleMoves() {
        switch(difficulty) {
            case 'easy': return 20;
            case 'medium': return 40;
            case 'hard': return 80;
            default: return 30;
        }
    }
    
    // Perform shuffling with a specific number of moves
    function performShuffling(moves) {
        // Find empty position
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                if (board[row][col] === 0) {
                    emptyPos = { row, col };
                    break;
                }
            }
        }
        
        // Make random moves
        for (let i = 0; i < moves; i++) {
            const possibleMoves = [];
            
            // Check all four directions
            const directions = [
                { row: -1, col: 0 }, // up
                { row: 1, col: 0 },  // down
                { row: 0, col: -1 }, // left
                { row: 0, col: 1 }   // right
            ];
            
            for (const dir of directions) {
                const newRow = emptyPos.row + dir.row;
                const newCol = emptyPos.col + dir.col;
                
                if (newRow >= 0 && newRow < SIZE && newCol >= 0 && newCol < SIZE) {
                    possibleMoves.push({ row: newRow, col: newCol });
                }
            }
            
            // Select a random move
            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                
                // Swap the tile with the empty position
                board[emptyPos.row][emptyPos.col] = board[randomMove.row][randomMove.col];
                board[randomMove.row][randomMove.col] = 0;
                emptyPos = { row: randomMove.row, col: randomMove.col };
            }
        }
    }

    // Render the board
    function renderBoard() {
        puzzleEl.innerHTML = '';
        puzzleEl.className = 'puzzle';
        
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const value = board[row][col];
                const tile = document.createElement('div');
                tile.className = value === 0 ? 'tile empty' : 'tile';
                
                // Wrap the number in a span for enhanced effects
                if (value !== 0) {
                    const span = document.createElement('span');
                    span.textContent = value;
                    tile.appendChild(span);
                }
                
                tile.dataset.row = row;
                tile.dataset.col = col;
                
                // Add position for animation
                tile.style.setProperty('--row', row);
                tile.style.setProperty('--col', col);
                
                if (value !== 0) {
                    tile.addEventListener('click', () => moveTile(row, col));
                }
                
                puzzleEl.appendChild(tile);
            }
        }
        
        // Add 3D perspective to container
        document.querySelector('.puzzle-container').style.perspective = '1000px';
    }

    // Move a tile
    function moveTile(row, col) {
        if (solving) return;
        
        // Start the game if it's the first move
        if (!gameActive) {
            gameActive = true;
            startTimer();
        }
        
        // Check if the tile is adjacent to the empty space
        if (isAdjacent(row, col, emptyPos.row, emptyPos.col)) {
            // Get the tile element
            const tileEl = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
            
            // Add moving animation class
            tileEl.classList.add('moving');
            
            // Swap the tile with the empty space
            board[emptyPos.row][emptyPos.col] = board[row][col];
            board[row][col] = 0;
            emptyPos = { row, col };
            moves++;
            updateMoves();
            
            // Re-render the board after animation
            setTimeout(() => {
                renderBoard();
                
                // Check if the puzzle is solved
                if (isSolved()) {
                    gameActive = false;
                    stopTimer();
                    puzzleEl.classList.add('solved');
                    updateStatus('Solved!');
                    createConfetti();
                    
                    // Update statistics
                    updateGameStats(true);
                }
            }, 200);
        }
    }

    // Check if two positions are adjacent
    function isAdjacent(row1, col1, row2, col2) {
        return (
            (Math.abs(row1 - row2) === 1 && col1 === col2) ||
            (Math.abs(col1 - col2) === 1 && row1 === row2)
        );
    }

    // Check if the puzzle is solved
    function isSolved() {
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const value = row * SIZE + col + 1;
                const expected = (row === SIZE - 1 && col === SIZE - 1) ? 0 : value;
                if (board[row][col] !== expected) {
                    return false;
                }
            }
        }
        
        if (gameActive) {
            stopTimer();
            updateStatus('Puzzle solved!');
            updateGameStats(true);
            createConfetti();
            
            // Add 3D flip animation to the entire puzzle
            const puzzle = document.querySelector('.puzzle');
            puzzle.classList.add('solved');
            
            // Add shockwave effect
            createShockwave();
            
            // Check if challenge was completed
            if (moves <= challengeTarget) {
                showChallengeCompleted();
            }
        }
        
        return true;
    }

    // Shuffle the puzzle
    function shufflePuzzle() {
        if (solving) return;
        
        resetPuzzle();
        
        // Get number of moves based on difficulty
        const shuffleMoves = getShuffleMoves();
        
        // Perform shuffling
        performShuffling(shuffleMoves);
        
        // Update UI
        renderBoard();
        updateStatus('Puzzle shuffled! Try to solve it.');
        gameActive = true;
        startTimer();
    }

    // Reset the puzzle
    function resetPuzzle() {
        initGame();
        updateStatus('Game reset');
    }

    // Update the moves counter
    function updateMoves() {
        movesCountEl.textContent = moves;
        
        // Update challenge moves
        challengeMovesEl.textContent = moves;
        updateChallengeProgress();
        
        // Add animation effect
        movesEl.classList.add('updated');
        setTimeout(() => {
            movesEl.classList.remove('updated');
        }, 500);
    }

    // Update the status
    function updateStatus(message) {
        statusEl.textContent = `Status: ${message}`;
    }

    // Hide solution info
    function hideSolutionInfo() {
        solutionStatusEl.classList.add('hidden');
        solutionStepsEl.classList.add('hidden');
        solutionStatsEl.classList.add('hidden');
    }

    // Show solution info
    function showSolutionInfo() {
        solutionStatusEl.classList.remove('hidden');
        solutionStepsEl.classList.remove('hidden');
        solutionStatsEl.classList.remove('hidden');
    }

    // Timer functions
    function startTimer() {
        stopTimer();
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
    }
    
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    function updateTimer() {
        currentTime = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(currentTime / 60).toString().padStart(2, '0');
        const seconds = (currentTime % 60).toString().padStart(2, '0');
        timerEl.textContent = `Time: ${minutes}:${seconds}`;
    }
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    // A* Algorithm Implementation
    function solvePuzzle() {
        if (solving) return;
        
        solving = true;
        updateStatus('Solving...');
        
        // Stop the game timer
        stopTimer();
        
        // Convert the current board to a state
        const initialState = boardToState(board);
        
        // Start the A* algorithm
        const startTime = performance.now();
        const result = aStar(initialState);
        const endTime = performance.now();
        
        if (result) {
            const { path, moves } = result;
            solutionPath = moves;
            const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
            showSolution(moves, timeTaken);
        } else {
            updateStatus('No solution found');
            solving = false;
        }
    }

    // Convert board to state
    function boardToState(board) {
        const state = [];
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                state.push(board[row][col]);
            }
        }
        return state;
    }

    // Convert state to board
    function stateToBoard(state) {
        const newBoard = [];
        let emptyPosition = { row: 0, col: 0 };
        
        for (let row = 0; row < SIZE; row++) {
            newBoard[row] = [];
            for (let col = 0; col < SIZE; col++) {
                const value = state[row * SIZE + col];
                newBoard[row][col] = value;
                if (value === 0) {
                    emptyPosition = { row, col };
                }
            }
        }
        
        return { board: newBoard, emptyPos: emptyPosition };
    }

    // A* algorithm
    function aStar(initialState) {
        // Create the goal state (1-15, then 0)
        const goalState = Array.from({ length: SIZE * SIZE }, (_, i) => 
            i === SIZE * SIZE - 1 ? 0 : i + 1
        );
        
        // Check if the initial state is already the goal state
        if (arraysEqual(initialState, goalState)) {
            return { path: [], moves: [] };
        }
        
        // Priority queue for open set (using array + sort)
        const openSet = [
            { 
                state: initialState, 
                g: 0, 
                h: heuristic(initialState, goalState),
                f: heuristic(initialState, goalState),
                path: [],
                moves: []
            }
        ];
        
        // Closed set to avoid revisiting states
        const closedSet = new Set();
        
        // Maximum number of iterations to prevent infinite loops
        const maxIterations = 50000;
        let iterations = 0;
        
        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;
            
            // Sort the open set by f value (g + h)
            openSet.sort((a, b) => a.f - b.f);
            
            // Get the node with the lowest f value
            const current = openSet.shift();
            
            // Check if we've reached the goal
            if (arraysEqual(current.state, goalState)) {
                return {
                    path: current.path,
                    moves: current.moves
                };
            }
            
            // Add the current state to the closed set
            closedSet.add(current.state.toString());
            
            // Get possible moves from the current state
            const possibleMoves = getPossibleMoves(current.state);
            
            for (const { newState, move } of possibleMoves) {
                // Skip if we've already visited this state
                if (closedSet.has(newState.toString())) {
                    continue;
                }
                
                // Calculate the cost to reach this state
                const g = current.g + 1;
                const h = heuristic(newState, goalState);
                const f = g + h;
                
                // Check if this state is already in the open set with a lower f value
                const existingNode = openSet.find(node => arraysEqual(node.state, newState));
                if (existingNode && existingNode.f <= f) {
                    continue;
                }
                
                // If we're here, this is either a new state or a better path to an existing state
                if (existingNode) {
                    // Update the existing node
                    existingNode.g = g;
                    existingNode.h = h;
                    existingNode.f = f;
                    existingNode.path = [...current.path, newState];
                    existingNode.moves = [...current.moves, move];
                } else {
                    // Add a new node to the open set
                    openSet.push({
                        state: newState,
                        g,
                        h,
                        f,
                        path: [...current.path, newState],
                        moves: [...current.moves, move]
                    });
                }
            }
        }
        
        // If we're here, we couldn't find a solution
        return null;
    }

    // Heuristic function (Manhattan distance)
    function heuristic(state, goalState) {
        let distance = 0;
        
        for (let i = 0; i < state.length; i++) {
            const value = state[i];
            
            if (value !== 0) {
                // Find the goal position
                const goalIndex = goalState.indexOf(value);
                
                // Calculate Manhattan distance
                const currentRow = Math.floor(i / SIZE);
                const currentCol = i % SIZE;
                const goalRow = Math.floor(goalIndex / SIZE);
                const goalCol = goalIndex % SIZE;
                
                distance += Math.abs(currentRow - goalRow) + Math.abs(currentCol - goalCol);
            }
        }
        
        return distance;
    }

    // Get possible moves from a state
    function getPossibleMoves(state) {
        const possibleMoves = [];
        const emptyIndex = state.indexOf(0);
        const emptyRow = Math.floor(emptyIndex / SIZE);
        const emptyCol = emptyIndex % SIZE;
        
        // Check all four directions
        const directions = [
            { dr: -1, dc: 0, name: 'up' },    // up
            { dr: 1, dc: 0, name: 'down' },   // down
            { dr: 0, dc: -1, name: 'left' },  // left
            { dr: 0, dc: 1, name: 'right' }   // right
        ];
        
        for (const dir of directions) {
            const newRow = emptyRow + dir.dr;
            const newCol = emptyCol + dir.dc;
            
            if (newRow >= 0 && newRow < SIZE && newCol >= 0 && newCol < SIZE) {
                const newIndex = newRow * SIZE + newCol;
                const newState = [...state];
                
                // Swap the empty space with the tile
                newState[emptyIndex] = state[newIndex];
                newState[newIndex] = 0;
                
                possibleMoves.push({ 
                    newState, 
                    move: dir.name
                });
            }
        }
        
        return possibleMoves;
    }

    // Check if two arrays are equal
    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    // Show solution
    function showSolution(solution, timeTaken) {
        updateStatus('Solution found!');
        showSolutionInfo();
        
        // Display solution stats
        solutionStatsEl.textContent = `Found in ${timeTaken} seconds, ${solution.length} moves`;
        
        // Display solution steps
        solutionStepsEl.innerHTML = '';
        solutionStepsEl.className = 'solution-steps';
        
        solution.forEach((move, index) => {
            const step = document.createElement('div');
            step.textContent = `${index + 1}. Move ${move}`;
            solutionStepsEl.appendChild(step);
        });
        
        // Apply solution
        currentSolutionStep = 0;
        applySolutionStep();
    }

    // Apply solution step by step
    function applySolutionStep() {
        if (currentSolutionStep >= solutionPath.length) {
            updateStatus('Solved!');
            solving = false;
            puzzleEl.classList.add('solved');
            createConfetti();
            return;
        }
        
        const move = solutionPath[currentSolutionStep];
        let newRow = emptyPos.row;
        let newCol = emptyPos.col;
        
        // Calculate the new position based on the move
        switch (move) {
            case 'up':
                newRow--;
                break;
            case 'down':
                newRow++;
                break;
            case 'left':
                newCol--;
                break;
            case 'right':
                newCol++;
                break;
        }
        
        // Get the tile element
        const tileEl = document.querySelector(`.tile[data-row="${newRow}"][data-col="${newCol}"]`);
        
        // Add moving animation class
        if (tileEl) {
            tileEl.classList.add('moving');
        }
        
        // Move the tile
        if (newRow >= 0 && newRow < SIZE && newCol >= 0 && newCol < SIZE) {
            board[emptyPos.row][emptyPos.col] = board[newRow][newCol];
            board[newRow][newCol] = 0;
            emptyPos = { row: newRow, col: newCol };
            moves++;
            updateMoves();
            
            // Re-render the board after animation
            setTimeout(() => {
                renderBoard();
                
                // Highlight the current step in the solution
                const stepEls = solutionStepsEl.querySelectorAll('div');
                stepEls.forEach((el, i) => {
                    el.classList.toggle('highlight', i === currentSolutionStep);
                });
                
                currentSolutionStep++;
                
                // Continue with next step after a delay
                setTimeout(applySolutionStep, 300);
            }, 200);
        } else {
            currentSolutionStep++;
            applySolutionStep();
        }
    }
    
    // Game statistics functions
    function loadStats() {
        const savedStats = localStorage.getItem('puzzleStats');
        if (savedStats) {
            return JSON.parse(savedStats);
        }
        return {
            gamesPlayed: 0,
            gamesSolved: 0,
            bestTime: Infinity,
            bestMoves: Infinity
        };
    }
    
    function saveStats() {
        localStorage.setItem('puzzleStats', JSON.stringify(stats));
    }
    
    function displayStats() {
        bestTimeEl.textContent = stats.bestTime === Infinity ? '--:--' : formatTime(stats.bestTime);
        bestMovesEl.textContent = stats.bestMoves === Infinity ? '--' : stats.bestMoves;
        gamesPlayedEl.textContent = stats.gamesPlayed;
        gamesSolvedEl.textContent = stats.gamesSolved;
    }
    
    function updateGameStats(solved) {
        stats.gamesPlayed++;
        
        if (solved) {
            stats.gamesSolved++;
            
            // Update best time if current time is better
            if (currentTime < stats.bestTime || stats.bestTime === 0) {
                stats.bestTime = currentTime;
            }
            
            // Update best moves if current moves is better
            if (moves < stats.bestMoves || stats.bestMoves === 0) {
                stats.bestMoves = moves;
            }
        }
        
        saveStats();
        displayStats();
    }
    
    // Create confetti effect
    function createConfetti() {
        // Clear any existing confetti
        document.querySelectorAll('.confetti').forEach(el => el.remove());
        document.querySelectorAll('.celebration-effect').forEach(el => el.remove());
        
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
                       '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', 
                       '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
        
        // Create more confetti pieces for a richer effect
        for (let i = 0; i < 200; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Randomize confetti properties
            const size = Math.random() * 12 + 5; // 5-17px
            const shape = Math.random() > 0.6 ? '50%' : Math.random() > 0.5 ? '0' : '0 50% 50% 0'; // circle, square, or triangle
            
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            confetti.style.opacity = Math.random() + 0.5; // 0.5-1.5
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = shape;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            // Varied animation duration and delay for more natural effect
            const duration = Math.random() * 3 + 2; // 2-5s
            const delay = Math.random() * 2; // 0-2s
            confetti.style.animation = `fall ${duration}s linear ${delay}s forwards`;
            
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, (duration + delay) * 1000 + 500);
        }
        
        // Create a celebration overlay
        const celebrationOverlay = document.createElement('div');
        celebrationOverlay.className = 'celebration-effect';
        document.body.appendChild(celebrationOverlay);
        
        // Add shiny particles that move outward from the center
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            
            const size = Math.random() * 20 + 10;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 40 + 30;
            const duration = Math.random() * 1.5 + 1;
            const delay = Math.random() * 0.5;
            
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animation = `particle-burst ${duration}s ease-out ${delay}s forwards`;
            particle.style.left = `calc(50% - ${size/2}px)`;
            particle.style.top = `calc(50% - ${size/2}px)`;
            particle.style.transform = `translate(0, 0) scale(0)`;
            particle.style.opacity = '0';
            
            // Set final position using custom properties
            particle.style.setProperty('--final-x', `${Math.cos(angle) * distance}vw`);
            particle.style.setProperty('--final-y', `${Math.sin(angle) * distance}vh`);
            
            celebrationOverlay.appendChild(particle);
        }
        
        // Create a pulsing light effect behind the puzzle
        const pulsingLight = document.createElement('div');
        pulsingLight.className = 'pulsing-light';
        document.querySelector('.puzzle-container').appendChild(pulsingLight);
        
        // Add a celebratory message with better animation
        const message = document.createElement('div');
        message.className = 'celebration-message';
        message.innerHTML = `
            <div class="message-content">
                <h2>Puzzle Solved!</h2>
                <p>Congratulations! You solved it in ${moves} moves and ${formatTime(currentTime)}.</p>
                <div class="stars-container">
                    ${Array(5).fill(0).map(() => '<span class="star">★</span>').join('')}
                </div>
            </div>
        `;
        document.body.appendChild(message);
        
        // Add keyframes for the celebration effects
        const style = document.createElement('style');
        style.textContent = `
            @keyframes particle-burst {
                0% { transform: translate(0, 0) scale(0); opacity: 0; }
                20% { opacity: 1; }
                100% { transform: translate(var(--final-x), var(--final-y)) scale(1); opacity: 0; }
            }
            
            @keyframes star-animation {
                0% { transform: scale(0) rotate(0deg); opacity: 0; }
                20% { transform: scale(1.2) rotate(20deg); opacity: 1; }
                40% { transform: scale(1) rotate(0deg); }
                60% { transform: scale(1.1) rotate(-10deg); }
                80% { transform: scale(1) rotate(0deg); }
                100% { transform: scale(1) rotate(0deg); }
            }
            
            .celebration-effect {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            }
            
            .celebration-particle {
                position: absolute;
                border-radius: 50%;
                filter: blur(1px);
                box-shadow: 0 0 10px currentColor;
            }
            
            .pulsing-light {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 0;
                height: 0;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
                animation: pulse-light 2s ease-out forwards;
                pointer-events: none;
                z-index: -1;
            }
            
            @keyframes pulse-light {
                0% { width: 0; height: 0; opacity: 0.8; }
                100% { width: 400px; height: 400px; opacity: 0; }
            }
            
            .celebration-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, rgba(41, 182, 246, 0.9), rgba(106, 90, 205, 0.9));
                padding: 30px 40px;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 255, 255, 0.3);
                z-index: 1001;
                text-align: center;
                color: white;
                animation: message-appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
            
            .message-content h2 {
                font-size: 2.5rem;
                margin-bottom: 15px;
                text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                background: linear-gradient(to right, #FFC107, #FF5722);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: text-shine 2s linear infinite;
            }
            
            .message-content p {
                font-size: 1.2rem;
                margin-bottom: 20px;
            }
            
            .stars-container {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 10px;
            }
            
            .star {
                font-size: 2rem;
                color: #FFC107;
                text-shadow: 0 0 10px rgba(255, 193, 7, 0.8);
                animation: star-animation 1s forwards;
                opacity: 0;
                transform: scale(0);
            }
            
            .star:nth-child(1) { animation-delay: 0.2s; }
            .star:nth-child(2) { animation-delay: 0.4s; }
            .star:nth-child(3) { animation-delay: 0.6s; }
            .star:nth-child(4) { animation-delay: 0.8s; }
            .star:nth-child(5) { animation-delay: 1s; }
            
            @keyframes text-shine {
                0% { background-position: 0% 50%; }
                100% { background-position: 100% 50%; }
            }
            
            @keyframes message-appear {
                0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            @keyframes tile-flip {
                0% { transform: rotateY(0deg); }
                100% { transform: rotateY(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        // Make the puzzle tiles do a wave animation
        const tiles = document.querySelectorAll('.tile:not(.empty)');
        tiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.classList.add('solved-tile');
                setTimeout(() => {
                    tile.classList.remove('solved-tile');
                }, 1200);
            }, index * 100);
        });
        
        // Add 3D rotation to each tile
        tiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.style.animation = `tile-flip 1s ${index * 0.1}s cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
            }, 100);
        });
        
        // Remove celebration effects after some time
        setTimeout(() => {
            document.querySelectorAll('.celebration-effect').forEach(el => {
                el.classList.add('fade-out');
                setTimeout(() => el.remove(), 1000);
            });
            
            document.querySelectorAll('.pulsing-light').forEach(el => {
                el.classList.add('fade-out');
                setTimeout(() => el.remove(), 1000);
            });
            
            message.classList.add('fade-out');
            setTimeout(() => {
                message.remove();
                style.remove();
            }, 1000);
        }, 8000);
    }
    
    // Create shockwave effect
    function createShockwave() {
        const shockwave = document.createElement('div');
        shockwave.className = 'shockwave';
        document.querySelector('.puzzle-container').appendChild(shockwave);
        
        // Add keyframes for the shockwave
        const style = document.createElement('style');
        style.textContent = `
            .shockwave {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 0;
                height: 0;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
                animation: shockwave 1s cubic-bezier(0.1, 0.5, 0.1, 1) forwards;
                pointer-events: none;
                z-index: 5;
            }
            
            @keyframes shockwave {
                0% { width: 0; height: 0; opacity: 0.8; }
                70% { opacity: 0.5; }
                100% { width: 500px; height: 500px; opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Remove shockwave after animation
        setTimeout(() => {
            shockwave.remove();
            style.remove();
        }, 1500);
    }

    // Initialize fun facts
    function initFunFacts() {
        funFactEls.forEach((el, index) => {
            el.classList.toggle('hidden', index !== 0);
        });
    }

    // Show previous fun fact
    function showPrevFact() {
        if (currentFactIndex > 0) {
            currentFactIndex--;
            funFactEls.forEach((el, index) => {
                el.classList.toggle('hidden', index !== currentFactIndex);
            });
        }
    }

    // Show next fun fact
    function showNextFact() {
        if (currentFactIndex < funFactEls.length - 1) {
            currentFactIndex++;
            funFactEls.forEach((el, index) => {
                el.classList.toggle('hidden', index !== currentFactIndex);
            });
        }
    }

    // Initialize challenge
    function initChallenge() {
        challengeMovesEl.textContent = challengeTarget;
        progressFillEl.style.width = '0%';
    }

    // Create background elements
    function createBackgroundElements() {
        // Create background shapes
        for (let i = 0; i < 20; i++) {
            const shape = document.createElement('div');
            shape.className = 'background-shape';
            
            // Randomize shape properties
            const size = Math.random() * 50 + 20; // 20-70px
            const shapeType = Math.random() > 0.5 ? 'circle' : 'square';
            const color = `hsl(${Math.random() * 360}, 80%, 70%)`;
            
            shape.style.width = size + 'px';
            shape.style.height = size + 'px';
            shape.style.borderRadius = shapeType === 'circle' ? '50%' : '0';
            shape.style.backgroundColor = color;
            shape.style.top = Math.random() * 100 + '%';
            shape.style.left = Math.random() * 100 + '%';
            shape.style.animation = `float ${Math.random() * 10 + 5}s linear infinite`;
            
            document.body.appendChild(shape);
        }
    }

    // Update challenge progress
    function updateChallengeProgress() {
        if (gameActive && !solving) {
            const progress = Math.min(moves / challengeTarget * 100, 100);
            progressFillEl.style.width = `${progress}%`;
            
            // Change color based on progress
            if (moves <= challengeTarget) {
                progressFillEl.style.background = 'linear-gradient(to right, #4CAF50, #8BC34A)';
            } else {
                progressFillEl.style.background = 'linear-gradient(to right, #FFC107, #FF5722)';
            }
        }
    }
    
    // Show challenge completed message
    function showChallengeCompleted() {
        const message = document.createElement('div');
        message.className = 'challenge-complete';
        message.innerHTML = `
            <h3>Challenge Complete! <i class="fas fa-trophy"></i></h3>
            <p>You solved the puzzle in ${moves} moves!</p>
        `;
        
        document.body.appendChild(message);
        
        // Remove after animation
        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => {
                message.remove();
            }, 1000);
        }, 3000);
    }
    
    // Auto-rotate fun facts
    setInterval(() => {
        if (!document.hidden && !solving) {
            showNextFact();
            if (currentFactIndex >= funFactEls.length - 1) {
                currentFactIndex = -1;
            }
        }
    }, 8000);
});
