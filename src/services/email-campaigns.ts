// Email Campaign Service for Relife Application
// Integrates persona-driven email marketing with campaign automation

import {
  PersonaType,
  PersonaDetectionResult,
  EmailCampaign,
  EmailSequence,
  CampaignMetrics,
  EmailPreferences,
  User
} from '../types';

import { campaignConfig, templateVariables } from '../../email-campaigns/automation-config.js';
import { SupabaseService } from './supabase';
import { ErrorHandler } from './error-handler';

export interface EmailPlatformConfig {
  platform: 'convertkit' | 'mailchimp' | 'sendgrid';
  apiKey: string;
  apiSecret?: string;
  fromEmail: string;
  fromName: string;
  webhookSecret?: string;
}

export interface SendEmailOptions {
  to: string;
  templateId: string;
  variables?: Record<string, any>;
  campaignId?: string;
  sequenceId?: string;
  scheduledAt?: Date;
}

export class EmailCampaignService {
  private static instance: EmailCampaignService;
  private config: EmailPlatformConfig | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EmailCampaignService {
    if (!EmailCampaignService.instance) {
      EmailCampaignService.instance = new EmailCampaignService();
    }
    return EmailCampaignService.instance;
  }

  // Initialize email service with platform configuration
  async initialize(config: EmailPlatformConfig): Promise<void> {
    try {
      this.config = config;

      // Test connection with the email platform
      await this.testConnection();

      this.isInitialized = true;
      console.log(`Email campaign service initialized with ${config.platform}`);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to initialize email campaign service',
        { context: 'email_service_init', platform: config.platform }
      );
      throw error;
    }
  }

  // Test connection to email platform
  private async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Email service not configured');
    }

    try {
      switch (this.config.platform) {
        case 'convertkit':
          return await this.testConvertKit();
        case 'mailchimp':
          return await this.testMailchimp();
        case 'sendgrid':
          return await this.testSendGrid();
        default:
          throw new Error(`Unsupported email platform: ${this.config.platform}`);
      }
    } catch (error) {
      console.error('Email platform connection test failed:', error);
      throw error;
    }
  }

  private async testConvertKit(): Promise<boolean> {
    const response = await fetch(`https://api.convertkit.com/v3/account?api_key=${this.config!.apiKey}`);
    if (!response.ok) {
      throw new Error(`ConvertKit API error: ${response.statusText}`);
    }
    return true;
  }

  private async testMailchimp(): Promise<boolean> {
    // Extract datacenter from API key (format: key-dc)
    const datacenter = this.config!.apiKey.split('-').pop();
    const response = await fetch(`https://${datacenter}.api.mailchimp.com/3.0/ping`, {
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`
      }
    });
    if (!response.ok) {
      throw new Error(`Mailchimp API error: ${response.statusText}`);
    }
    return true;
  }

  private async testSendGrid(): Promise<boolean> {
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`
      }
    });
    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.statusText}`);
    }
    return true;
  }

  // Detect user persona based on behavior and preferences
  async detectUserPersona(user: User, behaviorData?: Record<string, any>): Promise<PersonaDetectionResult> {
    try {
      console.log(`Detecting persona for user: ${user.id}`);

      const factors: any[] = [];
      const scores: Record<PersonaType, number> = {
        struggling_sam: 0,
        busy_ben: 0,
        professional_paula: 0,
        enterprise_emma: 0,
        student_sarah: 0,
        lifetime_larry: 0
      };

      // Analyze subscription tier
      const subscriptionTier = user.subscriptionTier || 'free';
      if (subscriptionTier === 'free') {
        scores.struggling_sam += 30;
        factors.push({ factor: 'subscription_tier', weight: 30, value: 'free', influence: 30 });
      } else if (subscriptionTier === 'basic') {
        scores.busy_ben += 40;
        factors.push({ factor: 'subscription_tier', weight: 40, value: 'basic', influence: 40 });
      } else if (subscriptionTier === 'premium') {
        scores.professional_paula += 50;
        factors.push({ factor: 'subscription_tier', weight: 50, value: 'premium', influence: 50 });
      } else if (subscriptionTier === 'pro') {
        scores.enterprise_emma += 60;
        factors.push({ factor: 'subscription_tier', weight: 60, value: 'pro', influence: 60 });
      } else if (subscriptionTier === 'student') {
        scores.student_sarah += 70;
        factors.push({ factor: 'subscription_tier', weight: 70, value: 'student', influence: 70 });
      }

      // Analyze email domain for student detection
      if (user.email) {
        const domain = user.email.split('@')[1];
        if (domain.endsWith('.edu') || domain.endsWith('.ac.uk') || domain.includes('university')) {
          scores.student_sarah += 25;
          factors.push({ factor: 'email_domain', weight: 25, value: domain, influence: 25 });
        }

        // Corporate email patterns for enterprise users
        const corporateDomains = ['corp.', 'company.', 'inc.', 'ltd.'];
        if (corporateDomains.some(corp => domain.includes(corp))) {
          scores.enterprise_emma += 20;
          factors.push({ factor: 'corporate_domain', weight: 20, value: domain, influence: 20 });
        }
      }

      // Analyze behavior data if provided
      if (behaviorData) {
        // Time-based usage patterns
        if (behaviorData.peakUsageHours) {
          const peakHours = behaviorData.peakUsageHours;
          if (peakHours >= 6 && peakHours <= 8) {
            scores.busy_ben += 15;
            scores.professional_paula += 10;
            factors.push({ factor: 'early_usage', weight: 15, value: peakHours, influence: 15 });
          }
        }

        // Feature usage patterns
        if (behaviorData.premiumFeatureUsage > 5) {
          scores.professional_paula += 20;
          factors.push({ factor: 'premium_features', weight: 20, value: behaviorData.premiumFeatureUsage, influence: 20 });
        }

        // Price sensitivity indicators
        if (behaviorData.viewedPricing && !behaviorData.upgraded) {
          scores.struggling_sam += 15;
          scores.lifetime_larry += 10;
          factors.push({ factor: 'price_sensitivity', weight: 15, value: true, influence: 15 });
        }

        // Team usage indicators
        if (behaviorData.sharedAlarms || behaviorData.teamInvites) {
          scores.enterprise_emma += 25;
          factors.push({ factor: 'team_usage', weight: 25, value: true, influence: 25 });
        }
      }

      // Determine the persona with highest score
      const topPersona = Object.entries(scores).reduce((a, b) =>
        scores[a[0] as PersonaType] > scores[b[0] as PersonaType] ? a : b
      ) as [PersonaType, number];

      const confidence = Math.min(topPersona[1] / 100, 1.0);

      const result: PersonaDetectionResult = {
        persona: topPersona[0],
        confidence,
        factors,
        updatedAt: new Date()
      };

      console.log(`Detected persona: ${result.persona} (confidence: ${(confidence * 100).toFixed(1)}%)`);

      return result;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to detect user persona',
        { context: 'persona_detection', userId: user.id }
      );

      // Return default persona on error
      return {
        persona: 'struggling_sam',
        confidence: 0.3,
        factors: [],
        updatedAt: new Date()
      };
    }
  }

  // Add user to email campaign based on persona
  async addUserToCampaign(user: User, persona: PersonaType, confidence: number): Promise<boolean> {
    if (!this.isInitialized || !this.config) {
      throw new Error('Email service not initialized');
    }

    try {
      console.log(`Adding user ${user.email} to ${persona} campaign`);

      const campaignData = campaignConfig[persona];
      if (!campaignData) {
        throw new Error(`No campaign configuration found for persona: ${persona}`);
      }

      // Add user to email platform
      switch (this.config.platform) {
        case 'convertkit':
          return await this.addToConvertKit(user, persona, confidence);
        case 'mailchimp':
          return await this.addToMailchimp(user, persona, confidence);
        case 'sendgrid':
          return await this.addToSendGrid(user, persona, confidence);
        default:
          throw new Error(`Unsupported platform: ${this.config.platform}`);
      }
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to add user to email campaign',
        { context: 'add_to_campaign', userId: user.id, persona, platform: this.config.platform }
      );
      return false;
    }
  }

  private async addToConvertKit(user: User, persona: PersonaType, confidence: number): Promise<boolean> {
    const response = await fetch('https://api.convertkit.com/v3/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: this.config!.apiKey,
        email: user.email,
        first_name: user.name || user.username || user.displayName,
        fields: {
          persona: persona,
          confidence_score: confidence,
          signup_source: 'relife_app',
          signup_date: new Date().toISOString(),
          user_id: user.id
        },
        tags: [`persona:${persona}`]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ConvertKit API error: ${response.statusText} - ${errorData}`);
    }

    const result = await response.json();
    console.log(`User added to ConvertKit with subscriber ID: ${result.subscription.subscriber.id}`);

    return true;
  }

  private async addToMailchimp(user: User, persona: PersonaType, confidence: number): Promise<boolean> {
    const datacenter = this.config!.apiKey.split('-').pop();
    const audienceId = process.env.VITE_MAILCHIMP_AUDIENCE_ID || 'your_audience_id';

    const response = await fetch(`https://${datacenter}.api.mailchimp.com/3.0/lists/${audienceId}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: user.email,
        status: 'subscribed',
        merge_fields: {
          FNAME: user.name || user.username || user.displayName || '',
          PERSONA: persona,
          CONFIDENCE: Math.round(confidence * 100),
          SOURCE: 'relife_app',
          USERID: user.id
        },
        tags: [persona, 'relife_user']
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Mailchimp API error: ${response.statusText} - ${errorData}`);
    }

    const result = await response.json();
    console.log(`User added to Mailchimp with ID: ${result.id}`);

    return true;
  }

  private async addToSendGrid(user: User, persona: PersonaType, confidence: number): Promise<boolean> {
    // Add contact to SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contacts: [{
          email: user.email,
          first_name: user.name || user.username || user.displayName || '',
          custom_fields: {
            persona: persona,
            confidence: Math.round(confidence * 100),
            signup_source: 'relife_app',
            user_id: user.id
          }
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`SendGrid API error: ${response.statusText} - ${errorData}`);
    }

    console.log(`User added to SendGrid contacts`);
    return true;
  }

  // Trigger campaign sequence for a user
  async triggerSequence(userId: string, persona: PersonaType, sequenceId: string): Promise<boolean> {
    if (!this.isInitialized || !this.config) {
      throw new Error('Email service not initialized');
    }

    try {
      const campaignData = campaignConfig[persona];
      const sequence = campaignData.sequences.find(seq => seq.id === sequenceId);

      if (!sequence) {
        throw new Error(`Sequence ${sequenceId} not found for persona ${persona}`);
      }

      // Get user data
      const user = await this.getUserData(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Prepare email variables
      const variables = {
        ...templateVariables.global,
        ...templateVariables.persona_specific[persona],
        first_name: user.name || user.username || 'there',
        user_id: userId,
        persona: persona,
        campaign_id: sequence.campaignId,
        sequence_id: sequenceId
      };

      // Schedule or send email based on delay
      const sendOptions: SendEmailOptions = {
        to: user.email,
        templateId: sequence.template || `${persona}_${sequence.order}`,
        variables,
        campaignId: sequence.campaignId,
        sequenceId: sequenceId
      };

      if (sequence.delay_hours > 0) {
        sendOptions.scheduledAt = new Date(Date.now() + sequence.delay_hours * 60 * 60 * 1000);
      }

      return await this.sendEmail(sendOptions);
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to trigger email sequence',
        { context: 'trigger_sequence', userId, persona, sequenceId }
      );
      return false;
    }
  }

  // Send email through configured platform
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.isInitialized || !this.config) {
      throw new Error('Email service not initialized');
    }

    try {
      switch (this.config.platform) {
        case 'convertkit':
          return await this.sendConvertKitEmail(options);
        case 'mailchimp':
          return await this.sendMailchimpEmail(options);
        case 'sendgrid':
          return await this.sendSendGridEmail(options);
        default:
          throw new Error(`Unsupported platform: ${this.config.platform}`);
      }
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to send email',
        { context: 'send_email', platform: this.config.platform, templateId: options.templateId }
      );
      return false;
    }
  }

  private async sendConvertKitEmail(options: SendEmailOptions): Promise<boolean> {
    // ConvertKit uses sequences/automations rather than individual sends
    // This would typically be handled by the automation trigger
    console.log('ConvertKit email sending handled by automation');
    return true;
  }

  private async sendMailchimpEmail(options: SendEmailOptions): Promise<boolean> {
    // Mailchimp automation handling
    console.log('Mailchimp email sending handled by automation');
    return true;
  }

  private async sendSendGridEmail(options: SendEmailOptions): Promise<boolean> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: {
          email: this.config!.fromEmail,
          name: this.config!.fromName
        },
        to: [{ email: options.to }],
        template_id: options.templateId,
        dynamic_template_data: options.variables || {},
        send_at: options.scheduledAt ? Math.floor(options.scheduledAt.getTime() / 1000) : undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`SendGrid send error: ${response.statusText} - ${errorData}`);
    }

    console.log('Email sent successfully via SendGrid');
    return true;
  }

  // Get campaign metrics
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    try {
      // This would typically fetch from your analytics database
      // For now, return mock data
      return {
        totalSent: 1000,
        totalOpened: 350,
        totalClicked: 120,
        totalConverted: 25,
        openRate: 0.35,
        clickRate: 0.12,
        conversionRate: 0.025,
        lastUpdated: new Date()
      };
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get campaign metrics',
        { context: 'get_metrics', campaignId }
      );
      throw error;
    }
  }

  // Update user email preferences
  async updateEmailPreferences(userId: string, preferences: Partial<EmailPreferences>): Promise<boolean> {
    try {
      const currentPrefs = await this.getEmailPreferences(userId);
      const updatedPrefs = {
        ...currentPrefs,
        ...preferences,
        lastUpdated: new Date()
      };

      // Save to database
      const { error } = await SupabaseService.getClient()
        .from('email_preferences')
        .upsert([updatedPrefs]);

      if (error) {
        throw new Error(error.message);
      }

      // Update preferences in email platform
      if (this.config) {
        await this.syncPreferencesToPlatform(userId, updatedPrefs);
      }

      return true;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to update email preferences',
        { context: 'update_preferences', userId }
      );
      return false;
    }
  }

  // Get user email preferences
  async getEmailPreferences(userId: string): Promise<EmailPreferences> {
    try {
      const { data, error } = await SupabaseService.getClient()
        .from('email_preferences')
        .select('*')
        .eq('userId', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw new Error(error.message);
      }

      // Return default preferences if not found
      if (!data) {
        return {
          userId,
          subscribed: true,
          preferences: {
            marketing: true,
            product_updates: true,
            educational_content: true
          },
          frequency: 'weekly',
          lastUpdated: new Date()
        };
      }

      return data as EmailPreferences;
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to get email preferences',
        { context: 'get_preferences', userId }
      );
      throw error;
    }
  }

  private async syncPreferencesToPlatform(userId: string, preferences: EmailPreferences): Promise<void> {
    // Sync preference changes to the email platform
    // Implementation would depend on the specific platform
    console.log(`Syncing preferences for user ${userId} to ${this.config!.platform}`);
  }

  private async getUserData(userId: string): Promise<User | null> {
    try {
      const { data, error } = await SupabaseService.getClient()
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as User;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  // Handle webhook events from email platform
  async handleWebhook(platform: string, event: any): Promise<void> {
    try {
      console.log(`Received webhook from ${platform}:`, event.type);

      switch (platform) {
        case 'convertkit':
          await this.handleConvertKitWebhook(event);
          break;
        case 'mailchimp':
          await this.handleMailchimpWebhook(event);
          break;
        case 'sendgrid':
          await this.handleSendGridWebhook(event);
          break;
        default:
          console.warn(`Unsupported webhook platform: ${platform}`);
      }
    } catch (error) {
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Failed to handle webhook',
        { context: 'webhook_handler', platform, eventType: event.type }
      );
    }
  }

  private async handleConvertKitWebhook(event: any): Promise<void> {
    // Handle ConvertKit webhook events
    console.log('Processing ConvertKit webhook:', event);
  }

  private async handleMailchimpWebhook(event: any): Promise<void> {
    // Handle Mailchimp webhook events
    console.log('Processing Mailchimp webhook:', event);
  }

  private async handleSendGridWebhook(event: any): Promise<void> {
    // Handle SendGrid webhook events
    console.log('Processing SendGrid webhook:', event);
  }
}

export default EmailCampaignService;