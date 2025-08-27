/**
 * Error Tracker Panel - Enhanced Error Reporting and Debugging
 * 
 * Tracks and displays:
 * - JavaScript errors and exceptions
 * - React error boundaries
 * - Network errors
 * - Console errors and warnings
 * - Error stack traces
 * - User actions leading to errors
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  Bug,
  Network,
  Code,
  Clock,
  User,
  RefreshCw,
  Trash2,
  Download,
} from 'lucide-react';

interface ErrorEntry {
  id: string;
  type: 'javascript' | 'react' | 'network' | 'console';
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
  timestamp: number;
  userAgent: string;
  userId?: string;
  userActions: UserAction[];
  count: number;
}

interface UserAction {
  type: 'click' | 'navigation' | 'input' | 'scroll';
  target: string;
  timestamp: number;
  details?: any;
}

export const ErrorTrackerPanel: React.FC = () => {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorEntry | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warning'>('all');
  const [filterType, setFilterType] = useState<'all' | 'javascript' | 'react' | 'network' | 'console'>('all');
  
  const userActionsRef = useRef<UserAction[]>([]);
  const errorMapRef = useRef<Map<string, ErrorEntry>>(new Map());

  // Track user actions for error context
  useEffect(() => {
    if (!isTracking) return;

    const trackUserAction = (action: UserAction) => {
      userActionsRef.current.push(action);
      // Keep only last 20 actions
      if (userActionsRef.current.length > 20) {
        userActionsRef.current.shift();
      }
    };

    // Track clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      trackUserAction({
        type: 'click',
        target: target.tagName.toLowerCase() + (target.id ? `#${target.id}` : '') + 
                (target.className ? `.${Array.from(target.classList).join('.')}` : ''),
        timestamp: Date.now(),
        details: { x: e.clientX, y: e.clientY },
      });
    };

    // Track navigation
    const handleNavigation = () => {
      trackUserAction({
        type: 'navigation',
        target: window.location.pathname,
        timestamp: Date.now(),
      });
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', handleNavigation);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [isTracking]);

  // Track JavaScript errors
  useEffect(() => {
    if (!isTracking) return;

    const handleError = (event: ErrorEvent) => {
      const errorKey = `${event.message}-${event.filename}-${event.lineno}`;
      
      let errorEntry = errorMapRef.current.get(errorKey);
      if (errorEntry) {
        errorEntry.count++;
        errorEntry.timestamp = Date.now();
      } else {
        errorEntry = {
          id: `error-${Date.now()}-${Math.random()}`,
          type: 'javascript',
          level: 'error',
          message: event.message,
          stack: event.error?.stack,
          url: event.filename,
          line: event.lineno,
          column: event.colno,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          userActions: [...userActionsRef.current],
          count: 1,
        };
        errorMapRef.current.set(errorKey, errorEntry);
      }

      setErrors(prev => {
        const filtered = prev.filter(e => e.id !== errorEntry!.id);
        return [errorEntry!, ...filtered].slice(0, 100);
      });
    };

    // Track unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorKey = `promise-rejection-${event.reason}`;
      
      let errorEntry = errorMapRef.current.get(errorKey);
      if (errorEntry) {
        errorEntry.count++;
        errorEntry.timestamp = Date.now();
      } else {
        errorEntry = {
          id: `promise-${Date.now()}-${Math.random()}`,
          type: 'javascript',
          level: 'error',
          message: `Unhandled Promise Rejection: ${event.reason}`,
          stack: event.reason?.stack,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          userActions: [...userActionsRef.current],
          count: 1,
        };
        errorMapRef.current.set(errorKey, errorEntry);
      }

      setErrors(prev => {
        const filtered = prev.filter(e => e.id !== errorEntry!.id);
        return [errorEntry!, ...filtered].slice(0, 100);
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isTracking]);

  // Intercept console errors and warnings
  useEffect(() => {
    if (!isTracking) return;

    const originalConsole = {
      error: console.error,
      warn: console.warn,
    };

    console.error = (...args) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      const errorKey = `console-error-${message}`;
      
      let errorEntry = errorMapRef.current.get(errorKey);
      if (errorEntry) {
        errorEntry.count++;
      } else {
        errorEntry = {
          id: `console-error-${Date.now()}-${Math.random()}`,
          type: 'console',
          level: 'error',
          message,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          userActions: [...userActionsRef.current],
          count: 1,
        };
        errorMapRef.current.set(errorKey, errorEntry);
        
        setErrors(prev => {
          const filtered = prev.filter(e => e.id !== errorEntry!.id);
          return [errorEntry!, ...filtered].slice(0, 100);
        });
      }

      originalConsole.error(...args);
    };

    console.warn = (...args) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      const errorKey = `console-warn-${message}`;
      
      let errorEntry = errorMapRef.current.get(errorKey);
      if (errorEntry) {
        errorEntry.count++;
      } else {
        errorEntry = {
          id: `console-warn-${Date.now()}-${Math.random()}`,
          type: 'console',
          level: 'warning',
          message,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          userActions: [...userActionsRef.current],
          count: 1,
        };
        errorMapRef.current.set(errorKey, errorEntry);
        
        setErrors(prev => {
          const filtered = prev.filter(e => e.id !== errorEntry!.id);
          return [errorEntry!, ...filtered].slice(0, 100);
        });
      }

      originalConsole.warn(...args);
    };

    return () => {
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
    };
  }, [isTracking]);

  // Filter errors
  const filteredErrors = errors.filter(error => {
    if (filterLevel !== 'all' && error.level !== filterLevel) return false;
    if (filterType !== 'all' && error.type !== filterType) return false;
    return true;
  });

  // Error statistics
  const stats = React.useMemo(() => {
    const total = errors.length;
    const errorCount = errors.filter(e => e.level === 'error').length;
    const warningCount = errors.filter(e => e.level === 'warning').length;
    const jsErrors = errors.filter(e => e.type === 'javascript').length;
    const networkErrors = errors.filter(e => e.type === 'network').length;

    return {
      total,
      errors: errorCount,
      warnings: warningCount,
      javascript: jsErrors,
      network: networkErrors,
    };
  }, [errors]);

  const getErrorIcon = (error: ErrorEntry) => {
    switch (error.type) {
      case 'javascript':
        return <Code className="w-4 h-4 text-red-500" />;
      case 'react':
        return <Bug className="w-4 h-4 text-orange-500" />;
      case 'network':
        return <Network className="w-4 h-4 text-purple-500" />;
      case 'console':
        return error.level === 'error' 
          ? <XCircle className="w-4 h-4 text-red-500" />
          : <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const exportErrors = () => {
    const data = JSON.stringify(errors, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${isTracking ? 'text-red-500' : 'text-gray-400'}`} />
            <span className="font-medium">Error Tracker</span>
            <span className={`text-xs px-2 py-1 rounded ${isTracking ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
              {isTracking ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
          
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Levels</option>
            <option value="error">Errors Only</option>
            <option value="warning">Warnings Only</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Types</option>
            <option value="javascript">JavaScript</option>
            <option value="react">React</option>
            <option value="network">Network</option>
            <option value="console">Console</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`p-2 rounded ${isTracking ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              setErrors([]);
              errorMapRef.current.clear();
            }}
            className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={exportErrors}
            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-3 border border-gray-200 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="p-3 border border-red-200 bg-red-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-800">{stats.errors}</div>
          <div className="text-sm text-red-600">Errors</div>
        </div>
        <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-800">{stats.warnings}</div>
          <div className="text-sm text-yellow-600">Warnings</div>
        </div>
        <div className="p-3 border border-purple-200 bg-purple-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-800">{stats.javascript}</div>
          <div className="text-sm text-purple-600">JavaScript</div>
        </div>
        <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-800">{stats.network}</div>
          <div className="text-sm text-blue-600">Network</div>
        </div>
      </div>

      {/* Errors List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Errors List */}
        <div className="border border-gray-200 rounded-lg">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium">Errors ({filteredErrors.length})</h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredErrors.map(error => (
              <div
                key={error.id}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedError?.id === error.id ? 'bg-red-50 border-red-200' : ''
                }`}
                onClick={() => setSelectedError(error)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getErrorIcon(error)}
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{error.type}</span>
                    {error.count > 1 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        {error.count}x
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="text-sm font-mono text-gray-800 truncate">
                  {error.message}
                </div>
                
                {error.url && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {error.url}:{error.line}:{error.column}
                  </div>
                )}
              </div>
            ))}
            
            {filteredErrors.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No errors match the current filters
              </div>
            )}
          </div>
        </div>

        {/* Error Details */}
        <div className="border border-gray-200 rounded-lg">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium">Error Details</h4>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {selectedError ? (
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-sm mb-2">Error Info</h5>
                  <div className="space-y-1 text-sm">
                    <div><strong>Type:</strong> {selectedError.type}</div>
                    <div><strong>Level:</strong> {selectedError.level}</div>
                    <div><strong>Count:</strong> {selectedError.count}</div>
                    <div><strong>Time:</strong> {new Date(selectedError.timestamp).toLocaleString()}</div>
                    {selectedError.url && (
                      <div><strong>File:</strong> {selectedError.url}</div>
                    )}
                    {selectedError.line && (
                      <div><strong>Location:</strong> {selectedError.line}:{selectedError.column}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-sm mb-2">Message</h5>
                  <div className="bg-red-50 border border-red-200 p-2 rounded text-sm">
                    {selectedError.message}
                  </div>
                </div>

                {selectedError.stack && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Stack Trace</h5>
                    <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-32 overflow-auto">
                      <pre>{selectedError.stack}</pre>
                    </div>
                  </div>
                )}

                {selectedError.userActions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">User Actions Leading to Error</h5>
                    <div className="space-y-1 max-h-32 overflow-auto">
                      {selectedError.userActions.map((action, index) => (
                        <div key={index} className="text-xs bg-blue-50 p-2 rounded">
                          <strong>{action.type}:</strong> {action.target}
                          <span className="text-gray-500 ml-2">
                            {new Date(action.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select an error to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};