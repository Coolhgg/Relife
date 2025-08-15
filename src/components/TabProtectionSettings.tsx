import React, { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Settings, 
  Clock, 
  Eye, 
  MessageSquare, 
  Download, 
  Upload,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import useTabProtectionSettings from '../hooks/useTabProtectionSettings';
import { formatTimeframe } from '../types/tabProtection';

interface TabProtectionSettingsProps {
  className?: string;
}

export const TabProtectionSettings: React.FC<TabProtectionSettingsProps> = ({ className = '' }) => {
  const {
    settings,
    updateSettings,
    updateProtectionTiming,
    updateCustomMessages,
    updateVisualSettings,
    resetToDefaults,
    exportSettings,
    importSettings
  } = useTabProtectionSettings();

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleImport = () => {
    if (importSettings(importText)) {
      setImportText('');
      setShowImport(false);
      alert('Settings imported successfully!');
    } else {
      alert('Failed to import settings. Please check the format.');
    }
  };

  const handleExport = () => {
    const data = exportSettings();
    navigator.clipboard.writeText(data).then(() => {
      alert('Settings copied to clipboard!');
    }).catch(() => {
      // Fallback: create download link
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tab-protection-settings.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Tab Closure Protection</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Prevent accidental tab closure when alarms are active
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only"
            checked={settings.enabled}
            onChange={(e) => updateSettings({ enabled: e.target.checked })}
          />
          <div className={`w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full`}></div>
        </label>
      </div>

      {settings.enabled && (
        <>
          {/* Protection Timing */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              onClick={() => toggleSection('timing')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="font-medium">Protection Timing</span>
              </div>
              {activeSection === 'timing' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {activeSection === 'timing' && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.protectionTiming.activeAlarmWarning}
                      onChange={(e) => updateProtectionTiming({ activeAlarmWarning: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Warn when alarms are actively ringing</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.protectionTiming.upcomingAlarmWarning}
                      onChange={(e) => updateProtectionTiming({ upcomingAlarmWarning: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Warn for upcoming alarms</span>
                  </label>
                  
                  {settings.protectionTiming.upcomingAlarmWarning && (
                    <div className="ml-6 flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        Threshold: {formatTimeframe(settings.protectionTiming.upcomingAlarmThreshold)}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="1440"
                        step="5"
                        value={settings.protectionTiming.upcomingAlarmThreshold}
                        onChange={(e) => updateProtectionTiming({ upcomingAlarmThreshold: parseInt(e.target.value) })}
                        className="flex-1 max-w-32"
                      />
                    </div>
                  )}
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.protectionTiming.enabledAlarmWarning}
                      onChange={(e) => updateProtectionTiming({ enabledAlarmWarning: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Warn when any alarms are enabled</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Visual Settings */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              onClick={() => toggleSection('visual')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-green-600" />
                <span className="font-medium">Visual Settings</span>
              </div>
              {activeSection === 'visual' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {activeSection === 'visual' && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.visualSettings.showVisualWarning}
                    onChange={(e) => updateVisualSettings({ showVisualWarning: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Show visual warning notifications</span>
                </label>
                
                {settings.visualSettings.showVisualWarning && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Position</label>
                      <select
                        value={settings.visualSettings.position}
                        onChange={(e) => updateVisualSettings({ position: e.target.value as any })}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      >
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                        <option value="top-center">Top Center</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-center">Bottom Center</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Auto-hide after: {settings.visualSettings.autoHideDelay === 0 ? 'Never' : `${settings.visualSettings.autoHideDelay}s`}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        step="5"
                        value={settings.visualSettings.autoHideDelay}
                        onChange={(e) => updateVisualSettings({ autoHideDelay: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Max alarms shown: {settings.visualSettings.maxAlarmsShown}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={settings.visualSettings.maxAlarmsShown}
                        onChange={(e) => updateVisualSettings({ maxAlarmsShown: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.visualSettings.showAlarmDetails}
                        onChange={(e) => updateVisualSettings({ showAlarmDetails: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Show upcoming alarm details</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Import/Export & Reset */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            
            <button
              onClick={() => {
                if (confirm('Reset all tab protection settings to defaults?')) {
                  resetToDefaults();
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {showImport && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your exported settings JSON here..."
                className="w-full h-32 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleImport}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  <Save className="w-3 h-3" />
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportText('');
                  }}
                  className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TabProtectionSettings;