import { useState, useEffect } from 'react'
import { getAllCharacters, getCharacter } from '../game/characters'
import './CharacterSelect.css'

export function CharacterSelect({ onSelect, initialCharacter }) {
  const characters = getAllCharacters()
  const [selectedId, setSelectedId] = useState(initialCharacter || characters[0].id)
  const [isAnimating, setIsAnimating] = useState(false)
  const [previewFrame, setPreviewFrame] = useState(0)
  
  const selectedCharacter = getCharacter(selectedId)
  
  // Animate the preview sprite
  useEffect(() => {
    const interval = setInterval(() => {
      setPreviewFrame(prev => (prev + 1) % selectedCharacter.spriteFrames.length)
    }, 150)
    return () => clearInterval(interval)
  }, [selectedId, selectedCharacter.spriteFrames.length])
  
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
      setPreviewFrame(0)
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
                  <img 
                    src={char.previewFrame} 
                    alt={char.name}
                    className="portrait-image"
                  />
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
            <img 
              src={selectedCharacter.spriteFrames[previewFrame]}
              alt={selectedCharacter.name}
              className="preview-sprite"
            />
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
