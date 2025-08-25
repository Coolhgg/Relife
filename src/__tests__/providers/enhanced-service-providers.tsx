/**
 * Enhanced Service Test Providers
 * Provides enhanced service mocks with dependency injection support
 */

import React, { ReactNode, createContext, useContext } from 'react';
import {
  createMockServiceContainer,
  MockAlarmService,
  MockAnalyticsService,
  MockSubscriptionService,
  MockBattleService,
  MockVoiceService,
} from '../mocks/enhanced-service-mocks';
import type { BaseService, ServiceConfig } from '../../types/service-architecture';

// ============================================================================
// Enhanced Service Context Types
// ============================================================================

export interface EnhancedServiceContainer {
  alarmService: MockAlarmService;
  analyticsService: MockAnalyticsService;
  subscriptionService: MockSubscriptionService;
  battleService: MockBattleService;
  voiceService: MockVoiceService;
}

export interface ServiceProviderProps {
  children: ReactNode;
  services?: Partial<EnhancedServiceContainer>;
  _config?: ServiceConfig;
}

// ============================================================================
// Service Container Context
// ============================================================================

const ServiceContainerContext = createContext<{
  container: EnhancedServiceContainer;
  resetServices: () => Promise<void>;
  initializeServices: () => Promise<void>;
} | null>(null);

// ============================================================================
// Enhanced Service Provider Component
// ============================================================================

export const EnhancedServiceProvider: React.FC<ServiceProviderProps> = ({
  children,
  services = {},
  _config,
}) => {
  // Create service container with dependency injection
  const container = React.useMemo(() => {
    const mockContainer = createMockServiceContainer();

    return {
      alarmService: (services.alarmService ||
        mockContainer.get('alarmService')) as MockAlarmService,
      analyticsService: (services.analyticsService ||
        mockContainer.get('analyticsService')) as MockAnalyticsService,
      subscriptionService: (services.subscriptionService ||
        mockContainer.get('subscriptionService')) as MockSubscriptionService,
      battleService: (services.battleService ||
        mockContainer.get('battleService')) as MockBattleService,
      voiceService: (services.voiceService ||
        mockContainer.get('voiceService')) as MockVoiceService,
    };
  }, [services]);

  const resetServices = React.useCallback(async () => {
    for (const service of Object.values(container)) {
      await service.cleanup();
    }
  }, [container]);

  const initializeServices = React.useCallback(async () => {
    for (const service of Object.values(container)) {
      await service.initialize(_config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto: manual review required; refs: _config
  }, [container, config]);

  const contextValue = {
    container,
    resetServices,
    initializeServices,
  };

  return (
    <ServiceContainerContext.Provider value={contextValue}>
      {children}
    </ServiceContainerContext.Provider>
  );
};

// ============================================================================
// Hooks for accessing services
// ============================================================================

export const useServiceContainer = () => {
  const context = useContext(ServiceContainerContext);
  if (!context) {
    throw new Error(
      'useServiceContainer must be used within an EnhancedServiceProvider'
    );
  }
  return context;
};

export const useEnhancedAlarmService = (): MockAlarmService => {
  const { container } = useServiceContainer();
  return container.alarmService;
};

export const useEnhancedAnalyticsService = (): MockAnalyticsService => {
  const { container } = useServiceContainer();
  return container.analyticsService;
};

export const useEnhancedSubscriptionService = (): MockSubscriptionService => {
  const { container } = useServiceContainer();
  return container.subscriptionService;
};

export const useEnhancedBattleService = (): MockBattleService => {
  const { container } = useServiceContainer();
  return container.battleService;
};

export const useEnhancedVoiceService = (): MockVoiceService => {
  const { container } = useServiceContainer();
  return container.voiceService;
};

// ============================================================================
// Testing Utilities
// ============================================================================

export const createTestServiceContainer = (
  overrides: Partial<EnhancedServiceContainer> = {}
): EnhancedServiceContainer => {
  const container = createMockServiceContainer();

  return {
    alarmService: (overrides.alarmService ||
      container.get('alarmService')) as MockAlarmService,
    analyticsService: (overrides.analyticsService ||
      container.get('analyticsService')) as MockAnalyticsService,
    subscriptionService: (overrides.subscriptionService ||
      container.get('subscriptionService')) as MockSubscriptionService,
    battleService: (overrides.battleService ||
      container.get('battleService')) as MockBattleService,
    voiceService: (overrides.voiceService ||
      container.get('voiceService')) as MockVoiceService,
    ...overrides,
  };
};

export const withEnhancedServices = <P extends object>(
  Component: React.ComponentType<P>,
  services?: Partial<EnhancedServiceContainer>,
  _config?: ServiceConfig
) => {
  return (props: P) => (
    <EnhancedServiceProvider services={services} config={_config}>
      <Component {...props} />
    </EnhancedServiceProvider>
  );
};

export default {
  EnhancedServiceProvider,
  useServiceContainer,
  useEnhancedAlarmService,
  useEnhancedAnalyticsService,
  useEnhancedSubscriptionService,
  useEnhancedBattleService,
  useEnhancedVoiceService,
  createTestServiceContainer,
  withEnhancedServices,
};
