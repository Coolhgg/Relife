// Persona-Driven UI Components for Relife Alarm App
// Adapts interface based on user persona and subscription tier

import React, { useState, useEffect } from 'react';
import {
  User,
  Clock,
  Star,
  Users,
  GraduationCap,
  Crown,
  Target,
  TrendingUp,
} from 'lucide-react';

interface PersonaUIProps {
  userId: string;
  currentTier: 'free' | 'basic' | 'premium' | 'pro' | 'student' | 'lifetime';
  userPersona?:
    | 'struggling_sam'
    | 'busy_ben'
    | 'professional_paula'
    | 'enterprise_emma'
    | 'student_sarah'
    | 'lifetime_larry';
  onPersonaDetected?: (persona: string) => void;
}

// Persona detection based on user behavior and preferences
export function usePersonaDetection(userId: string, userBehavior: any) {
  const [detectedPersona, setDetectedPersona] = useState<string>('');

  useEffect(() => {
    const detectPersona = () => {
      const {
        subscriptionTier,
        ageRange,
        usagePatterns,
        priceInteraction,
        featurePreferences,
        deviceType,
        timeOfDay,
      } = userBehavior;

      // Persona detection algorithm
      if (
        subscriptionTier === 'free' &&
        priceInteraction?.viewedPricing > 3 &&
        !priceInteraction?.clickedUpgrade
      ) {
        return 'struggling_sam'; // Price-sensitive, exploring but not converting
      }

      if (
        subscriptionTier === 'basic' &&
        usagePatterns?.alarmsPerDay <= 5 &&
        featurePreferences?.includesCustomSounds
      ) {
        return 'busy_ben'; // Values practical features, moderate usage
      }

      if (
        (subscriptionTier === 'premium' || subscriptionTier === 'pro') &&
        featurePreferences?.includesCalendarSync &&
        usagePatterns?.morningOptimization
      ) {
        return 'professional_paula'; // Productivity-focused, optimizes everything
      }

      if (subscriptionTier === 'pro' && featurePreferences?.includesTeamFeatures) {
        return 'enterprise_emma'; // Team/enterprise features user
      }

      if (subscriptionTier === 'student' || ageRange === '18-25') {
        return 'student_sarah'; // Student or young adult
      }

      if (subscriptionTier === 'lifetime' || priceInteraction?.viewedLifetimeTier > 2) {
        return 'lifetime_larry'; // Prefers one-time payments
      }

      return 'busy_ben'; // Default to most common persona
    };

    const persona = detectPersona();
    setDetectedPersona(persona);
  }, [userBehavior]);

  return detectedPersona;
}

// Persona-specific pricing display component
export function PersonaDrivenPricingCard({
  userPersona,
  currentTier,
  onUpgrade,
}: {
  userPersona: string;
  currentTier: string;
  onUpgrade: (tier: string) => void;
}) {
  const getPersonaMessaging = (persona: string) => {
    const messaging = {
      struggling_sam: {
        headline: 'Start Free, Upgrade When Ready',
        subheadline: 'No credit card required • Join 50k+ users',
        cta: 'Try Free Now',
        socialProof: "⭐⭐⭐⭐⭐ 'Actually helped me wake up!' - Sam K.",
        emphasis: 'free',
        colors: 'bg-green-50 border-green-200 text-green-800',
      },
      busy_ben: {
        headline: 'Less Than Your Daily Coffee',
        subheadline: '$3.99/month for reliable mornings',
        cta: 'Upgrade to Basic',
        socialProof: "💼 'Perfect for busy mornings!' - Ben M.",
        emphasis: 'value',
        colors: 'bg-blue-50 border-blue-200 text-blue-800',
      },
      professional_paula: {
        headline: 'Most Popular with Professionals',
        subheadline: 'AI-optimized mornings • Calendar sync • Analytics',
        cta: 'Go Premium',
        socialProof: "🎯 'Boosted my productivity 40%' - Paula R.",
        emphasis: 'features',
        colors: 'bg-purple-50 border-purple-200 text-purple-800',
      },
      enterprise_emma: {
        headline: 'Complete Solution for Teams',
        subheadline: 'Everything included • API access • Dedicated support',
        cta: 'Get Pro Access',
        socialProof: "🏢 'Transformed our team's productivity' - Emma L.",
        emphasis: 'comprehensive',
        colors: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      },
      student_sarah: {
        headline: 'Student Discount - 50% Off!',
        subheadline: "Because we've been there 🎓",
        cta: 'Verify Student Status',
        socialProof: "📚 'Perfect for my crazy schedule!' - Sarah T.",
        emphasis: 'discount',
        colors: 'bg-orange-50 border-orange-200 text-orange-800',
      },
      lifetime_larry: {
        headline: 'Never Pay Again!',
        subheadline: 'One payment • Lifetime access • All features',
        cta: 'Buy Lifetime',
        socialProof: "👑 'Best investment I made' - Larry H.",
        emphasis: 'lifetime',
        colors: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      },
    };

    return messaging[persona] || messaging.busy_ben;
  };

  const msg = getPersonaMessaging(userPersona);

  return (
    <div className={`p-6 rounded-lg border-2 ${msg.colors} mb-4`}>
      <h3 className="text-xl font-bold mb-2">{msg.headline}</h3>
      <p className="text-sm mb-3">{msg.subheadline}</p>
      <button
        onClick={() => onUpgrade(userPersona)}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all"
      >
        {msg.cta}
      </button>
      <p className="text-xs mt-3 italic">{msg.socialProof}</p>
    </div>
  );
}

