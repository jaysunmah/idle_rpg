# Environment Variables Setup Guide

## Overview
This project uses Vite, which has built-in support for environment variables. Currently, the game doesn't require any environment variables to run, but this guide will help you set them up for future features.

## Environment Files

### File Structure
```
.env                # Loaded in all cases (default values)
.env.local          # Loaded in all cases, ignored by git (your local overrides)
.env.development    # Loaded during development only
.env.production     # Loaded during production build only
.env.example        # Template file (commit to git)
```

### Priority Order
Vite loads environment files in this priority (highest to lowest):
1. `.env.[mode].local` (e.g., `.env.production.local`)
2. `.env.[mode]` (e.g., `.env.production`)
3. `.env.local`
4. `.env`

## Important Rules for Vite Environment Variables

### 1. Prefix Requirement
⚠️ **All environment variables must start with `VITE_` to be exposed to your app**

```bash
# ✅ CORRECT - Will be accessible
VITE_API_URL=https://api.example.com

# ❌ WRONG - Will NOT be accessible in your code
API_URL=https://api.example.com
```

### 2. Accessing Variables in Code
```javascript
// Access environment variables using import.meta.env
const apiUrl = import.meta.env.VITE_API_URL
const isDev = import.meta.env.DEV  // Built-in Vite variable
const isProd = import.meta.env.PROD  // Built-in Vite variable
```

### 3. Built-in Variables
Vite provides these automatically:
- `import.meta.env.MODE` - Current mode ('development' or 'production')
- `import.meta.env.DEV` - Boolean, true in development
- `import.meta.env.PROD` - Boolean, true in production
- `import.meta.env.BASE_URL` - Base URL the app is being served from

## Setup Instructions

### Step 1: Copy Example File
```bash
cp .env.example .env.local
```

### Step 2: Edit `.env.local`
Open `.env.local` and add your values:
```bash
# Example: Enable debug mode
VITE_ENABLE_DEBUG_MODE=true

# Example: Add API endpoint (when you add a backend)
VITE_API_URL=http://localhost:3000
```

### Step 3: Use in Your Code
```javascript
// src/App.jsx or any component
const debugMode = import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true'

if (debugMode) {
  console.log('Debug mode is enabled')
}
```

### Step 4: Restart Dev Server
⚠️ **Important**: After changing environment variables, you must restart the dev server:
```bash
npm run dev
```

## Security Best Practices

### ✅ DO:
- Prefix all client-exposed variables with `VITE_`
- Keep sensitive keys in `.env.local` (already gitignored)
- Commit `.env.example` with placeholder values
- Document all required variables in `.env.example`

### ❌ DON'T:
- Store secret API keys that should only be on a backend
- Commit `.env.local` or `.env*.local` files to git
- Use environment variables for large amounts of data
- Forget to restart the dev server after changes

## Common Use Cases

### 1. Feature Flags
```bash
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_LEADERBOARD=false
```

```javascript
// In your code
if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
  initializeAnalytics()
}
```

### 2. API Configuration
```bash
VITE_API_URL=https://api.yourgame.com
VITE_API_TIMEOUT=5000
```

```javascript
// In your code
const response = await fetch(`${import.meta.env.VITE_API_URL}/scores`)
```

### 3. Debug Mode
```bash
VITE_DEBUG_MODE=true
VITE_SHOW_PHYSICS_DEBUG=true
```

```javascript
// In your game code
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  console.log('Player position:', playerPos)
}
```

## TypeScript Support (Optional)

If you want autocomplete for your environment variables, create `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ENABLE_DEBUG_MODE: string
  // Add more environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## Troubleshooting

### Variables are undefined
1. ✅ Check that the variable starts with `VITE_`
2. ✅ Restart the dev server
3. ✅ Verify the variable is in `.env.local` or `.env`
4. ✅ Check for typos in the variable name

### Variables not updating
- You must restart the dev server (`npm run dev`) after changing `.env` files
- Environment variables are embedded at build time, not runtime

### Production builds
For production:
```bash
# Build with production environment
npm run build

# Preview production build
npm run preview
```

## Current Project Status

✅ **Setup Complete**
- `.env.example` created (template file)
- `.env.local` created (for your local values)
- `.gitignore` already configured to protect `.env*.local` files

⚠️ **No Variables Required Yet**
- Your game currently runs without any environment variables
- Add variables as you expand features (analytics, backend, etc.)

## Next Steps

When you need to add environment variables:
1. Add the variable to `.env.example` with a comment and placeholder
2. Add the actual value to `.env.local`
3. Use `import.meta.env.VITE_YOUR_VARIABLE` in your code
4. Restart the dev server
5. Update this documentation if needed

## Questions?

For more information, see the [Vite Environment Variables documentation](https://vitejs.dev/guide/env-and-mode.html).
