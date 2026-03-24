import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';
import Index from '@/pages/Index';
import ChordSetup from '@/pages/ChordSetup';
import Practice from '@/pages/Practice';
import ProgressionSetup from '@/pages/ProgressionSetup';
import ProgressionPractice from '@/pages/ProgressionPractice';
import ChordLibrary from '@/pages/ChordLibrary';
import ChordEditor from '@/pages/ChordEditor';
import Tuner from '@/pages/Tuner';
import Auth from '@/pages/Auth';
import PracticeHistory from '@/pages/PracticeHistory';
import Leaderboard from '@/pages/Leaderboard';
import Achievements from '@/pages/Achievements';
import Goals from '@/pages/Goals';
import SongLibrary from '@/pages/SongLibrary';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import Lessons from '@/pages/Lessons';
import Challenges from '@/pages/Challenges';
import ScaleSetup from '@/pages/ScaleSetup';
import ScalePractice from '@/pages/ScalePractice';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/chord-setup" element={<ChordSetup />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/progression-setup" element={<ProgressionSetup />} />
            <Route path="/progression-practice" element={<ProgressionPractice />} />
            <Route path="/library" element={<ChordLibrary />} />
            <Route 
              path="/editor" 
              element={
                <ErrorBoundary>
                  <ChordEditor />
                </ErrorBoundary>
              } 
            />
            <Route path="/tuner" element={<Tuner />} />
            <Route path="/history" element={<PracticeHistory />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/songs" element={<SongLibrary />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/scale-setup" element={<ScaleSetup />} />
            <Route path="/scale-practice" element={<ScalePractice />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
