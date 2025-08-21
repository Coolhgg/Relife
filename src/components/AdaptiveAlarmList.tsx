import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as VirtualList, areEqual } from 'react-window';
import { Clock, MoreVertical, Power as _Power, PowerOff as _PowerOff } from 'lucide-react';
import type { Alarm } from '../types';
import { formatTime, getVoiceMoodConfig } from '../utils';
import { usePerformanceOptimizations, useDeviceCapabilities } from '../hooks/useDeviceCapabilities';

interface AdaptiveAlarmListProps {
  alarms: Alarm[];
  onToggleAlarm: (alarmId: string) => void;
  onEditAlarm: (alarmId: string) => void;
  onDeleteAlarm: (alarmId: string) => void;
  className?: string;
}

interface AlarmItemProps {
  alarm: Alarm;
  onToggleAlarm: (alarmId: string) => void;
  onEditAlarm: (alarmId: string) => void;
  onDeleteAlarm: (alarmId: string) => void;
  isLowEnd: boolean;
  shouldReduceAnimations: boolean;
}

// Memoized alarm item component for performance
const AlarmItem = memo<AlarmItemProps>(({
  alarm,
  onToggleAlarm,
  onEditAlarm,
  onDeleteAlarm,
  isLowEnd,
  shouldReduceAnimations
}) => {
  const voiceMoodConfig = getVoiceMoodConfig(alarm.voiceMood);

  // Optimize for low-end devices by reducing complex styling
  const itemClassName = useMemo(() => {
    const baseClasses = 'bg-white rounded-lg p-4 shadow-sm border border-gray-200';
    const animationClasses = shouldReduceAnimations
      ? ''
      : 'transition-all duration-200 hover:shadow-md hover:border-blue-300';
    const optimizedClasses = isLowEnd
      ? 'transform-gpu' // Use GPU acceleration when available
      : '';

    return `${baseClasses} ${animationClasses} ${optimizedClasses}`.trim();
  }, [shouldReduceAnimations, isLowEnd]);

  const handleToggle = useCallback(() => {
    onToggleAlarm(alarm.id);
  }, [alarm.id, onToggleAlarm]);

  const handleEdit = useCallback(() => {
    onEditAlarm(alarm.id);
  }, [alarm.id, onEditAlarm]);

  const handleDelete = useCallback(() => {
    onDeleteAlarm(alarm.id);
  }, [alarm.id, onDeleteAlarm]);

  // Format days display
  const daysText = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (alarm.days.length === 7) return 'Every day';
    if (alarm.days.length === 0) return 'Never';
    return alarm.days.map(day => dayNames[day]).join(', ');
  }, [alarm.days]);

  return (
    <div className={itemClassName}>
      <div className="flex items-center justify-between">
        {/* Time and label */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" aria-hidden="true" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(alarm.time)}
              </div>
              <div className="text-sm text-gray-600">{alarm.label}</div>
            </div>
          </div>

          {/* Days and voice mood - simplified for low-end devices */}
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span>{daysText}</span>
            {!isLowEnd && ( // Hide complex elements on low-end devices
              <span className="flex items-center gap-1">
                <span aria-hidden="true">{voiceMoodConfig.icon}</span>
                <span>{voiceMoodConfig.name}</span>
              </span>
            )}
            {alarm.snoozeCount > 0 && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                Snoozed {alarm.snoozeCount}x
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle switch */}
          <button
            onClick={handleToggle}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full
              ${shouldReduceAnimations ? '' : 'transition-colors duration-200'}
              ${alarm.enabled
                ? 'bg-blue-600 focus:ring-blue-500'
                : 'bg-gray-200 focus:ring-gray-400'
              }
              focus:outline-none focus:ring-2 focus:ring-offset-2
            `}
            role="switch"
            aria-checked={alarm.enabled}
            aria-label={`${alarm.enabled ? 'Disable' : 'Enable'} alarm ${alarm.label}`}
          >
            <span
              className={`
                inline-block h-4 w-4 rounded-full bg-white shadow transform
                ${shouldReduceAnimations ? '' : 'transition-transform duration-200'}
                ${alarm.enabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>

          {/* Menu button - simplified for low-end devices */}
          {isLowEnd ? (
            <div className="flex gap-1">
              <button
                onClick={handleEdit}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                aria-label={`Edit alarm ${alarm.label}`}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-400 hover:text-red-600 rounded-md"
                aria-label={`Delete alarm ${alarm.label}`}
              >
                Del
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                aria-label={`More options for alarm ${alarm.label}`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {/* Full menu would be implemented here for non-low-end devices */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, areEqual);

AlarmItem.displayName = 'AlarmItem';

// Virtual list item renderer for performance optimization
const VirtualAlarmItem = memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    alarms: Alarm[];
    onToggleAlarm: (alarmId: string) => void;
    onEditAlarm: (alarmId: string) => void;
    onDeleteAlarm: (alarmId: string) => void;
    isLowEnd: boolean;
    shouldReduceAnimations: boolean;
  };
}>(({ index, style, data }) => {
  const { alarms, onToggleAlarm, onEditAlarm, onDeleteAlarm, isLowEnd, shouldReduceAnimations } = data;
  const alarm = alarms[index];

  if (!alarm) return null;

  return (
    <div style={{ ...style, padding: '8px 0' }}>
      <AlarmItem
        alarm={alarm}
        onToggleAlarm={onToggleAlarm}
        onEditAlarm={onEditAlarm}
        onDeleteAlarm={onDeleteAlarm}
        isLowEnd={isLowEnd}
        shouldReduceAnimations={shouldReduceAnimations}
      />
    </div>
  );
});

VirtualAlarmItem.displayName = 'VirtualAlarmItem';

// Main adaptive alarm list component
export const AdaptiveAlarmList: React.FC<AdaptiveAlarmListProps> = ({
  alarms,
  onToggleAlarm,
  onEditAlarm,
  onDeleteAlarm,
  className = ''
}) => {
  const { shouldUseVirtualScrolling, isLowEnd } = useDeviceCapabilities();
  const { shouldReduceAnimations, shouldUseMemoization } = usePerformanceOptimizations();
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize expensive operations for performance
  const memoizedAlarms = useMemo(() => {
    return shouldUseMemoization ? alarms : alarms;
  }, [alarms, shouldUseMemoization]);

  // Sort alarms for consistent rendering
  const sortedAlarms = useMemo(() => {
    return [...memoizedAlarms].sort((a, b) => {
      // Sort by enabled status first, then by time
      if (a.enabled !== b.enabled) {
        return a.enabled ? -1 : 1;
      }
      return a.time.localeCompare(b.time);
    });
  }, [memoizedAlarms]);

  // Virtual list data
  const virtualListData = useMemo(() => ({
    alarms: sortedAlarms,
    onToggleAlarm,
    onEditAlarm,
    onDeleteAlarm,
    isLowEnd,
    shouldReduceAnimations
  }), [sortedAlarms, onToggleAlarm, onEditAlarm, onDeleteAlarm, isLowEnd, shouldReduceAnimations]);

  // Performance monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const listType = shouldUseVirtualScrolling ? 'virtual' : 'standard';
      const itemCount = alarms.length;
      console.log(`AdaptiveAlarmList: Rendering ${itemCount} items using ${listType} list`);
    }
  }, [shouldUseVirtualScrolling, alarms.length]);

  // Empty state
  if (sortedAlarms.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No alarms set</h3>
        <p className="text-gray-500">Create your first alarm to get started</p>
      </div>
    );
  }

  // Determine list rendering strategy based on device capabilities
  if (shouldUseVirtualScrolling && sortedAlarms.length > 10) {
    // Use virtual scrolling for better performance on low-end devices or long lists
    return (
      <div className={`h-96 ${className}`} ref={containerRef}>
        <VirtualList
          height={384} // 24rem in pixels
          width="100%"
          itemCount={sortedAlarms.length}
          itemSize={isLowEnd ? 100 : 120} // Smaller items on low-end devices
          itemData={virtualListData}
          overscanCount={2} // Reduce overscan on low-end devices
        >
          {VirtualAlarmItem}
        </VirtualList>
      </div>
    );
  }

  // Standard list rendering for better devices or short lists
  return (
    <div className={`space-y-3 ${className}`}>
      {sortedAlarms.map(alarm => (
        <AlarmItem
          key={alarm.id}
          alarm={alarm}
          onToggleAlarm={onToggleAlarm}
          onEditAlarm={onEditAlarm}
          onDeleteAlarm={onDeleteAlarm}
          isLowEnd={isLowEnd}
          shouldReduceAnimations={shouldReduceAnimations}
        />
      ))}
    </div>
  );
};

// Performance-optimized wrapper with error boundary
interface AdaptiveAlarmListWrapperProps extends AdaptiveAlarmListProps {
  fallback?: React.ComponentType<{ error: Error }>;
}

class AlarmListErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AdaptiveAlarmList Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <div className="p-4 text-center text-red-600">
          <p>Something went wrong with the alarm list.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const AdaptiveAlarmListWithErrorBoundary: React.FC<AdaptiveAlarmListWrapperProps> = (props) => {
  return (
    <AlarmListErrorBoundary fallback={props.fallback}>
      <AdaptiveAlarmList {...props} />
    </AlarmListErrorBoundary>
  );
};

export default AdaptiveAlarmList;