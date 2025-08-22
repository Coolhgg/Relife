/**
 * Custom Sound Theme Types
 * Defines types for creating, managing, and using custom sound themes
 */

import type { SoundTheme, SoundEffectId } from '../services/sound-effects';

// Custom Sound Theme Structure
export interface CustomSoundTheme {
  id: string;
  name: string;
  displayName: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  isShared: boolean;
  version: string;
  category: CustomSoundThemeCategory;
  tags: string[];
  rating: number;
  downloads: number;
  popularity: number;

  // Theme configuration
  sounds: CustomSoundThemeSounds;
  metadata: CustomSoundThemeMetadata;
  preview: CustomSoundThemePreview;

  // Sharing and permissions
  sharedWith?: string[]; // user IDs
  permissions: CustomSoundThemePermissions;

  // Premium features
  isPremium: boolean;
  requiresSubscription: boolean;
}

export type CustomSoundThemeCategory =
  | 'ambient'
  | 'musical'
  | 'nature'
  | 'electronic'
  | 'voice'
  | 'experimental'
  | 'seasonal'
  | 'gaming'
  | 'professional'
  | 'relaxation'
  | 'energizing'
  | 'custom';

// Sound assignments for each category
export interface CustomSoundThemeSounds {
  ui: CustomThemeUISounds;
  notifications: CustomThemeNotificationSounds;
  alarms: CustomThemeAlarmSounds;
  ambient?: CustomThemeAmbientSounds;
}

export interface CustomThemeUISounds {
  click: CustomSoundAssignment;
  hover: CustomSoundAssignment;
  success: CustomSoundAssignment;
  error: CustomSoundAssignment;
  toggle?: CustomSoundAssignment;
  popup?: CustomSoundAssignment;
  slide?: CustomSoundAssignment;
  confirm?: CustomSoundAssignment;
  cancel?: CustomSoundAssignment;
}

export interface CustomThemeNotificationSounds {
  default: CustomSoundAssignment;
  alarm: CustomSoundAssignment;
  beep: CustomSoundAssignment;
  chime?: CustomSoundAssignment;
  ping?: CustomSoundAssignment;
  urgent?: CustomSoundAssignment;
}

export interface CustomThemeAlarmSounds {
  primary: CustomSoundAssignment;
  secondary: CustomSoundAssignment;
  gentle?: CustomSoundAssignment;
  energetic?: CustomSoundAssignment;
  nature?: CustomSoundAssignment;
  musical?: CustomSoundAssignment;
}

export interface CustomThemeAmbientSounds {
  background?: CustomSoundAssignment;
  white_noise?: CustomSoundAssignment;
  brown_noise?: CustomSoundAssignment;
  pink_noise?: CustomSoundAssignment;
}

// Individual sound assignment
export interface CustomSoundAssignment {
  type: CustomSoundType;
  source: string; // file URL, built-in sound ID, or generated sound config
  volume: number; // 0-1
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  delay?: number;

  // For custom uploaded sounds
  customSound?: CustomSound;

  // For generated sounds
  generatedConfig?: GeneratedSoundConfig;

  // For built-in sounds
  builtInSoundId?: SoundEffectId;
}

export type CustomSoundType =
  | 'uploaded' // User uploaded file
  | 'builtin' // Existing app sound
  | 'generated' // Procedurally generated
  | 'url' // External URL
  | 'tts'; // Text-to-speech generated

// Custom uploaded sound definition
export interface CustomSound {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  duration: number;
  format: string;
  sampleRate?: number;
  channels?: number;
  bitRate?: number;

  category: SoundCategory;
  tags: string[];

  isCustom: boolean;
  uploadedBy: string;
  uploadedAt: Date;
  lastUsed?: Date;

  // Usage analytics
  downloads: number;
  rating: number;
  reviews?: SoundReview[];

  // Audio analysis
  audioAnalysis?: AudioAnalysis;

  // Copyright and licensing
  license: SoundLicense;
  attribution?: string;
  copyrightInfo?: string;
}

export type SoundCategory =
  | 'ui'
  | 'notification'
  | 'alarm'
  | 'ambient'
  | 'voice'
  | 'music'
  | 'effect'
  | 'nature'
  | 'mechanical'
  | 'electronic'
  | 'organic';

export interface SoundReview {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  helpful: number; // helpful votes count
}

export interface AudioAnalysis {
  peaks: number[];
  rms: number;
  loudness: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  tempo?: number;
  key?: string;
  mood?: AudioMood;
  characteristics: AudioCharacteristics;
}

export type AudioMood =
  | 'calm'
  | 'energetic'
  | 'happy'
  | 'sad'
  | 'aggressive'
  | 'peaceful'
  | 'mysterious'
  | 'playful';

