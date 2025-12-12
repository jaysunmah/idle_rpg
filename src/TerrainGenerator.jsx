import { useState, useEffect, useMemo, useRef } from 'react'

// Seeded random number generator for consistent procedural generation
const BASE_SEED = 10326
const seededRandom = (seed) => {
  const x = Math.sin((seed + BASE_SEED) * 9999) * 10000
  return x - Math.floor(x)
}

// Biome definitions
const BIOMES = {
  darkForest: {
    name: 'Dark Forest',
    groundColor: ['#1a2d1a', '#0f1a0f', '#162016'],
    skyGradient: 'linear-gradient(180deg, #0a1a1a 0%, #1a2d1a 50%, #0f1a0f 100%)',
    fogColor: 'rgba(10, 40, 30, 0.3)',
    features: ['deadTree', 'pine', 'mushroom', 'stump', 'bush'],
    featureDensity: 0.4,
    ambientParticles: 'fireflies',
    platformStyle: 'wood',
    ladderStyle: 'vine',
  },
  crystalCavern: {
    name: 'Crystal Cavern',
    groundColor: ['#1a1a2d', '#0f0f1a', '#161620'],
    skyGradient: 'linear-gradient(180deg, #0a0a1f 0%, #1a1030 50%, #0f0a1a 100%)',
    fogColor: 'rgba(80, 40, 120, 0.2)',
    features: ['crystal', 'crystalCluster', 'stalagmite', 'glowMushroom', 'rock'],
    featureDensity: 0.35,
    ambientParticles: 'sparkles',
    platformStyle: 'crystal',
    ladderStyle: 'chain',
  },
  volcanicWaste: {
    name: 'Volcanic Waste',
    groundColor: ['#2d1a1a', '#1a0f0f', '#201616'],
    skyGradient: 'linear-gradient(180deg, #1a0a0a 0%, #2d1a0a 50%, #1a0f0f 100%)',
    fogColor: 'rgba(120, 40, 20, 0.25)',
    features: ['lavaRock', 'deadTree', 'ember', 'obsidian', 'crater'],
    featureDensity: 0.3,
    ambientParticles: 'embers',
    platformStyle: 'stone',
    ladderStyle: 'chain',
  },
  ancientRuins: {
    name: 'Ancient Ruins',
    groundColor: ['#2d2a1a', '#1a180f', '#201e16'],
    skyGradient: 'linear-gradient(180deg, #1a1a0a 0%, #2d2a1a 50%, #1a180f 100%)',
    fogColor: 'rgba(80, 70, 40, 0.2)',
    features: ['pillar', 'brokenPillar', 'statue', 'archway', 'rubble'],
    featureDensity: 0.25,
    ambientParticles: 'dust',
    platformStyle: 'stone',
    ladderStyle: 'rope',
  },
  frozenTundra: {
    name: 'Frozen Tundra',
    groundColor: ['#1a2d3d', '#0f1a2a', '#162030'],
    skyGradient: 'linear-gradient(180deg, #0a1a2a 0%, #1a2d3d 50%, #0f1a2a 100%)',
    fogColor: 'rgba(150, 180, 200, 0.2)',
    features: ['iceSpike', 'frozenTree', 'snowDrift', 'icicle', 'frozenRock'],
    featureDensity: 0.3,
    ambientParticles: 'snow',
    platformStyle: 'ice',
    ladderStyle: 'rope',
  },
  shadowRealm: {
    name: 'Shadow Realm',
    groundColor: ['#0f0a1a', '#050510', '#0a0815'],
    skyGradient: 'linear-gradient(180deg, #05051a 0%, #0f0a20 50%, #050510 100%)',
    fogColor: 'rgba(30, 0, 60, 0.4)',
    features: ['voidCrystal', 'shadowPillar', 'eyeStatue', 'darkPortal', 'shadowTree'],
    featureDensity: 0.2,
    ambientParticles: 'shadows',
    platformStyle: 'shadow',
    ladderStyle: 'chain',
  },
}

