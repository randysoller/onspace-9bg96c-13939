
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Grid3x3, Music2, ChevronRight, Scale, Sliders, Triangle, Waves, Mic2, Zap } from 'lucide-react';
import { useBackendSync } from '@/hooks/useBackendSync';
import { toast } from 'sonner';

// ── Vault card definitions ─────────────────────────────────────────────────
const VAULT_CARDS = [
  {
    id: 'chord-vault',
    label: 'Chord Vault',
    Icon: Grid3x3,
    accentColor: '#10b981',
    bgColor: 'rgba(16,185,129,0.07)',
    borderColor: 'rgba(16,185,129,0.25)',
    route: '/library',
    soon: false,
  },
  {
    id: 'strum-vault',
    label: 'Strum Pattern Vault',
    Icon: Sliders,
    accentColor: '#f97316',
    bgColor: 'rgba(249,115,22,0.07)',
    borderColor: 'rgba(249,115,22,0.25)',
    route: null,
    soon: true,
  },
  {
    id: 'triad-vault',
    label: 'Triad Vault',
    Icon: Triangle,
    accentColor: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.07)',
    borderColor: 'rgba(139,92,246,0.25)',
    route: null,
    soon: true,
  },
  {
    id: 'scale-vault',
    label: 'Scale Vault',
    Icon: Waves,
    accentColor: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.07)',
    borderColor: 'rgba(6,182,212,0.25)',
    route: null,
    soon: true,
  },
  {
    id: 'lick-lab',
    label: 'Lick Lab',
    Icon: Mic2,
    accentColor: '#f43f5e',
    bgColor: 'rgba(244,63,94,0.07)',
    borderColor: 'rgba(244,63,94,0.25)',
    route: null,
    soon: true,
  },
  {
    id: 'riff-arena',
    label: 'Riff Arena',
    Icon: Zap,
    accentColor: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.07)',
    borderColor: 'rgba(245,158,11,0.25)',
    route: null,
    soon: true,
  },
] as const;

export default function Index() {
  const navigate = useNavigate();
  
  // Sync user data from backend when authenticated
  useBackendSync();

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="container mx-auto px-4 pt-4 pb-10 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            What Do You Want to
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold text-amber-500">
            Play Today?
          </h2>
        </div>

        {/* Practice Mode Cards */}
        <div className="space-y-3">
          {/* Chords Card */}
          <motion.button
            onClick={() => navigate('/chord-setup')}
            whileHover={{ scale: 1.015 }}
            transition={{ duration: 0.2 }}
            className="w-full text-left bg-zinc-900/50 border border-zinc-800 border-t-4 border-t-emerald-500 rounded-xl p-5 hover:bg-emerald-500/[0.07] hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-colors group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-shadow duration-200">
                <Grid3x3 className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-white">Chords</h3>
                  <div className="flex items-center gap-1.5 text-emerald-500 group-hover:text-emerald-400 font-semibold text-sm transition-all group-hover:gap-2 flex-shrink-0">
                    Start
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-sm leading-relaxed">
                  <span className="font-bold text-emerald-400 text-[17px]">Play your first real sounds.</span>{' '}
                  <span className="text-zinc-400">Learn chords with guidance, feedback, and real progress you can feel.</span>
                </p>
              </div>
            </div>
          </motion.button>

          {/* Chord Progressions Card */}
          <motion.button
            onClick={() => navigate('/progression-setup')}
            whileHover={{ scale: 1.015 }}
            transition={{ duration: 0.2 }}
            className="w-full text-left bg-zinc-900/50 border border-zinc-800 border-t-4 border-t-purple-500 rounded-xl p-5 hover:bg-purple-500/[0.07] hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-colors group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30 transition-shadow duration-200">
                <Music2 className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Chord Progressions</h3>
                  <div className="flex items-center gap-1.5 text-purple-500 group-hover:text-purple-400 font-semibold text-sm transition-all group-hover:gap-2 flex-shrink-0">
                    Start
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-sm leading-relaxed">
                  <span className="font-bold text-purple-400 text-[17px]">Where chords become music.</span>{' '}
                  <span className="text-zinc-400">Practice smooth transitions and play progressions that actually sound like songs.</span>
                </p>
              </div>
            </div>
          </motion.button>

          {/* Scales Card */}
          <motion.button
            onClick={() => navigate('/scale-setup')}
            whileHover={{ scale: 1.015 }}
            transition={{ duration: 0.2 }}
            className="w-full text-left bg-zinc-900/50 border border-zinc-800 border-t-4 border-t-cyan-500 rounded-xl p-5 hover:bg-cyan-500/[0.07] hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 transition-colors group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-shadow duration-200">
                <Scale className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-white">Scales</h3>
                  <div className="flex items-center gap-1.5 text-cyan-500 group-hover:text-cyan-400 font-semibold text-sm transition-all group-hover:gap-2 flex-shrink-0">
                    Start
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-sm leading-relaxed">
                  <span className="font-bold text-cyan-400 text-[17px]">Unlock the fretboard.</span>{' '}
                  <span className="text-zinc-400">Learn scales visually and turn them into riffs, solos, and real expression.</span>
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* ── PLAY NOW: Library Vault Row ── */}
        <div className="mt-8">
          {/* Section header */}
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="text-amber-400" aria-hidden="true">⚡</span>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400">
              Play Now
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
          </div>

          {/* Horizontally scrollable card rail */}
          <div
            className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {VAULT_CARDS.map(card => (
              <motion.button
                key={card.id}
                onClick={() => {
                  if (card.route) {
                    navigate(card.route);
                  } else {
                    toast.info(`${card.label} coming soon`, {
                      description: 'This vault is being built. Check back soon.',
                      duration: 3000,
                    });
                  }
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="flex-shrink-0 flex flex-col items-start gap-3 w-36 rounded-xl p-4 border text-left cursor-pointer transition-colors"
                style={{
                  background: `${card.bgColor}`,
                  borderColor: card.borderColor,
                }}
              >
                {/* Icon badge */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: card.accentColor, boxShadow: `0 4px 12px ${card.accentColor}55` }}
                >
                  <card.Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>

                {/* Label */}
                <div>
                  <p className="text-[13px] font-bold text-white leading-tight">{card.label}</p>
                  {card.soon && (
                    <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-700/80 text-zinc-400">
                      Soon
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
