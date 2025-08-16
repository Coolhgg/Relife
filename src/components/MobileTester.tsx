import React, { useState, useEffect, useRef } from 'react';
import { useMobileTouch } from '../hooks/useMobileTouch';
import { usePWA } from '../hooks/usePWA';
import { useCapacitor } from '../hooks/useCapacitor';
import { useMobilePerformance } from '../hooks/useMobilePerformance';
import { useMobileAccessibilityContext } from './MobileAccessibilityProvider';

interface MobileTesterProps {
  isVisible: boolean;
  onClose: () => void;
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: string;
}

const MobileTester: React.FC<MobileTesterProps> = ({ isVisible, onClose }) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  
  const testAreaRef = useRef<HTMLDivElement>(null);
  const touchTestRef = useRef<HTMLButtonElement>(null);
  
  // Hook integrations
  const { gestures, enableHaptic } = useMobileTouch();
  const {
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    canInstall,
    install,
  } = usePWA();
  const {
    isCapacitorAvailable,
    deviceInfo,
    scheduleNotification,
    hapticImpact,
    networkStatus,
  } = useCapacitor();
  const {
    metrics: performanceMetrics,
    optimizations,
    isLowPerformanceDevice,
  } = useMobilePerformance();
  const {
    isAccessibilityEnabled,
    isMobileScreenReaderActive,
    announce,
    preferences,
  } = useMobileAccessibilityContext();

  // Touch gesture testing
  useEffect(() => {
    if (!isVisible || !testAreaRef.current) return;

    const element = testAreaRef.current;
    
    const handleSwipe = (direction: string) => {
      console.log(`[MobileTester] Swipe detected: ${direction}`);
      updateTestResult('Touch Gestures', 'pass', `Swipe ${direction} detected`);
    };

    const handleTap = () => {
      console.log('[MobileTester] Tap detected');
      updateTestResult('Touch Gestures', 'pass', 'Tap gesture detected');
    };

    const handleLongPress = () => {
      console.log('[MobileTester] Long press detected');
      updateTestResult('Touch Gestures', 'pass', 'Long press detected');
    };

    element.addEventListener('swipeup', () => handleSwipe('up'));
    element.addEventListener('swipedown', () => handleSwipe('down'));
    element.addEventListener('swipeleft', () => handleSwipe('left'));
    element.addEventListener('swiperight', () => handleSwipe('right'));
    element.addEventListener('tap', handleTap);
    element.addEventListener('longpress', handleLongPress);

    return () => {
      element.removeEventListener('swipeup', () => handleSwipe('up'));
      element.removeEventListener('swipedown', () => handleSwipe('down'));
      element.removeEventListener('swipeleft', () => handleSwipe('left'));
      element.removeEventListener('swiperight', () => handleSwipe('right'));
      element.removeEventListener('tap', handleTap);
      element.removeEventListener('longpress', handleLongPress);
    };
  }, [isVisible]);

  const updateTestResult = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => 
          r.name === name 
            ? { ...r, status, message, details }
            : r
        );
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestProgress(0);
    setTestResults([]);

    const tests = [
      testDeviceCapabilities,
      testPWAFeatures,
      testCapacitorIntegration,
      testPerformanceOptimizations,
      testAccessibilityFeatures,
      testTouchInteractions,
      testNetworkCapabilities,
      testNotificationSystem,
      testResponsiveDesign,
      testBatteryOptimization,
    ];

    for (let i = 0; i < tests.length; i++) {
      try {
        await tests[i]();
        setTestProgress(((i + 1) / tests.length) * 100);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Test ${tests[i].name} failed:`, error);
        updateTestResult(tests[i].name, 'fail', `Test failed: ${error}`);
      }
    }

    setIsRunningTests(false);
    announce('Mobile testing completed', 'polite');
  };

  const testDeviceCapabilities = async () => {
    // Test touch device detection
    const isTouchDevice = 'ontouchstart' in window;
    updateTestResult(
      'Device Detection',
      isTouchDevice ? 'pass' : 'warning',
      `Touch device: ${isTouchDevice ? 'Yes' : 'No'}`
    );

    // Test screen size
    const isSmallScreen = window.innerWidth < 768;
    updateTestResult(
      'Screen Size',
      'info',
      `Screen: ${window.innerWidth}x${window.innerHeight} (${isSmallScreen ? 'Mobile' : 'Desktop'})`
    );

    // Test orientation support
    const hasOrientationAPI = 'orientation' in window;
    updateTestResult(
      'Orientation API',
      hasOrientationAPI ? 'pass' : 'warning',
      `Orientation API: ${hasOrientationAPI ? 'Available' : 'Not available'}`
    );

    // Test device pixel ratio
    const pixelRatio = window.devicePixelRatio || 1;
    updateTestResult(
      'Display Quality',
      pixelRatio > 1 ? 'pass' : 'info',
      `Pixel ratio: ${pixelRatio}x (${pixelRatio > 1 ? 'High DPI' : 'Standard'})`
    );
  };

  const testPWAFeatures = async () => {
    // Test PWA installation
    updateTestResult(
      'PWA Installation',
      isInstallable ? 'pass' : (isInstalled ? 'info' : 'warning'),
      isInstalled ? 'Already installed' : (isInstallable ? 'Can be installed' : 'Not installable'),
      `Installable: ${isInstallable}, Installed: ${isInstalled}, Can install: ${canInstall}`
    );

    // Test offline capability
    updateTestResult(
      'Offline Support',
      isOnline ? 'pass' : 'info',
      `Network: ${isOnline ? 'Online' : 'Offline'}`,
      'Service worker handles offline functionality'
    );

    // Test update mechanism
    updateTestResult(
      'App Updates',
      updateAvailable ? 'info' : 'pass',
      updateAvailable ? 'Update available' : 'App is up to date'
    );

    // Test manifest
    const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
    updateTestResult(
      'Web Manifest',
      hasManifest ? 'pass' : 'fail',
      `Manifest: ${hasManifest ? 'Found' : 'Missing'}`
    );
  };

  const testCapacitorIntegration = async () => {
    updateTestResult(
      'Capacitor Platform',
      isCapacitorAvailable ? 'pass' : 'info',
      isCapacitorAvailable ? 'Capacitor available' : 'Running as web app',
      deviceInfo ? JSON.stringify(deviceInfo, null, 2) : 'No device info available'
    );

    if (isCapacitorAvailable) {
      // Test haptic feedback
      try {
        await hapticImpact('light');
        updateTestResult('Haptic Feedback', 'pass', 'Haptic feedback works');
      } catch (error) {
        updateTestResult('Haptic Feedback', 'warning', 'Haptic feedback not available');
      }

      // Test network status
      updateTestResult(
        'Network Status',
        'pass',
        `Connection: ${networkStatus.connected ? 'Connected' : 'Disconnected'}`,
        `Type: ${networkStatus.connectionType}`
      );

      // Test notification capability
      try {
        await scheduleNotification({
          title: 'Test Notification',
          body: 'Mobile testing in progress',
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 5000) },
        });
        updateTestResult('Push Notifications', 'pass', 'Notification scheduled successfully');
      } catch (error) {
        updateTestResult('Push Notifications', 'warning', 'Notification scheduling failed');
      }
    }
  };

  const testPerformanceOptimizations = async () => {
    updateTestResult(
      'Device Performance',
      isLowPerformanceDevice ? 'warning' : 'pass',
      `Performance level: ${performanceMetrics.devicePerformance || 'unknown'}`,
      `Memory: ${performanceMetrics.memoryUsage ? Math.round(performanceMetrics.memoryUsage / 1024 / 1024) + 'MB' : 'N/A'}`
    );

    updateTestResult(
      'Battery Optimization',
      optimizations.lowBatteryMode ? 'info' : 'pass',
      optimizations.lowBatteryMode ? 'Low power mode active' : 'Normal power mode',
      `Battery level: ${performanceMetrics.batteryLevel ? Math.round(performanceMetrics.batteryLevel * 100) + '%' : 'N/A'}`
    );

    updateTestResult(
      'Animation Optimization',
      optimizations.reducedAnimations ? 'info' : 'pass',
      optimizations.reducedAnimations ? 'Reduced animations enabled' : 'Full animations enabled'
    );

    updateTestResult(
      'Network Optimization',
      'pass',
      `Network speed: ${performanceMetrics.networkSpeed || 'unknown'}`
    );
  };

  const testAccessibilityFeatures = async () => {
    updateTestResult(
      'Accessibility System',
      isAccessibilityEnabled ? 'pass' : 'fail',
      isAccessibilityEnabled ? 'Accessibility enabled' : 'Accessibility disabled'
    );

    updateTestResult(
      'Screen Reader Support',
      isMobileScreenReaderActive ? 'pass' : 'info',
      isMobileScreenReaderActive ? 'Screen reader detected' : 'No screen reader detected'
    );

    updateTestResult(
      'Touch Targets',
      preferences.largerTouchTargets ? 'pass' : 'info',
      preferences.largerTouchTargets ? 'Large touch targets enabled' : 'Standard touch targets'
    );

    updateTestResult(
      'High Contrast',
      preferences.highContrastMode ? 'info' : 'pass',
      preferences.highContrastMode ? 'High contrast enabled' : 'Standard contrast'
    );

    updateTestResult(
      'Reduced Motion',
      preferences.reducedMotion ? 'info' : 'pass',
      preferences.reducedMotion ? 'Reduced motion enabled' : 'Full motion enabled'
    );
  };

  const testTouchInteractions = async () => {
    // This will be updated by touch event listeners
    updateTestResult(
      'Touch Gestures',
      'info',
      'Waiting for touch input...',
      'Try swiping, tapping, or long-pressing in the test area below'
    );

    // Test haptic feedback
    try {
      if (enableHaptic) {
        await enableHaptic('medium');
        updateTestResult('Touch Haptics', 'pass', 'Haptic feedback available');
      } else {
        updateTestResult('Touch Haptics', 'warning', 'Haptic feedback not available');
      }
    } catch (error) {
      updateTestResult('Touch Haptics', 'warning', 'Haptic feedback failed');
    }
  };

  const testNetworkCapabilities = async () => {
    // Test connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      updateTestResult(
        'Connection Info',
        'pass',
        `Type: ${connection.effectiveType || 'unknown'}`,
        `Downlink: ${connection.downlink || 'unknown'} Mbps, Save data: ${connection.saveData || false}`
      );
    } else {
      updateTestResult('Connection Info', 'warning', 'Network Information API not available');
    }

    // Test online/offline detection
    updateTestResult(
      'Online Status',
      navigator.onLine ? 'pass' : 'warning',
      `Status: ${navigator.onLine ? 'Online' : 'Offline'}`
    );
  };

  const testNotificationSystem = async () => {
    if ('Notification' in window) {
      const permission = Notification.permission;
      updateTestResult(
        'Notification Permission',
        permission === 'granted' ? 'pass' : (permission === 'denied' ? 'fail' : 'warning'),
        `Permission: ${permission}`
      );

      if (permission === 'granted') {
        try {
          const notification = new Notification('Mobile Test', {
            body: 'Testing notification system',
            icon: '/icons/icon-72.png',
          });
          setTimeout(() => notification.close(), 3000);
          updateTestResult('Notification Display', 'pass', 'Notification sent successfully');
        } catch (error) {
          updateTestResult('Notification Display', 'warning', 'Notification display failed');
        }
      }
    } else {
      updateTestResult('Notification API', 'fail', 'Notification API not available');
    }
  };

  const testResponsiveDesign = async () => {
    // Test viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    updateTestResult(
      'Viewport Meta Tag',
      viewportMeta ? 'pass' : 'fail',
      viewportMeta ? 'Viewport meta tag found' : 'Viewport meta tag missing',
      viewportMeta ? (viewportMeta as HTMLMetaElement).content : undefined
    );

    // Test CSS media queries
    const supportsTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    updateTestResult(
      'Touch Media Query',
      supportsTouch ? 'pass' : 'info',
      `Touch device detected via CSS: ${supportsTouch ? 'Yes' : 'No'}`
    );

    // Test safe area support
    const supportsSafeArea = CSS.supports('padding', 'env(safe-area-inset-top)');
    updateTestResult(
      'Safe Area Support',
      supportsSafeArea ? 'pass' : 'warning',
      `Safe area insets: ${supportsSafeArea ? 'Supported' : 'Not supported'}`
    );
  };

  const testBatteryOptimization = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        updateTestResult(
          'Battery API',
          'pass',
          `Level: ${Math.round(battery.level * 100)}%, Charging: ${battery.charging ? 'Yes' : 'No'}`,
          `Charging time: ${battery.chargingTime === Infinity ? 'N/A' : battery.chargingTime + 's'}`
        );
      } catch (error) {
        updateTestResult('Battery API', 'warning', 'Battery API access failed');
      }
    } else {
      updateTestResult('Battery API', 'warning', 'Battery API not available');
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-100';
      case 'fail': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mobile Features Tester</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close mobile tester"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Test Controls */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runAllTests}
              disabled={isRunningTests}
              className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isRunningTests
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
            </button>

            <button
              onClick={() => setTestResults([])}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Results
            </button>
          </div>

          {/* Progress Bar */}
          {isRunningTests && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${testProgress}%` }}
              />
            </div>
          )}

          {/* Touch Test Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <h3 className="text-lg font-medium mb-4">Touch Interaction Test Area</h3>
            <div
              ref={testAreaRef}
              className="bg-blue-50 rounded-lg p-6 min-h-32 flex items-center justify-center text-center touch-action-manipulation"
            >
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Try different gestures here:
                </p>
                <p className="text-xs text-gray-500">
                  Tap • Long press • Swipe up/down/left/right
                </p>
                <button
                  ref={touchTestRef}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                  onClick={() => updateTestResult('Touch Button', 'pass', 'Button clicked successfully')}
                >
                  Test Button
                </button>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Test Results</h3>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getStatusIcon(result.status)}</span>
                        <div>
                          <h4 className="font-medium">{result.name}</h4>
                          <p className="text-sm text-gray-600">{result.message}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          result.status
                        )}`}
                      >
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                    {result.details && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                          {result.details}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Summary</h4>
                <div className="grid grid-cols-4 gap-4 text-center text-sm">
                  <div>
                    <div className="text-green-600 font-medium">
                      {testResults.filter(r => r.status === 'pass').length}
                    </div>
                    <div className="text-gray-600">Passed</div>
                  </div>
                  <div>
                    <div className="text-red-600 font-medium">
                      {testResults.filter(r => r.status === 'fail').length}
                    </div>
                    <div className="text-gray-600">Failed</div>
                  </div>
                  <div>
                    <div className="text-yellow-600 font-medium">
                      {testResults.filter(r => r.status === 'warning').length}
                    </div>
                    <div className="text-gray-600">Warnings</div>
                  </div>
                  <div>
                    <div className="text-blue-600 font-medium">
                      {testResults.filter(r => r.status === 'info').length}
                    </div>
                    <div className="text-gray-600">Info</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileTester;