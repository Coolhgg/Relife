import React from 'react'; // auto: added missing React import
import type { Preview } from '@storybook/react-vite';
import { themes } from '@storybook/theming';
import '../src/index.css';

// Import Storybook providers
import { StorybookProviders } from './decorators';

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
    // Accessibility testing configuration
    a11y: {
      element: '#storybook-root',
      config: {
        rules: [
          // Core WCAG 2.1 AA rules
          { id: 'color-contrast', enabled: true },
          { id: 'heading-order', enabled: true },
          { id: 'label', enabled: true },
          { id: 'link-name', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'image-alt', enabled: true },
          { id: 'aria-allowed-attr', enabled: true },
          { id: 'aria-hidden-body', enabled: true },
          { id: 'aria-hidden-focus', enabled: true },
          { id: 'aria-input-field-name', enabled: true },
          { id: 'aria-required-children', enabled: true },
          { id: 'aria-required-parent', enabled: true },
          { id: 'aria-roles', enabled: true },
          { id: 'aria-valid-attr-value', enabled: true },
          { id: 'aria-valid-attr', enabled: true },
          { id: 'bypass', enabled: true },
          { id: 'document-title', enabled: false }, // Not applicable for components
          { id: 'duplicate-id-aria', enabled: true },
          { id: 'form-field-multiple-labels', enabled: true },
          { id: 'html-has-lang', enabled: false }, // Not applicable for components
          { id: 'html-lang-valid', enabled: false }, // Not applicable for components
          { id: 'input-image-alt', enabled: true },
          { id: 'landmark-one-main', enabled: false }, // Not applicable for components
          { id: 'list', enabled: true },
          { id: 'listitem', enabled: true },
          { id: 'meta-refresh', enabled: false }, // Not applicable for components
          { id: 'meta-viewport', enabled: false }, // Not applicable for components
          { id: 'object-alt', enabled: true },
          { id: 'region', enabled: false }, // Not applicable for components
          { id: 'select-name', enabled: true },
          { id: 'skip-link', enabled: false }, // Not applicable for components
          { id: 'tabindex', enabled: true },
          { id: 'td-headers-attr', enabled: true },
          { id: 'th-has-data-cells', enabled: true },
          { id: 'valid-lang', enabled: true },
        ],
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      },
      options: {
        checks: {
          // Color contrast checking
          'color-contrast': { options: { noScroll: true } },
          // Focus management
          'focus-order-semantics': { enabled: true },
          // Touch target size for mobile
          'target-size': { enabled: true },
        },
        runOnly: {
          type: 'tag',
          values: ['wcag2aa', 'wcag21aa'],
        },
      },
      manual: true, // Allow manual accessibility testing
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
    a11yColorMode: {
      description: 'Accessibility color mode testing',
      defaultValue: 'normal',
      toolbar: {
        title: 'A11y Color Mode',
        icon: 'eye',
        items: [
          { value: 'normal', title: 'Normal' },
          { value: 'protanopia', title: 'Protanopia (Red-blind)' },
          { value: 'deuteranopia', title: 'Deuteranopia (Green-blind)' },
          { value: 'tritanopia', title: 'Tritanopia (Blue-blind)' },
          { value: 'achromatopsia', title: 'Achromatopsia (Color-blind)' },
          { value: 'high-contrast', title: 'High Contrast' },
        ],
        dynamicTitle: true,
      },
    },
    a11yFontSize: {
      description: 'Accessibility font size testing',
      defaultValue: 'normal',
      toolbar: {
        title: 'Font Size',
        icon: 'type',
        items: [
          { value: 'normal', title: 'Normal (16px)' },
          { value: 'large', title: 'Large (18px)' },
          { value: 'extra-large', title: 'Extra Large (20px)' },
          { value: 'huge', title: 'Huge (24px)' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const { theme, locale, userTier, a11yColorMode, a11yFontSize } = context.globals;

      // Generate accessibility classes
      const getA11yClasses = () => {
        let classes = '';

        // Color mode accessibility classes
        switch (a11yColorMode) {
          case 'protanopia':
            classes += ' filter-protanopia';
            break;
          case 'deuteranopia':
            classes += ' filter-deuteranopia';
            break;
          case 'tritanopia':
            classes += ' filter-tritanopia';
            break;
          case 'achromatopsia':
            classes += ' filter-grayscale';
            break;
          case 'high-contrast':
            classes += ' high-contrast';
            break;
        }

        // Font size accessibility classes
        switch (a11yFontSize) {
          case 'large':
            classes += ' text-lg';
            break;
          case 'extra-large':
            classes += ' text-xl';
            break;
          case 'huge':
            classes += ' text-2xl';
            break;
        }

        return classes;
      };

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
              theme === 'dark'
                ? 'dark bg-slate-900 text-white'
                : 'bg-white text-slate-900'
            }${getA11yClasses()}`}
            style={{
              // CSS filters for color vision deficiency simulation
              filter:
                a11yColorMode === 'protanopia'
                  ? 'url(#protanopia)'
                  : a11yColorMode === 'deuteranopia'
                    ? 'url(#deuteranopia)'
                    : a11yColorMode === 'tritanopia'
                      ? 'url(#tritanopia)'
                      : a11yColorMode === 'achromatopsia'
                        ? 'grayscale(100%)'
                        : 'none',
              // High contrast mode
              ...(a11yColorMode === 'high-contrast' && {
                filter: 'contrast(150%) brightness(150%)',
                backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                color: theme === 'dark' ? '#ffffff' : '#000000',
              }),
            }}
          >
            {/* SVG filters for color vision deficiency simulation */}
            {(a11yColorMode === 'protanopia' ||
              a11yColorMode === 'deuteranopia' ||
              a11yColorMode === 'tritanopia') && (
              <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                  <filter id="protanopia">
                    <feColorMatrix
                      type="matrix"
                      values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"
                    />
                  </filter>
                  <filter id="deuteranopia">
                    <feColorMatrix
                      type="matrix"
                      values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"
                    />
                  </filter>
                  <filter id="tritanopia">
                    <feColorMatrix
                      type="matrix"
                      values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"
                    />
                  </filter>
                </defs>
              </svg>
            )}
            <Story />
          </div>
        </StorybookProviders>
      );
    },
  ],
};

export default preview;
