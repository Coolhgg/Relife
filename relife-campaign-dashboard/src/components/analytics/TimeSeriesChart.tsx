
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TimeSeriesDataPoint {
  date: string;
  opens: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  title: string;
  metric: 'opens' | 'clicks' | 'conversions' | 'revenue';
  timeframe: '7d' | '30d' | '90d' | '1y';
  className?: string;
}

const metricConfig = {
  opens: {
    label: 'Email Opens',
    color: 'rgb(59, 130, 246)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    format: (_value: number) => value.toLocaleString(),
  },
  clicks: {
    label: 'Email Clicks',
    color: 'rgb(16, 185, 129)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    format: (_value: number) => value.toLocaleString(),
  },
  conversions: {
    label: 'Conversions',
    color: 'rgb(139, 69, 19)',
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    format: (_value: number) => value.toLocaleString(),
  },
  revenue: {
    label: 'Revenue',
    color: 'rgb(217, 119, 6)',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    format: (_value: number) => `$${value.toLocaleString()}`,
  },
};

export function TimeSeriesChart({
  data,
  _title,
  _metric,
  _timeframe,
  _className,
}: TimeSeriesChartProps) {
  const config = metricConfig[metric];

  const chartData = {
    labels: data.map(point => {
      const date = new Date(point.date);
      if (timeframe === '7d') {
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
      } else if (timeframe === '30d') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeframe === '90d') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
    }),
    datasets: [
      {
        label: config.label,
        data: data.map(point => point[metric]),
        borderColor: config.color,
        backgroundColor: config.backgroundColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: config.color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: config.color,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (_context: any) {
            return `${config.label}: ${config.format(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          callback: function (_value: any) {
            return config.format(value);
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const latestValue = data[data.length - 1]?.[metric] || 0;
  const previousValue = data[data.length - 2]?.[metric] || 0;
  const change = latestValue - previousValue;
  const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: config.color }}>
              {config.format(latestValue)}
            </div>
            <div
              className={`text-sm flex items-center gap-1 ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <span>{isPositive ? '↗' : '↘'}</span>
              <span>{Math.abs(changePercent).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px]">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

// Generate mock time series data
export function generateMockTimeSeriesData(
  _timeframe: '7d' | '30d' | '90d' | '1y'
): TimeSeriesDataPoint[] {
  const days =
    timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
  const data: TimeSeriesDataPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Generate realistic data with some randomness and trends
    const baseOpens = 800 + Math.sin(i * 0.1) * 200 + Math.random() * 300;
    const baseClicks = baseOpens * (0.08 + Math.random() * 0.05);
    const baseConversions = baseClicks * (0.15 + Math.random() * 0.1);
    const baseRevenue = baseConversions * (80 + Math.random() * 40);

    data.push({
      date: date.toISOString(),
      opens: Math.round(baseOpens),
      clicks: Math.round(baseClicks),
      conversions: Math.round(baseConversions),
      revenue: Math.round(baseRevenue),
    });
  }

  return data;
}
