import type { Location, LocationTrigger, AdvancedAlarm } from '../types/index';
import { Geolocation, GeolocationPosition } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { scheduleLocalNotification } from './capacitor';

const LOCATION_CONFIG_KEY = 'enhanced_location_config';
const GEOFENCES_KEY = 'active_geofences';
const LOCATION_HISTORY_KEY = 'location_history';

interface LocationConfig {
  enabled: boolean;
  highAccuracy: boolean;
  trackingInterval: number; // minutes
  geofenceRadius: number; // meters
  maxLocationHistory: number;
  batteryOptimization: boolean;
}

interface Geofence {
  id: string;
  name: string;
  location: Location;
  radius: number;
  triggers: GeofenceTrigger[];
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

interface GeofenceTrigger {
  type: 'enter' | 'exit' | 'dwell';
  action: 'enable_alarm' | 'disable_alarm' | 'adjust_time' | 'notify';
  alarmIds: string[];
  parameters: Record<string, any>;
  dwellTime?: number; // minutes for dwell triggers
}

interface LocationHistoryPoint {
  location: Location;
  timestamp: Date;
  accuracy: number;
  activity?: 'stationary' | 'walking' | 'driving' | 'unknown';
}

interface LocationPattern {
  id: string;
  name: string;
  location: Location;
  radius: number;
  visits: number;
  averageDwellTime: number; // minutes
  timePatterns: Record<string, number>; // hour of day -> frequency
  dayPatterns: Record<string, number>; // day of week -> frequency
  confidence: number;
  type: 'home' | 'work' | 'gym' | 'shopping' | 'social' | 'other';
}

export class EnhancedLocationService {
  private static config: LocationConfig = {
    enabled: false,
    highAccuracy: true,
    trackingInterval: 15,
    geofenceRadius: 100,
    maxLocationHistory: 1000,
    batteryOptimization: true
  };

  private static geofences: Map<string, Geofence> = new Map();
  private static locationHistory: LocationHistoryPoint[] = [];
  private static locationPatterns: Map<string, LocationPattern> = new Map();
  private static trackingInterval: number | null = null;
  private static lastKnownPosition: GeolocationPosition | null = null;

  // ===== INITIALIZATION =====

  static async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      await this.loadGeofences();
      await this.loadLocationHistory();
      await this.analyzeLocationPatterns();

