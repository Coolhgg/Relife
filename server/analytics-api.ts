import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Types
interface AnalyticsEvent {
  event: string;
  data: {
    userId?: string;
    sessionId: string;
    timestamp: number;
    persona: string;
    confidence: number;
    detectionMethod: string;
    conversionStep?: string;
    campaignSource?: string;
    metadata?: Record<string, any>;
  };
}

interface CampaignPerformanceData {
  campaignId: string;
  persona: string;
  channel: string;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    conversionRate: number;
    costPerAcquisition: number;
  };
  timestamp: number;
}

// Analytics middleware for request logging
export const analyticsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`[Analytics] ${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`);
  });
  
  next();
};

// POST /api/analytics/persona-events
export const collectPersonaEvents = async (req: Request, res: Response) => {
  try {
    const { events, sessionId, userId, timestamp } = req.body;
    
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid events array',
        code: 'INVALID_EVENTS'
      });
    }

    // Validate and prepare events for database insertion
    const validatedEvents = events.map((eventData: AnalyticsEvent) => {
      const { event, data } = eventData;
      
      return {
        user_id: data.userId || null,
        session_id: data.sessionId,
        event_type: event,
        persona: data.persona,
        confidence: data.confidence,
        detection_method: data.detectionMethod,
        conversion_step: data.conversionStep || null,
        campaign_source: data.campaignSource || null,
        metadata: data.metadata || {},
        created_at: new Date(data.timestamp).toISOString()
      };
    });

    // Insert into analytics events table
    const { data: insertedData, error } = await supabase
      .from('persona_analytics_events')
      .insert(validatedEvents);

    if (error) {
      console.error('[Analytics] Database insertion error:', error);
      return res.status(500).json({ 
        error: 'Failed to save analytics events',
        code: 'DATABASE_ERROR'
      });
    }

    // Update campaign performance metrics if needed
    await updateCampaignMetrics(events);

    console.log(`[Analytics] Successfully saved ${events.length} events for session ${sessionId}`);
    
    res.status(200).json({
      success: true,
      eventsProcessed: events.length,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('[Analytics] Error processing persona events:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// GET /api/analytics/persona-data
export const getPersonaAnalyticsData = async (req: Request, res: Response) => {
  try {
    const { timeRange = '7d', persona, userId } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Build query
    let query = supabase
      .from('persona_analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (persona) {
      query = query.eq('persona', persona);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: personaData, error: personaError } = await query;

    if (personaError) {
      console.error('[Analytics] Error fetching persona data:', personaError);
      return res.status(500).json({ 
        error: 'Failed to fetch persona data',
        code: 'DATABASE_ERROR'
      });
    }

    // Fetch campaign performance data
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaign_performance')
      .select('*')
      .gte('updated_at', startDate.toISOString())
      .order('updated_at', { ascending: false });

    if (campaignError) {
      console.error('[Analytics] Error fetching campaign data:', campaignError);
      return res.status(500).json({ 
        error: 'Failed to fetch campaign data',
        code: 'DATABASE_ERROR'
      });
    }

    // Calculate summary statistics
    const summaryStats = calculateSummaryStats(personaData || []);

    res.status(200).json({
      personaData: personaData || [],
      campaignData: campaignData || [],
      summaryStats,
      timeRange,
      totalEvents: personaData?.length || 0,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('[Analytics] Error fetching analytics data:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// POST /api/analytics/campaign-performance
export const updateCampaignPerformance = async (req: Request, res: Response) => {
  try {
    const { campaignId, persona, channel, metrics } = req.body;
    
    if (!campaignId || !persona || !channel || !metrics) {
      return res.status(400).json({ 
        error: 'Missing required campaign performance data',
        code: 'INVALID_DATA'
      });
    }

    // Upsert campaign performance data
    const campaignPerformanceData = {
      campaign_id: campaignId,
      persona,
      channel,
      impressions: metrics.impressions || 0,
      clicks: metrics.clicks || 0,
      conversions: metrics.conversions || 0,
      revenue: metrics.revenue || 0,
      ctr: metrics.ctr || 0,
      conversion_rate: metrics.conversionRate || 0,
      cost_per_acquisition: metrics.costPerAcquisition || 0,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('campaign_performance')
      .upsert(campaignPerformanceData, {
        onConflict: 'campaign_id,persona'
      });

    if (error) {
      console.error('[Analytics] Error updating campaign performance:', error);
      return res.status(500).json({ 
        error: 'Failed to update campaign performance',
        code: 'DATABASE_ERROR'
      });
    }

    console.log(`[Analytics] Updated campaign performance for ${campaignId} - ${persona}`);

    res.status(200).json({
      success: true,
      campaignId,
      persona,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('[Analytics] Error updating campaign performance:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// GET /api/analytics/reports
export const generateAnalyticsReport = async (req: Request, res: Response) => {
  try {
    const { 
      timeRange = '30d', 
      format = 'json',
      includePersonas = 'all',
      includeCampaigns = true 
    } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Fetch comprehensive analytics data
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('persona_analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (analyticsError) {
      console.error('[Analytics] Error generating report:', analyticsError);
      return res.status(500).json({ 
        error: 'Failed to generate analytics report',
        code: 'DATABASE_ERROR'
      });
    }

    // Fetch campaign data if requested
    let campaignData = null;
    if (includeCampaigns) {
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaign_performance')
        .select('*')
        .gte('updated_at', startDate.toISOString());

      if (!campaignError) {
        campaignData = campaigns;
      }
    }

    // Generate comprehensive report
    const report = generateComprehensiveReport(analyticsData || [], campaignData || [], {
      timeRange: timeRange as string,
      startDate,
      endDate,
      includePersonas: includePersonas as string
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${timeRange}.csv"`);
      return res.send(generateCSVReport(report));
    }

    res.status(200).json(report);

  } catch (error) {
    console.error('[Analytics] Error generating analytics report:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Helper Functions
async function updateCampaignMetrics(events: AnalyticsEvent[]) {
  // Extract campaign-related events and update metrics
  const campaignEvents = events.filter(e => 
    e.data.campaignSource && 
    ['persona_cta_clicked', 'persona_subscription_converted', 'persona_marketing_email_clicked'].includes(e.event)
  );

  for (const event of campaignEvents) {
    try {
      const { data } = event;
      const campaignId = `${data.campaignSource}_${data.persona}`;
      
      // Increment appropriate metrics based on event type
      let updateData: any = {};
      
      switch (event.event) {
        case 'persona_cta_clicked':
        case 'persona_marketing_email_clicked':
          updateData = { clicks: 1 };
          break;
        case 'persona_subscription_converted':
          updateData = { 
            conversions: 1,
            revenue: data.metadata?.revenue || 0
          };
          break;
      }

      if (Object.keys(updateData).length > 0) {
        // This would need proper upsert logic with increment operations
        console.log(`[Analytics] Would update campaign ${campaignId} with:`, updateData);
      }
    } catch (error) {
      console.error('[Analytics] Error updating campaign metrics for event:', error);
    }
  }
}

function calculateSummaryStats(events: any[]) {
  const totalEvents = events.length;
  const uniquePersonas = new Set(events.map(e => e.persona)).size;
  const totalConversions = events.filter(e => e.conversion_step === 'conversion').length;
  const avgConfidence = events.length > 0 
    ? events.reduce((sum, e) => sum + (e.confidence || 0), 0) / events.length 
    : 0;

  const personaBreakdown = events.reduce((acc, event) => {
    if (!acc[event.persona]) {
      acc[event.persona] = { count: 0, conversions: 0 };
    }
    acc[event.persona].count++;
    if (event.conversion_step === 'conversion') {
      acc[event.persona].conversions++;
    }
    return acc;
  }, {} as Record<string, { count: number; conversions: number }>);

  return {
    totalEvents,
    uniquePersonas,
    totalConversions,
    conversionRate: totalEvents > 0 ? (totalConversions / totalEvents) * 100 : 0,
    avgConfidence: avgConfidence * 100,
    personaBreakdown
  };
}

function generateComprehensiveReport(analyticsData: any[], campaignData: any[], options: any) {
  const { timeRange, startDate, endDate } = options;
  
  return {
    reportMetadata: {
      generatedAt: new Date().toISOString(),
      timeRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalEvents: analyticsData.length,
      totalCampaigns: campaignData.length
    },
    personaMetrics: calculatePersonaMetrics(analyticsData),
    campaignMetrics: calculateCampaignMetrics(campaignData),
    conversionFunnel: calculateConversionFunnel(analyticsData),
    topPerformingCampaigns: getTopPerformingCampaigns(campaignData),
    recommendations: generateRecommendations(analyticsData, campaignData)
  };
}

function calculatePersonaMetrics(events: any[]) {
  const personas = [...new Set(events.map(e => e.persona))];
  
  return personas.map(persona => {
    const personaEvents = events.filter(e => e.persona === persona);
    const conversions = personaEvents.filter(e => e.conversion_step === 'conversion');
    const revenue = conversions.reduce((sum, e) => sum + (e.metadata?.revenue || 0), 0);
    
    return {
      persona,
      totalEvents: personaEvents.length,
      conversions: conversions.length,
      conversionRate: personaEvents.length > 0 ? (conversions.length / personaEvents.length) * 100 : 0,
      revenue,
      avgConfidence: personaEvents.length > 0 
        ? (personaEvents.reduce((sum, e) => sum + (e.confidence || 0), 0) / personaEvents.length) * 100
        : 0
    };
  });
}

function calculateCampaignMetrics(campaigns: any[]) {
  return campaigns.map(campaign => ({
    campaignId: campaign.campaign_id,
    persona: campaign.persona,
    channel: campaign.channel,
    performance: {
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      revenue: campaign.revenue,
      ctr: (campaign.ctr * 100).toFixed(2) + '%',
      conversionRate: (campaign.conversion_rate * 100).toFixed(2) + '%',
      costPerAcquisition: `$${campaign.cost_per_acquisition}`
    }
  }));
}

function calculateConversionFunnel(events: any[]) {
  const funnelSteps = ['awareness', 'consideration', 'trial', 'conversion'];
  
  return funnelSteps.map(step => ({
    step,
    count: events.filter(e => e.conversion_step === step).length,
    percentage: events.length > 0 
      ? (events.filter(e => e.conversion_step === step).length / events.length) * 100 
      : 0
  }));
}

function getTopPerformingCampaigns(campaigns: any[]) {
  return campaigns
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 10)
    .map(campaign => ({
      campaignId: campaign.campaign_id,
      persona: campaign.persona,
      revenue: campaign.revenue,
      conversionRate: (campaign.conversion_rate * 100).toFixed(2) + '%',
      roas: campaign.revenue > 0 && campaign.cost_per_acquisition > 0 
        ? (campaign.revenue / (campaign.conversions * campaign.cost_per_acquisition)).toFixed(2)
        : 'N/A'
    }));
}

function generateRecommendations(analyticsData: any[], campaignData: any[]) {
  const recommendations = [];
  
  // Analyze persona performance
  const personaMetrics = calculatePersonaMetrics(analyticsData);
  const lowPerformingPersonas = personaMetrics.filter(p => p.conversionRate < 10);
  
  if (lowPerformingPersonas.length > 0) {
    recommendations.push({
      type: 'persona_optimization',
      priority: 'high',
      title: 'Optimize Low-Converting Personas',
      description: `Personas with conversion rates below 10%: ${lowPerformingPersonas.map(p => p.persona).join(', ')}`,
      actionItems: [
        'Review persona messaging and CTAs',
        'A/B test different onboarding flows',
        'Analyze user feedback for these personas'
      ]
    });
  }

  // Analyze campaign performance
  const lowPerformingCampaigns = campaignData.filter(c => c.conversion_rate < 0.05);
  
  if (lowPerformingCampaigns.length > 0) {
    recommendations.push({
      type: 'campaign_optimization',
      priority: 'medium',
      title: 'Improve Underperforming Campaigns',
      description: `${lowPerformingCampaigns.length} campaigns with conversion rates below 5%`,
      actionItems: [
        'Review campaign targeting and messaging',
        'Test different creative assets',
        'Consider budget reallocation'
      ]
    });
  }

  return recommendations;
}

function generateCSVReport(report: any) {
  // Simple CSV generation for persona metrics
  const headers = ['Persona', 'Total Events', 'Conversions', 'Conversion Rate', 'Revenue', 'Avg Confidence'];
  const rows = report.personaMetrics.map((persona: any) => [
    persona.persona,
    persona.totalEvents,
    persona.conversions,
    persona.conversionRate.toFixed(2) + '%',
    '$' + persona.revenue.toFixed(2),
    persona.avgConfidence.toFixed(1) + '%'
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
    
  return csvContent;
}

// Export API route handlers
export const analyticsRoutes = {
  collectPersonaEvents,
  getPersonaAnalyticsData,
  updateCampaignPerformance,
  generateAnalyticsReport,
  analyticsMiddleware
};