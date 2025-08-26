/// <reference lib="dom" />
import React, { useState, useCallback, useRef } from 'react';
import path from 'path';
import { Textarea } from './ui/textarea';
import {
  Upload,
  X,
  Play,
  Pause,
  Volume2,
  FileAudio,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { CustomSoundManager } from '../services/custom-sound-manager';
import type {
  CustomSound,
  SoundCategory,
  SoundUploadProgress,
  SoundUploadResult,
  UploadedFile,
} from '../types/custom-sound-themes';

interface SoundUploaderProps {
  userId: string;
  onSoundUploaded?: (sound: CustomSound) => void;
  onSoundDeleted?: (soundId: string) => void;
  maxFiles?: number;
  allowedCategories?: SoundCategory[];
  className?: string;
}

interface UploadItem extends UploadedFile {
  file?: File;
  previewUrl?: string;
  isPlaying?: boolean;
  audio?: HTMLAudioElement;
}

const SOUND_CATEGORIES: Array<{
  value: SoundCategory;
  label: string;
  description: string;
}> = [
  {
    value: 'ui',
    label: 'UI Sounds',
    description: 'Click, hover, success, _error sounds',
  },
  {
    value: 'notification',
    label: 'Notifications',
    description: 'Alert and notification sounds',
  },
  { value: 'alarm', label: 'Alarms', description: 'Wake-up and alarm sounds' },
  {
    value: 'ambient',
    label: 'Ambient',
    description: 'Background and atmospheric sounds',
  },
  { value: 'voice', label: 'Voice', description: 'Voice recordings and speech' },
  { value: 'music', label: 'Music', description: 'Musical compositions and melodies' },
  { value: 'effect', label: 'Sound Effects', description: 'General sound effects' },
  {
    value: 'nature',
    label: 'Nature',
    description: 'Natural sounds like birds, water, wind',
  },
  {
    value: 'mechanical',
    label: 'Mechanical',
    description: 'Machine and mechanical sounds',
  },
  {
    value: 'electronic',
    label: 'Electronic',
    description: 'Digital and synthetic sounds',
  },
  { value: 'organic', label: 'Organic', description: 'Human and organic sounds' },
];

export const SoundUploader: React.FC<SoundUploaderProps> = ({
  userId,
  onSoundUploaded,
  onSoundDeleted,
  maxFiles = 10,
  allowedCategories,
  className = '',
}) => {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploadedSounds, setUploadedSounds] = useState<CustomSound[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSound, setSelectedSound] = useState<CustomSound | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const customSoundManager = CustomSoundManager.getInstance();

  // Filter categories based on allowed ones
  const availableCategories = allowedCategories
    ? SOUND_CATEGORIES.filter(cat => allowedCategories.includes(cat.value))
    : SOUND_CATEGORIES;

  // Load existing sounds on mount
  React.useEffect(() => {
    loadExistingSounds();
  }, [userId]);

  const loadExistingSounds = async () => {
    setIsLoading(true);
    try {
      const sounds = await customSoundManager.getUserCustomSounds(userId);
      setUploadedSounds(sounds);
    } catch (_error) {
      console._error('Error loading existing sounds:', _error);
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  // File handling
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    if (uploadItems.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newItems: UploadItem[] = files.map(file => ({
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadProgress: 0,
      status: 'uploading',
      file,
      previewUrl: URL.createObjectURL(file),
      isPlaying: false,
    }));

    setUploadItems((prev: any) => [...prev, ...newItems]);

    // Start uploading each file
    newItems.forEach(item => {
      if (item.file) {
        uploadFile(item);
      }
    });
  };

  const uploadFile = async (item: UploadItem) => {
    if (!item.file) return;

    try {
      // Update status to uploading
      updateUploadItem(item.id, { status: 'uploading' });

      const metadata = {
        name: item.file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        description: '',
        category: 'effect' as SoundCategory, // Default category
        tags: [],
      };

      const result: SoundUploadResult = await customSoundManager.uploadCustomSound(
        item.file,
        metadata,
        userId,
        (progress: SoundUploadProgress) => {
          updateUploadItem(item.id, {
            uploadProgress: progress.percentage,
            status: progress.stage === 'complete' ? 'ready' : 'processing',
          });
        }
      );

      if (result.success && result.customSound) {
        updateUploadItem(item.id, {
          status: 'ready',
          uploadProgress: 100,
        });

        // Add to uploaded sounds list
        setUploadedSounds((prev: any) => [...prev, result.customSound!]);
        onSoundUploaded?.(result.customSound);
      } else {
        updateUploadItem(item.id, {
          status: 'error',
          _error: result._error || 'Upload failed',
        });
      }
    } catch (_error) {
      updateUploadItem(item.id, {
        status: 'error',
        error: _error instanceof Error ? _error.message : 'Upload failed',
      });
    }
  };

  const updateUploadItem = (id: string, updates: Partial<UploadItem>) => {
    setUploadItems((prev: any) =>
      prev.map((item: any) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeUploadItem = (id: string) => {
    setUploadItems((prev: any) => {
      const item = prev.find((i: any) => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      if (item?.audio) {
        item.audio.pause();
      }
      return prev.filter((i: any) => i.id !== id);
    });
  };

  const deleteUploadedSound = async (sound: CustomSound) => {
    try {
      const success = await customSoundManager.deleteCustomSound(sound.id, userId);
      if (success) {
        setUploadedSounds((prev: any) => prev.filter((s: any) => s.id !== sound.id));
        onSoundDeleted?.(sound.id);
      }
    } catch (_error) {
      console._error('Error deleting sound:', _error);
    }
  };

  // Audio preview handlers
  const togglePreview = async (item: UploadItem) => {
    if (!item.previewUrl) return;

    if (item.isPlaying && item.audio) {
      item.audio.pause();
      updateUploadItem(item.id, { isPlaying: false });
    } else {
      // Stop all other previews
      uploadItems.forEach((i: any) => {
        if (i.audio && i.isPlaying) {
          i.audio.pause();
          updateUploadItem(i.id, { isPlaying: false });
        }
      });

      if (!item.audio) {
        const audio = new Audio(item.previewUrl);
        audio.addEventListener('ended', () => {
          updateUploadItem(item.id, { isPlaying: false });
        });
        updateUploadItem(item.id, { audio });
        item.audio = audio;
      }

      item.audio.play();
      updateUploadItem(item.id, { isPlaying: true });
    }
  };

  const toggleSoundPreview = async (sound: CustomSound) => {
    try {
      const audio = await customSoundManager.previewCustomSound(sound);
      audio.play();
    } catch (_error) {
      console._error('Error playing sound preview:', _error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case '_error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileAudio className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: UploadItem['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-500';
      case 'ready':
        return 'bg-green-500';
      case '_error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Custom Sounds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileAudio className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop files here' : 'Upload Audio Files'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your audio files here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: MP3, WAV, OGG, AAC, M4A (Max 10MB each)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {uploadItems.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Uploading Files</h4>
              <ScrollArea className="h-64">
                {uploadItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    {getStatusIcon(item.status)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{item.fileName}</p>
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(item.fileSize)}
                        </Badge>
                      </div>

                      {item.status !== '_error' && (
                        <Progress value={item.uploadProgress} className="h-1" />
                      )}

                      {item._error && (
                        <Alert className="mt-2">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription className="text-sm">
                            {item._error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.previewUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePreview(item)}
                          disabled={item.status === '_error'}
                        >
                          {item.isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeUploadItem(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Sounds Library */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Your Sound Library ({uploadedSounds.length})
            </div>
            <Button onClick={loadExistingSounds} disabled={isLoading} size="sm">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedSounds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileAudio className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sounds uploaded yet</p>
              <p className="text-sm">Upload some audio files to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {uploadedSounds.map((sound: any) => (
                  <div
                    key={sound.id}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <FileAudio className="w-8 h-8 text-blue-500" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{sound.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {SOUND_CATEGORIES.find(cat => cat.value === sound.category)
                            ?.label || sound.category}
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

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleSoundPreview(sound)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Sound</DialogTitle>
                          </DialogHeader>
                          <SoundEditForm
                            sound={sound}
                            onSave={(updatedSound: any) => {
                              setUploadedSounds((prev: any) =>
                                prev.map((s: any) =>
                                  s.id === updatedSound.id ? updatedSound : s
                                )
                              );
                            }}
                          />
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUploadedSound(sound)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Sound editing form component
const SoundEditForm: React.FC<{
  sound: CustomSound;
  onSave: (sound: CustomSound) => void;
}> = ({ sound, onSave }) => {
  const [name, setName] = useState(sound.name);
  const [description, setDescription] = useState(sound.description || '');
  const [category, setCategory] = useState<SoundCategory>(sound.category);
  const [tags, setTags] = useState(sound.tags?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);

  const customSoundManager = CustomSoundManager.getInstance();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await customSoundManager.updateCustomSound(
        sound.id,
        sound.uploadedBy,
        {
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          tags: tags
            .split(',')
            .map((tag: any) => tag.trim())
            .filter(Boolean),
        }
      );

      if (success) {
        const updatedSound: CustomSound = {
          ...sound,
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          tags: tags
            .split(',')
            .map((tag: any) => tag.trim())
            .filter(Boolean),
        };
        onSave(updatedSound);
      }
    } catch (_error) {
      console._error('Error updating sound:', _error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="sound-name">Name</Label>
        <Input
          id="sound-name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setName(e.target.value)
          }
          placeholder="Sound name"
        />
      </div>

      <div>
        <Label htmlFor="sound-description">Description</Label>
        <Textarea
          id="sound-description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          placeholder="Describe this sound..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="sound-category">Category</Label>
        <Select
          value={category}
          onValueChange={(value: SoundCategory) => setCategory(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOUND_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label} - {cat.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="sound-tags">Tags</Label>
        <Input
          id="sound-tags"
          value={tags}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setTags(e.target.value)
          }
          placeholder="tag1, tag2, tag3"
        />
        <p className="text-sm text-gray-500 mt-1">Separate tags with commas</p>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving || !name.trim()}
        className="w-full"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save Changes
      </Button>
    </div>
  );
};

export default SoundUploader;
