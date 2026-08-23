from PIL import Image, ImageDraw
import random

def create_swept_kolam():
    print("[System] Generating wind-swept diamond Kolam test image...")
    
    # 1. Authentic terracotta floor
    img = Image.new('RGB', (500, 500), color='#8C2E22')
    draw = ImageDraw.Draw(img)

    # 2. Draw a large diagonal "broom sweep" smudge underneath
    draw.line([100, 0, 400, 500], fill='#7A261D', width=90)
    draw.line([80, 0, 380, 500], fill='#852A1F', width=30)

    # 3. Diamond Grid Pattern: 1-3-5-7-9-7-5-3-1 (Total 41 dots)
    row_counts = [1, 3, 5, 7, 9, 7, 5, 3, 1]
    spacing = 40
    center_x, center_y = 250, 250
    start_y = center_y - (len(row_counts) - 1) * spacing / 2

    dots_drawn = 0
    total_dots = sum(row_counts)

    # 4. Plot dots with environmental damage logic
    for i, count in enumerate(row_counts):
        y = start_y + i * spacing
        start_x = center_x - (count - 1) * spacing / 2
        
        for j in range(count):
            x = start_x + j * spacing
            
            # Calculate if this specific dot is inside the "broom sweep" zone
            in_sweep_zone = 80 < (x + y)/2 < 220 
            
            # 85% chance to survive if untouched, only 10% chance to survive the broom
            survival_chance = 0.10 if in_sweep_zone else 0.85
            
            if random.random() < survival_chance:
                # Draw Pristine Dot
                r = 4
                draw.ellipse([x-r, y-r, x+r, y+r], fill='#FDFBF7')
                
                # Add horizontal "wind streak" effect to the surviving powder
                streak_length = random.randint(5, 20)
                draw.line([x, y, x+streak_length, y], fill='#D9C5C1', width=2)
                dots_drawn += 1
            else:
                # Draw destroyed/smudged dot remnant
                r = random.randint(5, 9)
                draw.ellipse([x-r, y-r, x+r, y+r], fill='#7A261D')

    # Save the new file
    filename = 'damaged_diamond_kolam.jpg'
    img.save(filename)
    
    print(f"✅ Success! Saved '{filename}'.")
    print(f"-> The image has {dots_drawn} surviving dots out of the original {total_dots}.")
    print("-> Upload this to your UI to watch the Math Engine rebuild the diamond grid!")

if __name__ == "__main__":
    create_swept_kolam()