export interface AudioCharacteristics {
  isPercussive: boolean;
  isHarmonic: boolean;
  hasVoice: boolean;
  hasMusic: boolean;
  noiseLevel: number; // 0-1
  dynamicRange: number;
  frequency: {
    low: number;
    mid: number;
    high: number;
  };
}

export type SoundLicense =
  | 'public_domain'
  | 'creative_commons'
  | 'royalty_free'
  | 'personal_use'
  | 'commercial'
  | 'custom';

// Generated sound configuration
export interface GeneratedSoundConfig {
  type: GeneratedSoundType;
  parameters: GeneratedSoundParameters;
  seed?: number; // for reproducible generation
  duration: number;
}

export type GeneratedSoundType =
  | 'sine_wave'
  | 'square_wave'
  | 'sawtooth_wave'
  | 'triangle_wave'
  | 'noise'
  | 'fm_synthesis'
  | 'am_synthesis'
  | 'additive_synthesis'
  | 'subtractive_synthesis'
  | 'granular_synthesis';

export interface GeneratedSoundParameters {
  frequency?: number;
  frequencies?: number[]; // for additive synthesis
  amplitude?: number;
  modulation?: ModulationConfig;
  envelope?: EnvelopeConfig;
  filter?: FilterConfig;
  effects?: EffectConfig[];
  harmonics?: HarmonicConfig[];
}

export interface ModulationConfig {
  type: 'lfo' | 'envelope' | 'random';
  frequency: number;
  depth: number;
  target: 'frequency' | 'amplitude' | 'filter';
}

export interface EnvelopeConfig {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface FilterConfig {
  type: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
  frequency: number;
  resonance: number;
}

export interface EffectConfig {
  type: 'reverb' | 'delay' | 'chorus' | 'distortion' | 'compression';
  parameters: Record<string, number>;
}

export interface HarmonicConfig {
  frequency: number;
  amplitude: number;
  phase: number;
}

// Theme metadata and information
export interface CustomSoundThemeMetadata {
  totalSounds: number;
  totalDuration: number;
  totalFileSize: number;
  audioQuality: AudioQualityInfo;
  compatibility: CompatibilityInfo;
  features: CustomSoundThemeFeatures;
  requirements: CustomSoundThemeRequirements;
}

export interface AudioQualityInfo {
  averageBitRate: number;
  averageSampleRate: number;
  formatDistribution: Record<string, number>;
  qualityScore: number; // 0-10
}

export interface CompatibilityInfo {
  supportedPlatforms: Platform[];
  minAppVersion: string;
  browserCompatibility: BrowserCompatibility;
  deviceRequirements: DeviceRequirements;
}

export type Platform = 'web' | 'ios' | 'android' | 'desktop';

export interface BrowserCompatibility {
  chrome: boolean;
  firefox: boolean;
  safari: boolean;
  edge: boolean;
  webAudioAPI: boolean;
}

export interface DeviceRequirements {
  minRAM?: number; // MB
  minStorage?: number; // MB
  requiresInternet: boolean;
  requiresMicrophone?: boolean;
}

export interface CustomSoundThemeFeatures {
  hasGeneratedSounds: boolean;
  hasUploadedSounds: boolean;
  hasBuiltInSounds: boolean;
  hasAmbientSounds: boolean;
  hasVoiceSounds: boolean;
  hasMusicSounds: boolean;
  hasInteractiveSounds: boolean;
  hasAdaptiveSounds: boolean;
  supportsLoop: boolean;
  supportsFade: boolean;
  supportsVolumeControl: boolean;
}

export interface CustomSoundThemeRequirements {
  subscriptionTier: 'free' | 'premium' | 'pro';
  permissions: ThemePermission[];
  features: string[];
  maxFileSize: number;
  maxDuration: number;
}

export type ThemePermission =
  | 'microphone'
  | 'storage'
  | 'network'
  | 'notifications'
  | 'location';

// Theme preview and demonstration
export interface CustomSoundThemePreview {
  thumbnailUrl?: string;
  previewSounds: PreviewSound[];
  demoSequence: DemoSequence[];
  screenshots?: string[];
  description: string;
  highlights: string[];
}

export interface PreviewSound {
  id: string;
  name: string;
  category: SoundCategory;
  soundUrl: string;
  duration: number;
  description: string;
}

export interface DemoSequence {
  id: string;
  name: string;
  description: string;
  sounds: PreviewSound[];
  timing: DemoTiming[];
}

export interface DemoTiming {
  soundId: string;
  startTime: number; // seconds
  duration: number;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

// Permissions and sharing
export interface CustomSoundThemePermissions {
  canView: ThemePermissionLevel;
  canEdit: ThemePermissionLevel;
  canShare: ThemePermissionLevel;
  canDownload: ThemePermissionLevel;
  canRate: ThemePermissionLevel;
  canComment: ThemePermissionLevel;
}

export type ThemePermissionLevel =
  | 'public' // Anyone can access
  | 'registered' // Registered users only
  | 'friends' // Friends only
  | 'private' // Creator only
  | 'premium'; // Premium users only

// Theme creation and editing workflow
export interface CustomSoundThemeCreationSession {
  id: string;
  userId: string;
  themeId?: string; // if editing existing theme
  sessionType: 'create' | 'edit' | 'duplicate';

