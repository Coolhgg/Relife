import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Crown,
  Sparkles,
  Lock,
  Check,
  Star,
  Zap,
  Download,
  Heart,
  Wand2,
} from 'lucide-react';
import { PremiumGate } from './PremiumGate';
import { SubscriptionService } from '../services/subscription';
import type { ThemeConfig } from '../types';

interface PremiumThemeSettingsProps {
  userId: string;
  currentTheme: ThemeConfig;
  onThemeChange: (theme: ThemeConfig) => void;
  className?: string;
}

interface ThemeState {
  availableThemes: ThemeConfig[];
  premiumThemes: ThemeConfig[];
  selectedTheme: ThemeConfig;
  hasAccess: boolean;
  loading: boolean;
}

// Sample premium themes data
const PREMIUM_THEMES: ThemeConfig[] = [
  {
    id: 'neon-cyberpunk',
    name: 'Neon Cyberpunk',
    displayName: 'Neon Cyberpunk',
    isPremium: true,
    category: 'dark',
    preview: '/themes/neon-cyberpunk-preview.jpg',
    colors: {
      primary: '#00f5ff',
      secondary: '#ff0080',
      accent: '#ffff00',
      background: '#0a0a0a',
      surface: '#1a1a2e',
      text: '#ffffff',
      textSecondary: '#cccccc',
    },
    description: 'Futuristic cyberpunk theme with electric neon accents',
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset Gradient',
    displayName: 'Sunset Gradient',
    isPremium: true,
    category: 'colorful',
    preview: '/themes/sunset-gradient-preview.jpg',
    colors: {
      primary: '#ff6b35',
      secondary: '#f7931e',
      accent: '#ffd23f',
      background: '#2c1810',
      surface: '#3d2518',
      text: '#ffffff',
      textSecondary: '#e6e6e6',
    },
    description: 'Warm sunset colors with beautiful gradient backgrounds',
  },
  {
    id: 'forest-zen',
    name: 'Forest Zen',
    displayName: 'Forest Zen',
    isPremium: true,
    category: 'nature',
    preview: '/themes/forest-zen-preview.jpg',
    colors: {
      primary: '#2d5016',
      secondary: '#3a6622',
      accent: '#7cb342',
      background: '#f1f8e9',
      surface: '#ffffff',
      text: '#1b5e20',
      textSecondary: '#4a7c59',
    },
    description: 'Peaceful forest-inspired theme for better sleep',
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    displayName: 'Deep Space',
    isPremium: true,
    category: 'cosmic',
    preview: '/themes/deep-space-preview.jpg',
    colors: {
      primary: '#5c6bc0',
      secondary: '#7986cb',
      accent: '#9c27b0',
      background: '#0d1117',
      surface: '#161b22',
      text: '#ffffff',
      textSecondary: '#b0bec5',
    },
    description: 'Cosmic theme inspired by deep space and nebulae',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    displayName: 'Golden Hour',
    isPremium: true,
    category: 'warm',
    preview: '/themes/golden-hour-preview.jpg',
    colors: {
      primary: '#ff8f00',
      secondary: '#ffa726',
      accent: '#ffd54f',
      background: '#fef7e0',
      surface: '#ffffff',
      text: '#e65100',
      textSecondary: '#ff8f00',
    },
    description: 'Warm golden tones perfect for morning routines',
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    displayName: 'Ocean Depths',
    isPremium: true,
    category: 'blue',
    preview: '/themes/ocean-depths-preview.jpg',
    colors: {
      primary: '#0277bd',
      secondary: '#0288d1',
      accent: '#00acc1',
      background: '#e3f2fd',
      surface: '#ffffff',
      text: '#01579b',
      textSecondary: '#0288d1',
    },
    description: 'Deep ocean blues for a calming experience',
  },
];

const FREE_THEMES: ThemeConfig[] = [
  {
    id: 'default-light',
    name: 'Light',
    displayName: 'Light',
    isPremium: false,
    category: 'light',
    colors: {
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
    },
    description: 'Clean and bright default light theme',
  },
  {
    id: 'default-dark',
    name: 'Dark',
    displayName: 'Dark',
    isPremium: false,
    category: 'dark',
    colors: {
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#f59e0b',
      background: '#111827',
      surface: '#1f2937',
      text: '#ffffff',
      textSecondary: '#d1d5db',
    },
    description: 'Sleek dark theme for night time use',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    displayName: 'Minimal',
    isPremium: false,
    category: 'minimal',
    colors: {
      primary: '#000000',
      secondary: '#333333',
      accent: '#666666',
      background: '#ffffff',
      surface: '#fafafa',
      text: '#000000',
      textSecondary: '#666666',
    },
    description: 'Minimalist black and white theme',
  },
];

