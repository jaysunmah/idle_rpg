/// <reference types="vite/client" />

/**
 * Environment Variables Type Definitions
 * 
 * Add your VITE_ prefixed environment variables here for autocomplete support.
 * Update this file when you add new environment variables to .env files.
 */

interface ImportMetaEnv {
  // Built-in Vite variables
  readonly MODE: string
  readonly BASE_URL: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly SSR: boolean

  // Custom environment variables (uncomment and add as needed)
  // readonly VITE_API_URL?: string
  // readonly VITE_API_KEY?: string
  // readonly VITE_ENABLE_DEBUG_MODE?: string
  // readonly VITE_ENABLE_ANALYTICS?: string
  // readonly VITE_MAX_PLAYER_LEVEL?: string
  // readonly VITE_STARTING_GOLD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
