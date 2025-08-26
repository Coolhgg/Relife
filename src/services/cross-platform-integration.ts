/**
 * Cross-Platform Integration Service
 * Integrates data from various external platforms to enhance AI behavior analysis
 * Supports health apps, calendar services, social media sentiment, and environmental data
 */

import type { User } from '../types';

// External platform data types
interface HealthPlatformData {
  steps: number;
  heartRate: {
    resting: number;
    current: number;
    variability: number;
  };
  sleepData: {
    duration: number;
    quality: number;
    deepSleepMinutes: number;
    remSleepMinutes: number;
    awakenings: number;
  };
  activeMinutes: number;
  caloriesBurned: number;
  hydration: number;
  stressLevel: number;
  mood: number;
  energyLevel: number;
  lastSync: Date;
}

interface CalendarPlatformData {
  upcomingEvents: Array<{
    title: string;
    startTime: Date;
    endTime: Date;
    type: 'work' | 'personal' | 'social' | 'health' | 'travel';
    location?: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
    conflictPotential: number;
  }>;
  weeklyPattern: {
    workHours: number;
    meetingDensity: number;
    travelDays: number;
    freeTime: number;
  };
  upcomingDeadlines: Array<{
    title: string;
    dueDate: Date;
    priority: number;
    stressLevel: number;
  }>;
  lastSync: Date;
}

interface WeatherPlatformData {
  current: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    uvIndex: number;
    visibility: number;
    condition: string;
    airQuality: number;
  };
  forecast: Array<{
    date: Date;
    temperature: { min: number; max: number };
    condition: string;
    precipitationChance: number;
    sunrise: Date;
    sunset: Date;
  }>;
  seasonalData: {
    daylightHours: number;
    seasonalAffectiveIndex: number;
    allergyLevel: number;
  };
  lastSync: Date;
}

interface SocialPlatformData {
  recentActivity: {
    postsCount: number;
    engagementLevel: number;
    sentimentScore: number;
    socialEnergyLevel: number;
    lastActiveTime: Date;
  };
  upcomingSocialEvents: Array<{
    title: string;
    date: Date;
    type: 'party' | 'dinner' | 'meetup' | 'family' | 'work_social';
    energyRequirement: number;
  }>;
  socialCircleActivity: {
    activeContactsToday: number;
    groupActivities: number;
    influenceScore: number;
  };
  lastSync: Date;
}

interface LocationPlatformData {
  currentLocation: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    timezone: string;
  };
  frequentLocations: Array<{
    name: string;
    type: 'home' | 'work' | 'gym' | 'social' | 'travel';
    latitude: number;
    longitude: number;
    timeSpent: number;
    lastVisit: Date;
  }>;
  travelPatterns: {
    dailyDistanceTraveled: number;
    commuteTime: number;
    isOnTrip: boolean;
    travelDisruption: number;
  };
  lastSync: Date;
}

interface ProductivityPlatformData {
  todayStats: {
    tasksCompleted: number;
    focusMinutes: number;
    distractionLevel: number;
    productivityScore: number;
  };
  weeklyTrends: {
    averageProductivity: number;
    peakHours: string[];
    lowEnergyPeriods: string[];
  };
  goalProgress: Array<{
    goal: string;
    progress: number;
    deadline: Date;
    onTrack: boolean;
  }>;
  lastSync: Date;
}

// Integration configuration
interface PlatformConfig {
  enabled: boolean;
  apiKey?: string;
  refreshToken?: string;
  lastSync?: Date;
  syncFrequency: number; // minutes
  permissions: string[];
  privacyLevel: 'basic' | 'enhanced' | 'comprehensive';
}

interface CrossPlatformData {
  health?: HealthPlatformData;
  calendar?: CalendarPlatformData;
  weather?: WeatherPlatformData;
  social?: SocialPlatformData;
  location?: LocationPlatformData;
  productivity?: ProductivityPlatformData;
  lastFullSync: Date;
  dataQuality: number;
}

