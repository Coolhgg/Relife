import React, { useState, useEffect } from 'react';
import { TimeoutHandle } from '../types/timers';
import {
  Crown,
  Star,
  Zap,
  Timer,
  TrendingUp,
  Users,
  Shield,
  ArrowRight,
  Sparkles,
  Trophy,
  Target,
  Clock,
  Fire,
} from 'lucide-react';

interface PsychologyDrivenCTAProps {
  /** Primary call-to-action text */
  primaryText?: string;
  /** Secondary supporting text */
  secondaryText?: string;
  /** Target subscription tier */
  /** Callback when CTA is clicked */
  /** Psychology trigger to use */
  trigger?:
    | 'scarcity'
    | 'social_proof'
    | 'urgency'
    | 'loss_aversion'
    | 'authority'
    | 'reciprocity';
  /** Visual style variant */
  variant?: 'gradient' | 'neon' | 'minimal' | 'bold' | 'premium';
  /** Size of the CTA */
  size?: 'small' | 'medium' | 'large' | 'hero';
  /** Whether to animate on mount */
  animate?: boolean;
  /** Custom className */
  className?: string;
}

const PsychologyDrivenCTA: React.FC<PsychologyDrivenCTAProps> = ({
  primaryText,
  secondaryText,
  targetTier,
  onUpgrade,
  trigger = 'urgency',
  variant = 'gradient',
  size = 'medium',
  animate = true,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 47, seconds: 32 });
  const [userCount, setUserCount] = useState(10847);
  const [isHovered, setIsHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Countdown timer for urgency
  useEffect(() => {
    if (trigger !== 'urgency') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [trigger]);

  // Simulate growing user count for social proof
  useEffect(() => {
    if (trigger !== 'social_proof') return;

    const interval = setInterval(() => {
      setUserCount(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);

    return () => clearInterval(interval);
  }, [trigger]);

  // Animation on mount
  useEffect(() => {
    if (animate) {
      setTimeout(() => setHasAnimated(true), 100);
    } else {
      setHasAnimated(true);
    }
  }, [animate]);

  const getTierInfo = () => {
    const tierMap = {
      premium: {
        price: '$4.99',
        period: 'month',
        color: 'from-blue-600 to-purple-600',
        icon: <Star className="w-5 h-5" />,
        badge: 'PREMIUM',
      },
      pro: {
        price: '$9.99',
        period: 'month',
        color: 'from-orange-600 to-red-600',
        icon: <Crown className="w-5 h-5" />,
        badge: 'PRO',
      },
      lifetime: {
        price: '$99.99',
        period: 'once',
        color: 'from-purple-600 to-pink-600',
        icon: <Trophy className="w-5 h-5" />,
        badge: 'LIFETIME',
      },
    };

    return tierMap[targetTier] || tierMap.premium;
  };

  const getPsychologyContent = () => {
    const tierInfo = getTierInfo();

    switch (trigger) {
      case 'scarcity':
        return {
          primary: primaryText || `Join the Elite ${tierInfo.badge} Members`,
          secondary: secondaryText || 'Only 47 spots left this month',
          badge: 'LIMITED SPOTS',
          badgeIcon: <Target className="w-4 h-4" />,
          urgencyBar: true,
        };

      case 'social_proof':
        return {
          primary: primaryText || `Join ${userCount.toLocaleString()}+ Happy Users`,
          secondary: secondaryText || '94% report better morning routines',
          badge: `${userCount.toLocaleString()}+ USERS`,
          badgeIcon: <Users className="w-4 h-4" />,
          socialIndicators: true,
        };

      case 'urgency':
        return {
          primary: primaryText || 'Flash Sale: 50% Off First Month',
          secondary: secondaryText || 'Limited time offer expires soon',
          badge: 'ENDING SOON',
          badgeIcon: <Timer className="w-4 h-4" />,
          countdown: true,
        };

      case 'loss_aversion':
        return {
          primary: primaryText || "Don't Miss Out on Nuclear Mode",
          secondary: secondaryText || 'Others are already 5x more productive',
          badge: 'MISSING OUT',
          badgeIcon: <TrendingUp className="w-4 h-4" />,
          lossIndicator: true,
        };

      case 'authority':
        return {
          primary: primaryText || 'Recommended by Sleep Experts',
          secondary: secondaryText || 'Trusted by 100+ medical professionals',
          badge: 'EXPERT APPROVED',
          badgeIcon: <Shield className="w-4 h-4" />,
          authorityBadges: true,
        };

      case 'reciprocity':
        return {
          primary: primaryText || 'Unlock Your Free Premium Trial',
          secondary: secondaryText || '30-day trial + exclusive bonuses',
          badge: 'FREE TRIAL',
          badgeIcon: <Sparkles className="w-4 h-4" />,
          bonusIndicator: true,
        };

      default:
        return {
          primary: primaryText || 'Upgrade Now',
          secondary: secondaryText || 'Unlock premium features',
          badge: 'UPGRADE',
          badgeIcon: <Zap className="w-4 h-4" />,
        };
    }
  };

  const getVariantStyles = () => {
    const tierInfo = getTierInfo();

    switch (variant) {
      case 'neon':
        return {
          container: `bg-black border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)]`,
          button: `bg-gradient-to-r ${tierInfo.color} hover:scale-105 shadow-lg hover:shadow-xl`,
          text: 'text-cyan-400',
        };

      case 'minimal':
        return {
          container: 'bg-white border border-gray-200 shadow-sm hover:shadow-md',
          button: `bg-gray-900 hover:bg-gray-800 text-white`,
          text: 'text-gray-600',
        };

      case 'bold':
        return {
          container: `bg-gradient-to-br ${tierInfo.color} text-white shadow-2xl`,
          button: 'bg-white text-gray-900 hover:bg-gray-100 font-bold',
          text: 'text-white opacity-90',
        };

      case 'premium':
        return {
          container:
            'bg-gradient-to-br from-gray-900 to-black border border-yellow-400 shadow-2xl',
          button: `bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500 font-bold`,
          text: 'text-yellow-400',
        };

      default: // gradient
        return {
          container: `bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg hover:shadow-xl`,
          button: `bg-gradient-to-r ${tierInfo.color} text-white hover:scale-105 shadow-lg`,
          text: 'text-gray-600',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-4 rounded-xl',
          title: 'text-lg font-bold',
          subtitle: 'text-sm',
          button: 'px-4 py-2 text-sm rounded-lg',
          badge: 'px-2 py-1 text-xs',
        };

      case 'large':
        return {
          container: 'p-8 rounded-3xl',
          title: 'text-3xl font-bold',
          subtitle: 'text-lg',
          button: 'px-8 py-4 text-lg rounded-xl',
          badge: 'px-4 py-2 text-sm',
        };

      case 'hero':
        return {
          container: 'p-12 rounded-3xl',
          title: 'text-4xl md:text-5xl font-bold',
          subtitle: 'text-xl',
          button: 'px-12 py-5 text-xl rounded-2xl',
          badge: 'px-6 py-3 text-base',
        };

      default: // medium
        return {
          container: 'p-6 rounded-2xl',
          title: 'text-2xl font-bold',
          subtitle: 'text-base',
          button: 'px-6 py-3 text-base rounded-xl',
          badge: 'px-3 py-1 text-sm',
        };
    }
  };

  const content = getPsychologyContent();
  const styles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const tierInfo = getTierInfo();

  return (
    <div
      className={`
      relative overflow-hidden transition-all duration-500 transform
      ${styles.container} ${sizeStyles.container}
      ${hasAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
      ${isHovered ? 'scale-102' : 'scale-100'}
      ${className}
    `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background effects */}
      {variant === 'neon' && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-purple-600/10 animate-pulse" />
      )}

      {/* Badge */}
      <div className="flex items-center justify-center mb-4">
        <div
          className={`
          inline-flex items-center space-x-2 font-bold tracking-wider
          ${sizeStyles.badge} ${styles.text}
          bg-yellow-400 bg-opacity-20 border border-yellow-400 rounded-full
        `}
        >
          {content.badgeIcon}
          <span>{content.badge}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="text-center mb-6">
        <h3
          className={`${sizeStyles.title} mb-2 ${variant === 'bold' || variant === 'premium' ? 'text-white' : 'text-gray-900'}`}
        >
          {content.primary}
        </h3>
        <p className={`${sizeStyles.subtitle} ${styles.text} mb-4`}>
          {content.secondary}
        </p>

        {/* Psychology-specific elements */}
        {content.countdown && (
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="flex items-center space-x-2 bg-red-100 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {content.socialIndicators && (
          <div className="flex items-center justify-center space-x-6 mb-4">
            <div className="flex items-center space-x-1">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white"
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 ml-2">
                +{userCount.toLocaleString()} users
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="text-center mb-4">
        <button
          onClick={() => onUpgrade(targetTier)}
          className={`
            inline-flex items-center justify-center space-x-3 font-medium transition-all duration-200
            ${sizeStyles.button} ${styles.button}
            group relative overflow-hidden
          `}
        >
          {/* Button background animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

          <span className="relative z-10 flex items-center space-x-2">
            {tierInfo.icon}
            <span>Upgrade to {tierInfo.badge}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        <p className="text-sm text-gray-500 mt-2">
          {tierInfo.price}/{tierInfo.period} • Cancel anytime • 30-day guarantee
        </p>
      </div>

      {/* Trust signals */}
      <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Shield className="w-3 h-3" />
          <span>Secure</span>
        </div>
        <div className="flex items-center space-x-1">
          <Zap className="w-3 h-3" />
          <span>Instant</span>
        </div>
        <div className="flex items-center space-x-1">
          <Users className="w-3 h-3" />
          <span>Trusted</span>
        </div>
      </div>

      {/* Urgency bar */}
      {content.urgencyBar && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000"
            style={{ width: '23%' }}
          />
        </div>
      )}
    </div>
  );
};

export default PsychologyDrivenCTA;
