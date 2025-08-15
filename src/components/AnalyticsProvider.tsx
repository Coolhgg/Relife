import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useAnalytics, useEngagementAnalytics, usePerformanceAnalytics, ANALYTICS_EVENTS } from '../hooks/useAnalytics';

interface AnalyticsContextType {
  track: (eventName: string, properties?: Record<string, any>) => void;
  trackPageView: (pageName?: string, properties?: Record<string, any>) => void;
  trackFeatureUsage: (featureName: string, action: string, properties?: Record<string, any>) => void;
  trackError: (error: Error, context?: string) => void;
  trackPerformance: (metric: string, value: number, context?: string) => void;
  trackUserInteraction: (element: string, action: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const { track, trackPageView, trackFeatureUsage } = useAnalytics();
  const { trackFeatureDiscovery } = useEngagementAnalytics();
  const { trackComponentRenderTime } = usePerformanceAnalytics();
  
  const sessionStartTime = useRef<number>(Date.now());
  const interactionCount = useRef<number>(0);
  const pageViews = useRef<Set<string>>(new Set());
  const featuresUsed = useRef<Set<string>>(new Set());

  // Track session metrics
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStartTime.current;
      track(ANALYTICS_EVENTS.SESSION_ENDED, {
        duration: sessionDuration,
        interactions: interactionCount.current,
        pages_viewed: pageViews.current.size,
        features_used: featuresUsed.current.size,
        timestamp: new Date().toISOString()
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Track when user minimizes/backgrounds the app
        track('app_backgrounded', {
          duration_active: Date.now() - sessionStartTime.current,
          timestamp: new Date().toISOString()
        });
      } else {
        // Track when user returns to the app
        track('app_foregrounded', {
          timestamp: new Date().toISOString()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [track]);

  // Enhanced tracking functions
  const trackEnhanced = (eventName: string, properties?: Record<string, any>) => {
    interactionCount.current += 1;
    track(eventName, {
      ...properties,
      session_interaction_count: interactionCount.current,
      timestamp: new Date().toISOString()
    });
  };

  const trackPageViewEnhanced = (pageName?: string, properties?: Record<string, any>) => {
    if (pageName) {
      pageViews.current.add(pageName);
      
      // Track page discovery if first time viewing
      const pageViewKey = `page_viewed_${pageName}`;
      if (!localStorage.getItem(pageViewKey)) {
        trackFeatureDiscovery(pageName, 'page_navigation');
        localStorage.setItem(pageViewKey, 'true');
      }
    }
    
    trackPageView(pageName, {
      ...properties,
      total_page_views: pageViews.current.size,
      timestamp: new Date().toISOString()
    });
  };

  const trackFeatureUsageEnhanced = (featureName: string, action: string, properties?: Record<string, any>) => {
    featuresUsed.current.add(featureName);
    
    // Track feature discovery if first time using
    const featureKey = `feature_used_${featureName}`;
    if (!localStorage.getItem(featureKey)) {
      trackFeatureDiscovery(featureName, action);
      localStorage.setItem(featureKey, 'true');
    }
    
    trackFeatureUsage(featureName, action, {
      ...properties,
      total_features_used: featuresUsed.current.size,
      timestamp: new Date().toISOString()
    });
  };

  const trackErrorEnhanced = (error: Error, context?: string) => {
    track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context: context || 'unknown',
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      url: window.location.href
    });
  };

  const trackPerformanceEnhanced = (metric: string, value: number, context?: string) => {
    track('performance_metric', {
      metric_name: metric,
      metric_value: value,
      context: context || 'unknown',
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });
  };

  const trackUserInteractionEnhanced = (element: string, action: string, properties?: Record<string, any>) => {
    interactionCount.current += 1;
    
    track('user_interaction', {
      element_type: element,
      action_type: action,
      interaction_count: interactionCount.current,
      ...properties,
      timestamp: new Date().toISOString()
    });
  };

  const contextValue: AnalyticsContextType = {
    track: trackEnhanced,
    trackPageView: trackPageViewEnhanced,
    trackFeatureUsage: trackFeatureUsageEnhanced,
    trackError: trackErrorEnhanced,
    trackPerformance: trackPerformanceEnhanced,
    trackUserInteraction: trackUserInteractionEnhanced
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};

// Higher-order component for automatic component performance tracking
export const withAnalytics = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  const WithAnalyticsComponent: React.FC<P> = (props) => {
    const { trackPerformance } = useAnalyticsContext();
    const renderStartTime = useRef<number>();

    useEffect(() => {
      renderStartTime.current = performance.now();
    });

    useEffect(() => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        trackPerformance(`${componentName}_render_time`, renderTime, 'component_render');
      }
    });

    return <WrappedComponent {...props} />;
  };

  WithAnalyticsComponent.displayName = `withAnalytics(${componentName})`;
  return WithAnalyticsComponent;
};

// Hook for component-specific analytics
export const useComponentAnalytics = (componentName: string) => {
  const analytics = useAnalyticsContext();
  const mountTime = useRef<number>(Date.now());
  const interactionCount = useRef<number>(0);

  useEffect(() => {
    // Track component mount
    analytics.track('component_mounted', {
      component_name: componentName,
      timestamp: new Date().toISOString()
    });

    return () => {
      // Track component unmount and usage duration
      const usageDuration = Date.now() - mountTime.current;
      analytics.track('component_unmounted', {
        component_name: componentName,
        usage_duration: usageDuration,
        interactions: interactionCount.current,
        timestamp: new Date().toISOString()
      });
    };
  }, [componentName, analytics]);

  const trackInteraction = (action: string, properties?: Record<string, any>) => {
    interactionCount.current += 1;
    analytics.trackUserInteraction(componentName, action, {
      ...properties,
      component_interactions: interactionCount.current
    });
  };

  const trackFeature = (featureName: string, action: string, properties?: Record<string, any>) => {
    analytics.trackFeatureUsage(`${componentName}_${featureName}`, action, properties);
  };

  return {
    ...analytics,
    trackInteraction,
    trackFeature,
    componentName
  };
};