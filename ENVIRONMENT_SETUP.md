# Environment Variables Setup Guide

## 📋 Overview

This project uses environment variables to configure different aspects of the application. Since this is a **Vite + React** project, there are specific rules for how environment variables work.

## 🔑 Important: Vite Environment Variable Rules

1. **Only variables prefixed with `VITE_` are exposed to your client-side code**
2. Variables without the `VITE_` prefix are only available during build/server processes
3. Environment variables are **statically replaced** at build time
4. Never put sensitive data (API keys, secrets) in `VITE_` variables - they're public in the browser!

## 📁 Environment Files

Your project now has three environment files:

### `.env.example`
- Template file showing all available environment variables
- **Committed to git** - safe to share
- Use this as reference when setting up new environments

### `.env.local`
- Your **local development** configuration
- **Not committed to git** (gitignored)
- Override values here for your personal development
- Already created with development defaults

### `.env.production`
- **Production** build configuration
- **Committed to git** - contains production defaults
- Used automatically when running `npm run build`

## 🚀 Quick Start

### For Development:
```bash
# The .env.local file is already created with defaults
# You can edit it if you want different values:
npm run dev
```

### For Production Build:
```bash
# Uses .env.production automatically
npm run build
npm run preview
```

## 🎮 Available Environment Variables

### Application Configuration
- `VITE_APP_TITLE` - Application title (shown in browser tab)
- `VITE_APP_VERSION` - Current version number

### Development Settings
- `VITE_ENABLE_DEBUG` - Enable debug mode features
- `VITE_ENABLE_LOGGING` - Enable console logging

### Game Configuration
- `VITE_GAME_MODE` - Game difficulty mode
- `VITE_STARTING_GOLD` - Starting gold amount
- `VITE_STARTING_LEVEL` - Starting character level

### Save System
- `VITE_ENABLE_AUTO_SAVE` - Enable automatic game saving
- `VITE_SAVE_INTERVAL` - Auto-save interval in milliseconds

## 💻 Using Environment Variables in Code

To use environment variables in your React components:

```javascript
// Access environment variables
const appTitle = import.meta.env.VITE_APP_TITLE
const isDebugMode = import.meta.env.VITE_ENABLE_DEBUG === 'true'

// Check current mode
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

// Example usage
console.log(`Running ${appTitle} in ${import.meta.env.MODE} mode`)
```

### Built-in Vite Variables (always available):
- `import.meta.env.MODE` - Current mode ('development' or 'production')
- `import.meta.env.DEV` - Boolean, true in development
- `import.meta.env.PROD` - Boolean, true in production
- `import.meta.env.BASE_URL` - Base URL of the app

## 🔧 Customization

### Adding New Variables

1. Add to `.env.example` (with comments):
```bash
# New Feature Toggle
VITE_ENABLE_NEW_FEATURE=false
```

2. Add to `.env.local` (your local value):
```bash
VITE_ENABLE_NEW_FEATURE=true
```

3. Add to `.env.production` (production value):
```bash
VITE_ENABLE_NEW_FEATURE=false
```

4. Use in your code:
```javascript
if (import.meta.env.VITE_ENABLE_NEW_FEATURE === 'true') {
  // Feature code here
}
```

### Variable Types

**⚠️ Important:** All environment variables are strings! Convert them as needed:

```javascript
// Boolean conversion
const isEnabled = import.meta.env.VITE_ENABLE_DEBUG === 'true'

// Number conversion
const interval = parseInt(import.meta.env.VITE_SAVE_INTERVAL, 10)

// Default values
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
```

## 📝 Best Practices

1. ✅ **Always use `VITE_` prefix** for client-side variables
2. ✅ **Keep `.env.example` updated** when adding new variables
3. ✅ **Use descriptive names** with proper prefixes (e.g., `VITE_API_URL`, `VITE_ENABLE_LOGGING`)
4. ✅ **Document each variable** with comments in `.env.example`
5. ❌ **Never commit `.env.local`** (it's already gitignored)
6. ❌ **Never put secrets in `VITE_` variables** (they're visible in browser)
7. ✅ **Provide sensible defaults** in `.env.production`

## 🔍 Troubleshooting

### Variables not updating?
1. Restart the dev server (`npm run dev`)
2. Environment variables are loaded at startup, not hot-reloaded

### Variable showing as undefined?
1. Check it has `VITE_` prefix
2. Check spelling in both `.env` file and code
3. Restart dev server

### Different values in different environments?
```bash
# Development (uses .env.local)
npm run dev

# Production (uses .env.production)
npm run build

# Preview production build
npm run preview
```

## 🔐 Security Notes

- Environment variables with `VITE_` prefix are **publicly visible** in the browser
- Never store API keys, passwords, or secrets in `VITE_` variables
- For sensitive data, use a backend API to handle authentication
- `.env.local` is gitignored to prevent accidentally committing secrets

## 📚 Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [React Environment Variables Best Practices](https://create-react-app.dev/docs/adding-custom-environment-variables/)

## 🎯 Next Steps

Now that your environment is set up:

1. ✅ Review the variables in `.env.local` and adjust as needed
2. ✅ Start your development server: `npm run dev`
3. ✅ (Optional) Integrate these variables into your game logic
4. ✅ Test that different configurations work as expected

---

**Questions?** Check the Vite documentation or review this guide for common patterns.
