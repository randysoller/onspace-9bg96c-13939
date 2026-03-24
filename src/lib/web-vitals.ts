/**
 * Web Vitals tracking
 * Monitors Core Web Vitals (LCP, FID, CLS) and other performance metrics
 */

import { onCLS, onFID, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';
import { logger } from './logger';

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    url: window.location.href,
  });

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    // Fallback to fetch
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(error => {
      logger.error('Failed to send Web Vitals metric', error);
    });
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    logger.debug(`Web Vital: ${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
    });
  }
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals() {
  // Core Web Vitals
  onCLS(sendToAnalytics);  // Cumulative Layout Shift
  onFID(sendToAnalytics);  // First Input Delay
  onLCP(sendToAnalytics);  // Largest Contentful Paint
  
  // Additional metrics
  onFCP(sendToAnalytics);  // First Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte

  logger.info('Web Vitals tracking initialized');
}

/**
 * Get current Web Vitals metrics
 */
export async function getCurrentWebVitals(): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    const metrics: Record<string, number> = {};
    let count = 0;
    const expected = 5;

    const checkComplete = () => {
      count++;
      if (count === expected) {
        resolve(metrics);
      }
    };

    onCLS((metric) => { metrics.CLS = metric.value; checkComplete(); }, { reportAllChanges: true });
    onFID((metric) => { metrics.FID = metric.value; checkComplete(); });
    onLCP((metric) => { metrics.LCP = metric.value; checkComplete(); }, { reportAllChanges: true });
    onFCP((metric) => { metrics.FCP = metric.value; checkComplete(); });
    onTTFB((metric) => { metrics.TTFB = metric.value; checkComplete(); });

    // Timeout after 3 seconds
    setTimeout(() => resolve(metrics), 3000);
  });
}

/**
 * Performance thresholds for each metric
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

/**
 * Get rating for a metric value
 */
export function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];
  
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}
