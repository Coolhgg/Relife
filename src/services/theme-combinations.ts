/**
 * Theme Combinations Service
 * Manages preset combinations of visual, audio, and voice themes
 * Provides curated experiences and allows custom combinations
 */

import { VisualAlarmThemeId } from './visual-alarm-themes';
import { SoundTheme } from './sound-effects';
import { VoiceMood } from '../types';

export interface ThemeCombination {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  tags: string[];

  // Theme components
  visual: VisualAlarmThemeId;
  sound: SoundTheme;
  voice: VoiceMood;

  // Metadata
  premium: boolean;
  popularity: number; // 0-100
  difficulty: AlarmIntensity;
  mood: ThemeMood;
  timeOfDay: TimeOfDay[];
  weatherSuitability: WeatherCondition[];

  // User interaction
  rating?: number; // 1-5 stars
  userTags?: string[];
  customizations?: ThemeCustomizations;

  // Analytics
  usageCount?: number;
  lastUsed?: Date;
  effectiveness?: number; // User-reported effectiveness 0-100
}

export type ThemeCategory =
  | 'gentle'
  | 'energetic'
  | 'nature'
  | 'electronic'
  | 'fantasy'
  | 'horror'
  | 'workout'
  | 'meditation'
  | 'cosmic'
  | 'minimal'
  | 'cinematic'
  | 'anime'
  | 'retro'
  | 'classical'
  | 'ambient';

export type AlarmIntensity = 'gentle' | 'moderate' | 'intense' | 'extreme';
export type ThemeMood =
  | 'peaceful'
  | 'energizing'
  | 'dramatic'
  | 'mystical'
  | 'scary'
  | 'motivational'
  | 'romantic'
  | 'nostalgic';
export type TimeOfDay =
  | 'early-morning'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'late-night';
export type WeatherCondition =
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'snowy'
  | 'foggy'
  | 'windy';

export interface ThemeCustomizations {
  visualIntensity?: number; // 0-100
  soundVolume?: number; // 0-100
  voiceFrequency?: number; // 0-100
  colorAdjustments?: {
    hue?: number;
    saturation?: number;
    brightness?: number;
  };
  animationSpeed?: number; // 0.1-3.0
  effectsEnabled?: {
    particles?: boolean;
    blur?: boolean;
    glow?: boolean;
    shake?: boolean;
  };
}

export interface ThemeCollection {
  id: string;
  name: string;
  description: string;
  themes: string[]; // ThemeCombination IDs
  premium: boolean;
  creator: 'system' | 'community' | 'user';
  tags: string[];
}

class ThemeCombinationsService {
  private static instance: ThemeCombinationsService | null = null;
  private combinations: Map<string, ThemeCombination> = new Map();
  private collections: Map<string, ThemeCollection> = new Map();
  private userFavorites: Set<string> = new Set();
  private userCustomCombinations: Map<string, ThemeCombination> = new Map();

  private constructor() {
    this.initializeCombinations();
    this.initializeCollections();
    this.loadUserData();
  }

  static getInstance(): ThemeCombinationsService {
    if (!ThemeCombinationsService.instance) {
      ThemeCombinationsService.instance = new ThemeCombinationsService();
    }
    return ThemeCombinationsService.instance;
  }

