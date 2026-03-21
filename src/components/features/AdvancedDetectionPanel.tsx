import { useState } from 'react';
import { ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';

export const AdvancedDetectionPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [noiseGate, setNoiseGate] = useState([30]);
  const [harmonicBoost, setHarmonicBoost] = useState(false);
  const [fluxTolerance, setFluxTolerance] = useState([50]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-900/70 transition-colors">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Advanced Detection
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 font-semibold text-xs rounded transition-colors">
              Calibrate
            </button>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 py-4 space-y-5 border-t border-zinc-800">
            {/* Noise Gate */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-zinc-400 uppercase tracking-wide">
                  Noise Gate
                </label>
                <span className="text-sm font-semibold text-white">{noiseGate[0]}%</span>
              </div>
              <Slider
                value={noiseGate}
                onValueChange={setNoiseGate}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-zinc-600 mt-1">
                <span>Off</span>
                <span>Max</span>
              </div>
            </div>

            {/* Harmonic Boost */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400 uppercase tracking-wide">
                  Harmonic Boost
                </label>
                <button
                  onClick={() => setHarmonicBoost(!harmonicBoost)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    harmonicBoost ? 'bg-amber-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      harmonicBoost ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-zinc-600 mt-1.5">
                Enhances overtone detection for better accuracy
              </p>
            </div>

            {/* Flux Tolerance */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-zinc-400 uppercase tracking-wide">
                  Flux Tolerance
                </label>
                <span className="text-sm font-semibold text-white">{fluxTolerance[0]}%</span>
              </div>
              <Slider
                value={fluxTolerance}
                onValueChange={setFluxTolerance}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-zinc-600 mt-1">
                <span>Strict</span>
                <span>Lenient</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
