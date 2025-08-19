import { supabase } from "./supabase";
import type { Alarm } from "../types";

export interface SleepSession {
  id: string;
  userId: string;
  bedtime: Date;
  sleepTime: Date;
  wakeTime: Date;
  getUpTime: Date;
  sleepDuration: number; // minutes
  sleepQuality: number; // 1-10 scale
  sleepStages: SleepStage[];
  environmentData: EnvironmentData;
  createdAt: Date;
  updatedAt: Date;
}

export interface SleepStage {
  stage: "light" | "deep" | "rem" | "awake";
  startTime: Date;
  duration: number; // minutes
  quality: number; // 1-10 scale
}

export interface EnvironmentData {
  averageLight: number; // lux
  averageNoise: number; // decibels
  temperature: number; // celsius
  humidity: number; // percentage
  wearableData?: WearableData;
}

export interface WearableData {
  heartRate: number[];
  movement: number[];
  oxygenSaturation: number[];
}

export interface SleepPattern {
  userId: string;
  averageBedtime: string; // HH:MM format
  averageSleepTime: string;
  averageWakeTime: string;
  averageSleepDuration: number; // minutes
  averageSleepQuality: number;
  sleepLatency: number; // time to fall asleep in minutes
  sleepEfficiency: number; // percentage
  weekdayPattern: DayPattern;
  weekendPattern: DayPattern;
  seasonalVariations: { [season: string]: Partial<SleepPattern> };
  chronotype: "extreme_early" | "early" | "normal" | "late" | "extreme_late";
}

export interface DayPattern {
  bedtime: string;
  wakeTime: string;
  sleepDuration: number;
  sleepQuality: number;
}

export interface SmartAlarmRecommendation {
  originalTime: string;
  recommendedTime: string;
  reason: string;
  confidence: number; // 0-1
  sleepStageAtOriginal: "light" | "deep" | "rem" | "unknown";
  sleepStageAtRecommended: "light" | "deep" | "rem" | "unknown";
  estimatedSleepQuality: number;
  wakeUpDifficulty: "very_easy" | "easy" | "normal" | "hard" | "very_hard";
}

export interface OptimalWakeWindow {
  start: string; // HH:MM
  end: string; // HH:MM
  stages: Array<{
    time: string;
    stage: "light" | "deep" | "rem";
    quality: number;
  }>;
}

export class SleepAnalysisService {
  private static userId: string | null = null;

  static async initialize(userId: string): Promise<void> {
    this.userId = userId;
    console.log("Sleep analysis service initialized for user:", userId);
  }

  // Sleep session tracking
  static async recordSleepSession(
    session: Partial<SleepSession>,
  ): Promise<SleepSession | null> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const { data, error } = await supabase
        .from("sleep_sessions")
        .insert({
          user_id: this.userId,
          bedtime: session.bedtime,
          sleep_time: session.sleepTime,
          wake_time: session.wakeTime,
          get_up_time: session.getUpTime,
          sleep_duration: session.sleepDuration,
          sleep_quality: session.sleepQuality,
          sleep_stages: session.sleepStages,
          environment_data: session.environmentData,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapDatabaseToSleepSession(data);
    } catch (error) {
      console.error("Error recording sleep session:", error);
      return null;
    }
  }

  static async getSleepHistory(days: number = 30): Promise<SleepSession[]> {
    if (!this.userId) return [];

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("sleep_sessions")
        .select("*")
        .eq("user_id", this.userId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map(this.mapDatabaseToSleepSession);
    } catch (error) {
      console.error("Error fetching sleep history:", error);
      return [];
    }
  }

