/// <reference lib="dom" />
/**
 * Enhanced Test Utilities for Critical User Flows
 *
 * Specialized utilities for testing alarm lifecycle, premium features,
 * voice commands, and analytics integration flows.
 */

import { vi, expect } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import type {
  User,
  Alarm,
  SubscriptionTier,
  VoiceMood,
  PremiumFeature,
  AnalyticsEvent,
  AlarmStatus,
} from '../../src/types';
import { createMockUser, createMockAlarm } from './test-mocks';

// ============================================================================
// Voice Recognition Mocking
// ============================================================================

export interface MockSpeechRecognition {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: any;
  onstart: ((event: any) => void) | null;
  onend: ((event: any) => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onspeechstart: ((event: any) => void) | null;
  onspeechend: ((event: any) => void) | null;
  onnomatch: ((event: any) => void) | null;
  onaudiostart: ((event: any) => void) | null;
  onaudioend: ((event: any) => void) | null;
  onsoundstart: ((event: any) => void) | null;
  onsoundend: ((event: any) => void) | null;
}

export const mockSpeechRecognition = (): MockSpeechRecognition => {
  const recognition = {
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    continuous: false,
    interimResults: false,
    lang: 'en-US',
    maxAlternatives: 1,
    serviceURI: '',
    grammars: null,
    onstart: null as ((event: any) => void) | null,
    onend: null as ((event: any) => void) | null,
    onresult: null as ((event: any) => void) | null,
    onerror: null as ((event: any) => void) | null,
    onspeechstart: null as ((event: any) => void) | null,
    onspeechend: null as ((event: any) => void) | null,
    onnomatch: null as ((event: any) => void) | null,
    onaudiostart: null as ((event: any) => void) | null,
    onaudioend: null as ((event: any) => void) | null,
    onsoundstart: null as ((event: any) => void) | null,
    onsoundend: null as ((event: any) => void) | null,
  };

  return recognition;
};

export const setupVoiceRecognitionMock = () => {
  const recognition = mockSpeechRecognition();

  // Mock the SpeechRecognition constructor
  (global as any).SpeechRecognition = vi.fn(() => recognition);
  (global as any).webkitSpeechRecognition = vi.fn(() => recognition);

  return recognition;
};

export const simulateVoiceCommand = (
  recognition: MockSpeechRecognition,
  command: string,
  confidence = 0.9
) => {
  const event = {
    results: [
      {
        0: {
          transcript: command,
          confidence,
        },
        length: 1,
        isFinal: true,
      },
    ],
    resultIndex: 0,
  };

  if (recognition.onresult) {
    recognition.onresult(event);
  }
};

export const simulateVoiceError = (
  recognition: MockSpeechRecognition,
  error: string = 'network'
) => {
  const event = {
    error,
    message: `Speech recognition error: ${error}`,
  };

  if (recognition.onerror) {
    recognition.onerror(event);
  }
};

// ============================================================================
// Premium Features Testing
// ============================================================================

export const createPremiumUser = (
  features: PremiumFeature[] = ['nuclear_mode', 'custom_sounds', 'unlimited_alarms'],
  tier: SubscriptionTier = 'premium'
): User => {
  return createMockUser({
    subscriptionTier: tier,
    premiumFeatures: features,
    subscriptionId: 'sub_premium_123',
    subscriptionStatus: 'active',
    trialEndsAt: null,
  });
};

export const createTrialUser = (): User => {
  return createMockUser({
    subscriptionTier: 'trial',
    premiumFeatures: ['nuclear_mode', 'custom_sounds'],
    subscriptionId: 'sub_trial_123',
    subscriptionStatus: 'trialing',
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
};

export const createExpiredPremiumUser = (): User => {
  return createMockUser({
    subscriptionTier: 'free',
    premiumFeatures: [],
    subscriptionId: 'sub_expired_123',
    subscriptionStatus: 'canceled',
    trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  });
};

export const expectPremiumFeatureVisible = (screen: any, feature: string) => {
  const featureElement = screen.queryByText(new RegExp(feature, 'i'));
  expect(featureElement).toBeInTheDocument();
};

export const expectPremiumFeatureGated = (
  screen: any,
  upgradeText: string = 'upgrade'
) => {
  const upgradeElement = screen.queryByText(new RegExp(upgradeText, 'i'));
  expect(upgradeElement).toBeInTheDocument();
};

// ============================================================================
// Alarm Lifecycle Testing Utilities
// ============================================================================

export const createComplexAlarm = (overrides: Partial<Alarm> = {}): Alarm => {
  return createMockAlarm({
    time: '07:30',
    label: 'Complex Test Alarm',
    days: [1, 2, 3, 4, 5], // Weekdays
    voiceMood: 'motivational' as VoiceMood,
    sound: 'energetic-beat.mp3',
    volume: 0.8,
    difficulty: 'hard',
    snoozeEnabled: true,
    maxSnoozes: 2,
    nuclearMode: true,
    smartWakeupEnabled: true,
    locationBased: false,
    ...overrides,
  });
};

export const createNuclearAlarm = (overrides: Partial<Alarm> = {}): Alarm => {
  return createComplexAlarm({
    difficulty: 'nuclear',
    nuclearMode: true,
    nuclearChallenges: ['math', 'qr_scan', 'location'],
    maxSnoozes: 0, // No snooze in nuclear mode
    ...overrides,
  });
};

export const fillAlarmForm = async (
  user: ReturnType<typeof userEvent.setup>,
  alarmData: {
    time: string;
    label: string;
    days?: number[];
    voiceMood?: string;
    snoozeEnabled?: boolean;
  }
) => {
  // Fill time
  const timeInput = screen.getByLabelText(/time/i);
  await user.clear(timeInput);
  await user.type(timeInput, alarmData.time);

  // Fill label
  const labelInput = screen.getByLabelText(/label|name/i);
  await user.clear(labelInput);
  await user.type(labelInput, alarmData.label);

  // Select days if provided
  if (alarmData.days) {
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    for (const day of alarmData.days) {
      const dayCheckbox = screen.getByLabelText(dayNames[day]);
      if (!dayCheckbox.checked) {
        await user.click(dayCheckbox);
      }
    }
  }

  // Select voice mood if provided
  if (alarmData.voiceMood) {
    const voiceMoodSelect = screen.getByLabelText(/voice.*mood/i);
    await user.selectOptions(voiceMoodSelect, alarmData.voiceMood);
  }

  // Toggle snooze if specified
  if (alarmData.snoozeEnabled !== undefined) {
    const snoozeToggle = screen.getByLabelText(/snooze/i);
    if (snoozeToggle.checked !== alarmData.snoozeEnabled) {
      await user.click(snoozeToggle);
    }
  }
};

export const simulateAlarmTrigger = async (
  alarm: Alarm,
  options: {
    isSnoozeEnd?: boolean;
    triggeredAt?: Date;
  } = {}
) => {
  const message = {
    type: 'ALARM_TRIGGERED',
    data: {
      alarm,
      triggeredAt: (options.triggeredAt || new Date()).toISOString(),
      isSnoozeEnd: options.isSnoozeEnd || false,
    },
  };

  await act(async () => {
    const messageEvent = new MessageEvent('message', { data: message });
    if (navigator.serviceWorker?.dispatchEvent) {
      navigator.serviceWorker.dispatchEvent(messageEvent);
    }
  });
};

export const expectAlarmRingingState = async (screen: any) => {
  await waitFor(() => {
    const dismissButton = screen.queryByRole('button', { name: /dismiss|stop/i });
    const snoozeButton = screen.queryByRole('button', { name: /snooze/i });
    expect(dismissButton || snoozeButton).toBeInTheDocument();
  });
};

// ============================================================================
// Analytics Testing Utilities
// ============================================================================

export const createMockAnalyticsEvent = (
  eventName: string,
  properties: Record<string, any> = {},
  userId?: string
): AnalyticsEvent => {
  return {
    event: eventName,
    properties: {
      timestamp: new Date().toISOString(),
      userId: userId || 'test-user-123',
      sessionId: 'session-123',
      ...properties,
    },
    timestamp: new Date(),
  };
};

export const mockPostHog = () => {
  const posthog = {
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    get_distinct_id: vi.fn(() => 'test-distinct-id'),
    isFeatureEnabled: vi.fn(() => true),
    onFeatureFlags: vi.fn(),
    getFeatureFlag: vi.fn(),
    group: vi.fn(),
    alias: vi.fn(),
    set_once: vi.fn(),
    set: vi.fn(),
    unset: vi.fn(),
    increment: vi.fn(),
    people: {
      set: vi.fn(),
      set_once: vi.fn(),
      increment: vi.fn(),
      unset: vi.fn(),
    },
  };

  (global as any).posthog = posthog;
  return posthog;
};

export const expectAnalyticsEvent = (
  mockPostHog: any,
  eventName: string,
  expectedProperties?: Record<string, any>
) => {
  expect(mockPostHog.capture).toHaveBeenCalledWith(
    eventName,
    expectedProperties
      ? expect.objectContaining(expectedProperties)
      : expect.any(Object)
  );
};

export const expectAnalyticsIdentify = (
  mockPostHog: any,
  userId: string,
  expectedProperties?: Record<string, any>
) => {
  expect(mockPostHog.identify).toHaveBeenCalledWith(
    userId,
    expectedProperties
      ? expect.objectContaining(expectedProperties)
      : expect.any(Object)
  );
};

// ============================================================================
// Service Worker Testing Utilities
// ============================================================================

export const mockServiceWorker = () => {
  const mockSW = {
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    scriptURL: 'mock-sw.js',
    state: 'activated',
  };

  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: vi.fn().mockResolvedValue({
        installing: null,
        waiting: null,
        active: mockSW,
        addEventListener: vi.fn(),
        unregister: vi.fn().mockResolvedValue(true),
      }),
      ready: Promise.resolve({
        active: mockSW,
        installing: null,
        waiting: null,
        addEventListener: vi.fn(),
        unregister: vi.fn(),
      }),
      controller: mockSW,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getRegistrations: vi.fn().mockResolvedValue([]),
    },
    writable: true,
  });

