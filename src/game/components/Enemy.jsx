// Enemy type definitions
export const ENEMY_TYPES = {
  slime: {
    name: 'Slime',
    baseHealth: 15,
    xpReward: 10,
    goldReward: 5,
    speed: 20,
    width: 50,
    height: 40,
    color: 0x44cc44,
    canClimb: false,
    preferredLevels: ['ground', 'level1'],
    sprite: '/assets/enemy-slime.png',
    spriteFrames: [
      '/assets/wolf-sprite/frame_1.png',
      '/assets/wolf-sprite/frame_2.png',
      '/assets/wolf-sprite/frame_3.png',
      '/assets/wolf-sprite/frame_4.png',
      '/assets/wolf-sprite/frame_5.png',
    ],
    useAnimatedSprite: true,
  },
  skeleton: {
    name: 'Skeleton',
    baseHealth: 30,
    xpReward: 25,
    goldReward: 12,
    speed: 35,
    width: 40,
    height: 60,
    color: 0xcccccc,
    canClimb: true,
    preferredLevels: ['ground', 'level1', 'level2'],
    sprite: '/assets/enemy-skeleton.png',
    spriteFrames: [
      '/assets/wolf-sprite/frame_1.png',
      '/assets/wolf-sprite/frame_2.png',
      '/assets/wolf-sprite/frame_3.png',
      '/assets/wolf-sprite/frame_4.png',
      '/assets/wolf-sprite/frame_5.png',
    ],
    useAnimatedSprite: true,
  },
  bat: {
    name: 'Bat',
    baseHealth: 10,
    xpReward: 8,
    goldReward: 3,
    speed: 60,
    width: 40,
    height: 30,
    color: 0x6644aa,
    canClimb: false,
    preferredLevels: ['level1', 'level2', 'level3'],
    spriteFrames: [
      '/assets/wolf-sprite/frame_1.png',
      '/assets/wolf-sprite/frame_2.png',
      '/assets/wolf-sprite/frame_3.png',
      '/assets/wolf-sprite/frame_4.png',
      '/assets/wolf-sprite/frame_5.png',
    ],
    useAnimatedSprite: true,
  },
  golem: {
    name: 'Stone Golem',
    baseHealth: 80,
    xpReward: 100,
    goldReward: 50,
    speed: 15,
    width: 80,
    height: 100,
    color: 0x666666,
    canClimb: false,
    preferredLevels: ['ground', 'level1'],
    spriteFrames: [
      '/assets/golem/frame_1.png',
      '/assets/golem/frame_2.png',
      '/assets/golem/frame_3.png',
      '/assets/golem/frame_4.png',
      '/assets/golem/frame_5.png',
    ],
    useAnimatedSprite: true,
  },
}

