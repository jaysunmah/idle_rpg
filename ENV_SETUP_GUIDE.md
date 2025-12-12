# Environment Variables Setup Guide

## Quick Start

Your Idle Quest game currently **doesn't require any environment variables** to run. However, this guide will help you set them up for future features.

## How to Set Up

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your values:**
   ```bash
   # Open in your preferred editor
   nano .env.local
   # or
   code .env.local
   ```

3. **Restart your dev server** to pick up the changes:
   ```bash
   npm run dev
   ```

## Important Vite Rules

### 1. Use the `VITE_` Prefix
In Vite, **only variables prefixed with `VITE_` are exposed** to your client-side code:

```bash
# ✅ EXPOSED to client
VITE_API_URL=https://api.example.com

# ❌ NOT EXPOSED to client (for security)
SECRET_KEY=my-secret-key
```

### 2. Access Variables in Code
Use `import.meta.env` to access environment variables:

```javascript
// src/App.jsx or any component
const apiUrl = import.meta.env.VITE_API_URL
const isDev = import.meta.env.DEV // Built-in Vite variable
const mode = import.meta.env.MODE // "development" or "production"

console.log('API URL:', apiUrl)
```

### 3. Environment Files Priority
Vite loads environment files in this order (later files override earlier ones):

1. `.env` - Loaded in all cases
2. `.env.local` - Loaded in all cases, ignored by git (your personal config)
3. `.env.[mode]` - Only loaded in specified mode (e.g., `.env.production`)
4. `.env.[mode].local` - Only loaded in specified mode, ignored by git

## Example Use Cases

### Adding Analytics

1. Add to `.env.local`:
   ```bash
   VITE_GA_TRACKING_ID=G-XXXXXXXXXX
   ```

2. Use in your app:
   ```javascript
   // src/main.jsx
   if (import.meta.env.VITE_GA_TRACKING_ID) {
     // Initialize Google Analytics
     gtag('config', import.meta.env.VITE_GA_TRACKING_ID)
   }
   ```

### Adding a Backend API

1. Add to `.env.local`:
   ```bash
   VITE_API_URL=http://localhost:3000
   ```

2. Use in your app:
   ```javascript
   // src/game/api.js
   const API_URL = import.meta.env.VITE_API_URL || 'https://api.production.com'
   
   export async function saveScore(score) {
     const response = await fetch(`${API_URL}/scores`, {
       method: 'POST',
       body: JSON.stringify({ score })
     })
     return response.json()
   }
   ```

### Feature Flags

1. Add to `.env.local`:
   ```bash
   VITE_ENABLE_DEBUG_MODE=true
   VITE_ENABLE_CHEATS=true
   ```

2. Use in your app:
   ```javascript
   // src/App.jsx
   const isDebugMode = import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true'
   const enableCheats = import.meta.env.VITE_ENABLE_CHEATS === 'true'
   
   function App() {
     return (
       <div>
         {isDebugMode && <DebugPanel />}
         {enableCheats && <CheatMenu />}
         {/* ... */}
       </div>
     )
   }
   ```

## Security Best Practices

1. **Never commit `.env.local` or `.env` files** with sensitive data
2. **Never put secrets in `VITE_` variables** - they're exposed to the browser
3. **Use `.env.example`** to document what variables are needed
4. **Use backend environment variables** for sensitive API keys

## Built-in Vite Environment Variables

These are always available without the `VITE_` prefix:

- `import.meta.env.MODE` - `"development"` or `"production"`
- `import.meta.env.DEV` - `true` in development
- `import.meta.env.PROD` - `true` in production
- `import.meta.env.BASE_URL` - The base URL the app is served from
- `import.meta.env.SSR` - `true` if running in server-side rendering

## TypeScript Support (Optional)

If you convert to TypeScript later, create `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GA_TRACKING_ID: string
  readonly VITE_ENABLE_DEBUG_MODE: string
  // Add more as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## Troubleshooting

### Variables not loading?
- ✅ Make sure they start with `VITE_`
- ✅ Restart your dev server after changing `.env` files
- ✅ Check the file is named exactly `.env.local` (not `.env.local.txt`)

### Variable is undefined?
- ✅ Use `import.meta.env.VITE_YOUR_VAR` not `process.env.VITE_YOUR_VAR`
- ✅ Check for typos in the variable name
- ✅ Remember that boolean values are strings: `"true"` not `true`

## More Information

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