export const PremiumThemeSettings: React.FC<PremiumThemeSettingsProps> = ({
  userId,
  currentTheme,
  onThemeChange,
  className = '',
}) => {
  const [state, setState] = useState<ThemeState>({
    availableThemes: FREE_THEMES,
    premiumThemes: PREMIUM_THEMES,
    selectedTheme: currentTheme,
    hasAccess: false,
    loading: true,
  });

  useEffect(() => {
    checkPremiumAccess();
  }, [userId]);

  const checkPremiumAccess = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const hasAccess = await SubscriptionService.hasFeatureAccess(
        userId,
        'premiumThemes'
      );
      setState(prev => ({
        ...prev,
        hasAccess,
        availableThemes: hasAccess ? [...FREE_THEMES, ...PREMIUM_THEMES] : FREE_THEMES,
        loading: false,
      }));
    } catch (error) {
      console.error('Error checking premium theme access:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleThemeSelect = (theme: ThemeConfig) => {
    if (theme.isPremium && !state.hasAccess) {
      return; // Premium gate will handle this
    }

    setState(prev => ({ ...prev, selectedTheme: theme }));
    onThemeChange(theme);
  };

  const renderThemeCard = (theme: ThemeConfig, index: number) => {
    const isSelected = state.selectedTheme.id === theme.id;
    const isPremium = theme.isPremium;
    const hasAccessToTheme = !isPremium || state.hasAccess;

    return (
      <motion.div
        key={theme.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`relative group cursor-pointer transition-all duration-300 ${
          isSelected ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-102'
        }`}
        onClick={() => handleThemeSelect(theme)}
      >
        <div
          className={`rounded-xl overflow-hidden border-2 ${
            isSelected ? 'border-blue-500' : 'border-gray-200'
          } ${!hasAccessToTheme ? 'opacity-75' : ''}`}
        >
          {/* Theme Preview */}
          <div
            className="h-24 relative"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.accent})`,
            }}
          >
            {/* Color swatches */}
            <div className="absolute bottom-2 left-2 flex space-x-1">
              <div
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: theme.colors.secondary }}
              />
              <div
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: theme.colors.accent }}
              />
            </div>

            {/* Premium badge */}
            {isPremium && (
              <div className="absolute top-2 right-2">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                  <Crown className="w-3 h-3" />
                  <span>Premium</span>
                </div>
              </div>
            )}

            {/* Lock overlay for inaccessible premium themes */}
            {isPremium && !state.hasAccess && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                <Lock className="w-6 h-6 text-white" />
              </div>
            )}

            {/* Selected indicator */}
            {isSelected && hasAccessToTheme && (
              <div className="absolute top-2 left-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Theme info */}
          <div className="p-3 bg-white">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900">{theme.displayName}</h4>
              {isPremium && state.hasAccess && (
                <Sparkles className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-gray-600">{theme.description}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderPremiumSection = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">Premium Themes</h3>
          </div>
          <div className="text-sm text-amber-600 font-medium">
            {state.premiumThemes.length} exclusive themes
          </div>
        </div>

        {state.hasAccess ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.premiumThemes.map((theme, index) =>
              renderThemeCard(theme, index + state.availableThemes.length)
            )}
          </div>
        ) : (
          <PremiumGate
            feature="premiumThemes"
            userId={userId}
            showPreview={true}
            title="Premium Themes Collection"
            description="Access exclusive, professionally designed themes to personalize your alarm experience"
            className="col-span-full"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50 pointer-events-none">
              {state.premiumThemes
                .slice(0, 6)
                .map((theme, index) => renderThemeCard(theme, index))}
            </div>
          </PremiumGate>
        )}
      </div>
    );
  };

  if (state.loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-24 bg-gray-200 rounded-xl"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Free Themes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Free Themes</h3>
          </div>
          <div className="text-sm text-gray-600">
            {FREE_THEMES.length} themes included
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FREE_THEMES.map((theme, index) => renderThemeCard(theme, index))}
        </div>
      </div>

      {/* Premium Themes Section */}
      {renderPremiumSection()}

      {/* Theme Customization Section */}
      {state.hasAccess && (
        <div className="space-y-4 border-t border-gray-200 pt-8">
          <div className="flex items-center space-x-2">
            <Wand2 className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Custom Theme Builder
            </h3>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Pro Feature
            </div>
          </div>

          <PremiumGate
            feature="unlimitedCustomization"
            userId={userId}
            title="Custom Theme Builder"
            description="Create your own unique themes with unlimited customization options"
            mode="overlay"
            showPreview={true}
          >
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Create Your Perfect Theme
                  </h4>
                  <p className="text-sm text-gray-600">
                    Mix colors, adjust typography, and create custom gradients
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium"
                >
                  Start Creating
                </motion.button>
              </div>
            </div>
          </PremiumGate>
        </div>
      )}
    </div>
  );
};
