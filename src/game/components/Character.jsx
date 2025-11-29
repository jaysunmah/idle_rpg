import { useCallback, useMemo } from 'react'
import { Graphics, Container, Text } from 'pixi.js'

// Character dimensions
export const CHARACTER_WIDTH = 40
export const CHARACTER_HEIGHT = 60

export function Character({ 
  x, 
  y, 
  facingRight = true, 
  isAttacking = false,
  isClimbing = false,
  isMoving = false,
  showClimbIndicator = false,
}) {
  // Draw the character using Graphics
  const drawCharacter = useCallback((g) => {
    g.clear()
    
    // Animation offset for attacking
    const attackOffset = isAttacking ? 5 : 0
    
    // Legs
    const legColor = 0x4a3728
    g.fill({ color: legColor })
    
    if (isMoving && !isClimbing) {
      // Walking animation - alternate legs
      const time = Date.now() / 100
      const legOffset = Math.sin(time) * 4
      g.rect(-8, 35, 8, 25 + legOffset)
      g.rect(0, 35, 8, 25 - legOffset)
    } else if (isClimbing) {
      // Climbing pose
      g.rect(-10, 30, 8, 28)
      g.rect(2, 38, 8, 20)
    } else {
      // Standing
      g.rect(-8, 35, 8, 25)
      g.rect(0, 35, 8, 25)
    }
    g.fill()
    
    // Body (armor)
    g.fill({ color: 0x5a6a7a })
    g.roundRect(-15, 5, 30, 35, 4)
    g.fill()
    
    // Body highlight
    g.fill({ color: 0x6a7a8a })
    g.roundRect(-12, 8, 24, 10, 2)
    g.fill()
    
    // Head
    g.fill({ color: 0xffdbac })
    g.circle(0, -8, 12)
    g.fill()
    
    // Helmet
    g.fill({ color: 0x7a8a9a })
    g.moveTo(-14, -5)
    g.lineTo(-14, -15)
    g.lineTo(0, -25)
    g.lineTo(14, -15)
    g.lineTo(14, -5)
    g.closePath()
    g.fill()
    
    // Helmet visor
    g.fill({ color: 0x2a3a4a })
    g.rect(-8, -12, 16, 6)
    g.fill()
    
    // Eyes (visible through visor)
    g.fill({ color: 0xffffff })
    g.circle(-4, -9, 2)
    g.circle(4, -9, 2)
    g.fill()
    g.fill({ color: 0x000000 })
    g.circle(-4, -9, 1)
    g.circle(4, -9, 1)
    g.fill()
    
    // Sword
    const swordX = isAttacking ? 25 + attackOffset : 18
    const swordY = isAttacking ? -5 : 10
    
    // Sword handle
    g.fill({ color: 0x4a3728 })
    g.rect(swordX - 3, swordY + 15, 6, 12)
    g.fill()
    
    // Sword guard
    g.fill({ color: 0xffd700 })
    g.rect(swordX - 8, swordY + 12, 16, 4)
    g.fill()
    
    // Sword blade
    const bladeColor = isAttacking ? 0xffffff : 0xd0d0d0
    g.fill({ color: bladeColor })
    g.moveTo(swordX - 4, swordY + 12)
    g.lineTo(swordX + 4, swordY + 12)
    g.lineTo(swordX + 3, swordY - 25)
    g.lineTo(swordX, swordY - 30)
    g.lineTo(swordX - 3, swordY - 25)
    g.closePath()
    g.fill()
    
    // Sword shine
    g.fill({ color: 0xffffff, alpha: 0.5 })
    g.rect(swordX - 1, swordY - 20, 2, 15)
    g.fill()
    
  }, [isAttacking, isClimbing, isMoving])

  return {
    x,
    y,
    scaleX: facingRight ? 1 : -1,
    draw: drawCharacter,
    showClimbIndicator,
    facingRight,
  }
}

export default Character
