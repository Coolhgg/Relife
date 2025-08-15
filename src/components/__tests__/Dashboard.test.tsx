import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { testUtils } from '../../test-setup';

// Mock the services and hooks
jest.mock('../../services/performance-monitor', () => ({
  PerformanceMonitor: {
    startTracking: jest.fn(),
    endTracking: jest.fn(),
    trackUserAction: jest.fn(),
  }
}));

jest.mock('../../services/app-analytics', () => ({
  AppAnalyticsService: {
    trackPageView: jest.fn(),
    trackUserInteraction: jest.fn(),
  }
}));

jest.mock('../../hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({
    user: testUtils.mockUser,
    isAuthenticated: true,
    loading: false,
  })
}));

describe('Dashboard', () => {
  const mockProps = {
    user: testUtils.mockUser,
    alarms: [testUtils.mockAlarm],
    onAddAlarm: jest.fn(),
    onEditAlarm: jest.fn(),
    onDeleteAlarm: jest.fn(),
    onToggleAlarm: jest.fn(),
    activeAlarm: null,
    onQuickSetup: jest.fn(),
  };

  beforeEach(() => {
    testUtils.clearAllMocks();
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders dashboard with user greeting', () => {
      render(<Dashboard {...mockProps} />);
      
      expect(screen.getByText(/good/i)).toBeInTheDocument();
      expect(screen.getByText(testUtils.mockUser.name)).toBeInTheDocument();
    });

    test('renders correct greeting based on time of day', () => {
      // Mock different times
      jest.spyOn(Date.prototype, 'getHours')
        .mockReturnValueOnce(7); // Morning
      
      render(<Dashboard {...mockProps} />);
      expect(screen.getByText(/good morning/i)).toBeInTheDocument();
    });

    test('renders alarm statistics', () => {
      render(<Dashboard {...mockProps} />);
      
      expect(screen.getByText('Active Alarms')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Count of alarms
    });

    test('renders quick setup buttons', () => {
      render(<Dashboard {...mockProps} />);
      
      expect(screen.getByText('Quick Setup')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /morning routine/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /work alarm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /custom/i })).toBeInTheDocument();
    });

    test('renders recent alarms section', () => {
      render(<Dashboard {...mockProps} />);
      
      expect(screen.getByText('Recent Alarms')).toBeInTheDocument();
      expect(screen.getByText(testUtils.mockAlarm.label)).toBeInTheDocument();
      expect(screen.getByText(testUtils.mockAlarm.time)).toBeInTheDocument();
    });

    test('shows empty state when no alarms', () => {
      render(<Dashboard {...mockProps} alarms={[]} />);
      
      expect(screen.getByText(/no alarms yet/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first alarm/i)).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    test('calls onAddAlarm when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<Dashboard {...mockProps} />);
      
      const addButton = screen.getByRole('button', { name: /add alarm/i });
      await user.click(addButton);
      
      expect(mockProps.onAddAlarm).toHaveBeenCalled();
    });

    test('calls onQuickSetup with correct preset', async () => {
      const user = userEvent.setup();
      render(<Dashboard {...mockProps} />);
      
      const morningButton = screen.getByRole('button', { name: /morning routine/i });
      await user.click(morningButton);
      
      expect(mockProps.onQuickSetup).toHaveBeenCalledWith('morning');
    });

    test('calls onEditAlarm when alarm edit is clicked', async () => {
      const user = userEvent.setup();
      render(<Dashboard {...mockProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit alarm/i });
      await user.click(editButton);
      
      expect(mockProps.onEditAlarm).toHaveBeenCalledWith(testUtils.mockAlarm);
    });

    test('calls onToggleAlarm when alarm switch is clicked', async () => {
      const user = userEvent.setup();
      render(<Dashboard {...mockProps} />);
      
      const toggleSwitch = screen.getByRole('switch');
      await user.click(toggleSwitch);
      
      expect(mockProps.onToggleAlarm).toHaveBeenCalledWith(testUtils.mockAlarm.id);
    });

    test('calls onDeleteAlarm when delete is confirmed', async () => {
      const user = userEvent.setup();
      render(<Dashboard {...mockProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete alarm/i });
      await user.click(deleteButton);
      
      // Confirm deletion in modal
      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);
      
      expect(mockProps.onDeleteAlarm).toHaveBeenCalledWith(testUtils.mockAlarm.id);
    });
  });

  describe('performance tracking', () => {
    test('tracks dashboard view on mount', () => {
      const { PerformanceMonitor } = require('../../services/performance-monitor');
      render(<Dashboard {...mockProps} />);
      
      expect(PerformanceMonitor.startTracking).toHaveBeenCalledWith('dashboard-view');
    });

    test('tracks user interactions', async () => {
      const { PerformanceMonitor } = require('../../services/performance-monitor');
      const user = userEvent.setup();
      render(<Dashboard {...mockProps} />);
      
      const addButton = screen.getByRole('button', { name: /add alarm/i });
      await user.click(addButton);
      
      expect(PerformanceMonitor.trackUserAction).toHaveBeenCalledWith('add-alarm-clicked');
    });
  });

  describe('analytics tracking', () => {
    test('tracks page view on mount', () => {
      const { AppAnalyticsService } = require('../../services/app-analytics');
      render(<Dashboard {...mockProps} />);
      
      expect(AppAnalyticsService.trackPageView).toHaveBeenCalledWith('dashboard');
    });

    test('tracks quick setup interactions', async () => {
      const { AppAnalyticsService } = require('../../services/app-analytics');
      const user = userEvent.setup();
      render(<Dashboard {...mockProps} />);
      
      const workButton = screen.getByRole('button', { name: /work alarm/i });
      await user.click(workButton);
      
      expect(AppAnalyticsService.trackUserInteraction).toHaveBeenCalledWith(
        'quick-setup-used',
        { preset: 'work' }
      );
    });
  });

  describe('responsive behavior', () => {
    test('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      render(<Dashboard {...mockProps} />);
      
      const container = screen.getByTestId('dashboard-container');
      expect(container).toHaveClass('mobile-layout');
    });

    test('shows desktop layout for large screens', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      Object.defineProperty(window, 'innerHeight', { value: 768 });
      
      render(<Dashboard {...mockProps} />);
      
      const container = screen.getByTestId('dashboard-container');
      expect(container).toHaveClass('desktop-layout');
    });
  });

  describe('loading states', () => {
    test('shows loading spinner while data loads', () => {
      render(<Dashboard {...mockProps} alarms={undefined} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('shows skeleton placeholders during load', () => {
      render(<Dashboard {...mockProps} alarms={undefined} />);
      
      expect(screen.getAllByTestId('alarm-skeleton')).toHaveLength(3);
    });
  });

  describe('accessibility', () => {
    test('has proper heading structure', () => {
      render(<Dashboard {...mockProps} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /quick setup/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /recent alarms/i })).toBeInTheDocument();
    });

    test('has proper ARIA labels', () => {
      render(<Dashboard {...mockProps} />);
      
      expect(screen.getByLabelText('Dashboard main content')).toBeInTheDocument();
      expect(screen.getByLabelText('Alarm statistics')).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Dashboard {...mockProps} />);
      
      const addButton = screen.getByRole('button', { name: /add alarm/i });
      const quickSetupButton = screen.getByRole('button', { name: /morning routine/i });
      
      // Tab navigation
      await user.tab();
      expect(addButton).toHaveFocus();
      
      await user.tab();
      expect(quickSetupButton).toHaveFocus();
    });

    test('announces important changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<Dashboard {...mockProps} />);
      
      const toggleSwitch = screen.getByRole('switch');
      await user.click(toggleSwitch);
      
      // Check for ARIA live region updates
      expect(screen.getByLabelText('Alarm status updated')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    test('handles missing user gracefully', () => {
      render(<Dashboard {...mockProps} user={null} />);
      
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    test('handles API errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock a failing onAddAlarm
      const failingOnAddAlarm = jest.fn().mockRejectedValue(new Error('API Error'));
      
      const user = userEvent.setup();
      render(<Dashboard {...mockProps} onAddAlarm={failingOnAddAlarm} />);
      
      const addButton = screen.getByRole('button', { name: /add alarm/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error creating alarm/i)).toBeInTheDocument();
      });
      
      consoleError.mockRestore();
    });
  });

  describe('real-time updates', () => {
    test('updates alarm status in real-time', async () => {
      const { rerender } = render(<Dashboard {...mockProps} />);
      
      const updatedAlarm = { ...testUtils.mockAlarm, enabled: false };
      rerender(<Dashboard {...mockProps} alarms={[updatedAlarm]} />);
      
      const toggleSwitch = screen.getByRole('switch');
      expect(toggleSwitch).not.toBeChecked();
    });

    test('handles active alarm display', () => {
      const activeAlarm = { ...testUtils.mockAlarm, isActive: true };
      render(<Dashboard {...mockProps} activeAlarm={activeAlarm} />);
      
      expect(screen.getByText(/alarm ringing/i)).toBeInTheDocument();
      expect(screen.getByText(activeAlarm.label)).toBeInTheDocument();
    });
  });
});