/**
 * AlarmParser - Handles parsing and calculating recurrence patterns, next occurrences
 */
import type { Alarm, RecurrencePattern } from '../types/index';

export class AlarmParser {
  /**
   * Calculate next occurrences for an alarm
   */
  static calculateNextOccurrences(
    alarm: Alarm,
    fromDate: Date = new Date(),
    count: number = 10
  ): Date[] {
    const occurrences: Date[] = [];

    if (!alarm.recurrencePattern) {
      // One-time alarm
      const alarmTime = this.parseAlarmTime(alarm.time, fromDate);
      if (alarmTime > fromDate) {
        occurrences.push(alarmTime);
      }
      return occurrences;
    }

    const pattern = alarm.recurrencePattern;
    let currentDate = new Date(fromDate);

    while (occurrences.length < count) {
      const nextOccurrence = this.getNextOccurrence(alarm, currentDate);

      if (!nextOccurrence) break;

      // Check if we've reached the end conditions
      if (pattern.endDate && nextOccurrence > pattern.endDate) break;
      if (
        pattern.endAfterOccurrences &&
        this.getTotalOccurrences(alarm, fromDate) >= pattern.endAfterOccurrences
      )
        break;

      // Check if this date is an exception
      if (!this.isException(nextOccurrence, pattern.exceptions || [])) {
        occurrences.push(nextOccurrence);
      }

      currentDate = new Date(nextOccurrence.getTime() + 24 * 60 * 60 * 1000);
    }

    return occurrences;
  }

  private static getNextOccurrence(alarm: Alarm, fromDate: Date): Date | null {
    const pattern = alarm.recurrencePattern!;
    const baseTime = this.parseAlarmTime(alarm.time, fromDate);

    switch (pattern.type) {
      case 'daily':
        return this.getNextDaily(baseTime, pattern, fromDate);
      case 'weekly':
        return this.getNextWeekly(baseTime, pattern, fromDate);
      case 'monthly':
        return this.getNextMonthly(baseTime, pattern, fromDate);
      case 'yearly':
        return this.getNextYearly(baseTime, pattern, fromDate);
      case 'workdays':
        return this.getNextWorkday(baseTime, fromDate);
      case 'weekends':
        return this.getNextWeekend(baseTime, fromDate);
      case 'custom':
        return this.getNextCustom(baseTime, pattern, fromDate);
      default:
        return null;
    }
  }

  private static parseAlarmTime(timeString: string, date: Date): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private static getNextDaily(
    baseTime: Date,
    pattern: RecurrencePattern,
    fromDate: Date
  ): Date {
    const nextTime = new Date(baseTime);
    const daysDiff = Math.ceil(
      (fromDate.getTime() - baseTime.getTime()) / (24 * 60 * 60 * 1000)
    );
    const intervalAdjusted = Math.ceil(daysDiff / pattern.interval) * pattern.interval;
    nextTime.setDate(nextTime.getDate() + intervalAdjusted);
    return nextTime;
  }

  private static getNextWeekly(
    baseTime: Date,
    pattern: RecurrencePattern,
    fromDate: Date
  ): Date {
    const daysOfWeek = pattern.daysOfWeek || [baseTime.getDay()];

    for (let i = 0; i < 14; i++) {
      const checkDate = new Date(fromDate);
      checkDate.setDate(fromDate.getDate() + i);
      checkDate.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

      if (daysOfWeek.includes(checkDate.getDay()) && checkDate > fromDate) {
        return checkDate;
      }
    }

    return new Date(baseTime);
  }

  private static getNextMonthly(
    baseTime: Date,
    pattern: RecurrencePattern,
    fromDate: Date
  ): Date {
    const nextTime = new Date(baseTime);

    if (pattern.daysOfMonth) {
      return this.getNextMonthlyByDate(baseTime, pattern.daysOfMonth, fromDate);
    } else if (pattern.weeksOfMonth) {
      return this.getNextMonthlyByWeek(
        baseTime,
        pattern.weeksOfMonth,
        pattern.daysOfWeek || [],
        fromDate
      );
    }

    nextTime.setMonth(nextTime.getMonth() + pattern.interval);
    return nextTime;
  }

