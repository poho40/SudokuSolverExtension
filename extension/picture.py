import base64
import json

# Open the image in binary mode
with open("received_image.png", "rb") as image_file:
    # Read the image as bytes
    image_bytes = image_file.read()
    
    # Encode to base64
    base64_encoded = base64.b64encode(image_bytes).decode('utf-8')


data = json.dumps({ "image": base64_encoded })

print(f"curl -X POST https://rohitsar-sudokuextension.hf.space/process-image -H 'Content-Type: application/json' -d '{data}'")