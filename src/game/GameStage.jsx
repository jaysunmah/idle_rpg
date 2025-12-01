import { Application, extend, useApplication } from '@pixi/react'
import { Container, Graphics, Text, Sprite, Assets } from 'pixi.js'
import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react'
import {
  BIOMES,
  getBiomeForDistance,
  drawTerrain,
  drawParticles,
  ENEMY_TYPES,
  drawEnemy,
  drawHealthBar,
  drawPlatform,
  drawLadder,
  PLATFORM_STYLES,
  LADDER_STYLES,
  Character,
  Pet,
} from './components'
import { PhysicsEngine, PLATFORM_LEVELS } from './PhysicsEngine'
import { useGameLoop } from './useGameLoop'

// Extend PixiJS components for React
extend({ Container, Graphics, Text, Sprite })

// Game constants
const ATTACK_RANGE = 200
const BASE_ATTACK_SPEED = 600
const ENEMY_SPAWN_RATE = 2500
const CLIMB_SPEED = 180
const MOVE_SPEED = 200
const JUMP_FORCE = 14
const PLATFORM_CHUNK_SIZE = 400
const PLATFORM_WIDTH_MIN = 150
const PLATFORM_WIDTH_MAX = 300
const ANIMATION_FRAME_DURATION = 100 // milliseconds per frame
const PET_FOLLOW_DISTANCE = 60 // Base distance behind for first pet
const PET_SPACING = 40 // Additional spacing between each pet
const PET_FOLLOW_SPEED = 0.08 // How quickly pet catches up (lerp factor)

