import Matter from 'matter-js'

// Physics categories for collision filtering
export const COLLISION_CATEGORIES = {
  default: 0x0001,
  player: 0x0002,
  enemy: 0x0004,
  platform: 0x0008,
  ground: 0x0010,
  sensor: 0x0020,
}

// Platform height levels (matching original)
export const PLATFORM_LEVELS = {
  ground: 0,
  level1: 180,
  level2: 360,
  level3: 540,
}

export class PhysicsEngine {
  constructor() {
    // Create Matter.js engine
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.5 }, // Downward gravity
    })
    
    this.world = this.engine.world
    this.bodies = new Map() // Track bodies by ID
    this.platforms = new Map()
    this.ladders = []
    this.playerClimbing = false
    
    // Ground body (static, infinite width conceptually)
    // Ground top surface should be at Matter.js y=0 (where player feet rest)
    // With height 50, center needs to be at y=25 so top is at y=0
    this.ground = Matter.Bodies.rectangle(
      5000, // x position (will be updated)
      25, // y position (center below surface, so top is at y=0)
      20000, // width
      50, // height
      {
        isStatic: true,
        label: 'ground',
        friction: 0.8,
        collisionFilter: {
          category: COLLISION_CATEGORIES.ground,
        },
      }
    )
    Matter.Composite.add(this.world, this.ground)
    
    // Set up collision events
    this.collisionCallbacks = []
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      this.handleCollisions(event.pairs, 'start')
    })
    Matter.Events.on(this.engine, 'collisionEnd', (event) => {
      this.handleCollisions(event.pairs, 'end')
    })
  }
  
  handleCollisions(pairs, type) {
    for (const pair of pairs) {
      for (const callback of this.collisionCallbacks) {
        callback(pair.bodyA, pair.bodyB, type)
      }
    }
  }
  
  onCollision(callback) {
    this.collisionCallbacks.push(callback)
    return () => {
      const index = this.collisionCallbacks.indexOf(callback)
      if (index > -1) this.collisionCallbacks.splice(index, 1)
    }
  }
  
  // Create player body
  createPlayer(x, y, width = 30, height = 45) {
    const body = Matter.Bodies.rectangle(x, -y - height / 2, width, height, {
      label: 'player',
      friction: 0.1,
      frictionAir: 0.05,
      restitution: 0,
      collisionFilter: {
        category: COLLISION_CATEGORIES.player,
        mask: COLLISION_CATEGORIES.ground | COLLISION_CATEGORIES.platform,
      },
    })
    
    // Prevent rotation
    Matter.Body.setInertia(body, Infinity)
    
    Matter.Composite.add(this.world, body)
    this.bodies.set('player', body)
    return body
  }
  
  // Create enemy body
  createEnemy(id, x, y, width = 50, height = 50) {
    const body = Matter.Bodies.rectangle(x, -y - height / 2, width, height, {
      label: `enemy_${id}`,
      friction: 0.1,
      frictionAir: 0.02,
      restitution: 0,
      collisionFilter: {
        category: COLLISION_CATEGORIES.enemy,
        mask: COLLISION_CATEGORIES.ground | COLLISION_CATEGORIES.platform,
      },
    })
    
    Matter.Body.setInertia(body, Infinity)
    Matter.Composite.add(this.world, body)
    this.bodies.set(`enemy_${id}`, body)
    return body
  }
  
  removeEnemy(id) {
    const body = this.bodies.get(`enemy_${id}`)
    if (body) {
      Matter.Composite.remove(this.world, body)
      this.bodies.delete(`enemy_${id}`)
    }
  }
  
  // Create platform body
  // The platform surface (where player stands) should be at game y coordinate
  createPlatform(id, x, y, width, height = 20) {
    // Place body so that the TOP surface is at game y (Matter.js y = -y)
    // Body center should be at y + height/2 below the surface
    const body = Matter.Bodies.rectangle(x + width / 2, -y + height / 2, width, height, {
      isStatic: true,
      label: `platform_${id}`,
      friction: 0.8,
      collisionFilter: {
        category: COLLISION_CATEGORIES.platform,
      },
    })
    
    Matter.Composite.add(this.world, body)
    this.platforms.set(id, body)
    return body
  }
  
  removePlatform(id) {
    const body = this.platforms.get(id)
    if (body) {
      Matter.Composite.remove(this.world, body)
      this.platforms.delete(id)
    }
  }
  
  // Add ladder (ladders are sensors, not solid)
  addLadder(ladder) {
    this.ladders.push(ladder)
  }
  
  removeLadder(id) {
    this.ladders = this.ladders.filter(l => l.id !== id)
  }
  
  // Check if player is near a ladder
  getNearbyLadders(playerX, playerY, tolerance = 10) {
    return this.ladders.filter(ladder => {
      const isNearX = Math.abs(ladder.worldX - playerX) < tolerance
      // More forgiving Y range check:
      // - Player can be slightly below the ladder bottom (to start climbing from ground/platform)
      // - Player can be at or slightly above the ladder top (to climb down from platform)
      // - Player height is ~60px, so we need to account for feet vs center position
      const isInYRange = playerY >= ladder.bottomHeight - 30 && playerY <= ladder.topHeight + 40
      return isNearX && isInYRange
    })
  }
  
  // Legacy support for single ladder check (returns first match)
  getNearbyLadder(playerX, playerY, tolerance = 50) {
    const ladders = this.getNearbyLadders(playerX, playerY, tolerance)
    return ladders.length > 0 ? ladders[0] : null
  }
  
  // Check if body is grounded
  isGrounded(body) {
    // If climbing, never report as grounded (to prevent state conflicts)
    if (this.playerClimbing) return false
    
    // Calculate game Y coordinate (same as getPlayerPosition)
    const bodyHeight = body.bounds.max.y - body.bounds.min.y
    const gameY = -body.position.y - bodyHeight / 2
    // Check if near ground level or on a platform
    return gameY <= 5 || this.isOnPlatform(body)
  }
  
  isOnPlatform(body) {
    // Player feet position in game coords (y=0 is ground, positive is up)
    // Player body center is at position.y, feet are at position.y + height/2 (in Matter.js)
    // In game coords: feet at -(position.y + height/2) = -position.y - height/2
    const bodyHeight = body.bounds.max.y - body.bounds.min.y
    const playerFeetY = -body.bounds.max.y // bounds.max.y is bottom in Matter.js coords
    const bodyX = body.position.x
    const bodyWidth = body.bounds.max.x - body.bounds.min.x
    
    for (const [, platform] of this.platforms) {
      // Platform surface in game coords
      // Platform top is at bounds.min.y in Matter.js (more negative = higher)
      const platformSurfaceY = -platform.bounds.min.y
      const platLeft = platform.bounds.min.x
      const platRight = platform.bounds.max.x
      
      // Check if player feet are at or near the platform surface
      // Allow some tolerance for landing detection
      const isAtPlatformHeight = playerFeetY >= platformSurfaceY - 10 && playerFeetY <= platformSurfaceY + 20
      const isOverPlatform = bodyX + bodyWidth / 2 > platLeft && bodyX - bodyWidth / 2 < platRight
      
      if (isAtPlatformHeight && isOverPlatform) return true
    }
    return false
  }
  
  // Apply movement to player
  movePlayer(dx, dy) {
    const player = this.bodies.get('player')
    if (!player) return
    
    // Apply horizontal velocity
    Matter.Body.setVelocity(player, {
      x: dx,
      y: player.velocity.y + dy,
    })
  }
  
  // Make player jump
  jumpPlayer(force = 12) {
    const player = this.bodies.get('player')
    if (!player) return false
    
    // Only jump if grounded
    if (!this.isGrounded(player)) return false
    
    // Apply upward velocity (negative in Matter.js coords)
    Matter.Body.setVelocity(player, {
      x: player.velocity.x,
      y: -force,
    })
    
    return true
  }
  
  // Get player velocity for jump state detection
  getPlayerVelocity() {
    const player = this.bodies.get('player')
    if (!player) return { x: 0, y: 0 }
    return { x: player.velocity.x, y: player.velocity.y }
  }
  
  // Check if player is falling (for animation)
  isPlayerFalling() {
    const player = this.bodies.get('player')
    if (!player) return false
    return player.velocity.y > 1 // Positive Y means falling in Matter.js
  }
  
  // Check if player is jumping (for animation)
  isPlayerJumping() {
    const player = this.bodies.get('player')
    if (!player) return false
    return player.velocity.y < -1 // Negative Y means jumping up
  }
  
  // Check if player is grounded (expose for game logic)
  isPlayerGrounded() {
    const player = this.bodies.get('player')
    if (!player) return true
    return this.isGrounded(player)
  }
  
  // Set player climbing mode (disable physics)
  setPlayerClimbing(isClimbing) {
    const player = this.bodies.get('player')
    if (!player) return
    
    if (isClimbing) {
      // Make body static while climbing to prevent physics interference
      Matter.Body.setStatic(player, true)
      Matter.Body.setVelocity(player, { x: 0, y: 0 })
      this.playerClimbing = true
    } else {
      // Restore dynamic physics
      Matter.Body.setStatic(player, false)
      this.playerClimbing = false
    }
  }
  
  // Climb player up/down
  climbPlayer(dy) {
    const player = this.bodies.get('player')
    if (!player) return
    
    Matter.Body.setPosition(player, {
      x: player.position.x,
      y: player.position.y - dy, // Negative because Matter.js Y is inverted
    })
  }

  // Snap player to ladder X position
  snapToLadder(x) {
    const player = this.bodies.get('player')
    if (!player) return
    
    Matter.Body.setPosition(player, {
      x: x,
      y: player.position.y
    })
  }
  
  // Get player position in game coordinates
  getPlayerPosition() {
    const player = this.bodies.get('player')
    if (!player) return { x: 0, y: 0 }
    
    const height = player.bounds.max.y - player.bounds.min.y

    return {
      x: player.position.x,
      y: -player.position.y - height / 2, // Convert from Matter.js coords and adjust for body center
    }
  }
  
  // Update ground position to follow player
  updateGroundPosition(playerX) {
    Matter.Body.setPosition(this.ground, {
      x: playerX,
      y: this.ground.position.y,
    })
  }
  
  // Step physics simulation
  update(delta) {
    Matter.Engine.update(this.engine, delta)
  }
  
  // Clean up
  destroy() {
    Matter.Engine.clear(this.engine)
    this.bodies.clear()
    this.platforms.clear()
    this.ladders = []
  }
}

export default PhysicsEngine
