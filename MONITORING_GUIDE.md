# Monitoring & Analytics Guide

Comprehensive guide for FretMaster's monitoring, analytics, and PWA capabilities.

## Table of Contents

- [Error Tracking (Sentry)](#error-tracking-sentry)
- [Performance Monitoring (Web Vitals)](#performance-monitoring-web-vitals)
- [User Analytics](#user-analytics)
- [A/B Testing](#ab-testing)
- [PWA Features](#pwa-features)
- [Admin Dashboard](#admin-dashboard)

## Error Tracking (Sentry)

### Setup

1. **Create Sentry account**: https://sentry.io
2. **Create project**: Select "React"
3. **Get DSN**: Copy the DSN from project settings
4. **Add to environment**:
   ```env
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   VITE_APP_VERSION=1.0.0
   ```

### Features

- **Automatic error capture**: All unhandled errors are sent to Sentry
- **Performance monitoring**: Track slow operations and API calls
- **Session replay**: Watch user sessions leading to errors
- **Breadcrumbs**: See user actions before error occurred
- **Source maps**: View original source code in error stack traces

### Usage

```typescript
import { captureException, addBreadcrumb, trackFeatureUsage } from '@/lib/sentry';

// Manual error capture
try {
  riskyOperation();
} catch (error) {
  captureException(error, { context: 'Additional info' });
}

// Track user actions
addBreadcrumb('User clicked chord diagram', { chordName: 'C Major' });

// Track feature usage
trackFeatureUsage('metronome', 'started', { bpm: 120 });
```

### Error Filtering

Errors are automatically filtered:
- ✅ **Captured**: Unexpected errors, API failures, render errors
- ❌ **Ignored**: Quota exceeded (handled gracefully), offline network errors

## Performance Monitoring (Web Vitals)

### Core Web Vitals

FretMaster tracks all Core Web Vitals:

1. **LCP** (Largest Contentful Paint): Loading performance
   - Good: < 2.5s
   - Needs improvement: 2.5s - 4s
   - Poor: > 4s

2. **FID** (First Input Delay): Interactivity
   - Good: < 100ms
   - Needs improvement: 100ms - 300ms
   - Poor: > 300ms

3. **CLS** (Cumulative Layout Shift): Visual stability
   - Good: < 0.1
   - Needs improvement: 0.1 - 0.25
   - Poor: > 0.25

### Additional Metrics

- **FCP** (First Contentful Paint): Time to first render
- **TTFB** (Time to First Byte): Server response time

### Viewing Metrics

Metrics are automatically sent to `/api/analytics/vitals` endpoint and displayed in the Admin Dashboard.

## User Analytics

### Tracked Events

```typescript
import { analytics } from '@/lib/analytics';

// Page views
analytics.page('Practice', { mode: 'standard' });

// Practice sessions
analytics.track('practice_start', { chordsCount: 10 });
analytics.track('practice_complete', { 
  duration: 600,
  chordsCount: 10,
  accuracy: 85.5 
});

// Feature usage
analytics.track('metronome_used', { bpm: 120, timeSignature: '4/4' });
analytics.track('chord_created', { chordName: 'C Major' });
analytics.track('achievement_unlocked', { achievementId: 'first-practice' });
```

### Data Storage

Analytics events are stored in Supabase `analytics_events` table with:
- User ID
- Session ID
- Event name
- Properties (JSON)
- Timestamp
- URL and referrer
- User agent

### Privacy

- Events are queued and batched (sent every 10 seconds)
- User IDs are anonymized in production
- No personally identifiable information (PII) is tracked

## A/B Testing

### Active Experiments

Experiments are defined in `src/lib/ab-testing.ts`:

```typescript
const EXPERIMENTS = [
  {
    id: 'metronome-voice-count',
    name: 'Metronome Voice Counting Default',
    variants: [
      { id: 'control', name: 'Voice Off by Default', weight: 50 },
      { id: 'treatment', name: 'Voice On by Default', weight: 50 },
    ],
    enabled: false,
  },
];
```

### Usage in Components

```typescript
import { useExperiment, isInTreatment } from '@/lib/ab-testing';

function MyComponent() {
  const variant = useExperiment('metronome-voice-count');
  
  // Or check if in treatment
  const showFeature = isInTreatment('metronome-voice-count');
  
  return (
    <div>
      {variant === 'treatment' ? <NewUI /> : <OldUI />}
    </div>
  );
}
```

### Variant Assignment

- Assignments are persistent (stored in localStorage)
- Weighted distribution (e.g., 50/50 split)
- Automatic tracking of assignments in analytics

### Best Practices

1. **Test one thing at a time**: Don't run conflicting experiments
2. **Set date ranges**: Define start/end dates for experiments
3. **Track conversion metrics**: Define success criteria before launching
4. **Statistical significance**: Run experiments until you have enough data
5. **Document results**: Record findings in Admin Dashboard

## PWA Features

### Install Prompt

Users see an install prompt after 30 seconds of usage:
- **Android/Desktop**: Native install dialog
- **iOS**: Instructions to "Add to Home Screen"
- **Dismissal**: Prompt reappears after 7 days if dismissed

### Service Worker

Caching strategies:
- **Network First**: API calls, user data (fresh data prioritized)
- **Cache First**: Static assets, images, fonts (fast loading)
- **Stale While Revalidate**: Chord library, achievements (balance speed and freshness)

### Offline Support

When offline:
- Cached pages load instantly
- User can browse chord library
- Practice data queued for sync
- "You're offline" banner shows connection status

### Background Sync

Queued operations sync automatically when connection is restored:
- Practice session saves
- Chord creations/edits
- Settings updates
- Achievement unlocks

### Push Notifications

Users can enable notifications for:
- **Practice reminders**: Daily, every other day, or weekly
- **Achievement unlocks**: "You earned First Practice badge!"
- **Streak milestones**: "3-day practice streak!"

Notifications work even when app is closed (via service worker).

### Shortcuts

App shortcuts for quick access:
- "Start Practice" → /chord-setup
- "Chord Library" → /chord-library
- "Tuner" → /tuner

## Admin Dashboard

Access at `/admin` (requires admin role).

### Sections

1. **Overview**
   - Total users
   - Active users (last 7 days)
   - Engagement rate
   - Retention rate

2. **Practice Statistics**
   - Total sessions
   - Total chords practiced
   - Average accuracy
   - Average session duration

3. **Feature Usage**
   - Metronome usage
   - Tuner usage
   - Chord editor usage
   - Custom chords created

4. **System Health**
   - Database status
   - Service worker status
   - Storage usage
   - Error rates

5. **Web Vitals**
   - LCP, FID, CLS scores
   - Performance trends
   - Device breakdowns

6. **A/B Tests**
   - Active experiments
   - Variant distribution
   - Conversion metrics

### Data Export

Export anonymized analytics data:
- CSV format for spreadsheet analysis
- JSON format for programmatic use
- Date range filtering
- Privacy-safe (no PII)

## Environment Variables

Required for full monitoring:

```env
# Sentry (production only)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0

# Analytics endpoint (optional)
VITE_ANALYTICS_ENDPOINT=https://your-analytics-api.com
```

## Production Checklist

Before deploying to production:

- [ ] Set `VITE_SENTRY_DSN` environment variable
- [ ] Test service worker in production build
- [ ] Verify PWA manifest is served correctly
- [ ] Enable at least one A/B test
- [ ] Set up Sentry alerts for error spikes
- [ ] Configure performance budgets
- [ ] Test offline functionality
- [ ] Verify push notifications work
- [ ] Test install prompt on mobile
- [ ] Review privacy policy for analytics tracking

## Debugging

### Local Testing

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Test service worker
# Open DevTools → Application → Service Workers
```

### Common Issues

**Service worker not registering**:
- Check console for registration errors
- Ensure HTTPS or localhost
- Verify `/sw.js` is accessible

**Install prompt not showing**:
- Must use HTTPS
- User must engage with site (30s minimum)
- Can't have dismissed recently (7-day cooldown)

**Analytics not sending**:
- Check network tab for failed requests
- Verify Supabase connection
- Check `analytics_events` table exists

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Web Vitals](https://web.dev/vitals/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Last Updated:** March 24, 2026  
**Maintained By:** FretMaster Development Team
