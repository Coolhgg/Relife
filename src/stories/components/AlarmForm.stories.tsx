import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import AlarmForm from '../../components/AlarmForm'

// Mock data and types
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  subscription: {
    tier: 'free' as const,
    status: 'active' as const,
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const mockPremiumUser = {
  ...mockUser,
  subscription: {
    tier: 'premium' as const,
    status: 'active' as const,
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}

const mockAlarm = {
  id: '1',
  time: '07:30',
  label: 'Morning Workout',
  days: [1, 2, 3, 4, 5], // Weekdays
  voiceMood: 'motivational' as const,
  difficulty: 'medium' as const,
  soundType: 'voice-only' as const,
  snoozeEnabled: true,
  snoozeInterval: 5,
  maxSnoozes: 3,
  isActive: true,
  userId: 'test-user-123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

const meta: Meta<typeof AlarmForm> = {
  title: 'Components/AlarmForm',
  component: AlarmForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A comprehensive form for creating and editing alarms with various customization options including voice moods, difficulties, and premium features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    alarm: {
      control: { type: 'object' },
      description: 'Existing alarm data for editing (null for new alarm)',
    },
    userId: {
      control: { type: 'text' },
      description: 'User ID for custom sound management',
    },
    user: {
      control: { type: 'object' },
      description: 'User object for premium feature checks',
    },
    onSave: {
      action: 'saved',
      description: 'Callback when alarm is saved',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Callback when form is cancelled',
    },
  },
  args: {
    onSave: fn(),
    onCancel: fn(),
    userId: 'test-user-123',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const NewAlarm: Story = {
  args: {
    alarm: null,
    user: mockUser,
  },
}

export const EditAlarm: Story = {
  args: {
    alarm: mockAlarm,
    user: mockUser,
  },
}

export const PremiumUser: Story = {
  args: {
    alarm: null,
    user: mockPremiumUser,
  },
}

export const EditPremiumAlarm: Story = {
  args: {
    alarm: {
      ...mockAlarm,
      difficulty: 'nuclear' as const,
      nuclearChallenges: ['math_quiz', 'memory_game'],
      soundType: 'custom' as const,
      customSoundId: 'custom-sound-123',
    },
    user: mockPremiumUser,
  },
}

export const WeekendAlarm: Story = {
  args: {
    alarm: {
      ...mockAlarm,
      time: '09:00',
      label: 'Weekend Sleep-in',
      days: [0, 6], // Sunday and Saturday
      voiceMood: 'gentle' as const,
      difficulty: 'easy' as const,
    },
    user: mockUser,
  },
}

export const CustomSoundAlarm: Story = {
  args: {
    alarm: {
      ...mockAlarm,
      soundType: 'custom' as const,
      customSoundId: 'favorite-song-123',
      label: 'Wake up to my favorite song',
    },
    user: mockPremiumUser,
  },
}

export const FormValidationExample: Story = {
  render: (args) => (
    <div className="w-full max-w-lg">
      <h3 className="text-lg font-semibold mb-4">Alarm Form with Validation</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Try submitting the form without filling required fields to see validation errors.
      </p>
      <AlarmForm {...args} />
    </div>
  ),
  args: {
    alarm: {
      ...mockAlarm,
      time: '',  // Invalid time to trigger validation
      label: '',  // Empty label to trigger validation
      days: [],   // No days selected to trigger validation
    },
    user: mockUser,
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export const ResponsiveDesign: Story = {
  render: (args) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Mobile View (375px)</h3>
        <div className="w-[375px] border rounded-lg overflow-hidden">
          <AlarmForm {...args} />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Desktop View</h3>
        <div className="w-full max-w-lg border rounded-lg overflow-hidden">
          <AlarmForm {...args} />
        </div>
      </div>
    </div>
  ),
  args: {
    alarm: mockAlarm,
    user: mockUser,
  },
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'desktop',
    },
  },
}

export const DarkMode: Story = {
  args: {
    alarm: mockAlarm,
    user: mockPremiumUser,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
}

export const AccessibilityShowcase: Story = {
  render: (args) => (
    <div className="w-full max-w-lg">
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Accessibility Features</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
          <li>• Screen reader announcements for form changes</li>
          <li>• Dynamic focus management</li>
          <li>• ARIA labels and descriptions</li>
          <li>• Keyboard navigation support</li>
          <li>• Error announcements</li>
        </ul>
      </div>
      <AlarmForm {...args} />
    </div>
  ),
  args: {
    alarm: null,
    user: mockUser,
  },
  parameters: {
    layout: 'fullscreen',
  },
}

// Interactive playground for testing different combinations
export const InteractivePlayground: Story = {
  render: () => {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">Alarm Form Playground</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Free User - New Alarm</h3>
            <div className="border rounded-lg overflow-hidden">
              <AlarmForm
                alarm={null}
                user={mockUser}
                userId="test-user-123"
                onSave={fn()}
                onCancel={fn()}
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Premium User - Edit Alarm</h3>
            <div className="border rounded-lg overflow-hidden">
              <AlarmForm
                alarm={{
                  ...mockAlarm,
                  difficulty: 'nuclear' as const,
                  nuclearChallenges: ['math_quiz'],
                }}
                user={mockPremiumUser}
                userId="test-premium-123"
                onSave={fn()}
                onCancel={fn()}
              />
            </div>
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    layout: 'fullscreen',
  },
}