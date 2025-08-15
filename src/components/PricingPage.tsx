import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import {
  Check,
  Crown,
  Star,
  Zap,
  Volume2,
  Target,
  Mic,
  BarChart3,
  Infinity,
  AlertCircle,
  CreditCard,
  ArrowRight,
  Users,
  Shield,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PremiumService } from '../services/premium';
import { SubscriptionStatus } from './SubscriptionStatus';
import type { SubscriptionPlan, SubscriptionTier, User } from '../types';

interface PricingPageProps {
  user: User;
  currentPlan?: SubscriptionPlan;
  onUpgrade?: (plan: SubscriptionPlan) => void;
  onManageSubscription?: () => void;
  className?: string;
}

interface PricingTier {
  id: SubscriptionTier;
  name: string;
  price: number;
  billingPeriod: 'month' | 'year';
  yearlyPrice?: number;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  description: string;
  features: Array<{
    name: string;
    included: boolean;
    premium?: boolean;
    ultimate?: boolean;
    description?: string;
  }>;
  limits: {
    alarms: number | 'unlimited';
    voicePersonalities: number;
    nuclearChallenges: boolean;
    voiceCloning: boolean;
    analytics: boolean;
  };
  cta: string;
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    billingPeriod: 'month',
    icon: <Shield className="w-6 h-6" />,
    description: 'Perfect for getting started with smart alarms',
    features: [
      { name: 'Basic voice alarms', included: true, description: 'Standard voice personalities' },
      { name: 'Up to 10 alarms', included: true, description: 'Create multiple alarms' },
      { name: 'Standard difficulty levels', included: true, description: 'Easy to hard challenges' },
      { name: 'Basic voice recognition', included: true, description: 'Voice commands to dismiss' },
      { name: 'Snooze controls', included: true, description: 'Customizable snooze settings' },
      { name: 'Nuclear Mode', included: false, premium: true, description: 'Extreme difficulty challenges' },
      { name: 'Custom voices', included: false, premium: true, description: '18+ premium voice personalities' },
      { name: 'Voice cloning', included: false, ultimate: true, description: 'Create your own custom voice' },
      { name: 'Advanced analytics', included: false, premium: true, description: 'Detailed sleep insights' },
      { name: 'Unlimited alarms', included: false, premium: true, description: 'No limits on alarm creation' }
    ],
    limits: {
      alarms: 10,
      voicePersonalities: 6,
      nuclearChallenges: false,
      voiceCloning: false,
      analytics: false
    },
    cta: 'Get Started Free'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    yearlyPrice: 99.99,
    billingPeriod: 'month',
    icon: <Crown className="w-6 h-6" />,
    badge: 'Most Popular',
    badgeColor: 'bg-blue-500',
    popular: true,
    description: 'Unlock advanced features and nuclear mode',
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Nuclear Mode', included: true, description: 'Extreme difficulty challenges' },
      { name: 'Premium voices', included: true, description: '18+ celebrity and character voices' },
      { name: 'Unlimited alarms', included: true, description: 'No limits on alarm creation' },
      { name: 'Advanced analytics', included: true, description: 'Sleep patterns and performance tracking' },
      { name: 'Priority support', included: true, description: 'Faster response times' },
      { name: 'Custom challenge difficulty', included: true, description: 'Fine-tune your wake-up challenges' },
      { name: 'Voice cloning', included: false, ultimate: true, description: 'Create custom voices' },
      { name: 'Advanced integrations', included: false, ultimate: true, description: 'API access and webhooks' },
      { name: 'Team management', included: false, ultimate: true, description: 'Manage multiple users' }
    ],
    limits: {
      alarms: 'unlimited',
      voicePersonalities: 18,
      nuclearChallenges: true,
      voiceCloning: false,
      analytics: true
    },
    cta: 'Upgrade to Premium'
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 19.99,
    yearlyPrice: 199.99,
    billingPeriod: 'month',
    icon: <Star className="w-6 h-6" />,
    badge: 'Ultimate Power',
    badgeColor: 'bg-purple-500',
    description: 'The complete alarm solution for power users',
    features: [
      { name: 'Everything in Premium', included: true },
      { name: 'Voice cloning', included: true, description: 'Create unlimited custom voices' },
      { name: 'Advanced integrations', included: true, description: 'API access, webhooks, IFTTT' },
      { name: 'Team management', included: true, description: 'Manage up to 5 users' },
      { name: 'White-label options', included: true, description: 'Custom branding' },
      { name: 'Advanced nuclear modes', included: true, description: 'Custom challenge creation' },
      { name: 'Export data', included: true, description: 'Full data export capabilities' },
      { name: 'Premium support', included: true, description: '24/7 priority support' },
      { name: 'Beta features', included: true, description: 'Early access to new features' },
      { name: 'Custom integrations', included: true, description: 'Dedicated integration support' }
    ],
    limits: {
      alarms: 'unlimited',
      voicePersonalities: 'unlimited' as any,
      nuclearChallenges: true,
      voiceCloning: true,
      analytics: true
    },
    cta: 'Go Ultimate'
  }
];

