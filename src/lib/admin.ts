/**
 * Admin access control for FretMaster.
 *
 * To grant admin access:
 *  1. Sign up / log in with your account.
 *  2. Open DevTools Console and run:
 *       (await import('/src/lib/supabase.ts')).supabase.auth.getUser().then(d => console.log(d.data.user?.id))
 *  3. Paste the printed UUID into ADMIN_USER_IDS below.
 *  4. Only users whose ID appears in this list can open the Chord Editor.
 */

export const ADMIN_USER_IDS: ReadonlySet<string> = new Set([
  '40b66412-d322-4f08-9799-269570e0ceea',
]);

export function isAdmin(userId: string | undefined | null): boolean {
  if (!userId) return false;
  return ADMIN_USER_IDS.has(userId);
}
