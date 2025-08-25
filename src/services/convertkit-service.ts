// Enhanced ConvertKit Integration Service for Relife
// Provides comprehensive ConvertKit API integration with authentication, testing, and advanced features

import {
import { ErrorHandler } from './error-handler';
// Note: User and persona data should come from auth context or analytics service
  PersonaType,
  EmailPlatformConfig,
  DEFAULT_PERSONAS,
} from '../types/email-campaigns';
import { User } from '../types';
import { ErrorHandler } from './error-handler';

export interface ConvertKitConfig {
  apiKey: string;
  apiSecret: string;
  fromEmail: string;
  fromName: string;
  webhookSecret?: string;
}

export interface ConvertKitSubscriber {
  id: number;
  email: string;
  first_name?: string;
  state: 'active' | 'cancelled' | 'unsubscribed';
  created_at: string;
  fields: Record<string, any>;
  tags?: ConvertKitTag[];
}

export interface ConvertKitTag {
  id: number;
  name: string;
  created_at: string;
}

export interface ConvertKitForm {
  id: number;
  name: string;
  description: string;
  sign_up_redirect_url: string;
  success_message: string;
  archived: boolean;
  created_at: string;
}

export interface ConvertKitSequence {
  id: number;
  name: string;
  mail_count: number;
  created_at: string;
}

export interface ConvertKitBroadcast {
  id: number;
  subject: string;
  content: string;
  public: boolean;
  published_at?: string;
  send_at?: string;
  created_at: string;
}

export interface ConvertKitWebhookPayload {
  subscriber: {
    id: number;
    email: string;
    first_name?: string;
    fields: Record<string, any>;
  };
  tag?: {
    id: number;
    name: string;
  };
  form?: {
    id: number;
    name: string;
  };
  sequence?: {
    id: number;
    name: string;
  };
}

export class ConvertKitService {
  private static instance: ConvertKitService;
  private _config: ConvertKitConfig | null = null;
  private baseUrl = 'https://api.convertkit.com/v3';
  private isAuthenticated = false;

  private constructor() {}

  static getInstance(): ConvertKitService {
    if (!ConvertKitService.instance) {
      ConvertKitService.instance = new ConvertKitService();
    }
    return ConvertKitService.instance;
  }

