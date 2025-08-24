/**
 * Real-time Demo Component
 * Comprehensive demonstration of real-time WebSocket features and types
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Bell, 
  Clock, 
  Brain, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';

import { 
  useRealtime, 
  useRealtimeMessage, 
  useConnectionQuality, 
  useRealtimeMetrics 
} from '../hooks/useRealtime';

import type {
  AlarmTriggeredPayload,
  AlarmDismissedPayload,
  UserPresenceUpdatePayload,
  RecommendationGeneratedPayload,
  SystemNotificationPayload,
  ConnectionStatus,
  RealtimeServiceMetrics
} from '../types/realtime';

const RealtimeDemo: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    connectionStatus,
    service,
    error,
    clearError,
    connect,
    disconnect,
    reconnect,
    alarm,
    user,
    ai,
    push,
    performHealthCheck
  } = useRealtime();

  const { quality: connectionQuality, isGood: hasGoodConnection, shouldWarn } = useConnectionQuality();
  const metrics = useRealtimeMetrics(10000); // Update every 10 seconds

  // Local state for demo data
  const [recentAlarms, setRecentAlarms] = useState<AlarmTriggeredPayload[]>([]);
  const [dismissedAlarms, setDismissedAlarms] = useState<AlarmDismissedPayload[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserPresenceUpdatePayload[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationGeneratedPayload[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotificationPayload[]>([]);
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');

  // Real-time event subscriptions using the hook
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    // Subscribe to alarm events
    unsubscribers.push(
      alarm.onAlarmTriggered((data) => {
        setRecentAlarms(prev => [data, ...prev.slice(0, 4)]);
      })
    );

    unsubscribers.push(
      alarm.onAlarmDismissed((data) => {
        setDismissedAlarms(prev => [data, ...prev.slice(0, 4)]);
      })
    );

    // Subscribe to user presence updates
    unsubscribers.push(
      user.onPresenceUpdate((data) => {
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          return [data, ...filtered].slice(0, 10);
        });
      })
    );

    // Subscribe to AI recommendations
    unsubscribers.push(
      ai.onRecommendation((data) => {
        setRecommendations(prev => [data, ...prev.slice(0, 3)]);
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [alarm, user, ai]);

  // Listen to system notifications using the message hook
  useRealtimeMessage<SystemNotificationPayload>(
    'system_notification',
    (data) => {
      setSystemNotifications(prev => [data, ...prev.slice(0, 5)]);
    },
    []
  );

  // Health check function
  const runHealthCheck = async () => {
    const isHealthy = await performHealthCheck();
    setHealthStatus(isHealthy ? 'healthy' : 'unhealthy');
  };

  // Demo actions
  const simulateAlarmTrigger = async () => {
    if (!service) return;
    
    // This would normally be triggered by the alarm service
    const mockAlarm: AlarmTriggeredPayload = {
      alarm: {
        id: Math.random().toString(36),
        label: 'Morning Routine',
        time: new Date().toLocaleTimeString(),
        enabled: true,
        days: [1, 2, 3, 4, 5],
        userId: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any,
      triggeredAt: new Date(),
      deviceInfo: {
        batteryLevel: 85,
        networkType: 'wifi',
        isCharging: false
      },
      contextualData: {
        weatherCondition: 'sunny',
        ambientLightLevel: 750,
        noiseLevel: 35
      }
    };

    setRecentAlarms(prev => [mockAlarm, ...prev.slice(0, 4)]);
  };

  const updateUserPresence = async () => {
    await user.updatePresence('online');
  };

  const requestAIAnalysis = async () => {
    const analysisId = await ai.requestAnalysis('sleep_pattern', {
      recentSleepData: [
        { date: '2024-08-24', sleepDuration: 7.5, quality: 85 },
        { date: '2024-08-23', sleepDuration: 6.8, quality: 72 }
      ]
    });
    console.log('Analysis requested:', analysisId);
  };

  const testPushNotifications = async () => {
    const success = await push.testNotifications();
    console.log('Push notification test:', success ? 'passed' : 'failed');
  };

  // Connection status indicator
  const getConnectionIcon = () => {
    if (isConnecting) return <Activity className="animate-spin" size={20} />;
    if (isConnected) return <Wifi size={20} />;
    return <WifiOff size={20} />;
  };

  const getConnectionColor = () => {
    if (error) return 'text-red-500';
    if (isConnecting) return 'text-yellow-500';
    if (isConnected && hasGoodConnection) return 'text-green-500';
    if (isConnected) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Activity className="text-blue-500" />
          Real-time WebSocket Demo
        </h1>

        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Connection Status</h3>
              <div className={`flex items-center gap-2 ${getConnectionColor()}`}>
                {getConnectionIcon()}
                <span className="text-sm font-medium">
                  {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            {connectionStatus && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Quality:</span>
                  <span className={getQualityColor(connectionQuality)}>
                    {connectionQuality}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>WebSocket:</span>
                  <span className={connectionStatus.websocket.status === 'connected' ? 'text-green-500' : 'text-red-500'}>
                    {connectionStatus.websocket.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Supabase:</span>
                  <span className={connectionStatus.supabase.status === 'connected' ? 'text-green-500' : 'text-red-500'}>
                    {connectionStatus.supabase.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Push:</span>
                  <span className={connectionStatus.pushNotifications.status === 'subscribed' ? 'text-green-500' : 'text-yellow-500'}>
                    {connectionStatus.pushNotifications.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Metrics</h3>
            {metrics ? (
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Messages/sec:</span>
                  <span>{metrics.messaging.messagesPerSecond.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span>{metrics.messaging.averageLatency.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span>{Math.round(metrics.connections.totalUptime / 60)}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Health:</span>
                  <span className={metrics.health.healthScore > 80 ? 'text-green-500' : 'text-yellow-500'}>
                    {metrics.health.healthScore}/100
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No metrics available</p>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Health Status</h3>
            <div className="flex items-center gap-2 mb-3">
              {healthStatus === 'healthy' && <CheckCircle className="text-green-500" size={20} />}
              {healthStatus === 'unhealthy' && <XCircle className="text-red-500" size={20} />}
              {healthStatus === 'unknown' && <AlertTriangle className="text-gray-500" size={20} />}
              <span className="text-sm font-medium capitalize">{healthStatus}</span>
            </div>
            <button
              onClick={runHealthCheck}
              className="w-full px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Run Health Check
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-200">Real-time Error</h4>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error.message}</p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  Type: {error.type} | Severity: {error.severity}
                </p>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Connection Controls */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={connect}
            disabled={isConnected || isConnecting}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300 hover:bg-green-600 transition-colors"
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={!isConnected}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300 hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
          <button
            onClick={reconnect}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reconnect
          </button>
        </div>

        {/* Demo Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <button
            onClick={simulateAlarmTrigger}
            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm flex items-center gap-1"
          >
            <Clock size={16} />
            Trigger Alarm
          </button>
          <button
            onClick={updateUserPresence}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
          >
            <Users size={16} />
            Update Presence
          </button>
          <button
            onClick={requestAIAnalysis}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
          >
            <Brain size={16} />
            AI Analysis
          </button>
          <button
            onClick={testPushNotifications}
            className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm flex items-center gap-1"
          >
            <Bell size={16} />
            Test Push
          </button>
        </div>

        {/* Real-time Data Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent Alarms */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="text-purple-500" size={20} />
              Recent Alarms
            </h3>
            <div className="space-y-2">
              {recentAlarms.length > 0 ? (
                recentAlarms.map((alarm, index) => (
                  <div key={index} className="bg-white dark:bg-gray-600 rounded p-2 text-sm">
                    <div className="font-medium">{alarm.alarm.label}</div>
                    <div className="text-gray-500 dark:text-gray-300">
                      {alarm.triggeredAt.toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Battery: {alarm.deviceInfo.batteryLevel}% | 
                      Network: {alarm.deviceInfo.networkType}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent alarms</p>
              )}
            </div>
          </div>

          {/* Online Users */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="text-blue-500" size={20} />
              Online Users
            </h3>
            <div className="space-y-2">
              {onlineUsers.length > 0 ? (
                onlineUsers.map((user, index) => (
                  <div key={index} className="bg-white dark:bg-gray-600 rounded p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">User {user.userId.slice(-6)}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.status === 'online' ? 'bg-green-100 text-green-800' :
                        user.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-300">
                      Devices: {user.activeDevices?.length || 0}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No users online</p>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Brain className="text-green-500" size={20} />
              AI Recommendations
            </h3>
            <div className="space-y-2">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <div key={index} className="bg-white dark:bg-gray-600 rounded p-2 text-sm">
                    <div className="font-medium">{rec.recommendation.title}</div>
                    <div className="text-gray-500 dark:text-gray-300">
                      {rec.recommendation.description}
                    </div>
                    <div className="text-xs text-gray-400">
                      Impact: {rec.recommendation.estimatedImpact}/10 | 
                      Confidence: {Math.round(rec.data.confidence * 100)}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recommendations</p>
              )}
            </div>
          </div>
        </div>

        {/* System Notifications */}
        {systemNotifications.length > 0 && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={20} />
              System Notifications
            </h3>
            <div className="space-y-2">
              {systemNotifications.map((notification, index) => (
                <div key={index} className="bg-white dark:bg-gray-600 rounded p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      notification.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      notification.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      notification.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {notification.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealtimeDemo;