// Enemy type definitions
export const ENEMY_TYPES = {
  wolf: {
    name: 'Wolf',
    baseHealth: 25,
    xpReward: 15,
    goldReward: 8,
    speed: 40,
    width: 50,
    height: 50,
    color: 0x8b7355,
    canClimb: false,
    preferredLevels: ['ground', 'level1'],
    spriteSheet: {
      json: '/assets/wolf.json',
      image: '/assets/wolf.png',
      animation: 'walking/walking',
    },
    useAnimatedSprite: true,
  },
  bear: {
    name: 'Bear',
    baseHealth: 80,
    xpReward: 100,
    goldReward: 50,
    speed: 35,
    width: 80,
    height: 100,
    color: 0x8b4513,
    canClimb: false,
    preferredLevels: ['ground', 'level1'],
    spriteSheet: {
      json: '/assets/bear.json',
      image: '/assets/bear.png',
      animation: 'walking/walking',
    },
    useAnimatedSprite: true,
  },
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

// Draw target indicator for auto-attack targeting
export function drawTargetIndicator(g, width, height) {
  g.clear()
  
  // Animated pulse based on time
  const time = Date.now() / 1000
  const pulse = 0.8 + Math.sin(time * 4) * 0.2
  
  // Size of the indicator based on enemy size
  const indicatorSize = Math.max(width, height) * 0.8
  const cornerSize = indicatorSize * 0.25
  const cornerOffset = indicatorSize * 0.5
  
  // Glowing red/orange target color
  const baseColor = 0xff4444
  const glowColor = 0xff8844
  
  // Draw outer glow ring (pulsing)
  g.stroke({ color: glowColor, width: 2, alpha: 0.3 * pulse })
  g.circle(0, -height * 0.5, indicatorSize * 0.6 * pulse)
  g.stroke()
  
  // Draw corner brackets (rotating effect simulated by alternating corners)
  const corners = [
    { x: -cornerOffset, y: -height * 0.5 - cornerOffset }, // top-left
    { x: cornerOffset, y: -height * 0.5 - cornerOffset },  // top-right
    { x: -cornerOffset, y: -height * 0.5 + cornerOffset }, // bottom-left
    { x: cornerOffset, y: -height * 0.5 + cornerOffset },  // bottom-right
  ]
  
  corners.forEach((corner, i) => {
    const brightness = 0.6 + Math.sin(time * 4 + i * Math.PI * 0.5) * 0.4
    g.stroke({ color: baseColor, width: 3, alpha: brightness })
    
    // Draw L-shaped corner bracket
    if (i === 0) { // top-left
      g.moveTo(corner.x, corner.y + cornerSize)
      g.lineTo(corner.x, corner.y)
      g.lineTo(corner.x + cornerSize, corner.y)
    } else if (i === 1) { // top-right
      g.moveTo(corner.x, corner.y + cornerSize)
      g.lineTo(corner.x, corner.y)
      g.lineTo(corner.x - cornerSize, corner.y)
    } else if (i === 2) { // bottom-left
      g.moveTo(corner.x, corner.y - cornerSize)
      g.lineTo(corner.x, corner.y)
      g.lineTo(corner.x + cornerSize, corner.y)
    } else { // bottom-right
      g.moveTo(corner.x, corner.y - cornerSize)
      g.lineTo(corner.x, corner.y)
      g.lineTo(corner.x - cornerSize, corner.y)
    }
    g.stroke()
  })
  
  // Draw center crosshair
  const crosshairSize = 6
  g.stroke({ color: baseColor, width: 2, alpha: 0.9 })
  // Horizontal line
  g.moveTo(-crosshairSize, -height * 0.5)
  g.lineTo(crosshairSize, -height * 0.5)
  g.stroke()
  // Vertical line
  g.moveTo(0, -height * 0.5 - crosshairSize)
  g.lineTo(0, -height * 0.5 + crosshairSize)
  g.stroke()
  
  // Draw small diamond in center
  g.fill({ color: baseColor, alpha: pulse * 0.8 })
  const diamondSize = 3
  g.moveTo(0, -height * 0.5 - diamondSize)
  g.lineTo(diamondSize, -height * 0.5)
  g.lineTo(0, -height * 0.5 + diamondSize)
  g.lineTo(-diamondSize, -height * 0.5)
  g.closePath()
  g.fill()
}

export default { ENEMY_TYPES, drawHealthBar, drawTargetIndicator }

// To add a new enemy type:
// 1. Add entry to ENEMY_TYPES with either:
//    - spriteSheet: { json, image, animation } for TexturePacker sprite sheets
//    - spriteFrames: [...] array for individual frame PNGs
// 2. Sprites are automatically loaded by GameStage
