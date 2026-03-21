import { useState, useEffect, useRef } from 'react';
import { X, Music, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useMetronomeUIStore } from '@/stores/metronomeUIStore';

export default function MetronomeModal() {
  const { isOpen, closeMetronome } = useMetronomeUIStore();
  
  const [tempo, setTempo] = useState(100);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [sound, setSound] = useState('Wood Block');
  const [volume, setVolume] = useState(75);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);

  const tempoLabels: { [key: number]: string } = {
    40: 'Grave',
    60: 'Largo',
    76: 'Adagio',
    108: 'Moderato',
    120: 'Allegro',
    168: 'Presto',
    200: 'Prestissimo',
  };

  const getTempoLabel = (bpm: number): string => {
    if (bpm < 60) return 'Grave';
    if (bpm < 76) return 'Largo';
    if (bpm < 108) return 'Adagio';
    if (bpm < 120) return 'Moderato';
    if (bpm < 168) return 'Allegro';
    if (bpm < 200) return 'Presto';
    return 'Prestissimo';
  };

  const quickTempos = [60, 80, 100, 120, 140, 160];
  const timeSignatures = ['2/4', '3/4', '4/4', '6/8', '12/8'];
  const sounds = ['Click', 'Wood Block', 'Hi-Hat', 'Sidestick', 'Voice Count'];

  const handleTempoChange = (newTempo: number) => {
    setTempo(Math.max(40, Math.min(240, newTempo)));
  };

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play click sound based on sound selection
  const playClick = (isAccent: boolean) => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const vol = (volume / 100) * 0.3;
    
    if (sound === 'Voice Count') {
      // For voice count, we'd use speech synthesis (simplified here)
      return;
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Different sounds based on selection
    if (sound === 'Click') {
      oscillator.frequency.setValueAtTime(isAccent ? 1200 : 800, now);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(vol, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    } else if (sound === 'Wood Block') {
      oscillator.frequency.setValueAtTime(isAccent ? 800 : 600, now);
      oscillator.type = 'triangle';
      gainNode.gain.setValueAtTime(vol * 1.5, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    } else if (sound === 'Hi-Hat') {
      oscillator.frequency.setValueAtTime(isAccent ? 3000 : 2000, now);
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(vol * 0.5, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
    } else if (sound === 'Sidestick') {
      oscillator.frequency.setValueAtTime(isAccent ? 1500 : 1000, now);
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(vol, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    } else {
      // Default click
      oscillator.frequency.setValueAtTime(isAccent ? 1000 : 800, now);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(vol, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    }
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  };

  // Metronome timing engine
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    const intervalMs = (60 / tempo) * 1000;
    
    let beatCount = 1;
    
    // Play first beat immediately
    playClick(true);
    setCurrentBeat(1);
    
    intervalRef.current = window.setInterval(() => {
      beatCount++;
      if (beatCount > beatsPerMeasure) {
        beatCount = 1;
      }
      
      const isAccent = beatCount === 1;
      playClick(isAccent);
      setCurrentBeat(beatCount);
    }, intervalMs);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, tempo, timeSignature, sound, volume]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentBeat(1);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={closeMetronome}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg pointer-events-auto shadow-2xl">
          {/* Header */}
          <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
            <button
              onClick={closeMetronome}
              className="p-1 hover:bg-zinc-900 rounded transition-colors"
            >
              <X className="w-7 h-7 text-zinc-400" />
            </button>
            
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold uppercase tracking-wider text-zinc-200">Metronome</span>
            </div>
            
            <div className="w-5" /> {/* Spacer for alignment */}
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Tempo */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Tempo</span>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 mr-2">{getTempoLabel(tempo)}</span>
                  <span className="text-lg font-bold text-amber-500">{tempo}</span>
                  <span className="text-xs text-zinc-500 ml-1">BPM</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => handleTempoChange(tempo - 1)}
                  className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center transition-colors"
                >
                  <span className="text-zinc-400 text-lg leading-none">−</span>
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="40"
                    max="240"
                    value={tempo}
                    onChange={(e) => handleTempoChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-track]:bg-amber-500/30"
                    style={{
                      background: `linear-gradient(to right, rgb(245, 158, 11) 0%, rgb(245, 158, 11) ${((tempo - 40) / 200) * 100}%, rgb(39, 39, 42) ${((tempo - 40) / 200) * 100}%, rgb(39, 39, 42) 100%)`
                    }}
                  />
                </div>
                
                <button
                  onClick={() => handleTempoChange(tempo + 1)}
                  className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center transition-colors"
                >
                  <span className="text-zinc-400 text-lg leading-none">+</span>
                </button>
              </div>

              {/* Quick Tempo Buttons */}
              <div className="grid grid-cols-6 gap-2 mb-3">
                {quickTempos.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTempo(t)}
                    className={`py-2 px-3 rounded font-bold text-sm transition-all ${
                      tempo === t
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Tap Tempo */}
              <button className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-500 font-bold text-sm rounded transition-colors">
                TAP TEMPO
              </button>
            </div>

            {/* Time Signature */}
            <div>
              <div className="mb-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Time Signature</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {timeSignatures.map((sig) => (
                  <button
                    key={sig}
                    onClick={() => setTimeSignature(sig)}
                    className={`py-2.5 rounded font-bold transition-all ${
                      timeSignature === sig
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {sig}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound */}
            <div>
              <div className="mb-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Sound</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {sounds.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSound(s)}
                    className={`py-2.5 rounded font-semibold text-sm transition-all ${
                      sound === s
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Volume</span>
                <span className="text-sm font-bold text-amber-500">{volume}%</span>
              </div>
              
              <div className="flex items-center gap-3">
                <VolumeX className="w-4 h-4 text-zinc-500" />
                
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                    style={{
                      background: `linear-gradient(to right, rgb(245, 158, 11) 0%, rgb(245, 158, 11) ${volume}%, rgb(39, 39, 42) ${volume}%, rgb(39, 39, 42) 100%)`
                    }}
                  />
                </div>
                
                <Volume2 className="w-4 h-4 text-zinc-500" />
              </div>
            </div>

            {/* Play Button */}
            <div>
              <button
                onClick={handlePlayPause}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" fill="currentColor" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" fill="currentColor" />
                    Play
                  </>
                )}
              </button>

              {/* Beat Indicators */}
              {isPlaying && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  {[1, 2, 3, 4].map((beat) => (
                    <div
                      key={beat}
                      className={`w-2 h-2 rounded-full transition-all ${
                        beat === currentBeat
                          ? 'bg-emerald-500 scale-150'
                          : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
