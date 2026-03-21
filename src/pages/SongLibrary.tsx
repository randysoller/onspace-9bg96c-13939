import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { songsApi, Song, UserSong } from '@/lib/api/songs';
import { ArrowLeft, Music2, Heart, Star, Plus, Play } from 'lucide-react';

export default function SongLibrary() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [userSongs, setUserSongs] = useState<UserSong[]>([]);
  const [difficulty, setDifficulty] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [difficulty, user]);

  const loadData = async () => {
    try {
      const [allSongs, userSongsData] = await Promise.all([
        songsApi.getAllSongs(difficulty || undefined),
        user ? songsApi.getUserSongs(user.id) : Promise.resolve([]),
      ]);

      setSongs(allSongs);
      setUserSongs(userSongsData);
    } catch (err) {
      console.error('Failed to load songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (songId: string) => {
    if (!user) return;

    try {
      await songsApi.toggleFavorite(user.id, songId);
      loadData();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const getUserSongData = (songId: string) => {
    return userSongs.find(us => us.song_id === songId);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
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
          <h1 className="text-xl font-bold">Song Library</h1>
          <button
            onClick={() => navigate('/song-create')}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="flex gap-2">
          <button
            onClick={() => setDifficulty('')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              difficulty === ''
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            All
          </button>
          {['beginner', 'intermediate', 'advanced'].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                difficulty === diff
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Songs List */}
      <div className="px-4 py-4 space-y-3">
        {songs.map((song) => {
          const userData = getUserSongData(song.id);
          
          return (
            <div
              key={song.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                  <Music2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-white">{song.title}</h3>
                      <p className="text-sm text-zinc-400">{song.artist}</p>
                    </div>
                    {user && (
                      <button
                        onClick={() => handleToggleFavorite(song.id)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            userData?.is_favorited
                              ? 'fill-red-500 text-red-500'
                              : 'text-zinc-500'
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold border capitalize ${getDifficultyColor(
                        song.difficulty
                      )}`}
                    >
                      {song.difficulty}
                    </span>
                    {song.key && (
                      <span className="px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
                        Key: {song.key}
                      </span>
                    )}
                    {song.bpm && (
                      <span className="px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
                        {song.bpm} BPM
                      </span>
                    )}
                  </div>

                  {userData && (
                    <div className="flex items-center gap-4 mb-3 text-xs text-zinc-500">
                      <span>Practiced {userData.practice_count}x</span>
                      <span>·</span>
                      <span>Best: {userData.best_accuracy.toFixed(1)}%</span>
                      {userData.is_mastered && (
                        <>
                          <span>·</span>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span>Mastered</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/song-practice/${song.id}`)}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Practice
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {songs.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No songs found</p>
            <p className="text-sm mt-1">Check back later or create your own!</p>
          </div>
        )}
      </div>
    </div>
  );
}