      if (this.config.enabled) {
        await this.startLocationTracking();
      }
    } catch (error) {
      console.error('Failed to initialize Enhanced Location Service:', error);
    }
  }

  private static async loadConfig(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: LOCATION_CONFIG_KEY });
      if (value) {
        this.config = { ...this.config, ...JSON.parse(value) };
      }
    } catch (error) {
      console.error('Error loading location config:', error);
    }
  }

  private static async loadGeofences(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: GEOFENCES_KEY });
      if (value) {
        const data = JSON.parse(value);
        this.geofences = new Map(Object.entries(data).map(([k, v]) => [k, {
          ...v as any,
          createdAt: new Date((v as any).createdAt),
          lastTriggered: (v as any).lastTriggered ? new Date((v as any).lastTriggered) : undefined
        }]));
      }
    } catch (error) {
      console.error('Error loading geofences:', error);
    }
  }

  private static async loadLocationHistory(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: LOCATION_HISTORY_KEY });
      if (value) {
        const data = JSON.parse(value);
        this.locationHistory = data.map((point: any) => ({
          ...point,
          timestamp: new Date(point.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading location history:', error);
    }
  }

  // ===== LOCATION TRACKING =====

  static async startLocationTracking(): Promise<void> {
    try {
      // Request permissions
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== 'granted') {
        throw new Error('Location permissions not granted');
      }

      // Start periodic tracking
      this.trackingInterval = setInterval(async () => {
        try {
          await this.updateCurrentLocation();
        } catch (error) {
          console.error('Error updating location:', error);
        }
      }, this.config.trackingInterval * 60 * 1000) as unknown as number;

      // Get initial position
      await this.updateCurrentLocation();

      console.log('Location tracking started');
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      throw error;
    }
  }

  static async stopLocationTracking(): Promise<void> {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    console.log('Location tracking stopped');
  }

  private static async updateCurrentLocation(): Promise<void> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: this.config.highAccuracy,
        timeout: 10000,
        maximumAge: this.config.batteryOptimization ? 300000 : 60000 // 5min or 1min
      });

      this.lastKnownPosition = position;

      // Add to history
      const historyPoint: LocationHistoryPoint = {
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        },
        timestamp: new Date(),
        accuracy: position.coords.accuracy || 0,
        activity: await this.detectActivity(position)
      };

      this.locationHistory.push(historyPoint);

      // Maintain history size limit
      if (this.locationHistory.length > this.config.maxLocationHistory) {
        this.locationHistory = this.locationHistory.slice(-this.config.maxLocationHistory);
      }

      // Check geofences
      await this.checkGeofences(historyPoint.location);

      // Update patterns periodically
      if (this.locationHistory.length % 10 === 0) {
        await this.analyzeLocationPatterns();
      }

      // Save history
      await this.saveLocationHistory();

    } catch (error) {
      console.error('Error updating current location:', error);
    }
  }

  // ===== GEOFENCING =====

  static async createGeofence(
    name: string,
    location: Location,
    radius: number,
    triggers: GeofenceTrigger[]
  ): Promise<string> {
    try {
      const geofence: Geofence = {
        id: this.generateGeofenceId(),
        name,
        location,
        radius,
        triggers,
        isActive: true,
        createdAt: new Date()
      };

      this.geofences.set(geofence.id, geofence);
      await this.saveGeofences();

      console.log(`Geofence "${name}" created at ${location.latitude}, ${location.longitude}`);
      return geofence.id;

    } catch (error) {
      console.error('Error creating geofence:', error);
      throw error;
    }
  }

  static async updateGeofence(
    geofenceId: string,
    updates: Partial<Omit<Geofence, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const geofence = this.geofences.get(geofenceId);
      if (!geofence) {
        throw new Error('Geofence not found');
      }

      Object.assign(geofence, updates);
      await this.saveGeofences();

    } catch (error) {
      console.error('Error updating geofence:', error);
      throw error;
    }
  }

  static async deleteGeofence(geofenceId: string): Promise<void> {
    try {
      this.geofences.delete(geofenceId);
      await this.saveGeofences();
      console.log(`Geofence ${geofenceId} deleted`);
    } catch (error) {
      console.error('Error deleting geofence:', error);
      throw error;
    }
  }

  private static async checkGeofences(currentLocation: Location): Promise<void> {
    for (const [id, geofence] of this.geofences) {
      if (!geofence.isActive) continue;

      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        geofence.location.latitude,
        geofence.location.longitude
      );

      const isInside = distance <= geofence.radius;
      const wasInside = await this.wasInsideGeofence(id);

      // Detect enter/exit events
      if (isInside && !wasInside) {
        await this.handleGeofenceEvent(geofence, 'enter');
      } else if (!isInside && wasInside) {
        await this.handleGeofenceEvent(geofence, 'exit');
      }

      // Check dwell triggers
      if (isInside) {
        await this.checkDwellTriggers(geofence);
      }

      // Update state
      await this.setGeofenceState(id, isInside);
    }
  }

  private static async handleGeofenceEvent(geofence: Geofence, eventType: 'enter' | 'exit'): Promise<void> {
    try {
      const relevantTriggers = geofence.triggers.filter(t => t.type === eventType);

      for (const trigger of relevantTriggers) {
        await this.executeGeofenceTrigger(geofence, trigger);
      }

      geofence.lastTriggered = new Date();
      await this.saveGeofences();

      console.log(`Geofence "${geofence.name}" ${eventType} event triggered`);

    } catch (error) {
      console.error(`Error handling geofence ${eventType} event:`, error);
    }
  }

  private static async executeGeofenceTrigger(geofence: Geofence, trigger: GeofenceTrigger): Promise<void> {
    try {
      switch (trigger.action) {
        case 'enable_alarm':
          await this.toggleAlarms(trigger.alarmIds, true);
          break;

        case 'disable_alarm':
          await this.toggleAlarms(trigger.alarmIds, false);
          break;

        case 'adjust_time':
          await this.adjustAlarmTimes(trigger.alarmIds, trigger.parameters);
          break;

        case 'notify':
          await this.sendLocationNotification(geofence, trigger);
          break;
      }
    } catch (error) {
      console.error('Error executing geofence trigger:', error);
    }
  }

  private static async toggleAlarms(alarmIds: string[], enabled: boolean): Promise<void> {
    // This would integrate with the AlarmService
    for (const alarmId of alarmIds) {
      try {
        // AlarmService.toggleAlarm(alarmId, enabled);
        console.log(`${enabled ? 'Enabled' : 'Disabled'} alarm ${alarmId} due to location trigger`);
      } catch (error) {
        console.error(`Error toggling alarm ${alarmId}:`, error);
      }
    }
  }

  private static async adjustAlarmTimes(alarmIds: string[], parameters: Record<string, any>): Promise<void> {
    const adjustMinutes = parameters.adjustMinutes || 0;

    for (const alarmId of alarmIds) {
      try {
        // Implement alarm time adjustment logic
        console.log(`Adjusting alarm ${alarmId} by ${adjustMinutes} minutes due to location`);
      } catch (error) {
        console.error(`Error adjusting alarm time for ${alarmId}:`, error);
      }
    }
  }

  private static async sendLocationNotification(geofence: Geofence, trigger: GeofenceTrigger): Promise<void> {
    try {
      await scheduleLocalNotification({
        id: Date.now(),
        title: trigger.parameters.title || `Location: ${geofence.name}`,
        body: trigger.parameters.message || `You have ${trigger.type === 'enter' ? 'entered' : 'exited'} ${geofence.name}`,
        schedule: new Date()
      });
    } catch (error) {
      console.error('Error sending location notification:', error);
    }
  }

  // ===== LOCATION PATTERNS & ANALYSIS =====

  private static async analyzeLocationPatterns(): Promise<void> {
    try {
      if (this.locationHistory.length < 10) return; // Need minimum data

      const clusters = this.clusterLocations(this.locationHistory);

      for (const cluster of clusters) {
        const pattern = this.createLocationPattern(cluster);
        if (pattern.confidence > 0.5) {
          this.locationPatterns.set(pattern.id, pattern);
        }
      }

      await this.saveLocationPatterns();
      console.log(`Analyzed ${clusters.length} location clusters, ${this.locationPatterns.size} patterns identified`);

    } catch (error) {
      console.error('Error analyzing location patterns:', error);
    }
  }

  private static clusterLocations(history: LocationHistoryPoint[]): LocationHistoryPoint[][] {
    const clusters: LocationHistoryPoint[][] = [];
    const visited = new Set<number>();
    const clusterRadius = 200; // 200 meters

    for (let i = 0; i < history.length; i++) {
      if (visited.has(i)) continue;

      const cluster: LocationHistoryPoint[] = [history[i]];
      visited.add(i);

      for (let j = i + 1; j < history.length; j++) {
        if (visited.has(j)) continue;

        const distance = this.calculateDistance(
          history[i].location.latitude,
          history[i].location.longitude,
          history[j].location.latitude,
          history[j].location.longitude
        );

        if (distance <= clusterRadius) {
          cluster.push(history[j]);
          visited.add(j);
        }
      }

      if (cluster.length >= 5) { // Minimum visits to be considered a pattern
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  private static createLocationPattern(cluster: LocationHistoryPoint[]): LocationPattern {
    // Calculate cluster center
    const centerLat = cluster.reduce((sum, p) => sum + p.location.latitude, 0) / cluster.length;
    const centerLon = cluster.reduce((sum, p) => sum + p.location.longitude, 0) / cluster.length;

    // Calculate average radius
    const avgRadius = cluster.reduce((sum, p) => {
      return sum + this.calculateDistance(centerLat, centerLon, p.location.latitude, p.location.longitude);
    }, 0) / cluster.length;

    // Analyze time patterns
    const timePatterns: Record<string, number> = {};
    const dayPatterns: Record<string, number> = {};

    for (const point of cluster) {
      const hour = point.timestamp.getHours().toString();
      const day = point.timestamp.getDay().toString();

      timePatterns[hour] = (timePatterns[hour] || 0) + 1;
      dayPatterns[day] = (dayPatterns[day] || 0) + 1;
    }

    // Determine location type based on patterns
    const type = this.classifyLocationType(timePatterns, dayPatterns, cluster.length);

    return {
      id: this.generatePatternId(),
      name: this.generateLocationName(type, centerLat, centerLon),
      location: { latitude: centerLat, longitude: centerLon },
      radius: Math.max(avgRadius, 50), // Minimum 50m radius
      visits: cluster.length,
      averageDwellTime: this.calculateAverageDwellTime(cluster),
      timePatterns,
      dayPatterns,
      confidence: Math.min(0.95, cluster.length / 20), // More visits = higher confidence
      type
    };
  }

  private static classifyLocationType(
    timePatterns: Record<string, number>,
    dayPatterns: Record<string, number>,
    visits: number
  ): LocationPattern['type'] {
    const totalVisits = visits;

    // Check for home patterns (evening/night visits, consistent across days)
    const eveningNightVisits = Object.entries(timePatterns)
      .filter(([hour]) => parseInt(hour) >= 18 || parseInt(hour) <= 7)
      .reduce((sum, [, count]) => sum + count, 0);

    if (eveningNightVisits / totalVisits > 0.6) {
      return 'home';
    }

    // Check for work patterns (business hours, weekdays)
    const businessHourVisits = Object.entries(timePatterns)
      .filter(([hour]) => parseInt(hour) >= 9 && parseInt(hour) <= 17)
      .reduce((sum, [, count]) => sum + count, 0);

    const weekdayVisits = Object.entries(dayPatterns)
      .filter(([day]) => parseInt(day) >= 1 && parseInt(day) <= 5)
      .reduce((sum, [, count]) => sum + count, 0);

    if (businessHourVisits / totalVisits > 0.5 && weekdayVisits / totalVisits > 0.7) {
      return 'work';
    }

    // Check for gym patterns (early morning or evening, regular schedule)
    const gymHours = Object.entries(timePatterns)
      .filter(([hour]) => (parseInt(hour) >= 6 && parseInt(hour) <= 9) || (parseInt(hour) >= 17 && parseInt(hour) <= 21))
      .reduce((sum, [, count]) => sum + count, 0);

    if (gymHours / totalVisits > 0.8 && this.calculateScheduleRegularity(dayPatterns) > 0.7) {
      return 'gym';
    }

    // Default to other
    return 'other';
  }

  private static calculateScheduleRegularity(dayPatterns: Record<string, number>): number {
    const values = Object.values(dayPatterns);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return 1 - (Math.sqrt(variance) / mean); // Lower variance = higher regularity
  }

  private static generateLocationName(type: LocationPattern['type'], lat: number, lon: number): string {
    const shortLat = lat.toFixed(3);
    const shortLon = lon.toFixed(3);

    switch (type) {
      case 'home': return `Home (${shortLat}, ${shortLon})`;
      case 'work': return `Work (${shortLat}, ${shortLon})`;
      case 'gym': return `Gym (${shortLat}, ${shortLon})`;
      default: return `Location (${shortLat}, ${shortLon})`;
    }
  }

  private static calculateAverageDwellTime(cluster: LocationHistoryPoint[]): number {
    // Simple dwell time calculation based on consecutive visits
    let totalDwellTime = 0;
    let dwellSessions = 0;

    const sortedCluster = cluster.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let sessionStart = sortedCluster[0].timestamp;
    let lastVisit = sortedCluster[0].timestamp;

    for (let i = 1; i < sortedCluster.length; i++) {
      const current = sortedCluster[i].timestamp;
      const timeDiff = current.getTime() - lastVisit.getTime();

      if (timeDiff > 60 * 60 * 1000) { // Gap > 1 hour = new session
        totalDwellTime += lastVisit.getTime() - sessionStart.getTime();
        dwellSessions++;
        sessionStart = current;
      }
      lastVisit = current;
    }

    // Add final session
    if (dwellSessions === 0 || lastVisit.getTime() > sessionStart.getTime()) {
      totalDwellTime += lastVisit.getTime() - sessionStart.getTime();
      dwellSessions++;
    }

    return dwellSessions > 0 ? totalDwellTime / dwellSessions / (1000 * 60) : 0; // Return in minutes
  }

  // ===== LOCATION-BASED ALARM OPTIMIZATION =====

  static async getLocationBasedRecommendations(alarm: AdvancedAlarm): Promise<string[]> {
    const recommendations: string[] = [];

    try {
      const currentPosition = await this.getCurrentPosition();
      if (!currentPosition) return recommendations;

      // Check if user is at a known pattern location
      const currentPattern = this.findMatchingPattern(currentPosition.location);

      if (currentPattern) {
        switch (currentPattern.type) {
          case 'home':
            if (alarm.time < '06:00') {
              recommendations.push('You\'re at home - consider a gentler wake-up routine for early mornings');
            }
            break;

          case 'work':
            recommendations.push('Work location detected - ensure commute time is factored into your alarm');
            break;

          case 'gym':
            recommendations.push('Gym location - consider adjusting alarm for post-workout recovery time');
            break;
        }
      }

      // Check distance from home
      const homePattern = Array.from(this.locationPatterns.values()).find(p => p.type === 'home');
      if (homePattern && currentPosition) {
        const distanceFromHome = this.calculateDistance(
          currentPosition.location.latitude,
          currentPosition.location.longitude,
          homePattern.location.latitude,
          homePattern.location.longitude
        );

        if (distanceFromHome > 5) { // More than 5km from home
          recommendations.push(`You're ${distanceFromHome.toFixed(1)}km from home - consider travel time adjustment`);
        }
      }

    } catch (error) {
      console.error('Error getting location-based recommendations:', error);
    }

    return recommendations;
  }

  private static findMatchingPattern(location: Location): LocationPattern | null {
    for (const pattern of this.locationPatterns.values()) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        pattern.location.latitude,
        pattern.location.longitude
      );

      if (distance <= pattern.radius) {
        return pattern;
      }
    }
    return null;
  }

  // ===== UTILITY METHODS =====

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static generateGeofenceId(): string {
    return 'geofence_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private static generatePatternId(): string {
    return 'pattern_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private static async detectActivity(position: GeolocationPosition): Promise<LocationHistoryPoint['activity']> {
    // Simple activity detection based on speed and accuracy
    if (position.coords.speed) {
      if (position.coords.speed > 10) return 'driving';
      if (position.coords.speed > 1) return 'walking';
    }
    return 'stationary';
  }

  // ===== STORAGE METHODS =====

  private static async saveGeofences(): Promise<void> {
    try {
      const dataObject = Object.fromEntries(this.geofences);
      await Preferences.set({
        key: GEOFENCES_KEY,
        value: JSON.stringify(dataObject)
      });
    } catch (error) {
      console.error('Error saving geofences:', error);
    }
  }

  private static async saveLocationHistory(): Promise<void> {
    try {
      await Preferences.set({
        key: LOCATION_HISTORY_KEY,
        value: JSON.stringify(this.locationHistory)
      });
    } catch (error) {
      console.error('Error saving location history:', error);
    }
  }

  private static async saveLocationPatterns(): Promise<void> {
    try {
      const dataObject = Object.fromEntries(this.locationPatterns);
      await Preferences.set({
        key: 'location_patterns',
        value: JSON.stringify(dataObject)
      });
    } catch (error) {
      console.error('Error saving location patterns:', error);
    }
  }

  // ===== STATE MANAGEMENT =====

  private static async wasInsideGeofence(geofenceId: string): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: `geofence_state_${geofenceId}` });
      return value === 'inside';
    } catch {
      return false;
    }
  }

  private static async setGeofenceState(geofenceId: string, inside: boolean): Promise<void> {
    try {
      await Preferences.set({
        key: `geofence_state_${geofenceId}`,
        value: inside ? 'inside' : 'outside'
      });
    } catch (error) {
      console.error('Error setting geofence state:', error);
    }
  }

  private static async checkDwellTriggers(geofence: Geofence): Promise<void> {
    const dwellTriggers = geofence.triggers.filter(t => t.type === 'dwell');
    if (dwellTriggers.length === 0) return;

    for (const trigger of dwellTriggers) {
      const dwellTime = trigger.dwellTime || 15; // Default 15 minutes
      const dwellStart = await this.getGeofenceDwellStart(geofence.id);

      if (dwellStart) {
        const dwellDuration = (Date.now() - dwellStart.getTime()) / (1000 * 60); // minutes

        if (dwellDuration >= dwellTime) {
          await this.executeGeofenceTrigger(geofence, trigger);
          await this.resetGeofenceDwellStart(geofence.id); // Prevent repeated triggers
        }
      } else {
        await this.setGeofenceDwellStart(geofence.id, new Date());
      }
    }
  }

  private static async getGeofenceDwellStart(geofenceId: string): Promise<Date | null> {
    try {
      const { value } = await Preferences.get({ key: `geofence_dwell_${geofenceId}` });
      return value ? new Date(value) : null;
    } catch {
      return null;
    }
  }

  private static async setGeofenceDwellStart(geofenceId: string, time: Date): Promise<void> {
    try {
      await Preferences.set({
        key: `geofence_dwell_${geofenceId}`,
        value: time.toISOString()
      });
    } catch (error) {
      console.error('Error setting geofence dwell start:', error);
    }
  }

  private static async resetGeofenceDwellStart(geofenceId: string): Promise<void> {
    try {
      await Preferences.remove({ key: `geofence_dwell_${geofenceId}` });
    } catch (error) {
      console.error('Error resetting geofence dwell start:', error);
    }
  }

  // ===== PUBLIC API =====

  static async enableLocationServices(enabled: boolean): Promise<void> {
    this.config.enabled = enabled;

    if (enabled) {
      await this.startLocationTracking();
    } else {
      await this.stopLocationTracking();
    }

    await Preferences.set({
      key: LOCATION_CONFIG_KEY,
      value: JSON.stringify(this.config)
    });
  }

  static async getCurrentPosition(): Promise<{ location: Location; accuracy: number } | null> {
    try {
      if (this.lastKnownPosition) {
        return {
          location: {
            latitude: this.lastKnownPosition.coords.latitude,
            longitude: this.lastKnownPosition.coords.longitude
          },
          accuracy: this.lastKnownPosition.coords.accuracy || 0
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }

  static getLocationPatterns(): LocationPattern[] {
    return Array.from(this.locationPatterns.values());
  }

  static getGeofences(): Geofence[] {
    return Array.from(this.geofences.values());
  }

  static getLocationStats(): {
    patterns: number;
    geofences: number;
    historyPoints: number;
    isTracking: boolean;
  } {
    return {
      patterns: this.locationPatterns.size,
      geofences: this.geofences.size,
      historyPoints: this.locationHistory.length,
      isTracking: this.trackingInterval !== null
    };
  }

  static isLocationEnabled(): boolean {
    return this.config.enabled;
  }
}

export default EnhancedLocationService;