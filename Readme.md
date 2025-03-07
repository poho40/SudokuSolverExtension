# Sudoku Solver Extension

A Chrome extension that helps users solve Sudoku puzzles by detecting the board, extracting numbers, and filling in the correct solution. If the website is supported, it provides a "Solve Sudoku" button. Otherwise, it offers a board for manual input.

## Installation

1. Clone this repository:
   ```sh
   git clone https://github.com/poho40/SudokuSolverExtension.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the cloned repository folder.

## Usage

1. Open a Sudoku puzzle on a website.
2. Click the extension icon to open the popup.
3. If the website is supported, a **Solve Sudoku** button will appear.
4. If the website is not supported, a manual input board will be provided. 
5. Some websites require a local server to function.
Run the following command to start the server:
```sh
uvicorn app:app --reload
```

## Demo

Check out the demo here: [Demo Link](https://youtu.be/eTI9i7XLvfg) 



## Tested Environment

This extension has been tested on **Google Chrome running on an M2 MacBook Air**.







