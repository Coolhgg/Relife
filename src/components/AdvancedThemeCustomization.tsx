import React, { useState, useEffect } from 'react';
import {
  Settings,
  Palette,
  Zap,
  Eye,
  Volume2,
  Monitor,
  Smartphone,
  Accessibility,
  Animation,
  Sliders,
  RotateCcw,
  Save,
  X,
  CheckCircle,
  Info,
  Moon,
  Sun,
  Contrast,
  Type,
  Vibrate,
  Globe,
  Timer,
  Sparkles,
  Play
} from 'lucide-react';
import { useEnhancedTheme } from '../hooks/useEnhancedTheme';
import { Preferences } from '@capacitor/preferences';

interface AdvancedThemeCustomizationProps {
  onClose: () => void;
}

interface AdvancedThemeConfig {
  animations: {
    enabled: boolean;
    duration: number;
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
    reduceMotion: boolean;
  };
  transitions: {
    themeSwitch: boolean;
    smoothScrolling: boolean;
    fadeEffects: boolean;
    slideEffects: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reducedTransparency: boolean;
    focusIndicators: boolean;
    screenReaderOptimized: boolean;
  };
  performance: {
    preloadThemes: boolean;
    lazyLoading: boolean;
    hardwareAcceleration: boolean;
    batteryOptimization: boolean;
  };
  advanced: {
    customCSS: string;
    debugMode: boolean;
    themePersistence: 'session' | 'local' | 'cloud';
    autoBackup: boolean;
  };
  mobile: {
    swipeGestures: boolean;
    hapticFeedback: boolean;
    adaptiveLayout: boolean;
    batteryAwareThemes: boolean;
  };
}

const defaultConfig: AdvancedThemeConfig = {
  animations: {
    enabled: true,
    duration: 300,
    easing: 'ease-in-out',
    reduceMotion: false
  },
  transitions: {
    themeSwitch: true,
    smoothScrolling: true,
    fadeEffects: true,
    slideEffects: true
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    reducedTransparency: false,
    focusIndicators: true,
    screenReaderOptimized: false
  },
  performance: {
    preloadThemes: true,
    lazyLoading: true,
    hardwareAcceleration: true,
    batteryOptimization: false
  },
  advanced: {
    customCSS: '',
    debugMode: false,
    themePersistence: 'local',
    autoBackup: true
  },
  mobile: {
    swipeGestures: true,
    hapticFeedback: true,
    adaptiveLayout: true,
    batteryAwareThemes: false
  }
};

