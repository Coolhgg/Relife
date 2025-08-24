/// <reference lib="dom" />
/**
 * Performance Profiler Wrapper Component
 *
 * Automatically wraps the entire app with React Profiler in development mode
 * and provides performance monitoring dashboard for developers.
 */

import React, { useState, useEffect } from 'react';
import { Profiler } from 'react';
import { performanceProfiler } from '../utils/performance-profiler';
import { TimeoutHandle } from '../types/timers';

interface PerformanceProfilerWrapperProps {
  children: React.ReactNode;
  enabled?: boolean;
}

interface PerformanceDashboardProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Performance Dashboard Component for Development
 */
const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isOpen,
  onToggle,
}) => {
  const [summary, setSummary] = useState(performanceProfiler.getSummary());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh || !isOpen) return;

    const interval = setInterval(() => {
      setSummary(performanceProfiler.getSummary());
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, isOpen]);

  const refreshSummary = () => {
    setSummary(performanceProfiler.getSummary());
  };

  const clearData = () => {
    performanceProfiler.clear();
    setSummary(performanceProfiler.getSummary());
  };

  const exportData = () => {
    const data = performanceProfiler.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const logToConsole = () => {
    performanceProfiler.logSummary();
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggle}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Open Performance Dashboard"
        >
          🔬
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-4 w-96 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">
          🔬 Performance Dashboard
        </h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Components
            </div>
            <div className="text-blue-600 dark:text-blue-400">
              {summary.totalComponents}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Avg Render
            </div>
            <div className="text-green-600 dark:text-green-400">
              {summary.averageRenderTime.toFixed(2)}ms
            </div>
          </div>
        </div>

        {/* Slow Components */}
        {summary.slowComponents.length > 0 && (
          <div>
            <div className="font-medium text-red-600 dark:text-red-400 mb-1">
              🐌 Slow Components ({summary.slowComponents.length})
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {summary.slowComponents.slice(0, 3).map((comp: any) => (
                <div
                  key={comp.id}
                  className="text-xs bg-red-50 dark:bg-red-900/20 p-1 rounded"
                >
                  <div className="font-mono truncate">{comp.id}</div>
                  <div className="text-red-600 dark:text-red-400">
                    {comp.averageTime.toFixed(2)}ms avg, {comp.renderCount} renders
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Frequent Components */}
        {summary.frequentComponents.length > 0 && (
          <div>
            <div className="font-medium text-orange-600 dark:text-orange-400 mb-1">
              🔄 Frequent Renders
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {summary.frequentComponents.slice(0, 3).map((comp: any) => (
                <div
                  key={comp.id}
                  className="text-xs bg-orange-50 dark:bg-orange-900/20 p-1 rounded"
                >
                  <div className="font-mono truncate">{comp.id}</div>
                  <div className="text-orange-600 dark:text-orange-400">
                    {comp.renderCount} renders, {comp.averageTime.toFixed(2)}ms avg
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAutoRefresh(e.target.checked)
              }
              className="mr-1"
            />
            Auto-refresh
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={refreshSummary}
            className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            🔄 Refresh
          </button>
          <button
            onClick={logToConsole}
            className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
          >
            📋 Log
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={clearData}
            className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            🗑️ Clear
          </button>
          <button
            onClick={exportData}
            className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
          >
            💾 Export
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Performance Profiler Wrapper
 */
export const PerformanceProfilerWrapper: React.FC<PerformanceProfilerWrapperProps> = ({
  children,
  enabled = process.env.NODE_ENV === 'development' &&
    process.env.REACT_APP_PERFORMANCE_PROFILING === 'true',
}) => {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);

  useEffect(() => {
    // Enable dev tools if in development and profiling is enabled
    setShowDevTools(
      enabled &&
        process.env.NODE_ENV === 'development' &&
        process.env.REACT_APP_SHOW_PERF_DASHBOARD !== 'false'
    );

    // Add keyboard shortcut for performance dashboard
    const handleKeyPress = (_event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && _event.key === 'P') {
        setDashboardOpen((prev: any) => !prev);
        event.preventDefault();
      }
    };

    if (enabled) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [enabled]);

  // Performance warning effect
  useEffect(() => {
    if (!enabled) return;

    console.log('🔬 React Performance Profiler active');
    console.log('📊 Press Ctrl+Shift+P to toggle performance dashboard');

    // Add performance warning styles to slow components
    const addPerformanceWarnings = () => {
      const summary = performanceProfiler.getSummary();
      summary.slowComponents.forEach(comp => {
        const elements = document.querySelectorAll(`[data-profiler-id="${comp.id}"]`);
        elements.forEach(element => {
          (element as HTMLElement).style.outline = '2px solid orange';
          (element as HTMLElement).title =
            `Slow component: ${comp.averageTime.toFixed(2)}ms average`;
        });
      });
    };

    const interval = setInterval(addPerformanceWarnings, 5000);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      <Profiler id="App" onRender={performanceProfiler.onRender}>
        {children}
      </Profiler>

      {showDevTools && (
        <PerformanceDashboard
          isOpen={dashboardOpen}
          onToggle={() => setDashboardOpen((prev: any) => !prev)}
        />
      )}
    </>
  );
};

export default PerformanceProfilerWrapper;
