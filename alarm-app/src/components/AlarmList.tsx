import { useState, useEffect } from 'react';
import { Edit2, Trash2, Clock } from 'lucide-react';
import type { Alarm } from '../types';
import { formatTime, formatDays, getVoiceMoodConfig } from '../utils';
import { AdaptiveConfirmationModal } from './AdaptiveModal';
import { useScreenReaderAnnouncements, useFocusAnnouncements } from '../hooks/useScreenReaderAnnouncements';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { announce, announceListChange } = useScreenReaderAnnouncements();
  const { announceEnter } = useFocusAnnouncements('Alarm List');

  // Announce when entering the alarm list
  useEffect(() => {
    announceEnter(`Showing ${alarms.length} alarms`);
  }, []);

  // Announce when alarm count changes
  useEffect(() => {
    const alarmCountMessage = alarms.length === 0 
      ? 'No alarms configured' 
      : alarms.length === 1 
      ? '1 alarm configured' 
      : `${alarms.length} alarms configured`;
    
    // Only announce if this isn't the initial load
    const timer = setTimeout(() => {
      announce({
        type: 'custom',
        message: alarmCountMessage,
        priority: 'polite'
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [alarms.length, announce]);

  const handleDeleteConfirm = (alarmId?: string) => {
    const idToDelete = alarmId || deleteConfirmId;
    if (idToDelete) {
      const alarm = alarms.find(a => a.id === idToDelete);
      onDeleteAlarm(idToDelete);
      setDeleteConfirmId(null);
      
      // Announce deletion
      if (alarm) {
        announce({
          type: 'alarm-delete',
          data: { alarm },
          priority: 'polite'
        });
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
    announce({
      type: 'custom',
      message: 'Delete cancelled',
      priority: 'polite'
    });
  };

  const handleToggleAlarm = (alarmId: string, enabled: boolean) => {
    const alarm = alarms.find(a => a.id === alarmId);
    onToggleAlarm(alarmId, enabled);
    
    // Announce toggle
    if (alarm) {
      announce({
        type: 'alarm-toggle',
        data: { alarm, enabled },
        priority: 'polite'
      });
    }
  };

  const handleEditAlarm = (alarm: Alarm) => {
    onEditAlarm(alarm);
    announce({
      type: 'custom',
      message: `Editing alarm for ${formatTime(alarm.time)} ${alarm.label}`,
      priority: 'polite'
    });
  };

  const handleDeleteRequest = (alarmId: string) => {
    const alarm = alarms.find(a => a.id === alarmId);
    setDeleteConfirmId(alarmId);
    
    if (alarm) {
      announce({
        type: 'custom',
        message: `Delete confirmation requested for ${formatTime(alarm.time)} ${alarm.label}. Press confirm to delete or cancel to keep the alarm.`,
        priority: 'assertive'
      });
    }
  };
  if (alarms.length === 0) {
    return (
      <main className="p-4" role="main" aria-labelledby="alarms-heading">
        <h2 id="alarms-heading" className="sr-only">Alarms</h2>
        <div className="alarm-card text-center py-12" role="region" aria-label="Empty alarms state">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" aria-hidden="true" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            No Alarms Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first alarm to get started with smart wake-ups.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4" role="main" aria-labelledby="alarms-heading">
      <h2 id="alarms-heading" className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Your Alarms ({alarms.length})
      </h2>
      
      <ul className="space-y-3" role="list" aria-label="List of alarms">
        {alarms.map((alarm) => {
          const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);
          
          return (
            <li key={alarm.id} role="listitem">
              <article 
                className="alarm-card"
                aria-labelledby={`alarm-${alarm.id}-time`}
                aria-describedby={`alarm-${alarm.id}-details`}
              >
              <div className="flex items-center justify-between">
                {/* Left side - Time and details */}
                <div className="flex items-center gap-4">
                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggleAlarm(alarm.id, !alarm.enabled)}
                    className={`alarm-toggle ${
                      alarm.enabled ? 'alarm-toggle-checked' : 'alarm-toggle-unchecked'
                    }`}
                    role="switch"
                    aria-checked={alarm.enabled}
                    aria-label={`${alarm.enabled ? 'Disable' : 'Enable'} alarm for ${formatTime(alarm.time)} ${alarm.label}`}
                    aria-describedby={`alarm-${alarm.id}-status`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                      aria-hidden="true"
                    />
                    <span id={`alarm-${alarm.id}-status`} className="sr-only">
                      Alarm is {alarm.enabled ? 'enabled' : 'disabled'}
                    </span>
                  </button>
                  
                  {/* Alarm info */}
                  <div className={alarm.enabled ? '' : 'opacity-50'}>
                    <div 
                      id={`alarm-${alarm.id}-time`}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      {formatTime(alarm.time)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {alarm.label}
                    </div>
                    <div 
                      id={`alarm-${alarm.id}-details`}
                      className="text-xs text-gray-500 dark:text-gray-500 mt-1"
                    >
                      {formatDays(alarm.days)}
                    </div>
                    
                    {/* Voice mood indicator */}
                    <div className="flex items-center gap-2 mt-2" role="img" aria-label={`Voice mood: ${voiceMoodConfig.name}`}>
                      <span className="text-sm" aria-hidden="true">{voiceMoodConfig.icon}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {voiceMoodConfig.name}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${voiceMoodConfig.color}`} aria-hidden="true" />
                    </div>
                  </div>
                </div>
                
                {/* Right side - Action buttons */}
                <div className="flex items-center gap-2" role="group" aria-label="Alarm actions">
                  <button
                    onClick={() => handleEditAlarm(alarm)}
                    className="alarm-button alarm-button-secondary p-2"
                    aria-label={`Edit alarm ${formatTime(alarm.time)} ${alarm.label}`}
                  >
                    <Edit2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteRequest(alarm.id)}
                    className="alarm-button alarm-button-danger p-2"
                    aria-label={`Delete alarm ${formatTime(alarm.time)} ${alarm.label}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              
              {/* Snooze count */}
              {alarm.snoozeCount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-300">
                  <div 
                    className="text-xs text-orange-600 dark:text-orange-400"
                    role="status"
                    aria-label={`This alarm has been snoozed ${alarm.snoozeCount} time${alarm.snoozeCount !== 1 ? 's' : ''}`}
                  >
                    Snoozed {alarm.snoozeCount} time{alarm.snoozeCount !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
              </article>
            </li>
          );
        })}
      </ul>
      
      {/* Summary */}
      <div className="mt-6 alarm-card bg-gray-50 dark:bg-dark-200" role="status" aria-label="Alarms summary">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {alarms.filter(a => a.enabled).length} of {alarms.length} alarms active
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <AdaptiveConfirmationModal
        isOpen={deleteConfirmId !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Alarm"
        message="Are you sure you want to delete this alarm? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        announceOnOpen="Delete confirmation dialog opened. Are you sure you want to delete this alarm?"
        announceOnClose="Delete confirmation dialog closed"
      />
    </main>
  );
};

export default AlarmList;