import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';
import MetronomeModal from '@/components/features/MetronomeModal';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white overflow-x-hidden" style={{ position: 'relative' }}>
      <Header />
      <main className="pt-16 pb-20 md:pb-8" style={{ minHeight: '100vh', position: 'relative' }}>
        <Outlet />
      </main>
      <MobileTabBar />
      <MetronomeModal />
    </div>
  );
};
