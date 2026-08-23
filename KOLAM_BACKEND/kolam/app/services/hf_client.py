import os
import json
from gradio_client import Client
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

HF_SPACE_ID = os.getenv("HF_MODEL_URL", "jaitn9876/KOLAM_ART")
HF_TOKEN = os.getenv("HF_API_TOKEN")

# Global variable to hold the client so we only connect once
_client = None

def get_hf_client():
    """Lazy loader for the official Gradio SDK"""
    global _client
    if _client is None:
        print(f"\n[System] Connecting to Hugging Face Space: {HF_SPACE_ID}...")
        # Because we patched app.py on Hugging Face, this will connect instantly without crashing!
        _client = Client(HF_SPACE_ID, token=HF_TOKEN)
        print("[System] Hugging Face Connection Established.\n")
    return _client

async def generate_kolam_from_hf(prompt: str, dot_count: int, symmetry_type: str) -> dict:
    """
    Sends the user's prompt to the Hugging Face Kala Sutra model via official SDK.
    """
    try:
        client = get_hf_client()
        print("[System] Routing Prompt to Cloud GPUs...")
        
        # The Gradio SDK handles all the queueing, routing, and websockets automatically
        result = client.predict(
            prompt=prompt,
            dot_count=dot_count,
            symmetry_type=symmetry_type,
            api_name="/generate-kala-sutra"
        )
        
        # Gradio returns the output as a tuple, our JSON payload is in index 1
        json_payload = json.loads(result[1])
        return json_payload

    except Exception as e:
        print(f"HF SDK Error: {e}")
        return {"status": "error", "message": f"Cloud GPU Error: {str(e)}"}

async def analyze_symmetry_from_hf(image_path: str) -> dict:
    """Placeholder: We use local OpenCV instead."""
    return {"status": "info", "message": "Using local OpenCV for analysis instead."}