// Feature definitions with render functions
const TERRAIN_FEATURES = {
  // Forest features
  deadTree: {
    width: 60,
    height: 120,
    zIndex: 2,
    render: (seed) => (
      <div className="terrain-feature dead-tree" data-variant={Math.floor(seededRandom(seed) * 3)}>
        <div className="trunk" />
        <div className="branch left" />
        <div className="branch right" />
      </div>
    ),
  },
  pine: {
    width: 50,
    height: 100,
    zIndex: 2,
    render: (seed) => (
      <div className="terrain-feature pine-tree" data-variant={Math.floor(seededRandom(seed) * 3)}>
        <div className="trunk" />
        <div className="foliage layer-1" />
        <div className="foliage layer-2" />
        <div className="foliage layer-3" />
      </div>
    ),
  },
  mushroom: {
    width: 30,
    height: 40,
    zIndex: 1,
    render: (seed) => (
      <div className="terrain-feature mushroom" data-variant={Math.floor(seededRandom(seed) * 4)}>
        <div className="stem" />
        <div className="cap" />
        <div className="spots" />
      </div>
    ),
  },
  stump: {
    width: 35,
    height: 25,
    zIndex: 1,
    render: () => (
      <div className="terrain-feature stump">
        <div className="stump-body" />
        <div className="rings" />
      </div>
    ),
  },
  bush: {
    width: 45,
    height: 30,
    zIndex: 1,
    render: (seed) => (
      <div className="terrain-feature bush" data-variant={Math.floor(seededRandom(seed) * 2)}>
        <div className="leaves" />
      </div>
    ),
  },
  
  // Crystal features
  crystal: {
    width: 25,
    height: 60,
    zIndex: 2,
    render: (seed) => (
      <div className="terrain-feature crystal" data-hue={Math.floor(seededRandom(seed) * 60 + 240)}>
        <div className="crystal-shard main" />
        <div className="crystal-glow" />
      </div>
    ),
  },
  crystalCluster: {
    width: 80,
    height: 70,
    zIndex: 2,
    render: (seed) => (
      <div className="terrain-feature crystal-cluster" data-hue={Math.floor(seededRandom(seed) * 60 + 240)}>
        <div className="crystal-shard small left" />
        <div className="crystal-shard main" />
        <div className="crystal-shard small right" />
        <div className="crystal-glow" />
      </div>
    ),
  },
  stalagmite: {
    width: 30,
    height: 50,
    zIndex: 1,
    render: () => (
      <div className="terrain-feature stalagmite">
        <div className="rock-spike" />
      </div>
    ),
  },
  glowMushroom: {
    width: 25,
    height: 35,
    zIndex: 1,
    render: (seed) => (
      <div className="terrain-feature glow-mushroom" data-hue={Math.floor(seededRandom(seed) * 60 + 120)}>
        <div className="stem" />
        <div className="cap" />
        <div className="glow" />
      </div>
    ),
  },
  rock: {
    width: 40,
    height: 25,
    zIndex: 1,
    render: (seed) => (
      <div className="terrain-feature rock" data-variant={Math.floor(seededRandom(seed) * 3)}>
        <div className="rock-body" />
      </div>
    ),
  },
  
  // Volcanic features
  lavaRock: {
    width: 50,
    height: 35,
    zIndex: 1,
    render: (seed) => (
      <div className="terrain-feature lava-rock" data-variant={Math.floor(seededRandom(seed) * 2)}>
        <div className="rock-body" />
        <div className="lava-crack" />
        <div className="lava-glow" />
      </div>
    ),
  },
  ember: {
    width: 20,
    height: 20,
    zIndex: 1,
    render: () => (
      <div className="terrain-feature ember">
        <div className="ember-core" />
        <div className="ember-glow" />
      </div>
    ),
  },
  obsidian: {
    width: 45,
    height: 55,
    zIndex: 2,
    render: (seed) => (
      <div className="terrain-feature obsidian" data-variant={Math.floor(seededRandom(seed) * 2)}>
        <div className="obsidian-shard" />
        <div className="obsidian-shine" />
      </div>
    ),
  },
  crater: {
    width: 70,
    height: 20,
    zIndex: 0,
    render: () => (
      <div className="terrain-feature crater">
        <div className="crater-rim" />
        <div className="crater-depth" />
        <div className="smoke" />
      </div>
    ),
  },
  
  // Ruins features
  pillar: {
    width: 35,
    height: 90,
    zIndex: 2,
    render: () => (
      <div className="terrain-feature pillar">
        <div className="pillar-base" />
        <div className="pillar-body" />
        <div className="pillar-capital" />
      </div>
    ),
  },
  brokenPillar: {
    width: 40,
    height: 50,
    zIndex: 2,
    render: (seed) => (
      <div className="terrain-feature broken-pillar" data-variant={Math.floor(seededRandom(seed) * 2)}>
        <div className="pillar-base" />
        <div className="pillar-body" />
        <div className="debris" />
      </div>
    ),
  },
  statue: {
    width: 45,
    height: 75,
    zIndex: 2,
    render: (seed) => (
      <div className="terrain-feature statue" data-variant={Math.floor(seededRandom(seed) * 2)}>
        <div className="statue-base" />
        <div className="statue-body" />
        <div className="statue-head" />
      </div>
    ),
  },
  archway: {
    width: 100,
    height: 85,
    zIndex: 3,
    render: () => (
      <div className="terrain-feature archway">
        <div className="arch-pillar left" />
        <div className="arch-pillar right" />
        <div className="arch-top" />
        <div className="arch-keystone" />
      </div>
    ),
  },
  rubble: {
    width: 55,
    height: 20,
    zIndex: 0,
    render: (seed) => (
      <div className="terrain-feature rubble" data-variant={Math.floor(seededRandom(seed) * 3)}>
        <div className="rubble-pieces" />
      </div>
    ),
  },
  
  // Frozen features
  iceSpike: {
    width: 30,
    height: 65,
    zIndex: 2,
    render: (seed) => (
      <div className="terrain-feature ice-spike" data-variant={Math.floor(seededRandom(seed) * 2)}>
        <div className="ice-body" />
        <div className="ice-shine" />
      </div>
    ),
  },
  frozenTree: {
    width: 55,
    height: 95,
    zIndex: 2,
    render: () => (
      <div className="terrain-feature frozen-tree">
        <div className="trunk" />
        <div className="branches" />
        <div className="ice-coating" />
        <div className="icicles" />
      </div>
    ),
  },
  snowDrift: {
    width: 60,
    height: 25,
    zIndex: 0,
    render: () => (
      <div className="terrain-feature snow-drift">
        <div className="snow-body" />
        <div className="snow-sparkle" />
      </div>
    ),
  },
  icicle: {
    width: 15,
    height: 45,
    zIndex: 1,
    render: () => (
      <div className="terrain-feature icicle">
        <div className="icicle-body" />
      </div>
    ),
  },
  frozenRock: {
    width: 45,
    height: 30,
    zIndex: 1,
    render: () => (
      <div className="terrain-feature frozen-rock">
        <div className="rock-body" />
        <div className="frost-layer" />
      </div>
    ),
  },
  
  // Shadow features
  voidCrystal: {
    width: 40,
    height: 70,
    zIndex: 2,
    render: () => (
      <div className="terrain-feature void-crystal">
        <div className="crystal-body" />
        <div className="void-core" />
        <div className="dark-aura" />
      </div>
    ),
  },
  shadowPillar: {
    width: 30,
    height: 100,
    zIndex: 2,
    render: () => (
      <div className="terrain-feature shadow-pillar">
        <div className="pillar-body" />
        <div className="shadow-tendrils" />
      </div>
    ),
  },
  eyeStatue: {
    width: 50,
    height: 65,
    zIndex: 2,
    render: () => (
      <div className="terrain-feature eye-statue">
        <div className="statue-body" />
        <div className="eye" />
        <div className="eye-glow" />
      </div>
    ),
  },
  darkPortal: {
    width: 70,
    height: 80,
    zIndex: 3,
    render: () => (
      <div className="terrain-feature dark-portal">
        <div className="portal-frame" />
        <div className="portal-void" />
        <div className="portal-swirl" />
      </div>
    ),
  },
  shadowTree: {
    width: 60,
    height: 110,
    zIndex: 2,
    render: () => (
      <div className="terrain-feature shadow-tree">
        <div className="trunk" />
        <div className="canopy" />
        <div className="dripping-shadow" />
      </div>
    ),
  },
}

