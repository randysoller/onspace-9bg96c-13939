import { useNavigate } from 'react-router-dom';
import { Music, Library, Edit, Mic, Play, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Play,
      title: 'Practice Mode',
      description: 'Train chord changes with customizable timing and visual feedback',
      action: () => navigate('/practice'),
      color: 'text-amber-500',
    },
    {
      icon: Library,
      title: 'Chord Library',
      description: 'Explore 400+ chord variations across all keys',
      action: () => navigate('/library'),
      color: 'text-blue-500',
    },
    {
      icon: Edit,
      title: 'Custom Chords',
      description: 'Create and save your own chord diagrams',
      action: () => navigate('/editor'),
      color: 'text-emerald-500',
    },
    {
      icon: Mic,
      title: 'Guitar Tuner',
      description: 'Accurate chromatic tuner with multiple tuning presets',
      action: () => navigate('/tuner'),
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Music className="w-24 h-24 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 bg-clip-text text-transparent">
          FretMaster
        </h1>
        
        <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-2xl mx-auto">
          Master guitar chords with intelligent practice tools, comprehensive library, and real-time feedback
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate('/practice')}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-amber-500/30"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Practicing
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/library')}
            className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 px-8 py-6 text-lg"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Browse Chords
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card
              key={index}
              className="bg-zinc-900/50 border-zinc-800 hover:border-amber-500/30 transition-all cursor-pointer group"
              onClick={feature.action}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-zinc-800/50 group-hover:bg-zinc-800 transition-colors`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 text-white group-hover:text-amber-500 transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      {feature.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16">
        <div className="text-center p-6 bg-zinc-900/30 rounded-lg border border-zinc-800">
          <div className="text-3xl font-bold text-amber-500 mb-1">400+</div>
          <div className="text-sm text-zinc-400">Chord Variations</div>
        </div>
        <div className="text-center p-6 bg-zinc-900/30 rounded-lg border border-zinc-800">
          <div className="text-3xl font-bold text-blue-500 mb-1">12</div>
          <div className="text-sm text-zinc-400">Root Notes</div>
        </div>
        <div className="text-center p-6 bg-zinc-900/30 rounded-lg border border-zinc-800">
          <div className="text-3xl font-bold text-emerald-500 mb-1">6</div>
          <div className="text-sm text-zinc-400">Tuning Presets</div>
        </div>
        <div className="text-center p-6 bg-zinc-900/30 rounded-lg border border-zinc-800">
          <div className="text-3xl font-bold text-purple-500 mb-1">∞</div>
          <div className="text-sm text-zinc-400">Practice Hours</div>
        </div>
      </div>
    </div>
  );
}
