from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
from PIL import Image
import io
import pytesseract
from solve import process
import json
import threading
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import easyocr
import sys
import cv2

# Define the FastAPI app
app = FastAPI()

# Add CORS middleware to allow cross-origin requests (same as Flask-CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Define a Pydantic model for input validation
class ImageData(BaseModel):
    image: str  # The base64-encoded image data
    height: int
    width: int

@app.post("/process-image")
async def process_image(data: ImageData):
    try:
        # Extract the base64 image string from the request
        image_data = data.image.replace("data:image/png;base64,", "")  # Remove the base64 header
        
        # Decode base64 and convert to an image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        # image.save("received_image.png")  # Save the image for verification
        image = image.convert("RGBA")
        pixels = list(image.getdata())
        answer_board = process(pixels,data.height, data.width)
        return {"status": "success", "answer": json.dumps(answer_board.tolist())}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))