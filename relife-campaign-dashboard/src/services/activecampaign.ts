import axios, { AxiosInstance } from 'axios';

export interface ActiveCampaignContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  orgid: string;
  orgname: string;
  segmentio_id: string;
  bounced_hard: string;
  bounced_soft: string;
  bounced_date: string;
  ip: string;
  ua: string;
  hash: string;
  socialdata_lastcheck: string;
  email_local: string;
  email_domain: string;
  sentcnt: string;
  rating_tstamp: string;
  gravatar: string;
  deleted: string;
  anonymized: string;
  adate: string;
  udate: string;
  edate: string;
  deleted_at: string;
  created_utc_timestamp: string;
  updated_utc_timestamp: string;
}

export interface ActiveCampaignList {
  id: string;
  name: string;
  cdate: string;
  p_use_tracking: string;
  p_use_analytics_read: string;
  p_use_analytics_link: string;
  p_use_twitter: string;
  p_use_facebook: string;
  p_embed_image: string;
  p_use_captcha: string;
  send_last_broadcast: string;
  private: string;
  analytics_domains: string;
  analytics_source: string;
  analytics_ua: string;
  twitter_token: string;
  twitter_token_secret: string;
  facebook_session: string;
  carboncopy: string;
  subscription_notify: string;
  unsubscription_notify: string;
  require_name: string;
  get_unsubscribe_reason: string;
  to_name: string;
  optinoptout: string;
  sender_name: string;
  sender_addr1: string;
  sender_addr2: string;
  sender_city: string;
  sender_state: string;
  sender_zip: string;
  sender_country: string;
  sender_phone: string;
  fulladdress: string;
  optinmessageid: string;
  optoutconf: string;
  deletestamp: string;
  udate: string;
  subscriber_count: number;
}

export interface ActiveCampaignCampaign {
  id: string;
  type: string;
  userid: string;
  segmentid: string;
  bounceid: string;
  realcid: string;
  sendid: string;
  threadid: string;
  seriesid: string;
  formid: string;
  basetemplateid: string;
  basemessageid: string;
  addressid: string;
  source: string;
  name: string;
  cdate: string;
  mdate: string;
  sdate: string;
  ldate: string;
  send_amt: string;
  total_amt: string;
  opens: string;
  uniqueopens: string;
  linkclicks: string;
  uniquelinkclicks: string;
  subscriberclicks: string;
  forwards: string;
  uniqueforwards: string;
  hardbounces: string;
  softbounces: string;
  unsubscribes: string;
  unsubreasons: string;
  updates: string;
  socialshares: string;
  replies: string;
  uniquereplies: string;
  status: string;
  public: string;
  mail_transfer: string;
  mail_send: string;
  mail_cleanup: string;
  mailer_log_file: string;
  tracklinks: string;
  tracklinksanalytics: string;
  trackreads: string;
  trackreadsanalytics: string;
  analytics_campaign_name: string;
  tweet: string;
  facebook: string;
  survey: string;
  embed_images: string;
  htmlunsub: string;
  textunsub: string;
  htmlunsubdata: string;
  textunsubdata: string;
  recurring: string;
  willrecur: string;
  split_type: string;
  split_content: string;
  split_offset: string;
  split_offset_type: string;
  split_winner_messageid: string;
  split_winner_awaiting: string;
  responder_offset: string;
  responder_type: string;
  responder_existing: string;
  reminder_field: string;
  reminder_format: string;
  reminder_type: string;
  reminder_offset: string;
  reminder_offset_type: string;
  reminder_offset_sign: string;
  reminder_last_cron_run: string;
  activerss_interval: string;
  activerss_url: string;
  activerss_items: string;
  ip4: string;
  laststep: string;
  managetext: string;
  schedule: string;
  scheduleddate: string;
  waitpreview: string;
  deletestamp: string;
  replysys: string;
}

export interface ActiveCampaignAutomation {
  id: string;
  name: string;
  cdate: string;
  mdate: string;
  userid: string;
  status: string;
  entered: string;
  exited: string;
}

export class ActiveCampaignService {
  private api: AxiosInstance;
  private apiKey: string | null = null;
  private baseUrl: string | null = null;

  constructor(apiKey?: string, baseUrl?: string) {
    this.api = axios.create({
      timeout: 10000,
    });

    if (apiKey && baseUrl) {
      this.configure(apiKey, baseUrl);
    }
  }

  configure(apiKey: string, baseUrl: string): void {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    this.api.defaults.baseURL = `${this.baseUrl}/api/3`;
    this.api.defaults.headers.common['Api-Token'] = this.apiKey;
    this.api.defaults.headers.common['Content-Type'] = 'application/json';
  }

