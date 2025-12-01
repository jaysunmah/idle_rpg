// Biome definitions
export const BIOMES = {
  darkForest: {
    name: 'Dark Forest',
    skyTop: 0x0a1a1a,
    skyBottom: 0x0f1a0f,
    groundTop: 0x1a2d1a,
    groundBottom: 0x0f1a0f,
    fogColor: 0x0a281e,
    fogAlpha: 0.3,
    platformStyle: 'wood',
    ladderStyle: 'vine',
    particleColor: 0x88ff88,
  },
  crystalCavern: {
    name: 'Crystal Cavern',
    skyTop: 0x0a0a1f,
    skyBottom: 0x0f0a1a,
    groundTop: 0x1a1a2d,
    groundBottom: 0x0f0f1a,
    fogColor: 0x502878,
    fogAlpha: 0.2,
    platformStyle: 'crystal',
    ladderStyle: 'chain',
    particleColor: 0xaa88ff,
  },
  volcanicWaste: {
    name: 'Volcanic Waste',
    skyTop: 0x1a0a0a,
    skyBottom: 0x1a0f0f,
    groundTop: 0x2d1a1a,
    groundBottom: 0x1a0f0f,
    fogColor: 0x782814,
    fogAlpha: 0.25,
    platformStyle: 'stone',
    ladderStyle: 'chain',
    particleColor: 0xff8844,
  },
  ancientRuins: {
    name: 'Ancient Ruins',
    skyTop: 0x1a1a0a,
    skyBottom: 0x1a180f,
    groundTop: 0x2d2a1a,
    groundBottom: 0x1a180f,
    fogColor: 0x504628,
    fogAlpha: 0.2,
    platformStyle: 'stone',
    ladderStyle: 'rope',
    particleColor: 0xccaa88,
  },
  frozenTundra: {
    name: 'Frozen Tundra',
    skyTop: 0x0a1a2a,
    skyBottom: 0x0f1a2a,
    groundTop: 0x1a2d3d,
    groundBottom: 0x0f1a2a,
    fogColor: 0x96b4c8,
    fogAlpha: 0.2,
    platformStyle: 'ice',
    ladderStyle: 'rope',
    particleColor: 0xffffff,
  },
  shadowRealm: {
    name: 'Shadow Realm',
    skyTop: 0x05051a,
    skyBottom: 0x050510,
    groundTop: 0x0f0a1a,
    groundBottom: 0x050510,
    fogColor: 0x1e003c,
    fogAlpha: 0.4,
    platformStyle: 'shadow',
    ladderStyle: 'chain',
    particleColor: 0x8844aa,
  },
}

// Get biome based on distance
export const getBiomeForDistance = (distance) => {
  const zoneSize = 5000
  const biomeKeys = Object.keys(BIOMES)
  // Handle negative distance by clamping to 0 (start of game)
  // or use Math.abs() if we want mirrored biomes
  const validDistance = Math.max(0, distance || 0)
  const biomeIndex = Math.floor(validDistance / zoneSize) % biomeKeys.length
  return biomeKeys[biomeIndex] || biomeKeys[0]
}

// Seeded random
const BASE_SEED = 10326
const seededRandom = (seed) => {
  const x = Math.sin((seed + BASE_SEED) * 9999) * 10000
  return x - Math.floor(x)
}

// Interpolate colors
function lerpColor(color1, color2, t) {
  const r1 = (color1 >> 16) & 0xff
  const g1 = (color1 >> 8) & 0xff
  const b1 = color1 & 0xff
  const r2 = (color2 >> 16) & 0xff
  const g2 = (color2 >> 8) & 0xff
  const b2 = color2 & 0xff
  
  const r = Math.floor(r1 + (r2 - r1) * t)
  const g = Math.floor(g1 + (g2 - g1) * t)
  const b = Math.floor(b1 + (b2 - b1) * t)
  
  return (r << 16) | (g << 8) | b
}

