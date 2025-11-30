import { Application, extend, useApplication } from '@pixi/react'
import { Container, Graphics, Text, Sprite, Assets } from 'pixi.js'
import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
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
const BASE_ATTACK_SPEED = 1000
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
  const keysPressed = useRef({ up: false, down: false, left: false, right: false, jump: false })
  const jumpRequestedRef = useRef(false) // Persists until consumed by game loop
  const jumpCooldownRef = useRef(0)
  const lastPlatformChunkRef = useRef(0)
  const lastAttackRef = useRef(0)
  const lastSpawnRef = useRef(0)
  
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
      // Press 'P' to add a new pet
      if (e.key === 'p' || e.key === 'P') {
        addPet('doodle', 1)
      }
      // Press 'C' to add a cat pet
      if (e.key === 'c' || e.key === 'C') {
        addPet('cat', 1)
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
    }
    
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysPressed.current.up = false
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysPressed.current.down = false
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysPressed.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysPressed.current.right = false
      if (e.key === ' ' || e.key === 'Spacebar') keysPressed.current.jump = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [addPet])
  
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
      // For each platform, check if we can create an accessible ladder to it
      levels.forEach((levelKey, levelIndex) => {
        const platform = chunkPlatforms[levelKey]
        if (!platform) return
        
        // Determine the lower level
        const lowerLevelKey = levelIndex === 0 ? 'ground' : levels[levelIndex - 1]
        const lowerPlatform = chunkPlatforms[lowerLevelKey]
        
        // Only create ladder if there's something to stand on below
        // For level1: ground is always accessible
        // For level2+: need a platform at the level below in this chunk
        const canCreateLadder = lowerLevelKey === 'ground' || lowerPlatform
        
        if (canCreateLadder && seededRandom(chunk * 47 + levelIndex * 61) < 0.7) {
          let ladderX
          
          if (lowerLevelKey === 'ground') {
            // Ladder from ground - place within the upper platform bounds
            ladderX = platform.worldX + platform.width * (0.2 + seededRandom(chunk * 59 + levelIndex * 67) * 0.6)
          } else {
            // Ladder from lower platform - place where both platforms overlap
            const overlapStart = Math.max(platform.worldX, lowerPlatform.worldX)
            const overlapEnd = Math.min(
              platform.worldX + platform.width,
              lowerPlatform.worldX + lowerPlatform.width
            )
            
            // Only create ladder if there's sufficient overlap (at least 40px)
            if (overlapEnd - overlapStart < 40) return
            
            // Place ladder in the overlapping region
            const overlapWidth = overlapEnd - overlapStart
            ladderX = overlapStart + overlapWidth * (0.2 + seededRandom(chunk * 59 + levelIndex * 67) * 0.6)
          }
          
          const ladder = {
            id: generateId(),
            worldX: ladderX,
            bottomHeight: PLATFORM_LEVELS[lowerLevelKey],
            topHeight: PLATFORM_LEVELS[levelKey],
          }
          newLadders.push(ladder)
          physics.addLadder(ladder)
        }
      })
      
      // Additional: Create "stacking" ladders when we have level2+ without lower platform
      // These ladders will extend from ground all the way up
      levels.forEach((levelKey, levelIndex) => {
        if (levelIndex === 0) return // level1 already handled
        
        const platform = chunkPlatforms[levelKey]
        if (!platform) return
        
        const lowerLevelKey = levels[levelIndex - 1]
        const lowerPlatform = chunkPlatforms[lowerLevelKey]
        
        // If there's no lower platform but we have this platform,
        // create a direct ladder from ground (only for level2 to keep it reasonable)
        if (!lowerPlatform && levelKey === 'level2' && seededRandom(chunk * 71 + levelIndex * 83) < 0.5) {
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
      setPlatforms(prev => {
        const toRemove = prev.filter(p => p.worldX < scrollOffset - 800)
        toRemove.forEach(p => physics.removePlatform(p.id))
        return [...prev.filter(p => p.worldX > scrollOffset - 800), ...newPlatforms]
      })
    }
    if (newLadders.length > 0) {
      setLadders(prev => {
        const toRemove = prev.filter(l => l.worldX < scrollOffset - 800)
        toRemove.forEach(l => physics.removeLadder(l.id))
        return [...prev.filter(l => l.worldX > scrollOffset - 800), ...newLadders]
      })
    }
  }, [scrollOffset])
  
  // Spawn enemy
  const spawnEnemy = useCallback(() => {
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
    const spawnX = spawnFromRight ? scrollOffset + width + 100 : scrollOffset - 100
    
    let canSpawn = preferredLevel === 'ground'
    if (!canSpawn) {
      const nearbyPlatform = platforms.find(p => 
        p.level === preferredLevel && 
        Math.abs(p.worldX + p.width / 2 - spawnX) < 400
      )
      canSpawn = !!nearbyPlatform
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
  }, [playerPos.x, platforms, scrollOffset, width])
  
  // Attack enemy
  const attackEnemy = useCallback(() => {
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
      
      inRange.sort((a, b) => Math.abs(a.worldX - playerPos.x) - Math.abs(b.worldX - playerPos.x))
      const target = inRange[0]
      
      const isCrit = Math.random() < character.critChance
      const damage = Math.floor(character.baseDamage * (isCrit ? character.critMultiplier : 1))
      
      setIsAttacking(true)
      setTimeout(() => setIsAttacking(false), 300)
      
      const dmgId = generateId()
      setDamageNumbers(prev => [...prev, {
        id: dmgId,
        value: damage,
        worldX: target.worldX,
        y: target.platformHeight + (target.height || 60),
        isCrit,
        startTime: Date.now(),
      }])
      
      return prev.map(enemy => {
        if (enemy.id !== target.id) return enemy
        
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
    
    // Generate world
    generatePlatformsAndLadders(playerPos.x + width)
    
    // Check nearby ladder
    const ladder = physics.getNearbyLadder(playerPos.x, playerPos.y)
    setNearbyLadder(ladder)
    
    // Handle movement
    let moving = false
    const isGrounded = physics.isPlayerGrounded()
    
    // Handle jumping
    if (jumpCooldownRef.current > 0) {
      jumpCooldownRef.current -= delta
    }
    
    // Check for jump request (persists until consumed, unlike keysPressed which resets on keyup)
    const wantsToJump = jumpRequestedRef.current || keysPressed.current.jump
    
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
    if (keysPressed.current.left) {
      if (isClimbing && ladder) {
        // Dismount ladder to the left
        setIsClimbing(false)
        physics.setPlayerClimbing(false)
      }
      physics.movePlayer(-MOVE_SPEED * delta / 1000, 0)
      setFacingRight(false)
      moving = true
    }
    if (keysPressed.current.right) {
      if (isClimbing && ladder) {
        // Dismount ladder to the right
        setIsClimbing(false)
        physics.setPlayerClimbing(false)
      }
      physics.movePlayer(MOVE_SPEED * delta / 1000, 0)
      setFacingRight(true)
      moving = true
    }
    
    // Climbing
    if ((keysPressed.current.up || keysPressed.current.down) && !keysPressed.current.jump) {
      if (ladder && !physics.isPlayerJumping()) {
        if (!isClimbing) {
          setIsClimbing(true)
          physics.setPlayerClimbing(true)
        }
        
        if (keysPressed.current.up) {
          const targetY = playerPos.y + (CLIMB_SPEED * delta) / 1000
          const newY = Math.min(ladder.topHeight, targetY)
          physics.climbPlayer((newY - playerPos.y))
          moving = true
          
          // Auto-dismount when reaching the top of the ladder
          if (newY >= ladder.topHeight - 1) {
            setIsClimbing(false)
            physics.setPlayerClimbing(false)
          }
        } else if (keysPressed.current.down) {
          const targetY = playerPos.y - (CLIMB_SPEED * delta) / 1000
          const newY = Math.max(ladder.bottomHeight, targetY)
          physics.climbPlayer((newY - playerPos.y))
          moving = true
          
          // Auto-dismount when reaching the bottom of the ladder
          if (newY <= ladder.bottomHeight + 1) {
            setIsClimbing(false)
            physics.setPlayerClimbing(false)
          }
        }
      }
    } else if (!keysPressed.current.up && !keysPressed.current.down && isClimbing && !keysPressed.current.left && !keysPressed.current.right) {
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
    
    // Auto attack
    if (now - lastAttackRef.current > character.attackSpeed) {
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
    
  }, [playerPos, isClimbing, isMoving, isAttacking, isJumping, isFalling, facingRight, platforms, generatePlatformsAndLadders, spawnEnemy, attackEnemy, character.attackSpeed, width, height, scrollOffset, currentBiome])
  
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
        const yOffset = enemy.type === 'bat' ? -enemyHeight * 0.3 : 20
        
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
      
      {/* Player character */}
      <Character
        x={playerScreen.x}
        y={playerScreen.y}
        facingRight={facingRight}
        isMoving={isMoving}
        isClimbing={isClimbing}
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
export function GameStage({
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
}

export default GameStage
