import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Globe,
  Clock,
  Palette,
  CloudRain,
  Sun,
  Cloud,
  CloudSnow,
  Zap,
  Settings,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import LocationThemeService, { LocationThemeRule, WeatherThemeConfig } from '../services/LocationThemeService';
import WeatherThemeConfigurator from './WeatherThemeConfigurator';
import { useEnhancedTheme } from '../hooks/useEnhancedTheme';
import { themeVariants } from '../config/themes';
import type { ThemeVariant } from '../types';

interface LocationThemeSettingsProps {
  onClose: () => void;
}

const LocationThemeSettings: React.FC<LocationThemeSettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'location' | 'weather'>('location');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [rules, setRules] = useState<LocationThemeRule[]>([]);
  const [weatherConfig, setWeatherConfig] = useState<WeatherThemeConfig | null>(null);
  const [editingRule, setEditingRule] = useState<LocationThemeRule | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'loading'>('unknown');
  const [weatherApiKey, setWeatherApiKey] = useState('');

  const locationService = LocationThemeService.getInstance();
  const { setMode, setVariant } = useEnhancedTheme();

  useEffect(() => {
    loadSettings();
    setupEventListeners();
    return () => {
      removeEventListeners();
    };
  }, []);

  const loadSettings = async () => {
    try {
      const config = locationService.getConfig();
      const weatherConf = locationService.getWeatherConfig();
      
      setLocationEnabled(config.enabled);
      setRules(config.rules);
      setWeatherEnabled(weatherConf.enabled);
      setWeatherConfig(weatherConf);
      setWeatherApiKey(weatherConf.apiKey || '');
      
      if (config.lastLocation) {
        setCurrentLocation({
          lat: config.lastLocation.lat,
          lng: config.lastLocation.lng
        });
      }
    } catch (error) {
      console.error('Error loading location theme settings:', error);
    }
  };

  const setupEventListeners = () => {
    const handleLocationThemeChange = (event: CustomEvent) => {
      const { rule } = event.detail;
      console.log('Location-based theme applied:', rule.name);
      if (rule.theme.mode) setMode(rule.theme.mode);
      if (rule.theme.variant) setVariant(rule.theme.variant);
    };

    const handleWeatherThemeChange = (event: CustomEvent) => {
      const { theme, weather } = event.detail;
      console.log('Weather-based theme applied:', weather.condition);
      if (theme.mode) setMode(theme.mode);
      if (theme.variant) setVariant(theme.variant);
    };

    window.addEventListener('location-theme-change', handleLocationThemeChange as EventListener);
    window.addEventListener('weather-theme-change', handleWeatherThemeChange as EventListener);
  };

  const removeEventListeners = () => {
    window.removeEventListener('location-theme-change', () => {});
    window.removeEventListener('weather-theme-change', () => {});
  };

  const handleLocationToggle = async () => {
    try {
      setPermissionStatus('loading');
      const newEnabled = !locationEnabled;
      
      if (newEnabled) {
        const hasPermission = await locationService.requestLocationPermission();
        if (!hasPermission) {
          setPermissionStatus('denied');
          return;
        }
        setPermissionStatus('granted');
      }
      
      await locationService.enableLocationThemes(newEnabled);
      setLocationEnabled(newEnabled);
    } catch (error) {
      console.error('Error toggling location themes:', error);
      setPermissionStatus('denied');
    }
  };

  const handleWeatherToggle = async () => {
    try {
      const newEnabled = !weatherEnabled;
      await locationService.enableWeatherThemes(newEnabled);
      setWeatherEnabled(newEnabled);
    } catch (error) {
      console.error('Error toggling weather themes:', error);
    }
  };

  const handleSaveWeatherApiKey = async () => {
    try {
      await locationService.setWeatherApiKey(weatherApiKey);
      await loadSettings();
    } catch (error) {
      console.error('Error saving weather API key:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setPermissionStatus('loading');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });
      
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setPermissionStatus('granted');
    } catch (error) {
      console.error('Error getting current location:', error);
      setPermissionStatus('denied');
    }
  };

  const AddRuleForm: React.FC = () => {
    const [ruleName, setRuleName] = useState('');
    const [lat, setLat] = useState(currentLocation?.lat?.toString() || '');
    const [lng, setLng] = useState(currentLocation?.lng?.toString() || '');
    const [radius, setRadius] = useState('1');
    const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system' | ''>('');
    const [themeVariant, setThemeVariant] = useState<ThemeVariant>('default');
    const [hasTimeRestriction, setHasTimeRestriction] = useState(false);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');

    const handleSave = async () => {
      try {
        const rule = {
          name: ruleName,
          enabled: true,
          location: {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radius: parseFloat(radius)
          },
          theme: {
            mode: themeMode || undefined,
            variant: themeVariant
          },
          timeRestriction: hasTimeRestriction ? {
            startTime,
            endTime
          } : undefined
        };

        await locationService.addLocationRule(rule);
        await loadSettings();
        setShowAddRule(false);
      } catch (error) {
        console.error('Error adding location rule:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add Location Rule
            </h3>
            <button
              onClick={() => setShowAddRule(false)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rule Name
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Work Theme"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Radius (km)
              </label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0.1"
                step="0.1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Theme Mode
                </label>
                <select
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">No change</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Theme Variant
                </label>
                <select
                  value={themeVariant}
                  onChange={(e) => setThemeVariant(e.target.value as ThemeVariant)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Object.entries(themeVariants).map(([key, theme]) => (
                    <option key={key} value={key}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasTimeRestriction}
                  onChange={(e) => setHasTimeRestriction(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Time restriction
                </span>
              </label>
            </div>

            {hasTimeRestriction && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            <button
              onClick={getCurrentLocation}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Use Current Location
            </button>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={!ruleName || !lat || !lng}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Rule
              </button>
              <button
                onClick={() => setShowAddRule(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LocationTab = () => (
    <div className="space-y-6">
      {/* Location Themes Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Location-Based Themes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically change themes based on your location
          </p>
        </div>
        <button
          onClick={handleLocationToggle}
          disabled={permissionStatus === 'loading'}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            locationEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          } ${permissionStatus === 'loading' ? 'opacity-50' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              locationEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Permission Status */}
      {permissionStatus !== 'unknown' && (
        <div className={`p-3 rounded-lg border ${
          permissionStatus === 'granted'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
            : permissionStatus === 'denied'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center gap-2">
            {permissionStatus === 'granted' && <CheckCircle className="w-4 h-4 text-green-600" />}
            {permissionStatus === 'denied' && <AlertCircle className="w-4 h-4 text-red-600" />}
            {permissionStatus === 'loading' && <Loader className="w-4 h-4 text-gray-600 animate-spin" />}
            <span className={`text-sm ${
              permissionStatus === 'granted'
                ? 'text-green-800 dark:text-green-200'
                : permissionStatus === 'denied'
                ? 'text-red-800 dark:text-red-200'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {permissionStatus === 'granted' && 'Location permission granted'}
              {permissionStatus === 'denied' && 'Location permission denied. Please enable in settings.'}
              {permissionStatus === 'loading' && 'Requesting location permission...'}
            </span>
          </div>
        </div>
      )}

      {/* Current Location */}
      {currentLocation && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Current Location</h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div>Latitude: {currentLocation.lat.toFixed(6)}</div>
            <div>Longitude: {currentLocation.lng.toFixed(6)}</div>
          </div>
        </div>
      )}

      {/* Location Rules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Location Rules</h4>
          <button
            onClick={() => setShowAddRule(true)}
            disabled={!locationEnabled}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No location rules configured.</p>
            <p className="text-sm">Add rules to automatically change themes based on your location.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {rule.name}
                    </h5>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <div className="flex items-center gap-4">
                        <span>📍 {rule.location.lat.toFixed(4)}, {rule.location.lng.toFixed(4)}</span>
                        <span>📏 {rule.location.radius}km radius</span>
                      </div>
                      {rule.timeRestriction && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{rule.timeRestriction.startTime} - {rule.timeRestriction.endTime}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        {rule.theme.mode && (
                          <span className="inline-flex items-center gap-1">
                            <Settings className="w-3 h-3" />
                            {rule.theme.mode}
                          </span>
                        )}
                        {rule.theme.variant && (
                          <span className="inline-flex items-center gap-1">
                            <Palette className="w-3 h-3" />
                            {themeVariants[rule.theme.variant]?.name || rule.theme.variant}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => locationService.removeLocationRule(rule.id).then(loadSettings)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const WeatherTab = () => (
    <div className="space-y-6">
      {/* Weather Themes Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Weather-Based Themes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically change themes based on current weather
          </p>
        </div>
        <button
          onClick={handleWeatherToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            weatherEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              weatherEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* API Key Configuration */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          OpenWeatherMap API Configuration
        </h4>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="Enter your OpenWeatherMap API key"
            value={weatherApiKey}
            onChange={(e) => setWeatherApiKey(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSaveWeatherApiKey}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Get a free API key from{' '}
          <a
            href="https://openweathermap.org/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            OpenWeatherMap
          </a>
        </p>
      </div>

      {/* Weather Theme Rules */}
      {weatherConfig && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Weather Theme Rules</h4>
          
          {Object.entries(weatherConfig.rules).map(([weatherType, themeRule]) => {
            const icons = {
              sunny: Sun,
              cloudy: Cloud,
              rainy: CloudRain,
              snowy: CloudSnow,
              stormy: Zap
            };
            const Icon = icons[weatherType as keyof typeof icons];
            
            return (
              <div
                key={weatherType}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {weatherType}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {themeRule.mode} mode • {themeVariants[themeRule.variant]?.name}
                    </div>
                  </div>
                </div>
                <div
                  className="w-8 h-8 rounded-full border border-gray-300"
                  style={{ 
                    background: themeVariants[themeRule.variant]?.gradient || '#ccc'
                  }}
                />
              </div>
            );
          })}
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
              Location & Weather Themes
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'location', label: 'Location Themes', icon: MapPin },
              { key: 'weather', label: 'Weather Themes', icon: CloudRain }
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
          {activeTab === 'location' ? <LocationTab /> : <WeatherTab />}
        </div>
      </div>
      
      {/* Add Rule Modal */}
      {showAddRule && <AddRuleForm />}
    </div>
  );
};

export default LocationThemeSettings;