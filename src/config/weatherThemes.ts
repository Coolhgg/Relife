import type { ThemeVariant } from '../types';

export interface WeatherThemePreset {
  id: string;
  name: string;
  description: string;
  rules: {
    sunny: { variant: ThemeVariant; mode?: 'light' | 'dark' };
    cloudy: { variant: ThemeVariant; mode?: 'light' | 'dark' };
    rainy: { variant: ThemeVariant; mode?: 'light' | 'dark' };
    snowy: { variant: ThemeVariant; mode?: 'light' | 'dark' };
    stormy: { variant: ThemeVariant; mode?: 'light' | 'dark' };
    foggy?: { variant: ThemeVariant; mode?: 'light' | 'dark' };
    windy?: { variant: ThemeVariant; mode?: 'light' | 'dark' };
  };
}

export interface WeatherConditionMapping {
  openWeatherIds: number[];
  condition: keyof WeatherThemePreset['rules'];
  icon: string;
  description: string;
}

export const weatherConditionMappings: WeatherConditionMapping[] = [
  // Clear Sky
  {
    openWeatherIds: [800],
    condition: 'sunny',
    icon: '☀️',
    description: 'Clear sky'
  },
  // Clouds
  {
    openWeatherIds: [801, 802],
    condition: 'cloudy',
    icon: '⛅',
    description: 'Few/scattered clouds'
  },
  {
    openWeatherIds: [803, 804],
    condition: 'cloudy',
    icon: '☁️',
    description: 'Broken/overcast clouds'
  },
  // Rain
  {
    openWeatherIds: [500, 501, 502, 503, 504],
    condition: 'rainy',
    icon: '🌧️',
    description: 'Rain'
  },
  {
    openWeatherIds: [300, 301, 302, 310, 311, 312, 313, 314, 321],
    condition: 'rainy',
    icon: '🌦️',
    description: 'Drizzle'
  },
  // Snow
  {
    openWeatherIds: [600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622],
    condition: 'snowy',
    icon: '🌨️',
    description: 'Snow'
  },
  // Thunderstorm
  {
    openWeatherIds: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232],
    condition: 'stormy',
    icon: '⛈️',
    description: 'Thunderstorm'
  },
  // Atmosphere (Fog, Mist, etc.)
  {
    openWeatherIds: [701, 711, 721, 731, 741, 751, 761, 762, 771, 781],
    condition: 'foggy',
    icon: '🌫️',
    description: 'Atmospheric conditions'
  }
];

export const weatherThemePresets: WeatherThemePreset[] = [
  {
    id: 'natural',
    name: 'Natural Harmony',
    description: 'Themes that match the natural feel of each weather condition',
    rules: {
      sunny: { variant: 'orange', mode: 'light' },
      cloudy: { variant: 'blue', mode: 'light' },
      rainy: { variant: 'blue', mode: 'dark' },
      snowy: { variant: 'default', mode: 'light' },
      stormy: { variant: 'red', mode: 'dark' },
      foggy: { variant: 'purple', mode: 'dark' },
      windy: { variant: 'green', mode: 'light' }
    }
  },
  {
    id: 'mood-responsive',
    name: 'Mood Responsive',
    description: 'Themes designed to boost your mood in different weather',
    rules: {
      sunny: { variant: 'orange', mode: 'light' },
      cloudy: { variant: 'purple', mode: 'light' }, // Uplift on cloudy days
      rainy: { variant: 'green', mode: 'light' }, // Calming green for rain
      snowy: { variant: 'blue', mode: 'light' }, // Cool but bright for snow
      stormy: { variant: 'orange', mode: 'light' }, // Energizing during storms
      foggy: { variant: 'pink', mode: 'light' }, // Warm pink for fog
      windy: { variant: 'red', mode: 'light' } // Energetic red for wind
    }
  },
  {
    id: 'minimalist',
    name: 'Minimalist Weather',
    description: 'Subtle theme changes that follow weather patterns',
    rules: {
      sunny: { variant: 'default', mode: 'light' },
      cloudy: { variant: 'default', mode: 'light' },
      rainy: { variant: 'blue', mode: 'dark' },
      snowy: { variant: 'default', mode: 'light' },
      stormy: { variant: 'default', mode: 'dark' },
      foggy: { variant: 'default', mode: 'dark' },
      windy: { variant: 'default', mode: 'light' }
    }
  },
  {
    id: 'vibrant',
    name: 'Vibrant Weather',
    description: 'Bold, colorful themes that celebrate each weather type',
    rules: {
      sunny: { variant: 'orange' },
      cloudy: { variant: 'purple' },
      rainy: { variant: 'blue' },
      snowy: { variant: 'default' },
      stormy: { variant: 'red' },
      foggy: { variant: 'pink' },
      windy: { variant: 'green' }
    }
  },
  {
    id: 'seasonal',
    name: 'Seasonal Colors',
    description: 'Themes that reflect seasonal feelings in weather',
    rules: {
      sunny: { variant: 'orange', mode: 'light' }, // Summer warmth
      cloudy: { variant: 'blue', mode: 'light' }, // Spring freshness
      rainy: { variant: 'green', mode: 'dark' }, // Fresh growth
      snowy: { variant: 'default', mode: 'light' }, // Winter clarity
      stormy: { variant: 'purple', mode: 'dark' }, // Dramatic autumn
      foggy: { variant: 'pink', mode: 'dark' }, // Cozy winter
      windy: { variant: 'red', mode: 'light' } // Dynamic spring
    }
  },
  {
    id: 'productivity',
    name: 'Productivity Focus',
    description: 'Themes optimized for work and focus in different weather',
    rules: {
      sunny: { variant: 'green', mode: 'light' }, // Fresh and focused
      cloudy: { variant: 'blue', mode: 'light' }, // Calm concentration
      rainy: { variant: 'purple', mode: 'dark' }, // Deep focus
      snowy: { variant: 'default', mode: 'light' }, // Clean and clear
      stormy: { variant: 'red', mode: 'dark' }, // Intense focus
      foggy: { variant: 'blue', mode: 'dark' }, // Meditative focus
      windy: { variant: 'orange', mode: 'light' } // Energetic work
    }
  }
];

export const getWeatherConditionFromId = (weatherId: number): keyof WeatherThemePreset['rules'] => {
  const mapping = weatherConditionMappings.find(m => 
    m.openWeatherIds.includes(weatherId)
  );
  return mapping?.condition || 'cloudy';
};

export const getWeatherIcon = (weatherId: number): string => {
  const mapping = weatherConditionMappings.find(m => 
    m.openWeatherIds.includes(weatherId)
  );
  return mapping?.icon || '☁️';
};

export const getWeatherDescription = (weatherId: number): string => {
  const mapping = weatherConditionMappings.find(m => 
    m.openWeatherIds.includes(weatherId)
  );
  return mapping?.description || 'Unknown weather';
};