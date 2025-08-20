/**
 * Alarm Theme Selector Component
 * Allows users to browse, preview, and select visual and audio alarm themes
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  visualAlarmThemes,
  VisualAlarmThemeId,
  VisualAlarmTheme
} from '../services/visual-alarm-themes';
import { soundEffectsService, SoundTheme } from '../services/sound-effects';
import { VoiceMood } from '../types';
import { Play, Volume2, Eye, Heart, Star, Filter, Search } from 'lucide-react';

interface ThemeCombination {
  id: string;
  name: string;
  description: string;
  visual: VisualAlarmThemeId;
  sound: SoundTheme;
  voice: VoiceMood;
  category: string;
  premium?: boolean;
  popularity?: number;
}

interface AlarmThemeSelectorProps {
  selectedVisualTheme?: VisualAlarmThemeId;
  selectedSoundTheme?: SoundTheme;
  selectedVoiceMood?: VoiceMood;
  onVisualThemeChange: (themeId: VisualAlarmThemeId) => void;
  onSoundThemeChange: (themeId: SoundTheme) => void;
  onVoiceMoodChange: (mood: VoiceMood) => void;
  className?: string;
}

export const AlarmThemeSelector: React.FC<AlarmThemeSelectorProps> = ({
  selectedVisualTheme = 'sunrise_glow',
  selectedSoundTheme = 'default',
  selectedVoiceMood = 'gentle',
  onVisualThemeChange,
  onSoundThemeChange,
  onVoiceMoodChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'sound' | 'voice' | 'combinations'>('combinations');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [previewTheme, setPreviewTheme] = useState<VisualAlarmThemeId | null>(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Get all themes
  const visualThemes = visualAlarmThemes.getAllThemes();
  const soundThemes = soundEffectsService.getAvailableThemes();
  const voiceMoods: VoiceMood[] = [
    'drill-sergeant', 'sweet-angel', 'anime-hero', 'savage-roast',
    'motivational', 'gentle', 'demon-lord', 'ai-robot', 'comedian', 'philosopher'
  ];

  // Predefined theme combinations
  const themeCombinations: ThemeCombination[] = [
    {
      id: 'gentle_morning',
      name: 'Gentle Morning',
      description: 'Peaceful sunrise with nature sounds and sweet voice',
      visual: 'sunrise_glow',
      sound: 'nature',
      voice: 'sweet-angel',
      category: 'gentle',
      popularity: 95
    },
    {
      id: 'energy_boost',
      name: 'Energy Boost',
      description: 'High-energy wake up with electronic beats and motivation',
      visual: 'lightning_bolt',
      sound: 'electronic',
      voice: 'motivational',
      category: 'energetic',
      popularity: 88
    },
    {
      id: 'forest_zen',
      name: 'Forest Zen',
      description: 'Natural forest setting with calming sounds',
      visual: 'forest_canopy',
      sound: 'nature',
      voice: 'gentle',
      category: 'nature',
      popularity: 92
    },
    {
      id: 'cyberpunk_alarm',
      name: 'Cyberpunk Alert',
      description: 'Futuristic neon display with synthetic sounds',
      visual: 'neon_pulse',
      sound: 'electronic',
      voice: 'ai-robot',
      category: 'futuristic',
      premium: true,
      popularity: 78
    },
    {
      id: 'space_journey',
      name: 'Space Journey',
      description: 'Cosmic visuals with ambient space sounds',
      visual: 'galaxy_spiral',
      sound: 'ambient',
      voice: 'gentle',
      category: 'cosmic',
      popularity: 85
    },
    {
      id: 'drill_sergeant',
      name: 'Boot Camp',
      description: 'No-nonsense military wake up call',
      visual: 'lightning_bolt',
      sound: 'energetic',
      voice: 'drill-sergeant',
      category: 'intense',
      popularity: 72
    },
    {
      id: 'anime_hero',
      name: 'Anime Power Up',
      description: 'Dramatic anime-style wake up sequence',
      visual: 'neon_pulse',
      sound: 'electronic',
      voice: 'anime-hero',
      category: 'anime',
      popularity: 80
    },
    {
      id: 'horror_nightmare',
      name: 'Nightmare Fuel',
      description: 'Spooky horror theme for brave souls',
      visual: 'blood_moon',
      sound: 'horror',
      voice: 'demon-lord',
      category: 'horror',
      premium: true,
      popularity: 45
    },
    {
      id: 'workout_pump',
      name: 'Workout Ready',
      description: 'High-intensity gym motivation',
      visual: 'lightning_bolt',
      sound: 'workout',
      voice: 'motivational',
      category: 'workout',
      popularity: 87
    },
    {
      id: 'meditation_flow',
      name: 'Meditation Flow',
      description: 'Peaceful meditation start to your day',
      visual: 'morning_mist',
      sound: 'meditation',
      voice: 'gentle',
      category: 'meditation',
      popularity: 91
    }
  ];

  // Filter combinations based on search and category
  const filteredCombinations = themeCombinations.filter(combo => {
    const matchesSearch = searchQuery === '' ||
      combo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      combo.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || combo.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(themeCombinations.map(c => c.category)))];

  // Preview theme
  const handlePreviewTheme = (themeId: VisualAlarmThemeId) => {
    setPreviewTheme(themeId);
    setIsPreviewActive(true);
    visualAlarmThemes.previewTheme(themeId, 3000);

    setTimeout(() => {
      setIsPreviewActive(false);
      setPreviewTheme(null);
    }, 3000);
  };

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  // Apply theme combination
  const applyThemeCombination = (combination: ThemeCombination) => {
    onVisualThemeChange(combination.visual);
    onSoundThemeChange(combination.sound);
    onVoiceMoodChange(combination.voice);
  };

  return (
    <div ref={containerRef} className={`alarm-theme-selector ${className}`}>
      {/* Header */}
      <div className="selector-header p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Alarm Themes</h2>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { id: 'combinations', label: 'Combinations', icon: Star },
            { id: 'visual', label: 'Visual', icon: Eye },
            { id: 'sound', label: 'Sound', icon: Volume2 },
            { id: 'voice', label: 'Voice', icon: Play }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors
                  ${activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="selector-content p-6 max-h-96 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'combinations' && (
            <motion.div
              key="combinations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredCombinations.map(combination => (
                <motion.div
                  key={combination.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`theme-card relative p-4 rounded-xl border cursor-pointer transition-all
                    ${combination.premium ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}
                    hover:shadow-lg hover:border-blue-400
                  `}
                  onClick={() => applyThemeCombination(combination)}
                >
                  {/* Premium Badge */}
                  {combination.premium && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                      PRO
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(combination.id);
                    }}
                    className={`absolute top-2 left-2 p-1 rounded-full transition-colors
                      ${favorites.has(combination.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}
                    `}
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(combination.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Theme Preview */}
                  <div className="mt-6 mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${visualAlarmThemes.getTheme(combination.visual)?.colors.gradientStart}, ${visualAlarmThemes.getTheme(combination.visual)?.colors.gradientEnd})`
                        }}
                      />
                      <h3 className="font-semibold text-lg">{combination.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {combination.description}
                    </p>
                  </div>

                  {/* Theme Details */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      {visualAlarmThemes.getTheme(combination.visual)?.name}
                    </span>
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                      {soundThemes.find(s => s.id === combination.sound)?.name}
                    </span>
                    <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                      {combination.voice}
                    </span>
                  </div>

                  {/* Popularity */}
                  {combination.popularity && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Star className="w-3 h-3" />
                      <span>{combination.popularity}% liked</span>
                    </div>
                  )}

                  {/* Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewTheme(combination.visual);
                    }}
                    disabled={isPreviewActive}
                    className="absolute bottom-2 right-2 p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'visual' && (
            <motion.div
              key="visual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {visualThemes.map(theme => (
                <motion.div
                  key={theme.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`visual-theme-card p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedVisualTheme === theme.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}
                  `}
                  onClick={() => onVisualThemeChange(theme.id as VisualAlarmThemeId)}
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.gradientStart}20, ${theme.colors.gradientEnd}20)`
                  }}
                >
                  <div
                    className="w-full h-16 rounded-lg mb-3 border border-gray-200"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`
                    }}
                  />
                  <h3 className="font-semibold mb-1">{theme.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{theme.description}</p>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded capitalize">
                    {theme.category}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewTheme(theme.id as VisualAlarmThemeId);
                    }}
                    className="mt-2 w-full py-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Preview
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'sound' && (
            <motion.div
              key="sound"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {soundThemes.map(theme => (
                <motion.div
                  key={theme.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`sound-theme-card p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedSoundTheme === theme.id ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}
                  `}
                  onClick={() => onSoundThemeChange(theme.id)}
                >
                  <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center text-white text-xl font-bold`}
                       style={{ backgroundColor: theme.color ? `var(--${theme.color}-500)` : '#6B7280' }}>
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-1">{theme.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{theme.description}</p>
                  {theme.category && (
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded capitalize">
                      {theme.category}
                    </span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {voiceMoods.map(mood => (
                <motion.div
                  key={mood}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`voice-mood-card p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedVoiceMood === mood ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}
                  `}
                  onClick={() => onVoiceMoodChange(mood)}
                >
                  <div className="text-2xl mb-2">
                    {mood === 'drill-sergeant' ? '🪖' :
                     mood === 'sweet-angel' ? '😇' :
                     mood === 'anime-hero' ? '⚡' :
                     mood === 'savage-roast' ? '🔥' :
                     mood === 'motivational' ? '💪' :
                     mood === 'gentle' ? '🌸' :
                     mood === 'demon-lord' ? '👹' :
                     mood === 'ai-robot' ? '🤖' :
                     mood === 'comedian' ? '😄' : '🧠'}
                  </div>
                  <h3 className="font-semibold mb-1 capitalize">{mood.replace('-', ' ')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {mood === 'drill-sergeant' ? 'Military-style wake up calls' :
                     mood === 'sweet-angel' ? 'Gentle and encouraging' :
                     mood === 'anime-hero' ? 'Dramatic and energizing' :
                     mood === 'savage-roast' ? 'Brutally honest humor' :
                     mood === 'motivational' ? 'Inspiring and uplifting' :
                     mood === 'gentle' ? 'Soft and peaceful' :
                     mood === 'demon-lord' ? 'Dark and commanding' :
                     mood === 'ai-robot' ? 'Robotic and futuristic' :
                     mood === 'comedian' ? 'Funny and entertaining' : 'Wise and thoughtful'}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Overlay */}
      <AnimatePresence>
        {isPreviewActive && previewTheme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-2">Previewing Theme</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {visualAlarmThemes.getTheme(previewTheme)?.name}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlarmThemeSelector;