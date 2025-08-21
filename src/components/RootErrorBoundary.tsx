import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Clock, Home, Bug, Zap } from 'lucide-react';
import { ErrorHandler } from '../services/error-handler';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isRecovering: boolean;
}

/**
 * Root Error Boundary - Last line of defense for unhandled errors
 * This catches errors that escape all other error boundaries
 */
export class RootErrorBoundary extends Component<Props, State> {
  private recoveryAttempts = 0;
  private maxRecoveryAttempts = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our error handling service
    const errorId = ErrorHandler.handleError(error, 'Root component error occurred', {
      context: 'RootErrorBoundary',
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      recoveryAttempts: this.recoveryAttempts
    });

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Try to save critical data before the app becomes unusable
    this.saveApplicationState();

    console.error('Root Error Boundary caught an error:', error, errorInfo);
  }

  private saveApplicationState = async () => {
    try {
      // Save any critical data to localStorage as a backup
      const currentState = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        error: this.state.error?.message,
        stack: this.state.error?.stack
      };

      localStorage.setItem('app_crash_state', JSON.stringify(currentState));
    } catch (error) {
      console.error('Failed to save application state:', error);
    }
  };

  private handleReload = () => {
    this.setState({ isRecovering: true });

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  private handleRetry = () => {
    if (this.recoveryAttempts < this.maxRecoveryAttempts) {
      this.recoveryAttempts++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isRecovering: false
      });
    } else {
      // Too many attempts, force reload
      this.handleReload();
    }
  };

  private handleReportError = () => {
    if (this.state.errorId) {
      const subject = encodeURIComponent(`App Error Report - ${this.state.errorId}`);
      const body = encodeURIComponent(
        `Error ID: ${this.state.errorId}\n` +
        `Error: ${this.state.error?.message}\n` +
        `URL: ${window.location.href}\n` +
        `User Agent: ${navigator.userAgent}\n` +
        `Timestamp: ${new Date().toISOString()}\n\n` +
        `Please describe what you were doing when this error occurred:`
      );

      window.open(`mailto:support@example.com?subject=${subject}&body=${body}`, '_blank');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-8">
            {/* Error Icon */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>

              {/* Recovery Animation */}
              {this.state.isRecovering && (
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  <span className="ml-3 text-red-600 dark:text-red-400">Recovering...</span>
                </div>
              )}
            </div>

            {/* Error Message */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Oops! Something went wrong
              </h1>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The Smart Alarm app encountered an unexpected error. Don't worry - your alarm data is safe.
              </p>

              {this.state.errorId && (
                <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Bug className="w-4 h-4" />
                    <span>Error ID</span>
                  </div>
                  <code className="font-mono text-sm text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-dark-600 px-2 py-1 rounded">
                    {this.state.errorId}
                  </code>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {this.recoveryAttempts < this.maxRecoveryAttempts ? (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Try Again ({this.maxRecoveryAttempts - this.recoveryAttempts} attempts left)
                </button>
              ) : (
                <button
                  onClick={this.handleReload}
                  disabled={this.state.isRecovering}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-5 h-5 ${this.state.isRecovering ? 'animate-spin' : ''}`} />
                  {this.state.isRecovering ? 'Reloading...' : 'Reload App'}
                </button>
              )}

              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Fresh Start (Clear Data)
              </button>

              {this.state.errorId && (
                <button
                  onClick={this.handleReportError}
                  className="w-full bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 font-medium py-2 px-6 rounded-lg transition-colors text-sm"
                >
                  Report This Error
                </button>
              )}
            </div>

            {/* App Branding */}
            <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-dark-600">
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Smart Alarm - Always here for you</span>
              </div>
            </div>

            {/* Developer Info */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  Developer Debug Info
                </summary>
                <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 text-xs">
                  <div className="mb-3">
                    <strong className="text-red-800 dark:text-red-200">Error:</strong>
                    <pre className="mt-1 text-red-700 dark:text-red-300 overflow-x-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>

                  {this.state.error.stack && (
                    <div className="mb-3">
                      <strong className="text-red-800 dark:text-red-200">Stack Trace:</strong>
                      <pre className="mt-1 text-red-700 dark:text-red-300 overflow-x-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}

                  {this.state.errorInfo && (
                    <div>
                      <strong className="text-red-800 dark:text-red-200">Component Stack:</strong>
                      <pre className="mt-1 text-red-700 dark:text-red-300 overflow-x-auto whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;