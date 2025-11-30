import sys
import argparse
from pathlib import Path
from PIL import Image
import numpy as np

def remove_background(input_path: Path, output_path: Path, target_color=(255, 0, 0), tolerance=30):
    """
    Removes the specified background color from an image, making it transparent.
    Equivalent to ImageMagick's -transparent with fuzz.
    """
    print(f"Processing {input_path}...")
    
    try:
        img = Image.open(input_path).convert("RGBA")
    except FileNotFoundError:
        print(f"Error: File not found at {input_path}")
        sys.exit(1)
        
    data = np.array(img)
    
    # Break down channels
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Target color
    tr, tg, tb = target_color
    
    # Create mask for pixels close to the target color
    mask = (
        (r >= max(0, tr - tolerance)) & (r <= min(255, tr + tolerance)) &
        (g >= max(0, tg - tolerance)) & (g <= min(255, tg + tolerance)) &
        (b >= max(0, tb - tolerance)) & (b <= min(255, tb + tolerance))
    )
    
    # Set alpha to 0 for matching pixels
    data[:,:,3][mask] = 0
    
    # Create new image
    result = Image.fromarray(data)
    
    # Save
    output_path.parent.mkdir(parents=True, exist_ok=True)
    result.save(output_path)
    print(f"Saved transparent image to {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Remove a specific background color from an image.")
    parser.add_argument("-i", "--input_image", type=Path, help="Path to the input image file")
    parser.add_argument("-o", "--output_image", type=Path, help="Path to the output image file")
    parser.add_argument("-t", "--tolerance", type=int, default=30, help="Color tolerance (default: 30)")
    
    args = parser.parse_args()
    
    input_path = args.input_image.resolve()
    
    if args.output_image:
        output_path = args.output_image.resolve()
    else:
        output_path = input_path.with_name(input_path.stem + "_transparent.png")
        
    remove_background(input_path, output_path, tolerance=args.tolerance)

if __name__ == "__main__":
    main()
