/**
 * Redux Store Configuration with DevTools Integration
 * 
 * This file sets up the Redux store using Redux Toolkit's configureStore
 * with integrated Redux DevTools for better state debugging and monitoring.
 */

import { configureStore } from '@reduxjs/toolkit';
import { composeWithDevTools } from 'redux-devtools-extension';
import { rootReducer } from '../reducers/rootReducer';
import type { AppState, AppAction } from '../types/app-state';

// Redux DevTools configuration
const devToolsOptions = {
  name: 'Relife Alarm App',
  trace: true,
  traceLimit: 25,
  actionsBlacklist: [
    // Filter out noisy actions that don't need debugging
    'PERFORMANCE_MONITOR_UPDATE',
    'ANALYTICS_TRACK_EVENT',
  ],
  actionsWhitelist: [
    // Highlight important actions for debugging
    'ALARM_CREATE',
    'ALARM_UPDATE',
    'ALARM_DELETE',
    'ALARM_TRIGGER',
    'USER_LOGIN',
    'USER_LOGOUT',
    'SUBSCRIPTION_UPDATE',
  ],
  predicate: (state: AppState, action: AppAction) => {
    // Custom filtering logic - don't log certain actions in production
    if (process.env.NODE_ENV === 'production') {
      return !action.type.startsWith('PERFORMANCE_');
    }
    return true;
  },
  serialize: {
    options: {
      undefined: true,
      function: false,
      symbol: false,
    },
    // Custom replacer to handle complex objects
    replacer: (key: string, value: any) => {
      if (value instanceof Date) {
        return `[Date: ${value.toISOString()}]`;
      }
      if (value instanceof Error) {
        return `[Error: ${value.message}]`;
      }
      return value;
    },
  },
};

// Create the Redux store with DevTools integration
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: [
          'ALARM_AUDIO_LOAD',
          'PERFORMANCE_MONITOR_UPDATE',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['alarm.audioContext', 'performance.metrics'],
      },
      thunk: {
        extraArgument: {
          // Add extra services that thunks might need
          analytics: null, // Will be injected at runtime
          storage: localStorage,
        },
      },
    }),
  devTools: process.env.NODE_ENV !== 'production' && composeWithDevTools(devToolsOptions),
  preloadedState: undefined, // Will be populated from localStorage if available
  enhancers: (defaultEnhancers) => {
    // Add any custom enhancers here
    return defaultEnhancers;
  },
});

// Export store types for TypeScript support
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks for use in components
export type { AppState, AppAction } from '../types/app-state';

// Store subscription for persistence
let currentState = store.getState();

store.subscribe(() => {
  const previousState = currentState;
  currentState = store.getState();

  // Persist critical state changes to localStorage
  if (previousState.user !== currentState.user) {
    try {
      localStorage.setItem('relife_user_state', JSON.stringify(currentState.user));
    } catch (error) {
      console.warn('Failed to persist user state:', error);
    }
  }

  if (previousState.alarm.settings !== currentState.alarm.settings) {
    try {
      localStorage.setItem('relife_alarm_settings', JSON.stringify(currentState.alarm.settings));
    } catch (error) {
      console.warn('Failed to persist alarm settings:', error);
    }
  }
});

// Initialize store with persisted state
export const initializeStoreWithPersistedState = () => {
  try {
    const persistedUserState = localStorage.getItem('relife_user_state');
    const persistedAlarmSettings = localStorage.getItem('relife_alarm_settings');

    if (persistedUserState || persistedAlarmSettings) {
      const preloadedState: Partial<AppState> = {};

      if (persistedUserState) {
        preloadedState.user = JSON.parse(persistedUserState);
      }

      if (persistedAlarmSettings) {
        preloadedState.alarm = {
          ...store.getState().alarm,
          settings: JSON.parse(persistedAlarmSettings),
        };
      }

      // Dispatch an action to restore the persisted state
      store.dispatch({
        type: 'STORE_HYDRATED',
        payload: preloadedState,
      } as any);
    }
  } catch (error) {
    console.warn('Failed to restore persisted state:', error);
  }
};

// Development helpers
if (process.env.NODE_ENV === 'development') {
  // Add store to window for debugging
  (window as any).__RELIFE_STORE__ = store;
  
  // Log store initialization
  console.log('🏪 Redux Store initialized with DevTools support');
  console.log('🔧 Available DevTools features:');
  console.log('  - Time travel debugging');
  console.log('  - Action filtering and search');
  console.log('  - State diff visualization');
  console.log('  - Performance monitoring');
  
  // Store debugging helpers
  (window as any).__RELIFE_DEBUG__ = {
    getState: () => store.getState(),
    dispatch: store.dispatch,
    resetAlarms: () => store.dispatch({ type: 'ALARM_RESET_ALL' } as any),
    resetUser: () => store.dispatch({ type: 'USER_RESET' } as any),
    clearStorage: () => {
      localStorage.removeItem('relife_user_state');
      localStorage.removeItem('relife_alarm_settings');
      console.log('✅ Cleared persisted state');
    },
  };
}

export default store;