// Persona-specific onboarding flow
export function PersonaDrivenOnboarding({
  userPersona,
  onComplete,
}: {
  userPersona: string;
  onComplete: (preferences: any) => void;
}) {
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState({});

  const getPersonaOnboarding = (persona: string) => {
    const flows = {
      struggling_sam: {
        steps: [
          {
            title: "Welcome! Let's start simple",
            description: 'Set up your first alarm - completely free',
            icon: <Clock className="w-8 h-8 text-green-600" />,
            action: 'basic_setup',
          },
          {
            title: "You're all set!",
            description: 'Your alarm is ready. Upgrade anytime for more features.',
            icon: <Star className="w-8 h-8 text-green-600" />,
            action: 'complete',
          },
        ],
      },
      busy_ben: {
        steps: [
          {
            title: 'Quick morning routine setup',
            description: "Let's optimize your mornings efficiently",
            icon: <Target className="w-8 h-8 text-blue-600" />,
            action: 'routine_setup',
          },
          {
            title: 'Choose your wake-up sounds',
            description: 'Upload custom sounds or pick from our library',
            icon: <Users className="w-8 h-8 text-blue-600" />,
            action: 'sound_setup',
          },
        ],
      },
      professional_paula: {
        steps: [
          {
            title: 'Connect your calendar',
            description: 'Sync with Google/Outlook for smart scheduling',
            icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
            action: 'calendar_sync',
          },
          {
            title: 'AI optimization preferences',
            description: 'Set your productivity goals and preferences',
            icon: <Star className="w-8 h-8 text-purple-600" />,
            action: 'ai_setup',
          },
        ],
      },
      student_sarah: {
        steps: [
          {
            title: 'Verify your student status',
            description: 'Get 50% off with your .edu email or student ID',
            icon: <GraduationCap className="w-8 h-8 text-orange-600" />,
            action: 'student_verification',
          },
          {
            title: 'Set up your class schedule',
            description: "We'll optimize alarms around your academic calendar",
            icon: <Clock className="w-8 h-8 text-orange-600" />,
            action: 'academic_schedule',
          },
        ],
      },
      enterprise_emma: {
        steps: [
          {
            title: 'Team setup and management',
            description: 'Configure team features and admin controls',
            icon: <Users className="w-8 h-8 text-indigo-600" />,
            action: 'team_setup',
          },
          {
            title: 'API and integrations',
            description: 'Connect to your existing productivity stack',
            icon: <Crown className="w-8 h-8 text-indigo-600" />,
            action: 'api_setup',
          },
        ],
      },
    };

    return flows[persona] || flows.busy_ben;
  };

  const flow = getPersonaOnboarding(userPersona);
  const currentStep = flow.steps[step];

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        {currentStep.icon}
        <h2 className="text-2xl font-bold mt-4 mb-2">{currentStep.title}</h2>
        <p className="text-gray-600">{currentStep.description}</p>
      </div>

      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / flow.steps.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Step {step + 1} of {flow.steps.length}
        </p>
      </div>

      <button
        onClick={() => {
          if (step < flow.steps.length - 1) {
            setStep(step + 1);
          } else {
            onComplete(preferences);
          }
        }}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        {step < flow.steps.length - 1 ? 'Continue' : 'Complete Setup'}
      </button>
    </div>
  );
}

