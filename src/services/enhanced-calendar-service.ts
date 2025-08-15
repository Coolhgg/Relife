import type { AdvancedAlarm, CalendarIntegration } from '../types';

/**
 * Enhanced Calendar Integration Service
 * 
 * Features:
 * - Smart scheduling with calendar conflict detection
 * - Automatic alarm adjustments based on meetings
 * - Travel time calculations for early meetings
 * - Work schedule integration
 * - Meeting preparation time inclusion
 * - Holiday and special event handling
 * - Multi-calendar support (Google, Outlook, Apple)
 * - Intelligent meeting categorization
 */

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  importance: 'low' | 'normal' | 'high' | 'urgent';
  category: 'work' | 'personal' | 'health' | 'travel' | 'social' | 'other';
  calendarId: string;
  recurrence?: {
    rule: string;
    exceptions?: Date[];
  };
  reminders?: Array<{
    method: 'email' | 'popup' | 'notification';
    minutes: number;
  }>;
  travelTime?: {
    origin?: string;
    destination?: string;
    durationMinutes: number;
    mode: 'driving' | 'walking' | 'transit' | 'cycling';
  };
}

export interface CalendarConfig {
  enabled: boolean;
  connectedCalendars: Array<{
    id: string;
    name: string;
    type: 'google' | 'outlook' | 'apple' | 'caldav';
    email: string;
    isDefault: boolean;
    syncEnabled: boolean;
    color: string;
  }>;
  conflictDetection: {
    enabled: boolean;
    lookAheadDays: number;
    minimumGapMinutes: number;
    considerTravelTime: boolean;
    skipWeekends: boolean;
  };
  autoAdjustments: {
    enabled: boolean;
    maxAdjustmentMinutes: number;
    earlyMeetingThreshold: string; // HH:mm
    preparationTimeMinutes: number;
    travelTimeBuffer: number; // percentage
  };
  workSchedule: {
    enabled: boolean;
    workDays: number[]; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    lunchBreak?: {
      start: string;
      end: string;
    };
    timeZone: string;
  };
  smartSuggestions: {
    enabled: boolean;
    suggestOptimalWakeTime: boolean;
    considerMeetingImportance: boolean;
    factorInCommute: boolean;
    includePreparationTime: boolean;
  };
}

export interface CalendarSuggestion {
  type: 'adjustment' | 'preparation' | 'travel' | 'conflict' | 'optimization';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  suggestedTime?: string;
  originalTime: string;
  adjustmentMinutes: number;
  confidence: number;
  reasoning: string[];
  affectedEvents: CalendarEvent[];
  actionRequired: boolean;
}

export interface CalendarInsight {
  id: string;
  type: 'pattern' | 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  timeframe: 'daily' | 'weekly' | 'monthly';
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  data: any;
  suggestions: string[];
  createdAt: Date;
}

