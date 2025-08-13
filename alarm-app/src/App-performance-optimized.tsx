/**
 * Performance-Optimized App Component
 * Integrates all performance optimizations: lazy loading, virtual scrolling, 
 * memory management, network optimization, progressive loading, and real-time alerts
 */

import React, { Suspense, lazy, memo, useCallback, useMemo } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PerformanceAlertDisplay } from './utils/performance-alerts';
import { NetworkStatus } from './utils/network-optimization';
import { MemoryMonitor } from './utils/memory-management';
import { lazyWithPreload, useInteractionPreloading, usePerformantRender } from './utils/lazy-loading';
import { VirtualScroll } from './components/VirtualScroll';
import { Skeleton } from './utils/progressive-loading';
import { OptimizedImage } from './utils/image-optimization';
import { useOptimizedRequest } from './utils/network-optimization';
import { useMemoryManagement } from './utils/memory-management';
import { usePerformanceAlerts } from './utils/performance-alerts';
import PerformanceMonitor from './services/performance-monitor';
import './App.css';

// Lazy load components with intelligent preloading
const Dashboard = lazyWithPreload(
  () => import('./components/Dashboard'),
  () => window.location.pathname === '/' || window.location.pathname === '/dashboard'
);

const AlarmForm = lazyWithPreload(
  () => import('./components/AlarmForm'),
  () => document.querySelector('[data-preload*=\"alarm-form\"]') !== null
);

const SleepTracker = lazyWithPreload(
  () => import('./components/SleepTracker'),
  () => window.location.pathname.includes('/sleep')
);

const VoiceSettings = lazyWithPreload(
  () => import('./components/VoiceSettings'),
  () => localStorage.getItem('voice-enabled') === 'true'
);

const SmartAlarmSettings = lazyWithPreload(
  () => import('./components/SmartAlarmSettings'),
  () => localStorage.getItem('smart-alarms') === 'true'
);

const UserProfile = lazyWithPreload(
  () => import('./components/UserProfile'),
  () => false // Load on demand only
);

// Memoized components for better performance
const MemoizedNetworkStatus = memo(NetworkStatus);
const MemoizedMemoryMonitor = memo(MemoryMonitor);
const MemoizedPerformanceAlertDisplay = memo(PerformanceAlertDisplay);

// Loading fallbacks
const DashboardSkeleton = () => (
  <div className=\"dashboard-skeleton\">
    <Skeleton lines={3} height={60} className=\"mb-4\" />
    <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
      <Skeleton height={120} className=\"rounded-lg\" />
      <Skeleton height={120} className=\"rounded-lg\" />
      <Skeleton height={120} className=\"rounded-lg\" />
    </div>
  </div>
);

const AlarmFormSkeleton = () => (
  <div className=\"alarm-form-skeleton\">
    <Skeleton height={40} className=\"mb-4\" />
    <Skeleton lines={2} height={30} className=\"mb-3\" />
    <Skeleton height={50} className=\"mb-4\" />
    <div className=\"flex gap-2\">
      <Skeleton width={100} height={40} />
      <Skeleton width={100} height={40} />
    </div>
  </div>
);

const SleepTrackerSkeleton = () => (
  <div className=\"sleep-tracker-skeleton\">
    <Skeleton height={200} className=\"mb-4 rounded-lg\" />
    <Skeleton lines={4} height={20} />
  </div>
);

interface AppState {
  currentView: 'dashboard' | 'alarms' | 'sleep' | 'voice' | 'smart-alarms' | 'profile';
  isLoading: boolean;
  error: Error | null;
}

