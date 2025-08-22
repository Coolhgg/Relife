// Media types for the audio system
export interface CustomSound {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  duration: number; // seconds
  category: SoundCategory;
  tags: string[];
  isCustom: boolean;
  uploadedBy?: string;
  uploadedAt?: string;
  downloads?: number;
  rating?: number;
  // Audio optimization fields
  format?: string;
  size?: number;
  compressionLevel?: 'none' | 'light' | 'medium' | 'heavy';
  isPreloaded?: boolean;
}

export type SoundCategory =
  | 'nature'
  | 'music'
  | 'voice'
  | 'mechanical'
  | 'ambient'
  | 'energetic'
  | 'calm'
  | 'custom';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  sounds: PlaylistSound[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  playCount: number;
  likeCount: number;
  shareCount: number;
  // Optimization fields
  totalDuration?: number;
  isPreloaded?: boolean;
  preloadPriority?: 'low' | 'medium' | 'high';
}

export interface PlaylistSound {
  soundId: string;
  sound: CustomSound;
  order: number;
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
  volume?: number; // 0-1
  startTime?: number; // seconds into the sound to start
  endTime?: number; // seconds into the sound to end
}

export interface MotivationalQuote {
  id: string;
  text: string;
  author?: string;
  category: QuoteCategory;
  tags: string[];
  isCustom: boolean;
  submittedBy?: string;
  submittedAt?: string;
  likes: number;
  uses: number;
}

export type QuoteCategory =
  | 'motivation'
  | 'inspiration'
  | 'success'
  | 'health'
  | 'productivity'
  | 'mindfulness'
  | 'humor'
  | 'custom';

// Audio loading and optimization interfaces
export interface AudioLoadOptions {
  priority?: 'low' | 'medium' | 'high' | 'critical';
  progressive?: boolean;
  compression?: 'none' | 'light' | 'medium' | 'heavy';
  cacheKey?: string;
  preload?: boolean;
  maxSize?: number; // bytes
  timeout?: number; // milliseconds
}

export interface AudioPlaybackOptions {
  volume?: number; // 0-1
  loop?: boolean;
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
  startTime?: number; // seconds
  endTime?: number; // seconds
  playbackRate?: number; // 0.5-2.0
  onEnded?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onError?: (error: Error) => void;
}

export interface MediaLibrary {
  id: string;
  userId: string;
  sounds: CustomSound[];
  playlists: Playlist[];
  quotes: MotivationalQuote[];
  storage: StorageInfo;
  // Optimization settings
  cacheSettings: CacheSettings;
  compressionSettings: CompressionSettings;
}

export interface StorageInfo {
  used: number; // bytes
  total: number; // bytes
  percentage: number;
  audioCache: number; // bytes used by audio cache
  availableForPreload: number; // bytes available for preloading
}

export interface CacheSettings {
  maxCacheSize: number; // bytes
  preloadDistance: number; // minutes before alarm
  compressionEnabled: boolean;
  priorityLoading: boolean;
  autoCleanup: boolean;
  cleanupThreshold: number; // percentage
}

export interface CompressionSettings {
  enabledForLargeFiles: boolean;
  largeFileThreshold: number; // bytes
  defaultCompressionLevel: 'none' | 'light' | 'medium' | 'heavy';
  preserveQualityForFavorites: boolean;
}

// Enhanced alarm type with media support
export interface EnhancedAlarm {
  id: string;
  userId?: string;
  time: string;
  label: string;
  enabled: boolean;
  days: number[];
  voiceMood: import('../types').VoiceMood;
  snoozeCount: number;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Media enhancements
  customSound?: CustomSound;
  playlist?: Playlist;
  fallbackSound?: string;
  audioSettings: AudioPlaybackOptions;
  preloadEnabled: boolean;
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Audio format support
export interface AudioFormat {
  extension: string;
  mimeType: string;
  supported: boolean;
  compressionSupport: boolean;
  streamingSupport: boolean;
  quality: 'low' | 'medium' | 'high' | 'lossless';
}

export const SUPPORTED_AUDIO_FORMATS: AudioFormat[] = [
  {
    extension: 'mp3',
    mimeType: 'audio/mpeg',
    supported: true,
    compressionSupport: true,
    streamingSupport: true,
    quality: 'high',
  },
  {
    extension: 'wav',
    mimeType: 'audio/wav',
    supported: true,
    compressionSupport: false,
    streamingSupport: true,
    quality: 'lossless',
  },
  {
    extension: 'ogg',
    mimeType: 'audio/ogg',
    supported: true,
    compressionSupport: true,
    streamingSupport: true,
    quality: 'high',
  },
  {
    extension: 'm4a',
    mimeType: 'audio/mp4',
    supported: true,
    compressionSupport: true,
    streamingSupport: true,
    quality: 'high',
  },
  {
    extension: 'aac',
    mimeType: 'audio/aac',
    supported: true,
    compressionSupport: true,
    streamingSupport: true,
    quality: 'high',
  },
  {
    extension: 'flac',
    mimeType: 'audio/flac',
    supported: false,
    compressionSupport: false,
    streamingSupport: false,
    quality: 'lossless',
  },
  {
    extension: 'opus',
    mimeType: 'audio/opus',
    supported: true,
    compressionSupport: true,
    streamingSupport: true,
    quality: 'high',
  },
  {
    extension: 'weba',
    mimeType: 'audio/webm',
    supported: true,
    compressionSupport: true,
    streamingSupport: true,
    quality: 'high',
  },
];

// Progressive loading states
export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error' | 'cached';

export interface ProgressiveLoadingStatus {
  soundId: string;
  state: LoadingState;
  progress: number; // 0-100
  bytesLoaded: number;
  totalBytes: number;
  speed?: number; // bytes per second
  estimatedTimeRemaining?: number; // seconds
  error?: string;
}

// Audio analysis (for future features)
export interface AudioAnalysis {
  soundId: string;
  duration: number;
  peaks: number[]; // waveform peaks for visualization
  averageVolume: number;
  maxVolume: number;
  silenceDetection: SilenceSegment[];
  bpm?: number; // beats per minute for music
  key?: string; // musical key
  energy: number; // 0-1 scale
  valence: number; // 0-1 scale (happy/sad)
}

export interface SilenceSegment {
  start: number; // seconds
  end: number; // seconds
  duration: number; // seconds
}

// Content moderation for user uploads
export interface ModerationResult {
  approved: boolean;
  flagged: boolean;
  reasons: string[];
  confidence: number; // 0-1
  reviewRequired: boolean;
  automaticAction?: 'approve' | 'reject' | 'quarantine';
}

export interface ContentModerationSettings {
  enabledForUploads: boolean;
  enabledForGenerated: boolean;
  strictMode: boolean;
  customFilters: string[];
  allowedCategories: SoundCategory[];
  maxFileSizePerUser: number; // bytes
  maxFilesPerUser: number;
}
