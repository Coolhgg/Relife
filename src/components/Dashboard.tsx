import { Plus, Clock, Calendar, Volume2, Sunrise, Coffee, User } from 'lucide-react';
import type { Alarm } from '../types';
import { formatTime, getTimeUntilNextAlarm, getVoiceMoodConfig } from '../utils';

interface DashboardProps {
  alarms?: Alarm[];
  onAddAlarm: () => void;
  onQuickSetup?: (presetType: 'morning' | 'work' | 'custom') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ alarms = [], onAddAlarm, onQuickSetup }) => {
  const { alarm: nextAlarm, timeUntil } = getTimeUntilNextAlarm(alarms);
  const enabledAlarms = alarms.filter(a => a.enabled);
  
  // Show loading state if alarms is undefined
  if (!alarms) {
    return (
      <main className="p-4 space-y-6" role="main" aria-labelledby="dashboard-heading">
        <div data-testid="loading-spinner" className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} data-testid="alarm-skeleton" className="h-16 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </main>
    );
  }
  
  return (
    <main className="p-4 space-y-6" role="main" aria-labelledby="dashboard-heading">
      <h1 id="dashboard-heading" className="sr-only">Alarm Dashboard</h1>
      {/* Next Alarm Card */}
      <section 
        className="alarm-card bg-gradient-to-br from-primary-500 to-primary-700 text-white"
        role="region"
        aria-labelledby="next-alarm-heading"
        aria-live="polite"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="next-alarm-heading" className="text-lg font-semibold">Next Alarm</h2>
          <Clock className="w-6 h-6 opacity-80" aria-hidden="true" />
        </div>
        
        {nextAlarm ? (
          <div className="space-y-2" role="status" aria-label={`Next alarm is ${nextAlarm.label} at ${formatTime(nextAlarm.time)} in ${timeUntil}`}>
            <div className="text-3xl font-bold" aria-label={`Time: ${formatTime(nextAlarm.time)}`}>
              {formatTime(nextAlarm.time)}
            </div>
            <div className="text-white" aria-label={`Label: ${nextAlarm.label}`}>
              {nextAlarm.label}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/90" role="timer" aria-label={`Alarm rings in ${timeUntil}`}>
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>in {timeUntil}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/90" role="img" aria-label={`Voice mood: ${getVoiceMoodConfig(nextAlarm.voiceMood).name}`}>
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              <span>{getVoiceMoodConfig(nextAlarm.voiceMood).name}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6" role="status">
            <div className="text-2xl font-semibold mb-2">No alarms set</div>
            <div className="text-white/90 mb-6">Let's get you started with your first smart alarm!</div>
            
            {/* Quick Setup Options for New Users */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => onQuickSetup ? onQuickSetup('morning') : onAddAlarm()}
                className="w-full bg-white text-primary-800 px-4 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                aria-label="Quick setup - Morning routine alarm at 7:00 AM"
              >
                <Sunrise className="w-4 h-4" aria-hidden="true" />
                Quick Morning (7:00 AM)
              </button>
              
              <button
                onClick={() => onQuickSetup ? onQuickSetup('work') : onAddAlarm()}
                className="w-full bg-white/90 text-primary-800 px-4 py-3 rounded-lg font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                aria-label="Quick setup - Work day alarm at 6:30 AM"
              >
                <Coffee className="w-4 h-4" aria-hidden="true" />
                Work Day (6:30 AM)
              </button>
            </div>
            
            <button
              onClick={onAddAlarm}
              className="bg-white/80 text-primary-800 px-4 py-2 rounded-lg font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 mx-auto focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
              aria-label="Create custom alarm with your own time and settings"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Custom Setup
            </button>
          </div>
        )}
      </section>

      {/* Quick Stats */}
      <section 
        className="grid grid-cols-2 gap-4"
        role="region"
        aria-labelledby="stats-heading"
      >
        <h2 id="stats-heading" className="sr-only">Alarm Statistics</h2>
        <div 
          className="alarm-card text-center"
          role="status"
          aria-label={`${enabledAlarms.length} active alarms out of ${alarms.length} total`}
        >
          <div 
            className="text-2xl font-bold text-primary-700 dark:text-primary-300"
            aria-label={`${enabledAlarms.length} active`}
          >
            {enabledAlarms.length}
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-200">
            Active Alarms
          </div>
        </div>
        
        <div 
          className="alarm-card text-center"
          role="status"
          aria-label={`${alarms.length} total alarms created`}
        >
          <div 
            className="text-2xl font-bold text-green-700 dark:text-green-300"
            aria-label={`${alarms.length} total`}
          >
            {alarms.length}
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-200">
            Total Alarms
          </div>
        </div>
      </section>

      {/* Recent Alarms */}
      {alarms.length > 0 && (
        <section className="alarm-card" role="region" aria-labelledby="recent-alarms-heading">
          <h3 id="recent-alarms-heading" className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Recent Alarms
          </h3>
          <ul className="space-y-3" role="list" aria-label="Recent alarm summaries">
            {alarms.slice(0, 3).map((alarm) => {
              const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);
              
              return (
                <li key={alarm.id} role="listitem">
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-200 rounded-lg"
                    role="status"
                    aria-label={`Alarm ${formatTime(alarm.time)} ${alarm.label} - ${alarm.enabled ? 'enabled' : 'disabled'} - ${voiceMoodConfig.name} mood`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          alarm.enabled ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        role="img"
                        aria-label={alarm.enabled ? 'Alarm enabled' : 'Alarm disabled'}
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatTime(alarm.time)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {alarm.label}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2" role="img" aria-label={`Voice mood: ${voiceMoodConfig.name}`}>
                      <span className="text-lg" aria-hidden="true">{voiceMoodConfig.icon}</span>
                      <div className={`w-2 h-2 rounded-full ${voiceMoodConfig.color}`} aria-hidden="true" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          
          {alarms.length > 3 && (
            <div className="mt-4 text-center" role="status">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                +{alarms.length - 3} more alarms
              </span>
            </div>
          )}
        </section>
      )}

      {/* Quick Actions */}
      <section className="alarm-card" role="region" aria-labelledby="quick-actions-heading">
        <h3 id="quick-actions-heading" className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-3" role="group" aria-label="Available actions">
          <button
            onClick={onAddAlarm}
            className="alarm-button alarm-button-primary p-4 text-left"
            aria-label="Add new alarm - Set up a new wake-up time"
            aria-describedby="add-alarm-desc"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5" aria-hidden="true" />
              <div>
                <div className="font-medium">Add New Alarm</div>
                <div id="add-alarm-desc" className="text-sm opacity-80">Set up a new wake-up time</div>
              </div>
            </div>
          </button>
          
          {alarms.length > 0 && onQuickSetup && (
            <>
              <button
                onClick={() => onQuickSetup('morning')}
                className="alarm-button alarm-button-secondary p-4 text-left"
                aria-label="Quick morning routine - Add 7:00 AM motivational alarm"
              >
                <div className="flex items-center gap-3">
                  <Sunrise className="w-5 h-5" aria-hidden="true" />
                  <div>
                    <div className="font-medium">Morning Routine</div>
                    <div className="text-sm opacity-80">7:00 AM with motivational wake-up</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => onQuickSetup('work')}
                className="alarm-button alarm-button-secondary p-4 text-left"
                aria-label="Work day setup - Add 6:30 AM professional alarm"
              >
                <div className="flex items-center gap-3">
                  <Coffee className="w-5 h-5" aria-hidden="true" />
                  <div>
                    <div className="font-medium">Work Day</div>
                    <div className="text-sm opacity-80">6:30 AM for your commute</div>
                  </div>
                </div>
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Dashboard;