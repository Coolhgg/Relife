import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Smartphone, 
  Palette, 
  Clock, 
  Volume2,
  Sliders,
  Sparkles,
  Zap,
  Heart,
  Plus,
  Download,
  Upload,
  Trash2,
  MapPin
} from 'lucide-react';
import { useEnhancedTheme } from '../hooks/useEnhancedTheme';
import { themeVariants, themeStyles } from '../config/themes';
import { CustomThemeCreator } from './CustomThemeCreator';
import ThemeMarketplace from './ThemeMarketplace';
import LocationThemeSettings from './LocationThemeSettings';
import AdvancedThemeCustomization from './AdvancedThemeCustomization';
import type { ThemeVariant, ThemeStyle } from '../types';

interface ThemeCustomizerProps {
  className?: string;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ className = '' }) => {
  const {
    mode,
    setMode,
    variant,
    style,
    setVariant,
    setStyle,
    config,
    setConfig,
    getCurrentColors,
    getCurrentGradient,
    isScheduledModeActive,
    enableScheduledMode,
    disableScheduledMode
  } = useEnhancedTheme();
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomThemeCreator, setShowCustomThemeCreator] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [showAdvancedCustomization, setShowAdvancedCustomization] = useState(false);
  const [customThemes, setCustomThemes] = useState<any[]>([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(config.autoSchedule?.enabled || false);
  const [lightStart, setLightStart] = useState(config.autoSchedule?.lightModeStart || '07:00');
  const [darkStart, setDarkStart] = useState(config.autoSchedule?.darkModeStart || '19:00');
  const [soundProfileEnabled, setSoundProfileEnabled] = useState(config.soundProfile?.enabled || false);

  const colors = getCurrentColors();
  const gradient = getCurrentGradient();

  const handleModeChange = (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
    if (scheduleEnabled) {
      disableScheduledMode();
      setScheduleEnabled(false);
    }
  };

  const handleVariantChange = (newVariant: ThemeVariant) => {
    setVariant(newVariant);
  };

  const handleStyleChange = (newStyle: ThemeStyle) => {
    setStyle(newStyle);
  };

  const handleScheduleToggle = () => {
    if (scheduleEnabled) {
      disableScheduledMode();
      setScheduleEnabled(false);
    } else {
      enableScheduledMode(lightStart, darkStart);
      setScheduleEnabled(true);
    }
  };

  const handleScheduleTimeChange = (type: 'light' | 'dark', time: string) => {
    if (type === 'light') {
      setLightStart(time);
    } else {
      setDarkStart(time);
    }
    
    if (scheduleEnabled) {
      enableScheduledMode(
        type === 'light' ? time : lightStart,
        type === 'dark' ? time : darkStart
      );
    }
  };

  const handleSoundProfileToggle = () => {
    const newEnabled = !soundProfileEnabled;
    setSoundProfileEnabled(newEnabled);
    setConfig({
      soundProfile: {
        ...config.soundProfile,
        enabled: newEnabled
      }
    });
  };

  const handleCustomThemeCreated = (customTheme: any) => {
    setCustomThemes(prev => [...prev, customTheme]);
    // Apply the new custom theme
    setVariant(customTheme.id as any);
  };

  const handleDeleteCustomTheme = (themeId: string) => {
    setCustomThemes(prev => prev.filter(theme => theme.id !== themeId));
    // If this theme is currently selected, switch to default
    if (variant === themeId) {
      setVariant('default');
    }
  };

  const exportThemes = () => {
    const exportData = {
      customThemes,
      currentTheme: {
        mode,
        variant,
        style
      },
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relife-themes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importThemes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.customThemes) {
          setCustomThemes(prev => [...prev, ...data.customThemes]);
        }
      } catch (error) {
        alert('Invalid theme file format');
      }
    };
    reader.readAsText(file);
  };

  // Combine default themes with custom themes
  const allThemes = { ...themeVariants };
  customThemes.forEach(theme => {
    allThemes[theme.id] = theme;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Theme Mode Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Theme Mode
        </h3>
        {isScheduledModeActive && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              🕐 Scheduled mode is active - theme will change automatically
            </p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {[{ key: 'light', label: 'Light', icon: Sun }, { key: 'dark', label: 'Dark', icon: Moon }, { key: 'system', label: 'System', icon: Smartphone }].map(({ key, label, icon: Icon }) => {
            const isSelected = mode === key;
            return (
              <button
                key={key}
                onClick={() => handleModeChange(key as any)}
                className={`alarm-button ${
                  isSelected ? 'alarm-button-primary' : 'alarm-button-secondary'
                } py-3 text-sm flex flex-col items-center gap-1 transition-all duration-200`}
                aria-pressed={isSelected}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Variants */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Theme
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCustomThemeCreator(true)}
              className="alarm-button alarm-button-ghost p-2"
              title="Create Custom Theme"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={exportThemes}
              className="alarm-button alarm-button-ghost p-2"
              title="Export Themes"
            >
              <Download className="w-4 h-4" />
            </button>
            <label className="alarm-button alarm-button-ghost p-2 cursor-pointer" title="Import Themes">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".json"
                onChange={importThemes}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowMarketplace(true)}
              className="alarm-button alarm-button-ghost p-2"
              title="Theme Marketplace"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {Object.entries(allThemes).map(([key, theme]) => {
            const isSelected = variant === key;
            const isCustom = theme.isCustom;
            return (
              <div key={key} className="relative">
                <button
                  onClick={() => handleVariantChange(key as ThemeVariant)}
                  className={`relative w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={{
                    background: isSelected ? undefined : `linear-gradient(135deg, ${theme.colors.primary}15 0%, ${theme.colors.secondary}10 100%)`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{ background: theme.gradient }}
                    />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-1">
                        {theme.name}
                        {isCustom && <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-1 rounded">Custom</span>}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((color, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full border border-white/50"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    </div>
                  )}
                </button>
                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomTheme(key);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Delete Custom Theme"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Theme Styles */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Visual Style
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(themeStyles).map(([key, styleConfig]) => {
            const isSelected = style === key;
            const icons = {
              modern: Zap,
              classic: Heart,
              minimal: Sliders,
              vibrant: Sparkles
            };
            const Icon = icons[key as keyof typeof icons] || Sliders;
            
            return (
              <button
                key={key}
                onClick={() => handleStyleChange(key as ThemeStyle)}
                className={`alarm-button ${
                  isSelected ? 'alarm-button-primary' : 'alarm-button-secondary'
                } py-3 text-sm flex flex-col items-center gap-1`}
              >
                <Icon className="w-4 h-4" />
                {styleConfig.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="alarm-button alarm-button-ghost w-full py-3 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Advanced Settings
          </span>
          <div className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
            ⌄
          </div>
        </button>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          {/* Scheduled Theme Switching */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Scheduled Themes
              </h4>
              <button
                onClick={handleScheduleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  scheduleEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    scheduleEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically switch themes based on time of day
            </p>
            
            {scheduleEnabled && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Light Mode Start
                  </label>
                  <input
                    type="time"
                    value={lightStart}
                    onChange={(e) => handleScheduleTimeChange('light', e.target.value)}
                    className="alarm-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dark Mode Start
                  </label>
                  <input
                    type="time"
                    value={darkStart}
                    onChange={(e) => handleScheduleTimeChange('dark', e.target.value)}
                    className="alarm-input text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Theme-based Sound Profiles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Theme Sound Profiles
              </h4>
              <button
                onClick={handleSoundProfileToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  soundProfileEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundProfileEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Different alarm sounds for light and dark themes
            </p>
            
            {soundProfileEnabled && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-3">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between mb-2">
                    <span>Light theme sounds:</span>
                    <span className="text-blue-600 dark:text-blue-400">Gentle, Birds, Chimes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dark theme sounds:</span>
                    <span className="text-purple-600 dark:text-purple-400">Deep, Ocean, Rain</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Location & Weather Themes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location & Weather Themes
              </h4>
              <button
                onClick={() => setShowLocationSettings(true)}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <MapPin className="w-3 h-3" />
                Configure
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically change themes based on your location and current weather conditions
            </p>
          </div>
          
          {/* Advanced Customization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Advanced Customization
              </h4>
              <button
                onClick={() => setShowAdvancedCustomization(true)}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Sliders className="w-3 h-3" />
                Configure
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fine-tune animations, accessibility, performance, and mobile optimizations
            </p>
          </div>
        </div>
      )}

      {/* Current Theme Preview */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Current Theme Preview
        </h4>
        <div 
          className="h-20 rounded-lg flex items-center justify-center text-white font-medium"
          style={{ background: gradient }}
        >
          {allThemes[variant]?.name || 'Default'} • {themeStyles[style]?.name || 'Modern'}
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-600 dark:text-gray-400">
          <span>Primary: {colors.primary}</span>
          <span>Secondary: {colors.secondary}</span>
          <span>Accent: {colors.accent}</span>
        </div>
      </div>

      {/* Custom Theme Creator Modal */}
      {showCustomThemeCreator && (
        <CustomThemeCreator
          onThemeCreated={handleCustomThemeCreated}
          onClose={() => setShowCustomThemeCreator(false)}
        />
      )}
      
      {/* Theme Marketplace Modal */}
      {showMarketplace && (
        <ThemeMarketplace
          onClose={() => setShowMarketplace(false)}
        />
      )}
      
      {/* Location Theme Settings Modal */}
      {showLocationSettings && (
        <LocationThemeSettings
          onClose={() => setShowLocationSettings(false)}
        />
      )}
      
      {/* Advanced Theme Customization Modal */}
      {showAdvancedCustomization && (
        <AdvancedThemeCustomization
          onClose={() => setShowAdvancedCustomization(false)}
        />
      )}
    </div>
  );
};

export default ThemeCustomizer;