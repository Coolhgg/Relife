// ConvertKit Configuration for Relife Email Campaigns
// Manages ConvertKit forms, sequences, and automation setup for each persona

import { PersonaType } from '../types/email-campaigns';

export interface PersonaConvertKitConfig {
  persona: PersonaType;
  formId: number;
  sequenceId: number;
  tagName: string;
  welcomeEmailDelay: number; // hours
  automationRules: PersonaAutomationRule[];
}

export interface PersonaAutomationRule {
  trigger: 'signup' | 'tag_added' | 'sequence_completed' | 'link_clicked' | 'email_opened';
  condition?: string;
  action: 'add_to_sequence' | 'add_tag' | 'send_email' | 'remove_tag' | 'update_field';
  parameters: Record<string, any>;
  delay?: number; // minutes
}

export interface ConvertKitFormTemplate {
  name: string;
  description: string;
  successMessage: string;
  redirectUrl?: string;
  settings: {
    doubleOptIn: boolean;
    sendWelcomeEmail: boolean;
    trackingEnabled: boolean;
  };
}

export interface ConvertKitSequenceTemplate {
  name: string;
  description: string;
  emails: SequenceEmailTemplate[];
  settings: {
    timezone: string;
    sendTimeOptimization: boolean;
    frequencyCapping: {
      maxPerDay: number;
      respectQuietHours: boolean;
      quietStart: string;
      quietEnd: string;
    };
  };
}

export interface SequenceEmailTemplate {
  subject: string;
  delayHours: number;
  content: string;
  trackingEnabled: boolean;
  ctaButton?: {
    text: string;
    url: string;
    color: string;
  };
}

