/**
 * Translation Quality Dashboard Component
 *
 * Interactive dashboard for monitoring translation quality, cultural adaptation,
 * and consistency across all supported languages.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

// Types
interface QualityScore {
  overall: number;
  completeness: number;
  consistency: number;
  culturalAdaptation: number;
  technicalAccuracy: number;
  readability: number;
}

interface LanguageData {
  language: string;
  qualityScore: QualityScore;
  culturalIssues: number;
  consistencyIssues: number;
  recommendations: string[];
  lastUpdated: string;
}

interface DashboardStats {
  totalLanguages: number;
  averageQualityScore: number;
  totalIssues: number;
  languagesNeedingAttention: string[];
}

// Color schemes
const QUALITY_COLORS = {
  excellent: '#4caf50',
  good: '#8bc34a',
  acceptable: '#ff9800',
  poor: '#f44336',
};

const CHART_COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

export const TranslationDashboard: React.FC = () => {
  const [data, setData] = useState<LanguageData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'languages' | 'issues' | 'trends'
  >('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from an API
      const response = await fetch('/api/translation-quality');
      const dashboardData = await response.json();

      setData(dashboardData.results || []);
      setStats(dashboardData.summary || null);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to mock data
      setData(generateMockData());
      setStats(generateMockStats());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): LanguageData[] => [
    {
      language: 'es',
      qualityScore: {
        overall: 95,
        completeness: 100,
        consistency: 92,
        culturalAdaptation: 88,
        technicalAccuracy: 98,
        readability: 90,
      },
      culturalIssues: 2,
      consistencyIssues: 1,
      recommendations: ['Improve cultural adaptation in gaming terminology'],
      lastUpdated: '2024-01-15',
    },
    {
      language: 'fr',
      qualityScore: {
        overall: 88,
        completeness: 95,
        consistency: 85,
        culturalAdaptation: 82,
        technicalAccuracy: 92,
        readability: 86,
      },
      culturalIssues: 4,
      consistencyIssues: 3,
      recommendations: [
        'Standardize alarm terminology',
        'Review formal language usage',
      ],
      lastUpdated: '2024-01-14',
    },
    // Add more mock data as needed
  ];

  const generateMockStats = (): DashboardStats => ({
    totalLanguages: 22,
    averageQualityScore: 91,
    totalIssues: 15,
    languagesNeedingAttention: ['ar', 'hi', 'th'],
  });

  const getQualityColor = (score: number): string => {
    if (score >= 90) return QUALITY_COLORS.excellent;
    if (score >= 80) return QUALITY_COLORS.good;
    if (score >= 70) return QUALITY_COLORS.acceptable;
    return QUALITY_COLORS.poor;
  };

  const getQualityLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Acceptable';
    return 'Needs Work';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading translation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6">
          <h1 className="text-3xl font-bold mb-2">🌍 Translation Quality Dashboard</h1>
          <p className="text-blue-100">
            Monitor translation quality, cultural adaptation, and consistency across all
            languages
          </p>
        </div>

        {/* Summary Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Average Quality</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageQualityScore}%
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Languages</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalLanguages}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <span className="text-2xl">🌍</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Issues</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalIssues}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <span className="text-2xl">🚨</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Need Attention</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.languagesNeedingAttention.length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: '📊 Overview', icon: '📊' },
                { id: 'languages', label: '🌍 Languages', icon: '🌍' },
                { id: 'issues', label: '🚨 Issues', icon: '🚨' },
                { id: 'trends', label: '📈 Trends', icon: '📈' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quality Score Distribution */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">
                      Quality Score Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="language" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="qualityScore.overall" fill="#667eea" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Quality Categories Radar */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">
                      Average Quality by Category
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart
                        data={[
                          {
                            category: 'Completeness',
                            score:
                              data.reduce(
                                (sum, d) => sum + d.qualityScore.completeness,
                                0
                              ) / data.length,
                          },
                          {
                            category: 'Consistency',
                            score:
                              data.reduce(
                                (sum, d) => sum + d.qualityScore.consistency,
                                0
                              ) / data.length,
                          },
                          {
                            category: 'Cultural',
                            score:
                              data.reduce(
                                (sum, d) => sum + d.qualityScore.culturalAdaptation,
                                0
                              ) / data.length,
                          },
                          {
                            category: 'Technical',
                            score:
                              data.reduce(
                                (sum, d) => sum + d.qualityScore.technicalAccuracy,
                                0
                              ) / data.length,
                          },
                          {
                            category: 'Readability',
                            score:
                              data.reduce(
                                (sum, d) => sum + d.qualityScore.readability,
                                0
                              ) / data.length,
                          },
                        ]}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          dataKey="score"
                          stroke="#667eea"
                          fill="#667eea"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Language Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.map((lang: any) => // auto: implicit any (
                    <div
                      key={lang.language}
                      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedLanguage(lang.language)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-lg">
                          {lang.language.toUpperCase()}
                        </h3>
                        <span
                          className="px-2 py-1 rounded text-sm font-medium text-white"
                          style={{
                            backgroundColor: getQualityColor(lang.qualityScore.overall),
                          }}
                        >
                          {lang.qualityScore.overall}%
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Completeness:</span>
                          <span>{lang.qualityScore.completeness}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cultural:</span>
                          <span>{lang.qualityScore.culturalAdaptation}%</span>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-between text-xs text-gray-500">
                        <span>
                          {lang.culturalIssues + lang.consistencyIssues} issues
                        </span>
                        <span>Updated: {lang.lastUpdated}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages Tab */}
            {activeTab === 'languages' && (
              <div className="space-y-6">
                {data.map((lang: any) => // auto: implicit any (
                  <div key={lang.language} className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-medium">
                        {lang.language.toUpperCase()}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Overall:</span>
                        <span
                          className="px-3 py-1 rounded-full text-white font-medium"
                          style={{
                            backgroundColor: getQualityColor(lang.qualityScore.overall),
                          }}
                        >
                          {lang.qualityScore.overall}% -{' '}
                          {getQualityLabel(lang.qualityScore.overall)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      {Object.entries(lang.qualityScore)
                        .filter(([key]) => key !== 'overall')
                        .map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div
                              className="text-2xl font-bold"
                              style={{ color: getQualityColor(value) }}
                            >
                              {value}%
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                          </div>
                        ))}
                    </div>

                    {lang.recommendations.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
                        <h4 className="font-medium text-blue-800 mb-2">
                          Recommendations:
                        </h4>
                        <ul className="list-disc list-inside text-blue-700 text-sm">
                          {lang.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === 'issues' && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-red-800 mb-4">
                    🚨 Critical Issues
                  </h3>
                  {data.filter((d: any) => // auto: implicit any d.qualityScore.overall < 70).length === 0 ? (
                    <p className="text-green-600">✅ No critical issues detected!</p>
                  ) : (
                    <div className="space-y-2">
                      {data
                        .filter((d: any) => // auto: implicit any d.qualityScore.overall < 70)
                        .map((lang: any) => // auto: implicit any (
                          <div
                            key={lang.language}
                            className="bg-white p-3 rounded border-l-4 border-red-400"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {lang.language.toUpperCase()}
                              </span>
                              <span className="text-red-600">
                                {lang.qualityScore.overall}% quality
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-orange-800 mb-4">
                    ⚠️ Cultural Issues
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data
                      .filter((d: any) => // auto: implicit any d.culturalIssues > 0)
                      .map((lang: any) => // auto: implicit any (
                        <div
                          key={lang.language}
                          className="bg-white p-3 rounded border-l-4 border-orange-400"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {lang.language.toUpperCase()}
                            </span>
                            <span className="text-orange-600">
                              {lang.culturalIssues} issues
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">
                    📋 Consistency Issues
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data
                      .filter((d: any) => // auto: implicit any d.consistencyIssues > 0)
                      .map((lang: any) => // auto: implicit any (
                        <div
                          key={lang.language}
                          className="bg-white p-3 rounded border-l-4 border-blue-400"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {lang.language.toUpperCase()}
                            </span>
                            <span className="text-blue-600">
                              {lang.consistencyIssues} issues
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">📈 Quality Trends</h3>
                  <p className="text-gray-600 mb-4">
                    Track quality improvements over time
                  </p>

                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={[
                        { month: 'Jan', quality: 85 },
                        { month: 'Feb', quality: 87 },
                        { month: 'Mar', quality: 89 },
                        { month: 'Apr', quality: 91 },
                        { month: 'May', quality: 93 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[80, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="quality"
                        stroke="#667eea"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-4">🎯 Most Improved Languages</h4>
                    <div className="space-y-2">
                      {['es', 'fr', 'de'].map(lang => (
                        <div
                          key={lang}
                          className="flex justify-between items-center p-2 bg-white rounded"
                        >
                          <span className="font-medium">{lang.toUpperCase()}</span>
                          <span className="text-green-600">+5%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-4">📊 Recent Activity</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Translations updated:</span>
                        <span className="font-medium">47</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Issues resolved:</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality improved:</span>
                        <span className="font-medium text-green-600">+3.2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={loadDashboardData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationDashboard;
