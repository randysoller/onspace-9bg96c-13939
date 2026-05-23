
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3x3, Music2, ChevronRight, Scale, Sliders, Triangle, Waves, Mic2, Zap, MapPin, BookOpen, Star, Flame, ListChecks, TrendingUp, Timer, Search, Dumbbell, FlaskConical, Palette, Sun, Moon, Layers, Music, Coffee, Hash } from 'lucide-react';
import { useBackendSync } from '@/hooks/useBackendSync';
import { useHomeUIStore } from '@/stores/homeUIStore';
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
    tagline: 'Find any chord instantly.',
    taglineColor: '#10b981',
    openWhite: true,
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
    tagline: undefined,
    taglineColor: undefined,
    openWhite: false,
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
    tagline: 'Triad Builder.',
    taglineColor: '#8b5cf6',
    openWhite: false,
  },
  {
    id: 'scale-vault',
    label: 'Scale Vault',
    Icon: Waves,
    accentColor: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.07)',
    borderColor: 'rgba(6,182,212,0.25)',
    route: '/scales',
    soon: false,
    tagline: 'Solo in any key.',
    taglineColor: '#06b6d4',
    openWhite: false,
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
    tagline: 'Licks you will actually use.',
    taglineColor: '#f43f5e',
    openWhite: false,
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
    tagline: 'Iconic Riffs.',
    taglineColor: '#f59e0b',
    openWhite: false,
  },
];

// ── Songbook cards ────────────────────────────────────────────────────────
const SONGBOOK_CARDS = [
  {
    id: 'song-search',
    label: 'Song Search',
    subtitle: 'Find any song in the library',
    Icon: Search,
    accentColor: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.07)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  {
    id: 'campfire-classics',
    label: 'Campfire Classics',
    subtitle: '3-4 chord songs everybody loves',
    Icon: Flame,
    accentColor: '#f97316',
    bgColor: 'rgba(249,115,22,0.07)',
    borderColor: 'rgba(249,115,22,0.25)',
  },
  {
    id: 'classic-rock',
    label: 'Classic Rock',
    subtitle: 'Anthems that defined a generation',
    Icon: Zap,
    accentColor: '#ef4444',
    bgColor: 'rgba(239,68,68,0.07)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  {
    id: 'acoustic-hits',
    label: 'Acoustic Hits',
    subtitle: 'Stripped-back songs that shine',
    Icon: Music,
    accentColor: '#10b981',
    bgColor: 'rgba(16,185,129,0.07)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  {
    id: 'easy-jazz',
    label: 'Easy Jazz Standards',
    subtitle: 'Sophisticated sounds, accessible entry',
    Icon: Coffee,
    accentColor: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.07)',
    borderColor: 'rgba(139,92,246,0.25)',
  },
  {
    id: 'legendary-rock',
    label: 'Legendary Rock',
    subtitle: 'The songs that built rock history',
    Icon: Star,
    accentColor: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.07)',
    borderColor: 'rgba(6,182,212,0.25)',
  },
] as const;

// ── Skill Boost cards ─────────────────────────────────────────────────────
const SKILL_BOOST_CARDS = [
  {
    id: 'finger-gym',
    label: 'Finger Gym',
    subtitle: 'Build strength and independence fast',
    Icon: Dumbbell,
    accentColor: '#10b981',
    bgColor: 'rgba(16,185,129,0.07)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  {
    id: 'pick-control',
    label: 'Pick Control',
    subtitle: 'Real precision and attack consistency',
    Icon: MapPin,
    accentColor: '#f97316',
    bgColor: 'rgba(249,115,22,0.07)',
    borderColor: 'rgba(249,115,22,0.25)',
  },
  {
    id: 'fingerstyle-flow',
    label: 'Fingerstyle Flow',
    subtitle: 'Melody and bass at the same time',
    Icon: Waves,
    accentColor: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.07)',
    borderColor: 'rgba(139,92,246,0.25)',
  },
  {
    id: 'fretboard-map',
    label: 'Fretboard Map',
    subtitle: 'See every note — own the neck',
    Icon: Layers,
    accentColor: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.07)',
    borderColor: 'rgba(6,182,212,0.25)',
  },
  {
    id: 'sub-5',
    label: 'Sub 5',
    subtitle: 'Coming soon',
    Icon: Hash,
    accentColor: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.07)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  {
    id: 'sub-6',
    label: 'Sub 6',
    subtitle: 'Coming soon',
    Icon: Hash,
    accentColor: '#ec4899',
    bgColor: 'rgba(236,72,153,0.07)',
    borderColor: 'rgba(236,72,153,0.25)',
  },
] as const;

