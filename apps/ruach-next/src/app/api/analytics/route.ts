import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

/**
 * Analytics API Route
 *
 * Provides aggregated analytics data for the dashboard.
 * Supports various metrics and time ranges.
 *
 * Query Parameters:
 * - metric: views | likes | downloads | enrollments | completions | all
 * - range: 7d | 30d | 90d | 1y | all
 * - contentType: media | courses | events | all
 */

interface AnalyticsQuery {
  metric?: string;
  range?: string;
  contentType?: string;
}

interface MetricData {
  label: string;
  value: number;
  change?: number; // Percentage change from previous period
  trend?: 'up' | 'down' | 'stable';
}

interface TimeSeriesData {
  date: string;
  value: number;
}

interface ContentPerformance {
  id: string;
  title: string;
  type: string;
  views: number;
  likes: number;
  engagement: number;
}

interface AnalyticsResponse {
  overview?: {
    totalViews: MetricData;
    totalLikes: MetricData;
    totalDownloads: MetricData;
    activeUsers: MetricData;
    avgEngagement: MetricData;
  };
  timeSeries?: {
    views: TimeSeriesData[];
    likes: TimeSeriesData[];
    users: TimeSeriesData[];
  };
  topContent?: ContentPerformance[];
  demographics?: {
    byCountry: { country: string; count: number }[];
    byDevice: { device: string; count: number }[];
  };
}

// Helper to calculate date range
function getDateRange(range: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setFullYear(2020, 0, 1); // All time
  }

  return { start, end };
}

// Helper to generate mock time series data
function generateTimeSeriesData(range: string, baseValue: number): TimeSeriesData[] {
  const { start, end } = getDateRange(range);
  const data: TimeSeriesData[] = [];
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const variance = Math.random() * 0.3 - 0.15; // ±15% variance
    const value = Math.floor(baseValue * (1 + variance));

    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, value),
    });
  }

  return data;
}

// Helper to calculate metric with trend
function calculateMetric(current: number, previous: number): MetricData {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

  return {
    label: '',
    value: current,
    change: Math.round(change * 10) / 10,
    trend: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') || 'all';
    const range = searchParams.get('range') || '30d';
    const contentType = searchParams.get('contentType') || 'all';

    // In production, these would come from your database
    // For now, we'll generate realistic mock data

    const response: AnalyticsResponse = {};

    // Overview metrics
    if (metric === 'all' || metric === 'overview') {
      response.overview = {
        totalViews: calculateMetric(125430, 118250),
        totalLikes: calculateMetric(8920, 8450),
        totalDownloads: calculateMetric(3240, 3100),
        activeUsers: calculateMetric(2840, 2650),
        avgEngagement: calculateMetric(68.5, 65.2),
      };
    }

    // Time series data
    if (metric === 'all' || metric === 'timeSeries') {
      response.timeSeries = {
        views: generateTimeSeriesData(range, 4200),
        likes: generateTimeSeriesData(range, 290),
        users: generateTimeSeriesData(range, 850),
      };
    }

    // Top performing content
    if (metric === 'all' || metric === 'topContent') {
      response.topContent = [
        {
          id: '1',
          title: 'Understanding the Holy Spirit',
          type: 'media',
          views: 12450,
          likes: 890,
          engagement: 85.3,
        },
        {
          id: '2',
          title: 'End Times Prophecy Series',
          type: 'course',
          views: 9820,
          likes: 720,
          engagement: 78.5,
        },
        {
          id: '3',
          title: 'Deliverance Ministry Training',
          type: 'course',
          views: 8340,
          likes: 650,
          engagement: 72.1,
        },
        {
          id: '4',
          title: 'Testimony: Freedom from Addiction',
          type: 'media',
          views: 7920,
          likes: 580,
          engagement: 68.9,
        },
        {
          id: '5',
          title: 'Healing Prayer Workshop',
          type: 'event',
          views: 6450,
          likes: 420,
          engagement: 64.2,
        },
      ];
    }

    // Demographics
    if (metric === 'all' || metric === 'demographics') {
      response.demographics = {
        byCountry: [
          { country: 'United States', count: 8420 },
          { country: 'Brazil', count: 3240 },
          { country: 'Nigeria', count: 2890 },
          { country: 'United Kingdom', count: 2340 },
          { country: 'Canada', count: 1850 },
          { country: 'Australia', count: 1420 },
          { country: 'South Africa', count: 1120 },
          { country: 'Philippines', count: 980 },
        ],
        byDevice: [
          { device: 'Mobile', count: 12340 },
          { device: 'Desktop', count: 8920 },
          { device: 'Tablet', count: 3240 },
        ],
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
