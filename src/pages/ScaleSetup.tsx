import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SCALES, NOTE_NAMES } from '@/constants/scales';
import { ScaleFretboard } from '@/components/features/ScaleFretboard';

const SCALE_OPTIONS = [
  { value: 'major', label: 'Major Scale', intervals: SCALES.major },
  { value: 'minor', label: 'Natural Minor', intervals: SCALES.minor },
  { value: 'pentatonicMajor', label: 'Major Pentatonic', intervals: SCALES.pentatonicMajor },
  { value: 'pentatonicMinor', label: 'Minor Pentatonic', intervals: SCALES.pentatonicMinor },
  { value: 'blues', label: 'Blues Scale', intervals: SCALES.blues },
  { value: 'harmonicMinor', label: 'Harmonic Minor', intervals: SCALES.harmonicMinor },
  { value: 'melodicMinor', label: 'Melodic Minor', intervals: SCALES.melodicMinor },
];

export default function ScaleSetup() {
  const navigate = useNavigate();
  
  const [rootNote, setRootNote] = useState('C');
  const [scaleType, setScaleType] = useState('major');
  const [bpm, setBpm] = useState(120);

  const selectedScale = SCALE_OPTIONS.find(s => s.value === scaleType);

  const handleStart = () => {
    navigate('/scale-practice', {
      state: {
        rootNote,
        scaleType,
        scaleName: selectedScale?.label,
        scaleIntervals: selectedScale?.intervals,
        bpm,
      },
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-black px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-xl font-bold">Scale Setup</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Configuration */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-6">Configure Your Scale</h2>
              
              {/* Root Note Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Root Note
                </label>
                <Select value={rootNote} onValueChange={setRootNote}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_NAMES.map(note => (
                      <SelectItem key={note} value={note}>
                        {note}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scale Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Scale Type
                </label>
                <Select value={scaleType} onValueChange={setScaleType}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCALE_OPTIONS.map(scale => (
                      <SelectItem key={scale.value} value={scale.value}>
                        {scale.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* BPM Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Playback Speed (BPM)
                </label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>40</span>
                  <span className="text-cyan-500 font-bold">{bpm} BPM</span>
                  <span>200</span>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStart}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Practice
              </button>
            </div>

            {/* Scale Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="font-bold text-white mb-2">Scale Information</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {scaleType === 'major' && 'The major scale is the foundation of Western music. It has a bright, happy sound and follows the pattern: W-W-H-W-W-W-H.'}
                {scaleType === 'minor' && 'The natural minor scale has a darker, more melancholic sound. Pattern: W-H-W-W-H-W-W.'}
                {scaleType === 'pentatonicMajor' && 'A 5-note scale widely used in rock, blues, and country. Easy to play and sounds great over major chords.'}
                {scaleType === 'pentatonicMinor' && 'The most popular scale in rock and blues. Perfect for soloing and improvisation.'}
                {scaleType === 'blues' && 'Adds a "blue note" to the minor pentatonic, giving it that classic blues sound.'}
                {scaleType === 'harmonicMinor' && 'Creates an exotic, classical sound with a distinctive raised 7th degree.'}
                {scaleType === 'melodicMinor' && 'A jazz favorite with a unique ascending and descending pattern.'}
              </p>
            </div>
          </div>

          {/* Right: Fretboard Preview */}
          <div className="flex items-center justify-center">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              {selectedScale && (
                <ScaleFretboard
                  scaleName={selectedScale.label}
                  rootNote={rootNote}
                  scaleNotes={selectedScale.intervals}
                  size="md"
                  showName={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