// Draw terrain background
export function drawTerrain(g, screenWidth, screenHeight, scrollOffset, biomeKey) {
  const biome = BIOMES[biomeKey]
  
  g.clear()
  
  // Sky gradient
  const steps = 20
  const stepHeight = screenHeight / steps
  
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const color = lerpColor(biome.skyTop, biome.skyBottom, t)
    g.fill({ color })
    g.rect(0, i * stepHeight, screenWidth, stepHeight + 1)
    g.fill()
  }
  
  const groundY = screenHeight - 100
  
  // Far mountains (slowest parallax)
  const farOffset = (scrollOffset * 0.1) % screenWidth
  g.fill({ color: biome.groundTop, alpha: 0.3 })
  for (let i = -1; i < 3; i++) {
    const baseX = i * (screenWidth / 2) - farOffset
    g.moveTo(baseX, groundY)
    g.lineTo(baseX + 100, groundY - 200)
    g.lineTo(baseX + 150, groundY - 150)
    g.lineTo(baseX + 200, groundY - 250)
    g.lineTo(baseX + 300, groundY)
    g.closePath()
  }
  g.fill()
  
  // Near mountains (faster parallax)
  const nearOffset = (scrollOffset * 0.25) % screenWidth
  g.fill({ color: biome.groundTop, alpha: 0.5 })
  for (let i = -1; i < 3; i++) {
    const baseX = i * (screenWidth / 2) - nearOffset + 100
    g.moveTo(baseX, groundY)
    g.lineTo(baseX + 80, groundY - 120)
    g.lineTo(baseX + 120, groundY - 80)
    g.lineTo(baseX + 180, groundY - 150)
    g.lineTo(baseX + 250, groundY)
    g.closePath()
  }
  g.fill()
  
  // Ground gradient
  const groundHeight = 100
  const groundSteps = 10
  const groundStepHeight = groundHeight / groundSteps
  
  for (let i = 0; i < groundSteps; i++) {
    const t = i / groundSteps
    const color = lerpColor(biome.groundTop, biome.groundBottom, t)
    g.fill({ color })
    g.rect(0, groundY + i * groundStepHeight, screenWidth, groundStepHeight + 1)
    g.fill()
  }
  
  // Ground top edge
  g.fill({ color: biome.groundTop })
  g.rect(0, groundY - 5, screenWidth, 10)
  g.fill()
  
  // Surface detail pattern
  const detailOffset = scrollOffset % 50
  g.fill({ color: biome.groundBottom, alpha: 0.5 })
  for (let i = -1; i < screenWidth / 50 + 1; i++) {
    const x = i * 50 - detailOffset
    g.rect(x, groundY, 2, 5)
    g.rect(x + 20, groundY + 2, 3, 4)
  }
  g.fill()
  
  // Fog overlay
  g.fill({ color: biome.fogColor, alpha: biome.fogAlpha })
  g.rect(0, 0, screenWidth, screenHeight)
  g.fill()
}

// Draw ambient particles
export function drawParticles(g, screenWidth, screenHeight, scrollOffset, biomeKey) {
  const biome = BIOMES[biomeKey]
  const time = Date.now() / 1000
  const count = 30
  
  g.clear()
  
  for (let i = 0; i < count; i++) {
    const baseX = seededRandom(i * 7) * screenWidth
    const baseY = seededRandom(i * 11 + 3) * (screenHeight - 150) + 50
    const size = seededRandom(i * 17) * 4 + 2
    const speed = seededRandom(i * 23) * 0.5 + 0.2
    const phase = seededRandom(i * 31) * Math.PI * 2
    
    // Floating motion
    const floatY = Math.sin(time * speed + phase) * 20
    const floatX = Math.cos(time * speed * 0.7 + phase) * 10
    
    // Parallax offset
    const parallaxX = (scrollOffset * 0.3) % screenWidth
    let x = (baseX + floatX - parallaxX + screenWidth) % screenWidth
    let y = baseY + floatY
    
    // Pulsing alpha
    const alpha = 0.3 + Math.sin(time * 2 + phase) * 0.2
    
    // Glow effect
    g.fill({ color: biome.particleColor, alpha: alpha * 0.3 })
    g.circle(x, y, size * 2)
    g.fill()
    
    // Core
    g.fill({ color: biome.particleColor, alpha })
    g.circle(x, y, size)
    g.fill()
  }
}

export default { BIOMES, getBiomeForDistance, drawTerrain, drawParticles }
