/* eslint-disable react-refresh/only-export-components */
/**
 * Wrapper component that provides Struggling Sam optimization features
 * to the entire app through React Context
 */

import React from 'react';
import { StrugglingSamProvider } from '../contexts/StrugglingsamContext';
import EnhancedDashboard from './EnhancedDashboard';
import type { Alarm } from '../types';
import { user } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify

interface StrugglingSamWrapperProps {
  children?: React.ReactNode;
  userId?: string;
  // Dashboard props for when we want to use the enhanced version
  useDashboard?: boolean;
  alarms?: Alarm[];
  onAddAlarm?: () => void;
  onQuickSetup?: (presetType: 'morning' | 'work' | 'custom') => void;
  onNavigateToAdvanced?: () => void;
}

export const StrugglingSamWrapper: React.FC<StrugglingSamWrapperProps> = ({
  children,
  userId,
  useDashboard,
  alarms,
  onAddAlarm,
  onQuickSetup,
  onNavigateToAdvanced,
}) => {
  return (
    <StrugglingSamProvider userId={userId}>
      {useDashboard ? (
        <EnhancedDashboard
          alarms={alarms}
          onAddAlarm={onAddAlarm || (() => {})}
          onQuickSetup={onQuickSetup}
          onNavigateToAdvanced={onNavigateToAdvanced}
          userId={userId}
        />
      ) : (
        children
      )}
    </StrugglingSamProvider>
  );
};

// Hook to determine if we should show Struggling Sam features based on user type
export const usePersonaBasedFeatures = (_user?: any) => {
  // For now, we'll show Struggling Sam features to all users
  // In production, this would check user persona and subscription level
  const shouldShowStrugglingSamFeatures = true;
  const userPersona = user?.persona || 'struggling_sam';

  return {
    shouldShowStrugglingSamFeatures,
    userPersona,
    isStrugglingSam: userPersona === 'struggling_sam',
    isBusyBen: userPersona === 'busy_ben',
    isProfessionalPaula: userPersona === 'professional_paula',
  };
};

export default StrugglingSamWrapper;
