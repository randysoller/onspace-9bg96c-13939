import { useState } from 'react';
import { X, Music, Mic, Target, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Tuner() {
  const navigate = useNavigate();
  const [micSensitivity, setMicSensitivity] = useState(60);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [detectedFrequency, setDetectedFrequency] = useState<number | null>(null);
  const [cents, setCents] = useState<number>(0);
  const [autoDetect, setAutoDetect] = useState(false);

  const strings = [
    { number: 6, note: 'E2' },
    { number: 5, note: 'A2' },
    { number: 4, note: 'D3' },
    { number: 3, note: 'G3' },
    { number: 2, note: 'B3' },
    { number: 1, note: 'E4' },
  ];

  // Generate frequency bars (showing pitch deviation)
  const generateBars = () => {
    const bars = [];
    const totalBars = 50;
    const centerBar = 25;
    
    for (let i = 0; i < totalBars; i++) {
      const distance = Math.abs(i - centerBar);
      let color = 'bg-emerald-500';
      
      if (distance > 2) {
        color = 'bg-yellow-500';
      }
      if (distance > 8) {
        color = 'bg-red-500';
      }
      
      bars.push(
        <div
          key={i}
          className={`w-1 h-8 ${color} opacity-30`}
        />
      );
    }
    
    return bars;
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Close Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 p-2 hover:bg-zinc-900 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-zinc-400" />
        </button>

        {/* Guitar Tuner Badge */}
        <div className="flex justify-center mb-6">
          <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-500">Guitar Tuner</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Tune Your <span className="text-amber-500">Guitar</span>
          </h1>
          
          {/* Tuning Selector */}
          <button className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors mb-4">
            <span className="text-white font-bold">Standard</span>
            <span className="text-zinc-500 ml-2">E A D G B E</span>
            <ChevronDown className="w-4 h-4 text-amber-500 inline ml-2" />
          </button>

          <p className="text-zinc-500 text-sm">
            Play a string and the tuner will detect the pitch.
          </p>
        </div>

        {/* Pitch Detection Display */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 mb-6">
          {/* Frequency Display */}
          <div className="text-center mb-8">
            <div className="text-6xl font-black text-zinc-700 mb-2">
              — Hz
            </div>
          </div>

          {/* Frequency Bars */}
          <div className="flex items-center justify-center gap-0.5 mb-6">
            {generateBars()}
          </div>

          {/* Cents Indicator */}
          <div className="flex items-center justify-between text-sm text-zinc-500 mb-8">
            <span>♭ Flat</span>
            <span className="text-white font-bold">0 cents</span>
            <span>Sharp ♯</span>
          </div>

          {/* Mic Sensitivity */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mic Sensitivity</span>
              <span className="ml-auto text-sm font-bold text-white">{micSensitivity}%</span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={micSensitivity}
                onChange={(e) => setMicSensitivity(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />
              <div className="flex items-center justify-between text-xs text-zinc-600 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>

          {/* Calibration */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-bold uppercase tracking-wider text-zinc-400">Calibration</span>
            </div>
            <button className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2">
              <Target className="w-4 h-4" />
              Calibrate
            </button>
          </div>
        </div>

        {/* Strings Section */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Strings</h2>
            <button
              onClick={() => setAutoDetect(!autoDetect)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                autoDetect
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
              }`}
            >
              <Mic className="w-4 h-4" />
              Auto-Detect
            </button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {strings.map((string) => (
              <button
                key={string.number}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg p-4 transition-colors"
              >
                <div className="text-xs text-zinc-500 mb-2">String</div>
                <div className="text-xs text-zinc-500 mb-1">{string.number}</div>
                <div className="text-2xl font-black text-white">{string.note}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
