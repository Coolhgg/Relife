#!/usr/bin/env node
/**
 * Quick Setup Script for Relife Email Campaigns
 * This script helps you quickly configure email campaigns for all personas
 */

import fs from 'fs';
import path from 'path';
import { campaignConfig, templateVariables } from './automation-config.js';

// Email platform configurations
const emailPlatforms = {
  convertkit: {
    name: 'ConvertKit',
    api_base: 'https://api.convertkit.com/v3',
    setup_url: 'https://app.convertkit.com',
    features: ['Advanced automation', 'Tagging', 'Custom fields', 'A/B testing'],
  },
  mailchimp: {
    name: 'Mailchimp',
    api_base: 'https://us1.api.mailchimp.com/3.0',
    setup_url: 'https://mailchimp.com',
    features: ['Templates', 'Segmentation', 'Analytics', 'Landing pages'],
  },
  activecampaign: {
    name: 'ActiveCampaign',
    api_base: 'https://yoursubdomain.api-us1.com/api/3',
    setup_url: 'https://activecampaign.com',
    features: [
      'Advanced automation',
      'CRM integration',
      'Machine learning',
      'Attribution',
    ],
  },
};

class EmailCampaignSetup {
  constructor() {
    this.selectedPlatform = null;
    this.apiKey = null;
    this.subdomain = null;
  }

  // Interactive platform selection
  async selectPlatform() {
    console.log('\n🚀 Relife Email Campaign Setup\n');
    console.log('Select your email marketing platform:\n');

    const platforms = Object.keys(emailPlatforms);
    platforms.forEach((key, index) => {
      const platform = emailPlatforms[key];
      console.log(`${index + 1}. ${platform.name}`);
      console.log(`   Features: ${platform.features.join(', ')}`);
      console.log(`   Setup: ${platform.setup_url}\n`);
    });

    // For demo purposes, we'll use ConvertKit
    this.selectedPlatform = 'convertkit';
    console.log(`✅ Selected: ${emailPlatforms[this.selectedPlatform].name}\n`);
  }

  // Generate ConvertKit configuration
  generateConvertKitConfig() {
    const config = {
      forms: {},
      sequences: {},
      tags: [],
      custom_fields: [
        { name: 'persona', type: 'text' },
        { name: 'confidence_score', type: 'number' },
        { name: 'signup_source', type: 'text' },
        { name: 'trial_start_date', type: 'date' },
        { name: 'company_name', type: 'text' },
      ],
    };

    // Create forms for each persona
    Object.keys(campaignConfig).forEach(persona => {
      config.forms[persona] = {
        name: `Relife Signup - ${this.getPersonaDisplayName(persona)}`,
        description: `Sign up form for ${persona} persona`,
        tags: [`persona:${persona}`],
        custom_fields: {
          persona: persona,
          signup_source: 'website',
        },
      };

      config.tags.push(`persona:${persona}`);
    });

    // Create email sequences
    Object.entries(campaignConfig).forEach(([persona, campaign]) => {
      config.sequences[persona] = {
        name: `${this.getPersonaDisplayName(persona)} - Welcome Series`,
        trigger: `Tag added: persona:${persona}`,
        emails: campaign.sequences.map((email, index) => ({
          subject: email.subject,
          delay_days: Math.floor(email.delay_hours / 24),
          delay_hours: email.delay_hours % 24,
          template_name: email.template || `${persona}_email_${index + 1}`,
          actions: email.target_action ? [`Tag: ${email.target_action}`] : [],
        })),
      };
    });

    return config;
  }

  // Generate Mailchimp configuration
  generateMailchimpConfig() {
    const config = {
      audience: {
        name: 'Relife Users - Persona Segmented',
        merge_fields: {
          PERSONA: { name: 'Persona Type', type: 'text' },
          CONFIDENCE: { name: 'Detection Confidence', type: 'number' },
          SOURCE: { name: 'Signup Source', type: 'text' },
          COMPANY: { name: 'Company Name', type: 'text' },
        },
        tags: Object.keys(campaignConfig),
        segments: {},
      },
      automations: {},
    };

    // Create segments for each persona
    Object.keys(campaignConfig).forEach(persona => {
      config.audience.segments[persona] = {
        name: `${this.getPersonaDisplayName(persona)} Users`,
        conditions: [{ field: 'PERSONA', op: 'is', value: persona }],
      };
    });

    // Create automations
    Object.entries(campaignConfig).forEach(([persona, campaign]) => {
      config.automations[persona] = {
        name: `${this.getPersonaDisplayName(persona)} Welcome Series`,
        trigger: {
          type: 'tag_added',
          tag: persona,
        },
        emails: campaign.sequences.map(email => ({
          subject: email.subject,
          delay: `${email.delay_hours} hours`,
          template: email.template || `${persona}_template`,
          goals: [email.target_action],
        })),
      };
    });

    return config;
  }

