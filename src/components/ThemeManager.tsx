import React, { useState, useEffect } from 'react';
import {
  Palette,
  Plus,
  Eye,
  Settings,
  Star,
  Heart,
  Download,
  Upload,
  RefreshCw,
  Grid,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import ThemeStudio from './ThemeStudio';
import type { Theme, CustomThemeConfig } from '../types';

interface ThemeManagerProps {
  className?: string;
  compact?: boolean;
}

interface QuickTheme {
  id: string;
  name: string;
  icon: React.ReactNode;
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
  };
  description: string;
}

const ThemeManager: React.FC<ThemeManagerProps> = ({
  className = '',
  compact = false,
}) => {
  const { theme, setTheme, themeConfig, availableThemes } = useTheme();
  const [showStudio, setShowStudio] = useState(false);
  const [customThemes, setCustomThemes] = useState<CustomThemeConfig[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Quick theme options for the compact view
  const quickThemes: QuickTheme[] = [
    {
      id: 'light',
      name: 'Light',
      icon: <Sun size={16} />,
      colors: {
        primary: '#0ea5e9',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
      },
      description: 'Clean and bright',
    },
    {
      id: 'dark',
      name: 'Dark',
      icon: <Moon size={16} />,
      colors: {
        primary: '#38bdf8',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
      },
      description: 'Easy on the eyes',
    },
    {
      id: 'auto',
      name: 'Auto',
      icon: <Monitor size={16} />,
      colors: {
        primary: '#0ea5e9',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
      },
      description: 'Follows system',
    },
    {
      id: 'nature',
      name: 'Nature',
      icon: <Sparkles size={16} />,
      colors: {
        primary: '#22c55e',
        background: '#f0fdf4',
        surface: '#dcfce7',
        text: '#14532d',
      },
      description: 'Earth tones',
    },
  ];

  // Load custom themes and favorites
  useEffect(() => {
    const savedFavorites = localStorage.getItem('theme-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }

    const savedCustomThemes = localStorage.getItem('custom-themes');
    if (savedCustomThemes) {
      try {
        const parsed = JSON.parse(savedCustomThemes);
        setCustomThemes(parsed);
      } catch (error) {
        console.error('Failed to load custom themes:', error);
      }
    }
  }, []);

  const applyTheme = (themeId: string) => {
    setTheme(themeId as Theme);
  };

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

  const exportThemes = () => {
    const themeData = {
      customThemes,
      favorites: [...favorites],
      currentTheme: theme,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(themeData, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'relife-themes.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importThemes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const themeData = JSON.parse(e.target?.result as string);

        if (themeData.customThemes && Array.isArray(themeData.customThemes)) {
          const existingThemes = [...customThemes];
          themeData.customThemes.forEach((importedTheme: CustomThemeConfig) => {
            const exists = existingThemes.find(t => t.id === importedTheme.id);
            if (!exists) {
              existingThemes.push(importedTheme);
            }
          });
          setCustomThemes(existingThemes);
          localStorage.setItem('custom-themes', JSON.stringify(existingThemes));
        }

        if (themeData.favorites && Array.isArray(themeData.favorites)) {
          const newFavorites = new Set([...favorites, ...themeData.favorites]);
          setFavorites(newFavorites);
          localStorage.setItem('theme-favorites', JSON.stringify([...newFavorites]));
        }

        alert('Themes imported successfully!');
      } catch (error) {
        console.error('Failed to import themes:', error);
        alert('Failed to import themes. Please check the file format.');
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
  };

  if (compact) {
    return (
      <>
        <div className={`${className}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Palette className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Themes</h3>
            </div>
            <button
              onClick={() => setShowStudio(true)}
              className="flex items-center gap-2 px-3 py-1 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              <Settings size={14} />
              <span>Manage</span>
            </button>
          </div>

          {/* Quick theme selector */}
          <div className="grid grid-cols-2 gap-2">
            {quickThemes.map(quickTheme => (
              <button
                key={quickTheme.id}
                onClick={() => applyTheme(quickTheme.id)}
                className={`group relative p-3 rounded-lg border-2 transition-all ${
                  theme === quickTheme.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Color preview */}
                <div className="flex gap-1 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: quickTheme.colors.primary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: quickTheme.colors.surface }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: quickTheme.colors.background }}
                  />
                </div>

                {/* Theme info */}
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`${theme === quickTheme.id ? 'text-blue-600' : 'text-gray-600'}`}
                  >
                    {quickTheme.icon}
                  </div>
                  <span
                    className={`font-medium text-sm ${
                      theme === quickTheme.id ? 'text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    {quickTheme.name}
                  </span>
                  {theme === quickTheme.id && (
                    <Check size={14} className="text-blue-600 ml-auto" />
                  )}
                </div>

                <p className="text-xs text-gray-500 text-left">
                  {quickTheme.description}
                </p>

                {/* Favorite button */}
                <button
                  onClick={(e: any) => { // auto
                    e.stopPropagation();
                    toggleFavorite(quickTheme.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <Heart
                    size={12}
                    className={
                      favorites.has(quickTheme.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-400'
                    }
                  />
                </button>
              </button>
            ))}
          </div>

          {/* Custom themes preview */}
          {customThemes.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Custom Themes</span>
                <span className="text-xs text-gray-500">
                  {customThemes.length} theme{customThemes.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-2">
                {customThemes.slice(0, 4).map(($1) => {
        // TODO(manual): implement
        return null;
      })
                  <button
                    key={customTheme.id}
                    onClick={() => applyTheme(customTheme.name)}
                    className="flex-shrink-0 w-12 h-8 rounded-md border border-gray-200 overflow-hidden hover:ring-2 hover:ring-blue-300 transition-all"
                    title={customTheme.displayName || customTheme.name}
                  >
                    <div className="w-full h-full flex">
                      <div
                        className="flex-1"
                        style={{
                          backgroundColor:
                            customTheme.colors?.primary?.[500] || '#0ea5e9',
                        }}
                      />
                      <div
                        className="flex-1"
                        style={{
                          backgroundColor:
                            customTheme.colors?.secondary?.[500] || '#64748b',
                        }}
                      />
                      <div
                        className="flex-1"
                        style={{
                          backgroundColor:
                            customTheme.colors?.accent?.[500] || '#ef4444',
                        }}
                      />
                    </div>
                  </button>
                ))}
                {customThemes.length > 4 && (
                  <button
                    onClick={() => setShowStudio(true)}
                    className="flex-shrink-0 w-12 h-8 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-xs text-gray-600">
                      +{customThemes.length - 4}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => setShowStudio(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm flex-1 justify-center"
            >
              <Plus size={14} />
              <span>Create</span>
            </button>

            <button
              onClick={exportThemes}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Download size={14} />
            </button>

            <label className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm cursor-pointer">
              <Upload size={14} />
              <input
                type="file"
                accept=".json"
                onChange={importThemes}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {showStudio && (
          <ThemeStudio
            onClose={() => setShowStudio(false)}
            className="fixed inset-0 z-50"
          />
        )}
      </>
    );
  }

  // Full theme manager view
  return (
    <>
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Palette className="text-blue-600" />
              Theme Manager
            </h2>
            <p className="text-gray-600 mt-1">
              Customize your app's appearance with themes
            </p>
          </div>
          <button
            onClick={() => setShowStudio(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings size={18} />
            <span>Open Studio</span>
          </button>
        </div>

        {/* Current theme display */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Theme</h3>
          <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <div className="w-full h-full flex">
                    <div
                      className="flex-1"
                      style={{
                        backgroundColor:
                          themeConfig?.colors?.primary?.[500] || '#0ea5e9',
                      }}
                    />
                    <div
                      className="flex-1"
                      style={{
                        backgroundColor:
                          themeConfig?.colors?.secondary?.[500] || '#64748b',
                      }}
                    />
                    <div
                      className="flex-1"
                      style={{
                        backgroundColor:
                          themeConfig?.colors?.accent?.[500] || '#ef4444',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {themeConfig?.displayName || theme}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {themeConfig?.description || 'Active theme'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Active
                    </span>
                    {favorites.has(theme) && (
                      <Heart size={12} className="text-red-500 fill-red-500" />
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(theme)}
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-50 transition-colors"
              >
                <Heart
                  size={20}
                  className={
                    favorites.has(theme)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-400 hover:text-red-500'
                  }
                />
              </button>
            </div>
          </div>
        </div>

        {/* Quick theme grid */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Themes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickThemes.map(quickTheme => (
              <button
                key={quickTheme.id}
                onClick={() => applyTheme(quickTheme.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  theme === quickTheme.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  {Object.values(quickTheme.colors).map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={
                      theme === quickTheme.id ? 'text-blue-600' : 'text-gray-600'
                    }
                  >
                    {quickTheme.icon}
                  </div>
                  <span
                    className={`font-medium ${theme === quickTheme.id ? 'text-blue-900' : 'text-gray-900'}`}
                  >
                    {quickTheme.name}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{quickTheme.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom themes */}
        {customThemes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Custom Themes ({customThemes.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {customThemes.slice(0, 6).map(($1) => {
        // TODO(manual): implement
        return null;
      })
                <button
                  key={customTheme.id}
                  onClick={() => applyTheme(customTheme.name)}
                  className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all text-left group"
                >
                  <div className="flex gap-1 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor:
                          customTheme.colors?.primary?.[500] || '#0ea5e9',
                      }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor:
                          customTheme.colors?.secondary?.[500] || '#64748b',
                      }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: customTheme.colors?.accent?.[500] || '#ef4444',
                      }}
                    />
                  </div>
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {customTheme.displayName || customTheme.name}
                  </h4>
                  <p className="text-sm text-gray-500">{customTheme.description}</p>
                </button>
              ))}
            </div>
            {customThemes.length > 6 && (
              <button
                onClick={() => setShowStudio(true)}
                className="mt-3 w-full py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View all {customThemes.length} custom themes
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowStudio(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Create New Theme</span>
          </button>

          <button
            onClick={() => setShowStudio(true)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Grid size={18} />
            <span>Browse Gallery</span>
          </button>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={exportThemes}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export themes"
            >
              <Download size={18} />
            </button>

            <label
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              title="Import themes"
            >
              <Upload size={18} />
              <input
                type="file"
                accept=".json"
                onChange={importThemes}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {showStudio && <ThemeStudio onClose={() => setShowStudio(false)} />}
    </>
  );
};

export default ThemeManager;