// ── Learn & Grow cards ────────────────────────────────────────────────────
const LEARN_GROW_CARDS = [
  {
    id: 'chord-progression-lab',
    label: 'Chord Progression Lab',
    subtitle: 'Build progressions used in real songs',
    Icon: FlaskConical,
    accentColor: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.07)',
    borderColor: 'rgba(59,130,246,0.25)',
  },
  {
    id: 'triad-progression-lab',
    label: 'Triad Progression Lab',
    subtitle: 'Lean, powerful chord movement',
    Icon: Triangle,
    accentColor: '#6366f1',
    bgColor: 'rgba(99,102,241,0.07)',
    borderColor: 'rgba(99,102,241,0.25)',
  },
  {
    id: 'mode-colors',
    label: 'Mode Colors',
    subtitle: 'Hear the emotion inside each mode',
    Icon: Palette,
    accentColor: '#14b8a6',
    bgColor: 'rgba(20,184,166,0.07)',
    borderColor: 'rgba(20,184,166,0.25)',
  },
] as const;

// ── Jam Instantly cards ───────────────────────────────────────────────────
const JAM_INSTANTLY_CARDS = [
  {
    id: 'major-keys',
    label: 'Major Keys',
    subtitle: 'Bright, uplifting progressions',
    Icon: Sun,
    accentColor: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.07)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  {
    id: 'minor-keys',
    label: 'Minor Keys',
    subtitle: 'Deep, emotional progressions',
    Icon: Moon,
    accentColor: '#6366f1',
    bgColor: 'rgba(99,102,241,0.07)',
    borderColor: 'rgba(99,102,241,0.25)',
  },
  {
    id: 'modal',
    label: 'Modal',
    subtitle: 'Explore Dorian, Phrygian and beyond',
    Icon: Layers,
    accentColor: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.07)',
    borderColor: 'rgba(139,92,246,0.25)',
  },
  {
    id: 'rock-jam',
    label: 'Rock',
    subtitle: 'Power and drive backing tracks',
    Icon: Zap,
    accentColor: '#ef4444',
    bgColor: 'rgba(239,68,68,0.07)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  {
    id: 'pop-jam',
    label: 'Pop',
    subtitle: 'Melodic, radio-ready grooves',
    Icon: Star,
    accentColor: '#ec4899',
    bgColor: 'rgba(236,72,153,0.07)',
    borderColor: 'rgba(236,72,153,0.25)',
  },
  {
    id: 'blues-jam',
    label: 'Blues',
    subtitle: 'Raw feel — pure expression',
    Icon: Flame,
    accentColor: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.07)',
    borderColor: 'rgba(59,130,246,0.25)',
  },
  {
    id: 'country-jam',
    label: 'Country',
    subtitle: 'Twang and rhythm you can ride',
    Icon: Music,
    accentColor: '#f97316',
    bgColor: 'rgba(249,115,22,0.07)',
    borderColor: 'rgba(249,115,22,0.25)',
  },
  {
    id: 'jazz-jam',
    label: 'Jazz',
    subtitle: 'Swinging harmony and improvisation',
    Icon: Coffee,
    accentColor: '#10b981',
    bgColor: 'rgba(16,185,129,0.07)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  {
    id: 'reggae-jam',
    label: 'Reggae',
    subtitle: 'Offbeat groove, island soul',
    Icon: BookOpen,
    accentColor: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.07)',
    borderColor: 'rgba(6,182,212,0.25)',
  },
] as const;

// ── Daily Progress cards ──────────────────────────────────────────────────
const DAILY_PROGRESS_CARDS = [
  {
    id: 'todays-plan',
    label: "Today's Guitar Plan",
    subtitle: 'Clear steps. No thinking required.',
    Icon: ListChecks,
    accentColor: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.07)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  {
    id: 'keep-streak',
    label: 'Keep Your Streak Alive',
    subtitle: "Don't break your momentum.",
    Icon: Flame,
    accentColor: '#f97316',
    bgColor: 'rgba(249,115,22,0.07)',
    borderColor: 'rgba(249,115,22,0.25)',
  },
  {
    id: 'level-up',
    label: "Level Up, You're Playing Today",
    subtitle: 'Small wins that stack fast',
    Icon: TrendingUp,
    accentColor: '#10b981',
    bgColor: 'rgba(16,185,129,0.07)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  {
    id: 'beat-yesterday',
    label: "Beat Yesterday's Speed",
    subtitle: 'Compete with yourself.',
    Icon: Timer,
    accentColor: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.07)',
    borderColor: 'rgba(6,182,212,0.25)',
  },
] as const;

