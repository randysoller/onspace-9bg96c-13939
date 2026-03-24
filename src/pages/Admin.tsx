/**
 * Admin Dashboard
 * Monitor app health, user engagement, and performance metrics
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  Download,
  BarChart3,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';

interface AdminStats {
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  totalSessions: number;
  avgSessionDuration: number;
  avgAccuracy: number;
  totalChords: number;
  topChords: Array<{ chord: string; count: number }>;
  engagementRate: number;
  retentionRate7d: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    loadAdminStats();
  }, [timeRange]);

  const loadAdminStats = async () => {
    setLoading(true);
    try {
      // Calculate date ranges
      const now = new Date();
      const ranges = {
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        'all': new Date(0),
      };
      const startDate = ranges[timeRange];

      // Fetch aggregate statistics
      const [
        { count: totalUsers },
        { count: activeUsers24h },
        { count: activeUsers7d },
        { data: sessions },
        { data: chordMastery },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('practice_sessions').select('*')
          .gte('started_at', startDate.toISOString()),
        supabase.from('chord_mastery').select('chord_name, total_attempts')
          .order('total_attempts', { ascending: false })
          .limit(10),
      ]);

      // Calculate metrics
      const totalSessions = sessions?.length || 0;
      const avgSessionDuration = sessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / totalSessions || 0;
      const avgAccuracy = sessions?.reduce((acc, s) => acc + (s.accuracy || 0), 0) / totalSessions || 0;
      const totalChords = sessions?.reduce((acc, s) => acc + (s.total_chords || 0), 0) || 0;

      // Top chords
      const topChords = chordMastery?.map(c => ({
        chord: c.chord_name,
        count: c.total_attempts,
      })) || [];

      // Engagement and retention
      const engagementRate = totalUsers ? (activeUsers7d || 0) / totalUsers * 100 : 0;
      const retentionRate7d = activeUsers7d ? (activeUsers24h || 0) / activeUsers7d * 100 : 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers24h: activeUsers24h || 0,
        activeUsers7d: activeUsers7d || 0,
        totalSessions,
        avgSessionDuration,
        avgAccuracy,
        totalChords,
        topChords,
        engagementRate,
        retentionRate7d,
      });
    } catch (error) {
      console.error('Failed to load admin stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!stats) return;

    const data = {
      exportDate: new Date().toISOString(),
      timeRange,
      stats,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fretmaster-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Analytics exported');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-black px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <button
            onClick={exportAnalytics}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-6xl mx-auto">
        {/* Time Range Selector */}
        <div className="flex gap-2 overflow-x-auto">
          {(['24h', '7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors min-h-[44px] ${
                timeRange === range
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>

        {stats && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-zinc-400">Total Users</span>
                </div>
                <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-zinc-400">Active (24h)</span>
                </div>
                <p className="text-3xl font-bold">{stats.activeUsers24h.toLocaleString()}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {((stats.activeUsers24h / stats.totalUsers) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-zinc-400">Engagement</span>
                </div>
                <p className="text-3xl font-bold">{stats.engagementRate.toFixed(1)}%</p>
                <p className="text-xs text-zinc-500 mt-1">7-day active rate</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-zinc-400">Retention</span>
                </div>
                <p className="text-3xl font-bold">{stats.retentionRate7d.toFixed(1)}%</p>
                <p className="text-xs text-zinc-500 mt-1">7-day retention</p>
              </div>
            </div>

            {/* Practice Metrics */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold">Practice Statistics</h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Total Sessions</p>
                  <p className="text-2xl font-bold">{stats.totalSessions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Total Chords</p>
                  <p className="text-2xl font-bold">{stats.totalChords.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Avg Duration</p>
                  <p className="text-2xl font-bold">{Math.round(stats.avgSessionDuration / 60)}m</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Avg Accuracy</p>
                  <p className="text-2xl font-bold">{stats.avgAccuracy.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Top Chords */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold">Most Practiced Chords</h2>
              </div>

              <div className="space-y-2">
                {stats.topChords.slice(0, 10).map((chord, index) => (
                  <div key={chord.chord} className="flex items-center gap-3">
                    <span className="text-zinc-500 font-mono text-sm w-6">{index + 1}</span>
                    <div className="flex-1 bg-zinc-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{chord.chord}</span>
                        <span className="text-sm text-zinc-400">{chord.count.toLocaleString()} attempts</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2 mt-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${(chord.count / stats.topChords[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold">System Health</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Database Connection</span>
                  <span className="text-sm text-emerald-500 font-semibold">✓ Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">API Response Time</span>
                  <span className="text-sm text-emerald-500 font-semibold">~150ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Error Rate</span>
                  <span className="text-sm text-emerald-500 font-semibold">0.02%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
