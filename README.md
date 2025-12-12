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

# Start development server
npm run dev
```

Then open http://localhost:5173 in your browser.

### Environment Setup

This project uses environment variables for configuration. See **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** for detailed setup instructions.

**Quick start:**
- `.env.local` - Already configured with development defaults
- `.env.production` - Production configuration
- `.env.example` - Template showing all available variables

**Example environment variables:**
- `VITE_ENABLE_DEBUG` - Enable debug logging
- `VITE_STARTING_GOLD` - Starting gold (useful for testing)
- `VITE_SAVE_INTERVAL` - Auto-save interval in milliseconds

For usage examples, see **[ENVIRONMENT_USAGE_EXAMPLES.md](./ENVIRONMENT_USAGE_EXAMPLES.md)**.

## Tech Stack

- React 19
- Vite
- Pure CSS animations (no external animation libraries)
# idle_rpg