  private ensureConfigured(): void {
    if (!this.apiKey || !this.baseUrl) {
      throw new Error('ActiveCampaign not configured. Please provide API key and base URL.');
    }
  }

  async testConnection(): Promise<boolean> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/contacts', { params: { limit: 1 } });
      return response.status === 200;
    } catch (error) {
      console.error('ActiveCampaign connection test failed:', error);
      return false;
    }
  }

  async getContacts(params?: {
    limit?: number;
    offset?: number;
    email?: string;
    search?: string;
  }): Promise<{ contacts: ActiveCampaignContact[]; meta: any }> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/contacts', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ActiveCampaign contacts:', error);
      throw error;
    }
  }

  async getContact(id: string): Promise<ActiveCampaignContact> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get(`/contacts/${id}`);
      return response.data.contact;
    } catch (error) {
      console.error('Failed to fetch contact:', error);
      throw error;
    }
  }

  async createContact(contact: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    fieldValues?: Array<{ field: string; value: string }>;
  }): Promise<ActiveCampaignContact> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.post('/contacts', { contact });
      return response.data.contact;
    } catch (error) {
      console.error('Failed to create contact:', error);
      throw error;
    }
  }

  async updateContact(id: string, contact: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    fieldValues?: Array<{ field: string; value: string }>;
  }): Promise<ActiveCampaignContact> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.put(`/contacts/${id}`, { contact });
      return response.data.contact;
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  }

  async deleteContact(id: string): Promise<void> {
    this.ensureConfigured();
    
    try {
      await this.api.delete(`/contacts/${id}`);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  }

  async getLists(): Promise<ActiveCampaignList[]> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/lists');
      return response.data.lists;
    } catch (error) {
      console.error('Failed to fetch ActiveCampaign lists:', error);
      throw error;
    }
  }

  async subscribeContactToList(contactId: string, listId: string): Promise<any> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.post('/contactLists', {
        contactList: {
          list: listId,
          contact: contactId,
          status: 1
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to subscribe contact to list:', error);
      throw error;
    }
  }

  async getCampaigns(): Promise<ActiveCampaignCampaign[]> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/campaigns');
      return response.data.campaigns;
    } catch (error) {
      console.error('Failed to fetch ActiveCampaign campaigns:', error);
      throw error;
    }
  }

  async getAutomations(): Promise<ActiveCampaignAutomation[]> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/automations');
      return response.data.automations;
    } catch (error) {
      console.error('Failed to fetch ActiveCampaign automations:', error);
      throw error;
    }
  }

  async addContactToAutomation(contactId: string, automationId: string): Promise<any> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.post('/contactAutomations', {
        contactAutomation: {
          contact: contactId,
          automation: automationId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to add contact to automation:', error);
      throw error;
    }
  }

  async getTags(): Promise<any[]> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/tags');
      return response.data.tags;
    } catch (error) {
      console.error('Failed to fetch ActiveCampaign tags:', error);
      throw error;
    }
  }

  async addTagToContact(contactId: string, tagId: string): Promise<any> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.post('/contactTags', {
        contactTag: {
          contact: contactId,
          tag: tagId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to add tag to contact:', error);
      throw error;
    }
  }

  async getCustomFields(): Promise<any[]> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get('/fields');
      return response.data.fields;
    } catch (error) {
      console.error('Failed to fetch custom fields:', error);
      throw error;
    }
  }

  // Analytics methods
  async getCampaignStats(campaignId: string): Promise<any> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get(`/campaigns/${campaignId}`);
      const campaign = response.data.campaign;
      
      return {
        sends: parseInt(campaign.send_amt),
        opens: parseInt(campaign.opens),
        unique_opens: parseInt(campaign.uniqueopens),
        clicks: parseInt(campaign.linkclicks),
        unique_clicks: parseInt(campaign.uniquelinkclicks),
        unsubscribes: parseInt(campaign.unsubscribes),
        bounces: parseInt(campaign.hardbounces) + parseInt(campaign.softbounces),
        open_rate: campaign.send_amt > 0 ? (parseInt(campaign.uniqueopens) / parseInt(campaign.send_amt)) * 100 : 0,
        click_rate: campaign.send_amt > 0 ? (parseInt(campaign.uniquelinkclicks) / parseInt(campaign.send_amt)) * 100 : 0,
      };
    } catch (error) {
      console.error('Failed to fetch campaign stats:', error);
      throw error;
    }
  }

  async getAutomationStats(automationId: string): Promise<any> {
    this.ensureConfigured();
    
    try {
      const response = await this.api.get(`/automations/${automationId}`);
      return response.data.automation;
    } catch (error) {
      console.error('Failed to fetch automation stats:', error);
      throw error;
    }
  }
}

// Default instance for easy use
export const activeCampaignService = new ActiveCampaignService();