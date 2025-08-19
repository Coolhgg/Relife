import type { Preview } from '@storybook/react-vite'
import { themes } from '@storybook/theming'
import '../src/index.css'

// Import Storybook providers
import { StorybookProviders } from './decorators'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    docs: {
      theme: themes.light,
      autodocs: 'tag',
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'app-light',
          value: '#f8fafc',
        },
        {
          name: 'app-dark',
          value: '#0f172a',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
      },
    },
    // Visual regression testing with Chromatic
    chromatic: {
      modes: {
        mobile: {
          viewport: 'mobile',
        },
        tablet: {
          viewport: 'tablet',
        },
        desktop: {
          viewport: 'desktop',
        },
        'dark-mode': {
          backgrounds: { value: '#1a1a1a' },
        },
      },
    },
  },

  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'en',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'es', title: 'Español' },
          { value: 'fr', title: 'Français' },
          { value: 'de', title: 'Deutsch' },
          { value: 'ar', title: 'العربية' },
          { value: 'hi', title: 'हिन्दी' },
        ],
        dynamicTitle: true,
      },
    },
    userTier: {
      description: 'User subscription tier',
      defaultValue: 'free',
      toolbar: {
        title: 'User Tier',
        icon: 'user',
        items: [
          { value: 'free', title: 'Free' },
          { value: 'premium', title: 'Premium' },
          { value: 'ultimate', title: 'Ultimate' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const { theme, locale, userTier } = context.globals;

      return (
        <StorybookProviders
          theme={theme}
          language={locale}
          direction={locale === 'ar' ? 'rtl' : 'ltr'}
          tier={userTier}
          isAuthenticated={userTier !== 'free'}
        >
          <div
            className={`min-h-screen transition-colors duration-200 ${
              theme === 'dark' ? 'dark bg-slate-900 text-white' : 'bg-white text-slate-900'
            }`}
          >
            <Story />
          </div>
        </StorybookProviders>
      );
    },
  ],
};

export default preview;