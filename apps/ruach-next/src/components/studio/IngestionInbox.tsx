'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Version {
  versionId: string;
  sourceId: string;
  contentType: 'scripture' | 'canon' | 'library';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reviewing';
  progress: number;
  qaMetrics?: {
    totalWorks?: number;
    totalVerses?: number;
    validationPassed?: boolean;
    reviewStatus?: string;
  };
  createdAt: string;
  completedAt?: string;
}

export default function IngestionInbox({ locale }: { locale: string }) {
  const [versions, setVerses] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    contentType: '',
  });

  useEffect(() => {
    fetchVersions();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchVersions, 5000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchVersions = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.set('status', filters.status);
      if (filters.contentType) queryParams.set('contentType', filters.contentType);

      const response = await fetch(`/api/ingestion/versions?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setVerses(data.versions || []);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      reviewing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getContentTypeIcon = (contentType: string) => {
    const icons = {
      scripture: '📖',
      canon: '📚',
      library: '📗',
    };
    return icons[contentType as keyof typeof icons] || '📄';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ruachGold"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading versions...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header with Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ingestion Inbox</h2>
          <Link
            href={`/${locale}/studio/ingestion/upload`}
            className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium text-sm"
          >
            + New Upload
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="reviewing">Reviewing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filters.contentType}
            onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">All Types</option>
            <option value="scripture">Scripture</option>
            <option value="canon">Canon</option>
            <option value="library">Library</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Metrics
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {versions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-4">📭</div>
                  <p>No ingestion versions found</p>
                  <Link
                    href={`/${locale}/studio/ingestion/upload`}
                    className="inline-block mt-4 px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                  >
                    Upload your first file
                  </Link>
                </td>
              </tr>
            ) : (
              versions.map((version) => (
                <tr
                  key={version.versionId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {version.versionId}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {version.sourceId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {getContentTypeIcon(version.contentType)}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {version.contentType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(version.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-ruachGold h-2 rounded-full transition-all"
                          style={{ width: `${version.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {version.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {version.qaMetrics?.totalWorks && (
                      <div>{version.qaMetrics.totalWorks} works</div>
                    )}
                    {version.qaMetrics?.totalVerses && (
                      <div>{version.qaMetrics.totalVerses.toLocaleString()} verses</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {version.status === 'reviewing' && (
                      <Link
                        href={`/${locale}/studio/ingestion/review/${version.versionId}`}
                        className="text-ruachGold hover:underline"
                      >
                        Review
                      </Link>
                    )}
                    {version.status === 'completed' && (
                      <span className="text-green-600 dark:text-green-400">✅ Complete</span>
                    )}
                    {version.status === 'failed' && (
                      <span className="text-red-600 dark:text-red-400">❌ Failed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
