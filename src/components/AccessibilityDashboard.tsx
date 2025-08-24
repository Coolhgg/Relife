/**
 * Enhanced Accessibility Dashboard
 * Comprehensive accessibility settings interface with live preview
 */

import React, { useState, useRef, useEffect as _useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Volume2,
  VolumeX as _VolumeX,
  Keyboard,
  Smartphone,
  Monitor,
  Palette,
  Type,
  MousePointer,
  Settings,
  RotateCcw,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useAccessibilityPreferences } from '../hooks/useAccessibilityPreferences';
import { useDynamicFocus } from '../hooks/useDynamicFocus';
import { ScreenReaderTester } from './ScreenReaderProvider';
import ExtendedScreenReaderTester from './ExtendedScreenReaderTester';
import { TimeoutHandle } from '../types/timers';

interface AccessibilityDashboardProps {
  onClose?: () => void;
  embedded?: boolean;
}

const AccessibilityDashboard: React.FC<AccessibilityDashboardProps> = ({
  onClose,
  embedded = false,
}) => {
  const { preferences, updatePreferences, resetToDefaults, testColorContrast } =
    useAccessibilityPreferences();
  const [activeSection, setActiveSection] = useState<string>('visual');
  const [_showPreview, _setShowPreview] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const {
    announce,
    announceSuccess,
    announceError: _announceError,
  } = useDynamicFocus({
    announceChanges: true,
    liveRegionPoliteness: 'polite',
  });

  const sections = [
    { id: 'visual', label: 'Visual & Display', icon: Eye },
    { id: 'navigation', label: 'Navigation & Focus', icon: MousePointer },
    { id: 'audio', label: 'Audio & Speech', icon: Volume2 },
    { id: 'touch', label: 'Touch & Interaction', icon: Smartphone },
    { id: 'testing', label: 'Screen Reader Testing', icon: Volume2 },
    { id: 'advanced', label: 'Advanced Features', icon: Settings },
  ];

  // Handle section navigation
  const navigateToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    announce(`Switched to ${sections.find(s => s.id === sectionId)?.label} settings`);

    // Focus the section
    setTimeout(() => {
      const sectionElement = sectionRefs.current[sectionId];
      if (sectionElement) {
        sectionElement.focus();
      }
    }, 100);
  };

  // Handle preference updates with announcements
  const handlePreferenceUpdate = (key: string, value: any, description: string) => {
    updatePreferences({ [key]: value });
    announce(`${description} ${value ? 'enabled' : 'disabled'}`);
  };

  // Reset all preferences
  const handleReset = () => {
    resetToDefaults();
    announceSuccess('Accessibility preferences reset to defaults');
  };

  // Visual & Display Section
  const renderVisualSection = () => (
    <div
      ref={(el: any) => // auto: implicit any {
        sectionRefs.current['visual'] = el;
      }}
      className="space-y-6"
      tabIndex={-1}
      role="tabpanel"
      aria-labelledby="visual-tab"
    >
      <h3
        id="visual-heading"
        className="text-lg font-semibold text-gray-900 dark:text-white"
      >
        Visual & Display Settings
      </h3>

      {/* High Contrast Mode */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="high-contrast">
          <Monitor className="w-5 h-5" aria-hidden="true" />
          High Contrast Mode
        </label>
        <p className="setting-description">
          Increases contrast between text and background for better visibility
        </p>
        <input
          id="high-contrast"
          type="checkbox"
          checked={preferences.highContrastMode}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'highContrastMode',
              e.target.checked,
              'High contrast mode'
            )
          }
          className="setting-toggle"
          aria-describedby="high-contrast-desc"
        />
        <span id="high-contrast-desc" className="sr-only">
          {preferences.highContrastMode ? 'Currently enabled' : 'Currently disabled'}
        </span>
      </div>

      {/* Font Size */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="font-size">
          <Type className="w-5 h-5" aria-hidden="true" />
          Font Size
        </label>
        <p className="setting-description">
          Adjust text size throughout the application
        </p>
        <select
          id="font-size"
          value={preferences.fontSize}
          onChange={(e: any) => // auto: implicit any {
            updatePreferences({ fontSize: e.target.value as any });
            announce(`Font size changed to ${e.target.value}`);
          }}
          className="setting-select"
          aria-describedby="font-size-desc"
        >
          <option value="small">Small (14px)</option>
          <option value="medium">Medium (16px)</option>
          <option value="large">Large (18px)</option>
          <option value="extra-large">Extra Large (20px)</option>
        </select>
        <span id="font-size-desc" className="sr-only">
          Current font size: {preferences.fontSize}
        </span>
      </div>

      {/* Color Blind Friendly */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="color-blind-friendly">
          <Palette className="w-5 h-5" aria-hidden="true" />
          Color Blind Friendly Colors
        </label>
        <p className="setting-description">
          Use colors that are distinguishable for color vision deficiencies
        </p>
        <input
          id="color-blind-friendly"
          type="checkbox"
          checked={preferences.colorBlindFriendly}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'colorBlindFriendly',
              e.target.checked,
              'Color blind friendly mode'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Reduced Motion */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="reduced-motion">
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
          Reduce Motion
        </label>
        <p className="setting-description">
          Minimize animations and transitions that may cause discomfort
        </p>
        <input
          id="reduced-motion"
          type="checkbox"
          checked={preferences.reducedMotion}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate('reducedMotion', e.target.checked, 'Reduced motion')
          }
          className="setting-toggle"
        />
      </div>
    </div>
  );

  // Navigation & Focus Section
  const renderNavigationSection = () => (
    <div
      ref={(el: any) => // auto: implicit any {
        sectionRefs.current['navigation'] = el;
      }}
      className="space-y-6"
      tabIndex={-1}
      role="tabpanel"
      aria-labelledby="navigation-tab"
    >
      <h3
        id="navigation-heading"
        className="text-lg font-semibold text-gray-900 dark:text-white"
      >
        Navigation & Focus Settings
      </h3>

      {/* Enhanced Focus Rings */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="enhanced-focus">
          <MousePointer className="w-5 h-5" aria-hidden="true" />
          Enhanced Focus Rings
        </label>
        <p className="setting-description">
          Show larger, more visible focus indicators for better keyboard navigation
        </p>
        <input
          id="enhanced-focus"
          type="checkbox"
          checked={preferences.enhancedFocusRings}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'enhancedFocusRings',
              e.target.checked,
              'Enhanced focus rings'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Focus Ring Color */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="focus-ring-color">
          <Palette className="w-5 h-5" aria-hidden="true" />
          Focus Ring Color
        </label>
        <p className="setting-description">Choose the color for focus indicators</p>
        <select
          id="focus-ring-color"
          value={preferences.focusRingColor}
          onChange={(e: any) => // auto: implicit any {
            updatePreferences({ focusRingColor: e.target.value });
            announce(`Focus ring color changed to ${e.target.value}`);
          }}
          className="setting-select"
        >
          <option value="#007AFF">Blue</option>
          <option value="#FF3B30">Red</option>
          <option value="#34C759">Green</option>
          <option value="#FF9500">Orange</option>
          <option value="#AF52DE">Purple</option>
          <option value="#000000">Black</option>
        </select>
      </div>

      {/* Skip Links Visibility */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="skip-links">
          <Keyboard className="w-5 h-5" aria-hidden="true" />
          Always Show Skip Links
        </label>
        <p className="setting-description">
          Make navigation skip links visible at all times instead of only on focus
        </p>
        <input
          id="skip-links"
          type="checkbox"
          checked={preferences.skipLinksVisible}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'skipLinksVisible',
              e.target.checked,
              'Skip links visibility'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Keyboard Navigation */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="keyboard-nav">
          <Keyboard className="w-5 h-5" aria-hidden="true" />
          Keyboard Navigation
        </label>
        <p className="setting-description">
          Enable enhanced keyboard shortcuts and navigation patterns
        </p>
        <input
          id="keyboard-nav"
          type="checkbox"
          checked={preferences.keyboardNavigation}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'keyboardNavigation',
              e.target.checked,
              'Keyboard navigation'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Screen Reader Testing */}
      <div className="setting-group">
        <ScreenReaderTester />
      </div>
    </div>
  );

  // Audio & Speech Section
  const renderAudioSection = () => (
    <div
      ref={(el: any) => // auto: implicit any {
        sectionRefs.current['audio'] = el;
      }}
      className="space-y-6"
      tabIndex={-1}
      role="tabpanel"
      aria-labelledby="audio-tab"
    >
      <h3
        id="audio-heading"
        className="text-lg font-semibold text-gray-900 dark:text-white"
      >
        Audio & Speech Settings
      </h3>

      {/* Screen Reader Optimization */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="screen-reader">
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          Screen Reader Optimization
        </label>
        <p className="setting-description">
          Optimize interface for screen readers with enhanced descriptions
        </p>
        <input
          id="screen-reader"
          type="checkbox"
          checked={preferences.screenReaderOptimized}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'screenReaderOptimized',
              e.target.checked,
              'Screen reader optimization'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Announce Transitions */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="announce-transitions">
          <Info className="w-5 h-5" aria-hidden="true" />
          Announce Page Changes
        </label>
        <p className="setting-description">
          Announce when navigating between different sections
        </p>
        <input
          id="announce-transitions"
          type="checkbox"
          checked={preferences.announceTransitions}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'announceTransitions',
              e.target.checked,
              'Transition announcements'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Announce Errors */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="announce-errors">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          Announce Errors
        </label>
        <p className="setting-description">
          Automatically announce error messages to screen readers
        </p>
        <input
          id="announce-errors"
          type="checkbox"
          checked={preferences.announceErrors}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'announceErrors',
              e.target.checked,
              'Error announcements'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Announce Success */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="announce-success">
          <Check className="w-5 h-5" aria-hidden="true" />
          Announce Success Messages
        </label>
        <p className="setting-description">
          Automatically announce success messages to screen readers
        </p>
        <input
          id="announce-success"
          type="checkbox"
          checked={preferences.announceSuccess}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'announceSuccess',
              e.target.checked,
              'Success announcements'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Speech Rate */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="speech-rate">
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          Speech Rate
        </label>
        <p className="setting-description">
          Adjust the speed of text-to-speech announcements
        </p>
        <input
          id="speech-rate"
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={preferences.speechRate}
          onChange={(e: any) => // auto: implicit any {
            const rate = parseFloat(e.target.value);
            updatePreferences({ speechRate: rate });
            announce(`Speech rate set to ${rate}x speed`);
          }}
          className="setting-range w-full"
          aria-describedby="speech-rate-desc"
        />
        <span
          id="speech-rate-desc"
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {preferences.speechRate}x speed
        </span>
      </div>
    </div>
  );

  // Touch & Interaction Section
  const renderTouchSection = () => (
    <div
      ref={(el: any) => // auto: implicit any {
        sectionRefs.current['touch'] = el;
      }}
      className="space-y-6"
      tabIndex={-1}
      role="tabpanel"
      aria-labelledby="touch-tab"
    >
      <h3
        id="touch-heading"
        className="text-lg font-semibold text-gray-900 dark:text-white"
      >
        Touch & Interaction Settings
      </h3>

      {/* Larger Touch Targets */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="large-touch">
          <Smartphone className="w-5 h-5" aria-hidden="true" />
          Larger Touch Targets
        </label>
        <p className="setting-description">
          Increase button and link sizes for easier touch interaction
        </p>
        <input
          id="large-touch"
          type="checkbox"
          checked={preferences.largerTouchTargets}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'largerTouchTargets',
              e.target.checked,
              'Larger touch targets'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Haptic Feedback */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="haptic-feedback">
          <Smartphone className="w-5 h-5" aria-hidden="true" />
          Haptic Feedback
        </label>
        <p className="setting-description">
          Enable vibration feedback for touch interactions (mobile devices)
        </p>
        <input
          id="haptic-feedback"
          type="checkbox"
          checked={preferences.hapticFeedback}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'hapticFeedback',
              e.target.checked,
              'Haptic feedback'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Long Press Delay */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="long-press-delay">
          <MousePointer className="w-5 h-5" aria-hidden="true" />
          Long Press Delay
        </label>
        <p className="setting-description">
          Adjust how long to hold before triggering long press actions
        </p>
        <select
          id="long-press-delay"
          value={preferences.longPressDelay}
          onChange={(e: any) => // auto: implicit any {
            const delay = parseInt(e.target.value);
            updatePreferences({ longPressDelay: delay });
            announce(`Long press delay set to ${delay} milliseconds`);
          }}
          className="setting-select"
        >
          <option value={300}>Fast (300ms)</option>
          <option value={500}>Normal (500ms)</option>
          <option value={750}>Slow (750ms)</option>
          <option value={1000}>Very Slow (1000ms)</option>
        </select>
      </div>
    </div>
  );

  // Advanced Features Section
  const renderAdvancedSection = () => (
    <div
      ref={(el: any) => // auto: implicit any {
        sectionRefs.current['advanced'] = el;
      }}
      className="space-y-6"
      tabIndex={-1}
      role="tabpanel"
      aria-labelledby="advanced-tab"
    >
      <h3
        id="advanced-heading"
        className="text-lg font-semibold text-gray-900 dark:text-white"
      >
        Advanced Features
      </h3>

      {/* Voice Commands */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="voice-commands">
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          Voice Commands
        </label>
        <p className="setting-description">
          Enable voice control for app navigation and alarm management
        </p>
        <input
          id="voice-commands"
          type="checkbox"
          checked={preferences.voiceCommands}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate('voiceCommands', e.target.checked, 'Voice commands')
          }
          className="setting-toggle"
        />
      </div>

      {/* Gesture Navigation */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="gesture-nav">
          <MousePointer className="w-5 h-5" aria-hidden="true" />
          Gesture Navigation
        </label>
        <p className="setting-description">
          Enable swipe gestures and other touch-based navigation
        </p>
        <input
          id="gesture-nav"
          type="checkbox"
          checked={preferences.gestureNavigation}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'gestureNavigation',
              e.target.checked,
              'Gesture navigation'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Autoplay Media */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="autoplay">
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          Autoplay Media
        </label>
        <p className="setting-description">
          Allow videos and audio to play automatically
        </p>
        <input
          id="autoplay"
          type="checkbox"
          checked={preferences.autoplay}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate('autoplay', e.target.checked, 'Autoplay media')
          }
          className="setting-toggle"
        />
      </div>

      {/* Blinking Elements */}
      <div className="setting-group">
        <label className="setting-label" htmlFor="blinking-elements">
          <EyeOff className="w-5 h-5" aria-hidden="true" />
          Allow Blinking Elements
        </label>
        <p className="setting-description">
          Allow flashing animations and blinking indicators (may trigger seizures)
        </p>
        <input
          id="blinking-elements"
          type="checkbox"
          checked={preferences.blinkingElements}
          onChange={(e: any) => // auto: implicit any
            handlePreferenceUpdate(
              'blinkingElements',
              e.target.checked,
              'Blinking elements'
            )
          }
          className="setting-toggle"
        />
      </div>

      {/* Color Contrast Testing */}
      <div className="setting-group">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="setting-label">
              <Eye className="w-5 h-5" aria-hidden="true" />
              Color Contrast Testing
            </h4>
            <p className="setting-description">
              Test color combinations for WCAG compliance
            </p>
          </div>
          <button
            onClick={() => {
              const result = testColorContrast('#000000', '#ffffff');
              announce(
                `Contrast ratio test: ${result.ratio}:1, WCAG AA ${result.wcagAA ? 'pass' : 'fail'}`
              );
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            aria-label="Test color contrast between black and white"
          >
            Test Contrast
          </button>
        </div>
      </div>
    </div>
  );

  // Screen Reader Testing Section
  const renderTestingSection = () => (
    <div
      ref={(el: any) => // auto: implicit any {
        sectionRefs.current['testing'] = el;
      }}
      className="space-y-6"
      tabIndex={-1}
      role="tabpanel"
      aria-labelledby="testing-tab"
    >
      <h3
        id="testing-heading"
        className="text-lg font-semibold text-gray-900 dark:text-white"
      >
        Screen Reader Testing
      </h3>

      {/* Basic Screen Reader Tester */}
      <div className="setting-group">
        <h4 className="setting-label">
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          Basic Screen Reader Tests
        </h4>
        <p className="setting-description mb-4">
          Test basic screen reader functionality with simple announcements
        </p>
        <ScreenReaderTester />
      </div>

      {/* Extended Screen Reader Tester */}
      <div className="setting-group">
        <h4 className="setting-label">
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          Comprehensive App Testing
        </h4>
        <p className="setting-description mb-4">
          Test all Relife app features with custom scenarios including voice features,
          battles, smart scheduling, and more
        </p>
        <ExtendedScreenReaderTester
          embedded={true}
          userName="Test User"
          isPremium={false}
          onTestComplete={(testId, success) => {
            announce(
              success
                ? `Test ${testId} completed successfully`
                : `Test ${testId} failed`
            );
          }}
        />
      </div>
    </div>
  );

  return (
    <div className={`accessibility-dashboard ${embedded ? 'embedded' : 'standalone'}`}>
      {!embedded && (
        <header className="dashboard-header">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Accessibility Settings
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="dashboard-close-btn"
              aria-label="Close accessibility settings"
            >
              ×
            </button>
          )}
        </header>
      )}

      <div className="dashboard-content">
        {/* Section Navigation */}
        <nav
          className="dashboard-nav"
          role="tablist"
          aria-label="Accessibility settings sections"
        >
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                id={`${section.id}-tab`}
                role="tab"
                aria-selected={activeSection === section.id}
                aria-controls={`${section.id}-panel`}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => navigateToSection(section.id)}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {section.label}
              </button>
            );
          })}
        </nav>

        {/* Settings Sections */}
        <main className="dashboard-main">
          {activeSection === 'visual' && renderVisualSection()}
          {activeSection === 'navigation' && renderNavigationSection()}
          {activeSection === 'audio' && renderAudioSection()}
          {activeSection === 'touch' && renderTouchSection()}
          {activeSection === 'testing' && renderTestingSection()}
          {activeSection === 'advanced' && renderAdvancedSection()}
        </main>

        {/* Reset Button */}
        <div className="dashboard-footer">
          <button
            onClick={handleReset}
            className="reset-button"
            aria-label="Reset all accessibility preferences to default values"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Reset to Defaults
          </button>
        </div>
      </div>

      <style>{`
        .accessibility-dashboard {
          @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg;
        }

        .dashboard-header {
          @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
        }

        .dashboard-content {
          @apply p-6;
        }

        .dashboard-nav {
          @apply flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4;
        }

        .nav-item {
          @apply flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
                 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
        }

        .nav-item.active {
          @apply bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300;
        }

        .setting-group {
          @apply space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg;
        }

        .setting-label {
          @apply flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white;
        }

        .setting-description {
          @apply text-sm text-gray-600 dark:text-gray-400;
        }

        .setting-toggle {
          @apply w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded
                 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600
                 dark:bg-gray-700 dark:border-gray-600;
        }

        .setting-select {
          @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600
                 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700
                 text-gray-900 dark:text-white focus:outline-none
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
        }

        .setting-range {
          @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-blue-500;
        }

        .setting-range::-webkit-slider-thumb {
          @apply appearance-none w-5 h-5 bg-blue-600 rounded-full cursor-pointer;
        }

        .setting-range::-moz-range-thumb {
          @apply w-5 h-5 bg-blue-600 rounded-full cursor-pointer border-0;
        }

        .reset-button {
          @apply flex items-center gap-2 px-4 py-2 text-sm font-medium
                 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200
                 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors;
        }
      `}</style>
    </div>
  );
};

export default AccessibilityDashboard;
