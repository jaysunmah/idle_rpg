# Idle Quest - 2D Side Scroller RPG

A relaxing idle RPG game where your hero automatically battles through an endless fantasy world.

## Features

- **Infinite Side-Scrolling**: Travel through procedurally endless terrain
- **Auto-Combat**: Your hero automatically attacks enemies in range
- **Multiple Enemy Types**: Face slimes, bats, skeletons, and stone golems
- **Progression System**: Gain XP, level up, and become stronger
- **Upgrades**: Spend gold to enhance damage, attack speed, and critical hits
- **Parallax Backgrounds**: Enjoy beautiful layered scrolling scenery

## Controls

- **Arrow Keys / WASD**: Move character
- **Space**: Jump
- **Up/Down**: Climb ladders
## How to Play

The game runs automatically! Your character will:
- Walk forward through the world
- Attack any enemy that comes within range
- Collect gold and XP from defeated enemies
- Level up when enough XP is gained

Use the upgrade panel to spend gold on:
- **Sharpen Blade**: Increase base damage
- **Swift Strikes**: Attack faster
- **Critical Eye**: Higher chance for critical hits
- **Devastating Blows**: More damage on critical hits

## Getting Started

```bash
# Install dependencies
npm install

# (Optional) Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration if needed

# Start development server
npm run dev
```

Then open http://localhost:5173 in your browser.

## Tech Stack

- React 19
- Vite
- PixiJS 8 for game rendering
- Matter.js for physics
- Pure CSS for UI animations

## Environment Variables

Currently, this game doesn't require any environment variables. However, if you want to add features like analytics or backend integration, see [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) for instructions.

# idle_rpg
