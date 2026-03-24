/**
 * User analytics tracking
 * Tracks feature usage, user engagement, and conversion metrics
 */

import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Analytics event types
 */
export type AnalyticsEvent = 
  | 'page_view'
  | 'practice_start'
  | 'practice_complete'
  | 'chord_created'
  | 'chord_edited'
  | 'metronome_used'
  | 'tuner_used'
  | 'achievement_unlocked'
  | 'goal_created'
  | 'preset_saved'
  | 'feature_enabled'
  | 'feature_disabled';

/**
 * Analytics properties
 */
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null;
}

/**
 * Analytics service
 */
class Analytics {
  private userId: string | null = null;
  private sessionId: string = this.generateSessionId();
  private queue: any[] = [];
  private flushInterval: number | null = null;

  constructor() {
    // Flush queue every 10 seconds
    this.flushInterval = window.setInterval(() => this.flush(), 10000);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string | null) {
    this.userId = userId;
    logger.info('Analytics user ID set', { userId });
  }

  /**
   * Track analytics event
   */
  track(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    const eventData = {
      event,
      properties: properties || {},
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    };

    this.queue.push(eventData);
    
    logger.debug('Analytics event tracked', eventData);

    // Flush immediately for important events
    if (['practice_complete', 'achievement_unlocked'].includes(event)) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  page(pageName: string, properties?: AnalyticsProperties) {
    this.track('page_view', {
      page: pageName,
      ...properties,
    });
  }

  /**
   * Flush queued events to server
   */
  async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // Send to Supabase or external analytics service
      const { error } = await supabase
        .from('analytics_events')
        .insert(events);

      if (error) {
        logger.error('Failed to send analytics events', error);
        // Re-queue events on failure
        this.queue.push(...events);
      } else {
        logger.debug(`Flushed ${events.length} analytics events`);
      }
    } catch (error) {
      logger.error('Analytics flush error', error);
      // Re-queue events on error
      this.queue.push(...events);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Singleton instance
export const analytics = new Analytics();

/**
 * Track feature usage
 */
export function trackFeature(feature: string, action: string, metadata?: AnalyticsProperties) {
  analytics.track('feature_enabled', {
    feature,
    action,
    ...metadata,
  });
}

/**
 * Track practice session
 */
export function trackPracticeSession(data: {
  duration: number;
  chordsCount: number;
  accuracy: number;
}) {
  analytics.track('practice_complete', data);
}

/**
 * Track chord creation/editing
 */
export function trackChordAction(action: 'created' | 'edited', chordName: string) {
  analytics.track(action === 'created' ? 'chord_created' : 'chord_edited', {
    chordName,
  });
}
