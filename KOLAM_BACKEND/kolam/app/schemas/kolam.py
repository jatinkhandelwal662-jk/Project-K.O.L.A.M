from pydantic import BaseModel
from typing import Optional, List

class GenerateRequest(BaseModel):
    prompt: str                          # from text chat OR voice-to-text transcript
    history: Optional[List[str]] = None  # optional prior messages, for follow-up refinement

class GenerateResponse(BaseModel):
    generated_image_base64: str
    confidence: Optional[float] = None