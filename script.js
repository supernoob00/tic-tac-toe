
"use strict";

const TOKENS = {
    EMPTY: "",
    NAUGHT: "O",
    CROSS: "X",
};

const COUNTS_TO_WIN = {
    3: 3,
    5: 4,
    7: 5,
}

// useful generic functions for working with 2d arrays 
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
    let _playerName = name;
    let _playerToken = token;
    const getName = () => _playerName;
    const setName = (newName) => _playerName = newName;
    const getPlayerToken = () => _playerToken;
    const setPlayerToken = (newToken) => _playerToken = newToken;
    const winGame = () => {_record.wins++};

    return {
        getName,
        getPlayerToken,
        setPlayerToken,
        winGame,
        setName
    };
};

const Players = (function() {
    const _playerList = [player("Player 1", TOKENS.CROSS), player("Player 2", TOKENS.NAUGHT)];
    const getPlayerOne = () => _playerList[0];
    const getPlayerTwo = () => _playerList[1];
    const setPlayerTokens = (playerOneToken, playerTwoToken) => {
        _playerList[0].setPlayerToken(playerOneToken);
        _playerList[1].setPlayerToken(playerTwoToken);
    };
    const setPlayerOneFirst = () => {
        _playerList[0].setPlayerToken(TOKENS.CROSS);
        _playerList[1].setPlayerToken(TOKENS.NAUGHT);
    };
    const setPlayerTwoFirst = () => {
        _playerList[0].setPlayerToken(TOKENS.NAUGHT);
        _playerList[1].setPlayerToken(TOKENS.CROSS);
    };
    const getFirstPlayer = () => {
        return _playerList[0].getPlayerToken() === TOKENS.CROSS ? _playerList[0] : _playerList[1];
    };


    return {
        getPlayerOne,
        getPlayerTwo,
        setPlayerTokens,
        setPlayerOneFirst,
        setPlayerTwoFirst,
        getFirstPlayer,
    };
})();

// All info about the game in a 'snapshot'
const gameState = (function(size, countToWin, activePlayer) {
    const getSize = () => size;
    const _gameBoard = GameBoard(size);
    const getGameBoard = () => _gameBoard;
    const _countToWin = countToWin;
    const getCountToWin = () => _countToWin;
    let _activePlayer = activePlayer;
    const getActivePlayer = () => _activePlayer;
    const setActivePlayer = (newActive) => _activePlayer = newActive;
    let _isGameOver = false;
    const getIsGameOver = () => _isGameOver;
    const gameOver = () => _isGameOver = true;
    let _winningCells = [];
    const isGameWon = () => _winningCells.length > 0;
    const isGameTied = () => _isGameOver && !isGameWon();
    const getWinningCells = () => _winningCells;
    const setWinningCells = (cells) => {
        for (let i in cells) {
            _winningCells.push(cells[i]);
        }
    };

    return {
        getSize,
        getGameBoard,
        getCountToWin,
        gameOver,
        getIsGameOver,
        getActivePlayer, 
        setActivePlayer,
        isGameWon,
        isGameTied,
        setWinningCells,
        getWinningCells,
    };
});

// a Game is composed of game states
const GameStateHistory = function(startingGameState) {
    let currentIndex = 0;
    // history has starting gamestate
    let _history = [startingGameState];
    const getHistory = () => _history;
    const addToHistory = (gs) => {
        currentIndex++;
        _history.splice(currentIndex, Infinity);
        _history.push(gs);
    };
    const goBack = () => {
        currentIndex--;
    };
    const goToStart = () => {
        currentIndex = 0;
    };
    const goForward = () => {
        currentIndex++;
    };
    const goToLatest = () => {
        currentIndex = _history.length - 1;
    };
    const getCurrentIndex = () => currentIndex;
    const getLastIndex = () => _history.length - 1;
    const getCurrentGameState = () => _history[currentIndex];
    const getLatestGameState = () => _history[_history.length - 1];
    const clearHistory = () => {
        _history = [_history[0]];
        currentIndex = 0;
    };
    const startNewHistory = (startingGameState) => {
        currentIndex = 0;
        _history = [startingGameState];
        startingGameState.getActivePlayer() === Players.getPlayerOne() ? Players.playerOneFirst() : Players.playerTwoFirst;
    };
    const isGameWon = () => getLatestGameState().isGameWon();
    const isGameTied = () => getLatestGameState().isGameTied();

    return {
        getCurrentIndex,
        getLastIndex,
        getHistory,
        addToHistory,
        goBack,
        goToStart,
        goForward,
        goToLatest,
        getCurrentGameState,
        getLatestGameState,
        clearHistory,
        startNewHistory,
        isGameWon,
        isGameTied,
    }
};

