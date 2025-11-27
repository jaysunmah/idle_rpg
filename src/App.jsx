import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

// Game constants
const GAME_SPEED = 100 // pixels per second for background scroll
const ATTACK_RANGE = 200
const BASE_ATTACK_SPEED = 1000 // ms between attacks
const ENEMY_SPAWN_RATE = 2000 // ms between spawns
const SCREEN_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 1920

// Enemy types
const ENEMY_TYPES = {
  slime: {
    name: 'Slime',
    baseHealth: 30,
    xpReward: 10,
    goldReward: 5,
    speed: 20,
    className: 'enemy-slime',
    height: 80,
  },
  skeleton: {
    name: 'Skeleton',
    baseHealth: 60,
    xpReward: 25,
    goldReward: 12,
    speed: 35,
    className: 'enemy-skeleton',
    height: 80,
  },
  bat: {
    name: 'Bat',
    baseHealth: 20,
    xpReward: 8,
    goldReward: 3,
    speed: 60,
    className: 'enemy-bat',
    height: 60,
  },
  golem: {
    name: 'Stone Golem',
    baseHealth: 200,
    xpReward: 100,
    goldReward: 50,
    speed: 15,
    className: 'enemy-golem',
    height: 100,
  },
}

// Calculate XP needed for level
const xpForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1))

// Generate unique ID
let idCounter = 0
const generateId = () => ++idCounter

