import { mailchimpService, MailchimpService } from './mailchimp';
import { convertKitService, ConvertKitService } from './convertkit';
import { activeCampaignService, ActiveCampaignService } from './activecampaign';
import { aiService, AIService } from './ai';

export interface EmailPlatformStatus {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  lastSync?: string;
  activeCampaigns?: number;
  totalSubscribers?: number;
  error?: string;
}

export interface CampaignMetrics {
  total_sent: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  revenue: number;
  unsubscribe_rate: number;
  bounce_rate: number;
}

export interface UnifiedCampaign {
  id: string;
  platform: 'mailchimp' | 'convertkit' | 'activecampaign';
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'active';
  created_at: string;
  sent_at?: string;
  recipients: number;
  opens: number;
  clicks: number;
  conversions?: number;
  open_rate: number;
  click_rate: number;
  conversion_rate?: number;
}

class EmailPlatformManager {
  private platforms = {
    mailchimp: mailchimpService,
    convertkit: convertKitService,
    activecampaign: activeCampaignService
  };

  private ai = aiService;

  constructor() {
    this.initializePlatforms();
  }

  private initializePlatforms(): void {
    // Initialize platforms with environment variables if available
    if (import.meta.env.VITE_MAILCHIMP_API_KEY) {
      try {
        this.platforms.mailchimp.configure(import.meta.env.VITE_MAILCHIMP_API_KEY);
      } catch (error) {
        console.error('Failed to configure Mailchimp:', error);
      }
    }

    if (import.meta.env.VITE_CONVERTKIT_API_KEY && import.meta.env.VITE_CONVERTKIT_API_SECRET) {
      try {
        this.platforms.convertkit.configure(
          import.meta.env.VITE_CONVERTKIT_API_KEY,
          import.meta.env.VITE_CONVERTKIT_API_SECRET
        );
      } catch (error) {
        console.error('Failed to configure ConvertKit:', error);
      }
    }

    if (import.meta.env.VITE_ACTIVECAMPAIGN_API_KEY && import.meta.env.VITE_ACTIVECAMPAIGN_BASE_URL) {
      try {
        this.platforms.activecampaign.configure(
          import.meta.env.VITE_ACTIVECAMPAIGN_API_KEY,
          import.meta.env.VITE_ACTIVECAMPAIGN_BASE_URL
        );
      } catch (error) {
        console.error('Failed to configure ActiveCampaign:', error);
      }
    }

    if (import.meta.env.VITE_OPENAI_API_KEY) {
      try {
        this.ai.configure(import.meta.env.VITE_OPENAI_API_KEY);
      } catch (error) {
        console.error('Failed to configure AI service:', error);
      }
    }
  }