// Get biome based on distance
const getBiomeForDistance = (distance) => {
  const zoneSize = 5000 // Change biome every 5000m
  const biomeKeys = Object.keys(BIOMES)
  const biomeIndex = Math.floor(distance / zoneSize) % biomeKeys.length
  return biomeKeys[biomeIndex]
}

// Check if in transition zone
const getTransitionProgress = (distance) => {
  const zoneSize = 5000
  const transitionSize = 500 // 500m transition
  const positionInZone = distance % zoneSize
  
  if (positionInZone > zoneSize - transitionSize) {
    return (positionInZone - (zoneSize - transitionSize)) / transitionSize
  }
  return 0
}

export function TerrainGenerator({ 
  scrollOffset, 
  distance, 
  screenWidth,
  platforms,
  ladders,
}) {
  const [features, setFeatures] = useState([])
  const lastGeneratedRef = useRef(0)
  const featureIdRef = useRef(0)
  
  // Current and next biome
  const currentBiomeKey = useMemo(() => getBiomeForDistance(distance), [distance])
  const nextBiomeKey = useMemo(() => {
    const biomeKeys = Object.keys(BIOMES)
    const currentIndex = biomeKeys.indexOf(currentBiomeKey)
    return biomeKeys[(currentIndex + 1) % biomeKeys.length]
  }, [currentBiomeKey])
  
  const currentBiome = BIOMES[currentBiomeKey]
  const nextBiome = BIOMES[nextBiomeKey]
  const transitionProgress = getTransitionProgress(distance)
  
  // Generate terrain features
  useEffect(() => {
    const generateFeatures = () => {
      const viewStart = scrollOffset - 200
      const viewEnd = scrollOffset + screenWidth + 400
      const chunkSize = 150 // Generate features every 150px
      
      // Remove features that are too far behind
      setFeatures(prev => prev.filter(f => f.worldX > viewStart - 500))
      
      // Generate new features ahead
      const startChunk = Math.floor(lastGeneratedRef.current / chunkSize)
      const endChunk = Math.floor(viewEnd / chunkSize)
      
      const newFeatures = []
      
      for (let chunk = startChunk; chunk <= endChunk; chunk++) {
        const chunkStart = chunk * chunkSize
        
        if (chunkStart <= lastGeneratedRef.current) continue
        
        // Determine biome for this chunk
        const chunkDistance = chunkStart
        const biomeKey = getBiomeForDistance(chunkDistance)
        const biome = BIOMES[biomeKey]
        
        // Should we generate a feature in this chunk?
        const shouldGenerate = seededRandom(chunk * 17 + 7) < biome.featureDensity
        
        if (shouldGenerate) {
          // Pick a random feature from this biome
          const featureIndex = Math.floor(seededRandom(chunk * 31 + 13) * biome.features.length)
          const featureType = biome.features[featureIndex]
          const featureDef = TERRAIN_FEATURES[featureType]
          
          if (featureDef) {
            const xOffset = seededRandom(chunk * 41 + 23) * (chunkSize - featureDef.width)
            const layerRand = seededRandom(chunk * 53 + 29)
            const layer = layerRand < 0.3 ? 'back' : layerRand < 0.7 ? 'mid' : 'front'
            
            newFeatures.push({
              id: ++featureIdRef.current,
              type: featureType,
              worldX: chunkStart + xOffset,
              layer,
              seed: chunk * 67 + 37,
              biome: biomeKey,
            })
          }
        }
        
        lastGeneratedRef.current = chunkStart
      }
      
      if (newFeatures.length > 0) {
        setFeatures(prev => [...prev, ...newFeatures])
      }
    }
    
    generateFeatures()
  }, [scrollOffset, screenWidth, distance])
  
  // Calculate feature positions relative to screen
  const visibleFeatures = useMemo(() => {
    return features.map(f => {
      const parallaxMultiplier = f.layer === 'back' ? 0.5 : f.layer === 'mid' ? 0.75 : 1
      const screenX = f.worldX - (scrollOffset * parallaxMultiplier)
      const scale = f.layer === 'back' ? 0.6 : f.layer === 'mid' ? 0.8 : 1
      const opacity = f.layer === 'back' ? 0.5 : f.layer === 'mid' ? 0.7 : 1
      const zIndex = f.layer === 'back' ? 1 : f.layer === 'mid' ? 2 : 3
      
      return {
        ...f,
        screenX,
        scale,
        opacity,
        zIndex: zIndex + (TERRAIN_FEATURES[f.type]?.zIndex || 0),
      }
    }).filter(f => f.screenX > -200 && f.screenX < screenWidth + 200)
  }, [features, scrollOffset, screenWidth])
  
  // Calculate visible platforms
  const visiblePlatforms = useMemo(() => {
    if (!platforms) return []
    return platforms.map(p => ({
      ...p,
      screenX: p.worldX - scrollOffset,
    })).filter(p => p.screenX > -300 && p.screenX < screenWidth + 100)
  }, [platforms, scrollOffset, screenWidth])
  
  // Calculate visible ladders
  const visibleLadders = useMemo(() => {
    if (!ladders) return []
    return ladders.map(l => ({
      ...l,
      screenX: l.worldX - scrollOffset,
    })).filter(l => l.screenX > -100 && l.screenX < screenWidth + 100)
  }, [ladders, scrollOffset, screenWidth])
  
  // Render ambient particles based on biome
  const renderAmbientParticles = () => {
    const particleCount = 15
    const particles = []
    
    for (let i = 0; i < particleCount; i++) {
      const x = seededRandom(i * 7 + distance * 0.001) * 100
      const y = seededRandom(i * 11 + 3) * 100
      const delay = seededRandom(i * 13) * 5
      const size = seededRandom(i * 17) * 4 + 2
      
      particles.push(
        <div
          key={i}
          className={`ambient-particle ${currentBiome.ambientParticles}`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            animationDelay: `${delay}s`,
            width: `${size}px`,
            height: `${size}px`,
          }}
        />
      )
    }
    
    return particles
  }
  
  return (
    <div className="terrain-system">
      {/* Dynamic Sky */}
      <div 
        className="terrain-sky"
        style={{
          background: transitionProgress > 0
            ? `linear-gradient(180deg, 
                ${currentBiome.skyGradient} ${100 - transitionProgress * 100}%, 
                ${nextBiome.skyGradient} 100%)`
            : currentBiome.skyGradient,
        }}
      />
      
      {/* Fog Layer */}
      <div 
        className="terrain-fog"
        style={{
          backgroundColor: transitionProgress > 0
            ? undefined
            : currentBiome.fogColor,
          opacity: 0.6,
        }}
      />
      
      {/* Ambient Particles */}
      <div className="ambient-particles">
        {renderAmbientParticles()}
      </div>
      
      {/* Background Mountains (generated based on biome) */}
      <div 
        className={`terrain-mountains-far ${currentBiomeKey}`}
        style={{ transform: `translateX(-${scrollOffset * 0.1 % screenWidth}px)` }}
      />
      <div 
        className={`terrain-mountains-near ${currentBiomeKey}`}
        style={{ transform: `translateX(-${scrollOffset * 0.25 % screenWidth}px)` }}
      />
      
      {/* Terrain Features */}
      <div className="terrain-features">
        {visibleFeatures.map(feature => {
          const FeatureDef = TERRAIN_FEATURES[feature.type]
          if (!FeatureDef) return null
          
          return (
            <div
              key={feature.id}
              className={`terrain-feature-wrapper ${feature.layer} ${feature.biome}`}
              style={{
                left: feature.screenX,
                transform: `scale(${feature.scale})`,
                opacity: feature.opacity,
                zIndex: feature.zIndex,
              }}
            >
              {FeatureDef.render(feature.seed)}
            </div>
          )
        })}
      </div>
      
      {/* Platforms */}
      <div className="platforms-container">
        {visiblePlatforms.map(platform => (
          <div
            key={platform.id}
            className={`platform platform-${currentBiome.platformStyle}`}
            style={{
              left: platform.screenX,
              bottom: platform.height + 100, // 100px ground offset
              width: platform.width,
            }}
          >
            <div className="platform-surface" />
            <div className="platform-edge left" />
            <div className="platform-edge right" />
            <div className="platform-supports">
              <div className="support left" />
              <div className="support right" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Ladders */}
      <div className="ladders-container">
        {visibleLadders.map(ladder => (
          <div
            key={ladder.id}
            className={`ladder ladder-${currentBiome.ladderStyle}`}
            style={{
              left: ladder.screenX,
              bottom: ladder.bottomHeight + 100,
              height: ladder.topHeight - ladder.bottomHeight,
            }}
          >
            <div className="ladder-rail left" />
            <div className="ladder-rail right" />
            <div className="ladder-rungs">
              {Array.from({ length: Math.floor((ladder.topHeight - ladder.bottomHeight) / 25) }).map((_, i) => (
                <div key={i} className="rung" style={{ bottom: i * 25 + 10 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Dynamic Ground */}
      <div 
        className={`terrain-ground ${currentBiomeKey}`}
        style={{
          background: `linear-gradient(180deg, 
            ${currentBiome.groundColor[0]} 0%, 
            ${currentBiome.groundColor[1]} 50%, 
            ${currentBiome.groundColor[2]} 100%)`,
        }}
      />
      
      {/* Ground Detail Pattern */}
      <div 
        className={`terrain-ground-detail ${currentBiomeKey}`}
        style={{ transform: `translateX(-${scrollOffset % screenWidth}px)` }}
      />
      
      {/* Zone Indicator */}
      <div className="zone-indicator">
        <div className="zone-name">{currentBiome.name}</div>
        {transitionProgress > 0 && (
          <div className="zone-transition">
            → {nextBiome.name}
          </div>
        )}
      </div>
    </div>
  )
}

export default TerrainGenerator
