/**
 * Redux DevTools Integration Test Component
 * 
 * This component provides a simple interface to test Redux DevTools integration
 * and demonstrates the debugging capabilities available in development mode.
 */

import React from 'react';
import { Bug, Play, RotateCcw, Database, Settings } from 'lucide-react';
import { useAppSelector, useAppDispatch, useDevTools } from '../store/hooks';

interface ReduxDevToolsTestProps {
  onClose: () => void;
}

export const ReduxDevToolsTest: React.FC<ReduxDevToolsTestProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const alarmState = useAppSelector(state => state.alarm);
  const userState = useAppSelector(state => state.user);
  const subscriptionState = useAppSelector(state => state.subscription);
  const devTools = useDevTools();

  const handleTestAction = (actionType: string) => {
    switch (actionType) {
      case 'TEST_ALARM_CREATE':
        dispatch({
          type: 'ALARM_CREATE',
          payload: {
            id: `test-${Date.now()}`,
            name: 'DevTools Test Alarm',
            time: '09:00',
            enabled: true,
            sound: 'default',
            volume: 0.8,
            daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        } as any);
        break;
      case 'TEST_USER_UPDATE':
        dispatch({
          type: 'USER_UPDATE_PROFILE',
          payload: {
            name: 'DevTools Test User',
            email: 'devtools@relife.com',
            preferences: {
              theme: 'dark',
              language: 'en',
            },
          },
        } as any);
        break;
      case 'TEST_SUBSCRIPTION_UPDATE':
        dispatch({
          type: 'SUBSCRIPTION_UPDATE_TIER',
          payload: {
            tier: 'premium',
            features: ['advanced_scheduling', 'voice_commands'],
          },
        } as any);
        break;
      case 'TEST_ERROR_ACTION':
        dispatch({
          type: 'TEST_ERROR',
          payload: new Error('DevTools Test Error'),
        } as any);
        break;
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Redux DevTools Test is only available in development mode.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bug className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">Redux DevTools Integration Test</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* DevTools Status */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">✅ Redux DevTools Status</h3>
          <div className="text-sm text-green-700 space-y-1">
            <p>• Redux store initialized with DevTools support</p>
            <p>• State persistence enabled for user and alarm settings</p>
            <p>• Action filtering configured for better debugging</p>
            <p>• Time travel debugging available</p>
            <p>• Performance monitoring active</p>
          </div>
        </div>

        {/* Current State Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Alarm State</h4>
            <div className="text-sm text-blue-700">
              <p>Alarms: {alarmState.alarms.length}</p>
              <p>Loading: {alarmState.loading ? 'Yes' : 'No'}</p>
              <p>Error: {alarmState.error ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">User State</h4>
            <div className="text-sm text-purple-700">
              <p>Authenticated: {userState.isAuthenticated ? 'Yes' : 'No'}</p>
              <p>Loading: {userState.loading ? 'Yes' : 'No'}</p>
              <p>Profile: {userState.profile ? 'Loaded' : 'None'}</p>
            </div>
          </div>
          
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-2">Subscription</h4>
            <div className="text-sm text-orange-700">
              <p>Tier: {subscriptionState.currentTier || 'Free'}</p>
              <p>Loading: {subscriptionState.loading ? 'Yes' : 'No'}</p>
              <p>Active: {subscriptionState.isActive ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Play className="w-4 h-4" />
            Test Actions (Watch in DevTools)
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <button
              onClick={() => handleTestAction('TEST_ALARM_CREATE')}
              className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Test Alarm
            </button>
            <button
              onClick={() => handleTestAction('TEST_USER_UPDATE')}
              className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Update User Profile
            </button>
            <button
              onClick={() => handleTestAction('TEST_SUBSCRIPTION_UPDATE')}
              className="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Update Subscription
            </button>
            <button
              onClick={() => handleTestAction('TEST_ERROR_ACTION')}
              className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Test Error Action
            </button>
          </div>
        </div>

        {/* DevTools Helpers */}
        {devTools && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Debug Helpers
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <button
                onClick={devTools.resetAlarms}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4 inline mr-2" />
                Reset All Alarms
              </button>
              <button
                onClick={devTools.resetUser}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4 inline mr-2" />
                Reset User State
              </button>
              <button
                onClick={() => devTools.debugLog('Manual debug log triggered')}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                <Database className="w-4 h-4 inline mr-2" />
                Log State to Console
              </button>
              <button
                onClick={() => (window as any).__RELIFE_DEBUG__?.clearStorage()}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                <Database className="w-4 h-4 inline mr-2" />
                Clear Persisted State
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">How to Use Redux DevTools:</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>1. Open browser DevTools (F12)</p>
            <p>2. Look for "Redux" tab (install Redux DevTools browser extension if missing)</p>
            <p>3. Click test actions above to see state changes</p>
            <p>4. Use time travel debugging to replay actions</p>
            <p>5. Filter actions by type or search for specific changes</p>
            <p>6. View state diff to see exactly what changed</p>
          </div>
        </div>
      </div>
    </div>
  );
};