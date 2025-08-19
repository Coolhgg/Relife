#!/usr/bin/env node
/**
 * ConvertKit Setup Script for Relife Email Campaigns
 * Automatically creates forms, sequences, and tags for all personas
 */

import { createRequire } from 'module';

// Load configurations
const require = createRequire(import.meta.url);
const {
  PERSONA_CONVERTKIT_CONFIG,
  CONVERTKIT_FORM_TEMPLATES,
  CONVERTKIT_SEQUENCE_TEMPLATES
} = require('../src/config/convertkit-config.ts');

class ConvertKitSetup {
  constructor() {
    this.apiKey = process.env.CONVERTKIT_API_KEY;
    this.apiSecret = process.env.CONVERTKIT_API_SECRET;
    this.baseUrl = 'https://api.convertkit.com/v3';

    if (!this.apiKey || !this.apiSecret) {
      console.error('❌ ConvertKit API credentials not found!');
      console.log('Please set CONVERTKIT_API_KEY and CONVERTKIT_API_SECRET environment variables');
      process.exit(1);
    }
  }

  async setup() {
    console.log('🚀 Starting ConvertKit setup for Relife email campaigns...
');

    try {
      // Test authentication first
      const isAuthenticated = await this.testAuthentication();
      if (!isAuthenticated) {
        console.error('❌ Authentication failed. Please check your API credentials.');
        process.exit(1);
      }

      console.log('✅ ConvertKit authentication successful
');

      // Create persona tags
      console.log('📋 Creating persona tags...');
      await this.createPersonaTags();

      // Create forms for each persona
      console.log('
📝 Creating forms for each persona...');
      const forms = await this.createPersonaForms();

      // Create sequences for each persona
      console.log('
📧 Creating email sequences for each persona...');
      const sequences = await this.createPersonaSequences();

      // Generate configuration file with created IDs
      console.log('
⚙️ Generating configuration file...');
      await this.generateConfigFile(forms, sequences);

      // Setup webhooks
      console.log('
🔗 Setting up webhooks...');
      await this.setupWebhooks();

      console.log('
🎉 ConvertKit setup completed successfully!');
      console.log('
📊 Setup Summary:');
      console.log(`   • Created ${Object.keys(forms).length} forms`);
      console.log(`   • Created ${Object.keys(sequences).length} sequences`);
      console.log(`   • Configured 6 persona tags`);
      console.log(`   • Set up webhook endpoints`);
      console.log('
📁 Configuration saved to: src/config/convertkit-generated.ts');

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async testAuthentication() {
    try {
      const response = await fetch(`${this.baseUrl}/account?api_secret=${this.apiSecret}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Authenticated as: ${data.name} (Account ID: ${data.account_id})`);
        return true;
      } else {
        console.error(`❌ Auth failed: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Auth error:', error.message);
      return false;
    }
  }

  async createPersonaTags() {
    const personas = ['struggling_sam', 'busy_ben', 'professional_paula', 'enterprise_emma', 'student_sarah', 'lifetime_larry'];
    const createdTags = [];

    for (const persona of personas) {
      try {
        const tagName = `persona:${persona}`;
        const tag = await this.createTag(tagName);
        if (tag) {
          createdTags.push(tag);
          console.log(`  ✅ Created tag: ${tagName}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to create tag for ${persona}:`, error.message);
      }
    }

    return createdTags;
  }

  async createTag(name) {
    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          tag: { name: name }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.tag;
      } else {
        // Tag might already exist, that's ok
        const error = await response.json();
        if (error.message && error.message.includes('already exists')) {
          console.log(`  ℹ️  Tag already exists: ${name}`);
          return { id: null, name: name };
        }
        throw new Error(`Failed to create tag: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async createPersonaForms() {
    const personas = Object.keys(CONVERTKIT_FORM_TEMPLATES);
    const createdForms = {};

    for (const persona of personas) {
      try {
        const template = CONVERTKIT_FORM_TEMPLATES[persona];
        const form = await this.createForm(template);
        if (form) {
          createdForms[persona] = form;
          console.log(`  ✅ Created form: ${template.name} (ID: ${form.id})`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to create form for ${persona}:`, error.message);
      }
    }

    return createdForms;
  }

  async createForm(template) {
    try {
      const formData = {
        api_key: this.apiKey,
        form: {
          name: template.name,
          description: template.description,
          sign_up_redirect_url: template.redirectUrl || '',
          success_message: template.successMessage,
          format: 'modal', // or 'inline', 'slide_in'
          background_color: '#ffffff',
          text_color: '#333333',
          button_color: '#007cba',
          button_text: 'Subscribe',
          archived: false
        }
      };

      const response = await fetch(`${this.baseUrl}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        return data.form;
      } else {
        const error = await response.json();
        throw new Error(`Failed to create form: ${error.message || response.statusText}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async createPersonaSequences() {
    const personas = Object.keys(CONVERTKIT_SEQUENCE_TEMPLATES);
    const createdSequences = {};

    for (const persona of personas) {
      try {
        const template = CONVERTKIT_SEQUENCE_TEMPLATES[persona];
        const sequence = await this.createSequence(template);
        if (sequence) {
          createdSequences[persona] = sequence;
          console.log(`  ✅ Created sequence: ${template.name} (ID: ${sequence.id})`);

          // Add emails to sequence
          await this.addEmailsToSequence(sequence.id, template.emails);
        }
      } catch (error) {
        console.error(`  ❌ Failed to create sequence for ${persona}:`, error.message);
      }
    }

    return createdSequences;
  }

  async createSequence(template) {
    try {
      const sequenceData = {
        api_secret: this.apiSecret,
        course: {
          name: template.name,
          description: template.description
        }
      };

      const response = await fetch(`${this.baseUrl}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sequenceData)
      });

      if (response.ok) {
        const data = await response.json();
        return data.course;
      } else {
        const error = await response.json();
        throw new Error(`Failed to create sequence: ${error.message || response.statusText}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async addEmailsToSequence(sequenceId, emails) {
    for (let i = 0; i < emails.length; i++) {
      try {
        const email = emails[i];
        await this.createSequenceEmail(sequenceId, email, i + 1);
        console.log(`    ➕ Added email ${i + 1}: ${email.subject}`);
      } catch (error) {
        console.error(`    ❌ Failed to add email ${i + 1}:`, error.message);
      }
    }
  }

  async createSequenceEmail(sequenceId, emailTemplate, position) {
    try {
      const emailData = {
        api_secret: this.apiSecret,
        email: {
          subject: emailTemplate.subject,
          content: this.generateEmailContent(emailTemplate),
          delay: emailTemplate.delayHours * 60, // Convert hours to minutes
          position: position,
          public: false
        }
      };

      const response = await fetch(`${this.baseUrl}/courses/${sequenceId}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        const data = await response.json();
        return data.email;
      } else {
        const error = await response.json();
        throw new Error(`Failed to create email: ${error.message || response.statusText}`);
      }
    } catch (error) {
      throw error;
    }
  }

  generateEmailContent(emailTemplate) {
    // Generate basic HTML content
    let content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailTemplate.subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #ddd; }
        .cta-button { display: inline-block; background: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Relife</h1>
            <p>Your Personal Productivity Assistant</p>
        </div>
        <div class="content">
            <h2>${emailTemplate.subject}</h2>
            <p>Hi {{first_name | default: "there"}},</p>

            <p>This is a placeholder email content for: <strong>${emailTemplate.content}</strong></p>

            <p>This email sequence is designed to help you get the most out of Relife based on your specific needs and goals.</p>`;

    if (emailTemplate.ctaButton) {
      content += `
            <p style="text-align: center;">
                <a href="${emailTemplate.ctaButton.url}" class="cta-button" style="background-color: ${emailTemplate.ctaButton.color};">
                    ${emailTemplate.ctaButton.text}
                </a>
            </p>`;
    }

    content += `
            <p>Best regards,<br>
            The Relife Team</p>
        </div>
        <div class="footer">
            <p>You're receiving this because you signed up for Relife updates.</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{manage_preferences_url}}">Manage Preferences</a></p>
            <p>&copy; 2024 Relife. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    return content;
  }

  async setupWebhooks() {
    try {
      const webhookUrl = process.env.RELIFE_WEBHOOK_URL || 'https://relife.app/api/webhooks/convertkit';

      const events = [
        'subscriber.subscriber_activate',
        'subscriber.subscriber_unsubscribe',
        'subscriber.tag_add',
        'subscriber.form_subscribe'
      ];

      for (const event of events) {
        try {
          const webhook = await this.createWebhook(webhookUrl, event);
          if (webhook) {
            console.log(`  ✅ Created webhook for: ${event}`);
          }
        } catch (error) {
          console.error(`  ❌ Failed to create webhook for ${event}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Failed to setup webhooks:', error.message);
    }
  }

  async createWebhook(url, event) {
    try {
      const webhookData = {
        api_secret: this.apiSecret,
        webhook_url: url,
        event: event
      };

      const response = await fetch(`${this.baseUrl}/automations/hooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        const data = await response.json();
        return data.hook;
      } else {
        // Webhook might already exist, that's ok
        const error = await response.json();
        if (error.message && error.message.includes('already exists')) {
          console.log(`  ℹ️  Webhook already exists for: ${event}`);
          return { id: null, event: event };
        }
        throw new Error(`Failed to create webhook: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async generateConfigFile(forms, sequences) {
    const configContent = `// Auto-generated ConvertKit configuration
// Generated on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Use scripts/setup-convertkit.js to regenerate

import { PersonaType } from '../types/email-campaigns';

export interface GeneratedConvertKitConfig {
  forms: Record<PersonaType, { id: number; name: string }>;
  sequences: Record<PersonaType, { id: number; name: string }>;
  tags: Record<PersonaType, string>;
  createdAt: string;
}

export const CONVERTKIT_IDS: GeneratedConvertKitConfig = {
  forms: {
${Object.entries(forms).map(([persona, form]) =>
    `    ${persona}: { id: ${form.id}, name: "${form.name}" }`
  ).join(',
')}
  },
  sequences: {
${Object.entries(sequences).map(([persona, sequence]) =>
    `    ${persona}: { id: ${sequence.id}, name: "${sequence.name}" }`
  ).join(',
')}
  },
  tags: {
    struggling_sam: "persona:struggling_sam",
    busy_ben: "persona:busy_ben",
    professional_paula: "persona:professional_paula",
    enterprise_emma: "persona:enterprise_emma",
    student_sarah: "persona:student_sarah",
    lifetime_larry: "persona:lifetime_larry"
  },
  createdAt: "${new Date().toISOString()}"
};

// Environment-specific URLs
export const WEBHOOK_URLS = {
  production: "https://relife.app/api/webhooks/convertkit",
  development: "https://relife-dev.app/api/webhooks/convertkit",
  test: "http://localhost:3000/api/webhooks/convertkit"
};

export default CONVERTKIT_IDS;`;

    // Write the configuration file
    const fs = require('fs');
    const path = require('path');

    const configPath = path.join(process.cwd(), 'src/config/convertkit-generated.ts');
    fs.writeFileSync(configPath, configContent);

    console.log(`✅ Configuration file created: ${configPath}`);
  }
}

// Run the setup if this script is called directly
if (process.argv[1].endsWith('setup-convertkit.js')) {
  const setup = new ConvertKitSetup();
  setup.setup().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

export default ConvertKitSetup;