  // Sleep pattern analysis
  static async analyzeSleepPatterns(): Promise<SleepPattern | null> {
    if (!this.userId) return null;

    try {
      const sessions = await this.getSleepHistory(90); // Analyze last 3 months
      if (sessions.length < 7) {
        console.log("Insufficient sleep data for pattern analysis");
        return null;
      }

      const weekdaySessions = sessions.filter((s) => {
        const day = new Date(s.bedtime).getDay();
        return day >= 1 && day <= 5; // Monday to Friday
      });

      const weekendSessions = sessions.filter((s) => {
        const day = new Date(s.bedtime).getDay();
        return day === 0 || day === 6; // Saturday and Sunday
      });

      const pattern: SleepPattern = {
        userId: this.userId,
        averageBedtime: this.calculateAverageTime(
          sessions.map((s) => s.bedtime),
        ),
        averageSleepTime: this.calculateAverageTime(
          sessions.map((s) => s.sleepTime),
        ),
        averageWakeTime: this.calculateAverageTime(
          sessions.map((s) => s.wakeTime),
        ),
        averageSleepDuration: this.calculateAverage(
          sessions.map((s) => s.sleepDuration),
        ),
        averageSleepQuality: this.calculateAverage(
          sessions.map((s) => s.sleepQuality),
        ),
        sleepLatency: this.calculateSleepLatency(sessions),
        sleepEfficiency: this.calculateSleepEfficiency(sessions),
        weekdayPattern: this.analyzeDayPattern(weekdaySessions),
        weekendPattern: this.analyzeDayPattern(weekendSessions),
        seasonalVariations: this.analyzeSeasonalVariations(sessions),
        chronotype: this.determineChronotype(sessions),
      };

      // Cache the pattern
      await this.cacheSleepPattern(pattern);

      return pattern;
    } catch (error) {
      console.error("Error analyzing sleep patterns:", error);
      return null;
    }
  }

  // Smart alarm recommendations
  static async getSmartAlarmRecommendation(
    alarm: Alarm,
  ): Promise<SmartAlarmRecommendation | null> {
    try {
      const pattern = await this.analyzeSleepPatterns();
      if (!pattern) {
        return null;
      }

      const alarmTime = this.parseTimeString(alarm.time);
      const predictedSleepStages = await this.predictSleepStages(
        alarm,
        pattern,
      );
      const optimalWindow = this.findOptimalWakeWindow(
        alarmTime,
        predictedSleepStages,
      );

      if (!optimalWindow || optimalWindow.stages.length === 0) {
        return null;
      }

      // Find the best wake-up time within 30 minutes of original alarm
      const originalMinutes = alarmTime.hours * 60 + alarmTime.minutes;
      const windowStart = originalMinutes - 30;
      const windowEnd = originalMinutes + 5; // Small buffer after original time

      const bestWakeTime = this.findBestWakeTimeInWindow(
        optimalWindow.stages,
        windowStart,
        windowEnd,
      );

      if (!bestWakeTime) {
        return null;
      }

      const recommendation: SmartAlarmRecommendation = {
        originalTime: alarm.time,
        recommendedTime: this.minutesToTimeString(bestWakeTime.timeInMinutes),
        reason: this.generateRecommendationReason(bestWakeTime.stage, pattern),
        confidence: this.calculateConfidence(pattern, bestWakeTime),
        sleepStageAtOriginal: this.predictStageAtTime(
          predictedSleepStages,
          originalMinutes,
        ),
        sleepStageAtRecommended: bestWakeTime.stage,
        estimatedSleepQuality: this.estimateSleepQuality(bestWakeTime, pattern),
        wakeUpDifficulty: this.estimateWakeUpDifficulty(bestWakeTime.stage),
      };

      // Only recommend if there's a significant improvement
      if (
        Math.abs(originalMinutes - bestWakeTime.timeInMinutes) < 5 ||
        recommendation.confidence < 0.6
      ) {
        return null;
      }

      return recommendation;
    } catch (error) {
      console.error("Error generating smart alarm recommendation:", error);
      return null;
    }
  }

