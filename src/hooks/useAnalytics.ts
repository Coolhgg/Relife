import { useCallback, useEffect, useRef } from 'react';
import AnalyticsService, { ANALYTICS_EVENTS, EventProperties, UserProperties } from '../services/analytics';

interface UseAnalyticsReturn {
  track: (eventName: string, properties?: EventProperties) => void;
  trackPageView: (pageName?: string, properties?: EventProperties) => void;
  trackFeatureUsage: (featureName: string, action: string, properties?: EventProperties) => void;
  identify: (userId: string, properties?: UserProperties) => void;
  setUserProperties: (properties: Partial<UserProperties>) => void;
  incrementProperty: (property: string, value?: number) => void;
  reset: () => void;
  isInitialized: boolean;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const analytics = useRef(AnalyticsService.getInstance());
  const isInitialized = useRef(false);

  // Initialize analytics on first use
  useEffect(() => {
    if (!isInitialized.current) {
      analytics.current.initialize();
      isInitialized.current = true;
    }
  }, []);

  const track = useCallback((eventName: string, properties?: EventProperties) => {
    analytics.current.track(eventName, properties);
  }, []);

  const trackPageView = useCallback((pageName?: string, properties?: EventProperties) => {
    analytics.current.trackPageView(pageName, properties);
  }, []);

  const trackFeatureUsage = useCallback((
    featureName: string, 
    action: string, 
    properties?: EventProperties
  ) => {
    analytics.current.trackFeatureUsage(featureName, action, properties);
  }, []);

  const identify = useCallback((userId: string, properties?: UserProperties) => {
    analytics.current.identify(userId, properties);
  }, []);

  const setUserProperties = useCallback((properties: Partial<UserProperties>) => {
    analytics.current.setUserProperties(properties);
  }, []);

  const incrementProperty = useCallback((property: string, value?: number) => {
    analytics.current.incrementProperty(property, value);
  }, []);

  const reset = useCallback(() => {
    analytics.current.reset();
  }, []);

  return {
    track,
    trackPageView,
    trackFeatureUsage,
    identify,
    setUserProperties,
    incrementProperty,
    reset,
    isInitialized: isInitialized.current
  };
};

// Hook for tracking alarm-specific events
export const useAlarmAnalytics = () => {
  const { track } = useAnalytics();

  const trackAlarmCreated = useCallback((alarmType: string, properties?: EventProperties) => {
    track(ANALYTICS_EVENTS.ALARM_CREATED, {
      alarm_type: alarmType,
      ...properties
    });
  }, [track]);

  const trackAlarmTriggered = useCallback((alarmId: string, dismissalMethod?: string, properties?: EventProperties) => {
    track(ANALYTICS_EVENTS.ALARM_TRIGGERED, {
      alarm_id: alarmId,
      dismissal_method: dismissalMethod,
      ...properties
    });
  }, [track]);

  const trackAlarmDismissed = useCallback((alarmId: string, method: string, timeToDismiss: number, properties?: EventProperties) => {
    track(ANALYTICS_EVENTS.ALARM_DISMISSED, {
      alarm_id: alarmId,
      dismissal_method: method,
      time_to_dismiss: timeToDismiss,
      ...properties
    });
  }, [track]);

  const trackAlarmSnoozed = useCallback((alarmId: string, snoozeCount: number, properties?: EventProperties) => {
    track(ANALYTICS_EVENTS.ALARM_SNOOZED, {
      alarm_id: alarmId,
      snooze_count: snoozeCount,
      ...properties
    });
  }, [track]);

  const trackAlarmMissed = useCallback((alarmId: string, reason: string, properties?: EventProperties) => {
    track(ANALYTICS_EVENTS.ALARM_MISSED, {
      alarm_id: alarmId,
      miss_reason: reason,
      ...properties
    });
  }, [track]);

  return {
    trackAlarmCreated,
    trackAlarmTriggered,
    trackAlarmDismissed,
    trackAlarmSnoozed,
    trackAlarmMissed
  };
};

// Hook for tracking user engagement
export const useEngagementAnalytics = () => {
  const { track, incrementProperty } = useAnalytics();

  const trackSessionActivity = useCallback(() => {
    track(ANALYTICS_EVENTS.SESSION_STARTED, {
      session_start_time: new Date().toISOString(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }, [track]);

  const trackFeatureDiscovery = useCallback((featureName: string, discoveryMethod: string) => {
    track(ANALYTICS_EVENTS.FEATURE_DISCOVERY, {
      feature_name: featureName,
      discovery_method: discoveryMethod,
      timestamp: new Date().toISOString()
    });
  }, [track]);

  const trackDailyActive = useCallback(() => {
    track(ANALYTICS_EVENTS.DAILY_ACTIVE, {
      date: new Date().toDateString(),
      timestamp: new Date().toISOString()
    });
    incrementProperty('daily_active_count');
  }, [track, incrementProperty]);

  const trackHelpAccessed = useCallback((helpTopic: string, helpMethod: string) => {
    track(ANALYTICS_EVENTS.HELP_ACCESSED, {
      help_topic: helpTopic,
      access_method: helpMethod,
      timestamp: new Date().toISOString()
    });
  }, [track]);

  return {
    trackSessionActivity,
    trackFeatureDiscovery,
    trackDailyActive,
    trackHelpAccessed
  };
};

// Hook for tracking performance metrics
export const usePerformanceAnalytics = () => {
  const { track } = useAnalytics();

  const trackPageLoadTime = useCallback((pageName: string, loadTime: number) => {
    track(ANALYTICS_EVENTS.PAGE_LOAD_TIME, {
      page_name: pageName,
      load_time: loadTime,
      timestamp: new Date().toISOString()
    });
  }, [track]);

  const trackComponentRenderTime = useCallback((componentName: string, renderTime: number) => {
    track(ANALYTICS_EVENTS.COMPONENT_RENDER_TIME, {
      component_name: componentName,
      render_time: renderTime,
      timestamp: new Date().toISOString()
    });
  }, [track]);

  const trackApiResponseTime = useCallback((endpoint: string, responseTime: number, success: boolean) => {
    track(ANALYTICS_EVENTS.API_RESPONSE_TIME, {
      endpoint,
      response_time: responseTime,
      success,
      timestamp: new Date().toISOString()
    });
  }, [track]);

  return {
    trackPageLoadTime,
    trackComponentRenderTime,
    trackApiResponseTime
  };
};

// Hook for automatic page view tracking
export const usePageTracking = (pageName: string) => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    const startTime = performance.now();
    
    trackPageView(pageName, {
      page_entry_time: new Date().toISOString(),
      referrer: document.referrer
    });

    return () => {
      const timeOnPage = performance.now() - startTime;
      analytics.current.track('page_exit', {
        page_name: pageName,
        time_on_page: Math.round(timeOnPage),
        exit_time: new Date().toISOString()
      });
    };
  }, [pageName, trackPageView]);
};

// Export analytics events for use in components
export { ANALYTICS_EVENTS };