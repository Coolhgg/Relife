/// <reference lib="dom" />
import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import {
  Star,
  Camera,
  Send,
  ThumbsUp,
  ThumbsDown,
  Bug,
  Lightbulb,
  MessageSquare,
  X,
  Heart,
  Zap,
  Award,
  Gift,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Smile,
  Frown,
  Meh,
  Angry,
  Laugh,
} from 'lucide-react';
import UserTestingService, { UserFeedback } from '../../services/user-testing';
import { useTheme } from '../../hooks/useTheme';
import { TimeoutHandle } from '../types/timers';

interface RedesignedFeedbackModalProps {
  isOpen: boolean;
  onClose: (
) => void;
  initialType?: 'rating' | 'text' | 'bug' | 'suggestion' | 'complaint';
  onFeedbackSubmitted?: (feedbackId: string, rewardPoints: number
) => void;
  enableGamification?: boolean;
  enableAnonymous?: boolean;
  useMultiStep?: boolean;
  customCategories?: Array<{ id: string; label: string; icon: string; color: string }>;
}

interface FeedbackStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  isComplete: boolean;
  isOptional?: boolean;
}

const EMOJI_REACTIONS = [
  { emoji: '😍', label: 'Love it', value: 5, color: 'text-pink-500' },
  { emoji: '😊', label: 'Like it', value: 4, color: 'text-green-500' },
  { emoji: '😐', label: "It's okay", value: 3, color: 'text-yellow-500' },
  { emoji: '😕', label: 'Dislike it', value: 2, color: 'text-orange-500' },
  { emoji: '😤', label: 'Hate it', value: 1, color: 'text-red-500' },
];

const MOOD_REACTIONS = [
  { icon: Laugh, label: 'Delighted', value: 5, color: 'text-emerald-500' },
  { icon: Smile, label: 'Happy', value: 4, color: 'text-green-500' },
  { icon: Meh, label: 'Neutral', value: 3, color: 'text-gray-500' },
  { icon: Frown, label: 'Sad', value: 2, color: 'text-orange-500' },
  { icon: Angry, label: 'Frustrated', value: 1, color: 'text-red-500' },
];

const DEFAULT_CATEGORIES = [
  { id: 'ui', label: 'User Interface', icon: '🎨', color: 'bg-purple-500' },
  { id: 'performance', label: 'Performance', icon: '⚡', color: 'bg-yellow-500' },
  { id: 'feature', label: 'Features', icon: '✨', color: 'bg-blue-500' },
  { id: 'bug', label: 'Bug Report', icon: '🐛', color: 'bg-red-500' },
  { id: 'sound', label: 'Sounds & Audio', icon: '🔊', color: 'bg-indigo-500' },
  { id: 'accessibility', label: 'Accessibility', icon: '♿', color: 'bg-teal-500' },
  { id: 'themes', label: 'Themes & Design', icon: '🌈', color: 'bg-pink-500' },
  { id: 'alarms', label: 'Alarm Functions', icon: '⏰', color: 'bg-orange-500' },
  { id: 'general', label: 'General', icon: '💬', color: 'bg-gray-500' },
];

