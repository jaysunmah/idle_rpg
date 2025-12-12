# Environment Variables Setup Guide

## Current Status
✅ **No environment variables are currently required** to run this project.

This is a pure frontend application with no backend dependencies, API calls, or external services.

## How to Use Environment Variables (When Needed)

### Vite Environment Variables

Vite has built-in support for environment variables:

1. **Create your environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Important Rules:**
   - Only variables prefixed with `VITE_` are exposed to your client-side code
   - Files are loaded in this order (later files override earlier):
     - `.env` - Defaults for all environments
     - `.env.local` - Local overrides (gitignored)
     - `.env.[mode]` - Mode-specific (e.g., `.env.production`)
     - `.env.[mode].local` - Mode-specific local overrides

3. **Access in your code:**
   ```javascript
   // In any .js/.jsx file
   const apiUrl = import.meta.env.VITE_API_URL
   const isDev = import.meta.env.DEV // Built-in
   const isProd = import.meta.env.PROD // Built-in
   ```

### Example: Adding an API

If you add a backend API, here's how to set it up:

1. **Add to `.env.local`:**
   ```bash
   VITE_API_URL=http://localhost:3000/api
   ```

2. **Use in your code:**
   ```javascript
   // src/api/client.js
   const API_URL = import.meta.env.VITE_API_URL || 'https://api.production.com'

   export async function fetchPlayerData(playerId) {
     const response = await fetch(`${API_URL}/players/${playerId}`)
     return response.json()
   }
   ```

3. **For production:**
   Create `.env.production`:
   ```bash
   VITE_API_URL=https://api.yourgame.com
   ```

### Security Best Practices

⚠️ **NEVER commit sensitive data** like API keys, secrets, or passwords

- ✅ Use `.env.local` for sensitive local values (gitignored)
- ✅ Use `.env.example` as a template (committed)
- ✅ Remember: All `VITE_*` variables are PUBLIC in the browser
- ❌ Don't put secret keys in environment variables (use backend instead)
- ❌ Don't commit `.env.local` or `.env.production`

### Common Use Cases

#### Analytics
```bash
# .env.local
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

```javascript
// src/analytics.js
if (import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
  // Initialize analytics
  gtag('config', import.meta.env.VITE_GOOGLE_ANALYTICS_ID)
}
```

#### Feature Flags
```bash
# .env
VITE_ENABLE_EXPERIMENTAL_FEATURES=false

# .env.local (for testing)
VITE_ENABLE_EXPERIMENTAL_FEATURES=true
```

```javascript
// src/features.js
export const FEATURES = {
  experimental: import.meta.env.VITE_ENABLE_EXPERIMENTAL_FEATURES === 'true'
}
```

#### Different Builds
```bash
# .env.development
VITE_API_URL=http://localhost:3000

# .env.staging
VITE_API_URL=https://staging-api.yourgame.com

# .env.production
VITE_API_URL=https://api.yourgame.com
```

### Built-in Variables

Vite provides these automatically:
- `import.meta.env.MODE` - Current mode ('development', 'production', etc.)
- `import.meta.env.DEV` - Boolean, true in development
- `import.meta.env.PROD` - Boolean, true in production
- `import.meta.env.BASE_URL` - Base URL your app is served from

### Commands

```bash
# Run with development environment
npm run dev

# Build for production (uses .env.production if it exists)
npm run build

# Build for staging
vite build --mode staging

# Preview production build locally
npm run preview
```

## Quick Start (When You Need It)

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your values

3. Restart your dev server:
   ```bash
   npm run dev
   ```

4. Access variables in code:
   ```javascript
   const myValue = import.meta.env.VITE_MY_VARIABLE
   ```

## Need Help?

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- Remember: Only `VITE_*` prefixed variables are exposed to your app
- Never commit `.env.local` files (they're gitignored)

---

**Current Project Status:** No environment variables needed at this time. This guide is here for when you expand your game with backend features, analytics, or other integrations.
