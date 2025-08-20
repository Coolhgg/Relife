import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, Users, Mail, BarChart3 } from 'lucide-react';

interface CohortData {
  cohort: string;
  size: number;
  week0: number;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week8: number;
  week12: number;
}

interface CohortAnalysisProps {
  className?: string;
}

export function CohortAnalysis({ className }: CohortAnalysisProps) {
  const [metric, setMetric] = useState<'retention' | 'engagement' | 'conversion'>(
    'retention'
  );
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  // Mock cohort data - in a real app, this would come from your analytics service
  const cohortData: CohortData[] = [
    {
      cohort: '2024 Week 30',
      size: 1247,
      week0: 100,
      week1: 78.2,
      week2: 65.8,
      week3: 58.4,
      week4: 52.1,
      week8: 41.3,
      week12: 35.7,
    },
    {
      cohort: '2024 Week 29',
      size: 1156,
      week0: 100,
      week1: 81.3,
      week2: 69.2,
      week3: 61.7,
      week4: 55.8,
      week8: 44.2,
      week12: 38.9,
    },
    {
      cohort: '2024 Week 28',
      size: 987,
      week0: 100,
      week1: 75.6,
      week2: 62.4,
      week3: 54.9,
      week4: 48.3,
      week8: 37.8,
      week12: 31.2,
    },
    {
      cohort: '2024 Week 27',
      size: 1398,
      week0: 100,
      week1: 83.7,
      week2: 71.2,
      week3: 64.8,
      week4: 58.9,
      week8: 47.1,
      week12: 42.3,
    },
    {
      cohort: '2024 Week 26',
      size: 1204,
      week0: 100,
      week1: 79.8,
      week2: 66.3,
      week3: 58.7,
      week4: 51.4,
      week8: 40.6,
      week12: 34.8,
    },
    {
      cohort: '2024 Week 25',
      size: 892,
      week0: 100,
      week1: 76.4,
      week2: 63.1,
      week3: 55.2,
      week4: 47.9,
      week8: 36.4,
      week12: 29.7,
    },
  ];

  const getRetentionColor = (value: number): string => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 50) return 'bg-yellow-500';
    if (value >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRetentionOpacity = (value: number): string => {
    if (value >= 70) return 'opacity-100';
    if (value >= 50) return 'opacity-80';
    if (value >= 30) return 'opacity-60';
    return 'opacity-40';
  };

  const periods = [
    'Week 0',
    'Week 1',
    'Week 2',
    'Week 3',
    'Week 4',
    'Week 8',
    'Week 12',
  ];
  const periodKeys: (keyof CohortData)[] = [
    'week0',
    'week1',
    'week2',
    'week3',
    'week4',
    'week8',
    'week12',
  ];

  // Calculate averages
  const averages = periodKeys.map(key => {
    const sum = cohortData.reduce((acc, cohort) => acc + cohort[key], 0);
    return sum / cohortData.length;
  });

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cohort Analysis
            </CardTitle>
            <CardDescription>
              Track user retention and engagement patterns over time
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={metric} onValueChange={(value: any) => setMetric(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retention">Retention</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="conversion">Conversion</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={timeframe}
              onValueChange={(value: any) => setTimeframe(value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{cohortData.length}</div>
            <div className="text-sm text-gray-600">Cohorts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(averages[4])}%
            </div>
            <div className="text-sm text-gray-600">4-Week Retention</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(averages[5])}%
            </div>
            <div className="text-sm text-gray-600">8-Week Retention</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {cohortData.reduce((sum, c) => sum + c.size, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
        </div>

        {/* Cohort Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Cohort</th>
                <th className="text-center p-2 font-medium">Size</th>
                {periods.map((period, _index) => (
                  <th key={period} className="text-center p-2 font-medium">
                    {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortData.map(cohort => (
                <tr key={cohort.cohort} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{cohort.cohort}</td>
                  <td className="p-2 text-center">
                    <Badge variant="secondary">{cohort.size.toLocaleString()}</Badge>
                  </td>
                  {periodKeys.map((key, index) => (
                    <td key={key} className="p-2 text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div
                              className={`
                              relative inline-flex items-center justify-center w-12 h-8 rounded text-white text-xs font-medium
                              ${getRetentionColor(cohort[key])} ${getRetentionOpacity(cohort[key])}
                            `}
                            >
                              {cohort[key].toFixed(1)}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {cohort[key].toFixed(1)}% retention in {periods[index]}
                            </p>
                            <p>
                              {Math.round((cohort[key] / 100) * cohort.size)} active
                              users
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  ))}
                </tr>
              ))}
              {/* Average row */}
              <tr className="border-b-2 border-gray-300 bg-gray-50 font-medium">
                <td className="p-2">Average</td>
                <td className="p-2 text-center">
                  <Badge variant="outline">
                    {Math.round(
                      cohortData.reduce((sum, c) => sum + c.size, 0) / cohortData.length
                    ).toLocaleString()}
                  </Badge>
                </td>
                {averages.map((avg, index) => (
                  <td key={index} className="p-2 text-center">
                    <div
                      className={`
                      relative inline-flex items-center justify-center w-12 h-8 rounded text-white text-xs font-bold
                      ${getRetentionColor(avg)} border-2 border-gray-600
                    `}
                    >
                      {avg.toFixed(1)}%
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Insights */}
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-gray-900">Key Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900">Strong Week 1 Retention</div>
                <div className="text-blue-700">
                  Average 78.9% users return after first week
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
              <Users className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-green-900">
                  Healthy Long-term Retention
                </div>
                <div className="text-green-700">
                  35.4% of users stay active after 12 weeks
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
              <Mail className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-900">
                  Week 2-4 Critical Period
                </div>
                <div className="text-yellow-700">
                  Focus email campaigns on weeks 2-4 for maximum impact
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
              <BarChart3 className="h-4 w-4 text-purple-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-purple-900">
                  Cohort Performance Variance
                </div>
                <div className="text-purple-700">
                  Recent cohorts show 12% better retention rates
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
