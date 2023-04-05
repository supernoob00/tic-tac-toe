
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
        let _token = token;
        const _rowIndex = rowIndex;
        const _colIndex = colIndex;

        const getToken = () => _token;
        const getRowIndex = () => _rowIndex;
        const getColIndex = () => _colIndex;
        const changeToken = (newToken) => _token = newToken;

        return {
            getToken,
            getRowIndex,
            getColIndex,
            changeToken,
        };
    };

    const GameBoard = (function(size) {
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
            for (rowIndex in _grid) {
                for (colIndex in _grid[rowIndex]) {
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
            getGrid,
            getRows,
            getCols,
            getMainDiags,
            getAntiDiags,
            getCell,
            clearGrid
        };
    });

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

    // controls rules of the game, win condition checks
    const GameController = (function() {
        let countToWin = 3;

        let gameBoard = GameBoard(3);

        const getGameBoard = () => gameBoard;

        const setGameBoard = (newGameBoard) => gameBoard = newGameBoard;

        let _isGameOver = false;

        const isGameOver = () => _isGameOver;

        const gameOver = () => _isGameOver = true;

        const whoWon = function() {
            if (isGameOver) {
                getActivePlayer();
            }
            else {
                return null;
            }
        }

        const Players = {
            playerOne: player("Player1", TOKENS.CROSS),
            playerTwo: player("Player2", TOKENS.NAUGHT)
        };

        let activePlayer = Players["playerOne"];

        const getActivePlayer = () => activePlayer;

        const getPlayerNameChoice = function() {
            const playerName = prompt("Enter your name: ");
            return playerName;
        }

        const getPlayerMove = function() {
            const rowIndex = prompt("Enter row index: ");
            const colIndex = prompt("Enter col index: ");
            return [rowIndex, colIndex];
        }

        const isValidMove = function(rowIndex, colIndex) {
            const isEmptyCell = gameBoard.getCell(rowIndex, colIndex).getToken() === TOKENS.EMPTY;
            return isEmptyCell;
        };

        const isCellWinner = function(rowIndex, colIndex) {
            // checks an row, column or diagonal to see if a certain element appears required amount of times in a row to win
            const checkForCluster = function(arr, wantedElement) {
                let count = 0;
                for (let i in arr) {
                    if (arr[i] === wantedElement) {
                        count++;
                    }
                    else {
                        count = 0;
                    }
                    if (count >= countToWin) {
                        console.log('true');
                        return true;
                    }
                }
                return false;
            }

            const token = gameBoard.getCell(rowIndex, colIndex).getToken();
            if (token !== TOKENS.EMPTY) {
    
            const isRowWinner = checkForCluster(gameBoard.getRows()[rowIndex].map(cell => cell.getToken()), token);
            const isColWinner = checkForCluster(gameBoard.getCols()[colIndex].map(cell => cell.getToken()), token);
    
            // each diagonal has its own special value that all cells in the diagonal share
            // for right diagonals that value is rowIndex + colIndex
            // for left diagonals that value is rowIndex + (lastColIndex - colIndex)
    
            const antiDiagSum = rowIndex + colIndex;
            const mainDiagSum = rowIndex + ((gameBoard.getGrid().length - 1) - colIndex);
    
            const isAntiDiagWinner = checkForCluster(gameBoard.getAntiDiags()[antiDiagSum].map(cell => cell.getToken()), token);
            const isMainDiagWinner = checkForCluster(gameBoard.getMainDiags()[mainDiagSum].map(cell => cell.getToken()), token);
            const isDiagWinner = isAntiDiagWinner || isMainDiagWinner;
    
            const isWinner = isRowWinner || isColWinner || isDiagWinner;
            return isWinner;
            }
            else {
                return false;
            }
        };

        const isGameTied = function() {
            for (let rowIndex in gameBoard.getGrid()) {
                for (let colIndex in gameBoard.getGrid()[rowIndex]) {
                    if (gameBoard.getCell(rowIndex, colIndex).getToken() === TOKENS.EMPTY) {
                        return false;
                    }
                }
            }
            return true;
        };

        const switchActivePlayer = function() {
            if (activePlayer === Players["playerOne"]) {
                activePlayer = Players["playerTwo"];
            }
            else {
                activePlayer = Players["playerOne"];
            }
        };

        const makeMove = function(rowIndex, colIndex) {
            const chosenCell = gameBoard.getCell(rowIndex, colIndex);
            console.log(`${activePlayer.getName()} put an ${activePlayer.getPlayerToken()} on square [${rowIndex}, ${colIndex}]`);
            chosenCell.changeToken(activePlayer.getPlayerToken());
        };

        const playRound = function(chosenRowIndex, chosenColIndex) {
            if (isValidMove(chosenRowIndex, chosenColIndex)) {
                makeMove(chosenRowIndex, chosenColIndex);
                if (isCellWinner(chosenRowIndex, chosenColIndex)) {
                    console.log(`${activePlayer.getName()} wins!`);
                    gameOver();
                }
                else if (isGameTied()) {
                    console.log(gameBoard.getGrid().flat());
                    console.log(gameBoard.getGrid().flat()[0].getToken());
                    console.log("Game is tied!");
                    gameOver();
                }
                else {
                    switchActivePlayer();
                }
            }
            else {
                console.log("Not a valid move.")
            }
        };

        const printGameBoard = function() {
            Gameboard.getGrid().forEach(row => {
                let rowString = "";
                row.forEach(cell => {
                    rowString = rowString.concat(cell.getToken());
                });
                console.log(rowString);
            });
        };

        return {
            getActivePlayer,
            isGameOver,
            getGameBoard,
            setGameBoard,
            playRound,
            makeMove,
            printGameBoard
        };
    });




    const GameDisplayController = (function() {
        let game = GameController();

        const getGame = () => game;

        const startNewGame = () => game = GameController();

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

        const updateBoardDisplay = function() {
            clearBoardDisplay();
            // unnest grid to make it easier to work with
            const grid = game.getGameBoard().getGrid().flat();
            grid.forEach(cell => {
                const displayCell = makeDisplayCell(cell);
                boardDiv.appendChild(displayCell);
            });
        };
        
        const boardListener = function(e) {

            const clickedRowIndex = e.target.dataset['rowIndex'];
            const clickedColIndex = e.target.dataset['colIndex'];

            // something besides a board square was clicked
            if (!clickedRowIndex || !clickedColIndex) {
                return;
            }

            // run if game is NOT over
            if (!game.isGameOver()) {
                game.playRound(parseInt(clickedRowIndex), parseInt(clickedColIndex));
                updateBoardDisplay();
            }
            else {
                return;
            }
        }

        boardDiv.addEventListener("click", boardListener);

        return {
            getGame,
            startNewGame,
            boardDiv,
            updateBoardDisplay,
        }
    })();

    // For any buttons outside of the actual game grid
    const ButtonsController = (function() {
        const newGameButton = document.querySelector(".new-game-button");

        const startNewGame = function(e) {
            console.log("New game started.");
            GameDisplayController.startNewGame();
            GameDisplayController.updateBoardDisplay();
        };

        newGameButton.addEventListener("click", startNewGame);
    })();
        


GameDisplayController.updateBoardDisplay();

