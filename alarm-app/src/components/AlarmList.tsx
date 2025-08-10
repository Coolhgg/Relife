import { Edit2, Trash2, Clock } from 'lucide-react';
import type { Alarm } from '../types';
import { formatTime, formatDays, getVoiceMoodConfig } from '../utils';

interface AlarmListProps {
  alarms: Alarm[];
  onToggleAlarm: (alarmId: string, enabled: boolean) => void;
  onEditAlarm: (alarm: Alarm) => void;
  onDeleteAlarm: (alarmId: string) => void;
}

const AlarmList: React.FC<AlarmListProps> = ({
  alarms,
  onToggleAlarm,
  onEditAlarm,
  onDeleteAlarm
}) => {
  if (alarms.length === 0) {
    return (
      <div className="p-4">
        <div className="alarm-card text-center py-12">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            No Alarms Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first alarm to get started with smart wake-ups.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Your Alarms ({alarms.length})
      </h2>
      
      <div className="space-y-3">
        {alarms.map((alarm) => {
          const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);
          
          return (
            <div key={alarm.id} className="alarm-card">
              <div className="flex items-center justify-between">
                {/* Left side - Time and details */}
                <div className="flex items-center gap-4">
                  {/* Toggle switch */}
                  <button
                    onClick={() => onToggleAlarm(alarm.id, !alarm.enabled)}
                    className={`alarm-toggle ${
                      alarm.enabled ? 'alarm-toggle-checked' : 'alarm-toggle-unchecked'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  
                  {/* Alarm info */}
                  <div className={alarm.enabled ? '' : 'opacity-50'}>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatTime(alarm.time)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {alarm.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatDays(alarm.days)}
                    </div>
                    
                    {/* Voice mood indicator */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm">{voiceMoodConfig.icon}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {voiceMoodConfig.name}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${voiceMoodConfig.color}`} />
                    </div>
                  </div>
                </div>
                
                {/* Right side - Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditAlarm(alarm)}
                    className="alarm-button alarm-button-secondary p-2"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this alarm?')) {
                        onDeleteAlarm(alarm.id);
                      }
                    }}
                    className="alarm-button alarm-button-danger p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Snooze count */}
              {alarm.snoozeCount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-300">
                  <div className="text-xs text-orange-600 dark:text-orange-400">
                    Snoozed {alarm.snoozeCount} time{alarm.snoozeCount !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Summary */}
      <div className="mt-6 alarm-card bg-gray-50 dark:bg-dark-200">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {alarms.filter(a => a.enabled).length} of {alarms.length} alarms active
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlarmList;