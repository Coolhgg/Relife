// Advanced Scheduling Dashboard - Simplified Version
import React, { useState } from 'react';
import { Calendar, Clock, Settings, TrendingUp } from 'lucide-react';
import type { Alarm } from '../types';

interface AdvancedSchedulingDashboardProps {
  userId?: string;
  onScheduleAlarm?: (alarmData: any) => void;
  className?: string;
  alarms?: Alarm[];
}

const AdvancedSchedulingDashboard: React.FC<AdvancedSchedulingDashboardProps> = ({
  userId,
  onScheduleAlarm,
  className = '',
  alarms, // auto: added for prop compatibility
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'smart-alarms', label: 'Smart Alarms', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Scheduling Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="text-lg font-semibold mb-2">Active Alarms</h3>
                <p className="text-3xl font-bold text-blue-600">5</p>
              </div>
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="text-lg font-semibold mb-2">Success Rate</h3>
                <p className="text-3xl font-bold text-green-600">87%</p>
              </div>
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="text-lg font-semibold mb-2">Average Wake Time</h3>
                <p className="text-3xl font-bold text-purple-600">6:45 AM</p>
              </div>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Calendar Integration
            </h2>
            <p className="text-gray-600 mb-4">
              Connect your calendar to automatically schedule alarms based on your
              events.
            </p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Connect Calendar
            </button>
          </div>
        );

      case 'smart-alarms':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Smart Alarms</h2>
            <p className="text-gray-600 mb-4">
              AI-powered alarms that adapt to your sleep patterns and schedule.
            </p>
            <button
              onClick={() => onScheduleAlarm?.({ type: 'smart', enabled: true })}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Create Smart Alarm
            </button>
          </div>
        );

      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Advanced Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Smart Wake Window (minutes)
                </label>
                <input
                  type="number"
                  defaultValue={30}
                  className="w-full px-3 py-2 border rounded-lg"
                  min={5}
                  max={60}
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm text-gray-700">
                    Enable adaptive difficulty
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`advanced-scheduling-dashboard bg-gray-50 min-h-screen ${className}`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-3xl font-bold text-gray-900">Advanced Scheduling</h1>
            <p className="text-gray-600 mt-2">
              Intelligent alarm management with AI-powered optimization
            </p>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <nav className="flex space-x-8">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-4 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-screen">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default AdvancedSchedulingDashboard;