  return mockSW;
};

export const simulateServiceWorkerMessage = (type: string, data: any) => {
  const message = { type, data };
  const event = new MessageEvent('message', { data: message });

  if (navigator.serviceWorker?.controller) {
    // Simulate message from service worker
    window.dispatchEvent(event);
  }
};

// ============================================================================
// Payment Flow Testing Utilities
// ============================================================================

export const mockStripeElements = () => {
  const cardElement = {
    mount: vi.fn(),
    unmount: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    update: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    clear: vi.fn(),
  };

  const elements = {
    create: vi.fn(() => cardElement),
    getElement: vi.fn(() => cardElement),
  };

  const stripe = {
    elements: vi.fn(() => elements),
    createPaymentMethod: vi.fn().mockResolvedValue({
      paymentMethod: { id: 'pm_test_card' },
      error: null,
    }),
    confirmCardPayment: vi.fn().mockResolvedValue({
      paymentIntent: { status: 'succeeded', id: 'pi_test_123' },
      error: null,
    }),
    confirmCardSetup: vi.fn().mockResolvedValue({
      setupIntent: { status: 'succeeded', id: 'seti_test_123' },
      error: null,
    }),
  };

  (global as any).Stripe = vi.fn(() => stripe);

  return { stripe, elements, cardElement };
};

