import numpy as np
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter1d

class PerfectKolamGenerator:
    def __init__(self, width_complexity=3, height_complexity=4):
        """
        To generate a single, unbroken continuous Eulerian circuit, 
        the width and height complexities should be coprime (e.g., 3 and 4, or 4 and 5).
        """
        self.width = width_complexity
        self.height = height_complexity
        self.path_x = []
        self.path_y = []
        self.dots_x = []
        self.dots_y = []

    def build_geometry(self):
        print("[System] Calculating Bouncing-Billiard Eulerian Circuit...")
        # 1. Generate high-resolution time steps
        t = np.linspace(0, 2 * np.pi, 15000)
        
        # 2. The Triangle Wave Equation: (2/pi) * arcsin(sin(t))
        # This creates perfect diagonal weaves that bounce exactly at the grid limits.
        raw_x = self.width * (2 / np.pi) * np.arcsin(np.sin(self.height * t))
        raw_y = self.height * (2 / np.pi) * np.arcsin(np.sin(self.width * t))
        
        # 3. The Neli Knot Smoothing
        # A Gaussian filter specifically smooths the hard bounces at the edges 
        # into perfect 180-degree semicircular knots, just like chalk on the floor.
        print("[System] Applying Gaussian Edge-Smoothing...")
        self.path_x = gaussian_filter1d(raw_x, sigma=45)
        self.path_y = gaussian_filter1d(raw_y, sigma=45)
        
        # 4. Perfect Pulli (Dot) Matrix Alignment
        # Mathematically place the dots EXACTLY in the alternating pockets of the weave.
        print("[System] Aligning Isometric Pulli Matrix...")
        for i in range(-self.width, self.width + 1):
            for j in range(-self.height, self.height + 1):
                # The mathematical pockets of a Lissajous/Triangle weave occur where (x+y) is odd
                if (i + j) % 2 != 0:
                    self.dots_x.append(i)
                    self.dots_y.append(j)

    def visualize(self):
        print("[System] Rendering Visualization...")
        plt.figure(figsize=(9, 10), facecolor='#121212')
        ax = plt.gca()
        ax.set_facecolor('#121212')

        # Draw the Dots (Pulli)
        plt.scatter(self.dots_x, self.dots_y, color='#ffffff', s=100, zorder=5, label="Pulli Matrix")
        
        # Draw the Flawless Path (Neli)
        plt.plot(self.path_x, self.path_y, color='#00ffcc', linewidth=4, zorder=4, label="Continuous Sikku Weave")

        plt.title(f"Flawless Procedural Kolam ({self.width}x{self.height})", color='white', fontsize=16, pad=20)
        plt.axis('equal')
        plt.axis('off')
        
        plt.legend(facecolor='#1e1e1e', edgecolor='#333333', labelcolor='white', fontsize=12, loc='upper right')
        plt.tight_layout()
        plt.show()

if __name__ == "__main__":
    # Test this with (3, 4) or (4, 5) to see the magic.
    generator = PerfectKolamGenerator(width_complexity=4, height_complexity=5)
    generator.build_geometry()
    generator.visualize()