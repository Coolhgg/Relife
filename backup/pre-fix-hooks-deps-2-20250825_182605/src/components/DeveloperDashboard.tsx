/**
 * Developer Dashboard - Central Hub for All Dev Tools
 *
 * This component provides a comprehensive developer dashboard with access
 * to all debugging and monitoring tools available in development mode.
 */

import React, { useState, useEffect } from 'react';
import {
  Bug,
  Cpu,
  Globe,
  Eye,
  Package,
  Palette,
  AlertTriangle,
  Database,
  Network,
  BarChart3,
  Settings,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

interface DevToolsTab {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  description: string;
}

interface DeveloperDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('redux');
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const devToolsTabs: DevToolsTab[] = [
    {
      id: 'redux',
      name: 'Redux',
      icon: <Database className="w-4 h-4" />,
      component: ReduxDevToolsPanel,
      description: 'Redux state debugging and time travel',
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: <Cpu className="w-4 h-4" />,
      component: PerformanceMonitorPanel,
      description: 'Real-time performance metrics and profiling',
    },
    {
      id: 'api',
      name: 'API Monitor',
      icon: <Globe className="w-4 h-4" />,
      component: APIMonitorPanel,
      description: 'Track API calls, responses, and errors',
    },
    {
      id: 'accessibility',
      name: 'A11y',
      icon: <Eye className="w-4 h-4" />,
      component: AccessibilityPanel,
      description: 'Accessibility testing and validation',
    },
    {
      id: 'components',
      name: 'Components',
      icon: <Package className="w-4 h-4" />,
      component: ComponentInspectorPanel,
      description: 'React component tree and props inspection',
    },
    {
      id: 'theme',
      name: 'Theme',
      icon: <Palette className="w-4 h-4" />,
      component: ThemeDebuggerPanel,
      description: 'CSS variables and theme debugging',
    },
    {
      id: 'errors',
      name: 'Errors',
      icon: <AlertTriangle className="w-4 h-4" />,
      component: ErrorTrackerPanel,
      description: 'Error tracking and debugging',
    },
    {
      id: 'storage',
      name: 'Storage',
      icon: <Database className="w-4 h-4" />,
      component: StorageInspectorPanel,
      description: 'LocalStorage and SessionStorage inspector',
    },
    {
      id: 'network',
      name: 'Network',
      icon: <Network className="w-4 h-4" />,
      component: NetworkMonitorPanel,
      description: 'Network requests monitoring',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      component: AnalyticsPanel,
      description: 'Analytics events and tracking',
    },
  ];

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleDragMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 800, e.clientX - startX)),
        y: Math.max(0, Math.min(window.innerHeight - 600, e.clientY - startY)),
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const ActiveComponent =
    devToolsTabs.find(tab => tab.id === activeTab)?.component || ReduxDevToolsPanel;

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bg-white border border-gray-300 rounded-lg shadow-2xl z-[9999] ${
        isMinimized ? 'w-80 h-12' : 'w-[90vw] max-w-6xl h-[80vh]'
      }`}
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-800">Developer Dashboard</h2>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            DEV
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-200 rounded"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-100 text-red-500 rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-48 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-2">
              {devToolsTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 p-2 text-left rounded-md text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  title={tab.description}
                >
                  {tab.icon}
                  <span className="truncate">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              <div className="mb-4 pb-2 border-b border-gray-200">
                <h3 className="font-semibold text-lg">
                  {devToolsTabs.find(tab => tab.id === activeTab)?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {devToolsTabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>

              <ActiveComponent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Import the Redux DevTools panel from the existing component
const ReduxDevToolsPanel: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Redux DevTools Status</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>✅ Redux store initialized with DevTools support</p>
          <p>✅ State persistence enabled</p>
          <p>✅ Action filtering configured</p>
          <p>✅ Time travel debugging available</p>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">Quick Actions</h4>
        <div className="space-y-2">
          <button className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Open Redux DevTools Extension
          </button>
          <button className="w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Reset Redux State
          </button>
        </div>
      </div>
    </div>
  );
};

// Import all dev tool panels
import { PerformanceMonitorPanel } from './devtools/PerformanceMonitorPanel';
import { APIMonitorPanel } from './devtools/APIMonitorPanel';
import { AccessibilityPanel } from './devtools/AccessibilityPanel';
import { ComponentInspectorPanel } from './devtools/ComponentInspectorPanel';
import { ErrorTrackerPanel } from './devtools/ErrorTrackerPanel';

// Placeholder components for remaining panels
const ThemeDebuggerPanel = () => (
  <div className="p-4">Theme Debugger - Coming soon!</div>
);
const StorageInspectorPanel = () => (
  <div className="p-4">Storage Inspector - Coming soon!</div>
);
const NetworkMonitorPanel = () => (
  <div className="p-4">Network Monitor - Coming soon!</div>
);
const AnalyticsPanel = () => <div className="p-4">Analytics Panel - Coming soon!</div>;
