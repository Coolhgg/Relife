import React, { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mock providers for Storybook
interface MockProviderProps {
  children: ReactNode;
}

// Mock Auth Context Provider
const MockAuthProvider: React.FC<
  MockProviderProps & {
    isAuthenticated?: boolean;
    tier?: 'free' | 'premium' | 'ultimate';
  }
> = ({ children, isAuthenticated = false, tier = 'free' }) => {
  return React.createElement(
    'div',
    {
      'data-testid': 'mock-auth-provider',
      'data-authenticated': isAuthenticated,
      'data-tier': tier,
    },
    children
  );
};

// Mock Theme Context Provider
const MockThemeProvider: React.FC<
  MockProviderProps & {
    theme?: 'light' | 'dark';
  }
> = ({ children, theme = 'light' }) => {
  return React.createElement(
    'div',
    {
      'data-testid': 'mock-theme-provider',
      'data-theme': theme,
      className: theme === 'dark' ? 'dark' : '',
    },
    children
  );
};

// Mock I18n Context Provider
const MockI18nProvider: React.FC<
  MockProviderProps & {
    language?: string;
    direction?: 'ltr' | 'rtl';
  }
> = ({ children, language = 'en', direction = 'ltr' }) => {
  return React.createElement(
    'div',
    {
      'data-testid': 'mock-i18n-provider',
      'data-language': language,
      'data-direction': direction,
      dir: direction,
    },
    children
  );
};

// Comprehensive wrapper for Storybook
interface StorybookProvidersProps {
  children: ReactNode;
  theme?: 'light' | 'dark';
  language?: string;
  direction?: 'ltr' | 'rtl';
  tier?: 'free' | 'premium' | 'ultimate';
  isAuthenticated?: boolean;
}

export const StorybookProviders: React.FC<StorybookProvidersProps> = ({
  children,
  theme = 'light',
  language = 'en',
  direction = 'ltr',
  tier = 'free',
  isAuthenticated = false,
}) => {
  return (
    <BrowserRouter>
      <MockI18nProvider language={language} direction={direction}>
        <MockAuthProvider isAuthenticated={isAuthenticated} tier={tier}>
          <MockThemeProvider theme={theme}>{children}</MockThemeProvider>
        </MockAuthProvider>
      </MockI18nProvider>
    </BrowserRouter>
  );
};
