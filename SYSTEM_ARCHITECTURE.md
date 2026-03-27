# FretMaster - Full System Architecture

> **Role**: Integration & Architecture Documentation  
> **Purpose**: Define how all pages, components, features, state, and backend services connect  
> **Last Updated**: Current development session

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Module Breakdown](#2-module-breakdown)
3. [Navigation Flow](#3-navigation-flow)
4. [State Management Architecture](#4-state-management-architecture)
5. [Backend Integration](#5-backend-integration)
6. [Audio System Integration](#6-audio-system-integration)
7. [Data Flow Diagrams](#7-data-flow-diagrams)
8. [Feature Integration Points](#8-feature-integration-points)
9. [Session Lifecycle](#9-session-lifecycle)
10. [Scalability Considerations](#10-scalability-considerations)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Testing Strategy](#12-testing-strategy)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  Pages + Components + UI + Animations + Responsive Design    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│   State Management (Zustand) + Custom Hooks + Services      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    DOMAIN LAYER                              │
│  Audio Processing + Music Theory + Chord Detection + AI     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                        │
│    Supabase (DB + Auth + Storage) + Web Audio API + PWA     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| **State** | Zustand (with persist middleware), React Query |
| **Audio** | Web Audio API, Pitch Detection (NSDF), Chromagram Analysis |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **Offline** | IndexedDB, Service Worker, PWA |
| **Monitoring** | Sentry, Custom Logger, Web Vitals |

---

## 2. Module Breakdown

### 2.1 Core Modules

#### **Module 1: Authentication & User Management**

**Responsibilities:**
- User registration (OTP + Password)
- Login/logout flows
- Session persistence
- Profile management

**Components:**
- `src/pages/Auth.tsx` - Login/signup UI
- `src/stores/authStore.ts` - Auth state
- `src/lib/api/auth.ts` - Auth API calls
- `src/components/ProtectedRoute.tsx` - Route guards

**Backend Integration:**
- `auth.users` table (Supabase Auth)
- `profiles` table (user metadata)
- RLS policies for user data isolation

**State Flow:**
```
Auth Page → authStore.login() → Supabase Auth API 
→ Store user in authStore → Persist to localStorage 
→ Redirect to dashboard
```

---

#### **Module 2: Chord Library & Management**

**Responsibilities:**
- Browse 100+ standard chords
- Create/edit custom chords
- Save chord presets
- Filter by category/type/root

**Components:**
- `src/pages/ChordLibrary.tsx` - Main library page
- `src/pages/ChordEditor.tsx` - Chord creation/editing
- `src/components/features/ChordDiagram.tsx` - SVG rendering
- `src/components/features/ChordDetailModal.tsx` - Chord details

**Stores:**
- `src/stores/chordLibraryStore.ts` - Filter state (persisted)
- `src/stores/customChordStore.ts` - Custom chords (persisted)
- `src/stores/presetStore.ts` - Saved presets (persisted)

**Backend Integration:**
- `custom_chords` table - User-created chords
- `user_presets` table - Named chord collections
- RLS: Users can only access own custom chords

**Data Flow:**
```
User selects filters → chordLibraryStore updates 
→ Filter CHORD_DATABASE + custom chords 
→ Render filtered grid → User saves preset 
→ presetStore.addPreset() → localStorage + Supabase sync
```

---

#### **Module 3: Chord Practice System**

**Responsibilities:**
- Practice individual chords with detection
- Metronome integration
- Session tracking
- Real-time feedback

**Components:**
- `src/pages/ChordSetup.tsx` - Chord selection
- `src/pages/Practice.tsx` - Practice interface
- `src/components/features/MetronomeModal.tsx` - Metronome controls
- `src/components/features/VolumeControl.tsx` - Audio controls

**Hooks:**
- `src/hooks/useChordDetection.ts` - Microphone chord recognition
- `src/hooks/useChordAudio.ts` - Chord playback synthesis
- `src/hooks/useMetronomeAudio.ts` - Metronome click generation
- `src/hooks/useSessionStats.ts` - Attempt tracking

**Stores:**
- `src/stores/practiceStore.ts` - Practice state (ephemeral)
- `src/stores/metronomeStore.ts` - Metronome settings (persisted)
- `src/stores/detectionSettingsStore.ts` - Mic sensitivity (persisted)
- `src/stores/practiceHistoryStore.ts` - Session history (persisted)

**Backend Integration:**
- `practice_sessions` table - Session metadata
- `practice_entries` table - Individual chord attempts
- `chord_mastery` table - Per-chord statistics
- `practice_streaks` table - Daily practice tracking

**Data Flow:**
```
ChordSetup: User selects chords → practiceStore.startPractice() 
→ Navigate to /practice

Practice Page:
  useChordDetection listens → Analyzes audio → Compares to target 
  → Correct: Record attempt + advance → Wrong: Record confusion 
  → End session: Save to practiceHistoryStore → Sync to Supabase
```

---

#### **Module 4: Progression Practice System**

**Responsibilities:**
- Practice chord progressions (I-IV-V-I, etc.)
- Key/scale selection with circle of fifths
- Style-based progressions (blues, jazz, etc.)
- Custom progression builder

**Components:**
- `src/pages/ProgressionPractice.tsx` - Two-phase UI (setup + practice)
- Key components: KeySelector, ScaleSelector, ProgressionPresetSelector

**Constants:**
- `src/constants/scales.ts` - 15 key signatures, 6 scales, 13 common progressions, 13 style categories
- `src/constants/strumming.ts` - Strumming patterns per style

**Stores:**
- `src/stores/progressionStore.ts` - Progression state (NOT persisted - ephemeral)
- Saved progressions via manual localStorage

**Backend Integration:**
- `progression_practice_sessions` table - Session metadata
- `progression_entries` table - Individual chord plays
- Stores: key, scale, progression name, completed cycles

**Data Flow:**
```
Setup View:
  Select key → Select scale → resolveScaleChords() 
  → Choose preset OR build custom → Preview chords 
  → Click Start → startProgression()

Practice View:
  Display progression timeline → useChordDetection listens 
  → Correct detection: advance to next chord 
  → Metronome beat-sync: auto-advance on beat 
  → End session: Save to Supabase
```

**Integration with Chord Library:**
- Uses `findChordInLibrary(chordSymbol, quality)` to resolve scale degrees to actual ChordData
- Enharmonic fallback (C# ↔ Db) for flat key signatures

---

#### **Module 5: Scale Practice System**

**Responsibilities:**
- Practice guitar scales (major, minor, pentatonic, etc.)
- Fretboard visualization
- Scale playback audio

**Components:**
- `src/pages/ScalePractice.tsx` - Scale practice interface
- `src/components/features/ScaleFretboard.tsx` - Fretboard visualization

**Hooks:**
- `src/hooks/useScaleAudio.ts` - Scale note playback

**Backend Integration:**
- `scale_practice_sessions` table

**Data Flow:**
```
Select scale + root note → Display fretboard positions 
→ Play scale audio → Practice with mic detection 
→ Save session
```

---

#### **Module 6: Tuner System**

**Responsibilities:**
- Real-time pitch detection
- Visual tuning feedback
- Calibration (A4 = 440Hz default)

**Components:**
- `src/pages/Tuner.tsx` - Tuner interface

**Hooks:**
- `src/hooks/usePitchDetection.ts` - Core pitch detection algorithm

**Stores:**
- `src/stores/tunerStore.ts` - Tuner settings (persisted)

**Audio Processing:**
- `src/lib/audio/pitch-detection-worklet.ts` - Web Audio Worklet for real-time analysis

**Data Flow:**
```
Microphone input → AudioContext → PitchDetectionWorklet 
→ NSDF autocorrelation → Frequency detection 
→ Map to nearest note → Display offset (cents)
```

---

#### **Module 7: Practice History & Analytics**

**Responsibilities:**
- Session history tracking
- Confusion matrix (chord detection errors)
- Progress charts
- Achievements

**Components:**
- `src/pages/PracticeHistory.tsx` - History dashboard
- `src/pages/Achievements.tsx` - Achievement tracking

**Stores:**
- `src/stores/practiceHistoryStore.ts` - Local session cache + confusion matrix

**Backend Integration:**
- `practice_sessions`, `progression_practice_sessions`, `scale_practice_sessions`
- `chord_mastery` - Per-chord statistics
- `achievements` + `user_achievements` tables
- `leaderboard_cache` - Ranked player data

**Data Flow:**
```
End of session → practiceHistoryStore.addSession() 
→ Persist to localStorage → Background sync to Supabase 
→ Update leaderboard cache → Check achievement triggers
```

---

#### **Module 8: Settings & Preferences**

**Responsibilities:**
- User preferences (metronome, detection, audio)
- Data export
- Notification settings

**Components:**
- `src/pages/Settings.tsx` - Settings UI
- `src/pages/DataExport.tsx` - Export practice data

**Stores:**
- `audioStore`, `metronomeStore`, `detectionSettingsStore`, `tunerStore` - All persisted

**Backend Integration:**
- `user_settings` table - Server-side settings backup
- Settings sync on login

**Data Flow:**
```
User changes setting → Store updates → localStorage persist 
→ useSettingsSync hook → Debounced sync to Supabase 
→ On login: Merge server settings with local
```

---

### 2.2 Supporting Modules

#### **Module 9: Audio Playback System**

**Responsibilities:**
- Synthesize chord audio (3-oscillator per string)
- Reference tone generation
- Metronome click synthesis

**Hooks:**
- `useChordAudio.ts` - Chord strumming synthesis
- `useReferenceTone.ts` - Sustained clean tones
- `useMetronomeAudio.ts` - Click generation

**Audio Architecture:**
```
useChordAudio:
  For each string: 
    Main oscillator (triangle) + Octave (sine) + Sub-harmonic (sine)
    → Low-pass filter (6×→2× fundamental, 40% duration)
    → Gain envelope (8ms attack, 120ms decay, 2.5s release)
    → Master gain (volume^1.2 × 8)
    → 35ms strum delay per string

useReferenceTone:
  For each string:
    Main (sine) + Detuned (sine, +3 cents)
    → Fixed 0.18 master volume
    → 15ms strum delay per string
```

**Integration Points:**
- All practice pages use these hooks
- Volume controlled by `audioStore.chordVolume`
- Mute state via `audioStore.muted`

---

#### **Module 10: Chord Detection System**

**Responsibilities:**
- Real-time microphone chord recognition
- 6-layer voice rejection
- Chromagram-based matching

**Hook:**
- `src/hooks/useChordDetection.ts`

**Audio Processing:**
- `src/lib/audio/chromagram.ts` - Spectral analysis with whitening
- `src/lib/audio/device-detection.ts` - Mobile/desktop threshold profiles

**Detection Pipeline:**
```
Microphone → AudioContext → Analyzer Node 
→ FFT (2048 samples) → Chromagram (12-bin pitch class)
→ Voice rejection (6 gates):
  1. RMS silence gate
  2. Spectral flatness (noise detection)
  3. Spectral crest factor (tonal vs noise)
  4. Formant detection (vocal frequencies)
  5. Spectral flux (rapid changes)
  6. Consecutive frame debouncing
→ Triple-metric matching:
  1. Binary matching (notes present/absent)
  2. Weighted matching (energy per note)
  3. Cosine similarity
→ Best match → onCorrect() or onWrongDetected()
```

**Integration Points:**
- Practice page: Detects target chord
- Progression practice: Detects current progression chord
- Calibration wizard: Auto-tunes thresholds

---

#### **Module 11: Offline & PWA System**

**Responsibilities:**
- Service worker caching
- IndexedDB storage
- Background sync
- Push notifications

**Files:**
- `public/sw.js` - Service worker
- `src/lib/indexeddb.ts` - IndexedDB wrapper
- `src/hooks/useOfflineSync.ts` - Background sync
- `src/hooks/usePWA.ts` - Install prompt

**Offline Strategy:**
```
Cache-First:
  - Static assets (JS, CSS, fonts, images)
  - Audio worklet files
  - Chord data constants

Network-First with Cache Fallback:
  - API requests
  - User data

Background Sync:
  - Queue failed API requests
  - Sync when online
```

---

## 3. Navigation Flow

### 3.1 Route Map

```typescript
// src/App.tsx

<BrowserRouter>
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    
    {/* Practice Routes */}
    <Route path="/practice-landing" element={<PracticeLanding />} />
    <Route path="/chord-setup" element={<ChordSetup />} />
    <Route path="/practice" element={<Practice />} />
    <Route path="/progression-practice" element={<ProgressionPractice />} />
    <Route path="/scale-practice" element={<ScalePractice />} />
    
    {/* Library & Tools */}
    <Route path="/chord-library" element={<ChordLibrary />} />
    <Route path="/editor" element={<ChordEditor />} />
    <Route path="/tuner" element={<Tuner />} />
    
    {/* History & Analytics */}
    <Route path="/history" element={<PracticeHistory />} />
    <Route path="/achievements" element={<Achievements />} />
    <Route path="/leaderboard" element={<Leaderboard />} />
    
    {/* Settings & User */}
    <Route path="/settings" element={<Settings />} />
    <Route path="/goals" element={<Goals />} />
    
    {/* Admin */}
    <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
    
    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

### 3.2 Navigation Patterns

#### **Pattern 1: Setup → Practice → Summary**

```
ChordSetup → Practice → SessionSummary → PracticeHistory
     ↓           ↓             ↓                ↓
practiceStore  Session      Analytics     Supabase sync
              tracking
```

#### **Pattern 2: Library → Editor → Library**

```
ChordLibrary → (Edit button) → ChordEditor → (Save) → ChordLibrary
      ↓                              ↓                        ↓
customChordStore              editStandardChord()      Updated library
                              or editCustomChord()
```

#### **Pattern 3: Progression Setup → Practice → History**

```
ProgressionPractice (Setup) → Practice View → Save & Exit → History
          ↓                          ↓                ↓
  progressionStore             Detection +      Supabase sync
                               Metronome
```

### 3.3 Navigation Guards

**Protected Routes:**
- Only check authentication, not specific permissions
- Redirect to `/auth` if not logged in

**Data Preservation:**
- Practice state preserved in stores (ephemeral)
- Settings persist across sessions (localStorage + Supabase)
- History cached locally, synced in background

---

## 4. State Management Architecture

### 4.1 Zustand Store Organization

| Store | Persisted? | Purpose | Key State |
|-------|-----------|---------|-----------|
| `authStore` | ✅ Manual | User auth | user, token, isAuthenticated |
| `practiceStore` | ❌ No | Practice session | selectedChords, isPracticing, currentIndex |
| `progressionStore` | ❌ No | Progression session | key, scale, preset, isPracticing, loopCount |
| `chordLibraryStore` | ✅ Zustand | Library filters | filterCategories, filterTypes, selectedChordIds |
| `customChordStore` | ✅ Zustand | Custom chords | customChords, hiddenStandardChords |
| `presetStore` | ✅ Zustand | Chord presets | presets (ChordPreset[]) |
| `audioStore` | ✅ Manual | Audio settings | chordVolume, muted |
| `metronomeStore` | ✅ Zustand | Metronome | bpm, isPlaying, syncEnabled |
| `tunerStore` | ✅ Zustand | Tuner settings | calibration, autoListen |
| `detectionSettingsStore` | ✅ Zustand | Detection params | sensitivity, advancedSettings |
| `practiceHistoryStore` | ✅ Zustand | Session cache | sessions, confusionMatrix |

### 4.2 State Flow Principles

**1. Ephemeral vs Persistent State:**
- **Ephemeral**: Practice/progression session state (reset on page reload)
- **Persistent**: User preferences, custom data, history cache

**2. Single Source of Truth:**
- Settings stored in Zustand store → Synced to Supabase
- On conflict: Server wins (on login), local wins (offline)

**3. Optimistic Updates:**
- UI updates immediately
- Background sync to Supabase
- Rollback on sync failure

**4. Cross-Store Communication:**
```typescript
// Example: metronomeStore triggers chord advance in practiceStore
metronomeStore.subscribe((state) => {
  if (state.beatCounter === state.beatsPerChord) {
    const practiceState = practiceStore.getState();
    if (practiceState.isPracticing) {
      practiceState.nextChord();
    }
  }
});
```

---

## 5. Backend Integration

### 5.1 Supabase Table Schema

#### **Core Tables**

```sql
-- User Management
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text NOT NULL,
  avatar_url text,
  total_sessions int DEFAULT 0,
  total_chords_practiced int DEFAULT 0,
  average_accuracy numeric(5,2) DEFAULT 0
)

-- Practice Sessions
practice_sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  total_chords int DEFAULT 0,
  correct_chords int DEFAULT 0,
  accuracy numeric(5,2),
  practice_mode text DEFAULT 'standard'
)

-- Progression Sessions
progression_practice_sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  progression_name text NOT NULL,
  key text NOT NULL,
  scale text NOT NULL,
  total_chords int NOT NULL,
  completed_cycles int DEFAULT 0,
  started_at timestamptz NOT NULL,
  ended_at timestamptz
)

-- Custom Chords
custom_chords (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  frets jsonb NOT NULL,
  fingers jsonb,
  notes jsonb,
  chord_type text,
  created_at timestamptz DEFAULT now()
)

-- Saved Presets
user_presets (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
)

-- Chord Mastery
chord_mastery (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  chord_name text NOT NULL,
  total_attempts int DEFAULT 0,
  successful_attempts int DEFAULT 0,
  accuracy numeric(5,2),
  mastery_level text DEFAULT 'beginner',
  UNIQUE(user_id, chord_name)
)
```

#### **RLS Policies (Row Level Security)**

Every table MUST have RLS enabled:

```sql
-- Enable RLS
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Separate policy per operation per role
CREATE POLICY "authenticated_select_own_sessions"
  ON practice_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "authenticated_insert_own_sessions"
  ON practice_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "authenticated_update_own_sessions"
  ON practice_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "authenticated_delete_own_sessions"
  ON practice_sessions FOR DELETE TO authenticated
  USING (user_id = auth.uid());
```

### 5.2 API Layer Organization

```
src/lib/api/
├── auth.ts              # Authentication (login, signup, logout)
├── practice.ts          # Practice sessions + entries
├── progressionPractice.ts  # Progression sessions
├── scalePractice.ts     # Scale sessions
├── customChords.ts      # Custom chord CRUD
├── presets.ts           # Preset CRUD
├── chordMastery.ts      # Chord statistics
├── streaks.ts           # Daily practice tracking
├── achievements.ts      # Achievement unlocking
├── leaderboard.ts       # Leaderboard queries
├── settings.ts          # User settings sync
├── offlineSync.ts       # Background sync queue
└── notifications.ts     # Push notifications
```

### 5.3 API Call Pattern

```typescript
// src/lib/api/practice.ts

import { supabase } from '@/lib/supabase';

export const practiceApi = {
  async createSession(session: CreatePracticeSessionInput) {
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getSessions(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // Optimistic update pattern
  async updateSession(id: string, updates: Partial<PracticeSession>) {
    const { data, error } = await supabase
      .from('practice_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

### 5.4 Background Sync Strategy

```typescript
// src/hooks/useBackgroundSync.ts

export function useBackgroundSync() {
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      const queue = await getOfflineSyncQueue();
      
      for (const item of queue) {
        try {
          await syncItem(item);
          await markSynced(item.id);
        } catch (error) {
          await incrementRetryCount(item.id);
        }
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(syncInterval);
  }, []);
}
```

---

## 6. Audio System Integration

### 6.1 Audio Context Management

**Single Shared AudioContext:**
```typescript
// src/lib/audio/audio-context.ts

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || 
      (window as any).webkitAudioContext)();
  }
  
  // Resume if suspended (mobile autoplay policy)
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  
  return sharedAudioContext;
}
```

**All audio hooks use shared context:**
- `useChordDetection` → Input stream
- `useChordAudio` → Synthesis output
- `useMetronomeAudio` → Click output
- `usePitchDetection` → Tuner input

### 6.2 Microphone Permission Flow

```
User clicks "Start Listening" 
→ navigator.mediaDevices.getUserMedia({ audio: true })
→ Permission granted: Create MediaStreamSource 
→ Connect to AnalyzerNode + AudioWorkletNode
→ Start detection loop

Permission denied:
→ Show error banner with instructions
→ Disable detection features
```

### 6.3 Audio Worklet Integration

**Pitch Detection Worklet:**
```javascript
// public/pitch-detection-processor.js

class PitchDetectionProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    
    const samples = input[0];
    
    // NSDF autocorrelation
    const frequency = detectPitch(samples);
    
    // Post message to main thread
    this.port.postMessage({ frequency });
    
    return true;
  }
}
```

**Hook Integration:**
```typescript
// src/hooks/usePitchDetection.ts

const workletNode = new AudioWorkletNode(context, 'pitch-detection-processor');
workletNode.port.onmessage = (event) => {
  const { frequency } = event.data;
  setDetectedFrequency(frequency);
};
```

---

## 7. Data Flow Diagrams

### 7.1 Practice Session Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CHORD PRACTICE SESSION                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│ ChordSetup   │ User selects chords, filters, timer
│   Page       │
└──────┬───────┘
       │ practiceStore.startPractice()
       │ navigate('/practice')
       ▼
┌──────────────┐
│  Practice    │ ┌─────────────────────────────────┐
│   Page       │ │ useChordDetection               │
└──────┬───────┘ │  - Listen to mic                │
       │         │  - Analyze audio (chromagram)   │
       │         │  - Compare to target chord      │
       │         │  - Trigger onCorrect/onWrong    │
       │         └─────────────────────────────────┘
       │                      │
       │         ┌────────────┴────────────┐
       │         ▼                         ▼
       │   [Correct]                  [Wrong]
       │         │                         │
       │         │ practiceStore.nextChord()
       │         │ sessionStats.recordAttempt()
       │         │                         │
       │         │    practiceHistoryStore.recordConfusion()
       │         │                         │
       │         └────────────┬────────────┘
       │                      │
       │              Session continues...
       │                      │
       ▼                      ▼
┌──────────────┐    End session (Back button)
│ SessionSummary│    sessionStats.endSession()
│   Modal       │
└──────┬───────┘
       │ practiceHistoryStore.addSession()
       │ Sync to Supabase (practice_sessions + entries)
       ▼
┌──────────────┐
│ PracticeHistory│ Display charts, confusion matrix
│   Page        │
└───────────────┘
```

### 7.2 Progression Practice Flow

```
┌─────────────────────────────────────────────────────────────┐
│               PROGRESSION PRACTICE SESSION                   │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Progression  │ SETUP VIEW:
│ Practice     │  - Select key signature
│   Page       │  - Select scale (major, minor, etc.)
└──────┬───────┘  - Choose progression preset OR build custom
       │          - Preview chord symbols
       │
       │ progressionStore.startProgression()
       │ resolvePresetChords() → ProgressionChordInfo[]
       │
       ▼
┌──────────────┐
│ Progression  │ PRACTICE VIEW:
│ Practice     │  ┌────────────────────────────────┐
│   Page       │  │ Progression Timeline           │
└──────┬───────┘  │ [I: C] › [IV: F] › [V: G] › [I: C]│
       │          └────────────────────────────────┘
       │
       │          ┌────────────────────────────────┐
       │          │ useChordDetection              │
       │          │  - Target: currentChord        │
       │          │  - onCorrect: reveal + advance │
       │          │  - onWrong: record confusion   │
       │          └────────────────────────────────┘
       │
       │          ┌────────────────────────────────┐
       │          │ metronomeStore                 │
       │          │  - Beat-sync auto-advance      │
       │          │  - Auto-reveal before advance  │
       │          └────────────────────────────────┘
       │
       │ End session (Save & Exit)
       │ progressionPracticeApi.createSession()
       ▼
┌──────────────┐
│ Practice     │ View progression sessions
│  History     │ Filter by mode: 'progression'
└──────────────┘
```

### 7.3 Chord Library → Editor Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  CHORD LIBRARY → EDITOR                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│ ChordLibrary │ User clicks "Edit" on chord card
│   Page       │
└──────┬───────┘
       │
       ├─ [Standard Chord] ──────────────────────────┐
       │                                              │
       │  customChordStore.editStandardChord(chord)  │
       │   - Convert ChordData → CustomChordData     │
       │   - Calculate baseFret, numFrets            │
       │   - Create markers with colors/shapes       │
       │   - Set sourceChordId                       │
       │   - Navigate to /editor                     │
       │                                              │
       └─ [Custom Chord] ────────────────────────────┤
                                                      │
          customChordStore.editChord(id)             │
           - Load from customChords array            │
           - Navigate to /editor                     │
                                                      │
                                                      ▼
                                            ┌──────────────┐
                                            │ ChordEditor  │
                                            │   Page       │
                                            └──────┬───────┘
                                                   │
                                        User edits frets, markers, barres
                                                   │
                                        Click "Save"
                                                   │
                                        customChordStore.updateCustomChord()
                                        or addCustomChord() if new
                                                   │
                                        navigate(-1) → Back to library
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │ ChordLibrary │
                                            │   Page       │
                                            └──────────────┘
                                            Updated library with custom chord
```

---

## 8. Feature Integration Points

### 8.1 Metronome Integration

**Cross-Page Usage:**
- Practice page (beat-sync chord advance)
- Progression practice (auto-advance + auto-reveal)
- Scale practice (tempo reference)

**State Coordination:**
```typescript
// metronomeStore triggers callbacks
export interface MetronomeCallbacks {
  onBeat?: (beatNumber: number) => void;
  onChordAdvance?: () => void;
  onAutoReveal?: () => void;
}

// Practice page subscribes
metronomeStore.subscribe((state) => {
  if (state.shouldAdvance && isPracticing) {
    revealChord();
    nextChord();
    resetBeatCounter();
  }
});
```

### 8.2 Detection Settings Integration

**Calibration Wizard:**
- Opens from Practice page
- Auto-tunes detection parameters
- Saves to `detectionSettingsStore`
- Applied immediately to `useChordDetection`

**Advanced Settings Panel:**
- Per-parameter sliders
- Real-time preview
- Device-specific profiles (mobile vs desktop)

**Integration:**
```typescript
const { sensitivity, advancedSettings } = useDetectionSettingsStore();

useChordDetection({
  sensitivity,
  advancedSettings,
  targetChord,
  onCorrect,
  onWrongDetected,
});
```

### 8.3 Session Stats Integration

**Hook Usage:**
```typescript
// Practice page
const session = useSessionStats({
  mode: 'chord',
  userId: user?.id,
});

// On correct detection
session.recordAttempt(chordSymbol, chordName, 'correct');

// On skip
session.recordAttempt(chordSymbol, chordName, 'skipped');

// End session
session.endSession(); // Returns summary stats
```

**Data Collection:**
- Total attempts
- Correct attempts
- Accuracy percentage
- Average detection time
- Confusion pairs (expected → detected)

**Persistence:**
```typescript
// SessionSummary modal
const handleSave = async () => {
  await practiceHistoryStore.addSession({
    mode: 'chord',
    chords: session.getAttempts(),
    startTime,
    endTime,
    accuracy: session.getAccuracy(),
  });
  
  // Background sync to Supabase
  await practiceApi.createSession(sessionData);
};
```

### 8.4 Chord Playback Integration

**Usage Across Pages:**

| Page | Use Case | Trigger |
|------|----------|---------|
| ChordLibrary | Preview chord sound | Click play button on card |
| ChordEditor | Test current chord | Click play in editor |
| Practice | Play chord after reveal | Auto-play or manual button |
| ProgressionPractice | Preview scale chords | Click chord in setup view |
| ScaleSetup | Preview scale notes | Click scale degree button |

**Hook API:**
```typescript
const { playChord } = useChordAudio();

// Play standard chord
playChord(chordData);

// Play with custom settings
playChord(chordData, { 
  volume: 0.8, 
  strumDelay: 50 
});
```

### 8.5 Volume Control Integration

**Global Volume State:**
```typescript
// audioStore.ts
interface AudioState {
  chordVolume: number;  // 0-100
  muted: boolean;
}
```

**Component:**
```tsx
<VolumeControl 
  compact={true}  // Show icon only on mobile
  position="header"  // Or "practice" for practice page
/>
```

**Integration:**
- All audio hooks read from `audioStore`
- Master volume applied to all synthesis
- Mute instantly stops all audio

---

## 9. Session Lifecycle

### 9.1 Practice Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    PRACTICE SESSION LIFECYCLE                │
└─────────────────────────────────────────────────────────────┘

1. INITIALIZATION
   ChordSetup → User selects chords
   practiceStore.startPractice() → Sets isPracticing = true
   navigate('/practice') → Practice page mounts

2. SESSION START
   Practice page useEffect:
     - Initialize session stats (useSessionStats)
     - Start timestamp: sessionStartTime
     - Load target chord from practiceStore
     - Start microphone (useChordDetection with autoStart)
     - Optional: Start metronome if syncEnabled

3. PRACTICE LOOP
   For each chord:
     a. Display current chord (revealed or hidden)
     b. Detection listens for correct chord
     c. User plays chord on guitar
     d. Detection analyzes audio
     e. Match found:
        - Correct: Record attempt, reveal, advance
        - Wrong: Record confusion, show feedback
     f. User can manually:
        - Skip (next button)
        - Restart (restart button)
        - Play reference tone
        - Adjust settings

4. SESSION END
   User clicks "Back" or "Finish":
     a. Stop detection (stopListening)
     b. Stop metronome
     c. End session stats (session.endSession())
     d. Show SessionSummary modal
     e. User reviews stats
     f. Click "Save":
        - practiceHistoryStore.addSession()
        - Background sync to Supabase
     g. Navigate to /history or /

5. CLEANUP
   Practice page unmount:
     - Stop detection
     - Stop metronome
     - Clear practiceStore.isPracticing
     - Clear audio resources
```

### 9.2 Progression Session Lifecycle

```
1. INITIALIZATION
   ProgressionPractice page mounts
   Setup View displays

2. SETUP PHASE
   User selects:
     - Key signature (C, G, D, etc.)
     - Scale (Major, Minor, etc.)
     - Progression (preset or custom)
   
   progressionStore computes:
     - resolveScaleChords(key, scale)
     - resolvePresetChords(preset, key, scale)
     - findChordInLibrary() for each degree

3. PRACTICE START
   Click "Start Practice":
     - progressionStore.startProgression()
     - Switch to Practice View
     - Initialize session stats
     - Start detection
     - currentChordIndex = 0
     - loopCount = 0

4. PROGRESSION LOOP
   For each chord in progression:
     a. Display progression timeline (past/current/future)
     b. Show current chord info
     c. Auto-reveal or wait for detection
     d. Detection or beat-sync advances to next
     e. At end of progression:
        - Wrap to index 0
        - Increment loopCount
        - Continue or user stops

5. SESSION END
   Save & Exit:
     - progressionPracticeApi.createSession()
     - Save entries to progression_entries table
     - Navigate to /history

6. CLEANUP
   Unmount:
     - Stop detection
     - Stop metronome
     - Clear progressionStore.isPracticing
```

---

## 10. Scalability Considerations

### 10.1 Performance Optimization

**Audio Processing:**
- Use AudioWorklet for pitch detection (separate thread)
- Debounce detection results (50ms)
- Throttle UI updates (requestAnimationFrame)

**React Rendering:**
- Memoize expensive components (ChordDiagram, Chromagram viz)
- Use React.memo for static UI
- Lazy load routes with React.lazy

**Database Queries:**
- Index foreign keys (user_id, session_id)
- Use pagination for history (limit 20 per page)
- Cache leaderboard queries (1 hour TTL)

**Bundle Size:**
- Code splitting by route
- Dynamic imports for heavy libraries
- Tree-shaking unused code

### 10.2 Data Volume Management

**Local Storage Limits:**
- Zustand persist: ~5MB per store
- IndexedDB: No practical limit (100MB+)
- Strategy: Keep last 30 days in IndexedDB, older in Supabase

**Sync Strategy:**
- Background sync every 30 seconds
- Batch insert sessions (max 10 per request)
- Queue failed requests for retry

**Cleanup:**
- Archive sessions older than 6 months
- Delete local cache on logout
- Prune confusion matrix (top 100 pairs)

### 10.3 Feature Flags & A/B Testing

```typescript
// src/lib/ab-testing.ts

export const FEATURE_FLAGS = {
  ADVANCED_DETECTION: 'advanced_detection_v2',
  NEW_PROGRESSION_UI: 'progression_ui_redesign',
  AI_CHORD_SUGGESTIONS: 'ai_suggestions',
};

export function useFeatureFlag(flag: string): boolean {
  const { user } = useAuthStore();
  
  // Check user's feature flag status
  return user?.featureFlags?.[flag] ?? false;
}
```

---

## 11. Error Handling Strategy

### 11.1 Error Boundaries

```tsx
// src/components/ErrorBoundary.tsx

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to Sentry
    Sentry.captureException(error, { extra: errorInfo });
    
    // Log to custom logger
    logger.error('React Error Boundary', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

**Usage:**
- Wrap entire app in root ErrorBoundary
- Wrap each major page in PageErrorBoundary
- Wrap audio processing in AudioErrorBoundary

### 11.2 API Error Handling

```typescript
// src/lib/api-error-handler.ts

export async function handleApiError(error: any) {
  if (error.code === 'PGRST116') {
    // Row not found
    toast.error('Data not found');
  } else if (error.code === '23505') {
    // Unique constraint violation
    toast.error('Duplicate entry');
  } else if (error.message.includes('JWT')) {
    // Auth token expired
    authStore.logout();
    navigate('/auth');
  } else {
    // Generic error
    toast.error('Something went wrong. Please try again.');
    
    // Log to Sentry
    Sentry.captureException(error);
  }
}
```

### 11.3 Audio Error Handling

```typescript
// Microphone permission denied
if (permissionDenied) {
  return (
    <div className="error-banner">
      <MicOff />
      <p>Microphone access denied. Please enable in browser settings.</p>
      <button onClick={requestPermission}>Grant Access</button>
    </div>
  );
}

// AudioContext suspended (mobile)
if (audioContext.state === 'suspended') {
  // Show "Tap to activate audio" overlay
  return <AudioActivationPrompt onClick={() => audioContext.resume()} />;
}

// Detection timeout
if (detectionTimeout) {
  return (
    <div className="warning-banner">
      <AlertCircle />
      <p>No sound detected. Check your microphone or adjust sensitivity.</p>
    </div>
  );
}
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

**Audio Processing:**
```typescript
// src/lib/audio/__tests__/chromagram.test.ts

describe('Chromagram', () => {
  it('should compute 12-bin pitch class histogram', () => {
    const audioData = generateTestSignal(440); // A4
    const chromagram = computeChromagram(audioData);
    
    expect(chromagram[9]).toBeGreaterThan(0.8); // A is bin 9
  });
  
  it('should apply spectral whitening', () => {
    const audioData = generateNoiseSignal();
    const chromagram = computeChromagram(audioData);
    
    const variance = computeVariance(chromagram);
    expect(variance).toBeLessThan(0.1); // Should be flattened
  });
});
```

**Chord Detection:**
```typescript
describe('useChordDetection', () => {
  it('should detect C major chord', async () => {
    const { result } = renderHook(() => useChordDetection({
      targetChord: C_MAJOR_CHORD,
      onCorrect: jest.fn(),
    }));
    
    // Simulate C major audio
    await simulateChordAudio('C');
    
    expect(result.current.detectedChord).toBe('C');
  });
});
```

### 12.2 Integration Tests

**Practice Session Flow:**
```typescript
// e2e/practice-session.spec.ts

test('complete practice session', async ({ page }) => {
  await page.goto('/chord-setup');
  
  // Select chords
  await page.click('[data-testid="chord-c-major"]');
  await page.click('[data-testid="chord-g-major"]');
  
  // Start practice
  await page.click('[data-testid="start-practice"]');
  
  // Verify practice page loaded
  await expect(page).toHaveURL('/practice');
  
  // Simulate correct detection
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('chord-detected', {
      detail: { chord: 'C' }
    }));
  });
  
  // Verify chord advanced
  await expect(page.locator('[data-testid="current-chord"]')).toHaveText('G');
  
  // End session
  await page.click('[data-testid="back-button"]');
  
  // Verify summary modal
  await expect(page.locator('[data-testid="session-summary"]')).toBeVisible();
});
```

### 12.3 E2E Tests

**Critical User Flows:**
1. Sign up → Practice session → Save → View history
2. Create custom chord → Save preset → Use in practice
3. Offline mode → Practice → Sync when online
4. Calibrate detection → Practice with improved accuracy

---

## 13. Integration Checklist

### 13.1 Page Integration Checklist

- [ ] All pages use shared AudioContext
- [ ] All pages respect audio volume/mute settings
- [ ] All pages handle auth state correctly (redirect if needed)
- [ ] All pages clean up resources on unmount
- [ ] All pages sync critical data to Supabase
- [ ] All pages handle offline mode gracefully
- [ ] All pages use consistent navigation patterns
- [ ] All pages have error boundaries
- [ ] All pages have loading states
- [ ] All pages are responsive (mobile/tablet/desktop)

### 13.2 State Integration Checklist

- [ ] No duplicate state across stores
- [ ] Zustand persist middleware configured correctly
- [ ] localStorage keys are namespaced (`fretmaster-*`)
- [ ] State reset on logout
- [ ] Optimistic updates with rollback
- [ ] Cross-store communication documented
- [ ] State migrations handled for version updates

### 13.3 Backend Integration Checklist

- [ ] All tables have RLS enabled
- [ ] Separate policy per operation per role
- [ ] Foreign keys use `ON DELETE CASCADE`
- [ ] Indexes on frequently queried columns
- [ ] API layer has error handling
- [ ] Background sync queue for offline mode
- [ ] Settings sync on login
- [ ] Session data synced after practice

### 13.4 Audio Integration Checklist

- [ ] Single shared AudioContext
- [ ] Microphone permission flow implemented
- [ ] Detection pauses during playback
- [ ] Volume control affects all audio
- [ ] Mute state respected everywhere
- [ ] AudioWorklet loaded correctly
- [ ] Mobile audio activation handled
- [ ] Audio cleanup on unmount

---

## 14. Next Steps & Recommendations

### 14.1 Immediate Priorities

1. **Complete ProgressionPractice Implementation**
   - Finish the full two-phase UI (setup + practice views)
   - Integrate all components from specification

2. **Fix Mobile Chord Detection**
   - Diagnose why zero chords detected on mobile
   - Add detailed logging to useChordDetection
   - Test threshold profiles on actual mobile devices

3. **Implement Session Summary Modal**
   - Build SessionSummary component
   - Show after practice session ends
   - Display accuracy, attempts, confusion matrix

4. **Add Missing Backend Sync**
   - progressionPracticeApi calls
   - scalePracticeApi calls
   - Offline queue implementation

### 14.2 Medium-Term Goals

1. **Practice History Dashboard**
   - Charts for progress over time
   - Confusion matrix visualization
   - Chord mastery heatmap

2. **Achievements System**
   - Define achievement triggers
   - Unlock notifications
   - Badge display

3. **Leaderboard**
   - Weekly/monthly rankings
   - Friend comparisons
   - Challenge system

4. **Advanced Features**
   - AI chord progression suggestions
   - Song transcription
   - Custom strumming pattern builder

### 14.3 Long-Term Vision

1. **Community Features**
   - Share custom chords
   - Collaborate on progressions
   - Instructor/student system

2. **Mobile App**
   - Native iOS/Android apps
   - Better audio performance
   - Offline-first architecture

3. **Advanced AI**
   - Real-time chord recognition from recordings
   - Style transfer (play in different genres)
   - Personalized practice recommendations

---

## 15. Conclusion

This architecture document serves as the **single source of truth** for how FretMaster's pages, components, state, audio, and backend all connect. 

**Key Principles:**
1. **Separation of Concerns** - Each module has clear responsibilities
2. **Data Flow Transparency** - Easy to trace from UI → Store → Backend
3. **Scalable Structure** - Organized for growth
4. **Error Resilience** - Comprehensive error handling at every layer
5. **Performance First** - Audio worklets, lazy loading, optimistic updates

**For Developers:**
- Use this as a reference when adding features
- Update this document when architecture changes
- All major decisions should align with these patterns

**For Integration Work:**
- Follow the navigation flow patterns
- Respect the state management architecture
- Use the established API patterns
- Test against the integration checklists

---

*This document will evolve as the app grows. Keep it updated.*
