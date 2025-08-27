import React, { useState, useRef } from 'react';
import { Home, Clock, Settings, Moon, Plus } from 'lucide-react';
import {
  useSwipeNavigation,
  useEnhancedButton,
  useHaptic,
} from '../hooks/useMobileTouch';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

interface MobileNavigationProps {
  items: NavigationItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  currentPath,
  onNavigate,
  className = '',
}) => {
  const [showExtended, setShowExtended] = useState(false);
  const triggerHaptic = useHaptic();

  // Swipe up to show extended navigation
  const swipeRef = useSwipeNavigation(
    undefined, // onSwipeLeft
    undefined, // onSwipeRight
    () => {
      setShowExtended(true);
      triggerHaptic('light');
    }, // onSwipeUp
    () => {
      setShowExtended(false);
      triggerHaptic('light');
    } // onSwipeDown
  );

  const handleNavigate = (path: string) => {
    triggerHaptic('light');
    onNavigate(path);
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <nav
        ref={swipeRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900
                   border-t border-gray-200 dark:border-gray-700
                   mobile-safe-bottom backdrop-blur-xl bg-opacity-95 ${className}`}
      >
        {/* Swipe Indicator */}
        <div className="flex justify-center py-1">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Navigation Items */}
        <div className="flex justify-around items-center px-4 pb-2">
          {items.slice(0, 4).map(($1) => {
        // TODO(manual): implement
        return null;
      })
            <NavigationButton
              key={item.id}
              item={item}
              isActive={currentPath === item.path}
              onPress={() => handleNavigate(item.path)}
            />
          ))}

          {/* More Button */}
          {items.length > 4 && (
            <NavigationButton
              item={{
                id: 'more',
                label: 'More',
                icon: Plus,
                path: 'more',
              }}
              isActive={showExtended}
              onPress={() => {
                setShowExtended(!showExtended);
                triggerHaptic('medium');
              }}
            />
          )}
        </div>
      </nav>

      {/* Extended Navigation Panel */}
      {showExtended && items.length > 4 && (
        <ExtendedNavigationPanel
          items={items.slice(4)}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onClose={() => setShowExtended(false)}
        />
      )}
    </>
  );
};

interface NavigationButtonProps {
  item: NavigationItem;
  isActive: boolean;
  onPress: () => void;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  item,
  isActive,
  onPress,
}) => {
  const buttonRef = useEnhancedButton('light');
  const { icon: Icon } = item;

  return (
    <button
      ref={buttonRef}
      onClick={onPress}
      className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg
                 min-h-[48px] min-w-[48px] transition-all duration-200
                 ${
                   isActive
                     ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                     : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                 }`}
      aria-label={item.label}
    >
      <div className="relative">
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        {item.badge && item.badge > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs
                         rounded-full h-4 w-4 flex items-center justify-center
                         min-w-[16px] font-medium"
          >
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </div>
      <span className={`text-xs mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
        {item.label}
      </span>
    </button>
  );
};

interface ExtendedNavigationPanelProps {
  items: NavigationItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onClose: () => void;
}

const ExtendedNavigationPanel: React.FC<ExtendedNavigationPanelProps> = ({
  items,
  currentPath,
  onNavigate,
  onClose,
}) => {
  const panelRef = useSwipeNavigation(
    undefined,
    undefined,
    undefined,
    onClose // Swipe down to close
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed bottom-16 left-4 right-4 bg-white dark:bg-gray-900
                   rounded-2xl shadow-2xl z-50 p-4 animate-slide-up
                   border border-gray-200 dark:border-gray-700"
      >
        <div className="flex justify-center mb-4">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {items.map((item: any) => { // auto
            const { icon: Icon } = item;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.path);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center py-4 px-3
                           rounded-xl transition-all duration-200 min-h-[72px]
                           ${
                             currentPath === item.path
                               ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                               : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                           }`}
              >
                <Icon size={24} strokeWidth={currentPath === item.path ? 2.5 : 2} />
                <span className="text-sm mt-2 font-medium text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

// Default navigation items for the alarm app
export const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/',
  },
  {
    id: 'alarms',
    label: 'Alarms',
    icon: Clock,
    path: '/alarms',
  },
  {
    id: 'sleep',
    label: 'Sleep',
    icon: Moon,
    path: '/sleep',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

export default MobileNavigation;
