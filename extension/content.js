function getCanvasData() {
    let gameTable = document.querySelector('.game');
    if (gameTable) {
        let canvas = gameTable.querySelector("canvas");
        let imageData = canvas.toDataURL("image/png"); // Convert to base64 PNG
        const numpadDiv = document.querySelector('#numpad');
        // Send the image data to the background script
        if (canvas) {

            // Add event listener for the click event (on canvas)
            if (!canvas.hasListener) { 
                canvas.addEventListener("mousedown", (e) => {
                    // console.log('Canvas clicked at:', e.clientX, e.clientY);
                });
                canvas.hasListener = true; // Custom flag to prevent re-adding listeners
            }
            for (let numpad of numpadDiv.children) {
                if (!numpad.hasListener) {
                    // console.log("adding numpad listner")
                    numpad.addEventListener("mousedown", (e) => {
                        // console.log(e.target)
                        // const value = e.target.getAttribute("data-value"); // Get the value from the data-value attribute
                        // console.log("mouseup event received on: ", value); 
                        
                    });
                    numpad.hasListener = true
                }
            }
        }
        chrome.runtime.sendMessage({ action: "sendCanvasData", imageData: imageData, height:2000, width: 2000}, response => {
            console.log("Response from background:", response);
        });
    }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sudoku") {
        const answerData = message.answerData;
        // console.log("Received Sudoku answer data:", answerData);

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
            if (window.location.href.includes("sudoku.com")) {
                solveSudoku(answerData)
            }
            else {
                solveSudokuGame(answerData)
            }
        }
        else {
            if (window.location.href.includes("sudoku.com")) {
                getCanvasData();
            }
            else {
                getCanvasDataGame();
            }
        }
        // Send a response back to content.js
        sendResponse({ status: "success", message: "Answer data received successfully!" });
        chrome.runtime.onMessage.removeListener();
    }
    return true
});


async function solveSudoku(sudoku_board) {
    // console.log("running solve")
    solveS(sudoku_board, 0, 0)
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            // Get the canvas element
            let gameTable = document.querySelector('.game');
            let canvas = gameTable.querySelector("canvas");
        
            // Get the canvas bounding rectangle (position and size)
            let canvas_rect = canvas.getBoundingClientRect();
        
            // Calculate the cell resolution and height
            let cell_res = Math.floor(canvas_rect.width / 9); // Width of each cell
            let cell_he = Math.floor(canvas_rect.height / 9); // Height of each cell
            x = (2*col+1)/2*cell_he
            y = (2*row+1)/2*cell_res

            // Get the corresponding answer from the Sudoku board
            let answer = sudoku_board[row][col];

            // Calculate the position to click within the canvas (relative to the canvas)
            let offsetX = canvas_rect.x + x;
            let offsetY = canvas_rect.y + y;
            // console.log(answer)
            const numberButton = document.querySelector(`.numpad-item[data-value="${answer}"]`);

            // Simulate a mouse click at the calculated position on the canvas
            let clickEvent = new MouseEvent("mousedown", {
                clientX: offsetX,
                clientY: offsetY,
                buttons: 1
            });

            // Dispatch the click event on the canvas
            canvas.dispatchEvent(clickEvent);

            if (numberButton) {
                const mouseUpEvent = new MouseEvent('mousedown', {
                    clientX: numberButton.getBoundingClientRect().left,
                    clientY: numberButton.getBoundingClientRect().top,
                    bubbles: true,
                    cancelable: true,
                    view: window,
                });
                // console.log("sent: " + mouseUpEvent);
                numberButton.dispatchEvent(mouseUpEvent);
            }


            // Wait for a short time to simulate human interaction
            // await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
        }
    }
}

async function solveSudokuGame(sudoku_board) {
    // console.log("running solve")
    skip_indices = []
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (sudoku_board[row][col] != '.') {
                skip_indices.push([row,col])
            }
        }
    }
    solveS(sudoku_board, 0, 0)
    // console.log(sudoku_board)
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            // Get the canvas element
            if (skip_indices.some(([r, c]) => r === row && c === col)) {
                // print([row,col])
                continue;
            }
            let canvas = document.querySelector("canvas");
            // console.log(canvas)
        
            // Get the canvas bounding rectangle (position and size)
            let canvas_rect = canvas.getBoundingClientRect();
        
            // Calculate the cell resolution and height
            let cell_res = Math.floor(canvas_rect.width / 9); // Width of each cell
            let cell_he = Math.floor(canvas_rect.height / 9); // Height of each cell
            x = (2*col+1)/2*cell_he
            y = (2*row+1)/2*cell_res

            // Get the corresponding answer from the Sudoku board
            let answer = sudoku_board[row][col];

            // Calculate the position to click within the canvas (relative to the canvas)
            let offsetX = canvas_rect.x + x;
            let offsetY = canvas_rect.y + y;
            // console.log(answer)
            const numberButton = document.querySelector(`.sudokuInputBar`);
            // console.log(numberButton.children[answer - 1])
            // Simulate a mouse click at the calculated position on the canvas
            let clickEvent = new MouseEvent("click", {
                clientX: offsetX,
                clientY: offsetY,
                buttons: 1
            });

            // Dispatch the click event on the canvas
            canvas.dispatchEvent(clickEvent);
            numberButton.children[answer - 1].click()
            // Wait for a short time to simulate human interaction
            // await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
        }
    }
}

