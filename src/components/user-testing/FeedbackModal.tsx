/// <reference lib="dom" />
import React, { useState, useRef } from 'react';
import {
import path
import { Textarea } from './ui/textarea';
import path
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from './ui/progress';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
} from 'lucide-react';
import UserTestingService, { UserFeedback } from '../../services/user-testing';
import { TimeoutHandle } from '../types/timers';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'rating' | 'text' | 'bug' | 'suggestion' | 'complaint';
  onFeedbackSubmitted?: (feedbackId: string) => void;
}

export function FeedbackModal({
  isOpen,
  onClose,
  initialType = 'text',
  onFeedbackSubmitted,
}: FeedbackModalProps) {
  const [activeTab, setActiveTab] = useState(initialType);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<UserFeedback['category']>('general');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const userTestingService = UserTestingService.getInstance();

  const categories = [
    { id: 'ui', label: 'User Interface', icon: '🎨' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'feature', label: 'Features', icon: '✨' },
    { id: 'bug', label: 'Bug Report', icon: '🐛' },
    { id: 'general', label: 'General', icon: '💬' },
  ] as const;

  const takeScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.addEventListener('loadedmetadata', () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);

        const screenshotData = canvas.toDataURL('image/png');
        setScreenshot(screenshotData);

        stream.getTracks().forEach(track => track.stop());
      });
    } catch (_error) {
      console._error('Failed to take screenshot:', _error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !title.trim()) return;

    setIsSubmitting(true);

    try {
      const feedbackData: Partial<UserFeedback> = {
        type: activeTab as UserFeedback['type'],
        category,
        rating: activeTab === 'rating' ? rating : undefined,
        title: title.trim(),
        description: description.trim(),
        screenshot: screenshot || undefined,
        page: window.location.pathname,
        action: 'manual_feedback',
      };

      const feedbackId = await userTestingService.submitFeedback(feedbackData);

      setSubmitted(true);
      onFeedbackSubmitted?.(feedbackId);

      // Reset form after short delay
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
    } catch (_error) {
      console._error('Failed to submit feedback:', _error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setTitle('');
    setDescription('');
    setCategory('general');
    setScreenshot(null);
    setSubmitted(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <ThumbsUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Thank you for your feedback!</h3>
            <p className="text-gray-600 mb-4">
              Your input helps us improve the Relife Alarms experience.
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve Relife Alarms by sharing your thoughts and experiences.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="rating" className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Rating</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Comment</span>
            </TabsTrigger>
            <TabsTrigger value="suggestion" className="flex items-center gap-1">
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Idea</span>
            </TabsTrigger>
            <TabsTrigger value="bug" className="flex items-center gap-1">
              <Bug className="w-4 h-4" />
              <span className="hidden sm:inline">Bug</span>
            </TabsTrigger>
            <TabsTrigger value="complaint" className="flex items-center gap-1">
              <ThumbsDown className="w-4 h-4" />
              <span className="hidden sm:inline">Issue</span>
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <TabsContent value="rating" className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  How would you rate your experience?
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1 rounded ${
                        star <= rating
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-gray-600">
                      {rating} star{rating !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div>
                <Label className="text-base font-medium">Share your thoughts</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Tell us what you love, what could be better, or any general feedback.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="suggestion" className="space-y-4">
              <div>
                <Label className="text-base font-medium">What's your idea?</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Share feature requests, improvements, or new ideas for Relife Alarms.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="bug" className="space-y-4">
              <div>
                <Label className="text-base font-medium">Report a problem</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Describe any issues, crashes, or unexpected behavior you've
                  encountered.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="complaint" className="space-y-4">
              <div>
                <Label className="text-base font-medium">What's bothering you?</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Let us know about any frustrations or concerns with the app.
                </p>
              </div>
            </TabsContent>

            {/* Common form fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Subject *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Brief summary of your feedback"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Provide more details about your feedback..."
                  className="mt-1 min-h-[100px]"
                  rows={4}
                />
              </div>

              <div>
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        category === cat.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="text-sm">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Screenshot (optional)</Label>
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
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Screenshot attached</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setScreenshot(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <img
                        src={screenshot}
                        alt="Screenshot"
                        className="w-full h-32 object-cover rounded border"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="flex items-center gap-2"
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
                  </>
                )}
              </Button>
            </div>
          </form>
        </Tabs>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackModal;
