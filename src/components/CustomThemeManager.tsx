import React, { useState, useEffect } from 'react';
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
  Music,
  Play,
  MoreHorizontal,
  Settings,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { CustomSoundThemeCreator } from './CustomSoundThemeCreator';
import { SoundPreviewSystem } from './SoundPreviewSystem';
import { soundEffectsService } from '../services/sound-effects';
import type { 
  CustomSoundTheme,
  CustomSoundThemeCategory,
  CustomSoundThemeLibrary 
} from '../types/custom-sound-themes';

interface CustomThemeManagerProps {
  userId: string;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'created' | 'updated' | 'rating' | 'downloads';
type FilterCategory = 'all' | CustomSoundThemeCategory;

export const CustomThemeManager: React.FC<CustomThemeManagerProps> = ({
  userId,
  className = ''
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

  useEffect(() => {
    loadThemes();
  }, [userId]);

  useEffect(() => {
    filterAndSortThemes();
  }, [themes, searchQuery, filterCategory, sortBy]);

  const loadThemes = async () => {
    setIsLoading(true);
    try {
      const userThemes = soundEffectsService.getCustomThemesByUser(userId);
      setThemes(userThemes);
    } catch (error) {
      console.error('Error loading themes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortThemes = () => {
    let filtered = themes;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(theme =>
        theme.name.toLowerCase().includes(query) ||
        theme.description.toLowerCase().includes(query) ||
        theme.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(theme => theme.category === filterCategory);
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
    setThemes(prev => [theme, ...prev]);
    setShowCreator(false);
  };

  const handleThemeUpdated = (theme: CustomSoundTheme) => {
    setThemes(prev => prev.map(t => t.id === theme.id ? theme : t));
    setEditingTheme(null);
  };

  const handleDeleteTheme = async (themeId: string) => {
    try {
      const success = await soundEffectsService.deleteCustomTheme(themeId, userId);
      if (success) {
        setThemes(prev => prev.filter(t => t.id !== themeId));
      }
    } catch (error) {
      console.error('Error deleting theme:', error);
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
      rating: 0
    };

    const success = await soundEffectsService.saveCustomTheme(duplicatedTheme);
    if (success) {
      setThemes(prev => [duplicatedTheme, ...prev]);
    }
  };

  const handleSetActiveTheme = async (theme: CustomSoundTheme) => {
    try {
      await soundEffectsService.setSoundTheme(theme.id);
    } catch (error) {
      console.error('Error setting active theme:', error);
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      custom: Palette
    };
    return icons[category] || Music;
  };

  const renderThemeCard = (theme: CustomSoundTheme) => {
    const CategoryIcon = getCategoryIcon(theme.category);
    
    return (
      <Card key={theme.id} className="group hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CategoryIcon className="w-5 h-5 text-blue-500" />
              <div>
                <CardTitle className="text-base line-clamp-1">{theme.displayName || theme.name}</CardTitle>
                <p className="text-sm text-gray-600 capitalize">{theme.category}</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {theme.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {theme.downloads}
                </span>
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
                onClick={() => handleSetActiveTheme(theme)}
              >
                Use Theme
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
      <div key={theme.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
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
            Custom Sound Themes
          </h1>
          <p className="text-gray-600">
            Create, manage, and organize your personal sound themes
          </p>
        </div>
        
        <Button onClick={() => setShowCreator(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Theme
        </Button>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select value={filterCategory} onValueChange={(value: FilterCategory) => setFilterCategory(value)}>
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

              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
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
                <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                }}>
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">No themes yet</h3>
                <p className="text-gray-600 mb-4">Create your first custom sound theme to get started</p>
                <Button onClick={() => setShowCreator(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Theme
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredThemes.map(theme => 
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