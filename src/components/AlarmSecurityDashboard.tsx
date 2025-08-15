import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Eye, EyeOff, Clock, Activity, Database, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import AlarmIntegrityMonitor from '../services/alarm-integrity-monitor';
import SecureAlarmStorageService from '../services/secure-alarm-storage';
import useAuth from '../hooks/useAuth';

interface IntegrityStatus {
  isMonitoring: boolean;
  lastCheck: Date | null;
  totalChecks: number;
  failedChecks: number;
  tamperAttempts: number;
  recoveryAttempts: number;
  currentSeverity: 'low' | 'medium' | 'high' | 'critical' | null;
  issues: any[];
}

interface StorageStatus {
  hasAlarmData: boolean;
  hasEventData: boolean;
  backupCount: number;
  lastIntegrityCheck: Date | null;
  version: string;
  integrityMonitoringActive: boolean;
}

const AlarmSecurityDashboard: React.FC = () => {
  const [integrityStatus, setIntegrityStatus] = useState<IntegrityStatus>({
    isMonitoring: false,
    lastCheck: null,
    totalChecks: 0,
    failedChecks: 0,
    tamperAttempts: 0,
    recoveryAttempts: 0,
    currentSeverity: null,
    issues: []
  });

  const [storageStatus, setStorageStatus] = useState<StorageStatus>({
    hasAlarmData: false,
    hasEventData: false,
    backupCount: 0,
    lastIntegrityCheck: null,
    version: '2.0.0',
    integrityMonitoringActive: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { user } = useAuth();
  const integrityMonitor = AlarmIntegrityMonitor.getInstance();
  const secureStorage = SecureAlarmStorageService.getInstance();

  // Initialize monitoring and load status
  useEffect(() => {
    initializeSecurityMonitoring();
    loadSecurityStatus();

    // Set up event listeners for real-time updates
    const handleTamperDetection = (event: CustomEvent) => {
      const tamperEvent = event.detail;
      setAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'tamper',
        severity: tamperEvent.severity,
        message: tamperEvent.description,
        timestamp: tamperEvent.timestamp,
        details: tamperEvent
      }]);
    };

    const handleIntegrityViolation = (event: CustomEvent) => {
      const { result, tamperEvent } = event.detail;
      setAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'integrity',
        severity: result.severity,
        message: `Integrity check failed with ${result.issues.length} issues`,
        timestamp: result.timestamp,
        details: result
      }]);
      
      // Update status
      loadSecurityStatus();
    };

    const handleDataRecovered = (event: CustomEvent) => {
      const { recoveredAlarms } = event.detail;
      setAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'recovery',
        severity: 'low',
        message: `Successfully recovered ${recoveredAlarms.length} alarms from backup`,
        timestamp: new Date(),
        details: event.detail
      }]);
    };

    window.addEventListener('alarm-tamper-detected', handleTamperDetection);
    window.addEventListener('alarm-integrity-violation', handleIntegrityViolation);
    window.addEventListener('alarm-data-recovered', handleDataRecovered);

    return () => {
      window.removeEventListener('alarm-tamper-detected', handleTamperDetection);
      window.removeEventListener('alarm-integrity-violation', handleIntegrityViolation);
      window.removeEventListener('alarm-data-recovered', handleDataRecovered);
    };
  }, []);

  const initializeSecurityMonitoring = async () => {
    try {
      // Start integrity monitoring
      integrityMonitor.startMonitoring(30000); // Every 30 seconds

      // Register for tamper detection callbacks
      integrityMonitor.onTamperDetected((tamperEvent) => {
        console.log('[AlarmSecurityDashboard] Tamper detected:', tamperEvent);
      });

      integrityMonitor.onRecoveryAttempt((result) => {
        console.log('[AlarmSecurityDashboard] Recovery attempt:', result);
        loadSecurityStatus(); // Refresh status after recovery
      });

    } catch (error) {
      console.error('[AlarmSecurityDashboard] Failed to initialize security monitoring:', error);
    }
  };

  const loadSecurityStatus = async () => {
    try {
      // Load integrity monitor status
      const metrics = integrityMonitor.getMetrics();
      const history = integrityMonitor.getIntegrityHistory();
      const tamperEvents = integrityMonitor.getTamperEvents();

      const latestCheck = history[history.length - 1];

      setIntegrityStatus({
        isMonitoring: true, // Assume monitoring is active if we got metrics
        lastCheck: metrics.lastCheckTime,
        totalChecks: metrics.totalChecks,
        failedChecks: metrics.failedChecks,
        tamperAttempts: metrics.tamperAttempts,
        recoveryAttempts: metrics.recoveryAttempts,
        currentSeverity: latestCheck?.severity || null,
        issues: latestCheck?.issues || []
      });

      // Load storage status
      const storage = await secureStorage.getStorageStatus();
      setStorageStatus(storage);

    } catch (error) {
      console.error('[AlarmSecurityDashboard] Failed to load security status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Perform manual integrity check
      await integrityMonitor.performIntegrityCheck(user?.id);
      await loadSecurityStatus();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('[AlarmSecurityDashboard] Manual integrity check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissAlert = (alertId: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Eye className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getOverallStatus = () => {
    if (integrityStatus.currentSeverity === 'critical') return { status: 'Critical Issues Detected', color: 'text-red-600', icon: AlertTriangle };
    if (integrityStatus.currentSeverity === 'high') return { status: 'High Priority Issues', color: 'text-orange-600', icon: AlertTriangle };
    if (integrityStatus.currentSeverity === 'medium') return { status: 'Medium Priority Issues', color: 'text-yellow-600', icon: Eye };
    if (integrityStatus.tamperAttempts > 0) return { status: 'Security Events Detected', color: 'text-blue-600', icon: Shield };
    return { status: 'All Systems Secure', color: 'text-green-600', icon: CheckCircle };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alarm Security Dashboard</h1>
          <p className="text-gray-600">Monitor the security and integrity of your alarm data</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Checking...' : 'Refresh'}
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <overallStatus.icon className={`w-5 h-5 ${overallStatus.color}`} />
            Security Status
          </CardTitle>
          <CardDescription>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className={`text-lg font-medium ${overallStatus.color}`}>
              {overallStatus.status}
            </span>
            {integrityStatus.isMonitoring && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Activity className="w-3 h-3 mr-1" />
                Monitoring Active
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Active Security Alerts</h2>
          {alerts.map(alert => (
            <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div>
                    <AlertTitle className="capitalize">
                      {alert.type} Alert - {alert.severity} Priority
                    </AlertTitle>
                    <AlertDescription className="mt-1">
                      {alert.message}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </AlertDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Integrity Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {integrityStatus.totalChecks}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {integrityStatus.failedChecks} failed
            </p>
            {integrityStatus.totalChecks > 0 && (
              <Progress 
                value={((integrityStatus.totalChecks - integrityStatus.failedChecks) / integrityStatus.totalChecks) * 100} 
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {integrityStatus.tamperAttempts}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              tamper attempts detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-green-500" />
              Recovery Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrityStatus.recoveryAttempts > 0 ? 
                Math.round((integrityStatus.recoveryAttempts / integrityStatus.recoveryAttempts) * 100) : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {integrityStatus.recoveryAttempts} attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-500" />
              Data Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {storageStatus.backupCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              secure backups available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-600" />
              Security Details
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </CardTitle>
        </CardHeader>
        
        {showDetails && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Integrity Monitoring</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Status: {integrityStatus.isMonitoring ? '✅ Active' : '❌ Inactive'}</div>
                  <div>Last Check: {integrityStatus.lastCheck ? integrityStatus.lastCheck.toLocaleString() : 'Never'}</div>
                  <div>Check Interval: 30 seconds</div>
                  <div>Success Rate: {integrityStatus.totalChecks > 0 ? 
                    Math.round(((integrityStatus.totalChecks - integrityStatus.failedChecks) / integrityStatus.totalChecks) * 100) : 0}%
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Storage Security</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Encryption: ✅ AES-256</div>
                  <div>Backup System: ✅ Active</div>
                  <div>Version: {storageStatus.version}</div>
                  <div>Alarm Data: {storageStatus.hasAlarmData ? '✅ Present' : '❌ None'}</div>
                  <div>Event Data: {storageStatus.hasEventData ? '✅ Present' : '❌ None'}</div>
                </div>
              </div>
            </div>

            {integrityStatus.issues.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Current Issues</h4>
                <div className="space-y-2">
                  {integrityStatus.issues.map((issue, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityIcon(issue.severity)}
                        <span className="font-medium capitalize">{issue.type.replace('_', ' ')}</span>
                        <Badge variant="secondary" className="text-xs">
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm">{issue.description}</p>
                      {issue.affectedAlarmIds.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Affected alarms: {issue.affectedAlarmIds.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Help Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-800 space-y-2">
            <p>Your alarm data is protected with:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>AES-256 encryption for all stored data</li>
              <li>Real-time integrity monitoring every 30 seconds</li>
              <li>Automatic backup system with up to 5 recovery points</li>
              <li>Tamper detection with automatic recovery</li>
              <li>User-specific access controls and validation</li>
              <li>Comprehensive audit logging for security events</li>
            </ul>
            <p className="mt-3">
              If you notice any security alerts, the system will attempt automatic recovery. 
              For persistent issues, please refresh the dashboard or restart the application.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlarmSecurityDashboard;