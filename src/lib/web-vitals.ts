/**
 * Web Vitals tracking
 * Monitors Core Web Vitals (LCP, FID, CLS) and other performance metrics
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from './logger';

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: Metric) {
  // For now, just log metrics instead of sending to non-existent endpoint
  // TODO: Create /api/analytics/vitals endpoint or Supabase function
  logger.debug(`Web Vital: ${metric.name}`, {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
  });

  // Store in localStorage for later analysis
  try {
    const key = `web-vitals-${metric.name}`;
    const stored = localStorage.getItem(key);
    const metrics = stored ? JSON.parse(stored) : [];
    
    metrics.push({
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.pathname,
    });
    
    // Keep only last 50 measurements
    localStorage.setItem(key, JSON.stringify(metrics.slice(-50)));
  } catch (error) {
    // Ignore localStorage errors
  }

  // Uncomment when endpoint is ready:
  // const body = JSON.stringify({
  //   name: metric.name,
  //   value: metric.value,
  //   rating: metric.rating,
  //   delta: metric.delta,
  //   id: metric.id,
  //   navigationType: metric.navigationType,
  //   timestamp: Date.now(),
  //   url: window.location.href,
  // });
  //
  // if (navigator.sendBeacon) {
  //   navigator.sendBeacon('/api/analytics/vitals', body);
  // } else {
  //   fetch('/api/analytics/vitals', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body,
  //     keepalive: true,
  //   }).catch(() => {});
  // }
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals() {
  // Core Web Vitals
  onCLS(sendToAnalytics);  // Cumulative Layout Shift
  onINP(sendToAnalytics);  // Interaction to Next Paint (replaces FID)
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
    onINP((metric) => { metrics.INP = metric.value; checkComplete(); });
    onLCP((metric) => { metrics.LCP = metric.value; checkComplete(); }, { reportAllChanges: true });
    onFCP((metric) => { metrics.FCP = metric.value; checkComplete(); });
    onTTFB((metric) => { metrics.TTFB = metric.value; checkComplete(); });

    // Timeout after 3 seconds
    setTimeout(() => resolve(metrics), 3000);
  });
}

/**
 * Performance thresholds for each metric
 * Note: INP replaces FID as of 2024
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  INP: { good: 200, needsImprovement: 500 }, // Interaction to Next Paint
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
