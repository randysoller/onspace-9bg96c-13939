import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import Index from '@/pages/Index';
import ChordSetup from '@/pages/ChordSetup';
import Practice from '@/pages/Practice';
import ProgressionSetup from '@/pages/ProgressionSetup';
import ProgressionPractice from '@/pages/ProgressionPractice';
import ChordLibrary from '@/pages/ChordLibrary';
import ChordEditor from '@/pages/ChordEditor';
import Tuner from '@/pages/Tuner';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/chord-setup" element={<ChordSetup />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/progression-setup" element={<ProgressionSetup />} />
          <Route path="/progression-practice" element={<ProgressionPractice />} />
          <Route path="/library" element={<ChordLibrary />} />
          <Route path="/editor" element={<ChordEditor />} />
          <Route path="/tuner" element={<Tuner />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
