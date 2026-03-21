import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { goalsApi, PracticeGoal } from '@/lib/api/goals';
import { ArrowLeft, Plus, Target, CheckCircle2, Trash2, Calendar } from 'lucide-react';

export default function Goals() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [goals, setGoals] = useState<PracticeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewGoal, setShowNewGoal] = useState(false);
  
  // New goal form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [targetType, setTargetType] = useState<'chords' | 'accuracy' | 'sessions' | 'minutes'>('chords');
  const [targetValue, setTargetValue] = useState('10');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    try {
      const data = await goalsApi.getUserGoals(user.id);
      setGoals(data);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await goalsApi.createGoal({
        user_id: user.id,
        title,
        description: description || undefined,
        goal_type: goalType,
        target_type: targetType,
        target_value: parseInt(targetValue),
        deadline: deadline || undefined,
      });

      setTitle('');
      setDescription('');
      setTargetValue('10');
      setDeadline('');
      setShowNewGoal(false);
      loadGoals();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await goalsApi.deleteGoal(goalId);
      loadGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const getProgressPercentage = (goal: PracticeGoal) => {
    return Math.min(100, (goal.current_value / goal.target_value) * 100);
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
          <h1 className="text-xl font-bold">Goals</h1>
          <button
            onClick={() => setShowNewGoal(!showNewGoal)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* New Goal Form */}
      {showNewGoal && (
        <div className="px-4 py-4 border-b border-zinc-800">
          <form onSubmit={handleCreateGoal} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Goal Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                placeholder="e.g., Master barre chords"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                rows={2}
                placeholder="Add notes about this goal..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Goal Type</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as any)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Target Type</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="chords">Chords</option>
                  <option value="accuracy">Accuracy %</option>
                  <option value="sessions">Sessions</option>
                  <option value="minutes">Minutes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Target Value</label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Deadline (optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-2 rounded-lg transition-colors"
              >
                Create Goal
              </button>
              <button
                type="button"
                onClick={() => setShowNewGoal(false)}
                className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="px-4 py-4 space-y-3">
        {goals.filter(g => !g.completed).length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">Active Goals</h2>
            {goals.filter(g => !g.completed).map((goal) => (
              <div key={goal.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-zinc-400 mt-1">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                      <span className="capitalize">{goal.goal_type}</span>
                      <span>·</span>
                      <span>{goal.current_value} / {goal.target_value} {goal.target_type}</span>
                      {goal.deadline && (
                        <>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(goal.deadline).toLocaleDateString()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-500 transition-all"
                    style={{ width: `${getProgressPercentage(goal)}%` }}
                  />
                </div>
                <div className="text-xs text-amber-500 font-bold mt-1">
                  {getProgressPercentage(goal).toFixed(0)}% Complete
                </div>
              </div>
            ))}
          </div>
        )}

        {goals.filter(g => g.completed).length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">Completed Goals</h2>
            {goals.filter(g => g.completed).map((goal) => (
              <div
                key={goal.id}
                className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4 mb-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-bold text-white">{goal.title}</h3>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-zinc-400 mt-1 ml-7">{goal.description}</p>
                    )}
                    <div className="text-xs text-emerald-500 mt-2 ml-7">
                      Completed on {goal.completed_at ? new Date(goal.completed_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {goals.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No goals set yet</p>
            <p className="text-sm mt-1">Click the + button to create your first goal</p>
          </div>
        )}
      </div>
    </div>
  );
}
