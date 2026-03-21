import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { chordMasteryApi, ChordMastery } from '@/lib/api/chordMastery';
import { practiceApi } from '@/lib/api/practice';
import { streaksApi } from '@/lib/api/streaks';
import { ArrowLeft, TrendingUp, Target, AlertCircle, Flame, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function Analytics() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [chordMastery, setChordMastery] = useState<ChordMastery[]>([]);
  const [weakestChords, setWeakestChords] = useState<ChordMastery[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      const [masteryData, weakData, streakData] = await Promise.all([
        chordMasteryApi.getUserChordMastery(user.id),
        chordMasteryApi.getWeakestChords(user.id, 5),
        streaksApi.getUserStreak(user.id),
      ]);

      setChordMastery(masteryData);
      setWeakestChords(weakData);
      setStreak({
        current: streakData?.current_streak || 0,
        longest: streakData?.longest_streak || 0,
      });
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mastery level distribution
  const masteryLevelData = [
    { name: 'Beginner', value: chordMastery.filter(c => c.mastery_level === 'beginner').length, color: '#ef4444' },
    { name: 'Intermediate', value: chordMastery.filter(c => c.mastery_level === 'intermediate').length, color: '#f59e0b' },
    { name: 'Advanced', value: chordMastery.filter(c => c.mastery_level === 'advanced').length, color: '#3b82f6' },
    { name: 'Master', value: chordMastery.filter(c => c.mastery_level === 'master').length, color: '#10b981' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-xl text-zinc-400">Loading...</div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold">Analytics</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Streak Card */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-sm text-zinc-400">Practice Streak</span>
              </div>
              <div className="text-4xl font-black text-orange-500">{streak.current} days</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-400 mb-1">Longest Streak</div>
              <div className="text-2xl font-bold text-white">{streak.longest} days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mastery Level Distribution */}
      {chordMastery.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Chord Mastery Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={masteryLevelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {masteryLevelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weakest Chords */}
      {weakestChords.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold">Chords Needing Practice</h2>
            </div>
            <div className="space-y-3">
              {weakestChords.map((chord) => (
                <div key={chord.id} className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white">{chord.chord_name}</h3>
                    <span className="text-red-500 font-bold">{chord.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{chord.total_attempts} attempts</span>
                    <span>·</span>
                    <span>{chord.successful_attempts} correct</span>
                    <span>·</span>
                    <span className="capitalize">{chord.mastery_level}</span>
                  </div>
                  <div className="relative w-full h-2 bg-zinc-700 rounded-full overflow-hidden mt-3">
                    <div
                      className="absolute inset-y-0 left-0 bg-red-500 transition-all"
                      style={{ width: `${chord.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Mastered Chords */}
      {chordMastery.filter(c => c.mastery_level === 'master').length > 0 && (
        <div className="px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold">Mastered Chords</h2>
            </div>
            <div className="space-y-2">
              {chordMastery
                .filter(c => c.mastery_level === 'master')
                .slice(0, 5)
                .map((chord) => (
                  <div key={chord.id} className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/40 rounded-lg p-3">
                    <span className="font-bold text-white">{chord.chord_name}</span>
                    <span className="text-emerald-500 font-bold">{chord.accuracy.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {chordMastery.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No analytics data yet</p>
          <p className="text-sm mt-1">Start practicing to see your progress</p>
        </div>
      )}
    </div>
  );
}
