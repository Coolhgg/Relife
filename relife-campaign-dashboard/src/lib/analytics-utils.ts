interface TimeSeriesDataPoint {
  date: string;
  opens: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

// Generate mock time series data
export function generateMockTimeSeriesData(
  timeframe: '7d' | '30d' | '90d' | '1y'
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