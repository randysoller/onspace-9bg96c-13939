import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { lessonsApi, Lesson, UserLesson } from '@/lib/api/lessons';
import { ArrowLeft, BookOpen, Clock, Play, CheckCircle2, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Lessons() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userLessons, setUserLessons] = useState<UserLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadLessons();
  }, [user]);

  const loadLessons = async () => {
    if (!user) return;

    try {
      const [allLessons, userProgress] = await Promise.all([
        lessonsApi.getAllLessons(),
        lessonsApi.getUserLessons(user.id),
      ]);

      setLessons(allLessons);
      setUserLessons(userProgress);
    } catch (err) {
      console.error('Failed to load lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserLessonStatus = (lessonId: string) => {
    return userLessons.find(ul => ul.lesson_id === lessonId);
  };

  const handleStartLesson = async (lessonId: string) => {
    if (!user) return;

    try {
      await lessonsApi.startLesson(user.id, lessonId);
      navigate(`/lesson/${lessonId}`);
    } catch (err) {
      console.error('Failed to start lesson:', err);
    }
  };

  const renderLesson = (lesson: Lesson) => {
    const userProgress = getUserLessonStatus(lesson.id);
    const isCompleted = userProgress?.status === 'completed';
    const isInProgress = userProgress?.status === 'in_progress';

    return (
      <div
        key={lesson.id}
        className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">{lesson.title}</h3>
              <p className="text-sm text-zinc-400">{lesson.description}</p>
            </div>
            {isCompleted && (
              <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 ml-3" />
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {lesson.estimated_time_minutes} min
            </span>
            <span className="capitalize">{lesson.lesson_type}</span>
          </div>

          {isInProgress && userProgress && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-500">Progress</span>
                <span className="text-amber-500 font-bold">{userProgress.progress_percent}%</span>
              </div>
              <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-500 transition-all"
                  style={{ width: `${userProgress.progress_percent}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={() => handleStartLesson(lesson.id)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            {isCompleted ? 'Review Lesson' : isInProgress ? 'Continue' : 'Start Lesson'}
          </button>
        </div>
      </div>
    );
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

      <div className="px-4 py-6">
        <Tabs defaultValue="beginner" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900 mb-6">
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="beginner" className="space-y-4">
            {lessons
              .filter(l => l.skill_level === 'beginner')
              .map(renderLesson)}
          </TabsContent>

          <TabsContent value="intermediate" className="space-y-4">
            {lessons
              .filter(l => l.skill_level === 'intermediate')
              .map(renderLesson)}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {lessons
              .filter(l => l.skill_level === 'advanced')
              .map(renderLesson)}
          </TabsContent>
        </Tabs>

        {lessons.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No lessons available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