class EnhancedCalendarService {
  private static instance: EnhancedCalendarService;
  private isInitialized = false;
  private config: CalendarConfig;
  private cachedEvents: Map<string, CalendarEvent[]> = new Map();
  private eventPatterns: Map<string, any> = new Map();
  private suggestions: CalendarSuggestion[] = [];
  private insights: CalendarInsight[] = [];
  private lastSyncTime: Date | null = null;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): EnhancedCalendarService {
    if (!EnhancedCalendarService.instance) {
      EnhancedCalendarService.instance = new EnhancedCalendarService();
    }
    return EnhancedCalendarService.instance;
  }

  /**
   * Initialize the calendar service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load saved configuration
      await this.loadConfiguration();

      // Initialize calendar APIs
      if (this.config.enabled) {
        await this.initializeCalendarAPIs();
        await this.syncCalendarEvents();
        await this.analyzeEventPatterns();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize EnhancedCalendarService:', error);
      throw error;
    }
  }

  /**
   * Sync events from all connected calendars
   */
  public async syncCalendarEvents(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + this.config.conflictDetection.lookAheadDays * 24 * 60 * 60 * 1000);

      for (const calendar of this.config.connectedCalendars) {
        if (calendar.syncEnabled) {
          const events = await this.fetchCalendarEvents(calendar, now, endDate);
          this.cachedEvents.set(calendar.id, events);
        }
      }

      this.lastSyncTime = new Date();
      await this.saveCachedEvents();

    } catch (error) {
      console.error('Failed to sync calendar events:', error);
    }
  }

  /**
   * Get smart alarm suggestions based on calendar events
   */
  public async getSmartAlarmSuggestions(alarm: AdvancedAlarm): Promise<CalendarSuggestion[]> {
    if (!this.config.enabled || !this.config.smartSuggestions.enabled) {
      return [];
    }

    const suggestions: CalendarSuggestion[] = [];
    const alarmTime = this.parseTimeString(alarm.time);
    const alarmDate = new Date();
    alarmDate.setHours(alarmTime.hours, alarmTime.minutes, 0, 0);

    // Check for conflicts and early meetings
    const conflicts = await this.detectConflicts(alarm, alarmDate);
    suggestions.push(...conflicts);

    // Suggest optimal wake time based on first meeting
    if (this.config.smartSuggestions.suggestOptimalWakeTime) {
      const optimalSuggestion = await this.suggestOptimalWakeTime(alarm, alarmDate);
      if (optimalSuggestion) {
        suggestions.push(optimalSuggestion);
      }
    }

    // Consider commute and preparation time
    if (this.config.smartSuggestions.factorInCommute) {
      const commuteSuggestion = await this.suggestCommuteAdjustment(alarm, alarmDate);
      if (commuteSuggestion) {
        suggestions.push(commuteSuggestion);
      }
    }

    // Include preparation time for important meetings
    if (this.config.smartSuggestions.includePreparationTime) {
      const prepSuggestion = await this.suggestPreparationTime(alarm, alarmDate);
      if (prepSuggestion) {
        suggestions.push(prepSuggestion);
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Detect scheduling conflicts
   */
  private async detectConflicts(alarm: AdvancedAlarm, alarmDate: Date): Promise<CalendarSuggestion[]> {
    const suggestions: CalendarSuggestion[] = [];
    const allEvents = this.getAllEvents();

    // Check for early morning meetings
    const earlyThreshold = this.parseTimeString(this.config.autoAdjustments.earlyMeetingThreshold);
    const earlyMeetings = allEvents.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart.getHours() < earlyThreshold.hours || 
             (eventStart.getHours() === earlyThreshold.hours && eventStart.getMinutes() < earlyThreshold.minutes);
    });

    for (const meeting of earlyMeetings) {
      const meetingStart = new Date(meeting.start);
      const requiredWakeTime = new Date(meetingStart.getTime() - this.config.autoAdjustments.preparationTimeMinutes * 60 * 1000);
      
      if (meeting.travelTime) {
        requiredWakeTime.setTime(requiredWakeTime.getTime() - meeting.travelTime.durationMinutes * 60 * 1000 * (1 + this.config.autoAdjustments.travelTimeBuffer / 100));
      }

      if (requiredWakeTime < alarmDate) {
        const adjustmentMinutes = Math.round((alarmDate.getTime() - requiredWakeTime.getTime()) / 60000);
        
        suggestions.push({
          type: 'adjustment',
          priority: meeting.importance === 'urgent' ? 'urgent' : 'high',
          title: 'Early Meeting Detected',
          description: `You have an early meeting "${meeting.title}" that requires an earlier wake time`,
          suggestedTime: `${requiredWakeTime.getHours().toString().padStart(2, '0')}:${requiredWakeTime.getMinutes().toString().padStart(2, '0')}`,
          originalTime: alarm.time,
          adjustmentMinutes: -adjustmentMinutes,
          confidence: 0.9,
          reasoning: [
            `Meeting "${meeting.title}" starts at ${meetingStart.toLocaleTimeString()}`,
            `Requires ${this.config.autoAdjustments.preparationTimeMinutes} minutes preparation time`,
            meeting.travelTime ? `Travel time: ${meeting.travelTime.durationMinutes} minutes` : ''
          ].filter(Boolean),
          affectedEvents: [meeting],
          actionRequired: true
        });
      }
    }

    return suggestions;
  }

  /**
   * Suggest optimal wake time based on calendar
   */
  private async suggestOptimalWakeTime(alarm: AdvancedAlarm, alarmDate: Date): Promise<CalendarSuggestion | null> {
    const allEvents = this.getAllEvents();
    const todayEvents = allEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === alarmDate.toDateString();
    });

    if (todayEvents.length === 0) {
      return null;
    }

    // Find the first important meeting
    const firstImportantMeeting = todayEvents
      .filter(event => event.importance !== 'low')
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];

    if (!firstImportantMeeting) {
      return null;
    }

    const meetingStart = new Date(firstImportantMeeting.start);
    const bufferTime = this.config.autoAdjustments.preparationTimeMinutes;
    const travelTime = firstImportantMeeting.travelTime?.durationMinutes || 0;
    
    const optimalWakeTime = new Date(meetingStart.getTime() - (bufferTime + travelTime) * 60 * 1000);
    const currentWakeTime = this.parseTimeString(alarm.time);
    const currentWakeDate = new Date(alarmDate);
    currentWakeDate.setHours(currentWakeTime.hours, currentWakeTime.minutes, 0, 0);

    const adjustmentMinutes = Math.round((optimalWakeTime.getTime() - currentWakeDate.getTime()) / 60000);

    if (Math.abs(adjustmentMinutes) >= 15) { // Only suggest if adjustment is significant
      return {
        type: 'optimization',
        priority: 'medium',
        title: 'Optimal Wake Time Suggestion',
        description: `Based on your calendar, waking up at this time would be more optimal`,
        suggestedTime: `${optimalWakeTime.getHours().toString().padStart(2, '0')}:${optimalWakeTime.getMinutes().toString().padStart(2, '0')}`,
        originalTime: alarm.time,
        adjustmentMinutes,
        confidence: 0.8,
        reasoning: [
          `First important meeting: "${firstImportantMeeting.title}" at ${meetingStart.toLocaleTimeString()}`,
          `Includes ${bufferTime} minutes preparation time`,
          travelTime > 0 ? `Includes ${travelTime} minutes travel time` : ''
        ].filter(Boolean),
        affectedEvents: [firstImportantMeeting],
        actionRequired: false
      };
    }

    return null;
  }

  /**
   * Suggest commute-based adjustments
   */
  private async suggestCommuteAdjustment(alarm: AdvancedAlarm, alarmDate: Date): Promise<CalendarSuggestion | null> {
    const allEvents = this.getAllEvents();
    const workEvents = allEvents.filter(event => 
      event.category === 'work' && 
      event.location && 
      event.location !== 'Home' &&
      new Date(event.start).toDateString() === alarmDate.toDateString()
    );

    if (workEvents.length === 0) {
      return null;
    }

    const firstWorkEvent = workEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
    
    if (firstWorkEvent.travelTime) {
      const arrivalTime = new Date(firstWorkEvent.start);
      const departureTime = new Date(arrivalTime.getTime() - firstWorkEvent.travelTime.durationMinutes * 60 * 1000);
      const wakeUpTime = new Date(departureTime.getTime() - this.config.autoAdjustments.preparationTimeMinutes * 60 * 1000);

      const currentWakeTime = this.parseTimeString(alarm.time);
      const currentWakeDate = new Date(alarmDate);
      currentWakeDate.setHours(currentWakeTime.hours, currentWakeTime.minutes, 0, 0);

      const adjustmentMinutes = Math.round((wakeUpTime.getTime() - currentWakeDate.getTime()) / 60000);

      if (Math.abs(adjustmentMinutes) >= 10) {
        return {
          type: 'travel',
          priority: 'medium',
          title: 'Commute Time Adjustment',
          description: `Consider your commute to "${firstWorkEvent.location}"`,
          suggestedTime: `${wakeUpTime.getHours().toString().padStart(2, '0')}:${wakeUpTime.getMinutes().toString().padStart(2, '0')}`,
          originalTime: alarm.time,
          adjustmentMinutes,
          confidence: 0.7,
          reasoning: [
            `Travel to ${firstWorkEvent.location}: ${firstWorkEvent.travelTime.durationMinutes} minutes`,
            `Event starts at ${arrivalTime.toLocaleTimeString()}`,
            `Includes preparation time buffer`
          ],
          affectedEvents: [firstWorkEvent],
          actionRequired: false
        };
      }
    }

    return null;
  }

  /**
   * Suggest preparation time for important meetings
   */
  private async suggestPreparationTime(alarm: AdvancedAlarm, alarmDate: Date): Promise<CalendarSuggestion | null> {
    const allEvents = this.getAllEvents();
    const importantEvents = allEvents.filter(event => 
      event.importance === 'urgent' || event.importance === 'high'
    );

    if (importantEvents.length === 0) {
      return null;
    }

    const firstImportantEvent = importantEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
    const eventStart = new Date(firstImportantEvent.start);
    
    // Calculate additional preparation time for important meetings
    const extraPrepTime = firstImportantEvent.importance === 'urgent' ? 30 : 15;
    const prepStartTime = new Date(eventStart.getTime() - extraPrepTime * 60 * 1000);

    const currentWakeTime = this.parseTimeString(alarm.time);
    const currentWakeDate = new Date(alarmDate);
    currentWakeDate.setHours(currentWakeTime.hours, currentWakeTime.minutes, 0, 0);

    if (prepStartTime < currentWakeDate) {
      const adjustmentMinutes = Math.round((currentWakeDate.getTime() - prepStartTime.getTime()) / 60000);
      
      return {
        type: 'preparation',
        priority: firstImportantEvent.importance === 'urgent' ? 'high' : 'medium',
        title: 'Extra Preparation Time',
        description: `Important meeting requires additional preparation time`,
        suggestedTime: `${prepStartTime.getHours().toString().padStart(2, '0')}:${prepStartTime.getMinutes().toString().padStart(2, '0')}`,
        originalTime: alarm.time,
        adjustmentMinutes: -adjustmentMinutes,
        confidence: 0.6,
        reasoning: [
          `${firstImportantEvent.importance.charAt(0).toUpperCase() + firstImportantEvent.importance.slice(1)} meeting: "${firstImportantEvent.title}"`,
          `Suggested ${extraPrepTime} minutes extra preparation time`,
          `Meeting starts at ${eventStart.toLocaleTimeString()}`
        ],
        affectedEvents: [firstImportantEvent],
        actionRequired: false
      };
    }

    return null;
  }

  /**
   * Analyze event patterns and generate insights
   */
  public async analyzeEventPatterns(): Promise<CalendarInsight[]> {
    const allEvents = this.getAllEvents();
    const insights: CalendarInsight[] = [];

    // Analyze meeting frequency patterns
    const meetingPatterns = this.analyzeMeetingFrequency(allEvents);
    if (meetingPatterns.insight) {
      insights.push(meetingPatterns.insight);
    }

    // Analyze early meeting trends
    const earlyMeetingTrends = this.analyzeEarlyMeetings(allEvents);
    if (earlyMeetingTrends.insight) {
      insights.push(earlyMeetingTrends.insight);
    }

    // Analyze workload distribution
    const workloadAnalysis = this.analyzeWorkloadDistribution(allEvents);
    if (workloadAnalysis.insight) {
      insights.push(workloadAnalysis.insight);
    }

    // Analyze travel time patterns
    const travelPatterns = this.analyzeTravelPatterns(allEvents);
    if (travelPatterns.insight) {
      insights.push(travelPatterns.insight);
    }

    this.insights = insights;
    await this.saveInsights();

    return insights;
  }

  /**
   * Get calendar statistics and insights
   */
  public getCalendarStats(): any {
    const allEvents = this.getAllEvents();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingEvents = allEvents.filter(event => 
      new Date(event.start) >= now && new Date(event.start) <= nextWeek
    );

    const eventsByCategory = upcomingEvents.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const earlyMeetings = upcomingEvents.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart.getHours() < 9; // Before 9 AM
    });

    return {
      connectedCalendars: this.config.connectedCalendars.length,
      syncEnabled: this.config.enabled,
      lastSyncTime: this.lastSyncTime,
      totalEvents: allEvents.length,
      upcomingEvents: upcomingEvents.length,
      earlyMeetings: earlyMeetings.length,
      eventsByCategory,
      suggestions: this.suggestions.length,
      insights: this.insights.length,
      averageMeetingsPerDay: upcomingEvents.length / 7
    };
  }

  /**
   * Update calendar configuration
   */
  public async updateConfig(config: Partial<CalendarConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.saveConfiguration();

    if (config.enabled !== undefined) {
      if (config.enabled && !this.isInitialized) {
        await this.initialize();
      } else if (!config.enabled) {
        this.clearCachedData();
      }
    }
  }

  /**
   * Add a new calendar connection
   */
  public async connectCalendar(
    type: 'google' | 'outlook' | 'apple' | 'caldav',
    credentials: any
  ): Promise<string> {
    // This would implement actual OAuth flow in a real application
    const calendarId = `${type}_${Date.now()}`;
    
    const newCalendar = {
      id: calendarId,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Calendar`,
      type,
      email: credentials.email || '',
      isDefault: this.config.connectedCalendars.length === 0,
      syncEnabled: true,
      color: this.getDefaultCalendarColor(type)
    };

    this.config.connectedCalendars.push(newCalendar);
    await this.saveConfiguration();

    // Trigger initial sync
    if (this.config.enabled) {
      await this.syncCalendarEvents();
    }

    return calendarId;
  }

  /**
   * Disconnect a calendar
   */
  public async disconnectCalendar(calendarId: string): Promise<void> {
    this.config.connectedCalendars = this.config.connectedCalendars.filter(
      cal => cal.id !== calendarId
    );
    this.cachedEvents.delete(calendarId);
    
    await this.saveConfiguration();
    await this.saveCachedEvents();
  }

  /**
   * Helper methods
   */
  private async fetchCalendarEvents(
    calendar: any,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    // This would implement actual API calls to calendar providers
    // For now, return mock data
    return this.generateMockEvents(calendar.id, startDate, endDate);
  }

  private generateMockEvents(calendarId: string, startDate: Date, endDate: Date): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // Generate 2-4 events per day
      const eventsPerDay = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < eventsPerDay; i++) {
        const eventStart = new Date(current);
        eventStart.setHours(9 + i * 2 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
        
        const eventEnd = new Date(eventStart);
        eventEnd.setMinutes(eventEnd.getMinutes() + 30 + Math.floor(Math.random() * 90));

        events.push({
          id: `mock_${calendarId}_${current.toISOString()}_${i}`,
          title: ['Team Meeting', 'Project Review', 'Client Call', 'Planning Session'][Math.floor(Math.random() * 4)],
          start: eventStart,
          end: eventEnd,
          isAllDay: false,
          status: 'confirmed',
          importance: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)] as any,
          category: ['work', 'personal'][Math.floor(Math.random() * 2)] as any,
          calendarId,
          location: Math.random() > 0.5 ? 'Office Building, 123 Main St' : undefined,
          travelTime: Math.random() > 0.7 ? {
            durationMinutes: 15 + Math.floor(Math.random() * 30),
            mode: 'driving' as const
          } : undefined
        });
      }
      
      current.setDate(current.getDate() + 1);
    }

    return events;
  }

  private getAllEvents(): CalendarEvent[] {
    const allEvents: CalendarEvent[] = [];
    this.cachedEvents.forEach(events => allEvents.push(...events));
    return allEvents;
  }

  private analyzeMeetingFrequency(events: CalendarEvent[]): { insight?: CalendarInsight } {
    const weeklyMeetings = events.filter(event => {
      const eventDate = new Date(event.start);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return eventDate >= weekAgo && eventDate <= now;
    });

    if (weeklyMeetings.length > 30) {
      return {
        insight: {
          id: `meeting_frequency_${Date.now()}`,
          type: 'pattern',
          title: 'High Meeting Frequency Detected',
          description: `You have ${weeklyMeetings.length} meetings this week, which may impact your sleep schedule`,
          timeframe: 'weekly',
          confidence: 0.8,
          impact: 'medium',
          data: { weeklyMeetings: weeklyMeetings.length },
          suggestions: [
            'Consider blocking out morning time for preparation',
            'Review if all meetings are necessary',
            'Schedule buffer time between meetings'
          ],
          createdAt: new Date()
        }
      };
    }

    return {};
  }

  private analyzeEarlyMeetings(events: CalendarEvent[]): { insight?: CalendarInsight } {
    const earlyMeetings = events.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart.getHours() < 8;
    });

    if (earlyMeetings.length > 2) {
      return {
        insight: {
          id: `early_meetings_${Date.now()}`,
          type: 'trend',
          title: 'Frequent Early Meetings',
          description: `You have ${earlyMeetings.length} meetings before 8 AM, consider adjusting your wake time`,
          timeframe: 'weekly',
          confidence: 0.9,
          impact: 'high',
          data: { earlyMeetings: earlyMeetings.length },
          suggestions: [
            'Set alarms 30 minutes earlier on days with early meetings',
            'Request later meeting times when possible',
            'Prepare for early meetings the night before'
          ],
          createdAt: new Date()
        }
      };
    }

    return {};
  }

  private analyzeWorkloadDistribution(events: CalendarEvent[]): { insight?: CalendarInsight } {
    const workEvents = events.filter(event => event.category === 'work');
    const eventsByDay: Record<number, number> = {};

    workEvents.forEach(event => {
      const day = new Date(event.start).getDay();
      eventsByDay[day] = (eventsByDay[day] || 0) + 1;
    });

    const maxDay = Math.max(...Object.values(eventsByDay));
    const avgDay = Object.values(eventsByDay).reduce((a, b) => a + b, 0) / Object.values(eventsByDay).length;

    if (maxDay > avgDay * 2) {
      const heaviestDay = Object.keys(eventsByDay).find(day => eventsByDay[parseInt(day)] === maxDay);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      return {
        insight: {
          id: `workload_${Date.now()}`,
          type: 'pattern',
          title: 'Uneven Workload Distribution',
          description: `${dayNames[parseInt(heaviestDay!)]} has significantly more meetings than other days`,
          timeframe: 'weekly',
          confidence: 0.7,
          impact: 'medium',
          data: { heaviestDay, maxMeetings: maxDay, avgMeetings: avgDay },
          suggestions: [
            'Consider redistributing some meetings to other days',
            'Prepare extra time for busy days',
            'Schedule breaks between consecutive meetings'
          ],
          createdAt: new Date()
        }
      };
    }

    return {};
  }

  private analyzeTravelPatterns(events: CalendarEvent[]): { insight?: CalendarInsight } {
    const eventsWithTravel = events.filter(event => event.travelTime);
    const totalTravelTime = eventsWithTravel.reduce((sum, event) => 
      sum + (event.travelTime?.durationMinutes || 0), 0
    );

    if (totalTravelTime > 300) { // More than 5 hours of travel per week
      return {
        insight: {
          id: `travel_patterns_${Date.now()}`,
          type: 'pattern',
          title: 'High Travel Time Detected',
          description: `You spend ${Math.round(totalTravelTime / 60)} hours per week traveling to meetings`,
          timeframe: 'weekly',
          confidence: 0.8,
          impact: 'medium',
          data: { totalTravelTime, travelEvents: eventsWithTravel.length },
          suggestions: [
            'Consider remote meeting options when possible',
            'Group meetings by location to reduce travel',
            'Account for travel time in your wake-up schedule'
          ],
          createdAt: new Date()
        }
      };
    }

    return {};
  }

  private parseTimeString(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  private getDefaultCalendarColor(type: string): string {
    const colors = {
      google: '#4285f4',
      outlook: '#0078d4',
      apple: '#007aff',
      caldav: '#34c759'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  }

  private async initializeCalendarAPIs(): Promise<void> {
    // This would implement actual OAuth flows and API initialization
    console.log('Calendar APIs initialized (mock)');
  }

  private clearCachedData(): void {
    this.cachedEvents.clear();
    this.suggestions = [];
    this.insights = [];
  }

  private getDefaultConfig(): CalendarConfig {
    return {
      enabled: false,
      connectedCalendars: [],
      conflictDetection: {
        enabled: true,
        lookAheadDays: 7,
        minimumGapMinutes: 15,
        considerTravelTime: true,
        skipWeekends: false
      },
      autoAdjustments: {
        enabled: true,
        maxAdjustmentMinutes: 60,
        earlyMeetingThreshold: '09:00',
        preparationTimeMinutes: 30,
        travelTimeBuffer: 20
      },
      workSchedule: {
        enabled: true,
        workDays: [1, 2, 3, 4, 5], // Monday to Friday
        startTime: '09:00',
        endTime: '17:00',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      smartSuggestions: {
        enabled: true,
        suggestOptimalWakeTime: true,
        considerMeetingImportance: true,
        factorInCommute: true,
        includePreparationTime: true
      }
    };
  }

  // Persistence methods
  private async saveConfiguration(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('enhanced_calendar_config', JSON.stringify(this.config));
    }
  }

  private async loadConfiguration(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('enhanced_calendar_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    }
  }

  private async saveCachedEvents(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const events = Object.fromEntries(this.cachedEvents);
      localStorage.setItem('cached_calendar_events', JSON.stringify(events, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      }));
    }
  }

  private async saveInsights(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('calendar_insights', JSON.stringify(this.insights, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      }));
    }
  }
}

export default EnhancedCalendarService;