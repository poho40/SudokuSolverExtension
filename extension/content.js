function getCanvasData(selector = ".game", eventType = "mousedown") {
    let gameTable = document.querySelector(selector);
    let canvas = gameTable ? gameTable.querySelector("canvas") : document.querySelector("canvas");

    if (canvas) {
        canvasHelper(canvas, eventType);
        attachNumpadListeners();
    }
}

function attachNumpadListeners() {
    const numpadDiv = document.querySelector('#numpad');
    if (!numpadDiv) return;

    for (let numpad of numpadDiv.children) {
        if (!numpad.hasListener) {
            numpad.addEventListener("mousedown", (e) => {});
            numpad.hasListener = true;
        }
    }
}

function canvasHelper(canvas, mode) {
    if (!canvas) return;
    let imageData = canvas.toDataURL("image/png"); 
    if (canvas) {
        if (!canvas.hasListener) { 
            canvas.addEventListener(mode, (e) => {
            });
            canvas.hasListener = true; 
        }
    }
    chrome.runtime.sendMessage({ action: "sendCanvasData", imageData: imageData, height: canvas.height, width: canvas.width}, response => {
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action == "solveSudoku") {
        runfunction()
    }
    else if (message.action === "sudoku") {
        const answerData = message.answerData;

        // Process the answerData if necessary or perform further actions
        runSolve = false
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (answerData[row][col] != '.') {
                    runSolve = true
                }
            }
        }
        if (runSolve) {
            const webSudoku = {
                clickEvent: "click",
                method: "click",
                selector: ".sudokuInputBar",
                cellSelector: null,
                insertValue: null,
                numpadPress: (numpad, answer) => {
                    numpad.children[answer - 1].children[0].click()
                },
                canvasSelector: () => {
                    return document.querySelector("canvas")
                },
                getValue: null
            };
            const sudoku = {
                clickEvent: "mousedown",
                method: "dispatchEvent",
                selector: (answer) => { return document.querySelector(`.numpad-item[data-value="${answer}"]`)},
                cellSelector: null,
                insertValue: null,
                numpadPress: (numpad, answer) => {
                    numpad.children[answer - 1].children[0].click()
                },
                canvasSelector: () => {
                    let gameTable = document.querySelector('.game')
                    return gameTable.querySelector("canvas")
                },
                getValue: null
            };
            window.location.href.includes("sudoku.com") ?  solveSudokuGame(answerData, sudoku) : solveSudokuGame(answerData, webSudoku)
        } else {
            getCanvasData(".game", window.location.href.includes("sudoku.com") ? "mousedown" : "click");
        }
     
        sendResponse({ status: "success", message: "Answer data received successfully!" });
        chrome.runtime.onMessage.removeListener();
    }
    return true
});

function clickCanvas(canvas, row, col, mode) {
    let canvas_rect = canvas.getBoundingClientRect();
        
    let cell_res = Math.floor(canvas_rect.width / 9); 
    let cell_he = Math.floor(canvas_rect.height / 9); 
    x = (2*col+1)/2*cell_he
    y = (2*row+1)/2*cell_res

    let offsetX = canvas_rect.x + x;
    let offsetY = canvas_rect.y + y;

    let clickEvent = new MouseEvent(mode, {
        clientX: offsetX,
        clientY: offsetY,
        buttons: 1
    });

    canvas.dispatchEvent(clickEvent);
}

function getSudokuData(selectorType) {
    let grid = [];
    for (let row = 0; row < 9; row++) {
        let rowData = [];
        for (let col = 0; col < 9; col++) {
            let cell = document.querySelector(selectorType.cellSelector(row, col));
            if (cell) {
                let value = selectorType.getValue(cell);
                rowData.push(value ? value : '.');
            } else {
                rowData.push('.');
            }
        }
        grid.push(rowData);
    }
    return grid;
}

function selectNumber(answer, selectorType) {
    if (selectorType.method === "click") {
        let numpadButton = document.querySelector(selectorType.selector);
        selectorType.numpadPress(numpadButton, answer)
    } else if (selectorType.method === "dispatchEvent") {
        let numberButton = selectorType.selector(answer);
        if (numberButton) {
            let mouseEvent = new MouseEvent(selectorType.clickEvent, {
                clientX: numberButton.getBoundingClientRect().left,
                clientY: numberButton.getBoundingClientRect().top,
                bubbles: true,
                cancelable: true,
                view: window,
            });
            numberButton.dispatchEvent(mouseEvent);
        }
    }
}