  async getPlatformStatus(): Promise<EmailPlatformStatus[]> {
    const statuses: EmailPlatformStatus[] = [];

    // Test Mailchimp connection
    try {
      const mailchimpConnected = await this.platforms.mailchimp.ping();
      const audiences = mailchimpConnected ? await this.platforms.mailchimp.getAudiences() : [];
      const campaigns = mailchimpConnected ? await this.platforms.mailchimp.getCampaigns(10) : [];

      statuses.push({
        id: 'mailchimp',
        name: 'Mailchimp',
        status: mailchimpConnected ? 'connected' : 'disconnected',
        lastSync: mailchimpConnected ? new Date().toISOString() : undefined,
        activeCampaigns: campaigns.filter(c => c.status === 'sent').length,
        totalSubscribers: audiences.reduce((sum, a) => sum + a.member_count, 0)
      });
    } catch (error) {
      statuses.push({
        id: 'mailchimp',
        name: 'Mailchimp',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test ConvertKit connection
    try {
      const account = await this.platforms.convertkit.getAccount();
      const subscribers = await this.platforms.convertkit.getSubscribers(1);
      const broadcasts = await this.platforms.convertkit.getBroadcasts();

      statuses.push({
        id: 'convertkit',
        name: 'ConvertKit',
        status: account ? 'connected' : 'disconnected',
        lastSync: account ? new Date().toISOString() : undefined,
        activeCampaigns: broadcasts.length,
        totalSubscribers: subscribers.total_subscribers || 0
      });
    } catch (error) {
      statuses.push({
        id: 'convertkit',
        name: 'ConvertKit',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test ActiveCampaign connection
    try {
      const acConnected = await this.platforms.activecampaign.testConnection();
      const contacts = acConnected ? await this.platforms.activecampaign.getContacts({ limit: 1 }) : null;
      const campaigns = acConnected ? await this.platforms.activecampaign.getCampaigns() : [];

      statuses.push({
        id: 'activecampaign',
        name: 'ActiveCampaign',
        status: acConnected ? 'connected' : 'disconnected',
        lastSync: acConnected ? new Date().toISOString() : undefined,
        activeCampaigns: campaigns.filter(c => c.status === '1').length,
        totalSubscribers: contacts?.meta?.total || 0
      });
    } catch (error) {
      statuses.push({
        id: 'activecampaign',
        name: 'ActiveCampaign',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return statuses;
  }

  async getUnifiedCampaigns(): Promise<UnifiedCampaign[]> {
    const campaigns: UnifiedCampaign[] = [];

    try {
      // Get Mailchimp campaigns
      const mailchimpCampaigns = await this.platforms.mailchimp.getCampaigns(20);
      for (const campaign of mailchimpCampaigns) {
        campaigns.push({
          id: `mc_${campaign.id}`,
          platform: 'mailchimp',
          name: campaign.settings.title || campaign.settings.subject_line,
          subject: campaign.settings.subject_line,
          status: campaign.status === 'sent' ? 'sent' : campaign.status as any,
          created_at: campaign.create_time,
          sent_at: campaign.send_time,
          recipients: campaign.emails_sent,
          opens: campaign.report_summary?.unique_opens || 0,
          clicks: campaign.report_summary?.subscriber_clicks || 0,
          open_rate: (campaign.report_summary?.open_rate || 0) * 100,
          click_rate: (campaign.report_summary?.click_rate || 0) * 100
        });
      }
    } catch (error) {
      console.error('Failed to fetch Mailchimp campaigns:', error);
    }

    try {
      // Get ConvertKit broadcasts
      const convertKitBroadcasts = await this.platforms.convertkit.getBroadcasts();
      for (const broadcast of convertKitBroadcasts) {
        campaigns.push({
          id: `ck_${broadcast.id}`,
          platform: 'convertkit',
          name: broadcast.subject,
          subject: broadcast.subject,
          status: broadcast.published_at ? 'sent' : 'draft',
          created_at: broadcast.created_at,
          sent_at: broadcast.published_at ?? undefined,
          recipients: broadcast.stats.recipients,
          opens: Math.round(broadcast.stats.recipients * (broadcast.stats.open_rate / 100)),
          clicks: Math.round(broadcast.stats.recipients * (broadcast.stats.click_rate / 100)),
          open_rate: broadcast.stats.open_rate,
          click_rate: broadcast.stats.click_rate
        });
      }
    } catch (error) {
      console.error('Failed to fetch ConvertKit broadcasts:', error);
    }

    try {
      // Get ActiveCampaign campaigns
      const acCampaigns = await this.platforms.activecampaign.getCampaigns();
      for (const campaign of acCampaigns.slice(0, 10)) {
        const sent = parseInt(campaign.send_amt) || 0;
        const opens = parseInt(campaign.uniqueopens) || 0;
        const clicks = parseInt(campaign.uniquelinkclicks) || 0;

        campaigns.push({
          id: `ac_${campaign.id}`,
          platform: 'activecampaign',
          name: campaign.name,
          subject: campaign.name,
          status: campaign.status === '1' ? 'sent' : 'draft',
          created_at: campaign.cdate,
          sent_at: campaign.sdate !== '0000-00-00 00:00:00' ? campaign.sdate : undefined,
          recipients: sent,
          opens,
          clicks,
          open_rate: sent > 0 ? (opens / sent) * 100 : 0,
          click_rate: sent > 0 ? (clicks / sent) * 100 : 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch ActiveCampaign campaigns:', error);
    }

    return campaigns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getAggregatedMetrics(): Promise<CampaignMetrics> {
    const campaigns = await this.getUnifiedCampaigns();
    const sentCampaigns = campaigns.filter(c => c.status === 'sent');

    if (sentCampaigns.length === 0) {
      return {
        total_sent: 0,
        open_rate: 0,
        click_rate: 0,
        conversion_rate: 0,
        revenue: 0,
        unsubscribe_rate: 0,
        bounce_rate: 0
      };
    }

    const totalSent = sentCampaigns.reduce((sum, c) => sum + c.recipients, 0);
    const totalOpens = sentCampaigns.reduce((sum, c) => sum + c.opens, 0);
    const totalClicks = sentCampaigns.reduce((sum, c) => sum + c.clicks, 0);

    return {
      total_sent: totalSent,
      open_rate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
      click_rate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
      conversion_rate: 2.1, // This would need to be calculated from actual conversion tracking
      revenue: totalClicks * 50, // Estimated revenue per click
      unsubscribe_rate: 0.5,
      bounce_rate: 2.3
    };
  }

  // Platform-specific methods
  getMailchimpService(): MailchimpService {
    return this.platforms.mailchimp;
  }

  getConvertKitService(): ConvertKitService {
    return this.platforms.convertkit;
  }

  getActiveCampaignService(): ActiveCampaignService {
    return this.platforms.activecampaign;
  }

  getAIService(): AIService {
    return this.ai;
  }

  // Mock data fallback for when platforms aren't configured
  getMockMetrics(): CampaignMetrics {
    return {
      total_sent: 45782,
      open_rate: 34.2,
      click_rate: 8.7,
      conversion_rate: 21.4,
      revenue: 127500,
      unsubscribe_rate: 0.8,
      bounce_rate: 2.1
    };
  }

  getMockPlatformStatus(): EmailPlatformStatus[] {
    return [
      {
        id: 'convertkit',
        name: 'ConvertKit',
        status: 'connected',
        lastSync: new Date().toISOString(),
        activeCampaigns: 24,
        totalSubscribers: 5432
      },
      {
        id: 'mailchimp',
        name: 'Mailchimp',
        status: 'pending',
        activeCampaigns: 0,
        totalSubscribers: 0
      },
      {
        id: 'activecampaign',
        name: 'ActiveCampaign',
        status: 'disconnected',
        activeCampaigns: 0,
        totalSubscribers: 0
      }
    ];
  }
}

// Default instance for easy use
export const emailPlatformManager = new EmailPlatformManager();

// Export services individually
export { mailchimpService, convertKitService, activeCampaignService, aiService };