import urllib.parse
import random
from ..config import get_settings

settings = get_settings()

class ImageGenerationService:
    """Service to generate images using Pollinations.ai (Free API)."""
    
    def __init__(self):
        self.base_url = "https://image.pollinations.ai/prompt/"
        self.api_key = settings.pollinations_api_key
    
    def generate(self, prompt: str) -> str:
        """
        Generate an image URL for the given prompt.
        Pollinations returns the image content directly at the URL.
        """
        # Encode prompt safely
        encoded_prompt = urllib.parse.quote(prompt)
        
        # Add random seed to prevent caching and ensure variety
        seed = random.randint(0, 1000000)
        
        # Construct parameters:
        # width/height: 1024 for high quality
        # nologo=true: Hide logo
        # seed: Random seed for new results
        # model: flux (current best free model on pollinations)
        url = f"{self.base_url}{encoded_prompt}?width=1024&height=768&nologo=true&seed={seed}"
        
        if self.api_key:
             url += f"&key={self.api_key}"
        
        return url
