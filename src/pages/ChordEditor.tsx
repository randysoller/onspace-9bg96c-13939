import { useState } from 'react';
import { useCustomChordStore } from '@/stores/customChordStore';
import { CustomChordData } from '@/types/customChord';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Save, Trash2 } from 'lucide-react';

export default function ChordEditor() {
  const { customChords, addCustomChord, deleteCustomChord } = useCustomChordStore();
  const [chordName, setChordName] = useState('');
  const [chordRoot, setChordRoot] = useState('C');
  const [chordType, setChordType] = useState('major');

  const handleCreateChord = () => {
    if (!chordName.trim()) {
      alert('Please enter a chord name');
      return;
    }

    const newChord: CustomChordData = {
      id: Date.now().toString(),
      name: chordName,
      root: chordRoot,
      type: chordType,
      markers: [],
      barres: [],
      baseFret: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addCustomChord(newChord);
    setChordName('');
    alert('Custom chord created!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-amber-500 mb-8">Chord Editor</h1>

      {/* Create New Chord */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Create New Chord</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Chord Name</label>
            <Input
              placeholder="e.g., My Custom Chord"
              value={chordName}
              onChange={(e) => setChordName(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Root</label>
            <Input
              placeholder="C"
              value={chordRoot}
              onChange={(e) => setChordRoot(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Type</label>
            <Input
              placeholder="major"
              value={chordType}
              onChange={(e) => setChordType(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
        </div>

        <Button
          onClick={handleCreateChord}
          className="bg-amber-500 hover:bg-amber-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Chord
        </Button>
      </div>

      {/* Custom Chords List */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Your Custom Chords</h2>
        
        {customChords.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 bg-zinc-900/30 rounded-lg border border-zinc-800">
            No custom chords yet. Create one above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customChords.map((chord) => (
              <div
                key={chord.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{chord.name}</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  {chord.root} {chord.type}
                </p>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteCustomChord(chord.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
