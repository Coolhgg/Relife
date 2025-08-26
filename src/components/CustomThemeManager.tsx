import React, { useState, useEffect } from 'react';
// Replaced stub import with proper implementation
import {
  Palette,
  Plus,
  Edit,
  Trash2,
  Copy,
  Share,
  Download,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Calendar,
  User,
  Users,
  Music,
  Play,
  MoreHorizontal,
  Settings,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { AlertTriangle, AlertDescription } from './ui/alert';
import { CustomSoundThemeCreator } from './CustomSoundThemeCreator';
import { SoundPreviewSystem } from './SoundPreviewSystem';
import { soundEffectsService } from '../services/sound-effects';
import type {
  CustomSoundTheme,
  CustomSoundThemeCategory,
  CustomSoundThemeLibrary,
} from '../types/custom-sound-themes';

interface CustomThemeManagerProps {
  userId?: string;
  className?: string;
  onClose?: () => void;
  onThemeUpdated?: (theme: CustomSoundTheme) => void;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'created' | 'updated' | 'rating' | 'downloads';
type FilterCategory = 'all' | CustomSoundThemeCategory;

export const CustomThemeManager: React.FC<CustomThemeManagerProps> = ({
  userId,
  className = '',
  onClose,
  onThemeUpdated,
}) => {
  const [themes, setThemes] = useState<CustomSoundTheme[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<CustomSoundTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showCreator, setShowCreator] = useState(false);
  const [editingTheme, setEditingTheme] = useState<CustomSoundTheme | null>(null);
  const [previewTheme, setPreviewTheme] = useState<CustomSoundTheme | null>(null);
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [showCommunityThemes, setShowCommunityThemes] = useState(false);
  const [communityThemes, setCommunityThemes] = useState<CustomSoundTheme[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

  useEffect(() => {
    if (userId) {
      loadThemes();
    } else {
      loadCommunityThemes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto: manual review required; refs: loadThemes
  }, [userId, showCommunityThemes]);

  useEffect(() => {
    filterAndSortThemes();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto: manual review required; refs: filterAndSortThemes
  }, [themes, searchQuery, filterCategory, sortBy]);

  const loadThemes = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const userThemes = soundEffectsService.getCustomThemesByUser(userId);
      setThemes(userThemes);
    } catch (_error) {
      console._error('Error loading themes:', _error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommunityThemes = async () => {
    setIsLoadingCommunity(true);
    try {
      // Fetch public/shared themes from community
      const publicThemes = await soundEffectsService.getCommunityThemes();
      setCommunityThemes(publicThemes);
      setThemes(publicThemes);
    } catch (_error) {
      console._error('Error loading community themes:', _error);
    } finally {
      setIsLoadingCommunity(false);
    }
  };

  const filterAndSortThemes = () => {
    let filtered = themes;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        theme =>
          theme.name.toLowerCase().includes(query) ||
          theme.description.toLowerCase().includes(query) ||
          theme.tags.some((tag: unknown) => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((theme: unknown) => theme.category === filterCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        default:
          return 0;
      }
    });

    setFilteredThemes(filtered);
  };

  const handleThemeCreated = (theme: CustomSoundTheme) => {
    setThemes((prev: unknown) => [theme, ...prev]);
    setShowCreator(false);
  };

  const handleThemeUpdated = (theme: CustomSoundTheme) => {
    setThemes((prev: unknown) =>
      prev.map((t: unknown) => (t.id === theme.id ? theme : t))
    );
    setEditingTheme(null);
  };

  const handleDeleteTheme = async (themeId: string) => {
    try {
      const success = await soundEffectsService.deleteCustomTheme(themeId, userId);
      if (success) {
        setThemes((prev: unknown) => prev.filter((t: unknown) => t.id !== themeId));
      }
    } catch (_error) {
      console._error('Error deleting theme:', _error);
    }
  };

  const handleDuplicateTheme = async (theme: CustomSoundTheme) => {
    const duplicatedTheme: CustomSoundTheme = {
      ...theme,
      id: `custom_${Date.now()}`,
      name: `${theme.name} (Copy)`,
      displayName: `${theme.displayName} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      downloads: 0,
      rating: 0,
    };

    const success = await soundEffectsService.saveCustomTheme(duplicatedTheme);
    if (success) {
      setThemes((prev: unknown) => [duplicatedTheme, ...prev]);
    }
  };

  const handleSetActiveTheme = async (theme: CustomSoundTheme) => {
    try {
      await soundEffectsService.setSoundTheme(theme.id);
    } catch (_error) {
      console._error('Error setting active theme:', _error);
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryIcon = (category: CustomSoundThemeCategory) => {
    const icons = {
      ambient: Music,
      musical: Music,
      nature: Music,
      electronic: Music,
      voice: User,
      experimental: Settings,
      seasonal: Calendar,
      gaming: Play,
      professional: User,
      relaxation: Music,
      energizing: Music,
      custom: Palette,
    };
    return icons[category] || Music;
  };

  // Import/Export Functions
  const handleExportTheme = async (theme: CustomSoundTheme) => {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        theme: {
          ...theme,
          id: undefined, // Remove ID for import compatibility
          createdBy: undefined, // Remove user-specific data
          downloads: undefined,
          rating: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        },
      };

      const fileName = `${theme.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_theme.json`;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`Theme "${theme.name}" exported successfully`);
    } catch (_error) {
      console._error('Error exporting theme:', _error);
    }
  };

  const handleExportMultipleThemes = async (themeIds: string[]) => {
    try {
      const themesToExport = themes.filter((theme: unknown) =>
        themeIds.includes(theme.id)
      );
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        themes: themesToExport.map((theme: unknown) => ({
          ...theme,
          id: undefined,
          createdBy: undefined,
          downloads: undefined,
          rating: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        })),
      };

      const fileName = `custom_themes_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`${themesToExport.length} themes exported successfully`);
      setSelectedThemes(new Set()); // Clear selection
    } catch (_error) {
      console._error('Error exporting themes:', _error);
    }
  };

  const handleImportTheme = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async event => {
      const file = (_event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        // Validate import data
        if (!importData.version || (!importData.theme && !importData.themes)) {
          throw new Error('Invalid theme file format');
        }

        const themesToImport = importData.themes || [importData.theme];
        const importedThemes: CustomSoundTheme[] = [];

        for (const themeData of themesToImport) {
          // Validate theme structure
          if (!themeData.name || !themeData.sounds) {
            console.warn('Skipping invalid theme:', themeData);
            continue;
          }

          // Check if theme with same name exists
          const existingTheme = themes.find((t: unknown) => t.name === themeData.name);
          let finalName = themeData.name;
          if (existingTheme) {
            finalName = `${themeData.name} (Imported)`;
          }

          const newTheme: CustomSoundTheme = {
            ...themeData,
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: finalName,
            displayName: themeData.displayName || finalName,
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            downloads: 0,
            rating: 0,
            tags: themeData.tags || [],
            category: themeData.category || 'custom',
            description: themeData.description || '',
          };

          const success = await soundEffectsService.saveCustomTheme(newTheme);
          if (success) {
            importedThemes.push(newTheme);
          }
        }

        if (importedThemes.length > 0) {
          setThemes((prev: unknown) => [...importedThemes, ...prev]);
          console.log(`Successfully imported ${importedThemes.length} theme(s)`);
        } else {
          console.warn('No valid themes found in import file');
        }
      } catch (_error) {
        console._error('Error importing theme:', _error);
        alert('Failed to import theme. Please check the file format.');
      }
    };

    input.click();
  };

  const handleBulkExport = () => {
    if (selectedThemes.size === 0) {
      alert('Please select themes to export');
      return;
    }
    handleExportMultipleThemes(Array.from(selectedThemes));
  };

  const toggleThemeSelection = (themeId: string) => {
    setSelectedThemes((prev: unknown) => {
      const newSelection = new Set(prev);
      if (newSelection.has(themeId)) {
        newSelection.delete(themeId);
      } else {
        newSelection.add(themeId);
      }
      return newSelection;
    });
  };

  const selectAllThemes = () => {
    setSelectedThemes(new Set(filteredThemes.map((t: unknown) => t.id)));
  };

  const clearSelection = () => {
    setSelectedThemes(new Set());
  };

  const handleShareTheme = async (theme: CustomSoundTheme) => {
    try {
      const updatedTheme = {
        ...theme,
        isPublic: true,
        isShared: true,
        permissions: {
          ...theme.permissions,
          canView: 'public' as const,
          canDownload: 'registered' as const,
          canRate: 'registered' as const,
          canComment: 'registered' as const,
        },
      };

      const success = await soundEffectsService.shareThemeWithCommunity(updatedTheme);
      if (success) {
        setThemes((prev: unknown) =>
          prev.map((t: unknown) => (t.id === theme.id ? updatedTheme : t))
        );
        if (onThemeUpdated) {
          onThemeUpdated(updatedTheme);
        }
        console.log(`Theme "${theme.name}" shared with community`);
      }
    } catch (_error) {
      console._error('Error sharing theme:', _error);
    }
  };

  const handleRateTheme = async (themeId: string, rating: number) => {
    if (!userId) return;

    try {
      const success = await soundEffectsService.rateTheme(themeId, userId, rating);
      if (success) {
        // Update local theme rating
        setThemes((prev: unknown) =>
          prev.map((theme: unknown) => {
            if (theme.id === themeId) {
              return {
                ...theme,
                rating: rating, // In real implementation, this would be the updated average
              };
            }
            return theme;
          })
        );
      }
    } catch (_error) {
      console._error('Error rating theme:', _error);
    }
  };

  const handleInstallCommunityTheme = async (theme: CustomSoundTheme) => {
    if (!userId) return;

    try {
      const installedTheme: CustomSoundTheme = {
        ...theme,
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false,
        isShared: false,
        downloads: theme.downloads + 1,
      };

      const success = await soundEffectsService.saveCustomTheme(installedTheme);
      if (success) {
        console.log(`Theme "${theme.name}" installed successfully`);
        // Update download count
        await soundEffectsService.incrementThemeDownloads(theme.id);
      }
    } catch (_error) {
      console._error('Error installing theme:', _error);
    }
  };

  const renderThemeCard = (theme: CustomSoundTheme) => {
    const CategoryIcon = getCategoryIcon(theme.category);

    return (
      <Card
        key={theme.id}
        className={`group hover:shadow-lg transition-shadow ${
          selectedThemes.has(theme.id) ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={selectedThemes.has(theme.id)}
            onChange={() => toggleThemeSelection(theme.id)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CategoryIcon className="w-5 h-5 text-blue-500" />
              <div>
                <CardTitle className="text-base line-clamp-1">
                  {theme.displayName || theme.name}
                </CardTitle>
                <p className="text-sm text-gray-600 capitalize">{theme.category}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPreviewTheme(theme)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingTheme(theme)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicateTheme(theme)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetActiveTheme(theme)}>
                  <Play className="w-4 h-4 mr-2" />
                  Use Theme
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportTheme(theme)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuItem>
                {userId && theme.createdBy === userId && !theme.isShared && (
                  <DropdownMenuItem onClick={() => handleShareTheme(theme)}>
                    <Share className="w-4 h-4 mr-2" />
                    Share with Community
                  </DropdownMenuItem>
                )}
                {!userId && (
                  <DropdownMenuItem onClick={() => handleInstallCommunityTheme(theme)}>
                    <Download className="w-4 h-4 mr-2" />
                    Install Theme
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDeleteTheme(theme.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {theme.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{theme.description}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {theme.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {theme.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{theme.tags.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {theme.rating.toFixed(1)}
                  {!userId && (
                    <div className="flex ml-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => handleRateTheme(theme.id, star)}
                          className={`w-3 h-3 ${star <= theme.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {theme.downloads}
                </span>
                {theme.isShared && (
                  <Badge variant="secondary" className="text-xs">
                    Shared
                  </Badge>
                )}
              </div>
              <span>Updated {formatDate(theme.updatedAt)}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setPreviewTheme(theme)}
              >
                <Play className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() =>
                  userId
                    ? handleSetActiveTheme(theme)
                    : handleInstallCommunityTheme(theme)
                }
              >
                userId ? 'Use Theme' : 'Install'
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderThemeListItem = (theme: CustomSoundTheme) => {
    const CategoryIcon = getCategoryIcon(theme.category);

    return (
      <div
        key={theme.id}
        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
      >
        <CategoryIcon className="w-8 h-8 text-blue-500" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{theme.displayName || theme.name}</h3>
            <Badge variant="secondary" className="text-xs capitalize">
              {theme.category}
            </Badge>
          </div>
          {theme.description && (
            <p className="text-sm text-gray-600 truncate">{theme.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Updated {formatDate(theme.updatedAt)}</span>
            <span>{theme.rating.toFixed(1)} ★</span>
            <span>{theme.downloads} downloads</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPreviewTheme(theme)}>
            <Play className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => handleSetActiveTheme(theme)}>
            Use
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingTheme(theme)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicateTheme(theme)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteTheme(theme.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  if (showCreator) {
    return (
      <CustomSoundThemeCreator
        userId={userId}
        onThemeCreated={handleThemeCreated}
        onCancel={() => setShowCreator(false)}
        className={className}
      />
    );
  }

  if (editingTheme) {
    return (
      <CustomSoundThemeCreator
        userId={userId}
        existingTheme={editingTheme}
        onThemeCreated={handleThemeUpdated}
        onCancel={() => setEditingTheme(null)}
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-6 h-6" />
            {userId ? 'My Sound Themes' : 'Community Sound Themes'}
          </h1>
          <p className="text-gray-600">
            {userId
              ? 'Create, manage, and organize your personal sound themes'
              : 'Discover and install sound themes created by the community'}
          </p>
        </div>

        <div className="flex gap-2">
          {userId ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowCommunityThemes(!showCommunityThemes)}
              >
                <Users className="w-4 h-4 mr-2" />
                {showCommunityThemes ? 'My Themes' : 'Community'}
              </Button>
              <Button variant="outline" onClick={handleImportTheme}>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button onClick={() => setShowCreator(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Theme
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search themes..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="pl-10"
              />
            </div>

            {/* Selection Controls */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={selectAllThemes}>
                Select All ({filteredThemes.length})
              </Button>
              {selectedThemes.size > 0 && (
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Clear Selection
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select
                value={filterCategory}
                onValueChange={(value: FilterCategory) => setFilterCategory(value)}
              >
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="ambient">Ambient</SelectItem>
                  <SelectItem value="musical">Musical</SelectItem>
                  <SelectItem value="nature">Nature</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="voice">Voice</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="relaxation">Relaxation</SelectItem>
                  <SelectItem value="energizing">Energizing</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value: SortOption) => setSortBy(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Recent</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="downloads">Downloads</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedThemes.size > 0 && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <span className="text-sm text-blue-700 font-medium">
                  {selectedThemes.size} theme{selectedThemes.size > 1 ? 's' : ''}{' '}
                  selected
                </span>
                <Button size="sm" variant="outline" onClick={handleBulkExport}>
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
                <Button size="sm" variant="outline" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Themes List */}
      {isLoading ? (
        <div className="text-center py-12">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Loading your themes...</p>
        </div>
      ) : filteredThemes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
            {searchQuery || filterCategory !== 'all' ? (
              <>
                <h3 className="text-lg font-medium mb-2">No matching themes</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filters
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">No themes yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first custom sound theme to get started
                </p>
                <Button onClick={() => setShowCreator(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Theme
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }
        >
          {filteredThemes.map((theme: unknown) =>
            viewMode === 'grid' ? renderThemeCard(theme) : renderThemeListItem(theme)
          )}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTheme} onOpenChange={() => setPreviewTheme(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preview Theme: {previewTheme?.name}</DialogTitle>
          </DialogHeader>
          {previewTheme && (
            <ScrollArea className="h-96">
              <SoundPreviewSystem theme={previewTheme} />
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomThemeManager;