  // Sleep cycle prediction
  static async predictSleepStages(
    alarm: Alarm,
    pattern: SleepPattern,
  ): Promise<Array<{ time: number; stage: "light" | "deep" | "rem" }>> {
    const isWeekday = this.isWeekday(alarm.days);
    const targetPattern = isWeekday
      ? pattern.weekdayPattern
      : pattern.weekendPattern;

    // Estimate sleep time based on pattern
    const bedtimeMinutes = this.parseTimeString(targetPattern.bedtime);
    const sleepLatency = pattern.sleepLatency;
    const sleepStartMinutes =
      bedtimeMinutes.hours * 60 + bedtimeMinutes.minutes + sleepLatency;

    // Generate sleep cycle based on typical 90-minute cycles
    const cycles: Array<{ time: number; stage: "light" | "deep" | "rem" }> = [];
    let currentTime = sleepStartMinutes;

    // Typical sleep cycle pattern
    const cyclePattern = [
      { stage: "light" as const, duration: 20 },
      { stage: "deep" as const, duration: 30 },
      { stage: "light" as const, duration: 20 },
      { stage: "rem" as const, duration: 20 },
    ];

    // Generate 6 cycles (9 hours total)
    for (let cycle = 0; cycle < 6; cycle++) {
      for (const phase of cyclePattern) {
        cycles.push({
          time: currentTime,
          stage: phase.stage,
        });
        currentTime += phase.duration;
      }
    }

    return cycles;
  }

  static findOptimalWakeWindow(
    alarmTime: { hours: number; minutes: number },
    sleepStages: Array<{ time: number; stage: "light" | "deep" | "rem" }>,
  ): OptimalWakeWindow | null {
    const alarmMinutes = alarmTime.hours * 60 + alarmTime.minutes;
    const windowStart = alarmMinutes - 30;
    const windowEnd = alarmMinutes + 5;

    const windowStages = sleepStages.filter(
      (stage) => stage.time >= windowStart && stage.time <= windowEnd,
    );

    if (windowStages.length === 0) return null;

    // Assign quality scores (light sleep is best for waking)
    const stagesWithQuality = windowStages.map((stage) => ({
      time: this.minutesToTimeString(stage.time),
      stage: stage.stage,
      quality: stage.stage === "light" ? 10 : stage.stage === "rem" ? 5 : 1,
    }));

    return {
      start: this.minutesToTimeString(windowStart),
      end: this.minutesToTimeString(windowEnd),
      stages: stagesWithQuality,
    };
  }