// Persona-specific ConvertKit configurations
export const PERSONA_CONVERTKIT_CONFIG: Record<PersonaType, PersonaConvertKitConfig> = {
  struggling_sam: {
    persona: 'struggling_sam',
    formId: 0, // To be created
    sequenceId: 0, // To be created
    tagName: 'persona:struggling_sam',
    welcomeEmailDelay: 0, // Immediate welcome
    automationRules: [
      {
        trigger: 'signup',
        action: 'add_to_sequence',
        parameters: { sequenceName: 'Struggling Sam Nurture Series' },
        delay: 0
      },
      {
        trigger: 'tag_added',
        condition: 'trial_started',
        action: 'send_email',
        parameters: {
          templateName: 'trial_encouragement',
          subject: '🎉 Welcome to your free trial, {{first_name}}!'
        },
        delay: 60
      },
      {
        trigger: 'sequence_completed',
        action: 'add_tag',
        parameters: { tagName: 'nurture_completed' },
        delay: 0
      }
    ]
  },
  busy_ben: {
    persona: 'busy_ben',
    formId: 0,
    sequenceId: 0,
    tagName: 'persona:busy_ben',
    welcomeEmailDelay: 2, // 2 hours after signup
    automationRules: [
      {
        trigger: 'signup',
        action: 'add_to_sequence',
        parameters: { sequenceName: 'Busy Ben Efficiency Series' },
        delay: 120 // 2 hours
      },
      {
        trigger: 'link_clicked',
        condition: 'productivity_features',
        action: 'add_tag',
        parameters: { tagName: 'interested_productivity' },
        delay: 0
      },
      {
        trigger: 'email_opened',
        condition: 'third_email',
        action: 'send_email',
        parameters: {
          templateName: 'time_savings_calculator',
          subject: 'How much time could you save with Relife?'
        },
        delay: 1440 // 24 hours
      }
    ]
  },
  professional_paula: {
    persona: 'professional_paula',
    formId: 0,
    sequenceId: 0,
    tagName: 'persona:professional_paula',
    welcomeEmailDelay: 4, // 4 hours for sophistication
    automationRules: [
      {
        trigger: 'signup',
        action: 'add_to_sequence',
        parameters: { sequenceName: 'Professional Paula Advanced Features' },
        delay: 240 // 4 hours
      },
      {
        trigger: 'tag_added',
        condition: 'premium_trial_started',
        action: 'send_email',
        parameters: {
          templateName: 'advanced_features_guide',
          subject: 'Master advanced analytics with these pro tips'
        },
        delay: 30
      },
      {
        trigger: 'link_clicked',
        condition: 'analytics_dashboard',
        action: 'add_tag',
        parameters: { tagName: 'analytics_user' },
        delay: 0
      }
    ]
  },
  enterprise_emma: {
    persona: 'enterprise_emma',
    formId: 0,
    sequenceId: 0,
    tagName: 'persona:enterprise_emma',
    welcomeEmailDelay: 1, // Quick for business users
    automationRules: [
      {
        trigger: 'signup',
        action: 'add_to_sequence',
        parameters: { sequenceName: 'Enterprise Emma Team Solutions' },
        delay: 60 // 1 hour
      },
      {
        trigger: 'tag_added',
        condition: 'demo_requested',
        action: 'send_email',
        parameters: {
          templateName: 'demo_confirmation',
          subject: 'Your Relife team demo is confirmed'
        },
        delay: 15
      },
      {
        trigger: 'sequence_completed',
        action: 'add_tag',
        parameters: { tagName: 'sales_qualified' },
        delay: 0
      }
    ]
  },
  student_sarah: {
    persona: 'student_sarah',
    formId: 0,
    sequenceId: 0,
    tagName: 'persona:student_sarah',
    welcomeEmailDelay: 0, // Immediate for eager students
    automationRules: [
      {
        trigger: 'signup',
        action: 'add_to_sequence',
        parameters: { sequenceName: 'Student Sarah Campus Life' },
        delay: 0
      },
      {
        trigger: 'tag_added',
        condition: 'student_verified',
        action: 'send_email',
        parameters: {
          templateName: 'student_discount_unlocked',
          subject: '🎓 Your student discount is now active!'
        },
        delay: 5
      },
      {
        trigger: 'link_clicked',
        condition: 'campus_features',
        action: 'add_tag',
        parameters: { tagName: 'campus_interested' },
        delay: 0
      }
    ]
  },
  lifetime_larry: {
    persona: 'lifetime_larry',
    formId: 0,
    sequenceId: 0,
    tagName: 'persona:lifetime_larry',
    welcomeEmailDelay: 6, // Longer delay for value demonstration
    automationRules: [
      {
        trigger: 'signup',
        action: 'add_to_sequence',
        parameters: { sequenceName: 'Lifetime Larry Value Series' },
        delay: 360 // 6 hours
      },
      {
        trigger: 'email_opened',
        condition: 'lifetime_value_email',
        action: 'add_tag',
        parameters: { tagName: 'lifetime_interested' },
        delay: 0
      },
      {
        trigger: 'tag_added',
        condition: 'lifetime_purchased',
        action: 'send_email',
        parameters: {
          templateName: 'lifetime_welcome',
          subject: 'Welcome to the Relife lifetime family! 🏆'
        },
        delay: 30
      }
    ]
  }
};

