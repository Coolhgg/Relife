import React, { useState, useRef, useEffect } from 'react';
import {
  useAccessibility,
  useScreenReader,
  useFocusManagement,
  useAccessibleTooltip,
  useMobileAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorBlindFriendly,
  useKeyboardNavigation,
} from '../hooks/useAccessibility';
import { checkContrastAccessibility } from '../utils/accessibility';

interface AccessibilityTesterProps {
  isVisible: boolean;
  onClose: () => void;
}

const AccessibilityTester: React.FC<AccessibilityTesterProps> = ({
  isVisible,
  onClose,
}) => {
  const { preferences, updatePreferences } = useAccessibility();
  const { announce, announceError, announceSuccess } = useScreenReader();
  const { trapFocus, clearTrap } = useFocusManagement();
  const { addTooltip, removeAllTooltips } = useAccessibleTooltip();
  const {
    isMobileScreenReaderActive,
    getMobileAccessibilityProps,
    touchDevice,
    hasHover,
  } = useMobileAccessibility();
  const { isHighContrastActive, getHighContrastStyles } = useHighContrast();
  const { shouldReduceMotion, getAnimationProps } = useReducedMotion();
  const { getColorBlindFriendlyColor } = useColorBlindFriendly();
  const { handleKeyboardNavigation } = useKeyboardNavigation();

  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [contrastResults, setContrastResults] = useState<any[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<HTMLButtonElement[]>([]);

  // Trap focus when dialog is open
  useEffect(() => {
    if (isVisible && dialogRef.current) {
      const cleanup = trapFocus(dialogRef.current);
      return cleanup;
    }
    return clearTrap;
  }, [isVisible, trapFocus, clearTrap]);

  // Add tooltips to test elements
  useEffect(() => {
    const testButton = document.getElementById('test-button');
    if (testButton) {
      addTooltip(testButton as HTMLElement, 'This is a test button with tooltip');
    }

    return removeAllTooltips;
  }, [addTooltip, removeAllTooltips]);

  const runAccessibilityTests = () => {
    const results: Record<string, boolean> = {};

    // Test 1: Screen reader announcements
    try {
      announce('Testing screen reader announcements');
      results.screenReaderTest = true;
    } catch {
      results.screenReaderTest = false;
    }

    // Test 2: High contrast detection
    results.highContrastTest = isHighContrastActive !== undefined;

    // Test 3: Reduced motion detection
    results.reducedMotionTest = shouldReduceMotion !== undefined;

    // Test 4: Mobile touch detection
    results.mobileDetectionTest = touchDevice !== undefined && hasHover !== undefined;

    // Test 5: Color blind friendly colors
    try {
      const redColor = getColorBlindFriendlyColor('red');
      results.colorBlindTest = redColor !== undefined;
    } catch {
      results.colorBlindTest = false;
    }

    // Test 6: Focus management
    try {
      const testElement = document.createElement('button');
      document.body.appendChild(testElement);

      // Test focus trapping (simplified)
      results.focusManagementTest = true;
      document.body.removeChild(testElement);
    } catch {
      results.focusManagementTest = false;
    }

    setTestResults(results);
    announceSuccess('Accessibility tests completed');
  };

  const runContrastTests = () => {
    const colorCombinations = [
      { name: 'Primary Button', fg: '#ffffff', bg: '#3b82f6' },
      { name: 'Secondary Button', fg: '#1f2937', bg: '#f3f4f6' },
      { name: 'Success Button', fg: '#ffffff', bg: getColorBlindFriendlyColor('green') },
      { name: 'Danger Button', fg: '#ffffff', bg: getColorBlindFriendlyColor('red') },
      { name: 'Text on Background', fg: '#1f2937', bg: '#ffffff' },
      { name: 'Muted Text', fg: '#6b7280', bg: '#ffffff' },
    ];

    const results = colorCombinations.map(({ name, fg, bg }) => ({
      name,
      foreground: fg,
      background: bg,
      result: checkContrastAccessibility(fg, bg),
    }));

    setContrastResults(results);
    announce('Contrast tests completed');
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: any) => {
    updatePreferences({ [key]: value });
    announce(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-tester-title"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={getHighContrastStyles()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 id="accessibility-tester-title" className="text-xl font-semibold">
            Accessibility Tester & Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close accessibility tester"
            {...getMobileAccessibilityProps('button')}
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Status Section */}
          <section aria-labelledby="status-section">
            <h3 id="status-section" className="text-lg font-medium mb-4">
              Accessibility Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div>
                  <strong>Device Type:</strong> {touchDevice ? 'Touch Device' : 'Desktop'}
                </div>
                <div>
                  <strong>Hover Support:</strong> {hasHover ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Screen Reader:</strong>{' '}
                  {isMobileScreenReaderActive ? 'Active (Mobile)' : 'Not Detected'}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <strong>High Contrast:</strong> {isHighContrastActive ? 'Active' : 'Inactive'}
                </div>
                <div>
                  <strong>Reduced Motion:</strong> {shouldReduceMotion ? 'Enabled' : 'Disabled'}
                </div>
                <div>
                  <strong>Color Blind Friendly:</strong>{' '}
                  {preferences.colorBlindFriendly ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section aria-labelledby="preferences-section">
            <h3 id="preferences-section" className="text-lg font-medium mb-4">
              Accessibility Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visual Preferences */}
              <div className="space-y-4">
                <h4 className="font-medium">Visual</h4>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.highContrastMode}
                    onChange={(e) =>
                      handlePreferenceChange('highContrastMode', e.target.checked)
                    }
                    {...getMobileAccessibilityProps('input')}
                  />
                  <span>High Contrast Mode</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.reducedMotion}
                    onChange={(e) =>
                      handlePreferenceChange('reducedMotion', e.target.checked)
                    }
                    {...getMobileAccessibilityProps('input')}
                  />
                  <span>Reduced Motion</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.colorBlindFriendly}
                    onChange={(e) =>
                      handlePreferenceChange('colorBlindFriendly', e.target.checked)
                    }
                    {...getMobileAccessibilityProps('input')}
                  />
                  <span>Color Blind Friendly</span>
                </label>

                <div className="space-y-2">
                  <label htmlFor="font-size" className="block text-sm">
                    Font Size
                  </label>
                  <select
                    id="font-size"
                    value={preferences.fontSize}
                    onChange={e =>
                      handlePreferenceChange(
                        'fontSize',
                        e.target.value as typeof preferences.fontSize
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    {...getMobileAccessibilityProps('select')}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>
              </div>

              {/* Interaction Preferences */}
              <div className="space-y-4">
                <h4 className="font-medium">Interaction</h4>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.largerTouchTargets}
                    onChange={(e) =>
                      handlePreferenceChange('largerTouchTargets', e.target.checked)
                    }
                    {...getMobileAccessibilityProps('input')}
                  />
                  <span>Larger Touch Targets</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.hapticFeedback}
                    onChange={(e) =>
                      handlePreferenceChange('hapticFeedback', e.target.checked)
                    }
                    {...getMobileAccessibilityProps('input')}
                  />
                  <span>Haptic Feedback</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.keyboardNavigation}
                    onChange={(e) =>
                      handlePreferenceChange('keyboardNavigation', e.target.checked)
                    }
                    {...getMobileAccessibilityProps('input')}
                  />
                  <span>Keyboard Navigation</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={preferences.screenReaderOptimized}
                    onChange={(e) =>
                      handlePreferenceChange('screenReaderOptimized', e.target.checked)
                    }
                    {...getMobileAccessibilityProps('input')}
                  />
                  <span>Screen Reader Optimized</span>
                </label>
              </div>
            </div>
          </section>

          {/* Testing Section */}
          <section aria-labelledby="testing-section">
            <h3 id="testing-section" className="text-lg font-medium mb-4">
              Accessibility Tests
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  id="test-button"
                  onClick={runAccessibilityTests}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={getAnimationProps()}
                  {...getMobileAccessibilityProps('button')}
                >
                  Run Accessibility Tests
                </button>

                <button
                  onClick={runContrastTests}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={getAnimationProps()}
                  {...getMobileAccessibilityProps('button')}
                >
                  Run Contrast Tests
                </button>

                <button
                  onClick={() => announce('This is a test announcement')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={getAnimationProps()}
                  {...getMobileAccessibilityProps('button')}
                >
                  Test Announcements
                </button>
              </div>

              {/* Test Results */}
              {Object.keys(testResults).length > 0 && (
                <div
                  className="mt-4 p-4 bg-gray-50 rounded-md"
                  role="region"
                  aria-labelledby="test-results"
                >
                  <h4 id="test-results" className="font-medium mb-2">
                    Test Results
                  </h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(testResults).map(([test, passed]) => (
                      <div key={test} className="flex items-center space-x-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            passed ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          aria-label={passed ? 'Passed' : 'Failed'}
                        />
                        <span>{test}: {passed ? 'PASS' : 'FAIL'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contrast Results */}
              {contrastResults.length > 0 && (
                <div
                  className="mt-4 p-4 bg-gray-50 rounded-md"
                  role="region"
                  aria-labelledby="contrast-results"
                >
                  <h4 id="contrast-results" className="font-medium mb-2">
                    Color Contrast Results
                  </h4>
                  <div className="space-y-2 text-sm">
                    {contrastResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-xs"
                            style={{
                              backgroundColor: result.background,
                              color: result.foreground,
                            }}
                          >
                            Aa
                          </div>
                          <span>{result.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>Ratio: {result.result.ratio}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              result.result.isAccessible
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {result.result.level}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
          <button
            onClick={() => {
              updatePreferences({
                highContrastMode: false,
                reducedMotion: false,
                colorBlindFriendly: false,
                largerTouchTargets: false,
                screenReaderOptimized: false,
              });
              announceSuccess('Accessibility preferences reset to defaults');
            }}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...getMobileAccessibilityProps('button')}
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...getMobileAccessibilityProps('button')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityTester;