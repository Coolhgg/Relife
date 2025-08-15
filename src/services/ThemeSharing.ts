import { Preferences } from '@capacitor/preferences';

export interface ThemeMetadata {
  id: string;
  name: string;
  description?: string;
  author: string;
  version: string;
  tags: string[];
  rating?: number;
  downloads?: number;
  createdAt: string;
  updatedAt: string;
  preview?: string; // Base64 encoded preview image
}

export interface SharedTheme extends ThemeMetadata {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  gradient: string;
  styles?: Record<string, any>;
  isCustom: boolean;
}

export interface ThemeCollection {
  id: string;
  name: string;
  description: string;
  themes: SharedTheme[];
  author: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

class ThemeSharingService {
  private static instance: ThemeSharingService;
  private readonly storageKeys = {
    customThemes: 'relife_custom_themes',
    collections: 'relife_theme_collections',
    sharedThemes: 'relife_shared_themes',
    favorites: 'relife_favorite_themes'
  };

  public static getInstance(): ThemeSharingService {
    if (!ThemeSharingService.instance) {
      ThemeSharingService.instance = new ThemeSharingService();
    }
    return ThemeSharingService.instance;
  }

  /**
   * Save a custom theme to local storage
   */
  async saveCustomTheme(theme: SharedTheme): Promise<void> {
    try {
      const existingThemes = await this.getCustomThemes();
      const updatedThemes = existingThemes.filter(t => t.id !== theme.id);
      updatedThemes.push({
        ...theme,
        updatedAt: new Date().toISOString()
      });

      await Preferences.set({
        key: this.storageKeys.customThemes,
        value: JSON.stringify(updatedThemes)
      });
    } catch (error) {
      console.error('Error saving custom theme:', error);
      throw new Error('Failed to save theme');
    }
  }

  /**
   * Get all custom themes
   */
  async getCustomThemes(): Promise<SharedTheme[]> {
    try {
      const { value } = await Preferences.get({ key: this.storageKeys.customThemes });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting custom themes:', error);
      return [];
    }
  }

  /**
   * Delete a custom theme
   */
  async deleteCustomTheme(themeId: string): Promise<void> {
    try {
      const themes = await this.getCustomThemes();
      const filteredThemes = themes.filter(theme => theme.id !== themeId);
      
      await Preferences.set({
        key: this.storageKeys.customThemes,
        value: JSON.stringify(filteredThemes)
      });
    } catch (error) {
      console.error('Error deleting custom theme:', error);
      throw new Error('Failed to delete theme');
    }
  }

  /**
   * Export themes to JSON
   */
  async exportThemes(themeIds?: string[]): Promise<string> {
    try {
      const allThemes = await this.getCustomThemes();
      const themesToExport = themeIds 
        ? allThemes.filter(theme => themeIds.includes(theme.id))
        : allThemes;

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'Relife Alarm',
        themes: themesToExport,
        metadata: {
          totalThemes: themesToExport.length,
          exportedBy: 'Relife User'
        }
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting themes:', error);
      throw new Error('Failed to export themes');
    }
  }

