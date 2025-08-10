import { Plus, Clock, Calendar, Volume2 } from 'lucide-react';
import type { Alarm } from '../types';
import { formatTime, getTimeUntilNextAlarm, getVoiceMoodConfig } from '../utils';

interface DashboardProps {
  alarms: Alarm[];
  onAddAlarm: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ alarms, onAddAlarm }) => {
  const { alarm: nextAlarm, timeUntil } = getTimeUntilNextAlarm(alarms);
  const enabledAlarms = alarms.filter(a => a.enabled);
  
  return (
    <div className="p-4 space-y-6">
      {/* Next Alarm Card */}
      <div className="alarm-card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Next Alarm</h2>
          <Clock className="w-6 h-6 opacity-80" />
        </div>
        
        {nextAlarm ? (
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {formatTime(nextAlarm.time)}
            </div>
            <div className="text-primary-100">
              {nextAlarm.label}
            </div>
            <div className="flex items-center gap-2 text-sm text-primary-200">
              <Calendar className="w-4 h-4" />
              <span>in {timeUntil}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary-200">
              <Volume2 className="w-4 h-4" />
              <span>{getVoiceMoodConfig(nextAlarm.voiceMood).name}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-2xl font-semibold mb-2">No alarms set</div>
            <div className="text-primary-200 mb-4">Add your first alarm to get started</div>
            <button
              onClick={onAddAlarm}
              className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Alarm
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="alarm-card text-center">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {enabledAlarms.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Active Alarms
          </div>
        </div>
        
        <div className="alarm-card text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {alarms.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Alarms
          </div>
        </div>
      </div>

      {/* Recent Alarms */}
      {alarms.length > 0 && (
        <div className="alarm-card">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Recent Alarms
          </h3>
          <div className="space-y-3">
            {alarms.slice(0, 3).map((alarm) => {
              const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);
              
              return (
                <div 
                  key={alarm.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      alarm.enabled ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatTime(alarm.time)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {alarm.label}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{voiceMoodConfig.icon}</span>
                    <div className={`w-2 h-2 rounded-full ${voiceMoodConfig.color}`} />
                  </div>
                </div>
              );
            })}
          </div>
          
          {alarms.length > 3 && (
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                +{alarms.length - 3} more alarms
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="alarm-card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onAddAlarm}
            className="alarm-button alarm-button-primary p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5" />
              <div>
                <div className="font-medium">Add New Alarm</div>
                <div className="text-sm opacity-80">Set up a new wake-up time</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;