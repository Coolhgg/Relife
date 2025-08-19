// Email Campaign Automation Configuration for Relife Personas
// This file configures automated email sequences for each persona type

const campaignConfig = {
  // Struggling Sam - Free-focused, gradual conversion
  struggling_sam: {
    persona: 'struggling_sam',
    trigger: 'user_signup',
    delay_initial: 0, // Send immediately after signup
    sequences: [
      {
        id: 'sam_welcome_01',
        subject: 'Welcome to Relife - Start Free Today! 🎉',
        template: 'struggling-sam-welcome',
        delay_hours: 0,
        target_action: 'app_engagement',
        success_metrics: {
          open_rate_target: 0.45,
          click_rate_target: 0.08
        }
      },
      {
        id: 'sam_tips_02',
        subject: 'The #1 mistake people make with alarms (+ how to avoid it)',
        template: 'struggling-sam-tips',
        delay_hours: 72, // 3 days
        target_action: 'feature_usage',
        success_metrics: {
          open_rate_target: 0.35,
          click_rate_target: 0.06
        }
      },
      {
        id: 'sam_social_proof_03',
        subject: '"I can\'t believe this is free" - Real user stories',
        template: 'struggling-sam-social-proof',
        delay_hours: 168, // 7 days
        target_action: 'community_engagement',
        success_metrics: {
          open_rate_target: 0.30,
          click_rate_target: 0.05
        }
      },
      {
        id: 'sam_feature_discovery_04',
        subject: '5 hidden features you probably haven\'t tried yet',
        template: 'struggling-sam-features',
        delay_hours: 336, // 14 days
        target_action: 'advanced_feature_usage',
        success_metrics: {
          open_rate_target: 0.28,
          click_rate_target: 0.04
        }
      },
      {
        id: 'sam_gentle_upgrade_05',
        subject: 'What if I told you Premium costs less than a coffee?',
        template: 'struggling-sam-upgrade',
        delay_hours: 2160, // 90 days (very gentle approach)
        target_action: 'trial_conversion',
        success_metrics: {
          open_rate_target: 0.25,
          click_rate_target: 0.03,
          conversion_rate_target: 0.08
        }
      }
    ],
    conversion_funnel: {
      signup_to_active: 0.70,
      active_to_trial: 0.12,
      trial_to_paid: 0.15
    }
  },

  // Busy Ben - ROI-focused, efficiency-driven
  busy_ben: {
    persona: 'busy_ben',
    trigger: 'user_signup',
    delay_initial: 0,
    sequences: [
      {
        id: 'ben_roi_01',
        subject: 'Save 30 minutes every morning (less than your daily coffee)',
        template: 'busy-ben-roi',
        delay_hours: 0,
        target_action: 'premium_trial_start',
        success_metrics: {
          open_rate_target: 0.40,
          click_rate_target: 0.12,
          conversion_rate_target: 0.18
        }
      },
      {
        id: 'ben_smart_wake_02',
        subject: 'This morning routine hack saves 45 minutes daily',
        template: 'busy-ben-smart-wake',
        delay_hours: 48, // 2 days
        target_action: 'feature_demo_view',
        success_metrics: {
          open_rate_target: 0.35,
          click_rate_target: 0.10
        }
      },
      {
        id: 'ben_calendar_03',
        subject: 'Never wonder "what's my day like?" again',
        template: 'busy-ben-calendar',
        delay_hours: 96, // 4 days
        target_action: 'calendar_sync_setup',
        success_metrics: {
          open_rate_target: 0.32,
          click_rate_target: 0.09
        }
      },
      {
        id: 'ben_routines_04',
        subject: 'Eliminate decision fatigue with smart routines',
        template: 'busy-ben-routines',
        delay_hours: 168, // 7 days
        target_action: 'custom_routine_creation',
        success_metrics: {
          open_rate_target: 0.30,
          click_rate_target: 0.08
        }
      },
      {
        id: 'ben_testimonials_05',
        subject: 'How Sarah saved 2 hours per week (and you can too)',
        template: 'busy-ben-testimonials',
        delay_hours: 240, // 10 days
        target_action: 'social_proof_engagement',
        success_metrics: {
          open_rate_target: 0.28,
          click_rate_target: 0.07
        }
      },
      {
        id: 'ben_limited_time_06',
        subject: 'Your trial expires in 3 days (don't lose your progress)',
        template: 'busy-ben-urgency',
        delay_hours: 264, // 11 days (if 14-day trial)
        trigger_condition: 'trial_not_converted',
        target_action: 'trial_conversion',
        success_metrics: {
          open_rate_target: 0.45,
          click_rate_target: 0.15,
          conversion_rate_target: 0.25
        }
      },
      {
        id: 'ben_final_call_07',
        subject: 'Last chance: Keep your optimized morning routine',
        template: 'busy-ben-final',
        delay_hours: 312, // 13 days
        trigger_condition: 'trial_not_converted',
        target_action: 'trial_conversion',
        success_metrics: {
          open_rate_target: 0.50,
          click_rate_target: 0.18,
          conversion_rate_target: 0.30
        }
      }
    ],
    conversion_funnel: {
      signup_to_trial: 0.25,
      trial_to_paid: 0.28
    }
  },

  // Professional Paula - Feature-rich, productivity-focused
  professional_paula: {
    persona: 'professional_paula',
    trigger: 'user_signup',
    delay_initial: 0,
    sequences: [
      {
        id: 'paula_premium_features_01',
        subject: 'Why top performers choose Relife Premium',
        template: 'professional-paula-features',
        delay_hours: 0,
        target_action: 'premium_trial_start',
        success_metrics: {
          open_rate_target: 0.38,
          click_rate_target: 0.14,
          conversion_rate_target: 0.22
        }
      },
      {
        id: 'paula_ai_optimization_02',
        subject: 'AI-powered morning optimization (most popular feature)',
        template: 'professional-paula-ai',
        delay_hours: 48,
        target_action: 'ai_feature_setup',
        success_metrics: {
          open_rate_target: 0.35,
          click_rate_target: 0.12
        }
      },
      {
        id: 'paula_analytics_03',
        subject: 'Your personal sleep & productivity dashboard',
        template: 'professional-paula-analytics',
        delay_hours: 120, // 5 days
        target_action: 'analytics_dashboard_view',
        success_metrics: {
          open_rate_target: 0.32,
          click_rate_target: 0.10
        }
      },
      {
        id: 'paula_integration_04',
        subject: 'Connect your entire productivity stack',
        template: 'professional-paula-integrations',
        delay_hours: 192, // 8 days
        target_action: 'integration_setup',
        success_metrics: {
          open_rate_target: 0.30,
          click_rate_target: 0.09
        }
      },
      {
        id: 'paula_peer_proof_05',
        subject: 'How other professionals optimize their mornings',
        template: 'professional-paula-peer-proof',
        delay_hours: 264, // 11 days
        target_action: 'case_study_engagement',
        success_metrics: {
          open_rate_target: 0.28,
          click_rate_target: 0.08
        }
      },
      {
        id: 'paula_conversion_06',
        subject: 'Upgrade to keep your personalized insights',
        template: 'professional-paula-conversion',
        delay_hours: 288, // 12 days
        trigger_condition: 'trial_not_converted',
        target_action: 'trial_conversion',
        success_metrics: {
          open_rate_target: 0.40,
          click_rate_target: 0.16,
          conversion_rate_target: 0.32
        }
      }
    ],
    conversion_funnel: {
      signup_to_trial: 0.30,
      trial_to_paid: 0.32
    }
  },

  // Enterprise Emma - Team-focused, comprehensive solution
  enterprise_emma: {
    persona: 'enterprise_emma',
    trigger: 'user_signup',
    delay_initial: 0,
    sequences: [
      {
        id: 'emma_team_solution_01',
        subject: 'Complete team productivity solution for {{company_name}}',
        template: 'enterprise-emma-team',
        delay_hours: 0,
        target_action: 'demo_request',
        success_metrics: {
          open_rate_target: 0.35,
          click_rate_target: 0.18,
          conversion_rate_target: 0.25
        }
      },
      {
        id: 'emma_roi_calculation_02',
        subject: 'ROI Calculator: Team productivity improvement',
        template: 'enterprise-emma-roi',
        delay_hours: 72, // 3 days
        target_action: 'roi_calculator_use',
        success_metrics: {
          open_rate_target: 0.40,
          click_rate_target: 0.15
        }
      },
      {
        id: 'emma_demo_follow_up_03',
        subject: 'Schedule your personalized team demo',
        template: 'enterprise-emma-demo',
        delay_hours: 168, // 7 days
        trigger_condition: 'no_demo_scheduled',
        target_action: 'demo_scheduling',
        success_metrics: {
          open_rate_target: 0.45,
          click_rate_target: 0.20,
          conversion_rate_target: 0.35
        }
      }
    ],
    conversion_funnel: {
      signup_to_demo: 0.40,
      demo_to_trial: 0.60,
      trial_to_paid: 0.35
    }
  },

  // Student Sarah - Budget-conscious, verification-focused
  student_sarah: {
    persona: 'student_sarah',
    trigger: 'user_signup',
    delay_initial: 0,
    sequences: [
      {
        id: 'sarah_student_discount_01',
        subject: '🎓 50% Student Discount - Verify in 2 minutes',
        template: 'student-sarah-discount',
        delay_hours: 0,
        target_action: 'student_verification',
        success_metrics: {
          open_rate_target: 0.50,
          click_rate_target: 0.20,
          verification_rate_target: 0.65
        }
      },
      {
        id: 'sarah_academic_features_02',
        subject: 'Perfect for your class schedule + study sessions',
        template: 'student-sarah-academic',
        delay_hours: 48,
        target_action: 'academic_schedule_setup',
        success_metrics: {
          open_rate_target: 0.42,
          click_rate_target: 0.15
        }
      },
      {
        id: 'sarah_campus_community_03',
        subject: 'Join 10k+ students already using Relife',
        template: 'student-sarah-community',
        delay_hours: 120, // 5 days
        target_action: 'community_engagement',
        success_metrics: {
          open_rate_target: 0.38,
          click_rate_target: 0.12
        }
      },
      {
        id: 'sarah_semester_prep_04',
        subject: 'Get ready for finals with better sleep habits',
        template: 'student-sarah-finals',
        delay_hours: 336, // 14 days
        trigger_condition: 'semester_period',
        target_action: 'study_routine_creation',
        success_metrics: {
          open_rate_target: 0.45,
          click_rate_target: 0.18
        }
      }
    ],
    conversion_funnel: {
      signup_to_verification: 0.65,
      verification_to_trial: 0.45,
      trial_to_paid: 0.22
    }
  },

  // Lifetime Larry - One-time payment, subscription fatigue
  lifetime_larry: {
    persona: 'lifetime_larry',
    trigger: 'user_signup',
    delay_initial: 0,
    sequences: [
      {
        id: 'larry_lifetime_offer_01',
        subject: 'Never pay for an alarm app again (Lifetime Deal)',
        template: 'lifetime-larry-offer',
        delay_hours: 0,
        target_action: 'lifetime_purchase',
        success_metrics: {
          open_rate_target: 0.42,
          click_rate_target: 0.16,
          conversion_rate_target: 0.08
        }
      },
      {
        id: 'larry_subscription_fatigue_02',
        subject: 'Tired of monthly subscriptions? (One payment, forever)',
        template: 'lifetime-larry-fatigue',
        delay_hours: 96, // 4 days
        target_action: 'lifetime_consideration',
        success_metrics: {
          open_rate_target: 0.38,
          click_rate_target: 0.14
        }
      },
      {
        id: 'larry_founding_member_03',
        subject: 'Founding Member Status (Limited Time)',
        template: 'lifetime-larry-founding',
        delay_hours: 168, // 7 days
        target_action: 'lifetime_purchase',
        success_metrics: {
          open_rate_target: 0.45,
          click_rate_target: 0.18,
          conversion_rate_target: 0.12
        }
      }
    ],
    conversion_funnel: {
      signup_to_consideration: 0.25,
      consideration_to_purchase: 0.12
    }
  }
};

