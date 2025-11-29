export const LADDER_STYLES = {
  vine: {
    rail: 0x2a4a2a,
    rung: 0x3a5a3a,
    accent: 0x4a6a4a,
  },
  rope: {
    rail: 0x6a5a4a,
    rung: 0x5a4a3a,
    accent: 0x7a6a5a,
  },
  chain: {
    rail: 0x5a5a6a,
    rung: 0x4a4a5a,
    accent: 0x7a7a8a,
  },
}

export function drawLadder(g, height, style) {
  const colors = LADDER_STYLES[style] || LADDER_STYLES.rope
  const rungSpacing = 25
  const rungCount = Math.floor(height / rungSpacing)
  const railWidth = 6
  const ladderWidth = 30
  
  g.clear()
  
  // Left rail
  g.fill({ color: colors.rail })
  g.roundRect(-ladderWidth/2, 0, railWidth, height, 2)
  g.fill()
  
  // Right rail
  g.fill({ color: colors.rail })
  g.roundRect(ladderWidth/2 - railWidth, 0, railWidth, height, 2)
  g.fill()
  
  // Rail highlights
  g.fill({ color: colors.accent, alpha: 0.3 })
  g.rect(-ladderWidth/2 + 1, 0, 2, height)
  g.rect(ladderWidth/2 - railWidth + 1, 0, 2, height)
  g.fill()
  
  // Rungs
  for (let i = 0; i < rungCount; i++) {
    const rungY = height - (i * rungSpacing) - 15
    
    // Rung shadow
    g.fill({ color: colors.rail, alpha: 0.5 })
    g.roundRect(-ladderWidth/2 + railWidth - 2, rungY + 2, ladderWidth - railWidth * 2 + 4, 6, 2)
    g.fill()
    
    // Rung
    g.fill({ color: colors.rung })
    g.roundRect(-ladderWidth/2 + railWidth - 2, rungY, ladderWidth - railWidth * 2 + 4, 6, 2)
    g.fill()
    
    // Rung highlight
    g.fill({ color: colors.accent, alpha: 0.4 })
    g.rect(-ladderWidth/2 + railWidth, rungY + 1, ladderWidth - railWidth * 2, 2)
    g.fill()
  }
}

export default { LADDER_STYLES, drawLadder }
