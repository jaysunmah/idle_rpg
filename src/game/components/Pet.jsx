import { useRef, useState, useEffect } from 'react'
import { Sprite, Assets } from 'pixi.js'

/**
 * Pet Component - Renders an animated pet companion
 * 
 * MULTIPLE PETS SUPPORT:
 * - The GameStage component now supports multiple pets following the character in a chain
 * - Each pet follows the previous pet (or the player for the first pet)
 * - Pets are stored in a pets array with position, movement state, and type
 * 
 * USAGE:
 * - Press 'P' in-game to add a new pet (defaults to 'doodle')
 * - Press 'O' in-game to remove the last pet
 * - From console: window.gameDebug.addPet('doodle', 1) or window.gameDebug.addPet('cat', 1)
 * - From console: window.gameDebug.removePet(petId)
 * - From console: window.gameDebug.getPets()
 * 
 * AVAILABLE PET TYPES:
 * - 'doodle': Cream Golden Doodle Knight
 * - 'cat': White Orange Cat Wizard
 * 
 * ADDING NEW PET TYPES:
 * - Add new pet configurations to the PET_TYPES object below
 * - Each pet type needs: name, frames (array of image paths), width, height, animationSpeed
 */

// Pet dimensions (smaller than the character)
export const PET_WIDTH = 60
export const PET_HEIGHT = 52

// Pet type configurations
export const PET_TYPES = {
  doodle: {
    name: 'Cream Golden Doodle Knight',
    frames: [
      '/assets/cream-golden-doodle-knight/frame_1.png',
      '/assets/cream-golden-doodle-knight/frame_2.png',
      '/assets/cream-golden-doodle-knight/frame_3.png',
      '/assets/cream-golden-doodle-knight/frame_4.png',
      '/assets/cream-golden-doodle-knight/frame_5.png',
    ],
    width: 60,
    height: 52,
    animationSpeed: 120,
  },
  cat: {
    name: 'White Orange Cat Wizard',
    frames: [
      '/assets/white-orange-cat-wizard/frame_1.png',
      '/assets/white-orange-cat-wizard/frame_2.png',
      '/assets/white-orange-cat-wizard/frame_3.png',
      '/assets/white-orange-cat-wizard/frame_4.png',
      '/assets/white-orange-cat-wizard/frame_5.png',
    ],
    width: 60,
    height: 52,
    animationSpeed: 110,
  },
  // Add more pet types here in the future
}

const ANIMATION_FRAME_DURATION = 120 // milliseconds per frame (slightly slower than character)

export function Pet({ 
  x, 
  y, 
  facingRight = true, 
  isMoving = false,
  petType = 'doodle',
  scale = 1,
}) {
  const containerRef = useRef(null)
  const spriteRef = useRef(null)
  const animationFramesRef = useRef([])
  const currentFrameRef = useRef(0)
  const animationTimeRef = useRef(0)
  const lastTimeRef = useRef(Date.now())
  const [spriteLoaded, setSpriteLoaded] = useState(false)

  const petConfig = PET_TYPES[petType] || PET_TYPES.doodle

  // Load pet animation frames
  useEffect(() => {
    const loadSprite = async () => {
      try {
        const frameTextures = await Promise.all(
          petConfig.frames.map(path => Assets.load(path))
        )
        
        animationFramesRef.current = frameTextures
        
        // Create sprite with first frame
        const sprite = new Sprite(frameTextures[0])
        sprite.anchor.set(0.5, 0.9) // Anchor at bottom center (feet)
        sprite.width = petConfig.width * scale
        sprite.height = petConfig.height * scale
        spriteRef.current = sprite
        
        if (containerRef.current) {
          containerRef.current.addChild(sprite)
        }
        
        setSpriteLoaded(true)
      } catch (error) {
        console.error('Failed to load pet sprite:', error)
      }
    }
    
    loadSprite()
    
    return () => {
      if (spriteRef.current) {
        spriteRef.current.destroy()
      }
    }
  }, [petType, petConfig.frames, petConfig.width, petConfig.height, scale])

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

      // Only animate when moving
      if (isMoving) {
        animationTimeRef.current += delta
        
        if (animationTimeRef.current >= petConfig.animationSpeed) {
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
  }, [spriteLoaded, isMoving, petConfig.animationSpeed])

  return (
    <pixiContainer
      ref={containerRef}
      x={x}
      y={y}
      scale={{ x: facingRight ? 1 : -1, y: 1 }}
    />
  )
}

export default Pet
