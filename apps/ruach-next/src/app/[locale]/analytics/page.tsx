"use client";

import { useEffect, useState, useCallback } from 'react';
import MetricCard from '@/components/analytics/MetricCard';
import LineChart from '@/components/analytics/LineChart';
import BarChart from '@/components/analytics/BarChart';
import PieChart from '@/components/analytics/PieChart';

interface TimeSeriesData {
  date: string;
  value: number;
}

interface AnalyticsData {
  overview?: {
    totalViews: { value: number; change?: number; trend?: 'up' | 'down' | 'stable' };
    totalLikes: { value: number; change?: number; trend?: 'up' | 'down' | 'stable' };
    totalDownloads: { value: number; change?: number; trend?: 'up' | 'down' | 'stable' };
    activeUsers: { value: number; change?: number; trend?: 'up' | 'down' | 'stable' };
    avgEngagement: { value: number; change?: number; trend?: 'up' | 'down' | 'stable' };
  };
  timeSeries?: {
    views: TimeSeriesData[];
    likes: TimeSeriesData[];
    users: TimeSeriesData[];
  };
  topContent?: Array<{
    id: string;
    title: string;
    type: string;
    views: number;
    likes: number;
    engagement: number;
  }>;
  demographics?: {
    byCountry: Array<{ country: string; count: number }>;
    byDevice: Array<{ device: string; count: number }>;
  };
}

/**
 * Analytics Dashboard Page
 *
 * Displays comprehensive analytics with visualizations:
 * - Overview metrics (views, likes, downloads, users, engagement)
 * - Time series charts (trends over time)
 * - Top performing content
 * - Demographics (country, device breakdown)
 *
 * Features:
 * - Date range selector
 * - Export data functionality
 * - Real-time updates
 * - Responsive design
 */
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics?metric=all&range=${range}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportData = async (format: 'json' | 'csv') => {
    if (!data) return;

    try {
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Simple CSV export for top content
        if (!data.topContent) return;

        const headers = ['Title', 'Type', 'Views', 'Likes', 'Engagement'];
        const rows = data.topContent.map((item) => [
          item.title,
          item.type,
          item.views,
          item.likes,
          item.engagement,
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black transition hover:bg-amber-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Track your content performance and user engagement
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Date range selector */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-neutral-600"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>

          {/* Export buttons */}
          <button
            onClick={() => exportData('json')}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-neutral-600 dark:hover:bg-neutral-700"
          >
            Export JSON
          </button>

          <button
            onClick={() => exportData('csv')}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-neutral-600 dark:hover:bg-neutral-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Overview metrics */}
      {data?.overview && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <MetricCard
            title="Total Views"
            value={data.overview.totalViews.value}
            change={data.overview.totalViews.change}
            trend={data.overview.totalViews.trend}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />

          <MetricCard
            title="Total Likes"
            value={data.overview.totalLikes.value}
            change={data.overview.totalLikes.change}
            trend={data.overview.totalLikes.trend}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />

          <MetricCard
            title="Downloads"
            value={data.overview.totalDownloads.value}
            change={data.overview.totalDownloads.change}
            trend={data.overview.totalDownloads.trend}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
          />

          <MetricCard
            title="Active Users"
            value={data.overview.activeUsers.value}
            change={data.overview.activeUsers.change}
            trend={data.overview.activeUsers.trend}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />

          <MetricCard
            title="Avg Engagement"
            value={`${data.overview.avgEngagement.value}%`}
            change={data.overview.avgEngagement.change}
            trend={data.overview.avgEngagement.trend}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>
      )}

      {/* Time series charts */}
      {data?.timeSeries && (
        <div className="grid gap-6 lg:grid-cols-2">
          <LineChart data={data.timeSeries.views} label="Views Over Time" showDots />
          <LineChart data={data.timeSeries.likes} label="Likes Over Time" color="#3b82f6" />
        </div>
      )}

      {/* Top content and demographics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top content */}
        {data?.topContent && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Top Performing Content
            </h3>

            <div className="space-y-4">
              {data.topContent.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-neutral-200 p-3 transition hover:border-amber-500 dark:border-neutral-800 dark:hover:border-amber-500"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-lg font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    #{i + 1}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                      {item.title}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                      {item.type} • {item.views.toLocaleString()} views • {item.likes.toLocaleString()} likes
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {item.engagement}%
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-500">
                      engagement
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Device distribution */}
        {data?.demographics?.byDevice && (
          <PieChart
            data={data.demographics.byDevice.map((d) => ({
              label: d.device,
              value: d.count,
            }))}
            title="Users by Device"
          />
        )}
      </div>

      {/* Geographic distribution */}
      {data?.demographics?.byCountry && (
        <BarChart
          data={data.demographics.byCountry.map((d) => ({
            label: d.country,
            value: d.count,
          }))}
          title="Users by Country"
          horizontal
        />
      )}
    </div>
  );
}
