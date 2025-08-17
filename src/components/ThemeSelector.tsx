import React from 'react';
import { useThemeContext } from '../hooks/useCulturalTheme';
import { useTranslation } from 'react-i18next';

export const ThemeSelector: React.FC = () => {
  const { t } = useTranslation(['settings']);
  const { theme: currentTheme, setTheme, availableThemes, resetToLanguageTheme } = useThemeContext();

  return (
    <div className="theme-selector">
      <h3>{t('theme.culturalTheme')}</h3>
      
      <div className="theme-grid">
        {availableThemes.map((theme) => (
          <div
            key={theme.id}
            className={`theme-card ${currentTheme.id === theme.id ? 'selected' : ''}`}
            onClick={() => setTheme(theme)}
          >
            <div 
              className="theme-preview"
              style={{ backgroundImage: theme.gradients.hero }}
            />
            <h4>{theme.name}</h4>
            <p>{theme.description}</p>
          </div>
        ))}
      </div>
      
      <button onClick={resetToLanguageTheme}>
        Reset to Language Default
      </button>
    </div>
  );
};