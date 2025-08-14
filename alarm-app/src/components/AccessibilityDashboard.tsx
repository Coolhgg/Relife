import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Smartphone, 
  Keyboard, 
  Settings,
  Accessibility,
  Play,
  Pause,
  RotateCcw,
  TestTube,
  Info,
  CheckCircle,
  AlertCircle,
  Zap,
  Hand,
  Target,
  MessageSquare
} from 'lucide-react';
import ScreenReaderService from '../utils/screen-reader';
import KeyboardNavigationService from '../utils/keyboard-navigation';
import VoiceAccessibilityService from '../utils/voice-accessibility';
import MobileAccessibilityService from '../utils/mobile-accessibility';
import { checkContrastAccessibility, isHighContrastMode, prefersReducedMotion } from '../utils/accessibility';
import { ScreenReaderTester } from './ScreenReaderProvider';

interface AccessibilityState {
  screenReader: any;
  keyboard: any;
  voice: any;
  mobile: any;
}

const AccessibilityDashboard: React.FC = () => {
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    screenReader: {},
    keyboard: {},
    voice: {},
    mobile: {}
  });
  const [activeSection, setActiveSection] = useState<'overview' | 'screen-reader' | 'keyboard' | 'voice' | 'mobile' | 'testing'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    loadAccessibilityState();
  }, []);

  const loadAccessibilityState = async () => {
    try {
      setIsLoading(true);
      const screenReaderService = ScreenReaderService.getInstance();
      const keyboardService = KeyboardNavigationService.getInstance();
      const voiceService = VoiceAccessibilityService.getInstance();
      const mobileService = MobileAccessibilityService.getInstance();

      setAccessibilityState({
        screenReader: screenReaderService.getState(),
        keyboard: keyboardService.getState(),
        voice: voiceService.getState(),
        mobile: mobileService.getState()
      });
    } catch (error) {
      console.error('Failed to load accessibility state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateScreenReaderSettings = (settings: any) => {
    const service = ScreenReaderService.getInstance();
    service.updateSettings(settings);
    loadAccessibilityState();
  };

  const updateVoiceSettings = (settings: any) => {
    const service = VoiceAccessibilityService.getInstance();
    service.updateSettings(settings);
    loadAccessibilityState();
  };

  const updateMobileSettings = (settings: any) => {
    const service = MobileAccessibilityService.getInstance();
    service.updateSettings(settings);
    loadAccessibilityState();
  };

  const runAccessibilityTests = () => {
    const results = [];
    
    // Color contrast test
    const contrastTest = checkContrastAccessibility('#000000', '#ffffff');
    results.push({
      name: 'Color Contrast',
      status: contrastTest.isAccessible ? 'pass' : 'fail',
      details: `Contrast ratio: ${contrastTest.ratio}, Level: ${contrastTest.level}`,
      recommendations: contrastTest.recommendations
    });

    // High contrast mode detection
    results.push({
      name: 'High Contrast Mode',
      status: isHighContrastMode() ? 'detected' : 'not-detected',
      details: isHighContrastMode() ? 'System high contrast mode is active' : 'Normal contrast mode'
    });

    // Reduced motion detection
    results.push({
      name: 'Reduced Motion Preference',
      status: prefersReducedMotion() ? 'detected' : 'not-detected',
      details: prefersReducedMotion() ? 'User prefers reduced motion' : 'Normal motion allowed'
    });

    // Touch targets test
    const touchTargets = document.querySelectorAll('button, [role="button"], input, select');
    const smallTargets = Array.from(touchTargets).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    });
    
    results.push({
      name: 'Touch Target Size',
      status: smallTargets.length === 0 ? 'pass' : 'warning',
      details: `${smallTargets.length} elements smaller than 44px minimum`,
      recommendations: smallTargets.length > 0 ? ['Increase touch target size to at least 44px'] : undefined
    });

    // ARIA labels test
    const unlabeledElements = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby]):not([id])');
    results.push({
      name: 'ARIA Labels',
      status: unlabeledElements.length === 0 ? 'pass' : 'warning',
      details: `${unlabeledElements.length} elements without proper labels`,
      recommendations: unlabeledElements.length > 0 ? ['Add aria-label or aria-labelledby to all interactive elements'] : undefined
    });

    setTestResults(results);
  };

  const renderOverview = () => (
    <div className="space-y-6" role="tabpanel" aria-labelledby="overview-tab">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-6 h-6 text-blue-600" aria-hidden="true" />
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              accessibilityState.screenReader.isEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {accessibilityState.screenReader.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Screen Reader</h3>
          <p className="text-sm text-gray-600 mt-1">
            Enhanced announcements and ARIA support
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-2">
            <Keyboard className="w-6 h-6 text-purple-600" aria-hidden="true" />
            <span className="px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Keyboard Navigation</h3>
          <p className="text-sm text-gray-600 mt-1">
            Advanced shortcuts and focus management
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-2">
            <Mic className="w-6 h-6 text-green-600" aria-hidden="true" />
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              accessibilityState.voice.isEnabled && accessibilityState.voice.isListening
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {accessibilityState.voice.isEnabled ? 'Ready' : 'Disabled'}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Voice Control</h3>
          <p className="text-sm text-gray-600 mt-1">
            Voice commands and accessibility
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-2">
            <Smartphone className="w-6 h-6 text-orange-600" aria-hidden="true" />
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              accessibilityState.mobile.isEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {accessibilityState.mobile.isEnabled ? 'Active' : 'Desktop'}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Mobile Support</h3>
          <p className="text-sm text-gray-600 mt-1">
            Touch gestures and mobile optimization
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" aria-hidden="true" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Quick Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Press Alt+H to hear keyboard shortcuts</li>
              <li>Say "voice help" for voice commands</li>
              <li>Use two-finger tap to toggle screen reader</li>
              <li>Long press for context menus on mobile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScreenReaderPanel = () => (
    <div className="space-y-6" role="tabpanel" aria-labelledby="screen-reader-tab">
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Screen Reader Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enhanced Mode</label>
              <p className="text-sm text-gray-500">Enable advanced screen reader features</p>
            </div>
            <button
              onClick={() => updateScreenReaderSettings({ 
                isEnabled: !accessibilityState.screenReader.isEnabled 
              })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                accessibilityState.screenReader.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={accessibilityState.screenReader.isEnabled}
              aria-labelledby="enhanced-mode-label"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  accessibilityState.screenReader.isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Verbosity Level</label>
            <div className="space-x-4">
              {['low', 'medium', 'high'].map((level) => (
                <label key={level} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="verbosity"
                    value={level}
                    checked={accessibilityState.screenReader.verbosityLevel === level}
                    onChange={() => updateScreenReaderSettings({ verbosityLevel: level })}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="speech-rate" className="text-sm font-medium text-gray-700">Speech Rate</label>
            <input
              id="speech-rate"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={accessibilityState.screenReader.speechRate || 1.0}
              onChange={(e) => updateScreenReaderSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full"
              aria-label="Speech rate slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Slow</span>
              <span>{accessibilityState.screenReader.speechRate || 1.0}x</span>
              <span>Fast</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto Announce Changes</label>
              <p className="text-sm text-gray-500">Automatically announce UI changes</p>
            </div>
            <button
              onClick={() => updateScreenReaderSettings({ 
                autoAnnounceChanges: !accessibilityState.screenReader.autoAnnounceChanges 
              })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                accessibilityState.screenReader.autoAnnounceChanges ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={accessibilityState.screenReader.autoAnnounceChanges}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  accessibilityState.screenReader.autoAnnounceChanges ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <ScreenReaderTester />
    </div>
  );

  const renderVoicePanel = () => (
    <div className="space-y-6" role="tabpanel" aria-labelledby="voice-tab">
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice Control Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Voice Recognition</label>
              <p className="text-sm text-gray-500">Enable voice commands for navigation and control</p>
            </div>
            <button
              onClick={() => updateVoiceSettings({ 
                isEnabled: !accessibilityState.voice.isEnabled 
              })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                accessibilityState.voice.isEnabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={accessibilityState.voice.isEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  accessibilityState.voice.isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <label htmlFor="voice-language" className="text-sm font-medium text-gray-700">Language</label>
            <select
              id="voice-language"
              value={accessibilityState.voice.language || 'en-US'}
              onChange={(e) => updateVoiceSettings({ language: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="confidence-threshold" className="text-sm font-medium text-gray-700">Confidence Threshold</label>
            <input
              id="confidence-threshold"
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={accessibilityState.voice.confidence || 0.7}
              onChange={(e) => updateVoiceSettings({ confidence: parseFloat(e.target.value) })}
              className="w-full"
              aria-label="Voice confidence threshold"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low</span>
              <span>{Math.round((accessibilityState.voice.confidence || 0.7) * 100)}%</span>
              <span>High</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Require Confirmation</label>
              <p className="text-sm text-gray-500">Ask for confirmation before destructive actions</p>
            </div>
            <button
              onClick={() => updateVoiceSettings({ 
                requireConfirmation: !accessibilityState.voice.requireConfirmation 
              })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                accessibilityState.voice.requireConfirmation ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={accessibilityState.voice.requireConfirmation}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  accessibilityState.voice.requireConfirmation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice Control Test</h3>
        <div className="space-y-3">
          <div className="flex space-x-3">
            <button
              onClick={() => {
                const service = VoiceAccessibilityService.getInstance();
                if (accessibilityState.voice.isListening) {
                  service.stopListening();
                } else {
                  service.startListening();
                }
                loadAccessibilityState();
              }}
              disabled={!accessibilityState.voice.isEnabled}
              className={`flex-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                accessibilityState.voice.isListening 
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
            >
              {accessibilityState.voice.isListening ? (
                <>
                  <MicOff className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
                  Start Listening
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Try saying: "go to dashboard", "create alarm", "voice help", or "list alarms"
          </p>
        </div>
      </div>
    </div>
  );

  const renderMobilePanel = () => (
    <div className="space-y-6" role="tabpanel" aria-labelledby="mobile-tab">
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile Accessibility Settings</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="touch-target-size" className="text-sm font-medium text-gray-700">Touch Target Size</label>
            <input
              id="touch-target-size"
              type="range"
              min="44"
              max="60"
              step="2"
              value={accessibilityState.mobile.touchTargetSize || 44}
              onChange={(e) => updateMobileSettings({ touchTargetSize: parseInt(e.target.value) })}
              className="w-full"
              aria-label="Touch target size slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>44px</span>
              <span>{accessibilityState.mobile.touchTargetSize || 44}px</span>
              <span>60px</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Haptic Feedback</label>
              <p className="text-sm text-gray-500">Vibration feedback for gestures</p>
            </div>
            <button
              onClick={() => updateMobileSettings({ 
                hapticFeedback: !accessibilityState.mobile.hapticFeedback 
              })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                accessibilityState.mobile.hapticFeedback ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={accessibilityState.mobile.hapticFeedback}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  accessibilityState.mobile.hapticFeedback ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Swipe Gestures</label>
              <p className="text-sm text-gray-500">Enable swipe navigation gestures</p>
            </div>
            <button
              onClick={() => updateMobileSettings({ 
                swipeGesturesEnabled: !accessibilityState.mobile.swipeGesturesEnabled 
              })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                accessibilityState.mobile.swipeGesturesEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={accessibilityState.mobile.swipeGesturesEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  accessibilityState.mobile.swipeGesturesEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Large Text</label>
              <p className="text-sm text-gray-500">Increase text size for better readability</p>
            </div>
            <button
              onClick={() => updateMobileSettings({ 
                largeText: !accessibilityState.mobile.largeText 
              })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                accessibilityState.mobile.largeText ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={accessibilityState.mobile.largeText}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  accessibilityState.mobile.largeText ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">High Contrast</label>
              <p className="text-sm text-gray-500">Increase contrast for better visibility</p>
            </div>
            <button
              onClick={() => updateMobileSettings({ 
                highContrast: !accessibilityState.mobile.highContrast 
              })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                accessibilityState.mobile.highContrast ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={accessibilityState.mobile.highContrast}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  accessibilityState.mobile.highContrast ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Gestures</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Hand className="w-4 h-4 text-blue-600 mr-2" aria-hidden="true" />
              <span className="text-sm font-medium">Swipe Left</span>
            </div>
            <p className="text-xs text-gray-600 ml-6">Next alarm</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Hand className="w-4 h-4 text-blue-600 mr-2" aria-hidden="true" />
              <span className="text-sm font-medium">Swipe Right</span>
            </div>
            <p className="text-xs text-gray-600 ml-6">Previous alarm</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Hand className="w-4 h-4 text-green-600 mr-2" aria-hidden="true" />
              <span className="text-sm font-medium">Swipe Up</span>
            </div>
            <p className="text-xs text-gray-600 ml-6">Dismiss alarm</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Hand className="w-4 h-4 text-orange-600 mr-2" aria-hidden="true" />
              <span className="text-sm font-medium">Swipe Down</span>
            </div>
            <p className="text-xs text-gray-600 ml-6">Snooze alarm</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTestingPanel = () => (
    <div className="space-y-6" role="tabpanel" aria-labelledby="testing-tab">
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Accessibility Tests</h3>
          <button
            onClick={runAccessibilityTests}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <TestTube className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
            Run Tests
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'pass' 
                    ? 'bg-green-50 border-green-200' 
                    : result.status === 'fail'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {result.status === 'pass' && (
                      <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
                    )}
                    {result.status === 'fail' && (
                      <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
                    )}
                    {result.status === 'warning' && (
                      <AlertCircle className="w-5 h-5 text-yellow-600" aria-hidden="true" />
                    )}
                    {(result.status === 'detected' || result.status === 'not-detected') && (
                      <Info className="w-5 h-5 text-blue-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="font-medium text-gray-900">{result.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                    {result.recommendations && (
                      <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                        {result.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading accessibility settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <Accessibility className="w-8 h-8 inline-block mr-3" aria-hidden="true" />
          Accessibility Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive accessibility settings and testing for the Smart Alarm app
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" role="tablist">
          {[
            { id: 'overview', label: 'Overview', icon: Settings },
            { id: 'screen-reader', label: 'Screen Reader', icon: Eye },
            { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
            { id: 'voice', label: 'Voice', icon: Mic },
            { id: 'mobile', label: 'Mobile', icon: Smartphone },
            { id: 'testing', label: 'Testing', icon: TestTube }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`${id}-tab`}
              role="tab"
              aria-selected={activeSection === id}
              aria-controls={`${id}-panel`}
              onClick={() => setActiveSection(id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeSection === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'screen-reader' && renderScreenReaderPanel()}
        {activeSection === 'voice' && renderVoicePanel()}
        {activeSection === 'mobile' && renderMobilePanel()}
        {activeSection === 'testing' && renderTestingPanel()}
        {activeSection === 'keyboard' && (
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyboard Navigation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Navigation Shortcuts</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Dashboard</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">Alt + D</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Alarms</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">Alt + A</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Settings</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">Alt + S</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">Alt + P</code>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Alarm Controls</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>New Alarm</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">Ctrl + N</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Toggle Alarm</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">Space</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Delete Alarm</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">Delete</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Edit Alarm</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">Enter</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessibilityDashboard;