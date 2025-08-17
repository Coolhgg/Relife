import { SupportedLanguage } from './i18n';

// Cultural theme types
export interface CulturalTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  gradients: {
    hero: string;
    card: string;
    button: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  culturalElements: {
    patterns?: string[];
    motifs?: string[];
    symbolism?: string[];
  };
}

// Regional theme mappings
export const REGIONAL_THEMES: Record<string, CulturalTheme> = {
  // Western themes
  'en': {
    id: 'western-modern',
    name: 'Western Modern',
    description: 'Clean, minimalist design with tech-forward aesthetics',
    colors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#10B981',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #f3f4f6 100%)',
      button: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)'
    },
    shadows: {
      small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      large: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
    },
    fonts: {
      primary: 'Inter, system-ui, sans-serif',
      secondary: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace'
    },
    borderRadius: {
      small: '0.375rem',
      medium: '0.5rem',
      large: '0.75rem'
    },
    culturalElements: {
      patterns: ['geometric', 'minimal'],
      motifs: ['tech', 'corporate'],
      symbolism: ['progress', 'efficiency']
    }
  },

  'en-GB': {
    id: 'british-classic',
    name: 'British Classic',
    description: 'Sophisticated design with traditional British elegance',
    colors: {
      primary: '#1E3A8A',
      secondary: '#7C3AED',
      accent: '#059669',
      background: '#F1F5F9',
      surface: '#FFFFFF',
      text: '#0F172A',
      textSecondary: '#475569',
      border: '#CBD5E1',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#1E3A8A'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
      button: 'linear-gradient(90deg, #1E3A8A 0%, #7C3AED 100%)'
    },
    shadows: {
      small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      large: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
    },
    fonts: {
      primary: 'Georgia, serif',
      secondary: 'system-ui, sans-serif',
      mono: 'Monaco, monospace'
    },
    borderRadius: {
      small: '0.25rem',
      medium: '0.375rem',
      large: '0.5rem'
    },
    culturalElements: {
      patterns: ['heraldic', 'tartan'],
      motifs: ['royal', 'heritage'],
      symbolism: ['tradition', 'sophistication']
    }
  },

  'en-AU': {
    id: 'australian-vibrant',
    name: 'Australian Vibrant',
    description: 'Bright, energetic design inspired by Australian landscapes',
    colors: {
      primary: '#F97316',
      secondary: '#EAB308',
      accent: '#06B6D4',
      background: '#FEF7ED',
      surface: '#FFFFFF',
      text: '#9A3412',
      textSecondary: '#A16207',
      border: '#FED7AA',
      success: '#16A34A',
      warning: '#EAB308',
      error: '#DC2626',
      info: '#06B6D4'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #fef7ed 100%)',
      button: 'linear-gradient(90deg, #F97316 0%, #EAB308 100%)'
    },
    shadows: {
      small: '0 1px 2px 0 rgb(249 115 22 / 0.1)',
      medium: '0 4px 6px -1px rgb(249 115 22 / 0.1)',
      large: '0 25px 50px -12px rgb(249 115 22 / 0.25)'
    },
    fonts: {
      primary: 'system-ui, sans-serif',
      secondary: 'system-ui, sans-serif',
      mono: 'Courier New, monospace'
    },
    borderRadius: {
      small: '0.5rem',
      medium: '0.75rem',
      large: '1rem'
    },
    culturalElements: {
      patterns: ['aboriginal', 'outback'],
      motifs: ['sun', 'surf'],
      symbolism: ['adventure', 'laid-back']
    }
  },

  // Asian themes
  'zh': {
    id: 'chinese-harmony',
    name: 'Chinese Harmony',
    description: 'Balanced design inspired by Chinese aesthetics and feng shui',
    colors: {
      primary: '#DC2626',
      secondary: '#CA8A04',
      accent: '#16A34A',
      background: '#FEF9F3',
      surface: '#FFFFFF',
      text: '#7C2D12',
      textSecondary: '#A16207',
      border: '#FED7AA',
      success: '#16A34A',
      warning: '#CA8A04',
      error: '#DC2626',
      info: '#0EA5E9'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #dc2626 0%, #ca8a04 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #fef9f3 100%)',
      button: 'linear-gradient(90deg, #DC2626 0%, #CA8A04 100%)'
    },
    shadows: {
      small: '0 1px 2px 0 rgb(220 38 38 / 0.1)',
      medium: '0 4px 6px -1px rgb(220 38 38 / 0.1)',
      large: '0 25px 50px -12px rgb(220 38 38 / 0.25)'
    },
    fonts: {
      primary: 'Noto Sans SC, system-ui, sans-serif',
      secondary: 'system-ui, sans-serif',
      mono: 'Consolas, monospace'
    },
    borderRadius: {
      small: '0.25rem',
      medium: '0.5rem',
      large: '0.75rem'
    },
    culturalElements: {
      patterns: ['bamboo', 'clouds', 'mountains'],
      motifs: ['dragon', 'phoenix', 'lotus'],
      symbolism: ['harmony', 'prosperity', 'wisdom']
    }
  },

  'zh-TW': {
    id: 'taiwanese-elegance',
    name: 'Taiwanese Elegance',
    description: 'Refined design blending traditional and modern Taiwanese culture',
    colors: {
      primary: '#B91C1C',
      secondary: '#0369A1',
      accent: '#047857',
      background: '#FDF4FF',
      surface: '#FFFFFF',
      text: '#7C2D12',
      textSecondary: '#0C4A6E',
      border: '#DDD6FE',
      success: '#047857',
      warning: '#CA8A04',
      error: '#B91C1C',
      info: '#0369A1'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #b91c1c 0%, #0369a1 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #fdf4ff 100%)',
      button: 'linear-gradient(90deg, #B91C1C 0%, #0369A1 100%)'
    },
    shadows: {
      small: '0 1px 2px 0 rgb(185 28 28 / 0.1)',
      medium: '0 4px 6px -1px rgb(185 28 28 / 0.1)',
      large: '0 25px 50px -12px rgb(185 28 28 / 0.25)'
    },
    fonts: {
      primary: 'Noto Sans TC, system-ui, sans-serif',
      secondary: 'system-ui, sans-serif',
      mono: 'Consolas, monospace'
    },
    borderRadius: {
      small: '0.25rem',
      medium: '0.5rem',
      large: '0.75rem'
    },
    culturalElements: {
      patterns: ['jade', 'waves', 'mountains'],
      motifs: ['plum-blossom', 'tea', 'calligraphy'],
      symbolism: ['resilience', 'beauty', 'tradition']
    }
  },

  'ja': {
    id: 'japanese-zen',
    name: 'Japanese Zen',
    description: 'Minimalist design inspired by Japanese aesthetics and wabi-sabi',
    colors: {
      primary: '#7C2D12',
      secondary: '#0F766E',
      accent: '#DC2626',
      background: '#FFFBEB',
      surface: '#FFFFFF',
      text: '#451A03',
      textSecondary: '#0F766E',
      border: '#FDE68A',
      success: '#0F766E',
      warning: '#D97706',
      error: '#DC2626',
      info: '#0369A1'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #7c2d12 0%, #0f766e 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #fffbeb 100%)',
      button: 'linear-gradient(90deg, #7C2D12 0%, #0F766E 100%)'
    },
    shadows: {
      small: '0 1px 2px 0 rgb(124 45 18 / 0.1)',
      medium: '0 4px 6px -1px rgb(124 45 18 / 0.1)',
      large: '0 25px 50px -12px rgb(124 45 18 / 0.25)'
    },
    fonts: {
      primary: 'Noto Sans JP, system-ui, sans-serif',
      secondary: 'system-ui, sans-serif',
      mono: 'Monaco, monospace'
    },
    borderRadius: {
      small: '0.125rem',
      medium: '0.25rem',
      large: '0.375rem'
    },
    culturalElements: {
      patterns: ['waves', 'cherry-blossom', 'geometric'],
      motifs: ['zen', 'nature', 'seasons'],
      symbolism: ['simplicity', 'balance', 'imperfection']
    }
  },

  // European themes
  'fr': {
    id: 'french-chic',
    name: 'French Chic',
    description: 'Elegant design inspired by French sophistication and artistry',
    colors: {
      primary: '#1E40AF',
      secondary: '#DC2626',
      accent: '#FFFFFF',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#DC2626',
      info: '#1E40AF'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #1e40af 0%, #dc2626 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)',
      button: 'linear-gradient(90deg, #1E40AF 0%, #DC2626 100%)'
    },
    shadows: {
      small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      large: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
    },
    fonts: {
      primary: 'Playfair Display, serif',
      secondary: 'Inter, system-ui, sans-serif',
      mono: 'Courier New, monospace'
    },
    borderRadius: {
      small: '0.25rem',
      medium: '0.5rem',
      large: '0.75rem'
    },
    culturalElements: {
      patterns: ['fleur-de-lis', 'baroque', 'art-nouveau'],
      motifs: ['elegance', 'art', 'cuisine'],
      symbolism: ['sophistication', 'culture', 'joie-de-vivre']
    }
  },

  'fr-CA': {
    id: 'canadian-nature',
    name: 'Canadian Nature',
    description: 'Natural design inspired by Canadian landscapes and seasons',
    colors: {
      primary: '#DC2626',
      secondary: '#FFFFFF',
      accent: '#16A34A',
      background: '#FEF2F2',
      surface: '#FFFFFF',
      text: '#7F1D1D',
      textSecondary: '#991B1B',
      border: '#FECACA',
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #dc2626 0%, #16a34a 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #fef2f2 100%)',
      button: 'linear-gradient(90deg, #DC2626 0%, #16A34A 100%)'
    },
    shadows: {
      small: '0 1px 2px 0 rgb(220 38 38 / 0.1)',
      medium: '0 4px 6px -1px rgb(220 38 38 / 0.1)',
      large: '0 25px 50px -12px rgb(220 38 38 / 0.25)'
    },
    fonts: {
      primary: 'system-ui, sans-serif',
      secondary: 'Georgia, serif',
      mono: 'Monaco, monospace'
    },
    borderRadius: {
      small: '0.375rem',
      medium: '0.5rem',
      large: '0.75rem'
    },
    culturalElements: {
      patterns: ['maple-leaf', 'plaid', 'wilderness'],
      motifs: ['nature', 'seasons', 'multiculturalism'],
      symbolism: ['unity', 'diversity', 'wilderness']
    }
  },

  // Latin themes
  'es': {
    id: 'spanish-warmth',
    name: 'Spanish Warmth',
    description: 'Warm, vibrant design inspired by Spanish culture and architecture',
    colors: {
      primary: '#DC2626',
      secondary: '#F59E0B',
      accent: '#059669',
      background: '#FFFBEB',
      surface: '#FFFFFF',
      text: '#92400E',
      textSecondary: '#B45309',
      border: '#FED7AA',
      success: '#059669',
      warning: '#F59E0B',
      error: '#DC2626',
      info: '#0EA5E9'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #fffbeb 100%)',
      button: 'linear-gradient(90deg, #DC2626 0%, #F59E0B 100%)'
    },
    shadows: {
      small: '0 1px 2px 0 rgb(220 38 38 / 0.1)',
      medium: '0 4px 6px -1px rgb(220 38 38 / 0.1)',
      large: '0 25px 50px -12px rgb(220 38 38 / 0.25)'
    },
    fonts: {
      primary: 'system-ui, sans-serif',
      secondary: 'Georgia, serif',
      mono: 'Courier New, monospace'
    },
    borderRadius: {
      small: '0.375rem',
      medium: '0.5rem',
      large: '0.75rem'
    },
    culturalElements: {
      patterns: ['moorish', 'tiles', 'flamenco'],
      motifs: ['sun', 'passion', 'fiesta'],
      symbolism: ['warmth', 'community', 'celebration']
    }
  },

  'es-MX': {
    id: 'mexican-vibrance',
    name: 'Mexican Vibrance',
    description: 'Colorful, festive design inspired by Mexican traditions and art',
    colors: {
      primary: '#16A34A',
      secondary: '#DC2626',
      accent: '#F59E0B',
      background: '#F0FDF4',
      surface: '#FFFFFF',
      text: '#14532D',
      textSecondary: '#166534',
      border: '#BBF7D0',
      success: '#16A34A',
      warning: '#F59E0B',
      error: '#DC2626',
      info: '#0EA5E9'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #16a34a 0%, #dc2626 0%, #f59e0b 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)',
      button: 'linear-gradient(90deg, #16A34A 0%, #DC2626 50%, #F59E0B 100%)'
    },
    shadows: {
      small: '0 1px 2px 0 rgb(22 163 74 / 0.1)',
      medium: '0 4px 6px -1px rgb(22 163 74 / 0.1)',
      large: '0 25px 50px -12px rgb(22 163 74 / 0.25)'
    },
    fonts: {
      primary: 'system-ui, sans-serif',
      secondary: 'Georgia, serif',
      mono: 'Courier New, monospace'
    },
    borderRadius: {
      small: '0.5rem',
      medium: '0.75rem',
      large: '1rem'
    },
    culturalElements: {
      patterns: ['aztec', 'talavera', 'papel-picado'],
      motifs: ['vibrant', 'handcrafted', 'celebration'],
      symbolism: ['family', 'tradition', 'joy']
    }
  },

  'es-419': {
    id: 'latin-american-spirit',
    name: 'Latin American Spirit',
    description: 'Passionate design celebrating Latin American diversity and culture',
    colors: {
      primary: '#F97316',
      secondary: '#8B5CF6',
      accent: '#06B6D4',
      background: '#FFF7ED',
      surface: '#FFFFFF',
      text: '#9A3412',
      textSecondary: '#7C3AED',
      border: '#FED7AA',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #f97316 0%, #8b5cf6 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #fff7ed 100%)',
      button: 'linear-gradient(90deg, #F97316 0%, #8B5CF6 100%)'
    },
    shadows: {
      small: '0 1px 2px 0 rgb(249 115 22 / 0.1)',
      medium: '0 4px 6px -1px rgb(249 115 22 / 0.1)',
      large: '0 25px 50px -12px rgb(249 115 22 / 0.25)'
    },
    fonts: {
      primary: 'system-ui, sans-serif',
      secondary: 'Georgia, serif',
      mono: 'Courier New, monospace'
    },
    borderRadius: {
      small: '0.5rem',
      medium: '0.75rem',
      large: '1rem'
    },
    culturalElements: {
      patterns: ['indigenous', 'colonial', 'modern'],
      motifs: ['diversity', 'music', 'dance'],
      symbolism: ['passion', 'unity', 'resilience']
    }
  }
};