const PerformanceOptimizedApp: React.FC = () => {
  // State management with performance considerations
  const [appState, setAppState] = React.useState<AppState>({
    currentView: 'dashboard',
    isLoading: false,
    error: null
  });

  // Performance hooks
  const { recordMetric, forceCleanup } = useMemoryManagement();
  const { alerts, suggestions } = usePerformanceAlerts();
  const { execute: fetchData } = useOptimizedRequest();

  // Interaction-based preloading
  useInteractionPreloading({
    'alarm-form': () => import('./components/AlarmForm'),
    'sleep-tracker': () => import('./components/SleepTracker'),
    'voice-settings': () => import('./components/VoiceSettings'),
  });

  // Performant rendering for large data sets
  const { renderInBatches } = usePerformantRender();

  // Initialize performance monitoring
  React.useEffect(() => {
    const startTime = performance.now();
    PerformanceMonitor.initialize();

    // Track app initialization time
    const initTime = performance.now() - startTime;
    PerformanceMonitor.trackCustomMetric('app_initialization', initTime);

    // Track route changes for performance
    const trackRouteChange = () => {
      PerformanceMonitor.trackUserInteraction('navigation', window.location.pathname);
    };

    window.addEventListener('popstate', trackRouteChange);
    return () => window.removeEventListener('popstate', trackRouteChange);
  }, []);

  // Navigation with performance tracking
  const navigateToView = useCallback((view: AppState['currentView']) => {
    const navigationStart = performance.now();
    
    setAppState(prev => ({ ...prev, currentView: view, isLoading: true }));
    
    // Track navigation performance
    requestAnimationFrame(() => {
      const navigationTime = performance.now() - navigationStart;
      PerformanceMonitor.trackCustomMetric('navigation_time', navigationTime, { 
        from: appState.currentView, 
        to: view 
      });
      
      setAppState(prev => ({ ...prev, isLoading: false }));
    });

    // Preload next likely components
    if (view === 'dashboard') {
      // Preload alarm form as it's commonly accessed from dashboard
      import('./components/AlarmForm').catch(() => {});
    } else if (view === 'alarms') {
      // Preload sleep tracker as users often check both
      import('./components/SleepTracker').catch(() => {});
    }
  }, [appState.currentView]);

  // Optimized data fetching with caching
  const fetchAppData = useCallback(async () => {
    try {
      const startTime = performance.now();
      
      await fetchData({
        id: 'app-data',
        method: 'GET',
        url: '/api/app-data',
        cacheKey: 'app-data',
        cacheTTL: 300000, // 5 minutes
        priority: 'normal'
      });
      
      const fetchTime = performance.now() - startTime;
      PerformanceMonitor.trackCustomMetric('data_fetch_time', fetchTime);
      
    } catch (error) {
      console.error('[App] Data fetch failed:', error);
      setAppState(prev => ({ ...prev, error: error as Error }));
    }
  }, [fetchData]);

  // Memory cleanup on component unmount
  React.useEffect(() => {
    return () => {
      forceCleanup();
      PerformanceMonitor.cleanup();
    };
  }, [forceCleanup]);

  // Render current view with optimizations
  const renderCurrentView = useMemo(() => {
    const commonProps = {
      onLoadStart: () => setAppState(prev => ({ ...prev, isLoading: true })),
      onLoadComplete: () => setAppState(prev => ({ ...prev, isLoading: false }))
    };

    switch (appState.currentView) {
      case 'dashboard':
        return (
          <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard {...commonProps} />
          </Suspense>
        );
      
      case 'alarms':
        return (
          <Suspense fallback={<AlarmFormSkeleton />}>
            <AlarmForm {...commonProps} />
          </Suspense>
        );
      
      case 'sleep':
        return (
          <Suspense fallback={<SleepTrackerSkeleton />}>
            <SleepTracker {...commonProps} />
          </Suspense>
        );
      
      case 'voice':
        return (
          <Suspense fallback={<Skeleton lines={5} height={40} />}>
            <VoiceSettings {...commonProps} />
          </Suspense>
        );
      
      case 'smart-alarms':
        return (
          <Suspense fallback={<Skeleton lines={4} height={50} />}>
            <SmartAlarmSettings {...commonProps} />
          </Suspense>
        );
      
      case 'profile':
        return (
          <Suspense fallback={<Skeleton lines={6} height={30} />}>
            <UserProfile {...commonProps} />
          </Suspense>
        );
      
      default:
        return <DashboardSkeleton />;
    }
  }, [appState.currentView]);

  // Performance-aware navigation menu
  const navigationItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', preload: 'dashboard' },
    { id: 'alarms', label: 'Alarms', icon: '⏰', preload: 'alarm-form' },
    { id: 'sleep', label: 'Sleep Tracker', icon: '😴', preload: 'sleep-tracker' },
    { id: 'voice', label: 'Voice Settings', icon: '🎤', preload: 'voice-settings' },
    { id: 'smart-alarms', label: 'Smart Alarms', icon: '🧠', preload: 'smart-alarms' },
    { id: 'profile', label: 'Profile', icon: '👤', preload: 'profile' },
  ], []);

  return (
    <ErrorBoundary
      fallback={
        <div className=\"error-fallback\">
          <h2>Something went wrong</h2>
          <p>The app encountered an error. Please refresh the page.</p>
          <button onClick={() => window.location.reload()}>Refresh</button>
        </div>
      }
      onError={(error) => {
        PerformanceMonitor.trackCustomMetric('app_error', 1, { 
          message: error.message,
          stack: error.stack 
        });
      }}
    >
      <div className=\"app-container min-h-screen bg-gray-50\">
        {/* Performance monitoring header */}
        <div className=\"performance-header bg-white border-b border-gray-200 p-2\">
          <div className=\"flex items-center justify-between max-w-7xl mx-auto\">
            <div className=\"flex items-center space-x-4\">
              <MemoizedNetworkStatus showDetails={false} />
              <MemoizedMemoryMonitor showDetails={false} />
            </div>
            
            {/* Critical alerts indicator */}
            {alerts.filter(a => a.severity >= 4).length > 0 && (
              <div className=\"critical-indicator bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse\">
                ⚠️ {alerts.filter(a => a.severity >= 4).length} Critical
              </div>
            )}
          </div>
        </div>

        {/* Performance alerts */}
        <MemoizedPerformanceAlertDisplay 
          maxAlerts={3}
          showSuggestions={true}
          className=\"max-w-7xl mx-auto px-4 py-2\"
        />

        {/* Main app layout */}
        <div className=\"app-layout max-w-7xl mx-auto px-4 py-6\">
          <div className=\"flex flex-col lg:flex-row gap-6\">
            {/* Navigation sidebar with preload hints */}
            <nav className=\"lg:w-64 bg-white rounded-lg shadow-sm p-4\">
              <h2 className=\"font-bold text-lg mb-4 text-gray-800\">Relife Alarm</h2>
              <ul className=\"space-y-2\">
                {navigationItems.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => navigateToView(item.id as AppState['currentView'])}
                      data-preload={JSON.stringify({ 
                        componentPath: `./components/${item.preload}`, 
                        id: item.preload, 
                        priority: 'normal' 
                      })}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        appState.currentView === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className=\"mr-2\">{item.icon}</span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
              
              {/* Performance cleanup button */}
              <div className=\"mt-6 pt-4 border-t border-gray-200\">
                <button
                  onClick={() => {
                    forceCleanup();
                    PerformanceMonitor.trackCustomMetric('manual_cleanup', 1);
                  }}
                  className=\"w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors\"
                >
                  🧹 Clean Memory
                </button>
              </div>
            </nav>

            {/* Main content area with performance optimizations */}
            <main className=\"flex-1 bg-white rounded-lg shadow-sm\">
              {appState.isLoading && (
                <div className=\"loading-overlay absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10\">
                  <div className=\"flex items-center space-x-2\">
                    <div className=\"w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin\"></div>
                    <span className=\"text-gray-600\">Loading...</span>
                  </div>
                </div>
              )}
              
              <div className=\"p-6\">
                {appState.error ? (
                  <div className=\"error-state text-center py-12\">
                    <div className=\"text-red-500 text-6xl mb-4\">⚠️</div>
                    <h3 className=\"text-lg font-semibold text-gray-800 mb-2\">
                      Something went wrong
                    </h3>
                    <p className=\"text-gray-600 mb-4\">{appState.error.message}</p>
                    <button
                      onClick={() => {
                        setAppState(prev => ({ ...prev, error: null }));
                        fetchAppData();
                      }}
                      className=\"bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors\"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  renderCurrentView
                )}
              </div>
            </main>
          </div>
        </div>

        {/* Performance insights panel (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className=\"performance-insights fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm\">
            <h4 className=\"font-semibold text-sm mb-2\">Performance Insights</h4>
            <div className=\"text-xs space-y-1\">
              <div>Active Alerts: {alerts.length}</div>
              <div>Suggestions: {suggestions.length}</div>
              <div>Current View: {appState.currentView}</div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default memo(PerformanceOptimizedApp);