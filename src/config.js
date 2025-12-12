/**
 * Application Configuration
 * Centralized configuration using environment variables
 */

// Application Info
export const APP_CONFIG = {
  title: import.meta.env.VITE_APP_TITLE || 'Idle RPG',
  version: import.meta.env.VITE_APP_VERSION || '0.0.0',
}

// Development Settings
export const DEV_CONFIG = {
  debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  logging: import.meta.env.VITE_ENABLE_LOGGING === 'true',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
}

// Game Configuration
export const GAME_CONFIG = {
  mode: import.meta.env.VITE_GAME_MODE || 'normal',
  startingGold: parseInt(import.meta.env.VITE_STARTING_GOLD || '0', 10),
  startingLevel: parseInt(import.meta.env.VITE_STARTING_LEVEL || '1', 10),
}

// Save System Configuration
export const SAVE_CONFIG = {
  autoSaveEnabled: import.meta.env.VITE_ENABLE_AUTO_SAVE !== 'false',
  saveInterval: parseInt(import.meta.env.VITE_SAVE_INTERVAL || '1000', 10),
}

// Helper function for conditional logging
export const log = (...args) => {
  if (DEV_CONFIG.logging) {
    console.log('[Idle RPG]', ...args)
  }
}

// Helper function for debug logging
export const debug = (...args) => {
  if (DEV_CONFIG.debug) {
    console.debug('[DEBUG]', ...args)
  }
}

// Log configuration on startup (only in development)
if (DEV_CONFIG.isDevelopment) {
  console.log('🎮 Idle RPG Configuration:', {
    app: APP_CONFIG,
    dev: DEV_CONFIG,
    game: GAME_CONFIG,
    save: SAVE_CONFIG,
  })
}