function App() {
  // Game state
  const [distance, setDistance] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)
  
  // Character state
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
  
  // Combat state
  const [enemies, setEnemies] = useState([])
  const [isAttacking, setIsAttacking] = useState(false)
  const [damageNumbers, setDamageNumbers] = useState([])
  const [goldPickups, setGoldPickups] = useState([])
  const [kills, setKills] = useState(0)
  const [levelUpEffect, setLevelUpEffect] = useState(false)
  
  // Refs for game loop
  const lastTimeRef = useRef(Date.now())
  const lastAttackRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const gameLoopRef = useRef(null)

  // Spawn enemy
  const spawnEnemy = useCallback(() => {
    const distanceProgress = Math.floor(distance / 1000)
    
    // Determine which enemies can spawn based on distance
    let availableTypes = ['slime']
    if (distanceProgress >= 2) availableTypes.push('bat')
    if (distanceProgress >= 5) availableTypes.push('skeleton')
    if (distanceProgress >= 10 && Math.random() < 0.1) availableTypes.push('golem')
    
    const typeKey = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    const type = ENEMY_TYPES[typeKey]
    
    // Scale enemy health with distance
    const healthMultiplier = 1 + (distanceProgress * 0.2)
    
    const newEnemy = {
      id: generateId(),
      type: typeKey,
      ...type,
      health: Math.floor(type.baseHealth * healthMultiplier),
      maxHealth: Math.floor(type.baseHealth * healthMultiplier),
      x: SCREEN_WIDTH + 100,
      hit: false,
      dying: false,
    }
    
    setEnemies(prev => [...prev, newEnemy])
  }, [distance])

  // Attack nearest enemy
  const attackEnemy = useCallback(() => {
    setEnemies(prev => {
      // Find nearest enemy in range
      const characterX = SCREEN_WIDTH * 0.15 + 80 // Character position + width
      const inRange = prev.filter(e => !e.dying && e.x - characterX < ATTACK_RANGE && e.x > characterX - 50)
      
      if (inRange.length === 0) return prev
      
      // Sort by distance and attack nearest
      inRange.sort((a, b) => a.x - b.x)
      const target = inRange[0]
      
      // Calculate damage
      const isCrit = Math.random() < character.critChance
      const damage = Math.floor(character.baseDamage * (isCrit ? character.critMultiplier : 1))
      
      // Trigger attack animation
      setIsAttacking(true)
      setTimeout(() => setIsAttacking(false), 300)
      
      // Add damage number
      const damageNum = {
        id: generateId(),
        value: damage,
        x: target.x,
        y: target.height || 80,
        isCrit,
      }
      setDamageNumbers(prev => [...prev, damageNum])
      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(d => d.id !== damageNum.id))
      }, 1000)
      
      // Apply damage
      return prev.map(enemy => {
        if (enemy.id !== target.id) return enemy
        
        const newHealth = enemy.health - damage
        
        if (newHealth <= 0) {
          // Enemy killed
          setTimeout(() => {
            // Add gold pickup
            const goldNum = {
              id: generateId(),
              value: enemy.goldReward,
              x: enemy.x,
            }
            setGoldPickups(prev => [...prev, goldNum])
            setTimeout(() => {
              setGoldPickups(prev => prev.filter(g => g.id !== goldNum.id))
            }, 800)
            
            // Add XP and gold
            setCharacter(prev => {
              let newXp = prev.xp + enemy.xpReward
              let newLevel = prev.level
              let newXpToNext = prev.xpToNext
              let newMaxHealth = prev.maxHealth
              let newBaseDamage = prev.baseDamage
              
              // Check for level up
              while (newXp >= newXpToNext) {
                newXp -= newXpToNext
                newLevel++
                newXpToNext = xpForLevel(newLevel)
                newMaxHealth = Math.floor(100 * Math.pow(1.1, newLevel - 1))
                newBaseDamage = Math.floor(10 * Math.pow(1.08, newLevel - 1))
                
                // Show level up effect
                setLevelUpEffect(true)
                setTimeout(() => setLevelUpEffect(false), 1500)
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
            
            setKills(prev => prev + 1)
            
            // Remove dead enemy after animation
            setTimeout(() => {
              setEnemies(prev => prev.filter(e => e.id !== enemy.id))
            }, 500)
          }, 200)
          
          return { ...enemy, health: 0, hit: true, dying: true }
        }
        
        return { ...enemy, health: newHealth, hit: true }
      })
    })
  }, [character.baseDamage, character.critChance, character.critMultiplier])

  // Reset hit state
  useEffect(() => {
    const hitEnemies = enemies.filter(e => e.hit && !e.dying)
    if (hitEnemies.length > 0) {
      const timeout = setTimeout(() => {
        setEnemies(prev => prev.map(e => ({ ...e, hit: false })))
      }, 200)
      return () => clearTimeout(timeout)
    }
  }, [enemies])

  // Main game loop
  useEffect(() => {
    const gameLoop = () => {
      const now = Date.now()
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now
      
      // Update scroll offset for parallax
      const scrollDelta = (GAME_SPEED * delta) / 1000
      setScrollOffset(prev => prev + scrollDelta)
      setDistance(prev => prev + scrollDelta)
      
      // Move enemies
      setEnemies(prev => prev.map(enemy => {
        if (enemy.dying) return enemy
        return {
          ...enemy,
          x: enemy.x - (GAME_SPEED + enemy.speed) * delta / 1000,
        }
      }).filter(enemy => enemy.x > -100)) // Remove off-screen enemies
      
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
      
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [spawnEnemy, attackEnemy, character.attackSpeed])

  // Upgrade functions
  const upgrades = [
    {
      name: 'Sharpen Blade',
      cost: Math.floor(50 * Math.pow(1.5, Math.floor(character.baseDamage / 5))),
      effect: '+5 Damage',
      action: () => setCharacter(prev => ({ ...prev, baseDamage: prev.baseDamage + 5 })),
    },
    {
      name: 'Swift Strikes',
      cost: Math.floor(100 * Math.pow(1.8, Math.floor((BASE_ATTACK_SPEED - character.attackSpeed) / 50))),
      effect: '-50ms Attack Speed',
      disabled: character.attackSpeed <= 200,
      action: () => setCharacter(prev => ({ ...prev, attackSpeed: Math.max(200, prev.attackSpeed - 50) })),
    },
    {
      name: 'Critical Eye',
      cost: Math.floor(200 * Math.pow(2, character.critChance * 10)),
      effect: '+5% Crit Chance',
      disabled: character.critChance >= 0.5,
      action: () => setCharacter(prev => ({ ...prev, critChance: Math.min(0.5, prev.critChance + 0.05) })),
    },
    {
      name: 'Devastating Blows',
      cost: Math.floor(300 * Math.pow(1.5, (character.critMultiplier - 2) * 2)),
      effect: '+0.5x Crit Damage',
      disabled: character.critMultiplier >= 5,
      action: () => setCharacter(prev => ({ ...prev, critMultiplier: Math.min(5, prev.critMultiplier + 0.5) })),
    },
  ]

  const buyUpgrade = (upgrade) => {
    if (character.gold >= upgrade.cost && !upgrade.disabled) {
      setCharacter(prev => ({ ...prev, gold: prev.gold - upgrade.cost }))
      upgrade.action()
    }
  }

  return (
    <div className="game-container">
      {/* Parallax Background */}
      <div 
        className="parallax-layer parallax-stars"
        style={{ transform: `translateX(-${scrollOffset * 0.02 % (SCREEN_WIDTH)}px)` }}
      />
      <div 
        className="parallax-layer parallax-mountains-far"
        style={{ transform: `translateX(-${scrollOffset * 0.1 % (SCREEN_WIDTH)}px)` }}
      />
      <div 
        className="parallax-layer parallax-mountains-near"
        style={{ transform: `translateX(-${scrollOffset * 0.3 % (SCREEN_WIDTH)}px)` }}
      />
      <div className="parallax-layer parallax-ground" />
      <div 
        className="ground-detail"
        style={{ transform: `translateX(-${scrollOffset % (SCREEN_WIDTH)}px)` }}
      />
      
      {/* Game World */}
      <div className="game-world">
        {/* Character */}
        <div className={`character ${isAttacking ? 'attacking' : ''}`}>
          <div className="character-sprite">
            <div className="character-helmet" />
            <div className="character-head" />
            <div className="character-body" />
            <div className="character-sword" />
            <div className="character-legs">
              <div className="leg" />
              <div className="leg" />
            </div>
          </div>
        </div>
        
        {/* Enemies */}
        {enemies.map(enemy => (
          <div
            key={enemy.id}
            className={`enemy ${enemy.className} ${enemy.hit ? 'hit' : ''} ${enemy.dying ? 'dying' : ''}`}
            style={{ left: enemy.x }}
          >
            <div className="enemy-health-bar">
              <div 
                className="enemy-health-fill"
                style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
              />
            </div>
            <div className="enemy-sprite">
              {enemy.type === 'slime' && (
                <>
                  <div className="enemy-body" />
                  <div className="enemy-eyes">
                    <div className="eye" />
                    <div className="eye" />
                  </div>
                </>
              )}
              {enemy.type === 'skeleton' && (
                <>
                  <div className="enemy-body" />
                  <div className="enemy-head" />
                  <div className="enemy-eyes">
                    <div className="eye" />
                    <div className="eye" />
                  </div>
                </>
              )}
              {enemy.type === 'bat' && (
                <>
                  <div className="enemy-body" />
                  <div className="wing left" />
                  <div className="wing right" />
                  <div className="enemy-eyes">
                    <div className="eye" />
                    <div className="eye" />
                  </div>
                </>
              )}
              {enemy.type === 'golem' && (
                <>
                  <div className="enemy-body" />
                  <div className="enemy-head" />
                  <div className="enemy-eyes">
                    <div className="eye" />
                    <div className="eye" />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        
        {/* Damage Numbers */}
        {damageNumbers.map(dmg => (
          <div
            key={dmg.id}
            className={`damage-number ${dmg.isCrit ? 'crit' : ''}`}
            style={{ left: dmg.x, bottom: dmg.y + 20 }}
          >
            {dmg.value}
          </div>
        ))}
        
        {/* Gold Pickups */}
        {goldPickups.map(gold => (
          <div
            key={gold.id}
            className="gold-pickup"
            style={{ left: gold.x, bottom: 100 }}
          >
            +{gold.value} 🪙
          </div>
        ))}
      </div>
      
      {/* UI Overlay */}
      <div className="ui-overlay">
        <div className="stats-panel">
          {/* Character Stats */}
          <div className="character-stats">
            <h2 className="character-name">Hero</h2>
            <div className="character-level">Level {character.level}</div>
            
            <div className="stat-bar">
              <div className="stat-bar-label">
                <span>HP</span>
                <span>{character.health} / {character.maxHealth}</span>
              </div>
              <div className="stat-bar-track">
                <div 
                  className="stat-bar-fill health"
                  style={{ width: `${(character.health / character.maxHealth) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="stat-bar">
              <div className="stat-bar-label">
                <span>XP</span>
                <span>{character.xp} / {character.xpToNext}</span>
              </div>
              <div className="stat-bar-track">
                <div 
                  className="stat-bar-fill xp"
                  style={{ width: `${(character.xp / character.xpToNext) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-icon">⚔️</span>
                <span className="stat-value">{character.baseDamage}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💨</span>
                <span className="stat-value">{(1000 / character.attackSpeed).toFixed(1)}/s</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🪙</span>
                <span className="stat-value">{character.gold}</span>
              </div>
            </div>
          </div>
          
          {/* Distance Progress */}
          <div className="progress-panel">
            <div className="progress-title">Distance Traveled</div>
            <div className="progress-value">{Math.floor(distance)}m</div>
            <div className="progress-subtitle">Zone {Math.floor(distance / 1000) + 1}</div>
          </div>
        </div>
        
        {/* Upgrades Panel */}
        <div className="upgrades-panel">
          <h3 className="upgrades-title">⚒️ Upgrades</h3>
          {upgrades.map((upgrade, index) => (
            <button
              key={index}
              className="upgrade-button"
              onClick={() => buyUpgrade(upgrade)}
              disabled={character.gold < upgrade.cost || upgrade.disabled}
            >
              <div className="upgrade-name">
                <span>{upgrade.name}</span>
                <span className="upgrade-cost">🪙 {upgrade.cost}</span>
              </div>
              <div className="upgrade-effect">{upgrade.effect}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Kill Counter */}
      <div className="kill-counter">
        <div className="kill-counter-label">Enemies Slain</div>
        <div className="kill-counter-value">{kills}</div>
      </div>
      
      {/* Auto Attack Indicator */}
      <div className="auto-attack-indicator active">
        Auto-Attack Active
      </div>
      
      {/* Level Up Effect */}
      {levelUpEffect && (
        <div className="level-up-effect">
          LEVEL UP!
        </div>
      )}
    </div>
  )
}

export default App
