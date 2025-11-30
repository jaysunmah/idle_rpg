import { useState, useCallback, useEffect } from 'react'
import './App.css'
import { GameStage, BIOMES, getBiomeForDistance } from './game'
import { CharacterSelect } from './components'
import { getCharacter, DEFAULT_CHARACTER } from './game/characters'

// Game states
const GAME_STATE = {
  CHARACTER_SELECT: 'character_select',
  PLAYING: 'playing',
}

// Game constants
const BASE_ATTACK_SPEED = 1000

// Calculate XP needed for level
const xpForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1))

function App() {
  // Game state management
  const [gameState, setGameState] = useState(GAME_STATE.CHARACTER_SELECT)
  const [selectedCharacter, setSelectedCharacter] = useState(DEFAULT_CHARACTER)
  
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  })
  
  // Get character data for stats modifiers
  const characterData = getCharacter(selectedCharacter)
  
  // Character stats (managed here for UI) - initialized based on selected character
  const getInitialStats = useCallback((charId) => {
    const charData = getCharacter(charId)
    return {
      level: 1,
      xp: 0,
      xpToNext: 100,
      maxHealth: 100,
      health: 100,
      baseDamage: Math.floor(10 * charData.stats.damageMultiplier),
      critChance: 0.1 + charData.stats.critChanceBonus,
      critMultiplier: 2,
      attackSpeed: Math.floor(BASE_ATTACK_SPEED / charData.stats.attackSpeedMultiplier),
      gold: 0,
    }
  }, [])
  
  const [character, setCharacter] = useState(() => getInitialStats(DEFAULT_CHARACTER))
  
  // Handle character selection
  const handleCharacterSelect = useCallback((charId) => {
    setSelectedCharacter(charId)
    setCharacter(getInitialStats(charId))
    setDistance(0)
    setKills(0)
    setGameState(GAME_STATE.PLAYING)
  }, [getInitialStats])
  
  const [distance, setDistance] = useState(0)
  const [kills, setKills] = useState(0)
  const [levelUpEffect, setLevelUpEffect] = useState(false)
  const [showUpgrades, setShowUpgrades] = useState(false)
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Stats update callback from game
  const handleStatsUpdate = useCallback((stats) => {
    const prevLevel = character.level
    setCharacter(stats)
    
    if (stats.level > prevLevel) {
      setLevelUpEffect(true)
      setTimeout(() => setLevelUpEffect(false), 1500)
    }
  }, [character.level])
  
  // Distance update callback
  const handleDistanceUpdate = useCallback((dist) => {
    setDistance(dist)
  }, [])
  
  // Kill callback
  const handleKill = useCallback(() => {
    setKills(prev => prev + 1)
  }, [])
  
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
  
  // Get current biome for zone indicator
  const currentBiomeKey = getBiomeForDistance(distance)
  const currentBiome = BIOMES[currentBiomeKey]
  
  // Show character selection screen
  if (gameState === GAME_STATE.CHARACTER_SELECT) {
    return (
      <CharacterSelect 
        onSelect={handleCharacterSelect}
        initialCharacter={selectedCharacter}
      />
    )
  }

  return (
    <div className="game-container">
      {/* PixiJS Game Canvas */}
      <GameStage
        width={screenSize.width}
        height={screenSize.height}
        onStatsUpdate={handleStatsUpdate}
        onKill={handleKill}
        onDistanceUpdate={handleDistanceUpdate}
        selectedCharacter={selectedCharacter}
      />
      
      {/* UI Overlay */}
      <div className="ui-overlay">
        <div className="stats-panel">
          {/* Character Stats */}
          <div className="character-stats">
            <h2 className="character-name">{characterData.name}</h2>
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
            <div className="progress-title">Position</div>
            <div className="progress-value">{Math.floor(distance)}m</div>
            <div className="progress-subtitle">Zone {Math.floor(distance / 1000) + 1}</div>
          </div>
        </div>
        
        {/* Upgrades Panel */}
        {showUpgrades ? (
          <div className="upgrades-panel">
            <div className="upgrades-header">
              <h3 className="upgrades-title">⚒️ Upgrades</h3>
              <button className="upgrades-close" onClick={() => setShowUpgrades(false)}>✕</button>
            </div>
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
        ) : (
          <button className="upgrades-toggle" onClick={() => setShowUpgrades(true)}>
            ⚒️
          </button>
        )}
      </div>
      
      {/* Kill Counter */}
      <div className="kill-counter">
        <div className="kill-counter-label">Enemies Slain</div>
        <div className="kill-counter-value">{kills}</div>
      </div>
      
      {/* Zone Indicator */}
      <div className="zone-indicator">
        <div className="zone-name">{currentBiome?.name || 'Unknown'}</div>
      </div>
      
      {/* Controls Hint */}
      <div className="controls-hint">
        <div className="hint-text">← → or A/D to move</div>
        <div className="hint-text">↑ ↓ or W/S to climb</div>
        <div className="hint-text">SPACE to jump</div>
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
