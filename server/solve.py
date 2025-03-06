import pytesseract
from PIL import Image
import numpy as np
import easyocr
import sys
import cv2

def preprocess_block(cell_image):
    # print(cell_image.shape)
    gray_image = cv2.cvtColor(cell_image, cv2.COLOR_BGR2GRAY)
    # print("goodbye")
    # cv2.imwrite("denoised.png", gray_image)
    # Apply binary thresholding
    _, binary_image = cv2.threshold(gray_image, 200, 255, cv2.THRESH_BINARY_INV)
    # binary_image = cv2.adaptiveThreshold(gray_image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)

    # Denoise the image (optional based on the quality of the block)
    denoised_image = cv2.fastNlMeansDenoising(binary_image, None, 30, 7, 21)
    # cv2.imwrite("denoised.png", denoised_image)
    return denoised_image

# Convert the pixels into a NumPy array (for easier manipulation)
reader = easyocr.Reader(['en'])

# digit_templates = {}
# for digit in range(1,10):
#     template = cv2.imread(f'reference_digits/{digit}.png', cv2.IMREAD_GRAYSCALE)
#     digit_templates[digit] = template
def process(pixels, height, width):
    pixels_array = np.array(pixels).reshape((height, width, 4))  # RGBA format
    pixels_array = pixels_array.astype(np.uint8)
    # print(pixels_array.shape)
    binary = preprocess_block(pixels_array)

    # print("hello")
    # Save or display the processed image to check
    # cv2.imwrite("black_digits.png", binary)

    # 2. Identify the cell boundaries (assuming each cell is of equal size)
    cell_width = binary.shape[1] // 9 
    cell_height = binary.shape[0] // 9 

    # pixels now contains the RGBA values (each value is a byte: 0-255 range)
    # Example: Accessing the first pixel's RGBA values
    cell_offset_x = 10 # Fine-tune this based on the misalignment
    cell_offset_y = 10 # Fine-tune this as well

    # Loop through each cell in the 9x9 grid
    cells = []
    num_numbers = 0
    for row in range(9):
        for col in range(9):
            # Calculate the boundaries of the current cell, adjusting with offsets
            x1 = col * cell_width + cell_offset_x
            y1 = row * cell_height + cell_offset_y
            x2 = (col + 1) * cell_width - cell_offset_x
            y2 = (row + 1) * cell_height - cell_offset_y

            # Extract the cell image from the grid
            cell_image = binary[y1:y2, x1:x2]

            # cv2.imwrite(f"sudoku_{row}_{col}.png", cell_image)

            # Extract text (digit) from the processed cell
     
            result = reader.readtext(cell_image, detail=0, allowlist='123456789')
            # print(f"Cell [{row}, {col}] digit: {result}")
            if result:
                num_numbers += 1
                if (result[0] == '7'):
                    digit = pytesseract.image_to_string(cell_image, config="--oem 3 --psm 6 -c tessedit_char_whitelist=123456789")
                    cells.append(digit.strip())
                else:
                    cells.append(result[0]) 
            else:
                digit = pytesseract.image_to_string(cell_image, config="--oem 3 --psm 10 -c tessedit_char_whitelist=123456789")
                if (digit.strip() == '7'):
                    cells.append(digit.strip())
                else:
                    cells.append('.')



    # Reshape the list to match a 9x9 Sudoku board
    sudoku_board = np.array(cells).reshape((9, 9))
    # print(sudoku_board)
    return sudoku_board
