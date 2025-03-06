
document.addEventListener('DOMContentLoaded', function () {
    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // Check if the URL contains "sudoku.com"
        if (tabs[0].url.includes("https://sudoku.com/") || tabs[0].url.includes("https://sudoku.game/") || tabs[0].url.includes("https://west.websudoku.com/")|| tabs[0].url.includes("www.nytimes.com/puzzles/sudoku") || tabs[0].url.includes("puzzles.usatoday.com/sudoku/game")) {
            // Create the Solve Sudoku button
            const button = document.createElement('button');
            button.id = 'solve';
            button.textContent = 'Solve Sudoku';
            // Append the button to the popup
            document.body.appendChild(button);

            // Button functionality
            button.addEventListener('click', function () {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'solveSudoku' });
                });
            });
            if (tabs[0].url.includes("https://sudoku.com/") || tabs[0].url.includes("https://sudoku.game/")) {
                const span = document.createElement('span');
                span.textContent = 'Server Needed';
                span.style.color = 'red';
                document.body.appendChild(span);
            }
        }
        else {
            const sudokuBoard = document.createElement('div');
            sudokuBoard.className = 'sudoku-board';

            // Create 9x9 grid of input cells
            for (let i = 0; i < 81; i++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                const input = document.createElement('input');
                input.type = 'number';
                input.min = 1;
                input.max = 9;
                input.maxLength = 1;
                cell.appendChild(input);
                sudokuBoard.appendChild(cell);
            }

            chrome.storage.local.get('sudokuInputs', (data) => {
                if (data.sudokuInputs) {
                    Array.from(sudokuBoard.children).forEach((cell, index) => {
                        row = Math.floor(index / 9)
                        col = index % 9
                        console.log(row,col, cell)
                        let input = cell.querySelector('input');
                        if (input) {
                            input.value = data.sudokuInputs[row][col] || '';
                        }
                    });
                }
            });

            // Create the Solve Sudoku button
            const solveButton = document.createElement('button');
            solveButton.id = 'solve';
            solveButton.textContent = 'Solve Sudoku';

            // Create the Clear Sudoku button
            const clearButton = document.createElement('button');
            clearButton.id = 'clearSolve';
            clearButton.textContent = 'Clear Sudoku';

            // Append all elements to the popup
            document.body.appendChild(sudokuBoard);
            document.body.appendChild(solveButton);
            document.body.appendChild(clearButton);
            clearButton.addEventListener('click', function () {
                const cells = document.querySelectorAll('.sudoku-board input');
            
                cells.forEach((cell, index) => {
                cell.value = ''; // Store the value, default to 0 if empty
                });
                chrome.storage.local.remove('sudokuInputs', () => {
            
                });
            });
            solveButton.addEventListener('click', function () {
                let sudokuGrid = [];
                const cells = document.querySelectorAll('.sudoku-board input');

                cells.forEach((cell, index) => {
                    sudokuGrid.push(cell.value ? cell.value :'.'); // Store the value, default to 0 if empty
                });
                answers = to2DArray(sudokuGrid)
                solveS(answers, 0, 0)
                cells.forEach((cell, index) => {
                    row = Math.floor(index / 9)
                    col = index % 9
                    cell.value = answers[row][col] 
                });
                chrome.storage.local.set({ sudokuInputs: answers }, () => {

                });
            });

        }
    });
});

function to2DArray(flatArray) {
    const size = 9; // The number of columns in a Sudoku board (9x9)
    const result = [];
    for (let i = 0; i < size; i++) {
        result.push(flatArray.slice(i * size, (i + 1) * size)); // Slice 9 elements for each row
    }
    return result;
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
