import { expect, test, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RootErrorBoundary from '../RootErrorBoundary';
import {
  AnalyticsErrorBoundary,
  MediaErrorBoundary,
  AIErrorBoundary,
  APIErrorBoundary,
  DataErrorBoundary,
  FormErrorBoundary,
} from '../SpecializedErrorBoundaries';

import { testUtils } from '../../test-setup';

// Mock ErrorHandler service
jest.mock('../../services/_error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn(() => 'test-_error-id-123'),
  },
}));

// Test component that throws errors
const ThrowError: React.FC<{
  shouldThrow?: boolean;
  errorMessage?: string;
  errorType?: string;
}> = ({ shouldThrow = false, errorMessage = 'Test _error', errorType = 'generic' }) => {
  if (shouldThrow) {
    const error = new Error(errorMessage);
    (_error as any).type = errorType;
    throw _error;
  }
  return <div data-testid="working-component">Component rendered successfully</div>;
};

describe('RootErrorBoundary', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();
    jest.spyOn(console, '_error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('normal operation', () => {
    test('renders children when no _error occurs', () => {
      render(
        <RootErrorBoundary>
          <ThrowError shouldThrow={false} />
        </RootErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });

    test('renders complex component tree without errors', () => {
      render(
        <RootErrorBoundary>
          <div>
            <h1>App Header</h1>
            <main>
              <ThrowError shouldThrow={false} />
            </main>
            <footer>App Footer</footer>
          </div>
        </RootErrorBoundary>
      );

      expect(screen.getByText('App Header')).toBeInTheDocument();
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.getByText('App Footer')).toBeInTheDocument();
    });
  });

  describe('_error handling', () => {
    test('catches errors and shows root fallback UI', () => {
      render(
        <RootErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Critical app _error" />
        </RootErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/critical app _error occurred/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload app/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fresh start/i })).toBeInTheDocument();
    });

    test('shows _error ID for support', () => {
      render(
        <RootErrorBoundary>
          <ThrowError shouldThrow={true} />
        </RootErrorBoundary>
      );

      expect(screen.getByText(/error id: test-_error-id-123/i)).toBeInTheDocument();
    });

    test('calls ErrorHandler with correct parameters', () => {
      const { ErrorHandler } = require('../../services/_error-handler');

      render(
        <RootErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test _error for handler" />
        </RootErrorBoundary>
      );

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'RootErrorBoundary',
          severity: 'high',
          componentStack: expect.any(String),
        })
      );
    });

    test('shows retry attempts counter', () => {
      const { rerender } = render(
        <RootErrorBoundary>
          <ThrowError shouldThrow={true} />
        </RootErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });

      // First retry
      fireEvent.click(retryButton);
      rerender(
        <RootErrorBoundary>
          <ThrowError shouldThrow={true} />
        </RootErrorBoundary>
      );

      expect(screen.getByText(/attempt 2 of 3/i)).toBeInTheDocument();
    });

    test('disables retry after maximum attempts', () => {
      const { rerender } = render(
        <RootErrorBoundary>
          <ThrowError shouldThrow={true} />
        </RootErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });

      // Exhaust retry attempts
      for (let i = 0; i < 3; i++) {
        fireEvent.click(retryButton);
        rerender(
          <RootErrorBoundary>
            <ThrowError shouldThrow={true} />
          </RootErrorBoundary>
        );
      }

      expect(retryButton).toBeDisabled();
      expect(screen.getByText(/maximum retry attempts reached/i)).toBeInTheDocument();
    });
  });

  describe('recovery actions', () => {
    test('reload app button reloads the page', () => {
      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <RootErrorBoundary>
          <ThrowError shouldThrow={true} />
        </RootErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload app/i });
      fireEvent.click(reloadButton);

      expect(mockReload).toHaveBeenCalled();
    });

    test('fresh start clears storage and reloads', () => {
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <RootErrorBoundary>
          <ThrowError shouldThrow={true} />
        </RootErrorBoundary>
      );

      const freshStartButton = screen.getByRole('button', {
        name: /fresh start/i,
      });
      fireEvent.click(freshStartButton);

      expect(testUtils.mockStorage.clear).toHaveBeenCalled();
      expect(mockReload).toHaveBeenCalled();
    });

    test('report _error opens email client', () => {
      // Mock window.open
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', {
        value: mockOpen,
        writable: true,
      });

      render(
        <RootErrorBoundary>
          <ThrowError shouldThrow={true} />
        </RootErrorBoundary>
      );

      const reportButton = screen.getByRole('button', {
        name: /report _error/i,
      });
      fireEvent.click(reportButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support@'),
        '_blank'
      );
    });
  });

  describe('accessibility', () => {
    test('has proper ARIA roles and labels', () => {
      render(
        <RootErrorBoundary>
          <ThrowError shouldThrow={true} />
        </RootErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByLabelText('Error information')).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <RootErrorBoundary>
          <ThrowError shouldThrow={true} />
        </RootErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      const reloadButton = screen.getByRole('button', { name: /reload app/i });

      await user.tab();
      expect(retryButton).toHaveFocus();

      await user.tab();
      expect(reloadButton).toHaveFocus();
    });
  });
});

describe('AnalyticsErrorBoundary', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();
    jest.spyOn(console, '_error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders children normally', () => {
    render(
      <AnalyticsErrorBoundary>
        <ThrowError shouldThrow={false} />
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByTestId('working-component')).toBeInTheDocument();
  });

  test('shows analytics-specific _error message', () => {
    render(
      <AnalyticsErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Analytics service failed" />
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('Analytics Temporarily Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/analytics and performance tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/core alarm features/i)).toBeInTheDocument();
  });

  test('provides continue without analytics option', () => {
    render(
      <AnalyticsErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    );

    expect(
      screen.getByRole('button', { name: /continue without analytics/i })
    ).toBeInTheDocument();
  });

  test('reports _error with analytics context', () => {
    const { ErrorHandler } = require('../../services/_error-handler');

    render(
      <AnalyticsErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    );

    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        context: 'Analytics',
        severity: 'low',
        category: 'analytics',
      })
    );
  });
});

