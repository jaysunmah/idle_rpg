#!/usr/bin/env python3
"""
Sprite Sheet Slicer

Slices a horizontal sprite sheet into individual frame files,
automatically detecting content bounding boxes and trimming with padding.
"""

import argparse
import os
import sys
from PIL import Image
import numpy as np


PADDING = 5
ALPHA_THRESHOLD = 10  # Pixels with alpha below this are considered "empty"


def find_content_bounding_box(image, alpha_threshold=ALPHA_THRESHOLD, min_row_content=0.02, min_col_content=0.02):
    """
    Find the bounding box of non-transparent content in an image.
    Returns (left, top, right, bottom) or None if no content found.
    
    Args:
        image: PIL Image
        alpha_threshold: Minimum alpha value to consider a pixel as content
        min_row_content: Minimum fraction of row pixels that must be content (filters sparse artifacts)
        min_col_content: Minimum fraction of col pixels that must be content (filters sparse artifacts)
    """
    # Convert to RGBA to check alpha channel
    if image.mode != 'RGBA':
        # If no alpha channel, return the full image bounds
        return (0, 0, image.width, image.height)
    
    # Convert to numpy array for faster processing
    pixels = np.array(image)
    
    # Create a mask of non-transparent pixels (alpha > threshold to ignore faint artifacts)
    alpha_channel = pixels[:, :, 3]
    content_mask = alpha_channel > alpha_threshold
    
    # Count content pixels per row and column
    content_per_row = np.sum(content_mask, axis=1)  # Sum across columns for each row
    content_per_col = np.sum(content_mask, axis=0)  # Sum across rows for each column
    
    # Require minimum content density to filter out sparse artifacts (stray pixels at edges)
    min_row_pixels = max(1, int(image.width * min_row_content))
    min_col_pixels = max(1, int(image.height * min_col_content))
    
    rows_with_content = content_per_row >= min_row_pixels
    cols_with_content = content_per_col >= min_col_pixels
    
    # Get indices of content boundaries
    row_indices = np.where(rows_with_content)[0]
    col_indices = np.where(cols_with_content)[0]
    
    if len(row_indices) == 0 or len(col_indices) == 0:
        return None  # No content found
    
    top = row_indices[0]
    bottom = row_indices[-1] + 1
    left = col_indices[0]
    right = col_indices[-1] + 1
    
    return (left, top, right, bottom)


