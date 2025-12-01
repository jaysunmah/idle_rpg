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
  'knight': {
    id: 'knight',
    name: 'Knight',
    description: 'A heavily armored warrior. High damage but slower attacks.',
    spriteSheet: {
      json: '/assets/knight.json',
      image: '/assets/knight.png',
      animations: {
        walk: 'walking/walking',
        attack: 'attack/attack',
        climb: 'climb/climb',
      },
    },
    stats: {
      damageMultiplier: 1.3,
      attackSpeedMultiplier: 0.8,
      critChanceBonus: 0.05,
      attackRange: 120,
    },
    color: '#c0c0c0',
  },
}

// Default character
export const DEFAULT_CHARACTER = 'beginner-adventurer'

// Get character by ID
export const getCharacter = (id) => CHARACTER_TYPES[id] || CHARACTER_TYPES[DEFAULT_CHARACTER]

// Get all characters as array for rendering
export const getAllCharacters = () => Object.values(CHARACTER_TYPES)
