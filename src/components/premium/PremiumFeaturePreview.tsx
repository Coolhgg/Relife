import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Flame,
  Brain,
  Laugh,
  Robot,
  Zap,
  Star,
  Crown,
  Lock,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Timer,
  BarChart3
} from 'lucide-react';
import type { VoiceMood, AlarmDifficulty } from '../../types';

interface PremiumFeaturePreviewProps {
  /** Feature to preview */
  feature: 'nuclearMode' | 'premiumPersonalities' | 'analytics' | 'customVoices';
  /** Callback when user wants to upgrade */
  onUpgrade: () => void;
  /** Whether to show as compact version */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

const PremiumFeaturePreview: React.FC<PremiumFeaturePreviewProps> = ({
  feature,
  onUpgrade,
  compact = false,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDemo, setCurrentDemo] = useState(0);
  const [nuclearIntensity, setNuclearIntensity] = useState(0);

  // Nuclear mode animation effect
  useEffect(() => {
    if (feature === 'nuclearMode' && isPlaying) {
      const interval = setInterval(() => {
        setNuclearIntensity(prev => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [feature, isPlaying]);

  const premiumPersonalities = [
    {
      id: 'demon-lord' as VoiceMood,
      name: 'Demon Lord',
      icon: <Flame className="w-6 h-6" />,
      color: 'from-red-600 to-orange-600',
      message: "MORTAL! Rise from your pathetic slumber!",
      description: "Dark, intimidating commands that demand obedience"
    },
    {
      id: 'ai-robot' as VoiceMood,
      name: 'AI Robot',
      icon: <Robot className="w-6 h-6" />,
      color: 'from-blue-600 to-cyan-600',
      message: "SYSTEM ALERT: Wake protocol activated. Compliance required.",
      description: "Systematic, precise wake-up procedures"
    },
    {
      id: 'comedian' as VoiceMood,
      name: 'Comedian',
      icon: <Laugh className="w-6 h-6" />,
      color: 'from-yellow-600 to-orange-600',
      message: "Why did the alarm cross the road? To wake YOU up!",
      description: "Hilarious entertainment to start your day with laughter"
    },
    {
      id: 'philosopher' as VoiceMood,
      name: 'Philosopher',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-purple-600 to-indigo-600',
      message: "What is morning but the universe's daily rebirth?",
      description: "Deep, contemplative wisdom for mindful mornings"
    }
  ];

  const nuclearChallenges = [
    { name: 'Math Sequence', difficulty: 95, icon: '🧮', description: 'Solve complex equations under pressure' },
    { name: 'Memory Matrix', difficulty: 88, icon: '🧠', description: 'Remember patterns while reactor overheats' },
    { name: 'Barcode Hunt', difficulty: 92, icon: '📱', description: 'Scan specific items before meltdown' },
    { name: 'Voice Command', difficulty: 85, icon: '🎤', description: 'Speak nuclear codes correctly' },
    { name: 'Physical Task', difficulty: 90, icon: '🏃', description: 'Complete movements to prevent disaster' }
  ];

  const analyticsMetrics = [
    { label: 'Wake Success Rate', value: '94%', trend: '+12%', icon: <Target className="w-5 h-5" /> },
    { label: 'Average Sleep Quality', value: '8.2/10', trend: '+1.3', icon: <Star className="w-5 h-5" /> },
    { label: 'Morning Energy Level', value: '87%', trend: '+23%', icon: <Zap className="w-5 h-5" /> },
    { label: 'Productivity Score', value: '9.1/10', trend: '+2.1', icon: <TrendingUp className="w-5 h-5" /> }
  ];

  const renderNuclearModePreview = () => (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900 via-red-800 to-orange-900 text-white ${compact ? 'p-4' : 'p-6'}`}>
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
          style={{ 
            transform: `translateX(${(nuclearIntensity * 4) - 200}%)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-700 rounded-xl">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${compact ? 'text-lg' : 'text-xl'}`}>Nuclear Mode</h3>
              <p className="text-red-200 text-sm">Ultimate Wake-up Challenge</p>
            </div>
          </div>
          <div className="bg-red-700 px-3 py-1 rounded-full text-sm font-medium">
            5x MULTIPLIER
          </div>
        </div>

        {/* Challenge selector */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          {nuclearChallenges.slice(0, compact ? 2 : 5).map((challenge, index) => (
            <div 
              key={challenge.name}
              className={`flex items-center justify-between p-3 bg-red-800 bg-opacity-50 rounded-xl border border-red-700 transition-all duration-200 hover:bg-opacity-70 ${
                currentDemo === index ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{challenge.icon}</span>
                <div>
                  <p className="font-medium">{challenge.name}</p>
                  <p className="text-xs text-red-200">{challenge.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">{challenge.difficulty}%</div>
                <div className="text-xs text-red-200">EXTREME</div>
              </div>
            </div>
          ))}
        </div>

        {/* Demo controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-500 text-black px-4 py-2 rounded-xl font-medium transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Stop' : 'Preview'} Nuclear Mode</span>
          </button>

          <div className="text-right">
            <div className="text-sm text-red-200">Unlock with</div>
            <div className="font-bold text-yellow-400">Pro Subscription</div>
          </div>
        </div>
      </div>

      {/* Overlay for locked state */}
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={onUpgrade}>
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
          <p className="text-lg font-bold mb-1">Unlock Nuclear Mode</p>
          <p className="text-sm text-red-200">Upgrade to Pro for extreme challenges</p>
        </div>
      </div>
    </div>
  );

  const renderPersonalitiesPreview = () => (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white ${compact ? 'p-4' : 'p-6'}`}>
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-700 rounded-xl">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${compact ? 'text-lg' : 'text-xl'}`}>Premium Personalities</h3>
              <p className="text-purple-200 text-sm">4 Exclusive AI Characters</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-700 to-pink-700 px-3 py-1 rounded-full text-sm font-medium">
            PRO ONLY
          </div>
        </div>

        {/* Personality cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {premiumPersonalities.map((personality, index) => (
            <div 
              key={personality.id}
              className={`p-3 bg-gradient-to-br ${personality.color} bg-opacity-20 border border-white border-opacity-20 rounded-xl transition-all duration-200 hover:bg-opacity-30 cursor-pointer ${
                currentDemo === index ? 'ring-2 ring-white' : ''
              }`}
              onClick={() => setCurrentDemo(index)}
            >
              <div className="flex items-center space-x-2 mb-2">
                {personality.icon}
                <span className="font-medium text-sm">{personality.name}</span>
              </div>
              <p className="text-xs opacity-80">{personality.description}</p>
            </div>
          ))}
        </div>

        {/* Current personality preview */}
        <div className="p-4 bg-black bg-opacity-30 rounded-xl mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Volume2 className="w-4 h-4 text-purple-300" />
            <span className="text-sm text-purple-300">Sample Message:</span>
          </div>
          <p className="font-medium italic">"{premiumPersonalities[currentDemo]?.message}"</p>
        </div>

        {/* Demo controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl font-medium transition-all"
          >
            {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>Preview Voice</span>
          </button>

          <div className="text-right">
            <div className="text-sm text-purple-200">4 personalities</div>
            <div className="font-bold text-pink-400">$9.99/month</div>
          </div>
        </div>
      </div>

      {/* Overlay for locked state */}
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={onUpgrade}>
        <div className="text-center">
          <Crown className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
          <p className="text-lg font-bold mb-1">Unlock Premium Voices</p>
          <p className="text-sm text-purple-200">Experience unique personalities</p>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsPreview = () => (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 text-white ${compact ? 'p-4' : 'p-6'}`}>
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-700 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${compact ? 'text-lg' : 'text-xl'}`}>Advanced Analytics</h3>
              <p className="text-green-200 text-sm">Deep Sleep Insights</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-700 to-teal-700 px-3 py-1 rounded-full text-sm font-medium">
            PREMIUM
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {analyticsMetrics.map((metric, index) => (
            <div key={metric.label} className="p-3 bg-green-800 bg-opacity-30 border border-green-700 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                {metric.icon}
                <span className="text-xs text-green-300">{metric.trend}</span>
              </div>
              <div className="font-bold text-lg">{metric.value}</div>
              <div className="text-xs text-green-200">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="h-20 bg-green-800 bg-opacity-30 rounded-xl flex items-end justify-around p-3 mb-4">
          {[65, 72, 45, 89, 76, 91, 82].map((height, index) => (
            <div
              key={index}
              className="bg-gradient-to-t from-green-400 to-teal-400 rounded-t w-4 transition-all duration-500"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Demo controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl font-medium transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Full Report</span>
          </button>

          <div className="text-right">
            <div className="text-sm text-green-200">Detailed insights</div>
            <div className="font-bold text-teal-400">$4.99/month</div>
          </div>
        </div>
      </div>

      {/* Overlay for locked state */}
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={onUpgrade}>
        <div className="text-center">
          <Award className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
          <p className="text-lg font-bold mb-1">Unlock Analytics</p>
          <p className="text-sm text-green-200">Optimize your sleep patterns</p>
        </div>
      </div>
    </div>
  );

  const renderCustomVoicesPreview = () => (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900 text-white ${compact ? 'p-4' : 'p-6'}`}>
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-700 rounded-xl">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${compact ? 'text-lg' : 'text-xl'}`}>Custom Voice Messages</h3>
              <p className="text-blue-200 text-sm">Personalized TTS & Voice Cloning</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-700 to-cyan-700 px-3 py-1 rounded-full text-sm font-medium">
            HIGH QUALITY
          </div>
        </div>

        {/* Voice samples */}
        <div className="space-y-3 mb-4">
          <div className="p-3 bg-blue-800 bg-opacity-30 border border-blue-700 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">ElevenLabs Premium Voice</p>
                <p className="text-xs text-blue-200">Crystal clear, natural speech</p>
              </div>
              <div className="w-16 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          
          {!compact && (
            <>
              <div className="p-3 bg-blue-800 bg-opacity-30 border border-blue-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Your Custom Voice Clone</p>
                    <p className="text-xs text-blue-200">Speaks in your own voice</p>
                  </div>
                  <div className="w-16 h-8 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-800 bg-opacity-30 border border-blue-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Celebrity-Style Voices</p>
                    <p className="text-xs text-blue-200">Professional voice actors</p>
                  </div>
                  <div className="w-16 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Demo controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-4 py-2 rounded-xl font-medium transition-all"
          >
            <Volume2 className="w-4 h-4" />
            <span>Sample Voice</span>
          </button>

          <div className="text-right">
            <div className="text-sm text-blue-200">Unlimited messages</div>
            <div className="font-bold text-cyan-400">$4.99/month</div>
          </div>
        </div>
      </div>

      {/* Overlay for locked state */}
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={onUpgrade}>
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
          <p className="text-lg font-bold mb-1">Unlock Custom Voices</p>
          <p className="text-sm text-blue-200">Premium TTS & voice cloning</p>
        </div>
      </div>
    </div>
  );

  const previewComponents = {
    nuclearMode: renderNuclearModePreview,
    premiumPersonalities: renderPersonalitiesPreview,
    analytics: renderAnalyticsPreview,
    customVoices: renderCustomVoicesPreview
  };

  return (
    <div className={`relative ${className}`}>
      {previewComponents[feature]()}
    </div>
  );
};

export default PremiumFeaturePreview;