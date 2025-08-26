import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SleepData {
  date: string;
  quality: number;
  duration: number;
  efficiency: number;
}

interface SleepQualityChartProps {
  data: SleepData[];
  compact?: boolean;
}

const SleepQualityChart: React.FC<SleepQualityChartProps> = ({
  data,
  compact = false,
}) => {
  // Transform data for chart
  const chartData = data.map(day => ({
    day: new Date(day.date).toLocaleDateString('en', { weekday: 'short' }),
    quality: day.quality,
    duration: day.duration,
    efficiency: day.efficiency,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quality: <span className="font-medium text-green-600">{data.quality}%</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Duration: <span className="font-medium">{data.duration}h</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Efficiency: <span className="font-medium">{data.efficiency}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (compact) {
    return (
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <Bar
              dataKey="quality"
              fill="currentColor"
              className="text-theme-success-400"
              radius={[1, 1, 0, 0]}
            />
            <Tooltip content={<CustomTooltip />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
            className="text-theme-text-600"
          />
          <YAxis tick={{ fontSize: 12 }} className="text-theme-text-600" />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="quality"
            fill="currentColor"
            className="text-theme-success-500"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SleepQualityChart;