export class CrossPlatformIntegration {
  private static instance: CrossPlatformIntegration;
  private platformConfigs: Map<string, Map<string, PlatformConfig>> = new Map();
  private platformData: Map<string, CrossPlatformData> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeIntegrations();
  }

  static getInstance(): CrossPlatformIntegration {
    if (!CrossPlatformIntegration.instance) {
      CrossPlatformIntegration.instance = new CrossPlatformIntegration();
    }
    return CrossPlatformIntegration.instance;
  }

  /**
   * Configure platform integration for a user
   */
  async configurePlatform(
    userId: string,
    platform: string,
    config: PlatformConfig
  ): Promise<void> {
    if (!this.platformConfigs.has(userId)) {
      this.platformConfigs.set(userId, new Map());
    }

    const userConfigs = this.platformConfigs.get(userId)!;
    userConfigs.set(platform, config);

    if (config.enabled) {
      await this.startPlatformSync(userId, platform, config);
    } else {
      this.stopPlatformSync(userId, platform);
    }

    console.log(`[CrossPlatformIntegration] Configured ${platform} for user ${userId}`);
  }

  /**
   * Get integrated cross-platform data for a user
   */
  async getCrossPlatformData(userId: string): Promise<CrossPlatformData | null> {
    const data = this.platformData.get(userId);
    if (!data) {
      // Try to sync data if no data exists
      await this.performFullSync(userId);
      return this.platformData.get(userId) || null;
    }

    return data;
  }

  /**
   * Perform manual sync for all enabled platforms for a user
   */
  async performFullSync(userId: string): Promise<CrossPlatformData> {
    const userConfigs = this.platformConfigs.get(userId);
    if (!userConfigs) {
      throw new Error(`No platform configurations found for user ${userId}`);
    }

    const crossPlatformData: CrossPlatformData = {
      lastFullSync: new Date(),
      dataQuality: 0,
    };

    let enabledPlatforms = 0;
    let successfulSyncs = 0;

    // Sync each enabled platform
    for (const [platform, config] of userConfigs) {
      if (!config.enabled) continue;

      enabledPlatforms++;
      try {
        const data = await this.syncPlatformData(platform, config, userId);
        if (data) {
          crossPlatformData[platform as keyof CrossPlatformData] = data as unknown;
          successfulSyncs++;
        }
      } catch (error) {
        console.error(`[CrossPlatformIntegration] Failed to sync ${platform}:`, error);
      }
    }

    // Calculate data quality
    crossPlatformData.dataQuality =
      enabledPlatforms > 0 ? successfulSyncs / enabledPlatforms : 0;

    this.platformData.set(userId, crossPlatformData);
    return crossPlatformData;
  }

  /**
   * Sync specific platform data
   */
  private async syncPlatformData(
    platform: string,
    config: PlatformConfig,
    userId: string
  ): Promise<unknown> {
    switch (platform) {
      case 'apple_health':
      case 'google_fit':
      case 'fitbit':
        return await this.syncHealthData(platform, config, userId);
      case 'google_calendar':
      case 'outlook':
      case 'apple_calendar':
        return await this.syncCalendarData(platform, config, userId);
      case 'weather':
        return await this.syncWeatherData(platform, config, userId);
      case 'instagram':
      case 'twitter':
      case 'facebook':
        return await this.syncSocialData(platform, config, userId);
      case 'location':
        return await this.syncLocationData(platform, config, userId);
      case 'todoist':
      case 'notion':
      case 'trello':
        return await this.syncProductivityData(platform, config, userId);
      default:
        console.warn(`[CrossPlatformIntegration] Unknown platform: ${platform}`);
        return null;
    }
  }

  /**
   * Health platform data synchronization
   */
  private async syncHealthData(
    platform: string,
    config: PlatformConfig,
    userId: string
  ): Promise<HealthPlatformData> {
    // Mock implementation - replace with actual API calls
    console.log(
      `[CrossPlatformIntegration] Syncing health data from ${platform} for user ${userId}`
    );

    // In production, this would make actual API calls to health platforms
    const mockHealthData: HealthPlatformData = {
      steps: Math.floor(Math.random() * 5000) + 8000,
      heartRate: {
        resting: Math.floor(Math.random() * 20) + 60,
        current: Math.floor(Math.random() * 40) + 70,
        variability: Math.random() * 50 + 30,
      },
      sleepData: {
        duration: Math.random() * 2 + 7, // 7-9 hours
        quality: Math.random() * 3 + 7, // 7-10 scale
        deepSleepMinutes: Math.floor(Math.random() * 60) + 90,
        remSleepMinutes: Math.floor(Math.random() * 60) + 90,
        awakenings: Math.floor(Math.random() * 3),
      },
      activeMinutes: Math.floor(Math.random() * 60) + 30,
      caloriesBurned: Math.floor(Math.random() * 500) + 2000,
      hydration: Math.random() * 2 + 6, // 6-8 glasses
      stressLevel: Math.random() * 0.6 + 0.2, // 0.2-0.8
      mood: Math.random() * 3 + 7, // 7-10 scale
      energyLevel: Math.random() * 3 + 7, // 7-10 scale
      lastSync: new Date(),
    };

    return mockHealthData;
  }

  /**
   * Calendar platform data synchronization
   */
  private async syncCalendarData(
    platform: string,
    config: PlatformConfig,
    userId: string
  ): Promise<CalendarPlatformData> {
    console.log(
      `[CrossPlatformIntegration] Syncing calendar data from ${platform} for user ${userId}`
    );

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const mockCalendarData: CalendarPlatformData = {
      upcomingEvents: [
        {
          title: 'Morning Team Meeting',
          startTime: new Date(tomorrow.setHours(9, 0)),
          endTime: new Date(tomorrow.setHours(10, 0)),
          type: 'work',
          importance: 'high',
          conflictPotential: 0.3,
        },
        {
          title: 'Lunch with Friends',
          startTime: new Date(tomorrow.setHours(12, 30)),
          endTime: new Date(tomorrow.setHours(14, 0)),
          type: 'social',
          importance: 'medium',
          conflictPotential: 0.1,
        },
      ],
      weeklyPattern: {
        workHours: Math.floor(Math.random() * 10) + 35,
        meetingDensity: Math.random() * 0.4 + 0.3,
        travelDays: Math.floor(Math.random() * 3),
        freeTime: Math.floor(Math.random() * 10) + 15,
      },
      upcomingDeadlines: [
        {
          title: 'Project Proposal',
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          priority: 0.8,
          stressLevel: 0.6,
        },
      ],
      lastSync: new Date(),
    };

    return mockCalendarData;
  }

  /**
   * Weather platform data synchronization
   */
  private async syncWeatherData(
    platform: string,
    config: PlatformConfig,
    userId: string
  ): Promise<WeatherPlatformData> {
    console.log(
      `[CrossPlatformIntegration] Syncing weather data from ${platform} for user ${userId}`
    );

    const mockWeatherData: WeatherPlatformData = {
      current: {
        temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        pressure: Math.floor(Math.random() * 50) + 1000, // 1000-1050 hPa
        windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
        uvIndex: Math.floor(Math.random() * 8) + 1, // 1-9
        visibility: Math.floor(Math.random() * 5) + 10, // 10-15 km
        condition: ['sunny', 'cloudy', 'rainy', 'partly_cloudy'][
          Math.floor(Math.random() * 4)
        ],
        airQuality: Math.floor(Math.random() * 100) + 20, // 20-120 AQI
      },
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        temperature: {
          min: Math.floor(Math.random() * 10) + 15,
          max: Math.floor(Math.random() * 15) + 25,
        },
        condition: ['sunny', 'cloudy', 'rainy', 'partly_cloudy'][
          Math.floor(Math.random() * 4)
        ],
        precipitationChance: Math.floor(Math.random() * 100),
        sunrise: new Date(Date.now() + i * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        sunset: new Date(Date.now() + i * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
      })),
      seasonalData: {
        daylightHours: Math.random() * 6 + 9, // 9-15 hours
        seasonalAffectiveIndex: Math.random() * 0.6 + 0.2, // 0.2-0.8
        allergyLevel: Math.random() * 0.8 + 0.1, // 0.1-0.9
      },
      lastSync: new Date(),
    };

    return mockWeatherData;
  }

  /**
   * Social platform data synchronization
   */
  private async syncSocialData(
    platform: string,
    config: PlatformConfig,
    userId: string
  ): Promise<SocialPlatformData> {
    console.log(
      `[CrossPlatformIntegration] Syncing social data from ${platform} for user ${userId}`
    );

    const mockSocialData: SocialPlatformData = {
      recentActivity: {
        postsCount: Math.floor(Math.random() * 5) + 1,
        engagementLevel: Math.random() * 0.6 + 0.3, // 0.3-0.9
        sentimentScore: Math.random() * 2 - 1, // -1 to 1
        socialEnergyLevel: Math.random() * 3 + 7, // 7-10
        lastActiveTime: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000),
      },
      upcomingSocialEvents: [
        {
          title: 'Birthday Party',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          type: 'party',
          energyRequirement: Math.random() * 3 + 7,
        },
      ],
      socialCircleActivity: {
        activeContactsToday: Math.floor(Math.random() * 10) + 5,
        groupActivities: Math.floor(Math.random() * 3),
        influenceScore: Math.random() * 0.5 + 0.3,
      },
      lastSync: new Date(),
    };

    return mockSocialData;
  }

  /**
   * Location platform data synchronization
   */
  private async syncLocationData(
    platform: string,
    config: PlatformConfig,
    userId: string
  ): Promise<LocationPlatformData> {
    console.log(
      `[CrossPlatformIntegration] Syncing location data from ${platform} for user ${userId}`
    );

    const mockLocationData: LocationPlatformData = {
      currentLocation: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.006 + (Math.random() - 0.5) * 0.1,
        city: 'New York',
        country: 'USA',
        timezone: 'America/New_York',
      },
      frequentLocations: [
        {
          name: 'Home',
          type: 'home',
          latitude: 40.7128,
          longitude: -74.006,
          timeSpent: Math.random() * 6 + 10, // 10-16 hours
          lastVisit: new Date(),
        },
        {
          name: 'Office',
          type: 'work',
          latitude: 40.7589,
          longitude: -73.9851,
          timeSpent: Math.random() * 2 + 8, // 8-10 hours
          lastVisit: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      ],
      travelPatterns: {
        dailyDistanceTraveled: Math.random() * 50 + 20, // 20-70 km
        commuteTime: Math.random() * 60 + 30, // 30-90 minutes
        isOnTrip: Math.random() < 0.1, // 10% chance
        travelDisruption: Math.random() * 0.3, // 0-0.3
      },
      lastSync: new Date(),
    };

    return mockLocationData;
  }

  /**
   * Productivity platform data synchronization
   */
  private async syncProductivityData(
    platform: string,
    config: PlatformConfig,
    userId: string
  ): Promise<ProductivityPlatformData> {
    console.log(
      `[CrossPlatformIntegration] Syncing productivity data from ${platform} for user ${userId}`
    );

    const mockProductivityData: ProductivityPlatformData = {
      todayStats: {
        tasksCompleted: Math.floor(Math.random() * 10) + 5,
        focusMinutes: Math.floor(Math.random() * 180) + 60,
        distractionLevel: Math.random() * 0.5 + 0.1,
        productivityScore: Math.random() * 3 + 7,
      },
      weeklyTrends: {
        averageProductivity: Math.random() * 2 + 7,
        peakHours: ['09:00-11:00', '14:00-16:00'],
        lowEnergyPeriods: ['13:00-14:00', '16:00-17:00'],
      },
      goalProgress: [
        {
          goal: 'Complete Project Alpha',
          progress: Math.random() * 0.4 + 0.6, // 60-100%
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          onTrack: Math.random() > 0.3,
        },
      ],
      lastSync: new Date(),
    };

    return mockProductivityData;
  }

  /**
   * Start automatic sync for a platform
   */
  private async startPlatformSync(
    userId: string,
    platform: string,
    config: PlatformConfig
  ): Promise<void> {
    const syncKey = `${userId}_${platform}`;

    // Clear existing interval
    const existingInterval = this.syncIntervals.get(syncKey);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Start new sync interval
    const interval = setInterval(
      async () => {
        try {
          await this.syncPlatformData(platform, config, userId);
          console.log(
            `[CrossPlatformIntegration] Auto-synced ${platform} for user ${userId}`
          );
        } catch (error) {
          console.error(
            `[CrossPlatformIntegration] Auto-sync failed for ${platform}:`,
            error
          );
        }
      },
      config.syncFrequency * 60 * 1000
    );

    this.syncIntervals.set(syncKey, interval);

    // Perform initial sync
    try {
      await this.syncPlatformData(platform, config, userId);
    } catch (error) {
      console.error(
        `[CrossPlatformIntegration] Initial sync failed for ${platform}:`,
        error
      );
    }
  }

  /**
   * Stop automatic sync for a platform
   */
  private stopPlatformSync(userId: string, platform: string): void {
    const syncKey = `${userId}_${platform}`;
    const interval = this.syncIntervals.get(syncKey);

    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(syncKey);
      console.log(
        `[CrossPlatformIntegration] Stopped sync for ${platform} (user: ${userId})`
      );
    }
  }

  /**
   * Get platform configuration for a user
   */
  getPlatformConfigs(userId: string): Map<string, PlatformConfig> | undefined {
    return this.platformConfigs.get(userId);
  }

  /**
   * Get available platforms for integration
   */
  getAvailablePlatforms(): Array<{
    id: string;
    name: string;
    category:
      | 'health'
      | 'calendar'
      | 'weather'
      | 'social'
      | 'location'
      | 'productivity';
    description: string;
    features: string[];
    privacyImpact: 'low' | 'medium' | 'high';
  }> {
    return [
      {
        id: 'apple_health',
        name: 'Apple Health',
        category: 'health',
        description: 'Sync health and fitness data from Apple Health app',
        features: ['Sleep tracking', 'Heart rate', 'Steps', 'Mood tracking'],
        privacyImpact: 'medium',
      },
      {
        id: 'google_fit',
        name: 'Google Fit',
        category: 'health',
        description: 'Integrate fitness and wellness data from Google Fit',
        features: ['Activity tracking', 'Sleep patterns', 'Heart rate monitoring'],
        privacyImpact: 'medium',
      },
      {
        id: 'google_calendar',
        name: 'Google Calendar',
        category: 'calendar',
        description: 'Sync calendar events and schedule patterns',
        features: ['Event scheduling', 'Meeting density analysis', 'Deadline tracking'],
        privacyImpact: 'high',
      },
      {
        id: 'weather',
        name: 'Weather Data',
        category: 'weather',
        description: 'Local weather conditions and forecasts',
        features: [
          'Current conditions',
          '7-day forecast',
          'Seasonal patterns',
          'Air quality',
        ],
        privacyImpact: 'low',
      },
      {
        id: 'location',
        name: 'Location Services',
        category: 'location',
        description: 'Location-based insights and travel patterns',
        features: ['Frequent locations', 'Travel patterns', 'Commute analysis'],
        privacyImpact: 'high',
      },
      {
        id: 'todoist',
        name: 'Todoist',
        category: 'productivity',
        description: 'Task management and productivity insights',
        features: ['Task completion', 'Productivity trends', 'Goal tracking'],
        privacyImpact: 'medium',
      },
    ];
  }

  /**
   * Initialize integration system
   */
  private initializeIntegrations(): void {
    console.log(
      '[CrossPlatformIntegration] Initializing cross-platform integration service...'
    );

    // Set up cleanup for intervals on app close
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Clean up all sync intervals
   */
  private cleanup(): void {
    this.syncIntervals.forEach(interval => {
      clearInterval(interval);
    });
    this.syncIntervals.clear();
    console.log('[CrossPlatformIntegration] Cleaned up all sync intervals');
  }

  /**
   * Generate privacy-compliant data summary
   */
  generatePrivacySummary(userId: string): {
    platforms: number;
    dataTypes: string[];
    lastSync: Date | null;
    privacyScore: number;
  } {
    const userConfigs = this.platformConfigs.get(userId);
    const userData = this.platformData.get(userId);

    if (!userConfigs) {
      return {
        platforms: 0,
        dataTypes: [],
        lastSync: null,
        privacyScore: 1.0,
      };
    }

    const enabledPlatforms = Array.from(userConfigs.values()).filter(c => c.enabled);
    const dataTypes: Set<string> = new Set();
    let totalPrivacyImpact = 0;

    enabledPlatforms.forEach(config => {
      config.permissions.forEach(permission => dataTypes.add(permission));

      // Calculate privacy impact
      switch (config.privacyLevel) {
        case 'basic':
          totalPrivacyImpact += 0.3;
          break;
        case 'enhanced':
          totalPrivacyImpact += 0.6;
          break;
        case 'comprehensive':
          totalPrivacyImpact += 1.0;
          break;
      }
    });

    const privacyScore = Math.max(0, 1 - totalPrivacyImpact / enabledPlatforms.length);

    return {
      platforms: enabledPlatforms.length,
      dataTypes: Array.from(dataTypes),
      lastSync: userData?.lastFullSync || null,
      privacyScore,
    };
  }
}

export default CrossPlatformIntegration;
