from fastapi import APIRouter, HTTPException, UploadFile, File
import base64
import os
import shutil
from gradio_client import Client, handle_file

router = APIRouter()

# Target your specific cloud GPU space
HF_SPACE_URL = "jaitn9876/KOLAM_ART"

@router.post("/")
async def reconstruct_damaged_kolam(file: UploadFile = File(...)):
    try:
        print(f"[System] Receiving damaged Kolam. Beaming to {HF_SPACE_URL}...")
        
        # 1. Save the uploaded image locally so the client can read it
        temp_file = f"temp_upload_{file.filename}"
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. Connect to Hugging Face
        client = Client(HF_SPACE_URL)
        
        # 3. Use handle_file() to safely upload the image to the cloud API
        result = client.predict(
            image_path=handle_file(temp_file),
            api_name="/reconstruct-kolam"
        )
        
        image_path = result[0]
        log_output = result[1]
        
        # Cleanup the local temp file immediately
        os.remove(temp_file) 
        
        if image_path is None:
            raise Exception(f"Cloud Engine Error: {log_output}")
        
        # 4. Encode the pristine mathematical image for the frontend
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
            
        return {
            "status": "success", 
            "image_base64": f"data:image/png;base64,{encoded_string}",
            "log": log_output
        }

    except Exception as e:
        print(f"[Error] Reconstruction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))