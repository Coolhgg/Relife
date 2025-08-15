import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Sun,
  Cloud,
  CloudSnow,
  Zap,
  Wind,
  Eye,
  Save,
  RefreshCw,
  Palette,
  Settings,
  MapPin,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { weatherThemePresets, WeatherThemePreset, getWeatherIcon } from '../config/weatherThemes';
import { themeVariants } from '../config/themes';
import LocationThemeService, { WeatherThemeConfig } from '../services/LocationThemeService';
import type { ThemeVariant } from '../types';

interface WeatherThemeConfiguratorProps {
  onClose: () => void;
  onConfigUpdate?: (config: WeatherThemeConfig) => void;
}

const WeatherThemeConfigurator: React.FC<WeatherThemeConfiguratorProps> = ({ 
  onClose, 
  onConfigUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'test'>('presets');
  const [weatherConfig, setWeatherConfig] = useState<WeatherThemeConfig | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('natural');
  const [customRules, setCustomRules] = useState<WeatherThemeConfig['rules'] | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [testLocation, setTestLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // NYC default
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const locationService = LocationThemeService.getInstance();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const config = locationService.getWeatherConfig();
      setWeatherConfig(config);
      setApiKey(config.apiKey || '');
      
      if (config.rules) {
        // Try to match existing rules to a preset
        const matchingPreset = weatherThemePresets.find(preset => 
          JSON.stringify(preset.rules) === JSON.stringify(config.rules)
        );
        if (matchingPreset) {
          setSelectedPreset(matchingPreset.id);
        } else {
          setSelectedPreset('custom');
          setCustomRules(config.rules);
        }
      }
    } catch (error) {
      console.error('Error loading weather configuration:', error);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = weatherThemePresets.find(p => p.id === presetId);
    if (preset) {
      setCustomRules(preset.rules);
    }
  };

  const handleCustomRuleChange = (
    condition: keyof WeatherThemeConfig['rules'],
    field: 'variant' | 'mode',
    value: string
  ) => {
    if (!customRules) return;
    
    setCustomRules(prev => ({
      ...prev!,
      [condition]: {
        ...prev![condition],
        [field]: value === 'none' ? undefined : value
      }
    }));
  };

  const handleSaveConfiguration = async () => {
    if (!customRules) return;
    
    setSaveStatus('saving');
    try {
      // Save API key
      if (apiKey !== (weatherConfig?.apiKey || '')) {
        await locationService.setWeatherApiKey(apiKey);
      }
      
      // Update weather config with new rules
      const updatedConfig: WeatherThemeConfig = {
        enabled: weatherConfig?.enabled || false,
        apiKey,
        rules: customRules
      };
      
      // This would need to be implemented in LocationThemeService
      // For now, we'll save it as a custom method
      await saveWeatherRules(updatedConfig);
      
      setSaveStatus('saved');
      onConfigUpdate?.(updatedConfig);
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving weather configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Placeholder method - would need to be implemented in LocationThemeService
  const saveWeatherRules = async (config: WeatherThemeConfig) => {
    // This would save the custom weather rules to the service
    console.log('Saving weather rules:', config);
  };

  const handleTestWeather = async () => {
    if (!apiKey) {
      setError('Please enter an API key first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${testLocation.lat}&lon=${testLocation.lng}&appid=${apiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const data = await response.json();
      setWeatherData(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const weatherIcons = {
    sunny: Sun,
    cloudy: Cloud,
    rainy: CloudRain,
    snowy: CloudSnow,
    stormy: Zap,
    foggy: Eye,
    windy: Wind
  };

  const PresetTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Choose a Weather Theme Preset
        </h3>
        <div className="grid gap-4">
          {weatherThemePresets.map((preset) => (
            <div
              key={preset.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedPreset === preset.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => handlePresetSelect(preset.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {preset.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {preset.description}
                  </p>
                </div>
                {selectedPreset === preset.id && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(preset.rules).slice(0, 5).map(([condition, rule]) => {
                  const Icon = weatherIcons[condition as keyof typeof weatherIcons];
                  const themeVariant = themeVariants[rule.variant];
                  
                  return (
                    <div key={condition} className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ background: themeVariant?.gradient || '#ccc' }}
                          title={`${condition}: ${themeVariant?.name} ${rule.mode ? `(${rule.mode})` : ''}`}
                        />
                        <span className="text-xs text-gray-500 capitalize">
                          {condition}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const CustomTab = () => {
    if (!customRules) return null;
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Customize Weather Theme Rules
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Configure individual theme settings for each weather condition
          </p>
        </div>
        
        <div className="grid gap-4">
          {Object.entries(customRules).map(([condition, rule]) => {
            const Icon = weatherIcons[condition as keyof typeof weatherIcons];
            
            return (
              <div
                key={condition}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                    {condition} Weather
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme Variant
                    </label>
                    <select
                      value={rule.variant}
                      onChange={(e) => handleCustomRuleChange(
                        condition as keyof WeatherThemeConfig['rules'],
                        'variant',
                        e.target.value
                      )}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {Object.entries(themeVariants).map(([key, theme]) => (
                        <option key={key} value={key}>
                          {theme.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme Mode
                    </label>
                    <select
                      value={rule.mode || 'none'}
                      onChange={(e) => handleCustomRuleChange(
                        condition as keyof WeatherThemeConfig['rules'],
                        'mode',
                        e.target.value
                      )}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="none">No change</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Preview:</span>
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ background: themeVariants[rule.variant]?.gradient || '#ccc' }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {themeVariants[rule.variant]?.name}
                    {rule.mode && ` (${rule.mode} mode)`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TestTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Test Weather Theme Integration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Test the weather API and see how themes would change based on current conditions
        </p>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Test Location
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={testLocation.lat}
              onChange={(e) => setTestLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={testLocation.lng}
              onChange={(e) => setTestLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        
        <button
          onClick={handleTestWeather}
          disabled={loading || !apiKey}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CloudRain className="w-4 h-4" />
          )}
          Test Weather
        </button>
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}
      </div>
      
      {weatherData && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Current Weather in {weatherData.name}
          </h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getWeatherIcon(weatherData.weather[0].id)}</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {weatherData.weather[0].main}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {weatherData.weather[0].description}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Thermometer className="w-4 h-4" />
                <span>{Math.round(weatherData.main.temp)}°C</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="w-4 h-4" />
                <span>{weatherData.main.humidity}% humidity</span>
              </div>
            </div>
          </div>
          
          {customRules && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                Theme That Would Apply:
              </h5>
              {/* This would show which theme rule would apply based on the weather condition */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ 
                    background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)' // Placeholder
                  }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Weather-based theme would be applied here
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Weather Theme Configuration
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* API Key Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              OpenWeatherMap API Key
            </label>
            <input
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'presets', label: 'Presets', icon: Palette },
              { key: 'custom', label: 'Custom Rules', icon: Settings },
              { key: 'test', label: 'Test & Preview', icon: CloudRain }
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
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'presets' && <PresetTab />}
          {activeTab === 'custom' && <CustomTab />}
          {activeTab === 'test' && <TestTab />}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {saveStatus === 'saved' && (
              <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Configuration saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Error saving configuration
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfiguration}
              disabled={saveStatus === 'saving' || !customRules}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saveStatus === 'saving' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherThemeConfigurator;