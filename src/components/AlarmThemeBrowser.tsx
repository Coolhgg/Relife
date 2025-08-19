/**
 * Enhanced Alarm Theme Browser Component
 * Advanced theme selection interface with collections, filtering, and preview
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  themeCombinations,
  ThemeCombination,
  ThemeCollection,
  ThemeCategory,
  AlarmIntensity,
  ThemeMood,
  TimeOfDay,
  WeatherCondition
} from '../services/theme-combinations';
import { contextualThemes } from '../services/contextual-themes';
import { visualAlarmThemes } from '../services/visual-alarm-themes';
import {
  Search, Filter, Grid, List, Heart, Star, Play, Eye,
  Clock, Cloud, Zap, Volume2, Mic, Shuffle, TrendingUp,
  Settings, Download, Upload, Plus, X, ChevronDown,
  Sun, Moon, CloudRain, Snowflake, Wind
} from 'lucide-react';

interface AlarmThemeBrowserProps {
  selectedTheme?: string;
  onThemeSelect: (combination: ThemeCombination) => void;
  onPreview: (combination: ThemeCombination) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list' | 'collections';
type SortMode = 'popularity' | 'recent' | 'alphabetical' | 'rating' | 'category';

export const AlarmThemeBrowser: React.FC<AlarmThemeBrowserProps> = ({
  selectedTheme,
  onThemeSelect,
  onPreview,
  className = ''
}) => {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('collections');
  const [sortMode, setSortMode] = useState<SortMode>('popularity');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory | 'all'>('all');
  const [selectedIntensity, setSelectedIntensity] = useState<AlarmIntensity | 'all'>('all');
  const [selectedMood, setSelectedMood] = useState<ThemeMood | 'all'>('all');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay | 'all'>('all');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [previewingTheme, setPreviewingTheme] = useState<string | null>(null);

  // Data
  const [allCombinations, setAllCombinations] = useState<ThemeCombination[]>([]);
  const [collections, setCollections] = useState<ThemeCollection[]>([]);
  const [contextualRecommendations, setContextualRecommendations] = useState<ThemeCombination[]>([]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setAllCombinations(themeCombinations.getAllCombinations());
      setCollections(themeCombinations.getAllCollections());

      // Get contextual recommendations for current time
      try {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const recommendation = await contextualThemes.getContextualRecommendation(currentTime);

        // Find combinations that match the recommendation
        const matchingCombos = themeCombinations.getAllCombinations().filter(combo =>
          combo.visual === recommendation.visual ||
          combo.sound === recommendation.sound ||
          combo.voice === recommendation.voice
        );
        setContextualRecommendations(matchingCombos.slice(0, 3));
      } catch (error) {
        console.warn('Failed to load contextual recommendations:', error);
      }
    };

    loadData();
  }, []);

  // Filtered and sorted combinations
  const filteredCombinations = useMemo(() => {
    let filtered = allCombinations;

    // Apply search
    if (searchQuery) {
      filtered = themeCombinations.searchCombinations(searchQuery);
    }

    // Apply filters
    filtered = filtered.filter(combo => {
      if (selectedCategory !== 'all' && combo.category !== selectedCategory) return false;
      if (selectedIntensity !== 'all' && combo.difficulty !== selectedIntensity) return false;
      if (selectedMood !== 'all' && combo.mood !== selectedMood) return false;
      if (selectedTimeOfDay !== 'all' && !combo.timeOfDay.includes(selectedTimeOfDay)) return false;
      if (showPremiumOnly && !combo.premium) return false;
      if (showFavoritesOnly && !themeCombinations.isFavorite(combo.id)) return false;

      return true;
    });

    // Apply sorting
    switch (sortMode) {
      case 'popularity':
        filtered.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'recent':
        filtered.sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return filtered;
  }, [
    allCombinations, searchQuery, selectedCategory, selectedIntensity,
    selectedMood, selectedTimeOfDay, showPremiumOnly, showFavoritesOnly, sortMode
  ]);

  // Event handlers
  const handleThemeSelect = (combination: ThemeCombination) => {
    themeCombinations.recordUsage(combination.id);
    onThemeSelect(combination);
  };

  const handlePreview = (combination: ThemeCombination) => {
    setPreviewingTheme(combination.id);
    onPreview(combination);

    // Auto-hide preview after 3 seconds
    setTimeout(() => {
      setPreviewingTheme(null);
    }, 3000);
  };

  const toggleFavorite = (combinationId: string) => {
    if (themeCombinations.isFavorite(combinationId)) {
      themeCombinations.removeFromFavorites(combinationId);
    } else {
      themeCombinations.addToFavorites(combinationId);
    }
    // Force re-render
    setAllCombinations([...themeCombinations.getAllCombinations()]);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedIntensity('all');
    setSelectedMood('all');
    setSelectedTimeOfDay('all');
    setShowPremiumOnly(false);
    setShowFavoritesOnly(false);
  };

  // Helper functions
  const getWeatherIcon = (weather: WeatherCondition) => {
    switch (weather) {
      case 'sunny': return <Sun className="w-4 h-4" />;
      case 'cloudy': return <Cloud className="w-4 h-4" />;
      case 'rainy': return <CloudRain className="w-4 h-4" />;
      case 'snowy': return <Snowflake className="w-4 h-4" />;
      case 'windy': return <Wind className="w-4 h-4" />;
      default: return <Cloud className="w-4 h-4" />;
    }
  };

  const getIntensityColor = (intensity: AlarmIntensity) => {
    switch (intensity) {
      case 'gentle': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-blue-600 bg-blue-100';
      case 'intense': return 'text-orange-600 bg-orange-100';
      case 'extreme': return 'text-red-600 bg-red-100';
    }
  };

  const getMoodEmoji = (mood: ThemeMood) => {
    switch (mood) {
      case 'peaceful': return '😌';
      case 'energizing': return '⚡';
      case 'dramatic': return '🎭';
      case 'mystical': return '🔮';
      case 'scary': return '👻';
      case 'motivational': return '💪';
      case 'romantic': return '💕';
      case 'nostalgic': return '📼';
      default: return '✨';
    }
  };

  return (
    <div className={`alarm-theme-browser ${className}`}>
      {/* Header */}
      <div className="browser-header p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Alarm Themes</h2>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[
                { mode: 'collections', icon: Grid, label: 'Collections' },
                { mode: 'grid', icon: Grid, label: 'Grid' },
                { mode: 'list', icon: List, label: 'List' }
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as ViewMode)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition-colors
                    ${viewMode === mode
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Actions */}
            <button className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
              <Shuffle className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search themes, moods, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl
                           focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-lg"
              />
            </div>

            {/* Sort */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl
                         focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 min-w-[150px]"
            >
              <option value="popularity">Most Popular</option>
              <option value="recent">Recently Used</option>
              <option value="alphabetical">A to Z</option>
              <option value="rating">Highest Rated</option>
              <option value="category">By Category</option>
            </select>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 border rounded-xl transition-colors
                ${showFilters
                  ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 hover:text-blue-600'
                }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ThemeCategory | 'all')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    <option value="all">All Categories</option>
                    <option value="gentle">Gentle</option>
                    <option value="energetic">Energetic</option>
                    <option value="nature">Nature</option>
                    <option value="electronic">Electronic</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="horror">Horror</option>
                    <option value="workout">Workout</option>
                    <option value="meditation">Meditation</option>
                    <option value="cosmic">Cosmic</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>

                {/* Intensity Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Intensity
                  </label>
                  <select
                    value={selectedIntensity}
                    onChange={(e) => setSelectedIntensity(e.target.value as AlarmIntensity | 'all')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    <option value="all">All Intensities</option>
                    <option value="gentle">Gentle</option>
                    <option value="moderate">Moderate</option>
                    <option value="intense">Intense</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>

                {/* Time of Day Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time of Day
                  </label>
                  <select
                    value={selectedTimeOfDay}
                    onChange={(e) => setSelectedTimeOfDay(e.target.value as TimeOfDay | 'all')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    <option value="all">Any Time</option>
                    <option value="early-morning">Early Morning</option>
                    <option value="morning">Morning</option>
                    <option value="midday">Midday</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                    <option value="late-night">Late Night</option>
                  </select>
                </div>

                {/* Toggle Filters */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showPremiumOnly}
                      onChange={(e) => setShowPremiumOnly(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Premium Only</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showFavoritesOnly}
                      onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Favorites Only</span>
                  </label>

                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 text-sm text-blue-600 hover:text-blue-700
                               border border-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    Clear Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-4">
          <span>{filteredCombinations.length} themes found</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>Popular themes trending</span>
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="browser-content p-6">
        {/* Contextual Recommendations */}
        {contextualRecommendations.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>Recommended for You</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contextualRecommendations.map((combo) => (
                <ThemeCard
                  key={combo.id}
                  combination={combo}
                  isSelected={selectedTheme === combo.id}
                  isPreviewing={previewingTheme === combo.id}
                  onSelect={() => handleThemeSelect(combo)}
                  onPreview={() => handlePreview(combo)}
                  onToggleFavorite={() => toggleFavorite(combo.id)}
                  isFavorite={themeCombinations.isFavorite(combo.id)}
                  compact={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'collections' && (
            <motion.div
              key="collections"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {collections.map((collection) => (
                <CollectionView
                  key={collection.id}
                  collection={collection}
                  combinations={themeCombinations.getCombinationsInCollection(collection.id)}
                  selectedTheme={selectedTheme}
                  previewingTheme={previewingTheme}
                  onSelect={handleThemeSelect}
                  onPreview={handlePreview}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </motion.div>
          )}

          {viewMode === 'grid' && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredCombinations.map((combo) => (
                <ThemeCard
                  key={combo.id}
                  combination={combo}
                  isSelected={selectedTheme === combo.id}
                  isPreviewing={previewingTheme === combo.id}
                  onSelect={() => handleThemeSelect(combo)}
                  onPreview={() => handlePreview(combo)}
                  onToggleFavorite={() => toggleFavorite(combo.id)}
                  isFavorite={themeCombinations.isFavorite(combo.id)}
                />
              ))}
            </motion.div>
          )}

          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {filteredCombinations.map((combo) => (
                <ThemeListItem
                  key={combo.id}
                  combination={combo}
                  isSelected={selectedTheme === combo.id}
                  isPreviewing={previewingTheme === combo.id}
                  onSelect={() => handleThemeSelect(combo)}
                  onPreview={() => handlePreview(combo)}
                  onToggleFavorite={() => toggleFavorite(combo.id)}
                  isFavorite={themeCombinations.isFavorite(combo.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Theme Card Component
interface ThemeCardProps {
  combination: ThemeCombination;
  isSelected: boolean;
  isPreviewing: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  compact?: boolean;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  combination,
  isSelected,
  isPreviewing,
  onSelect,
  onPreview,
  onToggleFavorite,
  isFavorite,
  compact = false
}) => {
  const theme = visualAlarmThemes.getTheme(combination.visual);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`theme-card relative p-4 rounded-xl border cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' :
          'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-blue-300'}
        ${combination.premium ? 'ring-2 ring-yellow-400/20' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={onSelect}
    >
      {/* Premium Badge */}
      {combination.premium && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded z-10">
          PRO
        </div>
      )}

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`absolute top-2 left-2 p-1 rounded-full transition-colors z-10
          ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}
        `}
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Theme Preview */}
      <div className="mt-6 mb-3">
        <div
          className="w-full h-16 rounded-lg mb-3 border border-gray-200 relative overflow-hidden"
          style={{
            background: theme ? `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})` : '#6B7280'
          }}
        >
          {/* Visual effect overlay */}
          <div className="absolute inset-0 opacity-30">
            {theme?.effects.particles && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse" />
            )}
          </div>
        </div>

        <h3 className={`font-semibold mb-1 ${compact ? 'text-sm' : 'text-lg'}`}>
          {combination.name}
        </h3>

        {!compact && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {combination.description}
          </p>
        )}
      </div>

      {/* Theme Components */}
      <div className="flex flex-wrap gap-1 mb-3">
        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
          <Eye className="w-3 h-3 inline mr-1" />
          {theme?.name}
        </span>
        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
          <Volume2 className="w-3 h-3 inline mr-1" />
          {combination.sound}
        </span>
        <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
          <Mic className="w-3 h-3 inline mr-1" />
          {combination.voice}
        </span>
      </div>

      {/* Metadata */}
      {!compact && (
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded ${getIntensityColor(combination.difficulty)}`}>
              {combination.difficulty}
            </span>
            <span>{getMoodEmoji(combination.mood)}</span>
          </div>

          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span>{combination.popularity}%</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {combination.weatherSuitability.slice(0, 3).map((weather, index) => (
            <span key={index} className="text-gray-400" title={weather}>
              {weather === 'sunny' ? <Sun className="w-4 h-4" /> : 
               weather === 'cloudy' ? <Cloud className="w-4 h-4" /> : 
               weather === 'rainy' ? <CloudRain className="w-4 h-4" /> : 
               weather === 'snowy' ? <Snowflake className="w-4 h-4" /> : 
               weather === 'windy' ? <Wind className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
            </span>
          ))}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          disabled={isPreviewing}
          className={`p-2 rounded-full transition-colors
            ${isPreviewing
              ? 'text-blue-600 bg-blue-100 animate-pulse'
              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
        >
          <Play className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// Collection View Component
interface CollectionViewProps {
  collection: ThemeCollection;
  combinations: ThemeCombination[];
  selectedTheme?: string;
  previewingTheme: string | null;
  onSelect: (combination: ThemeCombination) => void;
  onPreview: (combination: ThemeCombination) => void;
  onToggleFavorite: (id: string) => void;
}

const CollectionView: React.FC<CollectionViewProps> = ({
  collection,
  combinations,
  selectedTheme,
  previewingTheme,
  onSelect,
  onPreview,
  onToggleFavorite
}) => (
  <div className="collection-view">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <span>{collection.name}</span>
          {collection.premium && (
            <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
              PRO
            </span>
          )}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{collection.description}</p>
      </div>

      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>{combinations.length} themes</span>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {combinations.map((combo) => (
        <ThemeCard
          key={combo.id}
          combination={combo}
          isSelected={selectedTheme === combo.id}
          isPreviewing={previewingTheme === combo.id}
          onSelect={() => onSelect(combo)}
          onPreview={() => onPreview(combo)}
          onToggleFavorite={() => onToggleFavorite(combo.id)}
          isFavorite={themeCombinations.isFavorite(combo.id)}
          compact={true}
        />
      ))}
    </div>
  </div>
);

// Theme List Item Component
interface ThemeListItemProps {
  combination: ThemeCombination;
  isSelected: boolean;
  isPreviewing: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

const ThemeListItem: React.FC<ThemeListItemProps> = ({
  combination,
  isSelected,
  isPreviewing,
  onSelect,
  onPreview,
  onToggleFavorite,
  isFavorite
}) => {
  const theme = visualAlarmThemes.getTheme(combination.visual);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`theme-list-item flex items-center p-4 rounded-xl border cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
          'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md'}
      `}
      onClick={onSelect}
    >
      {/* Preview */}
      <div
        className="w-16 h-16 rounded-lg mr-4 border border-gray-200 flex-shrink-0"
        style={{
          background: theme ? `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})` : '#6B7280'
        }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-semibold text-lg truncate">{combination.name}</h3>
          {combination.premium && (
            <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">PRO</span>
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">
          {combination.description}
        </p>

        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>{theme?.name}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Volume2 className="w-3 h-3" />
            <span>{combination.sound}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Mic className="w-3 h-3" />
            <span>{combination.voice}</span>
          </span>
          <span className={`px-2 py-1 rounded ${getIntensityColor(combination.difficulty)}`}>
            {combination.difficulty}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`p-2 rounded-full transition-colors
            ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}
          `}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          disabled={isPreviewing}
          className={`p-2 rounded-full transition-colors
            ${isPreviewing
              ? 'text-blue-600 bg-blue-100 animate-pulse'
              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
        >
          <Play className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Star className="w-3 h-3 text-yellow-500" />
          <span>{combination.popularity}%</span>
        </div>
      </div>
    </motion.div>
  );
};

// Helper functions (moved from inline)
const getIntensityColor = (intensity: AlarmIntensity) => {
  switch (intensity) {
    case 'gentle': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
    case 'moderate': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
    case 'intense': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300';
    case 'extreme': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
  }
};

const getMoodEmoji = (mood: ThemeMood) => {
  switch (mood) {
    case 'peaceful': return '😌';
    case 'energizing': return '⚡';
    case 'dramatic': return '🎭';
    case 'mystical': return '🔮';
    case 'scary': return '👻';
    case 'motivational': return '💪';
    case 'romantic': return '💕';
    case 'nostalgic': return '📼';
    default: return '✨';
  }
};

export default AlarmThemeBrowser;