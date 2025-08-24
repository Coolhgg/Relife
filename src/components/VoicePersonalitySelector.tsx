import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  Crown,
  Lock,
  Play,
  Pause,
  Skull,
  Bot,
  Laugh,
  Brain,
  Zap,
  Heart,
  Shield,
  Fire,
} from 'lucide-react';
import { PremiumGate } from './PremiumGate';
import { SubscriptionService } from '../services/subscription';
import type { VoiceMood, VoiceMoodConfig, User } from '../types';
import { TimeoutHandle } from '../types/timers';

interface VoicePersonalitySelectorProps {
  selectedMood: VoiceMood;
  onMoodChange: (mood: VoiceMood) => void;
  user: User;
  showPreview?: boolean;
}

// Configuration for all voice personalities
const VOICE_PERSONALITIES: VoiceMoodConfig[] = [
  // Free personalities
  {
    id: 'drill-sergeant',
    name: 'Drill Sergeant',
    description: 'Aggressive, high-energy military style wake-up calls',
    icon: '🪖',
    color: 'bg-red-600',
    sample: 'ATTENTION! Time to wake up, soldier!',
  },
  {
    id: 'sweet-angel',
    name: 'Sweet Angel',
    description: 'Gentle, caring, and supportive morning messages',
    icon: '😇',
    color: 'bg-pink-500',
    sample: 'Good morning, sunshine! Time to rise and shine!',
  },
  {
    id: 'anime-hero',
    name: 'Anime Hero',
    description: 'Energetic and encouraging with heroic motivation',
    icon: '⚡',
    color: 'bg-yellow-500',
    sample: 'The adventure begins! Your destiny awaits!',
  },
  {
    id: 'savage-roast',
    name: 'Savage Roast',
    description: 'Sarcastic and humorous with playful insults',
    icon: '🔥',
    color: 'bg-orange-600',
    sample: 'Still sleeping? Seriously? Everyone else is already winning!',
  },
  {
    id: 'motivational',
    name: 'Motivational',
    description: 'Professional motivational speaker energy',
    icon: '🎯',
    color: 'bg-blue-600',
    sample: 'Time to achieve greatness! Your success story starts now!',
  },
  {
    id: 'gentle',
    name: 'Gentle',
    description: 'Calm, peaceful, and relaxing wake-up experience',
    icon: '🌸',
    color: 'bg-green-500',
    sample: 'Good morning, dear. Time to gently wake up.',
  },
];

// Premium personalities (Pro+ only)
const PREMIUM_PERSONALITIES: VoiceMoodConfig[] = [
  {
    id: 'demon-lord',
    name: 'Demon Lord',
    description: 'Dark, powerful, and intimidating infernal commands',
    icon: '👹',
    color: 'bg-red-900',
    sample: 'AWAKEN, MORTAL! Your eternal slumber ends NOW!',
  },
  {
    id: 'ai-robot',
    name: 'AI Bot',
    description: 'Mechanical, precise, and systematic wake protocols',
    icon: '🤖',
    color: 'bg-gray-600',
    sample: 'SYSTEM INITIATED. USER AWAKENING REQUIRED.',
  },
  {
    id: 'comedian',
    name: 'Comedian',
    description: 'Hilarious stand-up comedy style morning entertainment',
    icon: '😄',
    color: 'bg-purple-600',
    sample: "Ladies and gentlemen, please welcome... someone who's still asleep!",
  },
  {
    id: 'philosopher',
    name: 'Philosopher',
    description: 'Deep, thoughtful, and contemplative wisdom for mornings',
    icon: '🧠',
    color: 'bg-indigo-700',
    sample: 'Consider this: another day of existence begins.',
  },
];

const getPersonalityIcon = (mood: VoiceMood) => {
  switch (mood) {
    case 'drill-sergeant':
      return Shield;
    case 'sweet-angel':
      return Heart;
    case 'anime-hero':
      return Zap;
    case 'savage-roast':
      return Fire;
    case 'motivational':
      return Crown;
    case 'gentle':
      return Heart;
    case 'demon-lord':
      return Skull;
    case 'ai-robot':
      return Bot;
    case 'comedian':
      return Laugh;
    case 'philosopher':
      return Brain;
    default:
      return Volume2;
  }
};

