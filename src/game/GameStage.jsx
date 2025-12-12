import { Application, extend } from '@pixi/react'
import { Container, Graphics, Text, Sprite, Assets, Spritesheet } from 'pixi.js'
import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react'
import {
  BIOMES,
  getBiomeForDistance,
  drawTerrain,
  drawParticles,
  ENEMY_TYPES,
  drawHealthBar,
  drawTargetIndicator,
  drawPlatform,
  drawLadder,
  PLATFORM_STYLES,
  LADDER_STYLES,
  Character,
} from './components'
import { getCharacter } from './characters'
import { PhysicsEngine, PLATFORM_LEVELS } from './PhysicsEngine'
import { useGameLoop } from './useGameLoop'
// Persistence is now handled in App.jsx

// Extend PixiJS components for React
extend({ Container, Graphics, Text, Sprite })

// Game constants
const BASE_ATTACK_SPEED = 600
const ENEMY_SPAWN_RATE = 2500
const CLIMB_SPEED = 180
const MOVE_SPEED = 200
const JUMP_FORCE = 14
const PLATFORM_CHUNK_SIZE = 400
const PLATFORM_WIDTH_MIN = 150
const PLATFORM_WIDTH_MAX = 300
const ANIMATION_FRAME_DURATION = 100 // milliseconds per frame

const MAX_ENEMIES = 10
const CLEANUP_INTERVAL = 2000 // ms
const UNRENDER_DISTANCE = 2000 // px behind scrollOffset

// AI State Machine States
const AI_STATE = {
  MOVING_RIGHT: 'MOVING_RIGHT',      // No enemy - default patrol behavior
  MOVING_TO_ENEMY: 'MOVING_TO_ENEMY', // Has target, navigating to it
  ATTACKING_ENEMY: 'ATTACKING_ENEMY', // In range, attacking
}

// Helper: Find nearest enemy using weighted distance
function findNearestEnemy(enemies, playerPos) {
  const VERTICAL_WEIGHT = 5
  return enemies
    .filter(e => !e.dying)
    .sort((a, b) => {
      const distA = Math.abs(a.worldX - playerPos.x) + Math.abs(a.platformHeight - playerPos.y) * VERTICAL_WEIGHT
      const distB = Math.abs(b.worldX - playerPos.x) + Math.abs(b.platformHeight - playerPos.y) * VERTICAL_WEIGHT
      return distA - distB
    })[0] || null
}

// Helper: Check if player is in attack range of target
function isInAttackRange(playerPos, target, attackRange, isClimbing) {
  if (!target || isClimbing) return false
  
  const absDx = Math.abs(target.worldX - playerPos.x)
  const absDy = Math.abs(target.platformHeight - playerPos.y)
  const isSameLevel = absDy < 50
  
  return isSameLevel && absDx <= attackRange * 0.8
}

// Helper: Determine which platform level the player is currently on
function getPlayerCurrentLevel(playerY) {
  // Check which level the player is closest to
  const levels = [
    { key: 'ground', height: PLATFORM_LEVELS.ground },
    { key: 'level1', height: PLATFORM_LEVELS.level1 },
    { key: 'level2', height: PLATFORM_LEVELS.level2 },
    { key: 'level3', height: PLATFORM_LEVELS.level3 },
  ]
  
  let closest = levels[0]
  let closestDist = Math.abs(playerY - levels[0].height)
  
  for (const level of levels) {
    const dist = Math.abs(playerY - level.height)
    if (dist < closestDist) {
      closestDist = dist
      closest = level
    }
  }
  
  return closest.key
}

// Helper: Find a ladder that connects to the target's platform
function findLadderToTarget(playerPos, target, ladders) {
  const targetPlatformId = target.platformId
  const targetLevel = target.platformLevel
  const playerLevel = getPlayerCurrentLevel(playerPos.y)
  const needToGoUp = target.platformHeight > playerPos.y
  
  // First priority: Find a ladder that directly connects to the target's platform
  const directLadders = ladders.filter(l => {
    // Check if player can access this ladder from current position
    const isAccessible = playerPos.y >= l.bottomHeight - 10 && playerPos.y <= l.topHeight + 10
    if (!isAccessible) return false
    
    if (needToGoUp) {
      // Going up: ladder's top should connect to target platform
      // Either by exact platform ID match, or by level match if platformId is unknown
      if (targetPlatformId !== null) {
        return l.topPlatformId === targetPlatformId
      } else if (targetLevel === 'ground') {
        // Target is on ground, shouldn't need to go up
        return false
      } else {
        // Match by level
        return l.topLevel === targetLevel
      }
    } else {
      // Going down: ladder's bottom should connect to target platform
      if (targetPlatformId !== null) {
        return l.bottomPlatformId === targetPlatformId
      } else if (targetLevel === 'ground') {
        // Target is on ground
        return l.bottomLevel === 'ground'
      } else {
        return l.bottomLevel === targetLevel
      }
    }
  })
  
  if (directLadders.length > 0) {
    // Return the closest direct ladder
    return directLadders.sort((a, b) => 
      Math.abs(a.worldX - playerPos.x) - Math.abs(b.worldX - playerPos.x)
    )[0]
  }
  
  // Second priority: Find a ladder that gets us closer to the target level
  // This handles multi-level traversal (e.g., ground -> level1 -> level2 -> level3)
  const levelOrder = ['ground', 'level1', 'level2', 'level3']
  const playerLevelIndex = levelOrder.indexOf(playerLevel)
  const targetLevelIndex = levelOrder.indexOf(targetLevel)
  
  if (playerLevelIndex === -1 || targetLevelIndex === -1) {
    return null // Unknown levels
  }
  
  const progressLadders = ladders.filter(l => {
    const isAccessible = playerPos.y >= l.bottomHeight - 10 && playerPos.y <= l.topHeight + 10
    if (!isAccessible) return false
    
    const ladderTopIndex = levelOrder.indexOf(l.topLevel)
    const ladderBottomIndex = levelOrder.indexOf(l.bottomLevel)
    
    if (needToGoUp) {
      // Check if this ladder takes us up and gets us closer to target
      // We want: ladder top level > player level AND ladder top level <= target level
      return ladderTopIndex > playerLevelIndex && ladderTopIndex <= targetLevelIndex
    } else {
      // Check if this ladder takes us down and gets us closer to target
      // We want: ladder bottom level < player level AND ladder bottom level >= target level
      return ladderBottomIndex < playerLevelIndex && ladderBottomIndex >= targetLevelIndex
    }
  })
  
  if (progressLadders.length > 0) {
    // Return the closest progress ladder
    return progressLadders.sort((a, b) => 
      Math.abs(a.worldX - playerPos.x) - Math.abs(b.worldX - playerPos.x)
    )[0]
  }
  
  return null
}

