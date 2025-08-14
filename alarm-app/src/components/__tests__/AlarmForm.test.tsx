import * as React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AlarmForm from '../AlarmForm';
import { testUtils } from '../../test-setup';
import type { Alarm, VoiceMood } from '../../types';

describe('AlarmForm', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  
  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel
  };

  beforeEach(() => {
    testUtils.clearAllMocks();
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
  });

  describe('rendering', () => {
    test('renders new alarm form by default', () => {
      render(<AlarmForm {...defaultProps} />);
      
      expect(screen.getByText('New Alarm')).toBeInTheDocument();
      expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
      expect(screen.getByText('Days')).toBeInTheDocument();
      expect(screen.getByText('Voice Mood')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create alarm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    test('renders edit alarm form when alarm prop is provided', () => {
      const alarm: Alarm = {
        ...testUtils.mockAlarm,
        time: '08:30',
        label: 'Work Alarm',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'drill-sergeant'
      };
      
      render(<AlarmForm {...defaultProps} alarm={alarm} />);
      
      expect(screen.getByText('Edit Alarm')).toBeInTheDocument();
      expect(screen.getByDisplayValue('08:30')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Work Alarm')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update alarm/i })).toBeInTheDocument();
    });

    test('renders all voice mood options', () => {
      render(<AlarmForm {...defaultProps} />);
      
      // Check for voice mood buttons
      expect(screen.getByText('Drill Sergeant')).toBeInTheDocument();
      expect(screen.getByText('Sweet Angel')).toBeInTheDocument();
      expect(screen.getByText('Anime Hero')).toBeInTheDocument();
      expect(screen.getByText('Savage Roast')).toBeInTheDocument();
      expect(screen.getByText('Motivational')).toBeInTheDocument();
      expect(screen.getByText('Gentle')).toBeInTheDocument();
    });

    test('renders all weekday buttons', () => {
      render(<AlarmForm {...defaultProps} />);
      
      // Check for day buttons
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    test('updates time input', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '09:15');
      
      expect(timeInput).toHaveValue('09:15');
    });

    test('updates label input', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const labelInput = screen.getByLabelText(/label/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Custom Alarm');
      
      expect(labelInput).toHaveValue('Custom Alarm');
    });

    test('toggles day selection', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const mondayButton = screen.getByText('Mon');
      
      // Monday should be selected by default (weekdays)
      expect(mondayButton.closest('button')).toHaveClass('bg-primary-600');
      
      // Click to deselect
      await user.click(mondayButton);
      expect(mondayButton.closest('button')).not.toHaveClass('bg-primary-600');
      
      // Click to select again
      await user.click(mondayButton);
      expect(mondayButton.closest('button')).toHaveClass('bg-primary-600');
    });

    test('changes voice mood selection', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      // Default should be motivational
      expect(screen.getByText('Motivational')).toBeInTheDocument();
      
      // Select drill sergeant
      const drillSergeantButton = screen.getByText('Drill Sergeant').closest('button');
      await user.click(drillSergeantButton!);
      
      // Check that the selection changed
      expect(drillSergeantButton).toHaveClass('border-primary-500');
    });

    test('shows voice mood preview', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      // Should show default motivational mood preview
      expect(screen.getByText(/get ready to conquer/i)).toBeInTheDocument();
      
      // Change to drill sergeant
      await user.click(screen.getByText('Drill Sergeant').closest('button')!);
      
      // Should show drill sergeant preview
      expect(screen.getByText(/drop and give me twenty/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    test('shows validation errors for invalid time', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const timeInput = screen.getByLabelText(/time/i);
      const submitButton = screen.getByRole('button', { name: /create alarm/i });
      
      await user.clear(timeInput);
      await user.type(timeInput, '25:00');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/hours must be between 0 and 23/i)).toBeInTheDocument();
      });
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('shows validation errors for invalid label', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const labelInput = screen.getByLabelText(/label/i);
      const submitButton = screen.getByRole('button', { name: /create alarm/i });
      
      await user.clear(labelInput);
      await user.type(labelInput, 'A');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/label must be at least 2 characters/i)).toBeInTheDocument();
      });
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('shows validation errors for no days selected', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      // Deselect all weekdays
      const dayButtons = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => 
        screen.getByText(day).closest('button')!
      );
      
      for (const button of dayButtons) {
        await user.click(button);
      }
      
      const submitButton = screen.getByRole('button', { name: /create alarm/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/at least one day must be selected/i)).toBeInTheDocument();
      });
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('shows field-specific error styling', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const timeInput = screen.getByLabelText(/time/i);
      const submitButton = screen.getByRole('button', { name: /create alarm/i });
      
      await user.clear(timeInput);
      await user.type(timeInput, '25:00');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(timeInput).toHaveClass('border-red-500');
      });
    });

    test('shows general error summary', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const timeInput = screen.getByLabelText(/time/i);
      const labelInput = screen.getByLabelText(/label/i);
      const submitButton = screen.getByRole('button', { name: /create alarm/i });
      
      await user.clear(timeInput);
      await user.type(timeInput, '25:00');
      await user.clear(labelInput);
      await user.type(labelInput, 'A');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please fix the following issues/i)).toBeInTheDocument();
        expect(screen.getByText(/time:/i)).toBeInTheDocument();
        expect(screen.getByText(/label:/i)).toBeInTheDocument();
      });
    });

    test('clears errors when input becomes valid', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const timeInput = screen.getByLabelText(/time/i);
      const submitButton = screen.getByRole('button', { name: /create alarm/i });
      
      // Enter invalid time
      await user.clear(timeInput);
      await user.type(timeInput, '25:00');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/hours must be between 0 and 23/i)).toBeInTheDocument();
      });
      
      // Fix the time
      await user.clear(timeInput);
      await user.type(timeInput, '09:00');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/hours must be between 0 and 23/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    test('calls onSave with correct data for new alarm', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const timeInput = screen.getByLabelText(/time/i);
      const labelInput = screen.getByLabelText(/label/i);
      const submitButton = screen.getByRole('button', { name: /create alarm/i });
      
      await user.clear(timeInput);
      await user.type(timeInput, '08:30');
      await user.clear(labelInput);
      await user.type(labelInput, 'Work Alarm');
      
      // Select drill sergeant voice mood
      await user.click(screen.getByText('Drill Sergeant').closest('button')!);
      
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          time: '08:30',
          label: 'Work Alarm',
          days: [1, 2, 3, 4, 5], // Default weekdays
          voiceMood: 'drill-sergeant'
        });
      });
    });

    test('calls onSave with updated data for existing alarm', async () => {
      const user = userEvent.setup();
      const alarm: Alarm = {
        ...testUtils.mockAlarm,
        time: '07:00',
        label: 'Old Label',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'motivational'
      };
      
      render(<AlarmForm {...defaultProps} alarm={alarm} />);
      
      const labelInput = screen.getByLabelText(/label/i);
      const submitButton = screen.getByRole('button', { name: /update alarm/i });
      
      await user.clear(labelInput);
      await user.type(labelInput, 'Updated Label');
      
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          time: '07:00',
          label: 'Updated Label',
          days: [1, 2, 3, 4, 5],
          voiceMood: 'motivational'
        });
      });
    });

    test('includes custom day selection', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      // Deselect weekdays and select weekend
      const weekdayButtons = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => 
        screen.getByText(day).closest('button')!
      );
      
      for (const button of weekdayButtons) {
        await user.click(button);
      }
      
      await user.click(screen.getByText('Sat').closest('button')!);
      await user.click(screen.getByText('Sun').closest('button')!);
      
      const submitButton = screen.getByRole('button', { name: /create alarm/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            days: [0, 6] // Sunday and Saturday
          })
        );
      });
    });
  });

  describe('form cancellation', () => {
    test('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('calls onCancel when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const closeButton = screen.getByRole('button').querySelector('svg')?.closest('button');
      await user.click(closeButton!);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    test('has proper form labels', () => {
      render(<AlarmForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
    });

    test('has proper button roles', () => {
      render(<AlarmForm {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /create alarm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const timeInput = screen.getByLabelText(/time/i);
      const labelInput = screen.getByLabelText(/label/i);
      
      // Tab through form elements
      await user.tab();
      expect(timeInput).toHaveFocus();
      
      await user.tab();
      expect(labelInput).toHaveFocus();
    });

    test('announces validation errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const timeInput = screen.getByLabelText(/time/i);
      const submitButton = screen.getByRole('button', { name: /create alarm/i });
      
      await user.clear(timeInput);
      await user.type(timeInput, '25:00');
      await user.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/hours must be between 0 and 23/i);
        expect(errorMessage).toBeInTheDocument();
        // Error message should be associated with the input
        expect(errorMessage).toHaveAttribute('role', undefined); // Depends on implementation
      });
    });
  });

  describe('edge cases', () => {
    test('handles rapid form submission', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /create alarm/i });
      
      // Rapidly click submit multiple times
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      
      // Should only be called once due to form validation or state management
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });

    test('handles very long labels gracefully', async () => {
      const user = userEvent.setup();
      render(<AlarmForm {...defaultProps} />);
      
      const labelInput = screen.getByLabelText(/label/i);
      const longLabel = 'A'.repeat(150);
      
      await user.clear(labelInput);
      await user.type(labelInput, longLabel);
      
      // Input should be limited to maxLength
      expect(labelInput).toHaveAttribute('maxLength', '100');
    });

    test('preserves form state during re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AlarmForm {...defaultProps} />);
      
      const timeInput = screen.getByLabelText(/time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '08:30');
      
      // Re-render with same props
      rerender(<AlarmForm {...defaultProps} />);
      
      expect(timeInput).toHaveValue('08:30');
    });
  });
});