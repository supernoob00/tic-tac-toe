
    "use strict";


    // a left diagonal looks like "/"

    const TOKENS = {
        EMPTY: "E",
        NAUGHT: "O",
        CROSS: "X",
    };

    // useful generic functions for working with 2d arrays 
    // contents of matrix is irrelevant; functions only work with row and column indices
    // only valid for square arrays, could be used for any array shape with a little tweaking
    // "pos" and "step" in parameters are always a [rowIndex, colIndex] coordinate
    const matrixFuncs = (function() {
        const isInBounds = function(matrix, pos) {
            const rowInBounds = (pos[0] >= 0) && (pos[0] < matrix.length);
            const colInBounds = (pos[1] >= 0) && (pos[1] < matrix.length);
            const isInBounds = rowInBounds && colInBounds;
            return isInBounds;
        };
        // from a starting point, move with a given step coordinate, collecting coordinate of every cell that is landed on until boundary is reached
        const traverseMatrix = function(matrix, startPos, step) {
            let passedCells = [];
            let currentPos = startPos;
            while (isInBounds(matrix, currentPos)) {
                passedCells.push(currentPos);
                currentPos = [currentPos[0] + step[0], currentPos[1] + step[1]];
            }
            return passedCells;
        };
        const rows = function(matrix) {
            const startingCol = traverseMatrix(matrix, [0,0], [1, 0]);
            const rows = startingCol.map(coordinate => traverseMatrix(matrix, coordinate, [0, 1]));
            return rows;
        };
        const cols = function(matrix) {
            const startingRow = rows(matrix)[0];
            const cols = startingRow.map(coordinate => traverseMatrix(matrix, coordinate, [1,0]));
            return cols;
        };
        const antiDiags = function(matrix) {
            const startingRow = rows(matrix)[0];
            const startingCol = cols(matrix)[matrix.length - 1].slice(1, matrix.length);
            const startingCells = startingRow.concat(startingCol);
            const antiDiags = startingCells.map(coordinate => traverseMatrix(matrix, coordinate, [1, -1]));
            return antiDiags;
        };
        const mainDiags = function(matrix) {
            const startingRow = rows(matrix)[0].reverse();
            const startingCol = cols(matrix)[0].slice(1, matrix.length);
            const startingCells = startingRow.concat(startingCol);
            const mainDiags = startingCells.map(coordinate => traverseMatrix(matrix, coordinate, [1,1]));
            return mainDiags;
        };
    

        return {
                rows,
                cols,
                antiDiags,
                mainDiags,
                isInBounds,
                traverseMatrix,
        };
    })();

    const Cell = function(token, rowIndex, colIndex) {
        const getToken = () => token;
        const getRowIndex = () => rowIndex;
        const getColIndex = () => colIndex;
        const changeToken = (newToken) => token = newToken;

        return {
            getToken,
            getRowIndex,
            getColIndex,
            changeToken,
        };
    };

    const GameBoard = function(size) {
        const _size = size;
        const getSize = () => _size;

        const _makeGrid = function(size) {
            let grid = [];
            for (let rowIndex = 0; rowIndex < size; rowIndex++) {
                let row = [];
                for (let colIndex = 0; colIndex < size; colIndex++) {
                    row.push(Cell(TOKENS.EMPTY, rowIndex, colIndex));
                }
                grid.push(row);
            }
            return grid;
        };
        const _grid = _makeGrid(size);
        const getGrid = () => _grid;
        const getCell = (rowIndex, colIndex) => _grid[rowIndex][colIndex];
        const clearGrid = function() {
            for (let rowIndex in _grid) {
                for (let colIndex in _grid[rowIndex]) {
                    let cell = getCell(rowIndex, colIndex);
                    cell.changeToken(TOKENS.EMPTY);
                }
            }
        };
        // grid organized by rows (how _grid is already arranged)
        const getRows = () => _grid;
        // grid organized by columns
        const _cols = matrixFuncs.cols(_grid).map(col => col.map(pos => getCell(pos[0], pos[1])));
        const getCols = () => _cols;
        // grid organized by diagonals
        const _antiDiags = matrixFuncs.antiDiags(_grid).map(antiDiag => antiDiag.map(pos => getCell(pos[0], pos[1])));
        const getAntiDiags = () => _antiDiags;
        const _mainDiags = matrixFuncs.mainDiags(_grid).map(mainDiag => mainDiag.map(pos => getCell(pos[0], pos[1])));
        const getMainDiags = () => _mainDiags;

        return {
            getSize,
            getGrid,
            getRows,
            getCols,
            getMainDiags,
            getAntiDiags,
            getCell,
            clearGrid
        };
    };

    const player = function(name, token) {
        const _playerName = name;
        const _playerToken = token;
        const getName = () => _playerName;
        const getPlayerToken = () => _playerToken;
        const _record = {
            wins: 0,
            losses: 0,
            ties: 0,
        };
        const winGame = () => {_record.wins++};
        const getRecord = () => _record;
        const setName = (newName) => {name = newName};

        return {
            getName,
            getPlayerToken,
            winGame,
            getRecord,
            setName
        };
    };

    const Players = [player("Player1", TOKENS.CROSS), player("Player2", TOKENS.NAUGHT)];

    // All info about the game in a 'snapshot'
    const gameState = (function() {
        const _gameBoard = GameBoard(3);
        const getGameBoard = () => _gameBoard;
        let _activePlayer = Players[0];
        const getActivePlayer = () => _activePlayer;
        const switchActivePlayer = function() {
            if (_activePlayer === Players[0]) {
                _activePlayer = Players[1];
            }
            else {
                _activePlayer = Players[0];
            }
        };
        let _isGameOver = false;
        const getIsGameOver = () => _isGameOver;
        const gameOver = () => _isGameOver = true;
        let _winningCells = [];
        const getWinningCells = () => _winningCells;
        const setWinningCells = (cells) => {
            for (let i in cells) {
                _winningCells.push(cells[i]);
            }
        };
        const reset = function() {
            _gameBoard.clearGrid();
            switchActivePlayer();
            _isGameOver = false;
            _winningCells = [];
        };

        return {
            getGameBoard,
            gameOver,
            getIsGameOver,
            getActivePlayer, 
            switchActivePlayer,
            setWinningCells,
            getWinningCells,
            reset
        };
    });

    const GameStateHistory = (function() {
        let currentIndex = 0;
        // history has starting gamestate
        const _history = [gameState()];
        const getHistory = () => _history;
        const addToHistory = (gs) => {
            currentIndex++;
            _history.splice(currentIndex, Infinity);
            _history.push(gs);
        };
        const getPreviousGameState = () => {
            currentIndex--;
        };
        const getCurrentIndex = () => currentIndex;
        const getCurrentGameState = () => _history[currentIndex];

        return {
            getCurrentIndex,
            getHistory,
            addToHistory,
            getPreviousGameState,
            getCurrentGameState,
        }
    })();

    // Takes a gamestate, makes a deep copy, mutates the copy, then returns it
    const GameController = function(gs, rowIndex, colIndex) {

        // makes a true copy of a gamestate
        const makeGameStateCopy = function() {
            const gameStateCopy = gameState();
    
            // make a true copy of the gameboard
            const boardCopy = gameStateCopy.getGameBoard();
            for (let rowIndex in boardCopy.getGrid()) {
                for (let colIndex in boardCopy.getGrid()[rowIndex]) {
                    const origCell = gs.getGameBoard().getCell(rowIndex, colIndex);
                    const newCell = boardCopy.getCell(rowIndex, colIndex);
                    newCell.changeToken(origCell.getToken());
                }
            }
    
            // match isGameOver
            if (gs.getIsGameOver()) {
                gameStateCopy.gameOver();
            }
    
            // match activePlayer
            if (gameStateCopy.getActivePlayer() !== gs.getActivePlayer()) {
                gameStateCopy.switchActivePlayer();
            }
    
            return gameStateCopy;
        }

        const gameStateCopy = makeGameStateCopy();

        const _boardSize = 3;
        const getBoardSize = () => _boardSize;
        const _countToWin = 3;
        const getCountToWin = () => 3;

        const isValidMove = function() {
            const isEmptyCell = gameStateCopy.getGameBoard().getCell(rowIndex, colIndex).getToken() === TOKENS.EMPTY;
            return isEmptyCell;
        };

        const getWinningCells = function() {
            const board = gameStateCopy.getGameBoard();
            const token = board.getCell(rowIndex, colIndex).getToken();

            const findCluster = function(cells) {
                let cellCluster = [];
                for (let i in cells) {
                    if (cells[i].getToken() === token) {
                        cellCluster.push(cells[i]);
                    }
                    else {
                        cellCluster = [];
                    }
                    if (cellCluster.length >= _countToWin) {
                        return cellCluster;
                    }
                }
                return null;
            }

            if (token !== TOKENS.EMPTY) {
            
                const row = board.getRows()[rowIndex];
                const col = board.getCols()[colIndex];
            
                // each diagonal has its own special value that all cells in the diagonal share
                // for antidiagonals that value is rowIndex + colIndex
                // for main diagonals that value is rowIndex + (lastColIndex - colIndex)
        
                const antiDiagSum = rowIndex + colIndex;
                const mainDiagSum = rowIndex + ((board.getGrid().length - 1) - colIndex);
                const antiDiag = board.getAntiDiags()[antiDiagSum];
                const mainDiag = board.getMainDiags()[mainDiagSum];

                console.log(antiDiagSum);
                console.log(mainDiagSum);
                console.log(antiDiag);
                console.log(mainDiag);
        
                const possibleWinPaths = [row, col, antiDiag, mainDiag];

                let allWinCells = possibleWinPaths.map(arr => findCluster(arr)).flat();
                allWinCells = allWinCells.filter(arr => arr !== null);
                if (allWinCells.length > 0) {
                    return allWinCells;
                }
                else {
                    return null;
                }
            }
            return null;
        };

        const isGameTied = function() {
            const board = gameStateCopy.getGameBoard();
            for (let rowIndex in board.getGrid()) {
                for (let colIndex in board.getGrid()[rowIndex]) {
                    if (board.getCell(rowIndex, colIndex).getToken() === TOKENS.EMPTY) {
                        return false;
                    }
                }
            }
            return true;
        };

        const placeToken = function() {
            const chosenCell = gameStateCopy.getGameBoard().getCell(rowIndex, colIndex);
            const activePlayerName = gameStateCopy.getActivePlayer().getName(); 
            const activePlayerToken = gameStateCopy.getActivePlayer().getPlayerToken();
            console.log(`${activePlayerName} put an ${activePlayerToken} on square [${rowIndex}, ${colIndex}]`);
            chosenCell.changeToken(activePlayerToken);
        };

        const playTurn = function() {
            if (isValidMove(rowIndex, colIndex)) {
                placeToken(rowIndex, colIndex);
                const winningCells = getWinningCells(rowIndex, colIndex);
                if (winningCells) {
                    console.log(`${gameStateCopy.getActivePlayer().getName()} wins!`);
                    gameStateCopy.setWinningCells(winningCells);
                    gameStateCopy.gameOver();
                }
                else if (isGameTied()) {
                    console.log("Game is tied!");
                    gameStateCopy.gameOver();
                }
                else {
                    gameStateCopy.switchActivePlayer();
                }
            }
            else {
                console.log("Not a valid move.")
            }
        };

        playTurn();
        return gameStateCopy;
    };
    
    const GameDisplayController = (function() {

        const boardDiv = document.querySelector(".board-container");

        const makeDisplayCell = function(cell) {
            const displayCell = document.createElement("div");
            displayCell.classList.add("cell");
            displayCell.dataset['rowIndex'] = cell.getRowIndex();
            displayCell.dataset['colIndex'] = cell.getColIndex();
            displayCell.textContent = cell.getToken();
            return displayCell;
        };

        const clearBoardDisplay = function() {
            while (boardDiv.hasChildNodes()) {
                boardDiv.removeChild(boardDiv.lastChild);
            }
        };

        const startNewGame = function() {
            // do smthing
        };

        const highlightWinSquares = function() {
            const winningCells = GameStateHistory.getCurrentGameState().getWinningCells();
            for (const i in winningCells) {
                const rowIndex = winningCells[i].getRowIndex();
                const colIndex = winningCells[i].getColIndex();
                const wonDisplayCell = document.querySelector(`[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`);
                wonDisplayCell.classList.add("won");
            }
        };

        const updateBoardDisplay = function() {
            clearBoardDisplay();
            // unnest grid to make it easier to work with
            const flatGrid = GameStateHistory.getCurrentGameState().getGameBoard().getGrid().flat();
            flatGrid.forEach(cell => {
                const displayCell = makeDisplayCell(cell);
                boardDiv.appendChild(displayCell);
            });
            if (GameStateHistory.getCurrentGameState().getIsGameOver()) {
                highlightWinSquares();
            }
        };
        
        const boardListener = function(e) {

            const clickedRowIndex = e.target.dataset['rowIndex'];
            const clickedColIndex = e.target.dataset['colIndex'];

            // something besides a board square was clicked
            if (!clickedRowIndex || !clickedColIndex) {
                return;
            }

            // run if game is NOT over
            if (!GameStateHistory.getCurrentGameState().getIsGameOver()) {
                const currentGs = GameStateHistory.getCurrentGameState();
                const newGameState = GameController(currentGs, parseInt(clickedRowIndex), parseInt(clickedColIndex));
                GameStateHistory.addToHistory(newGameState);
                updateBoardDisplay();
            }
            else {
                return;
            }
        };

        boardDiv.addEventListener("click", boardListener);

        return {
            boardDiv,
            startNewGame,
            updateBoardDisplay,
        };
    })();

    const ButtonsController = (function() {
        const newGameButton = document.querySelector(".new-game");
        const undoButton = document.querySelector(".undo");
        const redoButton = document.querySelector(".redo");

        const startNewGame = function(e) {
            console.log("New game started.");
            GameDisplayController.startNewGame();
            GameDisplayController.updateBoardDisplay();
        };

        const undoMove = function(e) {
            console.log("Went back one move.");
            GameStateHistory.getPreviousGameState();
            GameDisplayController.updateBoardDisplay();
        };

        newGameButton.addEventListener("click", startNewGame);

        undoButton.addEventListener("click", undoMove);
    })();

// first screen update using default 3x3 board
GameDisplayController.updateBoardDisplay();

 