async function solveSudokuGame(sudoku_board, selectorType) {
    let skipIndices = [];

    // Identify prefilled cells to skip
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (sudoku_board[row][col] !== '.') {
                skipIndices.push([row, col]);
            }
        }
    }

    // Solve the Sudoku
    solveS(sudoku_board, 0, 0);
    // console.log(sudoku_board)
    // Fill the board
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (skipIndices.some(([r, c]) => r === row && c === col)) {
                continue;
            }
            let answer = sudoku_board[row][col];
            if (selectorType.canvasSelector) {
                clickCanvas(selectorType.canvasSelector(), row, col, selectorType.clickEvent);
            }
            else {
                let cell = document.querySelector(selectorType.cellSelector(row, col));
                if (cell) {
                    cell.click()
                }
                if (selectorType.insertValue) {
                    selectorType.insertValue(cell, answer)
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1)); 
            if (!selectorType.insertValue) {
                selectNumber(answer, selectorType);
            }
            await new Promise(resolve => setTimeout(resolve, 1)); 
        }
    }
}

async function solveGenericSudoku(selectorType) {
    let sudoku_board = getSudokuData(selectorType);
    await solveSudokuGame(sudoku_board, selectorType);
}


async function runfunction() {
    if (window.location.href.includes("https://sudoku.com/")) {
        getCanvasData();
    }
    else if (window.location.href.includes("https://sudoku.game/")) {
        getCanvasData(".game", "click");
    }
    else if (window.location.href.includes("https://west.websudoku.com/")) {
        const classicSudokuSelector = {
            clickEvent: "click",
            method: "click",
            selector: null,
            cellSelector: (row, col) => `#c${col}${row}`,
            insertValue: (cell, answer) => {
                if (cell) {
                    let input = cell.querySelector("input");
                    if (input) {
                        input.value = answer
                    }
                }
            },
            numpadPress: null,
            getValue: (cell) => {
                let input = cell.querySelector("input");
                return input && input.hasAttribute("readonly") ? input.value : null;
            }
        };
        solveGenericSudoku(classicSudokuSelector);
    }
    else if (window.location.href.includes("www.nytimes.com/puzzles/sudoku")) {
        const nySudokuSelector = {
            clickEvent: "click",
            method: "click",
            selector: ".su-keyboard__container",
            cellSelector: (row, col) => `[data-testid="sudoku-cell-${row * 9 + col}"]`,
            insertValue: null,
            numpadPress: (numpad, answer) => {
                numpad.children[answer - 1].click()
            },
            getValue: (cell) => {
                let svg = cell.querySelector('[data-number]');
                return svg ? svg.getAttribute('data-number') : null;
            }
        };
        solveGenericSudoku(nySudokuSelector);
    }
    else if (window.location.href.includes("puzzles.usatoday.com/sudoku/game")) {
        const todaySudokuSelector = {
            clickEvent: "click",
            method: "click",
            selector: ".class-7b-jXCw",
            cellSelector: (row, col) => `[data-id="${row + 1}-${col + 1}"]`,
            insertValue: null,
            numpadPress: (numpad, answer) => {
                numpad.children[answer - 1].children[0].click()
            },
            getValue: (cell) => {
                let span = cell.children[0];
                return span && span.textContent ? span.textContent : null;
            }
        };
        solveGenericSudoku(todaySudokuSelector);
    }
}


function solveS(board, i = 0, j = 0) {
    if (i === board.length) {
        return true;
    }
    if (j === board[i].length) {
        return solveS(board, i + 1, 0);
    }
    
    if (board[i][j] !== '.') {
        return solveS(board, i, j + 1);
    }
    
    for (let char = 1; char <= 9; char++) {
        let val = char.toString();
        if (helper(board, i, j, val)) {
            board[i][j] = val;
            if (solveS(board, i, j + 1)) {
                return true;
            }
            board[i][j] = '.';
        }
    }
    return false;
}

function helper(board, r, c, val) {
    for (let i = 0; i < 9; i++) {
        if (board[i][c] === val) {
            return false;
        }
    }
    
    for (let i = 0; i < 9; i++) {
        if (board[r][i] === val) {
            return false;
        }
    }
    
    let newI = Math.floor(r / 3) * 3;
    let newJ = Math.floor(c / 3) * 3;
    
    for (let i = newI; i < newI + 3; i++) {
        for (let j = newJ; j < newJ + 3; j++) {
            if (!(i === r && j === c) && board[i][j] === val) {
                return false;
            }
        }
    }
    return true;
}
