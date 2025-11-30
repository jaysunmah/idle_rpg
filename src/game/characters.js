// Character type definitions
// Each character has a name, description, sprite frames, and optional stats modifiers

export const CHARACTER_TYPES = {
  'bamboo-princess-archer': {
    id: 'bamboo-princess-archer',
    name: 'Bamboo Princess',
    description: 'A swift archer princess from the bamboo groves. Balanced stats with quick attacks.',
    spriteFrames: [
      '/assets/bamboo-princess-archer/frame_1.png',
      '/assets/bamboo-princess-archer/frame_2.png',
      '/assets/bamboo-princess-archer/frame_3.png',
      '/assets/bamboo-princess-archer/frame_4.png',
      '/assets/bamboo-princess-archer/frame_5.png',
    ],
    previewFrame: '/assets/bamboo-princess-archer/frame_1.png',
    stats: {
      damageMultiplier: 1.0,
      attackSpeedMultiplier: 1.0,
      critChanceBonus: 0,
    },
    color: '#88cc88',
  },
  'wizard': {
    id: 'wizard',
    name: 'Starry Wizard',
    description: 'A mysterious wizard wielding arcane powers. Higher crit chance but slower attacks.',
    spriteFrames: [
      '/assets/wizard/frame_1.png',
      '/assets/wizard/frame_2.png',
      '/assets/wizard/frame_3.png',
      '/assets/wizard/frame_4.png',
      '/assets/wizard/frame_5.png',
    ],
    previewFrame: '/assets/wizard/frame_1.png',
    stats: {
      damageMultiplier: 1.2,
      attackSpeedMultiplier: 0.9,
      critChanceBonus: 0.05,
    },
    color: '#8866ff',
  },
  'cream-golden-doodle-knight': {
    id: 'cream-golden-doodle-knight',
    name: 'Doodle Knight',
    description: 'A valiant golden doodle in shining armor. High damage but slower attack speed.',
    spriteFrames: [
      '/assets/cream-golden-doodle-knight/frame_1.png',
      '/assets/cream-golden-doodle-knight/frame_2.png',
      '/assets/cream-golden-doodle-knight/frame_3.png',
      '/assets/cream-golden-doodle-knight/frame_4.png',
      '/assets/cream-golden-doodle-knight/frame_5.png',
    ],
    previewFrame: '/assets/cream-golden-doodle-knight/frame_1.png',
    stats: {
      damageMultiplier: 1.3,
      attackSpeedMultiplier: 0.85,
      critChanceBonus: 0,
    },
    color: '#ffcc66',
  },
  'white-orange-cat-wizard': {
    id: 'white-orange-cat-wizard',
    name: 'Cat Mage',
    description: 'A mystical feline spellcaster. Fast attacks with moderate damage.',
    spriteFrames: [
      '/assets/white-orange-cat-wizard/frame_1.png',
      '/assets/white-orange-cat-wizard/frame_2.png',
      '/assets/white-orange-cat-wizard/frame_3.png',
      '/assets/white-orange-cat-wizard/frame_4.png',
      '/assets/white-orange-cat-wizard/frame_5.png',
    ],
    previewFrame: '/assets/white-orange-cat-wizard/frame_1.png',
    stats: {
      damageMultiplier: 0.9,
      attackSpeedMultiplier: 1.2,
      critChanceBonus: 0.03,
    },
    color: '#ff9966',
  },
  'bamboo-princess': {
    id: 'bamboo-princess',
    name: 'Bamboo Maiden',
    description: 'A graceful princess with balanced abilities. Perfect for beginners.',
    spriteFrames: [
      '/assets/bamboo-princess/frame_1.png',
      '/assets/bamboo-princess/frame_2.png',
      '/assets/bamboo-princess/frame_3.png',
      '/assets/bamboo-princess/frame_4.png',
      '/assets/bamboo-princess/frame_5.png',
    ],
    previewFrame: '/assets/bamboo-princess/frame_1.png',
    stats: {
      damageMultiplier: 1.0,
      attackSpeedMultiplier: 1.0,
      critChanceBonus: 0,
    },
    color: '#ff88aa',
  },
}

// Default character
export const DEFAULT_CHARACTER = 'bamboo-princess-archer'

// Get character by ID
export const getCharacter = (id) => CHARACTER_TYPES[id] || CHARACTER_TYPES[DEFAULT_CHARACTER]

// Get all characters as array for rendering
export const getAllCharacters = () => Object.values(CHARACTER_TYPES)
