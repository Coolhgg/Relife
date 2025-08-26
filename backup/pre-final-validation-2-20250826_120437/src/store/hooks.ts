/**
 * Typed Redux Hooks
 *
 * Pre-configured hooks with TypeScript support for the Relife app.
 * These hooks provide type safety when using Redux in components.
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Typed version of useDispatch hook
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Typed version of useSelector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Convenience selectors for common state slices
export const useAlarmState = () => useAppSelector(state => state.alarm);
export const useUserState = () => useAppSelector(state => state.user);
export const useSubscriptionState = () => useAppSelector(state => state.subscription);
export const useAppState = () => useAppSelector(state => state.app);
export const useNavigationState = () => useAppSelector(state => state.navigation);
export const usePerformanceState = () => useAppSelector(state => state.performance);

// Specific selectors for commonly used data
export const useActiveAlarms = () =>
  useAppSelector(state => state.alarm.alarms.filter(alarm => alarm.enabled));

export const useCurrentUser = () => useAppSelector(state => state.user.profile);

export const useSubscriptionTier = () =>
  useAppSelector(state => state.subscription.currentTier);

export const useIsLoading = () =>
  useAppSelector(state => ({
    alarms: state.alarm.loading,
    user: state.user.loading,
    subscription: state.subscription.loading,
  }));

export const useErrors = () =>
  useAppSelector(state => ({
    alarms: state.alarm.error,
    user: state.user.error,
    subscription: state.subscription.error,
  }));

// DevTools helpers (development only)
export const useDevTools = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector(state => state);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return {
    state,
    dispatch,
    resetAlarms: () => dispatch({ type: 'ALARM_RESET_ALL' } as any),
    resetUser: () => dispatch({ type: 'USER_RESET' } as any),
    debugLog: (message: string) => {
      console.log(`[Redux Debug] ${message}`, state);
    },
  };
};
