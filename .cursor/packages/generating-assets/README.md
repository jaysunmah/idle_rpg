---
enabled: true
title: Generating Assets
description: This package will describe how to generate assets for a 2D RPG adventure game.
---

# Generating Assets

### Theme:

Generate the asset in a whimsical, 2D RPG adventure game theme. Think "MapleStory".

# Phase 1: Image generation:

First, you will use the provided image generation tool to generate animation frames in a single horizontal row. **Aim for 5-6 frames**, but the actual output may vary — that's OK.

> ⚠️ **IMPORTANT: ALL FRAMES MUST BE IN A SINGLE HORIZONTAL ROW**
> 
> Generate animation frames arranged **LEFT-TO-RIGHT in ONE ROW** (not stacked vertically, not in a grid).

1. In a SINGLE `generate_image` call, generate animation frames in a **SINGLE HORIZONTAL ROW**. Do NOT stack frames vertically or arrange them in a 2x3 grid. They must be side-by-side in one row.
2. Make sure each frame is clearly separated and not overlapping with one another as we will be trimming them later.
3. Please render the background to be EXACTLY red (255,0,0). Do not include any other colors or borders to the frames.
4. Make sure the asset is facing towards the right. 

Once the image is generated, you **MUST** inspect the image yourself to verify:
- All frames are in a single horizontal row (not stacked or in a grid)
- Frames are clearly separated and not overlapping
- The background is red
- **Count the actual number of frames generated** — the image generator may produce more or fewer frames than requested, and that's OK. You will need this count for Phase 2.

# Phase 2: Image processing guidelines:

1. Run `magick` to strip out the red background. Use 20% fuzz.
2. Then you will need to use `uv` to run the `process_image_spreadsheet.py` script inside `scripts` to create separate frames from the image. **Pass the actual frame count you observed in Phase 1 as the `num_frames` argument.** This script will automatically detect the bounding box of the asset and trim the image to only include the asset, so it is imperative that you pass the correct number of frames.

## Script usage

usage: process_image_spreadsheet.py [-h] [-t TOLERANCE] [-m MERGE_DISTANCE] [-p PADDING] input_image output_dir num_frames

Remove background color from spritesheet and extract individual frames.

positional arguments:
  input_image           Path to the input image file
  output_dir            Directory to save outputs (transparent.png + frames/ subfolder)
  num_frames            Number of frames to detect using k-means clustering

options:
  -h, --help            show this help message and exit
  -t TOLERANCE, --tolerance TOLERANCE
                        Color tolerance for background removal (default: 30)
  -m MERGE_DISTANCE, --merge-distance MERGE_DISTANCE
                        Max distance to merge nearby components (default: 10)
  -p PADDING, --padding PADDING
                        Padding around extracted frames (default: 5)

Examples:
  uv process_image_spreadsheet.py <input_image> </path/to/public/assets/<name_of_the_asset> <number_of_frames>

Output structure:
  ./output/
    spritesheet.png    # Original input image (copied)
    transparent.png    # Background-removed spritesheet
    frames/
      frame_1.png
      frame_2.png
      ...

You should save the output to 'public/assets/<name_of_the_asset>'. The script will copy the input image and output all frames to the output directory.