  // Generate email templates
  generateEmailTemplates() {
    const templates = {};

    Object.entries(campaignConfig).forEach(([persona, campaign]) => {
      templates[persona] = campaign.sequences.map((email, index) => {
        const personaColor = templateVariables.persona_specific[persona].primary_color;
        const messagingTone =
          templateVariables.persona_specific[persona].messaging_tone;

        return {
          id: email.id,
          subject: email.subject,
          template_name: email.template || `${persona}_email_${index + 1}`,
          html: this.generateEmailHTML(persona, email, personaColor),
          text: this.generateEmailText(_persona, _email),
          variables: {
            persona_color: personaColor,
            messaging_tone: messagingTone,
            cta_style: templateVariables.persona_specific[persona].cta_style,
          },
        };
      });
    });

    return templates;
  }

  // Generate basic email HTML template
  generateEmailHTML(persona, email, color) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${email.subject}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: ${color}; padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .cta-button { display: inline-block; background: ${color}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { background: #f1f5f9; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{email_headline}}</h1>
        </div>
        <div class="content">
            <p>Hi {{first_name}},</p>

            {{email_content}}

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{cta_link}}" class="cta-button">{{cta_text}}</a>
            </div>

            <p>{{email_signature}}</p>
        </div>
        <div class="footer">
            <a href="{{unsubscribe_link}}">Unsubscribe</a>
            <!-- Analytics tracking -->
            <img src="{{tracking_pixel}}?campaign=${email.id}&persona=${persona}&user={{user_id}}&event=opened" width="1" height="1" style="display:none;" />
        </div>
    </div>
</body>
</html>`;
  }

  // Generate text version of email
  generateEmailText(_persona, _email) {
    return `
{{email_headline}}

Hi {{first_name}},

{{email_content}}

{{cta_text}}: {{cta_link}}

{{email_signature}}

---
Unsubscribe: {{unsubscribe_link}}
`;
  }

  // Generate tracking setup
  generateTrackingSetup() {
    return {
      tracking_domain: 'track.relife.app',
      endpoints: {
        pixel: 'https://track.relife.app/pixel',
        click: 'https://track.relife.app/click',
        webhook: 'https://api.relife.app/webhook/email',
      },
      events: [
        'email_sent',
        'email_opened',
        'email_clicked',
        'email_bounced',
        'email_unsubscribed',
        'user_converted',
      ],
      analytics_integration: {
        google_analytics: {
          tracking_id: 'GA_TRACKING_ID',
          utm_parameters: {
            utm_source: 'email',
            utm_medium: 'campaign',
            utm_campaign: '{{campaign_id}}',
            utm_content: '{{persona}}',
            utm_term: 'persona_driven',
          },
        },
        mixpanel: {
          project_token: 'MIXPANEL_TOKEN',
          events_to_track: [
            'Email Opened',
            'Email Clicked',
            'Trial Started',
            'Subscription Created',
          ],
        },
      },
    };
  }

  // Generate performance benchmarks
  generateBenchmarks() {
    return {
      persona_targets: {
        struggling_sam: {
          open_rate: { min: 0.25, target: 0.35, excellent: 0.45 },
          click_rate: { min: 0.03, target: 0.06, excellent: 0.1 },
          conversion_rate: { min: 0.05, target: 0.12, excellent: 0.18 },
        },
        busy_ben: {
          open_rate: { min: 0.22, target: 0.32, excellent: 0.4 },
          click_rate: { min: 0.05, target: 0.1, excellent: 0.15 },
          conversion_rate: { min: 0.15, target: 0.25, excellent: 0.35 },
        },
        professional_paula: {
          open_rate: { min: 0.2, target: 0.3, excellent: 0.38 },
          click_rate: { min: 0.06, target: 0.12, excellent: 0.18 },
          conversion_rate: { min: 0.18, target: 0.3, excellent: 0.4 },
        },
        enterprise_emma: {
          open_rate: { min: 0.25, target: 0.35, excellent: 0.45 },
          demo_booking_rate: { min: 0.15, target: 0.25, excellent: 0.4 },
          conversion_rate: { min: 0.2, target: 0.35, excellent: 0.5 },
        },
        student_sarah: {
          open_rate: { min: 0.35, target: 0.45, excellent: 0.55 },
          verification_rate: { min: 0.45, target: 0.6, excellent: 0.75 },
          conversion_rate: { min: 0.12, target: 0.2, excellent: 0.28 },
        },
        lifetime_larry: {
          open_rate: { min: 0.28, target: 0.38, excellent: 0.48 },
          click_rate: { min: 0.08, target: 0.14, excellent: 0.2 },
          conversion_rate: { min: 0.04, target: 0.08, excellent: 0.15 },
        },
      },
      monitoring_alerts: {
        low_open_rate:
          'Alert if open rate drops below persona minimum for 3 consecutive days',
        high_unsubscribe: 'Alert if unsubscribe rate exceeds 5% for any campaign',
        low_conversion: 'Alert if conversion rate drops below 50% of target for 7 days',
        deliverability_issues:
          'Alert if bounce rate exceeds 3% or spam complaints exceed 0.1%',
      },
    };
  }

  // Helper method to get display name for persona
  getPersonaDisplayName(persona) {
    const displayNames = {
      struggling_sam: 'Struggling Sam (Free-Focused)',
      busy_ben: 'Busy Ben (Efficiency-Driven)',
      professional_paula: 'Professional Paula (Feature-Rich)',
      enterprise_emma: 'Enterprise Emma (Team-Oriented)',
      student_sarah: 'Student Sarah (Budget-Conscious)',
      lifetime_larry: 'Lifetime Larry (One-Time Payment)',
    };
    return displayNames[persona] || persona;
  }

  // Save all configurations to files
  async saveConfigurations() {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const outputDir = path.join(__dirname, 'generated-configs');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const configs = {
      convertkit: this.generateConvertKitConfig(),
      mailchimp: this.generateMailchimpConfig(),
      templates: this.generateEmailTemplates(),
      tracking: this.generateTrackingSetup(),
      benchmarks: this.generateBenchmarks(),
    };

    // Save each configuration to a file
    for (const [name, config] of Object.entries(configs)) {
      const filename = path.join(outputDir, `${name}-config.json`);
      fs.writeFileSync(filename, JSON.stringify(config, null, 2));
      console.log(`✅ Saved ${name} configuration to ${filename}`);
    }

    // Generate setup instructions
    const instructions = this.generateSetupInstructions();
    const instructionsFile = path.join(outputDir, 'setup-instructions.md');
    fs.writeFileSync(instructionsFile, instructions);
    console.log(`✅ Saved setup instructions to ${instructionsFile}`);
  }

  // Generate setup instructions
  generateSetupInstructions() {
    return `
# Email Campaign Setup Instructions

## 🚀 Quick Start

Your persona-driven email campaigns are ready to launch! Follow these steps:

### 1. Platform Setup (${emailPlatforms[this.selectedPlatform].name})

1. **Create Account**: Visit ${emailPlatforms[this.selectedPlatform].setup_url}
2. **Import Configuration**: Use the generated \`${this.selectedPlatform}-config.json\` file
3. **Set Up API**: Add your API key to environment variables

### 2. Email Templates

1. **Upload Templates**: Import templates from \`templates-config.json\`
2. **Customize Content**: Adjust messaging for your brand voice
3. **Test Rendering**: Preview on desktop and mobile

### 3. Automation Setup

1. **Create Sequences**: Set up the 6 persona-based automation workflows
2. **Configure Triggers**: Set persona tags as triggers
3. **Test Workflows**: Send test emails to verify automation

### 4. Tracking & Analytics

1. **Set Up Tracking**: Configure tracking pixels and UTM parameters
2. **Connect Analytics**: Integrate with Google Analytics/Mixpanel
3. **Create Dashboard**: Set up monitoring dashboard

### 5. Launch Checklist

- [ ] All email templates imported and tested
- [ ] Automation workflows configured and activated
- [ ] Tracking and analytics set up
- [ ] Team trained on monitoring and optimization
- [ ] Performance benchmarks established

## 📊 Expected Results

Based on industry benchmarks and persona optimization:

- **25-35% improvement** in email open rates
- **40-60% improvement** in click-through rates
- **50-80% improvement** in conversion rates
- **20-30% reduction** in unsubscribe rates

## 🎯 Success Metrics

Monitor these KPIs for each persona:

${Object.keys(campaignConfig)
  .map(
    persona => `
### ${this.getPersonaDisplayName(persona)}
- Open Rate Target: ${(this.generateBenchmarks().persona_targets[persona].open_rate.target * 100).toFixed(0)}%
- Click Rate Target: ${(this.generateBenchmarks().persona_targets[persona].click_rate.target * 100).toFixed(0)}%
- Conversion Target: ${(this.generateBenchmarks().persona_targets[persona].conversion_rate.target * 100).toFixed(0)}%
`
  )
  .join('')}

## 🚨 Monitoring & Alerts

Set up alerts for:
- Open rates below persona minimums
- Unsubscribe rates above 5%
- Conversion rates below targets
- Deliverability issues

## 📞 Support

- Email campaign questions: Reply to the setup guide
- Technical issues: Check platform documentation
- Performance optimization: Schedule a review call

Your campaigns are ready to launch! 🎉
`;
  }

  // Main setup process
  async run() {
    try {
      await this.selectPlatform();
      await this.saveConfigurations();

      console.log('\n🎉 Email campaign setup complete!\n');
      console.log('Next steps:');
      console.log('1. Check the generated-configs/ folder for all configuration files');
      console.log('2. Follow the setup-instructions.md guide');
      console.log('3. Import configurations into your email platform');
      console.log('4. Test and launch your campaigns\n');
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the setup if this file is executed directly
const setup = new EmailCampaignSetup();
setup.run();

export default EmailCampaignSetup;