  private initializeCombinations(): void {
    const combinations: ThemeCombination[] = [
      // Gentle Combinations
      {
        id: 'peaceful_sunrise',
        name: 'Peaceful Sunrise',
        description:
          'Wake up gently with warm sunrise colors, peaceful nature sounds, and a sweet voice',
        category: 'gentle',
        tags: ['morning', 'peaceful', 'nature', 'warm'],
        visual: 'sunrise_glow',
        sound: 'nature',
        voice: 'sweet-angel',
        premium: false,
        popularity: 95,
        difficulty: 'gentle',
        mood: 'peaceful',
        timeOfDay: ['early-morning', 'morning'],
        weatherSuitability: ['sunny', 'cloudy'],
      },

      {
        id: 'forest_meditation',
        name: 'Forest Meditation',
        description:
          'Immerse yourself in a tranquil forest with gentle sounds and mindful voice guidance',
        category: 'meditation',
        tags: ['forest', 'meditation', 'calm', 'mindful'],
        visual: 'forest_canopy',
        sound: 'meditation',
        voice: 'gentle',
        premium: false,
        popularity: 88,
        difficulty: 'gentle',
        mood: 'peaceful',
        timeOfDay: ['morning', 'evening'],
        weatherSuitability: ['cloudy', 'rainy'],
      },

      {
        id: 'misty_morning',
        name: 'Misty Morning',
        description:
          'Ethereal mist and ambient sounds create a dreamy wake-up experience',
        category: 'ambient',
        tags: ['mist', 'ethereal', 'ambient', 'dreamy'],
        visual: 'morning_mist',
        sound: 'ambient',
        voice: 'gentle',
        premium: false,
        popularity: 82,
        difficulty: 'gentle',
        mood: 'mystical',
        timeOfDay: ['early-morning', 'morning'],
        weatherSuitability: ['foggy', 'cloudy'],
      },

      // Energetic Combinations
      {
        id: 'lightning_power',
        name: 'Lightning Power',
        description:
          'Electric energy with lightning visuals, electronic beats, and motivational voice',
        category: 'energetic',
        tags: ['electric', 'power', 'energy', 'motivation'],
        visual: 'lightning_bolt',
        sound: 'electronic',
        voice: 'motivational',
        premium: false,
        popularity: 91,
        difficulty: 'intense',
        mood: 'energizing',
        timeOfDay: ['morning', 'midday'],
        weatherSuitability: ['stormy', 'cloudy'],
      },

      {
        id: 'neon_city',
        name: 'Neon City',
        description:
          'Cyberpunk cityscape with pulsing neon lights and synthetic sounds',
        category: 'electronic',
        tags: ['cyberpunk', 'neon', 'city', 'futuristic'],
        visual: 'neon_pulse',
        sound: 'cyberpunk',
        voice: 'ai-robot',
        premium: true,
        popularity: 78,
        difficulty: 'intense',
        mood: 'dramatic',
        timeOfDay: ['night', 'late-night'],
        weatherSuitability: ['rainy', 'cloudy'],
      },

      {
        id: 'workout_beast',
        name: 'Workout Beast',
        description:
          'High-intensity workout motivation with powerful visuals and pumping beats',
        category: 'workout',
        tags: ['workout', 'gym', 'intense', 'motivation'],
        visual: 'lightning_bolt',
        sound: 'workout',
        voice: 'drill-sergeant',
        premium: false,
        popularity: 87,
        difficulty: 'extreme',
        mood: 'motivational',
        timeOfDay: ['early-morning', 'morning'],
        weatherSuitability: ['sunny', 'cloudy'],
      },

      // Fantasy & Mystical Combinations
      {
        id: 'cosmic_journey',
        name: 'Cosmic Journey',
        description:
          'Travel through the galaxy with cosmic visuals and ethereal sounds',
        category: 'cosmic',
        tags: ['space', 'galaxy', 'cosmic', 'journey'],
        visual: 'galaxy_spiral',
        sound: 'ambient',
        voice: 'gentle',
        premium: false,
        popularity: 85,
        difficulty: 'moderate',
        mood: 'mystical',
        timeOfDay: ['evening', 'night'],
        weatherSuitability: ['cloudy', 'stormy'],
      },

      {
        id: 'magic_portal',
        name: 'Magic Portal',
        description:
          'Step through a magical portal with fantasy visuals and enchanting sounds',
        category: 'fantasy',
        tags: ['magic', 'fantasy', 'portal', 'enchanted'],
        visual: 'galaxy_spiral', // Would use 'magic_portal' when available
        sound: 'fantasy',
        voice: 'gentle',
        premium: true,
        popularity: 73,
        difficulty: 'moderate',
        mood: 'mystical',
        timeOfDay: ['evening', 'night'],
        weatherSuitability: ['cloudy', 'foggy'],
      },

      // Horror & Intense Combinations
      {
        id: 'nightmare_fuel',
        name: 'Nightmare Fuel',
        description:
          'For the brave: dark, spooky visuals with horror sounds and commanding voice',
        category: 'horror',
        tags: ['horror', 'spooky', 'dark', 'intense'],
        visual: 'blood_moon',
        sound: 'horror',
        voice: 'demon-lord',
        premium: true,
        popularity: 45,
        difficulty: 'extreme',
        mood: 'scary',
        timeOfDay: ['late-night', 'night'],
        weatherSuitability: ['stormy', 'cloudy'],
      },

      {
        id: 'haunted_awakening',
        name: 'Haunted Awakening',
        description:
          'Ghostly mist and eerie sounds for those who dare to wake up scared',
        category: 'horror',
        tags: ['haunted', 'ghostly', 'eerie', 'mist'],
        visual: 'morning_mist', // Would use 'ghostly_mist' when available
        sound: 'horror',
        voice: 'demon-lord',
        premium: true,
        popularity: 38,
        difficulty: 'extreme',
        mood: 'scary',
        timeOfDay: ['night', 'late-night'],
        weatherSuitability: ['foggy', 'rainy'],
      },

      // Anime & Pop Culture Combinations
      {
        id: 'anime_hero_rise',
        name: 'Anime Hero Rise',
        description: 'Dramatic anime-style power-up sequence with electronic music',
        category: 'anime',
        tags: ['anime', 'hero', 'power-up', 'dramatic'],
        visual: 'neon_pulse',
        sound: 'electronic',
        voice: 'anime-hero',
        premium: false,
        popularity: 80,
        difficulty: 'intense',
        mood: 'dramatic',
        timeOfDay: ['morning', 'midday'],
        weatherSuitability: ['sunny', 'stormy'],
      },

      {
        id: 'retro_arcade',
        name: 'Retro Arcade',
        description: '8-bit nostalgia with retro visuals and classic gaming sounds',
        category: 'retro',
        tags: ['retro', '8-bit', 'arcade', 'gaming'],
        visual: 'clean_white', // Would use 'retro_arcade' when available
        sound: 'retro',
        voice: 'ai-robot',
        premium: false,
        popularity: 67,
        difficulty: 'moderate',
        mood: 'nostalgic',
        timeOfDay: ['afternoon', 'evening'],
        weatherSuitability: ['cloudy', 'rainy'],
      },

      // Classical & Elegant Combinations
      {
        id: 'classical_dawn',
        name: 'Classical Dawn',
        description:
          'Elegant classical music with refined visuals for a sophisticated wake-up',
        category: 'classical',
        tags: ['classical', 'elegant', 'sophisticated', 'refined'],
        visual: 'sunrise_glow',
        sound: 'classical',
        voice: 'philosopher',
        premium: true,
        popularity: 71,
        difficulty: 'gentle',
        mood: 'peaceful',
        timeOfDay: ['morning', 'midday'],
        weatherSuitability: ['sunny', 'cloudy'],
      },

      {
        id: 'jazz_lounge',
        name: 'Jazz Lounge',
        description: 'Smooth jazz vibes with warm visuals for a relaxed morning',
        category: 'classical',
        tags: ['jazz', 'smooth', 'lounge', 'relaxed'],
        visual: 'sunrise_glow',
        sound: 'jazz',
        voice: 'comedian',
        premium: true,
        popularity: 69,
        difficulty: 'gentle',
        mood: 'peaceful',
        timeOfDay: ['morning', 'afternoon'],
        weatherSuitability: ['cloudy', 'rainy'],
      },

      // Minimal & Clean Combinations
      {
        id: 'pure_white',
        name: 'Pure White',
        description: 'Minimal, clean white design with subtle sounds for maximum focus',
        category: 'minimal',
        tags: ['minimal', 'clean', 'white', 'focus'],
        visual: 'clean_white',
        sound: 'minimal',
        voice: 'gentle',
        premium: false,
        popularity: 76,
        difficulty: 'gentle',
        mood: 'peaceful',
        timeOfDay: ['morning', 'midday'],
        weatherSuitability: ['sunny', 'cloudy'],
      },

      {
        id: 'void_meditation',
        name: 'Void Meditation',
        description: 'Dark void with minimal distractions for deep meditation wake-up',
        category: 'minimal',
        tags: ['void', 'dark', 'meditation', 'minimal'],
        visual: 'clean_white', // Would use 'dark_void' when available
        sound: 'meditation',
        voice: 'philosopher',
        premium: false,
        popularity: 64,
        difficulty: 'gentle',
        mood: 'peaceful',
        timeOfDay: ['early-morning', 'night'],
        weatherSuitability: ['cloudy', 'foggy'],
      },

      // Special Occasion Combinations
      {
        id: 'monday_motivation',
        name: 'Monday Motivation',
        description: 'Extra motivation boost specifically designed for Monday mornings',
        category: 'energetic',
        tags: ['monday', 'motivation', 'energy', 'boost'],
        visual: 'lightning_bolt',
        sound: 'energetic',
        voice: 'drill-sergeant',
        premium: false,
        popularity: 89,
        difficulty: 'intense',
        mood: 'motivational',
        timeOfDay: ['early-morning', 'morning'],
        weatherSuitability: ['sunny', 'cloudy'],
      },

      {
        id: 'friday_celebration',
        name: 'Friday Celebration',
        description: 'Celebrate the end of the work week with energetic party vibes',
        category: 'energetic',
        tags: ['friday', 'celebration', 'party', 'weekend'],
        visual: 'neon_pulse',
        sound: 'electronic',
        voice: 'comedian',
        premium: false,
        popularity: 83,
        difficulty: 'intense',
        mood: 'energizing',
        timeOfDay: ['morning', 'midday'],
        weatherSuitability: ['sunny', 'cloudy'],
      },

      {
        id: 'lazy_sunday',
        name: 'Lazy Sunday',
        description: 'Perfect for relaxed Sunday mornings with gentle nature vibes',
        category: 'gentle',
        tags: ['sunday', 'lazy', 'relaxed', 'nature'],
        visual: 'forest_canopy',
        sound: 'nature',
        voice: 'sweet-angel',
        premium: false,
        popularity: 90,
        difficulty: 'gentle',
        mood: 'peaceful',
        timeOfDay: ['morning', 'midday'],
        weatherSuitability: ['sunny', 'cloudy'],
      },
    ];

    // Add all combinations to the map
    combinations.forEach(combo => {
      this.combinations.set(combo.id, combo);
    });
  }

