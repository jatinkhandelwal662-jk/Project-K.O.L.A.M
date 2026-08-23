import cv2
import numpy as np

def perform_cv_analysis(image_bytes: bytes) -> dict:
    """
    Performs classical computer vision analysis on a Kolam image.
    Extracts dot coordinates, line complexity, and structural symmetry.
    """
    try:
        # 1. Decode the incoming image bytes into an OpenCV numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"status": "error", "message": "Invalid image data."}

        # Convert to Grayscale and blur slightly to remove camera noise
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # ---------------------------------------------------------
        # A. DOT (PULLI) DETECTION
        # ---------------------------------------------------------
        # Use Otsu's thresholding to separate the pattern from the background
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        dots = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Filter 1: Area (Ignore tiny specks of dust and massive shapes)
            if 15 < area < 800:
                # Filter 2: Circularity (Dots are circles, lines are not)
                perimeter = cv2.arcLength(cnt, True)
                if perimeter == 0:
                    continue
                circularity = 4 * np.pi * (area / (perimeter * perimeter))
                
                # Perfect circle is 1.0. We accept 0.7 to 1.2 to account for hand-drawn flour
                if 0.7 < circularity <= 1.2:
                    M = cv2.moments(cnt)
                    if M["m00"] != 0:
                        cX = int(M["m10"] / M["m00"])
                        cY = int(M["m01"] / M["m00"])
                        dots.append({"x": cX, "y": cY, "area": round(area, 2)})
        
        # ---------------------------------------------------------
        # B. LINE (SIKKU) COMPLEXITY
        # ---------------------------------------------------------
        # Use Canny Edge detection to find the flow of the woven lines
        edges = cv2.Canny(blurred, 50, 150)
        
        # Calculate what percentage of the image is covered in edges
        total_pixels = edges.shape[0] * edges.shape[1]
        edge_density = float(np.sum(edges > 0) / total_pixels)
        
        complexity = "Low"
        if edge_density > 0.05:
            complexity = "High"
        elif edge_density > 0.02:
            complexity = "Medium"

        # ---------------------------------------------------------
        # C. STRUCTURAL SYMMETRY ANALYSIS
        # ---------------------------------------------------------
        # Resize to a standard square grid for reliable matrix comparison
        resized_gray = cv2.resize(gray, (256, 256))
        
        # Create flipped matrix versions
        flipped_h = cv2.flip(resized_gray, 1) # Horizontal flip
        flipped_v = cv2.flip(resized_gray, 0) # Vertical flip
        
        # Calculate Mean Absolute Error (MAE) between original and flipped
        diff_h = np.mean(np.abs(resized_gray.astype(int) - flipped_h.astype(int)))
        diff_v = np.mean(np.abs(resized_gray.astype(int) - flipped_v.astype(int)))
        
        # If the MAE is below 35 (out of 255 pixel intensity), it's highly symmetric
        is_h_symmetric = bool(diff_h < 35)
        is_v_symmetric = bool(diff_v < 35)
        
        if is_h_symmetric and is_v_symmetric:
            symmetry_type = "D4_Square (Horizontal & Vertical)"
        elif is_h_symmetric:
            symmetry_type = "Bilateral (Horizontal)"
        elif is_v_symmetric:
            symmetry_type = "Bilateral (Vertical)"
        else:
            symmetry_type = "Asymmetric / Freeform"

        # Return the compiled JSON payload
        return {
            "status": "success",
            "metadata": {
                "resolution": f"{img.shape[1]}x{img.shape[0]}"
            },
            "dots": {
                "total_count": len(dots),
                "coordinates": dots
            },
            "lines": {
                "density_percentage": round(edge_density * 100, 2),
                "visual_complexity": complexity
            },
            "symmetry": {
                "type": symmetry_type,
                "horizontal_error_score": round(diff_h, 2),
                "vertical_error_score": round(diff_v, 2)
            }
        }

    except Exception as e:
        return {"status": "error", "message": f"CV Processing failed: {str(e)}"}