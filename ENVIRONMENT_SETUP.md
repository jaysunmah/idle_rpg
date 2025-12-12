# Environment Variables Setup Guide

## Overview

This project uses Vite's environment variable system. Environment variables allow you to configure your application without hardcoding values.

## Important: Vite Environment Variables

⚠️ **In Vite, only variables prefixed with `VITE_` are exposed to your client-side code.**

- ✅ `VITE_API_URL` - Accessible in your app
- ❌ `API_URL` - NOT accessible in your app

## Files

### `.env.example`
- Template file showing all available environment variables
- **Committed to git** for team reference
- Copy this to create your local environment file

### `.env.local`
- Your personal environment variables
- **NOT committed to git** (git-ignored for security)
- Use this for local development

### `.env`
- Alternative to `.env.local`
- Also git-ignored
- `.env.local` takes precedence if both exist

## Setup Instructions

### 1. Create Your Local Environment File

```bash
# Copy the example file
cp .env.example .env.local

# Edit it with your values
nano .env.local  # or use your preferred editor
```

### 2. Configure Your Variables

Edit `.env.local` and set your values:

```env
VITE_APP_TITLE=Idle Quest
VITE_DEV_MODE=true
# Add more as needed...
```

### 3. Access Variables in Code

Use the centralized config module:

```javascript
// Import the config
import { env } from './config/env'

// Use environment variables
console.log(env.appTitle)
console.log(env.isDev)
```

Or access directly:

```javascript
// Direct access
const apiUrl = import.meta.env.VITE_API_URL
const isProduction = import.meta.env.PROD
```

## Built-in Vite Variables

Vite provides these variables automatically:

- `import.meta.env.MODE` - Current mode ('development' or 'production')
- `import.meta.env.DEV` - Boolean, true in development
- `import.meta.env.PROD` - Boolean, true in production
- `import.meta.env.BASE_URL` - Base URL of the app

## Different Environment Files

You can create environment files for different scenarios:

- `.env` - Loaded in all cases
- `.env.local` - Loaded in all cases, git-ignored
- `.env.development` - Loaded in development mode
- `.env.production` - Loaded in production mode
- `.env.development.local` - Local overrides for development
- `.env.production.local` - Local overrides for production

**Priority order (highest to lowest):**
1. `.env.[mode].local`
2. `.env.[mode]`
3. `.env.local`
4. `.env`

## Common Use Cases

### 1. API Configuration

```env
VITE_API_URL=https://api.example.com
VITE_API_TIMEOUT=5000
```

### 2. Feature Flags

```env
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_ANALYTICS=false
```

### 3. Analytics Services

```env
VITE_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

## Security Best Practices

1. ✅ **DO** use environment variables for:
   - API endpoints
   - Feature flags
   - Public API keys (that are meant to be public)
   - Configuration that changes between environments

2. ❌ **DON'T** use environment variables for:
   - Private API keys or secrets (remember: client-side code is public!)
   - Sensitive data
   - Passwords or authentication tokens

3. 🔒 **Remember**: All `VITE_*` variables are embedded in the client bundle and visible to users. Never store secrets in client-side environment variables!

## Troubleshooting

### Variables Not Updating?

1. Restart the dev server after changing `.env` files:
```bash
npm run dev
```

2. Check that your variable starts with `VITE_`

3. Verify the variable is defined in your `.env.local` file

### Variables Showing as Undefined?

1. Make sure you're using `import.meta.env.VITE_*` (not `process.env`)
2. Check the variable name matches exactly (case-sensitive)
3. Verify the file is named correctly (`.env.local` not `.env.local.txt`)

## Current Project Status

**Your project currently runs without any required environment variables.** The game works entirely client-side with no external services. However, this setup is ready for when you add:

- Backend API integration
- Analytics tracking
- Feature flags
- Third-party services

## Example: Using Environment Variables in Your Game

If you want to use the configured variables, here's an example:

```javascript
// src/App.jsx
import { env } from './config/env'

function App() {
  // Use environment variables
  if (env.enableDebugMode) {
    console.log('Debug mode enabled')
  }
  
  // Change save interval based on configuration
  const saveInterval = env.autoSaveInterval
  
  // ... rest of your app
}
```

## Need Help?

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- Check `.env.example` for all available variables
- Contact your team for production environment values
