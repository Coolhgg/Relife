import React, { useState, useEffect } from 'react';
import {
  Palette,
  Info,
  Upload,
  CheckCircle,
  Settings,
  Play,
  Eye,
  Tags,
  Share,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  Save,
  Music,
  Volume2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { SoundUploader } from './SoundUploader';
import { soundEffectsService } from '../services/sound-effects';
import type {
  CustomSoundTheme,
  CustomSoundThemeCreationSession,
  CreationStep,
  CustomSoundThemeCategory,
  CustomSound,
  ValidationResult,
  _CustomSoundAssignment,
  CustomThemeUISounds,
  CustomThemeNotificationSounds,
  CustomThemeAlarmSounds,
} from '../types/custom-sound-themes';

interface CustomSoundThemeCreatorProps {
  userId: string;
  onThemeCreated?: (theme: CustomSoundTheme) => void;
  onCancel?: () => void;
  existingTheme?: CustomSoundTheme; // For editing
  className?: string;
}

const CREATION_STEPS: Array<{
  id: CreationStep;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    id: 'info',
    title: 'Basic Info',
    description: 'Name and describe your theme',
    icon: Info,
  },
  {
    id: 'sounds',
    title: 'Upload Sounds',
    description: 'Add your custom audio files',
    icon: Upload,
  },
  {
    id: 'assignment',
    title: 'Assign Sounds',
    description: 'Map sounds to categories',
    icon: Settings,
  },
  {
    id: 'customization',
    title: 'Customize',
    description: 'Adjust volume and effects',
    icon: Volume2,
  },
  { id: 'preview', title: 'Preview', description: 'Test your theme', icon: Play },
  {
    id: 'metadata',
    title: 'Details',
    description: 'Add tags and description',
    icon: Tags,
  },
  {
    id: 'sharing',
    title: 'Sharing',
    description: 'Set privacy and sharing options',
    icon: Share,
  },
  { id: 'publish', title: 'Publish', description: 'Save your theme', icon: Upload },
];

const THEME_CATEGORIES: Array<{
  value: CustomSoundThemeCategory;
  label: string;
  description: string;
}> = [
  {
    value: 'ambient',
    label: 'Ambient',
    description: 'Atmospheric and background sounds',
  },
  { value: 'musical', label: 'Musical', description: 'Music and melody-based themes' },
  { value: 'nature', label: 'Nature', description: 'Natural and organic sounds' },
  {
    value: 'electronic',
    label: 'Electronic',
    description: 'Digital and synthetic sounds',
  },
  { value: 'voice', label: 'Voice', description: 'Vocal and speech-based sounds' },
  {
    value: 'experimental',
    label: 'Experimental',
    description: 'Unique and creative combinations',
  },
  { value: 'seasonal', label: 'Seasonal', description: 'Holiday and seasonal themes' },
  { value: 'gaming', label: 'Gaming', description: 'Video game inspired sounds' },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Business and work environments',
  },
  {
    value: 'relaxation',
    label: 'Relaxation',
    description: 'Calming and peaceful sounds',
  },
  {
    value: 'energizing',
    label: 'Energizing',
    description: 'Motivating and upbeat sounds',
  },
  { value: 'custom', label: 'Custom', description: 'Your own unique category' },
];

