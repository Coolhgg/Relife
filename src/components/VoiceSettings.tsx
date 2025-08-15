import React, { useState, useEffect } from 'react';
import { VoiceProService, type VoiceProvider, type VoiceOption } from '../services/voice-pro';
import type { VoiceMood } from '../types';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: VoiceConfiguration) => void;
  currentSettings?: VoiceConfiguration;
}

interface VoiceConfiguration {
  preferredProvider: string;
  voiceMappings: { [mood in VoiceMood]: string };
  apiKeys: { [provider: string]: string };
  globalSettings: {
    speed: number;
    pitch: number;
    volume: number;
    cacheEnabled: boolean;
    offlineMode: boolean;
  };
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings
}) => {
  const [providers, setProviders] = useState<VoiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('elevenlabs');
  const [voiceMappings, setVoiceMappings] = useState<{ [mood in VoiceMood]: string }>({
    'drill-sergeant': '',
    'sweet-angel': '',
    'anime-hero': '',
    'savage-roast': '',
    'motivational': '',
    'gentle': ''
  });
  const [apiKeys, setApiKeys] = useState<{ [provider: string]: string }>({});
  const [globalSettings, setGlobalSettings] = useState({
    speed: 1.0,
    pitch: 1.0,
    volume: 0.9,
    cacheEnabled: true,
    offlineMode: false
  });
  const [testingVoice, setTestingVoice] = useState<VoiceMood | null>(null);
  const [validatingKey, setValidatingKey] = useState(false);
  const [keyValidation, setKeyValidation] = useState<{ [provider: string]: boolean }>({});

  useEffect(() => {
    const loadSettings = async () => {
      try {
        await VoiceProService.initialize();
        const availableProviders = VoiceProService.getProviders();
        setProviders(availableProviders);

        // Load current settings if provided
        if (currentSettings) {
          setSelectedProvider(currentSettings.preferredProvider);
          setVoiceMappings(currentSettings.voiceMappings);
          setApiKeys(currentSettings.apiKeys);
          setGlobalSettings(currentSettings.globalSettings);
        } else {
          // Load from localStorage
          const savedProvider = localStorage.getItem('preferred_voice_provider') || 'elevenlabs';
          setSelectedProvider(savedProvider);
          
          // Note: API keys should not be stored in localStorage for security reasons
          // They should be managed server-side or through secure environment variables
          setApiKeys({ elevenlabs: '' });
        }
      } catch (error) {
        console.error('Error loading voice settings:', error);
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, currentSettings]);

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
  };

  const handleVoiceMoodChange = (mood: VoiceMood, voiceId: string) => {
    setVoiceMappings(prev => ({
      ...prev,
      [mood]: voiceId
    }));
  };

  const handleApiKeyChange = (provider: string, key: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: key
    }));
  };

  const validateApiKey = async (provider: string, key: string) => {
    if (!key.trim()) return;
    
    setValidatingKey(true);
    try {
      const isValid = await VoiceProService.setApiKey(provider, key);
      setKeyValidation(prev => ({
        ...prev,
        [provider]: isValid
      }));
    } catch (error) {
      console.error('Error validating API key:', error);
      setKeyValidation(prev => ({
        ...prev,
        [provider]: false
      }));
    } finally {
      setValidatingKey(false);
    }
  };

  const testVoice = async (mood: VoiceMood) => {
    setTestingVoice(mood);
    try {
      await VoiceProService.testVoice(mood);
    } catch (error) {
      console.error('Error testing voice:', error);
    } finally {
      setTestingVoice(null);
    }
  };

  const handleSave = () => {
    const configuration: VoiceConfiguration = {
      preferredProvider: selectedProvider,
      voiceMappings,
      apiKeys,
      globalSettings
    };

    // Save provider preference only (not API keys for security)
    localStorage.setItem('preferred_voice_provider', selectedProvider);
    // Note: API keys should not be stored in localStorage for security reasons

    onSave(configuration);
    onClose();
  };

  const clearCache = async () => {
    try {
      await VoiceProService.clearCache();
      alert('Voice cache cleared successfully!');
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error clearing cache. Please try again.');
    }
  };

  if (!isOpen) return null;

  const selectedProviderData = providers.find(p => p.id === selectedProvider);
  const moods: VoiceMood[] = ['drill-sergeant', 'sweet-angel', 'anime-hero', 'savage-roast', 'motivational', 'gentle'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto glass">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Voice Settings</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-8">
          {/* Provider Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Voice Provider</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map(provider => (
                <div
                  key={provider.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedProvider === provider.id
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => handleProviderChange(provider.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{provider.name}</h4>
                    {provider.premium && (
                      <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs rounded-full font-semibold">
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm">
                    {provider.voices.length} voices • {provider.languages.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* API Key Configuration */}
          {selectedProviderData?.premium && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">API Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">
                    {selectedProviderData.name} API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKeys[selectedProvider] || ''}
                      onChange={(e) => handleApiKeyChange(selectedProvider, e.target.value)}
                      placeholder="Enter your API key"
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <button
                      onClick={() => validateApiKey(selectedProvider, apiKeys[selectedProvider] || '')}
                      disabled={validatingKey || !apiKeys[selectedProvider]?.trim()}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {validatingKey ? 'Validating...' : 'Validate'}
                    </button>
                  </div>
                  {keyValidation[selectedProvider] !== undefined && (
                    <p className={`mt-2 text-sm ${keyValidation[selectedProvider] ? 'text-green-400' : 'text-red-400'}`}>
                      {keyValidation[selectedProvider] ? '✓ API key is valid' : '✗ Invalid API key'}
                    </p>
                  )}
                  <p className="text-white/60 text-sm mt-2">
                    Get your API key from {selectedProviderData.name}'s dashboard
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Voice Mood Mappings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Voice Mood Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moods.map(mood => {
                const moodVoices = VoiceProService.getVoicesForMood(mood);
                const currentVoice = voiceMappings[mood];
                
                return (
                  <div key={mood} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white capitalize">
                        {mood.replace('-', ' ')}
                      </h4>
                      <button
                        onClick={() => testVoice(mood)}
                        disabled={testingVoice === mood}
                        className="px-3 py-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white text-sm rounded font-medium transition-colors"
                      >
                        {testingVoice === mood ? 'Testing...' : 'Test'}
                      </button>
                    </div>
                    
                    <select
                      value={currentVoice}
                      onChange={(e) => handleVoiceMoodChange(mood, e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">Select voice...</option>
                      {selectedProviderData?.voices.map(voice => (
                        <option key={voice.id} value={voice.id} className="bg-gray-800">
                          {voice.name} ({voice.gender}, {voice.quality})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Global Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Global Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-white/80 mb-2">
                  Speed: {globalSettings.speed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={globalSettings.speed}
                  onChange={(e) => setGlobalSettings(prev => ({
                    ...prev,
                    speed: parseFloat(e.target.value)
                  }))}
                  className="w-full accent-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">
                  Pitch: {globalSettings.pitch.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={globalSettings.pitch}
                  onChange={(e) => setGlobalSettings(prev => ({
                    ...prev,
                    pitch: parseFloat(e.target.value)
                  }))}
                  className="w-full accent-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">
                  Volume: {Math.round(globalSettings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={globalSettings.volume}
                  onChange={(e) => setGlobalSettings(prev => ({
                    ...prev,
                    volume: parseFloat(e.target.value)
                  }))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={globalSettings.cacheEnabled}
                  onChange={(e) => setGlobalSettings(prev => ({
                    ...prev,
                    cacheEnabled: e.target.checked
                  }))}
                  className="mr-3 accent-purple-500"
                />
                Enable voice caching for faster playback
              </label>
              
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={globalSettings.offlineMode}
                  onChange={(e) => setGlobalSettings(prev => ({
                    ...prev,
                    offlineMode: e.target.checked
                  }))}
                  className="mr-3 accent-purple-500"
                />
                Prioritize offline voices when available
              </label>
            </div>
          </div>

          {/* Cache Management */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Cache Management</h3>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div>
                <p className="text-white font-medium">Voice Cache</p>
                <p className="text-white/60 text-sm">Clear cached voice messages to free up storage</p>
              </div>
              <button
                onClick={clearCache}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 text-white/80 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;