// Campaign Triggers and Conditions
const campaignTriggers = {
  user_signup: {
    event: 'user_created',
    delay_minutes: 10, // Allow time for persona detection
    persona_confidence_threshold: 0.7
  },
  trial_not_converted: {
    event: 'trial_ending_soon',
    days_before_expiry: 3
  },
  no_demo_scheduled: {
    event: 'time_elapsed',
    hours: 168, // 7 days
    condition: 'demo_not_requested'
  },
  semester_period: {
    event: 'date_range',
    periods: ['finals_week', 'midterms', 'semester_start']
  }
};

// Email Template Variables
const templateVariables = {
  global: {
    app_link: 'https://relife.app',
    premium_link: 'https://relife.app/premium',
    demo_link: 'https://relife.app/demo',
    community_link: 'https://community.relife.app',
    unsubscribe_link: '{{unsubscribe_url}}',
    tracking_pixel: 'https://track.relife.app/pixel'
  },
  persona_specific: {
    struggling_sam: {
      primary_color: '#10b981',
      cta_style: 'friendly',
      messaging_tone: 'supportive'
    },
    busy_ben: {
      primary_color: '#3b82f6',
      cta_style: 'urgent',
      messaging_tone: 'efficient'
    },
    professional_paula: {
      primary_color: '#8b5cf6',
      cta_style: 'professional',
      messaging_tone: 'sophisticated'
    },
    enterprise_emma: {
      primary_color: '#6366f1',
      cta_style: 'corporate',
      messaging_tone: 'business_focused'
    },
    student_sarah: {
      primary_color: '#f59e0b',
      cta_style: 'youthful',
      messaging_tone: 'casual'
    },
    lifetime_larry: {
      primary_color: '#eab308',
      cta_style: 'exclusive',
      messaging_tone: 'value_focused'
    }
  }
};

// A/B Testing Configuration
const abTestConfig = {
  subject_line_tests: {
    struggling_sam: [
      'Welcome to Relife - Start Free Today! 🎉',
      'Your free alarm upgrade is ready 🎉',
      'Better mornings start here (100% free)'
    ],
    busy_ben: [
      'Save 30 minutes every morning (less than your daily coffee)',
      'ROI: 30 min saved daily for $7.99/month',
      'Your time is worth more than $8/month'
    ]
  },
  cta_button_tests: {
    struggling_sam: [
      'Start Your Free Journey →',
      'Try Relife Free →',
      'Get Started - No Credit Card →'
    ],
    busy_ben: [
      'Start 14-Day Free Trial →',
      'Calculate My Time Savings →',
      'See ROI Calculator →'
    ]
  }
};

// Success Metrics and KPIs
const successMetrics = {
  email_performance: {
    excellent: { open_rate: 0.40, click_rate: 0.12, conversion_rate: 0.25 },
    good: { open_rate: 0.30, click_rate: 0.08, conversion_rate: 0.18 },
    needs_improvement: { open_rate: 0.20, click_rate: 0.05, conversion_rate: 0.10 }
  },
  persona_benchmarks: {
    struggling_sam: { trial_conversion: 0.12, engagement_score: 0.65 },
    busy_ben: { trial_conversion: 0.25, engagement_score: 0.80 },
    professional_paula: { trial_conversion: 0.30, engagement_score: 0.85 },
    enterprise_emma: { demo_booking: 0.35, trial_conversion: 0.35 },
    student_sarah: { verification_rate: 0.65, trial_conversion: 0.22 },
    lifetime_larry: { lifetime_conversion: 0.08, consideration_rate: 0.25 }
  }
};

