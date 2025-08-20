import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMediaContentAnnouncements } from '../hooks/useMediaContentAnnouncements';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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
  Image,
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
  CheckCircle
} from 'lucide-react';
import type {
  User as UserType,
  CustomSound,
  Playlist,
  MotivationalQuote,
  PhotoChallenge,
  MediaLibrary,
  ContentPreferences
} from '../types/index';

interface MediaContentProps {
  currentUser: UserType;
  mediaLibrary: MediaLibrary;
  contentPreferences: ContentPreferences;
  onUploadSound?: (file: File) => void;
  onCreatePlaylist?: (playlist: Partial<Playlist>) => void;
  onSubmitQuote?: (quote: Partial<MotivationalQuote>) => void;
  onCompletePhotoChallenge?: (challengeId: string, photo: File, caption?: string) => void;
  onUpdatePreferences?: (preferences: Partial<ContentPreferences>) => void;
}

// Mock data for media content
const MOCK_SOUNDS: CustomSound[] = [
  {
    id: '1',
    name: 'Morning Birds',
    description: 'Peaceful chirping birds to start your day',
    fileName: 'morning-birds.mp3',
    fileUrl: '/sounds/morning-birds.mp3',
    duration: 120,
    category: 'nature',
    tags: ['peaceful', 'birds', 'morning'],
    isCustom: false,
    downloads: 1542,
    rating: 4.8
  },
  {
    id: '2',
    name: 'Energetic Beat',
    description: 'Upbeat music to energize your morning',
    fileName: 'energetic-beat.mp3',
    fileUrl: '/sounds/energetic-beat.mp3',
    duration: 90,
    category: 'music',
    tags: ['upbeat', 'energetic', 'workout'],
    isCustom: false,
    downloads: 2103,
    rating: 4.6
  },
  {
    id: '3',
    name: 'Custom Recording',
    description: 'Your personal wake-up message',
    fileName: 'my-recording.mp3',
    fileUrl: '/sounds/my-recording.mp3',
    duration: 30,
    category: 'voice',
    tags: ['personal', 'custom'],
    isCustom: true,
    uploadedBy: 'user1',
    uploadedAt: new Date().toISOString()
  }
];

const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: '1',
    name: 'Morning Energy',
    description: 'Perfect playlist to start your day with energy',
    sounds: [
      { soundId: '2', sound: MOCK_SOUNDS[1], order: 1, volume: 0.8 },
      { soundId: '1', sound: MOCK_SOUNDS[0], order: 2, volume: 0.6, fadeIn: 5 }
    ],
    isPublic: true,
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['morning', 'energy', 'motivation'],
    playCount: 156,
    likeCount: 23,
    shareCount: 7
  }
];

const MOCK_QUOTES: MotivationalQuote[] = [
  {
    id: '1',
    text: 'The way to get started is to quit talking and begin doing.',
    author: 'Walt Disney',
    category: 'motivation',
    tags: ['action', 'success', 'start'],
    isCustom: false,
    likes: 342,
    uses: 1205
  },
  {
    id: '2',
    text: 'Today is going to be an amazing day!',
    category: 'inspiration',
    tags: ['positive', 'daily', 'optimism'],
    isCustom: true,
    submittedBy: 'user1',
    submittedAt: new Date().toISOString(),
    likes: 12,
    uses: 45
  },
  {
    id: '3',
    text: 'Rise and grind! Your dreams are waiting.',
    category: 'motivation',
    tags: ['morning', 'dreams', 'work'],
    isCustom: false,
    likes: 156,
    uses: 678
  }
];

const MOCK_PHOTO_CHALLENGES: PhotoChallenge[] = [
  {
    id: '1',
    name: 'Morning Selfie',
    description: 'Take a selfie within 5 minutes of waking up',
    category: 'selfie',
    difficulty: 'easy',
    prompts: [
      { id: '1', text: 'Show your face clearly', optional: false },
      { id: '2', text: 'Smile or show your energy level', optional: true }
    ],
    timeLimit: 5,
    rewards: [
      { type: 'experience', value: 50, description: '50 XP' },
      { type: 'badge', value: 'Early Bird', description: 'Morning Selfie Badge' }
    ],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    popularity: 87,
    completionRate: 72
  },
  {
    id: '2',
    name: 'Healthy Breakfast',
    description: 'Share a photo of your nutritious breakfast',
    category: 'food',
    difficulty: 'medium',
    prompts: [
      { id: '1', text: 'Show a healthy, balanced meal', optional: false },
      { id: '2', text: 'Include at least 3 different food groups', optional: false }
    ],
    rewards: [
      { type: 'experience', value: 100, description: '100 XP' },
      { type: 'badge', value: 'Nutrition Expert', description: 'Healthy Eating Badge' }
    ],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    popularity: 64,
    completionRate: 45
  }
];

