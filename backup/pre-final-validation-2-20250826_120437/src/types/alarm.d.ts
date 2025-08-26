// Additional type definitions for Advanced Alarm Scheduler

// Helper types for geolocation
interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
  };
  timestamp: number;
}

// Location action type for location triggers
export interface LocationActionParameters {
  minutes?: number; // for adjust_time actions
  message?: string; // for notification actions
  type?: 'alert' | 'banner' | 'sound'; // for notification actions
}

// Additional utility types for the advanced scheduler
export interface AlarmUpdateData {
  time?: string;
  label?: string;
  days?: number[];
  voiceMood?: import('./_index').VoiceMood;
  sound?: string;
  difficulty?: string;
  snoozeEnabled?: boolean;
  snoozeInterval?: number;
  maxSnoozes?: number;
  battleId?: string;
  weatherEnabled?: boolean;
  isActive?: boolean;
  enabled?: boolean;
}

// Enhanced AlarmService interface with advanced scheduling methods
declare module '../services/alarm' {
  export class AlarmService {
    // Add method overload for partial updates
    static updateAlarm(
      alarmId: string,
      updates: Partial<import('./_index').Alarm>
    ): Promise<void>;

    // Add method overload for creating alarm from full Alarm object
    static createAlarm(alarm: import('./_index').Alarm): Promise<void>;
  }
}

// Global type augmentations for browser APIs
declare global {
  interface GeolocationPosition {
    coords: {
      latitude: number;
      longitude: number;
      altitude?: number;
      accuracy: number;
      altitudeAccuracy?: number;
      heading?: number;
      speed?: number;
    };
    timestamp: number;
  }
}

export {};
