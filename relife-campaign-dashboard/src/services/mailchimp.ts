import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpMergeFields } from '../../../src/types/api-responses';

// Mailchimp API Configuration
const configureMailchimp = (_apiKey: string) => {
  mailchimp.setConfig({
    apiKey: apiKey,
    server: apiKey.split('-')[1], // Extract server from API key
  });
};

export interface MailchimpAudience {
  id: string;
  name: string;
  member_count: number;
  date_created: string;
}

export interface MailchimpCampaign {
  id: string;
  web_id: number;
  type: string;
  create_time: string;
  archive_url: string;
  long_archive_url: string;
  status: string;
  emails_sent: number;
  send_time: string;
  content_type: string;
  recipients: {
    list_id: string;
    list_name: string;
    recipient_count: number;
  };
  settings: {
    subject_line: string;
    title: string;
    from_name: string;
    reply_to: string;
  };
  report_summary?: {
    opens: number;
    unique_opens: number;
    open_rate: number;
    clicks: number;
    subscriber_clicks: number;
    click_rate: number;
  };
}

export interface MailchimpStats {
  opens: number;
  clicks: number;
  open_rate: number;
  click_rate: number;
  unsubscribes: number;
  bounce_rate: number;
}

export class MailchimpService {
  private isConfigured = false;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.configure(apiKey);
    }
  }

  configure(apiKey: string): void {
    try {
      configureMailchimp(apiKey);
      this.isConfigured = true;
    } catch (error) {
      console.error('Failed to configure Mailchimp:', error);
      throw new Error('Invalid Mailchimp API key');
    }
  }

  async ping(): Promise<boolean> {
    try {
      const response = await mailchimp.ping.get();
      return response.health_status === "Everything's Chimpy!";
    } catch (error) {
      console.error('Mailchimp ping failed:', error);
      return false;
    }
  }

  async getAudiences(): Promise<MailchimpAudience[]> {
    if (!this.isConfigured) {
      throw new Error('Mailchimp not configured');
    }

    try {
      const response = await mailchimp.lists.getAllLists();
      return response.lists.map(_(list: any) => ({
        id: list.id,
        name: list.name,
        member_count: list.stats.member_count,
        date_created: list.date_created,
      }));
    } catch (error) {
      console.error('Failed to fetch Mailchimp audiences:', error);
      throw error;
    }
  }

  async getCampaigns(count: number = 10): Promise<MailchimpCampaign[]> {
    if (!this.isConfigured) {
      throw new Error('Mailchimp not configured');
    }

    try {
      const response = await mailchimp.campaigns.list({ count });
      return response.campaigns;
    } catch (error) {
      console.error('Failed to fetch Mailchimp campaigns:', error);
      throw error;
    }
  }

  async getCampaignStats(campaignId: string): Promise<MailchimpStats> {
    if (!this.isConfigured) {
      throw new Error('Mailchimp not configured');
    }

    try {
      const response = await mailchimp.reports.getCampaignReport(campaignId);
      return {
        opens: response.opens.opens_total,
        clicks: response.clicks.clicks_total,
        open_rate: response.opens.open_rate,
        click_rate: response.clicks.click_rate,
        unsubscribes: response.unsubscribed.unsubscribes,
        bounce_rate: response.bounces.bounce_rate,
      };
    } catch (error) {
      console.error('Failed to fetch campaign stats:', error);
      throw error;
    }
  }

  async createCampaign(data: {
    type: string;
    recipients: { list_id: string };
    settings: {
      subject_line: string;
      title: string;
      from_name: string;
      reply_to: string;
    };
  }): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Mailchimp not configured');
    }

    try {
      const response = await mailchimp.campaigns.create(data);
      return response.id;
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error;
    }
  }

  async setCampaignContent(
    campaignId: string,
    content: { html: string }
  ): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Mailchimp not configured');
    }

    try {
      await mailchimp.campaigns.setContent(campaignId, content);
    } catch (error) {
      console.error('Failed to set campaign content:', error);
      throw error;
    }
  }

  async sendCampaign(campaignId: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Mailchimp not configured');
    }

    try {
      await mailchimp.campaigns.send(campaignId);
    } catch (error) {
      console.error('Failed to send campaign:', error);
      throw error;
    }
  }

  async addSubscriber(
    listId: string,
    subscriber: {
      email_address: string;
      status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending';
      merge_fields?: MailchimpMergeFields;
      tags?: string[];
    }
  ): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Mailchimp not configured');
    }

    try {
      await mailchimp.lists.addListMember(listId, subscriber);
    } catch (error) {
      console.error('Failed to add subscriber:', error);
      throw error;
    }
  }

  async segmentAudience(listId: string, conditions: any[]): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Mailchimp not configured');
    }

    try {
      const response = await mailchimp.lists.createSegment(listId, {
        name: `Segment_${Date.now()}`,
        options: {
          match: 'all',
          conditions,
        },
      });
      return response.id;
    } catch (error) {
      console.error('Failed to create segment:', error);
      throw error;
    }
  }
}

// Default instance for easy use
export const mailchimpService = new MailchimpService();
