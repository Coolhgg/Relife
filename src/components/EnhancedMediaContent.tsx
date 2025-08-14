import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import {
  Music,
  Upload,
  Download,
  Play,
  Pause,
  Heart,
  Share,
  Camera,
  Quote,
  Volume2,
  FileAudio,
  Star,
  Plus,
  Search,
  Filter,
  Shuffle,
  SkipForward,
  SkipBack,
  Mic,
  Headphones,
  MessageSquare,
  Sparkles,
  Trophy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Settings,
  VolumeX
} from 'lucide-react';

// Import our audio services
import { audioManager } from '../services/audio-manager';
import { lazyAudioLoader } from '../services/lazy-audio-loader';
import { useAudioLazyLoading, usePlaylistLazyLoading } from '../hooks/useAudioLazyLoading';
import { useEnhancedCaching } from '../hooks/useEnhancedCaching';
import type { CustomSound, Playlist, MotivationalQuote, MediaLibrary } from '../services/types/media';

interface EnhancedMediaContentProps {
  currentUser: { id: string; username: string; displayName: string };
  mediaLibrary?: MediaLibrary;
  onUploadSound?: (file: File) => Promise<void>;
  onCreatePlaylist?: (playlist: Partial<Playlist>) => Promise<void>;
  onSubmitQuote?: (quote: Partial<MotivationalQuote>) => Promise<void>;
  onCompletePhotoChallenge?: (challengeId: string, photo: File, caption?: string) => Promise<void>;
}

// Enhanced mock data with real audio capabilities
const ENHANCED_MOCK_SOUNDS: CustomSound[] = [
  {
    id: '1',
    name: 'Morning Birds',
    description: 'Peaceful chirping birds to start your day',
    fileName: 'morning-birds.mp3',
    fileUrl: 'https://www.soundjay.com/misc/sounds/nature.mp3', // Using placeholder URL
    duration: 120,
    category: 'nature',
    tags: ['peaceful', 'birds', 'morning'],
    isCustom: false,
    downloads: 1542,
    rating: 4.8,
    format: 'audio/mpeg',
    size: 1920000, // ~1.9MB
    compressionLevel: 'light'
  },
  {
    id: '2',
    name: 'Energetic Beat',
    description: 'Upbeat music to energize your morning',
    fileName: 'energetic-beat.mp3',
    fileUrl: 'https://www.soundjay.com/misc/sounds/energetic.mp3', // Using placeholder URL
    duration: 90,
    category: 'music',
    tags: ['upbeat', 'energetic', 'workout'],
    isCustom: false,
    downloads: 2103,
    rating: 4.6,
    format: 'audio/mpeg',
    size: 1440000, // ~1.4MB
    compressionLevel: 'medium'
  },
  {
    id: '3',
    name: 'Ocean Waves',
    description: 'Calming ocean waves for relaxation',
    fileName: 'ocean-waves.mp3',
    fileUrl: 'https://www.soundjay.com/misc/sounds/waves.mp3', // Using placeholder URL
    duration: 180,
    category: 'ambient',
    tags: ['ocean', 'waves', 'calm', 'relaxation'],
    isCustom: false,
    downloads: 890,
    rating: 4.7,
    format: 'audio/mpeg',
    size: 2880000, // ~2.8MB
    compressionLevel: 'light'
  }
];

const ENHANCED_MOCK_PLAYLISTS: Playlist[] = [
  {
    id: '1',
    name: 'Morning Energy',
    description: 'Perfect playlist to start your day with energy',
    sounds: [
      { soundId: '2', sound: ENHANCED_MOCK_SOUNDS[1], order: 1, volume: 0.8, fadeIn: 2 },
      { soundId: '1', sound: ENHANCED_MOCK_SOUNDS[0], order: 2, volume: 0.6, fadeIn: 5 }
    ],
    isPublic: true,
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['morning', 'energy', 'motivation'],
    playCount: 156,
    likeCount: 23,
    shareCount: 7,
    totalDuration: 210,
    isPreloaded: false
  }
];