// Helper: Compute navigation keys to reach a target
function computeNavigationKeys(playerPos, target, isClimbing, ladders) {
  const keys = { left: false, right: false, up: false, down: false, attack: false }
  
  const dx = target.worldX - playerPos.x
  const dy = target.platformHeight - playerPos.y
  const absDy = Math.abs(dy)
  
  // Determine if we're on the same level
  const isSameLevel = isClimbing
    ? (absDy < 5 && playerPos.y >= target.platformHeight - 2)
    : (absDy < 50)
  
  if (isSameLevel) {
    // Same level - move horizontally towards enemy (this will also dismount if climbing)
    if (dx > 0) keys.right = true
    else keys.left = true
  } else {
    // Different level - need vertical navigation
    if (isClimbing) {
      // Already on ladder - climb towards target level
      if (dy > 0) keys.up = true
      else keys.down = true
    } else {
      // Find a ladder that actually connects to the target's platform (or gets us closer)
      const usefulLadder = findLadderToTarget(playerPos, target, ladders)

      if (usefulLadder) {
        const ladderDx = usefulLadder.worldX - playerPos.x
        if (Math.abs(ladderDx) < 10) {
          // At ladder - start climbing
          if (dy > 0) keys.up = true
          else keys.down = true
        } else {
          // Move to ladder
          if (ladderDx > 0) keys.right = true
          else keys.left = true
        }
      } else {
        // No useful ladder found - fallback to horizontal movement towards enemy
        // This might happen if the enemy is on a platform we can't reach from here
        if (dx > 0) keys.right = true
        else keys.left = true
      }
    }
  }
  
  return keys
}

// AI Finite State Machine - takes previous state and returns next state + key overrides
function computeAIState({ prevState, enemies, playerPos, attackRange, isClimbing, ladders }) {
  const { state: currentState, targetId } = prevState
  
  // Try to find our locked target (if any)
  const lockedTarget = targetId ? enemies.find(e => e.id === targetId && !e.dying) : null
  
  // State machine transitions
  switch (currentState) {
    case AI_STATE.MOVING_RIGHT: {
      // Look for an enemy to target
      const nearestEnemy = findNearestEnemy(enemies, playerPos)
      
      if (nearestEnemy) {
        // Enemy detected - lock on and transition to MOVING_TO_ENEMY
        return {
          state: AI_STATE.MOVING_TO_ENEMY,
          targetId: nearestEnemy.id,
          keys: computeNavigationKeys(playerPos, nearestEnemy, isClimbing, ladders),
        }
      }
      
      // No enemy - keep moving right
      return {
        state: AI_STATE.MOVING_RIGHT,
        targetId: null,
        keys: { left: false, right: true, up: false, down: false, attack: false },
      }
    }
    
    case AI_STATE.MOVING_TO_ENEMY: {
      // Check if our target is still alive
      if (!lockedTarget) {
        // Target died - go back to patrol
        return {
          state: AI_STATE.MOVING_RIGHT,
          targetId: null,
          keys: { left: false, right: true, up: false, down: false, attack: false },
        }
      }
      
      // Check if we're in attack range
      if (isInAttackRange(playerPos, lockedTarget, attackRange, isClimbing)) {
        // In range - transition to attacking
        return {
          state: AI_STATE.ATTACKING_ENEMY,
          targetId: lockedTarget.id,
          keys: { left: false, right: false, up: false, down: false, attack: true },
        }
      }
      
      // Keep navigating to target
      return {
        state: AI_STATE.MOVING_TO_ENEMY,
        targetId: lockedTarget.id,
        keys: computeNavigationKeys(playerPos, lockedTarget, isClimbing, ladders),
      }
    }
    
    case AI_STATE.ATTACKING_ENEMY: {
      // Check if our target is still alive
      if (!lockedTarget) {
        // Target died - go back to patrol
        return {
          state: AI_STATE.MOVING_RIGHT,
          targetId: null,
          keys: { left: false, right: true, up: false, down: false, attack: false },
        }
      }
      
      // Check if target moved out of range
      if (!isInAttackRange(playerPos, lockedTarget, attackRange, isClimbing)) {
        // Out of range - go back to chasing same target
        return {
          state: AI_STATE.MOVING_TO_ENEMY,
          targetId: lockedTarget.id,
          keys: computeNavigationKeys(playerPos, lockedTarget, isClimbing, ladders),
        }
      }
      
      // Keep attacking
      return {
        state: AI_STATE.ATTACKING_ENEMY,
        targetId: lockedTarget.id,
        keys: { left: false, right: false, up: false, down: false, attack: true },
      }
    }
    
    default:
      // Unknown state - reset to patrol
      return {
        state: AI_STATE.MOVING_RIGHT,
        targetId: null,
        keys: { left: false, right: true, up: false, down: false, attack: false },
      }
  }
}

// XP calculation
const xpForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1))

// ID generator
let idCounter = 0
const generateId = () => ++idCounter

