import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  getItemHeight?: (index: number) => number;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onScroll,
  getItemHeight,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic heights if provided
  const itemHeights = useMemo(() => {
    if (!getItemHeight) return new Array(items.length).fill(itemHeight);
    return items.map((_, index) => getItemHeight(index));
  }, [items.length, getItemHeight, itemHeight]);

  // Calculate cumulative heights for dynamic sizing
  const cumulativeHeights = useMemo(() => {
    const heights = [0];
    for (let i = 0; i < itemHeights.length; i++) {
      heights.push(heights[i] + itemHeights[i]);
    }
    return heights;
  }, [itemHeights]);

  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1];

  // Find visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      cumulativeHeights.findIndex((height: any) => // auto: implicit any height >= scrollTop) - 1
    );

    const endIndex = Math.min(
      items.length - 1,
      cumulativeHeights.findIndex((height: any) => // auto: implicit any height >= scrollTop + containerHeight)
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, containerHeight, cumulativeHeights, items.length, overscan]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  // Visible items with their positions
  const visibleItems = useMemo(() => {
    const items_array = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (items[i]) {
        items_array.push({
          item: items[i],
          index: i,
          top: cumulativeHeights[i],
          height: itemHeights[i],
        });
      }
    }
    return items_array;
  }, [visibleRange, items, cumulativeHeights, itemHeights]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, top, height }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top,
              height,
              width: '100%',
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Optimized list for alarm history
interface AlarmHistoryItem {
  id: string;
  time: string;
  label: string;
  date: Date;
  status: 'dismissed' | 'snoozed' | 'missed';
}

export const VirtualAlarmHistory: React.FC<{
  alarms: AlarmHistoryItem[];
  onItemClick?: (alarm: AlarmHistoryItem) => void;
}> = ({ alarms, onItemClick }) => {
  const renderAlarmItem = useCallback(
    (alarm: AlarmHistoryItem, index: number) => (
      <div
        key={alarm.id}
        className="flex items-center justify-between p-4 border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
        onClick={() => onItemClick?.(alarm)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              alarm.status === 'dismissed'
                ? 'bg-green-400'
                : alarm.status === 'snoozed'
                  ? 'bg-yellow-400'
                  : 'bg-red-400'
            }`}
          />
          <div>
            <div className="text-white font-medium">{alarm.label}</div>
            <div className="text-white/60 text-sm">
              {alarm.date.toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="text-white/80 font-mono">{alarm.time}</div>
      </div>
    ),
    [onItemClick]
  );

  return (
    <VirtualScroll
      items={alarms}
      itemHeight={72}
      containerHeight={400}
      renderItem={renderAlarmItem}
      className="bg-white/5 rounded-lg border border-white/10"
      overscan={3}
    />
  );
};

// Virtual scroll for sleep sessions
interface SleepSessionItem {
  id: string;
  bedtime: Date;
  wakeTime: Date;
  quality: number;
  duration: number;
}

export const VirtualSleepHistory: React.FC<{
  sessions: SleepSessionItem[];
  onItemClick?: (session: SleepSessionItem) => void;
}> = ({ sessions, onItemClick }) => {
  const renderSessionItem = useCallback(
    (session: SleepSessionItem, index: number) => {
      const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
      };

      return (
        <div
          key={session.id}
          className="p-4 border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
          onClick={() => onItemClick?.(session)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">
              {session.bedtime.toLocaleDateString()}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < Math.round(session.quality / 2)
                      ? 'bg-yellow-400'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-white/70">
            <div>
              <span className="block">Bedtime</span>
              <span className="text-white font-mono">
                {session.bedtime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div>
              <span className="block">Wake</span>
              <span className="text-white font-mono">
                {session.wakeTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div>
              <span className="block">Duration</span>
              <span className="text-white font-mono">
                {formatDuration(session.duration)}
              </span>
            </div>
          </div>
        </div>
      );
    },
    [onItemClick]
  );

  return (
    <VirtualScroll
      items={sessions}
      itemHeight={96}
      containerHeight={500}
      renderItem={renderSessionItem}
      className="bg-white/5 rounded-lg border border-white/10"
      overscan={2}
    />
  );
};

// Infinite scroll hook for pagination
export const useInfiniteScroll = <T,>(
  fetchMore: (offset: number) => Promise<T[]>,
  initialData: T[] = [],
  options: {
    threshold?: number;
    pageSize?: number;
  } = {}
) => {
  const { threshold = 200, pageSize = 20 } = options;
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newData = await fetchMore(data.length);
      if (newData.length < pageSize) {
        setHasMore(false);
      }
      setData((prev: any) => // auto: implicit any [...prev, ...newData]);
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchMore, data.length, loading, hasMore, pageSize]);

  const handleScroll = useCallback(
    (scrollTop: number) => {
      const container = document.querySelector('.virtual-scroll-container');
      if (!container) return;

      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      if (scrollHeight - (scrollTop + clientHeight) < threshold) {
        loadMore();
      }
    },
    [loadMore, threshold]
  );

  return { data, loading, hasMore, handleScroll, loadMore };
};

export default VirtualScroll;
