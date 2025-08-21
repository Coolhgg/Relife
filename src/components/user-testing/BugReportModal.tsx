/// <reference lib="dom" />
import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import {
  Bug,
  Camera,
  Video,
  Send,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  Smartphone,
  Monitor,
  Wifi,
  Clock
} from 'lucide-react';
import UserTestingService, { BugReport } from '../../services/user-testing';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBugReported?: (bugId: string) => void;
}

export function BugReportModal({
  isOpen,
  onClose,
  onBugReported
}: BugReportModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [steps, setSteps] = useState<string[]>(['']);
  const [severity, setSeverity] = useState<BugReport['severity']>('medium');
  const [category, setCategory] = useState<BugReport['category']>('feature');
  const [frequency, setFrequency] = useState<BugReport['frequency']>('sometimes');
  const [reproducible, setReproducible] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const userTestingService = UserTestingService.getInstance();

  const severityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800', icon: '🟢' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800', icon: '🔴' }
  ] as const;

  const categoryOptions = [
    { value: 'crash', label: 'App Crash', icon: '💥' },
    { value: 'ui', label: 'User Interface', icon: '🎨' },
    { value: 'performance', label: 'Performance', icon: '⚡' },
    { value: 'data', label: 'Data Issues', icon: '🗄️' },
    { value: 'feature', label: 'Feature Problem', icon: '⚙️' },
    { value: 'security', label: 'Security Issue', icon: '🔒' }
  ] as const;

  const frequencyOptions = [
    { value: 'once', label: 'Happened once' },
    { value: 'sometimes', label: 'Happens sometimes' },
    { value: 'often', label: 'Happens often' },
    { value: 'always', label: 'Always happens' }
  ] as const;

  const takeScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
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
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      setSteps(newSteps);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !title.trim() || !description.trim()) return;

    setIsSubmitting(true);

    try {
      const bugData: Partial<BugReport> = {
        title: title.trim(),
        description: description.trim(),
        steps: steps.filter(step => step.trim() !== ''),
        expectedBehavior: expectedBehavior.trim(),
        actualBehavior: actualBehavior.trim(),
        severity,
        category,
        screenshot: screenshot || undefined,
        reproducible,
        frequency,
        tags
      };

      const bugId = await userTestingService.submitBugReport(bugData);

      setSubmitted(true);
      onBugReported?.(bugId);

      // Reset form after short delay
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Failed to submit bug report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setExpectedBehavior('');
    setActualBehavior('');
    setSteps(['']);
    setSeverity('medium');
    setCategory('feature');
    setFrequency('sometimes');
    setReproducible(true);
    setTags([]);
    setNewTag('');
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Bug Report Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Thank you for helping us improve Relife Alarms. We'll investigate this issue.
            </p>
            <Badge variant="secondary" className="mb-4">
              Report #BR-{Date.now().toString().slice(-6)}
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Help us fix issues by providing detailed information about the problem you encountered.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Bug Details</TabsTrigger>
            <TabsTrigger value="reproduction">Reproduction</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <TabsContent value="details" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Bug Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Brief summary of the bug"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the bug in detail..."
                    className="mt-1 min-h-[100px]"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Severity</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {severityOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSeverity(option.value)}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                            severity === option.value
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span>{option.icon}</span>
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Category</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {categoryOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setCategory(option.value)}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                            category === option.value
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span>{option.icon}</span>
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>How often does this happen?</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {frequencyOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFrequency(option.value)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          frequency === option.value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Can you reproduce this bug?</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Can you make this bug happen again by following specific steps?
                    </p>
                  </div>
                  <Switch checked={reproducible} onCheckedChange={setReproducible} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reproduction" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="expected">What did you expect to happen?</Label>
                  <Textarea
                    id="expected"
                    value={expectedBehavior}
                    onChange={e => setExpectedBehavior(e.target.value)}
                    placeholder="Describe what you thought would happen..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="actual">What actually happened?</Label>
                  <Textarea
                    id="actual"
                    value={actualBehavior}
                    onChange={e => setActualBehavior(e.target.value)}
                    placeholder="Describe what actually happened instead..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {reproducible && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Steps to reproduce</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addStep}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Step
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">{index + 1}</span>
                          </div>
                          <Input
                            value={step}
                            onChange={e => updateStep(index, e.target.value)}
                            placeholder={`Step ${index + 1}...`}
                            className="flex-1"
                          />
                          {steps.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStep(index)}
                              className="flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Tags (optional)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      disabled={!newTag.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="space-y-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Camera className="w-5 h-5" />
                      Screenshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {screenshot ? (
                      <div className="space-y-3">
                        <img
                          src={screenshot}
                          alt="Bug screenshot"
                          className="w-full rounded border"
                        />
                        <div className="flex justify-between items-center">
                          <Badge variant="secondary">Screenshot attached</Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setScreenshot(null)}
                          >
                            <X className="w-4 h-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                          A screenshot can help us understand the issue better
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={takeScreenshot}
                        >
                          Take Screenshot
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Smartphone className="w-5 h-5" />
                      System Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Screen:</span>
                        <span>{window.screen.width}×{window.screen.height}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Connection:</span>
                        <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Timestamp:</span>
                        <span>{new Date().toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Page:</span>
                        <span>{window.location.pathname}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <Separator />

            <div className="flex justify-end gap-3 pt-4">
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
                disabled={isSubmitting || !title.trim() || !description.trim()}
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
                    Submit Bug Report
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

export default BugReportModal;