const AdvancedThemeCustomization: React.FC<AdvancedThemeCustomizationProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'animations' | 'accessibility' | 'performance' | 'mobile' | 'advanced'>('animations');
  const [config, setConfig] = useState<AdvancedThemeConfig>(defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { triggerHapticFeedback } = useEnhancedTheme();

  useEffect(() => {
    loadConfiguration();
  }, []);

  useEffect(() => {
    if (isPreviewMode) {
      applyPreviewChanges();
    }
  }, [config, isPreviewMode]);

  const loadConfiguration = async () => {
    try {
      const { value } = await Preferences.get({ key: 'advanced-theme-config' });
      if (value) {
        const savedConfig = JSON.parse(value);
        setConfig({ ...defaultConfig, ...savedConfig });
      }
    } catch (error) {
      console.error('Error loading advanced theme configuration:', error);
    }
  };

  const handleConfigChange = (section: keyof AdvancedThemeConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
    
    if (config.mobile.hapticFeedback) {
      triggerHapticFeedback();
    }
  };

  const applyPreviewChanges = () => {
    const root = document.documentElement;
    
    // Apply animation settings
    if (config.animations.enabled) {
      root.style.setProperty('--theme-transition-duration', `${config.animations.duration}ms`);
      root.style.setProperty('--theme-transition-easing', config.animations.easing);
    } else {
      root.style.setProperty('--theme-transition-duration', '0ms');
    }
    
    // Apply accessibility settings
    if (config.accessibility.highContrast) {
      root.style.filter = 'contrast(150%)';
    } else {
      root.style.filter = 'none';
    }
    
    if (config.accessibility.largeText) {
      root.style.fontSize = '110%';
    } else {
      root.style.fontSize = '100%';
    }
    
    // Apply performance settings
    if (config.performance.hardwareAcceleration) {
      root.style.transform = 'translateZ(0)';
    } else {
      root.style.transform = 'none';
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await Preferences.set({
        key: 'advanced-theme-config',
        value: JSON.stringify(config)
      });
      
      // Apply settings permanently
      applyPreviewChanges();
      
      setSaveStatus('saved');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving advanced theme configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    label: string;
    description?: string;
  }> = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-white">{label}</div>
        {description && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const SliderInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    label: string;
    min: number;
    max: number;
    step?: number;
    unit?: string;
  }> = ({ value, onChange, label, min, max, step = 1, unit = '' }) => (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <label className="font-medium text-gray-900 dark:text-white">{label}</label>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
      />
    </div>
  );

  const AnimationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Animation className="w-5 h-5" />
          Animation Settings
        </h3>
        
        <div className="space-y-1">
          <ToggleSwitch
            enabled={config.animations.enabled}
            onChange={(enabled) => handleConfigChange('animations', 'enabled', enabled)}
            label="Enable Animations"
            description="Turn on/off all theme animations and transitions"
          />
          
          <ToggleSwitch
            enabled={config.animations.reduceMotion}
            onChange={(enabled) => handleConfigChange('animations', 'reduceMotion', enabled)}
            label="Reduce Motion"
            description="Minimize animations for motion sensitivity"
          />
        </div>
        
        {config.animations.enabled && !config.animations.reduceMotion && (
          <div className="mt-6 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <SliderInput
              value={config.animations.duration}
              onChange={(value) => handleConfigChange('animations', 'duration', value)}
              label="Animation Duration"
              min={100}
              max={1000}
              step={50}
              unit="ms"
            />
            
            <div className="py-3">
              <label className="block font-medium text-gray-900 dark:text-white mb-2">
                Animation Easing
              </label>
              <select
                value={config.animations.easing}
                onChange={(e) => handleConfigChange('animations', 'easing', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="linear">Linear</option>
                <option value="ease">Ease</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In-Out</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Transition Effects
        </h4>
        
        <div className="space-y-1">
          <ToggleSwitch
            enabled={config.transitions.themeSwitch}
            onChange={(enabled) => handleConfigChange('transitions', 'themeSwitch', enabled)}
            label="Theme Switch Animation"
            description="Smooth transition when changing themes"
          />
          
          <ToggleSwitch
            enabled={config.transitions.smoothScrolling}
            onChange={(enabled) => handleConfigChange('transitions', 'smoothScrolling', enabled)}
            label="Smooth Scrolling"
            description="Smooth scrolling behavior throughout the app"
          />
          
          <ToggleSwitch
            enabled={config.transitions.fadeEffects}
            onChange={(enabled) => handleConfigChange('transitions', 'fadeEffects', enabled)}
            label="Fade Effects"
            description="Fade in/out effects for content"
          />
          
          <ToggleSwitch
            enabled={config.transitions.slideEffects}
            onChange={(enabled) => handleConfigChange('transitions', 'slideEffects', enabled)}
            label="Slide Effects"
            description="Slide animations for panels and modals"
          />
        </div>
      </div>
    </div>
  );

  const AccessibilityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Accessibility className="w-5 h-5" />
          Accessibility Options
        </h3>
        
        <div className="space-y-1">
          <ToggleSwitch
            enabled={config.accessibility.highContrast}
            onChange={(enabled) => handleConfigChange('accessibility', 'highContrast', enabled)}
            label="High Contrast Mode"
            description="Increase contrast for better visibility"
          />
          
          <ToggleSwitch
            enabled={config.accessibility.largeText}
            onChange={(enabled) => handleConfigChange('accessibility', 'largeText', enabled)}
            label="Large Text"
            description="Increase text size for better readability"
          />
          
          <ToggleSwitch
            enabled={config.accessibility.reducedTransparency}
            onChange={(enabled) => handleConfigChange('accessibility', 'reducedTransparency', enabled)}
            label="Reduced Transparency"
            description="Reduce transparent elements for clarity"
          />
          
          <ToggleSwitch
            enabled={config.accessibility.focusIndicators}
            onChange={(enabled) => handleConfigChange('accessibility', 'focusIndicators', enabled)}
            label="Enhanced Focus Indicators"
            description="Stronger visual focus indicators for keyboard navigation"
          />
          
          <ToggleSwitch
            enabled={config.accessibility.screenReaderOptimized}
            onChange={(enabled) => handleConfigChange('accessibility', 'screenReaderOptimized', enabled)}
            label="Screen Reader Optimization"
            description="Optimize interface for screen readers"
          />
        </div>
      </div>
    </div>
  );

  const PerformanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Performance Settings
        </h3>
        
        <div className="space-y-1">
          <ToggleSwitch
            enabled={config.performance.preloadThemes}
            onChange={(enabled) => handleConfigChange('performance', 'preloadThemes', enabled)}
            label="Preload Themes"
            description="Load theme assets in advance for faster switching"
          />
          
          <ToggleSwitch
            enabled={config.performance.lazyLoading}
            onChange={(enabled) => handleConfigChange('performance', 'lazyLoading', enabled)}
            label="Lazy Loading"
            description="Load content only when needed to improve performance"
          />
          
          <ToggleSwitch
            enabled={config.performance.hardwareAcceleration}
            onChange={(enabled) => handleConfigChange('performance', 'hardwareAcceleration', enabled)}
            label="Hardware Acceleration"
            description="Use GPU acceleration for smoother animations"
          />
          
          <ToggleSwitch
            enabled={config.performance.batteryOptimization}
            onChange={(enabled) => handleConfigChange('performance', 'batteryOptimization', enabled)}
            label="Battery Optimization"
            description="Reduce animations and effects to save battery"
          />
        </div>
      </div>
    </div>
  );

  const MobileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Mobile Optimizations
        </h3>
        
        <div className="space-y-1">
          <ToggleSwitch
            enabled={config.mobile.swipeGestures}
            onChange={(enabled) => handleConfigChange('mobile', 'swipeGestures', enabled)}
            label="Swipe Gestures"
            description="Enable touch gestures for theme switching"
          />
          
          <ToggleSwitch
            enabled={config.mobile.hapticFeedback}
            onChange={(enabled) => handleConfigChange('mobile', 'hapticFeedback', enabled)}
            label="Haptic Feedback"
            description="Vibration feedback for theme interactions"
          />
          
          <ToggleSwitch
            enabled={config.mobile.adaptiveLayout}
            onChange={(enabled) => handleConfigChange('mobile', 'adaptiveLayout', enabled)}
            label="Adaptive Layout"
            description="Automatically adjust layout based on screen size"
          />
          
          <ToggleSwitch
            enabled={config.mobile.batteryAwareThemes}
            onChange={(enabled) => handleConfigChange('mobile', 'batteryAwareThemes', enabled)}
            label="Battery-Aware Themes"
            description="Switch to darker themes when battery is low"
          />
        </div>
      </div>
    </div>
  );

  const AdvancedTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Advanced Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block font-medium text-gray-900 dark:text-white mb-2">
              Theme Persistence
            </label>
            <select
              value={config.advanced.themePersistence}
              onChange={(e) => handleConfigChange('advanced', 'themePersistence', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="session">Session Only</option>
              <option value="local">Local Storage</option>
              <option value="cloud">Cloud Sync</option>
            </select>
          </div>
          
          <ToggleSwitch
            enabled={config.advanced.autoBackup}
            onChange={(enabled) => handleConfigChange('advanced', 'autoBackup', enabled)}
            label="Auto Backup"
            description="Automatically backup theme configurations"
          />
          
          <ToggleSwitch
            enabled={config.advanced.debugMode}
            onChange={(enabled) => handleConfigChange('advanced', 'debugMode', enabled)}
            label="Debug Mode"
            description="Show debug information for theme system"
          />
          
          <div>
            <label className="block font-medium text-gray-900 dark:text-white mb-2">
              Custom CSS
            </label>
            <textarea
              value={config.advanced.customCSS}
              onChange={(e) => handleConfigChange('advanced', 'customCSS', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              rows={6}
              placeholder="/* Add your custom CSS here */"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Custom CSS will be applied to override theme styles
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { key: 'animations', label: 'Animations', icon: Animation },
    { key: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { key: 'performance', label: 'Performance', icon: Zap },
    { key: 'mobile', label: 'Mobile', icon: Smartphone },
    { key: 'advanced', label: 'Advanced', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Advanced Theme Customization
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors ${
                  isPreviewMode
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Play className="w-3 h-3" />
                Preview
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(({ key, label, icon: Icon }) => (
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
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'animations' && <AnimationsTab />}
          {activeTab === 'accessibility' && <AccessibilityTab />}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'mobile' && <MobileTab />}
          {activeTab === 'advanced' && <AdvancedTab />}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {saveStatus === 'saved' && (
              <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Settings saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <X className="w-4 h-4" />
                Error saving settings
              </span>
            )}
            {hasChanges && (
              <span className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Unsaved changes
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving' || !hasChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedThemeCustomization;