---
enabled: true
title: Organizing Spritesheet Assets
description: Organizing Spritesheet Assets capabilities for the AI assistant
---

# Organizing Spritesheet Assets

## Description

You will help with organizing various frames from different directories into a single directory that will be uploaded to TexturePacker.

## Usage Guidelines

All of the frames will be originally organized into the raw_assets/frames directory. You should use your best judgement based on the user's request to figure out which folders inside raw_assets/frames you want to organize.

If you are unsure, you should check with the user for clarification before proceeding.

You are to make a new folder inside `raw_assets/spritesheets` with the overall name of the sprite you are organizing. Then inside that folder, you should create a new folder for each action of the sprite.

Finally, cp the frames from the raw_assets/frames directory into the new folder you created, and rename them to the actioon name followed by the frame number.

**IMPORTANT: DO NOT MOVE OR DELETE ANY FILES FROM THE raw_assets/frames DIRECTORY, WE WANT TO PRESERVE THE ORIGINAL FILES FOR FUTURE USE.**