  // Helper methods
  private static mapDatabaseToSleepSession(data: any): SleepSession {
    return {
      id: data.id,
      userId: data.user_id,
      bedtime: new Date(data.bedtime),
      sleepTime: new Date(data.sleep_time),
      wakeTime: new Date(data.wake_time),
      getUpTime: new Date(data.get_up_time),
      sleepDuration: data.sleep_duration,
      sleepQuality: data.sleep_quality,
      sleepStages: data.sleep_stages || [],
      environmentData: data.environment_data || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private static calculateAverageTime(dates: Date[]): string {
    if (dates.length === 0) return "22:00";

    const totalMinutes = dates.reduce((sum, date) => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return sum + (hours * 60 + minutes);
    }, 0);

    const avgMinutes = Math.round(totalMinutes / dates.length);
    return this.minutesToTimeString(avgMinutes);
  }

  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private static calculateSleepLatency(sessions: SleepSession[]): number {
    const latencies = sessions
      .map((session) => {
        const bedtime = session.bedtime.getTime();
        const sleepTime = session.sleepTime.getTime();
        return (sleepTime - bedtime) / (1000 * 60); // minutes
      })
      .filter((latency) => latency > 0 && latency < 120); // Filter outliers

    return this.calculateAverage(latencies);
  }

  private static calculateSleepEfficiency(sessions: SleepSession[]): number {
    const efficiencies = sessions.map((session) => {
      const totalTimeInBed =
        session.getUpTime.getTime() - session.bedtime.getTime();
      const actualSleepTime = session.sleepDuration * 60 * 1000;
      return (actualSleepTime / totalTimeInBed) * 100;
    });

    return this.calculateAverage(efficiencies);
  }

  private static analyzeDayPattern(sessions: SleepSession[]): DayPattern {
    if (sessions.length === 0) {
      return {
        bedtime: "22:00",
        wakeTime: "07:00",
        sleepDuration: 480,
        sleepQuality: 5,
      };
    }

    return {
      bedtime: this.calculateAverageTime(sessions.map((s) => s.bedtime)),
      wakeTime: this.calculateAverageTime(sessions.map((s) => s.wakeTime)),
      sleepDuration: this.calculateAverage(
        sessions.map((s) => s.sleepDuration),
      ),
      sleepQuality: this.calculateAverage(sessions.map((s) => s.sleepQuality)),
    };
  }

  private static analyzeSeasonalVariations(sessions: SleepSession[]): {
    [season: string]: Partial<SleepPattern>;
  } {
    // Group sessions by season
    const seasons = {
      spring: sessions.filter((s) => [2, 3, 4].includes(s.bedtime.getMonth())),
      summer: sessions.filter((s) => [5, 6, 7].includes(s.bedtime.getMonth())),
      autumn: sessions.filter((s) => [8, 9, 10].includes(s.bedtime.getMonth())),
      winter: sessions.filter((s) => [11, 0, 1].includes(s.bedtime.getMonth())),
    };

    const variations: { [season: string]: Partial<SleepPattern> } = {};

    Object.entries(seasons).forEach(([season, seasonSessions]) => {
      if (seasonSessions.length > 0) {
        variations[season] = {
          averageBedtime: this.calculateAverageTime(
            seasonSessions.map((s) => s.bedtime),
          ),
          averageWakeTime: this.calculateAverageTime(
            seasonSessions.map((s) => s.wakeTime),
          ),
          averageSleepDuration: this.calculateAverage(
            seasonSessions.map((s) => s.sleepDuration),
          ),
          averageSleepQuality: this.calculateAverage(
            seasonSessions.map((s) => s.sleepQuality),
          ),
        };
      }
    });

    return variations;
  }

  private static determineChronotype(
    sessions: SleepSession[],
  ): "extreme_early" | "early" | "normal" | "late" | "extreme_late" {
    const averageBedtimeMinutes =
      sessions.reduce((sum, session) => {
        return (
          sum + (session.bedtime.getHours() * 60 + session.bedtime.getMinutes())
        );
      }, 0) / sessions.length;

    // Convert to 24-hour format (handle midnight crossing)
    const bedtimeHours = averageBedtimeMinutes / 60;

    if (bedtimeHours < 21) return "extreme_early";
    if (bedtimeHours < 22) return "early";
    if (bedtimeHours < 24) return "normal";
    if (bedtimeHours < 2) return "late";
    return "extreme_late";
  }

  private static findBestWakeTimeInWindow(
    stages: Array<{
      time: string;
      stage: "light" | "deep" | "rem";
      quality: number;
    }>,
    windowStart: number,
    windowEnd: number,
  ): { timeInMinutes: number; stage: "light" | "deep" | "rem" } | null {
    const validStages = stages.filter((stage) => {
      const stageMinutes =
        this.parseTimeString(stage.time).hours * 60 +
        this.parseTimeString(stage.time).minutes;
      return stageMinutes >= windowStart && stageMinutes <= windowEnd;
    });

    if (validStages.length === 0) return null;

    // Sort by quality (light sleep is best)
    const sortedStages = validStages.sort((a, b) => b.quality - a.quality);
    const bestStage = sortedStages[0];
    const bestStageTime = this.parseTimeString(bestStage.time);

    return {
      timeInMinutes: bestStageTime.hours * 60 + bestStageTime.minutes,
      stage: bestStage.stage,
    };
  }

  private static predictStageAtTime(
    sleepStages: Array<{ time: number; stage: "light" | "deep" | "rem" }>,
    timeInMinutes: number,
  ): "light" | "deep" | "rem" | "unknown" {
    const closestStage = sleepStages.reduce((closest, stage) => {
      const closestDistance = Math.abs(closest.time - timeInMinutes);
      const stageDistance = Math.abs(stage.time - timeInMinutes);
      return stageDistance < closestDistance ? stage : closest;
    });

    return closestStage ? closestStage.stage : "unknown";
  }

  private static generateRecommendationReason(
    stage: "light" | "deep" | "rem",
    pattern: SleepPattern,
  ): string {
    const reasons = {
      light: `You'll be in light sleep, making it easier to wake up naturally. Based on your ${pattern.chronotype} chronotype.`,
      rem: `You'll be in REM sleep, which allows for easier waking than deep sleep. You may remember your dreams!`,
      deep: `You'll be in deep sleep. This timing is not ideal for waking up, but it's within your preferred schedule.`,
    };

    return reasons[stage];
  }

  private static calculateConfidence(
    pattern: SleepPattern,
    wakeTime: { stage: "light" | "deep" | "rem" },
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for light sleep
    if (wakeTime.stage === "light") confidence += 0.3;
    else if (wakeTime.stage === "rem") confidence += 0.1;

    // Higher confidence with more sleep data
    confidence += Math.min(0.2, pattern.sleepEfficiency / 500); // Max 0.2 boost

    return Math.min(confidence, 1.0);
  }

  private static estimateSleepQuality(
    wakeTime: { stage: "light" | "deep" | "rem" },
    pattern: SleepPattern,
  ): number {
    const baseQuality = pattern.averageSleepQuality;

    // Adjust based on wake stage
    if (wakeTime.stage === "light") return Math.min(baseQuality + 1, 10);
    if (wakeTime.stage === "deep") return Math.max(baseQuality - 2, 1);
    return baseQuality; // REM
  }

  private static estimateWakeUpDifficulty(
    stage: "light" | "deep" | "rem",
  ): "very_easy" | "easy" | "normal" | "hard" | "very_hard" {
    const difficulties = {
      light: "very_easy" as const,
      rem: "easy" as const,
      deep: "hard" as const,
    };

    return difficulties[stage];
  }

  private static parseTimeString(timeStr: string): {
    hours: number;
    minutes: number;
  } {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { hours, minutes };
  }

  private static minutesToTimeString(totalMinutes: number): string {
    const adjustedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const hours = Math.floor(adjustedMinutes / 60);
    const minutes = adjustedMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  private static isWeekday(days: number[]): boolean {
    // Check if alarm includes more weekdays than weekend days
    const weekdays = days.filter((day) => day >= 1 && day <= 5).length;
    const weekendDays = days.filter((day) => day === 0 || day === 6).length;
    return weekdays > weekendDays;
  }

  private static async cacheSleepPattern(pattern: SleepPattern): Promise<void> {
    try {
      localStorage.setItem(
        `sleep_pattern_${pattern.userId}`,
        JSON.stringify(pattern),
      );
    } catch (error) {
      console.error("Error caching sleep pattern:", error);
    }
  }

  static getCachedSleepPattern(): SleepPattern | null {
    if (!this.userId) return null;

    try {
      const cached = localStorage.getItem(`sleep_pattern_${this.userId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error loading cached sleep pattern:", error);
      return null;
    }
  }

  // Manual sleep tracking
  static async trackSleepManually(
    bedtime: Date,
    wakeTime: Date,
    quality: number,
  ): Promise<void> {
    const sleepTime = new Date(bedtime.getTime() + 15 * 60 * 1000); // Assume 15 min to fall asleep
    const getUpTime = new Date(wakeTime.getTime() + 10 * 60 * 1000); // Assume 10 min to get up
    const duration = Math.round(
      (wakeTime.getTime() - sleepTime.getTime()) / (1000 * 60),
    );

    await this.recordSleepSession({
      bedtime,
      sleepTime,
      wakeTime,
      getUpTime,
      sleepDuration: duration,
      sleepQuality: quality,
      sleepStages: [], // Will be estimated
      environmentData: {
        averageLight: 0,
        averageNoise: 0,
        temperature: 20,
        humidity: 50,
      },
    });
  }
}

export default SleepAnalysisService;
