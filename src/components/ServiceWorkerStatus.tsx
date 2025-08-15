// Service Worker Status Component - Shows alarm reliability status
import React from 'react';
import { useEnhancedServiceWorker } from '../hooks/useEnhancedServiceWorker';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, Clock, Smartphone, RefreshCw, Bell } from 'lucide-react';

export const ServiceWorkerStatus: React.FC = () => {
  const {
    state,
    performHealthCheck,
    requestNotificationPermission,
    refreshState
  } = useEnhancedServiceWorker();

  const getPermissionBadge = () => {
    switch (state.notificationPermission) {
      case 'granted':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle size={12} />
          Granted
        </Badge>;
      case 'denied':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle size={12} />
          Denied
        </Badge>;
      default:
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock size={12} />
          Not Set
        </Badge>;
    }
  };

  const handleHealthCheck = async () => {
    const result = await performHealthCheck();
    if (result) {
      console.log('Health check result:', result);
    }
  };

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    console.log('Permission result:', permission);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone size={20} />
          Alarm Reliability Status
        </CardTitle>
        <CardDescription>
          Background alarm system powered by service worker
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Initialization Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Service Worker</span>
          {state.isInitialized ? (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle size={12} />
              Active
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle size={12} />
              Inactive
            </Badge>
          )}
        </div>

        {/* Notification Permission */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Notifications</span>
          <div className="flex items-center gap-2">
            {getPermissionBadge()}
            {state.notificationPermission !== 'granted' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRequestPermission}
                className="text-xs h-6"
              >
                <Bell size={12} className="mr-1" />
                Enable
              </Button>
            )}
          </div>
        </div>

        {/* Scheduled Alarms Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Scheduled Alarms</span>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock size={12} />
            {state.scheduledAlarmsCount}
          </Badge>
        </div>

        {/* Last Health Check */}
        {state.lastHealthCheck && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Check</span>
            <span className="text-xs text-muted-foreground">
              {new Date(state.lastHealthCheck).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-destructive" />
              <span className="text-sm text-destructive font-medium">Error</span>
            </div>
            <p className="text-xs text-destructive/80 mt-1">{state.error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleHealthCheck}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw size={12} />
            Health Check
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={refreshState}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw size={12} />
            Refresh
          </Button>
        </div>

        {/* Status Message */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
          {state.isInitialized && state.notificationPermission === 'granted' ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle size={12} />
              Your alarms will work reliably even when the app is closed or you switch tabs.
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle size={12} />
              Enable notifications for best alarm reliability across tabs and when the app is closed.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceWorkerStatus;