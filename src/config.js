/**
 * Game Configuration
 * Centralizes all game constants and environment variables
 */

// Environment variables (with defaults)
export const CONFIG = {
  // App info
  appTitle: import.meta.env.VITE_APP_TITLE || 'Idle RPG',
  gameVersion: import.meta.env.VITE_GAME_VERSION || '0.0.1',
  
  // Development flags
  isDevelopment: import.meta.env.VITE_DEV_MODE === 'true',
  debugPhysics: import.meta.env.VITE_DEBUG_PHYSICS === 'true',
  showFPS: import.meta.env.VITE_SHOW_FPS === 'true',
  
  // Game settings
  baseAttackSpeed: parseInt(import.meta.env.VITE_BASE_ATTACK_SPEED || '1000'),
  autoSaveInterval: parseInt(import.meta.env.VITE_AUTO_SAVE_INTERVAL || '1000'),
  
  // Feature flags
  features: {
    multiplayer: import.meta.env.VITE_FEATURE_MULTIPLAYER === 'true',
    achievements: import.meta.env.VITE_FEATURE_ACHIEVEMENTS === 'true',
  },
  
  // API configuration (for future use)
  api: {
    baseUrl: import.meta.env.VITE_API_URL || '',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '5000'),
  },
}

// Log configuration in development mode
if (CONFIG.isDevelopment) {
  console.log('🎮 Game Configuration:', CONFIG)
}

export default CONFIG