export const CustomSoundThemeCreator: React.FC<CustomSoundThemeCreatorProps> = ({
  userId,
  onThemeCreated,
  onCancel,
  existingTheme,
  className = '',
}) => {
  const [session, setSession] = useState<CustomSoundThemeCreationSession | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(
    null
  );
  const [uploadedSounds, setUploadedSounds] = useState<CustomSound[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    setIsLoading(true);
    try {
      if (existingTheme) {
        // TODO: Implement editing existing theme
        console.log('Editing existing theme:', existingTheme);
      } else {
        const newSession = await soundEffectsService.startCustomThemeCreation(userId);
        setSession(newSession);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSession = async (updates: Partial<CustomSoundThemeCreationSession>) => {
    if (!session) return;

    const updatedSession = { ...session, ...updates };
    setSession(updatedSession);
    await soundEffectsService.updateCreationSession(updates);
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    if (!session) return false;

    const validation = await soundEffectsService.validateCustomTheme(
      session.currentTheme
    );
    setValidationResult(validation);

    const currentStep = CREATION_STEPS[currentStepIndex];

    // Step-specific validation
    switch (currentStep.id) {
      case 'info':
        return !!(session.currentTheme.name?.trim() && session.currentTheme.category);
      case 'sounds':
        return uploadedSounds.length > 0;
      case 'assignment':
        return validation.completeness > 50; // At least 50% of sounds assigned
      case 'customization':
        return true; // Optional step
      case 'preview':
        return true; // Optional step
      case 'metadata':
        return true; // Optional step
      case 'sharing':
        return true; // Optional step
      case 'publish':
        return validation.isValid;
      default:
        return true;
    }
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid && currentStepIndex < CREATION_STEPS.length - 1) {
      setShowValidationDialog(true);
      return;
    }

    if (currentStepIndex < CREATION_STEPS.length - 1) {
      const nextStepIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextStepIndex);

      const nextStep = CREATION_STEPS[nextStepIndex];
      await updateSession({
        currentStep: nextStep.id,
        completedSteps: [
          ...(session?.completedSteps || []),
          CREATION_STEPS[currentStepIndex].id,
        ],
      });
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      const prevStepIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevStepIndex);

      const prevStep = CREATION_STEPS[prevStepIndex];
      updateSession({ currentStep: prevStep.id });
    }
  };

  const saveTheme = async () => {
    if (!session) return;

    setIsSaving(true);
    try {
      const validation = await soundEffectsService.validateCustomTheme(
        session.currentTheme
      );

      if (!validation.isValid) {
        setValidationResult(validation);
        setShowValidationDialog(true);
        return;
      }

      const theme: CustomSoundTheme = {
        ...session.currentTheme,
        id: session.currentTheme.id || `custom_${Date.now()}`,
        name: session.currentTheme.name || 'Unnamed Theme',
        displayName:
          session.currentTheme.displayName ||
          session.currentTheme.name ||
          'Unnamed Theme',
        description: session.currentTheme.description || '',
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: session.currentTheme.isPublic || false,
        isShared: session.currentTheme.isShared || false,
        version: '1.0.0',
        category: session.currentTheme.category || 'custom',
        tags: session.currentTheme.tags || [],
        rating: 0,
        downloads: 0,
        popularity: 0,
        sounds: session.currentTheme.sounds || {
          ui: {} as CustomThemeUISounds,
          notifications: {} as CustomThemeNotificationSounds,
          alarms: {} as CustomThemeAlarmSounds,
        },
        metadata: {
          totalSounds: uploadedSounds.length,
          totalDuration: uploadedSounds.reduce(
            (acc, sound) => acc + (sound.duration || 0),
            0
          ),
          totalFileSize: uploadedSounds.reduce(
            (acc, sound) => acc + (sound.fileSize || 0),
            0
          ),
          audioQuality: {
            averageBitRate: 0,
            averageSampleRate: 0,
            formatDistribution: {},
            qualityScore: 8,
          },
          compatibility: {
            supportedPlatforms: ['web'],
            minAppVersion: '1.0.0',
            browserCompatibility: {
              chrome: true,
              firefox: true,
              safari: true,
              edge: true,
              webAudioAPI: true,
            },
            deviceRequirements: {
              requiresInternet: false,
            },
          },
          features: {
            hasGeneratedSounds: false,
            hasUploadedSounds: true,
            hasBuiltInSounds: false,
            hasAmbientSounds: false,
            hasVoiceSounds: false,
            hasMusicSounds: false,
            hasInteractiveSounds: false,
            hasAdaptiveSounds: false,
            supportsLoop: true,
            supportsFade: true,
            supportsVolumeControl: true,
          },
          requirements: {
            subscriptionTier: 'free',
            permissions: [],
            features: [],
            maxFileSize: 10 * 1024 * 1024,
            maxDuration: 300,
          },
        },
        preview: {
          previewSounds: [],
          demoSequence: [],
          description: session.currentTheme.description || '',
          highlights: [],
        },
        permissions: {
          canView: 'private',
          canEdit: 'private',
          canShare: 'private',
          canDownload: 'private',
          canRate: 'private',
          canComment: 'private',
        },
        isPremium: false,
        requiresSubscription: false,
      };

      const success = await soundEffectsService.saveCustomTheme(theme);

      if (success) {
        onThemeCreated?.(theme);
      } else {
        throw new Error('Failed to save theme');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateThemeField = (field: keyof CustomSoundTheme, value: any) => {
    if (!session) return;

    const updatedTheme = {
      ...session.currentTheme,
      [field]: value,
    };

    updateSession({
      currentTheme: updatedTheme,
    });
  };

  const renderStepContent = () => {
    if (!session) return null;

    const currentStep = CREATION_STEPS[currentStepIndex];

    switch (currentStep.id) {
      case 'info':
        return <InfoStep theme={session.currentTheme} onUpdate={updateThemeField} />;
      case 'sounds':
        return (
          <SoundsStep
            userId={userId}
            uploadedSounds={uploadedSounds}
            onSoundsUpdated={setUploadedSounds}
          />
        );
      case 'assignment':
        return (
          <AssignmentStep
            theme={session.currentTheme}
            availableSounds={uploadedSounds}
            onUpdate={updateThemeField}
          />
        );
      case 'customization':
        return (
          <CustomizationStep theme={session.currentTheme} onUpdate={updateThemeField} />
        );
      case 'preview':
        return <PreviewStep theme={session.currentTheme} />;
      case 'metadata':
        return (
          <MetadataStep theme={session.currentTheme} onUpdate={updateThemeField} />
        );
      case 'sharing':
        return <SharingStep theme={session.currentTheme} onUpdate={updateThemeField} />;
      case 'publish':
        return (
          <PublishStep
            theme={session.currentTheme}
            validationResult={validationResult}
          />
        );
      default:
        return <div>Step not implemented</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium mb-2">Failed to Initialize</h3>
        <p className="text-gray-600 mb-4">
          Could not start the theme creation session.
        </p>
        <Button onClick={initializeSession}>Try Again</Button>
      </div>
    );
  }

  const currentStep = CREATION_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / CREATION_STEPS.length) * 100;

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Palette className="w-6 h-6" />
          Custom Sound Theme Creator
        </h1>
        <p className="text-gray-600">
          Create your own personalized sound theme for the alarm app
        </p>
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Creation Progress</h3>
            <Badge variant="secondary">{Math.round(progress)}% Complete</Badge>
          </div>
          <Progress value={progress} className="mb-4" />

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {CREATION_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = session.completedSteps.includes(step.id);
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center mb-2
                    ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }
                  `}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <p
                    className={`text-xs text-center ${isCurrent ? 'font-medium' : 'text-gray-500'}`}
                  >
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(currentStep.icon, { className: 'w-5 h-5' })}
            {currentStep.title}
          </CardTitle>
          <p className="text-gray-600">{currentStep.description}</p>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={previousStep}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          {currentStepIndex === CREATION_STEPS.length - 1 ? (
            <Button onClick={saveTheme} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Theme
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validation Issues</DialogTitle>
          </DialogHeader>
          {validationResult && (
            <div className="space-y-4">
              {validationResult.issues.map((issue, index) => (
                <Alert key={index}>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{issue.message}</AlertDescription>
                </Alert>
              ))}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowValidationDialog(false)}
                >
                  Fix Issues
                </Button>
                {validationResult.issues.every(
                  (issue: any) => issue.type === 'warning'
                ) && (
                  <Button
                    onClick={() => {
                      setShowValidationDialog(false);
                      nextStep();
                    }}
                  >
                    Continue Anyway
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Step Components

const InfoStep: React.FC<{
  theme: Partial<CustomSoundTheme>;
  onUpdate: (field: keyof CustomSoundTheme, value: any) => void;
}> = ({ theme, onUpdate }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="theme-name">Theme Name *</Label>
      <Input
        id="theme-name"
        value={theme.name || ''}
        onChange={(e: any) => onUpdate('name', e.target.value)}
        placeholder="My Awesome Theme"
      />
    </div>

    <div>
      <Label htmlFor="theme-display-name">Display Name</Label>
      <Input
        id="theme-display-name"
        value={theme.displayName || ''}
        onChange={(e: any) => onUpdate('displayName', e.target.value)}
        placeholder="My Awesome Theme (optional)"
      />
    </div>

    <div>
      <Label htmlFor="theme-category">Category *</Label>
      <Select
        value={theme.category}
        onValueChange={(value: CustomSoundThemeCategory) => onUpdate('category', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {THEME_CATEGORIES.map(category => (
            <SelectItem key={category.value} value={category.value}>
              {category.label} - {category.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div>
      <Label htmlFor="theme-description">Description</Label>
      <Textarea
        id="theme-description"
        value={theme.description || ''}
        onChange={(e: any) => onUpdate('description', e.target.value)}
        placeholder="Describe your theme..."
        rows={4}
      />
    </div>
  </div>
);

const SoundsStep: React.FC<{
  userId: string;
  uploadedSounds: CustomSound[];
  onSoundsUpdated: (sounds: CustomSound[]) => void;
}> = ({ userId, uploadedSounds, onSoundsUpdated }) => (
  <div>
    <SoundUploader
      userId={userId}
      onSoundUploaded={(sound: any) => onSoundsUpdated([...uploadedSounds, sound])}
      onSoundDeleted={(soundId: any) =>
        onSoundsUpdated(uploadedSounds.filter((s: any) => s.id !== soundId))
      }
      maxFiles={20}
    />
  </div>
);

const AssignmentStep: React.FC<{
  theme: Partial<CustomSoundTheme>;
  availableSounds: CustomSound[];
  onUpdate: (field: keyof CustomSoundTheme, value: any) => void;
}> = ({ _theme, _availableSounds, _onUpdate }) => (
  <div className="space-y-6">
    <Alert>
      <Info className="w-4 h-4" />
      <AlertDescription>
        Assign your uploaded sounds to different categories. Each category needs at
        least one sound for basic functionality.
      </AlertDescription>
    </Alert>

    <Tabs defaultValue="ui" className="w-full">
      <TabsList>
        <TabsTrigger value="ui">UI Sounds</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="alarms">Alarms</TabsTrigger>
        <TabsTrigger value="ambient">Ambient</TabsTrigger>
      </TabsList>

      <TabsContent value="ui">
        <div className="text-center py-8 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Sound assignment interface will be implemented</p>
          <p className="text-sm">
            This will allow users to assign their uploaded sounds to specific UI actions
          </p>
        </div>
      </TabsContent>

      <TabsContent value="notifications">
        <div className="text-center py-8 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Notification sound assignment interface</p>
        </div>
      </TabsContent>

      <TabsContent value="alarms">
        <div className="text-center py-8 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Alarm sound assignment interface</p>
        </div>
      </TabsContent>

      <TabsContent value="ambient">
        <div className="text-center py-8 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Ambient sound assignment interface</p>
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

const CustomizationStep: React.FC<{
  theme: Partial<CustomSoundTheme>;
  onUpdate: (field: keyof CustomSoundTheme, value: any) => void;
}> = ({ _theme, _onUpdate }) => (
  <div className="text-center py-12 text-gray-500">
    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
    <p>Sound customization interface will be implemented</p>
    <p className="text-sm">
      Volume controls, fade effects, and sound processing options
    </p>
  </div>
);

const PreviewStep: React.FC<{
  theme: Partial<CustomSoundTheme>;
}> = ({ _theme }) => (
  <div className="text-center py-12 text-gray-500">
    <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
    <p>Theme preview and testing interface will be implemented</p>
    <p className="text-sm">
      Play different sounds and test the complete theme experience
    </p>
  </div>
);

const MetadataStep: React.FC<{
  theme: Partial<CustomSoundTheme>;
  onUpdate: (field: keyof CustomSoundTheme, value: any) => void;
}> = ({ theme, onUpdate }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="theme-tags">Tags</Label>
      <Input
        id="theme-tags"
        value={theme.tags?.join(', ') || ''}
        onChange={(e: any) =>
          onUpdate(
            'tags',
            e.target.value
              .split(',')
              .map((tag: any) => tag.trim())
              .filter(Boolean)
          )
        }
        placeholder="relaxing, nature, peaceful"
      />
      <p className="text-sm text-gray-500 mt-1">Separate tags with commas</p>
    </div>
  </div>
);

const SharingStep: React.FC<{
  theme: Partial<CustomSoundTheme>;
  onUpdate: (field: keyof CustomSoundTheme, value: any) => void;
}> = ({ _theme, _onUpdate }) => (
  <div className="text-center py-12 text-gray-500">
    <Share className="w-12 h-12 mx-auto mb-4 opacity-50" />
    <p>Sharing and privacy settings will be implemented</p>
    <p className="text-sm">Control who can see, download, and use your theme</p>
  </div>
);

const PublishStep: React.FC<{
  theme: Partial<CustomSoundTheme>;
  validationResult: ValidationResult | null;
}> = ({ theme, validationResult }) => (
  <div className="space-y-6">
    <div className="text-center">
      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
      <h3 className="text-xl font-medium mb-2">Ready to Publish!</h3>
      <p className="text-gray-600">Your custom sound theme is ready to be saved.</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Theme Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {theme.name}
          </p>
          <p>
            <strong>Category:</strong> {theme.category}
          </p>
          <p>
            <strong>Description:</strong> {theme.description || 'No description'}
          </p>
          <p>
            <strong>Tags:</strong> {theme.tags?.join(', ') || 'None'}
          </p>
        </div>
      </CardContent>
    </Card>

    {validationResult && (
      <Card>
        <CardHeader>
          <CardTitle>Validation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span>Completeness</span>
            <Badge
              variant={validationResult.completeness >= 100 ? 'default' : 'secondary'}
            >
              {validationResult.completeness}%
            </Badge>
          </div>
          <Progress value={validationResult.completeness} />

          {validationResult.suggestions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Suggestions for improvement:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {validationResult.suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion.message}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    )}
  </div>
);

export default CustomSoundThemeCreator;
