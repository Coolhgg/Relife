// Custom Branded Email Templates for Relife
// Professional email templates with persona-specific branding and A/B testing support

import { PersonaType, DEFAULT_PERSONAS } from '../types/email-campaigns';

export interface EmailTemplateConfig {
  id: string;
  name: string;
  persona: PersonaType;
  type: 'welcome' | 'nurture' | 'feature_announcement' | 'trial_reminder' | 'upsell' | 'retention';
  subject: string;
  preheader: string;
  htmlContent: string;
  textContent: string;
  variables: TemplateVariable[];
  ctaButton: {
    text: string;
    url: string;
    backgroundColor: string;
    textColor: string;
  };
  abTestVariants?: ABTestVariant[];
}

export interface TemplateVariable {
  key: string;
  defaultValue: string;
  description: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  subject?: string;
  ctaText?: string;
  contentChanges?: Record<string, string>;
  trafficPercentage: number;
}

// Relife brand colors and styling
export const RELIFE_BRAND = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    success: '#22c55e',
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      500: '#6b7280',
      700: '#374151',
      900: '#111827'
    }
  },
  fonts: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading: 'Cal Sans, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }
};

// Base email template generator with Relife branding
export const generateBaseTemplate = (content: string, persona: PersonaType, ctaButton?: { text: string; url: string; color?: string }): string => {
  const personaConfig = DEFAULT_PERSONAS[persona];
  const primaryColor = personaConfig.primaryColor;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: ${RELIFE_BRAND.fonts.primary}; font-size: 16px; line-height: 1.6; color: ${RELIFE_BRAND.colors.neutral[700]}; background-color: ${RELIFE_BRAND.colors.neutral[50]}; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1); }
        .email-header { background: ${primaryColor}; padding: 40px 30px; text-align: center; }
        .logo h1 { font-family: ${RELIFE_BRAND.fonts.heading}; font-size: 36px; font-weight: 600; color: white; margin: 0; }
        .logo p { font-size: 14px; color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; }
        .email-content { padding: 40px 30px; }
        h2 { font-family: ${RELIFE_BRAND.fonts.heading}; font-size: 24px; font-weight: 600; color: ${RELIFE_BRAND.colors.neutral[900]}; margin: 0 0 16px 0; }
        .highlight { background: ${primaryColor}20; padding: 16px 20px; border-radius: 8px; border-left: 4px solid ${primaryColor}; margin: 20px 0; }
        .cta-container { text-align: center; margin: 40px 0; }
        .cta-button { display: inline-block; background: ${ctaButton?.color || primaryColor}; color: white !important; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; }
        .email-footer { background: ${RELIFE_BRAND.colors.neutral[100]}; padding: 30px; text-align: center; border-top: 1px solid ${RELIFE_BRAND.colors.neutral[200]}; }
        .footer-content { font-size: 14px; color: ${RELIFE_BRAND.colors.neutral[500]}; line-height: 1.5; }
        @media only screen and (max-width: 600px) {
            .email-container { margin: 0 10px; }
            .email-header { padding: 30px 20px; }
            .email-content { padding: 30px 20px; }
            .email-footer { padding: 20px; }
        }
    </style>
</head>
<body>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
            <td style="padding: 20px 0;">
                <div class="email-container">
                    <div class="email-header">
                        <div class="logo">
                            <h1>Relife</h1>
                            <p>Your Personal Productivity Assistant</p>
                        </div>
                    </div>
                    <div class="email-content">
                        ${content}
                        ${ctaButton ? `<div class="cta-container"><a href="${ctaButton.url}" class="cta-button">${ctaButton.text}</a></div>` : ''}
                    </div>
                    <div class="email-footer">
                        <div class="footer-content">
                            <p><strong>Thanks for being part of the Relife community!</strong></p>
                            <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{manage_preferences_url}}">Manage Preferences</a></p>
                            <p>&copy; 2024 Relife, Inc. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

