import { useState } from 'react';
import { CHORD_DATABASE, CHORD_ROOTS, CHORD_CATEGORIES } from '@/constants/chords';
import { ChordDiagram } from '@/components/features/ChordDiagram';
import { useChordAudio } from '@/hooks/useChordAudio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Volume2 } from 'lucide-react';

export default function ChordLibrary() {
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { playChord } = useChordAudio();

  const filteredChords = CHORD_DATABASE.filter((chord) => {
    const rootMatch = !selectedRoot || chord.root === selectedRoot;
    const categoryMatch = !selectedCategory || chord.category === selectedCategory;
    const searchMatch = !searchQuery || 
      `${chord.root}${chord.type}`.toLowerCase().includes(searchQuery.toLowerCase());
    return rootMatch && categoryMatch && searchMatch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-amber-500 mb-8">Chord Library</h1>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <Input
          placeholder="Search chords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md bg-zinc-900 border-zinc-700 text-white"
        />

        {/* Root Filter */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Root Note</label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedRoot === null ? 'default' : 'outline'}
              onClick={() => setSelectedRoot(null)}
              className={selectedRoot === null ? 'bg-amber-500 hover:bg-amber-600' : ''}
            >
              All
            </Button>
            {CHORD_ROOTS.map((root) => (
              <Button
                key={root}
                size="sm"
                variant={selectedRoot === root ? 'default' : 'outline'}
                onClick={() => setSelectedRoot(root)}
                className={selectedRoot === root ? 'bg-amber-500 hover:bg-amber-600' : ''}
              >
                {root}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 'bg-amber-500 hover:bg-amber-600' : ''}
            >
              All
            </Button>
            {CHORD_CATEGORIES.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'bg-amber-500 hover:bg-amber-600' : ''}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4 text-zinc-400">
        Showing {filteredChords.length} chord{filteredChords.length !== 1 ? 's' : ''}
      </div>

      {/* Chord Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredChords.map((chord, index) => (
          <div
            key={index}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-amber-500/30 transition-all"
          >
            <ChordDiagram chord={chord} size="md" showName={true} />
            <Button
              size="sm"
              variant="ghost"
              className="w-full mt-4 text-amber-500 hover:text-amber-400"
              onClick={() => playChord(chord)}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Play
            </Button>
          </div>
        ))}
      </div>

      {filteredChords.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          No chords found matching your criteria.
        </div>
      )}
    </div>
  );
}
