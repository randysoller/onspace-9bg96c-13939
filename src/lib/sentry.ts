/**
 * Sentry error tracking configuration
 * Captures errors, performance metrics, and user feedback
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error and performance monitoring
 */
export function initSentry() {
  try {
    // Only initialize in production
    if (import.meta.env.MODE !== 'production') {
      console.log('Sentry disabled in development mode');
      return;
    }

    // Skip if no DSN provided
    if (!import.meta.env.VITE_SENTRY_DSN) {
      console.log('Sentry DSN not configured');
      return;
    }

    Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Environment
    environment: import.meta.env.MODE,
    
    // Release tracking
    release: `fretmaster@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out expected errors
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Ignore quota exceeded errors (handled gracefully)
        if (error.message.includes('QuotaExceededError')) {
          return null;
        }
        
        // Ignore network errors during offline mode
        if (error.message.includes('Failed to fetch') && !navigator.onLine) {
          return null;
        }
      }
      
      return event;
    },
  });
    
    console.log('Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
    // Don't throw - allow app to continue without Sentry
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context on logout
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for user actions
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Manually capture exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture performance transaction
 * Note: Use Sentry.startSpan in newer versions
 */
export function startPerformanceTrace(name: string, op: string) {
  // Modern Sentry API uses startSpan or manual transactions
  addBreadcrumb(`Performance: ${name}`, { op });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string, action: string, metadata?: Record<string, any>) {
  addBreadcrumb(`Feature: ${feature} - ${action}`, metadata);
  
  // Also send as custom event
  Sentry.captureMessage(`Feature Usage: ${feature} - ${action}`, {
    level: 'info',
    tags: {
      feature,
      action,
    },
    extra: metadata,
  });
}