// Takes a gamestate, makes a deep copy, mutates the copy, then returns it 
const GameStateModifier = function(gs, rowIndex, colIndex) {

    const _boardSize = gs.getGameBoard().getSize();
    const _countToWin = gs.getCountToWin();
    const _activePlayer = gs.getActivePlayer();

    // makes a true copy of a gamestate
    const makeGameStateCopy = function() {
        const gameStateCopy = gameState(_boardSize, _countToWin, _activePlayer);

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

        return gameStateCopy;
    }

    const gameStateCopy = makeGameStateCopy();

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

    const switchActivePlayer = function() {
        if (gameStateCopy.getActivePlayer() === Players.getPlayerOne()) {
            gameStateCopy.setActivePlayer(Players.getPlayerTwo());
        }
        else {
            gameStateCopy.setActivePlayer(Players.getPlayerOne());
        }
    };

    const placeToken = function() {
        const chosenCell = gameStateCopy.getGameBoard().getCell(rowIndex, colIndex);
        const activePlayerName = gameStateCopy.getActivePlayer().getName(); 
        const activePlayerToken = gameStateCopy.getActivePlayer().getPlayerToken();
        chosenCell.changeToken(activePlayerToken);
    };

    const playTurn = function() {
        if (isValidMove(rowIndex, colIndex)) {
            placeToken(rowIndex, colIndex);
            const winningCells = getWinningCells(rowIndex, colIndex);
            if (winningCells) {
                gameStateCopy.setWinningCells(winningCells);
                gameStateCopy.gameOver();
            }
            else if (isGameTied()) {
                gameStateCopy.gameOver();
            }
            else {
                switchActivePlayer();
            }
        }
        else {
            // do nothing
        }
    };

    playTurn();
    return gameStateCopy;
};

const GameController = (function() {
    const defaultGame = GameStateHistory(gameState(3, 3, Players.getPlayerOne()))
    let _currentGame = defaultGame;
    const _playedGames = [];
    const getCurrentGame = () => _currentGame;
    const getCurrentTurn = () => _currentGame.getCurrentGameState();
    const startNewGame = (boardSize, countToWin, firstPlayer) => {
        const startingGameState = gameState(boardSize, countToWin, firstPlayer);
        _currentGame = GameStateHistory(startingGameState);
        firstPlayer === Players.getPlayerOne() ? Players.setPlayerOneFirst() : Players.setPlayerTwoFirst();
    };
    return {
        getCurrentGame,
        getCurrentTurn,
        startNewGame
    };
})();

// ALL DOM STUFF BELOW HERE 

const boardDiv = document.querySelector(".board-container");

const gameHistoryButtons = document.querySelectorAll(".game-history-button");
const toStartButton = document.querySelector(".to-start");
const backButton = document.querySelector(".back");
const forwardButton = document.querySelector(".forward");
const toLatestButton = document.querySelector(".to-latest");

const playerOneNameButton = document.querySelector(".edit-name-button.player-one");
const playerTwoNameButton = document.querySelector(".edit-name-button.player-two");

const playerOneNameTextField = document.querySelector(".name-text-field.player-one");
const playerTwoNameTextField = document.querySelector(".name-text-field.player-two");


