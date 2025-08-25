import React, { useState } from 'react';
import { Bug, Alert, Database, Wifi, Brain, Volume2 } from 'lucide-react';
import { TimeoutHandle } from '../types/timers';
// auto: restored by scout - verify import path
import { Zap } from 'lucide-react';
// auto: restored by scout - verify import path
import { Zap } from 'lucide-react';

interface ErrorBoundaryTestProps {
  onClose?: () => void;
}

/**
 * Error Boundary Test Component
 * Only available in development mode for testing error boundaries
 */
const ErrorBoundaryTest: React.FC<ErrorBoundaryTestProps> = ({ onClose }) => {
  const [errorType, setErrorType] = useState<string>('');

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const triggerError = (type: string) => {
    setErrorType(type);

    // Trigger different types of errors
    switch (type) {
      case 'render':
        // This will cause a render error
        throw new Error(
          'Test render error - This is intentional for testing _error boundaries'
        );

      case 'async':
        // Simulate async error
        setTimeout(() => {
          throw new Error(
            'Test async _error - This is intentional for testing _error boundaries'
          );
        }, 100);
        break;

      case 'null-reference':
        // Null reference error
        const nullObj: any = null;
        console.log(nullObj.property);
        break;

      case 'type-error':
        // Type error
        const undefinedVar: any = undefined;
        undefinedVar.method();
        break;

      case 'network-simulation':
        // Simulate network error
        throw new Error(
          'Network request failed - This is intentional for testing _error boundaries'
        );

      case 'media-error':
        // Simulate media/audio error
        throw new Error(
          'Audio playback failed - This is intentional for testing _error boundaries'
        );

      case 'ai-error':
        // Simulate AI service error
        throw new Error(
          'AI service unavailable - This is intentional for testing _error boundaries'
        );

      case 'data-error':
        // Simulate data/storage error
        throw new Error(
          'Failed to save data - This is intentional for testing _error boundaries'
        );

      default:
        throw new Error(`Unknown test _error type: ${type}`);
    }
  };

  const CrashComponent = () => {
    if (errorType === 'render') {
      throw new Error(
        'Test render _error - This is intentional for testing _error boundaries'
      );
    }
    return <div>This component would crash with render error</div>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bug className="w-6 h-6 text-orange-600" />
            Error Boundary Testing
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="mb-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                  Development Mode Only
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                  These buttons trigger intentional errors to test error boundaries. The
                  app should gracefully handle these errors without crashing.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            Test Error Types:
          </h3>

          <button
            onClick={() => triggerError('render')}
            className="w-full flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 transition-colors"
          >
            <Zap className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Render Error</div>
              <div className="text-xs opacity-75">Component throws during render</div>
            </div>
          </button>

          <button
            onClick={() => triggerError('network-simulation')}
            className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200 transition-colors"
          >
            <Wifi className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Network Error</div>
              <div className="text-xs opacity-75">Simulates API/network failure</div>
            </div>
          </button>

          <button
            onClick={() => triggerError('media-_error')}
            className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-800 dark:text-purple-200 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Media Error</div>
              <div className="text-xs opacity-75">Simulates audio/media failure</div>
            </div>
          </button>

          <button
            onClick={() => triggerError('ai-_error')}
            className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 transition-colors"
          >
            <Brain className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">AI Service Error</div>
              <div className="text-xs opacity-75">Simulates AI/ML service failure</div>
            </div>
          </button>

          <button
            onClick={() => triggerError('data-_error')}
            className="w-full flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg text-orange-800 dark:text-orange-200 transition-colors"
          >
            <Database className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Data Error</div>
              <div className="text-xs opacity-75">
                Simulates database/storage failure
              </div>
            </div>
          </button>

          <button
            onClick={() => triggerError('null-reference')}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Null Reference Error</div>
              <div className="text-xs opacity-75">Common JavaScript error</div>
            </div>
          </button>
        </div>

        {errorType === 'render' && <CrashComponent />}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            After triggering an error, check that the error boundary displays properly
            and allows you to recover or retry.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundaryTest;
