import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  MessageSquare,
  Bug,
  Star,
  Lightbulb,
  X,
  ChevronUp,
  Send,
  ThumbsDown
} from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import BugReportModal from './BugReportModal';
import UserTestingService from '../../services/user-testing';

interface FeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showBadge?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function FeedbackWidget({
  position = 'bottom-right',
  showBadge = true,
  autoHide = false,
  autoHideDelay = 3000
}: FeedbackWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'rating' | 'text' | 'bug' | 'suggestion' | 'complaint'>('text');
  const [isVisible, setIsVisible] = useState(true);
  const [hasNewFeatures, setHasNewFeatures] = useState(true);

  const userTestingService = UserTestingService.getInstance();

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const feedbackOptions = [
    {
      id: 'rating',
      title: 'Rate App',
      description: 'Share your overall experience',
      icon: Star,
      color: 'text-yellow-600 hover:text-yellow-700',
      bgColor: 'hover:bg-yellow-50'
    },
    {
      id: 'text',
      title: 'General Feedback',
      description: 'Share thoughts and suggestions',
      icon: MessageSquare,
      color: 'text-blue-600 hover:text-blue-700',
      bgColor: 'hover:bg-blue-50'
    },
    {
      id: 'suggestion',
      title: 'Feature Idea',
      description: 'Suggest new features',
      icon: Lightbulb,
      color: 'text-green-600 hover:text-green-700',
      bgColor: 'hover:bg-green-50'
    },
    {
      id: 'complaint',
      title: 'Report Issue',
      description: 'Something bothering you?',
      icon: ThumbsDown,
      color: 'text-orange-600 hover:text-orange-700',
      bgColor: 'hover:bg-orange-50'
    },
    {
      id: 'bug',
      title: 'Bug Report',
      description: 'Report technical problems',
      icon: Bug,
      color: 'text-red-600 hover:text-red-700',
      bgColor: 'hover:bg-red-50'
    }
  ] as const;

  useEffect(() => {
    if (autoHide && isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, isExpanded]);

  const handleFeedbackOptionClick = (optionId: string) => {
    if (optionId === 'bug') {
      setShowBugModal(true);
    } else {
      setFeedbackType(optionId as typeof feedbackType);
      setShowFeedbackModal(true);
    }
    setIsExpanded(false);
  };

  const handleFeedbackSubmitted = (feedbackId: string) => {
    console.log('Feedback submitted:', feedbackId);
    setHasNewFeatures(false);
  };

  const handleBugReported = (bugId: string) => {
    console.log('Bug reported:', bugId);
    setHasNewFeatures(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className={`fixed ${positionClasses[position]} z-50 transition-all duration-300 ease-in-out`}>
        {isExpanded ? (
          <Card className="w-80 shadow-lg border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Share Your Feedback</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {feedbackOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleFeedbackOptionClick(option.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${option.bgColor} hover:border-gray-300`}
                    >
                      <Icon className={`w-5 h-5 ${option.color}`} />
                      <div className="text-left">
                        <div className="font-medium text-sm">{option.title}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t">
                <p className="text-xs text-gray-500 text-center">
                  Your feedback helps improve Relife Alarms
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <Button
              onClick={() => setIsExpanded(true)}
              className="rounded-full w-14 h-14 shadow-lg hover:scale-110 transition-transform duration-200"
              size="lg"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>

            {showBadge && hasNewFeatures && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 min-w-6 h-6 text-xs flex items-center justify-center p-1"
              >
                <Send className="w-3 h-3" />
              </Badge>
            )}
          </div>
        )}
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        initialType={feedbackType}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />

      <BugReportModal
        isOpen={showBugModal}
        onClose={() => setShowBugModal(false)}
        onBugReported={handleBugReported}
      />
    </>
  );
}

export default FeedbackWidget;