// Persona-specific welcome templates
export const EMAIL_TEMPLATES: Record<PersonaType, EmailTemplateConfig[]> = {
  struggling_sam: [
    {
      id: 'struggling_sam_welcome',
      name: 'Welcome - Struggling Sam',
      persona: 'struggling_sam',
      type: 'welcome',
      subject: 'Welcome to Relife - Your journey starts here 🌟',
      preheader: 'Get started with free productivity tools that actually work',
      variables: [{ key: 'first_name', defaultValue: 'there', description: 'User first name' }],
      ctaButton: { text: 'Get Started Free', url: '/dashboard?welcome=true', backgroundColor: RELIFE_BRAND.colors.accent, textColor: '#ffffff' },
      htmlContent: generateBaseTemplate(`
        <h2>Hey {{first_name | default: "there"}}, welcome to Relife! 👋</h2>
        <p>I know how overwhelming it can feel when you're trying to get your life organized. You're not alone in this struggle.</p>
        <div class="highlight">
          <p><strong>Here's what you get right now, completely free:</strong></p>
          <ul><li>Simple task management that actually works</li><li>Gentle reminders that won't stress you out</li><li>Progress tracking to celebrate small wins</li></ul>
        </div>
        <p>Don't worry about getting everything perfect right away. Small steps lead to big changes. You've got this!</p>
      `, 'struggling_sam', { text: 'Get Started Free', url: '/dashboard?welcome=true', color: RELIFE_BRAND.colors.accent }),
      textContent: 'Hey there, welcome to Relife! You're not alone in organizing your life. Get started with free tools that work: /dashboard?welcome=true'
    }
  ],
  busy_ben: [
    {
      id: 'busy_ben_shortcuts',
      name: 'Time-Saving Shortcuts - Busy Ben',
      persona: 'busy_ben',
      type: 'welcome',
      subject: 'Save 2 hours daily with these Relife shortcuts',
      preheader: 'Efficiency hacks that busy professionals swear by',
      variables: [{ key: 'first_name', defaultValue: 'there', description: 'User first name' }],
      ctaButton: { text: 'Try Shortcuts Now →', url: '/features/shortcuts', backgroundColor: RELIFE_BRAND.colors.primary, textColor: '#ffffff' },
      htmlContent: generateBaseTemplate(`
        <h2>Ready to reclaim 2 hours of your day? ⚡</h2>
        <p>{{first_name | default: "Hey there"}}, time is your most valuable asset. Here are the most powerful productivity shortcuts:</p>
        <div class="highlight">
          <p><strong>🚀 Power User Tip:</strong> Combine quick capture, smart templates, and batch processing for maximum efficiency. Users save an average of 2.3 hours daily.</p>
        </div>
        <p>If you bill at $100/hour, these shortcuts save you $230/day. That's $59,800/year in recovered productivity.</p>
      `, 'busy_ben'),
      textContent: 'Ready to reclaim 2 hours daily? Time-saving shortcuts await: /features/shortcuts'
    }
  ],
  professional_paula: [
    {
      id: 'professional_paula_advanced',
      name: 'Advanced Features - Professional Paula',
      persona: 'professional_paula',
      type: 'welcome',
      subject: 'Unlock professional-grade productivity insights',
      preheader: 'Advanced analytics and customization for serious professionals',
      variables: [{ key: 'first_name', defaultValue: 'there', description: 'User first name' }],
      ctaButton: { text: 'Explore Advanced Features', url: '/features/advanced', backgroundColor: RELIFE_BRAND.colors.secondary, textColor: '#ffffff' },
      htmlContent: generateBaseTemplate(`
        <h2>Welcome to professional-grade productivity, {{first_name | default: "there"}} 🚀</h2>
        <p>You need sophisticated tools that match your professional standards. Relife's advanced features are designed for ambitious professionals like you.</p>
        <div class="highlight">
          <p><strong>💡 Professional Insight:</strong> Users who spend 15 minutes weekly reviewing analytics achieve 23% better goal completion rates.</p>
        </div>
        <p>Start with the Analytics Dashboard to establish baseline metrics, then customize based on data-driven insights.</p>
      `, 'professional_paula'),
      textContent: 'Welcome to professional-grade productivity! Advanced analytics and customization await: /features/advanced'
    }
  ],
  enterprise_emma: [
    {
      id: 'enterprise_emma_team_intro',
      name: 'Team Solutions - Enterprise Emma',
      persona: 'enterprise_emma',
      type: 'welcome',
      subject: 'Transform your team's productivity with Relife Enterprise',
      preheader: 'Scalable solutions for high-performing teams and organizations',
      variables: [{ key: 'first_name', defaultValue: 'there', description: 'User first name' }],
      ctaButton: { text: 'Schedule Team Demo', url: '/enterprise/demo', backgroundColor: RELIFE_BRAND.colors.primary, textColor: '#ffffff' },
      htmlContent: generateBaseTemplate(`
        <h2>Enterprise-grade productivity for your organization 🏢</h2>
        <p>{{first_name | default: "Hello"}}, team productivity is about creating systems that scale and deliver measurable results.</p>
        <div class="highlight">
          <p><strong>📈 ROI Impact:</strong> Enterprise clients see 35% improvement in project delivery times and 28% reduction in meeting overhead within Q1.</p>
        </div>
        <p>SOC 2 compliance, team analytics, seamless integrations with 50+ enterprise tools. Let's discuss your specific needs.</p>
      `, 'enterprise_emma'),
      textContent: 'Enterprise-grade productivity awaits. 35% faster delivery, 28% fewer meetings. Schedule demo: /enterprise/demo'
    }
  ],
  student_sarah: [
    {
      id: 'student_sarah_discount_welcome',
      name: 'Student Welcome - Student Sarah',
      persona: 'student_sarah',
      type: 'welcome',
      subject: '🎓 Your student discount is here + study life hacks',
      preheader: 'Get organized for the semester with 50% off',
      variables: [{ key: 'first_name', defaultValue: 'there', description: 'User first name' }],
      ctaButton: { text: 'Claim Student Discount', url: '/student/verify', backgroundColor: RELIFE_BRAND.colors.warning, textColor: '#ffffff' },
      htmlContent: generateBaseTemplate(`
        <h2>Hey {{first_name | default: "there"}}! Welcome to student productivity 🎓</h2>
        <p>College is intense enough without complicated tools. Relife helps students succeed without adding stress.</p>
        <div class="highlight">
          <p><strong>🎉 Your Student Perks:</strong> 50% discount, free study templates, campus integration, study group tools</p>
        </div>
        <p>Students report 2.3 GPA improvement, 40% less admin time, 60% better deadline tracking, reduced stress.</p>
      `, 'student_sarah'),
      textContent: 'Hey there! Student productivity made simple. 50% off + free templates: /student/verify'
    }
  ],
  lifetime_larry: [
    {
      id: 'lifetime_larry_value_prop',
      name: 'Lifetime Value - Lifetime Larry',
      persona: 'lifetime_larry',
      type: 'welcome',
      subject: 'Why lifetime value beats monthly subscriptions',
      preheader: 'One payment, lifetime productivity - see the math',
      variables: [{ key: 'first_name', defaultValue: 'there', description: 'User first name' }],
      ctaButton: { text: 'See Lifetime Calculator', url: '/pricing/lifetime-calculator', backgroundColor: RELIFE_BRAND.colors.warning, textColor: '#ffffff' },
      htmlContent: generateBaseTemplate(`
        <h2>Smart money recognizes smart value, {{first_name | default: "there"}} 💰</h2>
        <p>You understand that the best investments pay for themselves. Monthly subscriptions extract maximum value over time.</p>
        <div class="highlight">
          <p><strong>🎯 Relife Lifetime: $299</strong><br>Break-even: 20 months<br>5-year savings: $601<br>10-year savings: $1,501</p>
        </div>
        <p>Price protection forever, all future features, priority support, early access, exclusive community.</p>
      `, 'lifetime_larry'),
      textContent: 'Smart value: $299 lifetime vs $1,800 over 10 years. See your savings: /pricing/lifetime-calculator'
    }
  ]
};

export default EMAIL_TEMPLATES;