def find_frame_boundaries(image, num_frames, alpha_threshold=ALPHA_THRESHOLD, min_gap_width=3):
    """
    Find frame boundaries by detecting vertical gaps between sprites.
    This handles spritesheets where sprites are not evenly spaced.
    
    Returns a list of (left, right) tuples for each frame.
    """
    if image.mode != 'RGBA':
        # Fall back to equal division for non-RGBA images
        frame_width = image.width // num_frames
        return [(i * frame_width, (i + 1) * frame_width if i < num_frames - 1 else image.width) 
                for i in range(num_frames)]
    
    pixels = np.array(image)
    alpha_channel = pixels[:, :, 3]
    
    # For each column, count pixels with significant alpha
    content_per_col = np.sum(alpha_channel > alpha_threshold, axis=0)
    
    # Find columns with minimal content (potential gaps)
    # Allow some noise - columns with less than 1% content are considered gaps
    max_noise = image.height * 0.01
    is_gap = content_per_col <= max_noise
    
    # Find contiguous gap regions
    gaps = []
    gap_start = None
    for x in range(len(is_gap)):
        if is_gap[x] and gap_start is None:
            gap_start = x
        elif not is_gap[x] and gap_start is not None:
            if x - gap_start >= min_gap_width:
                gaps.append((gap_start, x))
            gap_start = None
    # Handle gap at the end
    if gap_start is not None and len(is_gap) - gap_start >= min_gap_width:
        gaps.append((gap_start, len(is_gap)))
    
    print(f"Detected {len(gaps)} vertical gaps in spritesheet")
    
    # Use gap centers as dividers between frames
    if len(gaps) >= num_frames - 1:
        # We have enough gaps to separate all frames
        # Sort gaps by position and take the ones that best divide the sheet
        gaps.sort(key=lambda g: g[0])
        
        # If we have exactly the right number of gaps, use them all
        # Otherwise, select gaps that best divide the sheet into num_frames parts
        if len(gaps) == num_frames - 1:
            selected_gaps = gaps
        else:
            # Select gaps that are closest to ideal division points
            ideal_positions = [(i + 1) * image.width // num_frames for i in range(num_frames - 1)]
            selected_gaps = []
            used_gaps = set()
            
            for ideal_pos in ideal_positions:
                best_gap = None
                best_dist = float('inf')
                for gap in gaps:
                    if gap not in used_gaps:
                        gap_center = (gap[0] + gap[1]) // 2
                        dist = abs(gap_center - ideal_pos)
                        if dist < best_dist:
                            best_dist = dist
                            best_gap = gap
                if best_gap:
                    selected_gaps.append(best_gap)
                    used_gaps.add(best_gap)
            
            selected_gaps.sort(key=lambda g: g[0])
        
        # Build frame boundaries from gaps
        boundaries = []
        prev_right = 0
        for gap_start, gap_end in selected_gaps:
            gap_center = (gap_start + gap_end) // 2
            boundaries.append((prev_right, gap_center))
            prev_right = gap_center
        # Last frame goes to the end
        boundaries.append((prev_right, image.width))
        
        return boundaries
    else:
        # Not enough gaps detected - fall back to equal division
        print(f"Warning: Only found {len(gaps)} gaps, need {num_frames - 1}. Falling back to equal division.")
        frame_width = image.width // num_frames
        return [(i * frame_width, (i + 1) * frame_width if i < num_frames - 1 else image.width) 
                for i in range(num_frames)]


def slice_spritesheet(input_path, output_dir, num_frames, padding=PADDING):
    """
    Slices a horizontal sprite sheet into individual frame files.
    
    Args:
        input_path: Path to the input sprite sheet image
        output_dir: Directory to save output frames
        num_frames: Number of frames in the sprite sheet
        padding: Padding to add around detected content (default: 5px)
    """
    
    # 1. Check if file exists
    if not os.path.exists(input_path):
        print(f"Error: The file '{input_path}' was not found.")
        sys.exit(1)

    # 2. Open the image
    try:
        sprite_sheet = Image.open(input_path)
        print(f"Loaded: {input_path}")
    except IOError as e:
        print(f"Error: Unable to load image - {e}")
        sys.exit(1)

    # 3. Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    # 4. Calculate dimensions
    sheet_width, sheet_height = sprite_sheet.size

    print(f"Sheet Dimensions: {sheet_width}x{sheet_height}")
    print(f"Frames: {num_frames}")
    print(f"Padding: {padding}px")
    print("-" * 40)

    # 5. Find frame boundaries using gap detection (handles uneven sprite spacing)
    frame_boundaries = find_frame_boundaries(sprite_sheet, num_frames)
    
    for i, (col_left, col_right) in enumerate(frame_boundaries):
        print(f"Frame {i+1} column: x={col_left} to x={col_right} (width: {col_right - col_left}px)")

    print("-" * 40)

    # 6. Loop through frames, detect content, and crop
    for i, (col_left, col_right) in enumerate(frame_boundaries):
        # Crop to the frame column first
        frame_column = sprite_sheet.crop((col_left, 0, col_right, sheet_height))
        
        # Find the actual content bounding box within this column
        bbox = find_content_bounding_box(frame_column)
        
        if bbox is None:
            print(f"Warning: Frame {i+1} appears to be empty (no content found)")
            # Save an empty transparent image
            empty_frame = Image.new('RGBA', (padding * 2, padding * 2), (0, 0, 0, 0))
            frame_path = os.path.join(output_dir, f"frame_{i+1}.png")
            empty_frame.save(frame_path)
            print(f"Saved (empty): {frame_path}")
            continue
        
        content_left, content_top, content_right, content_bottom = bbox
        
        # Add padding, but clamp to image boundaries
        padded_left = max(0, content_left - padding)
        padded_top = max(0, content_top - padding)
        padded_right = min(frame_column.width, content_right + padding)
        padded_bottom = min(frame_column.height, content_bottom + padding)
        
        # Crop to the padded bounding box
        final_frame = frame_column.crop((padded_left, padded_top, padded_right, padded_bottom))
        
        # Calculate actual dimensions
        final_width = padded_right - padded_left
        final_height = padded_bottom - padded_top
        
        # Save the frame
        frame_filename = f"frame_{i+1}.png"
        frame_path = os.path.join(output_dir, frame_filename)
        final_frame.save(frame_path)
        
        print(f"Frame {i+1}: Content bbox ({content_left}, {content_top}, {content_right}, {content_bottom})")
        print(f"         Final size: {final_width}x{final_height}px")
        print(f"         Saved: {frame_path}")

    print("-" * 40)
    print("Splice complete!")


def main():
    parser = argparse.ArgumentParser(
        description="Slice a horizontal sprite sheet into individual frames.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s character_walk.png 5 ./frames/character
  %(prog)s -i sprite_sheet.png -n 8 -o ./output/monster --padding 10
  %(prog)s --input monster.png --num-frames 4 --output ./monster_frames/goblin

The script assumes:
  - A horizontal sprite sheet (frames arranged in a single row)
  - Each frame will be auto-detected and trimmed to its content
  - Output files will be saved in: {output_folder}/frame_{n}.png
        """
    )
    
    # Positional arguments (for simple usage)
    parser.add_argument(
        'input_file', 
        nargs='?',
        help='Path to the input sprite sheet image'
    )
    parser.add_argument(
        'num_frames', 
        nargs='?',
        type=int,
        help='Number of frames in the sprite sheet'
    )
    parser.add_argument(
        'output_folder', 
        nargs='?',
        help='Directory to save output frames'
    )
    
    # Named arguments (for explicit usage)
    parser.add_argument(
        '-i', '--input',
        dest='input_named',
        help='Path to the input sprite sheet image'
    )
    parser.add_argument(
        '-n', '--num-frames',
        dest='num_frames_named',
        type=int,
        help='Number of frames in the sprite sheet'
    )
    parser.add_argument(
        '-o', '--output',
        dest='output_named',
        help='Directory to save output frames'
    )
    
    # Optional parameters
    parser.add_argument(
        '-p', '--padding',
        type=int,
        default=PADDING,
        help=f'Padding around detected content in pixels (default: {PADDING})'
    )
    
    args = parser.parse_args()
    
    # Resolve arguments (named takes precedence over positional)
    input_path = args.input_named or args.input_file
    num_frames = args.num_frames_named or args.num_frames
    output_dir = args.output_named or args.output_folder
    
    # Validate required arguments
    if not input_path:
        parser.error("Input file is required. Use positional argument or -i/--input")
    if not num_frames:
        parser.error("Number of frames is required. Use positional argument or -n/--num-frames")
    if not output_dir:
        parser.error("Output folder is required. Use positional argument or -o/--output")
    
    if num_frames < 1:
        parser.error("Number of frames must be at least 1")
    
    # Run the slicer
    slice_spritesheet(
        input_path=input_path,
        output_dir=output_dir,
        num_frames=num_frames,
        padding=args.padding,
    )


if __name__ == "__main__":
    main()
