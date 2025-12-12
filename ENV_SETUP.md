# Environment Variables Setup Guide

## Overview

This project uses Vite's environment variable system. All environment variables must be prefixed with `VITE_` to be accessible in your client-side code.

## File Structure

- **`.env`** - Default variables (committed to git)
- **`.env.local`** - Local overrides (gitignored, create this for your personal settings)
- **`.env.development`** - Development mode variables
- **`.env.production`** - Production build variables
- **`.env.example`** - Template showing all available variables

## Priority Order

Vite loads environment variables in this priority (highest to lowest):

1. `.env.[mode].local` (e.g., `.env.development.local`)
2. `.env.[mode]` (e.g., `.env.development`)
3. `.env.local`
4. `.env`

## Quick Start

### 1. Create your local environment file:

```bash
cp .env.example .env.local
```

### 2. Edit `.env.local` with your personal settings:

```bash
# Add your specific configuration
VITE_DEBUG_MODE=true
```

### 3. Use environment variables in your code:

```javascript
// In any React component or JavaScript file
const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true'
const appTitle = import.meta.env.VITE_APP_TITLE

console.log('Debug mode:', debugMode)
console.log('App title:', appTitle)
```

## Important Notes

⚠️ **Security Warning**: 
- ALL `VITE_` prefixed variables are exposed to the client-side code
- NEVER store secrets, API keys, or sensitive data in these variables
- They will be visible in the built JavaScript bundle

## Example Usage

Here's how you might use environment variables in your game:

### In `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
```

### In your React components:
```javascript
// src/App.jsx
const isDebug = import.meta.env.VITE_DEBUG_MODE === 'true'
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

if (isDebug) {
  console.log('Running in debug mode')
}
```

## Common Use Cases

1. **Feature Flags**: Toggle features on/off
2. **API Endpoints**: Different URLs for dev/staging/production
3. **Debug Settings**: Enable/disable logging or physics debug views
4. **Analytics**: Toggle analytics collection
5. **App Configuration**: Titles, versions, timeouts

## Verification

To verify your environment variables are loaded:

```javascript
console.log(import.meta.env)
```

This will show all available environment variables in the console.

## Need Help?

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- Check `.env.example` for all available variables
