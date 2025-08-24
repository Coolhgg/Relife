import React, { useState, useEffect } from 'react';
import {
  Grid,
  List,
  Search,
  Filter,
  Star,
  Download,
  Share2,
  Trash2,
  Edit3,
  Eye,
  Heart,
  Copy,
  Plus,
  Palette,
  Sparkles,
  Zap,
  Sun,
  Moon,
  Layers,
  Check,
  X,
  Monitor,
  Leaf,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { CustomThemeConfig, ThemePreset, Theme } from '../types';

interface ThemeGalleryProps {
  className?: string;
  onCreateNew?: () => void;
  onEditTheme?: (theme: CustomThemeConfig) => void;
}

interface ThemeCard {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
  tags: string[];
  author?: string;
  downloads?: number;
  rating?: number;
  isFavorite: boolean;
  isPremium?: boolean;
  isCustom: boolean;
  lastModified: Date;
  config?: CustomThemeConfig;
}

const ThemeGallery: React.FC<ThemeGalleryProps> = ({
  className = '',
  onCreateNew,
  onEditTheme,
}) => {
  const { theme, setTheme, availableThemes, saveThemePreset } = useTheme();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'rating' | 'downloads'>(
    'name'
  );
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [customThemes, setCustomThemes] = useState<ThemeCard[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Themes', icon: Layers },
    { id: 'system', name: 'System', icon: Monitor },
    { id: 'nature', name: 'Nature', icon: Sparkles },
    { id: 'abstract', name: 'Abstract', icon: Sparkles },
    { id: 'gradient', name: 'Gradient', icon: Palette },
    { id: 'custom', name: 'Custom', icon: Star },
    { id: 'favorites', name: 'Favorites', icon: Heart },
  ];

  // Featured/built-in themes
  const featuredThemes: ThemeCard[] = [
    {
      id: 'light',
      name: 'Light',
      description: 'Clean and bright interface perfect for daytime use',
      preview: {
        primary: '#0ea5e9',
        secondary: '#64748b',
        accent: '#ef4444',
        background: '#ffffff',
        surface: '#f8fafc',
      },
      tags: ['system', 'default', 'bright'],
      author: 'Relife Team',
      downloads: 10000,
      rating: 4.8,
      isFavorite: favorites.has('light'),
      isCustom: false,
      lastModified: new Date('2024-01-01'),
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes dark interface for night owls',
      preview: {
        primary: '#38bdf8',
        secondary: '#64748b',
        accent: '#f87171',
        background: '#0f172a',
        surface: '#1e293b',
      },
      tags: ['system', 'default', 'dark'],
      author: 'Relife Team',
      downloads: 9500,
      rating: 4.9,
      isFavorite: favorites.has('dark'),
      isCustom: false,
      lastModified: new Date('2024-01-01'),
    },
    {
      id: 'nature',
      name: 'Nature',
      description: 'Earth tones and natural colors for a calming experience',
      preview: {
        primary: '#22c55e',
        secondary: '#f59e0b',
        accent: '#15803d',
        background: '#f0fdf4',
        surface: '#dcfce7',
      },
      tags: ['nature', 'green', 'calm'],
      author: 'Relife Team',
      downloads: 5200,
      rating: 4.7,
      isFavorite: favorites.has('nature'),
      isCustom: false,
      lastModified: new Date('2024-01-01'),
    },
    {
      id: 'ocean',
      name: 'Ocean',
      description: 'Deep blue ocean-inspired theme',
      preview: {
        primary: '#06b6d4',
        secondary: '#0891b2',
        accent: '#22d3ee',
        background: '#ecfeff',
        surface: '#cffafe',
      },
      tags: ['nature', 'blue', 'calm'],
      author: 'Relife Team',
      downloads: 4100,
      rating: 4.6,
      isFavorite: favorites.has('ocean'),
      isPremium: true,
      isCustom: false,
      lastModified: new Date('2024-01-01'),
    },
    {
      id: 'cosmic',
      name: 'Cosmic',
      description: 'Deep space purple theme with stellar gradients',
      preview: {
        primary: '#8b5cf6',
        secondary: '#a855f7',
        accent: '#c084fc',
        background: '#0c0c0c',
        surface: '#1a1a2e',
      },
      tags: ['gradient', 'purple', 'space'],
      author: 'Relife Team',
      downloads: 3800,
      rating: 4.5,
      isFavorite: favorites.has('cosmic'),
      isPremium: true,
      isCustom: false,
      lastModified: new Date('2024-01-01'),
    },
    {
      id: 'sunset',
      name: 'Sunset',
      description: 'Warm sunset gradient colors',
      preview: {
        primary: '#ff7e5f',
        secondary: '#feb47b',
        accent: '#ff6a6b',
        background: '#fff8e1',
        surface: '#ffecb3',
      },
      tags: ['gradient', 'warm', 'orange'],
      author: 'Relife Team',
      downloads: 6200,
      rating: 4.8,
      isFavorite: favorites.has('sunset'),
      isPremium: true,
      isCustom: false,
      lastModified: new Date('2024-01-01'),
    },
  ];

  // Load custom themes and favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('theme-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }

    const savedCustomThemes = localStorage.getItem('custom-themes');
    if (savedCustomThemes) {
      try {
        const parsed = JSON.parse(savedCustomThemes);
        const customThemeCards: ThemeCard[] = parsed.map(
          (theme: CustomThemeConfig) => ({
            id: theme.id,
            name: theme.displayName || theme.name,
            description: theme.description,
            preview: {
              primary: theme.colors?.primary?.[500] || '#0ea5e9',
              secondary: theme.colors?.secondary?.[500] || '#64748b',
              accent: theme.colors?.accent?.[500] || '#ef4444',
              background: theme.colors?.background?.primary || '#ffffff',
              surface: theme.colors?.surface?.elevated || '#f8fafc',
            },
            tags: ['custom'],
            author: 'You',
            isFavorite: favorites.has(theme.id),
            isCustom: true,
            lastModified: new Date(),
            config: theme,
          })
        );
        setCustomThemes(customThemeCards);
      } catch (error) {
        console.error('Failed to load custom themes:', error);
      }
    }
  }, [favorites]);

  // Save favorites to localStorage
  const toggleFavorite = (themeId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(themeId)) {
      newFavorites.delete(themeId);
    } else {
      newFavorites.add(themeId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('theme-favorites', JSON.stringify([...newFavorites]));
  };

  // Combine and filter themes
  const allThemes = [...featuredThemes, ...customThemes].map(themeCard => ({
    ...themeCard,
    isFavorite: favorites.has(themeCard.id),
  }));

  const filteredThemes = allThemes.filter(theme => {
    // Search filter
    if (
      searchQuery &&
      !theme.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !theme.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !theme.tags.some((tag: any) => // auto: implicit any tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }

    // Category filter
    if (selectedCategory === 'favorites') {
      return theme.isFavorite;
    }
    if (selectedCategory === 'custom') {
      return theme.isCustom;
    }
    if (selectedCategory !== 'all' && !theme.tags.includes(selectedCategory)) {
      return false;
    }

    return true;
  });

  // Sort themes
  const sortedThemes = [...filteredThemes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return b.lastModified.getTime() - a.lastModified.getTime();
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'downloads':
        return (b.downloads || 0) - (a.downloads || 0);
      default:
        return 0;
    }
  });

  const applyTheme = async (themeCard: ThemeCard) => {
    if (themeCard.isCustom && themeCard.config) {
      // Apply custom theme
      try {
        await saveThemePreset({
          id: themeCard.config.id,
          name: themeCard.config.displayName,
          description: themeCard.config.description,
          theme: themeCard.config.baseTheme || 'light',
          personalization: {},
          preview: themeCard.preview,
          tags: themeCard.tags,
          isDefault: false,
          isPremium: false,
          popularityScore: 0,
        });
        setTheme(themeCard.config.name as Theme);
      } catch (error) {
        console.error('Failed to apply custom theme:', error);
        alert('Failed to apply theme. Please try again.');
      }
    } else {
      // Apply built-in theme
      setTheme(themeCard.id as Theme);
    }
  };

  const deleteCustomTheme = (themeId: string) => {
    const updatedThemes = customThemes.filter((t: any) => // auto: implicit any t.id !== themeId);
    setCustomThemes(updatedThemes);

    // Update localStorage
    const savedThemes = updatedThemes.map((t: any) => // auto: implicit any t.config).filter(Boolean);
    localStorage.setItem('custom-themes', JSON.stringify(savedThemes));

    setShowDeleteConfirm(null);
  };

  const duplicateTheme = (themeCard: ThemeCard) => {
    if (onEditTheme && themeCard.config) {
      onEditTheme(themeCard.config);
    }
  };

  // Theme card component
  const ThemeCardComponent: React.FC<{ theme: ThemeCard; isCompact?: boolean }> = ({
    theme: themeCard,
    isCompact = false,
  }) => (
    <div
      className={`group relative rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${
        theme === themeCard.id ? 'ring-2 ring-blue-500 border-blue-300' : ''
      }`}
    >
      {/* Preview */}
      <div className="relative">
        <div
          className={`${isCompact ? 'h-24' : 'h-32'} flex`}
          style={{ backgroundColor: themeCard.preview.background }}
        >
          {/* Color palette preview */}
          <div className="flex-1 flex">
            <div
              className="flex-1"
              style={{ backgroundColor: themeCard.preview.primary }}
            />
            <div
              className="flex-1"
              style={{ backgroundColor: themeCard.preview.secondary }}
            />
            <div
              className="flex-1"
              style={{ backgroundColor: themeCard.preview.accent }}
            />
            <div
              className="flex-1"
              style={{ backgroundColor: themeCard.preview.surface }}
            />
          </div>

          {/* Overlay with preview components */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black to-opacity-10">
            <div className="absolute top-2 right-2 flex gap-1">
              {themeCard.isPremium && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                  Pro
                </span>
              )}
              {themeCard.isCustom && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                  Custom
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => applyTheme(themeCard)}
            className="flex items-center gap-1 px-3 py-1 bg-white rounded-full text-gray-800 font-medium hover:bg-gray-100 transition-colors"
          >
            <Eye size={14} />
            <span className="text-xs">Apply</span>
          </button>
          {themeCard.isCustom && onEditTheme && themeCard.config && (
            <button
              onClick={() => onEditTheme(themeCard.config!)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              <Edit3 size={14} />
              <span className="text-xs">Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{themeCard.name}</h3>
            {!isCompact && (
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                {themeCard.description}
              </p>
            )}
          </div>
          <button
            onClick={() => toggleFavorite(themeCard.id)}
            className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Heart
              size={16}
              className={
                themeCard.isFavorite
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-400 hover:text-red-500'
              }
            />
          </button>
        </div>

        {/* Tags */}
        {!isCompact && (
          <div className="flex flex-wrap gap-1 mb-3">
            {themeCard.tags.slice(0, 3).map((tag: any) => // auto: implicit any (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {themeCard.author && <span>by {themeCard.author}</span>}
            {themeCard.rating && (
              <div className="flex items-center gap-1">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span>{themeCard.rating}</span>
              </div>
            )}
            {themeCard.downloads && (
              <div className="flex items-center gap-1">
                <Download size={12} />
                <span>{themeCard.downloads.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Action menu */}
          <div className="flex items-center gap-1">
            {themeCard.isCustom && (
              <>
                <button
                  onClick={() => duplicateTheme(themeCard)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Duplicate theme"
                >
                  <Copy size={14} className="text-gray-400 hover:text-gray-600" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(themeCard.id)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Delete theme"
                >
                  <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                </button>
              </>
            )}
            <button
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Share theme"
            >
              <Share2 size={14} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Palette className="text-blue-600" />
            Theme Gallery
          </h1>
          <p className="text-gray-600 mt-2">
            Discover and apply beautiful themes, or create your own custom designs
          </p>
        </div>

        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Create Theme</span>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e: any) => // auto: implicit any setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e: any) => // auto: implicit any setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e: any) => // auto: implicit any setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="rating">Sort by Rating</option>
            <option value="downloads">Sort by Downloads</option>
          </select>

          <div className="flex border border-gray-200 rounded-lg">
            <button
              onClick={() => setView('grid')}
              className={`p-2 ${view === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 ${view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600 mb-4">
        {sortedThemes.length} theme{sortedThemes.length !== 1 ? 's' : ''} found
      </div>

      {/* Theme grid/list */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedThemes.map(themeCard => (
            <ThemeCardComponent key={themeCard.id} theme={themeCard} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedThemes.map(themeCard => (
            <div
              key={themeCard.id}
              className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-24 h-16 rounded-lg overflow-hidden">
                <ThemeCardComponent theme={themeCard} isCompact />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{themeCard.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {themeCard.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {themeCard.author && <span>by {themeCard.author}</span>}
                      {themeCard.rating && (
                        <div className="flex items-center gap-1">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          <span>{themeCard.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(themeCard.id)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Heart
                        size={16}
                        className={
                          themeCard.isFavorite
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-400 hover:text-red-500'
                        }
                      />
                    </button>
                    <button
                      onClick={() => applyTheme(themeCard)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {sortedThemes.length === 0 && (
        <div className="text-center py-12">
          <Palette className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No themes found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search or filters, or create a custom theme
          </p>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>Create Your First Theme</span>
            </button>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Theme</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this custom theme? All customizations will
              be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCustomTheme(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Theme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeGallery;
