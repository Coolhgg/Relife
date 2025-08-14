// User Profile-specific screen reader announcement hook
import { useCallback } from 'react';
import { useScreenReaderAnnouncements } from './useScreenReaderAnnouncements';
import type { VoiceMood } from '../types';

export function useProfileAnnouncements() {
  const { announce } = useScreenReaderAnnouncements();

  // Announce profile editing mode changes
  const announceEditModeToggle = useCallback((isEditing: boolean) => {
    const message = isEditing 
      ? 'Profile editing enabled. You can now modify your settings. Use Tab to navigate between fields.'
      : 'Profile editing disabled. Changes have been discarded.';
    
    announce({
      type: 'custom',
      message,
      priority: 'polite'
    });
  }, [announce]);

  // Announce preference changes
  const announcePreferenceChange = useCallback((settingName: string, newValue: any, description?: string) => {
    let message = '';
    
    if (typeof newValue === 'boolean') {
      message = `${settingName} ${newValue ? 'enabled' : 'disabled'}`;
    } else if (typeof newValue === 'number') {
      message = `${settingName} set to ${newValue}`;
    } else if (typeof newValue === 'string') {
      message = `${settingName} changed to ${newValue}`;
    }
    
    if (description) {
      message += `. ${description}`;
    }
    
    announce({
      type: 'custom',
      message,
      priority: 'polite'
    });
  }, [announce]);

  // Announce theme changes
  const announceThemeChange = useCallback((theme: 'light' | 'dark' | 'auto') => {
    const descriptions = {
      light: 'Interface will use bright colors',
      dark: 'Interface will use dark colors', 
      auto: 'Interface will follow system preferences'
    };
    
    announce({
      type: 'custom',
      message: `Theme changed to ${theme}. ${descriptions[theme]}.`,
      priority: 'polite'
    });
  }, [announce]);

  // Announce voice mood changes
  const announceVoiceMoodChange = useCallback((mood: VoiceMood, description?: string) => {
    const moodDescriptions: Record<VoiceMood, string> = {
      'motivational': 'Encouraging and uplifting',
      'gentle': 'Soft and calming',
      'drill-sergeant': 'Intense and commanding',
      'sweet-angel': 'Kind and nurturing',
      'anime-hero': 'Energetic and heroic',
      'savage-roast': 'Humorous and teasing'
    };
    
    const moodDescription = description || moodDescriptions[mood];
    
    announce({
      type: 'custom',
      message: `Default voice mood changed to ${mood}. ${moodDescription}.`,
      priority: 'polite'
    });
  }, [announce]);

  // Announce slider/range changes
  const announceSliderChange = useCallback((settingName: string, value: number, min: number, max: number, unit?: string) => {
    const percentage = Math.round(((value - min) / (max - min)) * 100);
    let intensityLevel = '';
    
    if (percentage <= 20) intensityLevel = 'Very low';
    else if (percentage <= 40) intensityLevel = 'Low';
    else if (percentage <= 60) intensityLevel = 'Medium';
    else if (percentage <= 80) intensityLevel = 'High';
    else intensityLevel = 'Very high';
    
    const unitText = unit ? ` ${unit}` : '';
    
    announce({
      type: 'custom',
      message: `${settingName} set to ${value}${unitText}. ${intensityLevel} level.`,
      priority: 'polite'
    });
  }, [announce]);

  // Announce numeric input changes
  const announceNumericChange = useCallback((settingName: string, value: number, unit?: string, context?: string) => {
    const unitText = unit ? ` ${unit}` : '';
    const contextText = context ? `. ${context}` : '';
    
    announce({
      type: 'custom',
      message: `${settingName} set to ${value}${unitText}${contextText}`,
      priority: 'polite'
    });
  }, [announce]);

  // Announce name changes
  const announceNameChange = useCallback((newName: string) => {
    if (newName.trim()) {
      announce({
        type: 'custom',
        message: `Name updated to ${newName}`,
        priority: 'polite'
      });
    } else {
      announce({
        type: 'custom',
        message: 'Name cleared',
        priority: 'polite'
      });
    }
  }, [announce]);

  // Announce profile save success
  const announceProfileSaved = useCallback((hasChanges: boolean = true) => {
    const message = hasChanges 
      ? 'Profile updated successfully. Your changes have been saved.'
      : 'Profile saved. No changes were made.';
    
    announce({
      type: 'success',
      message,
      priority: 'polite'
    });
  }, [announce]);

  // Announce profile save error
  const announceSaveError = useCallback((error: string) => {
    announce({
      type: 'error',
      message: `Failed to update profile: ${error}`,
      priority: 'assertive'
    });
  }, [announce]);

  // Announce cancel changes
  const announceCancelChanges = useCallback((hadChanges: boolean = true) => {
    const message = hadChanges 
      ? 'Changes cancelled. Profile has been reset to original values.'
      : 'Editing cancelled.';
    
    announce({
      type: 'custom',
      message,
      priority: 'polite'
    });
  }, [announce]);

  // Announce unsaved changes warning
  const announceUnsavedChanges = useCallback(() => {
    announce({
      type: 'custom',
      message: 'You have unsaved changes. Click Save to keep them or Cancel to discard.',
      priority: 'polite'
    });
  }, [announce]);

  // Announce profile section entry
  const announceProfileReady = useCallback((userName: string) => {
    announce({
      type: 'custom',
      message: `Profile page for ${userName}. Use the Edit Profile button to make changes to your settings.`,
      priority: 'polite'
    });
  }, [announce]);

  // Announce toggle groups
  const announceToggleGroup = useCallback((groupName: string, enabledCount: number, totalCount: number) => {
    const message = enabledCount === 0 
      ? `All ${groupName} settings are disabled`
      : enabledCount === totalCount 
      ? `All ${groupName} settings are enabled`
      : `${enabledCount} of ${totalCount} ${groupName} settings are enabled`;
    
    announce({
      type: 'custom',
      message,
      priority: 'polite'
    });
  }, [announce]);

  // Click-to-hear functionality for profile settings
  const announceSettingDescription = useCallback((settingName: string, currentValue: string, description: string, additionalInfo?: string) => {
    let message = `${settingName}. Current value: ${currentValue}. ${description}`;
    
    if (additionalInfo) {
      message += ` ${additionalInfo}`;
    }
    
    announce({
      type: 'custom',
      message,
      priority: 'polite'
    });
  }, [announce]);

  // Announce loading states
  const announceLoading = useCallback((isLoading: boolean, action: string = 'updating profile') => {
    const message = isLoading 
      ? `${action} in progress. Please wait.`
      : `${action} completed.`;
    
    announce({
      type: 'custom',
      message,
      priority: 'polite'
    });
  }, [announce]);

  return {
    announceEditModeToggle,
    announcePreferenceChange,
    announceThemeChange,
    announceVoiceMoodChange,
    announceSliderChange,
    announceNumericChange,
    announceNameChange,
    announceProfileSaved,
    announceSaveError,
    announceCancelChanges,
    announceUnsavedChanges,
    announceProfileReady,
    announceToggleGroup,
    announceSettingDescription,
    announceLoading
  };
}

export default useProfileAnnouncements;