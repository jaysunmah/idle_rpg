#!/usr/bin/env python3
"""
Resize monster sprite frames to have a better aspect ratio.
Reduces the height while maintaining the sprite's visual quality.
"""

from PIL import Image
import os
from pathlib import Path

# Configuration
# Get the project root directory - script is at .cursor/packages/generating-assets/scripts/
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent  # Go up 4 levels to reach project root
INPUT_DIR = PROJECT_ROOT / "public" / "assets"
OUTPUT_DIR = INPUT_DIR  # Save to same directory (overwrite originals)
TARGET_ASPECT_RATIO = 1.0  # Width/Height ratio (1.0 = perfect square)
# Alternative: Set specific dimensions instead
# TARGET_WIDTH = 563
# TARGET_HEIGHT = 800

def resize_sprite(input_path, output_path, target_aspect_ratio=None, target_size=None):
    """
    Resize a sprite image to match target aspect ratio or specific size.
    
    Args:
        input_path: Path to input image
        output_path: Path to save resized image
        target_aspect_ratio: Desired width/height ratio (e.g., 0.7)
        target_size: Tuple of (width, height) for specific dimensions
    """
    img = Image.open(input_path)
    original_width, original_height = img.size
    
    print(f"Original: {original_width}x{original_height} (aspect ratio: {original_width/original_height:.2f})")
    
    if target_size:
        new_width, new_height = target_size
    elif target_aspect_ratio:
        # Keep width, adjust height to match aspect ratio
        new_width = original_width
        new_height = int(new_width / target_aspect_ratio)
    else:
        raise ValueError("Must provide either target_aspect_ratio or target_size")
    
    # Resize using high-quality Lanczos resampling
    resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    print(f"Resized:  {new_width}x{new_height} (aspect ratio: {new_width/new_height:.2f})")
    
    # Save with same format and quality
    resized_img.save(output_path, format='PNG', optimize=True)
    print(f"Saved to: {output_path}\n")

def main():
    """Process all monster sprite frames."""
    print(f"Looking for sprites in: {INPUT_DIR}")
    
    # Find all monster sprite files
    monster_files = sorted(INPUT_DIR.glob("monster-sprite-frame-*.png"))
    
    if not monster_files:
        print(f"No monster sprite files found in {INPUT_DIR}")
        return
    
    print(f"Found {len(monster_files)} monster sprite frames\n")
    
    # Process each file
    for input_path in monster_files:
        print(f"Processing: {input_path.name}")
        output_path = OUTPUT_DIR / input_path.name
        
        # Resize with target aspect ratio
        resize_sprite(
            input_path, 
            output_path, 
            target_aspect_ratio=TARGET_ASPECT_RATIO
        )
        
        # Alternative: Use specific dimensions
        # resize_sprite(input_path, output_path, target_size=(563, 800))
    
    print("✓ All monster sprites resized successfully!")

if __name__ == "__main__":
    main()
