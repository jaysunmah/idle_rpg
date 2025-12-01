import { useState, useCallback, useEffect } from 'react'
import './App.css'
import { GameStage, BIOMES, getBiomeForDistance } from './game'
import { CharacterSelect } from './components'
import { getCharacter, DEFAULT_CHARACTER } from './game/characters'
import { loadGame } from './game/persistence'

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
  // Load saved game once on mount
  const [savedGame] = useState(() => loadGame())

  // Game state management
  const [gameState, setGameState] = useState(savedGame ? GAME_STATE.PLAYING : GAME_STATE.CHARACTER_SELECT)
  const [selectedCharacter, setSelectedCharacter] = useState(savedGame?.selectedCharacter || DEFAULT_CHARACTER)
  
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
  
  const [character, setCharacter] = useState(() => savedGame?.character || getInitialStats(DEFAULT_CHARACTER))
  
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
  const [autoAttackEnabled, setAutoAttackEnabled] = useState(false)
  const [aiState, setAIState] = useState(null)
  
  // Handle window resize
  useEffect(() => {
    let timeoutId = null
    const handleResize = () => {
      // Debounce resize to prevent excessive re-renders
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setScreenSize({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }, 100)
    }
    
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (timeoutId) clearTimeout(timeoutId)
    }
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
        autoAttackEnabled={autoAttackEnabled}
        setAutoAttackEnabled={setAutoAttackEnabled}
        onAIStateChange={setAIState}
      />
      
      {/* UI Overlay - Upgrades only now */}
      <div className="ui-overlay">
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
      
      {/* Bottom HUD - Concise Level, HP, XP */}
      <div className="bottom-hud">
        <div className="stats-compact">
          <div className="char-info">
            <span className="char-name">{characterData.name}</span>
            <span className="char-level">Lvl {character.level}</span>
          </div>
          
          <div className="bars-container">
            <div className="compact-bar-group">
              <span className="bar-label">HP</span>
              <div className="compact-bar-track">
                <div 
                  className="compact-bar-fill health"
                  style={{ width: `${(character.health / character.maxHealth) * 100}%` }}
                />
                <span className="bar-text">{character.health}/{character.maxHealth}</span>
              </div>
            </div>
            
            <div className="compact-bar-group">
              <span className="bar-label">XP</span>
              <div className="compact-bar-track">
                <div 
                  className="compact-bar-fill xp"
                  style={{ width: `${(character.xp / character.xpToNext) * 100}%` }}
                />
                <span className="bar-text">{character.xp}/{character.xpToNext}</span>
              </div>
            </div>
          </div>
          
          <div className="compact-stats">
            <div className="c-stat" title="Damage">
              <span>⚔️</span> {character.baseDamage}
            </div>
            <div className="c-stat" title="Attack Speed">
              <span>💨</span> {(1000 / character.attackSpeed).toFixed(1)}/s
            </div>
            <div className="c-stat" title="Gold">
              <span>🪙</span> {character.gold}
            </div>
            <div className="c-stat" title="Distance">
              <span>📍</span> {Math.floor(distance)}m
            </div>
          </div>
        </div>
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
      
      
      {/* Auto Attack Indicator */}
      <div className="auto-attack-container">
        <button 
          className={`auto-attack-indicator ${autoAttackEnabled ? 'active' : ''}`}
          onClick={() => setAutoAttackEnabled(prev => !prev)}
        >
          Auto-Attack: {autoAttackEnabled ? 'ON' : 'OFF'} [R]
        </button>
        {autoAttackEnabled && aiState && (
          <div className={`ai-state-label ai-state-${aiState.toLowerCase().replace(/_/g, '-')}`}>
            {aiState.replace(/_/g, ' ')}
          </div>
        )}
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
