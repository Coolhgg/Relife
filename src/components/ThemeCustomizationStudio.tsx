/**
 * Theme Customization Studio
 * Visual theme customization tool for creating and editing themes
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Theme, ThemeConfig, PersonalizationSettings } from '../types';
import { useTheme } from '../hooks/useTheme';
import PremiumThemeAnimationService, {
  PremiumAnimationEffects,
} from '../services/premium-theme-animations';

interface ColorPickerProps {
  color: string;
  onChange: (color: string
) => void;
  label: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }
) => (
  <div className="color-picker-group">
    <label className="color-picker-label">{label}</label>
    <div className="color-picker-container">
      <input
        type="color"
        value={color}
        onChange={(e: any
) => onChange(e.target.value)}
        className="color-picker-input"
      />
      <input
        type="text"
        value={color}
        onChange={(e: any
) => onChange(e.target.value)}
        className="color-picker-text"
        placeholder="#000000"
      />
    </div>
  </div>
);

interface AnimationControlProps {
  effect: keyof PremiumAnimationEffects;
  enabled: boolean;
  onChange: (effect: keyof PremiumAnimationEffects, enabled: boolean
) => void;
  label: string;
  description: string;
}

const AnimationControl: React.FC<AnimationControlProps> = ({
  effect,
  enabled,
  onChange,
  label,
  description,
}
) => (
  <div className="animation-control">
    <div className="animation-control-header">
      <label className="animation-control-label">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e: any
) => onChange(effect, e.target.checked)}
        />
        {label}
      </label>
    </div>
    <p className="animation-control-description">{description}</p>
  </div>
);

const ThemeCustomizationStudio: React.FC = (
) => {
  const { theme, themeConfig, updatePersonalization, availableThemes } = useTheme();
  const [activeTab, setActiveTab] = useState<
    'colors' | 'typography' | 'animations' | 'effects' | 'preview'
  >('colors');
  const [customTheme, setCustomTheme] = useState<Partial<ThemeConfig>>(themeConfig);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>(
    'desktop'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'css' | 'scss'>('json');
  const previewRef = useRef<HTMLDivElement>(null);
  const animationService = PremiumThemeAnimationService.getInstance();

  // Animation effects state
  const [animationEffects, setAnimationEffects] = useState<PremiumAnimationEffects>(
    PremiumThemeAnimationService.getDefaultEffects(theme)
  );

  useEffect((
) => {
    setAnimationEffects(PremiumThemeAnimationService.getDefaultEffects(theme));
  }, [theme]);

  const handleColorChange = useCallback(
    (category: string, shade: string, color: string
) => {
      setCustomTheme((prev: any
) => ({
        ...prev,
        colors: {
          ...prev.colors,
          [category]: {
            ...prev.colors?.[category],
            [shade]: color,
          },
        },
      }));
    },
    []
  );

  const handleTypographyChange = useCallback((property: string, value: any
) => {
    setCustomTheme((prev: any
) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [property]: value,
      },
    }));
  }, []);

  const handleAnimationEffectChange = useCallback(
    (effect: keyof PremiumAnimationEffects, enabled: boolean
) => {
      setAnimationEffects((prev: any
) => ({
        ...prev,
        [effect]: enabled,
      }));

      // Apply animation changes in real-time
      animationService.initializePremiumAnimations(theme, {
        ...animationEffects,
        [effect]: enabled,
      });
    },
    [theme, animationEffects, animationService]
  );

  const applyPreview = useCallback((
) => {
    if (previewRef.current) {
      const root = previewRef.current;

      // Apply colors
      if (customTheme.colors) {
        Object.entries(customTheme.colors).forEach(([category, shades]
) => {
          if (typeof shades === 'object') {
            Object.entries(shades).forEach(([shade, color]
) => {
              root.style.setProperty(`--color-${category}-${shade}`, color);
            });
          }
        });
      }

      // Apply typography
      if (customTheme.typography) {
        Object.entries(customTheme.typography).forEach(([property, value]
) => {
          if (typeof value === 'object') {
            Object.entries(value).forEach(([key, val]
) => {
              root.style.setProperty(`--font-${property}-${key}`, val);
            });
          } else {
            root.style.setProperty(`--font-${property}`, value);
          }
        });
      }
    }
  }, [customTheme]);

  const exportTheme = useCallback(async (
) => {
    setIsExporting(true);

    try {
      let exportData: string;

      switch (exportFormat) {
        case 'json':
          exportData = JSON.stringify(
            {
              theme: customTheme,
              animations: animationEffects,
              metadata: {
                name: `Custom ${theme} Theme`,
                created: new Date().toISOString(),
                baseTheme: theme,
              },
            },
            null,
            2
          );
          break;

        case 'css':
          exportData = generateCSS(customTheme);
          break;

        case 'scss':
          exportData = generateSCSS(customTheme);
          break;

        default:
          exportData = JSON.stringify(customTheme, null, 2);
      }

      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `custom-theme-${theme}.${exportFormat}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export theme:', error);
    } finally {
      setIsExporting(false);
    }
  }, [customTheme, animationEffects, theme, exportFormat]);

  const generateCSS = (theme: Partial<ThemeConfig>): string => {
    const cssLines: string[] = [':root {'];

    if (theme.colors) {
      Object.entries(theme.colors).forEach(([category, shades]
) => {
        if (typeof shades === 'object') {
          Object.entries(shades).forEach(([shade, color]
) => {
            cssLines.push(`  --color-${category}-${shade}: ${color};`);
          });
        }
      });
    }

    if (theme.typography?.fontFamily) {
      Object.entries(theme.typography.fontFamily).forEach(([type, font]
) => {
        cssLines.push(`  --font-${type}: ${font};`);
      });
    }

    cssLines.push('}');
    return cssLines.join('\n');
  };

  const generateSCSS = (theme: Partial<ThemeConfig>): string => {
    const scssLines: string[] = ['// Custom Theme Variables', ''];

    if (theme.colors) {
      Object.entries(theme.colors).forEach(([category, shades]
) => {
        if (typeof shades === 'object') {
          scssLines.push(
            `// ${category.charAt(0).toUpperCase() + category.slice(1)} Colors`
          );
          Object.entries(shades).forEach(([shade, color]
) => {
            scssLines.push(`$color-${category}-${shade}: ${color};`);
          });
          scssLines.push('');
        }
      });
    }

    return scssLines.join('\n');
  };

  useEffect((
) => {
    applyPreview();
  }, [applyPreview]);

  return (
    <div className="theme-customization-studio">
      <div className="studio-header">
        <h2>Theme Customization Studio</h2>
        <div className="studio-controls">
          <select
            value={previewMode}
            onChange={(e: any 
) =>
              setPreviewMode(e.target.value as 'desktop' | 'tablet' | 'mobile')
            }
            className="preview-mode-select"
          >
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
          </select>

          <div className="export-controls">
            <select
              value={exportFormat}
              onChange={(e: any
) =>
                setExportFormat(e.target.value as 'json' | 'css' | 'scss')
              }
              className="export-format-select"
            >
              <option value="json">JSON</option>
              <option value="css">CSS</option>
              <option value="scss">SCSS</option>
            </select>

            <button
              onClick={exportTheme}
              disabled={isExporting}
              className="export-button"
            >
              {isExporting ? 'Exporting...' : 'Export Theme'}
            </button>
          </div>
        </div>
      </div>

      <div className="studio-content">
        <nav className="studio-tabs">
          {[
            { key: 'colors', label: 'Colors', icon: '🎨' },
            { key: 'typography', label: 'Typography', icon: '✏️' },
            { key: 'animations', label: 'Animations', icon: '✨' },
            { key: 'effects', label: 'Effects', icon: '🎭' },
            { key: 'preview', label: 'Preview', icon: '👀' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`studio-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={(
) => setActiveTab(tab.key as any)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="studio-main">
          <div className="studio-editor">
            {activeTab === 'colors' && (
              <div className="color-editor">
                <h3>Color Palette</h3>

                {customTheme.colors &&
                  Object.entries(customTheme.colors).map(([category, shades]
) => (
                    <div key={category} className="color-category">
                      <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                      <div className="color-shades">
                        {typeof shades === 'object' &&
                          Object.entries(shades).map(([shade, color]
) => (
                            <ColorPicker
                              key={`${category}-${shade}`}
                              color={color}
                              onChange={(newColor: any 
) =>
                                handleColorChange(category, shade, newColor)
                              }
                              label={`${shade}`}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === 'typography' && (
              <div className="typography-editor">
                <h3>Typography Settings</h3>

                <div className="typography-section">
                  <h4>Font Families</h4>
                  {customTheme.typography?.fontFamily &&
                    Object.entries(customTheme.typography.fontFamily).map(
                      ([type, font]
) => (
                        <div key={type} className="font-family-control">
                          <label>
                            {type.charAt(0).toUpperCase() + type.slice(1)} Font
                          </label>
                          <input
                            type="text"
                            value={font}
                            onChange={(e: any 
) =>
                              handleTypographyChange(
                                `fontFamily.${type}`,
                                e.target.value
                              )
                            }
                            placeholder="Enter font family"
                          />
                        </div>
                      )
                    )}
                </div>

                <div className="typography-section">
                  <h4>Font Sizes</h4>
                  {customTheme.typography?.fontSize &&
                    Object.entries(customTheme.typography.fontSize).map(
                      ([size, value]
) => (
                        <div key={size} className="font-size-control">
                          <label>{size}</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e: any 
) =>
                              handleTypographyChange(`fontSize.${size}`, e.target.value)
                            }
                            placeholder="e.g., 1rem"
                          />
                        </div>
                      )
                    )}
                </div>
              </div>
            )}

            {activeTab === 'animations' && (
              <div className="animation-editor">
                <h3>Animation Effects</h3>

                <div className="animation-intensity">
                  <h4>Animation Intensity</h4>
                  <select
                    onChange={(e: any 
) =>
                      animationService.setAnimationIntensity(e.target.value as any)
                    }
                    className="intensity-select"
                  >
                    <option value="subtle">Subtle</option>
                    <option value="moderate">Moderate</option>
                    <option value="dynamic">Dynamic</option>
                    <option value="dramatic">Dramatic</option>
                  </select>
                </div>

                <div className="animation-effects">
                  <h4>Effect Controls</h4>

                  <div className="effects-grid">
                    <AnimationControl
                      effect="backgroundWave"
                      enabled={animationEffects.backgroundWave || false}
                      onChange={handleAnimationEffectChange}
                      label="Background Wave"
                      description="Animated wave patterns in the background"
                    />

                    <AnimationControl
                      effect="cardFloating"
                      enabled={animationEffects.cardFloating || false}
                      onChange={handleAnimationEffectChange}
                      label="Floating Cards"
                      description="Subtle floating animation for card elements"
                    />

                    <AnimationControl
                      effect="backgroundParticles"
                      enabled={animationEffects.backgroundParticles || false}
                      onChange={handleAnimationEffectChange}
                      label="Background Particles"
                      description="Animated particles floating in background"
                    />

                    <AnimationControl
                      effect="colorShifting"
                      enabled={animationEffects.colorShifting || false}
                      onChange={handleAnimationEffectChange}
                      label="Color Shifting"
                      description="Subtle color transitions throughout the interface"
                    />

                    <AnimationControl
                      effect="lightRay"
                      enabled={animationEffects.lightRay || false}
                      onChange={handleAnimationEffectChange}
                      label="Light Rays"
                      description="Moving light ray effects"
                    />

                    <AnimationControl
                      effect="galaxyBackground"
                      enabled={animationEffects.galaxyBackground || false}
                      onChange={handleAnimationEffectChange}
                      label="Galaxy Background"
                      description="Rotating galaxy spiral background"
                    />

                    <AnimationControl
                      effect="hoverRipple"
                      enabled={animationEffects.hoverRipple || false}
                      onChange={handleAnimationEffectChange}
                      label="Hover Ripples"
                      description="Ripple effect on interactive elements"
                    />

                    <AnimationControl
                      effect="buttonPulse"
                      enabled={animationEffects.buttonPulse || false}
                      onChange={handleAnimationEffectChange}
                      label="Button Pulse"
                      description="Pulsing animation for buttons"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'effects' && (
              <div className="effects-editor">
                <h3>Visual Effects</h3>

                <div className="effects-section">
                  <h4>Shadow Settings</h4>
                  {customTheme.effects?.shadows &&
                    Object.entries(customTheme.effects.shadows).map(
                      ([size, shadow]
) => (
                        <div key={size} className="shadow-control">
                          <label>{size} Shadow</label>
                          <input
                            type="text"
                            value={shadow}
                            onChange={(e: any 
) =>
                              setCustomTheme((prev: any
) => ({
                                ...prev,
                                effects: {
                                  ...prev.effects,
                                  shadows: {
                                    ...prev.effects?.shadows,
                                    [size]: e.target.value,
                                  },
                                },
                              }))
                            }
                            placeholder="CSS shadow value"
                          />
                        </div>
                      )
                    )}
                </div>

                <div className="effects-section">
                  <h4>Opacity Settings</h4>
                  {customTheme.effects?.opacity &&
                    Object.entries(customTheme.effects.opacity).map(
                      ([state, value]
) => (
                        <div key={state} className="opacity-control">
                          <label>{state} Opacity</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={value}
                            onChange={(e: any 
) =>
                              setCustomTheme((prev: any
) => ({
                                ...prev,
                                effects: {
                                  ...prev.effects,
                                  opacity: {
                                    ...prev.effects?.opacity,
                                    [state]: parseFloat(e.target.value),
                                  },
                                },
                              }))
                            }
                          />
                          <span>{value}</span>
                        </div>
                      )
                    )}
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="preview-editor">
                <h3>Live Preview</h3>

                <div className={`preview-container ${previewMode}`} ref={previewRef}>
                  <div className="preview-content">
                    <header className="preview-header">
                      <h1>Relife Alarm</h1>
                      <nav>
                        <button>Dashboard</button>
                        <button>Alarms</button>
                        <button>Settings</button>
                      </nav>
                    </header>

                    <main className="preview-main">
                      <div className="preview-card">
                        <h2>Next Alarm</h2>
                        <p>7:30 AM - Wake up time</p>
                        <button className="preview-button primary">Edit Alarm</button>
                      </div>

                      <div className="preview-card">
                        <h3>Quick Actions</h3>
                        <div className="preview-actions">
                          <button className="preview-button secondary">
                            Add Alarm
                          </button>
                          <button className="preview-button secondary">
                            Sleep Mode
                          </button>
                        </div>
                      </div>

                      <div className="preview-card">
                        <h3>Statistics</h3>
                        <div className="preview-stats">
                          <div className="stat-item">
                            <span className="stat-label">Wake Success Rate</span>
                            <span className="stat-value">94%</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Average Sleep</span>
                            <span className="stat-value">7h 32m</span>
                          </div>
                        </div>
                      </div>
                    </main>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .theme-customization-studio {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          background: var(--color-background-primary);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
        }

        .studio-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--color-border-primary);
        }

        .studio-header h2 {
          color: var(--color-text-primary);
          margin: 0;
        }

        .studio-controls {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .export-controls {
          display: flex;
          gap: 10px;
        }

        .studio-content {
          display: flex;
          gap: 20px;
        }

        .studio-tabs {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 200px;
        }

        .studio-tab {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--color-background-secondary);
          border: 1px solid var(--color-border-primary);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .studio-tab:hover {
          background: var(--color-background-tertiary);
        }

        .studio-tab.active {
          background: var(--color-primary-500);
          color: white;
          border-color: var(--color-primary-600);
        }

        .studio-main {
          flex: 1;
        }

        .studio-editor {
          background: var(--color-background-secondary);
          border-radius: 8px;
          padding: 20px;
          min-height: 600px;
        }

        .color-category {
          margin-bottom: 30px;
        }

        .color-category h4 {
          color: var(--color-text-primary);
          margin-bottom: 15px;
        }

        .color-shades {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }

        .color-picker-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .color-picker-label {
          color: var(--color-text-secondary);
          font-size: 0.9rem;
        }

        .color-picker-container {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .color-picker-input {
          width: 50px;
          height: 35px;
          border: 1px solid var(--color-border-primary);
          border-radius: 6px;
          cursor: pointer;
        }

        .color-picker-text {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--color-border-primary);
          border-radius: 6px;
          background: var(--color-background-primary);
          color: var(--color-text-primary);
        }

        .typography-section {
          margin-bottom: 30px;
        }

        .font-family-control,
        .font-size-control {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 15px;
        }

        .font-family-control input,
        .font-size-control input {
          padding: 8px 12px;
          border: 1px solid var(--color-border-primary);
          border-radius: 6px;
          background: var(--color-background-primary);
          color: var(--color-text-primary);
        }

        .effects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .animation-control {
          padding: 15px;
          background: var(--color-background-primary);
          border-radius: 8px;
          border: 1px solid var(--color-border-primary);
        }

        .animation-control-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .animation-control-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-primary);
          font-weight: 500;
          cursor: pointer;
        }

        .animation-control-description {
          color: var(--color-text-secondary);
          font-size: 0.9rem;
          margin: 0;
        }

        .preview-container {
          background: var(--color-background-primary);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .preview-container.desktop {
          width: 100%;
        }

        .preview-container.tablet {
          width: 768px;
          margin: 0 auto;
        }

        .preview-container.mobile {
          width: 375px;
          margin: 0 auto;
        }

        .preview-content {
          padding: 20px;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--color-border-primary);
        }

        .preview-header h1 {
          color: var(--color-text-primary);
          margin: 0;
        }

        .preview-header nav {
          display: flex;
          gap: 15px;
        }

        .preview-card {
          background: var(--color-background-secondary);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }

        .preview-card h2,
        .preview-card h3 {
          color: var(--color-text-primary);
          margin: 0 0 15px 0;
        }

        .preview-actions {
          display: flex;
          gap: 10px;
        }

        .preview-button {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .preview-button.primary {
          background: var(--color-primary-500);
          color: white;
        }

        .preview-button.secondary {
          background: var(--color-background-tertiary);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border-primary);
        }

        .preview-stats {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          color: var(--color-text-secondary);
        }

        .stat-value {
          color: var(--color-text-primary);
          font-weight: 600;
        }

        .intensity-select,
        .export-format-select,
        .preview-mode-select {
          padding: 8px 12px;
          border: 1px solid var(--color-border-primary);
          border-radius: 6px;
          background: var(--color-background-primary);
          color: var(--color-text-primary);
        }

        .export-button {
          padding: 8px 16px;
          background: var(--color-primary-500);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .export-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .effects-section {
          margin-bottom: 30px;
        }

        .shadow-control,
        .opacity-control {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 15px;
        }

        .shadow-control input {
          padding: 8px 12px;
          border: 1px solid var(--color-border-primary);
          border-radius: 6px;
          background: var(--color-background-primary);
          color: var(--color-text-primary);
        }

        .opacity-control {
          flex-direction: row;
          align-items: center;
        }

        .opacity-control input {
          flex: 1;
          margin: 0 10px;
        }
      `}</style>
    </div>
  );
};

export default ThemeCustomizationStudio;
