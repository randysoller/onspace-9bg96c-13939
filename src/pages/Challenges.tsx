import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Clock, Eye, Zap, Trophy } from 'lucide-react';

export default function Challenges() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const challenges = [
    {
      id: 'timed-50',
      type: 'timed' as const,
      title: 'Speed Challenge',
      description: 'Complete 50 chords as fast as possible',
      icon: <Zap className="w-8 h-8" />,
      target: 50,
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'blind-20',
      type: 'blind' as const,
      title: 'Blind Challenge',
      description: 'Play 20 random chords without seeing diagrams',
      icon: <Eye className="w-8 h-8" />,
      target: 20,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'timed-5min',
      type: 'timed' as const,
      title: '5 Minute Sprint',
      description: 'How many chords can you play in 5 minutes?',
      icon: <Clock className="w-8 h-8" />,
      timeLimit: 300,
      color: 'from-cyan-500 to-blue-500',
    },
  ];

  const handleStartChallenge = (challengeId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Navigate to challenge practice page (to be implemented)
    navigate(`/challenge/${challengeId}`);
  };

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
          <h1 className="text-xl font-bold">Challenges</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
          >
            <div className={`bg-gradient-to-r ${challenge.color} p-6`}>
              <div className="flex items-center gap-4 text-white">
                <div className="flex-shrink-0">{challenge.icon}</div>
                <div>
                  <h3 className="text-xl font-bold">{challenge.title}</h3>
                  <p className="text-white/80 text-sm mt-1">{challenge.description}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-zinc-400">
                  {challenge.target && `Target: ${challenge.target} chords`}
                  {challenge.timeLimit && `Time Limit: ${challenge.timeLimit / 60} minutes`}
                </div>
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              
              <button
                onClick={() => handleStartChallenge(challenge.id)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors"
              >
                Start Challenge
              </button>
            </div>
          </div>
        ))}

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <p className="text-zinc-500">More challenges coming soon!</p>
        </div>
      </div>
    </div>
  );
}
