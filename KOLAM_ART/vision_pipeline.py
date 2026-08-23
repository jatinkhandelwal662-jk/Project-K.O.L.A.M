import cv2
import numpy as np
import matplotlib.pyplot as plt
import os

# The exact vocabulary used to train your T5 Model
def vector_to_direction(dx, dy):
    tol = 2  # Pixel tolerance for straight lines
    if abs(dx) <= tol and dy > tol: return "DOWN" # Image Y-axis goes down
    elif abs(dx) <= tol and dy < -tol: return "UP"
    elif dx > tol and abs(dy) <= tol: return "RIGHT"
    elif dx < -tol and abs(dy) <= tol: return "LEFT"
    elif dx > tol and dy > tol: return "DIAG_DOWN_RIGHT"
    elif dx < -tol and dy > tol: return "DIAG_DOWN_LEFT"
    elif dx > tol and dy < -tol: return "DIAG_UP_RIGHT"
    elif dx < -tol and dy < -tol: return "DIAG_UP_LEFT"
    return None

def extract_tokens_from_image(image_path: str):
    if not os.path.exists(image_path):
        print(f"[ERROR] Could not find {image_path}")
        return []

    print(f"Processing image: {image_path}")
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    blurred = cv2.GaussianBlur(img, (5, 5), 0)
    _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    skeleton = cv2.ximgproc.thinning(binary)

    # --- THE SYNAPSE: Tracing the mathematical graph ---
    # Find all continuous paths (contours) in the 1-pixel skeleton
    contours, _ = cv2.findContours(skeleton, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    
    sequence_tokens = []
    step_size = 15 # Sample a point every 15 pixels to avoid microscopic noise
    
    for contour in contours:
        # A contour is an array of (x,y) points. We flatten it for easy iteration.
        points = contour.squeeze()
        
        # Ensure it's a valid path and not just a speck of dust
        if len(points.shape) == 2 and len(points) > step_size:
            for i in range(0, len(points) - step_size, step_size):
                x1, y1 = points[i]
                x2, y2 = points[i + step_size]
                
                direction = vector_to_direction(x2 - x1, y2 - y1)
                if direction:
                    sequence_tokens.append(direction)

    # Optional: Display the skeleton like before
    # plt.imshow(skeleton, cmap='gray')
    # plt.title(f"Extracted {len(sequence_tokens)} Tokens")
    # plt.show()

    return sequence_tokens

if __name__ == "__main__":
    # Ensure this points to the exact image you just successfully processed
    test_image = "test_kolam.jpg" 
    
    extracted_tokens = extract_tokens_from_image(test_image)
    
    print("\n--- VISION PIPELINE OUTPUT ---")
    print(f"Tokens Extracted: {len(extracted_tokens)}")
    print(extracted_tokens[:20]) # Print the first 20 tokens