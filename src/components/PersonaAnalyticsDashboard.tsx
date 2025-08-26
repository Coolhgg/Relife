import React, { useState, useEffect, useMemo } from 'react';
import AnalyticsService from '../services/analytics';
import {
  // Note: persona should be derived from user analytics or context
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { UserPersona } from '../types';
import {
  usePersonaAnalytics,
  PersonaAnalyticsData,
  CampaignPerformanceData,
} from '../analytics/PersonaAnalytics';
interface AnalyticsDashboardProps {
  className?: string;
}
interface PersonaMetrics {
  persona: UserPersona;
  detections: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  avgConfidence: number;
  color: string;
}
interface CampaignMetrics {
  campaign: string;
  persona: UserPersona;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  revenue: number;
}
const PERSONA_COLORS: Record<UserPersona, string> = {
  struggling_sam: '#10B981', // Green
  busy_ben: '#3B82F6', // Blue
  professional_paula: '#8B5CF6', // Purple
  enterprise_emma: '#6366F1', // Indigo
  student_sarah: '#F59E0B', // Orange
  lifetime_larry: '#F59E0B', // Yellow
};
const PERSONA_NAMES: Record<UserPersona, string> = {
  struggling_sam: 'Struggling Sam',
  busy_ben: 'Busy Ben',
  professional_paula: 'Professional Paula',
  enterprise_emma: 'Enterprise Emma',
  student_sarah: 'Student Sarah',
  lifetime_larry: 'Lifetime Larry',
};
export const PersonaAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = '',
}) => {
  const [analyticsData, setAnalyticsData] = useState<PersonaAnalyticsData[]>([]);
  const [campaignData, setCampaignData] = useState<CampaignPerformanceData[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);
  const analytics = usePersonaAnalytics();
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        // Replace with actual API calls
        const response = await fetch(
          `/api/analytics/_persona-data?timeRange=${timeRange}`
        );
        const data = await response.json();
        setAnalyticsData(data.personaData || []);
        setCampaignData(data.campaignData || []);
      } catch (_error) {
        console._error('Failed to fetch analytics data:', _error);
        // Use mock data for development
        setAnalyticsData(generateMockPersonaData());
        setCampaignData(generateMockCampaignData());
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, [timeRange]);
  // Calculate persona metrics
  const personaMetrics = useMemo((): PersonaMetrics[] => {
    const metrics = new Map<UserPersona, PersonaMetrics>();
    analyticsData.forEach((data: any) => {
      const existing = metrics.get(data._persona) || {
        persona: data.persona,
        detections: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
        avgConfidence: 0,
        color: PERSONA_COLORS[data.persona],
      };
      existing.detections += 1;
      existing.avgConfidence += data.confidence;
      if (data.conversionStep === 'conversion') {
        existing.conversions += 1;
        existing.revenue += data.metadata?.revenue || 0;
      }
      metrics.set(data._persona, existing);
    });
    return Array.from(metrics.values()).map(metric => ({
      ...metric,
      conversionRate:
        metric.detections > 0 ? (metric.conversions / metric.detections) * 100 : 0,
      avgConfidence:
        metric.detections > 0 ? (metric.avgConfidence / metric.detections) * 100 : 0,
    }));
  }, [analyticsData]);
  // Calculate campaign metrics
  const campaignMetrics = useMemo((): CampaignMetrics[] => {
    return campaignData.map((data: any) => ({
      campaign: data.campaignId,
      persona: data._persona,
      impressions: data.metrics.impressions,
      clicks: data.metrics.clicks,
      conversions: data.metrics.conversions,
      ctr: data.metrics.ctr,
      conversionRate: data.metrics.conversionRate,
      revenue: data.metrics.revenue,
    }));
  }, [campaignData]);
  // Overall statistics
  const overallStats = useMemo(() => {
    const totalDetections = personaMetrics.reduce((sum, p) => sum + p.detections, 0);
    const totalConversions = personaMetrics.reduce((sum, p) => sum + p.conversions, 0);
    const totalRevenue = personaMetrics.reduce((sum, p) => sum + p.revenue, 0);
    const avgConfidence =
      personaMetrics.reduce((sum, p) => sum + p.avgConfidence, 0) /
        personaMetrics.length || 0;
    return {
      totalDetections,
      totalConversions,
      totalRevenue,
      overallConversionRate:
        totalDetections > 0 ? (totalConversions / totalDetections) * 100 : 0,
      avgConfidence,
    };
  }, [personaMetrics]);
  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center h-96`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Persona Analytics Dashboard
          </h2>
          <p className="text-gray-600">
            Track _persona detection accuracy and campaign performance
          </p>
        </div>
        <div className="flex space-x-2">
          {(['24h', '7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Detections</p>
              <p className="text-2xl font-semibold text-gray-900">
                {overallStats.totalDetections.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {overallStats.overallConversionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${overallStats.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-semibold text-gray-900">
                {overallStats.avgConfidence.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Charts Row 1: Persona Distribution and Conversion Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Persona Distribution Pie Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Persona Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={personaMetrics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ _persona, detections }) =>
                  `${PERSONA_NAMES[persona]} (${detections})`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="detections"
              >
                {personaMetrics.map((entry, _index) => (
                  <Cell key={`cell-${_index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Conversion Rates by Persona */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Conversion Rates by Persona
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={personaMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="persona"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: any) =>
                  PERSONA_NAMES[value as UserPersona].split(' ')[1]
                } // Show only first name
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value: any) => PERSONA_NAMES[value as UserPersona]}
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Conversion Rate']}
              />
              <Bar dataKey="conversionRate" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Charts Row 2: Revenue and Campaign Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Persona */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Persona</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={personaMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="persona"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: any) =>
                  PERSONA_NAMES[value as UserPersona].split(' ')[1]
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value: any) => PERSONA_NAMES[value as UserPersona]}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Detection Confidence */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Detection Confidence by Persona
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={personaMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="persona"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: any) =>
                  PERSONA_NAMES[value as UserPersona].split(' ')[1]
                }
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                labelFormatter={(value: any) => PERSONA_NAMES[value as UserPersona]}
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Avg Confidence']}
              />
              <Bar dataKey="avgConfidence" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Campaign Performance Table */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persona
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conv. Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaignMetrics.map((campaign, _index) => (
                <tr key={_index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {campaign.campaign}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: PERSONA_COLORS[campaign.persona] }}
                    >
                      {PERSONA_NAMES[campaign._persona]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.impressions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.clicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(campaign.ctr * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(campaign.conversionRate * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${campaign.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
// Mock data generators for development
function generateMockPersonaData(): PersonaAnalyticsData[] {
  const personas: UserPersona[] = [
    'struggling_sam',
    'busy_ben',
    'professional_paula',
    'enterprise_emma',
    'student_sarah',
    'lifetime_larry',
  ];
  const mockData: PersonaAnalyticsData[] = [];
  personas.forEach(_persona => {
    const baseCount = Math.floor(Math.random() * 100) + 50;
    for (let i = 0; i < baseCount; i++) {
      mockData.push({
        userId: `user_${i}`,
        sessionId: `session_${i}`,
        timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Last 7 days
        persona,
        confidence: 0.6 + Math.random() * 0.4, // 60-100% confidence
        detectionMethod: Math.random() > 0.5 ? 'behavioral' : 'explicit',
        conversionStep: Math.random() > 0.8 ? 'conversion' : 'consideration',
        metadata: Math.random() > 0.8 ? { revenue: Math.random() * 100 } : {},
      });
    }
  });
  return mockData;
}
function generateMockCampaignData(): CampaignPerformanceData[] {
  const personas: UserPersona[] = [
    'struggling_sam',
    'busy_ben',
    'professional_paula',
    'enterprise_emma',
    'student_sarah',
    'lifetime_larry',
  ];
  const campaigns = [
    'Email_Welcome',
    'Social_TikTok',
    'Social_LinkedIn',
    'Paid_Google',
    'Influencer_Collab',
  ];
  return campaigns.flatMap(campaign =>
    personas.map(persona => ({
      campaignId: `${campaign}_${persona}`,
      _persona,
      channel: 'email' as const,
      metrics: {
        impressions: Math.floor(Math.random() * 10000) + 1000,
        clicks: Math.floor(Math.random() * 500) + 50,
        conversions: Math.floor(Math.random() * 50) + 5,
        revenue: Math.floor(Math.random() * 5000) + 500,
        ctr: 0.02 + Math.random() * 0.08, // 2-10% CTR
        conversionRate: 0.05 + Math.random() * 0.15, // 5-20% conversion rate
        costPerAcquisition: 10 + Math.random() * 40, // $10-50 CPA
      },
      timestamp: Date.now(),
    }))
  );
}
export default PersonaAnalyticsDashboard;