const nameSubmitButtons = document.querySelectorAll(".name-submit-button");
const playerOneNameSubmitButton = document.querySelector(".name-submit-button.player-one");
const playerTwoNameSubmitButton = document.querySelector(".name-submit-button.player-two");


const BoardDisplayController = (function() {
    const makeDisplayCell = function(cell) {
        const displayCell = document.createElement("div");
        displayCell.classList.add("cell");
        displayCell.dataset['rowIndex'] = cell.getRowIndex();
        displayCell.dataset['colIndex'] = cell.getColIndex();
        displayCell.textContent = cell.getToken();

        const boardSize = GameController.getCurrentTurn().getGameBoard().getSize();
        if (boardSize === 3) {
            displayCell.style["font-size"] = "10em";
        }
        else if (boardSize === 5) {
            displayCell.style["font-size"] = "6em";
        }
        else if (boardSize === 7) {
            displayCell.style["font-size"] = "4em";
        }
        return displayCell;
    };
    const clearBoardDisplay = function() {
        while (boardDiv.hasChildNodes()) {
            boardDiv.removeChild(boardDiv.lastChild);
        }
    };
    const highlightWinSquares = function() {
        const winningCells = GameController.getCurrentTurn().getWinningCells();
        for (const i in winningCells) {
            const rowIndex = winningCells[i].getRowIndex();
            const colIndex = winningCells[i].getColIndex();
            const wonDisplayCell = document.querySelector(`[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`);
            wonDisplayCell.classList.add("won");
        }
    };
    const updateBoardDisplay = function() {
        clearBoardDisplay();
        // set board size
        document.documentElement.style.setProperty("--board-size", GameController.getCurrentTurn().getSize());
        // unnest grid to make it easier to work with
        const flatGrid = GameController.getCurrentTurn().getGameBoard().getGrid().flat();
        flatGrid.forEach(cell => {
            const displayCell = makeDisplayCell(cell);
            boardDiv.appendChild(displayCell);
        });
        if (GameController.getCurrentTurn().getIsGameOver()) {
            const cells = document.querySelectorAll(".cell");
            for (const cell of cells) {
                cell.classList.add("disabled");
            }
            highlightWinSquares();
        }    
    };
    return {
        updateBoardDisplay,
    }
})();

const PlayersDisplayController = (function() {
    const highlightActivePlayer = function() {
        const playerOne = document.querySelector(".player-one-card");
        const playerTwo = document.querySelector(".player-two-card");
        if (GameController.getCurrentTurn().getActivePlayer() === Players.getPlayerOne()) {
            playerTwo.classList.remove("active-player");
            playerOne.classList.add("active-player");
        }
        else {
            playerOne.classList.remove("active-player");
            playerTwo.classList.add("active-player");
        }
    };
    const showPlayerTokens = function() {
        const playerOneTokenDisplay = document.querySelector(".player-one-token");
        const playerTwoTokenDisplay = document.querySelector(".player-two-token");
        playerOneTokenDisplay.textContent = `${Players.getPlayerOne().getPlayerToken()}`;
        playerTwoTokenDisplay.textContent = `${Players.getPlayerTwo().getPlayerToken()}`;
    };
    const updatePlayerNames = function() {
        const playerOneName = document.querySelector(".player-one-name");
        const playerTwoName = document.querySelector(".player-two-name");

        playerOneName.textContent = Players.getPlayerOne().getName();
        playerTwoName.textContent = Players.getPlayerTwo().getName();
    };
    const togglePlayerOneNameField = function() {
        const playerOneNameField = document.querySelector(".player-one-name-field");
        playerOneNameField.classList.toggle("hidden");
    };
    const togglePlayerTwoNameField = function() {
        const playerTwoNameField = document.querySelector(".player-two-name-field");
        playerTwoNameField.classList.toggle("hidden");
    };
    const showWinningPlayer = function() {
        const resultInfo = document.querySelector(".game-result-info");
        // a player won
        if (GameController.getCurrentGame().isGameWon()) {
            const winningPlayer = GameController.getCurrentGame().getLatestGameState().getActivePlayer();
            switch (winningPlayer) {
                case Players.getPlayerOne() : 
                    resultInfo.textContent = `${Players.getPlayerOne().getName()} wins!`;
                    break;
                case Players.getPlayerTwo() : 
                    resultInfo.textContent = `${Players.getPlayerTwo().getName()} wins!`;
                    break;
            }
        }
        else if (GameController.getCurrentGame().isGameTied()) {
            resultInfo.textContent = "Game is tied.";
        }
        else {
            resultInfo.textContent = "";
        }
    };
    const updateFormPlayerNames = function() {
        const playerOneFormName = document.querySelector("#first-player-select .player-one");
        const playerTwoFormName = document.querySelector("#first-player-select .player-two");
        playerOneFormName.textContent = Players.getPlayerOne().getName();
        playerTwoFormName.textContent = Players.getPlayerTwo().getName();
    };
    const updatePlayersDisplay = function() {
        showPlayerTokens()
        highlightActivePlayer();
        showWinningPlayer();
    };
    return {
        updatePlayersDisplay,
        updatePlayerNames,
        togglePlayerOneNameField,
        togglePlayerTwoNameField,
        showWinningPlayer,
        updateFormPlayerNames,
    };
})();