  private initializeCollections(): void {
    const collections: ThemeCollection[] = [
      {
        id: 'gentle_mornings',
        name: 'Gentle Mornings',
        description: 'Peaceful and calming wake-up experiences',
        themes: [
          'peaceful_sunrise',
          'forest_meditation',
          'misty_morning',
          'lazy_sunday',
        ],
        premium: false,
        creator: 'system',
        tags: ['gentle', 'peaceful', 'morning'],
      },

      {
        id: 'high_energy',
        name: 'High Energy',
        description: 'Powerful and energizing combinations for maximum motivation',
        themes: [
          'lightning_power',
          'workout_beast',
          'monday_motivation',
          'friday_celebration',
        ],
        premium: false,
        creator: 'system',
        tags: ['energy', 'motivation', 'intense'],
      },

      {
        id: 'mystical_realms',
        name: 'Mystical Realms',
        description: 'Journey through magical and cosmic dimensions',
        themes: ['cosmic_journey', 'magic_portal'],
        premium: true,
        creator: 'system',
        tags: ['mystical', 'fantasy', 'cosmic'],
      },

      {
        id: 'horror_collection',
        name: 'Horror Collection',
        description: 'For those who dare to wake up scared',
        themes: ['nightmare_fuel', 'haunted_awakening'],
        premium: true,
        creator: 'system',
        tags: ['horror', 'scary', 'intense'],
      },

      {
        id: 'pop_culture',
        name: 'Pop Culture',
        description: 'Anime, retro, and pop culture inspired themes',
        themes: ['anime_hero_rise', 'retro_arcade'],
        premium: false,
        creator: 'system',
        tags: ['anime', 'retro', 'culture'],
      },

      {
        id: 'elegant_classics',
        name: 'Elegant Classics',
        description: 'Sophisticated classical and jazz combinations',
        themes: ['classical_dawn', 'jazz_lounge'],
        premium: true,
        creator: 'system',
        tags: ['classical', 'elegant', 'sophisticated'],
      },

      {
        id: 'minimal_zen',
        name: 'Minimal Zen',
        description: 'Clean, minimal designs for focused mornings',
        themes: ['pure_white', 'void_meditation'],
        premium: false,
        creator: 'system',
        tags: ['minimal', 'zen', 'clean'],
      },
    ];

    collections.forEach(collection => {
      this.collections.set(collection.id, collection);
    });
  }

