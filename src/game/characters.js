// Character type definitions
// Each character has a name, description, sprite frames, and optional stats modifiers

export const CHARACTER_TYPES = {
  'beginner-adventurer': {
    id: 'beginner-adventurer',
    name: 'Beginner Adventurer',
    description: 'A brave beginner starting their journey. Balanced stats.',
    // Sprite sheet - used by Character.jsx for in-game rendering
    spriteSheet: {
      json: '/assets/beginner-adventurer.json',
      image: '/assets/beginner-adventurer.png',
      animations: {
        walk: 'frames/walk',
        attack: 'frames/attack',
        climb: 'frames/climb',
      },
    },
    // Individual frames - used by CharacterSelect for preview animation
    spriteFrames: [
      '/assets/beginner-adventurer-walking/frames/walk_1.png',
      '/assets/beginner-adventurer-walking/frames/walk_2.png',
      '/assets/beginner-adventurer-walking/frames/walk_3.png',
      '/assets/beginner-adventurer-walking/frames/walk_4.png',
      '/assets/beginner-adventurer-walking/frames/walk_5.png',
    ],
    previewFrame: '/assets/beginner-adventurer-walking/frames/walk_1.png',
    stats: {
      damageMultiplier: 1.0,
      attackSpeedMultiplier: 1.0,
      critChanceBonus: 0,
    },
    color: '#4488ff',
  },
}

// Default character
export const DEFAULT_CHARACTER = 'beginner-adventurer'

// Get character by ID
export const getCharacter = (id) => CHARACTER_TYPES[id] || CHARACTER_TYPES[DEFAULT_CHARACTER]

// Get all characters as array for rendering
export const getAllCharacters = () => Object.values(CHARACTER_TYPES)
