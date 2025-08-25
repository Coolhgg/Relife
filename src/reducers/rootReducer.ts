/**
 * Root Application Reducer
 * Combines all domain-specific reducers into a single root reducer
 */

import type { AppState, AppAction } from '../types/app-state';
import { INITIAL_DOMAIN_APP_STATE } from '../constants/initialDomainState';
import { alarmReducer } from './alarmReducer';
import { userReducer } from './userReducer';
import { subscriptionReducer } from './subscriptionReducer';

export const rootReducer = (
  state: AppState = INITIAL_DOMAIN_APP_STATE,
  action: AppAction | { type: 'APP_UPDATE'; payload: AppState } | { type: 'STORE_HYDRATED'; payload: Partial<AppState> }
): AppState => {
  // Handle legacy APP_UPDATE action for gradual migration
  if (action.type === 'APP_UPDATE') {
    return action.payload;
  }
  
  // Handle store hydration from persisted state
  if (action.type === 'STORE_HYDRATED') {
    return {
      ...state,
      ...action.payload,
    };
  }
  return {
    alarm: alarmReducer(state.alarm, action as any),
    user: userReducer(state.user, action as any),
    subscription: subscriptionReducer(state.subscription, action as any),

    // Handle global app actions
    app: handleAppActions(state.app, action),
    navigation: handleNavigationActions(state.navigation, action),
    performance: handlePerformanceActions(state.performance, action),
  };
};

// Helper functions for non-domain specific actions
function handleAppActions(appState: AppState['app'], action: AppAction) {
  // Add app-level actions here in the future
  return appState;
}

function handleNavigationActions(navState: AppState['navigation'], action: AppAction) {
  // Add navigation actions here in the future
  return navState;
}

function handlePerformanceActions(
  perfState: AppState['performance'],
  action: AppAction
) {
  // Add performance tracking actions here in the future
  return perfState;
}

export default rootReducer;
