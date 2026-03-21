import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePracticeStore } from '@/stores/practiceStore';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useChordAudio } from '@/hooks/useChordAudio';
import { ChordDiagram } from '@/components/features/ChordDiagram';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, X, Volume2, VolumeX } from 'lucide-react';
import { CHORD_DATABASE } from '@/constants/chords';

export default function Practice() {
  const navigate = useNavigate();
  const {
    practiceChords,
    currentChordIndex,
    isPracticing,
    interval,
    playSound,
    showDiagrams,
    metronomeEnabled,
    startPractice,
    stopPractice,
    nextChord,
    setPracticeChords,
    selectedRoots,
    selectedCategories,
    selectedTypes,
  } = usePracticeStore();

  const { playChord } = useChordAudio();
  const [timeRemaining, setTimeRemaining] = useState(interval);

  useEffect(() => {
    // Filter chords based on selection
    const filtered = CHORD_DATABASE.filter((chord) => {
      const rootMatch = selectedRoots.length === 0 || selectedRoots.includes(chord.root as any);
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(chord.category);
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(chord.type);
      return rootMatch && categoryMatch && typeMatch;
    });

    // Shuffle chords
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setPracticeChords(shuffled);
  }, [selectedRoots, selectedCategories, selectedTypes, setPracticeChords]);

  useEffect(() => {
    if (!isPracticing) return;

    setTimeRemaining(interval);
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          nextChord();
          if (playSound && practiceChords[currentChordIndex]) {
            playChord(practiceChords[currentChordIndex]);
          }
          return interval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPracticing, currentChordIndex, interval, nextChord, playSound, playChord, practiceChords]);

  const currentChord = practiceChords[currentChordIndex];

  const handleTogglePractice = () => {
    if (isPracticing) {
      stopPractice();
    } else {
      if (practiceChords.length === 0) {
        alert('No chords selected. Please adjust your filters.');
        return;
      }
      startPractice();
      if (playSound && currentChord) {
        playChord(currentChord);
      }
    }
  };

  const handleNext = () => {
    nextChord();
    setTimeRemaining(interval);
    if (playSound && practiceChords[currentChordIndex]) {
      playChord(practiceChords[currentChordIndex]);
    }
  };

  if (practiceChords.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Chords Selected</h2>
          <p className="text-zinc-400 mb-6">
            Please go back to the setup page and select chords to practice.
          </p>
          <Button onClick={() => navigate('/')}>
            Back to Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-amber-500">Practice Session</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-zinc-400 mb-2">
            <span>Chord {currentChordIndex + 1} of {practiceChords.length}</span>
            <span>{timeRemaining}s remaining</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((interval - timeRemaining) / interval) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Chord */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 mb-8">
          {currentChord && (
            <div className="flex flex-col items-center">
              <h2 className="text-4xl font-bold text-white mb-2">
                {currentChord.root}
                <span className="text-2xl text-zinc-400 ml-2">{currentChord.type}</span>
              </h2>
              <p className="text-zinc-500 mb-8">{currentChord.category}</p>
              
              {showDiagrams && (
                <ChordDiagram chord={currentChord} size="lg" showName={false} />
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={handleTogglePractice}
            className="bg-amber-500 hover:bg-amber-600 text-white px-8"
          >
            {isPracticing ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start
              </>
            )}
          </Button>

          <Button size="lg" variant="outline" onClick={handleNext}>
            <SkipForward className="w-5 h-5 mr-2" />
            Next
          </Button>

          <Button size="lg" variant="ghost">
            {playSound ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
