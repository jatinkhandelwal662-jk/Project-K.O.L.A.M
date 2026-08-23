from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.cv_analysis import perform_cv_analysis

router = APIRouter()

@router.post("/")
async def analyze_kolam_image(file: UploadFile = File(...)):
    """
    POST /api/analysis/
    Accepts an uploaded image of a Kolam and returns classical CV structural data.
    """
    # 1. Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided must be an image.")

    try:
        # 2. Read the image bytes into memory
        image_bytes = await file.read()
        
        # 3. Pass bytes to our OpenCV service
        analysis_result = perform_cv_analysis(image_bytes)

        if analysis_result.get("status") == "error":
            raise HTTPException(status_code=500, detail=analysis_result.get("message"))

        # 4. Return the clean JSON to the frontend
        return analysis_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error during analysis: {str(e)}")