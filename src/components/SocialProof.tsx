import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Star, 
  Activity,
  Award,
  Heart,
  MessageSquare,
  ArrowUp,
  Sparkles
} from 'lucide-react';
import { 
  SocialProofData, 
  CommunityStats, 
  SuccessStory, 
  RealtimeActivity 
} from '../types/struggling-sam';

interface SocialProofProps {
  socialProofData: SocialProofData[];
  communityStats: CommunityStats;
  successStories: SuccessStory[];
  realtimeActivity: RealtimeActivity[];
  userPersona?: string;
  onStoryClick?: (story: SuccessStory) => void;
  className?: string;
  autoRotate?: boolean;
  showTestimonials?: boolean;
}

export const SocialProof: React.FC<SocialProofProps> = ({
  socialProofData,
  communityStats,
  successStories,
  realtimeActivity,
  userPersona = 'struggling_sam',
  onStoryClick,
  className = '',
  autoRotate = true,
  showTestimonials = true
}) => {
  const [currentProofIndex, setCurrentProofIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [realtimeIndex, setRealtimeIndex] = useState(0);

  // Auto-rotate social proof messages
  useEffect(() => {
    if (!autoRotate || socialProofData.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentProofIndex(prev => (prev + 1) % socialProofData.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [socialProofData.length, autoRotate]);

  // Auto-rotate success stories
  useEffect(() => {
    if (!autoRotate || successStories.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentStoryIndex(prev => (prev + 1) % successStories.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [successStories.length, autoRotate]);

  // Auto-rotate realtime activity
  useEffect(() => {
    if (!autoRotate || realtimeActivity.length <= 1) return;
    
    const interval = setInterval(() => {
      setRealtimeIndex(prev => (prev + 1) % realtimeActivity.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [realtimeActivity.length, autoRotate]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getPersonaRelevantStories = () => {
    return successStories.filter(story => 
      story.persona === userPersona || story.featured
    ).slice(0, 3);
  };

  const personalizedStories = getPersonaRelevantStories();
  const currentProof = socialProofData[currentProofIndex];
  const currentStory = personalizedStories[currentStoryIndex % personalizedStories.length];
  const currentActivity = realtimeActivity[realtimeIndex];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Community Stats Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <motion.div
              className="space-y-1"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center justify-center gap-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold text-primary">
                  {formatNumber(communityStats.totalUsers)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </motion.div>

            <motion.div
              className="space-y-1"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center justify-center gap-1">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {formatNumber(communityStats.activeToday)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Active Today</div>
            </motion.div>

            <motion.div
              className="space-y-1"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-2xl font-bold text-orange-600">
                  {communityStats.averageStreak.toFixed(0)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Avg Streak</div>
            </motion.div>

            <motion.div
              className="space-y-1"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center justify-center gap-1">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">
                  {Math.round(communityStats.successRate * 100)}%
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Dynamic Social Proof Messages */}
        <Card className="h-fit">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-h-[60px] flex items-center">
                <AnimatePresence mode="wait">
                  {currentProof && (
                    <motion.div
                      key={currentProof.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="w-full"
                    >
                      <div className="font-medium text-foreground mb-1">
                        {currentProof.content.includes('{count}') 
                          ? currentProof.content.replace('{count}', formatNumber(communityStats.activeToday))
                          : currentProof.content
                        }
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {currentProof.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(currentProof.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Realtime Activity Feed */}
        <Card className="h-fit">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="font-medium text-sm">Live Activity</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            
            <div className="space-y-2 max-h-24 overflow-hidden">
              <AnimatePresence mode="wait">
                {currentActivity && (
                  <motion.div
                    key={currentActivity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {currentActivity.type === 'streak_started' && <TrendingUp className="w-3 h-3" />}
                      {currentActivity.type === 'achievement_unlocked' && <Award className="w-3 h-3" />}
                      {currentActivity.type === 'challenge_joined' && <Users className="w-3 h-3" />}
                      {currentActivity.type === 'milestone_reached' && <Star className="w-3 h-3" />}
                    </div>
                    <span className="text-muted-foreground">{currentActivity.message}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(currentActivity.timestamp).toLocaleTimeString()}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Stories Carousel */}
      {showTestimonials && personalizedStories.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Success Stories</h3>
              <Badge variant="secondary" className="ml-auto">
                {personalizedStories.length} stories
              </Badge>
            </div>

            <AnimatePresence mode="wait">
              {currentStory && (
                <motion.div
                  key={currentStory.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="cursor-pointer"
                  onClick={() => onStoryClick?.(currentStory)}
                >
                  <Card className="bg-gradient-to-br from-muted/20 to-muted/5 border-muted/40 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 border-2 border-primary/20">
                          <AvatarImage src={currentStory.userAvatar} alt={currentStory.userName} />
                          <AvatarFallback>
                            {currentStory.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{currentStory.userName}</h4>
                            {currentStory.verified && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                Verified
                              </Badge>
                            )}
                          </div>
                          
                          <h5 className="font-medium text-primary mb-2">{currentStory.title}</h5>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                            {currentStory.story}
                          </p>
                          
                          {/* Before/After Stats */}
                          <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-muted/20 rounded-lg">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Before</div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <Clock className="w-3 h-3" />
                                  {currentStory.beforeAfter.before.wakeUpTime}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <TrendingUp className="w-3 h-3" />
                                  {currentStory.beforeAfter.before.consistency}% consistent
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">After</div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <Clock className="w-3 h-3 text-green-600" />
                                  {currentStory.beforeAfter.after.wakeUpTime}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <TrendingUp className="w-3 h-3 text-green-600" />
                                  {currentStory.beforeAfter.after.consistency}% consistent
                                  <ArrowUp className="w-3 h-3 text-green-600" />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-muted-foreground">
                                  {formatNumber(currentStory.likes)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-muted-foreground">
                                  {formatNumber(currentStory.shares)}
                                </span>
                              </div>
                            </div>
                            
                            <Badge variant="outline" className="text-xs">
                              {currentStory.beforeAfter.after.streakDays} day streak
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Story Navigation Dots */}
            {personalizedStories.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {personalizedStories.map((_, index) => (
                  <motion.button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStoryIndex % personalizedStories.length 
                        ? 'bg-primary' 
                        : 'bg-muted'
                    }`}
                    onClick={() => setCurrentStoryIndex(index)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upgrade Social Proof */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4 text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 text-green-700 dark:text-green-300 font-medium"
          >
            <Users className="w-5 h-5" />
            Join {formatNumber(15420)}+ users who upgraded for better results
          </motion.div>
          <div className="text-sm text-muted-foreground mt-1">
            97% report improved morning consistency within 30 days
          </div>
        </CardContent>
      </Card>
    </div>
  );
};