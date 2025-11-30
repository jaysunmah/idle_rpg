# Idle Quest - 2D Side Scroller RPG

A relaxing idle RPG game where your hero automatically battles through an endless fantasy world.

## Features

- **Infinite Side-Scrolling**: Travel through procedurally endless terrain
- **Auto-Combat**: Your hero automatically attacks enemies in range
- **Multiple Enemy Types**: Face slimes, bats, skeletons, and stone golems
- **Pet Companions**: Adorable pets that follow you on your adventure
- **Progression System**: Gain XP, level up, and become stronger
- **Upgrades**: Spend gold to enhance damage, attack speed, and critical hits
- **Parallax Backgrounds**: Enjoy beautiful layered scrolling scenery

## Controls

- **Arrow Keys / WASD**: Move character
- **Space**: Jump
- **Up/Down**: Climb ladders
- **P**: Add a Doodle pet
- **C**: Add a Cat pet
- **O**: Remove the last pet

## Pet System

The game now features multiple pet companions that follow your character in a chain!

### Available Pets
- **Cream Golden Doodle Knight**: A loyal knight companion
- **White Orange Cat Wizard**: A magical feline friend

### Managing Pets
- Press **P** to add a Doodle pet
- Press **C** to add a Cat wizard pet
- Press **O** to remove the last pet
- Use the browser console for advanced pet management:
  ```javascript
  window.gameDebug.addPet('doodle', 1)  // Add a doodle
  window.gameDebug.addPet('cat', 1)     // Add a cat
  window.gameDebug.getPets()            // View all pets
  window.gameDebug.removePet(petId)     // Remove specific pet
  ```

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
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Tech Stack

- React 19
- Vite
- Pure CSS animations (no external animation libraries)
# idle_rpg
