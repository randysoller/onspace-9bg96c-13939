/**
 * Prefetch integration utilities
 * Automatically prefetch data based on user navigation patterns
 */

import { prefetchStrategies } from './react-query';
import { logger } from './logger';

/**
 * Set up intelligent prefetching based on current page
 * Call this from strategic navigation points
 */
export function setupPrefetching(currentRoute: string, userId?: string) {
  if (!userId) return;

  logger.info('Setting up prefetch for route', { currentRoute, userId });

  switch (currentRoute) {
    case '/practice':
    case '/chord-setup':
      // Prefetch custom chords when entering practice mode
      prefetchStrategies.prefetchChordLibrary(userId);
      break;

    case '/practice-history':
    case '/analytics':
      // Prefetch leaderboard and profile when viewing stats
      prefetchStrategies.prefetchLeaderboard();
      prefetchStrategies.prefetchProfile(userId);
      break;

    case '/':
    case '/index':
      // Prefetch common data on home page
      prefetchStrategies.prefetchPracticeHistory(userId);
      break;

    default:
      break;
  }
}

/**
 * Prefetch on hover for navigation links
 * Attach to navigation button onMouseEnter events
 */
export function prefetchOnHover(route: string, userId?: string) {
  if (!userId) return;

  const prefetchMap: Record<string, () => void> = {
    '/practice-history': () => prefetchStrategies.prefetchPracticeHistory(userId),
    '/leaderboard': () => prefetchStrategies.prefetchLeaderboard(),
    '/analytics': () => prefetchStrategies.prefetchProfile(userId),
    '/library': () => prefetchStrategies.prefetchChordLibrary(userId),
  };

  const prefetchFn = prefetchMap[route];
  if (prefetchFn) {
    logger.debug('Prefetching on hover', { route });
    prefetchFn();
  }
}
