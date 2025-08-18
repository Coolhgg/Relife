import { useCallback } from 'react';
import { useScreenReaderAnnouncements } from './useScreenReaderAnnouncements';
import type { 
  CustomSound, 
  Playlist, 
  MotivationalQuote, 
  PhotoChallenge, 
  MediaLibrary,
  ContentPreferences 
} from '../types/index';

export function useMediaContentAnnouncements() {
  const { announce } = useScreenReaderAnnouncements();

  // Tab navigation announcements
  const announceTabChange = useCallback((tabName: string) => {
    const tabDescriptions: Record<string, string> = {
      sounds: 'Sounds tab selected. Browse and manage audio content for alarms.',
      playlists: 'Playlists tab selected. Create and manage custom sound playlists.',
      quotes: 'Quotes tab selected. Browse and submit motivational quotes.',
      challenges: 'Photo challenges tab selected. Complete photo challenges for rewards.'
    };
    
    const description = tabDescriptions[tabName] || `${tabName} tab selected`;
    announce(description, 'polite');
  }, [announce]);

  // Audio playback announcements
  const announceAudioPlayback = useCallback((sound: CustomSound, isPlaying: boolean) => {
    const action = isPlaying ? 'playing' : 'paused';
    const message = `${sound.name} ${action}. Duration: ${Math.floor(sound.duration / 60)} minutes and ${sound.duration % 60} seconds. Category: ${sound.category}.`;
    announce(message, 'polite');
  }, [announce]);

  const announceAudioEnd = useCallback((sound: CustomSound) => {
    announce(`${sound.name} finished playing.`, 'polite');
  }, [announce]);

  // Search announcements
  const announceSearchResults = useCallback((query: string, resultCount: number) => {
    if (query.trim() === '') {
      announce('Search cleared. Showing all sounds.', 'polite');
    } else {
      announce(`Found ${resultCount} sound${resultCount === 1 ? '' : 's'} matching "${query}".`, 'polite');
    }
  }, [announce]);

  // Upload announcements
  const announceUploadStart = useCallback((fileName: string) => {
    announce(`Starting upload of ${fileName}. Please wait...`, 'polite');
  }, [announce]);

  const announceUploadComplete = useCallback((sound: CustomSound) => {
    announce(`Upload completed! ${sound.name} has been added to your custom sounds library.`, 'assertive');
  }, [announce]);

  const announceUploadError = useCallback((error: string) => {
    announce(`Upload failed: ${error}. Please try again.`, 'assertive');
  }, [announce]);

  // Storage announcements
  const announceStorageStatus = useCallback((used: number, total: number, percentage: number) => {
    const usedMB = Math.round(used / (1024 * 1024));
    const totalMB = Math.round(total / (1024 * 1024));
    
    let message = `Storage: ${usedMB} MB used of ${totalMB} MB total. ${percentage}% capacity.`;
    
    if (percentage >= 90) {
      message += ' Warning: Storage almost full!';
    } else if (percentage >= 75) {
      message += ' Storage getting full.';
    }
    
    announce(message, percentage >= 90 ? 'assertive' : 'polite');
  }, [announce]);

  // Playlist announcements
  const announcePlaylistAction = useCallback((action: 'created' | 'updated' | 'deleted' | 'played', playlist: Playlist) => {
    let message = '';
    
    switch (action) {
      case 'created':
        message = `Playlist "${playlist.name}" created with ${playlist.sounds.length} sound${playlist.sounds.length === 1 ? '' : 's'}.`;
        break;
      case 'updated':
        message = `Playlist "${playlist.name}" updated. Now contains ${playlist.sounds.length} sound${playlist.sounds.length === 1 ? '' : 's'}.`;
        break;
      case 'deleted':
        message = `Playlist "${playlist.name}" deleted.`;
        break;
      case 'played':
        message = `Playing playlist "${playlist.name}" with ${playlist.sounds.length} sound${playlist.sounds.length === 1 ? '' : 's'}.`;
        break;
    }
    
    announce(message, action === 'deleted' ? 'assertive' : 'polite');
  }, [announce]);

  const announcePlaylistProgress = useCallback((playlist: Playlist, currentIndex: number, totalSounds: number) => {
    const currentSound = playlist.sounds[currentIndex]?.sound;
    if (currentSound) {
      announce(
        `Playing sound ${currentIndex + 1} of ${totalSounds} in playlist "${playlist.name}": ${currentSound.name}.`,
        'polite'
      );
    }
  }, [announce]);

  // Quote announcements
  const announceQuoteAction = useCallback((action: 'submitted' | 'liked' | 'used' | 'browsing', quote: MotivationalQuote) => {
    let message = '';
    
    switch (action) {
      case 'submitted':
        message = `Quote submitted: "${quote.text.substring(0, 50)}${quote.text.length > 50 ? '...' : ''}" by ${quote.author || 'Anonymous'}.`;
        break;
      case 'liked':
        message = `Quote liked: "${quote.text.substring(0, 30)}${quote.text.length > 30 ? '...' : ''}" Now has ${quote.likes + 1} likes.`;
        break;
      case 'used':
        message = `Quote selected for alarm: "${quote.text.substring(0, 50)}${quote.text.length > 50 ? '...' : ''}" by ${quote.author || 'Anonymous'}.`;
        break;
      case 'browsing':
        message = `Quote: "${quote.text}" by ${quote.author || 'Anonymous'}. ${quote.likes} likes, used in ${quote.uses} alarms.`;
        break;
    }
    
    announce(message, action === 'used' ? 'assertive' : 'polite');
  }, [announce]);

  // Photo challenge announcements
  const announcePhotoChallengeAction = useCallback((action: 'started' | 'completed' | 'failed' | 'uploaded', challenge: PhotoChallenge, details?: { xp?: number; badge?: string }) => {
    let message = '';
    
    switch (action) {
      case 'started':
        message = `Photo challenge started: ${challenge.name}. ${challenge.description}. Time limit: ${challenge.timeLimit} minutes.`;
        break;
      case 'completed':
        message = `Congratulations! Photo challenge completed: ${challenge.name}.`;
        if (details?.xp) {
          message += ` You earned ${details.xp} experience points`;
        }
        if (details?.badge) {
          message += ` and the ${details.badge} badge`;
        }
        message += '!';
        break;
      case 'failed':
        message = `Photo challenge expired: ${challenge.name}. You can try again tomorrow!`;
        break;
      case 'uploaded':
        message = `Photo uploaded for challenge: ${challenge.name}. Waiting for review and rewards.`;
        break;
    }
    
    announce(message, action === 'completed' ? 'assertive' : 'polite');
  }, [announce]);

  const announcePhotoChallengeProgress = useCallback((challenge: PhotoChallenge, timeRemaining: number) => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    let message = `${challenge.name} challenge: ${minutes} minute${minutes === 1 ? '' : 's'}`;
    if (seconds > 0) {
      message += ` and ${seconds} second${seconds === 1 ? '' : 's'}`;
    }
    message += ' remaining.';
    
    announce(message, 'polite');
  }, [announce]);

  // Content preferences announcements
  const announcePreferenceChange = useCallback((setting: string, newValue: any, description: string) => {
    let message = '';
    
    if (typeof newValue === 'boolean') {
      message = `${setting} ${newValue ? 'enabled' : 'disabled'}. ${description}`;
    } else {
      message = `${setting} changed to ${newValue}. ${description}`;
    }
    
    announce(message, 'polite');
  }, [announce]);

  // Sharing announcements
  const announceShare = useCallback((contentType: 'sound' | 'playlist' | 'quote', contentName: string) => {
    announce(`${contentType} "${contentName}" shared successfully!`, 'polite');
  }, [announce]);

  // Download announcements
  const announceDownload = useCallback((contentType: 'sound' | 'playlist', contentName: string, action: 'started' | 'completed' | 'failed') => {
    let message = '';
    
    switch (action) {
      case 'started':
        message = `Starting download of ${contentType} "${contentName}".`;
        break;
      case 'completed':
        message = `Download completed: ${contentType} "${contentName}" is now available offline.`;
        break;
      case 'failed':
        message = `Download failed for ${contentType} "${contentName}". Please check your connection and try again.`;
        break;
    }
    
    announce(message, action === 'failed' ? 'assertive' : 'polite');
  }, [announce]);

  // Rating and feedback announcements
  const announceRating = useCallback((contentType: 'sound' | 'playlist' | 'quote', contentName: string, rating: number, maxRating: number) => {
    announce(
      `${contentType} "${contentName}" rated ${rating} out of ${maxRating} stars.`,
      'polite'
    );
  }, [announce]);

  // Click-to-hear detailed information
  const announceDetailedSoundInfo = useCallback((sound: CustomSound) => {
    const duration = `${Math.floor(sound.duration / 60)} minutes and ${sound.duration % 60} seconds`;
    const tags = sound.tags.join(', ');
    
    let message = `Detailed sound information: ${sound.name}. ${sound.description}. Duration: ${duration}. Category: ${sound.category}.`;
    
    if (sound.tags.length > 0) {
      message += ` Tags: ${tags}.`;
    }
    
    if (!sound.isCustom && sound.rating) {
      message += ` Rating: ${sound.rating} out of 5 stars with ${sound.downloads} downloads.`;
    }
    
    if (sound.isCustom && sound.uploadedAt) {
      message += ` Custom sound uploaded on ${new Date(sound.uploadedAt).toLocaleDateString()}.`;
    }
    
    announce(message, 'polite');
  }, [announce]);

  const announceDetailedPlaylistInfo = useCallback((playlist: Playlist) => {
    let message = `Detailed playlist information: ${playlist.name}. ${playlist.description}. Contains ${playlist.sounds.length} sound${playlist.sounds.length === 1 ? '' : 's'}.`;
    
    if (playlist.playCount) {
      message += ` Played ${playlist.playCount} times.`;
    }
    
    if (playlist.likeCount) {
      message += ` ${playlist.likeCount} likes.`;
    }
    
    if (playlist.tags.length > 0) {
      message += ` Tags: ${playlist.tags.join(', ')}.`;
    }
    
    const soundNames = playlist.sounds.slice(0, 3).map(s => s.sound.name).join(', ');
    message += ` Sound preview: ${soundNames}`;
    if (playlist.sounds.length > 3) {
      message += ` and ${playlist.sounds.length - 3} more`;
    }
    message += '.';
    
    announce(message, 'polite');
  }, [announce]);

  const announceDetailedQuoteInfo = useCallback((quote: MotivationalQuote) => {
    let message = `Detailed quote information: "${quote.text}" by ${quote.author || 'Anonymous'}.`;
    
    message += ` Category: ${quote.category}. ${quote.likes} likes, used in ${quote.uses} alarms.`;
    
    if (quote.tags.length > 0) {
      message += ` Tags: ${quote.tags.join(', ')}.`;
    }
    
    if (quote.isCustom && quote.submittedAt) {
      message += ` Custom quote submitted on ${new Date(quote.submittedAt).toLocaleDateString()}.`;
    }
    
    announce(message, 'polite');
  }, [announce]);

  const announceDetailedChallengeInfo = useCallback((challenge: PhotoChallenge) => {
    let message = `Detailed photo challenge: ${challenge.name}. ${challenge.description}. Difficulty: ${challenge.difficulty}.`;
    
    if (challenge.timeLimit) {
      message += ` Time limit: ${challenge.timeLimit} minutes.`;
    }
    
    message += ` Requirements: ${challenge.prompts.filter(p => !p.optional).length} required, ${challenge.prompts.filter(p => p.optional).length} optional.`;
    
    const rewards = challenge.rewards.map(r => `${r.value} ${r.description}`).join(', ');
    message += ` Rewards: ${rewards}.`;
    
    message += ` Popularity: ${challenge.popularity}%. Completion rate: ${challenge.completionRate}%.`;
    
    announce(message, 'polite');
  }, [announce]);

  return {
    announceTabChange,
    announceAudioPlayback,
    announceAudioEnd,
    announceSearchResults,
    announceUploadStart,
    announceUploadComplete,
    announceUploadError,
    announceStorageStatus,
    announcePlaylistAction,
    announcePlaylistProgress,
    announceQuoteAction,
    announcePhotoChallengeAction,
    announcePhotoChallengeProgress,
    announcePreferenceChange,
    announceShare,
    announceDownload,
    announceRating,
    announceDetailedSoundInfo,
    announceDetailedPlaylistInfo,
    announceDetailedQuoteInfo,
    announceDetailedChallengeInfo
  };
}