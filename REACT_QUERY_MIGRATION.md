# React Query Migration Guide

React Query is now enabled! This provides automatic caching, background refetching, and better performance.

## ✅ What's Enabled

- **QueryClientProvider** - Wrapped around your entire app
- **Automatic caching** - API responses cached for 5 minutes
- **Background refetching** - Data refreshes when window regains focus
- **Retry logic** - Failed requests automatically retry 3 times
- **Query invalidation** - Smart cache updates when data changes

## 📋 Current Status

**Your app works exactly as before** - React Query is enabled but not actively used yet. All your existing code (direct Supabase calls, Zustand stores) still works perfectly.

## 🔄 Gradual Migration (Optional)

You can **optionally** migrate pages to use React Query hooks for even better performance. Here's the recommended order:

### Phase 1: Read-Only Pages (Safest)
Start with pages that only fetch data (no mutations):

1. **Leaderboard** - Already lazy-loaded, low risk
   ```tsx
   // Instead of:
   const { data, error } = await supabase.from('leaderboard_cache').select('*');
   
   // Use:
   const { data, error, isLoading } = useLeaderboard(period);
   ```

2. **Practice History** - Benefits from caching
   ```tsx
   const { data: sessions, isLoading } = usePracticeSessions(userId);
   ```

3. **Achievements** - Static data, great for caching
   ```tsx
   const { data: achievements } = useUserAchievements(userId);
   ```

### Phase 2: Pages with Mutations (Medium Risk)
Pages that create/update data:

1. **Settings** - Optimistic updates improve UX
   ```tsx
   const { mutate: updateSettings } = useUpdateSettings(userId);
   ```

2. **Goals** - Create/update with instant feedback
   ```tsx
   const { mutate: createGoal } = useCreateGoal(userId);
   const { mutate: updateGoal } = useUpdateGoal(userId);
   ```

3. **Custom Chords** - Library management
   ```tsx
   const { data: chords } = useCustomChords(userId);
   const { mutate: createChord } = useCreateCustomChord(userId);
   const { mutate: deleteChord } = useDeleteCustomChord(userId);
   ```

### Phase 3: Real-Time Pages (Advanced)
Pages with active practice sessions - keep Zustand for now:

- **Practice** - Real-time audio detection, keep current implementation
- **Metronome** - Keep current Web Audio API implementation
- **Tuner** - Keep current pitch detection

## 🎯 Benefits You Get Now

Even without migrating any pages, you get:

1. **Error handling** - Centralized error logging and user-friendly toasts
2. **Cache infrastructure** - Ready when you need it
3. **Network resilience** - Automatic retry on failures
4. **DevTools ready** - Can add React Query DevTools for debugging

## 📊 Monitoring React Query

To see React Query in action, add DevTools (optional):

```tsx
// In main.tsx (optional debugging tool)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add inside QueryClientProvider:
<ReactQueryDevtools initialIsOpen={false} />
```

This shows:
- Active queries
- Cache status
- Refetch timing
- Network activity

## 🚨 Important Notes

1. **No Breaking Changes** - Your existing code continues to work
2. **Migrate Gradually** - Test each page individually
3. **Keep Zustand** - For UI state, audio state, practice sessions (real-time)
4. **Use React Query** - For server data (leaderboard, achievements, settings)
5. **Test Thoroughly** - Check each migrated page before moving to next

## 🔧 Available Hooks

All custom hooks are ready in `src/hooks/useQueryHooks.ts`:

### Data Fetching
- `usePracticeSessions(userId)` - Get practice history
- `useLeaderboard(period)` - Get leaderboard rankings
- `useCustomChords(userId)` - Get custom chords
- `useUserSettings(userId)` - Get user settings
- `useUserAchievements(userId)` - Get achievements
- `useGoals(userId)` - Get practice goals
- `usePracticeStreak(userId)` - Get streak data

### Mutations (Create/Update/Delete)
- `useCreatePracticeSession(userId)` - Save session with optimistic updates
- `useCreateCustomChord(userId)` - Create chord with instant feedback
- `useDeleteCustomChord(userId)` - Delete with optimistic removal
- `useUpdateSettings(userId)` - Update with instant preview
- `useCreateGoal(userId)` - Create goal
- `useUpdateGoal(userId)` - Update goal progress

## 💡 Example Migration

Here's how to migrate the **Leaderboard** page:

### Before (Direct Supabase):
```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    const { data, error } = await supabase
      .from('leaderboard_cache')
      .select('*')
      .eq('period', period);
    
    if (data) setData(data);
    setLoading(false);
  };
  loadData();
}, [period]);
```

### After (React Query):
```tsx
const { data = [], isLoading } = useLeaderboard(period);
// That's it! Automatic caching, refetching, error handling
```

## 📈 Recommended Next Steps

1. **Test your app thoroughly** - Make sure everything still works
2. **Try migrating Leaderboard first** - Low risk, high benefit
3. **Monitor performance** - Compare before/after load times
4. **Gradually add more pages** - One at a time, test each

## ❓ Need Help?

If you encounter any issues:
1. Check browser console for errors
2. Verify network tab for failed requests
3. Check that `@tanstack/react-query` is installed
4. Revert individual page if needed (keep existing Supabase code)

---

**Remember:** React Query is now active but **optional to use**. Your app is stable and you can migrate pages at your own pace!
