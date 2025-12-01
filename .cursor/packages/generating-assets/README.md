---
enabled: true
title: Generating Assets
description: This package will describe how to generate assets for a 2D RPG adventure game.
---

# Generating Assets Overview

Generate the asset in a whimsical, 2D RPG adventure game theme. Think "MapleStory".

You are provided a `process_image_spreadsheet.py` script that extracts individual frames from a spritesheet image that has a **red (255,0,0) background**. It removes the red background and outputs each detected frame as a separate PNG file.

# Phase 1: Image generation:

First, you will use the provided image generation tool to generate animation frames in a single horizontal row. **Aim for 5-6 frames**, but the actual output may vary — that's OK.

> ⚠️ **IMPORTANT: ALL FRAMES MUST BE IN A SINGLE HORIZONTAL ROW**
> 
> Generate animation frames arranged **LEFT-TO-RIGHT in ONE ROW** (not stacked vertically, not in a grid).

1. In a SINGLE `generate_image` call, generate all of the requested animation frames.
2. Make sure each frame is clearly separated and not overlapping with one another as we will be trimming them later.
3. Please render the background to be EXACTLY red (255,0,0). Do not include any other colors or borders to the frames.
4. Make sure the asset is facing towards the right. 

Once the image is generated, please consult the user to verify the image is correct, and ask the user for the number of frames in the image.

# Phase 2: Image processing guidelines:

DO NOT PROCEED ONTO PHASE 2 UNTIL YOU HAVE VERIFIED THE IMAGE GENERATION AND COUNTED THE NUMBER OF FRAMES.

You will need to use `uv` to run the `process_image_spreadsheet.py` script inside `scripts` to create separate frames from the image. **Pass the actual frame count you observed in Phase 1 as the `num_frames` argument.** 

This script will automatically detect the bounding box of the asset and trim the image to only include the asset, so it is imperative that you pass the correct number of frames.

This script will also automatically remove the red background from the frames.

## Script usage

Please make sure you are running the `uv` command inside this script's directory. So you'll most likely need to run `cd <working_directory>/.cursor/packages/generating-assets/scripts` before running the script.

You should also reference images by their absolute path to reliably reference the images.

```
usage: process_image_spreadsheet.py [-h] [-t TOLERANCE] [-m MERGE_DISTANCE] [-p PADDING] input_image output_dir num_frames
```

**Positional arguments:**
- `input_image` — Path to the input spritesheet image (with red background)
- `output_dir` — Directory to save extracted frames. This folder will be created for you.
- `num_frames` — Number of frames to detect using k-means clustering

**Options:**
- `-t, --tolerance` — Color tolerance for background removal (default: 50)
- `-m, --merge-distance` — Max distance to merge nearby components (default: 10)
- `-p, --padding` — Padding around extracted frames (default: 5)

**Example:**
```bash
uv run process_image_spreadsheet.py /path/to/spritesheet.png /path/to/raw_assets/frames/my_asset 5
```

**Output structure:**
```
raw_assets/frames/<name_of_the_asset>/
  frame_1.png
  frame_2.png
  frame_3.png
  ...
```

> ⚠️ **OUTPUT LOCATION: Always save outputs to the `raw_assets/frames` directory**
>
> Save the output to `raw_assets/frames/<name_of_the_asset>`. The script outputs only the extracted frames — it does not copy or move the original input image.
>
> **Do NOT manually create the output folder** — the script will create it for you.

> 🚫 **DO NOT modify or delete any assets in other folders**
>
> Only write to the `raw_assets/frames` directory. Never modify, move, or delete files in `public/assets/` or any other asset directories.