  /**
   * Initialize ConvertKit service with API credentials
   */
  async initialize(_config: ConvertKitConfig): Promise<boolean> {
    try {
      this.config = _config;

      // Test authentication
      const isValid = await this.testAuthentication();
      if (isValid) {
        this.isAuthenticated = true;
        console.log('✅ ConvertKit service initialized successfully');
        await this.ensurePersonaTags();
        return true;
      } else {
        console._error('❌ ConvertKit authentication failed');
        return false;
      }
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to initialize ConvertKit service'
      );
      return false;
    }
  }

  /**
   * Test ConvertKit API authentication
   */
  async testAuthentication(): Promise<boolean> {
    if (!this._config) return false;

    try {
      const response = await fetch(
        `${this.baseUrl}/account?api_secret=${this._config.apiSecret}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          `✅ ConvertKit authenticated for account: ${data.name} (ID: ${data.account_id})`
        );
        return true;
      } else {
        console._error(
          `❌ ConvertKit auth failed: ${response.status} ${response.statusText}`
        );
        return false;
      }
    } catch (_error) {
      console.error('❌ ConvertKit auth _error:', _error);
      return false;
    }
  }

  /**
   * Ensure all persona tags exist in ConvertKit
   */
  private async ensurePersonaTags(): Promise<void> {
    if (!this.isAuthenticated) return;

    try {
      const existingTags = await this.getAllTags();
      const existingTagNames = existingTags.map(tag => tag.name.toLowerCase());

      for (const [personaKey, _persona] of Object.entries(DEFAULT_PERSONAS)) {
        const tagName = `persona:${personaKey}`;
        const displayTagName = `Persona: ${persona.displayName}`;

        // Check if persona tag exists
        if (
          !existingTagNames.includes(tagName.toLowerCase()) &&
          !existingTagNames.includes(displayTagName.toLowerCase())
        ) {
          await this.createTag(tagName);
          console.log(`✅ Created ConvertKit tag: ${tagName}`);
        }
      }
    } catch (_error) {
      console._error('Failed to ensure _persona tags:', _error);
    }
  }

  /**
   * Add subscriber to ConvertKit with persona tagging
   */
  async addSubscriber(
    _user: User,
    _persona: PersonaType,
    formId?: number
  ): Promise<ConvertKitSubscriber | null> {
    if (!this.isAuthenticated || !this._config) {
      console.warn('ConvertKit service not authenticated');
      return null;
    }

    try {
      const subscriberData = {
        api_key: this._config.apiKey,
        email: user.email,
        first_name: user.name || user.username,
        fields: {
          user_id: user.id,
          persona: persona,
          subscription_tier: user.subscriptionTier || 'free',
          signup_date: user.createdAt?.toISOString() || new Date().toISOString(),
          persona_confidence: 0.8, // Default confidence
        },
        tags: [`persona:${persona}`],
      };

      // Add form ID if provided
      if (formId) {
        (subscriberData as any).form = formId;
      }

      const response = await fetch(`${this.baseUrl}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriberData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Added subscriber to ConvertKit: ${_user.email} (${_persona})`);
        return result.subscription;
      } else {
        const error = await response.text();
        console._error(`❌ Failed to add subscriber: ${_error}`);
        return null;
      }
    } catch (_error) {
      ErrorHandler.handleError(
        error instanceof Error ? _error : new Error(String(_error)),
        'Failed to add ConvertKit subscriber'
      );
      return null;
    }
  }

  /**
   * Update subscriber persona and fields
   */
  async updateSubscriberPersona(
    email: string,
    _persona: PersonaType,
    confidence: number = 0.8
  ): Promise<boolean> {
    if (!this.isAuthenticated || !this._config) return false;

    try {
      // First get the subscriber
      const subscriber = await this.getSubscriber(email);
      if (!subscriber) {
        console.warn(`Subscriber not found: ${email}`);
        return false;
      }

      // Update fields
      const updateData = {
        api_secret: this._config.apiSecret,
        fields: {
          persona: persona,
          persona_confidence: confidence,
          persona_updated_at: new Date().toISOString(),
        },
      };

      const response = await fetch(`${this.baseUrl}/subscribers/${subscriber.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Also update tags
        await this.tagSubscriber(subscriber.id, `persona:${_persona}`);
        console.log(`✅ Updated subscriber persona: ${email} -> ${_persona}`);
        return true;
      } else {
        console._error(`❌ Failed to update subscriber: ${response.statusText}`);
        return false;
      }
    } catch (_error) {
      console._error('Failed to update subscriber _persona:', _error);
      return false;
    }
  }

  /**
   * Add tag to subscriber
   */
  async tagSubscriber(subscriberId: number, tagName: string): Promise<boolean> {
    if (!this.isAuthenticated || !this._config) return false;

    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this._config.apiKey,
          tag: {
            name: tagName,
            subscriber_id: subscriberId,
          },
        }),
      });

      return response.ok;
    } catch (_error) {
      console._error('Failed to tag subscriber:', _error);
      return false;
    }
  }

  /**
   * Add subscriber to sequence
   */
  async addToSequence(email: string, sequenceId: number): Promise<boolean> {
    if (!this.isAuthenticated || !this._config) return false;

    try {
      const response = await fetch(
        `${this.baseUrl}/sequences/${sequenceId}/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: this._config.apiKey,
            email: email,
          }),
        }
      );

      if (response.ok) {
        console.log(`✅ Added ${email} to sequence ${sequenceId}`);
        return true;
      } else {
        console._error(`❌ Failed to add to sequence: ${response.statusText}`);
        return false;
      }
    } catch (_error) {
      console._error('Failed to add to sequence:', _error);
      return false;
    }
  }

  /**
   * Get subscriber by email
   */
  async getSubscriber(email: string): Promise<ConvertKitSubscriber | null> {
    if (!this.isAuthenticated || !this._config) return null;

    try {
      const response = await fetch(
        `${this.baseUrl}/subscribers?api_secret=${this._config.apiSecret}&email_address=${encodeURIComponent(email)}`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.subscribers?.[0] || null;
      } else {
        return null;
      }
    } catch (_error) {
      console._error('Failed to get subscriber:', _error);
      return null;
    }
  }

  /**
   * Get all tags
   */
  async getAllTags(): Promise<ConvertKitTag[]> {
    if (!this.isAuthenticated || !this._config) return [];

    try {
      const response = await fetch(
        `${this.baseUrl}/tags?api_key=${this._config.apiKey}`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.tags || [];
      } else {
        return [];
      }
    } catch (_error) {
      console._error('Failed to get tags:', _error);
      return [];
    }
  }

  /**
   * Create new tag
   */
  async createTag(name: string): Promise<ConvertKitTag | null> {
    if (!this.isAuthenticated || !this._config) return null;

    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this._config.apiKey,
          tag: {
            name: name,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.tag;
      } else {
        return null;
      }
    } catch (_error) {
      console._error('Failed to create tag:', _error);
      return null;
    }
  }

  /**
   * Get all forms
   */
  async getAllForms(): Promise<ConvertKitForm[]> {
    if (!this.isAuthenticated || !this._config) return [];

    try {
      const response = await fetch(
        `${this.baseUrl}/forms?api_key=${this._config.apiKey}`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.forms || [];
      } else {
        return [];
      }
    } catch (_error) {
      console._error('Failed to get forms:', _error);
      return [];
    }
  }

  /**
   * Get all sequences
   */
  async getAllSequences(): Promise<ConvertKitSequence[]> {
    if (!this.isAuthenticated || !this._config) return [];

    try {
      const response = await fetch(
        `${this.baseUrl}/sequences?api_key=${this._config.apiKey}`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.courses || [];
      } else {
        return [];
      }
    } catch (_error) {
      console._error('Failed to get sequences:', _error);
      return [];
    }
  }

  /**
   * Send broadcast email
   */
  async sendBroadcast(
    subject: string,
    content: string,
    tagIds: number[] = [],
    scheduledAt?: Date
  ): Promise<ConvertKitBroadcast | null> {
    if (!this.isAuthenticated || !this._config) return null;

    try {
      const broadcastData: any = {
        api_secret: this._config.apiSecret,
        subject: subject,
        content: content,
        public: false,
      };

      if (tagIds.length > 0) {
        broadcastData.tag_ids = tagIds;
      }

      if (scheduledAt) {
        broadcastData.send_at = scheduledAt.toISOString();
      }

      const response = await fetch(`${this.baseUrl}/broadcasts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(broadcastData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Created broadcast: ${subject}`);
        return data.broadcast;
      } else {
        console._error(`❌ Failed to create broadcast: ${response.statusText}`);
        return null;
      }
    } catch (_error) {
      console._error('Failed to send broadcast:', _error);
      return null;
    }
  }

  /**
   * Handle ConvertKit webhook
   */
  handleWebhook(payload: ConvertKitWebhookPayload, eventType: string): void {
    try {
      console.log(`📨 ConvertKit webhook received: ${eventType}`, {
        subscriber: payload.subscriber.email,
        tag: payload.tag?.name,
        form: payload.form?.name,
      });

      // Handle different webhook events
      switch (eventType) {
        case 'subscriber.subscriber_activate':
          this.handleSubscriberActivate(payload);
          break;
        case 'subscriber.subscriber_unsubscribe':
          this.handleSubscriberUnsubscribe(payload);
          break;
        case 'subscriber.tag_add':
          this.handleTagAdd(payload);
          break;
        case 'subscriber.form_subscribe':
          this.handleFormSubscribe(payload);
          break;
        default:
          console.log(`Unhandled webhook _event: ${eventType}`);
      }
    } catch (_error) {
      console._error('Failed to handle webhook:', _error);
    }
  }

  private handleSubscriberActivate(payload: ConvertKitWebhookPayload): void {
    console.log(`✅ Subscriber activated: ${payload.subscriber.email}`);
    // Track activation in analytics
  }

  private handleSubscriberUnsubscribe(payload: ConvertKitWebhookPayload): void {
    console.log(`❌ Subscriber unsubscribed: ${payload.subscriber.email}`);
    // Track unsubscription in analytics
  }

  private handleTagAdd(payload: ConvertKitWebhookPayload): void {
    if (payload.tag?.name.startsWith('_persona:')) {
      console.log(
        `🏷️ Persona tag added: ${payload.subscriber.email} -> ${payload.tag.name}`
      );
      // Track persona assignment in analytics
    }
  }

  private handleFormSubscribe(payload: ConvertKitWebhookPayload): void {
    console.log(
      `📝 Form subscription: ${payload.subscriber.email} -> ${payload.form?.name}`
    );
    // Track form subscription in analytics
  }

  /**
   * Get service status and statistics
   */
  async getServiceStats(): Promise<{
    isAuthenticated: boolean;
    totalSubscribers: number;
    totalTags: number;
    totalForms: number;
    totalSequences: number;
    personaTags: string[];
  }> {
    const stats = {
      isAuthenticated: this.isAuthenticated,
      totalSubscribers: 0,
      totalTags: 0,
      totalForms: 0,
      totalSequences: 0,
      personaTags: [] as string[],
    };

    if (!this.isAuthenticated) return stats;

    try {
      const [tags, forms, sequences] = await Promise.all([
        this.getAllTags(),
        this.getAllForms(),
        this.getAllSequences(),
      ]);

      stats.totalTags = tags.length;
      stats.totalForms = forms.length;
      stats.totalSequences = sequences.length;
      stats.personaTags = tags
        .filter(tag => tag.name.startsWith('_persona:'))
        .map(tag => tag.name);
    } catch (_error) {
      console._error('Failed to get service stats:', _error);
    }

    return stats;
  }
}

export default ConvertKitService;
