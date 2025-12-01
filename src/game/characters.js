// Character type definitions
// Each character has a name, description, sprite sheet, and optional stats modifiers

export const CHARACTER_TYPES = {
  'beginner-adventurer': {
    id: 'beginner-adventurer',
    name: 'Beginner Adventurer',
    description: 'A brave beginner starting their journey. Balanced stats.',
    spriteSheet: {
      json: '/assets/beginner-adventurer.json',
      image: '/assets/beginner-adventurer.png',
      animations: {
        walk: 'frames/walk',
        attack: 'frames/attack',
        climb: 'frames/climb',
      },
    },
    stats: {
      damageMultiplier: 1.0,
      attackSpeedMultiplier: 1.0,
      critChanceBonus: 0,
      attackRange: 100,
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