  // Current state
  currentTheme: Partial<CustomSoundTheme>;
  currentStep: CreationStep;
  completedSteps: CreationStep[];

  // Progress tracking
  progress: CreationProgress;
  startedAt: Date;
  lastSavedAt?: Date;
  autoSaveEnabled: boolean;

  // Temporary data
  uploadedFiles: UploadedFile[];
  generatedSounds: GeneratedSound[];
  selectedBuiltIns: SelectedBuiltInSound[];

  // Validation and errors
  validation: ValidationResult;
  errors: CreationError[];
  warnings: CreationWarning[];
}

export type CreationStep =
  | 'info' // Basic information
  | 'sounds' // Sound selection/upload
  | 'assignment' // Assign sounds to categories
  | 'customization' // Volume, effects, etc.
  | 'preview' // Preview and test
  | 'metadata' // Tags, description, etc.
  | 'sharing' // Privacy and sharing settings
  | 'publish'; // Final publish step

export interface CreationProgress {
  currentStep: CreationStep;
  stepProgress: number; // 0-100 for current step
  overallProgress: number; // 0-100 overall
  requiredFields: RequiredField[];
  optionalFields: OptionalField[];
  estimatedTimeRemaining?: number; // minutes
}

export interface RequiredField {
  field: string;
  completed: boolean;
  description: string;
}

export interface OptionalField {
  field: string;
  completed: boolean;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadProgress: number; // 0-100
  uploadedAt?: Date;
  audioData?: AudioBuffer;
  analysis?: AudioAnalysis;
  error?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

export interface GeneratedSound {
  id: string;
  name: string;
  config: GeneratedSoundConfig;
  audioBuffer?: AudioBuffer;
  audioUrl?: string;
  createdAt: Date;
  status: 'generating' | 'ready' | 'error';
  error?: string;
}

export interface SelectedBuiltInSound {
  id: string;
  soundId: SoundEffectId;
  name: string;
  category: SoundCategory;
  selected: boolean;
  customizations?: SoundCustomization;
}

export interface SoundCustomization {
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
  delay?: number;
  effects?: EffectConfig[];
}

export interface ValidationResult {
  isValid: boolean;
  completeness: number; // 0-100
  issues: ValidationIssue[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  canAutoFix: boolean;
  autoFixAction?: string;
}

export interface ValidationSuggestion {
  type: 'quality' | 'completeness' | 'optimization' | 'accessibility';
  message: string;
  action?: string;
  impact: 'high' | 'medium' | 'low';
}

export interface CreationError {
  id: string;
  type: 'upload' | 'generation' | 'validation' | 'save' | 'network';
  message: string;
  details?: string;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

export interface CreationWarning {
  id: string;
  type: 'quality' | 'compatibility' | 'performance' | 'legal';
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: Date;
  dismissed: boolean;
}

// Theme management and organization
export interface CustomSoundThemeCollection {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  themes: string[]; // theme IDs
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  popularity: number;
}

export interface CustomSoundThemeLibrary {
  userId: string;
  createdThemes: string[];
  favoriteThemes: string[];
  downloadedThemes: string[];
  collections: CustomSoundThemeCollection[];
  recentlyUsed: string[];
  recommendations: ThemeRecommendation[];
  settings: LibrarySettings;
}

export interface ThemeRecommendation {
  themeId: string;
  score: number; // 0-1
  reasons: string[];
  basedOn: RecommendationSource[];
}

export type RecommendationSource =
  | 'user_preferences'
  | 'usage_patterns'
  | 'similar_users'
  | 'trending'
  | 'ratings'
  | 'friend_activity';

export interface LibrarySettings {
  autoSync: boolean;
  autoUpdate: boolean;
  downloadQuality: 'low' | 'medium' | 'high';
  cacheLimit: number; // MB
  showRecommendations: boolean;
  notifyUpdates: boolean;
  organizationMethod: 'created' | 'name' | 'category' | 'rating' | 'recent';
}

// Import/Export functionality
export interface CustomSoundThemeExport {
  version: string;
  exportedAt: Date;
  exportType: 'single' | 'collection' | 'library';
  themes: CustomSoundTheme[];
  collections?: CustomSoundThemeCollection[];
  metadata: ExportMetadata;
  files: ExportFile[];
}

export interface ExportMetadata {
  appVersion: string;
  platform: string;
  userId?: string;
  includeAudioFiles: boolean;
  compression: 'none' | 'zip' | 'tar';
  encryption?: string;
}

export interface ExportFile {
  id: string;
  fileName: string;
  relativePath: string;
  size: number;
  checksum: string;
  mimeType: string;
}

export interface CustomSoundThemeImport {
  importType: 'file' | 'url' | 'backup';
  source: string;
  options: ImportOptions;
  result?: ImportResult;
}

export interface ImportOptions {
  overwriteExisting: boolean;
  validateAudio: boolean;
  convertFormats: boolean;
  skipIncompatible: boolean;
  importCollections: boolean;
  preserveIds: boolean;
}

export interface ImportResult {
  success: boolean;
  importedThemes: string[];
  skippedThemes: string[];
  errors: ImportError[];
  warnings: string[];
  totalSize: number;
  duration: number; // seconds
}

export interface ImportError {
  themeId?: string;
  fileName?: string;
  error: string;
  type: 'validation' | 'format' | 'size' | 'corruption' | 'permission';
  recoverable: boolean;
}

// Analytics and usage tracking
export interface CustomSoundThemeUsage {
  themeId: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  duration: number; // seconds
  interactionCount: number;
  soundsPlayed: string[];
  features: string[];
  context: UsageContext;
  satisfaction?: number; // 1-5 rating
}

export interface UsageContext {
  device: 'desktop' | 'mobile' | 'tablet';
  platform: Platform;
  location: 'home' | 'work' | 'travel' | 'other';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  activity: 'alarm' | 'notification' | 'ambient' | 'testing';
}

export interface CustomSoundThemeAnalytics {
  themeId: string;
  totalUses: number;
  totalDuration: number;
  uniqueUsers: number;
  averageRating: number;
  popularSounds: SoundPopularity[];
  usagePatterns: UsagePattern[];
  performanceMetrics: PerformanceMetrics;
  feedbackSummary: FeedbackSummary;
}

export interface SoundPopularity {
  soundId: string;
  soundName: string;
  playCount: number;
  averageDuration: number;
  skipRate: number;
  rating: number;
}

export interface UsagePattern {
  pattern: string;
  frequency: number;
  timePattern: TimePattern;
  contextPattern: ContextPattern;
}

export interface TimePattern {
  hourDistribution: number[]; // 24 hours
  dayDistribution: number[]; // 7 days
  monthDistribution: number[]; // 12 months
}

export interface ContextPattern {
  deviceDistribution: Record<string, number>;
  locationDistribution: Record<string, number>;
  activityDistribution: Record<string, number>;
}

export interface PerformanceMetrics {
  averageLoadTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  errorRate: number;
  latency: LatencyMetrics;
}

export interface LatencyMetrics {
  soundStart: number; // ms
  soundSwitch: number; // ms
  themeSwitch: number; // ms
  upload: number; // ms
}

export interface FeedbackSummary {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: number[]; // [1-star, 2-star, ..., 5-star]
  commonTags: TagFrequency[];
  sentimentScore: number; // -1 to 1
  topComplaints: string[];
  topPraises: string[];
}

export interface TagFrequency {
  tag: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// API response types
export interface CustomSoundThemeListResponse {
  themes: CustomSoundTheme[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  filters: AppliedFilter[];
  sorting: SortOption;
}

export interface AppliedFilter {
  field: string;
  operator: string;
  value: any;
  label: string;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

export interface CustomSoundThemeSearchRequest {
  query?: string;
  category?: CustomSoundThemeCategory[];
  tags?: string[];
  rating?: number; // minimum rating
  userId?: string; // specific user's themes
  isPublic?: boolean;
  isPremium?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'rating' | 'downloads' | 'created' | 'updated';
  sortDirection?: 'asc' | 'desc';
}

// Event types for the creation process
export type CustomSoundThemeEvent =
  | 'theme_created'
  | 'theme_updated'
  | 'theme_deleted'
  | 'theme_published'
  | 'theme_shared'
  | 'sound_uploaded'
  | 'sound_generated'
  | 'sound_assigned'
  | 'validation_completed'
  | 'export_completed'
  | 'import_completed';

export interface CustomSoundThemeEventData {
  event: CustomSoundThemeEvent;
  themeId?: string;
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
  sessionId?: string;
}
