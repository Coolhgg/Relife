import type { VoiceMood, VoiceMoodConfig, Alarm } from '../types';

export const VOICE_MOODS: VoiceMoodConfig[] = [
  {
    id: 'drill-sergeant',
    name: 'Drill Sergeant',
    description: 'Aggressive wake-up call',
    icon: '🪖',
    color: 'bg-red-600',
    sample: 'WAKE UP SOLDIER! No excuses, time to MOVE!'
  },
  {
    id: 'sweet-angel',
    name: 'Sweet Angel',
    description: 'Gentle and caring',
    icon: '😇',
    color: 'bg-pink-500',
    sample: 'Good morning sunshine! Time to start your beautiful day.'
  },
  {
    id: 'anime-hero',
    name: 'Anime Hero',
    description: 'Energetic and inspiring',
    icon: '⚡',
    color: 'bg-yellow-500',
    sample: 'The power of friendship compels you to wake up!'
  },
  {
    id: 'savage-roast',
    name: 'Savage Roast',
    description: 'Brutally honest wake-up',
    icon: '🔥',
    color: 'bg-orange-600',
    sample: 'Oh look, sleeping beauty finally decided to join the world.'
  },
  {
    id: 'motivational',
    name: 'Motivational',
    description: 'Positive and uplifting',
    icon: '💪',
    color: 'bg-blue-600',
    sample: 'Champions rise early! Today is your day to shine!'
  },
  {
    id: 'gentle',
    name: 'Gentle',
    description: 'Soft and soothing',
    icon: '🌸',
    color: 'bg-purple-500',
    sample: 'Take your time, but please wake up when you're ready.'
  }
];

export const DAYS_OF_WEEK = [
  { id: 0, short: 'Sun', full: 'Sunday' },
  { id: 1, short: 'Mon', full: 'Monday' },
  { id: 2, short: 'Tue', full: 'Tuesday' },
  { id: 3, short: 'Wed', full: 'Wednesday' },
  { id: 4, short: 'Thu', full: 'Thursday' },
  { id: 5, short: 'Fri', full: 'Friday' },
  { id: 6, short: 'Sat', full: 'Saturday' }
];

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatDays = (days: number[]): string => {
  if (days.length === 0) return 'Never';
  if (days.length === 7) return 'Daily';
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
  
  return days
    .sort()
    .map(day => DAYS_OF_WEEK[day].short)
    .join(', ');
};

export const getNextAlarmTime = (alarm: Alarm): Date | null => {
  if (!alarm.enabled || alarm.days.length === 0) return null;

  const now = new Date();
  const [hours, minutes] = alarm.time.split(':').map(Number);
  
  // Check today first
  const today = new Date();
  today.setHours(hours, minutes, 0, 0);
  
  if (today > now && alarm.days.includes(now.getDay())) {
    return today;
  }
  
  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + i);
    nextDay.setHours(hours, minutes, 0, 0);
    
    if (alarm.days.includes(nextDay.getDay())) {
      return nextDay;
    }
  }
  
  return null;
};

export const generateAlarmId = (): string => {
  return `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getVoiceMoodConfig = (mood: VoiceMood): VoiceMoodConfig => {
  return VOICE_MOODS.find(vm => vm.id === mood) || VOICE_MOODS[0];
};

export const isAlarmTime = (alarm: Alarm): boolean => {
  if (!alarm.enabled) return false;
  
  const now = new Date();
  const [hours, minutes] = alarm.time.split(':').map(Number);
  
  return (
    now.getHours() === hours &&
    now.getMinutes() === minutes &&
    alarm.days.includes(now.getDay())
  );
};

export const getTimeUntilNextAlarm = (alarms: Alarm[]): { alarm: Alarm | null; timeUntil: string } => {
  const enabledAlarms = alarms.filter(a => a.enabled && a.days.length > 0);
  
  if (enabledAlarms.length === 0) {
    return { alarm: null, timeUntil: 'No alarms set' };
  }
  
  let nextAlarm: Alarm | null = null;
  let nextTime: Date | null = null;
  
  enabledAlarms.forEach(alarm => {
    const alarmTime = getNextAlarmTime(alarm);
    if (alarmTime && (!nextTime || alarmTime < nextTime)) {
      nextTime = alarmTime;
      nextAlarm = alarm;
    }
  });
  
  if (!nextTime || !nextAlarm) {
    return { alarm: null, timeUntil: 'No upcoming alarms' };
  }
  
  const now = new Date();
  const diff = (nextTime as Date).getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return {
      alarm: nextAlarm,
      timeUntil: `${hours}h ${minutes}m`
    };
  } else {
    return {
      alarm: nextAlarm,
      timeUntil: `${minutes}m`
    };
  }
};

export const playNotificationSound = async (): Promise<void> => {
  try {
    const audio = new Audio('/notification.mp3');
    await audio.play();
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
};

export const validateAlarmForm = (data: { time: string; label: string; days: number[] }): string[] => {
  const errors: string[] = [];
  
  if (!data.time || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
    errors.push('Valid time is required');
  }
  
  if (!data.label || data.label.trim().length < 1) {
    errors.push('Alarm label is required');
  }
  
  if (data.label && data.label.length > 50) {
    errors.push('Alarm label must be 50 characters or less');
  }
  
  if (data.days.length === 0) {
    errors.push('At least one day must be selected');
  }
  
  return errors;
};