export const VoicePersonalitySelector: React.FC<VoicePersonalitySelectorProps> = ({
  selectedMood,
  onMoodChange,
  user,
  showPreview = true,
}) => {
  const [hasPreviewAccess, setHasPreviewAccess] = useState(false);
  const [previewingMood, setPreviewingMood] = useState<VoiceMood | null>(null);
  const [hasPremiumPersonalities, setHasPremiumPersonalities] = useState(false);

  useEffect(() => {
    checkPremiumAccess();
  }, [user.id]);

  const checkPremiumAccess = async () => {
    const access = await SubscriptionService.hasFeatureAccess(
      user.id,
      'premiumPersonalities'
    );
    setHasPremiumPersonalities(access);

    const previewAccess = await SubscriptionService.hasFeatureAccess(
      user.id,
      'elevenlabsVoices'
    );
    setHasPreviewAccess(previewAccess);
  };

  const handlePersonalitySelect = (mood: VoiceMood) => {
    // Check if it's a premium personality
    const isPremium = PREMIUM_PERSONALITIES.find(p => p.id === mood);

    if (isPremium && !hasPremiumPersonalities) {
      // Don't allow selection, premium gate will handle this
      return;
    }

    onMoodChange(mood);
  };

  const playPreview = async (mood: VoiceMood) => {
    if (previewingMood === mood) {
      setPreviewingMood(null);
      return;
    }

    setPreviewingMood(mood);

    // Find the personality config
    const personality = [...VOICE_PERSONALITIES, ...PREMIUM_PERSONALITIES].find(
      p => p.id === mood
    );
    if (personality && hasPreviewAccess) {
      // Here you would implement actual voice preview
      // For now, just simulate preview duration
      setTimeout(() => {
        setPreviewingMood(null);
      }, 3000);
    }
  };

  const renderPersonalityCard = (
    personality: VoiceMoodConfig,
    isPremium: boolean = false
  ) => {
    const IconComponent = getPersonalityIcon(personality.id as VoiceMood);
    const isSelected = selectedMood === personality.id;
    const isLocked = isPremium && !hasPremiumPersonalities;
    const isPreviewing = previewingMood === personality.id;

    return (
      <motion.div
        key={personality.id}
        layout
        className={`
          relative rounded-xl p-4 border-2 transition-all duration-200 cursor-pointer
          ${
            isSelected
              ? `${personality.color} border-white/50 shadow-lg`
              : isLocked
                ? 'bg-gray-800 border-gray-600 opacity-75'
                : 'bg-gray-900 border-gray-700 hover:border-gray-600'
          }
          ${isLocked ? 'cursor-not-allowed' : 'hover:scale-105'}
        `}
        onClick={() =>
          !isLocked && handlePersonalitySelect(personality.id as VoiceMood)
        }
        whileHover={!isLocked ? { scale: 1.02 } : undefined}
        whileTap={!isLocked ? { scale: 0.98 } : undefined}
      >
        {/* Premium Badge */}
        {isPremium && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-2">
            <Crown className="h-3 w-3 text-white" />
          </div>
        )}

        {/* Lock Overlay for Premium */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">Pro Required</p>
            </div>
          </div>
        )}

        {/* Personality Icon */}
        <div className="flex items-center justify-center mb-3">
          <div
            className={`
            p-3 rounded-full
            ${isSelected ? 'bg-white/20' : 'bg-gray-800/50'}
          `}
          >
            <IconComponent
              className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-400'}`}
            />
          </div>
        </div>

        {/* Personality Info */}
        <div className="text-center">
          <h3
            className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}
          >
            {personality.name}
          </h3>
          <p
            className={`text-xs leading-tight ${isSelected ? 'text-gray-200' : 'text-gray-500'}`}
          >
            {personality.description}
          </p>
        </div>

        {/* Sample Text */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 bg-black/20 rounded-lg"
          >
            <p className="text-xs italic text-center text-gray-200">
              "{personality.sample}"
            </p>
          </motion.div>
        )}

        {/* Preview Button */}
        {showPreview && hasPreviewAccess && !isLocked && (
          <div className="absolute bottom-2 right-2">
            <button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                playPreview(personality.id as VoiceMood);
              }}
              className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
            >
              {isPreviewing ? (
                <Pause className="h-3 w-3 text-white" />
              ) : (
                <Play className="h-3 w-3 text-white" />
              )}
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Free Personalities Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Volume2 className="h-5 w-5 mr-2" />
          Voice Personalities
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {VOICE_PERSONALITIES.map(personality =>
            renderPersonalityCard(personality, false)
          )}
        </div>
      </div>

      {/* Premium Personalities Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Crown className="h-5 w-5 mr-2 text-yellow-400" />
          Premium Personalities
          <span className="ml-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs rounded-full font-bold">
            PRO+
          </span>
        </h3>

        {hasPremiumPersonalities ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PREMIUM_PERSONALITIES.map(personality =>
              renderPersonalityCard(personality, true)
            )}
          </div>
        ) : (
          <PremiumGate
            feature="premiumPersonalities"
            userId={user.id}
            title="🎭 Premium Voice Personalities"
            description="Unlock Demon Lord, AI Bot, Comedian, and Philosopher personalities with Pro subscription."
            mode="overlay"
          >
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PREMIUM_PERSONALITIES.map(personality =>
                renderPersonalityCard(personality, true)
              )}
            </div>
          </PremiumGate>
        )}
      </div>

      {/* Upgrade Prompt for Premium Personalities */}
      {!hasPremiumPersonalities && (
        <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-500/30 rounded-xl p-6 text-center">
          <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-white mb-2">
            Unlock Premium Personalities
          </h4>
          <p className="text-gray-300 mb-4">
            Get access to Demon Lord, AI Bot, Comedian, and Philosopher personalities
            with advanced AI-powered voice synthesis.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center">
              <Skull className="h-4 w-4 mr-1 text-red-400" />
              Demon Lord
            </div>
            <div className="flex items-center">
              <Bot className="h-4 w-4 mr-1 text-gray-400" />
              AI Bot
            </div>
            <div className="flex items-center">
              <Laugh className="h-4 w-4 mr-1 text-purple-400" />
              Comedian
            </div>
            <div className="flex items-center">
              <Brain className="h-4 w-4 mr-1 text-indigo-400" />
              Philosopher
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoicePersonalitySelector;
