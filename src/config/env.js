/**
 * Environment Configuration
 * 
 * This file provides a centralized way to access environment variables
 * with type conversion and default values.
 */

/**
 * Get environment variable as string
 */
export const getEnvString = (key, defaultValue = '') => {
  return import.meta.env[key] || defaultValue
}

/**
 * Get environment variable as boolean
 */
export const getEnvBoolean = (key, defaultValue = false) => {
  const value = import.meta.env[key]
  if (value === undefined || value === null) return defaultValue
  return value === 'true' || value === true
}

/**
 * Get environment variable as number
 */
export const getEnvNumber = (key, defaultValue = 0) => {
  const value = import.meta.env[key]
  if (value === undefined || value === null) return defaultValue
  const parsed = Number(value)
  return isNaN(parsed) ? defaultValue : parsed
}

// Export commonly used environment variables
export const ENV = {
  // App Configuration
  APP_TITLE: getEnvString('VITE_APP_TITLE', 'Idle RPG'),
  APP_VERSION: getEnvString('VITE_APP_VERSION', '0.0.0'),
  
  // Development Settings
  DEBUG_MODE: getEnvBoolean('VITE_DEBUG_MODE', false),
  SHOW_PHYSICS_DEBUG: getEnvBoolean('VITE_SHOW_PHYSICS_DEBUG', false),
  
  // API Configuration (for future use)
  API_URL: getEnvString('VITE_API_URL', ''),
  API_TIMEOUT: getEnvNumber('VITE_API_TIMEOUT', 5000),
  
  // Game Configuration
  AUTO_SAVE_INTERVAL: getEnvNumber('VITE_AUTO_SAVE_INTERVAL', 1000),
  ENABLE_ANALYTICS: getEnvBoolean('VITE_ENABLE_ANALYTICS', false),
  
  // Build information
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
}

// Log configuration in development mode
if (ENV.DEV && ENV.DEBUG_MODE) {
  console.log('🔧 Environment Configuration:', ENV)
}

export default ENV
