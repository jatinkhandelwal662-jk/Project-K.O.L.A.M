from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import base64
import os
import shutil
import datetime
import uuid
import traceback
from gradio_client import Client, handle_file
from huggingface_hub import HfApi

from app.services.hf_client import generate_kolam_from_hf

router = APIRouter()

# ---------------------------------------------------------
# CLOUD CONFIGURATION
# ---------------------------------------------------------
HF_SPACE_URL = "jaitn9876/KOLAM_ART"
HF_DATASET_REPO = "jaitn9876/kolam-training-data" # Ensure you created this dataset on HF
HF_WRITE_TOKEN = "YOUR_HF_WRITE_TOKEN"

class GenerationRequest(BaseModel):
    prompt: str
    dot_count: Optional[int] = 12
    symmetry_type: Optional[str] = "D4_Square"

# ---------------------------------------------------------
# THE ML DATA FLYWHEEL (Background Task)
# ---------------------------------------------------------
def save_to_cloud_dataset(local_file_path: str, source_type: str):
    """Silently uploads safe copies to Hugging Face Datasets, then deletes the local copy."""
    if HF_WRITE_TOKEN == "YOUR_HF_WRITE_TOKEN":
        print("\n[System] Skipping Dataset Upload: Please paste your real HF_WRITE_TOKEN in generation.py.")
        if os.path.exists(local_file_path):
            os.remove(local_file_path)
        return

    try:
        api = HfApi()
        today_folder = datetime.datetime.now().strftime("%Y-%m-%d")
        unique_id = str(uuid.uuid4().hex)[:8]
        cloud_filename = f"{source_type}_{unique_id}.png"
        
        print(f"[ML Data Flywheel] Archiving {cloud_filename} to the dataset {HF_DATASET_REPO}...")
        
        api.upload_file(
            path_or_fileobj=local_file_path,
            path_in_repo=f"{today_folder}/{cloud_filename}",
            repo_id=HF_DATASET_REPO,
            repo_type="dataset",
            token=HF_WRITE_TOKEN
        )
        print(f"[ML Data Flywheel] ✅ Success! Saved to {today_folder}/ folder.")
        
    except Exception as e:
        print(f"\n[ML Data Flywheel Error] Failed to archive data to dataset:")
        traceback.print_exc()
    finally:
        # 100% Guaranteed Cleanup: Delete the safe copy so your laptop doesn't fill up with images
        if os.path.exists(local_file_path):
            os.remove(local_file_path)

# ---------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------
@router.post("/")
async def generate_pattern(request: GenerationRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    return await generate_kolam_from_hf(
        prompt=request.prompt, dot_count=request.dot_count, symmetry_type=request.symmetry_type
    )

@router.post("/render")
async def render_photorealistic(request: GenerationRequest, background_tasks: BackgroundTasks):
    try:
        print(f"\n[System] Beaming render request to Hugging Face Space: {HF_SPACE_URL}...")
        client = Client(HF_SPACE_URL)
        
        result = client.predict(
                prompt=request.prompt,
                dot_count=request.dot_count,
                api_name="/render-kolam"
        )
        
        image_path, status_message = result[0], result[1]
        
        if image_path is None:
            raise Exception(f"Cloud Engine Error: {status_message}")
        
        # --- THE FIX: Create a safe local copy before Gradio deletes the temp file ---
        safe_local_path = f"queue_render_{uuid.uuid4().hex[:8]}.png"
        shutil.copy2(image_path, safe_local_path)
        
        # Send the safe copy to the background task
        background_tasks.add_task(save_to_cloud_dataset, safe_local_path, "generated")
        
        with open(safe_local_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")

        print("[System] Render successful! Image sent to UI. Background dataset upload started.")
        return {"status": "success", "image_base64": f"data:image/png;base64,{encoded_string}"}

    except Exception as e:
        print(f"\n[CRITICAL BACKEND ERROR in /render]:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reconstruct")
async def reconstruct_damaged_kolam(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    temp_upload_file = None
    try:
        print(f"\n[System] Receiving damaged Kolam. Beaming to {HF_SPACE_URL}...")
        
        temp_upload_file = f"temp_upload_{file.filename}"
        with open(temp_upload_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        client = Client(HF_SPACE_URL)
        
        result = client.predict(
            image_path=handle_file(temp_upload_file),
            api_name="/reconstruct-kolam"
        )
        
        image_path, log_output = result[0], result[1]
        
        if os.path.exists(temp_upload_file):
            os.remove(temp_upload_file) 
        
        if image_path is None:
            raise Exception(f"Cloud Engine Error: {log_output}")
            
        # --- THE FIX: Create a safe local copy for reconstruction ---
        safe_local_path = f"queue_reconstruct_{uuid.uuid4().hex[:8]}.png"
        shutil.copy2(image_path, safe_local_path)
        
        # Add the safe copy to the flywheel
        background_tasks.add_task(save_to_cloud_dataset, safe_local_path, "reconstructed")
        
        with open(safe_local_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
            
        print("[System] Reconstruction successful! Image sent to UI. Background dataset upload started.")
        return {
            "status": "success", 
            "image_base64": f"data:image/png;base64,{encoded_string}",
            "log": log_output
        }

    except Exception as e:
        if temp_upload_file and os.path.exists(temp_upload_file):
            os.remove(temp_upload_file)
        print(f"\n[CRITICAL BACKEND ERROR in /reconstruct]:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))