export function drawEnemy(g, type, isHit, isDying) {
  const enemyType = ENEMY_TYPES[type]
  const { width, height, color } = enemyType
  
  g.clear()
  
  // Flash white when hit
  const bodyColor = isHit ? 0xffffff : color
  const alpha = isDying ? 0.5 : 1
  
  if (type === 'slime' && !enemyType.sprite) {
    // Slime body - bouncy blob shape
    g.fill({ color: bodyColor, alpha })
    g.moveTo(-width/2, 0)
    g.quadraticCurveTo(-width/2, -height, 0, -height)
    g.quadraticCurveTo(width/2, -height, width/2, 0)
    g.lineTo(-width/2, 0)
    g.fill()
    
    // Slime shine
    g.fill({ color: 0xffffff, alpha: 0.3 * alpha })
    g.ellipse(-width/4, -height * 0.6, 8, 6)
    g.fill()
    
    // Eyes
    g.fill({ color: 0xffffff, alpha })
    g.circle(-8, -height * 0.5, 6)
    g.circle(8, -height * 0.5, 6)
    g.fill()
    g.fill({ color: 0x000000, alpha })
    g.circle(-6, -height * 0.5, 3)
    g.circle(10, -height * 0.5, 3)
    g.fill()
    
  } else if (type === 'skeleton') {
    // Skeleton body
    g.fill({ color: bodyColor, alpha })
    g.roundRect(-width/2, -height * 0.6, width, height * 0.4, 4)
    g.fill()
    
    // Ribcage lines
    g.stroke({ color: 0x999999, width: 2, alpha })
    for (let i = 0; i < 3; i++) {
      g.moveTo(-width/2 + 5, -height * 0.55 + i * 8)
      g.lineTo(width/2 - 5, -height * 0.55 + i * 8)
    }
    g.stroke()
    
    // Head (skull)
    g.fill({ color: bodyColor, alpha })
    g.circle(0, -height * 0.75, 12)
    g.fill()
    
    // Eye sockets
    g.fill({ color: 0x000000, alpha })
    g.circle(-5, -height * 0.75, 4)
    g.circle(5, -height * 0.75, 4)
    g.fill()
    
    // Red eyes
    g.fill({ color: 0xff0000, alpha })
    g.circle(-5, -height * 0.75, 2)
    g.circle(5, -height * 0.75, 2)
    g.fill()
    
    // Legs
    g.fill({ color: bodyColor, alpha })
    g.rect(-12, -height * 0.2, 6, height * 0.2)
    g.rect(6, -height * 0.2, 6, height * 0.2)
    g.fill()
    
  } else if (type === 'bat') {
    // Bat body
    g.fill({ color: bodyColor, alpha })
    g.ellipse(0, -height * 0.5, width * 0.3, height * 0.4)
    g.fill()
    
    // Wings (animated feel)
    const wingFlap = Math.sin(Date.now() / 50) * 5
    g.fill({ color: bodyColor, alpha: alpha * 0.9 })
    // Left wing
    g.moveTo(-5, -height * 0.5)
    g.quadraticCurveTo(-width * 0.6, -height * 0.3 + wingFlap, -width * 0.5, -height * 0.7)
    g.quadraticCurveTo(-width * 0.3, -height * 0.6, -5, -height * 0.4)
    // Right wing
    g.moveTo(5, -height * 0.5)
    g.quadraticCurveTo(width * 0.6, -height * 0.3 - wingFlap, width * 0.5, -height * 0.7)
    g.quadraticCurveTo(width * 0.3, -height * 0.6, 5, -height * 0.4)
    g.fill()
    
    // Eyes
    g.fill({ color: 0xff0000, alpha })
    g.circle(-4, -height * 0.55, 3)
    g.circle(4, -height * 0.55, 3)
    g.fill()
    
    // Ears
    g.fill({ color: bodyColor, alpha })
    g.moveTo(-6, -height * 0.7)
    g.lineTo(-10, -height)
    g.lineTo(-2, -height * 0.75)
    g.moveTo(6, -height * 0.7)
    g.lineTo(10, -height)
    g.lineTo(2, -height * 0.75)
    g.fill()
    
  } else if (type === 'golem') {
    // Golem body (blocky)
    g.fill({ color: bodyColor, alpha })
    g.roundRect(-width/2, -height * 0.7, width, height * 0.5, 8)
    g.fill()
    
    // Rock texture
    g.fill({ color: 0x555555, alpha: alpha * 0.5 })
    g.circle(-10, -height * 0.5, 8)
    g.circle(15, -height * 0.55, 6)
    g.circle(5, -height * 0.4, 5)
    g.fill()
    
    // Head
    g.fill({ color: bodyColor, alpha })
    g.roundRect(-15, -height * 0.95, 30, 25, 4)
    g.fill()
    
    // Glowing eyes
    g.fill({ color: 0xffaa00, alpha })
    g.rect(-10, -height * 0.85, 6, 4)
    g.rect(4, -height * 0.85, 6, 4)
    g.fill()
    
    // Arms
    g.fill({ color: bodyColor, alpha })
    g.roundRect(-width/2 - 10, -height * 0.6, 12, 30, 4)
    g.roundRect(width/2 - 2, -height * 0.6, 12, 30, 4)
    g.fill()
    
    // Legs
    g.fill({ color: bodyColor, alpha })
    g.roundRect(-18, -height * 0.2, 14, height * 0.2, 4)
    g.roundRect(4, -height * 0.2, 14, height * 0.2, 4)
    g.fill()
  }
}

export function drawHealthBar(g, health, maxHealth) {
  g.clear()
  
  const barWidth = 40
  const barHeight = 6
  const healthPercent = health / maxHealth
  
  // Background
  g.fill({ color: 0x333333, alpha: 0.8 })
  g.roundRect(-barWidth/2, 0, barWidth, barHeight, 2)
  g.fill()
  
  // Health fill
  const healthColor = healthPercent > 0.5 ? 0x44cc44 : healthPercent > 0.25 ? 0xcccc44 : 0xcc4444
  g.fill({ color: healthColor })
  g.roundRect(-barWidth/2 + 1, 1, (barWidth - 2) * healthPercent, barHeight - 2, 1)
  g.fill()
}

export default { ENEMY_TYPES, drawEnemy, drawHealthBar }

// To add a new enemy type:
// 1. Add entry to ENEMY_TYPES with spriteFrames array pointing to your animation frames
// 2. Add a drawEnemy case if you want a fallback when sprites aren't loaded
// 3. Sprites are automatically loaded by GameStage based on spriteFrames
