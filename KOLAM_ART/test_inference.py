import os
import zipfile
import torch
from transformers import T5Tokenizer, T5ForConditionalGeneration
import time
import re

class KolamRestorationEngine:
    def __init__(self, model_name: str):
        zip_path = f"{model_name}.zip"
        model_dir = os.path.abspath(model_name)
        
        # 1. Automatically unzip the file if the folder doesn't exist yet
        if not os.path.exists(model_dir):
            if os.path.exists(zip_path):
                print(f"[{time.strftime('%X')}] Found '{zip_path}'. Extracting now...")
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    # Extract directly into the current directory
                    zip_ref.extractall(".") 
                print(f"[{time.strftime('%X')}] Extraction complete!")
            else:
                raise FileNotFoundError(f"[ERROR] Could not find the folder '{model_dir}' or the file '{zip_path}'.")
        
        # 2. Google Drive often double-nests folders (e.g., folder/folder/config.json)
        # This safety check ensures we are pointing to the exact directory with the model files.
        if not os.path.exists(os.path.join(model_dir, "config.json")):
            nested_dir = os.path.join(model_dir, model_name)
            if os.path.exists(os.path.join(nested_dir, "config.json")):
                model_dir = nested_dir
            else:
                raise FileNotFoundError(f"[ERROR] 'config.json' not found in {model_dir}. The zip file might be empty or structured incorrectly.")

        print(f"Loading local model from: {model_dir}")
        start_time = time.time()
        
        # Load the fine-tuned weights and tokenizer
        self.tokenizer = T5Tokenizer.from_pretrained(model_dir)
        self.model = T5ForConditionalGeneration.from_pretrained(model_dir)
        self.model.eval() # Set to evaluation mode for inference
        
        print(f"Engine ready in {time.time() - start_time:.2f} seconds.")

def clean_model_output(glued_string: str) -> list:
    """
    Parses a smashed token string back into a clean array for the frontend.
    """
    # The exact vocabulary your model was trained on
    keywords = [
        "DIAG_UP_RIGHT", "DIAG_UP_LEFT", "DIAG_DOWN_RIGHT", "DIAG_DOWN_LEFT",
        "UP", "DOWN", "LEFT", "RIGHT"
    ]
    
    # Create a regex pattern to find any of these specific words
    pattern = '|'.join(keywords)
    
    # Extract all valid tokens in order
    clean_array = re.findall(pattern, glued_string)
    return clean_array

    def predict_missing_path(self, broken_tokens: list) -> list:
        input_string = "restore kolam: " + " ".join(broken_tokens)
        inputs = self.tokenizer(input_string, return_tensors="pt", max_length=128, truncation=True)
        
        with torch.no_grad():
            outputs = self.model.generate(
                inputs["input_ids"],
                max_length=128,
                num_beams=4,
                early_stopping=True
            )
            
        decoded = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return decoded.split()

# --- RUNNING THE TEST ---
if __name__ == "__main__":
    # Point the engine to the model name (without the .zip extension)
    engine = KolamRestorationEngine("final_kala_sutra_model")
    
    mock_opencv_output = ["RIGHT", "<MISSING>", "DOWN", "DIAG_DOWN_LEFT", "<MISSING>", "UP"]
    print(f"\nIncoming Broken Sequence : {mock_opencv_output}")
    
    restored_sequence = engine.predict_missing_path(mock_opencv_output)
    print(f"AI Restored Sequence   : {restored_sequence}")