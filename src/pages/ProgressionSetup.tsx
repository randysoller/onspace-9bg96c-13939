import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Waves, List, Folder, Play, Volume2, ChevronDown } from 'lucide-react';

export default function ProgressionSetup() {
  const navigate = useNavigate();
  
  const [selectedKey, setSelectedKey] = useState('C Major');
  const [selectedScale, setSelectedScale] = useState('Major Scale');
  const [selectedProgression, setSelectedProgression] = useState('I – IV – V – I');
  const [selectedTab, setSelectedTab] = useState('Common');

  const chords = [
    { numeral: 'I', name: 'C' },
    { numeral: 'ii', name: 'Dm' },
    { numeral: 'iii', name: 'Em' },
    { numeral: 'IV', name: 'F' },
    { numeral: 'V', name: 'G' },
    { numeral: 'vi', name: 'Am' },
    { numeral: 'vii°', name: 'Bdim' },
  ];

  const progressions = [
    { name: 'I – IV – V – I', chords: 'C – F – G – C' },
    { name: 'I – V – vi – IV', chords: 'C – G – Am – F' },
    { name: 'I – IV – vi – V', chords: 'C – F – Am – G' },
    { name: 'ii – V – I', chords: 'Dm – G – C' },
    { name: 'I – vi – IV – V', chords: 'C – Am – F – G' },
    { name: 'vi – IV – I – V', chords: 'Am – F – C – G' },
  ];

  const handleStartPractice = () => {
    navigate('/progression-practice');
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black mb-3">
            Practice <span className="text-amber-500">Progressions</span>
          </h1>
          <p className="text-base text-zinc-400 max-w-2xl mx-auto">
            Choose a key, scale, and chord progression. Practice smooth transitions between chords.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Key & Scale Selection */}
          <div className="space-y-6">
            {/* Select Key */}
            <div className="bg-zinc-900/50 border-t-4 border-t-amber-500 border-x border-b border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Select Key</h2>
              </div>
              
              <button className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3.5 flex items-center justify-between hover:bg-zinc-900 transition-colors">
                <span className="text-white font-medium">{selectedKey}</span>
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            {/* Select Scale */}
            <div className="bg-zinc-900/50 border-t-4 border-t-cyan-500 border-x border-b border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Waves className="w-5 h-5 text-cyan-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Select Scale</h2>
              </div>
              
              <button className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3.5 flex items-center justify-between hover:bg-zinc-900 transition-colors">
                <span className="text-white font-medium">{selectedScale}</span>
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </button>

              {/* Chords in C Major */}
              <div className="mt-6">
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Chords in C Major</div>
                <div className="grid grid-cols-4 gap-2">
                  {chords.map((chord, idx) => (
                    <button
                      key={idx}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-2 py-3 transition-colors"
                    >
                      <div className="text-xs text-zinc-500 mb-1.5">{chord.numeral}</div>
                      <div className="text-base font-bold text-white mb-1">{chord.name}</div>
                      <Volume2 className="w-3.5 h-3.5 text-cyan-500 mx-auto" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Choose Progression */}
          <div className="bg-zinc-900/50 border-t-4 border-t-purple-500 border-x border-b border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <List className="w-5 h-5 text-purple-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Choose Progression</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {['Common', 'Favorites', 'By Style', 'Custom'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-2 rounded font-semibold text-sm whitespace-nowrap transition-all ${
                    selectedTab === tab
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Progression Options */}
            <div className="mb-6">
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-3">Choose Progression</div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {progressions.map((prog, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedProgression(prog.name)}
                    className={`text-left bg-zinc-950 border rounded-lg p-4 hover:border-amber-500/40 transition-all ${
                      selectedProgression === prog.name
                        ? 'border-amber-500 bg-amber-500/5'
                        : 'border-zinc-800'
                    }`}
                  >
                    <div className="text-xs text-amber-500 font-medium mb-1.5">{prog.name}</div>
                    <div className="text-sm text-white font-semibold">{prog.chords}</div>
                  </button>
                ))}
              </div>

              <button className="w-full text-center text-sm text-amber-500 hover:text-amber-400 font-semibold py-2 transition-colors">
                Show all 13 progressions
              </button>
            </div>

            {/* Build Custom */}
            <div className="border-t border-zinc-800 pt-6">
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-3">Or Build Custom</div>
              <div className="grid grid-cols-7 gap-2">
                {chords.map((chord, idx) => (
                  <button
                    key={idx}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg p-2 text-center transition-colors group relative"
                  >
                    <div className="text-[10px] text-zinc-500 mb-0.5">{chord.numeral}</div>
                    <div className="text-xs text-zinc-400 mb-0.5">{chord.numeral}</div>
                    <div className="text-sm font-bold text-white">{chord.name}</div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-zinc-950 text-sm font-bold transition-opacity">
                      +
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* My Progressions */}
        <div className="bg-zinc-900/50 border-t-4 border-t-pink-500 border-x border-b border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-pink-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider">My Progressions</h2>
            </div>
            <button className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Save Current
            </button>
          </div>
          <p className="text-center text-zinc-600 py-6 text-sm">
            No saved progressions yet. Build or select a progression above, then save it here.
          </p>
        </div>

        {/* Ready to Practice Panel */}
        <div className="bg-zinc-900/50 border-t-4 border-t-amber-500 border-x border-b border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Play className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Ready to Practice</h2>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Key</span>
              <span className="text-white font-medium">C</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Scale</span>
              <span className="text-white font-medium">Major Scale</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Progression</span>
              <span className="text-white font-medium">C – F – G – C</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Chords</span>
              <span className="text-amber-500 font-bold text-lg">4</span>
            </div>
          </div>

          <button
            onClick={handleStartPractice}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-lg py-4 rounded-lg flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-amber-500/20"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            START PROGRESSION
          </button>
        </div>
      </div>
    </div>
  );
}