  // Public API Methods

  getCombination(id: string): ThemeCombination | undefined {
    return this.combinations.get(id) || this.userCustomCombinations.get(id);
  }

  getAllCombinations(): ThemeCombination[] {
    return [
      ...Array.from(this.combinations.values()),
      ...Array.from(this.userCustomCombinations.values()),
    ];
  }

  getCombinationsByCategory(category: ThemeCategory): ThemeCombination[] {
    return this.getAllCombinations().filter(combo => combo.category === category);
  }

  getCombinationsByTags(tags: string[]): ThemeCombination[] {
    return this.getAllCombinations().filter(combo =>
      tags.some(tag => combo.tags.includes(tag) || combo.userTags?.includes(tag))
    );
  }

  getCombinationsByTimeOfDay(timeOfDay: TimeOfDay): ThemeCombination[] {
    return this.getAllCombinations().filter(combo =>
      combo.timeOfDay.includes(timeOfDay)
    );
  }

  getCombinationsByWeather(weather: WeatherCondition): ThemeCombination[] {
    return this.getAllCombinations().filter(combo =>
      combo.weatherSuitability.includes(weather)
    );
  }

  getCombinationsByDifficulty(difficulty: AlarmIntensity): ThemeCombination[] {
    return this.getAllCombinations().filter(combo => combo.difficulty === difficulty);
  }

