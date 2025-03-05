from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from PIL import Image
import io
import pytesseract
from solve import process
import json
import threading

app = Flask(__name__)
CORS(app) 

mutex = threading.Lock()

@app.route('/process-image', methods=['POST'])
def process_image():
    mutex.acquire()
    try:
        # Get the uploaded image from the request
        data = request.json
        # image = Image.open(file.stream)
        image_data = data["image"]  # Extract the base64 image string
        image_data = image_data.replace("data:image/png;base64,", "")  # Remove header
        
        # Decode base64 and convert to an image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        # image.save("received_image.png")  # Save the image for verification
        image = image.convert("RGBA")
        pixels = list(image.getdata())
        answer_board = process(pixels)
        # Use Tesseract to extract text from the image
        # text = pytesseract.image_to_string(image)

        # Send back the extracted text as a JSON response
        mutex.release()
        return jsonify({'status':'success', 'answer': json.dumps(answer_board.tolist())})
    
    except Exception as e:
        mutex.release()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)