import axios, { AxiosInstance } from 'axios';

const CONVERTKIT_API_BASE = 'https://api.convertkit.com/v3';

export interface ConvertKitSubscriber {
  id: number;
  email: string;
  first_name: string | null;
  created_at: string;
  state: 'active' | 'bounced' | 'unsubscribed' | 'cancelled';
  fields: Record<string, any>;
  tags: Array<{ id: number; name: string }>;
}

export interface ConvertKitForm {
  id: number;
  name: string;
  created_at: string;
  type: string;
  embed_js: string;
  embed_url: string;
  subscribers: number;
}

export interface ConvertKitSequence {
  id: number;
  name: string;
  hold: boolean;
  repeat: boolean;
  created_at: string;
  subscribers: number;
}

export interface ConvertKitTag {
  id: number;
  name: string;
  created_at: string;
  subscribers: number;
}

export interface ConvertKitBroadcast {
  id: number;
  created_at: string;
  subject: string;
  content: string;
  description: string;
  public: boolean;
  published_at: string | null;
  send_at: string | null;
  thumbnail_alt: string | null;
  thumbnail_url: string | null;
  stats: {
    recipients: number;
    open_rate: number;
    click_rate: number;
    unsubscribe_rate: number;
    bounce_rate: number;
    spam_rate: number;
  };
}

export class ConvertKitService {
  private api: AxiosInstance;
  private apiKey: string | null = null;
  private apiSecret: string | null = null;

  constructor(apiKey?: string, apiSecret?: string) {
    this.api = axios.create({
      baseURL: CONVERTKIT_API_BASE,
      timeout: 10000,
    });

    if (apiKey && apiSecret) {
      this.configure(apiKey, apiSecret);
    }
  }

  configure(apiKey: string, apiSecret: string): void {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    
    // Set default params for all requests
    this.api.defaults.params = {
      api_key: this.apiKey
    };
  }

  private ensureConfigured(): void {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('ConvertKit not configured. Please provide API key and secret.');
    }
  }

  async getAccount(): Promise<any> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/account');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ConvertKit account:', error);
      throw error;
    }
  }

  async getSubscribers(page: number = 1): Promise<{ subscribers: ConvertKitSubscriber[]; total_subscribers: number }> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/subscribers', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ConvertKit subscribers:', error);
      throw error;
    }
  }

  async getSubscriberById(id: number): Promise<ConvertKitSubscriber> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get(`/subscribers/${id}`);
      return response.data.subscriber;
    } catch (error) {
      console.error('Failed to fetch subscriber:', error);
      throw error;
    }
  }

  async addSubscriber(email: string, data?: {
    first_name?: string;
    fields?: Record<string, any>;
    tags?: number[];
  }): Promise<ConvertKitSubscriber> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.post('/subscribers', {
        api_secret: this.apiSecret,
        email,
        ...data
      });
      return response.data.subscription;
    } catch (error) {
      console.error('Failed to add subscriber:', error);
      throw error;
    }
  }

  async getForms(): Promise<ConvertKitForm[]> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/forms');
      return response.data.forms;
    } catch (error) {
      console.error('Failed to fetch ConvertKit forms:', error);
      throw error;
    }
  }

  async addSubscriberToForm(formId: number, email: string, data?: {
    first_name?: string;
    fields?: Record<string, any>;
  }): Promise<ConvertKitSubscriber> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.post(`/forms/${formId}/subscribe`, {
        api_key: this.apiKey,
        email,
        ...data
      });
      return response.data.subscription;
    } catch (error) {
      console.error('Failed to subscribe to form:', error);
      throw error;
    }
  }

  async getSequences(): Promise<ConvertKitSequence[]> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/sequences');
      return response.data.courses;
    } catch (error) {
      console.error('Failed to fetch ConvertKit sequences:', error);
      throw error;
    }
  }

  async addSubscriberToSequence(sequenceId: number, email: string): Promise<ConvertKitSubscriber> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.post(`/sequences/${sequenceId}/subscribe`, {
        api_key: this.apiKey,
        email
      });
      return response.data.subscription;
    } catch (error) {
      console.error('Failed to subscribe to sequence:', error);
      throw error;
    }
  }

  async getTags(): Promise<ConvertKitTag[]> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/tags');
      return response.data.tags;
    } catch (error) {
      console.error('Failed to fetch ConvertKit tags:', error);
      throw error;
    }
  }

  async tagSubscriber(tagId: number, email: string): Promise<ConvertKitSubscriber> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.post(`/tags/${tagId}/subscribe`, {
        api_key: this.apiKey,
        email
      });
      return response.data.subscription;
    } catch (error) {
      console.error('Failed to tag subscriber:', error);
      throw error;
    }
  }

  async getBroadcasts(): Promise<ConvertKitBroadcast[]> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/broadcasts');
      return response.data.broadcasts;
    } catch (error) {
      console.error('Failed to fetch ConvertKit broadcasts:', error);
      throw error;
    }
  }

  async createBroadcast(data: {
    subject: string;
    content: string;
    description?: string;
    public?: boolean;
    published_at?: string;
    send_at?: string;
    email_address?: string;
    email_template_id?: string;
  }): Promise<ConvertKitBroadcast> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.post('/broadcasts', {
        api_secret: this.apiSecret,
        ...data
      });
      return response.data.broadcast;
    } catch (error) {
      console.error('Failed to create broadcast:', error);
      throw error;
    }
  }

  async getBroadcastStats(broadcastId: number): Promise<any> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get(`/broadcasts/${broadcastId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch broadcast stats:', error);
      throw error;
    }
  }

  async unsubscribeEmail(email: string): Promise<ConvertKitSubscriber> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.put('/unsubscribe', {
        api_secret: this.apiSecret,
        email
      });
      return response.data.subscriber;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  // Analytics and reporting methods
  async getGrowthStats(timeframe: '1d' | '7d' | '30d' = '30d'): Promise<any> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/reports/growth', {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch growth stats:', error);
      return null; // ConvertKit may not have this endpoint
    }
  }
}

// Default instance for easy use
export const convertKitService = new ConvertKitService();