/**
 * Fallback Strategies for Resource-Constrained Devices
 * Provides graceful degradation and emergency modes
 */

import React from "react";

export interface FallbackState {
  isEmergencyMode: boolean;
  memoryPressure: "low" | "medium" | "high" | "critical";
  performanceLevel: "good" | "degraded" | "poor" | "critical";
  errorCount: number;
}

class FallbackManager {
  private state: FallbackState = {
    isEmergencyMode: false,
    memoryPressure: "low",
    performanceLevel: "good",
    errorCount: 0,
  };

  private observers: Array<(state: FallbackState) => void> = [];
  private fallbackComponents = new Map<string, React.ComponentType<any>>();

  constructor() {
    this.registerDefaultFallbacks();
    this.setupErrorHandling();
  }

  /**
   * Activate emergency mode
   */
  activateEmergencyMode() {
    console.warn("Activating emergency performance mode");
    this.state.isEmergencyMode = true;
    this.disableAnimations();
    this.forceMemoryCleanup();
    this.notifyObservers();
  }

  /**
   * Disable animations system-wide
   */
  private disableAnimations() {
    const style = document.createElement("style");
    style.id = "emergency-no-animations";
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Force memory cleanup
   */
  private forceMemoryCleanup() {
    if ("gc" in window) {
      (window as any).gc();
    }

    window.dispatchEvent(new CustomEvent("memory-pressure"));
  }

  /**
   * Report error
   */
  reportError(error: Error) {
    this.state.errorCount++;
    console.error("Fallback Manager - Error:", error);

    if (this.state.errorCount >= 5) {
      this.activateEmergencyMode();
    }
  }

  /**
   * Register fallback component
   */
  registerFallbackComponent(name: string, component: React.ComponentType<any>) {
    this.fallbackComponents.set(name, component);
  }

  /**
   * Register default fallbacks
   */
  private registerDefaultFallbacks() {
    this.registerFallbackComponent(
      "simple-text",
      ({ text }: { text: string }) => (
        <div className="p-4 text-center text-gray-600">
          {text || "Content unavailable"}
        </div>
      ),
    );

    this.registerFallbackComponent(
      "simple-button",
      ({ children, onClick, disabled }: any) => (
        <button
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </button>
      ),
    );

    this.registerFallbackComponent(
      "emergency-alarm-list",
      ({ alarms, onToggle }: any) => (
        <div className="space-y-3">
          {alarms?.map((alarm: any) => (
            <div
              key={alarm.id}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div>
                <div className="font-semibold">{alarm.time}</div>
                <div className="text-sm text-gray-600">{alarm.label}</div>
              </div>
              <button
                onClick={() => onToggle?.(alarm.id)}
                className={`px-3 py-1 rounded text-sm ${
                  alarm.enabled
                    ? "bg-green-200 text-green-800"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {alarm.enabled ? "ON" : "OFF"}
              </button>
            </div>
          ))}
        </div>
      ),
    );
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling() {
    window.addEventListener("error", (event) => {
      this.reportError(new Error(event.message));
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.reportError(new Error(event.reason));
    });
  }

  /**
   * Add observer
   */
  addObserver(observer: (state: FallbackState) => void) {
    this.observers.push(observer);
  }

  /**
   * Remove observer
   */
  removeObserver(observer: (state: FallbackState) => void) {
    const index = this.observers.indexOf(observer);
    if (index >= 0) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Notify observers
   */
  private notifyObservers() {
    this.observers.forEach((observer) => observer({ ...this.state }));
  }

  /**
   * Get current state
   */
  getState(): FallbackState {
    return { ...this.state };
  }

  /**
   * Get fallback component
   */
  getFallbackComponent(name: string): React.ComponentType<any> | null {
    return this.fallbackComponents.get(name) || null;
  }
}

export const fallbackManager = new FallbackManager();

/**
 * React hook for fallback state
 */
export function useFallbackState() {
  const [state, setState] = React.useState<FallbackState>(() =>
    fallbackManager.getState(),
  );

  React.useEffect(() => {
    const observer = (newState: FallbackState) => setState(newState);
    fallbackManager.addObserver(observer);
    return () => fallbackManager.removeObserver(observer);
  }, []);

  return state;
}

/**
 * Error boundary with fallback
 */
export class FallbackErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackComponent?: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    fallbackManager.reportError(error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        const FallbackComponent = fallbackManager.getFallbackComponent(
          this.props.fallbackComponent,
        );
        if (FallbackComponent) {
          return <FallbackComponent error={this.state.error} />;
        }
      }

      return (
        <div className="p-6 text-center border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Something went wrong
          </h3>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default fallbackManager;
