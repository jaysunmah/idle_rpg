/**
 * Environment Configuration
 * 
 * Centralized access to environment variables.
 * In Vite, use import.meta.env to access variables.
 * Only variables prefixed with VITE_ are exposed to the client.
 */

export const env = {
  // App Configuration
  appTitle: import.meta.env.VITE_APP_TITLE || 'Idle Quest',
  appVersion: import.meta.env.VITE_APP_VERSION || '0.0.0',
  
  // Development
  isDev: import.meta.env.DEV, // Built-in Vite variable
  isProd: import.meta.env.PROD, // Built-in Vite variable
  devMode: import.meta.env.VITE_DEV_MODE === 'true',
  
  // API Configuration (for future use)
  apiUrl: import.meta.env.VITE_API_URL || '',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '5000', 10),
  
  // Feature Flags
  enableDebugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // Analytics
  googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID || '',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  
  // Game Configuration
  maxSaveSlots: parseInt(import.meta.env.VITE_MAX_SAVE_SLOTS || '3', 10),
  autoSaveInterval: parseInt(import.meta.env.VITE_AUTO_SAVE_INTERVAL || '1000', 10),
}

// Log configuration in development (optional)
if (env.isDev && env.devMode) {
  console.log('🎮 Environment Configuration:', env)
}

export default env
