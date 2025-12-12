# Environment Variables - Usage Examples

This document shows practical examples of how to use the environment variables in your Idle RPG game.

## 📦 Using the Config Module

I've created a `src/config.js` file that centralizes all environment variable access. Import it like this:

```javascript
import { APP_CONFIG, GAME_CONFIG, SAVE_CONFIG, log, debug } from './config'
```

## 🎮 Example 1: Update Page Title

**File: `index.html`**

Currently, your title is hardcoded. You can make it dynamic:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- This will use VITE_APP_TITLE from your .env file -->
    <title>%VITE_APP_TITLE%</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## 🎮 Example 2: Add Debug Logging

**File: `src/App.jsx`**

Add debug logging to track game state changes:

```javascript
import { log, debug, SAVE_CONFIG } from './config'

// In your handleCharacterSelect function
const handleCharacterSelect = useCallback((charId) => {
  log('Character selected:', charId)
  setSelectedCharacter(charId)
  setCharacter(getInitialStats(charId))
  setDistance(0)
  setKills(0)
  setGameState(GAME_STATE.PLAYING)
}, [getInitialStats])

// In your save interval
useEffect(() => {
  if (gameState !== GAME_STATE.PLAYING) return
  
  const saveInterval = setInterval(() => {
    debug('Auto-saving game state...')
    saveGame(gameStateRef.current)
  }, SAVE_CONFIG.saveInterval) // Uses env variable!
  
  return () => clearInterval(saveInterval)
}, [gameState])
```

## 🎮 Example 3: Configure Starting Stats

**File: `src/App.jsx`**

Use environment variables to adjust starting gold/level for testing:

```javascript
import { GAME_CONFIG } from './config'

const getInitialStats = useCallback((charId) => {
  const charData = getCharacter(charId)
  return {
    level: GAME_CONFIG.startingLevel, // From env variable
    xp: 0,
    xpToNext: 100,
    maxHealth: 100,
    health: 100,
    baseDamage: Math.floor(10 * charData.stats.damageMultiplier),
    critChance: 0.1 + charData.stats.critChanceBonus,
    critMultiplier: 2,
    attackSpeed: Math.floor(BASE_ATTACK_SPEED / charData.stats.attackSpeedMultiplier),
    gold: GAME_CONFIG.startingGold, // From env variable
  }
}, [])
```

## 🎮 Example 4: Feature Flags

Add new features that can be toggled via environment variables:

**Add to `.env.example`:**
```bash
# Feature Flags
VITE_ENABLE_DOUBLE_XP=false
VITE_ENABLE_CHEAT_MODE=false
```

**Add to `.env.local`:**
```bash
VITE_ENABLE_DOUBLE_XP=false
VITE_ENABLE_CHEAT_MODE=true  # Enable for testing
```

**Use in `src/config.js`:**
```javascript
export const FEATURE_FLAGS = {
  doubleXp: import.meta.env.VITE_ENABLE_DOUBLE_XP === 'true',
  cheatMode: import.meta.env.VITE_ENABLE_CHEAT_MODE === 'true',
}
```

**Use in `src/App.jsx`:**
```javascript
import { FEATURE_FLAGS } from './config'

// In your XP gain logic
const gainXP = (amount) => {
  const finalAmount = FEATURE_FLAGS.doubleXp ? amount * 2 : amount
  // ... rest of XP logic
}

// Add cheat mode button (only shows when enabled)
{FEATURE_FLAGS.cheatMode && (
  <button onClick={() => setCharacter(prev => ({ ...prev, gold: prev.gold + 1000 }))}>
    💰 +1000 Gold (Cheat)
  </button>
)}
```

## 🎮 Example 5: Different Game Modes

**Add to `.env.example`:**
```bash
# Game Modes: easy, normal, hard, nightmare
VITE_GAME_MODE=normal
VITE_DIFFICULTY_MULTIPLIER=1.0
```

**Use in game logic:**
```javascript
// src/config.js
export const DIFFICULTY = {
  mode: import.meta.env.VITE_GAME_MODE || 'normal',
  multiplier: parseFloat(import.meta.env.VITE_DIFFICULTY_MULTIPLIER || '1.0'),
}

// src/game/components/Enemy.jsx
import { DIFFICULTY } from '../../config'

// Apply difficulty multiplier to enemy stats
const enemyHealth = baseHealth * DIFFICULTY.multiplier
const enemyDamage = baseDamage * DIFFICULTY.multiplier
```

## 🎮 Example 6: API Integration (Future)

If you add backend features later:

**Add to `.env.example`:**
```bash
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=5000
VITE_ENABLE_LEADERBOARD=false
```

**Use in API calls:**
```javascript
// src/api/client.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '5000', 10)

export const submitScore = async (score) => {
  const response = await fetch(`${API_URL}/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
    signal: AbortSignal.timeout(API_TIMEOUT),
  })
  return response.json()
}
```

## 🧪 Testing Different Configurations

### Test with High Starting Gold
```bash
# .env.local
VITE_STARTING_GOLD=10000
VITE_STARTING_LEVEL=10
```

### Test with Debug Mode
```bash
# .env.local
VITE_ENABLE_DEBUG=true
VITE_ENABLE_LOGGING=true
```

### Test with Fast Save Interval
```bash
# .env.local
VITE_SAVE_INTERVAL=100  # Save every 100ms instead of 1000ms
```

## 🚀 Quick Testing Workflow

1. **Edit `.env.local`** with your test values
2. **Restart dev server:** `npm run dev`
3. **Test your changes** in the browser
4. **Check console** for debug logs (if enabled)

## 💡 Pro Tips

1. **Use feature flags** to develop new features without affecting production
2. **Set debug mode** in development to see detailed logs
3. **Test with different starting values** to speed up development
4. **Keep production values conservative** in `.env.production`
5. **Document new variables** in `.env.example` for your team

## 🎯 Common Patterns

### Pattern 1: Optional Features
```javascript
const ENABLE_FEATURE = import.meta.env.VITE_ENABLE_FEATURE === 'true'

if (ENABLE_FEATURE) {
  // Feature code
}
```

### Pattern 2: Numeric Configuration
```javascript
const VALUE = parseInt(import.meta.env.VITE_VALUE || '100', 10)
```

### Pattern 3: String Options
```javascript
const MODE = import.meta.env.VITE_MODE || 'default'

switch (MODE) {
  case 'easy': // ...
  case 'hard': // ...
  default: // ...
}
```

### Pattern 4: Environment-Specific Code
```javascript
if (import.meta.env.DEV) {
  console.log('Development only code')
}

if (import.meta.env.PROD) {
  // Production optimizations
}
```

---

**Need more examples?** Check `src/config.js` for the centralized configuration setup!
