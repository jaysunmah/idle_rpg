// Platform style colors per biome
export const PLATFORM_STYLES = {
  wood: {
    main: 0x5a4a3a,
    top: 0x6a5a4a,
    dark: 0x3a2a1a,
    accent: 0x4a3a2a,
  },
  crystal: {
    main: 0x4a4a6a,
    top: 0x6a6a9a,
    dark: 0x2a2a4a,
    accent: 0x8a8aff,
  },
  stone: {
    main: 0x5a5a5a,
    top: 0x7a7a7a,
    dark: 0x3a3a3a,
    accent: 0x4a4a4a,
  },
  ice: {
    main: 0x8ac8e8,
    top: 0xaae8ff,
    dark: 0x5a98b8,
    accent: 0xffffff,
  },
  shadow: {
    main: 0x2a1a3a,
    top: 0x3a2a4a,
    dark: 0x1a0a2a,
    accent: 0x6a4a8a,
  },
}

export function drawPlatform(g, width, height, style) {
  const colors = PLATFORM_STYLES[style] || PLATFORM_STYLES.wood
  
  g.clear()
  
  // Supports (behind platform)
  const supportWidth = 8
  const supportHeight = 40
  
  // Left support
  g.fill({ color: colors.dark })
  g.rect(10, height, supportWidth, supportHeight)
  g.fill()
  g.fill({ color: colors.main, alpha: 0.8 })
  g.rect(12, height, supportWidth - 4, supportHeight)
  g.fill()
  
  // Right support
  g.fill({ color: colors.dark })
  g.rect(width - 18, height, supportWidth, supportHeight)
  g.fill()
  g.fill({ color: colors.main, alpha: 0.8 })
  g.rect(width - 16, height, supportWidth - 4, supportHeight)
  g.fill()
  
  // Cross beam (if wide enough)
  if (width > 100) {
    g.fill({ color: colors.dark, alpha: 0.6 })
    g.moveTo(18, height + 10)
    g.lineTo(width - 10, height + 30)
    g.lineTo(width - 10, height + 34)
    g.lineTo(18, height + 14)
    g.closePath()
    g.fill()
  }
  
  // Main platform body
  g.fill({ color: colors.main })
  g.roundRect(0, 0, width, height, 4)
  g.fill()
  
  // Top surface (lighter)
  g.fill({ color: colors.top })
  g.roundRect(0, 0, width, 6, 4)
  g.fill()
  
  // Edge shadows
  g.fill({ color: colors.dark })
  g.rect(0, height - 4, 4, 4)
  g.rect(width - 4, height - 4, 4, 4)
  g.fill()
  
  // Texture lines (wood grain / cracks)
  g.stroke({ color: colors.accent, width: 1, alpha: 0.5 })
  const segments = Math.floor(width / 30)
  for (let i = 1; i < segments; i++) {
    const xPos = i * 30 + Math.sin(i * 5) * 5
    g.moveTo(xPos, 4)
    g.lineTo(xPos + 2, height - 2)
  }
  g.stroke()
  
  // Highlight
  g.fill({ color: 0xffffff, alpha: 0.1 })
  g.rect(4, 2, width - 8, 2)
  g.fill()
}

export default { PLATFORM_STYLES, drawPlatform }
