import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { achievementsApi, Achievement, UserAchievement } from '@/lib/api/achievements';
import { ArrowLeft, Trophy, Lock } from 'lucide-react';

export default function Achievements() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      const [all, earned] = await Promise.all([
        achievementsApi.getAllAchievements(),
        achievementsApi.getUserAchievements(user.id),
      ]);

      setAllAchievements(all);
      setUserAchievements(earned);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));
  const totalPoints = userAchievements.reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0);

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
          <h1 className="text-xl font-bold">Achievements</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-4 py-6 border-b border-zinc-800">
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-400 mb-1">Total Points</div>
              <div className="text-3xl font-black text-amber-500">{totalPoints}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-400 mb-1">Unlocked</div>
              <div className="text-3xl font-black text-white">
                {userAchievements.length}/{allAchievements.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Categories */}
      {['milestone', 'skill', 'streak', 'social'].map((category) => {
        const categoryAchievements = allAchievements.filter(a => a.category === category);
        if (categoryAchievements.length === 0) return null;

        return (
          <div key={category} className="px-4 py-4">
            <h2 className="text-lg font-bold mb-3 capitalize">{category}</h2>
            <div className="space-y-3">
              {categoryAchievements.map((achievement) => {
                const isEarned = earnedIds.has(achievement.id);
                const earnedData = userAchievements.find(ua => ua.achievement_id === achievement.id);

                return (
                  <div
                    key={achievement.id}
                    className={`border rounded-xl p-4 ${
                      isEarned
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                          isEarned
                            ? 'bg-emerald-500/20'
                            : 'bg-zinc-800'
                        }`}
                      >
                        {isEarned ? achievement.icon : <Lock className="w-5 h-5 text-zinc-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className={`font-bold ${isEarned ? 'text-white' : 'text-zinc-500'}`}>
                            {achievement.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Trophy className={`w-4 h-4 ${isEarned ? 'text-amber-500' : 'text-zinc-600'}`} />
                            <span className={`text-sm font-bold ${isEarned ? 'text-amber-500' : 'text-zinc-600'}`}>
                              {achievement.points}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm ${isEarned ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {achievement.description}
                        </p>
                        {earnedData && (
                          <div className="text-xs text-emerald-500 mt-2">
                            Earned on {new Date(earnedData.earned_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
