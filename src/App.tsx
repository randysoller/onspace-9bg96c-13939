import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Practice from '@/pages/Practice';
import ChordLibrary from '@/pages/ChordLibrary';
import ChordEditor from '@/pages/ChordEditor';
import Tuner from '@/pages/Tuner';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<Practice />} />
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