export const PricingPage: React.FC<PricingPageProps> = ({
  user,
  currentPlan,
  onUpgrade,
  onManageSubscription,
  className
}) => {
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<SubscriptionTier>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    loadUserSubscription();
  }, [user.id]);

  const loadUserSubscription = async () => {
    try {
      const tier = await PremiumService.getUserTier(user.id);
      const status = await PremiumService.getSubscriptionStatus(user.id);
      setUserTier(tier);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'free') return;

    setIsLoading(tier);
    try {
      // In a real app, this would integrate with Stripe, PayPal, etc.
      const success = await simulatePayment(tier, selectedBilling);
      
      if (success) {
        await PremiumService.updateUserTier(user.id, tier);
        await loadUserSubscription();
        
        if (onUpgrade) {
          const plan = pricingTiers.find(t => t.id === tier);
          if (plan) {
            onUpgrade({
              id: tier,
              name: plan.name,
              price: selectedBilling === 'yearly' ? plan.yearlyPrice || plan.price : plan.price,
              billingPeriod: selectedBilling === 'yearly' ? 'year' : 'month',
              features: plan.features.filter(f => f.included).map(f => f.name)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const simulatePayment = async (tier: SubscriptionTier, billing: 'monthly' | 'yearly'): Promise<boolean> => {
    // Simulate payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, this would handle actual payment processing
        resolve(true);
      }, 2000);
    });
  };

  const getPrice = (tier: PricingTier) => {
    if (tier.price === 0) return 'Free';
    
    const price = selectedBilling === 'yearly' && tier.yearlyPrice ? tier.yearlyPrice : tier.price;
    const period = selectedBilling === 'yearly' ? 'year' : 'month';
    const monthlyPrice = selectedBilling === 'yearly' && tier.yearlyPrice 
      ? tier.yearlyPrice / 12 
      : tier.price;

    if (selectedBilling === 'yearly' && tier.yearlyPrice) {
      return (
        <div>
          <span className="text-3xl font-bold">${price}</span>
          <span className="text-gray-600">/{period}</span>
          <div className="text-sm text-green-600">
            ${monthlyPrice.toFixed(2)}/month
          </div>
        </div>
      );
    }

    return (
      <div>
        <span className="text-3xl font-bold">${price}</span>
        <span className="text-gray-600">/{period}</span>
      </div>
    );
  };

  const isCurrentTier = (tier: SubscriptionTier) => userTier === tier;
  const canUpgrade = (tier: SubscriptionTier) => {
    if (tier === 'free') return false;
    if (userTier === 'free') return true;
    if (userTier === 'premium' && tier === 'ultimate') return true;
    return false;
  };

  const getTierIndex = (tier: SubscriptionTier) => {
    const order: SubscriptionTier[] = ['free', 'premium', 'ultimate'];
    return order.indexOf(tier);
  };

  const isDowngrade = (tier: SubscriptionTier) => {
    return getTierIndex(tier) < getTierIndex(userTier);
  };

  return (
    <div className={cn('max-w-7xl mx-auto p-6', className)}>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Unlock powerful features to revolutionize how you wake up
        </p>

        {/* Current Subscription Status */}
        {subscriptionStatus && (
          <div className="mb-8">
            <SubscriptionStatus 
              subscription={subscriptionStatus}
              variant="card"
              className="max-w-md mx-auto"
            />
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={cn('text-sm', selectedBilling === 'monthly' ? 'font-semibold' : 'text-gray-600')}>
            Monthly
          </span>
          <button
            onClick={() => setSelectedBilling(selectedBilling === 'monthly' ? 'yearly' : 'monthly')}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              selectedBilling === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                selectedBilling === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
          <span className={cn('text-sm', selectedBilling === 'yearly' ? 'font-semibold' : 'text-gray-600')}>
            Yearly
            {selectedBilling === 'yearly' && (
              <Badge className="ml-2 bg-green-100 text-green-800">Save 17%</Badge>
            )}
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {pricingTiers.map((tier) => (
          <Card
            key={tier.id}
            className={cn(
              'relative transition-all duration-200 hover:shadow-lg',
              tier.popular && 'ring-2 ring-blue-500 shadow-lg scale-105',
              isCurrentTier(tier.id) && 'ring-2 ring-green-500 bg-green-50'
            )}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className={cn('px-3 py-1', tier.badgeColor || 'bg-blue-500')}>
                  {tier.badge}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={cn(
                  'p-2 rounded-lg',
                  tier.id === 'free' ? 'bg-gray-100 text-gray-600' :
                  tier.id === 'premium' ? 'bg-blue-100 text-blue-600' :
                  'bg-purple-100 text-purple-600'
                )}>
                  {tier.icon}
                </div>
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
              </div>
              
              <div className="mb-4">
                {getPrice(tier)}
              </div>

              <p className="text-gray-600 text-sm">{tier.description}</p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features List */}
              <div className="space-y-3">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 mt-0.5 flex-shrink-0 flex items-center justify-center">
                        {feature.premium && (
                          <Crown className="w-4 h-4 text-blue-500" />
                        )}
                        {feature.ultimate && (
                          <Star className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                    )}
                    <div>
                      <span className={cn(
                        'text-sm',
                        feature.included ? 'text-gray-900' : 'text-gray-500'
                      )}>
                        {feature.name}
                      </span>
                      {feature.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {feature.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Limits Summary */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Alarms:</span>
                  <span className="font-medium">
                    {tier.limits.alarms === 'unlimited' ? 'Unlimited' : tier.limits.alarms}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Voice Personalities:</span>
                  <span className="font-medium">
                    {tier.limits.voicePersonalities === 'unlimited' ? 'Unlimited' : tier.limits.voicePersonalities}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                {isCurrentTier(tier.id) ? (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      disabled
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Current Plan
                    </Button>
                    {tier.id !== 'free' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onManageSubscription}
                        className="w-full text-gray-600 hover:text-gray-900"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Manage Subscription
                      </Button>
                    )}
                  </div>
                ) : canUpgrade(tier.id) ? (
                  <Button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={isLoading === tier.id}
                    className={cn(
                      'w-full',
                      tier.popular && 'bg-blue-600 hover:bg-blue-700'
                    )}
                  >
                    {isLoading === tier.id ? (
                      <>
                        <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        {tier.cta}
                      </>
                    )}
                  </Button>
                ) : isDowngrade(tier.id) ? (
                  <Button
                    variant="outline"
                    onClick={() => handleUpgrade(tier.id)}
                    className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    Downgrade to {tier.name}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full"
                  >
                    Not Available
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Comparison */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
        
        <Alert className="mb-6">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            All plans include our core alarm functionality. Premium features unlock advanced capabilities
            to help you wake up more effectively and track your progress.
          </AlertDescription>
        </Alert>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Feature</th>
                <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Free</th>
                <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Premium</th>
                <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Ultimate</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Basic Alarms', free: true, premium: true, ultimate: true },
                { name: 'Voice Commands', free: true, premium: true, ultimate: true },
                { name: 'Alarm Limit', free: '10', premium: 'Unlimited', ultimate: 'Unlimited' },
                { name: 'Nuclear Mode', free: false, premium: true, ultimate: true },
                { name: 'Premium Voices', free: false, premium: true, ultimate: true },
                { name: 'Voice Cloning', free: false, premium: false, ultimate: true },
                { name: 'Advanced Analytics', free: false, premium: true, ultimate: true },
                { name: 'API Access', free: false, premium: false, ultimate: true },
                { name: 'Team Management', free: false, premium: false, ultimate: true },
              ].map((feature, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3 font-medium">
                    {feature.name}
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    ) : (
                      <span className="text-sm">{feature.free}</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    {typeof feature.premium === 'boolean' ? (
                      feature.premium ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    ) : (
                      <span className="text-sm">{feature.premium}</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    {typeof feature.ultimate === 'boolean' ? (
                      feature.ultimate ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    ) : (
                      <span className="text-sm">{feature.ultimate}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              question: "What is Nuclear Mode?",
              answer: "Nuclear Mode is our most extreme alarm difficulty setting, featuring multi-step challenges, memory tests, and physical verification tasks that ensure you're truly awake before the alarm can be dismissed."
            },
            {
              question: "How does voice cloning work?",
              answer: "With Ultimate tier, you can record voice samples to create custom AI voices that sound like you or your loved ones. Perfect for personalized wake-up messages."
            },
            {
              question: "Can I cancel anytime?",
              answer: "Yes! You can cancel your subscription at any time. Your premium features will remain active until the end of your billing period."
            },
            {
              question: "What about data privacy?",
              answer: "We take privacy seriously. Voice recordings for cloning are processed securely and can be deleted at any time. We never share personal data with third parties."
            }
          ].map((faq, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;