const MOCK_MEDIA_LIBRARY: MediaLibrary = {
  id: '1',
  userId: 'user1',
  sounds: MOCK_SOUNDS,
  playlists: MOCK_PLAYLISTS,
  quotes: MOCK_QUOTES,
  photos: [],
  storage: {
    used: 15728640, // ~15MB
    total: 104857600, // 100MB
    percentage: 15
  }
};

const MOCK_PREFERENCES: ContentPreferences = {
  defaultSoundCategory: 'nature',
  preferredQuoteCategories: ['motivation', 'inspiration'],
  autoPlayPlaylists: true,
  quotesEnabled: true,
  photoChallengesEnabled: true,
  contentSharing: true,
  nsfw: false
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

export function MediaContent({
  currentUser,
  mediaLibrary = MOCK_MEDIA_LIBRARY,
  contentPreferences = MOCK_PREFERENCES,
  onUploadSound,
  onCreatePlaylist,
  onSubmitQuote,
  onCompletePhotoChallenge,
  onUpdatePreferences
}: MediaContentProps) {
  const {
    announceTabChange,
    announceAudioPlayback,
    announceSearchResults,
    announceUploadStart,
    announceUploadComplete,
    announceUploadError,
    announceStorageStatus,
    announcePlaylistAction,
    announceQuoteAction,
    announcePhotoChallengeAction,
    announceShare,
    announceDownload,
    announceDetailedSoundInfo,
    announceDetailedPlaylistInfo,
    announceDetailedQuoteInfo,
    announceDetailedChallengeInfo
  } = useMediaContentAnnouncements();

  const [selectedTab, setSelectedTab] = useState('sounds');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSounds = mediaLibrary.sounds.filter(sound =>
    sound.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sound.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const customSounds = mediaLibrary.sounds.filter(sound => sound.isCustom);
  const publicSounds = mediaLibrary.sounds.filter(sound => !sound.isCustom);

  // Handlers with announcements
  const handleTabChange = (tabName: string) => {
    setSelectedTab(tabName);
    announceTabChange(tabName);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const filteredCount = mediaLibrary.sounds.filter(sound =>
      sound.name.toLowerCase().includes(query.toLowerCase()) ||
      sound.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    ).length;
    announceSearchResults(query, filteredCount);
  };

  const handlePlayPause = (sound: CustomSound) => {
    const wasPlaying = currentlyPlaying === sound.id;
    setCurrentlyPlaying(wasPlaying ? null : sound.id);
    announceAudioPlayback(sound, !wasPlaying);
  };

  const handleUploadSound = (file: File) => {
    announceUploadStart(file.name);
    onUploadSound?.(file);
  };

  const handleCreatePlaylist = (playlist: Partial<Playlist>) => {
    onCreatePlaylist?.(playlist);
    if (playlist.name) {
      announcePlaylistAction('created', playlist as Playlist);
    }
  };

  const handleSubmitQuote = (quote: Partial<MotivationalQuote>) => {
    onSubmitQuote?.(quote);
    if (quote.text) {
      announceQuoteAction('submitted', quote as MotivationalQuote);
    }
  };

  const handleCompletePhotoChallenge = (challengeId: string, photo: File, caption?: string) => {
    onCompletePhotoChallenge?.(challengeId, photo, caption);
    const challenge = MOCK_PHOTO_CHALLENGES.find(c => c.id === challengeId);
    if (challenge) {
      announcePhotoChallengeAction('completed', challenge, {
        xp: challenge.rewards.find(r => r.type === 'experience')?.value,
        badge: challenge.rewards.find(r => r.type === 'badge')?.value?.toString()
      });
    }
  };

  const handleShare = (contentType: 'sound' | 'playlist' | 'quote', contentName: string) => {
    announceShare(contentType, contentName);
  };

  // useEffect hooks for announcements
  useEffect(() => {
    announceStorageStatus(
      mediaLibrary.storage.used,
      mediaLibrary.storage.total,
      mediaLibrary.storage.percentage
    );
  }, [mediaLibrary.storage, announceStorageStatus]);

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4" role="tablist" aria-label="Media Content Navigation">
          <TabsTrigger value="sounds" aria-label="Audio sounds and recordings">Sounds</TabsTrigger>
          <TabsTrigger value="playlists" aria-label="Custom sound playlists">Playlists</TabsTrigger>
          <TabsTrigger value="quotes" aria-label="Motivational quotes">Quotes</TabsTrigger>
          <TabsTrigger value="challenges" aria-label="Photo challenges and tasks">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="sounds" className="space-y-4">
          {/* Storage Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Storage Used</span>
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(mediaLibrary.storage.used)} / {formatFileSize(mediaLibrary.storage.total)}
                </span>
              </div>
              <Progress value={mediaLibrary.storage.percentage} className="h-2" />
            </CardContent>
          </Card>

          {/* Upload & Search */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search sounds..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
                aria-label="Search through sound library"
                role="searchbox"
              />
            </div>
            <Button
              onClick={() => handleUploadSound(new File([], 'dummy'))}
              aria-label="Upload custom sound file"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>

          {/* Custom Sounds */}
          {customSounds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Custom Sounds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customSounds.map((sound) => (
                  <div key={sound.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(sound.category)}
                      <div>
                        <div className="font-medium">{sound.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{formatDuration(sound.duration)}</span>
                          <span>•</span>
                          <span className="capitalize">{sound.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePlayPause(sound)}
                        aria-label={currentlyPlaying === sound.id ? `Pause ${sound.name}` : `Play ${sound.name}`}
                      >
                        {currentlyPlaying === sound.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleShare('sound', sound.name)}
                        aria-label={`Share ${sound.name}`}
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => announceDetailedSoundInfo(sound)}
                        aria-label={`Get detailed information about ${sound.name}`}
                      >
                        Info
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Public Sound Library */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sound Library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {publicSounds.map((sound) => (
                <div key={sound.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(sound.category)}
                    <div>
                      <div className="font-medium">{sound.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{formatDuration(sound.duration)}</span>
                        <span>•</span>
                        <span className="capitalize">{sound.category}</span>
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
                      onClick={() => setCurrentlyPlaying(currentlyPlaying === sound.id ? null : sound.id)}
                    >
                      {currentlyPlaying === sound.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playlists" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Playlists</h3>
            <Button onClick={() => onCreatePlaylist?.({ name: 'New Playlist' })}>
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </div>

          {mediaLibrary.playlists.map((playlist) => (
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
                      <span className="text-muted-foreground">{formatDuration(playlistSound.sound.duration)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      <span>{playlist.playCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{playlist.likeCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share className="h-3 w-3" />
                      <span>{playlist.shareCount}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Shuffle className="h-4 w-4" />
                    </Button>
                    <Button size="sm">
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

          <div className="grid gap-4">
            {mediaLibrary.quotes.map((quote) => (
              <Card key={quote.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Quote className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <blockquote className="text-lg font-medium leading-relaxed mb-2">
                        "{quote.text}"
                      </blockquote>
                      {quote.author && (
                        <cite className="text-sm text-muted-foreground">
                          — {quote.author}
                        </cite>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {quote.category}
                      </Badge>
                      {quote.isCustom && (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span>{quote.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        <span>{quote.uses} uses</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_PHOTO_CHALLENGES.map((challenge) => (
                <div key={challenge.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{challenge.name}</h3>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {challenge.difficulty}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <h4 className="font-medium text-sm">Requirements:</h4>
                    {challenge.prompts.map((prompt) => (
                      <div key={prompt.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle className={`h-3 w-3 ${prompt.optional ? 'text-gray-400' : 'text-green-500'}`} />
                        <span className={prompt.optional ? 'text-muted-foreground' : ''}>
                          {prompt.text} {prompt.optional && '(optional)'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">{challenge.completionRate}%</span> completion rate
                      </div>
                      {challenge.timeLimit && (
                        <div>
                          <span className="font-medium">{challenge.timeLimit}min</span> time limit
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onCompletePhotoChallenge?.(challenge.id, new File([], 'dummy'))}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Rewards:</span> {challenge.rewards.map(r => r.description).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MediaContent;