// Export configuration for use in email automation platform
export {
  campaignConfig,
  campaignTriggers,
  templateVariables,
  abTestConfig,
  successMetrics
};

// Platform-specific exports for popular email tools
const platformExports = {
  // Mailchimp configuration
  mailchimp: {
    audiences: Object.keys(campaignConfig),
    automation_workflows: campaignConfig,
    merge_tags: templateVariables
  },
  
  // ConvertKit configuration  
  convertkit: {
    sequences: campaignConfig,
    tags: Object.keys(campaignConfig),
    custom_fields: ['persona', 'confidence_score', 'signup_source']
  },
  
  // ActiveCampaign configuration
  activecampaign: {
    automations: campaignConfig,
    contact_tags: Object.keys(campaignConfig),
    custom_fields: templateVariables
  }
};

// Helper functions for campaign management
const campaignHelpers = {
  getPersonaCampaign: (persona) => campaignConfig[persona],
  getNextEmailInSequence: (persona, currentEmailId) => {
    const campaign = campaignConfig[persona];
    const currentIndex = campaign.sequences.findIndex(seq => seq.id === currentEmailId);
    return campaign.sequences[currentIndex + 1] || null;
  },
  calculateSendTime: (persona, sequenceIndex) => {
    const campaign = campaignConfig[persona];
    const email = campaign.sequences[sequenceIndex];
    return new Date(Date.now() + (email.delay_hours * 60 * 60 * 1000));
  },
  shouldSendEmail: (persona, user, emailId) => {
    // Add logic to check user eligibility, previous emails, etc.
    return true; // Simplified for this example
  }
};

export { platformExports, campaignHelpers };