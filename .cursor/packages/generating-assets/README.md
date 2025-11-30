---
enabled: true
title: Generating Assets
description: This package will describe how to generate assets for a 2D RPG adventure game.
---

# Generating Assets

### Theme:

Generate the asset in a whimsical, 2D RPG adventure game theme. Think "MapleStory".

# Phase 1: Image generation:

First, you will use the provided image generation tool to generate 5 animation frames in a single horizontal row

> ⚠️ **IMPORTANT: ALL 5 FRAMES MUST BE IN A SINGLE HORIZONTAL ROW**
> 
> Generate exactly 5 animation frames arranged **LEFT-TO-RIGHT in ONE ROW** (not stacked vertically, not in a grid).

1. In a SINGLE `generate_image` call, generate all 5 animation frames in a **SINGLE HORIZONTAL ROW**. Do NOT stack frames vertically or arrange them in a 2x3 grid. They must be side-by-side in one row.
2. Make sure each frame is clearly separated and not overlapping with one another as we will be trimming them later.
3. Please render the background to be EXACTLY red (255,0,0). Do not include any other colors or borders to the frames.
4. Make sure the asset is facing towards the right. 

Once the image is generated, you should inspect the image yourself and make sure it meets the criteria mentioned above. If it does not, you should iterate on the image generation until it meets the criteria.

# Phase 2: Image processing guidelines:

1. Run `magick` to strip out the red background. Use 20% fuzz.
2. Then you will need to use the `splice_sprites.py` script inside `scripts` to create separate frames from the image. This script will automatically detect the bounding box of the asset and trim the image to only include the asset.


## Script usage

Example usage:

```bash
cd generating-assets/scripts && uv run scripts/splice_sprites.py -i <input_image> -n 5 -o <output_directory>
```

You should save the output to 'public/assets/<name_of_the_asset>'. The script will output the frames to the output directory.

## Cleanup

Afterwards, please move all generated assets into the output directory for organization.