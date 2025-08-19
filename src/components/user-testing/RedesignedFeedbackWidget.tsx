import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  MessageSquare,
  Bug,
  Star,
  Lightbulb,
  X,
  ChevronUp,
  Send,
  ThumbsDown,
  Zap,
  Gift,
  Heart,
  Award,
  Sparkles,
  Users,
  TrendingUp
} from 'lucide-react';
import RedesignedFeedbackModal from './RedesignedFeedbackModal';
import UserTestingService from '../../services/user-testing';
import { useTheme } from '../../hooks/useTheme';

interface RedesignedFeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showBadge?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  enableGamification?: boolean;
  enableAnonymous?: boolean;
  useMultiStep?: boolean;
  userPoints?: number;
  userLevel?: string;
  showStats?: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  action: () => void;
}

export function RedesignedFeedbackWidget({
  position = 'bottom-right',
  showBadge = true,
  autoHide = false,
  autoHideDelay = 5000,
  enableGamification = true,
  enableAnonymous = true,
  useMultiStep = true,
  userPoints = 0,
  userLevel = 'Beginner',
  showStats = true
}: RedesignedFeedbackWidgetProps) {
  const { themeConfig, theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'rating' | 'text' | 'bug' | 'suggestion' | 'complaint'>('text');
  const [isVisible, setIsVisible] = useState(true);
  const [currentPoints, setCurrentPoints] = useState(userPoints);
  const [recentFeedbackCount, setRecentFeedbackCount] = useState(0);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  const userTestingService = UserTestingService.getInstance();

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  // Quick action buttons
  const quickActions: QuickAction[] = [
    {
      id: 'love',
      title: 'Love It!',
      description: 'Share what you love',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'hover:bg-pink-50 dark:hover:bg-pink-900/20',
      action: () => handleQuickFeedback('rating', '💖 I love this app!')
    },
    {
      id: 'suggestion',
      title: 'Got an Idea?',
      description: 'Suggest improvements',
      icon: Lightbulb,
      color: 'text-yellow-600',
      bgColor: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
      action: () => handleQuickFeedback('suggestion', '')
    },
    {
      id: 'bug',
      title: 'Found a Bug?',
      description: 'Report issues',
      icon: Bug,
      color: 'text-red-600',
      bgColor: 'hover:bg-red-50 dark:hover:bg-red-900/20',
      action: () => handleQuickFeedback('bug', '')
    },
    {
      id: 'general',
      title: 'General Feedback',
      description: 'Share your thoughts',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      action: () => handleQuickFeedback('text', '')
    }
  ];

  useEffect(() => {
    if (autoHide && isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, isExpanded]);

  // Pulse animation for engagement
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isExpanded && Math.random() > 0.7) {
        setPulseAnimation(true);
        setTimeout(() => setPulseAnimation(false), 1000);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isExpanded]);

  const handleQuickFeedback = (type: typeof feedbackType, prefilledText?: string) => {
    setFeedbackType(type);
    setShowFeedbackModal(true);
    setIsExpanded(false);
  };

  const handleFeedbackSubmitted = (feedbackId: string, rewardPoints: number) => {
    console.log('Feedback submitted:', feedbackId);
    if (enableGamification) {
      setCurrentPoints(prev => prev + rewardPoints);
      setRecentFeedbackCount(prev => prev + 1);
    }
  };

  const getLevelProgress = () => {
    const levels = [
      { name: 'Beginner', min: 0, max: 100, color: 'from-gray-400 to-gray-500' },
      { name: 'Contributor', min: 100, max: 300, color: 'from-green-400 to-green-500' },
      { name: 'Expert', min: 300, max: 600, color: 'from-blue-400 to-blue-500' },
      { name: 'Master', min: 600, max: 1000, color: 'from-purple-400 to-purple-500' },
      { name: 'Legend', min: 1000, max: Infinity, color: 'from-yellow-400 to-orange-500' }
    ];

    const currentLevel = levels.find(level =>
      currentPoints >= level.min && currentPoints < level.max
    ) || levels[0];

    const progress = currentLevel.max === Infinity
      ? 100
      : ((currentPoints - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;

    return { currentLevel, progress };
  };

  if (!isVisible) return null;

  const { currentLevel, progress } = getLevelProgress();

  return (
    <>
      <div className={`fixed ${positionClasses[position]} z-50 transition-all duration-500 ease-out ${
        isExpanded ? 'scale-100' : 'scale-100'
      }`}>
        {isExpanded ? (
          <Card className={`w-80 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg ${
            themeConfig.spacing?.borderRadius?.xl ? 'rounded-2xl' : 'rounded-lg'
          }`}>
            <CardContent className="p-0">
              {/* Header */}
              <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Feedback Hub</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Help us improve Relife</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Gamification Stats */}
                {enableGamification && showStats && (
                  <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">{currentLevel.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-sm font-bold">{currentPoints}</span>
                      </div>
                    </div>
                    {currentLevel.max !== Infinity && (
                      <div className="space-y-1">
                        <Progress
                          value={progress}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{currentLevel.min}</span>
                          <span>{currentLevel.max}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Quick Actions
                </h4>

                <div className="space-y-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={action.action}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] ${action.bgColor} group`}
                      >
                        <div className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className={`w-4 h-4 ${action.color}`} />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-medium text-sm">{action.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{action.description}</div>
                        </div>
                        {enableGamification && (
                          <Badge variant="secondary" className="text-xs">
                            {action.id === 'bug' ? '25' : action.id === 'love' ? '15' : '10'} pts
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Detailed Feedback Button */}
                <button
                  onClick={() => {
                    setFeedbackType('text');
                    setShowFeedbackModal(true);
                    setIsExpanded(false);
                  }}
                  className="w-full mt-4 p-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Share Detailed Feedback
                </button>
              </div>

              {/* Stats Footer */}
              {enableGamification && showStats && recentFeedbackCount > 0 && (
                <div className="p-4 border-t bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-b-2xl">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">Recent feedback: {recentFeedbackCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Gift className="w-3 h-3" />
                      <span className="text-xs font-bold">+{recentFeedbackCount * 10} pts earned</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <Button
              onClick={() => setIsExpanded(true)}
              className={`rounded-full w-14 h-14 shadow-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-4 border-white/20 ${
                pulseAnimation ? 'animate-pulse' : ''
              }`}
              size="lg"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>

            {/* Notification Badge */}
            {showBadge && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg animate-bounce">
                <Zap className="w-3 h-3" />
              </div>
            )}

            {/* Points Display */}
            {enableGamification && showStats && currentPoints > 0 && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded-full shadow-lg border text-xs font-bold text-primary whitespace-nowrap">
                {currentPoints} pts
              </div>
            )}

            {/* Level Badge */}
            {enableGamification && showStats && userLevel && (
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                {currentLevel.name.charAt(0)}
              </div>
            )}
          </div>
        )}
      </div>

      <RedesignedFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        initialType={feedbackType}
        onFeedbackSubmitted={handleFeedbackSubmitted}
        enableGamification={enableGamification}
        enableAnonymous={enableAnonymous}
        useMultiStep={useMultiStep}
      />
    </>
  );
}

export default RedesignedFeedbackWidget;