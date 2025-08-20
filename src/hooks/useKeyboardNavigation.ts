/**
 * Keyboard Navigation Hook
 * React integration for the enhanced keyboard navigation system
 */

import { useEffect, useState, useCallback } from "react";
import {
  KeyboardNavigationService,
  KeyboardShortcut,
  NavigationState,
} from "../utils/keyboard-navigation";
import { useAccessibilityPreferences } from "./useAccessibilityPreferences";

interface KeyboardNavigationHookReturn {
  navigationState: NavigationState;
  shortcuts: KeyboardShortcut[];
  accessibilityStatus: {
    keyboardNavigationEnabled: boolean;
    skipLinksVisible: boolean;
    enhancedFocusRings: boolean;
    focusRingColor: string;
    screenReaderOptimized: boolean;
  };
  addShortcut: (id: string, shortcut: KeyboardShortcut) => void;
  removeShortcut: (key: string, modifiers: string[]) => void;
  refreshIntegration: () => void;
}

/**
 * Hook for managing keyboard navigation with accessibility integration
 */
export function useKeyboardNavigation(): KeyboardNavigationHookReturn {
  const [navigationService] = useState(() =>
    KeyboardNavigationService.getInstance(),
  );
  const [navigationState, setNavigationState] = useState<NavigationState>(() =>
    navigationService.getState(),
  );
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(() =>
    navigationService.getShortcuts(),
  );
  const [accessibilityStatus, setAccessibilityStatus] = useState(() =>
    navigationService.getAccessibilityStatus(),
  );

  const { preferences } = useAccessibilityPreferences();

  // Update state when accessibility preferences change
  useEffect(() => {
    navigationService.refreshAccessibilityIntegration();
    setAccessibilityStatus(navigationService.getAccessibilityStatus());
    setShortcuts(navigationService.getShortcuts());
  }, [
    preferences.keyboardNavigation,
    preferences.skipLinksVisible,
    preferences.enhancedFocusRings,
    preferences.focusRingColor,
    preferences.screenReaderOptimized,
    navigationService,
  ]);

  // Listen for navigation state changes
  useEffect(() => {
    const handleNavigationUpdate = () => {
      setNavigationState(navigationService.getState());
      setShortcuts(navigationService.getShortcuts());
      setAccessibilityStatus(navigationService.getAccessibilityStatus());
    };

    // Listen for custom events that might update navigation state
    document.addEventListener("keyboard-navigate", handleNavigationUpdate);
    document.addEventListener("alarm-action", handleNavigationUpdate);
    document.addEventListener("show-shortcuts", handleNavigationUpdate);

    return () => {
      document.removeEventListener("keyboard-navigate", handleNavigationUpdate);
      document.removeEventListener("alarm-action", handleNavigationUpdate);
      document.removeEventListener("show-shortcuts", handleNavigationUpdate);
    };
  }, [navigationService]);

  const addShortcut = useCallback(
    (id: string, shortcut: KeyboardShortcut) => {
      navigationService.addShortcut(id, shortcut);
      setShortcuts(navigationService.getShortcuts());
    },
    [navigationService],
  );

  const removeShortcut = useCallback(
    (key: string, modifiers: string[]) => {
      navigationService.removeShortcut(key, modifiers);
      setShortcuts(navigationService.getShortcuts());
    },
    [navigationService],
  );

  const refreshIntegration = useCallback(() => {
    navigationService.refreshAccessibilityIntegration();
    setAccessibilityStatus(navigationService.getAccessibilityStatus());
    setShortcuts(navigationService.getShortcuts());
  }, [navigationService]);

  return {
    navigationState,
    shortcuts,
    accessibilityStatus,
    addShortcut,
    removeShortcut,
    refreshIntegration,
  };
}

/**
 * Hook for keyboard navigation event listeners
 */
