import { fireEvent, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Device orientation utilities
export const orientation = {
  setPortrait: () => {
    Object.defineProperty(screen, 'orientation', {
      writable: true,
      value: {
        angle: 0,
        type: 'portrait-primary',
      },
    });
    window.dispatchEvent(new Event('orientationchange'));
  },

  setLandscape: () => {
    Object.defineProperty(screen, 'orientation', {
      writable: true,
      value: {
        angle: 90,
        type: 'landscape-primary',
      },
    });
    window.dispatchEvent(new Event('orientationchange'));
  },

  testOrientationChange: async (callback: () => void | Promise<void>) => {
    orientation.setPortrait();
    await waitFor(() => {});

    if (callback) await callback();

    orientation.setLandscape();
    await waitFor(() => {});

    if (callback) await callback();

    orientation.setPortrait();
    await waitFor(() => {});
  },
};

// Touch gesture utilities
export const gestures = {
  swipe: async (
    element: HTMLElement,
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number = 100
  ) => {
    const rect = element.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    let endX = startX;
    let endY = startY;

    switch (direction) {
      case 'left':
        endX = startX - distance;
        break;
      case 'right':
        endX = startX + distance;
        break;
      case 'up':
        endY = startY - distance;
        break;
      case 'down':
        endY = startY + distance;
        break;
    }

    fireEvent.touchStart(element, {
      touches: [{ clientX: startX, clientY: startY }],
    });

    fireEvent.touchMove(element, {
      touches: [{ clientX: endX, clientY: endY }],
    });

    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: endX, clientY: endY }],
    });
  },

  longPress: async (element: HTMLElement, duration: number = 500) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    fireEvent.touchStart(element, {
      touches: [{ clientX: x, clientY: y }],
    });

    await new Promise(resolve => setTimeout(resolve, duration));

    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: x, clientY: y }],
    });
  },

  pinchZoom: async (element: HTMLElement, scale: number = 2) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startDistance = 50;
    const endDistance = startDistance * scale;

    fireEvent.touchStart(element, {
      touches: [
        { clientX: centerX - startDistance, clientY: centerY },
        { clientX: centerX + startDistance, clientY: centerY },
      ],
    });

    fireEvent.touchMove(element, {
      touches: [
        { clientX: centerX - endDistance, clientY: centerY },
        { clientX: centerX + endDistance, clientY: centerY },
      ],
    });

    fireEvent.touchEnd(element);
  },
};

// PWA utilities
export const pwa = {
  mockInstallPrompt: () => {
    const mockInstallPrompt = {
      prompt: jest.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      (window as any).deferredPrompt = mockInstallPrompt;
    });

    window.dispatchEvent(new Event('beforeinstallprompt'));
    return mockInstallPrompt;
  },

  mockStandalone: (isStandalone: boolean = true) => {
    Object.defineProperty(window.navigator, 'standalone', {
      writable: true,
      value: isStandalone,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)' ? isStandalone : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  },

  testOfflineMode: async (callback: () => void | Promise<void>) => {
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    window.dispatchEvent(new Event('offline'));

    if (callback) await callback();

    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine,
    });

    window.dispatchEvent(new Event('online'));
  },
};

// Device API mocks
export const deviceAPIs = {
  mockVibration: () => {
    const mockVibrate = jest.fn();
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      value: mockVibrate,
    });
    return mockVibrate;
  },

  mockBattery: (level: number = 0.5, charging: boolean = false) => {
    const mockBattery = {
      level,
      charging,
      chargingTime: charging ? 3600 : Infinity,
      dischargingTime: charging ? Infinity : 7200,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    Object.defineProperty(navigator, 'getBattery', {
      writable: true,
      value: () => Promise.resolve(mockBattery),
    });

    return mockBattery;
  },

  mockWakeLock: () => {
    const mockWakeLock = {
      request: jest.fn().mockResolvedValue({
        release: jest.fn(),
        released: false,
        type: 'screen',
      }),
    };

    Object.defineProperty(navigator, 'wakeLock', {
      writable: true,
      value: mockWakeLock,
    });

    return mockWakeLock;
  },

  mockDeviceOrientation: () => {
    const mockDeviceOrientationEvent = (alpha: number, beta: number, gamma: number) => {
      const event = new Event('deviceorientation') as any;
      event.alpha = alpha;
      event.beta = beta;
      event.gamma = gamma;
      return event;
    };

    return {
      simulateRotation: (alpha: number = 0, beta: number = 0, gamma: number = 0) => {
        window.dispatchEvent(mockDeviceOrientationEvent(alpha, beta, gamma));
      },
    };
  },
};

// Network condition simulation
export const network = {
  mockSlowConnection: () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 2000,
        saveData: false,
      },
    });
  },

  mockFastConnection: () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      },
    });
  },

  mockSaveDataMode: () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '3g',
        downlink: 2,
        rtt: 300,
        saveData: true,
      },
    });
  },
};

// Mobile viewport utilities
export const viewport = {
  setMobileViewport: (width: number = 375, height: number = 667) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  },

  setTabletViewport: (width: number = 768, height: number = 1024) => {
    viewport.setMobileViewport(width, height);
  },

  mockSafeArea: (
    top: number = 44,
    right: number = 0,
    bottom: number = 34,
    left: number = 0
  ) => {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --safe-area-inset-top: ${top}px;
        --safe-area-inset-right: ${right}px;
        --safe-area-inset-bottom: ${bottom}px;
        --safe-area-inset-left: ${left}px;
      }
    `;
    document.head.appendChild(style);
    return style;
  },
};

// Mobile-specific testing helpers
export const mobileHelpers = {
  expectResponsiveDesign: async (element: HTMLElement) => {
    const initialStyles = window.getComputedStyle(element);

    // Test mobile viewport
    viewport.setMobileViewport();
    await waitFor(() => {});
    const mobileStyles = window.getComputedStyle(element);

    // Test tablet viewport
    viewport.setTabletViewport();
    await waitFor(() => {});
    const tabletStyles = window.getComputedStyle(element);

    return {
      mobile: mobileStyles,
      tablet: tabletStyles,
      initial: initialStyles,
    };
  },

  testTouchFriendly: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const minTouchTarget = 44; // iOS recommended minimum

    return {
      width: rect.width >= minTouchTarget,
      height: rect.height >= minTouchTarget,
      size: Math.min(rect.width, rect.height) >= minTouchTarget,
    };
  },

  simulateAppBackground: async () => {
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    window.dispatchEvent(new Event('blur'));
  },

  simulateAppForeground: async () => {
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
  },
};

// Export all utilities
export default {
  orientation,
  gestures,
  pwa,
  deviceAPIs,
  network,
  viewport,
  mobileHelpers,
};
