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
                        const value = e.target.getAttribute("data-value"); // Get the value from the data-value attribute
                        // console.log("mouseup event received on: ", value); 
                        
                    });
                    numpad.hasListener = true
                }
            }
        }
        chrome.runtime.sendMessage({ action: "sendCanvasData", imageData: imageData}, response => {
            // console.log("Response from background:", response);
        });
    }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sudoku") {
        const answerData = message.answerData;
        // console.log("Received Sudoku answer data:", answerData);

        // Process the answerData if necessary or perform further actions
        runSolve = true
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (answerData[row][col] == '.') {
                    runSolve = false
                }
            }
        }
        if (runSolve) {
            solveSudoku(answerData)
        }
        else {
            getCanvasData();
        }
        // Send a response back to content.js
        sendResponse({ status: "success", message: "Answer data received successfully!" });
        chrome.runtime.onMessage.removeListener(handleMessage);
    }
    return true
});


async function solveSudoku(sudoku_board) {
    // console.log("running solve")
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
            await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
        }
    }
}


// Main function
(async function () {
    let imageData = getCanvasData();
})();
