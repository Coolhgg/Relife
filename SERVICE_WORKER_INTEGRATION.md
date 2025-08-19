# ServiceWorkerStatus Component Integration Guide

This guide shows how to integrate the ServiceWorkerStatus component into your Relife app UI for monitoring alarm reliability.

## Integration Options

### Option 1: Add to Settings Page (Recommended)

The most logical place is within the Settings page, as it's a system status component.

#### 1. Update App.tsx Imports

Add the ServiceWorkerStatus component import:

```typescript
// Add to existing imports in src/App.tsx
import ServiceWorkerStatus from './components/ServiceWorkerStatus';
import { useEnhancedServiceWorker } from './hooks/useEnhancedServiceWorker';
```

#### 2. Add Service Worker Hook to App Component

Add the hook to the main App component:

```typescript
function App() {
  // Add this after existing hooks
  const {
    state: serviceWorkerState,
    updateAlarms: updateServiceWorkerAlarms,
    performHealthCheck
  } = useEnhancedServiceWorker();

  // ... existing code
}
```

#### 3. Update the Settings View

Modify the settings case in the `renderContent()` function:

```typescript
case 'settings':
  const appAnalytics = AppAnalyticsService.getInstance();
  appAnalytics.trackPageView('settings');
  return (
    <ErrorBoundary context="EnhancedSettings">
      <div className="p-4 space-y-6">
        {/* Service Worker Status Section */}
        <section aria-labelledby="system-status-heading">
          <h2 id="system-status-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            System Status
          </h2>
          <ServiceWorkerStatus />
        </section>

        {/* Existing Settings Component */}
        <EnhancedSettings
          user={appState.user}
          alarms={appState.alarms}
          onSettingChange={(key, value) => {
            const appAnalytics = AppAnalyticsService.getInstance();
            appAnalytics.trackFeatureUsage('settings', 'changed', { key, value });
          }}
          onUpdateProfile={auth.updateUserProfile}
          onSignOut={auth.signOut}
          isLoading={auth.isLoading}
          error={auth.error}
        />
      </div>
    </ErrorBoundary>
  );
```

### Option 2: Add as Header Status Indicator

For a more visible status indicator, add it to the header:

#### Update the Header Section

```typescript
{/* Header with Offline Indicator and Service Worker Status */}
<header className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-dark-200" role="banner">
  <div className="px-4 py-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          🚀 Relife Alarms
        </h1>
        {auth.user && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-800 dark:text-gray-200">
              {auth.user.name || auth.user.email}
            </span>
            {auth.user.level && (
              <span className="text-xs bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 px-2 py-1 rounded">
                Level {auth.user.level}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3" role="group" aria-label="Header actions">
        <OfflineIndicator />

        {/* Add Service Worker Status Indicator */}
        <ServiceWorkerStatusIndicator />

        {tabProtectionSettings.settings.enabled && tabProtectionSettings.settings.visualSettings.showVisualWarning && (
          <TabProtectionWarning
            activeAlarm={appState.activeAlarm}
            enabledAlarms={appState.alarms.filter(alarm => alarm.enabled)}
            settings={tabProtectionSettings.settings}
          />
        )}

        {/* ... rest of header */}
      </div>
    </div>
  </div>
</header>
```

#### Create ServiceWorkerStatusIndicator Component

```typescript
// Create src/components/ServiceWorkerStatusIndicator.tsx
import React from 'react';
import { useEnhancedServiceWorker } from '../hooks/useEnhancedServiceWorker';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

export const ServiceWorkerStatusIndicator: React.FC = () => {
  const { state } = useEnhancedServiceWorker();

  const getStatusIcon = () => {
    if (!state.isInitialized) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }

    if (state.notificationPermission !== 'granted') {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }

    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!state.isInitialized) return 'SW Inactive';
    if (state.notificationPermission !== 'granted') return 'Notifications Disabled';
    return `${state.scheduledAlarmsCount} Scheduled`;
  };

  return (
    <div
      className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"
      title={`Service Worker: ${getStatusText()}`}
    >
      {getStatusIcon()}
      <span className="hidden sm:inline">{getStatusText()}</span>
    </div>
  );
};

export default ServiceWorkerStatusIndicator;
```

### Option 3: Add as Dedicated System View

Create a dedicated system status view in the main navigation:

#### Add New Navigation Tab

Update the bottom navigation to include a system/status tab:

```typescript
{/* Add after the Settings button, before closing </div> */}
<button
  onClick={() => {
    const appAnalytics = AppAnalyticsService.getInstance();
    appAnalytics.trackFeatureUsage('navigation', 'system_status_clicked');
    setAppState(prev => ({ ...prev, currentView: 'system-status' }));
    AccessibilityUtils.announcePageChange('System Status');
  }}
  className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
    appState.currentView === 'system-status'
      ? 'text-primary-800 dark:text-primary-100 bg-primary-100 dark:bg-primary-800 border-2 border-primary-300 dark:border-primary-600'
      : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-700 border border-transparent hover:border-gray-300 dark:hover:border-dark-600'
  }`}
  role="tab"
  aria-selected={appState.currentView === 'system-status'}
  aria-current={appState.currentView === 'system-status' ? 'page' : undefined}
  aria-label="System Status - Monitor alarm reliability and app health"
  aria-controls="main-content"
