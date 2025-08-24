import React, { useState, useRef, useEffect } from 'react';
import { Clock, Trash2, Edit, Copy, MoreVertical } from 'lucide-react';
import {
  useTouchGestures,
  useHaptic,
  useLongPress,
  useSwipeToDismiss,
} from '../hooks/useMobileTouch';

interface Alarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  days: string[];
  sound: string;
}

interface MobileAlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  className?: string;
}

const MobileAlarmCard: React.FC<MobileAlarmCardProps> = ({
  alarm,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
  className = '',
}) => {
  const [showActions, setShowActions] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const triggerHaptic = useHaptic();
  const cardRef = useRef<HTMLDivElement>(null);

  // Swipe actions
  const swipeRef = useTouchGestures({
    onSwipeLeft: () => {
      setShowActions(true);
      triggerHaptic('light');
    },
    onSwipeRight: () => {
      if (showActions) {
        setShowActions(false);
        triggerHaptic('light');
      }
    },
    preventScroll: true,
  });

  // Long press for context menu
  const longPressRef = useLongPress(() => {
    setShowActions(true);
    triggerHaptic('heavy');
  }, 600);

  // Swipe to delete
  const deleteRef = useSwipeToDismiss(() => {
    onDelete(alarm.id);
    triggerHaptic('warning');
  }, 120);

  // Combine refs
  const combinedRef = (element: HTMLDivElement) => {
    if (element) {
      swipeRef.current = element;
      longPressRef.current = element;
      deleteRef.current = element;
      cardRef.current = element;
    }
  };

  const handleToggle = () => {
    onToggle(alarm.id, !alarm.enabled);
    triggerHaptic(alarm.enabled ? 'light' : 'success');
  };

  const handleAction = (
    action: () => void,
    hapticType: 'light' | 'medium' | 'heavy' = 'light'
  ) => {
    action();
    triggerHaptic(hapticType);
    setShowActions(false);
  };

  const formatDays = (days: string[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes('Saturday') && !days.includes('Sunday')) {
      return 'Weekdays';
    }
    if (days.length === 2 && days.includes('Saturday') && days.includes('Sunday')) {
      return 'Weekends';
    }
    return days.map(day => day.slice(0, 3)).join(', ');
  };

  return (
    <div className="relative">
      {/* Action Buttons (shown on swipe) */}
      {showActions && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center z-10">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-r-xl h-full">
            <ActionButton
              icon={Edit}
              color="blue"
              onPress={() => handleAction(() => onEdit(alarm.id), 'medium')}
            />
            <ActionButton
              icon={Copy}
              color="green"
              onPress={() => handleAction(() => onDuplicate(alarm.id), 'medium')}
            />
            <ActionButton
              icon={Trash2}
              color="red"
              onPress={() => handleAction(() => onDelete(alarm.id), 'heavy')}
            />
          </div>
        </div>
      )}

      {/* Main Card */}
      <div
        ref={combinedRef}
        className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-soft
                   border border-gray-200 dark:border-gray-700 p-4 mb-3
                   transition-all duration-300 touch-manipulation
                   ${isDragging ? 'scale-105 shadow-lg' : ''}
                   ${showActions ? 'mr-36' : ''}
                   ${className}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        {/* Time and Toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Clock
              size={20}
              className={`${alarm.enabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
            />
            <span
              className={`text-2xl font-bold ${
                alarm.enabled
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {alarm.time}
            </span>
          </div>

          {/* Enhanced Toggle Switch */}
          <ToggleSwitch enabled={alarm.enabled} onToggle={handleToggle} />
        </div>

        {/* Alarm Details */}
        <div className="space-y-1">
          <p
            className={`font-medium ${
              alarm.enabled
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {alarm.label || 'Alarm'}
          </p>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {formatDays(alarm.days)}
            </span>
            <span className="text-gray-500 dark:text-gray-500">{alarm.sound}</span>
          </div>
        </div>

        {/* Swipe Indicator */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <MoreVertical size={16} className="text-gray-400 opacity-50" />
        </div>

        {/* Visual feedback for interactions */}
        <div
          className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-200 ${
            isDragging
              ? 'bg-blue-500 bg-opacity-10'
              : showActions
                ? 'bg-gray-500 bg-opacity-5'
                : 'bg-transparent'
          }`}
        />
      </div>
    </div>
  );
};

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onToggle }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const triggerHaptic = useHaptic();

  const handleToggle = () => {
    onToggle();
    triggerHaptic('light');
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full
                 border-2 border-transparent transition-colors duration-300
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 mobile-touch ${
                   enabled ? 'bg-blue-600 shadow-lg' : 'bg-gray-200 dark:bg-gray-700'
                 }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 rounded-full
                   bg-white shadow-lg ring-0 transition-transform duration-300 ${
                     enabled ? 'translate-x-6' : 'translate-x-1'
                   }`}
      />
    </button>
  );
};

interface ActionButtonProps {
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red';
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, color, onPress }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const colorClasses = {
    blue: 'bg-blue-500 text-white hover:bg-blue-600',
    green: 'bg-green-500 text-white hover:bg-green-600',
    red: 'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <button
      ref={buttonRef}
      onClick={onPress}
      className={`flex items-center justify-center w-12 h-full
                 transition-colors duration-200 mobile-touch
                 first:rounded-l-none last:rounded-r-xl
                 ${colorClasses[color]}`}
    >
      <Icon size={20} />
    </button>
  );
};

// Example usage component
export const MobileAlarmList: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([
    {
      id: '1',
      time: '7:00 AM',
      label: 'Morning Workout',
      enabled: true,
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      sound: 'Gentle Chimes',
    },
    {
      id: '2',
      time: '12:30 PM',
      label: 'Lunch Break',
      enabled: false,
      days: ['Monday', 'Wednesday', 'Friday'],
      sound: 'Classic Bell',
    },
  ]);

  const handleToggle = (id: string, enabled: boolean) => {
    setAlarms((prev: any) => // auto: implicit any
      prev.map((alarm: any) => ({ // auto: implicit anyalarm.id === id ? { ...alarm, enabled } : alarm))
    );
  };

  const handleEdit = (id: string) => {
    console.log('Edit alarm:', id);
  };

  const handleDelete = (id: string) => {
    setAlarms((prev: any) => p // auto: implicit anyrev.filter((alarm: any) => a // auto: implicit anylarm.id !== id));
  };

  const handleDuplicate = (id: string) => {
    const alarm = alarms.find((a: any) => a // auto: implicit any.id === id);
    if (alarm) {
      const newAlarm = {
        ...alarm,
        id: Date.now().toString(),
        label: `${alarm.label} (Copy)`,
      };
      setAlarms((prev: any) => [ // auto: implicit any...prev, newAlarm]);
    }
  };

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Your Alarms
      </h2>

      {alarms.map((alarm: any) => ({ // auto: implicit any
        <MobileAlarmCard
          key={alarm.id}
          alarm={alarm}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      ))}

      {alarms.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <p>No alarms yet</p>
          <p className="text-sm mt-1">Tap the + button to create your first alarm</p>
        </div>
      )}
    </div>
  );
};

export default MobileAlarmCard;