  /**
   * Import themes from JSON
   */
  async importThemes(jsonData: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
    try {
      const data = JSON.parse(jsonData);
      const existingThemes = await this.getCustomThemes();
      const errors: string[] = [];
      let imported = 0;
      let skipped = 0;

      // Validate import data structure
      if (!data.themes || !Array.isArray(data.themes)) {
        throw new Error('Invalid theme file format');
      }

      for (const theme of data.themes) {
        try {
          // Validate theme structure
          if (!this.validateThemeStructure(theme)) {
            errors.push(`Invalid theme structure: ${theme.name || 'Unknown'}`);
            continue;
          }

          // Check if theme already exists
          const existingTheme = existingThemes.find(t => t.id === theme.id);
          if (existingTheme) {
            // Update existing theme if imported version is newer
            if (new Date(theme.updatedAt || theme.createdAt) > new Date(existingTheme.updatedAt)) {
              await this.saveCustomTheme(theme);
              imported++;
            } else {
              skipped++;
            }
          } else {
            // Add new theme
            await this.saveCustomTheme({
              ...theme,
              id: theme.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdAt: theme.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            imported++;
          }
        } catch (error) {
          errors.push(`Error importing theme ${theme.name}: ${error}`);
        }
      }

      return { imported, skipped, errors };
    } catch (error) {
      console.error('Error importing themes:', error);
      throw new Error('Failed to import themes');
    }
  }

  /**
   * Create a theme collection
   */
  async createCollection(collection: Omit<ThemeCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const newCollection: ThemeCollection = {
        ...collection,
        id: `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const collections = await this.getCollections();
      collections.push(newCollection);

      await Preferences.set({
        key: this.storageKeys.collections,
        value: JSON.stringify(collections)
      });

      return newCollection.id;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw new Error('Failed to create collection');
    }
  }

  /**
   * Get all collections
   */
  async getCollections(): Promise<ThemeCollection[]> {
    try {
      const { value } = await Preferences.get({ key: this.storageKeys.collections });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting collections:', error);
      return [];
    }
  }

  /**
   * Add theme to favorites
   */
  async addToFavorites(themeId: string): Promise<void> {
    try {
      const favorites = await this.getFavoriteThemes();
      if (!favorites.includes(themeId)) {
        favorites.push(themeId);
        await Preferences.set({
          key: this.storageKeys.favorites,
          value: JSON.stringify(favorites)
        });
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw new Error('Failed to add to favorites');
    }
  }

  /**
   * Remove theme from favorites
   */
  async removeFromFavorites(themeId: string): Promise<void> {
    try {
      const favorites = await this.getFavoriteThemes();
      const updatedFavorites = favorites.filter(id => id !== themeId);
      
      await Preferences.set({
        key: this.storageKeys.favorites,
        value: JSON.stringify(updatedFavorites)
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw new Error('Failed to remove from favorites');
    }
  }

  /**
   * Get favorite themes
   */
  async getFavoriteThemes(): Promise<string[]> {
    try {
      const { value } = await Preferences.get({ key: this.storageKeys.favorites });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  /**
   * Generate theme preview (base64 encoded)
   */
  generateThemePreview(theme: SharedTheme): string {
    // Create a simple canvas-based preview
    if (typeof window !== 'undefined' && window.document) {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, theme.colors.primary);
        gradient.addColorStop(0.5, theme.colors.secondary);
        gradient.addColorStop(1, theme.colors.accent);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add theme name
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(theme.name, canvas.width / 2, canvas.height / 2);
        
        return canvas.toDataURL('image/png');
      }
    }
    
    return '';
  }

  /**
   * Validate theme structure
   */
  private validateThemeStructure(theme: any): theme is SharedTheme {
    return (
      theme &&
      typeof theme.name === 'string' &&
      theme.colors &&
      typeof theme.colors.primary === 'string' &&
      typeof theme.colors.secondary === 'string' &&
      typeof theme.colors.accent === 'string' &&
      typeof theme.gradient === 'string'
    );
  }

  /**
   * Search themes
   */
  async searchThemes(query: string, tags?: string[]): Promise<SharedTheme[]> {
    try {
      const allThemes = await this.getCustomThemes();
      const searchTerm = query.toLowerCase();
      
      return allThemes.filter(theme => {
        const matchesQuery = !query || 
          theme.name.toLowerCase().includes(searchTerm) ||
          theme.description?.toLowerCase().includes(searchTerm) ||
          theme.author.toLowerCase().includes(searchTerm);
          
        const matchesTags = !tags || tags.length === 0 ||
          tags.some(tag => theme.tags?.includes(tag));
          
        return matchesQuery && matchesTags;
      });
    } catch (error) {
      console.error('Error searching themes:', error);
      return [];
    }
  }

  /**
   * Get theme statistics
   */
  async getThemeStats(): Promise<{
    totalCustomThemes: number;
    totalCollections: number;
    totalFavorites: number;
    mostUsedColors: { color: string; count: number }[];
  }> {
    try {
      const [customThemes, collections, favorites] = await Promise.all([
        this.getCustomThemes(),
        this.getCollections(),
        this.getFavoriteThemes()
      ]);

      // Count color usage
      const colorCounts: Record<string, number> = {};
      customThemes.forEach(theme => {
        [theme.colors.primary, theme.colors.secondary, theme.colors.accent].forEach(color => {
          colorCounts[color] = (colorCounts[color] || 0) + 1;
        });
      });

      const mostUsedColors = Object.entries(colorCounts)
        .map(([color, count]) => ({ color, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalCustomThemes: customThemes.length,
        totalCollections: collections.length,
        totalFavorites: favorites.length,
        mostUsedColors
      };
    } catch (error) {
      console.error('Error getting theme stats:', error);
      return {
        totalCustomThemes: 0,
        totalCollections: 0,
        totalFavorites: 0,
        mostUsedColors: []
      };
    }
  }
}

export default ThemeSharingService;