import { useRef, useState, useEffect, useCallback } from 'react'
import { Sprite, Assets } from 'pixi.js'
import { getCharacter, DEFAULT_CHARACTER } from '../characters'

// Target character height (width will be calculated to preserve aspect ratio)
export const CHARACTER_HEIGHT = 135

const ANIMATION_FRAME_DURATION = 100 // milliseconds per frame

export function Character({ 
  x, 
  y, 
  facingRight = true, 
  isMoving = false,
  isClimbing = false,
  showClimbIndicator = false,
  showClimbingControls = false,
  characterType = DEFAULT_CHARACTER,
}) {
  // Get character sprite frames based on type
  const characterData = getCharacter(characterType)
  const spriteFrames = characterData.spriteFrames
  const containerRef = useRef(null)
  const spriteRef = useRef(null)
  const animationFramesRef = useRef([])
  const currentFrameRef = useRef(0)
  const animationTimeRef = useRef(0)
  const lastTimeRef = useRef(Date.now())
  const [spriteLoaded, setSpriteLoaded] = useState(false)

  // Load character animation frames
  useEffect(() => {
    let mounted = true
    
    const loadSprite = async () => {
      try {
        // Clean up previous sprite if exists
        if (spriteRef.current) {
          spriteRef.current.destroy()
          spriteRef.current = null
        }
        
        const frameTextures = await Promise.all(
          spriteFrames.map(path => Assets.load(path))
        )
        
        if (!mounted) return
        
        animationFramesRef.current = frameTextures
        
        // Create sprite with first frame
        const sprite = new Sprite(frameTextures[0])
        sprite.anchor.set(0.5, 0.9) // Anchor at bottom center (feet)
        
        // Scale uniformly to preserve aspect ratio based on target height
        const texture = frameTextures[0]
        const aspectRatio = texture.width / texture.height
        sprite.height = CHARACTER_HEIGHT
        sprite.width = CHARACTER_HEIGHT * aspectRatio
        
        spriteRef.current = sprite
        
        if (containerRef.current) {
          // Remove any existing children
          containerRef.current.removeChildren()
          containerRef.current.addChild(sprite)
        }
        
        setSpriteLoaded(true)
      } catch (error) {
        console.error('Failed to load character sprite:', error)
      }
    }
    
    loadSprite()
    
    return () => {
      mounted = false
      if (spriteRef.current) {
        spriteRef.current.destroy()
      }
    }
  }, [spriteFrames])

  // Handle animation updates
  useEffect(() => {
    if (!spriteLoaded || !spriteRef.current || animationFramesRef.current.length === 0) {
      return
    }

    let animationFrameId
    
    const animate = () => {
      const now = Date.now()
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now

      // Only animate when moving or climbing
      if (isMoving || isClimbing) {
        animationTimeRef.current += delta
        
        if (animationTimeRef.current >= ANIMATION_FRAME_DURATION) {
          animationTimeRef.current = 0
          currentFrameRef.current = (currentFrameRef.current + 1) % 5
          spriteRef.current.texture = animationFramesRef.current[currentFrameRef.current]
        }
      } else {
        // When idle, show first frame
        currentFrameRef.current = 0
        animationTimeRef.current = 0
        spriteRef.current.texture = animationFramesRef.current[0]
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [spriteLoaded, isMoving, isClimbing])

  return (
    <>
      {/* Character container with sprite */}
      <pixiContainer
        ref={containerRef}
        x={x}
        y={y}
        scale={{ x: facingRight ? 1 : -1, y: 1 }}
      />
      
      {/* Climb indicator */}
      {showClimbIndicator && (
        <pixiText
          text="↑↓ Climb"
          x={x + (facingRight ? 30 : -30)}
          y={y - CHARACTER_HEIGHT - 45}
          anchor={0.5}
          style={{
            fill: 0xffff00,
            fontSize: 14,
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 2 },
          }}
        />
      )}
      
      {/* Jump indicator while climbing */}
      {showClimbingControls && (
        <pixiText
          text="SPACE: Jump  ←→: Dismount"
          x={x}
          y={y - CHARACTER_HEIGHT - 50}
          anchor={0.5}
          style={{
            fill: 0x88ffff,
            fontSize: 12,
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 2 },
          }}
        />
      )}
    </>
  )
}

export default Character
