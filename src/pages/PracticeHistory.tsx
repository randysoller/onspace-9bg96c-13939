import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { practiceApi } from '@/lib/api/practice';
import { usePracticeSessions } from '@/hooks/useQueryHooks';
import { prefetchStrategies } from '@/lib/react-query';
import { ArrowLeft, TrendingUp, Target, Clock, Flame } from 'lucide-react';
import { PracticeHistorySkeleton } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { handleApiErrorWithToast } from '@/lib/api-error-handler';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Session {
  id: string;
  started_at: string;
  ended_at: string;
  total_chords: number;
  correct_chords: number;
  accuracy: number;
  duration_seconds: number;
  practice_mode: string;
  created_at: string;
}

interface ChordFrequency {
  name: string;
  count: number;
}

export default function PracticeHistory() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Use React Query for data fetching with automatic caching
  const { 
    data: queryData, 
    isLoading: queryLoading,
    refetch 
  } = usePracticeSessions(user?.id || '', !!user);
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalChords: 0,
    avgAccuracy: 0,
  });

  // Prefetch leaderboard when viewing history
  useEffect(() => {
    if (user) {
      prefetchStrategies.prefetchLeaderboard();
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Use React Query data if available, otherwise load manually
    if (queryData) {
      setSessions(queryData as Session[]);
      setLoading(false);
    } else if (!queryLoading) {
      loadData();
    }
  }, [user, queryData, queryLoading]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [sessionsData, userStats] = await Promise.all([
        practiceApi.getUserSessions(user.id),
        practiceApi.getUserStats(user.id),
      ]);

      setSessions(sessionsData);
      setStats({
        totalSessions: userStats.total_sessions,
        totalChords: userStats.total_chords_practiced,
        avgAccuracy: userStats.average_accuracy,
      });
    } catch (err) {
      handleApiErrorWithToast(err, 'Practice History');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;

    setClearingHistory(true);
    try {
      // Optimistic update - clear UI immediately
      const previousSessions = sessions;
      const previousStats = stats;
      setSessions([]);
      setStats({ totalSessions: 0, totalChords: 0, avgAccuracy: 0 });

      // Make API call (placeholder - implement API method)
      // await practiceApi.clearHistory(user.id);
      // Invalidate React Query cache
      refetch();
      toast.success('Practice history cleared');
    } catch (err) {
      // Rollback on error
      handleApiErrorWithToast(err, 'Clear History');
      await loadData(); // Reload data
    } finally {
      setClearingHistory(false);
    }
  };

  const accuracyTrend = sessions
    .slice(0, 10)
    .reverse()
    .map((s, i) => ({
      session: `#${i + 1}`,
      accuracy: Number(s.accuracy),
    }));

  const recentSessions = sessions.slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pb-24">
        <div className="border-b border-zinc-800 bg-black px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <h1 className="text-xl font-bold">Practice History</h1>
            <div className="w-20" />
          </div>
        </div>
        <PracticeHistorySkeleton />
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
          <h1 className="text-xl font-bold">Practice History</h1>
          {sessions.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-red-500 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-zinc-400 text-sm">Total Sessions</div>
          </div>
          <div className="text-3xl font-black text-white">{stats.totalSessions}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-zinc-400 text-sm">Average Accuracy</div>
          </div>
          <div className="text-3xl font-black text-emerald-500">{stats.avgAccuracy.toFixed(1)}%</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Flame className="w-5 h-5 text-cyan-500" />
            </div>
            <div className="text-zinc-400 text-sm">Total Chords</div>
          </div>
          <div className="text-3xl font-black text-white">{stats.totalChords}</div>
        </div>
      </div>

      {/* Accuracy Trend Chart */}
      {accuracyTrend.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Accuracy Trend (Last 10 Sessions)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={accuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="session" stroke="#71717a" />
                <YAxis stroke="#71717a" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="px-4">
        <h2 className="text-lg font-bold mb-4">Recent Sessions</h2>
        <div className="space-y-3">
          {recentSessions.map((session) => (
            <div
              key={session.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-zinc-400">
                  {new Date(session.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-400">
                    {Math.floor(session.duration_seconds / 60)}m {session.duration_seconds % 60}s
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Accuracy</div>
                  <div className="text-xl font-bold text-emerald-500">
                    {Number(session.accuracy).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Correct</div>
                  <div className="text-xl font-bold text-white">{session.correct_chords}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Total</div>
                  <div className="text-xl font-bold text-zinc-400">{session.total_chords}</div>
                </div>
              </div>
            </div>
          ))}

          {recentSessions.length === 0 && (
            <EmptyState
              icon={Target}
              title="No practice sessions yet"
              description="Start practicing chords to track your progress and see detailed statistics here!"
              action={{
                label: 'Start Practicing',
                onClick: () => navigate('/chord-setup'),
              }}
              secondaryAction={{
                label: 'View Lessons',
                onClick: () => navigate('/lessons'),
              }}
            />
          )}
        </div>
      </div>

      {/* Confirmation dialog for clearing history */}
      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear Practice History?"
        description="This will permanently delete all your practice sessions and statistics. This action cannot be undone."
        confirmLabel="Clear History"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleClearHistory}
        loading={clearingHistory}
      />
    </div>
  );
}