>
  <CheckCircle className="w-5 h-5 mb-1" aria-hidden="true" />
  <span className="text-xs font-medium">Status</span>
</button>
```

#### Add System Status View Case

```typescript
case 'system-status':
  return (
    <ErrorBoundary context="SystemStatus">
      <div className="p-4 space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Status</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Monitor your alarm reliability and app health
          </p>
        </div>

        {/* Service Worker Status */}
        <ServiceWorkerStatus />

        {/* Additional System Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">App Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="font-mono">2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span>Total Alarms:</span>
                <span>{appState.alarms.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Enabled Alarms:</span>
                <span>{appState.alarms.filter(a => a.enabled).length}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Connection Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Online:</span>
                <span className={`flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {isOnline ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
```

## Complete Implementation Example

Here's a complete example showing Option 1 (Settings integration):

### 1. Update App.tsx

```typescript
// Add imports at the top
import ServiceWorkerStatus from './components/ServiceWorkerStatus';
import { useEnhancedServiceWorker } from './hooks/useEnhancedServiceWorker';

function App() {
  // Add service worker hook after existing hooks
  const {
    state: serviceWorkerState,
    updateAlarms: updateServiceWorkerAlarms,
    performHealthCheck
  } = useEnhancedServiceWorker();

  // Update service worker when alarms change
  useEffect(() => {
    if (serviceWorkerState.isInitialized && appState.alarms.length > 0) {
      updateServiceWorkerAlarms(appState.alarms);
    }
  }, [appState.alarms, serviceWorkerState.isInitialized, updateServiceWorkerAlarms]);

  // ... existing code ...

  const renderContent = () => {
    switch (appState.currentView) {
      // ... other cases ...

      case 'settings':
        const appAnalytics = AppAnalyticsService.getInstance();
        appAnalytics.trackPageView('settings');
        return (
          <ErrorBoundary context="EnhancedSettings">
            <div className="p-4 space-y-6 max-w-4xl mx-auto">
              {/* System Status Section */}
              <section aria-labelledby="system-status-heading">
                <h2 id="system-status-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Alarm Reliability Status
                </h2>
                <ServiceWorkerStatus />
              </section>

              {/* Divider */}
              <hr className="border-gray-200 dark:border-dark-600" />

              {/* Existing Settings */}
              <section aria-labelledby="app-settings-heading">
                <h2 id="app-settings-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  App Settings
                </h2>
                <EnhancedSettings
                  user={appState.user}
                  alarms={appState.alarms}
                  onSettingChange={(key, value) => {
                    const appAnalytics = AppAnalyticsService.getInstance();
                    appAnalytics.trackFeatureUsage('settings', 'changed', { key, value });
                  }}
                  onUpdateProfile={auth.updateUserProfile}
                  onSignOut={auth.signOut}
                  isLoading={auth.isLoading}
                  error={auth.error}
                />
              </section>
            </div>
          </ErrorBoundary>
        );

      // ... other cases ...
    }
  };

  // ... rest of component ...
}
```

### 2. Ensure Badge Component Exists

Make sure you have the Badge component. If not, create it:

```typescript
// src/components/ui/badge.tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'destructive' | 'outline' | 'secondary';
}

const badgeVariants = {
  default: 'bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100',
  success: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
  destructive: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
  outline: 'border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300',
  secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
};
```

### 3. Create Utility Function (if needed)

If you don't have a `cn` utility function, create one:

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Usage Benefits

Once integrated, users will see:

- **Real-time Status**: Current service worker and notification state
- **Alarm Count**: Number of alarms scheduled in background
- **Health Monitoring**: Last health check timestamp
- **Error Alerts**: Any issues with alarm reliability
- **Quick Actions**: Buttons to request permissions or perform health checks

## Testing the Integration

1. **Build and run the app**: `npm run dev`
2. **Navigate to Settings**: Click the Settings tab in bottom navigation
3. **Verify Status**: Check that the ServiceWorkerStatus component appears
4. **Test Actions**: Try the "Enable Notifications" and "Health Check" buttons
5. **Create Alarm**: Add an alarm and verify the scheduled count updates

## Styling Customization

The component uses your existing design system with:
- Card components for layout
- Badge components for status indicators
- Button components for actions
- Consistent spacing and colors with your theme

You can customize the appearance by modifying the ServiceWorkerStatus component or adding custom CSS classes.

This integration provides users with complete visibility into the alarm reliability system and gives them control over notification permissions and system health.