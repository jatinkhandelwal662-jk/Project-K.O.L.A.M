import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
from PIL import Image
import os

class KolamRenderEngine:
    def __init__(self):
        print("[System] Initializing ControlNet Render Engine...")
        
        # 1. Load the Scribble ControlNet (Perfect for flat line plots)
        self.controlnet = ControlNetModel.from_pretrained(
            "lllyasviel/sd-controlnet-scribble", 
            torch_dtype=torch.float16
        )

        # 2. Load the Stable Diffusion V1.5 Pipeline
        self.pipe = StableDiffusionControlNetPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5", 
            controlnet=self.controlnet, 
            torch_dtype=torch.float16
        )
        
        # 3. Optimization for faster generation
        self.pipe.scheduler = UniPCMultistepScheduler.from_config(self.pipe.scheduler.config)
        
        # Crucial for servers: Offloads memory to CPU when GPU is full
        self.pipe.enable_model_cpu_offload() 
        print("[System] Render Engine Online.")

    def render_photorealistic_kolam(self, digital_plot_path: str, output_path: str):
        """
        Takes the flat 2D mathematical plot and renders it as physical rice flour.
        """
        if not os.path.exists(digital_plot_path):
            raise FileNotFoundError("Could not find the digital plot image.")

        # Load the base geometry
        original_plot = Image.open(digital_plot_path).convert("RGB")

        # The Prompt: This dictates the photorealistic style
        prompt = (
            "traditional south indian kolam art, thick white rice flour powder drawn on "
            "a textured red terracotta floor, morning sunlight, ultra realistic, "
            "8k resolution, highly detailed, cultural heritage"
        )
        
        # Negative Prompt: What the AI should avoid
        negative_prompt = (
            "lowres, bad quality, digital, cartoon, neon, glowing, distorted geometry, "
            "broken lines, messy, messy background"
        )

        print("[System] Generative AI is rendering the final image...")
        
        # Generate the image
        rendered_image = self.pipe(
            prompt,
            image=original_plot,
            negative_prompt=negative_prompt,
            num_inference_steps=25 # 25 steps is the sweet spot for speed vs quality
        ).images[0]

        rendered_image.save(output_path)
        print(f"[System] Success! Photorealistic Kolam saved to {output_path}")
        return output_path

if __name__ == "__main__":
    # Test the engine! 
    # Point this to a saved image of your procedural generator's output
    engine = KolamRenderEngine()
    engine.render_photorealistic_kolam("flat_procedural_plot.png", "realistic_render.png")