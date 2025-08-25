// Enhanced Email Campaign Service for Relife Application
import { PersonaType, PersonaDetectionResult, User } from '../types';
import { ErrorHandler } from './error-handler';
import ConvertKitService, { ConvertKitConfig } from './convertkit-service';
import { CONVERTKIT_IDS } from '../config/convertkit-generated';
import { TimeoutHandle } from '../types/timers';
import { config } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { error } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { user } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify
import { persona } from 'src/utils/__auto_stubs'; // auto: restored by scout - verify

export interface EmailPlatformConfig {
  platform: 'convertkit' | 'mailchimp' | 'sendgrid';
  apiKey: string;
  apiSecret?: string;
  fromEmail: string;
  fromName: string;
  webhookSecret?: string;
}

export class EmailCampaignService {
  private static instance: EmailCampaignService;
  private _config: EmailPlatformConfig | null = null;
  private isInitialized = false;
  private convertKitService: ConvertKitService;

  private constructor() {
    this.convertKitService = ConvertKitService.getInstance();
  }

  static getInstance(): EmailCampaignService {
    if (!EmailCampaignService.instance) {
      EmailCampaignService.instance = new EmailCampaignService();
    }
    return EmailCampaignService.instance;
  }

  async initialize(_config: EmailPlatformConfig): Promise<boolean> {
    try {
      this.config = config;

      if (_config.platform === 'convertkit') {
        const convertKitConfig: ConvertKitConfig = {
          apiKey: config.apiKey,
          apiSecret: config.apiSecret || '',
          fromEmail: config.fromEmail,
          fromName: config.fromName,
          webhookSecret: _config.webhookSecret,
        };

        const initialized = await this.convertKitService.initialize(convertKitConfig);
        if (initialized) {
          this.isInitialized = true;
          console.log(`✅ Email service initialized with ${_config.platform}`);
          return true;
        } else {
          console._error(`❌ Failed to initialize ${_config.platform}`);
          return false;
        }
      } else {
        this.isInitialized = true;
        console.log(`Email service initialized with ${_config.platform} (basic mode)`);
        return true;
      }
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to initialize email service'
      );
      return false;
    }
  }

  // Enhanced persona detection with behavioral analytics
  async detectUserPersona(
    _user: User,
    behavioralData?: any
  ): Promise<PersonaDetectionResult> {
    try {
      let persona: PersonaType = 'struggling_sam';
      let confidence = 0.5;
      const factors: any[] = [];

      // Base persona detection on subscription tier
      const tier = user.subscriptionTier || 'free';
      let baseConfidence = 0.6;

      if (tier === 'free') {
        persona = 'struggling_sam';
      } else if (tier === 'basic') {
        persona = 'busy_ben';
        baseConfidence = 0.7;
      } else if (tier === 'premium') {
        persona = 'professional_paula';
        baseConfidence = 0.8;
      } else if (tier === 'pro') {
        persona = 'enterprise_emma';
        baseConfidence = 0.8;
      } else if (tier === 'student') {
        persona = 'student_sarah';
        baseConfidence = 0.9;
      }

      factors.push({
        factor: 'subscription_tier',
        weight: 0.4,
        value: tier,
        influence: baseConfidence,
      });

      // Email domain analysis
      const emailDomain = user.email?.split('@')[1]?.toLowerCase() || '';
      if (
        emailDomain.includes('.edu') ||
        emailDomain.includes('university') ||
        emailDomain.includes('college') ||
        emailDomain.includes('student')
      ) {
        persona = 'student_sarah';
        confidence = Math.max(confidence, 0.9);
        factors.push({
          factor: 'email_domain',
          weight: 0.3,
          value: emailDomain,
          influence: 0.9,
        });
      }

      // Company domain analysis for enterprise
      const enterpriseDomains = [
        'company.com',
        'corp.com',
        'enterprise.com',
        'business.com',
      ];
      const isEnterpriseDomain =
        enterpriseDomains.some(domain => emailDomain.includes(domain)) ||
        !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(emailDomain);

      if (isEnterpriseDomain && tier !== 'student') {
        if (tier === 'pro' || tier === 'premium') {
          persona = 'enterprise_emma';
          confidence = Math.max(confidence, 0.85);
        }
        factors.push({
          factor: 'enterprise_domain',
          weight: 0.2,
          value: emailDomain,
          influence: 0.7,
        });
      }

      // Behavioral analysis if data is provided
      if (behavioralData) {
        const behaviorFactors = this.analyzeBehavioralData(behavioralData);
        factors.push(...behaviorFactors.factors);

        // Adjust persona based on behavior
        if (behaviorFactors.suggestedPersona) {
          persona = behaviorFactors.suggestedPersona;
          confidence = Math.max(confidence, behaviorFactors.confidence);
        }
      }

      // Calculate final confidence score
      const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
      const weightedConfidence =
        factors.reduce((sum, factor) => {
          return sum + factor.influence * factor.weight;
        }, 0) / totalWeight;

      confidence = Math.min(0.99, Math.max(0.1, weightedConfidence || baseConfidence));

      return {
        persona,
        confidence,
        factors,
        updatedAt: new Date(),
      };
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to detect persona'
      );
      return {
        persona: 'struggling_sam',
        confidence: 0.5,
        factors: [],
        updatedAt: new Date(),
      };
    }
  }

  // Analyze behavioral data for persona detection
  private analyzeBehavioralData(behavioralData: any): {
    factors: any[];
    suggestedPersona?: PersonaType;
    confidence: number;
  } {
    const factors: any[] = [];
    let suggestedPersona: PersonaType | undefined;
    let confidence = 0.5;

    // Feature usage patterns
    if (behavioralData.featureUsage) {
      const usage = behavioralData.featureUsage;

      // High analytics usage suggests professional_paula
      if (usage.analytics && usage.analytics > 10) {
        factors.push({
          factor: 'analytics_usage',
          weight: 0.3,
          value: usage.analytics,
          influence: 0.8,
        });
        suggestedPersona = 'professional_paula';
        confidence = 0.8;
      }

      // Team features suggest enterprise_emma
      if (usage.teamFeatures && usage.teamFeatures > 5) {
        factors.push({
          factor: 'team_features',
          weight: 0.35,
          value: usage.teamFeatures,
          influence: 0.85,
        });
        suggestedPersona = 'enterprise_emma';
        confidence = 0.85;
      }

      // Quick actions and shortcuts suggest busy_ben
      if (usage.shortcuts && usage.shortcuts > 20) {
        factors.push({
          factor: 'shortcut_usage',
          weight: 0.25,
          value: usage.shortcuts,
          influence: 0.75,
        });
        if (!suggestedPersona || confidence < 0.75) {
          suggestedPersona = 'busy_ben';
          confidence = 0.75;
        }
      }
    }

    // Session patterns
    if (behavioralData.sessionData) {
      const sessions = behavioralData.sessionData;

      // Frequent short sessions suggest busy_ben
      if (sessions.averageDuration < 5 && sessions.frequency > 10) {
        factors.push({
          factor: 'session_pattern',
          weight: 0.2,
          value: 'frequent_short',
          influence: 0.7,
        });
      }

      // Long focused sessions suggest professional_paula
      if (sessions.averageDuration > 30) {
        factors.push({
          factor: 'session_pattern',
          weight: 0.2,
          value: 'long_focused',
          influence: 0.7,
        });
      }
    }

    return { factors, suggestedPersona, confidence };
  }

  // Add user to campaign with enhanced ConvertKit integration
  async addUserToCampaign(_user: User, _persona: PersonaType): Promise<boolean> {
    if (!this.isInitialized || !this._config) {
      console.warn('Email service not initialized');
      return false;
    }

    try {
      console.log(`Adding user ${_user.email} to ${_persona} campaign`);

      switch (this._config.platform) {
        case 'convertkit':
          return await this.addToEnhancedConvertKit(_user, _persona);
        case 'mailchimp':
          return await this.addToMailchimp(_user, _persona);
        default:
          console.log(`Platform ${this._config.platform} not implemented yet`);
          return true;
      }
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to add user to campaign'
      );
      return false;
    }
  }

  private async addToEnhancedConvertKit(
    _user: User,
    _persona: PersonaType
  ): Promise<boolean> {
    try {
      // Get the form ID for this persona
      const formId = CONVERTKIT_IDS?.forms?.[persona]?.id;

      // Add subscriber to ConvertKit
      const subscriber = await this.convertKitService.addSubscriber(
        _user,
        _persona,
        formId
      );

      if (subscriber) {
        // Add to sequence if available
        const sequenceId = CONVERTKIT_IDS?.sequences?.[persona]?.id;
        if (sequenceId) {
          await this.convertKitService.addToSequence(_user.email, sequenceId);
        }

        console.log(
          `✅ Successfully added ${_user.email} to ConvertKit with persona ${_persona}`
        );
        return true;
      } else {
        console._error(`❌ Failed to add ${_user.email} to ConvertKit`);
        return false;
      }
    } catch (_error) {
      console.error('ConvertKit integration _error:', _error);
      return false;
    }
  }

  // Legacy ConvertKit method for backwards compatibility
  private async addToConvertKit(_user: User, _persona: PersonaType): Promise<boolean> {
    const response = await fetch('https://api.convertkit.com/v3/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this._config!.apiKey,
        email: user.email,
        first_name: user.name || user.username,
        fields: { persona, user_id: _user.id },
        tags: [`persona:${_persona}`],
      }),
    });

    return response.ok;
  }

  private async addToMailchimp(_user: User, _persona: PersonaType): Promise<boolean> {
    // Mailchimp implementation would go here
    console.log('Mailchimp integration not implemented yet');
    return true;
  }

  // Enhanced sequence triggering
  async triggerSequence(
    email: string,
    _persona: PersonaType,
    delay: number = 0
  ): Promise<boolean> {
    if (!this.isInitialized || !this._config) {
      console.warn('Email service not initialized');
      return false;
    }

    try {
      if (this._config.platform === 'convertkit') {
        const sequenceId = CONVERTKIT_IDS?.sequences?.[persona]?.id;
        if (sequenceId) {
          // Add delay if specified
          if (delay > 0) {
            setTimeout(async () => {
              await this.convertKitService.addToSequence(email, sequenceId);
            }, delay * 1000);
          } else {
            await this.convertKitService.addToSequence(email, sequenceId);
          }

          console.log(`✅ Triggered ${_persona} sequence for ${email}`);
          return true;
        } else {
          console.warn(`No sequence ID found for persona: ${_persona}`);
          return false;
        }
      } else {
        console.log(
          `Triggering ${_persona} sequence for ${email} (${this._config.platform})`
        );
        return true;
      }
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to trigger sequence'
      );
      return false;
    }
  }

  // Update user persona and move to appropriate campaign
  async updateUserPersona(
    email: string,
    newPersona: PersonaType,
    confidence: number
  ): Promise<boolean> {
    if (!this.isInitialized || !this._config) {
      console.warn('Email service not initialized');
      return false;
    }

    try {
      if (this._config.platform === 'convertkit') {
        const updated = await this.convertKitService.updateSubscriberPersona(
          email,
          newPersona,
          confidence
        );
        if (updated) {
          // Trigger new persona sequence
          await this.triggerSequence(email, newPersona);
          console.log(
            `✅ Updated _persona for ${email}: ${newPersona} (confidence: ${confidence})`
          );
          return true;
        }
      }
      return false;
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to update user persona'
      );
      return false;
    }
  }

  // Get service statistics
  async getServiceStats() {
    if (!this.isInitialized || !this._config) {
      return {
        isInitialized: false,
        platform: null,
        stats: null,
      };
    }

    try {
      if (this._config.platform === 'convertkit') {
        const stats = await this.convertKitService.getServiceStats();
        return {
          isInitialized: this.isInitialized,
          platform: this._config.platform,
          stats,
        };
      } else {
        return {
          isInitialized: this.isInitialized,
          platform: this._config.platform,
          stats: { message: 'Stats not available for this platform' },
        };
      }
    } catch (_error) {
      console.error('Failed to get service stats:', _error);
      return {
        isInitialized: this.isInitialized,
        platform: this._config.platform,
        stats: { _error: 'Failed to retrieve stats' },
      };
    }
  }
}

export default EmailCampaignService;

// Export the enhanced service instance for direct access
export const emailCampaignService = EmailCampaignService.getInstance();