function getData() {
    let grid = [];
    for (let row = 0; row < 9; row++) {
        let rowData = [];
        for (let col = 0; col < 9; col++) {
            let td = document.querySelector("#c" + col + row); // Select td
            if (td) {
                let input = td.querySelector("input"); // Select input inside td
                if (input && input.hasAttribute("readonly")) {
                    rowData.push(input.value); // Store readonly value
                } else {
                    rowData.push('.'); // Store '.' if no readonly value
                }
            } else {
                rowData.push('.'); // Handle missing td (edge case)
            }
        }
        grid.push(rowData);
    }
    solveS(grid, 0, 0)
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            let td = document.querySelector("#c" + col + row); // Select td
            if (td) {
                let input = td.querySelector("input"); // Select input inside td
                if(input) {
                    input.value = grid[row][col]
                }
            }
        }
    }
    
}

function getNYData() {
    const numpadDiv = document.querySelector('.su-keyboard__container');
    // console.log(numpadDiv)
    let grid = [];
    for (let row = 0; row < 9; row++) {
        let rowData = [];
        for (let col = 0; col < 9; col++) {
            let cell = document.querySelector(`[data-testid="sudoku-cell-${row*9+col}"]`); // Select td
            // console.log(cell)
            if (cell) {
                let svg = cell.querySelector('[data-number]');
                if (svg) {
                    rowData.push(svg.getAttribute('data-number'));
                }
                else {
                    rowData.push('.'); // Store '.' if no readonly value
                }
            } else {
                rowData.push('.'); // Handle missing td (edge case)
            }
        }
        grid.push(rowData);
    }
    // console.log(grid)
    solveS(grid, 0, 0)
    // console.log(grid)
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            let cell = document.querySelector(`[data-testid="sudoku-cell-${row*9+col}"]`);// Select td
            if (cell) {
                cell.classList.remove('selected');
                cell.classList.remove('guessed');
            }
        }
    }
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            let cell = document.querySelector(`[data-testid="sudoku-cell-${row*9+col}"]`);// Select td
            if (cell && !cell.classList.contains('prefilled')) {

                cell.click()

                let answer = grid[row][col]
                numpadDiv.children[answer - 1].click()

                console.log(cell.classList, row, col)
            }
        }
    }
}

async function getTodayData() {
    let grid = [];
    // console.log("started")
    for (let row = 0; row < 9; row++) {
        let rowData = [];
        for (let col = 0; col < 9; col++) {
            let cell = document.querySelector(`[data-id="${row+1}-${col+1}"]`); // Select td
            // console.log(cell)
            // console.log(cell)
            if (cell) {
                let span = cell.children[0];
                if (span) {
                    if (span.textContent == '') {
                        rowData.push('.');
                    }
                    else {
                        rowData.push(span.textContent);
                    }
                }
                else {
                    rowData.push('.'); // Store '.' if no readonly value
                }
            } else {
                rowData.push('.'); // Handle missing td (edge case)
            }
        }
        grid.push(rowData);
    }
    // console.log(grid)
    solveS(grid, 0, 0)
    console.log(grid)
    let numpad = document.querySelector('.class-7b-jXCw')
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            let cell = document.querySelector(`[data-id="${row+1}-${col+1}"]`);
            // console.log(cell)
            if (cell && cell.children[0].textContent == '') {
                console.log(row, col)
                cell.click()
                await new Promise(resolve => setTimeout(resolve, 1)); 
                let answer = grid[row][col]
                console.log(numpad.children[answer - 1])
                numpad.children[answer - 1].children[0].click()
                await new Promise(resolve => setTimeout(resolve, 1)); 
                // console.log(cell.classList, row, col)
            }
        }
    }
}

function getCanvasDataGame() {

    let canvas = document.querySelector("canvas");
    // console.log(canvas)
    let imageData = canvas.toDataURL("image/png"); // Convert to base64 PNG
    // const numpadDiv = document.querySelector('#numpad');
    // Send the image data to the background script
    if (canvas) {

        // Add event listener for the click event (on canvas)
        if (!canvas.hasListener) { 
            canvas.addEventListener("click", (e) => {
                // console.log('Canvas clicked at:', e.clientX, e.clientY);
            });
            canvas.hasListener = true; // Custom flag to prevent re-adding listeners
        }
        // for (let numpad of numpadDiv.children) {
        //     if (!numpad.hasListener) {
        //         // console.log("adding numpad listner")
        //         numpad.addEventListener("mousedown", (e) => {
        //             // console.log(e.target)
        //             // const value = e.target.getAttribute("data-value"); // Get the value from the data-value attribute
        //             // console.log("mouseup event received on: ", value); 
                    
        //         });
        //         numpad.hasListener = true
        //     }
        // }
    }
    chrome.runtime.sendMessage({ action: "sendCanvasData", imageData: imageData, height: canvas.height, width: canvas.width}, response => {
        console.log("Response from background:", response);
    });
}

// Main function
(async function () {
    if (window.location.href.includes("sudoku.com")) {
        getCanvasData();
    }
    if (window.location.href.includes("west.websudoku.com")) {
        getData();
    }
    if (window.location.href.includes("www.nytimes.com/puzzles/sudoku")) {
        getNYData();
    }
    if (window.location.href.includes("puzzles.usatoday.com/sudoku/game")) {
        getTodayData();
    }
    if (window.location.href.includes("https://sudoku.game/")) {
        getCanvasDataGame();
    }
})();


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