// Form templates for each persona
export const CONVERTKIT_FORM_TEMPLATES: Record<PersonaType, ConvertKitFormTemplate> = {
  struggling_sam: {
    name: 'Struggling Sam - Free User Onboarding',
    description: 'Gentle onboarding form for price-conscious users',
    successMessage: 'Welcome! Check your email for helpful tips to get started with Relife completely free.',
    settings: {
      doubleOptIn: false, // Remove friction
      sendWelcomeEmail: true,
      trackingEnabled: true
    }
  },
  busy_ben: {
    name: 'Busy Ben - Efficiency Focus',
    description: 'Quick signup for busy professionals',
    successMessage: 'You\'re in! We\'ll send you time-saving tips and productivity hacks.',
    redirectUrl: '/dashboard?welcome=efficiency',
    settings: {
      doubleOptIn: false, // Busy people don't want extra steps
      sendWelcomeEmail: true,
      trackingEnabled: true
    }
  },
  professional_paula: {
    name: 'Professional Paula - Advanced Features',
    description: 'Sophisticated signup for feature-focused users',
    successMessage: 'Thank you for joining! Prepare to unlock advanced productivity insights.',
    redirectUrl: '/dashboard?welcome=advanced',
    settings: {
      doubleOptIn: true, // Higher quality leads
      sendWelcomeEmail: true,
      trackingEnabled: true
    }
  },
  enterprise_emma: {
    name: 'Enterprise Emma - Team Solutions',
    description: 'Business-focused signup with team features',
    successMessage: 'Welcome! We\'ll show you how Relife can transform your team\'s productivity.',
    redirectUrl: '/enterprise?welcome=true',
    settings: {
      doubleOptIn: true, // Business quality
      sendWelcomeEmail: true,
      trackingEnabled: true
    }
  },
  student_sarah: {
    name: 'Student Sarah - Campus Life',
    description: 'Student-friendly signup with discount focus',
    successMessage: 'Hey there! 🎓 Check your email for your exclusive student discount.',
    redirectUrl: '/student?discount=active',
    settings: {
      doubleOptIn: false, // Students are eager
      sendWelcomeEmail: true,
      trackingEnabled: true
    }
  },
  lifetime_larry: {
    name: 'Lifetime Larry - Value Demonstration',
    description: 'Value-focused signup for one-time payment preference',
    successMessage: 'Great choice! We\'ll show you the incredible lifetime value Relife offers.',
    redirectUrl: '/pricing?view=lifetime',
    settings: {
      doubleOptIn: true, // Quality over quantity
      sendWelcomeEmail: true,
      trackingEnabled: true
    }
  }
};

