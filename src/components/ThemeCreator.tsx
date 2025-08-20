import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Palette,
  Eye,
  Save,
  Download,
  Upload,
  Copy,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Check,
  X,
  Settings,
  Sparkles,
  Layers,
  Type,
  Zap,
  Sliders,
  Sun,
  Moon,
  Monitor,
  Share2,
  Heart,
  Star,
  Edit3,
  Bell,
  User
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type {
  Theme,
  ThemeConfig,
  CustomThemeConfig,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeAnimations,
  ThemeEffects,
  ThemeAccessibility
} from '../types';

interface ThemeCreatorProps {
  className?: string;
  onClose?: () => void;
}

interface ColorPaletteState {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}

interface PreviewComponent {
  id: string;
  name: string;
  component: React.ReactNode;
}

const ThemeCreator: React.FC<ThemeCreatorProps> = ({
  className = '',
  onClose
}) => {
  const {
    theme,
    themeConfig,
    setTheme,
    createCustomTheme,
    saveThemePreset,
    availableThemes
  } = useTheme();

  // State management
  const [currentEditingTheme, setCurrentEditingTheme] = useState<CustomThemeConfig | null>(null);
  const [baseTheme, setBaseTheme] = useState<Theme>('light');
  const [activeSection, setActiveSection] = useState<string>('colors');
  const [previewMode, setPreviewMode] = useState(false);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [colorPalette, setColorPalette] = useState<ColorPaletteState>({
    primary: '#0ea5e9',
    secondary: '#64748b',
    accent: '#ef4444',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    border: '#e2e8f0'
  });
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [savedThemes, setSavedThemes] = useState<CustomThemeConfig[]>([]);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  // Initialize from base theme
  useEffect(() => {
    if (themeConfig) {
      setColorPalette({
        primary: themeConfig.colors.primary[500] || '#0ea5e9',
        secondary: themeConfig.colors.secondary[500] || '#64748b',
        accent: themeConfig.colors.accent[500] || '#ef4444',
        background: themeConfig.colors.background.primary || '#ffffff',
        surface: themeConfig.colors.surface.elevated || '#f8fafc',
        text: themeConfig.colors.text.primary || '#0f172a',
        border: themeConfig.colors.border.primary || '#e2e8f0'
      });
    }
  }, [themeConfig, baseTheme]);

  // Color generation utilities
  const generateColorShades = useCallback((baseColor: string) => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Convert RGB to HSL
    const rgbToHsl = (r: number, g: number, b: number) => {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return [h * 360, s * 100, l * 100];
    };

    // Convert HSL to RGB
    const hslToRgb = (h: number, s: number, l: number) => {
      h /= 360;
      s /= 100;
      l /= 100;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const k = (n + h * 12) % 12;
        return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      };
      return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
    };

    // RGB to Hex
    const rgbToHex = (r: number, g: number, b: number) => {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    const rgb = hexToRgb(baseColor);
    if (!rgb) return {};

    const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const shades = {
      50: hslToRgb(h, Math.max(s - 40, 10), Math.min(l + 40, 95)),
      100: hslToRgb(h, Math.max(s - 30, 15), Math.min(l + 30, 90)),
      200: hslToRgb(h, Math.max(s - 20, 20), Math.min(l + 20, 85)),
      300: hslToRgb(h, Math.max(s - 10, 25), Math.min(l + 10, 75)),
      400: hslToRgb(h, s, Math.min(l + 5, 65)),
      500: [rgb.r, rgb.g, rgb.b],
      600: hslToRgb(h, Math.min(s + 5, 90), Math.max(l - 5, 35)),
      700: hslToRgb(h, Math.min(s + 10, 95), Math.max(l - 15, 25)),
      800: hslToRgb(h, Math.min(s + 15, 100), Math.max(l - 25, 15)),
      900: hslToRgb(h, Math.min(s + 20, 100), Math.max(l - 35, 10)),
      950: hslToRgb(h, Math.min(s + 25, 100), Math.max(l - 45, 5))
    };

    const result: Record<string, string> = {};
    Object.entries(shades).forEach(([shade, [r, g, b]]) => {
      result[shade] = rgbToHex(r, g, b);
    });

    return result;
  }, []);

  // Generate theme from current palette
  const generateCustomTheme = useCallback(async () => {
    if (!themeName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    setIsGeneratingTheme(true);

    try {
      const customizations = {
        colors: {
          primary: generateColorShades(colorPalette.primary),
          secondary: generateColorShades(colorPalette.secondary),
          accent: generateColorShades(colorPalette.accent),
          background: {
            primary: colorPalette.background,
            secondary: adjustColor(colorPalette.background, -5),
            tertiary: adjustColor(colorPalette.background, -10),
            overlay: 'rgba(0, 0, 0, 0.5)',
            modal: colorPalette.background,
            card: colorPalette.surface
          },
          text: {
            primary: colorPalette.text,
            secondary: adjustColor(colorPalette.text, 20),
            tertiary: adjustColor(colorPalette.text, 40),
            inverse: getContrastColor(colorPalette.text),
            disabled: adjustColor(colorPalette.text, 60),
            link: colorPalette.primary
          },
          border: {
            primary: colorPalette.border,
            secondary: adjustColor(colorPalette.border, -10),
            focus: colorPalette.primary,
            hover: adjustColor(colorPalette.border, -20),
            active: adjustColor(colorPalette.primary, -10)
          },
          surface: {
            elevated: colorPalette.surface,
            depressed: adjustColor(colorPalette.surface, -5),
            interactive: adjustColor(colorPalette.surface, 10),
            disabled: adjustColor(colorPalette.surface, -15)
          }
        }
      };

      const customTheme = await createCustomTheme(baseTheme, customizations);

      customTheme.displayName = themeName;
      customTheme.description = themeDescription || `Custom theme based on ${baseTheme}`;

      setCurrentEditingTheme(customTheme);
      setSavedThemes(prev => [...prev, customTheme]);

      // Save to localStorage
      const savedCustomThemes = JSON.parse(localStorage.getItem('custom-themes') || '[]');
      savedCustomThemes.push(customTheme);
      localStorage.setItem('custom-themes', JSON.stringify(savedCustomThemes));

    } catch (error) {
      console.error('Error generating custom theme:', error);
      alert('Failed to generate theme. Please try again.');
    } finally {
      setIsGeneratingTheme(false);
    }
  }, [themeName, themeDescription, colorPalette, baseTheme, createCustomTheme, generateColorShades]);

  // Utility functions
  const adjustColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  const getContrastColor = (hexcolor: string) => {
    const r = parseInt(hexcolor.substr(1, 2), 16);
    const g = parseInt(hexcolor.substr(3, 2), 16);
    const b = parseInt(hexcolor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };

  const handleColorChange = (colorKey: keyof ColorPaletteState, color: string) => {
    setColorPalette(prev => ({
      ...prev,
      [colorKey]: color
    }));
  };

  const generateRandomPalette = () => {
    const hues = [Math.random() * 360, Math.random() * 360, Math.random() * 360];
    setColorPalette({
      primary: `hsl(${hues[0]}, 70%, 50%)`,
      secondary: `hsl(${hues[1]}, 60%, 40%)`,
      accent: `hsl(${hues[2]}, 80%, 55%)`,
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      border: '#e2e8f0'
    });
  };

  // Color picker component
  const ColorPicker: React.FC<{
    color: string;
    onChange: (color: string) => void;
    onClose: () => void;
  }> = ({ color, onChange, onClose }) => (
    <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">Choose Color</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-32 rounded-md border border-gray-200 cursor-pointer"
      />
      <div className="mt-3 flex gap-2">
        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899'].map((presetColor) => (
          <button
            key={presetColor}
            onClick={() => onChange(presetColor)}
            className="w-6 h-6 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-colors"
            style={{ backgroundColor: presetColor }}
          />
        ))}
      </div>
      <div className="mt-3">
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  // Preview components
  const previewComponents: PreviewComponent[] = [
    {
      id: 'card',
      name: 'Card',
      component: (
        <div className="p-4 rounded-lg shadow-md" style={{
          backgroundColor: colorPalette.surface,
          border: `1px solid ${colorPalette.border}`,
          color: colorPalette.text
        }}>
          <h3 className="font-semibold mb-2" style={{ color: colorPalette.primary }}>Sample Card</h3>
          <p className="text-sm opacity-80">This is how cards will look with your custom theme.</p>
        </div>
      )
    },
    {
      id: 'button',
      name: 'Buttons',
      component: (
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-md text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: colorPalette.primary }}
          >
            Primary
          </button>
          <button
            className="px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'transparent',
              color: colorPalette.primary,
              border: `2px solid ${colorPalette.primary}`
            }}
          >
            Secondary
          </button>
          <button
            className="px-4 py-2 rounded-md text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: colorPalette.accent }}
          >
            Accent
          </button>
        </div>
      )
    },
    {
      id: 'form',
      name: 'Form Elements',
      component: (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Input field"
            className="w-full px-3 py-2 rounded-md"
            style={{
              backgroundColor: colorPalette.background,
              border: `1px solid ${colorPalette.border}`,
              color: colorPalette.text
            }}
          />
          <select
            className="w-full px-3 py-2 rounded-md"
            style={{
              backgroundColor: colorPalette.background,
              border: `1px solid ${colorPalette.border}`,
              color: colorPalette.text
            }}
          >
            <option>Select option</option>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </div>
      )
    }
  ];

  const sections = [
    { id: 'colors', name: 'Colors', icon: Palette },
    { id: 'typography', name: 'Typography', icon: Type },
    { id: 'spacing', name: 'Spacing', icon: Sliders },
    { id: 'animations', name: 'Animations', icon: Zap },
    { id: 'effects', name: 'Effects', icon: Sparkles },
  ];

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Palette className="text-blue-600" size={24} />
                <h1 className="text-2xl font-bold text-gray-900">Theme Creator</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Based on</span>
                <select
                  value={baseTheme}
                  onChange={(e) => setBaseTheme(e.target.value as Theme)}
                  className="px-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light Theme</option>
                  <option value="dark">Dark Theme</option>
                  <option value="high-contrast">High Contrast</option>
                  <option value="nature">Nature</option>
                  <option value="ocean">Ocean</option>
                  <option value="cosmic">Cosmic</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={generateRandomPalette}
                className="flex items-center gap-2 px-4 py-2 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <RefreshCw size={16} />
                <span>Random</span>
              </button>
              <button
                onClick={generateCustomTheme}
                disabled={isGeneratingTheme || !themeName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingTheme ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>{isGeneratingTheme ? 'Generating...' : 'Save Theme'}</span>
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={16} />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex mt-20">
          {/* Sidebar - Controls */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-6">
              {/* Theme Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Theme Name *
                    </label>
                    <input
                      type="text"
                      value={themeName}
                      onChange={(e) => setThemeName(e.target.value)}
                      placeholder="My Awesome Theme"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={themeDescription}
                      onChange={(e) => setThemeDescription(e.target.value)}
                      placeholder="Describe your theme..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section Navigation */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customize</h3>
                <nav className="space-y-1">
                  {sections.map(section => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="font-medium">{section.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Color Controls */}
              {activeSection === 'colors' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Color Palette</h4>
                  {Object.entries(colorPalette).map(([key, color]) => (
                    <div key={key} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowColorPicker(showColorPicker === key ? null : key)}
                          className="w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm hover:border-gray-300 transition-colors"
                          style={{ backgroundColor: color }}
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => handleColorChange(key as keyof ColorPaletteState, e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {showColorPicker === key && (
                        <ColorPicker
                          color={color}
                          onChange={(newColor) => handleColorChange(key as keyof ColorPaletteState, newColor)}
                          onClose={() => setShowColorPicker(null)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const exported = JSON.stringify({ colorPalette, themeName, themeDescription }, null, 2);
                      navigator.clipboard.writeText(exported);
                      alert('Theme data copied to clipboard!');
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Copy size={14} />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => {
                      const element = document.createElement('a');
                      const file = new Blob([JSON.stringify({ colorPalette, themeName, themeDescription }, null, 2)], { type: 'application/json' });
                      element.href = URL.createObjectURL(file);
                      element.download = `${themeName || 'custom-theme'}.json`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Download size={14} />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Preview Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Live Preview</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    See how your theme looks in real components
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      previewMode
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Eye size={16} />
                    <span>{previewMode ? 'Exit Preview' : 'Full Preview'}</span>
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div
                className="rounded-xl border-2 border-gray-200 overflow-hidden"
                style={{
                  backgroundColor: colorPalette.background,
                  minHeight: '500px'
                }}
              >
                <div className="p-8 space-y-8">
                  {/* Header Preview */}
                  <div
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{
                      backgroundColor: colorPalette.primary,
                      color: getContrastColor(colorPalette.primary)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <Settings size={16} />
                      </div>
                      <div>
                        <h2 className="font-semibold">Relife Alarm</h2>
                        <p className="text-sm opacity-80">Your custom theme</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors">
                        <Settings size={16} />
                      </button>
                      <button className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Component Previews */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {previewComponents.map(({ id, name, component }) => (
                      <div key={id} className="space-y-3">
                        <h4 className="font-medium" style={{ color: colorPalette.text }}>
                          {name}
                        </h4>
                        {component}
                      </div>
                    ))}
                  </div>

                  {/* Dashboard Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: colorPalette.surface,
                        border: `1px solid ${colorPalette.border}`
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colorPalette.primary }}
                        />
                        <span className="text-sm font-medium" style={{ color: colorPalette.text }}>
                          Active Alarms
                        </span>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: colorPalette.primary }}>
                        5
                      </p>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: colorPalette.surface,
                        border: `1px solid ${colorPalette.border}`
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colorPalette.accent }}
                        />
                        <span className="text-sm font-medium" style={{ color: colorPalette.text }}>
                          Sleep Score
                        </span>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: colorPalette.accent }}>
                        85%
                      </p>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: colorPalette.surface,
                        border: `1px solid ${colorPalette.border}`
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colorPalette.secondary }}
                        />
                        <span className="text-sm font-medium" style={{ color: colorPalette.text }}>
                          Streak
                        </span>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: colorPalette.secondary }}>
                        12 days
                      </p>
                    </div>
                  </div>

                  {/* Form Preview */}
                  <div
                    className="p-6 rounded-lg"
                    style={{
                      backgroundColor: colorPalette.surface,
                      border: `1px solid ${colorPalette.border}`
                    }}
                  >
                    <h3 className="text-lg font-semibold mb-4" style={{ color: colorPalette.text }}>
                      Create New Alarm
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colorPalette.text }}>
                          Time
                        </label>
                        <input
                          type="time"
                          defaultValue="07:00"
                          className="w-full px-3 py-2 rounded-md"
                          style={{
                            backgroundColor: colorPalette.background,
                            border: `1px solid ${colorPalette.border}`,
                            color: colorPalette.text
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colorPalette.text }}>
                          Label
                        </label>
                        <input
                          type="text"
                          placeholder="Wake up for work"
                          className="w-full px-3 py-2 rounded-md"
                          style={{
                            backgroundColor: colorPalette.background,
                            border: `1px solid ${colorPalette.border}`,
                            color: colorPalette.text
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        className="px-4 py-2 rounded-md text-white font-medium hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: colorPalette.primary }}
                      >
                        Create Alarm
                      </button>
                      <button
                        className="px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
                        style={{
                          backgroundColor: 'transparent',
                          color: colorPalette.text,
                          border: `1px solid ${colorPalette.border}`
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCreator;