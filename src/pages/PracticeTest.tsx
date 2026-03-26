/**
 * MINIMAL PRACTICE PAGE - FOR TESTING CHORD DETECTION
 * 
 * This is a stripped-down version to isolate and debug the chord detection system.
 * No advanced features, no session stats, no animations - just core functionality.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePracticeStore } from '@/stores/practiceStore';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';
import { useChordDetection } from '@/hooks/useChordDetection';
import { Mic, ArrowLeft } from 'lucide-react';

export default function PracticeTest() {
  const navigate = useNavigate();
  const { practiceChords, currentChordIndex } = usePracticeStore();
  const { sensitivity } = useDetectionSettingsStore();
  
  const [detectedChord, setDetectedChord] = useState<string | null>(null);
  
  const currentChord = practiceChords[currentChordIndex];
  
  console.log('🎯 PracticeTest mounted', {
    currentChord: currentChord ? `${currentChord.root}${currentChord.type}` : 'none',
    sensitivity,
    totalChords: practiceChords.length,
    currentIndex: currentChordIndex,
  });
  
  const { isListening, result, permissionDenied, toggleListening } = useChordDetection({
    targetChord: currentChord,
    sensitivity,
    autoStart: false,
    onCorrect: () => {
      console.log('✅ CORRECT CALLBACK FIRED!');
      setDetectedChord(`${currentChord?.root}${currentChord?.type} ✓`);
    },
    onWrongDetected: (detected) => {
      console.log('❌ WRONG CALLBACK FIRED!', detected);
      setDetectedChord(detected);
    },
  });
  
  const handleMicClick = () => {
    console.log('═══════════════════════════════════════');
    console.log('🔘 MIC BUTTON CLICKED IN PRACTICE TEST');
    console.log('═══════════════════════════════════════');
    console.log('Current state:', {
      isListening,
      result,
      permissionDenied,
      hasToggleListening: typeof toggleListening === 'function',
    });
    
    if (typeof toggleListening !== 'function') {
      console.error('❌ CRITICAL: toggleListening is not a function!');
      alert('ERROR: toggleListening is not a function!');
      return;
    }
    
    try {
      console.log('Calling toggleListening()...');
      toggleListening();
      console.log('✅ toggleListening() called successfully');
    } catch (error) {
      console.error('❌ ERROR calling toggleListening:', error);
      alert(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  if (!currentChord) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No chords to practice</h2>
          <button
            onClick={() => navigate('/')}
            className="text-amber-500 hover:text-amber-400"
          >
            Go back to setup
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-amber-500">
          🧪 CHORD DETECTION TEST PAGE
        </h1>
      </div>
      
      {/* Status Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">System Status</h2>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex gap-2">
            <span className="text-zinc-500">Listening:</span>
            <span className={isListening ? 'text-emerald-500' : 'text-zinc-400'}>
              {isListening ? '✅ YES' : '❌ NO'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-500">Result:</span>
            <span className={result === 'correct' ? 'text-emerald-500' : result === 'wrong' ? 'text-red-500' : 'text-zinc-400'}>
              {result === 'correct' ? '✅ CORRECT' : result === 'wrong' ? '❌ WRONG' : '⏸️ NULL'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-500">Permission Denied:</span>
            <span className={permissionDenied ? 'text-red-500' : 'text-zinc-400'}>
              {permissionDenied ? '🚫 YES' : '✅ NO'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-500">Sensitivity:</span>
            <span className="text-amber-500">{sensitivity}/10</span>
          </div>
          {detectedChord && (
            <div className="flex gap-2">
              <span className="text-zinc-500">Last Detected:</span>
              <span className="text-amber-500">{detectedChord}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="text-center">
        {/* Target Chord */}
        <div className="mb-12">
          <div className="text-sm text-zinc-500 mb-2">TARGET CHORD</div>
          <div className="text-8xl font-black text-white mb-4">
            {currentChord.root}
            {currentChord.type === 'major' ? '' : currentChord.type}
          </div>
          <div className="text-lg text-zinc-500">
            {currentChord.root} {currentChord.type === 'major' ? 'Major' : currentChord.type}
          </div>
        </div>
        
        {/* Mic Button */}
        <div className="mb-8">
          <button
            onClick={handleMicClick}
            className={`
              w-32 h-32 rounded-full flex items-center justify-center
              transition-all duration-200
              ${isListening 
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/50' 
                : 'bg-zinc-800 hover:bg-zinc-700'
              }
            `}
          >
            <Mic className={`w-16 h-16 ${isListening ? 'text-white animate-pulse' : 'text-zinc-400'}`} />
          </button>
          <div className="mt-4 text-sm text-zinc-500">
            Click to {isListening ? 'stop' : 'start'} listening
          </div>
        </div>
        
        {/* Visual Feedback */}
        {permissionDenied && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4 text-red-500">
            <div className="font-bold">🚫 Microphone Permission Denied</div>
            <div className="text-sm mt-2">Please allow microphone access in your browser settings</div>
          </div>
        )}
        
        {isListening && !result && (
          <div className="bg-emerald-900/20 border border-emerald-500 rounded-lg p-4 mb-4 text-emerald-500">
            <div className="font-bold">🎤 Listening for {currentChord.root}{currentChord.type}</div>
            <div className="text-sm mt-2">Play the chord on your guitar</div>
          </div>
        )}
        
        {result === 'correct' && (
          <div className="bg-emerald-900/20 border border-emerald-500 rounded-lg p-4 mb-4 text-emerald-500">
            <div className="text-4xl font-black">✅ CORRECT!</div>
          </div>
        )}
        
        {result === 'wrong' && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4 text-red-500">
            <div className="text-4xl font-black">❌ WRONG</div>
            <div className="text-sm mt-2">Try again</div>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="font-bold mb-4">📋 Test Instructions</h3>
        <ol className="space-y-2 text-sm text-zinc-400 list-decimal list-inside">
          <li>Open browser console (F12)</li>
          <li>Click the microphone button above</li>
          <li>Allow microphone permission if prompted</li>
          <li>Play the target chord on your guitar</li>
          <li>Watch the console for debug logs</li>
          <li>Report what you see in the console</li>
        </ol>
      </div>
    </div>
  );
}
