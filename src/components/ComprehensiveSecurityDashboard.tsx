// Comprehensive Security Dashboard Component
// Provides a unified interface for monitoring all alarm security features

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Archive, Eye, Zap, Lock, Activity } from 'lucide-react';
import AlarmSecurityIntegrationService from '../services/alarm-security-integration';
import SecurityMonitoringForensicsService from '../services/security-monitoring-forensics';
import AlarmBackupRedundancyService from '../services/alarm-backup-redundancy';
import AlarmRateLimitingService from '../services/alarm-rate-limiting';

interface SecurityStatus {
  overall: 'secure' | 'warning' | 'critical' | 'compromised';
  components: {
    storage: 'active' | 'degraded' | 'failed';
    integrity: 'monitoring' | 'degraded' | 'compromised';
    pushSecurity: 'active' | 'degraded' | 'failed';
    accessControl: 'active' | 'bypassed' | 'failed';
    backup: 'healthy' | 'degraded' | 'failed';
    monitoring: 'active' | 'degraded' | 'offline';
    rateLimiting: 'active' | 'degraded' | 'bypassed';
    apiSecurity: 'active' | 'degraded' | 'failed';
  };
  metrics: {
    totalThreats: number;
    activeAlerts: number;
    backupHealth: number;
    integrityScore: number;
    lastUpdate: Date;
  };
  recommendations: string[];
}

interface SecurityAlert {
  id: string;
  timestamp: Date;
  type: 'immediate' | 'hourly' | 'daily';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  acknowledged: boolean;
  resolved: boolean;
}

const ComprehensiveSecurityDashboard: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<SecurityAlert[]>([]);
  const [diagnosticsResults, setDiagnosticsResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'diagnostics' | 'backup'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadSecurityData();
    
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    // Listen for real-time security events
    const handleSecurityAlert = (event: any) => {
      console.log('New security alert:', event.detail);
      loadSecurityData(); // Refresh data when new alerts come in
    };

    const handleTamperDetection = (event: any) => {
      console.error('Tamper detection:', event.detail);
      loadSecurityData();
    };

    window.addEventListener('security-alert-created', handleSecurityAlert);
    window.addEventListener('alarm-tamper-detected', handleTamperDetection);

    return () => {
      window.removeEventListener('security-alert-created', handleSecurityAlert);
      window.removeEventListener('alarm-tamper-detected', handleTamperDetection);
    };
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load security status
      const status = await AlarmSecurityIntegrationService.getSecurityStatus();
      setSecurityStatus(status);

      // Load active alerts
      const alerts = await SecurityMonitoringForensicsService.getActiveAlerts();
      setActiveAlerts(alerts);

    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      const results = await AlarmSecurityIntegrationService.runSecurityDiagnostics();
      setDiagnosticsResults(results);
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await SecurityMonitoringForensicsService.acknowledgeAlert(alertId);
      await loadSecurityData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await SecurityMonitoringForensicsService.resolveAlert(alertId);
      await loadSecurityData();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure':
      case 'active':
      case 'healthy':
      case 'monitoring':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'failed':
      case 'compromised':
      case 'offline':
      case 'bypassed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure':
      case 'active':
      case 'healthy':
      case 'monitoring':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-5 h-5" />;
      case 'critical':
      case 'failed':
      case 'compromised':
      case 'offline':
      case 'bypassed':
        return <XCircle className="w-5 h-5" />;
      default:
        return <RefreshCw className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && !securityStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading security dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
          
          <button
            onClick={loadSecurityData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overall Status Card */}
      {securityStatus && (
        <div className={`p-6 rounded-xl border-2 ${
          securityStatus.overall === 'secure' ? 'border-green-200 bg-green-50' :
          securityStatus.overall === 'warning' ? 'border-yellow-200 bg-yellow-50' :
          'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(securityStatus.overall)}
              <h2 className="text-2xl font-semibold">
                System Status: <span className="capitalize">{securityStatus.overall}</span>
              </h2>
            </div>
            <div className="text-sm text-gray-600">
              Last updated: {securityStatus.metrics.lastUpdate.toLocaleTimeString()}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{securityStatus.metrics.totalThreats}</div>
              <div className="text-sm text-gray-600">Total Threats</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{securityStatus.metrics.activeAlerts}</div>
              <div className="text-sm text-gray-600">Active Alerts</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">{securityStatus.metrics.backupHealth}%</div>
              <div className="text-sm text-gray-600">Backup Health</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{securityStatus.metrics.integrityScore}%</div>
              <div className="text-sm text-gray-600">Integrity Score</div>
            </div>
          </div>

          {securityStatus.recommendations.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Recommendations:</h3>
              <ul className="space-y-1">
                {securityStatus.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
          { key: 'diagnostics', label: 'Diagnostics', icon: Zap },
          { key: 'backup', label: 'Backup', icon: Archive }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedTab(key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && securityStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(securityStatus.components).map(([component, status]) => (
            <div key={component} className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {component === 'storage' && <Lock className="w-5 h-5 text-gray-600" />}
                  {component === 'integrity' && <Eye className="w-5 h-5 text-gray-600" />}
                  {component === 'backup' && <Archive className="w-5 h-5 text-gray-600" />}
                  {component === 'monitoring' && <Activity className="w-5 h-5 text-gray-600" />}
                  {!['storage', 'integrity', 'backup', 'monitoring'].includes(component) && <Shield className="w-5 h-5 text-gray-600" />}
                  <h3 className="font-semibold capitalize">{component.replace(/([A-Z])/g, ' $1').trim()}</h3>
                </div>
                {getStatusIcon(status)}
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center space-x-1 ${getStatusColor(status)}`}>
                <span className="capitalize">{status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Security Alerts</h3>
            <div className="text-sm text-gray-600">
              {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>No active security alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {alert.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-1">{alert.title}</h4>
                      <p className="text-sm text-gray-700 mb-3">{alert.description}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Acknowledge
                        </button>
                      )}
                      {!alert.resolved && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'diagnostics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Security Diagnostics</h3>
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
              <span>Run Diagnostics</span>
            </button>
          </div>

          {diagnosticsResults ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center space-x-3 mb-4">
                {getStatusIcon(diagnosticsResults.overall)}
                <h4 className="text-xl font-semibold capitalize">
                  Overall Status: {diagnosticsResults.overall}
                </h4>
              </div>

              <p className="text-gray-700 mb-6">{diagnosticsResults.summary}</p>

              <div className="space-y-4">
                {diagnosticsResults.tests.map((test: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <h5 className="font-medium">{test.name}</h5>
                      <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                      {test.recommendations && test.recommendations.length > 0 && (
                        <ul className="mt-2 text-xs text-gray-500">
                          {test.recommendations.map((rec: string, recIndex: number) => (
                            <li key={recIndex}>• {rec}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-3" />
              <p>Click "Run Diagnostics" to check system security</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'backup' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Backup & Recovery Status</h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-center py-8 text-gray-500">
              <Archive className="w-12 h-12 mx-auto mb-3" />
              <p>Backup status information will be displayed here</p>
              <p className="text-sm">Integration with backup service in progress...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprehensiveSecurityDashboard;