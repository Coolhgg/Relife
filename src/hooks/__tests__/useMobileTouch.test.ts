import { expect, test, jest } from '@jest/globals';
/// <reference lib="dom" />
/**
 * Unit tests for useMobileTouch hook
 * Tests touch gestures, haptic feedback, and mobile interactions
 */

import { renderHook, act } from '@testing-library/react';
import { useMobileTouch } from '../useMobileTouch';

// Mock touch events and haptic feedback
const mockHaptics = {
  impact: jest.fn(),
  vibrate: jest.fn(),
  selectionStart: jest.fn(),
  selectionChanged: jest.fn(),
  selectionEnd: jest.fn(),
};

// Mock Capacitor haptics
jest.mock('@capacitor/haptics', (
) => ({
  Haptics: mockHaptics,
}));

// Mock DOM element for touch events
const createMockElement = (
) => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getBoundingClientRect: jest.fn((
) => ({
    left: 0,
    top: 0,
    width: 300,
    height: 600,
  })),
});

// Mock touch event
const createMockTouchEvent = (type: string, touches: any[] = []
) => ({
  type,
  touches,
  changedTouches: touches,
  targetTouches: touches,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: createMockElement(),
});

describe('useMobileTouch', (
) => {
  let mockElement: ReturnType<typeof createMockElement>;

  beforeEach((
) => {
    jest.clearAllMocks();
    mockElement = createMockElement();

    // Mock performance.now for timing calculations
    jest
      .spyOn(performance, 'now')
      .mockReturnValueOnce(1000) // touchstart
      .mockReturnValueOnce(1100) // touchend
      .mockReturnValueOnce(1200); // next event
  });

  afterEach((
) => {
    jest.restoreAllMocks();
  });

  it('should initialize with default touch state', (
) => {
    const { result } = renderHook((
) => useMobileTouch(mockElement));

    expect(result.current.isActive).toBe(false);
    expect(result.current.touchData).toBeNull();
    expect(result.current.gestureData).toBeNull();
  });

  it('should enable touch listeners when element is provided', (
) => {
    renderHook((
) => useMobileTouch(mockElement));

    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      'touchstart',
      expect.any(Function),
      { passive: false }
    );
    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function),
      { passive: false }
    );
    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      'touchend',
      expect.any(Function),
      { passive: false }
    );
  });

  it('should handle touchstart events', (
) => {
    const onTouchStart = jest.fn();
    const { result } = renderHook((
) => useMobileTouch(mockElement, { onTouchStart }));

    const touchEvent = createMockTouchEvent('touchstart', [
      { clientX: 100, clientY: 200, identifier: 0 },
    ]);

    // Simulate touchstart
    const touchStartHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchstart'
    )?.[1];

    act((
) => {
      touchStartHandler?.(touchEvent);
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.touchData).toMatchObject({
      startX: 100,
      startY: 200,
      currentX: 100,
      currentY: 200,
    });
    expect(onTouchStart).toHaveBeenCalledWith(touchEvent);
  });

  it('should handle touchmove events and calculate deltas', (
) => {
    const onTouchMove = jest.fn();
    const { result } = renderHook((
) => useMobileTouch(mockElement, { onTouchMove }));

    // Start touch
    const touchStartEvent = createMockTouchEvent('touchstart', [
      { clientX: 100, clientY: 200, identifier: 0 },
    ]);
    const touchStartHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchstart'
    )?.[1];

    act((
) => {
      touchStartHandler?.(touchStartEvent);
    });

    // Move touch
    const touchMoveEvent = createMockTouchEvent('touchmove', [
      { clientX: 150, clientY: 180, identifier: 0 },
    ]);
    const touchMoveHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchmove'
    )?.[1];

    act((
) => {
      touchMoveHandler?.(touchMoveEvent);
    });

    expect(result.current.touchData).toMatchObject({
      startX: 100,
      startY: 200,
      currentX: 150,
      currentY: 180,
      deltaX: 50,
      deltaY: -20,
    });
    expect(onTouchMove).toHaveBeenCalledWith(touchMoveEvent);
  });

  it('should handle touchend events and calculate gesture data', (
) => {
    const onTouchEnd = jest.fn();
    const { result } = renderHook((
) => useMobileTouch(mockElement, { onTouchEnd }));

    // Start touch
    const touchStartEvent = createMockTouchEvent('touchstart', [
      { clientX: 100, clientY: 200, identifier: 0 },
    ]);
    const touchStartHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchstart'
    )?.[1];

    act((
) => {
      touchStartHandler?.(touchStartEvent);
    });

    // End touch
    const touchEndEvent = createMockTouchEvent('touchend', [
      { clientX: 200, clientY: 180, identifier: 0 },
    ]);
    const touchEndHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchend'
    )?.[1];

    act((
) => {
      touchEndHandler?.(touchEndEvent);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.gestureData).toMatchObject({
      deltaX: 100,
      deltaY: -20,
      distance: expect.any(Number),
      duration: 100,
      velocity: expect.any(Number),
    });
    expect(onTouchEnd).toHaveBeenCalledWith(touchEndEvent);
  });

  it('should detect swipe gestures', (
) => {
    const onSwipe = jest.fn();
    const { result } = renderHook((
) =>
      useMobileTouch(mockElement, {
        onSwipe,
        swipeThreshold: 50, // pixels
      })
    );

    // Simulate horizontal swipe right
    const touchStartEvent = createMockTouchEvent('touchstart', [
      { clientX: 50, clientY: 200, identifier: 0 },
    ]);
    const touchEndEvent = createMockTouchEvent('touchend', [
      { clientX: 150, clientY: 200, identifier: 0 },
    ]);

    const touchStartHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchstart'
    )?.[1];
    const touchEndHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchend'
    )?.[1];

    act((
) => {
      touchStartHandler?.(touchStartEvent);
      touchEndHandler?.(touchEndEvent);
    });

    expect(onSwipe).toHaveBeenCalledWith({
      direction: 'right',
      distance: 100,
      velocity: expect.any(Number),
    });
  });

  it('should detect swipe directions correctly', (
) => {
    const onSwipe = jest.fn();
    const { result } = renderHook((
) =>
      useMobileTouch(mockElement, {
        onSwipe,
        swipeThreshold: 50,
      })
    );

    const touchStartHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchstart'
    )?.[1];
    const touchEndHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchend'
    )?.[1];

    // Test left swipe
    act((
) => {
      touchStartHandler?.(
        createMockTouchEvent('touchstart', [
          { clientX: 150, clientY: 200, identifier: 0 },
        ])
      );
      touchEndHandler?.(
        createMockTouchEvent('touchend', [{ clientX: 50, clientY: 200, identifier: 0 }])
      );
    });

    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'left' })
    );

    // Test up swipe
    onSwipe.mockClear();
    act((
) => {
      touchStartHandler?.(
        createMockTouchEvent('touchstart', [
          { clientX: 100, clientY: 200, identifier: 0 },
        ])
      );
      touchEndHandler?.(
        createMockTouchEvent('touchend', [
          { clientX: 100, clientY: 100, identifier: 0 },
        ])
      );
    });

    expect(onSwipe).toHaveBeenCalledWith(expect.objectContaining({ direction: 'up' }));

    // Test down swipe
    onSwipe.mockClear();
    act((
) => {
      touchStartHandler?.(
        createMockTouchEvent('touchstart', [
          { clientX: 100, clientY: 100, identifier: 0 },
        ])
      );
      touchEndHandler?.(
        createMockTouchEvent('touchend', [
          { clientX: 100, clientY: 200, identifier: 0 },
        ])
      );
    });

    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'down' })
    );
  });

  it('should detect tap gestures', (
) => {
    const onTap = jest.fn();
    renderHook((
) =>
      useMobileTouch(mockElement, {
        onTap,
        tapTimeout: 200,
        tapThreshold: 10, // pixels
      })
    );

    const touchStartHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchstart'
    )?.[1];
    const touchEndHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchend'
    )?.[1];

    // Quick tap within threshold
    act((
) => {
      touchStartHandler?.(
        createMockTouchEvent('touchstart', [
          { clientX: 100, clientY: 200, identifier: 0 },
        ])
      );
      touchEndHandler?.(
        createMockTouchEvent('touchend', [
          { clientX: 105, clientY: 205, identifier: 0 },
        ])
      );
    });

    expect(onTap).toHaveBeenCalledWith({
      x: 100,
      y: 200,
      duration: 100,
    });
  });

  it('should detect long press gestures', (
) => {
    const onLongPress = jest.fn();
    renderHook((
) =>
      useMobileTouch(mockElement, {
        onLongPress,
        longPressTimeout: 500,
      })
    );

    const touchStartHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchstart'
    )?.[1];

    act((
) => {
      touchStartHandler?.(
        createMockTouchEvent('touchstart', [
          { clientX: 100, clientY: 200, identifier: 0 },
        ])
      );
    });

    // Simulate long press timeout
    act((
) => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledWith({
      x: 100,
      y: 200,
    });
  });

  it('should provide haptic feedback when enabled', async (
) => {
    const { result } = renderHook((
) =>
      useMobileTouch(mockElement, {
        enableHaptics: true,
        hapticIntensity: 'medium',
      })
    );

    await act(async (
) => {
      await result.current.triggerHapticFeedback('impact');
    });

    expect(mockHaptics.impact).toHaveBeenCalledWith({ style: 'medium' });

    await act(async (
) => {
      await result.current.triggerHapticFeedback('selection');
    });

    expect(mockHaptics.selectionStart).toHaveBeenCalled();
  });

  it('should handle multi-touch gestures', (
) => {
    const onPinch = jest.fn();
    renderHook((
) => useMobileTouch(mockElement, { onPinch }));

    const touchStartHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchstart'
    )?.[1];
    const touchMoveHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchmove'
    )?.[1];

    // Start with two touches
    act((
) => {
      touchStartHandler?.(
        createMockTouchEvent('touchstart', [
          { clientX: 100, clientY: 200, identifier: 0 },
          { clientX: 200, clientY: 200, identifier: 1 },
        ])
      );
    });

    // Move touches apart (zoom out)
    act((
) => {
      touchMoveHandler?.(
        createMockTouchEvent('touchmove', [
          { clientX: 50, clientY: 200, identifier: 0 },
          { clientX: 250, clientY: 200, identifier: 1 },
        ])
      );
    });

    expect(onPinch).toHaveBeenCalledWith({
      scale: expect.any(Number),
      center: { x: 150, y: 200 },
    });
  });

  it('should clean up event listeners on unmount', (
) => {
    const { unmount } = renderHook((
) => useMobileTouch(mockElement));

    unmount();

    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      'touchstart',
      expect.any(Function)
    );
    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function)
    );
    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      'touchend',
      expect.any(Function)
    );
  });

  it('should handle element changes gracefully', (
) => {
    const newElement = createMockElement();
    const { rerender } = renderHook(({ element }
) => useMobileTouch(element), {
      initialProps: { element: mockElement },
    });

    // Change element
    rerender({ element: newElement });

    // Old element should have listeners removed
    expect(mockElement.removeEventListener).toHaveBeenCalled();

    // New element should have listeners added
    expect(newElement.addEventListener).toHaveBeenCalled();
  });

  it('should respect disabled state', (
) => {
    const onTouchStart = jest.fn();
    renderHook((
) =>
      useMobileTouch(mockElement, {
        onTouchStart,
        disabled: true,
      })
    );

    const touchStartHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchstart'
    )?.[1];

    act((
) => {
      touchStartHandler?.(
        createMockTouchEvent('touchstart', [
          { clientX: 100, clientY: 200, identifier: 0 },
        ])
      );
    });

    expect(onTouchStart).not.toHaveBeenCalled();
  });
});