// Persona-specific feature highlights
export function PersonaFeatureHighlights({ userPersona }: { userPersona: string }) {
  const getPersonaFeatures = (persona: string) => {
    const features = {
      struggling_sam: [
        {
          icon: '🆓',
          title: 'Always Free',
          description: 'Core features never cost a thing',
        },
        {
          icon: '👥',
          title: 'Join 50k+ Users',
          description: 'Trusted by thousands daily',
        },
        {
          icon: '⚡',
          title: 'Instant Setup',
          description: 'Working in under 30 seconds',
        },
      ],
      busy_ben: [
        {
          icon: '☕',
          title: 'Coffee Price',
          description: 'Less than $4/month for better mornings',
        },
        {
          icon: '🎵',
          title: 'Custom Sounds',
          description: 'Upload your perfect wake-up sound',
        },
        {
          icon: '⏰',
          title: 'Multiple Alarms',
          description: 'Work, weekend, and everything between',
        },
      ],
      professional_paula: [
        {
          icon: '📈',
          title: 'Productivity Boost',
          description: 'AI-optimized wake times for peak performance',
        },
        {
          icon: '📅',
          title: 'Calendar Sync',
          description: 'Automatic adjustment based on your schedule',
        },
        {
          icon: '📊',
          title: 'Analytics',
          description: 'Track patterns and optimize over time',
        },
      ],
      enterprise_emma: [
        {
          icon: '👥',
          title: 'Team Features',
          description: 'Manage and motivate entire teams',
        },
        {
          icon: '🔌',
          title: 'API Access',
          description: 'Integrate with your existing tools',
        },
        {
          icon: '🏷️',
          title: 'White Label',
          description: 'Customize branding for your organization',
        },
      ],
      student_sarah: [
        {
          icon: '🎓',
          title: 'Student Discount',
          description: '50% off because education matters',
        },
        {
          icon: '📚',
          title: 'Academic Calendar',
          description: 'Sync with semester and exam schedules',
        },
        {
          icon: '👫',
          title: 'Study Groups',
          description: 'Coordinate wake-up times with friends',
        },
      ],
      lifetime_larry: [
        {
          icon: '👑',
          title: 'Own It Forever',
          description: 'One payment, lifetime access',
        },
        {
          icon: '🌟',
          title: 'Founder Status',
          description: 'Exclusive badge and early features',
        },
        {
          icon: '💎',
          title: 'Premium Support',
          description: 'Priority help whenever you need it',
        },
      ],
    };

    return features[persona] || features.busy_ben;
  };

  const features = getPersonaFeatures(userPersona);

  return (
    <div className="grid md:grid-cols-3 gap-4 my-6">
      {features.map((feature, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg text-center">
          <div className="text-3xl mb-2">{feature.icon}</div>
          <h4 className="font-semibold mb-1">{feature.title}</h4>
          <p className="text-sm text-gray-600">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}

// Main persona-driven UI wrapper
export function PersonaDrivenUI({
  userId,
  currentTier,
  userPersona,
  onPersonaDetected,
}: PersonaUIProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (userPersona && onPersonaDetected) {
      onPersonaDetected(userPersona);
    }
  }, [userPersona, onPersonaDetected]);

  return (
    <div className="persona-driven-ui">
      {showOnboarding && userPersona && (
        <PersonaDrivenOnboarding
          userPersona={userPersona}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {userPersona && (
        <>
          <PersonaDrivenPricingCard
            userPersona={userPersona}
            currentTier={currentTier}
            onUpgrade={tier => console.log('Upgrade to:', tier)}
          />
          <PersonaFeatureHighlights userPersona={userPersona} />
        </>
      )}
    </div>
  );
}
