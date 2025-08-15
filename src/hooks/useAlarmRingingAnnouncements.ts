import { useCallback } from 'react';
import { useScreenReaderAnnouncements } from './useScreenReaderAnnouncements';
import type { Alarm } from '../types/index';

export function useAlarmRingingAnnouncements() {
  const { announce } = useScreenReaderAnnouncements();

  // Alarm ringing announcements
  const announceAlarmStart = useCallback((alarm: Alarm) => {
    const time = new Date(alarm.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let message = `Wake up! Alarm \"${alarm.title}\" is ringing. Time: ${time}.`;
    
    if (alarm.description) {
      message += ` Message: ${alarm.description}.`;
    }
    
    message += ' Tap to snooze or swipe to dismiss.';
    
    announce(message, 'assertive');
  }, [announce]);

  const announceAlarmSnooze = useCallback((alarm: Alarm, snoozeMinutes: number) => {
    const nextRingTime = new Date(Date.now() + snoozeMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    announce(
      `Alarm \"${alarm.title}\" snoozed for ${snoozeMinutes} minute${snoozeMinutes === 1 ? '' : 's'}. Will ring again at ${nextRingTime}.`,
      'assertive'
    );
  }, [announce]);

  const announceAlarmDismiss = useCallback((alarm: Alarm, dismissReason: 'manual' | 'timeout' | 'challenge_completed') => {
    let message = `Alarm \"${alarm.title}\" `;
    
    switch (dismissReason) {
      case 'manual':
        message += 'dismissed.';
        break;
      case 'timeout':
        message += 'stopped automatically after timeout.';
        break;
      case 'challenge_completed':
        message += 'dismissed after completing wake-up challenge.';
        break;
    }
    
    announce(message, 'polite');
  }, [announce]);

  const announceAlarmChallenge = useCallback((challengeType: string, challengeDescription: string, timeLimit?: number) => {
    let message = `Wake-up challenge activated: ${challengeType}. ${challengeDescription}.`;
    
    if (timeLimit) {
      message += ` Time limit: ${timeLimit} second${timeLimit === 1 ? '' : 's'}.`;
    }
    
    message += ' Complete the challenge to stop the alarm.';
    
    announce(message, 'assertive');
  }, [announce]);

  const announceChallengeProgress = useCallback((challengeType: string, progress: number, target: number, unit: string) => {
    const percentage = Math.round((progress / target) * 100);
    announce(
      `Challenge progress: ${progress} of ${target} ${unit} completed. ${percentage}% done.`,
      'polite'
    );
  }, [announce]);

  const announceChallengeCompleted = useCallback((challengeType: string, completionTime: number) => {
    const minutes = Math.floor(completionTime / 60);
    const seconds = completionTime % 60;
    
    let timeMessage = '';
    if (minutes > 0) {
      timeMessage = `${minutes} minute${minutes === 1 ? '' : 's'}`;
      if (seconds > 0) {
        timeMessage += ` and ${seconds} second${seconds === 1 ? '' : 's'}`;
      }
    } else {
      timeMessage = `${seconds} second${seconds === 1 ? '' : 's'}`;
    }
    
    announce(
      `Congratulations! ${challengeType} challenge completed in ${timeMessage}. Alarm dismissed. Great job waking up!`,
      'assertive'
    );
  }, [announce]);

  const announceChallengeFailure = useCallback((challengeType: string, reason: string) => {
    announce(
      `Challenge failed: ${challengeType}. ${reason}. Alarm continues ringing. Try again or snooze.`,
      'assertive'
    );
  }, [announce]);

  // Volume and sound announcements
  const announceVolumeChange = useCallback((newVolume: number, isIncreasing: boolean) => {
    const direction = isIncreasing ? 'increased' : 'decreased';
    announce(`Alarm volume ${direction} to ${newVolume}%.`, 'polite');
  }, [announce]);

  const announceSoundChange = useCallback((newSound: string, soundType: 'built-in' | 'custom' | 'playlist') => {
    let message = `Alarm sound changed to \"${newSound}\"`;
    
    switch (soundType) {
      case 'custom':
        message += ' (custom sound)';
        break;
      case 'playlist':
        message += ' (playlist)';
        break;
      case 'built-in':
      default:
        message += ' (built-in sound)';
        break;
    }
    
    announce(message, 'polite');
  }, [announce]);

  const announceSoundError = useCallback((soundName: string, errorMessage: string) => {
    announce(
      `Unable to play alarm sound \"${soundName}\": ${errorMessage}. Using default alarm sound.`,
      'assertive'
    );
  }, [announce]);

  // Battle and gamification announcements
  const announceBattleAlarmStart = useCallback((alarm: Alarm, opponentName: string, battleType: string) => {
    announce(
      `Battle alarm \"${alarm.title}\" is ringing! You are competing against ${opponentName} in a ${battleType} battle. Wake up first to win!`,
      'assertive'
    );
  }, [announce]);

  const announceBattleResult = useCallback((won: boolean, opponentName: string, timeDifference: number) => {
    const minutes = Math.floor(timeDifference / 60);
    const seconds = timeDifference % 60;
    
    let timeMessage = '';
    if (minutes > 0) {
      timeMessage = `${minutes} minute${minutes === 1 ? '' : 's'}`;
      if (seconds > 0) {
        timeMessage += ` and ${seconds} second${seconds === 1 ? '' : 's'}`;
      }
    } else {
      timeMessage = `${seconds} second${seconds === 1 ? '' : 's'}`;
    }
    
    if (won) {
      announce(
        `Victory! You woke up ${timeMessage} before ${opponentName}. You won the battle and earned rewards!`,
        'assertive'
      );
    } else {
      announce(
        `Battle lost. ${opponentName} woke up ${timeMessage} before you. Better luck next time!`,
        'assertive'
      );
    }
  }, [announce]);

  // Smart alarm announcements
  const announceSmartAdjustment = useCallback((originalTime: string, adjustedTime: string, reason: string) => {
    announce(
      `Smart alarm adjustment: Alarm moved from ${originalTime} to ${adjustedTime} due to ${reason}.`,
      'polite'
    );
  }, [announce]);

  const announceOptimalWakeTime = useCallback((alarm: Alarm, sleepCycleInfo: string) => {
    announce(
      `Optimal wake time detected for alarm \"${alarm.title}\". ${sleepCycleInfo}. Waking you now for better sleep quality.`,
      'assertive'
    );
  }, [announce]);

  const announceWeatherAdjustment = useCallback((alarm: Alarm, weatherCondition: string, adjustmentMinutes: number) => {
    const adjustment = adjustmentMinutes > 0 ? `${adjustmentMinutes} minutes later` : `${Math.abs(adjustmentMinutes)} minutes earlier`;
    announce(
      `Weather-smart adjustment: Alarm \"${alarm.title}\" ringing ${adjustment} due to ${weatherCondition} weather conditions.`,
      'polite'
    );
  }, [announce]);

  // Recurring alarm announcements
  const announceRecurringAlarmInfo = useCallback((alarm: Alarm, nextOccurrence: Date) => {
    const nextTime = nextOccurrence.toLocaleString();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const recurringDays = alarm.recurringDays?.map(day => dayNames[day]).join(', ');
    
    let message = `Recurring alarm \"${alarm.title}\" completed.`;
    if (recurringDays) {
      message += ` Repeats on: ${recurringDays}.`;
    }
    message += ` Next occurrence: ${nextTime}.`;
    
    announce(message, 'polite');
  }, [announce]);

  // Emergency and backup announcements
  const announceEmergencyAlarm = useCallback((reason: string) => {
    announce(
      `Emergency alarm activated: ${reason}. This alarm cannot be snoozed or dismissed easily. Take immediate action.`,
      'assertive'
    );
  }, [announce]);

  const announceBackupAlarm = useCallback((originalAlarmName: string, backupDelay: number) => {
    announce(
      `Backup alarm activated. Original alarm \"${originalAlarmName}\" was not dismissed. This backup will ring in ${backupDelay} minute${backupDelay === 1 ? '' : 's'}.`,
      'assertive'
    );
  }, [announce]);

  // Location-based alarm announcements
  const announceLocationAlarm = useCallback((alarm: Alarm, currentLocation: string, targetLocation: string) => {
    announce(
      `Location alarm \"${alarm.title}\" triggered. You are now at ${currentLocation}, target was ${targetLocation}.`,
      'assertive'
    );
  }, [announce]);

  const announceProximityAlarm = useCallback((alarm: Alarm, distance: number, targetLocation: string) => {
    announce(
      `Proximity alarm \"${alarm.title}\" triggered. You are ${distance} meters from ${targetLocation}.`,
      'assertive'
    );
  }, [announce]);

  // Accessibility and customization announcements
  const announceVibrationMode = useCallback((isEnabled: boolean, pattern?: string) => {
    let message = `Alarm vibration ${isEnabled ? 'enabled' : 'disabled'}`;
    if (isEnabled && pattern) {
      message += ` with ${pattern} pattern`;
    }
    announce(message, 'polite');
  }, [announce]);

  const announceFlashMode = useCallback((isEnabled: boolean, color?: string) => {
    let message = `Alarm flash mode ${isEnabled ? 'enabled' : 'disabled'}`;
    if (isEnabled && color) {
      message += ` with ${color} color`;
    }
    announce(message, 'polite');
  }, [announce]);

  const announceAccessibilityMode = useCallback((mode: string, description: string) => {
    announce(
      `Accessibility mode activated: ${mode}. ${description}`,
      'polite'
    );
  }, [announce]);

  // Alarm interaction guidance
  const announceInteractionHelp = useCallback(() => {
    announce(
      'Alarm interaction help: Tap to snooze, swipe up to dismiss, double tap for options, long press for challenge mode. Say \"Stop alarm\" for voice control.',
      'polite'
    );
  }, [announce]);

  const announceVoiceCommandHelp = useCallback(() => {
    announce(
      'Voice commands available: \"Stop alarm\", \"Snooze for 5 minutes\", \"Dismiss alarm\", \"What time is it\", \"Help\". Speak clearly.',
      'polite'
    );
  }, [announce]);

  return {
    announceAlarmStart,
    announceAlarmSnooze,
    announceAlarmDismiss,
    announceAlarmChallenge,
    announceChallengeProgress,
    announceChallengeCompleted,
    announceChallengeFailure,
    announceVolumeChange,
    announceSoundChange,
    announceSoundError,
    announceBattleAlarmStart,
    announceBattleResult,
    announceSmartAdjustment,
    announceOptimalWakeTime,
    announceWeatherAdjustment,
    announceRecurringAlarmInfo,
    announceEmergencyAlarm,
    announceBackupAlarm,
    announceLocationAlarm,
    announceProximityAlarm,
    announceVibrationMode,
    announceFlashMode,
    announceAccessibilityMode,
    announceInteractionHelp,
    announceVoiceCommandHelp
  };
}