const MAX_ENEMIES = 10
const CLEANUP_INTERVAL = 2000 // ms
const UNRENDER_DISTANCE = 2000 // px behind scrollOffset

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
function GameContent({ width, height, onStatsUpdate, onKill, onDistanceUpdate, selectedCharacter }) {
  const app = useApplication()
  
  // Physics engine
  const physicsRef = useRef(null)
  
  // Graphics refs
  const terrainRef = useRef(null)
  const particlesRef = useRef(null)
  
  // Game state
  const [playerPos, setPlayerPos] = useState({ x: 200, y: 0 })
  const [facingRight, setFacingRight] = useState(true)
  const [isAttacking, setIsAttacking] = useState(false)
  const [isClimbing, setIsClimbing] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [isJumping, setIsJumping] = useState(false)
  const [isFalling, setIsFalling] = useState(false)
  const [nearbyLadder, setNearbyLadder] = useState(null)
  const [autoAttackEnabled, setAutoAttackEnabled] = useState(false)
  
  // Pets state - array of pet objects
  const [pets, setPets] = useState([
    {
      id: 1,
      type: 'doodle',
      pos: { x: 200 - PET_FOLLOW_DISTANCE, y: 0 },
      facingRight: true,
      isMoving: false,
      targetPos: { x: 200 - PET_FOLLOW_DISTANCE, y: 0 },
      scale: 1,
    },
    {
      id: 2,
      type: 'cat',
      pos: { x: 200 - PET_FOLLOW_DISTANCE - PET_SPACING, y: 0 },
      facingRight: true,
      isMoving: false,
      targetPos: { x: 200 - PET_FOLLOW_DISTANCE - PET_SPACING, y: 0 },
      scale: 1,
    },
  ])
  const petsTargetPosRef = useRef(pets.map(pet => pet.targetPos))
  
  // Helper function to add a new pet
  const addPet = useCallback((petType = 'doodle', scale = 1) => {
    setPets(prevPets => {
      const newId = prevPets.length > 0 ? Math.max(...prevPets.map(p => p.id)) + 1 : 1
      const lastPet = prevPets[prevPets.length - 1]
      
      // Position new pet behind the last pet
      const initialX = lastPet 
        ? lastPet.pos.x - (lastPet.facingRight ? PET_SPACING : -PET_SPACING)
        : playerPos.x - PET_FOLLOW_DISTANCE
      const initialY = lastPet ? lastPet.pos.y : playerPos.y
      
      return [
        ...prevPets,
        {
          id: newId,
          type: petType,
          pos: { x: initialX, y: initialY },
          facingRight: true,
          isMoving: false,
          targetPos: { x: initialX, y: initialY },
          scale,
        },
      ]
    })
  }, [playerPos])
  
  // Helper function to remove a pet by id
  const removePet = useCallback((petId) => {
    setPets(prevPets => prevPets.filter(pet => pet.id !== petId))
  }, [])
  
  // World objects
  const [platforms, setPlatforms] = useState([])
  const [ladders, setLadders] = useState([])
  const [enemies, setEnemies] = useState([])
  const [damageNumbers, setDamageNumbers] = useState([])
  const [goldPickups, setGoldPickups] = useState([])
  
  // Enemy sprites cache
  const enemySpritesRef = useRef(new Map())
  
  // Character stats
  const [character, setCharacter] = useState({
    level: 1,
    xp: 0,
    xpToNext: 100,
    maxHealth: 100,
    health: 100,
    baseDamage: 10,
    critChance: 0.1,
    critMultiplier: 2,
    attackSpeed: BASE_ATTACK_SPEED,
    gold: 0,
  })
  
  // Refs for timing
  const keysPressed = useRef({ up: false, down: false, left: false, right: false, jump: false, attack: false })
  const jumpRequestedRef = useRef(false) // Persists until consumed by game loop
  const jumpCooldownRef = useRef(0)
  const lastPlatformChunkRef = useRef(0)
  const lastAttackRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const lastCleanupRef = useRef(0)
  const lastStatsUpdateRef = useRef(0)
  const lastDistanceUpdateRef = useRef(0)
  const attackTimeoutRef = useRef(null)
  
  // Use a ref for addPet to avoid re-binding event listeners
  const addPetRef = useRef(addPet)
  useEffect(() => {
    addPetRef.current = addPet
  }, [addPet])
  
  // Initialize physics
  useEffect(() => {
    physicsRef.current = new PhysicsEngine()
    physicsRef.current.createPlayer(200, 0)
    
    return () => {
      physicsRef.current?.destroy()
    }
  }, [])
  
  // Load enemy sprite frames from ENEMY_TYPES definitions
  useEffect(() => {
    const loadEnemySprites = async () => {
      try {
        // Load sprites for each enemy type that has spriteFrames defined
        for (const [typeKey, enemyType] of Object.entries(ENEMY_TYPES)) {
          if (enemyType.spriteFrames && enemyType.spriteFrames.length > 0) {
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
  
  // Expose addPet and removePet functions globally for console access
  useEffect(() => {
    window.gameDebug = {
      addPet: (petType = 'doodle', scale = 1) => addPet(petType, scale),
      removePet: (petId) => removePet(petId),
      getPets: () => pets,
    }
    
    return () => {
      delete window.gameDebug
    }
  }, [addPet, removePet, pets])
  
  // Update parent with stats
  useEffect(() => {
    onStatsUpdate?.(character)
  }, [character, onStatsUpdate])
  
  // Update distance
  useEffect(() => {
    onDistanceUpdate?.(playerPos.x)
  }, [playerPos.x, onDistanceUpdate])
  
  // Calculate camera offset
  const characterScreenX = width * 0.3
  const scrollOffset = Math.max(0, playerPos.x - characterScreenX)
  const currentBiome = getBiomeForDistance(playerPos.x)
  const biome = BIOMES[currentBiome]
  
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
      // Press 'P' to add a new pet
      if (e.key === 'p' || e.key === 'P') {
        addPetRef.current('doodle', 1)
      }
      // Press 'C' to add a cat pet
      if (e.key === 'c' || e.key === 'C') {
        addPetRef.current('cat', 1)
      }
      // Press 'O' to remove the last pet
      if (e.key === 'o' || e.key === 'O') {
        setPets(prevPets => {
          if (prevPets.length > 1) {
            return prevPets.slice(0, -1)
          }
          return prevPets
        })
      }
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
  }, []) // Empty dependency array - stable event listeners!
  
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
    
    let availableTypes = ['slime']
    if (distanceProgress >= 1) availableTypes.push('golem') // Golems spawn early in level1
    if (distanceProgress >= 2) availableTypes.push('bat')
    if (distanceProgress >= 5) availableTypes.push('skeleton')
    
    const typeKey = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    const type = ENEMY_TYPES[typeKey]
    
    const preferredLevel = type.preferredLevels[Math.floor(Math.random() * type.preferredLevels.length)]
    const platformHeight = PLATFORM_LEVELS[preferredLevel]
    
    const spawnFromRight = Math.random() > 0.3
    let spawnX = spawnFromRight ? scrollOffset + width + 100 : scrollOffset - 100
    
    let canSpawn = preferredLevel === 'ground'
    if (!canSpawn) {
      const nearbyPlatform = platforms.find(p => 
        p.level === preferredLevel && 
        Math.abs(p.worldX + p.width / 2 - spawnX) < 400
      )
      
      if (nearbyPlatform) {
        canSpawn = true
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
        
        if (horizontalDist > ATTACK_RANGE || horizontalDist < -50) return false
        
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
  }, [character.baseDamage, character.critChance, character.critMultiplier, playerPos, facingRight, onKill])
  
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
    
    // Check nearby ladder
    const nearbyLadders = physics.getNearbyLadders(playerPos.x, playerPos.y)
    const ladder = nearbyLadders[0]
    setNearbyLadder(ladder)
    
    // Copy keysPressed to a local mutable object so we can override it for Auto-Attack
    const currentKeys = { ...keysPressed.current }

    // Auto-Attack Logic
    if (autoAttackEnabled) {
      // Find nearest reachable enemy
      const target = enemies
        .filter(e => !e.dying)
        .sort((a, b) => {
           // Weighted distance: horizontal + vertical * 2 (prioritize nearby first, then reachable vertical)
           const distA = Math.abs(a.worldX - playerPos.x) + Math.abs(a.platformHeight - playerPos.y) * 2
           const distB = Math.abs(b.worldX - playerPos.x) + Math.abs(b.platformHeight - playerPos.y) * 2
           return distA - distB
        })[0]

      if (target) {
        const dx = target.worldX - playerPos.x
        const dy = target.platformHeight - playerPos.y
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        
        const isSameLevel = absDy < 50
        
        if (isSameLevel) {
          // Horizontal movement and attack logic
          const inRange = absDx <= ATTACK_RANGE * 0.8
  
          if (inRange) {
             // Stop moving and attack
             currentKeys.left = false
             currentKeys.right = false
             currentKeys.attack = true
          } else {
             // Move towards enemy
             if (dx > 0) {
               currentKeys.right = true
               currentKeys.left = false
             } else {
               currentKeys.left = true
               currentKeys.right = false
             }
             currentKeys.attack = false
          }
        } else {
          // Vertical movement needed
          currentKeys.attack = false
          
          if (isClimbing) {
            // We are on a ladder, climb towards target level
            if (dy > 0) {
              currentKeys.up = true
              currentKeys.down = false
            } else {
              currentKeys.down = true
              currentKeys.up = false
            }
            
            // If we're close to target level, try to dismount towards target
            if (absDy < 20) {
               if (dx > 0) currentKeys.right = true
               else currentKeys.left = true
            }
          } else {
            // Find a ladder that helps us change level
            // We need a ladder that connects our current Y to the target Y direction
            // Sort ladders by proximity
            const usefulLadder = ladders
              .filter(l => {
                // Check if ladder is accessible from current Y (with some tolerance)
                const isAccessible = playerPos.y >= l.bottomHeight - 10 && playerPos.y <= l.topHeight + 10
                if (!isAccessible) return false
                
                // Check if ladder goes in the right direction
                if (dy > 0) { // Target is above
                   return l.topHeight > playerPos.y + 20
                } else { // Target is below
                   return l.bottomHeight < playerPos.y - 20
                }
              })
              .sort((a, b) => Math.abs(a.worldX - playerPos.x) - Math.abs(b.worldX - playerPos.x))[0]
            
            if (usefulLadder) {
               const ladderDx = usefulLadder.worldX - playerPos.x
               
               if (Math.abs(ladderDx) < 10) {
                 // At ladder, start climbing
                 if (dy > 0) currentKeys.up = true
                 else currentKeys.down = true
                 // Stop horizontal movement to snap/climb
                 currentKeys.left = false
                 currentKeys.right = false
               } else {
                 // Move to ladder
                 if (ladderDx > 0) {
                   currentKeys.right = true
                   currentKeys.left = false
                 } else {
                   currentKeys.left = true
                   currentKeys.right = false
                 }
               }
            } else {
               // No useful ladder found, maybe just move horizontally towards target as fallback
               if (dx > 0) {
                 currentKeys.right = true
                 currentKeys.left = false
               } else {
                 currentKeys.left = true
                 currentKeys.right = false
               }
            }
          }
        }
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
      if (isClimbing && ladder && !currentKeys.up && !currentKeys.down) {
        // Dismount ladder to the left
        setIsClimbing(false)
        physics.setPlayerClimbing(false)
      }
      physics.movePlayer(-MOVE_SPEED * delta / 1000, 0)
      setFacingRight(false)
      moving = true
    }
    if (currentKeys.right) {
      if (isClimbing && ladder && !currentKeys.up && !currentKeys.down) {
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
          targetLadder = nearbyLadders.find(l => playerPos.y < l.topHeight - 5)
        } else if (currentKeys.down) {
          // Find a ladder where we are NOT at the bottom
          targetLadder = nearbyLadders.find(l => playerPos.y > l.bottomHeight + 5)
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
          const atTop = playerPos.y >= activeLadder.topHeight - 5
          const atBottom = playerPos.y <= activeLadder.bottomHeight + 5
          
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
            const targetY = playerPos.y + (CLIMB_SPEED * delta) / 1000
            const newY = Math.min(activeLadder.topHeight, targetY)
            physics.climbPlayer((newY - playerPos.y))
            moving = true
            
            // Auto-dismount when reaching the top of the ladder
            if (newY >= activeLadder.topHeight - 1) {
              setIsClimbing(false)
              physics.setPlayerClimbing(false)
            }
          } else if (currentKeys.down) {
            const targetY = playerPos.y - (CLIMB_SPEED * delta) / 1000
            const newY = Math.max(activeLadder.bottomHeight, targetY)
            physics.climbPlayer((newY - playerPos.y))
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
    
    // Update jumping/falling states
    setIsJumping(physics.isPlayerJumping())
    setIsFalling(physics.isPlayerFalling())
    
    // Reset climbing if landed on ground
    if (isClimbing && isGrounded && !ladder) {
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
    
    // Update pets positions (each follows the player or previous pet)
    setPets(prevPets => {
      return prevPets.map((pet, index) => {
        // First pet follows player, others follow the previous pet in a chain
        let targetX, targetY
        
        if (index === 0) {
          // First pet follows player
          const followDistance = PET_FOLLOW_DISTANCE
          targetX = pos.x - (facingRight ? followDistance : -followDistance)
          targetY = Math.max(0, pos.y)
        } else {
          // Subsequent pets follow the previous pet in a chain
          const prevPet = prevPets[index - 1]
          const followDistance = PET_SPACING
          targetX = prevPet.pos.x - (prevPet.facingRight ? followDistance : -followDistance)
          targetY = prevPet.pos.y
        }
        
        const dx = targetX - pet.pos.x
        const dy = targetY - pet.pos.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Pet is moving if there's significant distance to cover
        const moving = distance > 5
        
        // Update pet facing direction based on movement
        let newFacingRight = pet.facingRight
        if (Math.abs(dx) > 2) {
          newFacingRight = dx > 0
        }
        
        // Smooth interpolation towards target
        // Use faster lerp when far away, slower when close
        const lerpFactor = distance > 100 ? 0.15 : PET_FOLLOW_SPEED
        
        return {
          ...pet,
          pos: {
            x: pet.pos.x + dx * lerpFactor,
            y: pet.pos.y + dy * lerpFactor,
          },
          facingRight: newFacingRight,
          isMoving: moving,
          targetPos: { x: targetX, y: targetY },
        }
      })
    })
    
    // Update enemies
    setEnemies(prev => prev.map(enemy => {
      if (enemy.dying) return enemy
      
      let newWorldX = enemy.worldX
      let newAnimationTime = enemy.animationTime || 0
      let newAnimationFrame = enemy.animationFrame || 0
      
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
            enemy.patrolDirection = 1
            newWorldX = currentPlatform.worldX + 20
          } else if (newWorldX > currentPlatform.worldX + currentPlatform.width - 60) {
            enemy.patrolDirection = -1
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
        const dirToPlayer = playerPos.x > enemy.worldX ? 1 : -1
        newWorldX = enemy.worldX + (dirToPlayer * enemy.speed * delta) / 1000
        enemy.patrolDirection = dirToPlayer
        
        // Update animation
        newAnimationTime += delta
        if (newAnimationTime >= ANIMATION_FRAME_DURATION) {
          newAnimationTime = 0
          newAnimationFrame = (newAnimationFrame + 1) % 5
        }
      }
      
      return { 
        ...enemy, 
        worldX: newWorldX, 
        hit: false,
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
    
  }, [playerPos, isClimbing, isMoving, isAttacking, isJumping, isFalling, facingRight, platforms, generatePlatformsAndLadders, spawnEnemy, attackEnemy, character.attackSpeed, width, height, scrollOffset, currentBiome, autoAttackEnabled, enemies, ladders])
  
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
        
        return (
          <pixiContainer key={`enemy-${enemy.id}`} x={screenPos.x} y={screenPos.y + yOffset} scale={{ x: enemy.patrolDirection === 1 ? 1 : -1, y: 1 }}>
            {/* Render sprite if available, otherwise fallback to drawn graphics */}
            {enemyFrames && enemyFrames[currentFrame] ? (
              <pixiSprite
                texture={enemyFrames[currentFrame]}
                anchor={{ x: 0.5, y: 1 }}
                width={enemyWidth}
                height={enemyHeight}
                alpha={enemy.dying ? 0.5 : (enemy.hit ? 0.8 : 1)}
              />
            ) : (
              <pixiGraphics draw={(g) => drawEnemy(g, enemy.type, enemy.hit, enemy.dying)} />
            )}
            <pixiGraphics y={-enemyHeight - 15} scale={{ x: enemy.patrolDirection === 1 ? 1 : -1, y: 1 }} draw={(g) => drawHealthBar(g, enemy.health, enemy.maxHealth)} />
          </pixiContainer>
        )
      })}
      
      {/* Pet companions */}
      {pets.map((pet) => {
        const screenPos = worldToScreen(pet.pos.x, pet.pos.y)
        return (
          <Pet
            key={`pet-${pet.id}`}
            x={screenPos.x}
            y={screenPos.y}
            facingRight={pet.facingRight}
            isMoving={pet.isMoving}
            petType={pet.type}
            scale={pet.scale}
          />
        )
      })}
      
      {/* Climb indicator */}
      {!!nearbyLadder && !isClimbing && (
        <pixiText
          text="↑↓ Climb"
          x={playerScreen.x}
          y={playerScreen.y - 100}
          anchor={0.5}
          style={{
            fill: 0xffff00,
            fontSize: 14,
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 2 },
          }}
        />
      )}

      {/* Auto-Attack Indicator */}
      <pixiText
        text={`AUTO-ATTACK: ${autoAttackEnabled ? 'ON' : 'OFF'} [R]`}
        x={width - 20}
        y={80}
        anchor={{ x: 1, y: 0 }}
        style={{
          fill: autoAttackEnabled ? 0x00ff00 : 0x888888,
          fontSize: 16,
          fontWeight: 'bold',
          stroke: { color: 0x000000, width: 3 },
        }}
        interactive={true}
        pointerdown={() => setAutoAttackEnabled(prev => !prev)}
        cursor="pointer"
      />
      
      {/* Player character */}
      <Character
        x={playerScreen.x}
        y={playerScreen.y}
        facingRight={facingRight}
        isMoving={isMoving}
        isClimbing={isClimbing}
        isAttacking={isAttacking}
        showClimbIndicator={!!nearbyLadder && !isClimbing}
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
}) {
  return (
    <Application
      width={width}
      height={height}
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
      />
    </Application>
  )
})

export default GameStage
