import { useState } from 'react';
import { ChevronDown, ChevronUp, Music, Play } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const BeatSyncPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bpm, setBpm] = useState('120');
  const [timeSignature, setTimeSignature] = useState('4/4');

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-900/70 transition-colors">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Beat Sync
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded transition-colors flex items-center gap-1.5">
              <Play className="w-3 h-3" fill="currentColor" />
              Start
            </button>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4 border-t border-zinc-800">
            {/* BPM Selection */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wide mb-2 block">
                Tempo (BPM)
              </label>
              <Select value={bpm} onValueChange={setBpm}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60 BPM - Largo</SelectItem>
                  <SelectItem value="80">80 BPM - Andante</SelectItem>
                  <SelectItem value="100">100 BPM - Moderato</SelectItem>
                  <SelectItem value="120">120 BPM - Allegro</SelectItem>
                  <SelectItem value="140">140 BPM - Vivace</SelectItem>
                  <SelectItem value="160">160 BPM - Presto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Signature */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wide mb-2 block">
                Time Signature
              </label>
              <Select value={timeSignature} onValueChange={setTimeSignature}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time signature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2/4">2/4</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="4/4">4/4 (Common Time)</SelectItem>
                  <SelectItem value="6/8">6/8</SelectItem>
                  <SelectItem value="12/8">12/8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info Text */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Sync your practice with the metronome. Change chords on each beat or measure for rhythm training.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
