import { useState } from 'react';
import { X, Music, Mic, Target, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { useReferenceTone } from '@/hooks/useReferenceTone';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';

export default function Tuner() {
  const navigate = useNavigate();
  const { sensitivity, setSensitivity } = useDetectionSettingsStore();
  const { playTone, stopTone } = useReferenceTone();
  const [selectedString, setSelectedString] = useState<number | null>(null);

  const { isListening, currentPitch, startListening, stopListening } = usePitchDetection({
    sensitivity,
    autoStart: false,
  });

  const detectedFrequency = currentPitch?.frequency || null;
  const detectedNote = currentPitch ? `${currentPitch.noteName}${currentPitch.octave}` : null;
  const cents = currentPitch?.cents || 0;

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const strings = [
    { number: 6, note: 'E2', freq: 82.41 },
    { number: 5, note: 'A2', freq: 110.00 },
    { number: 4, note: 'D3', freq: 146.83 },
    { number: 3, note: 'G3', freq: 196.00 },
    { number: 2, note: 'B3', freq: 246.94 },
    { number: 1, note: 'E4', freq: 329.63 },
  ];

  const handleStringClick = (stringData: typeof strings[0]) => {
    setSelectedString(stringData.number);
    playTone(stringData.freq);
    setTimeout(() => {
      stopTone();
      setSelectedString(null);
    }, 2000);
  };

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
            <div className={`text-6xl font-black mb-2 transition-colors ${
              detectedFrequency ? 'text-white' : 'text-zinc-700'
            }`}>
              {detectedFrequency ? `${detectedFrequency.toFixed(1)} Hz` : '— Hz'}
            </div>
            {detectedNote && (
              <div className="text-2xl font-bold text-amber-500">{detectedNote}</div>
            )}
          </div>

          {/* Frequency Bars */}
          <div className="flex items-center justify-center gap-0.5 mb-6">
            {generateBars()}
          </div>

          {/* Cents Indicator */}
          <div className="flex items-center justify-between text-sm text-zinc-500 mb-8">
            <span>♭ Flat</span>
            <span className={`font-bold transition-colors ${
              Math.abs(cents) < 5 ? 'text-emerald-500' : 
              Math.abs(cents) < 15 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {cents > 0 ? '+' : ''}{cents} cents
            </span>
            <span>Sharp ♯</span>
          </div>

          {/* Mic Sensitivity */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mic Sensitivity</span>
              <span className="ml-auto text-sm font-bold text-white">{sensitivity}</span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="1"
                max="10"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
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
              onClick={toggleListening}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                isListening
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
              }`}
            >
              <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
              {isListening ? 'Listening...' : 'Start Listening'}
            </button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {strings.map((string) => (
              <button
                key={string.number}
                onClick={() => handleStringClick(string)}
                className={`border rounded-lg p-4 transition-all ${
                  selectedString === string.number
                    ? 'bg-amber-500 border-amber-500 text-zinc-950 scale-105'
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'
                }`}
              >
                <div className={`text-xs mb-2 ${
                  selectedString === string.number ? 'text-zinc-950/70' : 'text-zinc-500'
                }`}>String</div>
                <div className={`text-xs mb-1 ${
                  selectedString === string.number ? 'text-zinc-950/70' : 'text-zinc-500'
                }`}>{string.number}</div>
                <div className="text-2xl font-black">{string.note}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