const GameButtonsDisplayController = (function() {
    let _gameHistoryButtonsEnabled = true;

    const enableGameHistoryButtons = () => _gameHistoryButtonsEnabled = true;
    const disableGameHistoryButtons = () => _gameHistoryButtonsEnabled = false;

    const disableButton = function(gameButton) {
        gameButton.disabled = true;
        gameButton.classList.add("disabled");
    };
    const enableButton = function(gameButton) {
        gameButton.disabled = false;
        gameButton.classList.remove("disabled");
    }
    const updateGameButtonsDisplay = function() {
        if (_gameHistoryButtonsEnabled) {
            // re-enable all buttons first
            for (const button of gameHistoryButtons) {
                enableButton(button);
            }
            if (GameController.getCurrentGame().getCurrentIndex() === 0) {
                disableButton(backButton);
                disableButton(toStartButton);
            }
            // redo button disabled if GameStateHistory current index is at the last index
            // to end button disabled if redo button disabled
            if (GameController.getCurrentGame().getCurrentIndex() === GameController.getCurrentGame().getLastIndex()) {
                disableButton(forwardButton);
                disableButton(toLatestButton);
            }
            }
            else {
                if (GameController.getCurrentGame().getLatestGameState().getIsGameOver()) {
                    _gameHistoryButtonsEnabled = true;
                    updateGameButtonsDisplay();
                }
                else {
                    for (const button of gameHistoryButtons) {
                    disableButton(button);
                }
            }
        }
    }

    return {
        enableGameHistoryButtons,
        disableGameHistoryButtons,
        updateGameButtonsDisplay,
    };
})();

const updateGameDisplay = function() {
    BoardDisplayController.updateBoardDisplay();
    PlayersDisplayController.updatePlayersDisplay();
    GameButtonsDisplayController.updateGameButtonsDisplay();
};

const boardListener = (function() {
    const boardListener = function(e) {
        const clickedRowIndex = e.target.dataset['rowIndex'];
        const clickedColIndex = e.target.dataset['colIndex'];

        // something besides a board square was clicked
        if (!clickedRowIndex || !clickedColIndex) {
            return;
        }

        // run if game is NOT over
        if (!GameController.getCurrentTurn().getIsGameOver()) {
            const currentGs = GameController.getCurrentTurn();
            const newGameState = GameStateModifier(currentGs, parseInt(clickedRowIndex), parseInt(clickedColIndex));
            GameController.getCurrentGame().addToHistory(newGameState);

            updateGameDisplay();
        }
        else {
            return;
        }
    };
    boardDiv.addEventListener("click", boardListener);
})();