interface AudioPlayerState {
  isPlaying: boolean;
  currentTrack: string | null;
  currentPlaylist: string | null;
  volume: number;
  currentTime: number;
  duration: number;
  loading: boolean;
  error: string | null;
}

export function EnhancedMediaContent({
  currentUser,
  mediaLibrary,
  onUploadSound,
  onCreatePlaylist,
  onSubmitQuote,
  onCompletePhotoChallenge
}: EnhancedMediaContentProps) {
  const [selectedTab, setSelectedTab] = useState('sounds');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Audio player state
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTrack: null,
    currentPlaylist: null,
    volume: 0.7,
    currentTime: 0,
    duration: 0,
    loading: false,
    error: null
  });

  // Audio context and source
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);
  const [audioSources, setAudioSources] = useState<Map<string, AudioBufferSourceNode>>(new Map());

  // Use our enhanced caching
  const { cacheState, warmCache, getCacheEntry } = useEnhancedCaching();

  // Mock media library if not provided
  const effectiveMediaLibrary: MediaLibrary = mediaLibrary || {
    id: '1',
    userId: currentUser.id,
    sounds: ENHANCED_MOCK_SOUNDS,
    playlists: ENHANCED_MOCK_PLAYLISTS,
    quotes: [
      {
        id: '1',
        text: 'The way to get started is to quit talking and begin doing.',
        author: 'Walt Disney',
        category: 'motivation',
        tags: ['action', 'success', 'start'],
        isCustom: false,
        likes: 342,
        uses: 1205
      }
    ],
    photos: [],
    storage: {
      used: cacheState.stats.totalSize,
      total: 104857600, // 100MB
      percentage: (cacheState.stats.totalSize / 104857600) * 100,
      audioCache: cacheState.stats.totalSize,
      availableForPreload: 104857600 - cacheState.stats.totalSize
    },
    cacheSettings: {
      maxCacheSize: 150 * 1024 * 1024,
      preloadDistance: 15,
      compressionEnabled: true,
      priorityLoading: true,
      autoCleanup: true,
      cleanupThreshold: 80
    },
    compressionSettings: {
      enabledForLargeFiles: true,
      largeFileThreshold: 1024 * 1024,
      defaultCompressionLevel: 'medium',
      preserveQualityForFavorites: true
    }
  };

  // Initialize audio manager
  useEffect(() => {
    audioManager.initialize();
    
    // Warm cache with popular sounds
    warmCache(effectiveMediaLibrary.sounds.slice(0, 5));
  }, []);

  // Audio loading hook for individual sounds
  const soundLoadingStates = new Map();
  effectiveMediaLibrary.sounds.forEach(sound => {
    const loadingState = useAudioLazyLoading(sound, 'medium');
    soundLoadingStates.set(sound.id, loadingState);
  });

  // Playlist loading hook
  const playlistLoadingState = usePlaylistLazyLoading(
    playerState.currentPlaylist ? 
      effectiveMediaLibrary.playlists.find(p => p.id === playerState.currentPlaylist) || null : 
      null
  );

  const playSound = useCallback(async (sound: CustomSound) => {
    setPlayerState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Stop current audio if playing
      if (currentAudioSource.current) {
        currentAudioSource.current.stop();
        currentAudioSource.current = null;
      }

      // Load and play audio using our audio manager
      const audioSource = await audioManager.playAudioFile(sound.fileUrl, {
        volume: playerState.volume,
        onEnded: () => {
          setPlayerState(prev => ({
            ...prev,
            isPlaying: false,
            currentTrack: null,
            currentTime: 0
          }));
        }
      });

      if (audioSource) {
        currentAudioSource.current = audioSource;
        setPlayerState(prev => ({
          ...prev,
          isPlaying: true,
          currentTrack: sound.id,
          loading: false,
          duration: sound.duration,
          currentTime: 0
        }));

        // Set up time updates
        const startTime = performance.now();
        const updateTime = () => {
          if (currentAudioSource.current === audioSource) {
            const elapsed = (performance.now() - startTime) / 1000;
            setPlayerState(prev => ({
              ...prev,
              currentTime: Math.min(elapsed, sound.duration)
            }));
            
            if (elapsed < sound.duration) {
              requestAnimationFrame(updateTime);
            }
          }
        };
        requestAnimationFrame(updateTime);
      } else {
        throw new Error('Failed to create audio source');
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      setPlayerState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));

      // Fallback to beep if audio fails
      try {
        await audioManager.playFallbackBeep('single');
      } catch (fallbackError) {
        console.error('Fallback beep also failed:', fallbackError);
      }
    }
  }, [playerState.volume]);

  const pauseSound = useCallback(() => {
    if (currentAudioSource.current) {
      currentAudioSource.current.stop();
      currentAudioSource.current = null;
    }
    setPlayerState(prev => ({
      ...prev,
      isPlaying: false,
      currentTrack: null
    }));
  }, []);

  const handleVolumeChange = useCallback((newVolume: number[]) => {
    const volume = newVolume[0] / 100;
    setPlayerState(prev => ({ ...prev, volume }));
    
    // Update current audio volume if playing
    // Note: Web Audio API doesn't allow real-time volume changes easily
    // In a real implementation, you'd use a GainNode for this
  }, []);

  const playPlaylist = useCallback(async (playlist: Playlist) => {
    if (playlist.sounds.length === 0) return;

    setPlayerState(prev => ({ ...prev, currentPlaylist: playlist.id }));
    
    // Start with the first sound
    const firstSound = playlist.sounds
      .sort((a, b) => a.order - b.order)[0];
    
    await playSound(firstSound.sound);
  }, [playSound]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + 10;
          if (next >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return next;
        });
      }, 200);

      // Call the upload handler if provided
      if (onUploadSound) {
        await onUploadSound(file);
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Filter sounds based on search and category
  const filteredSounds = effectiveMediaLibrary.sounds.filter(sound => {
    const matchesSearch = sound.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sound.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || sound.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(effectiveMediaLibrary.sounds.map(s => s.category))];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'nature': return <Music className="h-4 w-4 text-green-500" />;
      case 'music': return <Headphones className="h-4 w-4 text-blue-500" />;
      case 'voice': return <Mic className="h-4 w-4 text-purple-500" />;
      case 'ambient': return <Volume2 className="h-4 w-4 text-gray-500" />;
      default: return <FileAudio className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderAudioPlayer = () => (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-medium">
                {playerState.currentTrack ? 
                  effectiveMediaLibrary.sounds.find(s => s.id === playerState.currentTrack)?.name || 'Unknown'
                  : 'No track selected'
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDuration(playerState.currentTime)} / {formatDuration(playerState.duration)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={playerState.isPlaying ? pauseSound : () => {
                if (playerState.currentTrack) {
                  const sound = effectiveMediaLibrary.sounds.find(s => s.id === playerState.currentTrack);
                  if (sound) playSound(sound);
                }
              }}
              disabled={playerState.loading}
            >
              {playerState.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : playerState.isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <Button size="sm" variant="outline">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <Progress 
          value={playerState.duration > 0 ? (playerState.currentTime / playerState.duration) * 100 : 0} 
          className="mb-3" 
        />

        {/* Volume control */}
        <div className="flex items-center gap-3">
          <VolumeX className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[playerState.volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1"
          />
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium w-8">
            {Math.round(playerState.volume * 100)}%
          </span>
        </div>

        {/* Error display */}
        {playerState.error && (
          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {playerState.error}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Audio Player */}
      {(playerState.currentTrack || playerState.isPlaying) && renderAudioPlayer()}

      {/* Cache Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Audio Cache</span>
            <span className="text-sm text-muted-foreground">
              {formatFileSize(cacheState.stats.totalSize)} • {cacheState.stats.totalEntries} files
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Hit Rate: {Math.round(cacheState.stats.hitRate * 100)}%</span>
            <span>•</span>
            <span>Memory: {cacheState.memoryPressure}</span>
            {cacheState.isOptimizing && (
              <>
                <span>•</span>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Optimizing</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sounds">Sounds</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="challenges">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="sounds" className="space-y-4">
          {/* Upload & Search */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search sounds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <label htmlFor="category-filter" className="sr-only">Filter by category</label>
              <select 
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
                aria-label="Filter media by category"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <label htmlFor="file-upload" className="cursor-pointer" aria-label="Upload audio file">
                <Button asChild disabled={isUploading}>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Audio
                  </span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" onClick={() => warmCache(filteredSounds.slice(0, 5))}>
                <Download className="h-4 w-4 mr-2" />
                Preload Popular
              </Button>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">Uploading audio file...</div>
                      <Progress value={uploadProgress} />
                    </div>
                    <span className="text-sm font-medium">{uploadProgress}%</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sounds List */}
          <div className="grid gap-3">
            {filteredSounds.map((sound) => {
              const loadingState = soundLoadingStates.get(sound.id);
              const isCurrentTrack = playerState.currentTrack === sound.id;
              
              return (
                <Card key={sound.id} className={isCurrentTrack ? 'border-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(sound.category)}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {sound.name}
                            {sound.isCustom && (
                              <Badge variant="secondary" className="text-xs">Custom</Badge>
                            )}
                            {loadingState?.state === 'loading' && (
                              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{formatDuration(sound.duration)}</span>
                            <span>•</span>
                            <span className="capitalize">{sound.category}</span>
                            <span>•</span>
                            <span>{formatFileSize(sound.size || 0)}</span>
                            {sound.rating && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{sound.rating}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (isCurrentTrack && playerState.isPlaying) {
                              pauseSound();
                            } else {
                              playSound(sound);
                            }
                          }}
                          disabled={loadingState?.state === 'loading'}
                        >
                          {loadingState?.state === 'loading' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isCurrentTrack && playerState.isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button size="sm" variant="ghost">
                          <Heart className="h-4 w-4" />
                        </Button>
                        
                        <Button size="sm" variant="ghost">
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Loading Progress */}
                    {loadingState?.state === 'loading' && loadingState.progress > 0 && (
                      <div className="mt-3">
                        <Progress value={loadingState.progress} className="h-1" />
                        <div className="text-xs text-muted-foreground mt-1">
                          Loading... {Math.round(loadingState.progress)}%
                          {loadingState.estimatedTimeRemaining && (
                            <span> • ~{Math.round(loadingState.estimatedTimeRemaining)}s remaining</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="playlists" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Playlists</h3>
            <Button onClick={() => onCreatePlaylist?.({ name: 'New Playlist' })}>
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </div>

          {effectiveMediaLibrary.playlists.map((playlist) => (
            <Card key={playlist.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">{playlist.description}</p>
                  </div>
                  <Badge variant={playlist.isPublic ? 'default' : 'secondary'}>
                    {playlist.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-3">
                  {playlist.sounds.map((playlistSound) => (
                    <div key={playlistSound.soundId} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-6">{playlistSound.order}.</span>
                      <div className="flex-1">{playlistSound.sound.name}</div>
                      <span className="text-muted-foreground">
                        {formatDuration(playlistSound.sound.duration)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Duration: {formatDuration(playlist.totalDuration || 0)}</span>
                    <span>•</span>
                    <span>{playlist.playCount} plays</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => playPlaylist(playlist)}
                      disabled={playlist.sounds.length === 0}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Motivational Quotes</h3>
            <Button onClick={() => onSubmitQuote?.({ text: '', category: 'motivation' })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Quote
            </Button>
          </div>

          {effectiveMediaLibrary.quotes.map((quote) => (
            <Card key={quote.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Quote className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <blockquote className="text-lg font-medium leading-relaxed mb-2">
                      "{quote.text}"
                    </blockquote>
                    {quote.author && (
                      <cite className="text-sm text-muted-foreground">— {quote.author}</cite>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="outline" className="capitalize">
                    {quote.category}
                  </Badge>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{quote.likes} likes</span>
                    <span>•</span>
                    <span>{quote.uses} uses</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Photo challenges feature coming soon!</p>
                <p className="text-sm mt-2">Capture moments and earn rewards for completing daily challenges.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedMediaContent;