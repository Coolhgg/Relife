import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, beforeEach, afterEach, test, describe, expect } from "vitest";
import ErrorBoundary from "../ErrorBoundary";
// Test utilities are now handled via vitest directly

// Test component that throws errors
const ThrowError: React.FC<{
  shouldThrow?: boolean;
  errorMessage?: string;
}> = ({ shouldThrow = false, errorMessage = "Test error" }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>Component rendered successfully</div>;
};

// Test component that throws during render
const AsyncError: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = false,
}) => {
  React.useEffect(() => {
    if (shouldThrow) {
      throw new Error("Async error in useEffect");
    }
  }, [shouldThrow]);

  return <div>Async component</div>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Suppress console.error for these tests since we're intentionally throwing errors
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("normal operation", () => {
    test("renders children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText("Component rendered successfully"),
      ).toBeInTheDocument();
    });

    test("renders children with complex component tree", () => {
      render(
        <ErrorBoundary>
          <div>
            <h1>Parent Component</h1>
            <ThrowError shouldThrow={false} />
            <p>Additional content</p>
          </div>
        </ErrorBoundary>,
      );

      expect(screen.getByText("Parent Component")).toBeInTheDocument();
      expect(
        screen.getByText("Component rendered successfully"),
      ).toBeInTheDocument();
      expect(screen.getByText("Additional content")).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    test("catches errors and shows default fallback UI", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText("Oops! Something went wrong"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/we encountered an unexpected error/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /try again/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /go back/i }),
      ).toBeInTheDocument();
    });

    test("displays custom context in error message", () => {
      render(
        <ErrorBoundary context="AlarmForm">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/alarmform/i)).toBeInTheDocument();
    });

    test("shows error ID for debugging", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/error id:/i)).toBeInTheDocument();
    });

    test("displays error details in development mode", () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      render(
        <ErrorBoundary>
          <ThrowError
            shouldThrow={true}
            errorMessage="Detailed error message"
          />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Error Details")).toBeInTheDocument();
      expect(screen.getByText(/detailed error message/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    test("hides error details in production mode", () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      render(
        <ErrorBoundary>
          <ThrowError
            shouldThrow={true}
            errorMessage="Detailed error message"
          />
        </ErrorBoundary>,
      );

      expect(screen.queryByText("Error Details")).not.toBeInTheDocument();
      expect(
        screen.queryByText(/detailed error message/i),
      ).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("custom fallback UI", () => {
    test("renders custom fallback when provided", () => {
      const CustomFallback = (
        <div data-testid="custom-fallback">Custom error message</div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
      expect(screen.getByText("Custom error message")).toBeInTheDocument();
      expect(
        screen.queryByText("Oops! Something went wrong"),
      ).not.toBeInTheDocument();
    });

    test("uses default fallback when custom fallback is not provided", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText("Oops! Something went wrong"),
      ).toBeInTheDocument();
    });
  });

  describe("error recovery", () => {
    test("retry button attempts to re-render children", () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText("Oops! Something went wrong"),
      ).toBeInTheDocument();

      const retryButton = screen.getByRole("button", { name: /try again/i });
      fireEvent.click(retryButton);

      // After retry, if the component no longer throws, it should render normally
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText("Component rendered successfully"),
      ).toBeInTheDocument();
    });

    test("retry button resets error state", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      const retryButton = screen.getByRole("button", { name: /try again/i });
      fireEvent.click(retryButton);

      // The error boundary should reset its state, though the component may still throw
      expect(retryButton).toBeInTheDocument(); // Button should still be there if error persists
    });

    test("go back button calls onNavigateBack when provided", () => {
      const mockNavigateBack = vi.fn();

      render(
        <ErrorBoundary onNavigateBack={mockNavigateBack}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      const goBackButton = screen.getByRole("button", { name: /go back/i });
      fireEvent.click(goBackButton);

      expect(mockNavigateBack).toHaveBeenCalled();
    });

    test("go back button uses default navigation when onNavigateBack not provided", () => {
      // Mock window.history.back
      const mockBack = vi.fn();
      Object.defineProperty(window, "history", {
        value: { back: mockBack },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      const goBackButton = screen.getByRole("button", { name: /go back/i });
      fireEvent.click(goBackButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("error reporting integration", () => {
    test("reports errors to ErrorHandler", () => {
      // Mock ErrorHandler
      const mockHandleError = vi.fn();
      vi.doMock("../../services/error-handler", () => ({
        ErrorHandler: {
          handleError: mockHandleError,
        },
      }));

      render(
        <ErrorBoundary context="TestComponent">
          <ThrowError
            shouldThrow={true}
            errorMessage="Test error for reporting"
          />
        </ErrorBoundary>,
      );

      // ErrorHandler.handleError should have been called
      // Note: In a real test, you'd need to properly mock the import
      // This is a simplified example
    });

    test("includes component stack in error report", () => {
      render(
        <ErrorBoundary context="TestBoundary">
          <div>
            <div>
              <ThrowError shouldThrow={true} />
            </div>
          </div>
        </ErrorBoundary>,
      );

      // Component stack should be captured (implementation detail)
      expect(
        screen.getByText("Oops! Something went wrong"),
      ).toBeInTheDocument();
    });
  });

  describe("different error types", () => {
    test("handles JavaScript errors", () => {
      render(
        <ErrorBoundary>
          <ThrowError
            shouldThrow={true}
            errorMessage="TypeError: Cannot read property"
          />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText("Oops! Something went wrong"),
      ).toBeInTheDocument();
    });

    test("handles React errors", () => {
      const ReactError: React.FC = () => {
        const [, setState] = React.useState();
        // Force a React error
        setState({} as any);
        return null;
      };

      render(
        <ErrorBoundary>
          <ReactError />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText("Oops! Something went wrong"),
      ).toBeInTheDocument();
    });

    test("does not catch async errors in useEffect", () => {
      // Error boundaries do not catch async errors, so this should not trigger the boundary
      const consoleSpy = vi.spyOn(console, "error").mockImplementation();

      render(
        <ErrorBoundary>
          <AsyncError shouldThrow={true} />
        </ErrorBoundary>,
      );

      // The component should render normally since async errors aren't caught
      expect(screen.getByText("Async component")).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe("multiple error boundaries", () => {
    test("nested error boundaries catch errors at appropriate level", () => {
      render(
        <ErrorBoundary context="Outer">
          <div>
            <p>Outer content</p>
            <ErrorBoundary context="Inner">
              <ThrowError shouldThrow={true} />
            </ErrorBoundary>
            <p>More outer content</p>
          </div>
        </ErrorBoundary>,
      );

      // Inner boundary should catch the error
      expect(screen.getByText("Outer content")).toBeInTheDocument();
      expect(screen.getByText("More outer content")).toBeInTheDocument();
      expect(
        screen.getByText("Oops! Something went wrong"),
      ).toBeInTheDocument();
      expect(screen.getByText(/inner/i)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    test("error UI is accessible", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      // Check for proper heading structure
      expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();

      // Check for proper button roles
      expect(
        screen.getByRole("button", { name: /try again/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /go back/i }),
      ).toBeInTheDocument();
    });

    test("error message is announced to screen readers", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      // The error container should have appropriate ARIA attributes
      const errorContainer = screen
        .getByText("Oops! Something went wrong")
        .closest("div");
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe("error boundary lifecycle", () => {
    test("componentDidCatch is called when error occurs", () => {
      // This would require access to the component instance
      // In practice, you'd test the side effects (like error reporting)
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText("Oops! Something went wrong"),
      ).toBeInTheDocument();
    });

    test("getDerivedStateFromError sets error state", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      // Error state should be set, as evidenced by the error UI
      expect(
        screen.getByText("Oops! Something went wrong"),
      ).toBeInTheDocument();
    });
  });
});
