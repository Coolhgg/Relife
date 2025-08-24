import React, { useState, useEffect, useMemo } from 'react';
import { TimeoutHandle } from '../types/timers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import {
  Users,
  TrendingUp,
  Target,
  DollarSign,
  Clock,
  UserCheck,
  UserX,
  Award,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface PersonaMetrics {
  personaId: string;
  personaName: string;
  count: number;
  conversionRate: number;
  churnRate: number;
  ltv: number;
  avgSessionDuration: number;
  topFeatures: string[];
  revenueContribution: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface PersonaDashboardProps {
  timeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: string) => void;
}

const PersonaFocusDashboard: React.FC<PersonaDashboardProps> = ({
  timeRange,
  onTimeRangeChange,
}) => {
  const [metrics, setMetrics] = useState<PersonaMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<string>('all');

  // Mock data - replace with real analytics data
  const mockPersonaData: PersonaMetrics[] = [
    {
      personaId: 'struggling_sam',
      personaName: 'Struggling Sam',
      count: 15420,
      conversionRate: 0.12,
      churnRate: 0.35,
      ltv: 15.5,
      avgSessionDuration: 180,
      topFeatures: ['basic_alarm', 'free_sounds', 'simple_snooze'],
      revenueContribution: 0.08,
      trend: 'up',
      color: '#ef4444',
    },
    {
      personaId: 'busy_ben',
      personaName: 'Busy Ben',
      count: 8750,
      conversionRate: 0.68,
      churnRate: 0.15,
      ltv: 47.8,
      avgSessionDuration: 240,
      topFeatures: ['custom_sounds', 'multiple_alarms', 'family_mode'],
      revenueContribution: 0.35,
      trend: 'stable',
      color: '#3b82f6',
    },
    {
      personaId: 'professional_paula',
      personaName: 'Professional Paula',
      count: 4200,
      conversionRate: 0.85,
      churnRate: 0.08,
      ltv: 125.3,
      avgSessionDuration: 320,
      topFeatures: ['ai_optimization', 'calendar_sync', 'analytics'],
      revenueContribution: 0.42,
      trend: 'up',
      color: '#10b981',
    },
    {
      personaId: 'enterprise_emma',
      personaName: 'Enterprise Emma',
      count: 950,
      conversionRate: 0.92,
      churnRate: 0.05,
      ltv: 280.5,
      avgSessionDuration: 420,
      topFeatures: ['team_management', 'admin_dashboard', 'bulk_scheduling'],
      revenueContribution: 0.12,
      trend: 'up',
      color: '#8b5cf6',
    },
    {
      personaId: 'student_sarah',
      personaName: 'Student Sarah',
      count: 6800,
      conversionRate: 0.45,
      churnRate: 0.25,
      ltv: 28.9,
      avgSessionDuration: 150,
      topFeatures: ['study_timer', 'class_schedule', 'group_alarms'],
      revenueContribution: 0.08,
      trend: 'down',
      color: '#f59e0b',
    },
    {
      personaId: 'lifetime_larry',
      personaName: 'Lifetime Larry',
      count: 1200,
      conversionRate: 1.0,
      churnRate: 0.02,
      ltv: 450.0,
      avgSessionDuration: 380,
      topFeatures: ['all_premium', 'early_access', 'vip_support'],
      revenueContribution: 0.15,
      trend: 'stable',
      color: '#d97706',
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMetrics(mockPersonaData);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const totalUsers = useMemo(
    () => metrics.reduce((sum, persona) => sum + persona.count, 0),
    [metrics]
  );

  const totalRevenue = useMemo(
    () =>
      metrics.reduce(
        (sum, persona) => sum + persona.ltv * persona.count * persona.conversionRate,
        0
      ),
    [metrics]
  );

  const PersonaCard = ({ persona }: { persona: PersonaMetrics }) => {
    const getTrendIcon = (trend: string) => {
      switch (trend) {
        case 'up':
          return <ArrowUp className="w-4 h-4 text-green-500" />;
        case 'down':
          return <ArrowDown className="w-4 h-4 text-red-500" />;
        default:
          return <div className="w-4 h-4" />;
      }
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{persona.personaName}</h3>
          <div className="flex items-center space-x-2">
            {getTrendIcon(persona.trend)}
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: persona.color }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Users</p>
            <p className="text-xl font-bold text-gray-900">
              {persona.count.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Conversion Rate</p>
            <p className="text-xl font-bold text-gray-900">
              {(persona.conversionRate * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">LTV</p>
            <p className="text-xl font-bold text-gray-900">${persona.ltv.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Revenue Share</p>
            <p className="text-xl font-bold text-gray-900">
              {(persona.revenueContribution * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Top Features</p>
          <div className="flex flex-wrap gap-1">
            {persona.topFeatures.slice(0, 3).map(feature => (
              <span
                key={feature}
                className="px-2 py-1 bg-gray-100 text-xs rounded-md text-gray-700"
              >
                {feature.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Churn Rate</span>
            <span
              className={`text-sm font-medium ${
                persona.churnRate < 0.1
                  ? 'text-green-600'
                  : persona.churnRate < 0.2
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {(persona.churnRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-600">Avg Session</span>
            <span className="text-sm font-medium text-gray-900">
              {Math.floor(persona.avgSessionDuration / 60)}m{' '}
              {persona.avgSessionDuration % 60}s
            </span>
          </div>
        </div>
      </div>
    );
  };

  const ConversionFunnel = () => {
    const funnelData = metrics.map(persona => ({
      name: persona.personaName,
      users: persona.count,
      conversions: Math.round(persona.count * persona.conversionRate),
      conversionRate: persona.conversionRate,
      fill: persona.color,
    }));

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Conversion Funnel by Persona
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip
              formatter={(value, name) => [
                name === 'users'
                  ? `${value.toLocaleString()} users`
                  : `${value.toLocaleString()} conversions`,
                name === 'users' ? 'Total Users' : 'Conversions',
              ]}
            />
            <Bar dataKey="users" fill="#e5e7eb" />
            <Bar dataKey="conversions" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const RevenueDistribution = () => {
    const pieData = metrics.map(persona => ({
      name: persona.personaName,
      value: persona.revenueContribution,
      revenue: persona.ltv * persona.count * persona.conversionRate,
      fill: persona.color,
    }));

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue Distribution by Persona
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${(value * 100).toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={value => [
                `${((value as number) * 100).toFixed(1)}%`,
                'Revenue Share',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Persona Focus Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Real-time analytics for persona-driven user engagement
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={e => onTimeRangeChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalUsers.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Conversion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(
                    (metrics.reduce((sum, p) => sum + p.conversionRate, 0) /
                      metrics.length) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg LTV</p>
                <p className="text-2xl font-bold text-gray-900">
                  $
                  {(
                    metrics.reduce((sum, p) => sum + p.ltv, 0) / metrics.length
                  ).toFixed(0)}
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map(persona => (
            <PersonaCard key={persona.personaId} persona={persona} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnel />
          <RevenueDistribution />
        </div>
      </div>
    </div>
  );
};

export default PersonaFocusDashboard;
