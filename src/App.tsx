import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SkipToContent } from '@/components/SkipToContent';
import { useAuthStore } from '@/stores/authStore';
import { useCustomChordStore } from '@/stores/customChordStore';
import Index from '@/pages/Index';
import ChordSetup from '@/pages/ChordSetup';
import Practice from '@/pages/Practice';
import PracticeTest from '@/pages/PracticeTest';
import ProgressionSetup from '@/pages/ProgressionSetup';
import ProgressionPractice from '@/pages/ProgressionPractice';
import ChordEditor from '@/pages/ChordEditor';
import Tuner from '@/pages/Tuner';
import Auth from '@/pages/Auth';
import Goals from '@/pages/Goals';
import SongLibrary from '@/pages/SongLibrary';
import Settings from '@/pages/Settings';
import ScaleSetup from '@/pages/ScaleSetup';
import ScalePractice from '@/pages/ScalePractice';
import NotFound from '@/pages/NotFound';

// Lazy load heavy routes for code splitting and performance
const ChordLibrary = lazy(() => import('@/pages/ChordLibrary'));
const PracticeHistory = lazy(() => import('@/pages/PracticeHistory'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Achievements = lazy(() => import('@/pages/Achievements'));
const Challenges = lazy(() => import('@/pages/Challenges'));
const Lessons = lazy(() => import('@/pages/Lessons'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const DataExport = lazy(() => import('@/pages/DataExport'));
const Admin = lazy(() => import('@/pages/Admin'));

function App() {
  const user = useAuthStore(s => s.user);
  const syncFromSupabase = useCustomChordStore(s => s.syncFromSupabase);

  // Sync custom chords from Supabase whenever the user is authenticated.
  // This is the SINGLE authoritative sync path — useBackendSync is a no-op.
  // We watch user?.id and authLoading so we fire exactly once per login.
  const authLoading = useAuthStore(s => s.loading);
  useEffect(() => {
    if (authLoading) return;          // still initialising — wait
    if (!user?.id) return;            // not logged in — nothing to sync
    console.log('[FretMaster] App.tsx triggering syncFromSupabase for user:', user.id);
    syncFromSupabase(user.id);
  // user?.id changing means a different user logged in — re-sync
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  return (
    <ErrorBoundary>
      <SkipToContent />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/chord-setup" element={<ChordSetup />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/practice-test" element={<PracticeTest />} />
            <Route path="/progression-setup" element={<ProgressionSetup />} />
            <Route path="/progression-practice" element={<ProgressionPractice />} />
            <Route path="/library" element={
              <Suspense fallback={<LoadingSpinner fullScreen aria-label="Loading chord library" />}>
                <ChordLibrary />
              </Suspense>
            } />
            <Route 
              path="/editor" 
              element={
                <ErrorBoundary>
                  <ChordEditor />
                </ErrorBoundary>
              } 
            />
            <Route path="/tuner" element={<Tuner />} />
            <Route path="/history" element={
              <Suspense fallback={<LoadingSpinner fullScreen aria-label="Loading practice history" />}>
                <PracticeHistory />
              </Suspense>
            } />
            <Route path="/leaderboard" element={
              <Suspense fallback={<LoadingSpinner fullScreen aria-label="Loading leaderboard" />}>
                <Leaderboard />
              </Suspense>
            } />
            <Route path="/achievements" element={
              <Suspense fallback={<LoadingSpinner fullScreen aria-label="Loading achievements" />}>
                <Achievements />
              </Suspense>
            } />
            <Route path="/goals" element={<Goals />} />
            <Route path="/songs" element={<SongLibrary />} />
            <Route path="/analytics" element={
              <Suspense fallback={<LoadingSpinner fullScreen aria-label="Loading analytics" />}>
                <Analytics />
              </Suspense>
            } />
            <Route path="/settings" element={<Settings />} />
            <Route path="/lessons" element={
              <Suspense fallback={<LoadingSpinner fullScreen aria-label="Loading lessons" />}>
                <Lessons />
              </Suspense>
            } />
            <Route path="/challenges" element={
              <Suspense fallback={<LoadingSpinner fullScreen aria-label="Loading challenges" />}>
                <Challenges />
              </Suspense>
            } />
            <Route path="/scale-setup" element={<ScaleSetup />} />
            <Route path="/scale-practice" element={<ScalePractice />} />
            <Route path="/data-export" element={
              <Suspense fallback={<LoadingSpinner fullScreen aria-label="Loading data export" />}>
                <DataExport />
              </Suspense>
            } />
            <Route path="/admin" element={
              <Suspense fallback={<LoadingSpinner fullScreen aria-label="Loading admin dashboard" />}>
                <Admin />
              </Suspense>
            } />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
