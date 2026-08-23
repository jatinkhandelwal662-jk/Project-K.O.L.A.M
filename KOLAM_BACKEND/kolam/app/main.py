from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import generation 

app = FastAPI(title="Kolam AI Engine")

# Critical for frontend-backend communication across different ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The Health Check Route for the UI Badge
@app.get("/health")
async def health_check():
    return {"status": "online", "message": "Kolam Engine is ready."}

# Mount the generation router (which contains both /render and /reconstruct)
app.include_router(generation.router, prefix="/api/generate", tags=["Generation & Reconstruction"])