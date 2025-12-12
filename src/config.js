/**
 * Application Configuration
 * Access environment variables through this centralized config
 */

export const config = {
  // App Information
  appTitle: import.meta.env.VITE_APP_TITLE || 'Idle Quest - Side Scroller RPG',
  appVersion: import.meta.env.VITE_APP_VERSION || '0.0.0',
  
  // Development Settings
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  showFPS: import.meta.env.VITE_SHOW_FPS === 'true',
  
  // Game Configuration
  startingLevel: parseInt(import.meta.env.VITE_STARTING_LEVEL) || 1,
  startingGold: parseInt(import.meta.env.VITE_STARTING_GOLD) || 0,
  
  // API Configuration (for future use)
  apiUrl: import.meta.env.VITE_API_URL || '',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 5000,
  
  // Analytics (for future use)
  analyticsId: import.meta.env.VITE_ANALYTICS_ID || '',
  analyticsEnabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
  
  // Environment Info
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

// Log configuration in development mode
if (config.isDevelopment && config.debugMode) {
  console.log('🎮 Game Configuration:', config);
}

export default config;
