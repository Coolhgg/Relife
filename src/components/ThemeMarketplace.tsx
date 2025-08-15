import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Upload,
  Star,
  Heart,
  Share2,
  Filter,
  Grid,
  List,
  Trash2,
  Eye,
  Tag,
  User,
  Calendar,
  Palette,
  TrendingUp,
  Award
} from 'lucide-react';
import ThemeSharingService, { SharedTheme, ThemeCollection } from '../services/ThemeSharing';
import { useEnhancedTheme } from '../hooks/useEnhancedTheme';

interface ThemeMarketplaceProps {
  onClose: () => void;
}

const ThemeMarketplace: React.FC<ThemeMarketplaceProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'favorites' | 'collections' | 'stats'>('browse');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [themes, setThemes] = useState<SharedTheme[]>([]);
  const [favoriteThemes, setFavoriteThemes] = useState<string[]>([]);
  const [collections, setCollections] = useState<ThemeCollection[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const themeSharingService = ThemeSharingService.getInstance();
  const { setVariant } = useEnhancedTheme();

  const availableTags = [
    'minimal', 'vibrant', 'dark', 'light', 'nature', 'tech', 'retro', 'modern',
    'gradient', 'monochrome', 'colorful', 'professional', 'creative', 'calm'
  ];

  useEffect(() => {
    loadData();
  }, [activeTab, searchQuery, selectedTags]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customThemes, favorites, themeCollections, themeStats] = await Promise.all([
        themeSharingService.searchThemes(searchQuery, selectedTags),
        themeSharingService.getFavoriteThemes(),
        themeSharingService.getCollections(),
        themeSharingService.getThemeStats()
      ]);

      setThemes(customThemes);
      setFavoriteThemes(favorites);
      setCollections(themeCollections);
      setStats(themeStats);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTheme = async (theme: SharedTheme) => {
    try {
      await themeSharingService.saveCustomTheme(theme);
      setVariant(theme.id as any);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  };

  const handleToggleFavorite = async (themeId: string) => {
    try {
      if (favoriteThemes.includes(themeId)) {
        await themeSharingService.removeFromFavorites(themeId);
        setFavoriteThemes(prev => prev.filter(id => id !== themeId));
      } else {
        await themeSharingService.addToFavorites(themeId);
        setFavoriteThemes(prev => [...prev, themeId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (window.confirm('Are you sure you want to delete this theme?')) {
      try {
        await themeSharingService.deleteCustomTheme(themeId);
        setThemes(prev => prev.filter(theme => theme.id !== themeId));
      } catch (error) {
        console.error('Error deleting theme:', error);
      }
    }
  };

  const handleExportThemes = async (themeIds?: string[]) => {
    try {
      const exportData = await themeSharingService.exportThemes(themeIds);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relife-themes-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting themes:', error);
    }
  };

  const handleImportThemes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        const result = await themeSharingService.importThemes(jsonData);
        
        if (result.errors.length > 0) {
          alert(`Import completed with ${result.imported} themes imported, ${result.skipped} skipped. Errors: ${result.errors.join(', ')}`);
        } else {
          alert(`Successfully imported ${result.imported} themes!`);
        }
        
        loadData();
      } catch (error) {
        alert(`Error importing themes: ${error}`);
      }
    };
    reader.readAsText(file);
  };

  const filteredThemes = themes.filter(theme => {
    if (activeTab === 'favorites') {
      return favoriteThemes.includes(theme.id);
    }
    return true;
  });

  const ThemeCard: React.FC<{ theme: SharedTheme }> = ({ theme }) => {
    const isFavorite = favoriteThemes.includes(theme.id);
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-lg transition-all duration-300">
        {/* Theme Preview */}
        <div 
          className="h-32 relative"
          style={{ background: theme.gradient }}
        >
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white font-medium text-lg">{theme.name}</span>
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(theme.id);
              }}
              className={`p-1.5 rounded-full backdrop-blur-sm ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Theme Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {theme.name}
            </h3>
            {theme.isCustom && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded">
                Custom
              </span>
            )}
          </div>
          
          {theme.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {theme.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 mb-3">
            <User className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">{theme.author}</span>
            <Calendar className="w-3 h-3 text-gray-400 ml-2" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {new Date(theme.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          {theme.tags && theme.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {theme.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
              {theme.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{theme.tags.length - 3}</span>
              )}
            </div>
          )}
          
          <div className="flex gap-1">
            {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((color, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded border border-white/50 shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleApplyTheme(theme)}
              className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
            >
              <Palette className="w-3 h-3" />
              Apply
            </button>
            <button
              onClick={() => handleExportThemes([theme.id])}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" />
            </button>
            {theme.isCustom && (
              <button
                onClick={() => handleDeleteTheme(theme.id)}
                className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const StatsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Themes</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.totalCustomThemes || 0}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Favorites</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.totalFavorites || 0}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Grid className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Collections</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.totalCollections || 0}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Popular</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.mostUsedColors?.length || 0}
          </div>
        </div>
      </div>
      
      {stats?.mostUsedColors && stats.mostUsedColors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Most Used Colors
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.mostUsedColors.slice(0, 10).map((item: any, index: number) => (
              <div key={item.color} className="text-center">
                <div
                  className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-200 dark:border-gray-600"
                  style={{ backgroundColor: item.color }}
                />
                <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  {item.color}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Used {item.count} times
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Theme Marketplace
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'browse', label: 'Browse Themes', icon: Search },
              { key: 'favorites', label: 'Favorites', icon: Heart },
              { key: 'collections', label: 'Collections', icon: Grid },
              { key: 'stats', label: 'Statistics', icon: TrendingUp }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
                  activeTab === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          
          {/* Controls */}
          {activeTab !== 'stats' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search themes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => handleExportThemes()}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export All
                </button>
                
                <label className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportThemes}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
          
          {/* Tag Filter */}
          {activeTab === 'browse' && (
            <div className="flex flex-wrap gap-2 mt-3">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
          ) : activeTab === 'stats' ? (
            <StatsView />
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-4'
            }>
              {filteredThemes.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-600 dark:text-gray-400">
                  {activeTab === 'favorites' 
                    ? "No favorite themes yet. Mark some themes as favorites to see them here!"
                    : searchQuery || selectedTags.length > 0
                    ? "No themes match your search criteria."
                    : "No themes available. Create some custom themes to get started!"
                  }
                </div>
              ) : (
                filteredThemes.map(theme => (
                  <ThemeCard key={theme.id} theme={theme} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeMarketplace;