import { useRef, useState, useEffect } from 'react'
import { Sprite, Assets, Spritesheet } from 'pixi.js'
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
  isAttacking = false,
  showClimbIndicator = false,
  showClimbingControls = false,
  characterType = DEFAULT_CHARACTER,
}) {
  // Get character sprite frames based on type
  const characterData = getCharacter(characterType)
  const spriteSheetConfig = characterData.spriteSheet
  const spriteFrames = characterData.spriteFrames
  const attackFrames = characterData.attackFrames
  const climbFrames = characterData.climbFrames
  
  const containerRef = useRef(null)
  const spriteRef = useRef(null)
  
  const animationFramesRef = useRef([])
  const attackAnimationFramesRef = useRef([])
  const climbAnimationFramesRef = useRef([])
  
  // Store anchor data for each animation frame
  const walkAnchorsRef = useRef([])
  const attackAnchorsRef = useRef([])
  const climbAnchorsRef = useRef([])
  
  const currentFrameRef = useRef(0)
  const animationTimeRef = useRef(0)
  const lastTimeRef = useRef(0)
  const prevAttackingRef = useRef(isAttacking)
  const prevClimbingRef = useRef(isClimbing)
  
  const [spriteLoaded, setSpriteLoaded] = useState(false)

  // Load character animation frames (from sprite sheet or individual files)
  useEffect(() => {
    let mounted = true
    
    const loadSpriteSheet = async () => {
      try {
        // Clean up previous sprite if exists
        if (spriteRef.current) {
          spriteRef.current.destroy()
          spriteRef.current = null
        }
        
        // Load the sprite sheet JSON
        const response = await fetch(spriteSheetConfig.json)
        const atlasData = await response.json()
        
        // Load the base texture (the PNG image)
        const baseTexture = await Assets.load(spriteSheetConfig.image)
        
        // Create the spritesheet
        const spritesheet = new Spritesheet(baseTexture, atlasData)
        await spritesheet.parse()
        
        if (!mounted) return
        
        // Extract animation textures and anchors from the parsed spritesheet
        const animations = spriteSheetConfig.animations
        
        // Get walk animation frames
        const walkAnimKey = animations.walk
        const walkTextures = spritesheet.animations[walkAnimKey] || []
        animationFramesRef.current = walkTextures
        
        // Extract anchors for walk frames
        const walkFrameNames = atlasData.animations[walkAnimKey] || []
        walkAnchorsRef.current = walkFrameNames.map(frameName => {
          const frameData = atlasData.frames[frameName]
          return frameData?.anchor || { x: 0.5, y: 0.9 }
        })
        
        // Get attack animation frames
        const attackAnimKey = animations.attack
        const attackTextures = spritesheet.animations[attackAnimKey] || walkTextures
        attackAnimationFramesRef.current = attackTextures
        
        // Extract anchors for attack frames
        const attackFrameNames = atlasData.animations[attackAnimKey] || []
        attackAnchorsRef.current = attackFrameNames.map(frameName => {
          const frameData = atlasData.frames[frameName]
          return frameData?.anchor || { x: 0.5, y: 0.9 }
        })
        
        // Get climb animation frames
        const climbAnimKey = animations.climb
        const climbTextures = spritesheet.animations[climbAnimKey] || walkTextures
        climbAnimationFramesRef.current = climbTextures
        
        // Extract anchors for climb frames
        const climbFrameNames = atlasData.animations[climbAnimKey] || []
        climbAnchorsRef.current = climbFrameNames.map(frameName => {
          const frameData = atlasData.frames[frameName]
          return frameData?.anchor || { x: 0.5, y: 0.5 }
        })
        
        // Create sprite with first walk frame
        const sprite = new Sprite(walkTextures[0])
        
        // Set initial anchor from the sprite sheet data
        const initialAnchor = walkAnchorsRef.current[0] || { x: 0.5, y: 0.9 }
        sprite.anchor.set(initialAnchor.x, initialAnchor.y)
        
        // Scale uniformly to preserve aspect ratio based on target height
        const texture = walkTextures[0]
        const aspectRatio = texture.width / texture.height
        sprite.height = CHARACTER_HEIGHT
        sprite.width = CHARACTER_HEIGHT * aspectRatio
        
        spriteRef.current = sprite
        
        if (containerRef.current) {
          containerRef.current.removeChildren()
          containerRef.current.addChild(sprite)
        }
        
        setSpriteLoaded(true)
      } catch (error) {
        console.error('Failed to load sprite sheet:', error)
        // Fallback to loading individual frames if sprite sheet fails
        loadIndividualFrames()
      }
    }
    
    const loadIndividualFrames = async () => {
      try {
        // Clean up previous sprite if exists
        if (spriteRef.current) {
          spriteRef.current.destroy()
          spriteRef.current = null
        }
        
        // Load walking/idle frames
        const frameTextures = await Promise.all(
          spriteFrames.map(path => Assets.load(path))
        )
        
        // Load attack frames if they exist
        let attackTextures = []
        if (attackFrames && attackFrames.length > 0) {
          attackTextures = await Promise.all(
            attackFrames.map(path => Assets.load(path))
          )
        }

        // Load climb frames if they exist
        let climbTextures = []
        if (climbFrames && climbFrames.length > 0) {
          climbTextures = await Promise.all(
            climbFrames.map(path => Assets.load(path))
          )
        }
        
        if (!mounted) return
        
        animationFramesRef.current = frameTextures
        attackAnimationFramesRef.current = attackTextures.length > 0 ? attackTextures : frameTextures
        climbAnimationFramesRef.current = climbTextures.length > 0 ? climbTextures : frameTextures
        
        // Clear anchor refs (use default anchors)
        walkAnchorsRef.current = []
        attackAnchorsRef.current = []
        climbAnchorsRef.current = []
        
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
    
    // Use sprite sheet if available, otherwise load individual frames
    if (spriteSheetConfig) {
      loadSpriteSheet()
    } else {
      loadIndividualFrames()
    }
    
    return () => {
      mounted = false
      if (spriteRef.current) {
        spriteRef.current.destroy()
      }
    }
  }, [spriteSheetConfig, spriteFrames, attackFrames, climbFrames])

  // Helper to update sprite texture and anchor for a given frame
  const updateSpriteFrame = (frames, anchors, frameIndex) => {
    if (!spriteRef.current || frames.length === 0) return
    
    const idx = frameIndex % frames.length
    spriteRef.current.texture = frames[idx]
    
    // Update anchor if we have per-frame anchor data
    if (anchors && anchors.length > idx) {
      const anchor = anchors[idx]
      spriteRef.current.anchor.set(anchor.x, anchor.y)
    }
  }

  // Handle animation updates
  useEffect(() => {
    if (!spriteLoaded || !spriteRef.current || animationFramesRef.current.length === 0) {
      return
    }

    let animationFrameId
    
    lastTimeRef.current = Date.now()
    
    const animate = () => {
      const now = Date.now()
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now

      // Reset frame if starting to attack or climb
      if ((isAttacking && !prevAttackingRef.current) || (isClimbing && !prevClimbingRef.current)) {
        currentFrameRef.current = 0
        animationTimeRef.current = 0
      }
      prevAttackingRef.current = isAttacking
      prevClimbingRef.current = isClimbing

      if (isAttacking) {
        // Attack animation
        animationTimeRef.current += delta
        
        if (animationTimeRef.current >= ANIMATION_FRAME_DURATION) {
          animationTimeRef.current = 0
          const frames = attackAnimationFramesRef.current
          currentFrameRef.current = (currentFrameRef.current + 1) % frames.length
        }
        updateSpriteFrame(
          attackAnimationFramesRef.current,
          attackAnchorsRef.current,
          currentFrameRef.current
        )
      } else if (isClimbing) {
        // Climb animation
        animationTimeRef.current += delta
        
        if (animationTimeRef.current >= ANIMATION_FRAME_DURATION) {
          animationTimeRef.current = 0
          const frames = climbAnimationFramesRef.current
          currentFrameRef.current = (currentFrameRef.current + 1) % frames.length
        }
        // Clamp frame index if needed
        if (currentFrameRef.current >= climbAnimationFramesRef.current.length) {
          currentFrameRef.current = 0
        }
        updateSpriteFrame(
          climbAnimationFramesRef.current,
          climbAnchorsRef.current,
          currentFrameRef.current
        )
      } else if (isMoving) {
        // Move animation
        animationTimeRef.current += delta
        
        if (animationTimeRef.current >= ANIMATION_FRAME_DURATION) {
          animationTimeRef.current = 0
          currentFrameRef.current = (currentFrameRef.current + 1) % animationFramesRef.current.length
        }
        // Clamp frame index if needed
        if (currentFrameRef.current >= animationFramesRef.current.length) {
          currentFrameRef.current = 0
        }
        updateSpriteFrame(
          animationFramesRef.current,
          walkAnchorsRef.current,
          currentFrameRef.current
        )
      } else {
        // Idle - use first walk frame
        currentFrameRef.current = 0
        animationTimeRef.current = 0
        updateSpriteFrame(
          animationFramesRef.current,
          walkAnchorsRef.current,
          0
        )
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [spriteLoaded, isMoving, isClimbing, isAttacking])

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
