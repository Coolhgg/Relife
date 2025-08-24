/// <reference lib="dom" />
import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Upload,
  Music,
  Check,
  X,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { soundEffectsService, SoundEffectId } from '../services/sound-effects';
import type {
  CustomSound,
  CustomSoundAssignment,
  CustomSoundType,
  SoundCategory,
} from '../types/custom-sound-themes';

interface SoundPickerProps {
  title: string;
  description?: string;
  selectedSound?: CustomSoundAssignment;
  onSoundSelected: (assignment: CustomSoundAssignment) => void;
  onClear?: () => void;
  availableCustomSounds?: CustomSound[];
  allowedSoundTypes?: CustomSoundType[];
  category?: SoundCategory;
  className?: string;
}

interface BuiltInSound {
  id: SoundEffectId;
  name: string;
  category: string;
  url: string;
}

export const SoundPicker: React.FC<SoundPickerProps> = ({
  title,
  description,
  selectedSound,
  onSoundSelected,
  onClear,
  availableCustomSounds = [],
  allowedSoundTypes = ['uploaded', 'builtin', 'generated', 'url'],
  category,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CustomSoundType>('uploaded');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [generatedSoundConfig, setGeneratedSoundConfig] = useState({
    type: 'sine_wave' as const,
    frequency: 440,
    duration: 2,
  });
  const [urlInput, setUrlInput] = useState('');

  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Get built-in sounds
  const builtInSounds: BuiltInSound[] = React.useMemo(() => {
    const allSounds = soundEffectsService.getAllSoundEffects();
    return allSounds.map(sound => ({
      id: sound.id as SoundEffectId,
      name: sound.name,
      category: sound.category,
      url: sound.url,
    }));
  }, []);

  // Filter sounds based on search and category
  const filteredCustomSounds = availableCustomSounds.filter(sound => {
    const matchesSearch =
      sound.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.tags?.some((tag: any) => // auto: implicit any tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      filterCategory === 'all' || sound.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredBuiltInSounds = builtInSounds.filter(sound => {
    const matchesSearch = sound.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || sound.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Audio playback functions
  const playSound = async (soundId: string, soundUrl: string) => {
    // Stop any currently playing sound
    stopAllSounds();

    try {
      let audio = audioRefs.current.get(soundId);
      if (!audio) {
        audio = new Audio(soundUrl);
        audioRefs.current.set(soundId, audio);

        audio.addEventListener('ended', () => {
          setPlayingSound(null);
        });
      }

      await audio.play();
      setPlayingSound(soundId);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const stopAllSounds = () => {
    audioRefs.current.forEach((audio: any) => // auto: implicit any {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setPlayingSound(null);
  };

  const selectCustomSound = (sound: CustomSound) => {
    const assignment: CustomSoundAssignment = {
      type: 'uploaded',
      source: sound.fileUrl,
      volume: 0.8,
      customSound: sound,
    };
    onSoundSelected(assignment);
    setIsOpen(false);
    stopAllSounds();
  };

  const selectBuiltInSound = (sound: BuiltInSound) => {
    const assignment: CustomSoundAssignment = {
      type: 'builtin',
      source: sound.url,
      volume: 0.8,
      builtInSoundId: sound.id,
    };
    onSoundSelected(assignment);
    setIsOpen(false);
    stopAllSounds();
  };

  const selectUrlSound = () => {
    if (!urlInput.trim()) return;

    const assignment: CustomSoundAssignment = {
      type: 'url',
      source: urlInput.trim(),
      volume: 0.8,
    };
    onSoundSelected(assignment);
    setIsOpen(false);
    setUrlInput('');
  };

  const generateSound = () => {
    // This would integrate with a sound generation system
    const assignment: CustomSoundAssignment = {
      type: 'generated',
      source: `generated://${JSON.stringify(generatedSoundConfig)}`,
      volume: 0.8,
      generatedConfig: {
        type: generatedSoundConfig.type,
        parameters: {
          frequency: generatedSoundConfig.frequency,
        },
        duration: generatedSoundConfig.duration,
      },
    };
    onSoundSelected(assignment);
    setIsOpen(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSoundTypeIcon = (type: CustomSoundType) => {
    switch (type) {
      case 'uploaded':
        return <Upload className="w-4 h-4" />;
      case 'builtin':
        return <Music className="w-4 h-4" />;
      case 'generated':
        return <Volume2 className="w-4 h-4" />;
      case 'url':
        return <Volume2 className="w-4 h-4" />;
      default:
        return <Volume2 className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Selected Sound Display */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          {description && <p className="text-sm text-gray-600">{description}</p>}
          {selectedSound && (
            <div className="flex items-center gap-2 mt-2">
              {getSoundTypeIcon(selectedSound.type)}
              <Badge variant="outline" className="text-xs">
                {selectedSound.type}
              </Badge>
              {selectedSound.customSound && (
                <span className="text-sm text-gray-600">
                  {selectedSound.customSound.name}
                </span>
              )}
              {selectedSound.builtInSoundId && (
                <span className="text-sm text-gray-600">
                  {builtInSounds.find(s => s.id === selectedSound.builtInSoundId)?.name}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedSound && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => playSound('selected', selectedSound.source)}
              >
                {playingSound === 'selected' ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              {onClear && (
                <Button size="sm" variant="outline" onClick={onClear}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </>
          )}

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">{selectedSound ? 'Change' : 'Select Sound'}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Select Sound - {title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search sounds..."
                        value={searchQuery}
                        onChange={(e: any) => // auto: implicit any setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="ui">UI</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="alarm">Alarm</SelectItem>
                      <SelectItem value="ambient">Ambient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sound Type Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={(value: any) => // auto: implicit any setActiveTab(value as CustomSoundType)}
                >
                  <TabsList>
                    {allowedSoundTypes.includes('uploaded') && (
                      <TabsTrigger value="uploaded">
                        <Upload className="w-4 h-4 mr-2" />
                        Uploaded ({availableCustomSounds.length})
                      </TabsTrigger>
                    )}
                    {allowedSoundTypes.includes('builtin') && (
                      <TabsTrigger value="builtin">
                        <Music className="w-4 h-4 mr-2" />
                        Built-in ({builtInSounds.length})
                      </TabsTrigger>
                    )}
                    {allowedSoundTypes.includes('generated') && (
                      <TabsTrigger value="generated">
                        <Volume2 className="w-4 h-4 mr-2" />
                        Generate
                      </TabsTrigger>
                    )}
                    {allowedSoundTypes.includes('url') && (
                      <TabsTrigger value="url">
                        <Volume2 className="w-4 h-4 mr-2" />
                        From URL
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Uploaded Sounds */}
                  <TabsContent value="uploaded">
                    <ScrollArea className="h-96">
                      {filteredCustomSounds.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No custom sounds available</p>
                          <p className="text-sm">Upload some sounds first</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredCustomSounds.map(sound => (
                            <div
                              key={sound.id}
                              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => selectCustomSound(sound)}
                            >
                              <Upload className="w-8 h-8 text-blue-500" />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium truncate">{sound.name}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {sound.category}
                                  </Badge>
                                </div>
                                {sound.description && (
                                  <p className="text-sm text-gray-600 truncate">
                                    {sound.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <span>{formatFileSize(sound.fileSize || 0)}</span>
                                  <span>•</span>
                                  <span>
                                    {sound.duration
                                      ? `${Math.round(sound.duration)}s`
                                      : 'Unknown'}
                                  </span>
                                  {sound.tags && sound.tags.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{sound.tags.join(', ')}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e: any) => // auto: implicit any {
                                  e.stopPropagation();
                                  playSound(sound.id, sound.fileUrl);
                                }}
                              >
                                {playingSound === sound.id ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* Built-in Sounds */}
                  <TabsContent value="builtin">
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {filteredBuiltInSounds.map(sound => (
                          <div
                            key={sound.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => selectBuiltInSound(sound)}
                          >
                            <Music className="w-8 h-8 text-green-500" />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium truncate">{sound.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {sound.category}
                                </Badge>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e: any) => // auto: implicit any {
                                e.stopPropagation();
                                playSound(sound.id, sound.url);
                              }}
                            >
                              {playingSound === sound.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Generated Sounds */}
                  <TabsContent value="generated">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Generate Sound</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Wave Type
                            </label>
                            <Select
                              value={generatedSoundConfig.type}
                              onValueChange={(value: any) =>
                                setGeneratedSoundConfig((prev: any) => // auto: implicit any ({
                                  ...prev,
                                  type: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sine_wave">Sine Wave</SelectItem>
                                <SelectItem value="square_wave">Square Wave</SelectItem>
                                <SelectItem value="sawtooth_wave">
                                  Sawtooth Wave
                                </SelectItem>
                                <SelectItem value="triangle_wave">
                                  Triangle Wave
                                </SelectItem>
                                <SelectItem value="noise">White Noise</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Frequency: {generatedSoundConfig.frequency} Hz
                            </label>
                            <input
                              type="range"
                              min="100"
                              max="2000"
                              value={generatedSoundConfig.frequency}
                              onChange={(e: any) => // auto: implicit any
                                setGeneratedSoundConfig((prev: any) => // auto: implicit any ({
                                  ...prev,
                                  frequency: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Duration: {generatedSoundConfig.duration}s
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="10"
                              step="0.5"
                              value={generatedSoundConfig.duration}
                              onChange={(e: any) => // auto: implicit any
                                setGeneratedSoundConfig((prev: any) => // auto: implicit any ({
                                  ...prev,
                                  duration: parseFloat(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1">
                              Preview
                            </Button>
                            <Button onClick={generateSound} className="flex-1">
                              Use Generated Sound
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* URL Sounds */}
                  <TabsContent value="url">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Sound from URL</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Audio URL
                          </label>
                          <Input
                            placeholder="https://example.com/sound.mp3"
                            value={urlInput}
                            onChange={(e: any) => // auto: implicit any setUrlInput(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            disabled={!urlInput.trim()}
                          >
                            Preview
                          </Button>
                          <Button
                            onClick={selectUrlSound}
                            className="flex-1"
                            disabled={!urlInput.trim()}
                          >
                            Use URL Sound
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default SoundPicker;
