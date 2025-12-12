# Environment Variables Guide

## Overview

This project uses Vite's built-in environment variable support. Environment variables allow you to configure your application without hardcoding values in your source code.

## How to Use Environment Variables

### 1. Create Your `.env` File

A template `.env` file has been created for you. You can modify it to add your own variables:

```bash
# Copy the example file if needed
cp .env.example .env
```

### 2. Important Rules

- **Only variables prefixed with `VITE_` are exposed to your client-side code**
- Variables without the `VITE_` prefix are only available during the build process
- Never commit `.env` files with sensitive data (already ignored in `.gitignore`)

### 3. Accessing Environment Variables in Code

In your React components or JavaScript files:

```javascript
// Access environment variables
const apiUrl = import.meta.env.VITE_API_URL;
const apiKey = import.meta.env.VITE_API_KEY;
const isDebug = import.meta.env.VITE_ENABLE_DEBUG === 'true';

// Built-in Vite variables (always available)
const mode = import.meta.env.MODE; // 'development' or 'production'
const isDev = import.meta.env.DEV; // boolean
const isProd = import.meta.env.PROD; // boolean
```

### 4. Different Environment Files

Vite supports multiple environment files:

- `.env` - Loaded in all cases
- `.env.local` - Loaded in all cases, ignored by git
- `.env.[mode]` - Only loaded in specified mode (e.g., `.env.production`)
- `.env.[mode].local` - Only loaded in specified mode, ignored by git

Priority (highest to lowest):
1. `.env.[mode].local`
2. `.env.[mode]`
3. `.env.local`
4. `.env`

### 5. Example Use Cases for Your Game

#### Feature Flags
```javascript
// In your game code
if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
  console.log('Debug mode enabled');
  // Show debug UI, extra logging, etc.
}
```

#### Game Configuration
```javascript
// In game/constants.js
export const MAX_ENEMIES = parseInt(import.meta.env.VITE_MAX_ENEMIES) || 10;
export const STARTING_GOLD = parseInt(import.meta.env.VITE_STARTING_GOLD) || 0;
```

#### API Integration (for future features like leaderboards)
```javascript
// In api/client.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function submitScore(score) {
  const response = await fetch(`${API_URL}/scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`
    },
    body: JSON.stringify({ score })
  });
  return response.json();
}
```

## Current Status

Your project currently **does not use any environment variables**. The files have been set up for you to use when needed.

## Security Best Practices

1. ✅ Never commit `.env` files with sensitive data
2. ✅ Use `.env.example` as a template (safe to commit)
3. ✅ Only expose necessary variables with `VITE_` prefix
4. ⚠️ Remember: All `VITE_` variables are visible in the browser - never store secrets here
5. 💡 For truly sensitive data, use a backend API

## Testing Your Setup

To verify environment variables are working:

1. Add a test variable to `.env`:
   ```
   VITE_TEST_MESSAGE=Hello from environment!
   ```

2. Add this to your `App.jsx`:
   ```javascript
   console.log('Test message:', import.meta.env.VITE_TEST_MESSAGE);
   ```

3. Restart your dev server:
   ```bash
   npm run dev
   ```

4. Check the browser console - you should see your message!

## Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Environment Variables Best Practices](https://12factor.net/config)