  private static getNextYearly(
    baseTime: Date,
    pattern: RecurrencePattern,
    fromDate: Date
  ): Date {
    const nextTime = new Date(baseTime);
    const monthsOfYear = pattern.monthsOfYear || [baseTime.getMonth() + 1];

    for (const month of monthsOfYear) {
      nextTime.setFullYear(nextTime.getFullYear() + pattern.interval);
      nextTime.setMonth(month - 1);
      if (nextTime > fromDate) {
        return nextTime;
      }
    }

    return nextTime;
  }

  private static getNextWorkday(baseTime: Date, fromDate: Date): Date {
    const nextTime = new Date(fromDate);
    nextTime.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

    while (nextTime <= fromDate || this.isWeekend(nextTime)) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  }

  private static getNextWeekend(baseTime: Date, fromDate: Date): Date {
    const nextTime = new Date(fromDate);
    nextTime.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

    while (nextTime <= fromDate || !this.isWeekend(nextTime)) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  }

  private static getNextCustom(
    baseTime: Date,
    pattern: RecurrencePattern,
    fromDate: Date
  ): Date | null {
    if (!pattern.customPattern) return null;

    const { customPattern } = pattern;

    if (customPattern.dates) {
      for (const dateStr of customPattern.dates) {
        const date = new Date(dateStr);
        date.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);
        if (date > fromDate) {
          return date;
        }
      }
    }

    if (customPattern.intervals) {
      const startDate = new Date(baseTime);
      for (const interval of customPattern.intervals) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + interval);
        if (date > fromDate) {
          return date;
        }
      }
    }

    return null;
  }

  private static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  private static isException(date: Date, exceptions: Date[]): boolean {
    return exceptions.some(
      exception =>
        exception.getFullYear() === date.getFullYear() &&
        exception.getMonth() === date.getMonth() &&
        exception.getDate() === date.getDate()
    );
  }

  private static getTotalOccurrences(alarm: Alarm, fromDate: Date): number {
    if (!alarm.recurrencePattern || !alarm.createdAt) {
      return 0;
    }

    const createdAt = new Date(alarm.createdAt);
    const occurrences = this.calculateNextOccurrences(alarm, createdAt, 1000);
    return occurrences.filter(date => date < fromDate).length;
  }

  private static getNextMonthlyByDate(
    baseTime: Date,
    daysOfMonth: number[],
    fromDate: Date
  ): Date {
    const nextTime = new Date(fromDate);
    nextTime.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

    const sortedDays = [...daysOfMonth].sort((a, b
) => a - b);

    for (const day of sortedDays) {
      const testDate = new Date(
        nextTime.getFullYear(),
        nextTime.getMonth(),
        day,
        baseTime.getHours(),
        baseTime.getMinutes(),
        0,
        0
      );
      if (testDate > fromDate) {
        return testDate;
      }
    }

    nextTime.setMonth(nextTime.getMonth() + 1);
    const firstDay = Math.min(...sortedDays);
    nextTime.setDate(firstDay);
    return nextTime;
  }

  private static getNextMonthlyByWeek(
    baseTime: Date,
    weeksOfMonth: number[],
    daysOfWeek: number[],
    fromDate: Date
  ): Date {
    const nextTime = new Date(fromDate);
    nextTime.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

    for (const week of weeksOfMonth) {
      for (const dayOfWeek of daysOfWeek) {
        const testDate = this.getNthWeekdayOfMonth(
          nextTime.getFullYear(),
          nextTime.getMonth(),
          week,
          dayOfWeek
        );
        testDate.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

        if (testDate > fromDate) {
          return testDate;
        }
      }
    }

    nextTime.setMonth(nextTime.getMonth() + 1);
    const firstWeek = Math.min(...weeksOfMonth);
    const firstDay = Math.min(...daysOfWeek);
    const resultDate = this.getNthWeekdayOfMonth(
      nextTime.getFullYear(),
      nextTime.getMonth(),
      firstWeek,
      firstDay
    );
    resultDate.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);
    return resultDate;
  }

  private static getNthWeekdayOfMonth(
    year: number,
    month: number,
    week: number,
    dayOfWeek: number
  ): Date {
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();

    let offset = (dayOfWeek - firstWeekday + 7) % 7;
    offset += (week - 1) * 7;

    return new Date(year, month, 1 + offset);
  }

  static adjustTimeByMinutes(timeString: string, minutes: number): string {
    const [hours, mins] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return this.formatTimeToHHMM(date);
  }

  static formatTimeToHHMM(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }
}
