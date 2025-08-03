from time import sleep
import json
import base64
import fitz
from werkzeug.utils import secure_filename
from .blob import BlobService
#from .training import TrainingService
from ..models.receipt import Receipt, ReceiptItems
from ..models.instore import InStore

from src.services.openai import OpenAIService  # PyMuPDF

blob_service = BlobService()
#training_service = TrainingService()

async def process_in_store(file):
    
    base64_image = await get_base64_image(file)
    client = OpenAIService.get_value() # need to update this service and pass the model name as a parameter

    model = "gpt-4o-2024-08-06"

    response = client.beta.chat.completions.parse(
        model=model,
        messages=[
            {"role": "system", "content": "Extract the receipt information."},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        response_format=InStore,
    )

    response = response.choices[0].message.parsed
    metadata = {
        "model": model,
        "class": "instore",
        "type": "receipt",
        "input": "image",
        "output": "json",
    }
    #blob_url = blob_service.save_blob(file.filename, base64_image)
    #training_service.add_receipt_training(image_path=blob_url, json_response=response.model_dump(), json_metadata=metadata)
    
    return response

async def process_receipt(file):
        
    # Get the file name and extension
    file_name = file.filename
    file_extension = file_name.split('.')[-1].lower()

    if file_extension == 'pdf':
        # Convert PDF to image
        doc = fitz.open(stream=await file.read(), filetype="pdf")
        page = doc.load_page(0)  # Load the first page
        pix = page.get_pixmap()
        image_data = pix.tobytes("jpeg")  # Convert to JPEG bytes
    elif file_extension == 'jpeg' or file_extension == 'jpg' or file_extension == 'png':
        image_data = await file.read()

    base64_image = base64.b64encode(image_data).decode('utf-8')
    
    # Initialize client
    client = OpenAIService.get_value()
    
    response = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=[
            {"role": "system", "content": "Extract all items from this receipt. For each item, include the item name, quantity, unit price, total price for that item, store name, date, and last 4 digits of credit card if visible."},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        response_format=ReceiptItems,
    )

    response_parsed = response.choices[0].message.parsed

    # Return the list of items, or empty list if parsing failed
    if response_parsed and response_parsed.items:
        return response_parsed.items
    else:
        return []

async def get_base64_image(file):
    
    # Get the file name and extension
        file_name = file.filename
        file_extension = file_name.split('.')[-1].lower()
    
        if file_extension == 'pdf':
            # Convert PDF to image
            doc = fitz.open(stream=await file.read(), filetype="pdf")
            page = doc.load_page(0)  # Load the first page
            pix = page.get_pixmap()
            image_data = pix.tobytes("jpeg")  # Convert to JPEG bytes
        elif file_extension == 'jpeg' or file_extension == 'jpg' or file_extension == 'png':
            image_data = await file.read()
    
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        return base64_image