// Get theme for a specific language/region
export const getRegionalTheme = (language: SupportedLanguage): CulturalTheme => {
  return REGIONAL_THEMES[language] || REGIONAL_THEMES['en'];
};

// Get all available themes
export const getAllThemes = (): CulturalTheme[] => {
  return Object.values(REGIONAL_THEMES);
};

// Theme utilities
export const applyTheme = (theme: CulturalTheme): void => {
  const root = document.documentElement;
  
  // Apply color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Apply gradient variables
  Object.entries(theme.gradients).forEach(([key, value]) => {
    root.style.setProperty(`--gradient-${key}`, value);
  });
  
  // Apply shadow variables
  Object.entries(theme.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });
  
  // Apply font variables
  Object.entries(theme.fonts).forEach(([key, value]) => {
    root.style.setProperty(`--font-${key}`, value);
  });
  
  // Apply border radius variables
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value);
  });
};

// Get theme colors as CSS custom properties
export const getThemeCSS = (theme: CulturalTheme): string => {
  const cssVars: string[] = [];
  
  Object.entries(theme.colors).forEach(([key, value]) => {
    cssVars.push(`--color-${key}: ${value};`);
  });
  
  Object.entries(theme.gradients).forEach(([key, value]) => {
    cssVars.push(`--gradient-${key}: ${value};`);
  });
  
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssVars.push(`--shadow-${key}: ${value};`);
  });
  
  Object.entries(theme.fonts).forEach(([key, value]) => {
    cssVars.push(`--font-${key}: ${value};`);
  });
  
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    cssVars.push(`--radius-${key}: ${value};`);
  });
  
  return `:root {\n  ${cssVars.join('\n  ')}\n}`;
};