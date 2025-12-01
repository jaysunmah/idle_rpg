import { useState, useEffect } from 'react'
import { Application, extend } from '@pixi/react'
import { Container } from 'pixi.js'
import { getAllCharacters, getCharacter } from '../game/characters'
import { Character, CHARACTER_HEIGHT } from '../game/components/Character'
import './CharacterSelect.css'

// Extend PixiJS components for React
extend({ Container })

// Preview dimensions
const PREVIEW_WIDTH = 200
const PREVIEW_HEIGHT = 200

// Character preview using the same PixiJS rendering as the game
function CharacterPreview({ characterType, size = 'large' }) {
  const isLarge = size === 'large'
  const width = isLarge ? PREVIEW_WIDTH : 100
  const height = isLarge ? PREVIEW_HEIGHT : 120
  
  return (
    <Application
      width={width}
      height={height}
      backgroundAlpha={0}
      antialias={true}
    >
      <Character
        x={width / 2}
        y={height - 10}
        facingRight={true}
        isMoving={true}
        characterType={characterType}
      />
    </Application>
  )
}

export function CharacterSelect({ onSelect, initialCharacter }) {
  const characters = getAllCharacters()
  const [selectedId, setSelectedId] = useState(initialCharacter || characters[0].id)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const selectedCharacter = getCharacter(selectedId)
  
  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        onSelect(selectedId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, onSelect])
  
  const handleSelect = (id) => {
    if (id !== selectedId) {
      setIsAnimating(true)
      setSelectedId(id)
      setTimeout(() => setIsAnimating(false), 250)
    }
  }
  
  const handleStartGame = () => {
    onSelect(selectedId)
  }

  return (
    <div className="character-select-container">
      {/* Background layers */}
      <div className="select-bg-layer stars" />
      <div className="select-bg-layer nebula" />
      
      {/* Header */}
      <div className="select-header">
        <h1 className="select-title">Select Your Hero</h1>
        <p className="select-subtitle">Choose a champion for your journey</p>
      </div>
      
      {/* Main content */}
      <div className="select-content">
        {/* Character selection row */}
        <div className="character-grid">
          {characters.map((char) => (
            <button
              key={char.id}
              className={`character-card ${selectedId === char.id ? 'selected' : ''}`}
              onClick={() => handleSelect(char.id)}
              style={{ '--char-color': char.color }}
            >
              <div className="card-content">
                <div className="card-portrait">
                  <CharacterPreview characterType={char.id} size="small" />
                </div>
                <span className="card-name">{char.name}</span>
              </div>
              {selectedId === char.id && (
                <div className="selected-indicator">
                  <span className="checkmark">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Preview panel */}
        <div className="preview-panel">
          <div className={`preview-character ${isAnimating ? 'animating' : ''}`}>
            <div className="preview-glow" style={{ '--char-color': selectedCharacter.color }} />
            <CharacterPreview characterType={selectedId} size="large" />
          </div>
          
          <div className="preview-info">
            <h2 className="preview-name" style={{ color: selectedCharacter.color }}>
              {selectedCharacter.name}
            </h2>
            <p className="preview-description">
              {selectedCharacter.description}
            </p>
            
            {/* Stats */}
            <div className="stats-preview">
              <div className="stat-row-preview">
                <span className="stat-label">⚔️ Damage</span>
                <div className="stat-bar-preview">
                  <div 
                    className="stat-fill damage"
                    style={{ width: `${selectedCharacter.stats.damageMultiplier * 75}%` }}
                  />
                </div>
                <span className="stat-value-preview">
                  {Math.round(selectedCharacter.stats.damageMultiplier * 100)}%
                </span>
              </div>
              
              <div className="stat-row-preview">
                <span className="stat-label">💨 Speed</span>
                <div className="stat-bar-preview">
                  <div 
                    className="stat-fill speed"
                    style={{ width: `${selectedCharacter.stats.attackSpeedMultiplier * 75}%` }}
                  />
                </div>
                <span className="stat-value-preview">
                  {Math.round(selectedCharacter.stats.attackSpeedMultiplier * 100)}%
                </span>
              </div>
              
              <div className="stat-row-preview">
                <span className="stat-label">✨ Crit</span>
                <div className="stat-bar-preview">
                  <div 
                    className="stat-fill crit"
                    style={{ width: `${(0.1 + selectedCharacter.stats.critChanceBonus) * 300}%` }}
                  />
                </div>
                <span className="stat-value-preview">
                  {Math.round((0.1 + selectedCharacter.stats.critChanceBonus) * 100)}%
                </span>
              </div>
            </div>
            
            <button className="start-button" onClick={handleStartGame}>
              <span className="button-text">Begin Adventure</span>
              <span className="button-icon">→</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="select-footer">
        <span className="hint">Press Enter to start</span>
      </div>
    </div>
  )
}

export default CharacterSelect