export const simulateSuccessfulPayment = async (stripe: any) => {
  stripe.confirmCardPayment.mockResolvedValueOnce({
    paymentIntent: {
      status: 'succeeded',
      id: 'pi_success_123',
    },
    error: null,
  });
};

export const simulateFailedPayment = async (
  stripe: any,
  errorMessage = 'Your card was declined.'
) => {
  stripe.confirmCardPayment.mockResolvedValueOnce({
    paymentIntent: null,
    error: {
      type: 'card_error',
      code: 'card_declined',
      message: errorMessage,
    },
  });
};

// ============================================================================
// Test Environment Setup
// ============================================================================

export const renderWithProviders = (
  ui: React.ReactElement,
  options: {
    user?: User;
    initialRoute?: string;
  } = {}
) => {
  const { user: mockUser = createMockUser() } = options;

  // Mock authentication context
  const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    return React.createElement('div', { 'data-testid': 'auth-provider' }, children);
  };

  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(
      BrowserRouter,
      { basename: options.initialRoute },
      React.createElement(AuthProvider, {}, children)
    );
  };

  return render(ui, {
    wrapper: AllProviders,
    ...options,
  });
};

export const waitForLoadingToFinish = async (timeout = 5000) => {
  await waitFor(
    () => {
      const loadingElements = screen.queryAllByText(/loading|wait|spinner/i);
      expect(loadingElements).toHaveLength(0);
    },
    { timeout }
  );
};

export const expectNoConsoleErrors = () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  return () => {
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  };
};

// ============================================================================
// Performance Testing
// ============================================================================

export const measureRenderTime = async (
  renderFn: () => Promise<void> | void
): Promise<number> => {
  const startTime = performance.now();
  await renderFn();
  const endTime = performance.now();
  return endTime - startTime;
};

export const expectRenderTimeUnder = (renderTime: number, maxMs: number) => {
  expect(renderTime).toBeLessThan(maxMs);
};

// ============================================================================
// Accessibility Testing Helpers
// ============================================================================

export const expectAccessibleForm = async (screen: any) => {
  const form = screen.getByRole('form') || screen.getByTestId('alarm-form');
  expect(form).toBeInTheDocument();

  // Check for proper labels
  const inputs = screen.getAllByRole('textbox');
  inputs.forEach((input: HTMLElement) => {
    expect(input).toHaveAccessibleName();
  });
};

export const expectKeyboardNavigation = async (
  user: ReturnType<typeof userEvent.setup>
) => {
  // Tab through interactive elements
  await user.tab();
  expect(document.activeElement).toBeVisible();

  await user.tab();
  expect(document.activeElement).toBeVisible();
};

// ============================================================================
// Error Boundary Testing
// ============================================================================

export const simulateError = (component: any, error: Error) => {
  const originalError = console.error;
  console.error = vi.fn(); // Suppress error logging during test

  try {
    throw error;
  } catch (e) {
    // Error will be caught by error boundary
  } finally {
    console.error = originalError;
  }
};

export const expectErrorBoundary = (screen: any) => {
  const errorMessage = screen.queryByText(/something went wrong|error occurred/i);
  expect(errorMessage).toBeInTheDocument();
};
