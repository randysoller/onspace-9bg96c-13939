import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { leaderboardApi, LeaderboardEntry } from '@/lib/api/leaderboard';
import { friendsApi, Friend } from '@/lib/api/friends';
import { ArrowLeft, Trophy, Medal, Award, Users, RefreshCw } from 'lucide-react';

type LeaderboardPeriod = 'all_time' | 'weekly' | 'monthly';
type LeaderboardView = 'global' | 'friends';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [period, setPeriod] = useState<LeaderboardPeriod>('all_time');
  const [view, setView] = useState<LeaderboardView>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [period, view, user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [leaderboardData, userRankData, friendsData] = await Promise.all([
        leaderboardApi.getLeaderboard(period, 100),
        leaderboardApi.getUserRank(user.id, period),
        friendsApi.getUserFriends(user.id),
      ]);

      if (view === 'friends' && friendsData.length > 0) {
        const friendIds = friendsData.map(f => f.friend_id);
        const filtered = leaderboardData.filter(e => 
          friendIds.includes(e.user_id) || e.user_id === user.id
        );
        setEntries(filtered);
      } else {
        setEntries(leaderboardData);
      }

      setUserRank(userRankData);
      setFriends(friendsData);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await leaderboardApi.refreshLeaderboard(period);
      await loadData();
    } catch (err) {
      console.error('Failed to refresh leaderboard:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-zinc-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
    return null;
  };

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
          <h1 className="text-xl font-bold">Leaderboard</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Period Toggle */}
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="flex gap-2">
          {(['all_time', 'weekly', 'monthly'] as LeaderboardPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                period === p
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {p === 'all_time' ? 'All Time' : p === 'weekly' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="flex gap-2">
          <button
            onClick={() => setView('global')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              view === 'global'
                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Global
          </button>
          <button
            onClick={() => setView('friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              view === 'friends'
                ? 'bg-purple-500/20 text-purple-500 border border-purple-500'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Friends ({friends.length})
          </button>
        </div>
      </div>

      {/* User's Rank Card */}
      {userRank && (
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-amber-500 rounded-full text-zinc-950 font-bold text-lg">
                  #{userRank.rank}
                </div>
                <div>
                  <div className="font-bold text-white">Your Rank</div>
                  <div className="text-sm text-zinc-400">{userRank.total_points} points</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-500">
                  {userRank.average_accuracy.toFixed(1)}%
                </div>
                <div className="text-xs text-zinc-500">avg accuracy</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="px-4 py-4 space-y-2">
        {entries.map((entry) => {
          const isCurrentUser = entry.user_id === user?.id;
          
          return (
            <div
              key={entry.id}
              className={`bg-zinc-900 border rounded-xl p-4 ${
                isCurrentUser
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-zinc-800 rounded-full">
                    {getRankIcon(entry.rank) || (
                      <span className="text-zinc-400 font-bold text-sm">#{entry.rank}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      {entry.profile?.username || 'Unknown User'}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-amber-500">(You)</span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-500">
                      {entry.total_chords} chords · {entry.total_sessions} sessions
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-emerald-500">
                    {entry.average_accuracy.toFixed(1)}%
                  </div>
                  <div className="text-xs text-zinc-500">{entry.total_points} pts</div>
                </div>
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No leaderboard entries yet</p>
            <p className="text-sm mt-1">
              {view === 'friends' 
                ? 'Add friends to see their rankings' 
                : 'Start practicing to climb the ranks'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
