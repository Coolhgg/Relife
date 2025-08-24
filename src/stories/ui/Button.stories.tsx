import React from 'react'; // auto: added missing React import
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from '../../components/ui/button';
import {
  ChevronRight,
  Download,
  Heart,
  Loader2,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
} from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component with multiple variants, sizes, and support for icons. Built with Radix UI and styled with Tailwind CSS.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Whether to render as a child element (using Radix Slot)',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Account',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Cancel',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Action',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const IconOnly: Story = {
  args: {
    size: 'icon',
    children: <Settings />,
    'aria-label': 'Settings',
  },
};

// With Icons
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus />
        Add Alarm
      </>
    ),
  },
};

export const WithTrailingIcon: Story = {
  args: {
    children: (
      <>
        Continue
        <ChevronRight />
      </>
    ),
  },
};

export const IconOutline: Story = {
  args: {
    variant: 'outline',
    children: (
      <>
        <Download />
        Download
      </>
    ),
  },
};

// States
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <Loader2 className="animate-spin" />
        Loading...
      </>
    ),
  },
};

// Interactive states showcase
export const InteractiveShowcase: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold mb-2">All Button Variants</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Button>Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>

      <h3 className="text-lg font-semibold mb-2 mt-6">Button Sizes</h3>
      <div className="flex flex-wrap items-center gap-4">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">
          <Star />
        </Button>
      </div>

      <h3 className="text-lg font-semibold mb-2 mt-6">Common Use Cases</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button>
          <Plus /> New Alarm
        </Button>
        <Button variant="outline">
          <Search /> Search
        </Button>
        <Button variant="secondary">
          <Settings /> Settings
        </Button>
        <Button variant="destructive">
          <Trash2 /> Delete
        </Button>
        <Button variant="ghost">
          <Heart /> Like
        </Button>
        <Button disabled>
          <Loader2 className="animate-spin" /> Saving...
        </Button>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

// Accessibility test
export const AccessibilityTest: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold mb-2">Accessibility Features</h3>
      <div className="grid gap-4">
        <Button aria-label="Close modal" size="icon">
          ×
        </Button>
        <Button disabled aria-describedby="help-text">
          Disabled with description
        </Button>
        <div id="help-text" className="text-sm text-muted-foreground">
          This button is disabled because no items are selected
        </div>
        <Button role="button" tabIndex={0}>
          Focusable with keyboard
        </Button>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
