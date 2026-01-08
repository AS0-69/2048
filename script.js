let board = [];
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
document.getElementById('best').textContent = bestScore;
let soundEnabled = true;

// Système de sons avec Web Audio API
let audioContext = null;
let audioInitialized = false;

function initAudio() {
    if (!audioInitialized) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioInitialized = true;
    }
}

function playSound(frequency, duration = 0.1, type = 'sine') {
    if (!soundEnabled || !audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        // Volume réduit pour un son plus doux
        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        // Ignorer les erreurs audio
    }
}

function playSoundMove() {
    playSound(350, 0.06, 'sine'); // Son doux et court
}

function playSoundMerge(value) {
    // Sons plus doux et harmonieux
    const baseFreq = 440; // Note A (La)
    const octave = Math.log2(value / 2);
    const frequency = baseFreq * Math.pow(2, octave / 12);
    playSound(frequency, 0.12, 'sine');
}

function playSoundNewTile() {
    playSound(523, 0.08, 'sine'); // Note C (Do) - son doux
}

function playSoundGameOver() {
    setTimeout(() => playSound(330, 0.2, 'sine'), 0);   // Note E
    setTimeout(() => playSound(294, 0.2, 'sine'), 150); // Note D
    setTimeout(() => playSound(262, 0.3, 'sine'), 300); // Note C
}

function playSoundWin() {
    setTimeout(() => playSound(523, 0.12, 'sine'), 0);   // Do
    setTimeout(() => playSound(659, 0.12, 'sine'), 120); // Mi
    setTimeout(() => playSound(784, 0.12, 'sine'), 240); // Sol
    setTimeout(() => playSound(1047, 0.25, 'sine'), 360); // Do aigu
}

function initBoard(isFirstLoad = false) {
    // Initialiser l'audio au démarrage
    initAudio();
    
    board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    score = 0;
    updateScore();
    
    // Désactiver temporairement les sons pour le premier chargement
    const soundWasEnabled = soundEnabled;
    if (isFirstLoad) {
        soundEnabled = false;
    }
    
    addRandomTile();
    addRandomTile();
    renderBoard();
    
    // Réactiver les sons
    soundEnabled = soundWasEnabled;
    
    document.getElementById('gameOver').classList.remove('active');
    document.getElementById('startOverlay').classList.remove('active');
}

function addRandomTile() {
    let emptyCells = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) {
                emptyCells.push({row: i, col: j});
            }
        }
    }
    if (emptyCells.length > 0) {
        let cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[cell.row][cell.col] = Math.random() < 0.9 ? 2 : 4;
        playSoundNewTile();
    }
}

function renderBoard(mergedValues = []) {
    const gameBoard = document.getElementById('gameBoard');
    const tiles = gameBoard.querySelectorAll('.tile');
    tiles.forEach(tile => tile.remove());

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            if (board[i][j] !== 0) {
                tile.textContent = board[i][j];
                tile.classList.add(`tile-${board[i][j]}`);
                
                // Ajouter l'animation de fusion si la tuile vient d'être fusionnée
                if (mergedValues.includes(board[i][j]) && mergedValues.indexOf(board[i][j]) === mergedValues.lastIndexOf(board[i][j])) {
                    tile.classList.add('tile-merged');
                    mergedValues.splice(mergedValues.indexOf(board[i][j]), 1);
                }
            }
            gameBoard.appendChild(tile);
        }
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
        document.getElementById('best').textContent = bestScore;
    }
}

function move(direction) {
    let moved = false;
    let originalBoard = JSON.stringify(board);
    let mergedValues = [];
    let hasMerged = false;

    if (direction === 'left') {
        for (let i = 0; i < 4; i++) {
            let row = board[i].filter(val => val !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    score += row[j];
                    mergedValues.push(row[j]);
                    playSoundMerge(row[j]);
                    hasMerged = true;
                    row.splice(j + 1, 1);
                }
            }
            while (row.length < 4) row.push(0);
            board[i] = row;
        }
    } else if (direction === 'right') {
        for (let i = 0; i < 4; i++) {
            let row = board[i].filter(val => val !== 0);
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2;
                    score += row[j];
                    mergedValues.push(row[j]);
                    playSoundMerge(row[j]);
                    hasMerged = true;
                    row.splice(j - 1, 1);
                    j--;
                }
            }
            while (row.length < 4) row.unshift(0);
            board[i] = row;
        }
    } else if (direction === 'up') {
        for (let j = 0; j < 4; j++) {
            let col = [];
            for (let i = 0; i < 4; i++) {
                if (board[i][j] !== 0) col.push(board[i][j]);
            }
            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    col[i] *= 2;
                    score += col[i];
                    mergedValues.push(col[i]);
                    playSoundMerge(col[i]);
                    hasMerged = true;
                    col.splice(i + 1, 1);
                }
            }
            while (col.length < 4) col.push(0);
            for (let i = 0; i < 4; i++) {
                board[i][j] = col[i];
            }
        }
    } else if (direction === 'down') {
        for (let j = 0; j < 4; j++) {
            let col = [];
            for (let i = 0; i < 4; i++) {
                if (board[i][j] !== 0) col.push(board[i][j]);
            }
            for (let i = col.length - 1; i > 0; i--) {
                if (col[i] === col[i - 1]) {
                    col[i] *= 2;
                    score += col[i];
                    mergedValues.push(col[i]);
                    playSoundMerge(col[i]);
                    hasMerged = true;
                    col.splice(i - 1, 1);
                    i--;
                }
            }
            while (col.length < 4) col.unshift(0);
            for (let i = 0; i < 4; i++) {
                board[i][j] = col[i];
            }
        }
    }

    if (JSON.stringify(board) !== originalBoard) {
        moved = true;
        if (!hasMerged) playSoundMove();
        addRandomTile();
        updateScore();
        renderBoard(mergedValues);
        
        if (checkWin()) {
            playSoundWin();
            setTimeout(() => {
                document.getElementById('gameOverText').textContent = '🎉 Vous avez gagné ! 🎉';
                document.getElementById('gameOver').classList.add('active');
            }, 200);
        } else if (checkGameOver()) {
            playSoundGameOver();
            setTimeout(() => {
                document.getElementById('gameOverText').textContent = 'Game Over!';
                document.getElementById('gameOver').classList.add('active');
            }, 200);
        }
    }
}

function checkWin() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 2048) return true;
        }
    }
    return false;
}

function checkGameOver() {
    // Vérifier s'il reste des cases vides
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) return false;
        }
    }
    
    // Vérifier s'il y a des mouvements possibles
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (j < 3 && board[i][j] === board[i][j + 1]) return false;
            if (i < 3 && board[i][j] === board[i + 1][j]) return false;
        }
    }
    
    return true;
}

function newGame() {
    initBoard(false);
}

document.addEventListener('keydown', (e) => {
    // Initialiser l'audio dès la première interaction
    if (!audioInitialized) {
        initAudio();
    }
    
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        move('left');
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        move('right');
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        move('up');
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        move('down');
    }
});

// Afficher l'écran de démarrage
// Le jeu démarrera quand on cliquera sur "Nouveau Jeu"
// Ne rien faire au chargement initial - l'overlay est déjà affiché par défaut
document.getElementById('best').textContent = bestScore;