// Sequence templates for each persona
export const CONVERTKIT_SEQUENCE_TEMPLATES: Record<PersonaType, ConvertKitSequenceTemplate> = {
  struggling_sam: {
    name: 'Struggling Sam Nurture Series',
    description: 'Supportive 7-email series focusing on free value and gentle encouragement',
    emails: [
      {
        subject: 'Welcome to Relife - Your journey starts here 🌟',
        delayHours: 0,
        content: 'struggling_sam_welcome',
        trackingEnabled: true,
        ctaButton: {
          text: 'Get Started Free',
          url: '/dashboard',
          color: '#10b981'
        }
      },
      {
        subject: 'Quick wins: 3 free features that will change your day',
        delayHours: 24,
        content: 'struggling_sam_quick_wins',
        trackingEnabled: true
      },
      {
        subject: 'You\'re not alone - how others overcame the same struggles',
        delayHours: 72,
        content: 'struggling_sam_social_proof',
        trackingEnabled: true
      },
      {
        subject: 'Free template: Your first productivity system',
        delayHours: 120,
        content: 'struggling_sam_free_template',
        trackingEnabled: true
      },
      {
        subject: 'Small steps, big progress - celebrating your wins',
        delayHours: 168,
        content: 'struggling_sam_progress',
        trackingEnabled: true
      }
    ],
    settings: {
      timezone: 'UTC',
      sendTimeOptimization: true,
      frequencyCapping: {
        maxPerDay: 1,
        respectQuietHours: true,
        quietStart: '22:00',
        quietEnd: '08:00'
      }
    }
  },
  busy_ben: {
    name: 'Busy Ben Efficiency Series',
    description: 'Fast-paced 5-email series focused on time savings and ROI',
    emails: [
      {
        subject: 'Save 2 hours daily with these Relife shortcuts',
        delayHours: 2,
        content: 'busy_ben_shortcuts',
        trackingEnabled: true,
        ctaButton: {
          text: 'Try Now →',
          url: '/features/shortcuts',
          color: '#3b82f6'
        }
      },
      {
        subject: 'ROI Calculator: What\'s your time worth?',
        delayHours: 48,
        content: 'busy_ben_roi_calculator',
        trackingEnabled: true
      },
      {
        subject: '5-minute setup for maximum productivity gains',
        delayHours: 96,
        content: 'busy_ben_quick_setup',
        trackingEnabled: true
      },
      {
        subject: 'Automated workflows that work while you sleep',
        delayHours: 144,
        content: 'busy_ben_automation',
        trackingEnabled: true
      },
      {
        subject: 'The productivity stack that scales with you',
        delayHours: 192,
        content: 'busy_ben_scaling',
        trackingEnabled: true
      }
    ],
    settings: {
      timezone: 'UTC',
      sendTimeOptimization: true,
      frequencyCapping: {
        maxPerDay: 2, // Busy people check email often
        respectQuietHours: true,
        quietStart: '20:00',
        quietEnd: '07:00'
      }
    }
  },
  professional_paula: {
    name: 'Professional Paula Advanced Features',
    description: 'Sophisticated 8-email series showcasing advanced capabilities',
    emails: [
      {
        subject: 'Unlock professional-grade productivity insights',
        delayHours: 4,
        content: 'professional_paula_advanced',
        trackingEnabled: true,
        ctaButton: {
          text: 'Explore Advanced Features',
          url: '/features/advanced',
          color: '#8b5cf6'
        }
      },
      {
        subject: 'Advanced analytics: Turn data into actionable insights',
        delayHours: 48,
        content: 'professional_paula_analytics',
        trackingEnabled: true
      },
      {
        subject: 'Custom integrations for your professional workflow',
        delayHours: 96,
        content: 'professional_paula_integrations',
        trackingEnabled: true
      },
      {
        subject: 'Masterclass: Advanced project management techniques',
        delayHours: 144,
        content: 'professional_paula_masterclass',
        trackingEnabled: true
      },
      {
        subject: 'Beta access: Try our newest professional features',
        delayHours: 192,
        content: 'professional_paula_beta',
        trackingEnabled: true
      }
    ],
    settings: {
      timezone: 'UTC',
      sendTimeOptimization: true,
      frequencyCapping: {
        maxPerDay: 1,
        respectQuietHours: true,
        quietStart: '19:00',
        quietEnd: '08:00'
      }
    }
  },
  enterprise_emma: {
    name: 'Enterprise Emma Team Solutions',
    description: 'Business-focused 6-email series for team decision makers',
    emails: [
      {
        subject: 'Transform your team\'s productivity with Relife Enterprise',
        delayHours: 1,
        content: 'enterprise_emma_team_intro',
        trackingEnabled: true,
        ctaButton: {
          text: 'Schedule Team Demo',
          url: '/enterprise/demo',
          color: '#6366f1'
        }
      },
      {
        subject: 'Case study: How [Company] increased team efficiency by 40%',
        delayHours: 48,
        content: 'enterprise_emma_case_study',
        trackingEnabled: true
      },
      {
        subject: 'Enterprise features: Security, compliance, and control',
        delayHours: 72,
        content: 'enterprise_emma_features',
        trackingEnabled: true
      },
      {
        subject: 'Implementation made simple: Your 30-day rollout plan',
        delayHours: 120,
        content: 'enterprise_emma_implementation',
        trackingEnabled: true
      },
      {
        subject: 'ROI report: The business case for Relife Enterprise',
        delayHours: 168,
        content: 'enterprise_emma_roi_report',
        trackingEnabled: true
      }
    ],
    settings: {
      timezone: 'UTC',
      sendTimeOptimization: true,
      frequencyCapping: {
        maxPerDay: 1,
        respectQuietHours: true,
        quietStart: '18:00',
        quietEnd: '09:00'
      }
    }
  },
  student_sarah: {
    name: 'Student Sarah Campus Life',
    description: 'Fun 6-email series for students with discounts and study tips',
    emails: [
      {
        subject: '🎓 Your student discount is here + study life hacks',
        delayHours: 0,
        content: 'student_sarah_discount_welcome',
        trackingEnabled: true,
        ctaButton: {
          text: 'Claim Student Discount',
          url: '/student/verify',
          color: '#f59e0b'
        }
      },
      {
        subject: 'Study smarter, not harder: Campus productivity secrets',
        delayHours: 24,
        content: 'student_sarah_study_tips',
        trackingEnabled: true
      },
      {
        subject: 'Free campus templates: Notes, schedules, and planners',
        delayHours: 48,
        content: 'student_sarah_templates',
        trackingEnabled: true
      },
      {
        subject: 'Semester planning: How to crush your goals',
        delayHours: 96,
        content: 'student_sarah_semester_planning',
        trackingEnabled: true
      },
      {
        subject: 'Student success stories: From chaos to graduation',
        delayHours: 144,
        content: 'student_sarah_success_stories',
        trackingEnabled: true
      }
    ],
    settings: {
      timezone: 'UTC',
      sendTimeOptimization: true,
      frequencyCapping: {
        maxPerDay: 1,
        respectQuietHours: true,
        quietStart: '23:00',
        quietEnd: '09:00'
      }
    }
  },
  lifetime_larry: {
    name: 'Lifetime Larry Value Series',
    description: 'Value-focused 7-email series demonstrating lifetime worth',
    emails: [
      {
        subject: 'Why lifetime value beats monthly subscriptions',
        delayHours: 6,
        content: 'lifetime_larry_value_prop',
        trackingEnabled: true,
        ctaButton: {
          text: 'See Lifetime Value',
          url: '/pricing/lifetime-calculator',
          color: '#eab308'
        }
      },
      {
        subject: 'Calculator: Your lifetime savings with Relife',
        delayHours: 48,
        content: 'lifetime_larry_savings_calculator',
        trackingEnabled: true
      },
      {
        subject: 'Exclusive access: Lifetime member benefits',
        delayHours: 96,
        content: 'lifetime_larry_exclusive_benefits',
        trackingEnabled: true
      },
      {
        subject: 'Future-proof: Features included in your lifetime plan',
        delayHours: 144,
        content: 'lifetime_larry_future_features',
        trackingEnabled: true
      },
      {
        subject: 'Limited time: Lifetime access pricing ends soon',
        delayHours: 216,
        content: 'lifetime_larry_urgency',
        trackingEnabled: true
      },
      {
        subject: 'Join the lifetime family: What our members say',
        delayHours: 264,
        content: 'lifetime_larry_testimonials',
        trackingEnabled: true
      }
    ],
    settings: {
      timezone: 'UTC',
      sendTimeOptimization: true,
      frequencyCapping: {
        maxPerDay: 1,
        respectQuietHours: true,
        quietStart: '21:00',
        quietEnd: '08:00'
      }
    }
  }
};

// ConvertKit environment configuration
export const CONVERTKIT_ENV_CONFIG = {
  production: {
    apiUrl: 'https://api.convertkit.com/v3',
    webhookUrl: 'https://relife.app/api/webhooks/convertkit',
    timeout: 10000,
    retryAttempts: 3
  },
  development: {
    apiUrl: 'https://api.convertkit.com/v3',
    webhookUrl: 'https://relife-dev.app/api/webhooks/convertkit',
    timeout: 15000,
    retryAttempts: 2
  },
  test: {
    apiUrl: 'https://api.convertkit.com/v3',
    webhookUrl: 'http://localhost:3000/api/webhooks/convertkit',
    timeout: 5000,
    retryAttempts: 1
  }
};

export default {
  PERSONA_CONVERTKIT_CONFIG,
  CONVERTKIT_FORM_TEMPLATES,
  CONVERTKIT_SEQUENCE_TEMPLATES,
  CONVERTKIT_ENV_CONFIG
};