export function useKeyboardNavigationEvents() {
  const { preferences } = useAccessibilityPreferences();

  useEffect(() => {
    if (!preferences.keyboardNavigation) {
      return;
    }

    const handleKeyboardNavigate = (event: CustomEvent) => {
      const { section } = event.detail;
      console.log(`Navigating to section: ${section} via keyboard`);
    };

    const handleAlarmAction = (event: CustomEvent) => {
      const { action, target } = event.detail;
      console.log(`Alarm action: ${action}`, target);
    };

    const handleShowShortcuts = (event: CustomEvent) => {
      const { shortcuts } = event.detail;
      console.log("Keyboard shortcuts requested", shortcuts);
    };

    const handleShowHelp = () => {
      console.log("Help requested via keyboard");
    };

    document.addEventListener(
      "keyboard-navigate",
      handleKeyboardNavigate as EventListener,
    );
    document.addEventListener(
      "alarm-action",
      handleAlarmAction as EventListener,
    );
    document.addEventListener(
      "show-shortcuts",
      handleShowShortcuts as EventListener,
    );
    document.addEventListener("show-help", handleShowHelp);

    return () => {
      document.removeEventListener(
        "keyboard-navigate",
        handleKeyboardNavigate as EventListener,
      );
      document.removeEventListener(
        "alarm-action",
        handleAlarmAction as EventListener,
      );
      document.removeEventListener(
        "show-shortcuts",
        handleShowShortcuts as EventListener,
      );
      document.removeEventListener("show-help", handleShowHelp);
    };
  }, [preferences.keyboardNavigation]);
}

/**
 * Hook for managing focus trapping
 */
export function useKeyboardFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  active: boolean = true,
) {
  const { preferences } = useAccessibilityPreferences();

  useEffect(() => {
    if (!active || !preferences.keyboardNavigation || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const focusableSelector = `
      button:not([disabled]),
      [href]:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"]):not([disabled]),
      [role="button"]:not([disabled]),
      [role="tab"]:not([disabled])
    `;

    const getFocusableElements = () => {
      return Array.from(container.querySelectorAll(focusableSelector)).filter(
        (el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        },
      ) as HTMLElement[];
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab (backward)
        if (
          document.activeElement === firstElement ||
          !container.contains(document.activeElement)
        ) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (forward)
        if (
          document.activeElement === lastElement ||
          !container.contains(document.activeElement)
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus first element when trap becomes active
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, preferences.keyboardNavigation, containerRef]);
}

/**
 * Hook for roving focus patterns (tabs, toolbars, etc.)
 */
export function useRovingFocus(
  containerRef: React.RefObject<HTMLElement>,
  orientation: "horizontal" | "vertical" = "horizontal",
) {
  const { preferences } = useAccessibilityPreferences();

  useEffect(() => {
    if (!preferences.keyboardNavigation || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    // Add roving focus attribute
    container.setAttribute("data-roving-focus", "true");

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (!container.contains(target)) return;

      const focusableElements = Array.from(
        container.querySelectorAll('[role="tab"], [role="button"], button'),
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }) as HTMLElement[];

      const currentIndex = focusableElements.indexOf(target);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      if (orientation === "horizontal") {
        switch (event.key) {
          case "ArrowRight":
            event.preventDefault();
            nextIndex = (currentIndex + 1) % focusableElements.length;
            break;
          case "ArrowLeft":
            event.preventDefault();
            nextIndex =
              (currentIndex - 1 + focusableElements.length) %
              focusableElements.length;
            break;
          case "Home":
            event.preventDefault();
            nextIndex = 0;
            break;
          case "End":
            event.preventDefault();
            nextIndex = focusableElements.length - 1;
            break;
        }
      } else {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            nextIndex = (currentIndex + 1) % focusableElements.length;
            break;
          case "ArrowUp":
            event.preventDefault();
            nextIndex =
              (currentIndex - 1 + focusableElements.length) %
              focusableElements.length;
            break;
          case "Home":
            event.preventDefault();
            nextIndex = 0;
            break;
          case "End":
            event.preventDefault();
            nextIndex = focusableElements.length - 1;
            break;
        }
      }

      if (nextIndex !== currentIndex) {
        focusableElements[nextIndex].focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeAttribute("data-roving-focus");
    };
  }, [preferences.keyboardNavigation, orientation, containerRef]);
}

export default useKeyboardNavigation;
