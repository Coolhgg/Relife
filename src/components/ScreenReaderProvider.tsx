// Screen Reader Initialization Component
// Ensures screen reader service is properly initialized and manages state changes
import React from 'react';
import { useEffect, useRef } from 'react';
import ScreenReaderService from '../utils/screen-reader';

interface ScreenReaderProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  verbosity?: 'low' | 'medium' | 'high';
}

export function ScreenReaderProvider({ 
  children, 
  enabled = true, 
  verbosity = 'medium' 
}: ScreenReaderProviderProps) {
  const isInitialized = useRef(false);
  const screenReaderService = useRef<ScreenReaderService>();

  useEffect(() => {
    if (!isInitialized.current && enabled) {
      // Initialize screen reader service
      screenReaderService.current = ScreenReaderService.getInstance();
      
      // Update settings
      screenReaderService.current.updateSettings({
        isEnabled: enabled,
        verbosityLevel: verbosity,
        autoAnnounceChanges: true
      });

      // Announce app initialization
      setTimeout(() => {
        screenReaderService.current?.announce(
          'Smart Alarm app loaded. Navigation available with keyboard shortcuts or touch.',
          'polite',
          { delay: 1000 }
        );
      }, 2000);

      isInitialized.current = true;

      // Setup global error announcement handler
      const originalError = window.console.error;
      window.console.error = (...args) => {
        originalError.apply(console, args);
        
        // Announce critical errors to screen reader users
        const errorMessage = args.join(' ');
        if (errorMessage.toLowerCase().includes('error') || 
            errorMessage.toLowerCase().includes('failed')) {
          screenReaderService.current?.announce(
            'An error occurred. Please check your connection and try again.',
            'assertive'
          );
        }
      };

      // Setup global focus management
      document.addEventListener('focusin', (event) => {
        if (screenReaderService.current?.getState().verbosityLevel === 'high') {
          const target = event.target as HTMLElement;
          if (target && target.getAttribute) {
            const ariaLabel = target.getAttribute('aria-label');
            const role = target.getAttribute('role');
            const tagName = target.tagName.toLowerCase();
            
            if (ariaLabel || ['button', 'link', 'input', 'select', 'textarea'].includes(tagName)) {
              const elementDescription = ariaLabel || 
                target.textContent?.slice(0, 50) || 
                `${tagName} element`;
              
              screenReaderService.current?.announce(
                `Focused: ${elementDescription}`,
                'polite',
                { delay: 200 }
              );
            }
          }
        }
      });

      console.log('Screen Reader Provider initialized');
    }

    return () => {
      if (screenReaderService.current) {
        screenReaderService.current.cleanup();
      }
    };
  }, [enabled, verbosity]);

  // Update settings when props change
  useEffect(() => {
    if (screenReaderService.current) {
      screenReaderService.current.updateSettings({
        isEnabled: enabled,
        verbosityLevel: verbosity
      });
    }
  }, [enabled, verbosity]);

  return <>{children}</>;
}

// Hook to manage live region announcements with component lifecycle
export function useScreenReaderLifecycle(componentName: string) {
  const screenReaderRef = useRef<ScreenReaderService>();
  const mountedRef = useRef(false);

  useEffect(() => {
    screenReaderRef.current = ScreenReaderService.getInstance();
    mountedRef.current = true;
    
    // Announce component mount
    if (screenReaderRef.current.getState().verbosityLevel === 'high') {
      screenReaderRef.current.announce(
        `${componentName} loaded`,
        'polite',
        { delay: 500 }
      );
    }

    return () => {
      mountedRef.current = false;
      // Announce component unmount for high verbosity
      if (screenReaderRef.current?.getState().verbosityLevel === 'high') {
        screenReaderRef.current.announce(
          `${componentName} closed`,
          'polite'
        );
      }
    };
  }, [componentName]);

  const announceIfMounted = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (mountedRef.current && screenReaderRef.current) {
      screenReaderRef.current.announce(message, priority);
    }
  };

  return { announceIfMounted };
}

// Component for testing screen reader announcements
export function ScreenReaderTester() {
  const screenReader = ScreenReaderService.getInstance();

  const testAnnouncements = [
    { message: 'This is a polite announcement', priority: 'polite' as const },
    { message: 'This is an assertive announcement', priority: 'assertive' as const },
    { message: 'Testing alarm creation announcement', priority: 'polite' as const },
    { message: 'Testing navigation announcement', priority: 'polite' as const }
  ];

  const runTest = (index: number) => {
    const test = testAnnouncements[index];
    if (test) {
      screenReader.announce(test.message, test.priority);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Screen Reader Test</h3>
      <div className="space-y-2">
        {testAnnouncements.map((test, index) => (
          <button
            key={index}
            onClick={() => runTest(index)}
            className="block w-full text-left bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Test ${test.priority} announcement: ${test.message}`}
          >
            {test.priority === 'assertive' ? '🔊' : '📢'} {test.message}
          </button>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded border">
        <h4 className="font-medium text-gray-900 mb-2">Test Instructions</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Turn on your screen reader (NVDA, JAWS, VoiceOver, etc.)</li>
          <li>• Click each button to test different announcement types</li>
          <li>• Polite announcements wait for pauses in speech</li>
          <li>• Assertive announcements interrupt current speech</li>
          <li>• Check that announcements are being read by your screen reader</li>
        </ul>
      </div>
    </div>
  );
}

export default ScreenReaderProvider;