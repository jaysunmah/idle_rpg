# Environment Variables Setup Guide

## Overview

This project uses Vite's environment variable system. This guide will help you understand and configure environment variables for the Idle Quest game.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your preferred settings

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Environment Files Priority

Vite loads environment files in this order (later files override earlier ones):

1. `.env` - Loaded in all cases
2. `.env.local` - Loaded in all cases, ignored by git (for personal settings)
3. `.env.[mode]` - Loaded only in specified mode (e.g., `.env.development`)
4. `.env.[mode].local` - Loaded only in specified mode, ignored by git

### Which File Should You Use?

- **`.env.local`** - Your personal development settings (NOT committed to git)
- **`.env.development`** - Shared development settings (committed to git)
- **`.env.production`** - Production build settings (committed to git)
- **`.env.example`** - Template file showing all available variables (committed to git)

## Available Environment Variables

### App Configuration

```bash
# App Title (shown in browser tab)
VITE_APP_TITLE=Idle Quest - Side Scroller RPG

# App Version
VITE_APP_VERSION=0.0.0
```

### Development Settings

```bash
# Enable debug mode (shows additional console logs)
VITE_DEBUG_MODE=true

# Show FPS counter (useful for performance monitoring)
VITE_SHOW_FPS=true
```

### Game Configuration

```bash
# Starting level for new players
VITE_STARTING_LEVEL=1

# Starting gold for new players
VITE_STARTING_GOLD=0
```

### API Configuration (Future Use)

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000

# API request timeout in milliseconds
VITE_API_TIMEOUT=5000
```

### Analytics (Future Use)

```bash
# Analytics service ID
VITE_ANALYTICS_ID=your-analytics-id

# Enable/disable analytics
VITE_ANALYTICS_ENABLED=false
```

## Using Environment Variables in Code

### Method 1: Direct Access

```javascript
// Access directly in any component or file
const apiUrl = import.meta.env.VITE_API_URL;
const isDebug = import.meta.env.VITE_DEBUG_MODE === 'true';
```

### Method 2: Using the Config File (Recommended)

```javascript
// Import the centralized config
import config from './config';

// Use typed configuration values
console.log(config.appTitle);
console.log(config.debugMode); // Already converted to boolean
console.log(config.startingGold); // Already converted to number
```

## Built-in Vite Variables

Vite provides these variables automatically:

- `import.meta.env.MODE` - The mode the app is running in ('development' or 'production')
- `import.meta.env.DEV` - Boolean, true in development
- `import.meta.env.PROD` - Boolean, true in production
- `import.meta.env.BASE_URL` - The base URL the app is being served from

## Important Rules

### ⚠️ Security

1. **NEVER commit `.env.local` files** - These are gitignored for security
2. **Only prefix with `VITE_`** - Variables without this prefix won't be exposed to your code
3. **Don't store secrets** - Environment variables are embedded in the client-side code
4. **Use backend for sensitive data** - API keys, passwords, etc. should stay on the server

### ✅ Best Practices

1. **Use `.env.example`** - Always update this when adding new variables
2. **Document variables** - Add comments explaining what each variable does
3. **Provide defaults** - Your code should work even if env vars aren't set
4. **Type conversion** - Remember env vars are always strings, convert as needed

## Common Use Cases

### Example 1: Debug Mode

```javascript
import config from './config';

if (config.debugMode) {
  console.log('Game state:', gameState);
}
```

### Example 2: Different API Endpoints

```javascript
// .env.development
VITE_API_URL=http://localhost:3000

// .env.production
VITE_API_URL=https://api.idlequest.com

// In your code:
import config from './config';

fetch(`${config.apiUrl}/save-game`, { ... });
```

### Example 3: Feature Flags

```javascript
// .env.local
VITE_ENABLE_NEW_FEATURE=true

// In your code:
const showNewFeature = import.meta.env.VITE_ENABLE_NEW_FEATURE === 'true';

{showNewFeature && <NewFeatureComponent />}
```

## Troubleshooting

### Variables Not Working?

1. **Check the prefix** - Must start with `VITE_`
2. **Restart dev server** - Vite only loads env vars on startup
3. **Check file name** - Must be exactly `.env`, `.env.local`, etc.
4. **Check file location** - Env files must be in project root
5. **Check syntax** - No spaces around `=`, no quotes needed usually

### Example Debug Session

```javascript
// Add this to your main.jsx temporarily:
console.log('All env vars:', import.meta.env);
console.log('Config:', config);
```

## Testing Different Configurations

### Run with specific mode:

```bash
# Development mode (default for npm run dev)
npm run dev

# Production mode
npm run build
npm run preview

# Custom mode
vite --mode staging
```

## Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Vite Modes](https://vitejs.dev/guide/env-and-mode.html#modes)

## Need Help?

If you're having trouble with environment variables:

1. Check the `.env.example` file for all available options
2. Verify your variable names have the `VITE_` prefix
3. Restart your development server after changing env files
4. Check the browser console for the config object (in debug mode)
