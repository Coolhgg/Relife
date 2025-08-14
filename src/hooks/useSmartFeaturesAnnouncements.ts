import { useCallback } from 'react';
import { useScreenReaderAnnouncements } from './useScreenReaderAnnouncements';
import type { 
  WeatherData, 
  LocationChallenge, 
  FitnessIntegration, 
  FitnessChallenge,
  SmartAlarmSettings 
} from '../types/index';

export function useSmartFeaturesAnnouncements() {
  const { announce } = useScreenReaderAnnouncements();

  // Tab navigation announcements
  const announceTabChange = useCallback((tabName: string) => {
    const tabDescriptions: Record<string, string> = {
      weather: 'Weather tab selected. View weather-smart alarm features and forecasts.',
      location: 'Location tab selected. Manage location-based challenges and track progress.',
      fitness: 'Fitness tab selected. View fitness data, connected apps, and active challenges.',
      settings: 'Settings tab selected. Configure smart alarm features and privacy settings.'
    };
    
    const description = tabDescriptions[tabName] || `${tabName} tab selected`;
    announce(description, 'polite');
  }, [announce]);

  // Weather announcements
  const announceWeatherUpdate = useCallback((weatherData: WeatherData) => {
    const condition = weatherData.condition.replace('_', ' ');
    announce(
      `Weather updated. Currently ${weatherData.temperature} degrees celsius and ${condition} in ${weatherData.location}. Humidity at ${weatherData.humidity} percent.`,
      'polite'
    );
  }, [announce]);

  const announceWeatherAdjustment = useCallback((adjustment: { type: string; message: string; timeChange?: number }) => {
    let message = `Smart alarm adjustment: ${adjustment.message}`;
    if (adjustment.timeChange) {
      message += ` Your alarm will ring ${Math.abs(adjustment.timeChange)} minutes ${adjustment.timeChange > 0 ? 'later' : 'earlier'}.`;
    }
    announce(message, 'assertive');
  }, [announce]);

  // Location challenge announcements
  const announceLocationChallengeStatus = useCallback((challenge: LocationChallenge, action: 'created' | 'started' | 'completed' | 'failed' | 'updated') => {
    let message = '';
    
    switch (action) {
      case 'created':
        message = `New location challenge created: ${challenge.name}. ${challenge.description}`;
        break;
      case 'started':
        message = `Location challenge started: ${challenge.name}. Navigate to ${challenge.targetLocation.name} within ${challenge.radius} meters.`;
        break;
      case 'completed':
        const xpReward = challenge.rewards.find(r => r.type === 'experience')?.value || 0;
        message = `Congratulations! Challenge completed: ${challenge.name}. You earned ${xpReward} experience points!`;
        break;
      case 'failed':
        message = `Challenge expired: ${challenge.name}. Try again tomorrow for another chance!`;
        break;
      case 'updated':
        message = `Challenge progress updated: ${challenge.name}. You are ${challenge.progress.distanceToTarget} meters away from the target.`;
        break;
    }
    
    announce(message, action === 'completed' ? 'assertive' : 'polite');
  }, [announce]);

  const announceLocationProgress = useCallback((challenge: LocationChallenge) => {
    const distance = challenge.progress.distanceToTarget;
    const timeInRadius = challenge.progress.timeInRadius || 0;
    
    let message = `${challenge.name} progress update.`;
    
    if (distance <= challenge.radius) {
      message += ` You are now within the target area! `;
      if (challenge.type === 'stay_duration') {
        message += `You have been in the area for ${timeInRadius} minutes.`;
      }
    } else {
      message += ` You are ${distance} meters away from the target location.`;
    }
    
    announce(message, 'polite');
  }, [announce]);

  // Fitness announcements
  const announceFitnessDataUpdate = useCallback((data: { steps: number; sleepHours: number; activeMinutes: number; distance: number }) => {
    announce(
      `Fitness data updated. Today you have taken ${data.steps.toLocaleString()} steps, slept for ${data.sleepHours} hours, been active for ${data.activeMinutes} minutes, and traveled ${(data.distance / 1000).toFixed(1)} kilometers.`,
      'polite'
    );
  }, [announce]);

  const announceFitnessIntegration = useCallback((integration: FitnessIntegration, action: 'connected' | 'disconnected' | 'synced') => {
    const providerName = integration.provider.replace('_', ' ');
    let message = '';
    
    switch (action) {
      case 'connected':
        message = `${providerName} successfully connected! Your fitness data will now sync automatically.`;
        break;
      case 'disconnected':
        message = `${providerName} has been disconnected. Fitness challenges may not track automatically.`;
        break;
      case 'synced':
        message = `${providerName} data synchronized. Last sync completed at ${new Date(integration.lastSync).toLocaleTimeString()}.`;
        break;
    }
    
    announce(message, 'polite');
  }, [announce]);

  const announceFitnessChallengeProgress = useCallback((challenge: FitnessChallenge) => {
    const progressPercent = Math.round((challenge.currentValue / challenge.targetValue) * 100);
    const remainingValue = challenge.targetValue - challenge.currentValue;
    
    let message = `${challenge.name} progress update. You are ${progressPercent} percent complete with ${remainingValue.toLocaleString()} ${challenge.unit} remaining.`;
    
    if (challenge.completed) {
      const xpReward = challenge.rewards.find(r => r.type === 'experience')?.value || 0;
      message += ` Challenge completed! You earned ${xpReward} experience points.`;
    } else if (progressPercent >= 75) {
      message += ` You are almost there! Keep going!`;
    } else if (progressPercent >= 50) {
      message += ` You are halfway to your goal!`;
    }
    
    announce(message, challenge.completed ? 'assertive' : 'polite');
  }, [announce]);

  // Settings announcements
  const announceSettingChange = useCallback((settingName: string, newValue: boolean | number, description: string) => {
    let message = '';
    
    if (typeof newValue === 'boolean') {
      message = `${settingName} ${newValue ? 'enabled' : 'disabled'}. ${description}`;
    } else {
      message = `${settingName} set to ${newValue}. ${description}`;
    }
    
    announce(message, 'polite');
  }, [announce]);

  const announcePermissionStatus = useCallback((permission: string, status: 'granted' | 'denied' | 'required') => {
    let message = '';
    
    switch (status) {
      case 'granted':
        message = `${permission} permission granted. Smart features are now available.`;
        break;
      case 'denied':
        message = `${permission} permission denied. Some smart features may not work properly.`;
        break;
      case 'required':
        message = `${permission} permission is required for optimal smart alarm functionality.`;
        break;
    }
    
    announce(message, status === 'denied' ? 'assertive' : 'polite');
  }, [announce]);

  // Challenge creation announcements
  const announceCreateChallenge = useCallback(() => {
    announce('Creating new location challenge. Configure your challenge settings and save to activate.', 'polite');
  }, [announce]);

  const announceConnectFitnessApp = useCallback((provider: string) => {
    announce(`Connecting to ${provider.replace('_', ' ')}. Please follow the authentication process to link your account.`, 'polite');
  }, [announce]);

  // Navigation announcements
  const announceNavigateToChallenge = useCallback((challengeName: string, targetLocation: string) => {
    announce(`Opening navigation to ${targetLocation} for challenge: ${challengeName}. Follow the directions to reach your destination.`, 'assertive');
  }, [announce]);

  // Click-to-hear functionality for detailed information
  const announceDetailedWeather = useCallback((weatherData: WeatherData) => {
    const forecast = weatherData.forecast.map(f => 
      `${f.time}: ${f.temperature} degrees, ${f.condition.replace('_', ' ')}${f.precipitation > 0 ? `, ${f.precipitation} percent chance of rain` : ''}`
    ).join('. ');
    
    announce(
      `Detailed weather information. Currently ${weatherData.temperature} degrees celsius and ${weatherData.condition.replace('_', ' ')} in ${weatherData.location}. Humidity ${weatherData.humidity} percent, wind speed ${weatherData.windSpeed} kilometers per hour. Tomorrow's forecast: ${forecast}`,
      'polite'
    );
  }, [announce]);

  const announceDetailedChallenge = useCallback((challenge: LocationChallenge) => {
    let message = `Detailed challenge information for ${challenge.name}. ${challenge.description}. `;
    
    message += `Challenge type: ${challenge.type.replace('_', ' ')}. `;
    message += `Target location: ${challenge.targetLocation.name}. `;
    message += `Required radius: ${challenge.radius} meters. `;
    
    if (challenge.timeLimit) {
      message += `Time limit: ${challenge.timeLimit} minutes. `;
    }
    
    const rewards = challenge.rewards.map(r => `${r.value} ${r.description}`).join(', ');
    message += `Rewards: ${rewards}. `;
    
    message += `Current status: ${challenge.status}. `;
    message += `Distance to target: ${challenge.progress.distanceToTarget} meters.`;
    
    announce(message, 'polite');
  }, [announce]);

  const announceDetailedFitnessChallenge = useCallback((challenge: FitnessChallenge) => {
    const progressPercent = Math.round((challenge.currentValue / challenge.targetValue) * 100);
    const remainingValue = challenge.targetValue - challenge.currentValue;
    
    let message = `Detailed fitness challenge: ${challenge.name}. ${challenge.description}. `;
    message += `Difficulty: ${challenge.difficulty}. `;
    message += `Target: ${challenge.targetValue.toLocaleString()} ${challenge.unit}. `;
    message += `Current progress: ${challenge.currentValue.toLocaleString()} ${challenge.unit}, which is ${progressPercent} percent complete. `;
    message += `Remaining: ${remainingValue.toLocaleString()} ${challenge.unit}. `;
    
    const rewards = challenge.rewards.map(r => `${r.value} ${r.description}`).join(', ');
    message += `Rewards: ${rewards}. `;
    
    if (challenge.expiresAt) {
      const expiresAt = new Date(challenge.expiresAt);
      message += `Expires at ${expiresAt.toLocaleString()}.`;
    }
    
    announce(message, 'polite');
  }, [announce]);

  return {
    announceTabChange,
    announceWeatherUpdate,
    announceWeatherAdjustment,
    announceLocationChallengeStatus,
    announceLocationProgress,
    announceFitnessDataUpdate,
    announceFitnessIntegration,
    announceFitnessChallengeProgress,
    announceSettingChange,
    announcePermissionStatus,
    announceCreateChallenge,
    announceConnectFitnessApp,
    announceNavigateToChallenge,
    announceDetailedWeather,
    announceDetailedChallenge,
    announceDetailedFitnessChallenge
  };
}