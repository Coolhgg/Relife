import React, { useState, useEffect } from 'react';
import { Crown, Play, Lock, Info, Volume2, Star, Heart, Zap } from 'lucide-react';
import type { VoiceMood, VoiceMoodConfig, VoicePersonality, User } from '../types';
import { PremiumVoiceService } from '../services/premium-voice';
import { PremiumService } from '../services/premium';
import { TimeoutHandle } from '../types/timers';

interface VoiceSelectorProps {
  selectedVoice: VoiceMood;
  onVoiceChange: (voice: VoiceMood) => void;
  user: User;
  showUpgradePrompts?: boolean;
}

interface VoiceCardProps {
  voice: VoiceMoodConfig;
  personality?: VoicePersonality;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
  onTest: () => void;
  onUpgrade?: () => void;
}

const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  personality,
  isSelected,
  isLocked,
  onSelect,
  onTest,
  onUpgrade,
}) => {
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const handleTest = async () => {
    if (isLocked || isTestingVoice) return;

    setIsTestingVoice(true);
    try {
      onTest();
      // Simulate test duration
      setTimeout(() => {
        setIsTestingVoice(false);
      }, 3000);
    } catch (error) {
      console.error('Error testing voice:', error);
      setIsTestingVoice(false);
    }
  };

  const getCharacteristicColor = (characteristic: string): string => {
    const colors: Record<string, string> = {
      energetic: 'bg-orange-100 text-orange-700',
      gentle: 'bg-pink-100 text-pink-700',
      wise: 'bg-purple-100 text-purple-700',
      commanding: 'bg-red-100 text-red-700',
      peaceful: 'bg-green-100 text-green-700',
      fun: 'bg-yellow-100 text-yellow-700',
      mysterious: 'bg-indigo-100 text-indigo-700',
      caring: 'bg-blue-100 text-blue-700',
      motivating: 'bg-emerald-100 text-emerald-700',
    };
    return colors[characteristic] || 'bg-gray-100 text-gray-700';
  };

  const getTierBadge = () => {
    if (!personality) return null;

    if (personality.premiumTier === 'ultimate') {
      return (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Star className="h-3 w-3" />
          ULTIMATE
        </div>
      );
    } else if (personality.premiumTier === 'premium') {
      return (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Crown className="h-3 w-3" />
          PREMIUM
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`relative bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
        isSelected
          ? 'border-blue-500 shadow-lg'
          : 'border-gray-200 hover:border-gray-300'
      } ${isLocked ? 'opacity-75' : ''}`}
    >
      {getTierBadge()}

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${voice.color}20`, color: voice.color }}
          >
            {voice.icon}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{voice.name}</h3>
              {isLocked && <Lock className="h-4 w-4 text-orange-500" />}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{voice.description}</p>
          </div>
        </div>

        {/* Sample phrase */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm italic text-gray-700">"{voice.sample}"</p>
        </div>

        {/* Personality characteristics */}
        {personality && personality.characteristics.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {personality.characteristics.slice(0, 3).map((characteristic: any) => ({ // auto: implicit any
                <span
                  key={characteristic}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getCharacteristicColor(characteristic)}`}
                >
                  {characteristic}
                </span>
              ))}
              {personality.characteristics.length > 3 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{personality.characteristics.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {isLocked ? (
            <button
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Upgrade to Unlock
            </button>
          ) : (
            <>
              <button
                onClick={onSelect}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSelected ? 'Selected' : 'Select'}
              </button>

              <button
                onClick={handleTest}
                disabled={isTestingVoice}
                className="bg-green-100 text-green-700 py-2 px-3 rounded-lg hover:bg-green-200 transition-all duration-200 flex items-center justify-center"
              >
                {isTestingVoice ? (
                  <Volume2 className="h-4 w-4 animate-pulse" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onVoiceChange,
  user,
  showUpgradePrompts = true,
}) => {
  const [availableVoices, setAvailableVoices] = useState<VoiceMoodConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'free' | 'premium' | 'ultimate'>('all');
  const [showPersonalityDetails, setShowPersonalityDetails] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadAvailableVoices();
  }, [user.id]);

  const loadAvailableVoices = async () => {
    try {
      setLoading(true);
      const voices = await PremiumVoiceService.getAvailableVoices(user.id);
      setAvailableVoices(voices);
    } catch (error) {
      console.error('Error loading available voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSelect = async (voiceMood: VoiceMood) => {
    const canAccess = await PremiumVoiceService.canAccessVoice(user.id, voiceMood);
    if (canAccess) {
      onVoiceChange(voiceMood);
    }
  };

  const handleVoiceTest = async (voiceMood: VoiceMood) => {
    try {
      await PremiumVoiceService.testPremiumVoice(voiceMood, user.id);
    } catch (error) {
      console.error('Error testing voice:', error);
    }
  };

  const handleUpgrade = () => {
    // In a real app, this would open the pricing/upgrade modal
    console.log('Opening upgrade modal...');
    alert('Upgrade to Premium to unlock this voice!');
  };

  const getFilteredVoices = () => {
    if (filter === 'all') return availableVoices;

    return availableVoices.filter((voice: any) => { // auto: implicit any
      const personality = PremiumVoiceService.getVoicePersonality(voice.id);
      if (!personality) {
        return filter === 'free';
      }
      return personality.premiumTier === filter;
    });
  };

  const getVoicesByCategory = () => {
    const filteredVoices = getFilteredVoices();
    const categories: Record<string, VoiceMoodConfig[]> = {};

    filteredVoices.forEach((voice: any) => { // auto: implicit any
      const personality = PremiumVoiceService.getVoicePersonality(voice.id);
      const category = personality?.category || 'basic';

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(voice);
    });

    return categories;
  };

  const getCategoryTitle = (category: string): string => {
    const titles: Record<string, string> = {
      basic: 'Basic Voices',
      fitness: 'Fitness & Health',
      wellness: 'Wellness & Mindfulness',
      entertainment: 'Entertainment',
      adventure: 'Adventure & Fantasy',
      tech: 'Tech & Sci-Fi',
      wisdom: 'Wisdom & Guidance',
      lifestyle: 'Lifestyle',
      nature: 'Nature & Outdoors',
      'personal-development': 'Personal Development',
      fun: 'Fun & Playful',
    };
    return titles[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const voicesByCategory = getVoicesByCategory();

  return (
    <div className="bg-white rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Voice</h2>
        <p className="text-gray-600">
          Select the perfect personality to wake you up each morning
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All Voices', icon: Volume2 },
            { key: 'free', label: 'Free', icon: Heart },
            { key: 'premium', label: 'Premium', icon: Crown },
            { key: 'ultimate', label: 'Ultimate', icon: Star },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                filter === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice categories */}
      <div className="space-y-8">
        {Object.entries(voicesByCategory).map(([category, voices]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {getCategoryTitle(category)}
              </h3>
              <div className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                {voices.length} voice{voices.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voices.map(voice => {
                const personality = PremiumVoiceService.getVoicePersonality(voice.id);
                const isLocked =
                  personality && !availableVoices.some((av: any) => a.v.id === voice.id);

                return (
                  <VoiceCard
                    key={voice.id}
                    voice={voice}
                    personality={personality || undefined}
                    isSelected={selectedVoice === voice.id}
                    isLocked={isLocked}
                    onSelect={() => handleVoiceSelect(voice.id)}
                    onTest={() => handleVoiceTest(voice.id)}
                    onUpgrade={showUpgradePrompts ? handleUpgrade : undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade prompt for free users */}
      {user.subscriptionTier === 'free' && showUpgradePrompts && (
        <div className="mt-8 bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="h-6 w-6" />
            <h3 className="text-xl font-bold">Unlock Premium Voices</h3>
          </div>
          <p className="mb-4 text-orange-100">
            Get access to {availableVoices.length - 6}+ premium voice personalities,
            including celebrity chefs, zen masters, robot companions, and more! Plus
            voice cloning with Ultimate tier.
          </p>
          <button
            onClick={handleUpgrade}
            className="bg-white text-orange-600 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors duration-200 flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Upgrade Now
          </button>
        </div>
      )}

      {/* Empty state */}
      {Object.keys(voicesByCategory).length === 0 && (
        <div className="text-center py-12">
          <Volume2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No voices found</h3>
          <p className="text-gray-600">Try adjusting your filter to see more voices.</p>
        </div>
      )}
    </div>
  );
};

export default VoiceSelector;