// Seeded random
const seededRandom = (seed) => {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

// Game content component (inside Application)
function GameContent({ width, height, onStatsUpdate, onKill, onDistanceUpdate, selectedCharacter, autoAttackEnabled, setAutoAttackEnabled, onAIStateChange, character, setCharacter, initialPlayerPos }) {
  // Physics engine
  const physicsRef = useRef(null)
  
  // Graphics refs
  const terrainRef = useRef(null)
  const particlesRef = useRef(null)

  // Game state
  const [playerPos, setPlayerPos] = useState(initialPlayerPos || { x: 200, y: 0 })
  const [facingRight, setFacingRight] = useState(true)
  const [isAttacking, setIsAttacking] = useState(false)
  const [isClimbing, setIsClimbing] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  
  // World objects
  const [platforms, setPlatforms] = useState([])
  const [ladders, setLadders] = useState([])
  const [enemies, setEnemies] = useState([])
  const [damageNumbers, setDamageNumbers] = useState([])
  const [goldPickups, setGoldPickups] = useState([])
  
  // Enemy sprites cache
  const enemySpritesRef = useRef(new Map())
  
  // Refs for timing
  const keysPressed = useRef({ up: false, down: false, left: false, right: false, jump: false, attack: false })
  const jumpRequestedRef = useRef(false) // Persists until consumed by game loop
  const jumpCooldownRef = useRef(0)
  const lastPlatformChunkRef = useRef(0)
  const lastAttackRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const lastCleanupRef = useRef(0)
  const attackTimeoutRef = useRef(null)
  
  // AI State Machine state (persisted between frames)
  const aiStateRef = useRef({ state: AI_STATE.MOVING_RIGHT, targetId: null })
  const wasAutoAttackEnabledRef = useRef(false)
  
  // Track AI target for rendering indicator
  const [aiTargetId, setAiTargetId] = useState(null)
  
  // Initialize physics
  useEffect(() => {
    physicsRef.current = new PhysicsEngine()
    physicsRef.current.createPlayer(playerPos.x, playerPos.y)
    
    return () => {
      physicsRef.current?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Load enemy sprite frames from ENEMY_TYPES definitions
  useEffect(() => {
    const loadEnemySprites = async () => {
      try {
        // Track loaded spritesheets to avoid duplicate loading
        const loadedSheets = new Map()
        
        // Load sprites for each enemy type
        for (const [typeKey, enemyType] of Object.entries(ENEMY_TYPES)) {
          // Handle sprite sheet format (JSON + PNG)
          if (enemyType.spriteSheet) {
            const { json, image, animation } = enemyType.spriteSheet
            const sheetKey = json
            
            let spritesheet = loadedSheets.get(sheetKey)
            
            if (!spritesheet) {
              // Load the sprite sheet JSON
              const response = await fetch(json)
              const atlasData = await response.json()
              
              // Load the base texture (the PNG image)
              const baseTexture = await Assets.load(image)
              
              // Create the spritesheet
              spritesheet = new Spritesheet(baseTexture, atlasData)
              await spritesheet.parse()
              
              loadedSheets.set(sheetKey, spritesheet)
            }
            
            // Get the animation frames
            const frameTextures = spritesheet.animations[animation] || []
            if (frameTextures.length > 0) {
              enemySpritesRef.current.set(typeKey, frameTextures)
            }
          }
          // Handle individual frame files (legacy format)
          else if (enemyType.spriteFrames && enemyType.spriteFrames.length > 0) {
            const frameTextures = await Promise.all(
              enemyType.spriteFrames.map(path => Assets.load(path))
            )
            enemySpritesRef.current.set(typeKey, frameTextures)
          }
        }
      } catch (error) {
        console.error('Failed to load enemy sprites:', error)
      }
    }
    
    loadEnemySprites()
  }, [])
  
  // Update parent with player position for persistence
  useEffect(() => {
    onStatsUpdate?.({ playerPos })
  }, [playerPos, onStatsUpdate])
  
  // Update distance
  useEffect(() => {
    onDistanceUpdate?.(playerPos.x)
  }, [playerPos.x, onDistanceUpdate])
  
  // Calculate camera offset
  const characterScreenX = width * 0.3
  const scrollOffset = Math.max(0, playerPos.x - characterScreenX)
  const currentBiome = getBiomeForDistance(playerPos.x)
  const biome = BIOMES[currentBiome] || BIOMES.darkForest
  
  // Get character stats
  const characterDef = useMemo(() => getCharacter(selectedCharacter), [selectedCharacter])
  const attackRange = characterDef.stats.attackRange || 100

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysPressed.current.up = true
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysPressed.current.down = true
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysPressed.current.left = true
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysPressed.current.right = true
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault() // Prevent page scroll
        keysPressed.current.jump = true
        jumpRequestedRef.current = true // Persists until consumed
      }
      if (e.key === 'z' || e.key === 'Z') keysPressed.current.attack = true
      // Toggle Auto-Attack with 'R'
      if (e.key === 'r' || e.key === 'R') {
        setAutoAttackEnabled(prev => !prev)
      }
    }
    
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysPressed.current.up = false
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysPressed.current.down = false
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysPressed.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysPressed.current.right = false
      if (e.key === ' ' || e.key === 'Spacebar') keysPressed.current.jump = false
      if (e.key === 'z' || e.key === 'Z') keysPressed.current.attack = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setAutoAttackEnabled])
  
  // Generate platforms and ladders
  const generatePlatformsAndLadders = useCallback((viewEnd) => {
    const physics = physicsRef.current
    if (!physics) return
    
    const startChunk = Math.floor(lastPlatformChunkRef.current / PLATFORM_CHUNK_SIZE)
    const endChunk = Math.floor((viewEnd + 600) / PLATFORM_CHUNK_SIZE)
    
    const newPlatforms = []
    const newLadders = []
    
    for (let chunk = startChunk; chunk <= endChunk; chunk++) {
      const chunkStart = chunk * PLATFORM_CHUNK_SIZE
      if (chunkStart <= lastPlatformChunkRef.current) continue
      
      const levels = ['level1', 'level2', 'level3']
      const chunkPlatforms = { ground: true } // Ground is always accessible
      
      // First pass: generate platforms for this chunk
      levels.forEach((levelKey, levelIndex) => {
        const probability = 0.7 - (levelIndex * 0.15)
        
        if (seededRandom(chunk * 17 + levelIndex * 31) < probability) {
          const platformWidth = PLATFORM_WIDTH_MIN + seededRandom(chunk * 23 + levelIndex * 41) * (PLATFORM_WIDTH_MAX - PLATFORM_WIDTH_MIN)
          const xOffset = seededRandom(chunk * 37 + levelIndex * 53) * (PLATFORM_CHUNK_SIZE - platformWidth)
          
          const platform = {
            id: generateId(),
            worldX: chunkStart + xOffset,
            height: PLATFORM_LEVELS[levelKey],
            width: platformWidth,
            level: levelKey,
          }
          newPlatforms.push(platform)
          physics.createPlatform(platform.id, platform.worldX, platform.height, platform.width)
          chunkPlatforms[levelKey] = platform
        }
      })
      
      // Second pass: generate ladders with proper connectivity
      // Track platform connectivity: which platform is at the top/bottom of each ladder
      levels.forEach((levelKey, levelIndex) => {
        const platform = chunkPlatforms[levelKey]
        if (!platform) return
        
        const lowerLevelKey = levelIndex === 0 ? 'ground' : levels[levelIndex - 1]
        const lowerPlatform = chunkPlatforms[lowerLevelKey]
        
        let ladderCreated = false
        
        // Try to connect to the immediate lower level
        if (lowerLevelKey === 'ground') {
          // Always connect level1 to ground
          const ladderX = platform.worldX + platform.width * (0.2 + seededRandom(chunk * 59 + levelIndex * 67) * 0.6)
          const ladder = {
            id: generateId(),
            worldX: ladderX,
            bottomHeight: PLATFORM_LEVELS['ground'],
            topHeight: PLATFORM_LEVELS[levelKey],
            // Platform connectivity for AI pathfinding
            topPlatformId: platform.id,
            bottomPlatformId: null, // null means ground
            topLevel: levelKey,
            bottomLevel: 'ground',
          }
          newLadders.push(ladder)
          physics.addLadder(ladder)
          ladderCreated = true
        } else if (lowerPlatform) {
          // Check for overlap with lower platform
          const overlapStart = Math.max(platform.worldX, lowerPlatform.worldX)
          const overlapEnd = Math.min(
            platform.worldX + platform.width,
            lowerPlatform.worldX + lowerPlatform.width
          )
          
          if (overlapEnd - overlapStart >= 40) {
            const overlapWidth = overlapEnd - overlapStart
            const ladderX = overlapStart + overlapWidth * (0.2 + seededRandom(chunk * 59 + levelIndex * 67) * 0.6)
            
            const ladder = {
              id: generateId(),
              worldX: ladderX,
              bottomHeight: PLATFORM_LEVELS[lowerLevelKey],
              topHeight: PLATFORM_LEVELS[levelKey],
              // Platform connectivity for AI pathfinding
              topPlatformId: platform.id,
              bottomPlatformId: lowerPlatform.id,
              topLevel: levelKey,
              bottomLevel: lowerLevelKey,
            }
            newLadders.push(ladder)
            physics.addLadder(ladder)
            ladderCreated = true
          }
        }
        
        // If we couldn't connect to the layer below (missing platform or no overlap),
        // we MUST connect to ground to ensure accessibility
        if (!ladderCreated) {
          const ladderX = platform.worldX + platform.width * (0.3 + seededRandom(chunk * 89 + levelIndex * 97) * 0.4)
          
          const ladder = {
            id: generateId(),
            worldX: ladderX,
            bottomHeight: PLATFORM_LEVELS['ground'],
            topHeight: PLATFORM_LEVELS[levelKey],
            // Platform connectivity for AI pathfinding
            topPlatformId: platform.id,
            bottomPlatformId: null, // null means ground
            topLevel: levelKey,
            bottomLevel: 'ground',
          }
          newLadders.push(ladder)
          physics.addLadder(ladder)
        }
      })
      
      lastPlatformChunkRef.current = chunkStart
    }
    
    if (newPlatforms.length > 0) {
      setPlatforms(prev => [...prev, ...newPlatforms])
    }
    if (newLadders.length > 0) {
      setLadders(prev => [...prev, ...newLadders])
    }
  }, [])
  
  // Spawn enemy
  const spawnEnemy = useCallback(() => {
    if (enemies.length >= MAX_ENEMIES) return

    const physics = physicsRef.current
    if (!physics) return
    
    const distanceProgress = Math.floor(playerPos.x / 1000)
    
    let availableTypes = ['wolf']
    if (distanceProgress >= 1) availableTypes.push('bear') // Bears spawn early in level1
    
    const typeKey = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    const type = ENEMY_TYPES[typeKey]
    
    const preferredLevel = type.preferredLevels[Math.floor(Math.random() * type.preferredLevels.length)]
    const platformHeight = PLATFORM_LEVELS[preferredLevel]
    
    const spawnFromRight = Math.random() > 0.3
    let spawnX = spawnFromRight ? scrollOffset + width + 100 : scrollOffset - 100
    
    let canSpawn = preferredLevel === 'ground'
    let spawnPlatformId = null // Track which platform the enemy is on (null = ground)
    
    if (!canSpawn) {
      const nearbyPlatform = platforms.find(p => 
        p.level === preferredLevel && 
        Math.abs(p.worldX + p.width / 2 - spawnX) < 400
      )
      
      if (nearbyPlatform) {
        canSpawn = true
        spawnPlatformId = nearbyPlatform.id
        // Spawn on the platform (random position within safe bounds)
        const margin = 20
        const minX = nearbyPlatform.worldX + margin
        const maxX = nearbyPlatform.worldX + nearbyPlatform.width - margin
        spawnX = minX + Math.random() * (maxX - minX)
      }
    }
    
    if (!canSpawn && preferredLevel !== 'ground') return
    
    const healthMultiplier = 1 + (distanceProgress * 0.2)
    
    const id = generateId()
    const newEnemy = {
      id,
      type: typeKey,
      ...type,
      health: Math.floor(type.baseHealth * healthMultiplier),
      maxHealth: Math.floor(type.baseHealth * healthMultiplier),
      worldX: spawnX,
      platformHeight,
      platformLevel: preferredLevel,
      platformId: spawnPlatformId, // Track platform for AI pathfinding
      hit: false,
      dying: false,
      patrolDirection: spawnFromRight ? -1 : 1,
      isPatrolling: preferredLevel !== 'ground',
      animationFrame: 0,
      animationTime: 0,
    }
    
    setEnemies(prev => [...prev, newEnemy])
  }, [playerPos.x, platforms, scrollOffset, width, enemies.length])
  
  // Attack enemy
  const attackEnemy = useCallback(() => {
    // Start attack animation immediately
    if (attackTimeoutRef.current) {
        clearTimeout(attackTimeoutRef.current)
    }
    setIsAttacking(true)
    attackTimeoutRef.current = setTimeout(() => setIsAttacking(false), 500)

    setEnemies(prev => {
      const inRange = prev.filter(e => {
        if (e.dying) return false
        
        const horizontalDist = facingRight 
          ? e.worldX - playerPos.x
          : playerPos.x - e.worldX
        
        if (horizontalDist > attackRange || horizontalDist < -50) return false
        
        const verticalDist = Math.abs(e.platformHeight - playerPos.y)
        if (verticalDist > 50) return false
        
        return true
      })
      
      if (inRange.length === 0) return prev
      
      // Calculate damage for all enemies in range
      const hits = inRange.map(target => {
        const isCrit = Math.random() < character.critChance
        const damage = Math.floor(character.baseDamage * (isCrit ? character.critMultiplier : 1))
        return { target, isCrit, damage }
      })
      
      setDamageNumbers(prev => [
        ...prev, 
        ...hits.map(({ target, isCrit, damage }) => ({
          id: generateId(),
          value: damage,
          worldX: target.worldX,
          y: target.platformHeight + (target.height || 60),
          isCrit,
          startTime: Date.now(),
        }))
      ])
      
      return prev.map(enemy => {
        const hit = hits.find(h => h.target.id === enemy.id)
        if (!hit) return enemy
        
        const { damage } = hit
        const newHealth = enemy.health - damage
        
        if (newHealth <= 0) {
          setTimeout(() => {
            const goldId = generateId()
            setGoldPickups(prev => [...prev, {
              id: goldId,
              value: enemy.goldReward,
              worldX: enemy.worldX,
              y: enemy.platformHeight + 50,
              startTime: Date.now(),
            }])
            
            setCharacter(prev => {
              let newXp = prev.xp + enemy.xpReward
              let newLevel = prev.level
              let newXpToNext = prev.xpToNext
              let newMaxHealth = prev.maxHealth
              let newBaseDamage = prev.baseDamage
              
              while (newXp >= newXpToNext) {
                newXp -= newXpToNext
                newLevel++
                newXpToNext = xpForLevel(newLevel)
                newMaxHealth = Math.floor(100 * Math.pow(1.1, newLevel - 1))
                newBaseDamage = Math.floor(10 * Math.pow(1.08, newLevel - 1))
              }
              
              return {
                ...prev,
                xp: newXp,
                level: newLevel,
                xpToNext: newXpToNext,
                maxHealth: newMaxHealth,
                health: newLevel > prev.level ? newMaxHealth : prev.health,
                baseDamage: newBaseDamage,
                gold: prev.gold + enemy.goldReward,
              }
            })
            
            onKill?.()
            
            setTimeout(() => {
              setEnemies(prev => prev.filter(e => e.id !== enemy.id))
            }, 500)
          }, 200)
          
          return { ...enemy, health: 0, hit: true, dying: true }
        }
        
        return { ...enemy, health: newHealth, hit: true }
      })
    })
  }, [character.baseDamage, character.critChance, character.critMultiplier, playerPos, facingRight, onKill, attackRange, setCharacter])
  
  // Convert world to screen coordinates
  const worldToScreen = useCallback((worldX, worldY) => ({
    x: worldX - scrollOffset,
    y: height - 100 - worldY,
  }), [scrollOffset, height])
  
  // Main game loop
  const gameUpdate = useCallback((delta) => {
    const physics = physicsRef.current
    if (!physics) return
    
    const now = Date.now()
    
    // Periodic cleanup of off-screen entities
    if (now - lastCleanupRef.current > CLEANUP_INTERVAL) {
      lastCleanupRef.current = now
      
      const unrenderLimit = scrollOffset - UNRENDER_DISTANCE
      
      // Cleanup platforms
      setPlatforms(prev => {
        const toRemove = prev.filter(p => p.worldX < unrenderLimit)
        if (toRemove.length > 0) {
          toRemove.forEach(p => physics.removePlatform(p.id))
          return prev.filter(p => p.worldX >= unrenderLimit)
        }
        return prev
      })

      // Cleanup ladders
      setLadders(prev => {
        const toRemove = prev.filter(l => l.worldX < unrenderLimit)
        if (toRemove.length > 0) {
          toRemove.forEach(l => physics.removeLadder(l.id))
          return prev.filter(l => l.worldX >= unrenderLimit)
        }
        return prev
      })
    }
    
    // Generate world
    generatePlatformsAndLadders(playerPos.x + width)
    
    // Get current physics position (playerPos state may be stale)
    const currentPos = physics.getPlayerPosition()
    const currentPlayerX = currentPos.x
    const currentPlayerY = Math.max(0, currentPos.y)
    
    // Check nearby ladder using fresh physics position
    const nearbyLadders = physics.getNearbyLadders(currentPlayerX, currentPlayerY)
    
    // Copy keysPressed to a local mutable object so we can override it for Auto-Attack
    const currentKeys = { ...keysPressed.current }

    // Auto-Attack AI State Machine
    if (autoAttackEnabled) {
      const justEnabled = !wasAutoAttackEnabledRef.current
      wasAutoAttackEnabledRef.current = true
      
      const aiResult = computeAIState({
        prevState: aiStateRef.current,
        enemies,
        playerPos,
        attackRange,
        isClimbing,
        ladders,
      })
      
      // Update AI state ref
      const prevStateName = aiStateRef.current.state
      const prevTargetId = aiStateRef.current.targetId
      aiStateRef.current = { state: aiResult.state, targetId: aiResult.targetId }
      
      // Update target ID for rendering (only when changed to avoid re-renders)
      if (aiResult.targetId !== prevTargetId) {
        setAiTargetId(aiResult.targetId)
      }
      
      // Notify parent of state changes (or on first enable)
      if ((justEnabled || aiResult.state !== prevStateName) && onAIStateChange) {
        onAIStateChange(aiResult.state)
      }

      // Ensure we face the target when attacking (even if standing still)
      if (aiResult.state === AI_STATE.ATTACKING_ENEMY && aiResult.targetId) {
        const target = enemies.find(e => e.id === aiResult.targetId)
        if (target) {
          const shouldFaceRight = target.worldX > playerPos.x
          if (shouldFaceRight !== facingRight) {
            setFacingRight(shouldFaceRight)
          }
        }
      }
      
      // Apply AI key overrides
      Object.assign(currentKeys, aiResult.keys)
    } else {
      // Reset AI state when auto-attack is disabled
      wasAutoAttackEnabledRef.current = false
      if (aiStateRef.current.state !== AI_STATE.MOVING_RIGHT || aiStateRef.current.targetId !== null) {
        aiStateRef.current = { state: AI_STATE.MOVING_RIGHT, targetId: null }
        setAiTargetId(null)
      }
      if (onAIStateChange) {
        onAIStateChange(null)
      }
    }

    // Handle movement
    let moving = false
    const isGrounded = physics.isPlayerGrounded()
    
    // Handle jumping
    if (jumpCooldownRef.current > 0) {
      jumpCooldownRef.current -= delta
    }
    
    // Check for jump request (persists until consumed, unlike keysPressed which resets on keyup)
    const wantsToJump = jumpRequestedRef.current || currentKeys.jump
    
    if (wantsToJump && jumpCooldownRef.current <= 0) {
      jumpRequestedRef.current = false // Consume the jump request
      
      if (isClimbing) {
        // Jump off ladder
        setIsClimbing(false)
        physics.setPlayerClimbing(false)
        physics.jumpPlayer(JUMP_FORCE * 0.8) // Slightly weaker jump from ladder
        jumpCooldownRef.current = 200 // Cooldown to prevent double-jump
      } else if (isGrounded) {
        // Normal jump from ground
        physics.jumpPlayer(JUMP_FORCE)
        jumpCooldownRef.current = 200
      }
    }
    
    // Horizontal movement (allowed while climbing if you want to dismount)
    if (currentKeys.left) {
      if (isClimbing && nearbyLadders.length > 0 && !currentKeys.up && !currentKeys.down) {
        // Dismount ladder to the left
        setIsClimbing(false)
        physics.setPlayerClimbing(false)
      }
      physics.movePlayer(-MOVE_SPEED * delta / 1000, 0)
      setFacingRight(false)
      moving = true
    }
    if (currentKeys.right) {
      if (isClimbing && nearbyLadders.length > 0 && !currentKeys.up && !currentKeys.down) {
        // Dismount ladder to the right
        setIsClimbing(false)
        physics.setPlayerClimbing(false)
      }
      physics.movePlayer(MOVE_SPEED * delta / 1000, 0)
      setFacingRight(true)
      moving = true
    }
    
    // Climbing
    if ((currentKeys.up || currentKeys.down) && !currentKeys.jump) {
      // Find the best ladder for the intended direction
      let targetLadder = null
      
      if (isClimbing) {
         // If we are already climbing, we should verify if we are still on a valid ladder
         // (though usually we stick to one, but at junctions we might switch)
         // For simplicity, we can re-evaluate nearby ladders or stick to the current one if valid
         // But we don't track 'currentLadderId'. Rely on geometry.
      }

      if (nearbyLadders.length > 0 && !physics.isPlayerJumping()) {
        if (currentKeys.up) {
          // Find a ladder where we are NOT at the top
          // Use generous tolerance to handle physics imprecision at platform boundaries
          targetLadder = nearbyLadders.find(l => currentPlayerY < l.topHeight - 1)
        } else if (currentKeys.down) {
          // Find a ladder where we are NOT at the bottom
          // Use generous tolerance to handle physics imprecision at platform boundaries
          targetLadder = nearbyLadders.find(l => currentPlayerY > l.bottomHeight + 1)
        }
        
        // If we are already climbing and blocked in the requested direction, 
        // we might want to default to *any* ladder to handle the "stop at top/bottom" logic
        // or dismount logic.
        if (!targetLadder && isClimbing) {
           targetLadder = nearbyLadders[0]
        }
      }
      
      const activeLadder = targetLadder

      if (activeLadder && !physics.isPlayerJumping()) {
        let canClimb = isClimbing
        
        if (!isClimbing) {
          // Check start conditions to prevent immediate dismount/flicker
          // Use small tolerance (2px) to only block when truly at the end
          const atTop = currentPlayerY >= activeLadder.topHeight - 2
          const atBottom = currentPlayerY <= activeLadder.bottomHeight + 2
          
          const validEntry = (currentKeys.up && !atTop) || (currentKeys.down && !atBottom)
          
          if (validEntry) {
            setIsClimbing(true)
            physics.setPlayerClimbing(true)
            physics.snapToLadder(activeLadder.worldX)
            canClimb = true
          }
        }
        
        if (canClimb) {
          if (currentKeys.up) {
            const targetY = currentPlayerY + (CLIMB_SPEED * delta) / 1000
            const newY = Math.min(activeLadder.topHeight, targetY)
            physics.climbPlayer((newY - currentPlayerY))
            moving = true
            
            // Auto-dismount when reaching the top of the ladder
            if (newY >= activeLadder.topHeight - 1) {
              setIsClimbing(false)
              physics.setPlayerClimbing(false)
            }
          } else if (currentKeys.down) {
            const targetY = currentPlayerY - (CLIMB_SPEED * delta) / 1000
            const newY = Math.max(activeLadder.bottomHeight, targetY)
            physics.climbPlayer((newY - currentPlayerY))
            moving = true
            
            // Auto-dismount when reaching the bottom of the ladder
            if (newY <= activeLadder.bottomHeight + 1) {
              setIsClimbing(false)
              physics.setPlayerClimbing(false)
            }
          }
        }
      }
    } else if (!currentKeys.up && !currentKeys.down && isClimbing && !currentKeys.left && !currentKeys.right) {
      // Keep climbing state if not pressing any direction
    }
    
    // Reset climbing if landed on ground
    if (isClimbing && isGrounded && nearbyLadders.length === 0) {
      setIsClimbing(false)
      physics.setPlayerClimbing(false)
    }
    
    setIsMoving(moving)
    
    // Update physics
    physics.update(delta)
    physics.updateGroundPosition(playerPos.x)
    
    // Get player position from physics
    const pos = physics.getPlayerPosition()
    setPlayerPos({ x: pos.x, y: Math.max(0, pos.y) })
    
    // Update enemies
    setEnemies(prev => prev.map(enemy => {
      if (enemy.dying) return enemy
      
      let newWorldX = enemy.worldX
      let newAnimationTime = enemy.animationTime || 0
      let newAnimationFrame = enemy.animationFrame || 0
      let newPatrolDirection = enemy.patrolDirection
      
      if (enemy.isPatrolling && enemy.platformLevel !== 'ground') {
        const currentPlatform = platforms.find(p => 
          p.level === enemy.platformLevel &&
          enemy.worldX >= p.worldX - 20 &&
          enemy.worldX <= p.worldX + p.width + 20
        )
        
        if (currentPlatform) {
          const moveSpeed = enemy.speed * 0.5
          newWorldX = enemy.worldX + (enemy.patrolDirection * moveSpeed * delta) / 1000
          
          if (newWorldX < currentPlatform.worldX + 20) {
            newPatrolDirection = 1
            newWorldX = currentPlatform.worldX + 20
          } else if (newWorldX > currentPlatform.worldX + currentPlatform.width - 60) {
            newPatrolDirection = -1
            newWorldX = currentPlatform.worldX + currentPlatform.width - 60
          }
          
          // Update animation
          newAnimationTime += delta
          if (newAnimationTime >= ANIMATION_FRAME_DURATION) {
            newAnimationTime = 0
            newAnimationFrame = (newAnimationFrame + 1) % 5
          }
        } else {
          // Platform lost - fall to ground
          return {
            ...enemy,
            isPatrolling: false,
            platformLevel: 'ground',
            platformHeight: 0,
          }
        }
      } else {
        // Chase player with gradual movement and rubber banding
        const distanceToPlayer = playerPos.x - enemy.worldX
        const absDistance = Math.abs(distanceToPlayer)
        
        // Stop distance - enemies stop when they're close enough (prevents jitter)
        const stopDistance = 30
        // Slow-down zone - enemies start slowing down in this range
        const slowDownDistance = 80
        
        if (absDistance > stopDistance) {
          const dirToPlayer = distanceToPlayer > 0 ? 1 : -1
          newPatrolDirection = dirToPlayer
          
          // Calculate speed with gradual slow-down (rubber band effect)
          let speedMultiplier = 1.0
          if (absDistance < slowDownDistance) {
            // Ease out as we approach - creates smooth deceleration
            const t = (absDistance - stopDistance) / (slowDownDistance - stopDistance)
            speedMultiplier = t * t // Quadratic ease-out for smoother approach
          }
          
          // Apply movement with interpolation for smoother motion
          const targetMove = (dirToPlayer * enemy.speed * speedMultiplier * delta) / 1000
          // Lerp factor for additional smoothing (0.7 = 70% toward target each frame)
          const lerpFactor = 0.7
          const smoothedMove = targetMove * lerpFactor
          
          newWorldX = enemy.worldX + smoothedMove
        }
        // If within stopDistance, enemy stays in place (no jitter)
        
        // Update animation only when moving
        if (absDistance > stopDistance) {
          newAnimationTime += delta
          if (newAnimationTime >= ANIMATION_FRAME_DURATION) {
            newAnimationTime = 0
            newAnimationFrame = (newAnimationFrame + 1) % 5
          }
        }
      }
      
      return { 
        ...enemy, 
        worldX: newWorldX, 
        hit: false,
        patrolDirection: newPatrolDirection,
        animationTime: newAnimationTime,
        animationFrame: newAnimationFrame,
      }
    }).filter(enemy => Math.abs(enemy.worldX - playerPos.x) < width * 2))
    
    // Spawn enemies
    if (now - lastSpawnRef.current > ENEMY_SPAWN_RATE) {
      lastSpawnRef.current = now
      spawnEnemy()
    }
    
    // Manual attack (or Auto-Attack)
    if (currentKeys.attack && now - lastAttackRef.current > character.attackSpeed) {
      lastAttackRef.current = now
      attackEnemy()
    }
    
    // Update damage numbers
    setDamageNumbers(prev => prev.filter(d => now - d.startTime < 1000))
    setGoldPickups(prev => prev.filter(g => now - g.startTime < 800))
    
    // Update graphics
    if (terrainRef.current) {
      drawTerrain(terrainRef.current, width, height, scrollOffset, currentBiome)
    }
    if (particlesRef.current) {
      drawParticles(particlesRef.current, width, height, scrollOffset, currentBiome)
    }
    // Character sprite is now managed via ref, no drawing needed
    
  }, [playerPos, isClimbing, facingRight, platforms, generatePlatformsAndLadders, spawnEnemy, attackEnemy, character.attackSpeed, width, height, scrollOffset, currentBiome, autoAttackEnabled, enemies, ladders, attackRange, onAIStateChange])
  
  useGameLoop(gameUpdate)
  
  const playerScreen = worldToScreen(playerPos.x, playerPos.y)
  
  return (
    <>
      {/* Terrain background */}
      <pixiGraphics ref={terrainRef} />
      
      {/* Ambient particles */}
      <pixiGraphics ref={particlesRef} />
      
      {/* Ladders - positioned by topHeight since drawLadder draws downward from y=0 */}
      {ladders.map(ladder => {
        const screenPos = worldToScreen(ladder.worldX, ladder.topHeight)
        if (screenPos.x < -100 || screenPos.x > width + 100) return null
        
        return (
          <pixiGraphics
            key={`ladder-${ladder.id}`}
            x={screenPos.x}
            y={screenPos.y}
            draw={(g) => drawLadder(g, ladder.topHeight - ladder.bottomHeight, biome.ladderStyle)}
          />
        )
      })}
      
      {/* Platforms */}
      {platforms.map(platform => {
        const screenPos = worldToScreen(platform.worldX, platform.height)
        if (screenPos.x < -300 || screenPos.x > width + 100) return null
        
        return (
          <pixiGraphics
            key={`platform-${platform.id}`}
            x={screenPos.x}
            y={screenPos.y}
            draw={(g) => drawPlatform(g, platform.width, 20, biome.platformStyle)}
          />
        )
      })}
      
      {/* Enemies */}
      {enemies.map(enemy => {
        const screenPos = worldToScreen(enemy.worldX, enemy.platformHeight)
        if (screenPos.x < -100 || screenPos.x > width + 100) return null
        
        const enemyHeight = ENEMY_TYPES[enemy.type].height
        const enemyWidth = ENEMY_TYPES[enemy.type].width
        // Bats hover above ground, other enemies need offset to align base with platform surface
        const yOffset = enemy.type === 'bat' ? -enemyHeight * 0.3 : 0
        
        // Get sprite frames for this enemy type
        const enemyFrames = enemySpritesRef.current.get(enemy.type)
        const currentFrame = enemy.animationFrame || 0
        
        // Check if this enemy is the current AI target
        const isTargeted = aiTargetId === enemy.id && autoAttackEnabled
        
        return (
          <pixiContainer key={`enemy-${enemy.id}`} x={screenPos.x} y={screenPos.y + yOffset} scale={{ x: enemy.patrolDirection === 1 ? 1 : -1, y: 1 }}>
            {/* Target indicator for auto-attack (rendered behind enemy) */}
            {isTargeted && (
              <pixiGraphics 
                scale={{ x: enemy.patrolDirection === 1 ? 1 : -1, y: 1 }}
                draw={(g) => drawTargetIndicator(g, enemyWidth, enemyHeight)} 
              />
            )}
            {/* Render enemy sprite */}
            {enemyFrames && enemyFrames[currentFrame] && (
              <pixiSprite
                texture={enemyFrames[currentFrame]}
                anchor={{ x: 0.5, y: 1 }}
                width={enemyWidth}
                height={enemyHeight}
                alpha={enemy.dying ? 0.5 : (enemy.hit ? 0.8 : 1)}
              />
            )}
            <pixiGraphics y={-enemyHeight - 15} scale={{ x: enemy.patrolDirection === 1 ? 1 : -1, y: 1 }} draw={(g) => drawHealthBar(g, enemy.health, enemy.maxHealth)} />
          </pixiContainer>
        )
      })}
      


      {/* Player character */}
      <Character
        x={playerScreen.x}
        y={playerScreen.y}
        facingRight={facingRight}
        isMoving={isMoving}
        isClimbing={isClimbing}
        isAttacking={isAttacking}
        showClimbingControls={isClimbing}
        characterType={selectedCharacter}
      />
      
      {/* Damage numbers */}
      {damageNumbers.map(dmg => {
        const screenPos = worldToScreen(dmg.worldX, dmg.y)
        const age = (Date.now() - dmg.startTime) / 1000
        const animatedY = screenPos.y - age * 50
        
        return (
          <pixiText
            key={`dmg-${dmg.id}`}
            text={dmg.isCrit ? `${dmg.value}!` : `${dmg.value}`}
            x={screenPos.x}
            y={animatedY}
            anchor={0.5}
            alpha={Math.max(0, 1 - age)}
            style={{
              fill: dmg.isCrit ? 0xffdd44 : 0xffffff,
              fontSize: dmg.isCrit ? 28 : 22,
              fontWeight: 'bold',
              stroke: { color: 0x000000, width: 4 },
            }}
          />
        )
      })}
      
      {/* Gold pickups */}
      {goldPickups.map(gold => {
        const screenPos = worldToScreen(gold.worldX, gold.y)
        const age = (Date.now() - gold.startTime) / 800
        const animatedY = screenPos.y - age * 40
        
        return (
          <pixiText
            key={`gold-${gold.id}`}
            text={`+${gold.value} 🪙`}
            x={screenPos.x}
            y={animatedY}
            anchor={0.5}
            alpha={Math.max(0, 1 - age)}
            style={{
              fill: 0xffd700,
              fontSize: 18,
              fontWeight: 'bold',
              stroke: { color: 0x000000, width: 3 },
            }}
          />
        )
      })}
    </>
  )
}

// Main GameStage component
export const GameStage = memo(function GameStage({
  width,
  height,
  onStatsUpdate,
  onKill,
  onDistanceUpdate,
  selectedCharacter,
  autoAttackEnabled,
  setAutoAttackEnabled,
  onAIStateChange,
  character,
  setCharacter,
  initialPlayerPos,
}) {
  return (
    <Application
      resizeTo={typeof window !== 'undefined' ? window : undefined}
      backgroundColor={0x0a0a0f}
      antialias={true}
    >
      <GameContent
        width={width}
        height={height}
        onStatsUpdate={onStatsUpdate}
        onKill={onKill}
        onDistanceUpdate={onDistanceUpdate}
        selectedCharacter={selectedCharacter}
        autoAttackEnabled={autoAttackEnabled}
        setAutoAttackEnabled={setAutoAttackEnabled}
        onAIStateChange={onAIStateChange}
        character={character}
        setCharacter={setCharacter}
        initialPlayerPos={initialPlayerPos}
      />
    </Application>
  )
})

export default GameStage
