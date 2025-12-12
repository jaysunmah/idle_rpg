# Environment Variables Setup Guide

## Overview

This project uses Vite, which supports environment variables through `.env` files. Your game currently doesn't require any environment variables, but this guide will help you set them up for future needs.

## Current Status

✅ **Your project is ready to run without any environment setup!**

The game is entirely client-side with no external dependencies requiring configuration.

## Environment Files

Vite supports multiple environment files with different priorities:

1. **`.env`** - Default values (committed to git)
2. **`.env.local`** - Local overrides (ignored by git) ⚠️ **Use for secrets**
3. **`.env.production`** - Production-specific values
4. **`.env.development`** - Development-specific values

## How to Use Environment Variables

### 1. Creating Environment Files

We've created `.env.example` as a template. To use it:

```bash
# Copy the example file to create your local environment
cp .env.example .env.local
```

### 2. Accessing Variables in Code

In Vite, only variables prefixed with `VITE_` are exposed to your client-side code:

```javascript
// In any .jsx or .js file
const apiUrl = import.meta.env.VITE_API_URL
const appTitle = import.meta.env.VITE_APP_TITLE
const isDev = import.meta.env.DEV  // Built-in Vite variable
const isProd = import.meta.env.PROD  // Built-in Vite variable

console.log('App Title:', appTitle)
```

### 3. Built-in Vite Variables

Vite provides these variables automatically:

- `import.meta.env.MODE` - `"development"` or `"production"`
- `import.meta.env.DEV` - `true` in development
- `import.meta.env.PROD` - `true` in production
- `import.meta.env.BASE_URL` - Base URL of your app

## Common Use Cases

### Example 1: Adding an Analytics Service

```bash
# In .env.local
VITE_ANALYTICS_ID=your-analytics-id-here
```

```javascript
// In src/main.jsx
if (import.meta.env.VITE_ANALYTICS_ID) {
  initAnalytics(import.meta.env.VITE_ANALYTICS_ID)
}
```

### Example 2: API Integration

```bash
# In .env.local
VITE_API_URL=http://localhost:3000/api
```

```javascript
// In your API client
const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com'

async function fetchLeaderboard() {
  const response = await fetch(`${BASE_URL}/leaderboard`)
  return response.json()
}
```

### Example 3: Feature Flags

```bash
# In .env.local
VITE_ENABLE_DEBUG_MODE=true
```

```javascript
// In your game code
if (import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true') {
  console.log('Debug mode enabled')
  // Show debug UI
}
```

## Security Best Practices

⚠️ **IMPORTANT SECURITY NOTES:**

1. **Never commit secrets** - Use `.env.local` for API keys, tokens, etc.
2. **Client-side exposure** - All `VITE_` variables are exposed in your bundled JavaScript. Don't put secrets here!
3. **Use a backend** - For sensitive operations, always use a backend API
4. **Check your `.gitignore`** - Already configured to ignore `.env*.local` files ✅

## Files in This Project

- ✅ `.env` - Default values (safe to commit)
- ✅ `.env.example` - Template with all available options
- ✅ `.gitignore` - Already ignores `.env*.local`
- 📝 `ENVIRONMENT_SETUP.md` - This guide

## Testing Your Setup

1. Create a `.env.local` file with a test variable:
   ```bash
   echo "VITE_TEST_VAR=Hello from environment!" > .env.local
   ```

2. Add this to your `src/App.jsx` temporarily:
   ```javascript
   console.log('Environment Test:', import.meta.env.VITE_TEST_VAR)
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Check the browser console for your message

## When You Need Environment Variables

Consider using environment variables when you add:

- 🔌 **Backend API integration** - API URLs, endpoints
- 📊 **Analytics services** - Tracking IDs
- 🔐 **Authentication** - OAuth client IDs (not secrets!)
- 🎮 **Game configuration** - Feature flags, max levels, etc.
- 🌍 **Different environments** - Dev, staging, production settings

## Current Project Status

Your game currently:
- ✅ Runs entirely in the browser
- ✅ Has no external API dependencies
- ✅ Stores data in localStorage
- ✅ Doesn't require any environment setup

**You can start developing immediately with just `npm install && npm run dev`!**

## Questions?

For more information, see the [Vite Environment Variables documentation](https://vitejs.dev/guide/env-and-mode.html).
