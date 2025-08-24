import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import {
  Alert,
  RefreshCw,
  BarChart3,
  Music,
  Brain,
  Wifi,
  Database,
} from 'lucide-react';
import { ErrorHandler } from '../services/error-handler';

interface SpecializedErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface SpecializedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

// Base class for specialized error boundaries
abstract class BaseSpecializedErrorBoundary extends Component<
  SpecializedErrorBoundaryProps,
  SpecializedErrorBoundaryState
> {
  protected abstract errorContext: string;
  protected abstract icon: ReactNode;
  protected abstract title: string;
  protected abstract description: string;

  constructor(props: SpecializedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): SpecializedErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = ErrorHandler.handleError(
      error,
      'Specialized component error occurred',
      {
        context: this.errorContext,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }
    );

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                {this.icon}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                {this.title}
              </h3>

              <p className="text-red-600 dark:text-red-300 mb-4">{this.description}</p>

              {this.state.errorId && (
                <div className="bg-red-100 dark:bg-red-900/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Error ID: <code className="font-mono">{this.state.errorId}</code>
                  </p>
                </div>
              )}

              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-red-500 hover:text-red-700">
                    Developer Details
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/20 rounded border text-xs">
                    <strong>Error:</strong> {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <>
                        <br />
                        <br />
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Analytics Error Boundary
export class AnalyticsErrorBoundary extends BaseSpecializedErrorBoundary {
  protected errorContext = 'Analytics';
  protected icon = (<BarChart3 className="w-5 h-5 text-red-600 dark:text-red-400" />);
  protected title = 'Analytics Error';
  protected description =
    "There was a problem loading analytics data. This won't affect your alarms or other features.";
}

// Media/Audio Error Boundary
export class MediaErrorBoundary extends BaseSpecializedErrorBoundary {
  protected errorContext = 'Media';
  protected icon = (<Music className="w-5 h-5 text-red-600 dark:text-red-400" />);
  protected title = 'Media Error';
  protected description =
    'There was a problem with audio or media content. Your alarms will still work with default sounds.';
}

// AI/ML Error Boundary
export class AIErrorBoundary extends BaseSpecializedErrorBoundary {
  protected errorContext = 'AI';
  protected icon = (<Brain className="w-5 h-5 text-red-600 dark:text-red-400" />);
  protected title = 'AI Service Error';
  protected description =
    'AI features are temporarily unavailable. Core alarm functionality remains unaffected.';
}

// API/Network Error Boundary
export class APIErrorBoundary extends BaseSpecializedErrorBoundary {
  protected errorContext = 'API';
  protected icon = (<Wifi className="w-5 h-5 text-red-600 dark:text-red-400" />);
  protected title = 'Network Error';
  protected description =
    'Unable to connect to online services. You can continue using the app offline.';
}

// Data/Storage Error Boundary
export class DataErrorBoundary extends BaseSpecializedErrorBoundary {
  protected errorContext = 'Data';
  protected icon = (<Database className="w-5 h-5 text-red-600 dark:text-red-400" />);
  protected title = 'Data Error';
  protected description =
    'There was a problem accessing or saving data. Your information may not be up to date.';
}

// Form Error Boundary with enhanced recovery
export class FormErrorBoundary extends BaseSpecializedErrorBoundary {
  protected errorContext = 'Form';
  protected icon = (<Alert className="w-5 h-5 text-red-600 dark:text-red-400" />);
  protected title = 'Form Error';
  protected description =
    'There was a problem with the form. Please try refreshing or filling it out again.';

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                {this.icon}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                {this.title}
              </h3>

              <p className="text-yellow-600 dark:text-yellow-300 mb-4">
                {this.description}
              </p>

              <div className="space-y-2">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mr-3"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-yellow-500 hover:text-yellow-700">
                    Developer Details
                  </summary>
                  <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded border text-xs">
                    <strong>Error:</strong> {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <>
                        <br />
                        <br />
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