export function RedesignedFeedbackModal({
  isOpen,
  onClose,
  initialType = 'text',
  onFeedbackSubmitted,
  enableGamification = true,
  enableAnonymous = true,
  useMultiStep = true,
  customCategories = DEFAULT_CATEGORIES,
}: RedesignedFeedbackModalProps) {
  const { themeConfig } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [feedbackData, setFeedbackData] = useState({
    type: initialType as UserFeedback['type'],
    category: 'general' as UserFeedback['category'],
    rating: 0,
    emojiRating: 0,
    moodRating: 0,
    title: '',
    description: '',
    screenshot: null as string | null,
    tags: [] as string[],
    isAnonymous: false,
    priority: 'medium' as UserFeedback['priority'],
    customFields: {} as Record<string, any>,
  });
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const userTestingService = UserTestingService.getInstance();

  const calculateRewardPoints = (): number => {
    let points = 10; // Base points
    if (feedbackData.description.length > 50) points += 5;
    if (feedbackData.screenshot) points += 10;
    if (feedbackData.tags.length > 0) points += 5;
    if (feedbackData.rating > 0) points += 5;
    if (feedbackData.type === 'bug') points += 15; // Extra for bug reports
    return points;
  };

  const steps: FeedbackStep[] = useMultiStep
    ? [
        {
          id: 'type',
          title: "What's on your mind?",
          description: "Choose the type of feedback you'd like to share",
          component: <TypeSelectionStep />,
          isComplete: feedbackData.type !== null,
        },
        {
          id: 'rating',
          title: 'How are you feeling?',
          description: 'Share your overall experience with us',
          component: <RatingStep />,
          isComplete: feedbackData.rating > 0 || feedbackData.emojiRating > 0,
          isOptional: feedbackData.type === 'bug',
        },
        {
          id: 'details',
          title: 'Tell us more',
          description: 'Share the details of your feedback',
          component: <DetailsStep />,
          isComplete: feedbackData.title.trim() !== '',
        },
        {
          id: 'category',
          title: 'Categorize your feedback',
          description: 'Help us route your feedback to the right team',
          component: <CategoryStep />,
          isComplete: feedbackData.category !== null,
        },
        {
          id: 'extras',
          title: 'Add more context',
          description: 'Optional: Screenshots, tags, and additional details',
          component: <ExtrasStep />,
          isComplete: true,
          isOptional: true,
        },
      ]
    : [
        {
          id: 'all',
          title: 'Share Your Feedback',
          description: 'Help us improve Relife Alarms',
          component: <ComprehensiveStep />,
          isComplete: feedbackData.title.trim() !== '',
        },
      ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const takeScreenshot = async (
) => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.addEventListener('loadedmetadata', (
) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);

        const screenshotData = canvas.toDataURL('image/png');
        setScreenshot(screenshotData);
        setFeedbackData((prev: any
) => ({ ...prev, screenshot: screenshotData }));

        stream.getTracks().forEach(track => track.stop());
      });
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  };

  const nextStep = (
) => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev: any
) => prev + 1);
    }
  };

  const prevStep = (
) => {
    if (currentStep > 0) {
      setCurrentStep((prev: any
) => prev - 1);
    }
  };

  const handleSubmit = async (
) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const submissionData: Partial<UserFeedback> = {
        type: feedbackData.type,
        category: feedbackData.category,
        rating:
          feedbackData.rating || feedbackData.emojiRating || feedbackData.moodRating,
        title: feedbackData.title.trim(),
        description: feedbackData.description.trim(),
        screenshot: feedbackData.screenshot || undefined,
        page: window.location.pathname,
        action: 'gamified_feedback',
      };

      const feedbackId = await userTestingService.submitFeedback(submissionData);

      if (enableGamification) {
        const points = calculateRewardPoints();
        setRewardPoints(points);
        setShowReward(true);
        onFeedbackSubmitted?.(feedbackId, points);
      } else {
        onFeedbackSubmitted?.(feedbackId, 0);
      }

      setSubmitted(true);

      // Reset form after short delay
      setTimeout(
        (
) => {
          resetForm();
          onClose();
        },
        enableGamification ? 3000 : 2000
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = (
) => {
    setFeedbackData({
      type: initialType as UserFeedback['type'],
      category: 'general',
      rating: 0,
      emojiRating: 0,
      moodRating: 0,
      title: '',
      description: '',
      screenshot: null,
      tags: [],
      isAnonymous: false,
      priority: 'medium',
      customFields: {},
    });
    setScreenshot(null);
    setSubmitted(false);
    setIsSubmitting(false);
    setShowReward(false);
    setRewardPoints(0);
    setCurrentStep(0);
  };

  const handleClose = (
) => {
    resetForm();
    onClose();
  };

  // Type Selection Step Component
  function TypeSelectionStep() {
    const types = [
      {
        id: 'rating',
        title: 'Rate Experience',
        description: 'Share your overall satisfaction',
        icon: Star,
        color: 'from-yellow-400 to-orange-500',
        bgColor:
          'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
      },
      {
        id: 'text',
        title: 'General Feedback',
        description: 'Share thoughts and suggestions',
        icon: MessageSquare,
        color: 'from-blue-400 to-purple-500',
        bgColor:
          'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20',
      },
      {
        id: 'suggestion',
        title: 'Feature Idea',
        description: 'Suggest new features or improvements',
        icon: Lightbulb,
        color: 'from-green-400 to-emerald-500',
        bgColor:
          'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      },
      {
        id: 'complaint',
        title: 'Report Issue',
        description: 'Something bothering you?',
        icon: ThumbsDown,
        color: 'from-orange-400 to-red-500',
        bgColor:
          'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
      },
      {
        id: 'bug',
        title: 'Bug Report',
        description: 'Report technical problems',
        icon: Bug,
        color: 'from-red-400 to-pink-500',
        bgColor:
          'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {types.map(type => {
          const Icon = type.icon;
          const isSelected = feedbackData.type === type.id;

          return (
            <button
              key={type.id}
              onClick={(
) =>
                setFeedbackData((prev: any
) => ({ ...prev, type: type.id as any }))
              }
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                isSelected
                  ? `border-primary bg-primary/5 shadow-lg shadow-primary/20`
                  : `border-gray-200 dark:border-gray-700 hover:border-primary/50 ${type.bgColor}`
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${type.color} p-3 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-full h-full text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{type.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {type.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Rating Step Component
  function RatingStep() {
    return (
      <div className="space-y-8">
        {/* Emoji Rating */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">
            How do you feel about Relife Alarms?
          </h3>
          <div className="flex justify-center space-x-4">
            {EMOJI_REACTIONS.map(reaction => (
              <button
                key={reaction.value}
                onClick={(
) =>
                  setFeedbackData((prev: any
) => ({
                    ...prev,
                    emojiRating: reaction.value,
                    rating: reaction.value,
                  }))
                }
                className={`group flex flex-col items-center p-4 rounded-2xl transition-all duration-300 hover:scale-110 ${
                  feedbackData.emojiRating === reaction.value
                    ? 'bg-primary/10 ring-2 ring-primary shadow-lg'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-4xl mb-2 group-hover:animate-bounce">
                  {reaction.emoji}
                </span>
                <span className={`text-sm font-medium ${reaction.color}`}>
                  {reaction.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Star Rating */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Rate your experience</h3>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={(
) =>
                  setFeedbackData((prev: any
) => ({ ...prev, rating: star }))
                }
                className={`p-2 rounded-full transition-all duration-300 hover:scale-125 ${
                  star <= (feedbackData.rating || feedbackData.emojiRating)
                    ? 'text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-200'
                }`}
              >
                <Star className="w-8 h-8 fill-current" />
              </button>
            ))}
          </div>
          {(feedbackData.rating > 0 || feedbackData.emojiRating > 0) && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {feedbackData.rating || feedbackData.emojiRating} out of 5 stars
            </p>
          )}
        </div>

        {/* Mood Slider */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">Express your mood</h3>
          <div className="flex items-center space-x-4">
            {MOOD_REACTIONS.map((mood, index
) => {
              const Icon = mood.icon;
              const isSelected = feedbackData.moodRating === mood.value;

              return (
                <button
                  key={mood.value}
                  onClick={(
) =>
                    setFeedbackData((prev: any
) => ({
                      ...prev,
                      moodRating: mood.value,
                      rating: mood.value,
                    }))
                  }
                  className={`flex-1 flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
                    isSelected
                      ? 'bg-primary/10 ring-2 ring-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon
                    className={`w-8 h-8 ${mood.color} ${isSelected ? 'animate-pulse' : ''}`}
                  />
                  <span className="text-xs mt-1 font-medium">{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Details Step Component
  function DetailsStep() {
    return (
      <div className="space-y-6">
        <div>
          <Label htmlFor="title" className="text-base font-medium">
            Subject *
          </Label>
          <Input
            id="title"
            value={feedbackData.title}
            onChange={(e: any 
) =>
              setFeedbackData((prev: any
) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Brief summary of your feedback..."
            className="mt-2 text-lg"
            required
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-base font-medium">
            Details
          </Label>
          <Textarea
            id="description"
            value={feedbackData.description}
            onChange={(e: any 
) =>
              setFeedbackData((prev: any
) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Tell us more about your experience, what you liked, what could be improved..."
            className="mt-2 min-h-[120px] text-base"
            rows={5}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {feedbackData.description.length} characters
            </span>
            {enableGamification && feedbackData.description.length > 50 && (
              <Badge variant="secondary" className="text-xs">
                +5 bonus points for detailed feedback!
              </Badge>
            )}
          </div>
        </div>

        {enableAnonymous && (
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <Label className="text-base font-medium">Anonymous Feedback</Label>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Keep your feedback anonymous
              </p>
            </div>
            <Switch
              checked={feedbackData.isAnonymous}
              onCheckedChange={(checked: any 
) =>
                setFeedbackData((prev: any
) => ({ ...prev, isAnonymous: checked }))
              }
            />
          </div>
        )}
      </div>
    );
  }

  // Category Step Component
  function CategoryStep() {
    return (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300 text-center">
          This helps us route your feedback to the right team
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {customCategories.map(category => {
            const isSelected = feedbackData.category === category.id;

            return (
              <button
                key={category.id}
                onClick={(
) =>
                  setFeedbackData((prev: any
) => ({
                    ...prev,
                    category: category.id as any,
                  }))
                }
                className={`group relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-full ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <span className="text-xl">{category.icon}</span>
                  </div>
                  <span className="text-sm font-medium">{category.label}</span>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Extras Step Component
  function ExtrasStep() {
    return (
      <div className="space-y-6">
        {/* Screenshot Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">Screenshot (optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={takeScreenshot}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Take Screenshot
              </Button>
            </div>

            {screenshot && (
              <div className="space-y-3">
                <img
                  src={screenshot}
                  alt="Screenshot"
                  className="w-full rounded-lg border"
                />
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">Screenshot attached</Badge>
                  <div className="flex gap-2">
                    {enableGamification && (
                      <Badge variant="outline" className="text-xs">
                        +10 bonus points!
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(
) => {
                        setScreenshot(null);
                        setFeedbackData((prev: any
) => ({ ...prev, screenshot: null }));
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags Section */}
        <div>
          <Label className="text-base font-medium">Tags (optional)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              'Easy to Use',
              'Beautiful Design',
              'Fast Performance',
              'Great Sounds',
              'Accessibility',
              'Mobile Friendly',
            ].map(tag => {
              const isSelected = feedbackData.tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={(
) => {
                    setFeedbackData((prev: any
) => ({
                      ...prev,
                      tags: isSelected
                        ? prev.tags.filter((t: any
) => t !== tag)
                        : [...prev.tags, tag],
                    }));
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          {enableGamification && feedbackData.tags.length > 0 && (
            <Badge variant="secondary" className="text-xs mt-2">
              +5 bonus points for adding tags!
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // Comprehensive Step (for single-step mode)
  function ComprehensiveStep() {
    return (
      <div className="space-y-8">
        <TypeSelectionStep />
        {feedbackData.type && (
          <>
            <div className="border-t pt-6">
              <RatingStep />
            </div>
            <div className="border-t pt-6">
              <DetailsStep />
            </div>
            <div className="border-t pt-6">
              <CategoryStep />
            </div>
            <div className="border-t pt-6">
              <ExtrasStep />
            </div>
          </>
        )}
      </div>
    );
  }

  // Reward Display
  if (submitted && enableGamification && showReward) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your feedback helps us make Relife Alarms better for everyone.
            </p>

            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 mb-4 w-full">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">Reward Earned!</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                {rewardPoints} Points
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Added to your Relife Rewards
              </div>
            </div>

            <Badge variant="secondary" className="mb-4">
              Feedback #{Date.now().toString().slice(-6)}
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Success State
  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <ThumbsUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Feedback Submitted!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Thank you for helping us improve Relife Alarms.
            </p>
            <Badge variant="secondary" className="mb-4">
              Feedback submitted successfully
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={`sm:max-w-2xl max-h-[90vh] overflow-y-auto ${themeConfig.spacing?.borderRadius?.xl ? 'rounded-xl' : 'rounded-lg'}`}
      >
        <DialogHeader className="relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <DialogTitle className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{currentStepData.title}</h2>
              {useMultiStep && (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  Step {currentStep + 1} of {steps.length}
                </p>
              )}
            </div>
          </DialogTitle>

          <DialogDescription className="text-base">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">{currentStepData.component}</div>

        <div className="flex justify-between items-center gap-4 pt-6 border-t">
          <div className="flex items-center gap-2">
            {!isFirstStep && useMultiStep && (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !currentStepData.isComplete}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
                    {enableGamification && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {calculateRewardPoints()} pts
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!currentStepData.isComplete && !currentStepData.isOptional}
                className="flex items-center gap-2"
              >
                {currentStepData.isOptional && !currentStepData.isComplete
                  ? 'Skip'
                  : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}

export default RedesignedFeedbackModal;