export default function Index() {
  const navigate = useNavigate();
  // Persist Play Now open state and active vault index across navigation
  const {
    isPlayNowOpen, setIsPlayNowOpen, activeVaultIndex, setActiveVaultIndex,
    isSongbookOpen, setIsSongbookOpen, activeSongbookIndex, setActiveSongbookIndex,
  } = useHomeUIStore();
  const vaultRailRef = React.useRef<HTMLDivElement>(null);
  const songbookRailRef = React.useRef<HTMLDivElement>(null);
  // One-shot flag: restore rail scroll only on navigation return, not on user toggle
  const hasRestoredRailScroll = React.useRef(false);
  const hasRestoredSongbookScroll = React.useRef(false);
  
  // Sync user data from backend when authenticated
  useBackendSync();

  // Restore vault rail scroll position when returning from a vault page.
  React.useEffect(() => {
    if (!isPlayNowOpen || hasRestoredRailScroll.current) return;
    hasRestoredRailScroll.current = true;
    if (activeVaultIndex === 0) return;
    requestAnimationFrame(() => {
      if (vaultRailRef.current) {
        vaultRailRef.current.scrollLeft = activeVaultIndex * 262;
      }
    });
  }, [isPlayNowOpen, activeVaultIndex]);

  // Restore songbook rail scroll position when returning via navigation.
  React.useEffect(() => {
    if (!isSongbookOpen || hasRestoredSongbookScroll.current) return;
    hasRestoredSongbookScroll.current = true;
    if (activeSongbookIndex === 0) return;
    requestAnimationFrame(() => {
      if (songbookRailRef.current) {
        // 228 = card width (216px) + gap (12px)
        songbookRailRef.current.scrollLeft = activeSongbookIndex * 228;
      }
    });
  }, [isSongbookOpen, activeSongbookIndex]);

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

        {/* ── PLAY NOW: Expandable Practice-Mode Card ── */}
        <div className="mt-6">
          <motion.button
            onClick={() => setIsPlayNowOpen(!isPlayNowOpen)}
            whileHover={{ scale: 1.015 }}
            transition={{ duration: 0.2 }}
            className="w-full text-left bg-zinc-900/50 border border-zinc-800 border-t-4 border-t-amber-500 rounded-xl p-5 hover:bg-amber-500/[0.07] hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 transition-colors group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-white">Play Now</h3>
                  <motion.div
                    animate={{ rotate: isPlayNowOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 text-amber-500 group-hover:text-amber-400 font-semibold text-sm flex-shrink-0"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">Browse the full library — Chord Vault, Scale Vault, Lick Lab, Riff Arena and more, all in one place.</p>
              </div>
            </div>
          </motion.button>

          {/* Expanded vault card rail */}
          <AnimatePresence>
            {isPlayNowOpen && (
              <motion.div
                key="vault-rail"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                {/* Inner slide-in wrapper — animates rail + dots from right on open */}
                <motion.div
                  initial={{ x: 80, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                >
                <div
                  ref={vaultRailRef}
                  className="flex gap-3 overflow-x-auto pb-3 pt-3"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    scrollSnapType: 'x mandatory',
                    paddingLeft: 'calc(50% - 125px)',
                    paddingRight: 'calc(50% - 125px)',
                  }}
                  onScroll={(e) => {
                    const scrollLeft = (e.currentTarget as HTMLDivElement).scrollLeft;
                    // cardWidth(250) + gap(12) = 262px per card step
                    const index = Math.round(scrollLeft / 262);
                    setActiveVaultIndex(Math.max(0, Math.min(index, VAULT_CARDS.length - 1)));
                  }}
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
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="flex-shrink-0 flex flex-col justify-between gap-3 w-[250px] rounded-xl p-4 text-left cursor-pointer transition-colors bg-zinc-900/50 border border-zinc-800 hover:border-opacity-60 group"
                      style={{
                        borderTopWidth: '4px',
                        borderTopColor: card.accentColor,
                        scrollSnapAlign: 'center',
                      }}
                    >
                      {/* Icon badge */}
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: card.accentColor, boxShadow: `0 4px 12px ${card.accentColor}55` }}
                      >
                        <card.Icon className="w-6 h-6 text-white" strokeWidth={2.3} />
                      </div>

                      {/* Label + tagline + action */}
                      <div>
                        <p className="text-[14px] font-bold text-white leading-tight">{card.label}</p>
                        {card.tagline && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className="flex-shrink-0 rounded-full"
                              style={{ width: '5px', height: '5px', backgroundColor: card.accentColor }}
                            />
                            <p className="text-[11px] font-semibold leading-snug" style={{ color: card.taglineColor }}>
                              {card.tagline}
                            </p>
                          </div>
                        )}
                        {card.soon ? (
                          <span className="mt-2 inline-block text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-700/80 text-zinc-400">
                            Soon
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 mt-2" style={{ color: card.openWhite ? '#ffffff' : card.accentColor }}>
                            <span className="text-[12px] font-semibold">Open</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
                {/* Dot indicators */}
                <div className="flex justify-center items-center gap-1.5 py-2">
                  {VAULT_CARDS.map((card, i) => (
                    <span
                      key={card.id}
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: i === activeVaultIndex ? '8px' : '6px',
                        height: i === activeVaultIndex ? '8px' : '6px',
                        backgroundColor: i === activeVaultIndex ? '#f59e0b' : '#52525b',
                      }}
                    />
                  ))}
                </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── SONGBOOK: Expandable card matching Play Now layout ── */}
        <div className="mt-8">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-6" />
          <motion.button
            onClick={() => setIsSongbookOpen(!isSongbookOpen)}
            whileHover={{ scale: 1.015 }}
            transition={{ duration: 0.2 }}
            className="w-full text-left bg-zinc-900/50 border border-zinc-800 border-t-4 rounded-xl p-5 hover:shadow-lg transition-colors group cursor-pointer"
            style={{
              borderTopColor: '#06b6d4',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.07)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.4)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '';
              (e.currentTarget as HTMLElement).style.borderColor = '';
              (e.currentTarget as HTMLElement).style.borderTopColor = '#06b6d4';
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center shadow-lg"
                style={{ backgroundColor: '#06b6d4', boxShadow: '0 4px 16px rgba(6,182,212,0.35)' }}
              >
                <BookOpen className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-white">Songbook</h3>
                  <motion.div
                    animate={{ rotate: isSongbookOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 font-semibold text-sm flex-shrink-0"
                    style={{ color: '#06b6d4' }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">Real songs to play right now — Campfire Classics, Classic Rock, Acoustic Hits, Jazz Standards and more.</p>
              </div>
            </div>
          </motion.button>

          {/* Expanded songbook sub-card rail */}
          <AnimatePresence>
            {isSongbookOpen && (
              <motion.div
                key="songbook-rail"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <motion.div
                  initial={{ x: 80, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                >
                  <div
                    ref={songbookRailRef}
                    className="flex gap-3 overflow-x-auto pb-3 pt-3"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      scrollSnapType: 'x mandatory',
                      paddingLeft: 'calc(50% - 108px)',
                      paddingRight: 'calc(50% - 108px)',
                    }}
                    onScroll={(e) => {
                      const scrollLeft = (e.currentTarget as HTMLDivElement).scrollLeft;
                      // cardWidth(216) + gap(12) = 228px per card step
                      const index = Math.round(scrollLeft / 228);
                      setActiveSongbookIndex(Math.max(0, Math.min(index, SONGBOOK_CARDS.length - 1)));
                    }}
                  >
                    {SONGBOOK_CARDS.map((card) => (
                      <motion.button
                        key={card.id}
                        onClick={() => {
                          toast.info(`${card.label} coming soon`, {
                            description: 'This section is being built. Check back soon.',
                            duration: 3000,
                          });
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="flex-shrink-0 flex flex-col justify-between gap-3 w-[216px] rounded-xl p-4 text-left cursor-pointer bg-zinc-900/50 border border-zinc-800"
                        style={{
                          borderTopWidth: '4px',
                          borderTopColor: card.accentColor,
                          scrollSnapAlign: 'center',
                        }}
                      >
                        {/* Icon badge */}
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
                          style={{
                            backgroundColor: card.accentColor,
                            boxShadow: `0 4px 12px ${card.accentColor}55`,
                          }}
                        >
                          <card.Icon className="w-6 h-6 text-white" strokeWidth={2.3} />
                        </div>

                        {/* Label + tagline + Open link */}
                        <div>
                          <p className="text-[14px] font-bold text-white leading-tight">{card.label}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className="flex-shrink-0 rounded-full"
                              style={{ width: '5px', height: '5px', backgroundColor: card.accentColor }}
                            />
                            <p className="text-[11px] font-semibold leading-snug" style={{ color: card.accentColor }}>
                              {card.subtitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 mt-2" style={{ color: card.accentColor }}>
                            <span className="text-[12px] font-semibold">Open</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Dot indicators */}
                  <div className="flex justify-center items-center gap-1.5 py-2">
                    {SONGBOOK_CARDS.map((card, i) => (
                      <span
                        key={card.id}
                        className="rounded-full transition-all duration-200"
                        style={{
                          width: i === activeSongbookIndex ? '8px' : '6px',
                          height: i === activeSongbookIndex ? '8px' : '6px',
                          backgroundColor: i === activeSongbookIndex ? '#06b6d4' : '#52525b',
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── SKILL BOOST ── */}
        <SectionRail
          emoji="🚀"
          title="Skill Boost"
          subtitle="Fix your weak points fast"
          cards={SKILL_BOOST_CARDS}
          navigate={navigate}
        />

        {/* ── LEARN & GROW ── */}
        <SectionRail
          emoji="🎯"
          title="Learn & Grow"
          subtitle="Build real guitar foundation"
          cards={LEARN_GROW_CARDS}
          navigate={navigate}
        />

        {/* ── JAM INSTANTLY ── */}
        <SectionRail
          emoji="🎶"
          title="Jam Instantly"
          subtitle="Pick a vibe and play"
          cards={JAM_INSTANTLY_CARDS}
          navigate={navigate}
        />

        {/* ── DAILY PROGRESS ── */}
        <SectionRail
          emoji="📈"
          title="Daily Progress"
          subtitle="Build consistency"
          cards={DAILY_PROGRESS_CARDS}
          navigate={navigate}
        />

        {/* ── Divider before Practice Mode cards ── */}
        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

        {/* Practice Mode Cards */}
        <div className="space-y-3 mt-8">
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

      </div>
    </div>
  );
}

// ── Reusable section rail ─────────────────────────────────────────────────
type WideCard = {
  readonly id: string;
  readonly label: string;
  readonly subtitle: string;
  readonly Icon: React.ElementType;
  readonly accentColor: string;
  readonly bgColor: string;
  readonly borderColor: string;
};

function SectionRail({
  emoji,
  title,
  subtitle,
  cards,
  navigate,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  cards: readonly WideCard[];
  navigate: (path: string) => void;
}) {
  return (
    <div className="mt-8">
      {/* Gradient divider between sections */}
      <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-6" />

      {/* Section header */}
      <div className="flex items-start gap-2 mb-4 px-1">
        <span className="text-lg leading-none mt-0.5" aria-hidden="true">{emoji}</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">{title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="self-center flex-shrink-0 h-px w-12 bg-gradient-to-r from-zinc-700/60 to-transparent" />
      </div>

      {/* Horizontally scrollable card rail */}
      <div
        className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cards.map(card => (
          <motion.button
            key={card.id}
            onClick={() =>
              toast.info(`${card.label} coming soon`, {
                description: 'This feature is being built. Check back soon.',
                duration: 3000,
              })
            }
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="flex-shrink-0 flex flex-col justify-between gap-3 rounded-xl p-4 border text-left cursor-pointer transition-colors"
            style={{
              width: '216px',
              background: card.bgColor,
              borderColor: card.borderColor,
            }}
          >
            {/* Icon badge */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0"
              style={{
                backgroundColor: card.accentColor,
                boxShadow: `0 4px 12px ${card.accentColor}55`,
              }}
            >
              <card.Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>

            {/* Text */}
            <div>
              <p className="text-[13px] font-bold text-white leading-tight">{card.label}</p>
              <p className="text-[11px] text-zinc-400 leading-snug mt-1">{card.subtitle}</p>
              <span className="mt-2 inline-block text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-700/80 text-zinc-400">
                Soon
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