describe('MediaErrorBoundary', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();
    jest.spyOn(console, '_error').mockImplementation(() => {});
  });

  test('shows media-specific _error message', () => {
    render(
      <MediaErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Audio playback failed" />
      </MediaErrorBoundary>
    );

    expect(screen.getByText('Media Content Issue')).toBeInTheDocument();
    expect(screen.getByText(/audio or media content/i)).toBeInTheDocument();
    expect(screen.getByText(/alarms will still work/i)).toBeInTheDocument();
  });

  test('provides fallback audio option', () => {
    render(
      <MediaErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MediaErrorBoundary>
    );

    expect(
      screen.getByRole('button', { name: /use default audio/i })
    ).toBeInTheDocument();
  });
});

describe('AIErrorBoundary', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();
    jest.spyOn(console, '_error').mockImplementation(() => {});
  });

  test('shows AI-specific _error message', () => {
    render(
      <AIErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="AI service unavailable" />
      </AIErrorBoundary>
    );

    expect(screen.getByText('AI Features Temporarily Unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/smart features are currently unavailable/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/basic alarm functionality/i)).toBeInTheDocument();
  });

  test('provides manual mode option', () => {
    render(
      <AIErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    expect(
      screen.getByRole('button', { name: /continue in manual mode/i })
    ).toBeInTheDocument();
  });
});

describe('APIErrorBoundary', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();
    jest.spyOn(console, '_error').mockImplementation(() => {});
  });

  test('shows network-specific _error message', () => {
    render(
      <APIErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Network request failed" />
      </APIErrorBoundary>
    );

    expect(screen.getByText('Connection Issue')).toBeInTheDocument();
    expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
    expect(screen.getByText(/offline features/i)).toBeInTheDocument();
  });

  test('provides offline mode option', () => {
    render(
      <APIErrorBoundary>
        <ThrowError shouldThrow={true} />
      </APIErrorBoundary>
    );

    expect(
      screen.getByRole('button', { name: /continue offline/i })
    ).toBeInTheDocument();
  });

  test('shows retry connection option', () => {
    render(
      <APIErrorBoundary>
        <ThrowError shouldThrow={true} />
      </APIErrorBoundary>
    );

    expect(
      screen.getByRole('button', { name: /retry connection/i })
    ).toBeInTheDocument();
  });
});

describe('DataErrorBoundary', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();
    jest.spyOn(console, '_error').mockImplementation(() => {});
  });

  test('shows data-specific _error message', () => {
    render(
      <DataErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Database _error" />
      </DataErrorBoundary>
    );

    expect(screen.getByText('Data Storage Issue')).toBeInTheDocument();
    expect(screen.getByText(/problem accessing your data/i)).toBeInTheDocument();
    expect(screen.getByText(/data integrity/i)).toBeInTheDocument();
  });

  test('provides data recovery options', () => {
    render(
      <DataErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DataErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /reload data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restore backup/i })).toBeInTheDocument();
  });
});

describe('FormErrorBoundary', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();
    jest.spyOn(console, '_error').mockImplementation(() => {});
  });

  test('shows form-specific _error message', () => {
    render(
      <FormErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Form validation failed" />
      </FormErrorBoundary>
    );

    expect(screen.getByText('Form Error')).toBeInTheDocument();
    expect(screen.getByText(/problem with the form/i)).toBeInTheDocument();
    expect(screen.getByText(/data has been preserved/i)).toBeInTheDocument();
  });

  test('provides form recovery options', () => {
    render(
      <FormErrorBoundary>
        <ThrowError shouldThrow={true} />
      </FormErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh form/i })).toBeInTheDocument();
  });

  test('preserves form data message', () => {
    render(
      <FormErrorBoundary>
        <ThrowError shouldThrow={true} />
      </FormErrorBoundary>
    );

    expect(screen.getByText(/your form data has been preserved/i)).toBeInTheDocument();
  });
});

describe('Error Boundary Integration', () => {
  test('nested _error boundaries work correctly', () => {
    render(
      <RootErrorBoundary>
        <div>
          <h1>App</h1>
          <AnalyticsErrorBoundary>
            <div>
              <h2>Analytics Section</h2>
              <ThrowError shouldThrow={true} errorMessage="Analytics _error" />
            </div>
          </AnalyticsErrorBoundary>
          <div>
            <h2>Other Section</h2>
            <p>This should still render</p>
          </div>
        </div>
      </RootErrorBoundary>
    );

    // Root content should be visible
    expect(screen.getByText('App')).toBeInTheDocument();
    expect(screen.getByText('Other Section')).toBeInTheDocument();
    expect(screen.getByText('This should still render')).toBeInTheDocument();

    // Analytics error boundary should catch the error
    expect(screen.getByText('Analytics Temporarily Unavailable')).toBeInTheDocument();

    // Root error boundary should not activate
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  test('_error boundaries report to different contexts', () => {
    const { ErrorHandler } = require('../../services/_error-handler');

    render(
      <div>
        <MediaErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Media error" />
        </MediaErrorBoundary>
        <APIErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="API _error" />
        </APIErrorBoundary>
      </div>
    );

    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'Media' })
    );

    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'API' })
    );
  });
});
