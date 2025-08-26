import React from 'react';
import { useState, useEffect } from 'react';
import {
  Palette,
  Type,
  Zap,
  Volume2,
  Layout,
  Eye,
  Sliders,
  ChevronDown,
  ChevronRight,
  Check,
  RefreshCw,
  Sparkles,
  Settings,
  Heart,
  Monitor,
  Headphones,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type {
  PersonalizationSettings as PersonalizationSettingsType,
  ColorPreferences,
  TypographyPreferences,
  MotionPreferences,
  SoundPreferences,
  LayoutPreferences,
  AccessibilityPreferences,
} from '../types';

interface PersonalizationSettingsProps {
  className?: string;
}

const PersonalizationSettings: React.FC<PersonalizationSettingsProps> = ({
  className = '',
}) => {
  const {
    personalization,
    updatePersonalization,
    updateColorPreference,
    updateTypographyPreference,
    updateMotionPreference,
    updateSoundPreference,
    updateLayoutPreference,
    updateAccessibilityPreference,
    resetTheme,
  } = useTheme();

  const [activeSection, setActiveSection] = useState<string | null>('colors');
  const [previewMode, setPreviewMode] = useState(false);

  // Sample colors for color picker
  const colorOptions = [
    { name: 'Blue', value: '#0ea5e9', category: 'cool' },
    { name: 'Purple', value: '#8b5cf6', category: 'cool' },
    { name: 'Green', value: '#22c55e', category: 'natural' },
    { name: 'Orange', value: '#f97316', category: 'warm' },
    { name: 'Pink', value: '#ec4899', category: 'warm' },
    { name: 'Teal', value: '#14b8a6', category: 'cool' },
    { name: 'Red', value: '#ef4444', category: 'warm' },
    { name: 'Indigo', value: '#6366f1', category: 'cool' },
  ];

  const fontOptions = [
    { name: 'Inter', value: 'Inter, system-ui, sans-serif', category: 'modern' },
    { name: 'Boto', value: 'Boto, system-ui, sans-serif', category: 'classic' },
    {
      name: 'Open Sans',
      value: 'Open Sans, system-ui, sans-serif',
      category: 'readable',
    },
    { name: 'Lato', value: 'Lato, system-ui, sans-serif', category: 'friendly' },
    {
      name: 'Montserrat',
      value: 'Montserrat, system-ui, sans-serif',
      category: 'stylish',
    },
    {
      name: 'Source Sans Pro',
      value: 'Source Sans Pro, system-ui, sans-serif',
      category: 'professional',
    },
    { name: 'Poppins', value: 'Poppins, system-ui, sans-serif', category: 'modern' },
    { name: 'System Default', value: 'system-ui, sans-serif', category: 'system' },
  ];

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleColorSelection = (colorValue: string, isFavorite: boolean) => {
    const currentFavorites = personalization?.colorPreferences?.favoriteColors || [];

    if (isFavorite) {
      if (!currentFavorites.includes(colorValue)) {
        updateColorPreference('favoriteColors', [...currentFavorites, colorValue]);
      }
    } else {
      const currentAvoid = personalization?.colorPreferences?.avoidColors || [];
      if (!currentAvoid.includes(colorValue)) {
        updateColorPreference('avoidColors', [...currentAvoid, colorValue]);
      }
    }
  };

  const removeColor = (colorValue: string, fromFavorites: boolean) => {
    if (fromFavorites) {
      const filtered = (personalization?.colorPreferences?.favoriteColors || []).filter(
        c => c !== colorValue
      );
      updateColorPreference('favoriteColors', filtered);
    } else {
      const filtered = (personalization?.colorPreferences?.avoidColors || []).filter(
        c => c !== colorValue
      );
      updateColorPreference('avoidColors', filtered);
    }
  };

  const resetAllPersonalization = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all personalization settings to defaults?'
      )
    ) {
      resetTheme();
    }
  };

  const ColorPreferencesSection = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Favorite Colors
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose colors you love. These will be used to personalize your experience.
        </p>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {colorOptions.map(color => {
            const isFavorite =
              personalization?.colorPreferences?.favoriteColors?.includes(color.value);
            const isAvoided = personalization?.colorPreferences?.avoidColors?.includes(
              color.value
            );

            return (
              <button
                key={color.value}
                onClick={() => handleColorSelection(color.value, true)}
                className={`relative h-12 rounded-lg border-2 transition-all ${
                  isFavorite
                    ? 'border-blue-500 scale-105'
                    : isAvoided
                      ? 'border-red-500 opacity-50'
                      : 'border-gray-200 dark:border-gray-700'
                }`}
                style={{ backgroundColor: color.value }}
                aria-label={`${color.name} - ${isFavorite ? 'Remove from' : 'Add to'} favorites`}
              >
                {isFavorite && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white fill-current" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {(personalization?.colorPreferences?.favoriteColors || []).map(color => (
            <div
              key={color}
              className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full text-sm"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-blue-700 dark:text-blue-300">
                {colorOptions.find(c => c.value === color)?.name || 'Custom'}
              </span>
              <button
                onClick={() => removeColor(color, true)}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                Colorblind Friendly
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use patterns and shapes in addition to colors
              </p>
            </div>
            <input
              type="checkbox"
              checked={personalization?.colorPreferences?.colorblindFriendly || false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateColorPreference('colorblindFriendly', e.target.checked)
              }
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
          </label>
        </div>

        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-2">
            Color Saturation
          </label>
          <input
            type="range"
            min="0.3"
            max="1.5"
            step="0.1"
            value={personalization?.colorPreferences?.saturationLevel || 1}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateColorPreference('saturationLevel', parseFloat(e.target.value))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Muted</span>
            <span>Normal</span>
            <span>Vibrant</span>
          </div>
        </div>

        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-2">
            Brightness Level
          </label>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={personalization?.colorPreferences?.brightnessLevel || 1}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateColorPreference('brightnessLevel', parseFloat(e.target.value))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Dim</span>
            <span>Normal</span>
            <span>Bright</span>
          </div>
        </div>
      </div>
    </div>
  );

  const TypographyPreferencesSection = () => (
    <div className="space-y-6">
      <div>
        <label className="block font-medium text-gray-900 dark:text-white mb-3">
          Font Family
        </label>
        <div className="grid grid-cols-1 gap-2">
          {fontOptions.map(font => (
            <button
              key={font.value}
              onClick={() =>
                updateTypographyPreference('preferredFontFamily', font.value)
              }
              className={`p-3 text-left rounded-lg border transition-all ${
                personalization?.typographyPreferences?.preferredFontFamily ===
                font.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              style={{ fontFamily: font.value }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{font.name}</div>
                  <div className="text-sm text-gray-500 capitalize">
                    {font.category}
                  </div>
                </div>
                {personalization?.typographyPreferences?.preferredFontFamily ===
                  font.value && <Check className="w-4 h-4 text-blue-500" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-medium text-gray-900 dark:text-white mb-2">
          Font Size Scale (
          {((personalization?.typographyPreferences?.fontSizeScale || 1) * 100).toFixed(
            0
          )}
          %)
        </label>
        <input
          type="range"
          min="0.8"
          max="1.4"
          step="0.05"
          value={personalization?.typographyPreferences?.fontSizeScale || 1}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateTypographyPreference('fontSizeScale', parseFloat(e.target.value))
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Small</span>
          <span>Normal</span>
          <span>Large</span>
        </div>
      </div>

      <div>
        <label className="block font-medium text-gray-900 dark:text-white mb-2">
          Line Height
        </label>
        <select
          value={
            personalization?.typographyPreferences?.lineHeightPreference || 'normal'
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateTypographyPreference('lineHeightPreference', e.target.value as unknown)
          }
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
        >
          <option value="tight">Tight (1.25)</option>
          <option value="normal">Normal (1.5)</option>
          <option value="relaxed">Relaxed (1.75)</option>
          <option value="loose">Loose (2.0)</option>
        </select>
      </div>

      <div>
        <label className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              Dyslexia Friendly
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use fonts and spacing optimized for dyslexia
            </p>
          </div>
          <input
            type="checkbox"
            checked={personalization?.typographyPreferences?.dyslexiaFriendly || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateTypographyPreference('dyslexiaFriendly', e.target.checked)
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
        </label>
      </div>
    </div>
  );

  const MotionPreferencesSection = () => (
    <div className="space-y-6">
      <div>
        <label className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              Enable Animations
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Show smooth transitions and animations
            </p>
          </div>
          <input
            type="checkbox"
            checked={personalization?.motionPreferences?.enableAnimations !== false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateMotionPreference('enableAnimations', e.target.checked)
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
        </label>
      </div>

      <div>
        <label className="block font-medium text-gray-900 dark:text-white mb-2">
          Animation Speed
        </label>
        <select
          value={personalization?.motionPreferences?.animationSpeed || 'normal'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateMotionPreference('animationSpeed', e.target.value as unknown)
          }
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
        >
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
      </div>

      <div>
        <label className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              Reduce Motion
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Minimize movement for motion sensitivity
            </p>
          </div>
          <input
            type="checkbox"
            checked={personalization?.motionPreferences?.reduceMotion || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateMotionPreference('reduceMotion', e.target.checked)
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              Hover Effects
            </span>
          </div>
          <input
            type="checkbox"
            checked={personalization?.motionPreferences?.enableHoverEffects !== false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateMotionPreference('enableHoverEffects', e.target.checked)
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              Focus Animations
            </span>
          </div>
          <input
            type="checkbox"
            checked={
              personalization?.motionPreferences?.enableFocusAnimations !== false
            }
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateMotionPreference('enableFocusAnimations', e.target.checked)
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
        </label>
      </div>
    </div>
  );

  const SoundPreferencesSection = () => (
    <div className="space-y-6">
      <div>
        <label className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              Enable Sounds
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Play sound effects and notifications
            </p>
          </div>
          <input
            type="checkbox"
            checked={personalization?.soundPreferences?.enableSounds !== false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateSoundPreference('enableSounds', e.target.checked)
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
        </label>
      </div>

      <div>
        <label className="block font-medium text-gray-900 dark:text-white mb-2">
          Volume (
          {Math.round((personalization?.soundPreferences?.soundVolume || 0.7) * 100)}%)
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={personalization?.soundPreferences?.soundVolume || 0.7}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateSoundPreference('soundVolume', parseFloat(e.target.value))
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
      </div>

      <div>
        <label className="block font-medium text-gray-900 dark:text-white mb-2">
          Sound Theme
        </label>
        <select
          value={personalization?.soundPreferences?.soundTheme || 'default'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateSoundPreference('soundTheme', e.target.value)
          }
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
        >
          <option value="default">Default</option>
          <option value="minimal">Minimal</option>
          <option value="nature">Nature</option>
          <option value="electronic">Electronic</option>
          <option value="retro">Retro</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              Haptic Feedback
            </span>
          </div>
          <input
            type="checkbox"
            checked={personalization?.soundPreferences?.hapticFeedback !== false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateSoundPreference('hapticFeedback', e.target.checked)
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              Mute on Focus
            </span>
          </div>
          <input
            type="checkbox"
            checked={personalization?.soundPreferences?.muteOnFocus || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateSoundPreference('muteOnFocus', e.target.checked)
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
        </label>
      </div>
    </div>
  );

  const LayoutPreferencesSection = () => (
    <div className="space-y-6">
      <div>
        <label className="block font-medium text-gray-900 dark:text-white mb-2">
          Interface Density
        </label>
        <select
          value={personalization?.layoutPreferences?.density || 'comfortable'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateLayoutPreference('density', e.target.value as unknown)
          }
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="spacious">Spacious</option>
        </select>
      </div>

      <div>
        <label className="block font-medium text-gray-900 dark:text-white mb-2">
          Card Style
        </label>
        <select
          value={personalization?.layoutPreferences?.cardStyle || 'rounded'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateLayoutPreference('cardStyle', e.target.value as unknown)
          }
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
        >
          <option value="square">Square</option>
          <option value="rounded">Rounded</option>
          <option value="soft">Soft Rounded</option>
          <option value="sharp">Sharp</option>
        </select>
      </div>

      <div>
        <label className="block font-medium text-gray-900 dark:text-white mb-2">
          Border Radius
        </label>
        <input
          type="range"
          min="0"
          max="24"
          step="2"
          value={personalization?.layoutPreferences?.borderRadius || 8}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateLayoutPreference('borderRadius', parseInt(e.target.value))
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0px</span>
          <span>12px</span>
          <span>24px</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              Show Labels
            </span>
          </div>
          <input
            type="checkbox"
            checked={personalization?.layoutPreferences?.showLabels !== false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateLayoutPreference('showLabels', e.target.checked)
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              Show Icons
            </span>
          </div>
          <input
            type="checkbox"
            checked={personalization?.layoutPreferences?.showIcons !== false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateLayoutPreference('showIcons', e.target.checked)
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
        </label>
      </div>
    </div>
  );

  const sections = [
    {
      id: 'colors',
      title: 'Colors & Visual',
      icon: Palette,
      component: ColorPreferencesSection,
      description: 'Customize colors, brightness, and visual preferences',
    },
    {
      id: 'typography',
      title: 'Typography',
      icon: Type,
      component: TypographyPreferencesSection,
      description: 'Adjust fonts, sizes, and reading preferences',
    },
    {
      id: 'motion',
      title: 'Motion & Animation',
      icon: Zap,
      component: MotionPreferencesSection,
      description: 'Control animations and motion effects',
    },
    {
      id: 'sound',
      title: 'Sound & Haptic',
      icon: Headphones,
      component: SoundPreferencesSection,
      description: 'Configure audio and haptic feedback',
    },
    {
      id: 'layout',
      title: 'Layout & Interface',
      icon: Layout,
      component: LayoutPreferencesSection,
      description: 'Adjust interface density and layout preferences',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Personalization
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Customize your experience to match your preferences
          </p>
        </div>

        <button
          onClick={resetAllPersonalization}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reset All
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map(
          ({ id, title, icon: Icon, component: Component, description }) => (
            <div key={id} className="alarm-card">
              <button
                onClick={() => toggleSection(id)}
                className="w-full flex items-center justify-between p-4 text-left"
                aria-expanded={activeSection === id}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {description}
                    </div>
                  </div>
                </div>
                {activeSection === id ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {activeSection === id && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <Component />
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Quick Actions */}
      <div className="alarm-card p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateColorPreference('saturationLevel', 1.2)}
            className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            Vibrant Colors
          </button>
          <button
            onClick={() => {
              updateTypographyPreference('fontSizeScale', 1.2);
              updateLayoutPreference('density', 'spacious');
            }}
            className="px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Large & Clear
          </button>
          <button
            onClick={() => {
              updateMotionPreference('enableAnimations', false);
              updateMotionPreference('reduceMotion', true);
            }}
            className="px-3 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
          >
            <Monitor className="w-4 h-4 inline mr-1" />
            Focus Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalizationSettings;
