import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { lessonsApi, Lesson, UserLesson } from '@/lib/api/lessons';
import { ArrowLeft, BookOpen, CheckCircle2, Lock, Play } from 'lucide-react';

export default function Lessons() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userLessons, setUserLessons] = useState<UserLesson[]>([]);
  const [skillLevel, setSkillLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, [skillLevel, user]);

  const loadLessons = async () => {
    try {
      const [allLessons, userProgress] = await Promise.all([
        lessonsApi.getAllLessons(skillLevel || undefined),
        user ? lessonsApi.getUserLessons(user.id) : Promise.resolve([]),
      ]);

      setLessons(allLessons);
      setUserLessons(userProgress);
    } catch (err) {
      console.error('Failed to load lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserLessonData = (lessonId: string) => {
    return userLessons.find(ul => ul.lesson_id === lessonId);
  };

  const handleStartLesson = async (lessonId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      await lessonsApi.startLesson(user.id, lessonId);
      navigate(`/lesson/${lessonId}`);
    } catch (err) {
      console.error('Failed to start lesson:', err);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'text-emerald-500 bg-emerald-500/20 border-emerald-500/40';
      case 'intermediate':
        return 'text-amber-500 bg-amber-500/20 border-amber-500/40';
      case 'advanced':
        return 'text-red-500 bg-red-500/20 border-red-500/40';
      default:
        return 'text-zinc-500 bg-zinc-800 border-zinc-700';
    }
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'chords':
        return '🎸';
      case 'scales':
        return '🎵';
      case 'theory':
        return '📚';
      case 'technique':
        return '💪';
      default:
        return '📖';
    }
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
          <h1 className="text-xl font-bold">Lessons</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Skill Level Filter */}
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="flex gap-2">
          <button
            onClick={() => setSkillLevel('')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              skillLevel === ''
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            All Levels
          </button>
          {['beginner', 'intermediate', 'advanced'].map((level) => (
            <button
              key={level}
              onClick={() => setSkillLevel(level)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                skillLevel === level
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons List */}
      <div className="px-4 py-4 space-y-3">
        {lessons.map((lesson) => {
          const userData = getUserLessonData(lesson.id);
          const isCompleted = userData?.status === 'completed';
          const isInProgress = userData?.status === 'in_progress';
          
          return (
            <div
              key={lesson.id}
              className={`border rounded-xl p-4 ${
                isCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center text-2xl">
                  {getLessonTypeIcon(lesson.lesson_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-white">{lesson.title}</h3>
                      {lesson.description && (
                        <p className="text-sm text-zinc-400 mt-1">{lesson.description}</p>
                      )}
                    </div>
                    {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold border capitalize ${getDifficultyColor(
                        lesson.skill_level
                      )}`}
                    >
                      {lesson.skill_level}
                    </span>
                    <span className="px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400 capitalize">
                      {lesson.lesson_type}
                    </span>
                    {lesson.estimated_time_minutes && (
                      <span className="px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
                        {lesson.estimated_time_minutes} min
                      </span>
                    )}
                  </div>

                  {userData && userData.status === 'in_progress' && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                        <span>Progress</span>
                        <span>{userData.progress_percent}%</span>
                      </div>
                      <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-purple-500 transition-all"
                          style={{ width: `${userData.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleStartLesson(lesson.id)}
                    className={`w-full font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isCompleted
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 border border-emerald-500/40'
                        : isInProgress
                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-zinc-950'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start Lesson'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {lessons.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No lessons found</p>
            <p className="text-sm mt-1">Check back later for new content!</p>
          </div>
        )}
      </div>
    </div>
  );
}
