# Environment Variables Setup Guide

## Current Status

✅ **Your project currently runs without any environment variables!**

The Idle Quest game is a pure client-side application and doesn't require environment variables to function. However, this guide explains how to use them if you need them in the future.

## How Environment Variables Work in Vite

Vite uses a special prefix system for environment variables:

- **`VITE_`** prefix: Variables with this prefix are exposed to your client code
- **No prefix**: Variables without this prefix are only available during build/dev server setup

### Example Usage

```javascript
// In your React components:
const apiUrl = import.meta.env.VITE_API_URL
const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true'
const isDev = import.meta.env.DEV  // Built-in Vite variable
const isProd = import.meta.env.PROD  // Built-in Vite variable
```

## Environment Files

Vite loads environment variables from these files (in order of priority):

1. `.env.local` - Local overrides (ignored by git, highest priority)
2. `.env.[mode].local` - Mode-specific local overrides (ignored by git)
3. `.env.[mode]` - Mode-specific variables (e.g., .env.development, .env.production)
4. `.env` - Default variables (lowest priority)

**Note:** `.env.local` is already ignored by git, so it's safe for sensitive data.

## Setup Instructions

### For Local Development

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your actual values:
   ```bash
   nano .env.local  # or use your preferred editor
   ```

3. Uncomment and fill in the variables you need

4. Restart your dev server:
   ```bash
   npm run dev
   ```

### For Production/Deployment

When deploying to services like Vercel, Netlify, or other platforms:

1. Go to your hosting platform's environment variables settings
2. Add each `VITE_` prefixed variable you need
3. The platform will inject these during build time

## Common Use Cases

### Debug Mode

```env
VITE_DEBUG_MODE=true
```

```javascript
// In your code:
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  console.log('Debug info:', gameState)
}
```

### API Integration

```env
VITE_API_URL=http://localhost:3000/api
```

```javascript
// In your code:
const response = await fetch(`${import.meta.env.VITE_API_URL}/scores`)
```

### Feature Flags

```env
VITE_ENABLE_MULTIPLAYER=false
```

```javascript
// In your code:
{import.meta.env.VITE_ENABLE_MULTIPLAYER === 'true' && <MultiplayerButton />}
```

## Important Security Notes

⚠️ **Never store sensitive secrets in VITE_ prefixed variables!**

- These variables are embedded in your client bundle
- Anyone can view them in the browser
- Only use them for non-sensitive configuration

❌ **DO NOT store:**
- API keys with write access
- Database credentials
- Authentication secrets
- Private tokens

✅ **Safe to store:**
- Public API endpoints
- Feature flags
- Debug settings
- Analytics IDs (public ones)
- Asset CDN URLs

## Testing Your Setup

Create a test component to verify environment variables:

```javascript
function EnvTest() {
  return (
    <div>
      <p>Mode: {import.meta.env.MODE}</p>
      <p>Dev: {import.meta.env.DEV ? 'Yes' : 'No'}</p>
      <p>Prod: {import.meta.env.PROD ? 'Yes' : 'No'}</p>
      <p>Base URL: {import.meta.env.BASE_URL}</p>
      {/* Add your custom variables here */}
    </div>
  )
}
```

## Troubleshooting

### Variables not updating?
- Restart the dev server after changing .env files
- Make sure variable names start with `VITE_`
- Check for typos in variable names

### Variables showing as undefined?
- Verify the variable exists in your .env file
- Check that you're using `import.meta.env.VITE_YOUR_VAR`
- Not `process.env.YOUR_VAR` (that's Node.js, not Vite)

### Need different values for different environments?
- Use `.env.development` for dev-specific values
- Use `.env.production` for production values
- Use `.env.local` for personal overrides

## Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Vite Config Reference](https://vitejs.dev/config/)

---

**Questions?** Check the Vite docs or create an issue in the project repository.
