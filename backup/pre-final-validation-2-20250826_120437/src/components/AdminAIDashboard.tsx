/**
 * Admin AI Dashboard Integration Component
 * Simple integration wrapper for adding AI Performance Dashboard to the navigation
 */

import React, { useState } from 'react';
import { ArrowLeft, Settings, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import AIPerformanceDashboard from './AIPerformanceDashboard';
import AIPerformanceDashboardDemo from './AIPerformanceDashboardDemo';

interface AdminAIDashboardProps {
  onBack?: () => void;
}

export default function AdminAIDashboard({ onBack }: AdminAIDashboardProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'demo'>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  AI Performance Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Monitor and analyze AI system performance
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('dashboard')}
              >
                Live Dashboard
              </Button>
              <Button
                variant={currentView === 'demo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('demo')}
              >
                Demo & Docs
              </Button>
            </div>

            <Badge variant="secondary" className="ml-2">
              <Settings className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[calc(100vh-80px)]">
        {currentView === 'dashboard' ? (
          <AIPerformanceDashboard />
        ) : (
          <AIPerformanceDashboardDemo />
        )}
      </div>
    </div>
  );
}

// Example integration in App.tsx:
/*
// Add to the switch statement in renderContent():

case 'ai-admin':
  appAnalytics.trackPageView('ai_admin');
  return (
    <ErrorBoundary context="AdminAIDashboard">
      <AdminAIDashboard
        onBack={() => setAppState(prev => ({ ...prev, currentView: 'dashboard' }))}
      />
    </ErrorBoundary>
  );

// Add to the bottom navigation:
<button
  onClick={() => setAppState(prev => ({ ...prev, currentView: 'ai-admin' }))}
  className="flex flex-col items-center py-2 rounded-lg transition-colors"
  style={appState.currentView === 'ai-admin' ? activeStyle : inactiveStyle}
  role="tab"
  aria-selected={appState.currentView === 'ai-admin'}
>
  <Activity className="w-5 h-5" />
  <span className="text-xs mt-1">AI Admin</span>
</button>
*/
