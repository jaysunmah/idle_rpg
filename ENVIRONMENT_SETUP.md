# Environment Variables Setup Guide

## Overview

This project uses **Vite's environment variable system** to manage configuration across different environments (development, staging, production).

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your local settings** (the file is already created for you)

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Important Rules for Vite Environment Variables

### 🔑 Key Concepts

1. **VITE_ Prefix Required**: Only variables prefixed with `VITE_` are exposed to your client code
   - ✅ `VITE_APP_TITLE` - Accessible in code
   - ❌ `APP_TITLE` - NOT accessible in code

2. **Access in Code**: Use `import.meta.env.VITE_VARIABLE_NAME`
   ```javascript
   const appTitle = import.meta.env.VITE_APP_TITLE
   const isDev = import.meta.env.VITE_DEV_MODE === 'true'
   ```

3. **Type Coercion**: All environment variables are strings by default
   ```javascript
   // Convert to boolean
   const isEnabled = import.meta.env.VITE_FEATURE_MULTIPLAYER === 'true'
   
   // Convert to number
   const attackSpeed = parseInt(import.meta.env.VITE_BASE_ATTACK_SPEED || '1000')
   ```

## Available Environment Variables

### Application Configuration
- `VITE_APP_TITLE` - The game title (displayed in UI/title bar)
- `VITE_GAME_VERSION` - Current game version

### Development Settings
- `VITE_DEV_MODE` - Enable development features (true/false)
- `VITE_DEBUG_PHYSICS` - Show physics debug visualizations (true/false)
- `VITE_SHOW_FPS` - Display FPS counter (true/false)

### Game Configuration
- `VITE_BASE_ATTACK_SPEED` - Default attack speed in milliseconds
- `VITE_AUTO_SAVE_INTERVAL` - Auto-save interval in milliseconds

### Feature Flags
- `VITE_FEATURE_MULTIPLAYER` - Enable multiplayer features (true/false)
- `VITE_FEATURE_ACHIEVEMENTS` - Enable achievements system (true/false)

### API Configuration (Future Use)
- `VITE_API_URL` - Backend API base URL
- `VITE_API_TIMEOUT` - API request timeout in milliseconds

## Example Usage in Code

### Basic Usage
```javascript
// In App.jsx or any component
const gameVersion = import.meta.env.VITE_GAME_VERSION || '0.0.1'
const isDevelopment = import.meta.env.VITE_DEV_MODE === 'true'

console.log(`Game Version: ${gameVersion}`)
if (isDevelopment) {
  console.log('Running in development mode')
}
```

### Using in Game Constants
```javascript
// In a constants file
export const GAME_CONFIG = {
  baseAttackSpeed: parseInt(import.meta.env.VITE_BASE_ATTACK_SPEED || '1000'),
  autoSaveInterval: parseInt(import.meta.env.VITE_AUTO_SAVE_INTERVAL || '1000'),
  showFPS: import.meta.env.VITE_SHOW_FPS === 'true',
  debugPhysics: import.meta.env.VITE_DEBUG_PHYSICS === 'true',
}
```

### Conditional Features
```javascript
// Feature flag example
function App() {
  const achievementsEnabled = import.meta.env.VITE_FEATURE_ACHIEVEMENTS === 'true'
  
  return (
    <div>
      {achievementsEnabled && <AchievementsPanel />}
    </div>
  )
}
```

## Environment Files

| File | Purpose | Committed to Git? |
|------|---------|------------------|
| `.env` | Local development variables | ❌ No (gitignored) |
| `.env.example` | Template for required variables | ✅ Yes |
| `.env.local` | Local overrides (highest priority) | ❌ No (gitignored) |
| `.env.production` | Production-specific variables | ✅ Yes (if needed) |

## Built-in Vite Variables

Vite provides some built-in environment variables:

- `import.meta.env.MODE` - Current mode ('development' or 'production')
- `import.meta.env.DEV` - Boolean, true in development
- `import.meta.env.PROD` - Boolean, true in production
- `import.meta.env.BASE_URL` - The base URL the app is being served from

## Best Practices

1. **Never commit sensitive data**: Keep API keys, passwords, and secrets out of `.env` files
2. **Use `.env.example`**: Document all required variables here
3. **Type checking**: Always provide defaults and validate types
4. **Restart dev server**: Changes to `.env` require restarting `npm run dev`
5. **Don't expose secrets**: Remember, `VITE_` variables are public in the client bundle

## Troubleshooting

### Variables not updating?
- **Restart the dev server** - Vite only loads `.env` on startup
- Check that variable has `VITE_` prefix
- Check for typos in variable name

### Variable is undefined?
- Ensure it starts with `VITE_`
- Check that `.env` file exists in project root
- Verify no spaces around `=` sign: `VITE_VAR=value` not `VITE_VAR = value`

### TypeScript errors?
Create `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_GAME_VERSION: string
  readonly VITE_DEV_MODE: string
  // Add other variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## Security Notes

⚠️ **Important**: All `VITE_*` variables are **embedded in the client bundle** and are **publicly visible**. Never store:
- API keys
- Passwords
- Private tokens
- Sensitive credentials

For sensitive data, use a backend API that validates requests server-side.

## Need Help?

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- Check `.env.example` for all available variables
- Ensure you're using the correct prefix (`VITE_`)
