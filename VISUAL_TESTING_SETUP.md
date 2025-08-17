# Visual Regression Testing Setup

This document outlines the visual regression testing setup for the Relife application using Storybook and Chromatic.

## Overview

We use the following tools for visual regression testing:

- **Storybook**: Component development and documentation
- **Chromatic**: Visual regression testing and UI review
- **GitHub Actions**: Automated testing on pull requests

## Getting Started

### Prerequisites

1. Node.js 20+ and Bun package manager
2. Chromatic account (sign up at https://www.chromatic.com/)
3. GitHub repository access for CI/CD setup

### Local Development

1. **Start Storybook locally:**
   ```bash
   bun run storybook
   ```
   This starts Storybook on http://localhost:6006

2. **Build Storybook:**
   ```bash
   bun run build-storybook
   ```

3. **Run visual tests locally:**
   ```bash
   bun run visual-test
   ```

### Chromatic Setup

1. **Create a Chromatic project:**
   - Go to https://www.chromatic.com/
   - Sign in with your GitHub account
   - Create a new project linked to this repository

2. **Get your project token:**
   - Copy the project token from your Chromatic project settings
   - Add it as a GitHub secret named `CHROMATIC_PROJECT_TOKEN`

3. **Configure the project:**
   - The configuration is already set up in `.storybook/chromatic.config.js`
   - Modify settings as needed for your project requirements

## Story Writing Guidelines

### Component Stories

Each component should have comprehensive stories covering:

1. **Default state**: Basic component with default props
2. **Variants**: Different visual variants (sizes, colors, etc.)
3. **States**: Different states (loading, error, disabled, etc.)
4. **Edge cases**: Empty states, long content, etc.
5. **Responsive**: How component looks on different screen sizes

### Example Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { ComponentName } from './ComponentName'

const meta: Meta<typeof ComponentName> = {
  title: 'Components/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Description of what this component does',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    // Default props
  },
}

export const Variant: Story = {
  args: {
    // Variant props
  },
}
```

## Visual Testing Process

### For Developers

1. **Create/update stories** when adding new components or modifying existing ones
2. **Test locally** using `bun run storybook`
3. **Run visual tests** using `bun run visual-test` before pushing
4. **Review changes** in Chromatic dashboard when opening PRs

### For Reviewers

1. **Check Chromatic status** on pull requests
2. **Review visual changes** in the Chromatic dashboard
3. **Approve/reject changes** based on intended design
4. **Ensure accessibility** standards are met

## Configuration Files

### `.storybook/main.ts`
Main Storybook configuration with addons and settings.

### `.storybook/preview.ts`
Global decorators, parameters, and theming for all stories.

### `.storybook/chromatic.config.js`
Chromatic-specific configuration for visual testing.

### `.github/workflows/chromatic.yml`
GitHub Actions workflow for automated visual testing.

## Available Scripts

- `bun run storybook` - Start Storybook development server
- `bun run build-storybook` - Build Storybook for production
- `bun run chromatic` - Run Chromatic visual tests
- `bun run chromatic:ci` - Run Chromatic in CI mode
- `bun run visual-test` - Build and test (combines build-storybook + chromatic)

## Best Practices

### Story Organization

- Group related stories in the same file
- Use descriptive story names
- Include documentation and descriptions
- Cover edge cases and error states

### Visual Testing

- Keep stories focused on visual aspects
- Avoid stories with complex interactions for visual testing
- Use stable test data (avoid random or time-based data)
- Test responsive behavior across viewports

### Accessibility

- Include accessibility-focused stories
- Test with different themes (light/dark)
- Ensure proper ARIA labels and semantic HTML
- Test keyboard navigation scenarios

## Troubleshooting

### Common Issues

1. **Chromatic timeouts**: Reduce story complexity or split into smaller stories
2. **Flaky tests**: Use stable test data and avoid animations in visual tests
3. **Large diffs**: Check for unintended changes in global styles or dependencies

### Getting Help

- Check Chromatic documentation: https://www.chromatic.com/docs/
- Review Storybook documentation: https://storybook.js.org/docs/
- Ask team members for code review and guidance

## Continuous Integration

The visual testing is integrated into our CI/CD pipeline:

1. **On Pull Requests**: Chromatic runs automatically and posts status checks
2. **On Main Branch**: Baselines are updated for future comparisons
3. **On Feature Branches**: Changes are compared against the main branch baseline

## Monitoring and Maintenance

- **Review Chromatic usage** monthly to optimize test coverage
- **Update dependencies** regularly for security and features
- **Archive old builds** to manage storage costs
- **Monitor performance** of visual tests and optimize as needed

## Contributing

When contributing new components or modifications:

1. Write comprehensive stories covering all variants and states
2. Test locally before pushing
3. Review visual changes in Chromatic
4. Update documentation if component API changes
5. Ensure accessibility standards are maintained

---

For questions or issues with visual testing setup, please create an issue in the repository or contact the development team.