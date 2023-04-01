
    "use strict";


    // a left diagonal looks like "/"


    const TOKENS = {
        EMPTY: "E",
        NAUGHT: "O",
        CROSS: "X",
    };

    const DISPLAYED_SYMBOLS = {
        EMPTY: document.createTextNode(""),
        NAUGHT: document.createTextNode("O"),
        CROSS: document.createTextNode("X"),
    };

    // useful generic functions for working with 2d arrays - functions never return matrix contents, only [rowIndex, colIndex] coordinates
    // "pos" and "step" are always a [rowIndex, colIndex] coordinate
    const matrixFuncs = (function() {

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
        const leftDiags = function(matrix) {
            const startingRow = rows(matrix)[0];
            const startingCol = cols(matrix)[matrix.length - 1].slice(1, matrix.length);
            const startingCells = startingRow.concat(startingCol);
            const leftDiags = startingCells.map(coordinate => traverseMatrix(matrix, coordinate, [1, -1]));
            return leftDiags;
        };
        const rightDiags = function(matrix) {
            const startingRow = rows(matrix)[0].reverse();
            const startingCol = cols(matrix)[0].slice(1, matrix.length);
            const startingCells = startingRow.concat(startingCol);
            const rightDiags = startingCells.map(coordinate => traverseMatrix(matrix, coordinate, [1,1]));
            return rightDiags;
        };
        // currently only valid for square matrices, could be adjusted easily for non-standard shapes
        const isInBounds = function(matrix, pos) {
            const rowInBounds = (pos[0] >= 0) && (pos[0] < matrix.length);
            const colInBounds = (pos[1] >= 0) && (pos[1] < matrix.length);
            const isInBounds = rowInBounds && colInBounds;
            return isInBounds;
        };
        // from a starting point, keep stepping with a given coordinate, collecting position of every cell that is landed on
        const traverseMatrix = function(matrix, startPos, step) {
            let passedCells = [];
            let currentPos = startPos;
            while (isInBounds(matrix, currentPos)) {
                passedCells.push(currentPos);
                currentPos = [currentPos[0] + step[0], currentPos[1] + step[1]];
            }
            return passedCells;
        };

        return {
                rows,
                cols,
                leftDiags,
                rightDiags,
                isInBounds,
                traverseMatrix,
        };
    })();

    const cell = function(token, rowIndex, colIndex) {
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

    const Gameboard = (function(size) {
        const _makeGrid = function(size) {
            let grid = [];
            for (let rowIndex = 0; rowIndex < size; rowIndex++) {
                let row = [];
                for (let colIndex = 0; colIndex < size; colIndex++) {
                    row.push(cell(TOKENS.EMPTY, rowIndex, colIndex));
                }
                grid.push(row);
            }
            return grid;
        };
        let _grid = _makeGrid(size);
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
        const getRows = () => _grid;
        // 2d array organized by columns
        const _cols = matrixFuncs.cols(_grid).map(col => col.map(pos => getCell(pos[0], pos[1])));
        const getCols = () => _cols;
        // 2d array organized by diagonals
        const _diags = matrixFuncs.leftDiags(_grid).map(diag => diag.map(pos => getCell(pos[0], pos[1])));
        const getDiags = () => _diags;

        const _antiDiags = matrixFuncs.rightDiags(_grid).map(antiDiag => antiDiag.map(pos => getCell(pos[0], pos[1])));
        const getAntiDiags = () => _antiDiags;

        return {
            getGrid,
            getRows,
            getCols,
            getDiags,
            getAntiDiags,
            getCell,
            clearGrid
        };
    });

    const player = function(name, token) {
        const getName = () => name;
        const getPlayerToken = () => token;
        const _record = {
            wins: 0,
            losses: 0,
            ties: 0,
        };
        const winGame = function() {
            _record.wins++;
        }
        const getRecord = () => _record;
        const setName = (newName) => name = newName;

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
        const countToWin = 3;

        const board = Gameboard(3);

        const Players = {
            playerOne: player("unknown", TOKENS.CROSS),
            playerTwo: player("unknown", TOKENS.NAUGHT)
        };

        let activePlayer = Players["playerOne"];

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
            const isEmptyCell = Gameboard.getCell(rowIndex, colIndex).getToken() === TOKENS.EMPTY;
            return isEmptyCell;
        };

        const isGameOver = (function() {
            const isCellWinner = function(cell) {
                if (cell.getToken() !== TOKENS.EMPTY) {
                const token = cell.getToken();
                const rowIndex = cell.getRowIndex();
                const colIndex = cell.getColIndex();
     
                const isRowWinner = checkForCluster(Gameboard.getRows()[rowIndex].map(cell => cell.getToken()), token);
                const isColWinner = checkForCluster(Gameboard.getCols()[colIndex].map(cell => cell.getToken()), token);
     
                // each diagonal has its own special value that all cells in the diagonal share
                // for right diagonals that value is rowIndex + colIndex
                // for left diagonals that value is rowIndex + (lastColIndex - colIndex)
     
                const leftDiagSum = rowIndex + colIndex;
                const rightDiagSum = rowIndex + ((Gameboard.getGrid().length - 1) - colIndex);
     
                const isLeftDiagWinner = checkForCluster(Gameboard.getDiags()[leftDiagSum].map(cell => cell.getToken()), token);
                const isRightDiagWinner = checkForCluster(Gameboard.getAntiDiags()[rightDiagSum].map(cell => cell.getToken()), token);
                const isDiagWinner = isLeftDiagWinner || isRightDiagWinner;
     
                const isWinner = isRowWinner || isColWinner || isDiagWinner;
                return isWinner;
                }
                else {
                    return false;
                }
            };

            const isGameTied = function() {
                Gameboard.getGrid.flat(2).forEach(function(cell) {
                    if (cell.getToken() !== "TOKENS.EMPTY") {
                        return false;
                    }
                });
                return true;
            };

            return {

            };
        })();

        const switchActivePlayer = function() {
            if (activePlayer === Players["playerOne"]) {
                activePlayer = Players["playerTwo"];
            }
            else {
                activePlayer = Players["playerOne"];
            }
        };

        const makeMove = function(activePlayer) {
            const playerMove = getPlayerMove();
            const chosenCell = Gameboard.getCell(playerMove[0], playerMove[1])
            chosenCell.changeToken(activePlayer.getPlayerToken());
            return chosenCell;
        };

        const playGame = function() {
            Players["playerOne"].setName(getPlayerNameChoice());
            Players["playerTwo"].setName(getPlayerNameChoice());
            while (true) {
                const moveCell = makeMove(activePlayer);
                printGameBoard();
                if (lookForWinner(moveCell)) {
                    break;
                }
                switchActivePlayer(activePlayer);
            }
        }

        // checks an array to see if a certain element appears a certain number of times in a row
        function checkForCluster(arr, wantedElement) {
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

        const printGameBoard = function() {
            Gameboard.getGrid().forEach(row => {
                let rowString = "";
                row.forEach(cell => {
                    rowString = rowString.concat(cell.getToken());
                });
                console.log(rowString);
            });
        }

        return {
            playGame,
            printGameBoard
        };
    });


    const DisplayController = (function() {

        const game = GameController();

        const _makeEmptyCell = function(rowIndex, colIndex) {
            const newCell = document.createElement("div");
            newCell.dataset["row"] = rowIndex.toString();
            newCell.dataset["col"] = colIndex.toString();
            newCell.classList.add("cell");
            return newCell;
        }

        const _makeCell = function(rowIndex, colIndex, DISPLAYED_SYMBOL) {
            const newCell = document.createElement("div");
            newCell.dataset["row"] = rowIndex.toString();
            newCell.dataset["col"] = colIndex.toString();
            newCell.classList.add("cell");
            cellContents.appendChild(DISPLAYED_SYMBOL);
            return newCell;
        }
        
        const _makeEmptyGrid = function(size) {
            const newGrid = document.createElement("div");
            for (let row = 0; row < size; row++) {
                for (let col = 0; col < size; col++) {
                    const newCell = _makeEmptyCell(row, col);
                    newGrid.appendChild(newCell);
                }
            }
            return newGrid;
        }

        const _changeCellSymbol = function(cell, newSymbol) {
            const oldSymbol = cell.firstChild;
            cell.replaceChild(newSymbol, oldSymbol);
        }

        const _makeGrid = function() {
            grid = gameBoard.getGrid();
            const newGrid = document.createElement("div");
            for (row in grid) {
                for (col in grid[row]) {
                    const cellSymbol = gameBoard.getCellSymbol(row, col);
                    const newCell = _makeCell(row, col, cellSymbol);
                    newGrid.appendChild("newCell");
                }
            }
            return newGrid;
        }

        const displayGrid = function() {
            const grid = _makeEmptyGrid(Gameboard.getSize());
            grid.classList.add("board-grid");
            const boardDisplay = document.querySelector(".game-board");
            boardDisplay.appendChild(grid);
        }
        
        return {
            displayGrid,
        }
    })(Gameboard);

    const BoardClickObserver = (function(boardDisplay) {

    })(BoardDisplayController);

    function runGame() {
        BoardDisplayController.displayGrid();
    }

    runGame();


    function addListener(grid) {
        grid.array.forEach(element => {
            element.addEventListener("click", (element => {

            }));
        });
    }