const gameHistoryButtonsListener = (function() {
    const gameButtonAction = function(e) {
        const chosenButton = e.currentTarget;
        switch (chosenButton) {
            case toStartButton : 
                GameController.getCurrentGame().goToStart();
                break;
            case backButton :
                GameController.getCurrentGame().goBack();
                break;
            case forwardButton :
                GameController.getCurrentGame().goForward();
                break;
            case toLatestButton :
                GameController.getCurrentGame().goToLatest();
                break;
        }

        updateGameDisplay();
    };
    for (const button of gameHistoryButtons) {
        button.addEventListener("click", gameButtonAction);
    }
})();

const playersListener = (function() {
    const playerButtonAction = function(e) {
        const button = e.currentTarget;
        switch (button) {
            case playerOneNameButton : 
                PlayersDisplayController.togglePlayerOneNameField();
                break;
            case playerTwoNameButton :
                PlayersDisplayController.togglePlayerTwoNameField();
                break;
        }
    }
    playerOneNameButton.addEventListener("click", playerButtonAction);
    playerTwoNameButton.addEventListener("click", playerButtonAction);
})();

const playerNameSubmitListener = (function() {
    const nameSubmitButtonAction = function(e) {
        const chosenButton = e.currentTarget;
        switch (chosenButton) {
            case playerOneNameSubmitButton :
                if (playerOneNameTextField.value === "") {
                    Players.getPlayerOne().setName("Player 1");
                }
                else {
                    Players.getPlayerOne().setName(playerOneNameTextField.value);
                }
                PlayersDisplayController.togglePlayerOneNameField();
                break;
            case playerTwoNameSubmitButton : 
                if (playerTwoNameTextField.value === "") {
                    Players.getPlayerTwo().setName("Player 2");
                }
                else {
                    Players.getPlayerTwo().setName(playerTwoNameTextField.value);
                }
                PlayersDisplayController.togglePlayerTwoNameField();
                break;
        }
        PlayersDisplayController.updatePlayerNames();
        PlayersDisplayController.showWinningPlayer();
        PlayersDisplayController.updateFormPlayerNames();
    };
    for (const button of nameSubmitButtons) {
        button.addEventListener("click", nameSubmitButtonAction);
    }
})();

const NewGameFormController = (function() {
    const gameOptionsForm = document.querySelector("#game-options-form");

    const formBoardSize = function() {
        const boardSize = parseInt(gameOptionsForm["board-size"].value);
        return boardSize;
    };

    const formFirstPlayer = function() {
        const firstPlayerValue = gameOptionsForm["first-player"].value;
        let firstPlayer;
        if (firstPlayerValue === "player-one") {
            firstPlayer = Players.getPlayerOne();
        }
        else if (firstPlayerValue === "player-two") {
            firstPlayer = Players.getPlayerTwo();
        }
        else if (firstPlayerValue === "random") {
            const coinFlip = Math.floor(Math.random() * 2);
            coinFlip === 0 ? firstPlayer = Players.getPlayerOne() : firstPlayer = Players.getPlayerTwo();
        }
        return firstPlayer;
    };

    const formPracticeModeEnabled = function() {
        const practiceModeEnabled = gameOptionsForm["practice-mode"]
            if (practiceModeEnabled.checked) {
                GameButtonsDisplayController.enableGameHistoryButtons();
            }
            else {
                GameButtonsDisplayController.disableGameHistoryButtons();
            }
    };

    const startNewGame = function(e) {
        e.preventDefault();
        const boardSize = formBoardSize();
        const firstPlayer = formFirstPlayer();
        formPracticeModeEnabled();
        GameController.startNewGame(boardSize, COUNTS_TO_WIN[`${boardSize}`], firstPlayer);
        updateGameDisplay();
    }
    gameOptionsForm.addEventListener("submit", startNewGame);
})();

// first screen update using default 3x3 board
updateGameDisplay();







 
