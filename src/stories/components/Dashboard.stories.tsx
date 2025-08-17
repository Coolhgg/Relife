import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import Dashboard from '../../components/Dashboard'

// Mock alarm data
const mockAlarms = [
  {
    id: '1',
    time: '07:00',
    label: 'Morning Workout',
    days: [1, 2, 3, 4, 5], // Weekdays
    voiceMood: 'motivational' as const,
    enabled: true,
    soundType: 'voice-only' as const,
    snoozeEnabled: true,
    userId: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    time: '09:00',
    label: 'Meeting Reminder',
    days: [1, 3, 5], // Mon, Wed, Fri
    voiceMood: 'professional' as const,
    enabled: true,
    soundType: 'built-in' as const,
    snoozeEnabled: false,
    userId: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    time: '22:30',
    label: 'Bedtime',
    days: [0, 1, 2, 3, 4, 5, 6], // Every day
    voiceMood: 'gentle' as const,
    enabled: false,
    soundType: 'voice-only' as const,
    snoozeEnabled: true,
    userId: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const meta: Meta<typeof Dashboard> = {
  title: 'Components/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main dashboard component showing alarm overview, next alarm, and quick actions. Includes smart insights and optimization suggestions for premium users.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    alarms: {
      control: { type: 'object' },
      description: 'Array of user alarms to display',
    },
    onAddAlarm: {
      action: 'add-alarm',
      description: 'Callback when add alarm button is clicked',
    },
    onQuickSetup: {
      action: 'quick-setup',
      description: 'Callback for quick alarm setup presets',
    },
    onNavigateToAdvanced: {
      action: 'navigate-advanced',
      description: 'Callback to navigate to advanced features',
    },
  },
  args: {
    onAddAlarm: fn(),
    onQuickSetup: fn(),
    onNavigateToAdvanced: fn(),
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const WithAlarms: Story = {
  args: {
    alarms: mockAlarms,
  },
}

export const EmptyState: Story = {
  args: {
    alarms: [],
  },
}

export const LoadingState: Story = {
  args: {
    alarms: undefined, // This triggers the loading state
  },
}

export const SingleAlarm: Story = {
  args: {
    alarms: [mockAlarms[0]],
  },
}

export const OnlyDisabledAlarms: Story = {
  args: {
    alarms: [
      {
        ...mockAlarms[0],
        enabled: false,
      },
      {
        ...mockAlarms[1],
        enabled: false,
      },
    ],
  },
}

export const ManyAlarms: Story = {
  args: {
    alarms: [
      ...mockAlarms,
      {
        id: '4',
        time: '06:00',
        label: 'Early Gym Session',
        days: [1, 3, 5],
        voiceMood: 'energetic' as const,
        enabled: true,
        soundType: 'custom' as const,
        customSoundId: 'gym-music-123',
        snoozeEnabled: true,
        userId: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        time: '12:00',
        label: 'Lunch Break',
        days: [1, 2, 3, 4, 5],
        voiceMood: 'gentle' as const,
        enabled: true,
        soundType: 'voice-only' as const,
        snoozeEnabled: false,
        userId: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '6',
        time: '18:00',
        label: 'Evening Walk',
        days: [0, 6], // Weekends
        voiceMood: 'calm' as const,
        enabled: true,
        soundType: 'built-in' as const,
        snoozeEnabled: true,
        userId: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
}

export const ResponsiveDesign: Story = {
  render: (args) => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Mobile View (375px)</h3>
        <div className="w-[375px] h-[600px] border rounded-lg overflow-auto">
          <Dashboard {...args} />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Tablet View (768px)</h3>
        <div className="w-[768px] h-[600px] border rounded-lg overflow-auto">
          <Dashboard {...args} />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Desktop View</h3>
        <div className="w-full max-w-4xl h-[600px] border rounded-lg overflow-auto">
          <Dashboard {...args} />
        </div>
      </div>
    </div>
  ),
  args: {
    alarms: mockAlarms,
  },
}

export const DarkMode: Story = {
  args: {
    alarms: mockAlarms,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
}

export const AccessibilityFocused: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Accessibility Features</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• ARIA labels and live regions for dynamic content</li>
          <li>• Screen reader friendly alarm summaries</li>
          <li>• Keyboard navigation support</li>
          <li>• High contrast mode compatibility</li>
          <li>• Semantic HTML structure with proper headings</li>
        </ul>
      </div>
      <Dashboard {...args} />
    </div>
  ),
  args: {
    alarms: mockAlarms,
  },
}

export const UserJourneyScenarios: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold mb-4">New User - First Time Experience</h3>
        <div className="border rounded-lg overflow-hidden">
          <Dashboard
            alarms={[]}
            onAddAlarm={fn()}
            onQuickSetup={fn()}
            onNavigateToAdvanced={fn()}
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">Active User - Morning Dashboard</h3>
        <div className="border rounded-lg overflow-hidden">
          <Dashboard
            alarms={[
              {
                ...mockAlarms[0],
                time: '07:30', // Next alarm in morning
              },
              ...mockAlarms.slice(1),
            ]}
            onAddAlarm={fn()}
            onQuickSetup={fn()}
            onNavigateToAdvanced={fn()}
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">Power User - Multiple Alarms</h3>
        <div className="border rounded-lg overflow-hidden">
          <Dashboard
            alarms={[
              ...mockAlarms,
              {
                id: '4',
                time: '05:30',
                label: 'Meditation',
                days: [0, 1, 2, 3, 4, 5, 6],
                voiceMood: 'calm' as const,
                enabled: true,
                soundType: 'voice-only' as const,
                snoozeEnabled: false,
                userId: 'power-user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]}
            onAddAlarm={fn()}
            onQuickSetup={fn()}
            onNavigateToAdvanced={fn()}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}