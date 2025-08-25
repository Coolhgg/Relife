/**
 * Performance Monitor Panel - Real-time Performance Metrics
 * 
 * Tracks and displays performance metrics including:
 * - Component render times
 * - Memory usage
 * - FPS monitoring
 * - Bundle analysis
 * - Core Web Vitals
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Clock,
  Zap,
  Memory,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  renderTime: number;
  componentCount: number;
  bundleSize: number;
  networkRequests: {
    active: number;
    completed: number;
    errors: number;
  };
  vitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
}

interface RenderTimeEntry {
  component: string;
  duration: number;
  timestamp: number;
}

export const PerformanceMonitorPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: { used: 0, total: 0, percentage: 0 },
    renderTime: 0,
    componentCount: 0,
    bundleSize: 0,
    networkRequests: { active: 0, completed: 0, errors: 0 },
    vitals: { lcp: 0, fid: 0, cls: 0 },
  });

  const [isMonitoring, setIsMonitoring] = useState(true);
  const [renderTimes, setRenderTimes] = useState<RenderTimeEntry[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();

  // FPS Monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current));
        
        setMetrics(prev => ({ ...prev, fps }));
        
        // Add alert for low FPS
        if (fps < 30) {
          setAlerts(prev => [...prev.slice(-4), `Low FPS detected: ${fps}`]);
        }
        
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
      
      animationFrameRef.current = requestAnimationFrame(measureFPS);
    };

    animationFrameRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMonitoring]);

  // Memory Usage Monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const monitorMemory = () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        const percentage = Math.round((used / total) * 100);

        setMetrics(prev => ({
          ...prev,
          memoryUsage: { used, total, percentage }
        }));

        // Add alert for high memory usage
        if (percentage > 80) {
          setAlerts(prev => [...prev.slice(-4), `High memory usage: ${percentage}%`]);
        }
      }
    };

    const interval = setInterval(monitorMemory, 2000);
    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Performance Observer for Core Web Vitals
  useEffect(() => {
    if (!isMonitoring || typeof window === 'undefined') return;

    let lcpObserver: PerformanceObserver;
    let fidObserver: PerformanceObserver;
    let clsObserver: PerformanceObserver;

    try {
      // Largest Contentful Paint
      lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lcp = entries[entries.length - 1]?.startTime || 0;
        setMetrics(prev => ({ ...prev, vitals: { ...prev.vitals, lcp } }));
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fid = entries[0]?.processingStart - entries[0]?.startTime || 0;
        setMetrics(prev => ({ ...prev, vitals: { ...prev.vitals, fid } }));
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      clsObserver = new PerformanceObserver((entryList) => {
        let cls = 0;
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        setMetrics(prev => ({ ...prev, vitals: { ...prev.vitals, cls } }));
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }

    return () => {
      lcpObserver?.disconnect();
      fidObserver?.disconnect();
      clsObserver?.disconnect();
    };
  }, [isMonitoring]);

  const getVitalStatus = (metric: string, value: number) => {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    status?: 'good' | 'warning' | 'error',
    subtitle?: string
  ) => {
    const statusColors = {
      good: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50',
    };

    return (
      <div className={`p-4 border rounded-lg ${status ? statusColors[status] : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-gray-700">{title}</span>
          </div>
          {status && (
            <div className="flex items-center">
              {status === 'good' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {status === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
              {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${isMonitoring ? 'text-green-500' : 'text-gray-400'}`} />
          <span className="font-medium">Performance Monitor</span>
          <span className={`text-xs px-2 py-1 rounded ${isMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {isMonitoring ? 'ACTIVE' : 'PAUSED'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isMonitoring 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isMonitoring ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => {
              setAlerts([]);
              setRenderTimes([]);
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {renderMetricCard(
          'FPS',
          metrics.fps,
          <Activity className="w-4 h-4 text-blue-500" />,
          metrics.fps >= 60 ? 'good' : metrics.fps >= 30 ? 'warning' : 'error',
          'Frames per second'
        )}
        
        {renderMetricCard(
          'Memory',
          `${metrics.memoryUsage.percentage}%`,
          <Memory className="w-4 h-4 text-purple-500" />,
          metrics.memoryUsage.percentage < 50 ? 'good' : metrics.memoryUsage.percentage < 80 ? 'warning' : 'error',
          `${metrics.memoryUsage.used}MB / ${metrics.memoryUsage.total}MB`
        )}
        
        {renderMetricCard(
          'Render Time',
          `${metrics.renderTime.toFixed(1)}ms`,
          <Clock className="w-4 h-4 text-green-500" />,
          metrics.renderTime < 16 ? 'good' : metrics.renderTime < 33 ? 'warning' : 'error',
          'Average render duration'
        )}
        
        {renderMetricCard(
          'Components',
          metrics.componentCount,
          <Zap className="w-4 h-4 text-orange-500" />,
          undefined,
          'Active components'
        )}
      </div>

      {/* Core Web Vitals */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          Core Web Vitals
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderMetricCard(
            'LCP',
            `${(metrics.vitals.lcp / 1000).toFixed(2)}s`,
            <Clock className="w-4 h-4 text-blue-500" />,
            getVitalStatus('lcp', metrics.vitals.lcp) as any,
            'Largest Contentful Paint'
          )}
          
          {renderMetricCard(
            'FID',
            `${metrics.vitals.fid.toFixed(1)}ms`,
            <Zap className="w-4 h-4 text-green-500" />,
            getVitalStatus('fid', metrics.vitals.fid) as any,
            'First Input Delay'
          )}
          
          {renderMetricCard(
            'CLS',
            metrics.vitals.cls.toFixed(3),
            <Activity className="w-4 h-4 text-purple-500" />,
            getVitalStatus('cls', metrics.vitals.cls) as any,
            'Cumulative Layout Shift'
          )}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            Performance Alerts
          </h4>
          <div className="space-y-1">
            {alerts.map((alert, index) => (
              <div key={index} className="text-sm text-yellow-700 flex items-center gap-2">
                <div className="w-1 h-1 bg-yellow-500 rounded-full" />
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2 text-blue-800">Performance Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Keep FPS above 60 for smooth interactions</li>
          <li>• Monitor memory usage to prevent leaks</li>
          <li>• Use React.memo() for expensive components</li>
          <li>• Implement virtual scrolling for large lists</li>
          <li>• Optimize images and use lazy loading</li>
          <li>• Minimize bundle size with code splitting</li>
        </ul>
      </div>
    </div>
  );
};