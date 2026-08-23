import os
import io
import json
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import cv2

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ultralytics import YOLO
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForCausalLM
import gradio as gr
import uvicorn

# ==============================================================================
# 1. APPLICATION SETUP & HARDWARE CONFIGURATION
# ==============================================================================

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[System] Initializing Kolam AI Engine on Device: {DEVICE}")

app = FastAPI(
    title="Kolam AI Master Engine API",
    description="Multi-modal AI backend for Kolam pattern recognition, symmetry analysis, and procedural generation.",
    version="1.0.0"
)

# Enable CORS for frontend integration (React, Next.js, Flutter, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# 2. MODEL INITIALIZATION & LOADING
# ==============================================================================

# --- Model 1: YOLOv8 Dot (Pulli) Detector ---
yolo_model = None
yolo_path = "pulli_detector.pt" if os.path.exists("pulli_detector.pt") else "best.pt"

if os.path.exists(yolo_path):
    try:
        print(f"[Model 1] Loading YOLOv8 from '{yolo_path}'...")
        yolo_model = YOLO(yolo_path)
        print("[Model 1] YOLOv8 Pulli Detector loaded successfully.")
    except Exception as e:
        print(f"[WARNING] Failed to load YOLO model: {e}")
else:
    print(f"[WARNING] No YOLO weights found at '{yolo_path}'.")

# --- Model 2: ResNet-18 Symmetry Classifier ---
SYMMETRY_CLASSES = ["D4_Square", "Bilateral"]
symmetry_model = None
symmetry_path = "kolam_symmetry.pth"

symmetry_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

if os.path.exists(symmetry_path):
    try:
        print(f"[Model 2] Loading ResNet18 Symmetry Classifier from '{symmetry_path}'...")
        symmetry_model = models.resnet18(weights=None)
        num_ftrs = symmetry_model.fc.in_features
        symmetry_model.fc = nn.Linear(num_ftrs, len(SYMMETRY_CLASSES))
        
        state_dict = torch.load(symmetry_path, map_location=DEVICE)
        symmetry_model.load_state_dict(state_dict)
        symmetry_model = symmetry_model.to(DEVICE)
        symmetry_model.eval()
        print("[Model 2] ResNet18 Symmetry Classifier loaded successfully.")
    except Exception as e:
        print(f"[WARNING] Failed to load Symmetry model: {e}")
else:
    print(f"[WARNING] No Symmetry model found at '{symmetry_path}'.")

# --- Model 3: Kala Sutra Generative / Sequence Model ---
kala_sutra_tokenizer = None
kala_sutra_model = None
kala_sutra_path = "./final_kala_sutra_model"

if os.path.exists(kala_sutra_path):
    try:
        print(f"[Model 3] Loading Kala Sutra Model from '{kala_sutra_path}'...")
        kala_sutra_tokenizer = AutoTokenizer.from_pretrained(kala_sutra_path)
        try:
            kala_sutra_model = AutoModelForSeq2SeqLM.from_pretrained(kala_sutra_path).to(DEVICE)
        except Exception:
            kala_sutra_model = AutoModelForCausalLM.from_pretrained(kala_sutra_path).to(DEVICE)
        kala_sutra_model.eval()
        print("[Model 3] Kala Sutra Generative Model loaded successfully.")
    except Exception as e:
        print(f"[WARNING] Failed to load Kala Sutra model: {e}")
else:
    print(f"[WARNING] No Kala Sutra model found at '{kala_sutra_path}'.")


# ==============================================================================
# 3. REQUEST / RESPONSE SCHEMAS
# ==============================================================================

class TextPromptRequest(BaseModel):
    prompt: str
    dot_count: Optional[int] = None
    symmetry_type: Optional[str] = "D4_Square"

class DetectionResponse(BaseModel):
    status: str
    total_dots: int
    coordinates: List[Dict[str, float]]
    grid_matrix_x: List[float]
    grid_matrix_y: List[float]

class SymmetryResponse(BaseModel):
    status: str
    symmetry_type: str
    confidence: str
    raw_scores: Dict[str, float]

class GenerationResponse(BaseModel):
    status: str
    input_prompt: str
    generated_rules: str
    dot_count: Optional[int]


# ==============================================================================
# 4. REST API ENDPOINTS
# ==============================================================================

@app.get("/api/health")
async def health_check():
    """Returns the initialization status of all models."""
    return {
        "status": "online",
        "device": str(DEVICE),
        "models_loaded": {
            "yolo_pulli_detector": yolo_model is not None,
            "resnet_symmetry_classifier": symmetry_model is not None,
            "kala_sutra_generative_model": kala_sutra_model is not None
        }
    }


@app.post("/api/detect-pulli", response_model=DetectionResponse)
async def detect_pulli(file: UploadFile = File(...)):
    """
    ENDPOINT 1: Dot (Pulli) Grid Detection
    Scans a captured photo, detects dots, and extracts (x, y) coordinates.
    """
    if yolo_model is None:
        raise HTTPException(status_code=503, detail="YOLO Dot Detection model is not loaded.")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        img_np = np.array(image)

        results = yolo_model(img_np, conf=0.25)[0]
        
        detected_points = []
        for box in results.boxes:
            coords = box.xyxy[0].cpu().numpy()
            x_center = float((coords[0] + coords[2]) / 2.0)
            y_center = float((coords[1] + coords[3]) / 2.0)
            detected_points.append({"x": round(x_center, 2), "y": round(y_center, 2)})

        # Sort dots top-to-bottom, left-to-right
        sorted_points = sorted(detected_points, key=lambda p: (p["y"], p["x"]))
        matrix_x = [pt["x"] for pt in sorted_points]
        matrix_y = [pt["y"] for pt in sorted_points]

        return DetectionResponse(
            status="success",
            total_dots=len(sorted_points),
            coordinates=sorted_points,
            grid_matrix_x=matrix_x,
            grid_matrix_y=matrix_y
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/api/analyze-symmetry", response_model=SymmetryResponse)
async def analyze_symmetry(file: UploadFile = File(...)):
    """
    ENDPOINT 2: Geometry & Symmetry Analysis
    Evaluates pattern image and classifies mathematical symmetry group.
    """
    if symmetry_model is None:
        raise HTTPException(status_code=503, detail="ResNet18 Symmetry Classifier is not loaded.")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        tensor = symmetry_transform(image).unsqueeze(0).to(DEVICE)
        
        with torch.no_grad():
            outputs = symmetry_model(tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)[0]
            pred_idx = torch.argmax(probs).item()

        predicted_class = SYMMETRY_CLASSES[pred_idx]
        confidence = probs[pred_idx].item() * 100

        scores = {SYMMETRY_CLASSES[i]: round(probs[i].item() * 100, 2) for i in range(len(SYMMETRY_CLASSES))}

        return SymmetryResponse(
            status="success",
            symmetry_type=predicted_class,
            confidence=f"{confidence:.2f}%",
            raw_scores=scores
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Symmetry analysis error: {str(e)}")


@app.post("/api/generate-kala-sutra", response_model=GenerationResponse)
async def generate_from_prompt(request: TextPromptRequest):
    """
    ENDPOINT 3: Natural Language / Voice-to-Pattern Generation
    Processes prompts like 'Mujhe 8 dot ki kolam art banao' into drawing instructions.
    """
    if kala_sutra_model is None or kala_sutra_tokenizer is None:
        # Graceful rule-based fallback if Transformer is compiling
        extracted_dots = request.dot_count or 8
        fallback_rules = f"GRID_START: {extracted_dots}x{extracted_dots} | SYMMETRY: {request.symmetry_type} | PATH: LOOP_CLOSED"
        return GenerationResponse(
            status="fallback_rule_generation",
            input_prompt=request.prompt,
            generated_rules=fallback_rules,
            dot_count=extracted_dots
        )

    try:
        formatted_prompt = f"Instruction: {request.prompt}\nResponse:"
        inputs = kala_sutra_tokenizer(formatted_prompt, return_tensors="pt").to(DEVICE)

        with torch.no_grad():
            outputs = kala_sutra_model.generate(
                **inputs,
                max_new_tokens=128,
                temperature=0.7,
                do_sample=True,
                pad_token_id=kala_sutra_tokenizer.eos_token_id
            )

        output_text = kala_sutra_tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        return GenerationResponse(
            status="success",
            input_prompt=request.prompt,
            generated_rules=output_text,
            dot_count=request.dot_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generative engine error: {str(e)}")


# ==============================================================================
# 5. GRADIO UI INTERFACE (FOR FREE HUGGING FACE SPACES)
# ==============================================================================

def gradio_detect(image):
    if image is None:
        return "Please upload an image.", 0
    if yolo_model is None:
        return "YOLO model not loaded.", 0
    
    results = yolo_model(image, conf=0.25)[0]
    total_dots = len(results.boxes)
    annotated_img = results.plot()
    return annotated_img, total_dots

def gradio_symmetry(image):
    if image is None:
        return "Please upload an image."
    if symmetry_model is None:
        return "Symmetry model not loaded."
    
    pil_img = Image.fromarray(image).convert("RGB")
    tensor = symmetry_transform(pil_img).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        outputs = symmetry_model(tensor)
        probs = torch.nn.functional.softmax(outputs, dim=1)[0]
        pred_idx = torch.argmax(probs).item()
    return f"{SYMMETRY_CLASSES[pred_idx]} ({probs[pred_idx].item()*100:.2f}% confidence)"

def gradio_generate(prompt):
    if not prompt:
        return "Please enter a prompt."
    if kala_sutra_model is None:
        return f"Rule Output (Fallback): 8x8 Grid, Symmetric Path, Loop Closed."
    
    inputs = kala_sutra_tokenizer(f"Instruction: {prompt}\nResponse:", return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        outputs = kala_sutra_model.generate(**inputs, max_new_tokens=100)
    return kala_sutra_tokenizer.decode(outputs[0], skip_special_tokens=True)


with gr.Blocks(title="Kolam AI Engine") as demo:
    gr.Markdown("# 🪷 Team TARS - Kolam AI Cloud Engine")
    gr.Markdown("Interactive Testing Dashboard. Complete API Documentation available at [**/docs**](/docs).")
    
    with gr.Tab("1. Dot Detection (YOLOv8)"):
        with gr.Row():
            in_img = gr.Image(type="numpy", label="Upload Kolam Photo")
            with gr.Column():
                out_img = gr.Image(label="Detected Dots Grid")
                dot_count = gr.Number(label="Total Dots Found")
        detect_btn = gr.Button("Detect Dots")
        detect_btn.click(gradio_detect, inputs=in_img, outputs=[out_img, dot_count])

    with gr.Tab("2. Symmetry Classifier (ResNet18)"):
        with gr.Row():
            sym_in = gr.Image(type="numpy", label="Upload Kolam Art")
            sym_out = gr.Textbox(label="Predicted Symmetry Type")
        sym_btn = gr.Button("Classify Symmetry")
        sym_btn.click(gradio_symmetry, inputs=sym_in, outputs=sym_out)

    with gr.Tab("3. Voice/Text Generator (Kala Sutra)"):
        with gr.Row():
            prompt_in = gr.Textbox(label="Enter Voice Transcript or Text Prompt", placeholder="e.g. Mujhe 8 dot ki kolam art banao")
            gen_out = gr.Textbox(label="Kala Sutra Generated Rule Sequence")
        gen_btn = gr.Button("Generate Kolam Design")
        gen_btn.click(gradio_generate, inputs=prompt_in, outputs=gen_out)

# Mount Gradio onto the root path of FastAPI
app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)