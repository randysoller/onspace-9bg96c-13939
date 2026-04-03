/**
 * useBackendSync — DEPRECATED.
 *
 * Supabase sync is now handled exclusively in App.tsx via a single
 * `syncFromSupabase(user.id)` call that fires once after auth resolves.
 *
 * This hook is intentionally a no-op. It is kept here only so existing
 * call-sites (e.g. Index.tsx) don't break at import-time while they are
 * being cleaned up. Remove all call-sites and then delete this file.
 */
export const useBackendSync = () => {
  // intentionally empty — sync lives in App.tsx
};