  getPopularCombinations(limit: number = 10): ThemeCombination[] {
    return this.getAllCombinations()
      .sort((a, b
) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  getRecentCombinations(limit: number = 5): ThemeCombination[] {
    return this.getAllCombinations()
      .filter(combo => combo.lastUsed)
      .sort((a, b
) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
      .slice(0, limit);
  }

  getFavoriteCombinations(): ThemeCombination[] {
    return this.getAllCombinations().filter(combo => this.userFavorites.has(combo.id));
  }

  // Collection methods
  getCollection(id: string): ThemeCollection | undefined {
    return this.collections.get(id);
  }

  getAllCollections(): ThemeCollection[] {
    return Array.from(this.collections.values());
  }

  getCombinationsInCollection(collectionId: string): ThemeCombination[] {
    const collection = this.collections.get(collectionId);
    if (!collection) return [];

    return collection.themes
      .map(themeId => this.getCombination(themeId))
      .filter(theme => theme !== undefined) as ThemeCombination[];
  }

  // User interaction methods
  addToFavorites(combinationId: string): void {
    this.userFavorites.add(combinationId);
    this.saveUserData();
  }

  removeFromFavorites(combinationId: string): void {
    this.userFavorites.delete(combinationId);
    this.saveUserData();
  }

  isFavorite(combinationId: string): boolean {
    return this.userFavorites.has(combinationId);
  }

  rateCombination(combinationId: string, rating: number): void {
    const combination = this.getCombination(combinationId);
    if (combination && rating >= 1 && rating <= 5) {
      combination.rating = rating;
      this.saveUserData();
    }
  }

  recordUsage(combinationId: string, effectiveness?: number): void {
    const combination = this.getCombination(combinationId);
    if (combination) {
      combination.usageCount = (combination.usageCount || 0) + 1;
      combination.lastUsed = new Date();
      if (effectiveness !== undefined) {
        combination.effectiveness = effectiveness;
      }
      this.saveUserData();
    }
  }

  addUserTags(combinationId: string, tags: string[]): void {
    const combination = this.getCombination(combinationId);
    if (combination) {
      combination.userTags = [...(combination.userTags || []), ...tags];
      this.saveUserData();
    }
  }

  // Custom combination methods
  createCustomCombination(
    name: string,
    description: string,
    visual: VisualAlarmThemeId,
    sound: SoundTheme,
    voice: VoiceMood,
    options: Partial<ThemeCombination> = {}
  ): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const customCombination: ThemeCombination = {
      id,
      name,
      description,
      category: options.category || 'gentle',
      tags: options.tags || ['custom'],
      visual,
      sound,
      voice,
      premium: false,
      popularity: 50,
      difficulty: options.difficulty || 'moderate',
      mood: options.mood || 'peaceful',
      timeOfDay: options.timeOfDay || ['morning'],
      weatherSuitability: options.weatherSuitability || ['sunny', 'cloudy'],
      customizations: options.customizations,
      userTags: options.userTags,
      usageCount: 0,
      ...options,
    };

    this.userCustomCombinations.set(id, customCombination);
    this.saveUserData();

    return id;
  }

  updateCustomCombination(id: string, updates: Partial<ThemeCombination>): boolean {
    const combination = this.userCustomCombinations.get(id);
    if (!combination) return false;

    Object.assign(combination, updates);
    this.saveUserData();
    return true;
  }

  deleteCustomCombination(id: string): boolean {
    const deleted = this.userCustomCombinations.delete(id);
    if (deleted) {
      this.userFavorites.delete(id);
      this.saveUserData();
    }
    return deleted;
  }

  // Search and filtering
  searchCombinations(query: string): ThemeCombination[] {
    const searchTerm = query.toLowerCase();
    return this.getAllCombinations().filter(
      combo =>
        combo.name.toLowerCase().includes(searchTerm) ||
        combo.description.toLowerCase().includes(searchTerm) ||
        combo.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        combo.userTags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  getFilteredCombinations(filters: {
    category?: ThemeCategory;
    difficulty?: AlarmIntensity;
    mood?: ThemeMood;
    premium?: boolean;
    timeOfDay?: TimeOfDay;
    weather?: WeatherCondition;
    tags?: string[];
  }): ThemeCombination[] {
    return this.getAllCombinations().filter(combo => {
      if (filters.category && combo.category !== filters.category) return false;
      if (filters.difficulty && combo.difficulty !== filters.difficulty) return false;
      if (filters.mood && combo.mood !== filters.mood) return false;
      if (filters.premium !== undefined && combo.premium !== filters.premium)
        return false;
      if (filters.timeOfDay && !combo.timeOfDay.includes(filters.timeOfDay))
        return false;
      if (filters.weather && !combo.weatherSuitability.includes(filters.weather))
        return false;
      if (filters.tags && !filters.tags.some(tag => combo.tags.includes(tag)))
        return false;

      return true;
    });
  }

  // Data persistence
  private loadUserData(): void {
    try {
      const favoritesData = localStorage.getItem('theme-favorites');
      if (favoritesData) {
        this.userFavorites = new Set(JSON.parse(favoritesData));
      }

      const customCombosData = localStorage.getItem('custom-theme-combinations');
      if (customCombosData) {
        const customCombos = JSON.parse(customCombosData);
        this.userCustomCombinations = new Map(Object.entries(customCombos));
      }
    } catch (error) {
      console.error('Failed to load user theme data:', error);
    }
  }

  private saveUserData(): void {
    try {
      localStorage.setItem(
        'theme-favorites',
        JSON.stringify(Array.from(this.userFavorites))
      );
      localStorage.setItem(
        'custom-theme-combinations',
        JSON.stringify(Object.fromEntries(this.userCustomCombinations))
      );
    } catch (error) {
      console.error('Failed to save user theme data:', error);
    }
  }

  // Analytics and recommendations
  getPersonalizedRecommendations(limit: number = 5): ThemeCombination[] {
    // Simple recommendation algorithm based on usage patterns
    const recentlyUsed = this.getRecentCombinations(10);
    const favorites = this.getFavoriteCombinations();

    // Find similar combinations to recently used and favorites
    const similarCombinations = new Set<ThemeCombination>();

    [...recentlyUsed, ...favorites].forEach(combo => {
      // Find combinations with similar tags, category, or mood
      this.getAllCombinations().forEach(candidate => {
        if (candidate.id === combo.id) return;

        const similarity = this.calculateSimilarity(combo, candidate);
        if (similarity > 0.3) {
          similarCombinations.add(candidate);
        }
      });
    });

    // Sort by popularity and return top results
    return Array.from(similarCombinations)
      .sort((a, b
) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  private calculateSimilarity(a: ThemeCombination, b: ThemeCombination): number {
    let similarity = 0;

    // Category similarity
    if (a.category === b.category) similarity += 0.3;

    // Mood similarity
    if (a.mood === b.mood) similarity += 0.2;

    // Tag overlap
    const commonTags = a.tags.filter(tag => b.tags.includes(tag));
    similarity += commonTags.length * 0.1;

    // Time of day overlap
    const commonTimeOfDay = a.timeOfDay.filter(time => b.timeOfDay.includes(time));
    similarity += commonTimeOfDay.length * 0.1;

    return Math.min(1, similarity);
  }

  // Export/Import functionality
  exportUserThemes(): string {
    return JSON.stringify({
      favorites: Array.from(this.userFavorites),
      customCombinations: Object.fromEntries(this.userCustomCombinations),
      version: '1.0',
    });
  }

  importUserThemes(data: string): boolean {
    try {
      const parsed = JSON.parse(data);

      if (parsed.favorites) {
        this.userFavorites = new Set(parsed.favorites);
      }

      if (parsed.customCombinations) {
        this.userCustomCombinations = new Map(
          Object.entries(parsed.customCombinations)
        );
      }

      this.saveUserData();
      return true;
    } catch (error) {
      console.error('Failed to import user themes:', error);
      return false;
    }
  }
}

// Export singleton instance
export const themeCombinations = ThemeCombinationsService.getInstance();
export default ThemeCombinationsService;
